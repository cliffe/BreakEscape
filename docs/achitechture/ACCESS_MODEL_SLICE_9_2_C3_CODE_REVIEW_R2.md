Counts: 0 blockers, 0 majors, 2 minors, 1 nit.

# Access model slice 9.2 C3: code review round 2

Reviewed: `git diff 13a0f9f96...6993fd3b0` (branch `build/c3-replies` against `main`), with the R1 fix
commits 57a3dea22 and 6993fd3b0 read line by line, against `ACCESS_MODEL_SLICE_9_2_C3_PLAN.md`, the
build log (step 8 and "Code review R1 fixes") and `ACCESS_MODEL_SLICE_9_2_C3_CODE_REVIEW_R1.md`.

Verdict: every R1 fix is correct and tested. Selection, thread rules, route, client, leak tooling and
validator still match the plan; nothing ships early, q76 holds, the new state is bounded. The
early-timing puzzle is explained below: it is the needs engine's documented `breakDrain`, which the
validator's estimate leaves out (m1). The other minor is a static gap the step 8 rename exposed (m2).
The U3 tap defect is out of scope, as briefed.

## Checks run

- Rails, no lock: `access_work_feed_reply_test`, `access_work_feed_select_test`,
  `access_leak_scanner_feed_test`, `npc_habits_clues_feed_test`, `feed_post_reply_test`,
  `feed_post_test`, `friendface_phone_test`: 156 runs, 734 assertions, 0 failures. Neighbours
  `access_leak_scanner_test`, `npc_habits_clues_test`, `access_work_usb_habit_test`: 71 runs, 414
  assertions, 0 failures.
- Node, every `test/js` file that imports or spawns a changed module (`social-feed`,
  `osint-browser-minigame`, `friendface-phone`, `test-bridge/access`, the access, network, habits and
  social validators, `verify-run`, `access-leak`): 51 files, 824 tests, 0 failures, 0 skipped.
- Validator, `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb
  scenarios/test_access_social/scenario.json.erb --no-graph`: 0 lines with ❌; no graph files touched.
- JS harness copy lists: no engine module gains a static import (the only new imports are in test
  files, which load modules by path), so no copy list changes.

## R1 fixes

- **m1, correct.** `social_feed.rb:349-353` and `validate_access_work.rb:1938` use the block form;
  the empty-names branch keeps `gsub('{name}', '')`, which has no escape to read. The route test
  sends `\'`, `\0`, `\&`, `\\` and a backtick, and the validator fixture puts the filled text in a
  chatter line, so a regression to the string form fails both.
- **m2, correct.** `check_reply` (`validate_access_work.rb:2002-2009`) errors for any thread field
  that is not nil and not a non-empty string, which is exactly what `well_formed_reply?`
  (`access_work.rb`, the `compact.size == 1` clause) refuses. JSON `null` reads as nil on both
  sides, and the fixture covers both the empty string (error) and null (no error). A blank
  `replyTo` on its own also errors, through the "needs exactly one" line.
- **m3, correct.** `story_texts` (`validate_access_work.rb:1490`) walks the whole document for
  `storyPath`, reads each file once, memoised per run through `reply_shipped ||=`. The fixture puts
  the piece in a mail-reply record's ink and in an object's.
- **m4, correct.** The `Feed` line counts and times own posts only and says how many replies stand
  in; the `Reactive feed` line lists replies as "stands in for" with no "fires when". On
  test_access_social Tomasz now reads "2 posts (plus 2 replies, ...)" at 1:00 and 2:20.
- **m5, correct.** `feed_posts` counts distinct `served` keys over post texts, `feed_texts` the
  pieces (`access_leak_scanner.rb:221-224`); the unit fixture asserts 4 and 5. PLAYTEST's counts
  line ("34 feed post(s) (35 text(s))") matches the live runs the build log lists.
- **m6, correct.** Fixtures now assert "thread can never open", the second-answer and complaint
  second-reply lines, the "share no cause or need" note and its absence, and a chatter unique-text
  hit.
