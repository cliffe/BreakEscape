# Needs regression, access slice 9.2 (sub-slice L)

Plan 11, point 5. Captured 2026-11-11 with `tools/playtest/needs-baseline-capture.js` on a keyless
server (port 3019). "Before": games 1235 and 1236, with the three client files L changes
(`npc-needs.js`, `npc-reports.js`, `workstation-state.js`) put back to their state at `6192486b6`
(the branch point) for the capture, and L's server and validator commits in (neither scenario has a
work plan, so the server change cannot reach them). "After": games 1239 and 1242, at `683e7c080`
(L-1 client). Compared with `tools/playtest/needs-baseline-compare.js`.

Sub-slice L's needs changes: the station flag `lockedOut` and the checks in flight `lockCheck` on
each NPC's state (kept through `reset()`, restored from `npcFrustration.lockedOut`), a judged use at
its own station held while a check is in flight (at most `LOCK_CHECK_WAIT_MS`), `locked_out` added
first to a failed verdict at a flagged station, `npc_locked_out`, `getState()` gaining `lockedOut`
and `lockCheck`, and the workstation layer locking a flagged owner's screen on every leave. Neither
scenario has a work plan, a sign-in PC under `maxAttempts` or a lockout, so no check is ever sent
and nothing is flagged: the planned difference is **none**.

| Scenario | Result |
|---|---|
| `test_npc_needs` | 0 subjects differ |
| `test_needs_leash` | 0 subjects differ |

The `test_needs_leash` after capture overlapped the start of the L browser run (game 1241) on the
same server; each runs in its own browser and game, and the comparison is clean.
`test_needs_sims` was not captured for L (the brief named only these two).

Verdict: no difference caused by sub-slice L.
