# Access model slice 9.2 C: code review, round 2 (server and client)

Branch `build/9-2-c` at `8ac1df849`, read as `git diff main...build/9-2-c`, with the round 1 fix
commits read one by one (`8c7a046a9`, `1493e7f9a`, `c65c52da7`, `ce13a102b`, `29ac1e0c6`,
`db8d9fc80`, `afca40b3f`, `9786c837d`, `985968160`, `e02251431`, `658f92759`) against the two
round 1 reviews, the build log's "C review round 1 outcomes" and plan section 8.

Runs (Ruby 2.7.8, single files, no lock): `feed_post_test.rb` 15/15,
`access_model_no_password_test.rb` 15/15, `access_leak_scanner_feed_test.rb` 14/14,
`access_work_social_test.rb` 7/7, `npc_habits_clues_test.rb` 14/14, `npc_lockout_l_test.rb` 18/18.
`node --test`: `social-feed` 19/19, `npc-needs-social-media` 19/19, `validator-access-social`
16/16 (none skipped), `social-osint-browser` 33/33, `npc-sight-challenge` 18/18,
`test-bridge-access` 12/12, `playtest-verify-run-access` 14/14. Validator on
`scenarios/test_access_social/scenario.json.erb`: no errors; the warnings are the known guard line
and the `npc_posted:jake` onceOnly overlap.

I also ran the new M2 test with a preload in my scratchpad (no repository file touched) that
prints each collected response's status and whether it holds Fay's id. Results are under M1 below.

## Blocker

None.

## Major

### M1. The "every route" no-exposure test reaches Fay's record on two routes only; the other thirteen are refusals or rooms she is not in

`test/controllers/break_escape/access_model_no_password_test.rb:186-237` (`build_feed`,
`every_route_body`). Measured, before and after the `/feed_post`:

| Route | Status | Fay's record in the body |
|---|---|---|
| `GET /scenario`, `GET /room/lobby` | 200 | yes |
| `GET /scenario_map`, `GET /room/finance`, `GET /objectives`, `GET /capture_secrets`, `GET /login_accounts`, `POST /unlock` (door) | 200 | no |
| `POST /npc_frustration` | 200 (41 bytes, no NPC record) | no |
| `GET /ink?npc=fay` | 400 | no |
| `GET /container/jake_pc`, `POST /npc_workaround` | 403 | no |
| `POST /update_room`, `POST /inventory`, `POST /login` | 422 | no |

Fay is in the lobby, so the door unlock returns finance's room data, which never held her. The
`update_room` `move_npc`, the inventory add and the login are refused on their parameters, and the
ink route refuses her (no story). So the structural check (`fay_records(...)` has no `feed`,
`workNeeds` or `frustration`) runs on two bodies, the same two that round 1 said were covered. The
text checks on the other thirteen only show that an error message has no post in it.

