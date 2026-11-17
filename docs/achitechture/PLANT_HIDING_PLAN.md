# Hiding a planted device in any plant: plan

Status: built (H1 to H5 and two review rounds are on main; update 2026-11-17). The build log is the "Plant hiding build" section of `PHYSICAL_PENTEST_DEVICES_BUILD_LOG.md`. The text below is the original plan. Source: decision D68 ("Maybe the item could also be hidden in any plant? Rather then just this one? Just overlay the device at a % offset?"). Builds on the physical pentest rogue AP (devices plan A1 to A3, `docs/achitechture/PHYSICAL_PENTEST_DEVICES_PLAN.md`, build log A1 and A3 sections). Start the build only after `build/pentest-a3` is on main: the reception dressing, the `rogue_ap_pot` swap and the LED emitters this plan replaces live on that branch.

Paths: JS under `public/break_escape/js/`, Ruby models under `app/models/break_escape/`, `lab:` is `scenarios/lab_physical_pentest/scenario.json.erb`, `dev:` is `scenarios/test_access_devices/scenario.json.erb`.

## 1. How planting works today

Three plant flows exist. Only the first is in scope.

- **Object plant (rogue AP, keylogger, rogue USB).** A room object with `requiresItem`, `consumesItem` and a `triggerOnInteract` list. `handleObjectInteraction` (`systems/interactions.js`, the `hasTriggerOnInteract` branch) finds the held item, runs the actions (the lab's `set_global ap_planted`), removes the item from the tray and calls `sendInventoryRemove(id, { usedOn: <object id> })` (`systems/apply-actions.js`). The server's `POST /inventory` `remove` branch (`games_controller.rb`) calls `record_planted_item!` (`capture_proofs.rb` lines 24 to 55), which appends `{ item, on }` to `player_state['plantedItems']` when the item is held and not forged, `planted_target_object` finds a top-level room object with that id (`capture_proofs.rb` lines 974 to 986), `CaptureModel.object_takes_item?` holds (`lib/break_escape/capture_model.rb` lines 415 to 435), the USB policy allows it and the room is unlocked. The removal happens whether or not the plant was recorded. Two lookups disagree on what "the item" is: the held lookup matches an inventory entry's `scenarioData.id` (`capture_proofs.rb` lines 28 to 36), while `remove_inventory_item!` matches the entry's top-level `id` (`game.rb` lines 766 to 771).
- **Jack plant (drop box).** `networkJack: true` objects go to `networkLinks.interactJack` (`systems/network-links.js`): confirm, `POST /network/plant`, the jack swaps to its `plantedSprite` (`applyJackLook`), and the foothold is recorded server-side. Not affected by this plan; a drop box needs a jack, not a plant.
- **Keylogger on a PC.** The object plant flow above, on a PC. Not affected.

The rogue AP today (A3) is two scenario objects on one tile in reception:

- `rogue_ap_spot`, the hiding spot: a `pc` object with sprite `rogue_ap_pot` that swaps to `rogue_ap_planted` through `spriteVariants` once `ap_planted` is true, with `requiresItem: kit_rogue_ap`, `consumesItem` and `triggerOnInteract: [set_global ap_planted]`.
- `planted_rogue_ap`, the console: same position at `elevation: 3`, `revealOnGlobal: "ap_planted"` (hidden until the global, `core/rooms.js` reveal helpers), `wifiTwin: true` (its click opens the `rogue-ap` minigame), with `apScan`, `apPortal` and `apCaptureLog`.
- The LED is a room `lighting.emitters` entry keyed by the console id (`planted_rogue_ap`, blink, `above`, offset -4, 3 from the sprite centre). Emitters follow any sprite in `rooms[roomId].objects` whose `scenarioData.id` or `objectId` matches the key, or whose texture key starts with an `EMITTERS` prefix (`systems/lighting.js` `variantsFor`, `buildEmitters`).
- After the plant both objects are tappable on one tile, so a tap opens a two-item pick-one menu (build log A3 run 3, "Menu trade-off").
- Capture proofs name the spot: Ruth's `staff_wifi_key` writer and Kieran's `captureProof` both use `{ "planted": "kit_rogue_ap", "on": "rogue_ap_spot" }`. `capture_proof_holds?` already accepts a planted proof with no `on` (any recorded plant of that item counts), and `CaptureModel.proof_satisfiable?` accepts it when some room object takes the item.

Where the kit lives differs by scenario. In the lab, `kit_rogue_ap` is an object in `briefing_room` (`lab:` lines 1343 to 1352); the bootstrap strips every room's objects (`game.rb` lines 2264 to 2327), so the client sees its definition only once it is picked up. In `dev:` it is in `startItemsInInventory` (lines 82 to 84), which the bootstrap deletes as soon as the stored inventory is non-empty (`games_controller.rb` lines 465 to 470). Once a hide consumes the kit, the client has no copy of its definition at all, so anything the client needs after a hide or a reload has to come from the bootstrap (section 7).

Plants in the world are mostly Tiled map decor, not scenario objects. `processObject` (`core/rooms.js`) makes each one a sprite with `objectId = "<roomId>_<imageName>_<tiledObjectId>"` and default `scenarioData` (`name`/`type` the cleaned image name, not takeable, no id), stored in `rooms[roomId].objects`. They are not interactable today. The server never reads room maps; the validator does (`scripts/validate_scenario.rb`, the tilemap lookup through `core/game.js` `tilemapTiledJSON`). Example: `dev:` reception (`room_reception`) has four whole animated plants (`plant-large11-top-ani*`, `plant-large12-top-ani*`, 64x75, Tiled ids 76 to 79) and two table pots (`plant-large4`, `plant-large6`, ids 33 and 34). The lab's reception map (`room_lw_front_desk`) has no decor plants; its only plant is the scenario pot.

## 2. What the player sees

1. While the player carries a hideable device that is not yet hidden (the pocket rogue AP), every plant in the rooms the device allows is interactable, with a hover highlight like any other object. This holds however the device arrived: carried in from the start, or picked up in another room after reception was already loaded. Without the device, or once it is hidden, the plants go back to plain decor, except the one that hosts the device.
2. Tapping a plant there with the device in the tray asks: "Hide the pocket rogue AP in this plant?" with **Hide it** and **Leave it** (`gameConfirm`, as the jack's confirm). Without the device, decor plants are not tap targets at all (as today) and a scenario plant keeps its own authored tap (its observation), so there is no nag: every plant in the room would otherwise repeat the same hint.
3. On **Hide it** the server records the plant. The device leaves the tray, a small device overlay appears on that plant at its anchor point, its blue LED blinks, and the item's `onHidden` actions run (the lab's `set_global ap_planted`).
4. From then on one tap on that plant opens the device's console (the `rogue-ap` minigame). No menu: the overlay is not a separate tap target.
5. A plant in a room the device does not allow is not interactable for this purpose (decor stays as it is today). Only one device can sit in a plant; a plant that already hosts one refuses a second ("Something is already hidden in this plant.").
6. Reload, a second tab or another device: the overlay is redrawn on the same plant from the server's record and the device's static definition in the bootstrap (section 7), even though the kit is no longer held.

The device is not retrievable once hidden (as today: it is consumed). Moving it is out of scope.

## 3. How a scenario opts in

Opt-in is per device, on the item definition, so a scenario with no `hideable` item behaves exactly as today. One new block on the item, two optional fields on room objects. Items are objects in arrays (a room's `objects`, `startItemsInInventory`, a container's `contents`, an NPC's `itemsHeld`), so the block goes on the object whose `id` is `kit_rogue_ap`:

```json
{
  "id": "kit_rogue_ap", "type": "rogue_ap", "name": "pocket rogue AP", "...": "...",
  "hideable": {
    "rooms": ["reception"],
    "spots": "plants",
    "exclude": [],
    "device": "planted_rogue_ap",
    "overlay": { "sprite": "rogue_ap_tucked", "at": { "x": 50, "y": 55 } },
    "confirm": "Hide the pocket rogue AP in this plant?",
    "onHidden": [ { "type": "set_global", "key": "ap_planted", "value": true } ]
  }
}
```

- `rooms` (required, non-empty): room ids where the device may be hidden. The teaching reason for the limit is the device's job (the rogue AP must be in range of the staff network's clients), so the item's own `observations` say where it belongs.
- `spots`: `"plants"` (default) means every eligible plant in those rooms (section 4). An array of object ids (scenario object ids or decor ids) limits it to those.
- `exclude`: ids of plants in those rooms that are not hiding spots (a plant behind the front desk, say). A scenario plant object can also opt out with `hidingSpot: false`.
- `device`: the id of the console object the overlay stands for. That object keeps its behaviour fields (`wifiTwin`, `apScan`, `apPortal`, `apCaptureLog`) and is declared in one of `rooms` with `"hiddenWith": "kit_rogue_ap"` in place of `position` and `revealOnGlobal`. The engine never places it from room data; it is drawn only as the overlay (section 5). Optional: a device with no console (a plain hidden bug) omits it, and its overlay is then decoration.
- **Authoring note, no secrets in console fields.** When `rooms` is anything other than the single room the device is authored in, the server sends the device's console fields (`id`, `type`, `name`, `observations`, `wifiTwin`, `apScan`, `apPortal`, `apCaptureLog`) in the game bootstrap, so they reach the client before any of those rooms is reachable and with no access gate. Nothing in those fields may be a secret: no password, key, PSK or captured credential in `apCaptureLog`, `apPortal` or the rest. Secrets belong in capture descriptors, which the server resolves and releases only when the player earns them. A single-room hideable is not affected (its fields come from the room answer), but write every hideable as if it were multi-room, since adding a second room later changes where the fields travel. Neither the validator nor a test checks this.
- `overlay.sprite` (required): the overlay texture. `overlay.at`: the device's default anchor, in per cent of the host plant's display box (section 6).
- `confirm`: the confirm text (default "Hide the <item name> in this plant?").
- `onHidden`: an action list run once the server accepts the hide, through `applyActions` (the same runner as `triggerOnInteract`). It runs from the held copy of the item at hide time, so it is the one field the bootstrap's `hideables` map leaves out (section 7).

Room objects:

- `hidingSpot: true` makes a scenario object a hiding spot even if its sprite is not a plant (a bin, a cable tray); `hidingSpot: false` opts a plant out.
- `hideAt: { "x": <0-100>, "y": <0-100> }` overrides the anchor for that object.
- A hiding spot must stay where it is: a scenario object that is a spot must not be `takeable` and must not carry `needsTag` (which lets an office-life NPC carry it). Either would move the plant away from its overlay. The validator makes this an error (section 9).

Decor plants cannot carry fields (they are map objects), so per-decor overrides go on the item: `exclude` for opting out, and `"spotAt": { "<decor id>": { "x": .., "y": .. } }` for an anchor.

The existing `requiresItem`/`consumesItem`/`triggerOnInteract` flow is not touched for other items, but a hideable item may only be planted through the hide flow. An object whose `requiresItem` names a hideable item is a validator error (section 9), and the server's `record_planted_item!` refuses to record a plant of an item that has a `hideable` block (section 7). Otherwise an authored object outside `hideable.rooms` that takes the item would satisfy a proof with no `on`, and the room limit would not hold.

## 4. What counts as a plant

One rule, written twice (JS and Ruby) with a parity test, as the decor cup list is kept in step today (`DECOR_CUP_TYPES` in `games_controller.rb`, `DRINKABLE_CUPS` in `consumables.js`).

- Texture key prefixes: `plant-flat-pot`, `plant-large` (both the static and the `-top-ani` animated plants, which are whole plants in the maps), `planter_`, `planter-`, `fig_plant`, `office-misc-smallplant`, `wilted_plant`.
- Never: `plant-large-displacement` (a displacement map, not a plant), `notes_plantlog`, `m10_sign_plant`, or anything else that only contains "plant".
- A scenario object counts when its authored `scenarioData.sprite` (or `scenarioData.type` when it has no sprite) matches, or when it has `hidingSpot: true`, and it does not have `hidingSpot: false`. JS reads the authored field, never the live texture key, because `spriteVariants` can swap the texture; Ruby reads the same field from the scenario, so both sides decide on the same input.
- A decor sprite counts when its image name (the texture key Tiled gave it, which nothing swaps) matches. Its id is its `objectId`.

Homes: `PLANT_PREFIXES`, `PLANT_NEVER` and `isPlantKey(key)` in a new `systems/plant-hiding.js`; the same lists and `plant_key?` in a new `lib/break_escape/hiding_spots.rb` (pure, no ActiveSupport, so the validator can require it as it requires `capture_model.rb`). The test reads both and compares.

## 5. Client: `systems/plant-hiding.js`

One new module, exposed as `window.plantHiding`, in the shape of `network-links.js` (state filled from the bootstrap, a `syncRoom` hook, an interact entry point that resolves to a result object for tests).

**State.** Two maps, both filled from the bootstrap (section 7) and never written to `gameState` or sent back to the server:

- `hideables`: `itemId -> { rooms, spots, exclude, device, deviceData, overlay, spotAt, confirm }`, the static definition of each hideable item. Eligibility and overlay drawing read only this map, never the held item, so they work before the kit is picked up, while it is held and after it has been consumed.
- `hidden`: `itemId -> { item, on, room }`, from the bootstrap's `hiddenDevices` and from each accepted hide. `hostOf(spotId)` and `spotOf(itemId)` read it.

**Eligibility.** `spotsFor(sprite)` returns the hideable items (from `hideables`) for which this sprite is a spot: its room is in `rooms`, it is a plant by section 4 (or `hidingSpot: true`), it is not opted out (`hidingSpot: false`, `exclude`), and `spots`, when a list, names it. The sprite's id is `scenarioData.id` for a scenario object and `objectId` for decor. `heldHideable()` returns the hideable item ids that are in the tray and not in `hidden`.

**`syncRoom(roomId)`**, called from `core/rooms.js` next to `networkLinks.syncRoom(roomId)` (about line 1039):

- Each spot that `spotsFor` names for an item in `heldHideable()` gets `interactable = true` and `_hidingSpot = true`. Every other spot that `syncRoom` made interactable earlier, and that is not a host, goes back to `interactable = false` with `_hidingSpot` cleared. A host keeps `interactable = true` for as long as it hosts a device. A scenario plant that was interactable in its own right (authored `interactable`, observations shown on tap today) keeps its authored value: the module records the original on first touch and restores it.
- Each hidden device whose `room` is this room gets its overlay drawn on its host (below). A host that is missing (a map edit renumbered Tiled ids after a save, or a forged spot id; section 7) logs one warning and draws the overlay on the first eligible spot in that room in id order, so the console stays reachable; the server record is not changed.

**Re-evaluation on inventory change.** The module listens for `inventory_changed` (`systems/inventory.js` line 158). When the set returned by `heldHideable()` differs from the last one, it re-runs the spot part of `syncRoom` for every loaded room in any affected item's `rooms`. This covers the lab's order of play: the player passes through reception empty-handed, picks the kit up in the briefing room and walks back, and the reception plants become spots without a room reload. The same listener clears them again once the hide removes the kit from the tray.

**The overlay.** A plain Phaser sprite with the item's `overlay.sprite` texture, origin (0.5, 1), at the anchor (section 6), depth `host.depth + 0.005`, `interactable = false` so no proximity menu or highlight ever lists it. Its `scenarioData` is a copy of the `device` object's data (`deviceData` in `hideables`: the console's `id`, `type`, `wifiTwin`, `apScan`, `apPortal`, `apCaptureLog`) and its `objectId` is the device id. `id` and `type` are in `deviceData` so that `scenarioData.id` is set, as it is on the console object the overlay replaces (the rogue-ap minigame passes `data.id`, and the lighting code keys on `scenarioData.id` before `objectId`). The overlay is stored in `rooms[roomId].objects[deviceId]`. That one choice reuses three existing things with no change to them: the room's lighting emitters find it by id (section 6), room reveal and hide treat it like any other object, and the rogue-ap minigame gets the same `sprite.scenarioData` it gets today. It fades with its plant through the existing companion list: `behind-wall-fade.js` (lines 300 to 307) already fades every sprite in `primary._fadeCompanions` with its primary, so the overlay is pushed onto the host's `_fadeCompanions` and `behind-wall-fade.js` is not edited. A table pot inside a table group is covered as well, because the group's `_tableItems` members go through `addWithCompanions` (line 322), which brings their companions along.

**`core/rooms.js`.** An object with `hiddenWith` is never placed from room data: the object-creation loop skips it, as it holds back a `revealOnGlobal` object today, and only `plant-hiding.js` makes its sprite.

**`systems/interactions.js`.** One branch in `handleObjectInteraction`, after the login PC check and before the jack check:

```text
if window.plantHiding?.claims(sprite): window.plantHiding.interact(sprite); return
```

`claims(sprite)` is true when the sprite hosts a hidden device, or when it is a spot for an item in `heldHideable()`. Otherwise the tap falls through unchanged (a scenario plant's own flow).

The branch sits after `maybeShowObjectActionMenu` (line 921), so a scenario plant with authored `actions` shows its own menu first. That order is kept on purpose: a scenario that gives a plant an action menu has said what a tap on it does, and the validator warns when a hiding spot carries `actions` (section 9), so the case is visible rather than silent.

**Opening the console.** A small exported helper in `interactions.js`, `openWifiTwin(sprite)`, wraps `startRegisteredMinigame('rogue-ap', sprite)`. The existing `wifiTwin` branch (lines 956 to 959) calls it, and so does `plant-hiding.js`. The hosting tap does not call `handleObjectInteraction(overlay)` again, which would emit `object_interacted` a second time, play the use pose twice and run `maybeInteractionWarning` on the overlay (lines 840 to 858).

**`interact(sprite)`**, resolving to `{ action }` for tests:

- Hosting: `openWifiTwin(overlay)`. Result `opened`.
- Holding the device: `gameConfirm(confirm, 'Hide it', 'Leave it', { plainText: true })`. Cancel: `cancelled`, no request. Confirm: `POST /inventory` with `action_type: 'hide'`, `item: { id }`, `hidden_in: <spot id>` (section 7), guarded by a busy flag against a double tap.
  - Accepted (200 with a `hidden` entry): remove the item from the tray locally (`removeFromInventory`, with no second remove request: the server already removed it), store the entry from the answer, draw the overlay on the spot the answer names, run `onHidden` through `applyActions` with `{ source: 'object_interact', objectId: <spot id> }`, and emit `device_hidden` and `device_hidden:<itemId>` with `{ itemId, spotId, roomId, deviceId }`. Result `hidden`. (The jack plant plays no sound; neither does this.)
  - `already_hidden` with a `hidden` entry in the answer (the item was hidden elsewhere, for example from another tab): treat it as accepted for the tray and the overlay (drop the tray item, store the entry, draw on the spot it names), but do not run `onHidden` a second time; toast "It is already hidden." Result `refused`, reason `already_hidden`.
  - Any other refusal: toast the server's message (section 7 lists them), keep the item. Result `refused` with the reason.
  - Network error or 5xx: one retry, as `sendInventoryRemove` does; then a toast "Could not hide it. Try again." and the item stays. The retry is safe because the server's hide is idempotent (section 7): if the first request was saved and its answer lost, the retry gets the same 200 and the same entry, and the client finishes the hide as above.
- The spot is occupied by another device: toast "Something is already hidden in this plant." Result `refused`, reason `occupied`, no request.

**Test bridge.** `window.__test.access.hiddenDevices()` returns the `hidden` map. `interact(id)` with a hidden device's id resolves to its host spot, so tests and playtest scripts that name `planted_rogue_ap` keep working and walk to the plant. The bridge's interaction-menu reporting needs no change; with one tap target it reports a direct interaction.

**Harness copy lists.** `plant-hiding.js` is a new static import of `interactions.js` and `rooms.js`, so it goes on every JS test harness copy list (`bin/test-js` runs plain `node`).

## 6. The overlay's position, art and LED

**Anchor.** The point where the overlay's bottom centre sits, in per cent of the host's display box: `x = left + round(at.x / 100 * displayWidth)`, `y = top + round(at.y / 100 * displayHeight)`, whole pixels. `left` and `top` come from `host.getTopLeft()` (equivalently `x - displayOriginX`, `y - displayOriginY`), never from `host.x`/`host.y` directly: decor sprites have origin (0, 0) (`core/rooms.js` line 2679) and scenario objects do not, so only the top-left form makes `hideAt`, `spotAt` and `PLANT_ANCHORS` mean the same thing on both. A host with `flipX` mirrors `at.x` (100 - x). First match wins:

1. the scenario object's `hideAt`;
2. the item's `spotAt[<spot id>]`;
3. the engine's per-plant table `PLANT_ANCHORS` in `plant-hiding.js`, keyed by texture prefix, longest prefix first (for example `plant-flat-pot`, `plant-large11-top-ani`, `plant-large12-top-ani`, `plant-large`, `planter_fig1`, `office-misc-smallplant`). Values are measured in the build from each family's art at 6x so the device sits on the soil line, in front of the stems;
4. the item's `overlay.at`;
5. `{ x: 50, y: 60 }`.

Per-plant values beat the device default because the soil line is a property of the plant art. The table is small and grows only when a mission dresses a new plant family as a spot (the validator warns when a spot's texture has no table entry and the item has no `overlay.at`, section 9).

Plants do not move. Decor plants have no `hasWheels` (`core/rooms.js` line 2695), so they are never pushed, and the brush "bump" plays the plant's animation frames (`systems/player-effects.js` lines 281 to 320) rather than scaling or moving the sprite. The `-top-ani` frames keep one size, so the anchor holds through a bump. The H3 art check confirms the frame sizes for each animated family used as a spot. The only ways a spot could move are a takeable scenario plant or one with `needsTag` that an NPC could carry, and both are validator errors (sections 3 and 9).

**Art.** One new sprite, `rogue_ap_tucked`: the box and its two antennae only, on a transparent canvas, about 12x10, cut by hand from the approved `rogue_ap_planted` (free, no generation), registered with `scripts/room_gen/register_object.py` and preloaded in `core/game.js`. A 6x preview on three plant families (a flat pot, a large plant, a table pot) goes to the user for approval before the lab uses it. No downscaling: if 12x10 reads badly, redraw at the size wanted.

**LED.** No lighting code change. The overlay is a room object whose id is the device id, so a room `lighting.emitters` entry keyed `planted_rogue_ap` follows it wherever it is drawn (`variantsFor` matches by id first). The existing entry (blue, radius 5, intensity 0.7, `blink`, `above`) stays; only `offsetX`/`offsetY` are re-measured against the new overlay's centre. Every room in `hideable.rooms` needs that entry; the validator checks it (section 9). The overlay only exists once hidden, so the LED needs no condition. Deferred: a base `EMITTERS` entry for the `rogue_ap_tucked` prefix (`systems/lighting.js` line 433; base entries already take `effect: 'blink'`, and `above` is read from whichever def resolves). It would drop the per-room entries, and is the better home once a second mission hides this device; for one lab and one test scenario the per-room entries already exist.

## 7. Server: the record, reload, sync and cheat resistance

**What must hold (the cheat-resistance policy).** The server hard-enforces what feeds a secret: Kieran's password and the staff Wi-Fi key are served only once a plant of `kit_rogue_ap` is on record. It does not need to enforce which plant, because the plant is not a secret and nothing is served by it. So the server checks the item, the room and the shape of the spot, and records the spot id for display.

**Item definitions.** One function, `HidingSpots.item_defs(scenario)` in `lib/break_escape/hiding_spots.rb`, walks every place an item can be declared (`startItemsInInventory`, each room's `objects`, nested `contents` at any depth, and each NPC's `itemsHeld`) and returns `itemId -> definition` for the items that have a `hideable` block. `hide_device!`, the bootstrap's `hideables` and `hiddenDevices`, the validator and the leak scanner all use it, so the lab (kit in a room) and the test scenario (kit as a start item) resolve the same way. It reads the server's scenario copy only, never a client's item.

**`POST /inventory`, `action_type: 'hide'`** (`games_controller.rb`, a new branch beside `remove`), calling a new `Game#hide_device!(item_id, spot_id)` in `capture_proofs.rb`. Its own branch, not `remove` with `used_on`, because `remove` removes the item whether or not the plant is recorded; a refused hide must leave the device in the tray. Checks, in order, each refusal a 422 with a reason and a player-facing message:

| Reason | Check | Message |
|---|---|---|
| `not_a_spot` | the spot id is a string of at most 128 characters matching `/\A[A-Za-z0-9_.\-]+\z/` (checked first, before anything is looked up or stored) | "That is not a hiding spot for it." |
| `not_hideable` | `HidingSpots.item_defs(scenario)` has the item id | "That cannot be hidden here." |
| (idempotent) | a `plantedItems` entry for this item already exists: if its `on` equals this spot id, answer **200** with the same `hidden` entry and change nothing; otherwise refuse `already_hidden` | "It is already hidden." |
| `not_held` | the held entry is found (below) and is not `ItemIdentity.client_forged?` | "You are not carrying that." |
| `not_a_spot` | the spot resolves (below) to a room in `hideable.rooms`, is a plant or `hidingSpot: true`, is not opted out, and is in `spots` when that is a list | "That is not a hiding spot for it." |
| `room_locked` | `room_unlocked?(room)` (start room or unlocked) | "You cannot reach that room." |
| `occupied` | no other `plantedItems` entry of a hideable item is `on` this spot | "Something is already hidden in this plant." |

The idempotent check comes before `not_held` because a saved hide has already removed the item: a retry after a lost answer must find the record, not the empty tray. An `already_hidden` refusal carries the existing `hidden` entry in its body, so the client can drop its stale tray item and draw the overlay where the device really is (section 5).

**The held entry.** The server-stored inventory entry is the canonical copy of what the player holds (`games_controller.rb` lines 3122 to 3140). `hide_device!` finds that one entry by `scenarioData.id` (the lookup `record_planted_item!` uses), refuses it if `client_forged?`, and removes *that same entry* by object identity (a new `remove_inventory_entry!(entry)`, or `remove_inventory_item!` extended to match `scenarioData.id` as well as the top-level `id`). The append and the removal then act on one entry in one `save!`, which is what makes the hide atomic; matching the removal by top-level `id` alone could miss the entry the check found.

Resolving the spot id. A scenario object: `planted_target_object(spot_id)` finds it; its room is where it is declared; plant test on its `sprite` (or `type`). A decor plant: for each allowed room id `r`, the id starts with `"#{r}_"` and the rest matches `/\A(.+)_(\d+)\z/` with an image name that passes `HidingSpots.plant_key?`. A room id that is a prefix of another (`reception` and `reception_annex`) cannot be confused, because the remainder must itself start with a plant prefix.

**Forged decor ids.** The server does not read room maps, so it cannot tell a real decor plant from a made-up id of the right shape. It accepts such an id, and that gains a cheater nothing. To get that far they must hold the real, unforged device, be hiding it in an allowed and unlocked room, and they lose the device; the `plantedItems` entry is the same as an honest hide's, so the proof that follows (a planted proof with no `on`) holds exactly as it would after an honest hide and serves nothing extra. The cap on length and characters stops a forged id from carrying bulk into player_state and every later bootstrap. What remains is cosmetic: the client draws the overlay on its fallback spot (section 5), and a second forged id could dodge the `occupied` check, which only matters with two hideable items in one scenario. The model test `test "forged decor id with the right shape records the same plant as an honest hide and serves nothing extra"` in `hide_device_test.rb` proves it: it hides with `reception_plant-large99_999`, then asserts the stored entry equals the honest one apart from `on`, that `capture_proof_holds?` gives the same answers as after an honest hide, and that an over-long or bad-charset id is refused `not_a_spot` with player_state unchanged.

**Real plant ids on the server: deferred.** Knowing the real ids would mean reading each room's Tiled JSON (the type-to-file table from `core/game.js` `tilemapTiledJSON`, which `scripts/validate_scenario.rb` already parses) and porting the client's decor rules: the id format (`core/rooms.js` line 2683), Tiled items reserved by scenario objects and start-inventory types (lines 2197 to 2213 and 2520 to 2556), and table groups. The validator needs that list anyway (section 9), so it lives in `HidingSpots.decor_spots(map, room, scenario)`, memoised per map type. The server does not call it for now: it would give an exact `occupied` and remove the client fallback, but adds nothing to proof security. If a second hideable device ever makes `occupied` matter, `decor_spots` is the function to call from `hide_device!`.

A saved record whose `on` no longer resolves (a game saved before the spot was removed from the scenario, or after any later scenario edit that removes a scenario plant, such as a game holding `{ item: kit_rogue_ap, on: rogue_ap_spot }`) takes the first room in `hideable.rooms` as its `room`. `hidden_devices_for_client` and the client both rely on this, and the client then draws the overlay on the first eligible spot in that room (section 5). An `already_hidden` answer for such a record reaches the client the same way.

On success, one `save!`: append `{ 'item' => item_id, 'on' => spot_id }` to `plantedItems` (the existing key and shape, so `capture_proof_holds?` needs no change) and remove the held entry. Answer `{ success: true, hidden: { item, on, room } }`.

**The old plant path refuses hideable items.** `record_planted_item!` returns without recording when `HidingSpots.item_defs(scenario)` has the item. One line plus a model test. Without it, an authored object outside `hideable.rooms` that takes the item (through `object_takes_item?`) would record a plant that satisfies a proof with no `on`. The validator rejects such an object as well (section 9); the server check means a scenario that slips past the validator still cannot bypass the room limit.

**The console object is never carried.** `carriable_object?` (`game.rb` line 1294) gains `obj.key?('hiddenWith')` beside `revealOnGlobal`, so an office-life NPC can never be given the console object to carry.

**Start items after a hide.** If a hideable start item is the only thing held, the hide empties the inventory, and the bootstrap then keeps `startItemsInInventory` (`games_controller.rb` lines 465 to 470) and the client would grant the item again. Neither scenario does this today (the dev kit is held with other items, and the lab kit is not a start item), but the bootstrap guards it anyway: it drops from `startItemsInInventory` any item that has a `plantedItems` entry. One line and a controller test. The add path stays as it is: the server still accepts a re-add of any start item at any time ("starting items are always valid"), so a tampered client can put the hidden kit back in its server inventory. That gains nothing: every later hide answers `already_hidden`, the old plant path refuses hideable items, and `heldHideable()` excludes hidden items, so no spot lights up. No refusal is added to the add path, because it could break other start-item flows.

**Proofs.** A proof that names the device with no `on` (`{ "planted": "kit_rogue_ap" }`) holds after a hide in any spot; `capture_proof_holds?` already reads it that way. A proof with `on: <spot id>` still works and pins one plant; the validator warns about it for a hideable item (section 9). The lab and test scenario drop `on` (section 8).

**Bootstrap.** Two fields beside `footholds` (about line 450):

- `filtered['hideables']`: from `HidingSpots.item_defs`, `itemId -> { rooms, spots, exclude, device, deviceData, overlay, spotAt, confirm }`, where `deviceData` is the console object's behaviour fields (`wifiTwin`, `apScan`, `apPortal`, `apCaptureLog`, `name`, `observations`). It is static, authored scenario data, small and bounded by the number of hideable items, carries no secrets (the console's fields already reach the client today with reception's room data, and they hold no keys or passwords; those are served by the capture writers), is not in player_state and is never sent back. The rule for any later hideable device is that `deviceData` never carries a field the room filter would strip, because it reaches the client at bootstrap rather than with the room's data. `onHidden` is left out: it runs from the held item at hide time.
- `filtered['hiddenDevices'] = @game.hidden_devices_for_client`: `[{ item, on, room }]` for each `plantedItems` entry whose item is hideable, with `room` resolved as above. Bounded by the number of hideable items in the scenario (one in the lab).

The bootstrap strips room objects, so the console object would otherwise never reach the client once it is drawn only as an overlay; `deviceData` is what the overlay's `scenarioData` is built from.

**player_state and sync.** No new player_state key. `plantedItems` stays server-only and is not echoed to the client (`game.rb` line 2867); `hiddenDevices` is derived on each bootstrap and never sent back; `hideables` is scenario data, not state. Each `plantedItems` entry is bounded in size by the spot id cap and in count by one per hideable item. The hide answer carries the one new entry and nothing else. `PUT /sync_state` gains no field. `ap_planted` (or any `onHidden` global) travels as the ordinary global delta, as the lab's `set_global` does today; it is display state only, since the proof reads `plantedItems`. A second tab learns of the hide on its next bootstrap, as it learns of a jack plant.

**Tooling that reads plant rows.** `tools/playtest/lib/access_leak_scanner.rb` (`@plant_rows_any`, filled from `POST /inventory` remove rows whose object takes the item) and `scripts/validate_capture_log.rb` (the plant-order rule) learn the `hide` row: a 200 `POST /inventory` with `action_type: 'hide'` counts as the plant of its item when its spot passes `HidingSpots` for that item. Otherwise a served secret after a hide would be flagged as served before its plant.

## 8. The puzzle: does the plant matter?

**Decision: no single intended plant; any plant in reception is right, plants elsewhere are not spots.** The lesson of the rogue AP is the evil twin and the person who picks it, not which pot hides it. What does matter in a real test is range and concealment, and the room limit already teaches range: the staff access point and Kieran's laptop are in reception, so the item's observation says to hide it there. Concealment is not modelled (no NPC notices a device), so a plant-by-plant consequence would be decoration with nothing behind it. No debrief branch on which plant.

Rejected options:

- *Keep one intended spot and allow others with a debrief note* ("the waiting-area planter was out of Kieran's sight; the pot on the front desk was in it"). It needs a spot-to-global mapping (`onHidden` cannot see which spot) and a debrief line per spot class, for a point the lab does not otherwise test.
- *Any plant on the floor, with range in the console's scan* (weaker signal further from reception). Bigger: the scan rows would depend on the spot, and the capture writers would need a range condition.

**Lab content (`lab:`, reception).**

- Reception has one plant today (the scenario pot). To give a choice, the dressing adds one more catalog plant as a scenario object with an explicit position (the A3 pattern, no map edit; an explicit position means it never takes over a Tiled item's slot, so the decor list stays as the map draws it), for example a `plant-large*` by the entrance, and the waiting-area pot becomes a catalog `plant-flat-pot*` object (`reception_planter`, name "Waiting-area planter", observation kept). Neither needs `hidingSpot`: both match the plant rule. Exact sprites and positions are the dressing pass's call, with a render for the user.
- `kit_rogue_ap` gains `hideable` with `rooms: ["reception"]`, `device: "planted_rogue_ap"`, `overlay.sprite: "rogue_ap_tucked"`, the confirm text and `onHidden: [set_global ap_planted]`. Its observation keeps "Hide it in reception, then set it up from its console."
- `planted_rogue_ap` loses `position` and `revealOnGlobal`, gains `hiddenWith: "kit_rogue_ap"`; its observation becomes "Your pocket rogue AP, tucked into the plant. Click the plant to open its console."
- Ruth's `staff_wifi_key` writer and Kieran's `captureProof` become `{ "planted": "kit_rogue_ap" }`.
- The reception emitter entry `planted_rogue_ap` keeps its colour and effect with re-measured offsets.
- Ruth's voiced lines say "the reception planter": `ink/ruth_phone.ink` lines 120, 153 and 179 (one string, so one clip) and `ink/ruth_debrief.ink` line 216 (a second clip). With two plants the phone line is an instruction that sends the player looking for one particular planter, and the debrief line is false when the player used the other plant. The plan is to change the text and re-voice the two clips, but only after the user says yes (section 13); until then nothing changes. Either way the subtitle and the audio say the same words.
  - **If yes:** the phone line becomes "Hide it in a plant in reception, then open its console. Copy the staff network and pick a page. Kieran's laptop is the likely bite." in all three places, and the debrief line becomes "Then the rogue AP tucked in a reception plant. A copy of the staff Wi-Fi is an open network, so no laptop joins it by itself. Kieran had to pick it." Recompile `ruth_phone.json` and `ruth_debrief.json` (committed beside the `.ink` files in `scenarios/lab_physical_pentest/ink/`), since changing the `.ink` alone leaves the game showing the old line. Re-voice both clips with the `tts-audio` skill, in Ruth's existing voice and style, and prune the two superseded clips from `tts_cache/` by moving them into `tmp/delete/` and staging the removal (never `rm`). Commit the `.ink`, the recompiled `.json` files and the clips together so no build has a subtitle without its clip. The live proof (section 12 step 7) plays both lines and checks that each one's audio is the new clip.
  - **If no (the fallback):** the text and the audio stay exactly as they are. Changing the text alone would leave a subtitle that differs from what Ruth says, which is worse than a loose line. The waiting-area pot keeps the name "Waiting-area planter" so the phone line still names a real plant the player can use, and the debrief stays loose only for a player who chose the other plant.

**Test scenario (`dev:`).** Its reception (`room_reception`) already has six decor plants (four large animated plants, Tiled ids 76 to 79, and two table pots, 33 and 34), so the focused test needs no new plants. `rogue_ap_spot` is removed; `kit_rogue_ap` gets the same `hideable` block with `exclude: ["reception_plant-large4_34"]` (one table pot opted out, so exclusion is provable); `planted_rogue_ap` takes `hiddenWith`; the key writer and the test NPC's `captureProof` drop `on`. The comms room has no plants, which is fine: the out-of-room case is a unit test.

## 9. Validator and schema

`scripts/scenario-schema.json`: `definitions.item.hideable` (the fields in section 3, `rooms` required, `overlay.sprite` required, `at`/`spotAt` values 0 to 100), and on objects `hidingSpot` (boolean), `hideAt` (x, y 0 to 100) and `hiddenWith` (string).

`scripts/validate_scenario.rb`, using `HidingSpots.item_defs` and `HidingSpots.decor_spots(map, room, scenario)` over the validator's existing room-map lookup (the `tilemapTiledJSON` table, about line 6119; parsed at about line 6133) to list decor plants per room. `decor_spots` applies the same skips the client applies before it draws decor: the id format of `core/rooms.js` line 2683, Tiled items reserved by scenario objects and start-inventory types (lines 2197 to 2213 and 2520 to 2556), and table groups. Without those skips the "no eligible spot" error and the `spots`/`exclude` checks could name plants that are never drawn. A unit test (section 11) pins `decor_spots` for the dev reception map to the ids the client draws, and the live proof (section 12 step 1) reads the client's list from the running game.

Errors:

- `hideable.rooms` empty, or naming a room that does not exist.
- A listed room with no eligible spot after `spots`/`exclude`/`hidingSpot: false` (scenario plants plus decor plants from its map). The device could never be hidden.
- `spots`, `exclude` or `spotAt` naming an id that is not a plant (or `hidingSpot`) object or a decor plant in a listed room.
- `device` naming no object, or an object without `hiddenWith` equal to this item, or declared outside `hideable.rooms`.
- An object with `hiddenWith` that also has `position` or `revealOnGlobal` (the old pairing), or whose item has no `hideable`.
- `overlay.sprite` with no texture (the existing sprite lookup the validator uses for `sprite`).
- An object whose `requiresItem` names a hideable item. A hideable item is planted only through the hide flow; the server refuses the old path for it too (section 7).
- A scenario object that is a hiding spot (by the plant rule or `hidingSpot: true`, in a listed room, not opted out) and is `takeable` or has `needsTag`. A spot that can be carried away would leave its overlay behind.

Warnings:

- A planted proof with `on` for a hideable item ("pins one plant; drop `on` to accept any spot").
- A hiding spot with authored `actions`: its action menu opens before the hide flow (section 5).
- A listed room whose `lighting.emitters` has no entry for `device` (the LED would not show).
- An eligible spot whose texture has no `PLANT_ANCHORS` entry and an item with no `overlay.at` (the overlay falls back to 50, 60).

`CaptureModel.proof_satisfiable?` (`lib/break_escape/capture_model.rb`, the `planted` branch): a proof with no `on` is satisfiable when the item is hideable with at least one room, and a proof with `on` is satisfiable when `on` is an eligible scenario spot or matches the decor shape for one of the rooms. The validator's map check above is what proves a spot exists. `validate_capture_log.rb` and the leak scanner follow (section 7).

Validator known failures: none expected. The A2 note that `rogue_ap_spot` needs a `triggerOnInteract` for `object_takes_item?` falls away with the object.

## 10. What becomes obsolete

- `rogue_ap_spot` in both scenarios (the custom pot, its `spriteVariants` swap, `requiresItem`, `requiresItemHint` and its variants, `consumesItem`, `triggerOnInteract`). Its observation text moves to the lab's `reception_planter`.
- `planted_rogue_ap`'s `position`, `elevation` and `revealOnGlobal`, and with them the two-item menu (build log A3 run 3, "Menu trade-off") and the "a later engine step could hide the spot's interaction" follow-up.
- The `on: "rogue_ap_spot"` in Ruth's writer, Kieran's `captureProof` and the test scenario's two writers.
- Art: `rogue_ap_pot` (A3, never approved) and `rogue_ap_planted` (the pot with the box) are no longer placed. `rogue_ap_planted` stays as the source the overlay is cut from. Both stay registered unless `register_object.py` has a clean removal path that does not shift other catalog gids; if retired, the PNGs move to `tmp/delete/` and the removal is staged (never `rm`).
- Plan text: `PHYSICAL_PENTEST_DEVICES_PLAN.md` 4.1 step 3 and the A2 row describe the spot and reveal object. Add a dated pointer to this plan there rather than rewriting history.
- Fixtures and tests that name `rogue_ap_spot` or the rogue AP objects: `test/models/break_escape/lab_physical_pentest_secrets_test.rb`, `test/unit/access_leak_scanner_test.rb`, `test/controllers/break_escape/access_devices_rogue_ap_test.rb`, `test/js/playtest-session-capture.test.mjs`, `test/js/rogue-ap.test.mjs`, `test/js/rogue-ap-registry.test.mjs`, `test/js/network-links.test.mjs`.
- `test/fixtures/format_8c/lab_physical_pentest.old.loaded.json`: refreshed the way its README describes (overlay the new lab content on the frozen format-2 loader output, as the A2 and A3 refreshes did), not from a live render, which would break the corpus equivalence. Add a dated note to `test/fixtures/format_8c/README.md`.
- `scenarios/lab_physical_pentest/dungeon_graph.md` and `scenarios/lab_physical_pentest/dungeon_graph.html` (regenerate both).
- Author comments in the scenario ERBs that describe the old spot and reveal pairing: `lab:` around lines 328, 1023, 1338 to 1342, 1407 and 1480 to 1489, and `dev:` around lines 120 to 160. Rewrite them to describe the `hideable` block.

## 11. Tests

Commit the code before running suites (shared tree). Every new engine feature gets unit tests, the focused scenario and live proof.

**Ruby model (`test/models/break_escape/hide_device_test.rb`, new).** `hide_device!` refuses each row of the section 7 table, including a forged item, a decor id with the wrong room prefix, a decor id whose image is `notes_plantlog1` or `plant-large-displacement`, an excluded plant, a plant not in a `spots` list, a scenario plant with `hidingSpot: false`, a malformed id (`reception_plant-large4_x`), an id of 129 characters and an id with a character outside the allowed set (both `not_a_spot`, player_state byte-identical before and after). Success appends one entry with the spot id, removes the held entry (the one found by `scenarioData.id`, also when its top-level `id` differs), saves once. A second call on the same spot answers success with the same entry and leaves state unchanged; a second call on another spot refuses `already_hidden`, carries the existing entry and leaves state unchanged. The forged decor id test named in section 7. `HidingSpots.item_defs` finds the kit as a start item, a room object, nested `contents` and an NPC's `itemsHeld`. `record_planted_item!` records nothing for a hideable item, even on an authored object that takes it. `carriable_object?` is false for an object with `hiddenWith`. `capture_proof_holds?({ planted: kit_rogue_ap })` is false before and true after; with `on` naming another spot it stays false. `hidden_devices_for_client` returns the entry with its room and nothing for a non-hideable plant record, and for a record `{ item: kit_rogue_ap, on: rogue_ap_spot }` whose spot no longer exists it returns the first room in `hideable.rooms`.

**Ruby controller.** `POST /inventory` `hide`: 200 with the `hidden` entry; the same request again answers 200 with the same entry; 422 with reason and message for a refusal, and the item still in the inventory; `already_hidden` on another spot carries the existing entry. Bootstrap includes `hideables` (with `deviceData`, without `onHidden`) and `hiddenDevices`, and no `plantedItems`, both before and after the hide; after a hide that emptied the inventory, `startItemsInInventory` does not offer the hidden item again. The sync payload size tests (`sync_payload_size`) pass unchanged: the bootstrap grows by one small array and `PUT /sync_state` by nothing. `access_devices_rogue_ap_test.rb` and `lab_physical_pentest_secrets_test.rb`: Kieran's password and the staff key are withheld before the hide and served after a hide in each reception plant; no hide is possible outside reception.

**Ruby unit.** `HidingSpots`: `plant_key?` on every prefix and every "never" name; spot resolution for scenario and decor ids, including a room id that is a prefix of another; parity with the JS lists (read both files, compare); `decor_spots` on `room_reception` lists exactly Tiled ids 33, 34 and 76 to 79, and leaves out a plant that a scenario object reserves (a fixture scenario that reserves one). `CaptureModel.proof_satisfiable?` for no-`on` and decor-`on` proofs. `access_leak_scanner_test.rb` and `validator-capture-log.test.mjs`: a served secret after a `hide` row is not flagged; before it, flagged. Validator tests for each error and warning in section 9.

**JS (node, `test/js/plant-hiding.test.mjs`, new).** `isPlantKey`; `spotsFor` by rooms, `spots`, `exclude`, `hidingSpot`, reading only the `hideables` map; the scenario-plant test reads `scenarioData.sprite`, so a plant whose `spriteVariants` swapped its texture still counts and a non-plant whose variant texture is a plant does not; anchor maths for each precedence step, for `flipX`, and for a host with origin (0, 0) and one with origin (0.5, 1) giving the same top-left result; `claims` true only when hosting or holding an eligible unhidden device. Interactable state: no spot is interactable before the kit is held; **picked up after the room loaded**: load the room with an empty tray, add the kit, emit `inventory_changed`, and the plants become interactable with no room reload; after the hide only the host stays interactable; a scenario plant's authored `interactable` is restored. `interact` paths: cancel sends nothing; refusal keeps the tray item and toasts the server message; `occupied` sends nothing; success removes the tray item without a second remove request, runs `onHidden` once, draws one overlay with `interactable` false, stored under the device id, depth above the host, in the host's `_fadeCompanions`; a first request that fails at the network and a retry answered 200 complete the hide once; `already_hidden` with an entry drops the tray item, draws on the named spot and does not run `onHidden`. The hosting tap calls `openWifiTwin` once (spy on `startRegisteredMinigame`) and emits `object_interacted` once. `syncRoom` from bootstrap `hideables` and `hiddenDevices` with an empty tray draws the overlay with the device's `scenarioData`; a missing host falls back to the first spot with one warning. `core/rooms.js` skips `hiddenWith` objects. Bridge: `interact('planted_rogue_ap')` resolves to the host. Add `plant-hiding.js` to each harness copy list.

## 12. Focused scenario and live proof

**`test_access_devices`** (section 8) is the focused scenario. Validator: 0 errors, 0 warnings.

**Live proof** (keyless server on :3001, or :3002 from the build worktree; headless browser, `setFPS(20)` with fixed steps on; never edit a game row: start a new game):

1. New game of `test_access_devices`. `__test.access.hiddenDevices()` is empty, and the bootstrap carries `hideables.kit_rogue_ap`. The reception decor plants the client drew are exactly Tiled ids 33, 34 and 76 to 79 (the list `decor_spots` gives). With the kit held from the start, plants 33 and 76 to 79 are interactable and the excluded `reception_plant-large4_34` is not. (The "picked up after the room loaded" case is proved live in the lab, step 7, where the kit starts in another room.)
2. Tap plant 77 (`reception_plant-large12-top-ani1_77`): the confirm shows; **Leave it**: no request in the network log, kit still held.
3. Tap again, **Hide it**: one `POST /inventory` `hide` answered 200; kit gone; `ap_planted` true; overlay drawn on plant 77 at its anchor; the other plants are no longer interactable. Screenshot at 4x. A dark render (switch the room off by hand as in A3) shows the LED blinking on the overlay over three frames. Walk behind plant 77's wall line: the overlay fades with it.
4. Tap plant 77: `interact` reports a direct interaction (not `via-interaction-menu`), `object_interacted` fires once and `RogueApMinigame` opens. Clone `Ledgerwell-Staff`, wait for the test NPC's laptop use: the key capture lands and is served (the proof holds with no `on`).
5. Reload: the inventory no longer holds the kit, yet the overlay is on plant 77 again from `hideables` and `hiddenDevices`, LED on, one tap opens the console. Open the game in a second browser context: same.
6. Requests from the console's fetch (the page's own CSRF token, the same session): `hide` on plant 77 again answers 200 with the same entry and no state change; `hide` on plant 76 refuses `already_hidden` with the plant 77 entry. In a fresh game: `hide` on `reception_plant-large4_34`, `comms_plant-large6_1`, `reception_notes_plantlog1_9`, and a 200-character id, each `not_a_spot`.
7. Lab: a new `lab_physical_pentest` game. Walk through reception before taking the kit from the briefing table, then come back with it: the reception plants become spots without a reload. Hide in the second reception plant; repeat steps 3 to 5 there; confirm Kieran's account harvest still works on the sign-in template. If the user approved the re-voice, ask Ruth about the rogue AP and finish the debrief: both lines show the new text and play the new clips; if not, both lines are unchanged and play their existing clips.

Record screenshots and the network log under `tmp/handover/` in the build worktree, and a build log section. (Update 2026-11-17: no separate `PLANT_HIDING_BUILD_LOG.md` was made; the log went into `PHYSICAL_PENTEST_DEVICES_BUILD_LOG.md`, "Plant hiding build".)

## 13. Build order and open question

| Step | Content | Size |
|---|---|---|
| H1 | `lib/break_escape/hiding_spots.rb` (`plant_key?`, `item_defs`, `decor_spots`), `hide_device!` (idempotent, spot id cap, held-entry removal), the `hide` action, `hideables` and `hiddenDevices` bootstrap, the start-item guard, `record_planted_item!` refusal, `carriable_object?` exclusion, `proof_satisfiable?`, scanner and capture-log rules, Ruby tests | M |
| H2 | `systems/plant-hiding.js` (with the `inventory_changed` re-evaluation), the `interactions.js` branch and `openWifiTwin` helper, the `rooms.js` skip and `syncRoom` call, `_fadeCompanions`, the bridge alias, JS tests, harness lists | S |
| H3 | `rogue_ap_tucked` art (hand cut, 6x preview for the user), `PLANT_ANCHORS` measured, animated frame sizes checked | S |
| H4 | Schema and validator; `test_access_devices` migration; live proof steps 1 to 6 | S |
| H5 | Lab migration and reception dressing render; fixture refresh by the README method; ERB comments and dungeon graphs; Ruth's lines by the user's answer; live proof step 7; obsolete items (section 10) | S |

Open question for the user: re-voice Ruth's two "reception planter" clips (the phone line, used three times, and the debrief line) with the text in section 8, or keep text and audio as they are. The build can run up to H5 without the answer; H5 takes whichever branch the user picks.
