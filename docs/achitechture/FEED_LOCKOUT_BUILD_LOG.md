# Feed and lockout build (q36, q37, q38): build log

Branch `build/feed-lockout`, 2026-11-12. User decisions q36 (show the player a lockout at a borrowed
hot desk), q37 (the four server gaps m1 to m4 of `Q33_LOCKOUT_CODE_REVIEW_R2.md`) and q38 (the C2
code review R2 leftovers, plus the needMet tweak), in `docs/handover/2026-11-11_USER_DECISIONS.md`.

## What changed

### q36: a lockout at a borrowed hot desk

- **Server.** `AccessWork.lockout_pc?(data, npc, pc)` is the lockout-station test for any PC (sign-in
  PC, not owned by someone else, a policy with a positive `maxAttempts`, an NPC with an account);
  `lockout_station?` now calls it with the station. `check_report!` answers a `check` at a hot desk
  handed over to the NPC by a `borrow_session` (in `handed_borrow_pcs`, in an opened room, passing
  `lockout_pc?`), and a true answer records the PC in `npcFrustration[id].lockedOut` as for the
  station. GET /scenario's `npcFrustration[id].lockedOut` now carries the station and the handed-over
  hot desks.
- **Report queue** (`npc-reports.js`). A borrow path: `npc_sat_at:<pcId>` (a borrower sitting down)
  calls `onBorrowSat`, which sends a check when `shouldCheckLockout({ borrowed: true, ... })` holds:
  a lockout answer seen at that PC in this browser, a `maxAttempts` policy, not already flagged. No
  locked return and no needsHome test on that path.
- **Needs core** (`npc-needs.js`). `lockCheckSent` takes the PC of a borrow in use;
  `_applyLockCheck` takes an answer for a PC this owner asked about; the restore keeps every PC the
  server sends. At a borrowed PC with a check in flight, the use waits for the answer with no lapse
  (the queue answers every check, `lockedOut: false` when refused or lost). A flagged borrowed PC
  fails a work or social media use with `locked_out`; as before, a failed borrowed use is not reported.
- **README** "While locked out": a lockout at a borrowed PC now stops that use.
- Both needs: a locked-out borrowed use fails for work as well as social media, which follows q33's
  "a lockout stops every use of that PC". The backlog entry named social media only. The user
  confirmed this after review R1 (m3); L2 is the work beat.

### q37: q33 code review R2, m1 to m4

- **m1.** `ease_report!` refuses an ease (work or social media) at a handed-over hot desk where
  `lockout_pc?` holds and the NPC's username is locked out (`borrow_locked_out?`).
- **m2.** `reveal_feed_post!` judges the source after the pace floor: a probe inside the floor gets
  `tooSoon`, one outside it is refused or spends a post. Selection is pure and writes nothing, so
  running it before the source check changes no state. The docstring names the borrowed-PC case.
- **m3.** `feed_source_ok?` refuses the NPC's own station while its policy blocks social media or its
  `offWhen` holds.
- **m4.** The reviewer's second option: the lockout refuses a feed source only where a check would
  answer (`lockout_pc?`), so a station someone else owns (`screenOwner`) never stalls a feed in a way
  the honest client cannot learn. No validator warning was added.

### q38: C2 code review R2 leftovers and the needMet tweak

- **MIN-1.** `NpcFrustration#frustration_globals_hold?` removed; the equality test now checks
  `AccessWork.globals_hold?` over the game's merged globals with expected values.
- **NIT-1.** `feed_posts_for_client` skips a saved `shown` id the scenario no longer has (each kept
  post keeps its reveal index).
- **needMet.** A feed request is itself a met social media use, and it reaches the server before
  that use's ease (which waits up to 2 s in the report queue). `select_feed_post` now takes a
  `met_use` (`{ need: 'social_media', at: now }` from the feed route), and `need_met_now?` counts it
  once the need's last failure is at least `AccessWork::NEED_MET_QUIET_S` (5) seconds old. Still
  false for a need that never failed. The C2 plan carries an amendment note.

