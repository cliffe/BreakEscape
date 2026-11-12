# Access model slice 9.2 C3: build log

Plan: `docs/achitechture/ACCESS_MODEL_SLICE_9_2_C3_PLAN.md` (Final). Branch `build/c3-replies`, from `main` at
6a834437c (ff-phone merged), worktree `.claude/worktrees/p-c3-build`.

## Steps

| Step | State | Commits |
|---|---|---|
| Plan brought in | done | 6406d8988 |
| 2 AccessWork | done | step 2 commits, then the shared `reply_text_pieces` helper |
| 3 social_feed.rb route | done | step 3 commits |
| 4 Validator, schema, OSINT, habit clues | partly done (see handover) | validator, fixtures, OSINT skip, schema |
| 5 Client | not started | |
| 6 Leak scanner, verify-run.rb | not started | |
| 7 Scenario F15 to F17, PLAYTEST.md | not started | |
| 8 Live proof | not started | |

## Step 2: AccessWork (`lib/break_escape/access_work.rb`)

- `select_feed_post` gains the keyword `revealed:` after the existing seven positional arguments (`met_use`
  was already the seventh), so every positional call keeps its meaning. It walks own posts in walk order
  (`walk_order`), checks the spent test, and serves the reply with the oldest open thread in the slot of
  its `insteadOf` post, ties by authored order. The result gains `to`.
- New: `REPLY_FIELDS`, `reply_post?`, `own_feed_posts`, `feed_replies`, `well_formed_reply?`,
  `reply_servable_in?` (the runtime guards: well formed, `insteadOf` post reactive and fact-free, not its
  own `replyTo`), `walk_order`, `set_member_ids`, `feed_seq_map`, `feed_to_map`, `next_seq` (capped at
  2^31 - 1), `room_npc`, `reply_target` (stored `to`, or the authored `replyTo` fallback for a reply
  that is not an answer), `revealed_map`, `open_threads`, `thread_open_to?` (last word and turn rule),
  `friendface_name`, `reply_text_pieces`.
- `feed_facts`, `feed_shown_ids` (legacy `{ n, at }`) and `feed_done?` skip replies; `feed_done?` treats
  an own post's alternative set as finished when any member is shown or the post can never fire.
- Tests: `test/unit/access_work_feed_reply_test.rb` (27 cases) beside the C2 file.

## Step 3: route (`app/models/break_escape/social_feed.rb`)

- `reveal_feed_post!` builds `revealed` with `AccessWork.revealed_map` from the stored record, writes
  `{ shown, at, seq, to }` (four keys only), and answers with top-level `seq` and, for a reply,
  `post.replyTo`, `replyToNpc`, `replyToPerson`, `namedNpc`, `namedPerson` and `{name}` filled.
- `feed_answer` never puts `fact` on a reply; `POST_KEYS` gains `replyTo`, set only from the resolved
  thread. `feedPosts` items gain `seq` and the reply fields (`FEED_ITEM_KEYS`); a complaint reply or an
  answer with no usable `to` is left out.
- `open_friendface_phone` slices an NPC's phone to its own posts plus same-site served replies into them
  (`phone_posts_slice`).
- Tests: new `test/controllers/break_escape/feed_post_reply_test.rb` (14 cases: route, names, fact on a
  reply, legacy entries, removed `to`, null serve, tamper rows, phone slice); the whole-entry assertion in
  `feed_post_test.rb` now includes `seq` and `to`.

## Step 4 so far

- `scripts/validate_access_work.rb`: `check_replies`, `check_reply`, `check_reply_text` (password scan
  per filled name, the 12-character rule on the longest piece, the unique-text rule per piece of 12 or
  more and per filled text), `{name}` in an own post, the order warnings, one-way link, complaint member
  with no reply, answer with no replier, second reply with no answer, and `reply_report_lines` (reply,
  answer, second reply, second answer, per-complaint members). Fixtures:
  `test/js/validator-access-reply.test.mjs` (8 tests).
