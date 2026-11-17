# m07 office life: handover (plan phase, stopped at the context guard)

Branch `plan/ol-m07`, worktree `.claude/worktrees/p-ol-m07`, base main `3e00651a8`. Nothing built. No PLAN.md yet, no review rounds run.

## Done

- Read the mission-office-life skill, AGENTS.md (iterating, model choice, standing rules) and m05's `office_life/PLAN.md` (use it as the shape template).
- Fact digest of the scenario and all 8 ink files (globals, act turns, timers, every room_entered / npc_ko / conversation_closed mapping, credits KO lines, debrief KO use, Hollis's patrol, cast voices): `office_life/FACT_DIGEST.txt` (a haiku-reader digest; items 6, 8, 10 partly open).
- Tiled machines per room (from `public/break_escape/assets/rooms/room_pnw_*.json`): ops floor has `coffee_station1` (34,300) and `water_cooler1` (60,300) in the bottom-left corner, beside the supervisor's `desk1` (118,304) that holds the critical-path key (123,281) and handover sheet (178,281), plus `phone2` (158,278). Checkpoint has `drinks_vending1` (no vending officeType) and `phone1`. Server, SCADA, gen hall and vault have no machines.
- `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md:342` sets m07 at Tier 1: "Elena gets desk presets and needs confined to the server room, with a kettle there. Shift-handover chatter."

## Findings so far (to carry into ANALYSIS.md and PLAN.md)

1. **No existing NPC is free (D78).** Hollis: patrol, LOS challenge, hostile, itemsHeld badge (never). Elena: pinned by her own ink, which narrates her at the rack in the opener and later (`ink/m07_npc_elena_rodriguez.ink:80`, `:84`, `:352`, `:385`, `:426`), so she also fails the D84 open-conversation rule (her conversation reads location); she is also the password source (V2). Mercer: plot-located at the master console, hostile. Park: `room_entered:cable_vault` conversation-mode mapping and LOS, pinned by text. Phones and cutscenes: never.
2. **So the missions-plan Tier 1 (Elena routine) should be withdrawn**, with the ink lines as the reason. Also: a lone NPC cannot chat, so "shift-handover chatter" needs a pair.
3. Noticed, not acting: Elena stands at (3,7.5) near `kvm_cart1` (110,200), while her ink says the SCADA backup rack (`pnw_backup_server1` at 256,170). A dressing question for another pass.
4. **Setting:** night, mid-evacuation, countdown. Muster board OPERATIONS 31/34 CLEAR (`scenario.json.erb:1794` to `:1801`), so three ops staff are unaccounted; Hollis "walked [contractors] out myself" (hollis ink :120); "The checkpoint is empty" (:300); briefing "nobody in there knows who you are" (briefing ink :75). Ops workstation is "abandoned ... coffee still warm" (`:1913` to `:1917`).
5. **Recommended design (put in QUESTIONS.md as Q1, plan around it): Tier 2 small, "the last two out".** Two ambient ops staff from the awareness cast (the unaccounted operators) on the ops floor, using the coffee station and cooler as a capacity-2 chatter pair, talkable with a few lines that offer nothing; hidden at `room_entered:server_room` (plain, KO-guarded) plus an `onceOnly` re-hide on `room_entered:operations_floor` when `server_hall_reached` (m05's hide pattern). The ops floor always loads before the server room, so no lazy-load gap. Optional exchange gated on `maintenance_key_found` and `!server_hall_reached`. Alternative: Tier 0 (evacuated building, only one friendly NPC).
6. **Stacked entry (leave as is):** first ops-floor entry already stacks the HaX hurt line, the Architect's call (5 s, `:1604`) and the RFID guide text (`DESIGN_REVIEW_P5_C1.md:96`, `PASS5_REGRESSION.md:55`). No mapped break or exchange may key on first ops-floor entry; chatter is muted during the phone call anyway.
7. **Presets:** `officePresets: true` would give pc objects with no lockType a desk preset: check `ops_floor_workstation` (`:1911`, "abandoned", must stay empty), the checkpoint pc at `:1750` and SCADA `:2199`; opt out with `"affordance": false` where needed. Declare `coffee_station` and `water_cooler` by base type name.
8. **Trouble:** no `npc_attacked` mappings exist; debrief has no KO scoring (KO only picks lines, debrief ink :434 to :511), so no debrief change. Credits have per-NPC KO lines (`:256` to `:283`); add one staff-hurt line for the newcomers. Trouble global set by mappings on `agent_0x99` (phone, registered at start), appended last.
9. **Levers and openings: none** proposed. The only things near the pair are the critical-path key and PIN sheet; any opening there would be a second way past a lock.
10. Credits and globals are ERB in places (loops at `:1231` to `:1238`, `:2185` to `:2192`): keep office-life keys outside ERB loops.

## Open (next agent)

- Pick two awareness-cast extras: `planning_notes/phishing_and_social_engineering/awareness/VOICE_CAST.md:68` onward lists them. m05 used Thandiwe Moyo and Niamh Doherty; check which atlases have seated and pose frames (`public/break_escape/assets/characters/<key>.json`) and which are already used in m01 to m06. m07 cast: Hollis (white? working-class PNW, mid 30s), Elena (Mexican-American, early 30s), Mercer (late 50s), Park (Korean-American, 40s); the awareness cast is British, so adapt the job and keep the voice, as m03/m05 did, and note the accent in an American facility as a QUESTIONS item.
- Stage 0 baseline: validator info lines, `--office-summary` V1, `lock_key_diff.rb --write`, positions one-liner (skill `references/measurement-recipes.md` section 9), V6 rake with the worktree env (section 1). No servers.
- ANALYSIS.md, PLAN.md (m05 shape), QUESTIONS.md, then plan review R1 on `opus55`, delta rounds per the skill, at least to R5, saving `REVIEW_R<n>.md`.
- Brief the next agent to delegate long reading to haiku-reader with narrow briefs (the last digest overran at 189k).

## Files touched

Only this file.
