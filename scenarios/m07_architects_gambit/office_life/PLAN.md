# m07 The Architect's Gambit: office life as built

This describes what is built on branch `build/ol-m07`. Line numbers are for the current `scenarios/m07_architects_gambit/scenario.json.erb` (SCN) unless a file is named. The analysis is in `ANALYSIS.md`; the user's calls are in `QUESTIONS.md`.

## 0. Inputs and decisions

| Input | State |
|---|---|
| Tier 2 small, "the last two out" (QUESTIONS Q1) | decided (D112 a) |
| Cast: Adaeze Okafor and Gwen Pritchard (Q3), checked against the other missions' picks by AC0 | decided (D114 a) |
| Accent: both operators speak General American, `en-US` voice styles; Elena unchanged (Q2) | decided (D113, answered 17 Nov 2026) |
| `DIALOGUE_SAMPLE.md`, the wording of the 28 lines | written; wording yes conditional on a clean dialogue review and build review, on the user's 18 Nov 2026 instruction relayed by the coordinator (`DIALOGUE_SAMPLE.md:3`) |
| Voicing yes with the V6 clip count | after the build |
| Art | none needed: both atlases have sit and pose frames, talk sheets, visemes and headshots |

## 1. Aim and tier

Tier 2, small. The building is mid-evacuation at night. The muster board in the checkpoint shows three operations staff unaccounted for (SCN `:1816` to `:1823`) and the abandoned ops console still has warm coffee (`:2005` to `:2009`). Two of those three are still on the operations floor: a grid scheduler and the floor's systems-support lead, finishing what they can before they go. They sit at their consoles, get up for water at the cooler in the room's south-west corner, talk when both are there, and can be spoken to. They offer nothing: no key, no clue, no lever, no opening. When the player goes on into the server room, they leave the building, so every room past the ops floor stays as empty as the plot says.

Beats touched: none. The build added two ambient NPCs to the one room that has none, one declared machine, a trouble global, two credits lines, two appended hint rows that reuse existing text, and two short ink files.

Out of scope: levers, physical-pentest openings, new rooms, any existing NPC moving, any existing line changing, room tone (the mission has none in any room; a separate pass), and Elena's map position (section 2A).

### 1.1 Story consistency

The pair must not contradict any line. Checked:

- Briefing: "nobody in there knows who you are" (`ink/m07_opening_briefing.ink:75`), "The building is evacuating" (`:325`). The pair do not know who the player is.
- Hollis: "Building's evacuating" (`ink/m07_npc_ray_hollis.ink:63`), "The checkpoint is empty" (`:300`), true of his own room.
- Park: "Empty, they said. Nobody in it." (`ink/m07_npc_thomas_park.ink:107`) and the player choice "[The building's empty. The people are on the other end of the wires.]" (`:109`). Both hold because the pair leave on the first server-room entry and the vault lies beyond the server room. Any later change to the hide must keep this.
- The shift handover sheet: "Coffee machine: still broken. Still not my job." (`:1995`; observation `:1994`). The coffee station is broken, so nobody uses it; the pair drink water and may grumble about the machine.
- The muster board: OPERATIONS 31 / 34 (`:1816` to `:1823`). Two operators present plus the abandoned console's operator make three. The supervisor is in the parking lot (`:1943`).
- Debrief (`ink/m07_closing_debrief.ink:430`, `:434` to `:511`) and HaX's hub lines: no line says the building was empty of staff.

## 2. People

| NPC | Class | Post | Leash | Needs | Groups and avoids | Habits | Beats protected by | Gate global, set by, lead time | If attacked mid-walk |
|---|---|---|---|---|---|---|---|---|---|
| `adaeze_okafor` (new) | ambient | seated at the console chair at Tiled (124, 178) | `needsRooms: ["operations_floor"]` | thirst (cooler) | group `ops_floor`; avoids none | none | (1) no story beat reads her | none | carries nothing (the cooler gives no item); turns hostile with chase `leash: true` and stays near post; KO sets `adaeze_ko`, body stays where she fell; the trouble global switches the cooler off and the other operator walks home once available |
| `gwen_pritchard` (new) | ambient | seated at the console chair at Tiled (60, 178) | `needsRooms: ["operations_floor"]` | thirst | group `ops_floor` | none | (1) | none | as Adaeze, `gwen_ko` |
| `elena_rodriguez` | story-critical / pinned by the text | unchanged | none | none | none | none | unchanged | none | unchanged |
| `ray_hollis`, `james_mercer`, `thomas_park` | patrolling or plot-located / holding, witness | unchanged | none | none | none | none | unchanged | none | unchanged |
| phone and cutscene records | never | unchanged | | | | | | | |

