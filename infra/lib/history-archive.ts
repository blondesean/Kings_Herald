import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as athena from 'aws-cdk-lib/aws-athena';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as firehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';

export interface HistoryArchiveProps {
  /** e.g. 'kings-herald'. Names the Glue database and Athena workgroup. */
  readonly resourceName: string;
  /** The bot's log group, whose lines are archived. */
  readonly logGroup: logs.ILogGroup;
  /** The game table, exported nightly. Needs point-in-time recovery on. */
  readonly table: dynamodb.ITable;
}

/*
 * Keeps the bot's history for good, queryable with Athena. Everything lands
 * in one versioned S3 bucket that survives the stack being deleted:
 *
 *   history/dt=YYYY-MM-DD/   the structured history records (src/historyLog.js):
 *                            points changes, daily snapshots, commands, clicks.
 *                            One JSON object per line.
 *   raw/dt=YYYY-MM-DD/       every log line the bot writes, as CloudWatch
 *                            batches (logEvents with timestamps), so nothing
 *                            is lost when the logs expire after a year.
 *   exports/<time>/          a nightly full export of the DynamoDB table.
 *   logs-export/             a one-off copy of the logs from before the
 *                            streams existed, made by a CloudWatch export task.
 *   athena-results/          Athena query output, expired after 30 days.
 *
 * Two CloudWatch subscription filters (the most a log group allows) feed two
 * Firehose streams, which unpack the CloudWatch format themselves (no
 * Lambda) and write gzip files every 15 minutes or so. The Glue database
 * describes the files as tables, with date partitions worked out from the
 * folder names (partition projection), so nothing has to register them.
 */
