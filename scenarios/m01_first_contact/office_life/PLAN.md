# m01 First Contact: office-life plan

Base: `plan/ol-m01` at `bd533fb21`. Evidence: ANALYSIS.md. Baseline: BASELINE.md. Line numbers are `scenarios/m01_first_contact/scenario.json.erb` unless a file is named.

m01 is the production deploy-gate mission. The plan keeps risk to the critical path low: no story NPC moves, no lock, key, item or objective changes, and the first build step proves the riskiest assumption before anything else is built.

## 1. Decision

The main office is the hub and is empty on a working morning. Two awareness-cast extras, Fatima Begum and Graham Whitfield, sit at desk PCs in it and type. Room tone goes on. Nobody else gets people or needs except Maya, who takes one short trip after her first talk (4.9).

Two tiers, both built. Tier 1 is the first build stage and a safe stopping point; tier 2 follows it:

- Tier 1: the two extras sit and type, one once-only bark each, a short brush-off conversation each, room tone, attack handling, leaving after the reveal. No new object.
- Tier 2 (settled, D88 a): tier 1 plus a water cooler placed by the scenario. The extras take short breaks at it, chat from a pool and have two exchanges that are heard once. Maya's short routine (4.9) uses the same cooler.

Settled rulings this plan follows: D84 b (a few story NPCs with an always-open conversation may take short routines, at most two or three per mission, found at post first, scripted runs wait until they are back at post; this plan gives Maya one short routine, 4.9), D77 (m01 gets `"npcThoughts": false`; the key comes from the separate npcThoughts branch and is not added by this plan).

## 2. Build order

0. Step one, before anything else: prove that a person NPC with only a short brush-off conversation (or none) works in the engine. Add Fatima alone with `"seated": true` at her chair-centre spawn (section 4.3), with a one-knot ink file that has a single exit and nothing else, boot a keyless server, talk to her, leave, talk again, reload. Check no console error, no stuck conversation state, no stuck "talk" prompt, and the validator's `npcType: person` rules. The proof ink is `=== start ===`, the greeting line, one `+ [Don't let me keep you.]` choice (reworded from `[Let her get on]` in the dialogue pass), the reply, `#exit_conversation`, `-> DONE`, with `-> start` as the root divert above it as the m03 extras have. `bin/inklecate` compiles that shape and `dialoguelint.mjs` reports no findings. The validator never inspects knot or choice counts, so only the live proof can show whether the engine copes with it. Fallback if it fails: give each extra a two-knot ink with a hub that always returns to a single exit choice (the m03 extras pattern); if that also fails, drop to tier 0 (room tone only, as m08) and report. Step 2 removes `seated` when it adds the `work` need, because once an NPC has needs the engine ignores `seated` and the needs seat takes over (seating.js:1970-1972). Nothing else is built until this passes.
1. Room tone (section 4.1) and validator.
2. Desk PCs and the two extras (4.2 to 4.4).
3. Leaving after the reveal, attack handling, credits, HaX texts (4.5 to 4.7).
4. Tier 2: cooler, needs, breaks, exchanges (4.8).
5. Maya's routine (4.9): the needs block and mapping, then the `maya_away` mappings and the ink guards, then compile the ink and run the m01 regression run.
6. Tests (section 8), commit, report.

## 3. Tiers

| | Tier 1 | Tier 2 |
|---|---|---|
| People | Fatima, Graham | same, plus Maya's one trip (4.9) |
| New objects | 2 desk PC declarations (claim existing Tiled sprites) | plus 1 water cooler |
| Needs | `work` at own PC | plus `thirst`, `needsCompany`; Maya `thirst` |
| Voiced lines | 2 barks, 4 talk lines = 6 clips | plus 8 pool, 8 exchange = 22 clips; Maya none new |
| New globals | `fatima_ko`, `graham_ko` | plus `m01_staff_alarmed`, `heard_ex_interns`, `heard_ex_biscuits`, `maya_away`, `maya_settled` |
| Room tone | yes | yes |

## 4. Change per slice

### 4.1 Room tone

```json
"roomTone": true,
"roomToneTypes": { "room_reception": "quiet_office", "room_office": "it", "room_break": "quiet_office" },
"npcThoughts": false
```

