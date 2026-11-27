# m03 office life plan: review R2 (solvability and critical path)

Plan reviewed: `docs/achitechture/M03_OFFICE_LIFE_PLAN.md` at 9a6b7f8c2.

Counts: **B0 M3 m7**

The critical path itself is untouched: no lock, key, task or `concludeRequires` reads an office-life global, the hide mappings fire on story globals but write nothing a story step reads, and the expected lock and key diff is empty. The findings are about content that cannot be reached, and about states that persist after the staff are hidden.

## Major

M1. A staffer attacked by day turns hostile (leashed). If they are still conscious when `mission_phase` flips, the hide mapping hides a live hostile. m03's music uses `all_hostiles_ko` (`scenario.json.erb:162` to `:165`), and its handler returns early while `anyHostilesAlive()` is true (`music/scenario-music-events.js:418` to `:424`). If that function counts hidden NPCs, the night's music never returns from the fight playlist after Terry is put down, and a hidden hostile may still be counted for anything else that asks "is anyone hostile". Outcome: fixed. Stage 1 reads `anyHostilesAlive()` and the hostile tick for hidden NPCs. If either counts a hidden NPC, the engine change gains a second small part (hidden NPCs are neither hostile-alive nor able to attack), with a unit test, folded into the same engine branch. The test plan gains a check: attack a staffer, leave them conscious, clone the card, KO Terry at night, and hear the music return.

M2. The cooler half of the routine rarely happens. At the planned thirst rates the first cooler trip falls 16 to 20 minutes in, likely after the day act ends, so the cooler pool lines and the locked half of the laptop lever would seldom play. Outcome: fixed. Breaks are restructured: Ffion's conversation closing sends Yusuf for coffee with Zainab coupled (a short trip: laptop left open); the player's first return to reception from the hallway sends Zainab to the cooler with Yusuf coupled one way (a long trip: laptop locked). Both are day-conditioned and use cooldowns. No mapping is added on `room_entered:main_hallway`.

M3. The open-laptop window may be too short to use. A coffee trip inside reception might keep Zainab away for 15 to 20 seconds; a lever the player cannot pull in that time is dead content. Outcome: fixed. Stage 4 measures `expectedAwayMs` and the real time away for both trips (five tries each), sets `lockIfAwayOverSeconds` between them from the measurements, and aims for an open window of at least 20 seconds, which the paired coffee chat (four turns) gives. If it cannot, the coffee station's use time is raised for this object only.

## Minor

m1. A hostile staffer leashed to reception is in the start room and the badge room, so a player who punches one must deal with them before talking to Ffion. This is self-inflicted and matches m02. Outcome: kept; stated in the plan.

m2. The Ffion KO mapping sends both staff home with `patrolOverride`, including one who is hostile. Outcome: fixed (condition excludes a staffer whose own attack global is set; the mapping is split per NPC).

m3. A player standing at Ffion's desk can sit in the staff's lane to the coffee station and cause `npc_job_failed`. Not critical. Outcome: fixed (stage 4 measures lanes with the player at Ffion's approach cell).

m4. If the engine change is refused or slips, the plan has no fallback. Outcome: fixed (fallback stated: posts in the hallway beside the cooler, reception left to Ffion; or start needs high and drop the Ffion-conversation break).

m5. `officePresets: true` applies across the scenario. Existing story objects such as `phone4` and `usb_bowl1` in reception, or night PCs, could gain presets. Outcome: fixed (stage 0 lists every object V1 says gains one; any story object is opted out through the schema's object-level opt-out, found in stage 0, or the preset is accepted only if it is inert).

m6. `zainab_laptop` as a `pc` could be solid on the coffee table and block the sofa approach, and may appear in the dungeon graph. Outcome: fixed (non-solid table-top object; the expected lock and key diff allows one unlocked readable node and nothing else).

m7. A reload by day mid-exchange: a cut exchange with one overheard line sets `heard_<knot>` (E9, `complete: false`), so the rest is lost. Outcome: accepted and stated.
