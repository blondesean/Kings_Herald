# The Last Proclamation

The plan for the Herald arc: how the server climbs to the trials, how the Herald reveals himself, the fight, and his fall. The player-facing story is in `the-ages-of-arms.md` and `flavor_text/loreDrops.js`. This file holds the truth behind it and the scripts for the reveal.

---

## The truth

The Herald is not a villain, and he never was.

The chronicle talks about "the heralds" as an order. There was only ever one. He was the charioteer who told the blind king the war at Kurukshetra, the runner of Benjamin who told Eli the ark was taken, Talthybius holding his staff between Hector and Ajax, the doorkeeper at Tara, and the boy in seven-league boots who became the king's runner. The horn at the end of the north was not his; he says only that he learned from it.

His purpose is the one the chronicle states openly: **a wave does not know its own height.** In every age he stood beside the last test. He never caused the great wars, but he carried the challenges, held the gates and named the hour, so that each people met its test at its crest and not in its trough, and was remembered for its best day.

Every earlier age broke against a rival age. This court has none, so for the first time the Herald brings the last test himself. He wants to lose. When he falls, he knows the age has reached its crest, and he gets to name it. Then he carries on as its herald, because heralds always do.

**The tone:** he is warm, proud and a little theatrical. He fights the court the way a teacher sets a final exam. The players are against him in battle, not in spirit, though he and the court can disagree about one thing: he believes every crest is followed by a breaking, and the court is free to believe otherwise.

---

## The stages

1. **The climb.** Every server starts with Easy, Medium, Hard and Extreme, a quarter each. Its first Extreme win opens Max, announced in the victory post. Max is tuned at 256 fit per member, a tenth of the way from a full Epic kit to a full Legendary one, so a party around 250 fit has about a 75% chance and Legendary gear has the edge. Built: `src/campaign.js`.
2. **The trigger.** The server's first Max win: the herald goes quiet and tells the court to come and hear him in the morning. The seven lore drops then post at 9 AM Eastern for seven days. Built.
3. **The trials.** The seventh drop opens `/trial`. Each player can win one relic. Winning earns the secret achievement **Echo of the Ages**. Built: `src/trial.js`. Three rounds back to back, in a private reply: pick one of five rumors, fixed per player per day; answer the road, the lore question, where the legend's choice adds 15% power; then fight the relic's Guardian solo at Max difficulty with a stance, Plunder excepted, and the suit-up choice. One attempt a day, spent on picking a rumor; a loss injures by stance. A claim is proclaimed in the channel with the legend, and the first sets the campaign's `firstRelicAt` for the reveal mornings. Relics cannot be sold or traded.
4. **The reveal.** The fifth relic claimed starts it: the herald hails the five Echoes at once, by name, then posts the three reveal mornings below at 9 AM Eastern, where the lore drops went. The last one reveals him and calls on everyone else to follow the rumors they have heard, claim their own arms, and unite against him. `/herald_challenge` stays locked until it has posted. Built: `flavor_text/revealMornings.js`, `src/campaign.js`.
5. **The day of the duel.** You pick the date. `/herald_challenge <date> [time] [cancel]` sets it, in the channel where the battle will be, and the herald proclaims it, with reminders a week before, the day before, and at 9 AM Eastern that day. Running it again moves the day. Built: `commands/prompts/herald_challenge.js`, `src/heraldBattle.js`.
6. **The battle.** Only Echoes, members who have claimed a relic, may join. Three phases: a lore question, a dream duel against each member's own Guardian, then the Herald at 277 fit per member, harder on paper than any Guardian. If every member wins their dream duel, the win is guaranteed. Winning earns the secret achievement **The Age Is Named** for everyone in the party, and the Herald drops Legendary gear. Built: `src/heraldBattle.js`, rehearsed with `/herald_test`.
7. **The naming.** The Herald names the age, then goes back to being the court's herald, of a named age now.

---

## The reveal mornings

Short posts, not the long lore drops. The Herald's voice shifts from chronicler to participant, one step at a time.

**When the fifth relic is claimed, at once**

> Hear ye! Five Echoes of this age have walked old roads to their ends, and relics of the old waves have risen for them: [their names]. I have watched that happen more times than I can count, and it has never once failed to make my hands shake. Mark the day. Come and hear me in the morning.

**Morning 1: The Staff**

> A question the scholars never thought to ask. Why did no one in the old world strike a herald? Not the Greeks, not the Trojans, not the giants of the north. It was not law. Laws break in wartime. It was that every army, in its heart, knew the herald was not on the other side. The herald was on the side of the age. Hold onto that. You will need it.

**Morning 2: Many Names**

> I told you a charioteer saw a whole war and told it true to a blind king. I told you of a runner with earth on his head, and two heralds who held their staffs between champions at nightfall. I told you of a doorkeeper with one question, and a small boy who ran a king's word across a kingdom in boots too big for him. I told you to look for the staff and the horn. I wonder how many of you looked.

**Morning 3: The Reveal and the Call**

