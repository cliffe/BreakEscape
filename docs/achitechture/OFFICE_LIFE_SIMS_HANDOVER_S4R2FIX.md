# Handover: SIMS-4 R2 and SIMS-3 R4 review fixes

Branch `build/ol-sims`, worktree p-ol-sims. Server :3093 stopped; no browsers left running.

## Done

Every finding in OFFICE_LIFE_SIMS_S4_REVIEW_R2_DESIGN.md (2 M, 4 m), _R2_SERVER.md (1 m), OFFICE_LIFE_SIMS_S3_REVIEW_R4.md (1 M, 1 m), the 4570 probe race and the speech-lock re-scope. Outcomes, games and spoken lines are in the build log section "SIMS-4 R2 and SIMS-3 R4 review fixes"; live rows in the README section "SIMS-4 R2 and SIMS-3 R4 fix round live proof". Runs: job beat 5/5, boiler 5/5, cooler 5/5, speech lock once, Neil X close once, e7e9 e7 once; 0 setup failures.

## Open

- Design m3: the flicker dip is not visible in a full-frame screenshot (owner call; WCAG keeps it short).
- Art: a stepladder or tube-swap pose for Jodie at the light; she currently stands at the lockers.
- TTS for five new or changed lines (Jodie 3, Keith 2).
- Office coffee pair: 62 of 66 turns were pictures in the speech-lock run (their own cooldown); not investigated.

## Files

scenarios/test_needs_sims/{scenario.json.erb, README.md, ink/jodie.ink+json, ink/neil.ink+json}; tools/playtest/needs-sims-staff-room.mjs; test/js/{npc-needs-sims-mappings.test.mjs (new), npc-needs.test.mjs, npc-needs-sims-validator.test.mjs}; docs/achitechture/OFFICE_LIFE_SIMS_BUILD_{PLAN,LOG}.md.

## Gotchas

- Do not `game.loop.sleep()` in a probe: two job runs hung until the timeout. Pin values in the page instead.
- `run.sh` in scratch `officelife-sims/s4-r2fix/` uses `timeout 900`; a job beat takes about 9 minutes.
- Game ids jump (another session makes games on the shared DB).
