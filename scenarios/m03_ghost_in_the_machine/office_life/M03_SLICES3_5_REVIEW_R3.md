# m03 office life slices 3 to 5: review round 3

Range 41cc60e8a..04dcf72ee (01d172150 is the main merge with TTS clips only, ignored), read in the detached worktree `.claude/worktrees/p-ol-m03-r3` (removed at the end). Static review against the engine at 04dcf72ee, plus the live results the scripted-run agent left in `scratchpad/r2fix/` (run folder) (games 6614 to 6617, port 3093). I ran no server and no probe of my own.

## Severity table

| # | Severity | Finding |
|---|---|---|
| 1 | major | R2 #2 still open: from a mid-break start the send-home stops each staffer about a tile short of the post (live S1 FAIL, game 6616). Zainab ends standing in the sofa's east end, Yusuf on the coffee table's edge, needs suspended for the rest of the day |
| 2 | minor | HaX's "Leave the staff alone" text and the music with a hostile staffer at the turn are unproven live: p2 (game 6615) never landed the punch and never turned the phase (script bugs, below) |
| 3 | minor | Cooler case: Ffion knocked out while both staff are at the hallway cooler still sets `wh_staff_witnessed`, the "WATCHED" credits line and "Reception had company". The cooler break invites exactly this play. Low stakes; user's call |
| 4 | nit | "Reception had company" and "The receptionist's down..." both use `delay: 2500` on the same event, so they land together |
| 5 | nit | Validator warnings 13 and 14 (preset queue cells), deferred from R2, unchanged |

## R2 findings

| R2 # | Status | Evidence |
|---|---|---|
| 1 major (tip never run) | closed in substance | Scripted run p1, game 6614: A1 PASS (both staff on `reception_coffee`, laptop open at the leave, `expectedAwayMs` 18626, real away 28.7 s), A2 PASS (`ex_open_door` heard at 32.1 s), C1 PASS (`heard_ex_*` survive a reload), C2 PASS (no knot replays: later breaks gave `ex_tailgate`, then `ex_client_sites`), C3 PASS. B1 FAIL is the capture window: Zainab used the cooler and the laptop locked; Yusuf left his post at 9.2 s with `exp` 29000, so his use fell after the capture ended. Not a defect, but the cooler pair is still not seen end to end |
| 2 major (send-home spot) | at post: closed. Mid-break: open (finding 1) | The fixer's explanation holds: `goToAndStay` (`npc-behavior.js:3307`) unseats first, and `unseatNPC` (`seating.js:1641`) calls `moveFeetTo` so the standing frame keeps the seated feet; the sprite y moves about 20 px, the feet do not. Scripted run p3: before, Zainab sprite (148,241); the R2 "20 px north" was the sprite, not the feet. From the post the move is a no-op either way (old target 12 px off, inside the 32 px arrival radius) |
| 3 minor (HaX texts) | closed statically; "company" live, "attacked" not live | Both texts verbatim (`scenario.json.erb:1373-1380`). "Company" delivered in game 6616 (`map:agent_0x99:npc_ko:ffion_rees:60`), absent in the both-KO negative (game 6617, W1 PASS). "Attacked" not delivered in 6615 because the punch never landed (finding 2) |
| 4 minor (laptop text) | closed | Script check: base text, the four variant values and their conditions are verbatim from DIALOGUE_SAMPLE.md and in its order (night, upset, locked, away) at `:668-674` |
| 5 minor (stale comment) | closed | `:808-812` says five hide mappings, which matches `:847-851` and `:889-893` |
| 6 minor (redundant hides) | closed | `previousRoom === null` mapping gone on both; see "hide on reload" below |
| 7 minor (witnessed without witnesses) | closed for both-KO; cooler case left (finding 3) | `:1371-1378`; W1 PASS |
| 8 nit (lone commas) | closed | `:854`, `:896` |
| 9 nit (validator 13, 14) | deferred, acceptable | |

## Findings

### 1. major: send-home from a break ends a tile short, standing in the furniture

