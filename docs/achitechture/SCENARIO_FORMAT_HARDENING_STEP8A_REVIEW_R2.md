# Scenario format hardening step 8a, code review R2

Counts: blockers 0, majors 0, minors 0, nits 2

Branch `build/harden-8a`, tip `81f3fc44b`, based on main `8b6cf6a0d`. Scope: the R1 fixes
(`git show 81f3fc44b`) read against `SCENARIO_FORMAT_HARDENING_STEP8A_REVIEW_R1.md` and the build
log's "Step 8a review R1 fixes" section, plus a correctness re-pass of `git diff 8b6cf6a0d..81f3fc44b`.
Read-only review; this file is the only change. R1 nit2 (the `else`/`elsif`/`end` indentation) is
accepted per the orchestrator ruling (rubocop-rails-omakase enforces it), so it is not re-raised.

## What was checked and confirmed sound

- **maj1 (fixtures).** The four `test/fixtures/format_8a/<scenario>.old.json` are faithful renders of
  the base `8b6cf6a0d`: parsing each base template `git show 8b6cf6a0d:scenarios/<name>/scenario.json.erb`
  and the fixture gives structurally equal JSON for all four (the four carry no ERB, so render is a
  plain parse). They ship exactly the rendered scenario data the templates already carry (including
  the same `_draft` author notes that are already in the repo templates and already parsed by tests),
  so there is no new secret or note exposure. They are full renders (1381 to 2936 lines each), which
  is on the heavy side but required: the equivalence and object-set assertions compare whole renders,
  so a trimmed fixture could not back them. The README documents regeneration, and a template edit
  that outgrows a frozen fixture fails loudly (by design).
- **Inlined old readers match the base exactly.** Ruby `object_off_when_old`
  (`format_8a_corpus_test.rb:149-156`) reads an object's own `affordance.offWhen`; the base
  `AccessWork#affordance` (access_work.rb:233 at `8b6cf6a0d`) merges a preset affordance under the
  own one, but no office preset defines `offWhen` (grep of `public/break_escape/js/data/office-presets.json`),
  so the own-affordance read is the whole answer on this corpus, as the inline comment claims.
  `globals_hold_old?` reproduces the base `globals_hold?` (access_work.rb:436) verbatim, and its
  `NM.truthy?` equals the base `truthy_global?` (which delegated to `NetworkModel.truthy?`). JS
  `pcSwitchedOffOld` (`format-8a-reader-parity.test.mjs:45-53`) equals the base `pcSwitchedOff`
  (reads `data?.affordance?.offWhen`; the `data && data.affordance ? ... : undefined` form is the
  same for these inputs), the rest line for line.
- **Both tests pass without git.** Run with a stub `git` on `PATH` that exits non-zero on any call:
  `format_8a_corpus_test.rb` is green (17 runs, 290 assertions) and the two node tests pass, so
  neither shells out to git. (Under the lock, RBENV_VERSION=2.7.8: the three format tests give
  51 runs / 415 assertions / 0 failures; the parity and guard node tests both pass.)
- **Both tests still bite.** A no-op (identity) scenario transform makes `transformed(old) != new`
  for all four scenarios (checked via `bin/rails runner`), so the corpus equivalence assertion fails
  as intended. A new reader that still read `affordance.offWhen` disagrees with the old reader on the
  new render for the one `test_access_networks` object outage, so the JS parity assertion fails as
  intended.
- **Live-reader extraction.** `pcSwitchedOffNew` is pulled from the working-tree
  `unlock-system.js`, so the parity stays bound to real code. The guard test's `extract` resolves
  each marker to the definition, not a call site: `_isOff(o)` first appears at its definition
  (npc-needs.js:687), before any `this._isOff(o)` call (1574+); the other three markers are unique.
- **Empty-Hash guard matches Ruby.** Ruby `off_when_present?` treats an empty Hash as not present,
  so an empty-object `offWhen` is never an outage. The four JS helpers now return `false` for `{}`
  (`pairs.length > 0 && ...`, or `Object.keys(cond).length === 0` in `_isOff`), and
  `outage-empty-hash-guard.test.mjs` extracts each live helper and asserts both the `{}` case and a
  real single-key condition. The `_isOff` empty-object guard returns before `this` is touched, so the
  test's bare-object receiver is valid.
- **Comment/docstring fixes (nit1, nit4)** land where R1 named them; the schema and
  `format_upgrade.rb` keep the old field names only where the transform and the "was downIf"
  descriptions need them.

## Findings

### nit1. Three stale `affordance.offWhen` mentions the nit4 pass missed

The outage condition moved to the object in step 8a, but three comments still place it inside the
affordance:

- `public/break_escape/js/minigames/container/container-minigame.js:116` the `offWhenHolds`
  docstring says "Does a sign-in PC's `affordance.offWhen` hold", while the function reads
  `pcData?.offWhen` (:121). This file was edited in the R1-fix commit (the guard at :125), so the
  docstring was in view.
- `scripts/validate_access_work.rb:1070` lists "an affordance offWhen" among the server global
  reads.
- `scripts/validate_npc_needs.rb:435` the `check_off_when` comment says "affordance.offWhen (the
  requireGlobal form)", while the method reads `o.data['offWhen']` (:443).

Cosmetic, same class as R1 nit4. Fix: reword each to the object's `offWhen` (the container one to
"a sign-in PC's `offWhen`").

### nit2. The parity `extractFn` heuristic is more brittle than the guard test's brace matcher

`test/js/format-8a-reader-parity.test.mjs:34` closes the extracted function at the first
`/\n\}\n/` (a `}` alone on a line) and keys off the `export function NAME` literal (:31). It works
today because `pcSwitchedOff`'s only column-0 `}` is its own end and the signature is a plain
`export function`. A harmless refactor that converts it to `export const pcSwitchedOff = (...) =>`
makes the marker un-findable (the test then errors on the `assert.ok(start >= 0)`), and any future
body whose nested block closed at column 0 would be sliced short. Both failure modes are loud, not
silent, so the risk is low. The guard test's `extract` already matches braces from the parameter
list inward and accepts three head shapes; reusing that matcher in the parity test (or a short
comment pinning the single-column-0-brace assumption) would remove the divergence. Optional
hardening, not a correctness defect.
