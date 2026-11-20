# Declared grants: plan

Status: approved, being built. Written 2026-11-05, rewritten the same day after
review R1 (`DECLARED_GRANTS_PLAN_REVIEW_R1.md`, verdict rethink) to the reviewer's simpler
design, which the user chose. §7 lists what happened to each R1 finding. Review R2
(`DECLARED_GRANTS_PLAN_REVIEW_R2.md`, revise lightly, then build) is folded in on 2026-11-06;
§8 lists its outcomes.

Goal: a scenario's own client-side `give_item` actions become the server's allowlist for
those rewards. The server stores the scenario's copy of a granted item, and serves a granted
container's contents from the granted item while the player holds it. The hidden
`takeable:true, active:false` twin objects are then deleted. There is no trigger check in this
work: a declared grant can be claimed at any time, which is no weaker than today for the
physical lab and slightly weaker for the SE lab (§3.2). Checking triggers waits until the
labs have triggers the server establishes itself (§6.3, Q3).

Out of scope, landed separately: client item fields stored as sent (a lock bypass, R1 M6,
37701964a), the unlock response returning nested `contents` with `requires` (R1 M7,
cd9abc187), and flag-station `itemsHeld` claimable without the flag (R1 m1, e5a401bdc,
`flag_station_item_earned?`, tested in `flag_station_item_claim_test.rb`). This plan builds on
those fixes and says where it touches them.

Line numbers in `games_controller.rb` and `game.rb` are from the working tree on 2026-11-05 and
are moving while those fixes land; method names are the stable reference.

## 1. How rewards flow today

### 1.1 Where a scenario-side give_item can come from

| Source | Runs on | Code | In use |
|---|---|---|---|
| `timers[].actions[]` | client | `ui/scenario-timer-dispatcher.js:231` calls `applyActions(timer.actions, { source: 'timer:<id>' })` | lab_physical_pentest, lab_social_engineering (the two twins) |
| object `triggerOnInteract` / `onInteract.actions` (and a nested `confirm_action.onConfirm`, `apply-actions.js:262`) | client | `systems/interactions.js:820, 845, 1819` | no scenario uses give_item here |
| esd-pushbutton minigame `entry.actions` / `completionActions` | client | `minigames/esd-pushbutton/esd-pushbutton-minigame.js:213, 216, 222` | no scenario uses give_item here |
| flag-station `flagRewards` | **server** | `games_controller.rb:2253` `process_flag_rewards` → `:2299` `process_item_reward` adds from the station's `itemsHeld`; the client's `flag-station-minigame.js:907` then runs `applyActions(rewards, { source: 'flag_reward' })`, whose add is a re-send of a held item | m02, m03, m06, m07, secgen_vm_lab. These rewards name the item by `item_name`/`item_type`, with **no `item` hash** |
| NPC `eventMappings` | client | `systems/npc-manager.js` (mapping fields ~840–860) | **cannot** give items: a mapping has setGlobal, completeTask, emitEvent, openMinigame, addCapture and so on, but no actions list and no give key (rechecked: no `give_item` anywhere in npc-manager.js) |
| ink `#give_item:<type>` | client | `minigames/helpers/chat-helpers.js:98` → `NPCGameBridge.giveItem` (`systems/npc-game-bridge.js:209`), which sends `sourceNpcId` (`:274`) | many missions |

Ink `#give_item` is a different path: it gives an item out of the speaking NPC's `itemsHeld`,
and the server checks it against that NPC's `itemsHeld` and `encounteredNPCs`
(`find_accessible_item` priority 0.5, `games_controller.rb:1888`; check at `:1819`). The
`itemsHeld` list is already its declaration. It does not use twins and is out of scope.

Flag rewards are delivered by the server itself. The client's follow-up `addToInventory` is
accepted by the "already held" short cut (`:971`). They need no twin. Their related hole
(station items claimable without the flag) is being fixed separately.

So the twin problem is confined to client-side `applyActions` give_items that carry an `item`
hash, and today that means two timers.

### 1.2 End to end, timer give_item

1. **Trigger.** Something on the client sets the trigger global in `window.gameState.globalVariables`:
   - lab_physical_pentest: the eventMapping `npc_used:usb_target_pc` with
     `data.tag === "tag_deviceB"` runs `setGlobal: { kp_usb_foothold: true }` and
     `completeTask: usb_foothold` (`scenario.json.erb:612–619`; applied at
     `npc-manager.js:1027–1039`).
   - lab_social_engineering: `lord_mail.ink:43` `#set_global:phish_lord_foothold:true`.
   Neither write talks to the server. `writeGlobal` (`systems/global-writer.js`) and the
   mapping's setGlobal only change memory and emit `global_variable_changed:<name>`.
2. **Timer start.** The dispatcher listens for `global_variable_changed:<startOnGlobal>`
   (`scenario-timer-dispatcher.js:81–100`) and records a start time.
3. **Fire.** `update()` (`:174–195`) fires once `delayMs` (300 in both labs) has passed.
   `_fireTimer` (`:202–243`) evaluates `condition` against client globals (`:206`), runs
   `setGlobal`, runs `applyActions` (`:231`), then adds the id to `firedTimers` (`:235`)
   **whether or not the actions succeeded**. `firedTimers` is synced as
   `scenarioClock.timers.fired` (`state-sync.js:330`, `Game#merge_scenario_clock!`
   `game.rb` ~1800).
4. **Client action.** `apply-actions.js:172–186` builds a fake sprite with
   `objectId: action_item_<name>_<ts>` and `scenarioData: action.item`, and calls
   `window.addToInventory` without awaiting it. `applyActions` (`:72`) returns nothing.
5. **Request.** `systems/inventory.js` `addToInventory` POSTs
   `/break_escape/games/:id/inventory` with `{ action_type: 'add', item: <the client's item
   hash>, source_npc_id: undefined }` (`:454–478`). Nothing marks it as a timer grant. It
   resolves to `{ ok: false, reason: 'rejected' }` on a refusal (after an "Invalid Action"
   alert, `:482–490`) and `{ ok: false, reason: 'error' }` on a network failure.
