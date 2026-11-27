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

## Retry 3 (game 8133: first session stopped at the call-in; resumed to the credits, see the last section)

HEAD at start: 7c512b898 (build/ol-m04). Game 8133 on keyless :3097 (puma pid 2162290, left running, untouched). Headless, `--speed fast`. Host load about 172 at start, so headless was required. Session log `tools/playtest/m04_critical_failure-session-g8133c.jsonl` (213 commands; the earlier 8133 logs are `...g8133.jsonl` and `...g8133b.jsonl`). Session stopped with `session-stop.sh 8133` after a `sync`; no pid file or pipes left. Flags: `tools/playtest/m04_critical_failure-flags-game8133.xml`, four configured, referred to only as `<flag:N>`.

Which questions this run answers: plumbing (the route and the flag, print, plant door, Static, Voltage and ESD interactions) and a mid-run reload, not solvability. The VM prerequisites were not reachable.

Note on the handover: it says the game sits in the workshop. The `bootstrap` resume put the player in `main_entrance` (160,144, HP 92). That is the start-room spawn on reload, which is intended, so I walked back (five `enter` commands).

### Step table

| # | Step | Result |
|---|---|---|
| 0 | Start session on the plain URL, `bootstrap` with `resume:"resume"` | PASS. Title "Continue?" closed. `joanne_ko` and `robert_vance_ko` survived the reload (globals in verify) |
| 1 | Walk back to the workshop: `enter` operations_office, scada_control_room, battery_hall_1, then engineering_workshop | PASS. Each `enter` opened or crossed its doorway first time |
| 2 | Flags: `flags` (configured 4, used none), `moveToNear`/`interact` the drop-site station, `type` `<flag:1>` to `<flag:4>` with submit | PASS. Station showed 0 of 4, then "Flag accepted!" four times and "Rewards Unlocked: Foothold on the BMS jump server". Flag rows are "handed over", not earned (VM work not possible in standalone) |
| 3 | Round panel print (Hall 1): Dust, Silver powder, Feather, three sweeps, Lift, Peel, Loop, "1. Robert Vance (match)", Log the print | PASS. Match text "This is Robert Vance's print". Panel closed on "Log the print". `vance_print_lifted` set (verify globals) |
| 4 | Plant door: `enter` battery_hall_2 through the Hall 1 east door, `moveToNear` and `interact` door:battery_hall_2->plant_room, present the lift | PASS. Reader listed "Robert Vance, Quality 78%, Identified". Click on the card presented it. Toast "Biometric Unlock Successful". `enter` plant_room worked |
| 5 | Static (quiet option): `converse` "not here for you" | PASS. Walking up opened Static's chat ("Voltage. Company."). He "takes one step to the side". `static_stood_aside` and `static_left` set. No fight |
| 6 | Voltage: `converse` with the six choices from the clone run (Stand down, Make me understand, Why infrastructure, How many, And you came anyway, Go for the button) | PASS. 44 turns, no unnamed choice, `confront_voltage` completed, `voltage_escaped` and `voltage_neutralised` set. Says "Eleven on site tonight" (finding 4) |
| 7 | ESD: DOM click `#esd-guard` (the guard is not in the `mg` controls), DOM click `#esd-button`, then "CONFIRM - INITIATE SHUTDOWN" | PASS. Toast "Force the shutdown before the racks go", `esd_authorized` and `attack_prevented` set, `disable_attack_vectors` completed. Needed the DOM (finding 2) |
| 8 | Call-in: `openInventoryItem phone`, `mg clickText "Agent HaX"`, read the thread | PARTIAL. Thread read (the "Can we get the night crew out of Hall 2?" line and the "Nothing right now." reply are there). The reply "I'm done here. Bring me in." was NOT sent: stopped at the context limit (150k) |
| 9 | Debrief, disclosure pick | NOT REACHED |
| 10 | Credits | NOT REACHED |
| 11 | Sync, verify-run 8133 | sync done, verify run below. It is taken before the debrief, so it is a progress check only, not the end-of-run check |

### Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| BMS jump server flags 1 to 4 | `<flag:1>` to `<flag:4>` | VM work on the BMS jump server (the open tasks `submit_*_flag` are VM tasks) | step 2 | **no**: flags handed over, VM prerequisite not reachable standalone |
| Vance print lift | (item) | Duty Round Panel, Hall 1 dusting | step 3 | yes |
| Plant reader lift | Vance print | Same print, presented at the plant door | step 4 | yes |
| Workshop Level 2 card | RFID clone | Relay, clone run in the earlier 8133 session (`relay_card_cloned`) | before the reload | yes (earlier session) |

