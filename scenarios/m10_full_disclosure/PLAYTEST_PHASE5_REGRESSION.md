# m10 Full Disclosure: phase 5 playtest, round 2 (regression)

Browser run, 2026-10-22 to 23, keyless :3001, headless Chromium (load average 18 to 20 throughout), Node from the Playwright cache. Persona: a careful returning player who knows the season and tries every option and route. Skill: playtest-scenario. Edited no repo file except this report; nothing committed; :3000 untouched; every session stopped.

This run answers questions 1 and 2 (plumbing on the intended routes, and what happens off them). It is not a solvability pass: the four VM flags are stand-ins.

## Commits

HEAD moved while I played (other agents committing), so the games were not all made on one commit. The m10 files changed between them only in the VM-gating text.

| Game | Id | Made at | What |
|---|---|---|---|
| A | 3756 | 0a1fa3007 | Mixed save, full run, lethal ending ("Fire."), credits read in full |
| B | 3758 | 1a97b76b4 | Rich save, full run, lethal by mistake (my picker defaulted to "Stop it."), 06:00 hub and credits read. Extra data, not one of the two required runs |
| C | 3775 | 919524c0e | Rich save, full run, Join ending, credits read in full |
| S1 | 3802 | ef267b2f1 | Cold start, briefing only: Netherton's "[Let me think about it.]" |
| S2 | 3804 | ef267b2f1 | Cold start, power room: HaX as the isolator voice |
| S3 | 3805 | 31fd232d8 | Elena (turned), power room: Elena as the isolator voice |

Between 0a1fa3007 and later HEADs the erb changed the staging card ("monitoring host"), and the tag and Core Access Code now start with a "Host:" line ("the monitoring host on your VM list", "the core host on your VM list"). A saw the older wording, C the newer. HEAD at the end was 4ccc6ffe2 (erb +28 lines against 0a1fa3007); I did not replay against it.

## Evidence

