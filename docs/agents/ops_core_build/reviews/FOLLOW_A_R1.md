# Ops follow-up A: review R1

Scope: the cracker follow-ups S7-1 (a cracked password fills on sign-in), S7-2 (the cracker opens from a held hash file
and from the "Hash collected" toast; `heldItem` on hash keyring rows; the toast action button) and S7-3 (truthful
auto-finish words). Commits 44f129faf (A1), e13d1eccc (A2), 7e9566cdc (A3), 32e4ea348 (A4), c7b0b6164 (A5),
967ee7845 (A6) on `ops-follow1` over 2d9e963c8.

Verdict: **not clean** (1 blocker, 0 major, 2 minor).

| Id | Severity | Summary |
|----|----------|---------|
| R1-A1 | blocker | The leak scanner refuses every hash row with `heldItem`: two whole-run tests are red |
| R1-A2 | minor | The toast offers "Crack" for a retaken cracked or infeasible hash |
| R1-A3 | minor | Tray tests set `Keyring.latest` by hand and make the infeasible row up |

## Findings

### R1-A1 (blocker): the scanner rejects the new `heldItem` key, so two whole-run tests fail

Evidence: `tools/playtest/lib/access_leak_scanner.rb:3576` `CRACK_ROW_KEYS` has no `heldItem`, and
`crack_row_ok?` (`:3891-3892`) returns false for any row with a key outside that list. A1
(`app/models/break_escape/ops_cracking.rb:107-109`) now adds `heldItem` to every file-backed hash row. Command:
`flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test test/controllers/break_escape/ops_crack_scanner_real_answers_test.rb test/controllers/break_escape/ops_crack_held_item_test.rb test/controllers/break_escape/recorder_tags_scanner_crack_test.rb`
gives 15 runs, 2 failures: `OpsCrackScannerRealAnswersTest` and `RecorderTagsScannerCrackTest` whole runs, each
"honest play must give no finding" with 19 findings, all `crack_row` / `crack:row` on `GET /keyring`. The branch
cannot merge with these red. The builder stopped and reported as the brief told it to; the gap is real either way.

Fix (narrow, one file plus the test that drives it; proven in a scratch run, see the notes):
1. `tools/playtest/lib/access_leak_scanner.rb:3576`: add `heldItem` to `CRACK_ROW_KEYS`.
2. Same file, `crack_row_ok?` (`:3891`): after the existing checks, when the row has `heldItem`, accept it only if
   the record's proof is a `held` proof (`BreakEscape::CredentialModel.proof_kind(entry['proof']) == 'held'`), the
   value is a string equal to `entry.dig('proof', 'held')`, and the capture shows the player holding that item at
   this row: `@mfa_taken.include?(value)` (`:4166`: item ids from tagged 200 `POST /inventory` add rows and the
   start items, minus tagged removes; `scan_mfa` runs after `scan_crack` on each row, `:610-614`, so a row never
   proves itself). A row with no `heldItem` is judged exactly as today. Nothing else in the scanner changes.
3. `test/controllers/break_escape/ops_crack_scanner_real_answers_test.rb`: the capture rows it builds carry no `inv`
   tag, so step 2 would reject honest play. In its captured-row hook, add the recorder's tag to each
   `POST .../inventory` row (`'inv' => { 'action' => params[:action_type], 'itemId' => params[:item][:id], 'usedOn' => nil }`,
   the shape `response-capture.js` writes), and add four mutations that must each be `crack_row`: `heldItem` naming
   another file; the add row's `inv` naming a different item (the file is never shown taken); a tagged remove of
   the file inserted before the row; `heldItem` added to the technique-card (administrator) row.
The decisions put scanner hardening in a later stage, so the owner of that stage (or the orchestrator) should land
this as its own commit before track A merges; it must not wait for the later stage, because the tests are red now.

### R1-A2 (minor): the "Hash collected" toast offers "Crack" on a cracked or infeasible hash

