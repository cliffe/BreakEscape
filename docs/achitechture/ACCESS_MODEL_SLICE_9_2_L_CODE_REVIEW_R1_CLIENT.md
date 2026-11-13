# Access model slice 9.2 L: code review, round 1, client side

Branch `build/9-2-l`, head `374761abf`, reviewed as `git diff 6192486b6..HEAD`. Scope: `npc-reports.js`,
`npc-needs.js`, `workstation-state.js`, the test bridge, `tools/playtest`, the JS tests,
`scenarios/test_access_work` and its `PLAYTEST.md`, and the docs. Spec: plan 6.6, 5.1, 5.5, 11.1 and
12 "Sub-slice L"; build log section L.

Tests run alone, all green: `npc-lockout` 15/15, `npc-reports` 9/9, `test-bridge-access` 11/11,
`playtest-verify-run-access` 14/14, `validator-access-work` 35/35; neighbours `npc-needs-work` 49/49,
`npc-workarounds` 51/51, `workstation-state` 48/48, `npc-work` 3/3; Ruby
`test/unit/access_leak_scanner_test.rb` 32 runs, 0 failures.

## What was checked and holds

- **When the check fires.** `workstation_owner_returned:<pcId>` is emitted from
  `WorkstationState.onReturned` (`workstation-state.js:501`), which runs on `npc_returned_post`,
  which the needs core emits on arrival at the own post, before `job.phase = 'using'`
  (`npc-needs.js` around 2862 to 2900). The listener chain (`npc-reports.js:234-235`,
  `onOwnerReturned`, `markCheck`, `lockCheckSent`) is synchronous, so `s.lockCheck[pc]` is set
  before the use's dwell starts. The verdict comes `useSeconds` later (5 s here), so the hold only
  bites when a request takes longer than the dwell.
- **The hold cannot stall an NPC.** `_completeJob` is re-entered every tick while
  `phase === 'using'` and `clockMs >= useUntil` (`npc-needs.js:2910`), and the hold lapses after
  `LOCK_CHECK_WAIT_MS` (`npc-needs.js:2928-2934`). Every check gets exactly one synthesised answer
  (`npc-reports.js:160-165`): a refused, missing or malformed answer, and a second loss, all come
  back `lockedOut: false`. A hung `stateSync.sync()` (pre-existing: `sending` stays true) still ends
  in the lapse. `reset()` drops `lockCheck` (so no hold) and keeps `lockedOut`, and a late answer
  still sets the flag.
- **The flag.** Station only (`_applyLockCheck`, and `atStation` excludes borrowed PCs), work only,
  `locked_out` first in `missing`, any duplicate filtered. Restored from `npcFrustration.lockedOut`
  filtered to the station, with no event emitted. Kept through `reset()`.
