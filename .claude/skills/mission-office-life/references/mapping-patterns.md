# Mapping and object patterns

JSON patterns from the m03 build (`scenarios/m03_ghost_in_the_machine/scenario.json.erb` on `build/ol-m03`; the lines are quoted from the version the R5 review read). Use the shapes, change the ids. The validator and engine rules named here were each hit during the m03 build.

## 1. Declaring Tiled machines

Use the **base type name**: the type with its trailing digits stripped, which is how the Tiled pool is indexed.

```jsonc
{ "type": "coffee_station", "id": "reception_coffee", "name": "Reception Coffee Station", "takeable": false,
  "offWhen": "wh_staff_upset",
  "affordance": { "useSeconds": 16, "capacity": 2, "chatter": "coffee", "overhearRadius": 360 } }
```

- No `position`. With no position the object claims the drawn sprite and keeps the presets.
- `"type": "coffee_station1"` and `"water_cooler1"` found no Tiled match, so each fell to `createSpriteAtRandomPosition` (unseeded `Math.random()`), left the real sprite drawn as decor, and landed somewhere new on every load. That was the R1 blocker. The pool is indexed by type with trailing digits stripped (`core/rooms.js:186` to `:193`, `indexByType` at `:229` to `:241`, `findMatchFor` at `:262` to `:268`; `M03_SLICES3_4_REVIEW_R1.md` finding 1). The preset list carries both spellings (`data/office-presets.json`), so the base name still takes the preset. m02 (`water_cooler`) and sis01 (`coffee_station`) already did this.
- `capacity: 2` must be on the object when chatter or exchanges are wanted. The coffee preset is 1, and with 1 the pool and exchanges can never play (`SLICE5.md`, Data changes).
- `overhearRadius` goes inside `affordance`; `offWhen` goes on the object. Both at 360 covers a whole room.
- Read the `--office-summary` and the validator "Office preset" lines after the change: one of each machine. Queue-cell warnings that say "outside the room" for a position-less object are a validator artefact, because it cannot know the tile; the engine works the cells out from the real approach cell (`M03_SLICES3_5_REVIEW_R2.md` finding 9). Hand-write `queue.cells` if you want them gone.
- A readable table-top object that is not a PC uses the exact sprite type (`laptop1`, not `laptop`; `laptop` is the desk-PC preset type). It takes no preset: its affordance is just `useFrom`, the post offset from the object's centre in tiles (`SLICE3_4.md`, Facts).

## 2. Readable laptop with the screen habit

```jsonc
{ "type": "laptop1", "id": "zainab_laptop", "takeable": false, "position": { "x": 5.0, "y": 8.7 },
  "workstation": true, "owner": "zainab_hussain",
  "readable": true, "readDisplay": "gameDisplay", "addToNotes": false,
  "affordance": { "useFrom": { "dx": -0.75, "dy": -1.06 } },
  "text": "Zainab's laptop. She's working on it, and she tips the screen away from you.",
  "textVariants": [
    { "condition": "globalVars.mission_phase === 'act2_infiltration'", "value": "...lid shut, left for the night." },
    { "condition": "globalVars.wh_staff_upset", "value": "The lid's been snapped shut." },
    { "condition": "globalVars.zainab_laptop_screen_locked", "value": "...The screen's locked." },
    { "condition": "globalVars.zainab_laptop_owner_away", "value": "<the lore text>" } ] }
```

and on the NPC:

```jsonc
"needsHome": "zainab_laptop",
"habits": { "screen": { "lockChance": 1, "lockIfAwayOverSeconds": 24 } }
```

- The workstation globals derive from the object id (`<id>_owner_away`, `<id>_screen_locked`) and still need declaring in `globalVariables` (the scenario field; `globalVars.` is only the prefix conditions use).
- The text is the gate. The engine does not refuse a read over an attended owner's shoulder, so only the away-and-open variant carries anything. Order: night, trouble, locked, away-and-open, then the attended base text. Night outranks trouble on purpose (both are dark-screen text) (`R1_FIX_HANDOVER.md`, coordinator extras).
- `addToNotes: false` stops the notes entry and its toast on each read. The text is HTML-escaped on the `gameDisplay` path.
- The variant text must match `DIALOGUE_SAMPLE.md` as the user approved it. Slice 4 wrote its own text and slice 5 left it ("left untouched as instructed"); R2 flagged the mismatch and the fix restored the approved wording (`M03_SLICES3_5_REVIEW_R2.md` finding 4).
- The no-secrets check on every variant: no password, PIN, code, flag, server-room detail or route to a locked thing.

## 3. Night hides

The staff vanish at the act turn through **several mappings per NPC**, because no single event covers every route to night, a reload, and entering either room late.

