# m04 office life: plan-phase handover

Branch `plan/ol-m04`, worktree `.claude/worktrees/p-ol-m04`, base main `3e00651a8`. Stopped at the context limit before writing PLAN.md. No review rounds run yet.

## Done (Stage 0, committed with this note)

- Validator: 0 errors, 25 warnings. `validator_info_lines.txt` (1 line: legacy desk boxes in 9 maps).
- `v1_summary_base.txt` (12 NPCs, none with needs), `baseline_locks.json` (7 lock nodes, 0 gates), `positions_base.txt` (52 rows).
- Not done: V6 rake count (needs Rails; deferred to the build). `BASELINE.md` and `ANALYSIS.md` not yet written; facts below.
- A reading digest (gotchas, presets, m04 line numbers, timers, debrief KO handling) is at `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/ol-m04/HANDOVER.md` (scratch; may be cleared). Rendered scenario: same folder, `rendered.json`.

## Facts found

- Night mission: `gameClock` 04:05, rate 1, anchor 08:40 on `debrief_started`. `npcThoughts: false`. No `disableAttacks`. Start room `main_entrance`. No `patrolOverride` anywhere in the scenario.
- The missions plan (`docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md:339`) sets m04 at Tier 1: ops-office kettle, desk presets for Vance confined to his room, "a little shift chatter".
- Existing NPCs, all pinned or worse (D78): `robert_vance` holds `vance_level1_keycard` (itemsHeld), card and fingerprint source, critical-path conversation, own text "I can't leave the desk" (`ink/m04_phone_robert_vance.ink:123`); `security_guard` has LOS and `challengeOnSight` at his desk (scenario ~750); operatives and Voltage hostile/patrol; handlers phone or cutscene. So: none free; Vance gets no needs. His BMS pc has no id, so it gains no preset.
- Security office is designed empty and dark ("the player breaks in", `LIGHTING_PLAN.md:40`): keep office life out of it. SCADA control room empty by design; Vance is the only one watching the hydrogen.
- Machines (Tiled decor, none declared): reception `water_cooler1` (8,5), `leather_sofa1` (7,7) with two static seat places (`seating.js:165`); ops office `kettle1` (6,1) on `kitchen_counter_sink1` (counter collision y 80 to 92, so use cell (6,3)), microwave, undercounter fridge, `uni_sofa2`. Guard stands at (7.3,4), right by the reception cooler: pair cells there crowd him.
- Presets (`public/break_escape/js/data/office-presets.json:4-15`): kettle cap 1, caffeine, 12 s, useFrom (0,1); cooler cap 2, thirst+social, 15 s, chatter "cooler".
- crew_warned is set in Vance's ink in the ops office (`m04_npc_robert_vance.ink:480`) and by phone (`m04_phone_robert_vance.ink:246`). hydrogen_alarm and racks_vented come from timers (scenario 2840 to 3005). vance_met set at `m04_npc_robert_vance.ink:331, 344, 634`, after the lanyard clone.
- Head count problem: the story counts "eleven on site" (nine Hall 2 crew, Vance, guard): credit line `scenario.json.erb:242` "ALL ELEVEN ON SITE WALKED OUT" and the voiced debrief line `ink/m04_closing_debrief.ink:433` "Eleven people walked out of there tonight." Any extra on site makes this false.

## Design direction reached (not yet reviewed)

- Tier 2 small: two ambient night staff from the awareness cast (atlases with seated and pose frames exist, keys do not clash): `chidi_okeke` (40s, Nigerian-British, West Yorkshire; adapted to site logistics coordinator waiting on the haulier for the module swap) and `jun_watanabe` (early 20s, Japanese-British; adapted to a site admin apprentice on his first night shift). Posts: the two places on the reception sofa. `needsRooms: [main_entrance, operations_office]`. Hostile leash. Voice styles rewritten for Albion Energy Storage.
- Machines: declare `water_cooler` (reception, hand-written cells clear of the guard) and `kettle` (ops office, capacity 2, useFrom (0,2), chat point). Kettle gated until `vance_met` so nobody is in the ops office during the first (clone) meeting: derived `ops_kettle_off` declared true, cleared on `vance_met` true when not `aes_staff_off`, set on `aes_staff_off`. `aes_staff_off` (monotonic) set on agent_0x99 by attacks on either extra, Vance or the guard, and by crew_warned / hydrogen_alarm / racks_vented (evacuation). Cooler `offWhen: "aes_staff_off"`.
- Evacuation: extras hidden by plain `room_entered:<room>` mappings for every room other than reception and ops office once `aes_staff_off` is true via evacuation (needs its own global, e.g. `aes_staff_evacuated`).
- Exchanges (draft): the haulier and the crew till six; the auditor ("Vance said leave them be", gated `vance_met`); "used to be four on nights" (budget cuts). No clue facts, no telemetry talk.
- Trouble: credits KO line and debrief KO conditions extended (conditions only).
- No levers or openings recommended (a lore-only permit tablet goes to QUESTIONS as an option).

## Open, for QUESTIONS.md

1. Tier 2 small with two extras versus the missions plan's Tier 1 (chatter needs a pair, so Tier 1 has no talk).
2. Head count: extras make "eleven" false. Recommend changing to "thirteen" in credit 242, the debrief line 433 and comment 429 (one re-voiced debrief line, needs its own yes). Alternative: "Everyone on site walked out" wording.
3. Cast picks (Chidi and Jun) and their adapted jobs.
4. Optional lore opening (permit tablet) yes or no; recommend no.
5. Voicing spend for new pools, exchanges and the changed line.

## Next steps

Write ANALYSIS.md, BASELINE.md, PLAN.md (m05 `office_life/PLAN.md` section shape: 0 preconditions, 1 aim and tier, 2 people with build skeletons, 2A story-safe movement "none free", 3 rooms and objects, 4 levers, 5 openings, 6 spoken lines, 7 sync budget, 8 field names, 9 costs, 10 test plan) and QUESTIONS.md; then plan review R1 on `opus55`, R4 and R5 as Sonnet deltas; REVIEW_R<n>.md each; commit each round with explicit paths.
