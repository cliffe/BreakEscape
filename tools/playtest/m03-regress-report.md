# m03 regression playtest (engine changes, uncommitted)

Questions answered: 1 (plumbing, with focused unexpected-behaviour probes). Source of steps: `scenarios/m03_ghost_in_the_machine/TESTING_WALKTHROUGH.md` plus the regression brief.
Headless, `--speed fast`. Harness assisted actions: `debugKO` (guard, receptionist, Victoria) and `completeLockpick` are PASS (assisted).

Session logs: `tools/playtest/m03-regress-session.jsonl` (game 1187, main run, 1224 lines) and `tools/playtest/m03-regress-session2.jsonl` (game 1190, KO-Victoria run). Flags XMLs: `m03_ghost_in_the_machine-flags-game1187.xml`, `...-game1190.xml`.

## Verifier output (game 1187, run to completion)

```
game            1187  (mission 47)
created         2026-10-01 06:08:10 UTC
last write      2026-10-01 06:23:46 UTC
played for      936s of wall clock
current room    "reception_lobby"
unlocked rooms  6: reception_lobby, main_hallway, conference_room_01, server_room, executive_wing_hallway, executive_office
unlocked objs   1: victoria_computer
inventory       7: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, Zero Day Transaction Log, Unsent draft (raw message source)
NPCs met        8: briefing_cutscene, director_netherton, agent_nightshade, receptionist_npc, agent_0x99, closing_debrief, victoria_sterling, night_guard
flags submitted 4: flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_1_d9ecf7}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_2_400a3c}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_3_1cf0cc}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_4_da700a}
globals set     22: briefing_played, clone_call_done, debrief_played, draft_seen, flag_distcc_submitted, flag_ftp_submitted, flag_http_submitted, flag_scan_submitted, guard_knocked_out, james_fate, knows_m2_connection, lockpicking_guide_offered, mission_phase, netexploit_guide_offered, night_confrontation_ready, player_approach, time_of_day, victoria_arrested, victoria_card_cloned, victoria_choice_made, victoria_fate, whiteboard_seen

VERDICT: progress recorded — 5 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Game record after run: `status=completed`, `mission_concluded_at=2026-10-01T06:23:46.534Z`.

## Verifier output (game 1190, KO route)

```
game            1190  (mission 47)
created         2026-10-01 06:24:04 UTC
last write      2026-10-01 06:28:33 UTC
played for      268s of wall clock
current room    "reception_lobby"
unlocked rooms  4: reception_lobby, main_hallway, conference_room_01, server_room
unlocked objs   0: 
inventory       7: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Staff Access Badge, Executive Keycard (Nightshade's copy), Executive Keycard
NPCs met        7: briefing_cutscene, director_netherton, agent_nightshade, receptionist_npc, agent_0x99, closing_debrief, victoria_sterling
flags submitted 0: 
globals set     10: briefing_played, james_fate, knows_m2_connection, mission_phase, netexploit_guide_offered, player_approach, receptionist_ko, time_of_day, victoria_fate, victoria_ko

VERDICT: progress recorded — 3 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.
```

## Earned-secrets table (game 1187)

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Reception conference access | cloned `receptionist_badge` | Receptionist, "Lean across the desk" clone option | log 55 (save) | yes |
| Server room access | cloned `victoria_keycard_clone` | Victoria, whiteboard clone sequence | log 579 (save) | yes |
| Whiteboard (ROT13) text | n/a | Server Room Whiteboard | read, `decode_whiteboard` complete | yes |
| Exec PC password | `Sterling2010` | post-it "VS / founding year" (PC) + Company Founding Plaque "Founded 2010" (reception notepad entry) | plaque read before use, then PC | yes |
| Wall-safe PIN `5829` | not used | draft taken to inventory but not read or decoded | — | not used (out of focus) |
| `flag_*` x4 | `<flag:1>`..`<flag:4>` | Standalone: no VMs | — | **no** (stand-in flags; VM work unprovable here) |

Rows marked "no": the four flag submissions were exercised, not tested. Wall safe, lore and Danny were skipped on purpose (focused run).

## Per-check results

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Clone receptionist badge + Victoria card, save; no empty `.minigame-container`; input works | **PASS** | `.minigame-container` count 0 after both clones (eval), then walk/enter worked. Note: the receptionist screen is MIFARE Classic (weak defaults) and Victoria's is MIFARE custom keys, not EM4100. EM4100 appears only in m06 (Irina's CTO badge, m06 report). |
| 2 | Reload straight after cloning Victoria; cloner lists both; Victoria card opens server room | **PASS** | After reload the Saved list showed "Staff Access Badge" and "Executive Keycard"; emulating the latter opened the server room (save at log 579, reload at log 634, emulate afterwards). The reload was a bare `location.reload()` with no preceding sync. |
| 3 | Talk to Victoria once, reload, talk again: no "Welcome to WhiteHat" intro, land on hub | **FAIL** | Log 271: after reload she replays "Victoria Sterling stands as you enter... Welcome to WhiteHat Security." Cause below (D1). |
| 4 | Finish act 1, reload: no aim shows locked while tasks are open | **PASS** | Before and after reload identical: `act1:completed, act2/search_executive/lore/stealth: active, moral_choices: locked`. `moral_choices` is locked by design (needs act2 complete) and showed no completed tasks. |
| 5 | KO Victoria pre-clone (game 1190): physical card drops, HaX relays a copy, either opens server room, holding both fine | **PASS** (one caveat) | `dropped_victoria_sterling_*` "Executive Keycard" appeared and was picked up; HaX call gave "Executive Keycard (Nightshade's copy)" (`relayed_executive_keycard`); with both held plus the looted Staff badge the server-room door opened directly, no minigame or selector. Only one door unlock, so I cannot say which card did it. Receptionist KO also dropped the Staff Access Badge and completed `clone_reception_badge`. |
| 6 | KO'd night guard must not interrupt lockpicking | **PASS (assisted)** | `debugKO night_guard` (log 806), guard sprite ended ~58px from the player, `completeLockpick` (log 818) opened the exec office door: no person-chat, `guard_detection_count` stayed 0. No live-guard control was run in this session. |
| 7 | Wrong password: "Incorrect password", attempt counted | **PASS** | Log 838 to 849. Message "Incorrect password. 1 attempts remaining." with no "Network error". A single Submit click moved the counter by exactly 1. |
| 8 | Finish to `status=completed` | **PASS** | Game record above. |

### Observations from the run

- Fresh talk and re-talk to Victoria after the night flags reached `nighttime_confrontation` correctly. Debrief ran after the fate choice, credits showed (`missionEnd.creditsShowing`, log 1213).
- Several `converse` calls on the receptionist hit the 60-turn limit because the hub loops ("exhaustedBranches": false). Probably the harness, not the game.
- After every reload the "Mission Brief" note popup opens over the game, and on the second reload a session "Resume" button was behind the overlay. The first reload did not show it. Not investigated.
- Harness: `type(..., {submit:true})` on the password minigame counted two attempts (Enter and the follow-up button click both land), so `Attempts: 2/3` after one typed guess. Single `clickControl("Submit")` counted one. Harness artefact, not an engine fault.
- `enter` into the conference room fails with `did-not-cross` when two doors share a click point and the interaction menu opens ("INTERACT WITH... Door / Door"). Dismiss with label "Door" and re-send `enter`.

## Defects

**D1: NPC-local ink variables are not persisted, so check 3 fails (and so does m06 check 10).** Repro: game 1187, talk to Victoria, end conversation, reload, talk again; she replays the intro.
Evidence: `game.player_state['npcInkVariables']` for every NPC is
`{"patch":null,"_changedVariablesForBatchObs":null,"_batchObservingVariableChanges":false}`. In the browser, `npcConversationStateManager.exportNpcInkVariables()` returns the same. These are the internal fields of the inkjs `VariablesState` object, not story variables. Suspect cause: `saveNPCState` (npc-conversation-state.js, `Object.entries(story.variablesState)`, line ~40) and `recordInkVariables` (~line 200) iterate the `VariablesState` object itself; the story's variables live in `variablesState._defaultGlobalVariables` / the proxy getter (the same file already reads `_defaultGlobalVariables.keys()` at ~line 309). `importNpcInkVariables` then seeds `recruitment_discussed`-style flags with nothing, so the restart-at-`start` path finds a fresh story. Same-session re-talk works because it restores the full story state. Classification: engine suspect, a human should confirm.

**Regressions:** none found in m03. The reload-persistence feature simply does not work for ink variables; before this change the same replay happened.

## Other changes confirmed working

- `globalVarOnKO`/KO drops in later-loaded rooms: Victoria's drop (conference room) and the receptionist's (start room) both worked; `victoria_ko` and `receptionist_ko` set.
- Cloned cards survive reload (both missions).
- Reload straight after a global change: `victoria_card_cloned` survived (`recentGlobals` after reload).
- Aim statuses survive reload.
