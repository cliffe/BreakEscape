# E11 regression: eventMapping `sendTimedMessage` delay now counts from the event

Questions answered: plumbing (does every timed text arrive when it should) and a little unexpected behaviour (lanyard taken fast versus not taken). Not a solvability run.

- Headless, Rails server left alone, nothing edited outside `tools/playtest/e11-regress-*`.
- m01 game **1237**, log `tools/playtest/e11-regress-m01-session.jsonl` (303 commands). Reached `completed`.
- m02 game **1240** (full run, check 4 lanyard-taken branch, checks 5 and 6), log `tools/playtest/e11-regress-m02a-session.jsonl` (2529 commands). Reached `completed` (`mission_concluded` fired, debrief closed).
- m02 game **1239** (check 4 lanyard-not-taken branch, stopped after the Gary scene), log `tools/playtest/e11-regress-m02b-session.jsonl` (297 commands).
- Flags XML per game: `tools/playtest/m01_first_contact-flags-game1237.xml`, `m02_ransomed_trust-flags-game1239.xml`, `m02_ransomed_trust-flags-game1240.xml`. Screenshots: `e11-regress-m02-f3-phonechat.png`, `e11-regress-m02-f3-phonechat-2.png`.
- Source for the route: m01 `tools/playtest/m01-trace.md` (no walkthrough exists), m02 `TESTING_WALKTHROUGH.md`. Mapping list and expected delays: `tools/playtest/e11-timed-message-audit.md`.

## How the timings were taken

The bridge log has no event for "text arrived". After bootstrap I wrapped `npcManager._deliverTimedMessage` and `eventDispatcher.emit` in the page (`eval`, logged in the session logs; both wrappers call straight through and change nothing) to stamp each delivery and each game event with `performance.now()`. All times below are seconds after the triggering event, from those stamps.

Delivery runs on the manager's 1 s tick, so a text arrives at `delay` plus 0 to 1 s. Every number below sits in that window; none arrived early. The hook also records `skip` (the `skipIfGlobal` global was truthy at delivery) and whether a minigame was open at the moment of delivery (`mg`).

## Results

| # | Check | Result | Timings (event to arrival) |
|---|---|---|---|
| 1 | m01 SSH flag: "You have SSH access" before "decryption key confirmed" | **PASS** on order, with a caveat | `ssh_flag_submitted` at 237.225 s. "You have SSH access" at +2.66 s (delay 2000), "ENTROPY archive decryption key confirmed" at +2.67 s (delay 2500). Same 1 s tick, 1 ms apart, SSH first. Order is right, but the 0.5 s gap in the data is not visible to the player: both barks land together over the open archive minigame |
| 2 | m01 other sequences in order | **PASS** | `entropy_reveal_read` 275.924 s: "That's the full picture" +2.98 s (2500), then "All intelligence secured" +3.99 s (3000 from the aim event). `sudo_flag_submitted` 310.529 s: "Encoded deployment intel" +2.36 s (2000), then "All technical flags secured" +3.36 s (3000). `derek_confronted` 371.861 s: "Derek is contained" +1.06 s (1000); `item_picked_up:launch-device` 372.010 s: "You have the launch device" +1.88 s (1500). Singles: `linux_flag_submitted` +1.77 s (1500), `room_entered:server_room` +1.34 s (1000), `item_picked_up:lockpick` +1.54 s (1000), `attack_aborted` +2.73 s (2000) |
| 3 | m01 text lands badly on a chat | **PASS, nothing bad** | Texts at +2.4 to +3.4 s arrive over an open flag-station minigame (`mg=True`) for check 1, `linux`/`sudo` flags and abort. That is the same as the old ~1 s behaviour, only later. Kevin's chat closed 30 ms before the lockpick text; Derek's scene closed 0.15 s after the event and both texts arrived after it. No text hit a person-chat or phone-chat in m01 |
| 4a | m02 lanyard taken within 11 s: "get a real staff lanyard" does not arrive | **PASS** (game 1240) | `talk_to_gary` completed 156.971 s. Lanyard picked up in the same scene at 161.384 s (+4.41 s, `cover_restored`). The 4000 text ("Stop. Listen to me carefully") arrived +4.83 s. "That'll hold" and "Blank contractor pass" arrived +5.83 s. The 11000 text reached `_deliverTimedMessage` at +11.83 s with **`skip=True`** and was dropped before it was written to history or barked |
| 4b | not taken: the text arrives about 11 s later | **PASS** (game 1239) | `cover_burned` / `talk_to_gary` at 220.613 s. The 4000 text arrived +4.46 s. The 11000 text arrived at +11.46 s with `skip=False`. The Gary chat was still open (I left it open), so the bark was deferred to chat close, as designed |
| 5 | staggered 1800/3600 and 1800/4200/5600 | **PASS** | `access_server_room` (event ~234.02 s, from `scanning_guide_offered` being set by its handler): +2.78 s (1800), +3.78 s (3600). `submit_ssh_flag` 286.950 s: +1.85 s (1800), +4.85 s (4200), +5.85 s (5600). In order both times |
| 6 | m02 text lands badly on a chat | **PASS with one known low flag (F3)** | See below |
| G | no console errors from npc-manager | **PASS, with a coverage caveat** | The hook captured `console.error` and `window` errors after bootstrap in all three games. None appeared in the batches I read unfiltered. Some batches were read through a grep that kept only MSG/global lines, so an error in those windows would not have shown. Final batch of game 1240 (grepped for ERR/CERR) was empty. The server log was not read |
| G | mission completes | **PASS** | m01 and m02 both `status = completed` on the server |

