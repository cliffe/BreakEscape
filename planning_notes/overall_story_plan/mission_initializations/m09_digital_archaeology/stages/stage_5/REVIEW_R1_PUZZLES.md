# m09 stages 4–5: review round 1 (puzzles, locks, soft-locks)

## 0. Scope and method

Fresh read-only reviewer, 2026-10-21. Reviewed `../stage_4/objectives_tasks.md` ("S4") and `room_layout.md` ("S5"), including P1–P16 as accepted, against `docs/agents/FINALE_BRIEF.md`, stage 1 §11 and stage 3 for context, and the `mission-puzzle-chains` skill run in full as if building the plan. There is no `scenario.json.erb` yet, so `room_depth.py` and the dungeon graph can't run: depth comes from S5 §2's connection table, and BFS placement and door parity were traced by hand through `core/rooms.js` and `systems/doors.js`. No VM material was opened. Severity: **blocker** means a hard soft-lock or a plan that can't be built or tested as written; **major** means a silent failure, a broken forced choice or a stall with no pointer; **minor** means polish or a check for stage 9.

## 1. Engine claims checked

| Claim (S4/S5) | Verdict | Evidence |
|---|---|---|
| NPC ink `#unlock_door` works for an NPC with `unlockable` that the player has met; NPCs in a loaded room count as met | **confirmed** | `chat-helpers.js:71-97` (fire and forget, async); `npc-game-bridge.js:75-160` uses `window.currentConversationNPCId` as the unlocker and emits `door_unlocked_by_npc {roomId}` (:135); `game.rb:1027-1030` routes `method == 'npc'` to `validate_npc_unlock` (:1246-1270: encountered, then `unlockable`); `games_controller.rb:471, 1519-1557` tracks encounters when a room is served |
| Flag-reward `unlock_door` opens the station's own room, not `target_room` | **confirmed** | `games_controller.rb:2136-2143` finds the station's room; :2150, :2158, :2163-2166 merge `'room_id' => room_id` over every reward; :2226 reads `reward['room_id'] \|\| reward['target_room']`, so `target_room` loses whenever the station sits in a room. Only `scenarios/secgen_vm_lab/scenario.json.erb:91-92` uses it today |
| One reward per flag | **confirmed** | array form is index-parallel, `games_controller.rb:2160-2167`; hash form is one reward per key, :2147-2151 |
| `set_global` flag rewards reach the client | **confirmed, client-only** | forwarded untouched, `games_controller.rb:2190-2192`; applied by `applyActions` (`flag-station-minigame.js:783-786`, `apply-actions.js:34-44`); see m6 on persistence |
| `disableClose` and `resume` on mapped phone calls | **confirmed** | `npc-manager.js:674-675` (config), :1160-1180 (`startKnot: null` when `resume && npc.storyState`, :1177); a once-only scene handler is persisted only when the scene closes (:783-800) |
| Re-rings on `room_exited` and `game_loaded` | **confirmed, with gaps** | `room_exited {roomId: previous, nextRoom}` at `rooms.js:3010-3015`; `game_loaded` at `game.js:2080`, after start-room NPCs register (`game.js:1721-1731`). Delayed mappings live in memory only (`npc-manager.js:606-626`). Gaps: B3, M2 |
| A conversation mapping without `delayMs` closes what is open | **confirmed** | `npc-manager.js:1165-1168` (phone-chat), :1050-1053 (person-chat); delayed ones wait, :616-619 |
| Two NPC records for Sorensen; `koImmune` | **confirmed for combat; reach not checked** | `npc-hostile.js:262-275`, `player-combat.js:329`. Talking across the counter fails the 32 px reach rule: B1 |
| Password vs PIN; what the PIN cracker opens | **confirmed** | the cracker is a feedback mode inside the PIN minigame only (`minigame-starters.js:525-530`, `pin-minigame.js:208-247`); `password` doors are checked server-side by string (`game.rb:1056-1059`) with no cracker path. The office, the salvage keypad and the H&L box can't be cracked |
| `onPickup` on a notes file | **confirmed, with a shadowing rule** | container notes: `onRead \|\| onPickup` at `container-minigame.js:482-508`, which also emits `item_picked_up` with `itemId` (only when a `setVariable` exists); room notes: `interactions.js:1487-1517`. `onRead` wins when both are present: m1 |
| `npc_ko:<id>` | **confirmed** | `npc-hostile.js:350-353`; `globalVarOnKO` emits its change event, :358-372; KO drops `itemsHeld`, :339 (M5) |
| A hidden person NPC opening the clip | **works (m05 precedent)** | person-chat from a mapping on a person NPC, `npc-manager.js:1005-1060`; m05's hidden `closing_debrief_trigger` (`m05 scenario.json.erb:1528-1560`). `onInteract.actions` is deprecated: m2 |
| `object_interacted` carries type, name and room, no id | **confirmed** | `interactions.js:626-632`, emitted before every type branch and the lock check |
| Launcher and station ignore an object lock (P1) | **confirmed** | `vm-launcher` returns at `interactions.js:917-925`, `flag-station` at :1047-1052, before the lock check at :1340 |
| One station per VM holds the order | **confirmed** | a flag typed at the wrong station is refused by ownership, `games_controller.rb:1203-1216` |
| Two VMs, two launchers onto one attack VM | **precedent exists** | two `flags_for_vm` VMs in one scenario: `secgen_vm_lab/scenario.json.erb:83, 140`; several `vm_object` launchers on one VM: every `lab_*` scenario (e.g. `lab_scanning:121, 135`) |
| BFS layout and door alignment (S5 §2) | **confirmed** | single E/W placement is top-aligned (`rooms.js:1426-1436, 1503-1512`); N/S same-width rooms share x (:1240-1262, :1335-1356). Every room origin and every shared wall in S5 has an even `gridX+gridY`, so **every N/S door lands on the west corner** (`doors.js:95-103, 178-186`), and S5 §11's contingency ("if parity puts them on the east") won't arise. E/W doors are all 2.5 tiles down (`doors.js:235, 276`), and every E/W pair shares a top. The ring of four closes |
| Reach for talk and pickup | **not checked by the plan** | `INTERACTION_RANGE = 32` px (`constants.js:65`), centre to centre for walking NPCs (`interactions.js:384-389`; `npc-reach.js` header: "nothing becomes reachable across a counter"). S5 §11's "the NPC's tap area is its 80×80 frame" is wrong |

