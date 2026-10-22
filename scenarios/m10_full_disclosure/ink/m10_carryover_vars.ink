// m10_carryover_vars.ink: the shared include for every m10 ink file.
// Declares every scenario global (imports, exports, locals, the close's five strings)
// and four functions. No knots, no text, no tags. Contract: CONTRACT.md §2.2.
// IMPORTS (mNN_*) ARE READ-ONLY: never assign one, never #set_global one.
// Defaults here must equal globalVariables / importGlobals in scenario.json.erb.
// Only group A edits this file. Written 2026-10-21.

// ===================== IMPORTS (read-only) =====================

// m01 First Contact
VAR m01_final_choice = ""
VAR m01_player_launched_attack = false
VAR m01_maya_ko = false
VAR m01_kevin_ko = false
VAR m01_sarah_ko = false
VAR m01_player_aborted_attack = false   // alignment A4: the first week's hand off the button (season line)

// m02 Ransomed Trust
VAR m02_ghost_deal_accepted = false
VAR m02_exposed_hospital = false
VAR m02_ghost_deal_refused = false
VAR m02_ghost_keys_used = false
VAR m02_gary_protected = false
VAR m02_reeves_fate = ""
VAR m02_insider_asset_arrested = false
VAR m02_insider_asset_escaped = false
VAR m02_patient_assaulted = false
VAR m02_receptionist_ko = false
VAR m02_ward_nurse_ko = false
VAR m02_raval_ko = false
VAR m02_gary_ko = false
VAR m02_dr_kim_ko = false
VAR m02_bed4_manually_stabilised = false
VAR m02_patient_bed4_deceased = false

// m03 Ghost in the Machine
VAR m03_victoria_fate = ""
VAR m03_sterling_on_call_seen = false
VAR m03_guard_bribed = false
VAR m03_guard_knocked_out = false
VAR m03_receptionist_ko = false
VAR m03_danny_ko = false

// m04 Critical Failure
VAR m04_voltage_captured = false
VAR m04_voltage_escaped = false
VAR m04_voltage_print_on_bypass = false
VAR m04_static_left = false
VAR m04_static_left_alone = false
VAR m04_vance_is_ally = false
VAR m04_disclosure_choice = ""
VAR m04_crew_lost = false
VAR m04_robert_vance_ko = false
VAR m04_security_guard_ko = false

// m05 Insider Trading
VAR m05_entropy_program_exposed = false
VAR m05_elena_treatment_funded = false
VAR m05_final_choice = ""
VAR m05_found_pipeline_list = false
VAR m05_recruiter_deal_accepted = false
VAR m05_recruiter_deal_confessed = false
VAR m05_lisa_ko = false
VAR m05_owen_ko = false
VAR m05_halloran_ko = false
VAR m05_patricia_ko = false

// m06 Follow the Money
VAR m06_assets_seized = false
VAR m06_satoshi_stance = ""
VAR m06_monitoring_enabled = false
VAR m06_guard_ko = false
VAR m06_trader_ko = false
VAR m06_analyst_ko = false

// m07 The Architect's Gambit
VAR m07_elena_outcome = ""
VAR m07_mercer_fate = ""
VAR m07_mercer_ko = false
VAR m07_hollis_resolved = ""
VAR m07_debrief_stance = ""
VAR m07_team_assignment = ""
VAR m07_team_redirected = false
VAR m07_countdown_expired = false
VAR m07_architect_echo_heard = false
VAR m07_elena_ko = false

// m08 The Mole
VAR m08_nightshade_triple_agent = false
VAR m08_triple_agent_first_payment = false
VAR m08_nightshade_arrested = false
VAR m08_nightshade_ko_before_fate = false
VAR m08_accused_vector = false
VAR m08_accused_phantom = false
VAR m08_vector_apologised = false
VAR m08_phantom_apologised = false
VAR m08_vector_hostile = false
VAR m08_phantom_hostile = false
VAR m08_offduty_agent_ko = false
VAR m08_analyst_ko = false
VAR m08_athena_ko = false
VAR m08_netherton_ko = false
VAR m08_hax_ko = false
VAR m08_named_on_evidence = false

