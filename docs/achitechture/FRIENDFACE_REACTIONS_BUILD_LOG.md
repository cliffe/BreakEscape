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
  conditions. A test would need a stub of `feed_answer`. Covered since code review R1 m3: "an
  answer with no post carries none, and the next load agrees" stubs `feed_answer` to nil for
  Ivy's answer. The answer has no post and no `reactions`; a load while the stub holds leaves the
  item out and puts none of its reactions on another item; once the answer builds again, the load
  draws the post (stored and drawable) and equals the run with no stub.

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
  the validator has no pronouns; the `alongside` form says "if it is out by then" (since code
  review R1 n1, "if '<target>' is out by then", and nothing more on the `toComplaint` form).

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

## Step 5, rest (commit bf6f812ae)

`osint-browser-minigame.js`: `_feedReactions`, `_reactionRow` (a sibling of the post's `ob-item` in
`ob-blocks`, and the last child of each `_replyEntry`), `_reactionChip`, `_paintRow`,
`_paintReactions`, `_dropReactionNames`, `_closeReactionNames`, `_onReacted` and the
`npc_reacted:*` listener beside `npc_posted:*`. `_renderMain` now wraps `_renderBody` with the
`_rendering` flag, drops the hovered key, clears a focused key whose chip did not come back, and
paints every row after `_restoreFocus`. A row is painted in place (no full render) for focus,
hover, click and Esc, so focus never moves. The names line text is "Sad: Kofi Mensah, Mei
Tanaka". A failed icon is swapped for the label span and its key remembered for the session
(`MISSING_ICONS`), so a re-render does not flash. CSS: `.ob-reactions`, `.ob-reaction-chips`,
`.ob-reaction`, `[data-open]`, `:focus-visible`, `-icon`, `-label`, `-count`, `-names`.

- Tests: `social-osint-browser.test.mjs` 50 pass (14 new reaction tests, every section 11 names-line
  case); `social-feed-reactions.test.mjs` 9 pass (the CSS rules test added). Every test file that
  imports the osint browser (18 files) passes.

## Step 6: leak scanner (commit 76189160a)

`REACTION_KEYS` copy (a unit test reads the Ruby constant), `scan_reacts_key` (in `scan`, outside
the feed early return), `scan_reactions` and `judge_reaction` (inside `scan_feed`, after
`note_feed_served`), `@feed_posters` filled by `serve_feed`, `counts[:reaction_items]`, four
`RULE_TEXT` rows, and "N reaction item(s)" in `access-leak-check.rb`'s counts line. A reaction on
an unknown post id is reported as `feed_reaction_target` with owner `post:<id>`.

- Tests: `access_leak_scanner_feed_test.rb` 50 runs (6 new), `access_leak_scanner_test.rb` 43 runs,
  0 failures.
- The gap the plan names stays: a scenario with no feed text of `MIN_FEED_TEXT` and no feed facts
  is not feed-scanned, so its reaction items are not judged (only `feed_reacts_key` runs).

## Step 7: icons (merge 3f9bba8db)

Drawn on `build/reaction-icons` (20ad1565b) and merged with no conflict; that branch also brought
C3's Replies paragraph, which sits before the Reactions paragraph in `README_scenario_design.md`.
The chips already pointed at `reaction-<key>.png` at 16px with the label fallback, so no code
changed. **The user still has to approve the icons before main.**

## Step 8: scenario (commit 4b04da157)

