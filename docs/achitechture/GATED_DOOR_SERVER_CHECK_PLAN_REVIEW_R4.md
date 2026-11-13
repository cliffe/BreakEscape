# Adversarial review R4: gated-door server check plan

Reviewer read the plan at `docs/achitechture/GATED_DOOR_SERVER_CHECK_PLAN.md` and R1/R2/R3 (with
their Outcomes) against the code at tree `699732820` (worktree `p-hard-tailgate-plan`). Every code
claim below was opened and read at the pinned file:line. `build/hard-rfid` is taken as a given
prerequisite. Counts: 0 blockers, 1 major, 4 minors.

R3's object-action gate (§3.6) is the right shape and its core facts check out. `login_scope_of`
(`game.rb:1913`) does resolve an object's room by walking rooms and nested containers
(`locate_object_in`, `game.rb:2775-2795`, recurses `contents` and the top-level
`found.merge(room_id: room_id)` at `:1924` carries the enclosing room up), so a container inside a
container in `secure_area` resolves to `secure_area`. The three enumerated take/credit paths all run
on a full game load (so `scenario_data` is present). The `/unlock` object branch yields contents,
flag submission and a `completesTask` all inside the one branch (`games_controller.rb:1152-1192`), so
one refusal placed before `unlock_object!` stops all of them. `pin_cracker_feedback` (`game.rb:3246`)
and `password_case_mismatch?` (`game.rb:3259`) already carry the `unlock_scope_refused?` guard and
fire only inside the controller's `unless is_valid` block (`games_controller.rb:1117-1124`), so a
`nil`/`false` return silences them cleanly. The predicate cannot refuse an honest player in steady
state: it fires only while a room is in `npcRouteRooms` and not in `unlockedRooms`, and promotion
removes the room from `npcRouteRooms`, so after the pass is earned the object opens (test 13 pins the
no-gate case). One completeness gap in the "all three paths / the two feedback leaks are all blocked"
claim (MAJOR-1), and four minors.

## Majors

### MAJOR-1. §3.6 enumerates three object paths but a fourth feedback helper, `uid_only_refusal?`, is left ungated
`app/models/break_escape/game.rb:2602-2614`; `app/controllers/break_escape/games_controller.rb:1126-1128`.

§3.6 states "three server paths act on an object without checking that its room is reachable" (the
`/unlock` object branch, `pin_cracker_feedback`, `password_case_mismatch?`) and that "a single model
predicate gates all three", so "the two feedback leaks are all blocked". There is a fourth helper of
exactly this class. `uid_only_refusal?` (`game.rb:2602`) carries the identical
`return false if target_type != 'door' && unlock_scope_refused?(target_id)` guard as its two
siblings, resolves the lock with `find_scenario_object` for any room, and is called in the same
`unless is_valid` block (`games_controller.rb:1126`) to set `body[:reason] = 'uid_only'`. For an
rfid-locked (ACL) object sitting in a served-but-unearned route room, a tampered client that holds a
UID-only copy and sends a failing rfid attempt gets back the `uid_only` hint, which tells it the
object is rfid-locked and that its copy is UID-only. This is the same feedback-leak class §3.6 exists
to close, and the plan's enumeration (and its §3.2 "the two feedback leaks are all blocked" and §11
"a locked container, its contents and the pin/password feedback are refused") is factually incomplete
as written. **Impact is a lock hint, not a secret or contents** (it grants no access and yields
nothing takeable), so this is a completeness defect of the same shape R3 caught with readable notes,
not an access breach. **Fix:** add the `object_in_unpromoted_route_room?` guard to
`uid_only_refusal?` as well (return false when the predicate holds), and reword §3.6/§3.2/§11 to
"these feedback helpers" rather than naming exactly two, so a future fifth helper with the
`unlock_scope_refused?` pattern is caught by the same rule. Lower-risk sibling to note while there:
`unlock_session_refusal` (`game.rb:2727`) is the same pattern but only answers for an object under a
held session with `path_unlocked?`, which a route room (never signed into) cannot satisfy, so it is
effectively unreachable for a route-room object; confirm and leave it, or gate it for symmetry.

## Minors

- m1. **Transient honest refusal between entry and the promoting sync, on the viaPass path only.**
  viaPass promotes on the `currentRoom` sync (§3.3a), not on an `/unlock`. So an honest hi-vis player
  who enters and then unlocks a container in `secure_area` within the same batch, before the
  promoting `currentRoom` sync lands, hits §3.6's `room_not_reachable` refusal. It self-heals (the
  next sync promotes, the client retries), and in practice the `currentRoom` sync precedes walking to
  an object by seconds, so it is unlikely. But the plan should state it, so the client treats
  `room_not_reachable` as retryable, not a hard error surfaced to the player. The credential path does
  not have this window: it promotes inside the `/unlock` door branch (§3.3b), synchronously, before
  any object unlock. Add a line to §3.6 and a note for the client gate owner.

