# m04_critical_failure regression playtest

Question answered: **plumbing + unexpected behaviour** (regression of the engine changes in REGRESSION_BRIEF). Source: scenarios/m04_critical_failure/TESTING_WALKTHROUGH.md. Standalone, headless. KOs used `debugKO` (assisted, combat not played). Lockpicking not involved.

Games and session logs
- Game 1193 (main run, critical path to completed): `tools/playtest/m04-regress-session.jsonl` (flags XML `m04_critical_failure-flags-game1193.xml`). The log also contains the reload attempt at the end (about seq 1104+).
- Game 1197 (side run: ESD before mapping, arrest stance, locked-aim reveal): `tools/playtest/m04-regress-b-session.jsonl`.
- Server record, game 1193: status=completed, mission_concluded_at=2026-10-01 06:42:26 UTC.

## verify-run.rb output
```
1193
game            1193  (mission 48)
created         2026-10-01 06:34:51 UTC
last write      2026-10-01 06:43:15 UTC
played for      504s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, engineering_workshop, battery_hall_2, plant_room
unlocked objs   0: 
inventory       11: Your Phone, Lock Pick Kit, Grid Regulator Credentials, Notepad, Maintenance Work Orders, Facility Access Keycard (Level 1), Workshop Keycard (relayed copy), Cipher's Intelligence Note, Workshop Keycard (Level 2), Master Keycard (relayed copy), Master Keycard
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_c37396}, flag{m04_critical_failure_bms_jump_server_2_6cd007}, flag{m04_critical_failure_bms_jump_server_3_c62a69}, flag{m04_critical_failure_bms_jump_server_4_f6fb52}
globals set     22: anomaly_detected, attack_mechanism_known, attack_prevented, briefing_played, chen_provided_keycard, debrief_ready, disclosure_choice, distcc_guide_offered, esd_authorized, evidence_maintenance_logs_found, mission_complete, operative_cipher_defeated, operative_relay_defeated, player_name, recon_guide_offered, remote_trigger_disabled, rfid_guide_offered, server_room_reached, vance_met, voltage_escaped, voltage_neutralised, vuln_guide_offered

VERDICT: progress recorded — 6 rooms beyond the first, 0 objects unlocked, 4 flags submitted.

1197
game            1197  (mission 48)
created         2026-10-01 06:47:35 UTC
last write      2026-10-01 06:50:30 UTC
played for      174s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, engineering_workshop, battery_hall_2, plant_room
unlocked objs   0: 
inventory       8: Your Phone, Lock Pick Kit, Grid Regulator Credentials, Notepad, Facility Access Keycard (Level 1), Workshop Keycard (relayed copy), Master Keycard (relayed copy), Maintenance Work Orders
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 0: 
globals set     12: anomaly_detected, briefing_played, chen_provided_keycard, disclosure_choice, evidence_maintenance_logs_found, operative_cipher_defeated, operative_relay_defeated, player_name, rfid_guide_offered, vance_met, voltage_captured, voltage_neutralised

VERDICT: progress recorded — 6 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

## Earned-secrets table
| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Level 1 keycard | (item) | Robert Vance dialogue reward (converse, session seq 24-28) | before hall 2 | yes |
| Workshop card (Level 2) | (item) | Cipher KO: physical drop on floor AND HaX relayed copy | after KO (seq 94) | yes (via debugKO, assisted) |
| Master card | (item) | Relay KO: physical drop AND HaX relayed copy | after KO (seq 200) | yes (via debugKO, assisted) |
| `bms_jump_server` flags 1-4 | `<flag:1>`..`<flag:4>` | VM challenge, not possible in standalone. Prerequisite reached: workshop, VM launcher opened | step 9 | **no, flags handed over** |

The flag rows are "no". Everything downstream of flag submission (attack_mechanism_known, timers, ESD authorisation, ending) was exercised, not earned. m04 solvability past the VM is unproven here.

## Checks
| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Critical path to status=completed | PASS | game 1193: all 6 aims completed, `disable_attack_vectors` + `report_to_0x99` complete, status=completed, concluded_at set, `missionEnd.creditsShowing=true` |
| 2a | Cipher KO drops physical Level 2 card plus HaX copy | PASS | after debugKO: room objects list `dropped_operative_cipher_0_*` (Workshop Keycard (Level 2)) and `_1_` (note); HaX phone chat opened and inventory gained "Workshop Keycard (relayed copy)"; pickup of the drop worked (event `item_picked_up:keycard`) |
| 2b | Relay KO (hall 2, a later-loaded room) drops Master card plus HaX copy | PASS | `dropped_operative_relay_0_*` Master Keycard present, relayed copy arrived, pickup worked |
| 2c | Either card opens workshop and plant room, holding both is fine | PASS (partly isolated) | game 1193 held both Level 2 cards: workshop door `door_unlocked`, no error; both Master cards: plant room opened. Game 1197 held ONLY the relayed copies: workshop and plant room both opened. The physical card alone was never tested in isolation (the relay copy arrives automatically on KO), so which card the first run used is not recorded |
| 3 | Voltage "go for the button": he disappears | PASS | game 1193: after the stance, `voltage` no longer appears in `room` npcs; `voltage_escaped`, `voltage_neutralised`, `esd_authorized` set. Note the ink also fires `#remove_npc`, so this does not isolate the `setVisible` mapping from the remove |
| 3b | Arrest stance | PASS | game 1197: `voltage_captured`+`voltage_neutralised` true, Voltage stays visible, `confront_voltage` complete |
| 3c | Fight stance | NOT RUN | not exercised in m04 (m05 covers fight/KO) |
| 4a | Timer HUD gone after ESD | PASS | before ESD `#scenario-timer-display` showed "03:43" (counting); after ESD container `display:none`, clock frozen at 03:43 over 3 s |
| 4b | Reload after win: clock does not restart | PASS | after `location.reload()` on game 1193: timer container `display:none`, clock `--:--` and still `--:--` 8 s later |
| 5 | ESD before attack mapped | PASS | game 1197 (no flags, no thermometer): ESD minigame text "NOT ARMED. The interlock holds the button until three conditions are met ..." (in-world, names all three), button disabled. Game 1193 with only Voltage open showed the same text |
| 9 (bonus) | Locked aim with early-completed tasks stays hidden, then shows done | PASS | game 1197: `take_back_the_plant` was `locked` with both tasks complete (arrest + Relay KO) while `confirm_the_lie` was incomplete; once I read the thermometer and the work orders it became `completed` |

## Observations (not classed as defects)
- The ESD pressed via the DOM: the guard, button and confirm are not reachable with `clickControl` labels (guard has no label), so I clicked `#esd-guard`, `#esd-button`, `#esd-confirm` with `element.click()` through `eval`.
- Debrief (`disableClose`) shows no close control; `mg close` returned `stillOpen:true`; after the last line it ended on its own (~2 s). PASS for the disableClose change. Disclosure choice "Full public" -> credits.
- After the reload the credits overlay reported `closable:true`, while before the reload it was `closable:false`. Suspect engine (credits re-opened by the reload path); not confirmed what the intended state is. Evidence: brief `missionEnd.closable` before (seq ~1100) and after the reload in the same log.
- Intro replays after reload were not checked (known, being fixed).
- Harness quirks only: scada -> hall 1 door reports `did-not-cross` but the player does cross after a few more frames; moveToNear can stop outside the 32 px gather range (retry).
- Both timers were running (H2 advisory) during the run; never reached the vent.
- **Regressions: none found in m04.**
