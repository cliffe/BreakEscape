Counts: 0 blockers, 0 majors, 1 minor, 1 nit.

# Friendface reactions: code review, round 2

Reviewed `build/reactions` at c780d99d7: the round 1 fixes (2ef9f9e05, 3578e0b8f, c9d5fc081,
741ae409e), the merge of main b7d500ccf (23d76a68f) and the q80 change (5c7c742dc, icons at 2x).
q81 (the user approves the icons before merge) is not decided here.

## Tests run (affected files only, no lock)

- Node, 22 files, all pass: every file that imports `social-feed.js`, the osint browser or the
  access test bridge (`friendface-phone`, `npc-social-lockout-q33`, `osint-friendface-logo`,
  `social-feed-reactions`, `social-osint-browser`, `social-osint-address-bar`,
  `test-bridge-access`, `social-ready-toast`, `social-feed-replies`, `social-gap-osint-browser`,
  `social-feed`, `social-reuse-osint`), the validator files (`validator-access-reactions`,
  `validator-access-reply`, `validator-access-social`, `validator-social-schema`,
  `validator-known-failures`, `validator-exit-code`), and main's files near the feature
  (`social-intel`, `toast-duplicate`, `toast-queue`, `toast-once-across-panel-handover`).
- Rails, every test file that touches the feed, `SocialFeed` or the leak scanner (13 files,
  including `feed_post_test`, `feed_post_reply_test`, `feed_post_reactions_test`,
  `friendface_phone_test`, `social_lockout_q33_test`, `access_leak_scanner_test` and the four
  `access_work_feed_*` unit files): 298 runs, 2174 assertions, 0 failures.
- Validator on `scenarios/test_access_social/scenario.json.erb --no-graph`: exit 0 (main's new
  exit rule), 0 lines with a failure mark, the seven `Reaction` report lines.

## Round 1 findings: each closed, each with a test that fails without the fix

Checked in a throwaway detached checkout of c780d99d7 by reverting each fix and running its test.

- **m1 (tripwire quote forms)**: closed. The regex reads all three quote forms and a self-check
  compares the count with the `test(` lines. Appending `test("C3's extra", ...)` to C3's file makes
  the tripwire fail.
- **m2 (scanner, lost answer)**: closed. `feed_target_out?` and `feed_poster_out?` credit the
  saved ids a lost answer accounts for, from the lost line on. With the scanner change reverted,
  `review R1 m2: after a lost answer ...` fails (51 runs, 1 failure). The same test keeps the
  answer-before-the-lost-line case and the no-lost-line case as leaks.
- **m3 (no post, no reactions)**: closed. The stub makes `feed_answer` return nil for Ivy's
  answer. The test asserts no `reactions` key, that the post is still saved, that the next serve
  and the load agree, and that nothing lands on another item. Moving the `if answer` guard
  (`social_feed.rb:107`) would break `refute res[2].key?('reactions')`. One side effect shows up
  in the test: the next serve carries Tomasz's sad on `ivy_answer`, a post the client never got.
  The client keeps it under that id and emits `npc_reacted:tomasz` with no target fields. The
  honest route cannot reach a nil answer, so this is not a finding.
- **m4 (pointer-focus mark)**: closed. Document `pointerup` and `pointercancel` handlers clear the
  mark. They are registered through `this.addEventListener` at `osint-browser-minigame.js:158`, so
  cleanup removes them. With the JS change reverted, `reactions: a press on a keyboard-focused
  chip released off it ...` fails. The test covers both release events and has a paired
  held-press case. Main's tap pick adds no DOM listeners (`tap-pick.js` uses Phaser input), so
  nothing on main stops the document `pointerup` arriving.
- **n1 to n6**: closed. Report wording, the comma and the single "out by then" are asserted in
  `report lines: every main form and ending`, with a new `toComplaint` plus `alongside` fixture.
  `_`-prefixed fields do not warn, and an unknown key beside them still does. With the
  `feed_reactions` early return reverted, the n3 stub test fails (19 runs, 1 failure). The dead
  code is gone. The README examples now carry the demo's text, and plan 5.1 names `reply_target`.

## q80: icons at 2x

- **Change.** `.ob-reaction-icon` is 32px with `min-width`/`min-height` 32px, `flex: none` and
  `image-rendering: pixelated` (`osint-browser-minigame.css:370`). The `<img>` has
  `width="32" height="32"` (`osint-browser-minigame.js:527`). The chip minimum is 40px with
  `border-box` (32 + 2 + 2 + 2 + 2 vertically), and the count is 16px. The PNGs are still 16x16.
  The icon is drawn only in `_reactionChip`; the phone path and the toasts do not draw it, and
  `npc_reacted` is consumed only by the browser itself.
- **Pixel-art rule.** 2px solid square borders, no radius, shadow or gradient, `--ui-accent` open
  border and focus ring, GNF from `--se-font-readable`, icons at a whole 2x. Live at 390px
  (below): every icon is 32x32 from a natural width of 16, pixelated, and every chip is 61x40 with
  a 2px border, 0px radius and 16px GNF.