Rows marked **no** are the boundary of this run. The flag stations were exercised, not tested, and every step after them (the VM-earned part of the chain) is unproven.

### Findings (this run)

| # | Severity | Finding | Repro |
|---|---|---|---|
| 1 | minor (harness) | `moveToNear` to Voltage replied `arrivedAt` (1374,593) with `moveShortfall` 152, but the player stood at (1489,694) on the next `brief`, and `interact` opened his chat. The reply reads stale | session log, `moveToNear` voltage |
| 2 | minor (harness) | ESD guard and button are reachable only through the DOM (`#esd-guard`, `#esd-button`). `mg clickControl("ESD Button")` refuses while the guard is shut, and the refusal lists one control with an empty label. Same gap as the clone run | session log, `mg clickControl` "ESD Button" |
| 3 | minor (harness) | The flag submit reply puts the substituted flag value in `typed`, so the session log holds the flag strings. Check before any log is shared | session log, `mg type` lines |
| 4 | minor (repeat, still open) | Voltage says "Eleven on site tonight. Nine on the night crew..." while the debrief and credits say thirteen. Same as the clone run's finding | `converse` transcript, Voltage "How many does the hall take" branch |
| 5 | minor (harness) | Clicking a lift card at the plant reader presents it and closes the reader, but a `getState` straight after still showed the reader. Read the toast or `brief` before retrying | session log, `mg clickControl` "Robert Vance" |

Counts: 0 blockers, 0 majors, 4 minors new (findings 1, 2, 3, 5), 1 repeat minor (finding 4).

Not run in this retry: the debrief, the credits, the Ibrahim curt-line check, the reload after the workshop with a Resume click, and the "Not yet" branch of the call-in. Open items from the handover (`reply to the new Ibrahim normal line`, the Joanne bark) are still unread.

### verify-run.rb 8133 (taken at the call-in step, after sync; flag strings masked here, full text in the saved file)

```
game            8133  (mission 109)
created         2026-11-18 00:35:28 UTC
last write      2026-11-18 00:54:14 UTC
played for      1125s of wall clock
current room    "plant_room"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       10: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, CyberChef Workstation, Notepad, Maintenance Work Orders, Cup of coffee, Fingerprint Kit, OptiGrid Job Card #4782 (back page)
NPCs met        14: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, ibrahim_diallo, joanne_pell, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{…}, flag{…}, flag{…}, flag{…}
globals set     49: aes_staff_off, all_flags_in, anomaly_detected, asked_the_number, attack_mechanism_known, attack_prevented, blackout_named, briefing_played, checkpoint_passed, clock_started, disclosure_choice, engine_tutorial_declined, erlang_guide_offered, esd_authorized, evidence_maintenance_logs_found, fingerprint_kit_found, flag_erlang_rce_submitted, flag_ftp_intel_submitted, flag_network_scan_submitted, flag_privesc_submitted, guard_admitted, joanne_ko, lockpicking_guide_offered, m03_danny_fate, m03_victoria_fate, ops_kettle_off, plant_reader_seen, plant_room_entered, player_name, privesc_guide_offered, proftpd_guide_offered, recon_guide_offered, relay_card_cloned, rfid_guide_offered, robert_vance_ko, server_room_reached, static_left, static_stood_aside, vance_card_cloned, vance_is_ally, vance_met, vance_phone_available, vance_print_lifted, vance_provided_keycard, vance_spoken, voltage_escaped, voltage_neutralised, voltage_six_cities, vuln_guide_offered
access model
  sessions        0
  signedInPcs     0
  serverClones    2: server_room_keycard from npc operative_relay; facility_keycard_level1 from npc robert_vance
  copiedItems     0
  loginFailures   0
  loginLockouts   0
  footholds       0
  gainedFootholds 0
  npcFrustration  0
  guestSessions   0
  sharedLogins    0
  feedRevealed    0
tasks           17 in objectivesState, 16 completed
  enter_facility                     "completed"  at 2026-11-18T00:38:16Z
  confront_voltage                   "completed"  at 2026-11-18T00:53:19Z
  meet_robert_vance                  "completed"  at 2026-11-18T00:38:19Z
  scan_scada_network                 "completed"  at 2026-11-18T00:48:37Z
  call_in_after_sweep                "active"
  submit_privesc_flag                "completed"  at 2026-11-18T00:48:57Z
  get_past_plant_reader              "completed"  at 2026-11-18T00:51:52Z
  submit_ftp_intel_flag              "completed"  at 2026-11-18T00:48:50Z
  disable_attack_vectors             "completed"  at 2026-11-18T00:54:02Z
  submit_erlang_rce_flag             "completed"  at 2026-11-18T00:49:09Z
  identify_scada_anomalies           "completed"  at 2026-11-18T00:39:34Z
  submit_network_scan_flag           "completed"  at 2026-11-18T00:48:36Z
  find_infiltration_evidence         "completed"  at 2026-11-18T00:39:09Z
  locate_compromised_systems         "completed"  at 2026-11-18T00:44:53Z
  neutralize_operative_relay         "completed"  at 2026-11-18T00:41:59Z
  exploit_erlang_ssh_vulnerability   "completed"  at 2026-11-18T00:49:10Z
  investigate_compromised_services   "completed"  at 2026-11-18T00:48:50Z
tasks_completed 16
score           84
social scenario false (completed tasks do not count; pass --tasks to count them)

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Retry 3, resumed (game 8133, session `m04_critical_failure-session-g8133d.jsonl`, 109 commands)

The first session stopped at the call-in. This session resumed the same game from the plain URL (`http://127.0.0.1:3097/break_escape/games/8133`, headless, `--speed fast`, the same flags XML, keyless puma 2162290 left running). Flags were not used again here (`flagsUsed` 0). The earlier four flag rows stand as recorded above: handed over, not earned.