## 2. Chain depth, lock order and boss keys

**Depth** (doors from the dock, S5 §2): dock 0; front desk, open stacks 1; reading room, closet 2; restricted stacks 3; cage, office, tape room 4; salvage cage 5. The critical path runs flag 1 → stacks → clone at the hatch → gate → print → cabinet → flag 2 → call → office → safe → card → tape room → decode → keypad → flags 3–4 with the three scenes → debrief. That is eight in-game locks and four VM flags in strict order, deeper than m02 and with no corridor rooms. Every room holds a person, a lock or a find.

**Boss-key table.** I agree with S5 §4.2 with three corrections:

- The cage gate (❌ same room, accepted) only works if the hatch conversation can be reached at all (B1).
- The salvage keypad's hunt is three doors back, in the reading room (the legend), unless the player read the legend and the catalogue entry in Act 1 and kept them in the notepad. S5 §6 says Act 3 has no long walk-backs. That holds for the doors but not for this decode (M7).
- The safe's ✅ "by design" is softened by the desk drawer in the same room, which turns the season's one new capability into a 30-second detour around it (m7).

**Order holds** for every step of stage 1 §11, with the engine primitives named: HaX's `#unlock_door` for the stacks and the office, the clone for the gate, the print for the cabinet, the safe card for the tape room, a password nobody can crack for the keypad, and station ownership for flags 3–4. The weak points are the reload and backstop edges (B2, B3, M1–M3), not the lock order itself.

**Cumulative kit.** Picks, cloner, print kit, cracker and social all have a required use on at least one route. CyberChef's "critical" use isn't one as specified (M7). Nothing else is left without a use.

**Choices required?** The bin, the deck and the confession are forced by the forced scenes. A knock-out in the cage undoes the bin on Victoria's route (M5). The legacy box, the shredding and the tape wipe stay optional by design, and they carry score and credits lines, which is the skill's pattern.

## 3. Findings

### Blockers

