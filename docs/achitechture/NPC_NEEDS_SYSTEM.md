# NPC Needs System (Sims-lite) — Design Spec

Status: **design, not implemented**. Written 2026-11-04 for an engine implementer.
Scope: engine-wide and cyber-neutral. It does not say what any mission's beats
*mean*; it only emits generic events that a scenario (or another agent) wires
meaning onto.

Field names marked **(prov.)** are invented by this spec and may be renamed during
implementation. Rename them in the schema, validator and this doc together.

---

## 1. What it is

NPCs that opt in carry **needs** that decay over game time. Scenario **objects
advertise affordances**: which need they satisfy and by how much. A small selector
sends an NPC to its most urgent need's best affordance, the NPC uses it, the need
is topped up, and the NPC walks back to its post. The behaviour comes out of the
numbers; there is no scripted list of jobs.

Two motivating patterns (generic):

- **Periodic absence.** A `caffeine` need makes an NPC leave its post at regular
  intervals to visit a coffee source, opening a recurring window when it is away
  from its desk.
- **Curiosity collection.** A `curiosity` need makes an NPC collect a world item
  carrying a matching **tag**, carry it to an object that **accepts** that tag, and
  use it there. When the player places such an item, a curious NPC collects it soon
  afterwards and takes it to that object.

Rules that hold throughout:

1. **Opt-in.** An NPC with no `needs` block runs exactly the code path it runs
   today. The needs system never touches it.
2. **No idle wandering.** A needs NPC with nothing urgent holds still.
3. **Stillness.** A needs NPC stays put when the player walks up to it, unless a
   need is urgent.
4. **Conversation freezes.** While the player is in a person-chat with the NPC,
   it does not move, even if a need turns urgent. It resumes afterwards.
5. **Scripts win.** An eventMapping `patrolOverride` (or any other scripted move)
   suspends the needs loop for that NPC. Needs never fight a script (section 7).
6. **Deterministic.** Same seed + same inputs → same decision log (section 9).

Out of scope: section 13.

---

## 2. Engine facts this builds on (checked 2026-11-04)

| Fact | Where |
|---|---|
| `goToAndStay(worldX, worldY, speed)` overwrites `config.patrol.waypoints` with one waypoint, sets `patrol.enabled = true`, `_stopOnArrival = true` | `systems/npc-behavior.js:2129-2163` |
| On arrival `_triggerGoToStayArrival` sets `patrol.enabled = false`, resets `homePosition` to the arrival point, and emits `npc_arrived:<npcId>` `{npcId, x, y}` once | `npc-behavior.js:2171-2207` |
| There is no resume: after arrival the NPC stands there until something moves it again | same |
| Path following goes through `pathfindingManager.findWorldPath`, the unified world grid, so world-coordinate targets in **other loaded rooms** route through doors | `npc-behavior.js:973`, `systems/npc-pathfinding.js:720` |
| A `goToAndStay` move never pauses for the player (`!this._stopOnArrival` guard on `face_player`) | `npc-behavior.js:796` |
| Patrol defaults off; NPCs with no `behavior` block stand still | `npc-behavior.js:380` |
| `patrolOverride` reads only `targetTile` and `speed`; `stopOnArrival` is ignored; `targetTile` resolves against the NPC's **current** room | `systems/npc-manager.js:1124-1146` |
| eventMappings match `eventPattern` exactly (one dispatcher listener per pattern) | `npc-manager.js:585-610` |
| The dispatcher also supports `prefix*` wildcard listeners | `systems/npc-events.js:45-58` |
| Behaviour manager ticks every 50 ms and freezes every NPC while the player is on the VM (`window.isVmContextActive`) | `npc-behavior.js:90-120`, `freezeAll` at `:130` |
| `window.gameClock.elapsedMs()` is wall time since game start minus time the page was closed, restored on reload. It does **not** pause. Its `rate` and `anchors` only change the displayed time of day; "elapsed game time is real time and is not scaled" | `systems/game-clock.js:5-22, 149` |
| Scenario objects are registered as `window.rooms[roomId].objects[<scenario id>]` (`sprite.objectId = scenarioObj.id`) only once their room is loaded | `core/rooms.js:383, 457` |
| `revealOnGlobal` shows a hidden object when a global turns true; with `requiresItem`/`consumesItem` this already lets a player "place" an item in the world | `core/rooms.js:2913-2945`, `systems/interactions.js:789-812` |
| Person-chat state: `window.currentConversationNPCId` and `window.currentConversationMinigameType === 'person-chat'`. Person-chat also sets `currentConversationNPCId` briefly to other values and restores it (save/restore around nested calls), so it is not a clean "chat open" flag. On close person-chat emits `conversation_closed:<npcId>` | `minigames/person-chat/person-chat-minigame.js:455, 1189-1217, 1932`; `systems/npc-barks.js:176` |
| Open minigame: `window.MinigameFramework.currentMinigame` | `npc-manager.js:634, 705` |
| NPC records already carry `itemsHeld: []` | `npc-manager.js:259` |
| Existing waypoint patrol uses `Math.random()`; the needs system must not | `npc-behavior.js:1175, 1277` |

