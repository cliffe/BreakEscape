# Board mockup notes (fixture A)

Mockup: `board_mockup.html` in this folder. Open it in a browser. It has two views (the board mid-case, and the debrief for a mixed run) and a light/dark toggle.

Plan version read: `DEDUCTION_IMPLEMENTATION_PLAN.md` at 3,327 lines, latest §14 round 4. I did not edit the plan.

Checked in headless Chromium at 1140 px (light) and 390 px (dark): no console errors and no horizontal scroll at either width. Below 700 px everything goes to one column.

## What it shows

- **Board state:** row H+C+F of §9.2 (hall, coats, Marsh's favour; bridge A3), with Marsh already accused. It shows:
  - hidden cells (Okafor's carry, every pass except Marsh's);
  - shown cells, and marked cells with "✦ marked";
  - all three mark states, the profile picker and the clear-reasons picker (all clickable);
  - nudges on four cards, a locked verdict with "Right call";
  - the costly stakes line with the `scoreLine` suffix, and `briefText`.
- **States A cannot reach:** A has no tamper and uses `when: "anytime"`, so it never shows "Evidence destroyed" or "Make the call". A separate strip shows both on the same skin: a destroyed cell, the recovered cell, the blocked final-call message and the confirm panel.
- **Debrief run:** the player accuses Delacroix in the hall, which closes the coats. Then the code note, the archive, "Confront her now" on Okafor, and the sanctum without naming Marsh (row H+A). The debrief has all four outcome kinds: right, missed, wrong, and not named (innocent). It also has both settling-line types, "You had not ruled them out", a count line, and the "missed clue" no-blame line, which the §6.3 order selects for this run.

## Style choices

- I followed the house intel board (`css/intel-board-minigame.css`):
  - a cork field, paper cards with a dog-ear and pin, and a dark `--ui-*` header and footer;
  - Press Start 2P only for headings, and Source Sans 3 for every string the player reads;
  - 44 px targets, ticks always with words, and the three-column grid that drops to two and then one.
- Dark mode uses the eldritch theme's tokens (`ui-themes.css:212`). The game itself has no light mode; the mission's `ui_theme` sets the chrome. The light view is here as a contrast check on the paper cards. The cards stay paper in every theme.
- The four cell states differ by shape and words as well as colour:
  - hidden: dashed border, hatching, "?" and "Hidden";
  - shown: solid border;
  - marked: a "✦ marked" chip;
  - destroyed: double border, "✕" and "Evidence destroyed".
- The nudge is a sticky note in the same style on every suspect, guilty or clear, so its look gives nothing away.
- When a suspect has a verdict, the three mark buttons are replaced by the verdict box and "Verdict given. Your note: …". §6.4 asks for three disabled buttons instead. My version reads better, and screen readers skip less dead UI.
- In the profile card, the counts are grouped under the slot labels. "(all)" follows a count once every clue of that kind has been found.

## Recommended plan changes

Most important first.

1. **Make count elimination visible (PROPOSED in the mockup).** After the favour, the nudge says "You have enough to decide about Okafor", but her key reads "0 found". Unless the player can do the pigeonhole step in their head, the nudge looks wrong. Add one engine line per slot under the counts: "Still hidden here: 2 clues, both Dr Okafor's. Not yet found: brass Tesseract key, 1 notebook." It is built from the model's cells and counts, which are already public, so it gives away nothing new. It turns the hardest inference in fixture A into something the player can read, which suits "fun, not hard" and teaches elimination. It needs a §6.2 model field (`remaining` per slot), a §6.3 string and a §11.4 test. Hide it when nothing is hidden.
2. **Tell the player how an `anytime` case closes (PROPOSED footer).** In A the footer is empty until everyone has a verdict, and only then does `closeHint` appear. A player who leaves three innocents unnamed never sees it. Show an authored `closeRoute` line in the footer from the start ("How this case closes: call HaX when you are ready for the sanctum. Anyone you have not named stays free."), and switch to `closeHint` once everyone has a verdict. Add it to DL15's string list.
3. **Count line for a count of one.** §6.3 has "Both <label> clues…" and "All <n>…", but nothing for a single clue. Fixture A needs one: Venn and Ishikawa are decided against the key by exhausted count in row H+A. Proposed wording: "The only <label> was found elsewhere, so <name> could not have it."
4. **The debrief can point at a route the player's own wrong call closed.** In the mixed run, Ishikawa's card says her ward charm came "from Ishikawa's coat in the cloakroom". That route was closed by `a_lodge_suspicious` after the wrong call on Delacroix. §6.2 picks the first route that is not *faded*, and it ignores routes closed by a `cost: true` gate. The plan should pick the first route that was open when the case closed. Where the open route differs from the first-listed one, add a fixed line: "That route closed after your wrong call on <name>." This is the most useful lesson in the run (probing has a cost) and the debrief should say so.
5. **Summary line.** "3 of 5 calls right" counts innocents the player never named as right calls, which flatters a run that missed a cultist and accused an innocent. Proposed: "1 of 2 cultists named; 1 innocent wrongly accused; 2 innocents left alone, 1 with a reason." This needs `summary` fields for named-guilty, wrong and left-alone. The word "cultists" comes from `verdictNoun`, and it states the true number only at the debrief, after the case has closed, so §3.1 still holds.
6. **"Recovered" tag on a cell.** §6.2 tracks `recovered`, but §6.3 has no string for it. A recovered cell looks like any other shown clue, which wastes the payoff of the recovery minigame. Add "recovered" as a tag next to the clue, with the words included in the cell's aria label.
7. **Verdict replaces the mark control** (see Style choices). Change §6.4's "mark control is disabled with 'Verdict given'" to "the verdict box replaces the mark control, followed by 'Verdict given. Your note: …'".
8. **Phone length.** At 390 px the profile card is about two screens long, because there are 12 count rows, before the first suspect appears. Consider showing the counts as a `<details>` that starts open on wide screens and closed under 700 px, with the summary "Clue counts (12)". The proposed "still hidden" line from point 1 stays outside the `<details>` so it is always visible.
9. **Small text fixes:**
   - The §6.3 count line ends "…in this case, 0 found". It reads more easily as "1 in this case, none found yet". Optional.
   - The fixed line "You had not ruled them out: <label>, from <place>, did" reads awkwardly on screen. Suggested: "This would have ruled them out: <label>, from <place>."

## Placeholders I made up

The suspects' first names and roles, the clue labels (for example "archive visitor pass"), the debrief `closingLine`, and the toast styling. None of them come from the plan. The labels pass §3.11: none of the banned terms are used.