Evidence: `public/break_escape/js/systems/keyring.js:589` adds the action for any single fresh hash row, whatever its
`status`. Because a hash row with `heldItem` is forgotten when its file leaves the tray, dropping and retaking a
cracked file toasts again. Probe (scratch copy of `test/js/keyring-client.test.mjs` plus one test, fixture
`keyringCracked`, tray take, drop, retake): toasts `["Hash collected","Hash collected"]`, actions
`["Crack","Crack"]`, while `hashEntryFor('dana_file').status` is `cracked`. The same happens on the first take when
the account's password is already held another way (the server reports `cracked`, `ops_cracking.rb:58`). The tray
entry (`inventory-menu.js:178-190`) correctly offers nothing in these states, so the two entry points disagree, and a
button labelled "Crack" on a finished record is not true. Nothing unearned is shown (the cracker reads the server).

Fix: `public/break_escape/js/systems/keyring.js:589`: also require `lined[0].status === 'ready' || lined[0].status === 'running'`
before adding the action. Add a test in `test/js/keyring-client.test.mjs` feeding `keyringCracked` (and an infeasible
row, see R1-A3) through take, drop, retake: the toast shows with no action.

### R1-A3 (minor): tray tests bypass the Keyring's answer path and hand-make the infeasible row

Evidence: `test/js/inventory-menu.test.mjs:513` sets `kr.latest = CRACK_FIX[name].entries` directly instead of feeding
the answer through the real `Keyring` fetch path the brief names (as `keyring-client.test.mjs` does). `:527-528`
builds the infeasible row by copying the ready row and setting `status: 'infeasible'`; the shared fixture
(`test/js/fixtures/ops_crack/answers.json`) records a `POST /crack` infeasible answer but no keyring answer with an
infeasible row. The "none once infeasible" rule is therefore tested against a row the server never served.

