# Exchange heard on the first line: code review, round 4

Branch `fix/exchange-heard-on-first-line`, HEAD `303f240ec`.
Delta reviewed: `git diff 487d40df5 303f240ec` (the R3 fixes, six files).

Counts: Blocker 0, Major 1 (carried from R2/R3, open), minor 1, nit 4.

## Tests run

- `bin/test-js -j 6` on every `test/js` file named `npc-*`, `needs-*`, `phone-call*` and `validator-*`: 201 files, 201 passed, 0 failed.
- `node --check tools/playtest/needs-sims-staff-room.mjs`: clean. Not run live (port 3094 is in use).
- Ruby validator on `test_needs_sims` and `office_life_showcase`: both exit 0 ("Validation complete", 0 errors). The `reads data.complete` warning fires on neither.
- Mutation in a scratch copy outside the repo: the emit in `_tickChats` made unconditional (`if (firstHeard) { this._markExchangeHeard(...)`). The new test fails ("knot already in _exPlayed before line 1", test 36); the other 36 tests pass. So the test does pin "emit only when the mark happens". Scratch copy deleted.

## R3 findings

| R3 | Status | Notes |
|---|---|---|
| Major 1, no live proof | Open | The run on port 3094 is still going. `LIVE_EXCHANGE_HEARD_RELOAD.md:3` still promises a "section at the end" that does not exist, and `:9` still says the event fired at the finish (marked as predating R1). Not a code defect. |
| minor 1, staff-room tool | Resolved | See "needs-sims-staff-room.mjs" below. |
| nit 1, guarded emit untested | Resolved | See "The new test". |
| nit 2, `_finishCall` ignores the return | Accepted | Agreed: a call is placed only for an unheard knot (`npc-needs.js:4843`), so the knot is never already marked at the finish. |
| nit 3, fix-log line 146 | Resolved | `EXCHANGE_HEARD_FIX_LOG.md:146` now ends "(superseded, see 5.6a)". |
| nit 4, validator substring | Resolved | See "Validator". |

No regression found in the delta.

## needs-sims-staff-room.mjs

Is the `exchange_heard` entry found reliably? Yes for the beats as run, with caveats below.

- Right knot: all three lookups filter on `l.knot` (`:210` `exchange_waiting`, `:360` `exchange_job_called`, `:384` `exchange_job_cleared`). `needsLog` (`:61`) now carries `t`; `__test.needs.log()` returns `getLog()` entries, which hold `t` (`test-bridge/index.js:2294`, `npc-needs.js:5164`).
- `t` is the needs tick count, not the clock: `_log` writes `t: this.tickCount` (`npc-needs.js:5164`). The derivation `t * 250` is still right: `tickCount++` (`:1187`) and `clockMs += NEEDS_TICK_MS` (`:1189`, `NEEDS_TICK_MS = 250` at `:24`) run in the same tick, and both reset to 0 together (`:429-431`, `:655-657`). Nothing else advances `clockMs`. `lockerStart.clockMs` is read from the same `clockMs`, so the subtraction is consistent.
- Cut path: a cut with at least one overheard line logs `exchange_cut` and then `exchange_heard { complete: false }` (`:3137-3140`), so the loops end at the cut, not at a timeout. A cut or full play with no overheard line logs `exchange_cut` or `exchange_unheard` and no `exchange_heard`; the event also never fires. Then `firstVisitHeard` runs to its 150 s cap and returns false (the caller calls `setupFailure`), and the cleared-exchange loop runs to its 70 s cap. That is the same behaviour as before the change (no event either), so no new hang, and both are bounded.
- Entry already in the log before the loop: the three lookups are cumulative, not scoped to the beat. See minor 1.

### minor 1: the log lookups are not scoped to the start of the wait

`tools/playtest/needs-sims-staff-room.mjs:210`, `:360`, `:384`.

