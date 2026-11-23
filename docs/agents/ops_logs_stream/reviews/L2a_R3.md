# L2a delta review R3 (client R1 fixes and R2 fixes)

Reviewer: read-only delta review at branch head `1f4fc31f0` of commits `e262b6848`, `5f07c654b`,
`140aef76e`, `17f9b9054` (client R1) and `896e832d1`, `83b549392`, `c956f2f73`, `3ed1f9667`,
`549dcd14f`, `c587d49c4`, `9ad9caee6` (R2). Previous findings: `L2a_client_R1.md`, `L2a_server_R2.md`.

Short names: JS = `public/break_escape/js`, CSS = `public/break_escape/css`, `gc.rb` =
`app/controllers/break_escape/games_controller.rb`, `ops_log.rb` = `app/models/break_escape/ops_log.rb`,
`events.rb` = `lib/break_escape/ops_log_events.rb`, `lrt` = `test/controllers/break_escape/log_rows_test.rb`,
`olt` = `test/models/break_escape/ops_log_test.rb`, `ost` = `test/controllers/break_escape/ops_logs_scenario_test.rb`,
`scanner` = `tools/playtest/lib/access_leak_scanner.rb`, `viewer` = `JS/minigames/ops-log/ops-log-minigame.js`,
`rows.js` = `JS/minigames/ops-log/ops-log-rows.js`, `vt` = `test/js/ops-log-viewer.test.mjs`,
PLAN = `docs/achitechture/OPS_LOG_ROWS_PLAN.md`. Line numbers are at `1f4fc31f0`.

What was run (nothing written in the worktree; `git status` shows only this file):
- node: `ops-log-viewer`, `validator-log-sources`, `validator-ops-log-sprite`, `log-filter-selected-row`,
  `log-filter-wording`: each file PASS.
- Ruby, under the shared lock: `ost` and `test/unit/access_leak_scanner_log_rows_test.rb` together:
  22 runs, 200 assertions, 0 failures.
- `ruby scripts/validate_scenario.rb scenarios/test_ops_logs/scenario.json.erb --skip-ink --no-graph`: 0 errors,
  1 warning (the existing `maxAttempts` one).
- Not run: `lrt`, `olt`, `bin/ops-golden-compare`, any browser (see "Checks not completed").

## Severity count (new findings)

| Severity | Count |
|---|---|
| blocker | 0 |
| major | 0 |
| minor | 8 (R3-1 to R3-8) |

Previous findings: 39 ids (client F1 to F5, m1 to m12, the validator sprite exemption; R2 N1 to N7, S1 to S6,
D1 to D3, plus the A24 validator line). Confirmed fixed 35; left by ruling or accepted 3 (client m3, client m10,
N4); fixed with a small residue 1 (N3: one direct `get` still unscanned, R3-4); not fixed 0; fixed wrongly 0.

## Verdict

**Ready to land after the playtest.** No blocker or major. The eight minors are optional before landing; the
two that touch the leak check (R3-1, R3-2) are each a few lines in `scanner` and are worth doing in the L2b
tooling step at the latest, since L2b adds seed rows and the flag flow to the same answers.

---

## 1. Every previous finding

### Client R1 (`L2a_client_R1.md`)