### Other sequences in m02, all in order and at or above their delays

`sign_in_at_reception` +1.6 s (1500). `read_handover_board` +2.18 s (1500). `room_entered:server_room` +1.87 s (1000). `object_interacted` VM launcher ~+2.0 s (1200). `submit_ghost_log_flag` 404.444 s: "full backdoor chain" +2.38 s (1500), then "Ghost's log names the badge" +3.36 s (2600). `submit_database_flag` 379.645 s: "backup logs show it" +3.17 s (2500); manifest pickup 380.009 s: "drop-site's cut you a restore manifest" +6.79 s (6000). `entropy_key_material` pickup +1.52 s (1500). `make_ransom_decision` (event 448.2 s): "Decision logged" +2.61 s (2000), "Recovery decision logged" +3.61 s (3000). `meet_dr_kim` +1.7 s (1500), arrived mid-Kim-chat and was held to chat close. `inspected_asset_post` +2.95 s (2000). Not exercised: the four 9000 ms Dr Kim texts (their `advised_board_*` conditions were never set on this route), the Reeves badge texts at 4200, and every m01 mapping not named above.

### Check 6 detail

- **Person-chat.** "Reminder on the doors" (6000, after the briefing cutscene closes) landed while Bernie's chat was open and was deferred. "Signed in" (+1.6 s) too. The three server-room texts (1000, 1800, 3600) all landed while Val's `on_server_room_access` chat was open (`mg=True`) and were held, so the player reads all three in order after the chat closes. `meet_dr_kim` text deferred during Kim's chat. Nothing reads badly. The deferral works the way the audit describes.
- **Phone-chat (F3, confirmed).** Submitting flag 3 opens Ghost's phone-chat. "The backup logs show it" arrived +3.17 s and "restore manifest" +7.15 s while the Ghost chat was open (`mg=True`). `e11-regress-m02-f3-phonechat-2.png` shows two green HaX bark cards stacked down the left edge, newest on top, beside the Ghost chat panel. They do not cover Ghost's text, but they do appear mid-call, and the newest card sits above the older one. Same as the audit's F3, one second later than before. A player will read it as HaX cutting in. Low severity, as the audit says.
- The first screenshot (+3.2 s) was taken a moment before the card arrived; it shows the two "Task Complete" toasts over the chat header only.

## Reads worse than before

Nothing clearly worse. Two things to know:

1. **m01 SSH pair (check 1).** The order is fixed, but because both are on the same 1 s tick the two barks appear together. If the point of the 2.5 s change was a visible "SSH, then reward" beat, 3000 for the key text would give a visible gap (a 1 s tick cannot resolve 500 ms).
2. **m02 cover-burned alert (not asked, observed).** Take the lanyard 4 s after the card handover (game 1240) and the 4000 text "Stop. Listen to me carefully. Two minutes ago someone rang..." (the alert) still arrives, 0.4 s after the lanyard pickup, then "That'll hold" 1 s later. It reads as alert then fix, which is fine, but it is a stale warning if the lanyard comes in under 4 s. It has no `skipIfGlobal`; tell me if you want that checked.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| m01 Main Office Key | (item) | Sarah O'Brien dialogue | m01 session log, early | yes |
| m01 IT room PIN | `2468` | Reception Desk Phone voicemail (Kevin) | before the IT door | yes (read from the voicemail text) |
| m01 Server Room Keycard, Lock Pick Kit | (items) | Kevin Park dialogue | before server-room door | yes |
| m01 `shatter_server:flag_1` (SSH, archive) | `<flag:1>` | My Passwords list in Derek's storage safe, then VM challenge | **password list never opened**; no VM in standalone | **no** |
| m01 flags 2, 4 (drop-site) and 3 (launch code) | `<flag:2>`, `<flag:4>`, `<flag:3>` | VM challenges | none | **no** |
| m02 IT Department Override Key | (item) | Bernie Nwosu dialogue | early in each game | yes |
| m02 Server Room Keycard | (item) | Gary Whitlock dialogue, rapport route | game 1240 and 1239 | yes |
| m02 Boardroom PIN | `0417` | Dr. Kim's Desk Diary (read in game, text contained 0417) | before the boardroom door | yes |
| m02 flags 1 to 4 | `<flag:1>` to `<flag:4>` | VM challenges (SSH with `Hospital1987`, ProFTPD, backup, Ghost log) | none | **no** |

