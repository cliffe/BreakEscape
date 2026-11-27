# m09 office-life build review, round 6 (delta)

Reviewed: `build/ol-m09` at 720b2db19 (R5 fixes in dfbdad0b5). Raw notes compared: the three saved live-readings files from the build run.

**Counts: B=0 M=0 m=3**

R5's major is closed. `BUILD_REPORT.md` now says game 7646 carried every reading except the first L5 dock spawn reading (briefing chat open), which came from 7645, and that 7672 produced no readings. The raw notes agree on every reading checked: L0 to L8, the alpha recording, the extra readings, the debrief timings (+33, +333, +359, +320, +382, +386, +1175, +1276 ms), the frame-time row and all level and volume figures.

Checks:

1. Attribution: every table row matches the raw notes and the game that produced it. No game is misnamed.
2. No new overclaim in dfbdad0b5. The edits narrow claims (the "restore" wording for the HaX chat, "credits cannot be closed", crossing counts). The L3 count "5 crossings" matches the notes' "5 of 5".
3. PLAN.md doorway correction against `public/break_escape/js/core/rooms.js`: `:1460` (north placement uses the connected room's stacking height), `:1555` (south placement uses the current room's), `:3197` to `:3203` (inclusive floor test) all hold. Working through the numbers: restricted_stacks y -512 + 320 = -192 and reading_room's floor starts at -256 + 64 = -192, so no gap exists. The `ambientChoice` record is at `:3304` and the `keep` return at `:3305`.
4. Scenario diff against the merge base is the single line `"roomTone": true,` beside `npcThoughts`. Validator: 0 errors, 31 warnings (as reported). `test/js/room-tone.test.mjs` passes.

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | minor | Two "Notes for the user" claims are not in the saved live notes: Old Coyote's missing challenge, and the identity scene waiting for the flag station to close (the notes say only "after flag 3 typed") | Fixed: first attributed to the run agent's report, second reworded to what the notes record |
| 2 | minor | `BUILD_REPORT.md` "Doorway deviation" said the dock and open_stacks hold the same without saying it was by geometry, not sampled | Fixed: says so |
| 3 | minor | `PLAN.md:115` cited `core/rooms.js:3304` for the keep hold; the `keep` return is `:3305` (`:3304` sets `ambientChoice`) | Fixed: `:3304` to `:3305` |

Loop closed at round 6: no blocker or major open.

Still open, not review matters: the user's listen check of the hum levels (D111a: closet 0.2, cage 0.25, tape room 0.175, salvage cage 0.3, and 0.15 under the three late scenes); the front_desk and staff_passage silence readings (route A, not run); frame-time comparison against the baseline and the open_stacks frame time; the stale engine comments on the null-room hold (`ambient-choice.js:10`, `core/rooms.js:3305`, `office-room-tone.js:133`) for the room-tone owner.
