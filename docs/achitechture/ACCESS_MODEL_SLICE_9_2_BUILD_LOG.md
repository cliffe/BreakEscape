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
