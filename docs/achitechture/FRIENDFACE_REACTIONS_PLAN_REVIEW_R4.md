Counts: 0 blockers, 1 major, 6 minors, 7 nits.

# Friendface reactions plan: review round 4

Plan reviewed: `docs/achitechture/FRIENDFACE_REACTIONS_PLAN.md` at eb4c2cf69 (Draft).

C3 code read with `git show build/c3-replies:<path>` at the branch tip, 6993fd3b0. The plan cites
57a3dea22. The one commit since then touches only the C3 build log and the leak check counts line
in `PLAYTEST.md`. No code moved, and the F15 and F16 times are unchanged.

Files read: `lib/break_escape/access_work.rb` (`feeds?`, `feed_done?`, `when_reachable?`,
`select_feed_post`, `reply_servable_in?`, `walk_order`, `set_member_ids`, `revealed_map`,
`reply_target`, `open_threads`, `thread_open_to?`), `app/models/break_escape/social_feed.rb`
(`reveal_feed_post!`, `feed_posts_for_client`, `open_friendface_phone`, `feed_answer`),
`scripts/validate_access_work.rb` (`check_social`, `check_social_need`, `check_reactive_post`,
`feed_post_index`, `reply_threads`, `answer?`, `answer_repliers`, `check_replies`, `check_reply`),
`test/js/validator-access-reply.test.mjs`, `public/break_escape/js/systems/social-feed.js`
(`apply`, `restore`, `_add`, `postsFor`, `repliesFor`),
`public/break_escape/js/minigames/osint-browser/osint-browser-minigame.js` (`_renderMain`,
`_focusKey`, `_restoreFocus`, `_socialView`, `_replyEntry`, `_onPosted`, `_addBlock`),
`public/break_escape/js/minigames/framework/social-overlay.js` and `base-minigame.js` (Esc),
`public/break_escape/css/osint-browser-minigame.css`, `css/fonts.css`, `css/ui-themes.css`, and the
Rails version in both `Gemfile.lock` files (7.0.4).

## Verdict

The `post_dead_reasons` helper is right: every code is certain in honest play, it uses C3's real
predicates, and it agrees with `check_reply` on every reply in C3's fixtures. The derivation,
stability, size formula, sync bound and cheat policy all still hold. One thing must change before
the build. The names line's Esc handling, as specified, cannot work in the osint browser: the
overlay's capture-phase Esc handler closes the whole browser before the chip ever sees the key.
The rest is test wiring, touch behaviour, ARIA detail and warning noise.

## R1 to R3 findings

All resolved. R3 M1: C3's `check_reply` and `check_reactive_post` are untouched, and the new
`post_dead_reasons` returns every certain code and leaves out the second-reply case (section 8).
R3 M2: the chips are real buttons with `data-focus` keys, the names line has hover, focus, click
and tap routes, reserved height and `aria-hidden` (sections 4 and 6). m1: the rescue reports
through `Rails.error.report`, re-raises in tests unless switched on, every absence check is paired
with a presence check, and the live proof fails on a rescue log line (5.3, 11). m2: 2px borders
only; `0` and `none` pass the CSS test (4, 11). m3: the size formula has the wrapper, the commas and
the encoder's escaping (5.4). m4: no clash warning across one alternative set (8). Nits n1 to n7 are
all taken.

## Checked and found right

- **The reason codes are certain.** `select_feed_post` reaches a reply only through its `insteadOf`
  post P, and only when P is a candidate, which for a reactive P needs `holds.call(P['when'])`. So a
  dead `insteadOf` (`:instead_of_dead`) stops the reply for good, and so does a dead `when` on the
  reply itself (`:when_unreachable`). `feeds?` is the route's check 2, so `:never_posts` is certain.
  An answer opens only when another NPC has a word in its thread (`thread_open_to?`), and
  `answer_repliers` lists every NPC with a reply that could be that word, so an empty list
  (`:answer_unopenable`) is certain. `open_threads` needs the thread post in `revealed`, so
  `:thread_never_opens` is certain when every thread post is unserved for good. All of these
  assume honest play: a forged global could make an undeclared-global `when` hold, as section 5.1
  already says. Every validator warning in C3 makes the same assumption.
- **It uses C3's real predicates.** `feed_post_index`, `reply_threads`, `answer?` and
  `answer_repliers` are validator module functions, and `when_reachable?` and `feeds?` are on
  `AccessWork`. The answer branch is excluded from `:thread_never_opens`, as `check_reply`'s early
  `return` does.