6. **Server.** `games_controller.rb:952` `inventory`, under `with_game_lock` (`:84`):
   - `:971` already held and no NPC named → 200 with no checks.
   - `:975` `validate_item_collectible` (`:1752`): notepad (`:1762`), decor cups (`:1768`),
     start items (`:1774`), then `find_accessible_item` (`:1869`).
   - `find_accessible_item` matches by `ItemIdentity.addressed_by?`
     (`lib/break_escape/item_identity.rb:60–74`): type must match; if the claim has an id and
     the object has an identity (id, `opens_lock`, legacy `key_id`/`keyId`), only a shared id
     counts; otherwise the name decides. So a claim that sends a name and **no id** matches an
     object by name even when that object has an id. Priority 0 `objects_added` (`:1877`), 0.5 the named NPC (`:1888`), 1 objects
     in rooms that are `locked:false` or in `unlockedRooms` (`:1913`), 2 any room including
     container contents and flag-station `itemsHeld` (`:1924–1944`), 3 NPC `itemsHeld`
     (`:1948`). It does **not** look at `active`.
   - The match must be `takeable` (`:1797`), then the location check: container unlocked
     (`:1804`), room unlocked if locked (`:1811`), NPC encountered (`:1819`), flag station:
     **no check at all** (`:1834–1840`).
   - (Line numbers in this step are as of bdaf9ce3d, before the M6/M7 commits moved them by
     about 30 to 80 lines.) Since M6 (37701964a) the add stores `canonical_inventory_item`, a
     filtered copy of the matched scenario object. Before M6, `:983` `add_inventory_item!` stored **the client's item hash** (`item.to_unsafe_h`), not the
     scenario's.
7. **Twin.** This is why each reward needs a world object of the same type and id, takeable,
   in a room the player can reach: `records_remote_session` in open_plan
   (`lab_physical_pentest/scenario.json.erb:909–938`, with its F11 comment) and `sofia_remote`
   in operations_room (`lab_social_engineering/scenario.json.erb:1795–1871`, nested archive
   included). `active:false` keeps it out of the room on the client (rooms.js reveals only
   active objects). These two are the only `active:false` objects in any scenario
   (`lab_physical_pentest:919`, `lab_social_engineering:1817`).
8. **The twin does a second job: it holds the contents, for three server lookups.**
   Opening the inventory opener runs:
   1. `POST /unlock` with `method: 'unlocked'` and `targetId` = the item's id
      (`unlock-system.js:122, 143`; target id from `scenarioData.id || name || objectId`).
      `Game#validate_unlock` (`game.rb` ~1048) returns true at once if the id is in
      `unlockedObjects` (~1131); otherwise it needs `find_scenario_object` (~1138, def ~1285),
      which searches **room objects only** (recursing into `contents`), and fails if not found.
   2. The unlock response's `contents` come from a second lookup, the controller's
      `find_object_in_scenario` (`games_controller.rb:904`, def `:1672`), **room objects only**.
      Until M7 (cd9abc187) they were returned unfiltered, nested `requires` included; now they
      go through `filter_container_contents` (`:913–916`).
   3. `GET /container/:container_id` (`routes.rb:27`, `container-minigame.js:128–141`, keyed on
      `id || name`) → `container` (`games_controller.rb:513`) → `find_container_in_scenario`
      (`:1641`, `find_container_recursive` `:1656`, matches id or name), **room objects only**,
      gated by `check_container_unlocked` (`:1706`, `unlockedObjects` by id) and filtered by
      `filter_container_contents` (`:1715`).
   In the SE lab the nested archive's password unlock goes through lookup 1 again
   (`find_object_in_contents`), and its contents through lookup 3. Removing a twin today breaks
   all three even if the inventory add were allowed.

### 1.3 What the server knows when the claim arrives

- **Globals** reach the server only through `PUT /sync_state` (`games_controller.rb:712`,
  `merge_last_write_wins_sections` `:1469` → `Game#merge_global_variables!`
  `game.rb:274`). There is no separate set_global endpoint. Any global the client sends is
  written except the imported (read-only) ones.
- `StateSync` (`state-sync.js`) sends on a 30 s interval (`:126`, `:143`), on `pagehide`, and
  when code calls `window.stateSync.sync()` (none on the timer or setGlobal path for these two
  labs). `syncConfirmed()` (`:486`) retries until acknowledged.
- **Timer state** (`scenarioClock`: elapsed, fired, cancelled, started) also arrives by
  sync_state (`:1545` → `Game#merge_scenario_clock!` `game.rb:1796`). It is client-asserted.
- **Tasks**: `complete_task!` (`game.rb:1463`) validates only `collect_items`, `unlock_room`,
  `unlock_object`, `npc_conversation`, `submit_flags`. Both labs' foothold tasks are
  `type: manual` and pass unchecked.
- Things the server establishes for itself: `unlockedRooms`, `unlockedObjects` (through
  `validate_unlock`), `encounteredNPCs` (room loads), submitted flags and
  `flag_rewards_claimed`, inventory, task completion for the validated types, game
  `created_at`.

### 1.4 Why this plan does not check triggers

The trigger global is **not** reliably on the server before the claim. In practice it almost
never is. The global flips in client memory, the timer fires 300 ms later, and the POST leaves
at once. The next sync is up to 30 s away, so a server that checked the global would refuse
nearly every honest claim. The first draft fixed that by carrying the trigger's globals in the
claim, and R1 M1 showed the result certifies itself: a forged claim carries the same globals,
so it is still one request, and an honest claim looks the same in the log. Both labs' triggers
are client-asserted globals (`kp_usb_foothold` from an eventMapping, `phish_lord_foothold` from
ink), and both foothold tasks are `type: manual` (unchecked). A trigger check means something
only once the server establishes the trigger itself (§6.3, Q3).

Two smaller ordering facts: sync_state takes a row lock in its own transaction (`:718–719`) and
`inventory` runs under `with_game_lock`, so the two never interleave (pinned by
`test/controllers/break_escape/game_state_locking_test.rb`). And because the timer is marked
fired even when the claim fails (step 3), a failed claim is lost for good on reload (§2.5).

## 2. Design

### 2.1 The grant list

A plain Ruby module, `BreakEscape::DeclaredGrants`, in `lib/break_escape/declared_grants.rb`
beside `item_identity.rb`. It uses no ActiveSupport (`blank?`, `deep_dup`) and does **not**
call `ItemIdentity`, which uses `blank?`/`present?` (R2 m1), so `scripts/validate_scenario.rb`
and `scripts/generate_dungeon_graph.rb` can `require_relative` it and all three agree on what a
grant is (§4.3).

```ruby
DeclaredGrants.for(scenario_data)        # => [{ 'path' => 'timers[0]/actions[0]', 'item' => {...} }, ...]
DeclaredGrants.unexecuted(scenario_data) # identified give_items outside an executed path (validator)
DeclaredGrants.identities(item)          # id, opens_lock, key_id, keyId (strings, non-empty, unique)
DeclaredGrants.strip_grant_contents!(node) # on a give_item node: drop item.contents, set hasContents
```

**Identity** is one rule everywhere: `id`, `opens_lock`, legacy `key_id`, legacy `keyId`. That
is the set `ItemIdentity.addressed_by?` reads on the scenario side and the set the validator's
`identities` lambda already uses (`validate_scenario.rb:2040`). `identity_candidates` omits
`keyId`, but it is only used on the claim side, where it stays as it is.

**A declared grant** is a node `{ "type": "give_item", "item": { ... } }` where the item hash
has a string `type` and a non-empty identity, and the node sits on a path the engine runs:

