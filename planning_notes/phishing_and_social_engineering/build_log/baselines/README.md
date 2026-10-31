# Phase 0 baselines (P0-A)

Run on 2026-10-21 at HEAD `1f13ee9125f70ef96d9ea15eb4d875c3480ef743`, Node v18.19.1, from the repo root. The working tree had an uncommitted edit to `docs/agents/FINALE_BRIEF.md` (not mine). No engine change had been made. `git status --porcelain` before: ` M docs/agents/FINALE_BRIEF.md`; after: the same plus the untracked `planning_notes/phishing_and_social_engineering/build_log/`. No tracked file changed. All tools only write to a system temp dir (`reopencheck.mjs` uses `mkdtemp`).

## Commands and results

1. `bundle exec node --test test/js/*.test.mjs` (three times), then each file alone. See `node_suite.md`. 748 pass in every full run; 1 or 2 file-level failures from a structured-clone runner error, in `engine-fixes-pass3` (every run) and `engine-fixes-round4` (first run only). Each file passes alone. Each of the 107 files passes alone (748 tests).
2. `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json` -> `reopencheck.txt`. Exit 0, "Total problems: 0".
3. Route drivers, `node scripts/ink_runtime_check/m0N_routes/route.js scripts/ink_runtime_check/m0N_routes/<route>.json` for every route JSON -> `routes/m0N_<route>.txt`. Exit codes for all in `routes/_exit_codes.txt` (all 0).

   | Mission | Routes | Notes |
   |---|---|---|
   | m02 | 7 | all print `[result] all expectations met` |
   | m03 | 35 | exit 0; this driver prints a `[stats]` line and no `[result]` line, so the output is the baseline, not a verdict |
   | m04 | 40 | all `[result] all expectations met` |
   | m05 | 47 | all `[result] all expectations met` |
   | m06 | 43 | all `[result] all expectations met` |
   | m07 | 39 | all `[result] all expectations met` |
   | m08 | 33 | all `[result] all expectations met` |

   244 route outputs in total; 209 of the 209 non-m03 routes report all expectations met.
4. m01 (no route folder): `node scripts/ink_runtime_check/inkcheck.js scenarios/m01_first_contact/ink/<story>.json` for each of the 7 compiled stories (usage: `<file.json> [knot] [VAR=value ...]`; no knot given, so each ran from the start) -> `routes/m01_inkcheck_<story>.txt`. All 7 exit 0, each `paths=1 clean=1 runaway=0 failing=0`.

## Oddities

- The full Node run's failing file varies (see above). The plan names only `engine-fixes-round4`; `engine-fixes-pass3` fails just as often. R1 comparisons later should treat both as quarantined and re-run any failing file alone.
- The plan said 748 pass and 1 fail; the pass count matches, the fail count was 2 in the first run and 1 in the next two.
- m01 inkcheck without a knot explores only the start path (`paths=1`, `states=0`), so it is a shallow baseline. Later comparisons are only as sensitive as that.
- The word "FAIL" appears in m04 outputs only as the mission title "CRITICAL FAILURE".
- Route output is deterministic text, but I did not run it twice to confirm byte-identical output.
