# Deduction board: accessibility and UX review (sidecar)

Track: accessibility and UX. Reviewer read `deduction/DEDUCTION_IMPLEMENTATION_PLAN.md` at **3327 lines,
latest §14 entry "Round 4 outcomes"**, plus `designs/12_deduction_board.md`, `designs/03_intel_board.md`
"Accessibility and small screens", and the shipped board code (`minigames/intel-board/intel-board-minigame.js`,
`css/intel-board-minigame.css`, `systems/notifications.js`). The plan was not edited. Line numbers below are
from the working tree on 2026-10-22.

Standard used: design 03's rules (list of cards, nothing dragged, Tab/Enter/Space, 44 px targets,
`aria-live="polite"` for changes, no motion under `prefers-reduced-motion`, ✓/✗ with words, "Why?" not
hover-only) and WCAG 2.2 AA. Aim kept in view: fun and educational, not hard, for newcomers.

Severity: **major** (a player using a keyboard, a screen reader or a small screen cannot do or learn
something that others can), **minor** (harder than it needs to be), **polish**.

## Summary of the top changes

1. **Toasts are invisible to screen readers and time out.** The nudge, the first-punch warning, the
   `reveal: "now"` outcome, the tamper line and `closeHint` all go through `showNotification`, whose
   container has no live region and which removes the toast after 5 s. Give the runtime its own
   announcer and put every toast line somewhere persistent too (§A1, §A2).
2. **The board's live region is rebuilt on every render**, pre-filled, so most screen readers say
   nothing. Keep one live region for the life of the overlay and write to it after render (§A3).
3. **Focus is lost on every mark** because the board rebuilds. Restore focus by data attribute, as
   defender mode already does (§B1).
4. **"Verdict given" as a disabled button hides the verdict from keyboard users.** Show it as text in
   the card and drop the controls (§B3).
5. **Cut the Tab stops.** Five suspects with three mark buttons, a profile picker and a reasons list is
   30 to 50 stops in fixture A. Use one stop per mark group (roving tabindex, arrows inside), native
   checkboxes for reasons, and headings so screen-reader users can jump by suspect (§B2, §C1).
6. **Reduce what the player must hold in their head.** Say where found clues are in the count line
   ("1 found: Okoro"), give each card a progress line ("4 of 5 clues found"), group the counts by slot,
   and keep "What to look for" in reach while working on suspect five (§D1 to §D4).
7. **Safer defaults at the points of no return.** The final-call confirm opens with focus on "Go back";
   Esc on the confirm panel is "Go back"; Esc does nothing on the retry panel (§B4, §B5).
8. **Rewrite four player-facing strings** that are hard to parse aloud or for newcomers (§E1).
9. **State the KO rule before the first punch,** on the profile card, not only in a toast after it (§A4).
10. **Add the test assertions in §F** to P10-H1, P10-H2 and the bridge scripts.

---

## A. Announcements and timing

### A1 (major) Runtime toasts never reach a screen reader

`renderNotification` (`systems/notifications.js:87-110`) builds a plain `div` inside
`#notification-container` (`app/views/break_escape/games/show.html.erb:105`). Neither has `role` or
`aria-live`. The plan sends these through toasts and nowhere else at the moment they happen:

| Line (§6.3 / §5.5) | Where else the player can read it later |
|---|---|
| Nudge "You have enough to decide about <name>." | On the board (good) |
| First punch "Knocking out a suspect counts as accusing them." (+ strict line) | Nowhere |
| `reveal: "now"` outcome "Right call: Okafor matched the Keyholder profile." | Board, in words (good) |
| Tamper `text` / `tamperText` | Board cell "Evidence destroyed" (good, but not the authored story line) |
| `closeHint` | Nowhere |
| "The case file could not be closed yet. Open the case file to try again." | Nowhere |

**Change.** `deduction-runtime.js` owns a visually hidden announcer, created on install and removed on
`uninstall()`:

```js
// one per runtime; <div id="deduction-announcer" role="status" aria-live="polite" class="sr-only">
announce(text, { assertive = false })  // clears, then sets text on the next frame
```