## Tests

- New Ruby: `social_lockout_q33_test.rb` (q36 checks at a hot desk: refused before the hand-over,
  recorded and restored after; false answer records nothing; no `maxAttempts` refused; R2 m1 ease;
  R2 m2 tooSoon then refused; R2 m3 blocked and off stations; R2 m4 not-owned station),
  `feed_post_test.rb` (stale shown id), `access_work_feed_select_test.rb` (needMet with a met use:
  quiet window, other need, never failed, `needMet: true`). The q33 helper `hand_over_borrow!` now
  reloads the game first, so a lockout made over HTTP before it is kept.
- New JS: `npc-lockout.test.mjs` (q36: lockCheckSent at the borrow PC only, held then failed on
  true and unreported, met on false, no lapse, an unasked answer ignored, the borrow path of
  `shouldCheckLockout`, `onBorrowSat`; the restore test now keeps the hot desk).
  `npc-reports.test.mjs` expects the `npc_sat_at:*` listener.
- Touched files alone: social_lockout_q33 18 runs, feed_post 23, access_work_feed_select 17,
  access_helper_equality 3, npc_lockout_l 18, all 0 failures; npc-lockout 29 pass, npc-reports 9,
  npc-social-lockout-q33 8, npc-needs-work 51, npc-workarounds 52, social-feed 23,
  npc-needs-social-media 19, validator-access-social 17, validator-access-reactive 10,
  playtest-verify-run-access 14, 0 fail.

## Scenario beat

`test_access_social` L1 (`l1_room`, east of `f13_room`): Sade Okafor, `"phone": false`, her PC
under `no_social`, a `borrow_session` to `l1_hot_desk` under `locking`. Tasks `l1_locked_out` and
`l1_borrow_failed`. `PLAYTEST.md` has the L1 row, the L1 tampered checks and the F13 note that
waiting is enough. Validator: 0 lines with ❌.

## Live proof (game 1383, port 3034, headless)

| Beat | Result |
|---|---|
| F13 by waiting | Entered `f13_room` and only waited. `f13_blocked` after 85 s, `f13_recovered` 90.5 s later. Server: `feedRevealed.ruth.shown` `["f13_blocked","f13_fixed"]`; the serve came at 542.35 (server time, last digits), `failAt.social_media` 530.11 and `easeAt.social_media` 542.41. So the ease landed 55 ms after the request, and the last failure was 12 s old: the new met-use rule served it, and the old rule would have read false |
| L1 lockout | Three wrong passwords on Sade's tile at the hot desk: "2 attempts left", "1 attempt left", "This account is locked on this PC" (`pc_signin_failed` `locked_out`) |
| L1 finding out | Two desk failures (`social_blocked`, level 25 then 50), the borrow handed over; `npc_sat_at:l1_hot_desk`, one check answered `lockedOut: true`, `npc_locked_out:sade` `objectId` `l1_hot_desk` 250 ms later, task `l1_locked_out` |
| L1 failed use | At the end of the use: `npc_borrow_done:sade` `met: false`, `npc_use_failed:sade` `missing [{l1_hot_desk, locked_out}]`, task `l1_borrow_failed`. No `npc_used:l1_hot_desk`, no `/feed_post` for Sade, no ease |
| L1 server | `loginLockouts` `["l1_hot_desk\|sokafor"]`; `npcFrustration.sade.lockedOut` `["l1_hot_desk"]`, `easeAt` empty; no `guestSessions.l1_hot_desk`; no `feedRevealed.sade`; GET /scenario `npcFrustration.sade.lockedOut` `["l1_hot_desk"]` |
| Tampered | From the page: `/feed_post` for Sade at `l1_hot_desk` answered `refused: true`; a social media ease for her there answered `refused: true` |
| Leak check | `VERDICT: no leaks found` (lockout_list 0, lockout_unrecorded 0) |

The session log and response capture are in the session scratchpad, not the repository. Game 1383
is left in the shared dev database (mission 245, `test_access_social`).

