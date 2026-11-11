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

## Review round 1 outcomes (2026-11-11)

Reviews: `ACCESS_MODEL_SLICE_9_2_UA_CODE_REVIEW_R1_SERVER.md` and `..._R1_CLIENT.md`.

### Orchestrator decisions

- **Server M2**: borrow PCs are left out of an NPC's places, its "can fail" and the causes that
  belong to it for the whole of sub-slice A. They come back with H's hand-over (a handed-over
  `borrow_session` only). A report naming a hidden borrow PC is answered exactly as one naming any
  other NPC's PC (`refused`), and writes nothing.
- **Client m8**: W7 gets its own printer resource and global, so the W4 and W7 levers no longer
  clear each other.
- **Client m7** (the blocked icon lingering after the outage): the user's decision. The behaviour
  stays as plan 5.5 specifies.

### Server review

| Finding | Outcome |
|---|---|
| M1 unbounded `missing` | Fixed. A report with more than 20 `missing` entries is refused unread; repeats (same `id` and `why`) are removed, then more than 8 is refused (`npc_frustration.rb` `MAX_MISSING`, `MAX_CAUSES`). A request body over 64 KB is answered 413 before any report is read (`games_controller.rb` `NPC_FRUSTRATION_MAX_BYTES`). The object index is built once per scenario hash inside `AccessWork.with_index` (identity-compared, thread-local, dropped when the block ends), used by the report route, the GET block, `note_npcs_met!` and the room filter; `places` and `shortest_use_seconds` wrap themselves. Tests: 21 and 9 distinct causes refused, a repeated cause counted once, the reviewer's 840 KB body answered 413, a full batch of 21-cause reports answered in well under a second, the index built once inside the block |
| M2 borrow PC oracle | Fixed as decided above (`access_work.rb` `places`, `can_fail?`, `cause_belongs?`; `borrow_pcs` kept for the validator's mutters check). Tests: the four borrow-PC reports (locked_out, off, object_id, ease) give answers identical to the same reports naming `amy_pc`, and no `easeAt` is written; an NPC whose only failure is a borrow PC's `offWhen` answers as one with none. Plan 9.1 "Can fail" and "Belongs to the NPC" now say "a PC a handed-over `borrow_session` names" |
| m1 R5 n1's halved bound | Fixed. `workaround_timing` halves the park-floor figure when the station has an `offWhen`; plan 9.3 has the sentence. Test in `validator-access-work.test.mjs` |
| m2 "only by alternating" and the `[]` route | Fixed. `earliest_pace` classifies: an owned cause with no ease place but the station (or not admitted) is held to the park floor; an owned cause with a non-desk place gives the use floor with the note "only by alternating eases and fails"; no owned cause gives the use floor. Tested |
| m3 resource with only `network` or `observations` | Fixed: neither is called unused. Tested |
| m4 malformed `roles` entry | Fixed. `roles_block` keeps only object values; `note_npcs_met!` has its own `rescue` in `track_npc_encounters`, so a resolver fault cannot cost the encounter record. Unit test for a list and a string role |
| m5 test gaps | Fixed: R5 n5 (locked out: an ease at the station refused, at a non-desk place accepted); `tell` with a workaround at or below `perFail` (tell 1 in A, see n6); `hold` after an ease (the use-floor branch); the use floor at its boundary on the ease gate and the fail gate (whole seconds, as `travel_to` drops sub-seconds); malformed bodies (not a list, empty or non-hash causes, `missing` not a list, `rearmed` as a string) |
| m6 `social_media` with `"phone": false` | Fixed: the skip applies only with a phone; `validate_npc_needs.rb` now requires the resolver instead of testing `defined?`. Test in `validator-npc-leash.test.mjs` |
| n1 `metAt` unread | Comment says it is kept for C's feed and the verify-run report |
| n2 plan from the room copy | Fixed: `compile_npc_plan!` builds from `scenario_room_npc` |
| n3 `preset_id`, `desk?` against the JS | Comments added on both differences (harmless for every real object) |
| n4 `perFail` inferable | Plan 9.2's table now says so; code unchanged (W3 needs `previous`) |
| n5 ease at level 0 | Fixed: answered with the level, nothing written (no entry for an NPC that never failed). Tested |
| n6 `tell` after a passed `at` in A | Comment in `frustration_tell` for sub-slice B; tested |
| n7 GET writes defaults | Fixed: `npc_frustration_for_client` reads through `frustration_view`, a copy |

### Client review

| Finding | Outcome |
|---|---|
| m1 visit to own `needsHome` leaves the post | Fixed: `_atOwnPost` counts a visit to the own home object (no wind-up, no `npc_left_post`, no move). Node test, checked to fail without the fix |
| m2 report queue loads after the needs system | Fixed: `npc-reports.js` is a static import in `core/game.js`; the reporter is installed and `restoreFrustration` applied in the same task as `installNpcNeeds`, before any tick |
| m3 ease skipped while the mirror says 0 | Fixed: a sent fail marks the need (`failSent`), so the next met use reports an ease even at 0, once; any answer clears the marks. `reset()` keeps each NPC's frustration, tell and settled. Tested |
| m4 `previous` from the mirror | Fixed: the answer's `previous` when it is a number, else the mirror. Tested |
| m5 `off` park on a non-station source | Guard added (`_select` counts an `off` give-up only at the NPC's own station). Not reachable today: `_giveUpReason` answers `off` only for the dead own station (`npc-needs.js` `_giveUpReason`, first lines), so an off kiosk already parks as `no_source`. Test asserts the kiosk is never a counted fail |
| m6 settled re-set after a queued ease | Fixed: each queued report carries a sequence number (stripped before sending); a `settled` answer to a report queued before the NPC's last ease is ignored. Tested with a fail in flight |
| m7 icon lingers | Left for the user (decision above) |
| m8 W4 and W7 share one global | Fixed as decided: resource `printer_w7` (no `object`, so no check visit), global `printer_w7_jammed`, W7's lever and confirm text name the slow room printer. Browser rerun below |
| m9 test gaps | Added: `installNpcReports` (one listener, wildcard name, payload name, idempotent), `watchedGlobal` (plan globals, string and object `offWhen`, an NPC with no work), a rejecting `send` (the queue keeps going), the kick waiting while the home is provisional, R5 n3's hold less the elapsed time, the `requiresItem` refusal branch in `interactions.js` through the `interaction-warning` harness (refused: line, `usb_refused`, no action, nothing consumed; accepted: actions and the remove with `usedOn`), a visit to an NPC through `cellBeside` |
| m10 tempted failed job | Fixed: a `failed` turn-back parks (and counts) even on a tempted job. No test: a tempted `work` job needs a magnet rule no fixture has; deferred to C, where `social_media` can be tempted |
| n1 `npc_visit_dropped` for checks | Plan 5.3 now says a dropped check emits it too |
| n2 `breakDrain` default and cap | Documented in `NPC_NEEDS_SYSTEM.md` (10 with no plan, at most 50) |
| n3 F bar at level 0 for `social_media` | No change; noted for C |
| n4 `usbPolicyFor` on every describe | Deferred: cheap now; cache only if profiling points at it |
| n5 failure park badge | Documented: a failure park shows `closed`, as `no_source` does |
| n6 determinism test uses tell 1 | Comment in the test naming the limit |
| n7 signs and overlay give the outcome | Deferred: fine for scripted runs; a persona toggle is test-floor work for a later round |
| n8 W6 socket under a chair | Deferred: needs a render pass on the test floor; not touched in this round |

### The client reviewer's five server items

1. **Plant records bypass the USB policy**: fixed. `CaptureProofs#record_planted_item!`
   (`capture_proofs.rb:38`) refuses to record a plant that `AccessWork.plant_refused?`
   (`access_work.rb`, the same table as `pc-policy.js`) refuses, whatever the browser decided.
   Test: storage on a `storage_blocked` workstation and hid on a `blocked` PC record nothing; hid on
   `storage_blocked` records the plant.
2. **`rearmed`**: grants nothing beyond the documented bound. It is read only at
   `npc_frustration.rb:212` (`gate ||= rearmed && owned.empty?`), and only lowers the next fail's
   floor from the park floor to the use floor when no cause the server owns holds. In that case
   every cause is one the browser controls (it writes the globals), so the use floor is the bound
   the plan already states and the validator reports as "earliest by a modified browser". With an
   owned cause it is ignored (tested).
3. **`<npcId>_frustration` globals**: grant nothing. The browser writes them as a mirror
   (`npc-needs.js:2100`); no server code reads a global with that suffix (grep of `app/` and
   `lib/`: none), the server's record is `npcFrustration`, and the validator forbids authoring a
   global with that suffix (`validate_access_work.rb:261-265`), so no server-checked condition can
   name one. Client writes are not refused: a refusal would mark the sync `notSaved` and resend it.
4. **The reload `hold`**: client-only by design (`npc-needs.js:2127`); the server's pace floors
   (`npc_frustration.rb:188` for eases, `:205` for fails) are the control and are tested.
5. **Tasks from needs events**: as every mapped task, they complete from client events. In
   `test_access_work` they only tick feature-test tasks; no capture, access decision or server
   check reads them. Nothing to change.

### Browser rerun (game 1187, port 3013)

W7: Nia's first use, then the slow room lever ("Jam the slow room printer?"): `npc_use_failed:nia`
names `printer_w7` `down`, level 20, the printer line, `w7_failed`; `printer_jammed` stayed false.
W4: the copy room lever jams `printer_jammed`; Omar fails, `npc_checked:office_printer` once,
`w4_checked`; `printer_w7_jammed` stayed true. Clearing it: Omar's next use eases 20 to 10 with
`previous: 20` from the server. W2 and W3: the breaker off, Dana 0 to 34 (tell 1), `w2_failed`;
back on, 34 to 24, `w3_eased`. Reload of 1187 with `?skip_resume=1`: Nia 100 settled, Dana 24,
Omar 0, `printer_w7_jammed` still true, tasks kept; Nia failed again after the reload with 0 report
requests. `verify-run.rb --access` 1187: dana 24, nia 100, omar 0. `access-leak-check.rb`: no
leaks. Gotcha: `location.reload()` drops the query string (the page rewrites its URL), so the
first reload showed the resume overlay and the harness pressed "New Session" (game 1188); navigate
to `/games/<id>?skip_resume=1` instead.

Leftover games: 1187, 1188. None deleted.

### Suites after review round 1

Under the lock after the last code change: Rails 1352 runs, 0 failures, 1 skip; JS 480 files passed, 0 failed.

## Review round 2 outcomes (2026-11-11)

Reviews: `ACCESS_MODEL_SLICE_9_2_UA_CODE_REVIEW_R2_SERVER.md` and `..._R2_CLIENT.md` (no blockers,
no majors). Commits: `b7a5e277f` (server), `9e2cfea46` (client), and this log.

### Orchestrator decision

- **Server m2, `locked_out` in A.** Refused in sub-slice A. A fail listing `locked_out` (alone or
  beside other causes) answers `refused`, and the server passes no lockouts to `owned_causes`, so a
  `loginLockouts` entry changes nothing in A: the own station eases and `rearmed` keeps the use
  floor. The browser sends no `locked_out` in A. Sub-slice L adds the cause back behind its `check`
  record (only lockouts that record confirms), which is the leak decision 14 accepts; L's reviewer
  should treat that as the first exposure, not a regression. `REFUSED_IN_A_WHYS` in
  `npc_frustration.rb` marks the place.

### Server review

| R2 | Outcome |
|---|---|
| m1 `""` global makes `down` hold | Fixed: `down` holds only for a resource with a non-blank `downIf`. Tested |
| m2 `locked_out` ahead of L | Fixed as decided above. The old W5 `locked_out` and R5 n5 tests are rewritten: R5 n5 now uses `social_blocked` (station ease refused, kiosk ease accepted); a new test covers the lockout in A |
| m3 work eases for a `[]` route | Fixed: a `work` ease is refused when an owned `no_access` or `unreachable` holds (both hold at every place). `earliest_pace` treats both alike, so the "only by alternating eases and fails" note is no longer printed for work; plan 9.1, 9.3 and 10 updated. Tested (server and validator) |
| m4 test gaps | Added: the worst batch the bounds allow on 400 extra objects (timed, under 2 s; the M1 test's message now matches its bound); `build_object_index` called once across one full request; the `""` global; a plant on an ungoverned object under a blocking `defaultPolicy` is recorded; after a fail listing `off` and an owned cause, the next such fail is held to the park floor |
| m5 objects in locked rooms | Fixed: the report path keeps only places in the start room or `unlockedRooms` (`frustration_places`), so a hidden object answers exactly as a made-up id. Plan 9.1 updated. Tested, including that the object becomes a place once its room opens. The reset test now re-opens `office` after a reset |
| n1 cap after parsing | Fixed: `prepend_before_action :refuse_oversized_npc_frustration` reads only `Content-Length`, before `set_game` parses the body |
| n2 reason too strong | Corrected: the round 1 answer to client item 3 ("no server-checked condition can name one") was wrong. `unlock_condition_met?` reads any global by name, so an aim or task `unlockCondition` on `<npc>_frustration` is a client-decided gate, like any client-written global; it adds no new hole. The validator now warns for such an `unlockCondition` and for an event-mapping `condition` naming one. Tested |
| n3 validator re-implements USB rules | Fixed: the validator calls `AccessWork.usb_governed?`, `usb_policy_for` and `plant_refused?`; the effective policy name uses `present_string?` |
| n4 preset table memoised | Comment added |
| n5 floats in levels | Fixed: a whole level is stored and answered as an Integer |
| n6 phone ease unconditional | No change, as the reviewer says; noted for sub-slice C |

### Client review

| R2 | Outcome |
|---|---|
| m1 restore fires a rise from 0 | Fixed: `_applyRestored` sets the mirror, `tell` and `settled` with no `npc_frustration_changed`, and writes `<npcId>_frustration` only when the saved global differs. Plan 5.4 updated. Tested; one existing test that expected the restore event now asserts none |
| m2 seating unseats on an own-desk visit | Fixed (small): `needsStop` treats a `visit` job at the home object like a `use`. `needsStop` unit test for each phase |
| m3 guard reads `s.home` | Fixed: compares with `_stationId(s)` (`needsHome`). Tested with a provisional home; the test fails without the fix |
| m4 test gaps | Added: R1 m10 (a tempted failed work job parks, counts, reports once); a source test over `core/game.js` that fails if `npc-reports.js` or `npc-work.js` becomes a dynamic import or the restore moves behind a `.then`, `await` or timer; the restore event; `breakDrain` authored (30) and capped (80 gives 50) |
| m5 a cut-short visit is neither done nor dropped | Fixed (contained to `_abortJob`): a visit job that ends without completing (deadline, turn-back, any abort but `reset()`) emits `npc_visit_dropped` with a `reason`, and a check visit frees its resource. Plan 5.3 updated. Tested |
| n1 `failSent` cleared by any answer | Deferred to sub-slice B: self-healing (costs one ease at most), and B reworks answer handling for `run` |
| n2 `reset()` keeps no `failSent` or held parks | Comment added |
| n3 pending answer applied under the restore | Fixed: restored entry first, then the pending answer. Tested |
| n4 `stateIconEntry` returns null | Deferred: harmless while `blocked` is built in |
| Server items 1 to 7 | As round 1; item 2 now also covered by the n2 validator warning; item 5 (NPC USB decisions) is for the sub-slice that ties anything to an NPC plugging in |

### Browser check (game 1189, port 3013)

`test_access_work` from `share_room`: the breaker thrown, Dana's first fail answered level 34 (an
Integer). Navigated to `/games/1189?skip_resume=1`: the needs log shows one `frustration` entry
for Dana at load, level 34, `restored: true`, and the event log has no `npc_frustration_changed`
for it; her later rises carried `previous` 34 and then 68 from the server. Gotcha: with
`?skip_resume=1` in `--url`, `session-start.sh` takes the session tag from the trailing `1`, so
drive that session as `cmd.sh 1`. Leftover game: 1189.

### Suites after review round 2

Under the lock after the last code change: Rails 1360 runs, 9992 assertions, 0 failures, 0 errors,
1 skip; JS 481 files passed, 0 failed.

## Sub-slice B: workarounds, part one (2026-11-11, split at the context limit)

Branch `build/9-2-b`, from `main` with U and A merged.

### Done

- **B-1 server** (`3a315afb2`). `npc_frustration.rb`: after each counted fail `choose_run!` hands
  over at most one workaround (the first lasting one in force, neither done nor handed), records
  `hands`, `handed[index] = { hand, time }` and answers it as `run` (`{ index, hand, do, dwell }`
  plus whichever of `pc`, `with`, `door`, `prop`, `event` it authors). `complete_npc_workaround!`
  runs the plan's checks in order (known NPC; the last spent hand again gives the same body,
  recomposed, nothing written; handed and unspent, else 403; the dwell, else 425), spends the
  hand into `lastSpent`, adds lasting ones to `done`, sets a declared `setGlobal` true in
  `player_state.globalVariables`, and answers `writes_down` `{ pcId, hasPostit: true }`,
  `prop_door` `{ roomId, roomData }`, `emit` `{}`, each with `setGlobal` when declared. Dwells:
  writes_down 6 s, prop_door 4 s, emit 0. `tell` now counts a workaround in force (level at or
  above `at`); `settled` also needs no lasting workaround still to hand over.
  `GET /scenario`'s block carries `pending` (run descriptions) and `done` (`{ index, do,
  setGlobal }`). `Game#written_down?` adds a done `writes_down`. Controller: `npc_workaround`
  (locked, in a transaction), `serve_opened_room` (the door unlock's tail, shared with
  `prop_door`, so the room's NPCs are encountered at once); route and policy. Tests:
  `test/controllers/break_escape/npc_workaround_test.rb` (16 runs: every B-1 case in the plan
  plus the role-list case and an undeclared `setGlobal`).
- **B-2** (`d42dbeb5d`). `validate_access_work.rb` `check_workarounds`: errors for `at` bounds,
  unknown `do`, undeclared `setGlobal`, `pc`/`prop`/`door`/`with` that resolve to nothing, emit
  with no event, writes_down with no account or no sign-in `needsHome`, prop_door to a room not
  locked, behind a gate door or the NPC's own, a prop inside the door's room or in a room not
  connected to it. Warnings: an NPC that can never be frustrated, writes_down over an authored
  `postitNote` or `showPostit: false`, what it opens holding a `flag-station` or `vm-launcher`,
  prop_door through a door the NPC's own card and role do not open, a prop in a room the leash
  forbids, a missing start pool (`wk_writes_down`, `wk_prop_door`, `wk_borrow`,
  `wk_share_login`; none under `"chatter": false`). The report lines were already A's
  (`prop_door` says "stays open for the mission"). Graph: `workaround_<npc>_<i>` action nodes
  with edges to the sign-in (writes_down, share_login), the PC (borrow_session) or the door
  (prop_door); `outage_<global>` gate nodes (a work resource's `downIf`, the station's
  `offWhen`) with edges to each workaround. Tests: 7 in `validator-access-work.test.mjs`,
  `dungeon-graph-workarounds.test.mjs` (3).
- **B-3** (`3aa7a0d9e`). `systems/npc-workarounds.js` (new; `installNpcWorkarounds` in
  `core/game.js`, static import, installed before `restoreFrustration`; `ApiClient.npcWorkaround`).
  The needs system adds `level` to `npc_workaround_due`, emits it for each `pending` run when a
  restored NPC registers (and for a run in an answer that arrived before registration). Review R2
  client n1 (an answer to a fail clears only that need's `failSent`; `npc-reports.js` tags each
  answer with `forEvent` and `forNeed`) and n4 (`stateIconEntry` falls through with no `blocked`
  icon) are done. Tests: `npc-workarounds.test.mjs` (13, stub API plus the needs fixture).
- **B-4 tooling** (`ef6fbfbd6`). The leak scanner's `workaround` rule (a hash with a
  workaround's kind beside its own target, anywhere but a `run` in a `/npc_frustration` answer or
  `pending`/`done` in GET /scenario), and its count in `access-leak-check.rb`; unit test.
  `verify-run --access` already printed level, handed and done.

