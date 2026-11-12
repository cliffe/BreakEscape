# Feed and lockout (q36, q37, q38): code review round 1

Branch `build/feed-lockout` at 9fe781719, reviewed as `git diff main...build/feed-lockout`. Read
with the build log, `Q33_LOCKOUT_CODE_REVIEW_R2.md` and `ACCESS_MODEL_SLICE_9_2_C2_CODE_REVIEW_R2.md`.
q33 R2 m5 (one lockout counting per need) is the user's q35 decision and is not raised.

Counts: 0 blockers, 0 majors, 4 minors, 6 nits.

## What holds

- **The bootstrap does not leak.** `npcFrustration[id].lockedOut` in GET /scenario is
  `e['lockedOut'] & (station | handed_borrow_pcs(npc))`. `e['lockedOut']` is written only by a true
  `check` answer, and `check_report!` at a hot desk needs the hand-over, `lockout_pc?` and an
  unlocked room, the same gates as at the station. So the block repeats what a check already told
  that browser. It carries no lockout the player has not been told about, and no list of usernames.
- **`lockout_pc?`** is the old `lockout_station?` body taken out for any PC; `lockout_station?`
  calls it with the station, so the station path is unchanged. A hot desk has no `screenOwner`
  (the validator requires that), so the owner test passes there.
- **Ease at a locked-out hot desk (R2 m1).** `borrow_locked_out?` is not gated by the check record,
  unlike the station's `owned_causes`. That tells a tampered client nothing more, because a `check`
  at the same handed-over desk in the same opened room (`frustration_places` gates the ease) answers
  the same question.
- **Pace-floor order (R2 m2).** The selection is pure (it reads the raw entry, never
  `frustration_entry`), so running it before the floor and the source check writes nothing. A probe
  inside the floor gets `tooSoon`, and one outside it either spends a post or is refused, as the
  reviewer asked. The docstring order matches the code.
- **Blocked and off stations (R2 m3)** are refused as feed sources. The `off` test goes through
  `frustration_cause_holds?`, which uses the same merged globals as the frustration path.
- **Non-owned station (R2 m4).** The feed applies a lockout only where `lockout_pc?` holds, and
  `owned_causes` (record-gated, and no record is possible there) already lets work and the ease go
  on at such a station. Server and honest client agree.
- **Reload during a borrowed hold.** `lockCheck` and the job live only in memory. After a reload the
  borrow job is gone, and a recorded lockout comes back through the restore, so the next borrowed use
  fails at once with no check. A reload does not leave anything hung.
- **needMet clock.** `met_use['at']` and `failAt` both come from `Time.current.to_f`.
- Touched files run alone: `social_lockout_q33_test`, `feed_post_test`, `access_work_feed_select_test`,
  `access_helper_equality_test`: 61 runs, 362 assertions, 0 failures. `npc-lockout.test.mjs` and
  `npc-reports.test.mjs`: 38 pass, 0 fail.

## Do the tests fail without the change?

Each new Ruby test fails on main's code: the hot-desk check (refused on main), the bootstrap restore
(filtered to the station on main), the R2 m1 ease (accepted on main), R2 m2 (`refused` instead of
`tooSoon`), R2 m3 blocked and off (accepted on main), R2 m4 (refused on main), the stale id (an empty
block on main), and the two unit needMet tests (no `met_use` parameter). The JS hold, false-answer,
no-lapse, restore and `shouldCheckLockout` borrow tests fail without the change. "A true answer for
a PC this owner never asked about is ignored" passes on main too. That is fine as a regression
guard, but it does not test the change. For the gaps, see m4 and n6.

## Minors

**m1. A borrowed hold can last for ever if the report queue stalls in its sync.**
`npc-needs.js` (`_completeJob`, the `atBorrow` branch at about 3104 to 3112) holds the borrowed use
until a check answer arrives, with no lapse. The comment explains this by saying that the queue
answers every check. That holds for the send, which `_sendBounded` limits to 20 s plus one resend.
It does not hold for the sync before it: `flush` (`npc-reports.js:196`) awaits
`this.deps.sync?.()` with `sending = true`. That is `StateSync.sync()` and then
`ApiClient.put('/sync_state')`, and the fetch has no timeout or signal. `needSync` is set by a
watched global change or a `stale` answer. If that PUT never settles, the batch holding the check
is never spliced or sent, so no answer comes. The borrower then sits held at the hot desk, signed
in, until the page reloads. The station path survives the same stall through its 30 s lapse.
The line `if (clockMs - lockCheck >= LOCK_CHECK_WAIT_MS) lockCheck = clockMs` in the borrow branch
has no effect, and its comment ("past LOCK_CHECK_WAIT_MS it only starts again") reads as if it did.
Fix: give the borrow hold a long lapse that fails closed, as the station does. For example, after
`2 * LOCK_CHECK_WAIT_MS`, end the use unjudged: nothing restored, no `npc_used`, no report,
`_borrowDone` not sent, and the check left in flight so the next use waits again. Or bound the sync
in `flush` with `SEND_TIMEOUT_MS` as the send is. Either way, add a test with a send or sync that
never settles.

