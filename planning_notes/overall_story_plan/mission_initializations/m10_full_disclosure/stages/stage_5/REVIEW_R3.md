# m10 Full Disclosure, stages 4+5: review R3 (final check)

## 0. Scope

Round 3, fresh read-only reviewer, 2026-10-21. Draft 3 of `../stage_4/objectives_tasks.md` ("OT", §14) and `room_layout.md` ("RL", §10), against `REVIEW_R2.md`, `docs/agents/FINALE_BRIEF.md`, `FINALE_ENGINE_VOICED_CALLS.md`, `FINALE_ENGINE_UNLOCKS_SILENCE.md` and `tools/playtest/README.md`. Engine paths are under `public/break_escape/js/` unless they start with `app/`, `scripts/` or `tools/`. No VM material was opened.

Door alignment: I built a fresh stub from RL §1's table (core **east** of the gallery) and ran `scripts/check_door_alignment.py` from six start rooms (`forward_post`, `security_office`, `workshop_floor`, `server_hall`, `gallery`, `core`). All seven pairs are OK from every start, exit 0.

## 1. Verdict

**Not clean: 0 blockers, 3 majors, 5 minors.** All 16 R2 findings are applied and most hold. Two R2 fixes created new problems (R3-M1 from R2-M4, R3-m1 from R2-m5). R3-M2 is an older gap that R2 missed, and R3-M3 is a KO path the R2-M5 catch-ups don't cover. Each fix is a line or two of the plan.

## 2. R2 findings: confirmation list

| Id | Status | Checked against |
|---|---|---|
| R2-M1 | fixed | The mapping passes its own NPC id (`systems/npc-manager.js:874-879`), and the bridge emits `door_unlocked_by_npc` `{roomId, npcId}` only after the server accepts (`systems/npc-game-bridge.js:108-139`). OT §0, §4 step 4, §4.4; RL §3, §6 item 30 |
| R2-M2 | fixed | Core east of the gallery; the alignment run above. Stale copy at RL §7 S5-9 (R3-m5) |
| R2-M3 | fixed | `door_unlock_attempt` is emitted for a locked door before the outcome, with `connectedRoom` (`systems/unlock-system.js:111-122`). Stale copies at OT §3 line 155 and RL S5-12 (R3-m5) |
| R2-M4 | fixed as written, **but see R3-M1** | `requireGlobal` and a `skipIfGlobal` list are supported (`systems/npc-sight-challenge.js:44-71`). A failed `requireGlobal` doesn't use up the sighting (`:121-131`), so the challenge still fires when `at_keypad` flips during the minigame. `los.visualize` draws the cone (`systems/npc-manager.js:2244`). `room_exited` carries `roomId` (`core/rooms.js:3010-3014`) |
| R2-M5 | fixed for reloads, **KO gap R3-M3** | OT §4.1, §6 |
| R2-M6 | fixed | A `globalVariable` condition makes the aim story-gated, and a task completing in it stays hidden (`systems/objectives-manager.js:688-736`). The second guard causes R3-m3 |
| R2-M7 | fixed in §4.7 | But the `closing_backstop_fired` credits entry collides with the re-open backstops (R3-M2) |
| R2-M8 | fixed | `--carry-npc`, `--complete-task` and `--submit-flag` are committed (cf6b341e, 0f8574bf; `tools/playtest/new-game.rb:29-78`, README). The S-core aims are right: `end_it` stays locked until `hear_him_out`, as a D run needs |
| R2-m1 | fixed | The evaluator supports `<` and `'t0245'` parses as a string (`systems/npc-manager.js:20-30, 57-66, 92-95`). All `t` values are five characters, so string order is time order. Arakawa-down skips `t0210` and `t0220` still sets |
| R2-m2 | fixed | OT §4.6 step 2 |
| R2-m3 | fixed | RL §2.2, §2.6; `?? 5000` honours `cooldown: 0` (`systems/npc-manager.js:712-716`) |
| R2-m4 | fixed | payload carries `objectId` (`systems/biometrics.js:89-95`) |
| R2-m5 | **not effective** | R3-m1 |
| R2-m6 | fixed | A new overlap appears in the gallery (R3-m4) |
| R2-m7 | fixed | OT §4.7 |
| R2-m8 | fixed (a)-(d) | One stale "walk-in fallback" at OT §11 line 544 (R3-m5) |

