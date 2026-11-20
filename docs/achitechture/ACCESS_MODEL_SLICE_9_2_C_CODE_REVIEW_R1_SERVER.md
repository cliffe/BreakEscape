# Access model slice 9.2 C: code review, round 1, server side

Branch `build/9-2-c` at `6461118e1`, reviewed as `git diff main...build/9-2-c`. Scope: the
controller action, `SocialFeed`, the bootstrap and room filters, `AccessWork`'s feed and
`social_media` rules, the policy and route, the validator (`validate_access_work.rb`,
`validate_npc_needs.rb`, `validate_social/osint.rb`, the schema), `npc_habits/clues.rb`, the leak
scanner, the Ruby tests and `scenarios/test_access_social`. Read against plan sections 8.1 to 8.3,
9.1 to 9.4, 10, 11.2 and 12 "Sub-slice C".

Runs (Ruby 2.7.8, single files, no lock): `feed_post_test.rb` 12/12, `access_work_social_test.rb`
6/6, `access_leak_scanner_feed_test.rb` 8/8, `npc_habits_clues_test.rb` 14/14, `access_work_test.rb`
14/14, `access_model_no_password_test.rb` 14/14, `npc_frustration_test.rb` 38/38,
`npc_workaround_h_test.rb` 32/32; `node --test test/js/validator-access-social.test.mjs` 15/15 (none
skipped). `ruby -wc` on every changed Ruby file: syntax OK, no new warnings. Validator on
`scenarios/test_access_social/scenario.json.erb`: no errors; the two warnings are the expected F8
guard line and an `npc_posted:jake` onceOnly overlap.

What holds up: the post, its fact and the feed never reach the browser before the server hands
them over (bootstrap rooms are stripped to `kept_fields`, `feed` is in `WITHHELD_WORK_NPC_KEYS`,
feed facts are deleted from `social.intelFacts` while the block stays an object). `/feed_post`
runs under `with_game_lock`, refuses an NPC that is unknown or not in `encounteredNPCs` with the
same 403, reads `npc_id` only as a string, serves posts strictly in order, writes nothing on a
refusal, and strips authored keys outside `POST_KEYS` (so `deliberate` stays on the server).
`feedRevealed` is in `ACCESS_STATE_DEFAULTS`, off `preserved_keys`, read through a helper that
tolerates a missing or malformed key, and not writable through `sync_state`. The post period
matches the client's arithmetic (`npc-needs.js` restores and jitter at 2741 and 3054). No Blocker.

## Major

### M1. The leak scanner clears `feedPosts` against the game's final count, so a premature reveal in `GET /scenario` passes

`tools/playtest/lib/access_leak_scanner.rb:651-669` (`note_feed_served`). A `GET /scenario`
`feedPosts` item counts as served when its own `index` is below `@game.player_state['feedRevealed'][npc]['n']`,
read once, at scan time, after the run has finished. It is not the count at the time of the
response. With no game (`@game` nil) `n` is nil and every item counts as served. Served items are
recorded before `scan_feed` runs on the same body.

Failure scenario: in the second scripted run (F5, F6, F8) Jake's feed runs out, so the final `n`
is 3. A server bug that put all three of Jake's posts and both facts in `feedPosts` from the
first reload (for example `feed_posts_for_client` using `posts.size` for `n`) leaves every
`GET /scenario` response in that run clean, because the scanner reads 3 at the end. The same goes
for an item whose `index` is mislabelled 0 but carries post 2's text, since the response itself
supplies `index`. The plan's check "after one `/feed_post` ... the second post and its fact are
nowhere" (9.2) then cannot fail in any run that later reveals the second post.

Fix: count the reveals in log order. Keep `@feed_answers[npc_id]`, the number of `/feed_post`
answers with a `post` seen so far for that NPC. Allow a `feedPosts` item only when its post id is
one of the NPC's first `@feed_answers[npc_id]` authored post ids (look the id up in the catalogue
built by `collect_feeds`; never trust the response's `index`), and its fact only when it is that
authored post's fact. Fall back to the game's `feedRevealed` only for a log that starts after
the reveals (a resumed game), and say in the report that the fallback was used. Add a unit test:
one `/feed_post` answer, then a `GET /scenario` carrying posts 1 and 2, with a game whose final
`n` is 3, must report `feed:jake|jake_post_2`.

### M2. The no-exposure test covers two routes, not "every route", and the first slice's no-password test has no feed fixture

`test/controllers/break_escape/feed_post_test.rb:150-185`;
`test/controllers/break_escape/access_model_no_password_test.rb` (unchanged). Plan 9.2: "The
first slice's no-password test gains a fixture NPC with work needs, each kind of workaround and a
feed with a feed fact, and these assertions over every route". C's feed assertions run only over
`GET /scenario`, `GET /room/office` and `GET /room/lobby`. Nothing checks `/container`,
`/login_accounts`, `/npc_frustration`, `/npc_workaround`, `/objectives`, `/ink`, `/scenario_map`
or a door unlock's room data.

