# Friendface reactions: build log

Plan: `docs/achitechture/FRIENDFACE_REACTIONS_PLAN.md` (Final). Branch `build/reactions`, made from
`main` 33c003230 (C3 merged) with the plan merged in. User answers taken as the suggested options:
q79 staff-only reactions (no player reactions), q80 the keys like, laugh, sad, angry, q81 icons
drawn by hand with the free pixel workbench (the user approves them before merge).

## Step 1: C3 checks

- `AccessWork.feed_done?` (`lib/break_escape/access_work.rb`) reads only the `shown` list it is
  given (with `include?`) and static reachability (`when_reachable?`, which reads only the
  scenario). It is pure and monotone in `shown`, so the plan's stability argument holds.
- Names used by the plan are all present on `main` with the same signatures: `revealed_map`
  (entries `{ npc, seq, to, reply }`, `to` a post id), `reply_target`, `feed_to_map`,
  `feed_seq_map`, `set_member_ids`, `walk_order`, `FEED_ITEM_KEYS`, `feed_answer`, and the
  validator's `feed_post_index`, `reply_threads`, `answer?`, `answer_repliers`.
- C3 has not added its replies text to `README_scenario_design.md`. The reactions paragraph went in
  after the "Social media feeds" validator paragraph; C3's own text is still to be written by C3.

## Step 2: derivation (commit 4c1d7a5e3)

`AccessWork::REACTION_KEYS`, `REACTION_FIELDS`, `feed_reacts` (the cleaner), `drawable_feed_posts`,
`feed_reactions(data, store, revealed: nil, via: nil)` and `reactor_candidates`.

- Drawability for a reply uses `reply_target` (the stored `to`, or the authored `replyTo` fallback
  for a reply that is not an answer), the same rule `feed_posts_for_client` uses to draw it. The
  plan's text says "its stored `to` is a hash"; the two differ only for an edited save whose `to`
  is missing but whose `replyTo` still resolves, and there the post is drawn, so it may be a target.
- `via:` is applied after the dedupe; a test checks a dedupe loser whose `via` is the filtered post
  never appears, and that `revealed:` plus `via:` equals the full map filtered.
- Tests: `test/unit/access_work_feed_reactions_test.rb`, 18 runs, all green (with C3's
  `access_work_feed_reply_test.rb` and `access_work_feed_select_test.rb`: 61 runs, 0 failures).

## Step 3: route (commit 36afbd856)

`app/models/break_escape/social_feed.rb`: `feed_answer(..., revealed: nil)`; the `/feed_post`
answer's `reactions` from the pre-write map plus the new entry; `feedPosts` items gain `reactions`
after the `FEED_ITEM_KEYS` slice, with one map per load; both calls go through
`with_reactions_rescue`, which re-raises in test unless
`BreakEscape::SocialFeed.rescue_reactions_in_test` is on, and otherwise reports through
`Rails.error.report(e, handled: true, context: { game_id:, post_id: })` and logs a
`[reactions] derivation failed` line.

- Tests: `test/controllers/break_escape/feed_post_reactions_test.rb`, 10 runs. Every Rails test
  file touching the feed route (8 files) ran: 171 runs, 1418 assertions, 0 failures.
- The dummy app has `show_exceptions = true`, so with the rescue off a raise reaches the test as a
  500; the test accepts either a raise or a 500, and is paired with the same request answering
  with its post when the rescue is on.
- **Not covered:** "an answer with no post (a reply whose thread poster is unknown) carries none,
  and the next load agrees". In the route, `feed_answer` can return nil only if the thread poster
  or named NPC stops being a room NPC between selection and answer, which the honest route cannot
  reach; the `if answer` guard is in place and the derivation's drawable tests cover the same
  conditions. A test would need a stub of `feed_answer`.

## Step 4: validator (commit a6b3df22f)

`scripts/validate_access_work.rb`: `DEAD_PHRASES`, `post_dead_reasons`, `alt_set`,
`reaction_order_bound` (the static required-post helper), `reaction_analysis` (errors, warnings and
report rows in one pass, so the two cannot disagree), `check_reactions` and
`reaction_report_lines`, called beside `check_replies` and `reply_report_lines`. C3's
`check_reply` and `check_reactive_post` are unchanged. Schema: `feed.reacts` documented, `key` a
plain string with no enum. README: a "Reactions" paragraph.