Every runtime toast also calls `announce(...)`. The first-punch warning and "could not be closed yet"
use a second node with `role="alert"` (assertive), since they need action now. This touches no shared
file. Fixing `#notification-container` engine-wide is the better long-term fix but it is a shared file
outside Phase 10's owners; file it as an idea, not part of this phase.

**Timing (WCAG 2.2.1).** A 5 s toast is fine only when the same information stays available. For the
three "Nowhere" rows:

- First-punch warning: `showNotification(..., 'warning', 'Case file', 10000)`, and the line also sits
  permanently on the profile card (§A4).
- `closeHint`: also shown as a line at the top of the board's footer while the case is open and every
  suspect has a verdict ("Everyone has a verdict. Close the case when you're ready.").
- "Could not be closed yet": `'warning'` type (so `shouldHoldNotification` does not hold it,
  `notifications.js:18-25`) with 10 s, and the board's debrief view shows it again above Finish on
  reopen.

### A2 (minor) Held toasts arrive late and out of context

`info`/`success` toasts raised while a conversation is open wait until it closes
(`notifications.js:14-25`). A nudge from `#grant_fact` in a witness's ink therefore appears after the
chat closes. That is good for sight (no overlap with the portrait). For a screen reader the announcer
should follow the same hold, otherwise the nudge is read over the NPC's next line. **Change:** the
announcer checks `fullScreenPanelOpen()` for nudges and outcome toasts and queues them the same way; the
two alerts in A1 go at once.

### A3 (major) The board's live region is recreated, pre-filled, on every render

The existing board builds a new `.ib-live` node inside `_render()` and sets its text before inserting
it (`intel-board-minigame.js:147-151`, `:189-190`, `:375-376`). Screen readers announce changes to a
live region that already exists; a node inserted with text in it is usually silent (NVDA and VoiceOver
both miss it). The deduction view will rebuild after every mark (§6.5), so mark confirmations, the
"Mark every suspect first" message and outcomes would go unheard.

**Change** (in `deduction-view.js`, no edit to the existing modes): create the live region once in the
overlay shell, outside the subtree that `renderDeductionBoard` replaces; expose `say(text)` which sets
`textContent = ''` and then the text in a `requestAnimationFrame` (or `setTimeout 50`), so repeating
the same message is announced again. Announce only differences: keep the last set of nudged suspect ids
and announce a nudge only for a suspect new to that set.

What the board announces (all polite):

| Event | Text |
|---|---|
| Mark set | "Venn marked: Not a cultist." / "Okafor marked: Cultist, Keyholder." |
| Mark cleared | "Venn marked: Undecided." |
| Nudge newly true (board open) | the §6.3 nudge line |
| Final call blocked | §6.3 "Mark every suspect first: <names> still undecided." |
| Board opened on a closed case | "The case is closed. View the debrief." |

### A4 (major) The KO rule is only explained after the first punch

With attacks on, the first punch turns a calm suspect hostile (`player-combat.js:417-448`), and the
warning toasts afterwards. A KO takes several punches (punch 20 against 100 HP,
`config/combat-config.js:48-49`), so a reader who sees the toast can stop. A player who misses a 5 s
toast, or uses a screen reader, cannot. **Change:** when attacks are on and `ko` is in `allowed`, the
profile card carries the line under the stakes line, from the start: "Knocking out a suspect counts as
accusing them." (+ " A wrong one loses the mission." under `strict`). Add both strings to §6.3. The
brief should say it too (an authoring rule for §7.9; DL could warn when attacks are on and `briefText`
does not mention it, but a string match is brittle, so a reviewer check is enough).

### A5 (minor) Reduced motion outside the board

The board's CSS already turns off animation under `prefers-reduced-motion`
(`intel-board-minigame.css:302-307`). The toasts slide in (`notifications.css:30-40`) and have a
moving progress bar, with no reduced-motion rule. The deduction toasts are new reasons to see that
slide. Out of Phase 10's files; list in the ideas backlog with A1's engine-wide fix. Inside the board,
the plan adds nothing that moves; keep it that way (no flip animation when a cell is revealed, no
pulsing nudge).

