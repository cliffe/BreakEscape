# NPC Needs System (Sims-lite) — Design Contract

Status: **design locked 2026-11-04; partly implemented** (sections 11–13 are
marked as built; the rest is the design, and the file has no section 14 or 15). This document is the contract for three roles:

- **Engine implementer** builds the generic system (sections 1–11).
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
| `needsRooms` | Room leash, allow list: the only rooms this NPC's needs use objects in or walk through. The home room is always allowed. Fixed per NPC (no global conditions) |
| `needsAvoidRooms` | Room leash, deny list: rooms its needs never use or cross, even as a short cut; it goes round or waits. May not list the home room |

**Room leash and private objects (slice 2a, built 2026-11-06).** Room field `needsPrivateTo: [npcIds]`
keeps every other NPC's needs out of a room (someone's office). Object fields
`affordance.private: true` and `affordance.owners: [npcIds]` limit **uses** to the owners
(`owners`, else `screenOwner`, else the NPC whose `needsHome` is the object); any NPC may still
deliver to it (`accepts`). The home room comes from scenario data (coordinate home, the needsHome
object's room, else the spawn room), so a provisional home never forbids it. Candidates are
filtered in `_useCandidate`/`_carryCandidate`; routes carry `avoidRooms` into `reachable` and
`goToAndStay`, and the behaviour passes them to `findWorldPath` at every planning point, which
avoids each loaded forbidden room's inner floor ring (corners included) for that search only,
skipping the room the search starts in. Scripts and route patrols ignore the leash. When the leash
removes an option (a forbidden room: `needsRooms`, `needsAvoidRooms`, a `needsPrivateTo` room)
the log gets `leashed {need, skipped, chose}` and the system emits `npc_needs_leashed:<npcId>`
(once per job, or once per urgent episode when nothing is left); `skipped` lists only the
room-removed targets. Passing over another owner's `private` object is expected (colleagues'
desks), so it is logged as `private_skipped {need, skipped, chose}` and emits nothing. A
mapping that wants "went the long way" can key on `npc_needs_leashed`, or on the
`npc_used:<object>` it expects conditioned on `data.npcId` (one mapping per NPC: conditions have
`&&` but no `||`), as `test_needs_sims` does for its kitchen-coffee task. The debug overlay marks
such jobs ` leashed`, and ` private` where a private object was passed over (section 4.1). Live proof: `scenarios/test_needs_leash` (four rooms in a loop; game
587: leashed, 0 of 1,966 samples on the private floor over three round trips, out and back by
the corridor; unleashed, 32 of 86 samples on it, out and back through it) and
`scenarios/test_needs_sims` (game 585: private PCs, the lounge private to Rosa and Grace).

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

`needsDebugOverlay`: boolean, default false. Turns on the need-bar debug overlay (section 4.1).

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

**Home resolution.** `s.home` is resolved on the NPC's first tick with a sprite. When
`needsHome` names an object that isn't registered yet (start-room NPCs register before
the room's objects; an object in a room that loads later), the home is **provisional**:
the NPC's current spot, `objectId: null`, retried once a second (every 4 ticks) until
the object exists. The resolved home replaces it, the log gets `home_resolved`, and it
is never looked up again. A coordinate home or one found first time is cached at once.
`getState().home` carries `objectId` and `provisional`. The live adapter's `reachable()`
treats a target whose approach cell is within one tile as reachable (EasyStar returns
no path when start and end share a tile, which used to send an NPC at its own desk to
a colleague's).

### 4.1 Debug overlay (`systems/npc-needs-debug.js`)

Off by default. On with the scenario flag `"needsDebugOverlay": true`, or from the
console / a test with `window.__test.needs.overlay(true)` (`false` hides it, `null`
goes back to the scenario flag). Above each needs NPC it draws a small panel: one bar
per need, in name order, with the need's initial (green above `urgentAt`, amber at or
below it, red once unmet for `maxUnmetMin`), and a line `<npc>: <job>` (`idle`,
`windup <target>`, `goto_target <target>`, `using 4s <target>`, `returning`, `frozen`,
`suspended`). The line ends in ` leashed` when a room rule removed an option: on a job chosen
that way (`job.leashed`, also in `getState().job.leashed`), or while the NPC has no job and an
urgent need was left with nothing permitted (`leashNoted`); and in ` private` the same way when
another owner's private object was passed over (`job.privateSkipped`, `privateNoted`).

