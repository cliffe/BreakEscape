# Adversarial review R6: gated-door server check plan (post-amendment)

Reviewer read the plan at `docs/achitechture/GATED_DOOR_SERVER_CHECK_PLAN.md` after the amendment
(`f5562cce2`, "apply owner decisions"), R1-R5 with their Outcomes, and then independently opened the
load-bearing code at the worktree HEAD (`f5562cce2`, which includes main `1ce7486c7` with the merged
rfid possession check). The hardest look went to the amendment's new scope: server validation of
`enter_room` tasks (section 8, Chunk F), under the owner's two constraints: "test for network delays"
and "a legitimate player must never be refused".

Counts: **0 blockers, 1 major, 4 minors.**

## Method and the core finding on honest-play refusal

`player_reached_room?` = `unlockedRooms` OR `startRoom` OR awareness world room OR `npcRouteRooms` OR
saved `currentRoom`. The decisive question is whether every honest route puts the target into that set
before the completion POST. I verified the mechanism rather than trust the prose:

- **Every room transition is a server-checked unlock.** A locked door goes through
  `handleUnlock` -> `notifyServerUnlock` -> `/unlock` -> `serve_opened_room` -> `unlock_room!`
  (`game.rb:116`), which appends to `unlockedRooms`. An **unlocked** door or open doorway is **not**
  a bypass: `handleUnlock` (`unlock-system.js:696`) POSTs `method: 'unlocked'` for a door with no
  lock requirement (`:721-733`) and for a client-unlocked door (`:738-755`), so the server still runs
  `unlock_room!`. Confirmed in code. So the room enters `unlockedRooms` at unlock time, which the
  client awaits (`openDoor` -> `loadRoom` runs inside the `.then` of `notifyServerUnlock`), strictly
  before the avatar can physically enter and before `handleRoomEntered` fires the completion.
- **The `currentRoom` guard already enforces the same invariant today.**
  `merge_last_write_wins_sections` (`games_controller.rb:2098`) rejects a `currentRoom` not in
  `unlockedRooms` or `startRoom` (`:2099-2105`), pre-dating this plan. So for a player to legitimately
  *stand* in a room (saved `currentRoom` there), that room is already in `unlockedRooms`/`startRoom`
  (and, per §3.3a, `npcRouteRooms`). Every deployed `enter_room` mission works today under that guard,
  which is direct evidence the invariant already holds for their targets. The new `enter_room` check
  reads the **same** durable lists, so it adds no new refusal surface for any room the player can
  occupy. This is the reason the change does not refuse honest players.
- **Consequence (see minor 2):** the `currentRoom` disjunct in `player_reached_room?` is subsumed by
  the other terms. It is harmless and defensive; the real guarantee is `unlockedRooms`/`npcRouteRooms`.

Spot-checks confirmed the atypical targets: `test_behind_wall_fade`'s `server` is reached by an
open connection (still a server unlock on crossing), `lab_social_engineering`'s three targets are
key-locked doors (`recon_door`/`operations_door`/`blue_team_door`), `m10`'s `security_office` is
opened by an event `unlockDoor` mapping that routes through `NPCGameBridge.unlockDoor` ->
`/unlock method: npc` -> `unlock_room!` (`npc-game-bridge.js:78-120`), and no target is a scenario's
`startRoom`. No `enter_room` target is a remote/network-session room; all are physical rooms.

**`currentRoom` is genuinely server-checked** (§8.1 claim holds): `:2099-2105`. The check keys on the
same `unlockedRooms`/`startRoom` set, so `currentRoom` carries no independent protection and no
independent risk. Sound.

## enter_room audit table

