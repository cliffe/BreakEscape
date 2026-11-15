R5: 0 B, 0 M, 1 m

# Office life stuck return: code review R5 (final delta)

Scope: the R4 fix delta, `git diff c7b1206a7..8a111d6a4 -- public test` on build/ol-stuck-return (tip `8a111d6a4`), read against `OFFICE_LIFE_STUCK_RETURN_REVIEW_R4.md` (Outcomes). Read only; no servers started. The two integrator checks were run from the worktree (results at the end).

## Each fix against its finding

- **R4 m1 (quick re-plans uncounted): fixed.** `_abandonReturn` (npc-needs.js:4127 to 4128) increments `s.returnAbandons` on every abandon and makes the abandon final once it passes `RETURN_MAX_ABANDONS` (6), wherever it is. The count is cleared with `returnLate` at arrival (:1479) and at job pick (:1525), and nowhere else, so a return that restarts after a job starts from 0. The `place` expression (:4131) now re-tests `_samePlace` because `again` can be true for a different place; without that the stored place would be the previous one for a wedge elsewhere. Correct. After the cap every abandon is `replan: false`, so only the capped late walks (3) follow: at most 6 + 1 + 3 abandons, as the test asserts.
- **R4 m2 (player-blocked abandon past the cap): fixed.** The selector (:1529 to 1531) and `_replanAbandoned` (:4150) both test the 60 s wait first, then `a.player || returnLate < RETURN_FINAL_REPLANS`. A player-blocked walk is still uncounted (`!a.replan && !a.player` at the increment), so `returnLate` stays at 3. With the player standing beside the NPC for ever it walks once per 60 s of needs clock, which is the intended bound (the blocker is real and visible), and each walk still counts in `returnAbandons`.
- **R4 m3 (seat counts never given back): fixed.** seating.js:2007 to 2009 zero `_seatGiveUpExpiries`, `_seatRetries` and `_fetchRetries` inside the `_seat` branch, after the stop and chair checks, so only a body that is actually seated at its current stop resets.
- **R4 m4 (adapter tests): fixed.** `npc-needs-nudge-adapter.test.mjs` builds a behaviour on the real `NPCBehavior.prototype` and the real `createEngineWorld`. It covers the landing, the refused nudge (player at 10 px), the no-nudge call clearing `_lastNudge`, `moveTo` returning `{ nudged }` or null, and `playerBlocks` at 40 px, 80 px and with no behaviour. `window.player` is restored in each test.

## Reset on every seated update: can a flicker bring back an unbounded retry?

No. The reset needs `behavior._seat` to be set, which only happens after a completed sit (`seatNPC`), and the fetch and seat-move branches return before it. A retry cycle that starts again therefore has to complete a real sit first, so each reset is paid for by progress. The ways to leave the seated state at the same stop are the chair going inactive, KO or hostile (all external events, each followed by a new walk, fetch and sit before the next reset), and a stop change (which resets at :2072 to :2076 anyway). A body that sat for one frame and was unseated by an external toggle every few seconds would repeat retries without bound, but that loop is the external toggle's, not the retry logic's, and the sit itself is real. The cost is three property writes per seated NPC per update, negligible. `_seatGiveUpExpiries` and `_seatRetries` have no reader while seated, so the reset cannot hide a give-up that is in force.

## Do the new tests fail on the old code? (by reading)

| Test | Old code path | Fails on old code? |
|---|---|---|
| R4 m1, alternating wedges on quick re-plans | `again` was only `_samePlace(prev, pos)`. The test flips the body between x 200 and 400 on each abandon, so every abandon was not-again, `replan: true`, run next tick, no count. Abandons never stop: the `<= 6 + 1 + 3` bound, the `final` assertion past the cap and the 20 minute silence all fail. | Yes |
| R4 m2, player-blocked past the cap | The selector and `_replanAbandoned` both required `returnLate < 3` for a non-replan abandon. With `returnLate` at 3 and `a.player` true no walk is issued, so `walkAt` stays null and the "a walk home past the cap" assertion fails. | Yes |
| R4 m3, seat counts reset | Old code reset only on a stop change. The test seats the NPC, sets the three counts, updates once and expects zeros. | Yes |
| R4 m4, adapter | Not a behaviour change. A rename of `_lastNudge` or a `playerBlocks` signature change would fail them, which is the point. | n/a |

One caveat on the m2 test: it relies on the third late walk's abandon being final (not a quick re-plan) so that the 60 s assertion is meaningful. That holds because by then `returnAbandons` is above 6, so the m1 cap makes every abandon final. The m2 test therefore also depends on the m1 fix. It still fails on the old code, so this is not a defect.

## Findings

### m1. The header comment on `RETURN_STUCK_MAX_BACKOFFS` is stale

npc-needs.js:54 to 58 says a second abandon in the same place is final. Since R4 an abandon is also final once the return has passed `RETURN_MAX_ABANDONS`, wherever it is. The constant's own line comment is right; the earlier block does not mention it.

Fix: change "A second abandon in the same place is final" to "A second abandon in the same place, or any abandon past RETURN_MAX_ABANDONS in one return, is final".

## Dropped locals and other stale text

None left: the `again`/`place` rewrite uses `prev` consistently, the imports in the stuck-walk test (`RETURN_MAX_ABANDONS`, `RETURN_FINAL_REPLANS`) are used, and the `_abandonReturn` doc comment and the `RETURN_FINAL_REPLAN_MS` block comment match the code (the latter does not mention the player bypass of the cap, covered by the `_abandonReturn` doc comment; not worth a finding).

## Test results

- `bin/test-js`: Files: 676 passed, 0 failed, 676 total (includes `npc-needs-nudge-adapter`, `npc-needs-stuck-walk` and `seating`).
- `BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle bundle exec rubocop`: 366 files inspected, no offenses detected.

## Outcomes

- m1: fixed. The header comment by RETURN_STUCK_MAX_BACKOFFS now also names an abandon past RETURN_MAX_ABANDONS in one return as final.
