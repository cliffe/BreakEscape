# Ops follow-up B: review R1

Scope: the track B commits on `ops-follow1` (base `2d9e963c8`): B8 `c7acb07b3`, B2 `0fc9bc820`, B6 `d365b0d84`,
B1 `0428249de`, B4 `959c822cc`, B5 `8a06078a1`, B7 `d263e6fd5`, B3 `e26ed6cb5`, B9 `a0c170db8`. Read against
`FOLLOWUP_DECISIONS.md` (track B), `FOLLOW_B_BUILD_BRIEF.md` and the builders' reports. This review changed no code.

Counts: 0 blockers, 1 major, 4 minors.

## Findings

### R1-B1 (major): B3 drops the space between the spans of a table's last cell, and the table indent

- File: `public/break_escape/js/minigames/network-view/terminal-format.js:251`. The new filter
  `out.filter(s => s.text !== '' && !(s.w === undefined && s.text.trim() === ''))` removes every whitespace-only
  span with no `w`. That removes (a) the one-space separator that `joinSpans` (`:222-230`) puts between the spans of
  a last-column status, and (b) the indent span pushed at `:240` (`'  '` for host and resource tables, `'    '`
  for the service table under a host).
- Evidence: I ran `formatListing` with node over the shared fixtures, base `2d9e963c8` against HEAD (script
  `follow-r1-B/fmt.mjs` in the session scratchpad):
  - `host_states`, far network row. Base `["  ","FAR-01","  ","Far PC","  ","(down)"," ","No route"]`; HEAD
    `["FAR-01 @8","Far PC @8","(down)","No route"]`. The Terminal draws `(down)No route`, and the `log` state key
    (`network-view-terminal.js:204`, which joins spans with `''`) reads the same.
  - `shares`, locked share row. Base `[..., "Needs account"," ","Needs an account with access. ..."]`; HEAD
    `[..., "Needs account","Needs an account with access. ..."]`. The player sees `Needs accountNeeds an account ...`.
  - `findings_states`: the service table head was `["    ","SERVICE",...]` and is now `["SERVICE @9",...]`, flush
    left. The finding lines under it keep their four-space indent, so the table no longer sits under its host.
- This breaks the brief's "The last cell is as today (its own spans, no `w`)". It also makes the B9 sentence in
  `docs/ACCESS_AND_NETWORKS.md` ("copied text has the cells separated by single spaces") untrue for these rows.
  No test covers a last cell made of several spans or the indent, so the tests did not catch the change.
- Fix (`terminal-format.js`, `tableLines`): drop the `!(s.w === undefined && s.text.trim() === '')` clause so the
  last cell's spans pass through as before. Draw the indent as one empty cell, `{ text: ' ', w: indent.length }`,
  instead of `span(indent)`: that is one space, so there is no run of spaces, and the width keeps the indent. In
  `test/js/network-terminal-format.test.mjs`, add three checks. From the `host_states` and `shares` fixtures: the
  down row and the locked share row keep a `' '` span between their last-cell spans. From `findings_states`: the
  service table's first span is a cell with `w` 4, and the host table's first span is a cell with `w` 2. Re-record
  the cli-golden text files that the change touches.

### R1-B2 (minor): the one shipped warning is on a console that opens, and its advice would silence the warning without fixing anything

- Only one scenario gains a B7 line: `sis01_healthcare`, on `rooms/major_incident_room/objects[1]` (Backup
  Recovery Console, type `backup_recovery`, `scenarios/sis01_healthcare/scenario.json.erb:2497-2632`).
- This console is not a container the player cannot open. The client sends `backup_recovery` to its own minigame
  (`public/break_escape/js/systems/interactions.js:1724-1733`) before the container branch (`:1927`), so the
  client never reads the missing `locked` key. The console's `contents` (one `notes` item, the status report) are
  never shown, and the backup-recovery minigame does not read `contents`
  (`grep contents public/break_escape/js/minigames/backup-recovery/` finds no match). So the warning does point at
  an item the player can never reach, but it gives the wrong reason. Its fix (`"locked": false`) would silence the
  warning and leave the report out of reach: probed, the same object with `"locked": false` gives `[]`.
- Fix (`scripts/validate_scenario.rb`, `check_unopenable_containers`): some types are sent to their own screen
  before the container branch (the `sprite.scenarioData.type === ...` checks above `interactions.js:1927`). Keep
  that list in one constant beside `UNOPENABLE_ERROR_TYPES`. For those types, the warning should say that the type
  opens its own screen, so its `contents` are never shown, and give the fix "move the item out of `contents`".
  Add that case to `test/js/validator-unopenable-containers.test.mjs`, and update the `sis01_healthcare` line in
  `docs/agents/ops_core_build/HANDOVER_FOLLOW_B7.md`. Changing the scenario itself is for its own track.

