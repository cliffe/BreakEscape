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

## H: the hot desk and the shared login (2026-11-11, split at the context limit)

Branch `build/9-2-h`, from `main` at `62bee4c1f` (U, A and B merged). Browser port 3018.

### Built

- **H-1 server** (`6eac9a5fa`). `npc_frustration.rb`: `REPEATING_KINDS` (`borrow_session`,
  `share_login`) join `PERFORMED_KINDS`. `choose_run!` hands over the first lasting one in force
  that is neither done nor handed; failing that, the next repeating one in force that is not
  handed and waiting, in turn (`turn` holds the workaround index the next turn starts from).
  `settled` is never true while the NPC has a repeating workaround. A borrow's `run` carries
  `need` (the need of the fail that handed it over, stored in `handed[i].need`), `leavesOpen: false`
  for a careful guest (`AccessIdentities.screen_always_locks?({}, npc)` on the saved, expanded
  record: no habit, a habit with no numeric `lockChance`, `lockChance` 1, `locksScreen: always`),
  and `routes` from the borrowed PC in a scenario with networks (`AccessWork.routes_from`, a map
  `{ resourceId => routes }`). "done": a borrow clears `sessions[pc]` and, for a guest who leaves
  it open, writes `guestSessions[pc] = npcId`, answering `{ pcId, guest }`; a share takes
  `heard` (only `true`/`"true"`) and `room_id`, counts as heard only when `room_id` is the
  colleague's room or one of its `needsRooms` and that room is never locked or unlocked
  (`currentRoom` is not read), adds the NPC to `sharedLogins` once, records `heard` in
  `lastSpent` (so a resend gets the same body), and answers `{ capture, line, note, displayName }`;
  unheard answers `{}`. `POST /login` with `claim: "guest"` is `Game#claim_guest_session!` (checks
  1 to 7 of plan 9.1). `account_capture_passwords` treats an account in `sharedLogins` as a capture
  route whose proof holds, and `capture_secrets_for_client` adds `sharedLogins` ids to the declared
  target ids. `GET /scenario` ends guest sessions (`end_guest_sessions!`, row lock) after the
  claimed ones. A handed-over (or spent) borrow PC joins the NPC's places for the need it
  satisfies, so the met use there is an accepted ease. `ACCESS_STATE_DEFAULTS` gains
  `guestSessions` and `sharedLogins`. Tests: `npc_workaround_h_test.rb` (18 runs, every H-1 case in
  plan 12 including the tampered-client cases and the no-exposure checks); two A tests changed
  (Dana's fixture borrow is now performed: tell 2 at 34 and a run at 68 with `leavesOpen: false`;
  the "settled at 100" test drops Dana's workaround).
- **H-2 validator** (`b6ac01a44`). `validate_access_work.rb` `check_borrow` and `check_share`.
  Errors: a borrower or sharer with no account; a hot desk that is not a sign-in PC, has an owner
  (`AccessIdentities.owner_id`), is private (on the object or in its affordance), is headless, does
  not admit the NPC, is under `autoLockMin: 0`, or satisfies none of the NPC's failing needs;
  `with` naming the NPC itself. Warnings: a careful guest (read on the copy with 9.1's habits
  expanded), `lockChance`/`locksScreenOnLeave` on a hot desk, a hot desk that is a flag station or
  VM launcher, a sharer's account signing in at one, a leashed colleague, no `login_aloud` line.
  The work report no longer says "Not performed until sub-slice H". Tests: 5 new in
  `validator-access-work.test.mjs` (33 pass). `test_access_work` validates with the same six
  warnings as after B.
- **Needs regression captures, before**: `docs/achitechture/access_model_needs_baseline/slice_9_2_h/`
  `test_npc_needs.before.json` and `test_needs_leash.before.json` (taken with H-1 and H-2 in, no
  client change yet). The script is
  `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/h_capture.sh <suffix>`
  (creates its own games on :3018); rerun with `after` once H-3 is in and compare with
  `tools/playtest/needs-baseline-compare.js`.

### Choices made (where the plan left one open)

1. A borrow's dwell is the borrowed PC's use time less 3 s (the allowance the other floors give),
   since "done" comes when the NPC leaves after a whole use; `share_login`'s is 6 s.
2. A careful guest's "done" is still posted and spent; it clears a player session at that PC (the
   NPC sat down) but writes no guest record. The server body says `guest: false`.
3. `run.need` is the need of the counted fail that handed the borrow over (stored with the hand),
   so a pending borrow after a reload unparks the right need.
4. The heard body adds `displayName` (the toast title) beside `capture`, `line` and `note`.
5. The borrow PC joins `frustration_places` once handed over or spent; `cause_belongs?` was not
   widened (a failed borrowed use is never reported, 6.4).

### Handover: open, in order

