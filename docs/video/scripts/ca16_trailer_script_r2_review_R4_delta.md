# ca16 trailer script r2: review R4 (delta, sell/truth and timing together)

Script: `docs/video/scripts/ca16_trailer_script_r2.md`, "rev R3", b60872778 (72.4 s). Delta read: `git diff 5578145b1 b60872778`, the R3 dispositions table and both R3 reviews. Reviewer: Sonnet. 27 Nov 2026. Review only, the script is not edited.
Method: arithmetic from the script's tables; code read in `public/break_escape/js/minigames/concern-form/concern-form-minigame.js` and `-model.js`, `public/break_escape/css/concern-form-minigame.css`, `scenarios/ca16_insider_risk/scenario.json.erb`, `tools/video/takes/ca16/t04_concern_form.mjs`, `tools/video/remotion/scripts/lint-edit.mjs`, `CaChapter.tsx`. No frames viewed, no renders.

**Totals: 0 Blocker, 0 Major, 4 Minor.**

## R3 findings: applied correctly?

| R3 | Result | Evidence |
|---|---|---|
| T-M1 hook and end captions | Applied | Both shots carry `caption_breaks: true`, no `speaker`; lines 19/14 and 25/7, 25/12 (all at most 28). The lint checks forced-break captions per line at 28 (`lint-edit.mjs:266-270`). Zoom 1 in 16:9 and 1:1, 9:16 at 1.125; the withdrawn centre-shift is not left anywhere in the Framing table |
| T-M2 definition bullet | Applied | `"Harm from people who\nalready have access"` is 20 / 19. Lint checks each forced-break line at 28 (`lint-edit.mjs:146-149`) and the 60-character warning no longer applies to it. `CaChapter.tsx:59` already carries `whiteSpace: 'pre-line'` in the working tree |
| T-m1 max clip, v20/v21 lever | Applied, recomputed | v20 5.05 s (14.4 - 0.3 - 9.05), v21 2.80 (17.5 - 0.3 - 14.4). v21 slow read 5 x 0.495 + 0.3 = 2.775, ends 17.18, gate 0.32. v20 slow end 13.81, gate 0.59 to v21. Every other "max clip" figure (v22 3.60, v23 4.70, v24 4.10, v31 3.70, v25 4.50, v26 2.70, v28 5.40, v27 4.00, v29 3.10, v30 5.20) recomputes as cut minus 0.3 minus start |
| T-m2 to T-m5 | Applied | Niamh gate 0.31 / 0.51; tally patch x 726-842, y 126-146; 1:1 inbox fallback cx 0.34375, cy 0.375; `cf-root` and `last-group-bottom` marks |
| S-m1 to S-m9 | Applied | v24 "the client list" with caption and reserve; question 9 positive reason; question 8 gains the `erb:146` quote and the v25 and beat 9 bullets; twin line numbers in row 4; row 7 added; `erb:681` cited; question 1 quotes the episode. S-m5 left to the owner as recorded |
| S-m3 form shot | Applied, see "Concern form shot" below | |

## Concern form shot (t04c / t04d)

Checked against the config and the minigame:

