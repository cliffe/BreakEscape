# Access model slice 9.2 C: code review, round 3 (server and client)

Branch `build/9-2-c` at `00543bbcf`, read as `git diff 94b88373d...build/9-2-c`, with the round 2
fix commits read one by one (`b975d63db`, `6066a1eb1`, `24309e1ac`, `081ba9d7b`, `5e78e3efa`)
against round 2's review and the build log's "C review round 2 outcomes".

Runs (Ruby 2.7.8, single files, no lock): `access_model_no_password_test.rb` 15/15,
`access_leak_scanner_feed_test.rb` 18/18; `node --test test/js/social-feed.test.mjs` 21/21.

Two probes, kept in my scratchpad (no repository file touched):

- A controller prepend that, for one named action, puts the scenario's `feed` back on every
  record with id `fay` in the JSON answer (as if that route skipped `withhold_npc_secrets!`), run
  against the R1 M2 test once per action. Unpatched: pass. `room`: fails at `GET /room/finance`.
  `room` limited to `room_id=lobby`: fails at `GET /room/lobby` (the record `move_npc` stored in
  `npcs_added`). `unlock`: fails at `POST /unlock door`. The other actions (`update_room`, `ink`,
  `npc_frustration`, `npc_workaround`, `login`, `container`, `inventory`, `scenario`) still pass,
  because none of their answers holds an NPC record to put a feed on.
- Two extra scanner cases with the `access_leak_scanner_feed_test.rb` helpers (m1 below). Both
  report a finding on a clean log.

## Blocker

None.

## Major

None.

## Minor

### m1. A lost `/feed_post` body now takes the place of a resumed game's earlier reveals, so a resumed run with any lost body flags its own first bootstrap

`tools/playtest/lib/access_leak_scanner.rb:740` (`share = [missing, unreadable].min`) and `:755`.
Every unreadable `/feed_post` row is credited, in full, to every feed NPC whose saved count
exceeds its logged answers, and that credit is taken off the from-line-1 base. The row is not
tied to an NPC, and it need not be a reveal at all: `feed_unreadable?` (`:702`) counts any 200,
including a `tooSoon` or `done` answer.

Failure scenario A (measured, single NPC, the F7 pattern): a run is captured after a reload, so
the game already holds Lena's post (`feedRevealed.lena.n` 1). Line 1, `GET /scenario`, carries
it in `feedPosts`, correctly. Later a `/feed_post` answer is logged with `bodyError` (a reload as
it arrives); it was any NPC's `tooSoon`. `missing` 1, `unreadable` 1, so `share` 1 and `base` 0:
line 1 is judged with no Lena post out and reported as `feed_text feed:lena|lena_post_1`. Round 2's
code passed this log. Failure scenario B (measured, two NPCs): the same with `jake` `n` 1 and the
lost row being Jake's reveal; both NPCs get the one row's credit (`feed_unknown` is
`["jake", "lena"]`) and Lena's resumed post is again flagged at line 1. The same double credit
works the other way: one lost row lets every NPC with a surplus take a reveal after it, which can
pass a second NPC's early reveal, though round 2's code passed that too.

Round 2's own case (a complete log, a bootstrap bug before a lost body) and scenario A look the
same to a counter: one surplus reveal, one lost row, a post in the first bootstrap. What tells
them apart is in the log: the `index` of the NPC's first readable post answer is the server's
count before it (0 in round 2's case; in scenario A Lena has no readable answer, and Jake's would
show 1), and the capture's `t` on the lost row against the saved `feedRevealed[npc].at` says
whether that row was the NPC's last reveal.

