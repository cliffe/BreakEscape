# Scenario format hardening, step 3, review R2

Reviewed the step 3 range `896ec3cd8..566db9073` on `build/hard-step3`, with the R1 fixes
`414172137`, `5fc9760d9`, `566db9073`. Read the step 3 plan
(`SCENARIO_FORMAT_HARDENING_PLAN.md`), the step 3 build-log sections (including "Step 3 review R1
fixes"), and `SCENARIO_FORMAT_STEP3_REVIEW_R1.md`. Review only; no code was changed.

The live-proof builder has since committed `b6856b39b` on top of the target. That commit touches none
of the reviewed source files (`git diff 566db9073..HEAD` over `validate_secret_leaks.rb`,
`capture_model.rb`, `game.rb`, `games_controller.rb`, `scenario-schema.json`, `validator_report.rb`
and `scenarios/test_secret_leaks/` is empty), so the working tree still reflects the target for this
review. Its work is out of scope and was ignored.

Each R1 finding and each fresh-pass concern was probed directly, not read off the tests: a standalone
`SecretLeaks` probe for the door-entry guard and the array branch, a `CaptureModel.answer_key` probe
for the comparator, a corpus-wide `door_entry_issues` sweep, a corpus validator sweep for leak
errors, a `git merge-tree` against main, and a read of the 6a-1 held-scan test. The live browser
proof and the full Rails and corpus suites were left to their own runs, as briefed.

- Blocker: 0
- Major: 0
- Minor: 2

Verdict: **SHIP**. The one Major and two minors from R1 are genuinely closed; the two minors below
are a latent false-positive risk and a merge-sequencing note, neither a secret leak nor a regression.

---

## R1 closure

**M1 (door-entry leak guard) is closed.** `SecretLeaks.door_entry_issues` now matches what the server
ships. The server strips `requires` only from a node that carries its own `lockType` and is not
rfid/biometric/bluetooth: `GamesController#filter_requires_recursive`
(`games_controller.rb:2613-2633`), `Game#filter_inventory_for_client!` (`game.rb:1313-1327`) and the
room route's `Game#filter_requires_and_contents_recursive` (`game.rb:6092`, used by
`filtered_room_data`) all gate the `obj.delete('requires')` on `lock_type && !%w[biometric bluetooth
rfid]`. A bare `rooms.*.doors[]` entry (no own `lockType`) is never stripped, so its `requires` ships
in the per-room payload. The guard flags exactly this: for an entry with no own `lockType`, a
`requires`, and a connected room whose lock type is in `ANSWER_LOCK_TYPES` (pin, password,
combination, cryptex), it emits the plan's error. Probed directly: a bare pin entry and a bare
combination entry each error; bare rfid, biometric and bluetooth entries stay clean (their resolved
type is not a secret kind). The secret-kind set is right: it is the complement, inside the server's
own strippable set, of the card-reference kinds, so it matches "reads the code off the door". Only
entries `NpcHabits.doorway_problem` clears are resolved, so an entry the client never reads (no
`direction`, no matching `connections`) raises nothing, which the probe also confirmed.

**m2 (mismatch warning) is closed, and the suppression is right.** `door_entry_issues` warns when an
entry's own lock type or `requires` differs from its connected room's, and `next`s past the warning
on any entry the M1 error already named. Suppressing it there is correct: the M1 message already
tells the author to set a `lockType` or remove `requires`, so a second line on the same entry would
be noise. Probed: an own-`lockType` entry whose `requires` differs warns; a bare entry whose
`requires` differs produces the M1 error only.

**m1 (array-form combination) is closed with no new false positive.** `collect_scalars` now yields
each array whole (reaching the array branch of `answer_matches_leaf?`) and then still descends into
its elements. Probed: a combination answer matches an equal `[12, 30, 5]` leaf, a non-equal
`[1, 2, 3]` does not, and `collect_leaves` emits both the whole array and its three integer leaves.
For every non-combination kind an array leaf is not a String, so it falls to `av == lv.to_s`, which a
real answer never equals, so the whole-array yield adds no false positive.

