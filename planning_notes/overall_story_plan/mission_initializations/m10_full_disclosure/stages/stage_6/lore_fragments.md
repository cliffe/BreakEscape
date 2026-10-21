# m10 Full Disclosure: Stage 6, lore fragments

## 0. Status, sources and conventions

Stage 6, draft 1, 2026-10-21. Author: m10 stage 6 author (Opus). Review rounds to follow in this folder (`REVIEW_R1.md` …).

**Built on** `../stage_1/story_arc.md` ("arc"), `../stage_2/storytelling_elements.md` ("SE"), `../stage_3/moral_choices.md` ("MC", the authority for choices, costs and globals), `../stage_4/objectives_tasks.md` ("OT", incl. §16's globals inventory), `../stage_5/room_layout.md` ("RL", the authority for object ids and positions), and `../../finale/FINALE_ARC.md` ("FA") §1–9 and §13's stage 6 handover (rows B1–B3, 10-1 to 10-8; the milestone part `finale/MILESTONE_S4-5_PART_a3237d9b.md` §3 is the same list in more detail). Prompt: `story_design/story_dev_prompts/06_lore_fragments.md`; standards that win where they differ: `.claude/skills/scenario-design-review/SKILL.md` §2b (clue distribution), `README_scenario_design.md` (object fields, variants, notes items, "Closing card and credits"), `README_ink_best_practices.md`. Canon checked against shipped m01–m08 (`scenarios/*/scenario.json.erb` and ink, read-only) and the universe bible. m09's shared facts come from m09's stage 1–5 documents (its stage 6 is being written in parallel; §6 lists what the two must match). No VM material was opened; flags are named by story meaning only.

**What this file fixes.** Every readable string in m10 (objects, items, notes items, the countdown objects, the 06:00 screen), every code value, the lock guard's name, the Citadel's incident file, and the closing card and credits as fixed strings in the committed format. Stage 7 writes the ink; stage 9 copies these strings into the ERB.

**Conventions for every string here.**

- **Fixed text only.** Nothing prints a variable. Where a line depends on state, each state has its own fixed string with its condition.
- **Object variants** (`observationVariants` / `textVariants`) take `&&` only (`utils/conditional-text.js`: no `||`, no parentheses), are read top to bottom, first match wins, so each list below is written most specific first and the default is the object's own `observations` / `text`. Readable objects get both lists with the same entries (README:536). A condition that would need `||` is written as one variant per arm. `=== ''` and `!globalVars.x` both work in that evaluator.
- **Card and credits conditions** are JavaScript over `globalVars` (`music/scenario-music-events.js:35-49`, `new Function`), so `||`, parentheses and `? :` work there, and every name is written `globalVars.<name>`.
- **No character from the coded-string list** (FA §13 B2) in any string a player sees (object and item text, names, notes, card and credit lines), coded or not, so one lint covers all of it; conditions are code, not displayed text, and use JavaScript's own `||` where §3 needs it: no `|`, `#`, `//`, `{`, `}`, `->`, `<-`, `<>`, `~`, `[`, `]`, `\`, `"`, `<%`, and no line starting `*`, `-`, `+` or `=`. Quoted speech inside a document uses single quotes. Line breaks below are real line breaks; stage 9 writes them as JSON newlines. (This is why the countdown separator is `·`, not OT §6's `|`; §6 change S6-07.)
- **Notes items render a markdown subset** (README:487), so no notes text below uses `#`, `**`, a leading `-` or a table row.
- UK English in prose; in-world American paperwork keeps American place names. UTC on every clock. WREN has no pronoun before the accusation, and no document gives one. Nobody genders the player. "The power room", never "the plant". Player-facing text never says "Ghost Protocol"; the m07 cells are named by their leaders (FA §4.6).

**Fixed values at a glance** (§2 has the reasons):

| What | Value |
|---|---|
| Records cupboard PIN (Ghost's and Vector's code, one value) | `2817` |
| Outer lock maintenance code (the shift code: the code card, Ghost's `ghost_lock_code`, the keypad's four worn keys) | `6083` |
| Asante's model terminal password (from the margin note's decode) | `DOUBLECOUNT` (upper case) |
| The lock guard | Sione Fonoti, 34, Samoan-American, from West Valley City, Utah; `displayName` "Sione Fonoti" |
| The Citadel's incident file | `incident_file`, "Citadel Incident File V-47", on the forward post's table |
| The bunker's original name (Helena's plans) | Sun River Regional Control Site, civil defence, 1962 |
| The bench's front supplier | Gallatin Instrument Supply, Bozeman |
| The corrected casualty range (Asante) | 2,100 to 3,600 in the first thirty days (his signed figure: 1,100 to 2,600) |

## 1. Every readable text, room by room

Ids and positions are RL §2's. For each object: `name`, `observations` (the hover and examine text), `text` where it is readable, then its variants, most specific first, each with its condition as stage 9 writes it. "Same for both" means the `observationVariants` and `textVariants` lists are identical. **Carries** says what the player learns (clue, lore, or a payoff), and **changed by** names the choice or import that moves it. Three objects are new or redefined here; each is a proposed change in §6 (S6-01 the incident file, S6-02 the model terminal, S6-03 the core's file index).

### 1.1 Forward post

