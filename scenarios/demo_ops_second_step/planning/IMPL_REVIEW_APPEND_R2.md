# demo_ops_second_step: append review, round 2 (delta of 761f5e86e)

**Verdict: clean.** F1 to F4 and the playtest items are closed with evidence. No new faults. Nothing touches what the server sends or access checks, so nothing needs Opus.

## Gates re-run

- Validator: 0 errors, 35 warnings (the expected 35). Graph regenerated with no diff.
- `scripts/compile-ink.sh demo_ops_second_step`: 9 compiled, 0 failed.
- Scenario test, under the tests lock: 36 runs, 706 assertions, 0 failures, 0 errors, 0 skips.
- `bin/ops-golden-compare` not run (no change to what the server sends).

## Closed

- **F1.** The board runs Morning, Midday, Afternoon, Late, Evening, and the Evening line ends "Do this last: staff go home". Aim orders are 2 (afternoon_helpdesk), 3 (late_locks), 4 (evening), with the array order unchanged, so the test's last-in-array assertion still passes. The `lever_day_end` knot in `ama_owusu.ink` now refuses with a plain line unless `skip_late` or all seven afternoon and late globals (all declared as synced VARs) are done. "Skip them and call it a day anyway." sets `skip_late` and re-enters the knot. "Not yet." returns to `hub.choices`. The knot compiles and the paths are consistent.
- **F2.** `darren_drawer` is at (3.9, 4.0). `side_table` and `gwen_phone` are at (9.0, 4.3) and (9.0, 3.9), clear of the coffee socket. The warnings fell to 35. The side-table/phone pair is kept, with its reason in BUILD_REPORT.
- **F3.** Ama's M14 hint now names "the facilities notice in the kitchen". Her M15 hint now says not to approve on Gwen's phone. Thandiwe's two verdict lines are true for either kind of grant, and the ticks are unchanged. VOICED_LINES is updated.
- **F4.** PLAYTEST's aim count and order are corrected. Run D now says to play Run A through M2 and M3 first. The advisory about never asking an approval reset for `dprice` is added. The harness notes are added too.

## Notes (no change asked for)

- The day-end refusal has no test, because it lives in ink and the scenario test is server-side. Haiku Run E should press "Call it a day." early and confirm both the refusal and the skip.
- Thandiwe's two verdict lines are now identical. That is harmless.
- The audio for the changed lines needs a top-up (BUILD_REPORT says so).
- Positions are still unrendered, and the Run E timings are still unmeasured, as in R1.