> There were never heralds, court of the King. There was a herald.
>
> I told a blind king his war. I ran to Shiloh with earth on my head. I held my staff between Hector and Ajax, and handed a sword down a road I could not see the end of. I let Lugh in at Tara. I put on fairy boots and became the first herald of the Hearth. I have worn more names than any relic in your trials, and I have carried the last challenge to every age that ever crested.
>
> Every one of those ages had a rival to break against. You do not. So this time, I will not carry the challenge. I am the challenge.
>
> I do not want your kingdom. I do not want your relics. I want to know how high you can go. Five of you have already walked the old roads and come back changed. The rest of you have heard the rumors too: a hammer in a bride's lap, a fleece where nothing sleeps, a sword a dying man could not break. Follow them. Claim your own arms: they are the start of an era. Then come together, all of you, as one court, and meet me in a grand duel, as an age meets its last enemy. Defeat me, and usher in the new age.
>
> I will name the day. And if you win, I will tell you its name.

**The day is set, and the reminders**

> Hear ye, hear ye! On [date], the herald will lay down his scroll and take up his staff. Let every Echo come armed.

---

## The battle

One party, joined like an encounter but open only to Echoes, members who hold a relic, with no size cap, for an hour, and at least 3 must answer. Each fights in the finest gear they own and picks one of the encounter's four stances privately, Balanced by default; the stance counts only against the Herald. The battle runs in three phases, with the Herald drawing on what each age taught him.

- **The Staff, a lore question.** Every member privately answers the same easy question about the lore drops, four buttons, two minutes: the first age, what the heralds raised between the champions, what the reborn souls are called. A right answer gives that member +15% in their dream duel only.
- **The Horn, the dream duels.** Each member faces their own relic's Guardian again, solo at Max, with their current best fit, plus the trivia bonus if they earned it. It is a dream: a loss costs nothing. A win gives that member +15% in the fight with the Herald. The trivia bonus does not carry over, so the two never stack.
- **The Wheel, the Herald.** Party power is each member's fit, times their stance, times 1.15 for each dream victor, against 277 fit per member, on the encounter curve capped at 95%. If every member won their duel, the win is guaranteed; the lore question only helps them get there.

The battle is built for drama: each phase is its own post, and lines are added to it every 5 seconds, one dream duel or one member stepping forward at a time, with each member's fit, stance and power and a running total for the court. Then the totals, a pause, the throw and the result. Unlike the daily encounter, everything is shown: it is the finale.

A win drops Legendary gear, one piece per 2.5 members, rolled for with Need, Greed or Pass like encounter loot. A Plunder member also makes off with a Legendary piece of their own on a win. A loss singles out two members, the less fit likelier, rested by stance as in an encounter: Aggressive or Plunder two days, Balanced one, Defensive none.

**Phase 1: The Staff.** He fights as the herald no one strikes.
> The Herald plants his staff and does not raise a weapon. For a long moment, no one in the party can bring themselves to swing. Then someone does.

**Phase 2: The Horn.** He calls the old guardians back as an echo of every trial the party fought.
> The Herald lifts a horn to his lips, and the guardians of the trials answer it: the lion, the dragon, the giant of Gath, the one-eyed king. Every relic in the party knows its old enemy.

**Phase 3: The Wheel.** The last exchange, and his only real attack.
> The Herald takes up the wheel, which has never once been lost, and throws it, and it comes back to his hand, and he throws it again.

**If the court loses:**
> The Herald lowers his staff and smiles, and there is no triumph in it at all. "Not yet. The crest is close, but you are still climbing. Rest. I will proclaim the challenge again when you are ready, and I will be glad to."

**If the court wins: the Fall.**
> The wheel goes wide, for the first time in the Long Memory. The Herald drops to one knee in the dust, and laughs.
>
> "There. Do you feel it? That is what the top of a wave feels like. Every age I have known stood here for one moment and did not know it. You know it. That is my gift to you, and the only one I have ever been able to give.
>
> "I have to tell you the rest, because a herald tells it true. After the crest, the wave breaks. It always has. I have watched it break more times than I can bear to count. Perhaps you will be the first that does not. I have never been so glad to hope I am wrong.
>
> "Now. By the oldest right I keep: hear ye, hear ye. Let the Long Memory record that the age of this court has been tested, and has met its test, and is named **the Age of Adventurers.** Gods, prophets, heroes, kings and folk, and now you: the ones who hear the call and answer it. It is the finest name I have ever given."

**The naming.** The Herald grants the name. The working choice is **the Age of Adventurers**, the sixth age after gods, prophets, heroes, kings and the Hearth. It is a plain, warm name rather than a grand one: every tale of the Hearth began with someone answering a herald, and an adventurer is exactly that, someone who answers. It is also what the server already calls the members who answer the daily encounter. Alternatives in the same spirit: the Age of Rebirth, for the Echoes; the Age of Fellowship, for the court united; the Age of the People.

**After.** The Herald goes back to his daily duties, now the herald of a named age. His announcements can mention the age by name from then on.

---

## Achievements

- **Echo of the Ages:** win a trial and claim a relic. Counter `trials_won`.
- **The Age Is Named:** fight in the party that defeats the Herald. Counter `herald_wins`.

Both are defined in `src/achievements.js`; the trial and the Herald battle record them.

---

## Open questions

- **The date of the duel.** To be chosen, with `/herald_challenge`. Rehearse first with `/herald_test` somewhere the court won't see, since it posts the naming.
- **A rematch cadence.** If the court loses, how soon the Herald proclaims again: a week is a natural default.
- **The final name.** The Age of Adventurers, unless something better turns up.