---

## 3. Scenario schema

### 3.1 On an NPC

```json
{
  "id": "receptionist",
  "needsHome": "reception_chair",
  "needs": {
    "caffeine":  { "decayPerMin": 8,  "urgentAt": 30, "initial": 50, "maxUnmetMin": 6 },
    "work":      { "decayPerMin": 5,  "urgentAt": 40, "initial": 90 },
    "curiosity": { "decayPerMin": 40, "urgentAt": 60, "initial": 0,  "weight": 1.5, "seeks": "found_item", "noticeRooms": ["reception"] }
  },
  "usePayload": "opaque — never read by the needs system",
  "onUse": {
    "reception_pc": { "setGlobal": "receptionist_used_pc", "emitEvent": "receptionist_at_pc" }
  }
}
```

`needs` is a top-level NPC field, beside `behavior`, so a needs NPC can still have
a `behavior` block (`facePlayer`, `personalSpace`, `hostile`). An NPC whose
`behavior.patrol.enabled` is true **must not** also declare `needs`; the validator
errors (section 11). That is the "leave needs off an NPC with scripted movement"
rule, enforced.

Per need (keys are need names, free strings, matched against affordances):

| Field | Type / bounds | Default | Meaning |
|---|---|---|---|
| `decayPerMin` | number > 0, ≤ 600 | required | Level points lost per minute of needs-clock time (section 5.1) |
| `urgentAt` | number 1–99 | required | Level at or below which the need is **urgent** |
| `initial` **(prov.)** | 0–100 | 100 | Level at game start (and after a reload, see 10). The main lever for *when the first beat happens* |
| `weight` **(prov.)** | number 0.1–10 | 1 | Multiplies the urgency score when needs compete |
| `maxUnmetMin` **(prov.)** | number > 0 | none | Starvation guard: once this long has passed since the need was last satisfied, it is treated as urgent with top score (section 6.2) |
| `jitterPct` **(prov.)** | 0–50 | 0 | Seeded ± spread applied to `initial` and to each top-up, so several NPCs on the same numbers don't move in lockstep |
| `seeks` **(prov.)** | tag string | none | Only for **carry** needs: the item tag this need collects (3.3). A need with `seeks` is satisfied only by carrying a tagged item to an accepting object |
| `noticeRooms` **(prov.)** | room ids | `[room of needsHome]` | For `seeks` needs: rooms in which the NPC notices tagged items. Keeps "curious" local and predictable |

Levels are clamped to 0–100. 100 = fully satisfied.

NPC-level fields:

| Field | Meaning |
|---|---|
| `needsHome` **(prov.)** | Object id (preferred) or `{room, x, y}` tile where the NPC idles and returns after each job. Default: its spawn tile |
| `usePayload` **(prov.)** | Any JSON value. **Opaque, NPC-owned.** The needs system never reads, logs or interprets it; it passes it through on `npc_used` events (section 8). Different NPCs using the same object carry different payloads; the object holds none |
| `onUse` **(prov.)** | Map of object id → `{ setGlobal?: string, emitEvent?: string }`. Lets a scenario set a global or emit a named event when **this NPC** uses **that object**. Content-free; the global is set to `true` |
| `needsSpeed` **(prov.)** | Walk speed for needs moves, px/s. Default: `behavior.patrol.speed` or 80 |

### 3.2 On an object (affordance)

```json
{ "id": "coffee_machine", "type": "...", "affordance": { "satisfies": "caffeine", "restores": 70, "useSeconds": 40 } }
{ "id": "reception_pc",   "type": "...", "affordance": { "satisfies": "work", "restores": 60, "useSeconds": 30, "accepts": ["found_item"] } }
```

