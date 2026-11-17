# Adversarial review R3: gated-door server check plan

Reviewer read the plan at `docs/achitechture/GATED_DOOR_SERVER_CHECK_PLAN.md` and the R1/R2 reviews
(with their Outcomes) against the code at tree `580eea087` (worktree `p-hard-tailgate-plan`). Every
code claim below was opened and read at the pinned file:line. `build/hard-rfid` is taken as a given
prerequisite; this review judges only whether the plan uses it correctly. Counts: 1 blocker, 0
majors, 3 minors.

The machinery R1 and R2 approved still holds. The viaPass credit rests on `courier_ready`, which
`POST /wear` writes only after a server-side possession check; the credit globals become read-only
through the same `read_only` union the wearables use (`game.rb:337-340`, the union is
`imported_global_names + wearable_read_only_globals`, with `serverCreditGlobals` to be added
alongside); `write_server_globals!` is the correct bypass; `complete_task!`
(`game.rb:3632`, signature `complete_task!(task_id, validation_data = {})`) takes the real `trusted:`
keyword and resists the `{ "trusted": true }` smuggle; `skip_task!` (`game.rb:3738`) is the separate
path the plan correctly also guards. The four gated-door scenarios are confirmed by grep
(`lab_physical_pentest`, `test_gate_tailgate`, `test_bark_bubbles`, `test_access_habits`), with
`rfid_cloner` count 0 in the two demos, so their carve-out stands. SYNC SIZE holds: three bounded,
server-written-only lists, nothing new in the client-to-server payload.

## R2 closure 1 (scenario_data-only load): confirmed sound, one test gap

Confirmed in code that the whole viaPass credit call tree reads `scenario_data` and would raise on
the narrow sync row: `complete_task!`'s first line calls `initialize_objectives`
(`game.rb:3633`), which reads `scenario_data['objectives']` (`game.rb:3622`) unconditionally; plus
`find_task_in_scenario` (`game.rb:5217`), `apply_task_set_globals!` (`game.rb:5322`),
`check_aim_completion` (`game.rb:5361`) and `recheck_pending_mission_conclusions!`
(`game.rb:5205`). The `stored_scenario_data` helper (`game.rb:797-806`) does one `pick` on the sync
row and reads the loaded attribute on a full load, so the plan's single-load approach resolves all
five with no per-call threading. The no-clobber argument is sound (the sync merge mutates
`player_state`; `scenario_data` is a separate attribute the merge never touches). Zero cost on a
non-crediting sync is correct, since the fetch is reached only after the promotion decision.
**Gap (see MINOR-1):** the plan's third property, "does not rewrite the `scenario_data` column on
save", rests on clearing the attribute's dirty state after setting it, and no test asserts it.

## R2 closure 2 (take vectors): DISPUTED — see BLOCKER-1

The narrowing to loose collectibles is correct (pickup is room-gated at
`games_controller.rb:2663`, `update_room` at `:1008`), and the container-unlock `/unlock` branch
(`games_controller.rb:1151-1168`) is indeed not gated on the containing room. But the validator rule
the plan adds (forbid locked container / flag or launch station / sign-in PC in a split gated room)
is scoped to the wrong set of objects, and the plan's claim that "the lab's `secure_area` holds no
locked container, flag station or login PC, so nothing leaks there today" (§3.2) is true for those
three types yet false for the actual leak. Details below.

## Blockers

### BLOCKER-1. The validator rule misses readable secret-bearing objects, and the lab leaks a server-enforced code through one
`scenarios/lab_physical_pentest/scenario.json.erb:2236-2249`, `:2777-2793`;
`app/models/break_escape/game.rb:1603-1627` (`filtered_room_data`);
`app/controllers/break_escape/games_controller.rb:1151-1168` (object unlock, no room gate).

The split gated room `secure_area` contains `deeds_signout`, a `notes` object with `readable: true,
takeable: false`, whose `text` reads "ARCHIVE SAFE: combination 7041." (`:2248`). `filtered_room_data`
(`game.rb:1603`) strips `requires`, locked `contents` and author notes, but **does not** strip a
readable note's `text`. So when `secure_area` is served as a route room (the plan's §3.2 change serves
`npcRouteRooms`), the combination 7041 ships in the room payload to an un-promoted client. 7041 is a
server-enforced code: `p4_safe` (in room P4) is `lockType: pin, requires: "7041"` (`:2793`), and the
object-unlock branch validates the code with no check that the player is in P4 or that P4 is unlocked
(`validate_unlock` at `games_controller.rb:1103`; the branch at `:1151` just calls `unlock_object!`).

