# NPC icons wiring, code review round 2

Branch `build/icons-wiring`, head 13ef9f28b, reviewed as `git diff 6192486b6..HEAD`, above all the round 1 fix commit 13ef9f28b.

What I ran:

- `bin/test-js` on the changed test files and every test file that imports or names the touched modules (29 files: `npc-workaround-barrier-icons`, `npc-needs*`, `npc-pressing-needs`, `npc-workarounds`, `npc-queues`, `npc-magnet`, `npc-desk-phone`, `seating`, `workstation-state`, `npc-social-pairing` and the rest), then the access, workaround, lab and validator files (31 files). All 60 pass.
- Mutations of a scratch copy of `npc-needs.js` against the new test file: removing the hold, removing the workaround half of `_iconShowing`, removing the `_startJob` clear, removing the `_borrowDone` call, and removing `said +` from each of the two timers. Every mutation fails at least one test, so each new test fails without its fix.
- A probe on `fixtures/needs-work-world.mjs` run against the pre-fix code (3ebd260cd) and head, printing the drawn icon and the decision log tick by tick: printer jammed with caffeine going urgent just after the failure, and printer jammed then fixed 9 s in.
- The live screenshot `iw-r1/1248-barrier-crop.png`: the barrier over a standing NPC beside its desk, no speech bubble, sharp at 16x16.

## Blocker

None.

## Major

None.

## Minor

### m1. The barrier and the check walk outlive an outage that ends during the hold

`public/break_escape/js/systems/npc-needs.js:2263` holds a queued check visit while `failedShow` runs, but nothing ends the hold or drops the visit when the resource comes back. Before the fix the visit started at once, so the barrier was hidden and the walk was already under way; now the outage can clear while the NPC stands at its desk under a solid barrier.

Failure scenario (probe, printer jammed, `printer_jammed` set false at 9 s): the failure at 5.5 s, the line until 9.5 s, `failure_woken` and `unparked` at 9 to 10 s, yet the barrier stays solid until 13.5 s (while `causeCleared` is already true, so the frustration icon would be fading), and then the NPC walks to the printer to "check" a printer that works. A player who fixed the printer is shown the opposite of what they did for 4 s, then a pointless trip.

