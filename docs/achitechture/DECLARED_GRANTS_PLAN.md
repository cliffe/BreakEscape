# Declared grants: plan

Status: plan only, nothing implemented. Written 2026-11-05.

Goal: a scenario's own `give_item` actions become the server's allowlist for rewards, and a
claim is accepted only once that grant's trigger holds in server-side state. The hidden
`takeable:true, active:false` twin object stops being the thing that makes a reward work.
Scenarios that use twins today keep working.

## 1. How rewards flow today

### 1.1 Where a scenario-side give_item can come from

| Source | Runs on | Code | In use |
|---|---|---|---|
| `timers[].actions[]` | client | `ui/scenario-timer-dispatcher.js:230` calls `applyActions(timer.actions, { source: 'timer:<id>' })` | lab_physical_pentest, lab_social_engineering (the two twins) |
| object `triggerOnInteract` / `onInteract.actions` | client | `systems/interactions.js:820, 845, 1818` | no scenario uses give_item here |
| flag-station `flagRewards` | **server** | `games_controller.rb:2253` `process_flag_rewards` → `:2299` `process_item_reward` adds from the station's `itemsHeld` | m02, m03, m06, m07, secgen_vm_lab |
| NPC `eventMappings` | client | `systems/npc-manager.js` ~1026–1190 | **cannot** give items: a mapping has setGlobal, completeTask, emitEvent, openMinigame and so on, but no actions list and no give key |
| ink `#give_item:<type>` | client | `minigames/helpers/chat-helpers.js:98` → `NPCGameBridge.giveItem` (`systems/npc-game-bridge.js:209`), which sends `sourceNpcId` (`:274`) | many missions |

Ink `#give_item` is a different path: it gives an item out of the speaking NPC's `itemsHeld`,
and the server checks it against that NPC's `itemsHeld` and `encounteredNPCs`
(`find_accessible_item` priority 0.5, `games_controller.rb:1888`; check at `:1819`). The
`itemsHeld` list is already its declaration. It does not use twins and is out of scope (see
§6, Q3).

Flag rewards are delivered by the server itself. The client's follow-up `addToInventory` is
accepted by the "already held" short cut (`:971`). They need no twin, but they expose a
related hole (§3.3).

So the twin problem is confined to client-side `applyActions` give_items, and today that
means two timers.

### 1.2 End to end, timer give_item

1. **Trigger.** Something on the client sets the trigger global in `window.gameState.globalVariables`:
   - lab_physical_pentest: the eventMapping `npc_used:usb_target_pc` with
     `data.tag === "tag_deviceB"` runs `setGlobal: { kp_usb_foothold: true }` and
     `completeTask: usb_foothold` (`scenario.json.erb:627–633`; applied at
     `npc-manager.js:1027–1039`).
   - lab_social_engineering: `lord_mail.ink:43` `#set_global:phish_lord_foothold:true`.
   Neither write talks to the server. `writeGlobal` (`systems/global-writer.js`) and the
   mapping's setGlobal only change memory and emit `global_variable_changed:<name>`.
2. **Timer start.** The dispatcher listens for `global_variable_changed:<startOnGlobal>`
   (`scenario-timer-dispatcher.js:81–100`) and records a start time.
3. **Fire.** `update()` (`:174–195`) fires once `delayMs` (300 in both labs) has passed.
   `_fireTimer` (`:202–243`) evaluates `condition` against client globals (`:206`), runs
   `setGlobal`, runs `applyActions` (`:230`), then adds the id to `firedTimers` (`:235`)
   **whether or not the actions succeeded**.
4. **Client action.** `apply-actions.js:172–186` builds a fake sprite with
   `objectId: action_item_<name>_<ts>` and `scenarioData: action.item`, and calls
   `window.addToInventory` without awaiting it.
5. **Request.** `systems/inventory.js:364` `addToInventory` POSTs
   `/break_escape/games/:id/inventory` with `{ action_type: 'add', item: <the client's item
   hash>, source_npc_id: undefined }` (`:459–478`). Nothing marks it as a timer grant.