**The test_secret_leaks door-entry removal (`5fc9760d9`) still exercises all three withholding
cases.** The office-to-vault door entry is now `{ "connectedRoom": "vault", "direction": "north" }`
with no `requires`, removing the real leak that had shipped the vault PIN in the office payload. The
three withholding cases survive, all via server-held capture/account paths, not the door field:
Mara's `usePayload.secret "12-30-5"` equals the strongbox combination; Rhea's `creds.password "WOLF"`
equals the cryptex answer `wolf` (with a `captureProof`, in a proof-declaring scenario); Tess's
`usePayload.secret "4821"` equals the vault pin. Each is gated by the dropped `evidence_usb` proof.
The scenario validates clean (0 errors, 0 warnings, ink on, confirmed live).

Focused suites re-run here: `validator-secret-leaks` 24/24, `validator-acknowledged-clues` 10/10,
`validator-known-failures` 15/15.

---

## Fresh pass over the whole step

Sound, verified directly:

- **Secret safety on every route.** Bootstrap: `filtered_scenario_for_bootstrap` keeps the room's own
  `requires` in its keep-list but the serving action strips it (`games_controller.rb:308`,
  `filter_requires_recursive` after `filtered_scenario_for_bootstrap`); `doors` is not in the room
  keep-list, so a door entry cannot leak through the bootstrap at all. Room payload: the M1 route,
  now guarded. Capture route: `strip_capture_secrets!` runs in every room/bootstrap/inventory filter
  and the real secret is served only by `GET /capture_secrets` after a proof. `acknowledgedClues` is
  deleted in `filtered_scenario_for_bootstrap` (`game.rb:1802`); it is a top-level key never named by
  a leaf walk and never reaches a response.
- **No legitimate player refused.** The comparator `Game.lock_answer_matches?` (`game.rb:3577`) is
  `answer_key(secret) == answer_key(attempt)` for combination and cryptex, `else false`. Probed
  through `CaptureModel.answer_key`: the four blank/nil refusals and the non-String cryptex refusal
  hold; `"L12 R30 L5"` opens `[12, 30, 5]`; `"ÉCOLE"` opens `école` and `"STRASSE"` opens `Straße`
  (the folding `casecmp?` already allows); a combination `"twelve"` refuses every attempt; a password
  stays case-exact (`satchel42` is not opened by `Satchel42`). Serving only widens withholding
  (combination/cryptex capture secrets and account passwords, gated by proof), as the cheat policy
  intends.
- **Comparator equivalence with the old code.** `answer_key` folds every documented combination form
  to one key and matches the old `present?`/`casecmp?` behaviour. A stray `"5"` beside `[12, 30, 5]`
  keys to `combination:5`, absent from the set, so it is still served; `"12-30-5"` is withheld.
- **Validator false positives and negatives.** A corpus-wide `door_entry_issues` sweep over every
  rendered `scenario.json.erb` produced zero warnings and zero errors, so the R1-added door code is
  clean on the corpus. A corpus validator sweep (below) shows no new `secret leak` error and no
  "could not run".
- **Test quality on the real path.** The fixture uses only server-held capture/account withholding,
  so the Rails tests drive the real `authored_capture_secret` / `account_password_opens_something?` /
  bootstrap route rather than reimplementations. The comparator's real POST route is the live proof's
  job.
