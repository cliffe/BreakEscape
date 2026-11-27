# Adversarial review R5 (final): gated-door server check plan

Reviewer read the plan at `docs/achitechture/GATED_DOOR_SERVER_CHECK_PLAN.md` and R1-R4 (with their
Outcomes), then independently opened every load-bearing code claim at tree `2f5471209`
(`Batch 28: merge build/lab-wedge`), and confirmed the `build/hard-rfid` dependency against that
branch's code. Counts: **0 blockers, 0 majors, 2 minors.**

The server files the plan pins (`app/models/break_escape/game.rb`,
`app/controllers/break_escape/games_controller.rb`, `app/models/break_escape/wearables.rb`,
`app/models/break_escape/network_access.rb`, `public/break_escape/js/systems/doors.js`) are
byte-identical between `2f5471209` and the plan's worktree HEAD (`git diff --stat` empty), so every
file:line verified here holds at `2f5471209`. Main (`f956f5355`) differs from `2f5471209` only in
client files: `git diff 2f5471209 f956f5355 -- wearables.rb games_controller.rb game.rb` is empty,
so the wearables server path the plan relies on (`POST /wear`, `wearable_read_only_globals`,
`write_server_globals!`) is unchanged by the inventory-tray / item-menu / wearables-UI main work.

## R4 closures confirmed in the code and in the plan text

- **MAJOR-1 (ungated `uid_only_refusal?`).** `uid_only_refusal?` (`game.rb:2602`) carries the same
  `return false if target_type != 'door' && unlock_scope_refused?(target_id)` guard as its two
  siblings. The plan now names the feedback helpers as a class by that shared guard
  (`pin_cracker_feedback` `game.rb:3246`, `password_case_mismatch?` `game.rb:3259`,
  `uid_only_refusal?` `game.rb:2602`) in §3.6, and §3.2/§11 read "these feedback helpers" /
  "attempt-feedback hints (pin pips, password case, the `uid_only` reason)". `unlock_session_refusal`
  (`game.rb:2727`) is correctly noted as already unreachable for a route-room object. Closed.
- **m1 (transient honest refusal, viaPass only).** §3.6 states the window and requires the client
  gate to treat `room_not_reachable` as retryable. Closed.
- **m2 (runtime-added objects).** §3.2 states the gate covers scenario-defined objects only;
  confirmed `login_scope_of` reads `scenario_data['rooms']` (`game.rb:1917`) and `add_item_to_room!`
  resolves to `room_id: nil` (`game.rb:464-466`). Closed.
- **m3 (unlocked-container GET).** §3.2 now names unlocked-container contents as "served, not
  takeable"; `GET /container` (`games_controller.rb:616-627`) serves on `check_container_unlocked`
  with no room gate. Closed.
- **m4 (valid-path controller guard placement).** §3.6 states the valid-path refusal is a distinct
  controller guard before `unlock_object!`, separate from the feedback-helper returns. Closed (one
  wording tightening below, minor 2).

## Independent verification of the load-bearing claims

- **The teeth (client-settable credit).** `merge_global_variables!` (`game.rb:332`) builds
  `read_only = imported_global_names + wearable_read_only_globals` (`:340`) as a line distinct from
  the `variables.reject { SERVER_OWNED_GLOBAL_NAMES.include? }` at `:337`, and
  `SERVER_OWNED_GLOBAL_NAMES = %w[se_captures].freeze` (`:1798`) takes no scenario-derived list. So
  §3.4's design (union `serverCreditGlobals` into the local `read_only` list, **not** the frozen
  constant; write the credit through `write_server_globals!`) is the correct mechanism. A client
  `sync_state` write to a credit name is dropped. Sound.
- **§3.3a sync-path `scenario_data` load.** `SYNC_STATE_COLUMNS = %i[id player_type player_id
  player_state updated_at]` (`games_controller.rb:2022`) excludes `scenario_data`, and the code's own
  comment at `:2018` confirms a scenario read "here raises ActiveModel::MissingAttributeError". The
  plan's five unconditional `scenario_data` reads in the `complete_task!` call tree are therefore a
  real risk, and `stored_scenario_data` (`game.rb:797-806`) is exactly the single-source helper that
  resolves it (`read_attribute` on a full load, else `pick(:scenario_data)` on the sync row). Test 2's
  `saved_changes.keys` excludes-`scenario_data` assertion correctly pins the dirty-state clear. Sound.