**m2. One borrower's "no" at a shared hot desk wipes the lockout mark for the next borrower.**
`npc-reports.js:236-239` drops `lockoutSeen` for the PC after any `lockedOut: false` answer, per PC
and not per NPC. Q33 R1/R2 n1 accepted this because no two owners share a sign-in `needsHome`.
Hot desks, though, are shared by design: `test_access_work` has two NPCs with a `borrow_session` to
`hot_desk` (scenario lines 978 and 1672). Suppose the player locks out A's username at a hot desk
under `maxAttempts` and B sits there first. B's check answers no and the mark goes. A then sits
down with `seen` false, sends no check, and shows a met use while the server refuses the ease and
the post. That is the q36 gap again. It is not live today (`hot_desk` is `managed`, with no
`maxAttempts`), but nothing warns an author about it.
Fix: on the borrow path, key the "no" clearing by `(pcId, npcId)`, or do not clear on a borrow
check's "no". A test: two borrowers at one hot desk, only the second locked out, and the second
still checks.

**m3. The lockout now fails a borrowed work use too. That needs a word from the user.**
The build log argues from q33's "a lockout stops every use of that PC". But q36 (the backlog entry
it builds) and R2 m1 ("Leave work at a borrowed PC as sub-slice L documents") were both scoped to
social media. Main's README said a locked-out borrower "still works at it" and that a later slice
"may" change this. The change has a cost: a work owner locked out at both its station and the hot
desk now makes a futile trip on every counted station failure, and the README line "locking the
owner out at every PC does not make them give up" is gone. Server and client are consistent
(`borrow_locked_out?` refuses a work ease, and `atBorrow` fails work). But the work case has no
scenario beat and no live proof: F14 is social media, and only `npc-lockout.test.mjs` covers work.
Fix: ask the user (keep work in, or scope it to social media as R2 m1 said). If it stays, add a
work borrower to a beat or to the F14 notes, with one live check.

**m4. The q38 needMet route wiring has no route test.**
`social_feed.rb:59` builds `met_use` and passes it to `select_feed_post`. The unit tests cover
`need_met_now?`, but no controller test posts to `/feed_post` and gets the "fixed at last" post
through the quiet window. A grep of `test/controllers` for `needMet` or `NEED_MET_QUIET` finds
nothing, so dropping the `met_use` argument would leave every Ruby test green. Only the F13 live
run shows it.
Fix: in `feed_post_test.rb`, set `failAt.social_media` 6 s back and `easeAt` before it, and expect
the needMet post. Repeat at 4 s and expect no post. A third case: a refused source with a met use
serves nothing.

## Nits

**n1. A tampered client can force "fixed at last" without a met use, but gains nothing new.**
Any `/feed_post` from a valid source counts as a met use (`met_use`), so a tampered client can ask
5 s after the last social media failure, while the NPC is still failing, and get the needMet post.
Before q38 it could do the same with a forged `ease` at the same non-station place, because
`ease_report!` accepts an ease there under the same gates. So nothing is gained. The rule could
still be stated as a residual in the C2 plan amendment: "the server takes the feed request itself
as the met use".

**n2. An honest refused source now gets a retry first.** With the source check after the floor, a
use at a locked PC (F9, or a hot desk this browser never saw a lockout at) gets `tooSoon` with
`retryAfter` inside the floor. `social-feed.js` then asks again, up to `MAX_TRIES` (4), before the
`refused` answer stops it. This costs only a few requests, but the docstring in `social-feed.js`
`_ask` still says a refusal "is not asked again" without mentioning the first `tooSoon`.

**n3. A refused-source request now learns whether a post is eligible.** The selection runs first,
so a refused source gets `{ post: nil, done }` when no post is eligible and `refused` when one is.
For a `"phone": false` NPC, the phone (`object_id` omitted) is always a free probe with no room
gate. What it reveals (frustration thresholds, causes behind the record, needMet) is mostly shown by
the tell and icons already. If that is acceptable, say so in the docstring. If not, answer a
refused source with `refused` whenever the selection found nothing.

**n4. A stale shown id still counts in `revealed` and the next index.** The `feedPosts` block now
skips the stale id, but `reveal_feed_post!` still answers `revealed: shown.length` and indexes the
next post at `shown.length`, both counting it. After a lost request, `social-feed.js:138` sees
`revealed` above the posts it holds and stops retrying, so that one use posts nothing. This only
happens after the scenario was edited between saves. Count only known ids in both places, or drop
unknown ids in `feed_shown_ids`.

**n5. The R2 m3 check covers the own station only.** `feed_source_ok?` still accepts a non-desk
source, or a handed-over hot desk, whose `offWhen` holds, and a hot desk under `social: "blocked"`.
No honest client uses those either. Apply the same two tests to any source that has an `offWhen`
or a policy, or note that the gap was there before q33.

**n6. Test gaps on the client.** The q36 JS tests call `lockCheckSent` by hand. None runs a real
`NpcReports` against the needs system from `npc_sat_at` through `onBorrowSat` and `markCheck` to
the hold, so the event wiring (and that `npc_sat_at` fires before the use can end) is shown only
by the F14 live run. No JS test covers a borrowed `social_media` lockout: the hot desk fixture
satisfies `work` only. The `access_helper_equality_test.rb` header comment line also runs well past
the file's width.