**The 35 runs against the committed bootstrap.** The syntax is valid, and 3 + 8 + 5 + 4 + 6 + 9 = 35. The baselines `--set` every global the client would have written, including each `flagN_submitted`, so the runs don't depend on R3-m1. C6's in-browser flag 2 fires the reward event client-side, so Victoria's first ring plays. All runs except C6 must also submit flag 3 in the browser, because S-sh doesn't seed it. That is as intended, but stage 9 should know.

## 3. Findings

### Majors

**R3-M1. Cracking the outer lock inside the guard's cone is never challenged.**
- *Location:* OT §4.5 way 1; RL §2.7 `lock_guard` (`skipIfGlobal: ["outer_lock_open", …]`).
- *Problem:* on a successful crack, `onComplete` runs the callback (`systems/minigame-starters.js:545-549`), and `unlockTarget` emits `door_unlocked` at once (`systems/unlock-system.js:661-681`). HaX's mapping then sets `outer_lock_open`, which has no `delayMs`. The sight watcher does nothing while the minigame is open (`systems/npc-sight-challenge.js:99-100`), and it checks `skipIfGlobal` before it fires (`:131`). So by its first check after the close, `outer_lock_open` already blocks the challenge. A held cracker allows unlimited guesses, so it never fails. The only challenge left is after a cancel. "Crack in it and … he goes hostile with the door open behind the player" can't happen, and E2's and C2's "while the cone is off the keypad" pass whatever the player does.
- *Fix:* take `outer_lock_open` out of `skipIfGlobal` and keep `lock_guard_challenged`. `at_keypad` already limits him to the keypad, and it clears when the player leaves the gallery, so once through he never challenges again (with R3-m2's extra clears). Stage 9 confirms the order in the browser: the challenge should open as the cracker closes, with the door open.

**R3-M2. On a reload during a closing scene, the `closing_backstop_fired` credits roll over the re-opened scene.**
- *Location:* OT §7 "The order at the end", the sentence "As in m08, a second music entry fires the same credits on `global_variable_changed:closing_backstop_fired` (set by the `game_loaded` backstops of §4.7)".
- *Problem:* m08's backstop completes the task **instead of** replaying the debrief (`scenarios/m08_the_mole/scenario.json.erb:631-641`). m10's backstops **re-open** the scene. A credits entry calls `/conclude` and opens the visualiser as soon as the server agrees (`music/scenario-music-events.js:101-160`), and with all four flags in it agrees at once. So a reload mid-scene puts the credits over the replayed scene, before `close_the_night`, and the scene's own `conversation_closed` entry then rolls them a second time. On `scorched`, the replayed 06:00 scene's backstop rolls the Scorched credits before the hearing.
- *Fix:* the re-open backstops don't set `closing_backstop_fired`, and the replayed scene's own close carries the credits. Drop the second music entry. If the "last line ran, close lost" case needs covering, `end_it`'s `conclusionScreen` re-open on load (already in §7) does it.

**R3-M3. Arakawa knocked out after leaving his call early strands the breach.**
- *Location:* OT §6 rows "Arakawa's call" and "The pair back"; §4.1 holding bark.
- *Problem:* Arakawa's scene is a mapping-opened person-chat with no `disableClose` (the default is false, `systems/npc-manager.js:675`), so the player can leave before its last line. `arakawa_gate` is knockable and sets `arakawa_ko` (RL §2.1). After that, every Arakawa catch-up carries `!arakawa_ko`, and HaX's KO arm fires only on `conversation_closed:director_netherton`. Netherton's catch-ups need `!split_started`, so they don't fire either. Nothing sets `arakawa_call_done` until the player happens to talk to Netherton again, and the breach bark says "Arakawa's still on the phone."
- *Fix:* add HaX's KO arm on `npc_ko:arakawa_gate`, `game_loaded` and `door_unlock_failed:blast_tunnel`, each with `globalVars.split_started === true && globalVars.arakawa_ko === true && !globalVars.arakawa_call_done`, setting `arakawa_call_done`. Add one A7 check: leave the call, knock him out, try the blast door.

### Minors

| Id | Location | Problem | Fix |
|---|---|---|---|
| R3-m1 | OT §3 flag rows (line 140 and the same claim for flags 2-4); §9 "Deep starts" (line 432) | Nothing on the client reads `pending_events`. It is only written (`games_controller.rb:2262-2266`, `game.rb:2823`, `tools/playtest/new-game.rb:397`; no reader in `public/break_escape/js`). The reward event is emitted from the POST response (`minigames/flag-station/flag-station-minigame.js:492, 783-785` → `systems/apply-actions.js:58`), the same moment a `set_global` would apply. A re-submit skips claimed rewards (`games_controller.rb:2190-2194`). So R2-m5's window is unchanged, "delivered on the next load" is false, and stage 9's reload check would fail as written | Correct the text and accept the narrow window, or put to the user the small engine change: emit and clear `player_state.pending_events` after `game_loaded` |
| R3-m2 | OT §4.5 way 1; RL §2.7 | `at_keypad` stays set after a cancelled attempt, so any later sighting anywhere in the gallery challenges. A reload in the gallery leaves it set, because the respawn emits no `room_exited` (`core/rooms.js:3010`) | Also clear it on `game_loaded` and on `room_entered:gallery` |
| R3-m3 | OT §2 notes ("every WREN `completeTask` mapping carries `globalVars.whodunit_open === true`"); §3 `check_the_alibis` | `m09_sleeper_shortlist` sets `clue_alibi` at the aside, before `aside_done` → `whodunit_open`. The guarded mapping drops it, and HaX's alibi topic is hidden by `not clue_alibi`, so the task never completes on that save. That breaks "the optional aim always closes" | Drop the second guard (the story gate already hides the aim and keeps the task, `objectives-manager.js:720-726`), or add a `global_variable_changed:whodunit_open` catch-up per WREN task |
| R3-m4 | RL §2.7 | `farah_chair` (4, 4), `reinforcement_b` (4, 4) and `reinforcement_a` (3, 4) all sit on `lock_guard`'s patrol line, (7, 4) → (2, 4). The chair and the reinforcement share a tile on saves with both (talked-round Imran plus trusted Victoria with Zero Day's share live) | Take the chair and the reinforcements off row 4, or move the patrol to a clear row; nothing on the patrol line |
| R3-m5 | OT line 155; OT line 544; RL line 391; RL line 419 (S5-9); RL line 422 (S5-12) | Stale copies: the old pointer line "Shift code. Ask the gallery's duty guard." on a "wrong-code" trigger; "§9 has the walk-in fallback"; "bridged a second time from its task's `objective_task_completed`"; "the core above the gallery"; "a wrong code names the duty guard" | Reword to the R2 fixes: the line plays on `door_unlock_attempt`; the bootstrap carries NPCs; `emit_event` (per R3-m1); the core east; the pointer plays on the first try |

## 4. What holds up

- **Done-flags** on `door_unlocked_by_npc` with `npcId === 'agent_0x99'`. A catch-up after a lost event re-runs the unlock, the server accepts it again (`game.rb:1028-1030, 1246-1258`), and the event fires.
- **The core east of the gallery** aligns from every start, and the walkway is straight, as RL §2.7 says.
- **The opening chain's reload catch-ups**: Netherton's and Arakawa's are mutually exclusive on `split_started`, and HaX's `pair_back` catch-up closes the third window.
- **The WREN gate**: the aim stays hidden on closed saves, and the explicit `unlockAim` opens it.
- **Scorched Earth reload ordering** in §4.7 (`!six_done` on the scorched backstop). R3-M2 is about the credits entry, not the scenes.
- **The clock's forward-only `<` guard**: it is monotonic, it heals a skipped step, and no knot writes it.
