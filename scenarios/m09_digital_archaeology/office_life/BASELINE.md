# m09 Digital Archaeology: office-life baseline

Branch `plan/ol-m09`, base main `3e00651a8`. Campaign mission (m09), so V2, V4 and V5 apply.

| Item | Value |
|---|---|
| Validator | 0 errors, 30 warnings (`ruby scripts/validate_scenario.rb scenarios/m09_digital_archaeology/scenario.json.erb`) |
| Validator info lines | none: `validator_info_lines.txt` is empty because the run prints no info lines |
| V1 office summary | `v1_summary_base.txt`: 21 NPC records, none with needs, leash, groups, habits, chatter or exchanges |
| V9 lock and key baseline | `baseline_locks.json`: 11 lock nodes, 0 gates |
| Object position baseline | `positions_base.txt`: 58 rows (objects, container items, NPC `itemsHeld`) |
| V6 office-life clips | 0 office-life clips, 0 uncached (`app:break_escape:tts:office_lines[m09_digital_archaeology]`, keyless) |
| `gameClock` | start 04:45, rate 1, one anchor to 10:00 on `start_debrief` (scenario.json.erb:541 to :547). Story time is about 22:45 local, Helena |
| `npcThoughts` | false (scenario.json.erb:549) |
| `disableAttacks` | not set: every person NPC can be attacked |
| `officePresets`, `roomTone` | neither set |
| Start room | `loading_dock` (scenario.json.erb:550) |
| Walkthrough | `scenarios/m09_digital_archaeology/WALKTHROUGH_R1.md` |
