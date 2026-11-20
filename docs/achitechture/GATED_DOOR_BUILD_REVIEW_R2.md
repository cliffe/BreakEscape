# Gated-door server check: combined build review, round 2 (Chunks A, B, F)

Scope: everything from `b1256d2be` to `86dc44c23` not on main
(`git diff b1256d2be 86dc44c23 -- . ':!tools/playtest'`). Commits: A `7d0ec8479`, B `0a64c271f`,
F `2062da934` / `6ee2c2c86` / `9b6b095c8`, merges `93dba8a5e` and `86dc44c23` (main `fc4b4d8a5`).
Read-only review against GATED_DOOR_SERVER_CHECK_PLAN.md (sections 3, 7, 8, 9), the build log, and
the two R1 reviews. Reviewed on branch `build/hard-tailgate-plan` in the worktree.

## Verdict

Pass, changes advised, no blocker. The A+B+F combined build is a faithful implementation of plan
sections 3, 8 and 9. The train 35 minigame-shell work merged cleanly with Chunk B's minigame edits
(no conflict markers in code; the five minigame files and base-minigame.js carry both the shell
changes and the shared retry, and all their node tests pass). No forge promotes a split room, opens
its objects, writes a credit global or completes a credited `enter_room` through a path the player
has not earned. No honest player in any deployed scenario is refused. Every R1 finding from the two
earlier reviews is closed in code or folded as documented. The one major is a deployment-ordering gap
in the build log, not a defect in the A/B/F code, and it matters only when the stack reaches players.

## Counts

- Blockers: 0
- Majors: 1
- Minors: 2

## Earlier findings: closed or open

Chunk A review R1:
- MAJOR 1 (lab unwinnable via tailgate under A alone; build log did not say so): CLOSED (doc). The
  Chunk A build-log interim section now carries the deployment gate "Chunk A must not reach main
  without Chunks B and D". Chunk B's viaPass promotion makes the lab winnable again. See this
  review's MAJOR 1 for the part still missing from that note.
- MAJOR 2 (object retry covered only `notifyServerUnlock`; the five code-posting minigames bypassed
  it): CLOSED. `public/break_escape/js/utils/lock-scope-refusal.js` `unlockWithRouteRoomRetry` is the
  one shared helper; `unlock-system.js` and pin/password/combination/cryptex/flag-station all route
  their object-unlock POST through it. The node source-guard test asserts no minigame posts a bare
  `apiClient.unlock`.
- MINOR 1 (a second author-declared unlock route or flag reward bypasses the split): OPEN by design
  (Chunk E validator). No deployed scenario does it.
- MINOR 2 (build log "briefly" wording for the dual-list window): CLOSED. Reworded to "permanently in
  Chunk A"; Chunk B's `credit_via_credential!` removes the room from `npcRouteRooms`.
- MINOR 3 (no endpoint test that a wrong attempt on a route-room object leaks nothing): CLOSED.
  `gated_door_credit_controller_test.rb:206` asserts no `feedback`, `caseMismatch` or `uid_only`
  before promotion and their return after.

Chunk F review R1:
- Minor 1 (5xx-while-online not drained by `online`; node test conflates the two triggers): CLOSED
  (doc). A test comment records that `__status5xx` stands in for the transient shape.
- Minor 2 (a second `retryable` refusal surfaced a hard block instead of queuing): CLOSED in code.
  `objectives-manager.js` now enqueues on `response.transient || response.retryable`.
- Minor 3 (unawaited `drainEnterRoomQueue()`): CLOSED. Both call sites are `void`-prefixed with a
  note that the drain swallows its own errors.

## Findings

### MAJOR 1 - the build log's deployment gate names "B and D" but the credited-task teeth also need Chunk C

File: docs/achitechture/GATED_DOOR_SERVER_CHECK_BUILD_LOG.md:77-85 (Chunk A interim section); plan
§7 and §14 (Chunk C). Code under review is correct; this is the build log's integrator guidance.

The build log tells the integrator "Chunk A must not reach main without Chunks B and D." Chunk C
(`serverCompletedOnly`, the `trusted:` keyword, the `complete_task!` and `skip_task!` guards, plan
§7) is not named, and it is not built on this branch (`grep` finds no `serverCompletedOnly`, and
`complete_task!(task_id, validation_data = {})` has no `trusted:` keyword; `apply_credit_on_pass!`
calls `complete_task!(task_id)` plainly). That is correct for a review of A+B+F, because §7 is
Chunk C's work. The gap is in the stated gate.

