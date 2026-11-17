Counts: 0 blockers, 0 majors, 4 minors, 6 nits.

# Friendface reactions: code review, round 1

Reviewed `git diff main...build/reactions` at e38471f0f against `FRIENDFACE_REACTIONS_PLAN.md`
(Final) and `FRIENDFACE_REACTIONS_BUILD_LOG.md`, in a detached review worktree.

## Tests run (affected files only, no lock)

- Rails: `access_work_feed_reactions_test.rb`, `feed_post_reactions_test.rb`,
  `access_leak_scanner_feed_test.rb`: 78 runs, 449 assertions, 0 failures.
- Node: `social-feed-reactions` 9, `social-osint-browser` 50, `test-bridge-access` 14,
  `validator-access-reactions` 10, `validator-access-reply` 19, `validator-access-social` 25,
  `validator-social-schema` 6, `friendface-phone` 11, `social-feed` 23, `social-feed-replies` 11:
  all pass.
- Validator on `scenarios/test_access_social/scenario.json.erb --no-graph`: 0 lines with a failure
  mark, no reaction warnings, the seven expected `Reaction` report lines.
- Screenshots 03 and 06 from the live proof looked at: 2px square borders, pixel font, icons crisp
  at 16px, chips at least 32px, names line under the row.

## What was checked and holds

- **Derivation** (`lib/break_escape/access_work.rb` 925 to 1055). Reads only the scenario and
  `feedRevealed` through `revealed_map`; nothing is written. `done_before` takes X's shown posts
  with `seq < seq(T)` (no `seq` counts as below), needs at least one, and calls the pure
  `feed_done?`, so the answer for a given T is fixed once T exists. Drawability reads only stored
  `to`, the static `reply_target` fallback and room-NPC membership, all fixed once served. The
  dedupe keeps the lowest `seq(V)` then authored index, and every later candidate has a higher
  `seq(V)`, so the winner never changes. `via:` is applied after the dedupe. A `/feed_post` request
  only names an NPC and a source; the server picks the post under `with_game_lock` and `next_seq`
  only grows, and `feedRevealed` is not client-writable, so a forged or reordered request can change
  which reactions a run gets but cannot move one that is out. The stability test replays both
  request orders.
- **Route** (`social_feed.rb` 100 to 135, 144 to 172). The post-write map is the pre-write map plus
  the new entry; reactions only when the answer has a post; `with_reactions_rescue` reports through
  `Rails.error.report(handled: true, context: { game_id:, post_id: })`, logs a line, and re-raises
  in test unless `rescue_reactions_in_test` is on (reset in teardown). `feedPosts` merges
  reactions after the `FEED_ITEM_KEYS` slice with one map for the block.
- **Validator**. Errors, warnings, one warning per dead reactor, the clash rule with the
  alternative-set exception, the static order bound and every report ending are present.
  `post_dead_reasons` uses C3's predicates and `AW.feed_posts(npc)` for `insteadOf`; C3's
  `check_reply` is unchanged. The agreement test compares codes both ways per reply over nine
  fixtures, the catch-all fails on any unmapped warning, and the tripwire lists C3's 19 titles (but
  see m1).
- **Leak scanner**. The four kinds, `feed_reacts_key` outside the early return, the item kinds
  inside it after `note_feed_served`, `counts[:reaction_items]` on the counts line. The planned gap
  (a scenario with no feed text of `MIN_FEED_TEXT` and no feed facts gets no reaction judgement) is
  as planned and recorded in the build log.
- **Osint browser UI**. Chips are `<button type="button">` siblings of the post block (and the last
  child of a reply entry), with `data-focus="reaction:<postId>:<key>"`, `aria-label` holding the
  names, a decorative `<img alt="">`, no `aria-expanded`, `data-open` for the open state. The names
  line is `aria-hidden`, always present, painted per row with open, then focused, then hovered
  precedence. The layer is pushed once per open, removed on Esc (the closer removes its own
  entry), second click, click on another chip (old layer first), keyboard focus on another chip,
  `go()` and `cleanup()`. Hover reads `e.pointerType === 'mouse'` only; the `_rendering` guard
  stops `_restoreFocus` turning pointer focus into keyboard focus. Names reach the DOM only through
  `textContent` and `setAttribute`. CSS: 2px solid square borders, `--ui-accent` open border and
  2px `:focus-visible` ring, no radius, shadow or gradient, pixel font variables with a `monospace`
  fallback, icon 16px with `image-rendering: pixelated`, chip `min-width`/`min-height` 32px, chips
  wrap, names line wraps with `overflow-wrap: anywhere` and a `min-height`. Icons are 16x16 PNGs;
  a load error swaps in the label span and remembers the key for the session.