- **§3.5 route-room NPC branch.** `serve_opened_room` (`games_controller.rb:2239`) does exactly
  `unlock_room!`, `filtered_room_data`, `track_npc_encounters`, so the route-room branch must skip
  only the first and still run the other two (as the plan states), or NPCs go untracked. Accurate.
- **§3.5/§10 reload.** `validate_unlock` (`game.rb:3050`) returns true early on `room_unlocked?`
  (`:3055`); the `method: npc` branch returns `npc_mapping_unlocks_door? || validate_npc_unlock`, so a
  re-fired route unlock on an already-promoted room is a no-op. The `!room_unlocked?` split guard
  keeps the two lists disjoint. Accurate.
- **§3.2 serve / pickup / auto-unlock.** The accessibility check `unless is_start_room || is_unlocked
  || is_world_room` (`games_controller.rb:533`) needs `npcRouteRooms` added; the auto-unlock
  `if !is_unlocked` (`:538-541`, reading `unlockedRooms` only at `:526`) needs the route-room guard;
  pickup refuses a locked room not in `unlockedRooms` (`:2663`). All three match the plan.
- **build/hard-rfid dependency.** On `build/hard-rfid`, `rfid_lock_passes?` returns
  `rfid_requires_held?(lock)` for a `requires`-only lock (no `access` list). `rfid_requires_held?`
  passes only when a held keycard id (`held_keycard_ref_ids`, from `player_state['inventory']`) or a
  recorded `server_clones` entry (while an `rfid_cloner` is held) is in `requires` and not revoked,
  ignoring the client `card_ids`. This is precisely the server-held possession result §3.3b and the
  Prerequisite rely on. The branch is **not** merged into the worktree HEAD, which the plan correctly
  treats as a gate on Chunk B's credential write (Q2).
- **SYNC SIZE RULE.** `npcRouteRooms` is server-written only (client POSTs `method: npc` /
  `currentRoom`, never the list), shrinks to empty on promotion, not sent to the client;
  `serverCreditGlobals` / `serverCompletedOnly` are one-time derived and memoised like
  `worn_global_names`; the credit globals replace existing keys in `globalVariables`. Zero per-sync
  growth. Sound.
- **Load-bearing oddities.** The `len_never_fires` / `unlockDoor: secure_area` mapping is kept; only
  the client credit writers and the two `room_entered:secure_area` `completeTask` backstops are
  removed (into `tmp/delete/`, by grep not line number). Correct per the common-rules carve-out.
- **Server-completed-only tasks (§7).** `complete_task!(task_id, validation_data = {})`
  (`game.rb:3632`) and `skip_task!(task_id)` running `check_aim_completion(task['aimId'])`
  (`game.rb:3738-3751`) both exist as pinned; the `trusted:` keyword and the two guards are a clean
  addition. The insistence that `trusted` be a real keyword (not read from `validation_data`, which
  the client callers fill positionally) is correct and test 5c pins it. Sound.

## Chunk feasibility, tests, live proof

Each chunk (A-E) is local and testable by one fresh agent. Chunk A (split, serve, object-action
gate) carries tests 1, 6, 10-13; Chunk B (credit + the `scenario_data`-only load) carries 2, 4, 7 and
is correctly blocked on `build/hard-rfid` before the viaCredential half (3, 3b, 8); Chunk C (server-
completed tasks) carries 5, 5b, 5c; Chunk D (migration + lab edits) carries 9 + node scan; Chunk E
(fixtures, validator, graph, live proof). The live proof (§12) drives the real tampered path on the
keyless server (POST `sync currentRoom` + forged credit global with no hi-vis / no clone, assert the
server leaves it false and the avatar does not snap back), which catches a broken live path, not only
a helper test. The test set covers the slip-in, both credit paths, the negative credential case, the
read-only drop, the direct complete/skip forges, the migration, and the object-action gate's refuse-
then-accept. Buildable.

## Open questions Q1-Q5

- **Q1 (`visitor_pass` server-owned).** Fair: two options, recommend require-server-owned and make
  `visitor_pass` server-set, with the honest caveat that this is only half the guarantee without the
  credential possession check. Sound.