- m2. **The predicate sees only scenario-static objects, not runtime-added ones.** `login_scope_of`
  (`game.rb:1917`) reads `scenario_data['rooms']`, while an object added at runtime lives in
  `player_state['room_states'][room_id]['objects_added']` (`add_item_to_room!`, `game.rb:464-466`).
  A runtime-added object in a route room therefore resolves to `room_id: nil` and is not gated. This
  cannot refuse an honest player (the predicate stays permissive), so it is a leak-side completeness
  note, not a soft-lock: a locked container dropped into a route room (an NPC KO drop, say) could be
  unlocked early. Narrow (`add_item_to_room!` requires an NPC source holding the item in that room,
  and such drops are usually takeable loot whose pickup is room-gated), and no current scenario does
  it, but §3.6 should note the gate covers scenario-defined objects only.

- m3. **GET `/container` serves an unlocked container's contents in a served route room, ungated.**
  `games_controller.rb:577-627`: `container` serves contents when `check_container_unlocked` is true,
  with no containing-room gate. §3.6 stops a *locked* route-room container from ever being unlocked,
  so its contents stay hidden; but a container that is not locked (or no lock) in a route room has its
  contents served by this endpoint. This is the same accepted "served, not takeable" line as readable
  text (pickup stays room-gated, `:2661-2667`), not a secret, so accept it, but §3.2's list of what a
  served route room exposes should name unlocked-container contents alongside readable text, so the
  "what leaks" account stays complete.

- m4. **Controller guard placement for the valid-attempt path.** `validate_unlock` runs first at
  `games_controller.rb:1103`, before the object branch at `:1150`. For a route-room object the honest
  key-holder targets, `validate_unlock` returns true and flow reaches `unlock_object!` at `:1152`.
  §3.6's refusal for the *valid* path must therefore be a distinct controller guard that returns
  `:forbidden` before the transaction/`unlock_object!` (the feedback-helper `nil` returns only cover
  the *invalid*-attempt branch). The plan's wording ("before `validate_unlock` is allowed to open the
  object") captures the intent but reads as if it lives inside the one branch; state explicitly that
  it is a controller guard checked before `unlock_object!`/contents/flag, distinct from the two
  feedback-helper returns, so the builder wires both insertion points.

## Q5 assessment (the `p4_safe` cross-room code leak) and the general gate

Facts verified in code. `deeds_signout` is a `notes` object in `secure_area` (the route room) whose
`text` contains "ARCHIVE SAFE: combination 7041"
(`scenarios/lab_physical_pentest/scenario.json.erb:2237-2248`). `filtered_room_data`
(`game.rb:1603-1627`) does not strip a readable note's `text`, so serving `secure_area` as a route
room ships `7041`. `p4_safe` is `type: safe, lockType: pin, requires: "7041"` in room `P4`
(`:2786-2793`), `P4` is `locked: true, lockType: key` (`:2695-2698`), and its `opt_safe` objective is
`optional: true, type: unlock_object` with `onComplete.setGlobal kp_safe_opened` (`:398`). The
`/unlock` object branch is not containing-room gated, so once `7041` is learned a tampered client can
POST `/unlock p4_safe method:pin attempt:7041` from anywhere and record `p4_safe` unlocked; §3.6 does
not reach it because `p4_safe` is in `P4`, not in the route room. The master keys inside
(`spare_master_keys`) stay unobtainable: pickup is room-gated on `P4` (`:2661-2667`,
`room_unlocked?`). So the residual is: the optional `opt_safe`/`kp_safe_opened` credit can be claimed
early; nothing is taken. Note too that `opt_safe` is a `type: unlock_object` task that
`complete_task!` trusts, so a tampered client can already set `kp_safe_opened` by POSTing
`complete_task opt_safe` directly, independent of `7041` (the same general objective-trust gap as Q4);
the code leak only adds the ability to also record the real `unlockedObjects` entry.

**Verifying the general option the plan does not list.** "Refuse any object unlock whose containing
room is neither the start room nor in `unlockedRooms`." Taken literally this breaks honest play in two
central mechanics, which is exactly why §3.6 avoided a general room gate:

- **Remote network access.** An object or folder under a sign-in PC is reached over a session, not by
  physically entering the PC's room. `object_reachable?`/`unlock_scope_refused?` gate it on
  `session_admits?` + `path_unlocked?` (`game.rb:2709-2715`, `network_access.rb:124`), never on
  `room_unlocked?`. `login_scope_of` resolves such an object to the PC's room `room_id`, which for a
  remote PC is a room the player never entered and that is not in `unlockedRooms`. A general room gate
  would refuse every remote container/folder unlock, breaking the sign-in/network missions
  (sis01/sis02 and the network rooms of the m-series). This is the core of the access model.
