Counts: 0 blockers, 0 majors, 5 minors, 6 nits.

# Friendface reactions plan: review round 5 (final)

Plan reviewed: `docs/achitechture/FRIENDFACE_REACTIONS_PLAN.md` at b27e2d2e7 (Draft).

C3 code read with `git show build/c3-replies:<path>` at a4ecfe07e, the tip the plan cites.
`SocialOverlayScene` and the minigame manager read with `git show main:<path>`. The C3 build tree
also holds uncommitted R2 fixes (`validate_access_work.rb`, 43 new lines in
`validator-access-reply.test.mjs`); I read them only as evidence that C3's fixtures are still moving.

Files read: `public/break_escape/js/minigames/framework/social-overlay.js` and
`minigame-manager.js` (main); on C3, `osint-browser-minigame.js` (`go`, `_renderMain`,
`_focusKey`, `_restoreFocus`, `openProperties`, `closeProperties`, `_dropProperties`,
`_onPosted`, `openCaseFile`, `cleanup`), `app/models/break_escape/social_feed.rb`
(`reveal_feed_post!`, `feed_posts_for_client`, `feed_answer`), `scripts/validate_access_work.rb`
(`check_reactive_post`, `check_reply`) and `test/js/validator-access-reply.test.mjs`. I also checked
the jsdom in the repo (26.1.0) for `PointerEvent` and focus events on removal.

The orchestrator's ruling stands: a wrapped names line may grow the row, and no second line is
reserved. The plan already says this (section 4) and tests it (section 11's CSS check and live
measurement).

## Verdict

No design fault is left. The layer integration matches the real `SocialOverlayScene`: Esc is
caught in the capture phase on `document`, the topmost layer's `close` runs, and the plan's closer
removes its own entry, which the overlay does not. The five findings below are wiring details in
the pointer and focus model, the cleanup route, the agreement test and one helper lookup. Each has a
precise instruction a builder can follow and a code review can check.

## R1 to R4 findings

All resolved, with one exception carried as m5 below.

- R4 M1: Esc now goes through `pushLayer`, with the remover called on Esc, a second click, a click
  on another chip, `go()` and cleanup, and tests that dispatch Esc on `document` (sections 4, 6,
  11).
- R4 m1: copied fixtures, a `deadReasons` harness, two-way set equality per reply, `never_posts`
  checked against `feeds?`, and the three-reason fixture run through `check` (section 11).
- R4 m2: one warning per dead reactor (section 8).
- R4 m3: mouse-only hover, open then focused then hovered, 32px chips (sections 4, 11).
- R4 m4: no `aria-expanded`, `alt=""` on the icon, `data-open` for state.
- R4 m5: `min-height` checked in CSS, row height measured live, wrapping allowed.
- R4 m6: two `toComplaint` reactions on one complaint warn.
- R4 nits n1 to n3 and n5 to n7 are taken.
- R4 n4 was taken in a form that disagrees with `check_reply` (m5 below).

## Checked and found right

- **Esc order.** `_onEscape` returns early when a modal is open or the game is inactive, ignores a
  repeat, and closes `this._layers[this._layers.length - 1]` before the text-field blur and
  `requestClose()`. A names layer is therefore closed first wherever focus is, and the next Esc
  closes the browser. The browser has no text fields, so the blur branch never intervenes. The
  document-properties panel (`openProperties`, `_dropProps`) uses the same pattern and lives only on
  document views, so it never stacks with a names layer.
- **Leaks on the routes the plan names.** `go()` already drops the properties layer before
  `_renderMain`, and the plan adds the names layer beside it. `openCaseFile()` calls
  `launchChild`, and the minigame manager ends the suspended parent (calls its `cleanup`) before the
  child starts. The base `cleanup` empties `this._layers` and removes the Esc listener, so the
  only state that can outlive the minigame is the instance's own fields, and the instance is
  discarded. A return-to reopen builds a new instance with no open key.
- **The open key survives every re-render.** `_renderMain` rebuilds `main` from `place` and the
  instance's state. Reactions only grow, and a post never leaves a profile, so the open chip is
  always on the page after a re-render. Its single layer can therefore stay.
- **Keyboard-only use works.** Tab to a chip fires `focusin` with no `pointerdown` before it, so
  the focused chip's names show. Enter or Space fires `click` with no `pointerdown`, which toggles
  the open state and its layer. The `aria-label` holds the names for a screen reader. With m2's
  fix the open state no longer hides the names of a chip focused later.
- **Drawable matches `feed_answer`.** `feed_answer` returns nil for a reply exactly when `to` is
  not a hash, `revealed_map[to['post']]` is missing or its NPC is not a room NPC, or `to['npc']` is
  not a room NPC. `feed_posts_for_client` adds `feeds?` and `reply_target`. Section 5.1 lists all
  of these.
- **Never-fires fragments.** The four fragments in section 11 match `check_reply`'s messages
  exactly. `check_reactive_post`'s own unreachable-`when` warning has the same tag prefix but a
  different text, so exact fragments are needed, as the plan says.