- **Q2 (scope now).** Fair, and the single most important sequencing call: full change now **behind**
  `build/hard-rfid`, with the explicit fallback to ship the viaPass half if the branch slips. Matches
  the real dependency (the branch is unmerged today). Sound.
- **Q3 (holds-doors demos).** Fair: `test_bark_bubbles` / `test_access_habits` credit nothing and
  forge nothing (no cloner, no server-owned pass), so presentation-only with a README note. Sound.
- **Q4 (`enter_room` objective trust).** Fair: `complete_task!` trusts an `enter_room` task, so the
  fixture asserts server state, not that task; recommend a separate follow-on. This is a pre-existing
  general objective-trust gap (the same shape as Q5's `opt_safe`), reasonably out of scope. Sound.
- **Q5 (`p4_safe` cross-room code leak).** R4 verified the facts in code (`deeds_signout` `7041` in
  the route room, `p4_safe` in key-locked `P4`, `opt_safe` optional, master keys room-gated). The
  leak is pre-existing (on the trunk `secure_area` is fully served the moment Len's route runs), the
  credit is optional and already client-forgeable via the trusted `unlock_object` task, nothing is
  takeable, and both the general gate (d) and the targeted gate (b) break remote network access
  (`login_scope_of` resolves to a room the player never entered) and profile/share unlocks
  (`room_id: nil`). Accept (a) with the §11 validator warning is the right call. Sound.

## Minors

### minor 1. §3.3b: make the credential-path earn-eligibility explicitly pre-unlock
Plan §3.3b (lines 266-269); `games_controller.rb:1138-1139`.

§3.3b says "When possession passes and the room is not yet in `unlockedRooms`, promote with the
`viaCredential` block. `serve_opened_room` still runs; the added steps are the credit write, the
`npcRouteRooms` delete, and a `save!`." But `serve_opened_room` (`games_controller.rb:2240`) calls
`unlock_room!` first, so by the time it returns the room **is** in `unlockedRooms`. A fresh builder
who evaluates `!room_unlocked?(target_id)` **after** `serve_opened_room` would find the room already
unlocked and never fire the `viaCredential` credit, silently dropping the clone finding. The intent
(§3.3 line 198, the `!room_unlocked?` gate exists so "a room already opened by **one** path is never
re-credited by **the other**") is cross-path idempotency, evaluated before this path's own unlock.
**Suggested fix:** add one sentence to §3.3b: "Capture the not-yet-earned state (`!room_unlocked?`)
**before** calling `serve_opened_room`, since `serve_opened_room` unlocks the room; the credit fires
on that captured state, so the first clone unlock credits and a later re-unlock of an earned room does
not." Test 3 would catch a builder who gets this wrong, so this is a clarity tightening, not a design
hole.

### minor 2. §3.6: the valid-path guard's placement reads as both "before the transaction" and "in the object branch"
Plan §3.6 (line 364); `games_controller.rb:1137` (transaction), `:1152` (`unlock_object!`).

§3.6 says the valid-path refusal is "a **distinct controller guard**, checked in the object branch
before the `ActiveRecord::Base.transaction` and `unlock_object!`". The object/`else` branch is **inside**
the transaction opened at `:1137` (it wraps both the door and object branches), so "in the object
branch" and "before the transaction" cannot both be literal. Either placement refuses before any
write, so this is harmless, but it is a small trap for a fresh agent. **Suggested fix:** reword to "a
distinct controller guard that may be hoisted before the `ActiveRecord::Base.transaction` (branching
on `target_type != 'door'`), or placed at the top of the `else` branch before `unlock_object!`; both
refuse before any `unlock_object!`, contents or flag write." No code impact.

## Verdict

**Ready to build.** R3's blocker and R4's MAJOR-1 plus four minors are resolved and present in the
plan text, and every load-bearing code claim holds at `2f5471209` (the server files are identical at
the plan's worktree HEAD, and main's divergence is client-only, so the wearables server path is
unchanged). The `build/hard-rfid` dependency delivers exactly the server-held possession result §3.3b
needs, and the plan correctly gates Chunk B's credential write on it landing. The two findings are
wording tightenings (credential-path pre-unlock ordering; object-guard placement), each caught by an
existing test if missed. No access breach, no secret leak beyond the pre-existing optional `p4_safe`
code (Q5, accept a), and no honest-play soft-lock beyond m1's transient, self-healing window. Fold the
two minors in and build chunk by chunk.
