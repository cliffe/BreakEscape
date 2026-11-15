# Combined hardening train: step 3 R4 (delta) and 6a-1 part 2 scan R2

Reviewed the worktree `build/hard-6a1-scan` at `0fbef85ed` (step 3 `build/hard-step3` up to
`5124574c4`, with main `eae23283d`, merged with the scan). Read the R3 (step 3) and R1 (scan) review
files, the delta diffs, the current `scripts/validate_secret_leaks.rb`,
`test/models/break_escape/payload_scan_fresh_state_test.rb`, the two fixtures, `strip_door_entry_requires!`,
the known-failures reader and the build log. Ran the three DB-free node suites and the scenario
validator on `test_unlock_gaps`. Review only; nothing changed but this file.

## Counts

A. Step 3, the delta since R3 (`1cf5cb499`)
- Blocker: 0
- Major: 0
- Minor: 1

B. The scan, R2 (everything since R1 `47c8a483c`)
- Blocker: 0
- Major: 0
- Minor: 1

## Verdict: SHIP

Every R3 and R1 finding is closed and probed directly. The two real `scenario_brief` leaks the R1
scan and the R3 review flagged are both gone (`test_secret_leaks` brief rewritten, `test_unlock_gaps`
brief trimmed), so the held corpus scan runs its real body green. The narrowing on both checks is a
sound trade-off. The two minors are documentation drift in the build log: the narrowing and the
`name` removal both changed behaviour without updating the build-log text, which now describes the
old behaviour. Neither affects runtime, tests or the scan result, so they do not block.

---

## A. Step 3 delta

### R3 findings, both closed

- **R3 M1 (fixture brief ships three secrets; the proof deletes the field that ships them).** Closed
  by `f92f9518a`. `scenarios/test_secret_leaks/scenario.json.erb` `scenario_brief` now describes the
  three cases with no literal value ("a combination padlock whose code is also Mara ... usePayload
  capture secret ... Rhea's account password is the answer to the cryptex cabinet ... Tess ...
  carries the vault door PIN"); `12-30-5`, `WOLF` and `4821` no longer appear in it. The live proof
  lost `bootWithoutNarrative()` and now scans the whole raw bootstrap plus both room payloads, so it
  skips no shipped field. Verified against the current fixture head and the commit diff.
- **R3 m1 (no guard on the always-shipped narrative).** Closed by `8aca15f46` (then narrowed by
  `fb22ad44c`). `validate_secret_leaks.rb` now warns when a lock answer, account password or capture
  secret appears in a shipped framing string, reusing `answer_matches_leaf?`, silenced to an info by
  an `acknowledgedClues` entry.

### The narrowing (`fb22ad44c`)

Sound. The framing fields kept under value-check (`scenario_brief`, `endGoal`, `name`, `door_sign`,
`lockedHint`) are places an answer should never appear, so a hit there is a true slip. Note `text`
and `observations` are the game's clue-delivery surfaces (a password on a post-it is the puzzle), so
value-checking them warned on every deliberate clue in the corpus; dropping them is the right call
for signal, and `acknowledgedClues` remains available for an author who wants to formalise a clue.

The realistic slip the narrowed check now misses: a 6+ character answer pasted into an item's
`observations` or a note's `text` where it was **not** meant as the clue for that lock (for example a
prop's examine text that spells the answer to a lock the designer intended to be worked out
elsewhere). That ships unflagged. The risk is low and is exactly what playtesting and human review
catch, and alert fatigue from checking clue surfaces would have made the warning worthless, so the
trade is defensible. Worth stating plainly in the docs that clue-surface fields are out of scope by
design (see the minor below).

### Minor A1: the build log still describes the pre-narrowing narrative check

Evidence. The R3 build-log section "m1, a guard on the always-shipped narrative"
(`SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`, "Step 3 review R3 fixes") still lists the scanned fields
as "`scenario_brief`, `endGoal`, an object's/room's `name` or `observations`, `door_sign`,
`lockedHint`, a readable note's `text`". After `fb22ad44c`, `NARRATIVE_STRING_KEYS` is
`%w[name door_sign lockedHint]` and the readable-note `text` branch is deleted, so `observations` and
note `text` are no longer scanned. The same section's "Corpus delta from the narrative check"
reports "32 new WARNING lines" and lists hits that sit on note `text` (crypto1 office note, crypto3
reception note, m05 IT-ticket notes, m07/m08/m10 hold PINs); after the narrowing those no longer
fire, so the count and the list overstate what the check now produces. The narrowing commit
`fb22ad44c` added no build-log entry, so its rationale lives only in the commit subject.