- Chip ids exist: `fc_offer_what` (kind `what`, `required: true`), `fc_offer_when`, `fc_offer_where`, `fc_offer_who`, `fc_care_what`, `fc_care_who` (`scenario.json.erb:554-586`).
- Hiding by selector is possible. Each fact group is `div.cf-group[data-kind="what|when|where|who"]` (`concern-form-minigame.js:174-175`); the conclusions group is `.cf-group.cf-conclusions` with no `data-kind` (`:188`); chips carry `data-chip="<id>"` (`:253`); the report is `section.cf-report` (`:263`) and the button `.cf-check` (`:209`). So `.cf-group[data-kind="when"]`, `.cf-group[data-kind="who"]`, `.cf-conclusions`, `.cf-report`, `.cf-check` and `[data-chip="fc_care_what"]` cover the spec. `fc_care_who` sits in the Who group, which is hidden whole, so only `fc_care_what` needs its own rule; the What group is then `fc_offer_what` alone and the Where group `fc_offer_where` alone, as the script says.
- Picked state: `cf-on` (`:255`) draws a border, a 2 px outline and bold text (`concern-form-minigame.css:64`), so it reads without the report box. With nothing checked (`this.checked` is null after a pick, `:312`) no feedback or Done button is drawn.
- What is shown: the build heading (the game's own "What you noticed", `-model.js:41`), the "What happened" and "Where" labels, and two chips ("An unknown contact offered payment for remote access", "Through a messaging app, from the handle 'Opportunities'"). No colleague chip, no conclusion chip, no name, no advisory line, no tally. Two of four correct facts, never the set; the script's own count (`chips-visible` 2) is right. No narration sits over a verdict button, there is none on screen.
- Timing: hold 6.0 s, shot window from 0.5 s in, picks at 0.9 s and 2.5 s into the hold, so the first is picked 0.4 s into the shot and the second lands 2.0 s in, leaving 2.5 s of the shot with both showing. v27 runs 53.2 to about 56.0, the second chip lands at about 55.0. Fine.

## Timing and lint checks

- v21 start 14.4: gate to cut 0.32 s on the strict slow read, which is above 0.3. A clip of 2.30 s (estimate) ends 16.70, a gate of 0.80.
- `define` reveal: `at` = [0.2, 5.4, 6.5] on a 8.5 s card. Ascending, all below 8.5, count equals the three body lines. Last line on screen 8.5 - 6.5 = 2.0 s. The lint warns below 1.5 s (`lint-edit.mjs:162`), so 2.0 passes with 0.5 s to spare. Bullet 2 appears at 9.0 + 5.4 = 14.4, with v21's first word. Bullet 3 appears at 15.5; on a slow read "Sometimes" starts at 14.4 + 2 x 0.495 + 0.3 = 15.69, so the line is up 0.19 s before the word, inside the 0.1 to 0.3 s the script claims. On a fast read (about 0.4 s a word) "Sometimes" starts near 15.5; still fine.
- Captions: every cast and narrator caption line is at most 28 characters (longest "Learn on Hacktivity.co.uk." at 26; "Facts to the right person," 26). Chip 3 is 26, tab `YOUR CHOICES` 12, both within the lint's 28.
- Definition bullet "Harm from people who\nalready have access" reads as one idea split at a natural place, in every aspect.
- Reserves, recomputed (start + slow read, gate to the cut): v22 "A colleague wants your login." 17.7 + 2.475 = 20.18, gate 1.42; v24 "A leaver wants the list sent home." 26.9 + 3.465 = 30.37, gate 0.93 (script 0.94, rounding); v29 "The same requests come back." 57.7 + 2.475 = 60.18, gate 0.92 (script 0.93); v31 "The list has left the firm." 31.5 + 2.97 = 34.47, gate 1.03. All clear 0.3 s. Per-word maxima match (0.72, 0.59, 0.62, 0.62).
- Reserves true to the episode: v22 reserve is the Reuben ask (`erb:458`); v24 and v31 reserves match `erb:353`, `:680`; v29 reserve matches the inbox rows. v24 "A leaver wants the client list emailed home." is true: Ross is "a genuine leaver" (`erb:361`), asks for his accounts to go to a personal email (`erb:333`, `:509`), and the episode itself names the same thing the client list (`erb:353`, `:358`, `:680`). It describes the request, not intent, and does not lean to the conclusion chip "Ross is stealing the client list".
- Hard rules: no em dashes in any VO text; all VO at or under 2.3 words/s; every gate at or above 0.32 s; zoom values integer (16:9, 1:1) or 0.5625 multiples (9:16); no "Break Escape" on screen; CTA "Learn on Hacktivity.co.uk" on the plate and in v30. UK English throughout the script text.

## Minor

**m1. The hide spec for `t04c` does not say how, and every pick re-renders the panel.** `_toggle` calls `_showStep('build')` (`concern-form-minigame.js:314`), which empties the stage and rebuilds it (`:117`), so any `display: none` set on elements, or any mark taken before the first pick, is lost the moment `fc_offer_what` is clicked at 0.9 s, and the colleague chips, the When and Who groups and the report box would appear mid-shot. The existing `t04` take hides with `page.addStyleTag` and `!important` rules (`t04_concern_form.mjs:17`), which survive a re-render, and "as `t04`" probably gets that right. Say so. Fix: in the `t04c` bullet, write "hide with one injected stylesheet (as `t04`), not per-element styles, because each pick rebuilds the form", list the selectors (`.cf-group[data-kind="when"]`, `.cf-group[data-kind="who"]`, `.cf-conclusions`, `.cf-report`, `.cf-check`, `[data-chip="fc_care_what"]`), keep the `t04` rule that removes the chip focus outline (`.cf-chip:focus`), and take the `last-group-bottom`, `hidden` and `chips-visible` marks after the last pick as well as before it. Check one frame at 0.5 s into the shot for stray chips.

**m2. The script attributes a 2.0 s last-line rule to the lint.** Lines 85 and 129 say the lint rule asks for 2.0 s; the lint warns under 1.5 s (`lint-edit.mjs:162`). The brief's 2.0 s is a house rule, not the lint. The numbers still pass (2.0 s). Fix: write "the house rule of 2.0 s (the lint warns under 1.5 s)".

**m3. The caption break in v24 splits the noun phrase.** "A leaver wants the client / list emailed home." (25, 18) breaks "client list" across the lines, while the sibling v31 keeps it whole. A silent viewer reads "client" then "list". Fix: "A leaver wants / the client list emailed home." is 14 and 28, at the limit; or "A leaver wants the / client list emailed home." (19, 25). The second keeps both under 28 with the noun phrase whole.

**m4. The engine dependency still has no hash and is uncommitted.** The status block says the Remotion change is another session's commit and its hash is unknown. In this tree `lint-edit.mjs` (caption_breaks, forced-break bullets) and `CaChapter.tsx` (`pre-line`) carry the change but `git log -S caption_breaks` over `tools/video/remotion` finds nothing, so it is working-tree only. Nothing to change in the script now; before the edit list is linted or rendered, check the commit exists on the branch and record its hash, or the 16:9 hook and end captions will draw on one line and the first bullet will break the 28 rule. Not a script defect.

## What holds, so it is not reopened

The definition card, the three cases and chips, the lesson wording, v26 to v30, the no-answers reading in question 8 and its default, the 72.4 s total (3.5 + 5.5 + 8.5 + 4.1 + 5.2 + 4.5 + 4.2 + 3.4 + 5.0 + 3.2 + 5.9 + 4.5 + 3.6 + 5.6 + 5.7), and every cut and gate outside `define`. The first render is still the check for the 25-character caption width in 1:1, the zoom 1 full-frame view of the hook, and whether the long Where chip fits at zoom 2 without wrapping badly.