| Field | Type / bounds | Default | Meaning |
|---|---|---|---|
| `satisfies` | need name or array of names | — | Which need(s) using this object tops up |
| `restores` | 1–100 | required with `satisfies` | Points added to the need's level when the use completes |
| `useSeconds` **(prov.)** | 0–600 | 20 | Seconds (needs-clock) the NPC stays at the object before the use completes. This is the "away window" for a periodic absence |
| `useFrom` **(prov.)** | `{dx, dy}` tile offset from the object's tile | nearest walkable cell (5.4) | Where the NPC stands to use it. Objects have collision bodies, so the object's own tile is never a valid destination |
| `capacity` **(prov.)** | integer ≥ 1 | 1 | NPCs that can use it at once |
| `accepts` **(prov.)** | array of tags | none | This object is a valid destination for carried items with these tags ("usable as") |

An affordance carries **no content**: no data, secrets or payload. Meaning lives
on the NPC (`usePayload`, `onUse`) or in whoever listens to the events.

Object id resolution: `affordance` objects are looked up by scenario `id` in
`window.rooms[roomId].objects`. Only **loaded** rooms count (open question Q2).

### 3.3 Carry items (curiosity)

A world item opts in with a tag:

```json
{ "id": "found_thing", "type": "...", "takeable": true, "needsTag": "found_item", "revealOnGlobal": "found_thing_placed" }
```

| Field | Meaning |
|---|---|
| `needsTag` **(prov.)** | Tag string. An NPC need with `seeks: "<tag>"` will collect this item |

A carry job for need N with `seeks: T`:

1. **Notice.** A visible, interactable world object with `needsTag === T` exists in
   one of N's `noticeRooms`.
2. **Go to item.** Walk to the item's approach cell.
3. **Pick up.** Remove the item sprite from the world (hidden, non-interactive,
   removed from `rooms[r].objects`), push `{id, needsTag, type}` onto the NPC's
   `itemsHeld`. Emit `npc_picked_up:<itemId>`.
4. **Go to target.** The nearest object (by path length, ties by id) in a loaded room
   whose `affordance.accepts` includes T. Prefer the NPC's `needsHome` object if it
   accepts T.
5. **Use.** Dwell `useSeconds`, then emit `npc_used:<targetId>` with `item` set, run
   `onUse[targetId]`, remove the item from `itemsHeld`, and add the target's
   `restores` (or 100 if the target does not `satisfies` N) to N.
6. **Return** to `needsHome`.

How the item got into the world (pre-placed, revealed by `revealOnGlobal` after a
`requiresItem`/`consumesItem` interaction, or a future drop action) is not this
system's concern. The existing reveal path is enough for a first mission. A
general "drop from inventory" action is a separate feature (Q4).

If the player picks the item up again between steps 1 and 3, the job aborts at
step 3 (item gone) and the NPC returns home. Not an error.

---

## 4. Runtime architecture

New module `public/break_escape/js/systems/npc-needs.js`, exporting `NPCNeedsSystem`
and `createSeededRng`. One instance, `window.npcNeedsSystem`, built after the
behaviour manager. It holds per-NPC state only for NPCs that declare `needs`.

```
NeedsState(npcId) {
  levels: {need: 0..100},
  lastSatisfiedAt: {need: needsClockMs},
  job: null | { need, kind: 'use'|'carry', phase, targetId, itemId?, startedAt, moveToken },
  mode: 'idle' | 'job' | 'returning' | 'frozen' | 'suspended',
  rng: mulberry32(seedFor(npcId))
}
```

Hook: call `window.npcNeedsSystem?.update(time, delta)` from the same place
`npcBehaviorManager.update` is called (game scene update), **after** the behaviour
update. The needs system runs on a **fixed step** (section 5.1), not every frame.

The needs system **drives movement only through `goToAndStay`** (extended per 5.3).
It never writes velocities or waypoints itself, so collision avoidance, wall escape,
stall handling and depth sorting keep working as they do.

---

## 5. Runtime design

### 5.1 The needs clock and decay

- `needsClockMs` advances by `min(Δ, 1000)` each frame, where
  `Δ = gameClock.elapsedMs() − lastElapsed`. The clamp stops a background tab,
  a long frame or a reload from dumping minutes of decay at once.
- It does **not** advance while `window.isVmContextActive?.()` is true (NPCs are
  frozen then anyway; otherwise every NPC returns from a VM session urgent at once).
- It **does** advance during conversations and minigames, so a need can become
  urgent during a chat. Servicing is deferred (5.5).
