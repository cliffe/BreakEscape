# NPC squeeze-past: code review round 5 (final)

Scope: ccc2ab83b (timing wording), then one last pass over the whole squeeze-past feature as it stands (`npc-behavior.js`, `npc-sprites.js`, `README_scenario_design.md`, the two test files, `scenarios/test_npc_squeeze_past`).

Counts: B 0, M 0, m 0.

## Checks

- **ccc2ab83b.** Two wording changes only. README line and the scenario brief now both say "roughly 6 s, sometimes much longer", which closes R4 m1. No code touched. The README sentence still matches the code: the opt-out removes only the 2.5 s pass, and the bounded nudge and the must-reach squeeze remain.
- **Pass lifecycle.** `_playerPass` is created only in `_notePlayerBlock`, and cleared in every exit: a move by anyone else or to a new destination (`goToAndStay`), cancel, arrival, hostile reveal, and `_mayPassPlayer()` going false (checked in `_tickPlayerPass` and `_updatePlayerPass`). The collider reads `isPassingPlayer()`, which re-derives `_mayPassPlayer()` each call, so a KO or hostile flip re-enables the body block at once even before the field is cleared.
- **Opt-out.** With `squeezePastPlayer: false`, `_mayPassPlayer()` is false, so `mustReach` is set for a player at the target cell (the older bounded squeeze), `_notePlayerBlock` never starts a pass, and the collider is never switched off. Needs walks without `_stopOnArrival` take the same older route.
- **Time base.** One `time` flows from `update` into `updatePatrol`, `_tickPlayerPass` and `_notePlayerBlock`. No `Date.now` mix.
- **Collider.** `npc-sprites.js` fetches the behaviour once and returns false from the process callback before the push checks; the `routed` lookup reuses the same variable. No behaviour change for NPCs without `isPassingPlayer`.
- **Tests.** `node test/js/npc-local-avoidance.test.mjs`: 66 of 66 pass. `node test/js/npc-player-push.test.mjs`: 11 of 11 pass (at ccc2ab83b).

## Findings

None. No blocker, major or minor defects found in this round.