- **q77 sync rule**. No `player_state` key, `feedRevealed` entries unchanged, no new request, no
  `sync_state` section, the client store is never sent back. Answer growth is a delta sent once.
  `feedPosts` grows by at most one item per authored reaction (the dedupe is per reactor and
  target, and each authored reaction yields at most one candidate), each 31 B plus the encoded ids,
  and `GET /scenario` is fetched once per page load (`game.js`). The measured 329 B for 6 items is
  inside that bound, which is fixed by authoring and does not grow with play time.
- **Cheat policy**. A reaction item names a served target, a reactor with a served post, its feed
  person (already on its posts) and a fixed key. A with-target reaction implies the reactor's feed
  is done, which the client already has from `done`. Extra fields are ignored, `/feed_react` is a
  404, `reacts` is in no response (tested). Nothing unrevealed comes out.
- **Build log departures**. Drawability through C3's `reply_target` matches what
  `feed_posts_for_client` draws, so it is more consistent than the plan's wording; in the honest
  route `select_feed_post` always sets `to` for a chosen reply, so the live answer and the reload
  agree. The report wording change ("Kofi's first post", "if it is out by then") is acceptable,
  but see n1.
- **Scenario**. `reacts` lists and the two tasks match plan section 10; the live proof's
  `feed().reactions` block matches PLAYTEST.md; the tamper rows are there; validator 0 failures.
- **C3 Replies README paragraph**. Checked against the code: `well_formed_reply?` (when,
  insteadOf, exactly one thread field), selection in the slot of the `insteadOf` post with the
  oldest open thread first (`select_feed_post`), `thread_open_to?`'s three conditions,
  `friendface_name`'s order (forms.first, profile name, displayName, id), control and format
  characters removed, 40 characters, `reply_servable_in?` refusing a fact post, the "replied to"
  toast under `postToasts`, the `npc_posted` fields, the validator's error and warning list
  including the network-string warning text. Accurate, apart from n5.

## Minors

### m1. The C3 tripwire only sees single-quoted test titles

`test/js/validator-access-reactions.test.mjs:253` collects titles with
`/^test\('((?:[^'\\]|\\.)*)'/gm`.

Failure: C3 adds a reply test whose title holds an apostrophe and is written `test("C3's ...")`,
or with backticks. The regex does not see it, the recorded list still equals the collected one,
and the tripwire passes although C3's tests changed and the copied fixtures may be stale.

