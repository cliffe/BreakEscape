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
  "a lockout stops every use of that PC". The backlog entry named social media only.

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

`test_access_social` F14 (`f14_room`, east of `f13_room`): Sade Okafor, `"phone": false`, her PC
under `no_social`, a `borrow_session` to `f14_hot_desk` under `locking`. Tasks `f14_locked_out` and
`f14_borrow_failed`. `PLAYTEST.md` has the F14 row, the F14 tampered checks and the F13 note that
waiting is enough. Validator: 0 lines with ❌.

## Live proof (game 1383, port 3034, headless)

| Beat | Result |
|---|---|
| F13 by waiting | Entered `f13_room` and only waited. `f13_blocked` after 85 s, `f13_recovered` 90.5 s later. Server: `feedRevealed.ruth.shown` `["f13_blocked","f13_fixed"]`; the serve came at 542.35 (server time, last digits), `failAt.social_media` 530.11 and `easeAt.social_media` 542.41. So the ease landed 55 ms after the request, and the last failure was 12 s old: the new met-use rule served it, and the old rule would have read false |
| F14 lockout | Three wrong passwords on Sade's tile at the hot desk: "2 attempts left", "1 attempt left", "This account is locked on this PC" (`pc_signin_failed` `locked_out`) |
| F14 finding out | Two desk failures (`social_blocked`, level 25 then 50), the borrow handed over; `npc_sat_at:f14_hot_desk`, one check answered `lockedOut: true`, `npc_locked_out:sade` `objectId` `f14_hot_desk` 250 ms later, task `f14_locked_out` |
| F14 failed use | At the end of the use: `npc_borrow_done:sade` `met: false`, `npc_use_failed:sade` `missing [{f14_hot_desk, locked_out}]`, task `f14_borrow_failed`. No `npc_used:f14_hot_desk`, no `/feed_post` for Sade, no ease |
| F14 server | `loginLockouts` `["f14_hot_desk\|sokafor"]`; `npcFrustration.sade.lockedOut` `["f14_hot_desk"]`, `easeAt` empty; no `guestSessions.f14_hot_desk`; no `feedRevealed.sade`; GET /scenario `npcFrustration.sade.lockedOut` `["f14_hot_desk"]` |
| Tampered | From the page: `/feed_post` for Sade at `f14_hot_desk` answered `refused: true`; a social media ease for her there answered `refused: true` |
| Leak check | `VERDICT: no leaks found` (lockout_list 0, lockout_unrecorded 0) |

The session log and response capture are in the session scratchpad, not the repository. Game 1383
is left in the shared dev database (mission 245, `test_access_social`).

## Full suites

Under the shared lock: `bin/rails test` 1806 runs, 25626 assertions, 0 failures, 0 errors, 1 skip; `bin/test-js -j 3` 507 files passed, 0 failed.

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
