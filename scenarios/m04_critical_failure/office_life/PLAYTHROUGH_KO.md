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
| 19 | Credits text ("OFFICE STAFF: hurt, and that's on you", no "ALL THIRTEEN") and debrief head-count line | NOT REACHED. Static read only: `scenario.json.erb:243-250` carry the conditions |

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

## Retry (game 8082, INCOMPLETE: handed over at the context limit, not at a failure)

HEAD 5678582166a74fac2178ed3862bcfa6a2e1e1381 (build/ol-m04). Game 8082 from new-game.rb (no `--set`), keyless :3097, headless. Log `tools/playtest/m04_critical_failure-session-g8082.jsonl` (359 commands, session stopped and synced; no pid file). Loop `fpsLimit=20`, `hasFpsLimit=true`, `_limitRate=50`, `fixedStep` true. No globals set, no needs.set, no row edits. Screenshot `screenshots/pt_ko2_body.png` (KO body). Credits and debrief NOT reached; verify-run below is the partial one.

### Steps done (all PASS unless stated)

1. Briefing six picks, notes closed, tutorial declined, guard ("Grid-safety regulator", "Where do I find"): `guard_admitted`.
2. Baseline: Joanne (239,227) and Ibrahim (215,228) seated at the sofa for 80 s, `aes_staff_off` false, `ops_kettle_off` already true, nobody hostile. They did not move, so waiting for the cooler was pointless; the cooler route was not used.
3. Joanne KO with a guarded swing loop (eval): stand 28 px from her on the side away from Ibrahim, swing only if Ibrahim is at least 42 px from the player, abort if Ibrahim HP drops below 100. Ibrahim stayed at 100 HP and not hostile through 21 swings; Joanne hostile after swing 2, chased the player north to (168,133), KO at (168,113) sprite. `joanne_ko` true, `aes_staff_off` true. Player HP 100 to 56. This answers finding 1 of the first try: a punch from the far side of Joanne does not strike Ibrahim.
4. Ibrahim twice (`converse id`, after Joanne KO): both times "I'll keep to my work, if it's all the same to you." PASS, he was not hostile.
5. Vance ally picks, RFID read, Save: `vance_card_cloned`, `vance_provided_keycard`, `vance_is_ally`. Work orders read. Coffee picked up and KEPT (not drunk; HP 56, then 46 after the Vance KO, 50 after regen). KO Vance (10 swings): `robert_vance_ko` true.
6. Kettle check after the clone: `ops_kettle_off` true (true since the briefing, so no change is observable; same as finding 3 above), no kettle trip seen, no kettle event.
7. SCADA, Hall 1 dial: `anomaly_detected`. HaX call answered, "Then where do I start?". Vance desk phone Call: "No answer", `(Close.)` only. HaX thread "Can we get the night crew out of Hall 2?": "Not from here. The site's evacuation alarm is on Vance's desk." then "And Vance is on the floor of his own office. Nobody's sounding it now." No cost line; `crew_warned` false. PASS (r6 KO branch).
8. Hall 1 to Hall 2: `mg clickControl "Emulate"` on the Level 1 card (the first click of `clickText` followed at once by `mg close` did not open the door; click, wait 4 s, then `close`, then `enter`). Relay cutscene: "Then why are you walking it?", then "(Close the gap before she moves. The cloner's already reading.)": RFID read of "Workshop Card Level 2", Save. `relay_card_cloned` true, `neutralize_operative_relay` completed, `plant_reader_seen` set; Relay not hostile. Cipher not met on this route.
9. Workshop door: `clickControl "Workshop Card"` opened it. Tool case: lockpicking is a dexterity minigame the harness cannot play, so `mg completeLockpick` (assisted, flagged by the harness). Took Fingerprint Kit; the Job Card #4782 back page opened in the notes viewer. `locate_compromised_systems` completed. VM launcher terminal opened (kali, 192.168.100.3). Flag station "SAFETYNET Drop-Site Terminal" opened, 0 of 4 submitted.
10. HaX thread offers: guides (RFID, lockpicking, network mapping, attack surface). Was in the middle of picking "The network mapping guide" (sent, reply not yet read) when handed over.

### Not done: resume steps (fresh agent, game 8082, same ids only)

- `tools/playtest/session-start.sh --url http://127.0.0.1:3097/break_escape/games/8082 --flags tools/playtest/m04_critical_failure-flags-game8082.xml --speed human --log tools/playtest/m04_critical_failure-session-g8082b.jsonl`, then loop-limit eval, `bootstrap` (this is the mid-mission reload: click Resume if the page asks). Check Joanne still KO at sprite (168,113), `joanne_ko`, `aes_staff_off`, `robert_vance_ko` kept, Ibrahim not hostile, player HP.
- Phone: finish the HaX guides (network mapping, attack surface), `plant_reader_seen`/`server_room_reached` come from the plant door and workshop. Submit `<flag:1>` to `<flag:4>` at `flag_station_dropsite` (`mg type [0,"<flag:N>",{"submit":true}]`), one per HaX guide/VM prerequisite as far as the game offers.
- Hall 1 `hall1_round_panel`: Dust for prints, lift Vance's print (recipe in the 8053b log, seq 76 to 132; Vance is KO, so check which print the panel offers when "Robert Vance" is on the floor).
- Plant room door (biometric), Static (`converse ["not here for you"]`), Voltage (needs about 48 HP: drink the coffee via `inventoryAct office-misc-cup Use` just before), ESD button, then `openInventoryItem phone`, HaX "Bring me in" x2 and "On my way", debrief picks as in `r6_vance_ko.json`, credits. Expect "OFFICE STAFF: hurt, and that's on you", no "ALL THIRTEEN"; record the head-count line.
- Then `verify-run.rb 8082`, screenshot `pt_ko2_credits.png`, finish this section, commit the two paths.

### Findings so far

- minor (harness): Relay is reached by the Level 1 emulation only after waiting about 4 s after the click; `mg close` straight after the click leaves the door locked. Same shape as the first try's `lock` note.
- minor (harness): the lockpick on the tool case cannot be played by the bridge (`completeLockpick`, assisted), same as pass 3c.
- No blocker or major finding yet. The KO route is clear of the first try's Ibrahim problem when the punches come from Joanne's far side.

### verify-run.rb 8082 (partial, at the workshop; the head of the output was cut by `tail`, rerun it at the end)

```
tasks           6 in objectivesState, 6 completed
  enter_facility, meet_robert_vance, identify_scada_anomalies, find_infiltration_evidence, locate_compromised_systems, neutralize_operative_relay
tasks_completed 6
score           37
VERDICT: progress recorded - 5 rooms beyond the first, 1 objects unlocked, 0 flags submitted.
```