### Adjustments

1. **Sub-slice H's kinds are invisible in B.** `borrow_session` and `share_login` are ignored by
   `run`, `tell` and `settled` (`PERFORMED_KINDS`), so a scenario that authors one gives no
   warning for a workaround that cannot happen yet. Two A tests changed with it: the tell test
   now uses an `emit` at 50, and the "at or below perFail" test now expects tell 2 and a run.
   A new test checks Dana's fixture borrow gives no run and tell 1. The runner gives back any
   kind it does not perform as `dropped`.
2. **A repeated `dropped`** for an already spent hand answers `{}` again instead of 403, so a
   lost answer to a drop is harmless. It writes nothing.
3. **`setGlobal` travels in the "done" answer** (and in the `done` list), so the client sets it at
   the same moment as the server. A global name is not secret (plan 9.2).
4. **`settled`** also waits for a lasting workaround in force that is not yet done: the plan's
   wording ("nothing handed over and waiting") would otherwise settle an NPC at 100 with a second
   workaround that a further failure would hand over.
5. **The probe.** The unproven engine path is a visit to a prop hidden by `revealOnGlobal`. Read,
   not yet run: `_visitPlace` uses `world.getObject`, which finds hidden sprites (only use
   targets skip `_hidden`). X2 in the browser is the proof still owed.

