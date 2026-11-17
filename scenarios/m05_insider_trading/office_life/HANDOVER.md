# m05 office life: plan-phase handover

Branch `plan/ol-m05` in worktree `.claude/worktrees/p-ol-m05`, from main `a5b0c4a96`. The first agent hit its context limit while reading, before writing any plan output. Nothing in the scenario has changed.

## Task (from the orchestrator)

Plan phase only of the mission-office-life skill for m05: stage 0 baseline, stage 1 `ANALYSIS.md`, stage 2 `PLAN.md`, plus `SPOKEN_LINES.md` and `DIALOGUE_SAMPLE.md`, all in this folder. No build, no plan review rounds (the orchestrator runs those). User direction D74: office life only where it adds to immersion; say in the plan which parts gain nothing and leave them alone. Use the evening (staff leave about 19:00: people heading home, a late worker, a cleaner). Extras from the awareness course cast (D53). Story NPCs stay put; VM flags stay required. No SecGen XML, no exploit field guides, no PixelLab, no custom animations; list art needs as open questions with a recommendation. Spoken lines are scenario data with a clip-count estimate; voicing waits for its own yes. Live render, if needed: keyless server on :3092 only (skill recipe), record and kill only the puma PID, only game ids new-game.rb printed, never a db: task. Report: commit hash, plan path, ten-line summary, open questions with recommendations, estimated build size.

## Done

- Read `SKILL.md` and all four references in full; read m02 `office_life/PLAN.md` in full (shape to copy: sections 0 to 10).
- Surveyed `scenario.json.erb` (2442 lines).

## Facts gathered (line numbers in `scenarios/m05_insider_trading/scenario.json.erb`)

- `gameClock` `:634`: starts Wed 16:30, rate 2.5; anchors put the naming of Torres (`torres_identified`) at 19:50 and the data-centre scene at 20:02 or 20:14; debrief Thu 09:00. No `disableAttacks`, no `officePresets`, no `roomTone`. Start room `reception_lobby` (`:665`).
- Act turn candidate: `torres_identified` (lighting already keys on it: front of house to night lighting, corridor to motion `:1695`, server hallway lit `:1855`). The clock does not drive anything; use globals (rule: no timetable field). There is no global at 19:00; a "staff leave" turn would need one tied to progress (for example `torres_identified`, or an earlier milestone such as `server_room_entered` or `case_motive`/`case_exfil`); decide in the plan.
- Rooms: `reception_lobby` `:833` (`room_qdc_lobby`; only HaX briefing, Netherton, Nightshade, HaX phone, recruiter, Patricia phone, debrief trigger, no receptionist), `main_corridor` `:1690` (`room_qdc_hall`, no NPCs, corridor flyer about the collection tin), `break_room` `:1719` (`room_qdc_break`, west of corridor, dead end; Lisa; `entropy_pamphlet` "dropped behind the coffee machine"), `open_office_area` `:1766` (`room_qdc_open`, 10x10; Owen; objects `[]`; north to `torres_office`, west to `research_lab`), `server_hallway` `:1845` (RFID `employee_badge`), `server_room` `:1880`, `torres_office` `:1989`, `research_lab` `:2059` (Halloran), `patricia_office` `:2135` (Patricia), `data_center` `:2253` (Torres).
- Cast, all story-critical: Lisa Park `:1731` (break room, (4,4), `taskOnKO: talk_to_lisa`, `lisa_ko`, voice Laomedeia; her ink says she "sits by the kettle", `m05_npc_lisa_park.ink:120`, and her post-fate lines report office goings-on, `:125` to `:136`); Owen Gallagher `:1782` (open office (6,4); `rfidCard` employee_badge cloned off his lanyard; holds `torres_office_keycard`, `server_door_log`, `server_password_note`; `taskOnKO: talk_to_owen`; voice Puck; ink says he sits at a workstation with three terminals, `m05_npc_owen_gallagher.ink:73`); Halloran `:2073` (lab, holds `research_lab_badge`); Patricia `:2153` (her office, holds visitor badge and vetting files); Torres `:2291` (data center). So per the skill, Lisa and Owen can at most get needs confined to their own rooms (protection 2), or be left alone; any walking staff must be new ambient extras.
- KO globals `lisa_ko`, `owen_ko`, `halloran_ko`, `patricia_ko` are exported (`:657`). Do not change them.
- Owen's rfidCard clone needs proximity; if he ever walked, cloning him elsewhere is a variation, not a bypass, but he holds the keycard and notes, so keep him in the open office.
- Room maps: `public/break_escape/assets/rooms/room_qdc_{lobby,hall,break,open}.json` (break and lab also `.tmj`). Not yet read: which machines (coffee machine, kettle, cooler, copier, printer, desk phones) are Tiled decor in each. Read these next, plus `ROOM_DRESSING.md` and `LIGHTING_PLAN.md` in the mission folder.
- Never open `scenarios/m05_insider_trading/secgen_review/` (VM detail).

## Next steps

1. Stage 0 (skill commands, run from the worktree root with `RBENV_VERSION=2.7.8 BUNDLE_PATH=<main checkout>/vendor/bundle`): validator to `validator_info_lines.txt`, `--office-summary` to `v1_summary_base.txt`, `lock_key_diff.rb --write baseline_locks.json`, the V6 rake, `BASELINE.md`.
2. Read the four Tiled maps for machines; read the awareness cast (`planning_notes/phishing_and_social_engineering/awareness/HANDOVER.md`, `VOICE_CAST.md`) for a cleaner and one or two evening extras with seated and pose frames; check m03's `docs/achitechture/M03_OFFICE_LIFE_PLAN.md` for its day-to-night hides (m03 is the closest pattern: staff vanish at an act turn).
3. Write `ANALYSIS.md` and `PLAN.md` (m02 section shape). Likely shape to test: Tier 2 to 3 kept small. Break room as the one office-life room (kettle or coffee, Lisa confined there, one or two leaving staff passing through and a cleaner later); open office with a late worker or none; corridor and reception carry people heading home on the act turn; server side, lab, Patricia's and Torres' offices and the data centre left alone (story rooms, motion-sensor dark rooms). No lever touching any lock.
4. `SPOKEN_LINES.md`, `DIALOGUE_SAMPLE.md`, commit with explicit paths, report.