Scratch and helper scripts: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10_regress/` (call it `$S`).

| Game | Session log | Command lines | Verifier | Credits dump |
|---|---|---|---|---|
| A | `$S/A.jsonl` | 2290 | `$S/verify_A.txt` | `$S/A_credits.txt` (43 labels) |
| B | `$S/B.jsonl` | 1708 | `$S/verify_B.txt` | `$S/B1_credits.txt` (45) |
| C | `$S/C.jsonl` | 1522 | `$S/verify_C.txt` | `$S/C_credits.txt` (36) |
| S1, S2, S3 | `$S/S1.jsonl`, `S2.jsonl`, `S3.jsonl` | 270, 102, 102 | none (short checks) | n/a |

Saves: `$S/mixed.json` (A) and `$S/rich2.json` (B, C).

- Mixed: m01 to m09 finished; Gary protected; Victoria arrested; Voltage captured; no Vance; no pipeline list; Nightshade arrested; Noor told; Albion not notified; raid-team answer Quintero.
- Rich: m01 to m09 finished; Gary protected; Victoria recruited; Voltage escaped with Static; Vance an ally; Elena turned; pipeline list found; assets seized; Nightshade triple agent; Noor told; Albion notified; raid-team answer Kowalczyk.

Harness notes: KOs by `debugKO` (combat not played); lockpicks by `completeLockpick` (assisted); flags typed at the real stations, so the station events fired (not `--submit-flag`). Stand-in strings used: `flag{m10_monitoring_foothold}`, `flag{m10_staging_schedule}`, `flag{m10_container_escape}`, `flag{m10_core_host}`. No VM document was opened.

### Verifier output, game A

```
game            3756  (mission 85)
created         2026-10-22 22:52:37 UTC
last write      2026-10-22 23:25:14 UTC
played for      1958s of wall clock
current room    "forward_post"
unlocked rooms  8: forward_post, blast_tunnel, security_office, workshop_floor, power_room, server_hall, gallery, core
unlocked objs   1: fitter_locker
inventory       12: Your Phone, CyberChef Workstation, Lock Pick Kit, RFID Cloner, Fingerprint Kit, PIN Cracker (Kowalczyk's), Notepad, Maintenance Tag, Spare Power-Room Card, Operator's Duty Sheet, Schedule Copy Sign-in Card, Core Access Code
NPCs met        75: director_netherton, hax_post, agent_0x99, nightshade_table, nightshade_van, nightshade_blast, kowalczyk_post, kowalczyk_van, quintero_post, arakawa_post, arakawa_gate, arakawa_blast, minder_blast, malhotra_post, vector_post, phantom_post, minder_post, voltage_van, ghost_phone, victoria_line, vance_phone, elena_phone, six_oclock, hearing, citadel, imran_voice, gary_voice, wendell_voice, tesseract_voice, tunnel_guard, tunnel_guard_kettle, duty_guard, duty_guard_b, vector_so, kowalczyk_so, arakawa_so, quintero_so, imran, imran_watched, gary_consultant, gary_tech, workshop_guard, kowalczyk_ws, arakawa_ws, quintero_ws, wendell, wendell_far, voltage_power_captured, voltage_power, static_power, kowalczyk_pr, arakawa_pr, quintero_pr, asante, mercer, hall_guard_a, hall_guard_b, kowalczyk_hall, arakawa_hall, quintero_hall, victoria_gallery, victoria_threat, vos, lock_guard, monitor_guard, farah_guard, reinforcement_a, reinforcement_b, quintero_lock, minder_lock, nightshade_lock, tesseract, kowalczyk_core_waiting, kowalczyk_core, quintero_core
flags submitted 4: flag{m10_monitoring_foothold}, flag{m10_staging_schedule}, flag{m10_container_escape}, flag{m10_core_host}
globals set     140: accused, arakawa_call_done, asante_outcome, aside_done, backdoor_channel_live, blast_tunnel_entered, breach_announced, breach_open, briefing_done, briefing_played, case_heard, close_cell_name, close_cells, close_human, close_secure_cell, close_zero_day, closing_done, clue_alibi, clue_bench_log, clue_door_log, console_choice, core_entered, core_greeted, database_outcome, door_log_given, door_scene_done, ending, engine_tutorial_declined, exchange_1, exchange_2, exchange_3, flag1_submitted, flag2_submitted, flag3_submitted, flag4_heard, flag4_submitted, forward_post_entered, gallery_entered, gallery_open, gallery_shutter_cut, gary_outcome, gate_console_used, ghost_answer, ghost_call_done, ghost_gift, ghost_sale, guide1_offered, guide3_offered, hax_asked_database, hax_rest_promised, head_start_killed, head_start_out, imran_outcome, inner_door_open, kowalczyk_answer, m01_completed, m01_final_choice, m02_completed, m02_gary_protected, m02_reeves_fate, m03_completed, m03_victoria_fate, m04_completed, m04_disclosure_choice, m04_voltage_captured, m05_completed, m05_entropy_program_exposed, m05_final_choice, m06_completed, m06_satoshi_stance, m07_completed, m07_debrief_stance, m07_elena_outcome, m07_hollis_resolved, m07_mercer_fate, m07_team_assignment, m08_completed, m08_nightshade_arrested, m09_cage_bin, m09_completed, m09_deck_pulled, m09_hax_confession_answer, m09_kowalczyk_reply, m09_memo_stance, m09_noor_told, m09_raid_team_answer, m09_reading_finished, m09_recruiter_offer, m09_recruiter_secret, m09_sorensen_fate, m09_tran_outcome, media_story_ran, night_closed, nightshade_deal, officer_out, outer_lock_open, pair_back, partial_release, phantom_on_team, power_room_entered, quintero_enters_core, quintero_recalled, quintero_stance, quintero_wounded, raid_clock, security_office_entered, server_hall_entered, share_resale, share_zero_day, shutter_text_sent, six_done, six_open, split_started, stair_open, tess_db_costs_said, tess_db_greeted, tess_end_said, tess_lesson_said, tess_loose, tess_loose2_said, tess_pitch_said, tess_rec_albion, tess_rec_derek, tess_warned, trace_loss_told, vector_on_team, victoria_gallery, victoria_line_deal, victoria_line_done, voltage_outcome, vos_outcome, vos_secret_known, vos_secret_used, wendell_outcome, whodunit_live, whodunit_open, workshop_entered, wren_at_core, wren_entering, wrong_accusation
tasks           26 in objectivesState, 25 completed
  hear_him_out                       "completed"  at 2026-10-22T23:11:34Z
  submit_flag_1                      "completed"  at 2026-10-22T22:56:26Z
  submit_flag_2                      "completed"  at 2026-10-22T23:04:38Z
  submit_flag_3                      "completed"  at 2026-10-22T23:06:24Z
  submit_flag_4                      "completed"  at 2026-10-22T23:10:03Z
  decide_his_end                     "completed"  at 2026-10-22T23:12:43Z
  close_the_night                    "completed"  at 2026-10-22T23:13:55Z
  cut_the_shutter                    "completed"  at 2026-10-22T23:02:18Z
  use_the_console                    "completed"  at 2026-10-22T23:05:52Z
  check_the_alibis                   "completed"  at 2026-10-22T22:58:46Z
  name_the_sleeper                   "completed"  at 2026-10-22T22:58:28Z
  reach_power_room                   "completed"  at 2026-10-22T23:01:32Z
  settle_the_table                   "completed"  at 2026-10-22T22:54:41Z
  cross_the_gallery                  "completed"  at 2026-10-22T23:07:08Z
  reach_server_hall                  "completed"  at 2026-10-22T23:02:42Z
  read_the_door_log                  "completed"  at 2026-10-22T22:57:33Z
  take_the_briefing                  "completed"  at 2026-10-22T22:53:06Z
  answer_the_handset                 "completed"  at 2026-10-22T22:59:51Z
  close_the_backdoor                 "active"
  decide_the_console                 "completed"  at 2026-10-22T23:11:37Z
  read_the_bench_log                 "completed"  at 2026-10-22T23:00:16Z
  decide_the_database                "completed"  at 2026-10-22T23:12:28Z
  open_the_outer_lock                "completed"  at 2026-10-22T23:07:21Z
  take_the_stair_down                "completed"  at 2026-10-22T23:00:09Z
  reach_security_office              "completed"  at 2026-10-22T22:57:15Z
  go_through_the_blast_door          "completed"  at 2026-10-22T22:56:43Z
tasks_completed 25
score           93
social scenario false (completed tasks do not count; pass --tasks to count them)

VERDICT: progress recorded — 7 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Verifier output, game C

```
game            3775  (mission 85)
created         2026-10-22 23:30:19 UTC
last write      2026-10-22 23:48:16 UTC
played for      1078s of wall clock
current room    "forward_post"
unlocked rooms  8: forward_post, blast_tunnel, security_office, workshop_floor, power_room, server_hall, gallery, core
unlocked objs   0: 
inventory       10: Your Phone, CyberChef Workstation, Lock Pick Kit, RFID Cloner, Fingerprint Kit, PIN Cracker (Kowalczyk's), Notepad, Nightshade's Payment: The Defences, Maintenance Tag, Core Access Code
NPCs met        75: director_netherton, hax_post, agent_0x99, nightshade_table, nightshade_van, nightshade_blast, kowalczyk_post, kowalczyk_van, quintero_post, arakawa_post, arakawa_gate, arakawa_blast, minder_blast, malhotra_post, vector_post, phantom_post, minder_post, voltage_van, ghost_phone, victoria_line, vance_phone, elena_phone, six_oclock, hearing, citadel, imran_voice, gary_voice, wendell_voice, tesseract_voice, tunnel_guard, tunnel_guard_kettle, duty_guard, duty_guard_b, vector_so, kowalczyk_so, arakawa_so, quintero_so, imran, imran_watched, gary_consultant, gary_tech, workshop_guard, kowalczyk_ws, arakawa_ws, quintero_ws, wendell, wendell_far, voltage_power_captured, voltage_power, static_power, kowalczyk_pr, arakawa_pr, quintero_pr, asante, mercer, hall_guard_a, hall_guard_b, kowalczyk_hall, arakawa_hall, quintero_hall, victoria_gallery, victoria_threat, vos, lock_guard, monitor_guard, farah_guard, reinforcement_a, reinforcement_b, quintero_lock, minder_lock, nightshade_lock, tesseract, kowalczyk_core_waiting, kowalczyk_core, quintero_core
flags submitted 4: flag{m10_monitoring_foothold}, flag{m10_staging_schedule}, flag{m10_container_escape}, flag{m10_core_host}
globals set     130: accused, arakawa_call_done, asante_outcome, aside_done, backdoor_channel_live, blast_tunnel_entered, breach_announced, breach_open, briefing_done, briefing_played, case_heard, citadel_open, close_cell_name, close_cells, close_human, close_secure_cell, close_zero_day, closing_done, console_choice, core_entered, core_greeted, cut_by_hand, database_outcome, door_scene_done, ending, engine_tutorial_declined, exchange_1, exchange_2, exchange_3, flag1_submitted, flag2_submitted, flag3_submitted, flag4_heard, flag4_submitted, forward_post_entered, gallery_entered, gallery_open, gallery_shutter_cut, gary_outcome, gate_console_used, ghost_answer, ghost_call_done, ghost_gift, ghost_sale, guide1_offered, guide3_offered, hall_guards_stood_down, head_start_killed, head_start_out, imran_outcome, inner_door_open, kowalczyk_answer, m01_completed, m01_final_choice, m02_completed, m02_exposed_hospital, m02_gary_protected, m02_reeves_fate, m03_completed, m03_victoria_fate, m04_completed, m04_disclosure_choice, m04_static_left, m04_vance_is_ally, m04_voltage_escaped, m04_voltage_print_on_bypass, m05_completed, m05_elena_treatment_funded, m05_entropy_program_exposed, m05_final_choice, m05_found_pipeline_list, m06_assets_seized, m06_completed, m06_satoshi_stance, m07_completed, m07_debrief_stance, m07_elena_outcome, m07_hollis_resolved, m07_mercer_fate, m07_team_assignment, m08_completed, m08_nightshade_triple_agent, m09_albion_notified, m09_cage_bin, m09_completed, m09_deck_pulled, m09_hax_confession_answer, m09_kowalczyk_reply, m09_memo_stance, m09_noor_told, m09_raid_team_answer, m09_reading_finished, m09_recruiter_offer, m09_recruiter_secret, m09_sorensen_fate, m09_tran_outcome, night_closed, nightshade_deal, ns_borrow_hint, officer_out, outer_lock_open, pair_back, partial_release, payment_read, phantom_on_team, power_room_entered, quintero_stance, raid_clock, security_office_entered, server_hall_entered, share_resale, share_zero_day, shutter_text_sent, split_started, stair_open, tess_lesson_said, tess_loose, tess_pitch_said, tess_rec_albion, tess_rec_derek, tess_warned, vector_on_team, victoria_gallery, victoria_line_deal, voltage_outcome, vos_outcome, wendell_outcome, whodunit_live, whodunit_open, workshop_entered
tasks           22 in objectivesState, 21 completed
  hear_him_out                       "completed"  at 2026-10-22T23:41:55Z
  submit_flag_1                      "completed"  at 2026-10-22T23:31:53Z
  submit_flag_2                      "completed"  at 2026-10-22T23:35:29Z
  submit_flag_3                      "completed"  at 2026-10-22T23:36:29Z
  submit_flag_4                      "completed"  at 2026-10-22T23:41:08Z
  decide_his_end                     "completed"  at 2026-10-22T23:42:33Z
  close_the_night                    "completed"  at 2026-10-22T23:42:54Z
  cut_the_shutter                    "completed"  at 2026-10-22T23:39:15Z
  use_the_console                    "completed"  at 2026-10-22T23:36:45Z
  reach_power_room                   "completed"  at 2026-10-22T23:35:08Z
  settle_the_table                   "completed"  at 2026-10-22T23:31:21Z
  cross_the_gallery                  "completed"  at 2026-10-22T23:40:19Z
  reach_server_hall                  "completed"  at 2026-10-22T23:35:20Z
  take_the_briefing                  "completed"  at 2026-10-22T23:30:42Z
  answer_the_handset                 "completed"  at 2026-10-22T23:33:17Z
  close_the_backdoor                 "active"
  decide_the_console                 "completed"  at 2026-10-22T23:42:33Z
  decide_the_database                "completed"  at 2026-10-22T23:42:33Z
  open_the_outer_lock                "completed"  at 2026-10-22T23:40:41Z
  take_the_stair_down                "completed"  at 2026-10-22T23:33:48Z
  reach_security_office              "completed"  at 2026-10-22T23:32:52Z
  go_through_the_blast_door          "completed"  at 2026-10-22T23:32:14Z
tasks_completed 21
score           78
social scenario false (completed tasks do not count; pass --tasks to count them)

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Verifier output, game B (extra run)

```
game            3758  (mission 85)
created         2026-10-22 23:16:53 UTC
last write      2026-10-22 23:47:00 UTC
played for      1807s of wall clock
current room    "forward_post"
unlocked rooms  8: forward_post, blast_tunnel, security_office, workshop_floor, power_room, server_hall, gallery, core
unlocked objs   0: 
inventory       11: Your Phone, CyberChef Workstation, Lock Pick Kit, RFID Cloner, Fingerprint Kit, PIN Cracker (Kowalczyk's), Notepad, Nightshade's Payment: The Defences, Schedule Copy Sign-in Card, Operator's Duty Sheet, Core Access Code
NPCs met        75: director_netherton, hax_post, agent_0x99, nightshade_table, nightshade_van, nightshade_blast, kowalczyk_post, kowalczyk_van, quintero_post, arakawa_post, arakawa_gate, arakawa_blast, minder_blast, malhotra_post, vector_post, phantom_post, minder_post, voltage_van, ghost_phone, victoria_line, vance_phone, elena_phone, six_oclock, hearing, citadel, imran_voice, gary_voice, wendell_voice, tesseract_voice, tunnel_guard, tunnel_guard_kettle, duty_guard, duty_guard_b, vector_so, kowalczyk_so, arakawa_so, quintero_so, imran, imran_watched, gary_consultant, gary_tech, workshop_guard, kowalczyk_ws, arakawa_ws, quintero_ws, wendell, wendell_far, voltage_power_captured, voltage_power, static_power, kowalczyk_pr, arakawa_pr, quintero_pr, asante, mercer, hall_guard_a, hall_guard_b, kowalczyk_hall, arakawa_hall, quintero_hall, victoria_gallery, victoria_threat, vos, lock_guard, monitor_guard, farah_guard, reinforcement_a, reinforcement_b, quintero_lock, minder_lock, nightshade_lock, tesseract, kowalczyk_core_waiting, kowalczyk_core, quintero_core
flags submitted 4: flag{m10_monitoring_foothold}, flag{m10_staging_schedule}, flag{m10_container_escape}, flag{m10_core_host}
globals set     145: accused, arakawa_call_done, asante_outcome, aside_done, backdoor_channel_live, backdoor_closed, blast_tunnel_entered, breach_announced, breach_open, briefing_done, briefing_played, case_heard, casualty_sheet_read, close_cell_name, close_cells, close_human, close_secure_cell, close_zero_day, closing_done, console_choice, core_entered, core_greeted, database_outcome, door_scene_done, ending, engine_tutorial_declined, exchange_1, exchange_2, exchange_3, flag1_submitted, flag2_submitted, flag3_submitted, flag4_heard, flag4_submitted, forward_post_entered, gallery_entered, gallery_open, gallery_shutter_cut, gary_outcome, gate_console_used, ghost_answer, ghost_call_done, ghost_gift, ghost_sale, guide1_offered, guide3_offered, head_start_killed, head_start_out, imran_outcome, inner_door_open, kowalczyk_answer, ladder_used, m01_completed, m01_final_choice, m02_completed, m02_exposed_hospital, m02_gary_protected, m02_reeves_fate, m03_completed, m03_victoria_fate, m04_completed, m04_disclosure_choice, m04_static_left, m04_vance_is_ally, m04_voltage_escaped, m04_voltage_print_on_bypass, m05_completed, m05_elena_treatment_funded, m05_entropy_program_exposed, m05_final_choice, m05_found_pipeline_list, m06_assets_seized, m06_completed, m06_satoshi_stance, m07_completed, m07_debrief_stance, m07_elena_outcome, m07_hollis_resolved, m07_mercer_fate, m07_team_assignment, m08_completed, m08_nightshade_triple_agent, m09_albion_notified, m09_cage_bin, m09_completed, m09_deck_pulled, m09_hax_confession_answer, m09_kowalczyk_reply, m09_memo_stance, m09_noor_told, m09_raid_team_answer, m09_reading_finished, m09_recruiter_offer, m09_recruiter_secret, m09_sorensen_fate, m09_tran_outcome, media_story_ran, night_closed, nightshade_deal, nightshade_map_used, ns_borrow_hint, officer_out, outer_lock_open, pair_back, partial_release, payment_read, phantom_on_team, power_room_entered, quintero_enters_core, quintero_stance, quintero_wounded, raid_clock, security_alerted, security_office_entered, server_hall_entered, share_resale, share_zero_day, shutter_text_sent, six_done, six_open, split_started, stair_open, tess_db_costs_said, tess_db_greeted, tess_end_said, tess_lesson_said, tess_loose, tess_pitch_said, tess_rec_albion, tess_rec_derek, tess_warned, tripwire_armed, tripwire_tripped, vector_on_team, victoria_gallery, victoria_line_deal, voltage_outcome, vos_outcome, wendell_outcome, whodunit_live, whodunit_open, workshop_entered, wren_at_core, wren_entering, wren_warned
tasks           24 in objectivesState, 24 completed
  hear_him_out                       "completed"  at 2026-10-22T23:27:34Z
  submit_flag_1                      "completed"  at 2026-10-22T23:18:58Z
  submit_flag_2                      "completed"  at 2026-10-22T23:24:15Z
  submit_flag_3                      "completed"  at 2026-10-22T23:24:30Z
  submit_flag_4                      "completed"  at 2026-10-22T23:26:44Z
  decide_his_end                     "completed"  at 2026-10-22T23:28:02Z
  close_the_night                    "completed"  at 2026-10-22T23:30:11Z
  cut_the_shutter                    "completed"  at 2026-10-22T23:23:14Z
  use_the_console                    "completed"  at 2026-10-22T23:25:22Z
  name_the_sleeper                   "completed"  at 2026-10-22T23:27:41Z
  reach_power_room                   "completed"  at 2026-10-22T23:22:06Z
  settle_the_table                   "completed"  at 2026-10-22T23:18:24Z
  cross_the_gallery                  "completed"  at 2026-10-22T23:25:45Z
  reach_server_hall                  "completed"  at 2026-10-22T23:23:34Z
  take_the_briefing                  "completed"  at 2026-10-22T23:17:16Z
  answer_the_handset                 "completed"  at 2026-10-22T23:21:04Z
  close_the_backdoor                 "completed"  at 2026-10-22T23:25:13Z
  decide_the_console                 "completed"  at 2026-10-22T23:27:38Z
  decide_the_database                "completed"  at 2026-10-22T23:27:58Z
  open_the_outer_lock                "completed"  at 2026-10-22T23:26:11Z
  take_the_stair_down                "completed"  at 2026-10-22T23:21:30Z
  reach_security_office              "completed"  at 2026-10-22T23:20:35Z
  read_the_casualty_sheet            "completed"  at 2026-10-22T23:22:52Z
  go_through_the_blast_door          "completed"  at 2026-10-22T23:19:36Z
tasks_completed 24
score           86
social scenario false (completed tasks do not count; pass --tasks to count them)

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Gate terminal login (prerequisite of flag 1) | secmon / Bunker!Monitor59 (read, not typed: the station takes only the flag) | Maintenance Tag on the gate terminal's lead, forward post; HaX names it in the monitoring topic | A: before flag 1 (A.jsonl:459); C: before flag 1 (C.jsonl:297) | yes (prerequisite earned) |
| `bunker_monitor:flag_1` | `<flag:1>` stand-in | none in game (VM) | typed at the gate terminal | **no: exercised, not earned** |
| Staging copy login (prerequisite of flag 2) | staging / Staging!Copy25 (read) | Schedule Copy Sign-in Card beside the release console; HaX "Where are we?" names it | A: before flag 2 (A.jsonl:1099); B | yes (prerequisite earned) |
| `bunker_monitor:flag_2` | stand-in | none in game (VM) | typed at the release console | **no** |
| Release service login (prerequisite of flag 3) | relops / Release!Shift25 (read) | Operator's Duty Sheet by the east racks; HaX's flag-2 rung and her hatch topic name it | A: before flag 3 (A.jsonl:1075); B | yes (prerequisite earned) |
| `release_host:flag_1` | stand-in | none in game (VM) | typed at the sealed hatch | **no** |
| Core host code (prerequisite of flag 4) | TSRCT-CORE-9F21 (read) | Core Access Code on the desk beside the core host terminal; HaX "His box first. The login's beside his terminal." | A: before flag 4 (A.jsonl:1505); B; C | yes (prerequisite earned) |
| `core_host:flag_1` | stand-in | none in game (VM) | typed at the core host terminal | **no** |
| Power room, A | Spare Power-Room Card | Fitter's locker (lockpick, assisted), security office | A, before the power room | yes (pick assisted) |
| Power room, C | Imran's cloned card | Imran, "I'm taking you in", cloner Save, Emulate at the door | C | yes |
| Outer lock, A | Vos's card, by "Your second buyer. The one you skim from." | Victoria Sterling's one call from her cell (after flag 2, "What about him?") | A, before the gallery | yes |
| Outer lock, C | Victoria opens it | Victoria in the gallery, "Before you touch that lock..." | C | yes |

The four flag rows are the boundary of what the run proves. Everything downstream of each VM flag was exercised, not tested. The PIN 6083 and the cracker were not used in either run (Vos and Victoria opened the lock), so the cracker path was not re-tested this round.

## Check list

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Trace-gone text | PASS | A: traced the share at the release console, then Vos's "Your second buyer" in the gallery set `share_zero_day=stopped`, `head_start_out=none`, `trace_loss_told=true`. HaX thread then shows "Your trace is gone. Zero Day's order was pulled before it went, so there's nothing to follow. They got nothing." (A.jsonl:1345). The credits say "Zero Day: got nothing tonight." and the core arrival says "Confirmed. Nothing left the lock." |
| 2 | Forward-post reload pointer ("The core." lines) | PASS, with the spawn caveat (m-1) | A, reloaded after the outer lock opened. HaX texts "Everything below is still open. Ask me where we are." (A.jsonl:1409); "Where are we?" gives "The core. His box first. The login's beside his terminal." The phone menu now offers "What went out?", "The backdoor.", "His box." Walking back took six `enter` calls and the core door crossed first time |
| 3 | Gary over a knocked-out Imran | PASS | A: `debugKO imran`, then Gary: "That's Imran on the floor at the far bench. I trained him." (A.jsonl:841). Reopen: "You put him on the floor. He's breathing, at least." No unconditional "talk to him first" |
| 4a | VM find: tag at the gate terminal, named by HaX | PASS | Tag in `forward_post` beside `gate_terminal` (x 499 against 518). HaX "Their monitoring. Where do I start?": "There's a maintenance tag on their gate terminal's lead. Their service login's on it." |
| 4b | VM find: staging sign-in card by the release console, named by HaX | PASS | Card in `server_hall` at (1962,365), console at (1934,327). HaX "Where are we?" in the hall: "The console takes the staging copy. Its sign-in card's on the desk beside it." |
| 4c | VM find: duty sheet by the east racks, named by HaX | PASS | Sheet in `server_hall` at (2096,368), hatch at (2104,285). After flag 2: "Get under the release service. The hatch in the sealed section. The duty sheet from the east racks has the login." Her hatch topic says it again (C.jsonl:661) |
| 4d | VM find: Core Access Code on the desk beside the core terminal, named by HaX | PASS | Code in `core` at (2630,410), host terminal at (2600,379). HaX's rung names "the login beside his terminal" (not the word "code"). The note reads "CORE. HOST ACCESS CODE. ONE HOLDER. ... For the agent. A.T." |
| 5 | Isolator pull at step 2, each voice | PASS for four voices | Captured Voltage (A): "Key's turned." then breaker row, the pull sets `cut_step 3`, `gallery_shutter_cut`. Vance (C): same steps by phone. HaX (S2): same. Elena (S3): same. Escaped Voltage stood down on the sums (B) and cuts it himself, no pull. Wendell "told" was not run. A click on the isolator before step 2 gave no bark I could read through the harness |
| 6 | "[Just that one?]" | PASS in all four voices | A Voltage: "Third from the left. Go and pull it yourself. I'll watch." (A.jsonl:997). C Vance: "Third from the left, the big one. Go and pull it. Nothing else." (C.jsonl:815). S2 HaX: "Third from the left. Go and pull it." (S2.jsonl:67). S3 Elena: "Third from the left. Go pull it." (S3.jsonl:62). It reads as an answer to the question each time |
| 7 | Shutter texts | PASS | "The hall's next." on HaX's thread, A (captured Voltage, flags not in). "Shutter's dead. The hall's next." for escaped Voltage standing down (B.jsonl:765) and for HaX's talk-through (S2.jsonl:93). "The stair's open." in C, where flags 2 and 3 were in before the Vance cut (C.jsonl:885). Not seen: "Shutter's dead. The stair's open." (the stand-down arm with flags in) |
| 8 | Tesseract's warning: backdoor first, then "Not yet" and back | PASS | A and C: "His backdoor's still open. The console in the hall closes it." comes first. "Not yet" gave "I'll be here." and closed. On return: "All four. Good. Now it's my turn." plus the next loose end ("We still haven't named WREN.", A.jsonl:1585; B with the backdoor closed named the door log instead). Three options each time |
| 9 | Disarm and kill-config lines | PASS | HaX's hatch topic: "The host holds the release's kill config: how six o'clock is armed, and what stops it. The disarm's on his console, in the core." (C.jsonl:661). After the ending the core console reads "The disarm's lamp is green." (A.jsonl:2255) and the readout "RELEASE: DISARMED. NOTHING WENT AT SIX." |
| 10 | Quintero's bench-log pointer after a wrong accusation | PASS | A: door log read, then "You're WREN." at Quintero, HaX asks "If that's wrong, Quintero's off the raid till you can clear her. Sure?" (reworded since round 1), "I'm sure." Quintero: "I took the drain. I didn't pack the case. Read the sheet." Trying Vector gave "Get Quintero back first. The bench log in the workshop clears her. Once you've seen it, I can bring her back." (A.jsonl:727). After the bench log, "Bring Quintero back." works: "Agent Quintero, you are cleared. Go back down." / "Next time, read the sheet first." |
| 11 | Netherton's "[Let me think about it.]" | PASS | Only on the silent Nightshade branch (cold start), S1.jsonl:215: "Do not take long. Nobody goes below until you answer." Conversation closed cleanly; reopening asks "The van. Does he come up to the door, or not?" with the same three options. Not on mixed or rich saves: Nightshade there is arrested or a triple agent, so the question never comes |
| 12 | Phone bubbles show no real-world clock | PASS | A: 34 `.message-bubble` elements in the HaX thread, none with a time element, no `\d:\d\d` in the page text. The contact list shows "Just now", "5m", "8m", all relative |

Also checked, from round 1 and since:

| Item | Result | Evidence |
|---|---|---|
| Wrong-station flag gives a pointer | PASS | Flag 4 at the gate terminal: "That one goes in at the core host terminal." Flag 3 at the release console: "That one goes in at the sealed section's hatch, at the east end of the server hall." |
| Join: one "(Keep driving.)" beat, warnings, way back | PASS | C: "Show me how it works." gave "You can still step back." "Step back" returned to the same menu and Tesseract; "Give me the key." gave HaX "0x00. Don't." and "If you take it, the mission ends here, and you work for ENTROPY."; then "Yes. Publish it." or "No."; one "(Keep driving.)", then Netherton's "Find 0x00" |
| Join chrome | PASS | Overlay header "MISSION FAILED // AUDIO INTEL"; no "WELL PLAYED" or "ENTROPY CONTAINED" in the page |
| Raid team after the ending | PASS | After A and C, every NPC in core, gallery and server hall is hidden; Quintero and Kowalczyk no longer stand at the core after the lethal ending |
| Reload on a finished game | PASS | C reloaded: the visualiser reopens, closable, no error |
| Accusation menu hides the officer who is out | PASS | With Quintero out, HaX's list drops her and offers the other four |
| 06:00 hub offers Gary | PARTLY | See m-2 |
| Victoria's card deal after the lock is open | not run live | The ink guards it (`outer_lock_open` in m10_victoria.ink lines 32, 57, 117, 179). I read it, I did not play it |

Not played: surrender and arrest endings (A went to "Fire."), executed, scorched, the hearing, a positive WREN naming, Tesseract's Esc-mid-record, the cracker path, the fight itself (KOs were `debugKO`), the print route on the bypass panel (the dusting game opened, I did not drive it).

## Findings

0 blockers, 0 majors, 4 minors, 4 nits.

| # | Severity | Finding | Repro (log) |
|---|---|---|---|
| m-1 | minor | A reload still spawns the player at the forward post, six rooms from where they were. The verifier shows `current room "forward_post"` for both finished games, although the player ended in the core. The pointer ("Everything below is still open", "The core. His box first...") now makes the walk-back clear, so this is a chore, not a trap | A.jsonl:1409 on; verify_A.txt, verify_C.txt, line "current room" |
| m-2 | minor | The 06:00 hub takes three visits, then moves on, although the menu shows four plus "That's everyone". A visited Quintero, Kowalczyk, Voltage: Gary never came up. B visited Gary, Kowalczyk, Quintero: Voltage never came up. Nothing says the hub is capped, and the credits still carry Gary's row ("Came down after the breach in a new lanyard") for a player who never saw him. Round 1 m-6 is not fixed, it moved | A: six_oclock hub after "Fire."; B.jsonl, same scene |
| m-3 | minor | The by-hand cut call opens by itself 1.5 s into a Voltage fight and takes the whole screen while Voltage and Static keep hitting. In C I went from 100 HP to the KNOCKED OUT screen while I read Vance's call (about 25 s of harness time; a human reading it would lose most of that). "Restart" went back to the title screen, and the fight state and Vance's call came back on re-entry. The phone has a close button, but nothing tells a player to use it first | C.jsonl:761 (KNOCKED OUT), then 781 on |
| m-4 | minor | Victoria (recruited) takes credit for something already done. After the player killed Zero Day's order at the console, "Before you touch that lock. Zero Day's order has your name on it." is still offered, and her reply is "And the order's withdrawn. Remember that I didn't have to." The order was already dead | C, gallery, `share_zero_day=stopped` before the pick |
| n-1 | nit | Ghost's first call opens with "You never answered me. You'll want to now." on a first ring (A and C). The player has not ignored him | A, C: duty handset |
| n-2 | nit | Netherton's reply to "There's a third way." is still "There is. Wipe both copies, his and ours." (round 1 nit). It reads as the writer's third way, not the player's | A: database menu |
| n-3 | nit | Double toasts remain: "Get into the server hall" twice, "Get a foothold ... gate terminal" twice, and "Lockpicking"/"Lock Picked" twice per pick | A and C toasts |
| n-4 | nit | The trace loss is silent at the moment of the choice. Vos says "The order goes with me", and the player learns the trace died from a HaX text a few seconds later. It lands, but nothing at the pick warns that his secret will cost the trace | A.jsonl:1345 |

## Narrative

I played the mixed save as a player who has finished the season but did not play it well: Gary protected, Victoria in a cell, Voltage captured, Nightshade arrested. It is a good save to play, because the finale talks to it. Netherton reads back "Full term, as you told him"; Voltage opens with "You checked my sums. Now check this." and talks me through the isolator himself; Victoria's one call from the cell gives me Vos, and the order I wasted on "Let it run. Trace who gets it." comes apart when I use him. HaX tells me so in a text: "Your trace is gone." That was the sourest moment in the run and the best one. I made a choice, I used a secret I was handed, and the game told me exactly what it cost without scolding.

The VM finds work as a chain now. Each of the four sits beside its station, each is readable as an ordinary document, and HaX points at each one in the same words as the object. The tag, the staging card and the duty sheet were found because HaX said where to look; the Core Access Code was found because I already knew to look beside the terminal. Reading them before typing the stand-in flag felt like earning something. The wrong-station hints ("That one goes in at the core host terminal.") are the kindest touch in the mission.

Quintero's wrong accusation is a small, clear lesson: the check says "If that's wrong", I was wrong, Quintero said "Read the sheet", and the bench log was one room away with a pointer from HaX. Her return line ("Next time, read the sheet first.") shows the cost without a speech. Tesseract's warning does what the design wants: backdoor first, then the thing I would otherwise have forgotten. "Not yet" and back is clean.

The lethal ending in A ("Fire.", HaX "I was a second behind you. Log it. I'll sign under you.") is short and heavy, and the credits behind it carry the night accurately: Voltage "Kept his hands still", Victoria "Still talking", Vos "Withdrew Zero Day's order", the backdoor left open with "None of the forty-seven were warned." They read as consequences, not rewards. I was not left wondering what I had done.

The rich save to Join (C) is the nastier ending and the better written one. The warnings are plain, there is a way back at each step, the key console asks once, and then "Somewhere on a road out of Montana, your phone lights. One message from HaX. '0x00.' You don't answer." Netherton's "Whitlock came to the table. He asked if it was you. I told him yes." lands because I had met Gary. The credits' corrected figure (2,100 to 3,600) is the line a player remembers. Teaching: the season's point (check the sums, find the logins people leave, read the log before you accuse) is clear in both runs, and the disarm/kill-config lines tie the VM work to the ending without naming technique.

What got in the way was mostly structural. Reloading drops me at the forward post (m-1), though I am now told where to go. The 06:00 hub quietly drops a character (m-2). The Voltage fight is a place a human could lose a lot of health to a phone call (m-3). None of these blocks the ending.

Fun: 4. Pacing: 4 (the server hall to core run is quick; the reload walk-back and guard challenges drag). Clarity of goals: 4 to 5 (the HaX rungs carry it). Openness of decisions: 4. Teaching: 4.

Best lines: "Your trace is gone." (HaX); "Next time, read the sheet first." (Quintero); "I'd rather it was you." (Tesseract); "Whitlock came to the table. He asked if it was you. I told him yes." (Netherton, Join); "Left on a quiet day, as you asked. First sale I ever turned down. Clean exit." (Ghost).
Weaker lines: "There is. Wipe both copies, his and ours." (n-2); "You never answered me." on a first ring (n-1); "And the order's withdrawn. Remember that I didn't have to." (m-4).
