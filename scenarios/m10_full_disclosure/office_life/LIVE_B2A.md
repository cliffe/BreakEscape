# m10 live B2a: attack probe, briefing reload, L3 briefing, L2 reach (partial)

Server: keyless, :3099 (orchestrator's, not started or stopped here). Fresh game per run (new-game.rb). Headless, setFPS(20), fixed steps on. Driver: scratchpad `b2a.mjs` (not committed); lib `tools/playtest/m10-ol-lib.mjs` unchanged. Positions are body centres; "home" is the engine's `npcNeedsSystem` home (276,268) and (308,268). Forced caffeine uses `__test.needs.set`. Globals read from `window.gameState.globalVariables`, never set.

Status: B done; C done (5 of 5); D done with two fails to diagnose; A partly done (attack landed once, chase not validated; KO runs done, chase positions not reliable). Not done: a valid chase measurement for the attack case, and the diagnosis of the D fails.

## A. Attack probe (10.4), fresh game each

| Step | Result |
|---|---|
| A1 attack Darren, first try | Punch returned true but did not land: Darren stayed peaceful (`hostile` false), `fp_staff_upset` false. Walk to his reach failed at 47.8 px (`arrived-but-outside-plain-range`). Not counted. |
| A1 attack Darren, retry (walk to (262,268), then `playerCombat.attack` toward him) | Landed. `fp_staff_upset` true, Darren hostile, `fp_darren_ko` false. Forced caffeine 5 on both: no use started by Darren (job null, caffeine 3.8). Sofia job null, caffeine read 31 at +25 s; no use event in the filter. Unexplained, flagged. |
| A1 attack, chase at the three spots | NOT VALID. The corrected walks to the table, Netherton and gate cells failed with `blocking-ui` (a UI was open). Darren's max distance from home was 1.3 px (at about (263,271)) across the window, so he did not chase at that spot. The table, Netherton and gate chase values are not measured. |
| A2 knock out Darren (`debugKO`) | `fp_darren_ko` true, `fp_staff_upset` false (the KO path does not set it). Darren's body moved 40 px at the KO, the same 40 px at all three spots, so it is a one-off displacement, not a chase. Sofia kept using the kettle after caffeine was forced (windup, use start, used). Kettle NOT off. |
| A3 knock out Sofia (`debugKO`) | `fp_sofia_ko` true, `fp_staff_upset` false. Sofia moved 40 px at the KO (same as above). Darren kept using the kettle after the forced caffeine. Kettle NOT off. Chase positions not reliable (walks landed about 27 px off target). |
| A4 knock out arakawa_gate | `arakawa_gate` is in the scene's NPC manager (true), but `moveToNear` returns `unknown-entity:arakawa_gate`. Not reachable before the split. Not KO'd. |
| Chatter | 0 chatter entries in the needs log for every run. Global-free: no `patrolOverride` on either extra. |

Open: the chase test for the attack needs a re-run with a working approach to the table cell (the walk helper was off by up to 28 px in y on some points). The KO "kettle off" requirement fails as written: the unstruck extra keeps using the kettle.

## B. Briefing reload (10.3)

| Measure | Before reload | After reload (+3 s) | After settle again |
|---|---|---|---|
| Darren body / home | (276,268) / (276,268), 0.0 px | (276,268), 0.0 px | 0.0 px |
| Sofia body / home | (308,268) / (308,268), 0.0 px | (308,268), 0.0 px | 0.0 px |
| `heard_ex_fp_kettle_on` | false | false | false |
| Kettle or exchange events after reload | n/a | none | none |

Settle after the reload closed one NotesMinigame and nothing else. Darren's caffeine went from 19.9 to 64.8 across the reload, so the opening brew completed; no second brew fired. PASS (both at homes, no second `ex_fp_kettle_on`).

## C. L3 briefing: close Netherton, brew timing (5 tries, fresh game each)

Times are seconds after `conversation_closed:director_netherton`.

| Try | Darren windup | Darren use start | Sofia windup | Sofia use start | `heard_ex_fp_kettle_on` at read |
|---|---|---|---|---|---|
| 1 | 2.1 | 3.1 | 4.8 | 5.8 | false |
| 2 | 2.2 | 3.2 | 5.0 | 6.0 | false |
| 3 | 2.0 | 3.0 | 4.8 | 5.8 | false |
| 4 | 2.1 | 3.1 | 4.8 | 5.8 | false |
| 5 | 2.0 | 3.0 | 4.8 | 5.8 | false |

Darren starts within 4 s in 5 of 5. Sofia follows 2.8 s after Darren's use starts (her windup is about 2.8 s after his), so "within about 4 s" is met for Darren and Sofia's start is about 5.8 s after the close. Not a fail in the plan's sense, but worth a look. Lines[0] speaker not recorded: no `ex_fp_kettle_on` line fired inside the 12 s window. In the attack runs the exchange did play, after about 25 s, so it is delayed rather than missing. Open: confirm the exchange's speaker on a run where it plays.

## D. L2 reach with both extras at the kettle

Both extras were `using` at `fp_kettle` at the start and at each target (re-forced when not). Each target: `moveToNear`, then `interact`, then settle.

| Target | Run 1 | Run 2 | Note |
|---|---|---|---|
| kit_table (case) | PASS | FAIL `blocking-ui` on interact | Run 2 had a UI open from the opening chat; re-check alone |
| case_signout_sheet | PASS | PASS | |
| helena_plans | PASS | PASS | |
| incident_file | PASS | PASS | |
| gate_console | PASS | PASS | |
| gate_terminal | PASS | PASS | |
| van_one ("The Van") | PASS | PASS | |
| van_two ("The Second Van") | FAIL `arrived-but-outside-plain-range` | FAIL same | Pair far away (about 170 px), so probably layout, not the extras. No control run |
| minder_post | not in run 1 | PASS | |
| malhotra_post | not in run 1 | FAIL `arrived-but-outside-plain-range` | Same engine hint; no control run |
| director_netherton | PASS | PASS | |

Open: van_two and malhotra_post fail to reach in both runs with the pair at the kettle. Not yet shown whether the extras cause it; a run with the pair away from the kettle would settle that. Netherton and minder: run 1 had minigame-active leftovers, fixed in run 2.

## Files

- `scenarios/m10_full_disclosure/office_life/LIVE_B2A.md` (this file)
- Scratch only (not committed): `b2a.mjs`, `sumA.py`, `newgame.sh` in the session scratchpad.

## Left to do

1. Re-run A (attack) with a valid approach to the table cell and to Netherton and the gate; record the chase distances against the 32 px `chaseRange`.
2. Control run for van_two and malhotra_post with the pair away from the kettle.
3. Re-check kit_table alone.
4. Find the speaker of `ex_fp_kettle_on` on a run where it plays.
5. Explain the 31 caffeine on Sofia after the forced 5 in the attack run.
6. Decide whether a struck extra's kettle use should stop when the other extra is KO'd.