**B1. Sorensen can't be talked to across the hatch counter, and she is the only way to the gate.**
- *Location:* S5 §3.6, §8 row `sorensen_hatch`, §11 bullet 4.
- *Evidence:* `constants.js:65` (`INTERACTION_RANGE` 32 px); `interactions.js:384-389` measures walking NPCs centre to centre; the `npc-reach.js` header says walking NPCs keep that measure "so nothing becomes reachable across a counter". `npc-sprites.js:91-94`: only `behavior.staticSprite` NPCs get the body-edge measure.
- *Problem:* She stands at (8.5, 5.5) behind counter collision that starts at x 7.5. The player's centre can't get within one tile of hers, so there's no talk icon. That means no clone and no bin choice. She is `koImmune`, so there's no card drop as in m08 (`m08 scenario.json.erb:1443-1455`). Every route except recruited-Victoria stops at the gate. Stage 1 Beat 2.1 asked for "a tile the player can reach for conversation and the cloner". S5 §11's "tap area is its 80×80 frame" is not how reach works.
- *Fix:* Make `sorensen_hatch` a static-sprite NPC (`behavior.staticSprite: true`) whose collision body runs to the counter's player-side edge, so the body-edge reach is under 32 px from a standing tile (m02's Mr Pryce pattern, `npc-reach.js`). Or use stage 1's fallback: a hatch bell object whose `triggerOnInteract` sets a global, and her own mapping opens her person-chat (she stays the host, so `#clone_keycard` still reads her `rfidCard`). Either way, put `#clone_keycard` on every branch of her knot, or in a repeatable hub choice, because nothing else can clone that card. Noor behind the front counter has the same problem (m5).

**B2. A reload mid-debrief can't reopen the debrief, so the mission can't conclude.**
- *Location:* S4 §6.5.
- *Evidence:* the trigger is `value === true && !globalVars.debrief_played`, and `debrief_played` is set on the debrief's first line. The backstop re-emits `start_debrief`, but the trigger then fails its own condition. m05's backstop, the pattern cited, only covers a reload *before* the first line (`m05 scenario.json.erb:1548-1560`, its comment). HaX's "[Bring me in.]" retires on `start_debrief` (S4 §7.1 topic 1).
- *Problem:* After a reload anywhere between the first line and `report_done`, nothing opens the debrief, and `report_to_netherton` can never complete. S4 §12.3's own test ("the debrief at the notice question") would hit this.
- *Fix:* Key the trigger and the backstop on `!globalVars.report_done`, and keep `debrief_played` for the music only. Gate the hub choice `tesseract_call_done and not report_done` so the player can also ask again in the world.

**B3. The identity scene, flag 4's read and Tesseract's call have no backstop for their first ring.**
- *Location:* S4 §4 rows 9–11, §5 "Reload backstops", §6.2–6.4, §12.1 S6.
- *Evidence:* the first rings are `global_variable_changed` mappings with `delayMs` (2500, 4000). Pending delays are in memory only (`npc-manager.js:606-626`; README "delayMs"). The `game_loaded` re-rings in §6.2–6.4 all need `*_started`, which a scene that never rang hasn't set. `global_variable_changed` doesn't re-fire on load.
- *Problem:* A reload or closed tab inside the window loses the scene for good: flag 3 submitted with the file held, then 2.5 s; flag 4 with the scene done; `hour_read_done`, then 4 s. `hear_the_mirror_job` never completes, so aim 6 never opens and there's no debrief. S6's note "the scene then fires on load" is false for the same reason.
- *Fix:* Give each scene its first-ring backstop on `game_loaded` and on `room_entered` (no delay):
  - `flag3_submitted && nightshade_file_held && !identity_scene_started`
  - `flag4_submitted && identity_scene_done && !hour_read_started`
  - `hour_read_done && !tesseract_call_started`

  The Recruiter's call and HaX's two non-forced reads already have one; add these three to §5's list.

**B4. The F15 segment starts in §12.1 can't run as written.**
- *Location:* S4 §12.1.
- *Evidence:* `tools/playtest/README.md` (commit 4b6f4838): `--start-room` rewrites the game's `startRoom`. "Not covered: objective/task progress, NPC conversation state, ink variables". `game.js:1721-1731`: only the start room's NPCs load at boot.
- *Problem:*
  - (a) Every phone and hidden NPC, HaX included, lives in `loading_dock` (S5 §3.1), so a segment that starts in `reading_room` … `salvage_cage` has no HaX mappings, no hub, no forced scenes. HaX's `#unlock_door` is also refused as "not encountered" (`game.rb:1257-1261`) until the player walks back to the dock.
  - (b) The "Tasks completed" column can't be seeded. The flag tasks stay open, aims 2–6 stay locked, and `concludeRequires` refuses at S7.
  - (c) S6 also relies on B3's missing first-ring backstop.
  - Room positions recompute from the new start room. Parity is unchanged, because every offset in S5 is even.
