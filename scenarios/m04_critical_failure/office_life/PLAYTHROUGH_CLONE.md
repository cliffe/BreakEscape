# m04 clone route playthrough (PARTIAL, handed over)

HEAD at start: fa76d47f9b47832762c4b6f0c25fa3bbac31ceae (branch build/ol-m04). Game id 8053 (new-game.rb, keyless :3097, no `--set`). Session stopped with session-stop.sh 8053. Log: tools/playtest/m04_critical_failure-session-g8053.jsonl (untracked). FLAGS_XML: tools/playtest/m04_critical_failure-flags-game8053.xml, 0 flags used so far.
Loop set in page: `L=window.game.game.loop; L.fpsLimit=20; L.hasFpsLimit=true; L._limitRate=50`; `physics.world.fixedStep` read back true and left alone.

Status: stopped at the context limit in the engineering workshop, before the VM-flag stations. Steps below the line are not run.

## Step table

| # | Step | Result |
|---|---|---|
| 1 | Bootstrap, briefing (6 picks, all matched) | PASS |
| 2 | Guard (Grid-safety regulator, Where do I find) | PASS, guard_admitted |
| 3 | Vance route picks (7 matched), RFID Save, "Right. Going" | PASS, Level 1 card cloned |
| 4 | Work orders, SCADA round trip | PASS |
| 5 | Hall 1 dial (analogue thermometer) | PASS, anomaly_detected, crew_hint_texted |
| 6 | HaX call: Answer, "Then where do I start?" (only option) | PASS (route picks "Where do I stand/Right/..." not offered; mismatch logged) |
| 7 | Vance call via mg: night crew, Not yet, night crew, Sound it, End | PASS, crew_warned, crew_warned_early, aes_staff_evacuated, clock_started |
| 8 | Cipher auto-chat in Hall 1: "Put the radio down", "racks vent hydrogen", "Hear that klaxon" | PASS, cipher_walked, task completed (route r1 skips Cipher; this was a deviation) |
| 9 | Hall 2 door with Level 1 card (mg Emulate) | PASS |
| 10 | Relay: "Keep her talking", RFID Save | PASS, relay_card_cloned |
| 11 | Workshop door with Workshop Card Level 2, tool case (completeLockpick, ASSISTED), Fingerprint Kit and Job Card taken | PASS |
| 12 | VM launcher terminal opened (instructions only) | PASS |
| 13 | Flag stations (`<flag:1..4>`), round-panel print, plant door, Static, Voltage, ESD, call-in, debrief, credits | NOT RUN |

## Office-life checks

1. Sofa at start: PASS. Both at (215,228) and (239,227) on the sofa; screenshots/pt_clone_01_reception_sofa.png.
2. Kettle trip: PASS. After clone and SCADA round trip, both went to ops_kettle (Ibrahim `using`, Joanne `goto_target`). Talked to Ibrahim while using: one line ("Morning. I'm swapping the office desktops..."), chat background is the ops office kitchenette (screenshots/pt_clone_02_ibrahim_chat_kettle.png). Needs state showed `frozen` during chat, then `returning`, then `idle`/atPost within about 8 s. Note: `room` does not list them while away from reception (moveToNear on id works; entity.room still says main_entrance).
3. Two talks each: PASS. Ibrahim 3 times and Joanne 2 times, a line every time (same greeting line each time).
4. Critical-path blocking: no stop, reroute or push by either newcomer. Cipher and Relay open their chats on entry by design.
5. Evacuation bark: PARTIAL. Joanne's bark fired (npcManager history holds "That's the evacuation. Coats, now." with isBark true, read false) but I did not see it shown: the player was in Hall 1 with the phone minigame open, and the toasts list and DOM bark elements held only HaX's text. Hidden after room change: PASS (`_npcVisibility` both false after entering scada_control_room). Reload check: NOT RUN.
6. Credits and head-count: NOT RUN.

## Findings

