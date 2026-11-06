# m10 Full Disclosure, stages 4+5: review R2

## 0. Scope and method

Round 2, fresh read-only reviewer, 2026-10-21. Reviewed draft 2 of `../stage_4/objectives_tasks.md` ("OT") and `room_layout.md` ("RL") against both round 1 reviews (`REVIEW_R1_PUZZLES.md` "F-nn", `REVIEW_R1_DESIGN.md` "R1D-…"), with `docs/agents/FINALE_BRIEF.md` and the `mission-puzzle-chains` and `scenario-design-review` skills as the standard. No `scenario.json.erb` exists yet, so the plan was read as if building it. Engine paths are under `public/break_escape/js/` unless they start with `app/`, `scripts/` or `tools/`.

`docs/agents/FINALE_ENGINE_VOICED_CALLS.md` and `FINALE_ENGINE_UNLOCKS_SILENCE.md` don't exist yet. F17 (`voiced`) isn't in the mapping config, so its use is judged on OT's stated assumption. F19 is already in the working tree (`systems/npc-manager.js:671, 869-879`; `systems/npc-game-bridge.js:77-172`; `app/models/break_escape/game.rb:1028-1030, 1246-1258`), so its use is judged against the code.

Door alignment: I built a stub scenario from RL §1's eight rooms, map types and connections (scratchpad only) and ran `scripts/check_door_alignment.py` from six start rooms (`forward_post`, `security_office`, `workshop_floor`, `server_hall`, `gallery`, `core`). All seven pairs align from every start. I also computed each door's tile with the script's own placement code (`scripts/check_door_alignment.py:33-65`). `predict_door_sides.py` can't run on a stub, because it goes through the validator.

No VM material was opened.

## 1. Verdict

**Not clean. 0 blockers, 8 majors, 8 minors.** Another round is needed.

Round 1 was taken seriously. All 54 findings have a fix in the text, and most of them hold up. The majors are new, and most come from the fixes themselves or from code that changed underneath them:

- F19 is built, and its unlock emits `door_unlocked_by_npc`, not the `door_unlocked` the done-flags listen for. As written, every story door's done-flag fires only when the player bumps into the door, so "Breach. Go.", "Stair's open" and HaX's last line before the jam are lost or mistimed (R2-M1).
- The 4×2 server hall moved the gallery's outer lock to tile x 1. The lock now shares its approach tile with the stair, and RL's "mirror it" hedge can't fix a west-wall door (R2-M2).
- The two fixes for the outer lock rest on events that don't fire as assumed. A wrong PIN emits no `door_unlock_failed` (R2-M3). The guard's sight challenge fires on any sighting, not only at the keypad (R2-M4).
- The pre-breach chain that replaced the timers has no reload catch-up (R2-M5). The WREN aim lost its story gate (R2-M6). Scorched Earth's two-scene close double-fires on a reload (R2-M7). The core-start test runs can't reach the closing scene or `/conclude` (R2-M8).

Each fix is small and mostly a change of event name or condition. Top five: R2-M1, R2-M2, R2-M5, R2-M3, R2-M4.

## 2. Round 1 findings: confirmation list

"Resolved" means the text now carries the fix and I found no stale copy. I grepped both docs for `0230`/`0345` without the `t` prefix, `player_room`, `netherton_table`, `flags_for_vm(`, "lifted from", "hatch box", `unlock_door gallery`, and "release console" in core context. The only stale copies are the bootstrap wording (R2-M8, R2-m8) and the done-flag event (R2-M1).

**Puzzles review (F-nn)**