6. **Server.** `games_controller.rb:952` `inventory`, under `with_game_lock` (`:84`):
   - `:971` already held and no NPC named → 200 with no checks.
   - `:975` `validate_item_collectible` (`:1752`): notepad (`:1762`), decor cups (`:1768`),
     start items (`:1774`), then `find_accessible_item` (`:1869`).
   - `find_accessible_item` matches by `ItemIdentity.addressed_by?` (type plus id, or the lock
     a key opens). Priority 0 `objects_added` (`:1877`), 0.5 the named NPC (`:1888`), 1 objects
     in rooms that are `locked:false` or in `unlockedRooms` (`:1913`), 2 any room including
     container contents and flag-station `itemsHeld` (`:1924–1944`), 3 NPC `itemsHeld`
     (`:1948`). It does **not** look at `active`.
   - The match must be `takeable` (`:1797`), then the location check: container unlocked
     (`:1804`), room unlocked if locked (`:1811`), NPC encountered (`:1819`), flag station:
     **no check at all** (`:1834–1840`).
   - `:983` `add_inventory_item!` stores **the client's item hash** (`item.to_unsafe_h`), not the
     scenario's.
7. **Twin.** This is why each reward needs a world object of the same type and id, takeable,
   in a room the player can reach: `records_remote_session` in open_plan
   (`lab_physical_pentest/scenario.json.erb:926–955`) and `sofia_remote`
   (`lab_social_engineering/scenario.json.erb:1796–1830`). `active:false` keeps it out of the
   room on the client (rooms.js reveals only active objects). These two are the only
   `active:false` objects in any scenario.
8. **The twin does a second job.** Opening the inventory opener fetches
   `GET .../container?container_id=<id>` (`games_controller.rb:513`), which finds the
   container by id **in room objects only** (`find_container_in_scenario`, `:1637`) and serves
   its `contents`. In the SE lab the nested archive's password unlock also resolves against the
   twin (`Game#validate_unlock` → `find_scenario_object`). Removing a twin today breaks the
   opener even if the inventory add were allowed.

### 1.3 What the server knows when the claim arrives

- **Globals** reach the server only through `PUT /sync_state` (`games_controller.rb:712`,
  `merge_last_write_wins_sections` `:1469` → `Game#merge_global_variables!`
  `game.rb:274`). There is no separate set_global endpoint. Any global the client sends is
  written except the imported (read-only) ones.
- `StateSync` (`state-sync.js`) sends on a 30 s interval (`:126`, `:143`), on `pagehide`, and
  when code calls `window.stateSync.sync()` (33 call sites, none on the timer or setGlobal
  path). `syncConfirmed()` (`:486`) retries until acknowledged.
- **Timer state** (`scenarioClock`: elapsed, fired, cancelled, started) also arrives by
  sync_state (`:1545` → `Game#merge_scenario_clock!` `game.rb:1796`). It is client-asserted.
- **Tasks**: `complete_task!` (`game.rb:1463`) validates only `collect_items`, `unlock_room`,
  `unlock_object`, `npc_conversation`, `submit_flags`. Both labs' foothold tasks are
  `type: manual` and pass unchecked.
- Things the server establishes for itself: `unlockedRooms`, `unlockedObjects` (through
  `validate_unlock`), `encounteredNPCs` (room loads), submitted flags and
  `flag_rewards_claimed`, inventory, task completion for the validated types, game
  `created_at`.

### 1.4 The race

The trigger global is **not** reliably on the server before the claim. In practice it almost
never is. The global flips in client memory, the timer fires 300 ms later, and the POST leaves
at once. The next sync is up to 30 s away, so a server that checked the global today would
refuse nearly every honest claim. Any design that checks the trigger must carry it to the
server ahead of the claim, or in the same request (§2.5).

Two smaller ordering facts: sync_state takes a row lock in its own transaction (`:718–719`) and
`inventory` runs under `with_game_lock`, so the two never interleave. And because the timer is
marked fired even when the claim is refused (step 3), a refused claim is lost for good on reload.

