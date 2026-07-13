# Kings_Herald

A Discord bot that plays the role of a medieval herald — announcing user titles, chronicling channel activity, and proclaiming popular posts.

> **What's changed lately?** [UPDATELOG.md](UPDATELOG.md) chronicles every change by date, generated from git history (`npm run updatelog` to refresh).

> **New contributor?** Start with [CONTRIBUTING.md](CONTRIBUTING.md) — it's a zero-to-running-locally walkthrough (install Node, clone the repo, create your own dev Discord application, populate `.env`, run, make a change, open a PR). The rest of this README is the maintainer-facing reference: how the bot is structured, how to add commands, and how the AWS infra works.

## How it works

Kings_Herald is a Node.js process that connects to Discord's gateway using [discord.js](https://discord.js.org/) and a bot token. It responds to two gateway events and runs one scheduled job:

1. **`interactionCreate`** — slash-command invocations (`/ping`, `/whois`, ...). The bot immediately defers the reply (Discord requires an acknowledgment within 3 seconds; several commands scan history for longer) and routes to the handler in `commands/prompts/` or `commands/passive/preview/`.
2. **`messageReactionAdd`** — every reaction on a message the bot can see. When a non-bot message hits 25 total reactions, the herald replies with a celebratory proclamation and pins it (`commands/passive/celebrate.js`).
3. **Weekly recap** — every Sunday at noon Eastern the herald posts in `#general` (falling back to the guild's system channel, then the topmost channel it can post in) celebrating the week's three most-reacted posts (linked, with their authors pinged) plus a running points leaderboard. Points come from three independent scales: 5/3/1 for the podium posts, 5/3/1 for the most messages sent, plus 1 point per 10 total reactions received across the week. Points persist in DynamoDB (`commands/passive/weeklyRecap.js`, `src/pointsStore.js`).

`src/index.js` is the entry point. On startup it:

- Reads every `.js` file in `./commands/prompts/` **and** `./commands/passive/preview/` and `require`s each into a `commands` object keyed by filename (`commands/prompts/ping.js` → `/ping`). Passive behaviors in `commands/passive/` are wired into client events and schedules directly; `commands/retired/` is not loaded.
- Logs in with `DISCORD_BOT_TOKEN` from a local `.env` file.
- **Registers the slash commands with every guild it's in** (and any it later joins), built from each command's exported metadata. Registration is guild-scoped, so changes appear in Discord immediately after a restart — no propagation delay.
- Dispatches interactions by registry lookup: `commands[name].run(interaction, commands)`. There is no hand-written dispatch chain — a command file is routable the moment it exists, and `/help` generates its listing from the same metadata.

### Passive vs prompt commands

The bot has two distinct command styles, kept in separate folders:

- **Prompt commands** (`commands/prompts/`) are *pull*: a human explicitly invokes `/<name>` and the bot replies. They are auto-loaded by filename, registered with Discord, and dispatched from `src/index.js` — drop in a file, done. Everything in the [command table](#current-commands) below is one of these.
- **Passive behaviors** (`commands/passive/`) are *push*: nobody types anything — the bot acts on its own in response to a gateway event or a schedule. Two exist today: `celebrate.js` (fires when a message crosses the reaction threshold) and `weeklyRecap.js` (the Sunday-noon recap). These are **not** auto-loaded; each is `require`d and wired to a specific client event or schedule by hand in `src/index.js`.

Rule of thumb: if a human triggers it with `/`, it's a prompt command; if the bot decides to act on its own, it's a passive behavior.

**Preview commands** (`commands/passive/preview/`) bridge the two: a manual `/` trigger that fires a *scheduled* passive behavior on demand, so you can see its output without waiting for the schedule. Each scheduled passive behavior gets one, named to match. Today that's `recap.js` — `/recap` previews `weeklyRecap` in the current channel without awarding points. They dispatch exactly like prompt commands but live beside the behavior they preview and set `hidden: true`, which **excludes them from Discord registration entirely** — nobody sees them in the picker, including admins — and keeps them out of the generated `/help`. To manually trigger one, call its exported runner directly from a test script or the Node REPL. (Event-driven passives like `celebrate` aren't scheduled, so they have no preview.)

### Current commands

| Command | What it does |
| --- | --- |
| `/ping` | Health check — replies "Pong!". |
| `/whois <member>` | Announces a member's titles (roles) in herald style. The member is picked from Discord's user selector. |
| `/nobility` | Lists everyone with weekly-recap points, top to bottom, with the noble title their points have earned (a new rank every 5 points from 5 up — see `flavor_text/nobilityRanks.js` for the ladder). |
| `/reactions [member]` | Scans the past month of messages and reports the member's most-used reaction emojis (defaults to whoever ran it). |
| `/activity` | Scans the past 30 days of the current channel and reports top posters, repliers, reactors, and most-reacted-to. |
| `/complain <grievance>` | Files the grievance verbatim as a GitHub issue in the repo (titled `Request from <tag> on <YYYY-MM-DD>`) and replies with a link. |
| `/help` | Lists the available commands in the herald's voice. |

One [preview command](#passive-vs-prompt-commands) exists (`/recap`, for the weekly recap) but is not registered with Discord — it is not visible in the picker for anyone. The weekly recap still fires on its Sunday cron schedule regardless.

Commands that aren't currently in use live in `commands/retired/` for reference. They are not loaded at runtime.

## Adding a new command

One step: create a file at `commands/prompts/<name>.js`. The filename (minus `.js`) becomes the slash-command name, the loader registers it with Discord on the next startup, and `/help` lists it from its metadata — **no dispatcher edit, no help edit, no manual registration.** (Automatic, non-`/` behaviors go in `commands/passive/` instead and are wired up directly in `src/index.js`.)

Every command module exports the same shape:

```js
// commands/prompts/greet.js
const { ApplicationCommandOptionType } = require('discord.js');

const greet = async function (interaction, commands) {
    const member = interaction.options.getMember('member') || interaction.member;
    await interaction.editReply(`Well met, ${member.displayName}!`);
};

module.exports = {
    description: 'Offer a courtly greeting',   // shown in Discord's picker and /help (max 100 chars)
    category: 'UTILITY',                       // /help group: NOBLE ANNOUNCEMENTS | ROYAL CHRONICLES | UTILITY
    // hidden: true,                           // excludes from Discord registration entirely
    options: [                                 // slash-command arguments (optional)
        {
            name: 'member',
            description: 'Whom to greet',
            type: ApplicationCommandOptionType.User,  // .String, .Integer, .Boolean, ...
            required: false,
        },
    ],
    run: greet,
};
```

Conventions the dispatcher establishes:

- `run` receives `(interaction, commands)` — `commands` is the loaded registry, which most commands ignore (`/help` uses it to generate its scroll).
- The dispatcher has **already called `deferReply()`** before `run` executes, so the 3-second acknowledgment deadline is handled. Send your first response with `interaction.editReply(...)` and any additional messages with `interaction.followUp(...)`.
- Read arguments from typed options (`interaction.options.getMember('member')`, `.getString('grievance')`, ...) — there is no string parsing.
- The loader skips any module without a `run` function and logs an error, so a malformed file can't break dispatch. If `run` throws, the dispatcher catches it and apologizes in character.
- Command names must be Discord-valid: lowercase letters, digits, `-`, `_`.

**Adding a preview for a scheduled passive behavior:** if you add a new scheduled behavior in `commands/passive/`, give it a matching preview command in `commands/passive/preview/<name>.js` — same module shape, calling the behavior's exported runner with `persist: false`, and set `hidden: true` so it is excluded from Discord registration. See `commands/passive/preview/recap.js` for the pattern.

### Style notes

- Keep responses in the herald's medieval voice for consistency.
- Do not use emojis in bot output. Plain Markdown formatting (`**bold**`, `*italics*`) is fine.
- Log what the command is doing to `console.log` — those logs are how you'll debug in production.
- Bulky flavor text lives in `flavor_text/` — one function per set (e.g. `celebrationTemplates(adj, author)`, `royalAdjectives()`, `rankTitles()`). Commands pull from it via `const flavor = require('../../flavor_text')` (or require a single file directly) instead of inlining large string arrays.

## Running locally

You have two ways to try changes without touching the live bot, both using a **separate "dev" Discord application** in a private test server:

1. **Run it on your machine** (this section) — fastest inner loop; `node src/index.js` with a dev token in `.env`. No AWS needed.
2. **Deploy to the beta stack** — push to `develop` and CI deploys the on-demand beta environment; scale it up to test in the cloud exactly as prod runs. See [Environments](#environments-production-and-beta).

Either way, create the dev bot once as below; local dev reads its token from `.env`, beta reads the same token from SSM (`/kings-herald-beta/discord-token`). Because the dev bot is a different application only in your test server, it never responds alongside prod.

### Prerequisites

- Node.js 18 or newer.
- A Discord application + bot user. Create one at <https://discord.com/developers/applications>, then:
  - Under **Bot**, copy the token.
  - Enable the privileged intents and invite the bot per the [Discord access reference](#discord-access-reference) below. If you invited the bot before slash commands existed, re-run the invite URL with both scopes — no need to kick it first.

### Discord access reference

The single source of truth for everything the bot needs from Discord. Three separate kinds of access, configured in different places:

**OAuth scopes** (chosen in the invite URL — OAuth2 → URL Generator):

| Scope | Why |
| --- | --- |
| `bot` | Adds the bot user to the server. Without it, the bot never appears in the member list. |
| `applications.commands` | Lets the bot register slash commands in the server. Without it, `/` commands never appear in the picker. |

**Privileged gateway intents** (toggled in the developer portal under Bot — these are app-wide, not per-server):

| Intent | Why |
| --- | --- |
| Message Content | The history-scanning features (`/activity`, `/reactions`, weekly recap) read message text and reactions. |
| Server Members | Member lookups and display names (`/whois`, recap author names). |
| Presence | Currently unused by the code, but enabled historically; safe to leave on. |

Missing intents fail loudly: the bot exits with `Used disallowed intents` at startup.

**Bot permissions** (chosen in the invite URL; can also be fixed later via a server role):

| Permission | Used by |
| --- | --- |
| View Channels | Everything. |
| Send Messages | Every reply and proclamation. |
| Read Message History | `/activity`, `/reactions`, weekly recap scans. |
| Embed Links | The weekly recap's rich embed (without this the embed silently fails to render). |
| Manage Messages | Pinning celebrated posts (`celebrate.js`). |

Add Reactions is **not** currently needed — nothing in the code adds reactions.

Ready-made invite URLs (`93184` encodes exactly the five permissions above):

**Production bot:**
```
https://discord.com/oauth2/authorize?client_id=759480089016270879&scope=bot+applications.commands&permissions=93184
```

**Dev bot:**
```
https://discord.com/oauth2/authorize?client_id=1525947821746946139&scope=bot+applications.commands&permissions=93184
```

Missing permissions fail quietly (no embed, failed pin, silent bot), so if a feature half-works, check this table first.

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
GITHUB_TOKEN=github_pat_xxxxxxxxxxxxxxxxxxxxxxxx
```

`DISCORD_BOT_TOKEN` is required. `GITHUB_TOKEN` is required for the `/complain` command — a fine-grained personal access token scoped to **Issues: write** on `blondesean/Kings_Herald` (issues are authored by whoever owns the token). The remaining variables are optional and set automatically in production by the CDK stack:

- `GITHUB_REPO` — the `owner/repo` to file complaints into. Defaults to `blondesean/Kings_Herald`.
- `POINTS_TABLE_NAME` — the DynamoDB table name. If unset (the default locally), the recap still runs and posts the top 3, but the leaderboard is skipped — so you can develop without AWS.
- `AWS_REGION` — set this (plus AWS credentials) only if you want to exercise the DynamoDB path locally.

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

You should see `King's <bot-name> is online.` followed by `Registered N slash commands in "<server>"` in the console. Type `/ping` in any channel the bot can see and it should reply `Pong!`.

### Troubleshooting

- **Slash commands don't appear in the picker** — the bot was invited without the `applications.commands` scope. Re-run the OAuth2 invite URL with both `bot` and `applications.commands` checked. Also confirm the console showed the `Registered N slash commands` line — registration happens on startup.
- **Commands appear but fail or hang** — make sure the **Message Content Intent** is enabled in the developer portal (the history-scanning commands need it) and the bot has Read Messages + Send Messages permissions in the channel.
- **`Used disallowed intents` on startup** — enable all three privileged intents (**Presence**, **Server Members**, **Message Content**) under Bot in the developer portal.
- **`/recap` is missing** — expected. Preview commands (`hidden: true`) are not registered with Discord at all; they don't appear in the picker for anyone. The cron still fires the recap on schedule.
- **`Invalid token`** — re-copy from the developer portal; tokens reset whenever you click "Reset Token".

## Hosting on AWS

### Architecture

The bot runs as a long-lived [Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html) task on ECS. The services involved:

- **ECR** — private container registry holding the bot image (built from the repo's `Dockerfile`).
- **ECS Fargate** — runs the bot task, 256 CPU / 512 MB, on **Fargate Spot** (~70% cheaper; a reclaimed task just restarts and reconnects). No load balancer; the bot has no inbound traffic, only an outbound WebSocket to Discord.
- **SSM Parameter Store** — `SecureString` parameters hold the secrets (Discord bot token + GitHub PAT for `/complain`). The task definition references them by name; the values never live in source or image.
- **DynamoDB** — a small on-demand table holds the weekly-recap points leaderboard, the bot's only persistent state, so standings survive restarts and redeploys.
- **CloudWatch Logs** — `console.log` output ships to the environment's log group.
- **VPC** — a public-only VPC (no NAT gateway); the task gets a public IP for outbound Discord traffic and no inbound rules.
- **AWS CDK** (TypeScript) — all of the above is defined in `infra/` and provisioned with `cdk deploy`.

This stack is deployed as **two environments** — an always-on `prod` and an on-demand `beta` — described in [Environments](#environments-production-and-beta) below. Every resource above is named per environment (`kings-herald` vs `kings-herald-beta`), so the two never collide and each bot reads its own secrets.

Day-to-day deploys are a single `cdk deploy <stack>` (or the GitHub Actions workflow: push to `develop` deploys beta, merge to `master` deploys prod).

### Environments: production and beta

The CDK app (`infra/bin/kings-herald.ts`) defines the same stack twice, from one parameterized class (`infra/lib/kings-herald-stack.ts`):

| | **Production** | **Beta** |
| --- | --- | --- |
| Stack name | `KingsHeraldStack` | `KingsHeraldStack-Beta` |
| Discord app | the real bot | a separate "dev" bot |
| Secrets (SSM) | `/kings-herald/*` | `/kings-herald-beta/*` |
| Resources | `kings-herald`, `/ecs/kings-herald` | `kings-herald-beta`, `/ecs/kings-herald-beta` |
| Running tasks | 1 (always on) | **0 by default** (on-demand) |
| Points table | RETAINed on destroy | DESTROYed on destroy |
| Deploy trigger | push/merge to `master` | push to `develop` |

The two stacks are fully isolated: different Discord applications, secrets, tables, log groups, and clusters. The **beta bot only lives in your test server** and reads its own token, so it never answers alongside prod.

The account-scoped GitHub OIDC provider and the `KingsHeraldGitHubDeploy` role are created **only** by the prod stack (the same role deploys both). So on a brand-new account, deploy prod first — see [Deploying](#deploying-with-cdk).

#### Promotion flow

```
feature branch ──PR──▶ develop ──(CI)──▶ beta stack   ← test here
                          │
                          merge
                          ▼
                        master ──(CI)──▶ prod stack    ← goes live
```

Push to `develop` and CI deploys the beta stack (new image + task definition) but leaves it at **0 running tasks**. To actually try it, scale beta up, test in your dev server, then scale it back down:

```powershell
# Start the beta bot (it comes online in your test server within ~1 min)
aws ecs update-service --cluster kings-herald-beta --service kings-herald-beta --desired-count 1 --region us-east-1

# ... test your change ...

# Stop it again so beta costs nothing at rest
aws ecs update-service --cluster kings-herald-beta --service kings-herald-beta --desired-count 0 --region us-east-1
```

> **Note:** a fresh `develop` deploy resets beta back to 0 tasks, so the order is always *deploy, then scale up*. When the change looks good in beta, merge `develop` into `master` and CI promotes it to prod automatically.

#### Seed the beta bot's secrets (one-time)

Beta reads its own SSM parameters. Create a second Discord application for the dev bot (see [Running locally](#prerequisites) for how), then seed its token and a GitHub PAT — same as prod but under the `-beta` prefix:

```powershell
aws ssm put-parameter --name /kings-herald-beta/discord-token --type SecureString --value "<dev-bot-token>" --region us-east-1
aws ssm put-parameter --name /kings-herald-beta/github-token  --type SecureString --value "<github-pat>"    --region us-east-1
```

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
├── lib/kings-herald-stack.ts    Stack: VPC, ECS, log group, SSM ref, DynamoDB table, OIDC role
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

The `/complain` command also needs a GitHub token in `SecureString` parameter `/kings-herald/github-token` — a fine-grained PAT with **Issues: write** on the repo. Seed it the same way (add `--overwrite` to update):

```powershell
aws ssm put-parameter `
  --name /kings-herald/github-token `
  --type SecureString `
  --value "<your-github-pat>" `
  --region us-east-1
```

#### Local deploy

The app now holds two stacks, so name the one you want (a bare `cdk deploy` would try both). Deploy **prod first** on a new account — it creates the shared deploy role that CI needs:

```powershell
cd infra
npx cdk deploy KingsHeraldStack        # prod
npx cdk deploy KingsHeraldStack-Beta   # beta (optional; CI handles it from develop)
```

Docker Desktop must be running — CDK builds the image locally before pushing to ECR.

Useful sibling commands (append a stack name to scope them; omit it and CDK acts on all stacks):

| Command | What it does |
| --- | --- |
| `npx cdk list` | List the stacks in the app. |
| `npx cdk diff KingsHeraldStack` | Show what would change without deploying. |
| `npx cdk synth KingsHeraldStack` | Print the CloudFormation template the app would deploy. |
| `npx cdk destroy KingsHeraldStack-Beta` | Tear down a stack. SSM parameters survive (created out-of-band). |

#### CI deploys via GitHub Actions

`.github/workflows/deploy.yml` picks a target stack from the branch and runs `npx cdk deploy <stack>`: push to `develop` deploys `KingsHeraldStack-Beta`, push/merge to `master` deploys `KingsHeraldStack`. It authenticates to AWS via **OIDC** (no long-lived access keys stored in GitHub secrets). The trust policy on the `KingsHeraldGitHubDeploy` IAM role only allows the workflow to assume the role when:

- The OIDC token comes from `repo:blondesean/Kings_Herald`, AND
- The ref is `refs/heads/master` **or** `refs/heads/develop`.

PRs from contributors don't deploy — only pushes to those two branches do. Manual re-deploys are available from the **Actions** tab via "Run workflow" (on the branch whose stack you want).

The `githubRepo` value in `infra/cdk.json` is what pins the trust policy. If you fork or rename the repo, update that value and re-run `npx cdk deploy KingsHeraldStack` locally to regenerate the role's trust policy before the next CI deploy will succeed.

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
npx cdk destroy KingsHeraldStack-Beta   # beta first (it doesn't own the deploy role)
npx cdk destroy KingsHeraldStack        # prod (also removes the shared OIDC role)
```

Then manually delete the SSM parameters if you want a fully clean teardown:

```powershell
aws ssm delete-parameter --name /kings-herald/discord-token --region us-east-1
aws ssm delete-parameter --name /kings-herald/github-token --region us-east-1
aws ssm delete-parameter --name /kings-herald-beta/discord-token --region us-east-1
aws ssm delete-parameter --name /kings-herald-beta/github-token --region us-east-1
```

The prod points table is `RETAIN`, so it survives `cdk destroy` — delete it by hand from the DynamoDB console if you truly want it gone. The beta table is `DESTROY` and goes with the stack.

### Cost estimate

Steady-state monthly cost for **production** (us-east-1):

| Resource | ~$/month |
| --- | --- |
| Fargate task (256 CPU / 512 MB, 24×7, **Spot**) | ~$3 |
| Public IPv4 address (hourly charge on the task's IP) | ~$3.60 |
| CloudWatch Logs (low volume + 1 mo retention) | <$1 |
| ECR storage (one image) | <$1 |
| Data transfer (Discord WebSocket out) | <$1 |
| DynamoDB (on-demand, weekly-recap leaderboard) | <$1 (well within free tier) |
| **Total** | **~$8** |

Fargate Spot cuts compute ~70% versus on-demand (was ~$8/mo). The **beta** stack adds effectively **$0** at rest — it runs 0 tasks by default, so it only bills for the minutes you scale it to 1 to test (plus a few cents of ECR storage for its image).

No NAT gateway (would be ~$32/mo), no load balancer (~$16/mo) — both intentionally avoided. The task uses a public subnet with a public IP and only outbound traffic to Discord, which is the cheapest viable shape; the public IPv4 charge is unavoidable without a far pricier NAT gateway. The bot's only persistent state is the weekly-recap points leaderboard, kept in a small DynamoDB table so it survives restarts and redeploys; everything else is stateless.

### Follow-ups (not blocking)

- **Tighten IAM.** The deploy IAM user and the GitHub OIDC role both have `AdministratorAccess` for first-deploy reliability. Long-term, scope them down to the services this stack actually touches (CloudFormation, ECR, ECS, IAM, EC2 for VPC, Logs, SSM).
- **Trim `package.json`.** The bot's `dependencies` block lists transitive deps (eslint, nodemon, ansi-styles, etc.) as direct deps, which bloats the image. A `npm prune` + reauthoring would shrink the image meaningfully.
- **Add a PR-check workflow.** A second GitHub Actions workflow that runs `npx cdk synth` on PRs would catch CDK errors before merge without deploying anything.

