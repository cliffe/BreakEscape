# NPC Needs System (Sims-lite) — Design Contract

Status: **design locked 2026-11-04; partly implemented** (section 15 lists what
exists and what is left). This document is the contract for three roles:

- **Engine implementer** builds the generic system (sections 1–11, 14–15).
- **Cyber Security agent** builds device behaviour and captures against the hooks
  in section 13 only, without touching the generic engine.
- **Scenario author** wires the demo lab from section 12.

The generic system is cyber-neutral. It moves NPCs, moves items, and emits generic
events. It never knows what an item *is* or what using an object *reveals*.

Field names marked **(prov.)** were invented for this system. Rename them in the
engine, schema, validator and this doc together, or not at all.

---

## 1. Model in one paragraph

NPCs that opt in carry **needs** that decay over game time and **interests** in
tagged items. Objects advertise **affordances**: which need they satisfy, how much
they restore, how long a use takes, how many NPCs fit, and which item tags they
**accept**. At each fixed tick an idle NPC scores its options: an urgent need with
a reachable free affordance, or a reachable item whose tag it is interested in.
It takes the best, walks there, uses it (or picks the item up and carries it to an
accepting object, then uses it), and walks back to its post (`needsHome`). With no
option it **holds still**. Idle NPCs never wander and never search.

Rules that hold throughout:

1. **Opt-in.** An NPC with no `needs` and no `interests` runs exactly today's code.
2. **No idle wandering, no searching.** No option → stand still.
3. **Stillness.** A needs NPC stays put when the player walks up, unless it is
   heading somewhere because an option won (urgent need or present item).
4. **Conversation freezes** the NPC being talked to, even mid-walk and even if a
   need turns urgent; it resumes afterwards. Other needs NPCs carry on.
5. **Scripts win.** Any scripted move suspends needs for that NPC (section 8).
6. **Deterministic.** Same seed + same inputs → same decision log (section 9).
7. **Objects carry no content.** Anything an NPC "supplies" when it uses an
   object lives on the NPC (`usePayload`), never on the object.

---

## 2. Engine facts this builds on (checked 2026-11-04)

| Fact | Where |
|---|---|
| `goToAndStay(worldX, worldY, speed)` sets one waypoint, `patrol.enabled = true`, `_stopOnArrival = true` | `systems/npc-behavior.js` `goToAndStay` |
| Arrival (`_triggerGoToStayArrival`) disables patrol, resets `homePosition`, emits `npc_arrived:<npcId>` once. No automatic resume | same |
| Paths use `pathfindingManager.findWorldPath` (unified grid), so world targets in other **loaded** rooms route through **open** doors | `npc-behavior.js` patrol, `systems/npc-pathfinding.js` `findWorldPath` |
| Locked doors are not walkable; `openDoor` marks the door walkable and destroys the door sprite. **Doors never re-close** | `systems/doors.js` `openDoor` |
| A `goToAndStay` move never pauses for the player (`!this._stopOnArrival` guard) | `npc-behavior.js` `determineState` |
| Every sprite NPC gets a behaviour, even with no `behavior` block; patrol is off by default | `core/rooms.js` (`registerBehavior(..., npc.behavior \|\| {})`), `parseConfig` |
| NPC records are built by `registerNPC(npcDef)` with `Object.assign`, so extra scenario fields (`needs`, `usePayload`…) arrive on the record. NPCs register lazily per room | `systems/npc-manager.js` `registerNPC`, `systems/npc-lazy-loader.js` |
| `patrolOverride` reads only `targetTile` (current-room relative) and `speed`; `stopOnArrival` is ignored | `npc-manager.js` `_handleEventMapping` |
| eventMappings match `eventPattern` exactly; the dispatcher also supports `prefix*` listeners (called with `(data, eventName)`) | `npc-manager.js`, `systems/npc-events.js` |
| Mapping `condition` strings can test event-data keys (`value === true`) and `globalVars.x` | `npc-manager.js` `safeEvaluateCondition` |
| Behaviour manager ticks every 50 ms; all NPCs freeze while the player is on the VM (`window.isVmContextActive`) | `npc-behavior.js` `update`, `freezeAll` |
| `gameClock.elapsedMs()` = wall time since start minus closed time; survives reload; never pauses; `rate`/`anchors` change only time of day | `systems/game-clock.js` |
| Objects live at `window.rooms[roomId].objects[<scenario id>]` once their room is loaded | `core/rooms.js` |
| Person-chat sets `window.currentConversationNPCId` (and swaps it briefly around nested calls) and emits `conversation_closed:<npcId>` on close | `minigames/person-chat/person-chat-minigame.js` |
| Inventory clicks go to `handleObjectInteraction(itemImg)`; inventory items have `scenarioData.takeable = false`; `removeFromInventory` does not sync to the server | `systems/inventory.js`, `systems/interactions.js` |
| NPC KO drops already create a world item sprite and register it in `room.objects` (pattern reused by the player drop) | `systems/npc-hostile.js` drop code |