1. **H-3 needs** (`systems/npc-needs.js`). Groundwork from A already there: `_otherDesk` and
   `_failUse` read `s.borrow = { pcId, need }`; `_turnBack(s, 'failed', null, { borrowed })` does not
   count a borrowed fail (line ~1780); `cellBeside` is in the adapter (~4351); visits to an NPC
   exist. To add: `setBorrow(npcId, run)` sets `s.borrow = { index, hand, pcId: run.pc, need:
   run.need || 'work', routes, leavesOpen: run.leavesOpen !== false, startBy: clock + 60 s,
   started: false }` and `_unpark`s that need; in `_useCandidate` (top), a borrow for that need
   returns `{ kind: 'use', targetId: pc, borrowed: true }` when the PC is loaded, not off, not
   hidden, free and reachable, else `null` with no `giveUp` (waited for); `_startJob` copies
   `borrowed` and marks `started`; the per-NPC tick drops a borrow not started by `startBy`
   (`npc_borrow_dropped:<npcId>` with index, hand, pcId); emit `npc_sat_at:<pcId>` `{ npcId, objectId }`
   when a borrowed job reaches `using`; in `_completeJob`, for `job.borrowed`, run the verdict with
   the borrow's `routes` (adapter `useVerdict` gains an optional routes map that replaces each plan
   resource's `routes`), then before anything else emit `npc_borrowed_session:<pcId>` `{ npcId,
   objectId, met }` when `leavesOpen`, and always `npc_borrow_done:<npcId>` `{ npcId, objectId, met,
   leftOpen, index, hand }`; clear `s.borrow`; make `_failUse` read `job.borrowed` instead of
   `s.borrow`. `getState` gains `borrow`. Tests in `npc-needs-work.test.mjs` per plan 12 H-3.
2. **H-3 runner** (`systems/npc-workarounds.js`). `borrow_session`: due calls
   `NPCNeedsSystem.setBorrow`; `npc_borrow_done` posts "done"; `npc_borrow_dropped` posts `dropped`;
   on the answer with `guest: true`, emit an event (suggested `npc_guest_left:<pcId>` `{ npcId,
   objectId }`) that the workstation layer (H-4) records. `share_login`: a visit to `with` (6 s),
   `login_aloud` line on arrival, each tick `world.playerHears` (OVERHEAR_RADIUS), first hearing
   tick notes `window.currentPlayerRoom`; "done" with `heard` and `room_id`; a heard answer shows a
   toast "Overheard: <displayName>" with `line`, adds the evidence note with `note`, calls
   `window.recordSECapture(capture)` and emits `npc_overheard_login:<npcId>`. Add the two kinds to
   `VISIT_KINDS`/the performed set (B gives back unknown kinds as `dropped` today).
3. **H-4** workstation layer, `pc-sessions.js` (`claim(pcId, { as: 'guest' })` sending
   `claim: "guest"`, `displaced(pcId, name)` on `npc_sat_at` and again on `npc_borrowed_session`),
   `unlock-system.js` `interactLoginPc` claim kind, `test-bridge/access.js` `guest(pcId)`, the leak
   scanner's share rule (a password in a `/npc_workaround` answer is allowed only in a heard
   `share_login` answer; `savedNotes` after it), `verify-run --access` (`guestSessions`,
   `sharedLogins` counts), then beats H1 to H5 in `scenarios/test_access_work` (plan 11.1) and
   `PLAYTEST.md`.
4. **H-5 documents**, the browser proof on :3018 (a borrowed session and a heard share, each
   opening only what the plan says, through a reload), the after captures, both suites under the
   lock.

### Gotchas

- Start the :3018 server by hand as `start-keyless-server.sh` does (it is hard-wired to :3001); its
  PID lands in `test/dummy/tmp/pids/server-3018.pid`. It is stopped at this split.
- Leftover games: 1216 and 1217 (unused, made while checking `new-game.rb`'s output); 1218 and
  1219 (the before captures).
- `create_access_game` runs `prepare_scenario_data!`, so `habits.locksScreen` is expanded into
  `screenHabit` in server tests; the validator expands its own copy.

### Suites at this split

After `b6ac01a44`, under the lock: Rails 1472 runs, 0 failures, 1 skip; JS 486 files passed, 0 failed.

## H, part two (2026-11-11, split again at the context limit)

### Done

- **H-3 needs and runner** (`0a691c220`). `npc-needs.js`: `setBorrow(npcId, run)` (a copy of the
  same index and hand changes nothing; unparks the need, or drops its level to `urgentAt`);
  `_useCandidate` returns the borrowed PC first for that need (`_borrowCandidate`: loaded, not
  off, not hidden, free, reachable; else `null` with no `giveUp`, so it is waited for, not
  parked); `_startJob` sets `job.borrowed` and `job.borrow`; `_tickBorrow` drops a borrow that has
  no borrowed job running by `startBy` (`BORROW_START_MS` 60 s) with `npc_borrow_dropped`;
  `npc_sat_at:<pcId>` when a borrowed job reaches `using`; `_completeJob` runs the verdict with
  `job.borrow.routes` (adapter `useVerdict(npcId, need, obj, routes)` through the exported
  `planWithRoutes`) and then `_borrowDone` emits `npc_borrowed_session:<pcId>` (only when
  `leavesOpen`) and `npc_borrow_done:<npcId>` before a failed verdict's turn-back; `_failUse`
  reads `job.borrowed`; `userOf(objectId)`; `playerHears(npcId)`; `npc_visit_arrived:<npcId>`
  when a visit reaches its dwell; `getState().borrow`. `npc-workarounds.js`: `borrow_session` via
  `setBorrow` (not set: dropped, no line); `borrowDone`/`borrowDropped`; a `guest: true` answer
  emits `npc_guest_left:<pcId>`; `share_login` is a visit `{ npcId: with }`, the `login_aloud`
  line on `npc_visit_arrived`, a hearing test every 250 ms of the dwell (first hearing notes
  `window.currentPlayerRoom`), "done" with `heard` and `room_id`; a heard answer shows the toast,
  adds the note (`window.addNote`, important), records the capture and emits
  `npc_overheard_login:<npcId>`. Tests: 8 new in `npc-needs-work.test.mjs`, 6 new in
  `npc-workarounds.test.mjs` (94 pass across the two).
- **H-4 workstation layer, sessions, bridge, scanner** (`e063a82d1`). `workstation-state.js`:
  `guests` map, `onGuestLeft` (on `npc_guest_left`), `onSatAt` (on `npc_sat_at`), `guestOf`,
  the guest auto lock in `checkAutoLocks` (`workstation_auto_locked` with `guest: true`),
  `presence()` gains `userId` and `guestId`, `onInteract` answers `attended` for any user and
  `accessed` for a guest at an unowned PC; live env `userOf`. `pc-sessions.js`:
  `claim(pcId, { as: 'guest' })` (session marked `guest`, never ended by an owner's return),
  `displaced(pcId, name)` on `npc_sat_at` and `npc_borrowed_session`. `unlock-system.js`
  `interactLoginPc`: a user at the PC gets "<name> is using this PC"; a guest gets a guest claim.
  `__test.access.guest(pcId)`. Leak scanner: a heard `share_login` answer may hold the sharer's
  password at `$.line`, `$.note`, `$.capture.note` when the game lists the NPC in `sharedLogins`;
  then `savedNotes` and `se_captures` may hold it. Tests: 5 workstation, 4 pc-sessions, 2 scanner.
- **H-4 scenario and tooling** (`df4d7301f`). `verify-run --access` prints `guestSessions` and
  `sharedLogins`; its `--log` block adds `npc_sat_at`, `npc_borrowed_session`,
  `npc_overheard_login`. `test_access_work`: Ian gets the borrow and the habit, `ian_pc`
  `lockChance: 1`, `ian_files` profile (cabinet code); Hall C holds `hot_desk`, `comms_cabinet`,
  `hall_c_drawer` (the temporary account's note), Rosa with `rosa_pc` and her breaker; new
  `open_office` east of `vault_room` with Sam (`+crm`, `crm_down` switch) and Ruth; aim
  `hot_desk_beats`. `PLAYTEST.md` run H. Validator (`validate_npc_needs.rb`): a borrower's
  `screenHabit` is no longer called shadowed (it applies at the hot desk); test in
  `npc-office-visuals.test.mjs`. The validator output for `test_access_work` is unchanged from
  before (same warnings).
- **H-5 documents** (`527a0c919`): `README_scenario_design.md` (the two rows, the hot desk, the
  careful guest, why a share is heard only in an opened room), `docs/test-bridge.md` (`guest`).

### Choices made

6. The hot desk is in Hall C, not the lobby: Hall C is the H wing's lobby, next to Ian's
   `cable_room`, so the walk crosses one door (as W4's walk to the copy room does). Rosa's
   "borrow_room" is Hall C itself. A W1 to W4 run that loads Hall C and throws W2's breaker
   also fails Rosa; her events are not asserted there.
7. H4's outage is a new resource `crm` (`crm_down`), so no other beat's NPC fails with Sam.
   Ruth has no needs and no PC (a PC owned by an NPC with no needs is warned).
8. A share always stands its full 6 s beside the colleague, even when a reload's resent run has
   less dwell left, so the player still has the chance to hear it.
9. `pc_in_use` names the PC's user (the borrower) in its `ownerId` field at an unowned hot desk.
10. A guest's auto lock publishes `<pc>_screen_locked` true and `<pc>_owner_away` true, then the
    next click is the sign-in screen (the guest record is gone).

### Handover: open, in order

1. **Browser proof on :3018** (start the server by hand as before). Game one: H1 (unplug Ian, wait
   for the borrow, click while seated, claim after, cabinet code from `Cabinet.txt`), H2 (drawer
   note, sign in as the temporary account, re-unplug, displaced), H3 (Rosa's breaker). Game two:
   H4 (out of the room, then beside Ruth), sign in at the hot desk with the noted password, H5
   (reload with `location.href` = game URL + `?skip_resume=1`). Check with `verify-run --access`
   and `access-leak-check.rb` over the captured responses. Not yet run, so the scenario layout
   (Hall C positions, the walk from `cable_room`, Rosa's reach) is unproven in a browser.
   A tampered-client check in the browser too: `POST /login` with `claim: "guest"` before any
   borrow, and `POST /npc_workaround` with `heard: true` from a closed room, both refused or empty.
2. **After captures**: rerun the capture script with `after`, compare with
   `tools/playtest/needs-baseline-compare.js` against `access_model_needs_baseline/slice_9_2_h/`.
3. **Both full suites under the lock** (none run since the split; only the touched files).
4. Fill the browser-run and suites outcomes into this section; then ready for review.

### Single-file results at this split

`npc-needs-work` 47, `npc-workarounds` 47, `pc-sessions` 30, `workstation-state` +
`screen-states` 67, sign-in routing/requests/remote 35, `npc-office-visuals` +
`validator-access-work` 69: all pass. `access_leak_scanner_test.rb` 28 runs, 0 failures.

### Gotchas

- The scenario file has no ERB tags and round-trips through `json.dumps(indent=2,
  ensure_ascii=False)` byte for byte, so scripted edits are safe.
- New engine events: `npc_visit_arrived`, `npc_sat_at`, `npc_borrowed_session`, `npc_borrow_done`,
  `npc_borrow_dropped`, `npc_guest_left`, `npc_overheard_login`. No new static imports, so the JS
  test harness copy lists need nothing.

## H, part three: the browser proof, the after captures and the merge (2026-11-11)

Keyless server on :3018 (started by hand, stopped by PID afterwards), headless Chromium through
the `window.__test` bridge, `--capture-responses` per game. Events heard with a wildcard listener
installed through `eval` after each load.

### Browser run H (games 1221 and 1222)

| Beat | Result | Evidence |
|---|---|---|
| H1 | **Pass** (1221) | Socket off: `off` parks at 20, 40, then at 60 `npc_workaround:ian` `started` (hand 1), `workstation_owner_left:ian_pc`, `npc_sat_at:hot_desk` 4 s later, `npc_borrowed_session:hot_desk` `met: true`, `npc_borrow_done:ian` `leftOpen: true`, `workstation_owner_left:hot_desk` `reason: "guest"`, `npc_guest_left:hot_desk`, `done`, level 60 to 50. A click after he left opened his desktop by guest claim (`pc_signed_in` `via: "claim"`); `Cabinet.txt` gave the PIN and the cabinet opened. Tasks `h1_borrowed`, `h1_cabinet`. Socket on, a met use, then the needs clock stepped past `lockAt` with the guest desktop open: "The screen locked", guest record and session gone (exercised, not earned). The click while seated was missed in 1221 (his use lasts 5 s and the walk took as long); checked later at the same desk with Rosa seated: "Rosa Lane is using this PC." and no minigame |
| H2 | **Pass** (1221) | Drawer note read; signed in as the temporary account by password; socket off again with that desktop open: when Ian sat down the desktop closed with "Ian Shaw has signed in at this PC", `pc_signed_out` `reason: "displaced"`, one `POST /logout`; after he left a click opened Ian's desktop (`signedInAs` `ishaw`), not the temporary account's |
| H3 | **Pass** (1221) | Rosa's breaker: 20, 40, 60, then the borrow; `npc_borrowed_session:hot_desk` `npcId: "rosa"`, `met: false`; `npc_use_failed:rosa` at `hot_desk` with no `npc_frustration_changed` after it (not reported); a click claimed her session (`rlane`). Task `h3_failed_there`. Server: `guestSessions.hot_desk` `rosa`, her level 60 and rising to 100 |
| H4 | **Pass after a fix** (1222) | CRM off. Heard share: `POST /npc_workaround` `heard: true`, `room_id: "open_office"`, the answer carried `capture`, `line`, `note`, `displayName`; `npc_overheard_login:sam`; the "Overheard: Sam Okafor" note in the notebook; task `h4_overheard`; `sharedLogins` `["sam"]`. Unheard share from `vault_room`: `heard: false`, answer `{}`. The noted password signed in as Sam at the hot desk (`via: "password"`); his desktop there holds nothing. Standing beside Ruth, as the step says, the share was dropped four times in a row (visit timeout): see fix 1. After it, two shares in a row from the same spot were heard, each with the toast |
| H5 | **Pass** (1222) | Ian borrowed the hot desk in game two and his session was claimed, then reload (`location.href`, `?skip_resume=1`): the server shows `sessions` 0, `guestSessions` 0, `sharedLogins` `sam`, levels kept (ian 70, sam 100); the hot desk opens the sign-in screen; the notebook keeps the overheard note |

Tampered client, from the page (`window.ApiClient`), all refused by the server:

- guest claim at `spare_pc` and at `ian_pc` (no borrow there): 422 "Sign in required";
- guest claim at the hot desk while a claim is held there: 422;
- forged `npc_borrow_done` sent as `POST /npc_workaround`: `ian` hand 9, `ian` hand 1 (spent), `rosa` hand 2
  (not handed yet) and `sam` with `heard: true`: each 403 "unknown hand-over"; an early "done" for
  Rosa's real hand 5, sent the moment it was handed over: 425 "too early";
- a forged `npc_borrow_done:ian` event emitted on the client dispatcher: the runner sent nothing
  (no running job for that hand);
- Sam's first share sent with `heard: true` and `room_id: "vault_room"` (a room neither Sam nor Ruth
  can be in): answer `{}`, `sharedLogins` stayed empty;
- a capture of the share recorded on the client before it was ever heard (`recordSECapture` for
  `sam`, synced): `GET /capture_secrets` answered no secret. This scenario declares no `social`
  block, so that answer is empty after the heard share too; the heard share's capture proof itself
  (`account_capture_passwords`) is covered by `npc_workaround_h_test.rb`.

Known, not fixed (review R3 n2): a handed borrow has no age limit on the server
(`npc_frustration.rb`, `handed_borrow_pcs`; only the dwell is checked). With "last done wins", a
tampered client that holds two handed borrows for one PC can choose which NPC becomes the guest,
and when the server's guest timeout starts, by timing its "done" posts. It reaches only outcomes
honest play can reach (each borrow was handed by the server), and a wall-time bound would bring
back the needs-clock problem of R2 server m1.

`access-leak-check.rb`: 1221 (119 responses), 1222 (117), 1223 (86): `VERDICT: no leaks found` each.

### W1 to W4 with Hall C loaded (game 1223)

Hall C was walked through first, so Rosa was registered; then W2, W3, W4, a reload, W1. Rosa's
breaker sets the same `finance_share_down` as W2's, so she failed beside Dana (20, 40, 60, then her
hot desk borrow, `met: false`) and ticked `h3_failed_there`. Dana was unchanged by it: 34, 68, 100,
settled, `w2_failed`, `w2_fed_up`; reset: 90, 80, `w3_eased`; her three reports as before (6
requests in all with Rosa's, never two within 2 s). W4: `npc_checked:office_printer`, claim,
`Cupboard.txt`, cupboard opened, `w4_checked`, `w4_cupboard`, `owner_returned` (the first outage's
claim window was missed by the harness; re-armed once). Reload: Omar 100 and settled from load, 0
requests, the printer still jammed, no claim. W1: Amy's use met, level 0, `w1_met`. So the W beats
behave as their steps say; `PLAYTEST.md` run W now says so and tells the tester to count Dana's
requests alone. No scenario change was needed.

### Fixes

1. **A visit beside a colleague could stand still until it timed out** (`553c4b8a6`, tests in
   `test/js/npc-needs-cell-beside.test.mjs`). `cellBeside` took the first walkable side of Ruth,
   the cell east of her, behind her desk: walkable on the grid but cut off from the room, so
   `findWorldPath` found no route and Sam never moved. It now takes the first side the visitor can
   reach (`routeLength` with the visitor's leash), falling back to the first walkable side. `911331406`
   was a first guess (skip the player's cell) that the run disproved; `553c4b8a6` replaces it.
   Proof: before, four shares in a row dropped with the player at (870, 140) and Ruth at (914, 130);
   after a reload with the fix, two in a row heard from the same spot.

### Observations, not changed

- A guest's auto lock is client side only: the server keeps `guestSessions[pc]` until the next
  `GET /scenario`, so a tampered client could still claim that session after the lock, as it can
  claim an owner's session whenever it says the owner is away. The plan has no server lock time for
  guests; left as designed.
- A borrower's dwell is 2 s at the hot desk (use 5 s less 3 s), so the "is using this PC" window is
  short; a tester should stand at the hot desk before the NPC arrives.
- `npc_workaround_due` fires twice per hand-over (`run` and the same hand in `pending`); the runner
  starts each hand once, as designed (R3 m2).

### Needs regression

After captures at `553c4b8a6` (games 1224, 1225), compared with the before captures:
`test_npc_needs` and `test_needs_leash` 0 subjects differ. `access_model_needs_baseline/slice_9_2_h/COMPARISON.md`.

### Merge and suites

`main` merged into `build/9-2-h` (`e4d9fe364`), no conflicts.
After the merge, under the lock: Rails 1591 runs, 0 failures, 0 errors, 1 skip. JS first run 488 of
490 files: `test-bridge-access` and `playtest-verify-run-access` had not been updated for H-4's
`guest()` and the two new `verify-run --access` lines (not caused by the merge). Fixed in
`7c4e6bd5b`; JS rerun under the lock: 490 of 490 files passed.

### Commits in part three

`911331406` (first cellBeside guess), `553c4b8a6` (cellBeside reaches its side, replaces it),
`aaf8b3f76` (after captures, COMPARISON.md, run W note), `e4d9fe364` (merge of `main`),
`7c4e6bd5b` (stale tests), and this log.

### Leftover games

1216 and 1217 (unused), 1218 and 1219 (before captures), 1221 (H1 to H3 and the tamper checks),
1222 (H4, H5), 1223 (W1 to W4 with Hall C), 1224 and 1225 (after captures). All on the shared dev
database, mission 243 for `test_access_work`. The :3018 server is stopped.

## H review round 1 outcomes (2026-11-11)

Reviews: `ACCESS_MODEL_SLICE_9_2_H_CODE_REVIEW_R1_SERVER.md` (0 blockers, 1 major, 5 minors, 4
nits) and `ACCESS_MODEL_SLICE_9_2_H_CODE_REVIEW_R1_CLIENT.md` (0 blockers, 2 majors, 8 minors, 7
nits). Every fix below has a test that fails with the fix taken out (checked by reverting each
one in turn).

### Orchestrator decisions (recorded)

- **A sign-out end event for guest sessions.** Plan 6.4 lists three end events for a guest
  session (the auto lock, the next person to sit, a reload) and none for the player's own
  sign-out. This round fills that gap: signing out of a claimed guest session ends it, and so does
  a password (or remote) sign-in at that PC, on the server and the client alike.
- Server m1: the server times a guest session out itself. Server m3: the capture's note carries
  the password only under `social.captures.revealSecret`. Server m4: a share is heard only once
  the player has met the colleague.

### Server review

| Finding | Outcome |
|---|---|
| M1 sign-out does not end a guest session | **Fixed.** `logout_session!` ends `guestSessions[pc]` when the session it ends is that guest's own claim; `start_login_session!` ends it for any sign-in that is not a claim. A displaced session's `/logout` that lands after the borrow's "done" keeps the new guest (only the guest's own claim ends it). The client mirrors it: `workstation-state.js` drops the guest on `pc_signed_out` at that PC and on a `pc_signed_in` that is not a claim. Tests: claim, logout, claim again 422; password sign-in clears it; the late displaced logout keeps it (server); three in `workstation-state.test.mjs` |
| m1 the server could time a guest out | **Fixed.** `guestSessionsAt[pc]` (server time of the "done") beside `guestSessions`, cleared with it; the claim is refused once the PC's policy `autoLockMin` (its `policy`, else `defaultPolicy`) times 60 s plus the 3 s allowance has passed. The plan has no default lock for a guest, and the client never locks one under a policy with no `autoLockMin`, so neither does the server. Test with `travel_to`: 302 s in, granted; 304 s, refused; no `autoLockMin`, granted after an hour. Note: the client's lock runs on the needs clock, which stops while the game is paused, so after a pause the server refuses a little before the honest client's lock; the claim then shows the sign-in screen |
| m2 Captured sign-ins ignores a heard share | **Fixed.** `declared_capture_target_ids` includes `sharedLogins`; the local union in `capture_secrets_for_client` is gone, so both readers use one set. Test: a network fixture lists `accounts.sam` after a heard share |
| m3 the capture's note carries the password | **Fixed.** `capture.note` holds the password only under `revealSecret`; otherwise "X told Y their login out loud: <username>". `note` and `line` keep it. The leak scanner allows `$.capture.note` and the `se_captures` copy only under `revealSecret`. Tests: server body both ways; scanner reports `$.capture.note` and a synced `se_captures` copy without `revealSecret` |
| m4 a share heard in a room the player never reached | **Fixed.** Heard also needs the colleague in `encounteredNPCs`. Test: colleague not met, answer `{}` |
| m5 test gaps | **Fixed.** Guest claim through a foothold and at a headless host; a dropped borrow writes no guest and leaves a held session; `handed_borrow_pcs`' need filter; `accounts` after a heard share (m2); no exposure after a heard share across the `/npc_frustration` answers, `GET /scenario` (its `pending` and a synced `se_captures`), the room, `/login_accounts` and `/capture_secrets` |
| n1 the borrow PC by name | **Fixed.** `record_borrow_done!` and `handed_borrow_pcs` store the PC's id from `find_login_pc` |
| n2 a lost "done" resent after a later sitter | **Fixed.** A guest record written after this hand-over was made is left alone, and so is the session there. Test with Rosa's record and claim in place |
| n3 `use_floor` leaves out the hot desk | **Comment added** saying it is on purpose (stricter, never refuses an honest ease) |
| n4 `end_guest_sessions!` checks before the lock | **Not changed.** Same pattern as `end_claimed_sessions!`; a "done" committed between the load and the check is cleared on the next reload, and since m1 the server's own lock bounds it anyway |

### Client review

| Finding | Outcome |
|---|---|
| M1 the overheard toast as HTML; markdown alters the note | **Fixed.** The runner calls the toast with `{ plainText: true, verbatim: true }`; `notifications.js` gains `verbatim` (with `plainText`), which skips the `--` dash display for the message. The note text is escaped for the notebook's markdown (`escapeNoteText` in `npc-workarounds.js`: a backslash before each of the renderer's escapable characters; HTML needs nothing, the renderer escapes it). Tests: six passwords with `*`, backticks, `<`, `&`, `--`, `\`, `|`, `#` and `_` come out of `renderNoteMarkdown(displayDashes(...))` exactly; the toast dep's options; `toast-verbatim.test.mjs` against the real `notifications.js` and `display-dashes.js` |
| M2 a doorway tick uses up `heard` | **Fixed.** `_listen` counts a tick only when `playerRoom()` is a non-empty room. Tests: two doorway ticks then an in-room one posts `room_id: open_office`; only doorway ticks post `heard: false` |
| m1 `login_aloud` said outside the listening window | **Not changed.** Needs a timing rule (start the window on `npc_mutter` with that topic, or give the line priority over the shared speech lock) and a playtest to see whether the lock delays it in practice; in run H and in this round's run the line came during the dwell. For round 2 or the backlog |
| m2 a replaced or reset borrow never reported | **Fixed.** `setBorrow` reports a held, unstarted borrow dropped before replacing it and refuses (returns false, so the runner gives the new one back as dropped) while a borrowed job is using it; `reset()` reports every held borrow dropped. Tests for each |
| m3 `started` never read | **Not changed.** Picking a rule for a borrow cut short after sitting down (done with the session left, or sit again) is a design choice with its own events; `started` stays in `getState().borrow` for the bridge. For round 2 |
| m4 a claim in flight when an NPC sits down | **Fixed.** After a granted claim (owner or guest), if `presence().userId` names somebody (and the owner is not back, which keeps `owner_returned`), the session is ended through `displaced` and the claim answers `reason: 'displaced'`; `interactLoginPc` shows that message as plain text and opens nothing. Tests in `pc-sessions.test.mjs` and the routing test |
| m5 only a borrower sitting displaces | **Not changed.** Latent: no NPC in `test_access_work` can sit at a hot desk without a work plan. The validator warning the review suggests is the cheaper fix; for the backlog |
| m6 `interactLoginPc` user and guest branches untested | **Fixed.** Routing tests: a borrower at an unowned PC gives `in_use` with the name; `accessed` with a guest sends `{ as: 'guest' }`, without one an owner claim |
| m7 the leak scanner reads `sharedLogins` at the end | **Not changed.** "First heard answer per NPC" would flag the honest second heard share (a heard share stays in turn and is answered again), and the capture holds response bodies only. m3 already narrows what a heard answer may carry |
| m8 the borrower's name reaches HTML | **Fixed.** The name is HTML-escaped before "<name> is using this PC"; the observations keep their markup as before. Test with a name holding `<b>` |
| n1 `npc_visit_arrived` through `_emit` | **Fixed**: `world.emit`, so an arrival clears no select back-off |
| n2 the unreachable `_otherDesk` borrow exception | **Not changed**: a guard only, harmless |
| n3 the caffeine test cannot fail | **Not changed**: the m6 and M2 tests took priority; noted for round 2 |
| n4 the bridge reads `ws.guests` directly | **Fixed**: `guestOf` runs first, applying a lock whose time has passed |
| n5 `presence()` can emit | **Not changed**: as `isLocked`'s late roll; no caller is hurt |
| n6 `setBorrow` leaves the need at `urgentAt` | **Not changed**: `_unpark` does the same for every park, so changing it moves every scenario's timing; the start is a tick or two later at most |
| n7 README row and the careful guest | **Fixed**, and the row lists the new end events |

