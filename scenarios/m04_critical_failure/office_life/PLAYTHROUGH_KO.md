# m04 office life: KO route playthrough (INCOMPLETE, stopped at game over)

HEAD at start: fa76d47f9b47832762c4b6f0c25fa3bbac31ceae (branch build/ol-m04). Keyless server http://127.0.0.1:3097 (puma 2162290, not touched). Game id 8056 (new-game.rb, no `--set`). Session logs: `tools/playtest/m04_critical_failure-session-g8056.jsonl` (first session, 193 commands) and `...-g8056b.jsonl` (after the reload). Headless. Loop set in the page: `fpsLimit=20`, `hasFpsLimit=true`, `_limitRate=50`; arcade `fixedStep` stayed true (read back true, also after the reload). Nothing set in the page except that; no globals, no needs.set, no stored-row edits. Both sessions stopped with session-stop.sh; no pid file left.

Verdict: the run did NOT reach the credits or debrief. The player was knocked out (game-over screen) by a hostile Ibrahim after the mid-mission reload, at about step 12 of 24. R2 M2 and the "credits after a newcomer KO" live check are therefore still open for this route. Cause is largely the probe (see finding 1), but finding 2 is a player-facing consequence worth a decision.

## Step table

| # | Step | Result |
|---|---|---|
| 1 | Briefing (six r1 picks), notes minigame closed, tutorial declined | PASS |
| 2 | Baseline in reception: Joanne (239,227), Ibrahim (215,228), `aes_staff_off` false, `ops_kettle_off` already true, nobody hostile | PASS (see finding 3 on the kettle) |
| 3 | Guard ("Grid-safety regulator", "Routine procedure. Where do I find Mr Vance?") | PASS, `guard_admitted` |
| 4 | KO Joanne with `playerCombat.attack` at her body centre, re-aimed each swing, from about 28 to 42 px; first 3 swings then 5 more | PASS: `joanne_ko` true, `aes_staff_off` true, `ops_kettle_off` true (was already true), Joanne hostile then KO, body at sprite (186,189), `koRoom` main_entrance, `koX/koY` 186,220. Screenshot `screenshots/pt_ko_body.png` |
| 5 | Ibrahim not hostile unless struck | FAIL by probe: Ibrahim ended hostile at 55/100 HP. My aimed swings landed on him (he sits 24 px from Joanne's sofa cell; she chased and fell next to him). Matches LIVE_PROOF_5 check 1 (bystander in the punch arc). Not a clean "unless struck" proof |
| 6 | KO body stays put | PASS: sprite (186,189) unchanged across 3 readings and after the reload |
| 7 | Vance conversation (r1 ally picks), RFID read, Save, `vance_card_cloned`, `vance_provided_keycard`, `vance_is_ally`, `vance_met` | PASS |
| 8 | Work orders (`operations_office_notes_1`) | PASS, `evidence_maintenance_logs_found`, optional task ticked |
| 9 | Coffee picked up then used from the tray (`item_consumed`, HP 50 to 70) | PASS |
| 10 | KO Vance in the ops office (11 swings, HP 70 to 50) | PASS, `robert_vance_ko` true |
| 11 | SCADA, Hall 1, dial (`analog_thermometer`) | PASS, `anomaly_detected`, `confirm_the_lie` aim and `identify_scada_anomalies` completed |
| 12 | HaX incoming call answered, "Then where do I start?" | PASS. Text shows "His words: those cells are past safe" after "Nightshade's had a look"; reads fine |
| 13 | Vance desk phone, Call | PASS: "No answer", `(Close.)` only |
| 14 | HaX thread, "Can we get the night crew out of Hall 2?" | PASS: "Not from here. The site's evacuation alarm is on Vance's desk." then "And Vance is on the floor of his own office. Nobody's sounding it now." No cost line, `crew_warned` stayed false |
| 15 | Hall 1 to Hall 2 on the cloned Level 1 (`mg clickText "Emulate Level 1"`; the `lock` command does not drive the RFID reader) | PASS |
| 16 | Mid-mission reload (sync, session-stop, session-start same game id, bootstrap "Continue?") | PASS for Joanne: still KO, sprite (186,189), `koX/koY` unchanged, `joanne_ko`/`aes_staff_off`/`robert_vance_ko` kept, Ibrahim not KO. Player respawned in main_entrance at (159,141) HP 46. Screenshot `screenshots/pt_ko_after_reload.png`. Body-centre readout moved (231 to 185) while sprite stayed put; not a position change |
| 17 | Ibrahim twice: curt line "I'll keep to my work, if it's all the same to you." | NOT TESTED / BLOCKED: Ibrahim was hostile (finding 1). `interact` on him opened no chat; he hit the player instead (`currentKnot: start`, `hasTalked` false) |
| 18 | Relay card clone, workshop, case, VM terminal, flag stations (needs `--flags`), print, plant room, Static, Voltage, ESD, "Bring me in", debrief, credits | NOT REACHED |
| 19 | Credits text ("OFFICE STAFF: HURT, ON YOUR ACCOUNT", no "ALL THIRTEEN") and debrief head-count line | NOT REACHED. Static read only: `scenario.json.erb:243-250` carry the conditions |

## Office-life checks

- `joanne_ko` true after KO: PASS. `aes_staff_off` false to true: PASS.
- Cooler and kettle switched off: `ops_kettle_off` was already true before the KO, so no change was observable (finding 3). The cooler has no global; not observed.
- Ibrahim not hostile unless struck: not proven (probe struck him).
- KO body stays put, incl. after reload: PASS (sprite and koX/koY).
- Ibrahim curt line twice: not tested.

## Findings

1. **minor (probe/tester), blocks the route:** a punch loop aimed at Joanne in the sofa cell strikes Ibrahim as well (45 damage), leaving him hostile at 55 HP. The next run should KO Joanne when she is at the water cooler (cell about 264,153, far from Ibrahim's seat) or from the sofa's far side, check Ibrahim's HP is still 100 after each swing batch, and abort and restart the game if it drops.
2. **minor (design, player-facing), needs a decision:** after a reload the player respawns at (159,141) in reception. If Ibrahim or Joanne is hostile there, they are within 30 px of the spawn. Ibrahim took the player from HP 46 to 0 in about 25 s (two readings: 46 at spawn, 14 after one `interact`, then KNOCKED OUT). A player who struck a newcomer, saved, and came back is killed at the respawn point with no way to talk the bystander down. Hostile newcomers also cannot be talked to (interact does not open a chat).
3. **minor (checks that can't show a change):** `ops_kettle_off` is true from the briefing on (it was in `recentGlobals` at the first bootstrap) in this game, while LIVE_PROOF_5 read it false before a KO after the card clone. The "kettle switches off on KO" check needs the kettle to be on first, so it can only be shown after the card clone, as in LIVE_PROOF_5.
4. **minor (harness):** `lock` does not drive the RFID reader (`lock-never-became-actionable`); use `mg clickText "Emulate Level 1"`. Joanne's `attackDamage` reads 4 before and 10 after the reload (the known default-state quirk once a state is first read after reload).

No blocker or major finding in the scenario or engine from this partial run.

## verify-run.rb 8056 (after the knock-out; no flags reached)

```
game            8056  (mission 109)
created         2026-11-17 23:54:01 UTC
last write      2026-11-18 00:04:47 UTC
played for      646s of wall clock
current room    "main_entrance"
unlocked rooms  5: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2
unlocked objs   0:
inventory       7: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, CyberChef Workstation, Notepad, Maintenance Work Orders
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, ibrahim_diallo, joanne_pell, robert_vance, operative_cipher, operative_relay
flags submitted 0:
globals set     22: aes_staff_off, anomaly_detected, blackout_named, briefing_played, checkpoint_passed, disclosure_choice, engine_tutorial_declined, evidence_maintenance_logs_found, guard_admitted, joanne_ko, m03_danny_fate, m03_victoria_fate, ops_kettle_off, player_name, rfid_guide_offered, robert_vance_ko, vance_card_cloned, vance_is_ally, vance_met, vance_phone_available, vance_provided_keycar...
access model: serverClones 1 (facility_keycard_level1 from npc robert_vance); all other counters 0
tasks 4 completed: enter_facility, meet_robert_vance, identify_scada_anomalies, find_infiltration_evidence
score 25
VERDICT: progress recorded - 4 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

## How to resume / redo

Game 8056 is over (player KO'd, game-over screen); start a fresh game. Recipe that worked here: bootstrap, dismiss the tutorial, guard converse, KO Joanne at the cooler with the swing loop (guard on Ibrahim's HP, abort at 12 player HP), Vance ally picks and Save in the RFID reader, desk work orders, coffee from the tray for HP, KO Vance, dial, phone via `mg clickControl Answer`, `mg clickText` (HaX thread then Vance thread, one click then poll), then Hall 2 via `mg clickText "Emulate Level 1"`. Next steps from this state: Relay clone, workshop (Level 2 card), case, VM terminal, flag stations with session-start `--flags`, print from the Hall 1 round panel, plant room, Static, Voltage (needs about 48 HP spare: reload restores nothing here, so keep coffee/health for it), ESD, "Bring me in", debrief, credits.