Failure scenario: the integrator follows the build log and ships A+B+D (the gate it names) without C.
Chunk D adds `creditOnPass` to the lab gate (so Chunk B makes `kp_badge_tailgated` and
`kp_records_cloned` read-only, the globals are safe) and removes the client credit writers and the
two `room_entered:secure_area` `completeTask` backstops. But `tailgate_in` the task is still
client-completable: a tampered client posts `/complete_task tailgate_in` directly, `complete_task!`
has no server-only guard, the task and the `tailgate` aim tick without the server-checked passage.
That is exactly the objective-tick forge §7/Chunk C closes (plan §5: "the aim behind `tailgate_in`
is reachable only through the server-checked passage"). So the real gate for players is
A+B+C+D (+E for the validator), not A+B+D.

Fix: amend the build log's Chunk A deployment gate (and the orchestrator's merge plan) to read
"A, B, C and D must land together, with E's validator, before players see a credited gate." No code
change in A/B/F.

### MINOR 1 - the inline retryable re-post is not scoped to `task.type === 'enter_room'`

File: public/break_escape/js/systems/objectives-manager.js:800 (`if (!response.success &&
response.retryable)`).

The `enter_room` pre-flush and the enqueue are both gated on `task.type === 'enter_room'`, but the
inline one-re-sync-one-re-post block is gated only on `response.retryable`. Today only the
`enter_room` branch of `complete_task!` returns `retryable: true` (every other refusal returns a bare
`{ success: false, error }`), so the block fires for `enter_room` alone in practice. If a future task
type returned `retryable`, it would get one spurious `safeSyncOnce` + `drainEnterRoomQueue` + re-post;
the result is still safe (the enqueue stays `enter_room`-only, so no queue growth, and a second
failure falls to the hard-surface `else`), but the behaviour is wider than its intent.

Failure scenario: none today; a latent coupling if another task type gains a `retryable` refusal.

Fix (optional): add `task.type === 'enter_room' &&` to the condition so the retry matches its stated
scope. No behavioural change for current scenarios.

### MINOR 2 - `credit_via_credential!` passes client `card_ids` to the possession re-check; safe only because every split room is `requires`-only

File: app/models/break_escape/game.rb (`credit_via_credential!`, the `rfid_lock_passes?(lock,
card_ids)` call).

The viaCredential credit re-asserts possession with `rfid_lock_passes?(lock, card_ids)`. For a
`requires`-only lock (both split rooms: lab `secure_area`, `test_gate_tailgate` `staff_room`) this
delegates to `rfid_requires_held?`, which reads server-held inventory and `server_clones` and ignores
the client `card_ids`, so the credit is server-possession-only as the plan requires, and the clone
POST sends no `card_ids` anyway. The client `card_ids` are forwarded but inert for these locks. The
credit also sits behind `validate_unlock`, which already refused a non-holder with the same arguments,
so the credit can never be more forgeable than the door unlock. The reliance is that no split gate is
ever an `access`-list (ACL) rfid lock, where `rfid_lock_passes?` would consult `card_ids`; nothing in
the model enforces that today.

Failure scenario: none for deployed/test configs (all `requires`-only). A future ACL split gate would
inherit the access model's own possession semantics for the credit, not a dedicated server check.

Fix: the Chunk E validator rule (already owed from Chunk A R1 MINOR 1) should also assert a split
gate's room lock is `requires`-only, or the credit path should branch to `rfid_requires_held?`
explicitly for a split room. No change needed for the current scenarios.

## Focus-area assessment

