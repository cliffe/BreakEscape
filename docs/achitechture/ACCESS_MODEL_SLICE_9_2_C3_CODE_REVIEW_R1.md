Counts: 0 blockers, 0 majors, 6 minors, 4 nits.

# Access model slice 9.2 C3: code review round 1

Reviewed: `git diff 6a834437c..a6d4ff005` (branch `build/c3-replies`), against
`ACCESS_MODEL_SLICE_9_2_C3_PLAN.md` (Final) and `ACCESS_MODEL_SLICE_9_2_C3_BUILD_LOG.md`. Steps 2 to 7
are in; step 8 (live proof) and the step 7 timing dry run are open, as the build log says.

Verdict: the selection, thread rules, route, client and leak tooling match the plan. Nothing reaches
the client early, the q76 turn rule is right and tested, and the new state is bounded. The findings
below are small: one text-filling bug, a validator/server disagreement, a narrow ink scan, report
wording and test gaps.

## Checks run

- Rails, without the lock: `access_work_feed_reply_test`, `access_work_feed_select_test`,
  `access_leak_scanner_feed_test`, `npc_habits_clues_feed_test`, `feed_post_reply_test`,
  `feed_post_test`, `friendface_phone_test`: 153 runs, 730 assertions, 0 failures.
- Node, the changed test files and every file importing a changed module (`social-feed`,
  `osint-browser-minigame`, `friendface-phone`, `test-bridge/access`, the access/network/habits/osint
  validators, verify-run): 335 tests, 0 failures, 0 skipped.
- Validator on `scenarios/test_access_social/scenario.json.erb --no-graph`: 0 lines with ❌.
- JS harness copy lists: the diff adds no static import to any engine module, so no copy list changes.

## Builder interpretations

- **F15 and F16 east of `u1_room`.** Accepted. L1, L2 and U1 already chain east of F13
  (`f13_room` east `l1_room`, then `l2_room`, `u1_room`), so "east of F13" could no longer hold. The
  chain has no locks, and PLAYTEST says to run F15 after F14.
- **`sign_l2` (and `sign_l1`).** Accepted. `git grep` finds no other reference to the old ids
  outside the scenario and the C3 docs, and the rename also cleared the pre-existing duplicate
  `sign_f14`.
- **Reply unique-text check reads ink and INCLUDEs.** Accepted. `shipped_strings` never read ink,
  and plan section 7 asks for a piece inside an ink line to warn. It reads only room NPCs' stories
  (minor m3).
- **Leak-check counts treat each reply piece as a post.** Workable, but the label then counts
  neither authored nor served posts (minor m5).
- **Pieces trimmed of end spaces and punctuation.** Accepted. The plan's example miscounts
  (`": same here."` is 12); trimming makes the example warn as intended, and a trimmed piece is still
  a substring of the shipped text, so the scanner's match is sound.

## Items checked and found right

- **q76.** `AccessWork.thread_open_to?` (`lib/break_escape/access_work.rb`, after `open_threads`):
  for a non-poster with a word in the thread, only a poster word newer than its newest reply, and not
  the thread post itself, opens it. A third NPC's reply does not count. The poster's side needs a
  newer word by anyone else. The last-word rule is checked first and separately. Tests:
  "three-NPC complaint: a second complaint reply waits for the poster, not a third NPC", the named
  variant, and the second-answer case.
- **Cheat policy.** `/feed_post` still reads only `npc_id` and `object_id`; the thread gate reads
  `feedRevealed`, which only the server writes. `replyTo` ships from the resolved `to.post`, never
  from the authored post; `insteadOf`, `complaint`, `replyToComplaint` and `when` never ship; a
  reply's item drops `fact` (`social_feed.rb` `feed_answer`). `feedPosts` and the phone slice are
  built from `feedRevealed` only, and the phone slice keeps the q63 rule. The osint browser and the
  bridge read the client store, which holds only served posts. Tamper tests cover each row of plan
  section 6.
- **q77 sync size.** `feedRevealed[npc]` gains `seq` (one integer per shown id) and `to` (one pair
  per served reply), both bounded by the authored posts, written only by `feed_post`, and never a
  sync section. `feed_seq_map` and `feed_to_map` drop junk, `next_seq` is capped. Each `/feed_post`
  answer is a one-post delta.
- **Escaping.** Thread and "Replied to" text go through `h(..., { text })` (textContent); toasts use
  `gameAlert(..., { verbatim: true })`, the plain-text path.
- **Q60 guards.** `reply_servable_in?` refuses a fact `insteadOf` post; `feed_facts` reads own posts
  only; the scanner and the OSINT validator skip reply facts.

## Minors

### m1. `{name}` is filled with `String#gsub` and a replacement string, so backslash sequences in a name are interpreted

- Where: `app/models/break_escape/social_feed.rb:349`; the validator mirrors it at
  `scripts/validate_access_work.rb:1918`.
- Failure: Ruby reads `\0`, `\&`, `\'`, `` \` `` and `\\` in a replacement string. A Friendface name
  with a backslash, such as `Bo\'b`, gives `"Bo, mine too.b, mine too."` from
  `"{name}, mine too."` (checked in irb). The plan says the name goes in "as plain text". The text
  is author-controlled and the validator does the same thing, so nothing leaks, but the shipped text
  is wrong.
