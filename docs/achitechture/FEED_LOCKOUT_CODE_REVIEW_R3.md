# Feed and lockout (q36, q37, q38): code review round 3

Branch `build/feed-lockout` at fa9965444, reviewed as `git show fa9965444` (the R2 fixes) against
`FEED_LOCKOUT_CODE_REVIEW_R2.md` and the "Code review R2 fixes" section of the build log.

Counts: 0 blockers, 0 majors, 1 minor, 2 nits.

## Round 2 fixes checked

- **R2 m1, a lapsed borrowed hold showed a met use.** Closed, and shown live (game 1508 below).
  `npc-needs.js` `_completeJob`, the `atBorrow` branch: past `BORROW_CHECK_WAIT_MS` it logs
  `lock_check_lapsed`, calls `_borrowDone(s, job, false)`, clears the job and goes home. Nothing is
  restored, no `npc_used`, no `npc_use_failed`, no ease and no feed request. The check stays in
  `lockCheck`, so the late answer still flags the PC.
- **What follows in the borrow flow.** `_borrowDone` emits `npc_borrowed_session:<pc>` (when the
  borrow leaves a session open) and `npc_borrow_done:<npc>`, both with `met: false`. The workaround
  runner posts "done" (not dropped) for that hand. The server does not read `met`:
  `record_borrow_done!` ends any player session at the PC and writes a guest record unless the NPC is
  careful or `account_locked_out_at?` holds there, which reads `loginLockouts` directly and so does
  not depend on the late check. `pc-sessions.js` uses `npc_borrowed_session` only to displace the
  player's session and ignores `met`. The leak scanner and the capture path (`recordSECapture`, a
  heard share only) do not read either event. So for a locked-out borrower the lapse ends as a
  failed borrow does: done, `guest: false`, no guest record. The hand is spent and
  `set_workaround_global!` runs, as for a failed borrow before. Because the lapse counts no failure,
  the NPC's next failure (at its own station) is what earns the next hand; in 1508 that came about
  22 s later, and the second borrow there failed on `locked_out` with no new check (the PC was
  already flagged). The one loose end is the meaning of `met: false` (m1).
- **R2 n1, the two clocks.** The header comment now says needs clock and wall time. Done.
- **R2 n2, borrowLockoutSeen.** Correct. `noteLockout` adds the PC to both sets; `seedLockouts`
  goes through `noteLockout`, so a reload seeds `borrowLockoutSeen` from GET /scenario's
  `lockoutPcs` exactly as it seeds `lockoutSeen`. `borrowCleared` is still memory only, so a reload
  costs at most one extra check per borrower, as R2 noted. Nothing else expects `lockoutSeen` to hold
  borrowers: its only readers are `onOwnerReturned` (station path), the station "no" in `flush`, and
  the test bridge's `reports().lockoutSeen`, which `test_access_work/PLAYTEST.md` uses for the
  station reload beat only. `borrowLockoutSeen` never shrinks, which is fine: per-borrower clearing
  is `borrowCleared`'s job.

## Live check (keyless server on port 3052, headless, new games)

