# m03 pass-3d playtest: both endings reached, checks pass

Questions answered: plumbing, plus ending/credits/debrief content. Not a solvability pass (flags are session-supplied, see table).
Headless, `--speed fast`. Walkthrough source: `scenarios/m03_ghost_in_the_machine/TESTING_WALKTHROUGH.md`.

## Games (2 counted, 4 abandoned)

| Role | Game | Session log | Result |
|---|---|---|---|
| **Recruit + stealth** (brief's Game 1) | 1236 | `tools/playtest/m03-pass3d-game4-session.jsonl` | status=completed, mission_concluded_at 2026-10-01 11:36:06 UTC |
| **Arrest, no drive** (brief's Game 2) | 1225 | `tools/playtest/m03-pass3d-game1-session.jsonl` | status=completed, mission_concluded_at 2026-10-01 11:04:48 UTC |
| abandoned | 1222 | same file as 1225 (first 79 commands) | harness error: `converse` closed the reception clone read before Save, so the badge was never saved |
| abandoned | 1230 | `m03-pass3d-game2-session.jsonl` | guard caught the pick (detection 1), so stealth was already lost |
| abandoned | 1233 | `m03-pass3d-game3-session.jsonl` | my script closed Victoria's clone read before Save; no way back (see defect 1) |

The log filenames do not match the game roles because I restarted several times. Game 1225 was reused as the arrest game: it had already lost stealth (detection 1), which does not matter there.

## verify-run.rb (full output)

Recruit game 1236 (`tools/playtest/m03-pass3d-verify-game1236.txt`):
```
game            1236  (mission 47)
created         2026-10-01 11:23:54 UTC
last write      2026-10-01 11:36:34 UTC
played for      761s of wall clock
current room    "reception_lobby"
unlocked rooms  6: reception_lobby, main_hallway, conference_room_01, server_room, executive_wing_hallway, executive_office
unlocked objs   3: executive_office_suitcase_2, victoria_computer, wall_safe_server
inventory       9: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, Zero Day Transaction Log, Hidden USB Drive, Unsent email to the night team (raw source), Exploit Catalogue
NPCs met        8: briefing_cutscene, director_netherton, agent_nightshade, receptionist_npc, agent_0x99, closing_debrief, victoria_sterling, night_guard
flags submitted 4: ...vm_network_1_4bb833, _2_cfc52b, _3_d173f0, _4_a2f482 (full strings in the verify file)
globals set     26: briefing_played, catalogue_seen, clone_call_done, debrief_played, draft_seen, exec_office_entered, flag_distcc_submitted, flag_ftp_submitted, flag_http_submitted, flag_scan_submitted, james_fate, knows_m2_connection, lockpicking_guide_offered, lore_catalogue_found, lore_directive_found, mission_phase, netexploit_guide_offered, night_confrontation_ready, player_approach, time_of_day, usb_seen, victoria_card_cloned, victoria_choice_made, victoria_fate, victoria_recruited, whiteboard_seen

VERDICT: progress recorded — 5 rooms beyond the first, 3 objects unlocked, 4 flags submitted.
```
Arrest game 1225 (`tools/playtest/m03-pass3d-verify-game1225.txt`):
```
game            1225  (mission 47)
created         2026-10-01 10:49:36 UTC
last write      2026-10-01 11:05:15 UTC
played for      938s of wall clock
current room    "reception_lobby"
unlocked rooms  5: reception_lobby, main_hallway, conference_room_01, server_room, executive_wing_hallway
unlocked objs   0:
inventory       6: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, Zero Day Transaction Log
NPCs met        8: briefing_cutscene, director_netherton, agent_nightshade, receptionist_npc, agent_0x99, closing_debrief, victoria_sterling, night_guard
flags submitted 4
globals set     20: briefing_played, clone_call_done, debrief_played, flag_distcc_submitted, flag_ftp_submitted, flag_http_submitted, flag_scan_submitted, james_fate, knows_m2_connection, lockpicking_guide_offered, mission_phase, netexploit_guide_offered, night_confrontation_ready, player_approach, time_of_day, victoria_arrested, victoria_card_cloned, victoria_choice_made, victoria_fate, whiteboard_seen

VERDICT: progress recorded — 4 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
```
Server record (my own runner, game record): both `status=completed` with `mission_concluded_at` set (times above).

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Founding year (for password) | 2010 | Company Founding Plaque, reception | game 1236 log seq ~120 | yes |
| Reception badge clone | cloner card | Receptionist hub "Lean across the desk", flipper Read then Save | before conference door | yes |
| Victoria's Executive Keycard | cloner card | whiteboard keep-talking beats, flipper Save | before server door | yes |
| Executive Computer password | `Sterling2010` | plaque + helpdesk slip text in the minigame | exec office, game 1236 | yes |
| Executive-office door | pick | not a secret | game 1236 seq 701-706 | **assisted** (`completeLockpick`) |
| Wall safe PIN | `5829` | draft "Unsent email to the night team" taken from the PC (draft_seen=true) | game 1236 seq ~830 | **no**: I used the code from the walkthrough; the draft was opened but not decoded (brief said not to decode) |
| Server whiteboard | read by eye | Server Room Whiteboard (ROT13) | both games | read yes, not decoded |
| Hidden USB Drive | taken and registered (`usb_seen`, `lore_directive_found` true) | Desk Drawer, exec office | game 1236 seq 721 | yes, not decoded |
| Flags 1 to 4 | `<flag:1>`..`<flag:4>` | VM challenge | submitted at the Drop-Site Terminal in both games | **no**: standalone has no VM, so stand-in values |

Boundary: everything past the flag submissions is exercised but not solvability-proven. The safe PIN was not earned in this run.

## Game 1 (1236): stealth + recruit

Fate: recruited. Globals at end: `victoria_fate=recruited`, `victoria_recruited=true`, `usb_seen=true`, `lore_directive_found=true`, `catalogue_seen=true`, `lore_catalogue_found=true`, `draft_seen=true`, `roster_seen=false`, `guard_detection_count=0`, `exec_office_entered=true`, `guard_knocked_out=false`, `victoria_choice_made=true`, `debrief_played=true`, `james_fate=""`.

Credits text (captured line by line from the DOM, `m03-pass3d-recruit-credits-lines.txt`; screenshot `m03-pass3d-recruit-credits.png`):
```
MISSION COMPLETE / GHOST IN THE MACHINE
ZERO DAY SYNDICATE: COMPROMISED — from the inside
ST. CATHERINE'S LINK: PROVEN — ProFTPD exploit traced to GHOST
ZERO DAY CATALOGUE: IN SAFETYNET HANDS — vendors quietly warned
── DECISIONS ──
VICTORIA STERLING: TURNED — a cold asset now, not a convert
PERFECT STEALTH — never detected by security
THE ARCHITECT: identity still unknown. Phase 2 looms.
ENTROPY: Still operational. The hunt continues.
```
Debrief (full text in log, `m03-pass3d-game4-session.jsonl`, brief dialogue lines from seq ~1050): opens "the guard never logged you once. In and out like you were never there"; "And now she's ours"; "Zero Day doesn't know it's been read."; "Victoria Sterling is our asset."; "Phase 2 targets are being hardened, quietly. The cells that lean on Zero Day's supply still think it's safe." The catalogue line: "The catalogue gets folded into routine advisories over the next few months, a product at a time, so nothing points back at her."

| Check | Result |
|---|---|
| Zero guard detections | PASS (0; see method below) |
| Executive office entered without KO | PASS (`exec_office_entered=true`, `guard_knocked_out=false`) |
| USB drive opened | PASS (`usb_seen=true`) |
| Four flags submitted | PASS |
| Night confrontation offered the recruit option | PASS ("I have the Phase 2 directive from your desk. Give me the Architect, and I'll fight for a deal." appeared as option 1; the first choice also offered "Phase 2. Critical Mass. The grid..."; "Work for us." was absent) |
| status=completed, mission_concluded_at | PASS |
| Perfect Stealth credit | PASS |
| Recruited debrief has no "EXPOSED" or "scrambling" | PASS (neither string appears) |
| Catalogue lines match safe state (safe opened) | PASS: credits "IN SAFETYNET HANDS — vendors quietly warned"; debrief says it is being folded into advisories |

Method for 0 detections (disclose): the guard stops patrolling and faces you whenever you are within 96px (`facePlayerDistance`), and the lockpick catch is a synchronous LoS check at `interact` (range 150, 120 degrees). I installed an in-page watcher via `eval` that fires the real `__test.interact` on the door the first frame the engine's own `shouldInterruptLockpickingWithPersonChat` returns null and the guard is at least 98px away. This used the game's own check as an oracle. The pick minigame opened, then `completeLockpick` (assisted). Entering the corridor while the guard walks west makes the window; see defect 2.

## Game 2 (1225): arrest, no drive

Fate: arrested. Globals at end: `victoria_fate=arrested`, `victoria_arrested=true`, `victoria_recruited=false`, `usb_seen=false`, `lore_directive_found=false`, `catalogue_seen=false`, `lore_catalogue_found=false`, `guard_detection_count=1` (I was caught at the exec door and chose "Sorry. Wrong door."), `exec_office_entered=false`, `victoria_choice_made=true`, `debrief_played=true`.

Credits: captured only two lines (the poller started after the credits had begun scrolling): `ZERO DAY CATALOGUE: SEIZED WITH THE MARKETPLACE — but not in our hands` (screenshot `tools/playtest/m03-pass3d-arrest-credits.png`) and `ENTROPY: Still operational. The hunt continues.` The other lines (EXPOSED, ARRESTED, no Perfect Stealth) were not observed; by the scenario's conditions they should show but I did not confirm them in this game.

Debrief lines: "Security flagged one run-in with the guard. You recovered, but you left a mark on the log."; "Victoria Sterling is in custody."; "Her lawyers are already reaching for 'information freedom'..."; "You left some of the paper behind. What you brought out is enough to prosecute and enough to warn people."; "Here's where it stands. Zero Day's exploit line is exposed." / "Victoria Sterling is in custody." / "Phase 2 targets are being hardened. The cells that leaned on Zero Day's supply are scrambling."

| Check | Result |
|---|---|
| "Work for us." refused once, then gone | PASS. Seq 1071 in the 1225 log: she said "In exchange for what? You haven't even taken what you'd be asking me to betray." / "Still one move. Choose it." and the choice list became "Bag down" / "Go" only |
| Arrest completes the mission | PASS (status=completed) |
| Credits catalogue line for arrested, no safe | PASS ("SEIZED WITH THE MARKETPLACE — but not in our hands") |
| Debrief "arrested" content | PASS ("in custody", "scrambling" present as expected for a non-recruit ending) |
| HaX nudged about the drive before the confrontation | PASS, two places in the phone: right after the distcc flag ("Pull the rest while you're standing in it. The catalogue, the roster, the drive in her desk.") and, on asking "How do I play this?", "If it's the deal you want, bring her something she can't shrug off. The drive in her desk." (log seq ~881). Both came from the player opening the phone or the revelation call, not an unprompted call. |

## Defects and oddities (observed, not classified as engine bugs)

1. **Closing the flipper before Save loses the clone with no way back.** Victoria's keycard (and the receptionist badge) clone from a one-shot ink tag. Closing the Read screen before pressing Save leaves "No saved cards" for good: reception hub option and Victoria hub no longer offer another read (game 1222 and 1233). Repro: during the whiteboard keep-talking beats, close the RFID minigame (Cancel or `mg close`) before Save, finish talking. The task `clone_rfid_card` still ticks, so the player is told the clone is done and finds the server door cannot be opened. I did not test whether a reload recovers it. Suspect design gap; a human should rule.
2. **Guard freezes and faces the player within 96px.** At the exec office door the player stands about 28px from the door, which is inside 96px of the guard's patrol for most of his loop. He stops walking and faces you, so `shouldInterruptLockpickingWithPersonChat` is true and the pick is caught. Repro: stand at the door at (567,-90) with the guard anywhere on x>=500; interact; "Oi. Away from the door. Now." (games 1225 and 1230, both caught). The only clean window is arriving from the west while he is on his westbound leg and standing at x>=599 so he is beyond 96px. A human player is unlikely to find this window without the watcher. 3b already recorded the catch behaviour; this explains why it is so hard to avoid.
3. **Wall safe interaction range.** `moveToNear` stops 33.4px from the safe (plain range cap is 32), so the first interact does nothing; I had to nudge with `walk` and `moveTo`. This is a harness/collider matter; not diagnosed.
4. **Revelation call appears twice in the HaX phone history** (game 1225): the "Agent, I've got the distcc logs you just submitted" block shows twice in the thread. Not diagnosed.
5. Recruited debrief says "You left some of the paper behind" although the safe, the drive and the draft were all taken. The roster and exec filing cabinet were not opened, so it is true, but a player who got the catalogue and the drive may read it as inaccurate.
6. The Sterling clone gives "Reading ... Readable: No / Clonable: No" on the result screen before Save, for both cards, which reads as failure although Save succeeds.
7. Exec-office door: after entering, `room`/`enter` cannot go back (door vanished and doorway unknown); walking right then down from the office door works. The executive hallway to main hallway route needed `moveTo` through the doorway rather than `enter`.

## Harness notes

- `converse` closes the RFID flipper opened by a clone tag; do not use it on the clone options. Drive the choice with `mg choose`, wait until the flipper text contains "Clonable", then `clickText Save`.
- Another agent's scratchpad file overwrote my helper once; I used `p3d.sh`.
- Brief text: `playtest-scenario` says debrief text is in the log; the dialogue lines above were extracted from `brief` results in the logs.
