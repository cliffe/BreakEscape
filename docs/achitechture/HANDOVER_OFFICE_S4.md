# Handover: office life slice 4, affordance presets (2026-11-06)

**Status: built, unit-tested and committed (aab2943c1); live proof done for the sims scenario (2026-11-06); the leash live run is still open.** Plan:
`OFFICE_LIFE_PLAN.md` 2.1 (Built line lists the choices made without asking).

## Done
- `systems/office-presets.js` (resolver, sprite cache, fetch) and the table
  `public/break_escape/js/data/office-presets.json` (under `/js` because the engine routes only
  `/js`, `/css`, `/assets`). `core/game.js` installs `window.officePresets` and fetches the table
  before `installNpcNeeds`. `npc-needs.js` (`describe`, `listObjects` skip test) and
  `npc-action-icons.js` (`targetInfo`) resolve through it. No static imports added, so no harness
  copy lists changed.
- Validator: `validate_npc_needs.rb` expands presets before every check, lists
  `ℹ️ Office preset: ...`, errors on an unknown `officeType`, warns on `officeType` without the
  switch; it also no longer crashes on `affordance: false`. Schema: `officePresets`, `officeType`,
  `affordance` may be `false`. `validate_scenario.rb` known fields.
- Tests: `test/js/office-presets.test.mjs` (14, incl. the sims parity run, byte-identical over a
  15-minute day), `test/js/validator-office-presets.test.mjs` (6, incl. Ruby/JS agreement).
  Fixture `needs-sims-world.mjs` gains `PRESET_OBJECTS` and `{ presets }`. Suite: 386 files pass.
- `test_needs_sims`: `"officePresets": true`; PCs keep only `private` (Amara also `accepts`),
  laptops `affordance: false`, the coffee points and kettle keep only `useFrom` (the explicit
  overrides that win), the fridge, microwave, cooler and sofa have no affordance at all. New task
  `hear_snack` (`npc_use_heard:*` with `eat_snack`).
- Docs: plan Built line, header and slice table; `NPC_NEEDS_SYSTEM.md` 3.2 and 3.5.
- Live, game 599 (session log `tools/playtest/test_needs_sims-s4-session.jsonl`, results
  `scratchpad/s4/live-599*.json`): office objects resolve to presets, decor laptops and
  `grace_laptop` do not; no workstation globals; contention unchanged (278 amara office_coffee);
  Amara at (238,251) using the coffee at (269,277), i.e. from the left (own `useFrom`);
  `hear_drink` completed from the preset's default sound. Screenshot
  `scratchpad/s4/office-coffee-own-usefrom.png`.

## Open
1. **DONE 2026-11-06 (game 601): kitchen and lounge live check, and the README slice 4 table.** Original note: Both live scripts
   (`scratchpad/s4/live.py`, `leash.py`) were blocked by the "Welcome to Hacktivity Games"
   tutorial modal: every `enter` returned `blocking-ui`, and `__test.dismissBlockingUi?.()` in an
   eval did not clear it. Click `#tutorial-no` first (or use the harness's dismiss command), then
   re-run `python3 live.py <game>` on a fresh `test_needs_sims` game: expect `hear_snack`,
   `see_meal` and `see_long_way` to complete, and kitchen/lounge objects in the preset probe
   (compare with the validator's 10-object list). Then add a "Slice 4" table to
   `scenarios/test_needs_sims/README.md`.
2. **OPEN, inconclusive: `test_needs_leash` live regression** (games 602, 606, 617 at about 1 fps: Ravi fails the far-cooler job on its 20 s deadline and jitters at (205,144); needs a re-run when the machine is quiet; unit tests pass). Original note: (game 600 was blocked by the same modal; Ravi never
   moved). Re-run `leash.py` after dismissing it: expect the long way, 0 samples on Maya's floor.
   The leash scenario has no `officePresets`, so the resolver returns its authored affordances.
3. **`lab_physical_pentest` regression skipped**: another agent was dressing the accounts floor
   (commits every ~20 minutes). Static check: the lab has no `officePresets`, and the validator
   finds no preset and no error there.

## Gotchas
- The modal is plain DOM shown 1 s after load on every new game in a fresh browser profile (nothing
  stored yet). `dismissBlockingUi()` with no label refuses when there are two buttons
  (`ambiguous-blocking-ui`): call `bootstrap {"tutorial":"decline","resume":"new"}` or
  `dismissBlockingUi("No")`. The s4 scripts never called `bootstrap`.
- Under heavy load (about 1 fps) `enter` replies `door-did-not-open` or `did-not-cross` and the room
  changes minutes later; check `window.rooms` rather than the reply, and give `cmd.sh` long timeouts.
- A new game shows the tutorial modal and the needs clock barely moves until it is dismissed.
- `enter` returns `{ok:true, result:{ok:false, reason}}`: check `result.ok`.
