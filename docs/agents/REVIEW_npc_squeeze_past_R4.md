# NPC squeeze-past: code review round 4 (delta of 15f153d75)

Scope: the R3 fix commit only (README and scenario wording, the `reissuedAt` bound, the `_tickPlayerPass(pos, time)` signature, one new test).

Counts: B 0, M 0, m 1.

## Checks

- **Caller and time base.** `_tickPlayerPass` has one caller, `npc-behavior.js:1412` in `updatePatrol(time, delta)`, reached from `update(time, delta)` (line 1183). That is the same `time` that `_notePlayerBlock` receives, so `reissuedAt`, `since` and `lastSeen` share one clock. Nothing passes `Date.now`. The default argument (`this.scene?.time?.now ?? 0`) is only used by direct calls, and the only direct calls are in tests that pass a time explicitly. Safe.
- **`reissuedAt` reset.** `reissued = true` is set in one place (`goToAndStay`, line 3453) and `reissuedAt = null` is set in the same statement. Every `reissued = false` (lines 1938, 1945, 1974) leaves a stale `reissuedAt`, but that is harmless: the field is read only inside `if (p.reissued)`, and the next set of `reissued` nulls it first. `??=` treats `null` as unset, so the first tick after a re-issue stamps it. A new `_playerPass` object (line 1942) starts without the field. Correct.
- **Collider never off indefinitely.** The collider is off only while `isPassingPlayer()` (active pass and `_mayPassPlayer()`). A re-issued pass now loses its skip after one `AVOID_PLAYER_BLOCK_GAP_MS`, after which the empty-path branch (line 1985) ends the pass as soon as the player is clear. With the player still touching and no path, the pass holds, but the path retry (up to 2 s) and the player moving away both end it, and this is the pre-R3 behaviour, not a new gap. Every other exit (`_mayPassPlayer()` false, arrival, `_updatePlayerPass`, lines 3452, 3531, 3563, 3659) is unchanged.
- **Test.** `R3 m2` fails without the fix: with `reissued` never expiring, the third `_tickPlayerPass` leaves the pass active and `assert.equal(b._playerPass, null)` fails. The player is placed clear (200 px), so the distance rule cannot be what ends it. The boundary is tested on both sides (`GAP - 1` kept, `GAP + 1` ended). It does not exercise the `updatePatrol` call site, only the method; acceptable for a delta.
- **Docs.** README line 1845 now matches the code: the opt-out removes the 2.5 s pass only, the older gave-up nudge (`AVOID_GIVEUP_MS` 2.5 s plus a 0.45 s nudge and cooldown) and the must-reach squeeze at a target cell (code at line 1800) remain. The scenario `endGoal` no longer claims a permanent hold.

## Findings

### m1. Documented nudge delay differs between README and the scenario brief
- **Where:** `README_scenario_design.md:1845` ("about 6 to 14 s") against `scenarios/test_npc_squeeze_past/scenario.json.erb` line 2 brief ("about 6 to 9 s (sometimes longer)").
- **Failure scenario:** a designer reads one figure, a tester the other, and either reports a defect when Opal takes 12 s (inside README) or 16 s (outside both). R3 recorded 6 to 9 s in two runs and 14 s or more in one, so 14 s is not an upper bound; it depends on the geometry roll.
- **Fix:** say "roughly 6 s, sometimes much longer" in both places, or "about 6 s or more" in the README, and keep the brief's "sometimes longer".

## Test runs (this worktree, at 15f153d75)

- `node test/js/npc-local-avoidance.test.mjs`: 66 of 66 pass.
- `node test/js/npc-player-push.test.mjs`: 11 of 11 pass.
- `node test/js/fingerprint-generator.test.mjs`: 7 of 7 pass. The commit cannot affect it: the test imports only `minigames/dusting/fingerprint-generator.js`, a pure module with no link to NPC code, and 15f153d75 touches none of its files. The earlier failure is most likely the `generatePrint at 128 runs in under 150 ms` wall-clock check (`performance.now`, worst of several runs) tripping while the full suite ran in parallel. It is a load-sensitive timing test, unrelated to this change; if it recurs, widen the threshold or run it outside the parallel batch.
