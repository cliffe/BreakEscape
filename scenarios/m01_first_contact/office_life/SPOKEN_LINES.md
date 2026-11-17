# m01 First Contact: office-life spoken lines

Every new line from PLAN.md, with speaker, trigger, voice and character count. Scenario data only: NPC JSON bark and chatter fields, and ink. None is engine text. Not voiced: voicing waits for the user's own yes, and any later change to a line needs its own yes to re-voice.

Rules checked: pool barks are 40 characters or fewer; no line carries a clue, a PIN or code, or a name the plot uses; none mentions the audit, late nights, boxes, laptops, the coffee machine or the fridge (the plot's false leads and clue surfaces).

Voices: Fatima Begum, Vindemiatrix (British Bangladeshi, Yorkshire, thirties). Graham Whitfield, Umbriel (Halifax, early sixties). Both `en-GB`.

## Tier 1 (build default)

### Barks (once only, `delayMs` as shown)

| # | Speaker | Trigger | Condition | Text | Chars |
|---|---|---|---|---|---|
| 1 | fatima_begum | `room_entered:main_office_area`, onceOnly, delayMs 2000 | `!globalVars.fatima_ko && !globalVars.entropy_reveal_read` | Morning. Mind the cables by the door. | 37 |
| 2 | graham_whitfield | `room_entered:main_office_area`, onceOnly, delayMs 2000 | `data.previousRoom !== 'reception_area' && !globalVars.graham_ko && !globalVars.entropy_reveal_read` | Lost? This floor took me a month. | 33 |

Graham speaks on the first return from another room, not the first entry, so he does not talk over Fatima or HaX's first call (6 s after first entry).

### Talk (ink, brush-off conversations)

| # | Speaker | Trigger | Text | Chars |
|---|---|---|---|---|
| 3 | fatima_begum | `start` knot, first line | Sorry, I've a candidate on a video call in five minutes. | 56 |
| 4 | fatima_begum | `start` knot, after the choice | If it's the network, I only press the buttons. Nice to meet you. | 64 |
| 5 | graham_whitfield | `start` knot, first line | Graham, finance. If it's about expenses, I'm not in. | 52 |
| 6 | graham_whitfield | `start` knot, after the choice | Only joking. Not that I know much about computers, mind. | 56 |

Player choices (not voiced): Fatima, "Let her get on". Graham, "Leave him to his figures".

### Not voiced (text only)

HaX attacked texts, credits lines and observations are text on screen, not clips:

- "Stand down, Agent. She runs recruitment. She's not part of this." (64)
- "That's an accountant, Agent. Not a target. Stand down." (54)
- Credits: "FATIMA BEGUM: Bystander knocked out, no ENTROPY connection" (58); "GRAHAM WHITFIELD: Bystander knocked out, no ENTROPY connection" (62)

Tier 1 clip count: **6**.

## Tier 2 additions (water cooler, Q1 answer a)

### Cooler chatter pools (`chatter.cooler`, each 40 or fewer)

| # | Speaker | Text | Chars |
|---|---|---|---|
| 7 | fatima_begum | Three interviews this afternoon. Three! | 39 |
| 8 | fatima_begum | Every CV says 'passionate' now. | 31 |
| 9 | fatima_begum | Locked my screen before I came over. | 36 |
| 10 | fatima_begum | Is it me, or is the heating on full? | 36 |
| 11 | graham_whitfield | Quarter close. I dream in spreadsheets. | 39 |
| 12 | graham_whitfield | Nobody reads the expenses policy. | 33 |
| 13 | graham_whitfield | Thirty years and still no decent mug. | 37 |
| 14 | graham_whitfield | My grandson set up my phone again. | 34 |

### Exchanges (heard once; knots in `m01_npc_fatima_begum.ink`; set `heard_ex_interns`, `heard_ex_biscuits`)

Exchange lines are not pool barks, so the 40-character limit does not apply to them; each line is still short.

`exchange_interns` (global `heard_ex_interns`)

| # | Speaker | Text | Chars |
|---|---|---|---|
| 15 | fatima_begum | Did finance sign off my two interns yet? | 40 |
| 16 | graham_whitfield | One intern. The other's in next year's budget. | 46 |
| 17 | fatima_begum | Next year. You said that last year. | 35 |
| 18 | graham_whitfield | And I meant it both times. | 26 |

`exchange_biscuits` (global `heard_ex_biscuits`)

| # | Speaker | Text | Chars |
|---|---|---|---|
| 19 | graham_whitfield | I've brought biscuits for quarter close. | 40 |
| 20 | fatima_begum | Bribery, Graham? | 16 |
| 21 | graham_whitfield | Morale. It's in the budget, under sundries. | 43 |
| 22 | fatima_begum | I'm telling everyone it's under sundries. | 41 |

## Clip counts

| Tier | Barks | Talk | Pool | Exchanges | Total clips |
|---|---|---|---|---|---|
| 1 | 2 | 4 | 0 | 0 | 6 |
| 2 | 2 | 4 | 8 | 8 | 22 |

V6 (`app:break_escape:tts:office_lines[m01_first_contact]`) is the check: the build records its actual total, expected 6 or 22, all uncached, and flags any difference.