- **It agrees with `check_reply` on C3's fixtures.** I walked every reply in
  `validator-access-reply.test.mjs`. In the "warnings" fixture, `tom_re_ivy` gives
  `:when_unreachable` and `tom_re_dead` gives `:instead_of_dead`, matching C3's two warnings. The
  lone `ivy_answer` gives `:answer_unopenable`. In the thread-never-opens fixture,
  `tomasz.feed.posts[1]` gives `:thread_never_opens`. The second reply (`noAnswer`) gives nothing.
  Every malformed reply in the "errors" fixture (`no_when`, `stray`, `inst_ordered`, `to_reply`
  and the rest) gives no code and gets no C3 never-fires warning. The `pair()` fixture is clean
  on both sides.
- **Focus keys are unique on a page.** `postsFor` leaves out the poster's own answers
  (`social-feed.js`, "unless it is the poster's own answer"), so an answer is drawn only in its
  thread, and every other post or reply appears once per profile page. `_focusKey` and
  `_restoreFocus` are generic over `[data-focus]`, so the chips' keys work as planned.
- **The pixel-art rules are met.** The chip uses a 2px `--ui-line` border (the token is defined in
  every theme in `ui-themes.css` and in `awareness-skin.css`), the root font is
  `--se-font-readable` at 16px, the focus ring is 2px on `:focus-visible`, and the icon rule needs
  `image-rendering: pixelated` at 16px or 32px, as `.ob-icon` already does.
- **Rescue and re-raise.** Both apps run Rails 7.0.4, where `Rails.error.report(e, handled:,
  context:)` exists with `handled:` required, as the plan passes it. Re-raising in test unless a
  module setting is on, with that setting reset in `teardown`, makes a fault fail every other
  test. Minitest runs `teardown` even when the test fails.
- **Size formula.** `,"reactions":[]` is 15 bytes, `{"postId":"","npc":"","person":"","key":""}`
  is 43 and `{"npc":"","person":"","key":""}` is 31. The per-answer count bound (the serving NPC's
  own reactions plus other NPCs' reactions that can target the served post) is right.
- **Sync rule (q77) and cheat policy.** No `player_state` key, no `feedRevealed` field and no new
  request. Answers carry only reactions whose `via` is the post just served, and `feedPosts` is
  sent once per load. The client store is never synced. A reaction holds no secret, key or forged
  item, and nothing on the server gates on it.
- **The author's additions.** `:never_posts` is certain and fits the table. The instance-held open
  key fits `_renderMain`, which rebuilds `main` on each render. Both need small changes (m1, m2
  and M1 below).

## Majors

### M1. Esc on a chip cannot close the names line: the overlay's capture handler closes the browser first

**Section:** 4 ("The names line"), 6 (osint browser), 11 (JS tests), 15 step 5.

**Evidence.**
- `OsintBrowserMinigame extends SocialOverlayScene` (`osint-browser-minigame.js`). In
  `social-overlay.js`, `start()` registers
  `document.addEventListener('keydown', this._escHandler, true)`: the **capture** phase on
  `document`.
- `_onEscape` calls `preventDefault`, `stopPropagation` and `stopImmediatePropagation`, then closes
  the topmost entry in `this._layers` if there is one, and otherwise calls `requestClose()`.
- Capture on `document` runs before any handler on the chip. The plan's "Esc is handled on the chip
  and stops there only when a names line is open" never runs: the chip's handler is not reached,
  and with no layer pushed, Esc closes the whole browser while the names line is open. The jsdom
  test of "Esc on the chip empties it" would fail, and a builder who works around it on the chip
  (a `stopPropagation` there, or a capture handler of its own on the chip) still cannot get ahead
  of a capture listener on `document`.
- The overlay already has the right mechanism: `pushLayer(close, name)` returns a remover, and
  Esc closes the topmost layer before anything else. Its comment says to call the remover
  "whenever the layer goes away by any route".

**Fix.**
- When a click or tap opens a names line, call
  `this._namesLayerOff = this.pushLayer(() => this._closeReactionNames(), 'reaction-names')`.
  `_closeReactionNames` clears the instance's open key, removes the layer and re-renders the row,
  or redraws it in place.
- Remove the layer on every other route that clears the open key: a second click, opening another
  chip (swap the layer, do not stack two), `go()` or any page change, and the minigame's close.
  Keep the layer across `npc_posted` and `npc_reacted` re-renders, since the open key survives them.
- Drop "while the chip has focus" and "stops there": with a layer, Esc closes the open names line
  wherever focus is in the browser, and the next Esc closes the browser.
- Tests (jsdom harness): open a names line by click, dispatch Esc on `document`, and check the line
  is empty, `this._layers` is empty and the minigame has not completed. A second Esc closes the
  browser. Open a line, navigate with `go()`, then press Esc: the browser closes (no stale layer
  swallows the key).

## Minors

### m1. The agreement test cannot be built as written

**Section:** 11 ("`post_dead_reasons`"), 15 step 4.

**Evidence.**
- "For every reply in the fixtures of `validator-access-reply.test.mjs`": those fixtures are built
  inline inside each `test(...)` body and are not exported. The plan also keeps C3's tests
  unchanged, so the reactions test cannot import them.
- That file's `run(scenario, fn)` calls `ValidateAccessWork.<fn>(json)` with one argument.
  `post_dead_reasons(json_data, npc, post, index)` needs the NPC and the post, so the harness needs
  a second Ruby snippet that finds them by id. Symbols come back as strings through
  `JSON.generate`.
- The test is one-way: "each code the helper returns matches the C3 never-fires warning". A helper
  that returns `[]` for every reply passes it.
- `:never_posts` has no `check_reply` message. A reply on an NPC that does not `feeds?` gets the
  code and no `check_reply` warning (C3 warns in `check_social` instead, and only when the need is
  missing), so the test as written fails on any such fixture.
- The plan's own three-reason fixture is checked against the helper but never run through
  `check_reply`, so the agreement on a reply with several reasons is not tested.

**Fix.**
- Copy C3's reply fixtures (the `pair()` builder, the "warnings" fixture, the lone answer, the
  `noAnswer` pair, the thread-never-opens fixture and the "errors" fixture) into the reactions test
  file, with a comment naming their source.
