# m03 pass-3e confirmation playtest (checks 1 to 6 of the 3c checklist)

Question answered: plumbing and unexpected-behaviour probing, not solvability. Game 1238, headless, `--speed fast`, one game start to finish.
Session log: `tools/playtest/m03-pass3e-session.jsonl` (1306 lines). Flags XML: `tools/playtest/m03_ghost_in_the_machine-flags-game1238.xml`. Verify output: `tools/playtest/m03-pass3e-verify-game1238.txt`.
Server record: status=completed, mission_concluded_at 2026-10-01 12:00:52 UTC (fate: escaped).

## verify-run.rb (game 1238)
```
game            1238  (mission 47)
created         2026-10-01 11:45:25 UTC
last write      2026-10-01 12:00:59 UTC
played for      934s of wall clock
current room    "reception_lobby"
unlocked rooms  6: reception_lobby, main_hallway, conference_room_01, executive_wing_hallway, executive_office, server_room
unlocked objs   2: victoria_computer, wall_safe_server
inventory       9: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, Unsent email to the night team (raw source), Exploit Catalogue, CyberChef Workstation, Zero Day Transaction Log
NPCs met        8: briefing_cutscene, director_netherton, agent_nightshade, receptionist_npc, agent_0x99, closing_debrief, victoria_sterling, night_guard
flags submitted 4: ..._1_d0246a, _2_84145d, _3_0a1699, _4_5e1a54
globals set     25: briefing_played, catalogue_seen, clone_call_done, debrief_played, draft_seen, exec_office_entered, flag_distcc_submitted, flag_ftp_submitted, flag_http_submitted, flag_scan_submitted, james_fate, knows_m2_connection, lockpicking_guide_offered, lore_catalogue_found, mission_phase, netexploit_guide_offered, night_confrontation_ready, player_approach, reception_badge_cloned, time_of_day, victoria_card_cloned, victoria_choice_made, victoria_escaped, victoria_fate, whiteboard_seen

VERDICT: progress recorded — 5 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
```

## Results

| # | Check | Result |
|---|---|---|
| 1a | Receptionist clone retry | PASS |
| 1b | Victoria clone retry | PASS |
| 2 | Guard stealth window | PASS in the window, with one unexplained catch (see below) |
| 3 | Wall safe first interact | PASS |
| 4a | Catalogue call after PIN screen | PASS |
| 4b | PC-access call vs result | FAIL |
| 5 | Distcc revelation once in history | PASS |
| 6 | Completed with a mid-mission reload | PASS |

### 1. Clone retry
- Receptionist: "Lean across the desk..." opened the flipper (text still "Readable: No / Clonable: No"). Closed it (`mg close`) before Save. Narrator: "The cloner didn't keep the read. You'll have to lean in again." The hub returned with option 4 "Lean across the desk..." and `clone_reception_badge` was still in `openTasks`. Second try: Save clicked, `reception_badge_cloned` set, task gone from `openTasks`, narrator "The badge is in the cloner." Option no longer offered after.
- Victoria: during the whiteboard beats the flipper opened at "Capture done". Closed before Save. Narrator "The cloner didn't keep the read. You'll need to get close to her card again.", choices included "2. Lean back towards the whiteboard. The cloner needs another read.", `clone_rfid_card` still open. Took it: "You drift back to the whiteboard with a question about the subnet...", flipper opened again, Save, `victoria_card_cloned` set, `clone_rfid_card` completed, Aim 2 tasks appeared.
- Both cards then worked (receptionist badge at the conference door, Victoria card at the server door), both through the flipper "Saved" menu (DOM click, see harness notes).

### 2. Guard stealth window (no watcher script)
Method, disclosed: I watched the guard with a passive position probe (`npcBehaviorManager.behaviors.get("night_guard")`, no triggering) and fired `interact` on the door myself. Because each tool round trip is about 4 s, my first two tries were reactive and imprecise. After mapping one loop by eye I used an open-loop timer: a fixed delay from the east-end arrival phase, not conditioned on the guard's state. No call to the engine's own LoS check.
Guard loop (11.3 s), page clock: east end (580,-34) idle facing down about 2.7 s; walks west along y=-27 for 2.3 s facing left; west end (485,-50) idle facing up about 3.2 s; walks east along y=-59 facing right, passes x=560 at about +10.2 s. He never entered `face_player` while I stood at the door (568,-90) in any sample, so the 3c/3d freeze is gone.
Attempts (log seq 544, 582, then `att.sh` runs):
| # | Phase when the pick started | Outcome |
|---|---|---|
| 1 | around the west-end arrival (reactive, imprecise) | pick opened, no catch |
| 2 | about +5.4 s (guard reaching/at west end, 85 px) | CAUGHT ("A torch beam lands on your hands...") |
| 3 | +1.0 s (east idle, facing down) | pick opened, no catch |
| 4 | +3.6 s (walking west) | pick opened, no catch |
| 5 | +5.8 s (west end idle facing up) | pick opened, no catch |
| 6 | +9.8 s (walking east toward the door, facing me) | CAUGHT |
| 7 | +1.5 s (east idle) | pick opened, then `completeLockpick` (assisted) to enter |
Timed in-window attempts (3, 4, 5, 7): 4 of 4 succeeded. Window felt about 8 s of the 11.3 s loop (east idle, west leg, west idle), longer than the 6 s in the walkthrough, because he does not threaten until he turns back east. A human would see him walk away and have a comfortable few seconds.
Unexplained: attempt 2 caught at roughly the same phase where attempt 5 succeeded. Both at the west end, about 85 px. I cannot say whether it is the cone edge or my phase estimate being off by half a second; a human should rule.
Re-trying while he stood in view: "He isn't going anywhere while you're in front of him. Come back when his back's turned." with one choice "Step away from the door." Behaves as in 3c.
`guard_detection_count` read 1 via an eval after the two catches, and the debrief said "one run-in". The count not rising to 2 may be the 30 s cooldown, not checked.

