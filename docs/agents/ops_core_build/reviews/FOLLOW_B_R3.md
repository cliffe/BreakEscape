# Ops follow-up B: review R3 (delta)

Scope: fix commit `e9d4967f1` against `FOLLOW_B_R2.md`. No code changed. Node v22.11.0.

## R2 findings

| R2 | Status | Evidence |
|---|---|---|
| R2-1 | closed | `tableLines` `build` trims trailing whitespace on the last kept span. `assertCells` now requires the last span of a row to have no trailing space; new `R2-1` test checks every `host_states` line. `bin/test-js test/js/network-terminal-format.test.mjs` passes. Cells with `w` still pad the visible columns, as only the final span is trimmed. |
| R2-2 | closed | `OWN_SCREEN_TYPES` is now derived (38 types) from the `interactions.js` span between the workstation and lockpick branches plus the `BUILT_IN` keys of `minigame-registry.js`, minus `mail_terminal`, keycard and the inventory-only tools. Printed list includes cms_terminal, warranty_checklist, shredder, flag-station, network_segmentation_map, sis_config_panel, ops_log_terminal, workstation, notepad, case-file, rogue-ap. New test passes (`validator-unopenable-containers.test.mjs`), including an independent derivation. |

## New findings

- N1 (minor, non-blocking): derivation is a regex over source text. If the dispatch block is reordered so the workstation or lockpick anchor moves, or `BUILT_IN` is renamed, the list silently shrinks (the code falls back to an empty list per source). The new test would catch that for the current anchors, so it fails loudly in CI. Accepted.
- N2 (note): the span includes the inventory-only branches and a `keycard` reference inside the rfid_cloner branch; all are explicitly excluded. `rfid_cloner`, `keycard`, `briefcase`, `folder` asserted not listed.

No change touches what the server sends or access checks (client text formatting, validator script, tests only): nothing "needs Opus".

## Re-runs

- JS: both test files pass (2 passed, 0 failed).
- Validator sweep over all scenarios for new "opens its own screen" lines: started, not finished within the review budget; R2 found only the single `sis01_healthcare` line and the list grew by types no shipped scenario was found to use in R2's sweep. Unproven for the 27 added types.
- `bin/ops-golden-compare`: NOT RUN (not touched by the diff: no `app/`, `lib/`, route or replay fixture).

## Verdict

**clean.** R2-1 and R2-2 closed; one non-blocking note (N1). Open: golden compare and full validator sweep not run.