| Id | Status | Checked at | Note |
|---|---|---|---|
| F1 | confirmed fixed | `viewer:282` (`ol-table` only), `:316`, `:325` (`ol-row` only), `:332`; `CSS/ops-log-minigame.css:72-84` | No `lf-` class or `log-filter` name anywhere in the viewer, `rows.js` or the stylesheet (grep empty). `.ol-cell` has `white-space: normal; overflow-wrap: anywhere; word-break: break-word`, and no stylesheet rule on the page now outranks it for these elements. See section 2 for the look. The fixer's probe was not re-run. |
| F2 | confirmed fixed | `JS/api-client.js:283-290`; `JS/minigames/container/container-minigame.js:2228-2240`; `viewer:48-50`, `:101-105`; PLAN:308; `vt:613-624`, `:582-599`, `:654-657` | `relay=1` is sent only when `relay === true` and neither `foothold` nor `from` is named; `routeExtra()` gives `{ relay: true }` only for a relay desktop (`this.relay`, which `:760` sets only with `loginPcId` and no `remote`) or a folder whose source PC session is a relay (through the real `folderRouteQuery`); a share folder is excluded. Cache key has relay. PLAN:308 has `&relay=1`. Residue in the plan text: R3-6. |
| F3 | confirmed fixed | `viewer:117-121` (unchanged returns with no render), `:366-374` (`_select` moves the mark, no rebuild), `:168-178` (status bar and REFRESH built once), `:277-313` (table frame once; `scrollTop` and the focused row put back), `:195-206`, `:246-264` (filter controls built once, options re-made only when their list changes); `vt:233-272` | Element identity, scroll and focus are asserted in the test. |
| F4 | confirmed fixed | `rows.js:97-99` (`resultWord`), `:102-113`, `:120-127` (`pruneFilters`), `:136`; `viewer:129-131`, `:263`; `vt:274-314` | The filter compares the base word; a pruned filter is set to `''` and the select then reads `ALL`. "Shown as cleared" is the select reading ALL; `pruneFilters` returns the cleared keys and the viewer does not use them (no line of text says a filter was dropped). I read the ruling as met; say so if a message was meant. |
| F5 | confirmed fixed | `vt:495-529` (slices the real `handleInteractiveItem` and the real `interactions.js` branch), `:541-565`, `:567-580` | `started[0][2].sprite` must be the very stand-in, for four screen kinds; the stand-in's `scenarioData`, `temp_` id and `sourceRoute` are asserted, then the viewer's request. Removing `sprite` from `JS/systems/interactions.js:1645` fails `:551`. Log-filter's arguments are compared with a room's. |
| m1 | confirmed fixed | `app/views/break_escape/games/show.html.erb:68`; `viewer:21-29` | One link with `be_asset_path` and `id="ops-log-css"`; the module's guard tests that id, so no second link on the page. |
| m2 | confirmed fixed | `viewer:106-114`; `vt:316-341` | Only 400, 403, 404 read NO ACCESS. |
| m3 | left by ruling (accepted) | `viewer:73-80` | A reopen draws cached rows for one round trip. |
| m4 | confirmed fixed | `vt:427-446` | |
| m5 | confirmed fixed | `viewer:54`, `:336`, `:367-369`; `vt:383-390` | No selector is built from an id. |
| m6 | confirmed fixed | `viewer:282-286`, `:328`, `:340-357`; `vt:214-231` | Roving tabindex; `role="grid"`. |
| m7 | confirmed fixed | `CSS/ops-log-minigame.css` (124 lines; no `.ops-log-fill`, one media rule) | |
| m8 | confirmed fixed | `vt:343-381` and the tests named above | Test count 15 -> 26, `assert` lines 99 -> 182; none removed. |
| m9 | confirmed fixed | `rows.js:97-113`, `:136`; `vt:274-292` | Options are words; the cell still shows `FAIL x3`. |
| m10 | left (needs the integrator) | `container-minigame.js:2220-2225`; `JS/systems/lighting.js:441` | See section 2, "m10". |
| m11 | confirmed fixed | `JS/systems/interaction-reach.js:144` | |
| m12 | confirmed fixed | `scripts/minigame-data-schemas.json:63-73` (no `title`); `scenarios/test_ops_logs/scenario.json.erb:144` | PLAN:172 and :389 still list it: R3-6. |
| validator sprite exemption | confirmed fixed | `scripts/validate_scenario.rb:3360-3361`; `test/js/validator-ops-log-sprite.test.mjs` | See section 3. |

### R2 (`L2a_server_R2.md`)

