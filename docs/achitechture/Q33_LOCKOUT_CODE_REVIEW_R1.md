# q33 lockout: code review round 1 (adversarial)

Branch `build/q33-lockout` at `22dc174b1`, reviewed as `git diff main...build/q33-lockout`.
User decision q33: a 9.2 L lockout stops every use of that PC, social media included; the NPC
falls back down the 9.2 C candidate order (plan 8.1) to another device and finally its phone; no
per-lockout scope field.

Counts: 0 blockers, 0 majors, 4 minors, 5 nits.

## Tests run

- `test/controllers/break_escape/social_lockout_q33_test.rb` and `npc_lockout_l_test.rb`: 27 runs,
  155 assertions, 0 failures.
- `test/controllers/break_escape/feed_post_test.rb` (the old callers that send no `object_id`):
  15 runs, 139 assertions, 0 failures.
- JS: `npc-social-lockout-q33` 8/8, `npc-lockout` 22/22, `npc-needs-social-media` 19/19,
  `social-feed` 23/23, `validator-access-social` 16/16.
- Validator on `scenarios/test_access_social/scenario.json.erb`: 0 lines with ❌.

## What holds up

- **Server authority.** `feed_source_ok?` (`app/models/break_escape/social_feed.rb:103`) reads
  `loginLockouts` itself, which only the login route writes (the sync test proves a cleared
  `loginLockouts` in `sync_state` changes nothing). A tampered client cannot post from the
  locked station by naming it, by naming another NPC's PC, an unknown id, an array or a hash, or a
  real object in a room it has not been sent (`frustration_places` filters by `room_unlocked?`,
  and the client only loads rooms the room route has added to `unlockedRooms`). Leaving out
  `object_id` is the phone: for an NPC with a phone that is exactly what the honest client does
  once it falls back, so it gains nothing; for `"phone": false` it is refused. A borrowed PC counts
  only once the server has handed the borrow over (`handed_borrow_pcs`), and the lockout test there
  uses the borrower's own username, the same key L's R1 m1 uses to refuse the guest record.
- **Reading `loginLockouts` directly, not the check record.** This is the right choice: gating on
  the record would let a client that never sends `check` keep posting from the locked PC. It leaks
  nothing new: `check` (`npc_frustration.rb:647`) already answers "is this owner locked out at its
  station" to any client, and GET /scenario's `lockoutPcs` already names the PCs. L's "finds out at
  the next locked return" rule governs what the NPC does on screen; it does not oblige the server to
  hand out posts the PC cannot produce. The live proof row "Before she knew" shows the consequence
  (see nit N1).
- **Route conventions.** `200 { post: null, done: false, refused: true }` fits: the feed route
  already answers its non-errors as 200 with `post: null` (too soon, done), keeps 403 for an
  unknown NPC, and the frustration route answers refusals as `refused: true` inside a 200. The
  refusal sits after the `done` check and before the pace floor, so it writes nothing and stamps
  no floor. `SocialFeed.apply` ignores it and `_ask` does not retry it (no `retryAfter`).
- **Frustration.** A `social_media` fail naming `locked_out` is accepted only behind the check
  record and only for `"phone": false` (`can_fail?`), so a phone NPC never counts it; the phone
  path in the client drops a use that reaches a freshly flagged station unjudged and sends no
  report. A `"phone": false` owner with a work plan and a social need at the same locked station
  counts a fail per need, each on its own floor. That matches how an `offWhen` station already
  counts for both needs, so it is not double counting.
- **Old saves.** Nothing new is stored. A social-only owner locked out before this build had its
  `check` refused; after it, `lockoutPcs` seeds the "seen" mark on reload and the next locked
  return checks and flags it.

## Minors

### m1. The borrow guard in `_socialCandidate` is unreachable and would not work if reached

`public/break_escape/js/systems/npc-needs.js:2090`. The new condition
`!s.lockedOut.has(s.borrow.pcId)` is meant to skip a borrow at a locked PC, and the docblock
(2084 to 2087) and build log claim that it does. Two problems:

1. `s.lockedOut` only ever holds the station: `applyFrustration` returns early unless
   `pc === this._stationId(s)` (2407) and the restore path checks the same (2525). A borrowed PC is
   never in the set.
2. If it were, the fall-through still calls `this._useCandidate(s, 'social_media', ...)` with
   `quiet` false, and `_useCandidate` returns `_borrowCandidate` at once whenever
   `s.borrow.need === name` (1549). The borrowed PC is chosen anyway.

