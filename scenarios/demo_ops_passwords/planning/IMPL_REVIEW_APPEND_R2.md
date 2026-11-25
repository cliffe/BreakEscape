# Implementation review R2: delta of 719fb0fe1 (fix pass after append R1)

**Verdict: clean.** No new fault. Nothing touches what the server sends or access checks beyond the id rename (data only); no "needs Opus" item.

## Re-run
- Validator: 0 errors, 27 warnings; ink "All ink files valid"; lint 1 CHECK (crowded-hub, as before); graph regenerates with no diff (worktree clean).
- `rails test .../demo_ops_passwords_scenario_test.rb` (under flock): 46 runs, 1255 assertions, 0 failures.
- `bin/ops-golden-compare` (outside flock): 45 runs, 0 failures.

## Lunch finding
Closed as a tester error, with evidence in PLAYTEST Harness notes: departures start within seconds of act_midday so a `waitFor npc_left_post` armed after the chat misses them; hunger is a satisfaction scale (100 full, lunch sets 20, eating raises to ~80-98); all four back in 60-90 s (game 240). Matches the task's own measurements. No scenario change was needed or made. The note is accurate and useful.

## Six minors
1. Recap `crack_cached` reworded ("a weak one at once, Jun's with one fact"): true on every route. Closed.
2. "opens" / "would open" wording in `tell_local_refused` and the local recap: closed.
3. Hot-desk work warnings: answered in BUILD_REPORT with a browser observation (about 7 minutes, only Jun and Niamh used the desk) and a stated fallback. Not fixed; acceptable as evidence is thin but honest (one run). Residual: watch for Delphine/Graham at the hot desk.
4. `local_refused` stays told to Ama: reason sound (`pc_signin_failed` carries only pcId, reason `not_permitted`, attemptsLeft; no account or kind). Closed as declined.
5. P15 domain assertion now unconditional (`assert found`, `fetch('domain')`, reading `room.objects`); passes. Closed.
6. Ids renamed to `desk_rounds_record_file` and `desk_rounds_hash` in scenario, test and graph; grep finds no remaining `deskadmin_hash` or `deskadmin_record` outside the R1 report. Closed. The name `deskadmin` itself remains only in its NPC, `account` and `creds`, as planned.

## Borrow timing
PLAYTEST now records measured figures (about 28 s second failure, about 50 s walk, about 60 s hand-over, about 1 minute total). Consistent with the server test's timings. Browser figures taken on trust (not re-run, no servers).

## Minor notes (optional)
- R1 "Not checked" item: Ama's "What's next" still lacks "while Delphine is away" and "sign out first" for P13/P14; unchanged, a guided-demo gap only.