Failure scenario: a later change makes the door-unlock path (or any route that returns an NPC
record, such as an `itemsHeld` give or a frustration answer that echoes the NPC) skip
`withhold_npc_secrets!`. That route ships `feed` with every post's text and fact id, and no test
fails. The live leak scan covers only the routes a scripted run happens to hit.

Fix: add the fixture's feed NPC (a feed with a feed fact) to the no-password test's scenario and
run the structural and textual feed assertions (`keyed_with_text` and whole-text `refute_includes`
for each post and each feed fact) over the same list of route responses that test already
collects, before and after one `/feed_post`. Without `withhold_feed_facts!` or without `feed` in
`WITHHELD_WORK_NPC_KEYS`, the new assertions must fail.

## Minor

### m1. Feed posts that can never be served count as clue sources and as fact-granting elements

`lib/break_escape/npc_habits/clues.rb:95-98`; `scripts/validate_social/osint.rb:189-203`. Both
take every room NPC's `feed.posts[]`, including posts of an NPC with no `social_media` need, which
`AccessWork.feeds?` treats as having no feed (`hasFeed` is never set, `/feed_post` answers
`done`). `clues.rb` also takes a post with no `id`, which `AccessWork.feed_posts` drops.

Failure scenario: an author gives Omar (as in the fixture) a feed but forgets his
`social_media` need, and builds a `guessable` password from his post. 9.1's clue check reports the
password as backed by `rooms/.../feed/posts[0]`, and the OSINT lint counts the post as the
fact's granting element. In play the post never appears, so the password and the fact cannot be
reached. The only signal is `validate_access_work`'s "has a feed but no social_media need: it
never posts" warning, which reads as cosmetic.

Fix: in both places use `BreakEscape::AccessWork.feeds?(npc)` and `AccessWork.feed_posts(npc)`
(posts with an id) instead of the raw list. Consider raising the "feed but no need" warning to an
error when a post's fact is a feed fact or its text backs a password, since the feed then hides
something the mission needs.

### m2. The pace floor can refuse an honest post (tempt band, reload) and the post is then lost for that use

`lib/break_escape/access_work.rb:306-333`, `app/models/break_escape/social_feed.rb:39-42`. The
floor assumes each use starts at `urgentAt`. The needs core also starts a use above `urgentAt`:
slice 18b-i's tempt band (`npc-needs.js:1474-1481`) takes a need at up to `urgentAt + band`, so the
real period becomes `min(restores, 100 - urgentAt - band) / decay`. After a reload, needs restart
at `initial` (plan 9.4) while `feedRevealed.at` persists, so the first use after a reload can come
about T1 after the last post. In either case the answer is `tooSoon`, `social-feed.js` does not
retry, and that use yields no post. The plan says the floor "never refuses an honest post" (8.3).

Failure scenario: a break room tablet that satisfies `social_media` has a tempt band of 20, with
`urgentAt` 40 and `restores` 60. The NPC is tempted at 60 and restores to 100. The real period is
40/decay, the server's is 60/decay, so its 0.9 floor (54/decay) refuses every tempted use. The
NPC posts at most every other use and the validator's posting schedule is wrong. After a reload
in F7, Jake's first phone use (about 10 s in) is refused when his last post was under 51 s
earlier.

Fix: subtract the largest tempt band among the NPC's `social_media` places from `100 - urgentAt`
when computing the period (or ignore objects with a tempt band for `social_media` and say so in
the README). Document in 9.4 that a use inside the floor after a reload yields nothing.
Optionally, have the client keep a `tooSoon` answer's `retryAfter` and ask again at the next use
after it. That changes nothing on the server.

### m3. The comment says C's feed starts from `metAt`, and feed-only NPCs get a frustration entry they never use

