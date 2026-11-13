# Scenario format hardening step 8a, code review R1

Counts: blockers 0, majors 1, minors 1, nits 4

Branch `build/harden-8a`, tip `f379a2c08`, based on main `8b6cf6a0d`. Scope:
`git diff 8b6cf6a0d..build/harden-8a`, read against the plan step 7, step 8 and step 8a and the
step 8a build-log sections. Read-only review; this file is the only change.

## What was checked and found sound

- **Schema.** `offWhen` (requireGlobal `oneOf` string|object, `x-id-map`, min length / min
  properties 1) is declared on `networks.*`, `resources.*` and at object level, and removed from
  `#/definitions/affordance`; `downIf` is gone from both closed blocks, all in the one commit
  (`33b3ea3bc`). `check_unknown_fields`' `known_item_fields` gains `offWhen`
  (validate_scenario.rb:805).
- **FormatUpgrade STEP_8A** (format_upgrade.rb:44-78, 191-256). The `scenario` and `player_state`
  transforms walk only live data through `AuthorNotes.each_live(..., free: :skip)`, so a note that
  names an old key is left as written (unit test asserts `_draft.resources.z.downIf` survives) and
  free data is not descended. Idempotent: each move is guarded by `unless value.key?('offWhen')`,
  so a second run and format-1 data are no-ops. The emptied-affordance rule is kept (`{}` stays,
  truthy). `retired` lists the three paths. It runs under the row lock via
  `Game#ensure_current_format!` and re-prepares only when `scenario_changed` (verified unchanged
  from step 7; the live proof 3a confirms the row-lock upgrade). A `downIf` and an
  `affordance.offWhen` never co-occur on one Hash in the corpus, so the shared
  `rename_one_hash_outage_fields!` dropping a second value under the `offWhen`-present guard is not
  reachable.
- **Readers read only `offWhen`.** Ruby: network_access.rb (`host_service_off?`, `network_up?`,
  `resource_down?`, `reach_cache_key` now keyed on `network_up?`), access_work.rb (`off_when_present?`,
  `object_off_when`, `cause_holds?`, `can_fail?`, `plan`, `off_when?`), network_model.rb
  (`reach_conditions` keeps the condition whole). JS: npc-work.js, npc-needs.js, npc-reports.js,
  unlock-system.js, container-minigame.js. Repo grep for `downIf` and `affordance.offWhen` in
  app/lib/public/scripts/tools leaves only comments, the retired list and schema/description text;
  social_feed.rb and the leak scanner never read the field; verify-run.rb and docs/test-bridge.md
  are clean (test-bridge updated to `offWhen?`).
- **Route ruling.** `reach_conditions` keeps a bare name a String and the `{ name: value }` form a
  Hash on the route; `cause_holds?` (unreachable), npc-work.js `reachable`/`wakeOnFor`/`planGlobals`,
  the access-work validator's two route collectors and the dungeon graph all evaluate or name the
  condition with the shared helper, so a network down by either form is down on a link route. The
  per-NPC work-plan entry carries `offWhen` values (game.rb:5567 comment, `AccessWork.plan`
  access_work.rb:1019), read client-side; the plan is server-built, not stored in player_state, and
  consumers tolerate the condition-object shape (npc-work.test.mjs and network_model_test.rb cover
  the hash and mixed route).
- **Formatter dedup** (validate_scenario.rb:290-332). A reintroduced retired key in a closed block
  no longer prints both the schema unknown-key line and the rename line; a genuine unknown key on
  the same block still prints. Covered by validator-retired-keys.test.mjs.
- **Migrated step-7 tests.** reload_persistence_test.rb:840-851 now expects two
  `break_escape_games` SELECTs (the FOR UPDATE load plus the one `formatVersion` jsonb-scalar pluck
  the sync check runs once current is non-zero) and still asserts the full
  `"break_escape_games"."scenario_data"` column is never loaded. capture_proofs_test.rb:74 narrows
  its counter to the quoted `"scenario_data"` so it ignores the arrow-operator pluck but still
  catches a full-column blob load. The eleven format_version / loader tests stub an empty step list
  for the inert current-0 paths and read `FU.current` for the header and refusal assertions, which
  are the stamping consequences, not tests bent to pass.
- **Sync size.** player_state changes only by the in-place key rename inside item copies, once per
  game, on the server; sync reads no renamed key and neither upgrades nor refuses a below-current
  game. No new state, nothing re-sent.
- **Deployed games.** The four (m01, sis01, sis02, lab_social_engineering) use no retired key, so
  the transform leaves them unchanged (`ALIASES` empty); the step-7 alias test still fails if one
  starts using a retired key.
- **Tests run** under the shared lock, RBENV_VERSION=2.7.8: format_upgrade_test.rb,
  format_8a_corpus_test.rb and format_version_test.rb together: 51 runs, 415 assertions, 0 failures,
  0 errors. format-8a-reader-parity.test.mjs: 5 pass, 0 fail.

## Findings

