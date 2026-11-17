# Scenario format hardening, step 5 review R2

Range reviewed: `cb259dbdf..dedc8c41f` (`dbd004731` implementation, `0ae3b5cc3` build log,
`9c6eea8f1`/`f45049efc`/`dedc8c41f` R1 fixes).
Branch: `build/hard-step5`. Worktree: `.claude/worktrees/p-hard-step5`.
Prior round: `docs/achitechture/SCENARIO_FORMAT_STEP5_REVIEW_R1.md` (0/0/3).

## Counts

- Blockers: 0
- Majors: 0
- Minors: 2

Verdict: **SHIP.** All three R1 minors are closed. A fresh method-by-method pass confirms the
server's render is unchanged, every renderer that carried a binding copy now renders through
`lib/break_escape/scenario_binding.rb` with no stray copy left, the one old array-shape reader wants
a Hash so step 5 feeds it rather than breaks it, the `json` helper and the `base64` require are
sound, and the main checkout is clean. The two new minors are a pre-existing renderer the step 5
"every renderer" claim does not cover, and a drift gap in the new caller test, both low risk.

## R1 minors: closed

- **R1 minor 1 (build-log triage): closed.** `dedc8c41f` adds the m01 to m10 triage to
  `SCENARIO_FORMAT_HARDENING_BUILD_LOG.md:3174-3179`: the validator was run on every m01 to m10
  template on the branch and on a base at `cb259dbdf`, flag-mentioning lines counted on both sides,
  counts identical and every run exits 0 (m01 7, m02 3, m03 1, m04 4, m05 4, m06 0, m07 3, m08 0,
  m09 3, m10 0). The array to Hash change hides no flag-station or flag-lock warning. I reran the
  validator on m01 (`--no-graph --skip-ink`): exit 0, which matches the recorded count.
- **R1 minor 2 (em dashes): closed.** `f45049efc` replaces the dashes in the lines step 5 added
  (the `scenario_binding.rb:87` comment and the build-log prose) with colons. A scan of every added
  line over the full range `cb259dbdf..dedc8c41f` finds no em or en dash.
- **R1 minor 3 (merge-order advisory): no action needed.** It was advisory for the merge batch, not
  a change to this branch. Still live for whoever merges `build/phone-calls-writing` and
  `build/hard-step4`.

## 1. Server render unchanged, method by method

Confirmed. `dbd004731` moves the inline `Mission::ScenarioBinding` to
`lib/break_escape/scenario_binding.rb` verbatim: `initialize`, `vm_object`, `flags_for_vm`,
`flags_for_vm_slice`, `vm_flags_json` (same `'{}'`-on-missing rule) and `get_binding` are
line-for-line equal. The only server-path change is `mission.rb:209`, where
`ERB.new(File.read(path)).result(ScenarioBinding.new(vm_context).get_binding)` becomes
`ScenarioBinding.render(File.read(path), vm_context)`; `self.render` (`scenario_binding.rb:39-41`)
is exactly that same `ERB.new(text).result(new(vm_context).get_binding)` with no trim mode, so the
server renders byte-for-byte as before. The one textual delta in `initialize` is
`@vm_context = vm_context || {}` (the server class had bare `vm_context`); it is inert, since
`generate_scenario_data` never passes nil and every helper guards `if vm_context && ...`.
`mission.rb:339` keeps `Mission::ScenarioBinding = ::BreakEscape::ScenarioBinding`, so every
aliased caller (the TTS services, `swap-scenario-game.rb`, the phone-call tools) still resolves to
the lib class.

## 2. Every renderer through the lib, no stray copy

The renderers that carried a near-copy of the binding now `require_relative` the lib and call
`.render`: the validator (`validate_scenario.rb:62`), the dungeon-graph generator, `tools/pass2/
render.rb`, `scenarios/lab_tesseract_trials/tools/render_scenario.rb`, `check_door_alignment.py`,
the four ink-route `route.js` (m02/m05/m07/m08), `sis02_multicall.mjs`, and the two in-test renders
(`validator-office-presets.test.mjs`, `validator-action-condition.test.mjs`, which previously used a
bare `ERB.new(...).result` with no binding object). A grep for `class ScenarioBinding`,
`def vm_flags_json` and `def get_binding` across `.rb/.js/.mjs/.py` outside the lib returns only the
test class name: no stray copy of the binding remains. See Minor 1 for the one renderer outside this
set.

## 3. The old array-shape reader