- **n1, correct.** `friendface_name` strips `[[:cntrl:]\p{Cf}]`, and a name made only of such
  characters falls through to the next candidate. The route test sends U+202E and U+200B.
- **n2, n4 fixed; n3 accepted** with a reason that holds (bounded by authored posts and rooms).

## The F16 reword and the step 8 resource rename

- **Reword.** `f16_ivy_re_tom` now splits into "Not just you then" (17) and "Mine has gone as well"
  (21). Neither occurs anywhere else in `public`, `scenarios`, `app` or `lib`, and the validator gives
  no unique-text warning. It is feed text, not voiced, so no audio cost.
- **Rename.** The scanner registers each resource `name`, `host` and `observations` of 3 or more
  characters as a network string (`access_leak_scanner.rb:400-410`; a substring match from 6) and reports one in any response
  outside the network routes. "Project drive" and "Shared drive" were the openings of the vents, so
  each served vent counted as a resource name leak. With the resources now "Project file share" and
  "Team file share", no shipped string contains a registered network string (checked by grep), so
  the leak check is clean because nothing hidden ships. That is the right outcome for this test
  scenario: a vent naming its own outage in plain words is intended, and the sign already says so.
  The gap is that only a live run finds this (m2).

## Timing puzzle: cause found

Asha, Kofi and Mei (and Ivy and Tomasz) post 10 s before the estimate because each NPC's first work
failure drains its social need by 10 points:

- `NPCNeedsSystem._countFailure` (`public/break_escape/js/systems/npc-needs.js:2224-2237`) lowers
  every other unparked need by the plan's `breakDrain`, default 10 (`AccessWork::FRUSTRATION_DEFAULTS`,
  `lib/break_escape/access_work.rb:19`). test_access_social sets no `breakDrain`.
- Asha: social starts at 60 and decays 1 point a second. At the failure (about 5.5 s) she is at
  54.5, the drain takes her to 44.5, and she reaches `urgentAt` 40 about 4.5 s later, at about 10 s
  (log: tick 41, 10.25 s). Kofi (75) and Mei (90) land at about 25 s and 40 s the same way. That is
  exactly 10 points at 60 a minute.
- Only the first post moves: each NPC fails work once (plan section 8: `needsDeferMin: 5`, one
  failure per beat), so the later spacing matches the estimate, as measured (Ivy 30.2 s to 110.3 s).

So it is neither an engine bug nor a scenario bug: the engine does what section 5.2 says, the
scenario fails work once by design, and the validator's estimate ignores the drain. It does not
matter for F15 and F16, because every NPC in each beat drains once and the gaps hold. It would
matter for a beat where only one NPC of a pair fails work first: the gap the estimate shows is then
off by `breakDrain` seconds and the order can flip (m1).

## Items checked fresh and found right

- **Correctness.** `select_feed_post` walks own posts only, takes a reply only in its `insteadOf`
  slot when both `when`s hold and a thread is open, and treats a set as spent once any member is
  shown; `feed_done?` agrees. `feedPosts` drops a reply with no usable `to` but keeps it in `shown`.
  `feed_answer` returning nil after a save cannot happen on `/feed_post`, because selection has
  already resolved the poster and the named NPC.
- **q76.** `thread_open_to?` unchanged since R1 and still right: the last-word rule first, then for
  a non-poster only a poster word newer than its newest reply, for the poster a newer word by anyone.
- **Cheat policy.** `/feed_post` still reads only `npc_id` and `object_id`; `replyTo` ships from the
  resolved thread, the server-only fields never ship, a reply's `fact` is dropped
  (`social_feed.rb:338`). The build log's tamper rows match.
- **q77 sync size.** `feedRevealed[npc]` gains `seq` (one integer per served post) and `to` (one pair
  per served reply), bounded by the authored posts, written only by `feed_post`, never in a
  `PUT /sync_state` body (step 8 measured 190 to 684 B a PUT with neither). Each `/feed_post`
  answer is a one-post delta of 180 to 292 B; `feedPosts` is sent once a page load.
