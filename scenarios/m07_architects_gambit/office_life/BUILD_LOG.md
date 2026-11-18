# m07 office life: slice 3 build log

Commit c36090d54 (first cut). Resolved: the measurements are done and recorded below ("Slice 3 measurements"; later commits b72a83d5f, eb6df8486, and the R2 re-time).

## Static checks (all on c36090d54)

- Validator: 0 errors, 31 warnings (baseline 30). New: V4 x2 (adaeze, gwen attackable mid-walk), justified: the 10.4 attack probe is the check that clears them. The agent_0x99 onceOnly-pair warnings are the existing family.
- Office summary: only adaeze_okafor and gwen_pritchard rows added (NPC count 8 to 10).
- Positions: only `["operations_floor","ops_cooler","water_cooler",[]]` added.
- Lock/key diff: empty.
- Ink compiles (10 files, 0 failed); dialoguelint: no findings on both operator files.

## Resolved: exchanges wired (e1bccce0e)

Resolved in e1bccce0e: the four lines were shortened and the exchanges block is wired in adaeze_okafor. The text below is the original note.

Four exchange lines exceed the validator's 40 character bubble limit (an ERROR): ex_last_two 1 (56), ex_last_two 2 (45), ex_going_now 2 (42), ex_going_now 3 (44). Line text was not changed. The exchanges block was left out of the scenario so it validates; an ERB comment marks the spot in adaeze_okafor (before `eventMappings`). Ready block, to add once the user shortens the four lines (suggestions: "The board still has us down as missing." 39; "Someone should have crossed us off." 35; "Two minutes and I'm out of the door." 36; "The fire marshal won't thank us." 32):

```json
          "exchanges": [
            { "with": "gwen_pritchard", "knot": "ex_last_two", "requireGlobal": { "ops_staff_upset": false, "server_hall_reached": false } },
            { "with": "gwen_pritchard", "knot": "ex_going_now", "requireGlobal": { "ops_staff_upset": false, "server_hall_reached": false, "heard_ex_last_two": true } }
          ],
```

`heard_ex_last_two` and `heard_ex_going_now` are already declared false.

## Resolved: seat and cooler placeholders (measured live)

Resolved by the slice 3 measurements (b72a83d5f, eb6df8486, 84e1d4b4f): the chair cells were confirmed live and the cooler `useFrom` worked for both operators. The text below is the original note.

Positions Gwen tile (2,5), Adaeze tile (4,5) are estimates from the Tiled chairs (60,178) and (124,178); cooler `useFrom` is dx 0, dy -1, also an estimate.

## Slice 3 measurements (2026-11-17, server :3098, keyless, setFPS(20) fixed steps)

Commits: b72a83d5f (initial tuning), eb6df8486 (chair move). Needs-log units: `tickCount` is 250 ms, so a log gap of 4 is 1 s.

### Needs clock to real seconds
- Ratio needs-clock to real: 0.994 to 0.9996 over 79 to 112 s idle (five readings, three games). Take it as 1.0 (the clock steps with the same frame step as the walks).
- Jitter does not differ between games: Adaeze first draw +8.1% (45 gave 48.72, 48.68; 40 gave 43.22, 43.22, 43.26), Gwen +7.5% (60 gave 64.56, 64.53; 55 gave 59.12, 59.12, 59.15). The seed is constant per scenario, so the first trip is deterministic; the small spread is decay between room load and the first read.
- Before tuning (45/60), games 7657, 7658: first trip 114.9 s after entering the room (too close to 120).
- Tuned `initial` Adaeze 45 to 40, Gwen 60 to 55 (gap kept at 15). Validator 0 errors, 31 warnings (unchanged).
- First natural trip after the tune, three fresh games: 7661 81.7 s, 7662 81.7 s, 7663 81.8 s after entering the operations floor (79.7 s to 79.8 s after the player stops). Margin 36 s above 45, 38 s below 120. Adaeze urgent at clock about 79 s; Gwen follows 21 s (5 s after Adaeze starts using, via the coupled row, plus her walk).
- Caveat: a different seed could move Adaeze's first urgency across 37 s to 84 s from load (initial 40 with +/-10%). The scenario seed is fixed, so this only matters if the seed ever changes.

### Use time and walk home, before seat stand (forced trip, thirst set to 20; five games, 7667, 7669, 7670, 7671, 7674; 7668 failed to load the page and was dropped)
| Game | A walk | A use | A home | A away | G walk | G use | G home | G away |
|---|---|---|---|---|---|---|---|---|
| 7667 | 3.0 | 22.0 | 4.0 | 29.0 | 3.5 | 22.0 | 5.75 | 31.25 |
| 7669 | 3.0 | 22.0 | 4.0 | 29.0 | 3.25 | 22.0 | 14.0 | 39.25 |
| 7670 | 3.0 | 22.0 | 4.25 | 29.25 | 3.5 | 22.0 | 17.25 | 42.75 |
| 7671 | 3.0 | 22.0 | 4.25 | 29.25 | 3.25 | 22.0 | 11.0 | 36.25 |
| 7674 | 3.0 | 22.0 | 4.25 | 29.25 | 3.25 | 22.0 | 5.5 | 30.75 |
Seconds, from job start to returned_post. Adaeze is steady (29.0 to 29.25 s). Gwen's walk home varies 5.5 to 17.25 s because `return_resumed` re-issues a stalled return (seen in 7669, 7670, 7671), the known pair stall. Adaeze left before Gwen in all five (Gwen about 21 s behind; she starts using 22 to 24 s after Adaeze). No expectedAwayMs needed (no laptop lock here).

