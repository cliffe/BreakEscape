# Access model slice 9.2, sub-slice H: code review round 2, server

Branch `build/9-2-h` at `6192486b6`, reviewed against `main` (`git diff main...build/9-2-h`), with
the round 1 server fixes (`dd04e6934`) read line by line. Read against plan sections 6.4, 6.5 and 9,
the round 1 server review and the build log's "H review round 1 outcomes".

## What was run

Ruby 2.7.8, single files, no lock:

| File | Result |
|---|---|
| `test/controllers/break_escape/npc_workaround_h_test.rb` | 30 runs, 207 assertions, 0 failures |
| `test/controllers/break_escape/npc_workaround_test.rb` | 29 runs, 180 assertions, 0 failures |
| `test/controllers/break_escape/npc_frustration_test.rb` | 38 runs, 236 assertions, 0 failures |
| `test/controllers/break_escape/capture_proofs_test.rb` | 26 runs, 151 assertions, 0 failures |
| `test/controllers/break_escape/capture_secret_endpoint_test.rb` | 3 runs, 7 assertions, 0 failures |
| `test/unit/access_leak_scanner_test.rb` | 29 runs, 216 assertions, 0 failures |
| `test/controllers/break_escape/access_model_login_test.rb` | 29 runs, 442 assertions, 0 failures |
| `test/controllers/break_escape/access_model_no_password_test.rb` | 14 runs, 194 assertions, 0 failures |
| `test/controllers/break_escape/access_model_desktop_test.rb` | 14 runs, 77 assertions, 0 failures |
| `test/controllers/break_escape/network_remote_signin_test.rb` | 18 runs, 133 assertions, 0 failures |
| `test/controllers/break_escape/network_footholds_test.rb` | 28 runs, 321 assertions, 0 failures |
| `test/controllers/break_escape/network_no_exposure_test.rb` | 10 runs, 1546 assertions, 0 failures |
| `test/controllers/break_escape/network_shares_test.rb` | 18 runs, 142 assertions, 0 failures |
| `test/controllers/break_escape/lab_physical_pentest_network_test.rb` | 4 runs, 255 assertions, 0 failures |
| `test/models/break_escape/access_work_plan_test.rb` | 9 runs, 143 assertions, 0 failures |
| `test/unit/access_work_test.rb` | 14 runs, 63 assertions, 0 failures |

`ruby -wc` under 2.7.8 on `game.rb`, `npc_frustration.rb`, `capture_proofs.rb` and
`access_leak_scanner.rb`: clean. Nothing newer than 2.7 is used.

## Round 1 findings, checked

| R1 | Status |
|---|---|
| M1 sign-out and password sign-in | **Fixed and tested.** `logout_session!` (`game.rb:1654-1666`) ends the guest record when the ended session is that guest's claim; `start_login_session!` (`game.rb:2074`) ends it for any non-claim sign-in, remote included. The sign-out test and the password test each fail with their line taken out. The extra `guest_sessions[key] == ended['id']` guard cannot be reached (n1 below) |
| m1 server timeout | **Fixed and tested** (`npc_frustration.rb:251-259`, `game.rb:1645`). 302 s granted, 304 s refused, no `autoLockMin` never times out. The clock mismatch with the client is real in honest play (m1 below) |
| m2 one declared set | **Fixed and tested** (`capture_proofs.rb:110-113`). Both readers now use the same set. I checked whether a tampered `se_captures` entry under a shared target id could ask for another account's password: it cannot, because `account_capture_passwords` still filters by capture route and proof |
| m3 capture note | **Fixed and tested** on the server (`npc_frustration.rb:429`) and in the scanner (`access_leak_scanner.rb:515-516`, `:546-556`). A `social` that is not a hash raises `TypeError` in `dig`, which is rescued |
| m4 colleague met | **Fixed and tested** (`npc_frustration.rb:360-362`). The R1 m4 test leaves only Ruth out of `encounteredNPCs`, so only this check can make it fail |
| m5 test gaps | **Fixed.** Foothold, headless, dropped borrow, need filter, `accounts`, and no exposure across `/npc_frustration`, `GET /scenario` with a synced `se_captures`, the room, `/login_accounts` and `/capture_secrets` |
| n1 PC by id | **Fixed in the records, untested**, and only half done: the answer still carries the raw name (m2, n2 below) |
| n2 a late "done" | **Changed, but the change breaks an honest case and does not cure the case it was aimed at** (M1 below) |
| n3 comment | Done (`access_work.rb:445-447`) |
| n4 check before the lock | The reason still holds, and the server's own timeout now bounds it |

