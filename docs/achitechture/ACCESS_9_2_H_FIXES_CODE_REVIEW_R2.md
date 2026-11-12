# Access 9.2 H fixes (q42, q43, q44): adversarial code review, round 2

Branch `build/h-fixes` against `main` (`git diff main...build/h-fixes`), with round 1's fixes
(327fcc9fa, b96e427d0, 62f36f038). Read with `ACCESS_9_2_H_FIXES_BUILD_LOG.md` and
`ACCESS_9_2_H_FIXES_CODE_REVIEW_R1.md`.

Counts: 0 blocker, 0 major, 1 minor, 3 nit.

## What was checked

- Every changed line in `npc_frustration.rb` (`complete_npc_workaround!`), `games_controller.rb`
  (`npc_workaround`), `npc-workarounds.js` (`borrowDone`, `_send`, `lineSaid`, `visitDropped`),
  `npc-needs.js` (`mutter`, `_tickMutterWaits`, `cancelMutter`, `holdVisit`, `_borrowDone`,
  `_abortJob`) and `workstation-state.js`, against the hand-over path (`fail_report!`,
  `choose_run!`), `record_borrow_done!` and `claim_guest_session!` in `game.rb`.
- Mutation runs in this worktree, each file put back at once (table under "Tests"). Single test
  files only, per the test lock rule. Baseline: `npc-workarounds`, `npc-needs-work` pass;
  `npc_workaround_h_test.rb` 34 runs, 0 failures.

## `cut: true` under the cheat-resistance rule

**Can a tampered client send `cut: true` to get a guest session at once?** Yes. A client that
holds a borrow hand-over can post `{ dropped: false, cut: true }` the moment the hand-over arrives,
and the server writes the guest record with no wait. Before R1's fix the same client had to wait
the floor (`useSeconds` less 3 s, from the hand-over) and then post a plain "done". So `cut`
removes the only timing bound on that write.

**What the server still checks**, all on its own state:

- the NPC is known (`encounteredNPCs`), and the index names a `borrow_session` that is
  performable: an account holder, a real sign-in PC, not headless, with no owner;
- the hand-over is real: the server made it (`handed[index]` with the same `hand`), and it is not
  spent. A hand-over comes only from a counted fail, which needs a cause that belongs to the NPC
  and holds on the server, an object in the NPC's places, the server's pace floors and a level at
  or above the workaround's `at`. A client cannot make one appear at will;
- `record_borrow_done!` writes no guest for a careful guest or a borrower locked out at that PC;
- the later claim (`claim_guest_session!`) checks the PC is reachable, holds no session, admits
  the guest's account, has no `autoLockMin` of 0, and that the guest is not careful.

The server does not know the walk or the sit, and never did. The floor counted wall time from the
hand-over and could not tell a borrower who walked over and sat from one who never moved.

**Verdict: an acceptable best-effort step, not a password bypass.** The guest session is the
designed workaround. Every honest player gets the same session once the borrower leaves, with no
password, and the server's checks on whether this NPC leaves sessions open, can sign in there,
and whether the PC admits it, are unchanged. What `cut` gives a tampered client is time, and less
of it than it looks: an honest player can already cut the use short a moment after the sit (a
knock-out works), so after q43 the honest earliest time is the walk plus a moment, not the floor.
A tampered client saves the walk. No secret is skipped that the honest path keeps.

A server-measured bound "since sitting" cannot be built: the server learns of the sit only from
the client, which a tampered client controls. A small fixed floor for a cut "done" (a few seconds
from the hand-over) would claw back only the walk, and an honest cut inside it would be refused
and resent, reopening R1's M1 gap for that long. Not recommended. If the user wants the walk
enforced, it needs walk times on the server (room distances), which is a new design, not a fix.

### m1 (minor): the comment and build log overstate it as "no weaker than the floor"

`complete_npc_workaround!`'s comment says the cut "done" is "No weaker than the floor: a client
could always wait it out", and the build log repeats the reasoning. That is true of the outcome
and false of the timing: a tampered client no longer waits anything. The cheat model is a record
the user relies on, so it should say what was traded. Suggested wording for the comment: "A
tampered client can send it at the hand-over and skip the floor. Accepted (q43 R2): the guest
session is the designed workaround, its secret checks are unchanged, and an honest player can cut
the use short a moment after the sit; the server cannot see the walk or the sit." Put the same
line in the build log's M1 entry, and in the access model plan's cheat notes if it keeps one for
9.2 H.

