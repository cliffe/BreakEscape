Counts: 0 blockers, 2 majors, 4 minors, 7 nits.

# Friendface reactions plan: review round 3

Plan reviewed: `docs/achitechture/FRIENDFACE_REACTIONS_PLAN.md` at a97d31359 (Draft).

C3 code read with `git show build/c3-replies:<path>`. The branch tip is still 57a3dea22, the commit
the plan cites, so nothing has moved under it since round 2.

Files read: `lib/break_escape/access_work.rb` (feed and C3 sections: `feed_done?`,
`select_feed_post`, `reply_servable_in?`, `walk_order`, `set_member_ids`, `revealed_map`,
`reply_target`, `open_threads`, `thread_open_to?`), `app/models/break_escape/social_feed.rb`,
`scripts/validate_access_work.rb` (`check_reactive_post`, `check_replies`, `check_reply`,
`reply_report_lines`), `test/js/validator-access-reply.test.mjs`,
`public/break_escape/js/systems/social-feed.js` (`apply`, `restore`, `_add`),
`public/break_escape/js/minigames/osint-browser/osint-browser-minigame.js` (`_renderMain`,
`_focusKey`, `_restoreFocus`, `_socialView`, `_replyEntry`, `_onPosted`, `_addBlock`),
`public/break_escape/css/osint-browser-minigame.css`, `css/ui-themes.css` (the small button skin),
`css/fonts.css`, `tools/playtest/lib/access_leak_scanner.rb` (feed section), the
`npc-manager.js` event mapping registration, and the F15 and F16 NPCs in
`scenarios/test_access_social/scenario.json.erb`.

## Verdict

The derivation, the done-before rule, the stability argument, the sync bound and the cheat policy
all hold against the code. Two things need changing before the build. The shared
`reply_never_fires` helper, as specified, would change C3's validator output and would also label
a reaction "never comes out" when it can come out. The reaction chips, as specified, put the names
in an `aria-label` on an element with no role, which screen readers do not reliably read, and the
names line has no touch route. The rest is small.

## R1 and R2 findings

All resolved. R2 M1: both set-member warnings are gone, and the conditions are report-line endings
joined with "and", with "(never comes out)" replacing them (section 8). m1: the item bound is now 43
plus the lengths, checked per item (5.4, 11). m2: `targetReplyToPerson` and the other-thread case
(6, 11). m3: `feed_reacts_key` matches any `reacts` key (9). m4: the schema `key` is a plain string,
and a test pins that (8, 11). m5: the can-never-post warning and the shared helper (8), though the
helper brings its own problem (M1 below). m6: the route rescue (5.3). Nits n1 to n9 are all taken.
R1 was confirmed closed in R2.

## Checked and found right

- **`feed_done?` is pure and monotone.** It reads its `shown` argument through `include?` and
  `when_reachable?`, which reads only the scenario. A larger `shown` only turns more "any member
  shown" terms true.
- **The done-before rule is stable.** The `shown` subset it tests ("X's posts with
  `seq < seq(T)`") is fixed once T is served, because `next_seq` runs under the game lock and only
  grows. The dedupe winner (lowest `seq(V)`) cannot be displaced. A with-target candidate exists
  from T's serve, and every other candidate's V is a later serve.
- **The required-post lower bound is sound.** `open_threads` needs the thread post in `revealed`
  and not a reply, and for a complaint reply it skips the replier's own vents, so P is served
  before T. A non-reactive own post before P in `walk_order` is always a candidate, because
  `reply_servable_in?` needs a reactive slot, so it is served before P. P's siblings are spent once
  P is out. `feed_done?` is monotone, so testing it on this subset gives a valid lower bound.
- **The demo predictions match the code.** Asha's feed is done after her vent (her vent and her
  complaint reply form one set), so her like on Mei's reply comes in Mei's answer. Ivy's
  `f16_ivy_still_down` / `f16_ivy_answer` set stays open after her vent, so her like waits for her
  answer. Tomasz's angry stays out because `f16_tom_re_ivy_again` takes `f16_tom_still_down`'s slot.
- **Sync rule (q77).** No `player_state` key and no `feedRevealed` field are added, and there is no
  new request. `GET /scenario` is fetched once per page load (`api-client.js`, `core/game.js`), so
  `feedPosts` growth is sent once per load, bounded by the authored reactions. Each answer carries
  only the reactions whose `via` is the served post: a delta.
- **Cheat policy.** A reaction holds no secret, key or forged item. `feedRevealed` is written only by
  `reveal_feed_post!`, from `select_feed_post`, and extra request fields never reach selection.
  Section 7's table and the "tasks on `npc_reacted` are cues" rule are right.
- **Withholding.** `feed` is in `WITHHELD_WORK_NPC_KEYS` (`game.rb`), so a `reacts` list inside it
  never ships. No scenario or engine file has a `reacts` key today, so `feed_reacts_key` has no
  false positives.