- **Profile, resource and share objects.** For a profile or share scope `login_scope_of` returns
  `room_id: nil` (`game.rb:1930`, and `resource_scope_of`, `network_access.rb:1304`). `nil` is not in
  `unlockedRooms`, so the literal general gate refuses all profile/share container unlocks too.

The **targeted** variant (option b: gate only objects that complete a task or yield a capture) still
hits the same remote/`nil`-room cases for any task-completing or capture-bearing object accessed over
a session, so it needs the identical remote/profile/share carve-outs before it is safe; it is not a
clean win over §3.6. **Relocation** (c) destroys the deliberate "combination written on a card next
door" lesson the author keeps.

**Recommendation: accept (a)**, as the plan recommends. Reasons: the exposure is pre-existing, not a
regression (on the shipped trunk `secure_area` enters `unlockedRooms` and is fully served the moment
Len's route runs, §1, so `7041` already leaks today and `p4_safe` already opens from anywhere); the
credit is optional and already client-forgeable via the trusted `unlock_object` task; nothing is
takeable (master keys room-gated on `P4`); and both the general gate and the targeted gate would
break remote network access and profile/share unlocks unless laden with carve-outs that re-create
§3.6's own narrowness. The §11 validator warning (readable server-enforced code in a split gated
room) puts the leak on record so no author unknowingly places a real password or working key code in
route-room readable text. Keep the §3.2/§5 corrected claims ("a gate keeps a player out, not a
secret"); do not add the general gate.

## Other checks (fresh look)

- **Client-settable credit.** Credit globals join the local `read_only` union at `game.rb:340`
  (`imported_global_names + wearable_read_only_globals`, not the frozen
  `SERVER_OWNED_GLOBAL_NAMES` at `:1798`), and are written only through `write_server_globals!`; a
  client `sync_state` write is dropped (`game.rb:337-340`). Sound (R3 MINOR-3 closed).
- **Honest-play soft-locks.** Slip-in (no promotion, collection reads `unlockedRooms`), reload (route
  re-POSTs, `!room_unlocked?` keeps the two lists disjoint, `game.rb:3055-3058`), migration demotion
  (pinned to the room-agnostic `show` action, `games_controller.rb:193`, before the auto-unlock block
  at `:539-541`) all hold. The one new honest-play wrinkle is m1's transient object-unlock window on
  the viaPass path (self-healing).
- **SYNC SIZE RULE.** `npcRouteRooms` is server-written only, bounded by split rooms, shrinks to empty
  on promotion; `serverCreditGlobals`/`serverCompletedOnly` are one-time derived and memoised like
  `worn_global_names`; credit globals replace existing keys. No per-sync growth. Sound.
- **Gated-door scenarios.** grep confirms the four files; `rfid_cloner` count is 0 in
  `test_bark_bubbles` and `test_access_habits`, so their presentation-only carve-out stands. The two
  split rooms are `requires`-only (no `access` list), so the credential proof is added by
  `build/hard-rfid`, correctly stated (§6).
- **Load-bearing oddities.** The `len_never_fires` / `unlockDoor: secure_area` mapping is kept; only
  the client credit writers (`:915`, `:932`) and the two `room_entered:secure_area` backstops
  (`:728`, `:729`) are removed. Correct.
- **Chunk feasibility.** The §3.6 work in Chunk A is local and testable (tests 11-13 plus the new
  uid_only case from MAJOR-1). The viaPass `scenario_data`-only load (Chunk B) and the credential path
  sequenced behind `build/hard-rfid` are unchanged from R3 and sound. The keyless-server live proof
  (§12) drives the real tampered path. The build split still fits a fresh agent per chunk.

## Verdict

**Request changes (minor).** R3's blocker is resolved and the object-action gate is sound for its
stated scope; there is no access or secret breach and no honest-play soft-lock beyond the transient,
self-healing window in m1. The one substantive item is MAJOR-1: the plan's enumeration of "three
object paths / the two feedback leaks are all blocked" omits a fourth helper of the identical class,
`uid_only_refusal?`, which leaks a lock hint (not a secret) for a route-room rfid object; add the
predicate guard there and reword the claim. Close the four minors (transient window, runtime-added
objects, unlocked-container GET, controller guard placement). Q5: **accept (a)** — the general gate
breaks remote network access and profile/share container unlocks, so it is not a safe trade; the
targeted gate needs the same carve-outs; the leak is pre-existing, optional and yields nothing
takeable, and the validator warning records it. With MAJOR-1 and the minors folded in, the plan is
buildable chunk by chunk.