- Fix: use the block form in both places, `text.gsub('{name}') { name }`, and add a route test with a
  backslash in `forms.first`.

### m2. The validator accepts an empty-string thread field that the server refuses

- Where: `AccessWork.well_formed_reply?` (`lib/break_escape/access_work.rb`, the
  `[post['replyTo'], post['replyToComplaint']].compact.size == 1` clause) against `check_reply`
  (`scripts/validate_access_work.rb`, `named = [...present_string?...].count(true)`).
- Failure: an author leaves `"replyTo": ""` beside a valid `replyToComplaint`. The validator counts
  one present thread field and reports nothing; the server sees two non-nil fields and never serves
  the reply. The vent always comes out instead, which is the duplicate C3 exists to remove, with no
  validator line to explain it.
- Fix: make the two agree. Either the server counts present strings only (drop the `compact.size`
  clause), or the validator errors when a thread field is present but not a non-empty string. Add a
  fixture.

### m3. The reply ink scan reads only room NPCs' stories

- Where: `scripts/validate_access_work.rb:1488` (`story_texts`).
- Failure: phone contacts, timed conversations, mail-reply records and any object with a
  `storyPath` also ship ink. A reply piece that sits in one of those passes the validator; the
  player can then read the line in that ink before the reply is served, and the leak check reports a
  `feed_text` leak that the validator should have flagged.
- Fix: collect every `storyPath` string in the scenario with a document walk (as `json_actions`
  does), then read each file and its INCLUDEs as now.

### m4. The C and C2 feed report lines count replies as posts

- Where: `scripts/validate_access_work.rb:1847` (`feed_report_lines`) and `:1794`
  (`reactive_report_lines`); neither changed in C3.
- Failure: the validator now prints "Feed tomasz ... 4 posts ... posts expected at about 1:00, 2:20,
  3:40, 5:00" when at most two can ever come out, and lists each reply under "Reactive feed" with a
  "fires when" line as if it fired at its own position. An author planning a beat from these lines
  plans for posts that never appear. PLAYTEST's F15 and F16 times are right only because the first
  two estimates match the two own-post slots.
- Fix: count and time own posts only (one per alternative set), and in the reactive list either skip
  replies or mark each one "stands in for `<insteadOf>`", leaving the reply detail to the `Reply`
  lines.

### m5. The leak check's "feed post(s)" count is a count of text pieces

- Where: `tools/playtest/lib/access_leak_scanner.rb:221`.
- Failure: a reply with two pieces of 12 or more counts twice (`f16_ivy_re_tom` gives "Not just you"
  and "Mine has gone as well"), so the PLAYTEST counts line becomes a number that matches neither
  authored nor served posts. A future change that drops a reply's piece registration would still
  show a plausible count.
- Fix: count distinct owners for `:post` entries
  (`@feed_texts.values.select { |f| f[:kind] == :post }.map { |f| f[:owner] }.uniq.size`), and if the
  piece total is useful print it as its own figure. Then set PLAYTEST's expected line from the live
  run in step 8.

### m6. Plan section 10 validator fixtures missing

- Where: `test/js/validator-access-reply.test.mjs`.
- Failure: no fixture asserts the "thread can never open" warning, the second-answer report line,
  the complaint second-reply report line, or the "share no cause or need" note. The `text rules`
  fixture plants chatter text but asserts only the short-piece and own-post `{name}` warnings, not a
  unique-text hit. Any of these lines could break silently.
- Fix: add one assertion each, as the plan's list asks.

## Nits

- **n1.** `AccessWork.friendface_name` (`lib/break_escape/access_work.rb:952`) strips `[[:cntrl:]]`
  only; Unicode format characters such as U+202E (right-to-left override) and U+200B pass (checked).
  A name with an override reverses the rest of the reply line in the thread and the toast. Strip
  `\p{Cf}` as well.
- **n2.** The complaint report line (`scripts/validate_access_work.rb:2113`) prints the same list
  twice and calls vent-only members "each replying in place of their vent". List the members with a
  `replyToComplaint` reply first, then the union. The answer and second-reply lines
  (`:2089`, `:2092`, `:2100`) print `'f16_ivy_vent''s thread`; drop the second quote or write "the
  thread of 'f16_ivy_vent'".
- **n3.** `feed_answer` recomputes `AccessWork.revealed_map` for every reply item
  (`app/models/break_escape/social_feed.rb:343`), and `open_threads` and `revealed_map` call
  `room_npc`, which walks every room, per candidate. Bounded by the scenario, but GET /scenario on a
  large mission does this per reply. Build the map once per request and pass it in, and index room
  NPCs by id once.
- **n4.** Trimming makes "Not just you" (exactly 12 characters) a registered leak text. Any engine
  string or other NPC line with that phrase raises a false `feed_text` report. Consider rewording the
  F16 line so each piece is distinctive, or registering only pieces of, say, 16 or more when a longer
  piece exists.

## Not findings (open work the build log already lists)

- Step 7's timing dry run and the PLAYTEST counts line ("seven feed posts, two feed facts") wait for
  step 8.
