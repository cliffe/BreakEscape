# m10 office life: build review R5 (delta, closing round)

Scope: `git diff a6738ecfa a18be8bfb` (BUILD_REVIEW_R4, LIVE_B2D check D rerun, DIALOG_REVIEW_R2 and the Sofia opener fix). Worktree p-ol-m10, branch build/ol-m10, head a18be8bfb. Read-only; no server or game run.

**Counts: B 0, M 0, m 3.**

## Findings

| # | Sev | File:line | Evidence | Fix |
|---|---|---|---|---|
| 1 | m | office_life/LIVE_B2D.md:12 (and :99) | The Summary row for check D still reads "PUNCH PASS, CREDITS NOT CAPTURED: the browser closed...", but the rerun at :87-99 now gives a PASS from `window.endingReplayOptions(window.gameScenario)`. The file contradicts itself. The rerun's own verdict is "line was not seen on screen in this run". | Change row D to "PUNCH PASS; CREDITS CLAUSE PASS via engine replay builder on live globals (game 8125), not seen on screen", and keep the caveat in the Open items. |
| 2 | m | ink/m10_fp_support.ink:45 and :48 | New opener "Cold out here, and we're out of sugar." is followed, on the first choice, by "Cold and tired, but fed. One out of three's not bad." Two adjacent Sofia lines open with "Cold". | Reword one. Cheapest: opener "Bitter out here, and we're out of sugar." (39), or reply "Tired, but fed. One out of three's not bad." (42; ink conversation lines carry no 40 cap). Then update SPOKEN_LINES.md:10 or :11 and DIALOGUE_SAMPLE.md:24 or :25. |
| 3 | m | ink/m10_fp_support.ink:54 | "I'll keep one warm for you." lost its antecedent: the old opener offered tea/kettle, the new one has no cup in it, so "one" now reads as "one what?". Also still plays after `fp_staff_upset` when the kettle is off (R2 left it, as it only follows a refusal). Not a rule break. | If touched: "I'll keep a cup warm for you." (28), or leave and accept. Spoken-line files would change with it. |

## Check 1: the ink line

- **Reads in its knot.** `talk_sofia` (:41-51) prints the opener unless `sofia_quiet`, then the two choices; a weather-and-supplies remark followed by "How's the post holding up?" works.
- **No repeats.** Grep of the m10 ink folder for "out of sugar" and "Cold out here" hits only m10_fp_support.ink:45. "Kettle's on" no longer appears on Sofia's side (Darren's :61 only). The "Cold" echo within the knot is finding 2.
- **Content rules.** 38 characters; no team member, sleeper, kit, code, flag, clue time or movement; UK English; no em or en dash anywhere in the ink, SPOKEN_LINES.md or DIALOGUE_SAMPLE.md (grep); no digits or symbols, so sayable by TTS.
- **Compile.** `bin/inklecate` on m10_fp_support.ink to the scratchpad: exit 0; JSON parsed and compared with the committed m10_fp_support.json: identical.

## Check 2: spoken-line files

- All 16 ink lines in SPOKEN_LINES.md (:27, :30, :36, :45, :48, :54, :61-64, :69-71, :76-78) checked by script against the ink: line number, speaker, text and character count all match.
- The 8 pool lines match scenario.json.erb:2636 (Darren) and :2670 (Sofia), text and order; lengths in the table are within 40.
- The 5 credits entries match the table's refs: erb 982/987/995/1000/1004 and 1147/1152/1160/1165/1169, credits_sections.json 96/101/109/114/118 and 261/266/274/279/283, all with identical text.
- DIALOGUE_SAMPLE.md matches the ink, pool and credits text line for line, including the changed opener. No stale "Kettle's on, for all the good it does" remains anywhere (grep; it survives only inside the R1/R2 review history).

## Check 3: is the check D method adequate for a credits clause?

Adequate for what it claims, not for "shown on screen". `endingReplayOptions` (public/break_escape/js/music/scenario-music-events.js:67) runs the same `replayEndingEntry` and condition evaluator over the saved globals, and the reload path feeds its output straight to `BondVisualiser.open` (objectives-manager.js:1475). So it proves the clause chosen for `fp_staff_upset` true, `fp_sofia_ko` false, and its order (4th, after Darren). It does not prove the live ending path (the music event fired at the ending, a separate call) picks the same entry, nor that the text renders (wrap, truncation, timing). Mitigations: the same renderer showed the DARREN line live in B2c and the plain Sofia line in the B2d check C recording, and both paths read one `credits_sections` source. Stand-in flags were used for the ending, but the clause inputs were real. For a stronger proof (optional, not blocking): install a recorder before "End the mission now" (a MutationObserver on the credits container, or a wrapper on `BondVisualiser.open` that stores `opts.credits`), then play the ending in a game with the punch done and assert the stored array contains the Sofia upset text. That covers the live path without relying on the crash-prone on-screen capture. Wording in LIVE_B2D should say "builder on live globals", which it does at :87 and :99; only the Summary row (finding 1) lags.

## Not flagged

No scenario, engine, lock, flag or mapping change in the delta; VM flags stay required. R2's finding is closed by the opener fix.