- "perMin" means needs-clock minutes, which run at real speed. The game clock's
  story `rate` and `anchors` are ignored on purpose: they move time of day, and an
  anchor jump would empty every need at once.
- Work happens in **ticks of `NEEDS_TICK_MS = 250`**. Each frame, while the
  accumulator ≥ 250, run one tick: `level -= decayPerMin * 250 / 60000` for every
  need not currently being serviced, then evaluate (5.2). All decisions happen at
  tick boundaries, which is what makes the log reproducible (section 9).

### 5.2 Selector

At each tick, for each needs NPC in mode `idle` (only; see preemption below):

```
urgent = needs where level <= urgentAt
         or (maxUnmetMin && now - lastSatisfiedAt >= maxUnmetMin*60000)
for each urgent need n:
    score(n) = starved(n) ? 1000 + weight
             : weight * (urgentAt - level) / urgentAt        // 0..weight, bounded
candidates = urgent needs that have a reachable, free affordance (or, for seeks
             needs, a noticed tagged item AND an accepting target)
pick max score; ties → declaration order in the NPC's needs block
if none: stay idle (an urgent need with nothing to satisfy it just waits)
```

- **Bounded:** the score is bounded by `weight`, so no need can grow without limit
  and swamp the others. Starvation is handled only by `maxUnmetMin`.
- **Affordance choice** within a need: shortest path length from the NPC, ties by
  object id. No randomness. (Path length can come from a `findWorldPath` result
  length, cached per tick.)
- **Capacity:** an affordance is "free" when fewer than `capacity` NPCs hold a job
  on it. Claims are made in NPC id order within a tick, so two NPCs never race.
- **No preemption.** A job runs to completion (or failure). The selector runs again
  when the NPC is idle. That keeps the maximum delay of any beat to one job length,
  which is easy to reason about. Option for later: a `preemptMargin`.

### 5.3 Driving the move path

Extend `NPCBehavior.goToAndStay(worldX, worldY, speed, opts = {})` (backwards
compatible):

- `opts.owner` **(prov.)**: string, e.g. `'needs'`. Stored as `this._moveOwner`
  and included in the arrival event payload: `npc_arrived:<id>` →
  `{npcId, x, y, owner}`. Existing listeners ignore the new field.
- `opts.yieldToPlayer` **(prov.)**: boolean. When true, the `face_player` branch at
  `npc-behavior.js:796` is allowed even though `_stopOnArrival` is set (the NPC
  pauses for the player and continues once the player moves away). Default false,
  so `patrolOverride` behaves exactly as today.
- Both are cleared in `_triggerGoToStayArrival`.

Also add to `NPCBehaviorManager`: `cancelMove(npcId)`, which clears `_stopOnArrival`,
`_goToStayDest`, path and velocity and sets `patrol.enabled = false` without
emitting arrival. Used when a job aborts.

The needs system listens on the wildcard `npc_arrived:*` once and routes by
`npcId`, acting only when `owner === 'needs'` and the NPC has a job. Arrival does
not restore the need; it starts the use dwell.

Job phases:

```
'use' job:   goto_target → using(useSeconds) → [complete] → returning → idle
'carry' job: goto_item → (pickup) → goto_target → using(useSeconds) → [complete] → returning → idle
```

On **complete**: `level = min(100, level + restores ± jitter)`, set
`lastSatisfiedAt`, emit `npc_used:<objId>` (section 8), apply `onUse`.

On **returning**: `goToAndStay(home, speed, {owner:'needs', yieldToPlayer:true})`.
No need is urgent on the way back, so the stillness rule applies and the NPC
stops for the player. If a need turns urgent on the way back, the selector may
start a new job from wherever the NPC is (it counts as idle-returning for
selection; a new job cancels the return).

`_triggerGoToStayArrival` resets `homePosition` to the arrival point. That is
harmless here: the needs system keeps its own `needsHome`, and
`checkAndHandleHomePush` working off the latest arrival point is what we want while
the NPC is at the coffee machine.

**Failure.** If a job's move has not arrived within
`max(20 s, 3 × straight-line distance / speed)` of needs-clock time, or
`findWorldPath` returns null (the existing patrol code warns and stalls), the job
fails: `cancelMove`, log `job_failed`, put that affordance on a 60 s cooldown for
this NPC, go to `returning`. A failed beat is a log line and a console warning, so
playtests catch it.

### 5.4 Approach cells

