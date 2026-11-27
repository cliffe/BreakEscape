# Access model slice 9.2, sub-slice H: code review round 3, server and client

Branch `build/9-2-h` at `c6bd2df1b`. The weight is on the round 2 fix commits `e9320f7e8` (server)
and `3c22cb90e` (client), read line by line against plan sections 6.4 and 6.5, both round 2
reviews, the build log's "H review round 2 outcomes" and the H entries in `docs/IDEAS_BACKLOG.md`.

## What was run

Ruby 2.7.8 for Rails, each file alone, no lock:

| File | Result |
|---|---|
| `test/controllers/break_escape/npc_workaround_h_test.rb` | 32 runs, 233 assertions, 0 failures |
| `test/js/access-signin-routing.test.mjs` | 17 of 17 pass |
| `test/js/npc-workarounds.test.mjs` | 52 of 52 pass |
| `test/js/toast-verbatim.test.mjs` | 2 of 2 pass |
| `test/js/workstation-state.test.mjs` | 49 of 49 pass |
| `test/js/pc-sessions.test.mjs` (unchanged, reads the same paths) | 31 of 31 pass |

## Would the tests fail without each fix (by reading)

| Fix | Test | Fails without it |
|---|---|---|
| Last done wins (guard removed) | "two borrowers queued at the hot desk" | Yes. With the guard, Ian's done at t+70 writes `guestSessionsAt` later than Dana's hand-over at t, so her done is skipped and `guestSessions.hot_desk` stays `ian` |
| `borrow_body` answers guest false once the record is not this NPC's | same test, Ian's resend at t+95; "a done resent after the guest session ended" | Yes. The old body answered `guest: true` from the scenario alone |
| Resolved PC id in the answer (R2 n2) and in the records (R1 n1) | "a borrow that names the PC by its name" | Yes. The raw value would be `Hot desk PC` in the answer, the record and `handed_borrow_pcs` |
| `unless via == 'claim'` | the guest claim test's new `guestSessions` assertion | Yes |
| Refusal deletes the timed-out record (R2 n3) | the timeout test's two `assert_empty` | Yes |
| `guestClaimRefused` | workstation-state "a refused guest claim locks", routing "a refused guest claim" | Yes. The method did not exist, and the routing test's `locked` list stays empty without the call at `unlock-system.js:367` |
| Search on unescaped text | npc-workarounds "the notebook search finds" | Yes (the import fails, and the old `includes` misses `s_okafor`) |
| Verbatim `pre-wrap` | toast-verbatim | Yes |
| Plain text owner alerts (R2 n4) | routing "the owner_returned and auto_locked alerts" | Yes |

## The three questions

**Who is the guest.** Both `/npc_workaround` and `/login` run under the game row lock
(`games_controller.rb:93-95`), so the server applies "done" posts one at a time in arrival order.
The client records a guest on each answer that says `guest: true`
(`npc-workarounds.js:300`). Two borrowers at one PC cannot sit at once, so their "done" posts are
at least one use apart and the answers come back in the same order. The server and client agree
in every honest case I traced:

- the queue (Ian first, Dana or Rosa second): both hold the second;
- an answer lost and resent after a later borrower's done: the resend is answered from
  `lastSpent`, writes nothing, and now says `guest: false`, so the client keeps the later one;
- a request lost before it reached the server and resent late: recorded last on both sides. Both
  then disagree with the sit order, but not with each other. This is the R1 n2 case, accepted;
- a resend after a claim and sign-out, or after a refused timed-out claim: `guest: false`;
- a careful second borrower: the server deletes the record, and the client deletes its own on
  that borrower's `npc_sat_at` (`workstation-state.js` `onSatAt`).

The one honest gap is narrow and on the client (n1 below). A tampered client can only spoil its
own record: the claim opens the server's guest (`claim_guest_session!` reads
`guestSessions[pc]`), and the guest's account and access list are checked there. What it can
choose is the order of its own "done" posts, so it picks which of two server-handed borrowers
becomes the guest (n2).

**`guestClaimRefused`.** On a 422 it does what the client's own lock does: drops the record,
publishes `<pc>_screen_locked`, and emits `workstation_auto_locked` with `guest: true`. The server
deleted its record in the same refusal (R2 n3), so both sides then have no guest. Every server
refusal is a 422, and the server's timeout always falls at or before the honest client's
`lockAt`, so a refusal caused by the timeout is never a wrong lock. The call sits on the
catch-all branch, though, so it also fires for a transport error, which is a wrong lock (m1).

**Notebook search.** `noteSearchText` (`note-markdown.js:94`) removes exactly the renderer's
escapes (same `ESCAPABLE`, same left-to-right `\\(.)` as `renderNoteMarkdown`), so the search
text equals what the notes page shows. A `\\` reads as one backslash, an unknown escape is kept,
and the title is searched as before. It is the only note search in the engine. Sound.

## Blocker

None.

## Major

None.

## Minor

### m1. A transport error on a guest claim locks a live guest session

`unlock-system.js:367` (`if (guestId) ws?.guestClaimRefused?.(pcId)`), with
`pc-sessions.js:294-295`: only a 422 becomes `reason: 'refused'`. A thrown 5xx, a 403, a timeout
or no network becomes `reason: 'error'`, which falls through to the same branch.

Failure: Ian leaves the hot desk open under `managed` (5 min). One minute later the player clicks
it while the dev server restarts (or wifi drops) and `/login` fails with a 502. The client drops
Ian's guest record, shows the locked screen and the padlock, and later clicks open the sign-in
screen with no claim. The server still holds Ian's guest record and would have granted the claim.
The beat is lost until another borrower leaves the desk open.

