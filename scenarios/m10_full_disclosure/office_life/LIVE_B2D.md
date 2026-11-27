# m10 live B2d: reload after the breach, E1 after reload, credits order, punch on Sofia

Build: branch build/ol-m10, head 862860a6c (includes 93cc9ca10). Server keyless on :3099, headless harness, setFPS(20) with fixed steps on, /tts never probed. Games created in this run: 8071 (checks A to C) and 8090 (check D). No scenario, engine or game-row edits, no globals set, no commits. Stand-in flags typed at the real stations (exercised, not earned): `flag{m10_monitoring_foothold}`, `flag{m10_staging_schedule}`, `flag{m10_container_escape}`, `flag{m10_core_host}`; outer lock typed as 6083. Clock figures are the needs-clock in seconds (reset to near 0 on each reload); wall times are UTC.

## Summary

| Check | Result |
|---|---|
| A. Reload after the breach (93cc9ca10) | PASS: no kettle use or job for either extra for 116 s after the load; a kettle use started 2.7 s after a real walk-in |
| B. E1 after reload | PASS: both hidden at `closing_done`, and still hidden straight after a sync and reload |
| C. Credits order | PASS (game 8071): MALHOTRA, DARREN PRICE, SOFIA MARCHETTI, plain lines |
| D. Punch on Sofia, credit wording | PUNCH PASS; credit clause PASS via the engine replay builder on live globals (game 8125, see "Check D rerun"), not seen on screen |

## A. Reload after the breach (game 8071)

`breach_open` true at clock 111, `closing_done` false; `stateSync.sync()` returned synced; reload at wall 00:05:29.

| Item | Observation |
|---|---|
| State after load | `breach_open` true, `closing_done` false, clock restarting at about 17; pair at (276,268) and (308,268), visible |
| Engine log (`npcNeedsSystem.getLog()`) for the pair, read before dismissing the title | only `registered` entries (tick 4); no `job_start`, `using` or `npc_use_started:fp_kettle` |
| Watch with the title screen up | clock 35 to 65: no use, no job |
| Title dismissed (Enter), Mission Brief closed at clock 86 (wall 00:07:06) | watch clock 86 to 116: no use, no job; pair unmoved |
| Verdict | PASS, 116 s with no kettle use on a load |

Real walk-out and back (`enterRoom` blast_tunnel, then forward_post; a delayed HaX breach call phone-chat interrupted the first return and was auto-answered, so the walk back came second):

| Event | Clock | Wall |
|---|---|---|
| Walk out into blast_tunnel | 134 | 00:07:56 |
| Pair while player away | still at (276,268), (308,268), no use | |
| `room_entered:forward_post` (walk-in) | 165.3 | 00:08:25 |
| darren_price `level_set` caffeine 20, `urgent`, `job_start` target fp_kettle | 167 (1.7 s after walk-in) | |
| `windup` | 167 | |
| `using` and `npc_use_started:fp_kettle` | 168 (2.7 s after walk-in) | |
| Verdict | PASS: kettle use about 2 s after the walk-in, none before | |

## B. E1 after reload (game 8071, same game)

| Step | Observation |
|---|---|
| Played steps 1 to 16 on from the reload (stand-in flags 1 to 4, outer lock 6083, Tesseract, ending `lethal` at 471, "End the mission now") | `six_open` 553, `closing_done` true at 568 |
| Pair at `closing_done` | `__vis` at clock 569: both `vis false` at (276,268) and (308,268); `__pair()` "dar:h | sof:h" |
| Non-extra NPC within 14 px of either home, whole run (clock 8 to 569) | 0 hits |
| After sync and reload, read before any polling loop (page clock 1, wall 00:18:03) | `closing_done` true; darren_price `h` (not visible, active true) at (276,268); sofia_marchetti `h` at (308,268) |
| Same read 4 s later, then after Enter on the title and the Mission Brief open (wall 00:18:17) | unchanged, both hidden |
| Verdict | PASS |

## C. Credits order (game 8071, live recording from the first frame)

A 150 ms recorder on the page body was installed before the ending was clicked, so nothing scrolled past uncaptured. Sections run in this order; the last six lines are the ones asked for (indices are positions in the recorded stream):

