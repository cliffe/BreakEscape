# Access model slice 9.2 C3: build log

Plan: `docs/achitechture/ACCESS_MODEL_SLICE_9_2_C3_PLAN.md` (Final). Branch `build/c3-replies`, from `main` at
6a834437c (ff-phone merged), worktree `.claude/worktrees/p-c3-build`.

## Steps

| Step | State | Commits |
|---|---|---|
| Plan brought in | done | 6406d8988 |
| 2 AccessWork | done | step 2 commits, then the shared `reply_text_pieces` helper |
| 3 social_feed.rb route | done | step 3 commits |
| Pre-existing validator failures | fixed | dda5cb5a5 |
| 4 Validator, schema, OSINT, habit clues | done | validator, fixtures, OSINT skip, schema; af4e082b2, a1b8a9fe0 |
| 5 Client | done | 0cb5a1ee8 |
| 6 Leak scanner, verify-run.rb | done | 94bee74e0, the helper rename after it, 505c29e72 |
| 7 Scenario F15 to F17, PLAYTEST.md | done, timing dry run included | b14edfe4a, 0a2c17dba, step 8 commits |
| 8 Live proof | done (F1 to F14 regression partial, see below) | bd938dbaa, the step 8 log commit |

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

## Step 4 remainder

- `Clues.readable_texts` leaves out every set member through a shared `each_feed_text`; new
  `Clues.set_member_texts` tags each with its set id (the own post's id; for a reply its
  `insteadOf` when that names an own post of the NPC, else the reply's own id).
- `check_password` second passes for `guessable` and `strong`, and the psk replacement warning in
  `validate_network.rb`; each new line ends "the dungeon graph does not draw this clue". The sets
  named are those whose text alone completes the clue, else every set that holds one.
- The reply unique-text rule also reads every room NPC's story (compiled JSON, or `.ink` with its
  INCLUDEs) through a new `story_texts`, so a piece inside an ink line warns. Own posts keep the
  scenario-JSON-only rule.
- Tests: `test/unit/npc_habits_clues_feed_test.rb` (4), three fixtures in
  `validator-npc-habits.test.mjs`, one in `validator-network-model.test.mjs`, the ink-line fixture in
  `validator-access-reply.test.mjs`, the reply-fact fixture in `validator-social-osint.test.mjs`.

## Step 5: client

- `social-feed.js`: `POST_FIELDS` gains `replyTo`; `_add` keeps `seq` and the four reply ids; the
  `npc_posted` payload carries `seq` and, for a reply, `replyTo` and the four ids; `postsFor` leaves
  answers out and marks a reply with `replyToPerson`; new `repliesFor`; reply toast "<replier>
  replied to <named> on <site>" (title "New reply"), names from `npcName`, then `profileName`, then
  the id. `liveDeps.npcName` now returns null without a record; new `liveDeps.profileName`.
- osint browser: `_feedReplies`, `_replyEntry` (no selectable block; "Replied to" on the replier's
  profile), threads under own posts, `_onPosted` re-renders on `replyToPerson`; CSS `.ob-thread`,
  `.ob-reply`, `.ob-reply-to`.
- `friendface-phone.js`: a reply counts on the replier's and `replyToNpc`'s phones and the player's
  own, each key once. Bridge `feed().threads` on a null-prototype object.
- Tests: new `test/js/social-feed-replies.test.mjs` (11); three cases in `social-osint-browser`; one
  in `test-bridge-access`; two old expectations gained `seq` and `threads`.

## Step 6: leak scanner and verify-run

- `access_leak_scanner.rb`: `/friendface_phone` context, its `feedPosts` judged as GET /scenario's;
  a reply's text registered by `AccessWork.reply_text_pieces` (12 or more); no feed fact from a
  reply; `feed_reply_target` rule (a `replyTo` naming a post not served yet) in `RULE_TEXT`, so
  `access-leak-check.rb` prints it with the others. The counts line now counts reply pieces as feed
  posts, so PLAYTEST's "seven feed posts, two feed facts" needs the new numbers after a live run.
- `verify-run.rb`: `<npc> <count> [<id>:<seq>[><thread>] ...]`, legacy `{ n, at }` as a count.
- Tests: six C3 cases at the end of `access_leak_scanner_feed_test.rb`; one in
  `playtest-verify-run-access.test.mjs`.

## Step 7: scenario

- F15 (`f15_room`) and F16 (`f16_room`) appended **east of `u1_room`**, not east of F13 as the plan
  says: L1, L2 and U1 now sit east of F13. The plan's `sign_f15` was already used by L2's sign, so
  L2's became `sign_l2` (as L1's became `sign_l1`).
- New `social.people` (forms.first and full) for the five, Friendface profiles with full names,
  resources `f15_drive` and `f16_drive`, globals true from the start, five tasks.