| Game | Beat | Result |
|---|---|---|
| 1508 | L1, check answer slowed to 18 s in the page (R2's 1487 patch) | Three wrong passwords: "This account is locked on this PC". Needs log: `lock_check` t 330, `use_held` 370, `lock_check_lapsed` 390, `borrow_done` met false 390, then `job_start` at `sade_pc` 391 and `returned_post` 398. No `used`, no `npc_used:l1_hot_desk`, no `npc_use_failed` at the hot desk for that use. `npc_locked_out` came 3.25 s after the lapse. Requests: no ease, no `/feed_post`; the "done" answered `guest: false`. Server: `loginLockouts` `["l1_hot_desk\|sokafor"]`, `lockedOut` `["l1_hot_desk"]`, `easeAt` `{}`, `guestSessions` `{}`, `feedRevealed` `{}`. `/feed_post` and a social media ease at the hot desk from the page both answered `refused: true`. A click on the hot desk afterwards shows the sign-in tiles, not a guest session. `l1_locked_out` and `l1_borrow_failed` both completed |
| 1509 | L1 | Pass. `lock_check` t 376, `locked_out` 377, `borrow_done` met false 416, `use_failed` social media `locked_out`, parked. One check, "done" answered `guest: false`. Server: `loginLockouts` `["l1_hot_desk\|sokafor"]`, `lockedOut` `["l1_hot_desk"]`, `easeAt`, `guestSessions` and `feedRevealed` empty; `/feed_post` and an ease from the page `refused: true`. Both L1 tasks completed |
| 1510 | L2 | Pass. `lock_check` t 173, `locked_out` 174, `borrow_done` met false 213, `use_failed` work `locked_out`, parked. One check, `guest: false`. Server: `loginLockouts` `["l2_hot_desk\|hrahimi"]`, `lockedOut` `["l2_hot_desk"]`, `easeAt`, `guestSessions` and `feedRevealed` empty; a work ease from the page `refused: true`. Both L2 tasks completed |

Games 1505, 1506 and 1507 were created without `--start-room` and not played. All six are left in
the shared dev database. Touched test files, run alone: `npc-lockout` 32, `npc-reports` 9,
`npc-needs-work` 51, `npc-workarounds` 52, `test-bridge-access` 12, all pass. No Ruby changed in
fa9965444.

## Minor

**m1. A lapse reads the same as a failed sign-in to anything listening for `met: false`.**
`npc-needs.js` `_borrowDone(s, job, false)` in the lapse branch. Both `npc_borrow_done` and
`npc_borrowed_session` carry `met: false` and nothing else that tells a skipped use from a failed
one. Scenario mappings read `met === false` as "the borrower could not sign in":
`test_access_social` `l1_borrow_failed` and `l2_borrow_failed`, and `test_access_work`
`h3_failed_there` (`npc_borrowed_session:hot_desk`, rosa). In 1508 `l1_borrow_failed` completed
3.25 s before the lockout answer came back. There it was right by luck, since Sade was locked out.
A lapse also happens when a lockout of some other account was seen at that PC and the server is slow.
Then the borrower is not locked out, the "done" writes a guest record, the runner gets `guest: true`
and emits `npc_guest_left`, and the player can claim a session that the event called not met, while
the scenario's "failed there" task completes. No server or leak path is wrong (none reads `met`);
the signal for authors is. This was not run live: it needs a lockout of a second account at the hot
desk plus the slowed answer.
Fix: add `lapsed: true` (or `judged: false`) to both payloads in the lapse branch, say in the
`_borrowDone` and workarounds header comments that `met: false` with `lapsed` means skipped, not
refused, and have the L1, L2 and H3 conditions require `!data.lapsed`. One JS assertion in the
changed lapse test covers it.

## Nits

**n1. Stale and overlong text.** The build log's R1 m1 entry (line 106, "Past that it goes ahead
as if not locked out") is left in place with a pointer from the R2 section; rewriting the R1 entry
to match the code would save a reader the cross-reference. In `npc-reports.js` the header line
ending "So a mission with no lockout sends no check at all. Every" now runs well past the file's
line width, and the `flush` comment's inserted "for station checks only (R2 n2)" sits mid-sentence
after the q33 note, where it reads as qualifying that note; a separate sentence would be clearer.

**n2. The test bridge does not show the borrow mark.** `reports()` returns `lockoutSeen` only.
After an owner's station "no" the PC leaves `lockoutSeen` while borrowers there still check, so a
playtest reading the bridge sees no mark and still gets a check. Adding `borrowLockoutSeen` (and
perhaps `borrowCleared` keys) to `reports()` and to `docs/test-bridge.md` would make R2 n2 visible
in a run.
