# Lab follow-up R5 minors: build log

Answers q50 ("fix all now"). Source: `docs/achitechture/PHYSICAL_PENTEST_ACCESS_FOLLOWUP_CODE_REVIEW_R5.md`. Branch `build/lab-r5`.

## What changed

| Item | Review id | Change |
|---|---|---|
| Timer gives paired by action, not position | E5-m4 | `apply-actions.js`: each give_item promise carries the action it ran as `.action`. `scenario-timer-dispatcher.js`: pairs each promise with `p.action`; the old `timer.actions.filter(...)` by index is gone. A retry re-applies that action without its `condition`: the give already passed its condition when the timer fired, and re-reading it could drop the item and count the retry as settled. |
| One ASCII whitespace set | E5-m1 | `utils/global-condition.js` and `scripts/validate_scenario.rb`: the action-condition regexes use `[ \t\n\r\f\v]` in place of `\s`, and both sides trim that set only (no `trim()`, no `strip`). A no-break space, byte order mark, line separator or NUL is now refused by both. |
| Validator `\|\|` exemption | E5-m2 | `check_or_in_global_conditions`: an action list passes `:action_list` to itself, its entries become `:action`, and an `:action` hash skips only its own condition and walks its children with no context. A lighting, torch or chatBackground block nested inside an action (a give_item's item) is checked again. |
| Dead caught check on arrival | E5-m3 | `npc-needs.js`: the `_checkCaught` on arrival is removed (the per-tick check runs first on the same tick); the comments say why, and why the per-tick check is `goto_target` only. |
| Late route answers, older patrols | E5-m5 | `npc-behavior.js`: `chooseWaypointTarget` (single-room) and `chooseRandomPatrolTarget` capture the target before the request and drop an answer for a target since replaced. |
| "Both routes" line | L5-m1 (user approved) | `lab_physical_pentest`: new global `kp_route_line_shown`, set by `hint_tailgated` and `hint_clone_opened`; new timer `hint_both_routes` (on `kp_badge_tailgated`, 1.6 s, `globalVars.kp_records_cloned && !globalVars.kp_route_line_shown`), after the two in the list. It covers the whole silent window: the tailgate up to 0.6 s after the clone, or the clone up to 1.5 s after the tailgate. Exactly one of the three lines shows for any order and gap. |
| Route-line truth table | L5-m2 | The Rails lambda that tested itself is gone; a node test runs the lab's rendered timers through the real dispatcher. |

Voicing: the new line is a `hint` toast (on-screen only). `TtsLineExtractor` voices person-chat ink, object `voice` text, voiced calls and chatter, never hints, so it needs no clip. Line for the record, title "Both routes": "Both routes counted: the reader accepted your copy of Len's badge, and you walked in on his read in the hi-vis. The debrief lists both findings."

Test scenario beat: `test_capture_log` beat 6 (timer `finding_pair`, two gives, the first conditioned on a global nothing sets). The validator warns that the timer has more than one give (expected for this beat) and that a give_item has a condition.

## Tests

- `timer-give-retry`: 12 pass (3 new: promises carry their action; skipped first give plus a lost second give retries B; a give whose condition stops holding is still retried). The two dispatcher cases fail on the old dispatcher.
- `validator-action-condition`: 4 pass. New BAD cases (Unicode spaces, NUL) and GOOD cases (every ASCII space); the old engine fails the first test, the old validator fails tests 1 and 3, and the old exemption line (or none) fails test 3.
- `npc-needs`: 61 pass (1 new: no caught event while the owner fetches the item on `goto_item`; fails with the phase term dropped). `npc-needs-slots` (golden log) 19, `npc-needs-work` 51, `npc-needs-usb-policy` 7 pass.
- `npc-route-multiroom`: 24 pass (3 new: late path and late "none" on a single-room waypoint patrol and a random patrol; the waypoint patrol still takes its own answer). The two late-answer cases fail with the guards removed.
- `lab-physical-pentest-route-lines` (new): 5 pass; fails with the `setGlobal` removed.
- `lab_physical_pentest_secrets_test.rb`: 36 runs, 0 failures.
- Validator: the lab's output is identical before and after (0 errors). `check_or_in_global_conditions` and `check_action_conditions` report nothing on all 176 scenarios before and after.

## Live proof (keyless server on :3039)

- Game 1376 (`test_capture_log`, beat 6): the first inventory POST rejected in the page. POST 1 at 304 ms was `finding_pair_b` (A skipped), failed; the retry at 1319 ms was `finding_pair_b`; the timer was unfired at 800 ms and fired at 3.3 s; the inventory held B and not A.
- Same page: `evaluateActionCondition` true for ASCII tabs and newlines, false for a no-break space, BOM, NUL and U+2028.
- Games 1373 and 1382 (`lab_physical_pentest`): `door_gate_player_opened` then `room_entered:secure_area` 200 ms later, through the lab's own mappings. Only "Both routes" was shown (gameAlert at 1.8 s, then on screen from about 2 s to 5.5 s); no route line. Game 1374, the same with a 2 s gap: only "Cloned badge" at 0.6 s, and `kp_route_line_shown` true.
- Games 1387 (`test-npc-patrol`, random patrols) and 1391 (`test-npc-waypoints`, single-room waypoints): a held answer released after a move took the target, both as a path and as none, left the move's target, path and following state alone on three NPCs each.
- `test_needs_sims` live capture (game 1394): see below.

Mission row 248 (`test_capture_log`) was added to the dev database for the proof, the way `db/seeds.rb` adds one; nothing else in the database was changed.

## Open

- The "Both routes" line was not driven through Len's real gate with real clicks (the credits were fired as the events the lab's mappings listen to). `PLAYTEST.md` lists it as not yet seen in a scripted run.
