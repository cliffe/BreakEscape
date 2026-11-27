# Mission 4: "Critical Failure" — Implementation Status

> Renamed 2026-10-01: Robert Chen → Robert Vance (the character was renamed in pass 1; his ids now match). Ids `chen_*` → `vance_*`: globals `chen_trust_level`, `chen_is_ally`, `chen_provided_keycard`, `chen_phone_available`, `chen_knows_truth` → `vance_*`; every `chen_*` ink knot and VAR → `vance_*`; ERB `chen_warning_email` → `vance_warning_email`. NPC ids (`robert_vance`, `robert_vance_phone`) were already right. The puzzle structure described here is superseded by `PUZZLE_CHAINS_PLAN.md` (pass 3).

**Mission ID:** m04_critical_failure
**Setting:** Albion Energy Storage — 200 MWh grid-scale lithium-ion BESS
**Last updated:** 2026-08-21

> **The authoritative status document for this mission is [`ALIGNMENT_PLAN.md`](ALIGNMENT_PLAN.md).**
> It carries the full current-state assessment, the phase-by-phase record of what has been
> implemented, the decisions taken, and the outstanding work. This file is a summary only.

---

## Corrections to the previous version of this file

The version of this document dated 2025-12-29 was substantially wrong and has been replaced.
For the record, because the same claims may have been repeated elsewhere:

- It described a **water treatment facility** with chlorine dosing. The mission was converted to
  **grid battery storage** in June 2026 (`1a0d54d6`, `939a01b1`). No ink file has ever mentioned
  chlorine. `mission.json` and `SOLUTION_GUIDE.md` carried the same stale framing.
- It claimed **"90% complete"** and **"0 errors"**. The scenario did validate, but **9 of the 10
  ink scripts failed at runtime** — the climactic antagonist and the handler were both unreachable,
  and four objective tasks could never complete. Ink *compiling* is not evidence of ink *running*;
  that distinction is why `scripts/ink_runtime_check/` now exists.
- It listed `ink/m04_terminal_attack_trigger.ink` and `ink/m04_terminal_scada_display.ink` as
  complete. **Neither file exists**; both were replaced by in-world display objects.

---

## Current state (verified 2026-08-21)

| Check | Result |
|---|---|
| Validator errors | **0** |
| Room world-space overlaps | **0** |
| Objective-wiring warnings | **0** |
| Ink file warnings | **0** |
| Ink compile | **10 / 10** |
| Ink runtime (DFS + long-loop, both harnesses) | **10 / 10 clean** |
| Story critical path | **4 hops** across 5 staged aims |

### Implemented
- **Ink layer** — all 10 scripts run clean. Conversations are hub-structured with sticky choices;
  cutscenes terminate with `-> END`.
- **Objectives** — 5 aims chained with `unlockCondition`, tasks `active` inside locked aims,
  spoiler-safe titles, `missionConclusion` + `bond_visualiser`.
- **Rooms** — single spine, no overlaps; each lock opened by the previous room's NPC.
- **Canon** — escalated-bible reframe, Voltage as Blackout's lieutenant, named human cost,
  branch-aware debrief and credits.
- **Combat** — engine-owned via `behavior.hostile` + `#hostile`; no CYOA combat in ink.
- **Clock** — two `timers` driving urgency and a partial-failure state that never ends the run.
- **Agent HaX hub** — progress-gated, with six exposure-gated field guides.
- **SecGen** — `secgen/m04_critical_failure.xml`, system `bms_jump_server`.
- **Closing debrief** — event-driven hidden-person cutscene with an HQ background.

### Outstanding
1. **SecGen build verification.** Flag order/count and `vm_object('bms_jump_server', …)` are
   inferred, not proven. Until a build confirms them the four flag tasks are unverified.
   See ALIGNMENT_PLAN.md → Phase 4.
2. **HacktivityLabSheets rebuild.** `distcc-exploitation` and `rfid-cloning` have valid front
   matter but are absent from the built `_site`. Both field guides 404 until the site is rebuilt.
3. **`SOLUTION_GUIDE.md`** still reflects the pre-rework mission.
4. **Assets** — sprites, VO and bespoke music remain unproduced.
5. **Open decisions** — see ALIGNMENT_PLAN.md → "Open decisions for the user".

---

## Verification commands

```bash
ruby scripts/validate_scenario.rb scenarios/m04_critical_failure/scenario.json.erb
./scripts/compile-ink.sh m04_critical_failure

# Runtime health -- compiling is NOT enough. Use each NPC's declared currentKnot.
node scripts/ink_runtime_check/inkcheck.js  <file.json> <knot> [VAR=value ...]
node scripts/ink_runtime_check/loopcheck.js <file.json> <knot> [VAR=value ...]
```
