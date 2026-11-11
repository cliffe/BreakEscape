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

## Sub-slice A, resumed (2026-11-11): A-7 finished; handover

### Done

- **A-7 browser runs W1 to W7 pass** (games 1166, 1171, 1176 on port 3013); report
  `scenarios/test_access_work/reports/2026-11-11_run_w.md`; `PLAYTEST.md` has the W section.
  Leak check clean on 1171 and 1176.
- **W3's task.** Cause confirmed: `safeEvaluateCondition` read an unquoted right-hand side as a
  literal string, so `data.level < data.previous` compared a number with the string
  "data.previous". Chosen: support a `data.`/`globalVars.` operand on the right (an unquoted
  `value`/`name`/bare word stays a literal string, as before; no scenario had one on the right).
  Why: the plan's W3 is "the level eases", and the event carries `previous` for exactly that; a
  literal such as `data.level === 90` would tie the task to W2's `perFail`. Tests in
  `npc-condition-dotted-paths.test.mjs`; README's mapping-condition paragraph and the validator's
  message say so.
- **Ruby 2.7.** The A code used one-line method definitions (Ruby 3); rewritten in
  `npc_frustration.rb`, `access_work.rb`, `npc_frustration_test.rb`, `validate_access_work.rb`.
  The A Rails tests (42 runs) pass on 2.7.8.
- **Settled over a reload** (found in the run): the report queue now takes `settled` from GET
  /scenario on load (`NpcReports.restore`, called in `core/game.js`); test in
  `npc-reports.test.mjs`; live proof in game 1166 (0 requests over a failed use after reload).
- **Scenario fixes**: `w4_cupboard` is an `unlock_object` task (`completesTaskOnOpen` is read only
  for a ransomware display); breaker renamed "Share breaker" (its old name contained the resource
  name, a leak-check finding); every W work station authors `"restores": 10`. Deviation from plan
  11.1, which gives the station affordance without `restores`: with none a use restores 0, so an
  owner works back to back, W1's "about every 15 seconds" cannot hold and W7's kick (which needs
  her resting above `urgentAt`) cannot show.
- Main merged (validate_npc_habits.rb on 2.7.8).

### Open, in order

1. **A-4** validator checks (plan A-4 and section 10), including the Kai "work never succeeds"
   warning; fixtures in `test/js/validator-access-work.test.mjs`. Consider also warning on a work
   station with no `restores` (not in the plan; it caught this scenario).
2. **A-8** documents (plan A-8).
3. **Needs regression captures** (plan 11 point 5) on `test_needs_sims`, `test_npc_needs`,
   `test_needs_leash`, and the watch-it-happen run (11 point 6).
4. **Full suites under the lock**; not run since A-3. Then check the shared-file edits listed in
   the handover (npc-coffee-off's `failed` row, `validate_npc_needs.rb`, the separate withheld-keys
   constant).
5. W2's coffee-sooner assertion was not observed in two runs; U's run not repeated since A.

### Gotchas

- Host Ruby is 2.7.8 (no endless defs, no hash shorthand); `ruby -c` new files.
- The playtest session tag comes from the URL's last number: never pass `?skip_resume=1` to
  `session-start.sh`. To reload, set `location.href` to the game URL with `?skip_resume=1`; a
  plain reload shows the resume overlay and `bootstrap` picks "New Session" (a new game).
- `interact` on a `confirm_action` object may report the close button as the confirmation; click
  `.game-confirm-ok`.
- The test mission row was missing from the dev database; it was recreated as row 243 from
  `mission.json` (no `db:seed`). Leftover games: 1166, 1169, 1171, 1176.

## Sub-slice A, finished (2026-11-11)

### Done

