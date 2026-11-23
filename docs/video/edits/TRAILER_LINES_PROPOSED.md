# Trailer lines proposed, m04 to m10 (2026-11-22)

Proposals only. No ink edited, nothing voiced, nothing committed. Full details (the lines before and after each one, the state for the take, the reason) are in each `M0X_TRAILER60_OUTLINE.md` under "New lines (proposed, 2026-11-22)". The rule is in `docs/video/recipes/mission-trailer.md`, "Write a better line".

Before any of these is voiced: the user's pick, an `npc-dialog-review` on the new lines, and the user's yes through AC0 for the TTS with the line count below.

Checked against: no casualty figures, no codes or flags, no withheld twist (m05 insider, m07 planter, m08 mole, m09 Architect's voice, m10 sleeper), UK English, no em dashes in line text.

| Mission | Role | Speaker | Line | Insertion point | Delivery | Pick |
|---|---|---|---|---|---|---|
| m04 | ending | Voltage | I've done the sums. The city goes dark at eight, and I'll sleep fine. | `m04_npc_voltage.ink:258`, `voltage_owns_it`, replaces "There's no version of this where I blink..." | quiet and level, a man reading out a sum he has already checked | **yes** |
| m04 | ending | Voltage | But you're late. Three days we've had this hall, and every light in the city with it. | `m04_npc_voltage.ink:140`, `voltage_confrontation_start`, replaces "But you're late. This place has no security..." | unhurried, almost bored, the threat taken for granted | |
| m05 | ending | Recruiter | I find people the week before they break, agent. Then I make them an offer. | `m05_phone_recruiter.ink`, `recruiter_introduction`, added after `:110` | warm and confiding, a headhunter's smile in the voice | **yes** |
| m05 | ending | Recruiter | Shame. I'd have placed you somewhere nobody would ever think to look. | `m05_phone_recruiter.ink`, `recruiter_deal_refused`, added after `:270` | lightly regretful, then cool | |
| m06 | ending | Satoshi Nakamoto II | Take me in if you like. The money already knows where it's going. | `m06_satoshi_confrontation.ink`, `philosophy_challenge`, added after `:256` | relaxed, a little amused, entirely sure | **yes** |
| m06 | ending | Satoshi Nakamoto II | Every ransom, every blackout, every riot. It all clears through my signature. | `m06_satoshi_confrontation.ink`, `evidence_reveal`, added after `:144` | easy, almost proud, a banker reading out his book | |
| m07 | ending | The Architect | Four fires tonight, and only one of you. I set them so you'd have to choose. | `m07_architect_comms.ink`, `taunt_t30`, added after `:94` | soft and measured, faintly pleased, in no hurry at all | **yes** |
| m07 | ending | The Architect | Fifteen minutes on your wall. I had rather longer to plan them. | `m07_architect_comms.ink`, `taunt_t10`, `cascade_armed` branch, added after `:226` | quiet and patient, a teacher stating a fact | |
| m08 | ending | Director Magnus Netherton | They have read our plans for months, Agent. Tonight they will be reading you. | `m08_director_netherton.ink`, opening, added after `:97` | low and grave, each word placed | **yes** |
| m08 | ending | ATHENA | Whoever it is, Agent, they are still in the building. So are you. | `m08_receptionist_ai.ink`, hub "What have you seen tonight", added after `:40` | serene and pleasant, faintly unsettling | |
| m09 | ending | Margaret Sorensen | Yours is in tonight's run, dear. I saved it for last. | `m09_sorensen_hatch.ink`, `recognition`, added after `:112`, before HaX `:113` | mild and pleasant, like a librarian mentioning an overdue book | **yes** |
| m09 | ending | Margaret Sorensen | They're all still at their desks, dear. By morning, nobody will know which ones. | `m09_sorensen_cage.ink:33`, `start`, replaces "It's only paper..." | gentle, almost kind, without looking up from the feed | |
| m09 | hook | Director Magnus Netherton | We believe ENTROPY keeps its people on paper in that building. Tonight they are burning it. | `m09_briefing.ink`, `start`, added after `:61` | level and grave | **yes** |
| m10 | ending | Dr Adrian Tesseract | I had the blast door read one badge tonight. Yours. | `m10_tesseract.ink`, `arrival`, added after `:112` | quiet and matter-of-fact, a host who has gone to some trouble | **yes** |
| m10 | ending | Dr Adrian Tesseract | Your service spent decades hoarding the world's weak points. At six, I give them back. | `m10_tesseract.ink`, core pitch, added after `:280` | calm and reasonable, almost generous | |
| m10 | hook | Agent HaX | Well enough to know he's set a place for each of us. | `m10_director_netherton.ink:116`, `briefing_name`, replaces "Well enough to know he's expecting us." | dry and quiet, one beat of old familiarity | |
| m10 | hook | Director Magnus Netherton | At six he publishes everything we ever catalogued. Every flaw, with working detail, free, to anyone. | existing, `m10_director_netherton.ink:125` (no new voicing) | n/a | **yes** |

Hooks for m04 to m08 are not weak (Netherton's briefing lines in each), so they get no new hook. m08's villain is the hidden mole, so its menace lines go to Netherton and ATHENA, and point at all three suspects equally.

Strong existing lines found on the way, which need only a cache check: m04 Voltage "Look at my hand. Then look at the clock." (`:187`); m06 Satoshi "The Architect calls them lessons. I just pay the invoices." (`:192`); m07 Architect "The beauty of entropy is that it doesn't require me to win. It only requires you to wait." (`taunt_t10`, `else` branch).

## Voicing count for the picks

- New lines: 8 (m04 1, m05 1, m06 1, m07 1, m08 1, m09 2, m10 1). The m10 hook pick is an existing line.
- Surrounding re-voices: none required, since each pick sits beside lines it reads well against, and m04, m06 and m10 already mix tagged and untagged lines. Up to 3 optional if the user hears a mismatch once the new take exists: m09 HaX "...She's got a file on you." (`m09_sorensen_hatch.ink:113`), m08 Netherton "Ask me what you need. Then go and prove something." (`:98`), and m04 Voltage's line before the new one (`:252` or `:255`).
- Total: 8, at most 11.
- One pick replaces a voiced line (m04 `:258`). The rest are additions. The replaced clip is orphaned, and `tts:wasted` will list it.

## Owner's picks (review page, saved 2026-11-22 23:41)

From `feedback/trailer_lines_m04_m10`. These override the Pick column above. Use them as the trailer lines.

| Mission | Pick | Line | Status |
|---|---|---|---|
| m04 | alternatives wanted | | round 2 (`TRAILER_LINES_ROUND2.md`) |
| m05 | price | Everyone has a price, agent. I'm asking what yours is. | existing line |
| m06 | statues | Murder's what they call it when you lose. The winners get statues. | existing line; needs the arrest route filmed around its menus |
| m07 ending | fires | Four fires tonight, and only one of you. I set them so you'd have to choose. | new, voiced |
| m07 hook | alternatives wanted | | round 2 |
| m08 | mole | There is a mole in SAFETYNET. I am reasonably certain they are within a hundred metres of where you are standing. | existing line (Netherton) |
| m09 ending | alternatives wanted | | round 2 |
| m09 hook | paper | We believe ENTROPY keeps its people on paper in that building. Tonight they are burning it. | new, voiced, in the game |
| m10 ending | decades | Your service spent decades hoarding the world's weak points. At six, I give them back. | picked 2026-11-23; NOT yet inked (T345 has the unpicked blast-door line, to be replaced in the same commit) |
| m10 hook | publishes | At six he publishes everything we ever catalogued. Every flaw, with working detail, free, to anyone. | existing line (Netherton) |

Other answers (2026-11-23, via AC0): casualty rule "Relax it"; m05 twist "Keep him hidden" (Torres stays off screen); voice new lines "after the dialogue review".

So the new m05, m06 and m08 lines are in the game (T345) but not in the trailers. In m08, the new line replaced Netherton's "Ask me what you need. Then go and prove something."