- Tests: `test/js/validator-access-reactions.test.mjs`, 10 tests, all green, including the two-way
  agreement of `post_dead_reasons` with `check_reply` over nine fixtures (C3's copied from `main`
  33c003230, plus this file's three-reason, non-feeding and other-NPC `insteadOf` fixtures), the
  catch-all, and the C3 test-title tripwire (19 titles). Every `validator-access*` and `validator-social*` JS file passes. `test_access_social` still validates at 0 failure lines. C3's `validator-access-reply.test.mjs`:
  19 pass. `validator-social-schema.test.mjs`: 6 pass.
- Report line wording: the plan's "with his first post" is written "with Kofi's first post", since
  the validator has no pronouns; the `alongside` form says "if it is out by then".

## Step 5: client (part done at handover)

Done: `public/break_escape/js/systems/social-feed.js` gains `REACTION_KEYS`, `REACTION_LABELS`, the
`reactions` store, `_react`, `_stored`, `reactionsFor`, reactions in `apply` (stored before `_add`,
`npc_reacted:<reactor>` after, with `site`, `targetNpc`, `targetPerson`, `targetReplyToPerson`) and
in `restore` (no event). `public/break_escape/js/systems/test-bridge/access.js` `feed()` gains
`reactions` on null-prototype objects. No new static import, so no harness copy list changes.

- Tests: `test/js/social-feed-reactions.test.mjs` (8 pass, the key-set match against the Ruby
  constant included), `test/js/test-bridge-access.test.mjs` (14 pass; its whole-object `feed()`
  expectations gained `reactions: {}`, plus a `__proto__` test). Importers run green:
  `social-feed.test.mjs`, `social-feed-replies.test.mjs`, `friendface-phone.test.mjs`,
  `social-osint-browser.test.mjs` (36), `npc-social-lockout-q33.test.mjs` (8).

## Handover (2026-11-12)

Stopped at the context limit, part way through step 5.

**Done:** steps 1 to 4; step 5's store and bridge.

**Open, in order:**

1. Step 5, the osint browser (`public/break_escape/js/minigames/osint-browser/osint-browser-minigame.js`):
   `_feedReactions(postId)` (only when the feed has `reactionsFor`, as `_feedReplies`), `_reactionRow`
   after each post's `ob-block` button (a sibling in `ob-blocks`) and at the end of each
   `_replyEntry`; chips as `<button type="button" class="ob-reaction">` with
   `data-focus="reaction:<postId>:<key>"`, `aria-label` "Sad, 2: Kofi Mensah, Mei Tanaka" (names
   through the browser's `_profileName({ person })`), no `aria-expanded`, `data-open` when open, an
   `<img alt="">` icon from `assets/icons/reaction-<key>.png` with the label text as fallback; the
   names line (`.ob-reaction-names`, `aria-hidden="true"`, always present) and all of plan
   section 4's open/focus/hover rules, the pointer-focus mark, `_rendering` guard, `pushLayer`
   layer `'reaction-names'`, `_dropReactionNames()` in `go()` and `cleanup()`,
   `_closeReactionNames()` for Esc, clicks and keyboard focus; the `npc_reacted:*` listener beside
   `npc_posted:*`; CSS in `public/break_escape/css/osint-browser-minigame.css` under the pixel-art
   UI rule; the jsdom tests in `test/js/social-osint-browser.test.mjs` (pointer events as
   `MouseEvent` with a defined `pointerType`) and the CSS rules check in
   `test/js/social-feed-reactions.test.mjs`.
2. Step 6, leak scanner (`tools/playtest/lib/access_leak_scanner.rb`, `access-leak-check.rb`,
   `test/unit/access_leak_scanner_feed_test.rb`): `REACTION_KEYS` copy and match test, the four
   kinds (`feed_reacts_key` outside the early return), `counts[:reaction_items]`.
3. Step 7, icons: four 16x16 PNGs `public/break_escape/assets/icons/reaction-{like,laugh,sad,angry}.png`
   drawn with the free `mcp__pixellab__pixelart_workbench` (no paid generation), in the style of
   the 16x16 `attach-*.png` icons; shown in a screenshot for the user's approval.
4. Step 8, scenario `scenarios/test_access_social/scenario.json.erb`: the `reacts` lists and the two
   tasks (`f15_reacted`, `f16_reacted`) from plan section 10, `PLAYTEST.md` rows; validator at 0 ❌
   with no reaction warnings and the expected report lines.
5. Step 9, live proof on a keyless server at :3120 or higher, then this log's results.

**Files touched so far:** `lib/break_escape/access_work.rb`, `app/models/break_escape/social_feed.rb`,
`scripts/validate_access_work.rb`, `scripts/scenario-schema.json`, `README_scenario_design.md`,
`public/break_escape/js/systems/social-feed.js`, `public/break_escape/js/systems/test-bridge/access.js`,
and the tests named above.

**Gotchas:** holding an NPC's Friendface phone stops that NPC's phone posts (a route test gives the
player the phone only after the thread); the dummy app shows exceptions, so raises surface as 500s
in integration tests; `friendface_name` falls back to `displayName`, so validator fixtures print
"Kofi Fullname".