| # | Step | Result |
|---|---|---|
| R1 | `bootstrap` `resume:"resume"` on the plain URL | PASS. "Continue?" closed. Spawned in `main_entrance` (160,144, HP 92), the intended start-room spawn after a reload |
| R2 | `openInventoryItem` phone, `mg clickText "Agent HaX"` | PASS. Thread read. Four reply options offered, including "1. I'm done here. Bring me in." |
| R3 | Reply "I'm done here. Bring me in." | PASS. Call started ("ON CALL") with "Agent HaX" |
| R4 | Call choice "Bring me in.", then "On my way." | PASS. The call offered "Bring me in." / "Not yet. I'm still looking." first. "On my way." appeared only after "Bring me in." The "Not yet" branch was not run |
| R5 | Ending-check overlay ("Before the mission ends"): `endingOverlay` `end` | PASS. Overlay closed and the debrief started. The overlay listed "Deal with the intruder in Battery Hall 1" (see finding 6). "Keep going" was not run |
| R6 | Debrief picks, in order: "Shutdown engaged before the racks went.", "What did we get out of there?", "And the network?", "It goes in the report. Vance will want every line.", "The Architect. He's running all of it.", "What would Task Force Null do?", "Full public disclosure. People have a right to know.", "Just doing my job." | PASS. Each pick led to the next line. Unchosen branches: "Voltage is out through the dock.", "So what do they fix first?", "How far does this reach?", "I'm in. When do we start?", "Keep it classified.", "Say there was an incident.", "Make sure Vance gets the full credit." Disclosure pick: `disclosure_choice` set |
| R7 | Credits | PASS. `missionEnd` kind "credits", `creditsShowing` true, `closable` false. The overlay is left open by design (terminal state). Read via `#bv-credits-overlay` and `#bv-cr-label` |
| R8 | `sync` (twice), `verify-run.rb 8133` | PASS. `mission_complete` and `debrief_started` set. 18 of 18 tasks completed (`call_in_after_sweep` and `report_to_0x99` now complete), score 96 |

Driving notes: after R3 `converse` with an `id` refused with `minigame-active` because the phone chat was already open, so the replies went through `mg clickText`. In the debrief, `converse` with `choices: []` stops at each new line, so each pick was made by `mg clickText` and the state read after it.

### verify-run.rb 8133 (resumed session, after the debrief and credits, flag strings masked)

