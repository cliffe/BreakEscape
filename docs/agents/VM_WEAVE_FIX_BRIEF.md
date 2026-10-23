# VM weave fixes — shared brief (2026-10-23)

Source: `scenarios/VM_INTEGRATION_REVIEW.md` (commit bbc7e25c6), section "Ranked recommended changes" R1–R39. The user approved **all of them except R10** (2026-10-23). Read the review's row for each item you own before starting.

Repo: /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape (shared tree; other sessions edit it). SecGen: /home/cliffe/Files/Projects/Code/SecGen.
Scratchpad root: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/98239259-d4cb-4c96-b1e0-dec3f5568942/scratchpad/vmreview — write helper files only in your own subfolder `fix-<you>/`.

## Hard rules (user, 2026-10-23)
- H1: for m01–m10 the VM is on the critical path; the mission must not complete without the VM flags. Never add a route that skips them.
- H2: the VM is well integrated and diegetic. m01 is the good-practice example.
- A player must never be able to hold a flag they can't yet submit (newer missions m09/m10 must meet this; shipped m01–m08 are not hard-retrofitted, decision F20).
- Each VM step should need information found in the game. **Network segmentation is not the fix** (user rule); gate by an in-game find instead.

## Deployment context
Focus on the **Hacktivity deployment**, where Hacktivity integrates the VM (console in the Hacktivity page). Standalone is a valid way to test or try the game and must keep working, but don't build features only for it. R10 (standalone launcher/station blurbs) is dropped for that reason. Hacktivity repo (/home/cliffe/Files/Projects/Code/Hacktivity) is read-only for this work; any change there goes to the user first.

## Engine contract (fixed now so mission and engine work run in parallel)
- **R1 reward labels:** any reward object in `flagRewards` (and similar reward lists) may carry `"label": "<in-world text>"`. The station shows the label instead of "Event triggered" / "Door unlocked: <room id>". No label → current text.
- **R8 VM display names:** a flag-station object may carry `"acceptsVmLabels": { "<vm id>": "<in-world name>" }`. Badges show the label; no entry → raw id.
- **R9 failed flags:** the station emits `flag_rejected` with `{ stationId, reason }` (reason: `invalid`, `wrong_station`, `already_submitted`). When the flag belongs to another station the player has discovered, the refusal names that station (its object name). Missions may map `flag_rejected` to a reaction but need not.
- **R7:** a hint-only / wrong-station response is shown in neutral info styling with a soft sound, never the success tick.

## Content rules
- Opus 5.5 (general-purpose) agents do not open SecGen XML, `secgen/`, `secgen_review/`, `VM_INTEGRATION.md`, `build_evidence/`, `*VM_ANSWERS*`, lab sheets, or the four exploit field guides (distcc-exploitation, proftpd-exploitation-workflow, scanning-and-exploitation, privilege-escalation). **All SecGen edits go to `opus48` agents.**
- Game text stays at concept level: name the service or weakness, no commands.
- UK English, "Cyber Security" as two words, plain prose, HaX's established voice.

## Spoken lines cost money
Every voiced line you change or add: record old → new in your report (file:line). Don't generate audio. No printed variables in voiced lines. m01's audio is cached: keep m01 voiced-line changes to the minimum the item needs.

## Checks before handing back (mission work)
- Recompile changed ink (see README_ink_best_practices.md / existing tooling); `ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb --no-graph` clean of new errors; `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<m>/`; `node scripts/ink_runtime_check/tagdiff.mjs` against HEAD for every changed ink file, every changed tag/knot/variable explained.
- Shared tree: never `git stash`/`checkout --`/`reset`. Re-read a file just before editing it. Don't commit; the orchestrator commits by explicit paths.

## Ownership
| Agent | Model | Items |
|---|---|---|
| engine | Opus | R1, R7, R8, R9, R13, R14 engine; R29 validator assertion; R35 Hacktivity read-only check |
| m01–m03 | opus48 | R11 (m01–m03), R29 (m01 gate), R36 (m01), R6, R18 (m02), R17, R23 (m03); R1/R8 data for these missions |
| m04–m06 | opus48 | R3, R36 (m04), R19, R24 (m05), R2, R12 (m06); R1/R8 data |
| m07–m08 | opus48 | R4, R5, R11, R25, R26 (m07), R15, R16, R20 (m08, with the VM agent's reconciled names); R1/R8 data |
| m09–m10 game | opus48 | R36, R38, R39 (m10), R36 (m09), game side of R31/R34/R35/R37; R1/R8 data |
| VM m04+m08 | opus48 | R27 (m04), R21, R22 (m08) in SecGen |
| VM m09 | opus48 | R31 (gate by in-game find, not network), R33, R34, R37 in SecGen |
| VM m10 | opus48 | R30, R32, R34, R37 in SecGen |

R28 (m01 S1) is "accept under F20": no change. R39 and R20 were "defer" pending VM reconciles; do them now, after the VM agent reports.

For m09/m10 the **game text is the source of truth** for account names, passwords, codes and artefact wording: the VM is changed to match it. If a VM agent finds that impossible, it reports the exact game change needed and the orchestrator passes it to the game agent.
