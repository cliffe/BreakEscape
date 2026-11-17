# Gated-door Chunk A: adversarial code review, round 1

Commit under review: 7d0ec8479 (diff b1256d2be..7d0ec8479), branch build/hard-tailgate-plan.
Reviewed against GATED_DOOR_SERVER_CHECK_PLAN.md sections 3, 9, 13 and the Chunk A bullet in 14.
Read-only review; code was not changed.

## Verdict

Changes advised, no blocker. Chunk A is a faithful implementation of the spec: the server split,
the GET-room serve without auto-unlock, currentRoom acceptance, the object-action gate, the three
feedback-helper guards and the client object-retry all match sections 3 and 14, and the new and
neighbouring tests pass. No forge path promotes a split room or opens its objects without the
earned credential, and no honest player in a non-splitting scenario (m01, sis01, sis02,
lab_social_engineering, the test-rfid scenarios, m01-m10) is affected. The two majors are both
about play that is correct only once Chunk B lands: they must be tracked before this reaches
players, and the build log under-documents the first.

## Counts

- Blockers: 0
- Majors: 2
- Minors: 3

## Findings

### MAJOR 1 - lab_physical_pentest and test_gate_tailgate are unwinnable via their tailgate path under Chunk A alone, and the build log does not say so

Files: app/models/break_escape/game.rb:200-210 (`gate_splits?` / `scenario_has_rfid_cloner?`),
app/controllers/break_escape/games_controller.rb:1156-1168, scenarios/lab_physical_pentest/scenario.json.erb:1372.

`gate_splits?` returns true when the scenario contains any `rfid_cloner` (the presence test, by
design permissive). lab_physical_pentest has both a gate (`openFor: ["len"]`,
`playerMayPassIf: "courier_ready"`) on the secure_area door and an rfid_cloner, so the gate splits
today, even though `courier_ready` is not yet a server-owned global (that is Chunk D/E). Chunk A
routes Len's `method: npc` route unlock into `npcRouteRooms` and does not promote. There is no
viaPass or viaCredential promotion in Chunk A (it is Chunk B), so a hi-vis tailgate player's
secure_area sits in `npcRouteRooms` permanently. The result for the honest tailgate player:

- `cm_deeds_key` (a loose takeable key in secure_area, needed to reach the deeds room) cannot be
  picked up: the pickup gate reads `unlockedRooms` (games_controller.rb:2711), which never gains
  the route room.
- The secure_area readable objects stay served (filtered_room_data) but any object unlock there is
  refused by the §3.6 gate.

So the lab's hi-vis finding is a dead end until Chunk B. The cloned-badge path is unaffected
(a `method: rfid` unlock with the held clone still runs `serve_opened_room` -> `unlock_room!`),
so a clone player completes; only the tailgate player is stranded. test_gate_tailgate's staff_room
splits for the same reason (it also carries an rfid_cloner) and is likewise unpromotable in A.

This is the spec's intended staging (plan §14: build order A then B; test 11b acceptance is
deferred to Chunk B), not an implementation defect. The risk is purely in deployment order. The
build log's "Interim behaviour (resolved by Chunk B)" section records the dual-list nuance but does
not state that the lab becomes unwinnable via tailgate under A alone.

