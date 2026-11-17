# m10 office life: build-phase handover

Branch `build/ol-m10`, worktree `.claude/worktrees/p-ol-m10`. The plan closed at plan review R9 (0/0/0). The user answered D118 with "a. Accept all five recommendations": small forward-post treatment; Darren Price (Orus) and Sofia Marchetti (Despina, not option e); build unvoiced; third kit crate south-centre; overhearRadius 320. The orchestrator stopped at the 150k context limit. Resume from "Open" below.

## Built (commits on build/ol-m10)

- `24af25a03` slice A: crate and kettle placeholder in `room_m10_forward.json`; `fp_kettle`; `darren_price`, `sofia_marchetti` (voice table entries `fp_darren`, `fp_sofia`); globals; seven trouble mappings on `agent_0x99`; credits in both places; six o'clock ink (two conditions, two VARs); new `ink/m10_fp_support.ink`.
- `3b047ddd5` checks, `heard_ex_fp_*` declared, SPOKEN_LINES.md. `fcd50438e` six exchange lines cut to the 40-character cap.
- `c7ec42338`, `2c87e69d8`, `83b44627d` live B1: homes measured at (276,268) and (308,268) px = tiles 8.625/8.375 and 9.625/8.375 (`needsHome` is in tiles); F1 not needed; kettle depth over crate; L1 5/5; L5 0.5 px over ten needs-minutes; one needs-minute = 60 s; distances in LIVE_B1B.md; 320 covers console and terminal, the closest blast-door stand cell is 326 px from Sofia (accepted).
- `3c31d555b` build review R1 (0 B, 2 M, 8 m). `0d50e66b9` R1 fixes: `chaseRange` 32 (table items reachable 17 to 28 px from the extras, so no range clears the table), two pool lines reworded, docs, DIALOGUE_SAMPLE.md. Outcomes in BUILD_REVIEW_R1.md.
- `a228b9c2a` LIVE_B2A.md, `9c42608b7` LIVE_B2B.md plus `tools/playtest/m10-ol-b2b-*.mjs`, `e3b7fcdd6` LIVE_B2C.md (all partial).

## Review rounds

| Round | Tier | B | M | m |
|---|---|---|---|---|
| Build R1 | review tier (planning tier model) | 0 | 2 | 8 |
| Dialogue R1 (npc-dialog-review, new lines) | planning tier | 0 | 2 | 6 |

## Open (resume here)

1. **Dialogue R1 findings** (`DIALOG_REVIEW_R1.md`): majors are Darren's pool line "Van two's battery is on its last bar." (van two is in the whodunnit) and `ex_fp_radios` opening "The radios have gone very quiet." (reads as a report on the team's comms). Recommended: take the reviewer's replacements for both majors and minors 3, 5, 6, 7, 8; minor 4 too. Then recompile, refresh SPOKEN_LINES.md and DIALOGUE_SAMPLE.md, and re-run the validator.
2. **Trouble gap to verify**: in LIVE_B2A the KO of an extra (via debugKO) set its KO global but not `fp_staff_upset`, so the other kept brewing. Check whether a real KO in play emits `npc_attacked` first (then it is a probe artefact); if not, add `global_variable_changed:fp_darren_ko` and `:fp_sofia_ko` onceOnly mappings to `agent_0x99` setting `fp_staff_upset` (design: any hurt person stops the tea).
3. **Minor from LIVE_B2C**: after a reload with `breach_open` true, the `room_entered:forward_post` break fires on load (no cooldown in the new session). No exchange repeats. Decide: accept, or add a short `delayMs`/condition so a load does not count.
4. **Live proof still open**: chase against 32 px (B2A walks hit blocking UI); L2 control run for `van_two` and `malhotra_post` with the pair away (failed with them at the kettle: check whether that is the pair or the harness); `kit_table` recheck; B2B all five checks (console, table, blast-door orders of `ex_fp_radios`, split_line close no brew, reload after split, E2) using `tools/playtest/m10-ol-b2b-run.mjs` (its game 7872 console run output is in the session scratchpad, likely lost); B2C walkthrough steps 6 to 16, untethered E2, E1 hide at `closing_done` and after reload, live credits order. Already shown live: `ex_fp_kettle_on` (Darren first), `ex_fp_radios` after the gate scene, `ex_fp_door_open` (Sofia first, once), E3 unchanged, reloads in the briefing and after the breach, no NPC on the extras' cells.
5. Harness notes: new-game.rb prints no FLAGS_XML for m10; flag 1 stand-in `flag{m10_monitoring_foothold}` typed at the gate terminal works. The tutorial modal needs dismissing. The opening Netherton chat must be played through (`settle()` in `tools/playtest/m10-ol-lib.mjs`).
6. Build review rounds R2 to R5 (R2 on the planning tier after majors; deltas on the review tier from R4 unless a major or a line/reveal change), until 0 B / 0 M.
7. Uncommitted, not ours to stage: `dungeon_graph.*`, `node_modules` (symlink), `tools/playtest/m10-ol-b2c-session.jsonl` (harness log; leave or move to tmp/delete/).

## Lines needing the user's yes

Wording (DIALOGUE_SAMPLE.md) and voicing are separate yeses. Unvoiced lines: `ink/m10_fp_support.ink:27`, `:30`, `:36`, `:45`, `:48`, `:54`, `:61` to `:64`, `:69` to `:71`, `:76` to `:78`, and the eight `kettle_fp` pool lines in `scenario.json.erb` (around `:2628` and `:2662`). Line numbers move if dialogue R1 fixes go in.