## 2. Design

### 2.1 The grant list

A plain Ruby class, `BreakEscape::DeclaredGrants` (`app/models/break_escape/declared_grants.rb`),
with `DeclaredGrants.for(scenario_data)` returning an array of grants:

```ruby
Grant = Struct.new(:grant_id, :kind, :source_id, :item, :trigger)
# grant_id  "timer:grant_remote_session", "interact:<object id>", "flag:<station id>:<index>"
# kind      :timer | :interact | :flag
# item      the scenario's own item hash (deep-frozen copy)
# trigger   { start_on_global: "kp_usb_foothold", condition: "...", delay_ms: 300 } and so on
```

It walks `timers[].actions`, every room object's `triggerOnInteract` and `onInteract.actions`
(nested `confirm_action.onConfirm` included), and flag stations' `flagRewards` give_items.
`Game#declared_grants` memoises it per instance. It is not cached across requests: the scenario
is a per-game snapshot rendered at create, `inventory` already loads it, and the walk is a few
hundred nodes. A game created before the change gets grants from its stored snapshot, so
existing games pick the feature up without migration.

A grant item must have `type` and `id` (or `opens_lock` for a key). A give_item without an id is
not a grant and keeps the old rule.

### 2.2 Matching a claim

`validate_item_collectible` gets one new step after the start-items check (`:1778`) and before
`find_accessible_item`:

1. The client sends an optional `grant_source` with the add (`"timer:grant_remote_session"`;
   `applyActions` already has `source` and passes it on the sprite as `grantSource`).
2. The server takes the grants whose item is addressed by the claim
   (`ItemIdentity.addressed_by?(grant.item, type, id, nil)`: type plus id, never name). With a
   `grant_source`, only that grant is considered. Without one (an older cached client), any
   matching grant.
3. **If any grant matches, the grant rule decides** and the twin rule is not consulted (§2.6):
   - trigger met → accept, set `@collectible_location = { type: 'grant', grant_id: }`;
   - trigger unmet → refuse with `code: 'grant_trigger_unmet'`, status 409 so the client can
     tell it from a 422;
   - trigger the server cannot check → fall back to the twin rule (§2.3).
4. No grant matches → the existing path, unchanged.

On accept, the controller stores **the grant's item** (`grant.item.deep_dup`), not the client's
hash, and appends the grant id to `player_state['grantsClaimed']`.

### 2.3 Trigger kinds

| Trigger | Server check | Evidence |
|---|---|---|
| timer `startOnGlobal: X` | `globalVariables[X]` truthy | client-asserted (synced global) unless X is imported or server-set |
| timer `condition` (globalVars grammar: bare, `!`, `===`, `!==`, `<`, `>`, `<=`, `>=`, `&&`) | evaluate with a Ruby port of `_evaluateCondition` (`scenario-timer-dispatcher.js:284`) | client-asserted globals |
| timer with no `startOnGlobal` (delay from start) | `Time.current - game.created_at >= delayMs` (wall time is never less than game time, so honest clients always pass) | server-verified, weak |
| timer `cancelOnGlobal` | **not checked**: the server cannot tell whether the cancel came before or after the fire, and refusing would take legitimate rewards | none |
| `triggerOnInteract` / `onInteract` on object O | O is reachable by the same rules as a pickup: O's room unlocked or `locked:false`, O itself in `unlockedObjects` if it is locked | server-verified (the twin rule, anchored on the real object) |
| flag-station `flagRewards` give_item | the flag is in `flag_rewards_claimed` / submitted flags | server-verified |
| ink `#give_item` | not a grant (the ink position lives only on the client) | itemsHeld rule as today |
| eventMapping | does not exist (§1.1). If someone adds it later, only `globalVars.*` terms of `condition` could be checked; `data.*` terms come from client events and cannot. Authors should keep using "mapping sets a global, timer with `startOnGlobal` gives". | n/a |

