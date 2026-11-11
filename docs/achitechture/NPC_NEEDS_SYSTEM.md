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
| `deferrable` (slice 14) | bool | true | `false` marks a story need: it ignores the avoid and queue checks (5.8) and goes to the nearest source anyway. Validator warns when set on caffeine, thirst, hunger or rest |

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
| `onUse` | Object id → `{ setGlobal?: name, emitEvent?: name, revealOutput?: producerId }`. Applied when **this** NPC completes a use of **that** object (need or carry). `setGlobal` sets the global to `true`; `revealOutput` shows the producer's next free reveal slot (3.3a) |
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
| `onDeliver` | `"place"`, `"stow"` | `"place"` | What happens to a delivered reveal slot (3.6): set down here, or filed at once (a shredder, a filing cabinet). Plain items are always consumed |
| `placeAt` | `{dx, dy}` tiles | halfway from the centre to the approach cell | Where a delivered slot is set down, from this object's centre |
| `placeSeconds` | 0–3600 | 60 | Needs-clock seconds a placed slot stays before it is filed (0: until a reload). On a producer: how long a cosmetic copy stays when no slot is free |

An affordance carries **no content**.

**Presets by object type (office life slice 4, `OFFICE_LIFE_PLAN.md` 2.1).** With the scenario
field `"officePresets": true`, a declared object gets an affordance from its exact `type`
(`pc`, `laptop`, `coffee_station1`, `kettle1`, `water_cooler1`, `qdc_fridge1`, `microwave1`,
`leather_sofa1`, ...) or from `officeType`, a preset id that wins over `type` (`filing`,
`post_tray` and `desk_phone` are reached only that way). The table is
`public/break_escape/js/data/office-presets.json`; `systems/office-presets.js` resolves it and the
validator reads the same file. The object's own `affordance` fields win field by field, and
`"affordance": false` means none. No preset for an object with no `id`, with `decor: true`
(unreserved Tiled items get a synthetic `scenarioData` whose `type` is the image name), `takeable`,
or with a `lockType`. Presets give default `useSound`s (`drink_gulp` for coffee and the cooler,
`eat_snack` for the fridge and microwave, `drawer_open` for filing), set no `seat`, and never make
a workstation. The live adapter's `listObjects`/`getObject` and the action-icon target lookup all
go through the one resolver (`window.officePresets.spriteAffordance`, cached on the sprite);
`core/game.js` installs it and fetches the table before the needs system starts. The validator
lists each object that gained a preset (`ℹ️ Office preset: ...`), errors on an unknown
`officeType`, and warns about an `officeType` with the switch off.

```json
{ "id": "tom_pc", "type": "pc", "affordance": { "private": true } }
{ "id": "office_coffee", "type": "coffee_station1", "affordance": { "useFrom": { "dx": -1, "dy": 0 } } }
{ "id": "grace_laptop", "type": "laptop", "affordance": false }
```

### 3.3 Item fields (tagged, droppable)

| Field | Meaning |
|---|---|
| `needsTag` (prov.) | One tag string. NPCs with a matching interest are drawn to it |
| `droppable` (prov.) | `true`: clicking the item in the inventory drops it (section 6). Its inventory hover label reads "`<name>` (click to drop)" |

### 3.3a Reveal slots (office life slice 7, `OFFICE_LIFE_PLAN.md` 2.2 Part A)

A **reveal slot** is a declared object with `outputOf: "<producer id>"` and its own
`revealOnGlobal`, which the engine owns: it sets the global `true` when it shows the slot and
`false` when it files it away, so no condition, mapping or other object may use it (validator
error). The slot starts hidden (the usual `revealOnGlobal` rule) and is shown by an NPC's
`onUse` hook `{ "revealOutput": "<producer id>" }` (3.1, `onUse`).

```jsonc
{ "id": "copier_out_b", "type": "notes1", "name": "Printout", "takeable": false, "readable": true,
  "readDisplay": "gameDisplay", "text": "...", "outputOf": "office_copier",
  "revealOnGlobal": "copier_out_b_shown", "needsTag": "printout", "position": { "x": 4.65, "y": 2.9 } }
"onUse": { "sanjay_pc": { "revealOutput": "office_copier" } }       // on the NPC who prints
```

- **Pool.** `revealOutput` takes the producer's first **free** slot by id (free: loaded, not
  destroyed, `active !== false`, global not `true`, not held, placed or in the inventory), sets its
  global, shows it with a direct `showRevealedObject` call (after a reload there is no reveal
  listener), lifts it above the producer's depth and emits `object_revealed:<slotId>`. With no free
  slot, a cosmetic copy (the first slot's texture, else `notes1`) stands on the producer for the
  producer's `placeSeconds` (default 60); nobody can take it. Logs `revealed` (`item`, or
  `reason: "no_free_slot"`).
- **Outcome follows the item's kind.** A plain item (anything not a slot: the parcel, mugs, a
  player drop) is consumed when delivered, exactly as before. A slot is **placed** on the target
  (sprite registered under the room it now sits in, keyed by its object id; `sp.roomId` stays the
  declared room, which is the one a player pickup reports to the server), or **stowed** at once when
  the target says `onDeliver: "stow"`. The `used` log entry gains `outcome: "place" | "stow"`.
  A placed slot is not a carry candidate (`pickable` is false while `_npcPlacedBy` is set). After
  the target's `placeSeconds` the engine files it: hidden at its declared spot, re-inserted into its
  declared room's `objects` under its original key, global `false`, no server call. A slot the
  player took meanwhile is left alone. An abort while carrying a slot files it rather than dropping
  it (the server could not keep a dropped position).
- **Reading.** A readable `notes*` object opened the default way goes through the notes minigame,
  which removes it on first read. A non-takeable readable `notes*` slot must use
  `"readDisplay": "gameDisplay"` (validator error otherwise); it reads in place and cycles for ever.
  A takeable slot is one beat: once taken (or read through the notebook) it is gone server-side.
- **Reload: stow on sight.** Needs state resets, globals do not, so a revealed slot comes back on
  its tray. When the needs system first sees a room (every loaded room at install, later rooms as
  they load) it files every revealed slot nobody holds. The tray is empty after a reload; the next
  print shows a slot again. A taken slot is not in the room payload, so it never comes back.
- `core/rooms.js` exports `showRevealedObject` and `hideRevealedObject` and puts both on `window`
  (the adapter reaches them there, so `npc-needs.js` has no static import of `rooms.js`).