### Browser check (game 1227, port 3018)

Keyless server on :3018, stopped by PID afterwards. Sam's password in this game's
`scenario_data` was set to a 13-character value holding `<`, `*`, `--` and a backtick.

- **Share heard after walking in through a door.** CRM off, the player waiting in `vault_room`
  by the door. First share (hand 1): every hearing tick in `vault_room`, not heard. Second (hand
  2): the player walked in through the door on `npc_visit_arrived:sam` and up to Ruth; ticks in
  `vault_room`, then `open_office` not hearing, then the first hearing tick in `open_office` set
  heard with that room; `npc_overheard_login:sam`, task `h4_overheard`. No tick happened to fall
  with `currentPlayerRoom` `''` on this walk (the doorway is 270 px from Ruth, outside the
  overhear radius anyway), so the doorway case itself rests on the runner tests.
- **The password with markup.** The toast message, read back from the DOM, was the line exactly
  (no child elements, the `--` kept). The note is stored escaped and rendered by the notebook's
  own `renderNoteMarkdown(displayDashes(...))` as the exact password. `se_captures.sam.note`
  holds no password (no `revealSecret` here). The password taken from the rendered note signed in
  as Sam at the hot desk (`via: "password"`).
- **Sign-out then click at the hot desk.** Ian borrowed and left; a click claimed his session
  (`via: "claim"`, `guest: true`); Sign out: the server then held no guest record and no session
  at the hot desk, the client's guest record was gone, and the next click opened the sign-in
  screen (12 account tiles). A guest claim sent straight from the page after a sign-out: 422.
