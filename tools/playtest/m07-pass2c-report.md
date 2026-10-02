# m07 pass 2c confirmation run (D1 to D7)

Question: plumbing confirmation of the implementer's fixes. Flags handed over as `<flag:N>` (not earned; no VM in standalone).
Logs: tools/playtest/m07-pass2c-session.jsonl (run A, game 1179, briefing commit Meltdown, Elena fled, flags 1,2,3,4 in order, 10-minute wait so T-20 fired unclicked) and m07-pass2c-runB-session.jsonl (run B, game 1180, briefing closed early, Fracture via HaX, Elena never spoken to, flag 4 before 3). Flags: m07_architects_gambit-flags-game1179.xml, ...1180.xml.

Both games: status=completed, mission_concluded_at set (1179: 01:09:19 UTC, 1180: 01:05:22 UTC).

## Earned secrets
| Secret | Source in-game | Earned |
|---|---|---|
| 0616 (both) | Shift Handover Sheet, ops floor | yes |
| Badge (both) | Printed Contractor Badge from the station | yes |
| CascadeWindow19 (both) | Listener Capture text_file in the inventory, read before use; Elena fled (A) / unmet (B) | yes |
| Flags 1-4 (both) | VM, not possible standalone | no, handed over |
Vault PIN, plant key and Mercer were not used. The VM work behind the flags is exercised, not tested.

## verify-run.rb
Run A (1179) and run B (1180) full output: scratchpad copies were taken; headline lines: A "VERDICT: progress recorded - 3 rooms beyond the first, 2 objects unlocked, 4 flags submitted"; B same. Full text:

    game            1179  (mission 51)
    created         2026-10-01 00:55:13 UTC
    last write      2026-10-01 01:09:20 UTC
    played for      847s of wall clock
    current room    "security_checkpoint"
    unlocked rooms  4: security_checkpoint, operations_floor, server_room, scada_control
    unlocked objs   2: badge_printer, crisis_control_system
    inventory       6: Your Phone, Lock Pick Kit, Notepad, Shift Handover Sheet, Printed Contractor Badge, Listener Capture -- Operator Credentials
    NPCs met        7: opening_briefing_cutscene, agent_0x99, jake_morrison, the_architect, closing_debrief, elena_rodriguez, james_mercer
    flags submitted 4: flag{m07_architects_gambit_scada_attack_host_1_97c0b3}, flag{m07_architects_gambit_scada_attack_host_2_8e6961}, flag{m07_architects_gambit_scada_attack_host_3_9233f3}, flag{m07_architects_gambit_scada_attack_host_4_007244}
    globals set     33: architect_contact, architect_signoff_done, architect_signoff_started, architect_t20_played, badge_obtained, badge_pin_found, briefing_played, cascade_armed, debrief_played, debrief_stance, elena_outcome, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_coordination_traffic, grid_saved, lockpicking_guide_offered, mercer_fate, mercer_stance, mission_complete, morrison_resolved, park_resolved, player_name, privesc_guide_offered, projection_revised, recon_guide_offered, redirect_window_closed, rfid_guide_offered, scada_password_found, start_debrief_cutscene, team_assigned, team_assignment
    
    VERDICT: progress recorded — 3 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
    Cross-check the specifics above against the report.

    game            1180  (mission 51)
    created         2026-10-01 01:00:37 UTC
    last write      2026-10-01 01:05:27 UTC
    played for      290s of wall clock
    current room    "security_checkpoint"
    unlocked rooms  4: security_checkpoint, operations_floor, server_room, scada_control
    unlocked objs   2: badge_printer, crisis_control_system
    inventory       6: Your Phone, Lock Pick Kit, Notepad, Shift Handover Sheet, Printed Contractor Badge, Listener Capture -- Operator Credentials
    NPCs met        7: opening_briefing_cutscene, agent_0x99, jake_morrison, the_architect, closing_debrief, elena_rodriguez, james_mercer
    flags submitted 4: flag{m07_architects_gambit_scada_attack_host_1_c07d32}, flag{m07_architects_gambit_scada_attack_host_2_460c13}, flag{m07_architects_gambit_scada_attack_host_4_ddbc31}, flag{m07_architects_gambit_scada_attack_host_3_076b1c}
    globals set     31: architect_contact, architect_signoff_done, architect_signoff_started, badge_obtained, badge_pin_found, briefing_played, debrief_played, debrief_stance, elena_outcome, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, flags_nag_sent, found_coordination_traffic, grid_saved, lockpicking_guide_offered, mercer_fate, mercer_stance, mission_complete, morrison_resolved, park_resolved, player_name, privesc_guide_offered, projection_revised, recon_guide_offered, rfid_guide_offered, scada_password_found, start_debrief_cutscene, team_assigned, team_assignment
    
    VERDICT: progress recorded — 3 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
    Cross-check the specifics above against the report.

## Results
1. D1 PASS (A and B). After flag 2 the inventory lists "Listener Capture -- Operator Credentials" (type text_file); opening it shows the text with CascadeWindow19; the password opened the control room door. In A Elena had fled (hidden).
2. D2 PASS (A). architect_t20_played was true (timer, 10 min after the commit) and its bark was never clicked. After "Say it" the sign-off ended and the debrief opened directly; the string "cuts across the facility alarm" appears 0 times in the A log (run 1 of the earlier pass showed it).
3. D3 PASS. A: committed in the briefing, HaX shows "I've got your channel and I've got the board." then "If the team's call is still open when you ring..." and only "Confirm the team's away" / "Talk to me about the two we're not covering" / "I'll call you back"; no "still uncommitted", no commit option. B: briefing closed early, HaX offered only "Where the team goes: I'm ready to make the call."; after choosing Fracture the next choices were "Talk to me about the two..." and "I'll call you back"; the commit option was gone at once. assign_tactical_team completed.
4. D4 PASS. Elena at world (736,209), on open floor below the rack rows, screenshot shows no overlap; moveToNear arrived 20 px away and she talked. Relay also reachable directly (moveToNear ok) with her at this spot.
5. D6 PASS (B, clock never armed, flag 4 before 3): sign-off opened "The console goes quiet. Your handset rings anyway." In A (armed) it said "The countdown on the wall stops."
6. D7 PASS (A). Entering the ops floor with no badge: bark "The server hall door on the far side of this floor has a badge reader... Want the RFID field guide?" and rfid_guide_offered true. Entering the server hall with no plant key: bark "The plant door on the south side of this hall is a keyed lock... Say the word if you want the lockpicking field guide." and lockpicking_guide_offered true.
7. Finish: both games completed. Debrief ran fully before the credits in both. Flag 3 after the win in B: armed=false, clock hidden.

## New defects / notes
- Minor: the sign-off thread shows a stray "You've sent your team." line above the sign-off (the T-20 bark's preview text kept as the first message). It is the bark line, not a replayed taunt; seen in both pass 2 run 1 and here.
- Minor: HaX's neutral opener after a briefing commit ("If the team's call is still open when you ring...") reads oddly when the call is already closed.
- Harness: relay approach in the server hall is still flaky for moveToNear (stopped at y~117-123 aisle in B); the keyboard route (moveTo 760,240; walk up; right) got there.