### maj1 (Major). The corpus and parity tests derive the "old" side from the live merge base, so they go vacuous or fail once 8a is on main, and error where git or `main` is absent

`test/unit/format_8a_corpus_test.rb:33` (`git merge-base main HEAD`, then `git show <base>:...` at
:54 and :86) and `test/js/format-8a-reader-parity.test.mjs:32` (`git('merge-base', 'main', 'HEAD')`,
`git show` at :49 and :56) compute the base as the merge base of `main` and `HEAD`.

What breaks:
- **After 8a merges to main** the merge base advances to the 8a commit itself, so `old_render`
  reads the new template (`offWhen` at object level, `affordance` emptied) and `access_work_old` /
  the old `pcSwitchedOff` are the new code. The equivalence assertions then pass vacuously
  (`transformed(new) == new`), but the reader-parity assertions actively **fail**: the old side
  reads `affordance(...).dig('offWhen')` (Ruby, :163) and `oldObj.affordance.offWhen` (JS, :93),
  both `nil`/`undefined` on the new render, while the new side reads the moved object-level value,
  so `assert new_cond == old_cond` / `assert.deepEqual(newCond, oldCond)` mismatch for every object
  that carries an outage. The suite breaks on main the moment main includes this commit.
- **Where git history or the `main` ref is absent** (an installed gem, a shallow or `main`-less CI
  checkout such as Hacktivity's) `git merge-base` exits non-zero: the Ruby raises
  `could not find the merge base` (:34) and the JS throws from `git()` (:28). Neither test has the
  skip guard that validator-retired-keys.test.mjs carries.

Fix (preferred, self-contained): vendor the four old renders as small JSON fixtures under
`test/fixtures/format_8a/<scenario>.old.json` and capture the old reader behaviour inline, then read
those instead of `git show`. The old Ruby reader is just `affordance(data, obj).dig('offWhen')`,
network/resource `downIf` and `globals_hold?`; the old JS reader is `pcSwitchedOff` reading
`data.affordance.offWhen`. Inlining a dozen lines removes the dependency on git and on the merge
base entirely and keeps the equivalence meaningful after merge. Pinning the base to `8b6cf6a0d`
alone (an alternative) would restore the comparison after merge but still errors in a gitless
checkout, so prefer the fixtures; a skip-with-message is acceptable only as a last-resort fallback
when a fixture cannot be read.

### min1 (Minor). scenarios/test_access_networks/PLAYTEST.md documents the retired field names

`scenarios/test_access_networks/PLAYTEST.md:310` (`downIf: "servers_offline"`), `:325`
(`affordance.offWhen: "bench_pc_off"`) and `:339` (a resource's own `downIf`) still name the fields
this step renamed, for a scenario whose `.json.erb` now uses `offWhen`. The first handover's item 8
listed "a PLAYTEST.md" as a remaining stale comment; the continuation's stale-comment pass handled
network_access.rb and docs/test-bridge.md but not this file. Update the three lines to `offWhen`
(the object one as object-level `offWhen`, not `affordance.offWhen`).

### nit1. npc-work.js docstring names the wrong old field

`public/break_escape/js/systems/npc-work.js:29`: "a resource's outage condition is `offWhen` in the
requireGlobal form (was `offWhen`, a bare name)" should read "(was `downIf`, a bare name)".

### nit2. Stray re-indentation of unrelated if/else branches

`scripts/generate_dungeon_graph.rb:627-629`, `scripts/validate_access_work.rb` (around :1335-1337,
:2206-2209, :2213-2216) and `scripts/validate_npc_needs.rb:445-447` outdent the `else`/`elsif`/`end`
of several assignment-position conditionals to column 4 while the bodies stay at their old column.
Ruby ignores it, but it is diff noise inconsistent with the surrounding style (an editor or RuboCop
autocorrect on untouched lines). Restore the original alignment so the diff shows only the rename.

### nit3. The JS outage helpers lack the empty-Hash guard the Ruby side has

`AccessWork.off_when_present?` treats an empty Hash as "not present" (no condition), but the JS
`offWhenHolds` (npc-work.js and container-minigame.js), `pcSwitchedOff` (unlock-system.js:366) and
`_isOff` (npc-needs.js:687) fall through their `undefined/null/false/''` guard for `{}` and reach
`Object.entries({}).every(...)`, which returns `true` (the object reads as "off"). This is
unreachable in the corpus (schema `minProperties: 1`, and the server only ships an `offWhen` that
passes `off_when_present?`), and it predates this step, but the Ruby/JS contract now diverges on the
empty-Hash edge; a one-line length guard in the JS helpers would close it.

### nit4. Stale code comments naming `downIf`

`scripts/generate_dungeon_graph.rb:1069`, `public/break_escape/js/systems/npc-needs.js:666` ("are
resource downIfs has no offWhen object at all", also ungrammatical) and
`public/break_escape/js/systems/npc-reports.js:10` still describe current behaviour with the old
field name. Cosmetic; reword to `offWhen` when convenient.
