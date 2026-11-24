# Ops follow-up, track B: build brief

Track B covers the S6 view follow-ups (Terminal and Panels), the realism catalog rules, the docs tidy, the
playtest tool default under `tools/playtest/`, and one new scenario validator warning. Worktree
`/data/be-ops-follow`, branch `ops-follow1`. Read `BUILDER_RULES.md` (session scratchpad) first; it applies whole.
Commit message prefix: `Ops follow-up B unit NN:`. When your context passes 150k tokens, write a hand-over
note (`docs/agents/ops_core_build/HANDOVER_FOLLOW_B<unit>.md`: done, open, files) and stop.

Short names: `NV/` is `public/break_escape/js/minigames/network-view/`; `CAT` is
`scripts/validate_realism_catalog.rb`; `FAULTS/` is `test/fixtures/realism_catalog/catalog_faults/`.

## Decisions (settled; do not reopen)

| Id | Decision |
| --- | --- |
| S6-2 life | Once a view has offered the Terminal, it keeps the Terminal and the switch until the view closes. |
| S6-4 span | A Terminal table is one span per cell, lined up with CSS widths, never with runs of spaces. |
| S6-5 whole | A move that ends the trip needs its whole verb; a short form is refused. |
| S6-7 gui | Playtest tools open the Panels view unless told otherwise. |
| S6-9 mirror | A catalog entry's script name must not mirror its entry id. |
| S6-9 freeze | An entry's advisories and output are frozen once a shipped scenario links it. |
| S6-9 tell | The telltale list gains: honeypot, bogus, dummy, spoof, phony, harmless, benign. |
| S6-9 tidy | Nicknames quoted in the plan and in one review file are replaced. |
| S5A-3 warn | The scenario validator warns about a container a player cannot open. |

Two readings made by the planner, both for the review to confirm:

- **mirror.** The decisions file says "advisory id"; the form the owner filled in says "a script name must not
  mirror its entry id" (the three training entries do so today). This brief builds the form's wording.
- **shipped.** "Shipped scenario" for the freeze means a scenario folder whose name does not start with `test_`
  (S6_R3 "for the owner" item 11 says "shipped, non-test"). Today only `test_ops_skin` links entries, so nothing
  is frozen yet and no other branch's edit to the training fixtures can fail on this rule.

## What the code does today

- **life.** `NV/network-view-minigame.js:132-137` `viewHasOps(view)` is worked out from the current view each
  time. `hasOps()` (`:654`) calls it; `syncSkin()` (`:689-708`) mounts Panels and removes the switch as soon as it
  is false; `currentOffers()` (`:642-651`), `opsLog()` (`:659`) and `getTestState()` (`:1273`) read it too. The
  test `test/js/network-skin-switch.test.mjs:249` asserts the swap to Panels (review R3-4).
- **span.** Three table builders pad with spaces: `NV/terminal-format.js:233-246` `tableLines` (a spacer span of
  repeated spaces between cells), `NV/cli-gen/scanner-output.js:118-122` `tableLines` (a whole row joined into one
  padded string) and `NV/cli-gen/framework-console.js:87-91` `table` (`padEnd` inside each span). A cell made of
  several spans appears only as the last column (`hostStatus`, `resourceCells`, `terminal-format.js:302-336`).
  `cleanSpan` (`:118-122`) keeps only `text` and `cls`. The renderer draws spans at
  `NV/network-view-terminal.js:233-241`; the state key `log` joins span text at `:204`. CSS:
  `public/break_escape/css/network-view-minigame.css:856-864`.
- **whole.** `NV/terminal-grammar.js:252-271` `resolveVerb` accepts any unique prefix of a verb or alias, so `un`
  resolves to `unplug` (`doUnplug`, `:581-585`) and `ex` or `q` to `exit`. At the shell prompt `exit` closes the
  view (`NV/network-view-terminal.js:567-570`), and a closed view ends the trip
  (`public/break_escape/js/systems/network-links.js:116`).
- **gui.** `tools/playtest/lib/session-args.sh:12-63` `session_args_parse` adds `net_skin=<value>` to the URL only
  when `--net-skin gui|cli` is given. With no option the page follows the stored pick, then the scenario's
  `networkView.defaultSkin` (`NV/skin-choice.js:8-10`); `scenarios/test_ops_skin` sets `cli`.
- **mirror.** `CAT:238` runs only the text rules on `script`. Nothing compares it with the id.
- **freeze.** `CAT:261-263` `realism_identity` digests title, module and script. `INDEX_ROW` (`:266`) and
  `realism_read_index` (`:272-296`) read five columns; `realism_index_text` (`:329-347`) writes them; the check
  is at `:414-426`. Advisories and output are covered only by their counts (`realism_form`, `:254-257`).