---

## 3. Scenario schema

### 3.1 NPC fields

```json
{
  "id": "clerk",
  "needsHome": "clerk_pc",
  "needs": {
    "caffeine": { "decayPerMin": 10, "urgentAt": 30, "initial": 55, "maxUnmetMin": 5 },
    "work":     { "decayPerMin": 6,  "urgentAt": 50, "initial": 80 }
  },
  "interests": { "found_item": { "weight": 3, "noticeRooms": ["office"] } },
  "usePayload": { "any": "JSON value, opaque to the engine" },
  "onUse": { "clerk_pc": { "setGlobal": "clerk_used_pc", "emitEvent": "clerk_at_pc" } },
  "needsSpeed": 90
}
```

`needs` and `interests` are top-level NPC fields beside `behavior`. An NPC with
`behavior.patrol.enabled: true` must not also declare them (validator error).

**Need** (key = need name, any string, matched against `affordance.satisfies`):

| Field | Bounds | Default | Meaning |
|---|---|---|---|
| `decayPerMin` | >0, ≤600 | required | Level points lost per needs-clock minute |
| `urgentAt` | 1–99 | required | Level at or below which the need is urgent |
| `initial` (prov.) | 0–100 | 100 | Level at start and after a reload. Sets when the first beat happens |
| `weight` (prov.) | 0.1–10 | 1 | Scales the need's score |
| `maxUnmetMin` (prov.) | >0 | none | Starvation guard: this long since last satisfied → wins outright |
| `jitterPct` (prov.) | 0–50 | 0 | Seeded ± spread on `initial` and each top-up |

Levels are clamped to 0–100; 100 = fully satisfied.

**Interest** (key = item tag) (prov.): a number (the weight) or
`{ "weight": 0.1–10, "noticeRooms": [roomId…] }`. `noticeRooms` defaults to the
room of `needsHome`. An interest has **no level and no decay**. It produces an
option only while a matching item is present (section 5.2).

**Other NPC fields** (all prov.):

| Field | Meaning |
|---|---|
| `needsHome` | Object id (preferred; the NPC stands at its approach cell) or `{room, x, y}` tile. Where the NPC idles and returns. Default: spawn point |
| `usePayload` | Any JSON value. **Opaque and NPC-owned.** Never read, logged or interpreted by the engine; a clone rides on every `npc_used` event this NPC emits |
| `onUse` | Object id → `{ setGlobal?: name, emitEvent?: name }`. Applied when **this** NPC completes a use of **that** object. `setGlobal` sets the global to `true` |
| `needsSpeed` | Walk speed for needs moves (px/s). Default `behavior.patrol.speed`, else 80 |

### 3.2 Object fields

```json
{ "id": "coffee_machine", "affordance": { "satisfies": "caffeine", "restores": 70, "useSeconds": 45 } }
{ "id": "clerk_pc", "affordance": { "satisfies": "work", "restores": 50, "useSeconds": 30, "accepts": ["found_item"], "useFrom": {"dx": 0, "dy": 1} } }
```

