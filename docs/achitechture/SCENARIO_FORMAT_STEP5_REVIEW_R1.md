# Scenario format hardening, step 5 review R1

Range reviewed: `cb259dbdf..0ae3b5cc3` (`dbd004731` implementation, `0ae3b5cc3` build log).
Branch: `build/hard-step5`. Worktree: `.claude/worktrees/p-hard-step5`.
Spec: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md`, step 5 (section 4) and build order.

## Counts

- Blockers: 0
- Majors: 0
- Minors: 3

Verdict: **SHIP.** The server's render is unchanged by construction, every renderer now goes through
`lib/break_escape/scenario_binding.rb`, the base64 and `json` decisions are sound, and the main
checkout is clean. The three minors are an incomplete build-log triage (the outcome of which I
verified is benign), inherited em dashes, and a merge-order advisory.

## 1. Server behaviour unchanged

Confirmed by a method-by-method diff of the old inline `Mission::ScenarioBinding` (cb259dbdf
`app/models/break_escape/mission.rb:393` region) against `lib/break_escape/scenario_binding.rb`:

- `initialize`, `vm_object`, `flags_for_vm`, `flags_for_vm_slice`, `vm_flags_json` are byte-for-byte
  equal (same `@random_pin = rand(1000..9999).to_s` seeding, same VM-missing `'{}'` rule in
  `vm_flags_json`, same `flags_for_vm_slice` shape). `scenario_binding.rb:23-108`.
- Only additions: `self.render` (`:40-42`), `json` (`:114-116`), and `@vm_context = vm_context || {}`
  (`:25`). The `|| {}` is inert: every helper already guards `if vm_context && ...`, and
  `generate_scenario_data` never passes nil. `mission.rb:209` now calls `ScenarioBinding.render`,
  which builds the binding and runs ERB with no trim mode, identical to the old
  `ERB.new(...).result(ScenarioBinding.new(vm_context).get_binding)`.
- `Mission::ScenarioBinding = ::BreakEscape::ScenarioBinding` (`mission.rb:339`) keeps every caller
  working. Grepped app/lib/test/tools/scripts and Hacktivity (read-only): every remaining caller
  uses either `BreakEscape::ScenarioBinding.render`, `Mission::ScenarioBinding.new({}).get_binding`
  or `BreakEscape::Mission::ScenarioBinding.new({}).get_binding` (TTS services, swap-scenario-game,
  tools/phone_calls/*, format_8*/phish tests). All resolve through the alias. Hacktivity holds no
  `ScenarioBinding` reference; it calls `generate_scenario_data`, which is unchanged.
- Live proof in the build log (games 4665/4667 created and served through the real bootstrap route)
  confirms Zeitwerk autoloads the lib file at `mission.rb:339`, so the server boots and renders.

## 2. Every renderer goes through the lib

Verified each: validator (`validate_scenario.rb:60-87`, deletes its copy, `require_relative`,
`render_erb_to_json` calls `.render`); dungeon graph (`generate_dungeon_graph.rb:28,57-60`);
`tools/pass2/render.rb` (drops its drifted `vm_object` with the spurious `system_name` key);
`scenarios/lab_tesseract_trials/tools/render_scenario.rb`; `scripts/check_door_alignment.py:71-78`
(`ROOT`/`os` already defined at `:19,21`; `ruby -r <lib> -e 'print ...render(...)'`); the four
ink-route `route.js` (m02/m05/m07/m08) and `sis02_multicall.mjs:66-70`; and the two bare renders in
`validator-office-presets.test.mjs:85` and `validator-action-condition.test.mjs:134`. Grep for
`def get_binding`, `def vm_flags_json`, `class ScenarioBinding` outside the lib returns nothing but
the test class name: no stray copy remains.

The old array-to-Hash readers are sound. The only validator reader of the top-level `flags` block
is `check_vm_flags_load_bearing` (`validate_scenario.rb:6313`), which already guards
`json_data['flags'].is_a?(Hash)` and iterates Hash groups, so it now resolves literal flag values it
previously skipped (fewer or unchanged warnings, never a crash). `CaptureModel.hard_access_values`
(`capture_model.rb:227-229`) iterates `flags.each_value { |group| group.each_value ... if
group.is_a?(Hash) }`: it always expected the server's Hash-of-Hashes. Before step 5 the validator fed
it the array shape, so VM flag values were silently absent from the hard-access set; step 5 is the
prerequisite that lets step 3's leak check (`validate_scenario.rb:7160`) see them. No validator
check read the old array shape in a way step 5 breaks.

## 3. The base64 deviation

Sound. `scenario_binding.rb:8` adds `require 'base64'` beyond the plan's three requires. Templates
m01, m03, m04 define an inline `base64_encode` calling `Base64.strict_encode64`, lab_tesseract_trials
calls `Base64` directly, and m08 self-requires it; the standalone callers (dungeon graph,
check_door_alignment, m08 ink route) previously carried no base64 require and would raise on those
templates. `base64` is Ruby stdlib (host runs RBENV 2.7.8), already required at `tts_service.rb`,
so no gem is added. The build log documents the deviation (step 5, "What changed"). Confirmed by
rendering m01 and m03 through the lib: both succeed (`flags=Hash`).

## 4. The json(value) helper

JSON-safe and documented. `json(value)` is `value.to_json` (`scenario_binding.rb:114-116`). The ERB
output is JSON text served as `application/json` and read into the engine via `textContent`, not an
HTML context, so `to_json` not escaping `<`/`>`/`&` is correct, not unsafe. It escapes quotes,
backslashes, newlines and non-ASCII (unit test `scenario_binding_test.rb:65-72` covers `"`, `\`,
`cafe`, `\n`, a number and nil). Documented in `README_scenario_design.md:2550` in the ERB helpers
table beside `.to_json`.

