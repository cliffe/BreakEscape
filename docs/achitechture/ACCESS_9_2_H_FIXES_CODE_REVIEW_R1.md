# Access 9.2 H fixes (q42, q43, q44): adversarial code review, round 1

Branch `build/h-fixes` against `main` (`git diff main...build/h-fixes`, commits 4761ab89c, 79610def9,
0b14087fa). Read with the build log `ACCESS_9_2_H_FIXES_BUILD_LOG.md` and the user decisions q42 to
q44 in `docs/handover/2026-11-11_USER_DECISIONS.md`.

Counts: 0 blocker, 1 major, 2 minor, 6 nit.

## What was checked

- Every changed line in `npc-needs.js`, `npc-workarounds.js`, `pc-sessions.js`,
  `workstation-state.js` and `scripts/validate_access_work.rb`, against the speech lock and mutter
  queue (`mutter`, `_tickMutterWaits`, `_pickBark`), the freeze rule for a conversation, the
  `unavailable` abort, and the server side (`npc_frustration.rb` workaround "done", dwell floor,
  `record_borrow_done!`, `borrow_body`; `game.rb` `logout_session!`, `claim_guest_session!`).
- Mutation runs in a separate detached worktree (now removed), each source file put back to `main`
  in turn (results under "Tests").
- Live runs on my own keyless server on :3045, `test_access_work` started in `open_office`, drivers
  in the session scratchpad `hrev_live/`:
  - game 1432 (contention): Jake and Leo were brought into `open_office` by real needs visits. As
    Sam arrived beside Ruth, both said a `work_fail_fed_up` line through `mutter`, and a tick hook
    made them talk again whenever the lock came free while Sam's line still waited. The player
    waited in `lock_room`, out of earshot (`playerHears` false at arrival).
  - game 1433 (conversation): the same set-up, then the player walked up and talked to Sam during
    the wait and held the conversation 25 s.
  - game 1434 (KO): the same set-up, then `debugKO('sam')` 2 s after arrival.

## q42: the listening window opens when the line is said

Under real contention it works. Game 1432, needs clock ms: Sam arrived at 165250. Lines then went
in queue order: his own start line (`wk_share_login`, still waiting from the hand-over) at 165500,
Jake at 169500, Leo at 173500, and `login_aloud` at 177500, 12250 ms after arrival. The old window
(arrival plus 6 s) had closed 6 s earlier. The player walked in only after `npc_mutter:sam`
`login_aloud` and stood by Ruth. The visit ended at 183500, exactly 6000 ms after the line.
`POST /npc_workaround` went with `heard: true, room_id: "open_office"`, the "Overheard: Sam Okafor"
toast showed and the task completed. The extra chatter Jake and Leo started while Sam waited never
jumped ahead of him: `_tickMutterWaits` runs before `_tickNpc`, chats and calls in each tick, and
`mutter()` queues behind any waiting mutter, so the wait is bounded by the lines already queued.

The builder's proof (game 1398) did not show this. The player was already in earshot at the
`sign_h4` spot before walking ("hears before walking: true" in `share2.out`), and the only wait was
Sam's own start line.

Can `holdVisit` strand an NPC? I found no way:

- **KO** (game 1434): the `unavailable` abort dropped the visit at once and the runner posted
  `dropped: true`. The queued `login_aloud` stayed held, since `_mutterHeld` covers KO, and was
  dropped at 20 s. Sam's later mutters show no late `login_aloud`.
- **Conversation**: a conversation freezes the visit (`useRemaining`) and holds the mutter; it never
  aborts the job. In game 1433 the line came at +12250, just before the chat opened, so only the
  freeze was exercised live: 5500 ms of window was kept through a 25 s chat, the visit finished after
  it, and the share was heard. The held-and-dropped path (a chat longer than 20 s that starts before
  the line) is checked from the code. No `npc_mutter` fires, `awaitingLine` stays true, and the
  visit ends when the hold (`LINE_WAIT_MS` plus dwell, frozen time excluded) runs out. It is posted
  not heard. Bounded.
- **Script move or suspend**: an abort, so `npc_visit_dropped` and a dropped post.
- **Room change**: the speech lock and the hold do not depend on the player's room. An NPC that is
  not placed skips its tick entirely (`if (!pos) return`), which was already true of every visit.
- **Reload**: the needs state is rebuilt and the server resends the run. A fresh runner job has
  `listening === undefined`, so the new arrival asks for the line again.

## q43: "counts as done, session left open"

