# Access model slice 9.2, sub-slice H: code review round 1, client side

Branch `build/9-2-h` at `ccc465f7d`, reviewed against `main` (`git diff main...build/9-2-h`).
Scope: `public/break_escape/js` (npc-needs.js, npc-workarounds.js, workstation-state.js,
pc-sessions.js, unlock-system.js, test-bridge/access.js), `tools/playtest`, the JS tests,
`README_scenario_design.md` and `docs/test-bridge.md`. Spec: plan sections 5.5, 6.4, 6.5, 11.1
and 12 "Sub-slice H"; build log sections H, H part two and H part three.

## Tests run

Each changed JS test file alone, with `node --test`:

| File | Tests | Result |
|---|---|---|
| npc-needs-cell-beside | 4 | pass |
| npc-needs-work | 47 | pass |
| npc-office-visuals | 36 | pass |
| npc-workarounds | 47 | pass |
| pc-sessions | 30 | pass |
| playtest-verify-run-access | 13 | pass |
| test-bridge-access | 11 | pass |
| validator-access-work | 33 | pass |
| workstation-state | 45 | pass |
| screen-states (must pass unchanged) | 22 | pass |

## Summary

The borrow is built the way the plan describes it. `setBorrow` unparks the failing need,
`_useCandidate` returns only the borrowed PC for that need while the borrow is held, the 60 s
limit runs on the needs clock, and `npc_borrowed_session` fires before a failed verdict's
turn-back. The failed borrowed use is not reported. The regression surface for scenarios without
H is small: every new branch is gated on `s.borrow`, `job.borrowed`, `env.userOf` returning an
NPC at a sign-in PC (only authored affordances put NPCs at login PCs, and `test_access_work` is
the only scenario with any), or a visit to an NPC. The cellBeside fix is right, and its tests
fail without it. Two things need fixing before merge, both in the share: the overheard toast
renders the server's line, password included, as HTML, and a hearing from a doorway uses up the
`heard` flag with no room, so a player who hears the share as they walk in gets nothing.

## Blocker

None.

## Major

### M1. The overheard toast renders the password line as HTML; the note's markdown can alter it

`public/break_escape/js/systems/npc-workarounds.js:409` calls
`w.gameAlert(line, 'info', title, 8000)` with no `{ plainText: true }`. `renderNotification`
(`systems/notifications.js:211-216`) then builds the toast with `innerHTML`, after
`displayDashes`. `line` is composed on the server as `It's <username>. Password's <password>.`
(`npc_frustration.rb:379`), and the title holds the author's `displayName`.

Failure scenario: a sharer whose `creds.password` is `R&D<2024>` or `Spring--24`. The toast shows
`R&D` and then nothing (the `<2024>` is parsed as a tag), or `Spring – 24` (displayDashes turns a
bare `--` between word characters into a spaced en dash). The student types what the toast shows
and the sign-in fails. A `displayName` holding markup is author text going into `innerHTML`, which
the org input rule forbids. The note has a related problem. `window.addNote` stores the text
as is, and the notes page renders it through `renderNoteMarkdown(displayDashes(...))`, which
escapes HTML but treats `*x*`, `**x**` and backticks as formatting and rewrites `--`. A password
such as `*Kestrel*9` is shown in the notebook as an italic `Kestrel9`.