---

## B. Keyboard and focus

### B1 (major) Focus after a mark change

§6.5: the board "rebuilds its model" after each `setMark`. If the view re-renders the subtree, focus
falls to `body` and the next Tab starts from the top: with five suspects that is up to 40 stops back
to where the player was. Defender mode solves this by re-focusing by selector after render
(`intel-board-minigame.js:225-228`). **Change:** every interactive element gets stable data attributes
(`data-suspect`, `data-control="mark|profile|reason|submit|go-back|confirm|finish|retry|debrief"`,
`data-value`), and `renderDeductionBoard` takes `focus` (the attributes of the element that had focus)
and restores it. When the target no longer exists (the profile picker after the mark changes from
guilty to clear), focus goes to the pressed mark button of that suspect.

### B2 (major) Too many Tab stops; use one stop per group

Fixture A: 5 suspects × (3 mark buttons + 3 profile buttons after a guilty mark + up to 4 reason
buttons after a clear mark) plus the scroll region, Close and the footer. That is 30 to 50 stops, all
reached with Tab only.

**Change:**

- **Marks:** `role="radiogroup"` labelled "Your mark for <name>", three `role="radio"` buttons with
  `aria-checked`, roving tabindex (only the checked one, or "Undecided", has `tabindex="0"`), Left/Up
  and Right/Down move and select, Space/Enter select. `requiresKeyboardInput: true` already stops the
  player controller eating the arrow keys (design 03). This replaces §6.4's "three toggle buttons with
  `aria-pressed`": a mark is one of three, which is a radio group, and `aria-pressed` on three
  mutually exclusive buttons reads as three independent switches.
- **Profile picker:** same pattern, `role="radiogroup"` labelled "Which profile fits <name>?".
- **Reasons:** native `<input type="checkbox">` inside a `<label>` (one per held clue), in a
  `<fieldset>` with legend "What rules them out? (optional)". Native checkboxes give the right
  semantics, Space toggles them, and the label is the 44 px target.
- Result for fixture A: about 5 × 3 = 15 stops plus Close and the footer, and arrows within a group.

If the builder prefers to keep plain buttons for consistency with the other modes, keep `aria-pressed`
but wrap each set in `role="group"` with the label above, so the button names ("Cultist") have their
context ("Your mark for Venn").

### B3 (major) "Verdict given" as a disabled control

§6.4: "After a verdict the mark control is disabled with 'Verdict given' as its label." Disabled buttons
leave the Tab order and many screen readers skip them in browse mode, so a keyboard player never meets
the verdict while tabbing, and pale disabled text often fails 4.5:1. **Change:** after a verdict, remove
the mark controls and show a text line in the card, in normal text colour: "Verdict given: Cultist
(knocked out)." with the outcome words when revealed ("Wrong call ✗"). The test state keeps
`locked: true`. The card heading gains the state (B6), so heading navigation finds it.

### B4 (major) The final call's confirm step

§6.6 lists the confirm panel's content but not focus. **Change:**

- On "Make the call", render the confirm panel as `role="dialog"` with `aria-modal="true"` and
  `aria-labelledby` its heading "Confirm the call", inside the overlay. Move focus to **"Go back"**,
  not "Confirm the call", so a stray Enter cannot close the case.
- The list of marks is a real `<ul>` ("Okafor: Cultist, Keyholder"; "Venn: Not a cultist"; a KO'd
  suspect: "Marsh: Cultist (knocked out, already counts)").
- Tab cycles inside the panel. **Esc on the panel is "Go back"**, not Close: the board-level Escape
  handler checks for the panel first.
- "Go back" returns focus to "Make the call".
- If `requiresAll` fails, do not open the panel: announce the §6.3 line (A3), keep focus on "Make the
  call", and give each undecided card a visible "Undecided" word next to its heading so the player can
  find them without colour.

### B5 (minor) Esc on the retry panel and the debrief

