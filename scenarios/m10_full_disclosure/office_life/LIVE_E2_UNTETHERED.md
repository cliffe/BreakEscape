# LIVE E2: untethered route (briefing "Leave him in the van.")

Date: 2026-11-17. Branch build/ol-m10, head 0a8d4e609. Server: keyless :3099 (orchestrator's, not started or stopped here). Headless Chromium through `playtest-session.js --headless`, `setFPS(20)` with fixed steps on. No scenario, engine or game-row edits. No globals set. No commits.

Game: **8051** (created for this run with `tools/playtest/new-game.rb m10_full_disclosure`; no VM flags in the scenario, so the stand-in `flag{m10_monitoring_foothold}` was typed at the gate terminal and accepted).

Harness logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/live_d/e2_session.jsonl`. Scripts in the same folder.

Clock figures are the needs-clock in seconds (`npcNeedsSystem.clockMs / 1000`).

## Result

| Check | Result |
|---|---|
| E2 poll: 0 hits (non-extra visible NPC within 14 px of (276,268) or (308,268)) | **PASS**: 0 hits, all 26 behaviour ids, 100 ms polls from clock 40 to 228 |
| Stalled scripted walk (pair, over 5 s without moving while a walk phase is set) | **PASS for the pair**: no flags. The pair never showed a walk phase (phases were `using` and null). See limits. |
| Untethered choice taken | **PASS** by log: `converse` reported `chose` ending in "Leave him in the van." Global `nightshade_tethered` was not read (no accessor for it in this harness) |
| Split, pair back, breach into the tunnel | **PASS**: `split_started` 144, `pair_back` 162, `breach_open` 163, `room_entered:blast_tunnel` 204 |

## Route and events

| Clock | Event | Pair (Darren, Sofia) |
|---|---|---|
| bootstrap | Netherton briefing open, poll installed | visible, (276,268), (308,268) |
| 40 | first poll sample of the pair | visible, home positions |
| 94 | `door_scene_done` | visible |
| 97 | `conversation_closed:director_netherton` (briefing) | visible |
| 100 to 127 | kettle beat: Darren leaves post 100, Sofia 103; `ex_fp_kettle_on` heard 127; both `npc_returned_post` 127 | visible, positions unchanged |
| 118 to 144 | gate console opened (`gate_console_used`, 143), `raid_clock` t0200 | visible |
| 144 | `split_started` | visible |
| 147 | `conversation_closed:director_netherton` (split line) | visible |
| 159 to 160 | `arakawa_call_done`, `conversation_closed:arakawa_gate` | visible |
| 162 | `flag1_submitted`, `pair_back`, `objective_task_completed:submit_flag_1` | visible |
| 163 | `breach_open`, `breach_announced`; Darren leaves post for the kettle | visible |
| 165 to 166 | Sofia leaves post, use starts at `fp_kettle` | visible |
| 185 | `npc_returned_post:darren_price` | visible |
| 188 | `npc_returned_post:sofia_marchetti`; `conversation_closed:agent_0x99` (HaX breach call) | visible |
| 203 to 204 | blast door opened, `room_entered:blast_tunnel` (player at (659,49)) | visible |
| 205 | `door_unlocked_by_npc` security office; `inner_door_open` | visible |
| 228 | end of run (8 s dwell in the tunnel) | visible, (276,268), (308,268) |

Act show and hide: the pair stayed visible through every act and cutscene in this span. Nothing hid them, which matches run 2 (the extras are hidden only at `closing_done`).

## Poll detail

- Hits: 0 at every sample, clock 40 to 228.
- Pair sprite positions logged in `__vis` (change log): only the first sample at clock 40, Darren (276,268) and Sofia (308,268), visible. No later change.
- Pair phase log: `using` at 179 for both (sprite (276,237) and (308,237), body centre 31 px lower, so (276,268) and (308,268)); null at 185 and 188 (back on post).

## Limits

- The pair's trips to the kettle did not move the sprites on screen. Both logged `npc_use_started:fp_kettle` and `npc_returned_post`, but the sprite stayed at its home coordinates. So "the pair coming back" is an event result here, not a visible walk. Whether the kettle use is meant to be off stage is a design question, not a check I could settle from this run.
- The stall monitor watched the two extras only. Netherton's briefing walk and Arakawa's gate walk were not timed. The 100 ms E2 poll did cover every NPC for hits, but not for stalls.
- The untethered branch was checked by the `converse` choice log. Reading `nightshade_tethered` directly was not possible with the harness accessors, so the ink line (`~ nightshade_tethered = false` at `ink/m10_director_netherton.ink:329`) is the source for that value.
- Coverage ends at the tunnel, as the brief asked. Security office onward (duty handset, Ghost call, the rest of the route) was not run.

## Context

Run 2 on the tethered route (LIVE_B2C.md) had the same poll result through the closing scene. This run adds the untethered choice through the breach into the tunnel, and confirms that the pair is not hit by any NPC in that span.