Fix: pass `{ plainText: true }` in the `toast` dep (pc-sessions.js:443 and inventory-menu.js
already do this). For the note, escape the password for the note markdown before the note is
saved, either on the server in `shared_login_body` (`\*`, `` \` ``, `\-` and `\\` are in
`ESCAPABLE`) or on the client before `addNote`. Also show the password inside a code span, or
skip `displayDashes` for it. Add a runner test that checks the toast dep is called with plain
text, and a note-markdown test with a password containing `*`, `` ` ``, `--` and `<`.

### M2. A hearing in a doorway sets `heard` with no room, and later hearings in the room are ignored

`npc-workarounds.js:186-191`: `_listen` returns early once `job.heard` is true. The first tick
that hears sets `heard = true` and `roomId = playerRoom() || null`. The world's `playerHears`
(`npc-needs.js`, adapter `playerHears`) counts as same-room when `window.currentPlayerRoom` is
falsy, and the engine sets it to `''` while the player stands in a doorway or a gap between rooms
(`core/rooms.js`, noted in screen-states.js). `_send` then posts `heard: true` with no `room_id`,
which the server treats as not heard (plan 6.5), and the answer is `{}`.

Failure scenario: Sam's start line is said, and the player walks in through the open_office door
to listen. The first tick after Sam reaches Ruth finds the player within 160 px in the doorway.
`heard` is set with no room. The player is beside Sam for the rest of the 6 s dwell, but no later
tick can record `open_office`. The hand is spent with nothing overheard and comes round only after
the next failed use. Walking in through the door is the natural way to listen, so this will
happen in play, and the tests do not cover it (`hStub` always returns a room).

Fix: in `_listen`, only set `heard` when `playerRoom()` returns a non-empty string, so a doorway
tick does not count and the next in-room tick does. Alternatively keep `heard` and replace a
null `roomId` with the first non-empty room heard later. Add a runner test where the first hearing
tick has room `''` and a later one has `open_office`, expecting `room_id: 'open_office'`.

## Minor

### m1. The `login_aloud` line can be said outside the listening window

`npc-workarounds.js:175` asks for the line through `mutter` on arrival. `mutter` queues a topic
that has lines whenever the shared speech lock is taken (`_speechFree` is one lock for all NPCs,
`npc-needs.js:2397`) and waits up to `MUTTER_WAIT_MS` (20 s). The hearing window is the 6 s dwell
from arrival. In a room with chatter, or when Sam's own start line still holds the lock (it stays
up at least 6 s and the walk to a colleague in the same room can be shorter), the line comes late.
It may be said after the dwell, as Sam walks back to his desk. A player who hears the line then
gets nothing, and a player who stood near a silent Sam during the dwell gets the toast. Fix:
start the hearing window when the mutter is actually said (`npc_mutter:<npcId>` with topic
`login_aloud`), and hold the visit's dwell until 6 s after that. Or give `login_aloud` priority
over queued lines from other speakers.

### m2. A borrow replaced or reset is never reported, so its hand-over stays open until a reload

`npc-needs.js:1613` overwrites `s.borrow` when a run with a different index or hand arrives while
one is held. `reset()` (`npc-needs.js:514-535`) reports workaround visits as dropped (B review R1
m4) but not a borrow. In both cases neither `npc_borrow_done` nor `npc_borrow_dropped` fires for
the old borrow. The runner's job for it stays `running` in `active` (`npc-workarounds.js:117-122`),
and the server's hand stays handed, so that workaround does not come round again until a reload.
Example: an NPC with two `borrow_session` workarounds, both in force, handed over at successive
failures. Fix: in `setBorrow`, emit `npc_borrow_dropped` for a held borrow that is not started
before replacing it; in `reset()`, emit it for every held borrow. Add tests for both.

### m3. `started` is never read; a borrow cut short after sitting down is dropped or sits again

`_startJob` sets `s.borrow.started = true` (`npc-needs.js:2528`), but `_tickBorrow`
(`npc-needs.js:1632-1638`) only tests `s.job.borrow === b`. Suppose the borrowed job is aborted
in its `using` phase: the player starts a conversation with Ian at the hot desk (the
`unavailable` abort at `npc-needs.js:1234`) or a mapping suspends him. `npc_sat_at` has already
displaced the player's session. If `startBy` has passed, the borrow is dropped at once (posted as
dropped, no guest). If it has not, Ian sits down again and `npc_sat_at` fires a second time. The
plan says only "if the job has not started 60 seconds after the hand-over". Pick a rule (for
example: a borrow that has reached `using` and is cut short counts as done, with the session
left), use `started` for it, and add a test. Otherwise remove the field from the state and from
`getState().borrow`.

