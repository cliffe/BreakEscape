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


## R2 fixes (commit af843e03e; review SLICE5_R2_REVIEW.md)
Files: scenarios/demo_access_tour/ink/ama.ink, ama_phone.ink (and compiled json), docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md. No scenario.json.erb change. Nothing voiced.

| Finding | Fix |
|---|---|
| M1 | `not done_t_unplug` dropped from W14a, W14b, W15, W16. W15's second sentence splits on `done_t_unplug`. |
| M2 | W6b moved below the comms line (W10), above W7; `not done_t_copy_badge` dropped; split on `has_julian_rdp`. |
| m1 | `VAR told_skip`; skip line shows at most twice; W15 sets no tail. |
| m2 | D2 full-route reply replaced. |
| m3 | Route reply, phone opener, M1 rewritten. |
| m4 | W13 splits on `front_desk_signed_out`. |
| n2 | hint_open_session says "she". |
| n3 | D5a add-on reworded. |
| n4 | Plan W table (W5, W10, W6b, W7, W13 to W15), D2 row, order note and julian_back note updated. |

New or changed lines, verbatim:
- W6b (Copy player, `has_julian_rdp`): "Julian's session went when you signed out at the front desk." / "Connect again from your keyring and it'll go through the box this time. You'll need it for the door controller."
- W6b (otherwise): "Julian's session went when you signed out at the front desk." / "To get it back through the box, sign in there, copy his connection file, sign out, then connect from your keyring."
- W13 (signed out): "Back to the front desk. Sign in again, then see what Delphine's USB ports will take."
- W13 (not signed out): "Back to the front desk. See what Delphine's USB ports will take."
- W15 box in: "Give it a moment. Thandiwe's about to check her email, and her laptop should join your copy." / "If she doesn't, carry on. The Wi-Fi stops still work after the box comes out."
- W15 box out: same first line, then "If she doesn't, carry on to the comms cupboard and come back."
- Phone opener: "Ask me where next any time."
- hint_open_session: "The cake might do it too, if she's hungry. The rota board always works."
- Ama route reply (full): "Ama Owusu: The full walk-round, then. Most people only see half of it."
- Ama M1: "Ama Owusu: Still going? Your phone will tell you where next."
- D2 full-route reply: "Ama Owusu: Have a proper look. I'll be in reception when you're done."
- D5a add-on: "Ama Owusu: Anything you'd reached another way didn't need the box."
Unchanged text: W14a, W14b, W16 (guard only). No repeats of the new lines found in scenarios/ outside this mission.

Checks: validator (--skip-ink --no-graph) 0 errors; 15 warnings, not 11: the extra four are reception pin-distance warnings from the separate scenario commit fb3ca4751 (counter objects), not from this change. dialoguelint clean, inkcheck and loopcheck clean on ama and ama_phone. inkjs driver over fresh, short, full, full unplugged before the AP, lost via Desktop Connect with Lorna done, lost via Copy, desk-held, all done, plus unplugged AP stages: all read as intended; the skip line stops after two asks.


## R3 fixes (commits 760fae2f7 and c04d0840f; review SLICE5_R3_REVIEW.md)
Files: scenarios/demo_access_tour/ink/ama.ink, ama_phone.ink (and compiled json), docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md. No scenario.json.erb change. Nothing voiced.

| Finding | Fix |
|---|---|
| M1 | `told_skip` is now a bool and `last_w` an int (0 to 16). Each optional line sets `w` (W6b both variants 6, W7 7, W8 8, W11 11, W12 12, W13 both 13, W14 both 14, W15 15, W16 16); W15 sets no tail. The skip line shows when `not done_t_unplug and w > 0 and ((tail and not told_skip) or w == last_w)`; `last_w` is stored after every ask. |
| m1 | W6b Copy variant rewritten (split over two phone lines, because the 25-word phone cap flagged the single line at 28). |
| m2 | Plan 2.9 W rows reordered to W1 to W6, W9, W10, W6b, W7, W8, W11 to W19; W4 and W8 conditions folded into their rows; skip-line note updated. Plan 2.10 P0 text fixed, P4 and P5a no longer name knots. Plan 2.13 briefing, M1, M2, D1 to D5b and the D2 look-round reply copied from the built ink; "keep you right" removed. |
| m3 | Switch reply changed. |
| n2 | D2 full-route look-round reply changed. |
| n3 | Phone opener changed. |
| n4 | No change. |

Changed lines, verbatim:
- Skip line (unchanged text, new rule): "Skip any of that you like, and pull the box out when you're ready."
- W6b (Copy player, `has_julian_rdp`): "Julian's session went when you signed out at the front desk." / "Sign out there if you're back on it, then connect from your keyring." / "It goes through the box that way, and you'll need it for the door controller."
- Ama switch reply (M2): "Ama Owusu: Go on then. There's plenty more to see."
- Ama D2 full-route reply: "Ama Owusu: Have a proper look. I'll be right here when you're done."
- Phone opener: "Ask me where next when you need it."
(No word-for-word repeats in scenarios/ outside this mission.)

Checks: validator (--skip-ink --no-graph) 0 errors, 10 warnings. dialoguelint clean after the W6b split (one line-len error before it). inkcheck and loopcheck clean on ama and ama_phone. inkjs driver (scratchpad drv.js): fresh, short, full after comms, full unplugged before the AP, lost via Desktop Connect, lost via Copy, desk-held, all done, W15 box in, stuck at Yasmin with four asks. The skip line shows on the first optional answer, not on the first W15 answer, and comes back on every repeat ask at the same stop (four asks at Yasmin all show it). demo_access_tour*_test.rb 77 runs, 1112 assertions, 0 failures. Scoped corpus (PAYLOAD_SCAN_ONLY=demo_access_tour RUN_OPENED_SCAN=1, 7 files): 54 runs, 1 failure, the known m09 stale exceptions only.