Fix: match all three quote forms, for example
`/^test\((['"`])((?:(?!\1)[^\\]|\\.)*)\1/gm` and take group 2, and add a self-check that the
number of collected titles equals the number of lines starting with `test(`.

### m2. The new scanner kinds report a false leak after a lost `/feed_post` answer

`tools/playtest/lib/access_leak_scanner.rb:1050` to `1058` (`judge_reaction`) judges the target
against `@feed_served` and the reactor against `@feed_posters`, both filled only by `serve_feed`.
An unreadable answer (body lost on a reload) is credited through `feed_allowed_ids` and the
unknown shares, never through `serve_feed`.

Failure: in F15, Kofi's reply answer is lost. Mei's answer then carries Mei's like on
`f15_kofi_re_drive`: `feed_reaction_target` fires because Kofi's reply is not in `@feed_served`.
If instead Asha's vent answer is lost, Kofi's sad on her vent gives `feed_reaction_target`, and
Asha's like that rides Mei's answer (done-before) gives `feed_reaction_reactor`, since Asha's only
post was in the lost body. A live proof that needs zero
findings then fails on a clean server. C3's `feed_reply_target` has the same exposure, so this is
inherited, but these kinds are new and the proof's acceptance depends on them.

Fix: when the run has unreadable `/feed_post` rows, accept a target whose owner has the post in
`feed_allowed_ids(owner)` (the saved-id credit), and a reactor with a positive unknown share; or
report such cases under a separate "after a lost answer" note rather than as findings. Add a
scanner test with one lost answer followed by a reaction on the post it served.

### m3. Plan section 11's "an answer with no post carries none, and the next load agrees" has no test

`test/controllers/break_escape/feed_post_reactions_test.rb` (whole file); the build log records the
gap (step 3, "Not covered").

Failure: a later change makes `reveal_feed_post!` attach reactions when `feed_answer` returns nil
(for example by moving the `if answer` guard), and the client stores reactions for a post it never
receives, or the answer and the reload disagree. No test fails.

Fix: stub `feed_answer` to return nil for one serve in an otherwise reacting run (Minitest `stub`
on the game instance), assert the answer has no `reactions` key, and pair it with the next load
showing the other posts' reactions and the derivation's view of that post (it is drawable, so the
reload may draw it: assert what the plan intends and record it).

### m4. The pointer-focus mark can outlive a press that ends off an already focused chip

`public/break_escape/js/minigames/osint-browser/osint-browser-minigame.js:527` to `531` and `558`.
The mark is cleared in a suppressed `focusin`, at the end of `click`, and on `pointercancel`.

Failure: chip A already has focus (keyboard). The player presses the mouse on A, drags off and
releases elsewhere. No `focusin` (A had focus), no `click` (the release was elsewhere), no
`pointercancel` (a mouse drag does not cancel). `_rxPointer` stays true. The player then Tabs to
chip B: its `focusin` is taken as pointer focus and swallowed, so B's names do not show, which is
the case the plan's clears were meant to prevent.

Fix: also clear the mark on `pointerup` and `lostpointercapture` on the chip, and on a
document-level `pointerup` registered with `this.addEventListener` (so cleanup removes it); or
clear it in a `keydown` handler on the browser root for Tab. Add a jsdom test: focus A by keyboard,
`pointerdown` on A, `pointerup` on the body, keyboard `focus()` on B, B's names show.

## Nits

### n1. Report line wording

`scripts/validate_access_work.rb:2449`, `2453`, `2471`.

- "Tomasz reacts sad to Ivy's 'f16_ivy_answer', alongside 'f16_tom_re_ivy_again', if it is out by
  then": "it" reads as the nearest name, the `alongside` post. Name the target: "if
  'f16_ivy_answer' is out by then".
- Joined endings lose the plan's comma: "not a reply in its place and 'f16_tom_still_down' is the
  member served" can be read as one condition inside "not". Join with ", and" when the first ending
  is the "not a reply in its place" one.
- `toComplaint` with `alongside` prints "reacts sad to the oldest 'c' vent out by then, alongside
  'p', if it is out by then", saying "out by then" twice. Drop the suffix on `what` or the clause.
  This form has no fixture in "report lines: every main form and ending"; add one.

### n2. `_comment` in a `reacts` entry warns

`scripts/validate_access_work.rb:2335`. `_comment` is the repository's usual annotation key and the
schema allows it on `feed`. An author who comments a reaction gets "'_comment' is not a reaction
field". The plan says any other key warns, so this is to the letter; consider exempting `_comment`
(and listing it in the schema's `reacts.items`).

### n3. The derivation runs when no NPC has `reacts`

`lib/break_escape/access_work.rb:983` to `987`; `social_feed.rb:146` and the route. Every
`GET /scenario` and every `/feed_post` (inside the game row lock) builds `drawable_feed_posts`
before finding that no reactor exists, in every mission. Return `{}` early when no room NPC has a
non-empty `feed.reacts` array.

### n4. Dead code

`reaction_entries(json_data, index = ...)` at `scripts/validate_access_work.rb:2288` never uses
`index`, and `reaction_order_bound` returns an `:order` key (line 2283) that nothing reads. Remove
both.

### n5. README Replies examples use the demo's ids with different text

`README_scenario_design.md:1213` and the next examples: `f15_asha_vent`, `f15_asha_re_drive` and
`f16_ivy_answer` carry texts that differ from `scenarios/test_access_social` ("Nothing will save
this morning, again." against "Project drive down again. Nothing will save today."). A reader who
greps the demo for the example text finds nothing. Either copy the demo's text or use ids that are
not in the demo.

### n6. Plan section 5.1's drawable rule is stale against the build

`docs/achitechture/FRIENDFACE_REACTIONS_PLAN.md:320` says a reply needs a stored `to`; the build
uses `reply_target` (stored `to`, or the authored `replyTo` fallback), as recorded in the build log.
Update the plan line so a later reviewer does not "fix" the code back to the plan.