| Id | Status | Note |
|---|---|---|
| F-00 | resolved for phone NPCs; **gap** | The bootstrap now moves every `npcType: "phone"` NPC into the new start room (`tools/playtest/new-game.rb:189-200`). It does not move person NPCs, and the closing-scene NPCs are person NPCs (R2-M8). OT §9's "being built", "loaded and met" wording is stale |
| F-01 | resolved | `t` prefix throughout. Guard brittleness is new (R2-m1) |
| F-02 | resolved | every show, hide and scene sits on its own NPC |
| F-03 | resolved | flag rewards set globals only |
| F-04 | resolved, **regression** | the explicit `unlockAim` is there, but dropping the `globalVariable` condition removed the story gate (R2-M6) |
| F-05 | resolved in pattern; **wrong event** | the done-flag is set from the unlock event, but F19 emits `door_unlocked_by_npc` (R2-M1) |
| F-06 | resolved | the jam is set only before the lock and cleared on every other room. `room_entered` fires for the start room at boot (`core/rooms.js:93, 2976-3001`), so a reload clears it |
| F-07 | resolved; wiring unstated | the plate and the panel exist; the dusting event isn't named (R2-m4) |
| F-08 | (b) resolved; **(a) dead** | the fitter's locker works. The keypad's wrong-code line keys on an event a PIN lock never emits (R2-M3) |
| F-09 | resolved in intent; **mechanism wrong** | R2-M4 |
| F-10 | resolved | cupboard and locker on the west wall, clear of the stair's approach (1, 8) |
| F-11 | superseded | the gallery's lock moved to x 1 (R2-M2) |
| F-12 | resolved | |
| F-13 | resolved | |
| F-14 | partly | the second bridge runs in the same client moment as the reward, so it doesn't cover a dead tab (R2-m5) |
| F-15 | resolved | |
| F-16 | resolved | |
| F-17 | resolved | |
| F-18 | resolved | |
| F-19 | resolved | the fitter's key locker adds a fifth expected warning (R2-m6) |
| F-20 | resolved | |
| F-21 | resolved | |
| F-22 | resolved | |

**Design review (R1D)**

| Id | Status | Note |
|---|---|---|
| B1 | resolved | gallery on flags 2 + 3 + the cut; `core_router` step 3 on all four flags |
| M1 | resolved; **reload gap** | the per-ending table is right. Scorched's backstops collide (R2-M7) |
| M2 | resolved | "his console" in aim 5, `decide_the_console`, RL §2.8 |
| M3 | resolved | |
| M4 | resolved | the handset has `cooldown: 0`. The console controls don't (R2-m3) |
| M5 | resolved | |
| M6 | resolved; **reload gap** | events, not timers. No catch-up on reload (R2-M5) |
| M7 | resolved; order unstated | R2-m2 |
| M8 | resolved | |
| M9 | resolved | 4×2 hall, bunker props first. It moved the gallery's lock (R2-M2) |
| M10 | resolved | |
| M11 | resolved | the call is answered at the handset |
| m1–m3 | resolved | |
| m4 | resolved, **regression** | R2-M6 |
| m5–m7 | resolved | |
| m8 | mostly | `duty_guard`'s new endpoint is `kowalczyk_ahead_so`'s tile (R2-m6) |
| m9–m19 | resolved | |
| §6h (Arakawa down) | resolved | the clock skips 02:10 on that branch (R2-m1) |
| §2d″ (stealth) | resolved | |

## 3. Findings

Ids `R2-Mn` major, `R2-mn` minor. No blockers.

### Majors