```jsonc
"eventMappings": [
  { "eventPattern": "objective_task_completed:clone_rfid_card", "setVisible": false },
  { "eventPattern": "global_variable_changed:mission_phase", "condition": "value === 'act2_infiltration'", "setVisible": false },
  { "eventPattern": "global_variable_changed:clone_call_done", "condition": "value === true", "setVisible": false },
  { "eventPattern": "room_entered:reception_lobby", "condition": "globalVars.mission_phase === 'act2_infiltration'", "onceOnly": true, "setVisible": false },
  { "eventPattern": "room_entered:main_hallway",    "condition": "globalVars.mission_phase === 'act2_infiltration'", "onceOnly": true, "setVisible": false } ]
```

- Three plain mappings at the turn and two `onceOnly` room re-hides. Hiding only on `clone_call_done` left the staff live until the night cutscene closed, so a staffer at the cooler was standing in the hallway when the player walked in (`M03_SLICES3_4_REVIEW_R1.md` finding 3). The plan had named all three; the build had one.
- **The validator rejects `||`.** A condition that wants "A or B" becomes **two mutually exclusive mappings**, each with its own once key. See section 5 for the m03 example. Do not write `||` and do not rely on two overlapping mappings both firing.
- **`onceOnly` key format**: `<npc>:<pattern>:<handlerIndex>`, for example `agent_0x99:npc_ko:ffion_rees:60` (`npc-manager.js:1264`; `M03_SLICES3_5_REVIEW_R5.md`). The index is the position in that NPC's `eventMappings`. Consequences:
  - Each mapping is its own key, so a once-only room re-hide fires once per mapping, not once per room.
  - A false condition does not count as a fire (the condition is checked before the counter), so exclusive mappings do not use each other's fire.
  - Inserting or removing a mapping shifts the index of every mapping after it on that NPC. Append new mappings at the end of the list. R4 flagged the shift after the two patrol mappings were removed and withdrew it only because the NPCs were new on that branch, so no saved game held the keys (`M03_SLICES3_5_REVIEW_R4.md`).
  - `onceOnly` state persists with the game once the handler has no conversation or minigame (`state-sync.js`), so each handler adds one keyed entry. Count them in the sync budget.
- Re-hides are `onceOnly` because `setNPCVisible` posts `update_room` on every call; plain re-hides posted twice on every entry at night (R1 finding 6). Saved visibility is restored on reload before the NPC registers (`restoreNpcVisibility`), so a reload in either room stays hidden after the once-only mapping has fired.
- Do not add a `previousRoom === null` first-frame mapping. The plain mapping's condition has no `previousRoom` term, so it matches the first-frame event anyway; the extra mapping only caused double writes (R2 finding 6, fixed in the R2 log, confirmed R3). If you ever test `previousRoom` use `=== null`: the evaluator has no `==`, and `== null` did not fire in 5 of 5 fresh games while `=== null` did (`STAGE1_CHECKS.md` (a)). The first-frame `room_entered` of the start room fires with the NPCs already registered, at 0 to 250 ms.
- A hidden NPC is skipped by the needs tick, witnesses, phone answering and exchanges (the `st.hidden` tests in `npc-needs.js`: the tick at `:1023`, presence at `:1238`, mutters at `:2202`, phone answering at `:4619` and `:4661`). A hidden hostile does not hold back `all_hostiles_ko` (the `build/ol-hidden-hostiles` dependency, on main).
- **Always render the night turn and look.** `vis false` and `hiddenMap true` held while a seated breathing image of the NPC stayed drawn until reload (`SLICE6_DRESSING_LIGHTING.md` finding 1). See `gotchas.md`, "Hiding a seated NPC".

## 4. Mapped breaks and one-way coupling

The natural rhythm may never fire within the act (m03: first natural thirst at 13 to 15 minutes, and only after the hallway loads). Map one break per machine to a thing the player does anyway.

```jsonc
// Yusuf (coffee): the player closes the chat with Ffion
{ "eventPattern": "conversation_closed:ffion_rees",
  "condition": "globalVars.mission_phase !== 'act2_infiltration' && !globalVars.wh_staff_upset",
  "delayMs": 2000, "cooldown": 120000, "needs": { "set": { "caffeine": 20 } } }

// Zainab, coupled one way: Yusuf starting the machine brings her
{ "eventPattern": "npc_use_started:reception_coffee",
  "condition": "data.npcId === 'yusuf_demir' && globalVars.mission_phase !== 'act2_infiltration' && !globalVars.wh_staff_upset",
  "delayMs": 2000, "cooldown": 120000, "needs": { "set": { "caffeine": 20 } } }

// Zainab (cooler): the player walks back in from the hallway, so the hallway has loaded
{ "eventPattern": "room_entered:reception_lobby",
  "condition": "data.previousRoom === 'main_hallway' && globalVars.mission_phase !== 'act2_infiltration' && !globalVars.wh_staff_upset",
  "delayMs": 2000, "cooldown": 150000, "needs": { "set": { "thirst": 20 } } }
```