| Id | Status | Checked at | Note |
|---|---|---|---|
| N1 | confirmed fixed | `ops_log.rb:458`; `olt` "a thing with no authored name shows its kind word in where, as and an id detail" | See section 4. |
| N2 | confirmed fixed | same test | Unnamed PC, NPC holder, card and three foothold forms; asserts the ids are in no cell. |
| N3 | fixed, one residue | `lrt:8-31` (module), `:43` area include in all three classes, `:82-86`, `:421-423`, `:496-498`, test "the secret scan has secrets to scan for" | Text cells and title only; whole body for a refusal. Residue R3-4. |
| N4 | left by ruling (no action) | - | |
| N5 | confirmed fixed | `scripts/validate_log_rows.rb:114-117`; `test/js/validator-log-sources.test.mjs` "an ops_log_terminal with lockType login" | Matches the server's test (`game.rb:3128-3130`, `lockType == 'login'`). |
| N6 | confirmed fixed | `lrt` foothold test, `read(from: 'no_such_pc')` then 404 | The good-`from` case waits for a pivot fixture, as recorded. |
| N7 | confirmed fixed | `lrt` first holder test, the swipe with `['VISITOR-07', JAKE_CARD_ID]` | Holder named in both sources; stored `detail` nil. |
| S1 (server) | confirmed fixed | `events.rb:57-60`; `olt` "a door shows its room name, then its door sign, then the kind word" | See section 4. |
| S1 (scenario) | confirmed fixed | `ost` door test asserts `['Finance office', 'Security office']` (ran green) | |
| S2 | confirmed fixed | `scripts/validate_log_rows.rb:31-35`, `:100-125` | See section 5. |
| S3 | confirmed fixed | `scenarios/test_ops_logs/PLAYTEST.md` (three `tr.ol-row[data-row-id]`, `nosignal` listed) | |
| S4 | fixed, one weak helper | `ost` "a read writes no row, with or without a route param" asserts both 200s and the counts | The added secret helper compares whole cells only: R3-3. |
| S5 | confirmed fixed | `PLAYTEST.md` head, beats 9 and 10 (`2 rows`, `2 of 4 rows`) | Matches `rows.js:142-145`. |
| S6 | confirmed fixed | `scanner:1957-2017`, `:342`, `:367`, `:805`; `tools/playtest/access-leak-check.rb:54` passes `game:` | See section 6; R3-1, R3-2. |
| D1 | confirmed fixed | `docs/ACCESS_AND_NETWORKS.md` A24 read side, "What a row shows" | Matches `game.rb` holder rule and `ops_log.rb:433`. |
| D2 | confirmed fixed | same section, "What a row never shows" | Test and development guard, typed-text exception, kind word, door sign: as built. |
| D3 | confirmed fixed | `docs/ACCESS_AND_NETWORKS.md` index row and Key fields; `README_scenario_design.md:1030` | No "optional `title`" left in the two docs. |
| A24 validator line | confirmed | same section, "Validator." | The three errors named exist. |

## 2. Client points asked

- **F1, the look.** The stylesheet is self-contained: every class is `ol-`; the only class from outside is
  `pixel-scroll` on the scroller (`viewer:166`), the project's shared scrollbar class (`CSS/utilities.css`), not
  log-filter's. It sets no font family (the frame gives `GNF`, `CSS/minigames-framework.css`), 16px on the
  wrapper, the table, the inputs and the button, 2px borders everywhere a border is drawn, `border-radius: 0`
  on the two control kinds, no `box-shadow`, `filter`, `backdrop-filter` or blur. Pixel-art rules met. I did
  not re-run the headless probe; that the controls compute `GNF` is the R1 reviewer's measurement and the
  delta did not touch it.
- **F2.** As in the table. `relay` is never sent together with another route, and never as `relay=false`
  (`vt:654-657` on the real `ApiClient.logRows`).
- **F3.** As in the table. One thing a browser will show that the fake DOM cannot: if the focused row is no
  longer in a changed answer, focus falls to the document; acceptable.