- **q77 sync rule.** Nothing is stored, `feedRevealed` keeps C3's four keys, no request is added,
  each `/feed_post` answer carries only reactions whose `via` is the post just served, and
  `feedPosts` carries each visible reaction once per load. Section 5.4's sizes and bounds are
  unchanged and right.
- **Cheat policy.** A reaction holds no secret, key or forged item, and the server gates nothing on
  it. The `npc_reacted` task is documented as a cue. Section 7's tamper rows are all testable.
- **Build steps.** Each step names its tests, and each can run without the later ones (the label
  fallback covers the icons). The one test-harness gap is n1.

## Minors

### m1. The pointer-focus mark has no clear lifetime, and a re-render turns pointer focus into keyboard focus

**Section:** 4 ("Focus (keyboard only)"), 6, 11.

**Evidence.**
- The plan sets a mark on `pointerdown` and ignores "the `focusin` that follows it". When no
  `focusin` follows, the mark stays set. A click on a chip that already has focus (the second
  click, which closes it) produces no `focusin`. In Safari a click never focuses a button at all.
  The next keyboard Tab onto a chip is then ignored, and a keyboard user who used the mouse once
  sees no names.
- `_renderMain` saves `_focusKey()` and calls `_restoreFocus(key)`, which calls `el.focus()` on
  the new chip. That fires `focusin` with no `pointerdown` before it (jsdom 26 fires it too). The
  plan says this "restores the focused chip", but it does so whatever the original focus came
  from. After a mouse click on chip A (pointer focus ignored, A open), an `npc_reacted` or
  `npc_posted` re-render makes A the focused chip. The next click closes A, but A is still focused,
  so the names line stays up. This is the case the mark exists to prevent.

**Fix.**
- Clear the mark at the end of the chip's `click` handler and on `pointercancel`, as well as in
  the `focusin` it suppresses. A test does two clicks on one chip (each with a `pointerdown` first),
  then a keyboard `focus()` on chip B, and asserts B's names show.
- Keep the focused chip's key on the instance, set only by an unsuppressed `focusin` and cleared
  by `focusout` to an element outside the chip. During `_renderMain`, ignore chip `focusin` and
  `focusout` (set a `_rendering` flag around the body and the `_restoreFocus` call). The instance's
  key is already the truth across a re-render, and `_renderMain` draws the line from it.
- Test: click chip A, trigger an `npc_reacted` re-render, click A again, and assert the names line
  is empty and `data-open` is gone.

### m2. Keyboard focus moving to another chip still shows the open chip's names, and the scope of "the open chip" is not stated

**Section:** 4 ("The names line", precedence), 11.

**Evidence.**
- A keyboard user presses Enter on chip A (open, one layer), then Tabs to chip B in the same row.
  By the stated precedence the row keeps showing A's names while focus and the focus ring are on B.
  Nothing on screen says which chip the names belong to. The precedence was written to stop a
  mouse hover replacing a clicked line. It was never meant to override where the keyboard has gone.
- The instance holds one open key for the whole page, but each row draws its own line. With A open
  in row 1, the plan does not say whether row 2 shows its focused or hovered chip or shows nothing.

**Fix.**
- Write in section 4: an unsuppressed (keyboard) `focusin` on a chip other than the open one closes
  the open one through `_closeReactionNames()`, which removes its layer. Pointer focus is already
  suppressed, so this never fires on a click.
- Write that precedence applies per row: a row shows its own open chip, else its own focused chip,
  else its own hovered chip. A chip open in another row does not blank this row.
- Tests: Enter on A, Tab to B, assert B's names show, `data-open` is gone from A and
  `this._layers` is empty. With A open in one row, hover a chip in another row (mouse) and assert
  both lines show their own names.

### m3. `_closeReactionNames()` redraws the row, but cleanup and `go()` call it too

**Section:** 4 ("Esc", the routes list), 6.

**Evidence.** Section 4 defines `_closeReactionNames()` as "clears the open key, calls and clears
`_namesLayerOff`, and redraws the row". Section 6 has `go()` and the minigame's cleanup call it.
The osint browser's `cleanup()` sets `this.main = null` before `super.cleanup()`. If the call is
placed after that line, the redraw throws inside cleanup, and a throw there can leave the overlay
half closed. If it is placed before, it redraws a page that is about to go. In `go()` the redraw is
thrown away at once by `_renderMain`. The existing properties code avoids this: `go()` calls
`_dropProperties()`, which only clears the flag and calls the remover, and `closeProperties()` adds
the re-render.

**Fix.** Split it the same way. `_dropReactionNames()` clears the open key, calls
`_namesLayerOff` if set and nulls it, with no DOM work. `go()` calls it beside `_dropProperties()`,
and `cleanup()` calls it before `this.main = null`. `_closeReactionNames()` is
`_dropReactionNames()` plus the row redraw, and is the closer passed to `pushLayer` and used by the
click routes. Test: open a line, close the minigame, and assert no throw and an empty
`this._layers`.

### m4. The copied C3 fixtures can drift silently, and a new C3 never-fires warning would pass unseen

**Section:** 11 ("Agreement with C3"), 12, 15 step 4.