`needsLog()` returns the whole decision log. `firstVisitHeard` and the cleared-exchange loop accept any earlier `exchange_heard` for the knot. The old code did the same with the cumulative `__s4` events, so this is not a regression, and each knot plays once per game, so it is harmless on a fresh game. On a reused game it would return true immediately for `exchange_waiting`, or break the cleared loop at once (with `cleared_exchange.lines` empty). The log is also a 2000-entry ring (`LOG_CAP`, `npc-needs.js:26`): a long wait could drop the entry and time out.

Fix: record the tick before the wait (`window.npcNeedsSystem.tickCount`) and use `window.__test.needs.log(sinceTick)` (it already filters `e.t > sinceTick`), or require `l.t * 250 >= c0` in the cleared loop (`c0` is already taken at `:376`).

### nit 1: the 250 is hard-coded

`needs-sims-staff-room.mjs:361`. Read it from the page instead (`NEEDS_TICK_MS` is exported from `npc-needs.js:24`), or log `clockMs` in the entry. Low value; the constant has not changed.

### nit 2: the report cannot tell a cut from a full play

`needs-sims-staff-room.mjs:386-389`. The loop now ends on a heard cut too, and `r.cleared_exchange` has `heard` (event data) and `lines`, but not the log's `complete`. A truncated `lines` list from a cut reads like the old truncation. The E9 block at `:85-98` already reports `complete` and `cut`; add `complete: fin.complete` to `r.cleared_exchange` for the same reason.

## The new test

`test/js/npc-exchange-heard.test.mjs:639-651`. It pins "emit only when the mark happens": with the guard removed it fails (mutation above). The marking is sound and not timing-fragile. It wraps `sys._log` and adds the knot to `_exPlayed` when `exchange_started` is logged, which runs before any line is queued, so line 1 cannot beat it. The wait is `until(...)` on a step-driven fake clock, not wall time. The `writes` assertion is vacuous for the mutation (the helper returns false before it writes, so no write happens either way), but it still guards a future change that writes outside the helper.

### nit 3: the test stops at line 1

`:647`. It waits for one line, so an emit at a later line would pass. Run `o.sys.step(40000)` after the line-1 asserts and assert zero events and zero writes at the end as well (the sync tests at `:~650` do the same for the positive case).

## Validator

`scripts/validate_npc_needs.rb:889` now uses `m['condition'].to_s.match?(/\bdata\.complete\b/)`. A leading `\b` stops `metadata.complete`; the trailing `\b` stops `data.completed` and `data.completeTask`. `data.complete === true`, `!data.complete` and `ctx && data.complete` still match. Only the dotted form is caught, not `data['complete']`; no scenario uses that form, and the engine's condition language would not be expected to either. The test (`:659-672`) adds a `data.completed` binding on the same NPC and event and still expects exactly one hit, so the new boundary is pinned.

### nit 4: the added comment is after the assertions

`npc-exchange-heard.test.mjs:672`. "data.completed is a different word: no hit for it" sits after the last `assert.match`, away from the binding it explains at `:663`. Move it above the `t4` entry.

## Notes and fix log

`PROOF_HISTORY.md:824` and `:865`: the two dated notes are accurate (criteria now measured from the finish entry) and sit after the right tables. The fix-log line and R3 outcomes are consistent with the code.

## Findings

### Major 1 (carried): no live proof of the line-1 event yet

`scenarios/test_needs_sims/LIVE_EXCHANGE_HEARD_RELOAD.md:3`, `:9`.

Unchanged since R3. Unit tests 29 to 36 cover timing and the guard; the rule asks for live proof of an engine fix. Fix: when the port 3094 run lands, record `npc_exchange_heard` and `heard_<knot>` at the same tick as the first overheard line, every line still played, one event per game, no event after a mid-exchange reload; add the section `:3` promises or drop the sentence; update `:9`. If the run drives `needs-sims-staff-room.mjs`, apply minor 1 first.
