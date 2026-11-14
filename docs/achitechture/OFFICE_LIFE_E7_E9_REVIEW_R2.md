# Office life E7 to E9: implementation review, round 2

Branch `build/ol-e7-e9` at 94fcbc788, reviewed as `git diff d69c29089 94fcbc788` in a fresh detached worktree, with the round 1 fixes read on their own as `git diff 2180042a4 94fcbc788`. Spec: `OFFICE_LIFE_MISSIONS_PLAN.md` 9.1 (c3f2878e9). Round 1: `OFFICE_LIFE_E7_E9_REVIEW_R1.md`. Main (bb0a458b1) was not merged; its `npc-needs.js` is byte-identical to d69c29089's.

**Counts: 0 B, 0 M, 3 m.** Verdict: **SHIP**. The minors are a README count, a reproducibility note for the driver, and the one 9.1 check (a scored lab replay) still owed by a playtest run, which this review's live run covers for the part E9 touches.

## Round 1 fixes

- **M1, right.** `_pickBark` (`npc-needs.js:2652` to `:2660`) adds the fit check to `ready`, so the peek runs only when `maxMs < CHAT_MAX_MS`, after the cooldown check and before `_speechFree`. A line that does not fit gives a picture (or null) with no bag change and no cooldown. The check `bubbleMs(line) > maxMs` with `maxMs = overlapEnd - clockMs` is the same inequality as `_tickChats`'s `clockMs + ms > overlapEnd` (`:4002`), so a peeked line that passes is never dropped by the later fit check. A lock wait re-enters with a smaller `maxMs` and peeks again.
  - **Peek against draw.** `_bagPeek` (`:2624`) mirrors `_bagNext` (`:2613`) branch for branch: a new or changed pool (`sig`) peeks round 0 with `last -1`, which is what `_bagNext` rebuilds; a non-empty order peeks `order[0]`; an empty order peeks `bagOrder(n, rng(seed:key:bag:round), last)[0]` with the round `_bagNext`'s post-increment uses. `bagOrder` and `createSeededRng` are pure, so the refill is the same array. I fuzzed it (20,000 steps, two NPCs, two topics, pools of 1 to 4 lines swapped at random so `sig` changes mid-bag and bags refill across rounds, a draw on 60 per cent of steps): 12,039 draws, 0 mismatches, and a peek never changed `_bags`. The only other bag consumer, desk-phone calls (`:4232`), draws with no peek and is not affected.
- **M2, right.** The queue-chat gate test (`npc-exchange-heard.test.mjs`, "a coffee queue chat with only the queued speaker heard") has the lab's shape (owner and first speaker at the machine, partner queued) and checks both halves. The live lab run is below. The scored replay is m3.
- **m1, right.** See "Golden hash" below.
- **m2, right.** 5.6a now limits "never takes the lock" to bark turns and states the exchange rule. The optional engine change stays with the user.
- **m3, right.** `routeLength` returns `out(null, false)` when `worldPathfinder` or `worldGridBounds` is missing (`:4951`), which are exactly the two conditions under which `findWorldPath` calls back null at once (`npc-pathfinding.js:495`). The no-detail result is null as before, so `_expectedAwayMs` is unchanged.
- **m4, right.** The three gaps have tests, plus the stronger bag test.

## Golden hash

The fixture diff from d69c29089 is two lines, both the water cooler's `useSeconds` 40 (`objects()` and `PRESET_OBJECTS`). I ran the 15-minute sims day for every engine against both fixtures:

| Engine | Old fixture (2180042a4) | New fixture (94fcbc788) |
|---|---|---|
| d69c29089 (main) | a87a652c0b54, 231 entries | d6dbd5a50373, 229 entries |
| 2180042a4 (R1) | a87a652c0b54 | d6dbd5a50373 |
| 94fcbc788 (R2) | a87a652c0b54 | d6dbd5a50373 |