### 3.3b Left-behind items (office life slice 11, `OFFICE_LIFE_PLAN.md` 2.10)

A **left-behind item** is a declared object at an NPC's post with `leftBehindBy: "<npcId>"`, a
`leftBehindChance` (0-1, default 0) and its own engine-owned `revealOnGlobal`. It is a slot by
3.3a's definition (same global rule, same read-in-place rule, same stow on sight).

```jsonc
{ "id": "tom_badge", "type": "id_badge", "name": "Tom's ID badge", "takeable": true,
  "position": { "x": 1.75, "y": 5.25 }, "leftBehindBy": "tom", "leftBehindChance": 0.7,
  "revealOnGlobal": "tom_badge_left" }
```

- **On a real leave** (2.11's rules: own-desk work is not a leave), `s.leaveCount` goes up by one
  and each of the owner's free items (loaded, not taken, not already showing) rolls
  `roll(npcId, "left:<leaveCount>:<itemId>") < leftBehindChance`. A hit shows it at its declared spot
  by a direct `showRevealedObject` call, sets its global, lifts its depth just above the owner's
  `needsHome` object when that is within two tiles (desk dressing shares the desk's depth), emits
  `object_revealed:<itemId>` `{npcId, objectId, leftBehindBy}`, and logs `left_behind`
  `{item, leave}`. `npc_left_post` gains `leftBehind: [ids]` when something was left.
- **On return** (`npc_returned_post`), the owner collects each item it left: hidden, global
  false, declared depth back, no server call; logged `stowed` with `reason: "collected"`. A later
  leave can show it again.
- **Taken by the player:** gone for good (server-side removal, as any takeable item). On return the
  owner logs `left_item_gone` and emits `npc_left_item_gone:<npcId>` `{npcId, itemId,
  playerNearby, playerDistance}` once; the item is never offered again.
- **Reload:** the needs state resets (`leaveCount` 0); an item that was showing is filed on sight.
- **Determinism:** a world without `leftBehindItems` (or a scenario with no such items) rolls
  nothing and logs nothing, so existing decision logs are byte-identical.

### 3.4 eventMapping field

`"needs"` (prov.): `"suspend"` | `"resume"` | `{ "set": { "<need>": level } }`.
Runs after `patrolOverride` in the same mapping.

### 3.5 Scenario field

`npcNeedsSeed` (prov.): number or string. Default: the scenario name.

`needsDebugOverlay`: boolean, default false. Turns on the need-bar debug overlay (section 4.1).

`ttsPregenerateChatter`: boolean, default false. Lets `TtsLineExtractor` list chatter lines for batch
voice generation (5.6a).

`officePresets`: boolean, default false. Affordance presets by object type (section 3.2).

`showPressingNeeds`: boolean, default false. Pressing-need thought bubbles and the no-job icons
`noticed` and `blocked` (section 4.1, slice 3b). The old name `showNpcIntentBubbles` is no longer
read; the validator warns on it.

---

## 4. Runtime architecture

- Module `public/break_escape/js/systems/npc-needs.js` (exists): `NPCNeedsSystem`
  core (pure logic, takes a `world` adapter), `createEngineWorld()` (live adapter),
  `installNpcNeeds()`. No static imports, so node tests import it directly and no
  test-harness copy list needs it.
- Module `public/break_escape/js/systems/item-drop.js` (exists): the drop action.
- `core/game.js` imports both after the behaviour manager loads and calls
  `window.npcNeedsSystem.update(delta)` each frame after `npcBehaviorManager.update`.
- `npc-lazy-loader.js` calls `npcNeedsSystem.register(id)` after each `registerNPC`.
- `isAvailable(npcId)`: true when the sprite exists and the NPC is not knocked out, hostile or
  hidden. `_tickNpc` blocks on it (decay only while there is no sprite), and the workstation
  layer's presence test uses it (`ACCESS_MODEL_PLAN.md` 5.4). `onTick(fn)` runs `fn(system)` at the
  end of every tick, after every NPC; listeners survive `reset()`. The workstation auto lock uses it.
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
Icons show only for NPCs in the player's room while it is lit. An icon's bottom sits 2 px
(`ICON_HEAD_GAP`) above the head: the first opaque row of the NPC's current frame, read once per
texture and frame (`npc-office-visuals.js` `npcIconAnchor`), so it holds for seated frames too. The
80 px frame's top is about 14 px above the head, and a text glyph's backing is sized from the 16 px
font, not the measured line box (an emoji measured 34 px high); together they had the icon
floating clear of the head (fixed 2026-11-06). A text glyph and a sprite never show together. `npc-office-visuals.js` keeps a
carried item visible in the carrier's hand (follows on `postupdate`, behind the body facing
north) and plays an object's `affordance.useSound` when a use completes, heard by distance (silent
at eight tiles) and room (`room-hearing.js`: own room 1, through a door 0.4, else 0), at most one
per second, emitting `npc_use_heard:<objectId>`. Seated NPCs bob 1 px every 600 ms of the needs
clock during a `work` use (`seating.js` `typingBob`, off under reduced motion).

