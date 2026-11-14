# Format 8a outage-rename fixtures

Both sides of the step-8a corpus equivalence are frozen here, one pair per scenario:

- `<scenario>.old.json` — the rendered scenario data in its **pre-8a** shape (networks and resources
  carry `downIf`; objects carry `affordance.offWhen`).
- `<scenario>.new.json` — the same scenario rendered from the **post-8a** template (one outage field
  `offWhen`: a bare `downIf` becomes `offWhen`; an `affordance.offWhen` moves up to the object).

`test/unit/format_8a_corpus_test.rb` and `test/js/format-8a-reader-parity.test.mjs` read this frozen
pair. Freezing both sides keeps the equivalence a check of the step-8a transform alone: `transform(old)`
must equal `new`. A later edit to one of the four test scenarios (a sign's wording, a dropped
`linkName` override) changes the live render but not the frozen pair, so it cannot make the
equivalence drift. The live templates are instead guarded by a separate, edit-proof check in each
test: render the live template and assert no retired outage key has come back. Reading both sides from
fixtures, not through git, also keeps the check meaningful once 8a is on main (a merge base would
otherwise point at the new code) and lets the tests run in a gitless checkout.

## How they were made

- `.old.json`: captured from the merge base `8b6cf6a0d` (the main commit 8a was based on). Each base
  template `scenarios/<scenario>/scenario.json.erb` was rendered (`srand(1)` then ERB; the four carry
  no ERB tags, so this is a plain parse) and written as pretty JSON.
- `.new.json`: captured from this branch's templates at its tip, rendered the same way (`srand(1)`
  then ERB via `BreakEscape::Mission::ScenarioBinding`, then `JSON.pretty_generate`). On the branch
  where 8a lands (before any later scenario edit) `transform(old)` already equals this render, which
  is why it is safe to freeze.

When format hardening step 8b (one owner field, format 2) landed, both sides of the social, work and
needs_sims pairs were upgraded through the 8b `scenario` transform in place (the owner keys became one
`owner`, `private`/`deskPhone` moved to object level). Step 8a (outage) and step 8b (owner) touch
disjoint keys, so `transform_8a(old)` still equals `new`; the upgrade only removes owner keys the
`retired_keys_in` check would otherwise flag now that `current` is 2. `test_access_networks` carries no
owner key and was left unchanged.

To regenerate after a deliberate corpus change, re-render the relevant base template for the `.old`
side and the current template for the `.new` side the same way, and overwrite the file. A change that
alters the step-8a transform is the only thing that should move `.new.json` relative to
`transform(.old.json)`.