### R1-B3 (minor): a nested container of one of the seven error types with no `locked` key gets no line at all

- `UNOPENABLE_ERROR_TYPES` exempts the seven types at any depth (`scripts/validate_scenario.rb:2753`, `:2764-2765`).
  The comment says this is because `check_common_issues` already raises an error for them. That error only walks
  top-level room objects (`validate_scenario.rb:3713-3717`, inside `room['objects'].each_with_index`).
- Probe (`follow-r1-B/b7probe.rb`, which calls `check_unopenable_containers` directly): an unlocked filing cabinet
  (`locked: false`) holds a takeable `briefcase` with contents and no `locked` key. The function returns `[]`, and
  the scenario validator raises no error for it either. Once the player takes the briefcase, it opens from the
  inventory through `handleUnlock`, which reads a missing `locked` as a key lock (`unlock-system.js:1050-1052`,
  `:1722`). No shipped scenario has this case today: a scan of all 211 rendered scenarios
  (`follow-r1-B/scan_nested.rb`) found none.
- Fix (`validate_scenario.rb`, `check_unopenable_containers`): apply the seven-type exemption only when `nested` is
  false. Add the nested takeable briefcase to the test file as a warning case.

### R1-B4 (minor): anyone can widen the mirror rule's exemption by adding an index row by hand

- `scripts/validate_realism_catalog.rb:410` takes the exempt ids from the index file as it stands
  (`read.first.keys`). Say a new entry's script mirrors its id, and the same commit adds that entry's row to the
  index by hand: the entry passes. The fixture `test/fixtures/realism_catalog/catalog_faults/pass_mirror_in_index`
  is exactly that case, and it passes. The history test (`test/unit/validate_realism_catalog_test.rb:364-392`) only
  checks that old rows are kept, not that the script wrote the new rows. The B5 builder reported this as still open.
- Fix (`validate_realism_catalog.rb`): take the exemption from a frozen constant of the three ids the index held
  when the rule landed (`filehold_link_setting`, `filehold_release_line`, `filehold_update_lag`). Pass it to
  `check_realism_catalog` as a keyword so the fault-fixture test can give its own list, and keep the passing fixture
  working through that keyword.

### R1-B5 (minor): the nickname tidy left a code-formatted example that is not an id

- `docs/achitechture/OPS_REALISM_SKIN_PLAN.md:1332` reads ``(`ms31_017_share`, `a listed nickname_check`)``, and
  `:1637` reads ``a catalog id `ms31_017_share` and one `a listed nickname_check` ``. Text inside backticks stands
  for a literal catalog id, and an id cannot contain spaces, so the example no longer shows what the rule refuses.
  The same commit uses the invented `tidepool` at `:1636` for the same purpose.
- Fix (that file, both lines): replace `` `a listed nickname_check` `` with `tidepool_check`.

## Checked and found sound

- **Validator over every shipped scenario.** I ran all 211 `scenarios/*/scenario.json.erb` through the base
  scripts and the HEAD scripts, each from a copy of `scripts/` with the rest of the tree linked in, using
  `--no-graph --skip-ink --no-lint`. I used `--skip-ink` so nothing is written into scenario folders that others are
  editing; no check in this track reads ink (B4's words are not used by `realism_skin_ink_wording`,
  `validate_realism_skin.rb:194`). Once the root path is normalised, the only difference is in `sis01_healthcare`:
  one new line (R1-B2) and the changed counts, with exit 0 on both sides. `test_ops_skin` differed only while the
  base run read the new six-column index; with the base index the output is identical. Exit codes are unchanged
  for every scenario.
- **B7 warnings, per scenario:** `sis01_healthcare` gains 1 (the Backup Recovery Console). It is not a container the
  player cannot open; see R1-B2. No other scenario gains a line, which matches the hand-over.
- **The B7 nested rule matches the client.** `isInteractiveItem` (`container-minigame.js:2441-2487`) opens an
  unlocked nested item only if it is a `folder`. Other types either open their own screen or do nothing, and a
  takeable item is taken (`container-minigame.js:1926`, `:2056`). The JS test file passes.
