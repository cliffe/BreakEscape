# Exchange heard on the first line: review round 4 outcomes

- Major 1 (no live proof of the line-1 event): fixed. `LIVE_EXCHANGE_HEARD_RELOAD.md` gains the "Round 2 proof" section (HEAD ae1e17409, games 9785, 9790, 9800, all pass); the early "no reload" row now says it predates R1 and that the event fires at line 1; the music mp3 aborted by the reload and the regenerated, uncommitted dungeon-graph files are noted.
- minor 1 (log lookups not scoped to the start of the wait): fixed. `needs-sims-staff-room.mjs` passes a `sinceTick` to `__test.needs.log` in `firstVisitHeard` (tick at the start), the job-called lookup (tick of the Neil close) and the cleared-exchange loop (tick at `c0`). `node --check` clean.
- nit 1 (250 ms hard-coded): fixed. Ms per tick is read from the page (`clockMs / tickCount`), with a named `DEFAULT_TICK_MS` fallback.
- nit 2 (report cannot tell a cut from a full play): fixed. `r.cleared_exchange` now carries `complete` from the log entry.
- nit 3 (test stops at line 1): fixed. The guarded-emit test steps 40 s more and asserts no event and no write at later lines.
- nit 4 (validator test comment after the assertions): fixed. The comment now sits above the `data.completed` binding.
