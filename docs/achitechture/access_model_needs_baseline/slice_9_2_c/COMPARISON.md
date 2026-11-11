# Needs regression, access slice 9.2 (sub-slice C)

Plan 11, point 5. Captured 2026-11-11 with `tools/playtest/needs-baseline-capture.js` on keyless
servers, one capture at a time, with no browser run on either server. Compared with
`tools/playtest/needs-baseline-compare.js`.

- "Before": games 1240 (`test_npc_needs`) and 1244 (`test_needs_leash`), from a separate worktree
  at `6192486b6`, the commit sub-slice C branched from, on port 3023.
- "After": games 1246 and 1249, from `build/9-2-c` at `7e2c4d5ac` (C-1 to C-5), on port 3020. The
  feed fact notebook escaping (`social-feed.js`, `social-intel.js`) was committed while the second
  capture ran; neither scenario has a feed, so it is not reached.

Sub-slice C's needs changes: `_socialCandidate` (the candidate order of plan 8.1, with the phone
after any object), the `self` job (`_startSelfJob`, `_completeSelfJob`, `npc_used_phone`),
`job.socialDesk`, `_deadStation` for a desk station, `isDistracted` and `getState().distracted`;
`seating.js` keeping a phone user seated; `npc-sight-challenge.js` skipping a distracted NPC;
the `social` action icon for `social_media`. Neither scenario has a `social_media` need, a feed,
a policy or a `los.challengeOnSight` NPC (the cooler's `social` need is a different need), so the
planned difference is **none**.

| Scenario | Result |
|---|---|
| `test_npc_needs` | 0 subjects differ |
| `test_needs_leash` | 0 subjects differ |

`test_needs_sims` was not captured for C (the handover named only these two).

Verdict: no difference caused by sub-slice C.
