# OPS_LOCK_SECOND_STEP_PLAN.md, review round 3 (delta)

Reviewer: Opus 5.5, 2026-11-19. Plan at 28e4c0bad (719 lines), whole plan read; delta
f8cf656b1..28e4c0bad. MFA and log plans read where the lock plan meets them. Code read in this
worktree. Stopped near the context limit; the one item not verified is listed at the end.

Counts: 0 blocker, 1 major, 5 minor, 7 nit.

## R2 and cross-plan closure

- **R2 M1 / X1 (`save_limit: true`)**: closed. Plan 651-653 keeps the default
  `save_limit: false`; the controller test at 546 and 552 checks rows are stored.
- **R2 M2 (identity keys)**: closed and right against the code. Rule C now reads ids on the path
  `resolve_unlock_target` returns (plan 217-224, 238-246). `held_usb_sticks` deep-dups every call
  (`game.rb:5011-5020`), so an id test on the path is the only thing that works; the plan says
  so (54-55, 222-224). Each exit can carry a path: `find_scenario_object` and its helper
  `find_object_in_contents` (`game.rb:4867-4915`, `:5025-5035`), `find_resource_item`
  (`network_access.rb:1687-1695`), `find_container_recursive` and `search_nested_contents`
  (`games_controller.rb:3000-3046`, `:3106-3117`), `find_accessible_item` (`:3599-3697`). The
  validator error for `secondStep` inside any `usb` item is in (474-475), and the copied-source
  controller test (548). Habit sticks live in `itemsHeld` (`access_work.rb:1225-1231`), so both
  walks reach them.
- **R2 m1 / X8**: closed. Re-answer from the record with `numbers(..., record['nonce'])`
  (283-287) matches MFA 5.1 (MFA plan 234-240) and the record keeps `nonce` (MFA plan 379-382).
  Request 1 is one line (659); "seven" is gone.
- **R2 m2**: closed (409; ids only, 399-401).
- **R2 m3**: closed, with a gap (m4 below).
- **R2 m4**: closed. `ApiClient.post` exists (`api-client.js:34`), `stateSync.nextClientTs`
  exists (`state-sync.js:800`); one re-post, rejects on a second `secondStep` (349-356, 564-566).
- **R2 m5**: the log plan's table row now says it (log plan :1144, :1207); its 5.1 bullet
  (log plan :225-229) still does not. Request 3 keeps asking; fine (n7).
- **R2 m6**: closed (184-186, 474-475). Only the payload filter reads `tableItems`
  (`game.rb:7287`).
- **R2 m7**: closed; all eight questions end "The plan is written to (a)." No review or round
  references in the plan.
- **X14**: closed (stages G1 and G2); two small leftovers in n1 and n2.

Validator pointers verified: `require_relative 'validate_network'` at `validate_scenario.rb:26`,
`access_work` at `:44`, `headless_npc_records` at `:1259`, `check_objectives_wiring` at `:1602`,
`when 'unlock_object'` at `:1719`, `DOOR_ENTRY_LOCK_FIELDS` warn at `:8050-8055`, the
`access`/`acceptsUIDOnly` error list at `:8059-8064`, the gate test at `:8065`,
`check_npc_held_containers` in the run list at `:8948`; `awareness_world_room?` at
`game.rb:153-159`; `unlock_room` and `enter_room` are task types (`scenario-schema.json:4101`,
`game.rb:5242`, `:5278`). Graph pointers verified: room locks `generate_dungeon_graph.rb:98-105`,
`walk_objects` `:141-155`, NPC node `:218-226`; dashed edges supported (`add_edge`, `:82`).
The closed `method` list (640) equals the methods `UNLOCK_METHODS_BY_LOCK_TYPE` admits for the
non-flag types plus `npc` (`game.rb:4491-4502`).

## Major

### M1. The unchanged-scenario proof builds its own golden mechanism

Plan 514-521 (section 10, proof 2): "a capture script records ... the JSON of every `/unlock`
answer, `GET /container` answer and `filtered_room_data` room; a spec compares byte for byte".
Plan 611 repeats it ("the section 10 capture"). Brief section 5 ("Unchanged scenarios"): one
mechanism, fixtures captured from main in `test/fixtures/files/ops_unchanged/`, compared by
`bin/ops-golden-compare`; every plan names which fixtures it adds there, none builds its own.
The MFA plan does it this way (MFA plan 881-886).

**Fix.** Proof 2 names the fixtures this plan adds to `test/fixtures/files/ops_unchanged/`
(the `/unlock`, `GET /container` and room answers for the unlock and container controller
fixtures and `test_objectives`, `test_simple_success`), captured from main before any change,
compared by `bin/ops-golden-compare` in a named test file. Drop "a capture script" and "a spec
compares"; reword 611 to "capture this plan's `ops_unchanged` fixtures".

## Minor

### m1. Validator door rules edit `check_access_model`, not the plan's own file

Plan 466-469 adds `secondStep` to the error list in the door loop (`validate_scenario.rb:8059`);
plan 477-478 puts the gate rule in "the same door loop, `:8065`"; plan 623 lists
"`validate_scenario.rb` (run list, door loop)". Brief section 5: each feature's checks go in its
own file, hooked by one line. Both door rules need only `rooms[*].doors[]` and `connectedRoom`,
which `check_lock_step` can walk itself.