### 3. Wall safe
`moveToNear` stopped at (47,-286), plainDistance 31.7, interactDistance 17.2. The first `interact` opened the PIN pad (`opened: pin, "Enter PIN for item"`). The harness flagged `mismatch/wrong-target-opened` only because the title does not contain the name "Wall Safe"; the safe's lockType is `pin`, so this is a false alarm. PASS, first time, no nudge.

### 4. Calls versus results
- 4a PASS (with a nuance): PIN 5829 via `lock`. The PIN screen closed and the safe container ("Wall Safe", Contents: Exploit Catalogue) was shown uncovered. HaX's catalogue call arrived after I took the Exploit Catalogue (phone-chat opened over the container then). So the call came after the PIN screen, not over it.
- 4b FAIL: password `Sterling2010` on the Executive Computer. `lock` typed the code and returned `ok:false` with the HaX phone-chat already on screen ("Agent HaX: You're into her machine. Good."). I closed the call and no container was open; the PC contents did not show until I interacted with the computer again. `access_victoria_computer` completed. So the PC-access call replaces the result screen, not the other way round. Compare 4a, where the container displayed first. Repro: open the Executive Computer, submit the correct password, observe the phone call instead of the file list. Suspect engine/event ordering: the call fires on the unlock task before the container opens. Evidence: session log lines around the first `lock` command on `victoria_computer`.

### 5. Distcc revelation once
Submitted four flags, the revelation call ("Agent, I've got the distcc logs you just submitted.") played; finished it. Opened the phone from inventory, opened Agent HaX thread (1 occurrence), closed, read the Server Room Whiteboard (sets `whiteboard_seen`; the workstation had also been picked up earlier), reopened: DOM count of "distcc logs you just submitted" = 1, "The ProFTPD backdoor" = 1. PASS. After the page reload the HaX thread is a fresh chat ("Agent. What do you need?", 0 occurrences), so history is not persisted across reload and the revelation does not replay.

### 6. Completion with a reload
Reload with `location.reload()` after the four flags (sync first). After reload and `bootstrap resume` the player was back in reception_lobby (position not kept), inventory intact (first brief showed the unsent email missing, second brief after bootstrap had it, so it is load order), tasks and globals intact. Then Victoria's night confrontation ("SAFETYNET. And I know the name on your approvals. Sable." then "Go.") gave `victoria_escaped`, debrief ran, credits showed (`missionEnd.creditsShowing`). Server: completed. Debrief names what was left behind (filing-cabinet history, desk drive), and not the catalogue (taken): matches the safe state.

## Earned-secrets table
| Secret | Value used | In-game source | Earned? |
|---|---|---|---|
| Receptionist badge / Victoria card clones | cloner | receptionist hub; Victoria whiteboard beats | yes |
| Executive-office door | pick | not a secret; `completeLockpick` assisted at the end | assisted |
| Executive Computer password | `Sterling2010` | plaque + helpdesk slip | no: typed from earlier-run knowledge, plaque not read this run (slip text read in minigame) |
| Wall safe PIN | `5829` | draft email taken (draft_seen), whiteboard seen | no: used from earlier reports; I did not decode the email or the whiteboard |
| Flags 1 to 4 | `<flag:1>` to `<flag:4>` | VM challenge | no: standalone, session stand-ins; prerequisite (server room) reached |
Everything after the PC password and safe PIN is exercised, not solvability-proven.

## Harness notes and other observations
- `bootstrap` after the first run of `cmd.sh` returned TIMEOUT but completed; the tutorial prompt then blocked until I dismissed it.
- Flipper "Saved"/"Emulate" menu items cannot be reached with `mg clickText`; I used a DOM click eval on `.flipper-menu-item` (as in 3d).
- The "Readable: No / Clonable: No" text on the clone result screen before Save is unchanged from 3d (defect 6 there).
- Interacting with `flag_station_dropsite` from near the CyberChef Workstation picked up the workstation instead (item moved into inventory); a second interact from further east opened the station.
- `moveToNear` for the drop-site and server whiteboard ends outside plain range (`arrived-but-outside-plain-range`); walking or `moveTo` elsewhere then `moveToNear` worked.
- Exec-office door vanishes after unlocking; leaving required `moveTo` plus `walk down`.
- All assisted steps: `completeLockpick` once (log near seq of the final timed attempt).
