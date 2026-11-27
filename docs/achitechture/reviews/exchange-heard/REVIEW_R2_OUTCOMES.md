# Exchange heard on the first line: review round 2 outcomes

- Major 1 (no live proof of the line-1 event): left to the separate live run; the "No reload" row in `LIVE_EXCHANGE_HEARD_RELOAD.md` now says it predates R1.
- minor 1 (hear_waiting title and mapping comment): fixed. Title now reads "while they chat"; the comment at the job-called mapping says the task and the upkeep drop happen at her first line. `ink/jodie.ink` left alone (its comment describes the mapping, not timing).
- minor 2 (dead E9 check in the playtest tools): fixed. `needs-sims-staff-room.mjs` reads `complete` from the needs log's `exchange_heard`/`exchange_cut` entries, and `marked_heard_with_0_heard` is now true when no overheard line of the knot exists at or before the event; `e7e9-live-proof.mjs` no longer prints `complete` from the event (its `out.log` already carries the log entries).
- minor 3 (no warning for `data.complete` bindings): fixed. `validate_npc_needs.rb` warns on an `npc_exchange_heard` mapping whose condition reads `data.complete`; test added in `npc-exchange-heard.test.mjs`. `EXCHANGE_HEARD_FIX_LOG.md` marks the old binding advice as superseded.
- minor 4 (cut test and late first heard line): fixed. Test 34 asserts the write and event at line 1 before the cut; new test 35 has line 1 unheard and line 2 heard (flag and one event at line 2, event order checked). Both fail against the old `npc-needs.js` (`5408264bb`), checked in a scratch copy outside the repo.
- nit 1 (finish wording): fixed in `NPC_NEEDS_SYSTEM.md` and the comment above `_finishExchange`.
- nit 2 (emit follows the mark): fixed. `_markExchangeHeard` returns true only when it marks, and `_tickChats` emits on that.
- nit 3 (older docs): fixed. Superseded notes on `OFFICE_LIFE_PLAN.md` and the fix log; the `mission-office-life` `mapping-patterns.md` reference now names `_markExchangeHeard` and `_tickChats` and drops the stale line numbers.
- nit 4 (proof note's home, probe not committed): not changed; depends on the live run's result.
