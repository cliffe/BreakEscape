# Friendface phone item: R5 fixes, verification

Branch `build/ff-phone` at fbff78cbb. A short check of the R5 fixes (2b1b08607 merge of main,
0661b7bcf, f2cc857e3, e9b330031, fbff78cbb) against `FRIENDFACE_PHONE_ITEM_CODE_REVIEW_R5.md` and
the build log's "R5 fixes" section. Not a full review round. No live run: points 1 to 3 passed on
reading and tests.

Counts: 0 blocker, 0 major, 1 minor, 3 nit.

| Point | Result |
|---|---|
| 1. M1, `move_npc` removed | Pass |
| 2. M2, collect matching by id, lock ref or name | Pass |
| 3. m1 and n2 | Pass |
| 4. Affected tests and the branch diff | Pass |

## 1. M1: `update_room` `move_npc` (pass)

- The `when 'move_npc'` branch is gone from `games_controller.rb#update_room`; an unknown action
  answers 400. `RoomStateSync.moveNpcToRoom`, its window export and the batch helper's `move_npc`
  case are gone from `room-state-sync.js`.
- Nothing sends it. A search for `move_npc` and `moveNpcToRoom` over the engine, scenarios, ink,
  tools, scripts and tests finds only `remove_npc` tags (a substring match), the removal comments,
  and server-side `Game#move_npc_to_room!` calls in four test files. The sibling Hacktivity checkout
  (read-only search of its Ruby, JS and ERB) has no caller.
- No other client-writable route marks an NPC met. `encounteredNPCs` is written only by
  `track_npc_encounters` (GET /room and `serve_opened_room`, for a room the player may enter) and
  by `encounter_npc!`, whose one caller is the inventory NPC branch for a headless email record
  (never a room NPC, so never KO-claimable). `sync_state` merges `currentRoom`, `globalVariables`,
  `phoneState`, `mailState`, `npcInkVariables`, `biometricSamples`, `timedMessages`,
  `triggeredEvents`, `commandBoardLog`, `scenarioClock`, `scenarioBriefShown` and the hostility
  record; none of these writes `encounteredNPCs`. The remaining `update_room` actions are
  `add_object`, `remove_object`, `update_object_state`, `update_npc_state` and
  `remove_npc_from_scene`; none adds an NPC to a served room. `npcs_added` now has no client writer.
- Probe 1650's Rails test (`forged_ko_drop_test.rb`, "R5 M1 (probe 1650)") fails on the pre-fix
  controller: with `games_controller.rb` from 0661b7bcf^ swapped in, the move answers 200
  (`{"success":true}`) where the test expects 400. With that status assertion turned off in a
  throwaway copy, the next assertion also fails: Kevin, with his lockpick and server room keycard,
  is stored in reception's `npcs_added`. So the replay reproduces the real leak on old code, not
  only the status. Controller restored and the copy deleted afterwards; the worktree is clean.
- `move_npc_to_room!` now replaces an NPC already in the target's `npcs_added`, so a server move
  keeps one copy per NPC per room (test "a server-side NPC move stores one copy").

## 2. M2: collect-objective matching (pass)

- Client: `targetIdMatches` in `objectives-manager.js` tries the id, the lock ref (`opens_lock`,
  then `key_id`) and the name for inventory items, key ring keys and pickup events (the event's
  `lockRef` and `keyId` too). `inventory.js` and `npc-game-bridge.js` add `lockRef` to the pickup
  event.
- Server: `validate_collection` gathers the id, `opens_lock`, `key_id` and name of each stored
  inventory item, top level and `scenarioData`, and intersects them with `targetItemIds`. It reads
  the server's own inventory copy, so a client cannot supply a name.
- One item cannot count twice: the server counts inventory items (`inventory.count`), so an item
  that matches two entries of one task counts once; the client counts one per pickup event.
