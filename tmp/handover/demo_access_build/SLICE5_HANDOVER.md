# Slice 5 handover (Ama, objectives, ending): built, tested, corpus run (see Results at the end)

## Done (commit 4b882dc59, scenarios/demo_access_tour only)
- scenario.json.erb: globalVariables (tour_full, front_desk_signed_out, saw_in_use, julian_ended_by_unplug, tour_debriefed, done_<17 tasks>); objectives: aim_office, aim_network (required), aim_around, aim_deeper (optional aims and tasks), aim_wrap (missionConclusion, unlockCondition aimsCompleted office+network, conclusionScreen bond_visualiser; t_debrief starts "active" like the lab, the aim is the gate, not "locked"). Every task has onComplete.setGlobal done_<id>.
- ama_phone mappings added (all on ama_phone): front_desk_signed_out, saw_in_use (merged with P1), julian_ended_by_unplug, card_cloned -> t_copy_badge, unplug -> t_unplug, implant -> t_implant, capture mapping now has completeTask t_capture_key, P0 to P5b timed texts. Ama NPC: timedConversation on game_loaded (skipIfGlobal done_t_meet_ama), reopenRefreshesHub, taskOnKO t_debrief. show_scenario_brief on_resume added.
- music: one event, conversation_closed:ama with condition tour_debriefed, closingCard plus a short credits list (plan 2.12 step 6). The brief said "no credits"; the plan lists credits. If the user wants none, delete the `credits` key (closingCard alone still concludes).
- ink: ama.ink (start briefing, route_choice, hub, written_up, debrief, recap, wrap_open()), ama_phone.ink (hub "Where next?" W1 to W19 incl. W6b with `and not done_t_copy_badge`, knots hint_cake, hint_sign_out, hint_open_session, hint_network_view, hint_injector, hint_patch_panel, debrief_ready, hint_ports), lorna.ink (hub_quiet set before first -> hub).
- Results so far: ink compiles (7, 0 failed); validator 0 errors, 11 warnings (julian_back and capture warnings gone); dialoguelint clean.

## Open
1. Rails tests not run. Add cases to test/controllers/break_escape/demo_access_tour_test.rb for server-enforced completions via `post complete_task_game_url(@game, task_id: ...)`: t_kit (unlock_room after rfid meeting_room), t_front_desk (signedInPcs after front_desk_session), t_drop_box (after plant_box), t_julian_pc (after julian_through_box), t_comms, t_server_room, t_door_controller, t_open_session, t_yasmin_pc, t_staff_wifi, t_guest_port; refused before the trigger. Run alone under the flock on tmp/tests.lock with BUNDLE_PATH=<main>/vendor/bundle RBENV_VERSION=2.7.8 BREAK_ESCAPE_STANDALONE=true (both demo_access_tour*_test.rb).
2. Add a "full validator reports no unknown errors on demo_access_tour" test beside test/js/validator-network-model.test.mjs:803 (plan 4.5).
3. Scoped corpus: PAYLOAD_SCAN_ONLY=demo_access_tour RUN_OPENED_SCAN=1, fresh and opened payload scan tests under flock, output to a file; only the known m09 artefact allowed.
4. Check by eye: every eventMapping condition uses supported forms (grep "condition" in ama_phone mappings; none uses || or parentheses).
5. Remaining validator warning to note: 4 unplug mappings on meeting_jack flagged for onceOnly overlap (P5a/P5b are disjoint on tour_full; intended).

