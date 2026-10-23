# Review: sis02_energy Final Scenario

Date: 2026-04-26

Reviewed artefacts:
- scenarios/sis02_energy/mission.json
- scenarios/sis02_energy/scenario.json.erb
- scenarios/sis02_energy/ink/*.ink
- scenarios/sis02_energy/TODO.md
- planning_notes/sis_scenarios/case_2_energy_information_pack/
- public/break_escape/js/minigames/network-architecture/network-architecture-minigame.js
- /home/cliffe/Files/Projects/Code/CyBOK_Phase_7_SIS/project_spec.md

## Executive Summary

The final remediation pass is now implemented and validated. The scenario is playable, schema-valid, and aligned with the major regulatory/content consistency concerns raised in the previous review.

Core result:
- No schema blockers remain.
- NIS reporting semantics now reflect competent-authority submission with NCSC coordination.
- Hydrogen safety messaging is consistent at advisory 1.0% / evacuation 2.0% framing.
- Baseline capacity is aligned to 200 MWh across mission/scenario framing.
- ESD dialogue now uses authorization wording rather than keypad/PIN affordance.
- Cross-sector Trent Water evidence is present as an in-world artefact, not dialogue-only.

Overall judgement: release-candidate quality for scenario logic/content, with remaining work focused on polish and additional QA coverage rather than correctness blockers.

## Validator Review (Current)

Validator command run:

`ruby scripts/validate_scenario.rb scenarios/sis02_energy/scenario.json.erb`

### Validation status

- ERB rendering: pass
- JSON structure: pass
- Unknown field checks: pass
- Ink checks: pass
- Objective task wiring: pass
- Schema validation: pass
- Dungeon graph generated: yes

### Validator findings summary

The validator currently reports 11 non-blocking notes composed of:
- good-practice confirmations (event-driven chat flow, skipIfGlobal timedConversation, collection_group usage, music system usage, puzzle graph metadata);
- generic optional suggestions (VM launcher, flag station, patrol waypoints, additional lock/tool/hostile NPC patterns).

No invalids or hard warnings were produced in this run.

### Dungeon graph summary

- Puzzle graph: 33 nodes / 37 edges
- Story graph: 12 nodes / 13 edges
- Integrated graph: 45 nodes / 65 edges
- Rooms graph: 3 nodes / 2 edges
- Critical path: 6 hops

## Remediation Status Against Prior Review

## Must Fix (Previous) - Resolved

1. **Room schema mismatch (room types)**
- Status: resolved.
- Evidence: schema validation now passes; previously invalid room types are accepted.

2. **NIS reporting semantics (competent authority vs NCSC)**
- Status: resolved.
- Evidence: scenario/objective/form text now frames competent authority (OFGEM OES route) as formal reporting route, with NCSC as coordination path.

3. **Hydrogen threshold consistency and progression framing**
- Status: resolved for current phase.
- Evidence: scenario text/credits/SIS references aligned to advisory 1.0% and evacuation 2.0% semantics; inconsistent older wording removed.
- Note: detector visual state progression remains a future enhancement if a live in-room indicator is desired.

## Should Fix (Previous) - Resolved

1. **Plant baseline capacity mismatch (220 vs 200 MWh)**
- Status: resolved to 200 MWh baseline.

2. **Stale implementation comments/TODO drift**
- Status: resolved in current pass for high-impact stale notes; TODO and scenario comments updated.

3. **Network architecture content verification**
- Status: resolved.
- Evidence: minigame node/path model remains aligned with `information_pack/system_architecture/network_architecture.md` structure (Purdue levels, key weak points, and EN-001/EN-002/EN-011 pathways).

4. **ESD PIN affordance mismatch**
- Status: resolved.
- Evidence: messaging now uses authorization phrasing and no longer implies a keypad mechanic.

5. **Terminology consistency (Plant Room vs Battery Hall)**
- Status: resolved in scenario state and key naming.
- Evidence: `plant_room_badge` naming replaced by battery hall terminology (`battery_hall_badge_collected` and related text updates).

## Worth Considering (Previous)

1. **Claim-outcome feedback in debrief**
- Status: improved.
- Evidence: credits include strengthened learning impact feedback entries.

2. **Cross-sector dependency evidence artefact**
- Status: implemented.
- Evidence: dedicated artefact `trent_shared_server_access_extract` and tracking variable `trent_lateral_ioc_viewed` added.

## Remaining Work (Non-Blocking)

1. **Production art replacement**
- Placeholder compatibility sprites were added for new object types; bespoke final art is still tracked in `scenarios/sis02_energy/TODO.md`.

2. **Additional regression/testing depth**
- Optional but valuable: timed escalation edge cases, optional Trent Water branch coverage, and physical prop integration tests.

3. **Potential UX polish**
- Dedicated in-room NIS countdown display remains optional; HUD timer + form linkage already delivers the mechanic.

## Final Assessment

The scenario now meets the practical finalization bar for logic, educational alignment, and validation hygiene. The previously blocking and correctness-critical findings are closed. Remaining items are polish-track tasks (art, extended QA, optional UX embellishments) rather than release blockers.