**What the player sees (office life slice 3, `OFFICE_LIFE_PLAN.md` 2.12).** Action icons
(`npc-action-icons.js`) take textures: `"icon:<name>"` (assets/icons) or `{ "sprite": "<object
texture>" }`, at native size, defaults from existing art (caffeine coffee cups, thirst cup, work
clipboard, social talk, curiosity question mark, `post`/`printout` mail; hunger `F` and rest `Z`
stay text); a carry looks up its `needsTag`, a use its `need` before the target's `satisfies`.
Icons show only for NPCs in the player's room while it is lit. `npc-office-visuals.js` keeps a
carried item visible in the carrier's hand (follows on `postupdate`, behind the body facing
north) and plays an object's `affordance.useSound` when a use completes, heard by distance (silent
at eight tiles) and room (`room-hearing.js`: own room 1, through a door 0.4, else 0), at most one
per second, emitting `npc_use_heard:<objectId>`. Seated NPCs bob 1 px every 600 ms of the needs
clock during a `work` use (`seating.js` `typingBob`, off under reduced motion).
`"officeVisuals": false` turns the held item, sounds and bob off. Installed beside the action icons in `core/game.js` with a dynamic
import, so no test-harness copy list needs it. It reads `npcNeedsSystem.states` and
writes nothing back; positions follow the sprite each frame, bars redraw every 200 ms,
graphics are made once per NPC and destroyed when the sprite goes (room unload, NPC
removed) or the overlay is turned off. Depth 5001, no physics, no input. The pure
helpers `barColour`, `barLayout` and `jobLabel` are tested in
`test/js/npc-needs-debug.test.mjs`.

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
- **Nearest:** straight-line distance, ties by object id. **Reachable** (implemented; `world.reachable` turns EasyStar sync on for the one call, because 0.4 otherwise hands the result to its callback through `setTimeout`): the object's room is loaded **and** either it is the NPC's
  current room or `findWorldPath` from the NPC to the approach cell returns a path
  (it is synchronous: `calculate()` runs inside the call). Unreachable targets are
  skipped, not failed. This is what stops an NPC choosing a cabinet behind a locked door.
- **Free:** fewer than `capacity` other NPCs hold a job on it, and it is not on
  this NPC's failure cooldown.
- **Claimed item:** an item already in another NPC's carry job is skipped.