| `affordance` field | Bounds | Default | Meaning |
|---|---|---|---|
| `satisfies` | name or array | — | Need(s) a use tops up |
| `restores` | 1–100 | 0 | Points added on completion |
| `useSeconds` (prov.) | 0–600 | 20 | Dwell at the object before the use completes |
| `useFrom` (prov.) | `{dx, dy}` tiles | nearest walkable cell | Where the NPC stands, relative to the object's centre |
| `capacity` (prov.) | ≥1 | 1 | NPCs that can hold a job on it at once |
| `accepts` (prov.) | array of tags | none | Carried items with these tags can be used here ("usable as") |

An affordance carries **no content**.

### 3.3 Item fields (tagged, droppable)

| Field | Meaning |
|---|---|
| `needsTag` (prov.) | One tag string. NPCs with a matching interest are drawn to it |
| `droppable` (prov.) | `true`: clicking the item in the inventory drops it (section 6) |

### 3.4 eventMapping field

`"needs"` (prov.): `"suspend"` | `"resume"` | `{ "set": { "<need>": level } }`.
Runs after `patrolOverride` in the same mapping.

### 3.5 Scenario field

`npcNeedsSeed` (prov.): number or string. Default: the scenario name.

---

## 4. Runtime architecture

- Module `public/break_escape/js/systems/npc-needs.js` (exists): `NPCNeedsSystem`
  core (pure logic, takes a `world` adapter), `createEngineWorld()` (live adapter),
  `installNpcNeeds()`. No static imports, so node tests import it directly and no
  test-harness copy list needs it.
- Module `public/break_escape/js/systems/item-drop.js` (exists): the drop action.
- `core/game.js` imports both after the behaviour manager loads and calls
  `window.npcNeedsSystem.update()` each frame after `npcBehaviorManager.update`.
- `npc-lazy-loader.js` calls `npcNeedsSystem.register(id)` after each `registerNPC`.
- Movement goes **only** through `goToAndStay(x, y, speed, {owner:'needs', yieldToPlayer})`.
  The needs system never writes velocities or waypoints, so collision, wall
  escape, stalls and depth sorting work as they do today.

Per-NPC state: `levels`, `lastSatisfiedAt`, `mode` (`idle | job | returning | frozen`),
flags `scriptSuspended`, `blocked`, `atPost`, the current `job`
(`{need|null, tag|null, kind:'use'|'carry', phase, targetId, itemId, carrying, deadline, useUntil}`),
`home`, per-target `cooldowns`, and its own seeded RNG.

---

## 5. Runtime behaviour

### 5.1 Needs clock and decay

- Each frame: `Δ = gameClock.elapsedMs() − last`; add `min(Δ, 1000)` to an
  accumulator. Skip (no accumulation) while `isVmContextActive()`.
- Run one **tick** per 250 ms in the accumulator. All decisions happen in ticks.
- Per tick, each need loses `decayPerMin × 250 / 60000`, except the need being
  serviced during its `using` dwell. Crossing `urgentAt` downward emits
  `npc_need_urgent:<npcId>` once.
- Decay continues during conversations and minigames; servicing waits (5.5).
- "Per minute" means needs-clock minutes (real speed). The story `rate` and clock
  anchors are ignored on purpose.
- NPCs are processed in sorted id order every tick.

### 5.2 Selector (bounded utility)

Run for an NPC in mode `idle` or `returning` (a new job cancels the walk home).
A running job is never preempted.

```
best = none
for each need n in declaration order:
    urgent  = level(n) <= urgentAt(n)
    starved = maxUnmetMin(n) && now - lastSatisfied(n) >= maxUnmetMin(n)
    if not (urgent or starved): continue
    score = starved ? 1000 + weight(n) : weight(n) * (urgentAt(n) - level(n)) / urgentAt(n)   // 0..weight
    if best and score <= best.score: continue
    target = nearest reachable free object whose affordance.satisfies includes n
    if target: best = {kind:'use', need:n, target, score}
for each interest tag t in declaration order:
    score = weight(t)                                   // flat, same 0.1–10 scale
    if best and score <= best.score: continue
    item   = nearest reachable, visible, unclaimed item with needsTag == t in noticeRooms(t)
    target = needsHome object if it accepts t and is free, else nearest reachable free object whose affordance.accepts includes t
    if item and target: best = {kind:'carry', tag:t, item, target, score}
start best, or hold still
```