## Full suites

Under the shared lock: `bin/rails test` 1806 runs, 25626 assertions, 0 failures, 0 errors, 1 skip; `bin/test-js -j 3` 507 files passed, 0 failed.

## Code review R1 fixes

Review: `FEED_LOCKOUT_CODE_REVIEW_R1.md` (4 minors, 6 nits). Commit ac5eec39e.

- **m1, a borrowed hold with no limit.** `npc-needs.js`: a borrowed use held for its check waits at
  most `BORROW_CHECK_WAIT_MS` (5 s, needs clock) from when the hold began. Past that it goes ahead
  as if not locked out (logged `lock_check_lapsed` with `borrowed: true`); the server still refuses
  the ease, the post and the guest record. The check stays in `lockCheck`, so a late answer still
  flags the PC for the next use. The no-op restart line is gone.
- **m2, one borrower's "no" cleared the mark for all.** `npc-reports.js`: a borrow check carries
  `_borrow`, and its "no" goes into `borrowCleared` (`pcId|npcId` to the lockout count then) instead
  of deleting the PC from `lockoutSeen`. `borrowSeen(pcId, npcId)` is what `onBorrowSat` tests, so
  another borrower at that hot desk still checks, and a new lockout answer there asks the first one
  again. The station path is unchanged (per PC).
- **m3, work borrows (user: keep failing them).** New beat L2 in `test_access_social`
  (`l2_room`, east of `l1_room`): Hamid Rahimi, work need on a `l2_ledger` share, his PC's
  `offWhen` `l2_pc_off` starts true (a power switch toggles it), `borrow_session` to
  `l2_hot_desk` under `locking`. Tasks `l2_locked_out` and `l2_borrow_failed`; PLAYTEST.md row.
- **m4, needMet route tests.** `feed_post_test.rb`: the needMet post is served through
  `/feed_post` when the last failure is 6 s old, not at 4 s (nothing written), and a refused source
  with a met use serves nothing. The first and third fail if the route drops `met_use`.
- **n4, a stale shown id in `revealed`.** `AccessWork.feed_shown_ids` drops ids the scenario no
  longer has, so `revealed`, the next post's index and GET /scenario's block all count the same
  posts; the stale id goes on the next write. `feed_post_known?` in `social_feed.rb` is gone. The
  NIT-1 test now expects indexes `[0, 1]`; a new test covers `revealed` and the index.
- **n1** (older than this branch) is in `docs/IDEAS_BACKLOG.md`, with n2, n3, n5 and n6, not fixed.

Tests, run alone: `npc-lockout.test.mjs` 31 pass (new: the hold limit, a sync PUT that never
settles with a real `NpcReports` wired through `npc_sat_at`, two borrowers at one hot desk); 38 JS
files that import `npc-needs.js` or `npc-reports.js`, or read the scenario, 751 pass, 0 fail.
Ruby: `feed_post_test` 27 runs, `access_work_feed_select_test`, `access_work_social_test`,
`access_leak_scanner_feed_test`, `social_lockout_q33_test`, `access_helper_equality_test` 97 runs
together, 0 failures; `tts_mission_lines_test` and `ink_compiled_staleness_test` 7 runs, 0
failures. The sync-stall test fails with the limit set very high. Validator: 0 lines with ❌.

Live proof, L2 (game 1468, port 3034, headless, started in `l2_room`):

| Step | Result |
|---|---|
| Lockout | Three wrong passwords on Hamid's tile at the hot desk: "2 attempts left", "1 attempt left", "This account is locked on this PC" |
| Finding out | Two failures at his switched-off PC (level 25, then 50), the borrow started; `npc_sat_at:l2_hot_desk`, one check, `npc_locked_out:hamid` `l2_hot_desk` 500 ms later, task `l2_locked_out` |
| Failed work | `npc_borrow_done:hamid` `met: false`, `npc_use_failed:hamid` need `work`, `missing [{l2_hot_desk, locked_out}]`, task `l2_borrow_failed`; no `npc_used:l2_hot_desk` |
| Server | `loginLockouts` `["l2_hot_desk\|hrahimi"]`; `npcFrustration.hamid.lockedOut` `["l2_hot_desk"]`, `easeAt` empty; `guestSessions` empty; GET /scenario `npcFrustration.hamid.lockedOut` `["l2_hot_desk"]` |
| Tampered | A work `ease` for Hamid at `l2_hot_desk` from the page: `refused: true` |
| Leak check | `VERDICT: no leaks found` |

