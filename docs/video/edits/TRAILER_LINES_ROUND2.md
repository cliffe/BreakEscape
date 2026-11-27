# Trailer lines, round 2 (2026-11-22)

The owner picked the existing lines for m05 ("Everyone has a price, agent..."), m06 ("...The winners get statues.") and m08 ("There is a mole in SAFETYNET..."), and the new "Four fires tonight..." for the m07 ending. The unpicked m08 line was taken back out on 2026-11-23; the new m05 and m06 lines stay in the game for now. When the round-2 picks arrive, replace or remove the rejected round-1 lines (m04, m07 hook, m09) in the same commit as the new ones. They asked for alternatives on three:

- **m04 Voltage ending:** "Propose some alternatives with some more clever threat/menace."
- **m07 hook:** "Maybe a new intro line from a briefing: 'we're faced with an impossible decision'." This is a pre-outcome line to replace HaX's "One team, three fires".
- **m09 Sorensen ending:** "Something that carries more narrative weight."

Drafts only. Nothing is in the ink or voiced. Once the owner picks, the line goes in, then the usual review, then voicing under the standing TTS yes. Each draft needs to play where it's placed in the game.

## m04: Voltage (Critical Failure)

Context: he is an engineer, faintly German ("Ja"). The target is a battery hall on a floodplain, reached through a fake maintenance firm (OptiGrid) the crew walked in behind. Eight o'clock is the deadline. "The Architect has six cities lined up." The currently voiced line, "I've done the sums. The city goes dark at eight, and I'll sleep fine.", stays in if nothing here beats it.

| id | Line | Placement | Delivery |
|---|---|---|---|
| schedule | I didn't bring a bomb, agent. I brought a maintenance schedule. | `voltage_ideology_explanation`, after "...one fake maintenance firm, and we walked in the front." | dry, almost proud of the craft |
| plug | Go on, cut the power to stop me. That's the whole idea. | `voltage_has_leverage`, before "Your move." | quiet, faintly amused, letting the irony land |
| clock | Arrest me if you like. The racks don't need me any more. Only the clock. | `voltage_owns_it`, replacing the "sums" line | level and unhurried, certain |
| hand | Look at my hand. Then look at the clock. | existing (`voltage_threatens_trigger`), no new voicing | as voiced |

## m07: the briefing hook (The Architect's Gambit)

Context: Director Netherton over the secure link at 2:41 am. Four operations went live inside the same sixty seconds. There is one tactical team for the other three, so two go unanswered, and the player makes the call. Nothing is decided yet at this point, so a line here is pre-outcome.

| id | Line | Placement | Delivery |
|---|---|---|---|
| impossible | We are faced with an impossible decision, Agent, and I am afraid it is yours to make. | `delegation_intro`, after "The other two go unanswered." and the narrator's pause | grave and quiet, a man who hates saying it |
| fourone | Four targets, one team to send. Tonight we are faced with an impossible decision. | `start`, after "Washington. Austin. San Francisco. And a grid control facility outside Portland, Oregon." | level and grave |
| noright | There is no right answer here, Agent. There is only the one you can live with. | `delegation_intro`, after "The other two go unanswered." | low, measured, not unkind |
| burns | Whatever you choose tonight, somebody else's city goes dark. | `delegation_intro`, after "The other two go unanswered." | flat and grave |

## m09: Margaret Sorensen (Digital Archaeology)

Context: ENTROPY's archivist, feeding the shredder in the cage. The paper is the only record of the people ENTROPY "placed" at desks. The Architect writes to her about the player, whose file is in tonight's run. The currently voiced line, "Yours is in tonight's run, dear. I saved it for last.", stays in if nothing here beats it.

| id | Line | Placement | Delivery |
|---|---|---|---|
| index | Everyone ENTROPY ever placed was filed in this room, dear. By morning, I'll be the only index left. | `m09_sorensen_cage.ink` `start`, replacing "It's only paper..." (:33) | gentle, almost kind, without looking up |
| colleagues | When this feed stops, nobody alive will know which of your colleagues are ours. | cage `start`, after "Paper was the only thing that could ever have hurt them. So the paper goes." | mild, unhurried, a fact stated |
| chapters | The Architect writes to me about you, you know. Every chapter. Those go in last. | `m09_sorensen_hatch.ink` `recognition`, replacing "Yours is in tonight's run..." | pleasant, confiding, like sharing gossip |
| lies | Every lie they ever lived went through my hands, dear. I'm the last one who can tell you which were lies. | cage `start`, after "So the paper goes." | quiet, slightly wistful |

## After the review (2026-11-22)

A Sonnet review checked canon, placement, voice and the trailer rules.

Dropped:
- **plug:** it undercuts the mission's real fix (the hardwired shutdown).
- **fourone** and **burns:** both factually wrong. The team goes to one of three, and none of the three is a blackout.
- **noright:** it pre-empts HaX's debrief reveal.
- **colleagues:** it points at SAFETYNET staff, which front-runs m10.
- **chapters:** new canon, and it repeats the line before it.

Fixed:
- **clock:** SAFETYNET detains rather than arrests, and the timer is canon.
- **index:** the catalogue and ledger survive if the player saves them.
- **impossible:** tightened.

Two replacements were added and checked against the same facts.

On the page:

| Mission | id | Line | Placement | Delivery |
|---|---|---|---|---|
| m04 | clock | Take me in, if you like. The racks don't need me. They have the clock. | `voltage_owns_it`, replacing the "sums" line | level and unhurried, certain |
| m04 | schedule | I didn't bring a bomb, agent. I brought a maintenance schedule. | `voltage_ideology_explanation`, after "...we walked in the front." | dry, almost proud of the craft |
| m04 | contract | Every city has a hall like this. And every one of them has a maintenance contract. | `voltage_negotiation_attempt`, after "The Architect has six cities lined up." | dry, matter-of-fact, letting it sink in |
| m04 | hand | Look at my hand. Then look at the clock. | existing | as voiced |
| m04 | sums | I've done the sums. The city goes dark at eight, and I'll sleep fine. | voiced in round 1 | as voiced |
| m07 | impossible | We are faced with an impossible decision, Agent, and it is yours. | `delegation_intro`, after "The other two go unanswered." and the pause | grave and quiet, a man who hates saying it |
| m07 | onedecision | ENTROPY did not plan four attacks tonight, Agent. It planned one decision. | same place | low and measured |
| m07 | notthere | Whichever you choose, two cities wake up tomorrow knowing we were not there. | same place | flat and grave |
| m09 | lies | Every lie they ever lived went through my hands, dear. I'm the last one who can tell you which were lies. | cage `start`, after "So the paper goes." | quiet, slightly wistful |
| m09 | index | Everyone ENTROPY ever placed is filed in this room, dear. By morning, I'll be the only index you can ask. | cage `start`, replacing "It's only paper..." (:33) | gentle, almost kind, without looking up |
| m09 | saved | Yours is in tonight's run, dear. I saved it for last. | voiced in round 1 | as voiced |

## After the independent review (2026-11-23)

Opus 5.5 review of the T345 lines, the m10 pick and the casualty options: `docs/video/logs/T345_LINES_DIALOGUE_REVIEW.md` (on video/trailers-m01-m02-spies). Changes here:

- **m04:** the casualty rule is relaxed (owner). Two options added to the page, both replacing the "sums" line in `voltage_owns_it`: `fifty` "Fifty people. I checked the sum twice. Find me wrong." and `signed` "Fifty people die if my sums are right. Check them. The last man did, and he signed." Delivery: flat and unhurried, a checked figure read aloud, then a dare. "Fifty" because 11 on site and forty-odd on the feed make fifty. Voltage is South African in the voice bible ("Ja" is Afrikaans), NOT German: the context note above is wrong. Don't direct takes as German.
- **m09 ending:** `saved` is withdrawn and taken out of the game. The player's file is in Sorensen's safe, not in tonight's run (`scenario.json.erb:2285`).
- **m09 hook (owner's pick, in the game):** the reviewer calls it a major, because the briefing doesn't know what is in the archive. Reworded option on the page: "Whatever ENTROPY cannot afford to keep is on paper in that building. Tonight they are burning it." Nothing changes until the owner says.
- **m10 ending:** the owner's pick is in `m10_tesseract.ink` and voiced; the blast-door line is out; the next line is trimmed ("City by city. Or you press this...") and re-voiced.
- **m05:** the new line moved above the Torres line. Same words, same clip.

## Owner's round-2 picks (2026-11-23)

| Mission | Line | State |
|---|---|---|
| m04 ending | "I didn't bring a bomb, agent. I brought a maintenance schedule." | In `m04_npc_voltage.ink`, before "Budget cuts, ageing cells..." (the as-inked review moved it up one line). The rejected "sums" line is out and the original "There's no version of this where I blink..." is back. |
| m07 hook | "We are faced with an impossible decision, Agent." (the owner's shortened wording) | In `m07_opening_briefing.ink`, before the choice. |
| m09 ending | "Everyone ENTROPY ever placed is filed in this room, dear. By morning, I'll be the only index you can ask." | Not in the game: "It's only paper..." is back in `m09_sorensen_cage.ink` until the owner answers (AC0 holds the line off main). The as-inked review calls "is filed in this room" a major: most of the file is elsewhere or already shredded by then. Suggested: "was filed in this building". With the owner. |
| m09 hook | unchanged | With the owner (`m09hookfix` on the page). |

The m04 casualty options (`fifty`, `signed`) are dropped: the owner picked the schedule line. The as-inked review is "As-inked review, round 2" in `docs/video/logs/T345_LINES_DIALOGUE_REVIEW.md`.

## Placeholders in the game (2026-11-23, AC0's direction)

AC0 relayed the owner's direction: where an answer is still owed, put the recommended option in as a placeholder and keep going. Both m09 lines are now in the ink and voiced, pending the owner's `m09cage` and `m09hookfix` answers:

- **m09 cage** (`m09_sorensen_cage.ink` `start`, replacing "It's only paper..."): "Everyone ENTROPY ever placed was filed in this building, dear. By morning, I'll be the only index you can ask." Clip a88b67a8.
- **m09 hook** (`m09_briefing.ink`): "Whatever ENTROPY cannot afford to keep is on paper in that building. Tonight they are burning it." Clip 01cdb48f.

All 49 m09 routes pass. The validator's warnings and the six dialogue-lint findings are on other lines, not these two. The replaced lines' clips stay in `tts_cache/` until the owner answers, so either wording can go back without re-voicing.