`reacts` lists for Kofi, Mei, Asha, Ivy and Tomasz as plan section 10; tasks `f15_reacted` and
`f16_reacted` with their `npc_reacted` mappings on Asha and Tomasz; PLAYTEST.md rows. Validator:
0 failure lines, no reaction warnings, the seven expected `Reaction` report lines (the angry one
reads "not a reply in its place and 'f16_tom_still_down' is the member served", with no comma;
code review R1 n1 put the plan's comma back).
`validator-access-social.test.mjs` 25 pass.

## Step 9: live proof (game 1841)

Keyless server on :3160 from the worktree, headless shell, `setFPS(20)` with fixed steps and the
setTimeout RAF, `--capture-responses`. Route: bootstrap, pick up `player_phone` (F14a, leaves
`friendface` visited), `enterRoom` east through every room to `u1_room`, then `f15_room`, stand
back, `f16_room`, stand back, then F17 in a second session at 390x844 on the same game.

- **F15:** Kofi's sad on Asha's vent with his reply (47 s); Mei's like on Kofi's reply, Asha's like
  on Mei's reply and Mei's sad on the vent, all with Mei's reply (62 s). `npc_reacted` payloads
  carry `site`, `targetNpc`, `targetPerson`, and `targetReplyToPerson` for reply targets. Tasks
  `f15_replied`, `f15_thread`, `f15_reacted` complete.
- **F16:** Ivy's like on `f16_tom_re_ivy` with her answer (112 s); Tomasz's sad on `f16_ivy_answer`
  with his second reply (132 s); no angry. All four F16 tasks complete.
- `feed().reactions` after F16 and after the reload equals PLAYTEST.md's block. After the reload
  no `npc_reacted` fired.
- `/feed_post` answers for the beat NPCs: 3 in F15, 4 in F16, no `tooSoon`, the same as C3.
- `verify-run.rb --access`: `asha 1 [f15_asha_vent:6]`, `kofi 1 [f15_kofi_re_drive:7>...]`, `mei 1
  [f15_mei_re_drive:8>...]`, `ivy 2 [f16_ivy_vent:17 f16_ivy_answer:20>...]`, `tomasz 2
  [f16_tom_re_ivy:18 f16_tom_re_ivy_again:21]`: a < k < m and i < t < j < u hold, row shape as C3.
- Leak check over both captures (173 responses): no leaks, "12 reaction item(s)" (6 live answer
  items, 6 in the reloaded `feedPosts`).
- No `[reactions] derivation failed` line in the server log.
- **Sizes.** Answer items 65 to 72 B each. Kofi's reply answer 374 B against C3's 283 to 292 B
  for a reply with none (one reaction); Mei's 515 B (three). The reloaded `GET /scenario`
  `feedPosts` is 4548 B against 4219 B with the reactions stripped (C3's measured 4219 B): 329 B
  for 6 items, under the 500 B bound.
- **Row height** (`getBoundingClientRect`): 53.6 px before and after the names line shows, at
  1400 px (main 1064 px) and at 390 px (main 370 px); the one-line list does not wrap at either.
- **Esc:** after a click the minigame's `getTestState().overlay.layers` is `['reaction-names']`;
  one Esc on `document` empties it and leaves the browser open; the next Esc closes the browser.
  Checked at both widths.
- Screenshots: scratchpad `ux-shots/reactions/` (01 to 07, `manifest.json`), not committed.
  Looked at for the pixel-art rule: 2px square borders, pixel font, icons crisp at 16px, chips
  44x32 px.
- **Not done live:** a real mouse hover (the harness has no page-coordinate pointer; hover rules are
  covered in jsdom), toast and badge counts (no toast hook was recorded; the jsdom and store
  tests cover "no toast, no unread change"), the tamper rows, and F1 to F14 regression beyond the
  posts that fired along the walk (F3, F9 to F13, L1, U1 posted).

## Handover (2026-11-12, second session)

**Done:** steps 1 to 6, 8 and 9; step 7 merged from `build/reaction-icons`.

**Open:** the user's approval of the four icons before merge to main; the full suites and the
merge-batch validator run (orchestrator). Commits this session: bf6f812ae, 76189160a, 3f9bba8db
(merge), 4b04da157, and this log.

### Earlier handover (first session)


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

## Code review R1 fixes

`FRIENDFACE_REACTIONS_CODE_REVIEW_R1.md`: 4 minors and 6 nits, all fixed.

- m1: the C3 tripwire reads single-quoted, double-quoted and template-literal titles, and checks
  that it read one title per line starting with `test(`.
- m2: the scanner's `feed_target_out?` and `feed_poster_out?` credit a lost `/feed_post` answer
  through `feed_allowed_ids` (from the lost line on), for `feed_reaction_target`,
  `feed_reaction_reactor` and C3's `feed_reply_target`. Scanner test: one lost answer, then a reply
  and reactions on and from its post, clean; the same answer before the lost line, reported.
- m3: route test "an answer with no post carries none, and the next load agrees" (see step 3).
- m4: a document-level `pointerup` and `pointercancel`, registered through `addEventListener` so
  cleanup removes them, clear the pointer-focus mark; jsdom test for both endings, paired with a
  held press.
- n1: report wording as above, the comma, and a `toComplaint` with `alongside` fixture.
- n2: `_`-prefixed fields in a `reacts` entry raise no warning; `_comment` is in the schema's
  `reacts.items`.
- n3: `feed_reactions` returns `{}` before building the revealed map or drawable set when no room
  NPC has a non-empty cleaned `reacts`; unit test with both stubbed to count.
- n4: `reaction_entries`'s unused `index` and `reaction_order_bound`'s `:order` removed.
- n5: the README Replies examples carry the demo's post text.
- n6: plan section 5.1's drawable rule names `reply_target`.

## q80: icons at 2x

User decisions (2026-11-12): q79 staff only (already the design); q80 like, laugh, sad, angry, pixel
art, shown at 2x; q81 hand-drawn icons, which the user approves before merge.

- **Merge:** main (b7d500ccf) into build/reactions, merge commit 23d76a68f, no conflicts.
- **Change (commit 5c7c742dc):** `.ob-reaction-icon` is 32px wide and high (`min-width` and
  `min-height` 32px, `flex: none`, `image-rendering: pixelated`), and the `<img>` carries
  `width="32" height="32"`. The PNGs stay 16x16; nothing was resampled. The chip's minimum is
  40px (32px icon, 2px padding, 2px border, `border-box`), padding `2px 6px`, and its font size
  is 16px, so the count sits level with the icon. The names line is unchanged (14px, one line
  reserved). The icon is drawn in one place only (`_reactionChip`), and no CSS scales the osint
  browser in the phone view.
- **Tests:** `social-feed-reactions.test.mjs` now wants 32px icons and 40px chips, and a new test
  fails if any rule sizes a reaction icon below 32px or off a whole 16px step, adds a transform or
  zoom, or lets flex shrink it; it also checks the chip fits the icon and that the PNGs are still
  16x16 (checked by adding a 16px rule: it failed). `social-osint-browser.test.mjs` checks each
  chip's `<img>` is `width="32" height="32"` with no inline style. Node: the 16 files that import
  the osint browser or the feed (231 tests) pass. Rails: the 3 feed controller and 4 feed unit
  test files (166 runs, 943 assertions) pass, under the lock.
- **Plan:** section 4 (rendering and the pixel-art rules), section 11's CSS test and the live proof
  wording now say 32px icons and 40px chips.
- **Backlog:** an entry for player reactions as a possible rapport lever (q79).
- **Live (game 1979):** keyless server on :3261 from the worktree, `swap-scenario-game.rb
  test_seating test_access_social`, headless 1400x1000 at device pixel ratio 1, `setFPS(20)` with
  fixed steps. Phone picked up, walked east to `f15_room`; F15's reactions arrived as in step 9
  (Asha's vent sad Kofi and Mei, Kofi's reply like Mei, Mei's reply like Asha). Each icon's
  `getBoundingClientRect` is 32x32 with `naturalWidth` 16 and `image-rendering: pixelated`; each
  chip is 61x40; the row is 61.6 px before and after the names line shows. Server stopped.
- **Shots** (scratchpad `ux-shots/reactions-2x/`, not committed):
  `01-friendface-feed-asha-reactions-32px-icons.webp`, `02-open-sad-chip-names-line.webp`,
  `03-close-crop-dpr1-32px-icons-native.webp`, and the preview
  `04-icons-preview-4x-nearest-like-laugh-sad-angry.png`. Laugh and angry do not fire in F15, so
  they show only in the preview.

## Code review R2 fixes

`FRIENDFACE_REACTIONS_CODE_REVIEW_R2.md`: 1 minor fixed, 1 nit left.

- m1: the q80 size test now reads every stylesheet `games/show.html.erb` links. In
  `osint-browser-minigame.css` it checks every rule whose last compound can be the icon (a bare
  `img` or `*`, or `.ob-reaction-icon`), whatever its ancestors; in the other sheets it checks the
  same rules unless an ancestor names a class or id that never sits on the browser's ancestor
  chain (html, body, the framework containers and the classes the browser source names). Media
  queries count, keyframe steps and pseudo-elements do not. Width, height, the min and max sizes
  (and their logical forms), transform, zoom, scale, flex, flex-shrink and image-rendering are
  checked; `width: auto` fails, since it draws the 16px art. Fixtures prove `.ob-reactions img`,
  `.ob-post img`, `.ob-root img`, a media query, `transform`, `zoom` on `*`, a bare `img` in
  another sheet, a phone query in another sheet, `.minigame-container img` and `!important` all
  fail, and that `.mail-client img.mail-icon`, `::before` and `.ob-post > img` elsewhere stay
  out. Appending each of `.ob-reactions img`, `.ob-post img` and `.ob-root img` to the real
  stylesheet, a 16px `img` media query to `main.css` and a `zoom` rule to `ui-themes.css` each
  made the test fail. PLAYTEST.md row F15i names the live `getBoundingClientRect` 32x32 read at
  1400x1000 and 390x844, repeated after F17's reload.
- n1 (14px names line): left as is by the orchestrator. It matches the browser's other 14px
  secondary text (`.ob-post-date`, `.ob-reply-to`); moving GNF lines to 16px would be one change
  across the browser, not this branch alone.