- **Presence-driven collection.** An interest gives utility only while a matching,
  reachable item exists. No item, no option. Tags filter: an NPC never picks up an
  item whose tag it has no interest in, and nothing is "searched for".
- **Fair competition.** A need's score runs 0..weight as it empties. An interest
  scores its weight flat. So `interests.found_item.weight = 3` beats any need of
  weight ≤ 3 that is not starved; weight 0.5 loses to a need half-empty at weight 1.
  `maxUnmetMin` lets a real need win when it matters.
- **Nearest:** straight-line distance, ties by object id. **Reachable** (required,
  not yet implemented): the object's room is loaded **and** either it is the NPC's
  current room or `findWorldPath` from the NPC to the approach cell returns a path
  (it is synchronous: `calculate()` runs inside the call). Unreachable targets are
  skipped, not failed. This is what stops an NPC choosing a cabinet behind a locked door.
- **Free:** fewer than `capacity` other NPCs hold a job on it, and it is not on
  this NPC's failure cooldown.
- **Claimed item:** an item already in another NPC's carry job is skipped.

### 5.3 Jobs and moves

```
use:   goto_target → using(useSeconds) → complete → returning → idle
carry: goto_item → pick up → goto_target → using(useSeconds) → complete → returning → idle
```

- Each move: approach cell (5.4), `deadline = now + max(20 s, 3 × distance / speed)`,
  `goToAndStay(..., {owner:'needs', yieldToPlayer:false})`. Already there (≤12 px) →
  treated as arrived.
- Arrival comes from `npc_arrived:*` with `owner === 'needs'`, queued and handled
  at the next tick.
- **Pick up:** hide the sprite, make it non-interactive, remove it from
  `room.objects`, keep it on the NPC record (`_needsCarried`). Emit
  `npc_picked_up:<itemId>`. If the item is gone (player took it back), abort and go home.
- **Using:** face the object; after `useSeconds` → complete.
- **Complete:** add `restores` (± jitter) to the need if the object satisfies it
  (a carry use by an interest changes no level); set `lastSatisfiedAt`; destroy a
  carried item; emit `npc_used:<objectId>` (section 7); apply `onUse[objectId]`.
- **Returning:** `goToAndStay(home, {owner:'needs', yieldToPlayer:true})`; on arrival
  emit `npc_returned_post:<npcId>`.
- **Failure:** deadline passed or no approach cell → `npc_job_failed:<npcId>`,
  cancel the move, drop any carried item at the NPC's feet, 60 s cooldown on that
  target for this NPC, go home.
- `npc_left_post:<npcId>` is emitted when a job starts while the NPC is at its post.

### 5.4 Approach cells

`useFrom` offset from the object's centre, snapped with
`findNearestWalkableWorldCell(x, y, 1)`; otherwise
`findNearestWalkableWorldCell(centre, 3)` (ring scan, deterministic). A floor item
resolves to its own cell. On arrival the NPC turns to face the object.

### 5.5 Stillness, urgency, conversation

Per needs NPC per tick, in order:

```
if KO / hostile / body disabled:    abort job (drop carried item), blocked; on recovery walk home
elif scriptSuspended:               do nothing
elif inPersonChatWith(npc):         mode = frozen: remember mode, pause dwell timer, cancelMove
elif mode == frozen:                restore mode; re-issue the remembered move from where it stands
                                    (deadline extended by the frozen time) or continue the dwell
elif idle / returning:              selector (5.2); nothing → hold position
elif job:                           advance (5.3)
```

`inPersonChatWith(id)`: the open minigame is a person-chat for this NPC. Base it on
the minigame instance's own `npcId`, not on `currentConversationNPCId` alone
(person-chat swaps it briefly).

Behaviour-layer guard (exists): in `NPCBehavior.update`, a needs NPC in a chat with
the player gets velocity 0 and returns before `executeState`. Without it an
in-flight `goToAndStay` keeps walking during the chat.

`goToAndStay(..., {yieldToPlayer:true})` lets the existing `face_player` branch fire
during the walk home (exists). Player-facing behaviour:

| NPC is… | Player walks up | Player talks to it |
|---|---|---|
| idle at post | faces player, stays | freezes |
| heading to an option (urgent need or present item) | keeps going | freezes, resumes after |
| walking home | stops, faces player, carries on when player leaves | freezes |
| using an object | stays (dwell continues) | freezes, dwell paused |

---

## 6. General drop action (exists)

- An inventory item with `"droppable": true` is dropped when clicked in the
  inventory (branch in `handleObjectInteraction`, before consumables).
- It lands at the player's feet, snapped to a walkable cell, in
  `window.currentPlayerRoom`, as an ordinary takeable world object (the player can
  pick it up again) with its scenario `id` and `needsTag`.
- Emits `item_dropped:<itemId>` `{itemId, tag, roomId, x, y}`.
- **Persistence:** client-side only. `removeFromInventory` does not tell the
  server, so after a reload an uncollected dropped item is back in the inventory,
  and an item an NPC used is also back (the server never heard of either). The
  scenario's globals (set from `item_dropped`/`npc_used`) persist and are what gate
  progress; mappings must be `onceOnly` so a second drop after reload does no harm.
  Server-side drop/consume sync is listed as optional work (15).
- A world-placed tagged item (not dropped, just `needsTag` in the room's objects)
  works the same way, including one revealed by `revealOnGlobal`.

What a dropped item *is* (a USB device, a QR card) and whether its target
"inserts" or "scans" it is scenario meaning; the engine only moves it and emits
events.

---

## 7. Events the system emits

| Event | Payload |
|---|---|
| `npc_need_urgent:<npcId>` | `{npcId, need, level}` |
| `npc_left_post:<npcId>` | `{npcId, need, targetId}` (`need` null for an interest job) |
| `npc_returned_post:<npcId>` | `{npcId}` |
| `npc_picked_up:<itemId>` | `{npcId, itemId, tag}` |
| `npc_used:<objectId>` | `{npcId, objectId, need, itemId, tag, payload, playerNearby}` |
| `npc_job_failed:<npcId>` | `{npcId, need, targetId, reason}` (`timeout`, `no_approach`) |
| `item_dropped:<itemId>` | `{itemId, tag, roomId, x, y}` (drop action) |
| `npc_arrived:<npcId>` | existing, now plus `owner` (`'needs'` or undefined) |

`npc_used` details:
- `need`: the need satisfied, or `null` for an interest (carry) use.
- `itemId`, `tag`: the carried item, or `null`.
- `payload`: structured clone of the NPC's `usePayload` (or `null`). Listeners
  cannot mutate the NPC's copy.
- `playerNearby` (prov., **not yet implemented**): `true` when the player is in the
  NPC's room within 3 tiles (96 px) with a clear line (`canSeePlayerToFace`).
  Lets a scenario condition on "the player was right there when the NPC used it",
  which the tailgating beat needs (12.3).

The decision log never contains payload contents (only `payloadPresent`).

---

## 8. Composition with scripts

1. Any `goToAndStay` without `owner:'needs'` (a `patrolOverride`, the
   conversation walk-home in `npc-manager.js`, anything else) calls
   `npcNeedsSystem.onExternalMove`: the job is dropped (carried item back on the
   floor), needs are suspended. The NPC stays where the script leaves it.
2. `"needs": "resume"` walks it home and re-enables selection. `"suspend"` stops
   it without moving. `{set:{…}}` sets levels. This is how a scenario nudges a beat
   while still letting it play out through the needs path (e.g. set `work` to 0 so
   the NPC goes and uses its PC at the next idle moment).
3. `patrolOverride.resume` is not needed: the needs loop issues its own moves.
4. Mappings on `npc_arrived:<id>` see needs arrivals too. A scenario that keeps an
   old `npc_arrived` beat on a needs NPC must condition on `owner`; better, move
   the beat to `npc_used:<objectId>`.

---

## 9. Determinism

- Per NPC RNG: `mulberry32(fnv1a32(seed + ':' + npcId))`, used only for `jitterPct`.
- Every other choice is an ordering: declaration order, distance then id, NPC id
  order for capacity claims. No `Math.random()` in the module.
- Decision log: `{t: tick, npc, ev, need?, tag?, target?, item?, level?}`, ring
  buffer of 2000, `npcNeedsSystem.getLog()`. Events: `registered urgent job_start
  picked_up using used returned_post job_failed job_aborted frozen unfrozen
  suspended resumed level_set blocked unblocked`.
- **Manual clock** (`new NPCNeedsSystem(world, {manualClock:true})` / test
  bridge): the clock moves only through `step(ms)`; with a world whose moves
  complete at once the log is byte-identical for a seed (node tests do this).
- **Live:** the sequence `(npc, ev, need/tag, target, item)` repeats for the same
  seed and player actions; tick numbers can drift a few ticks because walking time
  depends on frame timing and the player's body.
- **Test bridge** (not yet implemented): `window.__test.needs` =
  `{ setSeed(n) /* resets */, setManualClock(bool), step(ms), state(npcId), log(), set(npcId, need, level) }`,
  all JSON in/out. It controls the needs clock only; it never moves an NPC or
  triggers a use directly (the bridge's "real input" rule).

---

## 10. Reload

- Need levels reset to `initial` (same seeded jitter). No state sync.
- Dropped items: see section 6.
- Globals set by `onUse` and by scenario mappings persist as usual.

---

## 11. Validator and schema (not yet implemented)

`scripts/scenario-schema.json` (insert as text; do not re-serialise the file, which
reformats ~10k lines): NPC `needs interests needsHome needsSpeed usePayload onUse`;
item `affordance needsTag droppable`; eventMapping `needs`; top level `npcNeedsSeed`.

`scripts/validate_scenario.rb`: add the same names to the known-field lists
(`known_npc_fields`, `known_item_fields`, `known_event_mapping_fields`,
`known_top_level`). Put the checks in a new `scripts/validate_npc_needs.rb`
(`require_relative`, like `validate_social.rb`) called from the common-issues list:

- **Errors:** bounds; a need with no object anywhere that `satisfies` it; an
  interest tag with no object that `accepts` it, or no item with that `needsTag`;
  `needsHome`/`onUse` naming a missing object; `needs`/`interests` together with
  `behavior.patrol.enabled: true`; `droppable` without `needsTag` (warning only).
- **Report per need:** `T1 = (initial − urgentAt)/decayPerMin` and
  `P = (min(100, urgentAt + restores) − urgentAt)/decayPerMin` minutes, using the
  nearest satisfying object's `restores`.
- **Warnings:** T1 > 5 min for a need of an NPC that has any `onUse` entry; an
  affordance or `accepts` target in a room other than the NPC's `needsHome` room
  ("may be unloaded when needed"; rooms load lazily and the system only sees
  loaded rooms); an affordance behind a `locked` room from the NPC's room; an
  interest whose `noticeRooms` excludes every room an item with that tag starts in
  (fine for droppable items: say "player must drop it in …").

---

## 12. Demo scenario: `lab_physical_pentest` mechanical wiring — TO BE WRITTEN BY opus48

## 13. Cyber Security hook contract — TO BE WRITTEN BY opus48

> Sections 12 and 13 are owned by the opus48 (Opus 4.8) cyber agent. An earlier
> draft of §12 was removed because it was cut off mid-sentence; do not reconstruct
> it from memory — rebuild it against the committed engine (`npc-needs.js`,
> `item-drop.js`) and the generic contract in sections 1–11 above, which is stable:
> the needs/interests schema (§3), runtime behaviour (§5), the general drop action
> (§6), the `npc_used` / `npc_job_failed` events and the `usePayload` shape (§7),
> and script composition (§8). The three beats map to: Dale's caffeine need
> vacating `staff_pc`; Priya's interest in a player-dropped tagged device she
> carries to a PC and uses; Len's walk to a badge reader whose `npc_used`
> (gated on `playerNearby` + the lanyard global) calls the existing `unlockDoor`.
> Note: engine doors never re-close (`openDoor` destroys the sprite), so the
> tailgating beat uses an NPC-triggered `unlockDoor`, not a held-open door.
`staff_pc` gains `"affordance": { "sat