- Keys are room types (`profileForRoom` reads `scenario.rooms[roomId].type`); `roomToneTypes` wins over the default map (office-room-tone.js:41-46).
- Reception gets `quiet_office`. The stock `reception` profile has `distant_phone` spots, and m01 has two phone clues (the reception voicemail phone and Patricia's desk phone). `distant_phone` is suppressed only by a declared object with `deskPhone: true` (office-room-tone.js:107-113) and reception_desk_phone has none, so a ring in the distance would send players looking for a phone to answer.
- The main office gets `it`: typing, no spots, so no copier or phone noise. Typing plays only for a needs NPC in the `using` phase of a `work` job (seating.js:1192-1196), so the bed is silent until an extra works.
- Break room (settled, D88 e): the stock `kitchen` profile hums a fridge that is not placed, so the break room gets `quiet_office`.
- Other rooms stay unmapped, and `profileIdFor` then falls back to the stock type table (office-room-tone.js:42-47, data/room-tones.json). What each unmapped m01 room plays: `it_room` (room_it) takes the stock `it` profile, an `office_ambient` bed at 0.8 with typing allowed (silent, because Kevin has no `work` need) and no spots; `conference_room` (room_meeting) takes `meeting`, no bed, no spots; `server_room` (room_servers) takes `server`, but its authored `ambientSound` (:2123-2124) wins; `storage_closet`, the two halls and the four small offices have types the table does not know, so they get no tone. Only the stock `office` and `reception` profiles carry spots (copier, phone), and both of those rooms are mapped above, so no unmapped room can ring a phone. No room with a phone clue needs re-mapping. Kevin's IT room keeps the stock `it` bed on purpose (an office murmur in a working IT room); the build checks it in test 5, and if it sounds wrong there, `"room_it": "quiet_office"` is a one-line change.
- `npcThoughts: false` is listed because D77 settles it. The key landed with the main merge and the build includes it (scenario.json.erb:513).
- The music `npc_hostile_state_changed` handler (:89-95) is unchanged.

### 4.2 Desk PCs

Typing needs a `work` need at a desk PC. The Tiled item pool is keyed by base type with trailing digits stripped (`core/rooms.js:186-192`, indexed `:229-241`), and `findMatchFor` looks up the scenario object's exact `type` (`:261-279`). room_office.json holds one `pc` sprite type three times (they are named pc6, pc8 and pc11 in the map); a scenario type of `pc6` or `pc8` finds nothing, falls to `createSpriteAtRandomPosition` and draws a second PC at a random spot. So the two desk PCs are declared as `"type": "pc"` with no `position`, and each claims the first unreserved `pc` in the map's table_items layer order. That order is pc8 at (6.62, 4.08), then pc6 at (2.25, 5.62), then pc11 at (2.41, 4.14). So `graham_pc` is declared first (claims pc8, east) and `fatima_pc` second (claims pc6, west); swapping them would put each extra at the wrong desk. The ERB carries a comment saying the declaration order decides the claim. No map edit: room_office.json is the map for 85 scenarios, including the Hacktivity fixtures `test_objectives` and `test_simple_success`.

```json
"objects": [
  {
    "_comment": "Declaration order decides which Tiled pc each claims (layer order: pc8 east, then pc6 west). Graham first.",
    "type": "pc",
    "id": "graham_pc",
    "name": "Finance PC",
    "takeable": false,
    "observations": "A spreadsheet with more tabs than anyone could need.",
    "affordance": { "satisfies": "work", "restores": 40, "useSeconds": 40, "useFrom": { "dx": 0.16, "dy": 1.15 } }
  },
  {
    "type": "pc",
    "id": "fatima_pc",
    "name": "Recruitment PC",
    "takeable": false,
    "observations": "A recruitment tracker, half full of candidate names.",
    "affordance": { "satisfies": "work", "restores": 40, "useSeconds": 40, "useFrom": { "dx": -1.38, "dy": -0.24 } }
  }
]
```

`officePresets` stays off, so each affordance is written by hand. With presets on, every declared object of a preset type would gain an affordance (office-presets.js:48-60) and spill onto story PCs; with them off an object's own affordance is used as written (office-presets.js:66-69), and a `pc` takes no preset. The observation text carries no clue, name or code.

Chair pairing. A `work` use defaults to the `fetch` seat (seating.js:2103-2115), so an extra may pull whichever swivel chair is nearest the use cell. `useFrom` is a tile offset from the PC's sprite centre to the cell the NPC stands at (the approach is the nearest walkable cell to the object centre plus `useFrom` times 32, npc-needs.js:5224-5228 and :5420-5430), and the NPC faces back along it (seating.js, facePointFor). Tiled `gid` objects anchor at the bottom-left and item sprites draw at (x, y minus height) (core/rooms.js:540), so every coordinate below is a sprite centre. pc8 (6.62, 4.08), 34x22, has its centre at (7.15, 3.74); Graham's chair 157 (`chair-white-2-rotate3`, 32x32, anchored at (6.81, 5.39)) has its centre at (7.31, 4.89), so his `useFrom` is dx 0.16, dy 1.15 and he faces north. pc6 (2.25, 5.62), 32x30, has its centre at (2.75, 5.15); Fatima's chair 158 (`chair-white-2-rotate6`, anchored at (0.87, 5.41)) has its centre at (1.37, 4.91), so her `useFrom` is dx -1.38, dy -0.24 and she faces east. The other four chairs (152 to 155) have no foot point within 40 px of either spawn. The build measures each seated body-centre against its chair (HOME_EPS 12 px) and records the final `useFrom` values. If the render shows Fatima's chair belongs to the north desk (pc11), the claim order changes: a position-less spare `pc` object with `"name": "Desk PC"` and `"observations": "A spare desk PC, switched off."` and no affordance is declared between the two to absorb pc6, and the build records it.

Render check (build step 2 and test 7): render the room with both extras seated and assert (a) exactly one `pc` sprite at each of pc8's and pc6's map positions and no `pc` anywhere else (the MR 2 double-load check); (b) each extra's body-centre is within 12 px of the intended chair's seat position and the NPC faces its screen; (c) no extra sits at a chair that belongs to the other desk.

### 4.3 The people (npcs array on `main_office_area`)

Both extras are `npcType: "person"`, spriteSheet and talk and visemes from the awareness cast (art exists, seated and `pose_*` frames in all eight directions), each with a short ink file (`m01_npc_fatima_begum.ink`, `m01_npc_graham_whitfield.ink`). No `itemsHeld`, no drops, no `challengeOnSight`.

```json
{
  "id": "fatima_begum",
  "displayName": "Fatima Begum",
  "npcType": "person",
  "position": { "x": 1.37, "y": 4.91 },
  "spriteSheet": "fatima_begum",
  "spriteTalk": "assets/characters/fatima_begum_talk.png",
  "spriteVisemes": "assets/characters/fatima_begum_visemes.png",
  "storyPath": "scenarios/m01_first_contact/ink/m01_npc_fatima_begum.json",
  "currentKnot": "start",
  "voice": { "name": "Vindemiatrix", "style": "Recruitment lead in her thirties, British Bangladeshi, Yorkshire accent. Brisk, friendly, a little rushed.", "language": "en-GB" },
  "behavior": {
    "facePlayer": true,
    "facePlayerDistance": 96,
    "hostile": { "fightStyle": "cower", "fleeSpeed": 120, "attackDamage": 5, "attackCooldown": 1200, "pauseToAttack": true, "leash": true, "chaseRange": 160 }
  },
  "globalVarOnKO": "fatima_ko",
  "needsHome": "fatima_pc",
  "needsSpeed": 70,
  "needsRooms": ["main_office_area"],
  "needs": {
    "work": { "decayPerMin": 30, "urgentAt": 70, "initial": 60 }
  },
  "needsCompany": { "groups": ["vd_office_staff"] },
  "chatter": {},
  "eventMappings": [ ]
}
```

Graham is the same shape: `graham_whitfield`, position (7.31, 4.89) east at `graham_pc`, voice Vindemiatrix swapped for Umbriel ("Finance training lead in his early sixties, Halifax accent, dry and unhurried"), `globalVarOnKO` `graham_ko`. An NPC's tile position is its body centre (npc-sprites.js:118-125), so each spawn is the chair's sprite centre, not the Tiled corner (a corner puts the feet in the wall or on a desk). `seated` picks the nearest free chair whose foot point (chair bottom-centre, seating.js:263-266) is within 40 px of the body centre (seating.js:1055-1069); each spawn is 16 px from its own chair's foot point and no other chair's. The seated chairs are `chair-white-2-rotate6` (Fatima) and `chair-white-2-rotate3` (Graham); both families are seatable (seating.js:135-145). Step 0 carries `"seated": true`; step 2 removes it with the `work` need added. Numbers (decay, `urgentAt`, `restores`, `useSeconds`) are estimates tuned in the build. `leash` and `chaseRange` sit inside `behavior.hostile`, where the engine reads them (npc-behavior.js:667-668, as m01's Sarah has them at :601-607); a `leash` placed directly under `behavior` is read by nothing. `chaseRange` starts at 160 px (five tiles) and is tuned in the build so a hostile extra does not follow the player out of the main office (test 10).

### 4.4 Barks (tier 1)

```json
{ "eventPattern": "room_entered:main_office_area", "onceOnly": true, "delayMs": 2000,
  "condition": "!globalVars.fatima_ko && !globalVars.entropy_reveal_read",
  "bark": "Morning. Busy week." }
```

Graham's bark uses `condition: "data.previousRoom !== 'reception_area' && !globalVars.graham_ko && !globalVars.entropy_reveal_read"` so it fires on the first return to the office from elsewhere, not on the first entry, when HaX's call rings (6 s delay, :763-769) and Fatima has just spoken. Both are scenario data only; text in SPOKEN_LINES.md.

Gap to HaX's ring: Fatima's bark fires 2 s after entry and the ring 6 s after, so the two start 4 s apart. A 7-word toast stays up `3000 + 7 x 300 = 5.1 s` (bark-lifetime.js), so the bark is still on screen when the ring starts, and that is acceptable: the ring hold (npc-barks.js, `phoneRinger.callActive`) only defers barks that arrive during the call, and the bark toast is a corner notice, not a call. A voiced bark of about 2.5 s ends about 1.5 s before the ring. If the build measures the clip over 3.5 s, lower Fatima's `delayMs` to 1000 so the voice always ends before the ring starts.

### 4.5 Leaving after the reveal (settled, D88 b)

Derek's greeting is "Working late on the security audit?" and the confrontation follows a fight next door. Staff typing in the hub at that point would read badly, so the extras leave after `entropy_reveal_read`, out of sight. That global turns in the server room (`onPickup`, :2205), two rooms from the main office.

```json
{ "eventPattern": "global_variable_changed:entropy_reveal_read", "condition": "value === true", "setVisible": false }
{ "eventPattern": "room_entered:server_room", "onceOnly": true, "condition": "globalVars.entropy_reveal_read === true", "setVisible": false }
{ "eventPattern": "room_entered:it_room", "onceOnly": true, "condition": "globalVars.entropy_reveal_read === true", "setVisible": false }
```

Per NPC, so two onceOnly re-hides each plus the plain hide. Why this is safe:

- The plain hide fires while the player is in the server room, so it is never seen. The extras' mappings are live by then: the only route to the server room passes through the main office, and rooms load when a door opens (npc-lazy-loader.js:96-105).
- A reload restores `npcVisibility` before NPCs register (state-sync.js:548-550), and a reload spawns the player in reception (intentional), so the extras never appear.
- The re-hides sit on the server room and IT room, not on reception or the main office, because a re-hide there would fire in view. No render is needed: the plain hide fires first, while the player is in the server room, so the onceOnly re-hides only ever act on NPCs that are already hidden (closed in build review R2).
- The hide applies whether or not the extra was knocked out, so the body leaves out of sight. Every non-hide mapping on the extras (the barks, Fatima's break in 4.8, Graham's cooler follow in 4.8) carries `!globalVars.<npc>_ko`; the hide is unguarded. There is no show mapping, so no needs state is set before a show.
- No second turn event exists in m01, only the global.

The build renders the turn, including the seated hide, and confirms no seat or PC is left reserved.

### 4.6 If attacked

Both cower like Maya (the `hostile` block above). Music switching to the threat playlist on `npc_hostile_state_changed` is existing behaviour and applies. Each gets one HaX text on `npc_attacked`, onceOnly, appended at the END of agent_0x99's mappings so existing onceOnly handler indexes do not shift:

```json
{ "eventPattern": "npc_attacked:fatima_begum", "onceOnly": true,
  "sendTimedMessage": { "delay": 1500, "message": "Stand down, Agent. She runs recruitment. She's not part of this." } }
{ "eventPattern": "npc_attacked:graham_whitfield", "onceOnly": true,
  "sendTimedMessage": { "delay": 1500, "message": "He's in finance, Agent. Nothing to do with this. Stand down." } }
```

These follow the Maya format (:701-715) and are not voiced. Tier 2 adds `setGlobal` mappings so `m01_staff_alarmed` turns on from either `npc_attacked` or `global_variable_changed:derek_fight_triggered`.

### 4.7 Credits

Append to the PERSONNEL block (:133-145) after Kevin's lines:

```
FATIMA BEGUM: Bystander knocked out, no ENTROPY connection
GRAHAM WHITFIELD: Bystander knocked out, no ENTROPY connection
```

Each is shown only when that NPC's KO global is true. The block's existing form (:133-145) is an object `{ "text": "...", "style": "entry", "condition": "globalVars.<name>" }` with a bare `globalVars.` expression, as the Sarah line has it for `sarah_ko`; the new lines are exactly that:

```json
{ "text": "FATIMA BEGUM: Bystander knocked out, no ENTROPY connection",   "style": "entry", "condition": "globalVars.fatima_ko" },
{ "text": "GRAHAM WHITFIELD: Bystander knocked out, no ENTROPY connection", "style": "entry", "condition": "globalVars.graham_ko" }
```

They go after the Kevin lines and before the empty spacer line. The existing lines use a long dash inside their text; the new lines use a comma, per the house style.

### 4.8 Tier 2: water cooler, breaks, exchanges

The cooler is a scenario object with its own position and never goes in room_office.json. Placing it is settled (D88 a). The filing cabinet does the same thing in this room (:1252-1262), and test_needs_leash declares a `water_cooler1` this way inside a room_office map (scenarios/test_needs_leash/scenario.json.erb:95-101).

```json
{
  "type": "water_cooler1",
  "id": "office_cooler",
  "name": "Water Cooler",
  "position": { "x": 5.4, "y": 8.2 },
  "takeable": false,
  "observations": "A water cooler with a stack of paper cups beside it.",
  "affordance": {
    "satisfies": ["thirst", "social"], "restores": 70, "useSeconds": 15, "capacity": 2,
    "useFrom": { "dx": 0, "dy": -1 }, "chatter": "cooler", "useSound": "drink_gulp"
  },
  "offWhen": "m01_staff_alarmed"
}
```

`offWhen` sits at object level, not inside `affordance`: format 1 moved it (format_upgrade.rb:42, :247; schema `offWhen` at scenario-schema.json:5480), the validator reports `affordance.offWhen` as retired (validate_scenario.rb:260-301), and the needs world reads the object-level key (npc-needs.js:830-837). `m01_staff_alarmed` must be declared false in globalVariables or `validate_npc_needs.rb:445-462` errors. With presets off the cooler's affordance is used as written and no preset adds a sound, so `"useSound": "drink_gulp"` is written by hand.

The position (5.4, 8.2) is settled. An earlier candidate (8.5, 2) is wrong: room_office.json's doors layer puts the north-east door in column 8 (`placeNorthDoorsMultiple` snaps a two-door wall to x 1.5 and 8.5, y 1), so (8.5, 2) sits in front of it and crowds the east door at (9.5, 2.5). The south wall suits: the map's tables, chairs and items leave x 4.3 to 6.5, y 6.0 to 9.0 free, and the north wall is full from x 2.0 to 7.8.

- Size and anchor: `assets/objects/water_cooler1.png` is 24x47. Scenario positions are top-left (core/rooms.js:598-599), so the body covers x 5.4 to 6.15, y 8.2 to 9.67, centre (5.78, 8.93). The bottom overlaps the south wall row by 0.67 tile, as items do in other stock maps.
- Stand point: the approach cell comes from the sprite centre (npc-needs.js:5224-5228, :5420-5430), so with `useFrom` dy -1 the NPC stands at (5.78, 7.93). The cooler sprite faces south, towards the camera, so the NPC stands on its far side and faces south with the cooler between them and the camera. This facing is the accepted compromise.
- No `queue` key. With none, a user who finds capacity full waits at its post (docs/achitechture/NPC_NEEDS_SYSTEM.md 5.7); a second user takes a beside cell (npc-needs.js:3395-3415).
- Doors and aisle: the main office has one south connection, so `placeSouthDoorSingle` puts the door at x 1.5 or 8.5 by parity (doors.js:165-213); neither is near the cooler. The central aisle runs about x 3.4 to 6.56, narrowed to about x 4.1 to 6.6 at y 6 to 7 by chairs 152 (3.1, 7.14) and 155 (6.6, 7.0). The dressing render, with two users at the cooler, confirms a clear one-tile path from the south door (wherever it lands) to both north doors. If it fails, only `useFrom` changes; the position stays.

Per NPC additions:

```json
"needs": {
  "work":   { "decayPerMin": 30, "urgentAt": 70, "initial": 60 },
  "thirst": { "decayPerMin": 3, "urgentAt": 30, "initial": 70 }
},
"chatter": { "cooler": [ "Three interviews today. Three!", "Every CV says 'passionate' now.", "Locked my screen before I came over.", "Is it me, or is the heating on full?" ] },
"exchanges": [
  { "with": "graham_whitfield", "knot": "ex_interns",   "requireGlobal": { "fatima_ko": false, "graham_ko": false } },
  { "with": "graham_whitfield", "knot": "ex_biscuits", "requireGlobal": { "fatima_ko": false, "graham_ko": false } }
]
```

Graham: `thirst` initial 60; his chatter pool is the second table in SPOKEN_LINES.md. Exchange knots live in Fatima's ink file (the lower id speaks first), as the m03 extras do. The engine sets `heard_<knot>` itself when an exchange is heard (npc-needs.js:2954, :3062, :5559) and the value survives a reload, so `heard_ex_interns` and `heard_ex_biscuits` are declared false and an exchange is heard once. Both exchanges need both extras on their feet (`requireGlobal` on the two KO globals, both declared false).

Mapped break, so a player entering the office sees one go to the cooler (the same one-way coupling the test_needs_sims Rosa and Marek pair uses):

```json
{ "eventPattern": "room_entered:main_office_area", "cooldown": 150000, "delayMs": 2000,
  "condition": "data.previousRoom !== 'reception_area' && !globalVars.fatima_ko && !globalVars.entropy_reveal_read && !globalVars.m01_staff_alarmed",
  "needs": { "set": { "thirst": 20 } } }
```

on Fatima, and on Graham `{ "eventPattern": "npc_use_started:office_cooler", "condition": "data.npcId === 'fatima_begum' && !globalVars.graham_ko", "cooldown": 120000, "needs": { "set": { "thirst": 20 } } }`. The delay lets HaX's first call (6 s) ring before anyone walks.

### 4.9 Maya: a short routine after the tip-off (settled, D88 c)

Maya is free by the D78 tests: no `itemsHeld`, no `challengeOnSight` anywhere, no conversation-mode mapping, not a key source. `talk_to_maya` is `optional: true` (:228-233), so the office-life validator's required-task check excludes it. Her ink's only `complete_task` is `talk_to_maya`; `#unlock_task:inform_safetynet_operation_shatter` unlocks a HaX task and is not counted. The movement check for story NPCs is clear for a leash into the main office. No cutscene moves or hides her, and no ink line places her (Sarah, the briefing, HaX and the debrief place her office, not her).

She takes one trip, after her first talk, and only after the tip-off:

- Found at post first. The informant reveal (`informant_reveal`, "I'm the one who contacted you") is reachable only while `discussed_operation` is false, and she does not move until it is true, so the reveal always plays at her post (a player who closes the chat part-way through `reveal_check` resumes there, still at her post).
- The marker is the existing global `discussed_operation` (declared :2278), set in her ink knot `operation_details` and on the "Tell me everything" choice. Ink global writes sync at once (npc-conversation-state.js:596-620), before person-chat emits `conversation_closed:maya_chen` (person-chat-minigame.js:1987-1997). The break fires on that close.
- Why not refuse talk away from her post: the engine opens a chat wherever the NPC stands (npc-needs.js:1434-1444) and has no option to refuse one, so an engine change would be needed. The ink guard below gets the same result with no engine change.
- Her ink has no voiced line changed: every voiced line in `m01_npc_maya.ink` stays word for word. The change in "Talking to her away from her post" below adds guard lines and one player choice only.
- Her NPC record has no `chatBackground` (room-level only), her ink has no Background line, and no `conversation_closed:maya_chen` mapping exists. The globals her ink sets drive no mapping (`discussed_operation` only gates a HaX phone choice, m01_phone_agent0x99.ink:149).

All on Maya, appended at the end of her own `eventMappings` (she has none today):

```json
"needsHome": { "room": "maya_office", "x": 2, "y": 4 },
"needsRooms": ["maya_office", "hallway_east", "main_office_area"],
"needsSpeed": 70,
"needs": { "thirst": { "decayPerMin": 0.1, "urgentAt": 30, "initial": 100 } },
"needsCompany": { "avoids": ["fatima_begum", "graham_whitfield"] },
"needsDeferMin": 1,
"eventMappings": [
  { "eventPattern": "conversation_closed:maya_chen", "onceOnly": true, "delayMs": 2000,
    "condition": "globalVars.discussed_operation === true && globalVars.maya_settled === true && !globalVars.entropy_reveal_read && !globalVars.m01_staff_alarmed && !globalVars.maya_ko",
    "needs": { "set": { "thirst": 20 } } }
]
```

- `needsDeferMin: 1` (added after the R4 tests): an avoided cooler parks her thirst for the defer time, default 4 minutes, and the engine does not end an avoid park when the extra leaves (npc-needs.js:1975-1982, :1552-1556). One minute is past an extra's 30 to 40 s cooler visit, so she retries soon after. The value is meant for the avoid park but applies to every park reason for her (`no_source`, `queue`), which then retry after 1 minute too; no harm found. Evidence: R4_TESTS_PART3.md section 1 (games 7336, 7342).
- `decayPerMin` must be above zero (schema :4848; validate_npc_needs.rb:1287). From 100 to `urgentAt` 30 is about 700 needs-minutes, so she never leaves on her own. After the trip restores 70 the next one is about 600 needs-minutes away. The build measures the needs-minute to real-second mapping (measurement-recipes.md section 10) and records it.
- `maya_settled` (see "Talking to her away from her post") is true only while her story rests at the hub, so she never leaves while a chat was closed part-way through a topic. A false `condition` does not use up `onceOnly`, so she leaves after the next talk that ends at the hub. If a player never ends a talk at the hub she never leaves, which is the safe failure: she stays at her post and nothing else depends on the trip. After a reload the levels reset to 100 and the once key is saved, so she stays at post.
- `needsCompany.avoids` (field name per npc-needs.js:4344-4352, `_avoidsOneWay`; the schema allows ids, `group:<name>`, `*` and `{ npc | group, requireGlobal }` entries) keeps her off the cooler with the extras. The engine's pairing rule `_compatible` (npc-needs.js:4368-4372) lets two NPCs chat when either declares no groups, so without it Maya could be the second user beside Fatima or Graham, and they would say their pool lines to her while she shows picture turns. An avoid acts both ways (`_avoids`, npc-needs.js:4363-4365), so an extra also never shares the cooler with her. Side effect: declaring `avoids` turns on the default `avoidRadius` of 2 tiles (npc-needs.js:96, :1896-1901), so Maya waits at her post while an extra stands within 2 tiles of the cooler's approach cell (`_avoidedAt`, npc-needs.js:1927-1946). Graham's desk is 3.4 tiles away, so this only bites when an extra is already at the cooler. The validator reports one info line for the declaration (validate_npc_needs.rb:1010-1033); the build records it with the other info lines.
- No chatter, no exchanges, no interests, no workarounds, no magnet. Her trip is silent, so there is no new spoken Maya line. The cooler's `offWhen` (`m01_staff_alarmed`) also sends her home. If capacity 2 is full she waits at her post (no queue).
- Attacked mid-walk: she carries no item, stays where she fell while knocked out or hostile, and walks home once available (npc-needs.js:1235-1239, :1418-1431). Her existing hostile block is unchanged.

#### Talking to her away from her post

D84 b: she is an always-open conversation, so talking to her away from her post is still allowed. Only a one-line decline is offered there, so her Derek topics never play in the open office or the east hall.

Why a guard is needed. The engine opens a chat wherever she stands and has no option to refuse one (npc-needs.js:1434-1444). Her route is maya_office, hallway_east, main_office_area. With capacity 2 an extra can stand beside her at the cooler, and Derek's break room opens off the main office. Every topic left after the first talk names Derek as ENTROPY or blames him, and the briefing warns the player that Derek may be watching who she talks to (m01_opening_briefing.ink:209). The re-talk opener "Is it safe to talk?" (m01_npc_maya.ink:26) is only played after a reload. In the same session the hub exit (:152-155) diverts back to `-> hub`, so the story is saved at a choice point (npc-conversation-state.js:86-92) and the reopen resumes the hub straight away, re-displaying the last line (person-chat-reopen.js:1-14, :61-66).

The fix, with no engine change:

1. A global `maya_away`, declared false. It is not monotonic: it follows where the player is, and flips only on a change. It is enough because Maya is only ever in her office, hallway_east or the main office. A talk usually needs both of them in one room, but NPC conversation is also allowed across an open doorway with a clear line (`wallClearFrom`, interaction-walls.js:254-268), so a player just inside her office can talk to her in hallway_east with the flag false and get the full hub. Nobody else is in earshot there (Derek is in the break room and his office is empty), so section 11 accepts that case. The engine emits `room_entered:<roomId>` with `previousRoom` from rooms.js:3231-3241, and a mapping can write a global with `setGlobal`. Three mappings go at the end of agent_0x99's list (always registered, appended so existing onceOnly indexes do not shift):

```json
{ "eventPattern": "room_entered:main_office_area", "cooldown": 0, "condition": "!globalVars.maya_away", "setGlobal": { "maya_away": true } }
{ "eventPattern": "room_entered:hallway_east", "cooldown": 0, "condition": "!globalVars.maya_away", "setGlobal": { "maya_away": true } }
{ "eventPattern": "room_entered:maya_office", "cooldown": 0, "condition": "globalVars.maya_away === true", "setGlobal": { "maya_away": false } }
```

   Each mapping sets `"cooldown": 0`. A mapping with no `cooldown` gets the engine default of 5000 ms, checked before the condition and reset only when the mapping fires (npc-manager.js:1279-1284, :1467-1470; the code reads 0 as 0, not as unset). Without it, a quick in-and-out of her office leaves the flag wrong: the clear on entry is on cooldown when the player steps out and back, so `maya_away` stays true inside her office (a first talk would then divert to "Not here" after the operation topic and lose it), or the set is on cooldown on the way out, so her Derek topics play in the hall. The conditions already limit writes to real changes, and the delta sync sends only the value held at flush time, so a player dithering in a doorway adds nothing to player_state.

   `maya_away` and `maya_settled` are declared false in `globalVariables` with the other new globals. A reload is safe: every path to her desk enters maya_office, which clears the flag.

2. In `m01_npc_maya.ink`, add `VAR maya_away = false` beside the other VARs (:7-12) and one knot that reuses her existing opener "Is it safe to talk?" (:26) word for word with the same `#delivery: low and wary`, so the cached clip is reused (the TTS key is text, voice, style, language and delivery, app/services/break_escape/tts_service.rb:213, :285). In `start`'s `met_maya` branch put `{maya_away: -> not_here}` before the opener, so the line never plays twice:

```
=== not_here ===
{not maya_away: -> hub}
Maya Chen: Is it safe to talk? #delivery: low and wary
+ [Not here. I'll come to your office.]
    #exit_conversation
    -> hub
```

   Put `{maya_away: -> not_here}` as the first line of five knots. Each one is a place where a Derek line can play or be reached from a resumed choice point, which re-enters the knot that owns the choices (person-chat-minigame.js:562-583), so the guard also covers a resumed chat at a choice point. It does not cover a chat saved mid-knot (see the settled flag below), because a mid-knot restore just continues (person-chat-minigame.js:544-547) and never passes the top of the knot:

   | Knot (m01_npc_maya.ink) | Guard goes | Why it leaks |
   |---|---|---|
   | `hub` (:143) | first line after `~ maya_settled = true` | its exit line (:154) says "Derek's paranoid", its choices are the Derek topics, and every topic diverts back to it |
   | `operation_details` (:95) | first line, before `~ discussed_operation = true`, so a guard hit entered from the hub or the tip-off route leaves the topic in the hub; from `informant_reveal` it cannot fire, as she is at her desk and `maya_away` is false there | :108 "Derek, he's the one running it"; the settled flag keeps her at her post while this topic is open |
   | `derek_intel` (:120) | first line, before `~ warned_about_derek` | :123-127 names him as ENTROPY and operations lead |
   | `patricia_story` (:161) | first line, before `~ asked_about_patricia` | :179 "Derek arranged it" |
   | `tactical_advice` (:187) | first line | :188 points the player at Derek's office and the server room |

   The first-talk knots (`first_meeting`, `reveal_check`, `informant_reveal`) are not guarded: she is at her post for all of them, because her break only fires once `discussed_operation` is set. After a reload, "Is it safe to talk?" (:26) leads into the hub, which diverts to `not_here`, and that reads naturally.

3. Hold the trip until the chat closes at rest. A chat closed part-way through a topic (Esc on a line, with lines still to come) is saved mid-knot and, on a reopen, simply continues from there, past every guard. Case: first talk, "Tell me everything" sets `discussed_operation` and shows the first operation line; the player presses Esc; `conversation_closed` fires with the flag set, her trip starts 2 s later, the player follows her to the cooler and talks, and the story resumes with the casualty figures and the Derek reply in the open. The same holds mid-way through `derek_intel`, `patricia_story` and `tactical_advice`. Fix, ink only:
   - `VAR maya_settled = false` beside the other VARs.
   - `~ maya_settled = true` as the first line of `hub`, before its guard.
   - `~ maya_settled = false` in `operation_details`, `derek_intel`, `patricia_story` and `tactical_advice`, immediately after each knot's guard and before its other writes.
   - No `maya_settled` write in `tactical_advice`'s "I'll get started" choice. Its reply line (:197) carries `#exit_conversation`, so the chat closes with :198 still queued (person-chat-minigame.js:1533-1543). With the flag left false she stays at her post, the next talk at her desk plays :198, reaches `hub` and sets it true, and she leaves after that close.
   - `maya_settled` is declared false in `globalVariables`, a non-monotonic boolean written by the ink at topic boundaries. Ink writes reach `gameState` before `conversation_closed` is emitted (npc-conversation-state.js:596-625), so the break condition sees the value from the end of that talk.
   - First-talk tip-off path: "Tell me more about this operation" in `reveal_check` goes straight to `operation_details` without passing the hub, which sets `maya_settled` false. The topic's choices lead to `hub`, which sets it true, and `discussed_operation` is already set, so the break is armed exactly when the player is back at the hub. Esc during or at the choices of that topic leaves her at her post; Esc at the topic's choices replays the topic from its start on the next talk; Esc on a line resumes from the next line. Either way the talk ends at the hub the normal way.
   - With this in place she is never away while her story is mid-topic or at a topic's choices, and the five guards are a second line of defence. A player who never ends a talk at the hub keeps her at her post for the whole mission. That is acceptable: her trip is optional colour and nothing waits on it.
   - A talk across her doorway while she is at her desk is not covered by this (see the flag description above and section 11).

4. No new spoken Maya line. `not_here` reuses her existing opener word for word, so no Maya text is added and no clip is made; the build confirms the V6 count is unchanged before committing, and if the cache key differs it stops and asks. Player choice text is not voiced: person-chat plays TTS only for a block whose speaker is not `player` or `system` (person-chat-minigame.js:1688), so the choice needs no clip. Neither the plan nor the choice adds to the clip count; the choice line is listed as new player text in SPOKEN_LINES.md.

5. Build step. The ink change is a build step in 5. Run, from the repo root:
   - `bin/inklecate` on `scenarios/m01_first_contact/ink/m01_npc_maya.ink`, writing `scenarios/m01_first_contact/ink/m01_npc_maya.json` (the scenario loads the JSON); commit both.
   - `node scripts/ink_runtime_check/inkcheck.js scenarios/m01_first_contact/ink/m01_npc_maya.json start` four times: default VARs; `met_maya=true maya_away=true discussed_operation=true` ; `met_maya=true maya_away=false`; `met_maya=true revealed_informant=true maya_away=false` with `maya_settled` both ways. inkcheck.js prints only a summary line, so these four runs are a runtime-error sweep (expect all clean). The content expectations (away: only "Is it safe to talk?" and the `not_here` choice; at her office: the full hub, which sets `maya_settled` true) go in a small inkjs route script that chooses by text and prints lines and `maya_settled` at each Esc point, plus the live probe below.
   - `node scripts/ink_runtime_check/loopcheck.js scenarios/m01_first_contact/ink/m01_npc_maya.json hub` to confirm no hub empties.
   - `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/m01_first_contact`, an aid whose exit code is always 0, so read the findings.
   - The validator and the lock and key diff, as in section 7.
   - A focused live probe for the reopen cases, in the style of `tools/playtest/needs-stuck-return-proof.mjs`, on a keyless server, checked with `tools/playtest/verify-run.rb <game_id>`: Esc on a mid-topic line, Esc at a choice point, a quick in-and-out of her office, a reload. Then test 12's agent-driven m01 run (there is no m01 critical-path script; use the playtest-scenario skill with `scenarios/m01_first_contact/SOLUTION_GUIDE.md` and `tools/playtest/m01-baseline-report.md`, compared as `tools/playtest/m01-regress-report.md` does).

## 5. People

Classes are D78's (plan/ol-skill-movement SKILL.md:56-80). The "gate global, set by, lead time" column names what must be true before the NPC may leave its post; "none" means they never leave it.

| Person | D78 class | Post / room | Needs and movement | Gate global, set by, lead time | Beats protected by | If attacked mid-walk |
|---|---|---|---|---|---|---|
| fatima_begum (new) | extra, free | main_office_area, west desk | `work` at own PC; tier 2 `thirst` and cooler breaks | none needed (no story beat); breaks only before `entropy_reveal_read`; leaves out of sight when it turns | not on any story line | cowers, `fatima_ko` on KO, HaX text |
| graham_whitfield (new) | extra, free | main_office_area, east desk | same | same | same | same, `graham_ko` |
| sarah_martinez | story-critical, holding and pinned | reception | none | none | holds badge and main office key; she is the check-in | unchanged |
| kevin_park | story-critical, holding and pinned by text | IT room | none | none | holds lockpick, keycard, notes; text says he is in the IT room all day (:1836) | unchanged |
| derek_lawson | story-critical, holding and plot-located | break room | none | none | holds the launch device; confrontation and fight happen where he stands (:1425-1439) | unchanged |
| maya_chen | optional flavour, free (D84 b) | Maya's office | `thirst` only; one trip to the main office cooler after her first talk | found at post first: first-talk break gated on `discussed_operation`, set in her own ink; no beat needs her at post | her whispered informant talk (ink m01_npc_maya.ink:40, :99-103) happens at post, before she moves; away from post only the `not_here` choice is offered (4.9) | stays where she fell while knocked out or hostile, then walks home; hostile block unchanged |
| briefing_cutscene, closing_debrief_person | cutscene | off-map, hidden | none | none | timed conversation and hidden until the ending | n/a |
| agent_0x99 | phone | none | none | none | phone and text mappings | n/a |

D84 b count: one moved existing NPC (Maya). No other existing NPC gains needs.

## 6. Sync budget

All additions are bounded scalars sent as deltas, never a growing structure re-sent whole:

- Globals: `fatima_ko`, `graham_ko` (both tiers). Tier 2: `m01_staff_alarmed`, `heard_ex_interns`, `heard_ex_biscuits`, `maya_away` and `maya_settled`. Seven at most, all declared false at start, all booleans. `maya_away` is not monotonic: it follows the player between Maya's office and the rooms outside it, and its three mappings carry a condition so each writes only on a change, as a delta. It is per-player state in the `globalVariables` section, which state-sync.js:266-270 marks as shared by the team, so a multiplayer port must move it. `maya_settled` is also not monotonic: Maya's ink flips it at topic boundaries, a few writes per talk, as deltas. Maya's break itself adds no global: `discussed_operation` already exists.
- onceOnly keys in `triggeredEvents` (each fires once and is then fixed): 2 barks, 4 re-hides, 2 HaX attacked texts, Maya's break (1); the `maya_away` mappings are not `onceOnly` and add no key; tier 2 adds the alarmed setGlobal mappings (2 keys). At most 11 keys.
- `npcVisibility`: `setVisible` writes `npcManager._npcVisibility`, saved as `npcVisibility` and restored on register (state-sync.js:548-550; npc-manager.js:2205-2237). Two keys at most, one per extra, booleans, sent as a delta when the hide fires.
- `npcHostility`: a KO or an attack goes into `npcHostility` (state-sync.js:552-554). Up to two keys, one per extra, bounded.
- No other `player_state` growth. NPC need values and positions are local to the client sim, as for other needs NPCs.
- The hide survives a reload through `npcVisibility`, so the room-entry re-hides in 4.5 are a second guard, not the main one.

## 7. Expected results

- Lock and key diff against baseline_locks.json: empty in both tiers.
- Validator: 0 errors, the baseline's 19 warnings (none office-life; the validator now gives 26, see BUILD_REPORT.md), possible new info lines only for room-tone sounds not loaded (none expected).
- V1 summary: 9 NPCs, three with needs (Fatima, Graham, Maya); V6: 18 office-life clips (2 if the build stops at tier 1), all uncached before voicing (the clips were voiced later, in a0c4535b6); 22 clips in all with the 4 talk lines, which the per-mission batch voices, with the keyless boot warning. Maya adds no clip (the `not_here` choice is player text, which is not voiced).
- Walkthrough: unchanged. The critical path touches no new object.

## 8. Tests

Live work uses a free port other than 3000, 3001, 3002, 3085, 3086 and 3091; the plan names 3094, checked first with `ss -ltn | grep ':3094'` (must print nothing). Keyless server, no TTS, with the boot warning grep as proof of keyless. No db tasks (shared dev database). Never edit a game row's scenario or state.

1. **Person-NPC proof (build step 0)**: see section 2. Pass: Fatima talks, exits, re-talks, survives a reload, no console error.
2. Validator and `--office-summary`, diff against `v1_summary_base.txt` (only the two new NPCs and their needs appear).
3. Lock and key diff, expected empty.
4. V6: `env -u GEMINI_API_KEY RBENV_VERSION=2.7.8 bundle exec rake "app:break_escape:tts:office_lines[m01_first_contact]"`, expecting 18 clips (2 if the build stops at tier 1); V6 counts barks, pools and exchange lines, not the 4 talk lines.
5. Headless audio: launch Chromium with `--autoplay-policy=no-user-gesture-required`, wait for `__test.waitUntilReady`, `setFPS(20)` with fixed steps on, never `fixedStep=false`. Confirm `soundManager.sounds` holds the beds first. Check `currentAmbient` and the `started` log entries per room against section 4.1 (quiet_office and it share `office_ambient`, so assert level not key). Include the unmapped rooms: `it_room` plays the stock `it` bed at 0.8 and no spot, `conference_room` has no bed, and no unmapped room logs a `spot`.
6. Typing: dwell 60 s in the main office; assert a `typing` log entry with `count > 0` while an extra is in `using`, and no `spot` entries in any of the three mapped rooms (positive control: `lastSlot` advances). Result: PASS (BUILD_REPORT.md, R5 fixes). Note: after a cooler trip the extras stand idle at their desk cells for up to 60 s until work decays from 100 to 70 (40 s typing, 60 s idle per cycle), so a 60 s window can miss a typing slot; time the window from a work `using` phase, and enter the main office through a door, not as the start room (a head start can park work).
7. Seats, PCs and approach: both extras seated at their intended chairs on load (body-centre within 12 px of the chair seat position, per 4.2); each PC claimed once and no `pc` sprite anywhere else (MR 2 double-load check, one sprite per PC position). Then, with Graham seated and mid-`work`, walk to the Office Recycling Bin (the IT-room clue, a Tiled `bin` that claims bin11 at about (8.42, 4.77), 1.6 tiles from Graham's chair), open it and read the checklist; confirm his use cell and any fetched chair stay off the bin's approach cells. Repeat for the filing cabinet at (5.49, 0.72) against anyone using the cooler.
8. Barks fire once, in the right order on first entry and first return, and not after KO or after `entropy_reveal_read`.
9. Evening: reach `entropy_reveal_read` by the real path only (no page-side global writes). Route: seed the VM flags through `tools/playtest/new-game.rb` FLAGS_XML and `session-start.sh --flags` (the method used for VM playtests here), then play the real path (RFID door, decrypt step, archive safe `onPickup`, scenario.json.erb:2205) on port 3094, keyless. Walk back and confirm both extras are hidden with no reserved seat, and that the hide fired while the player was in the server room (nobody is seen leaving). Run the reload half on the same game: after the reload and before any re-hide fires, confirm both are hidden (restored from `npcVisibility`); then enter the server room and IT room and confirm the re-hides add nothing. Render the IT room's south-door view and the seated hide.
10. Attack: KO each extra; a hostile extra does not follow the player out of the main office (leash and `chaseRange`); globals set, HaX text once, credits line, music switches to threat then back to noir on `all_hostiles_ko`.
11. Tier 2: cooler lands where intended and blocks no door; with two users at the cooler a clear one-tile path runs from the south door to both north doors; break sequence and capacity 2 (a third user waits at its post); each exchange once and still once after a reload; `m01_staff_alarmed` turns the cooler off.
12. Gate playtests (agent-driven, with the commands in 4.9 step 5 for the ink and the live probe): m01, sis01, sis02 critical-path runs (scripted runs wait until any moved NPC is back at post; only Maya moves, and only after `discussed_operation`). Reload check for Mission Brief and start-room spawn is intentional behaviour, not a finding.
13. Regressions the playtest checks: the main office key lock, the filing cabinet PIN, the recycling bin, HaX's first call at 6 s, the entire Derek confrontation.

14. Maya: scripted runs poll `window.__test.needs.state('maya_chen')` before each interact until `atPost` is true and the job is null or home (a null state counts as at post); a timeout fails the step and records the last state. Never `setManualClock`. Live checks: found at post first, fresh and after a reload; talk to her away from post three ways (mid-walk, at the cooler; "waiting at the cooler" is not reachable, because with both possible users avoided she parks at her post instead of queueing, so the state cannot occur, R4_TESTS_PART3.md section 3), where the background is the main office, she resumes her trip, and only the "Not here" choice is offered, in a fresh session, in the same session after the hub exit, after a reload, and after a reload; back in her office the full hub returns and `maya_away` is false. Settled flag: press Esc on a mid-topic line (first talk, "Tell me everything", Esc on the first operation line) and expect her to stay at her post; reopen, finish the topic back to the hub, close, and expect her trip 2 s later; repeat for Esc at a topic's choices and for the tip-off route ("Tell me more about this operation" in `reveal_check`). Then "I'll get started" with `discussed_operation` true: expect her to stay at post, and the next talk at her desk plays "I was starting to think no one cared about stopping this." and arms the trip. Quick in-and-out of her office (enter, step into the hall, return within 5 s; then hall, office, hall within 5 s) and expect `maya_away` to match the room every time; attack her at the cooler. Also confirm Maya never shares the cooler with an extra and records the one validator info line (4.9).

## 9. Build size

Tier 1: about 120 lines of scenario JSON, two small ink files, two credits lines, three or four hours with the live checks. Tier 2 adds about 50 lines, a cooler placement render, two exchange knots and one more hour. Maya's routine adds about 15 lines of scenario JSON, three more mappings, and an ink change in her file (two VARs, one six-line knot, five guard lines, five `maya_settled` writes, no voiced line changed), and a needs-clock measurement. No new art (cast art exists), no engine change. The 22 clips were voiced with the user's yes (D97a).

## 10. Settled (D88, 2026-11-17)

- a. Machine in the main office: a water cooler, tier 2 (position and facing in 4.8). Tier 1 is only the build order.
- b. Evening: the extras leave after `entropy_reveal_read`, out of sight (4.5).
- c. Maya: a short routine after her first talk, and she leaves only after `discussed_operation` is set (4.9).
- d. Cast: Fatima Begum (Vindemiatrix) and Graham Whitfield (Umbriel). No clash with m01's voices (Algenib, Aoede, Kore, Charon, Leda, Algieba); recruitment and finance fit Viral Dynamics.
- e. Break room tone: `quiet_office` (4.1).

No question is open.

## 11. Risks and open points

- Step 0 is the riskiest assumption; its fallbacks are in section 2.
- The needs clock to real-time ratio is not measured yet; the build measures it for Maya's trip (4.9).
- The cooler's aisle path is checked in the dressing render; `useFrom` is the only fallback lever.
- The m01, sis01 and sis02 gate playtests run again before release, and the deploy gate stays closed until the user lifts it.
- Maya's Derek topics away from her post are handled by the `maya_away` guard and the `maya_settled` hold (4.9). Accepted: a player just inside her office doorway can talk to her in the hall across the open door and get the full hub, with nobody else in earshot. Away from her office, `not_here` opens with her existing "Is it safe to talk?" (the cached clip), so no stale Derek line is re-displayed above the "Not here" choice. If any change to her ink is ruled out, the fallback is to drop 4.9 (D88 c), not to accept the leak.
- Maya's `no_source` park (she waits when the main office has not loaded) cannot happen in normal play, because her office is reached only through the main office. Only a start-room test or a debug head start (`--start-room maya_office`) can reach it.
- Checked: hallway_east's motion lighting (:1702) turns on 2 s after Maya sets off and stays on at the cooler (game 7356, R4_TESTS_PART3.md section 3).

## 12. Lab sheet

The student walkthrough is unaffected: no required step, item or location changes. After the build lands, add a note only if the main office bystanders appear in the hand-written sheet's screenshots. Lab sheets live in HacktivityLabSheets only; this repo carries none.