Chain: trigger Len's route (forged `method: npc`, or the designed no-vest slip-in) ->`secure_area`
in `npcRouteRooms` -> `GET room/secure_area` serves `deeds_signout.text` -> learn 7041 -> `POST /unlock
targetId:p4_safe method:pin attempt:7041` opens the safe from anywhere -> the `opt_safe` finding
(spare master keys) is captured without earning the tailgate and without reaching P4. The `p4_safe`
id is known to any client from the objective `opt_safe` (`targetObject: p4_safe`, `:398`).

This leaks a code, which CHEAT POLICY lists among the secrets the server must hard-enforce, to a
client that never earned the server-checked pass. The plan asserts a structural guarantee ("an author
cannot place a secret behind a tailgate gate", §11) that its own flagship scenario violates, because
the enumerated object set omits the one vector that actually carries a secret here: a readable note.

Mitigation the orchestrator may weigh: the underlying object-unlock-not-room-gated behaviour and the
serve-on-route-run both pre-exist on the shipped trunk (§1: "the room is server-open the moment Len's
route runs"), so this is not a regression the plan introduces, and `opt_safe` is optional. But the
plan claims to close it and does not, so the guarantee and the §3.2 "nothing leaks" statement are
false as written.

**Fix (pick one):** (a) widen the validator rule to also fail a split gated room that holds any
readable/notes object whose `text` could carry a secret, or more precisely any object whose readable
text contains a `requires` value used by a server-enforced lock elsewhere (cross-reference the scenario's
lock codes); or (b) gate the object-unlock branch on the containing room being in `unlockedRooms`
(defence in depth that also closes the pre-existing vector), and gate served route-room data to strip
readable `text` until the room is earned; or (c) if the exposure is accepted as pre-existing and
out of scope, strike the false "nothing leaks there today" / "structural guarantee" claims and state
plainly that a split gated room's served data exposes readable text, so an author must keep codes and
passwords out of readable objects there — and move `deeds_signout` out of `secure_area` or make 7041
non-leaking. Whichever path, the plan must stop claiming a guarantee it does not establish.

## Minors

- MINOR-1. Closure 1's "does not rewrite `scenario_data`" is untested. Setting `scenario_data` on the
  select-loaded sync record marks it dirty, and a default partial `save!` would rewrite the large
  column unless the dirty state is cleared. Test 2 (§12) asserts `currentRoom` and the merged globals
  survive, but not that the `scenario_data` column was not written. **Fix:** add an assertion to test
  2 that the save did not touch `scenario_data` (e.g. `saved_changes` excludes it), so a builder who
  forgets the dirty-clear is caught by a red test rather than a silent per-credit column rewrite.

- MINOR-2. Two of the validator rule's three object types are already server room-gated, so only the
  locked container is new teeth. A sign-in PC is gated by `object_reachable?`
  (`app/models/break_escape/network_access.rb:124`: `!room['locked'] || room_unlocked?(room_id)`), and
  a VM launch/flag station by the launcher gate at `games_controller.rb:1897`
  (`!@game.room_unlocked?(launcher_room_id) -> :forbidden`); `room_unlocked?` reads only
  `unlockedRooms`/`startRoom` (`game.rb:122`), so a route room (in `npcRouteRooms` only) is not
  unlocked for either gate. State this so the builder (a) does not assume the validator now covers
  those and weaken the existing server gates, and (b) sees that the locked-container `/unlock` branch
  is the only take vector not already room-gated — which makes fix (b) above (a room gate on
  object-unlock) attractive as it closes both the container and the readable-text cases at the source.

- MINOR-3. §3.4 says to union `serverCreditGlobals` "into `read_only` at `game.rb:340`". Confirm this
  means the local `read_only` list at `:340` (`imported_global_names + wearable_read_only_globals`),
  not the frozen constant `SERVER_OWNED_GLOBAL_NAMES` (`game.rb:1798`, `%w[se_captures].freeze`), which
  is a separate `reject` at `:337` and cannot take a scenario-derived list. The design is right; the
  line reference is to the correct mechanism, but the two are easy to conflate, so name the target
  explicitly for the builder.

## Other checks (fresh look, no new findings)

- Client-settable credit: the credit globals are made read-only through the `read_only` union and set
  only via `write_server_globals!`; a client `sync_state` write is dropped. Sound.
- Honest-play soft-locks: the slip-in (no promotion, reads `unlockedRooms`), reload (route re-POSTs,
  `!room_unlocked?` keeps the lists disjoint), pass-earned-before-serve (`currentRoom` for a room not
  in either list is rejected, so the earn simply waits for the gate to open for the guard), and the
  in-progress migration (§9 demotion scan pinned to the room-agnostic `show` action, `:193`, before
  the auto-unlock block) all hold.
- SYNC SIZE: `npcRouteRooms` shrinks to empty on promotion and is server-written only; the two derived
  lists are one-time and memoised like `worn_global_names`; credit globals replace existing keys. No
  per-sync growth.
- Load-bearing oddities: the `len_never_fires` / `unlockDoor: secure_area` mapping
  (`scenario.json.erb:1640`) is correctly kept; only the client credit writers and the two
  `room_entered:secure_area` backstops are removed.
- Validator false positives: none. `secure_area` and `test_gate_tailgate`'s `staff_room` (its only
  readable note is harmless, `:166-175`) hold none of the three enumerated types, so the rule as
  written blocks no scenario that exists today — but that is also why it fails to catch BLOCKER-1.
- Build chunks are each doable by one fresh agent with the stated tests and the keyless-server live
  proof; the live proof (§12) drives the real tampered path, which would catch a broken live path.

## Verdict

**Request changes.** One blocker: the plan's take-vector guarantee (R2 closure 2) is not established.
The validator rule forbids the wrong set of objects, and the lab's own `secure_area` leaks a
server-enforced combination (7041, opening `p4_safe`) through a readable note that the rule does not
cover and `filtered_room_data` does not strip, so the plan's "nothing leaks there today" and
"structural guarantee" claims are false. Fix BLOCKER-1 (widen the rule, add a room gate on
object-unlock, or correct the claim and relocate the secret), close the three minors, and the plan is
buildable chunk by chunk. Closure 1 (the `scenario_data`-only load) is sound bar the one missing
assertion in MINOR-1.

## Outcomes

All four findings verified in code before reworking the plan.

- **BLOCKER-1 — resolved by a narrow object-action gate, plus a corrected claim and a flagged
  residual.** Confirmed: the `/unlock` object branch (`games_controller.rb:1151-1168`) calls
  `unlock_object!` with no room check; `filtered_room_data` (`game.rb:1603-1627`) does not strip a
  readable note's `text`; `deeds_signout` in `secure_area` carries `7041`, which is `p4_safe`'s
  `requires` (`scenario.json.erb:2248`, `:2793`); `p4_safe` sits in `P4` (a key-locked room, reached
  only from `secure_area`), not in `secure_area` itself. New §3.6 adds an object-action gate: a model
  predicate `object_in_unpromoted_route_room?` (room resolved via `login_scope_of`) refuses the
  `/unlock` object branch and silences `pin_cracker_feedback` / `password_case_mismatch?` for any
  object whose room is in `npcRouteRooms`. This blocks a locked container, its served contents and the
  two feedback leaks in a served-but-unearned route room, with a "not reachable yet" answer. Rooms in
  general are not gated (per the ruling). The cheat-policy reasoning is stated in §3.2 and §3.6:
  reading a code from a readable note early only saves time, because the object it opens stays refused
  until promotion. The false "nothing leaks" and "structural guarantee" claims are removed (§3.2, §5).
  The lab's `p4_safe` is a true residual the gate cannot reach (it lives in `P4`, not a route room),
  so it is flagged as open question Q5 with options (recommend: accept, credit optional, nothing
  takeable). Tests added: an un-promoted player with the right key refused at the object and accepted
  after promotion (test 11), feedback gated (test 12), honest object unlock unaffected (test 13).
- **MINOR-1 — fixed.** Test 2 now asserts `saved_changes.keys` excludes `scenario_data`, so a missing
  dirty-clear after the `scenario_data`-only load fails red rather than silently rewriting the column.
- **MINOR-2 — folded in.** §3.2 and §11 now state that sign-in PCs (`object_reachable?`,
  `network_access.rb:124`) and flag/launch stations (launcher gate, `games_controller.rb:1897`) are
  already room-gated on `room_unlocked?`, so `npcRouteRooms` alone does not unlock them and the
  builder must not weaken those gates; the locked-container `/unlock` branch was the one un-room-gated
  vector, now covered by §3.6. The §11 validator rule is reworked: the three-type ban is dropped as
  redundant (all now runtime-gated) and replaced by a warning on readable text that carries a
  server-enforced lock code in a split gated room, the only residual no runtime gate can catch.
- **MINOR-3 — fixed.** §3.4 now names the target explicitly: union `serverCreditGlobals` into the
  local `read_only` list at `game.rb:340` (`imported_global_names + wearable_read_only_globals`), not
  the frozen `SERVER_OWNED_GLOBAL_NAMES` constant (`game.rb:1798`, the separate `reject` at `:337`).

New open question surfaced: **Q5** (the `p4_safe` cross-room code leak), added to §14.
