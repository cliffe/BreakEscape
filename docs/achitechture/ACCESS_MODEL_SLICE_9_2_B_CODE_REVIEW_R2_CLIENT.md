# Access model slice 9.2, sub-slice B: code review round 2, client half

Reviewer: fresh, independent. Scope: client JavaScript, node tests and `scenarios/test_access_work`
on `build/9-2-b` against `main` (`git diff main...build/9-2-b -- '*.js' '*.mjs'
scenarios/test_access_work`), at `c62adacfa`. Checked against `ACCESS_MODEL_SLICE_9_2_PLAN.md`
(sections 6, 6.1, 11.1 X1 to X4), the build log's "Sub-slice B review round 1 outcomes" and the
round 1 client review. The Ruby server is the other reviewer's; I read `npc_frustration.rb` and
`games_controller.rb#npc_workaround` only to confirm which statuses the client can get (every
refusal is 403, a dwell not yet passed is 425 with `retryAfter` as the time left).

Files reviewed: `systems/npc-workarounds.js`, `systems/npc-needs.js` (the mutter queue, the 6 s
floor, `reset()`, the pending hand-overs), `systems/npc-reports.js`, `systems/postit-marks.js`,
`ui/info-label.js`, `systems/doors.js`, `systems/npc-action-icons.js`, `core/game.js`,
`core/rooms.js`, `api-client.js`, `systems/npc-needs-chatter.js` (how a line is voiced), the X3
and X1 parts of the scenario and `PLAYTEST.md`, and the tests named below.

Tests run (single files): `npc-workarounds` 31 pass, `dungeon-graph-workarounds` 3 pass,
`playtest-verify-run-access` 13 pass, `validator-access-work` 27 pass, `postit-marks` 7 pass,
`npc-needs-usb-policy` 7 pass. No failures.

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 5 |
| Nit | 6 |

## Round 1 findings: closed or deferred

| R1 | State now | Evidence |
|---|---|---|
| M1 hand-over lost after six failures | Closed | `npc-workarounds.js:49-52` `retryDelay` gives 2, 4, 8, 16, then 30 s; `:147-156` only a 403 ends a job. Test "eight failures, a backoff capped at 30 s" pins the sequence and one apply |
| m1 one wait slot per NPC | Closed | `_mutterWaits` queue (`npc-needs.js:1825`, `:1839-1856`); test "two start lines for one NPC" |
| m2 several NPCs freed on one tick | Closed | each waiter re-checks `_speechFree()` (`:1850`); test "several NPCs freed on the same tick" |
| m3 line said late or while unavailable | Partly closed | held while not placed or `!isAvailable`, dropped at `MUTTER_WAIT_MS`. A conversation with the player is not covered: see m1 below |
| m4 `reset()` loses a workaround visit | Closed | `npc-needs.js:517-523` emits `npc_visit_dropped` with `reason: 'reset'`; `_abortJob` skips its own emit for `reset` (`:3068`), so one drop per visit. Test |
| m5 line and `started` before the act can start | Closed | `npc-workarounds.js:96-105`; test "a visit that cannot be queued says no start line" |
| m6 test gaps | Mostly closed; two deferred reasonably (the `_turnBack`-driven path has live proof in game 1204; the two-NPC `failSent` alignment is sub-slice A code). One new test does not test what it says: see m5 below |
| m7 `door_opened` on each reload | Closed | `doors.js:928-934` adds `restored: true` while `proppedOpening` is set. No test of the flag (m5) |
| n1 to n5 | Closed | header text (`npc-workarounds.js:21-35`), `VISIT_KINDS` comment, catch message, `openSprite` returning false clears `proppedOpening` (`:217`) |

## What holds up

- No duplicate sends. A job leaves `running` for `sending` on its first `_send` (`:140`), and
  `_jobFor` (`:117-123`) answers only for a `running` job, so a late `npc_visit_done` or a reset's
  drop during a retry wait starts nothing. Each resend is scheduled only from the failed request's
  own `catch`, so there is never more than one request in flight or one timer queued per job.
- Timers across reload and teardown: the engine has no in-page scene restart (round 1 checked
  this), so a reload is a new page; the old page's timers die with it and the server re-sends the
  unspent hand-over as `pending`. A done whose answer was lost in the reload is spent on the
  server and comes back in `done`, which `restore()` applies. Nothing leaks across.
