# m06 office life: build review R4 (delta)

Counts: 0 blockers, 0 majors, 2 minors.

Scope: `git diff 76218da7e..0c373806f -- scenarios/m06_follow_the_money/` (dungeon_graph ignored), tip `0c373806f`. Inputs read: REVIEW_BUILD_R3.md, LIVE_FIX_R3.md, LIVE_R3_WALKTHROUGH.md. Live checks on a keyless server on :3096 from this worktree (stopped by PID afterwards, nothing left listening), headless, `physics.world.setFPS(20)` with fixed steps on, fresh games 8428, 8429, 8430 (created with `--unlock security_checkpoint --unlock trading_floor`).

## 1. The delta

Scenario change is exactly two edits in `scenario.json.erb`:
- `floor_coffee` `queue.cells` `{dx 2, dy 1}, {dx 3, dy 1}` to `{dx 2, dy 0}, {dx 3, dy 0}` (about line 2144).
- `floor_fridge` gains `"affordance": { "useFrom": { "dx": 1, "dy": 0 } }` (about line 2162); the preset keys are merged, not replaced (LIVE_FIX_R3 read hunger, restores 80, capacity 1, sound back live).

Nothing else in the scenario, no ink, no lock, key, PIN, flag or NPC change. The rest of the delta is documents (BUILD_LOG, LIVE_FIX_R3, LIVE_R3_WALKTHROUGH, REVIEW_BUILD_R3 outcomes) and one script. Result: correct, minimal.

## 2. Print errand when Tomasz is busy: not a defect

The R3 observation ("Tomasz started no print job in 90 s") comes from a wrong expectation, not a lost opening.

Code path:
- `scenario.json.erb:2099`: `conversation_closed:irina_volkova`, `onceOnly`, `condition !globalVars.floor_staff_ko`, `needs: { print: { producer: "floor_copier", forget: true } }`.
- `npc-manager.js:1649` hands the `needs` object to `npcNeedsSystem.control`. `npc-needs.js:1122` to `:1136`: a `{ print }` command "prints as this NPC at once". It calls `_pickProducer` then `_revealOutput` directly (`:1135`). It does not queue a job, does not read `s.job`, and does not wait for the NPC to be idle or at post.
- `forget: true` goes to `_reserve` (`:3991` to `:4020`): `forgotten = true`, `dueAt = null`. `_dueErrand` and `_errandCandidate` (`:4040`, `:4050`) skip forgotten prints, so no fetch errand is ever created. The sheet is meant to be left on the tray. A Tomasz "print job" never exists by design.
- Reveal needs a free copier slot or a recyclable one (`:3906` to `:3925`); a full pool shows a cosmetic copy, which is not the case on a fresh floor. `floor_copier` is off only under `floor_staff_ko`, which the mapping condition already excludes.

Live (the sheet is `tomasz_handover_sheet`, shown when `tomasz_handover_sheet_shown` becomes true):
- Game 8430: Tomasz `caffeine/goto_target/floor_coffee` when the event fired. Next sample: global true, sheet visible and active, Tomasz still on his trip.
- Game 8428: Tomasz `caffeine/using/floor_coffee`. Same result.
- Game 8429: Tomasz, Lerato and Dani all sent to coffee (Tomasz `using`). Same result.
- In 8428 and 8429 the event was emitted a second time one second later: `_prints.size` stayed 1, the sheet stayed one object. `onceOnly` plus the single object make a double print impossible; no engine retry is needed.

Limit of the proof: I could not drive the real Irina conversation in these games. In a game created with only `--unlock` flags the click on Irina landed but opened nothing (`no-effect-confirmed`, then `still-out-of-range` after a room move), so I emitted `conversation_closed:irina_volkova` on `window.eventDispatcher`, the exact event the mapping matches. The mapping, the system command and the reveal ran for real; only the dialogue front end was skipped. LIVE_S4 (game with Tomasz idle, real talk) covers that front end.

Conclusion: no major. The once-only print does not depend on whether Tomasz is busy. No fix is needed to the mapping. See minor m1 for the document wording.

## 3. Walkthrough minors F1 and F2: unrelated to office life

Both objects are byte-identical to main apart from line shifts.
- F1 (`it_onboarding_checklist`, a `notes` object in the `security_checkpoint` list): main `scenario.json.erb:1819` to `1830`, branch `:1842` to `:1853`, no diff. The branch hunks against main (`git diff -U0 main...build/ol-m06`) fall at main lines 273 to 2348 but none inside the checkpoint objects or the custody console; the trading floor additions are at about main 1970 to 2103 and only add floor objects. The "scans on the floor" effect is the two-row room overlap that R3 m2 already documents (`npc-behavior.js:996`, `interaction-walls.js:88`), which exists on main. Not office life.
- F2 (`lock` on `cold_storage_console` returned `ok:false` while the console opened as a container): the console is `lockType pin`, `maxAttempts 1`, `requires fund_slot`, main `:2230` to `:2245`, branch `:2467`, no diff. A pin-lock reply from the test bridge is the engine path, not touched by this build. Reply-only, not a game defect. Not office life.

I did not run main live for these; the claim rests on the object definitions being identical and no engine file in the branch diff for these paths. Say so if live proof on main is wanted.

## Findings

### m1. `LIVE_FIX_R3.md` and `REVIEW_BUILD_R3.md` leave a false open item
`LIVE_FIX_R3.md` ("Observation: coffee pair and Tomasz's print errand") and the last bullet of `REVIEW_BUILD_R3.md` ("Open observation (copier cell blocking the print errand)") present a missing Tomasz print job as an unresolved risk. There is no such job: `forget: true` prints at once and creates no errand. Evidence in section 2. Fix: replace both with one line, "closed R4: the print is an immediate reveal with forget; the sheet appeared with Tomasz going to, and using, the coffee machine (games 8428, 8429, 8430)".

### m2. `office_life/live_r3/q.mjs` is committed but cannot run from the repo
`q.mjs` (commit `0c373806f`) imports `./lib.mjs`, which is only in the build scratch (`live/lib.mjs`); the repo has no `lib.mjs`, no `node_modules` resolution and the helper hard-codes an absolute path to the main checkout and a cached browser binary. In the repo it throws on import. It is probe code that belongs in scratch, like the rest of `live/`. Fix: move it into `tmp/delete/` and stage the removal (not `rm`, not `git rm`), keeping the copy in scratch; LIVE_FIX_R3.md's "Script: office_life/live_r3/q.mjs" line should point to the scratch name or drop the path.

## Other notes (not counted)
- The one-second `security_checkpoint` label on a queuer's step-up (LIVE_FIX_R3 game 8406) is the R3 m2 engine behaviour; the cells are correct. Leave it.
- `LIVE_R3_WALKTHROUGH.md` never exercised office life (it says so). The regression run through step 17 shows the delta did not block the critical path, but a walk with Dani step 9 and the needs-state poll is still owed before sign-off, as that file states.
