# Access model slice 9.2, sub-slices U and A: code review round 2 (client)

Scope: the client half of `git diff claude/break-escape-access-design-090sjx build/9-2-u-a`
(`public/break_escape/js/**`, `test/js/**`, `scenarios/test_access_work`), read against
`ACCESS_MODEL_SLICE_9_2_PLAN.md` sections 5 and 7, with the "Review round 1 outcomes" section of
`ACCESS_MODEL_SLICE_9_2_BUILD_LOG.md` checked claim by claim. The Ruby server is reviewed
separately. The three orchestrator decisions (borrow PCs left out of A, W7's own printer global,
the lingering blocked icon left for the user) are taken as settled and not raised again.

Line numbers are for the worktree at `bba919f35` (branch `build/9-2-u-a`).

Tests run, one file at a time with `node`, all passing: `npc-reports` (9), `npc-work` (3),
`npc-needs-work` (26), `npc-needs-usb-policy` (7), `pc-policy` (7), `npc-condition-dotted-paths`
(7), `npc-needs` (60), `npc-action-icons` (3), `npc-needs-debug` (7), `test-bridge-access` (11),
`npc-coffee-off` (12), `interaction-warning` (12), and for regressions in the shared needs core
`npc-magnet` (16), `npc-needs-slots` (19), `npc-needs-tick-cost` (12), `npc-office-visuals` (35),
`npc-pressing-needs` (18), `npc-printer-power` (14), `npc-print-forget` (15), `workstation-state`
(40), `social-intel-needs-global` (8), plus `validator-access-work` (17), `validator-npc-leash` (9),
`playtest-verify-run-access` (8), `examine-minigame` (19), `minigame-launch-routes` (29),
`network-links-routing` (4). No browser run, no full suite.

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 5 |
| Nit | 4 |
| For the server reviewer (not counted above) | 7 |

## Round 1 client findings

| R1 | Claimed | Verified |
|---|---|---|
| m1 visit to own `needsHome` leaves the post | Fixed | Closed in the needs core: `_atOwnPost` (`npc-needs.js:2341-2344`) counts a visit, so no `npc_left_post`, no wind-up and no move; the node test covers it. Not closed in the live seating layer, see new m2 |
| m2 report queue loads after the needs system | Fixed | Closed. `npc-reports.js` and `npc-work.js` are static imports (`core/game.js:34-35`); `installNpcReports`, `reporter.restore` and `restoreFrustration` run synchronously after `installNpcNeeds()` (`:1990-2001`) in the same task, so `registerAll` has run and no tick can come between. No test guards it, see m4 |
| m3 ease skipped while the mirror says 0 | Fixed | Closed. `_countFailure` sets `failSent[need]` (`npc-needs.js:1921`), `_completeJob` eases on `frustration > 0 || failSent` (`:2649`), `reset()` carries the mirror (`:513-539`). Tested. One edge remains, n1 |
| m4 `previous` from the mirror | Fixed | Closed for answers (`npc-needs.js:2093-2095`), tested. The restore path still emits a mirror `previous`, see new m1 |
| m5 `off` park on a non-station source | Guard added | Closed, but the guard reads `s.home.objectId` where the plan says `needsHome`, see m3 |
| m6 settled re-set after a queued ease | Fixed | Closed. `_seq` per report, `lastEase` per NPC, stale `settled` ignored (`npc-reports.js:47-48, 104`), `_seq` stripped before sending (`:95`). The test holds a fail in flight and checks the wire. I also checked fail and ease in one batch, both orders: correct |
| m7 icon lingers | Left for the user | Not re-raised |
| m8 W4 and W7 share a global | Fixed | Closed: `printer_w7_jammed` and resource `printer_w7` (`scenario.json.erb:86, 1445-1462, 1538-1541`) |
| m9 test gaps | Added | Closed: `installNpcReports`, `watchedGlobal`, rejecting `send`, provisional kick, hold less elapsed, the refusal branch through `interaction-warning`, a visit to an NPC. All present and passing |
| m10 tempted failed job | Fixed, no test | Code closed (`npc-needs.js:1759-1761`). The reason given for no test does not hold, see m4 |
| n1 to n8 | Plan text, docs, deferrals | Reasonable. n4 (describe cost) is covered by `npc-needs-tick-cost` passing; n7 and n8 are test-floor work |

## What was checked afresh and holds

- **Existing needs behaviour.** Every new branch is gated on `_judged` (a `work` plan on the
  record, or a `social_media` need, which no existing scenario has): `_otherDesk`, `_deadStation`,
  `_failurePark` (so `_wakeParked`, `_wakeParkedFor` and the `set` mapping are unchanged for every
  other NPC), the counted `off` park, the judged verdict in `_completeJob`, `met: true` on
  `npc_used`, the action icon and the debug F bar. `TURN_BACK.failed` is the only row with
  `parks: true, fallback: false`. `out.desk` and `out.usbPolicy` are read only by judged or
  carrying-with-`usbClass` code. The `&& obj` added to the `besideCell` test in `_moveForPhase`
  changes nothing for a non-visit (a null object already gave capacity 1). The full set of needs
  test files above passes, including `npc-needs` with its whole-payload `npc_used` assertion.