- **The B5 freeze cannot be bypassed once the validator and the test suite both run.** Every rewrite of the index
  keeps a row's digest (`realism_content_cell`, `validate_realism_catalog.rb:353-357`). A changed entry fails
  `index_content_changed` (`:459-461`), and the index is not rewritten while there is an error (`:466`). The history
  test catches a cleared digest, a changed digest, or a header cut back to five columns
  (`validate_realism_catalog_test.rb:338-358`, `:387-389`). A stale committed index fails the committed-index test.
  Apart from the identity fields, the schema allows only `advisories` and `output`, and the digest covers both.
- **Existing index entries still read.** The new reader reads every committed version of
  `docs/REALISM_CATALOG_INDEX.md` (`37f6f73a2`, `9cce7fe93`, `ffc2fb8bf`, `8a06078a1`): 3 rows each, no unreadable
  line. The committed index is identical to what `realism_index_for` writes (3 rows ending `| - |`).
- **The two readings.** Mirror: the owner's form says "A script name must not mirror its entry id", and that is
  what was built. Shipped: a folder whose name does not start with `test_`, as in S6_R3 item 11. A note for
  integration: `scenarios/demo_ops_recon` is not a `test_` folder. The first time a showcase scenario links a
  catalog entry and someone runs the script, that entry's advisories and output freeze. It links none today.
- **The catalog is append-only.** `git diff 2d9e963c8..HEAD -- config/break_escape/realism_catalog` is empty.
- **B4 telltale words.** None of the seven words appears in the catalog or in any scenario that declares
  `services`, and those are the only scenarios the text rules read. So no honest text is flagged, and the
  validator diff above shows no new realism line. The match is still whole-word
  (`realism_text_rules.rb:198-210`).
- **B2 whole verbs.** `resolveVerb` refuses only a unique prefix of `unplug` or `exit`
  (`terminal-grammar.js:262-263`). Exact verbs and aliases resolve first (`:256-257`). Every route to a verb goes
  through it: a typed line (`:773`), `help` (`:767`) and Tab completion (`:961`). A `;` line parses each segment
  through the same call. At the msf prompt, `un` and `ex` still answer "Could be". I grepped `tools/`, `test/`,
  `scenarios/` and the playtest skill: no playtest script, PLAYTEST file, golden fixture or test outside the
  grammar test types a short form.
- **B1 Terminal for the life of the view.** `_hadOps` belongs to one scene instance
  (`network-view-minigame.js:217`, `:656-660`), and a scene serves one foothold. A view that never had an ops block
  never sets it. A scenario change cannot leave stale output behind. The log lives only in the page's memory
  (`terminal-format.js:95-110`). It is keyed by foothold, with a trip-number check that drops an earlier trip's log
  (`network-view-minigame.js:668-675`), and it is dropped on every close except a hand-over (`:1176-1180`). Neither
  the log nor the field is stored. After a hand-over, the returning view is a new scene and works the field out
  again, as the brief says.
- **The rest of B3.** `cleanSpan` keeps `w` only when it is an integer from 1 to 80 (`terminal-format.js:123`). The
  renderer sets only `minWidth`, and only from an integer `w` (`network-view-terminal.js:241`), so nothing else from
  a span reaches a style. The scanner and framework builders give one span per cell, with no padding
  (`cli-gen/scanner-output.js:118-128`, `cli-gen/framework-console.js:87-91`).
- **B8 Panels default.** `session-args.sh` adds `net_skin=gui` only when there is no `--net-skin` and the URL has
  no `net_skin=` value. `default` adds nothing, and the tag is taken first. The page never stores a value from the
  URL (`skin-choice.js`, `rememberPress`), so a Panels run does not change a stored pick.
- **B6 tidy.** The resolver address became `203.0.113.9`. The rule still treats that address as not private
  (`realism_text_rules.rb:22-26`), so the R1-S8 finding keeps its meaning. The other replacements keep the meaning of
  their sentences, apart from R1-B5.
- **B9 docs** match the code, apart from the copied-text sentence (R1-B1).
- **Tests run.** node over the 13 track B client test files (switch, grammar, format, renderer, scanner, framework,
  hostile, skin-text, session-start, unopenable-containers, defaults, provenance, parity): 313 pass, 0 fail.
  Rails, under the shared lock: `validate_realism_catalog_test`, `realism_telltale_words_test`,
  `realism_separation_test`, `validate_realism_skin_test` and `test/lib/realism_catalog_test`: 146 runs, 0 failures.
  `bin/ops-golden-compare` at HEAD: 27 runs, 0 failures, exit 0.
- **No exploit content, and no real identifier** added outside the catalog JSON. UK English.

## For the owner

Nothing new. The three other docs that match the nickname list stay on the planner's owner list.

## Verdict

Not clean: one major (R1-B1).