## 5. Render equivalence

Method is sound. The equivalence script stubs `SecureRandom.alphanumeric`/`hex` to constants and
sets `srand(4242)` before each render (covering `@random_pin`'s `rand`), then compares parsed JSON
with `==`. It would catch any real regression outside the one intended `flags` change. 167 of 179
identical; 11 differ only in top-level `flags` (the `vm_flags_json` users, now the server Hash);
lab_tesseract_trials is non-deterministic (`SecureRandom.random_bytes` + OpenSSL OAEP), shown by two
same-binding renders differing in the same five rooms, so the binding change contributes nothing.
Spot check rerun: m01, m03, test_simple_vm_flag render `flags` as `Hash` of `Hash`; ca00_first_play
(plain) has no `flags`; all parse. The one blind spot (lab_tesseract's five crypto rooms) is inherent
and correctly reasoned, not a step-5 miss.

## 6. Path-safety incident

Clean. In the shared main checkout `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape`:
`git status --short` shows only an unrelated untracked `docs/agents/UI_PASS_RESUME.md`;
`git diff --stat` is empty (no tracked file differs from HEAD). The new lib file is absent from
main's HEAD and working tree (`git cat-file -e HEAD:lib/break_escape/scenario_binding.rb` fails,
file not on disk), confirming the `git show HEAD:path > path` restore and the file move left no
residue in the shared checkout.

## 7. Tests and standing rules

New Rails test `scenario_binding_test.rb` (12 tests): each helper, the `'{}'` case, `json` escaping,
`render` returns a string, `render` builds the binding after a caller seed, and the alias identity.
New node test `scenario-binding-callers.test.mjs` plus the two updated validator tests. UK English;
no model names in the added code or tests; no new packages (base64 is stdlib; gemspec globs `lib/**`,
so the file ships to Hacktivity).

## Findings

- **Minor 1 (build log, incomplete triage).** `SCENARIO_FORMAT_HARDENING_BUILD_LOG.md` step 5 Tests
  ran m01 and the `test_*` corpus but not the m01-m10 before/after validator triage the plan's step 5
  Tests require ("`check_vm_flags_load_bearing` sees a Hash for the first time ... each change
  recorded in the build log with a verdict"). *Failure scenario:* a mission whose flag warnings
  shift on the array-to-Hash change goes unrecorded, and a genuine R29 finding for an owner is
  missed. *Verified benign:* I ran the validator on m02 and m08 (`--no-graph --skip-ink`); neither
  emits any flag-station or flag-lock warning, so nothing was hidden. Ask the builder to add the
  m02-m10 line to the build log.
- **Minor 2 (style, em dashes).** `scenario_binding.rb:87` carries an em dash
  (`"flags" section -- stays server-side only`), moved verbatim from the old server class, and the
  new build-log prose uses several. Against the standing no-dash rule. Low value: the lib comment is
  a faithful move, and the build log already uses em dashes pervasively (79 lines) as that file's
  house style, while the plan doc uses none.
- **Minor 3 (merge order, advisory).** `build/phone-calls-writing` (unmerged) conflicts with
  `mission.rb` (it also edits `generate_scenario_data` and the inline class); the build log already
  flags that its merger redoes the binding move. `build/hard-step4` also edits `validate_scenario.rb`
  and the schema, but in the ref/id-check and schema-walk regions, not `render_erb_to_json` or the
  deleted binding block, so the conflict is mechanical with no semantic overlap on the flags shape.
  No action in this branch; note it for the merge batch.
