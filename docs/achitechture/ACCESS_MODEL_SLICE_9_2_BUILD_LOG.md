# Access model slice 9.2: build log

The build of `ACCESS_MODEL_SLICE_9_2_PLAN.md` (cleared at review round 5). Each entry says what was
built and every place the build had to depart from the plan because the code had moved or the plan
did not fit it, with the smallest faithful adjustment made.

## Sub-slice U: the USB policy (2026-11-10)

Built: `systems/pc-policy.js` (new, sets `window.pcPolicy`); in `npc-needs.js` the refusal at the
end of a carry (`_refuseUse`: `npc_use_refused`, the `usb_refused` mutter, the move to the next
accepting object that does not refuse the class, else the put-down and the `s.refused` memory),
`mutter(npcId, topic)`, `_grumble`'s options argument, the `usb_refused` picture, and `usbClass`
and `usbPolicy` in `describe`; the plant decision in the `requiresItem` branch of
`interactions.js`; the schema's `usbClass` and `storage_blocked`; `scripts/validate_access_work.rb`
(new) with the USB checks; `scenarios/test_access_work` with beats U1 to U3, its `PLAYTEST.md` and
the run report `reports/2026-11-10_run_u.md` (all three beats pass, no leaks); the "USB policy"
section of `README_scenario_design.md`.

Adjustments:

1. **The carried device's class is read at pick-up.** `_completeJob` cannot describe a carried item
   in the node stub (it is out of the world), so the class is stored on the job when the item is
   picked up (`job.usbClass`). The target's `usbPolicy` comes from `describe` as the plan says.
2. **The refusal table is copied into `npc-needs.js`** (`usbRefusedBy`), as `requiredGlobalsHold`
   is, because the file imports nothing; a test checks it agrees with `pc-policy.js`.
3. **`pc-policy.js` has no apostrophes.** Four node tests (`examine-minigame`, `interaction-warning`,
   `minigame-launch-routes`, `network-links-routing`) load `interactions.js` with every import
   replaced by a `data:` URL inside a single-quoted specifier; they now inline the real
   `pc-policy.js` that way, which an apostrophe would break. The file says so at its top.
4. **One tag per beat in `test_access_work`.** A refused NPC carries the device on to any loaded
   object that accepts its tag (plan 7, step 2), wherever it is, so Priya's stick would have gone
   to Lena's kiosk. Each beat's NPC has its own tag (`dev_usb`, `vault_usb`, `post_usb`) and the
   lobby has one device per beat, named for it.
5. **Expected validator output.** U3's tray is the plan's own "an item with `usbClass` accepted by
   an object the policy does not govern while the default blocks its class" warning (section 10),
   so the scenario raises it by design; 11.1's "nothing else" is read as "nothing else
   unexpected", and `PLAYTEST.md` lists it.
6. **The needs regression captures** (11, point 5) are made once, at the end of sub-slice A, over
   both sub-slices' needs changes, rather than twice.

## Sub-slice A: work, outages and frustration (2026-11-10, parked part way)

Parked at the user's request mid-way through A-7. Branch `build/9-2-u-a`, base `f86912dd4`.

### Built and tested

- **A-1** `lib/break_escape/access_work.rb` (the resolver: work list, frustration, workarounds,
  can fail, use times, desk rule, places, shortest use time, owned causes, belongs-to, floors);
  schema and known-field lists for every section 4 field. `test/unit/access_work_test.rb` (13 runs).
- **A-2** `compile_npc_plan!` (room NPCs gain `work`), `WITHHELD_WORK_NPC_KEYS` (a separate constant
  beside `WITHHELD_NPC_KEYS`, to merge cleanly with 9.1), `npcFrustration` in
  `ACCESS_STATE_DEFAULTS`. `test/models/break_escape/access_work_plan_test.rb` (9 runs).
  `roles` and `resources` were already withheld from the bootstrap by 9.1 and 9.3a.
- **A-3** `app/models/break_escape/npc_frustration.rb` (a concern included in Game: report checks,
  floors, tell, settled, `npcFrustration` for GET /scenario with `hold`), the route, policy, lock
  list, `set_game` list, `metAt` from `track_npc_encounters`.
  `test/controllers/break_escape/npc_frustration_test.rb` (20 runs, every A-3 case listed in the
  plan plus the no-exposure test over the routes that exist). R5 n1 (gate after an off-only fail),
  n5 (no ease at the own station while an owned cause holds) and n6 are folded in. R5 n2 is
  followed: `metAt` is written for any NPC that can fail or has a feed; check 1 is
  `encounteredNPCs`.