- **Request pacing.** At most one POST every 2 s, at most 20 reports, one resend per stale
  report, `finally` always reschedules, and a thrown `send` drops only its batch. The server
  answers one entry per report in order (`npc_frustration.rb:69-71`), so matching answers to
  `batch[i]` is sound. No path retries without bound.
- **Listeners and timers.** One `global_variable_changed:*` listener behind the `window.npcReports`
  guard; Restart reloads the page and New Session navigates (`games/show.html.erb:442, 476`), so
  no in-page restart doubles a listener or carries a queue into another game.
- **The hold.** `gameClock.elapsedMs` is real time (`game-clock.js:22`), so the elapsed correction
  is in the same units as the server's seconds; a paused needs clock only makes a hold end later.
- **The right-hand operand** (`npc-manager.js:95-104`) resolves only `data.` and `globalVars.`
  paths, as R1 found.
- **USB plant** (`interactions.js:971-992`): an ungoverned object keeps "first match"; a refusal
  runs nothing and consumes nothing.

## Minor

**m1. A restore emits a rise from 0 on every reload, and writes the frustration globals.**
`_applyRestored` (`npc-needs.js:2113-2120`) passes the GET entry to `_setFrustration`. The entry
has no `previous` (`npc_frustration.rb:96-97`), so the event carries the mirror, 0:
`npc_frustration_changed:dana { level: 24, previous: 0 }` fires at each load. Plan 5.4 has
`register` apply "the level, the global, `tell`"; it does not ask for an event. Any mapping on a
rise (`data.level > data.previous`), or an unguarded one, runs again on every reload; in
`test_access_work` only `onceOnly` tasks listen, so nothing visible breaks today. The same call
also writes `<npcId>_frustration` for each NPC in the block, which marks state dirty at load.
Fix: in `_applyRestored`, set the mirror and the global without the event, or emit with
`previous` equal to `level` (and `restored: true`) so no rise or fall condition matches. Add a
test that a restore of level 24 emits no event with `level !== previous`.