- A `GET /scenario` sent by hand mid-run (a mistake) ended one guest record as a reload does;
  the check above was redone on a later borrow.
- `access-leak-check.rb` over the 1227 responses: no leaks.

### Leftover games

1227 (this round's check), on the shared dev database.

### Merge and suites after review round 1

`main` merged into `build/9-2-h` (seating changes), no conflicts. After the merge, under the lock:
Rails 1604 runs, 0 failures, 0 errors, 1 skip; JS 491 of 491 files passed.

Commits this round: `dd04e6934` (server), `94112e9ed` (client), `e73e8d8bf` (n3 comment), the
merge of `main`, and this log.

## H review round 2 outcomes (2026-11-11)

Reviews: `ACCESS_MODEL_SLICE_9_2_H_CODE_REVIEW_R2_SERVER.md` (0 blockers, 1 major, 2 minors, 4
nits) and `ACCESS_MODEL_SLICE_9_2_H_CODE_REVIEW_R2_CLIENT.md` (0 blockers, 0 majors, 3 minors, 8
nits). Each fix below was checked by reverting it in turn: its test fails with the fix taken out.

### Server review

| Finding | Outcome |
|---|---|
| M1 the R1 n2 guard keeps the wrong guest when two borrowers queue | **Fixed: the last "done" wins.** The guard is gone. The server sees the "done" posts in the order the NPCs leave, which is the order the client records guests in (on each answer), so the server can check this rule itself; a sit order sent by the client would be a client claim the server cannot verify. The lost-answer case (R1 n2) stays right another way: a resent "done" is answered from `lastSpent` and writes nothing, and a borrow's answer now says `guest: true` only while the server's guest record at that PC is still this NPC's (`borrow_body`). So a resend after a later borrower's "done", after a sign-out, or after a refused timed-out claim answers `guest: false` and the client does not record it. A lost request (never reached the server) and resent late is recorded last on both sides, so the two still agree. Tests: Dana handed, Ian handed, Ian's done, Dana's done: `guestSessions.hot_desk` is `dana` and the claim answers `npcId: dana`; Ian's resend then answers `guest: false` (fails on `25f5cf239`); a resend after the guest's sign-out answers `guest: false`. The old n2 test, which planted the queue's shape by hand, is replaced |
| m1 the server's wall-time timeout against the client's needs-clock lock | **Fixed on the client** (the smaller fix that covers every pause). VM time and a hidden tab can stop the needs clock for any length of time, so no fixed server allowance covers the honest cases. Instead a refused guest claim is taken as the lock: `workstationState.guestClaimRefused(pcId)` drops the guest record, publishes `<pc>_screen_locked` and emits `workstation_auto_locked` as the client's own lock does, so the player sees a locked screen and later clicks send no claim. The server's timeout stays as it is (a bound for a tampered client). Tests: `workstation-state.test.mjs` (a refusal at 2 needs-clock minutes locks), `access-signin-routing.test.mjs` (a refused guest claim calls it, a refused owner claim does not). Also closes client n8 |
| m2 tests that pass with the code removed | **Fixed.** n1: a fixture whose borrow names the hot desk by its `name`; `guestSessions`, `handed_borrow_pcs`, the answer's `pcId` and the claim all use the id (fails if `borrow_pc_id` returns the raw name). `unless via == 'claim'`: the guest claim test asserts the guest record is still there after a granted claim (fails without the `unless`). The `logout_session!` guard: see n1 |
| n1 the unreachable guard in `logout_session!` | **Kept, commented as defensive**; the late-logout test's comment now says the "done" already removed the displaced session |
| n2 the answer's raw `pcId` | **Fixed**: the resolved id (`borrow_pc_id`), tested with the name fixture |
| n3 a refused, timed-out record stays | **Fixed**: the refusal deletes `guestSessions[pc]` and `guestSessionsAt[pc]` under the `/login` lock; asserted in the timeout test |
| n4 a granted guest claim is never timed out | **Not changed**: as the review says, it matches an owner claim and gains nothing the claim did not |

### Client review

| Finding | Outcome |
|---|---|
| m1 (R1 m1) `login_aloud` outside the listening window | **Deferred to `docs/IDEAS_BACKLOG.md`** ("Access 9.2 H: deferred review items"): it needs a timing rule and a playtest, not a review fix |
| m2 (R1 m3) a borrow cut short after sitting down | **Deferred to the backlog**: choosing whether a half-used borrow counts as done is a design choice with its own events |
| m3 notebook search misses an escaped username or password | **Fixed**: `noteMatches` / `noteSearchText` in `utils/note-markdown.js` search the text with the renderer's escapes removed; `notes-minigame.js` uses it. Test: an escaped overheard note is found by `s_okafor`, `Spring-24` and `SPRING-24*#` |
| n1 verbatim toast collapses spaces | **Fixed**: a verbatim message gets `white-space: pre-wrap`; asserted in `toast-verbatim.test.mjs` |
| n2 no hold-queue test for a verbatim toast | **Backlog**: the held queue and its release are not exported; the code path was read and keeps the option |
| n3 a guest recorded during a slow `/logout` | **Comment** in `workstation-state.js` `onSignedOut`, and a backlog entry |
| n4 two owner alerts render a name as HTML | **Fixed**: `owner_returned` and `auto_locked` pass `{ plainText: true }`; routing test |
| n5 an old unescaped note and a re-hearing give two notes | **Not changed**: dev games from before this build only |
| n6 (R1 n3) the caffeine test cannot fail | **Backlog** |
| n7 deferred items only in the build log | **Fixed**: client R1 m1, m3, m5, n3 and this round's deferrals are in the backlog |
| n8 a refused guest claim keeps the guest record | **Fixed** with server m1 above |

### Browser check (games 1243 and 1245, port 3018)

Keyless server on :3018, started by hand, stopped by PID afterwards; headless Chromium, a script
through `window.__test` (start room Hall C, the socket in `cable_room` switched off, then Rosa's
breaker, both through their real confirm prompts). The same result in both games:

- Rosa borrowed the hot desk twice (hands 1 and 2). After each leave, the client's guest record
  was `rosa`, the "done" answered `{ pcId: hot_desk, guest: true }`, and the click at the hot desk
  sent a guest claim that the server granted with `npcId: rosa`. The second sit displaced the
  first claimed session (`pc_signed_out` `displaced`, one `/logout`) before her second "done".
  Server and client agreed on the guest at every claim.
- **The queue itself did not happen in the browser.** Ian was handed his borrow at 66 s and set
  off for the hot desk (`goto_target`); about 18 s later his job had ended without his sitting
  down, and he was not sent again, so his borrow was posted dropped at its 60 s start window
  (126 s), while the hot desk was free from 105 s. His next hand (2) had not started when the run
  ended. This is next to client R1 m3 / R2 m2 (a borrow whose job ends is not restarted; the
  borrow is read through `s.job.borrow` only), now seen before sitting rather than after; the
  player stood by Rosa's breaker in Hall C, which may have blocked his walk. Not fixed in this
  round; added to the backlog entry for R2 m2. The two-borrower queue is covered by the server
  test (Dana and Ian) and by the client recording on each answer.

Leftover games: 1231, 1237, 1238 (setup attempts), 1243, 1245; shared dev database.

### Merge and suites after review round 2

`main` merged into `build/9-2-h` (`fee1166a3`), no conflicts. After the merge, under the lock:
Rails 1606 runs, 0 failures, 0 errors, 1 skip; JS 491 of 491 files passed.

Commits this round: `e9320f7e8` (server), `3c22cb90e` (client), `ac6623414` (log and backlog),
`fee1166a3` (merge of `main`), and this note.

## H review round 3 outcomes (2026-11-11)

Review: `ACCESS_MODEL_SLICE_9_2_H_CODE_REVIEW_R3.md` (0 blockers, 0 majors, 2 minors, 3 nits).
Each fix was checked by running its new tests against the code before the fix: they fail there.

| Finding | Outcome |
|---|---|
| m1 a transport error on a guest claim locks a live guest session | **Fixed** (`unlock-system.js`): `guestClaimRefused` runs only on `reason: 'refused'` (a 422). A 5xx, 403 or network failure keeps the guest record, shows the sign-in screen as before and an alert with the error's message (plain text). Test: routing "a guest claim that fails on the transport" (`locked` stays empty) |
| m2 the fail cooldown on a borrowed PC equals the start window | **Fixed** (`npc-needs.js` `_failJob`): a failed job at a borrowed PC sets a 5 s cooldown (`BORROW_FAIL_COOLDOWN_MS`), not 60 s, so the borrower tries again inside the window and `startBy` stays the only bound. Tests in `npc-needs-work.test.mjs`: a borrow whose blocked walk times out at 20 s sits before `startBy`; after a failed walk, a PC taken by a second borrower is waited for and sat at once that one leaves. The backlog entry no longer files the dropped Ian borrow under client R2 m2 |
| n1 the refusal drops whichever guest is recorded | **Fixed**: `guestClaimRefused(pcId, npcId)` keeps a record that is no longer the claimed guest's; the routing call passes the claimed `guestId`. Tests: workstation-state (Rosa recorded while Ian's claim was answered is kept), routing (the claimed guest is passed) |
| n2 a handed borrow has no server age limit | **Recorded, not fixed**: in the tampered-client notes under "Browser run H" |
| n3 the `record_borrow_done!` comment | **Fixed**: it names the late-resent request (R1 n2) as the exception |
| Orchestrator: `hall_c_drawer` sprite | **Fixed**: `filing_cabinet1` has no sprite; it is `filing_cabinet` now. The validator shows no failure lines (one warning, about `pat_pc`, as before) |