- **m10: what it costs if left, and whether the one line is safe.** Cost today: nothing. `main` has not moved
  since this branch's base (`11a274307`), and the core stream's branch `ops-build` does not touch
  `container-minigame.js` or `lighting.js` at all. The risk is only a later core stage editing the two `return`
  lines of `sourceExtras()` (`:2222-2223`) or the one long emitter regex (`lighting.js:441`, where a new screen
  type is plausible, and which has no additive form either way). The one line is safe to add if wanted: restore
  `sourceExtras()` to main's three lines and put `if (this.mode !== 'npc') Object.assign(extras, this.routeExtra());`
  after `const extras = this.sourceExtras();` in `childExtras()` (`:2204`). `childExtras()` is the only path a
  reader takes (`handleInteractiveItem`, `:2534`, `:2596`); the other two users of `sourceExtras()` (`:2512`
  notes, `:2713` take) pick keys by name and never read `sourceRoute`. The `npc` guard keeps today's
  `{}` for an NPC container. It is not free: `vt:601-611` asserts that `sourceExtras()` itself carries
  `sourceRoute` and would have to assert `childExtras()` instead, and PLAN:299-301 and :498-499 name
  `sourceExtras()`. My advice: leave it; a two-line keep-ours conflict, if it ever comes, is cheaper than the
  test and plan edits.

## 3. Validator sprite exemption

`scripts/validate_scenario.rb:3360-3361`: `engine_type ||= t == 'ops_log_terminal'`, inside the sprite check
only, beside the `folder` exemption. Narrow: an exact type match; the near-miss `ops_log_terminal_x` still
errors (third node test). Tested in a room and nested in a PC. It changes no other scenario's output: the type
appears in no scenario but `scenarios/test_ops_logs/scenario.json.erb` (`grep -rl ops_log_terminal scenarios/`),
and the line can only turn an error off for that type.

## 4. Server points asked

- **N1, any id form still shown raw?** No. `ops_log_client_thing` (`ops_log.rb:452-459`) shows the kind word
  when the looked-up name equals the id or the id without a leading `jack_`, `wifi_` or `implant_`. Every
  KINDS fallback answers one of those two strings (door `events.rb:59`; `object_name` for object, pc, jack,
  ap; npc; card; network `:170`; host `:175`; foothold `:179-188`, whose three forms fall back to the bare
  jack, network or PC id). An id that resolves to nothing answers nil and shows `-`. `account` is exempt by
  design (the username is the display form). Detail values that are not ids are codes, counts or aliases.
- **Door name.** `events.rb:57-60`: the first of `name`, `door_sign` that is a non-empty String, else the id
  (then the kind word). As ruled. An empty `name` falls through (tested).
- **Does `door_sign` reveal something early?** No. A door row is written only by the player's own rfid swipe at
  that door (`game.rb:4209` granted, `:4221` denied; no other writer of `badge_swipe`), and the door's sign is
  what the game labels that door with before it opens (`JS/systems/minigame-starters.js:112`,
  `JS/ui/info-label.js:126`). So the sign in a row is text the player was shown where they stood. The one
  early reveal is the other way round and older than this delta: R3-5.
- **N3.** The module is included in all three classes and each class's `read` goes through it (`lrt:82-86`
  calls the module's assertion; `:421-423` and `:496-498` call `read_log_rows`). It scans `title` and each
  row's `event`, `as`, `where`, `result`, `detail` by substring, and a refusal's whole body. Residue R3-4.
- **N6, N7.** As in the table; both would fail if the rule they pin were removed (N7: drop the held-card term
  of `ops_badge_holder_natural?` and the plain source reads `-`).

## 5. Reader validator errors

`scripts/validate_log_rows.rb:100-125`, called at `:34` before the `logSources` early return, so it runs for
every scenario. Per plan section 9 (PLAN:446-448): no `id` (error), a String `logSource` not among the declared
sources (error; with no `logSources` block every source is undeclared, tested both ways), `lockType: login`
(error, N5). A missing `logSource` is left to the minigame schema check, as PLAN:448 says. Keys starting `_`
are not sources. The walk covers every Hash in the scenario, so rooms, contents, desktops, profiles and
shares are all reached.

No existing scenario gains an error: the only scenario with the type is `test_ops_logs`, which validates with
0 errors (run above). Test gap: R3-8.

## 6. The `/log_rows` leak rule