- **A-5** `systems/npc-work.js` and the needs core (failed turn-back, dead-station off park, desk
  filter, failure wakes, R5 n4, re-arm, kick, pools, check visits, `applyFrustration`,
  `restoreFrustration` with the held park less elapsed time, R5 n3). `test/js/npc-work.test.mjs`
  (3), `test/js/npc-needs-work.test.mjs` (19), fixture `test/js/fixtures/needs-work-world.mjs`.
  `npc-coffee-off.test.mjs` updated: the turn-back table now lists `failed`.
- **A-6** `systems/npc-reports.js` (queue, 2 s pacing, 20 max, settled, forced sync, stale resend),
  `ApiClient.npcFrustration`, install in `core/game.js` (plus a static import of `npc-work.js`), the
  blocked icon by tell with its pulse, work icon on a visit, no bubble for `held`, the debug F bar,
  `window.__test.access.work()` and `reports()`, `verify-run --access` prints `npcFrustration`.
  Tests: `npc-reports.test.mjs` (4), additions to `npc-action-icons`, `npc-needs-debug`,
  `test-bridge-access`, `playtest-verify-run-access`.
- Last full Rails run (after A-3): 1340 runs, 0 failures, 1 skip. Node: every `npc-*`,
  `office-*`, `*needs*` and `workstation*` file passed after A-5 (645 tests); the full
  `bin/test-js` and `bin/rails test` have **not** been run since A-5 and A-6.

### Half done

- **A-7** `scenarios/test_access_work` has the W1 to W7 rooms (halls A to C west of the lobby),
  roles, resources, the default mutter pools and one task per beat (commit `WIP: ...`). Browser
  run on game 135 (port 3017): **W1 pass** (Amy's use met, task done); **W2 pass** (Dana 34, 68,
  100; "Share's down again." twice then the fed-up line; tell 1 then 2; 3 report requests; client
  marked her settled). **W3** half passes: after the breaker reset Dana's met uses eased her 100, 90, 80 ... 0 in steps of 10 (13 report requests in all, server record `dana level 0.0`), but the task `w3_eased` did not tick: its mapping condition `data.level < data.previous` compares two data fields, which the mapping condition evaluator probably does not support. Rewrite it (for example `data.level <= 90`) and re-run. W4 to W7 not
  run. `PLAYTEST.md` has no W section yet and no run report for W exists. Leak check and
  `verify-run` not yet run on game 135.

### Not started

- **A-4** validator checks for A (`scripts/validate_access_work.rb` has only the USB checks): the
  errors and warnings of section 10 for A, the Kai "work never succeeds" warning, the mutter and
  station warnings, the `needsDeferMin` warning, the report lines, and their fixtures in
  `test/js/validator-access-work.test.mjs`.
- **A-8** documents (README "Work, frustration and workarounds" beyond the USB part,
  `NPC_NEEDS_SYSTEM.md`, `docs/test-bridge.md`).
- The needs regression captures (deferred from U to the end of A) and the watch-it-happen run.
- The leak scanner gains nothing in A (its new secrets are B's and C's).

### Known problems and deviations

- The validator on `test_access_work` does not yet print the Kai warning (A-4). It does raise:
  Dana's two `npc_frustration_changed` mappings (intended), `pat_pc` owned by `temp_user` who has no
  needs and sits in another room (H2's design), the finance share having an access list but no
  network (9.3a's warning; the scenario has no networks), and U3's tray warning.
- `validate_npc_needs.rb` now drops other NPCs' desks from a judged need's targets (and lets a
  `social_media` need have no object), so the "target in another room" warnings do not flood a
  scenario with work plans. Small, but a change to an office-life validator.
- The W rooms use a linear layout (halls A, B, C) rather than one hall with array connections,
  which overlapped rooms in the layout check.
- A-5 `_completeJob` judges a use only when the adapter has `useVerdict`; the adapter answers met
  until `window.npcWork` is loaded (now imported statically by `core/game.js`).
- W2's "coffee sooner than her outage-free schedule" was not asserted in the browser run.

### Exact next steps

1. Run `bin/test-js -j 3` and `bin/rails test`; fix anything the A-5 and A-6 changes broke.
2. Write A-4 (section 10's A checks and report lines, with fixtures).
3. Finish A-7: new game, run W1 to W4 with a reload after W4, then W5 to W7, each with
   `verify-run --access` and `access-leak-check.rb`; write the W section of `PLAYTEST.md` and a
   run report in `scenarios/test_access_work/reports/`; re-run U; the needs regression captures.
4. A-8 documents, then commit and report.