A condition the Ruby grammar cannot parse (a `data.*` term, `.includes`, anything unknown)
marks the trigger **uncheckable**. Uncheckable falls back to the twin rule, so a scenario is
never worse off than today, and the validator warns about it (§4.3).

Combined triggers are ANDed: `startOnGlobal` and `condition` must both hold.

### 2.4 Once-only, repeat claims, save and reload

- Timers fire once and objects grant on every interaction, so v1 grants are **once-only**:
  `grantsClaimed` records the grant id. A repeat claim while the item is held is already a
  200 through the `:971` short cut. A repeat claim after the item has left the inventory is
  refused (`grant_already_claimed`). A `repeatable: true` flag on the action is left for later
  (§6, Q5).
- Reload: inventory comes back from the server as today (`_restoredFromSave` skips
  revalidation, `inventory.js:454`). `grantsClaimed` is a new grow-only key in `player_state`
  and needs no client mirror.
- **Lost-grant repair.** Because the dispatcher marks a timer fired even when the claim fails
  (§1.2 step 3), the bootstrap response (`GamesController#scenario`, `:267`, beside
  `savedGlobalVariables` and `savedScenarioClock` at `:297–332`) gains `pendingGrants`: grants whose trigger is met
  (checkable kinds only), that are not in `grantsClaimed` and whose item is not held. On load
  the client claims each one through the same path. This also mends today's failure mode
  (network error at the moment of firing). The list is filtered to grants whose source has
  fired by the client's own record (`scenarioClock.fired` for timers), so a timer with a long
  delay is not delivered early.

### 2.5 Closing the race

Default: the claim carries the trigger's globals.

- `applyActions` give_item for a timer source reads the timer's trigger names (startOnGlobal
  and the names in its condition) and adds `trigger_globals: { name: value }` to the add
  request. `addToInventory` passes it through.
- Under the same `with_game_lock`, the server merges **only names the matched grant's trigger
  reads** through `merge_global_variables!` (imports stay read-only, `nil` deletes as in
  sync_state), then evaluates the trigger. Other names are ignored and logged.
- On `grant_trigger_unmet` the client runs `await window.stateSync.syncConfirmed()` and retries
  once. A second refusal is shown as today and the grant is left for `pendingGrants`.

This is no weaker than now: sync_state would accept the same writes a moment later. The
alternative, syncing first and then claiming, costs a round trip, can come back `stale`, and
still leaves a window. See §6, Q1.

### 2.6 Living with the twin rule

- An item that matches a declared grant is decided by the grant rule only. So once grants
  exist, a twin can no longer be claimed early by walking into its room, and nothing else
  changes for twins.
- An item with no matching grant keeps the current rule exactly: world pickups, containers,
  NPC gifts, start items, decor cups.
- An uncheckable trigger falls back to the twin rule.
- Edge case: a scenario that has the same type+id both as a visible world pickup and as a
  grant would lose the pickup route. No scenario does this today (the only same-id pairs are
  the two `active:false` twins). The validator should flag it (§4.3).
- Phase 2 (§4.2) lets a grant carry `contents`, so the container endpoint and nested unlocks
  no longer need the twin.

### 2.7 Files touched (phase 1)

- `app/models/break_escape/declared_grants.rb` (new): walk, Struct, condition evaluator.
- `app/models/break_escape/game.rb`: `declared_grants`, `grant_trigger_met?(grant)`,
  `record_grant_claim!`, `pending_grants`.
- `app/controllers/break_escape/games_controller.rb`: `inventory` (permit `grant_source`,
  `trigger_globals`; store canonical item; 409 code), `validate_item_collectible` (grant step),
  bootstrap (`pendingGrants`), and §3.3 flag-station check.
- `public/break_escape/js/systems/apply-actions.js`: pass `grantSource` and the trigger globals
  on the sprite.
- `public/break_escape/js/systems/inventory.js`: send them; one sync-and-retry on 409.
- `public/break_escape/js/ui/scenario-timer-dispatcher.js` or `core/game.js`: claim
  `pendingGrants` after load.
