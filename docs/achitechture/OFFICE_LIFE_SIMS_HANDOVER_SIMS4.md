# SIMS-4 handover (the staff-room pair)

Branch `build/ol-sims-2` (worktree `p-ol-sims2`). Port 3094. Scratch `officelife-sims/s4/`.

## Status: NOT DONE. Proof runs IN FLIGHT as of 2026-11-14 (session p-train36-live)

The proof-tool gaps are fixed and committed; the full count/schedule/speechlock/office-beats runs
were launched but a forced early handback stopped this session before they finished. The runs are
detached (`nohup`) and keep writing reports to disk after the session ends.

**Fixed and committed this session (proof tool only, 0 engine lines):**
- `9708d5f1c` capture bare `npc_sat` (seating.js emits `npc_sat` with no `:id`; the regex required a
  colon, which is why `npc_sat` was missed); add the `speechlock` beat (step-7 `_pickBark`/`_speak`
  wrap).
- `0cb03402d` speechlock beat also records the office-beats-with-doors-open regression (Neil
  stillness, cooler-pair chat, office task ticks).
- `fa60ad970` every beat records step-5 returns/sits, all-object use starts, a setup-failure flag.
- `d2093cdb2` setup-failure scoped to staff-room break starts only (office NPC uses are not pair
  breaks).
- `60e0f3b3b` `npc()` helper tolerates an NPC with only some needs (Neil has caffeine, no thirst).

**Regressions re-run green this session:** standard node set (25 files) PASS; `npc-needs-sims-validator`
PASS; validator 0 errors / 34 known warnings; Ruby format corpus 8a/8b/8c (21 runs) PASS.

**Harness validated live:** first_visit 2/2 PASS (games 4368, 4370): pair did not stand within 1.5 s,
both used the boiler, `exchange_waiting` 5/5 overheard, both `npc_returned_post`, `npc_sat`=5, E7=0.

**IN FLIGHT at handback (collect from disk, then aggregate + update docs):**
- Driver `s4/finish/driver.sh` (detached): 5 first_visit, 5 job_beat, 10 boiler_cross, 10
  cooler_cross, each a fresh `new-game.rb` game; `s4/finish/manifest.csv` logs `beat,run,gid,rc`;
  reports at `s4/report-sr-<beat>-<gid>.json`. ~2/30 done at handback.
- Schedule 20 min: game 4360, `node tools/playtest/needs-sims-staff-room.mjs 4360 3094 schedule
  s4/finish/ 20` -> `s4/finish/report-sr-schedule-4360.json`.
- Speechlock/office-beats 15 min: game 4369 -> `s4/finish/report-sr-speechlock-4369.json`.

**To finish (resumed session):** wait for `s4/finish/manifest.csv` to reach 30 rows and both long
reports to exist, then `python3 s4/finish/aggregate.py` for steps 1-5 pass counts, overlaps,
returns/sits and setup failures; read the schedule report (`schedule.use_starts` vs README computed
times, within 15 s) and the speechlock report (`blocked_by_unheard_staff_line / office_turns`,
`threshold_1_in_20`, and `office_regression`). Re-run any run flagged `setup_failure_diff_object_within_5s`.
Then update README SIMS-4 live-proof rows + build-log SIMS-4 section, mark this handover done, commit
explicit paths. **The 3094 server (PID file `tmp/pids/server-3094.pid`) and the detached node/chrome
runs are still up at handback — stop them by PID once the reports are collected (other sessions use
3093/3095; never pkill -f).**

## (Original handover below)

## Done

- Full scenario data (plan 5.4): staff room off IT east, `staff_boiler`/`staff_cooler`/
  `staff_microwave`/`job_board` claiming the drawn `room_hospital_staff` decor; Keith and Jodie on
  tile homes beside the two static seats; couplings on the use start; first-visit, Neil-close and
  private-office break starts; the hand-written cooler cell (`useFrom` dx -1); three gated exchanges
  on Jodie's list; `roomToneTypes` kitchen; globals; aim `watch_the_staff_room`.
- Ink: `keith.ink` (hub, 5 choices), `jodie.ink` (hub + the "did the light get sorted" choice
  setting `job_cleared`, and the three exchange knots), `neil.ink` (new flickering-light choice
  setting `job_called`). All compiled.
