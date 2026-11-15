# SIMS-4 R1 fix handover

Worktree `/home/cliffe/.../.claude/worktrees/p-ol-sims`, branch `build/ol-sims`. Keyless server on
:3094 (stopped by its PID file). Scratch `officelife-sims/s4-r1fix/`.

## Done (committed)

- Commits: `65b7cc43d` (ink exits, lighting flicker, node tests, proof-tool B1/m2/m4 rewrite, docs),
  `933661ca5` (sims4-step1 async path search + jitter), plus a docs-truth follow-up (this handover).
- **M1**: keith.ink / jodie.ink exits now copy Neil (farewell, `# exit_conversation`, `-> END`).
  Recompiled keith.json / jodie.json with inklecate.
- **M2**: six engine cases in `test/js/npc-needs.test.mjs` and four static cases in
  `test/js/npc-needs-sims-validator.test.mjs`. All green.
- **M3**: `staff_room` lighting block `{ flicker: true, variants: [{ condition:
  "globalVars.job_cleared === true", flicker: false }] }`. Verified live on game 4480 (faulty panel
  dips to 0.55 flickering, holds 1.0 after job_cleared, variant drops the faulty panel). Screenshots
  `sr-lighting-{lit,flicker,cleared}-4480.png`.
- **m1**: jodie.ink `~ job_cleared = true` in the clearance choice; choice also gated on new VAR
  `heard_exchange_job_called`; the "someone'll be up soon" line moved from Jodie to Keith. Judgement
  recorded in the build log.
- **m3**: `sims4-step1.mjs` runs a real `findWorldPath` from both homes to the boiler's and cooler's
  second-user cells (all reachable, game 4473) and logs jitter at registration.
- **m5**: README cooler-cell wording (`dx -1, dy 1.5` vs `dx 0, dy 1`); Jodie's
  `room_entered:manager_office` mapping gains `fireOnlyWhenLoaded: true` (validator 34 -> 33 warnings).
- **Server m1/m2**: plan 5.4 Sync and README reload note reworded (heard markers persist on the next
  sync; firstVisit is per-load). Docs only.
- **B1 tool rewrite + one verified run (game 4474)**: `needs-sims-staff-room.mjs` `job_beat` and
  `boiler_cross` now enter the staff room first, settle (`settleStaff`, both home + >120 s since the
  last staff start), then do the Neil close and assert `start_from_neil_close` and no first-visit in
  the window; `cooler_cross` settles before the private-office crossing (m4 spacing); the capture now
  records `conversation_closed`; the speech-lock beat opens the kitchen and lounge doors (m2).

## Open (NOT done) - the forced handback cut these off

Only one job beat (4474) ran live before a forced handback stopped the batch. Remaining full counts:

- 4 more job beats, 10 boiler crossings, 10 cooler crossings, each a fresh `new-game.rb` game.
- The doors-open speech-lock beat, >=15 min, >=20 office turns, record the ratio (m2).
- Then fill in the real counts and game ids in the README SIMS-4 live-proof table (delete the old
  4368-4428 rows per B1, keep the one-sentence "why rerun" note) and the build-log B1 line.

### How to finish

1. Start the server from the worktree root (per the brief), wait for :3094 to answer.
2. Run the batch driver (fresh game per run, logs game ids):
   `bash <scratchpad>/s4_driver.sh job_beat 5`
   `bash <scratchpad>/s4_driver.sh boiler_cross 10`
   `bash <scratchpad>/s4_driver.sh cooler_cross 10`
   `bash <scratchpad>/s4_driver.sh speechlock 1 16`
   (Two at once is allowed. Each beat run takes ~2.5-3 min because of the >120 s settle.)
3. Aggregate: `python3 <scratchpad>/s4_aggregate.py` prints per-run pass fields and games.
   Pass gates: job_beat `start_from_neil_close` && `no_firstvisit_in_window` && exchange heard;
   boiler/cooler `start_from_*` && pair && a line heard, no setup failure.
4. Update README table + build-log counts with the real game ids; commit explicit paths.

## Gotchas

- `s4_driver.sh` and `s4_aggregate.py` and `sims4-lighting.mjs` live in the session scratchpad
  `.../4ecd98f2-.../scratchpad/` (not committed; copy into `tools/playtest` if you want them tracked).
- `findWorldPath` callback fires a tick later: kick searches off, `calculate()`, wait ~1.5 s, read.
- Jitter must be snapshotted at registration (before the first-visit mapping sets caffeine at +2 s).
- Don't touch :3093/:3095 or games below 4457; never :3000; never db:* tasks.
- Validator 0 errors / 33 warnings; `bin/test-js` green on npc-needs*, validator-office-presets,
  npc-behavior-arrival.