- `scripts/validate_scenario.rb`: §4.3.
- No new static imports are planned. If one is added, update every node harness copy list
  (`bin/test-js` runs plain node).

## 3. Threat model

"Modified client" means someone using the browser console or a proxy to send their own
requests with their own session.

### 3.1 Today

- **Claim a twin early.** One POST to `/inventory` with `{ type: 'pc', id: 'records_remote_session' }`
  adds the physical lab's reward from the first second of the game: open_plan has no room lock,
  and a room with no `locked` key passes the priority 2 check. In the SE lab the same POST for
  `sofia_remote` works as soon as `operations_room` (key lock `operations_door`) is unlocked,
  long before the phish. No trigger is needed in either case.
- **Read the twin's contents without the item.** The twin is `locked:false`, so
  `POST /unlock` with method `unlocked` succeeds (`Game#validate_unlock`, the object branch,
  "Object is unlocked in scenario data") and `GET /container?container_id=sofia_remote` then
  serves the contents. No room check is applied on this path.
- **Inject fields.** The stored inventory item is the client's hash (`:983`). Type and id must
  match a real object, but every other field is the client's choice.
- **Flag-station items without the flag.** `find_accessible_item` priority 2 resolves any
  flag-station `itemsHeld` entry, and the `flag_station` branch (`:1834`) accepts with no check.
  This affects m02, m03, m06, m07 and secgen_vm_lab, all VM-flag rewards.

### 3.2 After phase 1

- **Claim before the trigger:** refused (409), even if a twin is reachable.
- **Forge the trigger, then claim:** still possible in both labs. `kp_usb_foothold` and
  `phish_lord_foothold` are ordinary globals. sync_state writes them on request, and the
  foothold tasks are `manual` and unchecked. The attacker now needs two requests instead of one.
  The server log records a grant claimed with its trigger set by the claim itself or by
  sync_state, which is something to audit. It is not a barrier. Real protection needs a trigger
  the server establishes itself (an unlock, a flag, a validated task, an encounter), and neither
  lab's mechanic currently produces one. §6, Q8 covers whether to add that.
- **Undeclared or wrong item:** unchanged, refused.
- **Field injection on grants:** closed, because the canonical item is stored. Phase 1 can apply
  the same to ordinary pickups (store the matched scenario object, keeping only the client
  fields that legitimately change, such as `decor`). That is listed as optional because some
  pickups may carry client-side state the server copy lacks. It needs its own audit.
- **Flag-station items:** closed if §3.3 is taken.
- **Twin contents without the item:** still open in phase 1, closed in phase 2 (§4.2), where a
  granted container's contents are served only while the grant is claimed.

### 3.3 Fix in the same change (recommended)

The `flag_station` location branch should require that the reward's flag is in
`flag_rewards_claimed` (or among the submitted flags) and refuse otherwise. The server already
adds these items itself in `process_item_reward`, so the only honest client add is the
"already held" re-send, which `:971` accepts before validation. The change takes a few lines and
cannot break an honest client. The same holds if flag rewards are modelled as `:flag` grants.

### 3.4 New holes introduced

- `trigger_globals` lets `/inventory` write globals. It is limited to the names the matched
  grant's trigger reads, imports stay read-only, and sync_state already accepts the same writes.
  No new capability, but it is a second write path for globals and must reuse
  `merge_global_variables!`, not a copy of it.
- `pendingGrants` tells the client which grants are due. They are due by the server's own rule,
  so this discloses nothing the client could not claim anyway. It lists only grants whose
  trigger is met, so it never spoils a future reward.
- A grant bypasses room and container checks by design: the reward is not in a room. It is
  limited to items declared by the scenario's own actions, matched on type plus id, and those
  items are already shipped to the client in the scenario JSON.
- Falling back to the twin rule for uncheckable triggers keeps today's behaviour, no worse.

## 4. Migration

### 4.1 Scenarios using twins today

Found by searching every `scenarios/**/scenario.json.erb` for `"give_item"` outside flag rewards
and for `"active": false`:

