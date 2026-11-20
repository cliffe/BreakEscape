# Format 8b owner-rename fixtures

Both sides of the step-8b corpus equivalence are frozen here, one pair per scenario:

- `<scenario>.old.json` — the rendered scenario in its **pre-8b** shape: a workstation carries
  `screenOwner` (else an owner derived from a room NPC's `needsHome`), a Friendface phone and a
  left-behind item carry `phoneOf` / `leftBehindBy`, a desk phone carries `phoneOwner`, and a private
  object carries `affordance.owners` / `affordance.private`.
- `<scenario>.new.json` — the same scenario rendered from the **post-8b** template (one owner field,
  format 2): every retired owner key is now a single object/item `owner`, `private` and `deskPhone`
  sit at object level, and the workstation/private-object owner the old `needsHome` rule derived is
  written explicitly.

`test/unit/format_8b_corpus_test.rb` and `test/js/format-8b-reader-parity.test.mjs` read this frozen
pair. Freezing both sides keeps the equivalence a check of the step-8b transform alone:
`transform(old)` must equal `new`. A later edit to one of these scenarios changes the live render but
not the frozen pair, so it cannot make the equivalence drift. The live templates are instead guarded
by a separate, edit-proof check in each test: render the live template and assert no retired owner key
has come back. Reading both sides from fixtures, not through git, also keeps the check meaningful once
8b is on main and lets the tests run in a gitless checkout.

The four scenarios cover every transform path: `test_access_habits` (affordance.owners + affordance.private
moved up, derived PC owners), `test_access_social` (item `phoneOf` on NPC-held phones, derived PC
owners), `test_access_work` (an explicit `screenOwner`, an `affordance.private`, derived PC owners),
and `test_needs_sims` (a `phoneOwner` desk phone -> `owner` + `deskPhone`, a `leftBehindBy` badge, three
`affordance.private` PCs two of which drain their affordance to `{}`, derived owners).

## How they were made

- `.old.json`: rendered from the template at the branch's merge base `2f5471209` (chunks 1-3 did not
  touch the templates, so the base still carries the old owner keys). Each template is pure JSON (no
  ERB), so the render is `srand(1)` then a plain parse, written as pretty JSON.
- `.new.json`: rendered from this branch's rewritten template the same way. On the branch where 8b
  lands `transform(old)` already equals this render, which is why it is safe to freeze.

To regenerate after a deliberate change, re-render the base template for the `.old` side and the
current template for the `.new` side the same way and overwrite the file. A change that alters the
step-8b transform is the only thing that should move `.new.json` relative to `transform(.old.json)`.