- **Retry panel.** Both buttons are final ("See the debrief" declines the retry and is synced, §5.5).
  Esc should do nothing there (focus stays; announce "Choose Try again or See the debrief."). Focus on
  open goes to the panel's text (`tabindex="-1"` paragraph) so it is read, then Tab reaches the
  buttons. Order: "Try again" first, matching the sentence.
- **Debrief.** §6.1 makes Close and Esc act as Finish, which runs the stakes and the credits. A
  screen-reader user who presses Esc to leave a list (a common habit in browse mode) ends the
  mission mid-read. Since the debrief is the teaching payoff, keep the Close control as Finish (it is a
  visible, labelled button) but make **Esc move focus to Finish and announce "Press Finish to end the
  case."** rather than finishing. A second Esc while Finish has focus finishes. The bridge assertion in
  §11.4 ("Close and Esc on the debrief act as Finish") changes to match. If the plan keeps Esc as
  Finish, at least give Finish an accessible description: "Ends the case and runs what happens next."

### B6 (minor) Headings and landmarks for navigation

Screen-reader users move by heading. Give the overlay one structure:

- `h2` board title ("Open evening"); `h3` "What to look for"; `h4` per profile label.
- `h3` per suspect: name, then a short state in the heading text: "Venn, archivist. Undecided, 2 of 3
  clues found." / "Okafor, lecturer. Verdict given." The nudge does not go in the heading (it would be
  read every time) but sits as the first line under it.
- Each slot is a `<ul>` with `aria-label="Where they were"`; each cell an `<li>` whose text reads in full,
  as §6.4 already says.
- Debrief: `h2` "How the case stood"; summary paragraph; `h3` per suspect with the outcome in it
  ("Venn: Wrong call"), so the heading list alone is a summary.

### B7 (polish) Focus on open

The existing board focuses the root (`tabindex="-1"`, `intel-board-minigame.js:135`). For deduction,
focus the `h2` (made focusable with `tabindex="-1"`) so the title is read; on the debrief view, its
`h2`; on the retry panel, its text. When the board reopens in the same session, restoring focus to the
last suspect the player worked on (kept in memory on the runtime, not persisted) saves a long walk.

### B8 (minor) Space and E inert

Already planned (design 03, §11.6). Add **arrow keys** (B2) and **Esc on the confirm panel** to that
bridge check.

---

## C. Visual states without colour; target size; reflow

### C1 (minor) Pressed marks, marked clues, outcomes

- A chosen mark shows a ✓ icon and a heavier border as well as the fill colour. The icon is
  `aria-hidden`; the state is in `aria-checked`.
- "✦ marked": the ✦ is a `<span aria-hidden="true">`, the word "marked" is real text. Screen readers
  otherwise say "four pointed star" or nothing. The same rule for the ✓/✗ beside outcome words.
- Count lines for a marked clue type carry "✦ marked" too, so the profile card and cells match.
- Cell states differ by words ("Hidden", "Evidence destroyed") and by shape: hidden cells a dashed
  border, destroyed cells a struck-through pattern plus an icon, shown cells solid. Not by tint alone.
- Contrast is fine with the existing palette on the card cream `#f3e7cf`: `#6b5a48` 5.4:1,
  `#1d6a35` 5.4:1, `#8a2b1f` 7.0:1. Keep hidden-cell text at `#6b5a48` or darker; avoid opacity for
  "disabled" looks.

### C2 (major) 44 px targets

The existing `.ib-option` is `min-height: 40px` (`intel-board-minigame.css:262`), below design 03's
44 px. The deduction controls should not inherit 40: give `.ib-ded-mark`, `.ib-ded-profile`,
reason labels, "Make the call", "Confirm the call", "Go back", "Try again", "See the debrief",
"View the debrief" and Finish `min-height: 44px; min-width: 44px`. WCAG 2.5.8 needs 24 px; the house rule
is 44. (The 40 px in the other modes is a separate fix for whoever owns that file.)

### C3 (minor) Reflow and the profile card

Below 700 px the board is one column (design 03). With five suspects the profile card scrolls away
before suspect three, and comparing against "Was in the Archive, wants the Codex, and carries no ward
charm" means scrolling back up. **Change:**