| Index | Line |
|---|---|
| 1267 | DIRECTOR MAGNUS NETHERTON: Director. Ran the raid from the forward post. |
| 1280 | AGENT HAX: Handler. Her name is under her agent's on the board's papers. |
| 1317 | OFFICER KENJI ARAKAWA: Held the blast door all night beside Nightshade. |
| 1337 | OFFICER DEV MALHOTRA: Comms, both vans. |
| 1355 | DARREN PRICE: Field support. Kept the generator running till dawn. |
| 1371 | SOFIA MARCHETTI: Welfare. Kept the kettle on all night. |

Earlier in the same pass (from 693): NIGHTSHADE, GHOST, IMRAN SIDDIQUI, WENDELL BRIGGS, DR ABENA ASANTE, PIETER VOS, SIONE FONOTI, DR ADRIAN TESSERACT. Both extras are plain lines, as expected with nobody knocked out or upset. PASS. (`missionEnd.creditsText` held only the signal-analysis intro, so the DOM stream is the source.)

## D. Punch on Sofia (game 8090)

| Item | Observation |
|---|---|
| Method | `window.playerCombat.attack({x, y})` from 17 px away, once, after the briefing. No debugKO, no damageNPC |
| Punch at clock 118 | `npc_hostile_state_changed` (sofia hostile), `npc_attacked:sofia_marchetti`, `fp_staff_upset` true; `fp_sofia_ko` false, `isNPCKO` false |
| After | Sofia stayed at (309,266), player HP 100 to 80 once; no knock-out for her at any point in the run (`fp_sofia_ko` false through clock 404, last read) |
| Route | Same stand-in route to the Tesseract, ending `lethal`, "End the mission now" clicked; both extras stayed visible at their homes up to that point, 0 extra-hits |
| Credits wording | NOT CAPTURED. The headless browser closed during the click on "End the mission now" (the credits start), so the expected "Welfare. Put the kettle away when the shouting started." was not seen |
| Verdict | the precondition (`fp_staff_upset` true, `fp_sofia_ko` false) is confirmed live; the credits line is not |

Own slip in this game: my first punch script began by closing the open minigame, which was Arakawa's gate call, so `arakawa_call_done` and the breach stalled until I talked to Arakawa again (breach_open then at clock 178). Not a game bug.

## Left to do

- D credits: rerun game 8090 or a new game to the ending, with the recorder installed, and keep every eval short after "End the mission now". Both runs of the browser dying are at the credits start or replay, so the credits page may crash the headless Chromium; a screenshot-free recorder that returns after about 20 s may survive where a long loop does not.
- Nothing else open from the brief.

## Bugs and oddities

- Headless browser closes at the start or replay of the credits (second occurrence, run 2 of B2c and now game 8090). Cause unknown; not tied to the extras.
- Engine log reload semantics: after a reload the needs clock restarts near 0 (page clock 1 to 17), so clock times before and after a reload are not comparable.

## Check D rerun (game 8125)

One real punch on Sofia at clock 138 to 141 (21 px, `playerCombat.attack`): `fp_staff_upset` true, `fp_sofia_ko` false, hostile, not knocked out. Played to the lethal ending with stand-in flags; `closing_done` true, `missionEnd.kind` "credits". The credits overlay shows one line at a time and the recorder watched the wrong element, so the DOM pass was missed. The orchestrator then called the engine's own `window.endingReplayOptions(window.gameScenario)` in the live page (the builder a reload of a concluded game uses, from the saved globals) and read:

| Order | Line |
|---|---|
| 1 | OFFICER KENJI ARAKAWA: Held the blast door all night beside Nightshade. |
| 2 | OFFICER DEV MALHOTRA: Comms, both vans. |
| 3 | DARREN PRICE: Field support. Kept the generator running till dawn. |
| 4 | SOFIA MARCHETTI: Welfare. Put the kettle away when the shouting started. |
| 5 | HALINA KOWALCZYK, 'WREN': Breaching lead, Task Force Null. ... |

PASS on the clause chosen from live globals; the line was not seen on screen in this run.