`scanner:1957-2017`. What it flags, each with a unit test that fails if the rule is removed
(`test/unit/access_leak_scanner_log_rows_test.rb`, 8 tests) and one test over the server's real answers
(`ost` "the leak scanner judges the real /log_rows answers clean, and flags the same answers with a secret or
a raw id put in"):
- a key outside the seven on a row (`LOG_ROW_KEYS`, with the `at` form for L2b seed rows), a key outside
  `rev, title, rows, unchanged, success, reason` on the answer, and a stored-only key at any depth;
- a registered log secret (`OpsLog.compared_secrets(game)`; the check script passes `game:`) equal to a text
  cell or the title, or inside one when the secret is 6 characters or more;
- a raw room, object, NPC or card id as `as`, `where` or a detail value, unless some authored `name`,
  `displayName`, `door_sign` or `username` equals it.

The sign-in exemption (`log_rows_without_typed`, `:1965-1970`, applied at `:342` before every rule): the `as`
cell of every row whose `event` is `SIGN_IN` is blanked. A failed sign-in's typed username: yes, exempt, and
only its `as` cell (a secret in the same row's `detail` is still a finding, tested). Other rows' `as`: judged
(tested with a BADGE row). It is wider than "a typed row" by two row kinds: R3-1. One form the rule cannot
see: R3-2.

## 7. Docs

D1 to D3 match the code (table above). Two leftovers in the plan itself: R3-6.

## 8. Tests not weakened; log-filter untouched

- `git diff --stat main -- public/break_escape/js/minigames/log-filter/` is empty; its two node tests pass.
- Test and `assert`-line counts, before -> head: `vt` 15 -> 26 tests, 99 -> 182; `lrt` 24 -> 25, 111 -> 118;
  `olt` 63 -> 64, 229 -> 236; `ost` 13 -> 14, 86 -> 98; `validator-log-sources` 24 -> 28, 63 -> 68; new files
  `validator-ops-log-sprite` (3) and `access_leak_scanner_log_rows_test` (8).
- Removed or rewritten test lines (20 in the Ruby files), each replaced by something stronger: the old
  whole-body secret helper in `lrt` (now the shared module, on text cells); `ost` `assert_not_equal '-'`
  (now the exact door names); the `ost` forged-route test (renamed, asserts 200 and counts); the one-kind
  kind-word test in `olt` (now all kinds, plus the door test). One loss worth knowing: the old `lrt` helper
  scanned the raw body, row ids and `rev` included; the new one does not, by the R2 ruling.

## 9. Merge readiness

State now: `main` has no commit since this branch's base, so a merge today is a fast-forward. The list below
is against the core stream's branch `ops-build` as it stands, which is what will land on main.

Hunks on this branch that rewrite, remove or reorder existing lines:

| File | Lines (base) | What | Against `ops-build` |
|---|---|---|---|
| `gc.rb` | 28 -> new line 29 | adds `:log_rows,` as its own line after the `set_game` list's line 28 | **conflict**: `ops-build` rewrites line 28 itself (appends `:network_check, :network_confirm`); adjacent, keep both |
| `gc.rb` | 639-667 | `#container`: 24 lines of the two refusal branches removed and replaced by `container_reach_refusal` / `render_container_refusal` (the R1-reviewed refactor, plan section 6) | clean today (`ops-build` hunks are at 104, 1839, 2381); conflicts if a later stage edits `#container`'s refusals |
| `game.rb` | 4206 | the `write_log_row!('badge_swipe' ...)` line rewritten (gains `detail`) | clean (theirs: 3096, 4562-4655) |
| `game.rb` | 4228-4231 | four lines of `ops_badge_as` replaced by one (the holder rule moved to new methods) | clean |
| `events.rb` | 24 | the `badge_swipe` EVENTS line rewritten (gains the `flagged` detail) | clean today (theirs rewrites line 35, eleven lines away); a conflict if they touch `badge_swipe` |
| `events.rb` | 57 | the `door` name lambda rewritten as four lines | clean (theirs: 96, 177) |
| `container-minigame.js` | 2222-2224 | two `return` lines of `sourceExtras()` rewritten, one added (m10) | clean (`ops-build` does not touch the file) |
| `lighting.js` | 441 | the emitter regex gains one type (whole long line) | clean today |
| `interaction-reach.js` | 144 | `DESK_COMPUTER_TYPES` line gains one type | clean today |
| `scripts/validate_log_rows.rb` | 31 | the early `return` split in two around the new reader walk | not touched by `ops-build` |
| `scanner` | 188 | `def initialize(...)` gains `log_secrets: nil` | **conflict**: `ops-build` rewrites the same line (`catalog_folder: nil`); take both keywords and both assignments |
| `scanner` | 792 | `network_view:` line gains a comma, `log_rows:` added after it | **conflict**: `ops-build` inserts `ops_check:`, `ops_confirm:` just above; keep all, mind the comma |
| `scanner` | after 1943 | 62 added lines | **conflict** (both streams insert at the same line); keep both blocks |
| `scanner` | after 138 | 8 comment lines | probably clean (theirs replaces line 135); check by eye |
| `docs/ACCESS_AND_NETWORKS.md` | 710-711 | the A24 write side's "Shown in" and "Known limits" lines rewritten | clean (theirs: 67-69, 1194-1204) |

Pure additions (keep-both by nature, no existing line changed): `config/routes.rb` (one line after 60; theirs
after 56), `JS/api-client.js` (after 278; theirs after 226), `JS/core/game.js` (after 912; theirs after 537),
`JS/systems/interactions.js` (14 lines after 1635), `scripts/validate_scenario.rb` (two lines after 3359),
`show.html.erb` (one line), `scripts/minigame-data-schemas.json` (one entry), `README_scenario_design.md`
(one row after 1029; theirs after 1042), `docs/ACCESS_AND_NETWORKS.md` index row after 54 and the new section
after 713, `ops_log.rb` (105 added lines), the `gc.rb` action and helpers (after 1919 and 3147), `game.rb`
after 4242.

So: four hunks certain to need a hand merge (one in `gc.rb`, three in `scanner`), all keep-both.

## New findings

**R3-1 (minor). The scanner's sign-in exemption is wider than "a typed row".**
`scanner:1965-1970` blanks `as` for every row labelled `SIGN_IN`. Four events share that label
(`events.rb:25-30`): `signin_fail` and `signin_lockout` store typed text (`game.rb:4521`, `:4556`),
`signin_refused` stores typed text or an account (`:3524`, `:3535`), and `signin_ok` always stores an account
(`:4600`). So the identity of a successful sign-in, and of a refusal for a known account, is never judged, by
the secret rule, the raw-id rule or the scanner's older password rule. PLAN:682 says "the IDENTITY cell of a
typed row". Nothing leaks through it today (that cell is the account's username). Fix: keep the cell judged
when the row is a `signin_ok`, which the answer shows by its detail (`method: ...`):
`r['event'] == 'SIGN_IN' && !r['detail'].to_s.include?('method: ')`; add a unit test that a SIGN_IN OK row with
a secret or a raw id in `as` is a finding. The account form of `signin_refused` cannot be told from the typed
form in the answer; say so in the comment.

**R3-2 (minor). The scanner cannot see a stored-only key in the detail text.**
`detail` reaches the browser as one string (`key: value, ...`, `ops_log.rb:466-478`). `scanner:1991-1994`
(`log_cell_texts`) keeps only the values, and the stored-only key rule (`:2003-2005`) looks at Hash keys. So if
the reader ever showed the hidden marker, the answer would carry `detail: "flagged: 1"` and the scanner would
pass it; that is the one realistic way `flagged` could leak. (The server tests assert the word is in no body,
so this is the playtest check's gap only.) Fix: in `scan_log_rows`, split each detail pair and report a key in
`LOG_STORED_ONLY_KEYS` as `log:stored_key:<key>`; also add the whole `detail` string to `texts`, so a secret
holding `, ` is not cut in two before the compare. One unit test each.

**R3-3 (minor). `ost`'s secret helper cannot see a secret inside a cell.**
`ost:165-172` (`assert_answer_holds_no_secret`) uses `OpsLog.find_secret_hit`, which compares each String
exactly (`ops_log.rb:231-236`, written for stored rows). A client `detail` is `key: value, ...`, so a secret in
it never equals the cell and the helper passes. R2 S4 asked for the shared scan. The same file's scanner test
and its `assert_not_includes response.body, DANA_PASSWORD` cover the case, so nothing is unguarded. Fix: move
`LogRowsBodyScan` (`lrt:8-31`) to `test/support/` and call it from `ost`'s `read`.

**R3-4 (minor). One `/log_rows` body in `lrt` is still read without the scan.**
`lrt:427`: the first request of the foothold test is a direct `get` (a 404). R2 N3 named it. Fix: `read`.

**R3-5 (minor, for a ruling; older than this delta).** A door row shows the room's `name` before its
`door_sign` (`events.rb:59`, R2 ruling S1), while the game labels an unopened door by `door_sign` first
(`JS/systems/minigame-starters.js:112`). In a mission where a room has both, a swipe that is denied still
writes a row (`game.rb:4221`), and a reader then shows the room's `name` for a door whose sign says something
else and whose room the player has not entered. The name is already in the browser's scenario copy, so this is
a presentation point, not a server leak. If the user wants the log to say what the door says, swap the order
for `door` only; one line, with the `olt` door test's order swapped. No change asked now. L2b's seed rows name
doors by authored `where`, so the same choice applies there.

**R3-6 (minor, plan text).** PLAN:172 and PLAN:389 still list `title` among the reader's `minigameData` fields
(removed by ruling m12); PLAN:300 says `sourceExtras()` carries "the `foothold` or `from`" (now also `relay`);
the comment at `gc.rb:1900` names two route params. Fix the three plan lines; leave the `gc.rb` comment unless
that file is being edited anyway (shared file).

**R3-7 (minor).** `pruneFilters` returns the keys it cleared (`rows.js:120-127`) and `viewer:131` drops them.
If "shown as cleared" (ruling F4) was meant as more than the select reading ALL, use the return for the status
line (for example `RESULT filter cleared`). Otherwise drop the return value or leave it; no fault.

**R3-8 (minor, tests).** `test/js/validator-log-sources.test.mjs`: the four reader tests place the reader in a
room only. The walk is generic, so add one case for a reader in a PC's `contents` with an undeclared source, to
pin that nested readers are reached (plan section 9 exists for exactly the desktop case).

## Checks not completed

- The headless CSS probe was not re-run; F1's wrap is confirmed by reading the stylesheet and the markup, and
  the fixer's numbers are its claim.
- The fixer's mutation proofs (F3, F5) were not re-run; F5's was checked by reading which assertion fails.
- `lrt` and `olt` were not run (one Ruby run was used for `ost` and the scanner unit test); N1, N2, N3, N6, N7
  and the door test are confirmed by reading. `bin/ops-golden-compare` was not run.
- Merge readiness was read from diffs against the base; no trial merge was made (it would write objects).
- No game was played.

## Added by the orchestrator from the playtest and live proof (2026-11-23)

The Haiku run of `scenarios/test_ops_logs/PLAYTEST.md` passed 13 of 13 beats (game 23, port
3014; terminals opened by real interaction; viewer controls by real clicks; 9 `/log_rows`
GETs, all 200, three `unchanged`; `verify-run --ops-log` OK; leak check clean). Results and
screenshots:
`/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/l2a-playtest/`
(`RESULTS.md`). The orchestrator looked at `beat09-door-log-open.png`,
`beat11c-after-refresh-new-row.png` and `beat-phone-390x844-signin-log.png`. At 1400 x 1000
the viewer is clean: named doors, counts (`FAIL x2`, `OK x2`), the new row after REFRESH, no
row marked. Items:

- **P1 (minor, client, CSS).** At phone width (390 x 844, screenshot
  `beat-phone-390x844-signin-log.png`) the DETAIL column is gone (0 px), headers are clipped
  ("IDENTIT", "LOCATIOI", "RESUL"), and words break mid-word ("SIGN_ IN", "SESSI ON"). No
  column may vanish and no word may break mid-word: at narrow widths give the columns
  sensible minimum widths and let the table scroll sideways inside its frame, or stack each
  row as a small card; pick the one closest to how other minigames in this project handle
  narrow screens.
- **P2 (minor, check against the plan).** In the sign-in log the lock and the session end
  both read `SESSION` / `OK` with DETAIL `-` (screenshot `beat11c-after-refresh-new-row.png`,
  rows 3 and 4), so a reader cannot tell a lock from an end. Read plan 13.8 (lines 1171-1208)
  for the labels and detail of `session_lock` and `session_end`: if the plan gives them
  distinct labels or a detail and the code lost it, fix the code; if the plan itself gives
  both the same label and no detail, change nothing and report it as a question for the user.
- **P3 (investigate, small).** Beat 10: choosing a value in the EVENT select by keyboard did
  nothing in the headless run and the script's fallback was used. Check the filter selects
  are ordinary keyboard-operable selects with a change handler (a node test that dispatches
  `change`); if they are, record it as a harness limit.
- **P4 (script).** PLAYTEST: the grant toast wording and the "Signed out" toast differ from
  what the game shows; the harness has no `waitForMinigame` (the `waitFor` kind `minigame`
  works). Correct the script's wording.

## R3 outcomes (tidy pass, 2026-11-23)

| Finding | Outcome |
|---|---|
| R3-1 | fixed, d026849aa. Judged: a SIGN_IN row whose detail has `method:` (only `signin_ok` has it). Still exempt: fail, lockout and both refused forms, which carry no detail; a refusal for a known account cannot be told from typed text in the answer (comment in the scanner). Mutation: removing the detail test fails the new sign-in test. |
| R3-2 | fixed, d026849aa. Detail pairs are split and a stored-only key is reported as `log:stored_key:<key>`; the whole detail string joins the secret texts. Mutation: removing both lines fails the new detail test. |
| R3-3 | fixed, 05621a739. `LogRowsBodyScan` moved to `test/support/log_rows_body_scan.rb`; `ops_logs_scenario_test` `read` calls it. |
| R3-4 | fixed, 05621a739. |
| R3-5 | fixed, 8f0d22ef0. Order is `door_sign`, `name`, kind word; model test covers name only, both, empty sign, sign only, neither; A24 doc line and the scenario test message updated. PLAYTEST.md already said "door signs" and needed no change. |
| R3-6 | fixed, ed6c3cebc (plan lines 172, 300, 389). `gc.rb:1900` comment left (shared file). |
| R3-7 | withdrawn, no change: the ruling is met by the select reading ALL; the reviewer calls the unused return no fault. |
| R3-8 | fixed, a87ddd8b8. |
| P1 | fixed, c9b94ab5a. The hide-detail media rule is gone; the table has `min-width: 760px`, headers do not wrap, and the frame scrolls sideways (as log-filter's tables do). Checked in a headless browser at 390 x 844 (every column present when scrolled; no cut word) and 1400 x 1000 (same as `beat11c-after-refresh-new-row.png`). Screenshots in /tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/l2a-tidy: after-phone-390x844.png, after-phone-390x844-scrolled-right.png, after-desktop-1400x1000.png. The sign-in rows in the proof game were written with the game's own `write_log_row!` (same shapes), not played. |
| P2 | question for the user, no change. Plan 13.8 (lines 1186-1187) gives `session_end` and `session_lock` the same result (ok) and no detail; labels come from the event table (both SESSION). Nothing was lost in the code. The reader cannot tell a lock from an end except by order. Options: a distinct label (LOCK / SIGNOUT) or a detail. |
| P3 | withdrawn (harness limit). The EVENT, RESULT and LOCATION filters are ordinary `<select>` elements with a `change` listener (`ops-log-minigame.js:220-221`); `ops-log-viewer.test.mjs` already drives them by dispatching `change` (`choose`). A headless native select popup swallows arrow keys. |
| P4 | fixed, cd95f98e6. |
| m10 | left by ruling. |
