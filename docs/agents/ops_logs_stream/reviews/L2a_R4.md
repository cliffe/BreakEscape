# L2a delta review R4 (the tidy pass after R3)

Reviewer: read-only delta review at branch head `904056402` (`ops-logs`) of commits `8f0d22ef0` (R3-5),
`d026849aa` (R3-1, R3-2), `05621a739` (R3-3, R3-4), `ed6c3cebc` (R3-6), `a87ddd8b8` (R3-8), `c9b94ab5a` (P1),
`cd95f98e6` (P4). Previous findings: `L2a_R3.md`.

Short names: `scanner` = `tools/playtest/lib/access_leak_scanner.rb`, `sut` =
`test/unit/access_leak_scanner_log_rows_test.rb`, `events.rb` = `lib/break_escape/ops_log_events.rb`,
`ops_log.rb` = `app/models/break_escape/ops_log.rb`, `game.rb` = `app/models/break_escape/game.rb`,
`lrt` = `test/controllers/break_escape/log_rows_test.rb`, `ost` =
`test/controllers/break_escape/ops_logs_scenario_test.rb`, `olt` = `test/models/break_escape/ops_log_test.rb`,
`scan` = `test/support/log_rows_body_scan.rb`, CSS = `public/break_escape/css/ops-log-minigame.css`,
PLAN = `docs/achitechture/OPS_LOG_ROWS_PLAN.md`. Line numbers are at `904056402`.

What was run: nothing. No Ruby test, no node test, no browser (the train check holds the tree and the test
lock). Everything below is from reading the commits and the files at the head. The fixer's two mutation
proofs and its headless CSS check are its claims; I looked at its two phone screenshots
(`.../scratchpad/l2a-tidy/after-phone-390x844.png` and `-scrolled-right.png`) and they show what it says.
Nothing was written in any worktree.

## Severity count (new findings)

| Severity | Count |
|---|---|
| blocker | 0 |
| major | 0 |
| minor | 2 (R4-1, R4-2), both optional hardening of the playtest leak check |

## Verdict

**Ready to land.** No fix pass is needed. R4-1 and R4-2 can ride with L2b (which edits the scanner's
`/log_rows` rule anyway for seed rows) or be dropped. P2 stays a question for the user.

## 1. R3-1 to R3-8 and P1 to P4

| Id | Status | Checked at | Note |
|---|---|---|---|
| R3-1 | confirmed | `scanner:1963-1972`; `sut:68-75`; `game.rb:3524`, `:3535`, `:4521`, `:4556`, `:4600`; `ops_log.rb:425-442`, `:469-481`; `events.rb:25-32` | The line is right. See section 2. |
| R3-2 | confirmed | `scanner:1998-2001`, `:2021-2022`; `sut:77-83` | Works for the server's one format. Two optional hardenings: R4-1, R4-2. See section 3. |
| R3-3 | confirmed | `scan:1-26`; `ost:3`, `:12`, `:154-158` | `ost`'s only `/log_rows` request is in `read` (`:155`), which now calls `assert_body_holds_no_secret` (substring compare on the text cells). The old exact-match helper (`ost:169-175`) is still called as well; nothing removed. |
| R3-4 | confirmed | `lrt:401-404` (`read` then `assert_response :not_found`); `lrt:397-399`, `:472-474` | The foothold class's `read` is `read_log_rows`; a refusal has no rows, so its whole body is scanned. |
| R3-5 | confirmed | `events.rb:59`; `olt:1006-1021`; `ost:205`; `docs/ACCESS_AND_NETWORKS.md:719` | See section 4. |
| R3-6 | confirmed | PLAN:172, :300, :389 | `title` gone from both lists; `relay` named. The `gc.rb:1900` comment is left on purpose (shared file), as R3 advised. |
| R3-7 | withdrawn fairly | `L2a_R3.md` R3-7 text ("Otherwise drop the return value or leave it; no fault") | The finding was conditional on a wider reading of ruling F4; the select reading ALL meets the ruling. |
| R3-8 | confirmed | `test/js/validator-log-sources.test.mjs:308-316` | A reader in a PC's `contents`: undeclared source is an error, declared source is clean. Both directions asserted, so it can fail. Not run by me. |
| P1 | confirmed | CSS:50, :52, :63, :123; the two screenshots | See section 5. |
| P2 | left for the user | PLAN:1186-1187; `events.rb:31-32`; `game.rb:3716`, `:3911` | Reading confirmed. See section 6. |
| P3 | withdrawn fairly | `public/break_escape/js/minigames/ops-log/ops-log-minigame.js:219-223` | Ordinary `<select>` elements built with `aria-label`; a native select's popup is not drivable by key events in a headless shell. A harness limit. |
| P4 | confirmed | `scenarios/test_ops_logs/PLAYTEST.md:92`, `:106`, `:123`, `:164`, `:188`, `:194`, `:207` | Wording only. PLAYTEST:209 states the detail as `route: keyboard, method: password`, which is the order the screenshot shows. |

## 2. R3-1: is the exemption line right?

How each sign-in event builds `as`, and what the answer shows (`ops_log.rb:425-442`: an account shows as
`normalise_username(account)`, typed text shows as stored):

