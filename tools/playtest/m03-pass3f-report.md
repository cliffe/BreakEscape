# m03 pass-3f final confirmation playtest

Question answered: plumbing and unexpected-behaviour probing (checks 1 to 4), not solvability.
Game 1246, headless, `--speed fast`. Session log: `tools/playtest/m03-pass3f-session.jsonl` (1236 lines). Flags XML: `tools/playtest/m03_ghost_in_the_machine-flags-game1246.xml`. Verify: `tools/playtest/m03-pass3f-verify-game1246.txt`. Screenshots: `m03-pass3f-dropsite.png`, `m03-pass3f-cyberchef.png`, `m03-pass3f-cyberchef-open.png`.
An earlier aborted game (1245, log `m03-pass3f-session-aborted-game1245.jsonl`) was abandoned after a harness-side hiccup (see notes) and is not part of the results.
Server record: status=completed, mission_concluded_at 2026-10-01 12:25:31 UTC (victoria_fate arrested, danny_fate protected).

## verify-run.rb (game 1246)
```
game            1246  (mission 47)
created         2026-10-01 12:10:23 UTC
last write      2026-10-01 12:25:46 UTC
played for      923s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, main_hallway, conference_room_01, executive_wing_hallway, danny_office, executive_office, server_room
unlocked objs   1: victoria_computer
inventory       8: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, Unsent email to the night team (raw source), CyberChef Workstation, Zero Day Transaction Log
NPCs met        9: briefing_cutscene, director_netherton, agent_nightshade, receptionist_npc, agent_0x99, closing_debrief, victoria_sterling, night_guard, danny_foster
flags submitted 4: (the four seeded stand-ins, <flag:1> to <flag:4>; literal values are in the verify txt)
globals set     24: briefing_played, clone_call_done, danny_evidence_seen, danny_fate, debrief_played, draft_seen, exec_office_entered, flag_distcc_submitted, flag_ftp_submitted, flag_http_submitted, flag_scan_submitted, knows_m2_connection, lockpicking_guide_offered, mission_phase, netexploit_guide_offered, night_confrontation_ready, pc_call_done, player_approach, reception_badge_cloned, time_of_day, victoria_arrested, victoria_card_cloned, victoria_choice_made, victoria_fate

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

## Results

| # | Check | Result |
|---|---|---|
| 1 | Victoria's PC: list stays open, HaX call only on opening email/roster | PASS (email path; roster path not exercised) |
| 2 | Guard window, 4 in / 1 out | PASS: 4 of 4 in-window picks uncaught; the deliberate outside pick was caught; plus one ambiguous edge attempt |
| 3 | CyberChef laptop vs drop-site | PASS |
| 4 | Danny visit, choice, completion, debrief | PASS for debrief; credits overlay does not mention Danny (see below) |

### 1. Victoria's PC
`lock` with the password on `victoria_computer` returned `ok:false` only because the minigame changed from `password` to `container`; the state afterwards was the container "Executive Computer" listing "Unsent email to the night team (raw source)" and "Client Roster". `access_victoria_computer` had left openTasks. After waiting about 4 s the container was still open and `brief` showed no phone-chat, no `pc_call_done`. I then took the unsent email: `draft_seen` and `pc_call_done` set and a phone-chat (Agent HaX) opened immediately, containing "Agent HaX: You're into her machine. Good." / "Client roster, transaction records, anything to the Architect." So the call fires on opening the email, not on the password. This is the reverse of 3e check 4b. The roster open was not tried (call is once-only, already fired). Log: search `"cmd":"lock","code"` for the first `victoria_computer` password, then `take` of "Unsent email".

### 2. Guard window
Method, disclosed: an in-page 50 ms interval records the moment `night_guard` crosses x=566 heading right (`window.__pass`, a passive read of `npcBehaviorManager.behaviors`). `att.sh D` waits in-page for the next crossing plus D seconds, then calls `interact` on the exec-office door, holds the lockpick minigame about 2.5 s, reads state, and closes it. The reported t is read after `interact` returned, so the pick started roughly 0.3 s earlier. Player at (566,-90), picked from the door, no watcher or LoS call, no catch-check API used.
Observed loop (one 14 s sample, 250 ms steps): crosses x=566 going east at about 2.8 s; east end (580,-32) facing down about 3.3 to 6.5 s; walks west along y=-27 facing left to about 9.5 s; steps up; arrives at west end (478,-59) facing right at about 10.5 s; dwells to about 13 s, then east again. Loop about 13 s. He never entered a face-the-player state.

| # | t after he passed the door going east (read after interact) | Guard | Outcome |
|---|---|---|---|
| 1 | 2.18 s (about 1.9) | east end, down | no catch |
| 2 | 1.58 s (about 1.3) | east end, down | no catch |
| 3 | 3.24 s (about 2.9) | east end, down | no catch |
| 4 | 5.02 s (about 4.7) | walking west at x=541 | no catch |
| 5 | 6.80 s (about 6.5) | x=470 turning up-left at west end | no catch |
| 6 | 8.62 s (about 8.3) | west dwell, facing right, 87 px from me | no catch within a 2.5 s hold (edge of window, see below) |
| 7 | 10.94 s (about 10.6), deliberately outside | west dwell, facing right | CAUGHT ("A torch beam lands on your hands, and on the pick in them."); `guard_grace` set |

Attempts 1 to 5 are in the window (4 required; 5 done): no catches. Attempt 7 is the outside one and was caught. Attempt 6 sits where the guard has just arrived at the west dwell facing the door; it was not caught in 2.5 s, whereas attempt 7, 2.3 s later in the same dwell, was. Consistent with the guard-side detection not firing instantly on arrival (or the window running to about 8.5 s rather than 7.8 s), but I cannot tell which: for a human to rule. After the catch `guard_detection_count` was 1 and the debrief said "one run-in", matching. After the catch the first door pick I retried was after visiting Danny's office (grace cleared), then done in-window with `completeLockpick` (assisted) to enter.

### 3. CyberChef laptop vs drop-site (server room)
- Drop-Site Terminal `flag_station_dropsite` at (262,-231): `interact` opened `FlagStationMinigame` titled "Drop-Site Terminal" ("Accepts flags from: ghost_in_machine_vm_network"). It went via the interaction menu (whiteboard at (261,-208) is the rival) and chose the right entry. Screenshot `m03-pass3f-dropsite.png`.
- CyberChef Workstation `cyberchef_workstation` at (145,-216): `interact` picked it up into the inventory (`item_removed_from_scene`, `item_picked_up`), it did not open the flag station. Clicking its inventory slot opened a `laptop-screen` titled "Crypto Workstation" holding the iframe `/break_escape/assets/cyberchef/CyberChef_v10.19.4.html`. Screenshots `m03-pass3f-cyberchef.png` (after pickup), `m03-pass3f-cyberchef-open.png` (laptop open).
- Positions are 117 px apart and `moveToNear` reached each from its own side with no cross-pickup, unlike 3e where interacting with the drop-site from beside the workstation picked up the workstation. This time the drop-site was approached from (248,-222) and worked first time; the workstation approached from (173,-222).

### 4. Danny and completion
- `danny_office` door at (368,32) was unlocked; Danny at (480,97). Interact opened his ink after approaching to 27 px (the first `moveToNear` stopped outside plain range; `moveTo` nearer then `moveToNear` worked).
- Chose "SAFETYNET. I'm investigating the St. Catherine's attack." then "Come in on your own. Testify against Sterling. I'll argue you were deceived." Result: `danny_fate = "protected"`, `danny_evidence_seen` true. `danny_protected` stayed false (the live state read showed false; probably a separate unused global, not checked in the ink).
- Four flags submitted at the drop-site, HaX revelation call, `night_confrontation_ready` set. Victoria in the conference room: chose SAFETYNET then "You're not walking out of here. Bag down." (`victoria_fate = arrested`, `victoria_choice_made`). Debrief ran (`debrief_played`), I took "This is for St. Catherine's" and "The fight goes on". Credits overlay (`creditsShowing`, closable false) came up; server status=completed.
- Debrief text on Danny: "Danny Foster. You gave him the way in and he took it -- came to us on his own last night. Cooperating fully. ... He won't be charged. But he'll carry it." That is the right line for fate protected. It also names the left-behind items correctly (filing cabinet history, wall-safe catalogue, desk drive). Not exercised: other Danny fates.
- The credits overlay text (`bv-stage`, 896 chars) contains no mention of Danny, so "the credits mention Danny's fate" is not borne out; the debrief does. Flag for the author if credits were meant to.

## Earned-secrets table
| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Receptionist badge clone | cloner | receptionist hub, "Lean across the desk" | before conference door | yes |
| Victoria card clone | cloner | whiteboard beats in the conference room | before server door | yes |
| Executive-office door | pick (assisted) | not a secret | after the timed attempts | assisted (`completeLockpick`) |
| Executive Computer password | `Sterling2010` | helpdesk slip (read in the password minigame) plus founding plaque in reception | slip read before use; plaque not read this run | no: year typed from earlier knowledge, plaque not read |
| Wall safe PIN | not used | | | not exercised |
| Flags 1 to 4 | `<flag:1>` to `<flag:4>` | VM challenge | | no: standalone stand-ins; prerequisite (server room, drop-site) reached |
Everything after the password and the flags is exercised, not solvability-proven. The wall safe, filing cabinet and Danny's other fates were not run.

## Defects, observations and harness notes
- No defects found in checks 1 to 4. Open for a human ruling: the guard edge case in attempt 6 above (uncaught 2.5 s into the west dwell, caught about 2 s later in the same dwell).
- Harness: `converse` on the receptionist with no `choices` ran 60 turns, took the "Lean across the desk" choice, and left an empty `.minigame-container` with the world blocked after the flipper Save (game 1245). I removed the element by eval and then the receptionist would not open (`no-effect-confirmed`), so I abandoned that game. Probably `converse` driving the dialogue past the point where the flipper opens (harness artefact); in 1246 I drove the dialogue by hand and the Save worked with narrator "The badge is in the cloner." Repro idea if a human wants to chase it: `converse` receptionist_npc with no choices, then `mg clickControl Save`.
- Flipper "Saved"/"Emulate" menu items still need a DOM click on `.flipper-menu-item`.
- `enter` fails with `no-known-doorway` when going back through a door recorded the other way (e.g. conference_room_01 to main_hallway); `moveTo` the doorway works.
- `walk` takes `direction`, not `dir`.
- Assisted actions: `completeLockpick` once; inventory slot click via DOM eval to open the CyberChef laptop; DOM eval of the flipper menu; eval to read guard position and globals (read-only); eval to remove the stuck container in game 1245 only.
