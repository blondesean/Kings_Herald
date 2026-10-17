# Kings_Herald

A Discord bot that plays the role of a medieval herald — announcing user titles, chronicling channel activity, and proclaiming popular posts.

> **What's changed lately?** [UPDATELOG.md](UPDATELOG.md) chronicles every change by date, generated from git history (`npm run updatelog` to refresh).

> **New contributor?** Start with [CONTRIBUTING.md](CONTRIBUTING.md) — it's a zero-to-running-locally walkthrough (install Node, clone the repo, create your own dev Discord application, populate `.env`, run, make a change, open a PR). The rest of this README is the maintainer-facing reference: how the bot is structured, how to add commands, and how the AWS infra works.

## How it works

Kings_Herald is a Node.js process that connects to Discord's gateway using [discord.js](https://discord.js.org/) and a bot token. It responds to two gateway events and runs several scheduled jobs:

1. **`interactionCreate`** — slash-command invocations (`/ping`, `/whois`, ...). The bot immediately defers the reply (Discord requires an acknowledgment within 3 seconds; several commands scan history for longer) and routes to the handler in `commands/prompts/` or `commands/passive/preview/`.
2. **`messageReactionAdd`** — every reaction on a message the bot can see. When a non-bot message hits 25 total reactions, the herald replies with a celebratory proclamation and pins it (`commands/passive/celebrate.js`).
3. **Weekly recap** — every Sunday at noon Eastern the herald posts in `#general` (falling back to the guild's system channel, then the topmost channel it can post in) celebrating the week's three most-reacted posts (linked, with their authors pinged), the top chatters, the members showered in the most favor, the most time in voice, and the top puzzle solvers, followed by a running points leaderboard of the top 15. Points come from five independent scales: 5/3/1 for the podium posts, 1 point per 10 distinct members who reacted to a member's posts across the week (unique reactors rather than raw reaction counts, and the author's own reactions don't count), 5/3/1 for the most messages sent, 5/3/1 for the most time in voice, and 5/3/1 for the most puzzle points earned that week. Each leaderboard line reads `(+X podium, +Y WoW)`: X is what this recap itself awarded, and Y is the week-over-week change in the member's total (their points now minus a snapshot taken at the end of the previous recap), so it also covers voice time, puzzle solves, duels, and manual adjustments. A short "A Whisper From the Court" aside at the bottom names the pair who spent the most time together in voice; it carries no points. Points persist in DynamoDB (`commands/passive/weeklyRecap.js`, `src/pointsStore.js`).
4. **Daily trivia** — once a day, at a random 15-minute-aligned moment inside the 9 AM-9 PM Eastern window shared with the daily puzzle and boss encounter below (placed so none of them overlap — see `src/dailyLineup.js`), the herald posts a general-knowledge trivia question with four answer buttons (A/B/C/D). Answering is a button click, not a reaction, so choices stay secret — each click gets an ephemeral reply only the clicker sees, and clicking again changes the recorded answer. Thirty minutes later it closes the question: whoever's final answer was correct earns 2 points, and anyone who answered wrong is lightly lambasted by name in the results post. Questions come from a no-repeat cycle over `flavor_text/triviaQuestions.js`, tracked in DynamoDB so a restart doesn't reset it. During Halloween season a factual round may instead draw from a spooky bank (`flavor_text/halloweenTriviaQuestions.js`) with a reskinned post: about a third of factual days in September, every factual day in October, and every day from October 21 through 31 (those last days skip the would-you-rather roll below). On about half of all days (rolled first, so this applies in September and early October too), the slot instead hosts a subjective round, a coin flip between two games. One is a "would you rather" round: a this-or-that question with two rows of buttons, where every member secretly picks what they'd choose and what they think the group will choose most (both are needed to count). The group's pick is whichever option got more choices; predicting it earns 2 points. A tie gives every full participant 1 point, fewer than two complete answers scores nothing, and afterward the herald reveals who picked what (`commands/passive/wouldYouRather.js`, `flavor_text/wouldYouRatherQuestions.js`). The other is a ranking round: the herald posts five things and a "Rank these" button, and each member ranks them privately by tapping their 1st pick, then 2nd, and so on in an ephemeral message (the last item is forced, so it is four taps; tapping again redoes it). The group's consensus is each item's average place; members are scored by how closely their ranking matches it, counted as the number of item pairs they order differently from the consensus (a pair the consensus can't separate costs everyone half). The closest ranking earns 5 points and the second closest 2, ties share a place (so a tie for closest leaves no second place), and it takes at least three finished rankings to score (`commands/passive/rankingRound.js`, `flavor_text/rankingQuestions.js`). Points persist the same way as the weekly recap (`commands/passive/trivia.js`).
5. **WoW Trivia Wednesdays** — every Wednesday at 9:00 PM Eastern, the herald fires a 5-question free-text WoW trivia session (see `/wow_trivia` above for the rules). Same game as the manual command, just on a fixed weekly schedule instead of an admin triggering it (`commands/passive/wowTrivia.js`).
6. **Voice chat points** — `voiceStateUpdate` events (not a schedule) drive this one: any non-bot member connected to a voice channel (other than the guild's AFK channel) earns points continuously, credited as sessions end or checkpoint rather than at recap time — Discord keeps no historical voice-presence record to scan later the way message history can be. The rate is (members in the channel - 1) points per hour, so time alone in a channel earns nothing, a pair earns 1 per hour, and a call of four earns 3 per hour; it is recalculated whenever someone joins, leaves, or switches channels. Real time in voice also feeds a weekly voice podium (5/3/1), and time shared by each pair of members is tallied for the recap's "Whisper" aside; both reset at the Sunday recap (`commands/passive/voiceTime.js`).
7. **Daily shop** — every day at noon Eastern, 9 AM Pacific, the herald opens a shop with 5 gear pieces, 1 title, 1 class and 1 race drawn at random from a catalog of WoW, RuneScape, Guild Wars and Final Fantasy names. Each item has 2 copies for the whole server, and the shop stays open until midnight Eastern, 9 PM Pacific, the last thing of the day: the herald announces the closing, pays out unsold discounts and the stock resets. Gear goes to your bag, and a class or race takes effect at once. A title is unique, with one copy in the shop: buying one while you already bear another asks you to confirm, and your old title goes back on the shelf. `/return_title` sends your title back after a confirmation (only while the shop is open). `/sell` lists a piece of gear from your bag for the next day's shop, which then shows a **Discounts** section (only when there is something in it) beside the usual stock: one copy of each listed piece at 25% off, bought with `/buy` before any full-price copy, and never by its own seller. A sale pays the seller exactly what the buyer paid (75% of the price), in the same DynamoDB transaction as the purchase. A piece still unsold when that shop closes pays the seller half its price and leaves the game; if a restart loses the closing timer, the next shop opening settles it instead. Listings live under their own `SELL#<guildId>` partition. Gear is priced by rarity: Common 10 points, Uncommon 15 to 20, Rare 25 to 30, Epic 35 to 45 and Legendary 50; titles, classes and races cost 10. The catalog is a hand-written fan list in `commands/passive/shopCatalog.js`, not real game data. Your character lives on your ledger item (`src/character.js`), and buying can lower your points, but that is fine, since the points only feed the nobility ladder.
8. **Daily boss encounter** — placed in the same shared window as trivia and the puzzle, without overlapping them. The herald teases an unnamed threat and announces its tier up front, rolled when the post goes up: Easy, Medium or Hard, a third of the time each (`OPEN_TIERS`; Extreme and Max exist but aren't rolled yet), so members can choose whether to answer. Members click **Join the party** (3 to 20 members; the boss scales with the party), and each is privately prompted to pick a stance: Aggressive fights at +15% fit, Balanced at their true fit, Defensive at -10%, Plunder at -20% (on a win, each Plunder member also gets a random piece of the tier's rarity that isn't among the boss drops, via `plunderFor`, announced in its own post before the loot rolls). A member whose bag holds finer gear than they wear also gets **Suit up in my best** / **Fight as I am dressed** buttons (default: as dressed); suiting up fights and records the battle with the finest owned piece per slot (`bestKit` in `src/character.js`) without touching their equipped gear, so a member can dress for roleplay and still fight at full strength. The join check uses that best kit. The battle starts when 20 have joined and chosen, or after an hour with everyone who joined; with fewer than 3 the threat passes with no battle and no injuries; anyone who chose no stance fights Balanced. The prompt is ephemeral, so no one sees another member's stance; the public post only marks each joiner as ready. A boss from the rolled tier is revealed in battle (`commands/passive/encounterBosses.js`). The result lists the party by name, title and class, and tallies the party's total fit, and its power (fit after stances); only totals are shown, so stances stay secret on a win, and the boss's power and the odds are never shown anywhere, to keep the foe a mystery. Boss fit is the sum of each slot's cheapest item of that tier's rarity, scaled by how much of a kit a party at that tier is assumed to have (Easy: three-quarters of the slots in Common; Medium: seven-eighths in Uncommon; Hard and up: a full kit), times the party size; the win chance is 80% at an even match, +5% per 10% over and -20% per 10% under (0% at 60%), so 100% at 140%; Easy and Medium have no cap, so a strong enough party is sure to win, while Hard, Extreme and Max are capped at 99%, 97% and 95%. A win names whoever lands the killing blow (weighted by stance-adjusted fit) and drops one piece of that tier's rarity per 2.5 members, rounded down (1 for a party of 3 or 4, 2 for 5, 8 for 20), each a different random piece; the party rolls for each separately with Need, Greed or Pass within an hour (each loot post has one "Roll for this loot" button that opens the choice privately; needers outrank greeders, ties re-roll, and Need only counts as an upgrade: a member who already owns something worth as much fit in that slot, worn or in their bag, is entered for Greed instead, and told why), and each winner gets theirs like a `/buy`. The result then lists who chose Need, Greed and Pass. A loss singles out two members, drawn from the whole party with weight 1 / (fit + 10), so the least geared are likeliest: a Balanced target sits out the next day, an Aggressive or Plunder one the next two, and a Defensive one fends the blow off unhurt, with a line saying so. Everyone else escapes unhurt. Injuries persist in DynamoDB. Two gear checks guard the party while it forms: a joiner whose fit alone, fighting Balanced, would give a party of their equals under a 10% chance is turned away, without being told the fit it takes (35 at Easy, 60 at Medium, 114 at Hard), and every 15 minutes the herald works out the party's odds from current gear and chosen stances, and below 75% posts a warning, without the odds, with a "Leave the party" button. A separate **Raid** tier holds the grandest lore bosses (the Lich King, Sauron, Calamity Ganon, the Elder Dragons, and more): no party cap, measured at the Epic threshold per entrant since a big raid brings less-geared members, dropping Legendary. It is defined in `encounterBosses.js` but not reachable yet — it isn't in the vote or the schedule. `/encounter_test [minutes] [party] [min] [difficulty]` rehearses one with no injuries or loot (`party` lowers the cap, `min` defaults to 1 so one tester can run it alone, and `difficulty` picks any tier, Extreme and Max included), and `npm run encounter-odds` prints the fairness tables (`commands/passive/encounter.js`, `flavor_text/encounterFlavor.js`).
9. **Daily birthday blessing** — every day at 9 AM Eastern the herald checks a private list (`BIRTHDAYS_FILE`, default `private/birthdays.csv`, `name,YYYY-MM-DD` per line, git-ignored and kept out of the Docker image). On a member's birthday they earn one point per year of age and the herald announces it without posting the birthdate. Each row can be a Discord user ID (the reliable choice) or a name, which matches a member's nickname, display name, username or global name, case-insensitively; each member gets at most one birthday award per day. `/birthdays` previews the check with no points (`commands/passive/birthdays.js`, `flavor_text/birthdayFlavor.js`).
10. **Daily puzzle** — a second daily game, scheduled in the same shared window as trivia and the encounter, placed so it doesn't overlap either. Half the days it is Connections; the other half it is a Word Ladder (below). The herald posts 24 words (a 3-wide grid) that secretly form six groups of four, and the whole channel plays as one team: a guess is four board words typed separated by commas (case-insensitive), the guild shares 3 wrong guesses, and each member can land only one correct guess per puzzle, so solving it takes several people. A correct guess reveals the category; a guess that is 3-of-4 right gets a gentler hint. Each member who solved a group earns 1 point, but only if the whole puzzle gets solved, and puzzle points also feed the recap's puzzle podium. The puzzle stays open for up to an hour and pings the "Puzzle People" role (`/signup puzzle`). Game state lives in memory only, so a restart mid-puzzle loses that day's game (`commands/puzzles/connections.js`, puzzle bank in `commands/puzzles/connectionsPuzzles.js`).

   **Word Ladder** takes the puzzle slot on half of all days. The herald announces a start word and a target of the same length (say COLD and WARM, 3 to 6 letters), and the channel builds a ladder between them: anyone types one word that changes exactly one letter of the last word on the ladder, every rung must be a real word not already used, and the target must be reached within the puzzle's own length, 4, 5 or 6 steps as the herald announces, the target counting as the last. As in Connections each member can lay only one rung, so a ladder needs several people. Words are judged against a bundled public-domain word list (ENABLE, `commands/puzzles/wordLadderWords.txt`), and the limit is exactly the length of the route in the puzzle bank, so there is no room for a wasted rung; the game also ends early if a rung makes the target unreachable in the steps left. Every message is checked: it must be a single word, of the right length, that is in the dictionary, and it must match the last rung in all but one letter. Chatter that fails the first three checks is ignored; real words that break the one-letter rule get a gentle reply and cost nothing. On a solve every member who laid a rung earns 1 point, the same all-or-nothing payout as Connections (feeding the puzzle podium too); otherwise the herald reveals one route and nobody scores. It uses the same hour-long window and "Puzzle People" ping, and its state also lives in memory only (`commands/puzzles/wordLadder.js`, helpers in `wordLadderGraph.js`, puzzle bank in `wordLadderPuzzles.js`).
11. **October Halloween treat** — every day at noon Eastern, but only in October, the herald draws one member at random and gifts them 5 points, announced in character with Halloween flair. The draw is uniform across every member who currently has at least 1 point and is still in the server (no weighting: 1 point is as likely as 200), and the same member can win more than once. The gift goes straight onto the running ledger, so it counts toward `/nobility` titles and the recap's WoW figure (`commands/passive/halloweenTreat.js`).

`src/index.js` is the entry point. On startup it:

- Reads every `.js` file in `./commands/prompts/` **and** `./commands/passive/preview/`, plus `./commands/puzzles/preview/`, and `require`s each into a `commands` object keyed by filename (`commands/prompts/ping.js` → `/ping`). Passive behaviors in `commands/passive/` and `commands/puzzles/` are wired into client events and schedules directly; `commands/retired/` is not loaded.
- Logs in with `DISCORD_BOT_TOKEN` from a local `.env` file.
- **Registers the slash commands with every guild it's in** (and any it later joins), built from each command's exported metadata. Registration is guild-scoped, so changes appear in Discord immediately after a restart — no propagation delay.
- Dispatches interactions by registry lookup: `commands[name].run(interaction, commands)`. There is no hand-written dispatch chain — a command file is routable the moment it exists, and `/help` generates its listing from the same metadata.

### Passive vs prompt commands

The bot has two distinct command styles, kept in separate folders:

- **Prompt commands** (`commands/prompts/`) are *pull*: a human explicitly invokes `/<name>` and the bot replies. They are auto-loaded by filename, registered with Discord, and dispatched from `src/index.js` — drop in a file, done. Everything in the [command table](#current-commands) below is one of these.
- **Passive behaviors** (`commands/passive/`) are *push*: nobody types anything — the bot acts on its own in response to a gateway event or a schedule. Six exist today: `celebrate.js` (fires when a message crosses the reaction threshold), `weeklyRecap.js` (the Sunday-noon recap), `trivia.js` (the daily randomized-time trivia round), `wowTrivia.js` (WoW Trivia Wednesdays), `voiceTime.js` (continuous points for time spent in voice channels), and `halloweenTreat.js` (the October daily treat). The daily Connections puzzle is the same kind of push behavior but lives in its own `commands/puzzles/` folder (`connections.js`, `wordLadder.js`, their puzzle banks, and a hangman word list that no game uses yet), with its own `preview/` folder. These are **not** auto-loaded; each is `require`d and wired to a specific client event or schedule by hand in `src/index.js`.

Rule of thumb: if a human triggers it with `/`, it's a prompt command; if the bot decides to act on its own, it's a passive behavior.

**Preview commands** (`commands/passive/preview/`) bridge the two: a manual `/` trigger that fires a *scheduled* passive behavior on demand, so you can see its output without waiting for the schedule. Each scheduled passive behavior gets one, named to match. Today that's `recap.js` (`/recap` previews `weeklyRecap` in the current channel without awarding points), `trivia.js` (`/trivia [seasonal] [subjective] [ranked]` fires a trivia round in the current channel without awarding points, with optional toggles to force the Halloween bank, a would-you-rather round, or a ranking round on or off), `harold_time.js` (`/harold_time` reports when today's trivia, puzzle or shop is armed to fire), `wow_trivia.js` (`/wow_trivia` fires a WoW trivia session in the current channel without awarding points), and `halloween_treat.js` (`/halloween_treat` rehearses the October draw without awarding points or pinging the winner), plus three in `commands/puzzles/preview/`: `connections.js` (`/connections` fires a puzzle in the current channel, no points, no role ping), `ladder.js` (`/ladder` does the same for a Word Ladder), and the same `harold_time.js` covers the puzzle too. They dispatch exactly like prompt commands but live beside the behavior they preview and set `adminOnly: true`, which sets `defaultMemberPermissions` on registration so **only members with the Manage Server permission see or can run them** (Discord enforces this — the interaction never reaches the bot for anyone else); `hidden: true` keeps them out of the generated `/help` on top of that. (Event-driven passives like `celebrate` aren't scheduled, so they have no preview.)

### Current commands

| Command | What it does |
| --- | --- |
| `/ping` | Health check — replies "Pong!". |
| `/whois <member>` | Announces a member's titles (roles) in herald style. The member is picked from Discord's user selector. |
| `/nobility` | Lists everyone with weekly-recap points, top to bottom, with the noble title their points have earned (ranks run from 5 up to 1900, with the gaps between rungs widening as you climb — see `flavor_text/nobilityRanks.js` for the ladder). Each entry also shows a fit score in brackets: the total price of the gear you have equipped (`(N points, fit F)`). |
| `/balance` | Checks your own point balance and current title. Ephemeral — only you see the reply. |
| `/tip <amount>` | Gives some of your points to the herald to show your appreciation. The points are spent for good. The herald thanks you publicly, more grandly for bigger tips, then tells his running total and how much you have given in all. Your first tip and 25 points given in all each earn an achievement. Admins can see every giver with `/balance_herald`, which only members with Manage Server can see and which replies privately. Tips live under their own `TIP#<guildId>` partition, so the herald never appears on `/nobility`. |
| `/shop` | Shows today's shop with prices and copies left (public). |
| `/buy <item>` | Buys an item from today's shop with points, using the exact name or the short one shown in `/shop`. |
| `/return_title` | Sends your title back to the shop after a confirmation, so someone else can buy it (only while the shop is open). Ephemeral. |
| `/bank` | Lists the gear in your bag that isn't equipped, by slot (ephemeral). |
| `/equip <item>` | Puts a piece of gear from your bag into its slot; the old item goes back to your bag. |
| `/sell <item>` | Sells a piece of gear from your bag (not one you're wearing) back to the merchant after a confirmation. It goes on sale in the next day's shop at 25% off; if it sells you get what the buyer paid, and if not you get half its price and it's gone. Ephemeral. |
| `/fence [item] [slot] [rarity]` | Buys any piece of gear in the catalog, in the shop today or not, for its price plus 50 points, once per Eastern day per member. Without `item` it browses: a paged list of all 406 pieces with their full prices, narrowed by `slot` and `rarity`. `item` autocompletes as you type, matching name, short name, slot or rarity. A private offer shows the price and what the piece does for your kit, and Yes buys it: it is equipped if the slot is empty and goes to the bag otherwise. Paying, granting the piece and marking the day (`fencedOn` on the ledger) are one conditional DynamoDB update, so two quick purchases can't both land. Gear only: titles, classes and races stay with the shop. The whole price, fee included, counts as shop spending. The purchase is announced in the channel without a ping; the rest is ephemeral (`commands/prompts/fence.js`). |
| `/achievements` | Lists your achievements, earned and not, with progress such as 7/10 (ephemeral). There are 32, each paying 5 points once: encounter wins, heroics, loot, 5 wins per boss tier, a win while outmatched and a win with a full party; 10 duel wins, 10 duel losses and a Death Roll win; 100 points earned in all, 100 fit, a full kit and a Legendary piece worn; a /sell that sells and a /trade completed; 10 Connections and 10 Word Ladders helped solve, and the final Connections group solved; 10 correct daily trivia and 10 correct WoW trivia answers; 5 would-you-rather majorities predicted; a weekly recap podium place; choosing a /pose, a class, a race and a title; and looking at this list. Games unlock them as they happen and announce it in the channel, and an hourly sweep (`src/achievements.js`) catches the rest, such as points earned from voice, posting one summary. Unlocking and paying is one DynamoDB transaction, so nothing pays twice. Progress lives under `ACH#<guildId>`. "Points earned" is `totalEarned` on the ledger, which only ever goes up, plus a one-time estimate of earlier earnings: points now, plus the price of everything owned, plus duel wagers lost. History from before achievements existed comes from the CloudWatch logs (the 30 days kept at the time) through `scripts/backfillAchievements.js`. |
| `/myths` | The court's all-time records (public): the mightiest encounter party by average power per member, meaning fit after stance multipliers, win or lose (kept under `party_average`; the older total-power `party` record is no longer shown); most duels won; longest week in voice; biggest shop spender; finest fit worn now; and the biggest duel wager won, with who was beaten. Duels, fit and spending are read live, and spending comes from a lifetime counter that `/buy` adds to. The party and voice records are saved as they happen under `MYTH#<guildId>`, by the encounter and by the weekly recap before it resets the week; a week still under way shows once it beats the record. Ties share the record. Shop spending and the voice record are backfilled from the logs by `scripts/backfillAchievements.js`. |
| `/trade <item> <player> <offer>` | Offers a piece of gear from your bag to another member for `offer`: either the name of a piece of gear in their bag, or a number of points. The herald checks both sides, then pings them with Accept and Decline buttons only they can use, for 5 minutes. On Accept both sides are checked again and the swap is one DynamoDB transaction; each piece is equipped if its new owner's slot is empty, otherwise it goes to their bag. Public. |
| `/pose <pose>` | Chooses the stick figure pose beside your `/flex` sheet from a list with autosuggest (13 poses, from standing and waving to archer, casting, flexing and flag bearer). Anyone can change it, for free. Ephemeral. |
| `/signup <summons>` | Toggles one of the herald's summons roles, picked from a list: `trivia` ("Hear Ye Trivia", the daily trivia round), `wow trivia` ("Those Buffed with Arcane Intellect", WoW Trivia Wednesdays), `puzzle` ("Puzzle People", the daily Connections or Word Ladder), `shop` ("shopaholics", the daily shop) or `encounter` ("Adventurers", the boss encounter). Choosing one again removes it, and `mine` lists which you hold. The role is created on first use (`src/triviaRole.js`, `src/wowTriviaRole.js`, `src/puzzleRole.js`, `src/shopRole.js`, `src/adventurerRole.js`). Ephemeral. |
| `/flex` | Shows your character sheet in a monospace box: name and title, race and class, the seven gear slots, and your fit score. |
| `/wardrobe` | The same sheet as `/flex`, but ephemeral — only you see it. |
| `/inspect <member>` | The same sheet as `/wardrobe`, for another member — only you see it. |
| `/reactions [member]` | Scans the past month of messages and reports the member's most-used reaction emojis (defaults to whoever ran it). |
| `/duel <opponent> <method> <wager>` | Challenges another member to a points wager, settled by Coin Flip, Rock Paper Scissors, Death Roll, or Fit Duel, once they accept via button. In a Fit Duel, each duelist with finer gear in their bag than they wear is privately asked, for 30 seconds, whether to suit up in their best (default: as dressed); the challenge post discloses up front each such duelist's best possible fit. Duel posts show fit scores only, never percentages (`commands/prompts/duel.js`). |
| `/duel_stats [member]` | Reports a member's `/duel` win/loss record and win rate (defaults to whoever ran it). |
| `/complain <grievance>` | Files the grievance verbatim as a GitHub issue in the repo (titled `Request from <tag> on <YYYY-MM-DD>`) and replies with a link. |
| `/help [topic]` | Lists the commands, grouped (Thy Character, Shop and Trading, Points and Glory, Duels, Summons, Utility) and generated from each command's metadata, then what the herald does each day. Admin-only commands appear only for members with Manage Server. `topic` shows a short guide instead: encounters, the shop, your character, achievements, myths, duels or earning points (`flavor_text/helpGuides.js`). Ephemeral. |

Nine [preview commands](#passive-vs-prompt-commands) exist (`/recap`, `/trivia [seasonal] [subjective] [ranked]`, `/harold_time`, `/wow_trivia [questions]`, `/connections`, `/ladder`, `/halloween_treat`, `/birthdays`, and `/shop_test`). All are registered with Discord but restricted to members with the Manage Server permission, so they're only visible to admins in the picker. The ones that fire a game (`/recap`, `/trivia`, `/wow_trivia`, `/connections`, `/ladder`, `/halloween_treat`) default to awarding no points when run manually — only the underlying schedules, firing on their own, pay out for real — while the two `_time` commands just report the armed fire time, visible only to whoever ran them. `/wow_trivia` runs a free-text WoW trivia session (ported from a classic WoW addon's question bank) — `questions` questions in a row (default 1, max 15), each won by whoever types the correct answer in chat first within 15 minutes (a correct answer moves the session on right away). Whoever wins the most questions is crowned champion and paid a flat 2 points at the end (ties share the crown, each paid in full, bots excluded from winning); no points change hands per question. Starting a session pings the `/wow_trivia_signup` role, same as the daily trivia pings its own.

A second `adminOnly` + `hidden` command lives directly in `commands/prompts/` rather than beside a passive behavior: `/point_adjust <member> <amount>` grants or deducts a member's ledger points by a set amount (positive to grant, negative to deduct), for correcting mistakes or rewarding things off the books. The visibility restriction works the same way. A third, `/patch_notes [count] [channel]`, announces the most recent commit subjects in the herald's voice; it reads them from `UPDATELOG.md` (regenerate it with `npm run updatelog` first), since the deployed image has no git history to read. Another, `/puppet <message>`, makes the herald say the message in the current channel as his own words; the admin's confirmation is ephemeral, so the herald's message is the only public trace. Member pings work, but @everyone, @here and role pings are suppressed, and each use is logged to CloudWatch and the history log (`commands/prompts/puppet.js`). Every adjustment — and every `/duel` result — is logged to CloudWatch for audit (see `commands/prompts/point_adjust.js` and `commands/prompts/duel.js`).

A fourth pair, `/herald_channel <scope> [channel]` and `/herald_channel_list`, controls where each *passive* behavior above posts its scheduled output — trivia, the puzzle, the shop, the encounter, the weekly recap, WoW Trivia Wednesdays, birthdays, and the Halloween treat each have their own `scope`, plus an `all` catch-all beneath them. Giving `channel` sets that scope's override; leaving it out resets it to its built-in default (usually `findAnnounceChannel`'s best-guess channel). This only ever changes the real scheduled post: a *prompt* always answers in the channel it was run in (so does a preview command, since it passes that channel along explicitly), and no admin command is needed for those — only a passive behavior has no "where it was asked" to fall back on. Overrides persist per guild in DynamoDB (`src/resolveChannel.js`, `src/pointsStore.js`).

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
    category: 'UTILITY',                       // /help group: CHARACTER | SHOP | GLORY | DUELS | SUMMONS | UTILITY
    // hidden: true,                           // excludes from the generated /help
    // adminOnly: true,                        // restricts to members with Manage Server
    // ephemeral: true,                        // reply is visible only to whoever ran it
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
- For suggestions as a member types, mark a String option `autocomplete: true` and export `autocomplete(interaction)`, which answers with `interaction.respond([{ name, value }])`, up to 25. It isn't deferred, so it must answer within 3 seconds (see `commands/prompts/fence.js`).

**Adding a preview for a scheduled passive behavior:** if you add a new scheduled behavior in `commands/passive/`, give it a matching preview command in `commands/passive/preview/<name>.js` — same module shape, calling the behavior's exported runner with `persist: false`, and set both `adminOnly: true` (restricts it to members with Manage Server) and `hidden: true` (keeps it out of `/help`). See `commands/passive/preview/recap.js` for the pattern.

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
| Message Content | The history-scanning features (`/reactions`, weekly recap) read message text and reactions. |
| Server Members | Member lookups and display names (`/whois`, recap author names, trivia participants). |
| Presence | Currently unused by the code, but enabled historically; safe to leave on. |

Missing intents fail loudly: the bot exits with `Used disallowed intents` at startup.

**Bot permissions** (chosen in the invite URL; can also be fixed later via a server role):

| Permission | Used by |
| --- | --- |
| View Channels | Everything. |
| Send Messages | Every reply and proclamation. |
| Read Message History | `/reactions`, weekly recap scans. |
| Embed Links | The weekly recap's and trivia's rich embeds (without this the embed silently fails to render). |
| Manage Messages | Pinning celebrated posts (`celebrate.js`). |
| Manage Roles | Creating and assigning the "Hear Ye Trivia", "Those Buffed with Arcane Intellect", "Puzzle People", "shopaholics" and "Adventurers" roles (`/signup`, `src/triviaRole.js`, `src/wowTriviaRole.js`, `src/puzzleRole.js`, `src/shopRole.js`, `src/adventurerRole.js`). |

Ready-made invite URLs (`268528640` encodes exactly the six permissions above):

**Production bot:**
```
https://discord.com/oauth2/authorize?client_id=759480089016270879&scope=bot+applications.commands&permissions=268528640
```

**Dev bot:**
```
https://discord.com/oauth2/authorize?client_id=1525947821746946139&scope=bot+applications.commands&permissions=268528640
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
- `TEST_GUILD_IDS` — comma-separated Discord guild IDs where `/duel` allows challenging yourself, for testing the whole accept/resolve flow solo. Not set by the CDK stack — leave it unset in production so self-duels stay blocked there.

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
- **`/recap` is missing** — it's `adminOnly: true`, so Discord only shows it to members with the Manage Server permission. If you have that permission and it's still missing, re-check the `Registered N slash commands` log line on startup; a stale registration from before this command existed won't self-heal until the next deploy/restart.
- **`Invalid token`** — re-copy from the developer portal; tokens reset whenever you click "Reset Token".

## Hosting on AWS

### Architecture

The bot runs as a long-lived [Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html) task on ECS. The services involved:

- **ECR** — private container registry holding the bot image (built from the repo's `Dockerfile`).
- **ECS Fargate** — runs the bot task, 256 CPU / 512 MB, on **Fargate Spot** (~70% cheaper; a reclaimed task just restarts and reconnects). No load balancer; the bot has no inbound traffic, only an outbound WebSocket to Discord.
- **SSM Parameter Store** — `SecureString` parameters hold the secrets (Discord bot token + GitHub PAT for `/complain`). The task definition references them by name; the values never live in source or image.
- **DynamoDB** — a small on-demand table holds the bot's only persistent state, so it survives restarts and redeploys. Several kinds of item share the table, all partitioned by `guildId`: a per-`(guildId, userId)` item holding `displayName`, `points` (the ledger), `duelWins`/`duelLosses`, the voice counters (`totalVoiceSeconds`, `totalWeightedVoiceSeconds`, `weeklyVoiceSeconds`), `weeklyPuzzlePoints`, and `pointsAtLastRecap` (the snapshot behind the recap's WoW figure); one item per resolved `/duel` under a synthetic `DUEL#<timestamp>#...` sort key; one item per member pair under `PAIR#<idA>#<idB>` (weekly shared voice time); and three small no-repeat-cycle items (`TRIVIA#STATE`, `CONNECTIONS#STATE`, `WYR#STATE`, `RANK#STATE`, and `LADDER#STATE`) under their own synthetic partitions. Synthetic keys can never be mistaken for a real user since Discord IDs are purely numeric. See `src/pointsStore.js`.
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

#### Query the history log

The logs are kept for a year (`infra/lib/kings-herald-stack.ts`), and the bot writes its long-term history into them as one JSON object per line (`src/historyLog.js`), so it can be charted or used to backfill a feature later:

- **`points`**: every change to a member's points, written after the DynamoDB write lands, with `delta` and `reason` (`trivia`, `duel`, `recap`, `voice`, `connections`, `ladder`, `shop`, `shop_discount`, `fence`, `sale`, `unsold_refund`, `trade`, `tip`, `achievement`, `adjust`, and so on) plus details such as `item` or `achievement`.
- **`snapshot`**: each member's standing at 11:55 PM Eastern every day (`src/snapshots.js`): points, points earned in all, fit, duel wins and losses, shop spending, lifetime voice hours, achievements earned, and encounter wins (in all and per tier), killing blows and loot won.
- **`encounter`** and **`loot`**: every boss fight, with the boss, odds, outcome and killer, and each member's stance, fit, power, gear and injury (encounters before the tier was rolled also carry each member's difficulty vote); then every loot roll with each member's need, greed or pass, the rolls and the winner, linked by `encounterId`.

In the CloudWatch console, Logs Insights on `/ecs/kings-herald` reads the fields directly. One member's fit and points by day:

```
filter history = 1 and type = "snapshot" and name = "Arctrooper66"
| fields day, points, fit, duelWins, shopSpent
| sort day asc
```

Where a guild's points came from:

```
filter history = 1 and type = "points"
| stats sum(delta) as total by reason
```

Every slash command and button click is recorded too (`type = "command"` with its options, `type = "button"` with the button's id), so the court's interactions are preserved.

#### Query the history archive (Athena)

The logs expire after a year, so prod also keeps everything in S3 for good (`infra/lib/history-archive.ts`). It's a versioned bucket that is kept even if the stack is deleted, and it is described by the Glue database `kings_herald`:

| Table | What |
|---|---|
| `history` | The history records above: points, snapshots, commands, clicks, encounters (with each member's stance, fit, power, gear and injury, plus a difficulty vote on older records) and loot rolls. Filter on `type`; partitioned by `dt` (the UTC date). |
| `raw_logs` | Every log line the bot writes, in CloudWatch batches. `UNNEST(logevents)` gives one row per line. |
| `game_state` | A nightly full export of the DynamoDB table. One row per item as DynamoDB JSON; `"$path"` tells the nights apart. |

Two CloudWatch subscription filters feed two Firehose streams, which write gzip JSON files every 15 minutes or so. The table has point-in-time recovery on, which lets it be restored to any second in the last 35 days, and EventBridge Scheduler exports it nightly. Dates are worked out from the folder names, so nothing needs a crawler. Costs are pennies a month.

In the Athena console, pick the `kings-herald` workgroup (results go to the bucket, and a query is capped at 1 GB scanned) and the `kings_herald` database:

```sql
-- One member's points and fit by day
SELECT day, points, fit, duelwins, shopspent
FROM history WHERE type = 'snapshot' AND name = 'Arctrooper66'
ORDER BY day;

-- Points by source this month
SELECT reason, sum(delta) AS total
FROM history WHERE type = 'points' AND dt >= '2026-10-01'
GROUP BY reason ORDER BY total DESC;

-- Encounter wins by player over time (from the nightly snapshot)
SELECT day, name, encounterwins, killingblows, lootwon
FROM history WHERE type = 'snapshot' ORDER BY day, name;

-- Every fight, one row per member, with their stance, fit, power and gear
SELECT at, boss, difficulty, won, power AS party_power,
       m.name, m.stance, m.fit, m.power, m.gear
FROM history CROSS JOIN UNNEST(members) AS t(m)
WHERE type = 'encounter' AND NOT rehearsal
ORDER BY at;

-- Most used commands
SELECT command, count(*) AS uses
FROM history WHERE type = 'command'
GROUP BY command ORDER BY uses DESC;

-- Search every log line
SELECT from_unixtime(e.timestamp / 1000) AS at, e.message
FROM raw_logs CROSS JOIN UNNEST(logevents) AS t(e)
WHERE dt = '2026-10-12' AND e.message LIKE '%Duel result%';

-- Points per member in the latest nightly export
SELECT json_extract_scalar(item, '$.displayName.S') AS name,
       CAST(json_extract_scalar(item, '$.points.N') AS integer) AS points
FROM game_state
WHERE item IS NOT NULL AND "$path" LIKE '%/data/%'
  AND "$path" LIKE (SELECT max(regexp_extract("$path", '^.*exports/[^/]+/')) FROM game_state) || '%';
```

The streams only catch logs written after they were deployed. To copy older logs (CloudWatch keeps them a year) into the archive, run a one-off export task. The times are epoch milliseconds, and `<bucket>` is the stack's `ArchiveBucketName` output:

```powershell
aws logs create-export-task --log-group-name /ecs/kings-herald --from 0 --to <ms-now> --destination <bucket> --destination-prefix logs-export
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
| CloudWatch Logs (low volume + 1 yr retention) | <$1 |
| History archive (S3, Firehose, Glue, Athena; prod only) | <$1 |
| ECR storage (one image) | <$1 |
| Data transfer (Discord WebSocket out) | <$1 |
| DynamoDB (on-demand, plus point-in-time recovery and a nightly export) | <$1 |
| **Total** | **~$8** |

Fargate Spot cuts compute ~70% versus on-demand (was ~$8/mo). The **beta** stack adds effectively **$0** at rest — it runs 0 tasks by default, so it only bills for the minutes you scale it to 1 to test (plus a few cents of ECR storage for its image).

No NAT gateway (would be ~$32/mo), no load balancer (~$16/mo) — both intentionally avoided. The task uses a public subnet with a public IP and only outbound traffic to Discord, which is the cheapest viable shape; the public IPv4 charge is unavoidable without a far pricier NAT gateway. The bot's persistent state is the points ledger, characters and gear, duel record, voice and puzzle counters, the shop and its sellback listings, injuries, achievements and myths, and the trivia/puzzle/would-you-rather/ranking/word-ladder no-repeat cycles, kept in a small DynamoDB table so it survives restarts and redeploys; everything else is stateless. Its long-term history goes to the logs and the S3 archive.

### Follow-ups (not blocking)

- **Tighten IAM.** The deploy IAM user and the GitHub OIDC role both have `AdministratorAccess` for first-deploy reliability. Long-term, scope them down to the services this stack actually touches (CloudFormation, ECR, ECS, IAM, EC2 for VPC, Logs, SSM).
- **Trim `package.json`.** The bot's `dependencies` block lists transitive deps (eslint, nodemon, ansi-styles, etc.) as direct deps, which bloats the image. A `npm prune` + reauthoring would shrink the image meaningfully.
- **Add a PR-check workflow.** A second GitHub Actions workflow that runs `npx cdk synth` on PRs would catch CDK errors before merge without deploying anything.