The NPC walks to a cell beside the object. Resolution order: `useFrom` offset;
else the nearest walkable world-grid cell within 2 tiles of the object's body centre,
scanning a fixed order (S, E, W, N, then diagonals) so the choice is deterministic.
Use the existing `findNearestWalkableStartCell` logic as the walkability test.
On arrival the NPC faces the object (`calculateDirection` toward the object centre,
`playAnimation('idle', dir)`).

### 5.5 Stillness, urgency and conversation (implementable rule)

Evaluated per needs NPC at each tick, in this order:

```
if behaviour is KO, hostile, or sprite body disabled:   mode = 'suspended' (no jobs, decay continues)
elif mode == 'suspended' by script (section 7):          do nothing
elif inPersonChatWith(npcId):                            mode = 'frozen'
     // inPersonChatWith: the open minigame (MinigameFramework.currentMinigame) is a
     //   person-chat whose npcId === npcId. Prefer that over currentConversationNPCId,
     //   which person-chat swaps transiently. Implementer: confirm the property name
     //   person-chat exposes for its NPC (this.npcId at person-chat-minigame.js:455).
     // on entering frozen: remember job + phase, cancelMove, velocity 0, idle anim facing player
     // the use-dwell timer and the move are paused, not abandoned
elif mode == 'frozen':                                   // conversation_closed:<npcId> seen, or the check above went false
     resume: re-issue goToAndStay for the remembered phase (fresh path from where it stands),
             or continue the dwell; mode = previous mode
elif mode == 'idle':                                     run selector (5.2). Nothing urgent → hold position.
elif mode == 'job':                                      advance job; moves use yieldToPlayer:false (urgent → walks on)
elif mode == 'returning':                                moves use yieldToPlayer:true (not urgent → stops for player)
```

What the player sees:

- Walk up to an idle needs NPC: it faces you (existing `face_player` state, since
  patrol is off) and does not move.
- Walk up while it is heading somewhere because a need is urgent: it keeps going.
  (Talking to it still freezes it: interaction opens the person-chat, which
  triggers `frozen`.)
- Walk up while it is returning home: it stops and faces you; it carries on when
  you leave.
- Mid-conversation a need turns urgent: nothing happens until the chat closes,
  then it leaves.

The behaviour layer also needs one guard: in `NPCBehavior.update`, if the NPC is a
needs NPC and `inPersonChatWith(npcId)`, set velocity 0 and return before
`executeState`. Without it, an in-flight `goToAndStay` keeps walking during the
chat (the `_stopOnArrival` path never pauses). Scope the guard to needs NPCs so no
existing NPC changes behaviour.

Q1 asks whether *other* needs NPCs should also pause while any person-chat or
minigame is open. The default proposed here: no. Only the NPC you are talking to
freezes.

---

## 6. Making emergent beats reliable

No duties layer, so reliability comes from the numbers. These rules are what the
validator checks and what a mission author tunes.

### 6.1 Timing formulas

For a single-need NPC (or the dominant need):

- **First beat** (time until first urgent): `T1 = (initial − urgentAt) / decayPerMin` minutes.
- **Away window** ≈ travel out + `useSeconds` + travel back.
- **Period** between departures:
  `P = (min(100, urgentAt + restores) − urgentAt) / decayPerMin + away` minutes.

Worked example, `caffeine {decayPerMin: 8, urgentAt: 30, initial: 50}`, coffee
machine `restores: 70, useSeconds: 40`, 10 s of walking each way:
T1 = 2.5 min; away ≈ 60 s; P = 70/8 + 1 ≈ 9.75 min. The user's original shape
(no `initial`, so 100) gives T1 = 8.75 min, too slow for a lab. That is why
`initial` exists.

### 6.2 Guarantees

- **A periodic beat recurs** as long as its affordance is reachable: decay is
  monotonic, the selector runs every 250 ms when idle, and jobs are never
  preempted. Worst-case delay after going urgent = the length of one other job
  already in progress (bounded by its travel + `useSeconds` + failure timeout).
- **Starvation guard.** With competing needs, `maxUnmetMin` makes a need win
  outright once it has gone unmet too long. Set it on the beat-bearing need to
  `T1 + 1 or 2` minutes for the first beat and roughly `P × 1.5` thereafter.
