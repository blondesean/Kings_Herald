# Contributing to Kings_Herald

Welcome! This guide walks you from zero through running your own dev copy of the bot, making a change, and getting it merged to production.

## What you'll end up with

By the end of this walkthrough:

- The repo cloned to your machine.
- A personal Discord application (your "dev bot") that only you use.
- A personal test server with your dev bot in it.
- The ability to make a code change, restart, and see it in Discord within seconds.

You will **not** be touching the live production bot or anyone else's server. Your dev bot is fully isolated.

## Why you need your own dev bot

A Discord bot's token is its identity — and Discord only allows one active session per token at a time. If two processes try to use the same token, Discord kicks whichever connected first.

That means you cannot run a local copy of the bot using the production token: you would either kick the live Fargate task off Discord (breaking the prod bot for everyone) or it would kick you off (so your local changes never reach Discord). Neither is useful.

The fix: every contributor creates their own Discord application with its own token, invited to their own personal test server. Same code, different identity.

## Prerequisites

Install these once:

- **Git for Windows** — <https://git-scm.com/download/win>
- **Node.js 20 LTS** — <https://nodejs.org> → click the "LTS" button → run the `.msi`. Includes `npm`.
- **A code editor** — VS Code is a safe default: <https://code.visualstudio.com>
- **A Discord account** — almost certainly already done.

Verify in a fresh PowerShell window:

```powershell
git --version
node --version    # expect v20.x.x
npm --version
```

If any of those say "command not found," reopen PowerShell — installers don't always update the PATH for already-open terminals.

## Step 1: Clone the repo

```powershell
cd C:\path\you\like
git clone https://github.com/blondesean/Kings_Herald.git
cd Kings_Herald
npm install
```

`npm install` takes a minute. It downloads `discord.js` and its dependencies into `node_modules/`.

## Step 2: Create your dev Discord application

1. Go to <https://discord.com/developers/applications>.
2. Click **New Application** (top right).
3. Name it distinctively, e.g. `Kings_Herald_Dev_<YourName>`. This is just the application name — the bot's display name in Discord is set separately.
4. Accept the developer terms.

This application is a separate thing from the production `Kings_Herald` app. It gets its own client ID, its own bot user, and its own token.

## Step 3: Configure the bot user

1. In the left sidebar of your new application, click **Bot**.
2. Optionally set a username (this is what shows in Discord; keep it identifiable, e.g. `HeraldDev<YourName>`).
3. Under **Privileged Gateway Intents**, enable all three:
   - **Message Content Intent**
   - **Server Members Intent**
   - **Presence Intent**
4. **Save Changes** at the bottom.
5. Under the **Token** section, click **Reset Token** → confirm → **copy the token immediately**. Discord only shows it once. If you lose it, just reset again — it costs nothing.

You'll paste this token into `.env` in Step 6.

## Step 4: Create a personal test server

You need a Discord server you control where your dev bot can live. If you don't have one:

1. In Discord, click the `+` icon at the bottom of your server list.
2. **Create My Own** → **For me and my friends**.
3. Name it (e.g. `<YourName>'s Bot Sandbox`). Skip the channel customization.

Even an empty server with just you in it is fine.

## Step 5: Invite your dev bot to your test server

1. Back in the developer portal for your dev application, go to **OAuth2** → **URL Generator**.
2. Under **Scopes**, tick **bot**.
3. Under **Bot Permissions**, tick: View Channels, Send Messages, Read Message History, Add Reactions, Manage Messages, Embed Links.
4. Copy the URL at the bottom of the page, paste it into a browser, choose your test server from Step 4, and authorize.

Your dev bot will now appear in your test server's member list (showing as offline until you start the code).

## Step 6: Populate `.env`

In your local repo:

```powershell
cp .env.example .env
```

Open `.env` in your editor and paste the dev token from Step 3:

```ini
DISCORD_BOT_TOKEN=<paste-your-dev-token-here>
```

Save. `.env` is listed in `.gitignore` and must never be committed — if you ever accidentally commit a token, reset it from the developer portal immediately because the old one is compromised.

## Step 7: Run the bot

```powershell
node src/index.js
```

You should see:

```
King's HeraldDev<YourName>#1234 is online.
```

In your test server, type `!ping` in any channel. The bot replies `Pong!`. You're live.

`Ctrl+C` to stop. For auto-restart whenever you save a file during dev:

```powershell
npx nodemon src/index.js
```

## Step 8: Make a change

1. Open `commands/ping.js`. Change the reply string from `"Pong!"` to something like `"Pong! (from my dev branch)"`.
2. Save the file.
3. Restart the bot (`Ctrl+C` then re-run, or let `nodemon` do it).
4. Type `!ping` in your test server again. You see your edited reply.

That's the inner loop: edit → restart → test. Repeat until happy.

## Step 9: Open a pull request

```powershell
git checkout -b your-feature-name
git add commands/ping.js
git commit -m "Make ping reply more cheerful"
git push -u origin your-feature-name
```

Then go to <https://github.com/blondesean/Kings_Herald>, click **Compare & pull request**, write a brief description, and submit.

## What happens after merge

When your PR is merged into `master`, GitHub Actions automatically:

1. Builds a Docker image from the repo (your change baked in).
2. Pushes it to AWS ECR.
3. Updates the Fargate task definition and restarts the running task.

Within ~3 minutes of merge, the change is live in the friends' production server. You don't do anything — the deploy is fully automated.

## Troubleshooting

- **Bot logs `King's ... is online` but doesn't respond to commands.** Message Content Intent isn't enabled in the developer portal, or the bot lacks View Channels / Send Messages perms in the channel you're testing in.
- **`!whois` or `!reactions` says it can't find users.** Server Members Intent isn't enabled.
- **`Invalid token` on startup.** Re-copy the token from the dev portal. Tokens change every time you click "Reset Token."
- **PR merged but production didn't change.** Look at the **Actions** tab in GitHub for a failed workflow. Most common cause is something in the build that didn't exist locally — fix it on a new branch and PR again.
- **Bot was responding to `!ping` and now isn't.** Make sure only one process is running with your dev token. Check Task Manager for stray `node.exe` processes, or run `Get-Process node` in PowerShell.

## Style notes (please read before your first PR)

- **No emojis anywhere.** Not in bot replies, not in `README`, not in code comments, not in commit messages. We have a no-emoji rule and reviewers will ask you to remove them.
- **Match the herald voice.** Bot replies should sound like a medieval town crier — "Hark!", "Forsooth!", "By my troth!", and so on. See `commands/whois.js` for the tone.
- **Log generously.** `console.log` what your command is doing. Those logs are what we use to debug production issues in CloudWatch.
- **One PR, one focused change.** Easier to review, easier to revert if it breaks something.

## Architecture in 30 seconds

For a quick mental model — full details in the main [README](README.md):

- **The bot** is a Node.js / `discord.js` process maintaining a WebSocket connection to Discord's gateway.
- **Commands** live in `commands/*.js`. The dispatcher in `src/index.js` routes `!commandname` to `commands.commandname`.
- **In production**, the bot runs as a single Fargate task on AWS ECS, with the token in SSM Parameter Store and logs in CloudWatch.
- **Infrastructure** is defined as AWS CDK code in `infra/` (TypeScript).
- **Deploys** happen automatically on merge to `master` via GitHub Actions, authenticated to AWS via OIDC.

Questions? Open an issue on the repo.