### Handover: open, in order

1. **Scenario beats X1 to X4** in `scenarios/test_access_work` (plan 11.1): `note_room` (Mei Lin,
   `mei_pc` with `lockChance: 1`, resource `rota` with a switch, `writes_down` at 50, her profile
   holding the `records_nook` door code), `store_lobby` (Tom Fletcher, role `facilities`, a card;
   `store_room` behind an rfid door admitting `facilities`, Una Walsh inside; `store_wedge`
   hidden on `store_door_propped`, declared), `event_room` (Ellis Ward, `+intranet`,
   `perFail: 50`, `emit` `ellis_gave_up` with `noWarning`, mapped to a task). Add `wk_writes_down`
   and `wk_prop_door` lines to the top-level `chatter`. One task per beat; signs; `PLAYTEST.md`
   X section with request budgets. After X3 lands, the `intranet` "in no NPC's work list"
   warning should go.
2. Validator on `test_access_work` (expected: U3's tray, Kai, nothing new), the three needs
   scenarios and the lab.
3. Browser run on port 3015 (own keyless server, started by hand as `start-keyless-server.sh`
   does, stopped afterwards): X1 to X4 with both X4 reloads, `verify-run.rb <game> --access`,
   `access-leak-check.rb`, a run report in `scenarios/test_access_work/reports/`. Then the needs
   regression captures (plan 11 point 5) on `test_needs_sims`, `test_npc_needs`,
   `test_needs_leash` (planned difference: none) and the watch-it-happen run.
4. **B-5 documents**: README "Work, frustration and workarounds" (each kind, what it opens,
   `tell` and "no warning", the graph nodes); the runner's events (`npc_workaround:<id>` with
   `started`, `done`, `dropped`, `ended`; `door_propped:<roomId>`; `npc_workaround_due` gains
   `level` and `restored`) in `NPC_NEEDS_SYSTEM.md`; `docs/test-bridge.md` if a bridge helper is
   added.