- `validator-office-presets.test.mjs` preset list updated.
- Step 1 render + cell checks (`tools/playtest/sims4-step1.mjs`, game 4340): all pass.
- Validator 0 errors. Standard node set (25 files) + Ruby corpus (8a/8b/8c) pass. Door alignment OK.
- Live beats run once each and PASS: first_visit (4345), job_beat (4346), cooler_cross (4347).
  E7 observed, E8 worked around, E9 not triggered, HUD no interference. See README SIMS-4 table.
- Commits: `5c1447beb` (build), plus the docs commit that carries this handover.

## Open / not yet run this session

Everything below is proving work, not building; the build is complete and committed.

1. **Full step-1 counts** (plan 5.4 steps 1-5): 5 fresh first-visit games, 5 job-beat games
   (each >2 min after the first visit), 10 boiler crossings and 10 cooler crossings (each >2 min
   after the last start), recording the overlap at each object (~27 s boiler, ~22 s cooler) and
   `npc_returned_post`/`npc_sat` after each. The proof tool supports `first_visit`, `job_beat`,
   `boiler_cross`, `cooler_cross` beats; just run them N times on fresh games from `new-game.rb`.
   A run where two starts on different partners fire within 5 s is a setup failure, re-run.
2. **Step 6, the 20-minute schedule run** (`needs-sims-staff-room.mjs <gid> 3094 schedule 20`):
   open the door, walk in once, stay 20 min without leaving; assert every break start lands within
   15 s of the computed time (Keith second boiler ~4:30-6:30, microwave at 8:00, Jodie first cooler
   ~10:00, then alternating ~4 min). This is ~20 min wall-clock (needs clock == real clock here).
3. **Step 7 / the speech-lock regression** (plan 5.4 Regressions): over 15 min of office play with
   the IT and staff-room doors open, count office `_pickBark` calls that return a picture or `wait`
   while `_speechUntil` is held by a staff-room line whose `overheard` is false. If > 1 in 20 office
   chat turns, raise the speech-lock engine item for the owner. Needs a `_pickBark` wrap (plan 5.5
   style) added to the proof.
4. **The standard live set** (plan 5.4): test_needs_leash (leashed/unleashed), lab_physical_pentest
   (three beats), test_access_work, the README office beats with every door open (compare outcomes
   and task ticks, not log bytes), and Neil's stillness check in the same game.
5. **`npc_sat` was not captured** by the event wrapper (returned_post was). Seating may pose the
   NPC without an eventDispatcher event, or use a name my regex missed. Step 1's render and the
   screenshots show both seated; confirm the event name if step 5 needs `npc_sat` explicitly.

## Gotchas

- `npc_use_started` is emitted via `world.emit` (direct), not `sys._emit`; both funnel through
  `window.eventDispatcher.emit`, which is what the proof wraps. Do not wrap `sys._emit` alone.
- Exchanges only **start** when the player is in earshot (`_audience` gate). The proof must
  `standNear('staff_boiler'/'staff_cooler')` after entering, or the pair spend pool lines unheard
  (E7) and the exchange waits. That is correct behaviour, not a failure.
- For the cooler crossing, the staff room must be loaded first (Jodie registered) or the
  `room_entered:manager_office` mapping does nothing (intended; the beat pre-loads staff_room).
- Jodie uses `female_telecom_v2` with headshot only; person-chat falls back
  `female_telecom_v2_talk.png` -> `female_telecom_talk.png` (exists). Visemes are the known art
  request (plan 6.4). The validator warning on her talk sprite is expected.
- The `room_entered:manager_office` mapping draws a validator relay warning; the plan accepts it
  (the mapping only exists once staff_room is loaded, which is the condition for the effect to
  matter). Not an error.

## Files

- `scenarios/test_needs_sims/scenario.json.erb`, `ink/{keith,jodie,neil}.{ink,json}`,
  `dungeon_graph.*`, `README.md`.
- `test/js/validator-office-presets.test.mjs`.
- `tools/playtest/sims4-step1.mjs`, `tools/playtest/needs-sims-staff-room.mjs`.
- `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_LOG.md` (SIMS-4 section).
- Expect a merge with the other worktree's SIMS-3 review fixes to `neil.ink`/README on
  `build/ol-sims`; the only `neil.ink` change here is the one new flickering-light choice.