| Scenario | enter_room task(s) -> target room | How the target enters `player_reached_room?` in honest play |
|---|---|---|
| `m01_first_contact` | `main_office_area`, `it_room` (x2), `derek_office`, `server_room` | door unlock -> `unlockedRooms` (written before entry) |
| `m02_ransomed_trust` | `reception_lobby`, `hospital_ward`, `it_department`, `server_room`, `emergency_equipment_storage` | door unlock -> `unlockedRooms` |
| `m04_critical_failure` | `operations_office`, `engineering_workshop`, `plant_room` | door unlock -> `unlockedRooms` |
| `m05_insider_trading` | `server_hallway`, `torres_office`, `server_room`, `data_center` | door unlock -> `unlockedRooms` |
| `m06_follow_the_money` | `server_room`, `blockchain_lab`, `data_center`, `executive_wing`, `satoshi_office` | door unlock -> `unlockedRooms` |
| `m07_architects_gambit` | `operations_floor`, `server_room`, `generator_room`, `cable_vault`, `scada_control` | door unlock -> `unlockedRooms` |
| `m09_digital_archaeology` | `restricted_stacks`, `sorensen_office`, `tape_room` | door unlock -> `unlockedRooms` |
| `m10_full_disclosure` | `blast_tunnel`, `security_office`, `workshop_floor`, `power_room`, `server_hall`, `gallery` | door unlock or event `unlockDoor` (-> `/unlock method:npc` -> `unlock_room!`) -> `unlockedRooms` |
| `sis02_energy` | `battery_hall_1`, `engineering_workshop` | door unlock -> `unlockedRooms` |
| `sis03_cyber_insurance` | `meridian_evidence_archive` | door unlock -> `unlockedRooms` |
| `lab_social_engineering` | `recon_room`, `operations_room`, `blue_team_room` | key-locked door unlock -> `unlockedRooms` |
| `test_objectives` | `reception`, `office1` (x2) | door unlock -> `unlockedRooms` |
| `test_bark_bubbles` | `lobby` | door unlock -> `unlockedRooms` (gate rooms `store_a/b` carry no enter_room task) |
| `test_ink_email` | `store_room` | door unlock -> `unlockedRooms` |
| `test_clone_left_card` | `vault` | credential/clone unlock -> `unlockedRooms` |
| `test_behind_wall_fade` | `server` | open connection, still server unlock on crossing -> `unlockedRooms` |
| `test_gate_tailgate` | `staff_room` | **split gate**: slip-in -> `npcRouteRooms` (covers no-credential entry); viaPass/viaCredential -> `unlockedRooms` |

No target leaves the set at completion time in honest play. No blocker.

## Major

### major 1. The throttled-network live proof (§13) cannot produce the reorder it describes, so the owner's "network delays" case is not actually exercised
Plan §8.3 and §13 ("Live proof, `enter_room` under a throttled network"); `objectives-manager.js:708,
588-592` (`flushPendingGlobals`), `:666-690` (`serverCompleteTaskWithRetry`).

The §8.3 pre-flush **awaits** `window.stateSync.sync()` before the completion POST. The §13 proof says
to "delay the room-entry `sync_state` request so it lands after the `enter_room` completion POST". But
if the delayed sync is the awaited pre-flush sync, awaiting it delays the POST by the same amount, so
the POST cannot overtake it: the two cannot reorder. And in the real client the membership that the
check reads (`unlockedRooms`) is written by the door `/unlock`, whose success the client waits for
before it opens the door and lets the avatar in, so membership can never legitimately land *after*
entry either. The race the owner is worried about therefore essentially cannot arise in the honest
client, and the proof as written does not demonstrate anything about it.

**Suggested fix:** redesign the proof to prove the real guarantee rather than an impossible reorder.
Delay the entry `currentRoom` sync while the door `/unlock` (which writes `unlockedRooms`) has already
landed, drive the honest completion, and assert it is **not** refused (`unlockedRooms` carries it even
though `currentRoom` is late); separately, exercise an **old tab with no pre-flush** posting the
completion directly and assert the same non-refusal on durable `unlockedRooms`; and keep the tampered
no-entry case asserting `Room not reached`. State explicitly that the guarantee is the pre-unlock
`unlockedRooms` write, not the pre-flush ordering. Without this the owner's "test for network delays"
requirement is unmet.

## Minors

### minor 1. `enter_room` "Room not reached" is not retryable, unlike §3.6's `room_not_reachable`
Plan §8.2, §8.3; `objectives-manager.js:666-690` (retry only on `transient`).