No machine is gated by a beat global. The cooler carries only the trouble gate (`offWhen: "ops_staff_upset"`), and only the pair uses it.

### 2.1 Why these two

Both come from the awareness course cast (D53), keep their names, looks and voices, and keep their kind of job. Adaeze Okafor (40s, Nigerian heritage, voice Gacrux, General American accent with a light Nigerian inflection) is a finance manager in the course; here she is the grid scheduler, the desk that balances load against contracts. Gwen Pritchard (late 30s, voice Sulafat, General American accent, Pacific Northwest) leads an IT service desk in the course; here she runs the ops floor's own systems support. Neither voice is used in m07; Gacrux is also used in m05 and m09 by other characters, which AC0 can confirm is acceptable. Every free man in the cast has a voice m07 already uses (Iapetus for Mercer, Rasalgethi for Park, Sadaltager for the Architect), so both picks are women. They speak American English because the facility is in the US; the course voice text is unchanged and only the m07 style differs (D113). Elena's voice is unchanged. They are operations staff because only OPERATIONS is short on the board. Their sprite keys are their names; no clash with m07's keys.

### 2.2 Posts and seats

`room_pnw_ops` (10 x 10 tiles of 32 px) has these chairs (Tiled, bottom-left origin): (60, 178), (124, 178), (60, 258), the office chair (236, 204) beside `pnw_console_pos1` (200, 156), and the supervisor's chair (86, 306) between the cooler and `desk1`. The cooler affordance carries `"seat": "stand"`, so using the cooler does not pull the supervisor's chair out. The chair at (236, 204) belongs to the abandoned console (`ops_floor_workstation`, "chair pushed back") and stays empty; the supervisor's chair and (60, 258) stay empty too, keeping the cooler corner clear. Gwen sits at (60, 178), Adaeze at (124, 178).

`position` and `needsHome` are in tiles, converted from the chair's measured body-centre cell (`HOME_EPS` 12 px), with `seated: true`. `needsHome` takes the object form with its room: `{ "room": "operations_floor", "x": 4, "y": 5 }` for Adaeze and `{ ..., "x": 2, "y": 5 }` for Gwen. The built cells are Adaeze (4, 5) and Gwen (2, 5), both `needsHome` and `position`. A walk from the west door to the supervisor's desk and on to the east door was checked live with both at post and both at the cooler (`LIVE_SLICE3.md`, L5).

### 2.3 When they exist

From the start, in the operations floor; they register when the player first opens the checkpoint to ops-floor door. They leave for good on the first `room_entered:server_room`. On each operator:

- `{ "eventPattern": "room_entered:server_room", "condition": "globalVars.<id>_ko !== true", "onceOnly": true, "setVisible": false }`. The mapping lives on the NPC; the ops floor is always loaded before the server room (`server_room` connects west to `operations_floor`, north to `scada_control` and south to `generator_room`, `:2050` to `:2054`, and the player reaches it through the ops floor), so it is live when it fires. Saved NPC visibility keeps her hidden after a reload.
- `{ "eventPattern": "room_entered:operations_floor", "condition": "globalVars.server_hall_reached === true && globalVars.<id>_ko !== true", "onceOnly": true, "setVisible": false }`, for a reload after the server room has been reached.
- `{ "eventPattern": "door_opened", "condition": "data.connectedRoom === 'operations_floor' && globalVars.server_hall_reached === true && globalVars.<id>_ko !== true", "onceOnly": true, "setVisible": false }`, so a reloaded game never shows them through the opening door (`door_opened` data: `roomId`, `connectedRoom`, `direction`, `doors.js:951` to `:956`).

