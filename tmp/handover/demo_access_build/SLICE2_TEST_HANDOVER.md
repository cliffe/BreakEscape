# Slice 2 Rails test handover

File: test/controllers/break_escape/demo_access_tour_test.rb (33 tests, 28 written to plan ids).
Commits: 8be379cf5 (first draft; note it also swept in the builder's then-staged scenario/lorna.ink files because the shared index was dirty, before the builder's own ba7cd987b), then a fix commit (see git log).

## Run
MAIN=<main checkout>; BUNDLE_PATH=$MAIN/vendor/bundle flock $MAIN/tmp/tests.lock env RBENV_VERSION=2.7.8 bin/rails test test/controllers/break_escape/demo_access_tour_test.rb
The lock queues behind full train-checks (30+ minutes). The run itself takes 8 s.

## First run: 33 runs, 22 failures. Fixed in the file but NOT re-run
- plant failed "Jack not reachable": meeting_room was locked. plant_box and the find_jack test now open_rooms('meeting_room'). (Most failures.)
- bootstrap legitimately carries meeting_room `requires` (VISITOR-07); test now asserts server_room has none and the only requires value is VISITOR-07.
- clone_card answers no 'recorded' key on a refusal (nil, not false): switched to refute.

## Still to fix after the re-run
- 'no NPC creds or role...' test: the room answer carries Lorna's rfidCard {name, card_id FAC-LORNA-01, rfid_protocol}. That is the card data the clone needs (plan allows it). Remove the refute_includes lorna_card_id in that test (and keep the bootstrap one only if the bootstrap omits it).
- player_state growth test: leaf count 132 -> 145 after three repeats. Find which key grows (likely signedInPcs/sessions/loginFailures counters or recorded clones/triggered keys); compare per key, then decide whether it is a real finding (state grows per cycle) or a test artefact (counters). Report to AC0 if real.
- Check the remaining failures after the first fixes (output of the first run is in the task output; rerun to see).
## Scenario findings so far
None yet that are scenario faults. rfidCard on the NPC reaches the client by design.

## Status (after aa776e571): GREEN, 33 runs, 709 assertions, 0 failures
- rfidCard in room answers is by design (same as access_model_no_password_test); the refute was dropped with a comment.
- player_state growth closed by AC0 (first-draft plants while meeting_room was locked).
- Refused shares answer 404 (same as an invented id), not 403; tests now assert that. The network view's 'open' flag is static (no access rule), so Finance stays false.