- **The size test** (`social-feed-reactions.test.mjs:179`). It fails on a 16px icon rule, on a size
  off a 16px step, a transform or zoom, a shrinking flex, a chip too small for the icon, or a
  resampled PNG. `social-osint-browser.test.mjs` pins the `<img>` attributes and checks for no
  inline style. The test is sound for the rule it targets, but see m1 for the places it does not
  look.
- **Phone width.** The `@media (max-width: 700px)` block does not touch the reaction rules. The
  live 390px check is below.

## Merge of main (23d76a68f)

No conflicts. Only `README_scenario_design.md` and `scripts/scenario-schema.json` changed on both
sides, in separate places. Main's areas near the feature still pass with the branch: C3 replies
(`feed_post_reply_test`, `validator-access-reply`, `social-feed-replies`), tap pick (no DOM
listeners, nothing shared), the ux-access toasts (the three toast files and `social-ready-toast`;
reactions raise no toast), `social-intel`'s new `evidenceNoteTitle` (not on the feed path), and
the feed store (`social-feed`, `feed_post_test`). Main's hardening step makes the validator exit
1 on any unlisted failure. `test_access_social` exits 0 and has no known-failures entry, so the
merge batch validator rule holds for this branch.

## Sync size rule

Reactions add nothing to `player_state`. `feedRevealed` entries keep their shape: `player_state and
feedRevealed are identical to the same run with reacts removed` passes. Nothing new is sent up. In
the live run every `/feed_post` request was 37 to 43 B (`npc_id`, `object_id`). No `sync_state`
body held feed or reaction data, only global variable deltas, the clock and timed messages. The
`/feed_post` answer carries only the reactions that come out with that one post (`via:`), so it
is a delta. `feedPosts` on `GET /scenario` is bounded by the authored reactions (at most one item
per authored reaction) and is fetched once per page load, as round 1 measured. The client's
`reactions` map is bounded the same way and is never sent back. Nothing here grows with play time.

## Live look (game 2006, 390x844)

Keyless server on :3262 from the worktree, `swap-scenario-game.rb test_seating test_access_social`
(game 2006, no seed), headless at device pixel ratio 1, `setFPS(20)` with fixed steps. I picked up
the phone and walked east to `f15_room`. F15's reactions arrived as PLAYTEST.md says: Asha's vent
sad from Kofi and Mei, Kofi's reply liked by Mei, Mei's reply liked by Asha. With the browser on
Asha's profile, the page is 390px wide with no horizontal scroll and the main column is 370px.
Icons are 32x32 (natural 16, pixelated), chips are 61x40, and each reaction row is 61.6px before
and after the names line shows. Clicking sad opens it with the accent border and fills the names
line ("Sad: " and the two names) without changing the row height. The server log has no
`[reactions] derivation failed` line. Server stopped.

Shots (scratchpad `ux-shots/reactions-2x/`, not committed): `r2-01-phone-390-asha-feed-32px-icons.webp`,
`r2-02-phone-390-sad-open-names-line.webp`, `r2-03-phone-390-chips-crop-3x-nearest.webp` (crop
enlarged 3x with nearest-neighbour). The icon edges are crisp.

## Minors

### m1. The 2x size test only sees icon rules whose selector names the icon or `.ob-reaction`

`test/js/social-feed-reactions.test.mjs:121` (`reactionRules` keeps only rules whose selector
contains `.ob-reaction`) and `:180` (filter `/\.ob-reaction-icon|\.ob-reaction\b.*\bimg\b/`).

Failure: someone adds `.ob-reactions img { width: 16px; height: 16px; }`. The `\b` after
`.ob-reaction` does not match before the `s`, so the new test skips the rule. Or someone adds
`.ob-post img { max-width: 16px; }` or `.ob-root img { ... }` in the same file, which never
reaches `reactionRules` at all. Or a phone media query in another stylesheet sizes `img`. In each
case the icon shows at 16px, which q80 rules out, and every test stays green: the `<img>`
attribute test checks attributes, not the computed size, and jsdom does no layout.

Fix: in the size test, take every rule in `osint-browser-minigame.css` whose last compound
selector is a bare `img` or contains `.ob-reaction-icon` (drop the `\b`, or match
`/(^|\s|>)img$|\.ob-reaction-icon/` on the last compound), and apply the same 32px checks to them.
Add one fixture string per gap (`.ob-reactions img`, `.ob-post img`) to the self-test so the
filter's reach is pinned. The live proof's `getBoundingClientRect` check stays the guard for
other stylesheets. Name it in PLAYTEST.md's reaction rows so each live proof repeats it.

## Nits

### n1. The names line is 14px GNF, which renders softer than the 16px count beside it

`public/break_escape/css/osint-browser-minigame.css:377`. In `r2-03` the names line ("Sad: ...")
is visibly anti-aliased next to the crisp 16px count and post text. This follows the browser's
existing 14px secondary text (`.ob-post-date` at line 221, `.ob-reply-to` at 227), so it breaks
no rule as written. If the user wants every GNF line in this view on its 16px grid, move the names
line to 16px together with those lines (one place, not this branch alone). Otherwise leave it.