- `scripts/validate_social/osint.rb`: `feed_elements` reads own posts only.
- `scripts/scenario-schema.json`: feed `order` and post properties (`when`, `deliberate`, `replyTo`,
  `replyToComplaint`, `complaint`, `insteadOf`); `additionalProperties` left open.

## Interpretations

- **Literal pieces.** The plan says `"{name}: same here."` raises the 12-character warning with an
  11-character longest piece; split literally, `": same here."` is 12. A piece is therefore taken with
  the spaces and punctuation at its ends trimmed (`AccessWork.reply_text_pieces`). The leak scanner
  (step 6) must use the same helper so the two agree.
- **`revealed_map` lives in AccessWork** rather than the route, so the unit tests replay request orders
  through the same builder. Its entries carry an extra internal `reply` flag.
- **Route tests** are in a new file `feed_post_reply_test.rb` beside `feed_post_test.rb`, which the plan
  names; only the whole-entry assertion changed in the old file.
- **Phones in route tests** are put in the inventory after the thread is served: a held phone makes its
  NPC phoneless, as the plan says for the live proof.

## Pre-existing validator failures

`scenarios/test_access_social` has two failure lines on `main` at 6a834437c, unchanged by C3: kim has a
feed and a phone but holds no Friendface phone, and `sign_f14` is used twice (lobby and `l1_room`). Step
7 needs a clean validator, so the next agent should fix both in the scenario (or ask the orchestrator if
ff-phone owns them).

## Tests run (affected files only, no lock)

- `bin/rails test test/unit/access_work_feed_reply_test.rb test/unit/access_work_feed_select_test.rb
  test/unit/access_work_usb_habit_test.rb`: 57 runs, 0 failures (before the last helper commit; the
  helper adds a function only).
- `bin/rails test` on `feed_post_reply_test.rb`, `feed_post_test.rb`, `friendface_phone_test.rb`: 63 runs,
  0 failures. On `usb_habit_test.rb`, `access_model_no_password_test.rb`, `social_lockout_q33_test.rb`,
  `access_leak_scanner_feed_test.rb`: 89 runs, 0 failures.
- `node --test` on `validator-access-reply`, `-reactive`, `-social` and the osint and schema files: all
  pass (8, 43 with the neighbours, 142).

## Handover (2026-11-12, context limit)

**Done:** steps 2 and 3 in full; step 4's validator, fixtures, OSINT skip and schema.

**Open, in plan order:**

1. Step 4 remainder: `Clues.readable_texts` leaves out `AccessWork.set_member_ids`, new
   `Clues.set_member_texts`, the `guessable` and `strong` second passes in `check_password`
   (`validate_npc_habits.rb`), the psk replacement warning (`validate_network.rb:208`), each warning
   ending "the dungeon graph does not draw this clue"; tests `test/unit/npc_habits_clues_feed_test.rb`
   and a `validate_npc_habits.rb` fixture; an OSINT validator fixture (a fact on a reply is not counted
   as granted). The validator fixture for "a reply piece inside an ink line" is not written yet (the
   chatter fixture in `validator-access-reply.test.mjs` asserts only the short-piece and own-post
   warnings).
2. Step 5 client: `social-feed.js` (`POST_FIELDS`, `_add`, `postsFor` leaving answers out,
   `repliesFor`, toast wording and name fallback, `liveDeps.profileName`), osint browser thread drawing
   and CSS, `friendface-phone.js` counts, bridge `threads`; JS tests.
3. Step 6: leak scanner (`/friendface_phone` context, reply pieces via `AccessWork.reply_text_pieces`,
   `feed_reply_target`, reply fact skip in `collect_feeds`) and `verify-run.rb` row format; tests.
4. Step 7: F15 to F17 in `scenarios/test_access_social` after a timing dry run; fix the two pre-existing
   validator failures above; `PLAYTEST.md` rows.
5. Step 8: live proof on a keyless server on port 3050 or higher, headless, `setFPS(20)` with fixed
   steps; leak scanner over the live games; section 5.1 measurements; screenshots.

**Gotchas:** a `\u0000` in a Postgres jsonb value fails the insert, so control-character tests use
`\u0001`. Holding an NPC's Friendface phone makes it phoneless, so `/feed_post` is refused for it.