| Event | Stored `as` | Written at | Detail in the answer | Scanner |
|---|---|---|---|---|
| `signin_ok` | `{ account: }` (`ops_account_as`) | `game.rb:4600` | always `method` and `route` (both always written, both shown) | judged |
| `signin_fail` | `{ typed: }` | `game.rb:4521` | none | exempt |
| `signin_lockout` | `{ typed: }` | `game.rb:4556` | none | exempt |
| `signin_refused` blocked | `{ typed: }` | `game.rb:3524` | none | exempt |
| `signin_refused` denied | `{ account: canonical username }` | `game.rb:3535` | none | exempt |

- **The one account row on the exempt side is the `denied` refusal, and it is correctly exempt.** It is
  written only after `account_for_username(normalised)` found the account AND the password matched
  (`game.rb:3530-3535`). The cell shown is the canonical username normalised, which is equal to the player's
  own typed username normalised. So the cell holds nothing the player did not type, and the row tells the
  player nothing new (they already hold the right password, and the 422 `notPermitted` answer has told them
  the account exists). The fixer's comment says the row "looks the same" as a typed one; more exactly, the
  result word `DENIED` does mark it in the answer, but there is nothing to gain from judging it, because its
  value is by construction the typed text. Whether that equality is "the server's design so a row never
  confirms an account" is half right: PLAN:1203 ("never ... which account a typed username belongs to") is
  kept by fail, lockout and blocked rows storing typed text whether or not the account exists; the denied
  row is the plan's own exception (PLAN:1184, `{ account: }`), reached only with the right password.
- **A session row or a badge row cannot fall on the exempt side.** The test is `event == 'SIGN_IN'`; session
  rows are labelled `SESSION` and badge rows `BADGE` (`events.rb:24`, `:31-32`). Both stay judged.
- **A successful sign-in cannot fall on the exempt side.** `signin_ok` always carries `method`
  (`game.rb:4601`), the registry shows it (`events.rb:26`, no `show: false`), and the regexp
  `(\A|, )method: ` matches it in either position (the live answer is `route: keyboard, method: password`). A
  merged row (`OK x2`) keeps its detail.
- **A typed row cannot fall on the judged side.** No typed sign-in event has a detail today. When S5c adds
  `kind` to the denied refusal (PLAN:1184) the row still has no `method:`, so it stays exempt, which is
  still right for the reason above.
- Only the `as` cell is blanked; a secret in the same row's `where` or `detail` is still a finding
  (`sut:65`, unchanged).
- The new test (`sut:68-75`) uses the server's shapes: an OK row with `method: password, route: keyboard`
  and a clean account (no finding), with a secret in `as` (finding), with a raw id in `as` (finding), and a
  lockout row (`OK`, no detail, a password as `as`: no finding). It fails if the detail test is removed.

## 3. R3-2: can a stored-only key hide from the split?

`ops_log.rb:469-481` is the only writer of the string: pairs `"#{key}: #{shown}"` joined by `", "`. The
scanner splits on `/,\s*/` and takes the text before the first `": "`, stripped, and compares it exactly
with `LOG_STORED_ONLY_KEYS`.

- In the server's format it cannot hide: any position in the string is seen; keys match `CODE_PATTERN`
  (lower case, `events.rb:47`), so case is not a way round; the compare is exact, so a key that is a prefix
  or an extension of a listed one (`flaggedx`, `bypass`) is not confused with it either way.
- Values are never nested: a detail value is a code, a count, an id (shown by name) or an alias
  (`events.rb:41`), and each is shown through `to_s`.
- A value that itself holds `, flagged: 1` would be reported: the safe side.
- It would hide only if the string format changed (`flagged=1`, `flagged:1`, `;` between pairs). Nothing
  writes that. Optional hardening: R4-1.
- **The key list is hand-kept, and it is a deny list, not an allow list.** There is no list of allowed
  detail keys in the scanner. `LOG_STORED_ONLY_KEYS` (`scanner:1961`) names `flagged` by hand; the registry
  marks it with `show: false` (`events.rb:24`). A later event that adds a second hidden key will not be seen
  by the scanner until someone adds it to the list. R4-2.
- The whole detail string joins the secret texts (`scanner:2021`); the test's secret `Ledger, Dana-7`
  (`sut:81-82`) is cut in two by the split and found only through the whole string, so that line is proved.

## 4. R3-5: the door name order

- `events.rb:59`: `[room['door_sign'], room['name']].find { non-empty String } || id`; the id then becomes
  the kind word in `ops_log.rb:456-459`. Matches the R3 ruling in the stream brief.
- `olt:1006-1021` walks: neither (kind word), name only, both (sign wins), empty sign (name), sign only. Five
  steps, one more than before; no step was dropped (the old "empty name falls through to the sign" step is
  replaced by its mirror "empty sign falls through to the name" plus "sign only").
- Nothing still states the old order as current: `docs/ACCESS_AND_NETWORKS.md:719` and `ost:205` are
  updated; PLAN and `scenarios/test_ops_logs/PLAYTEST.md` do not state an order (no `door_sign` in either).
  The old order remains only in the stream brief's R2 ruling (`OPS_LOGS_STREAM_BRIEF.md:67-69`), which the
  R3 ruling below it says it replaces, and in earlier review files (history).