## New spoken lines (for dialogue review)
Ama person: A1 to A3b, A4, route choice A5 with replies "Quick it is. Doors, a desk, the box, and back to me." / "The full walk-round, then. Every room, every gadget."; M1 "Not done yet. Your phone's got the list. I'll be here."; "Good luck."; M2 reply; written_up "It's all written up. Thanks again."; debrief greeting variant "Anything else, or shall we talk it through?"; D1 to D6 per plan 2.13.
Ama phone: start "Your phone will list what to try next. I'll text if I think of anything."; "Any time."; W1 to W19 (W6b split in two messages); follow-ups: hint_sign_out "Do that first and the connection goes through the box instead."; hint_open_session "The cake works too, if you want it done your way. The rota board is the sure way."; hint_network_view "The box sits on the office network now. The view lists what it can see from there."; hint_injector "The injector in your kit presents as a keyboard. The socket by the desk takes it."; hint_patch_panel "The panel has a spare port. Plug in and see where it lands."; debrief_ready "I'll be at reception."; hint_ports "There's a managed port and a patch panel on the cupboard wall. Try both."; hint_cake (unchanged). Timed texts P0 to P5b per plan 2.10.
Closing card: "Merrin & Sallow: access tour complete." plus credits lines in scenario music event.


## Results (tests run, items 1 to 4 of Open done)
- New file test/controllers/break_escape/demo_access_tour_tasks_test.rb (commits 28590b56a, 16bb88ea5): 17 tests, 132 assertions, 0 failures. Covers t_meet_ama, t_debrief, t_kit, t_front_desk, t_drop_box, t_guest_port, t_julian_pc, t_door_controller, t_comms, t_server_room, t_open_session, t_yasmin_pc, t_staff_wifi: refused before the trigger, accepted after; plus idempotent re-post and unknown id.
- All three demo_access_tour*_test.rb together: 77 runs, 1112 assertions, 0 failures.
- test/js/validator-network-model.test.mjs: new 'full validator reports no unknown errors on demo_access_tour' (commit 8c3a88a0d); file 87 of 87 pass.
- Scoped corpus (tmp/handover/demo_access_build/slice5_corpus.txt): fresh scan 0 findings (2 runs pass); opened scan 0 findings for demo_access_tour; the only failure is the known m09_digital_archaeology stale exceptions (3). 23 runs, 1 failure.
- Condition forms checked against safeEvaluateCondition (npc-manager.js:25, supports && , !, ===, !==, .includes on strings and arrays, dotted data./globalVars. paths; no ||, no parentheses) and the music/credits evaluator (new Function, full JS). All ama_phone and needs conditions use supported forms. Event payloads confirmed: card_cloned.cardName, network_foothold_gained.via 'implant', network_device_refused.reason 'port_security', network_device_unplugged.endedPcIds (array), pc_signed_out.reason/fromPcId. Card name "Lorna Easton FAC card" matches the scenario.
- No scenario edits needed. Item 5 (onceOnly overlap warning on unplug) left as intended.


## Review fixes (commits 818514773, 54a158ba4, and the handover commit)

Finding map (S = structural review, D = dialogue review):
- S-M1: W4 (both lines) gain `and not done_t_julian_pc`.
- S-M2 and D theme 1: W9 and W10 moved above W7 and W8 (Lorna and comms are required). W7 needs `not done_t_unplug` and `(not julian_lost_with_desk or julian_back)`. W8 needs `done_t_door_controller`. Every optional line ahead of W17 appends a tail line pointing at the unplug. Plan hub table has a note.
- S-m1 and D-M3/M4: W6b, W7, W14 to W16 hidden once `done_t_unplug` (the flag the scenario already sets); the ama.ink mid-tour switch needs `not done_t_unplug`.
- S-m2: Ama `taskOnKO` removed; added `koImmune: true` instead, because dropping taskOnKO alone made the validator add a 12th warning (no knockout-safe fallback for t_debrief). Back to 11.
- S-m3: plan 2.12 item 5a says the credits end the mission. S-m4: no change.
- D-M1: route choice states about fifteen and about thirty-five minutes (AC0's figure, not the reviewer's forty); full reply no longer repeats.
- D-M2: D4 rewritten. D-m14 / AC0: D5b now has condition `done_t_julian_pc`, rewritten, plus a neutral fallback branch (unreachable in play). D-m13: D5a add-on conditioned on implant, Staff Wi-Fi or Yasmin's PC.
- D-M5: quick-route look-round reply. D-M6: W13. D-M7: W14 split on a new global `ap_planted` (declared; mapping on `device_hidden:kit_rogue_ap` on ama_phone, no onceOnly). Plan note added.
- D-m1 (A3b cake), m2 (W5 and P0), m3 (W7), m4 (W10), m5 (hint_open_session), m6 (W15), m9 (phone opener), m10 (M1 and D2 full), m11 (keep you right), m12 (D3): done as proposed.
- D-m7/m8 and AC0 item 7: the follow-ups after P5a and P4 removed (targetKnot dropped from both mappings, knots debrief_ready and hint_patch_panel deleted). The reviewer's rewrites for those two knots are therefore moot.
- D-n2: header comment now says Fenlow Managed IT. D-n3: credits line fixed. D-n1 (Ama voice block): not done, optional, belongs with voicing.
- S-n1 to n5, D-n4: no change needed.