What the decision implies: the wording comes from the backlog item ("a borrow that reached `using`
counts as done with the session left, emitting `npc_borrowed_session` and `npc_borrow_done`"). So
"done" is about the hand-over: it is spent as done, the guest record is written, `setGlobal` is set
and the PC is left signed in. It says nothing about the NPC's need. The branch does exactly that.
The runner posts `dropped: false`, the server runs `record_borrow_done!`, `borrow_body` answers
`guest: true`, and the workstation layer records the guest.

`met: false` is consistent with that reading, and the parts agree with each other:

- The need is not restored, there is no `npc_used`, no `rearm` and no `ease` report. The server's
  frustration is not eased, so `easeAt` is not written.
- C2's `needMet` predicate (`easeAt[need]` later than `failAt[need]`) therefore does not fire, while a
  `workaround: "borrow_session"` predicate does (`lastSpent[...].done` is true). "The NPC did the
  workaround" holds and "the NPC is working again" does not, which is the truth of a use cut short.
- The server guest record and the client guest record agree (live game 1399 and the unit tests).

The other reading (the use counts as met) would restore the need and ease frustration for work that
never happened. I would not recommend it. But the user should know what follows from `met: false`
(minor m1): the borrower is still in need, fails again and can be handed the hot desk again.

### M1 (major): a cut-short borrow's "done" can be refused as too early, and the late "done" then ends a session the player opened meanwhile

The server floor for a borrow's "done" is `borrow_dwell` = the PC's `useSeconds` minus 3, counted
from the hand-over (`npc_frustration.rb` step 4). A full use always clears it, because the borrower
walks there and then stays the whole use. A use cut short soon after sitting does not. The runner
gets 425 and resends after `retryAfter`. In `test_access_work` the hot desk's `useSeconds` is 5 (a
2 s floor), so neither the unit tests nor the live proof can reach this. A mission hot desk with
`useSeconds: 30` and an 8 s walk, cut 3 s after the sit, waits about 16 s for its "done".

In that gap:

- The player's session was ended at `npc_sat_at`. The client has no guest yet (it records one only
  from the answer), the borrower has no job, and `userOf` is null, so a click on the hot desk shows
  the sign-in screen.
- A player who signs in there by password (with an overheard login, say) gets a server session.
  When the delayed "done" lands, `record_borrow_done!` runs
  `player_state['sessions'] = access_sessions.except(pc_id)`, which ends that new session, and writes
  a guest record. The client gets `guest: true` and emits `npc_guest_left`. `pc-sessions.js` still
  holds the player's password session and its desktop stays open, while the server has none, so
  later server checks at that PC refuse. The workstation layer now records a guest over the player's
  own session.

Before q43 a cut-short borrow was never reported done, so this path is new. Possible fixes, any one
of which closes it:
(a) the server skips the floor for a borrow "done" that says it was cut (`cut` present). That is no
weaker than today, since a dishonest client can already wait out the floor.
(b) `record_borrow_done!` keeps a session that was signed in after the hand-over time.
(c) the client takes a password sign-in at that PC while the borrow's "done" is in flight as ending
the borrow (post it dropped).
Add a unit test with a hot desk whose `useSeconds` exceeds the walk, and the server-side test for
whichever rule is picked. Option (a) also stops `guest_sessions_at` being stamped late: it is
written at the "done"'s arrival, which shifts `guest_session_timed_out?` by the retry delay.

### m1 (minor): PLAYTEST H7 and the q43 test name say the borrower does not sit again, but with the server he does

`PLAYTEST.md` H7 expects "Ian does not sit there again". The unit test is titled "...no second sit".
The builder's own live run (game 1399) shows Ian sitting at the hot desk again 33 s later, from a new
hand-over. His need was left unmet, he failed at his own PC again and the server handed the hot desk
over again. That second sit displaced the player's claimed session (`pc_signed_out` `displaced` at
116750). The unit test passes only because the stub world has no server to hand over again. Fix the
H7 expected result: "the cut-short borrow is done once. Unmet, Ian may be handed the desk again
later, which ends a session the player claimed there." Rename the test to "...no second sit from the
same borrow". If the user would rather a cut-short borrower did not come straight back, that is a
new rule, a frustration or cooldown choice, and a question for them, not a review fix.

## q44

### Slow `/logout` against the server

I traced the orderings of a borrower's "done" and a slow `/logout` at one PC against
`logout_session!` (it ends the guest only when the ended session was a claim of that same guest)
and `record_borrow_done!` (it deletes the PC's session, so a later `/logout` finds `ended` nil and
keeps the guest):