`npc-manager.js:1627` calls `goToAndStay(npcId, worldX, worldY, speed)` with no opts, so `_arriveWithin` is 0 and the arrival guard (`npc-behavior.js:1400-1411`) ends the walk the moment the body is within 32 px of the target. Scripted run p3, game 6616: Ffion knocked out while Yusuf was using the machine and Zainab walking to it. Final feet: Zainab (178,252), 30 px east of her post (148,252); Yusuf (137,284), 31 px east of his (106,280). Against the Tiled objects in `public/break_escape/assets/rooms/room_zds_reception.json`: the sofa (gid 1005) covers x 129 to 191, y 228 to 266, so Zainab stands in its east end; the coffee table (gid 1006) covers x 134 to 186, y 272 to 302, so Yusuf stands on its west edge. Neither sits again: `onExternalMove` (`npc-needs.js:779-789`) sets `scriptSuspended`, and the seating code sits only needs NPCs stopped at a post. Nothing resumes them, so they stay there for the rest of the day. The approach side decides where they stop, so the new targets cannot fix this.

The R2 fix changed only the target. Its own check S1 failed, and the fix log does not mention it.

Two ways out (prove either with a screenshot):

- Engine: pass `arriveWithin` through, e.g. `goToAndStay(npcId, worldX, worldY, speed, override.arriveWithin ? { arriveWithin: override.arriveWithin } : undefined)`, and set `"arriveWithin": 4` on both mappings. Unit test plus live proof per the standing rule. They would still stand (feet on the seat point, which reads as "stood up from the sofa"), not sit.
- Scenario only: drop the `patrolOverride` and let the needs layer bring them home. `wh_staff_upset` is set on the same event and both machines carry `offWhen: "wh_staff_upset"`, so no new break starts; a staffer mid-use finishes and walks home with the needs layer's `arriveWithin` and sits. Check first that R1's reason for suspending needs (no walk elsewhere) still applies with both machines off and `needsRooms` leashing them to reception and the hallway. The delayed `needs.set` mappings (`delayMs` 2000) are gated on `!wh_staff_upset`, so they do not restart a break.

### 2. minor: p2's live results prove nothing

`scratchpad/r2fix/` run folder, `p2-6615.txt`: H1, M1 and M2 FAIL, but for script reasons:

- The punch never landed: `wh_staff_attacked` stayed false and Zainab never turned hostile after four `f` presses (`p2.mjs:15`). No `npc_attacked` was emitted, so the HaX text could not fire.
- The phase never turned: `p2.mjs:42` calls `gv(page, 'mission_phase', 'act2_infiltration')`, but `gv` in `lib.mjs:114` only reads a global. `debugKO('victoria_sterling')` returned `unknown-npc`. Zainab was still visible "after turn" because there was no turn.

Statically the attacked text is sound: both `npc_attacked` mappings (`:1367-1368`, emitted at `player-combat.js:461`) set `wh_staff_attacked`, a mapping `setGlobal` emits `global_variable_changed:<name>` (`npc-manager.js:1510`), and the HaX mapping (`:1379`) is `onceOnly` and keyed per handler (`npc-manager.js:1264`), so it fires once even if both staff are hit. The hide mappings are unchanged apart from the drop, and R1's game 6589 proved them. Still, re-run p2 with the punch fixed (face Zainab, or use the bridge's attack helper) and a real phase setter, so the attacked text and the music at the turn are seen once.

### 3. minor: the cooler case

The gate is correct as written. Each mapping has its own once key (`npc-manager.js:1264`) and a false condition does not count as a fire (the condition check runs before `triggered.count++`), so `!zainab_ko` and `zainab_ko && !yusuf_ko` together are exactly `!(zainab_ko && yusuf_ko)`, and on Ffion's single KO at most one of them fires. W1 confirms the both-KO case.

The gap: the cooler break starts when the player comes back into reception from the hallway (`:852`), and the cooler coupling (`:895`) takes Yusuf as well, so both staff are out of reception for about 25 s while the player is there. A player who waits for the room to empty and then knocks Ffion out gets "Reception had company", the "WATCHED" credits line, and Yusuf's "Zainab, ring someone. Now." from the hallway. Both staff are then walked back into reception (finding 1 applies). This is the clever play, and the game misreads it. Fixing it means a "staff out at the cooler" global set on `npc_left_post` (obj `hallway_cooler`) and cleared on their return, which is more wiring than the stakes justify. I would accept it and note it. The user may disagree.

### 4. nit: two HaX texts at once

`:1046` and `:1374/1377` both use `delay: 2500` on `npc_ko:ffion_rees`. In 6616 both were delivered, the existing one first (index order). Moving "company" to about 5000 would space them out.

## Checked and fine