export class HistoryArchive extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: HistoryArchiveProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);
    const dbName = props.resourceName.replace(/-/g, '_');

    this.bucket = new s3.Bucket(this, 'Bucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [{ prefix: 'athena-results/', expiration: cdk.Duration.days(30) }],
    });
    const bucket = this.bucket;

    // Lets a one-off CloudWatch export task copy logs from before the stream
    // existed into logs-export/ (see "Query the history archive" in README.md).
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      principals: [new iam.ServicePrincipal('logs.amazonaws.com')],
      actions: ['s3:GetBucketAcl'],
      resources: [bucket.bucketArn],
      conditions: { StringEquals: { 'aws:SourceAccount': stack.account } },
    }));
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      principals: [new iam.ServicePrincipal('logs.amazonaws.com')],
      actions: ['s3:PutObject'],
      resources: [bucket.arnForObjects('logs-export/*')],
      conditions: { StringEquals: { 's3:x-amz-acl': 'bucket-owner-full-control', 'aws:SourceAccount': stack.account } },
    }));

    // ---- logs -> Firehose -> S3 ----------------------------------------------

    const firehoseRole = new iam.Role(this, 'FirehoseRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });
    bucket.grantReadWrite(firehoseRole);

    // Firehose unpacks CloudWatch's gzip batches itself. `extract` also drops
    // the CloudWatch envelope, leaving just each line's message.
    const stream = (name: string, prefix: string, extract: boolean) => {
      const processors: firehose.CfnDeliveryStream.ProcessorProperty[] = [
        { type: 'Decompression', parameters: [{ parameterName: 'CompressionFormat', parameterValue: 'GZIP' }] },
      ];
      if (extract) {
        processors.push({ type: 'CloudWatchLogProcessing', parameters: [{ parameterName: 'DataMessageExtraction', parameterValue: 'true' }] });
      }
      processors.push({ type: 'AppendDelimiterToRecord' });

      return new firehose.CfnDeliveryStream(this, `${name}Stream`, {
        deliveryStreamType: 'DirectPut',
        extendedS3DestinationConfiguration: {
          bucketArn: bucket.bucketArn,
          roleArn: firehoseRole.roleArn,
          prefix: `${prefix}/dt=!{timestamp:yyyy-MM-dd}/`,
          errorOutputPrefix: `errors/${prefix}/!{firehose:error-output-type}/dt=!{timestamp:yyyy-MM-dd}/`,
          bufferingHints: { intervalInSeconds: 900, sizeInMBs: 64 },
          compressionFormat: 'GZIP',
          processingConfiguration: { enabled: true, processors },
        },
      });
    };
    const historyStream = stream('History', 'history', true);
    const rawStream = stream('Raw', 'raw', false);

    const logsRole = new iam.Role(this, 'LogsToFirehoseRole', {
      assumedBy: new iam.ServicePrincipal('logs.amazonaws.com', {
        conditions: { StringLike: { 'aws:SourceArn': `arn:aws:logs:${stack.region}:${stack.account}:*` } },
      }),
    });
    logsRole.addToPolicy(new iam.PolicyStatement({
      actions: ['firehose:PutRecord', 'firehose:PutRecordBatch'],
      resources: [historyStream.attrArn, rawStream.attrArn],
    }));

    const subscribe = (name: string, target: firehose.CfnDeliveryStream, filterPattern: string) => {
      const filter = new logs.CfnSubscriptionFilter(this, `${name}Subscription`, {
        logGroupName: props.logGroup.logGroupName,
        destinationArn: target.attrArn,
        roleArn: logsRole.roleArn,
        filterPattern,
      });
      filter.node.addDependency(logsRole);
    };
    subscribe('History', historyStream, '{ $.history = 1 }');
    subscribe('Raw', rawStream, '');

    // ---- nightly DynamoDB export -------------------------------------------

    // EventBridge Scheduler calls the DynamoDB export API directly; no Lambda.
    // Each night's export lands under the time it was scheduled for.
    const exportRole = new iam.Role(this, 'ExportRole', {
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
    });
    exportRole.addToPolicy(new iam.PolicyStatement({
      actions: ['dynamodb:ExportTableToPointInTime'],
      resources: [props.table.tableArn],
    }));
    exportRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:AbortMultipartUpload', 's3:PutObjectAcl'],
      resources: [bucket.arnForObjects('exports/*')],
    }));

    new scheduler.CfnSchedule(this, 'NightlyExport', {
      description: 'Nightly full export of the game table to the history archive.',
      scheduleExpression: 'cron(30 4 * * ? *)', // 4:30 UTC, around half past midnight Eastern
      flexibleTimeWindow: { mode: 'OFF' },
      target: {
        arn: 'arn:aws:scheduler:::aws-sdk:dynamodb:exportTableToPointInTime',
        roleArn: exportRole.roleArn,
        input: JSON.stringify({
          TableArn: props.table.tableArn,
          S3Bucket: bucket.bucketName,
          S3Prefix: 'exports/<aws.scheduler.scheduled-time>',
          ExportFormat: 'DYNAMODB_JSON',
        }),
      },
    });

    // ---- Glue catalog + Athena ---------------------------------------------

    const database = new glue.CfnDatabase(this, 'Database', {
      catalogId: stack.account,
      databaseInput: { name: dbName, description: 'Kings_Herald history archive (see infra/lib/history-archive.ts).' },
    });

    const jsonSerde = {
      serializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
      parameters: { 'ignore.malformed.json': 'true' },
    };

    // A date-partitioned JSON table over `prefix`, with partitions projected
    // from the dt= folder names (no crawler, nothing to register).
    const dailyTable = (name: string, prefix: string, description: string, columns: glue.CfnTable.ColumnProperty[]) => {
      const location = `s3://${bucket.bucketName}/${prefix}/`;
      const table = new glue.CfnTable(this, `${name}Table`, {
        catalogId: stack.account,
        databaseName: dbName,
        tableInput: {
          name,
          description,
          tableType: 'EXTERNAL_TABLE',
          partitionKeys: [{ name: 'dt', type: 'string' }],
          parameters: {
            classification: 'json',
            'projection.enabled': 'true',
            'projection.dt.type': 'date',
            'projection.dt.format': 'yyyy-MM-dd',
            'projection.dt.range': '2026-10-01,NOW',
            'projection.dt.interval': '1',
            'projection.dt.interval.unit': 'DAYS',
            'storage.location.template': `${location}dt=\${dt}/`,
          },
          storageDescriptor: {
            location,
            columns,
            inputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
            outputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
            serdeInfo: jsonSerde,
          },
        },
      });
      table.addDependency(database);
      return table;
    };

    // Every field any history record carries; each row fills only its own.
    dailyTable('history', 'history', 'Structured history records from src/historyLog.js. Filter on type.', [
      { name: 'type', type: 'string', comment: 'points, snapshot, command, button, encounter or loot' },
      { name: 'v', type: 'int' },
      { name: 'at', type: 'string', comment: 'ISO time the record was written' },
      { name: 'guildid', type: 'string' },
      { name: 'userid', type: 'string' },
      { name: 'name', type: 'string', comment: 'display name at the time' },
      // points
      { name: 'delta', type: 'int' },
      { name: 'reason', type: 'string' },
      { name: 'item', type: 'string' },
      { name: 'achievement', type: 'string' },
      { name: 'listingid', type: 'string' },
      // snapshot
      { name: 'day', type: 'string' },
      { name: 'points', type: 'int' },
      { name: 'earned', type: 'int' },
      { name: 'fit', type: 'int' },
      { name: 'duelwins', type: 'int' },
      { name: 'duellosses', type: 'int' },
      { name: 'shopspent', type: 'int' },
      { name: 'voicehours', type: 'double' },
      { name: 'achievements', type: 'int' },
      { name: 'encounterwins', type: 'int' },
      { name: 'winseasy', type: 'int' },
      { name: 'winsmedium', type: 'int' },
      { name: 'winshard', type: 'int' },
      { name: 'winsextreme', type: 'int' },
      { name: 'winsmax', type: 'int' },
      { name: 'winsraid', type: 'int' },
      { name: 'killingblows', type: 'int' },
      { name: 'lootwon', type: 'int' },
      // encounter (and loot, linked by encounterid)
      { name: 'encounterid', type: 'string' },
      { name: 'rehearsal', type: 'boolean', comment: 'true for an /encounter_test run' },
      { name: 'boss', type: 'string' },
      { name: 'difficulty', type: 'string' },
      { name: 'bossfit', type: 'int' },
      { name: 'partyfit', type: 'int', comment: 'the party\'s plain fit' },
      { name: 'power', type: 'int', comment: 'fit after stance multipliers' },
      { name: 'chance', type: 'double', comment: 'win chance, 0 to 1' },
      { name: 'matchup', type: 'string' },
      { name: 'won', type: 'boolean' },
      { name: 'killerid', type: 'string' },
      {
        name: 'members',
        type: 'array<struct<userid:string,name:string,vote:string,stance:string,fit:int,power:int,gear:map<string,string>,injurydays:int>>',
        comment: 'UNNEST for one row per member; gear is slot to item id',
      },
      // loot
      { name: 'slot', type: 'string' },
      { name: 'price', type: 'int' },
      { name: 'choices', type: 'array<struct<userid:string,name:string,choice:string>>' },
      { name: 'rolls', type: 'string', comment: 'JSON: each round of rolls, re-rolls included' },
      { name: 'winnerid', type: 'string' },
      { name: 'result', type: 'string', comment: 'equipped, bagged, passed, skipped or failed' },
      // command / button
      { name: 'channelid', type: 'string' },
      { name: 'command', type: 'string' },
      { name: 'options', type: 'string', comment: 'JSON object of option name to value' },
      { name: 'customid', type: 'string' },
      { name: 'messageid', type: 'string' },
    ]);

    dailyTable('raw_logs', 'raw', 'Every bot log line, as CloudWatch batches. UNNEST(logevents) for one row per line.', [
      { name: 'messagetype', type: 'string' },
      { name: 'loggroup', type: 'string' },
      { name: 'logstream', type: 'string' },
      { name: 'logevents', type: 'array<struct<id:string,timestamp:bigint,message:string>>' },
    ]);

    // The nightly exports, all nights in one table. Each row's `item` is the
    // DynamoDB JSON of one table item, e.g. json_extract_scalar(item, '$.points.N');
    // "$path" tells the nights apart. Manifest files read as rows with no item.
    const exportsLocation = `s3://${bucket.bucketName}/exports/`;
    const exportsTable = new glue.CfnTable(this, 'GameStateTable', {
      catalogId: stack.account,
      databaseName: dbName,
      tableInput: {
        name: 'game_state',
        description: 'Nightly DynamoDB exports. Filter item IS NOT NULL; pick a night with "$path".',
        tableType: 'EXTERNAL_TABLE',
        parameters: { classification: 'json' },
        storageDescriptor: {
          location: exportsLocation,
          columns: [{ name: 'item', type: 'string', comment: 'DynamoDB JSON of one item' }],
          inputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
          outputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
          serdeInfo: jsonSerde,
          parameters: { 'recursive.input.dirs': 'true' },
        },
      },
    });
    exportsTable.addDependency(database);

    new athena.CfnWorkGroup(this, 'WorkGroup', {
      name: props.resourceName,
      description: 'Queries over the Kings_Herald history archive.',
      recursiveDeleteOption: true,
      workGroupConfiguration: {
        enforceWorkGroupConfiguration: true,
        bytesScannedCutoffPerQuery: 1024 * 1024 * 1024, // 1 GB: a runaway query can't cost more than half a cent
        resultConfiguration: { outputLocation: `s3://${bucket.bucketName}/athena-results/` },
      },
    });

    new cdk.CfnOutput(stack, 'ArchiveBucketName', { value: bucket.bucketName });
    new cdk.CfnOutput(stack, 'GlueDatabaseName', { value: dbName });
    new cdk.CfnOutput(stack, 'AthenaWorkGroup', { value: props.resourceName });
  }
}
