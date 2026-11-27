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
- Full suites: Rails 1796 runs, 0 failures, 1 skip; JS 508 of 508 files.
- Validator: the lab's output is identical before and after (0 errors). `check_or_in_global_conditions` and `check_action_conditions` report nothing on all 176 scenarios before and after.

## Live proof (keyless server on :3039)

- Game 1376 (`test_capture_log`, beat 6): the first inventory POST rejected in the page. POST 1 at 304 ms was `finding_pair_b` (A skipped), failed; the retry at 1319 ms was `finding_pair_b`; the timer was unfired at 800 ms and fired at 3.3 s; the inventory held B and not A.
- Same page: `evaluateActionCondition` true for ASCII tabs and newlines, false for a no-break space, BOM, NUL and U+2028.
- Games 1373 and 1382 (`lab_physical_pentest`): `door_gate_player_opened` then `room_entered:secure_area` 200 ms later, through the lab's own mappings. Only "Both routes" was shown (gameAlert at 1.8 s, then on screen from about 2 s to 5.5 s); no route line. Game 1374, the same with a 2 s gap: only "Cloned badge" at 0.6 s, and `kp_route_line_shown` true.
- Games 1387 (`test-npc-patrol`, random patrols) and 1391 (`test-npc-waypoints`, single-room waypoints): a held answer released after a move took the target, both as a path and as none, left the move's target, path and following state alone on three NPCs each.
- `test_needs_sims` live capture (game 1394, `needs-baseline-capture.js`, its default span): ran to the end with no page errors; 14 `returned_post` events, no `npc_caught_at_post` (no player at a desk in that profile). The committed baselines predate several slices, so they are not a fair before and after; the per-tick order is pinned by the golden log in `npc-needs-slots`.

Mission row 248 (`test_capture_log`) was added to the dev database for the proof, the way `db/seeds.rb` adds one; nothing else in the database was changed.

## Open

- The "Both routes" line was not driven through Len's real gate with real clicks (the credits were fired as the events the lab's mappings listen to). `PLAYTEST.md` lists it as not yet seen in a scripted run.

## Code review R1 fixes

Source: `LAB_R5_MINORS_CODE_REVIEW_R1.md` (1 minor, 5 nits). Commit `a9ff6cd9a`.

| Item | Change |
|---|---|
| R1-m1 (user's call: option 1) | `hint_clone_opened` waits 1500 ms, the same as `hint_tailgated`. A clone then a tailgate within 1.5 s now gives the one "Both routes" line, not a clone line saying there is no need to follow. The scenario comment and the `PLAYTEST.md` entry say so (the game 77 record keeps its 0.6 s, with the new figure beside it). The Rails test pins the two delays equal and the "both" timer after both. |
| R1-n1 | Route-lines test: `run(T, C, 1550)` expects "Tailgated" only; it fails with `hint_tailgated`'s `setGlobal` removed (checked). Also clone then tailgate at 750, 1000 and 1450 ms expect "Both routes", and at 1600 ms "Cloned badge". |
| R1-n2 | Route-lines test: a failed ERB render throws, so the file fails in place of skipping. `validator-action-condition` prints its skip reason to stderr (it skips only when there is no `ruby`; a render failure there already fails its assertion). |
| R1-n3 | Dispatcher retry comment: the decision holds within the page; a reload after the retries give up fires the timer again and reads the conditions afresh. The older `cancelOnGlobal` during retries gap is a line in `docs/IDEAS_BACKLOG.md`. |
| R1-n4 | Validator test: a `conditionalActions` entry with `\|\|` asserts its soft warning; `desk\|` dropped from the filter. |
| R1-n5 | `check_or_in_global_conditions`: under an action list, a hash is an action only when it has a `type`, as in `check_action_conditions`. A test case (a typeless entry with `\|\|` gets the soft warning) fails without the change. Over all 176 scenarios, the function's output is identical before and after. |

Tests (single files, no lock): `lab-physical-pentest-route-lines` 5 pass, `validator-action-condition` 4, `timer-give-retry` 12, `apply-actions-hint-give` 7; `lab_physical_pentest_secrets_test.rb` 36 runs, 0 failures. Validator on the lab: no ❌ lines. Full suites not run (the orchestrator runs them per merge batch).

Live proof (keyless server on :3039, headless, real clicks through the `playtest-scenario` harness; cloner, vest and Len's badge read with Save done in game; page-side recorder on `gameAlert` and the three globals):

| Game | How | Credits | Lines shown |
|---|---|---|---|
| 1464 | Vest on, parked on tile (6, 2); when the gate opened for Len, a door click (walked to 62 px and clicked) then `enter` at once | clone, tailgate 0.82 s later | "Both routes" only, 1.6 s after the tailgate; on screen 2.5 s after the entry. Before this fix that gap gave "Cloned badge" alone. |
| 1469 | No vest, gate shut; door click then `enter` (the student who only clones) | clone only | "Cloned badge" 1.51 s after the clone, on screen in the records office |
| 1462 | Vest on, door click from 57 px south while open for Len; the click opened the reader's examine screen, so no entry | clone only | "Cloned badge" 1.51 s after the clone |

Games 1462, 1464 and 1469 are new rows in the dev database; nothing else was changed. Standing 57 px south of the door in game 1462 held Len's gate open for over a minute (he could not come back out past the player); the parking-tile recipe of R7 avoids that.