- **Escaping.** Thread entries, the "Replied to" line and the profile name go through
  `h(..., { text })`; toasts use `gameAlert(..., { verbatim: true })`; `cleanPost` keeps only string
  fields, now including `replyTo`.
- **Client.** `friendface-phone.js` counts a reply once per held phone it concerns, an answer once;
  `phone_posts_slice` and the unread rule agree on which phone a reply concerns.

## Minors

### m1. The validator's `Feed` estimate leaves out `breakDrain`, so it runs late for any NPC that fails work first

- Where: `scripts/validate_access_work.rb:1862` (`first = [initial - urgent, 0].max / decay * 60`
  in `feed_report_lines`); the build log's "Timing estimate (not changed)" paragraph
  (`ACCESS_MODEL_SLICE_9_2_C3_BUILD_LOG.md:244`) and `PLAYTEST.md:192-193`, which say the cause
  was not found.
- Failure: an author plans a reply beat where Ivy's work resource starts down and Tomasz's does not.
  The estimate shows Ivy's vent at 0:40 and Tomasz at 0:45 and suggests his reply lands in her
  thread. Live, Ivy's failure drains 10 points and Tomasz's does not, so Ivy posts at 0:30 as
  planned but any later gap the author built from the estimate is off by 10 s. When the drain falls
  on the later NPC instead, he can post first and vent, and the beat fails with no validator line to
  explain it.
- Fix: in `feed_report_lines`, when the NPC has a work plan that reaches a resource the `Outage`
  lines report as starting down and its work need is urgent at load (`initial <= urgentAt`), take
  `AW.frustration(json_data, npc)['breakDrain']` off the social `initial` before computing `first`,
  and say so in the line ("first urgent at 10 s after one work failure's drain"). At the least,
  append "a counted work failure before then brings this forward by breakDrain / decayPerMin
  minutes". Then replace the build log's "cause was not found" and PLAYTEST's bare "about 10 s
  later" with the cause, and add a fixture with one failing NPC.

### m2. A feed post that contains a resource's name passes the validator and fails only the live leak check

- Where: `scripts/validate_access_work.rb`, the feed text checks in the post loop (around
  `:1593-1600`, `check_reply_text` at `:1932`), against the scanner's registration in
  `tools/playtest/lib/access_leak_scanner.rb:400-410` and `network_match?`.
- Failure: this is what step 8 hit (`bd938dbaa`). C3's own use case is a complaint about a down
  resource, so the natural vent names it ("Project drive down again"). The validator says nothing;
  the first live run reports `network_string` on the `/feed_post` answer, the reloaded `feedPosts`
  and every `/friendface_phone` slice, and the author has to work out that a resource name matched.
  The next mission with outage vents will repeat this.
- Fix: in the validator, warn when an own post's text, or any reply piece of 12 or more, equals or
  contains (at the scanner's `MIN_SUBSTRING_NETWORK` length) a resource or network `name`, `host` or
  `observations` the scanner would register: "ships once the post is out; the leak check reports
  network_string. Rename the resource or reword the post." Keep the scanner rule as it is: an
  exemption for feed text would also pass a real host name. Add one fixture.

## Nits

- **n1.** `.ob-reply-to` (`public/break_escape/css/osint-browser-minigame.css:227`) sets
  `font-style: italic` on the browser's GNF text. A pixel font has no italic, so the browser slants
  it synthetically and smears the pixels, against the PIXEL-ART UI RULE. Drop the italic; the colour
  and the "Replied to" wording already mark the line. (`.ob-empty` at `:163` does the same; it
  predates C3.)

## Not findings

- Toast names (`social-feed.js` `_name`) use the NPC record's `displayName`, which is not stripped of
  format characters as `friendface_name` now is. That display name is shown unstripped across the
  engine already; it is author text, not C3's.
- `next_seq` pins at 2^31-1, where later serves would tie. Unreachable: the seq count is bounded by
  the scenario's authored posts.
