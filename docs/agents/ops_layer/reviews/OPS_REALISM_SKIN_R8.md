# OPS_REALISM_SKIN_PLAN review R8 (delta of cc02ea0a5..284dda56d, Sonnet)

Plan: `docs/achitechture/OPS_REALISM_SKIN_PLAN.md` (line numbers are the current file). Answers `OPS_REALISM_SKIN_R7.md` and the "R7 fixes" section of `OPS_REALISM_SKIN_DECISIONS.md`.

**Result: 0 blocker, 0 major, 4 minor, 3 nit.** Both R7 majors are resolved in design. The remaining defects are places where the new event-driven log rule leaves an older sentence or a test row saying something else.

## R7 resolution

| R7 | Status | Where |
|---|---|---|
| M1 | Resolved: `recordSent` once from `perform` after the guard, `recordResult` once at the end, scene-owned, mount-independent; Terminal only draws; guard-rejected press calls neither; three switch orders in the test row. Residual gaps m1, m3, m4 | 325-327, 441-473, 729, 770-777 |
| M2 | Resolved: failure is `answer = null`; `REQUEST_FAILED_TEXT` in `view-texts.js`; refusal prints only its own words; three endings clear the key and bar (bar test, 727). Residual gap m2 | 456-466, 727 |
| m1 | Resolved: templates tested with `{target}` removed, wider deny list, snapshot assertion, names changed to Echoreel and Lookmark | 483-492, 729 |
| m2 | Resolved: resolved id only, plain text, hostile-input case | 478-481, 729 |
| m3 | Resolved: CSS file named, `SCANNING_TEXT` in `view-texts.js`, reduced motion as a CSS-text assertion, screenshot added | 153, 1031, 727, 862 |
| m4 | Resolved in text (echo `> sweep <id>` from every input). See m1 for the leftover | 451-454, 729 |
| n1, n2 | Resolved | |

## Checks that passed

- No clash for `REQUEST_FAILED_TEXT`: the string and the name appear in no other plan under `docs/`. It differs from the unplug line at `NV:850` ("The port did not respond. Try again."), which `unplugBox` keeps (see m2 for the one place they meet).
- `SCAN_FAILED_TEXT` is gone everywhere (grep: no hits). `REQUEST_FAILED_TEXT` is in the 5.3 may-print list (496), the deny list and snapshot (729), and the K2 and stage rows (153, 1031).
- The fictional names and lines (`Echoreel`, `Lookmark`, "Sweeping {target} for live hosts", "Trying the usual routes ...", "No reply came back. Nothing finished.") hold no digit, flag, port number, protocol word or tool name, and pass the widened deny list as written (short words are whole-word matches, so "Sweeping" does not trip `ping`).
- Three switch orders, guard-rejected press, hostile typed line, refusal-only words, failure line and the three bar-clearing endings each have a named test case that a node harness can run.
- Every new item has a build row: the two functions and `network-view-terminal.js` (1031), the bar rules and the reduced-motion block in `network-view-minigame.css` (153, 1031), `SCANNING_TEXT` and `REQUEST_FAILED_TEXT` (153, 1031).

## Findings

### Minor

**m1. The echo and the table each have two writers in the text (lines 325, 380, 390, 441-455, 834-836).**
New rule (441-455): the scene's `recordSent` writes the echo and `recordResult` writes the table, and "the Terminal renderer only draws the log". Older sentences still give the renderer the job: "Enter runs the line" (380), "Pressing a button writes its line to the log and performs its offer" (390), and "the Terminal prints such a result with no echo line before it" (325), which reads as the Terminal's `showResult` printing the result. Taken literally an implementer writes the echo twice (renderer and `recordSent`) and the table twice (Terminal `showResult` and `recordResult`). The unguarded verbs (`help`, `show`, `observe`, `sign-in`, an unknown word, a "Still waiting" reply) never reach `recordSent`, so some echo writer must exist outside the scene; the plan does not say which line goes through which path.
Fix: add one sentence to 5.3: for a guarded request the echo is written only by `recordSent` and the result only by `recordResult`; for a local line (including a rejected press and any message line) the renderer writes the echo and its reply through the same log helper. Make the Terminal's `showResult` a redraw-and-scroll with no log write. Reword 325 to "the log already holds the echo (written when the press was sent) and the result lines (written by `recordResult`)", and 390 to say the button press hands its line to `perform` as the echo. In test 9 (834-836) say "less the echo and the `SCAN_OUTPUT_TEXT` lines", since `recordSent` now adds those at send time, before `showResult`.

