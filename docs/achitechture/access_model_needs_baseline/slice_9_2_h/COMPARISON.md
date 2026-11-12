# Needs regression, access slice 9.2 (sub-slice H)

Plan 11, point 5. Captured 2026-11-11 with `tools/playtest/needs-baseline-capture.js` on a keyless
server (port 3018). "Before": games 1218 and 1219, with H-1 (server) and H-2 (validator) in and no
client change. "After": games 1224 and 1225, at `553c4b8a6` (H-3 needs and runner, H-4 workstation
layer, sessions and scanner, and the browser run's `cellBeside` fix). One capture at a time, with no
browser run on the server. Compared with `tools/playtest/needs-baseline-compare.js`.

Sub-slice H's needs changes: `setBorrow` and the borrowed PC first in `_useCandidate`, the 60 s
start limit, `npc_sat_at`, `npc_borrowed_session`, `npc_borrow_done`, `npc_borrow_dropped`,
`npc_visit_arrived`, `userOf`, `playerHears`, `getState().borrow`, the verdict with a borrow's routes,
and a visit beside a colleague standing on a side the visitor can reach. Neither scenario has a
borrow, a share or a visit to an NPC, so the planned difference is **none**.

| Scenario | Result |
|---|---|
| `test_npc_needs` | 0 subjects differ |
| `test_needs_leash` | 0 subjects differ |

`test_needs_sims` was not captured for H (the handover named only these two).

Verdict: no difference caused by sub-slice H.