**`incident_file`** (new, S6-01; on the kit table's south edge, suggested (12, 8), clear of `arakawa_post`; readable, `observationDisplay: "gameDisplay"`, `addToNotes: true`). Name: "Citadel Incident File V-47". Observations: "A buff folder with the Citadel's crest, signed out to Task Force Null. Somebody has read it until the corners went soft." Carries: the theft, the personnel index (why the readers know SAFETYNET badges, FA M-04), the vault line left open as a trace (F7, D-13), and the cracker quarantine (the stores half of the cracker canon, FA row 29). Changed by: nothing.

```
SAFETYNET. THE CITADEL. INCIDENT FILE V-47.
Subject: the Global Threat Database.
Copy for Task Force Null, Montana. Status: open.

1. Taken. The whole catalogue, 92,460 entries with working detail, on the four-site night, while every desk was on the attacks. The vault's personnel index went with it: 1,206 staff records, badge data included.

2. The door. Agent 0x47's own access into the vault, opened from inside and left open. Found on day nine.

3. The decision. The door was not closed. It was watched, so that it could be followed to wherever the copy went. It has been followed. It ends at the coordinate on the Montana order, and it is still open from that end. Whoever holds that end can reach the master. Risk accepted, on my signature.

4. Stores. Every PIN cracker 0x47 signed for in the last three years is withdrawn and held: 160 units, one supplier, four batches. Replacements are being sourced elsewhere.

M. Netherton, Director.
```

**`case_signout_sheet`** ((5, 8); readable, `gameDisplay`; `onRead.setVariable: { signout_read: true }`). Name: "Breaching Case: Sign-Out Sheet". Observations: "Task Force Null's own form, clipped to the lid of the breaching case." Carries: clue 3's second half (whose hands were in the case at 01:58), and the listed count that Phantom's audit says is one short. Changed by: m09's naming of WREN.

Default (`text`; the whodunit running):

```
TASK FORCE NULL. BREACHING CASE 2. SIGN-OUT.
Operation: Montana. Day 13, UTC.

Opened: 01:52. Kowalczyk / Arakawa.
Packed and checked by: H.K., K.A.

Contents, as listed:
  Door charges, 4
  Pry bar, 1
  Fibre scope, 1
  RFID cloner, stores issue, 2
  Bypass shims, 1 set
  Trauma kit, 1

Closed: not yet.
```

Variant, same for both, condition `globalVars.m09_sleeper_named === true` (taken or double-crossed; Kowalczyk was never at the table): the same sheet with the two lines changed to "Opened: 01:52. Arakawa." and "Packed and checked by: K.A." The rest is identical.

**`helena_plans`** ((8, 8); readable, `gameDisplay`; `onRead.setVariable: { plans_read: true }`). Name: "Helena's Plans: Tomb Gamma, As Built". Observations: "The construction file from the Helena archive. Cold War drawings, every room numbered, stamped SUPERSEDED in red." Carries: the bunker's history (lore), the hand crank (pays the silent Nightshade's "Manual."), the shutter fed from the power room (why the power room is on the route), and the half of the payment check: entry 3, the inner door's interlock, which Nightshade's payment calls "original, unchanged" and contradicts (the payment's text is §1.10). Changed by: nothing.

```
SUN RIVER REGIONAL CONTROL SITE. CIVIL DEFENSE.
AS BUILT, 1962. Lewis and Clark County, Montana.
From the construction file. Original drawings only.

1. Portal and blast door. Hand crank in the frame, for power failure.
2. Access tunnel, 140 ft. Caged lamps. No post shown.
3. Tunnel inner door. Steel. Interlocked to the guardroom: it opens from the tunnel side only on the guardroom's release. Opened any other way, it locks and sounds in the guardroom.
4. Guardroom. Alarm board. Stair B down to the lower level.
5. Workshops, lower level.
6. Plant room. Diesel, battery room, switchgear. The gallery shutter is fed from here.
7. Command room. Plotting board. Sealed equipment section at the east end, maintenance hatch.
8. Gallery over the control room. Blast shutter at the stair head.
9. Control room. Emergency exit, east wall, steel door.

SUPERSEDED BY REFIT. Refit drawings not on file.
```

**`projection_desk`** ((11, 3); readable, `gameDisplay`). Name: "Projection Desk". Carries: the `hardened` record answer's evidence, and a third, independent figure that lands near Asante's correction. Changed by: m07 `debrief_stance`.

- Default observations: "A field screen on a folding desk, dark. Set up for numbers nobody asked for." Default text: "The screen is dark."
- Variant, same for both, `globalVars.m07_debrief_stance === 'hardened'`: observations "The Council's curve, live. It doesn't flatten after a month." Text:

```
COUNCIL PROJECTION. REQUESTED BY AGENT 0x00.
The Publication, released by key, all cities.
Deaths, cumulative, by week.

Week 1: 400 to 900
Week 4: 2,000 to 3,400
Week 8: 3,100 to 5,000
Week 12: 3,900 to 6,200, still rising

Analysis: the source's own figure stops at thirty days. Ours doesn't.
```

**`gate_hut`** ((18, 6); not readable). Changed by: m06 `assets_seized`. Default observations: "The bunker's gate hut, lit. A radio playing low inside, and someone who'd rather be anywhere else." Variant `globalVars.m06_assets_seized === true`: "The gate hut, dark and empty. Beside it the refit fence just stops, a few metres short of the rock." (HaX names the freeze; the gap is visual only, A30.)

**`kit_table`** (decor): "A folding table under a work lamp. Maps, radios, coffee going cold, and the breaching case open at one end."

**`van_one`**: "The van. Side door open, the light on inside. A headset and a SAFETYNET badge on the step." (Malhotra's badge lies out all night, where a hand in the open case could reach it; FA §4.0.) **`van_two`**: "The second van. A steel rail along one wall, for cuffs."

**`gate_console`** (VM launcher): "The field console, racked by the gate. It talks to their gate terminal." **`gate_terminal`** (flag station, slice 0): "Tomb Gamma's gate terminal. Everything at the gate reports through it to their security monitoring." (Station hint texts: §1.11.)

### 1.2 Blast tunnel

**`tunnel_rota`** ((5, 2); readable, `gameDisplay`). Name: "Tunnel Post Rota". Observations: "A rota on the post's board, a mug ring through one corner." Carries: the shift change Nightshade's payment trades on (it confirms entry 2 for a player who checks), and Graham Reeves (m02) where he is at large. Changed by: m02 `reeves_fate`, and the insider-asset read rule (FA rows 21–22).

Default `text`:

```
TUNNEL POST. NIGHT ROTA, DAYS 10 TO 16.
22:00 to 06:00 UTC. One on post. Change at 02:30.

Day 12 to 13: J. Kiel, then T. Abara.
Day 13 to 14: T. Abara, then J. Kiel.

The kettle stays on the post. So does the radio.
```

Reeves variant, same for both: the default with one line added after the second day, "G. Reeves: on leave tonight. Back day 14." Four variants, one per arm, each the same text:

- `globalVars.m02_completed === true && globalVars.m02_reeves_fate === 'escaped'`
- `globalVars.m02_completed === true && globalVars.m02_reeves_fate === 'missed'`
- `globalVars.m02_completed === true && globalVars.m02_reeves_fate === 'unnoticed'`
- `globalVars.m02_completed === true && globalVars.m02_reeves_fate === '' && globalVars.m02_insider_asset_escaped === true` (runs finished before m02's ink change)

Custody values (`arrested`, `ko`, `flagged`), the arrested read rule, and never-played all read the default: Reeves is simply not there. HaX's line ("Reeves. From the hospital. He's theirs full time now.") is stage 7's, on the same four conditions.

**`post_ladder`** ((7, 4); not readable). Default observations (RL's): "A ladder up into the office's back corridor. The inner door's quicker." Variant `globalVars.tripwire_armed === true`: "A ladder up into the office's back corridor. The inner door's manual release is up there somewhere."

**`clock_blast_door`**: §1.9.

### 1.3 Security office

**`wanted_photo`** ((5, 2); readable in place). Name: "Shift Notes: Photo". Carries: the player is expected (FA row 119), in Tesseract's hand. Changed by: whether m09 was played (only the reference to Helena).

- Default observations: "Your photo, pinned among the shift notes, taken somewhere you didn't know there was a camera. Under it, in a neat, upright hand: 0x00: to the core. Do not detain." Default text, two lines: "Your photo. Under it, in a neat, upright hand:" / "0x00: to the core. Do not detain."
- Variant, same for both, `globalVars.m09_completed === true`: the same two strings with "in a neat, upright hand" replaced by "in the neat, upright hand from the papers in Helena".

**`duty_board`** ((7, 2); readable, `gameDisplay`). Name: "Duty Board". Observations (default): "Tonight's postings, and an order from the top pinned over them." Carries: the freeze's cost to him (FA row 72), Ray Hollis (row 92), and the standing order about 0x00. Changed by: m06 `assets_seized`, m07 `hollis_resolved`.

Default `text`:

```
DUTY BOARD. NIGHT, DAY 12 TO 13.

Gate: two, hut and fence.
Tunnel post: one.
This office: two, desk and floor.
Workshop floor: one, and the bench.
Power room: one technician.
Command room: two, and the systems lead.
Gallery: three.

From the top: one SAFETYNET agent is expected tonight. Let them through to the core. Do not detain them. Nobody else gets through.
```

Variants, same for both, in this order (each replaces only the lines named):

1. `globalVars.m06_assets_seized === true && globalVars.m07_hollis_resolved === 'evaded'`: "Gate: none." and "This office: one, desk only." Then, above the order from the top: "POSTS UNMANNED: BUDGET. The gate and this office's second chair stay empty until the account is unfrozen. Do not ask again." And beside the gate line, a photo pinned under "STOOD DOWN, BUDGET": "R. Hollis."
2. `globalVars.m06_assets_seized === true`: the two lines and the memo as above, no photo.
3. `globalVars.m07_hollis_resolved === 'evaded'`: "Gate: two, hut and fence. R. Hollis (photo pinned), and one." No memo.

On variant 1 the freeze has kept Hollis home, so HaX's "I hope he stays in the hut" no longer fits; §6 change S6-09 gives her a line for that save.

**`alarm_panel`** ((3, 2); the `alarm_panel` object). Name: "Alarm Board". Observations only (no `text`). Carries: whether the bunker below knows 0x00 is in, which the player can check against their own choices at the door. Changed by: the tripwire, the shown branch's override, the crank. `breach_announced` is OT §16's: set by HaX's mapping on `breach_open` where `!nightshade_tethered`.

1. `globalVars.security_alerted === true`: "Every lamp on the board is lit. TUNNEL INNER DOOR: FORCED. LOCKED FROM DESK. A strip printed out of the side of it: RAID ON THE TUNNEL ROUTE. ALL LEVELS."
2. `globalVars.override_held === true`: "The lamps from the tunnel down are dark. Nightshade's override has cut the board off from the floors below. Nothing it sees goes down the stair."
3. `globalVars.breach_announced === true`: "BLAST DOOR 1: OPEN, BY BADGE. AGENT 0x00. The lamp for the lower levels is lit: they've been told you're in, and told to let you through."
4. Default (the crank): "BLAST DOOR 1: OPEN. NO BADGE READ. The lower levels' lamp is dark. As far as this board knows, nobody has come in."

**`door_log`** ((7, 5), `as-type:cctv_monitors`; readable, `gameDisplay`; `onRead.setVariable: { clue_door_log: true }`). Name: "Monitoring Desk: Door Log". Observations (default): "The monitoring desk's log for the core level's two doors. Their desk reads it to you now." Carries: **clue 1**: at 02:10 the core's service door opened to Malhotra's badge, and it names nobody else. Changed by: flag 1 (safety only: the breach already needs flag 1), m09's naming of WREN.

Default `text` (the whodunit running):

```
TOMB GAMMA MONITORING. CORE LEVEL DOOR LOG.
Readers: outer lock (gallery); service door (core, east wall).
From 21:00 UTC, day 12.

22:00  OUTER LOCK     shift code    gallery shift on, 3
22:00  SERVICE DOOR   locked        standing order
02:10  SERVICE DOOR   SAFETYNET     D. MALHOTRA    OPEN
02:10  SERVICE DOOR   held open     alarm silenced at this desk, standing order
02:11  SERVICE DOOR   held open     no further reads
```

Variants, same for both, in this order:

1. `!globalVars.flag1_submitted`: observations "The monitoring desk's door log. Locked to their desk's own login." Text: "Locked to their desk's own login."
2. `globalVars.m09_recruiter_offer === 'double_crossed'`: the header, then:

```
21:47  SERVICE DOOR   SAFETYNET     H. KOWALCZYK   IN
21:48  SERVICE DOOR   locked        standing order
22:00  OUTER LOCK     shift code    gallery shift on, 3
No further reads.
```

3. `globalVars.m09_recruiter_offer === 'taken'`: the header, the two 22:00 lines, then "No further reads." (FA §4.4: no 02:10 entry.)

On the double-cross the whodunit is off; the entry is lore and a sting (she used her own badge and didn't hide it), and HaX may name it (stage 7).

**`duty_handset`** ((5, 5)). Name: "Duty Handset". Observations: default "The desk phone. Ringing." Variant `globalVars.ghost_call_done === true`: "The desk phone. Quiet now. The line's still open, and nobody's on it."

**`records_cupboard`** ((1, 4); `lockType: pin`, `requires: "2817"`, `locked: true`; contents `gallery_rota`, `alarm_log`). Name: "Records Cupboard". Observations: "An old steel records cupboard with a newer keypad bolted to the door. The keypad is the make the Citadel uses on its annex doors." (Vector's "annex standard" line has something to stand on, and a player who never meets Vector gets the same hint.)

**`gallery_rota`** (in the cupboard; `type: notes`, takeable, readable, `onRead.setVariable: { gallery_rota_read: true, lock_guard_known: true }`). Name: "Gallery Shift Rota". Carries: the lock guard's name and that he carries the code card (a boss-key clue for the outer lock, FA §4.0 way 3). Changed by: nothing.

```
GALLERY. NIGHT SHIFT, DAYS 10 TO 16.
22:00 to 06:00 UTC. Three on.

Lock end: S. FONOTI. Carries the shift code card. The card stays on the walkway.
Monitor post: B. HAUGEN.
Floor post: F. QURESHI.

Nobody opens the lock for anybody without the card or the word from below.
```

**`alarm_log`** (in the cupboard; `type: notes`, takeable, readable). Name: "Alarm Log, Refit to Date". Carries LORE: the readers loaded from the stolen personnel index (FA M-04), the hand crank kept, the purge circuit and his rule for it (sets up Scorched Earth), the dummy camera (m10 change 36), and the standing order on the service door. None of it names or points at WREN. Changed by: nothing.

```
ALARM LOG. TOMB GAMMA. REFIT TO DATE.

Refit, week 9. Blast door 1 rehung. Hand crank kept in the frame, original.
Refit, week 31. Core purge circuit fitted. Trips on the loss of both copies, ours and theirs. Doors cycle, lights out, suppression dumps.
Refit, week 32. Purge test 1 of 3. Passed.
Refit, week 33. Purge test 2 of 3. Passed. On the test sheet, in his hand: Both copies, or nothing.
Refit, week 34. Purge test 3 of 3. Passed. Circuit armed.
Refit, week 40. Camera bracket over the service door. Camera not wired. Do not wire it.
Twelve days ago. Reader table reloaded from a new personnel table: 1,206 SAFETYNET badges. The service door takes any of them. Blast door 1 takes one, by name.
Day 12, 20:00. Standing order from below: the service door stays shut until told. Alarms on it silenced at this desk.
```

**`fitter_locker`** ((1, 6); `lockType: key`, pickable, easy pins; contents `fitter_spare_card`, §1.10). Name: "Fitter's Locker". Observations: "The shift fitter's locker, dented, a cheap lock on it. Stencilled: FITTER. SPARES."

**`clock_security`**: §1.9.

### 1.4 Workshop floor

**`casualty_sheet`** ((4, 2); readable, `gameDisplay`, `addToNotes: true`; `onRead.setVariable: { casualty_sheet_read: true }`). Name: "Casualty Sheet". Observations: "His casualty sheet, pinned above the bench where the people who build his tools can see it. Someone has written in the margin, and he has signed under it." Carries: **the first rebuttal** (exchange 1: someone corrected his sheet upwards and he signed the old number), and Voltage's talk-down on the escaped branch ("This one's wrong by a thousand."). The body is m09's flag 4 sheet word for word (m09 SE, "The casualty sheet", the text on `mirror_job_printout`), so a player who read the original in Helena sees the same page with two additions. Changed by: nothing.

```
Printing 3. Refit model.

Projected deaths attributable to the Publication, first thirty days.
Release by key, all cities: 1,100 to 2,600.
Fallback by city: fewer, later.
Principal causes: hospital systems (dispatch, infusion, records); grid control; water treatment.
Assumes the cells move first. An acceptable price for the last arms race. -- A.

In the margin, in a second hand, small and square: Hospital recovery is counted twice. This understates. A.A.

Under it, in the first hand: Seen. -- A.
```

(Checked against m09 stage 6's `mirror_job_printout`: the same five lines, the same line breaks, without m09's bold heading, which is a notes-markdown device on m09's printout and not part of his sheet. m09's "Release configuration" paragraph belongs to the printout, not to the sheet, so the bench copy leaves it out.)

Whose initials (A35, settled): Asante's, "A.A.", and his second signature under them. The plain correction says *that* it is low and that someone else said so, which is all the rebuttal's plain form needs ("[Someone corrected your sheet upwards, and you signed the old number.]"). It doesn't say by how much or who: those are the decode's reward.

**`casualty_margin_note`** ((6, 2); readable, `gameDisplay`, `addToNotes: true`). Name: "Margin Strip". Observations: "A strip torn from the same printout and pinned beside it. Letters in the same small, square hand, and none of them make words." Carries: the coded note, Base64, which decodes in the start kit's CyberChef workstation (operation "From Base64", one step) to a message that names Asante, gives the corrected range and the key to her model. Changed by: nothing. No `onRead` (reading the coded strip proves nothing; the decode is proved at the terminal, below).

Text (the coded line is one unbroken string, 176 characters, checked against the B2 list: letters, digits and a trailing `==` only):

```
Pinned beside the sheet, in the small square hand:

UmVjb3ZlcnkgY291bnRlZCB0d2ljZSwgaG9zcGl0YWwgcm93cy4gVHJ1ZSByYW5nZSAyLDEwMCB0byAzLDYwMC4gTXkgbW9kZWwgaXMgb24gdGhlIGJlbmNoIHRlcm1pbmFsLCBrZXkgRE9VQkxFQ09VTlQuIEFiZW5hIEFzYW50ZQ==
```

Decoded (verified with `base64 -d`): "Recovery counted twice, hospital rows. True range 2,100 to 3,600. My model is on the bench terminal, key DOUBLECOUNT. Abena Asante"

Why Base64: it is the first-week encoding (m01, m08's "same tricks as your first week"), one step, so the finale's only hands-on decode outside the VM is quick ("fun and educational, not hard"), and it carries a real lesson the scene makes for itself: she hid a password in the margin by encoding it, and encoding is not encryption.

**`model_terminal`** (new, S6-02; on the west bench, suggested (0, 7), one tile clear of `clock_workshop` at (0, 5); `type: pc`, `locked: true`, `lockType: password`, `requires: "DOUBLECOUNT"`; contents `asante_model`). Name: "Bench Terminal: Casualty Model". Observations: "A bench terminal with one file waiting behind a password prompt: CASUALTY MODEL, CORRECTED." Carries: the decode's proof. Without it nothing in the engine can know the player decoded the strip (the workstation emits no event), so `margin_note_read` and `decode_the_margin` (OT §2–3) had no trigger. Password locks are case-sensitive with a case hint; the key is written in capitals in the decode.

**`asante_model`** (inside `model_terminal`; `type: notes`, takeable, readable, `onRead.setVariable: { margin_note_read: true }`). Name: "Asante's Corrected Model". Carries: the rebuttal's decoded form ("[Asante corrected your sheet, and you signed under her initials.]"), the size of the error, and that he knew.

```
CASUALTY MODEL, CORRECTED. A. ASANTE, SYSTEMS.

The model credits hospital recovery once in the infusion rows and again in the dispatch rows. It is the same recovery. Counted once:

Release by key, all cities, first thirty days: 2,100 to 3,600.
Fallback by city: still fewer, still later.

Sent to him with printing 3. He thanked me. He signed the old number.
```

**`bench_log`** ((3, 6); readable, `gameDisplay`, `addToNotes: true`; `onRead.setVariable: { clue_bench_log: true }`). Name: "Bench Log: Outgoing". Observations (default): "The bench's outgoing log, on a clipboard hung from a nail. Batches, quantities, and one line that isn't a batch." Carries: **clue 3**'s first half (a cloner shipped "to WREN" in Task Force Null's own breaching case, and the badge it copied at 01:58), and the cracker canon's bench half: crackers go out by supplier batch with no end user, which is why a bench-made cracker proves nothing (FA row 29). The four cracker batches match the incident file's "160 units, one supplier, four batches". The bench's only cloner on the log is WREN's, so nothing here says SAFETYNET's own cloners came off this bench. Changed by: m09's naming of WREN.

Default `text` (the whodunit running):

```
TOMB GAMMA. BENCH 3. OUTGOING.
Units go out by batch. Cloners report each read back to this bench.

BATCH   ITEM          QTY   TO
G-14    PIN cracker   40    Gallatin Instrument Supply, Bozeman
G-15    PIN cracker   40    Gallatin Instrument Supply, Bozeman
G-16    PIN cracker   40    Gallatin Instrument Supply, Bozeman
G-17    PIN cracker   40    Gallatin Instrument Supply, Bozeman
none    RFID cloner   1     WREN. By hand, packed with the raid's own kit: breaching case 2.

REPORTS IN, DAY 13.
01:58   cloner, WREN   1 read. SAFETYNET badge: D. MALHOTRA.
```

Variants, same for both:

1. `globalVars.m09_recruiter_offer === 'double_crossed'`: the WREN row reads "none    RFID cloner   1     WREN. By hand, for packing with the raid's kit. Not collected." and the reports read "REPORTS IN, DAY 13. None." (She walked off the apron at Helena before the case was packed.)
2. `globalVars.m09_recruiter_offer === 'taken'`: the WREN row as the default; the reports read "REPORTS IN, DAY 13. None. The WREN unit was never switched on. Still in the case it went out in." (FA §4.4.)

**`cracker_rack`** ((8, 8); decor with observations). "Racks of half-built PIN crackers in matte casings. No stores labels. A batch sticker inside each battery door: G-19." (Row 29 lands without anyone saying it: the player's own cracker is "matte casing, no stores label", §1.10. Nobody is named, so it stays a suspicion beat, never a clue.)

**`clock_workshop`**: §1.9.

### 1.5 Power room

**`shutter_isolator`** (`as-type:aes_esd_station`; readable). Name: "Shutter Isolator". Carries: what the room is for, and afterwards what was done in it. Changed by: the cut, and the camera switch inside the by-hand cut.

- Default (RL's, before the cut): "A key switch and a breaker row. Whoever runs this room can cut it, or someone on the line can talk you through it."
- Variants, same for both, in order:
  1. `globalVars.gallery_shutter_cut === true && globalVars.gallery_camera_blinded === true`: "Key turned, breaker row down. GALLERY SHUTTER: ISOLATED. Under it, a smaller switch thrown the other way: GALLERY CAMERA: OFF."
  2. `globalVars.gallery_shutter_cut === true`: "Key turned, breaker row down. GALLERY SHUTTER: ISOLATED."

**`bypass_panel`** ((7, 2); dustable on the escaped branch). Name: "Bypass Panel". Observations only. Carries: the escaped-Voltage stand-down by print (FA rows 45, 53; S5-11). Changed by: m04 `voltage_escaped` and `voltage_print_on_bypass`, and tonight's dusting.

1. `globalVars.m04_voltage_escaped === true && globalVars.voltage_print_lifted === true && globalVars.m04_voltage_print_on_bypass === true`: "Dusted. One clean thumbprint, lifted. It matches the print you took off the bypass at Albion."
2. `globalVars.m04_voltage_escaped === true && globalVars.voltage_print_lifted === true`: "Dusted. One clean thumbprint, lifted. There's nothing on file to match it to."
3. `globalVars.m04_voltage_escaped === true`: "The refit's bypass panel, bolted over the 1960s switchgear. Whoever fitted it leaned on the cover. One thumbprint, clean, in the dust."
4. Default: "The refit's bypass panel, bolted over the 1960s switchgear. Smudged by every fitter who has touched it."

(`hasFingerprint` is a static key; RL's wiring gives the print only on the escaped branch, which is stage 9's to build. The text above never promises a print on the other branches.)

**`static_kit`** ((8, 7); shown only on `m04_static_left_alone`, RL). Name: "Tool Roll". Observations: "A tool roll left on the bench: pliers, a crimper, cable ties, and a Polish crossword half done. The strap is stencilled S." Carries: Static worked the refit and got out of Albion alone (FA row 46); HaX names him (stage 7).

**`clock_power`** (the load board): §1.9.

### 1.6 Server hall

**`plotting_board`** ((3, 2)–(7, 2); decor with observations). Name: "Plotting Board". "The 1960s plotting board, still on the wall: a map of a war that never came. Someone has run a strip of red tape across it, city by city, west to east. Seattle is first." Carries LORE: the release order is a map (the Publication's preparation in the old command room), and Seattle first (pays m07's `countdown_expired` line, "Seattle first. As scheduled.").

**`schedule_terminal`** ((14, 4); readable, `gameDisplay`, `addToNotes: true`). Name: "Release Schedule: Staging Copy". Carries: the Publication's two modes and its size (92,460 entries, m08's catalogue total), the channels, the cells' early-access orders with Zero Day's representative named (the evidence for recruited Victoria's confront option), the backdoor's size, and the first entries in plain words, one of them marked with SAFETYNET's own "retain" (the hoarding claim's evidence, in m09's disposition wording). Changed by: flag 2, m03 `victoria_fate`, m07 `team_assignment` / `team_redirected`.

Default (before flag 2): observations "The staging copy of the release schedule, behind the monitoring host's login." Text: "Behind the monitoring host's login. Nothing to read yet."

After flag 2, the text is assembled from four fixed blocks. Block A, every save:

```
THE PUBLICATION. RELEASE SCHEDULE, STAGING COPY.
92,460 entries, with working detail.
Fallback: 06:00 UTC, day 13, city by city. Key: all cities, one minute.

CHANNELS
1. Release servers, this site.
```

Block B, the backdoor (one of three):

- large: "2. Trojan Horse backdoor. 47 million systems. Queued batch: Seattle."
- small: "2. Trojan Horse backdoor. 14 million systems. Queued batch: Seattle."
- none: no line.

Block C, the early-access orders (one of two):

```
EARLY ACCESS, 04:00 UTC. Two shares, paid for the theft.
Zero Day. Collecting on site: V. STERLING. Resale not permitted.
Ransomware Incorporated. Collecting by its own arrangement.
```

with the Vos form reading "Zero Day. Collecting on site: P. VOS. Resale not permitted." ("Resale not permitted" is the line Vos is breaking, which arrested Victoria's call tells the player.)

Block D, every save:

```
FIRST ENTRIES. SEATTLE.
0001  Infusion pumps, a hospital group. The same flaw is live in 140 hospitals. SAFETYNET disposition: retain. Operational value. Catalogued three years ago.
0002  Dispatch software. One county's emergency calls.
0003  Water treatment controllers, a city utility. End of life. The vendor cannot fix them.
```

The nine variants, same for both, all prefixed `globalVars.flag2_submitted === true && `, in this order (the Sterling arms first, then Vos as the fall-through):

| # | Rest of the condition | Blocks |
|---|---|---|
| 1 | `globalVars.m03_victoria_fate === 'recruited' && globalVars.m07_team_redirected === true` | A, B small, C Sterling, D |
| 2 | `globalVars.m03_victoria_fate === 'recruited' && globalVars.m07_completed === true && globalVars.m07_team_assignment !== 'trojan_horse'` | A, B large, C Sterling, D |
| 3 | `globalVars.m03_victoria_fate === 'recruited'` | A, C Sterling, D |
| 4–6 | as 1–3 with `'escaped'` | the same, Sterling |
| 7 | `globalVars.m07_team_redirected === true` | A, B small, C Vos, D |
| 8 | `globalVars.m07_completed === true && globalVars.m07_team_assignment !== 'trojan_horse'` | A, B large, C Vos, D |
| 9 | (the prefix alone) | A, C Vos, D |

The backdoor conditions are FA §4.2's (the redirect also writes `trojan_horse`, so "redirected" is tested first and "Austin never covered" is `!== 'trojan_horse'` with `m07_completed`). Victoria's `arrested`, `ko` and `""` all read Vos, as FA row 42 has it. HaX reads entries 0001 to 0003 aloud and stops (SE §3.1); the screen holds the rest.

**`release_console_controls`** ((12, 4)). Name: "Release Console Controls". Observations: default "Locked to the staging copy." Variant `globalVars.flag2_submitted === true`: "The head-start feeds, and the backdoor's queue. HaX can work one feed from here: kill it, or follow it. Not both." (The click opens HaX's `console` knot, OT; this text only labels it.)

**`uplink_printer`** ((2, 7); readable, `gameDisplay`). Name: "Uplink Printer". Observations (default): "A printer by the west door, a draft in the tray with your photo on it, and a rota clipped to the corner." Carries: Social Fabric's story (FA row 84), whether it is running, and whether it names SAFETYNET and 0x00 (m05's "we'll be watching for their reply", row 66); the sign-off ties it to the Initiative's account, which is what the Helena letters were (m09 `cage_bin = letters`; HaX's line at this prop is stage 7's). Changed by: m07 Fracture, m05 `entropy_program_exposed`.

Default `text` (held; Fracture covered, or m07 never played):

```
SOCIAL FABRIC. DRAFT. HOLD FOR SIGNAL.

MASSACRE IN MONTANA
Agents with no insignia stormed a rural data centre tonight and opened fire on the night staff. Eleven dead at their desks, say families still waiting at the fence.

Photo: the agent who led them in. (Your photo, the one from the security office wall.)

Clipped to the corner:
MONTANA DESK. RELEASE ROTA. On the breach signal: three accounts per city, Seattle first.
STATUS: HELD. Awaiting signal.
For the Initiative's account.
```

Variants, same for both, in order:

1. `globalVars.m07_completed === true && globalVars.m07_team_assignment !== 'fracture' && globalVars.m05_entropy_program_exposed === true`: the default with the status line "STATUS: SENT 02:31 UTC. Running on 214 sites." and, after the photo line, "Sources name the unit as SAFETYNET's, and the agent as 0x00."
2. `globalVars.m07_completed === true && globalVars.m07_team_assignment !== 'fracture'`: the default with "STATUS: SENT 02:31 UTC. Running on 214 sites."
3. `globalVars.m05_entropy_program_exposed === true`: the default with the "Sources name…" line added.

02:31 is one minute after the breach (`t0230`), "as the raid starts". The 06:00 version on the executed ending is the forward post screen's (§1.9).

**`sealed_hatch`** ((17, 4); flag station, slice 2). Name: "Sealed Section Hatch". Observations: "The sealed section's maintenance hatch, painted shut in the sixties and opened again last year. The field kit's link is clipped to the frame."

**`hall_console`** (VM launcher): "The field console, racked between two of the old map tables." **`release_console`** (flag station, slice 1): "The release console. The staging copy of the schedule sits behind it."

**`clock_server_hall`**: §1.9.

### 1.7 Gallery

**`lock_keypad_plate`** ((9, 3); dustable, `fingerprintOwner: "gallery_shift"`; readable). Name: "Keypad Face Plate". Carries: the outer lock's four digits, the way through that needs nobody (FA §4.0 way 2). Changed by: tonight's dusting (`keypad_dusted`, HaX's mapping on `fingerprint_collected:gallery_shift`, OT §4.5).

- Default, both lists: "The keypad's face plate. Four of the keys look a shade duller than the rest."
- Variant `globalVars.keypad_dusted === true`, both lists: "Dusted. Four keys carry the oil: 0, 3, 6 and 8. Nothing else on the plate has been touched in weeks."
- **Stage 9's fallback** (OT §4.5: only if the cracker minigame doesn't run faster on four known digits): the dusted text gains one sentence, "The 6 is worn deepest, then the 0, then the 8, then the 3.", which is the code in order. Use it only if the browser check fails; without it the plate narrows the crack to 24 orders.

**`farah_chair`** ((4, 5); shown on `imran_outcome === 'talked_round'`, RL). Name: "Floor Post Chair". "A chair at the floor post, a coat over the back. Nobody in it." (Pays Imran's call; the guard's "Where's Farah? She was on till six." is the bark.)

**`slit_window`** ((3, 2); decor). "Slit windows down into the core. Bare concrete, one console, and the top of a grey head that doesn't look up."

**`clock_gallery`** (the lock panel): §1.9. The lock guard's code card: §1.10.

### 1.8 Core

**`key_console`** ((6, 3); a prop, no interaction; observations only). Name: "His Console". Never "release console" (R1D-M2).

1. `globalVars.database_outcome === 'published'`: "His console. The cover is up, and the key is down."
2. `globalVars.console_choice === 'stopped'`: "His console. The cover is down. The disarm's lamp is green."
3. Default: "His console. One key under a hinged cover, and his hand resting beside it."

**`core_files`** (new, S6-03; on the back wall beside the host terminal, suggested (4, 2), clear of the outer lock's approach at (1, 2); readable, `gameDisplay`, `addToNotes: true`). Name: "Core Host: File Index". Carries the core's LORE in one page: what was stolen and what it was used for, the vault line, the key's rule, the purge, his two closed workshops (m09's Tomb Alpha and Tomb Beta), and his notice. A player who reads it before his case has the whole Publication in his own filing. Changed by: flag 4, m09 `albion_notified`.

- Default: observations "His box's file index, behind the core host's own login." Text: "Behind the core host's own login."
- Variants, same for both, in order:
  1. `globalVars.flag4_submitted === true && globalVars.m09_albion_notified === true`: the index below with the notice line reading "notice, albion    Drafted nine years ago. Sent from Helena on day 12, by someone else."
  2. `globalVars.flag4_submitted === true`: the index below.

```
CORE HOST. FILE INDEX.

catalogue         92,460 entries. Theirs, with working detail.
personnel         Their staff index. 1,206 badges, loaded to the readers.
vault line        Open. Their end is the Citadel.
schedule          06:00 UTC, day 13. City by city. Seattle first.
early access      04:00 UTC. Two shares, paid for the theft.
key               One hand. One of theirs.
purge             Armed. Both copies, or nothing.
alpha             Closed. Papers to Helena.
beta              Closed. Server left running in Helena, on purpose.
notice, albion    Drafted nine years ago. Not sent.
reading, 0x00     A copy. The original is in Helena.
```

"One of theirs" is his rule for the key ("It has to be one of theirs."), set down before WREN comes through the door; it gives WREN no pronoun.

**`scorched_card`** ((5, 3); shown only on `ending === 'scorched'`, RL). Name: "His Card". "A card on the console's edge, in his hand: Afterwards, then." (His card is the only use of the word on Scorched Earth, FA §4.6; nothing else in this file prints it.)

**`service_door`** ((9, 5); a prop). Name: "Service Door". "The service door, east wall. Steel, a reader, and a camera on a bracket above it that has never once moved." (The dummy camera, m10 change 36; no state change, so it never shows the player whether the door was propped.)

**`core_host_terminal`** (flag station, slice 3): "The core host terminal. His box." **`core_console_vm`** (VM launcher): "The field console, racked by the host terminal. The last one."

**`clock_core`** (the key console's readout): §1.9.

### 1.9 The eight countdown objects

One per main-path room (OT §6, RL §2): readable, `readDisplay: "gameDisplay"`, `addToNotes: false`, the same `observationVariants` and `textVariants`, most advanced state first, built by OT §6's ERB helper `countdown_variants(prefix)` from the fixed pieces below. Every string is fixed; the helper only chooses which.

| Id | Name | Where |
|---|---|---|
| `clock_forward_post` | Table Screen | forward post |
| `clock_blast_door` | Blast Door Panel | blast tunnel |
| `clock_security` | Duty Screen | security office |
| `clock_workshop` | Shift Clock | workshop floor |
| `clock_power` | Load Board | power room |
| `clock_server_hall` | Release Console Screen | server hall |
| `clock_gallery` | Lock Panel | gallery |
| `clock_core` | Key Console Readout | core |

**The pieces.**

- **The time**, by `raid_clock`: `t0145` 01:45, `t0200` 02:00, `t0210` 02:10, `t0220` 02:20, `t0230` 02:30, `t0245` 02:45, `t0300` 03:00, `t0315` 03:15, `t0330` 03:30, `t0345` 03:45, `t0400` 04:00, `t0600` 06:00.
- **Line 1 before the lock** (every step up to `t0345`): `EARLY ACCESS 04:00 · RELEASE 06:00 UTC · NOW 01:45` (the time as above). The hour shows from the briefing (A22).
- **Line 1 at and after the lock** (`t0400`): `EARLY ACCESS: RELEASED · NOW 04:00`, or `NOTHING TO RELEASE · NOW 04:00` on `globalVars.head_start_out === 'none'`.
- **Lines 2 and 3**, only once `flag2_submitted` is true: `ZERO DAY: ` then, by `share_zero_day`, `LIVE` (`live`), `STOPPED` (`stopped`), `TRACED` (`traced`, before `t0400`), `OUT, TRACED` (`traced`, at `t0400` or later), `RELEASED` (`released`); and `SECOND BUYER: ` then, by `share_resale`, `LIVE`, `STOPPED`, `NONE`, `RELEASED`. "Ghost" never appears on a screen.
- **At 06:00** (`t0600`, only the forward post's screen is ever seen then): line 1 `RELEASE 06:00 UTC · NOW 06:00`, line 2 `RELEASE: DISARMED. NOTHING WENT AT SIX.`, then the two share lines as they stood at the lock.
- **Join** (`globalVars.database_outcome === 'published'`, first in every list): `RELEASED. ALL CITIES.` alone.

So, for example, the server hall's screen at 03:30 with Zero Day's share killed at the console and Ghost talked out of the sale reads:

```
EARLY ACCESS 04:00 · RELEASE 06:00 UTC · NOW 03:30
ZERO DAY: STOPPED
SECOND BUYER: STOPPED
```

and the lock panel as the lock opens on a save that traced Zero Day's share and never met a seller:

```
EARLY ACCESS: RELEASED · NOW 04:00
ZERO DAY: OUT, TRACED
SECOND BUYER: NONE
```

**Per-object additions** (observations only, so the `text` stays the clock and the helper stays one helper):

- **`clock_forward_post`**, first in its list, `globalVars.ending === 'executed'` (both lists, replacing the clock): the 06:00 screen, read by the player with no narrator line (MC §8.3):

```
SOCIAL FABRIC. LIVE.

SAFETYNET AGENT SHOOTS UNARMED MAN IN MONTANA BUNKER

(Your photo.)

A SAFETYNET agent shot a man in a converted Cold War bunker in Montana tonight. He was not moving. His hands were empty, and in plain sight.
```

  (It holds for both cold buttons, "where he sits" and "where he stands".) Headline, photo and the one true paragraph only; there is no "massacre" in it (FA §4.5). It goes out on every branch of the executed ending (running: updated; held: sent), so it has no Fracture variant.
- **`clock_blast_door`** observations, in order: `globalVars.breach_announced === true`: "The door's panel. OPENED FOR: AGENT 0x00. Under it, the clock."; `globalVars.breach_open === true`: "The door's panel. MANUAL. NO READ. Under it, the clock."; default: "The door's panel. READER ARMED, ONE NAME. Under it, the clock." (The panel says by name whether the bunker knows the player is in.)
- **`clock_gallery`**: "The lock panel, three paces short of the door." (A32.)
- **`clock_core`**: "The key console's readout, a hand's width from the key." (It shows the lock's beat while they talk; nothing in its text says he paused anything, m10 change 37.)

### 1.10 Items: the start kit and what the night hands over

**Kowalczyk's PIN cracker** (start kit, `type: "pin-cracker"`, `id: kowalczyk_cracker`). Name: "PIN Cracker (Kowalczyk's)". Never a clue (FA row 118); its casing is the suspicion beat at the cracker rack.

- Default observations (`m09_completed`, the usual case): "Matte casing, no stores label. Halina Kowalczyk handed it to you before Helena: 'This one's mine. Never been through stores.'"
- Variant `!globalVars.m09_completed`: "Matte casing, no stores label. Halina Kowalczyk handed it to you at the briefing: 'This one's mine. Never been through stores.'"

("Before Helena", not RL §4's "in Helena": in m09 she hands it over at the briefing in Task Force Null's room, before the flight. §6 change S6-08.)

The rest of the start kit (phone, CyberChef workstation, lock pick kit, RFID cloner, fingerprint kit) keeps each item's shipped name and text from m08/m09; nothing here changes them.

**`nightshade_payment`** (`type: notes`, takeable, readable, `onRead.setVariable: { payment_read: true }`; in `nightshade_table`'s `itemsHeld`, given at the table on the not-shown and dealt branches, RL §4). Name: "Nightshade's Payment: The Defences". Carries: the first payment (FA row 104), each defence with the catalogue entry it came from, and the one wrong entry, number 3, which says "original, unchanged" and contradicts entry 3 of Helena's plans (§1.1). Every other entry marked original matches the plans; the refit entries can't be checked against them and aren't wrong. So the check is a real comparison: an entry that claims to be the 1962 build, and isn't the 1962 build. The arrested branch's deal gives the same item: it is what he knew of the refit before Portland.

```
TOMB GAMMA. THE DEFENCES, AS HE BRIEFED THEM TO ME.
Each with the catalogue entry it was built from. Refit work is marked as refit. Everything else is the 1962 build.

1. Blast door. Refit reader on the original door, from SN-CAT 41077. Set to open for one badge by name. Yours.
2. Tunnel post. Refit. One guard. Shift change at 02:30; the post stands empty till 02:45.
3. Tunnel inner door. Original, unchanged since 1962. Plain steel, no interlock. Open it from the tunnel by hand.
4. Security office alarm board. Refit board on the original wiring, from SN-CAT 38820.
5. Stair B. Refit reader, on the duty desk's system.
6. Power room door. Refit reader, staff cards, from SN-CAT 52213.
7. Gallery shutter. Original, unchanged. Fed from the power room.
8. Outer lock. Refit keypad. A shift code; the walkway guard carries it.
9. Service door, core. Refit reader. The camera over it is for show.

Every one of them came out of your own catalogue. I'd know. I chose what you went in without.
```

On the shown branch Nightshade gives no payment item; he says the defences aloud, names entry 3 as the lie he was given to pass on, and hands over the override (MC §3.1).

**`alarm_override`** (in `nightshade_table`'s `itemsHeld`, shown branch; `onPickup.setVariable: { override_held: true }`). Name: "Nightshade's Override Key". Observations: "A brass key on a paper tag. On the tag, in his hand: Security office board. Two turns to the left before you go down, and they won't hear a thing below." (Stage 9 checks that a `#give_item` fires `onPickup`; if not, the giving line also sets `override_held`.)

**`fitter_spare_card`** (in `fitter_locker`; `type: keycard`, `card_id: "tg_power_room_card"`). Name: "Spare Power-Room Card". Observations: "A spare from the fitter's locker. Taped to it, in marker: POWER RM. SPARE. SIGN FOR IT. Nobody has."

**`gallery_code_card`** (in `lock_guard`'s `itemsHeld`, dropped on a knock-out or given in his ink; `type: notes`, takeable, readable). Name: "Gallery Shift Code Card".

```
TOMB GAMMA. GALLERY, NIGHT SHIFT.
Outer lock: 6083.
This card stays on the walkway.
```

**`vos_code_card`** (in `vos`'s `itemsHeld`, given on "[Deal.]"; `type: notes`, takeable, readable). Name: "Visitor's Code Card".

```
TOMB GAMMA. VISITOR: ZERO DAY.
Outer lock: 6083.
Tonight only.
```

**`gallery_rota`**, **`alarm_log`**: §1.3. **`asante_model`**: §1.4. The three code notes items (`ghost_cupboard_code`, `vector_cupboard_code`, `ghost_lock_code`): §2.

### 1.11 Flag stations: the wrong-station hints

Each station's `hintOnlyFlags` is a Hash keyed by the other three `"<vm>:flag_N"` references (RL §2). The message is the same wherever the wrong flag is entered, so four fixed strings cover all twelve keys:

| Flag | Message |
|---|---|
| flag 1 | "That one goes in at the gate terminal, up at the forward post." |
| flag 2 | "That one goes in at the release console in the server hall." |
| flag 3 | "That one goes in at the sealed section's hatch, at the east end of the server hall." |
| flag 4 | "That one goes in at the core host terminal." |

## 2. Codes, notes items, item ids, names and the incident file

### 2.1 The codes, one value per lock

| Lock | Type | Value | Where the player gets it | Why this value |
|---|---|---|---|---|
| `records_cupboard` (security office) | `pin`, `requires: "2817"` | `2817` | Ghost on the kept branch (`ghost_cupboard_code`); Vector where present (`vector_cupboard_code`); or the cracker | One value, so Ghost's and Vector's codes are the same four digits (A34). Vector's line is that ENTROPY copied the Citadel's annex lock and kept its master code; Ghost has been inside SAFETYNET's networks since St. Catherine's (FA row 16), so both knowing one annex master is the same fact seen twice. No pattern a player could guess (not a year, not a run, not a repeat). |
| outer lock (`gallery` → `core`) | `pin`, `requires: "6083"`, `difficulty: hard` | `6083` | the lock guard's code card (`gallery_code_card`), Vos's copy (`vos_code_card`), Ghost's refused-branch gift (`ghost_lock_code`), the dusted keypad plate's four worn keys, or the cracker | Four different digits, so the plate shows four worn keys and nothing repeats (OT §4.5's "wear order = code order" fallback stays possible). One value for the card, the note and the plate. |
| `model_terminal` (workshop; new, S6-02) | `password`, `requires: "DOUBLECOUNT"` | `DOUBLECOUNT` | the margin strip, decoded (From Base64) | A word for what the error is. Upper case in the decode, so the case hint rarely fires. |
| `fitter_locker` (security office) | `key`, pickable, no key item | none | the lock pick | RL's fifth expected validator warning. |
| power-room door | `rfid`, `requires: tg_power_room_card` | card id | Imran's or Gary's card (clone or given), or `fitter_spare_card` | RL. |
| the four story doors | `rfid`, `requires: tg_story_lock_<room>` | none exists | HaX's `unlockDoor` mappings | OT §4. |

Every value above is checked against the B2 list: digits and capitals only.

### 2.2 The notes items (OT §4.2, RL §2.1 and §2.3; F21: given with `#give_item`, never `#add_note`)

| Item id | Held by | Given | `name` | `text` |
|---|---|---|---|---|
| `ghost_cupboard_code` | `ghost_phone` | kept branch, on Ghost's last line | "Records cupboard: Ghost's code" | `2817` |
| `vector_cupboard_code` | `vector_so` | in Vector's ink, at the cupboard | "Records cupboard: Vector's code" | `2817` |
| `ghost_lock_code` | `ghost_phone` | refused branch, on the "[I don't buy from people who hold hospitals.]" answer only | "Outer lock: maintenance code" | `6083` |

Each `text` is the four digits alone, as OT §4.2 and RL §2.1 fix the format (the `name` carries what and whose). All three are `type: notes`, `takeable: true`, `readable: true`. Ghost's card answer gives no item (A2): the name is spoken and sets `lock_guard_known`.

### 2.3 Item ids in m10

m10 has no `collect_items` task (OT §2), so there are no `targetItemIds` to match (FA §13 B3); the ids below only have to agree across RL, OT, the ink's `#give_item` and the ERB. Existing ids (RL, OT) are kept; the new ones are marked.

| Id | Type | Held by / found in | Section |
|---|---|---|---|
| `kowalczyk_cracker` (new id for RL's start-kit cracker) | `pin-cracker` | start kit | §1.10 |
| `nightshade_payment` | notes | `nightshade_table` | §1.10 |
| `alarm_override` | key | `nightshade_table` | §1.10 |
| `fitter_spare_card` (new id for RL's "spare `tg_power_room_card` keycard") | keycard, `card_id: tg_power_room_card` | `fitter_locker` | §1.10 |
| `gallery_code_card` (new id for "the lock guard's code card") | notes | `lock_guard` | §1.10 |
| `vos_code_card` (new id for "Vos's own copy") | notes | `vos` | §1.10 |
| `gallery_rota` | notes | `records_cupboard` | §1.3 |
| `alarm_log` (new id for "the night's alarm log") | notes | `records_cupboard` | §1.3 |
| `asante_model` (new) | notes | `model_terminal` (new) | §1.4 |
| `ghost_cupboard_code`, `vector_cupboard_code`, `ghost_lock_code` | notes | `ghost_phone`, `vector_so` | §2.2 |
| `incident_file` (new object, readable in place) | readable | forward post | §1.1 |
| `core_files` (new object, readable in place) | readable | core | §1.8 |

### 2.4 The lock guard: Sione Fonoti

**Sione Fonoti**, 34, Samoan-American, from West Valley City, Utah; a former college lineman who does night security because it pays and nobody asks; big, slow to speak, polite. Hired muscle like the rest of Tomb Gamma's guards: told to let one agent through to the core and nothing about why. NPC id `lock_guard` (RL), `displayName` "Sione Fonoti"; on paper "S. Fonoti" (the gallery rota). Varied against the m10 cast (no other Pacific Islander in the season) and against the m09 guards (Cody Old Coyote, 24, Apsáalooke; Lyle Dillard, 54, white Montanan, m09 stage 6 §5). Grepped across `scenarios/`, `story_design/`, `planning_notes/` and `docs/` on 2026-10-21: no hits for "Fonoti" or "Sione".

Where the name is used: the gallery rota (§1.3); Ghost's card gift ("Then don't trust me. Check it." follows the name; stage 7 writes "The one at the lock end. Fonoti."); escaped Victoria's trade ("which of these two has the code card", named on "[Go.]"); Vos's deal ("That guard has the code card."; on "[Deal.]" he names him as he hands over his own copy); and his own ink. The pointer bark stays in the first person and doesn't name him ("That takes the shift code. It's on my card, and it stays there.", A13).

The other names on paper, none of them on screen as NPCs with names: B. Haugen (the gallery's monitor post, `monitor_guard`), F. Qureshi (Farah, FA §5.2), J. Kiel and T. Abara (the tunnel rota), Gallatin Instrument Supply of Bozeman (the bench's front supplier, rolled up on Imran's taken-in branch). All grepped, no hits.

### 2.5 The Citadel's incident file

**Named and written** (FA §13 10-3, §8 r11, F7, D-13): **Citadel Incident File V-47**, object `incident_file` on the forward post's kit table (§1.1; §6 S6-01). It is the raid's own copy of the Director's file on the theft, which is why it is at the forward post and why it is plain: it states the vault line left open as a trace on Netherton's signature, which is the canon F7 asks to be written down, a day and a room before HaX's flag 4 line ("And the line into our vault is open from here. We left it open.") cashes it. It also carries the stores half of the cracker canon (FA §13 B1): stores withdrew every cracker Nightshade signed for, 160 units from one supplier in four batches, and the bench log's batches G-14 to G-17 are those four. Kowalczyk's own cracker, the cloner logged "to WREN" and the "logged by batch, no recipient" rule live in the bench log (§1.4) and the cracker's description (§1.10), so the canon note is complete across three m10 objects and needs no m09 object.

**For m09** (B1's other half): m09 stage 1 asked for the cracker canon "in the Citadel's incident file", which no m09 object carries. m09 claims nothing about where crackers are made (FA §9, stage 1–2 rulings), so the note is dropped from m09; m10's incident file is its home. §6 S6-10.

## 3. The closing card and the credits

### 3.1 How the six entries are built

OT §7 has one music entry per closing NPC and ending value, each on `conversation_closed:<npc>` with `globalVars.closing_done === true` and its ending, each carrying `closingCard` and `credits` in the F14 format (README "Closing card and credits"; `music/closing-sequence.js`). So each ending's card and credits are written for that ending, and only the lines that vary inside an ending carry conditions:

| Entry | Trigger | Card | Credits title | Teaser |
|---|---|---|---|---|
| E1 | `six_oclock`, `ending === 'arrest'` | A-arrest, D, H, C, U | MISSION COMPLETE | yes |
| E2 | `six_oclock`, `ending === 'surrender'` | A-surrender, D, H, C, U | MISSION COMPLETE | yes |
| E3 | `six_oclock`, `ending === 'lethal'` | A-lethal, D, H, C, U | MISSION COMPLETE | yes |
| E4 | `six_oclock`, `ending === 'executed'` | A-executed, D, H, C, U | MISSION COMPLETE, then AGENT 0x00: IN CUSTODY | no |
| E5 | `hearing`, `ending === 'scorched'` | A-scorched, D, H, C, U | MISSION COMPLETE, then AGENT 0x00: SUSPENDED | yes |
| E6 | `citadel`, `ending === 'joined'` | Join's three lines (§3.6) | MISSION FAILED | no |

**The card shows the first five lines that hold, in order** (README), so each block below is written to be mutually exclusive: exactly one line of A, D, H and C holds on every save, and U holds once or not at all. The card is therefore four or five lines, never more, and nothing is ever dropped by the cap.

**The teaser** (FA §7): on E1, E2, E3 and E5 only, `"teaser": { "enabledBy": "teaser_enabled", "lines": [] }`. The lines are the user's to write when the content is decided; with `teaser_enabled` false (the default) the slot shows nothing. No other string in this file anticipates it.

**The credits** in each entry, in order: the title line(s) (`style: title`, the second line `style: warning`); `FULL DISCLOSURE` (`style: subtitle`); a blank line; the section `IN THIS OPERATION` (§3.3); the section `THE CELLS` (§3.4; not on E6); the section `ELSEWHERE` (§3.5). A section's heading prints only if one of its lines does.

**Shared JavaScript.** Several conditions repeat. Stage 9 defines them once as Ruby string constants at the top of the ERB and interpolates them into each condition, so the built JSON holds plain fixed strings and the definitions can't drift:

| Name | JavaScript |
|---|---|
| `AUSTIN_UNCOVERED` | `globalVars.m07_completed === true && globalVars.m07_team_assignment !== 'trojan_horse'` |
| `OP1` (Victoria's watch) | `globalVars.m03_victoria_fate === 'recruited' && (globalVars.victoria_gallery === 'confronted' \|\| globalVars.victoria_gallery === 'refused' \|\| (globalVars.victoria_gallery === 'trusted' && globalVars.head_start_killed === 'zero_day'))` |
| `OP2` (Nightshade's channel) | `globalVars.m08_nightshade_triple_agent === true && !globalVars.m09_nightshade_shown_file` |
| `OP3` (the HashChain tags) | `globalVars.m06_monitoring_enabled === true` |
| `OP4` (the Critical Mass watch) | `globalVars.m09_completed === true && !globalVars.m09_albion_notified` |
| `CELL_CONSOLE` | `((globalVars.head_start_killed === 'ghost' && globalVars.ghost_sale === 'bait') \|\| globalVars.share_zero_day === 'traced')` |
| `CELL_M07` | `(!globalVars.m07_completed \|\| globalVars.m07_team_assignment !== '')` |
| `CELL_COUNT` | `((CELL_CONSOLE ? 1 : 0) + (globalVars.database_outcome === 'secured' ? 1 : 0) + (globalVars.ending === 'surrender' ? 2 : 0) + (CELL_M07 ? 1 : 0))` |
| `M07_FRACTURE` / `M07_MELTDOWN` | `globalVars.m07_completed === true && globalVars.m07_team_assignment === 'fracture'` / `'meltdown'` |
| `M07_AUSTIN` | `(!globalVars.m07_completed \|\| globalVars.m07_team_assignment === 'trojan_horse')` (never played reads Austin covered, FA §3) |
| `FORTY_SEVEN_WARNED` / `_LATE` | `globalVars.m05_found_pipeline_list === true && !globalVars.m05_recruiter_deal_accepted` / `globalVars.m05_found_pipeline_list === true && globalVars.m05_recruiter_deal_accepted === true && globalVars.m05_recruiter_deal_confessed === true` |
| `MERCER_HERE` | `globalVars.m07_completed === true && !globalVars.m07_mercer_ko && globalVars.m07_mercer_fate !== 'arrested'` (FA row 87) |

(The `\|` in this table is the markdown escape for a JavaScript `||`; the built JSON holds `||`. These are conditions, not coded strings, so B2 doesn't apply to them; no condition is quoted in ink.)

`OP1`'s `trusted` arm is the test FA §4.1 step 4 names: trusted only counts while Zero Day's share was already dead, which only the console can have done before the gallery.

### 3.2 The closing card

**A, the Architect** (one line per entry, no condition inside it):

| Entry | Line |
|---|---|
| E1 arrest | "Dr Adrian Tesseract: in a cell. Awaiting trial." |
| E2 surrender | "Dr Adrian Tesseract: cooperating. No trial." |
| E3 lethal | "Dr Adrian Tesseract: dead at his console, reaching for the key." |
| E4 executed | "Dr Adrian Tesseract: shot unarmed." |
| E5 scorched | "Dr Adrian Tesseract: at large, with what he remembers." |

**D, the database** (E1–E5; by `database_outcome`; on E5 it is always `both_wiped`):

| Condition | Line |
|---|---|
| `globalVars.database_outcome === 'secured'` | "The database: in the vault, both copies. Infusion pumps in 140 hospitals: still unpatched." |
| `globalVars.database_outcome === 'disclosed'` | "The database: with the vendors. Forty have acknowledged. Fixes due in ninety days." |
| `globalVars.database_outcome === 'both_wiped'` | "The database: gone, both copies. Nobody holds the map." |

**H, the head start** (by `head_start_out`, set at the outer lock on every save, and `share_zero_day`, which keeps `traced` after the lock, S4-17):

| Condition | Line |
|---|---|
| `globalVars.head_start_out === 'none'` | "The head start: stopped. The cells got nothing." |
| `globalVars.head_start_out === 'zero_day' && globalVars.share_zero_day === 'traced'` | "The head start: Zero Day's share went out, followed." |
| `globalVars.head_start_out === 'zero_day' && globalVars.share_zero_day !== 'traced'` | "The head start: Zero Day has it." |
| `globalVars.head_start_out === 'ghost'` | "The head start: the resale share went out." |
| `globalVars.head_start_out === 'both' && globalVars.share_zero_day === 'traced'` | "The head start: both shares went out. One was followed." |
| `globalVars.head_start_out === 'both' && globalVars.share_zero_day !== 'traced'` | "The head start: two cells have it." |

"Ghost" is never on the card; the second share is "the resale share" (MC §10).

**C, the cells: the count and one name** (FA §4.6's fixed rule; MC §10). The name is the first that applies of: surrender's two, secure's one (by the operation it rode), the console's one, m07's one. Each name is written for two sentence positions. The line is built from fixed pieces, so the ERB helper `cells_card_lines` writes one line per (name, count) pair, each with the name's condition `&& CELL_COUNT === n`; the built JSON holds only fixed strings.

Names, with their conditions (mutually exclusive, in this order):

| Name (after "among them") | Name (sentence start, for a count of one) | Condition |
|---|---|---|
| the cells' couriers | (never one: surrender gives two) | `globalVars.ending === 'surrender'` |
| Zero Day's UK desk | Zero Day's UK desk | `globalVars.ending !== 'surrender' && globalVars.database_outcome === 'secured' && OP1` |
| the Initiative's procurement desk | The Initiative's procurement desk | `… secured && !OP1 && OP2` |
| the Crypto Anarchists' reserve | The Crypto Anarchists' reserve | `… secured && !OP1 && !OP2 && OP3` |
| Critical Mass | Critical Mass | `… secured && !OP1 && !OP2 && !OP3 && OP4` |
| the order book's largest buyer | The order book's largest buyer | `… secured && !OP1 && !OP2 && !OP3 && !OP4` |
| the resale share's five buyers | The resale share's five buyers | `globalVars.ending !== 'surrender' && globalVars.database_outcome !== 'secured' && globalVars.head_start_killed === 'ghost' && globalVars.ghost_sale === 'bait'` |
| Zero Day's four buyers | Zero Day's four buyers | `globalVars.ending !== 'surrender' && globalVars.database_outcome !== 'secured' && globalVars.share_zero_day === 'traced'` |
| Michael Reeves's cell | Michael Reeves's cell | `globalVars.ending !== 'surrender' && globalVars.database_outcome !== 'secured' && !CELL_CONSOLE && M07_FRACTURE` |
| Marcus Ashford's cell | Marcus Ashford's cell | the same with `M07_MELTDOWN` |
| Jennifer Walsh's cell | Jennifer Walsh's cell | the same with `M07_AUSTIN` |
| (none) | – | `globalVars.ending !== 'surrender' && globalVars.database_outcome !== 'secured' && !CELL_CONSOLE && !CELL_M07` |

(`…` stands for `globalVars.ending !== 'surrender' && globalVars.database_outcome === 'secured'`.)

The line's three forms:

- count 0 (only the last row): "Cells broken: none."
- count 1: "Cells broken: one. " + the sentence-start name + "." (for example "Cells broken: one. Jennifer Walsh's cell.")
- count 2 to 5: "Cells broken: " + the word (two, three, four, five) + ", among them " + the name + "." (for example "Cells broken: three, among them the cells' couriers.")

The count includes m07's cell, so it is the season's cells broken in the work that led here, not tonight's alone, which is why the line says "broken" and not "tonight". m07's cell counts where its site was covered: Fracture (Michael Reeves's), Meltdown (Marcus Ashford's) or Austin, direct or redirected (Jennifer Walsh's); never played reads Austin covered (FA §3), and `m07_completed` with no team committed adds nothing. The credits' THE CELLS section (§3.4) lists every one by name.

**U, one human line** (MC §10's precedence, with one change, S6-11): the first that applies; each later line carries the earlier ones' negations, so at most one holds.

| # | Condition | Line |
|---|---|---|
| 1a | `AUSTIN_UNCOVERED && globalVars.database_outcome === 'disclosed'` | "Dispatch in eleven counties: a vendor workaround by the weekend. The fix is due in ninety days." |
| 1b | `AUSTIN_UNCOVERED && globalVars.database_outcome !== 'disclosed'` | "Dispatch in eleven counties: still dropping calls. Day thirteen." |
| 2a | `!(AUSTIN_UNCOVERED) && globalVars.m04_completed === true && globalVars.m04_disclosure_choice === 'full' && globalVars.m09_albion_notified === true` | "Albion's inquiry asked who funded the plant's security. Parliament answered. It also asked SAFETYNET when it knew. SAFETYNET answered." |
| 2b | the same with `&& !globalVars.m09_albion_notified` | "Albion's inquiry asked who funded the plant's security. Parliament answered." |
| 2c | `!(AUSTIN_UNCOVERED) && globalVars.m04_completed === true && globalVars.m04_disclosure_choice === 'partial' && globalVars.m04_crew_lost === true && globalVars.m09_albion_notified === true` | "The Albion inquest heard the rest. It also asked SAFETYNET when it knew. SAFETYNET answered." |
| 2d | the same with `&& !globalVars.m09_albion_notified` | "The Albion inquest heard the rest." |
| 2e | `!(AUSTIN_UNCOVERED) && globalVars.m04_completed === true && globalVars.m04_disclosure_choice === 'partial' && !globalVars.m04_crew_lost` | "Albion's half-statement still stands. Nobody audited the other sites." |
| 3a | `!(AUSTIN_UNCOVERED) && !(ALBION) && globalVars.m05_completed === true && FORTY_SEVEN_LATE` | "The forty-seven: twenty-eight reached in time. Nineteen had already signed." |
| 3b | `!(AUSTIN_UNCOVERED) && !(ALBION) && globalVars.m05_completed === true && !(FORTY_SEVEN_WARNED) && !(FORTY_SEVEN_LATE)` | "The forty-seven: none of them reached. They're still on a list." |
| 4 | `!(AUSTIN_UNCOVERED) && !(ALBION) && !(globalVars.m05_completed === true && !(FORTY_SEVEN_WARNED)) && globalVars.m05_elena_treatment_funded === true` | "Elena Torres is in treatment. It's working." |
| – | none holds | no line; the card runs four |

`ALBION` is `globalVars.m04_completed === true && (globalVars.m04_disclosure_choice === 'full' \|\| globalVars.m04_disclosure_choice === 'partial')`. The m09 half is added only where there is an inquiry (`full`, or `m04_crew_lost`), as FA row 59 has it.

**The change (S6-11).** In MC §10 the forty-seven applies on every `m05_completed` save, and `m05_elena_treatment_funded` is only ever true on an m05 save, so Elena Torres's line could never reach the card. Here the forty-seven takes the card only where some of them were not reached in time (late, or never); where every one was warned, the line falls through to Elena Torres. The precedence's reason holds: the forty-seven outrank her while any of them is still at risk. The "all reached" form keeps its home in ELSEWHERE.

### 3.3 In this operation

`{ "section": "IN THIS OPERATION", "people": [...] }`. One line per person, `NAME: clause`, the first clause that holds (README). People appear in the order the player meets them on the corridor, the player first and Tesseract last. A clause states an outcome, never the choice behind it (FA §4.6, m10 change 33). Where a person must always appear, the last clause has no condition ("always"); where a person can be absent, every clause has one. `style` is `entry` unless marked **(w)** for `warning`. The same section is used in all six entries; the arms for `executed`, `scorched` and `joined` sit inside it.

**AGENT 0x00**

1. `globalVars.ending === 'joined'` → "Pressed the key." (w)
2. `globalVars.m09_recruiter_secret === 'told'` → "Told their handler."
3. `globalVars.ending === 'executed'` → "Held until the board sits." (w)
4. `globalVars.ending === 'scorched'` → "Suspended." (w)

(No "always" clause: on most saves the player's line is the title. On `told` with an executed or scorched ending the title already carries the custody or the suspension, so the m09 payoff takes the line, FA §4.6.)

**DIRECTOR MAGNUS NETHERTON**

1. `globalVars.ending === 'joined'` → "Ordered 0x00 brought in."
2. `globalVars.ending === 'executed'` → "Signed nothing." (w)
3. `globalVars.ending === 'scorched'` → "Signed the suspension."
4. always → "Signed for all of it."

**AGENT HAX**

1. `globalVars.ending === 'joined'` → "Sent one word. Nobody answered." (w)
2. `globalVars.ending === 'executed'` → "Said one word. Will be at the board." (w)
3. `globalVars.ending === 'arrest' && globalVars.points_landed < 2` → "Killed the feed in time. Testifying."
4. `globalVars.ending === 'arrest'` → "Testifying."
5. `globalVars.ending === 'surrender'` → "Sat with him in the van for a minute. Told him who taught you."
6. `globalVars.ending === 'lethal'` → "Signed under her agent."
7. `globalVars.ending === 'scorched'` → "Stood beside her agent at the hearing."
8. always → "On the line to the end."

**NIGHTSHADE** (FA rows 104–107; every save has him in one form)

1. `globalVars.m08_nightshade_triple_agent === true && globalVars.m09_nightshade_shown_file === true && globalVars.nightshade_taken_in === true` → "Held the outer lock. Moved, and unreachable."
2. `globalVars.m08_nightshade_triple_agent === true && globalVars.m09_nightshade_shown_file === true && globalVars.ending === 'arrest'` → "Left at the post. On the trial's witness list."
3. `globalVars.m08_nightshade_triple_agent === true && globalVars.m09_nightshade_shown_file === true` → "Left at the post. Still useful."
4. `OP2 && globalVars.database_outcome === 'disclosed'` → "Moved by morning. Unreachable." (his channel is always one of the two disclosure burns, since only Victoria's watch can rank above it)
5. `OP2` → "Still at the table. Still paying, for now."
6. `globalVars.m08_nightshade_arrested === true && !globalVars.m08_nightshade_ko_before_fate && globalVars.nightshade_deal === 'taken'` → "Gave up the map. Sentence reduced."
7. `globalVars.m08_nightshade_arrested === true && !globalVars.m08_nightshade_ko_before_fate` → "No deal. Serving his full term."
8. `globalVars.nightshade_tethered === true` → "Said two words. Turned the crank."
9. always → "Said one word, from the van."

**AGENT 0x23 'VECTOR'** (only with `m08_completed`; `VEC_IN` = `globalVars.m08_completed === true && (!globalVars.m08_accused_vector || globalVars.m08_vector_apologised === true) && !globalVars.m08_vector_hostile`)

1. `VEC_IN && globalVars.vector_ko === true` → "Put on the floor by his own agent." (w)
2. `VEC_IN && globalVars.officer_out === 'vector'` → "Sent back on a wrong accusation." (w)
3. `VEC_IN && globalVars.vector_recalled === true` → "Sent back, then recalled."
4. `VEC_IN` → "Gave up the annex code. Asked for nothing."
5. `globalVars.m08_completed === true` → "Declined the raid. He said you would know why." (w)

**AGENT 0x88 'PHANTOM'** (the same pattern with `PHA_IN` from the Phantom imports)

1. `PHA_IN && globalVars.phantom_ko === true` → "Put on the floor by his own agent." (w)
2. `PHA_IN && globalVars.officer_out === 'phantom'` → "Sent back on a wrong accusation." (w)
3. `PHA_IN && globalVars.phantom_recalled === true` → "Sent back, then recalled."
4. `PHA_IN` → "Audited the case. One unit over."
5. `globalVars.m08_completed === true` → "Declined the raid. Netherton knows why." (w)

**MARISOL QUINTERO**

1. `globalVars.quintero_ko === true` → "Put on the floor by her own agent." (w)
2. `globalVars.officer_out === 'quintero'` → "Sent back on a wrong accusation." (w)
3. `globalVars.quintero_wounded === true` → "Took a shoulder wound at the core. Talking by six."
4. `globalVars.quintero_recalled === true` → "Sent back, then recalled."
5. `globalVars.wren_at_core === true && globalVars.quintero_enters_core === true` → "Took Kowalczyk at the core. Unhurt."
6. `globalVars.nightshade_tethered === true && globalVars.m09_sleeper_named === true` → "Breached ahead alone."
7. always → "Held the outer lock."

**HALINA KOWALCZYK** (named in credits only after the night's last scene, so naming her here gives nothing away; no pronoun is used)

1. `globalVars.m09_recruiter_offer === 'taken'` → "Named in Helena. Detained at the briefing."
2. `globalVars.m09_recruiter_offer === 'double_crossed'` → "Warned in Helena. Waiting at the core. Taken without a fight." (w)
3. `globalVars.sleeper_caught === true && globalVars.wren_at_core === true` → "Named on the line. Stopped at the core anyway."
4. `globalVars.sleeper_caught === true` → "Named. In the van by six."
5. `globalVars.ending === 'joined'` → "Never came through the service door. No need." (w)
6. `globalVars.wren_at_core === true` → "Came through the service door for the key. Stopped. Never named." (w)
7. `globalVars.kowalczyk_ko === true` → "Knocked out on the raid. Never named." (w)
8. always → "Never named." (w)

**OFFICER DEV MALHOTRA**

1. `globalVars.officer_out === 'malhotra'` → "Sent back on a wrong accusation." (w)
2. `globalVars.malhotra_recalled === true` → "Sent back, then recalled."
3. always → "Ran comms all night. His badge didn't."

**OFFICER KENJI ARAKAWA**

1. `globalVars.arakawa_ko === true` → "Put on the floor by his own agent." (w)
2. `globalVars.officer_out === 'arakawa'` → "Sent back. The county road went with him." (w)
3. `globalVars.arakawa_recalled === true` → "Sent back, then recalled."
4. `globalVars.nightshade_tethered === true` → "Held the blast door all night. Home for Saturday."
5. always → "Home for Saturday, with a telescope."

**GHOST** (every save)

1. `globalVars.m02_ghost_deal_accepted === true && globalVars.m02_exposed_hospital === true` → "Kept the deal. Sold nothing. Clean exit."
2. `globalVars.m02_ghost_deal_refused === true` → "Gave something, unasked. Left the network."
3. `globalVars.ghost_sale === 'stopped'` → "Talked out of the sale. Left the network."
4. `globalVars.ghost_sale === 'bait' && globalVars.head_start_killed === 'ghost'` → "Sold to five buyers in plain view. We have their names."
5. `globalVars.ghost_sale === 'bait'` → "Sold in plain view. The share went out." (w)
6. always → "Sold the head start. Clean exit, no trace." (w)

**GARY WHITLOCK** (only on m02 saves where he is in the bunker)

0. `globalVars.m02_completed === true && globalVars.m02_gary_protected === true && globalVars.gary_ko === true` → "Consultant, SAFETYNET. Put on the floor by the agent who saved his career." (w) (`gary_ko` is RL's local latch on `gary_consultant`, not the m02 import `m02_gary_ko`.)
1. `globalVars.m02_completed === true && globalVars.m02_gary_protected === true && globalVars.imran_outcome === 'talked_round'` → "Consultant, SAFETYNET. Watched the man he trained go home."
2. `globalVars.m02_completed === true && globalVars.m02_gary_protected === true` → "Consultant, SAFETYNET. Brought up after the breach."
3. `globalVars.gary_outcome === 'talked_round'` → "Walked out with the team. A witness."
4. `globalVars.gary_outcome === 'left_in_place'` → "Still on their payroll. Still shipping nothing."
5. `globalVars.gary_outcome === 'taken_in'` → "Charged. Three weeks there, nothing shipped."
6. `globalVars.gary_outcome === 'ko'` → "Put on the floor in a technician's fleece." (w)
7. `globalVars.m02_completed === true && !globalVars.m02_gary_protected && !globalVars.m02_exposed_hospital` → "Left at his bench."

**IMRAN SIDDIQUI** (every save)

1. `globalVars.imran_outcome === 'talked_round'` → "Went home. So did a friend."
2. `globalVars.imran_outcome === 'taken_in'` → "Charged. His supplier was raided by morning."
3. `globalVars.imran_outcome === 'card_cloned'` → "Kept his card. Lost a copy of it."
4. `globalVars.imran_outcome === 'ko'` → "Put on the floor at his bench." (w)
5. always → "Never asked. Swept up at six."

**VOLTAGE** (on `m04_voltage_captured` or `m04_voltage_escaped`)

1. `globalVars.voltage_outcome === 'his_hands'` → "Did tonight's switching himself, for us."
2. `globalVars.voltage_outcome === 'by_hand'` → "Talked his agent through the switching. Kept his hands still."
3. `globalVars.voltage_outcome === 'stood_down_print'` → "Stood down on his own thumbprint."
4. `globalVars.voltage_outcome === 'talked_down'` → "Checked the sums. Stood down."
5. `globalVars.voltage_outcome === 'fought'` → "Fought at his own switchgear. Charged." (w)
6. `globalVars.voltage_outcome === 'ko'` → "Put on the floor at his own switchgear. Charged." (w)
7. `globalVars.m04_voltage_captured === true` → "Brought up after the breach. Not needed."
8. `globalVars.m04_voltage_escaped === true` → "Swept up at six."

**STATIC** (only `m04_static_left && !m04_static_left_alone`; `STATIC_IN` is that)

1. `STATIC_IN && (globalVars.voltage_outcome === 'fought' \|\| globalVars.voltage_outcome === 'ko')` → "Went down beside Voltage." (w)
2. `STATIC_IN` → "Went where Voltage went."

**WENDELL BRIGGS**

1. `!globalVars.m04_voltage_captured && !globalVars.m04_voltage_escaped && globalVars.wendell_outcome === 'told'` → "Rang his mate Dale. Dale stayed home."
2. `!globalVars.m04_voltage_captured && !globalVars.m04_voltage_escaped && globalVars.wendell_outcome === 'ko'` → "Put on the floor at his own panel. Dale walked into the raid at shift change; home by morning." (w)
3. `!globalVars.m04_voltage_captured && !globalVars.m04_voltage_escaped` → "Never told. Asked if he still gets paid for the week. Dale walked into the raid at shift change; home by morning."
4. `globalVars.m04_voltage_escaped === true && !(STATIC_IN)` → "Kept his head down at the far panel."

**ROBERT VANCE** → `globalVars.m04_vance_is_ally === true && !globalVars.m04_voltage_captured && globalVars.cut_by_hand === true` → "Talked the switching through from Teesside."

**ELENA RODRIGUEZ** → `!globalVars.m04_vance_is_ally && globalVars.m07_elena_outcome === 'turned' && !globalVars.m04_voltage_captured && globalVars.cut_by_hand === true` → "On the line for the switching. Still turned."

**DR ABENA ASANTE**

1. `MERCER_HERE` → "On the uplink all night. Off the map."
2. `globalVars.asante_outcome === 'ko'` → "Put on the floor beside her console." (w)
3. `globalVars.asante_outcome === 'talked'` → "Showed the schedule. Confirmed her sums."
4. always → "Swept up at six. She'd write it again."

**DR JAMES MERCER** (only `MERCER_HERE`)

1. `MERCER_HERE && globalVars.mercer_ko === true` → "Put on the floor in the server hall." (w)
2. `MERCER_HERE` → "Swept up at six."

**VICTORIA STERLING** (only on `recruited`, `escaped` and `arrested`)

1. `globalVars.m03_victoria_fate === 'recruited' && globalVars.victoria_gallery === 'confronted'` → "Held, and opened the lock. The tap on Zero Day's brokers went dark at five."
2. `globalVars.m03_victoria_fate === 'recruited' && globalVars.victoria_gallery === 'trusted' && globalVars.head_start_killed === 'zero_day'` → "Opened the lock. Still ours."
3. `globalVars.m03_victoria_fate === 'recruited' && globalVars.victoria_gallery === 'trusted'` → "Sold the raid. Gone down the gallery stair." (w)
4. `globalVars.victoria_gallery === 'ko'` → "Put on the floor on the walkway. Charged." (w)
5. `globalVars.m03_victoria_fate === 'recruited'` → "Never handed anything. Still ours, for now."
6. `globalVars.victoria_gallery === 'talked_down'` → "Lowered the pistol. At large, owing nobody."
7. `globalVars.victoria_gallery === 'walked'` → "Walked out. At large." (w)
8. `globalVars.victoria_gallery === 'arrested_here'` → "Arrested on the walkway. Didn't fight."
9. `globalVars.m03_victoria_fate === 'escaped'` → "At large." (w)
10. `globalVars.m03_victoria_fate === 'arrested' && globalVars.victoria_line_deal === 'deal'` → "Still talking."
11. `globalVars.m03_victoria_fate === 'arrested'` → "Serving the full charge."

**PIETER VOS** (only on Vos's branches: `m03_victoria_fate` is `arrested`, `ko` or `""`; and **no clause on `vos_outcome === 'bought'`**, so a bought Vos is left out, as his deal promised)

1. `globalVars.vos_outcome === 'stood_aside'` → "Withdrew Zero Day's order. Stood aside."
2. `globalVars.vos_outcome === 'ko'` → "Put on the floor on the walkway. Named." (w)
3. `globalVars.vos_outcome === 'refused'` → "Named. Swept up at six."
4. `globalVars.vos_outcome === 'avoided'` → "Named. Swept up at six."

**SIONE FONOTI**

1. `globalVars.fonoti_ko === true` → "Put on the floor on the walkway." (w)
2. always → "Swept up at six, card or no card."

**DR ADRIAN TESSERACT** (one clause per entry, no condition): E1 "Awaiting trial."; E2 "Cooperating. No trial."; E3 "Dead at his console, reaching." (w); E4 "Shot unarmed." (w); E5 "Gone by the service door. He left a card." (w); E6 "Walked out with you." (w)

New locals this section reads, proposed in §6 (S6-12): `vector_recalled`, `phantom_recalled`, `quintero_recalled`, `malhotra_recalled`, `arakawa_recalled` (MC §5's recall line sets its officer's; the credits' "Recalled." needs to know who), and `fonoti_ko` (`lock_guard`'s `globalVarOnKO`; every knock-out is admitted somewhere, SE §9). Everything else is in MC §12 or OT §16.

### 3.4 The cells

`{ "section": "THE CELLS", "lines": [...] }` on E1–E5 (not on Join, whose card says "Every cell has it."). Every line that holds prints, so this is the ledger in full, each source naming its own cell (FA §4.6's fixed rule). The m07 lines always print one of their two forms, so the heading always shows.

| Condition | Line |
|---|---|
| `globalVars.ending === 'surrender'` | "The cells' couriers: rolled up. His protocol." |
| `globalVars.ending === 'surrender'` | "Their quartermaster: rolled up. His protocol." |
| `globalVars.database_outcome === 'secured' && OP1` | "Zero Day's UK desk: rolled up. Sterling's watch." |
| `globalVars.database_outcome === 'secured' && !OP1 && OP2` | "The Initiative's procurement desk: rolled up. Nightshade's channel." |
| `globalVars.database_outcome === 'secured' && !OP1 && !OP2 && OP3` | "The Crypto Anarchists' reserve: rolled up. The HashChain tags." |
| `globalVars.database_outcome === 'secured' && !OP1 && !OP2 && !OP3 && OP4` | "Critical Mass: rolled up. The watch on the controllers." |
| `globalVars.database_outcome === 'secured' && !OP1 && !OP2 && !OP3 && !OP4` | "The order book's largest buyer: rolled up." |
| `globalVars.head_start_killed === 'ghost' && globalVars.ghost_sale === 'bait'` | "The resale share's five buyers: named, and paid for nothing." |
| `globalVars.share_zero_day === 'traced'` | "Zero Day's share: four buyers followed. One was careless." |
| `M07_FRACTURE` | "Michael Reeves's cell: its people taken at the Fracture site. He wasn't there." |
| `!(M07_FRACTURE)` | "Michael Reeves's cell: standing." (w) |
| `M07_AUSTIN` | "Jennifer Walsh's cell: stopped at Austin. She wasn't there." |
| `!(M07_AUSTIN)` | "Jennifer Walsh's cell: standing." (w) |
| `M07_MELTDOWN` | "Marcus Ashford's cell: stopped at the hospitals. He wasn't there." |
| `!(M07_MELTDOWN)` | "Marcus Ashford's cell: standing." (w) |

The m07 leaders are named by name, never by cell name, so "Ghost Protocol" never shares a screen with Ghost (FA §4.6). "He wasn't there" is m07's own fact (`m07_opening_briefing.ink:153`, "He does not attend"; `m07_closing_debrief.ink:213`, "Ashford is never with them"). A taken-in Imran's supplier and arrested Victoria's book are their own clauses (§3.3), not cells.

### 3.5 Elsewhere

`{ "section": "ELSEWHERE", "lines": [...] }` on all six entries. Everything with nobody in m10 to carry it, and every human line the card may have passed over (FA §4.6, MC §10), each once.

| Condition | Line |
|---|---|
| `AUSTIN_UNCOVERED && globalVars.database_outcome === 'disclosed'` | "Dispatch in eleven counties: a vendor workaround by the weekend. The fix is due in ninety days." |
| `AUSTIN_UNCOVERED && globalVars.database_outcome !== 'disclosed'` | "Dispatch in eleven counties: still dropping calls. Day thirteen." (w) |
| `globalVars.m04_completed === true && globalVars.m04_disclosure_choice === 'full'` | "Albion's inquiry asked who funded the plant's security. Parliament answered." |
| `globalVars.m04_completed === true && globalVars.m04_disclosure_choice === 'partial' && globalVars.m04_crew_lost === true` | "The Albion inquest heard the rest." |
| `globalVars.m04_completed === true && globalVars.m04_disclosure_choice === 'partial' && !globalVars.m04_crew_lost` | "Albion's half-statement still stands. Nobody audited the other sites." (w) |
| `globalVars.m09_albion_notified === true && (globalVars.m04_disclosure_choice === 'full' \|\| globalVars.m04_crew_lost === true)` | "Albion's inquiry also asked SAFETYNET when it knew. SAFETYNET answered." |
| `globalVars.m09_albion_notified === true && !(globalVars.m04_disclosure_choice === 'full' \|\| globalVars.m04_crew_lost === true)` | "Carrow Controls: told nine years late. A fix is ninety days out." (the vendor m09 stage 6 names) |
| `globalVars.m05_completed === true && FORTY_SEVEN_WARNED` | "The forty-seven: every one of them reached in time." |
| `globalVars.m05_completed === true && FORTY_SEVEN_LATE` | "The forty-seven: twenty-eight reached in time. Nineteen had already signed." (w) |
| `globalVars.m05_completed === true && !(FORTY_SEVEN_WARNED) && !(FORTY_SEVEN_LATE)` | "The forty-seven: none of them reached. They're still on a list." (w) |
| `globalVars.m05_elena_treatment_funded === true` | "Elena Torres is in treatment. It's working." |
| `globalVars.m09_recruiter_offer === 'named'` | "The Recruiter's network: rolled up." |
| `globalVars.m09_recruiter_offer === 'double_crossed'` | "The Recruiter's network: about half of them. She warned the rest." (w) |
| `globalVars.m09_recruiter_offer === 'taken' \|\| globalVars.m09_recruiter_offer === 'refused'` | "The Recruiter: at large, her people at their desks." (w) |
| `globalVars.m09_legacy_files_saved === true` | "Eleven placements outside SAFETYNET, picked up from the Helena files." |
| `globalVars.partial_release === 'small'` | "Seattle's first batch went out through the backdoor, into fourteen million systems." (w) |
| `globalVars.partial_release === 'large'` | "Seattle's first batch went out through the backdoor, into forty-seven million systems." (w) |
| `globalVars.database_outcome === 'disclosed'` | "Three water utilities: on manual till spring. There's no patch for their controllers." |
| `globalVars.ending === 'executed'` | "Social Fabric's story ran at six. One paragraph of it was true." (w) |
| `globalVars.media_story_ran === true && globalVars.ending !== 'executed'` | "Social Fabric's story ran from outside. A massacre that never happened." (w) |
| `globalVars.media_story_ran === true && globalVars.m05_entropy_program_exposed === true` | "It named SAFETYNET, and 0x00." (w) |
| `globalVars.victoria_gallery === 'confronted'` | "The tap on Zero Day's brokers: dark since five." (w) |
| `(globalVars.m03_victoria_fate === 'arrested' \|\| globalVars.m03_victoria_fate === 'ko' \|\| globalVars.m03_victoria_fate === '') && globalVars.vos_outcome !== 'bought'` | "Zero Day: still trading. Its broker, Pieter Vos, named." |
| `!((globalVars.m03_victoria_fate === 'arrested' \|\| globalVars.m03_victoria_fate === 'ko' \|\| globalVars.m03_victoria_fate === '') && globalVars.vos_outcome !== 'bought')` | "Zero Day: still trading." |
| `globalVars.m02_completed === true && (globalVars.m02_reeves_fate === 'escaped' \|\| globalVars.m02_reeves_fate === 'missed' \|\| globalVars.m02_reeves_fate === 'unnoticed' \|\| (globalVars.m02_reeves_fate === '' && globalVars.m02_insider_asset_escaped === true))` | "Graham Reeves: on leave from Tomb Gamma tonight. Still theirs." (w) |
| `globalVars.m07_hollis_resolved === 'evaded' && globalVars.m06_assets_seized === true` | "Ray Hollis: stood down for the budget. Home with his kids." |
| `globalVars.m07_hollis_resolved === 'evaded' && !globalVars.m06_assets_seized` | "Ray Hollis: on their gate shift. Still on their payroll." (w) |
| `globalVars.m04_static_left_alone === true` | "Static: out of Albion on his own. Still out." (w) |
| `globalVars.m04_robert_vance_ko === true` | "Robert Vance: said no. Said you'd know why." (w) |

The Albion lines here are split so that m09's half has a home on every save that sent the notice, including a `quiet` m04 save (no card line, FA row 59) and a never-played m04 (the vendor line). The forty-seven's three forms and Elena Torres always print here on an m05 save, whichever one the card chose. Kemal Aydin, Teresa Villanueva and the other m09-only people are m09's to credit.

### 3.6 Join's card and credits

E6 (`citadel`, `ending === 'joined'`). FA §4.5: MISSION FAILED with the Publication's casualty projection, as m01's launch ending.

**Card** (three lines, no conditions): "Dr Adrian Tesseract: with you." / "The database: everywhere." / "Every cell has it." No teaser.

**Credits:**

- "MISSION FAILED" (`title`), "FULL DISCLOSURE" (`subtitle`), a blank line.
- "THE PUBLICATION: RELEASED BY KEY. ALL CITIES, ONE MINUTE." (`warning`)
- "PROJECTED DEATHS, FIRST THIRTY DAYS: 1,100 TO 2,600. HIS FIGURE." (`warning`)
- "CORRECTED: 2,100 TO 3,600." (`warning`) Always printed, whether or not the player found Asante's correction: Join is where the player learns what the key really cost.
- A blank line, then IN THIS OPERATION (§3.3, whose `joined` arms apply) and ELSEWHERE (§3.5). No THE CELLS.

## 4. LORE fragments: what the bunker tells a player who reads

m10 is a raid with about 105 minutes in it (OT §8), so it has no separate collectible layer: as in m09 (its stage 6 §4), the readables in §1 **are** the fragments, and three of them are new (S6-01 to S6-03). Every one sits on the main path or in a room the player has to cross, and none costs more than a few seconds to read. Eldritch content: none, anywhere (brief).

### 4.1 The fragments, in the order the corridor reveals them

| # | Fragment (id) | Room | Kind (06 prompt) | Thread | What a reader learns |
|---|---|---|---|---|---|
| 1 | Citadel Incident File V-47 (`incident_file`) | forward post | external validation | the Publication's preparation | how the database left, that the personnel index went with it, that the door was left open on Netherton's signature and still is, and the cracker quarantine |
| 2 | Helena's plans (`helena_plans`) | forward post | operational document | Tesseract's workshop | the bunker was a 1962 civil defence control site; the crank, the interlock, the shutter's feed, the control room's east exit |
| 3 | The projection desk (`projection_desk`, on `hardened`) | forward post | database / numbers | the Publication | SAFETYNET's own analysts put the first month at 2,000 to 3,400 and say it keeps climbing |
| 4 | The tunnel rota (`tunnel_rota`) | tunnel | personal / operational | ENTROPY's cells | the post's shift change is real (Nightshade's entry 2), and Graham Reeves works here now |
| 5 | The wanted photo and duty board (`wanted_photo`, `duty_board`) | security office | communications | Tesseract's workshop | the order from the top in his hand; what the freeze cost him in guards |
| 6 | The alarm log (`alarm_log`, in the cupboard) | security office | operational document | Tesseract's workshop | the readers loaded with 1,206 SAFETYNET badges; the purge circuit, tested three times, "both copies, or nothing"; the camera that was never wired, on his order |
| 7 | The bench log and the cracker rack (`bench_log`, `cracker_rack`) | workshop | database | ENTROPY's cells, the Publication | the bench sold crackers into SAFETYNET's own stores through a front supplier, four batches; and one cloner went to WREN |
| 8 | The casualty sheet, the margin strip and Asante's model (`casualty_sheet`, `casualty_margin_note`, `asante_model`) | workshop | **evidence with numbers**: the calculations and the approval chain | the Publication | his figure, 1,100 to 2,600; hers, 2,100 to 3,600; his signature under her correction |
| 9 | The plotting board (`plotting_board`) | server hall | operational | the Publication | the release laid over a Cold War map, city by city, Seattle first |
| 10 | The schedule (`schedule_terminal`, after flag 2) | server hall | **evidence with numbers**: scope and victims | the Publication, ENTROPY's cells | 92,460 entries; the channels; two cells paid in early access for the theft; the first victims in plain words, the first of them marked by SAFETYNET "retain" three years ago |
| 11 | Social Fabric's draft (`uplink_printer`) | server hall | communications | ENTROPY's cells | the lie ready to go, the photo off the security office wall, the Initiative's account behind it |
| 12 | The gallery rota (`gallery_rota`, in the cupboard) | security office (read for the gallery) | personal | the way in | who carries the code, and Farah's name before the player hears it in a bark |
| 13 | The core's file index (`core_files`, after flag 4) | core | **evidence**: the approval chain, in his own filing | Tesseract's workshop, the Publication | the whole operation in eleven lines: what was taken, the vault line, the key's rule ("One of theirs."), the purge, Tomb Alpha and Tomb Beta closed, his notice unsent, his copy of the Reading |
| 14 | His card (`scorched_card`, Scorched Earth only) | core | personal | Tesseract | two words |

The 06 prompt's evidence documents are 8, 10 and 13, each with numbers, each found in play, and each tracked: 8 by `casualty_sheet_read` and `margin_note_read`, 10 by `flag2_submitted`, 13 by `flag4_submitted`. Those globals already have readers (the rebuttal's two forms, Voltage's talk-down, the tasks, the core router). The lore-only fragments (1, 2, 4, 6, 9, 11) set no global: m10's rule is that every global has a reader (MC §12), and nothing in the ink or the credits would read "the player read the alarm log", so a tracking flag would be write-only. If stage 7 wants a HaX line on one of them, it adds the `onRead` and the reader together.

### 4.2 Progressive revelation, three threads

**Tesseract's workshop: Alpha, Beta, Gamma.** m09 gave the player his two closed workshops as paper: Tomb Alpha's tapes (his teaching) and Tomb Beta's server (his enrolment, left running on purpose). m10 is the third, and the bunker tells it in the order the player walks it. Outside, the plans show what it was: a 1962 civil defence control site, built to outlast a war (2). The first room below shows what he made of it: the readers loaded with SAFETYNET's own badges, one of them set to open a door by name; a purge he tested three times; a camera bracket he ordered left empty, which is the first hint that he built his own way out before he let anyone build their way in, as the Alpha tape says (6). The floors show what it makes: crackers sold back to the service through a front (7), and a price he signed twice (8). The core shows it filed: Alpha closed, Beta closed and left running, Gamma's purge armed, the key kept for one of theirs (13). A player who pulled the Alpha tapes in m09 recognises the service door's empty camera from the lecture before HaX says so at the core.

**ENTROPY's cells.** The night shows the cells as customers and contractors, never as a council. The tunnel rota has m02's Reeves on the payroll (4); the bench sells through a supplier the stores never questioned (7); the schedule pays two cells in early access for the theft, and one of them already has a resale buyer (10, and Vos's secret); Social Fabric's draft carries the Initiative's sign-off (11). The credits then show the ledger: which cells broke, which stand, each m07 cell by its leader's name (§3.4). Nothing here names ENTROPY's founding or a new mastermind (FA row 11: a new one in the last hour is clutter).

**The Publication's preparation.** From the outside in: the Citadel's file says what went and that the door is still open (1); the schedule says what goes, when, through which channels, and to whom first (10); the plotting board puts it on a map (9); the casualty sheet prices it, and Asante's model reprices it (8); the core's index shows the key and the purge waiting (13). Each step is said by a document, so when Tesseract makes his case at the console (six lines, SE §2.2), a reader has seen every number he uses, and one he doesn't.

### 4.3 What the fragments pay off from m01–m09

| Earlier thread | Fragment(s) | How it lands |
|---|---|---|
| m01: Operation Shatter's casualty projections (`found_casualty_projections`) and its launch ending | 8, Join's credits | The same document type, signed by the same hand; Join's credits print his figure and the corrected one, as m01's launch ending printed its estimate |
| m02: Ghost and Ransomware Incorporated; Reeves; the unlabelled case behind Gary's rack | 10, 4, 7 | Ransomware Incorporated is on the early-access list; Reeves is on the tunnel rota; the bench's casings are the casing Gary recognises |
| m03: Zero Day, Sterling's desk "filled by Monday" | 10 | Zero Day's share is collected on site by Sterling or by Vos, "Resale not permitted", which is the rule Vos is breaking |
| m04: Albion, Critical Mass, the bypass | 13, 3.5, `bypass_panel`, `static_kit` | The notice is on his box, unsent, or "sent from Helena by someone else"; Carrow Controls in Elsewhere; Voltage's thumb on the refit's bypass; Static's tool roll |
| m05: the Initiative | 11, 3.4 | Social Fabric's rota bills the Initiative; the Initiative's procurement desk is a cell the database can roll up |
| m06: the freeze, HashChain | 5, `gate_hut`, 3.4 | "POSTS UNMANNED: BUDGET"; the dark gate hut; the Crypto Anarchists' reserve as a cell |
| m07: Seattle, the backdoor, the four sites, Mercer, Hollis | 9, 10, 3.4, `duty_board` | Seattle first on the board; the Trojan Horse backdoor and its size on the schedule; the leaders' cells; Hollis on the duty board |
| m08: the theft, the door, the stores, "I chose what you went in without" | 1, 7, `nightshade_payment` | The incident file states the theft and the open door; the bench log is the supply chain; Nightshade's payment ends on his m08 line |
| m09: the original sheet, the notice, Alpha and Beta, the Reading, the deed | 8, 13, 2 | The bench copy is "Printing 3" of the sheet m09's flag 4 gave; the index files his notice, his workshops and his copy of the Reading; the plans are the construction file from the archive |

### 4.4 Canon this file fixes (for the bible, at the arc-keeper's next pass)

- **The cracker supply chain** (FA §13 item 3, B1): Tomb Gamma's bench made the PIN crackers SAFETYNET's stores bought through a front supplier, Gallatin Instrument Supply of Bozeman: four batches, 160 units, every one of them signed for by Nightshade, all now withdrawn. Kowalczyk's cracker is bench-made but was never issued through stores. Crackers go out by batch with no end user; cloners report each read back to the bench; one cloner went to WREN by hand.
- **The bunker's origin**: Sun River Regional Control Site, a 1962 civil defence control site in Lewis and Clark County, at m08's coordinate; leased in 2016 (m09's deed) and refitted last year.
- **The purge circuit**: fitted and tested in the refit, armed on the loss of both copies; his rule "both copies, or nothing".
- **The readers**: 1,206 SAFETYNET badges loaded from the stolen personnel index (FA M-04); the service door takes any of them, the blast door one by name.
- **The casualty figures**: his, 1,100 to 2,600 in the first thirty days, unchanged through three printings; Asante's corrected 2,100 to 3,600; the Council's own curve 2,000 to 3,400 at week 4.
- **The lock guard**, Sione Fonoti, for the cast register (FA §5.2).
- **U1** (Tesseract recruited Nightshade at 23 while chief strategist) is already in `the_architect.md`'s identity section, marked user-confirmed; m10's documents add nothing that needs it beyond the payment's "as he briefed them to me".

## 5. The whodunit's paper, checked on every branch

`scenario-design-review` §2b and FA §4.4: three clues, fair and findable on every branch where the whodunit runs, no single one naming WREN, clues 2 and 3 crossing at one name.

**What each document names.**

| Clue | Document(s) | Names | Leaves |
|---|---|---|---|
| 1 | `door_log` (security office, after flag 1) | Malhotra's badge, at 02:10, on the core's service door | "somebody has a copy" (HaX); it names the badge, not a hand |
| 2 | HaX's alibi topic (spoken), or a helper: Nightshade's habits line, or `m09_sleeper_shortlist` at the aside | whoever nobody could see at 02:10 | Quintero and Kowalczyk (the tunnel pair) |
| 3 | `bench_log` (workshop) **with** `case_signout_sheet` (forward post; HaX reads it on "[Who signed for the case?]"), or Phantom's list | a cloner sent "to WREN" in breaching case 2, which copied Malhotra's badge at 01:58; the case opened at 01:52 by Kowalczyk and Arakawa | Kowalczyk and Arakawa |

Clue 2 ∩ clue 3 = Kowalczyk. Clue 1 is what turns 02:10 into a test. No document carries a name next to "WREN": the bench log has the codename and Malhotra's badge (an innocent's), the sheet has two names and no codename. The m09 shortlist names Kowalczyk and Quintero, the same pair as clue 2, so it replaces clue 2 and never short-cuts it.

**Other documents checked for leaks.** The incident file (theft, door, stores; no names but Nightshade's and Netherton's), Helena's plans, the alarm log (the service door's standing order, no badge), the duty board, Social Fabric's draft, the gallery rota, the core's index ("One of theirs.", written before WREN appears and pronoun-free), the payment (entry 9's camera only) and the cracker's description (her own words, a suspicion beat) name nobody on the team as WREN and give WREN no pronoun. The credits name her only after the night's last scene.

**Every branch where the whodunit runs** (`whodunit_live`, i.e. not `m09_sleeper_named`):

| Branch | Clue 1 | Clue 2 | Clue 3 | Holds? |
|---|---|---|---|---|
| Default | security office, after flag 1 | HaX's topic after clue 1 | bench log + sheet or HaX's read | yes |
| Tether (silent Nightshade brought) | same | same; Arakawa was at the gate at 02:10, before he took Nightshade up at 02:30 | same | yes; Kowalczyk's last face-to-face is the security office |
| Tripwire (`wren_warned`) | same (the ladder route reaches the office) | same | same | yes; she peels off at the workshop, so the bench log is read with her already gone, and accusing is on the line |
| Arakawa knocked out before 02:10 | same | HaX's variant: "Arakawa was on the gravel at ten past. You saw to that." | same | yes |
| Malhotra wrongly sent back | same | same | same | yes; recalled on clue 2 ("Eleven years. Check the log again.") |
| Vector and Phantom present | same | Netherton had both at the van end | Phantom's list replaces it ("one more unit than its sheet lists", the sheet's own count) | yes |
| Nightshade kept or dealt | same | his habits line replaces it | same | yes |
| `m09_sleeper_shortlist` | same | HaX at the aside replaces it | same | yes |

**Where it is off.** `taken`: the door log has no 02:10 entry, the bench log says the WREN cloner was never switched on and is still in the case, the sheet has Arakawa alone. `double_crossed`: the door log shows her own badge at 21:47 the evening before (lore, and a sting), the bench log says the cloner was never collected, the sheet has Arakawa alone. Neither variant contradicts the aside's named form or Netherton's briefing line.

**Fair before the lock.** The door log, the bench log and the sheet are all reachable before the server hall, where Kowalczyk's face-to-face window closes by default; the alibi needs only the line. The tunnel (tripwire) and tether variants move her peel-off a room earlier, which costs the face-to-face accusation, never a clue: the line accusation has the same outcomes (FA §4.4).

## 6. Proposed changes

None is made here (this stage edits only its own file). "FA" is FINALE_ARC; the m10 docs as §0.

| # | To | Change | Why |
|---|---|---|---|
| S6-01 | RL §2.1 (objects), §5 | Add `incident_file`, "Citadel Incident File V-47", a readable on the forward post's kit table, suggested (12, 8) | FA §13 10-3, §8 r11, F7, D-13: the vault line left open as a trace is written down; also the stores half of the cracker canon (B1) |
| S6-02 | RL §2.4, §3 (lock graph), §6; OT §2–3 (`decode_the_margin`), §16 | Add `model_terminal`, a `pc` with a `password` lock (`DOUBLECOUNT`) holding the notes item `asante_model`; `margin_note_read` is set by `asante_model`'s `onRead`, not by the strip. `casualty_margin_note` stays the coded strip with no `onRead`. OT §3's trigger for `decode_the_margin` becomes "`asante_model`'s `onRead`". RL §3: one more optional lock (the password), whose key is the decode; the validator sees a password lock and its clue in the same room | The CyberChef workstation emits no event (`utils/crypto-workstation.js`), so as written nothing could set `margin_note_read` and the optional task and the rebuttal's decoded form were unreachable. The lock is the decode's proof, and it teaches its own small lesson (a password hidden by encoding is not hidden) |
| S6-03 | RL §2.8 | Add `core_files`, "Core Host: File Index", a readable on the core's back wall, suggested (4, 2), text after `flag4_submitted` | The core's LORE (his workshops, the key's rule, the purge, his notice) in his own filing, a page a player can read while he waits; HaX's flag 4 lines then confirm what it shows |
| S6-04 | RL §2.3, §2.7; OT §4.2, §4.5 | Fix the values: `records_cupboard` `requires: "2817"`; outer lock `requires: "6083"`; the three notes items' `text` as §2.2 | FA §13 10-2 |
| S6-05 | RL §2.7; FA §5.2 (cast) | `lock_guard`'s `displayName` "Sione Fonoti", with `globalVarOnKO: fonoti_ko`; add him to the cast table | FA §13 10-1; every knock-out gets a credit line (SE §9) |
| S6-06 | RL §2.3, §2.4, §2.7, §4; OT §16 | Item ids: `kowalczyk_cracker`, `fitter_spare_card` (`card_id: tg_power_room_card`), `gallery_code_card`, `vos_code_card`, `alarm_log`, `asante_model` | FA §13 B3: one id per item across RL, OT and the ink |
| S6-07 | OT §6 ("The text") | The countdown's separator is `·`, not `\|`; add the 06:00 lines ("RELEASE 06:00 UTC · NOW 06:00" / "RELEASE: DISARMED. NOTHING WENT AT SIX.") and the forward post screen's executed variant | B2's characters kept out of every displayed string; the 06:00 state and the executed screen had no text |
| S6-08 | RL §4 (the cracker's description) | "handed it to you before Helena", not "in Helena" | In m09 she hands it over at the briefing, before the flight (FA row 118; m09 S4 P15) |
| S6-09 | SE §3.1 / stage 7 (HaX's Hollis line) | On `m06_assets_seized && m07_hollis_resolved === 'evaded'`, the duty board shows Hollis stood down for the budget; HaX's "I hope he stays in the hut" becomes, on that save, "Stood down for the budget. Your freeze kept him home tonight." | FA rows 72 and 92 together: the freeze empties the gate, so Hollis can't be on it |
| S6-10 | m09 stage 1 / SA §3.4; FA §13 B1 | The cracker canon's home is m10's incident file, bench log and cracker description; m09 carries no incident file (m09 stage 6 §4.5 agrees). Mark B1 settled | B1 |
| S6-11 | MC §10 (the human line), FA §4.6, §13 item 36 | The forty-seven take the card's human line only where some were not reached in time (`m05_completed` and not `FORTY_SEVEN_WARNED`); where all were warned, the line falls to Elena Torres. All three forty-seven forms stay in ELSEWHERE | As written, `m05_elena_treatment_funded` can only be true on an `m05_completed` save, so Elena Torres's card line was unreachable |
| S6-12 | MC §5, §12; OT §16 | Add locals `malhotra_recalled`, `arakawa_recalled`, `quintero_recalled`, `vector_recalled`, `phantom_recalled` (bool, set by the recall's line for that officer) and `fonoti_ko` (bool, `globalVarOnKO`); add "credits" to the readers of `points_landed`, `cut_by_hand`, `imran_outcome`, `voltage_outcome`, `wendell_outcome`, `gary_outcome`, `asante_outcome`, `vos_outcome`, `victoria_gallery`, `victoria_line_deal`, `nightshade_deal`, `nightshade_taken_in`, `quintero_enters_core`, `partial_release`, `media_story_ran` | FA §4.4's "Recalled." credit needs to know who was recalled (`officer_out` is cleared on recall); the rest are reads §3 adds |
| S6-13 | FA §4.6 ("The closing card"), MC §10 | The cells line's count includes m07's cell (covered site; never played reads Austin), so it reads "Cells broken: n", not "tonight"; the card's line forms and the THE CELLS section are §3.2 and §3.4 here. Card lines are per ending entry (§3.1), written mutually exclusive so the five-line cap never drops one | FA §4.6 named the count and one cell but not how to print a count without a variable; the cap takes the first five that hold |
| S6-14 | FA §4.0 ("Why the readers log SAFETYNET badges"), §4.4 | Add: the readers hold 1,206 SAFETYNET badges; the service door takes any of them; on `double_crossed` the door log shows Kowalczyk's own badge at 21:47 the evening before (she came in openly; no 02:10 entry, as FA already says) | Lore consistency with the alarm log and the door log |
| S6-15 | FA §2 row 112 / §8.1 Vector; RL §2.3 | The records cupboard's keypad is the Citadel's annex make (its observation says so), which is why Vector and Ghost both know the code | Grounds Vector's line for a player who never meets him |
| S6-16 | MC §3.1 (the payment check), stage 7 | The check's ink option names entry 3: "[Your entry for the inner door says 1962 and no interlock. Helena's 1962 drawings have one.]" (draft wording for stage 7) | §1.10: the contradiction is entry 3 against plans entry 3 |
| S6-17 | SE §3.5 (Ghost's card answer), §3.6 (Vos), §3.5 (escaped Victoria) | The lock guard is named "Fonoti" in each naming line (stage 7 words them) | FA §13 10-1 |
| S6-18 | FA §13 stage 6 handover | Mark B1, B2, B3 and 10-1 to 10-8 settled by this file; U1 settled (already in `the_architect.md`, user-confirmed) | Housekeeping |
| S6-19 | FA §5.2 name register | Add Sione Fonoti, B. Haugen, J. Kiel, T. Abara, Gallatin Instrument Supply, Sun River Regional Control Site | Name-clash register; all grepped clean |
| S6-20 | m09 stage 6 (cross-check, no change needed unless they differ) | Shared facts as m10 uses them: the sheet's body (m09's `mirror_job_printout` wording); "Disposition: retain. Operational value."; Carrow Controls; Tomb Alpha and Tomb Beta closed, papers and server in Helena; the cracker handed over at the m09 briefing; 2017 / 2015 / 2019 / 2011 anchors. If m09's deed names the bunker, it should be Sun River Regional Control Site (m09 stage 6 currently says only "a decommissioned bunker, Montana") | One set of facts across both missions |

**Stage 9 checks this file asks for** (not design changes): that `#give_item` fires an item's `onPickup` (the override); that the cracker minigame runs faster on the dusted plate's four digits (else the plate's ordered fallback sentence, §1.7); that `hasFingerprint` can be given to `bypass_panel` on the escaped branch only; that `points_landed` is a declared global, since the credits read it.

## 7. For the user

Nothing here blocks stage 7. Three things the user may want to see:

1. **One new lock in m10: a password.** The margin note's decode now opens a password-locked bench terminal (S6-02). Without it the optional decode had no way to register, so its task and the sharper rebuttal could never trigger. It is optional and off the critical path. The alternative is to drop the decode's in-game effect and keep the strip as lore only.
2. **Elena Torres on the closing card** (S6-11). As stage 3 wrote the precedence, her line could never reach the card. The fix lets her line through when all forty-seven were warned in time. It is an ordering call, so the orchestrator can rule on it.
3. **The teaser slot** is wired on four endings and holds no lines (§3.1). Its content is still the user's to decide.

U1 (Tesseract recruited Nightshade at 23 while chief strategist) is already in `the_architect.md`, marked user-confirmed, so nothing more is needed from the user.
