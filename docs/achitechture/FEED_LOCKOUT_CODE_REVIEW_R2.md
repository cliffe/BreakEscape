# Feed and lockout (q36, q37, q38): code review round 2

Branch `build/feed-lockout` at 15b103f5e, reviewed as `git diff main...build/feed-lockout`, with
the build log and `FEED_LOCKOUT_CODE_REVIEW_R1.md`. q33 R2 m5 is the user's q35 decision and is
not raised again.

Counts: 0 blockers, 0 majors, 1 minor, 2 nits.

## Round 1 fixes checked

- **R1 m1, the borrowed hold limit.** In place and bounded. The limit is counted from when the hold
  begins (`job.lockHeldAt`, set at the end of the use), not from when the check was sent at
  sit-down, so the check has the whole use plus `BORROW_CHECK_WAIT_MS`. The check stays in
  `lockCheck` after a lapse, and a late answer still flags the PC (`asked` in `_applyLockCheck`).
  The no-op restart line is gone. What happens at the lapse is the minor below.
- **R1 m2, per-borrower marks.** Correct. A borrow check's "no" writes `borrowCleared`
  (`pcId|npcId` to the lockout count then), and `borrowSeen` turns true again for that borrower
  once a new lockout answer raises the count. The station path still clears per PC. A refused or
  lost answer leaves the mark. `borrowCleared` lives in memory only, so a reload costs at most one
  extra check per borrower, seeded from `lockoutPcs`.
- **R1 m3, work at a borrowed desk.** The user kept it. `atBorrow` covers `work` and
  `social_media`, `borrow_locked_out?` refuses a work ease, and L2 shows it live (below).
- **R1 m4, met_use route tests.** The three `feed_post_test.rb` cases go through `/feed_post`.
  The 6 s and refused-source cases fail if `social_feed.rb` drops `met_use`: without it the
  selection finds nothing and answers `{ post: nil }` before the source check, so `refused` is
  missing. The 4 s case checks that nothing is written.
- **R1 n4, the stale-id drop in `feed_shown_ids`.** Safe for the client and for saves. A game's
  `scenario_data` is a snapshot made once at creation (`Game#generate_scenario_data`, before
  create; `wearables.rb` notes that nothing regenerates it), so an id the scenario lacks can come
  only from a hand-edited save. On the client, `index` is used only to order a profile's posts
  (`SocialFeed#_add` sorts by it and dedups by post id). Nothing stores it, and a reload rebuilds the
  list from GET /scenario. `revealed`, the next post's index, the pace floor and GET /scenario all
  read the same filtered list, so they agree. The stored array keeps the stale id until the next
  write, which drops it, and every reader filters it out first.

## Live check (keyless server on port 3050, headless, new games)

| Game | Beat | Result |
|---|---|---|
| 1476 | L1 | Three wrong passwords on Sade's tile at `l1_hot_desk`: "2 attempts left", "1 attempt left", "This account is locked on this PC". When she sat down: one check, `locked_out` at `l1_hot_desk` half a second later, task `l1_locked_out`. At the end of the use: `use_failed` social media, task `l1_borrow_failed`, no `npc_used`. Server: `loginLockouts` `["l1_hot_desk\|sokafor"]`, `npcFrustration.sade.lockedOut` `["l1_hot_desk"]`, `easeAt` empty, `guestSessions` and `feedRevealed` empty; GET /scenario has the same `lockedOut`. From the page, `/feed_post` and a social media ease for her at the hot desk both answered `refused: true` |
| 1481 | L2 | The same for Hamid at `l2_hot_desk` (work): one check, `locked_out` 250 ms later, task `l2_locked_out`, `use_failed` work, task `l2_borrow_failed`. Server: `loginLockouts` `["l2_hot_desk\|hrahimi"]`, `lockedOut` `["l2_hot_desk"]`, `easeAt` and `guestSessions` empty. A work ease from the page: `refused: true`. Leak check over the captured responses: `VERDICT: no leaks found` |
| 1483 | L1, check answer slowed to 12 s in the page | The hold began at the end of the 10 s use, the answer came 2.25 s into it, and the use failed as in 1476 |
| 1487 | L1, check answer slowed to 18 s in the page | See m1: `lock_check_lapsed`, then a met use |

The slowed runs wrap `window.npcReports.deps.send` in the page to delay a batch that holds a
check. The server is not touched. Games 1476, 1481, 1483 and 1487 are left in the shared dev
database. Touched test files, run alone: `npc-lockout.test.mjs` and `npc-reports.test.mjs` 40 pass;
`feed_post_test`, `access_work_feed_select_test`, `social_lockout_q33_test` and
`access_helper_equality_test` 65 runs, 376 assertions, 0 failures.

## Minor

**m1. A borrowed hold that lapses lets the locked-out use through as met.**
`npc-needs.js` `_completeJob`, the `atBorrow` branch. Past `BORROW_CHECK_WAIT_MS` the use goes
ahead "as if not locked out". The station lapse does the opposite: it skips the use unjudged. The
limit is the use length plus 5 s of needs clock (15 s for L1), but the queue allows a send
`SEND_TIMEOUT_MS` (20 s) and then one resend. So a slow but working server, or one first send
that times out, lets the locked-out borrower look as if it used the PC. Game 1487, with the answer
18 s late: `use_held`, `lock_check_lapsed` 5 s later, `npc_used` social media at `l1_hot_desk`,
`npc_borrow_done` with `met: true, leftOpen: true`, and the feed request answered `refused`. The
`locked_out` flag landed 3.25 s after the use ended. The server held throughout (no ease, no
guest record, no post; the player's click on the hot desk shows the sign-in, not an open
session). But the player saw the q36 gap, a met use with nothing behind it, on exactly the path
q36 was meant to close.
Fix: make the lapse fail closed, as at the station: end the use unjudged (nothing restored, no
`npc_used`, no ease or feed request, `_borrowDone` with `met: false`) and leave the check in flight,
so the next borrow there waits again. Or set the limit to cover two send timeouts. Either way the
NPC cannot sit at the desk for ever, which was R1's concern. Change the "goes ahead" JS test to
expect no `npc_used`.

## Nits

**n1. The two clocks.** `BORROW_CHECK_WAIT_MS` runs on the needs clock (`NEEDS_TICK_MS` per tick,
which stops while the game is paused), and `SEND_TIMEOUT_MS` runs on wall time. While the game is
paused the send can time out but the hold cannot lapse, and that is harmless. The comment in
`npc-reports.js` ("its use waits at most BORROW_CHECK_WAIT_MS") reads as wall time. Saying "needs
clock" there, as the constant's own comment does, would be enough.

**n2. A station "no" still clears the mark for the whole PC.** `flush` deletes `lockoutSeen` on
a station check's "no". If a PC is one NPC's sign-in `needsHome` and another NPC's
`borrow_session` target, the owner's "no" would also clear the borrower's mark. No scenario does
this, and this review did not check whether the validator allows it. If it is possible, key that
deletion so it spares borrowers, or note the limit beside R1 m2's comment.