- **Task wiring.** NPC `eventMappings` register any `eventPattern` on the dispatcher
  (`npc-manager.js` `_setupEventMappings`), so `npc_reacted:asha` with a `condition` works as
  C3's `npc_posted:kofi` does.
- **Size arithmetic.** `{"postId":"","npc":"","person":"","key":""}` is 43 bytes and
  `{"npc":"","person":"","key":""}` is 31 (checked with `to_json.bytesize`). With 20-character ids
  and `laugh` the items are 108 and 76 bytes, under the plan's 110 and 76. The F15 and F16
  `feedPosts` growth, wrappers included, comes to about 330 bytes, so the 500-byte test holds.

## Majors

### M1. `reply_never_fires` as specified changes C3's validator output, and marks a live reaction "never comes out"

**Section:** 8 ("Shared never-fires helpers", the "target can never be served" and "`alongside`
post that can never fire" warnings), 11 (validator tests), 15 step 4.

**Evidence.**
- **One reason, but C3 can give several.** The plan's helper "returns the reason or nil", and
  `check_reply` "calls it for its own warnings (with its wording unchanged)". `check_reply` today
  runs each never-fires test independently, so one reply can get several warnings: an unreachable
  `when` (`#{tag}.when can never hold ...`), a dead `insteadOf` (`#{tag}.insteadOf '...' can never
  fire ...`) and "thread can never open" all fire on the same reply if all three hold. A helper
  that returns one reason would drop the others. C3's tests would not notice. They use `assertHas`
  per message, and the "warnings" fixture puts each dead case on a different reply (`tom_re_ivy`
  for the `when`, `tom_re_dead` for the `insteadOf`), so a reply with two reasons is never tested.
- **Order and branch changes.** In `check_reply` the never-fires warnings are interleaved with
  warnings that are not never-fires. In the answer branch, the walk-order warning comes after the
  "no reply can open" warning and then `return`s. In the reply branch, the one-way link warning
  sits between "thread can never open" and the second-reply check. A helper that runs every test
  would also run "thread can never open" on an answer, which C3 never does today (it returns
  first). Moving the tests into the helper reorders or adds warnings unless the call sites are
  rebuilt with care, and nothing in the plan's test list would catch it.
- **The second-reply case is not certain.** The plan puts "a second reply that no answer can open"
  in the helper (section 8, first paragraph) and then uses "`reply_never_fires` gives a reason" for
  the "never comes out" warnings and the "(never comes out)" ending. That case can fire.
  `thread_open_to?` returns true for X when X has no word in the thread yet (`mine.empty?`), so if
  X's first reply never comes out (its `when` was false when its slot came due, or its slot came
  before the thread post), the second reply is X's first word and can be served. C3's own message
  says as much for complaint replies ("It can still land in another member's vent when two vents
  are out"), and it never claims the reply never fires. A reaction to such a reply would be
  reported "never comes out" when it can come out. That is the kind of wrong warning that teaches
  authors to ignore the feed warnings.
- **The scope is wider than the name.** The helper also covers own reactive posts with an
  unreachable `when`. That warning lives in `check_reactive_post`, not `check_reply`, and the plan
  does not say whether `check_reactive_post` moves too.

**Fix.**
- Leave `check_reply` and `check_reactive_post` as they are. Do not move C3's messages.
- Add a new predicate helper for the reactions checks, for example
  `post_dead_reasons(json_data, npc, post, index)`, returning a list of reason codes:
  `:when_unreachable` (own post or reply), `:instead_of_dead`, `:answer_unopenable` and
  `:thread_never_opens`. It covers only the four certain cases, and never the second-reply case.
  Have it call the same `AW` predicates and the same `reply_threads` and `answer_repliers` helpers
  that `check_reply` uses, so the logic stays in one place even though the messages do not move.
- If the refactor is still wanted, make it a commit of its own, before any reaction rule lands, and
  check it with a golden-output test: the validator's full output on `test_access_social` and on
  every fixture in `validator-access-reply.test.mjs` and `validator-access-reactive.test.mjs` is
  byte-identical before and after. Add one C3 fixture where a single reply has an unreachable
  `when`, a dead `insteadOf` and an unopenable thread, and assert all three warnings.
- Add a reactions fixture for a target that is a second reply with no answer: no "never comes out"
  warning, and no "(never comes out)" ending.
- Name the reason in the reaction message as a short phrase taken from the code ("its `when` can
  never hold"), not C3's whole sentence with its `#{tag}` prefix.

### M2. The chips' accessible names are unreliable, and the names line has no touch route

**Section:** 4 ("Rendering", "Pixel-art UI"), 6 (osint browser), 11 (JS tests).

**Evidence.**
- **The names go in an `aria-label` on a generic element.** The plan makes each chip focusable with
  `tabindex="0"` and puts the names in its `aria-label`, but gives the chip no role. ARIA 1.2
  prohibits naming the generic role, and screen readers often skip an `aria-label` on a plain
  `span` or `div`, so for screen reader users the names may simply not be there. A focusable element
  with no interactive role also fails axe's rules. The rest of the osint browser makes its
  interactive things real `<button>`s (`_addBlock`'s `ob-block`, the tool buttons, the site strip).
- **Hover and focus only.** A touch screen has no hover, and tapping a `tabindex` span does not
  reliably give it focus (Safari does not focus on tap). The "player's phone" view is where touch
  matters most. WCAG 1.4.13 also asks that content shown on hover stays up while the pointer moves
  onto it. A names line that shows on chip hover and hides on `mouseleave` vanishes as the pointer
  moves down to read it.
- **Focus is lost on every re-render.** `_renderMain` clears `main` and restores focus only to an
  element with a `data-focus` key (`_focusKey`, `_restoreFocus`). The plan gives chips no
  `data-focus`, and every `npc_posted` or `npc_reacted` re-render (several in one tick when an
  answer carries more than one reaction) drops a keyboard user's focus to the page and hides the
  names line they were reading.
- **The names would be read twice.** If the visible names line is in the DOM while the chip's
  label also holds the names, a screen reader reads both.
- **Pixel rule.** The design meets it: pixel font, no system tooltip, 2px square borders, square
  focus ring. The gaps above are accessibility gaps, not pixel-rule gaps.

**Fix.**
- Make each chip a `<button type="button" class="ob-reaction">` placed after the post's `ob-block`
  button, never inside it (nested interactive content is invalid, and a click there would select
  the post). Give it `aria-label` "Sad, 2: Kofi Mensah, Mei Tanaka" and
  `data-focus="reaction:<postId>:<key>"` so `_restoreFocus` brings it back after a re-render.
- Show the names line on hover, on focus and on click or tap. A click toggles it and sets
  `aria-expanded`. Esc or a second click hides it. Hover the row, not the chip, so the line stays up
  while the pointer moves onto it.
- Reserve the names line's height (an empty line with a fixed `min-height`) so showing it shifts
  nothing below it, and mark it `aria-hidden="true"`, since the button's label already carries the
  names.
- Add to the JS tests (the jsdom harness in `social-osint-browser.test.mjs` supports this): the chip
  is a button with that label, a click shows the names line and sets `aria-expanded`, and focus
  stays on the chip across an `npc_reacted` re-render.

## Minors

### m1. The `feed_posts_for_client` rescue can turn real faults into passing absence tests

**Section:** 5.3, 11 (route tests).

**Evidence.** The plan rescues `StandardError` around `feed_reactions` in `feed_posts_for_client`
(and in the route), logs it and ships the posts without reactions. The derivation's unit tests call
`feed_reactions` directly, so they still see a raise. The glue tests do not. Several route
assertions are absence checks: "a serve with none has no `reactions` key", "a game open does not
carry them", the pre-C3 save cases, and the leak scanner's clean runs. Each of these passes
vacuously if the call raises (a misnamed keyword, a renamed C3 helper after the merge, a nil from
the map). On the dev server the same rescue would hide a fault during the live proof until a
screenshot showed a missing row, and in production nothing but a log line would record it.

**Fix.**
- Report through `Rails.error.report(e, context: { game_id:, post_id: })` as well as the log line.
- Re-raise in test unless a test turns the rescue on, for example
  `raise if Rails.env.test? && !BreakEscape::SocialFeed.rescue_reactions?`, with the raise-stub
  test turning it on.
- Pair each absence assertion with a presence assertion on the same fixture and request, so a raise
  cannot pass both.
- The live proof checks the Rails log for the rescue's line after each beat and fails if it is
  there.

### m2. The skin option for chips fails the planned CSS test

**Section:** 4 ("Pixel-art UI", first bullet), 11 ("Pixel-art CSS").

**Evidence.** Section 4 lets the builder pick either a 2px solid border or the `--ui-small-button-*`
9-slice skin. The skin is applied in `ui-themes.css` with
`border-width: var(--ui-small-button-px)` and `border-image-width: var(--ui-small-button-px)`, and
every theme sets `--ui-small-button-px: 6px`. The planned test rejects "border or outline width
other than 2px", so a builder who picks the skin (as the plan allows) gets a failing test. Or the
builder weakens the test, and then it no longer checks the 2px option either.

**Fix.** Choose one before the build. Either take the 2px solid `--ui-line` border only and drop the
skin option, or let the test accept exactly the skin's declarations (a `border-image-source` of
`var(--ui-small-button-image)` with `var(--ui-small-button-px)` widths) as the one alternative to
2px. Have the test treat `0` and `none` as allowed values, so `outline: none` on the non-focus state
does not trip it.

### m3. The stated answer bounds leave out the wrapper and assume plain JSON escaping

**Section:** 1, 5.4, 11 (route sizes).

**Evidence.**
- Each answer and each `feedPosts` item that carries reactions also gains `,"reactions":[]`
  (15 bytes) and one comma between items. The table gives only the per-item size, so a reader
  cannot add up an answer from it.
- "Ids with no characters that JSON escapes" is looser than the encoder. Rails renders with
  `ActiveSupport::JSON`, which also escapes `<`, `>` and `&` (and U+2028, U+2029) as six-byte
  `\uXXXX` sequences. A route test that adds raw id byte lengths would then fail on an id holding
  `&`, while the stated bound says it should pass.
- "At most the authored reactions whose target or carrying post this is" is loose for a plain
  reaction, which has no authored carrying post. The real bound is the serving NPC's own authored
  reactions, plus other NPCs' reactions that can target this post (a `to` naming it, or a
  `toComplaint` matching its complaint).

**Fix.** Write the answer growth as 15 bytes plus, per item, 43 bytes plus the encoded lengths of
its four strings, plus one byte between items, and the `feedPosts` growth the same way with 31.
Restate the per-answer count as above. In the route test, measure each item as
`item.to_json.bytesize` and compare it with 43 (or 31) plus the encoded lengths of its strings
(`s.to_json.bytesize - 2`), so the check follows the real encoder.

### m4. The clash warning fires on a legitimate event pattern

**Section:** 8 (the last warning), decision 8.

**Evidence.** "Two reactions by one NPC that can land on the same post (the same `to`, ...)" warns
whenever one NPC has two reactions with the same `to`. The plan's own event mechanism invites
exactly that: "sad to T `alongside` A, angry to T `alongside` B", where A and B are members of one
alternative set, so at most one of them is ever served and the two reactions can never both be
candidates. C3 reports this kind of choice in report lines and keeps warnings for real mistakes.
A warning here would fire on a deliberate pattern.

**Fix.** Do not warn when both reactions have an `alongside`, and the two `alongside` posts are
members of the same alternative set (each in `set_member_ids`, the same own post's set). Add a
fixture for it with no warning, beside the existing clash fixture.

## Nits

- **n1.** Section 5.3 says `feed_posts_for_client` computes the reactions "with the `revealed_map`
  it builds". It builds none today. Each reply item calls `feed_answer`, which builds a full
  `revealed_map` from `player_state` (`social_feed.rb`, inside `feed_answer`). Passing "the same
  map" to `feed_answer` therefore needs a new `revealed:` keyword on it. Say so in 5.3, and list it
  in build step 3.
- **n2.** If the helper of M1 keeps covering own posts, do not give it a `reply_` name.
- **n3.** Section 4 says the font fallback list holds no smooth font. That is true of the `var()`
  fallback only. `fonts.css` defines `--se-font-readable` as `'GNF', 'Source Sans 3', 'Segoe UI',
  Arial, sans-serif`, so glyphs GNF lacks (Cyrillic ј and ѕ, per its comment) still fall back to
  Source Sans 3. The rule allows the variable, so nothing needs to change, but reword the sentence.
- **n4.** The osint browser's existing focus rings are `outline: 3px solid` with a 2px offset
  (`.ob-head button:focus-visible` and the rest), which already breaks the 2px rule. The plan's 2px
  ring is right. Say that it is deliberate, so a builder does not "match the page" by copying the
  3px. Put it on `:focus-visible`, as the page does.
- **n5.** Section 6 does not say what order `reactionsFor` lists people in within a key. Live
  answers arrive in serve order and `restore` reads the server's order (by reactor id), so the
  `aria-label` can change across a reload, and F17 compares names. Sort people by NPC id in
  `reactionsFor`.
- **n6.** `note_feed_served` and `scan_feed` return early when the scanner holds no feed texts and
  no feed fact ids. Put `feed_reacts_key` (a structural check) outside that early return, or say
  why the case cannot arise.
- **n7.** Section 8's errors say "neither or both of `to` and `toComplaint`" without saying what
  counts as present. The derivation's cleaner counts only non-empty strings, so
  `{ "to": "x", "toComplaint": "" }` is accepted there. Follow C3's rule (`check_reply`): a field
  that is present but not a non-empty string is its own error, and "both" counts non-nil fields as
  the server does.

## Open questions as framed

- **Decisions 2, 5 and 6** (q79, q81, q80): unchanged and fair. Each has its suggested option
  standing as the working rule.
- **Decisions 3 and 4:** recorded as decided.
- No new question for the user comes out of this round. The M2 fix is engine UI, not a design
  choice, and m2 is a choice the planner can make.