- **Hide on reload without the `previousRoom === null` mapping.** STAGE1_CHECKS (a) showed that the first-frame `room_entered:reception_lobby` fires with registered NPCs. That stage needed the mapping only to catch that event. The remaining re-hide (`:850`) has no `previousRoom` term, so it matches the same first-frame event until it has fired once. After that, saved visibility covers it: `setNPCVisible` records and posts it (`npc-behavior.js:445-452`), `restoreNpcVisibility` applies it on load before the NPCs register (`npc-manager.js:2228-2241`), and `registerNPC` lets it win over room data (`:353-356`). The dropped mapping only helped on the first night reload after the plain one had fired, and saved visibility already covers that case. Reload-safe.
- **HaX texts and laptop variants.** Verbatim and in the sample's order. "Company" appears twice (the two exclusive mappings), which is intended. The texts fire on the sample's triggers (`wh_staff_attacked`; Ffion's KO by day with a staffer up), `onceOnly`, never at night.
- **player_state.** Three new `onceOnly` handlers on `agent_0x99` and two removed from the staff: one entry each, net +1. No new globals. Visibility is still one key per NPC. Nothing grows.
- **Lock and key.** The diff touches no lock, key, item or server-read global. The fixer's `lock_key_diff` was empty.
- **Critical path and night turn.** No route change. The hidden staff and the turn are as R1 proved, with no live re-proof at this tip (finding 2).
- **R2 #1 timings.** The laptop decision is taken at the leave (`expectedAwayMs` 18626 is under the 24 s threshold, so it stays open), the real away time stretches with the exchange (28.7 s), and the cooler locks it.

## Verdict

Not ready to merge. One major remains: the send-home from a break (finding 1). Either fix needs a screenshot after a mid-break KO. Then re-run p2 properly (finding 2) and the cooler pair with a longer window. Finding 3 is the user's call. The rest is closed.

## Fix log (round 3)

Commit 1bba40ead (scenario.json.erb only). Scripts and screenshots: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/r3fix/. Server 3091 stopped (PID 2075866).

| # | Outcome |
|---|---|
| 1 major | Fixed, scenario only. Both Ffion-KO patrolOverride mappings removed (the globals are set by other mappings, untouched). R1's reason (scripted walk keeps needs suspended, so no fight and no wander) no longer applies: both machines carry offWhen wh_staff_upset, so the needs layer walks them home and sits them. Note: the post is the seat (sofa, armchair), so the old target of feet 148,252 / 106,280 was never the seated spot; seated sprite is (148,241) and (111,268). Proof (p3b.mjs, polled to 84 s, seated and still for the last 15 s): (a) at posts, game 6632 PASS, both seated at origin, 0 px; (b) mid-break, both at reception_coffee using, game 6641 PASS, Yusuf seated at origin, Zainab seated on the sofa's other cushion (24 px east, a valid seat of the same sofa); (c) mid-break at the cooler (Zainab using hallway_cooler, Yusuf walking to it), game 6642 PASS, both seated at origin. Screenshots (4x): reception-case-a-6632.png, reception-case-b-6641.png, reception-case-c-6642.png. Case c shot is dark and clipped at the top (camera/lighting after the hallway round trip); the numbers are the proof. Zainab's thirst need goes to reception_coffee, not the cooler, so the cooler case was reached by the hallway round trip that couples both to the cooler. |
| 2 minor | Fixed (script). p2c.mjs: Ffion KO, take badge, real punch on Zainab (facing set, key f, landed first press), real route to the night turn. Game 6653: H1 PASS ("Leave the staff alone" shown once), M1 PASS (threat music), M2 PASS (hostile Zainab hidden, music cutscene after the turn), H3 PASS (no repeat). The earlier unknown-npc came from the conference room never loading (door locked, no badge). |
| 3 minor | Accepted by the orchestrator: the cooler case counts as witnessed. Low stakes, user may override. Seen live in game 6642 (witnessed true). |
| 4 nit | Fixed: "Reception had company" delay 6000 (was 2500); live, it arrives after "The receptionist's down" (6 s vs 2.5 s). The later texts then need two bark dismissals before the next action in scripts. |
| 5 nit | Deferred as before. |

Cooler pair re-run with a 50 s window (p1.mjs, game 6654): A1, A2, B1 PASS; C1 PASS. C2 and C3 were not seen: I stopped the server before the script finished. Rerun C2 and C3 (reload checks) on the final tip.

Static checks at 1bba40ead: validate_scenario 0 errors, 13 warnings; validate_office_life ran clean; door alignment ran. compile-ink reports 8 failed files, all in other missions (m04 etc.), none in m03 and no ink changed. lock_key_diff and dialoguelint not re-run.