**Tick cost (built 2026-11-05, `OFFICE_LIFE_PLAN.md` 2.0).** An NPC with no urgent or
starved need and no interests skips the selector without looking at any object. The
object list is built at most once per tick (rebuilt after a pickup, consume, drop,
emit or `setGlobal`, since a listener can reveal or move things), and each
(NPC, object) reachability answer is reused within the tick. None of this changes a
decision. One thing authors can see: an NPC whose selection ran a path search and still
found nothing (a free target it cannot reach, or an item with nowhere to take it, such
as the showcase's abandoned mugs before the kitchen loads) **re-selects after 1 s**
instead of every tick. Any job completing or aborting, a room loading, or one of its
needs newly going urgent clears that wait, so contention timing is unchanged (an NPC
waiting on a claimed target runs no search and still checks every tick). The worst case
is a blocked NPC starting up to four ticks (1 s) later than before, when what unblocks it
is something else (a failure cooldown ending, an item appearing that nobody dropped
through the needs system, a path opening). `window.npcNeedsSystem.stats` counts
`ticks`, `selects`, `objectScans`, `pathSearches` and `backoffs` for live measurement.

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
- **At-post jobs (own-desk work).** A `use` whose target is the NPC's `needsHome` object
  is not a leave (b642594be, slice 2 of `OFFICE_LIFE_PLAN.md`): no wind-up, no
  `npc_left_post`, `atPost` stays true, and the NPC is never moved, before or after the
  use (a seated NPC's body sits about 30 px off its home cell, and a move would stand it
  up). The use still emits `npc_used:<objectId>`. It ends through one `returning` tick
  with `atPost` true, which emits nothing; seating's `needsStop` keeps the home stop
  through the whole use and that tick, so the NPC stays seated. Carry jobs are never at
  post. `npc_returned_post` is gated on `atPost` being false, not on a matching
  `npc_left_post`: a script move clears `atPost` without emitting (open question 12 of
  the office-life plan), so a later needs return emits an unpaired `npc_returned_post`.
- **Caught at the desk.** While an NPC walks back from a real leave and is in its home
  room, the player within 48 px (1.5 tiles) of its home object's approach cell, or with
  a minigame open whose params carry that object (`lockable`, `sprite`,
  `containerItem`), emits `npc_caught_at_post:<npcId>` once per return. It can fire on
  the first returning tick, while the NPC is still at the coffee machine across the
  room, and a player walking past the desk at that moment counts. Coordinate homes
  never catch.

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
- **Persistence (synced 2026-11-05):** the drop is saved as a room object (`update_room` `add_object`, `sourceType: 'player_drop'`, accepted only for a held `droppable` item, stored from the server's held copy) and the inventory entry is removed, so the world item and the emptied slot survive a reload. A player pickup removes it as any pickup does; an NPC consuming it removes the room object too. Earlier text, now out of date: client-side only. `removeFromInventory` does not tell the
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
| `npc_left_post:<npcId>` | `{npcId, need, targetId, expectedAwayMs, playerNearby, playerDistance}` (`need` null for an interest job) |
| `npc_returned_post:<npcId>` | `{npcId, playerNearby, playerDistance}` |
| `npc_caught_at_post:<npcId>` | `{npcId, objectId, playerDistance, inMinigame}` (5.3) |
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
- `playerDistance`: px between NPC and player at use time (rounded), or `null`.
- `playerNearby` (prov., implemented): `true` when the player is in the
  NPC's room within 3 tiles (96 px) with a clear line (`canSeePlayerToFace`).
  A mapping reads it as `data.playerNearby === true` (a bare `playerNearby` is not resolved by `safeEvaluateCondition`). Lets a scenario condition on "the player was right there when the NPC used it",
  which the tailgating beat needs (12.3).

`npc_left_post` details:
- `expectedAwayMs`: straight-line walk out and back at the NPC's needs speed (via the
  item for a carry) plus the target's `useSeconds` (default 20). A lower bound: paths
  round furniture and a wait for a busy target make the real absence longer.
- `playerNearby`, `playerDistance`: as for `npc_used`, at the moment of leaving (also on
  `npc_returned_post`, at arrival).

A mapping for the catch, e.g. a bark or a conversation:

```jsonc
{ "eventPattern": "npc_caught_at_post:tom", "cooldown": 30000,
  "bark": "Er, that's my desk. Can I help you?" }
```

`inMinigame: true` means the player had the owner's PC (or other home object) open; the
engine does not close it. A mapping can.

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
- **Test bridge** (implemented in `systems/test-bridge/index.js`; `ids()` and `log(sinceTick)` added): `window.__test.needs` =
  `{ setSeed(n) /* resets */, setManualClock(bool), step(ms), state(npcId), log(), set(npcId, need, level), overlay(on) }`,
  all JSON in/out. It controls the needs clock only; it never moves an NPC or
  triggers a use directly (the bridge's "real input" rule).

---

## 10. Reload

- Need levels reset to `initial` (same seeded jitter). No state sync.
- Dropped items: see section 6.
- Globals set by `onUse` and by scenario mappings persist as usual.
- Workstation globals (`<id>_owner_away`, `<id>_screen_locked`, `workstation-state.js`)
  are written false at install for every workstation in a room loaded at that point, and
  **by name for the rest** (2026-11-06): the bootstrap scenario carries no objects for
  unloaded rooms, so install also resets every saved `<id>_owner_away` whose
  `<id>_screen_locked` partner is in the globals too (`_publish` always writes the pair).
  This closes the gap where the lab's `staff_pc_2` (open plan, unloaded after a reload
  into the briefing room) read "walked off without locking" while Melanie sat at it. A lone
  `*_owner_away` global with no partner is not touched.

---

## 11. Validator and schema (implemented 2026-11-05: `scripts/validate_npc_needs.rb`)

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

## 12. Demo scenario: `lab_physical_pentest` mechanical wiring (as built)

The lab (`scenarios/lab_physical_pentest/scenario.json.erb`) drives all three
physical-pentest beats through the generic system. No beat uses a scripted
`patrolOverride` any more — each NPC moves because a need or interest wins the
selector (§5.2), and the scenario only listens to the events the system emits
(§7). Three rooms, east–west: `briefing_room` (Ruth + kit table), `open_plan`
(the beats), `secure_area` (debrief, behind the badge door). `npcNeedsSeed` is the
scenario name. `social.captures.revealSecret: true` and `se_captures: {}` make the
real capture store live (§13).

### 12.1 Beat 1 — hardware keylogger (per-NPC credential)

Dale idles at his desk and periodically steps away for coffee, both through needs:

```jsonc
"dale": {
  "needsHome": "staff_pc", "needsSpeed": 100,
  "needs": {
    "work":     { "decayPerMin": 15, "urgentAt": 50, "initial": 65 },
    "caffeine": { "decayPerMin": 25, "urgentAt": 50, "initial": 100, "maxUnmetMin": 6 }
  },
  "usePayload": { "address": "d.ferreira", "secret": "Calderbank#Spring26", "host": "CM-RECEP-01" }
}
```

- `staff_pc` has `affordance { satisfies: "work", restores: 60, useSeconds: 8, useFrom:{dx:0,dy:1} }`.
  Dale's `work` need makes him sit and "log in" (a use of `staff_pc`) roughly once a
  minute; each use emits `npc_used:staff_pc`.
- `coffee_station` (far corner, ~8 tiles away) has `affordance { satisfies:"caffeine", restores:70, useSeconds:45 }`.
  When `caffeine` goes urgent Dale walks over, dwells 45 s and walks back — the catchable
  window in which the player plants the keylogger on the empty desk.
- Planting is the committed `requiresItem`/`consumesItem` primitive on `staff_pc`
  (the player interaction path; the NPC's need-use never runs `triggerOnInteract`),
  which sets `kp_keylogger_planted` and reveals the `planted_keylogger` read object.
- The capture fires from Dale's own mapping, gated on the plant:

```jsonc
{ "eventPattern": "npc_used:staff_pc",
  "condition": "globalVars.kp_keylogger_planted === true", "onceOnly": true, "cooldown": 0,
  "addCapture": { "targetId":"dale", "roleLabel":"Calderbank Mutual — reception staff",
                  "kind":"credential", "note":"Recovered from an inline hardware keylogger (simulated)." },
  "setGlobal": { "kp_creds_captured": true } }
```

`addCapture` (§13) merges Dale's `usePayload` (which rides on the event as
`data.payload`) over the static template, so the captured credential —
`d.ferreira` / `Calderbank#Spring26` on `CM-RECEP-01` — comes from the NPC, not
from `staff_pc`. A use **before** the plant fails the condition and does **not**
consume the `onceOnly` (count only increments on a fire, npc-manager.js), so the
first post-plant login is the one that captures.

### 12.2 Beat 2 — three dropped devices (one primitive, three payoffs)

Three droppable kit items, each a real inventory item with a distinct `needsTag`:

| Item | `needsTag` | Priya carries it to | `npc_used:usb_target_pc` payoff |
|---|---|---|---|
| `kit_badusb` (BadUSB) | `dev_badusb` | `usb_target_pc` | `kp_usb_foothold` → `grant_remote_session` timer gives the Remote Session opener (SE-lab pattern) |
| `kit_usb` (storage USB) | `dev_usb` | `usb_target_pc` | `kp_usb2_foothold` → reveals `usb_malware_note` (a simulated lure-file read) |
| `kit_qr` (QR card) | `dev_qr` | `usb_target_pc` | `addCapture` (Priya's `usePayload`, a phished credential) + `kp_qr_phished` |

Priya has only `interests` (no needs), so she holds still until a matching item is
present: `interests: { dev_badusb:{weight:3,noticeRooms:["open_plan"]}, dev_usb:{…}, dev_qr:{…} }`.
The player carries a device onto the floor and **drops** it (clicks it in the
inventory — the §6 drop action; the dropped world item keeps its `needsTag`).
Priya notices it, walks over, picks it up (carry job, §5.3), carries it to her PC
(`usb_target_pc` has `affordance { accepts:["dev_badusb","dev_usb","dev_qr"], useSeconds:6 }`,
which is also her `needsHome`) and uses it. The use emits `npc_used:usb_target_pc`
with the carried item's `tag`; three `onceOnly` mappings on Priya, each conditioned
on `data.tag === "dev_…"`, select the one payoff. `kp_usb_dropped` (the `drop_usb`
task) is set by `item_dropped:kit_*` mappings on Priya (loaded in `open_plan`).

### 12.3 Beat 3 — tailgating (hi-vis + parcel)

`secure_area` stays a real access barrier: `lockType:"key"`, `requires:"cm_records_badge"`,
and **no item opens it** (the validator warns; that is the taught point). The
disguise is two carried/worn kit items whose `onPickup.setVariable` sets globals:
`kit_hivis` → `has_hivis`, `kit_parcel` → `has_parcel` (the old `kit_lanyard` →
`has_lanyard` is kept as optional cover).

**As built now (corrected 2026-11-06; the earlier `rounds` need is gone).** Len has no
needs block. He walks a multi-room `behavior.patrol.route` (`waypointMode: "sequential"`,
`pauseForPlayer: false`): a dwell in `open_plan`, then a waypoint beside the records door
with the route action `{ "unlockRoom": "secure_area", "useObject": "badge_reader" }`, then
two points inside `secure_area`, and back. The route action faces the reader and opens
the door through Len's `unlockDoor` mapping (a mapping on `len_never_fires` that must stay:
the client and server both check for it before an NPC may unlock a room). The door gate
emits `door_gate_opened` / `door_gate_closed`, which the scenario maps to the global
`len_at_door`; `room_entered:secure_area` while `len_at_door` is true sets
`kp_badge_tailgated`. His `los.challengeOnSight` (`near: { door: "secure_area", radius: 64 }`,
skipped once `courier_ready` or `records_clone_held` is set) emits `player_in_view_near:len`,
which challenges the player at the door, or records the PIN capture when he is at the
keypad. The scenario file is the reference for the exact mappings.

### 12.4 Capture view

An `open_plan` `page-builder` object (`captures_terminal`, `minigameData:{ view:"captures" }`)
opens the read-only captures list, which reads `se_captures` and reveals the secret
because `social.captures.revealSecret` is true. The keylogger (Dale) and QR (Priya)
credentials show there as role-labelled rows.

## 13. Cyber Security hook contract (as built)

The generic system stays cyber-neutral; all device/credential meaning is scenario
data plus one small, reusable capture hook. Nothing below reads an object's content:
an object only advertises an `affordance` and (for items) a `needsTag`.

### 13.1 Per-NPC secrets ride on `usePayload`

An NPC's `usePayload` is opaque to the engine (§1 rule 7, §7). A structured clone of
it rides on every `npc_used:<objectId>` that NPC emits, as `data.payload`. So the
same object (`staff_pc`, `usb_target_pc`) yields a different credential depending on
which NPC used it — the secret lives on the NPC, never on the object. Mapping
conditions read event data as `data.<key> === <literal>` (a bare key is not resolved
by `safeEvaluateCondition`); the lab uses `data.tag === "dev_badusb"` and
`data.playerNearby === true`.

### 13.2 The `add_capture` hook

A new reusable action writes the SE/physical capture store (`se_captures`), reusing
`captures.js` (`makeCaptureEntry` + `mergeCapture`, first-capture-wins, the closed
key set that `state-sync.js` enforces):

- **`apply-actions.js`** — action `{ type:"add_capture", capture:{…} }` for the
  static-descriptor sources (timers, `triggerOnInteract`). It calls a module helper,
  `recordSECapture(input)`, also exposed as `window.recordSECapture`. `captures.js`
  is pulled in by a **lazy dynamic import** (not a static import), so the node
  harnesses that copy `apply-actions.js` need no new copy-list entry.
- **`npc-manager.js`** — a new eventMapping key `addCapture: { targetId, roleLabel,
  kind, host?, note?, … }`. When the mapping fires, the engine overlays the event's
  `data.payload` (the NPC's `usePayload`) onto this template and calls
  `window.recordSECapture`. This is how a credential is read from the NPC at
  `npc_used` time. No new static import is added to `npc-manager.js`.

`kind` is `"credential"` (address/secret) or `"foothold"` (host/note). The authored
secret is only ever shown when `social.captures.revealSecret` is true (§12.4,
`captures.js` `displaySecret`); an awareness build leaves it off and the view only
acknowledges that a sign-in was captured.

### 13.3 Footholds reuse existing primitives

Device payoffs are ordinary scenario wiring driven off `npc_used`/`setGlobal`:
a BadUSB foothold reuses the SE-lab `startOnGlobal` timer that gives a `type:"pc"`
Remote Session opener for a hidden `active:false` container; a storage-USB foothold
reveals a read object with `revealOnGlobal`. The generic drop+collect+use primitive
is identical for all three devices; only the mapped payoff differs.