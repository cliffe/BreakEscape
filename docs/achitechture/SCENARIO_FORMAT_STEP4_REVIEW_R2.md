# Scenario format hardening, Step 4 review R2

Reviewer pass over `build/hard-step4`, tip `b0fe943b2`. Review only; no code changed. Two parts: a
closure check of review R1 (0/2/4) across `109f24e79..b0fe943b2` (the follow-up commits that built
the deferred items), then a fresh correctness pass. Spec: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md`
step 4 (line 353). Prior round: `SCENARIO_FORMAT_STEP4_REVIEW_R1.md`.

Evidence gathered in this worktree and in a throwaway detached worktree at the main baseline
`cb259dbdf`, validator run `--no-graph --skip-ink --no-known-failures`.

## Counts

- Blocker: 0
- Major: 0
- Minor: 3

## Verdict

SHIP. Every R1 finding is closed and independently verified. The room-type enum is gone, replaced by
a registry check against the engine's own `tilemapTiledJSON` keys; the broader `x-ref` coverage is in
with each deferred kind carrying a reason that holds against the code; the six-slips fixture runs the
whole validator and asserts all six; the double report is removed; the shared walker now routes
through `AuthorNotes.each_live`. Correctness is sound: an independent head-vs-base diff over 36
scenarios shows exactly the five documented new lines and no new error, all four nominated false
negatives are caught, and the `give_item` index fix resolves a granted item while a genuinely missing
item still warns. All step-4 test files pass (20 node tests, 7 `schema_walk` runs).

Three new Minors, all latent or house-style: the room-type check skips silently (not loudly) when it
cannot read `game.js`, so it does not meet R1's "fail closed or loudly" bar for the degenerate parse;
a new em dash sits in printed validator output on an added line; and the broadened `x-ref` schema
edits now textually conflict with `build/hard-6a1` (where R1 had the schema auto-merging), which a
merger must resolve by keeping both marks. None blocks the ship.

## R1 closure

**M1 (room-type enum) - closed.** `scripts/scenario-schema.json` replaces the room `type` enum with
`{ "type": "string" }`; `load_valid_room_types` (`validate_scenario.rb:135-143`) reads the
`tilemapTiledJSON('<type>', ...)` keys from `public/break_escape/js/core/game.js` and `check_room_types`
(`:8126-8150`) errors on any room whose type no map registers, wired in beside `check_references`
(`:8374`). `room_test_desk_seating` is a registered map (verified: it stays valid). The regex reads
144 single/double-quoted keys from `game.js`; there are no backtick or dynamic-key calls, so the parse
is robust for the current engine, and all 136 distinct corpus room types resolve (0 corpus lines).
Robustness gap, see **Minor-1**.

Three stale enum-only office types (`room_office3_meeting`, `room_office4_meeting`, `room_office5_it`)
are now rejected. Confirmed read-only that nothing uses them: no scenario, no template, and no
Hacktivity fixture (grep of `/home/cliffe/Files/Projects/Code/Hacktivity` over rb/json/erb/yml returns
nothing). The only mention anywhere is a planning note,
`scenarios/m05_insider_trading/ALIGNMENT_PLAN.md:135`, which suggests retyping `conference_room` to
`room_office4_meeting`; if that plan is ever followed the retype would now error. An observation for
the m05 owner, not a defect in this build.

**M2 (broader x-ref) - closed, deferrals acceptable.** The follow-up adds `x-ref` to the fields that
had none and no existing check: `npc` (door gate `openFor`, object/item `owner`), `object`
(`near.object`, `triggerOnInteract.objectId`, flagReward `objectId`), `item` (`triggerOnInteract.itemId`),
`room` (`near.door`, `near.room`, `triggerOnInteract.roomId`/`room_id`, flagReward `target_room`),
`policy` (object `policy`, `defaultPolicy`), `task` (flagReward `taskId`). The four kinds left without
an `x-ref` field each have a reason that holds against the code:

- `resource`: `resources.<id>.object` and `workNeeds` entries already ERROR in `validate_access_work.rb`
  (`:425`, `:462`), so an `x-ref` would double-report. Verified.
- `global`: every global reference is already owned by a dedicated error (setVariable, eventPattern,
  concludeRequires, globalVarOnKO), and globals have valid undeclared sources (ink `setVariable`), so an
  `x-ref: global` would both double-report and false-positive. Kept in the index for the task/global
  ambiguity note. Acceptable.
- `lock`: `requires` is overloaded between a literal value (PIN/password) and a key lock's name, and no
  field references a declared lock by name, so the plan's "(a key lock's name)" rule has no reference
  field to annotate. Acceptable.
- `role`: the only `role` fields hold a free-string job role and the `roles` map is optional defaults,
  not a closed set, so an `x-ref: role` would warn on every NPC with a role and no `roles` entry.
  Acceptable.

The plan's item 1 lists all four by name, but item 4 ("existing one-off checks that already error keep
their level") and the no-double-report principle that R1's Minor-1 enforces override the literal list.
Correct call: comprehensiveness without a false positive or a double report.

**m3 (six-slips fixture) - closed.** `test/js/validator-m01-six-slips.test.mjs` renders the real m01
through the validator's own ERB path, injects the plan's six slips into the JSON and runs the whole
validator, asserting all six at once: `lockedd` (unknown room field), `requries` (unknown field),
`onRead.setGlobal` (unknown field), `completeTask` to a missing task (step-4 reference), `unlock_door`
roomId to a missing room (step-4 reference) and a task `targetRoom` to a missing room (existing error).
Passes.

**Minor-1 (double report on concludeRequires) - closed.** `x-ref` dropped from
`concludeRequires.tasksCompleted.items` and `concludeRequires.globals.items` (schema diff); the
existing concludeRequires errors own both. The `aimCompleted`/`aimsCompleted` and eventMapping action
fields keep `x-ref` (no existing check). Verified by the references test
("owned by the existing error, not double-reported").

**Minor-2 (dashes) - closed for the build log; a new one appears in code.** The step-4 follow-up adds
zero em or en dashes to the build-log prose this round. But it introduces one in code, see **Minor-2**
below.

**Observation (SchemaWalk via AuthorNotes.each_live) - confirmed.** `SchemaWalk.walk` now delegates
to `AuthorNotes.each_live(data, node, keys: path, &block)` (`lib/break_escape/schema_walk.rb:27-29`),
so a `_` author note is skipped by the step-2b schema rule, not by a name list, and free data is walked
in full. `test/unit/schema_walk_test.rb` adds a case proving a `completeTask` parked in a `_draft` note
is not walked while a sibling live reference is (7 runs, 0 failures).

## Fresh pass

**False positives (corpus): none.** Independent head-vs-base diff of validator output over 36
scenarios (m01-m10, sis01-03, all 12 labs, test_access_social/work/networks, test_gate_tailgate,
test_desk_seating, test_author_notes, test_capture_log, two ca scenarios, npc-hub-demo-ghost-protocol),
`--no-graph --skip-ink --no-known-failures`, line-number prefixes normalised. Genuine new lines:
exactly five, all documented, zero removed:
- `npc-hub-demo-ghost-protocol`: 3 WARNING NPC-id reuses (`netherton`, `dr_chen`, `haxolottle`).
- `lab_social_engineering`: 1 SUGGESTION (`profile_done` is a task id and a global).
- `m03_ghost_in_the_machine`: 1 SUGGESTION (`victoria_choice_made` is a task id and a global).

New ERROR count across the set: 0 (total ERROR lines unchanged, 1 in both trees). Every new `x-ref`
resolves across the corpus.

**False negatives: all four caught.** Direct `check_references` injections with correct schema nesting:
- a broken object `policy` (missing top-level policy): WARNING `references policy 'ghost_policy'`.
- a door gate `openFor` under `rooms.<r>.doors[].gate` (missing NPC): WARNING `references npc`.
- a `near.object` under `npcs[].los.challengeOnSight.near` (missing object): WARNING `references object`.
- a `wear` `itemId` naming a truly missing item: WARNING `references item 'ghost_item'`.

**give_item index fix: verified both directions.** A `wear` naming an id defined only inside a
`give_item` action resolves with no warning (`each_given_item_id` folds those ids into the object/item
index, `validate_scenario.rb:8013-8032` and `:8059-8063`), while a `wear` naming a missing id still
warns. This clears the one transient false positive the broader coverage first surfaced
(lab_physical_pentest's granted hi-vis vest).

**Merge trial (no branch changed).** `git merge-tree --write-tree` from `b0fe943b2`:
- against `build/hard-step5`: conflict only in the append-only build log; `scripts/validate_scenario.rb`
  auto-merges. Clean outside the build log.
- against `build/hard-6a1`: conflict in the build log AND in `scripts/scenario-schema.json`. See
  **Minor-3**.

**Standing rules.** UK English: fine. No model names on any added line. No new package: the only new
require is `require_relative 'author_notes'` (a local file) and the test imports are node builtins. Em
dash on an added code line: see **Minor-2**.

## Findings

**Minor-1 (Minor) - `check_room_types` skips silently, not loudly, when `game.js` cannot be parsed.**
`load_valid_room_types` (`scripts/validate_scenario.rb:137-142`) returns `nil` both when `game.js` is
missing and when the regex matches nothing (`return nil if types.empty?`), and `check_room_types`
(`:8131-8132`) returns `[]` on `nil` with no message. The parallel item-type path prints a loud notice
either way ("Loaded N valid item types" or the "assets/objects/ directory not found, item type
validation skipped" header, `:8214-8217`); the room-type path prints nothing. R1 asked that this "fail
closed or loudly"; today it fails open and silent. No live impact (the current `game.js` yields 144
keys and all 136 corpus types resolve), and a partial parse fails loud (false-positive errors on valid
rooms), so the silent window is exactly zero matches. Failure scenario: a future `game.js` that loads
room maps from a manifest or a loop instead of literal `tilemapTiledJSON('<key>', ...)` calls makes the
regex return nothing, `load_valid_room_types` returns `nil`, and room-type validation silently turns
off with no line in the report, so a misspelt room `type` ships unflagged. Fix: print a skip notice
like the item path, and treat present-but-unparseable as a loud warning rather than a silent `nil`.

**Minor-2 (Minor) - em dash in printed validator output on an added line.**
`scripts/validate_scenario.rb:8145`, the `check_room_types` ERROR string, contains a U+2014 em dash
("...in game.js) em check the spelling or add the room map." with an em dash where "em" is written
here). The standing rule is no em or en dashes on added lines, and this one is in user-facing output.
Failure scenario: none functional; it violates the house rule and reads inconsistently with the rest of
the validator's messages. Fix: replace the em dash with ", " or " - ".

**Minor-3 (Minor) - the broadened `x-ref` schema now conflicts with `build/hard-6a1`.**
`git merge-tree` from `b0fe943b2` against `build/hard-6a1` reports a content conflict in
`scripts/scenario-schema.json` (R1 had the schema auto-merging). The M2 follow-up adds `x-ref` to the
same property definitions that 6a-1 marks `x-serverOnly`: `network` (room and object), `defaultPolicy`,
object `policy`, `owner`. Both branches edit the same JSON lines, so the merge is not automatic. The
plan (line 698) anticipates this ("whichever lands second adds them"), so it is expected coordination,
not a code defect, but it is a conflict outside the build log and carries a real risk: a careless
resolution that takes one side wholesale would drop either the `x-ref` (losing a reference check) or
the `x-serverOnly` (leaking a server-only field to the browser). Fix at merge time: keep both marks on
every shared field, and re-run the validator over the corpus at the merge batch.

## Observations (not counted)

- `each_given_item_id` folds any Hash with an `'item'` child object that has a non-empty `'id'` into the
  object/item index. That is the `give_item` shape, but the match is structural, so an unrelated future
  field named `item` holding an id-bearing object would pollute the index and could mask a genuinely
  undefined reference to that same id. Adding ids to the index only ever suppresses a warning, never
  creates one, and no such field exists today, so this is latent. Worth a `type == 'give_item'` guard if
  the match is ever widened.
- m05's `ALIGNMENT_PLAN.md:135` names `room_office4_meeting` as a retype target; that type is now
  rejected, so the plan would need a registered type instead. For the m05 owner.

## Test re-runs (this review)

- `test/js/validator-references.test.mjs`, `validator-room-types.test.mjs`, `validator-m01-six-slips.test.mjs`:
  20 tests, 20 pass, 0 fail.
- `test/unit/schema_walk_test.rb`: 7 runs, 12 assertions, 0 failures.
- Corpus head-vs-base over 36 scenarios: 5 new lines, all documented, 0 new errors.
- `check_references` injections: policy, openFor, near.object and a missing wear item each warn; a
  `give_item` id resolves.