Failure scenario (round 1 M2's own case, still open): a later change makes the door-unlock path
build its room data without `withhold_npc_secrets!`. A feed NPC in the room behind that door ships
`feed` with every post and fact id. This test stays green because no feed NPC is behind the door it
unlocks, and the door is already in `unlockedRooms`. The same goes for an `update_room`
`move_npc` answer that echoes the NPC, and for any route that returns an NPC record only on
success.

Fix: put a second feed NPC (or move Fay) into a room behind a locked door and leave that room out
of `unlockedRooms`, so `POST /unlock` returns its room data with the NPC in it. Give the
`update_room`, `inventory`, `login` and `ink` calls parameters that succeed (a real `move_npc` of
the feed NPC, an item the fixture allows, a `storyPath` on Fay), or drop the ones that cannot
succeed from the list and say which. Then assert, in the test, the status each call is expected to
return and that `fay_records` finds her on each route that should carry an NPC record (scenario,
both room routes, the unlocked room's data, `update_room`). The count assertion `15` should not be
the only proof the routes ran. Check by reverting: a door-unlock room built without
`withhold_npc_secrets!` must fail it.

## Minor

### m1. The `tooSoon` retry is capped at 300 s, so at a realistic `decayPerMin` it fires inside the floor and the post is still lost

`public/break_escape/js/systems/social-feed.js:77, 117`. `retryIn = min(retryAfter, 300) + 1`, and
the retry itself is never retried. The floor is `0.9 * period - 3` seconds, with the period
`min(restores, 100 - urgentAt) / decayPerMin` game minutes (`access_work.rb:311-339`), so for any
need slower than the fixture's `decayPerMin: 60` the wait after an early use is usually well over
300 s.

Failure scenario (round 1 server m2's own example, at a mission pace): `urgentAt` 40, `restores`
60, a break room tablet with a tempt band of 20, `decayPerMin` 2. The real period is 20 min, the
server floor 27 min. The tempted use at 20 min gets `tooSoon` with `retryAfter` about 420; the
client retries at 301 s, gets `tooSoon` again (about 120 s left), and stops. The next use, at
40 min, posts. The NPC posts every 40 min, not every 20, and the validator's schedule is wrong by
half, which is what the fix set out to stop. After a reload in a real mission the first use comes
at T1 while the floor can have many minutes left, with the same result. The fixture (floor 51 s)
cannot show this.

Fix: either schedule the retry at the server's `retryAfter` with no cap (one timer per NPC, gone on
reload, which is harmless), or keep the cap and, when `retryAfter` exceeds it, keep a "not before"
time per NPC so the first met use after it asks, and drop the wasted request. Add a test with
`retryAfter: 420` that ends with the post revealed.

### m2. The leak scanner's fallback base is applied from the start of the log, so one lost `/feed_post` body opens a window for an earlier premature reveal

`tools/playtest/lib/access_leak_scanner.rb:688-712`. `base = n - in_log` is added to the count
before the first line. That is right for a resumed game. It also triggers when a complete log lost
one answer's body: `response-capture.js` writes `bodyError` when the browser no longer holds the
body (a reload just as an answer arrives, which F7 invites), and such a row has no `body` Hash, so
it is not counted.

Failure scenario: a run captures from the first load. A server bug puts Jake's first post in
`feedPosts` on the first `GET /scenario`, before any use. Later, Jake's second answer arrives as
the tester reloads and is logged with `bodyError`. Final `n` 2, `in_log` 1, base 1: the first
`GET /scenario` is judged with one post already revealed, and the premature reveal passes. The
only trace is the "a resumed game" note, which reads as expected for a reload-heavy run.

Fix: count a `/feed_post` row with status 200 and no readable body as an unknown reveal at its own
position: from that line on, allow one more post for every feed NPC, and before it allow none
beyond the logged answers; report the NPCs this applied to. Apply the base from line 1 only when
the log's first `GET /scenario` precedes every `/feed_post` row and the game's count exceeds the
log's (the true resumed case). Reword the note to say "fewer /feed_post answers in the log than
the game revealed (a resumed game or a lost response body)".

## Nit

- `scenarios/test_access_social/PLAYTEST.md:9-11` still says a stepped clock's `tooSoon` means
  "nothing is listed, and the next honest use asks again". Since `ce13a102b` the client asks again
  once after `retryAfter`, and uses in between ask nothing. The beat budgets (`/feed_post` counts)
  now gain a request per `tooSoon`, for example Jake's first use after the F7 reload. Update the
  paragraph and the budgets.
- `PLAYTEST.md:74` (F5) still lists `via: "password"` beside the task. The `unlock_object` task now
  ticks on any sign-in at `hot_desk`, which the server checks through `signedInPcs`. In this
  fixture only the password reaches Jake's account there, so the beat is sound. Say that the "by
  password" check is the server column's, not the task's.
- `access_leak_scanner.rb:668` takes any string post id (`""` and `"  "` too), where
  `AccessWork.feed_posts` needs `present_string?`. In a scenario with a blank id (a validator error)
  the scanner's order is one ahead of the server's and reports a correct answer. Use the same test.
- `social-feed.js:57-74`: `cleanFact` now lets a non-string `text` through. `grantFact` then hands
  that object to `addNote` (`noteText` is deleted). An authored fact behaves the same, and the
  validator should catch it, so this is noted only.

## Round 1 items checked and found sound

- **Scanner in log order (server M1, n3, n4).** A `/feed_post` answer serves the next authored
  post by the catalogue, so an out-of-order answer leaves its own text unserved and is reported. A
  `feedPosts` item is judged by its post id among the first k authored ids, and its fact only when
  it is that post's fact, with no reliance on `index`. Refusals (`post: null`) and `tooSoon` answers
  count nothing. No legitimate case flags in my reading: the server's `feedPosts` items carry
  `{ id, entry }` facts, which match; a repeated item is idempotent; a post text shared by two NPCs
  is cleared by either. The new tests fail on the old code (final `n` 3 hid the early reveal; a nil
  game served everything; an index of 0 cleared post 2).
- **`cleanFact` (client M1).** Only plain JSON survives: strings, finite numbers, booleans, null,
  arrays and plain objects to depth 6. `__proto__`, `constructor` and `prototype` keys are skipped
  at every level, and `mergeFact` refuses those ids. `noteText` is always rebuilt from `text`. A feed
  fact now reaches the intel board, mail composer and pretext card exactly as an authored fact in
  the bootstrap would. Those readers render through `textContent` and `h()` (the board's one
  `innerHTML` is a fixed SVG), so the feed path lets nothing through that the bootstrap path does
  not already carry. The tests fail on the old code (`provides` dropped; prototype set).
- **Own workstation with no affordance (client M2).** `listObjects` and `getObject` give the
  `needsHome` desk of a social_media NPC an empty affordance. `{}` satisfies nothing, so no other
  need or NPC can pick it, and `_otherDesk` still bars other NPCs' judged needs. `_deadStation` and
  `_isOff` read it safely, and `useSeconds` falls back to `socialUse`. This now matches
  `AccessWork.social_station?`. The adapter tests fail on the old code. The validator warning (no
  phone, only a blocked own PC, no borrow) fires only in that case, and its tests cover the three
  ways out.
- **Retry on network failure.** `ApiClient.post` sets `err.status` on every HTTP error, so only a
  real network failure is retried, and a 403 is not.
- **F5 as `unlock_object` (client m4).** `objectives-manager.js` meets it on the bare
  `pc_signed_in` event and reconciles from `pcSessions.wasSignedIn` on load. The server's
  `complete_task` checks `signed_in_pcs`, so it ticks with Jake's room unloaded and is checked on
  the server.
- **Merge with L (server n6).** `locked_out` stays work only on both sides. Server:
  `owned_causes` adds it only for `need == 'work'`, and `fail_report!` refuses a `locked_out` cause
  unless `need == 'work'` (`npc_frustration.rb:583`). That covers the `cause_belongs?` `else`
  branch, which matches any need. Client: the adapter's station has `lockedOut: false`, and the
  needs core adds the lockout only for a `work` job (`npc-needs.js:3115`). So C and L agree on a
  locked-out station. A social_media use there is met, its ease is answered, and it asks for a
  post (`/feed_post` has no source check). L's test `R1 m2` (`npc_lockout_l_test.rb:294`) pins the
  server half. A locked-out account still browsing at its PC is a design choice rather than a bug;
  if the user wants it named, it is one line in plan 8.1 and `NPC_NEEDS_SYSTEM.md`.

## Verdict

Round 1's scanner, `cleanFact`, workstation and merge fixes hold, and their tests fail without
them. One item is not done: the no-exposure test claims fifteen routes, but Fay's record reaches
only two of them, so round 1 M2's door-unlock case is still untested (M1 here). The retry cap (m1)
leaves round 1 m2 fixed only at the fixture's fast pace. **Approve after M1 and m1**; m2 and the
nits at the builder's judgement. A short round 3 on the test change should be enough.