### Browser check (game 1252, port 3018)

Keyless server on :3018, started by hand, stopped by PID afterwards; the R2 script with the socket
and the breaker switched one after the other (so the two hand-overs land close), then the player
sent to `slow_room`, away from Ian's way from `cable_room` to the hot desk, until the second
borrower left. Game 1251 started in the lobby by mistake and did nothing (left over).

- **The queue happened.** Ian was handed his borrow at 64 s and set off; Rosa was handed hers at
  81 s and sat at the hot desk at 86 s. Ian's walk ended without his sitting (the desk was taken),
  and about 6 s later he set off again while Rosa was still on her way out; he sat at 97 s, after
  her "done" at 91 s, and his "done" came at 102 s, inside his window (124 s). No borrow was dropped.
- Both "done" answers said `{ pcId: hot_desk, guest: true }`, Rosa's first, then Ian's. The
  client's guest record before the claim was `ian`, the guest claim was granted with `npcId: ian`
  (`ishaw`, `via: "claim"`), and the desktop that opened was Ian's: the last sitter's.

Leftover games: 1251, 1252; shared dev database.

### Merge and suites after review round 3

`main` merged into `build/9-2-h` (`4a4f97f37`), no conflicts. After the merge, under the lock:
Rails 1606 runs, 0 failures, 0 errors, 1 skip; JS 491 of 491 files passed.

