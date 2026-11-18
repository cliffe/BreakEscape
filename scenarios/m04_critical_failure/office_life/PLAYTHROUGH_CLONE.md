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