1. **A and F together (`enter_room` with `npcRouteRooms` live).** `player_reached_room?`
   (`game.rb`) unions `room_unlocked?`, `awareness_world_room?`, `in_npc_route_room?` and the soft
   `currentRoom`. An honest slip-in behind an NPC passes immediately once the `method: npc` route POST
   has written `npcRouteRooms`; the client door-gate opens only after the NPC holds the door, i.e.
   after that POST fires, so the membership is present before the avatar can cross. After promotion the
   room is in `unlockedRooms`, still passing. A tight race that loses both the first post and the one
   inline re-post is carried by the queue (R1 minor 2 fix: enqueue on `transient || retryable`) and
   re-posts once the route write lands, so the honest player is never hard-blocked. A forged
   `enter_room` is refused on every attempt, stays queued and never completes; the drain is re-entry
   guarded and fires only on the `online` event and on an `enter_room` pre-flush / inline re-sync (there
   is no sync-success hook), each drain being one `completeTask` run (two POSTs), so the load is bounded
   and cannot spin. The merge resolution is clean: `player_reached_room?` reads `in_npc_route_room?`
   and there are no duplicate method definitions.

2. **Chunk B credit.** viaPass runs in `merge_last_write_wins_sections` inside the `sync_state`
   row-lock transaction (`games_controller.rb:823`), after a cheap `player_state`-only gate, so an
   ordinary sync reads no scenario. `ensure_scenario_data_loaded!` loads every missing column except
   `player_state` and dirty-clears each, so the crediting `save!` writes only `player_state` and the
   stats and never rewrites `scenario_data` (asserted by `gated_door_credit_test.rb:85`), and the
   in-flight merge is never reloaded or clobbered. viaCredential re-asserts the server possession
   result at the credit site (see MINOR 2). Both promotions remove the room from `npcRouteRooms`.
   `server_credit_global_names` is unioned into the read-only list in `merge_global_variables!`; a
   client write to a credit global hits `read_only.include?` and is dropped. The list memoises into
   `player_state['serverCreditGlobals']` on first read, so the only per-sync scenario read is one
   `pick` on a game's first global-carrying sync, then none. Neither `npcRouteRooms` nor
   `serverCreditGlobals` is in the client payload (`state-sync.js:710` sends a fixed section set), so
   net per-sync growth is zero.

3. **Shared retry and the five minigames.** `unlockWithRouteRoomRetry` fires only on a `type !==
   'door'` 403 with `reason === 'room_not_reachable' && retryable === true`, awaits one
   `window.stateSync.sync()` wrapped so a rejecting or absent sync still proceeds, and re-posts exactly
   once; any other refusal or a door is re-thrown unchanged. It forwards `extra` only when supplied, so
   a four-arg caller still posts four args. The error contract it reads (`err.status`, `err.body`) is
   what `api-client.js:47-57` sets. All five minigames and `unlock-system.js` route through it; no
   minigame posts a bare `apiClient.unlock` (flag-station keeps `apiClient` only as a presence guard).
   Object-unlock re-post is idempotent on `unlockedObjects` membership (test 11c).

4. **Honest-play regressions.** For every non-splitting scenario (m01-m10, sis01, sis02,
   lab_social_engineering, test-rfid, the two presentation-only gate fixtures) `gate_splits?` is false,
   nothing enters `npcRouteRooms`, the object-action gate never fires, `server_credit_global_names` is
   empty so no global becomes read-only, and `player_reached_room?` passes via `unlockedRooms` exactly
   as Chunk F's review verified. The lab is judged against the stated gate: on this branch (A+B+F, no
   C/D/E) `courier_ready` is a worn, server-owned global, so viaPass promotes `secure_area` and the lab
   hi-vis path is winnable again (the client credit writers, still present until Chunk D, set the
   finding globals since no `creditOnPass` makes them read-only yet). The lab is not shippable until
   C/D/E land, which MAJOR 1 covers.

5. **Tests.** Rails `gated_route_room_test`, `gated_door_credit_test`, `enter_room_validation_test`,
   `gated_route_room_controller_test`, `gated_door_credit_controller_test`: 37 runs, 158 assertions, 0
   failures. Node `unlock-route-room-retry`, `enter-room-completion`, `conclude-race`,
   `pin-minigame-enter`, `pin-cracker-feedback`, `pin-cancel-quiet`, `password-minigame-submit`,
   `password-case-hint`, `combination-cryptex-no-answer`, `validator-combination-cryptex`,
   `flag-station-resubmit`, `flag-station-launch-reopen`, and the four access slice/import tests that
   now copy or stub `lock-scope-refusal.js` (`access-remote-signin`, `access-rfid-acl`,
   `access-signin-postit`, `access-signin-routing`): 16 files, all pass. The tests drive the real
   endpoints and the real client modules. No full suites run; no server started.