- *Fix:* Start every segment in `loading_dock` (start room unchanged). Use `--unlock` for the doors already opened, `--set` for the globals and `--give` for items (`tape_room_keycard`, `pin-cracker`). Submit the earlier flags in-run from the flag-hints XML so the flag tasks and their rewards are real. Or ask the orchestrator to extend F15 to seed `objectivesState`, `submitted_flags` and `flag_rewards_claimed`. The dock to the salvage cage is six doors, which is acceptable for a segment.

### Majors

**M1. The Recruiter's room-entry backstop can ring the call as the player walks into the cage.**
- *Location:* S4 §4 row 3, §5 backstops.
- *Evidence:* `rooms.js:2992-3001` emits `room_entered` before `room_entered:<id>`. HaX's `in_cage` setter is on `room_entered:restricted_cage`, so the any-room backstop runs first and sees `in_cage` false.
- *Problem:* On the card route the gate is opened from the hub. With flag 2 already in, `cage_opened` changes while the player is outside, and no mapping fires on it. The next room entry is the cage, and the backstop rings the call there, with Sorensen in the room. That breaks stage 1 §11's one-voice rule and "after leaving the cage".
- *Fix:* Add `data.roomId !== 'restricted_cage'` to the backstop. The call then comes from mapping (a) on the way out.