5. Full suites under the lock again after the scenario, then report for review. At this split (after `ef6fbfbd6`): Rails 1425 runs, 0 failures, 1 skip; JS 485 files passed, 0 failed.

### Gotchas

- `ruby -c a b` checks only `a`; check each file on its own.
- In `npc_workaround_test.rb` the fails are spaced 25 s apart (the park floor at
  `needsDeferMin` 0.5 is 24 s). A threshold reached while an earlier lasting one waits is
  handed over at that same fail (the "two at once" case), which a first draft of a test missed.

## Sub-slice B: workarounds, part two (2026-11-11): the X beats and their run; handover

### Done

- **The X beats** (`285484e1e`, `4eb1b02eb`). `scenarios/test_access_work` gains Hall D, west of
  Hall C: `note_room` (X1, Mei Lin; `mei_pc` with `lockChance: 1`; resource `rota` with
  `rota_switch`; `writes_down` at 50; a `thirst` need and an authored `mei_boiler`, so she leaves
  her desk now and then; profile `mei_files` with `Nook.txt`), `records_nook` (PIN, its code on her
  desktop), `store_lobby` (X2 and X4, Tom Fletcher, roles `facilities` and `staff`, a card;
  resource `stores` with `stores_switch`; `store_wedge`, a fire extinguisher beside the stores door,
  hidden on `store_door_propped`), `store_room` (rfid, `access.roles: ["facilities"]`, Una Walsh
  inside) and `event_room` (X3, Ellis Ward, `+intranet`, `perFail: 50`, `emit` `ellis_gave_up`
  with `noWarning`). Signs in every room; aim `workaround_beats` with five tasks (`x1_wrote_down`,
  `x1_nook`, `x2_started`, `x2_propped`, `x3_gave_up`); X4 has no task of its own (its proof is
  the server record and the events). The `wk_` pools were already in the top-level `chatter`.
  Mei's break need is `thirst` at a boiler with an authored affordance, not caffeine: a second
  coffee station gave Dana and Mei each a cross-room target warning, and a water cooler preset
  brings a `cooler` chatter pool with no lines. The switches are named apart from their
  resources ("Rota switch", not "Rota system switch") and the intranet resource is "Staff
  intranet", so the leak scanner's `network_string` rule has nothing to find.
- **Validator**: no errors; six warnings, all listed in `PLAYTEST.md` (Dana's two mappings,
  `pat_pc` twice, the finance share's network, U3's tray, Kai). The intranet "in no NPC's work
  list" warning is gone.