A knocked-out operator is not hidden: the body stays where it fell. A struck, hostile operator who is not knocked out is hidden like the other. Hiding a seated NPC unseats it at once (main's engine fix). No emitter or other change was needed for this; the render after the hide was taken in the live checks (`LIVE_SLICE3.md`, L6, game 7972, repeated in 7975 and 7990) and shows both chairs empty with no seated sprite left.

### 2.4 Needs and the natural rhythm

One need each, met by the cooler (`ops_cooler`):

| Need | Adaeze | Gwen |
|---|---|---|
| thirst | initial 40, decayPerMin 10, urgentAt 30, jitterPct 10 | initial 55, decayPerMin 8, urgentAt 30, jitterPct 10 |

Adaeze leads every trip and Gwen follows (2.5). In the engine, jitter applies to `initial` (`npc-needs.js:520`) and to each refill (`:3675`); decay is fixed (`:1570`). The cooler preset restores 70, plus or minus 10%.

- First trip: Adaeze turns urgent after 1.05 to 1.95 needs-clock minutes; Gwen on her own would need 3.0 to 4.5, so the coupled row reaches her first.
- After a natural trip: Adaeze arrives at about 29 and refills to 92.5 to 100, urgent again 6.25 to 7.0 minutes later. The coupled row sets Gwen to 30 (her `urgentAt`), so she refills to 93 to 100 and is urgent again 7.8 to 8.75 minutes later, counting her later finish. The ranges do not overlap, so Adaeze is always the one who gets up next and Gwen never walks alone.
- After a talk break both start from their set values (Adaeze 20, Gwen 30 through the coupled row), which keeps the same order.

Five live tries cannot catch a rare order swap, so the order was also checked in a node simulation (not a live manual-clock run) that imports the engine's own seeded jitter function. Jitter is seeded per NPC (`npc-needs.js:483` to `:485`, `:515`), and the live seed is constant per scenario, so the simulation ran 50 different needs seeds, and for each covered three paths: a natural trip, a talk break from seated, and a talk-break set landing while Adaeze is mid-use (her refill then lands on 20, giving 83 to 97 and urgent again after 5.3 to 6.7 minutes). It asserted that Adaeze reaches `urgent` before Gwen every time, over four cycles per run. Result: 0 failures in 150 runs (`BUILD_LOG.md`).

The first natural trip must come no sooner than 45 s and no later than 120 s of real time after the room loads. The 45 s floor keeps both seated through the stacked first entry (the HaX hurt line at 1 s, the Architect's call at 5 s, the RFID guide text at 9.5 s; `:896`, `:903`, `:1604`, `:1306`). The needs clock was measured against real seconds (`references/measurement-recipes.md` section 10; ratio 1.0 within 1%), and Adaeze's `initial` (and Gwen's, keeping the gap) was set to land in that window. With initials 40 and 55 the measured first trip is about 82 s after the room loads. After a reload both start at `initial` again (needs are not saved), which is harmless: they sit, then go.

### 2.5 What starts a break

Talk always sends Adaeze, so the pair still go together:

- Talking to Adaeze: on Adaeze, `conversation_closed:adaeze_okafor`, `delayMs` 2000, `cooldown` 150000, `condition` `!globalVars.ops_staff_upset && globalVars.server_hall_reached !== true`, `needs: { set: { thirst: 20 } }`.
- Talking to Gwen: also on Adaeze, `conversation_closed:gwen_pritchard`, `delayMs` 4000, `cooldown` 150000, the same condition, `needs: { set: { thirst: 20 } }`. Gwen has no talk break of her own; she follows Adaeze through the coupled row below.
- Coupled, one way, on Gwen: `{ "eventPattern": "npc_use_started:ops_cooler", "condition": "data.npcId === 'adaeze_okafor' && !globalVars.ops_staff_upset", "delayMs": 2000, "cooldown": 10000, "needs": { "set": { "thirst": 30 } } }`. Adaeze leads; Gwen follows. The cooler has no third user, so the pair shut nobody out. The mapping cooldown is wall-clock time from when the row fires, 2 s after `npc_use_started`. At 10 s it is shorter than the 22 s use itself, so the row is ready for any second trip, even one that starts as soon as the first use ends (a talk break landing while Adaeze walks home). It cannot double-fire within one trip: `npc_use_started` is emitted once per use (`npc-needs.js:3574`) and a pending delayed row is deduplicated (`npc-manager.js:923`).
- No mapping keys on `room_entered:operations_floor` for a break, so nothing new fires on the stacked first entry.

### 2.6 Long enough to talk; hearing

The cooler preset gives capacity 2; `useSeconds` is 22, long enough for two or three pool lines or a short exchange. `overhearRadius` 360 covers the 10 x 10 tile room. Chatter carries at 40% through the open west or east door and stops when it shuts; it is muted while any person-chat or phone-chat is open, so the Architect's call silences the pair. The cooler sits beside the supervisor's desk, which the player must visit, so the player walks in on them rather than only hearing them.

### 2.7 Trouble

- On `agent_0x99` (phone, registered at game start), appended after every existing mapping and outside every ERB loop:
  - `{ "eventPattern": "npc_attacked:adaeze_okafor", "onceOnly": true, "setGlobal": { "ops_staff_upset": true } }` and the same for `gwen_pritchard`. `npc_attacked` fires on the first hit while the NPC is still friendly (`player-combat.js:461`). Both start friendly and are not `koImmune`, so every KO of either comes after an `npc_attacked`; no KO row is needed for the trouble global.
  - The hands-down hint: two rows, `npc_ko:adaeze_okafor` and `npc_ko:gwen_pritchard`, each with the same `!globalVars.hands_down_said` condition, `onceOnly`, `setGlobal` and message text as the existing loop rows (`:1255` to `:1263`), copied word for word. Appended after the existing mappings (`:1417` to `:1432`), not added to the ERB loop, so no existing once index moved. No new line.
- `offWhen: "ops_staff_upset"` on the cooler (object level). Once set, a walk to it turns back and the NPC walks home; a use in progress finishes first.
- Both NPCs: `"behavior": { "hostile": { "leash": true, "chaseRange": 200 } }` so a struck operator stays near her post (the 200 px range bounds the chase; the game default is longer). `npc_attacked` turns only the struck one hostile; the other stays talkable and her ink reacts (2.8).
- `globalVarOnKO`: `adaeze_ko`, `gwen_ko`.
- Credits, two entries after Park's block (`:284` and `:285`), outside any ERB loop, style `warning`:
  - `OPERATIONS STAFF: Hurt on your way through`, condition `globalVars.adaeze_ko || globalVars.gwen_ko`.
  - `OPERATIONS STAFF: Struck, left the building`, condition `globalVars.ops_staff_upset && !globalVars.adaeze_ko && !globalVars.gwen_ko`.
  - Restarting the mission keeps `ops_staff_upset` and so keeps the struck line in the credits. This is deliberate and matches m05: the record of what the player did survives a restart.
- Debrief: unchanged. KO scores nothing in m07 (`ink/m07_closing_debrief.ink:434` to `:511` only pick lines for the four story NPCs).
- No new HaX message on an attack beyond the copied hands-down rows.

### 2.8 Talk

Each has a short conversation in its own ink file: `ink/m07_npc_adaeze_okafor.ink` and `ink/m07_npc_gwen_pritchard.ink`, compiled to `.json`, `storyPath` pointing at the JSON. Each declares `VAR ops_staff_upset = false` (synced from the global) and two local variables, `VAR met = false` and `VAR hub_quiet = false`.

The files follow the m05 hub shape (`ink/m05_npc_thandiwe_moyo.ink` is the model), because `#exit_conversation` saves the current knot and the next talk resumes there, not at `start`. A check placed only in `start` would be skipped on the second talk.

- `=== start ===` holds nothing but `-> hub`.
- The top of `=== hub ===` starts with the skip-once guard, as in m05 (`m05_npc_thandiwe_moyo.ink:12` to `:13`, `:19` to `:23`, `:32`): `{hub_quiet: ~ hub_quiet = false - else: <branch>}`, where the branch is:
  - `ops_staff_upset` true: one short upset line, then `~ hub_quiet = true`, `#exit_conversation` and `-> hub`;
  - `met` true: one "still here?" repeat line;
  - otherwise the opener (two to three lines) and `~ met = true`.
- One player choice follows, inside `hub` so its source knot is `hub`: a goodbye line, then `~ hub_quiet = true`, `#exit_conversation` and `-> hub`.

The guard stops the `-> hub` after an exit from printing the repeat or upset line a second time with the exit tag attached; the chat closes on the goodbye or the upset line itself. On the next talk the engine re-enters `hub` with fresh globals, the guard is already cleared, and the upset check runs again; an operator who was friendly on the first talk gives the upset line once her colleague has been struck. `met` and `hub_quiet` are NPC ink-local variables, which are saved and restored on a reload (`npc-conversation-state.js:248` to `:265`), so after a reload a player who has met her hears the repeat line, not the opener.

The two exchange knots (`ex_last_two`, `ex_going_now`) live in Adaeze's file, outside the hub; each line carries a speaker prefix with the display name (`Adaeze Okafor:` or `Gwen Pritchard:`, the engine convention) and each knot ends `-> DONE`.

They take the player for someone the utility sent in; they are leaving in a minute; they name no key, PIN, password, room route or person's whereabouts, and say nothing about Hollis, Elena, Mercer or Park. No global is set in either ink. The chat background is the ops floor's room background (no NPC-level `chatBackground`, no `Background[...]` line).

### 2.9 As built: Adaeze's record

```json
{ "id": "adaeze_okafor", "displayName": "Adaeze Okafor", "npcType": "person", "gender": "female",
  "spriteSheet": "adaeze_okafor",
  "spriteTalk": "assets/characters/adaeze_okafor_talk.png",
  "spriteVisemes": "assets/characters/adaeze_okafor_visemes.png",
  "avatar": "assets/characters/adaeze_okafor_headshot.png",
  "spriteConfig": { "idleFrameRate": 6, "walkFrameRate": 10 },
  "storyPath": "scenarios/m07_architects_gambit/ink/m07_npc_adaeze_okafor.json", "currentKnot": "start",
  "voice": { "name": "Gacrux", "style": "The facility's grid scheduler, in her 40s, who balances the load against the contracts, warm and direct. Speak with a consistent General American accent with a light Nigerian inflection throughout, do not shift to any other accent.", "language": "en-US" },
  "position": { "x": 4, "y": 5 }, "seated": true,
  "needsHome": { "room": "operations_floor", "x": 4, "y": 5 },
  "needsRooms": ["operations_floor"],
  "needsCompany": { "groups": ["ops_floor"] }, "chatterCooldownMin": 2,
  "globalVarOnKO": "adaeze_ko",
  "behavior": { "hostile": { "leash": true, "chaseRange": 200 } },
  "needs": { "thirst": { "initial": 40, "decayPerMin": 10, "urgentAt": 30, "jitterPct": 10 } },
  "chatter": { "cooler": ["Cold water again. Great.", "The load is holding. Don't jinx it.", "Somebody fix that coffee machine.", "Almost there. Almost."] },
  "exchanges": [
    { "with": "gwen_pritchard", "knot": "ex_last_two", "requireGlobal": { "ops_staff_upset": false, "server_hall_reached": false } },
    { "with": "gwen_pritchard", "knot": "ex_going_now", "requireGlobal": { "ops_staff_upset": false, "server_hall_reached": false, "heard_ex_last_two": true } } ],
  "eventMappings": [
    { "eventPattern": "conversation_closed:adaeze_okafor", "condition": "!globalVars.ops_staff_upset && globalVars.server_hall_reached !== true", "delayMs": 2000, "cooldown": 150000, "needs": { "set": { "thirst": 20 } } },
    { "eventPattern": "conversation_closed:gwen_pritchard", "condition": "!globalVars.ops_staff_upset && globalVars.server_hall_reached !== true", "delayMs": 4000, "cooldown": 150000, "needs": { "set": { "thirst": 20 } } },
    { "eventPattern": "room_entered:server_room", ... }, and the other two hides of 2.3 ] }
```

(The record is at `:1866` to `:1901`; `observations` is also set and is left out above.)

Gwen's record (`:1902` to `:1932`) mirrors it with her own keys, position and `needsHome` (2, 5), voice Sulafat, thirst `initial` 55 and `decayPerMin` 8, chatter "Cooler's the only thing working.", "Plan's simple: finish up, then out.", "I'd give a lot for real coffee.", "Last glass, then I'm off.", no `exchanges` (the pair's exchanges sit on the lower id), no talk break, the coupled break and her own hides. Exchange knots live in Adaeze's ink file. The pool lines and knots are written in `DIALOGUE_SAMPLE.md` and `SPOKEN_LINES.md`, not here.

Exchange topics (the sample fixes the words): `ex_last_two`, the board is amber, the machine is still broken, and somebody should have crossed them off by now; `ex_going_now`, they agree to go once this is logged. Neither mentions the supervisor's tray, the key, the handover sheet's contents or the PIN, and neither contradicts a clue.

## 2A. Story-safe movement (D78, D84)

None free. Hollis patrols, guards and holds the badge; Mercer and Park are plot-located; Elena is pinned by her ink, which narrates her at the SCADA backup rack, and fails the open-conversation rule. No existing NPC gains any needs-layer key.

Elena's position, not changed here (D115 a: a later room-dressing pass): her record stands her at (3, 7.5) (`:2062`), by the KVM cart (`kvm_cart1`, 110, 200, `room_pnw_servers`), while her ink places her at the backup rack (`pnw_backup_server1`, 256, 170). Proposed fix for a later dressing pass: move her `position` to the cell in front of the backup rack, measured in that pass with the room render, and re-check her `room_entered:server_room` hide (`:2095`) and her conversation background. It changes no lock, key or line, so the lock and key diff stays empty. This build does not change it.

## 3. Rooms and objects

Scenario: `"officePresets": true`.

| Object | Room | Declared as | Preset or affordance |
|---|---|---|---|
| `ops_cooler` | operations_floor | `"type": "water_cooler"` (base name, never `water_cooler1`), no `position` (claims the Tiled sprite at 60, 300) | cooler preset (capacity 2, pool `cooler`, no queue) plus `{ "useFrom": { "dx": 0, "dy": -1 }, "useSeconds": 22, "overhearRadius": 360, "seat": "stand" }`; `"offWhen": "ops_staff_upset"`. The preset merge is shallow per field, so only these keys are written |
| `coffee_station1` | operations_floor | not declared: broken by the handover sheet (`:1995`) | none; stays Tiled decor |
| `ops_floor_workstation` | operations_floor | unchanged (`:2003`) | add `"affordance": false` so the abandoned console gains no desk preset |
| `badge_printer`, `crisis_control_system` | checkpoint, scada | unchanged | `lockType` set, never gain a preset |
| `drinks_vending1`, `phone1`, `phone2` | Tiled decor | not declared | none |

The cooler stands against the south wall with a collision strip at y 290 to 300, so its use cells are on its north side. Only one use cell is authored: `useFrom`, written as tile offsets from the object centre (`npc-needs.js:5456` to `:5460`). The engine places the second user itself, on the first free cell beside the first user's cell in the order east, west, south, north (`npc-needs.js:5663` to `:5674`); if none is free she logs `no_beside_cell` and does not use the cooler. The corner is tight: chair (60, 258) sits directly north of the cooler and the supervisor's chair (86, 306) to its east, and the desk front where the key lies (123, 281) must stay clear.

`useFrom` is dx 0, dy -1: the first user stands on the cell north of the cooler centre and the engine put the second beside it. The measured cells were Adaeze about (79 to 83, 244) and Gwen about (112 to 115, 241 to 244) in room pixels, both free, walkable and clear of the desk front. The grey office chair at (60, 258) overlapped Adaeze's cooler cell, so it was moved one cell west to x 32 in a Tiled dressing tweak (`room_pnw_ops.json` and `.tmj`; only m07 uses this room). The positions diff (10.6) shows that chair as well as `ops_cooler`, and only those. The needs logs of the measured trips show no `no_beside_cell`. No same-image twin of the cooler exists in the room. The declared cooler gets a display `name` and plain-text `observations` that fit the room.

Lighting: the ops floor is lit by the amber video wall and the console screens, with ceiling pools off (`:1832` onward). The corner was rendered with both operators at the cooler and both at post (`LIVE_SLICE6.md`); they read clearly against the amber mood, so no emitter was added and the scenario's lighting is unchanged. No other room changed.

## 4. Levers

None. The only objects near the pair are the critical-path key and the PIN sheet; a lever there would invite a second way past a lock.

## 5. Physical-pentest openings

None.

## 6. Spoken lines

- Pools: Adaeze and Gwen, four cooler lines each, 8 lines, each 40 characters at most, no variables or speaker prefixes. They may grumble about the broken coffee machine; they never name the key, the tray, a PIN or a password.
- Exchanges: two knots, `ex_last_two` and `ex_going_now`, four to six lines each.
- Conversations: per operator an opener (two to three lines), an upset line and a repeat line.
- No barks. The two hands-down rows reuse existing text. No existing line changes.

All lines go in `SPOKEN_LINES.md` with characters per line; `DIALOGUE_SAMPLE.md` holds three pool lines per speaker, one exchange, and each voice style quoted from the course with only the job sentence changed. Estimated clips: about 28.

## 7. Sync budget

| Piece | Count | Notes |
|---|---|---|
| Workstation globals | 0 | |
| `heard_` keys | 2 | `heard_ex_last_two`, `heard_ex_going_now` |
| Trouble globals | 1 | `ops_staff_upset`, monotonic |
| KO globals | 2 | `adaeze_ko`, `gwen_ko` |
| Saved NPC visibility keys | 2 | one per operator |
| Saved NPC hostility keys | up to 2 | |
| NPC ink-local keys | 4 | `met` and `hub_quiet` on each operator, bounded booleans |
| Reveal globals | 0 | |
| Beat or derived gate globals | 0 | |
| Mappings with cooldown, no `onceOnly` | 3 | two talk breaks on Adaeze (one per operator's close), one coupled break on Gwen |
| Plain mappings | 0 | |
| `onceOnly` mappings | 10 | six hides, two attack rows, two hands-down rows |
| Servings | 0 | |
| Office-life items | 0 | |

Every new global is a bounded scalar sent as a per-key delta. Nothing grows.

## 8. Field names to write

Scenario: `officePresets`. NPC: `currentKnot`, `needs` (`initial`, `decayPerMin`, `urgentAt`, `jitterPct`), `needsHome` (`room`, `x`, `y`), `needsRooms`, `needsCompany.groups`, `chatterCooldownMin`, `chatter`, `exchanges` (`with`, `knot`, `requireGlobal`), `seated`, `globalVarOnKO`, `behavior.hostile.leash`, `behavior.hostile.chaseRange`, `voice`, `spriteSheet`, `spriteTalk`, `spriteVisemes`, `avatar`, `spriteConfig`, `storyPath`. Object: `type`, `offWhen`, `affordance` (`overhearRadius`, `useSeconds`, `useFrom.dx`, `useFrom.dy`, `seat`; no `capacity` or `queue` key), `affordance: false`. Mapping: `eventPattern`, `condition`, `delayMs`, `cooldown`, `onceOnly`, `setVisible`, `setGlobal`, `needs.set`. Credits entry: `text`, `style`, `condition`. `globalVariables`, in a new office-life block at the end of the object (`:2714` to `:2719`; the closing `}` is at `:2720`), after the last existing entry, which carries a trailing comma, outside every `<% %>` tag, all `false`: `ops_staff_upset`, `adaeze_ko`, `gwen_ko`, `heard_ex_last_two`, `heard_ex_going_now`. All at `FormatUpgrade.current`.

## 9. Costs and decisions

| Item | Cost | Decision |
|---|---|---|
| Tier 2 small | build time only | QUESTIONS Q1 |
| Two awareness-cast operators | none: art complete | QUESTIONS Q3 (AC0 checks clashes) |
| American voice styles (`en-US`) | none | D113, QUESTIONS Q2 |
| Voicing | about 28 clips | after the build, with the V6 count |
| Elena's position | none here | later room-dressing pass (D115 a); QUESTIONS Q4 |

### Settled here, with reasons

- No existing NPC moves: none is free (2A).
- The coffee machine stays broken: the handover sheet says so, and the player must read it.
- Talkable, with lines that offer nothing: ambient staff who ignore the player read as props.
- No levers or openings: nothing optional sits near the pair.
- No debrief change: KO scores nothing in m07.

## 10. Checks

### 10.1 Walkthrough

`TESTING_WALKTHROUGH.md` critical path with office life on, scripted, on a fresh game (`LIVE_SLICE3.md`, R1 m5 walkthrough run).

### 10.2 Live office-life checks (walking pace)

Results are in `LIVE_SLICE3.md` and `LIVE_SLICE6.md`.

- L1: first ops-floor entry: both seated at post through the HaX line, the Architect's call and the RFID text; no chatter during the call.
- L2: both reach `using` at `ops_cooler` together on the natural trip, after talking to Adaeze, after talking to Gwen, after talking to Adaeze within 60 s of the pair returning from a natural trip, and after talking to both back to back; Gwen never walks to the cooler alone and Adaeze never goes twice without her; no `no_beside_cell` in the needs log; pool lines heard in the room.
- L3: `ex_last_two` heard once, then `ex_going_now` once, only under their globals; `heard_` set only when heard in the room.
- L4: talking to each opens the ops-floor background; the lines offer nothing; a second talk gives the repeat line; the pair's break follows after either chat closes. Each chat closes on the goodbye or upset line itself, with no repeat line after it. Talk to one, strike the other, talk to the first again: the upset line plays exactly once on that second talk. Reload after meeting one: the repeat line plays.
- L5: the player walks west door to desk to east door with both at post and both at the cooler, never blocked; the key and the handover sheet stay reachable.
- L6: enter the server room: both hidden, no seated sprite left; go back to the ops floor: still gone.
- L7: lighting: both readable at the cooler.
- L8: the coffee station is never used.

### 10.3 Reload

Reload on the ops floor before the server room: both at post, sitting. Reload after reaching the server room, then walk back: neither appears, including through the opening door.

### 10.4 Attack probe (fresh game per step)

Attack Adaeze walking, Gwen seated, and one at the cooler: hostile with leash, stays near post; `ops_staff_upset` set; cooler off; the other walks home; a KO body stays; the hands-down hint shows on a first KO; the right credits line shows. Then enter the server room: a KO'd operator stays, the other hides.

### 10.5 Measured numbers

Chair cells, `useFrom` and the engine's second cell (section 3); needs-clock to real seconds and the first-trip time, about 82 s after load (2.4); the 50-seed order check, a node simulation (2.4); use time 22 s. All are in `BUILD_LOG.md`.

### 10.6 Static checks

Validator 0 errors, new warnings cleared or justified; `--office-summary` differs from `v1_summary_base.txt` only by the two new NPCs; positions diff against `positions_base.txt` shows only `ops_cooler` and the moved chair (60, 258); ink compiles, `dialoguelint.mjs`, inkcheck, loopcheck.

### 10.7 Lock and key diff

`ruby scripts/lock_key_diff.rb scenarios/m07_architects_gambit/scenario.json.erb scenarios/m07_architects_gambit/office_life/baseline_locks.json`: empty.

### 10.8 Documents

`SPOKEN_LINES.md`, `DIALOGUE_SAMPLE.md`, `BUILD_LOG.md`, `LIVE_*.md`, `LOG.md`, `HANDOVER.md`. Lab sheet: no new optional route, so no lab-sheet change; flag it to the user at the close.