**M2. `in_cage` goes stale on reload.**
- *Location:* S4 §4 row 3, §5.
- *Evidence:* a reload always spawns the player in `startRoom` (`game.js:1687-1760`; F15's README relies on this).
- *Problem:* A reload inside the cage leaves `in_cage` true. Mapping (a) needs another exit from the cage, (b) won't re-fire, and the backstop needs `!in_cage`. The call never rings until the player happens to walk into the cage and out again, and nothing points them there.
- *Fix:* Have HaX clear it on load: `game_loaded` → `setGlobal: { in_cage: false }`. Or replace the flag with `room_entered` + `data.roomId !== 'restricted_cage'` → false.

**M3. The stacks-door backstops retire on the tag, not on the door.**
- *Location:* S4 §4 row 1, §5, §7.1 topic 15.
- *Evidence:* `#unlock_door` is fire and forget (`chat-helpers.js:71-97`) and the server may refuse it (`game.rb:1246-1270`). `stacks_door_opened` is a separate `#set_global` that runs whatever the server says.
- *Problem:* A refused or failed unlock still marks the door as opened. The hub backstop and the reload backstop both go quiet, and the player is stuck at the first critical lock. The office does this right, retiring on `office_entered`.
- *Fix:* Add `stacks_entered`, set by HaX on `room_entered:restricted_stacks`. Gate both backstops on `flag1_submitted && !stacks_entered`, and add it to §5's table.

**M4. The PIN cracker is given from the wrong NPC, and its backstop can't be a mapping.**
- *Location:* S5 §3.1, §4.3; S4 §5 `cracker_given`.
- *Evidence:* `#give_item` takes from `window.currentConversationNPCId` (`chat-helpers.js:98-113`), which is the conversation's host, `briefing_cutscene` (`person-chat-minigame.js:445`). It isn't `kowalczyk`, whose `itemsHeld` the plan uses. Mapping configs have no give action (`npc-manager.js:648-680`).
- *Problem:* The mission's one new capability silently isn't granted. It isn't a soft-lock, because the desk drawer holds the PIN, but the grant the plan argues for in §5 and stage 1 §3.4 never happens.
- *Fix:* Put the cracker in `briefing_cutscene.itemsHeld`. Make the backstop a HaX hub choice `{briefing_played and not cracker_given}` that gives `#give_item:pin-cracker` from a copy in HaX's `itemsHeld`.

**M5. A knock-out in the cage undoes the bin choice on Victoria's route.**
- *Location:* S5 §3.7, S4 §4 purge table.
- *Evidence:* `npc-hostile.js:339`, where `dropNPCItems` drops all `itemsHeld` on a KO.
- *Problem:* On Victoria's route the cage record `sorensen` must hold both files (Derek's, and the letters or Nightshade's copy) to `#give_item` the chosen one. Knock her down and the one that "went in the shredder" lands on the floor. The forced loss stops being real, and `cage_bin` and the credits' "WHAT THE PURGE TOOK" are then wrong.
- *Fix:* Host the door scene on a hidden `koImmune` record in the cage (e.g. `sorensen_door`) that holds the files, and keep `sorensen`'s `itemsHeld` to her card alone. The hatch record is already `koImmune`, so the hatch route is safe.

**M6. On Victoria's route the hatch record can survive the gate opening.**
- *Location:* S4 §7.1 topic 14; S5 §3.6.
- *Evidence:* `sorensen_hatch` hides on `global_variable_changed:cage_opened`, a mapping registered only when her room loads (README "An NPC outside the start room only hears events once its room has loaded"). Topic 14 is offered anywhere from flag 1.
- *Problem:* A player who asks HaX for the maintenance code from the reading room opens the gate before the stacks have ever loaded. When they walk in, Sorensen is still at the hatch with the cage open, re-offering the bins and the clone, and a second Sorensen is in the cage.
- *Fix:* Gate topic 14 on `stacks_entered` as well (M3). In the story, HaX offers the code once the player is looking at the gate. Add a relay mapping on `sorensen_hatch`: `room_entered:restricted_stacks` with `globalVars.cage_opened` → `setVisible: false`, as S5 already does for `archive_guard`. Visibility then persists across reloads (`state-sync.js:13, 82`).

**M7. CyberChef's "critical" use isn't one, and the decode adds an Act 3 walk-back.**
- *Location:* S5 §5 row CyberChef, §3.5 `catalogue_legend`, §6; S4 §7.1 topic 4.
- *Evidence:*
  - The salvage code is in "the archive's own shelf-code scheme", read off a wall plaque or told by Gary. That is a lookup table, not a CyberChef recipe.
  - HaX's hint sends the player to "the legend's on the reading room wall": salvage cage → tape room → hub → reading room and back, six door crossings in Act 3.
  - S5 §6 says Act 3 has "no long walk-backs on the critical path".
- *Problem:* The workstation is kit with no required use, and the hunt is longer than the plan admits.
- *Fix:* Stage 6 picks an encoding CyberChef performs, with the legend naming the recipe in the archive's terms (the plaque is the key, the workstation is the tool). Put a second copy of the scheme where the keypad is met, for example stencilled shelf-code labels in the tape room in the same scheme. The hunt is then one room, and the reading-room plaque is the early, optional way.

### Minors

**m1. `onRead` shadows `onPickup` on one object.**
- *Location:* S5 §3.8 `the_reading`; S4 §3.4.
- *Evidence:* `container-minigame.js:484`; `interactions.js:1490`.
- *Problem:* If the Reading is one object with `onPickup` (`reading_found`) and an `onRead` for `reading_finished`, `onRead` wins and `reading_found` is never set. S4's "stage 7 decides one object or two" leaves this open.
- *Fix:* Use two objects (the file and its last page). Or keep `onRead` on the last page and set `reading_found` from a HaX mapping on `item_picked_up:notes` with `data.itemId === 'the_reading'`; the event carries `itemId`, `container-minigame.js:503-507`.

**m2. `onInteract` is deprecated.**
- *Location:* S5 §3.9 `alpha_tape_deck`.
- *Evidence:* `onInteract` is deprecated at `interactions.js:1570-1574`; the replacement fires at `interactions.js:715-719`.
- *Fix:* Use `triggerOnInteract: [{ "type": "set_global", … }]`. Its `set_global` emits every time (`apply-actions.js:36-41`), so the deck can be replayed.

**m3. `biometricMatchThreshold` "medium" isn't a number.**
- *Location:* S5 §3.7 `plan_cabinet`.
- *Evidence:* `biometric-lock.js:14-35`.
- *Problem:* "medium" parses to NaN and falls back to 0.4.
- *Fix:* Give a number. `fingerprintDifficulty: "medium"` on the stamp is correct (`dusting-game.js:170`).

**m4. Hub gates read globals that don't exist yet.**
- *Location:* S4 §7.1 topic 4 ("not salvage open"), topic 15, M3's `stacks_entered`.
- *Problem:* Ink can't read task state.
- *Fix:* Add `salvage_opened`, set by HaX on `door_unlocked` with `data.connectedRoom === 'salvage_cage'`, and `stacks_entered` to §5's table.

**m5. Placement checks the plan doesn't make.**
- *Location:* S5 §3.2, §3.3.
- *Problem:* Noor "behind the front counter" has B1's reach problem. Her card is a helper route, so this isn't a soft-lock, but `meet_the_clerk` and the warned-in-time branch are unreachable. Old Coyote's `patrolOverride` to "the reading-room door tile" must be a tile *beside* the door: an NPC body on the door tile blocks the open stacks ↔ reading room door, which is the only way between them on route B.

**m6. Flag-reward globals are client-only until the next sync.**
- *Location:* S4 §4.
- *Evidence:* the reward is marked claimed server-side at once (`games_controller.rb:2200-2203`), but `set_global` only reaches `gameState` on the client (`apply-actions.js:34-44`). It is saved on the 30 s timer or on page hide (`state-sync.js:59-64`).
- *Problem:* A crash, rather than a reload, inside that window loses `flag1_submitted` for good, and the stacks never open. Rare.
- *Fix:* Engine item for the user: `stateSync.sync()` after `processRewardEvents`. Mention it beside the reward-door bug in §15.

**m7. The cracker grant is optional by design.**
- *Location:* S5 §3.8 `sorensen_desk_drawer`.
- *Problem:* The drawer is in the same room as the safe and opens with the start-kit picks, so the season's one new capability has a same-room bypass. Stage 1 §3.4's "The long way is over" then reads oddly.
- *Fix:* Move the PIN's long-way copy out of the office (e.g. into the rent book's columns, needing a read rather than a pick), or accept it as the safety net and drop the ✅ "felt as an absence" claim.