- At 1000 px and wider: two columns, the profile card in a left column with `position: sticky; top: 0`
  and its own scroll if taller than the viewport; suspects on the right. Use `scroll-padding-top` so a
  focused control is never under a sticky header (WCAG 2.4.11).
- Below 1000 px: a "What to look for" button in the header that jumps to the profile card (moves focus
  to its heading), and a "Back to <name>" link after it that returns to the suspect last focused.
- Test 320 CSS px wide (WCAG 1.4.10, 400 % zoom): no horizontal scroll, long clue labels wrap
  (`overflow-wrap: anywhere`, as `.ib-why` already does).

---

## D. Cognitive load: a 5×3 grid with counts

Fixture A is the heaviest case: 5 suspects, 3 slots, 12 clue types in the count list, 3 profiles, one of
them a three-part `all` with a `not`. Everything the player needs is on screen, which is right, but the
player has to do the bookkeeping across the screen in their head. These changes keep every deduction
with the player and cut the clerical work.

### D1 Say where found clues are

Plan: "Brass key: 1 in this case, 0 found". To eliminate by count the player must find which cards show
the found ones. **Change:** "Ward charm: 2 in this case. Found: Venn." / "Found: none yet." /
"Found: Venn, Ishikawa (all found)". The last form is the count elimination the debrief teaches
("Both ward charm clues were found elsewhere..."), so showing it on the board teaches the same habit
while it is useful. It reveals nothing the cards do not already show. Model: `counts[].foundOn: [names]`.

### D2 Group the counts by slot, marked first

Twelve lines in clue order is a wall. Group under the slot labels the cards use ("Where they were",
"What they want", "What they carry"), each a `<ul>` with a sub-heading, marked clue types first in each
group. Same order the cards use, so the eye moves the same way.

### D3 A progress line per card

The cell layout is public (§3.1). Show it as a sentence under the heading: "2 of 4 clues found. 1
evidence destroyed." It tells the player where to spend effort without saying anything about guilt.
Model: `suspects[].found`, `.total`, `.destroyed`.

### D4 Make the profile text match the cells

Newcomers match words, not ideas. If the profile says "carries no ward charm" and the cell says "Warding
amulet", the player cannot connect them. **Authoring rule for §7 and a validator warning (proposed
DL23):** every clue named in a profile's rule appears in that profile's `text` by its exact `label`
(case-insensitive); and profile text sentences are 20 words or fewer. Fixture A's texts already pass the
first part ("brass Tesseract key" needs checking against the `brass_key` label).

### D5 Let the profile picker show what the player is claiming (opt-in help, not a solver)

When the player marks someone guilty and picks a profile, show that profile's text again under the
picker, split into its parts for an `all` ("Was in the Archive", "Wants the Codex", "Carries no ward
charm"). No ticks are filled in for them: this is a reminder of what they are claiming, not a check.
It costs nothing to build (it is `profiles[].text`, plus an optional authored `parts` array) and helps
newcomers with the three-part profile, which is the one most likely to be misread (the "rule misread"
no-blame case).

### D6 The nudge wording and placement

"You have enough to decide about Venn." is good: short, does not say which way. Put it as the first
line under the card heading, with an icon and a word ("Ready to decide"), and keep the toast. A blind
playtest question already checks whether players read it as a hint about which way (§11.6); add "did you
notice the nudge on the card?" to the same report.

### D7 Do not show what the player has not earned

Two things the board should keep out, for fairness and for load: no per-suspect "fits / does not fit"
indicator (that is the evaluator doing the deduction), and no total of guilty suspects anywhere (§3.1).
The progress line (D3) and the found-on line (D1) stay within that.

---

## E. Reading level of fixed strings

Target: a newcomer at about a reading age of 12 to 14, read aloud by a screen reader without the layout.

### E1 Strings to change (§6.3)

| Plan string | Problem | Proposed |
|---|---|---|
| "You had not ruled them out: <label>, from <place>, did" | Hard to parse; the verb comes last | "Nothing you held had cleared them. The <label> from <place> would have." |
| "Only <name> had room left for the <label>." | "Room left" is the internal cell idea | "Every other <slot label, lower case> clue was already known, so the <label> had to be <name>'s." |
| "<Profile>: no, <clause>" (e.g. "Courier: no, carries a ward charm") | Reads as "Courier says no"; the reason is not marked as a reason | "Not a <Profile>: carries a ward charm, and a <Profile> carries none." For a positive: "<Profile>: carries the brass key." Keep the short form as the visible label if space is tight, with the long form as the line's text |
| "Clear: matches no profile" / "Rightly cleared" | "Clear" and "cleared" are both used; fine, but "Rightly" is formal | Outcome "Right to clear" or "Correctly cleared" |
| "Missed" | Out of context it does not say what was missed | "Missed: guilty but not named" |
| "Verdict given" (button label) | See B3 | "Verdict given: <noun> (<kind word>)." as text |

The rest of §6.3 is plain and short; the no-blame lines are good.

### E2 Terms a newcomer meets first

"Profile", "verdict" and "marked" are the three terms the board relies on. The board's first open
should carry one line under the title, shown until the player sets a first mark: "Check each suspect
against what to look for. Your marks are notes; nothing counts until you act on it." (authored default,
`introLine` overridable). It answers the most likely first question (does clicking "Cultist" accuse
them?) in the place the question arises.