- **Curiosity is "always ready".** Give a `seeks` need a high `urgentAt` (e.g. 60)
  and a fast decay (e.g. 40/min, so it is urgent within a minute of any top-up) and
  `initial: 0`. With nothing tagged in the world it is urgent but has no candidate,
  so the NPC holds still. When a tagged item appears in `noticeRooms`, the next tick
  (≤ 250 ms) selects it, unless the NPC is mid-job or in a chat. Worst case is one
  job length. Give it a higher `weight` than routine needs so it wins ties at the
  moment of noticing.
- **Event-triggered re-evaluation.** Ticks every 250 ms make polling cheap, so
  nothing listens for item placement. Keep it that way; it removes a class of
  missed-event bugs.
- **Bounded by design rule:** for any beat a mission relies on, the author states
  a window ("NPC leaves within 4 min of start; collects a placed item within
  60 s"). The validator computes T1/P/worst-case from the numbers and warns when
  the window is not met (section 11).
- **Things that can still stop a beat**, all logged: affordance in an unloaded room
  (Q2), no path (blocked door, prop), the player holding a conversation open,
  the NPC turned hostile/KO, a script suspended needs. The playtest acceptance
  checks (section 12) cover each.

---

## 7. Composing with eventMappings and `patrolOverride`

Scripts win, and the needs system stands aside:

1. A `patrolOverride` arriving on a needs NPC (i.e. `goToAndStay` called with no
   `owner`, or owner ≠ `'needs'`) **suspends** needs for that NPC: the current job
   is dropped (no `cancelMove`, since the script's move has replaced it), any
   carried item is dropped back at the NPC's feet (visible, interactable again),
   mode = `suspended`. Implement by having `goToAndStay` notify
   `window.npcNeedsSystem?.onExternalMove(npcId, owner)`.
2. Needs stay suspended after the scripted move arrives. The NPC stands where the
   script put it, as today.
3. A new eventMapping field `needs` **(prov.)** controls the loop explicitly:
   - `"needs": "resume"`: back to `returning` (walk to `needsHome`) then `idle`.
   - `"needs": "suspend"`: suspend without moving (e.g. while a scripted scene plays).
   - `"needs": { "set": { "caffeine": 0 } }`: set levels. This is how a scenario
     *nudges* a beat while it still plays out through the needs system: the
     NPC goes for coffee because caffeine is now 0, by the normal route and timing.
   Handled in `_handleEventMapping` next to `patrolOverride` (`npc-manager.js:~1124`).
4. **`patrolOverride.resume`:** not needed for needs NPCs. The needs loop issues
   its own next move, and `"needs": "resume"` is the restore. For NPCs *without*
   needs, a `resume` that restores the pre-override patrol config is still a useful
   separate fix, but it is not a prerequisite of this system and is not specified here.
5. `npc_arrived:<id>` keeps firing for needs moves (now with `owner: 'needs'`), so a
   scenario mapping on `npc_arrived:<id>` will see every needs arrival. Mappings
   that only care about scripted arrivals should add a condition on `owner`, or
   listen to the needs events in section 8 instead. Check existing scenarios that
   map `npc_arrived:<id>` (as of 2026-11-04 only `lab_physical_pentest`) when needs is added to the same NPC.

Optional small fix in the same area: `patrolOverride.targetObject` **(prov.)**, an
object id resolved through `window.rooms[*].objects` to world coordinates. This
removes the current-room limitation of `targetTile` for cross-room scripted moves.
Not required by the needs system, which resolves object ids itself.

---

## 8. Extension points (where meaning gets attached)

The needs system emits only generic events through `window.eventDispatcher`. It
never sets mission state except through the NPC-declared `onUse` map.

| Event | Payload | When |
|---|---|---|
| `npc_need_urgent:<npcId>` | `{npcId, need, level}` | A need crosses `urgentAt` (once per crossing) |
| `npc_left_post:<npcId>` | `{npcId, need, targetId}` | A job starts and the NPC leaves `needsHome` |
| `npc_returned_post:<npcId>` | `{npcId}` | It arrives back at `needsHome` |
| `npc_picked_up:<itemId>` | `{npcId, itemId, tag}` | Carry step 3 |
| `npc_used:<objectId>` | `{npcId, objectId, need, itemId \| null, tag \| null, payload}` | A use completes |
| `npc_job_failed:<npcId>` | `{npcId, need, targetId, reason}` | 5.3 failure |

`payload` on `npc_used` is the NPC's `usePayload`, passed through unchanged
(structured-cloned so a listener cannot mutate the NPC's copy). It is keyed to the
**NPC**, so two NPCs using the same object deliver different payloads, and the
object never holds the data. The needs system does not log `payload` contents in
its decision log (it logs `payloadPresent: true`).

The "away from post" window is `npc_left_post` → `npc_returned_post`.

Attaching meaning, without touching the needs system:

- Per NPC: `onUse: { "<objectId>": { "setGlobal": "...", "emitEvent": "..." } }`.
- Per scenario: an eventMapping on any NPC with `"eventPattern": "npc_used:<objectId>"`
  and a `condition` on the payload's `npcId`, or a listener in engine code.
- What a payload contains and what using a given object reveals belongs to the
  scenario author or the separate Cyber Security agent. Those are named hooks
  here and deliberately empty.

---

## 9. Determinism

- **Seed.** `scenario.npcNeedsSeed` **(prov.)** if set; else a stable hash of the
  scenario id. The test bridge can override it. Per NPC:
  `rng = mulberry32(hash32(seed + ':' + npcId))`, so one NPC's draws don't depend on
  how many other NPCs exist or their update order.
- **Use the RNG only for** `jitterPct` (initial levels, top-ups). All other choices
  are deterministic orderings: need declaration order, path length then object id,
  NPC id order for capacity claims. Never call `Math.random()` in `npc-needs.js`.
- **Fixed-step decisions** at 250 ms ticks.
- **Decision log.** Every state change appends
  `{tick, npcId, event, need, targetId, level}` to a ring buffer (last 2000 entries),
  exposed as `window.npcNeedsSystem.getLog()`.
- **What "identical" means.** In *manual clock* mode (test bridge, below) the
  needs clock advances only by explicit steps and moves are completed
  synchronously by the bridge, so the full log, ticks included, is identical for a
  seed. In live play, travel time depends on frame timing and the player's body
  blocking corridors, so the **sequence** of `(npcId, event, need, targetId)` is
  identical for the same seed and player actions, but tick numbers can drift by a
  few ticks. Tests compare the sequence; manual mode compares everything.
- **Test bridge** (`systems/test-bridge/`): `__test.needs.setSeed(n)`,
  `__test.needs.setManualClock(bool)`, `__test.needs.step(ms)`,
  `__test.needs.state(npcId)`, `__test.needs.log()`, `__test.needs.set(npcId, need, level)`.

---

## 10. Persistence

Keep it minimal for v1:

- Need levels are **not** saved. After a reload each NPC restarts from `initial`
  (with the same seeded jitter), so timing after a reload is as predictable as at
  start. Acceptable for lab missions. Q3 asks whether to save levels.
- A carried item that has not yet been used is **not** removed from room state; on
  reload it reappears where it was found and the NPC starts again. The item is
  removed from room state permanently only when the use completes (through the same
  removal sync the player pickup uses; the implementer confirms the call in
  `systems/room-state-sync.js` / `inventory.js`).
- Globals set by `onUse` persist like any global.

---

## 11. Validator and schema

`scripts/scenario-schema.json` and `scripts/validate_scenario.rb` (known fields
list, as done for `revealOnGlobal` in cae4d1ac2):

- Register NPC fields `needs`, `needsHome`, `usePayload`, `onUse`, `needsSpeed`,
  object fields `affordance`, `needsTag`, mapping field `needs`, scenario field
  `npcNeedsSeed`.
- **Errors:** a need with no object anywhere that `satisfies` it (or, for `seeks`,
  no object that `accepts` the tag); bounds violated; `onUse` / `needsHome` naming a
  missing object; an NPC with both `needs` and `behavior.patrol.enabled: true`.
- **Warnings:** an affordance object in a room the NPC cannot reach without a locked
  door; `urgentAt` ≥ `initial` (urgent from the first tick, usually a slip unless
  it is a `seeks` need); computed `T1` and `P` per need printed in the report, with a
  warning when `T1 > 5 min` for any need named in an `onUse` entry.
- Add the new module to every JS test-harness copy list (see the harness list in
  `bin/test-js` and the node test runners), or node tests fail with
  `ERR_MODULE_NOT_FOUND`.

---

## 12. Acceptance tests

Node unit tests (`npc-needs.js` with a stub behaviour manager and manual clock) and
one headless browser check through the test bridge on a small fixture scenario
(not a mission):

1. **Reproducible.** Same seed, manual clock, the same 20 minutes of steps → two
   runs produce byte-identical logs. A different seed with `jitterPct > 0` gives a
   different log.
2. **Opt-out is unchanged.** An NPC without `needs` (with and without a patrol
   `behavior`) has the same position trace over 2 minutes with the needs system
   loaded and absent. `goToAndStay` without `opts` behaves as before (no face-player
   pause, arrival event still fires, payload gains only `owner: undefined`).
3. **Periodic absence.** With `caffeine {8, 30, initial 50}` and a coffee machine
   in the next room: the NPC emits `npc_left_post` within `T1 + 15 s` of start, is
   away for `useSeconds` plus travel, returns, and leaves again within `P + 15 s`.
4. **Curiosity.** Reveal a `needsTag` item in the NPC's room → within 30 s (manual
   clock: within the computed bound) the log shows `npc_picked_up:<item>` then
   `npc_used:<pc>` with `itemId` set and the NPC's own `npcId`; the item is gone
   from the world.
5. **Per-NPC payload.** Two NPCs with different `usePayload` use the same object →
   two `npc_used:<obj>` events whose `npcId` and `payload` differ; the object's
   scenario data is unchanged.
6. **Stillness.** Player stands next to an idle needs NPC for 60 s: it does not
   move. Player stands next to it while it returns home: it stops, then continues
   after the player leaves. While a need is urgent it walks past the player.
7. **Conversation freeze.** Open a person-chat with the NPC mid-walk: velocity 0
   at once; force the need urgent during the chat; nothing moves until
   `conversation_closed`, then the job resumes from where it stopped.
8. **Scripts win.** A `patrolOverride` mapping fires mid-job: the NPC follows the
   script, the needs log shows `suspended`, no needs move is issued until a
   `"needs": "resume"` mapping fires.
9. **Failure is visible.** Block the only path to the affordance: `npc_job_failed`
   within the timeout, NPC returns home, cooldown respected.

---

## 13. Out of scope

- Duties, required-intent lists, or any layer that guarantees a beat outside the
  needs numbers. Reliability comes from tuning (section 6) and the validator.
- Idle wandering or ambient patrol for needs NPCs.
- Any Cyber Security meaning: what `usePayload` holds, what using an object
  reveals, capture stores, or how the player observes it. Those are hooks
  (section 8) for a separate agent.
- A general player "drop item" action (Q4).
- Saving need levels across reloads (Q3).
- Changing `patrolOverride` semantics for NPCs without needs (including a
  `patrolOverride.resume`).

---

## 14. Files to touch

| File | Change |
|---|---|
| `public/break_escape/js/systems/npc-needs.js` | **New.** Needs state, clock, selector, job FSM, seeded RNG, log, events |
| `public/break_escape/js/systems/npc-behavior.js` | `goToAndStay` `opts {owner, yieldToPlayer}` (~2129); arrival payload `owner` (~2201); `face_player` guard honours `yieldToPlayer` (~796); conversation guard for needs NPCs in `update` (~656); `onExternalMove` notify; manager `cancelMove` (~174) |
| `public/break_escape/js/systems/npc-manager.js` | Read `needs`/`needsHome`/`usePayload`/`onUse` into the NPC record (~259); mapping field `needs` beside `patrolOverride` (~1124); optional `targetObject` |
| `public/break_escape/js/core/game.js` (~2378, where `npcBehaviorManager.update` is called) | Call `npcNeedsSystem.update` after it; construct the system at NPC init |
| `public/break_escape/js/systems/test-bridge/` | `__test.needs` API (section 9) |
| `scripts/scenario-schema.json`, `scripts/validate_scenario.rb` | Section 11 |
| JS test-harness copy lists, node tests | New module + tests in section 12 |
| `docs/achitechture/NPC_NEEDS_SYSTEM.md` | Mark implemented; keep the field names in sync |

---

## 15. Open questions for the user

- **Q1.** While the player is talking to one NPC, should *other* needs NPCs keep
  going about their needs (proposed), or pause so no beat happens behind the
  chat window?
- **Q2.** Affordances and tagged items in rooms the player has not loaded yet are
  invisible to the system (rooms load lazily). Proposed: needs only work within
  loaded rooms, and missions put a needs NPC's affordances in rooms that are loaded
  together (or the validator warns). Alternative: preload those rooms.
- **Q3.** Is "levels reset to `initial` on reload" acceptable, or should levels
  be saved through state sync?
- **Q4.** Is the existing `requiresItem`/`consumesItem` + `revealOnGlobal` pattern
  enough for "the player drops an item", or should a general inventory drop action
  be scheduled?