- Validator: 0 failure lines. Its estimate: F15 posts at about 0:40, 0:55, 1:10; F16 Ivy 0:40, 2:00,
  Tomasz 1:00, 2:20 (Ivy's answer 20 s before Tomasz's second use). PLAYTEST.md uses these, marked
  to confirm in a dry run.

## Step 8: timing dry run, live proof, measurements

Keyless server on :3052 started by hand from the worktree, headless shell, `--capture-responses`,
the loop recipe (setTimeout RAF, `setFPS(20)`, fixed steps on) after every bootstrap. Pace earned in
real time; the needs clock was never stepped. Games: **1723** (dry run and first proof, created
before the fix below) and **1731** (the clean proof after it). Route in both: bootstrap, F14a (pick
up `player_phone`), F14b (borrow Jake's phone), walk east through every room to `f15_room`, stand
back, enter `f16_room`, stand back, then F17.

**Fix found by the proof (bd938dbaa).** The leak check reported `network_string` for
`resource:f15_drive` and `resource:f16_drive`: the resource names "Project drive" and "Shared
drive" are the openings of Asha's and Ivy's vent texts, so the served post, the reloaded
`feedPosts` and the `/friendface_phone` slice each counted as a resource name outside the network
routes. The resources are now "Project file share" and "Team file share"; no post text changed.
Validator after it: 0 failure lines. Game 1723 keeps its old snapshot and so its eight findings
(all this one cause); game 1731 is clean.

**Timing (both games agree to 0.3 s).** t = 0 is the `/unlock` answer carrying the room. Every
NPC's `down` work failure report went out at 5.3 to 5.5 s, before its first `/feed_post`.

| Post | Measured | Plan / validator estimate |
|---|---|---|
| `f15_asha_vent` (seq a) | 30.1 s | 0:40 |
| `f15_kofi_re_drive` (k) | 45.1 s | 0:55 |
| `f15_mei_re_drive` (m) | 60.1 s | 1:10 |
| `f16_ivy_vent` (i) | 30.2 s | 0:40 |
| `f16_tom_re_ivy` (t) | 50.2 s | 1:00 |
| `f16_ivy_answer` (j) | 110.3 s | 2:00 |
| `f16_tom_re_ivy_again` (u) | 130.3 s | 2:20 |

Every post is about 10 s before the validator's estimate, with the spacing as planned, so no
`initial` moved. Ivy's answer lands 20 s before Tomasz's second use (the plan asks at least 5).
PLAYTEST.md now gives the measured times. F14a already leaves `friendface` in
`se_osint_state.visited` (picking up the phone opens it on Friendface), so the terminal visit before
F15 is a check only; PLAYTEST.md says so.

**Proof results (game 1731; 1723 the same apart from the leak findings above).**
- F15: `{name}` filled as "Asha" in both replies; toasts "Kofi Mensah replied to Asha Rao on
  Friendface" and "Mei Tanaka replied to Asha Rao on Friendface"; tasks `f15_replied`,
  `f15_thread`; `feed().threads.f15_asha_vent` = Kofi, Mei; all three `done`; no further
  `/feed_post` for them. Leak check: no leaks, counts line 35 feed posts and 2 feed facts.
- F16: thread Tomasz, Ivy, Tomasz; names filled Ivy, Tomasz, Ivy; toasts "Tomasz Nowak replied to
  Ivy Clarke", "Ivy Clarke replied to Tomasz Nowak", "Tomasz Nowak replied to Ivy Clarke" (on
  Friendface); tasks `f16_replied`, `f16_answered`, `f16_again`; both `done`. Player's phone unread
  equals the posts revealed since it was opened (21 in 1723, 20 in 1731 at that moment), each once;
  Jake's held phone 0 (no post of his or into his thread). Leak check: no leaks.
- `verify-run.rb --access` (1731): `asha 1 [f15_asha_vent:6]`, `kofi 1 [f15_kofi_re_drive:7>f15_asha_vent]`,
  `mei 1 [f15_mei_re_drive:8>f15_asha_vent]`, `ivy 2 [f16_ivy_vent:15 f16_ivy_answer:19>f16_ivy_vent]`,
  `tomasz 2 [f16_tom_re_ivy:16>f16_ivy_vent f16_tom_re_ivy_again:20>f16_ivy_vent]`: a < k < m and
  i < t < j < u hold (1723: 6, 7, 8 and 17, 18, 20, 21).
- `/feed_post` per beat: three answers in F15 and four in F16 for the beat's NPCs, no `tooSoon`.
- F17 (`?skip_resume=1`): `feed().threads` the same in the same order, unread empty, no toast, no
  organic `/feed_post`; the Friendface terminal (real click path, profile links) shows Asha's thread
  (Kofi, Mei) and Ivy's (Tomasz, Ivy, Tomasz) with the same filled names; Kofi's profile shows
  "Replied to Asha Rao", Tomasz's both replies with "Replied to Ivy Clarke" (newest first, as every
  profile lists posts); `player_phone` shows the same. Full-capture leak check on 1731: 158
  responses, no leaks. No spent post id appears in any response of either game.