- minor, unconfirmed: Joanne's evacuation bark is recorded read:false and was never visible to the player when the trigger lands during a phone call from another room. May be intended (toast routing), but the one-shot mapping means it cannot show again. Evidence: needs of `window.npcManager.getConversationHistory("joanne_pell")` after the call.
- harness: route r1 picks for the HaX call do not match the screen; only "Then where do I start?" is offered.

## verify-run (partial, game 8053, taken at stop)

```
game            8053  (mission 109)
created         2026-11-17 23:53:40 UTC
last write      2026-11-18 00:04:39 UTC
played for      659s of wall clock
current room    "engineering_workshop"
unlocked rooms  6: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop
unlocked objs   1: optigrid_tool_case
inventory       9: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, CyberChef Workstation, Notepad, Maintenance Work Orders, Fingerprint Kit, OptiGrid Job Card #4782 (back page)
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, ibrahim_diallo, joanne_pell, robert_vance, operative_cipher, operative_relay
flags submitted 0: 
globals set     34: aes_staff_evacuated, aes_staff_off, anomaly_detected, blackout_named, briefing_played, checkpoint_passed, cipher_walked, clock_started, crew_hint_texted, crew_warned, crew_warned_early, disclosure_choice, engine_tutorial_declined, evidence_maintenance_logs_found, fingerprint_kit_found, guard_admitted, heard_ex_six_oclock, lockpicking_guide_offered, m03_danny_fate, m03_victoria_
access model
  sessions        0
  signedInPcs     0
tasks_completed 7, score 41
VERDICT: progress recorded, 5 rooms beyond the first, 1 objects unlocked, 0 flags submitted.
```

## Resume

Game 8053 state is on the server: player in engineering_workshop at (788,621), HP 100, kit and job card held, both cards on the cloner. Start a new session (session-start.sh with the same URL and flags XML, Node 24 from ~/.cache/ms-playwright-go/1.57.0 on PATH), bootstrap with resume "resume" (click Resume), reapply the fps setting, then: HaX field-guide texts, flag stations with `<flag:1>`..`<flag:4>` (prerequisites visible in openTasks), Hall 1 round panel print, plant door, Static, Voltage, ESD, call-in, reload with Resume (check 5), debrief, credits, verify-run in full. Helper scripts used live in the scratchpad (talk.sh, adv.sh, vis.sh).

## Continuation (18 November 2026, game 8053 resumed, run to credits)

HEAD: e9146a3c3b5764f345a57074e108d847ba93c2c6 (build/ol-m04). Keyless :3097. Session log: tools/playtest/m04_critical_failure-session-g8053b.jsonl (untracked). Loop fpsLimit 20, fixedStep stayed true. Headless.

| # | Step | Result |
|---|---|---|
| 14 | Resume 8053 (skip_resume URL) | PASS. Server put the player at main_entrance on load (start-room spawn after reload, intended); notes (Work Orders, Job Card) live in gameState.notes, not the inventory list |
| 15 | Flags 1 to 4 at the drop-site terminal (VM flags from FLAGS_XML, VM work itself not done here) | PASS, all four accepted, tasks submit_* complete. Exercised, not earned (no VM): prerequisites are VM tasks |
| 16 | Round-panel print: Feather brush, silver powder, loop, "Robert Vance" | PASS, vance_print_lifted. Card choice taken from debug.correctCandidate (not compared by eye) |
| 17 | Plant door (biometric) with the Vance lift | PASS, entered plant_room |
| 18 | Static: I picked "room about to catch fire" (option 1), which leads to static_refuses and #hostile. The quiet way is option 4 | PASS (assisted): debugKO operative_static, operative_static_defeated. Fight not played |
| 19 | Voltage talk: Stand down, Make me understand, Why infrastructure, How many does the hall take, And you came anyway, "Go for the button and let him run" | PASS, voltage_escaped |
| 20 | ESD: guard and button via DOM click (harness cannot reach those controls), confirm | PASS, attack_prevented, disable_attack_vectors done |
| 21 | Call-in: HaX text thread "I'm done here" then "Bring me in" then "On my way" | PASS. The "Not yet" branch was not run |
| 22 | Debrief (HaX, Vance), disclosure pick "Full public disclosure" | PASS |
| 23 | Credits | PASS |