- Server down for minutes: one request per job every 30 s after the first 30 s, no give-up. A job
  waiting to resend blocks only its own key; the server holds that hand-over as handed, so no
  second hand-over for the same NPC piles up behind it.
- Queue fairness: oldest first, and a held waiter (NPC not placed, unavailable) does not block the
  ones behind it. `_tickMutterWaits` runs before every NPC, chat and call in the tick
  (`npc-needs.js:979`), so a waiter is never starved by ambient chatter: when the lock frees, a
  waiter gets it first. A waiter whose NPC has gone from `states` is skipped (`:1843`).
- Effects on existing needs behaviour: `mutter` has one caller (`npc-workarounds.js:86`), so the
  queue, the wait and the 6 s floor touch only workaround start lines. `_tickMutterWaits` runs only
  with a non-empty queue. Scenarios without `workarounds` (test_npc_needs, test_needs_leash,
  test_needs_sims, office-life work) never reach it. The `failSent` change in `_setFrustration` is
  narrower than before, and an answer with no `forEvent` keeps the old clear-all.
- The sticky-note label never carries the note's text (`postit-marks.js:120-124`); it keys off the
  mark, which exists only after `hasPostit` or `mark(pcId, true)`. Shipped missions have no
  `lockType: "login"` PCs with notes, so only test scenarios see the new sentence.

## Minor

### m1. A start line can be said, and voiced, during the player's conversation with that NPC

`npc-needs.js:1825-1829` and `:1845`. The round 1 fix holds a waiter while
`!this.isAvailable(id)`, and the comment at `:1837` says that covers "in a conversation". It does
not: `isAvailable` (`:1048-1052`) checks only a position and `ko`/`hostile`/`hidden`, and a
person-chat leaves the NPC placed and visible. The needs clock keeps running during a person-chat
(only a VM pauses it, `:576`). The immediate path in `mutter` (`:1829`) checks nothing at all. A
`npc_frustration` answer arrives a moment after the failure that caused it, and that is the moment
a player who just saw the NPC grumble is likely to walk up and talk; the start line is then said
over the conversation, and `npcChatterVoice.say` has no conversation check, so on a keyed server
its voice plays over the conversation's own audio. No other ambient line can do this: a desk-phone
call hangs up on a chat (`:3582`) and a frozen NPC never turns back. The build log's "not
available (in a conversation, hidden)" overstates the fix.

Fix: in `_tickMutterWaits`, treat `this.world.inChatWith(w.npcId)` as held; in `mutter`, queue
(rather than say) when the NPC is in chat with the player or not placed, so the one held-then-
dropped rule covers both paths. Test with `w.world.inChatWith = () => true` for a while.

### m2. The 6 s floor is also a 6 s speech lock for the whole floor

`_showSaying` (`npc-needs.js:1876`) puts the floor into `until`, and `_speak` (`:2279`) takes the
global lock until that time. A start line such as "I'll never remember this one." has a natural
bubble of about 4 s, so every start line holds every other NPC's speech for 2 s or more beyond the
words. Three effects:
1. Any other NPC's grumble or chat bark in that window is a picture (`_pickBark` finds the lock
   taken), so making one line noticeable makes others less so.
2. With `MUTTER_WAIT_MS` 20 s, a fail line (up to 4 s) leaves room for three start lines at 6 s
   each; a fourth, or a third if an exchange line or a call took the lock in between, falls back to
   its picture. The build log's "a few queued start lines are each said in words" holds for three.
3. Because waiters tick before chats, a waiter takes the lock at the tick an exchange line was
   queued for (`c.nextAt = this._speechUntil`, `:3256`), and the exchange waits the full 6 s.
   Exchanges are heard once, so a start line wedged between two of its lines splits it.

Fix: give the floor to the bubble only. Pass `bubbleMs(line)` as the lock's end to `_speak` and
keep `Math.max(minMs, ...)` for `s.saying.until`. Then a start line stays on screen 6 s while the
next line can begin when the words end (bubbles on two NPCs overlap, as a grumble and a chat
already can). If the lock should stay at 6 s, say so in the plan and add a test that pins the
three-line budget.

### m3. Ellis's out-of-office note says he has gone while he sits at his desk