**R2-M1. The story doors' done-flags listen for the wrong event, so each fires only when the player walks into the door.**
- *Location:* OT §0 (line 13), §4 pattern step 4 (line 185), the line "rides on `global_variable_changed:<door>_open`" (line 188); RL §3 intro, §6 item 30.
- *Evidence:* F19 is built. A mapping's `unlockDoor` calls `NPCGameBridge.unlockDoor(roomId, npcId)` (`systems/npc-manager.js:869-879`), and on success that emits only `door_unlocked_by_npc` with `{ roomId, npcId, source }` (`systems/npc-game-bridge.js:131-139`). `door_unlocked` with `connectedRoom` comes from `unlockTarget` (`systems/unlock-system.js:661-681`). That runs on a player unlock, and also when the player later touches the now-unlocked door (`handleUnlock`'s "client sees unlocked" branch, `:92-101`). The server accepts the mapping unlock without an encounter check (`game.rb:1028-1030, 1246-1258`).
- *Problem:* as written, `breach_open`, `inner_door_open`, `stair_open` and `gallery_open` are set only when the player bumps into the opened door. Until then nothing says the door is open. "Breach. Go." and the `t0230` step wait. The holding barks are silent too, because an unlocked door emits no `door_unlock_failed`, and "[Where are we?]" keeps saying "Quintero's on her way back." The gallery is worse. `gallery_open` fires as the player crosses the stair, and the `gallery_open` knot (the console warning, the sweep line, HaX's last line before the jam, `t0345`) then races `room_entered:gallery`, which sets `hax_jammed`. Every HaX ring carries `!hax_jammed`, so the act's key handover is lost. OT's own hedge ("if F19's trial report says … a different event") has now been settled by the code.
- *Fix:* step 4 becomes `door_unlocked_by_npc` with `data.roomId === '<room>' && data.npcId === 'agent_0x99' && !globalVars.<door>_open`. Update OT §0 line 13, step 4 and RL §3/§6 item 30 to name it. Keep the `door_unlocked` arm only on the outer lock (§4.5), where the player unlocks it.

**R2-M2. The 4×2 hall puts the gallery's outer lock at tile x 1, on the stair's own approach.**
- *Location:* RL §1 table (gallery W door, N outer lock; core north of the gallery), §2.7 "Positions below assume the outer lock lands at tile x 8 (mirror them if … x 1)".
- *Evidence:* the stub layout from `forward_post` places the gallery at GU (14, 2) and the core at (14, 0). A north door sits on the right only when `(gx + gy) % 2 == 1` (`scripts/check_door_alignment.py:33-34, 57-58`, a port of `systems/doors.js`). (14 + 2) is even, so the outer lock lands at tile (1, 1) and its approach is (1, 2). The stair is the west door at row 2, so its approach is also (1, 2). The core's south door is at (1, 9).
- *Problem:* the player steps off the stair onto the keypad. The walkway "along the gallery to the core's outer lock" (aim 5, HaX's "The lock's at the end"), the guard's walk between the keypad and the far end, and the spread of seven NPCs along x 2–7 all assume a lock at the far end. RL's mirror hedge can't help, because the stair is a west-wall door and can't move. Mirroring the objects also puts `lock_keypad_plate` at (0, 3), directly under the stair's doorway.
- *Fix:* put the core **east** of the gallery (gallery `W: server_hall, E: core`; core `W: gallery`). I checked it: the core lands at GU 16–18 × 2–4, overlaps nothing, and the pair aligns, because E/W pairs always do. The gallery becomes a straight walkway: stair at (0, 2), lock at (9, 2), approaches (1, 2) and (8, 2), and the existing x 2–7 staging stands. Update RL §1's map, table and "What changed", the core's door ("W: the outer lock"), and `lock_keypad_plate`'s wall. Alternatively, keep north and change the gallery's grid parity, but every other option I tried moves the hall.

**R2-M3. A wrong PIN emits no `door_unlock_failed`, so the keypad's pointer to the rota never plays.**
- *Location:* OT §4.5 "A wrong code … (a mapping on `door_unlock_failed:core`, on `lock_guard`)"; RL §3 boss-key row "✅ boss-key available on every save since round 1 (F-08a)".
- *Evidence:* the `pin` branch of `handleUnlock` passes no `onRefused` (`systems/unlock-system.js:263-270`). Only the key, password, biometric and RFID branches call `emitDoorUnlockFailed` (`:234, 288, 359, 375, 523, 536, 560`). The PIN minigame emits nothing per wrong guess (`minigames/pin/pin-minigame.js`, no `eventDispatcher` use). With the cracker held it allows unlimited guesses (`systems/minigame-starters.js:525-540`), so the only completion event, `minigame_failed` (`minigames/framework/base-minigame.js:98-105`), needs a cancel and carries no room.
- *Problem:* "Shift code. Ask the gallery's duty guard." never plays. That line is the only pointer from the lock back to the rota, so RL §3's every-save boss-key verdict and the code-card route's discovery rest on a silent failure. This is the skill's "puzzle silently doesn't work" class.
- *Fix:* key the guard's bark on `door_unlock_attempt` (emitted for a locked door before the outcome, with `connectedRoom` and `lockType`; `unlock-system.js:111-122`), with `data.connectedRoom === 'core' && !globalVars.lock_guard_known`, `onceOnly`. Reword it so it reads well before a guess: "Shift code. The duty guard carries it." Or ask for the one-line engine change: pass `onRefused: emitDoorUnlockFailed` into `startPinMinigame`, as the password branch does (`:286-288`). That needs a user decision.

**R2-M4. The lock guard's sight challenge fires on any sighting, and his "window" bark has no trigger.**
- *Location:* OT §4.5 way 1; RL §2.7 `lock_guard` (patrol (7, 4) → (2, 4), dwell 20 s at (2, 4), "barking his window as he turns").
- *Evidence:* `challengeOnSight` emits `player_spotted:<id>` whenever the player is in his room and his cone, once per sighting, with a 10 s cooldown. It has no tie to a lock or minigame. The only scoping is `rooms`, `requireGlobal` and `skipIfGlobal` (`systems/npc-sight-challenge.js:1-57`). Patrols support `dwellTime` (`systems/npc-behavior.js:921-958`) but emit no event on arrival or turn, so a mapping can't bark "Window end."
- *Problem:* his dwell point (2, 4) is beside the stair's approach (1, 2). After R2-M2's fix it is the walkway's west end. A guard who has just walked west faces the arriving player, so the challenge fires on arrival, and again after every gallery conversation (sightings held during a scene fire when it closes). "Crack in his window" becomes "get challenged whatever you do". The bark that is meant to tell the player the window is open can't be built.
- *Fix:* give `challengeOnSight` a `requireGlobal: "at_keypad"`, set by `lock_guard`'s mapping on `door_unlock_attempt` with `data.connectedRoom === 'core'` and cleared on `room_exited` from the gallery. Add `skipIfGlobal: ["outer_lock_open", "lock_guard_challenged"]`. Replace the bark with a visible cone (`los.visualize: true`, `systems/npc-manager.js` LOS drawing), or drop the bark and let his walk-away be the tell. State that he must not use `pauseForPlayer` while dwelling (`npc-behavior.js:939-950`), or he turns to face the player.

**R2-M5. The split, Arakawa's call and the pair back have no reload or retry catch-up, and the breach waits on them.**
- *Location:* OT §6 table rows "The split", "Arakawa's call", "The pair back" (lines 331-333); §4.1 condition (`pair_back`).
- *Evidence:* the split is a `delayMs: 1500` mapping on the second of `door_scene_done` and `gate_console_used`. A pending delay is lost on reload (R1 F-05/§2, `systems/npc-manager.js:596-625`), and it waits while the VM launcher, itself a minigame (`systems/interactions.js:918-925`), is open. Arakawa's scene fires only on `conversation_closed:director_netherton` with `split_started`. The table gives none of the three steps a `game_loaded` form, unlike every story door in §4.
- *Problem:* three windows strand the breach, and the A runs reload in exactly this act. (1) A reload after both halves but before the split line opens: `split_started` never sets. (2) A reload during Netherton's split line or Arakawa's scene: `arakawa_call_done` stays false until the player happens to talk to Netherton again, and nothing points there. (3) The same for `pair_back` if it is ever delayed. The breach's holding bark, "Quintero's not back from the tunnel yet.", names nothing the player can do. That is a soft lock in practice.
- *Fix:* add `game_loaded` catch-ups: Netherton's on `door_scene_done && gate_console_used && !split_started` (opens the split line); `arakawa_gate`'s on `split_started && !arakawa_call_done && !arakawa_ko` (reveals and opens his scene, `delayMs`); HaX's on `arakawa_call_done && flag1_submitted && !pair_back`. Set `split_started` on the split line's **last** line. Add a door-try form of the bark for the missing pair (`door_unlock_failed:blast_tunnel` with `!pair_back`) that re-fires the Arakawa catch-up.

**R2-M6. The WREN aim is no longer story-gated, so its tasks reveal it on saves where the sleeper is already caught.**
- *Location:* OT §2 JSON (`find_the_sleeper`: `"status": "locked"`, no `unlockCondition`) and notes (line 128); §3 rows for `read_the_door_log` and `name_the_sleeper`.
- *Evidence:* a task completing in a locked aim reveals the aim unless the aim is story-gated, and only a `globalVariable` `unlockCondition` counts as a story gate (`systems/objectives-manager.js:704-736`; the server mirrors it). The WREN tasks complete on globals that exist on every save: `clue_door_log` from the door log's `onRead` (the log is on the critical path, with a `taken` variant), and `wren_at_core` with `accused = ""` for `name_the_sleeper`.
- *Problem:* on `m09_recruiter_offer` `taken` or `double_crossed` (`whodunit_live` false), reading the door log pops up "Find The Sleeper (Optional): One of tonight's team was placed eleven years ago…" while Kowalczyk sits cuffed in the van. On `double_crossed` the aim also appears at the core. This is the problem R1D-m4 set out to prevent, reintroduced by the F-04 fix.
- *Fix:* give the aim `unlockCondition: { "globalVariable": "whodunit_open" }`, with a local `whodunit_open` (default false) set by HaX on `aside_done && whodunit_live` (and the `game_loaded` form). Keep the explicit `unlockAim` on the same event, because the condition is never re-checked. The aim is then hidden at load, story-gated on closed saves, and opened at the aside. Or put `globalVars.whodunit_live === true` on every WREN `completeTask` mapping.

**R2-M7. On Scorched Earth, a reload during the hearing reopens both closing scenes.**
- *Location:* OT §4.7 table row `scorched` and the paragraph after it (line 269); §7 credits per closing NPC.
- *Evidence:* `six_oclock`'s backstop is `game_loaded` with its ending value and `!closing_done`, and `hearing`'s adds `six_done`. On `scorched` after the 06:00 scene both hold. A second `startMinigame` ends the open one (`minigames/framework/minigame-manager.js:56-68`), which emits `conversation_closed` for it.
- *Problem:* depending on registration order, either the hearing is cut off by a replayed 06:00 scene, or the replayed 06:00 scene is cut off by the hearing. In the first case, if stage 9 put the scorched credits on `conversation_closed:hearing`, they roll before `close_the_night` completes. The replayed 06:00 scene then re-sets `six_done` to `true`, which is no change, so the hearing never returns and the conclusion is left undone until the next reload repeats the race.
- *Fix:* `six_oclock`'s scorched backstop adds `!globalVars.six_done`. Every closing mapping (the `conversation_closed:tesseract` ones too) carries `!globalVars.closing_done` and `onceOnly`. Say in §7 that `six_oclock` carries no credits entry for `scorched`.

**R2-M8. The core-start runs (D, 9 of 35) can't reach the closing scene or `/conclude`.**
- *Location:* OT §9 "Deep starts" (line 432), "Flags" (line 436), S-core baseline (line 446), D1–D9.
- *Evidence:* `--start-room` moves only `npcType: "phone"` NPCs. Person NPCs need `--carry-npc` and keep their x/y (`tools/playtest/new-game.rb:28-41, 189-200`; `tools/playtest/README.md`). `six_oclock`, `hearing` and `citadel` are hidden person NPCs in `forward_post` (RL §2.1), on the m08 pattern (`scenarios/m08_the_mole/scenario.json.erb:1219-1232`). `--submit-flag` now exists and records the flag, its station's rewards and the task (README). S-core only `--set`s `flagN_submitted`, which leaves the four flag tasks open, and `concludeRequires` holds those tasks.
- *Problem:* on every D run the closing scene's mappings never register, so D1's "closing chain per §4.7" can't run. If a scene did open, `close_the_night` would get the server's "Not yet…" refusal (`systems/objectives-manager.js:555-562`), because the flag tasks are open.
- *Fix:* S-core adds `--carry-npc six_oclock --carry-npc hearing --carry-npc citadel` (their (500, 500) position keeps them off-screen in the core). Replace the `--set flagN_submitted` lines in S-core (and in S-sh, except C6; see R2-m8) with `--submit-flag <vm>:flag_1` … `<vm>:flag_4`, which also writes the `set_global` rewards. Rewrite §9's "Deep starts" and "Flags" paragraphs for the bootstrap as it now is.

### Minors

| Id | Location | Evidence and problem | Fix |
|---|---|---|---|
| R2-m1 | OT §6 "Every step's mapping … requires the step before it"; rows 0210, 0230, 0345 | Guards are `raid_clock === '<previous>'`. One missed step freezes every later step for the night. That happens for certain on the Arakawa-down branch, where nothing sets `t0210`, so `t0220` never sets. It can also happen when an ink-set step (`t0230` in `breach_call`, `t0345` in `gallery_open`) is lost to a reload before its line. The screens would then contradict HaX's spoken times. | Guard each step with `globalVars.raid_clock < 't0245'` (the evaluator compares strings, `systems/npc-manager.js:57-66`, and the `t` values sort in time order). It stays monotonic and heals a skipped step. Move the `t0230` and `t0345` writes from ink to HaX mappings on `breach_open` and `gallery_open`. |
| R2-m2 | OT §4.5 "said aloud", §4.6 step 2; RL §2.8 | Neither doc names what opens Tesseract's first line on entry, or when HaX's voiced return call rings (OT §13). A mapping-opened phone-chat ends any open person-chat after 500 ms (`systems/npc-manager.js:1161-1185`). If both key on `room_entered:core`, one cuts the other. | Tesseract's own mapping on `room_entered:core` with `!core_greeted` opens `core_router`. HaX's return rings on `global_variable_changed:core_greeted` with `delayMs`, or her lines live inside step 2 as written there. Pick one. |
| R2-m3 | RL §2.6 `release_console_controls` | Mappings default to a 5 s cooldown (`systems/npc-manager.js:705-711`), so a second click within 5 s does nothing. `object_interacted` carries `objectType`, `objectName` and `roomId` only, with no object id (`systems/interactions.js:626-632`). | `cooldown: 0`, keyed on `data.objectName === '<its name>' && data.roomId === 'server_hall'`. Same for `post_ladder`. |
| R2-m4 | RL §2.5 `bypass_panel`, §2.7 `lock_keypad_plate`; OT §4.5 way 2 | Dusting needs `hasFingerprint` and `fingerprintOwner` on the object. It emits `fingerprint_collected:<ownerId>` with `objectId` (`systems/biometrics.js:20-31, 60-100`). It sets no global itself and shows a print, not digits. Once a lift is excellent, a click falls through to the object's own text (`:27-28`). | Name the mappings: `fingerprint_collected:<owner>` with `data.objectId === 'lock_keypad_plate'` sets `keypad_dusted`, and the same for `voltage_print_lifted`. The four worn keys are the plate's `textVariants` on `keypad_dusted`. |
| R2-m5 | OT §3 flag rows ("bridged a second time from `objective_task_completed:submit_flag_N`") | The task event fires client-side in the same moment the `set_global` reward is applied (`systems/objectives-manager.js:439-440, 611-620`), so a tab that dies before sync loses both. F-14's case isn't covered. | Use an `emit_event` reward (queued server-side in `pending_events`, F-14's evidence) with a HaX mapping that sets the global, or state that the confirmed global sync covers it. |
| R2-m6 | RL §2.3, §2.7, §2.1, §2.3 `fitter_locker` | `duty_guard`'s patrol endpoint (6, 7) is `kowalczyk_ahead_so`'s tile. `reinforcement_a` (2, 3) is diagonal to the stair's approach (1, 2) and blocks the retreat (F-11's point). `gate_terminal` (17, 3) is diagonal to the blast door's approach (18, 2). The key-locked `fitter_locker` with no key item gives a fifth "nothing can open it" warning (`scripts/validate_scenario.rb:1660-1671`). | Move the endpoint to (6, 8) or the copy to (7, 7). Put the reinforcements at (3, 4)/(4, 4) after R2-M2's fix. Move the terminal to (16, 3). Note the fifth expected warning beside the four story doors. |
| R2-m7 | OT §4.7 table (`conversation_closed:tesseract`, `delayMs: 1500`) | Step 10 of `core_router` closes his conversation again whenever he is re-talked after the pick. Without `!closing_done` each close re-arms the scene mapping. Harmless once the visualiser is up, but a refused `/conclude` would replay the 06:00 scene on every re-talk. | Covered by R2-M7's `!closing_done` + `onceOnly`. Listed so stage 9 applies it to all six rows, not just the backstops. |
| R2-m8 | OT §9 baselines and C/D rows | (a) C6 relies on arrested Victoria's first ring, which keys on `global_variable_changed:flag2_submitted`. A `--set` (or `--submit-flag`, which writes state directly) emits no change event, so only the `gallery_open` re-ring plays. (b) S-core sets `head_start_out='"none"'` but leaves `share_zero_day` at its default `live`, so the screens read ZERO DAY: LIVE under "Nothing went at four". (c) Deep starts leave earlier aims open. `--complete-task` now exists (`tools/playtest/README.md`), and S-core's `end_it` stays locked unless `cross_the_gallery` and `open_the_outer_lock` are completed. (d) "S4-9's proposed `--submit-flag`", "being built" and "loaded and met" are stale (OT lines 432, 436; RL §6 "Engine work still open" item 2). | (a) C6 starts from S-sh without the flag 2 `--set` and submits flag 2 in-browser with the station's `test:flag` alias. (b) S-core also sets `share_zero_day='"stopped"'` (and `'"released"'` on the `zero_day` D1 games). (c) Add `--complete-task` for every earlier task on each baseline. (d) Rewrite the wording. |

## 4. Test runs (OT §9) against the bootstrap as it now exists

Checked against `tools/playtest/new-game.rb:1-80, 181-207, 266-415` and `tools/playtest/README.md`.

- **Syntax: valid.** `--start-room`, `--unlock`, `--set` (JSON-parsed, so `'"t0245"'` is a string), `--imports=<file>`, repeated options (the last `--start-room` wins, `--set` applies in order). The 3 + 8 + 5 + 4 + 6 + 9 = 35 arithmetic holds.
- **E and A runs (11): valid as written.** They start in `forward_post`.
- **B, W and C runs (15): valid for HaX and the phone NPCs**, which the bootstrap now moves into the new start room, so her mappings, hub and the F19 unlocks register. `room_entered` fires for the start room at boot (`core/rooms.js:93, 2976-3001`), so S-so's handset bark, `t0245` and the `<room>_entered` globals all fire. F19 needs no encounter (`game.rb:1250-1258`). C6 needs R2-m8(a).
- **D runs (9): not valid yet.** They need `--carry-npc` for the three closing NPCs and `--submit-flag` for the four flag tasks (R2-M8), plus R2-m8(b–c).
- **Done-flags:** the baselines already `--set` every door done-flag they pass and `hax_jammed=false`, as R1 asked. Once R2-M1 lands that stays right, because the catch-ups test the same globals.
- **Reload runs** (A4, A5, A8, C3, D3, D9) now expect the forward-post respawn. A4 and A8 sit in R2-M5's window. Add one reload during Arakawa's scene to A3 or A7.

## 5. What holds up

- **Door alignment.** All seven pairs align from six start rooms on the 4×2 layout. Nothing overlaps beyond the normal wall stacking. R2-M2 is about which wall the lock lands on, not alignment.
- **The story-door pattern** with F19 is sound once the done-flag event is corrected. The server takes the unlock through the `npc` path before any lock-type check, and persists it.
- **The gallery gate** (flags 2 + 3 + the cut, any order, `game_loaded` and failed-try catch-ups) and `core_router`'s all-four-flags step close R1D-B1 properly. No ending can now be reached with a flag missing.
- **The jam** clears on every other room, so stepping back down, walking back from the core and reloading all behave.
- **Ghost's handset.** Keying on `object_interacted` + `data.objectName` with `cooldown: 0` and `resume: true` works on every click. The mapping's phone-chat opens 500 ms after the click and replaces the object's examine view (`systems/npc-manager.js:1161-1185`), so a ringing handset with text is fine. Damage closes the call and the next click resumes it.
- **The by-hand cut** now has a ring, a re-ring on entry, and HaX's topic as the last net. Every slot-holder's knock-out or refusal reaches it.
- **Kit on a cold start.** Every tool has a use on a save with no imports: the pick (the fitter's locker), the cloner (Imran's card through his ink's `#clone_keycard`, gated on `ghost_watch_on_route` there, `minigames/helpers/chat-helpers.js:318-360`), the fingerprint kit (the plate, R2-m4 for wiring), and the PIN cracker (the outer lock and the cupboard; unlimited guesses with lights, `systems/minigame-starters.js:525-540`).
- **The closing order** copies m08's verified chain. `close_the_night` on the last scene's last line concludes and opens the visualiser (`systems/objectives-manager.js:566-569, 1057-1085`). Credits entries own the visualiser whatever their playlist (`music/scenario-music-events.js:101-108`), so `end` endings roll credits too.
- **Music triggers** are generic event names (`music/scenario-music-events.js:268-288`), so `room_entered:gallery` and `room_entered:server_hall` work as written.
