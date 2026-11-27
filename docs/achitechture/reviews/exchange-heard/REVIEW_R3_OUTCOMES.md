# Exchange heard on the first line: review round 3 outcomes

- Major 1 (no live proof of the line-1 event): in progress, orchestrator folds in.
- minor 1 (staff-room tool treats the event as the end): fixed. `needs-sims-staff-room.mjs` now breaks on the needs log's `exchange_heard` entry in the cleared-exchange loop and in `firstVisitHeard`; `start_after_call_s` is measured from that finish entry (tick x 250 ms), so `cleared_exchange.lines` and the 14 to 17 s criterion mean what they did. Dated notes added to `scenarios/test_needs_sims/PROOF_HISTORY.md` after both tables.
- nit 1 (no test for the guarded emit): fixed. New test in `npc-exchange-heard.test.mjs` marks the knot in `_exPlayed` from the start's log entry, so line 1 gives no event and no write. Checked in a scratch copy outside the repo: with the emit made unconditional it fails ("no event", 1 !== 0).
- nit 2 (`_finishCall` ignores the return value): accepted, no change. A call is placed only for an unheard knot, so the knot cannot already be marked at the finish.
- nit 3 (fix-log line 146 lacks a superseded note): fixed. "(superseded, see 5.6a)" appended in `EXCHANGE_HEARD_FIX_LOG.md`.
- nit 4 (validator substring match): fixed. `validate_npc_needs.rb` matches `/\bdata\.complete\b/`; the validator test gains a `data.completed` binding that must not warn.