The answer came before the use ended, so this run did not hold; the hold limit (m1) is shown by
the unit tests only. Game 1468 is left in the shared dev database.

## Code review R2 fixes

Review: `FEED_LOCKOUT_CODE_REVIEW_R2.md` (1 minor, 2 nits).

- **m1, a lapsed borrowed hold showed a met use.** `npc-needs.js` `_completeJob`: past
  `BORROW_CHECK_WAIT_MS` the borrowed use now fails closed, as at the station. It is skipped
  unjudged: nothing restored, no `npc_used`, no `npc_use_failed`, no ease or feed request, and
  `npc_borrow_done` says `met: false`; the NPC goes home. The check stays in `lockCheck`, so a late
  answer still flags the PC and the next borrow there waits again. The `lockLapsed` job flag is gone.
  As before for a failed borrow, `npc_borrowed_session` fires with `met: false` when the borrow
  leaves a session open. The R1 m1 entry above ("goes ahead as if not locked out") is out of date.
- **n1, the two clocks.** The header comment in `npc-reports.js` now says the wait is needs clock,
  which stops while the game is paused, and that `SEND_TIMEOUT_MS` is wall time.
- **n2, a station "no" cleared the mark for borrowers.** Fixed, small change: `noteLockout` also
  adds the PC to a new `borrowLockoutSeen` set, and `borrowSeen` reads that set. A station "no"
  still deletes the PC from `lockoutSeen` only, so an owner's "no" spares anyone borrowing that PC;
  a borrower's "no" still goes into `borrowCleared`. `lockoutSeen` and the test bridge's view of it
  are unchanged. The validators have no check on a PC that is both one NPC's sign-in `needsHome` and
  another's `borrow_session` target, and with this fix none is needed.

Tests, run alone: `npc-lockout.test.mjs` 32 pass. The changed lapse test (no `npc_used`, borrow not
met, no failed use, no ease), the changed sync-stall test and the new n2 test fail on the old code
(3 fail, 29 pass). The 34 JS test files that import `npc-needs.js` or `npc-reports.js`: 640 pass,
0 fail. No Ruby code changed. No live server was started.

## Left open

- q33 R2 m5 (a question for the user): one lockout counts twice for an NPC with work and a
  `"phone": false` social need. Not touched.
- q33 R2 nits n1 to n3 (validator wording and a suggestion line) and the n5 upgrade note; n4 is
  covered for m1 and m2, not for "the dropped use at the station sends no ease".
- C2 R2 NIT-2 (validator reactive report line order).
- The client still emits `npc_borrowed_session` with `met: false` after a locked-out borrowed use
  (the existing "signed in before finding out" rule); the server refuses the guest record and no
  guest appears on either side, as the live proof shows. Skipping the event for a lockout would be
  more exact; left as is to keep the diff small.
- A borrower whose browser never saw a lockout answer at that hot desk sends no check, so its use
  there still shows as met; the server refuses the ease and the post. Only a lockout made in another
  browser of the same game reaches this, and a reload seeds the mark from `lockoutPcs`.

## Beat rename (2026-11-12)

The two lockout beats were F14 (Sade) and F15 (Hamid) when built and proved live (games 1383 and
1468). They are now L1 and L2, since F14 belongs to the Friendface phone build and F15 to F17 to the
C3 replies plan: rooms, signs, tasks, globals, the resource, post ids and the PLAYTEST rows use
`l1_` and `l2_`. The live-proof tables above use the new names for the same ids.
