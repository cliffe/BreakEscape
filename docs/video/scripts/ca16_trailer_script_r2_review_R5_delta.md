# ca16 trailer script r2: review R5 (final delta, sell/truth and timing together)

Script: `docs/video/scripts/ca16_trailer_script_r2.md`, "rev R4", 677d809c9 (72.4 s). Delta read: `git diff b60872778 677d809c9`, the R4 dispositions table and `ca16_trailer_script_r2_review_R4_delta.md` (9423608ae). Reviewer: Sonnet. 27 Nov 2026. Review only, the script is not edited.
Method: code read in `public/break_escape/js/minigames/concern-form/concern-form-minigame.js`, `scenarios/ca16_insider_risk/scenario.json.erb`, `tools/video/takes/ca16/t04_concern_form.mjs`, `tools/video/remotion/src/components/CaSeats.tsx`, `src/ca.tsx`, `scripts/lint-edit.mjs`, `tests/ca-breaks.test.mjs`. Lint run for real (below). Caption text widths measured with PIL on the shipped Source Sans 3 latin woff2. No frames viewed, no renders.

**Totals: 0 Blocker, 0 Major, 1 Minor.**

## R4 findings: applied correctly?

| R4 | Result | Evidence |
|---|---|---|
| R-m1 injected stylesheet | Applied, verified in code | Every pick runs `_toggle`, then `_showStep('build')` (`concern-form-minigame.js:314`), which empties `stageEl` and re-renders (`:117`). A `<style>` added to the page with `page.addStyleTag` lives in `document.head`, outside `stageEl`, so it survives every rebuild; per-element styles would not. `t04` already does it this way (`t04_concern_form.mjs:17`, `.cf-conclusions{display:none !important}` etc.). Selectors all exist: `.cf-group[data-kind]` set at `:174-175` (values `what`, `when`, `where`, `who` match config `scenario.json.erb:557-573`), `.cf-group.cf-conclusions` with no `data-kind` (`:188`), `button.cf-chip[data-chip=<id>]` (`:253`), `.cf-report` (`:263`), `.cf-check` (`:209`). `fc_care_who` sits in the Who group (hidden whole), `fc_care_what` in the What group (own rule), so What shows `fc_offer_what` alone and Where `fc_offer_where` alone. `[data-chip="fc_care_what"]` would also match a report `li` of the same id, but `.cf-report` is hidden and the chip is never picked, so nothing leaks. `!important` beats the minigame CSS. Marks after the last pick plus a 0.5 s stray-chip frame check: correct, a pre-pick mark describes a DOM that is gone |
| R-m2 house rule 2.0 s | Applied | Lever paragraph, Cards note and R4 row all say house rule, lint warns below 1.5 s. `lint-edit.mjs:162` is the `at[last] + 1.5 > duration` warning, as stated. `define`: 8.5 - 6.5 = 2.0 s, no warning in the real lint run |
| R-m3 v24 break | Applied | "A leaver wants the\nclient list emailed home." is 19 / 25. Noun phrase whole, as v31. Also in the reserve table (v24 row now reads "A leaver wants\nthe list sent home." at 14 / 20, fine) |
| R-m4 dependency hash | Applied | 048d15134 named, syntax matches the code: bullet `\n` checked per line at 28 (`lint-edit.mjs:146-149`), `caption_breaks` per-shot flag with the speaker prefix counted on line 1 of the plain skin (`:266-270`). The "no speaker on the two cast-line shots" claim holds (hook, `niamh_end`). Lift: `captionTop169` returns `min(80% of h, h - 4% of h - box height)` (`CaSeats.tsx:44-47`) |

## Lint run

Throwaway edit `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca16_r5_lint.json` (not committed): the `ca_theme_demo` fixture with the `define` chapter card added (body `"Harm from people who\nalready have access"`, "Mostly accidents", "Sometimes on purpose", `reveal.at` [0.2, 5.4, 6.5], 8.5 s) and one shot carrying `caption_breaks: true`, no speaker, and all 20 forced-break captions of the script's caption list and reserve table (extracted from the script text, not retyped). Result: `lint ca16_r5_lint.json: 9 shots, 25.50 s, 0 error(s), 9 warning(s)`. The warnings are the fixture's missing takes, its 9:16 pixel scale and a missing defend chapter card, none from the script's text. Every caption and bullet line is at most 28 characters (longest: "Facts to the right person," and "Learn on Hacktivity.co.uk." at 26, "Harm from people who" 20).

## 16:9 lifted caption box against the lock icon

Hook and `niamh_end`: two lines at 1920x1080. `size` = round(1080 x 0.052) = 56; `padY` = 20; `u` = round(1080/540) = 2; height = round(2 x 56 x 1.25 + 2 x 20 + 4 x 2) = 188. `captionTop169` = min(864, 1080 - 43 - 188) = 849. Lock icon foot at output y 810 (script, from the take marks) leaves 39 px, as the script says. 1:1: bottom anchored at 5%, top 1080 - 54 - 188 = 838, as the script says. Width: the longest cast-line caption, "It won't take my password" (25 characters), measures about 614 px at 56 px with the 1.06 safety factor; the 1:1 available width is 756 - 2 x 34 - 8 = 680 px, so it stays on one line with 66 px spare. The first-render width check in the script should pass.

## Minor

**m1. The 9:16 caption top is stated as about y 1678; the same arithmetic gives 1636.** Framing row `hook`, last column (line 156): "9:16 stays at 1.125: monitor at output y 1410 to 1500, box from about 1678". In 9:16 (1080x1920) the box is bottom-anchored at 5% (96 px) and, at two lines, 188 px tall, so its top is 1920 - 96 - 188 = 1636. This is not a lift effect (the lift is 16:9 only) and was not touched in R4. The conclusion is unchanged, since the box still clears the monitor by 136 px instead of 178. Fix: write "box from about 1636" (or "about 1640"), and optionally add "(computed)". Not a blocker.

## What holds, so it is not reopened

The shots, cuts, gates and the 72.4 s total (no R4 change touched a number outside the caption text and the notes), the hide spec, the `define` reveal times (0.2, 5.4, 6.5), the v21 0.32 s gate, the v24 reserve (gate 0.94), the dispositions table (every R4 finding has a row with the right action), UK English and no em dashes in the R4 additions.

## Ready for owner review?

Yes. The script is ready for owner review with the one-line m1 correction optional. It has been through five rounds, the last two clean of Blocker and Major. What remains is the owner's answers to questions 1 to 9 and the first render's three checks (hook zoom 1 full frame, `.cf-root` content height, Where chip width at zoom 2).
