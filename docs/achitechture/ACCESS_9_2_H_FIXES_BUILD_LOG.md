# Access 9.2 H fixes (user decisions q42, q43, q44): build log

Branch `build/h-fixes`. Source: the "Access 9.2 H: deferred review items" section of
`docs/IDEAS_BACKLOG.md` (removed now that all six items are done), from the H review rounds in
`docs/achitechture/ACCESS_MODEL_SLICE_9_2_BUILD_LOG.md`.

## What changed

### q42: the share's listening window opens when the line is said

- `systems/npc-workarounds.js`: `visitArrived` no longer starts listening. It asks for the
  `login_aloud` line and holds the visit beside the colleague for `LINE_WAIT_MS` (20 s, the
  needs system's `MUTTER_WAIT_MS`) plus the share's dwell. The new `lineSaid` listens on
  `npc_mutter:<npcId>`: on the share's `login_aloud` line the window opens and the visit stands
  the dwell from that moment. A picture with no line (the line waited too long, or the scenario
  has none, which the validator already warns about) ends the visit, not heard. `visitDone`
  only takes a last hearing sample when the window is open. `installNpcWorkarounds` wires
  `npc_mutter:*`.
- `systems/npc-needs.js`: new `holdVisit(npcId, ms)`, which sets a running visit's end to `ms`
  from now.

### q43: a borrow cut short after sitting down counts as done

- `systems/npc-needs.js`: `borrow.started` is now set when the borrower sits down (where
  `npc_sat_at` fires), not when the job is claimed. `_abortJob` reads it: a borrowed job aborted
  after the sit (suspend mapping, script move, knock-out, an `off` turn-back), except by
  `reset()`, calls `_borrowDone(s, job, false, reason)`, which emits `npc_borrowed_session` and
  `npc_borrow_done` with `met: false` and `cut: <reason>`. `_borrowDone` runs once per borrow
  (`b.done`), since a failed use is done before its turn-back aborts the job.
- The runner then posts the hand-over done, the server answers `guest: true`, and the hot desk
  holds a guest session the player can claim.

### q44

- Validator (`scripts/validate_access_work.rb`, `check_hot_desk_reach`): a warning for a hot
  desk (a PC a `borrow_session` names) whose affordance satisfies a need an NPC can use it for
  without borrowing (a need that is not judged for that NPC), unless a leash keeps the NPC out of
  the desk's room. `test_access_work` raises none.
- The caffeine test can fail now: the hot desk also satisfies caffeine, caffeine is made due
  while the borrow is held, and every caffeine job must go to the coffee. Checked by mutation
  (letting the borrow PC lead every need fails it with "caffeine went to hot_desk").
- Hold queue: `test/js/toast-hold-verbatim.test.mjs` drives the real `notifications.js` with a
  fake DOM: a verbatim toast pulled back by `holdRecentNotifications` comes back verbatim (no
  dash display, `pre-wrap`). No seam was needed. Checked by mutation (dropping `verbatim` from
  the held entry fails it).
- Slow `/logout`: `pc-sessions.js` emits `pc_signing_out { pcId, reason }` before each awaited
  POST /logout (Sign out, a claim ended by its owner or the auto lock, a restored claim ended on
  load). `workstation-state.js` remembers the guest record there at that moment, and the
  following `pc_signed_out` ends only that record; a guest recorded during the request is kept,
  as the server keeps it. A `pc_signed_out` with no request in flight (displaced, switch,
  no_session, link_dropped) ends the guest as before.

## Tests

- New or changed: `npc-workarounds.test.mjs` (4 q42 cases, one on the real needs system with a
  line waiting behind another NPC's; hStub now says the line at once by default), 
  `npc-needs-work.test.mjs` (caffeine, 3 q43 cases; `started` false on the way),
  `pc-sessions.test.mjs` (pc_signing_out before each slow logout), `workstation-state.test.mjs`
  (2 slow-logout cases), `validator-access-work.test.mjs` (hot desk reach), 
  `toast-hold-verbatim.test.mjs`.
- Full JS suite under the shared lock: 508 of 508 files pass. Rails suite not run: no Rails or server code changed (the validator script is tested from the JS suite).

## Live proof (port 3036, `test_access_work`)

- q42, game 1398 (start room `open_office`): Sam arrived beside Ruth at needs clock 88750; his
  start line was still waiting for the speech lock, so his `login_aloud` line came at 95000,
  6250 ms after arrival, after the old window (arrival plus 6 s) had closed. The visit ended at
  101000, 6000 ms after the line. POST /npc_workaround went with `heard: true`, the
  "Overheard: Sam Okafor" toast showed and task `h4_overheard` completed. The driver's extra
  chatter hook found no other placed needs NPC in the room, so the wait came from the game's own
  queued line.
- q43, game 1399 (start room `hall_c`): Ian sat at the hot desk (`borrow.started: true`, user of
  the PC); `npcNeedsSystem.control('ian', 'suspend')` mid-use gave `npc_borrowed_session` and
  `npc_borrow_done` with `met: false, cut: "suspend"`, POST /npc_workaround `dropped: false`
  answered `{ pcId: "hot_desk", guest: true }`, `npc_guest_left:hot_desk`. A click on the hot desk
  sent a guest claim and opened Ian's desktop (`pc_signed_in via claim`). No
  `npc_borrow_dropped`. His later second sit came from a new hand-over (a fresh `started`, his PC
  still unplugged), not from the cut-short borrow.
- Drivers and logs: scratchpad `hfix_live/` (share.js, borrow.js, share2.json, borrow1.json).

## Scenario beats

`scenarios/test_access_work/PLAYTEST.md` rows H6 (q42) and H7 (q43). Both use bridge or
`npcNeedsSystem` calls to make the timing happen; no scenario JSON changed.

## Open

- The slow-logout guard and the hold queue have unit proof only (the timing cannot be produced
  on the live path without delaying the server).
- H7 cuts the use short with the `needs: "suspend"` entry point; no scenario mapping does that
  at the hot desk today.

## Round 1 review fixes (`ACCESS_9_2_H_FIXES_CODE_REVIEW_R1.md`)

Taken over from the first builder at the review.

- **M1** (a cut-short borrow's late "done" ended a password session opened in the gap): the
  review's option (a). `_borrowDone`'s `cut` reaches the runner, which posts the "done" with
  `cut: true`; the controller reads it (true or "true" only) and `complete_npc_workaround!`
  skips the borrow's dwell floor for it (every other kind keeps its floor). The "done" lands as
  the use ends, so there is no refused-and-resent gap, and `guestSessionsAt` is stamped then.
  Chosen over (b), keeping a session signed in after the hand-over time, because a sign-in
  during the walk is ended on the client at `npc_sat_at` and (b) would keep it on the server;
  and over (c), a client guard, which leaves the server open to the same late write. Left: a
  "done" lost on the network is still resent after a backoff, so a password sign-in in that
  window could still be ended. Narrow. Cheat model (R2 m1): a tampered client can send it at
  the hand-over and skip the floor. Accepted (q43 R2): the guest session is the designed
  workaround, its secret checks are unchanged, and an honest player can cut the use short a
  moment after the sit; the server cannot see the walk or the sit.
- **m1:** PLAYTEST H7 says the cut-short borrow is done once and that Ian, unmet, may be handed
  the desk again later. The q43 test is now "...no second sit from the same borrow".
- **m2:** `PRIORITY_MUTTERS` (`login_aloud`) in `npc-needs.js`: such a mutter waits only for the
  lock and for other priority lines, and is queued ahead of every ordinary one. A queue of
  start lines at one outage can no longer turn the share into a picture.
- Nits: n1 `holdVisit` on a frozen visit also sets `useRemaining`; n2 the H6 row notes that a
  conversation over 20 s that starts before the line drops it; n3 a share dropped while its line
  waits removes it (`NPCNeedsSystem.cancelMutter`); n4 `pc_signed_out` uses the sign-out
  snapshot only for the four reasons that send `pc_signing_out` (`SIGNING_OUT_REASONS`); n5 the
  `_abortJob` comment lists the real causes; n6 a validator case where the desk serves a
  non-borrower's judged `work` (no warning) and the same need unjudged (warned).

### Tests

- Rails `npc_workaround_h_test.rb`: a 30 s hot desk (27 s floor). A whole-use "done" and a
  `cut: "yes"` get 425, a `cut: true` "done" 5 s after the hand-over is taken at once with
  `guestSessionsAt` stamped then; a share's `cut` changes nothing. A cut "done", then a password
  sign-in, ends the guest and keeps the session, and a resend does not end it. Both fail with
  the floor put back.
- JS `npc-workarounds.test.mjs`: the same long-use fixture on the needs system with a stub
  server that keeps the floor (it refuses the same "done" without `cut`): the cut "done" is
  sent once with `cut: true`, no resend timer, guest recorded (fails without the client
  change); a whole use and a drop carry no `cut`. m2 with six queued lines (and the order after
  it), priority order and a held ordinary line, n1, n3 (runner and needs system). Fails with
  priority off.
- `workstation-state.test.mjs` n4 (fails with `true` for every reason);
  `validator-access-work.test.mjs` n6.
- Suites under the shared lock: Rails 1798 runs, 0 failures, 0 errors, 1 skip; JS 508 of 508 files pass.

### Live proof (port 3036)

- M1, game 1449: `test_access_work` created with the hot desk's `useSeconds`
  set to 30 in the game's copy only (the scenario file was put back at once). Ian was handed
  the desk at needs clock 74250, sat at 79000, and was suspended at 81750, 7.5 s after the
  hand-over against a 27 s floor. `POST /npc_workaround` went once with `cut: true` and was
  answered 200 `{ pcId: "hot_desk", guest: true }`, no 425. `npc_guest_left:hot_desk`; a click
  on the hot desk sent a guest claim and opened Ian's desktop.
- m2, game 1451 (start room `open_office`): just before the runner asked for Sam's line, the
  driver queued seven more mutters through the real speech lock, so eight lines were waiting.
  `login_aloud` was queued at the head (`sam:login_aloud!` first in `mutterWaits`), said in
  words 2500 ms after arrival, the visit ended 6000 ms after it, `heard: true`, the
  "Overheard: Sam Okafor" toast showed. Only Sam was placed and available, so all eight
  queued lines were his.
- Drivers and logs: scratchpad `hfix2_live/` (m1.js, m2.js, m1.json, m2.json).

## R2 fixes (`ACCESS_9_2_H_FIXES_CODE_REVIEW_R2.md`)

- **m1:** the `complete_npc_workaround!` comment and the M1 entry above now say what `cut`
  trades: a tampered client can skip the floor, accepted, with the reasons. The old "no weaker
  than the floor" wording is gone. The access model plan keeps no cheat notes for 9.2 H, so
  nothing changed there.
- **n1:** `visitArrived` drops the NPC's waiting `wk_share_login` (`cancelMutter`) before it
  asks for `login_aloud`, so a stale start line is never said after the shared login. New test
  "q42 R2 n1" on the real mutter queue (fails without the change); the R1 n3 runner test now
  expects the arrival's cancel too.
- **n3:** the Rails resend assertion carries a comment that it is reached only behind the cut
  "done", and also checks the resend writes no guest back.
- **n2:** left as it is, as the review advised.
- Tests (single files, no lock): `npc-workarounds.test.mjs` 64 of 64 (two fail with the n1
  change taken out), `npc-workaround-barrier-icons.test.mjs` and `npc-needs-work.test.mjs` 75 of
  75, Rails `npc_workaround_h_test.rb` 34 runs, 0 failures.