- **The probe** (an NPC walks to a prop hidden on `revealOnGlobal`): proved in the browser, no
  engine change. Tom's visit targeted the hidden `store_wedge` and finished 5 s later; only then
  was it shown.
- **Browser run** (port 3015): games 1191 (X2, X3, X1), 1194 (X4, both reloads), 1195 (W2, W3,
  W7). All pass; leak check clean in all three; request counts in budget. Report:
  `scenarios/test_access_work/reports/2026-11-11_run_x.md`; `PLAYTEST.md` has the X section and
  the request budget (`3cc153d62`).
- **Validator on the other scenarios**: the three needs scenarios, the other five access ones,
  `lab_physical_pentest` and m01 to m10 (`--skip-ink --no-graph`) against a snapshot of `main`:
  no new error or warning. (The snapshot lacked some assets, so a few checks were skipped on the
  main side; the warnings that showed up only on the branch come from `check_door_alignment.py`,
  which is the same file on both.)

### Findings for review

1. After a reload a propped door's sprite is shut (unlocked, it opens with no lock), as every
   door is after a reload. The plan's X4 says "the door is open". If an open-looking propped door
   after a load is wanted, the client needs the door from the `done` list (today `{ index, do,
   setGlobal }`) and to open those sprites on load; not done here.
2. A workaround's start line goes through `NPCNeedsSystem.mutter`, which emits no event, so a
   scripted run cannot assert it. A `npc_mutter` event (or a bridge read of the last line) would
   let the next run check it.
3. X3's tell goes from 0 to 2 in one step at the failure that brings the workaround, as plan 5.5
   defines `tell`; the X3 row's "no `tell` 1 or 2 before it" holds.

### Handover: open, in order

1. **B-5 documents**: README "Work, frustration and workarounds" (each kind, what it opens,
   `tell` and "no warning", the graph nodes); the runner's events (`npc_workaround:<id>` with
   `started`, `done`, `dropped`, `ended`; `door_propped:<roomId>`; `npc_workaround_due` gains
   `level` and `restored`) in `NPC_NEEDS_SYSTEM.md`; `docs/test-bridge.md` only if a helper is
   added (none was).
2. **Needs regression captures** (plan 11 point 5): `tools/playtest/needs-baseline-capture.js` on
   `test_needs_sims`, `test_npc_needs`, `test_needs_leash`, compared with
   `needs-baseline-compare.js`; planned difference none.
3. **The watch-it-happen run** (plan 11 point 6) on X1 to X3, by the persona tier.
4. Decide finding 1 above with the orchestrator; then full suites again and report for review.

### Suites

After `3cc153d62`, under the lock: Rails 1425 runs, 0 failures, 1 skip; JS 485 files passed, 0 failed.

### Gotchas

- `cmd.sh` gives up after 60 s and prints TIMEOUT, but the harness still answers later and the
  next `cmd.sh` call prints that late reply. Pass a third argument (seconds) for long `waitFor`s.
- After a reload the player starts in the lobby; walk back to the beat's room before its NPC is
  simulated (a pending hand-over starts when that NPC registers).
- Navigate for a reload with `setTimeout(() => location.href = '/break_escape/games/<id>?skip_resume=1', 50)`
  inside `eval`, wait a few seconds, then `bootstrap`; reinstall any `eval` listener afterwards.
- PIN doors take `{"cmd":"lock","code":"...."}`; `mg type` finds no field on the keypad.
- Leftover games on the shared dev database: 1191, 1194, 1195.

## Sub-slice B: workarounds, part three (2026-11-11): finished

### Orchestrator decisions

1. **A propped door looks open after a reload** (plan 11.1 X4, which already holds it unlocked).
   GET /scenario's `done` entry for a `prop_door` now carries `door` (the room id; it is in
   `unlockedRooms` already, and the leak scanner allows `done`). The runner's `restore` remembers
   each propped room; `syncRoom(roomId)`, called by `loadRoom` after each room is built and for
   the start room, opens that room's door sprites to a propped room through `window.unlockDoor`
   with no server call. A room propped in the session is remembered too.
2. **Workaround start lines emit an event**: `NPCNeedsSystem.mutter` emits
   `npc_mutter:<npcId>` `{ npcId, topic, line, picture }` with what was shown, heard or not. The
   bridge's event log keeps it (`npc_` prefix). `verify-run.rb --access --log <session.jsonl>`
   now prints a "workaround events in the log" block (per NPC: phases and start-line topics, then
   `door_propped`), read from drained event logs in the session log; topics only, no lines.

### Done

- `e37998a4f`: both decisions, with tests (Rails: the `done` entry's `door`; JS: restore opens
  only doors to a propped room, a room built later opens as built, nothing for other kinds, a
  session prop is remembered, the live deps through `window.unlockDoor`; `npc_mutter` payload;
  verify-run's log block, two tests).
- `66321b3f6`: **bug found by the new event.** A hand-over arrives in the answer to the failure
  whose grumble still holds the speech lock, so every start line fell back to its picture. A
  mutter whose topic has lines now waits for the lock (`MUTTER_WAIT_MS`, 8 s of needs clock) and
  is then said. Test added.
- `f495179c0`: B-5 documents. README "Work, frustration and workarounds" gains a Workarounds
  part (each kind, what it opens, lasting, `tell` and `noWarning`, `setGlobal`, the `prop_door`
  and `writes_down` rules, events, lines), the B validator errors and warnings, and the graph
  nodes. `NPC_NEEDS_SYSTEM.md` 5.9 gains the runner and the mutter wait; its events table gains
  `npc_mutter`, `npc_workaround_due` (`level`, `restored`), `npc_workaround` (phases) and
  `door_propped`. `docs/test-bridge.md`: where the workaround events show and the verify-run block.
- **Browser** (game 1197, port 3015): X2, X4's second reload (the stores door open as
  `store_lobby` is built, screenshot), X1 with the start line said in words. Leak check clean.
  Report: `scenarios/test_access_work/reports/2026-11-11_run_x4_reload_and_persona.md`.
- **Needs regression**: `access_model_needs_baseline/slice_9_2_b/` against A's captures:
  `test_npc_needs` and `test_needs_leash` 0 subjects differ; `test_needs_sims` 17, inside the 16
  of one build against itself, no mutter or workaround entries. Verdict none.
- **Watch-it-happen run** (game 1201, persona): in the run report with its "did not notice" list.
  Tom's prop was seen and used; Ellis's emit gives nothing visible (by design); Mei's note was
  seen appearing but the persona never clicked her PC to read it on the sign-in screen; neither
  start line was noticed although both were said in words.

### Leftover games

1196 (unused), 1197, 1198 to 1200, 1201.