Fix: in `_startVisit`, drop a `check` visit whose `data.resourceId` is no longer down (the plan resource's `downIf` no longer holds) with `s.checked.delete(id)` and a `visit_dropped` log, and clear `s.failedShow` once every `failedShow.missing` cause passes (the same test `_causeCleared` uses per need). Add a test: jam, fail, clear the global during the line, assert `failed` is null and no `visiting` follows.

### m2. Round 1 m4 is half done, with no note

The fix clears `workaroundShow` in `_startJob` (`npc-needs.js:2566`) but not the icon part of `failedShow`, and an emit that fires while the NPC already has a job still sets `workaroundShow`, which then shows after that job ends. The commit and the plan say nothing of the barrier half.

Failure scenario: a counted failure on the share (no object, so no check visit and no hold), then an urgent coffee use of 2 s starts during the line; it ends inside the 4 s window and the barrier pops back for a moment over an NPC that has just had a coffee. Same for the arrow when the runner's `emit` lands mid-job.

Fix: clear the icon part of `failedShow` in `_startJob` (keep `failCause`, which q17 needs), and in `showWorkaround` do nothing visible while `s.job` is set (or start the 4 s at the job's end). Or accept both and say so in plan 5.5 next to "A new job clears it".

## Nit

- n1. `README_scenario_design.md:1033`: inserting the check-visit clause moved the appositive: "shows `barrier`; a check visit to the down resource waits until it has shown, a plain striped barrier." now describes the check visit as a striped barrier. Fix: "shows `barrier`, a plain striped barrier; a check visit to the down resource waits until it has shown."
- n2. `npc-needs.js:2263`: "only NPCs whose uses are judged" holds, but only because a `check` visit is queued solely by `_countFailure` from a plan resource with an `object`, and `failedShow`/`workaroundShow` are set only by `_countFailure`, the workaround runner and `_borrowDone`. `enqueueVisit` is public and takes any `kind`. One future caller enqueueing `kind: 'check'` for an office-life NPC gets the hold. Fix: say so in the comment, or guard with `this._judged(s, 'work')`.
- n3. `test/js/npc-workaround-barrier-icons.test.mjs:158`: `LONG` is 58 characters; scenario lines must stay under 40. A 39-character line gives the same 4000 ms bubble (`CHAT_MAX_MS`), so the test would model a real authored line. Fix: "The share is down again, and it's late." or similar, with the comment changed to "30 to 39 characters".
- n4. Round 1 n2 and n3 (`tools/npc_icon_cleanup.py:477` says 20 shades where 29 were recoloured; the "pixels changed" count includes transparent pixels) are neither fixed nor answered. Both are harmless; fix or note them as declined.
- n5. Seats are not covered by any test: with the hold the NPC turns back to its desk (mode `idle` in the probe), may sit, then gets up for the check about 4 s later, where before it went straight from the failed use to the printer. The stub world cannot show seating. Worth one look in the next live run with a seated `test_access_work` NPC; if it sits and stands within 4 s, keep it standing (for example, `stayPut` until the hold ends).

## Probes of the hold (M1 fix)

- Urgent need behind it: caffeine urgent one tick after the failure starts at tick 88 at head against 57 before (7.75 s later: the line plus 4 s). The hold is at most `MUTTER_BUBBLE_MS + FAIL_SHOW_MS` (10 s); the urgent need already waited behind the whole check visit before the fix, so this adds at most 10 s. No starvation threshold is that short (`maxUnmetMin` is in minutes).
- Leash: an unreachable or forbidden check target is decided after the hold (`_visitPlace`); during the hold nothing is selected, afterwards the old one-second retry and the 60 s drop apply as before. No new stall.
- Borrow: a `borrow_session` handed over during the hold starts through the selector, so it waits too; `BORROW_START_MS` is 60 s, well clear of 10 s plus a visit.
- Door hold, desk phone, frozen in chat, script suspension: all return earlier in `_tickNpc` (`npc-needs.js:1228-1325`) and are untouched; a ringing phone is answered by the ring tick, not the selector.
- Many failures in a row: a failure needs a job and the hold starts none, so `failedShow` cannot be renewed during it; later failures on a resource already in `s.checked` queue no visit and get no hold. An `emit` during the hold replaces the barrier with the arrow (q21 order) and extends the hold by its own window; the runner does not emit in a loop, and the 60 s check drop bounds it anyway.
- Reload mid-hold: `failedShow`, `workaroundShow` and `visits` are all transient, so a reload clears the hold and the queued check together; nothing sticks (the check is lost, as before the fix).
- Determinism and the decision log: no randomness was added; the hold is a pure function of the needs clock. Decisions shift by a fixed amount in the one scenario with a plan resource that has an object (`test_access_work`, the printer). `lab_physical_pentest`, `test_seating`, `test_needs_sims`, `test_npc_needs` and the leash scenarios have no work plan, so no check visit, no `failedShow`, no `workaroundShow`: their decision logs cannot change. The only new log entry is `workaround_shown` after a borrow, also 9.2 only. No test pins a `test_access_work` decision trace.

## Round 1 findings

| R1 | State | Evidence |
|---|---|---|
| M1 | Fixed | Hold at `npc-needs.js:2263`; probe shows line, 4 s barrier, then the check. Tests "the first failure on a down printer..." and "a queued check visit also waits out an emit's workaround icon" fail with the hold removed. |
| M2 | Fixed | Two tests with a 4 s line; each fails with its `said +` removed. |
| m1 | Fixed | `_borrowDone` calls `showWorkaround`; test fails without it. |
| m2 | Fixed | README lists the barrier-picture topics and "a failed work use"; see n1 for the sentence order. |
| m3 | Fixed | `NPC_NEEDS_SYSTEM.md` gives the lookup order with the `workaround` exception; matches `pickIconEntry`. |
| m4 | Half | Workaround cleared on a new job (tested); barrier half and mid-job emit open (m2 above). |
| n1 | Fixed | JSDoc updated. |
| n2, n3 | Open | No change, no note (n4 above). |
| n4 | Fixed | Asserts `job === null` and the drawn key. |

Docs: `README_scenario_design.md`, `NPC_NEEDS_SYSTEM.md` and plan 5.5 match the code on the hold, the clear on a new job, the borrow after-show and the lookup order, apart from n1.

## Verdict

Ready to merge once m1 is fixed or accepted with a note; m1 is the only case where the hold makes something visibly worse than before (a barrier and a check after the player has fixed the outage). m2 and the nits can follow.
