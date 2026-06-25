# Kings_Herald

A Discord bot that plays the role of a medieval herald — announcing user titles, chronicling channel activity, and proclaiming popular posts.

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

*To be written.* The bot will run as a long-lived Node process on AWS. Deployment details, environment management, and log routing will be documented here once the infrastructure is in place.