// m09 Digital Archaeology
VAR m09_nightshade_shown_file = false
VAR m09_sleeper_named = false
VAR m09_recruiter_offer = ""
VAR m09_deck_pulled = ""
VAR m09_sleeper_shortlist = false
VAR m09_recruiter_secret = ""
VAR m09_reading_finished = false
VAR m09_albion_notified = false
VAR m09_cage_bin = ""
VAR m09_legacy_files_saved = false
VAR m09_hax_confession_answer = ""
// m09 alignment A1 (m09 exports them from its alignment round; JSON-only there)
VAR m09_memo_stance = ""          // yes_albion / no: the debrief's "Was he right?"
VAR m09_raid_team_answer = ""     // quintero / kowalczyk: the player's answer to the team at the briefing
VAR m09_kowalczyk_reply = ""      // warm / flat: thanks for the cracker at the debrief
VAR m09_sorensen_fate = ""        // left / talked / ko (m09's default is "left"; read only with m09_completed)
VAR m09_tran_outcome = ""         // left / talked / ko (as above)
VAR m09_noor_told = false
VAR m09_alpha_clip_played = false
// m09 alignment R2 (m10 R2-M4): the four exports m09 added for m10
VAR m09_reading_told_hax = false
VAR m09_noor_ko = false
VAR m09_old_coyote_ko = false
VAR m09_debrief_notice_before = false   // heard "build your own way out first" on the Alpha tape
VAR m09_alpha_annotations_read = false   // twelfth m09 export (stage 8 ruling 5); Tier 2: gates the Tomb Alpha notes answer

// completed
VAR m01_completed = false
VAR m02_completed = false
VAR m03_completed = false
VAR m04_completed = false
VAR m05_completed = false
VAR m06_completed = false
VAR m07_completed = false
VAR m08_completed = false
VAR m09_completed = false

// ===================== EXPORTS (CONTRACT §2.4) =====================

VAR ending = ""
VAR database_outcome = ""
VAR sleeper_caught = false
VAR wrong_accusation = false
VAR head_start_out = ""
VAR partial_release = "none"
VAR media_story_ran = false

// ===================== LOCALS (CONTRACT §2.5) =====================

// Alignment A7 (music; the builder wires the cues): each closing scene sets
// its own on the first line.
VAR six_open = false
VAR hearing_open = false
VAR citadel_open = false