- **The screen.** `_rollScreen` forces the lock after the seeded roll (so other screens' sequences
  do not shift) and before `lockAt`/idle are set, so no auto-lock timer is left on a forced lock.
  `onLeft`, the KO leave and `_lateRoll` all pass through `_rollScreen`. `_lockedOut` asks
  `isLockedOut`, which is station-keyed, so a borrowed hot desk (H's guest session) is untouched.
- **H and B.** A flagged owner coming back from the hot desk returns to a forced-locked screen
  (`wasLocked: true`), but `flagged` stops a second check. `_borrowDone` and the borrowed verdict are
  unchanged. B's visits are `kind: 'visit'` and return before the hold.
- **Regressions.** Every new branch depends on `lockCheck` or `lockedOut`, which only a check answer
  or a restore can fill. `_applyAnswers` only short-circuits answers tagged `forEvent: 'check'`,
  and raw server check answers are kept out of `usable`. The needs captures show 0 differing
  subjects in `test_npc_needs` and `test_needs_leash`.
- **Text as HTML.** L adds no HTML sinks. The sign-in screen's lockout text goes through
  `textContent` (`setSignInMessage`) and through `escapeHtml` before `showFailure`'s `innerHTML`
  (`password-minigame.js:1097-1104`).
- **Tests fail without the fixes.** The hold test (`npc-lockout.test.mjs:200`), the lapse test
  (:222), the flag test (:158), the restore and `reset()` test (:244), the screen test (:259) and the
  install test (:123) each assert behaviour that is absent without its code.

## Major

### M1. The "lockout seen" mark lives in the page, so a reload before the owner's return silently breaks the chain for the mission

`npc-reports.js:47` (`lockoutSeen = new Set()`), `:52-54`, `:180-181` (`!seen` returns false).

Failure scenario: in L1 the player types three wrong passwords on Jake's tile while he is at the
fridge, and sees "This account is locked on this PC." The tab then reloads before Jake comes back:
a crash, a Hacktivity resume the next lesson, or simply F5. `lockoutSeen` is empty, and no check has
been recorded, so `npcFrustration` carries no `lockedOut`. Jake comes back to his locked screen,
`shouldCheckLockout` returns false, and he works on, for the rest of the mission, although the
server's `loginLockouts` holds `jake_pc|jbrooks` for good. The player sees an action that worked
on screen and then had no effect. Re-arming needs the player to type that same username again at
that PC, which nothing prompts. The lockout is the one chain the plan says a player can start with
nothing but a sign-in screen, and it is the one that a reload quietly undoes.

The builder documented this (build log L, choice 6), and the plan's wording ("a PC where this
browser has had a lockout answer") allows it, so this is a spec gap rather than a deviation. I
still rate it Major. The effect lasts the mission, the player gets no feedback, and the fix is
small and reveals nothing new:

- Preferred: `GET /scenario` carries the ids of the PCs where `loginLockouts` holds any key (for
  example `lockoutPcs: ["jake_pc"]`). These are PCs only, never usernames, and the player was shown
  a lockout answer at each one, so this tells the browser nothing it has not already been told. The
  client seeds `lockoutSeen` from it in `installNpcReports` (and in `restore`). Extend the leak
  scanner's `lockout_list` rule to allow that one key at `$.lockoutPcs`, and add a test that it
  never holds a username. This needs the plan owner's yes, because 9.2 says "no list of locked-out
  accounts". This is a list of PCs, but the wording should say so.
- Cheaper, partial: keep the set in `sessionStorage` keyed by game id, wrapped in try/catch. That
  covers a same-tab reload, but not a resume on another day or device.
- Or the user accepts the gap, and `README_scenario_design.md` says that a reload before the
  owner's return loses the lockout's effect.

## Minor

### m1. A false check answer leaves the PC marked, so every later locked return of that owner sends a check and holds the first use

`npc-reports.js:52-54` (the mark is never cleared), `:60-72`.

Failure scenario: the player locks out a guessed username ("admin") at `jake_pc`. Jake's screen
always locks. On every trip back (every few minutes, for the whole mission) a `check` is queued,
the server answers `lockedOut: false`, and his first use waits for the answer. That is one extra
request per return and a needless hold each time. It is within the two-second budget, but it is
spending with no point. The answer cannot change until a new `locked_out` answer is seen at that PC:
lockouts last the mission and only new sign-in attempts can add one.

Fix: give each `noteLockout` a per-PC counter. Record the counter on the queued check. When a
`false` answer arrives, delete the PC from `lockoutSeen` unless the counter has moved since the check
was queued. Add a test: a false answer, then a locked return, sends no check; a new `locked_out`
answer, then a locked return, sends one.

### m2. No test joins the three layers on the real order of events

`npc-lockout.test.mjs:200-220` calls `sys.lockCheckSent` by hand once the job is `using`. The live
order (needs arrival, `npc_returned_post`, `WorkstationState.onReturned`,
`workstation_owner_returned`, `NpcReports.onOwnerReturned`, `lockCheckSent`, then `phase = 'using'`)
is covered only by the browser run.

Failure scenario: a later change emits the return after the use completes (for example by moving
the `_targetsOwnPost` block, or a deferred event dispatcher). The first use is then judged met
before any hold. Every unit test stays green, and only a live run would catch it.

Fix: one test that builds `workWorld` with a real `WorkstationState` and `NpcReports` on a shared
dispatcher, notes a `locked_out` answer, lets the owner leave and return, and asserts `use_held`
before any `npc_used`. While there, also cover:
- a late `true` answer after `lock_check_lapsed` still flags;
- `_lateRoll` (station found after the leave) locks for a flagged owner;
- `markCheck` returning false queues nothing.

### m3. The author doc says the wrong screen locks

`README_scenario_design.md:1089`: "Give the owner a `borrow_session` and they hot-desk ... Their
screen there locks on every leave". The nearest "there" is the hot desk. The code does the opposite:
the borrower leaves the hot desk signed in (H), and only the owner's own PC is forced locked.

Failure scenario: an author reads this, assumes the hot desk is never left open, and drops the
borrower's `screenHabit`, or writes a beat that expects the hot desk to lock.

Fix: "Their own PC's screen locks on every leave, whatever its `lockChance`; the hot desk is left as
the borrower's habit says."

## Nit

### n1. The hold's lapse lets one use through as met, which the plan rules out

`npc-needs.js:2928-2934`. Plan 6.6 says "a slow answer never lets one use through as met". After 30 s
of needs clock the use is judged as if no check had been sent: `npc_used:<pc>` with `met: true` (a
mapping on it could tick a task) and an ease the server then refuses.

Failure scenario: the clock reaches it either through a scripted run that steps the needs clock
past the hold while the request is in flight, or a stalled sync. The trade-off is sound (it is what
keeps the NPC from freezing), but it is a deviation. Fix: note it in plan 6.6 and the README. In
`PLAYTEST.md`, tell scripted runs not to step the clock while `work(id).lockCheck` is not empty.

### n2. The policy lookup is a third copy

`npc-reports.js:213-227` re-implements "the object's own policy, else `defaultPolicy`", which
`pc-policy.js:29-32` and `workstation-state.js:597-603` already resolve. If the rule changes (for
example a room-level policy), the copies drift. Fix: reuse `pc-policy.js`. If its imports are pure,
add it to the JS test harness copy lists, which a new static import needs; otherwise leave a
cross-reference comment at each copy.

### n3. The sign-in screen shows the lockout three ways (first slice, not L)

`password-minigame.js:1097-1104`: `setSignInMessage` writes the sentence into the form,
`gameAlert` shows it as a toast, and `showFailure` shows it again in the overlay. The build log saw
two of the three. All three are escaped, so this is cosmetic. Fix, in a later first-slice pass:
drop the `setSignInMessage` call in `signInLockedOut`, or drop the toast.

### n4. A check answer for an NPC with no needs state is dropped

`npc-needs.js` `_applyAnswers` (the `forEvent === 'check'` line): with no state for `a.npcId` the
answer is discarded, unlike level answers, which go to `_pendingLevels`. This is harmless today,
because the return that sent the check needs a live state, and the server's record restores the flag
on reload. Fix: a one-line comment saying so.

### n5. `writes_down` on a lockout station gives a note that cannot be used there

The code does not reject this pairing. If an author gives a lockout-prone owner a `writes_down`,
the sticky note's password is refused at that PC once the owner is locked out. Fix: one sentence in
the README's lockout section.

## Verdict

No blockers. The hold, the flag, its restore and the forced screen lock are correct, cannot stall an
NPC, do not touch other scenarios' needs paths, and fit B and H. The tests fail without each fix.
M1 needs a decision before merge: either the small server-side PC list (preferred, with the plan
owner's yes) or the user explicitly accepting the reload gap, recorded in the README. m1 to m3
should be fixed in this round. The nits can wait.
