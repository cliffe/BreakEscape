# m10 office life: build log, slice A (handover, incomplete)

## Done (uncommitted checks pending)
- ink/m10_fp_support.ink compiled to .json; m10_six_oclock.ink edited (2 conditions, 2 VARs) and recompiled. dialoguelint clean; tagdiff vs HEAD shows only those 6 structural differences.
- room_m10_forward.json: second-kit crate id 41 (x 256, y 292) on `tables`, kettle1 gid 834 id 42 (x 265, y 284) on `conditional_table_items`, nextobjectid 43.
- scenario.json.erb: voices fp_darren/fp_sofia in the voice table, NPCs darren_price and sofia_marchetti after ama_phone, fp_kettle at end of forward_post objects, three globals, seven onceOnly mappings at end of agent_0x99, credits entries in both credits_sections.json and the ERB heredoc.
- Deviation: needsHome x/y are TILE units in the engine (`tileToWorld` = room origin + x*32), not pixels as PLAN says. Used 8.5/8.5 and 9.5/8.5 (cell centres); position equals needsHome. Provisional, measure live in slice B. chaseRange 64 provisional.
- Voice style lines: the quoted strings only; the plan's trailing "Calm and quiet..." note was not appended.
- fp_kettle useFrom {dx 0, dy -0.1}; provisional.

## NOT done (next agent)
1. Validator: run `ruby scripts/validate_scenario.rb scenarios/m10_full_disclosure/scenario.json.erb` (takes over 2 minutes; run in background with RBENV_VERSION=2.7.8). An earlier run was disturbed by an accidental stash (restored, dropped), so rerun.
2. --office-summary diff vs v1_summary_base.txt; lock_key_diff.rb vs baseline_locks.json; positions one-liner vs positions_base.txt (expect one new row fp_kettle); ERB render credits match; check_door_alignment.py on the m10 scenario (all OK seen).
3. V6 rake (not run), SPOKEN_LINES.md (not written).
4. Commit explicit paths only: public/break_escape/assets/rooms/room_m10_forward.json, scenarios/m10_full_disclosure/{credits_sections.json,scenario.json.erb,ink/m10_six_oclock.ink,ink/m10_six_oclock.json,ink/m10_fp_support.ink,ink/m10_fp_support.json,office_life/BUILD_LOG.md}.