**Evidence.**
- C3 is still in code review. Its build tree holds 43 uncommitted new lines in
  `validator-access-reply.test.mjs` right now. A copy with a source comment records where the
  fixtures came from, but nothing fails when C3's file gains or changes a case.
- A drifted copy does not make the agreement test wrong. It runs the live `check` and the live
  helper on whatever fixtures it holds. What it loses is coverage. The worse gap is in the
  comparison itself. It maps exactly four fragments to codes, so if C3 adds a fifth never-fires
  warning to `check_reply`, the helper never learns of it, and the test still passes because the
  new message matches no fragment.
- Exact fragments already catch a reworded message: a reworded warning stops matching, and the set
  equality fails.

**Fix.** A source comment alone is not enough, but a byte-for-byte pin would fail on unrelated C3
edits. Add two checks:
- **Catch-all.** For every reply, every `check` warning that starts with that reply's tag (see n3)
  must either contain one of the four fragments or appear in a short, named list of known
  non-never-fires warnings (the one-way link, the answer walk-order warning, the second-reply
  warning, the text rules, and `check_reactive_post`'s `when` warnings). An unlisted warning fails
  with "unmapped check_reply warning: add a reason code or list it".
- **Case tripwire.** The test reads `validator-access-reply.test.mjs` and compares its list of
  `test('...')` titles with the list recorded when the fixtures were copied. A new, renamed or
  removed C3 test fails with "C3's reply tests changed since the copy at <commit>: re-check the
  copied fixtures". This catches added cases, the usual drift, without failing on edits inside a
  test.
- Step 1 already waits for C3 to merge. Take the copies from merged `main` at step 4, and record
  that commit, not a4ecfe07e, in the comment.

### m5. `:instead_of_dead` looks up `insteadOf` in a different place from `check_reply`

**Section:** 8 (the code table, `:instead_of_dead` row), 11.

**Evidence.** The table says the `insteadOf` post is "found among all feed posts through
`feed_post_index`, as `check_reply` finds it". `check_reply` does not use the index for this. It
uses `instead = AW.feed_posts(npc).find { |p| p['id'] == post['insteadOf'] }`, which searches the
NPC's own posts and replies only. If a reply's `insteadOf` names another NPC's reactive post with
an unreachable `when`, `check_reply` gives an error ("names no post of ...") and no never-fires
warning. The helper as written would return `:instead_of_dead`. None of C3's fixtures has such a
reply (the "errors" fixture's `inst_*` replies all name Tomasz's own posts or a missing id), so the
agreement test would not catch the mismatch. R4 n4 was right that the post may be a reply, but
wrong about which list it is found in.

**Fix.** Find the `insteadOf` post with `AW.feed_posts(npc)`, as `check_reply` does, and change
the table's wording to match. Add the missing case to the agreement fixtures: a reply whose
`insteadOf` names another NPC's reactive post with a dead `when` gives no `:instead_of_dead` and no
never-fires warning.

## Nits

- **n1. jsdom has no `PointerEvent`.** The repo's jsdom is 26.1.0, and `window.PointerEvent` is
  undefined there. The section 11 tests that dispatch `pointerenter`, `pointermove`,
  `pointerleave` and `pointerdown` with a `pointerType` must build them as
  `new window.MouseEvent(type, init)` and add
  `Object.defineProperty(e, 'pointerType', { value: 'mouse' })` (or `'touch'`). Say so in
  section 11, so the handlers read `e.pointerType` and do not check `instanceof PointerEvent`.
- **n2. A keyboard user's first Esc can look like it does nothing.** Enter on a focused chip opens
  it and pushes a layer, but the names were already showing from focus. Esc then closes the open
  state, the line is unchanged (focus still shows it), and only the second Esc closes the browser.
  This is acceptable. Write it in section 4 and assert it in the Esc test, so a code review does not
  report it as a bug.
- **n3. Tag prefix matching.** "a `check` warning starting with that tag" matches
  `tomasz.feed.posts[1]` against warnings for `posts[10]` to `posts[19]`. Match the tag followed by
  `.`, `'`, `:` or a space.
- **n4. "Drawable" wording.** Section 5.1 says a post is drawable "when the client is sent it", but
  `feed_posts_for_client` sends a post with no `seq` (as `seq` 0) and section 5.1 excludes it.
  Say "a post is drawable (can be a target or carry a reaction) when ..." rather than tying it to
  what is sent.
- **n5. The open chip has no look of its own.** `data-open` is said to be "for styling", but no
  rule is given. Add `.ob-reaction[data-open]` with a 2px solid `--ui-accent` border (square,
  no shadow), so a mouse user can see which chip the line belongs to. Add it to the CSS test.
- **n6. Live proof of the layer.** The base `getTestState()` already lists layer names under
  `overlay.layers`. In the live proof, after a click opens a names line, check that
  `overlay.layers` is `['reaction-names']`. After Esc, check that it is empty and the browser is
  still open.

## Open questions as framed

Decisions 2, 5 and 6 (q79, q81, q80) are unchanged and fair, each with its suggested option
standing. Decisions 3 and 4 are recorded as decided. No new question for the user: every finding
above is an engine choice the builder can make, and the code review can check it.