## Priority queue (`PRIORITY_MUTTERS`)

- **No loop.** `mutter()` only queues or says; `_tickMutterWaits` walks the queue once per tick
  and never calls `mutter()`. `_sayMutter` emits `npc_mutter`, whose handler `lineSaid` only calls
  `holdVisit`. Nothing re-queues.
- **No starvation.** Only `login_aloud` is a priority topic, asked once per share visit, and share
  visits come from server hand-overs held to the server's pace floors. A held priority line (its
  NPC in a conversation, hidden, KO) is skipped in the tick, so it does not block ordinary lines
  behind it while the lock is free. Every waiting line, ordinary or priority, gets its picture at
  `MUTTER_WAIT_MS` or is dropped if held, so nothing waits for ever. The cost to ordinary lines is
  one lock slot per share line; in a long queue the last ones may turn into pictures one slot
  sooner than before. Accepted.
- Two priority lines keep FIFO order, and a priority line with the lock free and only ordinary
  lines waiting is said at once (both tested).

### n1 (nit): the share line now overtakes its own NPC's start line

A share's start line (`wk_share_login`, asked at the hand-over) is an ordinary mutter. When the
queue is long enough for the NPC to walk over before it is said, which is the m2 case,
`login_aloud` goes ahead of it, and the NPC says the shared login and then "I'll go and ask" after
it. The m2 test enshrines the order for other topics (Dana's `wk_writes_down` and `wk_prop_door`
come after her `login_aloud`). A start line still waiting at arrival is stale anyway: drop it in
`visitArrived` with `cancelMutter(job.npcId, 'wk_share_login')` before asking for the line, and add
a case to the m2 test.

## The "done" resent after a network loss

With `cut` there is no 425 for a cut-short borrow, so the only gap left is a lost request:

- answer lost after the server processed it: no gap. The resend is answered from `lastSpent` and
  writes nothing (tested in the Rails case);
- request lost or a 5xx: the runner resends after `retryDelay`: 2 s, then 4, 8, 16, 30 s for each
  further loss. The window is the time for `fetch` to fail plus that delay.

### n2 (nit): the window has no upper bound on the first try

`ApiClient.post` sets no timeout for `/npc_workaround` (only `npc-reports.js` passes a signal), so
a request that stalls on a dead connection waits for the browser's own network error before the
2 s resend starts. On a dropped Wi-Fi link that can run to tens of seconds. In that window the
player must also reach the hot desk and complete a password sign-in, which needs the borrower's
password over the same broken link. Narrow, as the build log says. If it is ever closed, an
`AbortSignal.timeout` of a few seconds on this call bounds it to about 2 s plus the timeout; no
change asked for now.

## Tests: does each fail without its change?

| Change put back | Result |
|---|---|
| server floor for `cut` removed (`dwell = workaround_dwell(w)`) | both new Rails cases fail |
| controller takes any present `cut` | Rails: the `cut: 'yes'` assertion fails |
| server skips the floor for `cut` on any kind | Rails: the share case fails |
| runner never sends `cut` | `npc-workarounds` "long use cut short ... says cut" fails |
| `_abortJob` passes no reason to `_borrowDone` | that test and both q43 abort tests in `npc-needs-work` fail |
| priority off (`priority = false`) | both m2 tests fail |
| priority waits behind every line (`ahead` from the whole queue) | the "lock free, only ordinary lines waiting" m2 test fails |
| `visitDropped` does not cancel the line | the n3 test fails |
| `holdVisit` leaves `useRemaining` | the n1 test fails |
| `pc_signed_out` snapshot for every reason | the n4 test fails |

### n3 (nit): the "resend does not end it" assertion is reached only behind the first

In the second Rails case the resend assertion runs only after the cut "done" was accepted. With the
floor put back, the case fails on the first assertion, so the resend line is never tested on its
own. It is covered by the pre-existing `lastSpent` path and needs no change; noted so nobody reads
the mutation result as proof of both lines.

## Not found

No blocker or major. The cut path writes nothing a plain "done" after the floor would not write,
and all of the server's secret checks still apply. q42 and q44 code is as round 1 left it, apart
from the fixes above, each of which is tested and fails without its change.