- Add a `deadReasons(scenario, npcId, postId)` harness that runs
  `ValidateAccessWork.post_dead_reasons(data, npc, post)` with the NPC and post looked up by id.
- Make the agreement a set equality per reply, both ways: the codes other than `:never_posts`
  equal the set of `check_reply` never-fires messages carrying that reply's `#{tag}` (match the
  exact message fragments, since `check_reactive_post`'s "`when` can never hold" message has the
  same tag prefix). Check `:never_posts` against `AW.feeds?` instead.
- Run the three-reason fixture through `check_reply` too, and assert all three C3 warnings and all
  three codes.

### m2. A dead reactor's warnings repeat on every reaction

**Section:** 8 (warnings), 11 (validator fixtures).

**Evidence.** The reactor-level warnings ("`reacts` on an NPC that does not `feeds?`" and "`<X>`
can never post") fire once per reactor. The `alongside` warning uses `post_dead_reasons` on the
reactor's own post, which then returns `:never_posts` (in the first case) or `:when_unreachable`
(in the second, since `feed_done?(data, X, [])` means every own post is reactive with a dead
`when`). So a dead reactor with five `alongside` reactions gets one reactor warning and five more
saying the same thing. Plain reactions get the reactor warning only, so the count also depends on
how they were written.

**Fix.** When a reactor-level warning fires, skip the per-reaction "`alongside` post can never
fire" and "can never follow" warnings for that reactor. Keep the target warnings, since those are
about another NPC, and keep the "(never comes out)" ending on each report line. Add a fixture: a
non-feeding reactor with two `alongside` reactions gives exactly one warning.

### m3. Touch: sticky hover defeats tap-to-close, and the chip has no minimum size

**Section:** 4 ("The names line"), 6, 11.

**Evidence.**
- On a touch screen a tap sends emulated `mouseover` and `mouseenter`, then `click`. The pointer
  "stays" over the row until the user taps elsewhere, so no `mouseleave` comes. With hover tracked
  on the row, the second tap clears the click-open state, but the row still counts as hovered, so
  the names line stays up. The plan's "a second click hides it" does not hold on the player's
  phone, which is where touch matters most.
- The plan does not say which chip's names show when one chip is open by click and another is
  hovered or focused. One line serves the whole row, so the builder has to choose.
- No size is set for the chip. A 16px icon with a 2px border and a small padding is about 24px
  high, at the edge of WCAG 2.5.8's minimum and well under the 44px `min-height` that `.ob-block`
  uses beside it.

**Fix.**
- Track hover with `pointerenter` and `pointerleave`, and act only when
  `e.pointerType === 'mouse'`, or put the hover rule under `@media (hover: hover)`.
- Precedence: an open chip (click or tap) wins, then the focused chip, then the hovered chip.
- Give `.ob-reaction` a `min-height` and `min-width` of 32px (whole 16px steps), and add it to the
  CSS test.
- JS test: a `pointerenter` with `pointerType: 'touch'` shows nothing; a click opens and a second
  click empties the line with no hover left showing it.

### m4. `aria-expanded` points at nothing a screen reader can reach

**Section:** 4 ("The names line"), 11.

**Evidence.** The chip toggles `aria-expanded`, but the names line it opens is `aria-hidden="true"`,
and the button has no `aria-controls`. A screen reader announces "expanded" and the user finds
nothing new. The names are already in the button's `aria-label`, which is the right place.

**Fix.** Drop `aria-expanded`. Track the open state with a class or `data-open` attribute for
styling and tests. Give the icon `<img>` `alt=""`, so a missing `aria-label` (a future refactor)
never makes the file name the button's name. The test asserts no `aria-expanded` on a chip.

### m5. "Takes no space" cannot be tested in jsdom, and does not hold when the names wrap

**Section:** 4 ("The names line takes no space"), 11 (osint browser tests, live proof).

**Evidence.**
- The JS test asserts the line is "the same height empty as filled". jsdom does no layout:
  `offsetHeight` and `getBoundingClientRect()` are 0 for every element, so the assertion passes
  whatever the CSS says.
- The height reserved is one text line. Four reactors' full names at 16px GNF run past the phone
  view's width and wrap, so showing them moves the content below. The plan's claim and the live
  screenshot check ("nothing below a row moving") then disagree.

**Fix.**
- In jsdom, assert only that the line is in the row from the first render, has `aria-hidden`, and
  that the CSS rule sets `min-height`.
- In the live proof, measure the row with `getBoundingClientRect()` before and after showing the
  names, at the phone view's width and at the browser's width, and log the figures.
- Choose one rule for wrapping and write it in section 4: either reserve two lines (enough for
  F15's two names at phone width, measured), or say that a line which wraps may grow the row,
  since showing it is the user's own action.

### m6. The clash warning misses two `toComplaint` reactions on the same complaint

**Section:** 8 (the clash warning), 11.

**Evidence.** The rule covers "the same `to`, or a `to` naming a vent of a complaint another of its
reactions names". Two reactions by one NPC with the same `toComplaint` and no `alongside` both
resolve to the oldest served vent (section 3), so they always land on the same post and one never
shows. Nothing warns.

**Fix.** Add "two `toComplaint` reactions naming the same complaint" to the clash rule, with the
same alternative-set exception when both have an `alongside`. Add a fixture.

## Nits

- **n1.** The header cites 57a3dea22. Update it to the C3 tip read (6993fd3b0 today). C3's
  `PLAYTEST.md` now requires the leak check's counts line to show the posts it checked, so a
  clean run is not an empty scan. Do the same for reactions: give the scanner's counts line a count
  of reaction items judged, and have the live proof require it above 0.
- **n2.** Section 5.3 says "The derivation agrees: such a post is not drawable" when `feed_answer`
  returns nil. Not quite. `feed_answer` also returns nil when the stored `to`'s thread post is
  missing from `revealed_map` or the named NPC is not a room NPC, and `feed_posts_for_client` skips
  NPCs that no longer `feeds?`. The drawable test checks only that `to` is not nil. All of these
  come from edited saves, so either add those conditions to "drawable" or soften the sentence.
- **n3.** Section 4 calls the names "the reactors' Friendface profile names". `_profileName({
  person })` with no `name` falls back to `social.people`'s `forms.full`, not the site profile's
  `name`. That is what C3's reply author lines show too, so it is consistent, but say "the names
  C3's reply entries show".
- **n4.** In the code table, write `:instead_of_dead` as "the post `insteadOf` names (found among
  all feed posts, as `check_reply` finds it) is reactive with an unreachable `when`". C3's errors
  fixture has `inst_reply`, whose `insteadOf` names a reply. A builder who looks only among own
  posts would disagree with `check_reply` once that reply's `when` is dead.
- **n5.** The size formula assumes four strings. A reactor whose `feed.person` is not a string
  (the validator errors, but the server still `feeds?`) would ship `null`. Have the derivation skip
  such a reactor, and say so in 5.1.
- **n6.** `Rails.error.report` with no subscriber does nothing in Rails 7.0, and the engine
  registers none. Say that the `Rails.logger.error` line is the record the live proof and an
  operator read, and the report is for a host that subscribes.
- **n7.** Hover state tracked in JS is lost when `_renderMain` replaces the row: no new
  `pointerenter` fires until the pointer moves. Either keep the hovered chip's key on the instance
  beside the open key, or accept it and say so in section 4.

## Open questions as framed

- **Decisions 2, 5 and 6** (q79, q81, q80): unchanged and fair, each with its suggested option
  standing.
- **Decisions 3 and 4:** recorded as decided.
- No new question for the user. M1 and the minors are engine choices the planner can make.