**m8. Forced rings keyed on a flag global have no delay.**
- *Location:* S4 §4 row 10, §6.2 re-ring; §6.6 Gary and Torres.
- *Evidence:* the flag-4 read ring and the identity re-ring on `flag4_submitted` have no `delayMs`, so they close the flag station mid-submission (`npc-manager.js:1165-1168`). Gary rings on `door_unlock_attempt`, which fires before the keypad opens (`unlock-system.js:111-118`). Torres rings on `object_interacted`, which fires before the box's lock check (`interactions.js:626-632`).
- *Problem:* Each closes the minigame the player has just opened.
- *Fix:* Add `delayMs` (e.g. 1500) to each. Delayed rings wait for the open minigame (`npc-manager.js:616-619`).

**m9. Two locked doors sit close together in the hub's north-west corner.**
- *Location:* S5 §2, §3.6.
- *Evidence:* all N/S doors land on the west corner (§1 of this review), so the hub's tape-room reader (north wall, x 1.5) and the office keypad (west wall, 2.5 tiles down) are both in Act 2 view and within the 64 px door reach of one standing tile (`constants.js:67`).
- *Fix:* Stage 9 checks which door a tap picks. If it's ambiguous, move the office branch (P-style) or accept it.

**m10. Small checks for stage 9.**
- *Location:* S4 §6.6; S5 §3.3, §3.9.
- *Problem:*
  - A phone NPC isn't a person-chat speaker. HaX's line inside `alpha_recording`'s person-chat needs a person-type HaX record (the m05 debrief uses one) or an aside.
  - `archive_guard` must be `startHostile` while hidden, because mappings have no hostility action (`npc-manager.js:648-680`). Confirm a hidden hostile NPC does nothing until `setVisible`.
  - Confirm a `sendTimedMessage` from the Recruiter reaches the player when she isn't in the phone's `npcIds`.

## 4. Verdict

**Not implementable as written: 4 blockers, 7 majors, 10 minors.** The structure is sound and worth keeping:

- Ten rooms, no corridors.
- A lock order that matches stage 1 §11 step for step, with an engine-enforced holder at each step.
- Door parity checked: every N/S door lands west, clear of the hatch strip.
- One station per VM, with ownership enforced server-side.
- The two engine claims the orchestrator flagged both hold: the flag-reward `unlock_door` bug, and `#unlock_door` plus `unlockable` as the workaround.

What fails is at the edges: whether the player can physically reach the hatch (B1), and what survives a reload (B2, B3, M2, M3). Each fix is small and local (a condition, a backstop mapping, a static-sprite flag, a host change), and none moves a room or changes a choice. B4 is test-plan only: restate §12.1 as dock starts with `--unlock`/`--set`/`--give` plus in-run flag submission, or ask for F15 to seed tasks and flags. Round 2 should check the new backstop list (B2, B3, M1–M3) row by row against `npc-manager.js` and look at the revised hatch staging.

Withdrawn while checking (so round 2 needn't raise them): NPC `setVisible` doesn't persist (it does, `state-sync.js:13, 82`); the cumulative kit lacks the m02 Bluetooth scanner (m02's `bluetooth_scanner` is a phone sprite, `m02 scenario.json.erb:2233-2235`, not a tool); a flag could be submitted at the wrong station (refused, `games_controller.rb:1203-1216`).