Sub-slices U, A and B: their test files pass, and the merge of `main` brought no conflicts into the
server files. No regression found.

## Blocker

None.

## Major

### M1. The R1 n2 guard drops the later sitter's record in an honest queue, and its answer still tells the client to record the earlier one

`npc_frustration.rb:342-345` (`record_borrow_done!`: `return if later > handed_at`) and
`npc_frustration.rb:407` (`workaround_body`: `'guest' => !careful_guest?(npc)`).

The guard skips a "done" whenever a guest record was written after this borrow was **handed over**.
In an honest client, though, the hand-over is not when the NPC sits. A borrowed PC that is in use is
waited for, for up to 60 s of the needs clock (`BORROW_START_MS`, plan 6.4), so an NPC handed over
first can sit second.

Failure (honest play, `test_access_work`, where Ian and Rosa both borrow `hot_desk`): Rosa's third
failure hands her the borrow at t=100, and she sets off from Hall C. Ian's borrow is handed at
t=105. He is nearer, sits first and leaves, and his "done" lands at t=130: `guestSessions.hot_desk =
ian`, `guestSessionsAt = 130`. Rosa, who waited for the PC, sits, uses it and leaves, and her "done"
lands at t=155. The server sees `130 > 100` and keeps Ian's record. The client recorded Rosa from
her answer. The next click at the hot desk claims a guest session and the server opens **Ian's**
desktop (`claim_guest_session!` answers `npcId: ian`), though Rosa signed in there last. If Rosa had
been a careful guest, the server would keep Ian's open session after she signed out.

The guard does not fix R1 n2 either. In the lost-and-resent case the skipped "done" still answers
`{ pcId, guest: true }`, so the runner emits `npc_guest_left` (`npc-workarounds.js:300`) and the
client records the earlier NPC while the server keeps the later one. Only the direction of the
mismatch changes.

No test covers the queue. The R1 n2 test plants Rosa's record by hand, with a time later than Ian's
hand-over, which is exactly the queue's shape, so it pins the wrong behaviour.

Fix: go back to "the last done wins" (drop the `later` guard). Two honest borrowers then agree with
the client, and R1 n2's case (a lost request resent late) stays the accepted nit it was. If the
orchestrator wants both cases right, the server needs the sit order, which only the client knows.
The runner could send a sit sequence number (or the needs-clock time of `npc_sat_at`) with "done",
and the server would keep the record with the later sit. A tampered value only chooses between two
records the server itself wrote, so it gains nothing. Whichever way is chosen, a skipped "done" must
answer `guest: false` so the client does not record it. Tests: Rosa handed, Ian handed, Ian's done,
Rosa's done, then `guestSessions.hot_desk` is `rosa` and the claim answers `npcId: rosa`. Replace
the current n2 test.

## Minor

### m1. The server's guest timeout refuses an honest claim after a pause, and the hot desk then looks open but never opens

`npc_frustration.rb:251-259`, against `workstation-state.js:263` (`lockAt = clock + min x 60000` on
the needs clock) and `npc-needs.js:574-586` (the needs clock stops while the VM is active, while the
tab is hidden, and runs slow when frames are clamped by `MAX_FRAME_MS`).

The needs clock never runs faster than wall time, so the server always times a guest out at or
before the honest client's lock. The build log notes this. The effect is worse than "a little
before", though. Time on the VM is a normal part of a mission, and a hidden tab is common.