The completion retry (`serverCompleteTaskWithRetry`) retries only failures flagged `transient`. The
new `{ success: false, error: 'Room not reached' }` is not transient, so a completion that loses a
residual race (e.g. the `npcRouteRooms` slip-in, minor 4) is **not** retried and the task stays active
until the avatar next crosses a room boundary into the target, which may not happen because the avatar
is already inside. §3.6 already makes the sibling object-gate refusal `room_not_reachable` **retryable**
on the client; the two refusals should be consistent. **Suggested fix:** have the client treat
`Room not reached` as retryable (re-attempt after the next sync), mirroring §3.6, so any residual
ordering gap self-heals; or state in §8.3 that the durable pre-unlock `unlockedRooms` write makes a
refusal impossible in honest play and therefore no retry is needed (then the error can surface only to
a true forge).

### minor 2. `player_reached_room?`'s `currentRoom` disjunct is subsumed and adds no coverage
Plan §8.2.

Because `merge_last_write_wins_sections` only ever sets `currentRoom` to a room already in
`unlockedRooms`/`startRoom`/`npcRouteRooms`, the saved `currentRoom` is always a member of the other
disjuncts. Listing `currentRoom` is harmless and defensive, but the plan should say so, so a builder
does not think `currentRoom` is doing independent work or weaken the other terms relying on it. It
also means the awareness-world case rests on `awareness_world_room?` (and auto-unlock into
`unlockedRooms` on `GET room`), **not** on `currentRoom`, which the guard does not admit for a world
room directly.

### minor 3. Pin drift: `SYNC_STATE_COLUMNS` is at `games_controller.rb:2027`, not `:2022`
Plan §3.3a (prose "`games_controller.rb:2022`").

At the current tree `SYNC_STATE_COLUMNS = %i[...].freeze` is `:2027` (the surrounding sync-row lock is
`:819`). The amendment did not re-verify this pin; off by five lines. Every other load-bearing pin I
checked holds exactly at `f5562cce2`: `unlock_room!` `:116`, `room_unlocked?` `:122`,
`awareness_world_room?` `:134`, `merge_global_variables!`/`read_only` `:332`/`:340`,
`stored_scenario_data` `:797`, `SERVER_OWNED_GLOBAL_NAMES` `:1798`, `login_scope_of` `:1913`,
`rfid_lock_passes?`/`rfid_requires_held?` `:2545`/`:2563`, `validate_unlock` `:3081`,
`npc_mapping_unlocks_door?` `:3521`, `complete_task!` `:3675`, `enter_room` branch `:3745`,
`skip_task!` `:3798`; controller `show` `:193`, `room` `:506`, transaction `:1137`,
`serve_opened_room` call `:1139` and def `:2244`, `merge_last_write_wins_sections` `:2098`.

### minor 4. The pre-flush does not order the NPC route POST that writes `npcRouteRooms`
Plan §8.3.

The §8.3 pre-flush orders the player's own `currentRoom` sync, but the `npcRouteRooms` membership for
a slip-in is written by the gate NPC's `method: npc` route POST, a separate client->server request the
pre-flush does not touch. Honest play holds because the gate only opens once the NPC holds it (its
route POST has fired), so `npcRouteRooms` is written before the avatar can pass; but the plan should
say so, because the slip-in `enter_room` (`test_gate_tailgate` `enter_staff`) depends on it and, per
minor 1, is not retried if it loses that race.

## The other owner decisions (Q1, Q2, Q3, Q5, Q6)