### Order test, 50 seeds, three paths
Method: pure node simulation of the decay and refill, not a live manual-clock run. It imports `createSeededRng` from the engine's `npc-needs.js` and uses the engine's seeding rule (`hash32("<seed>:<npcId>")`, first draw for `initial` jitter, later draws for each refill jitter, 10%), with the scenario's decay, urgentAt 30, cooler restore 70 and the measured walk, use and home times, stepped at 250 ms for four cycles each (script in the session scratchpad, not committed). The coupled row (Gwen set to 30 two seconds after Adaeze starts using) is modelled. Paths: A natural trip; B talk break from seated (Adaeze set to 20 at the start); C talk-break set (Adaeze to 20) landing 10 s into her use. Seeds 1 to 50.
- Result: 0 failures in 150 runs. In every run the urgent events alternate Adaeze, Gwen, Adaeze, Gwen for four cycles. Smallest Adaeze-to-Gwen gap 5.3 s (the coupled follow-on); the next-cycle ranges do not overlap as PLAN 2.4 says.
- The live seed gives the single sequence in the trip table above (Adaeze first each time).
- Not done live: setManualClock run in the browser (not needed once the node simulation used the engine's own jitter function).

### no_beside_cell
Zero in the full logs of the six trips (five above plus a sixth after the chair move, game 7684) and in the first-trip logs. Cells: Adaeze local about (79 to 83, 244), Gwen about (112 to 115, 241 to 244).

### Chair check (one render, both operators seated, game 7681 and 7682)
- Before: the grey office chair Tiled object (gid 271, 24 x 38, bottom-left origin (60, 258), so footprint x 60..84, y 220..258) contained Adaeze's cooler cell (about (82, 244)). The render shows the chair standing directly above the cooler. Overlap confirmed.
- Applied PLAN 3 fallback 1: moved that chair to x 32 (one cell west, against the wall column; tmj and json both). It spans x 32..56, clear of Gwen's walk lane (x 56..72), both cooler cells and the desk. Only m07 uses `room_pnw_ops`. The positions diff (10.6) now shows this chair as well as `ops_cooler`.
- After: render (tmp/m07-chair-check.png, game 7682) shows the cooler's north side clear; a trip on game 7684 reached `using` for both with no `no_beside_cell`. Probe: tools/playtest/m07-ol-chair.mjs.

### Use time and walk home, after seat stand (R2 m5, natural trips)

Natural first trips on three fresh games (8239, 8247, 8260), keyless server :3098, probe `tools/playtest/m07-ol-r2.mjs`, player parked at (520,248), polled every 0.25 s plus call overhead, so each figure is good to about 0.5 s. Wall seconds (the probe computes `(Date.now() - tEnter) / 1000`); `left` is the first sample off post, `home` is the end of `using` to back at post. These games ran on a loaded machine (frame mean 25 to 80 ms), so the simulation ran slower than wall time and the use times (34 to 36 s in 8247 and 8260 against 22 s) are inflated, and the walk figures are inflated by the same factor; in 8247 and 8260 both operators' `using` ended in the same poll, so `home` there is less exact.

| Game | A left | A walk out | A home | A away | G left | G walk out | G home | G away |
|---|---|---|---|---|---|---|---|---|
| 8239 | 88.1 | 2.7 | 4.3 | 29.0 | 93.8 | 2.8 | 9.3 | 34.1 |
| 8247 | 79.8 | 2.6 | 2.7 | 39.7 | 85.3 | 3.1 | 5.9 | 37.4 |
| 8260 | 74.7 | 3.3 | 6.1 | 45.1 | 81.1 | 4.1 | 6.1 | 38.7 |

Result, read as wall seconds on a loaded machine, so the comparison with the unloaded "before seat stand" table above is not like for like. Against game 8239 only (the quietest, use time 22 s, so no inflation): Gwen's walk home is 9.3 s (before the fix: 5.5 to 17.25 s, median 11 s, with three `return_resumed` stalls in five), Adaeze's 4.3 s (before: 4.0 to 4.25 s), walk out 2.7 and 2.8 s (before: 3.0 to 3.5 s). Adaeze's walk home is not shorter than before. Gwen's stalls were not seen in any of the three trips (8247 and 8260 figures are inflated and shown for completeness). First trip started 74.7 to 88.1 s after entering the room, inside 45 to 120 s. Three trips is a small sample, so the stall is reduced in these runs, not shown to be gone.

## Accepted: one punch can hit both operators (10.4)

A punch thrown from between the two seats (64 px apart, inside punch range) can turn both operators hostile (2 of 7 runs, games 7889 and 7930). Accepted: it is the player's choice, and the credits stay correct because `ops_staff_upset` and the KO globals do not depend on how many turn hostile. Moving a seat would need another Tiled change for a player-caused edge case.