- Tamper rows (1723, after F16): `/feed_post` for Ivy plain and with forged `reply_to`, `post_id`,
  `insteadOf`, `complaint`, `name`: the same `{ post: null, done: true }`; Tomasz with forged
  `post_id`/`reply_to`: the same; `/friendface_phone` for Kofi (phone not held) 403 `no such phone`;
  the player's own phone with `posts: 1` lists Tomasz's two replies with `seq`, `replyTo` and the
  four ids, and Jake's held phone an empty slice. The "Tomasz before Ivy's vent" row was left to the
  route tests: forging it live would spend Tomasz's pace floor and break the beat.
- Screenshots (scratchpad `c3b/`, not committed): `f17-terminal-asha.png`, `-ivy.png`,
  `-kofi.png`, `-tomasz.png` (game 1723), `b-f17-terminal-tomasz.png` (1731). The reply toasts are
  proven from the toast log, not a screenshot.

**F1 to F14 regression: partial.** The live runs covered F14a and F14b in full and, passively along
the walk, F3 (Lena's post and task), F9 (`f9_posted`), F10 to F13 (Nadia's, Theo's, Greg's and
Ruth's posts, `f13_blocked`), L1 (Sade's post) and U1 (all three tasks), with the leak check clean
over all of it. F1, F2, F4 to F8 and the L2 and U2/U3 interactions were not replayed live; they rest
on the orchestrator's merge-batch suites.

**Section 5.1 measurements (game 1731 after F16).**
- `feedRevealed` entries: an own-post NPC 74 to 135 B; a replier 147 to 150 B (one reply), Ivy
  176 B (vent and answer), Tomasz 248 B (two replies). A `to` pair costs 55 to 57 B per served reply
  and a `seq` pair about 17 to 25 B per served post. Whole `feedRevealed` 1736 B of a 10.1 kB
  `player_state` (1723). Each NPC's entry is bounded by its authored posts.
- `/feed_post` answers: an own post 180 to 184 B; a reply 283 to 292 B, of which 103 to 109 B are
  the reply fields (`post.replyTo` and the four ids). Sent once per served post.
- `GET /scenario` after reload: 20.1 kB in all against 10.0 kB fresh; `feedPosts` 4219 B for 21
  posts, the 5 replies 1131 B of it. Sent once per page load.
- `/friendface_phone`: the own phone's slice is the same 4219 B block; an NPC's held phone with no
  thread 48 B.
- `PUT /sync_state`: 10 PUTs in 1731 (18 in 1723), 190 to 684 B, mean 374 B. None carries
  `feedRevealed`, `seq`, `to` or any post text: replies add nothing to the sync body beyond the
  usual one-off `triggeredEvents` key per fired `npc_posted` mapping (for example
  `kofi:npc_posted:kofi:0`, about 30 B, sent once), the same as any task-carrying post. Nothing
  C3 adds grows with play time or is re-sent (rule q77).

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

## Handover (2026-11-12, step 8 agent)

**Done:** step 8 (dry run, live proof, 5.1 measurements); the resource rename the proof needed;
PLAYTEST.md times, the Friendface check note and the counts line (35 feed posts, 2 feed facts).

**Open:** the F1 to F14 live regression beyond what the walk covers (see step 8); the validator's
post-time estimate runs about 10 s late for these beats (not changed: it is an estimate, and
PLAYTEST.md now quotes measured times); the code review rounds.

## Handover (2026-11-12, second agent, context limit)

**Done:** the two validator failures; steps 4, 5 and 6 in full; step 7's scenario and PLAYTEST.md.

**Open, in order:**

1. Step 7 timing dry run (plan section 8): play F15 and F16 once on a keyless server, check each
   NPC's `down` failure report precedes its first `/feed_post`, the order of the answers, Ivy's
   answer at least 5 s before Tomasz's second use (else Tomasz's social `initial` down by 5), and
   whether F14 already leaves `friendface` in `se_osint_state.visited`. Write the measured times into
   PLAYTEST.md's F15 to F17 table and fix the leak check's expected counts line.
2. Step 8: live proof on port 3050 or higher (check it is free), `--headless`, `setFPS(20)` with
   fixed steps, `--capture-responses`; F15, F16, F17 with verify-run, leak check, `/feed_post`
   budgets, `feed().threads`, toasts, phone badges; F1 to F14 regression; section 5.1 measurements
   (entry sizes per NPC, answer sizes); screenshots; list the game ids.

**Gotchas:** the scenario round-trips exactly through `json.dumps(indent=2, ensure_ascii=False)`, so
a Python load-edit-dump makes a minimal diff (`scratchpad/c3b/add_f15_f16.py` built F15 and F16).
Reply pieces are trimmed of end punctuation, so validator messages quote pieces without it.

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
