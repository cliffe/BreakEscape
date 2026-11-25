# Ops follow-up A: review R2

Scope: the R1 fixes, 74a22ddaa (R1-A2, R1-A3) and c153103d8 (R1-A1), on `ops-follow1`, with a full attack on the new
`heldItem` allowance in the leak scanner.

Verdict: **not clean** (0 blocker, 0 major, 2 minor).

## R1 findings

| Id | R1 severity | State | Evidence |
|----|-------------|-------|----------|
| R1-A1 | blocker | closed | `heldItem` is in `CRACK_ROW_KEYS` (`tools/playtest/lib/access_leak_scanner.rb:3576`). `crack_row_ok?` (`:3899`) calls `crack_held_item_ok?` (`:3911-3914`): held proof, a string equal to `proof.held`, and in `@mfa_taken`. The real-answers test tags every POST /inventory row (`ops_crack_scanner_real_answers_test.rb:36-41`, the recorder's shape) and adds the four R1 mutations (`:123-152`). Every scanner test in one run: 29 files, 578 runs, 7083 assertions, 0 failures. Mutation runs: drop the `@mfa_taken` clause gives 1 fail ("never shown taken"); drop the proof-kind clause gives 1 fail ("technique card row"). Dropping the `== proof.held` clause gives 0 failures (see R2-A2). |
| R1-A2 | minor | closed | `keyring.js:589-590` now also needs `status` `ready` or `running`. New tests `keyring-client.test.mjs:1523-1540` take, drop and retake a file with the recorded `keyringCracked` and `keyringInfeasible` rows. Reverting the guard in a scratch copy makes both new tests fail (97 to 95 pass; the one other failure is a scratch-copy artefact that also fails on the unmutated copy). |
| R1-A3 | minor | closed | `inventory-menu.test.mjs:514-523` builds the keyring through `Keyring.prime()` with a stubbed `ApiClient.keyring`. The infeasible row is the recorded `keyringInfeasible` answer (`ops_crack_held_item_test.rb:86`, `answers.json`). The fixture compare test passes without `RECORD_FIXTURE` (3 runs, 49 assertions, 0 failures). |

## New findings

| Id | Severity | Summary |
|----|----------|---------|
| R2-A1 | minor | `heldItem` passes for a file that left the tray through an unreadable remove or a hide |
| R2-A2 | minor | No test pins the `item == proof.held` clause |

### R2-A1 (minor): a dropped file still counts as held after an unreadable remove or a hide

Evidence: `crack_held_item_ok?` reads `@mfa_taken`, the MFA ledger. `mfa_note_inventory`
(`access_leak_scanner.rb:4811-4828`) takes an item out only for a tagged `remove` that names it. Its fail-safe branch
handles a remove the recorder could not read (`inv` null, or a remove that names no item). That branch subtracts only
code devices and phones (`@mfa_devices.keys + @mfa_phones.keys`), so a hash file stays "taken". A 200 `hide` answer
(`games_controller.rb` `when 'hide'`, `hide_device!` takes the item out of the inventory) is not treated as leaving at
all. The recorder says a null `inv` on a remove row means the scanner cannot tell what left
(`response-capture.js:22-30`). The R1 fix specified only "minus tagged removes", so the builder followed it exactly;
the gap was in R1's own rule.

Probe (scratch test `r2_held_item_probe_test.rb`, never committed). It subclasses the whole-run test and inserts one
200 POST /inventory row just before the first keyring row whose `dana_hash` carries `heldItem: dana_file`:
- a tagged remove of `dana_file`: 19 `crack_row` findings (caught);
- `inv: null`: 0 findings;
- `inv: {action: remove, itemId: null}`: 0 findings;
- a successful `hide` of `dana_file`: 0 findings.

So a leaking server that keeps the hash row, with `heldItem` naming a file the player no longer carries, passes in
those three cases. The real server drops the whole row when the file goes (`credential_keyring.rb:404`). The value is
an item id the client once had, so no secret is exposed; this is why the severity is minor. It is still an access check
that fails open.

Fix (scanner, one place): in `mfa_note_inventory`, the unreadable-remove branch also subtracts the held-proof file ids
of the crack records, the `proof.held` values in `@crack_records`. Add a branch: a `hide` with an item id and a 200
`success: true` answer deletes that id. Then add the three probe rows above as `crack_row` mutations in
`ops_crack_scanner_real_answers_test.rb`. The hide branch also changes the MFA ledger for a hidden device, which is
the true state on the server. Rerun the MFA scanner tests (`access_leak_scanner_mfa_*`, `recorder_tags_scanner_mfa`)
to confirm they stay green. If the owner wants the MFA ledger left as it is, the crack check can instead keep its own
held-file set with these rules.

### R2-A2 (minor): the `item == proof.held` clause is not pinned by any test

Evidence: the mutation "heldItem naming another file" (`ops_crack_scanner_real_answers_test.rb:131-134`) sets
`farah_file` on the first `dana_hash` row. At that row `farah_file` has not been taken yet, so the `@mfa_taken`
clause catches it, not the equality clause. A scratch run with the equality clause removed: 0 failures in the
committed tests. A probe mutation on capture row 51, where both files are held, sets `dana_hash`'s `heldItem` to
`farah_file`. It passes on HEAD and fails with the clause removed. So the clause is correct, but nothing keeps it.

Fix: change that mutation to use the last keyring row where `dana_file` and `farah_file` are both held, or add it as a
fifth mutation.

## Checked and found sound

- A `heldItem` the player never held: refused. It must equal the record's own `proof.held`, and the item must appear in
  a tagged 200 `success: true` add row (or the start items) before this row. `scan_crack` runs before `scan_mfa` on
  each row (`:610-614`), so a row never vouches for itself.
- Held, then dropped by a tagged remove: refused (R1 mutation 3, and the probe above).
- `heldItem` on a non-held proof (technique card, registry `any`/`all`): `proof_kind` returns `held` only for a single
  `held` key (`lib/break_escape/credential_model.rb:62-67`), so it is refused.
- A non-string `heldItem` is refused. A row with no `heldItem` is judged exactly as before.
- `heldItem` outside a keyring entry: `scan_crack_rows` accepts a hash only where it is the keyring entry itself, so a
  stray copy is still a finding.
- The new key leaves no other rule wider: `CRACK_ENTRY_KEYS` (cracked password rows) is unchanged.
- Cracker JS on HEAD (node 22, `bin/test-js`): inventory-menu, keyring-client, ops-cracker, toast-action,
  dungeon-graph-crack, pin-cracker-a11y, pin-cracker-feedback, keyring-signin, password-minigame-submit: 251 tests,
  0 fail.
- Commit messages for 74a22ddaa and c153103d8 are true. Each touches only the files its finding names.

## Notes as checked

- Scanner run (one time, under `flock /home/deploy/BreakEscape/tmp/tests.lock`): `test/unit/access_leak_scanner_*` (13
  files) and `test/controllers/break_escape/{access_leak_scanner_*, demo_ops_*_scenario, ops_crack_scanner_real_answers,
  ops_logs_scenario, ops_scan_scenario, recorder_tags_scanner_crack, recorder_tags_scanner_mfa}_test.rb`: 578 runs,
  7083 assertions, 0 failures, 0 errors.
- Probes were scratch tests run with `-n` against their own class only. Each method patch lived only in that test
  process. None is committed. `bin/ops-golden-compare` was not run in R2: the fixes change no scenario or validator.
