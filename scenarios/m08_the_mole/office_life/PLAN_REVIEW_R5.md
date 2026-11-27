# m08 office-life plan review, round 5

B 0 / M 0 / m 0

## R4 minors

- m1 fixed and true. SPOKEN_LINES.md now cites `npc-manager.js:25-132`; in public/break_escape/js/systems/npc-manager.js `safeEvaluateCondition` starts at :25 and its `&&` handling ends at :132. The delayed re-check (:925-938, the `fire` closure calling `_handleEventMapping`) goes through `_mappingWouldFire` (:1260), which tests `once`, `maxTriggers`, the 5000 ms default cooldown and the condition, none of which reads the player's room.
- m2 fixed and true. PLAN.md test 6 now says the typing assertion is true by construction (no needs NPCs, so the typist count stays 0) and names `ambienceSuppressed` (office-room-tone.js:123) and an active VM (npc-needs.js:667) as the first suspects if the `lastSlot` control fails. Both lines read as cited; the `typing` writer is office-room-tone.js:137-141.

## Main merge (9575558ea)

`git diff 64b9b69e7 9575558ea` over public/break_escape/js, data, app, lib, scripts and scenarios/m08_the_mole is empty. The merge touched only tts_cache files, scenarios/lab_physical_pentest ink, and .claude/agents/haiku-reader.md. Nothing the plan cites moved, so no cites need re-checking. (Note for the builder: the engine lives under public/break_escape/js/, not js/, so a `js/` pathspec diff silently shows nothing.)

## Findings

None that a builder would trip over.

## Verdict

Ready to build. Q5 stays unbuilt until the user answers.

## Assumptions

- Assumption: an empty diff over the cited paths means the cites hold; I spot-checked the R4 lines only and did not reopen R1 to R3 cites.

## Outcomes

No findings. The plan is ready to build, with Q5 option a (no bark) until the user answers D83.
