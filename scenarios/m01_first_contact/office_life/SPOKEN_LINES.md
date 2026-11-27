# m01 First Contact: office-life spoken lines

Every new line from PLAN.md, with speaker, trigger, voice and character count. Scenario data only: NPC JSON bark and chatter fields, and ink. None is engine text. Voiced: all 22 clips, with the user's yes (D97a), in commit a0c4535b6. Any later change to a line needs its own yes to re-voice.

Rules checked: pool barks are 40 characters or fewer; no line carries a clue, a PIN or code, or a name the plot uses; none mentions the audit, late nights, boxes, laptops, the coffee machine or the fridge (the plot's false leads and clue surfaces).

Voices (settled, D88 d): Fatima Begum, Vindemiatrix (British Bangladeshi, Yorkshire, thirties). Graham Whitfield, Umbriel (Halifax, early sixties). Both `en-GB`.

Maya: no new spoken lines. Her short trip to the cooler is silent; any line she speaks is existing ink. One new player-facing choice is added to her ink (below); player choice text is not voiced (person-chat-minigame.js:1688), so it is no clip.

## Tier 1 (first build stage)

### Barks (once only, `delayMs` as shown)

| # | Speaker | Trigger | Condition | Text | Chars |
|---|---|---|---|---|---|
| 1 | fatima_begum | `room_entered:main_office_area`, onceOnly, delayMs 2000 | `!globalVars.fatima_ko && !globalVars.entropy_reveal_read` | Morning. Busy week. | 19 |
| 2 | graham_whitfield | `room_entered:main_office_area`, onceOnly, delayMs 2000 | `data.previousRoom !== 'reception_area' && !globalVars.graham_ko && !globalVars.entropy_reveal_read` | Lost? This floor took me a month. | 33 |

Graham speaks on the first return from another room, not the first entry, so he does not talk over Fatima or HaX's first call (6 s after first entry).

### Talk (ink, brush-off conversations)

| # | Speaker | Trigger | Text | Chars | Delivery |
|---|---|---|---|---|---|
| 3 | fatima_begum | `start` knot, first line | Sorry, I'm halfway through a candidate's file. | 46 | brisk, apologetic |
| 4 | fatima_begum | `start` knot, after the choice | If it's the network, I only press the buttons. Nice to meet you. | 64 | |
| 5 | graham_whitfield | `start` knot, first line | Graham, finance. If it's about expenses, I'm not in. | 52 | dry, deadpan |
| 6 | graham_whitfield | `start` knot, after the choice | Only joking. Not that I know much about computers, mind. | 56 | dry, deadpan |

Player choices (not voiced): Fatima, "Don't let me keep you." Graham, "I'll leave you to it."

Delivery tags exist only on #3, #5 and #6. The barks, pool lines and exchange lines carry no delivery tag.

### Not voiced (text only)

HaX attacked texts, credits lines and observations are text on screen, not clips:

- "Stand down, Agent. She runs recruitment. She's not part of this." (64)
- "He's in finance, Agent. Nothing to do with this. Stand down." (60)
- Credits: "FATIMA BEGUM: Bystander knocked out, no ENTROPY connection" (58); "GRAHAM WHITFIELD: Bystander knocked out, no ENTROPY connection" (62)

Tier 1 clip count: **6**.

## Tier 2 additions (water cooler, settled D88 a)

### Cooler chatter pools (`chatter.cooler`, each 40 or fewer)

| # | Speaker | Text | Chars |
|---|---|---|---|
| 7 | fatima_begum | Three interviews today. Three! | 30 |
| 8 | fatima_begum | Every CV says 'passionate' now. | 31 |
| 9 | fatima_begum | Locked my screen before I came over. | 36 |
| 10 | fatima_begum | Is it me, or is the heating on full? | 36 |
| 11 | graham_whitfield | Quarter close. Nobody speak to me. | 34 |
| 12 | graham_whitfield | Nobody reads the expenses policy. | 33 |
| 13 | graham_whitfield | Thirty years and still no decent mug. | 37 |
| 14 | graham_whitfield | My grandson set up my phone again. | 34 |

### Exchanges (heard once; knots in `m01_npc_fatima_begum.ink`; set `heard_ex_interns`, `heard_ex_biscuits`)

The validator caps every exchange bubble at 40 characters, so lines 16, 21 and 22 were shortened in the build, before voicing.

`ex_interns` (global `heard_ex_interns`)

| # | Speaker | Text | Chars |
|---|---|---|---|
| 15 | fatima_begum | Did finance sign off my two interns yet? | 40 |
| 16 | graham_whitfield | One intern. The other's for next year. | 38 |
| 17 | fatima_begum | Next year. You said that last year. | 35 |
| 18 | graham_whitfield | And I meant it both times. | 26 |

`ex_biscuits` (global `heard_ex_biscuits`)

| # | Speaker | Text | Chars |
|---|---|---|---|
| 19 | graham_whitfield | I've brought biscuits for quarter close. | 40 |
| 20 | fatima_begum | Bribery, Graham? | 16 |
| 21 | graham_whitfield | Morale. Budgeted under sundries. | 32 |
| 22 | fatima_begum | I'll tell everyone it's under sundries. | 39 |

### New player text (not voiced)

| # | Speaker | Where | Text | Chars |
|---|---|---|---|---|
| P1 | player (choice) | `not_here` knot in `m01_npc_maya.ink`, shown only while the player is away from Maya's office | Not here. I'll come to your office. | 35 |

Counts: new spoken lines 22 (6 at tier 1), unchanged; new player choice text 1, no clip; Maya spoken lines 0.

## Clip counts

| Tier | Barks | Talk | Pool | Exchanges | Total clips | Of which counted by V6 |
|---|---|---|---|---|---|---|
| 1 | 2 | 4 | 0 | 0 | 6 | 2 |
| 2 | 2 | 4 | 8 | 8 | 22 | 18 |

V6 (`app:break_escape:tts:office_lines[m01_first_contact]`) counts office-life clips only: event barks, chatter pool lines and the lines of exchange and phone-call knots (app/services/break_escape/tts_office_lines.rb). It does not count the four brush-off talk lines (#3 to #6), which are ordinary person-chat ink lines voiced by the normal per-mission batch. Expected V6 total at tier 2: **18** (2 barks, 8 pool, 8 exchange; Graham 9, Fatima 9), all uncached keyless (expected before voicing; since a0c4535b6 the rake reports 0 uncached); at tier 1: 2 (the two barks). Voicing the whole mission adds the 4 talk lines, giving 22 clips (6 at tier 1). Maya's routine and her `not_here` choice add no clip.

P1 context: away from her office, `not_here` first replays her existing opener "Is it safe to talk?" (m01_npc_maya.ink:26, same delivery, cached clip reused, no new clip), then offers this choice.