```
game            8133  (mission 109)
created         2026-11-18 00:35:28 UTC
last write      2026-11-18 01:17:21 UTC
played for      2513s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       10: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, CyberChef Workstation, Notepad, Maintenance Work Orders, Cup of coffee, Fingerprint Kit, OptiGrid Job Card #4782 (back page)
NPCs met        14: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, ibrahim_diallo, joanne_pell, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{…}, flag{…}, flag{…}, flag{…}
globals set     52: aes_staff_off, all_flags_in, anomaly_detected, asked_the_number, attack_mechanism_known, attack_prevented, blackout_named, briefing_played, checkpoint_passed, clock_started, debrief_started, disclosure_choice, ending_track_heard, engine_tutorial_declined, erlang_guide_offered, esd_authorized, evidence_maintenance_logs_found, fingerprint_kit_found, flag_erlang_rce_submitted, flag_ftp_intel_submitted, flag_network_scan_submitted, flag_privesc_submitted, guard_admitted, joanne_ko, lockpicking_guide_offered, m03_danny_fate, m03_victoria_fate, mission_complete, ops_kettle_off, plant_reader_seen, plant_room_entered, player_name, privesc_guide_offered, proftpd_guide_offered, recon_guide_offered, relay_card_cloned, rfid_guide_offered, robert_vance_ko, server_room_reached, static_left, static_stood_aside, vance_card_cloned, vance_is_ally, vance_met, vance_phone_available, vance_print_lifted, vance_provided_keycard, vance_spoken, voltage_escaped, voltage_neutralised, voltage_six_cities, vuln_guide_offered
access model
  sessions        0
  signedInPcs     0
  serverClones    2: server_room_keycard from npc operative_relay; facility_keycard_level1 from npc robert_vance
  copiedItems     0
  loginFailures   0
  loginLockouts   0
  footholds       0
  gainedFootholds 0
  npcFrustration  0
  guestSessions   0
  sharedLogins    0
  feedRevealed    0
tasks           18 in objectivesState, 18 completed
  enter_facility                     "completed"  at 2026-11-18T00:38:16Z
  report_to_0x99                     "completed"  at 2026-11-18T01:17:20Z
  confront_voltage                   "completed"  at 2026-11-18T00:53:19Z
  meet_robert_vance                  "completed"  at 2026-11-18T00:38:19Z
  scan_scada_network                 "completed"  at 2026-11-18T00:48:37Z
  call_in_after_sweep                "completed"  at 2026-11-18T01:14:37Z
  submit_privesc_flag                "completed"  at 2026-11-18T00:48:57Z
  get_past_plant_reader              "completed"  at 2026-11-18T00:51:52Z
  submit_ftp_intel_flag              "completed"  at 2026-11-18T00:48:50Z
  disable_attack_vectors             "completed"  at 2026-11-18T00:54:02Z
  submit_erlang_rce_flag             "completed"  at 2026-11-18T00:49:09Z
  identify_scada_anomalies           "completed"  at 2026-11-18T00:39:34Z
  submit_network_scan_flag           "completed"  at 2026-11-18T00:48:36Z
  find_infiltration_evidence         "completed"  at 2026-11-18T00:39:09Z
  locate_compromised_systems         "completed"  at 2026-11-18T00:44:53Z
  neutralize_operative_relay         "completed"  at 2026-11-18T00:41:59Z
  exploit_erlang_ssh_vulnerability   "completed"  at 2026-11-18T00:49:10Z
  investigate_compromised_services   "completed"  at 2026-11-18T00:48:50Z
tasks_completed 18
score           96
social scenario false (completed tasks do not count; pass --tasks to count them)

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Findings (resumed session)

| # | Severity | Finding | Repro |
|---|---|---|---|
| 6 | minor, unconfirmed | The ending-check overlay lists "Deal with the intruder in Battery Hall 1", which is scenario task `neutralize_operative_cipher` (scenario.json.erb line 468). This run never set that task (not in the 18 in the record). The task is set by `taskOnKO` on the operative cipher (line 2259), and this run did not knock him out. It is not in `concludeRequires`, so the ending was not blocked. Check whether the overlay should list tasks that were never assigned | session log, `endingOverlay` `end` reply |
| 7 | minor (harness) | After the call, `converse` with an `id` refused with `minigame-active` because the phone chat was open. Use `mg clickText` to answer the open chat | session log, `converse` after `Bring me in.` |

Counts for the resumed session: 0 blockers, 0 majors, 1 minor (finding 6, unconfirmed), 1 harness note (finding 7).

Not run in this retry: the "Not yet" branch of the call, the "Keep going" branch of the ending overlay, the debrief branches listed under R6, the Ibrahim curt-line check and the Joanne bark. The VM-earned flag chain is still unproven (see the earned-secrets table above). The run reached the debrief and credits in standalone with the four flags handed over, so the ending is reachable on this route with the flag stations skipped. The VM steps behind the flags are not proven.