- It now agrees with the two other places that name a room: `network_access.rb:563` and the client
  (`test/js/engine-fixes-pass3.test.mjs:56`, "door_sign, then name").
- `ost:204` still expects `Finance office` and `Security office`; the scenario's rooms must give those under
  the new order. Not run by me; the train check will show it.

## 5. P1: the CSS

- CSS:52 `min-width: 760px` (was 0); CSS:63 `white-space: nowrap` on headers; the
  `@media (max-width: 600px)` rule that hid DETAIL is gone (CSS:123 is a comment). The frame
  `.ol-table-wrap` already had `overflow: auto` (CSS:50), so the table scrolls inside it and the page does
  not.
- Pixel-art rules: the file's only `border-radius` values are 0 (CSS:43, :115); no blur, shadow, or font
  added by this commit.
- Desktop: nothing changes where the frame is 760px or wider (the table is `width: 100%` there, the headers
  were already on one line). Between 600px and about 760px of frame width the table now scrolls sideways
  where before it squeezed; that is the same fix applied a little wider, not a regression.
- Screenshots at 390 x 844: TIME, EVENT, IDENTITY at rest; LOCATION, RESULT, DETAIL after scrolling; headers
  whole, `SIGN_IN` and `SESSION` unbroken, a horizontal bar inside the frame. `.ol-cell` keeps
  `overflow-wrap: anywhere` (CSS:76-77), so a very long single word (a 32-character typed username) still
  wraps inside its cell; that is wanted.
- `git diff --stat main ops-logs -- public/break_escape/js/minigames/log-filter/` is empty.

## 6. P2: `session_lock` and `session_end`

Reading confirmed. PLAN:1186 (`session_end`) and PLAN:1187 (`session_lock`): both `as { account: }`, where
`pc`, result `ok`, detail none. `events.rb:31-32` gives both the label `SESSION`. The code lost nothing; the
viewer shows two rows that differ only by position.

Least invasive change if the user wants them told apart: give `session_lock` its own label in its one
registry line (`events.rb:32`, `label: 'LOCK'`), with PLAN 13.8 and the PLAYTEST beat 10 wording. The label
is display only: sources match by event-name prefix (`session_*`, PLAN:1175), stored rows hold the event
name, and nothing in code compares the word `SESSION` (grep: only the two registry lines). No stored data,
golden, or detail rule changes; the EVENT filter gains one value.

## 7. Tests not weakened

`git diff 09d1ad64b ops-logs -- test`: the only removed lines are (a) the `LogRowsBodyScan` module moved
verbatim from `lrt:8-31` to `scan` (same two methods, same assertion), (b) the direct `get` at the old
`lrt:427` replaced by `read`, (c) the door test's steps re-ordered for the new ruling (section 4), (d) one
assertion message. No test deleted, no assertion loosened. Added: two scanner tests, one validator test, one
door step, the scan in `ost`'s `read`.

One direct `get` of `/log_rows` remains outside the scan, `lrt:84` (the `object_id[]` 400). R3 counted that
area as covered (`lrt:82-86`) and did not name it; a 400 for a malformed param has no rows. No action.

## New findings

**R4-1 (minor, optional). The detail-key split trusts one separator.**
`scanner:1998-2001`. A stored-only key is seen only in the form `key: value` between `, `. That is the only
form the server writes (`ops_log.rb:478-480`), so nothing hides today. If the playtest check is meant to
catch a future change of that format as well, scan for the word instead of splitting:
`row['detail'].to_s.scan(/\b([a-z][a-z0-9_]*)\s*[:=]/).flatten`, compared with the same list. One line; the
existing test still holds. Can be dropped.

**R4-2 (minor). The hidden detail keys are hand-kept in the scanner.**
`scanner:1961` lists `flagged` by hand; the registry is where a key is marked hidden (`show: false`,
`events.rb:24`). A second hidden key added by a later stage would be passed by the scanner in a detail
string until the list is edited. Fix: add the registry's hidden keys to the list when the registry is
loaded, for example
`LOG_STORED_ONLY_KEYS | BreakEscape::OpsLogEvents::EVENTS.values.flat_map { |e| (e[:detail] || {}).select { |_k, r| r.is_a?(Hash) && r[:show] == false }.keys }`
behind the same `defined?` guard `log_secrets` uses (`scanner:1975`), with one unit test that stubs an event
with a hidden key. Fits the L2b pass, which touches this rule for seed rows. Note for whoever does it: the
hand list also holds `p`, `by` and `last`; a later shown detail key with one of those names would be a
false finding, so check new detail keys against it.

## Checks not completed

- No test was run (instruction). `sut`, `olt`, `ost`, `lrt` and the validator node test are confirmed by
  reading; the train check running on this branch is the proof that they pass.
- The fixer's two mutation proofs were not re-run; each was checked by reading which assertion would fail.
- The CSS was checked by reading and by the fixer's screenshots, not by a browser run of mine; the desktop
  screenshot was not opened.