Impact. Documentation only. A reader of the build log would believe step 3 value-checks note text and
observations, and would expect a corpus warning set that the code no longer emits. The validator and
tests are correct; the record is stale.

Suggested fix. Add a short build-log note for `fb22ad44c`: the narrative check covers only the five
framing fields, note text and observations are left out as clue surfaces, and restate the corpus
delta against the narrowed set. While there, state the match-rule limit plainly for this check as the
scan section already does for its own (a secret under 6 characters, or a combination, embedded in
prose is not caught; those stay human-review territory); the narrative `answer_matches_leaf?` reuse
has the same blind spot and the code comment only alludes to it ("minimum-length ... rules apply").

### test_unlock_gaps edit (`5124574c4`)

Clean. The brief no longer lists answers ("Every answer is on the Codes note in the lobby; read it
first"), and the pocket cryptex answer is `TINDER`, so its display name "Pocket Cryptex" no longer
whole-word-matches the answer (the old `POCKET` did). `TINDER` is 6 letters and `cryptexConfig.wheelCount`
stays 6, so the wheel count still matches the answer length and the cryptex is enterable. The
validator passes on the scenario (0 errors, 2 unrelated warnings: a missing `_talk.png` and a
generic-ink unset var). No test or tool depends on the old answer or the old brief: the only `POCKET`
hits in code are `tools/playtest/walk-audit-diff.mjs` (an unrelated `POCKET_FAIL` cell-geometry
constant) and the scan test's history comment; `test/js/unlock-r1-ux.test.mjs` references
`test_unlock_gaps` only for its room layout, not the cryptex; `start_item_answer_network_test.rb`
builds its own inline cryptex (`RIDDLE`, wheelCount 6) and does not read the scenario file. The
`Codes` note still spells every answer, which is fine: the scan exempts note `text` and the narrowed
step-3 check no longer scans it, so `test_unlock_gaps` produces no leak finding on either check. One
stale trace: `HARDENING_SERVER_FIXES_BUILD_LOG.md:179` still says the pocket cryptex answer is
`POCKET`; that is a prior pass's build log, out of this train's scope, noted only for completeness.

---

## B. The scan, R2

### R1 findings, all closed

- **R1 M1 (class-3 declared text never value-checked; match rule too narrow for short/prose
  secrets).** Closed by `235e721ae`. `classify_scalar` now value-checks a `:class3` string leaf
  through `SecretLeaks.answer_matches_leaf?`, reports a match as `:class2` keyed on the enclosing
  object id (so an `acknowledgedClues` entry on `(lock, object)` can cover it, and a top-level
  `scenario_brief` match has no container and cannot be excused), and scopes out the in-world
  clue-delivery fields via `CLASS3_VALUE_EXEMPT_KEYS`. The too-narrow-for-short-secrets half is not
  "fixed" but accepted and documented: the classifier comment and the build log both state the scan
  reports no class 1/2/unexempted-class-4 **value-matchable** leaf, not "no secret ships", and cannot
  see a sub-6-character secret or a combination embedded in prose without unacceptable false
  positives. The per-class fixture test adds the class-3 cases (a 6+ char secret in `scenario_brief`
  caught; a PIN on a `door_sign` caught and clue-exemptable; a non-matching field and a `postitNote`
  clue pass). This is the correct resolution: loosening the rule would false-positive on `4821`,
  `1234` and `12-30-5` in ordinary text.
- **R1 m1 (SKIP_ROUTES omits friendface_phone).** Closed. `POST friendface_phone` plus the two
  redirect-only panel routes `GET vm_panel` / `GET vm_set_panel` were added, each with a reason, and
  the test now asserts `SKIP_ROUTES.size == 14`.
- **R1 m2 (build log names a non-existent `strip_feed_facts!`).** Closed. The only remaining mention
  is the fix note recording that the non-existent name was dropped; the method named is
  `SocialFeed.withhold_feed_facts!`.
- **R1 m3 (stale exceptions test name).** Closed. Renamed to "the real payload_scan_exceptions file
  parses to a JSON array".

### Consistency of the two value-checks, after the merge

`0fbef85ed` removed `name` from `CLASS3_VALUE_EXEMPT_KEYS`, so the scan now flags a 6+ char answer in
a display `name`, matching step 3's `NARRATIVE_STRING_KEYS` which includes `name`. This was coordinated
with the `test_unlock_gaps` answer change (`POCKET` to `TINDER`) so the one corpus hit no longer
fires. The two checks now agree on the framing fields (`name`, `door_sign`, `lockedHint`,
`scenario_brief`, `endGoal`) and both leave the clue surfaces (`text`, `observations`, and, for the
scan, `postitNote`, `message`) unchecked. The one asymmetry: step 3 is an allowlist of five framing
fields, while the scan is a denylist (every declared string except the four exempt keys), so the scan
also value-checks other declared strings such as `scenario_name`. That makes the scan stricter than
step 3, never looser, which is the safe direction and is consistent with the 0-finding corpus result,
so it is an observation rather than a defect.

### The stated limit in code and log

For the scan it appears plainly in both: the `classify_scalar` `:class3` comment and the build log
("What the fix deliberately does not claim ... cannot see a secret shorter than 6 characters ... nor
a combination quoted in prose"). The payload-scan test header carries the same caveat. Good.

### Minor B1: the build log still lists `name` as a scan-exempt key

Evidence. `SCENARIO_FORMAT_HARDENING_BUILD_LOG.md` (the "Scan tuning (noise)" paragraph) still prints
`CLASS3_VALUE_EXEMPT_KEYS = %w[postitNote text message observations name]` and keeps the bullet
"`name` -- item/object display name. Also the test_unlock_gaps false positive ... not a leak." After
the merge the constant is `%w[postitNote text message observations]` and the test-file comment was
updated to say `name` is **not** exempt (a framing field, as in step 3's check, the one corpus hit
fixed in the scenario). The build log was not updated to match, so it documents the opposite of the
code.

Impact. Documentation only. A reader relying on the build log would believe a secret in a display
`name` is exempt from the scan, which is no longer true. The code, the test comment and the merge
subject are correct.

Suggested fix. Update the build-log "Scan tuning" paragraph: drop `name` from the printed constant,
replace the `name` bullet with the "not exempt, framing field, corpus hit fixed by the `TINDER`
rename" note already in the test, and point the reader at step 3's `NARRATIVE_STRING_KEYS` for the
shared framing-field rule.

---

## The combined train (Focus 4)

- **The scan sees the stripped payload.** The merge carries step 3's `strip_door_entry_requires!`
  (`game.rb:6220`), called from `filter_requires_and_contents_recursive` (`game.rb:6191`). The scan's
  `scan_game` fetches the real `GET /room/:id`, which runs through `filtered_room_data` and that
  filter, so a pad-lock door entry's `requires` is stripped before the scan walks the body, and a
  card-reference entry keeps its id. The scan therefore reads the post-strip payload; the strip and
  the scan do not fight. R3 Focus 2 already cleared the strip as sound on every path and mutation-safe,
  and the merge brings it in unchanged.
- **The held-scan tripwire passes now.** The merged `payload_scan_fresh_state_test.rb` has its real
  corpus-scan body (no more `flunk SCAN_READY`), the schema declares `acknowledgedClues`, and both
  former leaks (`test_secret_leaks` and `test_unlock_gaps` briefs) are resolved, so the one finding
  that kept the assertion red is gone. `test/fixtures/files/payload_scan_exceptions.json` is `[]` and
  parses to an empty JSON array. The orchestrator reports the test green (0 findings, 0 exceptions
  over 180 scenarios) on this tip; I did not re-run the DB-backed scan because a full suite is running
  under the shared flock lock on this same tip and a second DB run would contend with it. The static
  chain (both leaks closed, exceptions empty, the two exempt-key sets consistent) matches that result.
- **Known-failures reads all three approved lists.** `otherApproved()` in
  `validator-known-failures.test.mjs` pushes the known-failures pairs (`LIST`), the payload-scan
  exceptions (`EXCEPTIONS`) and the `acknowledgedClues` markers (`acknowledgedApproved(root)`) into
  one shared-heading dedup. Three lists, confirmed.

## Anything new in the delta (Focus 5)

Nothing beyond the two minors. The node suites `validator-secret-leaks`, `validator-known-failures`
and `validator-acknowledged-clues` pass together (62/62) on this tip. The merge also pulled unrelated
main content (phone-call writing docs, `validate_scenario.rb` growth, schema and ink changes); that is
outside this train's scope and was not reviewed here.

## Things I was unsure of

- I did not re-run `payload_scan_fresh_state_test.rb` (DB-backed, 180 scenarios) to avoid contending
  with the full suite already running under the flock lock on this tip. My confirmation of the green
  result is static: both former leaks closed, exceptions `[]`, the scan's exempt keys consistent with
  step 3's framing fields, and the validator clean on `test_unlock_gaps`.
- Both findings are build-log accuracy, not code. If the owner treats the build log as a binding
  record for this hardening work (the R3 M1 round was itself about an honest record), these read as
  worth fixing before the train lands; I ranked them minor on runtime impact.