Commits this round: `62a1fc990` (m1, n1), `076acc1d6` (m2), `71960ca23` (n3, drawer sprite),
`4a4f97f37` (merge of `main`), and this note with the backlog change.

## L: lockout as a cause (2026-11-11)

Branch `build/9-2-l`, from `build/9-2-h` at `6192486b6` (H built, in review round 2; nothing of
H's code was changed). Browser port 3019. The user said yes to this sub-slice (decision 14,
2026-11-10).

### Built

- **L-1 server** (`3e7ed227a`). `AccessWork.lockout_station?`: the NPC's own station is a sign-in
  PC it owns (no `screenOwner`, or its own id), the NPC has an account, and the PC's policy (its
  own, else `defaultPolicy`) sets a positive `maxAttempts`; it joins "can fail" for `work`.
  `POST /npc_frustration` takes `event: "check"` (`check_report!`): refused unless the object is
  that station and in a room the player can know of (R2 m5's rule); answers `{ npcId, lockedOut }`
  from `loginLockouts`; a true answer adds the station to the NPC's `lockedOut` list and writes
  nothing else. A fail naming `locked_out` is refused unless that record exists
  (`RECORDED_WHYS`, replacing A's `REFUSED_IN_A_WHYS`); `locked_out` holds when the record exists
  and `loginLockouts` still holds the key; `owned_causes` passes the lockouts only behind the
  record, so a recorded lockout ignores `rearmed` and refuses eases at the station. The owner claim
  (`claim_login_session!`) is refused while `loginLockouts` holds the owner's username at that PC.
  The first slice's test "a lockout of the owner does not stop a claim" now asserts the reverse
  (plan 14), and A's R2 m2 test keeps passing unchanged in substance (no record, so no cause).
  Tests: `npc_lockout_l_test.rb` (11 runs: can fail; check true only for the owner's username at
  that PC, recorded once, nothing else written; refusals for another PC, no limit, another owner,
  a locked room, an NPC not met; `locked_out` only behind the record; owned cause with the borrow
  ease opening the gate; the claim refused; `GET /scenario` carries `lockedOut` and never
  `loginLockouts`, `loginFailures` or a guessed username; the sign-in answer is the same for the
  owner as for any username; tampered client).
- **L-1 validator** (`ff6c07487`). A lockout station is a cause for the mutter check
  (`station_fail` or `work_fail`); the work report line adds "locked out at '<pc>' after N wrong
  passwords for its username there (a denial of service)"; `earliest_pace` gives an NPC whose only
  failure is the lockout the use floor with the note "only by alternating eases and fails, once the
  player has locked it out" when it has another place (a non-desk source or a borrow PC), else the
  park floor. Tests: 2 in `validator-access-work.test.mjs`.
- **L-1 client** (`683e7c080`). `npc-reports.js`: `noteLockout(pcId)` on `pc_signin_failed` with
  `reason: "locked_out"` (keyboard or remote); `onOwnerReturned` on `workstation_owner_returned:*`
  sends a `check` only when `shouldCheckLockout` holds (`wasLocked`, a lockout seen at that PC, a
  positive `maxAttempts`, the owner has a work plan with that PC as `needsHome`, not already
  flagged) and the needs system takes the hold; every check gets one answer for the needs system
  (`lockedOut` true only when the server said so for that NPC; a lost request is sent once more,
  then counts as no). `npc-needs.js`: `lockedOut` and `lockCheck` on each NPC's state,
  `lockCheckSent`, `isLockedOut`, `npc_locked_out:<npcId>`; a judged use at the NPC's own station
  holds its verdict while a check is in flight (`LOCK_CHECK_WAIT_MS` 30 s, then `lock_check_lapsed`);
  a flagged station adds `{ id, why: "locked_out" }` first to the verdict (work only, never at a
  borrowed PC); the flag is restored from `npcFrustration.lockedOut` (station only) and kept
  through `reset()`; `getState()` gains both. `workstation-state.js`: `env.lockedOut(owner, pc)`
  makes a flagged owner's screen lock on every leave (after the roll, so the seeded sequence of
  other screens does not shift). Tests: `npc-lockout.test.mjs` (15; the hold and flag tests were
  checked to fail with the code taken out); `npc-reports.test.mjs` install test now finds the three
  listeners by name.
- **Tooling** (`f16451753`). Leak scanner rules `lockout_list` (a `loginLockouts` or
  `loginFailures` key anywhere; a `lockedOut` list anywhere but `GET /scenario`'s
  `$.npcFrustration.<id>.lockedOut`) and `lockout_unrecorded` (a PC in that list, or a
  `lockedOut: true` in a `/npc_frustration` answer, that the game's record does not hold);
  `access-leak-check.rb` prints the recorded lockouts checked. `verify-run --access` adds "locked
  out at <pc>" to an NPC's line. Bridge: `work()` gains `lockedOut`, `lockCheck`; `reports()` gains
  `checks`, `lockoutSeen`. Tests: 3 scanner, 1 verify-run, the bridge test extended.
- **L-2 scenario** (`303630655`). `lock_room` east of `open_office`: Jake (`jake_pc` under
  `strict`, `lockChance: 1`, borrow `hot_desk_2` at 50, `screenHabit: { lockChance: 0 }`), Leo
  (`leo_pc` under `strict`, `lockChance: 0`), `hot_desk_2` (unowned, `managed`) between them, a
  fridge; aim `lockout_beats` with four tasks. `PLAYTEST.md` run L, expected validator output now
  eight warnings (the two new ones are the first slice's "maxAttempts: confirm another route"
  for `jake_pc` and `leo_pc`).
- **Needs captures** (`9341c3f5f`): `access_model_needs_baseline/slice_9_2_l/`, 0 subjects differ
  in both scenarios.
- **Docs** (`fe8446e4b`): `README_scenario_design.md` "Lockout as a cause" (when the owner finds
  out, the lesson and its per-PC limit, what it tells the player); `docs/test-bridge.md`.

### Choices made (where the plan left one open)

1. The `check` is answered only for the NPC's own station (`needsHome`), not any PC it owns
   through `screenOwner`: the flag only matters there (5.2's "own station"), and it narrows
   decision 14's exposure.
2. A fail naming `locked_out` with no record is `refused`, not `stale` (an honest client never
   sends one, and `stale` would trigger a sync and a resend).
3. `locked_out` is applied to `work` only. A lockout at a `social_media` station is left to
   sub-slice C (the "can fail" rule for `social_media` has no `maxAttempts` clause in the plan).
4. No check is sent for an owner already flagged, including one flagged by a restore: the plan's
   "or where npcFrustration already lists the owner" is met by the restore itself, since the
   server's record stands for the mission.
5. The hold sits at verdict time (`_completeJob`), so the use's own dwell covers the request; the
   hold lapses after 30 s of needs clock so a lost answer cannot freeze an NPC.
6. The lockouts this browser has seen live in the page only. A reload between the lockout and the
   owner's locked return loses the mark, and the owner then works on; one more wrong password for
   that username at that PC (answered locked_out again) marks it again. Persisting the mark would
   need a new saved field; not done.
7. Scenario: the hot desk is in the same room (a short walk; the beat is the lockout, not the
   walk). Jake and Leo use a fridge (`hunger`): with a coffee station the validator warned that
   Dana's caffeine need and theirs could cross rooms. Leo is locked out by claiming his open
   screen, Switch user and three wrong passwords, since his screen never locks.

### Browser run L (game 1241, port 3019)

| Step | Result | Evidence |
|---|---|---|
| Lockout | **Pass** | Jake left (`screenLocked: true`); three wrong passwords on his tile: "2 attempts left", "1 attempt left", "This account is locked on this PC."; `pc_signin_failed` `locked_out`; `lockoutSeen` `jake_pc`. In this run Jake came back between the second and third password, so his return preceded the lockout and no check was due; he found out at his next locked return about three minutes later, as the plan intends |
| Check and failure | **Pass** | `workstation_owner_returned:jake_pc` `wasLocked: true`, one check (`checks` 1 for the whole run), `npc_locked_out:jake`, `npc_use_failed:jake` `missing: [{ jake_pc, locked_out }]`, `station: true`, mutter `station_fail`, park `failed` 30 s; levels 20, 40, 60 (tell 1, 2, 2) |
| Hot desk | **Pass** | At 60: `npc_workaround:jake` started, "I'll use the spare PC.", `npc_sat_at:hot_desk_2`, `npc_borrowed_session:hot_desk_2` `met: true`, ease to 50; the next station fail after the ease counted at the use floor (70). A click on the hot desk opened "Signed in as Jake Brooks (jbrooks)" (`pc_signed_in` `via: "claim"`) |
| Leo | **Pass** | Claimed his open screen, Switch user, three wrong passwords: locked out at `leo_pc`. He came back (`wasLocked: false`), no check, and worked on (`npc_used:leo_pc` `met: true`). On his next trip a click showed the sign-in screen (`pc_signin_shown` `reason: "claim_refused"`); the server log names "the owner is locked out at this PC" |
| Tasks | **Pass** | `l1_locked_out`, `l1_hot_desk`, `l1_claimed`, `l1_leo_locked_out` |
| Reload | **Pass** | `location.href` to `/games/1241?skip_resume=1`: `npcFrustration.jake` came back with `lockedOut: ["jake_pc"]`; once `lock_room` loaded the needs log had `locked_out` `restored: true`, `checks` 0, and Jake's first use failed with `locked_out`; that fail was counted (90 to 100) and he borrowed the hot desk again |
| Server record | **Pass** | `loginLockouts` `jake_pc\|jbrooks`, `leo_pc\|lmarsh`; `npcFrustration.jake` "locked out at jake_pc"; no `lockedOut` for Leo; `guestSessions.hot_desk_2` `jake` (a fresh borrow after the reload) |
| Leak check | **Pass** | 68, then 112 responses: `VERDICT: no leaks found`, 1 recorded lockout checked, `lockout_list` 0, `lockout_unrecorded` 0 |

Tampered client, from the page (`window.ApiClient`): a fail for Leo naming `locked_out` (no
record): refused; a check for Jake naming `hot_desk_2` and one naming `leo_pc`: refused; a rearmed
`locked_out` fail for Leo: refused; a state sync carrying `npcFrustration` (Leo locked out, Jake
cleared) and an empty `loginLockouts`: ignored (verify-run unchanged), and Leo's fail after it
still refused; an owner claim at `leo_pc` and at `jake_pc` with globals saying the screen is open:
422 "Sign in required".

### Observations, not changed

- The sign-in screen shows "This account is locked on this PC." twice after the third wrong
  password (first slice's minigame; not touched).
- After the hot desk, Jake alternates a station fail and a borrow about every 35 s, his level
  between 90 and 100 (H's repeating borrow, as designed); 19 report requests in about 8 minutes,
  never two within 2 s.
- `access-leak-check.rb` pads rule names to 16 characters, so `lockout_unrecorded` runs into its
  count column (cosmetic).
- The validator's error for `hall_c_drawer`'s `filing_cabinet1` sprite comes from H's Hall C, not
  from L.
- The first slice's scripted runs were not repeated (plan 14). Reason, from the scripts and the
  code: none of `test_access_signin`, `test_access_sessions` (or any other scenario) has a work
  plan, so "can fail" and the checks cannot reach them; the claim refusal is the only change that
  can, and no beat claims a locked-out owner's session (S7 locks Sam out at `lockout_pc` and signs
  in by password; the sessions runs have no lockout). Any mission where a player locks out an owner
  and then claims that owner's open screen now gets the sign-in screen instead.

### Needs regression

Before (games 1235, 1236) with the three client files at `6192486b6`; after (games 1239, 1242) at
`683e7c080`: `test_npc_needs` and `test_needs_leash` 0 subjects differ.
`access_model_needs_baseline/slice_9_2_l/COMPARISON.md`.

### Leftover games

1235 and 1236 (before captures), 1239 and 1242 (after captures), 1241 (browser run). Shared dev
database, mission 243. The :3019 server is stopped.

### Suites

Under the lock after the last code change: Rails 1618 runs, 21852 assertions, 0 failures, 0
errors, 1 skip; JS 492 of 492 files passed.

### Commits

`3e7ed227a` (server), `ff6c07487` (validator), `683e7c080` (client), `f16451753` (tooling),
`303630655` (scenario and run L), `9341c3f5f` (needs captures), `fe8446e4b` (docs), and this log.
Nothing merged.

## L review round 1 outcomes (2026-11-11)

Reviews: `ACCESS_MODEL_SLICE_9_2_L_CODE_REVIEW_R1_SERVER.md` (0 blockers, 0 majors, 4 minors, 5
nits) and `ACCESS_MODEL_SLICE_9_2_L_CODE_REVIEW_R1_CLIENT.md` (0 blockers, 1 major, 3 minors, 5
nits). Every fix below has a test that fails with the fix taken out (checked by reverting each one
in turn).

### Orchestrator decisions (recorded)

- **Client M1, the reload gap: the server sends the PCs.** `GET /scenario` carries `lockoutPcs`, the
  ids of the sign-in PCs where `loginLockouts` holds any key (PC ids only, never a username or a
  password), and the client seeds its "lockout seen" mark from it. The player caused and was shown
  each of those lockouts, so this tells the browser nothing new. Plan 6.6 and the 9.2 table now say
  so. The leak scanner allows exactly `$.lockoutPcs` in `GET /scenario`.
- Server m2: `locked_out` is a `work` cause only, as on the client. Server m1: the hot-desk guest
  path reads `loginLockouts`. Server m3: the check needs a work plan. Server m4: the scanner is
  widened. Client m1: a "not locked out" answer clears the mark. Client n1: a lapse is never "met".

### Server review

| Finding | Outcome |
|---|---|
| m1 a locked-out guest leaves a claimable session | **Fixed.** `Game#account_locked_out_at?(pc, npc)` (the key `attempt_login!` builds); `record_borrow_done!` writes no guest record for a borrower locked out at that PC (as for a careful guest), and `claim_guest_session!` refuses "the guest is locked out at this PC". The owner claim uses the same helper. Tests: a borrow by Jake locked out at a `strict` hot desk leaves no `guestSessions` entry and the claim is 422; a planted guest record is refused while the lockout holds and granted once it is gone |
| m2 `locked_out` owned for `social_media` | **Fixed.** `AccessWork.owned_causes` adds `locked_out` only for `work`; `fail_report!` refuses a `locked_out` cause on any other need. Test: Jake with `work` and `social_media` at `jake_pc` (desk only), recorded locked out: a social fail naming `locked_out` is refused and a social ease at the station is answered |
| m3 the check needs no work plan | **Fixed.** `check_report!` refuses unless `AccessWork.work_plan?`. Test: a needs-only owner under `strict`, locked out, is refused and nothing is recorded |
| m4 the scanner checks key names only | **Fixed.** `lockout_list` also reports a boolean `lockedOut` outside `POST /npc_frustration` and `POST /login`, and (with the game) any string holding one of the game's `loginLockouts` or `loginFailures` keys, under any key; and a `lockoutPcs` anywhere but `GET /scenario`'s `$.lockoutPcs`, or an entry there that is not a PC the game holds a lockout at (without a game, any key-shaped entry). Tests: one row each; no username in the report lines. The first L scanner test now also expects the `lockout_key` finding its own planted list gives |
| n1 the owner claim is a second oracle | **Recorded** in plan 9.3's residual list: the claim answers the same question as the check, for any owner |
| n2 plan 9.1 point 2 | **Fixed**: "for `work` only ... once a `check` has recorded it" |
| n3 a record that outlives its lockout | **Test added**: `lockedOut: ["jake_pc"]` with no `loginLockouts`: the fail is refused, the station ease accepted |
| n4 `lockedOut` sent as stored | **Fixed**: `GET /scenario` sends the stored list intersected with the NPC's station. Test with a stored `["jake_pc", "leo_pc", 7]` |
| n5 column width | **Fixed**: `ljust(20)` |
| Validator error on `hall_c_drawer` | H's; gone after merging `build/9-2-h` (the validator now shows no failure lines on `test_access_work`) |

### Client review

| Finding | Outcome |
|---|---|
| M1 the mark lost on reload | **Fixed** (decision above). `NpcReports.seedLockouts(list)`, called by `installNpcReports` from `window.gameScenario.lockoutPcs` (strings only). Server test: `lockoutPcs` lists `jake_pc` and `leo_pc` after lockouts of guessed and real usernames, drops a PC that is not a sign-in PC, carries no username, and the GET writes no record. Client test: the install seeds the mark and a locked return then checks |
| m1 a false answer leaves the PC marked | **Fixed.** A per-PC count of lockout answers; the check carries the count when queued (never sent). An answer from the server with `lockedOut: false` for that NPC clears the mark unless the count has moved since; a refused or lost answer keeps it. Tests: no second check after a no; a new lockout answer marks it again; refused, lost, and a lockout noted while the check was in flight all keep the mark. After a reload the mark is seeded again from `lockoutPcs`, so a lockout of some other username costs one check per page load |
| m2 no test joins the three layers | **Test added**: a real `WorkstationState`, `NpcReports` and the needs core on one dispatcher; Dana leaves for coffee, comes back to a locked screen, the check is sent and the hold taken in the same task as the return, her use waits, the answer arrives, the use fails with `locked_out`, no use is met. It fails with the hold taken out. Also added: a late true answer after a lapse still flags; `markCheck` refusing queues nothing. Not added: `_lateRoll` for a flagged owner (it goes through `_rollScreen`, which the screen test covers) |
| m3 README says the wrong screen | **Fixed**: "Their own PC's screen locks on every leave ... the hot desk is left as the borrower's habit says (unless they are locked out there too ...)" |
| n1 a lapse lets a use through as met | **Fixed.** After `LOCK_CHECK_WAIT_MS` with no answer the use is skipped, not judged: nothing restored, no `npc_used`, no report; the check stays in flight with its wait started again, so the next use there waits too, and only an answer ends the wait. The NPC never freezes (it goes home and comes back). Plan 6.6 and the README say so. Test: the lapse gives no `npc_used` and no failure, a second use lapses again, and the use after a no is met |
| n2 the third policy lookup | **Comment added** at the copy in `npc-reports.js` naming the other two. Not merged: the copy reads the loaded room's sprite first, which `pc-policy.js` does not, and a new import there needs the JS test harness copy lists |
| n3 the lockout shown three ways | **Not changed.** First-slice code; it is not a one-liner choice: the toast is the engine's refusal convention (the error-toast floor), and dropping the form message or the overlay changes the first slice's sign-in screen. For a first-slice pass |
| n4 a check answer with no needs state | **Comment added** in `_applyAnswers` |
| n5 `writes_down` on a lockout station | **Fixed**: one sentence in the README's lockout section |

### Browser check (game 1253, port 3019)

Keyless server on :3019, stopped by PID afterwards. A new game started in `lock_room`.

- Jake left for the fridge (`workstation_owner_left:jake_pc` `screenLocked: true`). Three wrong
  passwords for `jbrooks` through `pcSessions.signIn` (the minigame's own path): wrong (2 left),
  wrong (1 left), `locked_out`; `lockoutSeen` `["jake_pc"]`; Jake had not come back.
- Reload (`?skip_resume=1`) before his return. `GET /scenario` carried `lockoutPcs: ["jake_pc"]`
  and no `lockedOut` for Jake; after the install `lockoutSeen` was `["jake_pc"]`, `checks` 0.
- Jake's next trip: `workstation_owner_returned:jake_pc` `wasLocked: true`, one check (`checks`
  1), `npc_locked_out:jake` a second later, then `npc_use_failed:jake` `missing: [{ jake_pc,
  locked_out }]`, `station: true`. No use of `jake_pc` was met after the return.
- Server record: `loginLockouts` `["jake_pc|jbrooks"]`; `npcFrustration.jake` level 20,
  `lockedOut: ["jake_pc"]`, `failWhy.work: ["locked_out"]`.
- `access-leak-check.rb` over the 20 responses (two `GET /scenario` with `lockoutPcs`): no leaks;
  `lockout_list` 0, `lockout_unrecorded` 0.

### Leftover games

1253 (this round's check), on the shared dev database.

### Merges and suites after review round 1

`build/9-2-h` merged at its head `fa0f92445` (one conflict, this log: both sides kept, H's rounds 2
and 3 before L), then `main` at `22255f183` (no conflicts). The validator shows no failure lines on
`test_access_work`. After both merges, under the lock: Rails 1630 runs, 23720 assertions, 0
failures, 0 errors, 1 skip; JS 493 of 493 files passed.

Commits this round: `cd9c13722` (server and scanner), `8d5a26428` (client, README and plan), the
two merges, and this log with the run L reload beat in `PLAYTEST.md`.