- **tell.** `scripts/realism_text_rules.rb:33` `TELLTALE` holds six words; `telltale_rules` (`:198-210`) matches
  whole words, joined by `_` or `-` for a module, script or id. Both the catalog validator (`CAT:207`) and the
  scenario skin validator (`scripts/validate_realism_skin.rb:291`) call it.
- **tidy.** `docs/achitechture/OPS_REALISM_SKIN_PLAN.md` (near line 1332) and
  `docs/agents/ops_core_build/reviews/S6_server_R1.md` each hold two lines that match
  `scripts/real_vuln_nicknames.txt`; the review file also holds a placeholder article number and a public
  resolver address (S6_R3 item 15).
- **warn.** The client treats a missing `locked` as locked with a key lock
  (`public/break_escape/js/systems/unlock-system.js:1052`, `:1722`). `scripts/validate_scenario.rb:3669-3674`
  raises an error for contents with no `locked` key, but only for seven types (briefcase, bag, bag1, suitcase,
  safe, pc, bin1), so a folder or a cabinet passes. Inside a container window only some nested items open
  (`public/break_escape/js/minigames/container/container-minigame.js:2441-2490` `isInteractiveItem`: locked
  items and a `folder` with contents among them), so a nested container of another type is an inert icon.

## Units

Every unit: one commit by explicit path; tests drive the real modules (the scene through
`test/js/support/network-view-harness.mjs` `mount`, the validators by calling their real functions); answer
shapes come from the existing fixtures (`loadFixture(name)` over `test/fixtures/network-view/`), never from a
hand-written stand-in; no test changes a method of an application class without restoring it in `ensure`; no
new static JS import is expected, and if you add one, put it on every harness copy list and in
`test/js/network-skin-imports.test.mjs`. No scenario file is edited by any unit.

### Wave 1 (seven units, disjoint files, built side by side)

**B1. The Terminal stays for the life of the view**
- Files: `NV/network-view-minigame.js`, `test/js/network-skin-switch.test.mjs`.
- Build: the scene remembers that its view has had an ops block. Add a field set in the constructor to false and
  set to true the first time `viewHasOps(this.view)` is true; `hasOps()` returns the field or the live value.
  Use `this.hasOps()` in `currentOffers()` in place of the direct `viewHasOps` call, so the Terminal still gets
  each offer's command line. `viewHasOps` itself (exported, pure) does not change. The field belongs to the scene
  instance: a view opened afresh works it out again. A view that never had an ops block is as today (Panels, no
  switch, no `skin` key, the Terminal never built).
- Tests: rewrite the test at `:249` to the new rule: after the refetch that removes `ops` and `swept`, the switch
  is still there, `.network-term` is still mounted, `getTestState().skin` is `cli`, the log has kept its lines,
  the prompt still has the focus, and nothing was sent. Add: the same refetch from Panels keeps the switch, and a
  press still reaches the Terminal; a typed `show` and a typed `unplug` still work on the view with no ops block;
  a second `mount` of a body with no ops block gives Panels with no switch. The tests at `:60` and `:347` must
  pass untouched.
- Done: the two files' tests, `network-view.test.mjs`, `network-view-ops.test.mjs`,
  `network-skin-unchanged.test.mjs` and `network-view-panels-same.test.mjs` pass.

**B2. The whole verb for a move that ends the trip**
- Files: `NV/terminal-grammar.js`, `test/js/network-terminal-grammar.test.mjs`.
- Build: in `resolveVerb`, an exact verb or an exact alias resolves as today. When the prefix step finds exactly
  one verb and that verb is `unplug` or `exit` (this covers a short form of the alias `quit`), return the
  existing `T.UNKNOWN` message with that verb (`Unknown command. Did you mean unplug?`). No new sentence, so the
  text lists of the parity tests do not change. A prefix shared by several verbs answers `T.COULD_BE` as today.
  The rule holds at both prompts. Tab completion (`complete`, `:934-976`) is unchanged: it only fills the line.