- `timers[i].actions[j]` (`scenario-timer-dispatcher.js:231`);
- any object's `triggerOnInteract[j]` (`interactions.js:820, 845`);
- any object's `onInteract.actions[j]` (`interactions.js:1819`);
- esd-pushbutton `completionActions[j]` and `conditionalActions[k].actions[j]`
  (`esd-pushbutton-minigame.js:213–222`);
- `onConfirm[j]` of a `confirm_action` that itself sits on one of these paths
  (`apply-actions.js:262`).

Excluded:

- any subtree under a `flagRewards` key, on any parent (`flag-station`, `vm-launcher`,
  `launch-device`, flag-locked objects) and in hash or array form (R2 m5): the server delivers
  those rewards itself;
- any subtree under `eventMappings`: npc-manager.js never runs a give_item (R2 m2);
- `startItemsInInventory`;
- always-allowed and decor types (`notepad`, `DECOR_CUP_TYPES`), which never need a lookup.

A give_item with an identified `item` hash anywhere else (an eventMapping, an authoring scratch
block) is not a grant, and the validator errors on it, naming the path (R2 m2). Allowlisting
only executed paths means nothing the engine never hands out can be claimed. A give_item whose
item has no identity is not a grant and keeps today's world-object rule (§6.3, Q2).

`Game#declared_grants` memoises `DeclaredGrants.for(scenario_data)` per instance. No cache
across requests: the scenario is a per-game snapshot rendered at create, `inventory` already
loads it, and the walk is a few hundred nodes. `held_grant_items` is **not** memoised: the
`container` action calls `@game.reload` and the inventory changes per request (R2 §3.4). Games
created before the change get grants from their stored snapshot, but their snapshot still holds
the twin and an item without `contents`, so they keep working through the room-object lookups
(§2.3) until a New Session renders a fresh snapshot (Reset keeps the old `scenario_data`).

### 2.2 Matching a claim

`validate_item_collectible` (`games_controller.rb:1784`) gets one new step after the
start-items check (~`:1807–1815`) and before `find_accessible_item` (called ~`:1818`):

- Only when the add names no NPC (`source_npc_id` blank). An NPC-named add keeps the NPC rule,
  so `record_npc_gift!` stays right. `applyActions` sprites never carry `sourceNpcId`.
- Find the declared grants with
  `ItemIdentity.addressed_by?(grant['item'], item['type'], item_id, item['name'])`, where
  `item_id` is `identity_candidates(item).first` as the method already computes (`:1789`).
  This is the **full identity rule**, the same as every other lookup: a claim with an id must
  share an id with the grant; a claim with **no id** matches on the name. That closes R1 B1:
  a name-only claim for a granted item is decided here, by the grant, and never falls through
  to a twin or another object.
- If one matches: accept, set `@collectible_location = { type: 'grant', path: grant['path'] }`
  and remember `@granted_item = grant['item']`. No room, container, trigger or takeable check:
  the reward is not in a room, and the scenario declaring it is the permission.
- If none matches: today's path, unchanged.
- Two grants with the same identity: the first in walk order wins. The validator makes this an
  error (§4.3).
- The grant step runs before `find_accessible_item`, so a grant that shares a type and identity
  with a gated holder (a flag-station or NPC `itemsHeld` entry, a key in a locked room) would
  make that item free and skip its gate (R2 M2). The server does not try to detect this; the
  validator errors on any such collision against every holder it collects (§4.3), and the same
  for a grant whose type and name equal an id-less holder's, which would otherwise divert that
  holder's honest pickup to the grant (R2 m3).

On accept, `inventory` stores **the scenario's copy**, not the client's hash. The M6 fix
(37701964a) already does this for every add: `canonical_inventory_item` (`:1770`) deep-copies
`@collectible_item` (set by `validate_item_collectible`) and runs
`filter_requires_and_contents_recursive`. So the grant step sets
`@collectible_item = grant['item']`, and `canonical_inventory_item` gains one rule: a grant
copy also loses `contents` (keeping `hasContents: true`). That rule is needed because the
filter only drops `contents` from **locked** objects, the opener is `locked: false`, and the
stored inventory goes back to the client in every `inventory` response and in
`playerInventory`. The stored copy has the grant's id, so a name-only claim ends up stored with
the right id and the opener's lookups (which key on id) work.

The log line names the grant path. There is no `grantsClaimed` key, no `grant_source`, no
`trigger_globals` and no 409: a declared grant is claimable whenever it is asked for, and a
repeat while held is already a 200 through the `:971` short cut (`Game#inventory_includes?`,
id match, else type plus name).

### 2.3 Contents from the granted item

A grant item may carry `contents` (and nested locked items) directly, as the twins do now. The
three lookups in §1.2 step 8 each get the same fallback, **after** the room-object search, so
any scenario whose twin is still in place behaves exactly as today:

| Lookup | Where | Fallback |
|---|---|---|
| unlock target (`method: 'unlocked'` for the opener, `password` for the nested archive) | `Game#find_scenario_object` (`game.rb` ~1285) | search `held_grant_items` with `find_object_in_contents` |
| unlock response contents | `GamesController#find_object_in_scenario` (`:1672`) | search `held_grant_items` with `find_object_in_object` |
| container fetch | `GamesController#find_container_in_scenario` (`:1641`) | `find_container_recursive(held_grant_items, id)` |