`scenarios/test_access_work/scenario.json.erb:2030`: "Intranet down again. Gone to do something
useful. Ellis". An `emit` workaround has no visit (plan 6.3), and Ellis has only a `work` need, so
he never leaves; the note appears beside a man who is still there, failing at his PC. A tester
reading it as a model for authors learns that the note can contradict the room. Fix: reword it to
something true while he stays (for example "Intranet down again. I've given up on it for today.
Ellis"), or give the beat a reason for him to leave. Either is scenario-only.

### m4. The plan and the X3 playtest row do not record the round 1 changes

`ACCESS_MODEL_SLICE_9_2_PLAN.md:1783` (X3 row) still describes Ellis's workaround as an `emit`
"mapped to a task", with no `setGlobal` and no note; `PLAYTEST.md:112` (X3) lists no
`global_variable_changed:ellis_out_of_office` and no check that `ellis_ooo_note` is revealed, so
a run would pass with the note broken. The plan also does not mention the retry schedule (2, 4,
8, 16, 30 s, no give-up; it says only "retries a failed request", `:2071`), `MUTTER_WAIT_MS` 20 s,
the 6 s floor, or the sticky-note proximity label, which extends 9.1's channel that the plan
(`:2361`) says is used "exactly". The orchestrator decision is in the build log, but later
sub-slices plan from the plan. Fix: update the X3 row, section 6's runner paragraph and the 6.1
sticky-note row; add the global and the note to `PLAYTEST.md` X3's expected events and final state.

### m5. Tests that would not catch a regression

`test/js/npc-workarounds.test.mjs`:
- `:519` "a waiting start line does not hold up a conversation line queued behind the same lock"
  creates no conversation line. It asserts the lock is unchanged until the fail line ends, then
  that the start line takes it, which is true whatever happens to a chat. It would pass if
  waiters starved exchanges entirely. Either drive a real exchange (two NPCs at one object, a
  knot) and assert its next line's timing, or rename it to what it checks.
- No test of a waiter while the NPC is in chat with the player (m1).
- No test of the lock length after a start line, or of the three-line budget (m2): the `:485`
  test checks only `s.saying.until`.
- No test of `door_opened` carrying `restored: true` for a sprite opened by `syncRoom`, and none
  that a sprite opened in-session carries no flag (`doors.js:933`). Only the live run checks it.
- No test that an `emit` workaround's `setGlobal` from the "done" answer is set (`_apply`, `:184`)
  for the `emit` kind: the existing `emit` test answers `{}`. X3 now depends on it.
- `info-label.js:100-101` is untested: `label()` is tested alone, not that the label path passes
  `obj.scenarioData.id` (an object whose sprite id and scenario id differ would silently lose it).

## Nits

- n1. `npc-workarounds.js:149-155`: every status other than 403 and 425 is resent for the page's
  life, including 400, 404 and 422, which a resend cannot fix (a deleted game, an expired CSRF
  token). Cheap at one request per 30 s, but a `console.warn` once a job passes, say, 5 attempts
  would make a stuck job visible in a playtest log.
- n2. `npc-workarounds.js:142`: `attempts` also counts 425 waits, so a network failure after a 425
  starts its backoff one step later than the header describes. Harmless; reset `attempts` on a 425
  or say so.
- n3. `npc-workarounds.js:155`: no jitter. After an outage every job resends on the same 30 s
  grid. Trivial at today's counts.
- n4. A start line queued at `due()` is still said after its visit has been dropped (visit
  unreachable, `VISIT_DROP_MS`), up to 20 s later. Rare; a `visitDropped` could remove that NPC's
  waiting `wk_*` mutter.
- n5. `postit-marks.js:123`: `label` calls `trimEnd` on whatever `resolveObjectField` returns; a
  non-string observation (an author's object or number) would throw inside `updateInfoLabel` every
  frame. Guard with `typeof text !== 'string'`.
- n6. `npc-needs.js:1837` comment says "(in a conversation, hidden)"; correct it with m1 or drop
  "in a conversation".

## Verdict

Round 1's major and the start-line minors are fixed as described, the retry is correct (one job,
one timer, one request in flight, no give-up, only a 403 ends it), and existing needs behaviour is
untouched outside workaround start lines. No blocker or major. Fix m1 (a start line voiced over a
conversation) and m3 (a note that contradicts the room) before merge; m2 is a design call on how
long a start line holds the floor and wants either the one-line change or a sentence in the plan;
m4 and m5 can go in the same round.