- Tests: `un`, `unp`, `unplu`, `ex`, `exi`, `q`, `qui` send nothing and give the message, at the shell and the
  framework prompt, with an unplug offer present; `unplug`, `exit`, `quit`, `UNPLUG` and `  unplug  ` resolve as
  today; `chec web01` and the other prefix cases of the test at `:154` are unchanged; Tab on `un` still completes
  to `unplug `; the round-trip test at `:66` (every offer's command parses back) still passes.
- Done: the grammar tests plus `network-terminal-renderer.test.mjs`, `network-terminal-hostile.test.mjs` and
  `network-skin-text.test.mjs` pass.

**B4. Wider telltale list**
- Files: `scripts/realism_text_rules.rb`, new `test/unit/realism_telltale_words_test.rb`.
- Build: add the seven words to `TELLTALE`. Nothing else in the file changes.
- Tests (call `RealismTextRules.check` itself): each new word is an error in prose, and joined by `_` or `-` in a
  module, a script and an id; a longer word that merely contains one (for example `dummying`) is not matched,
  as for the old words; the committed catalog (`check_realism_catalog` with its defaults) still has no error;
  `validate_realism_skin` over each of the six `scenarios/test_ops_*` gives the same lines as before.
- Done: the new file, `validate_realism_catalog_test.rb` and `validate_realism_skin_test.rb` pass. If a shipped
  scenario or the committed catalog gains a line, stop and report; do not edit them.

**B5. Catalog: the mirror rule and the content freeze**
- Files: `CAT`, `test/unit/validate_realism_catalog_test.rb`, new folders under `FAULTS/` with their rows in
  `FAULTS/EXPECTED.json`, `docs/REALISM_CATALOG_INDEX.md` (written by the script, never by hand).
- Build, mirror: error `script_mirrors_id` on field `script` when the script and the id are equal once lower-cased
  and with `-` and `_` removed. An id that already has a row in the index is exempt, because its script is frozen
  by the identity digest and cannot be renamed (this is what lets the three training entries stand). Read the
  index before the entries are checked to know which ids have rows.
- Build, freeze: a sixth index column `content`: a 12-character digest of `advisories` and `output`, or `-`.
  When the index is written, a row keeps the digest it already has; a row without one gets a digest when at least
  one linking scenario folder does not start with `test_`; otherwise `-`. When the index is read, a row whose
  digest differs from the entry's is the error `index_content_changed` on field `content`. A five-column index
  (the committed one, and every earlier commit of it) must still read; a six-column header makes the sixth cell
  required on every row, as the identity cell is now. Update the index's own header text. Messages never quote
  catalog text.
- Tests: fixtures `script_mirrors_id` (fails), a passing fixture whose mirrored id is already in its index, and
  `index_content_changed`; real-function tests that a linked, non-test entry gets a digest, a `test_`-only link
  gets `-`, a digest survives the link being removed, changed output or advisories then fail while the counts
  stay equal, and a `-` row may still change; extend the history test (`:263`) so that a digest in any earlier
  committed index must still be in the index; the five-column tests (`:351`) still pass; the committed index
  equals what the script writes (`:54`).
- Done: the catalog test file, `realism_separation_test.rb` and `test/lib/realism_catalog_test.rb` pass;
  `ruby scripts/validate_realism_catalog.rb` exits 0 and the committed index has three rows ending `| - |`.
  `config/break_escape/realism_catalog/*.json` is not edited.

**B6. Nickname tidy in two docs**
- Files: `docs/achitechture/OPS_REALISM_SKIN_PLAN.md`, `docs/agents/ops_core_build/reviews/S6_server_R1.md`,
  `test/unit/realism_separation_test.rb`.
- Build: replace each quoted nickname with plain words ("a listed nickname", or an invented one in the style of
  the test fixtures); replace the placeholder article number with "an article number" and the public resolver
  address with an address from a documentation range. Keep each sentence's meaning. Do not copy a nickname into
  the commit message, the test or your reply.
- Tests: one new test in the separation file: neither file matches any pattern of
  `realism_skin_nickname_patterns(realism_word_list(REALISM_NICKNAMES_PATH))`. The message names the file and
  line number only.
- Done: the separation test file passes.

**B7. Validator warning: a container a player cannot open**
- Files: `scripts/validate_scenario.rb` (one new function `check_unopenable_containers(json_data)` and one
  `run.call` line beside `check_dispenses_containers`, about `:9100`), new
  `test/js/validator-unopenable-containers.test.mjs`, `README_scenario_design.md` (one sentence under "Container
  Objects", about `:1503`), `docs/agents/ops_core_build/HANDOVER_FOLLOW_B7.md`.
- Build: walk room objects and their `contents` at any depth, and `accountProfiles.<id>.contents`. Two warnings,
  no errors:
  - **No `locked` key.** An object with a non-empty `contents` and no `locked` key, whose type is outside the
    seven that already raise the error at `:3669`, and which is neither a `lockType: login` PC nor a `usb`. Say
    that the game reads a missing `locked` as a key lock and give the fix (`"locked": false`, or `true` with a
    lock type).
  - **A nested container that will not open.** An item inside a `contents` list that has its own non-empty
    `contents`, is not `locked: true`, and is of a type `isInteractiveItem` does not open. Read
    `container-minigame.js:2441-2490` and the take path first; warn only where neither a click nor a take opens
    it. Name the types that do open (today `folder`).
  Each message starts `⚠️ WARNING:` and names the path and the object's name.
- Tests (the pattern of `test/js/validator-network-model.test.mjs`: spawn `ruby`, require the script, call the
  function): a folder with contents and no `locked`; a filing cabinet the same; a nested archive of a type that
  does not open; and no warning for `locked: false`, `locked: true`, a `folder` nested unlocked, a sign-in PC, a
  `usb`, an object with empty `contents`, and one of the seven error types (still the error, no second line).
- Report: run the validator over every `scenarios/*/scenario.json.erb` before and after (output under
  `/data/tmp/scratch/B7/`, deleted at the end). The only difference allowed is the new warning lines. Write the
  list of scenarios that gain a warning, with counts, in the hand-over file. Edit no scenario, campaign or test.
- Done: the new test and every `test/js/validator-*.test.mjs` pass (if `validator-known-rules.test.mjs` pins the
  check names, add the new name there and say so); exit codes of the validator are unchanged for every scenario.

**B8. Playtest sessions open Panels by default**
- Files: `tools/playtest/lib/session-args.sh`, `tools/playtest/session-start.sh` (usage comment only),
  `test/js/session-start-net-skin.test.mjs`.
- Build: with no `--net-skin`, add `net_skin=gui` to the `--url` value, unless that URL already carries a
  `net_skin=` value. `--net-skin default` adds nothing, so the page follows the stored pick and the scenario
  default. `gui` and `cli` work as today; any other value is still an error. The tag is worked out before the
  URL changes, as today.
- Tests: no option gives `?net_skin=gui`, or `&net_skin=gui` after a query, in both `--url X` and `--url=X`
  forms; a URL that already has `net_skin=cli` is handed on unchanged; `--net-skin default` hands the URL on
  unchanged and removes the option; the tag is equal in every case; the bad-value test still passes. The first
  test (`:27`) is rewritten to the new default.
- Done: the test file passes; `bash -n` is clean on both scripts.

### Wave 2 (two units, after wave 1 has landed)

**B3. One span per cell in Terminal tables**
- Files: `NV/terminal-format.js`, `NV/cli-gen/scanner-output.js`, `NV/cli-gen/framework-console.js`,
  `NV/network-view-terminal.js`, `public/break_escape/css/network-view-minigame.css`, and the tests
  `test/js/network-terminal-format.test.mjs`, `cli-gen-scanner.test.mjs`, `cli-gen-framework.test.mjs`,
  `cli-gen-defaults.test.mjs`, `cli-gen-provenance.test.mjs`, `network-terminal-renderer.test.mjs`,
  `network-terminal-hostile.test.mjs`, `network-skin-text.test.mjs`, `network-skin-parity.test.mjs`.
- Build: a span may carry `w`, a whole number from 1 to 80: the column's width in characters, gap included.
  In all three builders every cell but the last of a row is exactly one span: its text is the cell's value and
  one space (the separator, so copied text and the `log` state key still read as words), with `w` set to the
  column's longest value plus two. An empty cell is the one space. The last cell is as today (its own spans, no
  `w`). No span holds two or more spaces in a row for layout, and the scanner's row is no longer one string.
  `cleanSpan` keeps a valid `w` and drops any other. The renderer gives a span with `w` the class
  `network-term-cell` and a minimum width of `w` in `ch`; a line that holds such a span gets the class
  `network-term-row`. CSS: the cell is an inline block that keeps its spaces; the row does not wrap, and the log
  scrolls sideways when a row is wider than the screen. Lines with no `w` draw exactly as today.
- Tests: for each builder, with rows from the existing fixtures, every row has one span per cell, the `w` of a
  column is equal on the head and every row, and no span text matches two spaces; a control character in a cell
  is still replaced; a bad `w` (0, 81, 2.5, a string) is dropped by `appendLine`; in the renderer (jsdom) a cell
  has the class and the `min-width`, and a plain line has neither; the `log` key of `getTestState()` reads as the
  cells joined by single spaces. Update the padded expectations in the listed tests to the new text; keep each
  test's meaning. The word fallback in `network-skin-text.test.mjs:241-283` may stay.
- Done: every `test/js/network-*.test.mjs` and `test/js/cli-gen-*.test.mjs` passes; `network-skin-imports` shows
  no new import.

**B9. Documentation for the stage**
- Files: `docs/ACCESS_AND_NETWORKS.md` (the skin section, about `:1436-1458`), `docs/test-bridge.md` (`:502`),
  `tools/playtest/README.md`, `scenarios/test_ops_skin/PLAYTEST.md` (a playtest document, not the scenario).
- Build: say, in plain UK English, what B1 to B8 changed: the Terminal stays once offered; tables are cells
  with widths; `unplug` and `exit` need the whole word; the two new catalog rules, the sixth index column and
  what "shipped" means for it; the seven new telltale words; the session default and `--net-skin default`. In
  the playtest document, the beats that say "with no `--net-skin`" (D1, `:89`, and the switch beats, `:106`) now
  say `--net-skin default`. No nickname, real identifier or step text is added.
- Tests: none new; run `test/unit/realism_separation_test.rb` (it reads scenario folders and docs).
- Done: the separation test passes; each changed statement matches the code as landed.

## Click paths (what a player sees)

- **B1.** In an ops scenario, plug the device into a jack, open the view, press the switch to Terminal. When the
  view's last ops network is lost (an open network with services goes down, or the linked network's session
  ends), the Terminal, its log and the switch stay; before, Panels replaced them without a word.