`app/models/break_escape/npc_frustration.rb:65-75` (on main, touched by C's intent). The comment
says `metAt` "is kept for sub-slice C's feed (which starts from it)", and `note_npcs_met!` writes a
`npcFrustration` entry for any NPC with `feed` (even one with no need). `reveal_feed_post!` never
reads `metAt`: the first post has no floor at all (plan 9.1, check 4, applies only to the second
and later posts).

Failure scenario: a later reader trusts the comment and assumes the first post is held to T1
after the room loads. A tampered client actually gets the first post and its fact the moment the
room loads. Every feed NPC also gets an `npcFrustration` record that ships in `GET /scenario` with
level 0.

Fix: either correct the comment and drop `|| npc['feed'].is_a?(Hash)`, or (optional hardening, in
the spirit of 9.3) hold the first post to `max(0, 0.9 * T1 * 60 - 3)` seconds after `metAt`, with
T1 from the need's `initial`, `urgentAt` and `decayPerMin`. The second is cheap and narrows the
residual. If adopted, add it to plan 9.1 and 9.3.

### m4. `/feed_post` serves an NPC that has no honest source at all

`app/models/break_escape/social_feed.rb:24-47`. The route checks only "known, feed, a post left,
floor", as the plan says (9.3 accepts the residual). For an NPC with `"phone": false`, a station
whose policy blocks social media, and no other place, no met use can happen unless a
`borrow_session` is in force. Omar in F4 is that case before his borrow.

Failure scenario: a tampered client asks for Omar's posts every floor from the moment his room
loads, before any failure or borrow. It gets posts and facts the scenario makes reachable only
through the frustration chain.

Fix (optional hardening): refuse with `{ post: null, done: false }` when
`!AccessWork.phone?(npc)` and the NPC has no `social_media` place other than a blocked own
station, unless `guestSessions` (or a pending or done `borrow_session` hand-over) names the NPC.
This is a server-owned fact, in line with how A refuses eases at a station a server-owned cause
blocks (`npc_frustration.rb:606-608`). If not adopted, name the case in the 9.3 residual list.

## Nit

### n1. Server and client read a malformed need differently

`lib/break_escape/access_work.rb:289-291, 306-325`. `feeds?` accepts any Hash as the need, and
`post_period_seconds` returns nil (floor 0) for a non-numeric `decayPerMin`. The client's
`normaliseNeed` coerces with `Number()`, so a string `"60"` is a working need in the browser and
an unbounded feed on the server. `urgentAt` is clamped to 0..100 here but 1..99 in the client
(`urgentAt` 100 gives period 0). Negative or over-100 `socialUse.restores` is not clamped (the
client clamps it to 0..100). `validate_npc_needs.rb:1224-1225` errors on the need fields, so this
needs an invalid scenario. Fix: make `feeds?` require a usable need (numeric `decayPerMin` > 0,
`urgentAt` 1 to 99), clamp `urgentAt` to 1..99 and `socialUse.restores` to 0..100 as the client
does.

### n2. The posting schedule can print `0:60`

`scripts/validate_access_work.rb:1133`. `(t % 60).round` rounds 59.6 to 60. Fix: round `t` first,
then split it: `s = t.round; format('%d:%02d', s / 60, s % 60)`.

### n3. Duplicate post texts overwrite each other in the scanner catalogue

`tools/playtest/lib/access_leak_scanner.rb` `collect_feeds`: `@feed_texts[text] = {...}`. Two
posts with the same text (two NPCs, a reposted line) keep only the last entry's `served` key, so
serving the first post does not clear the text and a correct run reports a false `feed_text`.
Fix: append to `served` as the fact branch does (`(@feed_texts[text] ||= {...})[:served] << key`).

### n4. The scanner does not check that `social.intelFacts` is still an object

The plan's structural check includes "and is still an object" (9.2). The scanner reports keys
and texts but not a bootstrap whose `social` block lost `intelFacts`. The controller test covers
it (`feed_post_test.rb:118-124`), so this matters only for live runs. Fix: in `scan_feed`, on a
`GET /scenario` body whose scenario has feed facts, report `feed_fact_key` when
`social.intelFacts` is not a Hash.

### n5. Small test gaps

- No test reads a saved game with no `feedRevealed` key (built before C): `create_access_game`
  fills the defaults. Add one with the key deleted from `player_state`, asking `/feed_post` and
  `GET /scenario`.
- No test proves the lock: two `reveal_feed_post!` calls on stale copies of the same game would
  both write `n = 1`. A test that checks `feed_post` is in the controller's `with_game_lock` list
  (or runs the second call on a copy loaded before the first saved) would catch a dropped
  `around_action` entry.
- The hostile-text test (`feed_post_test.rb:187-193`) proves the server passes text through
  unchanged. That is the right server-side rule for author text. The only end-user input here is
  `npc_id`, which is tested for type; an overlong id is harmless (it fails the lookup).

### n6. Coordination with L

`AccessWork.places` now lists the own station for `social_media` (`access_work.rb:242`), and
`frustration_places` reads it. When L adds its `locked_out` branch to `cause_belongs?` and
`owned_cause_holds?`, it must stay `need == 'work'` (L exempts `social_media`). Otherwise a
`social_media` fail naming the own station could claim `locked_out` and draw the
"alternate eases and fails" floor in place of `social_blocked`'s. Worth a line in L's merge
checklist and a test there.

## Verdict

C's server side is correct on the main question: nothing a tampered client can send makes the
server reveal a post or a feed fact early, out of order, faster than the floor, or for an NPC that
is not known. Saved state and reset behave as 9.4 says, and the code is Ruby 2.7.8 clean. Two
things should change before C is called proven: the leak scanner must judge `feedPosts` against
the reveals in log order (M1), and the feed no-exposure assertions must run over every route, as
the plan asks, through the first slice's no-password test (M2). m1 is a small, real validator
correctness fix. m2 to m4 are a spec mismatch and optional hardening; the user may choose to
accept them as residuals. **Approve after M1, M2 and m1**; the rest at the builder's judgement.