**m2. The R1 m1 fix stops at the needs core; seating still stands the NPC up.** `needsStop`
(`seating.js:1196`) treats own-desk work as `ns.job?.kind === 'use'` only. A visit to the NPC's
own `needsHome` object spends at least one needs tick in `goto_target` (it arrives through
`_arrivals` on the next tick), where `needsStop` returns null, and `seating.js:1345` unseats on a
null stop. The NPC stands, then re-sits when `using` gives the key `at:<home>`. Not reached in A
(check visits go to a resource's `object`), but B's at-desk workarounds will. The node test
cannot see it (no seating). Fix: `(ns.job?.kind === 'use' || ns.job?.kind === 'visit')` at
`seating.js:1196`, with a `needsStop` unit test for a visit job at the home object in each phase.

**m3. The m5 guard reads the provisional home, not `needsHome`.** `_select`
(`npc-needs.js:1467-1468`) counts an `off` park only when `s.giveUp.targetId === s.home.objectId`.
Plan 5.2 says the dead-station rule reads the station "from the NPC record's `needsHome` string
... never from `s.home`, which is provisional for a start-room NPC", and `_deadStation` does so
(`_stationId`). While the home is provisional (`s.home.objectId` null) the station can already be
loaded and off: `_giveUpReason` returns `off` for it, the guard says not counted, and the need
parks `off` with no line, no drain and no report. It is still a failure park, so only
`_wakeStationFor` or its timer wakes it. A lost step, not a cheat. Fix: compare with
`this._stationId(s)`, which is what `_giveUpReason` used to produce `targetId`; extend the m5 test
with a provisional home.

**m4. Tests that would not catch a regression.**
- R1 m10 has no test because "a tempted `work` job needs a magnet rule no fixture has". It does
  not: set `sys.states.get('dana').job.tempted = true` once the job starts (or after
  `_startJob`) with `share_down` on, and assert the park, `failure_counted` and one report. Without
  the fix the need is left unparked; a two-line test catches it.
- R1 m2 has no guard. Moving `npc-reports.js` back to a dynamic import, or the restore after a
  `.then`, would pass every node test. A source-level test over `core/game.js` (the static import,
  and `installNpcReports` and `restoreFrustration` before the first `.then` after
  `installNpcNeeds()`) is cheap, or a note in the browser playtest checklist.
- No test for the restore event (m1) or for `needsStop` with a visit (m2).
- `breakDrain` is tested only at its default (`npc-needs-work.test.mjs:49`); the cap at 50 and an
  authored value are not.

**m5. A visit that ends early is neither done nor dropped.** `_startVisit` shifts the visit off
the queue when the job starts (`npc-needs.js:2055`). If the job then ends by `_failJob` (the walk
deadline, `:2544`), an `avoid` turn-back from `_recheck`, or any `_abortJob`, only
`npc_job_failed` (or `npc_turned_back`) fires: no `npc_visit_done`, no `npc_visit_dropped`. For a
check visit the resource stays in `s.checked`, so the NPC never checks it this outage and
`npc_checked` never fires (W4's `w4_checked` would not tick if the walk times out). For B, plan 5.3
says the workaround runner learns a visit's end from `npc_visit_done` or `npc_visit_dropped`, so a
workaround visit that is cut short would hang there. Plan 5.3 does not cover it either. Fix: in
`_abortJob`, when `job.kind === 'visit'` and the job did not complete, emit
`npc_visit_dropped:<npcId>` with a `reason`; for a check visit also delete the resource from
`s.checked` so the next failure queues it again. One node test with a short deadline.

## Nits

- **n1.** `_setFrustration` clears every `failSent` mark on any answer (`npc-needs.js:2097`),
  including an answer to an earlier ease or to another need's report. If an ease's answer brings
  the mirror to 0 after a new fail was queued but before its answer, the next met use sends no
  ease and the server keeps the level until the use after. Self-healing. Fix: clear `failSent[need]`
  only for an answer to a fail report of that need (the queue can pass the report's `need` and
  `event` back with the answer).
- **n2.** `reset()` keeps the mirror (R1 m3) but not `failSent`, and the restored `held` parks are
  gone because `_restored` entries were deleted on first apply. Debug and test only; say so in
  the `reset()` comment.
- **n3.** `_applyRestored` applies a pending answer and then the GET entry over it
  (`npc-needs.js:2114-2119`). Today they cannot both exist for one NPC (a report needs a
  registration, which consumes the entry), but if both ever do, the older value wins. Apply the
  restored entry first and the pending answer second.
- **n4.** With no `blocked` icon available, `stateIconEntry` (`npc-action-icons.js:123-129`)
  returns null for a judged NPC at tell 1 or 2 and so skips the `blockedNeed` icon that office life
  would have shown. Harmless while `blocked` is a built-in icon; fall through instead of returning
  null if that ever changes.

## For the server reviewer

Everything below is decided or supplied by the browser. Items 1, 2, 4 and 5 were raised in round 1
and answered in the build log; they are listed again only with current line numbers.

1. **Report fields** (`npc-reports.js:49-51`): `npc_id`, `event`, `need`, `object_id` (null is
   sent for an ease with no object), `missing` and `rearmed` are all claims. The server already
   applies its own "belongs to", "a cause holds" and pace rules; `rearmed` only lowers a floor where
   no server-owned cause holds (build log, item 2).
2. **`<npcId>_frustration` globals** are written by the browser (`npc-needs.js:2100`), now also at
   every load (m1). The server must keep never reading them.
3. **`settled` and the reload `hold`** (`npc-reports.js:46, 61-66`; `npc-needs.js:2121-2128`) are
   client-side throttles only; the server's pace floors are the control.
4. **`usb_refused:<objectId>`** (`interactions.js:981-983`) is emitted by the browser after a
   client-side refusal. Any mapping on it (a task, a global) is client-decided. The plant record
   itself is now checked on the server (`capture_proofs.rb:38`).
5. **NPC USB decisions** (`npc-needs.js` `_refuseUse`, and `npc_use_refused` / `npc_used` with a
   `tag`) are entirely client-side, and `test_access_work` maps them to tasks
   (`scenario.json.erb:412-428`). No server record exists of an NPC plugging a device in. If a later
   sub-slice ties a capture or an access grant to an NPC plugging in a `dev_badusb`, the server
   must check the class against the target PC's policy as it now does for the player's plant.
6. **The judged verdict** (`npc-needs.js:2611-2614`, `world.useVerdict`) and therefore
   `npc_use_failed`, `npc_checked` and `met: true` on `npc_used` come from browser globals. As every
   mapped task, nothing that grants access should rest on them.
7. **The test bridge `work(npcId)`** (`test-bridge/access.js:31-37`) returns `rec.work` as shipped.
   No new exposure, but it is the place to look if the plan ever gains a field that must not ship
   (plan 9.1: ids, kinds and global names, never a display name).

## Verdict

Every round 1 client finding is closed in the code or reasonably deferred, with two partial
closures: R1 m1 is fixed in the needs core but not in seating (m2), and R1 m10 is fixed without a
test that is easy to write (m4). No blockers or majors. The needs-core changes stay behind
`_judged`, and the existing needs test files all pass. The report queue is bounded, its answer
matching is sound, and the load order is right. Ready to merge for sub-slice A once m1 and m3 are
fixed and m4's two tests are added; m2 and m5 matter first in B (at-desk and workaround visits)
and can go in B's first round if logged.