**Fix.** Both door rules go in `scripts/validate_lock_step.rb`, over its own loop of
`rooms[].doors[]`; `validate_scenario.rb` gains only the `require_relative` and the run-list line,
as `validate_network.rb` has. `validate_lock_step.rb` requires `lib/break_escape/mfa_model.rb`
itself (plan 453-454 says the validator loads it "as it loads `access_work.rb`", which reads as a
third line in `validate_scenario.rb`). Say it relies on `headless_npc_records` from
`validate_scenario.rb:1259`, as other split files rely on shared helpers.

### m2. The graph's "never approves" edge has no predicate it can call

Plan 501-502: "A step the validator finds can never pass gets a dashed edge". The rule lives in
the validator (483-489), which the graph does not load: `generate_dungeon_graph.rb:21-29`
requires only `lib/` files, and `mfa_model.rb` is not among them.

**Fix.** Put the never-pass test in `lib/` (for example `MfaModel.lock_step_never_passes?(
scenario, lockable)`, reading `prompt_habit` and where the phone or device sits), called by both
the validator and the graph; add the `mfa_model` require to the graph. Also say whether an owner
node "added when missing" (500-501) gets the room edge the room walk gives (`:221-222`) or sits
unattached.

### m3. "A task needs" misses tasks inside the gated object

Plan 486-489: the never-pass error fires only for an `unlock_object` task naming the gated
object or an `unlock_room`/`enter_room` task naming the gated room. A never-passable gated PC
holding a file a `collect_items` task needs, or a nested archive an `unlock_object` task names,
is only a warning, though the mission cannot be finished.

**Fix.** "A task needs" the lock when any task's target is the lock or sits anywhere below it
(`unlock_object` or `collect_items` naming an id in the subtree; for a room, any task target in
that room). The walk already keeps the ancestor chain (457).

### m4. `validate_unlock` without `resolved:` loses the path

Plan 267-269: left nil, `validate_unlock` "finds as today", which returns no path, so Rule C has
nothing to read; yet plan 531 tests that the two calls "agree". **Fix.** Say that with
`resolved: nil` it calls `resolve_unlock_target(target_id)` itself and uses both object and
path; the existing unit tests still pass strings unedited.

### m5. Refusal bodies not stated against the brief's rule

Brief section 5: a route that extends an existing one may keep that route's body "and says so".
Section 6 (395-416) does not say it. `/unlock` keeps its bodies (with the one new 200), and the
lock form of `/mfa/*` uses the MFA plan's flag bodies (`codeLocked`, `tooSoon`, `expired`,
`cancelled`; MFA plan 715-718), not `{ success: false, reason: }`. `second_step_cancelled` is a
client-made reason, not a server body. **Fix.** One sentence in section 6 saying all three.

## Nit

- **n1.** Playtest beats K1 to K11 (589-599, 601, 613) reuse the realism skin plan's stage ids
  K1 and K2 (`OPS_REALISM_SKIN_PLAN.md:143`). Rename the beats (for example B1 to B11).
- **n2.** Plan 3 needs MFA "M1b to M3"; plan 609 "M1a to M3". Pick one. X14 also asked the plan
  to name the log stage it needs: L1a for the helper, and L1b for K11's `badge_swipe` row.
- **n3.** Plan 287 hard-codes the subject key `"object:<id>"`; a door's is `"door:<roomId>"`
  (313). Write `<record key>`.
- **n4.** `already_open` (`games_controller.rb:1223-1224`) tests the posted string. At a G2
  gated rfid object whose name a twin put in the list, the final answer says `alreadyOpen: true`.
  For a gated target compute it by Rule B.
- **n5.** Plan 210 "every NPC's `itemsHeld`": say room NPCs and headless records, as 455-456
  does (`released_npc_containers` includes headless, `game.rb:4952`).
- **n6.** A gated room object's `tableItems` ship before the step (the filter recurses into them
  and removes only `contents`, `game.rb:7280-7287`). Add a warning beside the `text` one (493).
- **n7.** Log plan 5.1's granted `badge_swipe` bullet (log plan :225-229) still omits the gate;
  its table (:1144) carries it. Request 3's last clause stays open until 5.1 says it.

## Fresh attack on the delta: checked, no leak found

- A knock-out drop stores the NPC's full held item with nested `contents`
  (`game.rb:1134-1137`). A gated archive inside a dropped bag: the payload filter drops a nested
  locked object's `contents`; Priority 0 take matches top-level added objects only
  (`games_controller.rb:3607-3615`); `GET /container` and the resolver walk the scenario, not
  `objects_added`. Nothing below the step leaves.
- Carried and dropped copies are concatenated into the room before the marker
  (`game.rb:2884-2889`, `:2999-3010`), so the id-only marker covers them.
- The plain `GET /container` finder walks in a different order from the resolver and matches
  only objects with `contents` (`games_controller.rb:3029-3044`); Rule C on its own found path
  still refuses a closed subtree, and the object whose contents ship is the one tested.
- The inventory copy reads `@collectible_location` (`games_controller.rb:3322-3329`), which holds
  a container id, not a path; the plan's "take searches carry the same path" (222) covers it,
  but the build must add the path to that location hash.

## Not verified

The MFA plan's `GET /mfa/device` row (MFA plan :714) still says "a policy declares an `mfa`
kind (else 404)"; MFA plan :725 defers the lock form to A25. Request 2 asks for the lock case;
whether the MFA text should already carry it was not settled here.

## Verdict

Close to ready. Every R2 finding is closed and the path-based Rule C holds against the code at
every exit. One major (the unchanged-scenario proof must use the shared `ops_unchanged` fixtures
and `bin/ops-golden-compare`) and five small minors, all text edits. A delta round after the fix
should find nothing above nit.