`Game#held_grant_items` returns the declared grant items for which
`ItemIdentity.held_in?(grant_item, player_state['inventory'])` holds (R1 M3: held, not "was
once claimed"). So:

- **Before the claim** the granted container does not exist as far as the server is concerned:
  `POST /unlock` on its id fails ("Object not found"), `GET /container/<id>` is a 404, and the
  nested archive cannot be unlocked. Today the twin answers all three with no item at all.
- **While held** all three work as they do now with the twin. `check_container_unlocked`
  (`:1706`) needs no change: the opener's `POST /unlock` puts the id in `unlockedObjects`
  (`unlock_object!`, `:901`) before the container fetch, exactly as with the twin.
- **After the item leaves the inventory** (`remove`, reset): `validate_unlock` still returns
  true for an id already in `unlockedObjects` (~1131), but both content lookups return nil, so
  the response has no contents and the container fetch is a 404.

Contents served this way go through the same filters as room contents:
`filter_container_contents` (`:1715`) on the container fetch and, since the M7 fix
(cd9abc187), on the unlock response too (`:913–916`). So the nested archive's `requires` never
leaves the server.

**The scenario JSON must not ship the contents.** Moving `contents` into the timer's `item`
puts them in `scenario_data['timers']`, and the bootstrap (`GamesController#scenario`, `:267`,
`Game#filtered_scenario_for_bootstrap` `game.rb:790`) sends timers to the client. Its
`filter_requires_recursive` (`:1572`) strips `requires` but not unlocked `contents`, so without
a change the payroll file and the archive's own files would be readable from the first second.
The strip goes inside the two filters rather than the two payload builders (R2 m4):
`filter_requires_recursive` (controller, run on the bootstrap) and
`filter_requires_and_contents_recursive` (`Game`, run on room payloads, container contents,
the unlock response and the stored inventory copy) both call
`DeclaredGrants.strip_grant_contents!` on any `{ type: 'give_item', item: <identified> }` hash
they meet, which deletes `item.contents` and sets `item.hasContents: true`. Every route that
filters inherits it. The client never needs the contents: the opener's contents always come
from the server (`unlock-system.js` copies the unlock response into `scenarioData.contents`,
then `container-minigame.js` fetches).

### 2.4 Save, reload and reset

- Reload: the inventory comes back from the server in `playerInventory` (`:373–374`), now the
  stored scenario copy; `_restoredFromSave` skips the POST (`inventory.js:454`). The opener is
  held, so all three lookups answer. `scenarioClock.timers.fired` stops the timer firing again.
- Reset: `reset_player_state!` (`game.rb:89`) keeps only listed keys, so the inventory and
  `scenarioClock` go. The opener is gone and its contents stop being served; the timer can fire
  again once the trigger is re-earned. Nothing new to clear.
- A game created before the change keeps its old snapshot, through Reset too, until a New
  Session (`new_session`) renders a fresh one: twin present, item without contents. The grant
  step accepts the claim (the old item has an id) and stores the timer item; the room lookups
  find the twin. Unchanged behaviour.

### 2.5 Lost-grant retry (client)

Today a give that fails on the network is lost for good, because `_fireTimer` marks the timer
fired regardless (§1.2 step 3). There is no server-side `pendingGrants` (R1 M5): the client
retries.

- `applyActions` (`apply-actions.js:72`) returns an array of the `addToInventory` promises it
  started for give_item actions (empty for everything else). Other callers ignore the return
  value, as they do now.
- `applyActions` returns `[]` on its early return for an empty or missing list (R2 m6).
- `_fireTimer` (`scenario-timer-dispatcher.js:202`) runs `setGlobal` and the actions once as
  now, but adds the id to `firedTimers` only when every give has settled with anything other
  than `reason: 'error'` (`ok: true`, `'already'`, `'rejected'`, `'invalid'`, `'no-ui'`), so a
  timer cannot sit in flight for ever. An `_inFlight` set stops `update()` firing it again
  meanwhile.
- A give that settles with `reason: 'error'` is retried on its own (the give_item action only,
  not the timer's other actions) after 1 s, 3 s and 10 s. After the third retry fails the timer
  is **left unfired** (R2 m6): it stays out of `firedTimers` and in `_inFlight`, so this page
  stops retrying, but `exportState` still lists it under `started`, and the next load re-fires
  it once the server is back. No loop, and no reward lost to an outage. Pending retry timeouts
  are cleared in `destroy()`.
- A refusal is not retried: a declared grant is refused only if the scenario is wrong, which
  the validator catches.
- If the page closes mid-flight, the id is not in the synced `fired` list. On reload the global
  is restored, the dispatcher restarts the timer (`:81–90`, `alreadySet`) and the give is sent
  again; an item that did arrive is a 200 through `:971`. Caveat: a timer with other actions
  besides the give would re-run them in that case. Neither lab's grant timer has any, and the
  validator warns when a give_item timer has other actions (§4.3).

### 2.6 What this design does not do

- **No trigger check.** See §1.4. Checking waits for server-established triggers (§6.3, Q3),
  and then the server-verified rows of the first draft's trigger table (flag submitted, room or
  object unlocked, validated task) are the right design.
- No `grant_source`, `trigger_globals`, 409 codes, sync-and-retry, Ruby condition evaluator,
  `pendingGrants` or `grantsClaimed` (R1 M1, M4, M5, m3, m5, m7).
- No once-only rule. Claiming again after dropping the opener is accepted; it is the same free
  claim.
- Ink `#give_item` is unchanged (NPC `itemsHeld` plus `encounteredNPCs` already declare it).
- eventMappings still cannot give items. "Mapping sets a global, timer with `startOnGlobal`
  gives" stays the pattern.

### 2.7 Files touched

- `lib/break_escape/declared_grants.rb` (new): walk, identity, `strip_grant_contents!`, plain
  Ruby.
- `app/models/break_escape/game.rb`: `declared_grants`, `held_grant_items`, the
  `find_scenario_object` fallback, the strip in `filter_requires_and_contents_recursive`.
- `app/controllers/break_escape/games_controller.rb`: the grant step in
  `validate_item_collectible`, the contents strip in `canonical_inventory_item`, the strip in
  `filter_requires_recursive`, the `find_object_in_scenario` and `find_container_in_scenario`
  fallbacks.
- `public/break_escape/js/systems/apply-actions.js`: return the give promises.
- `public/break_escape/js/ui/scenario-timer-dispatcher.js`: await them, retry on error.
- `scripts/validate_scenario.rb`: §4.3, plus `check_item_fields` and `check_item_type` over each
  grant item and its contents (R2 M1).
- `scripts/generate_dungeon_graph.rb`: a node per declared grant, its contents walked (R2 M1).
- Both lab scenarios: §4.2.
- No new static imports. If one is added, update every node harness copy list (`bin/test-js`
  runs plain node).
- M6, M7 and the flag-station fix are all committed (e5a401bdc); `app/` was clean at review R2.
  Commit in small steps with explicit paths.

## 3. Threat model

"Modified client" means someone using the browser console or a proxy to send their own
requests with their own session.

### 3.1 Today (with M6 and M7 committed)

- **Claim a twin early.** One POST to `/inventory` with `{ type: 'pc', id: 'records_remote_session' }`,
  or with the name and no id (R1 B1), adds the physical lab's reward from the first second of
  the game: open_plan has no room lock, and a room with no `locked` key passes the priority 2
  check. In the SE lab the same POST for `sofia_remote` works as soon as `operations_room` (key
  lock `operations_door`) is unlocked. In honest play that room is always open before the phish
  (the only mail client is inside it, R1 §7), so the room gate only stops a cheat who has not
  yet found the key.
- **Read the twin's files with no request at all** (R2 §5 item 5). Both twins are
  `locked: false`, and `filter_requires_and_contents_recursive` drops `contents` only from locked
  objects, so every load of `open_plan` or `operations_room` already ships the twin's files (the
  archive arrives without `requires` or `contents`).
- **Read the twin's contents without the item.** The twin is `locked:false`, so
  `POST /unlock` `{ targetType: 'object', targetId: 'sofia_remote', method: 'unlocked' }`
  succeeds with no room and no item ("Object is unlocked in scenario data"), and
  `GET /container/sofia_remote` then serves the contents. Since M7 the nested archive's password
  is no longer in the response; the archive itself still needs it.
- **Inject fields:** closed by M6 (37701964a).
- **Flag-station items without the flag:** closed by e5a401bdc (R1 m1).

### 3.2 After this change

