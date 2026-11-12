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