### m4. A claim still in flight when an NPC sits down leaves the player signed in beside them

`pc-sessions.js:305`. After the answer, `claim` ends an owner claim if the owner came back while
it was in flight. A guest claim skips that check (`!guest`), and neither kind checks
`presence().userId`. Sequence: the player clicks the hot desk and the guest claim is sent. Rosa,
whose borrow is in hand, sits down before the answer: `npc_sat_at` displaces nothing (no session
yet) and `onSatAt` removes Ian's guest record. The claim then succeeds and
`openLoginDesktop` opens Ian's desktop while Rosa is seated there. For a careful guest no
`npc_borrowed_session` follows, so nothing ends it. Fix: after a successful claim, if
`ws.presence(pcId).userId` is set, end the session with `displacedMessage(name)` as `displaced`
does. Test it with a dispatcher that fires `npc_sat_at` between the request and the answer.

### m5. Only a borrower sitting down displaces a session or ends a guest

`npc-needs.js:2846` emits `npc_sat_at` only for a `borrowed` job. An NPC with no work plan whose
`work` need is met by an authored affordance on a sign-in PC is not stopped by `_otherDesk`,
which only applies to judged needs. That NPC can sit at the hot desk as an ordinary use. Then
the player's session there is not displaced, the guest record survives, and the player can claim
the earlier guest's session after that NPC leaves. Plan 6.4 says the session ends "when anybody
next sits at that PC". `test_access_work` has no such NPC today (each work NPC has a plan), so
this is latent. Fix: emit `npc_sat_at` for any `use` job that reaches `using` at a `lockType:
"login"` object, or make the validator warn when a hot desk is a candidate for an NPC without a
plan.

### m6. The claim kind and the "is using this PC" branch in `interactLoginPc` have no unit test

`unlock-system.js:312-345` gained `userAt` (a borrower at the PC gives "<name> is using this PC"
and `in_use`) and the guest claim (`guestOf`, then `claim(pcId, { as: 'guest' })`). No JS test
reaches either branch. `access-signin-routing.test.mjs` drives `interactLoginPc` but has no
`userId` or `guestOf` in its stubs, so a revert of either change would pass the suite; only
browser run H showed them working. Add two routing tests: a presence with `userId` and no owner
gives `in_use` with the borrower's name, and `onInteract` returning `accessed` with a `guestOf`
answer sends `claim: 'guest'`.

### m7. The leak scanner reads `sharedLogins` at the end of the game, not at each response

`tools/playtest/lib/access_leak_scanner.rb:556`. `heard_share_password` allows the password in a
`/npc_workaround` answer whenever the game's final `player_state.sharedLogins` lists the NPC.
Failure scenario: a server bug returns the password in the answer to an unheard share (or to
the tampered `heard: true` from `vault_room`), and a later share in the same game is heard. The
scanner passes the earlier leak because the final state lists Sam. Fix: allow only the first
heard answer per NPC, in response order, with the earlier answers still scanned. Or, if the
capture holds request bodies, require the matching request to carry `heard: true` with a
`room_id`. Add a scanner test with an unheard answer that carries the password, followed by a heard one.

### m8. "<name> is using this PC" now reaches HTML with a borrower's name

`unlock-system.js:323-324`: the message is built from `displayName` and `observations` and sent to
`gameAlert` without `plainText`. The owner case was already like this (observations may hold
intended markup), but H now uses this path for every borrower. At minimum, escape `name` before
building the message, or pass the name and the observations as separate plain text lines.

## Nit

- n1. `npc-needs.js:2837` emits `npc_visit_arrived` through `_emit`, which calls `_worldChanged()`
  and clears every NPC's select back-off on each visit arrival, in every scenario with visits (A's
  check visits too). The comment at `:2843` shows the pattern to follow: use `this.world.emit` for
  an event that changes no world state.