// --- Act, doors and clock (mappings write most; ink reads) ---
VAR raid_clock = "t0145"
VAR flag1_submitted = false
VAR flag2_submitted = false
VAR flag3_submitted = false
VAR flag4_submitted = false
VAR briefing_played = false
VAR briefing_done = false
VAR aside_done = false
VAR whodunit_live = true
VAR whodunit_open = false
VAR door_scene_done = false
VAR gate_console_used = false
VAR split_started = false
VAR pair_back = false
VAR arakawa_call_done = false
VAR breach_open = false
VAR inner_door_open = false
VAR stair_open = false
VAR gallery_open = false
VAR outer_lock_open = false
VAR breach_announced = false
VAR tripwire_armed = false
VAR tripwire_tripped = false
VAR wren_warned = false
VAR security_alerted = false
VAR ladder_used = false
VAR override_held = false
VAR hall_team_present = false       // stage 9: true while a raid copy stands in the server hall (playtest B-03)
VAR hall_guards_stood_down = false  // the hall guards' talk-past; stage 9 stops both patrols and their challenges on it
VAR hax_rest_promised = false      // dialogue R1 m14: HaX promised the rest at six (hax_post), so 06:00 and the hearing offer the question
VAR plans_read = false
VAR payment_read = false
VAR forward_post_entered = false
VAR blast_tunnel_entered = false
VAR security_office_entered = false
VAR workshop_entered = false
VAR power_room_entered = false
VAR server_hall_entered = false
VAR gallery_entered = false
VAR core_entered = false
VAR ghost_call_done = false
VAR ghost_watch_on_route = false
VAR door_log_given = false
VAR signout_read = false
VAR what_went_out_given = false
VAR clue_door_log = false
VAR clue_alibi = false
VAR ns_borrow_hint = false  // scenario design R2 m2: Nightshade's "they always borrow a badge" hint
VAR cracker_rack_seen = false  // puzzle chains P5: the cracker rack in the workshop has been looked at
VAR lock_guard_stood_down = false  // puzzle chains P6: Fonoti has handed over his card or stood down
// Playtest R1 m-5: Tesseract's record flags are globals, so a reload mid-records resumes at the next record.
VAR tess_rec = 0
VAR tess_rec_albion = false
VAR tess_rec_derek = false
VAR tess_rec_debrief = false
VAR tess_rec_cold = false
// The core scene's resume flags (dialogue R1, scenario design R1), also globals for the same reason.
VAR tess_case_step = 0
VAR tess_pitch_said = false
VAR tess_lesson_said = false
VAR tess_db_greeted = false
VAR tess_db_costs_said = false
VAR tess_end_said = false
VAR tess_warned = false
VAR clue_bench_log = false
VAR casualty_sheet_read = false
VAR margin_note_read = false
VAR phone_voice_is_hax = false
VAR cut_by_hand = false
VAR cut_step = 0
VAR gallery_shutter_cut = false
VAR voltage_print_lifted = false
VAR keypad_dusted = false
VAR backdoor_channel_live = false
VAR hax_jammed = false
VAR at_keypad = false
VAR lock_guard_challenged = false
VAR lock_guard_known = false
VAR gallery_rota_read = false
VAR core_greeted = false
VAR flag4_heard = false
VAR case_heard = false
VAR wren_entering = false
VAR wren_stopped = false
VAR quintero_enters_core = false
VAR six_done = false
VAR closing_done = false
VAR vector_on_team = false
VAR phantom_on_team = false
VAR guide1_offered = false
VAR guide2_offered = false
VAR guide3_offered = false
VAR guide4_offered = false
VAR guide1_given = false
VAR guide2_given = false
VAR guide3_given = false
VAR guide4_given = false

// --- Decisions (MC §12) ---
VAR quintero_stance = ""
VAR nightshade_taken_in = false
VAR payment_checked = false
VAR nightshade_map_used = false
VAR nightshade_deal = ""
VAR nightshade_tethered = false
VAR ghost_sale = ""
VAR ghost_gift = ""
VAR ghost_answer = ""
VAR imran_outcome = ""
VAR gary_outcome = ""
VAR voltage_outcome = ""
VAR wendell_outcome = ""
VAR server_hall_warned = false
VAR gallery_camera_blinded = false
VAR asante_outcome = "untouched"
VAR asante_confirmed_sheet = false
VAR victoria_line_deal = ""
VAR vos_secret_known = false
VAR victoria_line_done = false
VAR vos_secret_used = false
VAR victoria_gallery = ""
VAR vos_outcome = ""
VAR head_start_killed = ""
VAR share_zero_day = "live"
VAR share_resale = "none"
VAR backdoor_closed = false
VAR accused = ""
VAR officer_out = ""
VAR wren_held = false
VAR kowalczyk_gone_ahead = false
VAR kowalczyk_ko = false
VAR quintero_ko = false
VAR arakawa_ko = false
VAR vector_ko = false
VAR phantom_ko = false
VAR malhotra_recalled = false
VAR arakawa_recalled = false
VAR quintero_recalled = false
VAR vector_recalled = false
VAR phantom_recalled = false
VAR fonoti_ko = false
VAR gary_ko = false
VAR mercer_ko = false
VAR wren_at_core = false
VAR quintero_wounded = false
VAR kowalczyk_answer = ""
VAR exchange_1 = ""
VAR exchange_2 = ""
VAR exchange_3 = ""
VAR points_landed = 0
VAR console_choice = ""
VAR join_step = 0
VAR cold_lowered = false
VAR fire_held = false
VAR hax_asked_database = false   // SCRIPT_EDIT_R2 A2-12: A tesseract database ("[HaX. What would you do?]"); read by A hearing

// ===================== THE CLOSE'S FIVE STRINGS (S6 §3.1) =====================
// Written only by close_compute(), first line of six_oclock / hearing / citadel.