| Scenario | Grant | Trigger | Twin |
|---|---|---|---|
| lab_physical_pentest | timer `grant_remote_session` (`scenario.json.erb:158–177`), item `pc` / `records_remote_session` | `startOnGlobal: kp_usb_foothold`, set by the `npc_used:usb_target_pc` mapping (`:627–633`) | open_plan object `:926–955`, with `contents` |
| lab_social_engineering | timer `grant_remote_session` (`:167–182`), item `pc` / `sofia_remote` | `startOnGlobal: phish_lord_foothold`, set by `ink/lord_mail.ink:43` | Operations Room object `:1796–1830`, with `contents` and a nested locked archive |

No other scenario has a client-side give_item or an `active:false` object. Flag-reward
give_items (m02, m03, m06, m07, secgen_vm_lab) are server-delivered and need no twin.

### 4.2 Keep or remove the twins

**Phase 1: keep them.** They still hold the container contents and the nested archive the
opener needs (§1.2 step 8). Once grants exist, they stop letting the reward be claimed early.

**Phase 2: remove them (recommended once phase 1 is live-proven).**
- A grant item may carry `contents` (and nested locked items) directly, as the twin does now.
- `find_container_in_scenario` also searches claimed grant items. `check_container_unlocked`
  treats a granted container as open **only while its grant is in `grantsClaimed` and the item
  is held**, instead of through `unlockedObjects`.
- `Game#find_scenario_object` (behind `validate_unlock`) also searches grant item contents,
  so the SE lab's nested archive password still validates.
- Then delete both twins and their F11 comments. The server-side contents become reachable only
  through the earned item, which closes the last §3.2 gap.

The twin path stays valid in the engine either way. Other authors can still pair a hidden
object with a give_item, and the validator only nudges them.

### 4.3 Validator: how `check_give_item_collectible` should change

Another agent is adding `check_give_item_collectible` to `scripts/validate_scenario.rb` (~2035,
uncommitted at the time of writing). Today it requires a same-type, same-id takeable object in a
reachable room. Once grants land, that check should become:

1. **Grant with a checkable trigger** (timer with `startOnGlobal` and/or a parseable
   condition, a plain-delay timer, or triggerOnInteract on an object): **no twin needed.**
   Drop the "no matching object" ERROR for these.
   - ERROR if the item has no `id` (and no `opens_lock` for a key): it cannot be a grant.
   - ERROR if `startOnGlobal` or a `globalVars.X` in the condition names a global that is not
     declared in the scenario's `globalVariables` and not imported. The trigger could never be
     met.
   - ERROR if the item has `hasContents: true` and neither the item (phase 2) nor a twin
     (phase 1) supplies `contents`.
2. **Grant with an uncheckable trigger** (condition outside the Ruby grammar): keep today's
   twin requirement and add a WARNING that the server cannot check the trigger, so the reward
   is only as safe as the twin.
3. **Twin present alongside a grant with a checkable trigger**: phase 1, INFO (the twin is a
   contents holder). Phase 2, WARNING that it is redundant and should move into the grant's
   `contents`.
4. **Same type+id as both a visible (`active` not false) takeable pickup and a grant**:
   WARNING, because the grant rule now decides and the pickup route will be refused until the
   trigger holds.
5. **Two grants for the same type+id**: WARNING (ambiguous). The server accepts if any matching
   grant's trigger holds.
6. Share the condition grammar with the server. `scripts/validate_scenario.rb` should call
   `BreakEscape::DeclaredGrants` (or a small file both require) rather than re-implement it,
   so "checkable" means the same thing in both places.

Until the server change ships, the new check as written is correct and should stay. The
change above lands in the same commit as the server code.

## 5. Tests

### 5.1 Rails

New `test/controllers/break_escape/declared_grants_test.rb`, built like `npc_give_test.rb` and
`flag_reward_unlock_door_test.rb`. It uses an inline scenario with: a timer grant
(`startOnGlobal: g_go`, item `pc`/`remote_x`, **no twin**), a timer grant with a twin in an open
room, a condition timer, a plain-delay timer, an object with `triggerOnInteract` give_item
behind a locked room, an imported read-only global, and a flag station with an `itemsHeld`
reward.

