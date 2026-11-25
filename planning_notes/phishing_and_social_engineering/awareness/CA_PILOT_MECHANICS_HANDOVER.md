# Handover: CA pilot mechanics plan (draft 1)

The planner stopped at the 150k context limit after writing `CA_PILOT_MECHANICS_PLAN.md`. Done: AGENTS.md, the mission-office-life skill, the lab's disguise, gate and USB-drop wiring, the whole ca12 attack shell, world-play and the call watcher, the kit ownership rules. Not read: the ca15 shell beyond its outline, both defend twins' text, item-drop.js, npc-needs interests code, the awareness cast files, the fun/USP rubric, README_scenario_design.md and README_ink_best_practices.md.

Open checks for the next agent (each is marked **[verify]** in the plan):

1. `scripts/check_door_alignment.py` and the two ca12 room maps: can the lobby sit south of the studio with a north/south door (gates are N/S only, `door-gates.js:17-19`)?
2. Whether `creditOnPass.viaPass` needs `playerMayPassIf` to name a server-owned global (search `games_controller.rb` near `:2065` and the gate server check plan `GATED_DOOR_SERVER_CHECK_PLAN.md`). If so, G2 becomes a server write.
3. Camila's set piece fields in `office_kits/merrin_sallow.json` (`ca12_visitor`, from `:195`).
4. ca15: what `ca15_found_stick` (tarrowby_logistics.json) does today; the ca15 scenario's stages (`:484`), host ink, and whether Nilesh has needs.
5. Whether interests and `npc_used` work with `"npcThoughts": false`; whether CA shells show the capture log.
6. Item-drop: can an NPC hand a dropped item back (the training-room refusal path)?
7. Cast picks with existing atlases (VOICE_CAST.md, HANDOVER.md), checking stock six, seated and pose frames.
8. Defend twins: the `e12_call_tailgater` text and the ca15 defend set's stick wording.
9. Route suites (`scripts/ink_runtime_check/ca12_routes`, `ca15_routes`) and `missions.json` entries.
10. The fun/USP rubric file in the main checkout's `tmp/handover/ac0/`.

After the checks, rewrite the plan as a standalone draft (no "verify" markers left), then start review round 1.
