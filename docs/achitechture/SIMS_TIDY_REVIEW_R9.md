# Sims tidy review, round 9 (delta of bd3a05212, tip 683d0e4b3)

Scope: `public/break_escape/js/systems/npc-behavior.js` and `test/js/npc-local-avoidance.test.mjs` in bd3a05212
(yield hold survives both target choosers, wider player-behind check, `AVOID_YIELD_MAX_STEPS` = 6). Past round 5, so only
cheap minors are to be fixed. Nothing was fixed in this round.

Result: **0 blockers, 0 majors, 1 minor.**

## Findings

- **m1 (test gap), `test/js/npc-local-avoidance.test.mjs` R8 m1 and R8 m3 tests.** Nothing asserts that `yieldCount`
  is carried through a re-target (`npc-behavior.js:1599`) or reset to 0 when the hold expires or the opponent changes
  (`npc-behavior.js:1776`). Failure scenario: someone changes the re-target copy to `yieldCount: 0`; the m1 test still
  passes (it checks `yieldTo`/`yieldUntil`), and the m3 test still passes (a waypoint patrol does not re-target inside
  its 15 s window), so a random patrol could again take six fresh steps after every 3 s re-target. Cheap fix: in the m1
  test set `b._avoid.yieldCount = 4` before the re-target and assert 4 after, then 0 on the next step after expiry.

## Answers to the questions

**Step count reset, and can an NPC stand for good?** The count is reset in exactly three places and each is right.
- New hold (opponent changes, or `time >= yieldUntil`): `npc-behavior.js:1776` sets `yieldCount = 0`.
- Re-target while the hold is live: `_resetAvoidForNewTarget` (1594-1603) copies the count, so a re-target cannot
  earn six fresh steps. An expired hold becomes `_avoid = null`, so the count goes with it.
- Arrival (1364), a seated or in-chat NPC (885, 893), a non-patrol state (1079) and "no blocker ahead" (1691) all set
  `_avoid = null`.

Standing at the cap (1777-1782) resets `since`, so the NPC waits, tries a detour, gives up and stands again. That
repeats only until `yieldUntil` (10 s after the first step; it is never extended). The next step after that starts a
new hold with count 0, so six more steps follow. No path leads to standing for good while a blocker is coming through.
A blocker that is not coming goes down the earlier "standing still" branch (1768), unchanged by this commit. A
non-waypoint NPC (needs job, route) has no stall check, so at the cap it alternates stand and burst of six steps; that
matches main's stand, and the live runs showed every such NPC recovering.

**Wider player check, corridors.** It cannot pin NPCs just because the player is near. `_avoidBackBlocked` (1621-1623)
runs only inside the back-off branch: the NPC is a yielder, meeting a coming NPC head-on, after the 0.6 s wait, a failed
detour and the 2.5 s give-up. The player must then sit within step + 20 px (about 51 to 54 px at the patrol speeds in
the tests) straight behind it, in a 19 px half-lane. The result is `pinned`, so the other NPC yields instead, and the
check is re-run after a wait. A player merely nearby or beside never reaches it. No finding.

**Do the three tests prove the behaviour?**
- R8 m2: yes. It covers the two cases the old reach missed (45 px behind, 16 px off the line) and the two clear cases
  that must still step (90 px behind, 30 px off).
- R8 m3: yes for the cap. It models the queue by pushing the blocker on, asserts the stall check fires inside 15 s, and
  caps the step count at 6. It does not show the count resetting (see m1).
- R8 m1: partly. It proves the hold, pin and step handling and the expiry drop. It does not check the count (m1).
- `node test/js/npc-local-avoidance.test.mjs`: 44 pass, 0 fail.

## Live check (keyless server on :3093, PID 2666598, killed, port closed)

Fresh games from `test_needs_sims` made with new-game.rb (6155, 6156). Command per game:
`DOORWAY_LOG=1 BOARD_ROUTE=direct node tools/playtest/needs-tour-regression.mjs <game> 3093 <out>`.

| Game | Row 1 | Row 3 | Row 5 | Row 6 | Head-on stalls (8 s or more) | Doorway stuck lines | Page errors |
|---|---|---|---|---|---|---|---|
| 6155 | ok | ok | ok | ok | none | none | 0 |
| 6156 | ok | ok | ok | ok | none | none | 0 |

Neither game produced the kitchen-doorway stuck lines seen in R8's game 6152, so there was nothing to recover from.
That is consistent with R8's finding that those lines come from the returning-staff pile-up against marek and also
occur without the R8 fixes. Two clean games do not prove it is gone. No doorway stuck line is graded as a finding.

Raw output: `scratchpad/r9/tour-6155*`, `scratchpad/r9/tour-6156*`.

## R9 Outcomes

The one finding (m1, yield count carry and reset untested) is closed by tests only; the engine code is unchanged.

**New assertions in `test/js/npc-local-avoidance.test.mjs`** (46 pass, 0 fail, up from 44):
- R8 m1 test: `yieldCount` is set to 4 before the re-target and is still 4 after it.
- New test, hold expiry: with the count at 4 and the hold run out, the next step starts a new hold with a count of 1
  (reset to 0, then the step is counted), not 5.
- New test, change of opponent: with the count at 4 and the hold still running, a different NPC in the way gives
  `yieldTo` of the new id and a count of 1.

**Mutation checks** (each reverted with `git checkout -- public/break_escape/js/systems/npc-behavior.js`; `git diff --stat`
then showed that file unchanged):

| Mutation | Result |
|---|---|
| Re-target copy at :1599 changed to `yieldCount: 0` | 1 failure: the R8 m1 test (45 pass, 1 fail) |
| Reset removed at :1776 (`a.yieldCount = 0;` deleted) | 2 failures: both new reset tests (44 pass, 2 fail) |

**Suites** after merging main (`b2fdbd4f8`, no conflicts; main only changed `tools/wt-clean.sh`):
- `bin/test-js`: Files: 712 passed, 0 failed, 712 total.
- Rails (`bin/rails test`): 2940 runs, 48173 assertions, 0 failures, 0 errors, 3 skips.