- Collision scan of every scenario's `targetItemIds` (6 scenarios, 18 tasks with lists, 32
  entries; the rendered scenarios, every item hash at any depth matched on id, `opens_lock`,
  `key_id` and name): every entry matches exactly one item, and no item matches entries of two
  different tasks. The only items that match two entries are inside a single task with
  `targetCount` 1, where both entries name the same item on purpose: m01 `find_derek_access`
  (Derek's Office Key by name and by lock ref) and m06's three tasks that list an id and its name.
  m07 `recover_mole_evidence` (count 2) and `lab_intro_linux` `pick_all_locks` (count 5) list
  distinct items, one entry each. Stamped ids (`<npc>_held_<n>`, `<container>_content_<n>`)
  match no entry.

## 3. m1 and n2 (pass)

- m1: `track_npc_encounters` now reruns `Game#with_ko_drop_pending` for the NPCs the load has
  just recorded as met, on the same `room_data` hash that the room action renders and
  `serve_opened_room` returns. The listing needs `npc_ko_record_present?` (a KO stored as `true`)
  and `npc_ko_claimable?`. A forged KO for an unmet NPC is stored as `ko: false` by the merge, so
  it is not a KO record, and the first-load listing cannot be produced by a forgery. The listing is
  only a hint: the re-drop goes through the drop route, which applies the claim rule again.
- n2: the inventory NPC branch gives a Friendface phone that the story does not offer only when
  `npc_defeated?` holds, which is the R4 claim rule (KO record present, met, a room NPC, not
  `koImmune`, not a phone NPC). A forged KO for an unmet NPC therefore still gets 422. A forged KO
  for a met NPC is the accepted R4 residual (the KO drop itself is already allowed then), so n2
  adds no new route.
- Tests: "R5 m1: an old save with a KO and no met record lists the owed drop on the first load"
  and the n2 test in `friendface_phone_test.rb` pass.

## 4. Tests and the branch diff (pass)

Affected files only, no lock:

- Rails: `forged_ko_drop_test.rb`, `friendface_phone_test.rb`, `game_test.rb`: 131 runs,
  589 assertions, 0 failures. Then `access_model_no_password_test.rb`,
  `access_model_withholding_test.rb`, `access_work_plan_test.rb`, `game_state_locking_test.rb`,
  `reload_persistence_test.rb`, `score_breakdown_test.rb` and every controller, model and
  integration test file that mentions `update_room`, `validate_collection` or objectives (31
  files): 717 runs, 4860 assertions, 0 failures.
- JS: every `test/js` file that imports `objectives-manager.js`, `inventory.js`,
  `npc-game-bridge.js` or `room-state-sync.js`, plus `objectives-target-ids`: 42 files, 42 pass.
  `node --check` passes on every changed engine JS file.

Branch diff against main: the merge (2b1b08607) had one textual conflict, in
`docs/IDEAS_BACKLOG.md`. Five files changed on both sides; the two engine JS files that merged
without a conflict (`core/game.js`, `systems/interactions.js`) combine both sides' imports and
code correctly, and the tests above that load them pass. Nothing added since R5 blocks honest
play: no client sent `move_npc`, the wider matcher only adds matches, and m1 and n2 only add ways
to receive items an honest player is owed. Main is 44 commits past the merged base (de866cd20),
so the branch needs another merge of main before it lands.

## Findings

### Minor

- m1. **A collect task can be completed with no item (carried, predates the branch).**
  `validate_collection` returns true whenever the client sends `currentCount` at or above the
  target, before it reads the inventory, so the new matcher protects only requests without a
  count. Not an honest-play problem; it is a cheat-resistance gap that the build log already lists
  as open. Fix later by proving the notes and read-only file cases from server state.

### Nit

- n1. **The probe test fails first on the status.** On old code its first failure is the 200 from
  `move_npc`; the replay after it (met record, forged KO, drop, `/inventory add`) runs only on the
  new code. Checked by hand above that the replay does reproduce the leak on old code, so the test
  is sound. No change needed.
- n2. **`move_npc_to_room!` still trusts its arguments.** It checks connectivity but not that the
  NPC is in `from_room_id` or that the room is open. Safe now that only server code and tests call
  it; a future route that exposes it would reopen R5 M1. The comment above it says so.
- n3. **The load reconcile counts a held item while its aim is locked (carried).** In m01 a player
  who holds Kevin's lockpick before `build_the_case` opens has `find_derek_access` completed on a
  reload. This was true before the held-item stamp too; the stamp had hidden it. It completes a
  task early, which does not block anything.

## Sync size

Nothing new grows. `npcs_added` has no client writer, and a server move keeps one copy per NPC per
room. `koDropPending` is computed per room load, not stored. The pickup event's `lockRef` is
client-only.
