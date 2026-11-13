# Gated-door server check: build log

Builder log for GATED_DOOR_SERVER_CHECK_PLAN.md. One section per chunk.

## Chunk A: server split and serve (2026-11-13)

Server split and serve, the object-action gate, and the object-path client retry. No credit
(Chunk B) and no enter_room validation (Chunk F); the enter_room branch of complete_task! and
objectives-manager.js were left untouched.

### Done

Model (`app/models/break_escape/game.rb`), new helpers after `awareness_world_room?`:

- `npc_route_rooms` / `in_npc_route_room?` / `record_npc_route_room!` for the
  `player_state['npcRouteRooms']` list (defaults to `[]`, server-written only, §3.1).
- `server_owned_global_name?` (worn + imported + SERVER_OWNED union; serverCreditGlobals join in
  Chunk B), `scenario_has_rfid_cloner?` (recurses container contents), `gate_splits?`,
  `gate_for_connected_room`, `gated_route_room?` (NPC-keyed), `split_gated_door?` (door-keyed),
  `object_in_unpromoted_route_room?` (§3.6 predicate via `login_scope_of(...):room_id`).
- Feedback-helper nil/false returns added alongside the existing `unlock_scope_refused?` guard in
  `pin_cracker_feedback`, `password_case_mismatch?` and `uid_only_refusal?` (§3.6).

Controller (`app/controllers/break_escape/games_controller.rb`):

- `room`: route room is served (accessibility check gains `is_route_room`) but NOT auto-unlocked
  (auto-unlock guard gains `&& !is_route_room`) (§3.2).
- `unlock` door branch: `gated_route_room?(attempt, target_id) && !room_unlocked?` records the room
  in `npcRouteRooms` and serves `filtered_room_data` + `track_npc_encounters` without
  `unlock_room!`; otherwise `serve_opened_room` as before (§3.5).
- `unlock` object branch: a valid-path guard before the transaction refuses an object in a
  served-but-unearned route room with `{ success: false, reason: 'room_not_reachable',
  retryable: true }`, `:forbidden` (§3.6). Placed before `ActiveRecord::Base.transaction` so nothing
  is written and to avoid a non-local return out of the transaction block.
- `merge_last_write_wins_sections`: `currentRoom` acceptance extended to `npcRouteRooms` (§3.3a,
  acceptance only; viaPass promotion is Chunk B).

Client (`public/break_escape/js/systems/unlock-system.js`): `notifyServerUnlock` recognises a
`room_not_reachable` + `retryable` body on an object unlock (never a door), awaits one
`window.stateSync.sync()` wrapped so a rejecting/absent sync still proceeds, and re-posts
`apiClient.unlock` once, returning the re-post answer on success and surfacing the refusal otherwise.
No new static import, so no test-harness copy-list change.

### Tests

- Rails (new `test/models/break_escape/gated_route_room_test.rb`,
  `test/controllers/break_escape/gated_route_room_controller_test.rb`): 14 runs, 48 assertions,
  green. Covers plan tests 1, 6, 10, 11a, 12 (pin + password discrimination; uid_only false in the
  route room), 13, plus the list/predicate helpers.
- Node (new `test/js/unlock-route-room-retry.test.mjs`): the four §13 object-retry tests, green.
- Regression batch (all green): npc_container_unlock, unlock_response_filter, access_model_rfid,
  npc_mapping_unlock_door, avatar_unlocks, authorization, mail_state_sync, captures_sync,
  access_model_login, combination_cryptex_unlock, flag_reward_unlock_door; and the unlock-system
  node importers (rfid-clone-entry, rfid-clone-entry-load, door-gates-bar, door-gates-player-open,
  unlock-r1-ux).

### Plan drift noted

- `game.rb` line citations shifted since the plan (wearables UI landed on main): the methods are
  the same. Observed: `rfid_lock_passes?` 2545->2661, `rfid_requires_held?` 2563->2679 range,
  `uid_only_refusal?` 2633 (unchanged), `unlock_scope_refused?` 2740 (plan said 2758 for the
  neighbouring `unlock_session_refusal`), `pin_cracker_feedback` 3277, `password_case_mismatch?`
  3290, `validate_unlock` 3081->3196, `npc_mapping_unlocks_door?` 3521. Controller: unlock action
  1088, object branch ~1178, `serve_opened_room` 2244, `merge_last_write_wins_sections` 2098 all as
  cited. Intent followed in every case.

### Interim behaviour (resolved by Chunk B)

- In Chunk A alone a credential (`method: rfid`) door unlock of a split room still goes through
  `serve_opened_room` -> `unlock_room!` and does not delete the room from `npcRouteRooms`, so a room
  can briefly sit in both lists. Harmless here: the object gate keys on `!unlockedRooms.include?`, so
  once the room is unlocked its objects open. Chunk B's viaCredential promotion adds the
  `npcRouteRooms` delete.
- uid_only promoted-path discrimination (reason returns after promotion) is left to Chunk E's
  end-to-end UID-only clone fixture; the route-room guard for uid_only is proven false here and is
  byte-identical to the pin/password guards, which are proven both ways.

### Open / not done in Chunk A (by design)

- No `creditOnPass`, no server-owned credit globals, no viaPass/viaCredential (Chunk B).
- No schema/validator/graph work, no scenario edits, no migration (Chunks D/E).
- enter_room validation untouched (Chunk F, parallel branch).
