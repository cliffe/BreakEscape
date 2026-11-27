# m07 office life: Stage 0 baseline

- Base commit: `3e00651a8` (main), plan branch `plan/ol-m07`.
- Mission: m07 The Architect's Gambit, a campaign mission (m01 to m10). Not m01, so no extra gate playtests.
- `npcThoughts: false` (`scenario.json.erb:112`). No `gameClock`, no `disableAttacks`, no `officePresets`, no `roomTone` anywhere in the scenario.
- Walkthrough: `scenarios/m07_architects_gambit/TESTING_WALKTHROUGH.md` (critical path from line 33).
- Validator: 0 errors, 30 warnings. Info lines in `validator_info_lines.txt` (one: legacy desk boxes in all six PNW maps).
- V1: `v1_summary_base.txt`, 8 NPC records, none with needs, leash, groups, habits, chatter or exchanges.
- V9: `baseline_locks.json`, 8 lock nodes, 0 gates.
- Object positions: `positions_base.txt`, 31 rows.
- V6 (`app:break_escape:tts:office_lines[m07_architects_gambit]`): 0 office-life clips, 0 uncached.
- PCs that `officePresets: true` would touch: only `ops_floor_workstation` (`scenario.json.erb:1911`, no `lockType`). `badge_printer` (`:1751`, `lockType: "pin"`) and `crisis_control_system` (`:2201`, `lockType: "flag"`) never gain one.