### Office-life checks (continued)

5. Reload check: PASS. A Resume reload (new page, same id, click Resume) left Ibrahim, Joanne and Cipher hidden (exportNpcVisibility {joanne_pell:false, ibrahim_diallo:false, operative_cipher:false}, sprites not visible, in the home room main_entrance). The earlier skip_resume reload also showed both hidden although exportNpcVisibility was {} at that moment (hidden again by the room_entered:* mapping, onceOnly). Screenshot pt_clone_03_reload_resume_reception.png.
6. Credits and head-count: PASS. Credits line "ALL THIRTEEN ON SITE WALKED OUT". Debrief (HaX): "Thirteen people walked out of there tonight, two of them not on anyone's list. Two hundred and forty thousand people kept their lights on and never knew why." (after "I'm in. When do we start?"). Full credits sequence: MISSION COMPLETE / MISSION 4: CRITICAL FAILURE / ALBION ENERGY STORAGE: THERMAL RUNAWAY AVERTED — Emergency Shutdown engaged / GRID HELD: 240,000 residents kept on supply / ALL THIRTEEN ON SITE WALKED OUT / NIGHT CREW: out of Hall 2 on Vance's alarm, and the cell heard it too / DECISIONS / VOLTAGE: ESCAPED — you took the button and let him reach the dock / ROBERT VANCE: brought in — ran the desk while you ran the halls / CIPHER: walked off the job when you told him about the night crew / RELAY: card copied mid-standoff / THE BREAK-IN: traced on paper to the OptiGrid crew. Screenshot pt_clone_04_credits.png.

### Findings

- minor: Voltage says "Eleven on site tonight. Nine on the night crew in Hall 2, the duty engineer, and the man on the gate", while the debrief and credits say thirteen. The two newcomers are not in his count. Fits "not on anyone's list" if he never saw them, but a player adding it up meets 11 then 13. Evidence: Voltage's "How many does the hall take with it?" branch.
- minor (harness/design): option 1 of Static's standoff ("room about to catch fire") and options 2 and 3 all lead to static_refuses and a fight; only option 4 is the quiet way. Intended per ink comment; noted because I took the fight route by accident.
- minor, unconfirmed: Joanne's evacuation bark (earlier section) was not seen by the player. Not re-tested.
- process: my bootstrap after a plain page load clicked "New Session" and created stray game 8087 (m04, untouched, never driven). 8053 was not affected. Use the Resume button by DOM click, not bootstrap, after a non-skip_resume load.
- No blocker or major found on this route. Not run: 7-pick Vance call re-check, off-path softlock cases, the KO-Vance route.

### verify-run (game 8053, taken after credits and sync)

```
game            8053  (mission 109)
created         2026-11-17 23:53:40 UTC
last write      2026-11-18 00:18:44 UTC
played for      1504s of wall clock
current room    "plant_room"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       9: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, CyberChef Workstation, Notepad, Maintenance Work Orders, Fingerprint Kit, OptiGrid Job Card #4782 (back page)
NPCs met        14: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, ibrahim_diallo, joanne_pell, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_79b743}, flag{m04_critical_failure_bms_jump_server_2_49957d}, flag{m04_critical_failure_bms_jump_server_3_d31a34}, flag{m04_critical_failure_bms_jump_server_4_4a4f73}
globals set     57: aes_staff_evacuated, aes_staff_off, all_flags_in, anomaly_detected, asked_the_number, attack_mechanism_known, attack_prevented, blackout_named, briefing_played, checkpoint_passed, cipher_walked, clock_started, crew_hint_texted, crew_warned, crew_warned_early, debrief_started, disclosure_choice, ending_track_heard, engine_tutorial_declined, erlang_guide_offered, esd_authorized, evidence_maintenance_logs_found, fight_phone_texted, fingerprint_kit_found, flag_erlang_rce_submitted, flag_ftp_intel_submitted, flag_network_scan_submitted, flag_privesc_submitted, guard_admitted, he
access model
  sessions        0
  signedInPcs     0
... (task list) ...
tasks_completed 19, score 100
VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```