**Icon set and pressing needs (office life slice 3b, `OFFICE_LIFE_PLAN.md` 9).** The defaults are
the 16x16 set `assets/icons/npc-<name>.png` (caffeine, thirst, hunger, rest, social, work,
curiosity, post, printout, print, queue, file, blocked, noticed), referenced by name only; the
fallback stays the text `•`. Lookup keys: a use tries the object id, then `print` (a copier or
printer by preset, `officeType` or type, or a use whose `onUse` has `revealOutput`:
`job.prints`), then the need, `satisfies` and type; a carry tries `file` (a reveal slot carried to
an `onDeliver: "stow"` target: `job.files`), then its tag, then `curiosity`. Every scenario entry
is tried before any default, so the lab's `work` glyph beats the default `print`. With no job, the
action slot shows `noticed` for `NOTICED_MS` (3 s of the needs clock) after
`npc_caught_at_post`, else `blocked` while an urgent need has nothing permitted (`leashNoted`, the
leashed back-off); both only with `showPressingNeeds` or an explicit `actionIcons` entry, so a
scenario that has not opted in looks as before. `queue` is registered for slice 10. `getState()`
gains `pressing` (`{ need, ratio } | null`: needs at or below `urgentAt`, not the current job's
need, lowest `level / urgentAt`, ties by name), `blockedNeed` and `noticed`; the job gains
`prints` and `files`. With `showPressingNeeds`, `pressing` draws as a thought bubble (Phaser
graphics: light rounded backing, two trailing dots toward the head, the need's icon) to the
upper right of the head, clear of the action icon, under the same room/dark rule; below half
`urgentAt` it pulses slowly (off under `prefers-reduced-motion`). Starting a job for that need
removes it from `pressing`, so the bubble goes as the action icon takes over. Tests:
`test/js/npc-pressing-needs.test.mjs`.
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

- Each frame: `Δ` is the frame step the engine passes to `update(frameMs)` (Phaser's smoothed
  loop delta, the step the physics world moves bodies by), or `gameClock.elapsedMs() − last`
  when none is passed (node tests); add `min(Δ, 1000)` to an accumulator. Skip (no
  accumulation) while `isVmContextActive()`. The frame step keeps decisions and walks on one
  timeline: below 5 fps Phaser holds the physics step near one normal frame, and a clock on
  wall time used to run far ahead of the walks, so a walk's deadline passed with the NPC a few
  steps from its post.
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
  carried plain item, or place/stow a carried reveal slot (3.3a); emit `npc_used:<objectId>` (section 7); apply `onUse[objectId]`.
- **Returning:** `goToAndStay(home, {owner:'needs', yieldToPlayer:true})`; on arrival
  emit `npc_returned_post:<npcId>`. **The yield is bounded (2026-11-06):** if the NPC has not
  moved 4 px in `RETURN_YIELD_MS` (3 s of needs clock) it logs `return_resumed` and the walk is
  re-issued with `yieldToPlayer:false`, which also re-plans the path. Before this, the behaviour
  layer's `face_player` (player within 96 px and in sight) had no time limit and also skipped the
  one-tile arrival check, so a player standing near the route or the desk held the NPC in
  `returning` for good: in `lab_physical_pentest` (games 614, 619, 622, 623) staff stood by the
  coffee station or beside their desk for 50 s+ and never sat back down. The walk itself ends
within a tile of home, so seating looks for the post's chair from the home cell
(`seating.js` `needsSeatRef`, `SEATING.md`).
- **A job that ends at the own post is the return.** An NPC that has really left
  (`atPost` false) and arrives at its `needsHome` object for a job there, either a need
  for it that turned urgent on the walk home or a carry that delivers to it (a printout
  taken back to the desk), emits `npc_returned_post:<npcId>` on that arrival, once, before
  the session, and the session then ends without a second emit. On the walk to it
  (`goto_target`) the caught check below runs every tick, as on an ordinary walk home.
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
| walking home | stops and faces player; carries on when player leaves, or after 3 s still (`RETURN_YIELD_MS`) without yielding again | freezes |
| using an object | stays (dwell continues) | freezes, dwell paused |

---

### 5.6 Social pairing, chatter and compatibility (office life slice 8, `OFFICE_LIFE_PLAN.md` 2.4, 7.3)

- **Pairing.** When an NPC enters `using` on an object whose affordance has `chatter: "<pool>"` and
  `capacity` 2 or more, it pairs with a compatible NPC already using that object (one pair per
  object). Both turn to face each other. The first speaker is a seeded roll; then they alternate.
  A lone NPC at a chatter object says nothing. The cooler preset sets `chatter: "cooler"`.
- **Timing.** A line shows for 2.5 s + 50 ms a character, at most 4 s, then a 0.5 s gap, on the
  needs clock. A line starts only if it ends before the first of the two uses does, so a 15 s
  overlap gives three or four lines and a short one gives one. Dwell times never stretch.
- **Pools.** Since slice 15 there are no built-in lines (5.6a): a scenario's `chatter` pools
  (`coffee`, `cooler`, `greet`, `grumble`) and an NPC's own `chatter` lines for that topic make up
  what an NPC can say, and with none it shows picture chat. `"chatter": false` turns chat off
  entirely. A pool is a list or `{ lines, hush, overhearRadius }`.
  `chattiness` (0..1, default 1) is the seeded chance an NPC speaks on its turn. Lines are at most
  40 characters, one line (validator error).
- **Ends** when either NPC is frozen in a conversation, finishes, or is interrupted; the other
  finishes its use in silence. A `hush` pool stops after the current line once the player is
  within 96 px (same room, clear line). Without `hush`, chatter carries on with the player close.
- **Compatibility** (`needsCompany: { groups, avoids }` on the NPC). Two NPCs chat only if neither
  avoids the other and they share a group (or either has none); a group mismatch alone means they
  share the object in silence. An avoidance (an NPC id, `group:<name>`, `"*"`, or
  `{ npc | group, requireGlobal }`) is declared one way and **acts both ways**, and it also stops
  sharing: in `_free`, a capacity-2+ object claimed by someone this NPC avoids, or who avoids it,
  counts as full, so the NPC waits (and emits `npc_avoided`). `requireGlobal` is a name (truthy)
  or `{ name: value }`; it is read when `_free` runs and when a pair forms, so a global that flips
  mid-chat lets the pairing finish. With no `needsCompany` anywhere, `_free` never checks, and the
  decision log is byte-identical.
- **Second user's spot.** The live adapter's `besideCell` puts the second NPC heading for a shared
  object one walkable tile beside the first one's approach cell (right, left, below, above).
- **Bubbles** (`systems/npc-world-bubbles.js`) draw `getState().talking`: the speaker's line in a
  white rounded box above the head. Only for NPCs in the player's room, not while it is dark, not
  under any open minigame, at most four on screen (nearest the player). While an NPC talks its
  action icon and pressing-need thought bubble are hidden. The phone-style barks are separate.
- **Read-outs.** `getState()` gains `talking: { line, partnerId, topic, objectId, remainingMs } | null`
  and `chatPartner`. Chat lines are events only; they are not written to the decision log. The
  decision log gains `avoided` (`avoided`, `target`).
- Nothing is saved; only loaded NPCs chat.

### 5.6a Voiced chatter, scripted exchanges and picture chat (office life slice 15, `OFFICE_LIFE_PLAN.md` section 11)

- **Where lines live.** Barks are strings in a scenario `chatter` pool or an NPC's `chatter`; they are
  voiced by the speaker's TTS voice on first play and cached like any bark. The server accepts them
  (`ScenarioBarkValidator.bark_texts`, `validate_shared`; `/tts` and `TtsExpectedLines`), so the pruner
  and `tts:wasted` never count a chatter clip as unrequested. `ttsPregenerateChatter: true` (scenario)
  makes `TtsLineExtractor` batch-generate them too. Lines are plain text: `{ }` is a validator error.
- **Bag.** An NPC draws from a seeded shuffle-bag per NPC and topic over the pool it speaks (shared
  plus own lines). It refills when empty and a refill never starts with the line just said. Bags are
  in memory only (not saved).
- **Cooldown.** After a spoken line the NPC stays quiet for `chatterCooldownMin` needs-clock minutes
  (NPC field, default 5). Pictures never start or wait for it.
- **Speech lock.** One global lock (`_speechUntil`, across rooms): bark and exchange turns wait for
  it; a turn that waits past the overlap ends the chat as before.
- **Picture chat.** With no line to say (empty pool, bag spent, cooldown running, lock busy) the
  speaker shows a speech bubble holding an icon, 2.5 s (`PICTURE_CHATTER`): coffee: caffeine, social,
  work; cooler: thirst, social, work; greet: social; grumble: avoid. `npc_chatted` fires with
  `line: null, picture`.
- **Exchanges.** NPC field `exchanges: [{ with: "<npcId>" | "group:<name>", knot, requireGlobal }]`
  (the lower id's list is read first). A `knot` is an ink knot on the owner's story whose lines are
  prefixed `Name:` for the other speaker. When a compatible pair meets and the player hears them
  (same room, lit, in range, clear line, checked every turn, so walking up mid-meeting works), the
  first unheard exchange for the pair plays instead of a bark. Every speaker named in the knot must
  be one of the pair, or it is not played. It runs on a separate `inkjs` story (the player's
  conversation state is untouched), one line per bubble (`exchangeLineMs`, at most 6 s), each in its
  speaker's voice through `systems/npc-needs-chatter.js` (`window.npcChatterVoice`; plays only in the
  player's room, volume falls with distance, muted when barks are muted, `log` records every line).
  The pair's overlap is extended by the knot, capped at 60 s. At the end the global `heard_<knot>` is
  set (saved, so once per game survives a reload) and `npc_exchange_heard:<knot>` fires. A meeting
  interrupted mid-exchange leaves it unplayed. Afterwards the same meeting carries on with barks,
  then pictures.
- **Order.** Each turn: unheard exchange (with audience), then a bark (if lines, off cooldown, lock
  free), then a picture. `_grumble` (5.8) uses the same bag, cooldown and lock, and shows `avoid`
  otherwise.
- **Dark rooms.** `playerHears` now needs the NPC's room lit (`roomLevel >= 0.5`), so `overheard`,
  `npc_overheard` (slice 8 and 14) and exchanges do not fire in a dark room.
- **Decision log.** `exchange_started` (`knot`, `with`) and `exchange_heard` (`knot`).
- **Not saved:** bags, cooldowns, the lock. Saved: `heard_<knot>`.

### 5.7 Queues at shared machines (office life slice 10, `OFFICE_LIFE_PLAN.md` 2.5, 7.3)

- **Authoring.** `affordance.queue: { cells: [{dx, dy}, ...], maxWaitSeconds }`: places in line, in
  tiles from the approach cell. The `coffee` preset (coffee stations, kettles) queues two at
  `(-1,1), (-2,1)`; `"queue": false` switches a preset queue off. No queue: the old behaviour (a
  second NPC waits at its post).
- **Choice.** A queue is an option only when the need has no free, permitted, reachable target: a
  free machine in another room still wins (the showcase's long way to the kitchen is unchanged).
  The nearest claimed machine with a queue place for this NPC is chosen; the job starts in phase
  `queued`, logs `queued` `{target, place}` and emits `npc_queued:<objectId>`
  `{npcId, objectId, need, place, playerNearby, playerDistance}`.
- **Order and places.** Claim order (a system-wide sequence; ticks run in NPC id order, so it is
  deterministic). Each queuer takes the first cell that is in a room it may enter (leash,
  `needsPrivateTo`) and that nobody ahead of it holds; with none left it waits at its post instead.
  Live cells snap exactly to a walkable 8 px cell (`findNearestWalkableWorldCell` radius 0); a cell
  on furniture is dropped. Queued jobs do not count as claims; while a queue exists only its front
  may take a freed place, so nobody jumps the line.
- **Advancing and leaving.** The front takes the machine as soon as `_free` allows (log
  `queue_front`); the rest step up. A queuer leaves (log `queue_left` with a reason, then walks
  home) when its need is met some other way (`need_met`), after `maxWaitSeconds` (default 30,
  counted from joining, paused while frozen in a conversation; `max_wait`, and that machine is
  skipped for 60 s), or when no permitted cell is left (`no_queue_cell`). A queuer that cannot reach
  its cell by the move deadline fails the job (`timeout`) as any job does.
- **Queue chatter.** The NPC using a machine with a `chatter` pool pairs with the first queuer once it
  stands in its cell within 1.5 tiles (48 px) of the approach cell, with 5.6's turn-taking, timing,
  overhearing and hush; the line must end before the user's use does. Only compatible pairs (7.3):
  an avoided or group-mismatched front queues in silence, and the second in line never chats.
- **Icon.** While queued the action icon is `queue` (`icon:npc-queue`, an hourglass) whatever the
  machine; a scenario `actionIcons.queue` entry overrides it. The pressing-need bubble does not show
  the need being queued for.
- **Arrival (slice 10 fix, shared `npc-behavior.js`).** Needs moves to a use, queue or pair cell pass
  `arriveWithin: 6` to `goToAndStay`, so the NPC walks on to the cell instead of stopping up to a
  tile short (the old 1-tile guard, which put cooler pairs two tiles north of the cooler and half
  overlapping). The 1-tile stop still applies after 1.5 s held inside the tile (cell occupied).
  Walks home are unchanged. The cooler preset now stands its users in front (`useFrom 0,1`): the
  cooler sprite has no body, so its own cell was walkable and an exact arrival stood on it.
- **`expectedAwayMs` (slice 11).** For a queued job, `npc_left_post`'s estimate adds
  `ceil(place / capacity) × useSeconds` to the walk and the dwell (place 1 is first in line).
- **Validator.** Malformed `cells` (error); `maxWaitSeconds` not positive, a queue on an object that
  satisfies nothing, a cell within a tile of a wall that has a door, a cell outside the room
  (warnings; plus one per NPC that needs the machine and may not enter the neighbour room). A
  capacity-1 chatter object with a queue no longer draws the "needs capacity 2" warning.

### 5.8 Avoidance at a distance, balking and parked needs (office life slice 14, `OFFICE_LIFE_PLAN.md` section 10)

- **Fields.** `needsCompany.avoidRadius` (tiles, 0 to 10; default 2 only for an NPC that declares
  `avoids`, otherwise 0, which keeps the slice 8 rule), `maxQueue` and `needsDeferMin` (minutes, default
  4) on the NPC record, `deferrable` on a need (3.1). `maxQueue` is the number already in a line at
  which this NPC will not join; no value means no limit.
- **Unacceptable targets (selector).** A source is skipped when an NPC this NPC avoids (the relation
  holds both ways, and any NPC counts, needs or not) is using it, queued for it, or stands in the same
  room within `avoidRadius` tiles of its approach cell; or when joining its queue would break
  `maxQueue`. The NPC's own `needsHome` object is exempt. The next acceptable source is tried. A story
  need (`deferrable: false`) skips both checks.
- **Re-check.** While committed (`goto_target` or `queued`) the NPC re-checks each needs tick and
  acts only when who is there has changed. It turns back at most once per need episode (first turn-back
  until the need is met), so the fallback or a retry never turns back twice.
- **Turn-back.** Logs `turned_back` `{need, target, reason, avoided}`, emits
  `npc_turned_back:<npcId>` `{npcId, need, targetId, reason, avoidedId?}` (`reason` `avoid` or `queue`),
  grumbles (a speech bubble from the `grumble` pool, `npc_overheard` only, no chattiness roll), aborts
  the job and falls back through the selector with the abandoned source left out of that one choice.
  After the grumble the thought bubble shows the avoided person's face beside a storm cloud for 4 s.
- **Parking.** When nothing acceptable is left the need parks: its level holds at `urgentAt + 1` (decay
  paused, so no starvation), the NPC goes about other needs or returns to its post, and the bubble is
  a greyed need icon (alpha 0.5) with a badge: `closed` (a door, `no_source`), `queue` (red cross) or
  the storm cloud (`avoid`). Log `parked` `{need, reason, avoided?, target?}`, event
  `npc_need_parked:<npcId>` `{npcId, need, reason, targetId, avoidedId?, untilMs}` with `reason`
  `no_source`, `avoid` or `queue`. Busy sources (claimed, cooling down) still mean wait, not park, and a
  leash that leaves nothing permitted keeps the slice 2a `blocked` behaviour.
- **Release.** After `needsDeferMin` (timer), or sooner when a room loads or a door opens
  (`door_opened`, woken). The level is set to `urgentAt` and the need is selected at once; the unmet
  clock shifts by the time parked. Wakes are staggered by id order: 1 s, then 0.5 s per further parked
  NPC. A `needs: {set}` mapping on a parked need unparks it first. Log `unparked` `{need, reason}`
  (`timer`, `woken`, `set`).
- **State.** `getState(id).parked` lists `{need, reason}`; `.avoiding` holds the avoided id while the
  face bubble shows. A thought bubble picks avoid, then pressing, then parked.
- **Compatibility.** Nothing changes for scenarios with no `needsCompany`, no `maxQueue` and sources
  that are always loaded. The sims-day golden log is byte-identical. `no_source` parking reaches every
  needs NPC (the lab regression, game 693, showed no `parked` or `turned_back` entries).

### 5.9 Judged uses, failures, visits and the kick (access slice 9.2, `ACCESS_MODEL_SLICE_9_2_PLAN.md` sections 5 and 7)

Author-facing rules are in `README_scenario_design.md`, "Work, frustration and workarounds". Code:
`systems/npc-work.js` (the verdict), `systems/npc-needs.js` (the hooks below) and
`systems/npc-reports.js` (the server reports).

- **Judged needs.** `work` for an NPC whose record carries a server `work` plan (a resolved list
  of resource ids with `kind`, `admitted`, `downIf`, `object` and, with networks, `routes`), and
  `social_media`. Every other use is unchanged: `npc_used` gains `met` only for a judged need, and
  a coffee or carry use's payload is as before.
- **The judged use.** `_completeJob` asks the adapter's `useVerdict` (`npcWork.useVerdict`) when the
  use ends. Met: the restore applies, `npc_used` carries `met: true` and an ease is reported. Failed:
  nothing is restored, no `npc_used` or `onUse` hook, `revealOutput` is skipped, `npc_use_failed:<npcId>`
  fires with `{ npcId, objectId, need, missing, station }`, and the job ends through
  `_turnBack(s, 'failed')`.
- **The `failed` turn-back.** `TURN_BACK.failed` grumbles, takes no fallback and parks the need for
  `needsDeferMin` (the park is the retry wait). The park records `targetId`, `wakeOn` (the globals
  whose clearing would fix the causes) and `missing`; `npc_need_parked` carries them. `onGlobalChanged`
  wakes such a park only when its recorded causes would now pass (`reachable` for an `unreachable`
  one); a door, a room load or another object coming back on does not (`_wakeParked` skips failure
  and `held` parks). A `no_access` park always waits out its time. The other needs drain by the
  plan's `breakDrain` (10 when the NPC has no plan, as for a `social_media` need; never more than
  50). A failure park (`failed`, `off`) shows the `closed` badge, as `no_source` does.
- **The `off` park.** `_giveUpReason` answers `off` for a judged need whose own station (its
  `needsHome`) is off, before the null returns, so the NPC never sits at a dead PC and never walks to a
  colleague's desk: a judged need takes no desk but its own (`_useCandidate`, `_queueCandidate`). The
  `off` park is counted (one report, one `station_fail` grumble, the drain) and is woken one use time
  after the station comes back on.
- **Re-arm.** A fail after a wake or a met use carries `rearmed`, so the server measures it from the
  use floor instead of the park floor; one after a timer expiry does not.
- **Visits.** `enqueueVisit(npcId, { kind, at, useSeconds, data })` queues a walk the selector did
  not choose: `at` is `{ objectId }` or `{ npcId }`. An idle or returning NPC starts the first
  reachable visit before the selector runs; a running job is never interrupted. A visit claims
  nothing (`_claims` skips it), honours the leash, ignores `private`, restores nothing and fires no
  `npc_used`; it emits `npc_visit_done:<npcId>`, and a check visit also `npc_checked:<objectId>`. A
  place not loaded is retried each second; a check visit is dropped after 60 s of the needs clock, a
  workaround visit after 120 s (`npc_visit_dropped:<npcId>`). The first `down` failure for a resource
  with an `object` queues one check visit per outage.
- **The outage kick.** `_tickKick` watches, for each NPC with a `work` plan (or a `social_media`
  need and `"phone": false`), the plan's `downIf` and route globals and the station's `offWhen`.
  When one turns on, or is on at `register`, the need's level drops to `urgentAt` (never raised),
  once per change, so the NPC tries within about one use time. A parked need is not kicked; a kick
  seen while the home is provisional waits until the home resolves.
- **Mutters are grumbles.** `_grumble(s, objectId, reason, topic, { ignoreCooldown, icons })`.
  For a judged need `_grumbleTopic` picks, from the `tell` held at the failure, `work_fail_fed_up`
  at `tell` 2, else the cause's own pool (`station_fail`, `work_fail_no_access`,
  `work_fail_<kind>`), else `work_fail`; with no line the topic stays the cause's pool for its
  `PICTURE_CHATTER` picture. `mutter(npcId, topic)` is the public entry the workaround runner uses.
  It emits `npc_mutter:<npcId>` with what was shown, whether or not the player heard it. A topic
  with lines that finds the speech lock taken (a workaround's hand-over arrives in the answer to
  the failure whose own grumble still holds it) waits for the lock, up to `MUTTER_WAIT_MS` (8 s of
  the needs clock), and is then said; only after that wait does it fall back to its picture.
- **Workarounds (sub-slice B).** `systems/npc-workarounds.js` runs what the server hands over.
  The needs system emits `npc_workaround_due:<npcId>` with `{ npcId, run, level }` for a `run` in
  an answer to `POST /npc_frustration`, and with `restored: true` for each `pending` run in
  GET /scenario once the NPC registers (a run that arrives before registration waits for it). The
  runner says the start line (`mutter(npcId, 'wk_<kind>')`, none for `emit`), emits
  `npc_workaround:<npcId>` `started`, performs it (`writes_down`: an at-post `workaround` visit to
  the NPC's own `needsHome`, 6 s; `prop_door`: a visit to the prop, 4 s; `emit`: the event with
  `{ npcId, level }` and no visit), then on `npc_visit_done` sends `POST /npc_workaround` with
  `index` and `hand` (on `npc_visit_dropped`, or a visit that cannot be queued, `dropped: true`).
  A lost request is resent, a 425 after the dwell, a 403 ends it (`ended`). The answer is applied
  once per hand-over: the sticky note mark, the propped room (every loaded door sprite to it
  opened, as `NPCGameBridge.unlockDoor` does), the `setGlobal`; then `done` (or `dropped`) and,
  for a prop, `door_propped:<roomId>`. On a load `restore(npcFrustration)` sets every done
  workaround's `setGlobal` again and remembers every propped room (`done[].door`);
  `syncRoom(roomId)`, called by `loadRoom` after each room is built (and for the start room),
  opens that room's door sprites to a propped room, so the door looks open after a reload.
- **Frustration.** `applyFrustration(answers)` queues the server's answers (`[{ npcId, level, tell, settled, ... }]`) for the next tick;
  `restoreFrustration(map)` applies GET /scenario's `npcFrustration` at `register`, with each
  need's `hold` as a `held` park (silent, uncounted, not woken by a door) so a reload does not send
  a fail the server would refuse. A level handed over before the NPC registers is applied when it
  does.
- **State.** `getState(id)` adds `frustration`, `tell`, `settled`, `failed` (`{ need, missing }`
  for 4 s of the needs clock after a counted failure, else null), `visits`, `visiting` and
  `judged`. The decision log adds `failure_counted`, `frustration` and `visit_done`.
- **Compatibility.** A scenario with no `resources` and no `social_media` need judges nothing: its
  decision log is unchanged (the `needs-sims-world` fixture's log is byte for byte the same), and the
  needs regression captures on `test_needs_sims`, `test_npc_needs` and `test_needs_leash` show no
  difference.

## 6. General drop action (exists)

- An inventory item with `"droppable": true` is dropped when clicked in the
  inventory (branch in `handleObjectInteraction`, before consumables).
- It lands at the player's feet, snapped to a walkable cell, in
  `window.currentPlayerRoom`, as an ordinary takeable world object (the player can
  pick it up again) with its scenario `id` and `needsTag`.
- Emits `item_dropped:<itemId>` `{itemId, tag, roomId, x, y}`.
- **Hover label (2026-11-10).** A droppable item with a `name` and no `triggerOnInteract` shows
  "`<name>` (click to drop)" when the mouse is over it in the inventory (`inventoryHoverLabel`,
  `systems/inventory.js`). A touch screen has no hover, so a task title or the item's own
  `observations` should carry the instruction too.
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
| `npc_left_post:<npcId>` | `{npcId, need, targetId, expectedAwayMs, playerNearby, playerDistance}` (`need` null for an interest job; `expectedAwayMs` includes the queue wait, 5.7; `leftBehind: [itemIds]` when something was left, 3.3b) |
| `npc_returned_post:<npcId>` | `{npcId, playerNearby, playerDistance}` |
| `npc_caught_at_post:<npcId>` | `{npcId, objectId, playerDistance, inMinigame}` (5.3) |
| `npc_picked_up:<itemId>` | `{npcId, itemId, tag}` |
| `npc_used:<objectId>` | `{npcId, objectId, need, itemId, tag, payload, playerNearby}` |
| `npc_job_failed:<npcId>` | `{npcId, need, targetId, reason}` (`timeout`, `no_approach`); `{npcId, need, targetId, itemId, reason: "item_gone"}` when the player took the item an NPC was fetching (slice 7) |
| `object_revealed:<slotId>` | `{producerId, npcId, objectId}` (a reveal slot shown by `revealOutput`, 3.3a); `{npcId, objectId, leftBehindBy}` for a left-behind item (3.3b) |
| `npc_left_item_gone:<npcId>` | `{npcId, itemId, playerNearby, playerDistance}` (back at the post, the item it left was taken, 3.3b) |
| `npc_placed:<itemId>` | `{npcId, itemId, targetId, roomId}` (a delivered slot set down, 3.3a) |
| `item_dropped:<itemId>` | `{itemId, tag, roomId, x, y}` (drop action) |
| `npc_arrived:<npcId>` | existing, now plus `owner` (`'needs'` or undefined) |
| `npc_use_failed:<npcId>` | `{npcId, objectId, need, missing: [{id, why}], station}` (a judged use failed, 5.9) |
| `npc_use_refused:<objectId>` | `{npcId, objectId, itemId, tag, usbClass}` (a USB policy refused a carried device) |
| `npc_checked:<objectId>` | `{npcId, objectId, data}` (a check visit reached the broken thing, 5.9) |
| `npc_visit_done:<npcId>` / `npc_visit_dropped:<npcId>` | `{npcId, kind, at, data}` (5.9) |
| `npc_frustration_changed:<npcId>` | `{npcId, level, previous, tell}` (the server's answer moved the level, 5.9) |
| `npc_mutter:<npcId>` | `{npcId, topic, line, picture}` (a mutter was shown through `mutter()`: a workaround's start line, 5.9; heard or not) |
| `npc_workaround_due:<npcId>` | `{npcId, run, level}`, plus `restored: true` for a hand-over from GET /scenario's `pending` (5.9) |
| `npc_workaround:<npcId>` | `{npcId, index, do, phase}`; `phase` is `started`, `done`, `dropped` or `ended` (with `reason`: `refused` after a 403, `gave_up` after six tries) (`systems/npc-workarounds.js`) |
| `door_propped:<roomId>` | `{roomId, npcId}` (a `prop_door` workaround is done and the room is open) |

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

- `npc_chatted:<objectId>` `{ speakerId, partnerId, topic, lineId, line, objectId, overheard,
  playerDistance }` for each chat line (slice 8). `overheard`: the player within `overhearRadius`
  (default 160 px; set on the object's affordance or the pool) in the same room with a clear line.
- `npc_overheard:<speakerId>` with the same payload, only when `overheard` is true.
- Slice 15: `npc_chatted` also carries `picture` (an icon name, with `line: null`) for picture chat
  and `exchange` (the knot) for an exchange line. `npc_exchange_heard:<knot>` `{ knot, ownerId, npcIds,
  objectId }` fires when an exchange finishes, once per game (global `heard_<knot>`).
- `npc_turned_back:<npcId>` `{ npcId, need, targetId, reason, avoidedId?, playerNearby, playerDistance }`
  when an NPC gives up a source it was walking to or queued for (5.8).
- `npc_need_parked:<npcId>` `{ npcId, need, reason, targetId, avoidedId?, untilMs }` when a need parks (5.8).
- `npc_queued:<objectId>` `{ npcId, objectId, need, place, playerNearby, playerDistance }` when an
  NPC joins a queue (slice 10); `place` is 1 for the front. Queue chat lines are `npc_chatted:<objectId>`.
- `npc_avoided:<npcId>` `{ npcId, avoidedId, objectId }` when `npcId` was refused a shared object
  because of an avoidance (either way); once per pair and object until the NPC next starts a job.

**Workstation events** (`systems/workstation-state.js`, for an object with `workstation: true`
and an owner; the screen rule is `ACCESS_MODEL_PLAN.md` 5.4):

| Event | Payload |
|---|---|
| `workstation_owner_left:<objectId>` | `{objectId, ownerId, screenLocked, reason}` (`reason`: `needs`, or `ko` for a knock-out) |
| `workstation_owner_returned:<objectId>` | `{objectId, ownerId, wasLocked}` |
| `workstation_auto_locked:<objectId>` | `{objectId, ownerId}` |

`wasLocked` (2026-11-10) is the screen's state just before the return cleared it, so a mapping can
tell "came back and typed a password to unlock" from "came back to an open screen":
`"condition": "data.wasLocked === true"`. A station whose room loaded after its owner left is
rolled before the field is read, so it does not depend on whether anything asked first.
`window.workstationState.isLocked(objectId)` answers "owner away and screen locked" without
emitting anything. These three events also drive the locked-screen look and the lock and unlock
sounds (`systems/screen-states.js`): a workstation whose sprite key has a `<key>_locked` texture
(today `"sprite": "pc_desktop"`, locked look `pc_desktop_locked`) shows the padlock while its owner
is away with the screen locked and the player holds no password session there; any other base
keeps its picture and still gets the sounds. See `README_scenario_design.md`, "Workstation
screens".

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
- Reveal slots and left-behind items showing before the reload are filed on sight (3.3a, 3.3b):
  hidden, global false. Placed positions are client only and are not restored. `leaveCount`
  restarts at 0, so the left-behind rolls replay from the first leave.
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
- A workstation found after its owner left (its room loaded late) is rolled when first asked
  about (`isLocked`, a click, or the owner's return), and that roll writes the same two globals
  (2026-11-10), so the dots and any text variant agree with the screen. An auto lock time already
  past at that moment locks the screen at once, with no event and no sound.
- The locked-screen look and its sounds (`systems/screen-states.js`) are silent on load: after a
  reload every owner is at their post, so every screen shows its base picture and nothing plays.
- The same two globals drive the workstation indicator dots in `lighting.js` (office life slice
  5, `OFFICE_LIFE_PLAN.md` 2.3): blue while locked, a breathing white dot while the owner is away
  and the screen open. Nothing is saved for them; after a reload they follow the reset globals.

---

## 11. Validator and schema (implemented 2026-11-05: `scripts/validate_npc_needs.rb`)

`scripts/scenario-schema.json` (insert as text; do not re-serialise the file, which
reformats ~10k lines): NPC `needs interests needsHome needsSpeed usePayload onUse`;
item `affordance needsTag droppable`; eventMapping `needs`; top level `npcNeedsSeed`.

`scripts/validate_scenario.rb`: add the same names to the known-field lists
(`known_npc_fields`, `known_item_fields`, `known_event_mapping_fields`,
`known_top_level`). Put the checks in a new `scripts/validate_npc_needs.rb`
(`require_relative`, like `validate_social.rb`) called from the common-issues list:

- **Reveal slots (slice 7):** errors for a slot without `revealOnGlobal`, an `outputOf` or
  `onUse.revealOutput` naming no object, a slot global shared with another object or used anywhere
  else, and a non-takeable readable `notes*` slot without `readDisplay: "gameDisplay"`; a warning
  for `onDeliver` on an object whose `accepts` reaches no slot's `needsTag`, and for a
  `revealOutput` producer with no slots; an info line per producer with its takeable beats.
  `validate_scenario.rb` skips its pinned-proximity warning for a slot and its producer, or two
  slots of one producer (they share the tray on purpose).
- **Left-behind items (slice 11):** errors for `leftBehindBy` naming no NPC or an NPC without
  `needsHome`, `leftBehindChance` not a number from 0 to 1, no `revealOnGlobal`, a shared or
  used-elsewhere global, both `outputOf` and `leftBehindBy`, and a non-takeable readable `notes*`
  item without `readDisplay: "gameDisplay"`; warnings for no `leftBehindChance` (never left),
  `leftBehindChance` without `leftBehindBy`, and an item in a room other than its owner's post;
  an info line per item saying whether it is a single beat (takeable) or repeats. Schema:
  `leftBehindBy`, `leftBehindChance`.
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

**As built now (2026-11-10; the names and the trigger above are the first build's).** The
receptionist is Chris Hampshire (`hampshire`) at Ledgerwell, and his sign-in details live in
`creds`, which the server keeps out of room data. The capture no longer rides `npc_used:staff_pc`.
`staff_pc` is a workstation that locks on every leave (`"locksScreenOnLeave": true`, sprite
`pc_desktop`, so it shows the padlock), and Chris's mapping listens for his return to the locked
screen:

```jsonc
{ "eventPattern": "workstation_owner_returned:staff_pc",
  "condition": "data.wasLocked === true && globalVars.kp_deviceA_set === true",
  "onceOnly": true, "cooldown": 0,
  "addCapture": { "targetId": "hampshire", "kind": "credential",
                  "address": "c.hampshire", "host": "LW-RECEP-01", "note": "..." },
  "setGlobal": { "kp_creds_captured": true }, "bark": "Right, password again." }
```

The event carries no `usePayload`, so the address and host are written in the mapping; the server
matches the address to his `creds` and serves the password through `/capture_secrets`. The plant is
still `requiresItem` with `consumesItem` on `staff_pc`, now with `requiresItemHintVariants` giving
one refusal hint per state (no kit, planted, planted and locked, captured), because every click
after the plant is a refusal. Such a plant cannot sit on a `lockType: "login"` PC, which returns
before `requiresItem` is read: a scenario that later signs in with the captured password puts the
plant on a separate object (`README_scenario_design.md`, "Item plants"). Melanie Pierce at the next
desk (`staff_pc_2`, a sign-in PC with `"locksScreenOnLeave": false`) is the open half of the
contrast: her session is claimed while she is away, on `workstation_accessed:staff_pc_2`. Chris's
`caffeine.initial` is 90 and hers 100, so he always leaves first.

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

**As built now (2026-11-10).** The finder is Sofia Lord (`lord`), the BadUSB is `kit_deviceB`
(tag `tag_deviceB`) and there is a fourth device, the charging cable (`dev_cable`). Only the
BadUSB's drop completes `drop_usb` (one mapping on `item_dropped:kit_deviceB` in `open_plan`, which
also sets `kp_usb_dropped`); the other devices still earn their own findings on use. Her interest
covers the whole room and an interest has no notice distance, so the texts say "anywhere on the
open-plan floor". She speaks when she picks the BadUSB up (`npc_picked_up:kit_deviceB`) and when
she plugs it in.

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

**Len turns back at a barred gate (door-gates.js + npc-behavior.js, 2026-11-06).** The
records door is a gate (`openFor:["len"]`, `playerMayPassIf:"courier_ready"`). `_playerBarred`
keeps it shut, with no guard override, while an undisguised player's body centre is within
`openRadius` (56 px): staff don't badge through with a stranger at their shoulder. A shut gate
is a wall in the pathfinding grid, so a barred crossing used to trap Len on either side (his
route leg retried every 2 s for ever, his patrol stopped and `len_at_door` never re-fired).
Now, when a near `openFor` guard whose route leg wants him across the gate
(`NPCBehavior.wantsToCrossGate`: his route segment is in the gate's other room) has been held
for `GUARD_TURN_BACK_MS` (5 s), door-gates calls `turnBackFromGate`: he glances at the player,
resumes his route at the next segment in the room he stands in (Len inside records walks his
records loop again; Len on the floor walks back to his dwell point), and tries the door on his
next cycle. Event `door_gate_guard_turned_back` (`npcId`). A guard who only dwells beside the
gate is never timed. A guard physically in the doorway is never shut in, by the barred close or
by a forced `closeDoor`; a path merely planned through the door no longer holds it open past a
barred player. (Commit 1e6e6dbba's earlier fix opened the gate for him after 5 s instead, which
let an undisguised camper follow him in; replaced in 7721dcf50.)

The PIN surf is unaffected: it needs the gate open (`len_at_door`) and the player within 64 px
of the door by sprite centre, in Len's view; the bar measures the body centre (about 31 px
lower) against 56 px, so the player can watch from just outside the bar. The badge-reader
fallback works from about 85 px. Live, game 671: passive surf fired with the body 57 px from
the gate; a camp at 46 px kept the gate shut for 122 s while Len turned back 7 times; with the
hi-vis on, his next crossing opened beside the player and `tailgate_in` completed (score 100).

**As built now (2026-11-10).** The scenario file is the reference; what changed from the text
above:

- **The credit needs the cover.** `tailgate_in` is a `manual` task. It completes, with
  `kp_badge_tailgated`, on `room_entered:secure_area` while `len_at_door` and `courier_ready` are
  both true, or, with `kp_records_cloned`, on `door_gate_player_opened`. An entry with no hi-vis
  and no clone earns nothing, Len's challenge recurs (at most every 20 s, only while the gate is
  open for him) and Ruth's debrief sends the player back out.
- **`len_at_door`** is set and cleared with `"cooldown": 0` and reset to false on `game_loaded`,
  because the global is saved while the gate is rebuilt shut.
- **The PIN is read from the ledger shelves**, not from Len's sight event: a click on
  `ledger_shelves` (about 100 px from the door, outside the gate's radius and his 64 px challenge
  circle) emits `player_watched_reader`, credited while `len_at_door` is true and `courier_ready`
  is false.
- **The gate's `openRadius` is 72** (default 56), so Len, who ends his loop inside records about
  62 px from the door, is always in reach of it.
- **Guard recovery (door-gates.js, npc-behavior.js).** A guard held at his shut gate by a barred
  player for `GUARD_TURN_BACK_MS` (5 s) turns back and tries again next cycle (12.3 above; there
  is no priority open). When the gate does open it tells its guards (`gateOpened`), so a waiting
  path request lands at once; and a routed guard whose next leg is unreachable walks to the spot
  in front of his own shut gate (`approachPoint`). So a player standing at the door, or pushing
  Len along the wall, cannot stop his patrol for good.
- **A click on a gate door** is `granted` (a held clone), `pass` (open to the player: nothing
  shown) or `denied` (the refusal with the door's hint) (`DoorGates.clickOutcome`).

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