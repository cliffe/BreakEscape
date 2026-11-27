# m08 office-life build review, round 2

B 0 / M 0 / m 0 (4 nits, not counted)

Scope: commit 7233381ba on plan/ol-m08, delta over a055c3d5f. Three files changed: BUILD_REPORT.md (+7), BUILD_REVIEW_R1.md (new), scenario.json.erb (1 line).

## Checks

### 1. "Notes after build review round 1" against the report body: accurate

- Test 7 note: the body says no null `currentPlayerRoom` frame in any pair and six north plus five south stops, none roomless. The note's "eleven doorway stops" matches (6 + 5). "The previous bed plays until the room switches" matches the body's N and S rows. The note claims no figure the body lacks: no frame counts, no crossfade duration, no volume ramp. The pass-on-intent wording matches the body's own flag.
- Bark delay note: it claims no measurement. It says 3500 is the configured `delayMs` and 6.1 s is the walk-inclusive gap, which is what the body holds (6.1 s, 2 s settle, walk).
- Toast note: says "not tested live", which the body supports (bubble case only).
- Test 8 note: the body says "skipped this time, by instruction"; the note adds a reason (lock/key diff empty, no gating effect) that follows from body lines 2a and the lab-sheet line. No measurement is added.

### 2. Cited tests: exist and cover the claims

- test/js/room-tone.test.mjs:56-68 is the test "with roomTone: a null room keeps the bed; ..." and line 68 asserts `chooseAmbient(...null...)` deep-equals `{ keep: true }`. Covers the `keep` branch.
- test/js/ux-bark-bubbles.test.mjs:103-107 is the start of the `routeBark` test; line 106 (out of view gives toast) and 107 (dark gives toast) are inside the range. Covers the routing decision only.

### 3. ERB comment indent: rendered JSON unchanged

`git diff` of scenario.json.erb is one line: the `<%# ... %>` comment gains two leading spaces. An ERB comment emits nothing, so the change can only alter whitespace between the preceding `"lighting"` line and `"roomTone"`, outside any string. Validator run on the new file: `Result: 0 errors (0 known), 4 warnings`, the 4 warnings as in R1 (plus the 21 listed suggestions and the legacy desk-box info line, unchanged). Plain `erb` cannot render this file (needs the scenario helpers), so I did not diff rendered text; the validator render and parse succeeded. Worktree is clean after the validator run (it regenerates dungeon_graph files, identical to those tracked).

### 4. Nothing else changed

`git show --stat` lists only the three files above. No engine, test or ink file touched.

## Nits (not counted)

- The note says `currentPlayerRoom` "was never null in four crossings and eleven doorway stops" for the N/S doorways. The body's four crossings are four pairs, two of them E/W. The N/S evidence is the eleven stops plus two N/S pairs. Wording could read "four crossings (two N/S) and eleven stops".
- The body's Bark section still says "about 3.5 s after the room change" with the 6.1 s figure in brackets, while the note says the 3.5 s is configured, not measured. The note corrects it, but the body line still reads as a measurement. One-word edit if wanted ("configured 3.5 s").
- Test 8 "skipped by the orchestrator": the body says only "by instruction", so the decider named in the note is not backed by the body. Harmless, but an assumption.
- The toast note cites 103-107, which covers routing only. The rendered toast text and the spent key are not covered by that range (the toast text is asserted at lines 114-129, outside the cited range, and the spent key is not unit-tested at all). R1 accepted the routing citation, so this is not a finding.

## Verdict

Clean. The R1 outcome notes are accurate and claim nothing the body does not hold, the cited tests exist and cover what they are cited for, the ERB change is whitespace-only with validator output unchanged (0 errors, same 4 warnings), and nothing else moved. Ready to train.

## Outcomes

Clean. Nits 1 and 4 fixed in BUILD_REPORT.md; nits 2 and 3 are covered by the round 1 notes.