Failure: Ian leaves the hot desk open under `managed` (5 min). The player spends 4 minutes on the VM,
comes back and clicks the hot desk 2 minutes of game time later. The client still holds Ian as
guest with no lock due. The server is at 6 minutes of wall time and refuses. `interactLoginPc` opens
the sign-in screen with `claim_refused` (`unlock-system.js:367`). The client keeps its guest record
and the open-screen look and indicator, so every later click repeats the refusal until the client's
own lock fires. A student sees an unlocked PC that asks for a password.

Fix (either): on the server, make the timeout a ceiling for a tampered client rather than a mirror
of the client's lock, for example `autoLockMin x 60 x 2` or `+ 120 s`. It still bounds "claim at
any time until a reload", which is what R1 m1 asked for. Or on the client, treat a refused guest
claim as the lock: drop `guests[pcId]`, publish `<pcId>_screen_locked`, and show the locked screen,
so what the player sees matches. Test: a refused guest claim in the routing test leaves no guest on
the client. Neither path is tested today.

### m2. Two R1 fixes and one guard would pass their tests with the code taken out

The build log says every R1 fix has a test that fails without it. These do not:

- **n1, the PC by id** (`npc_frustration.rb:285`, `:339`): no test names the borrow PC by its
  `name`. Fix: a fixture whose `borrow_session.pc` is the hot desk's name; assert
  `guestSessions` is keyed by its id and the claim at the id succeeds.
- **`unless via == 'claim'`** (`game.rb:2074`): with the `unless` removed, a guest claim would end
  its own guest record at once. Every current test still passes, because nothing reads the record
  between the claim and the logout. Fix: assert `guestSessions.hot_desk` is still `ian` after a
  granted claim (the "guest claim succeeds" test is the natural place).
- **`guest_sessions[key] == ended['id']`** (`game.rb:1662`): see n1.

## Nit

- **n1.** The guard `guest_sessions[key] == ended['id']` in `logout_session!` (`game.rb:1662`)
  cannot be false when reached. A claim stores the guest's own id, and the only writer that changes
  the guest record (`record_borrow_done!`) clears `sessions[pc]` in the same step. The test "a
  displaced session's late /logout leaves the new guest record alone" (`npc_workaround_h_test.rb:415`)
  ends a password session that the done had already removed, so `ended` is nil and the guard is
  never read. The late-logout case is safe because of the clear in `record_borrow_done!`. Either drop
  the guard or keep it with a comment saying it is defensive, and correct the test's comment.
- **n2.** `workaround_body` answers `'pcId' => w['pc']` (`npc_frustration.rb:407`), the raw
  authored value, while R1 n1 now keys the server's records by the PC's id. For a PC named by its
  `name`, the client would record the guest under the name and the server under the id. This is
  defensive only, since the validator errors on an unknown id. Answer the resolved id there too.
- **n3.** A refused, timed-out guest record stays in `guestSessions` and `guestSessionsAt` until
  a sign-in, a sign-out or a reload (`game.rb:1645`). That is harmless for the claim, but it is the
  record the M1 guard compares against, and `verify-run` reads it as if it were live. Delete it in
  the refusal (under the same lock, since `/login` is locked).
- **n4.** A guest claim, once granted, is never timed out by the server. A tampered client can
  claim at t+1 s and hold the session until a reload. This matches an owner claim and gains nothing
  the claim itself did not give, so it is noted only.

## Verdict

No blocker. Every round 1 server finding is fixed, and the authority model still holds: a guest
claim needs a borrow the server handed over and timed, a share needs the colleague met and an open
room, and the shared password stays out of `se_captures` without `revealSecret`. One major: the R1
n2 guard makes the server keep the wrong guest when two honest borrowers queue at one hot desk
(which `test_access_work` authors), and its answer still makes the client record the skipped one. It
should be reverted, or replaced with a sit order from the client, with a queue test. Fix m1 (or
record it as a decision) because it shows in honest play after VM time. m2's tests are small.
Ready to merge once M1 is resolved and m1 and m2 are fixed or declined in the log.