VAR close_secure_cell = ""
VAR close_cell_name = ""
VAR close_cells = ""
VAR close_human = ""
VAR close_zero_day = ""

// ===================== FUNCTIONS (CONTRACT §2.6) =====================
// No text, no tags in any function. Only close_compute() assigns, and only the five close strings.

// How many earlier missions have at least one bystander knock-out (FA §3.6). 0 to 8.
=== function ko_pattern()
~ temp n = 0
{ m01_completed and (m01_maya_ko or m01_kevin_ko or m01_sarah_ko):
    ~ n = n + 1
}
{ m02_patient_assaulted or m02_receptionist_ko or m02_ward_nurse_ko or m02_raval_ko or m02_gary_ko or m02_dr_kim_ko:
    ~ n = n + 1
}
{ m03_guard_knocked_out or m03_receptionist_ko or m03_danny_ko:
    ~ n = n + 1
}
{ m04_security_guard_ko or m04_robert_vance_ko:
    ~ n = n + 1
}
{ m05_lisa_ko or m05_owen_ko or m05_halloran_ko or m05_patricia_ko:
    ~ n = n + 1
}
{ m06_guard_ko or m06_trader_ko or m06_analyst_ko:
    ~ n = n + 1
}
{ m07_elena_ko:
    ~ n = n + 1
}
{ m08_offduty_agent_ko or m08_analyst_ko or m08_athena_ko or m08_netherton_ko or m08_hax_ko:
    ~ n = n + 1
}
// R2-M4: m09, the night before (its default "left" never counts).
{ m09_completed and (m09_noor_ko or m09_old_coyote_ko or m09_sorensen_fate == "ko" or m09_tran_outcome == "ko"):
    ~ n = n + 1
}
~ return n

// The door scene's four-way branch (MC §3.1). "shown" / "unshown" / "arrested" / "silent".
=== function door_branch()
{
- m08_nightshade_triple_agent and m09_nightshade_shown_file:
    ~ return "shown"
- m08_nightshade_triple_agent:
    ~ return "unshown"
- m08_nightshade_arrested and not m08_nightshade_ko_before_fate:
    ~ return "arrested"
- else:
    ~ return "silent"
}

// How many exchanges landed (rebuttal or record). Write points_landed from this; never increment it.
=== function landed_count()
~ temp n = 0
{ exchange_1 == "rebuttal" or exchange_1 == "record":
    ~ n = n + 1
}
{ exchange_2 == "rebuttal" or exchange_2 == "record":
    ~ n = n + 1
}
{ exchange_3 == "rebuttal" or exchange_3 == "record":
    ~ n = n + 1
}
~ return n

// The close's five strings (S6 §3.1-3.2). Called as `~ close_compute()` on the first line of
// six_oclock, hearing and citadel. Every call assigns all five, so a replay recomputes.
=== function close_compute()
~ temp cells = 0
~ temp austin = m07_completed and m07_team_assignment != "trojan_horse"
~ temp list_kept = m05_found_pipeline_list and not m05_recruiter_deal_accepted
~ temp list_late = m05_found_pipeline_list and m05_recruiter_deal_accepted and m05_recruiter_deal_confessed

// close_secure_cell: the first operation the vault covers, only when secured.
{
- database_outcome != "secured":
    ~ close_secure_cell = ""
- m03_victoria_fate == "recruited" and (victoria_gallery == "confronted" or victoria_gallery == "refused" or (victoria_gallery == "trusted" and head_start_killed == "zero_day")):
    ~ close_secure_cell = "zd_uk"
- m08_nightshade_triple_agent and not m09_nightshade_shown_file:
    ~ close_secure_cell = "procurement"
- m05_final_choice == "turn_double_agent":
    ~ close_secure_cell = "torres"
- m06_monitoring_enabled:
    ~ close_secure_cell = "crypto"
- m09_completed and not m09_albion_notified:
    ~ close_secure_cell = "cm"
- else:
    ~ close_secure_cell = "book"
}

