# OPS_REALISM_SKIN_PLAN review R7 (delta of 84afc0be7..01958de08, Sonnet)

Plan: `docs/achitechture/OPS_REALISM_SKIN_PLAN.md` (line numbers are the current file). Answers `OPS_REALISM_SKIN_R6.md` and the "R6 fixes" section of `OPS_REALISM_SKIN_DECISIONS.md`.

**Result: two major, four minor, two nit. No blocker.** Every R6 finding is addressed in the text (table below). The two majors are in the new send-time printing rule: it has no trigger mechanism and leaves the Terminal log in a bad state after a skin switch, and the "network failure" branch has no defined signal. No real tool name, flag, port or protocol word appears in the listed lines.

## R6 resolution

| R6 | Status | Where |
|---|---|---|
| M1 | Resolved in text (rule: lines on send, table after answer, one failure line, switch shows own waiting state, answer renders once). Gaps remain: see M1, M2 below | 43-49, 433-461, 736-742, 696 |
| m1 | Resolved: lines listed per verb (450-456), deny-list test in 696. Weaknesses: m1 below | 450-461, 696 |
| m2 | Resolved: row at 523 (2px border, GNF label, stepped fill, static under reduced motion, `role="progressbar"` no value, `aria-busy`, no new palette) | 523 |
| m3 | Resolved: bar in K2 row 153 and `network-view-panels.test.mjs` row 694. Small gaps: m3 below | 153, 694 |
| n1, n2 | Resolved | 44-47, 57-58 |

## Consistency checks that passed

- One request, one answer: lines 434-445 say the output is drawn, never requested, chosen by verb alone, no timer past the request's own wait. The `{target}` rule means no answer field can leak into lines printed before the answer exists. Consistent with the pending guard (317-326) and one-request-per-action in both looks.
- The result table follows the answer (437, 696, 740). Scrollback: lines stay (437, 696, 740).
- Listed lines (452-453): `Pingweave (simulated)`, `Portlark (simulated)` and the generic sentences hold no digit, flag, real tool, port number or protocol word. The deny-list test would catch a digit, `-` flag, the nine protocol/tool words listed and the 15 named tools. It would not catch the gaps in m1.
- Pixel-art rule: 2px border, GNF label, no radius, `steps()` fill, reduced-motion static state, existing colours only (523). Compliant. The test at 694 asserts no radius and a 2px border.
- New code items with rows: bar (153, 694), `SCAN_FAILED_TEXT` (473, 696), `SCAN_OUTPUT_TEXT` (473, 696), Terminal-only text list (473). Covered.

## Findings

### Major

**M1. Send-time printing has no trigger, and a skin switch leaves the Terminal log wrong (lines 317-326, 433-445, 736-742).**
The plan says the Terminal "prints its fixed scan lines as soon as the request is sent" and that a Terminal mounted mid-request "shows the scan lines" as its waiting state. The only mechanism the plan has is the scene redrawing the mounted renderer when the pending set changes (319-322), and a redraw is not an event: printing from `render` would repeat the lines on every refetch or redraw. Three cases are undefined:
1. Press in Terminal, switch to Panels, switch back while still pending. The log already holds the lines (the log persists per foothold, 363-365); "shows its own waiting state" on mount would print them a second time.
2. Press in Terminal, switch to Panels, the answer lands in Panels, switch back. The Terminal log ends on "Sweep sent. Waiting for the answer." with no table and no failure line, forever. The answer "renders once, in whichever skin is showing" (440), so the Terminal never gets it.
3. Press in Panels, switch to Terminal while pending. Lines must print once on mount, then the answer lands. Not stated whether they print at all (the request was not sent from the Terminal).
Also unstated: a press the guard rejects (pending key already in set) must print no lines.
Fix: make printing event-driven and independent of mount. (a) The scene calls one `onSent(offer)` hook on the log owner exactly once, from `perform` after the guard accepts, never from `render` and never when the guard rejects. (b) The Terminal log (the module variable of 363-365) is written by a pure `recordSent` / `recordResult` pair in `terminal-format.js` that the scene calls for every sweep or scan whether or not the Terminal is mounted, so the log is complete in every order of switches; Panels draws its own result from the same call. (c) A mount while a key is pending only redraws; it prints nothing new. Then say that line 440 "renders once" means the log gets the table once and Panels draw their result once. Add to the tests at 696 and 738-742: the three orders above, with the lines counted once and a table or failure line present at the end in each.

