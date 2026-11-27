# CA engine review: E5 flip line by global, round 3 (delta)

Delta: `4b0266095` (on top of `0ddd83e04`). Round 2: `CA_ENGINE_REVIEW_E5_R2.md`.
Spec: `CA_PILOT_MECHANICS_PLAN.md` E5 (`:140-144`), ca12 strings (`:159-168`), Lorna/Delphine mappings (`:185-201`).
Reviewer: Sonnet 5.5, 2026-11-25. Code not edited.

**Totals: 0 B, 0 M, 1 m** (m2 from R2 stays deferred to the ca12 shell build: `flipMissed` text).

Tests: `node --test` on social-episode-views, social-episode-runner, social-awareness-fragment-erb-parity: 111 pass, 0 fail.

## R2 findings

| R2 | Status | Where |
|---|---|---|
| m1 timeout entry caught `got_it` + cap | Fixed | Plan `:142` and `:168` now key entry 6 on `ca12_runner_go` (Lorna mapping 2, set only on `walked_away`). A `got_it` cap run sets none of `ca12_desk_pass`, `ca12_door_missed`, `ca12_challenged`, `ca12_runner_go`, so `globalEntry` returns null and the call path falls to `flipDefenderLine`. |
| m2 `flipMissed` dead copy | Deferred (shell build) | `scenario.json.erb:634` still describes Delphine stopping the learner; rewrite when the shell lands. |
| m3 landed class dropped | Fixed in code | `flip-view.js:371` adds `aw-landed-no-tells` to the `aw-defender-line` paragraph when `landed`. Not asserted (see m1 below). |

## ca12 endings, traced to the line shown

Missed-path = `renderFlipView` `missed` branch (`flip-view.js:364-376`); call path = `defenderLine` (`:113`).

| Ending | Path | Globals | First match | Line / heading shown |
|---|---|---|---|---|
| `got_it`, hi-vis, walks in | call | `ca12_desk_pass`, `ca12_world_done` | 2 | "The desk said yes on the phone, then opened the door for you..." / `flipHeading` |
| `got_it`, no vest, turned back | call | `ca12_challenged`, `ca12_world_done` | 5 | "Yusuf stopped you at the door..." / `flipHeading` |
| `got_it`, hi-vis, stands still (door missed) | call | `ca12_door_missed`, `ca12_world_done` | 3 | "The desk said yes and held the door, but you didn't go through..." / `flipHeading` |
| `got_it` + 75 s cap, nobody through | call | `ca12_world_done` only | none | neutral `flipDefenderLine` (rewritten neutral at shell build) / `flipHeading` |
| `walked_away`, tailgate | missed | `ca12_runner_go`, `ca12_tailgated`, `ca12_world_done` | 1 (before 6) | "You walked in behind a member of staff..." / entry 1 heading |
| `walked_away`, challenged at door | missed | `ca12_runner_go`, `ca12_challenged`, `ca12_world_done` | 5 (before 6) | "Yusuf stopped you at the door..." / `flipMissedHeading` |
| `walked_away`, timeout | missed | `ca12_runner_go`, `ca12_world_done` | 6 | "You never got past the lobby. The desk and the door both held this time." / `flipMissedHeading` |
| `reported` (guard alerted) | missed | `ca12_guard_alerted`, `ca12_challenged`, `ca12_world_done` | 4 (before 5) | "The desk didn't buy it and called security..." / entry 4 heading |

`reported` never sets `ca12_runner_go` (mapping 3 is separate), so it cannot reach entry 6. Mapping 4 excludes `got_it`, so `ca12_tailgated` never appears on a call flip. No regression: the delta is one class-name expression in `flip-view.js` and plan text; other shells carry no `flipDefenderLineByGlobal`.

## Minors

**m1. The landed-no-tells class on a ByGlobal line has no assertion, and the test fixture still keys the timeout on `ca12_world_done`.**
`test/js/social-episode-views.test.mjs:732` (timeout entry on `ca12_world_done`, now contradicting plan `:168`) and `:737-740` (the landed case checks only `.line`, not the `aw-landed-no-tells` class that `flip-view.js:371` now adds). Reverting the m3 fix leaves the suite green.
*Fix:* in that test, rename the last entry's global to `ca12_runner_go` (and add a case where `ca12_world_done` alone matches nothing), and assert the landed paragraph has `.aw-defender-line.aw-landed-no-tells` while the missed one lacks `aw-landed-no-tells`.