The hash follows the fixture only; no engine change moves it. The log diff is every cooler use ending 100 ticks (25 s) later and what follows from that (Grace's thirst, Sanjay's microwave, Rosa's return all shifted). The other sims-day tests (`npc-queues`, `room-tone`, social-pairing "decision log unchanged") compare runs with each other, not with a stored hash, so they needed no edit. The validator accepts the object-level `affordance` (info 31: "gets 'cooler' (own: useSeconds)").

## The new tests on the pre-fix engines

All 646 `bin/test-js` files pass at 94fcbc788. With 94fcbc788's tests over older engines:

- On 2180042a4's `npc-needs.js`: fail `bag peek` (no `_bagPeek`), the 3 s / 5 s overlap test, and `routeLength` "grid not ready". The queue-gate and stronger bag tests pass there, as they should, since they test E9 and E7, which 2180042a4 already has.
- On d69c29089's: the queue-gate test fails, and so does the stronger bag test, with voiced-chatter 4, 6, 7, 8 and exchange-heard 11, 14, 15, 16, 18 as in round 1.

Every new test fails on the engine before its fix.

## Live: lab_physical_pentest coffee_exchange

Keyless server on :3089 from this worktree (`env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true`), stopped by PID. Games from `tools/playtest/new-game.rb`, headless Chromium, `setFPS(20)` with fixed steps on. A scratch driver opens reception, hall and open_plan, parks the player, sets Sofia's caffeine to 100 and Chris's then Melanie's to 10, and records `npc_chatted:coffee_station`, the needs log and `heard_coffee_exchange`. In every run Chris uses the station and Melanie queues, so this is a queue chat (`c.queue`).

| Game | Engine | Player | Result |
|---|---|---|---|
| 4572 | branch | below the station, 51 px from Chris, 68 from Melanie | PASS. Melanie's `coffee:1` (heard), then `coffee_exchange:0` to `:2`, all heard, `npc_exchange_heard`, `heard_coffee_exchange` true in the page |
| 4577 | branch | 150 px west of the queue cell: Melanie 151 px, Chris 188 px | PASS (gate). Melanie heard, Chris `picture:caffeine` unheard, no `exchange_started` for three turns. The player then walks to the station; the exchange starts on the next turn (37250) with Chris at 41 px and plays all three lines, heard |
| 4579 | main (bb0a458b1's `npc-needs.js` served to the page) | as 4577 | Main's behaviour: the exchange starts with Chris at 178 px, so line 0 is voiced unheard and the player gets it from line 1 |
| 4582 | branch | as 4572, browser kept 40 s after the end | PASS. All three lines heard; `heard_coffee_exchange` true in the game's saved `player_state` once the 30 s state sync ran. In 4572 to 4579 the browser closed before that sync, so the saved value was still false on both engines |

No task maps on the exchange (the only completed task is `brief_heard`), and nothing reads `heard_coffee_exchange`. Console errors: `/tts` 503s (keyless) and one 404 from the driver's own probe. In 4572 and 4579 the first turn was Melanie's bark although Chris was heard; the exchange started on the turn after on both engines, which fits the knot's lines still loading (`pending`). That is unchanged by E9.

The player-facing change for the lab is the intended one: someone watching from beside the queue end now sees Chris's pictures until they come within 160 px of her, and then hears the whole exchange from its first line.

## Findings

### m1. The README's R1 rerun row counts five games and lists four

`scenarios/test_needs_sims/README.md`, row "R1 rerun: no line drawn unheard or past the overlap": "PASS, 5 of 5" with games 4516, 4517, 4539 and 4541. The fifth game in the build log table, 4540, is the before case on the round 1 engine and is a fail by design. Fix: "PASS, 4 of 4", keeping the 4540 sentence as it is.

### m2. The live driver reads globals that a short run has not saved yet

`tools/playtest/e7e9-live-proof.mjs` checks `heard_*` in `window.gameState` only. That is enough for the engine, but the saved state follows on the 30 s state sync (`state-sync.js:269`), so a run that closes the page straight after the exchange leaves the server at false (games 4572, 4577, 4579 here). Not a bug. Fix, if the driver is reused for a save or reload proof: wait at least 30 s, or call the sync, before closing, and say so in its header.

### m3. 9.1's scored lab replay is still open

The `verify-run.rb` score-100 replay of `lab_physical_pentest` and its `IMPROVEMENT_LOOP_LOG.md` line were not run (build log, "M2, the remaining parts"). The part of the lab E7 to E9 can change, the coffee chatter and exchange, is now proven live above, and the round 1 `regress` runs (4486, 4497) cover the needs NPCs. A full critical-path replay is a playtest-scenario run and belongs with the user's production deploy gate playtests. Severity m: the remaining risk is to beats that do not read chatter.

## Checked for new problems

- `_pickBark` gets `maxMs` from `_tickChats` only; every other caller keeps `Infinity`. A NaN `overlapEnd` would skip the peek, and the later fit check would also pass, as before.
- With `pictures: false` and a line that does not fit, a heard turn is null and counts as one of the 40 silent turns. That is harmless: the overlap ends within 4 s anyway.
- The peek runs only in the last 4 s of an overlap and costs one `bagOrder` at most.
- No synced state is added. Bags and cooldowns are in memory, and `heard_<knot>` is still written only from `_finishExchange`.
- The `npc-world-bubbles.js` change is a comment.
