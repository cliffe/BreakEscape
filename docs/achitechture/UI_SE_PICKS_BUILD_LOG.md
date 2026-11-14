# UI social engineering wording picks build log

Two small UI wording changes the user picked on 2026-11-15, built on branch
`build/ui-se-picks` from main `d69c29089`, in the worktree
`.claude/worktrees/p-ui-se-picks`.

## C-PP3 (option B): drop the orange readiness line on the "Prepare the call" card

The orange `.pretext-readiness` paragraph restated the disabled readiness
buttons run together on one line ("Team: nothing held yet Intern: nothing held
yet"), so it read like an error.

Working out from the code: `_cardBlock` renders a disabled button for every
fact in `facts` (the loop over `facts`, no filter), and an empty fact's button
text is exactly `` `${label}: nothing held yet` ``. `readinessLines(facts, options)`
returns one entry per fact with no held option, each the identical
`` `${label}: nothing held yet` `` string. Both were given the same `facts`
(`this.facts()`). So the orange line only ever duplicated the set of disabled
buttons; it never named a gap the buttons did not already show. It adds nothing,
so it is removed (not conditionally hidden).

Changes:
- `public/break_escape/js/minigames/pretext-prep/pretext-prep-minigame.js`
  - import list (was line 27): drop `readinessLines`.
  - `render()` (was line 126): drop `const ready = readinessLines(facts, options);`.
  - `render()` (was line 151) and `_cardBlock` signature (was line 211): drop the `ready` argument/param.
  - `_cardBlock` (was lines 240-244): remove the `if (ready.length) { ... '.pretext-readiness' ... }` block; a comment records why.
- `public/break_escape/js/minigames/pretext-prep/pretext-card.js`: remove the now-unused `readinessLines` export (it fed only this line and its own unit test).
- `public/break_escape/css/pretext-prep-minigame.css`: drop the dead `.pretext-readiness` selector from the two rules that listed it.

The disabled button remains the single place each gap is named. The separate
"This call has no contact." gate line is unrelated and unchanged.

## C-PV1 (option C): switch state pill reads Exposed / Closed

On the privacy panel the state pill read "Open" (setting still open) or "Tight"
(tightened). Against the label (which names the tightened target) and the red
"Still visible" note, "Open" looked like it contradicted them. The pill now
reads "Exposed" / "Closed", which agrees with the red note and with the fact
pill ("Closed"). The switch labels and the red note are unchanged.

Change:
- `public/break_escape/js/minigames/privacy-panel/privacy-model.js` `DEFAULT_TEXT`:
  `switchOpen: 'Open' -> 'Exposed'`, `switchTight: 'Tight' -> 'Closed'`.

These are overridable per scenario via `privacyPanel.strings`. No scenario
authors `switchOpen`/`switchTight`, so no scenario needs an edit: unoverridden
panels pick up the new words, overridden ones keep their own. The note prefix
`leaveOff: 'Leave this off: '` is left as the user asked (it already did not use
the pill's vocabulary, so the change introduces no new inconsistency).

## Tests

Node tests, run one at a time with plain `node test/js/<file>.test.mjs`.

- `test/js/social-privacy-panel.test.mjs`: added a test asserting the switch
  pill reads "Exposed" when open and "Closed" after a tighten (C-PV1). 18 pass.
- `test/js/social-pretext-prep.test.mjs`: the E3 N4 test now asserts
  `.pretext-readiness` is absent (C-PP3), keeping the existing check that the
  disabled button still names the gap. 18 pass.
- `test/js/social-reuse-pretext.test.mjs`: dropped the direct `readinessLines`
  unit assertion and its import (function removed). 4 pass.

Every test file that reads a changed module was run and passes:
social-pretext-prep (18), social-reuse-pretext (4), social-privacy-panel (18),
social-feed (23), minigame-se-close (13), exercise-station (14),
validator-social-followups (11), social-lab-dev-call (5),
pretext-debrief-labels (5).

Mutation checks (both new assertions catch their bug):
- C-PV1: reverting `switchOpen` to 'Open' -> the new pill test fails
  (`'Open' !== 'Exposed'`).
- C-PP3: re-adding a `.pretext-readiness` element -> the E3 N4 null assertion fails.

## Live check

Keyless servers from the worktree on :3440 (after) and from the main checkout
(HEAD d69c, before) on :3441. Fresh games from
`tools/playtest/new-game.rb`: lab_social_engineering = 4313,
ca14_social_media = 4314. The two scenes were rendered with real data via the
critique's params (`params.json`: pretext-prep callId service_desk_call / npc
dev; privacy-panel the ca14-style config). Shots at 1400x1000 and 390x844 into
the scratchpad `se-picks/before` and `se-picks/after`. Confirmed by eye:
the orange line present before and gone after; the pill "Open" before, "Exposed"
after, agreeing with the red note; frames wrap content at both sizes, nothing
clipped.