| Player's session | During the slow `/logout` | Server | Client (branch) |
|---|---|---|---|
| claim of Ian's guest | nothing | guest ended | snapshot is the live record: ended |
| claim of Ian's guest | Nia sits and leaves; her "done" is processed before the `/logout` | Nia kept | record replaced: kept |
| claim of Ian's guest | as above, `/logout` processed first | Ian ended, then Nia recorded | kept |
| claim of Ian's guest | Ian himself borrows again and leaves | Ian kept, either order | new record object: kept |
| claim of Ian's guest | Nia sits, not yet left | Ian ended | `onSatAt` already dropped it: nothing to end |
| password | a borrower leaves meanwhile | guest kept, either order | snapshot null: kept |

The two sides agree in every row. A password sign-in already ends a guest on both sides
(`pc_signed_in` not via claim; `game.rb` 2145). A restored claim ended on load snapshots `null`
because the client does not restore guests at all (pre-existing), so nothing changes there.

### Validator and hold queue

`check_hot_desk_reach` is right for `test_access_work` (no warning) and for the fixture. The
toast hold test drives the real `notifications.js`.

## Tests: does each fail without the change?

| Change put back to `main` | Result |
|---|---|
| `npc-needs.js` | `npc-needs-work`: H-3 (`started: false` on the way) and both q43 abort tests fail. `npc-workarounds`: the q42 needs-system test fails |
| `npc-workarounds.js` (whole file) | the test file fails to import (`LINE_WAIT_MS`), which proves nothing. A semantic mutation instead (listen from arrival, `lineSaid` a no-op, exports kept) fails all four q42 tests |
| `pc-sessions.js` | the q44 `pc_signing_out` test fails |
| `workstation-state.js` | both q44 slow-logout tests fail |
| `validate_access_work.rb` | the q44 hot desk test fails |
| `notifications.js` held entry with `verbatim: false` | the verbatim hold test fails |

The new caffeine test passes on `main` too, which is correct: it guards against a regression, and
`main` already sends caffeine to the coffee. The builder's mutation (the borrowed PC leading every
need) is the right check for it. I did not repeat that one.

## Minor and nits

- **m2 (minor), q42:** the share's line waits behind every queued mutter in FIFO order, about 4 s
  for each line ahead (game 1432: three lines ahead cost 12250 ms). Five or more hand-over lines
  queued at once, as when one outage hits several NPCs, run past `MUTTER_WAIT_MS`. The line then
  becomes a picture and the share ends unheard while the player stands beside it. The window rule is
  right. The open question is whether `login_aloud` should go to the head of the queue (the backlog
  offered "give the topic priority over the lock"). Small, and worth a test with five queued lines.
- **n1:** on the tick a conversation ends, `_tickMutterWaits` can say the line and `holdVisit` sets
  `useUntil = now + dwell`. Then the same tick's unfreeze in `_tickNpc` overwrites it with
  `now + useRemaining`. `useRemaining` is at least the dwell in every reachable case (the freeze
  started before 20 s), so the window only gets longer. Harmless, but `holdVisit` could also set
  `useRemaining` when the job is frozen.
- **n2:** a conversation that starts before the line and lasts over 20 s drops the line, so the
  share is unheard although the player is talking to the sharer. The same as before the branch. Note
  it in the H6 row or the plan.
- **n3:** after a share's visit is dropped (KO, suspend), its queued `login_aloud` stays queued. If
  the NPC is available again within 20 s, the line is said with no job behind it. The line is
  generic and the capture comes only from the server, so nothing leaks. `visitDropped` could remove
  the wait.
- **n4:** `workstation-state.js` passes `fromSignOut = true` for every `pc_signed_out`, whatever
  the reason. If the player signs in again at the same PC while the first `/logout` is slow, and
  that session is displaced or switched, the `displaced` or `switch` event uses up the snapshot, and
  the later `sign_out` event ends the guest the old way. A second sign-out in flight also overwrites
  the snapshot. Narrow. Keying the snapshot on the reason, or passing `true` only for the four
  reasons that send `pc_signing_out`, closes it.
- **n5:** the comment in `_abortJob` lists "a conversation" among the cuts. A conversation freezes
  the job and never aborts it. The causes are a script move, a suspend, a KO or hide
  (`unavailable`) and a turn-back.
- **n6:** the validator test is titled "...a leash or a judged need is not" but has no case where the
  desk serves a judged need of a non-borrower. The clean fixture only shows that no warning is raised
  for the borrower's own judged `work`.

## Not found

No blocker. No server-side change was needed for q44, and none is in the diff. The Rails suite was
not needed, and the build log says so correctly.