- **Plan coverage.** Items 1 to 5 and the playtest scanner (item 7) are present; the `usePayload`
  can-never-be-served warning (item 6 of the plan's change list) is in `usepayload_issues`. Item 6
  (the live browser proof) is the separate run.
- **Merge-tree against main `e1303fc0c`.** `git merge-tree --write-tree 566db9073 e1303fc0c` is clean
  (exit 0, a single tree OID, no conflicted paths). `acknowledgedClues` never ships, so it needs no
  `x-serverOnly` mark and never reaches the `PayloadLeafClassifier`, which only classes response
  leaves.

### m3 (Minor). The door mismatch warning can false-positive on an rfid card written in a different shape

Evidence. `door_entry_issues` computes `requires_differs = entry.key?('requires') && entry['requires']
!= connected['requires']` with a raw `!=`, for every lock type including rfid. An rfid card id is
equally valid as a string (`"badge"`) or a one-element array (`["badge"]`), and the client fills and
checks either, so the two shapes are the same card. If an author writes the door entry's `requires`
in one shape and the connected room's in the other, the warning fires although nothing differs.
Probed: a bare rfid entry `requires: "badge"` against a room `requires: ["badge"]` raised the
mismatch warning. The legitimate clone-as-entry pattern the plan describes (a door entry whose
`requires` deliberately differs from the room for the gate sign) also draws the warning, but the plan
names that warning as intended, so that half is by design.

Impact. Low, and latent: the corpus `door_entry_issues` sweep is empty, so no scenario trips it
today (every corpus rfid door entry and its room use the same string form). It is a warning, not an
error, and never a secret leak. The risk is future noise, not a blocked player or a shipped secret.

Suggested fix. Compare rfid/biometric/bluetooth `requires` after normalising each to `Array(...)` (or
skip the `requires_differs` warning entirely for the card-reference kinds, keeping it for the secret
kinds where a true display/server split matters). Add a fixture pairing a string entry with an array
room.

### m4 (Minor). Merging step 3 flips on main's held payload scan, which then fails until its body is built; step 3's merge notes do not say so

Evidence. 6a-1 part 1 (in main `e1303fc0c`, not on this branch) ships
`test/models/break_escape/payload_scan_fresh_state_test.rb`. Its final test skips on `SCAN_PENDING`
`unless self.class.schema_declares_acknowledged_clues?`, and that predicate returns true the moment
any `properties` block in `scripts/scenario-schema.json` declares `acknowledgedClues`. Step 3 adds
exactly that declaration (top-level `properties`, `scenario-schema.json:351`). So when step 3 lands
in a tree that also carries the 6a-1 test, the skip lifts and the test runs `flunk SCAN_READY` on
purpose, to force the fresh-state corpus scan body to be written. On this branch the test and
`PayloadLeafClassifier` are absent, so nothing activates here; the trip only happens at the merge
with main or 6a-1. The build log's "Reader wiring for the 6a-1 merge" paragraph covers the
`acknowledgedApproved` import but does not mention this self-activating flunk, so a merge batch could
be surprised by a red model suite.

Impact. Low and by design, but it affects merge sequencing: the batch that brings step 3 and 6a-1
together must build the held corpus scan body (the 6a-1 to-do) in the same batch, or main's model
suite goes red on a deliberate tripwire.

Suggested fix. Add one line to the build log's 6a-1 merge note (and the merge batch checklist): "the
schema declaration flips `schema_declares_acknowledged_clues?` true, so
`payload_scan_fresh_state_test`'s held scan self-activates and flunks until its corpus-scan body is
written; do both in the same batch." No code change on this branch.

---

## Notes and things I was unsure of

- I relied on `validator-acknowledged-clues.test.mjs` (which checks the real m06 and m08 markers) and
  the build-log corpus table for the exact m06 "3 acknowledged clues" and m08 "1 global warning"
  counts, rather than re-running those two full ink validations; the validator corpus sweep I ran was
  `--skip-ink` and greps only for leak errors, so it confirms "no new error" but not the info-line
  counts.
- I did not re-run the predicate-diff harness or the full Rails suite; both belong to their own runs.
  The door-entry fix and the array fix touch only the validator and one fixture scenario, so the
  empty predicate diff recorded in the build log is unaffected.
- m3 and m4 are both low enough to leave to the owner's judgement; neither blocks the ship.