- **Claim a declared grant at any time:** accepted, one request, in both labs. The physical lab
  is unchanged. The SE lab loses its room gate, which honest play never meets (above). This is
  the honest limit of the design: **a declared reward is not cheat-resistant**. Both rewards are
  flavour openers. The SE lab's archive is the only content behind one, it still needs its
  password, and the optional task it completes (`archive_opened`) follows a client global, so it
  could be forged anyway. §6.3 Q1 keeps the SE room gate if the user wants it.
- **Name-only claim of a granted item:** decided by the grant rule (full `addressed_by?`), and
  the stored item is the scenario's copy with its id. Nothing falls through to another object.
- **Undeclared item, wrong id, wrong type:** refused as today. A claim with an id must share it
  with the grant; a claim whose id is wrong does not fall back to the name.
- **Read a granted container's contents without the item:** closed. With the twin gone the
  three lookups find the container only through a held grant item (§2.3), so before the claim
  every path is "not found". This is stricter than today, where `method: 'unlocked'` on the
  twin opens it with no item at all. The cost to a cheat is one extra request (claim, then
  open), but contents are now tied to holding the item, and dropping it ends access.
- **Read the contents from the scenario JSON:** closed by `strip_contents!` on the bootstrap
  and room payloads (§2.3). This must ship in the same commit as moving the contents, or the
  move opens a hole that is wider than today's.
- **Field injection on grants:** closed (the scenario copy is stored, M6 plus the contents
  strip).

### 3.3 New exposure introduced

- A declared grant bypasses room, container and takeable checks by design: the reward is not in
  a room. It is limited to items the scenario itself hands out from client-side actions,
  identified by id (or, for an id-less claim, by name against those items only).
- An author who puts a valuable item (a key, a keycard) in a client-side give_item makes it
  claimable from the first second. That is true today for any twin in an open room, too. The
  validator warns when a declared grant carries `opens_lock` or is a type the lock checks read
  (`key`, `keycard`, `lockpick`, `rfid_cloner`), so the author sees it (§4.3).
- A room object that shares a grant's id wins the content lookups (room first). The validator
  errors on that (§4.3).
- A grant that shares a type and identity with any gated holder (flag-station or NPC
  `itemsHeld`, a key or item in a locked room or container) makes that item claimable without
  its gate, because the grant step runs first (R2 M2). The server behaviour stays as planned;
  the validator errors on every such collision, naming the gate the grant would bypass (§4.3).

### 3.4 Later: cheat resistance (Q3)

A trigger check is worth adding once the trigger is something the server establishes: for
example the BadUSB use recorded through an endpoint that checks the device is held and the
target room is unlocked, or the mail runner's delivery of the exe reply marking the foothold
server-side, as it already encounters a headless NPC. Then a grant can name its trigger
(`grantAfter: { flag | room | object | task }`), checked against server state only, and the
first draft's server-verified trigger kinds are the design. Client globals stay unchecked.

## 4. Migration

### 4.1 Scenarios using twins today

Found by searching every `scenarios/**/scenario.json.erb` (and `test/`) for `"give_item"` with
an `item` hash and for `"active": false`, rechecked on 2026-11-05:

| Scenario | Grant | Trigger | Twin |
|---|---|---|---|
| lab_physical_pentest | timer `grant_remote_session` (`scenario.json.erb:158–178`), item `pc` / `records_remote_session`, no `contents` | `startOnGlobal: kp_usb_foothold`, set by the `npc_used:usb_target_pc` mapping (`:612–619`) | open_plan object `:912–938` (F11 comment `:909–911`), with two text files in `contents` |
| lab_social_engineering | timer `grant_remote_session` (`:167–182`), item `pc` / `sofia_remote`, no `contents` | `startOnGlobal: phish_lord_foothold`, set by `ink/lord_mail.ink:43` | operations_room object `:1795–1871`, with three text files and the locked `sofia_archive` (password, one text file) in `contents` |

No other scenario has a give_item with an `item` hash or an `active:false` object. Flag-reward
give_items (m02, m03, m06, m07, secgen_vm_lab) name the item by `item_name`/`item_type`, are
server-delivered, need no twin and are excluded from grants. `test/models/break_escape/game_test.rb`
(~216) has an inline `sofia_remote` room object for the nested-archive unlock test; it tests the
room path and stays as it is.

### 4.2 Removing the twins (same change as the server code)

For each lab, in one commit with the server change:

1. Move the twin's `contents` array, unchanged, into the timer's `item`. Keep `id`, `type`,
   `name`, `hasContents: true`, `locked: false`, `observations`.
2. Delete the twin object and its comments (physical `:909–938`; SE `:1795–1871`).
3. Rewrite the comments that describe the pairing: physical F11 at `:164–168`; SE header at
   `:158–166`, `:289` and `:906–909` (R2 m8); the stale code comment at
   `public/break_escape/js/systems/interactions.js:1488` (it describes `sofia_remote` as a room
   object gated by `requiresGlobal`).
4. Leave the SE lab's `foothold.containerId: "sofia_remote"` capture descriptor (`:911`) alone:
   nothing reads `containerId` (grep), and the id does not change.
5. Run the validator on both and regenerate both dungeon graphs. The regenerated graphs must
   still show the Remote Session node and, for the SE lab, the `payroll_backup.zip` password
   lock (R2 M1). `lab_physical_pentest`'s `dungeon_graph.*` may carry someone else's uncommitted
   edits in the shared tree: stage only the scenario file and the regenerated graph after
   checking the diff is ours.
6. `lab_physical_pentest/EXPANSION_PLAN.md` plans to move and "repoint" `records_remote_session`
   in the open-plan resize (R2 m8). Whichever of the two lands second drops that step; the
   migration adds a line to the expansion plan's "Changes after review" notes saying the twin no
   longer exists.

The twin path stays valid in the engine. A scenario that still pairs a hidden object with an
id-less give_item works as today; the validator nudges it towards an id.

### 4.3 Validator: how `check_give_item_collectible` changes

`check_give_item_collectible` is committed (65513244e, `scripts/validate_scenario.rb:2035`,
walk `:2072–2110`, tests `test/js/validator-give-item-collectible.test.mjs`). Today it ERRORs when no takeable object
shares a give_item's type and identity, and WARNs when the only match is behind a locked room or
container (the false positive R1 §7 traced for the SE lab). It changes to:

1. Use `DeclaredGrants.for` (`require_relative '../lib/break_escape/declared_grants'`) to decide
   which give_items are declared grants, so the server and the validator agree. Start items,
   notepad and decor cups are skipped as now. Flag rewards are now skipped explicitly (any
   subtree under `flagRewards`); until now they passed only because none carries an `item` hash
   (R2 §5 item 7).
1a. ERROR on a give_item with an identified `item` hash that is not on an executed path
   (`DeclaredGrants.unexecuted`), for example under `eventMappings`, naming the path: the engine
   never runs it, so the reward never arrives (R2 m2).