- Coupling is one way each (Yusuf coffee brings Zainab; Zainab cooler brings Yusuf). Both ways held a cooler for minutes in m02.
- A delayed mapping re-checks its condition when the delay is up, so a KO inside the 2 s cancels the trip.
- Every `needs.set` mapping is gated on `!wh_staff_upset`, so once the day goes wrong no new break starts (`M03_SLICES3_5_REVIEW_R4.md`).
- Mapped trips began 11 to 15 s after the trigger, which lands them inside the aftermath of Ffion's conversation; the player-at-Ffion lane held (`STAGE1_CHECKS.md` assumption 3).
- Event payloads: `npc_use_started:<obj>` carries `npcId` (the `npc_use_started:${job.targetId}` emit, `npc-needs.js:3557`); `room_entered:<room>` carries `previousRoom` (`rooms.js:3232`); `npc_attacked:<id>` is emitted at `player-combat.js:461`.

## 5. Trouble: one global, two exclusive mappings

Machines switch off on a single bounded global, and the needs layer does the rest.

```jsonc
// on the machines
"offWhen": "wh_staff_upset"

// on the HaX phone NPC, appended LAST so no saved once index moves
{ "eventPattern": "npc_attacked:zainab_hussain", "onceOnly": true,
  "setGlobal": { "zainab_attacked": true, "wh_staff_attacked": true, "wh_staff_upset": true } },
{ "eventPattern": "global_variable_changed:zainab_ko", "condition": "value === true", "onceOnly": true,
  "setGlobal": { "wh_staff_upset": true } },
{ "eventPattern": "npc_ko:ffion_rees", "condition": "globalVars.mission_phase !== 'act2_infiltration'",
  "onceOnly": true, "setGlobal": { "wh_staff_upset": true } },

// witnessed: "!(zainab_ko && yusuf_ko)" without ||, as two exclusive mappings
{ "eventPattern": "npc_ko:ffion_rees",
  "condition": "globalVars.mission_phase !== 'act2_infiltration' && !globalVars.zainab_ko",
  "onceOnly": true, "setGlobal": { "wh_staff_witnessed": true },
  "sendTimedMessage": { "delay": 6500, "message": "Reception had company. Get the badge and get out." } },
{ "eventPattern": "npc_ko:ffion_rees",
  "condition": "globalVars.mission_phase !== 'act2_infiltration' && globalVars.zainab_ko && !globalVars.yusuf_ko",
  "onceOnly": true, "setGlobal": { "wh_staff_witnessed": true },
  "sendTimedMessage": { "delay": 6500, "message": "Reception had company. Get the badge and get out." } }
```

- **No `patrolOverride` send-home for this.** m03 built one and R2 found the staff walking 20 px north of their posts; the "20 px" was the seated sprite offset, but R3 then proved the real defect: `goToAndStay` ends the walk once the body is within 32 px of the target, so a staffer sent home from mid-break stopped a tile short, Zainab standing in the sofa's east end and Yusuf on the coffee table's edge, needs suspended for the rest of the day (`M03_SLICES3_5_REVIEW_R3.md` finding 1). The scenario-only fix removed both mappings: with `offWhen` on every machine, a walker or queued user turns back through `_turnBack(s, 'off')` to `_goHome`, a user already using finishes, and the needs layer sits them at the post (`M03_SLICES3_5_REVIEW_R4.md`, Major 1). A scripted walk keeps needs suspended; the needs layer does not.
- `wh_staff_upset` is never cleared, so the off state lasts the day. Say so in the plan.
- **A beat gate that shares a machine** (D78 step). A beat global `<npc>_beat` is set by the event that opens the window. A machine with no other cause takes `offWhen: "<npc>_beat"` directly. A machine that already has an `offWhen`, or that two beats share, takes `offWhen: "<machine>_off"` instead, written by mappings appended at the end:

```jsonc
{ "eventPattern": "global_variable_changed:wh_staff_upset", "condition": "value === true", "setGlobal": { "coffee_off": true } },
{ "eventPattern": "global_variable_changed:gary_beat",      "condition": "value === true", "setGlobal": { "coffee_off": true } },
// on the HaX phone NPC (registered at game start), appended last; one clearing mapping per cause, each checking every other cause (the validator rejects ||)
{ "eventPattern": "global_variable_changed:gary_beat",      "condition": "value === false && !globalVars.wh_staff_upset", "setGlobal": { "coffee_off": false } },
{ "eventPattern": "global_variable_changed:wh_staff_upset", "condition": "value === false && !globalVars.gary_beat",      "setGlobal": { "coffee_off": false } }
```

  Host these on the phone NPC or another start-room NPC (`public/break_escape/js/core/game.js:2210` to `:2215`), never on the moved NPC or an NPC in another room: a room NPC's mappings go live only when its room loads (`npc-lazy-loader.js:96` to `:103`), and a `global_variable_changed` missed before then (emitted once per write, `npc-manager.js:1511`) is not replayed. The same goes for any mapping that sets `<npc>_beat`. Never edit an existing mapping's `setGlobal`. Mapped breaks always negate `<npc>_beat`, not the machine global. A naive "beat over: `coffee_off` false" would re-open a machine the trouble gate still holds off.
- The cooler case counts as witnessed (both staff out at the cooler while the player knocks Ffion out). m03 accepted that (R3 finding 3, accepted in the R3 fix log); the cure is a "staff out" global set on `npc_left_post`, more wiring than the stakes justify. Put it in the user's decisions list.
- Space timed toasts at least 4 s apart (the validator checks). "The receptionist's down" at 2500 ms and "Reception had company" at 2500 ms landed together; 6000 left 3.5 s, still warned; 6500 gave 4.0 s (R3 nit 4, R5 minor 1, R6).
- Unread globals (`zainab_attacked`, `yusuf_attacked`) draw a validator suggestion. Keep them only if the plan names a use.
- A credits warning must not name a place or a person that may not be there. "A COLLEAGUE OF HERS STRUCK BY DAY" had no referent when Ffion's line was absent, then "IN RECEPTION" was wrong for a hit at the cooler; the line settled on "SOMEONE STRUCK BY DAY" with the KO lines excluded by condition (R1 finding 9, R5 nit 2, R6).

## 6. Pools, exchanges and barks in scenario data

```jsonc
"chatterCooldownMin": 2,
"chatter": { "coffee": ["...", "..."], "cooler": ["...", "..."] },   // lines elided; the real pools hold the approved lines
"exchanges": [
  { "with": "yusuf_demir", "knot": "ex_open_door",
    "requireGlobal": { "wh_staff_upset": false, "receptionist_ko": false, "zainab_ko": false, "yusuf_ko": false } },
  { "with": "yusuf_demir", "knot": "ex_tailgate",
    "requireGlobal": { "wh_staff_upset": false, "receptionist_ko": false, "zainab_ko": false, "yusuf_ko": false } },
  { "with": "yusuf_demir", "knot": "ex_client_sites",
    "requireGlobal": { "reception_badge_cloned": true, "wh_staff_upset": false, "receptionist_ko": false, "zainab_ko": false, "yusuf_ko": false } }
]
```

The exchange gates are the real m03 ones (`scenario.json.erb` on `build/ol-m03`, lines 838 to 840); only the chatter lines are elided.

- Declare `heard_<knot>` for every exchange in `globalVariables`. A knot is heard once; it counts as heard after one overheard line (`_exchangeHeard` is read when an exchange is chosen; the `heard_<knot>` write and the `npc_exchange_heard:<knot>` event are in `_markExchangeHeard` and `_tickChats` in `npc-needs.js`, both at the first overheard line, not at the finish; the event has no `complete` field).
- The exchange knots live in the owner's ink and end `-> DONE`. A conversation hub in the same ink needs a line for the "upset" state that exits at once (`#exit_conversation`) and re-entry lines for after a goodbye ("Still about?").
- A bark is an `eventMappings` entry with a `bark` string, listed with its cooldown and gate, appended last: `npc_ko:ffion_rees` for Yusuf (day, `clone_call_done` not true, neither staffer KO, `onceOnly`), `npc_caught_at_post:<npc>` (`npc-needs.js:3377`) with a 30 s cooldown.
- Barks are extracted by the normal tts-audio batch and counted by V6 once build/tts-barks is on main (before that, count them by hand), and the client voices them (`npc-barks.js` `_speakBark`) for a person NPC with a `voice`; see `gotchas.md`, "Voicing". Prefer pools and knots.
- Verify by script that every approved clip appears in the scenario or ink unchanged (R2 did all 49).
- **`requireGlobal` compares with strict `===`** (`requiredGlobalsHold`, `npc-needs.js:310` to `:314`, also used for `needsCompany` gates). A key tested for `false` that is not declared `false` in `globalVariables` is `undefined`, and `undefined === false` is false, so the exchange silently never plays and nothing reports it. Declare every such key (`receptionist_ko`, `zainab_ko`, `wh_staff_upset` and the like), including KO globals that only `globalVarOnKO` sets.
