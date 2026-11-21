# OPS_REALISM_SKIN_PLAN review R6 (delta of 70952c6db, Sonnet)

Plan: `docs/achitechture/OPS_REALISM_SKIN_PLAN.md`. Cross-checked against `docs/achitechture/OPS_CORE_PLAN.md`.

**Result: one major, three minor, two nit. No blocker.** The skin still adds and removes no move, the removed loop features are gone, and the counts and names match the core. The major is a mechanism gap in the new scan output that the plan's own tests cannot satisfy as written.

## Checks that passed

1. No extra move. Plan lines 44-49 and 434-441: one request, one answer, output "drawn, never requested", chosen by the verb alone, no timer. Line 446 limits what the Terminal may print to constants, the answer's ids and fields, `SCAN_OUTPUT_TEXT` and the player's line. Test `network-terminal-format.test.mjs` (line 676) checks no host, port, service, product or version in the lines that the answer lacks. The table headers PORT, PRODUCT, VERSION (line 456) are filled only from the answer.
2. Leftovers: grep for evidence, probe, noise, noisy, alert, quiet, network_only finds only lines 56-57 (see nit 1). `loop` hits are unrelated (`--net-skin` text, "loop" nowhere as the removed feature).
3. Counts. Twelve codes: core `OPS_CORE_PLAN.md:988-992` lists 3 + 9 = 12, the skin says twelve at lines 112, 431, 676, 753, 1005. Eight events: skin 280 and 757-759 list `network_viewed`, `network_host_opened` plus the core's six, matching core line 113 of the skin table and core `:1639` onwards.
4. Core consistency. `window.__test.access.compromiseMarks()` exists at core `:756`; `systems/compromise-marks.js` at core `:724`; the answer shapes at skin line 112 match the core's routes (`POST /network/scan`, `/check`, `/confirm`, `/technique`, core lines 211-213).

## Findings

### Major

**M1. When and where the scan output prints is undefined, and two statements and a test disagree.**
Evidence: skin 434-436 says the Terminal prints the lines "for the same wait", i.e. while the request is out. Test 676 says the lines print "before the table of the answer", which reads as printed at answer time. Line 719 says "the test checks that both appear only while it is [out]", which cannot hold for the Terminal: log lines stay in the log (300-line log, line 373), where the Panels bar disappears. The pending mechanism at lines 317-326 only drives disabled controls; it says nothing about the Terminal reacting to `pending: true` on a sweep or scan offer, nor about a switch of skin mid-request (the Terminal "prints such a result with no echo line", line 325, so the scan lines are skipped or printed twice, undefined). A refused or `already` scan is also unstated (lines printed, then a refusal?).
Fix: state one rule. Simplest and most testable: the scan lines are printed by the Terminal's `showResult` for a sweep or service-scan answer, immediately before the answer's table, and for no other outcome (a refusal prints only its refusal words; a skin switch mid-request prints the lines when the answer lands in the Terminal). Say that Panels' bar is drawn from `pending: true` on the same offers. Reword lines 434-436 ("for the same wait") and 719 to match, and make the test assert: bar present exactly while the offer is pending; scan lines present exactly once, directly before the table, after an answer, and absent after a refusal.

### Minor

**m1. `SCAN_OUTPUT_TEXT` has no content, size or content rule in the plan.**
Evidence: the name appears at 436, 446, 455, 676, none gives a line, a count or a length. The fictional and abstract rule (brief section 2.4) can only be reviewed against the text.
Fix: list the lines in the plan (for example three to five invented banner and progress lines per verb), state that they name no tool, flag, product, version, port or protocol, and add a test that checks each line against a short deny list (real scanner and framework names, "-" flags, digits that look like a port or version, `http`, `ssh`).

**m2. The progress bar has no pixel-art spec.**
Evidence: the pixel-art table at 499-500 covers the log, prompt, quick commands and switch only; the bar (line 434) is in no row. Brief section 3 and the pixel-art UI rule need 2px borders or the `ui-themes.css` 9-slice skin, pixel fonts only, no radius.
Fix: add a row: a 2px border, square ends, a stepped (not smoothly animated) fill or a fixed indeterminate stripe with no timer-driven motion beyond the request's wait, the "Scanning" label in the GNF pixel font, `role="progressbar"` with no value (indeterminate) or `aria-busy` on the row, and a reduced-motion rule (core/skin line 404 already names one for the Terminal). Say whether it is determinate: it must not be, since no progress is known.

**m3. The bar is not placed in the build and shared-file tables.**
Evidence: the bar belongs to `network-view-panels.js` (a K1 file, line 208) and to the K2 text test list `PANELS_ONLY_TEXT` (805), but the build stage rows (153, 152) and the node tests (676 is Terminal-only) have no Panels bar test; the core plan has no bar (`OPS_CORE_PLAN.md` greps empty for "Scanning").
Fix: add the bar to the K2 Panels renderer row and add a `network-view-panels` test row: the bar shows on `pending: true` for sweep and scan offers only, on the block or host row, and is removed on the answer.

### Nit

**n1. Lines 56-57 name removed features.** "The core loop has no evidence, no noise count and no alert" will read oddly to a standalone reader who never met them. Fix: "Actions are free; the only costs are the refusals the server sends."
**n2. Line 46** "In the Terminal, the line prints" reads as a typo; say "the Terminal prints".