**m2. A failed unplug prints different words in the two skins (lines 456-466, 332-336, 727; `NV:848-850`).**
`recordResult` covers every guarded request, `unplug` among them, and a failure is `answer = null`, so the Terminal prints `REQUEST_FAILED_TEXT`. Panels' unplug path draws `setUnplugNotice(out?.message || 'The port did not respond. Try again.')`, which `unplugBox` keeps (460). The plan says Panels draw `REQUEST_FAILED_TEXT` "as the notice on the control's row", but the unplug button has no row; it has the header notice. For a null unplug answer the two skins differ, and test 9 never exercises it (its unplug step is "held and then refused", 828-830). Today the same code also throws through `finally` on a thrown request without ever setting the notice.
Fix: pick one. Either unplug failure uses `REQUEST_FAILED_TEXT` in both skins (the `NV:850` fallback becomes that constant, and `unplugBox` calls `setUnplugNotice` on a thrown request too), or the `NV:850` sentence moves to `view-texts.js` as `UNPLUG_FAILED_TEXT` and both skins print it for a null unplug answer. Add a null-answer step for each of `sweep`, `check`, `confirm`, `use` and `unplug` to test 9, so the failure words are compared at the step.

**m3. Where `recordResult` runs relative to the clear, `showResult` and a dead trip is unstated (lines 441-447, 456-466).**
`recordSent` has a fixed place ("after the guard has accepted, before the request goes out"). `recordResult` has only "when the request ends". Three things follow from a missing place: (a) the plan says "exactly once" but a request that throws, and the unplug that ends the trip (`complete(false)` before the notice), can skip or double it unless it is in one `finally`-shaped path with the key clear; (b) the order of `recordResult`, `showResult`, the clear and the refetch decides whether a redraw triggered by the clear sees the new lines; (c) after the trip has ended the log is dropped (376), and a late `recordResult` on a dropped log would recreate an entry keyed by the old foothold.
Fix: in 5.3 say that `perform` ends in one place: `recordResult`, then `showResult`, then the key clear (which redraws), in that order, on the answer, refusal and failure paths alike; and that both functions do nothing when the foothold's log is gone (trip ended). Add to the format test: a late `recordResult` after the trip ends writes nothing and leaves no log entry.

**m4. The switch-order tests sit in a pure-function test file (lines 729, 770-777).**
`network-terminal-format.test.mjs` is the format test over pure functions, but the three switch orders need the scene, both renderers, a held fake answer and a mount, which is the parity harness (`network-skin-parity.test.mjs`, 10). The build rows list format tests and parity tests together (1031), so nothing is unbuilt, but a reader will put the orders in the wrong file and the pure file would need a DOM.
Fix: keep in the format test the pure cases (what `recordSent` and `recordResult` write for each verb, answer, refusal and null; target handling; hostile input; deny list and snapshot), and move the three orders, the mount-adds-no-line check and the guard-rejected check to `network-skin-parity.test.mjs` by name, with the same wording.

### Nit

**n1. Line 485** ("start with or contain no real tool name or word for a scanning technique") is garbled by the edit; reads as a double negative. Say "and read as plainly simulated: none starts with or contains a real tool name or a real word for a scanning technique". (`sweep` and `scan` are the game's own verbs and are allowed.)

**n2. Line 505** puts a parenthetical about `REQUEST_FAILED_TEXT` inside a table cell that lists Terminal-only text. State it once under the table instead ("`REQUEST_FAILED_TEXT` is shared and is not on this list"), so the cell is a clean list the test can import.

**n3. Log creation is not stated (line 376).** The log is a module variable keyed by foothold id that the scene now writes even if the Terminal never mounts. Say who creates it (the first `recordSent`, or the scene at trip start) and that it holds the 300-line cap and the opening line from creation, so a first Terminal mount after Panels-only play shows "Type help ..." followed by the earlier echoes and results in order.