Fix: have `response-capture.js` (a skill script, so the user's call) record the request's
`npc_id` for `/feed_post` (`response.request().postData()`), and credit an unreadable row only to
that NPC. In the scanner, cap the sum of shares at the number of unreadable rows, take the base
for an NPC from the `index` of its first readable post answer when there is one, and when the
log cannot settle it (no npc_id, no readable answer) keep round 2's base from line 1 and print
the "could not be judged in order" note rather than a finding. Add scenarios A and B as tests.
PLAYTEST.md already says to rerun a beat that prints either note, so the harm is a false finding
that sends a tester after a server bug that is not there.

## Nit

- `test/js/social-feed.test.mjs:195`: the test is still named "a network failure is asked again
  once", but a network failure now goes through the same `retriesLeft` chain, up to three more
  asks five seconds apart. Rename it, or assert the count.
- `public/break_escape/js/systems/social-feed.js:128, 139`: the uncapped wait goes straight to
  `setTimeout`, which fires at once for a delay over 2^31 - 1 ms (about 24.8 days). Only a need
  with an absurd `decayPerMin` gives such a floor, and `MAX_TRIES` then limits it to four quick
  asks per use, so this is no flood. `Math.min(retryIn, 2147483)` closes it.
- `social-feed.js:133`: with a retry chain behind a network failure, a request the server
  committed but whose answer the browser lost (a dropped connection; `ApiClient.post` sets no
  timeout here, so this is rare) is followed by a `tooSoon`, a wait of the full floor, and then
  the NPC's next post. One use then reveals two posts, and the first is not listed until a
  reload. Round 2 stopped after the `tooSoon`. The server pace holds either way. If it matters,
  let a `tooSoon` answer carry the NPC's revealed count so the client sees it is behind and
  restores the missing post.
- `access_model_no_password_test.rb:187-189` says "every route the browser calls"; the list
  leaves out `GET /network`, `POST /npc_workaround` with a `prop_door` (its `roomData` comes from
  `serve_opened_room`, so the door unlock covers the helper but not that route's merge),
  `sync_state` and the rest that carry no NPC data. "Every route that can carry NPC or feed data,
  and the ones next to them" would be accurate.

## Round 2 items checked

- **M1 (`b975d63db`): the no-exposure test.** Sound. Each of the 15 calls must answer 200, and
  `assert_fay_served` requires Fay's record on the door unlock, `GET /room/finance` and
  `GET /room/lobby`, on both passes, so a route that starts refusing or stops serving her fails
  the test before the leak checks. `relock_finance!` (`:226`) clears `unlockedRooms` and
  `room_states` before each pass, so the second pass unlocks the door into a room that holds Fay
  again and `move_npc` stores a fresh full record (`move_npc_to_room!` copies the scenario record,
  feed and all, into `npcs_added`), which `filtered_room_data` must strip. The probe shows a leak
  on any of the three NPC-serving routes fails the test, and the text check covers every body for
  a raw post or fact. The routes that still pass under the probe hold no NPC record, so there is no
  withholding on them to remove; a raw scenario or NPC dump there would still fail the text and
  fact-key checks. `GET /scenario` strips every room's NPCs, and `withhold_feed_facts!` is covered
  by `keyed_with_text` on it. The ease report is a real `ease` with `npc_id` and must not be
  refused.
- **m1 (`6066a1eb1`): the uncapped retry.** No flood: a use makes at most `MAX_TRIES` (4)
  requests, each at least 1 s after the last answer, a use is ignored while one is in flight or a
  retry waits, and the chain ends on `done`, a post or a 403. No starvation: the wait is the
  server's own `retryAfter` (`wait.ceil`, from server time at both ends) plus 1 s, so the second
  ask lands past the floor unless a reveal moved `at` in between, and a reload drops the timer and
  the next use asks again. No double post: one use yields at most one post on a normal path
  (a post ends the chain), `_add` drops a repeated post id, and the floor holds on the server. The
  edge cases are the two nits above. Both new tests fail on round 2's code (a 301 s timer; two
  sends where four are asserted), and the `cleanFact` test fails on it too.
- **m2 (`24309e1ac`): lost bodies.** Round 2's case is fixed: the first bootstrap before the lost
  row is judged with nothing out, and the new tests fail on round 2's scanner (no finding;
  `feed_unknown` missing). A lost row now grants its reveal only from its own line, so it cannot
  hide an earlier premature reveal for a single NPC. It now false-flags a resumed log (m1 above).
  The blank-id skip matches `AccessWork.feed_posts`, and its test fails on round 2's code.
- **Nits.** PLAYTEST.md describes the retry and the budgets, and the F5 row separates the task
  from the server column. The note in `access-leak-check.rb` names lost bodies. `cleanFact`
  refuses a non-string `text`. Plan 8.3 states the uncapped retry and the four-request limit.

## Verdict

The round 2 major is done: the route test now reaches Fay's record wherever one is served, and a
leak on any of those routes fails it. The retry cannot flood, starve or double post on a normal
path. The scanner's lost-body handling fixed round 2's case but credits each lost row to every
NPC and counts `tooSoon` rows as reveals, so a resumed run with a lost body false-flags its first
bootstrap (m1). **Approve**; m1 and the nits at the builder's judgement. The capture change m1
needs is in a skill script and is the user's call.