Failure scenario: the integrator merges 7d0ec8479 to main in a batch without Chunk B (the "merge
the tested commit" rule allows per-batch merges); lab_physical_pentest ships with a broken hi-vis
path.

Suggested fix: add a line to the build log's interim section naming lab_physical_pentest/secure_area
(and test_gate_tailgate/staff_room) as unwinnable-via-tailgate until Chunk B, and flag to the
integrator that Chunk A must not reach main without Chunk B (and Chunk D, which removes the now
double-firing client credit writer at scenario.json.erb:932).

### MAJOR 2 - the §3.6 object retry covers only notifyServerUnlock methods; pin/password/combination/cryptex/flag object unlocks bypass it

Files: public/break_escape/js/systems/unlock-system.js:33,48-66;
public/break_escape/js/minigames/pin/pin-minigame.js:439,
combination/combination-minigame.js:335, cryptex/cryptex-minigame.js:310,
password/password-minigame.js:1213, flag-station/flag-station-minigame.js:570.

The plan (§3.6) asserts "Every object unlock funnels through notifyServerUnlock", and the retry is
built on that premise. It is not true. notifyServerUnlock always posts with a `null` attempt
(unlock-system.js:33), so it carries key, lockpick, biometric, bluetooth, ble, rfid,
backup_recovery and dual-auth unlocks only. pin, combination, cryptex, password and flag unlocks
post `apiClient.unlock(targetType, targetId, <code>, <method>)` directly from their own minigames
and have no `room_not_reachable` retry. The server object gate is method-agnostic
(games_controller.rb:1147: `target_type != 'door'`), so it will refuse any of these for a valid
attempt on a route-room object with 403 `room_not_reachable retryable`, and those minigame POST
handlers treat it as a plain failure.

Failure scenario: once Chunk B exists, an honest hi-vis player who cracks a
pin/password/combination/cryptex/flag-locked object in a split route room within the same batch,
before the promoting currentRoom sync lands, sees a non-retried "not reachable" error on a correct
code. No deployed scenario triggers this today (lab secure_area holds only readable objects and a
loose key, no locked container of these types sits in a split room), so it is latent in Chunk A.

Suggested fix (Chunk B): either route these minigame posts through the same retry (a shared helper
that recognises `room_not_reachable retryable`, flushes one sync and re-posts once with the
original attempt preserved), or add a validator rule forbidding pin/password/combination/cryptex/
flag locks inside a split route room, and correct the plan's "every object unlock funnels through
notifyServerUnlock" claim.

### MINOR 1 - a non-openFor NPC (or a flag door-reward) with a scenario-declared unlock of a split room bypasses the split

Files: app/controllers/break_escape/games_controller.rb:1156 (`gated_route_room?` is npc-keyed on
`gate.openFor`), app/models/break_escape/game.rb:3640 (`npc_mapping_unlocks_door?`), 3650
(`validate_npc_unlock`), games_controller.rb:3297 (`process_door_unlock_reward` -> `unlock_room!`).

`gated_route_room?` only matches an NPC named in the gate's `openFor`. If a scenario authorised a
different NPC to unlock the split room (an `unlockDoor` eventMapping or an `unlockable` entry, both
author-declared) or a flag door-unlock reward targeted it, that path runs `serve_opened_room` ->
`unlock_room!` and promotes the room into `unlockedRooms`, bypassing the split and opening every
object there. This is author-declared permission, not client-forgeable, and no deployed scenario
does it (lab secure_area is unlocked only by len, who is in `openFor`; no flag reward targets it),
so it is design-space, not a live forge.

Suggested fix: a validator check in Chunk E that no second unlock route (NPC mapping/unlockable or
flag door reward) targets a split room, so an author cannot silently defeat the split.

### MINOR 2 - the split room stays in both lists permanently in Chunk A, not "briefly"

File: app/controllers/break_escape/games_controller.rb:1156-1168; build log "Interim behaviour".

The build log says a credential unlock "can briefly sit in both lists". In Chunk A there is no
`npcRouteRooms` delete at all (it arrives with Chunk B's viaCredential block), so once a credential
rfid unlock of a route-recorded room runs `serve_opened_room`, the id stays in both `unlockedRooms`
and `npcRouteRooms` indefinitely. This is harmless, and I agree with the builder's reasoning:
`object_in_unpromoted_route_room?` is `in_npc_route_room? && !unlockedRooms.include?`, so membership
in `unlockedRooms` makes the predicate false and the objects open; the stale id in `npcRouteRooms`
is bounded and server-only, so SYNC SIZE is unaffected. Only the "briefly" wording is wrong.

Suggested fix: reword the build log to "permanently in Chunk A, deleted by Chunk B's viaCredential
promotion".

### MINOR 3 - no endpoint test that a wrong attempt on a route-room object leaks nothing

The feedback-helper guards are proven at the model level (gated_route_room_test.rb:111-139). There
is no controller test that a wrong `POST /unlock method: pin` (or password/rfid) against a
route-room object returns the plain "Invalid attempt" body with no `feedback`, `caseMismatch` or
`reason: uid_only`. The controller wiring (games_controller.rb:1117-1131) is the integration point
the leak would reappear in if a future edit reordered the guards. Model coverage is adequate for
Chunk A; this is a hardening suggestion for Chunk B's test set (plan test 12 at endpoint level).

## Agreement with the builder's flagged interim gaps and the standing rules

- uid_only after-promotion test deferred (Chunk E): AGREE. The route-room-false case is proven
  (gated_route_room_test.rb:132-139) and the guard added to `uid_only_refusal?` (game.rb:2748) is
  byte-identical to the pin and password guards, which are proven both ways (model test 111-130).
  The promoted-true discrimination for uid_only genuinely needs a UID-only clone fixture; deferring
  it to the end-to-end Chunk E fixture is reasonable.
- room in both lists (above, MINOR 2): AGREE it is harmless; only the "briefly" wording is off.
- SYNC SIZE RULE: AGREE. `npcRouteRooms` is written only by `record_npc_route_room!`
  (game.rb:159), is never a mergeable sync section (merge_last_write_wins_sections at
  games_controller.rb:2132 only reads `@game.player_state['npcRouteRooms']` for currentRoom
  acceptance, it never accepts a client-sent list), is bounded by the number of split gated rooms
  in the scenario, and is not echoed in the client payload. Net new per-sync growth: zero.
- LOAD-BEARING ODDITIES: the never-firing `len_never_fires -> unlockDoor: secure_area` mapping is
  preserved and is load-bearing: `npc_mapping_unlocks_door?` needs it so Len's route `unlockRoom`
  passes `validate_unlock`. Chunk A does not touch it. Correct.

## Forge analysis (no gap found in Chunk A)

- Promotion into `unlockedRooms`: the only writers are `unlock_room!` (via `serve_opened_room` on a
  door unlock that `validate_unlock` passed, i.e. a real credential or an author-declared NPC
  unlock), the flag door reward, and the GET-room auto-unlock (now guarded against route rooms,
  games_controller.rb:544). `sync_state` does not merge `unlockedRooms`/`unlockedObjects`, so a
  tampered client cannot set them. For secure_area specifically, a forged `method: rfid` without
  the clone is refused by `rfid_requires_held?`, and every non-rfid method fails the lockType match,
  so the split holds against a tampered client.
- Object unlock: gated before the transaction (games_controller.rb:1147), method-agnostic, keyed on
  `object_in_unpromoted_route_room?`; `apply-actions.js:206` and all object-unlock call sites hit
  the same endpoint and are covered.
- Container take: gated on `unlockedObjects.include?(container_id)` (games_controller.rb:2703); the
  object gate stops the container being unlocked, so its contents are served but never takeable,
  matching §3.2's accepted "served, not takeable" line.
- `currentRoom` sync acceptance reads the server-held `npcRouteRooms`, never a client param, so it
  cannot be forged; a locked non-route room is still refused (controller test line 82-86).

## Client retry (unlock-system.js) - behaves as specified

- Fires only on `type !== 'door' && body.reason === 'room_not_reachable' && body.retryable === true`
  (line 46-47).
- One re-post only; a second refusal is logged and surfaced (undefined return), no loop.
- A rejecting or absent sync still proceeds to the single re-post (line 53, `?.` + `.catch`).
- Doors and other refusal reasons are returned unchanged (else branch, line 68).
All four §13 object-retry cases pass against the real sliced source (see tests).

## Tests run (no full suites)

- Node `test/js/unlock-route-room-retry.test.mjs`: 4/4 pass. It slices the real
  `notifyServerUnlock` + `unlockTargetId` out of the source and runs them with stubbed
  apiClient/stateSync, so it exercises the real function, not a reimplementation.
- Rails `test/models/break_escape/gated_route_room_test.rb` +
  `test/controllers/break_escape/gated_route_room_controller_test.rb`: 14 runs, 48 assertions, 0
  failures. The controller tests drive the real endpoints (unlock, room, sync_state).
- Neighbour regressions: unlock_response_filter, npc_container_unlock,
  models/npc_mapping_unlock_door, access_model_rfid, flag_reward_unlock_door,
  combination_cryptex_unlock: 84 runs, 416 assertions, 0 failures.

Coverage gap worth noting: the node test covers only notifyServerUnlock, so it cannot and does not
catch MAJOR 2 (the pin/password/combination/cryptex/flag bypass of the retry).