2. **Declared grant: no twin needed.** Drop the "no matching object" ERROR and the locked-room
   WARNING for it. Instead check it is well formed and its contents exist:
   - ERROR if `hasContents: true` and `contents` is missing, not an array, or empty: the opener
     would show an empty desktop or "not found".
   - ERROR if a `contents` entry (at any depth) is not a hash with a string `type`.
   - ERROR if a nested entry has `locked: true` and a `lockType` of `pin`/`password`/`key`
     with no `requires` (or no `opens_lock` key anywhere in the scenario for `key`), and if a
     nested container that is locked has no `id`: its unlock and contents fetch key on the id.
     Reuse the existing lock checks if they can be pointed at the grant's contents rather than
     duplicating them.
   - ERROR if two declared grants share a type and identity but differ in any field: which copy
     is stored would depend on walk order.
   - ERROR if any holder shares the grant's type and identity (R2 M2). Holders are every list
     the validator collects in `holders` (`validate_scenario.rb:2053`), widened to any depth:
     room objects and their nested `contents`, flag-station (and any object's) `itemsHeld`, NPC
     `itemsHeld`. The message names the gate the grant would bypass (locked room, locked
     container, flag station, NPC encounter). For a room object it is the twin left behind after
     migration, and the message says to move its `contents` into the grant and delete it.
   - ERROR if any room object shares an id with an entry in the grant's `contents`: the room
     lookups run first and would answer instead of the grant.
   - ERROR if a grant's type and name equal those of an id-less holder, or of another grant with
     a different identity: an id-less pickup would be decided by the grant step (R2 m3).
   - WARNING if the grant carries `opens_lock`/`keyId`, or its type is one the server's lock
     checks read (`key`, `keycard`, `lockpick`, `rfid_cloner`): it can be claimed from the first
     second (§3.3).
   - WARNING if the give_item sits in a timer that has other actions or a `setGlobal`: a reload
     during the retry re-runs them (§2.5).
3. **give_item with an `item` hash but no identity** (no `id`, `opens_lock`, `key_id`,
   `keyId`): keep today's twin checks for it unchanged, and add a WARNING: "give it an id to make
   it a declared grant and drop the hidden object".
4. Rewrite today's ERROR fix text ("add a takeable, active:false object with the same type and
   id") to "give the item an id; it is then a declared grant and needs no object".

5. Run `check_item_fields` (unknown fields) and `check_item_type` (sprite exists) over each grant
   item and its `contents`, as they run over room objects, start items and `itemsHeld` (R2 M1).

`validator-give-item-collectible.test.mjs` is rewritten, not patched (R2 m7). Five of its seven
cases give an id-bearing item with a matching world object; under the new rules each is a
declared grant whose matching object is the twin-left-behind error. Those cases keep their
meaning with id-less items, and new cases cover each grant rule above.

**Dungeon graph** (R2 M1). `generate_dungeon_graph.rb` walks room objects only, so moving the
contents would drop the SE lab's `payroll_backup.zip` lock and both Remote Session containers
from the map. It gains: for each declared grant, a puzzle-graph item node (attached to the node
for its timer's `startOnGlobal`, or to the start room), with `walk_objects` over its `contents`
so nested locks get their lock nodes; and in the Rooms + Contents tab a "granted" node with its
contents walked by `walk_room_contents`.

## 5. Tests

### 5.1 Rails

New `test/controllers/break_escape/declared_grants_test.rb`, built like `npc_give_test.rb` and
`flag_reward_unlock_door_test.rb`, through the real endpoints (`POST /inventory`, `POST /unlock`,
`GET /container/:id`, `GET /scenario`), not the helpers: per the fix-claims rule, a test of
`find_container_in_scenario` alone is not proof. Inline scenario: a timer grant `pc`/`remote_x`
named "Remote X", `hasContents: true`, with `contents` of a text file and a locked password
container `vault_x` (`requires: "pw"`, one text file), and **no twin**; an open room with a
visible takeable `pc`/`desk_pc`; a key grant with `opens_lock: "side_door"`; a give_item with
an `item` hash inside a flag-station's `flagRewards`; an NPC with `itemsHeld`.

Allow and refuse:
- `{ type: 'pc', id: 'remote_x' }` → 200. The stored item equals the scenario copy without
  `contents` (`hasContents: true`). Fields the client added (`opens_lock`, `scenarioData`,
  `locked: true`, `keyPins`) are absent.
- **Name-only claim against a declared id** `{ type: 'pc', name: 'Remote X' }` → 200, decided by
  the grant rule: the stored item has `id: 'remote_x'` (proves it did not match anything else).
- Key grant claimed by `opens_lock` → 200.
- **Undeclared item** `{ type: 'pc', id: 'nope' }` → 422, inventory unchanged.
- **Wrong id** `{ type: 'pc', id: 'remote_y', name: 'Remote X' }` → 422: an id that does not
  match is not rescued by the name.
- Wrong type `{ type: 'key', id: 'remote_x' }` → 422.
- The flagRewards give_item's item is not a grant: claiming it is decided by the flag-station
  rule (refused without the flag once the separate m1 fix lands).
- An add naming an NPC (`source_npc_id`) with the grant's id → decided by the NPC rule, not the
  grant step.
- Repeat while held → 200 through the `:971` short cut, inventory not duplicated. Claim again
  after `remove` → 200.
- `visible desk_pc` pickup in the open room → 200, unchanged by grants.
- `flagRewards` in hash form and under a `vm-launcher`, and a give_item under an NPC
  `eventMappings`: none is a grant (R2 m2, m5).
- A grant sharing a flag-station `itemsHeld` identity (a scenario the validator rejects): the
  test pins today's server behaviour and the validator error together, so nobody relies on the
  server to catch it (R2 M2).
- An id-bearing claim for an id-less grant name, and the reverse (name-only claim): decided as
  §2.2 says.

Contents served only while held (the opener's real path):
- Before the claim: `POST /unlock` `{ targetType: 'object', targetId: 'remote_x', method: 'unlocked' }`
  → 422; `GET /container/remote_x` → 404; `POST /unlock` on `vault_x` with `pw` → 422.
- After the claim: the `unlocked` unlock → 200 with `contents` holding the text file and
  `vault_x` with **no `requires` and no `contents`** (M7 filter); `GET /container/remote_x` →
  the same; `vault_x` with `pw` → 200, with `wrong` → 422; `GET /container/vault_x` → its text
  file.
- After `remove`: `GET /container/remote_x` and `GET /container/vault_x` → 404; the `unlocked`
  unlock → 200 (already in `unlockedObjects`) but with no `contents` key.
- The scenario JSON: `GET /scenario` holds the timer with `hasContents: true` and **no
  `contents`**, and the response body contains neither the text file's text nor `"pw"`. The
  inventory response and `playerInventory` hold no `contents` either.
- `GET /room/<id>` for a room whose object carries a `triggerOnInteract` grant with `contents`:
  no `contents` in the payload (R2 §6.1).
- `password_case_mismatch?` through the fallback: the nested archive with the right password in
  the wrong case → 422 with `caseMismatch: true` (pins the third `find_scenario_object` caller).

Reload and reset:
- After a claim, `GET /scenario` returns `playerInventory` with the stored copy, and the
  container fetch still works with no further add.
- `reset_player_state!` → inventory empty, `GET /container/remote_x` → 404.

Legacy:
- A scenario with the old twin and an id-carrying grant item without `contents`: the claim is
  accepted by the grant step, the stored copy is the timer item (no `contents`), and all three
  lookups answer from the twin, as today (games created before the change).
- Unchanged and passing: `npc_give_test.rb`, `headless_give_test.rb`,
  `flag_reward_unlock_door_test.rb`, `flag_station_item_claim_test.rb`,
  `game_state_locking_test.rb`, the M6/M7 tests, and the nested-archive test in
  `test/models/break_escape/game_test.rb` (~208).
- Model test for `DeclaredGrants.for` over both labs' rendered JSON (after migration): exactly
  one grant each, with `contents`; and zero grants for m02, m03, m06, m07 and secgen_vm_lab.

### 5.2 Node (`bin/test-js`)

- `applyActions` returns one promise per give_item, an empty array otherwise, and `[]` for an
  empty list.
- Dispatcher: a give resolving `ok: true`, `'already'`, `'rejected'` or `'invalid'` marks the
  timer fired once; `'error'` leaves it unfired, retries the give alone at 1 s, 3 s and 10 s
  (fake clock), and after the third retry fails leaves it unfired and stops; `update()` does not
  re-fire while in flight; the timer's other actions run once; `destroy()` cancels a pending
  retry.
- Validator: the executed-path error (eventMapping give_item), the holder collision errors, the
  name collision error, the field and sprite checks on grant contents. Graph generator: a grant
  node and the nested archive's lock node appear.
- Reload mid-flight: a restored clock without the id in `fired` and the global true → the timer
  fires again and sends the give.
- `inventory-restore-no-revalidate.test.mjs` and `scenario-timer-countdown.test.mjs` unchanged
  and passing.
- Validator: `validator-give-item-collectible.test.mjs` updated as in §4.3.

### 5.3 Live checks (commit first; keyless server per the playtest memory notes)

Drive with the `window.__test` bridge (playtest-scenario skill), on a fresh game for each lab:

- **lab_physical_pentest, remote-session reward:** before the BadUSB beat, a console
  `GET /container/records_remote_session` → 404 (no twin, not held). Play the beat
  (`usb_target_pc` used with `tag_deviceB`, `kp_usb_foothold` set) → the "Remote Session —
  LW-RECORDS-02" opener appears within a second. Open it → both text files show. Reload → the
  opener is still there and opens. Check the server log line names the grant path.
- **lab_social_engineering, remote-session reward:** before the phish, a console
  `GET /container/sofia_remote` → 404. Run the Lord phish to `phish_lord_foothold` → the
  "Remote Session — LW-FIN-07" opener appears. Open it → three files and the archive. Unlock
  `payroll_backup.zip` with the portal password → `personal_banking.txt` reads and the optional
  `archive_opened` task completes. Reload, open the opener and the archive again.
- **Lost grant:** in either lab, block `/inventory` (devtools request blocking or a `fetch`
  stub through the bridge) as the timer fires, unblock within 10 s → the opener arrives from
  the retry. Repeat with a reload while blocked → the opener arrives after the reload. Block for
  longer than the retry window, then reload with the server back → the opener arrives (R2 §6.2).
- **Graph:** after the SE run, regenerate the graph and confirm the `payroll_backup.zip` lock and
  the Remote Session node are still drawn (R2 M1).
- **Documented, not a failure:** a console POST of the opener's add before the beat is accepted
  in both labs (§3.2). Say so in the commit message so nobody files it as a regression.

## 6. Size, risks, open questions

### 6.1 Size

| Part | Lines (approx.) |
|---|---|
| `lib/break_escape/declared_grants.rb` (walk, `strip_contents!`) | 50 |
| Grant step in `validate_item_collectible`, contents strip in `canonical_inventory_item` | 25 |
| `held_grant_items` and the three lookup fallbacks | 40 |
| `strip_contents!` in the bootstrap and room payloads | 10 |
| Client: `applyActions` return, dispatcher await and retry | 35 |
| Validator rule change, executed paths, collisions, field/sprite walks (net) | 120 |
| Dungeon-graph grant nodes | 25 |
| Scenario migration (contents moved, twins and comments deleted) | about −60 net |
| **Code** | **~300** |
| Rails, node and validator tests | ~330 |
| **Total** | **~600–650 changed lines** |

About a day end to end with the two live checks (R2 m9). The first draft was ~700 lines for
phase 1 and ~300 more for phase 2, and kept the twins until then.

### 6.2 Risks

- **Moving contents without stripping them** from the bootstrap would publish the SE lab's
  payroll and archive files to every player from the first second. The strip, its test and the
  migration go in one commit.
- **Concurrent edits.** The flag-station fix is committed (e5a401bdc). Other agents still edit
  engine JS and the lab scenarios in the shared tree: re-read before editing, stage explicit
  paths and check `git diff --cached --stat`.
- **Retry noise.** Each failed attempt still shows `inventory.js`'s "Network error" alert
  (`:496–498`). The first POST plus three retries is four alerts in about 14 s on a dead
  network (R2 m6); tolerable, and a `quiet` option on `addToInventory` is a later nicety.
- **Older games** keep the twin from their snapshot and work as today. A restarted game picks up
  the new snapshot. Nothing to migrate in the database.
- **Expectations.** Neither reward is cheat-resistant after this change, and the SE lab's
  opener loses a room gate honest play never meets. Say this in the commit message.

### 6.3 Open questions, with recommended defaults

1. **Keep the SE lab's room gate?** An optional `"grantAfterRoom": "operations_room"` on the
   give_item, checked against `unlockedRooms`, would restore today's gate with no trigger
   evaluator (R1 §4). Default: no. Honest play always has the room open first, and the gate
   only slows a cheat who has not found the key.
2. **Allow id-less grants (name only)?** `addressed_by?` would match them by name, but names are
   not unique and `held_in?`/`inventory_includes?` fall back to name too. Default: no. A
   give_item needs an `id` (or `opens_lock`) to be a declared grant; without one it keeps the
   world-object rule and the validator asks for an id.
3. **Trigger checks: when?** Default: not in this work. Add a backlog entry to
   `docs/IDEAS_BACKLOG.md` for server-established lab triggers (§3.4), and ask the user whether
   the labs need cheat resistance at all before planning it.
4. **Retry policy.** Default: three retries at 1 s, 3 s and 10 s, network errors only; then
   leave the timer unfired and stop retrying on this page, so the next load tries again (R2 m6).
5. **Contents gate: held, or ever claimed?** Default: held (`ItemIdentity.held_in?`). Dropping
   the opener ends access to its contents; claiming it again restores it.
6. **Ink `#give_item` and eventMapping give_item.** Default: unchanged. Ink gifts are declared by
   NPC `itemsHeld`; mappings keep "set a global, a timer gives".

## 7. Changes after review R1

The user chose the reviewer's simpler design (R1 §4). Each finding's outcome:

| Finding | Outcome |
|---|---|
| **B1** name-only claim skips the grant rule and matches the twin | Fixed. The grant step uses the full `ItemIdentity.addressed_by?` rule, name included when the claim has no id (§2.2), and the twins are deleted. The test now asserts a name-only claim is decided by the grant and stored with the grant's id (§5.1). |
| **M1** the trigger check certifies itself | Accepted. No trigger check in this work (§1.4, §2.6); trigger checks wait for server-established triggers (§3.4, Q3). |
| **M2** phase 1 keeps the twins | Accepted. Grant-held contents and twin removal are in the same change (§2.3, §4.2). No phase 2. |
| **M3** phase 2 lookup list incomplete | Fixed. All three lookups (`Game#find_scenario_object`, `find_object_in_scenario`, `find_container_in_scenario`) fall back to grant items, gated on `held_in?` (§2.3). |
| **M4** over-built for its users | Accepted. Condition evaluator, `created_at` rule, interact anchor, `grant_source`, `trigger_globals`, 409 and sync-retry dropped. ~700 + ~300 lines became ~500 in one change (§6.1). |
| **M5** `pendingGrants` undefined for interact grants | Dropped; replaced by the client-side retry (§2.5). |
| **M6** field injection is a lock bypass | Out of scope; landed separately as 37701964a. The grant path reuses its `canonical_inventory_item` and adds the contents strip (§2.2). |
| **M7** unlock response leaks nested lock answers | Out of scope; landed separately as cd9abc187. Grant contents go through the same filter (§2.3). |
| **m1** flag-station check is not "a few lines" | Out of scope; landed as e5a401bdc. `flagRewards` subtrees on any parent are excluded from grants, and the validator errors on a grant that shares a flag-station item's identity, so the allowlist cannot undo it (§2.1, §4.3, R2 M2). |
| **m2** walk misses esd-pushbutton sources | Fixed. Every give_item with an identified `item` hash outside `flagRewards` is a grant, the validator's own rule, shared through `lib/break_escape/declared_grants.rb` (§2.1, §4.3). |
| **m3** 409 retry dead code, alert noise | Moot: no 409. Network-error retries keep the existing alert (§6.2). |
| **m4** once-only interact grants alert on every later interaction | Moot: no once-only rule (§2.6). |
| **m5** `grant_source` adds nothing | Dropped. |
| **m6** reset | Covered (§2.4): reset clears the inventory, so contents stop being served; `created_at` no longer matters. |
| **m7** condition grammar parity | Moot: no Ruby evaluator. |
| **m8 / R1 §8** stale details | Fixed: route is `GET /container/:container_id`; the opener's `POST /unlock` and its response are the other two lookups; the fired list is `scenarioClock.timers.fired`; field injection was not limited to real objects (now closed by M6); esd source added; `check_give_item_collectible` is committed (65513244e); twin line numbers updated (physical twin now `:909–938`); the "33 call sites" count removed. |
| **R1 §7** SE lab locked-room warning | Goes away: declared grants no longer need a world object, so the validator's locked-room warning does not apply to them (§4.3). |
| **R1 Q table** | Q1, Q2, Q5, Q6, Q7 moot or settled as above; Q3 and Q9 kept (§6.3 Q6); Q4 separate; Q8 becomes §6.3 Q3. |

## 8. Changes after review R2

Review R2 (`DECLARED_GRANTS_PLAN_REVIEW_R2.md`): revise lightly, then build; 0 blocker, 2 major,
9 minor. Every finding was checked against the tree on 2026-11-06 before folding.

| Finding | Checked | Outcome |
|---|---|---|
| **M1** graph and room-only validator checks lose the moved contents | `generate_dungeon_graph.rb` `walk_objects` (`:152`) and `walk_room_contents` (`:970`) take room objects, start items and NPC `itemsHeld` only; `check_item_fields` (`validate_scenario.rb:511`) and `check_item_type` (`:2178`) the same | Folded. The generator adds grant nodes and walks their contents; the validator runs both checks over grants (§2.7, §4.2 step 5, §4.3 rule 5, §5.2) |
| **M2** a grant sharing a gated holder's identity bypasses the gate | Grant step precedes `find_accessible_item` (`games_controller.rb:1818`); `holders` (`validate_scenario.rb:2053`) is the list to check | Folded. Validator ERROR against every holder at any depth, naming the gate; server unchanged (§2.2, §3.3, §4.3) |
| **m1** shared module cannot call `ItemIdentity`; `keyId` disagreement | `ItemIdentity` uses `blank?`/`present?`; `identity_candidates` omits `keyId`, `addressed_by?` and the validator include it | Folded. `DeclaredGrants` has its own plain-Ruby `identities` (id, opens_lock, key_id, keyId), the set `addressed_by?` reads on the scenario side; `ItemIdentity` is not changed (§2.1) |
| **m2** eventMapping give_items become grants nobody receives | npc-manager.js has no give_item | Folded, one step further than suggested: the server counts only executed paths as grants, and the validator errors on identified give_items elsewhere (§2.1, §4.3 rule 1a) |
| **m3** name collisions divert an honest pickup | as described | Folded as a validator ERROR (§4.3) |
| **m4** strip lives in two builders, not the filters | `filter_container_contents` and `canonical_inventory_item` go through `filter_requires_and_contents_recursive` | Folded. The strip runs inside both filters (§2.3) |
| **m5** `flagRewards` exclusion must be a subtree rule for any parent | `vm-launcher` and flag-locked objects carry `flagRewards`; hash and array forms | Folded (§2.1, §5.1) |
| **m6** retry details | `applyActions` early return is `undefined`; `'invalid'` and `'no-ui'` exist; four alerts | Folded. Unfired on final failure, everything but `'error'` settles, `[]` on empty, `destroy()` clears retries (§2.5, §6.2, §6.3 Q4) |
| **m7** validator test churn | five of seven cases are id-bearing | Folded: the file is rewritten (§4.3) |
| **m8** migration completeness | `EXPANSION_PLAN.md` repoint; SE comment `:906–909` | Folded (§4.2 steps 3 and 6) |
| **m9** size | — | Folded: ~600–650 lines (§6.1) |
| §5 stale items 1–11 | — | Fixed in §0, §2.1, §2.4, §2.7, §3.1, §4.3, §5.1, §6.2, §7 |