### Suites

After `698fc32f0`, under the lock: Rails 1425 runs, 0 failures, 1 skip; JS 485 files passed, 0 failed.
Sub-slice B is ready for review.

## Sub-slice B review round 1 outcomes (2026-11-11)

Reviews: `ACCESS_MODEL_SLICE_9_2_B_CODE_REVIEW_R1_SERVER.md` and `..._R1_CLIENT.md`. Commits
`3738f6436` (server), `d65399723` (client), `89820a589` (label and recipe), and this log.

### Orchestrator decision (recorded)

On the client reviewer's three plan gaps: apply the suggested fixes where each is small and
contained (a visible cue for an `emit` workaround such as Ellis's; start lines a player can
notice, such as a longer-lasting bubble; a hint on Mei's sticky-note mark). Anything that turns
into engine design beyond a small change is logged as a plan gap for the user instead.

### Server review

| Finding | Outcome |
|---|---|
| M1 `prop_door` with no `door` or `prop` passes | Fixed. Validator errors on each; the server's `performable?` now also needs a `prop` (the runner's walk target), so such an entry is never handed over. Tests: `validator-access-work` (both, and both together), Rails "a prop_door with no prop is never handed over" |
| m1 `writes_down` on a PC another NPC owns, or no password | Fixed. Validator errors with the server's owner rule (`screenOwner`, else the first room NPC with it as `needsHome`) and on an empty `creds.password`. Test in `validator-access-work` |
| m2 prop not hidden on the `setGlobal` | Fixed. Warning for a `prop_door` with no `setGlobal`, and for a prop whose `revealOnGlobal` is not it. Test in `validator-access-work` |
| m3 scanner blind to a leaked `writes_down` | Fixed. Any hash whose `do` is a workaround kind and that carries `at` is a finding everywhere, with no exemption (also when the scenario has no targeted workarounds). Unit test added |
| m4 replay of a dropped hand answers `{}` | Fixed. A drop, a repeated drop and a "done" after a drop answer 200 `{ "dropped": true }`; the runner applies that as `dropped`. Rails and JS tests |
| m5 tests | Fixed: a drop 1 s after the hand-over (inside the dwell) is 200; "done" after "dropped" is not counted (done and handed empty, state unchanged, no note); replays of `writes_down` and `emit` write nothing; a negative index, float hand, seven-digit strings and `"1.0"` are 403 |
| n1 `retryAfter` is the whole dwell | Fixed: the time left, `ceil(1)`. Test |
| n2 scanner exemption by path only | Deferred to sub-slice H, which reopens the scanner for its kinds; a cross-NPC entry needs a tampered server, not a tampered client |
| n3 graph drops a `prop_door` edge silently | Fixed: a `warn` to stderr. The numbering remark needs no change (a non-object entry already fails validation) |
| n4 `written_down?` scans every room NPC | Deferred: cheap at today's sizes, as the reviewer says; revisit if it shows in a profile |
| n5 sync race on a workaround `setGlobal` | Noted in plan 9.4's "after a reload" table, as asked |
| n6 replay cost; H-only kinds validate clean | Replay cost accepted (no worse than `GET /room`). The work report's `Workaround` line for `borrow_session` and `share_login` now ends "Not performed until sub-slice H." |

### Client review

| Finding | Outcome |
|---|---|
| M1 a hand-over is lost after six failures | Fixed. No give-up: resent for as long as the page lives after 2, 4, 8, 16 s and then every 30 s (`retryDelay`); a 425 waits the time left, capped at 30 s; only a 403 ends it. A reload loses nothing: the server still holds the hand-over and sends it as `pending`. Tests: eight failures then success, a resent drop, the 425 wait. Live: game 1204, the first three requests for Ellis failed in the page; resent at +2, +4, +8 s, then applied |
| m1 one wait slot per NPC | Fixed. A queue across all NPCs (`_mutterWaits`, read with `mutterWaits()`), oldest first, ticked once per tick before the NPCs. Test: three lines for one NPC, all in words, in order |
| m2 several NPCs freed on one tick | Fixed. Each waiter re-checks the lock and the first to speak takes it, so the rest wait; the wait is now 20 s (was 8 s), so a few queued start lines are each said in words before any falls back to its picture. Test: two NPCs, three lines, none a picture |
| m3 a start line said late or while unavailable | Fixed. A waiting mutter whose NPC is not placed or not available is held and, after `MUTTER_WAIT_MS`, dropped (`mutter_dropped` in the log), never said late. Test |
| m4 `reset()` loses a workaround visit | Fixed. `reset()` emits `npc_visit_dropped` (`reason: 'reset'`) for a running or queued workaround visit. Test |
| m5 line and `started` before the act can start | Fixed. The visit is queued first; the line and `started` come only when it was queued (an emit at once). Test |
| m6 test gaps | Added: no give-up and backoff, a resent drop, the picture fallback after the wait, two waiters for one NPC and for two NPCs, a held then dropped waiter, the wait takes no lock of its own, `installNpcWorkarounds` twice (one set of listeners), two `pending` runs for one NPC. Deferred: the start line driven through a judged fail in `_turnBack` (the live runs cover that path: game 1204 shows both start lines in words through it) and the `failSent` two-NPC batch alignment (sub-slice A code; H reopens it) |
| m7 `door_opened` again on each reload | Fixed. A door the runner re-opens as its room is built carries `restored: true` in `door_opened`; documented in the README. Live: the in-session prop in game 1204 has no flag |
| n1 `restored` ignored | Documented in the runner header: the NPC sets off again, so it says its line again |
| n2 `proppedOpening` stuck after a throw | Fixed: `openSprite` returns false on a throw or no `unlockDoor`, and the mark is cleared so the next build tries again |
| n3 `level` is the client mirror | Documented in the runner header and the README |
| n4 H's kinds | Comment on `VISIT_KINDS` |
| n5 catch message | Fixed |
| Client-sent data table: a client can write a workaround's `setGlobal` through state sync | Plan gap for the user (sub-slice H): refusing client writes of declared workaround globals touches `sync_state` for every scenario. Today no scenario gates a door or container on such a global; the README says to map tasks or reveals to it, not locks |

### The three watch-it-happen gaps and the open question

- **Ellis's `emit` shows nothing.** Fixed in the scenario: X3's workaround sets
  `ellis_out_of_office`, which reveals an "out of office" note beside his PC (seen in game 1204).
  The README now tells authors that an `emit` with only a task is a toast and to give it something
  in the room.
