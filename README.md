# Kings_Herald

A Discord bot that plays the role of a medieval herald — announcing user titles, chronicling channel activity, and proclaiming popular posts.

> **New contributor?** Start with [CONTRIBUTING.md](CONTRIBUTING.md) — it's a zero-to-running-locally walkthrough (install Node, clone the repo, create your own dev Discord application, populate `.env`, run, make a change, open a PR). The rest of this README is the maintainer-facing reference: how the bot is structured, how to add commands, and how the AWS infra works.

## How it works

Kings_Herald is a Node.js process that connects to Discord's gateway using [discord.js](https://discord.js.org/) and a bot token. It listens for two kinds of events:

1. **`messageCreate`** — every message in a channel the bot can see. If a message starts with the command prefix (`!`), the bot routes it to a handler in `commands/`.
2. **`messageReactionAdd`** — every reaction on a message the bot can see. When a non-bot message hits 10 total reactions, the herald replies with a celebratory proclamation and pins it.

`src/index.js` is the entry point. On startup it:

- Reads every `.js` file in `./commands/` and `require`s it into a `commands` object keyed by filename (`commands/ping.js` → `commands.ping`). Subdirectories like `commands/retired/` are skipped because they don't end in `.js`.
- Logs in with `DISCORD_BOT_TOKEN` from a local `.env` file.
- Dispatches incoming commands by name in a simple `if/else` chain.

### Current commands

| Command | What it does |
| --- | --- |
| `!ping` | Health check — replies "Pong!". |
| `!test` | Returns a fixed string; used to verify the dispatcher. |
| `!whois <name>` | Looks up a guild member (by username, nickname, or `@mention`) and announces their titles in herald style. |
| `!reactions <name>` | Scans the past month of messages and reports the user's most-used reaction emojis. |
| `!activity` | Scans the past 30 days of the current channel and reports top posters, repliers, reactors, and most-reacted-to. |
| `!help` | Lists the available commands in the herald's voice. |

Commands that aren't currently in use live in `commands/retired/` for reference. They are not loaded at runtime.

## Adding a new command

1. Create a new file at `commands/<name>.js`. The filename (minus `.js`) becomes the command keyword the user types after the `!` prefix.
2. Export a single function. Two signatures are supported by the existing dispatcher:
   - **No-arg, returns a string** (like `test.js`) — the dispatcher will `message.reply(commands.<name>())`.
   - **`(prefix, message)`** (like `whois.js`, `reactions.js`, `activity.js`) — the command owns the reply and can do async work, fetch members, scan history, etc.
3. Wire it into the dispatcher in `src/index.js` by adding a new `else if (command === "<name>")` branch.

Minimal template:

```js
// commands/greet.js
const greet = function (prefix, message) {
    const name = message.member?.displayName || message.author.username;
    message.reply(`Well met, ${name}!`);
};

module.exports = greet;
```

Then in `src/index.js`:

```js
} else if (command === "greet") {
    console.log("Executing Greet Command");
    commands.greet(prefix, origMessage);
}
```

### Style notes

- Keep responses in the herald's medieval voice for consistency.
- Do not use emojis in bot output. Plain Markdown formatting (`**bold**`, `*italics*`) is fine.
- Log what the command is doing to `console.log` — those logs are how you'll debug in production.

## Running locally

### Prerequisites

- Node.js 18 or newer.
- A Discord application + bot user. Create one at <https://discord.com/developers/applications>, then:
  - Under **Bot**, copy the token.
  - Enable the **Message Content**, **Server Members**, and **Presence** privileged intents.
  - Under **OAuth2 → URL Generator**, select the `bot` scope and the permissions the bot needs (Read Messages, Send Messages, Read Message History, Add Reactions, Manage Messages for pinning). Use the generated URL to invite the bot to a test server.

### Setup

```bash
git clone <this repo>
cd Kings_Herald
npm install
cp .env.example .env
```

### Configuring `.env`