- n2. `npc-needs.js:2002`: the borrow exception in `_otherDesk` is unreachable for the borrowed
  need, because `_useCandidate` returns through `_borrowCandidate` before it filters with
  `_otherDesk`, and `_queueCandidate` is only reached from inside that filter path. Remove it, or
  say in the comment that it is a guard only.
- n3. `npc-needs-work.test.mjs`, first H-3 test: "the caffeine need never takes the hot desk"
  cannot fail, because `HOT()` satisfies only `work`. To test "the failing need only", give
  the hot desk a second need it satisfies and check that need still goes to its usual source.
- n4. `test-bridge/access.js:50` reads `ws.guests` directly, so a guest whose `lockAt` has passed
  is reported until the next tick's `checkAutoLocks`. Calling `ws.guestOf(pcId)` first applies the
  lock. A playtest that steps the clock past `lockAt` and reads `guest()` straight away gets a
  stale answer.
- n5. `presence()` (`workstation-state.js:225-231`) calls `guestOf`, which can emit
  `workstation_auto_locked`. Callers treat `presence` as a read. It does no harm today (the same
  as `isLocked`'s late roll), but a comment would help.
- n6. `setBorrow` leaves the need at exactly `urgentAt` (`npc-needs.js:1617`, and `_unpark` does
  the same), so its score is 0 on the first select and any interest or due print errand outranks
  it. An NPC with interests does not "get up at once" (plan 6.4) and starts only a tick or two
  later, once decay pulls the level below `urgentAt`. If the plan's wording matters, set the
  level a little below `urgentAt`.
- n7. README_scenario_design.md, the `borrow_session` row says the NPC "walks back, leaving it
  signed in". The next bullet covers the careful guest, but the row could add "(unless a careful
  guest, below)".

## Points checked and found sound

- The 60 s drop counts from the hand-over on the needs clock. It does not fire while the
  borrowed job runs, and a busy or missing PC is waited for with no park (tests cover both).
- Borrow-first applies only to `s.borrow.need` and skips the quiet magnet look. A failed borrowed
  use parks without counting (`_turnBack` with `borrowed`), and `_failUse` now reads
  `job.borrowed`, which is the same as before when there is no borrow.
- `_completeJob` order: verdict with the borrow's routes, then `npc_borrowed_session` and
  `npc_borrow_done`, then the failed turn-back. The test checks the order of the emits.
- Displacement: one `/logout` per held session of every kind, `pc_signed_out` with
  `reason: 'displaced'`, and the plain text close message (`_closeDesktop` through pc-sessions.js:443).
  A guest claim is never ended by `ownerReturned`.
- The cellBeside fix (`553c4b8a6`): the first reachable side, using the visitor's leash, with a
  fallback to the first walkable side. Without a visitor no route is searched. The tests fail if
  the fix is reverted. Nothing from the earlier guess `911331406` remains.
- Reload: the guest records and the borrow are not saved. `resetGlobals` clears
  `<pc>_owner_away` and `<pc>_screen_locked` by name for rooms not loaded yet, and a resent borrow
  run is set afresh (or given back as dropped when the NPC is not registered, as B's visits are).
- B's hand-overs: `due` still starts each key once. A borrow that `setBorrow` refuses says no
  start line and is given back as dropped (R1 m5 holds). The guest event is emitted only from a
  `guest: true` answer, so a forged `npc_borrow_done` event sends nothing without a running job.
- The needs captures (`test_npc_needs`, `test_needs_leash`) do not reach the borrow, the visit to
  an NPC or `userOf`. Reading the code, each of those branches is gated as described in the
  summary. The one change that runs in every scenario with visits is n1's extra back-off clear.

## Verdict

Changes requested. Fix M1 and M2, each with a test, before merge. The minors can follow in
round 2 or go to the backlog with a note. m2 and m4 are the ones most likely to show up in a
playtest.