No test covers it. Fix: remove the extra condition and the docblock sentence "A borrowed PC it is
flagged locked out at is never used either", and say in the docblock that a lockout at a borrowed
PC is not known to the client (see m2). Correct the build log's "a borrow at a flagged PC is
skipped".

### m2. Client blind to a lockout at a borrowed PC (left undone): defer, but write it down

`public/break_escape/js/systems/npc-needs.js:2090`, `app/models/break_escape/social_feed.rb:106`.
With the borrower's own username locked out at a hot desk it borrows for social media, the client
shows a met use (need restored, `npc_used` met) while the server refuses the guest record (L R1 m1)
and now the post. Only `"phone": false` NPCs get a social borrow (social media can fail only for
them), so the reach is small, and the server stays correct. Fixing the client means widening
`check` to a handed-over borrow PC (a second key in `lockedOut`, a borrow path in
`shouldCheckLockout`, and the borrow verdict adding `locked_out`), which is a slice of its own and
outside q33's wording. Fix here: one line in the plan's residual list (9.3) and an entry in
`docs/IDEAS_BACKLOG.md` naming the symptom (met use, no post, no guest record) and the shape of
the fix above. Do not build it in this branch.

### m3. Validator: no `station_fail` warning for a `"phone": false` social-only owner on a lockout station (left undone): fix here

`scripts/validate_access_work.rb:1138`. The q33 client fails that NPC's attempt with grumble
`station_fail` (the JS test asserts it), and `can_fail?` now says it can fail, but the mutter
check for a social-only owner looks at `off_when?` only, and `check_mutters` runs for work plans
only. A scenario author gets no warning and the student sees only a picture, which is exactly
the case the existing `offWhen` warning exists for. It is a one-line change, so do it in this
branch:

```ruby
if desk && (AW.off_when?(json_data, st) || AW.lockout_station?(json_data, npc)) && !AW.work_plan?(json_data, npc) && ...
```

and make the message name the cause ("its station going off or its account being locked out").
Add a validator test in `test/js/validator-access-social.test.mjs` (a `"phone": false`, social-only
owner on a `maxAttempts` sign-in PC with no `station_fail` or `work_fail` line warns; adding a line
clears it).

### m4. Test gaps on the server side

`test/controllers/break_escape/social_lockout_q33_test.rb:120`. The tampered-client tests cover
ids that are not places at all, but not the two ways a real object can be refused or allowed for
other reasons:

- a handed-over borrow PC as a feed source: allowed once `npcFrustration.<id>.handed` names it,
  refused before the hand-over, and refused when the borrower's own username is locked out there;
- a real social media object (a tablet) in a room not in `unlockedRooms`: refused, and allowed once
  the room is unlocked.

Both branches of `feed_source_ok?` and `frustration_places` decide these, and neither has a test
through `/feed_post`. Add the two tests.

## Nits

- **N1.** The window before the NPC finds out: the client shows a met use at the locked PC (need
  restored, and an ease would still count, since `owned_causes` waits for the record), and the post
  is withheld. That is L's rule plus server truth, and the live proof shows it, but no doc says it.
  Add one sentence to the README "Social media while locked out" bullet: until its next locked
  return the NPC still sits at the PC, and that use posts nothing.
- **N2.** Old clients: a tab open across the deploy sends no `object_id`, so a `"phone": false`
  NPC's posts are refused until reload. Acceptable (the gem ships client and server together);
  mention it in the build log rather than adding a fallback that would undo the check.
- **N3.** `scripts/validate_access_work.rb:659`: the borrow check accepts a PC that satisfies
  either judged need. Now that `can_fail?` is true for both needs for more NPCs, a social borrow at
  a work-only PC passes the validator, restores nothing, and has its post refused (the PC is not a
  social media place). Check the need the borrow is for: warn when the PC does not satisfy every
  need for which `can_fail?` holds.
- **N4.** `app/models/break_escape/social_feed.rb:26` comment says the refusal covers "an object
  that is not one of the NPC's social media places the player can know of"; say "in a room the
  player has unlocked", which is what `frustration_places` tests.
- **N5.** `public/break_escape/js/systems/social-feed.js:289`: the fallback
  `api.post('/feed_post', { npc_id, object_id: source })` sends `source` unfiltered, unlike
  `ApiClient.feedPost`, which forces a non-string to null. Harmless (the server refuses it), but
  pass `isStr(source) ? source : null` for the same shape on both paths.

## Should the two left-undone items be fixed here?

- Validator `station_fail` warning (m3): yes, small and in scope.
- Client blindness at a borrowed PC (m2): no; record it in the plan's residual list and the
  backlog, and remove the dead guard (m1) so the code does not claim it is handled.