New or changed spoken lines, verbatim.
Ama (person):
- "Ama Owusu: And there's a cake in your bag. Put it down in the open plan and see if it gets anyone away from their desk."
- "Ama Owusu: The quick version's about fifteen minutes. The full walk-round is nearer thirty-five, every room and every gadget. Which?"
- "Ama Owusu: The full walk-round, then. Your phone will tell you where next."
- "Ama Owusu: Still going? Your phone's got the list if you need it."
- "Ama Owusu: Go on then. Ask your phone where next."
- "Ama Owusu: Take your time. I'm not going anywhere."
- "Ama Owusu: Go on. The box is out, so anything that needed it in the wall is done for today. The rest is still there."
- D3 last sentence: "Julian's door held only because nobody copied his card."
- D4 "Ama Owusu: A saved connection on the front desk got you into Julian's PC. His door never came into it."
- D5a add-on "Ama Owusu: Anything you'd reached another way stayed up."
- D5b "Ama Owusu: Julian's session didn't go with the box. Connect from a desk you're signed in at and it never needs the box. That's the bit people miss."
- D5 fallback "Ama Owusu: Pulling the box ends what ran through it. Anything you reached another way stays up. That's the bit people miss."
Ama (phone):
- start "Ask me where next whenever you're stuck."
- W5 "Sign out of Delphine's PC before you use that file, so the connection has to go through the box."
- W7 "With Julian's session up, his PC can reach the server network." then "Open the network view at the box and try the door controller, with Lorna's password from facilities.txt."
- W10 "Your copy of Lorna's card should open the comms cupboard. Try it."
- W13 "Back to the front desk. Sign in again, then see what Delphine's USB ports will take."
- W14a "Hide the access point in one of the reception plants, then open its console and copy the Staff Wi-Fi."
- W14b "The access point's in. Open its console from the plant and copy the Staff Wi-Fi."
- W15 "Give it a moment. Thandiwe's about to check her email, and her laptop should join your copy." then "If she doesn't, carry on. The Wi-Fi stops still work after the box comes out."
- tail line after optional hints "Skip any of that you like, and pull the box out when you're ready."
- hint_open_session "The cake might do it too, if they're hungry. The rota board always works."
- P0 "Before you use that, sign out of Delphine's PC."
- Credits (scenario music event, not spoken) "Door controller: reached through the partner's PC, signed in with the password from facilities.txt"

Verification: validator 0 errors, 11 warnings (same set); dialoguelint clean; inkcheck clean on ama and ama_phone; loopcheck over about 30 flag sets (fresh, short, full, unplugged on each route, lost, lost and back, all eight done) no errors; scripted ink driver output read for the W4/W6b/W7/W9/W14/W19 cases and all D5 branches; demo_access_tour*_test.rb 77 runs 0 failures; validator-network-model.test.mjs all pass; scoped corpus (tmp/handover/demo_access_build/slice5_fix_corpus.txt) 23 runs, 1 failure, the known m09 stale exceptions only.