- **Start lines not noticed.** A mutter's bubble now stays up at least 6 s (`MUTTER_BUBBLE_MS`),
  and m1/m2 keep every start line in words. A distinct action icon for a workaround visit (a
  sticky note, a door wedge) needs new icon art: **plan gap for the user**, not done.
- **Mei's note never read.** A sign-in PC with a note picture now says so in its proximity label
  ("... A sticky note is stuck to the monitor."), with no note text. Giving Mei an earlier reason
  to leave was not changed: her `thirst` already takes her to the boiler.
- **Mei stuck on "returning" in game 1201.** Not a sub-slice B bug. The persona stood at the rota
  switch (tile 8,3, beside the boiler at 8,4) from about t=40 s; Mei's work job back to her desk
  timed out at 146 s and 226 s; the persona moved away at about t=280 s and she reached her desk
  at 293 s. The player's body blocked her route, which the needs system meets with its normal
  timeout and retry. Moving the switch put it over the west desks, so the X1 recipe in
  `PLAYTEST.md` now says to step back towards the door after switching off.

### Browser run (game 1204, port 3015)

One game, one reload. X3 with three simulated request failures (above). X2 with X4: Tom frozen
on his way (manual needs clock on `started`) with his start line queued behind the fail line;
reload with `?skip_resume=1`; back in `store_lobby` he set off again (`restored: true`), said
"I'm not badging in every time." in words, and propped the door (`done`, `door_propped`). X1: Mei
wrote the note (start line in words), the mark is on `mei_pc`, and the label shows the sticky
note sentence. Server: ellis, mei and tom each `done [0]`, nothing handed; three
`POST /npc_workaround` reached the server, all 200. Leak check: no leaks found. Session log and
responses in the scratchpad (`9-2-b-r1`).

### Leftover games

1203 (made by mistake, unused), 1204.

### Suites after review round 1

After `89820a589`, under the lock: Rails 1432 runs, 0 failures, 1 skip; JS 485 files passed, 0 failed.

## Sub-slice B review round 2 outcomes (2026-11-11)

Reviews: `ACCESS_MODEL_SLICE_9_2_B_CODE_REVIEW_R2_SERVER.md` (0 blockers, 1 major, 2 minors, 4 nits)
and `ACCESS_MODEL_SLICE_9_2_B_CODE_REVIEW_R2_CLIENT.md` (0 blockers, 0 majors, 5 minors, 6 nits).
Commits: `1b16642ad` (server), `15c2ef5dd` (client tests), `5003f031a` (client and documents),
`33b6a442c` (q17), `299f467e1` (client nits), and this log.

### Orchestrator decisions (recorded)