---

## F. Test assertions

### F1 `social-deduction-board-model.test.mjs` (P10-H1)

- `counts[]` grouped by slot (`counts[].slot`), marked first within a slot; `foundOn` lists names in
  suspect order; "all found" when `found === count`.
- `suspects[].found`, `.total`, `.destroyed` match the cells.
- The §6.3 additions (KO line, strict suffix, intro line, "Ready to decide", the E1 rewrites) contain
  none of the banned terms, and no fixed string contains "the <noun>" or a number of guilty.
- `koRuleLine` present only when attacks are on and `ko` is allowed; with the strict suffix only under
  `strict`.

### F2 `social-deduction-board.test.mjs` (jsdom, P10-H2)

Structure and names:

- The live region (`[role="status"][aria-live="polite"]`) is **the same node** before and after a mark
  change (`toBe` identity), and its text after the change equals "Venn marked: Not a cultist." after
  the next animation frame (use fake timers or await a tick).
- Setting the same mark twice announces twice (text cleared then set).
- Each mark set is a `[role="radiogroup"]` whose accessible name contains the suspect's name; exactly one
  radio per group has `tabindex="0"`; `aria-checked="true"` on the chosen one only. (If plain buttons are
  kept: a `role="group"` with `aria-labelledby` pointing at text that contains the name.)
- ArrowRight on the focused radio moves focus and `aria-checked` to the next mark and calls
  `runtime.setMark` once.
- Reasons are `input[type="checkbox"]` inside a `fieldset` whose `legend` is "What rules them out?
  (optional)".
- Every `.ib-ded-*` button and the reason labels carry the class that sets 44 px (jsdom does no layout,
  so assert the class, and assert in a CSS text test that the rule has `min-height: 44px`).
- Every ✦, ✓ and ✗ is inside `[aria-hidden="true"]`, and its sibling text contains the word.
- Each suspect has an `h3` whose text contains the name and either "Undecided", a mark, or "Verdict
  given"; the debrief has one `h3` per suspect containing the outcome words.
- After a verdict, the card contains no mark controls and contains text "Verdict given:".
- No element has a `title` attribute as its only label; no `[disabled]` element carries information that
  is not also in text.

Focus:

- After clicking a mark radio, `document.activeElement` is the radio for the same suspect and value
  (matched by `data-suspect` and `data-value`), not `body`.
- After switching a guilty mark to clear, focus is on that suspect's checked radio (the profile picker
  is gone).
- "Make the call" with an undecided suspect: no dialog appears, focus stays on "Make the call", the live
  region names the undecided.
- "Make the call" with all marked: a `[role="dialog"][aria-modal="true"]` appears, labelled "Confirm the
  call"; `activeElement` is "Go back"; Esc closes the dialog (not the board) and focus returns to "Make
  the call"; `minigame_completed` was not emitted.