Sound. The validator's old `vm_flags_json` returned a JSON array; the lib returns the server's
`{ "flag_1": ... }` Hash. The only validator reader of the top-level `flags` block is
`check_vm_flags_load_bearing` (`validate_scenario.rb:6313-6316`), which iterates
`json_data['flags']` only when it is a Hash and `next`s on any inner value that is not a Hash. Under
the old array shape the inner values were arrays, so this reader skipped them and `literal_refs`
came out empty; step 5 is the prerequisite that lets it see the literal flag values, so the change
feeds this check rather than breaks it. The `obj['flags'].is_a?(Array)` at `:6327` reads a room
object's own station flags, a different field, unaffected. No reader expected the old array shape.

## 4. The json helper and the base64 require

Both sound. `json(value)` is `value.to_json` (`scenario_binding.rb:111-113`); the ERB output is JSON
text served as `application/json` and read into the engine with `textContent`, so `to_json` not
HTML-escaping `<`/`>`/`&` is correct. The unit test covers quote, backslash, accented char, newline,
number and nil (`scenario_binding_test.rb:61-69`). `require 'base64'` (`scenario_binding.rb:9`) is
beyond the plan's three requires but is a Ruby stdlib, not a gem (Gemfile and the gemspec are
untouched over the range), and several templates (m01, m03, m04) call `Base64.strict_encode64` from
an inline helper; the standalone callers carried no base64 require before, so the shared load is what
lets each one render every template.

## 5. Equivalence method

Sound as documented. The one-off diff stubs `SecureRandom.alphanumeric`/`hex` to constants and sets
`srand(4242)` before each render (covering `@random_pin`'s `rand`), then compares parsed JSON with
`==`: 167 of 179 identical, 11 differ only in the top-level `flags` Hash (the intended fix), and
`lab_tesseract_trials` is the one inherent blind spot (its crypto rooms draw
`SecureRandom.random_bytes` and run OAEP, non-deterministic by construction, shown by two
same-binding renders differing in the same rooms). The trim-mode loss is safe: `pass2/render.rb`,
`render_scenario.rb` and `check_door_alignment.py` dropped `trim_mode: '-'` on the move, and no
template in `scenarios/` contains `-%>`, so the rendered bytes do not change. `render` builds the
binding inside the call after any caller seed (`scenario_binding_test.rb:76-84` proves it), which is
what step 3's leak check needs.

## 6. Main checkout clean

Clean. In the shared main checkout `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape`:
`git status --short` shows only an unrelated untracked `docs/agents/UI_PASS_RESUME.md`;
`git diff --stat` is empty, so no tracked file differs from HEAD. The step 5 work left no residue
in the shared tree.

## 7. Standing rules

UK English throughout; no em or en dash on any line added over the range; no model name in the added
code, tests or docs; no new package (base64 is stdlib, the gemspec globs `lib/**` so the file ships
to Hacktivity).

## Findings

- **Minor 1 (renderer outside the lib, pre-existing).** `tools/format/rewrite_templates.rb:39`
  renders a scenario template with `ERB.new(text).result(binding)`, the script's own top-level
  binding, which defines none of `vm_object`/`flags_for_vm`/`vm_flags_json`/`json`. Step 5 did not
  touch this file and it carries no binding copy, so it is not a drift risk on the flags shape, but
  the step 5 "every renderer goes through the lib" claim does not cover it. *Failure scenario:* run
  this migration tool on a VM template (m01 among them) and it raises `NoMethodError: vm_flags_json`
  rather than rendering, as it would have before step 5. Pre-existing limitation of a one-off office
  life migration tool; note it so the "every renderer" phrase has its one documented exception. No
  change needed in this branch.
- **Minor 2 (caller test would not catch a private binding on several callers).**
  `test/js/scenario-binding-callers.test.mjs` genuinely guards only `pass2/render.rb` (`:41-46`,
  deep-equal against the shared one-liner). The `check_door_alignment.py` case (`:48-56`) asserts
  only that a door-alignment result was produced; door output does not depend on the flags block, so
  that test would still pass if the Python caller kept a private array-returning binding. The four
  ink-route `route.js`, `sis02_multicall.mjs` and `render_scenario.rb` are not exercised by any test
  at all. *Failure scenario:* a later edit reintroduces a local array-shape `vm_flags_json` in one
  ink-route `route.js`; the suite stays green and the ink runtime check silently reads flags in the
  wrong shape. Mitigated now by the no-stray-copy grep in section 2, which is the real guarantee, and
  by `render_scenario.rb` being non-deterministic (hard to assert on anyway). Low value: add a
  flag-shape assertion to the one-liner test per caller only if drift here proves a recurring risk.