- **Client-written workaround globals.** The server does not refuse them in B: the server
  reviewer showed a player gains nothing by writing one (room access, the note, `done` and tasks do
  not read it). Added instead: a validator warning when a workaround's `setGlobal` is also read by a
  server gate (an `unlockCondition` `globalVariable`, `concludeRequires.globals`, `exportGlobals`,
  a resource's `downIf`, a route gate global or an affordance `offWhen`), with the README line. If
  such a use ever has to be allowed, H adds the scenario's workaround `setGlobal` names to
  `read_only` in `merge_global_variables!`.
- **User decision q17 (2026-11-11): the frustration icon fades when the cause clears.**
  `getState().causeCleared` is true once, for every need with a counted failure, the causes of its
  last failure would all pass now (`causesClear` for `down` and `unreachable`; an `off` station
  whose `offWhen` no longer holds) or a judged use of it has been met since. The `blocked` icon is
  then drawn with the same art at alpha 0.6 (tell 2) or 0.4 (tell 1), with no pulse, and goes at
  tell 0. A new failure makes it solid again. After a reload nothing is recorded, so it stays solid
  until the NPC's next failure or met use (changed in review round 3, m1: seeded from `failWhy`). Tests: `npc-action-icons` (the entry), `npc-office-visuals`
  (the drawn alpha, back to solid, hidden at tell 0), `npc-needs-work` (a down resource and an off
  station). Plan 5.5 and the README record it.

### Server review

| Finding | Outcome |
|---|---|
| M1 a lost `/npc_frustration` answer strands a hand-over | Fixed. A counted fail that picks nothing new, and a `tooSoon` fail, carry the oldest unspent hand-over again as `run` (same `index` and `hand`, the dwell left). The test that pinned the old behaviour now expects the same hand; new tests: the third answer discarded and the run taken from the fourth, then spent; a too-soon fail carries the run and writes nothing; the settled test expects the re-offer. Client confirmed: `due` ignores a `(npcId, index, hand)` it holds as active or finished (new test, running and spent copies) |
| m1 mappings, reveal props and global names show the plan | Plan 9.3 sentence corrected; README "Keep the plan neutral" line added. Filter deferred to H (withhold a reveal prop on a workaround `setGlobal` until done; strip `npc_workaround:` mapping patterns) |
| m2 two orderings untested | Added: an old hand after `POST /reset` answers 403 (before and after the NPC is met again) and writes nothing; "dropped" after "done" answers the done body, serves `roomData` for a `prop_door` and writes nothing |
| N1 `"done": true` on done bodies | Not done: the client tells the bodies apart already, and the change would touch every done-body assertion. Left for H if it reworks the bodies |
| N2 `pending` sends the full dwell | Fixed: the dwell left since the server's hand time (used by the M1 re-offer too) |
| N3 any non-empty `dropped` is a drop | Fixed: only `true` or `"true"` |
| N4 `with_index` | Deferred with R1 n4 |

### Client review

| Finding | Outcome |
|---|---|
| m1 a start line said or voiced during the player's conversation | Fixed. `_mutterHeld` (in chat with the player, not placed, or unavailable) holds a mutter on both paths: `mutter` queues it instead of saying it, and the tick keeps holding it, dropping it at `MUTTER_WAIT_MS`. Tests: held through a chat then said once after, with no voice during; a chat past 20 s drops it. Live: game 1206 (Mei, chat opened just after `started`: no `npc_mutter`, then `mutter_dropped`) |
| m2 the 6 s floor is also a 6 s speech lock | Fixed: the floor holds the bubble only, the lock ends with the words. Test: the lock is shorter than the bubble, the next start line begins inside the first bubble, four start lines all in words inside 20 s |
| m3 Ellis's note contradicts the room | Fixed: the note now says he has given up on the intranet for today; object name "Ellis's note" |
| m4 plan and X3 rows stale | Fixed: plan section 6 (the re-offer, the retry schedule, 425, the start line queue, 20 s wait, 6 s bubble), the X3 row (setGlobal and the note), the 6.1 sticky-note row (the proximity label); `PLAYTEST.md` X3 (the global, the note in `nearby`, final state) and X4 (the door sprite open again, `door_opened` `restored: true`) |
| m5 tests | Renamed the test that drove no conversation to what it checks; added: in-chat waiter (m1), lock length and the budget (m2), an emit's `setGlobal` from the done answer, `door_opened` with and without `restored` through the real `doors.js` path, the label passes `scenarioData.id` |
| n1 a stuck job is invisible | Fixed: one `console.warn` at `STUCK_ATTEMPTS` (5); test |
| n2 `attempts` counts 425s | Fixed: a 425 starts the backoff again; test pins the waits |
| n3 no jitter | Not done: trivial at today's counts |
| n4 a start line said after its visit dropped | Not done: rare, at most 20 s; H can clear `wk_*` waiters on `visitDropped` |
| n5 a non-string observation throws in `label` | Fixed: returned unchanged; test |
| n6 comment says "in a conversation" | Fixed with m1 |

### Browser run (game 1206, port 3015)

One game, two reloads (the second shows X4's restored door). X3: one fail, `ellis_gave_up`,
`global_variable_changed:ellis_out_of_office`, task `x3_gave_up`, the note shown, Ellis at his
desk. X2 with X4: Tom frozen on `started` with his start line queued; after the reload he set off
again (`restored: true`), said his start line in words and propped the door; after the second
reload `door_opened` for `store_room` carried `restored: true` and the sprite was open. X1: Mei
wrote the note, `postitMarks` has `mei_pc`, the label says a sticky note is stuck to the monitor;
her start line was held during a person-chat and dropped (m1 above). Fading icon: Ellis at tell 2
with the switch flipped back showed the faded icon (alpha 0.6, no pulse, `causeCleared` true),
and it went when frustration eased to 0 (about 100 s). Tell 1's 0.4 was not seen live (unit and
render tests cover it). Server: ellis, mei and tom each `done [0]`, nothing handed; three
`POST /npc_workaround`, all 200. Leak check: no leaks found. Session log, responses and
screenshots in the scratchpad (`9-2-b-r2`).

### Leftover games

1206.

### Suites after review round 2

After `299f467e1`, under the lock: Rails 1436 runs, 0 failures, 1 skip; JS 486 files passed, 0 failed.

## Sub-slice B review round 3 outcomes (2026-11-11)

Review: `ACCESS_MODEL_SLICE_9_2_B_CODE_REVIEW_R3.md` (no blocker, no major). Fixes in `22ac8bc84`
and `af35a7c10`; main merged in `2bcb732f7` (no conflicts; main's changes do not touch the needs,
workaround or validator files).

| Finding | Outcome |
|---|---|
| Suspected bug: two reloads before the propped door showed open | Not a bug (the first reload came before the prop, as X4 intends). Seen again in game 1210: open on the first reload after the prop |
| m1 the icon stays solid after a reload | Fixed. GET /scenario's `npcFrustration` carries `failWhy` (per need, the whys of its last counted failure). `_applyRestored` seeds `failCause` from it: a `down` or `unreachable` need records the resources failing a use now (none when the outage is over, so the icon fades at once); any other why (`locked_out`, `social_blocked`, `off`, `no_access`) is recorded against the station and clears only with a met use, as live. Nothing is seeded over causes the session recorded, nor for a need the NPC does not judge. Tests: cleared at once; outage still on, solid until it clears; station why stays solid; no `failWhy` seeds nothing; a session cause is kept; GET carries `failWhy`. Plan 5.5 updated |
| m2 the re-offer rides only on later fails, oldest only | Fixed. Every fail, too-soon and ease answer carries `pending`, every unspent hand-over oldest first (`unspent_runs`); `run` is unchanged. `_applyAnswers` (and a pending answer applied at registration) emit `npc_workaround_due` for `run` and each `pending` entry; `due` ignores the copies. Tests: a lost last fail followed only by an ease (the ease answer carries it, it is spent, then gone); two unspent hand-overs with the second answer lost (the next fail and a too-soon carry both); the client starts each of two pending once and ignores a copy of `run`. Plan section 6 and the endpoint table updated. The leak scanner now allows `$.answers[n].pending[m]` on /npc_frustration (test) |
| m3 tests that would not catch a regression | Added: oldest first (a sixth fail with e1 and e2 both unspent: `run` is e1, `pending` is [e1, e2]); the met-use path of `causeCleared` (a met use while the share is up, then down again: cleared until the next counted failure; checked to fail with the met-use line removed); several needs (work cleared, social_media still failing: not cleared); the reload behaviour (m1). `assert_nil postit('mei_pc')` put back in the "done after dropped" test: it passes |
| n1 the dwell left sets the visit's length | Fixed: a numeric dwell is used as it is, so 0 gives a zero-length visit; only a run with no dwell takes `VISIT_DWELL_S`. Test |
| n2 the stuck warning is per streak | Fixed: a `warned` flag on the job, so once per job across 425s. Test (three streaks, one warning) |
| n3 the far side of a propped door after a resume inside the propped room | Fixed. A done `prop_door` names the prop's room as `from`; `restore` remembers it and `syncRoom` of the propped room also opens its sprite back to `from`, when that sprite is not itself locked. Tests: opened; no `from` leaves it alone; a locked far side stays shut. Not seen live: a `skip_resume` reload starts in the lobby |
| n4 the `unspent_run` comment | Updated with m2 |

### Browser run (game 1210, port 3015)

X4 with two reloads, plus the icon. Before the first reload: three fails, the third answer carried
`run` and `pending` (two `npc_workaround_due:tom`, one `started`), Tom frozen on his way. After the
first reload: `npc_workaround_due:tom` `restored: true` with dwell 0, `failCause` seeded
`{ work: [stores down] }` (solid, the outage still on), Tom propped the door (`done`,
`door_propped:store_room`, live `door_opened`). Stores switched back on: `causeCleared` true, the
icon faded (alpha 0.6, tell 2) while Tom was idle. After the second reload: no `npc_workaround`
event, `door_opened` `restored: true` on both sides, `store_door_propped` true, `failCause`
`{ work: [] }` and the icon faded at once. One `POST /npc_workaround` in the game; every
`/npc_frustration` and `/npc_workaround` answer 200. Leak check: no leaks found (after the scanner
change above; before it, the one finding was `pending` in an answer). Session log, responses and
server log in the scratchpad (`9-2-b-r3`).

### Leftover games

1210.

### Suites after review round 3

After `af35a7c10` (main merged), under the lock: Rails 1454 runs, 0 failures, 1 skip; JS 486 files passed, 0 failed.
