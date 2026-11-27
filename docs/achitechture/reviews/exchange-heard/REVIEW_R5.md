# Exchange heard on the first line: code review, round 5 (final)

Branch `fix/exchange-heard-on-first-line`, HEAD `1286d859c` (a merge of main `ac0d794d1`).
Delta reviewed: the R4 fix commit `b93cb5568` (four files) and the two merge commits.

Counts: Blocker 0, Major 0, minor 0, nit 2.

Verdict: ready to merge.

## Tests run

- `node --check tools/playtest/needs-sims-staff-room.mjs`: clean.
- `bin/test-js -j 6` on every `test/js` file named `npc-*`, `needs-*`, `phone-call*` and `validator-*`: 201 files, 201 passed, 0 failed.
- Ruby validator (`scripts/validate_scenario.rb`) on `test_needs_sims`, `office_life_showcase` and `m04_critical_failure`: all three report 0 errors. The `reads data.complete` warning fires on none of them.
- No browser or server was used. The staff-room tool was checked by reading, not run.

## Footprint against main

`git merge-base HEAD main` is `ac0d794d1`, so main has not moved since the last merge and `git diff ac0d794d1 1286d859c` is exactly the branch's own work. It lists 21 files, all of them fix files: the engine change (`npc-needs.js`), the validator and schema, the test, the two playtest tools, the test scenario and its proof notes, the architecture docs, one skill reference line, and the review files R1 to R4 with outcomes. Nothing from main shows up as a branch edit. Engine and `scenarios/m04_critical_failure` are unchanged since `ae1e17409`, the commit the live proof ran on, so the proof still describes the shipped engine code. Only `scripts/validate_npc_needs.rb` (one line, the R3 word-boundary change) moved after it, and the unit test pins that.

## R4 findings

| R4 | Status | Notes |
|---|---|---|
| Major 1, no live proof | Resolved | "Round 2 proof" section in `LIVE_EXCHANGE_HEARD_RELOAD.md`; see below. |
| minor 1, log lookups unscoped | Resolved | See "Scoped log lookups". |
| nit 1, 250 hard-coded | Resolved | `tickMs()` reads it from the page. |
| nit 2, report cannot tell a cut from a full play | Resolved | `r.cleared_exchange.complete` added. |
| nit 3, test stops at line 1 | Resolved | Test steps 40 s more and asserts no event and no write. |
| nit 4, comment after the assertions | Resolved | Comment now sits above the `data.completed` binding. |

No regression found.

## Scoped log lookups

The bridge is `log(sinceTick = 0) { return (this._sys()?.getLog() || []).filter(e => e.t > sinceTick); }` (`public/break_escape/js/systems/test-bridge/index.js:2294`). The tool's `needsLog(sinceTick)` passes the value into `page.evaluate` as an argument, so it is serialised correctly, and it keeps the default of 0 for the unscoped E9 calls.

Tick derivation: `NEEDS_TICK_MS` advances `clockMs` and `tickCount` together in `tick()` (`npc-needs.js:1187-1189`). The only other writes to either are the two resets to 0 (`:429-431`, `:655-657`), also together. So `clockMs / tickCount` is exactly the tick length, and `Math.floor(closeMs / ms) - 1` is the needs tick at or just before the Neil close. Entries are `t > since`, so the one tick of slack means nothing at or after the close is dropped. The exchange it looks for starts after the close, so nothing earlier can match.

Division by zero: `tickMs()` returns `DEFAULT_TICK_MS` when `tickCount` is 0, and `clockMs` cannot be 0 while `tickCount` is above 0 because the two move together. By the time `tickMs()` runs (after the Neil close and the settle), the system has ticked many times. So the divisor is never zero here. If a future change broke the lock-step, `ms` could become 0 and `closeMs / 0` would give `Infinity` and `Math.floor(Infinity) - 1`, which filters out everything and leaves `callFinish` null (reported as null, not a crash). That is a graceful failure, not a hang.

`sinceC0 = Math.floor(c0 / ms) - 1` reuses the same `ms`, read earlier in the same branch of code. That is fine: `ms` is declared with `const` in the same block as the job-beat code that uses it at `c0` (declared before it, at `:365`), and both are inside the `if (beat === 'job_beat' || ...)` block.

`firstVisitHeard` takes `since` from `needsTick()` before the wait, which is the correct and simplest scoping.

## Extended test

`test/js/npc-exchange-heard.test.mjs:648-654` now steps 40 s of fake clock after the line-1 asserts and asserts zero events and zero writes. That covers an emit or a write at a later line, which the R4 version could not. (The R4 mutation, an unconditional emit, still fails the earlier assertion; the new lines add the later-line case.)

## Folded proof section

`LIVE_EXCHANGE_HEARD_RELOAD.md` now has a "Round 2 proof" section (games 9785, 9790, 9800, three cases, HEAD `ae1e17409`) with the event at line 1, flag true at emit, one emit per game, no replay and no event after a reload, and no console errors other than /tts. The top sentence now points at it, and the earlier "no reload" row says it predates R1. The notes (music mp3 aborted by reload, regenerated dungeon-graph files restored, probe not committed) are honest about limits. One line says the exchange did not resume "was not checked against the engine"; that is accurate and sufficient, since the unit tests cover the guard.

## Nits

### nit 1: the proof table says "Line showing at emit" for case 3 with prose in the cell

`LIVE_EXCHANGE_HEARD_RELOAD.md`, case 3 row. The cell mixes the emit line (line 1) with where the reload fell (after lines 1 to 4 shown). Readable, but the reload point belongs in the case column. No action needed.

### nit 2: the cleared-exchange report can miss a last line by one poll

`tools/playtest/needs-sims-staff-room.mjs` (`~:388-397`). `evs` is fetched at the top of each loop pass, then `needsLog` is checked. If the finish entry lands between the two calls, the `lines` list is built from an `evs` that predates it. The window is milliseconds and the old code had the same shape (and the finish is logged after the last line is queued), so this is not a regression. Re-fetching `events()` after the loop would close it.

## Ruling

Every R4 finding is resolved, the footprint is clean, all 201 JS tests and the three validator runs pass, and the live proof covers the three cases the fix needs. Ready to merge.