**M2. The "network failure" branch has no defined signal, and the failure line sits wrongly beside a refusal (lines 438-439, 458-459, 696).**
`SCAN_FAILED_TEXT` prints "on a refusal or a network failure". The plan defines `showResult(offer, answer)` for answers and refusals (329, 342-343) but nowhere what a network failure or a thrown request passes to it, what Panels draw for it (parity: "both skins end on the same answer", 444), or that the pending key is cleared (the core clears it "until the answer or an error arrives", 313, but the bar test at 694 only mentions "the answer lands or the request is refused", not an error). Also "No answer. The scan did not finish." followed by the refusal words (459) is contradictory for a refusal: a refusal is an answer, and the line says there was none; it also says "scan" after a sweep.
Fix: (a) Say that a failed request reaches `showResult` as `answer = null` (or the core's error shape, cite the core line) and that Panels show the core's existing failure text for it, which the Terminal reuses unchanged; if the core has none, name the constant and add it to `view-texts.js` so both skins print the same words. (b) Print `SCAN_FAILED_TEXT` for a network failure only, with wording that fits both verbs, for example `No reply came back. Nothing finished.` (no digits). A refusal prints only the refusal words (the table at 431 already covers it) and, if the player should see that the request ended, one neutral closing line is not needed because the refusal words do it. (c) Add the error path to the bar test (bar removed after a failure) and to the pending-set clear test.

### Minor

**m1. The deny-list test is weaker than the plan implies (lines 450-461, 696).**
(a) The digit rule would fail on the substituted `{target}` (ids like `files01`, `fin_pc01` hold digits); the test must check the templates with `{target}` removed, and must say so. (b) `Pingweave` and `Portlark` start with the real words "ping" and "port", which the 450 text says the lines must not hold ("no ... port, protocol, real tool name") and which the deny list does not include. Either rename (for example a name with no tool or protocol stem) or drop the claim and list `ping` and `port` as allowed stems; do not leave the rule and the content disagreeing. (c) The deny list is a blacklist: it cannot catch a new real tool. Fix: add a snapshot assertion that `SCAN_OUTPUT_TEXT` and `SCAN_FAILED_TEXT` equal the lists in the plan (so any edit needs a plan edit), and widen the denied words to at least `ping`, `traceroute`, `telnet`, `dns`, `rdp`, `arp`, `nc`, `nessus`, `openvas`, `curl`, `wget`, `tcpdump`, and a `--` token.

**m2. `{target}` is "the id the player pressed or typed" (lines 444-445, 696).**
A typed target can be a prefix or alias; if the raw text is substituted, hostile input reaches the log through a path other than the "nearest verb" echo. Fix: substitute only the resolved id from the view (the lookup of the grammar test, line 695), set as plain text, and add a hostile-input case to the format test: a typed line with markup or a 10,000 character target that resolves to nothing sends no request and prints no scan lines.

**m3. The bar's build and test rows miss a few places (lines 153, 523, 694, 995, 823-829).**
(a) The bar's CSS file is unnamed; the K2 stage row at 995 lists only "the rules in `network-view-minigame.css`" under the Terminal. Say the bar's rules go in the same file and are in the K2 row. (b) The "Scanning" label's source constant is not named; K1 moved fixed texts to `view-texts.js` (153), and `PANELS_ONLY_TEXT` is a test-file list (828): put the label in `view-texts.js` and let the test list import it. (c) "Under reduced motion the bar has no animation" (694) cannot be checked in a DOM node test; specify it as a CSS-text assertion on the `@media (prefers-reduced-motion: reduce)` block, and add the reduced-motion state to the screenshot set at 976. (d) Add the 100% case: a refusal and an error each clear the bar (see M2).

**m4. Echo lines and the opening of the scan output (lines 325, 434-437).**
A typed `sweep` echoes the player's line (the log prints the player's own echoed line, 473), a quick-command press may or may not. Line 325 says a result prints "with no echo line"; the scan lines are printed at send time and are not a result. Say whether a quick-command press echoes `> sweep lan_a` before the lines (for parity with typed lines, it should), so the log reads the same from either input. Add one case to the format test.

### Nit

**n1. Line 523** calls the bar the "`.minigame-button` look". It is not a button; say "the same 2px border and square ends as `.minigame-button`".
**n2. Line 453** "Knocking on the usual doors ..." alludes to a real technique. Harmless, but "Trying the usual routes ..." reads as plainly simulated and drops the allusion.