Fix: in `test/controllers/break_escape/ops_crack_held_item_test.rb` `played_answers` (`:59`), record a
`keyringInfeasible` answer (Eli's file held, after the infeasible crack) and regenerate the fixture with
`RECORD_FIXTURE=1`; in `test/js/inventory-menu.test.mjs` build the keyring with the real `Keyring` answer path
(`prime`/`refresh` against a stubbed `fetch`, as `keyring-client.test.mjs:1363` does) and read the infeasible row from
`keyringInfeasible`.

## Checked and found sound

- `heldItem` reveals nothing unearned. `hash_keyring_entry` (`ops_cracking.rb:91-111`) is reached only from
  `registry_keyring_entries` (`credential_keyring.rb:398-416`), which skips a record whose proof does not hold now; a
  `held` proof holds only while an inventory item with that exact id and credential is carried. A dropped file takes
  the whole row away; a file never taken gives no row; a technique-card hash has no `heldItem`
  (`ops_crack_held_item_test.rb:105-119`, passing). The value is an item id the client already has in its tray.
  The rule is the saved-connection rule copied (`credential_keyring.rb:450-454`).
- A1 fixture: the compare test passes without `RECORD_FIXTURE`; the five `/crack` statuses, a refusal and the four
  keyring states are there; no row carries a credential, recipe or password beyond the earned `source: cracked` row.
- S7-1: `password-minigame.js:418-420` fills from the server's cracked row only, a captured value wins in either
  order, an entry with no password fills nothing; lesson toasts unchanged. Mutations of both lines make tests fail.
- S7-2 toast: button only when exactly one fresh find has a line and it is a hash (two hashes, or a hash with a saved
  connection: none; pinned by tests that fail when the rule is widened). Label set with `textContent`; the button sits
  outside `.notification-message`, so the recorder reads the same message; Enter and Space handled as the close X;
  the toast goes on press; the action survives hold and release. It cannot open over another screen: info toasts
  are pulled back or dismissed when a minigame or workstation popup opens (`notifications.js:203-229`), and
  `openCracker` (`keyring.js:608-619`) refuses with the busy line when a minigame, the interaction menu or a
  conversation is up (a mutation removing the guard makes a test fail).
- S7-2 tray: Crack (ready), Open (time left), Finish (0 s), nothing once cracked or infeasible; other items keep
  today's menu; a saved connection's Connect is unchanged. No new static import in `keyring.js` or `inventory-menu.js`.
- S7-3: "The wait is over. Fetching the result..." while the automatic post is due or in flight; "The result did not
  arrive. Press Finish to try again." only after the post came back still running; a thrown post shows the refusal
  line (builder's correct reading of the precedence). Behaviour of `shouldAutoPost`, `canCrack` and `_tick` unchanged.
- `capture-log.test.mjs` test 2 fails identically on 2d9e963c8 and on HEAD (33 tests, 32 pass in both); not made worse.
- Shipped scenarios: track A changes no scenario file other than `scenarios/test_ops_crack/PLAYTEST.md`, no validator
  and no campaign mission; `bin/ops-golden-compare`: 27 runs, 0 failures.
- A6 playtest beats match the code (toast button, tray entry, busy line, fetching line, filled tile, no tray entry
  after infeasible). Commit messages A1 to A6 are true.

## For the owner

Nothing. R1-A1's fix follows the existing proof rule; who lands it (track A or the scanner stage) is the
orchestrator's scheduling call, not a design decision.

## Notes as checked

- A1 server rule read: `hash_keyring_entry` is called only from `registry_keyring_entries`
  (`app/models/break_escape/credential_keyring.rb:398-416`), which skips any record whose proof does not hold now
  (`:404`). A `held` proof holds only while an inventory item with that exact id and credential is carried
  (`credential_keyring.rb:52-57`). So `heldItem` is only ever the id of a file in the tray at answer time.
- `capture-log.test.mjs` on the base commit 2d9e963c8 (git archive into scratch) and on HEAD: both 33 tests, 32 pass,
  the same one failure (test 2, "the secret is masked until /capture_secrets answers, after the sync", line 200,
  `/capture_secrets` asked twice). The failure text is identical apart from the file path. Not made worse.
- Probe (copy of `keyring-client.test.mjs` in scratch plus one test): feeding the fixture's `keyringCracked` answer
  and taking, dropping and retaking `dana_file` gives toasts `["Hash collected","Hash collected"]` with actions
  `["Crack","Crack"]` while `hashEntryFor('dana_file').status` is `cracked`. See R1-A2.
- JS on HEAD: toast-action, keyring-client, inventory-menu, ops-cracker, keyring-signin, mfa-signin-pane, signin-rows,
  keyring-token, keyring-relay-hooks, inventory-tray, access-relay-desktop, access-from-desktop, desktop-remote-view,
  password-minigame-submit, password-signin-mode: 472 tests, 0 fail. toast-*, notifications-plain-default,
  playtest-toast-capture, error-toast-floor, inventory-tray-narrow: 237 tests, 0 fail.
- Mutations (scratch `git archive HEAD` copy, one change at a time, each restored): A3 fill line removed -> 2 fail
  (keyring-signin, mfa-signin-pane); captured-wins guard removed -> "A3: a captured value wins over a cracked one in
  either order" fails; A5 toast `lined.length === 1` widened to `>= 1` -> 1 fail; A5 busy guard removed -> 1 fail;
  A5 tray entry given to non-running non-ready rows -> 4 fail; A4 retry line removed -> 1 fail. Each new test bites.
- `flock ... bin/rails test ops_crack_scanner_real_answers_test.rb ops_crack_held_item_test.rb recorder_tags_scanner_crack_test.rb`
  on HEAD: 15 runs, 434 assertions, 2 failures (the whole run in `OpsCrackScannerRealAnswersTest` and in its subclass
  `RecorderTagsScannerCrackTest`), both "honest play must give no finding" with 19 findings, every one
  `crack_row` / `crack:row` on a `GET /keyring` row. The held-item test file passes. See R1-A1.
- Scanner probe (scratch test `r1_held_item_scanner_probe_test.rb`, never committed: patches the scanner class in its
  own process only, subclasses the whole-run test and adds the recorder's `inv` tag to each POST /inventory row):
  11 runs, 311 assertions, 0 failures. Honest play gives no finding; the parent's mutations stay findings; four new
  mutations are each a `crack_row` finding: `heldItem` naming another file; the add row's `inv` naming another item
  (file never shown taken); a tagged remove of `dana_file` inserted before the row; `heldItem` added to the
  technique-card row. Hash rows in the capture carry `heldItem` `dana_file`, `farah_file`, `sparedesk_file`,
  `eli_hash_file` and none (the administrator).