The bot reads its secrets from a local `.env` file at the project root. `src/index.js` loads it on startup via [`dotenv`](https://www.npmjs.com/package/dotenv), so any variables defined there become available on `process.env`.

After `cp .env.example .env`, open `.env` and fill it in. The complete file should look like:

```ini
DISCORD_BOT_TOKEN=MTEzNDU2Nzg5MDEyMzQ1Njc4OQ.AbCdEf.your-real-token-here
```

Rules of the format:

- One `KEY=VALUE` per line. No spaces around the `=`.
- Don't wrap the value in quotes unless the value itself contains spaces.
- Lines starting with `#` are comments.

To get the token value:

1. Go to <https://discord.com/developers/applications> and open your app.
2. Click **Bot** in the sidebar.
3. Click **Reset Token** (or **Copy** if you already have one saved). Discord only shows the full token once — paste it into `.env` immediately.
4. Save `.env`.

**Important:** `.env` is listed in `.gitignore` and must never be committed. If you ever accidentally commit a real token, reset it from the developer portal right away — the old one is compromised the moment it lands in git history.

### Start the bot

```bash
node src/index.js
```

Or, for auto-reload during development:

```bash
npx nodemon src/index.js
```

You should see `King's <bot-name> is online.` in the console. Type `!ping` in any channel the bot can see and it should reply `Pong!`.

### Troubleshooting

- **Bot logs in but doesn't respond to commands** — make sure the **Message Content Intent** is enabled in the Discord developer portal *and* that the bot has Read Messages + Send Messages permissions in the channel.
- **`!whois` / `!reactions` can't find members** — the **Server Members Intent** must be enabled in the developer portal.
- **`Invalid token`** — re-copy from the developer portal; tokens reset whenever you click "Reset Token".

## Hosting on AWS

### Architecture

The bot runs as a single long-lived [Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html) task on ECS:

- **ECR** — private container registry holding the bot image (built from the repo's `Dockerfile`).
- **ECS Fargate** — runs one task, 256 CPU / 512 MB. No load balancer; the bot has no inbound traffic, only an outbound WebSocket to Discord.
- **SSM Parameter Store** — `SecureString` parameter `/kings-herald/discord-token` holds the bot token. The task definition references it; the token never lives in source or image.
- **CloudWatch Logs** — `console.log` output ships to log group `/ecs/kings-herald`.
- **AWS CDK** (TypeScript) — all of the above is defined in `infra/` and provisioned with `cdk deploy`.

Day-to-day deploys are a single `cdk deploy` (or a GitHub Actions workflow that runs the same command on push to `master`).

### Prerequisites: AWS account and CLI

You need an AWS account with billing set up, the AWS CLI v2 installed locally, and an IAM user with credentials you've configured into the CLI. This section walks through that.

#### 1. Install AWS CLI v2 (Windows)

Download and run the official MSI installer:

```powershell
# In PowerShell — runs the silent installer
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

Open a new terminal and confirm:

```powershell
aws --version
# expect: aws-cli/2.x.x Python/3.x.x Windows/...
```

#### 2. Enable MFA on the root user

Sign in to the AWS console as the root user, go to **My Security Credentials → Multi-factor authentication**, and add an MFA device. After this, **don't use the root user for day-to-day work** — only for billing changes and account recovery.

#### 3. Create an IAM user for deploys

In the console: **IAM → Users → Create user**.

- **User name:** `kings-herald-deploy` (or any name you like).
- **Provide user access to the AWS Management Console:** off (programmatic-only is fine for now).
- **Permissions:** attach the AWS-managed policy **`AdministratorAccess`**.

> **Why Admin?** CDK touches many services during a first deploy (CloudFormation, ECR, ECS, IAM, EC2 for VPC, Logs, SSM). Locking down to a least-privilege policy is the correct long-term move, but doing it before you've ever deployed will eat hours debugging "AccessDenied" errors. Start permissive, tighten later. This is tracked as a follow-up.

Create the user, then open it and go to **Security credentials → Access keys → Create access key**:

- **Use case:** "Command Line Interface (CLI)".
- Acknowledge the warning, click through to the access key page, and **copy both the Access Key ID and the Secret Access Key now** — Discord-style, AWS only shows the secret once.

#### 4. Configure the CLI

```powershell
aws configure
```

Answer the four prompts:

- **AWS Access Key ID:** *(paste from step 3)*
- **AWS Secret Access Key:** *(paste from step 3)*
- **Default region name:** `us-east-1`
- **Default output format:** `json`

This writes credentials to `%USERPROFILE%\.aws\credentials` and config to `%USERPROFILE%\.aws\config`. Keep both files out of git (they're outside the repo, so this is automatic — just don't copy-paste them in).

#### 5. Verify

```powershell
aws sts get-caller-identity
```

Expected shape:

```json
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/kings-herald-deploy"
}
```

If you see your account number and the `kings-herald-deploy` ARN, you're ready for the CDK phase.

#### 6. Set up a billing alert

Recommended even for hobby projects: **Billing → Billing preferences → enable "Receive Free Tier Usage Alerts" and "Receive Billing Alerts"**, then create a CloudWatch alarm on the `EstimatedCharges` metric (threshold $5 or whatever makes you nervous). The Fargate task this stack runs is cheap (~$10/mo), but a misconfiguration shouldn't be able to surprise you with a $400 bill.

### Deploying with CDK

The infrastructure is defined in `infra/` as an AWS CDK app (TypeScript). A `cdk deploy` builds the Docker image from the repo root, pushes it to ECR, and creates or updates the CloudFormation stack `KingsHeraldStack`.

#### Repo layout (`infra/`)

```
infra/
├── bin/kings-herald.ts          CDK app entrypoint
├── lib/kings-herald-stack.ts    Stack: VPC, ECS, log group, SSM ref, OIDC role
├── cdk.json                     CDK config (also pins the GitHub repo for the OIDC trust policy)
├── package.json                 CDK deps + CLI
└── tsconfig.json
```

#### One-time bootstrap

Required once per AWS account + region. Creates the `CDKToolkit` CloudFormation stack (S3 bucket and ECR repo for CDK assets, IAM roles).

```powershell
cd infra
npm install
npx cdk bootstrap
```

#### Seed the bot token in SSM

The stack references `SecureString` parameter `/kings-herald/discord-token`. CDK does **not** create or update this — the value never lives in source. Put it there once with the AWS CLI (add `--overwrite` to update):

```powershell
aws ssm put-parameter `
  --name /kings-herald/discord-token `
  --type SecureString `
  --value "<your-discord-bot-token>" `
  --region us-east-1
```

#### Local deploy

```powershell
cd infra
npx cdk deploy
```

Docker Desktop must be running — CDK builds the image locally before pushing to ECR.

Useful sibling commands:

| Command | What it does |
| --- | --- |
| `npx cdk diff` | Show what would change without deploying. |
| `npx cdk synth` | Print the CloudFormation template the app would deploy. |
| `npx cdk destroy` | Tear down the whole stack. The SSM parameter survives (created out-of-band). |

#### CI deploys via GitHub Actions

`.github/workflows/deploy.yml` runs `npx cdk deploy` on every push to `master`. It authenticates to AWS via **OIDC** (no long-lived access keys stored in GitHub secrets). The trust policy on the `KingsHeraldGitHubDeploy` IAM role only allows the workflow to assume the role when:

- The OIDC token comes from `repo:blondesean/Kings_Herald`, AND
- The ref is `refs/heads/master`.

PRs from contributors don't deploy — only the merge to `master` does. Manual re-deploys are available from the **Actions** tab via "Run workflow."

The `githubRepo` value in `infra/cdk.json` is what pins the trust policy. If you fork or rename the repo, update that value and re-run `npx cdk deploy` locally to regenerate the role's trust policy before the next CI deploy will succeed.

### Operations

#### Tail the live bot logs

```powershell
aws logs tail /ecs/kings-herald --follow --region us-east-1
```

#### Force the running task to restart (picks up a new SSM value, etc.)

```powershell
aws ecs update-service --cluster kings-herald --service kings-herald --force-new-deployment --region us-east-1
```

#### Rotate the bot token

1. **Discord Developer Portal** → your app → **Bot** → **Reset Token**, copy the new value.
2. Update local `.env` with the new token.
3. Overwrite the SSM parameter:
   ```powershell
   aws ssm put-parameter --name /kings-herald/discord-token --type SecureString --value "<new-token>" --overwrite --region us-east-1
   ```
4. Force-restart the ECS service (command above) so the new task picks up the new value at boot.

#### Tear it all down

```powershell
cd infra
npx cdk destroy
```

Then manually delete the SSM parameter if you want a fully clean teardown:

```powershell
aws ssm delete-parameter --name /kings-herald/discord-token --region us-east-1
```

### Cost estimate

Steady-state monthly cost for the running stack (us-east-1, on-demand prices):

| Resource | ~$/month |
| --- | --- |
| Fargate task (256 CPU / 512 MB, 24×7) | ~$8 |
| CloudWatch Logs (low volume + 1 mo retention) | <$1 |
| ECR storage (one image) | <$1 |
| Data transfer (Discord WebSocket out) | <$1 |
| **Total** | **~$10** |

No NAT gateway (would be ~$32/mo), no load balancer (~$16/mo) — both intentionally avoided. The Fargate task uses a public subnet with a public IP and only outbound traffic to Discord, which is the cheapest viable shape for a stateless bot.

### Follow-ups (not blocking)

- **Tighten IAM.** The deploy IAM user and the GitHub OIDC role both have `AdministratorAccess` for first-deploy reliability. Long-term, scope them down to the services this stack actually touches (CloudFormation, ECR, ECS, IAM, EC2 for VPC, Logs, SSM).
- **Trim `package.json`.** The bot's `dependencies` block lists transitive deps (eslint, nodemon, ansi-styles, etc.) as direct deps, which bloats the image. A `npm prune` + reauthoring would shrink the image meaningfully.
- **Add a PR-check workflow.** A second GitHub Actions workflow that runs `npx cdk synth` on PRs would catch CDK errors before merge without deploying anything.

