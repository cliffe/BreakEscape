# m04 office life: regression suites

Build: branch `build/ol-m04`, HEAD `fa76d47f9` when re-run (the earlier run was at `11e562a0f`). Base for comparison: `6988a0d12` (the merge the branch was built on).

## 1. Ink route suite (`scripts/ink_runtime_check/m04_routes/`)

Command, once per route file (42 files on the build, `r1` to `r42`; 40 on the base, `r1` to `r40`):

    node scripts/ink_runtime_check/m04_routes/route.js scripts/ink_runtime_check/m04_routes/<route>.json

A route passes when it exits 0 and prints `all expectations met`.

| Run | Files | Pass | Fail |
|---|---|---|---|
| Build `fa76d47f9` | 42 | 29 | 13 |
| Base `6988a0d12` | 40 | 27 | 13 |

The build's extra two files are r41 and r42 (newcomer KO to debrief and credits). Both pass. They do not exist on the base, so the base column has no result for them.

Failing routes (same set on build and base): r1, r2, r3, r4, r5, r6, r9, r10, r12, r17, r23, r28, r32.

Comparison of the `[FAIL]` lines, build against base:

- No difference. For all 13 failing routes the `[FAIL]` lines are identical on build and base.
- r5 passes its credits line on the build (`said: "ALL THIRTEEN"`, expected by the route), and passes `said: "ALL ELEVEN"` on the base. Neither run prints a `[FAIL]` line for it, so the intended wording change is not a difference in the failure set.
- r6 passes its `notSaid` on `ALL THIRTEEN` on the build, and its `notSaid` on `ALL ELEVEN` on the base.
- r9 fails on both with `[result] 1 FAIL(s)` and no `[FAIL]` line. The line comparison cannot see it, and it is identical on both. It was not investigated.
- The 13 failing routes were not investigated further. They fail identically on the base commit, so they are not caused by office life.

## 2. Phone reopen check

Command:

    node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json m04_critical_failure

Result: 0 problems. `m04_phone_agent0x99` gave 1084 reopens (879 re-runs). `m04_phone_robert_vance` gave 1800 reopens (893 re-runs).

The `m04_critical_failure` block in `missions.json` was used as committed. It was not regenerated from the current `globalVariables`, so any globals added by office life are not covered by this check.

## 3. JS test suite

Command (run in the background, 15 minute timeout):

    timeout 900 bin/test-js

Result: 760 files passed, 0 failed, 760 total. Exit 0. The run finished inside the timeout. There were no failures, so no base comparison was needed.

## 4. New failures on the build

None that are not already on the base. The `ALL ELEVEN` difference described above is fixed in the route files.

## 5. Routes added after the run

`r41_joanne_ko_debrief_credits.json` and `r42_ibrahim_ko_debrief_credits.json` (build review R2 m7): a newcomer KO taken to the debrief and the credits. Both pass (`all expectations met`): the debrief head-count takes the KO branch (`m04_closing_debrief.ink:436`), the credits carry "not all of them on their own feet" (`scenario.json.erb:244`) and "OFFICE STAFF: hurt, and that's on you" (`:250`), and "ALL THIRTEEN" is absent.