- **B2.** In the Terminal type `un` and press Enter: `Unknown command. Did you mean unplug?`, the device stays
  in. Type `unplug`: the device comes out and the view closes. `ex` is refused the same way; `exit` closes.
- **B3.** In the Terminal type `show`, scan a host, and in the framework console type `search`: the columns line
  up, on a desktop and at a phone width (390 px), where a wide table scrolls sideways.

## Playtest outline (after wave 2; Sonnet; own keyless server on 3400-3499, own games from `new-game.rb`)

1. Start a session on `test_ops_skin` with no `--net-skin`: the view opens in Panels (`skin: gui` in the state).
   Start one with `--net-skin default` in a fresh game: it opens in the Terminal (the scenario's default).
2. In the Terminal: `un`, `ex` and `q` are refused and nothing is sent; `show`, a scan and `search` draw aligned
   tables at 1280 px and 390 px (one screenshot each); copy a table line and check the words are separated.
3. B1: name a shipped test scenario in which an ops network can be taken down while the view is open, and play
   it in the Terminal. If none allows it, say so; the scene test is then the proof and the review records that
   no browser run exists.
4. Finish with `unplug` typed in full; `verify-run.rb` shows the trip ended. Run the leak check as for S6.

## What the review must check

- Each unit's tests fail against the code before the unit (run them on a copy of the old function, not a stub).
- B1: no path builds the Terminal for a view that never had an ops block; a hand-over and a return keep the rule.
- B2: no short form of any length reaches `unplug` or `exit`, by a typed line, a `;` line or a framework line.
- B3: no layout by spaces is left in any of the three builders; a hostile cell cannot set a style (only the
  number `w` reaches the DOM); the log cap and the repeated-Tab rule still hold.
- B5: the two readings above; a hand edit that clears a digest is caught by the history test; a five-column
  index from any earlier commit still reads; the exempt list cannot be widened by writing a first index.
- B4, B7: validator output over every shipped scenario differs only by the new warning lines listed in the B7
  hand-over; `bin/ops-golden-compare` is clean (no unit touches the server, so any difference is a fault).
- No nickname, real advisory id or module path outside `config/break_escape/realism_catalog/*.json`, which no
  unit edits. UK English throughout.

## Hand to

- **Track C:** the playtest recorder under `.claude/skills/playtest-scenario/` and `tools/playtest/train-check.sh`
  are not touched here. If a train or the recorder needs the Terminal, it passes `--net-skin cli` or `default`.
- **Not changed, by choice:** the stand-alone tools that open a page themselves (`shell-x-check.mjs`,
  `train-smoke.mjs`, `signin-fit.mjs`, `signin-live-drive.mjs`) start a fresh browser with no stored pick and
  open no view with a Terminal default; `network-skin-parity.mjs` names its skin. `tools/phone_calls/` has its
  own copy of the session script and is outside this track.
- **Owner:** three more files match the nickname list and are outside the decision:
  `docs/agents/ops_layer/reviews/OPS_REALISM_SKIN_R10.md`, `docs/agents/SECGEN_MODULE_PLAN.md`,
  `docs/agents/AWARENESS_MODULE_SEEDS.md`. Scenarios that gain the B7 warning are listed in the B7 hand-over for
  their own tracks; campaign missions are not edited here.
- **Later stage:** when a real (non-training) catalog file is added, its entries meet the mirror rule and are
  frozen on their first non-test link.
