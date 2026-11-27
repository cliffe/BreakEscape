# Code review R2 (delta): chatter pool `requireGlobal` gate

Branch feat/chatter-pool-gate, fix commit 3f19b91f5 on top of the R1 state. Read-only review: nothing in the tree was changed or committed.

## Runs

- `bin/test-js test/js/npc-*.test.mjs test/js/needs-*.test.mjs test/js/validator-*.test.mjs`: 178 files passed, 0 failed.
- Validator sweep over all 192 `scenarios/*/scenario.json*` files, run twice: once on the branch and once on a baseline that is the branch with main's `scripts/validate_office_life.rb` and `scripts/scenario-schema.json` swapped in (so only this feature's validator changes differ). 8 in parallel, warnings and errors diffed per file.
  - 191 of 192 files: identical warning and error lists. Total warnings on the branch: 865, the same as the baseline.
  - The one difference is `test_chatter_pool_gate`: the baseline has 1 schema error (main's schema rejects `requireGlobal` on a pool) and the branch has none. Expected.
  - `test_author_notes` exits 1 on both (an existing error, unrelated).
  - No file outside the unit fixtures produces a V12 line. No V12 false positives. The sweep is close to vacuous, though: apart from `test_chatter_pool_gate` (string form, declared boolean), no scenario has a gated pool, so the new type and security-pool checks ran only against the unit fixtures (see n3).
- Mutation checks in a scratch copy of `public/` and `test/js/` (the worktree was not touched):
  - Putting the R1 M1 bug back (`!this._thoughtsOn(), c => ...`) fails exactly one test, the new M1 test. That test does its job.
  - Replacing `this._holds` with `null` at each of the 9 call sites, one at a time: lines 2323, 2422, 2956, 3053 and 4803 are caught (1, 2, 5, 1 and 1 failures). Lines 1019, 2161, 2173 and 2221 are not caught (0 failures). See m1.

## Severity table

| Sev | Count | Items |
|---|---|---|
| B (blocker) | 0 | |
| M (major) | 0 | |
| m (minor) | 1 | m1 |
| n (nit) | 4 | n1, n2, n3, n4 |

## `this._holds` bound once in the constructor

`public/break_escape/js/systems/npc-needs.js:424`: `this._holds = cond => this._globalHolds(cond);`

- **`this`.** An arrow function captures the constructor's `this`, which is the instance. It is passed as a bare function into the pure `chatterPool` and called there as `holds(pool.requireGlobal)` with no receiver, so a `function` expression or an unbound method reference would have broken. The arrow is correct.
- **World swaps.** The arrow does not capture the world. It calls `this._globalHolds`, which reads `this.world.globalHolds` on every call (4401), so a world replaced after construction, or a `globalHolds` attached after construction, is picked up. The same holds for a `_globalHolds` patched on the instance or the prototype after construction, because the method is looked up on each call too.
- **Do tests swap worlds?** No. Nothing in `test/js` or `public/` assigns `sys.world` after construction (the `r.world =` in `workstation-state.test.mjs:157` is a result holder). `office()` in the gate test sets `w.world.globalHolds` before `new NPCNeedsSystem`, but given the above, setting it afterwards would also work. The engine builds one system per world (`npc-needs.js:6176`).
- **Order.** It is the second statement in the constructor, before anything that can draw a pool.
- **Serialisation.** Nothing serialises the instance whole (no `Object.keys(this)`, `JSON.stringify(this)` or `structuredClone(this)` in the file), so the new function-valued property leaks nowhere.

Verdict: correct.

## Findings

### m1. Four of the nine gated call sites have no test that notices the gate going missing

`public/break_escape/js/systems/npc-needs.js:1019` (announce radius), `:2161` (faint radius), `:2173` (`_unheard` radius), `:2221` (`mutter`'s "has lines").

Failure scenario: a later refactor drops `this._holds` from one of these lines (the slip R1 n1 aimed to prevent, now one argument shorter). All tests still pass.
- At 2221 a mutter with a closed pool would think it has lines. When the speech lock is busy it would queue and wait up to `MUTTER_WAIT_MS` (20 s) before showing its picture, instead of showing it straight away.
- At the radius sites a closed pool's `overhearRadius` would still widen earshot.

The new mutter test (`test/js/npc-chatter-pool-gate.test.mjs`, 'mutter: a closed pool has no line') runs with the lock free and steps 8 s, so the wait-or-not difference cannot show. R1 m3 listed "mutter with a closed pool" and the radius drop; `_chatRadius` got a test, the other three radius readers did not.

Fix:
- Mutter: make the lock busy first (an open pool line from Bob, or `_speechFreeFor` stubbed false), call `mutter('ann', <closed pool>)`, then assert `sys.mutterWaits()` is empty and a `npc_mutter:ann` picture was emitted at once. Run the same with the gate open and assert one waiting entry.
- Radius: one test with a gated pool carrying `overhearRadius: 500`, a `playerHears` stub that records its `radius` argument, and `_unheard(ann, 'cooler')` called closed (expect 160) and open (expect 500). That covers 2173 directly. 1019 and 2161 use the same expression, so a shared `_poolRadius(s, topic)` helper would let one test cover all three.

### n1. The thoughts-off timing test compares start times only

`test/js/npc-chatter-pool-gate.test.mjs`, 'npcThoughts off, gate closed'. `useTimes` collects the `t` of `using` log events. R1 m3 asked for the use length (`useUntil` minus the start) to match the ungated run. Equal start times over 30 s show the trips match. They do not show that a use ends at the same time, unless a second `using` follows within the window. Fix: compare the whole per-NPC log with chat-only events filtered out (start, `using`, the end or leave events), or record `job.useUntil - clockMs` when `phase` becomes `using`.

### n2. The grumble "both closed" assertion accepts either answer

Same file, 'grumble fallback'. It asserts `_grumbleTopic(ann, 'blocked')` is one of `grumble_blocked` or `grumble`. `PICTURE_CHATTER` has no `grumble_blocked` entry (npc-needs.js:127 to 133), so the answer is always `grumble`, and the assertion would pass whatever the code did. Fix: use a reason that has a picture, for example `off`, and assert `grumble_off` with both pools closed. Then also assert `grumble` for a reason without one.

### n3. The security-pool list in the docs is shorter than the one V12 checks

`scripts/validate_office_life.rb:778` checks `login_aloud`, `usb_refused`, `work_fail`, `work_fail_*`, `station_fail`, `social_blocked` and `wk_*`. `docs/achitechture/NPC_NEEDS_SYSTEM.md` (5.6a) and `.claude/skills/mission-office-life/SKILL.md:168` list only `login_aloud`, `usb_refused`, `work_fail*` and `wk_*`. An author reading the skill would not expect a warning on `station_fail` or `social_blocked`. Fix: add those two to both lists, or say "the failure pools (`work_fail*`, `station_fail`, `social_blocked`)". The list itself matches the engine: `_failTopic` (2429 to 2446) draws from exactly these failure pools, `START_POOLS` in npc-workarounds.js:64 are all `wk_*`, and `ALOUD_POOL` is `login_aloud`.

Side note on the sweep: since no shipped mission has a gated pool, "no false positives" here means "no V12 output on unchanged missions". For the m08 consumer, run the validator on m08 after its gates go in and check that the `{ "ops_watch_upset": false }` form with a `false` default gives no V12 line. It should not, because `json_type` gives `boolean` for both.

### n4. A mutter queued while its gate was open keeps `lines: true` after the gate closes

`npc-needs.js:2227` stores `lines` on the wait entry, and `_tickMutterWaits` (2262) uses it. If the gate closes while the mutter waits, it keeps waiting for the lock and then shows its picture, rather than showing the picture at once. This is harmless (the wait is bounded and the result is right) and rare. If you want it exact, re-read `this._hasLines(s, w.topic)` in the tick instead of `w.lines`. One doc clause would also do.

## Regressions

- `npc-needs.js` against main, excluding the 9 call-site edits: the only changes are the `normalisePool` field, the `chatterPool` `holds` parameter and filter, the constructor binding and the `_globalHolds` JSDoc. `_sayMutter`'s condition matches main again.
- `check_gate_types` skips a global that is undeclared (the "not declared" warning covers it), declared `null`, or declared as an array or object, and a gate value that is an array, object or `null`. It never double-warns with the undeclared check. Integer and Float both count as `number`, which matches JS `===` (`2 === 2.0`). Imported globals (`prepare_carry_over_globals`, validate_scenario.rb:5691) get `false` for `completed` imports or the import's `default`, which is the right type to compare against.
- The security-pool warning fires for scenario-level and NPC-level pools alike, and only when `requireGlobal` is present. No warning appears without a gate (the sweep confirms this).
- Schema description now names `requireGlobal`. The schema itself is unchanged by the fix.
- All 178 test files pass.

## Outcome check for each R1 finding

| R1 | Claimed | Verified | Notes |
|---|---|---|---|
| M1 | Fixed | Yes | Condition is `!this._thoughtsOn()` again, identical to main. No other stray comma expression is left (the diff outside the call sites is as listed above). The new test fails when the bug is put back (mutation run). |
| m1 | Fixed | Yes | Skill line now says campaign missions stand silent, gives `{ "ops_watch_upset": false }` with the global declared `false`, explains the inverse and the undeclared trap, and says other pools need their own gates. The doc has a worked example. The pool list is shorter than V12's (n3). |
| m2 | Fixed (V12 route) | Yes | V12 warns for the security pools, with a test covering four of them. Leaving `pool_has_line?` unchanged is a reasonable call: one warning site, no double warnings. |
| m3 | Fixed | Mostly | Mixed same-key, thoughts-off timing, grumble fallback, mutter, phone and `_chatRadius` tests added and passing. Gaps: mutter waiting and three radius readers are not caught (m1), timing compares starts only (n1), the both-closed grumble assertion is vacuous (n2). |
| m4 | Fixed | Yes | `check_gate_types` warns on a JSON type mismatch. The test covers number against string and boolean against string, and a matching boolean gives no warning. |
| n1 | Fixed | Yes | `this._holds` is used at all 9 sites. Correct with respect to `this` and later world swaps (section above). |
| n2 | Fixed | Yes | The shadowing arrow at `_chatRadius` is gone. |
| n3 | Fixed | Yes | Doc bullet: a desk call draws its lines when it starts. |
| n4 | Fixed | Yes | Doc bullet: a gate flip restarts the bag. |
| n5 | Fixed | Yes | JSDoc on `_globalHolds` plus a doc bullet. Behaviour unchanged, as agreed. |
| n6 | Fixed | Yes | LIVE_PROOF.md points at `tools/playtest/chatter-pool-gate-proof.mjs`. The schema `chatter` description lists `requireGlobal`. |
| n7 | Deferred to m08 | Accepted | Doc and skill now say a pool gate silences only its own pool. Declaring `ops_watch_upset` and gating m08's exchanges and other pools belongs to the m08 branch. |

No live proof re-run was needed: the fix changed no gate logic (it restored main's mutter condition and swapped an inline closure for a bound one), and the unit tests exercise the bound closure on every caught path.
