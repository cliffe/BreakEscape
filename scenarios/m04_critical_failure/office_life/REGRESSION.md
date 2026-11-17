# m04 office life: regression suites

Build: branch `build/ol-m04`, HEAD `11e562a0f` when run. Base for comparison: `6988a0d12` (the merge the branch was built on).

## 1. Ink route suite (`scripts/ink_runtime_check/m04_routes/`)

Command, once per route file (40 files, `r1` to `r40`):

    node scripts/ink_runtime_check/m04_routes/route.js scripts/ink_runtime_check/m04_routes/<route>.json

A route passes when it exits 0 and prints `all expectations met`.

| Run | Pass | Fail |
|---|---|---|
| Build | 27 | 13 |
| Base `6988a0d12` | 27 | 13 |

Failing routes (same set on build and base): r1, r2, r3, r4, r5, r6, r9, r10, r12, r17, r23, r28, r32.

Comparison of the `[FAIL]` lines, build against base:

- Every failure line matches the base except one. r5 on the build also fails `said: "ALL ELEVEN"`. This is the credits line, which office life changed on purpose to `ALL THIRTEEN ON SITE WALKED OUT` (`scenario.json.erb:243`, recorded in `office_life/DIALOGUE_SAMPLE.md`). The route still expects the old wording, so the assertion is stale. The route file has not been edited, per the brief.
- No route fails on the build that passes on the base, apart from that stale assertion.
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

None that are not already on the base. The only build-specific difference is the stale r5 `ALL ELEVEN` expectation described above.