Rows marked `no` are the boundary: the flag-gated steps were exercised through the real flag station, but nothing about their solvability was tested. This run's questions (timing) do not depend on that.

No assisted actions were used: no `debugKO`, no `completeLockpick`. Every door and lock went through the real minigame via `lock` (key or code). Dialogue was driven by choosing options by pattern or by taking the first or last listed choice in hubs, so my branch choices in Ghost, Kim and the HaX debrief were arbitrary.

## verify-run.rb output

### game 1237
```
game            1237  (mission 32)
last write      2026-10-01 11:50:08 UTC
played for      421s of wall clock
current room    "reception_area"
unlocked rooms  5: reception_area, main_office_area, it_room, server_room, break_room
unlocked objs   2: main_office_area_bin_3, entropy_encrypted_archive
inventory       11: Your Phone, Notepad, Visitor Badge, Main Office Key, Maintenance Checklist, Lock Pick Kit, Server Room Keycard, Lock Pick Instructions, Operation Shatter: Architect's Authorization, ENTROPY Network Architecture, ENTROPY Launch Device
NPCs met        6: briefing_cutscene, sarah_martinez, agent_0x99, closing_debrief_person, kevin_park, derek_lawson
flags submitted 4: flag{m01_first_contact_shatter_server_1_de6e74}, flag{m01_first_contact_shatter_server_2_1d7348}, flag{m01_first_contact_shatter_server_4_954a8b}, flag{m01_first_contact_shatter_server_3_9c9d60}
globals set     21: briefing_played, confrontation_approach, current_task, derek_confronted, derek_knows_safetynet, entropy_reveal_read, final_choice, has_lockpick, kevin_choice, launch_code_submitted, linux_flag_submitted, lockpicking_guide_offered, maya_identity_protected, player_aborted_attack, player_name, priv_esc_guide_offered, ready_for_debrief, server_room_entered, ssh_flag_submitted, sudo_flag_submitted, talked_to_kevin

VERDICT: progress recorded — 4 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
```

### game 1239
```
game            1239  (mission 46)
last write      2026-10-01 11:55:03 UTC
played for      279s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, staff_room, it_department
unlocked objs   0: 
inventory       5: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Server Room Keycard
NPCs met        13: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, gary_whitlock
flags submitted 0: 
globals set     14: backup_recovery_source, bernie_gave_key, bernie_trusts_player, briefing_played, cover_burned, gary_trusts_player, gave_keycard, insider_evidence_partial, lockpicking_guide_offered, patient_bed2_state, patient_bed4_state, player_name, ransomware_deployed, read_handover_board

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

### game 1240
```
game            1240  (mission 46)
last write      2026-10-01 12:14:45 UTC
played for      1179s of wall clock
current room    "reception_lobby"
unlocked rooms  12: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, staff_room, it_department, security_office, server_room, dr_kim_office, conference_room
unlocked objs   1: entropy_staging_cache
inventory       9: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Server Room Keycard, Spare Contractor Lanyard, Verified Restore Manifest, ENTROPY Key Material, Visitor Badge (Countersigned)
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, gary_whitlock, security_guard_patrol, dr_sarah_kim, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_1063c8}, flag{m02_ransomed_trust_hospital_backup_server_2_582b6c}, flag{m02_ransomed_trust_hospital_backup_server_3_2ca033}, flag{m02_ransomed_trust_hospital_backup_server_4_b4285c}
globals set     43: backdoor_fully_exploited, backup_recovery_source, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, briefing_played, cover_burned, cover_restored, debrief_played, dr_kim_met, exploitation_guide_offered, exposed_hospital, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, found_boardroom_code, gary_trusts_player, gave_keycard, ghost_key_material_obtained, insider_badge_id_found, insider_db_window_found, insider_identified, inspected_asset_post, kim_guilt_revealed, lockpicking_guide_offered, mission_complete, network_isolated, paid_ransom, patient_bed2_state, patient_bed4_state, player_name, privesc_guide_offered, ransom_decision_acknowledged, ransom_decision_made, ransomware_deployed, restore_manifest_obtained, scanning_exploitation_guide_offered, scanning_guide_offered, ssh_guide_offered, staff_lanyard_obtained, vulnerability_guide_offered, ward_recovering

VERDICT: progress recorded — 11 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Server status read after each run: game 1237 `completed`, game 1240 `completed`.