Allow:
- `g_go` true in `player_state` → 200. Inventory holds the **scenario's** item (an extra field
  sent by the client, such as `"locked": true` or `"keyPins"`, is absent). `grantsClaimed`
  includes `timer:<id>`.
- Condition timer with the condition true → 200. Plain-delay timer with `created_at` far enough
  back → 200.
- triggerOnInteract grant after the room is unlocked → 200.

Refuse:
- `g_go` false or missing → 409 `grant_trigger_unmet`, inventory unchanged.
- The twin case with the trigger unmet → 409 even though the twin is takeable in an open room
  (proves the grant rule wins).
- Undeclared item (`pc` / `nope`) → 422 as today.
- Wrong id (`pc` / `remote_y`) and wrong type (`key` / `remote_x`) → refused.
- Name-only match (right name, no id) → not treated as a grant.
- `grant_source` naming a different grant than the item → refused.
- Repeat claim after `remove` → 409 `grant_already_claimed`. Repeat while held → 200 (the `:971`
  short cut).
- Plain-delay timer claimed one second after create → refused.
- triggerOnInteract grant with its room still locked → refused.
- Flag-station `itemsHeld` item without its flag → refused (§3.3). With the flag → accepted.

Race:
- `g_go` false on the server, claim carries `trigger_globals: { g_go: true }` → 200, and
  `globalVariables.g_go` is now true.
- `trigger_globals` naming a global the grant does not read → ignored, not written.
- `trigger_globals` setting the imported global → not written. If that is the trigger, 409.
- A sync_state and an inventory claim sent from two threads → both land and neither loses the
  other's write (same pattern as the game-1022 regression test, if one exists. Otherwise a new
  one).

Save and reload:
- After a claim, the bootstrap payload's inventory holds the item and `pendingGrants` is empty.
- Trigger met, timer id in `scenarioClock.fired`, item not held, not claimed → `pendingGrants`
  lists it. Trigger met but timer not in `fired` → not listed. Trigger unmet → not listed.
- `pendingGrants` is still listed after `remove` → **no** (claimed grants never reappear).

Legacy:
- Every existing inventory test passes unchanged, including `npc_give_test`,
  `headless_give_test`, the decor-cup and start-item cases.
- A model test for `DeclaredGrants.for` over both lab scenarios' rendered JSON: exactly one
  grant each, with the trigger listed in §4.1.

Validator: cases for each rule in §4.3, run against fixture JSON. Do not touch the other
agent's tests. Add new ones beside them once their commit lands.

### 5.2 Node (`bin/test-js`)

