# TIDY_R1: delta review of the post-landing tidy pass (6afbe1496..78df00697)

Reviewer read-only. Ran: `access_leak_scanner_test`, `access_leak_scanner_ops_access_test`, `access_leak_scanner_ops_access_real_test` (in test/controllers), `ops_access_scenario_test` (160 runs, 1275 assertions, 0 failures); node `dungeon-graph-ops`, `compromise-marks`, `desktop-remote-view`, `network-view-techniques`, `ops-unchanged-validator` (all pass). Nothing in the tree was written except this file.

## Check 1: each finding id against its diff

| Id | Verdict |
|---|---|
| R3-1 | Closed. `return nil` when the pool spans more than one host id (fails closed); `ops_host_labels` now counts non-networked sign-in objects too, so a shared label names no PC. Both only remove credit. |
| R3-2 | Closed for the three desktop endings (network-links.js:141-146, test loops both trip kinds). The second half of the finding (a share closed on a world trip reopens `trip.pcId`'s desktop, not the desktop the share came from after a Connect) is NOT changed; the outcome row says so in passing ("is not changed"). Open minor, see T-3. |
| R3-4 | Closed (real-run test, 10 runs, passes). |
| R3-5 | Closed. Vacuous line (`state['sessions'].keys.count`, hash keys are unique) removed with no coverage lost; conditional asserts at the old :440/:522 made plain; beats 10, 10a, 14, 15, 16 now assert what the finding listed. The dropped folder line covered a folder id that does not exist in the scenario (grep: 0 hits); the folder refusal is not replaced inside this scenario, as the finding allowed. |
| R3-6 | Closed (tests per rule in `access_leak_scanner_ops_access_test.rb`). |
| R3-7 | Closed (a) `scan_ops_room_keys`, (b) `scan_ops_unswept_blocks`; both only add reports. |
| R3-8 | Closed. Counter loop is the same shape as the weakness nodes. `dungeon-graph-ops.test.mjs` exists and passes. |
| R3-9 a, b, c | Closed (docs, see check 6). |
| R3-9 d | NOT done, and reported as not done in the S2S3_R3 outcomes row. Section 6 coverage matrix (`docs/ACCESS_AND_NETWORKS.md:2123`) still has no N12 to N15 rows. Open minor, see T-2. |
| R4-1 | Closed. Bolt added to `sprite._fadeCompanions` at mark, removed before destroy. |
| R4-2 | Closed (`!!get()`, `!!sprite.visible`). |
| R4-3 | Closed (four tests added). |
| R4-4 | NOT done and NOT in the outcomes table (the table lists R4-1, 2, 3, 5, 6 and R3-2 only). `compromise-marks.js:129-131`: a sprite with no `visible` anywhere still loses the value set while wrapped. Stub-only, see T-1. |
| R4-5 | Closed with a gap, see T-4. |
| R4-6 | Closed, see check 2. |

## Check 2: leak scanner and check script

No loosening found. Every change either adds a report (R3-7 room keys, unswept block rules), removes a credit (R3-1 fail closed, `ops_host_labels` widened so more labels resolve to no PC), or refuses a run (order guard, game guard, exit 2 before judging). No substring, label or step was relaxed. The old file-order comparison (first time vs first time) is replaced by first vs last of the previous timed file, which is strictly stricter.

Legitimate runs: several files one after another, oldest first, one game: accepted (equal boundary time passes, `<` is strict; the test covers touching and following files, an untimed file between, an empty file). Wrongly refused: only two captures that overlap in time (two tabs recording at once) and a capture file holding rows of a second game (for example a browser tab that recorded the old game's paths before `swap-scenario-game.rb`). Both exit 2 with a message that says what to do; fail closed, acceptable.
Out of order or foreign run slipping through: see T-4 (unsorted rows inside a file) and T-5 (rows with no `/games/<n>/` path are never judged for game). Game ids are numeric (test games are 5 digits), so the `(\d+)` pattern is right.

- T-4 (minor) `tools/playtest/lib/access_leak_scanner.rb:234,242`: `prev` keeps `times.last` and `times.first`, not the max and min. A file whose rows are not in time order (a merged file sorted wrongly, or a recorder race) makes the span too narrow and an overlap passes. Fix: use `times.max` and `times.min` (ISO text sorts), and compare each file's `min` with the previous file's `max`.
- T-5 (minor, informational) `access_leak_scanner.rb:253-256`: `game_mismatch_problem` only sees rows whose `path` carries `/games/<n>/`. Rows without it (bootstrap pages, non-game paths) cannot be attributed, so a foreign capture is caught only when at least one game-path row is present. That is every real capture; no fix needed beyond a comment. The check refuses on the first foreign row, so one stray row refuses the whole run (fail closed).

## Check 3: tests

- `ops_access_scenario_test.rb`: removals are the vacuous hash-key count, the non-existent folder request, and two `if key?` conditionals (now unconditional, and the `implant_desk01` one now asserts `via`). Added assertions only. Real behaviours still covered. Weak spot, T-6 (minor): `ops_access_scenario_test.rb:507` `assert_includes [403, 404], response.status` accepts either status for the dropped foothold's view; pin the one the server returns.
- `access_leak_scanner_test.rb`: removed lines are only the fixture reads replaced by copies carrying the test game's id (needed by R4-6); the order test still asserts 0 for ordered files and 2 and no VERDICT for rotated ones. Not weakened.
- Real-run scanner test (10 runs) and `dungeon-graph-ops.test.mjs` (7 tests) can fail: the first injects ten distinct faults and asserts findings; the second compares exact edges, the committed graph and a collision case; builder's mutation notes are credible and the structure supports them. Not re-mutated here.
- `ops-unchanged` fixture: old (`6afbe1496`) and new (`78df00697`) JSON compared by script after deleting the keys `graphMdHash` and `graphHtmlHash` everywhere: identical. 32 such keys added = 16 scenarios x 2. Nothing else changed. The test passes against it.

## Check 4: client

- Nothing in the client diff touches a request: only scroll calls, a landing table, `visible` handling and `_fadeCompanions`. No `import` line is added or changed in any of the four public files, so no harness copy list needs a new entry.
- Bolt fade: `behind-wall-fade.js:299-306` iterates `_fadeCompanions` only for sprites that reach the back-wall strip, once per candidate per pass, guarded by `c.scene`, `c.active`, `c.visible`; the cost follows marked objects at the strip, not room count. Release is guarded by `sprite.scene` and a try, so a bolt destroyed at unmark leaves a harmless record. Visibility follows through the wrapper with no per-frame work.
- Phone width: `scrollIntoView({block:'nearest'})` moves nothing when the element is already visible, which is the desktop case; `scroll-margin-bottom` affects only scrolling. No layout rule changed. Minor T-7: any non-empty notice scrolls into view, including one set by a redraw after the player scrolled elsewhere; harmless but a behaviour the finding did not ask for in that breadth (the table says it was intended).

## Check 5: graph script

Regenerated `test_ops_access` and `test_ops_findings` into the scratch folder: `dungeon_graph.json`, `.md` and `.html` byte-equal to the committed files (scenario folder name normalised). `test_ops_access` is the only scenario with technique cards; the other 15 scenarios are covered by the `ops-unchanged-validator` test, which passes.

## Check 6: docs

N15 "Check from the server", "Shown in" and the section 7 bullet match the scanner as read: per-thing steps, ambiguous grant earns nothing, label resolves to a PC only when unique, not-taken-back cases, the new room-key and unswept-block rules, order/overlap/game refusals. `network_technique_hostile_test` and `network_technique_blocked_host_test` exist. PLAYTEST.md beat 19 now names pre-ops scenarios (`test_access_networks`, `test_access_keyring`, `lab_physical_pentest` H5.15, H5.16, H5.20). HANDOVER_core_13b.md counts (30, 7, 10) not re-counted; the sum of runs in the tests passes.

## Findings list

- T-1 minor (R4-4 unreported, unfixed) `public/break_escape/js/systems/compromise-marks.js:129-131`: track whether a value was ever set and write it back at unfollow when `!desc`; or state in the outcomes table that R4-4 is declined.
- T-2 minor (R3-9 d, reported not done) `docs/ACCESS_AND_NETWORKS.md:2123`: add N12 to N15 rows to section 6.
- T-3 minor (R3-2 second half, left open) `public/break_escape/js/systems/network-links.js` share landing: remember the PC whose desktop opened the share (Connect inside a trip). Not reachable in `test_ops_access`.
- T-4 minor `access_leak_scanner.rb:234,242`: use min and max of the file's times.
- T-5 minor/info `access_leak_scanner.rb:253`: game guard sees only rows with a `/games/<n>/` path; add a comment.
- T-6 minor `ops_access_scenario_test.rb:507`: pin the status.
- T-7 minor `network-view-minigame.js` `setNotice`: every non-empty notice scrolls; consider limiting to notices from a user action.

## Count

blocker 0, major 0, minor 7 (T-1 to T-7; T-2 and T-3 are known open items reported by the builder, T-1 is unreported).

## Verdict

Land. Every fix does what its finding asked, no scanner rule is loosened, no test is weakened, the fixture changed only by the two hash fields per scenario, graphs regenerate equal. Open: R4-4 is missing from the outcomes table; add a row or fix it.

## Not completed

No mutation re-run of the builder's claimed mutations; the Rails suite beyond the four files named above; HANDOVER test counts not re-counted; no browser.

## Outcomes (tidy fix pass)

| Item | Result |
|---|---|
| T-1 (R4-4) | Fixed in `compromise-marks.js` (`_followVisibility`): a `wasSet` flag is set by the wrapper's setter and the value is written back at unfollow when the sprite had no `visible` anywhere. Node test "R4-4" fails without the change (mutation: back to `own`) and passes with it. R4-4 (b), the own-property-versus-prototype-accessor case, needs no fix (unreachable on a Phaser sprite). |
| T-2 (R3-9 d) | `docs/ACCESS_AND_NETWORKS.md` section 6: rows N12 to N15 added (N12 from its "Shown in" line and the three `test_ops_*` scenarios that carry rows; N13 to N15 in the `test_ops_*` scenarios that hold `discovery`, `weaknesses` and `technique_card`, found by text search). |
| T-3 | Declined: no reachable case in a built scenario (the review itself says it is not reachable in `test_ops_access`). |
| T-4 | Fixed: `file_order_problem` uses each file's min and max time. Test "T-4" has unsorted rows inside a file that overlaps the next file (refused) and one that follows (accepted). |
| T-5 | Comment only, above `game_mismatch_problem`. |
| T-6 | `ops_access_scenario_test.rb` now asserts `:not_found` (404, the status the engine gives) for the dropped foothold's view. |
| T-7 | Intended; no change. |