- **Q1 (server-owned pass).** Applied. `test_gate_tailgate`'s gate names `playerMayPassIf:
  visitor_pass` (`scenario.json.erb:52`) and the plan instructs making `visitor_pass` a worn,
  server-set pass and removing the client `set_global visitor_pass` writer at `:138` (confirmed that
  line is exactly that writer). The §12 validator rule (split gate's pass global must be server-owned,
  error) and the §3.3a runtime check (viaPass only promotes on a server-owned global) together make a
  client-writable pass unforgeable; belt and suspenders. Sound.
- **Q2 (scope now).** Applied and verified: the rfid possession check (`rfid_lock_passes?` ->
  `rfid_requires_held?`, `:2545`/`:2563`, reading `held_keycard_ref_ids`/`server_clones`, ignoring
  client `card_ids`) is present at the worktree HEAD (merged via `1ce7486c7`), so the viaCredential
  path (Chunk B, §3.3b) builds against a real server possession result, not a deferral. Sound.
- **Q3 (holds-doors demos).** Applied: `test_bark_bubbles`/`test_access_habits` have no cloner and no
  server-owned pass, so they do not split, credit nothing and forge nothing; presentation-only with a
  per-directory README note. `test_bark_bubbles`'s `enter_lobby` targets `lobby` (door-reached), not a
  gate room, so §8 leaves it unchanged. Sound.
- **Q5 (`p4_safe` cross-room code leak).** Applied: accepted, optional credit, nothing takeable, with
  the §12 validator warning for any server-enforced lock code in a route room's readable text. Sound.
- **Q6 (phish-evidence).** Applied: out of scope, §15/§16. Sound.

## Verdict

**Ready to build once major 1 is folded in.** The `enter_room` server validation is sound and does not
refuse honest players: every one of the 17 scenarios' targets enters `unlockedRooms` (or `npcRouteRooms`
for the one split-gate slip-in) before the completion POST, and the pre-existing `currentRoom` guard
already enforces that same invariant for every room a player can occupy, so the new check reads durable
state the player must already have earned. `currentRoom` is genuinely server-checked. All load-bearing
pins hold at `f5562cce2` save one five-line drift (minor 3). The one real defect is the verification,
not the design: the throttled-network proof as written cannot exercise the reorder the owner asked
about (major 1), so the "network delays" requirement is not yet met; redesign it to prove the durable
pre-unlock `unlockedRooms` write and to cover an old tab with no pre-flush. Fold in major 1 and the
four minors (make `Room not reached` retryable or justify it; note the subsumed `currentRoom` disjunct;
fix the `:2022` pin; note the NPC-route-POST ordering) and build Chunk F with the others.

## Outcomes

All findings were verified in code and folded into the plan.

- **Major 1 (live proof under network delays).** Confirmed: §8.3's awaited pre-flush cannot overtake
  itself, and the door `/unlock` writes `unlockedRooms` before the client opens the door
  (`unlock-system.js:696`, `:721-755`; `serve_opened_room` -> `unlock_room!`, `game.rb:116`), so the
  honest reorder the old proof described cannot arise. §13's "Live proof, `enter_room` under a
  throttled network" is replaced by five cases that exercise delays a player can meet: (1) the door
  unlock lands, then the `currentRoom` sync and pre-flush are delayed and, in a repeat, aborted
  (Playwright `route`), and the completion still passes; (2) an old tab with no pre-flush posts the
  completion with no prior sync and passes; (3) offline then reconnect with a queued completion
  passes; (4) a duplicated or retried completion is idempotent and never double-credits; (5) the
  forged no-entry completion stays refused (`Room not reached`), and the retryable re-post does not
  launder it. Each case states the guarantee it proves (the pre-entry `unlockedRooms` write). §8.3 now
  pins that guarantee explicitly and demotes the pre-flush to a timing courtesy. Rails tests 14-21 and
  the node pre-flush/old-tab/retry tests each fail if the check or its guarantee is removed.

- **Minor 1 (retryable refusal).** Taken, retryable preferred. The `enter_room` refusal is now
  `{ success: false, error: 'Room not reached', retryable: true }` (§8.2); the client awaits one
  `stateSync.sync()` and re-posts once, surfacing only a still-refused forge (§8.3). §3.6's
  `room_not_reachable` is aligned to the same `retryable` flag and shared client handling, so the two
  refusals are consistent.

- **Minor 2 (subsumed `currentRoom`).** §8.2 now states the `currentRoom` disjunct is defensive and
  carries no independent coverage, and that the awareness-world case rests on `awareness_world_room?`,
  not `currentRoom`.

- **Minor 3 (pin drift).** §3.3a corrected: `SYNC_STATE_COLUMNS` is `games_controller.rb:2027`
  (verified).

- **Minor 4 (NPC-route POST ordering).** §8.3 now notes the pre-flush does not order the gate NPC's
  `method: npc` route POST that writes `npcRouteRooms`; honest play holds because the gate opens only
  after that POST has fired, and the retryable refusal covers any residual race.

Chunk F (§14) updated to list tests 14-21, the retryable handling, and the five-case live proof.