Fix: lock only on a refusal: `if (guestId && r?.reason === 'refused') ws?.guestClaimRefused?.(pcId);`.
On `reason: 'error'`, keep the record (the sign-in screen with `claim_refused` is the existing
behaviour, and a gameAlert with `r.message` would say why). Test: in
`access-signin-routing.test.mjs`, a guest claim answered `{ ok: false, reason: 'error' }` leaves
`locked` empty.

### m2. A borrower whose walk fails can never retry inside the start window, so the borrow always drops (the live Ian case)

`npc-needs.js:3026-3031` (`_failJob` sets `s.cooldowns[targetId] = clockMs + FAIL_COOLDOWN_MS`,
60 s), `npc-needs.js:1408-1409` (`_free` returns false during a cooldown),
`npc-needs.js:1592-1596` (`_borrowCandidate` needs `_free`), and `npc-needs.js:1639-1643`
(`_tickBorrow` drops at `startBy`, hand-over plus `BORROW_START_MS`, also 60 s).

A goto_target walk has a deadline of at least 20 s (`npc-needs.js:2765`). When the walk to the
borrowed PC times out (blocked by the player, another NPC or a corner), `_failJob` puts the hot desk
on a 60 s cooldown. `s.borrow` is still set, so the need's only candidate is the hot desk
(`_useCandidate`, `:1525`), and `_borrowCandidate` returns null for the whole cooldown. The
cooldown ends after `startBy` whenever the walk began after the hand-over, so the borrow is always
dropped. The build log's numbers fit exactly: handed at 66 s, walk ended about 18 s later (the
20 s needs-clock deadline), cooldown to about 144 s, dropped at its 126 s window while the desk
was free from 105 s. Both games gave the same result. `_tickBorrow` also drops a borrow whose job
had started, though plan 6.4 drops one that "has not started".

**My call on the logged item: acceptable for the queue, but a real minor in its own right, and
misfiled.** The queue's correctness does not depend on the client simulation's timing. The server
rule is deterministic and tested. The client half, recording on each answer and overwriting the
earlier guest, was exercised live by Rosa's two borrows. Ian's hot desk beat (H1) passed live in
run H (game 1221), and a dropped borrow comes round again at the next failure, so the feature
scenario does not lose the beat, it only loses time. That is why I do not rate it a major. Two
things are wrong, though:

- The cause is not client R2 m2 (a job aborted in `using`, keyed on `started`). It is the fail
  cooldown landing on the borrowed PC, and it turns any failed walk into a certain drop. The
  backlog entry (`docs/IDEAS_BACKLOG.md:192`) puts it under R2 m2 and suggests the player may
  have blocked the walk. Even if the player did block it, standing in the way is honest play.
- The queue itself (one borrower waiting while the other uses the PC) has never run live. The
  waiting path is `_borrowCandidate` returning null while the PC is claimed, and nothing has
  shown it in a browser.

Fix: in `_failJob`, when `job.borrow` is set, give the borrowed PC no cooldown, or one well under
the window (for example 5 s), so `_borrowCandidate` picks it again once it is free and `startBy`
stays the only bound. Tests in `npc-needs-work.test.mjs`: a borrow whose walk times out at 20 s
with the PC free is picked again and sits before `startBy`; a borrow whose PC is claimed by
another borrower is waited for and taken when that one leaves. Then rerun the browser check with
the player kept off Ian's path, and record whether the queue happened. Move the backlog sentence
to its own entry with this cause.

## Nit

- **n1.** `guestClaimRefused(pcId)` (`workstation-state.js:305`, called at
  `unlock-system.js:367`) drops whichever guest is recorded when the refusal comes back, not the
  guest that was claimed. Failure: the claim for a timed-out Ian is refused under the lock. Rosa's
  "done" is applied just after it and records Rosa, and her answer reaches the client before the
  refusal's (separate connections). The client then deletes Rosa while the server keeps her. This
  needs Rosa to finish within one claim round trip. Fix: pass the claimed `guestId` and drop the
  record only while `guests.get(pcId)?.npcId === guestId`; a unit test with a record that changed
  in between.
- **n2.** A handed borrow has no age limit on the server (`npc_frustration.rb:480`, checked at
  `:167-176` for the dwell only). With "last done wins", a tampered client that holds two handed
  borrows for one PC chooses which NPC is the guest, and when the server's guest timeout starts,
  by timing its "done" posts. It reaches only outcomes that honest play can reach (each borrow was
  handed by the server), and a wall-time bound would meet the needs-clock problem of R2 m1 again.
  Record it in the plan's tampering notes rather than fix it.
- **n3.** The comment on `record_borrow_done!` (`npc_frustration.rb:341-346`) says the posts
  arrive "in the order they left, which is the order the client records them in". Add "except a
  request that never reached the server and is resent late (accepted, R1 n2)", so the next reader
  does not take it as a guarantee.

## Verdict

No blocker, no major. The round 2 server major is fixed correctly. With both endpoints under the
game lock and `guest: true` only while the server's record is still that NPC's, the server and
an honest client agree on the guest in every case I traced, apart from the one-round-trip race in
n1. A tampered client cannot change whose desktop a claim opens. `guestClaimRefused` locks
correctly on a refusal, and the timeout can never refuse a claim the client should have kept. It
does lock wrongly on a transport error (m1, a one-line fix). The notebook search is right. Every
fix has a test that fails without it, and the changed test files pass alone.

On the logged Ian item: acceptable as far as the queue's agreement goes, but it is a separate
minor (m2) with a known, deterministic cause: the fail cooldown on the borrowed PC equals the
borrow's start window. Ready to merge once m1 is fixed. m2 should be fixed, or moved to its own
backlog entry with this cause, before `borrow_session` is used in a mission, and the queue should
then be shown live once.