- Retry panel: Esc does nothing (`retryCall` and the decline handler not called); focus starts on the
  panel text.
- Debrief: Esc moves focus to Finish and does not call `finishDebrief`; a second Esc with Finish focused
  calls it once (or, if the plan keeps Esc as Finish, Finish has an `aria-describedby` with the
  description in B5).
- On open, `activeElement` is the `h2` title (board) or the debrief `h2`.

Reduced motion:

- The stylesheet's `prefers-reduced-motion` block covers the deduction container's selectors (a CSS
  text check).

### F3 Runtime (`social-deduction-runtime` tests)

- On install, exactly one `#deduction-announcer` with `role="status"` exists, plus one
  `role="alert"` node; a second install leaves one of each; `uninstall()` removes them.
- The nudge calls `announce` with the nudge line once per suspect; held while
  `fullScreenPanelOpen()` is true, released after.
- The first punch on a calm suspect calls `showNotification` with type `'warning'` and a duration of
  at least 10000, and announces through the alert node, once per suspect.
- "Could not be closed yet" uses type `'warning'`.
- `closeHint` is in the board model (`model.closeHint`) when every suspect has a verdict and the case is
  open.

### F4 Bridge scripts (§9, §11.6)

Add to each fixture's main script:

- **Tab walk:** from the board's open state, record `document.activeElement` labels for N Tab presses;
  assert the order is header, (intro), profile card controls, suspect 1's mark group, (its picker),
  suspect 2's mark group, ..., footer, Close, and that the count of stops for fixture A's opening state
  is at most 9 (Close, "What to look for" jump where present, 5 mark groups, footer, scroll region).
- **Arrow keys** move a mark and the player sprite does not move (extends the Space/E check).
- **Mark then Tab:** after setting suspect 3's mark, one Tab lands on suspect 3's next control or
  suspect 4's group, never back at the header.
- **Confirm dialog:** Enter right after "Make the call" lands on "Go back" (the case stays open).
- **Debrief Esc** behaviour as F2.
- **`bridge-deduction-a-wrong`:** after the first punch on Venn, `#deduction-announcer` or the alert
  node contains the KO line; the board's profile card contains it before any punch.
- **`bridge-deduction-b-600`:** no element's `scrollWidth` exceeds the viewport; the "What to look for"
  jump button exists and moves focus to the profile heading. If a launch at 360 px is cheap to add to
  `run-suite.sh`, add `bridge-deduction-b-360` with the same checks (WCAG 1.4.10 is 320 px).
- **Automated check (optional, cheap):** `playwright` is installed; if `axe-core` can be added under
  `test/` without a shared-file edit, run it on the open board, the confirm dialog and the debrief, and
  fail on `serious` or `critical`. If adding a dev dependency needs approval, skip it and rely on the
  checks above.

### F5 Blind playtest (P10-BL) additions

Ask the tester, as well as the plan's questions: did any line need reading twice (quote it); how many
times did you scroll back to "What to look for"; did you notice the nudge on the card; did you think a
mark accused someone. Pass condition unchanged.

---

## G. Things checked and fine

- No dragging anywhere (WCAG 2.5.7). Marks, pickers and the final call are all buttons.
- Outcomes always in words with ✓/✗ (§6.3). "Evidence destroyed" and "Hidden" are words.
- No stated number of guilty and no "the <noun>" (§3.1, §3.11) helps newcomers as well as fairness.
- The retry panel names nothing and is short.
- Warned close with "Not yet" (§7.5) gives a clear point of no return.
- Existing board colours meet 4.5:1 on the card cream.
- Persisted marks (§6.5) mean a player who leaves and comes back does not re-enter anything (WCAG 3.3.7).

## H. Out of scope here (for the ideas backlog)

- Engine-wide: `#notification-container` as `role="log" aria-live="polite"`, toast text via
  `textContent` not `innerHTML`, and a reduced-motion rule in `notifications.css`.
- The 40 px `.ib-option` in the existing board modes.
- The existing modes' recreated live region (same issue as A3).
