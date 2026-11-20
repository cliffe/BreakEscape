# Scenario format hardening, Step 4 review R1

Reviewer pass over `build/hard-step4`, range `cb259dbdf..0d7ba7e5b` (single commit
`0d7ba7e5b` "Step 4: reference and id checks driven by schema annotations"). Review only; no code
changed. Spec: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md` section 1 and step 4
(around line 353). Build log: `SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`, step 4 section (line 3075).

Evidence was gathered in a detached worktree at `cb259dbdf` (base) compared against the step-4 tree
(head), validator run `--no-graph --skip-ink --no-known-failures`.

## Counts

- Blocker: 0
- Major: 2
- Minor: 4

## Verdict

SHIP the implemented work: correctness is sound. Every x-ref resolves across the corpus, broken
references and id reuse are caught, author notes and free data are handled per step 2b, the schema
retype rejects no corpus value, the shared walker is plain Ruby and tested, the grant_foothold
ruling holds, and the standing rules are met in code. All cited tests pass.

Step 4 is **not complete against the plan**, however. Two plan-required deliverables are deferred
(the room-type enum replacement, and x-ref on seven of the twelve kinds). They cause no regression
and are documented in the build log's "Deferred" section, but the plan lists them inside step 4, and
some of the deferred x-ref kinds have no existing coverage at all. Before step 4 is marked done the
orchestrator should either schedule these as step-4 follow-ups (both are low-risk and partly a matter
of sequencing after 6a-1's schema rewrite lands) or record an explicit sign-off for the deferral.
The one latent correctness nit (a double report on broken `concludeRequires` references) is a Minor
and a one-line schema fix.

## Findings

### Scope against the plan

**M1 (Major) - plan item 6 (room `type` enum vs the room map files) deferred.**
`SCENARIO_FORMAT_HARDENING_PLAN.md` step 4 lists item 6 ("Replace the hard-coded room `type` enum
with a check against the room map files ... fixes test_desk_seating for good") as a step-4 Change.
It was not built (`BUILD_LOG.md:3075` Deferred section). The plan requires it in step 4, so the step
is incomplete without it. Mitigation: nothing regresses (`room_test_desk_seating` is in the enum, so
test_desk_seating passes today), and the builder's rationale, that removing the large enum risks
conflicting with the concurrent step 5 and 6a-1 schema edits, is sound sequencing. Failure scenario:
a new room map added after this ships is not accepted as a `type` until someone edits the enum by
hand, the exact brittleness item 6 was meant to end. Ruling: acceptable to land the current build and
build item 6 as a tracked fast-follow once 6a-1's schema lands, but step 4 is not done per the plan
until it exists or the deferral is signed off.

**M2 (Major) - plan item 1 x-ref coverage only partial (5 of 12 kinds).**
Plan item 1 requires `x-ref` on "every property that names something: room, npc, object, item, task,
aim, global, lock, network, resource, policy, role". The build annotates task, aim, room, global and
network only (`scenario-schema.json` diff; `validate_scenario.rb:8040-8051` index). Deferred: npc,
object, item, lock, resource, policy, role. The index already carries all twelve kinds
(`build_reference_index`, `validate_scenario.rb:8012-8052`), so adding the annotations is mechanical.
Several deferred kinds are covered by existing one-off checks (targetNPC/targetRoom/unlockDoor error,
targetObject warns), but **policy, role, lock and the nested npc/object/item reference fields have no
existing check**, so those reference classes still "arrive unchecked", which is the problem step 4
sets out to solve. Example: a PC's `policy` field (schema ~line 5380, deliberately left without
x-ref) that names a missing top-level policy is not flagged by anything. No regression (step 4 is
additive). Ruling: Major scope gap; the index is ready, so this is a low-risk fast-follow, but the
step's comprehensiveness objective is only half met.

**m3 (Minor) - m01 six-slips integration fixture deferred.**
Plan step-4 Tests name "a copy of m01 with six slips as one fixture, every finding expected". Not
built (`BUILD_LOG.md` Deferred). The step-4-specific slip (an eventMapping `completeTask` naming a
missing task) is already unit-covered in `test/js/validator-references.test.mjs`; the other five slips
(`lockedd`, `requries`, `unlock_door`, `targetRoom`) re-test pre-existing checks. So the gap is
cross-stage integration coverage only. Failure scenario: a future refactor that breaks the
interaction between the unknown-field, error and reference stages would not be caught by one fixture.
Minor.

**Stale-premise claim: verified true.** The plan's "5 scenarios with duplicate ids" premise is stale
on `cb259dbdf`. Validator run head vs base over m09, m10, lab_tesseract_trials and test_access_social:
all four identical, zero step-4 duplicate warnings. Only `npc-hub-demo-ghost-protocol` carries
duplicates, and they are three NPC ids (`netherton`, `dr_chen`, `haxolottle`, each staged in a
briefing room and the character's own room), not object ids. Matches the build log.

### Correctness of check_references and build_reference_index

**No false positives (corpus).** Validator head vs base over 24 scenarios (m01-m09, all 12 labs,
npc-hub-demo, test_access_social, test_access_networks) plus m10 head: the only new lines are the five
the build log reports, 3 NPC-id reuse warnings in npc-hub-demo and 2 `💡 SUGGESTION` task/global
ambiguity notes (lab_social_engineering `profile_done`, m03 `victoria_choice_made`). **Zero new
errors anywhere.** Every x-ref in the corpus resolves.

**No false negatives.** Direct checks (`check_references` over crafted data): a `completeTask` naming
a missing task warns, an `unlockAim` naming a missing aim warns, and a `skipTask` array element naming
a missing task warns with the correct `[1]` index (`validate_scenario.rb` check plus
`SchemaWalk.walk`). The node test covers missing task/aim/global/network and contents/itemsHeld
reuse: 9/9 pass.

**Author notes skipped; free data handled.** A `completeTask` parked inside a `_draft` note is not
flagged while a sibling live `completeTask` resolves. The walker does not prune `_` subtrees, but
their keys classify as undeclared and so pair with a nil node, and `ScenarioSchema.FREE` children also
pair with FREE, so `ref_kind` returns nil in both, which is the step-2b behaviour.

**x-engineGlobals correct.** `_frustration` over npc, `_screen_locked`/`_owner_away`/`_accessed`/
`_planted` over object (`scenario-schema.json:4-10`), matching the plan's patterns (the plan's
`<jackId>_planted` is an object id, so "over object" covers it). The validator reads the annotation
off `ScenarioSchema.root.table.root_schema['x-engineGlobals']` (`validate_scenario.rb:8034`) and
expands it over the scenario's ids; an engine-written global (`pc1_screen_locked`, `bob_frustration`,
`pc1_accessed`) is accepted (test + corpus).

**Minor-1 (Minor) - double report on broken `concludeRequires` references.**
`scenario-schema.json` adds `x-ref: task` on `concludeRequires.tasksCompleted.items` and `x-ref:
global` on `concludeRequires.globals.items`. Both fields already ERROR on an unresolved reference:
`validate_scenario.rb:3295` and `:3338` ("concludeRequires.tasksCompleted references unknown taskId")
and `:3346` ("concludeRequires.globals references '...', which is not declared"). So a broken
`concludeRequires.tasksCompleted` reference now prints a pre-existing `❌ ERROR` and a new
`⚠️ WARNING` for the same thing. This contradicts the build log's claim that x-ref was "Placed on the
fields the existing one-off checks do not already cover, so no reference is reported twice". Latent:
no corpus scenario has a broken `concludeRequires` reference, so no double report appears today, and
the exit code is unaffected (the error still fires). Failure scenario: an author mistypes a
`concludeRequires` task id and sees two lines for one mistake. Fix: drop `x-ref` from those two
`concludeRequires` item schemas (the existing errors own them), as the aimCompleted/aimsCompleted and
eventMapping fields correctly keep it (those have no existing existence check). Minor.

### Schema retype (eventMapping action fields)

The retype of `completeTask`, `unlockTask`, `unlockAim` from `{"x-free-data": true}` stubs (and the
newly declared `skipTask`) to `oneOf[string, array of strings]` with `x-ref` **rejects no corpus
value**: every corpus value of these fields is a string or an array of strings (ERB expressions
render to strings before the check), and the head-vs-base corpus is identical except the documented
new lines. `eventMapping` is an open object (no `additionalProperties: false`), so newly declaring
`skipTask` removes no prior unknown-field error. The step-2b resolver results are unchanged:
`test/unit/scenario_schema_test.rb` and `test/unit/author_notes_test.rb` re-run green
(35 runs including `schema_walk_test.rb`, 12765 assertions, 0 failures).

### lib/break_escape/schema_walk.rb

Plain Ruby, requires only `scenario_schema` (no Rails). `walk(data, node)` yields `[value, node,
path]` and descends with `ScenarioSchema.child`/`item`, so `$ref`, `oneOf` and `anyOf` are resolved
by the data's actual shape, not guessed. `ref_kind` reads `x-ref` off the node's branches;
`path_string` renders a readable path. Tested directly against the real process schema
(`test/unit/schema_walk_test.rb`, 6 runs green: completeTask string and array, object network,
FREE/nil nodes, path rendering). Fit for 6a/6b reuse: yes for pairing each value with its schema node
and reading an `x-` mark off it (the same shape a secret scan needs). One observation (not a defect):
`walk` does not skip `_` author notes, it relies on their nodes resolving to nil/FREE; a 6a/6b reuse
that must honour note-skipping on its own terms should either combine it with note awareness or use
`AuthorNotes.each_live`, which already walks data and schema together with note and free handling.
The two walkers now overlap; worth consolidating when 6a lands.

### grant_foothold ruling

Verified. `lib/break_escape/network_model.rb:256-270` `grant_foothold_actions` walks with
`AuthorNotes.each_live(data, ScenarioSchema.root)`, which skips `_` notes and visits free data in
full, so a `grant_foothold` parked in a note does not widen the server's allow list. Proven through
the real `POST /network/implant` by `test/controllers/break_escape/network_notes_not_live_test.rb`.
Step 4 adds no server change, so the 2026-11-12 ruling is already satisfied by step 2b in this tree.
The builder's claim is correct.

### Merge risk (step 5, 6a-1)

Trial `git merge-tree --write-tree` from `0d7ba7e5b` against `build/hard-step5` and against
`build/hard-6a1` (neither branch changed; scratch only). Both report a conflict **only** in
`docs/achitechture/SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`, an append-only log, trivial to resolve.
`scripts/validate_scenario.rb` (step 5 deletes the embedded ScenarioBinding at lines 58-111; step 4
adds a require at line 29 and `check_references` at line 7954) and `scripts/scenario-schema.json`
(6a-1 is +76/-15; step 4's x-ref edits) **auto-merge with no conflict**. Low merge risk. The only
caveat is semantic, not textual: 6a-1 also adds schema marks, so the merged schema should be
re-validated at the merge batch, but nothing here needs changing for a clean merge.

### Standing rules

- UK English: fine.
- No model names: none in the diff.
- No new packages: only `require_relative` of local files (`schema_walk`); no gem added.
- Em/en dashes: none in the code or the schema. The build-log prose adds a handful of em dashes in
  headings and bold labels (`Minor-2`), consistent with ~80 already in that file, but the standing
  rule says none. Minor, house-style.

**Minor-2 (Minor) - em dashes in the step-4 build-log prose** (`SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`
step-4 headings and labels). Matches the file's existing convention; no functional effect.

## Test re-runs (this review)

- `test/js/validator-references.test.mjs`: 9/9 pass.
- `test/unit/scenario_schema_test.rb`, `test/unit/author_notes_test.rb`, `test/unit/schema_walk_test.rb`:
  35 runs, 12765 assertions, 0 failures, 0 errors.
- Corpus validator head vs base: 24 scenarios compared in full plus m10 head; deltas match the build
  log exactly, 0 new errors.
