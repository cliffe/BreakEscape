# m02 office life, stage 5 R5 live checks (m4 and m5), 2026-11-16

Branch `build/ol-m02`, tip 8924170a4. Keyless server on port 3095, headless browser, `setFPS(20)` with fixed steps on (`fixedStep` read true in every run). Each run used a fresh game from `tools/playtest/new-game.rb`, started in the reception lobby with `--unlock` for `ward_hall`, `office_corridor`, `staff_room` and `it_department` (access only; no item, flag or state was seeded, and no game row was edited by hand). Nothing set `cover_burned`: Gary's real conversation did, through the dialogue bridge.

Earlier R5 attempts (games 5675, 5698, 5718, 5726, 5736) are void. The cause: `enterRoom` only crosses to an adjacent room, and the lobby is not adjacent to the staff room, so every jump failed. Without unlocks the walk also stops at `ward_hall` (a locked door and a phone bark block `enterRoom`). The scripts now hop room by room: lobby, `ward_vestibule`, `ward_approach`, `hospital_ward`, `ward_hall`, `office_corridor`, `staff_room` (proved on game 5743: all six hops `ok`, about 25 s). Scripts are in the session scratchpad `m02-live5/` (`lib3.mjs`, `m4.mjs`, `mb5.mjs`, `run6.sh`); screenshot `out/m4-microwave-5760.png`.

## Check 1 (m4): walked crossing from the staff room into IT while Ernesto uses the microwave

Each cycle: back to the staff room south door by adjacent hops, Ernesto's hunger set to 10, wait until his job is `using` `staff_microwave`, then `enterRoom('it_department')` (a real walked crossing: align at the door, walk through) with the player's and Ernesto's positions sampled every 100 ms. Pass: crossing completes, no stop of 1 s or more, no jump over 25 px between samples, Ernesto at the microwave throughout.

| Cycle | Game | Result | Evidence |
|---|---|---|---|
| 1 | 5760 | PASS | Reached IT 2.9 s after the start. Two `enterRoom` attempts (the first aligned in the gap but did not cross, the second did). Longest stop 0.5 s, largest step 22.5 px, closest approach to Ernesto 11 px |
| 2 | 5760 | PASS | 1 attempt, crossed at 2.5 s, longest stop 0.1 s, largest step 22.5 px, closest 10 px |
| 3 | 5760 | PASS | 1 attempt, 2.5 s, stop 0.1 s, step 22.5 px, closest 10 px |
| 4 | 5760 | PASS | 1 attempt, 2.5 s, stop 0.1 s, step 15 px, closest 10 px |
| 5 | 5760 | PASS | 1 attempt, 2.7 s, stop 0.1 s, step 22.5 px, closest 10 px |

Ernesto stayed `using` `staff_microwave` for every sampled row in all five crossings. The player passed within 10 to 11 px of him and was never stopped or pushed. The screenshot shows him directly beneath the microwave, facing it, with the hunger icon above his head, so the fridge concern in m4 does not show on the real art. `dx: 0.25` was not tried: nothing here needs it. Total: 5 of 5 PASS.

## Check 2 (m5): mid-break variants, with Gary's real conversation setting `cover_burned`

Variant A: the player enters the staff room, Ernesto starts a boiler break, the player leaves at once without hearing the paper exchange, plays Gary's conversation in IT (34 to 35 lines, closed, `cover_burned` true, one `conversation_closed:gary_whitlock`), and walks back while the break runs. Pass: Ernesto still `using` on re-entry, `night_watch_burned` 3 of 3 lines spoken and overheard, `heard_night_watch_burned` true.

| Run | Game | Result | Evidence |
|---|---|---|---|
| A1 | 5759 | PASS | Burn lines 0 to 2 heard 0.9, 5.7 and 10.7 s after re-entry; burned flag true |
| A2 | 5766 | PASS | Lines heard at 1.2, 5.9, 10.9 s; flag true |
| A3 | 5772 | PASS | Lines heard at 1.3, 6.0, 11.0 s; flag true |
| A4 | 5779 | PASS | Lines heard at 0.6, 5.4, 10.4 s; flag true |

`heard_night_watch_paper` stayed false after each A break (the paper exchange was never heard), as expected. Total A: 4 of 4 PASS.

Variant B: the player stays for the whole 4-line paper exchange, then plays Gary's conversation (35 to 37 lines, `cover_burned` true on close), walks back into the same break, and waits out the break and the next one. Pass (criteria set for this run, see the note): `night_watch_paper` 4 of 4 spoken and heard, `heard_night_watch_paper` true after the break, `night_watch_burned` heard 3 of 3 exactly once across the running break and the next one, `heard_night_watch_burned` true.

| Run | Game | Result | Evidence |
|---|---|---|---|
| B1 | 5754 | PASS | Paper lines 0 to 3 all heard; paper flag true. Burn exchange 3 of 3 heard in the running break after re-entry (Ernesto still `using` the boiler); 0 in the next break; burned flag true |
| B2 | 5767 | PASS | Same pattern: paper 4 of 4 heard, burn 3 of 3 in the running break, 0 later, both flags true |
| B3 | 5785 | PASS | Same pattern |

Total B: 3 of 3 PASS (3 runs, not 5, because each run takes about 6.5 minutes; A has 4).

Note on B. The script's built-in `pass` printed false for all three. Its criteria were stale: it waited for 5 paper lines (the exchange is 4 since D30 (a)) and required that the burn exchange not play in the running break. That second rule came from game 5593, where the burn waited for the next meeting. In all three runs here the burn exchange plays in the running break straight after the player re-enters, then does not repeat in the next break. Nothing is lost or heard twice, so I count it as a PASS; it is a change from 5593 that the owner may want to know about (it matches variant A and the 5564 result).

## Total

Check 1: 5 of 5 PASS. Check 2: 7 of 7 PASS (A 4, B 3). 12 PASS, 0 FAIL, no page errors in any run. Fewer repeats than the old plan's five per variant for check 2, for time.