- **A-4** `scripts/validate_access_work.rb` gains `check_work` and `report_lines`, wired into
  `validate_scenario.rb` (the work report prints after the habits report). Errors: a `workNeeds`
  entry (roles and NPCs) or a resource `object` that resolves to nothing, a frustration field out of
  range, a global ending in `_frustration`, `workNeeds`/`frustration`/`workarounds`/`feed` on a
  record that is not a room NPC. Warnings: not admitted (Kai's "work never succeeds"), never
  reachable, undeclared `downIf`, `needsDeferMin` under 0.5 (work plan, or social media with no
  phone), no station that satisfies `work` (naming a `screenOwner` PC), the mutter warning per
  cause, a resource nobody needs with no `contents` or `host`, and the two workaround timing
  warnings ("no warning" unless `noWarning`, more than five minutes of outage). Report: a `Work`
  line per NPC with a plan and a `Workaround` line per workaround (opens, n, tell or no warning,
  honest seconds, earliest by the park floor for an unadmitted NPC, else the use floor; "at once"
  at n = 1; halved for two needs that can fail). 10 new tests in
  `test/js/validator-access-work.test.mjs`. Resource `access` people were already checked by the
  network validator (9.3a), so not repeated.
- **Addition to the plan (orchestrator's decision):** a warning when a work plan's station
  satisfies `work` but its affordance has no `restores`. A missing value makes each use restore
  0, so the owner works back to back; it broke `test_access_work`'s W1 and W7 until the stations
  authored `"restores": 10`.
- **Expected validator output** on `test_access_work`: U3's tray, Kai's "work never succeeds",
  and the `intranet` resource "in no NPC's work list" (it is X3's, sub-slice B; the warning goes
  when Ellis lands). `PLAYTEST.md` says so. The three needs scenarios and the lab raise no new line.
- **A-8** `README_scenario_design.md` ("Resources and work needs", "Outages, failed uses and the
  kick", "What the student sees" with the full pool table, "The validator and the work report",
  before the USB part); `NPC_NEEDS_SYSTEM.md` section 5.9 and the new events in section 7;
  `docs/test-bridge.md` (`work`, `reports`, the new `getState` fields).
- **Needs regression captures**: `docs/achitechture/access_model_needs_baseline/slice_9_2/`
  (before on the base's browser code, after on A). `test_npc_needs` and `test_needs_leash`: 0
  subjects differ. `test_needs_sims`: decision logs identical; 6 timing-only event/global/probe
  differences, inside the run-to-run variance step 9 measured. Verdict in its `COMPARISON.md`.
- **W2's coffee, observed** (game 1185): breaker thrown with Dana's caffeine at 69; three counted
  failures (levels 34, 68 at needs-clock 76 s, 100 at 112 s; three reports, then settled), a
  fourth at 147 s (not sent) drained caffeine to 22, and she used `dana_coffee` straight after, against
  about 10 minutes on her outage-free schedule. Earlier runs reset the breaker after about 90 s,
  three failures, caffeine still above its `urgentAt` 30. `PLAYTEST.md`'s W2 row says to wait
  about 150 s to see it.
- **Shared-file edits checked against `main`** (none of the three has moved on `main`): the
  `failed` row in `npc-coffee-off`'s turn-back table is right (`failed` has `mindChanged: false`);
  `validate_npc_needs.rb`'s desk filter for judged needs matches the engine rule (5.2) and keeps the
  NPC's own `needsHome`; `WITHHELD_WORK_NPC_KEYS` beside `WITHHELD_NPC_KEYS` (which already holds
  `workarounds` from the first slice) merges cleanly with 9.1.
- **Merge repair**: the main merge left the `pc-policy.js` stub inside the
  `requires-item-hint.js` entry of `examine-minigame.test.mjs` and
  `network-links-routing.test.mjs` (a syntax error); moved after it.

### Watch-it-happen run (game 1184, a persona told only "cause trouble and see what the staff do")

Visited W2 (Dana), W4 (Omar), W6 (Ian), W7 (Nia). Noticed: Dana's share line and the blocked icon,
her going towards the coffee station; Omar walking to the printer; the icon over Ian and Nia.
**Did not notice**: any line from Ian or Omar; any "I give up" moment (the fed-up line); Dana
drinking; anything gained (the W4 claim and code were missed, the PC wanted a sign-in); what the
needs bars mean. **Confusing**: the icon stays minutes after the outage is cleared (by design it
follows frustration, which eases 10 per met use, not the outage); W4's and W7's levers both drive
`printer_jammed`, so the second clears the jam the first threw; the wall socket sits under a
chair; the beat signs and task names give the outcome away; the debug overlay labels show
(`needsDebugOverlay` is on in feature scenarios). Questions for the user are in the report back.

### Suites

Full suites under the lock after the last code change: Rails 1340 runs, 0 failures, 1 skip; JS 480 files passed, 0 failed.

### Leftover games

1178 to 1185 (captures, persona, W2), plus 1166, 1169, 1171, 1176. None deleted.
