# m01 First Contact: office-life baseline (Stage 0)

Taken on branch `plan/ol-m01`, base commit `9baab9c3282cb9bbbc6afa45ff8c436d42272d78`, 2026-11-17. Nothing built.

m01 is the production deploy-gate mission. Before any release carries m01 office life, the m01, sis01 and sis02 gate playtests must run again (SKILL.md Stage 0, first item).

## Scenario keys at base

| Key | Value |
|---|---|
| `startRoom` | `reception_area` (scenario.json.erb:511) |
| `gameClock` | absent |
| `disableAttacks` | absent (every person NPC is attackable; Sarah, Kevin, Maya and Derek each have `behavior.hostile` and a KO global) |
| `officePresets` | absent (off) |
| `roomTone`, `roomToneTypes` | absent (off) |
| `npcThoughts` | absent; no engine file or schema entry on this base reads it (grep of `public/break_escape/js` and `scripts/scenario-schema.json` is empty). D77 records m01 as `false`, so the plan adds no thoughts and needs no key. |
| `lighting` | top level `darkAmbient #5a6378` (:535); motion rooms: main office, storage closet, conference room, both hallways, manager's office, Kevin's office, server room; Derek's office `mode: on` |
| Room `ambientSound` | server room only: `server_room_ventilation` at 0.4 (:2123-2124) |
| Rooms | 13 |
| Walkthrough evidence | `tools/playtest/m01-trace.md` and `tools/playtest/haiku-m01-solvability-trace.md` (both last committed 2026-10-26) |

## Commands and results

All run from the worktree root.

| Check | Command | Result | File |
|---|---|---|---|
| Validator | `ruby scripts/validate_scenario.rb scenarios/m01_first_contact/scenario.json.erb` | 0 errors, 19 warnings. The warnings: 7 `comment` fields in music events; 2 ink file warnings; 5 objective wiring warnings (four onceOnly overlaps on `agent_0x99` flag mappings, one other); 1 door alignment note (main office north has two doors); the `capture_technical_evidence` non-flag onComplete; undeclared `m01_first_ring_done`; four timed-text pairs less than 4 s apart (ssh, whiteboard, linux, sudo). Plus 25 dialogue lint findings and 8 suggestions. None is about office life. | `validator_info_lines.txt` (one info line: legacy desk boxes in all 11 maps) |
| V1 `--office-summary` | same, with `--office-summary` | `OFFICE-LIFE SUMMARY (V1): 7 NPC(s)`, none with needs, chatter, exchanges or habits (lines 124-131 of the file) | `v1_summary_base.txt` |
| V9 lock and key | `ruby scripts/lock_key_diff.rb scenarios/m01_first_contact/scenario.json.erb --write scenarios/m01_first_contact/office_life/baseline_locks.json` | 13 lock nodes, 0 gates | `baseline_locks.json` |
| Object positions | the one-liner in measurement-recipes.md section 9 (skill branch `plan/ol-skill-movement`) | 44 rows: declared objects and every `itemsHeld` entry (Sarah 2, Kevin 3, Derek 1, agent_0x99 4) | `positions_base.txt` |
| V6 office-line clips | `env -u GEMINI_API_KEY RBENV_VERSION=2.7.8 bundle exec rake "app:break_escape:tts:office_lines[m01_first_contact]"` | Boot printed the `GEMINI_API_KEY environment variable is not set` warning (keyless). `Total: 0 office-life clip(s), 0 uncached (0 characters uncached of 0).` | this file |

The V1 summary at base:

```
agent_0x99 (reception_area) class=task,task-mapping,conv post=reception_area
briefing_cutscene (reception_area) class=attackable post=reception_area
closing_debrief_person (reception_area) class=task-mapping,conv,attackable post=reception_area
derek_lawson (break_room) class=task,task-mapping,conv,fights,attackable post=break_room
kevin_park (it_room) class=task,key,fights,attackable post=it_room
maya_chen (maya_office) class=task,fights,attackable post=maya_office
sarah_martinez (reception_area) class=task,key,fights,attackable post=reception_area
```

(each with `leash=- needs=- groups=- avoids=- habits=- chatter=0 exchanges=0 calls=0`).

## Notes for the build

- The validator rewrites `dungeon_graph.*`; on this base they came out unchanged (`git status` clean after the run).
- The worktree's `.bundle/config` sets `BUNDLE_PATH` to the main checkout's vendor bundle; there is no `bin/rake`, so V6 runs with `bundle exec rake` as above.
- No server was started and no database task was run.