- `apply-actions` give_item with `source: 'timer:x'` sets `grantSource` and `trigger_globals`
  (only the trigger's names) on the sprite. Other sources leave both unset.
- `inventory.js` add sends `grant_source` and `trigger_globals`. On a 409
  `grant_trigger_unmet` it awaits `stateSync.syncConfirmed` and retries exactly once. On a
  second 409 it returns `{ ok: false, reason: 'rejected' }`.
- Bootstrap `pendingGrants` → one `addToInventory` per entry, none when empty, and none for an
  item already held.
- Extend `inventory-restore-no-revalidate.test.mjs` so restored items still skip the POST.

### 5.3 Live checks (commit first. Keyless server per the playtest memory notes)

Drive with the `window.__test` bridge (playtest-scenario skill):

- **lab_physical_pentest:** before the BadUSB, a console POST of the `records_remote_session`
  add returns 409. Then play the BadUSB beat (`usb_target_pc` used with `tag_deviceB`) → the
  "Remote Session — LW-RECORDS-02" opener appears within a second. Open it → both text files
  show. Reload → the opener is still there and opens. Check the server log line for the grant
  claim.
- **lab_social_engineering:** before the exe, a console POST of `sofia_remote` returns 409.
  Then run the Lord phish to `phish_lord_foothold` → the "Remote Session — LW-FIN-07" opener
  appears. Open it, unlock the nested archive with its password, reload, and repeat.
- **Lost-grant repair:** in either lab, block `/inventory` once (devtools request blocking) as
  the timer fires, unblock, reload → the opener arrives from `pendingGrants`.
- Phase 2 repeats both after the twins are deleted, plus a console `GET /container` for the id
  before the grant → 403.

## 6. Size, risks, open questions

### 6.1 Size

| Part | Lines (approx.) | Agent time |
|---|---|---|
| `DeclaredGrants` walk, Struct, Ruby condition evaluator | 120 | |
| Game and controller changes (grant step, canonical item, 409 codes, trigger globals, `pendingGrants`, flag-station fix) | 120 | |
| Client (apply-actions, inventory retry, pending-grant claim) | 50 | |
| Validator rule change | 60 | |
| Rails, node and validator tests | 350 | |
| **Phase 1 total** | ~700 | about one working day with two review rounds and the two live checks |
| Phase 2 (grant contents, container and unlock lookup, delete twins, tests, live re-check) | ~300 | half a day to a day |

### 6.2 Risks

- **A refused honest claim is lost** until `pendingGrants` ships, because the timer is marked
  fired. Ship `pendingGrants` in the same change as the 409. Do not ship the 409 alone.
- **Two condition evaluators drift** (JS timer and Ruby). Keep the Ruby grammar a strict subset
  and treat anything else as uncheckable. Add a table test that runs the same strings through
  both, with node evaluating the JS side.
- **The shared tree is busy in the same files.** The Office Life work and the validator agent
  are both active. `games_controller.rb` and `inventory.js` are hot. Commit in small steps, with
  explicit paths.
- **Canonical-item storage** could drop a field some client code expects on a grant item. Only
  grants change in phase 1. Check what the opener reads (`id`, `type`, `name`, `hasContents`,
  `locked`), all of which are in the scenario item.
- **`created_at` for plain-delay timers** is wall time. A game resumed weeks later is fine. A
  game reset with `new_session` may keep the old `created_at`. Check `reset` and use its
  timestamp if it has one.
- **Expectations.** In both labs the trigger is a client-asserted global, so phase 1 does not
  stop a determined cheat. It does stop the cheap early claim, it stops the pairing from being
  fragile, and in phase 2 it hides the contents. Say this in the commit message so nobody files
  it as "fixed".

### 6.3 Open questions, with recommended defaults

1. **Trigger globals in the claim, or sync first?** Default: carry them in the claim (§2.5),
   with one sync-and-retry. It is atomic, adds no round trip, and is no weaker.
2. **Trigger unmet but a twin is reachable: refuse or fall back?** Default: refuse. Otherwise
   grants add nothing for the two scenarios that need them.
3. **Include ink `#give_item`?** Default: no. `itemsHeld` is already its declaration, and the
   ink position cannot be checked server-side.
4. **Fix the flag-station `itemsHeld` hole (§3.3) in the same change?** Default: yes. It is small
   and found by the same reading.
5. **Repeatable grants?** Default: not in v1. Every grant is once-only. Add `repeatable: true`
   only when a scenario needs it.
6. **Phase 2 (remove twins, gate contents on the grant)?** Default: yes, as a follow-up once
   phase 1 passes both live checks.
7. **Store the canonical item for every pickup, not only grants?** Default: grants only in
   phase 1. Audit ordinary pickups separately.
8. **Make the labs' triggers server-verified?** For example, record `npc_used` for the BadUSB
   target server-side, or have the mail runner's delivery of the exe reply mark the foothold the
   way it already encounters a headless NPC. Default: not in this work. Note it in
   `docs/IDEAS_BACKLOG.md`, because it is a per-mechanic change, and the user should decide
   whether the labs need cheat resistance at all.
9. **eventMapping give_item?** Default: do not add it. Keep "mapping sets a global, timer gives"
   as the documented pattern.