// close_cell_name: the one cell the card names.
{
- ending == "surrender":
    ~ close_cell_name = "couriers"
- close_secure_cell != "":
    ~ close_cell_name = close_secure_cell
- head_start_killed == "ghost" and ghost_sale == "bait":
    ~ close_cell_name = "bait"
- share_zero_day == "traced" and head_start_killed != "ghost":
    ~ close_cell_name = "trace"
- m07_completed and m07_team_assignment == "fracture":
    ~ close_cell_name = "reeves"
- m07_completed and m07_team_assignment == "meltdown":
    ~ close_cell_name = "ashford"
- not m07_completed or m07_team_assignment == "trojan_horse":
    ~ close_cell_name = "walsh"
- else:
    ~ close_cell_name = "none"
}

// close_cells: the count as c0..c5 (never printed).
{ (head_start_killed == "ghost" and ghost_sale == "bait") or share_zero_day == "traced":
    ~ cells = cells + 1
}
{ database_outcome == "secured":
    ~ cells = cells + 1
}
{ ending == "surrender":
    ~ cells = cells + 2
}
{ not (m07_completed and m07_team_assignment == ""):
    ~ cells = cells + 1
}
{ cells:
- 0:
    ~ close_cells = "c0"
- 1:
    ~ close_cells = "c1"
- 2:
    ~ close_cells = "c2"
- 3:
    ~ close_cells = "c3"
- 4:
    ~ close_cells = "c4"
- else:
    ~ close_cells = "c5"
}

// close_human: the card's one human line (S6 §3.2 U, eleven rows in order).
{
- austin and database_outcome == "disclosed":
    ~ close_human = "dispatch_fixing"
- austin:
    ~ close_human = "dispatch_dropping"
- m04_completed and m04_disclosure_choice == "full" and m09_albion_notified:
    ~ close_human = "albion_full_sent"
- m04_completed and m04_disclosure_choice == "full":
    ~ close_human = "albion_full"
- m04_completed and m04_disclosure_choice == "partial" and m04_crew_lost and m09_albion_notified:
    ~ close_human = "albion_inquest_sent"
- m04_completed and m04_disclosure_choice == "partial" and m04_crew_lost:
    ~ close_human = "albion_inquest"
- m04_completed and m04_disclosure_choice == "partial":
    ~ close_human = "albion_half"
- m05_completed and list_late:
    ~ close_human = "fortyseven_late"
- m05_completed and not list_kept:
    ~ close_human = "fortyseven_none"
- m05_elena_treatment_funded and m05_final_choice != "arrest":  // dialogue R2 n7: the Torres credit already says it
    ~ close_human = "elena"
- else:
    ~ close_human = "none"
}

// close_zero_day: Vos named when he held the gallery and wasn't bought.
{
- (m03_victoria_fate == "arrested" or m03_victoria_fate == "ko" or m03_victoria_fate == "") and vos_outcome != "bought":
    ~ close_zero_day = "vos_named"
- else:
    ~ close_zero_day = "trading"
}
~ return

// Alignment A5 (ruling D1 c): the one season line at 06:00, Netherton's, chosen
// by the first heavy import that applies. Returns a key; the scene prints the
// fixed line. "" on a cold start (no line). R2-M3: when m09's memo line will
// follow (it is about Albion), the Albion keys are skipped, so a full season
// hears St. Catherine's, Austin, the mole or the first week instead.
=== function season_line()
~ temp memo = m09_completed and m09_memo_stance != ""
{
- not memo and m04_completed and m04_disclosure_choice == "full":
    ~ return "albion_full"
- not memo and m04_completed and m04_disclosure_choice == "partial":
    ~ return "albion_half"
- not memo and m04_completed and m04_disclosure_choice == "quiet":
    ~ return "albion_quiet"
- m02_completed and m02_exposed_hospital:
    ~ return "stcath_exposed"
- m02_completed and m02_bed4_manually_stabilised:
    ~ return "stcath_bed4"
- m07_completed and m07_team_assignment == "trojan_horse":
    ~ return "austin_covered"
- m07_completed and m07_team_assignment != "":
    ~ return "austin_uncovered"
- m07_completed:
    ~ return "denver"
- m08_completed:
    ~ return "mole"
- m01_completed and m01_player_aborted_attack:
    ~ return "first_week_button"
- m01_completed:
    ~ return "first_week"
- else:
    ~ return ""
}
