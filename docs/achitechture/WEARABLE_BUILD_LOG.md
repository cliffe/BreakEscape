# Wearable items: build log

User decision 2026-11-11 (q04, `docs/handover/2026-11-11_USER_DECISIONS.md`): the disguise vest gets
both a "worn" frame in the tray and a no-change-while-seen rule. Spec: section 4 of
`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` ("Decision: no engine `wearable` for now" describes the
field this build adds). Branch `build/wearable`.

## What the costume system already does

- `systems/costume-actions.js`: `set_costume { costume }` puts `scenario.disguises[costume]` on the
  avatar (`utils/player-costume.js`) and writes the global `pp_disguise` = the id; `clear_costume`
  takes it off and writes `""`. `reapplyPersistedCostume()` re-dresses the avatar after a reload from
  `pp_disguise` (`core/game.js` calls it once the player sprite exists).
- It is generic: it knows nothing about what a costume means. The lab made the meaning with its own
  global, `courier_ready`, written from four places (the carried vest's two confirms, the hook's
  confirm, the changing locker).
- The server already refuses a client-made `wearable` field (`CLIENT_ITEM_FORBIDDEN_FIELDS`), so a
  `wearable` item in the inventory is always the server's own copy.

## Design

### The field

On an item (a room object that is taken, a `give_item` item, a container's content):

```json
"wearable": {
  "costume": "courier",            // required: a key of scenario.disguises
  "global": "courier_ready",       // required: the worn global, true while this item is worn
  "unseenOnly": true,              // optional: refuse a change while someone can see
  "seenBy": { "ignore": ["ruth"] },// optional, with unseenOnly: NPC ids who do not count
  "confirmOn": "...",              // optional: confirm text before putting it on from the tray
  "confirmOff": "...",             // optional: confirm text before taking it off from the tray
  "onWear": [ actions ],           // optional: client actions after it goes on (hints)
  "onRemove": [ actions ]          // optional: client actions after it comes off
}
```

The item needs an `id`. Its tray click toggles it (Put on / Take off). A droppable wearable gets
"Put on" or "Take off" as the first entry of its tray menu.

### Rules

- One at a time: putting one on takes off any other worn item first (its global goes false).
- The costume comes off when the item leaves the inventory, however it leaves (drop, `remove_item`,
  a plant, an NPC taking it). Leaving is not refused; a drop counts as a change, so it is refused
  under `unseenOnly` like a change.
- `unseenOnly`: a change is refused while anyone in the room can see. "In the room" is the rule the
  sight challenge uses (`npc-sight-challenge.js`): a `person` NPC whose `roomId` is the player's
  current room and whose sprite is visible (`isVisible !== false`), not knocked out, not removed.
  No line of sight test: a change in the open is a change in the open. `seenBy.ignore` lists the
  NPCs who never count (the player's own team). The player is told why in a short toast naming
  the watcher.
- Actions: `wear { itemId }` puts a held wearable on (no confirm: the action is the author's
  decision), `take_off { itemId? }` takes it (or whatever is worn) off. Both obey `unseenOnly`.
  They replace `set_costume` / `clear_costume` and `set_global` for a wearable's costume and global.

### Server

- `POST /games/:id/wear` `{ item_id, worn }`. Worn true: the item must be in the server's
  inventory and carry a valid `wearable` whose costume exists in `scenario.disguises`; any other
  worn item comes off. The server records `player_state['worn'] = { itemId, global, costume }`
  and writes the globals itself: the item's global true (the previous one false) and
  `pp_disguise` = the costume. Worn false: clears the record, the global false, `pp_disguise` "".
  It answers with the record and the globals it wrote; 422 for an item not held or not wearable.
- The worn globals are server-owned: `player_state['wearableGlobals']` (every wearable's global,
  set when the game is created; a game made before this build works it out on its first sync,
  inside the sync's row lock) are read-only to `sync_state`, as imported globals are. A client
  cannot set `courier_ready` by a sync.
- An item leaving the server inventory (`remove_inventory_item!`, a network plant) clears the worn
  record and its global.
- The bootstrap sends `wornItem` so the tray frame comes back after a reload.
- Not server-checked: `unseenOnly`. The server does not know where NPCs stand; the rule is about
  presentation, not access. Recorded as a limit.

### What a costume unlocks, and where the server checks it

The worn global is now true on the server only through the wear endpoint, so every server reader
of globals (aim unlock conditions, `concludeRequires.globals`, story gates) reads a value the
client cannot forge. In the lab, the vest's effect is the records door gate
(`playerMayPassIf: courier_ready`), which `door-gates.js` documents as a client-side control in its
own right: the server opens `secure_area` for Len's route (`npc_mapping_unlocks_door?`), not for the
player's costume. That is unchanged by this build and listed under open items.

### Validator (`scripts/validate_wearable.rb`, rules in `lib/break_escape/wearable_model.rb`)

- `wearable` shape: costume names a `disguises` key, global is a string declared in
  `globalVariables`, the item has an id, `seenBy.ignore` names existing NPCs, actions are arrays.
- No other writer of a worn global: a `set_global` with that key, a mapping's `setGlobal`, or an
  ink assignment (`~ name =`) is an error.
- Two wearables may not share a global.
- `set_costume` / `clear_costume` in a scenario with wearables is a warning (the costume and the
  worn item can disagree).
- `wear` / `take_off` must name a wearable item id.

### Lab change

The vest moves to `wearable` (costume courier, global `courier_ready`, `unseenOnly` with Ruth
ignored, so the briefing room stays a place to change and the open-plan floor does not). The hook
gives the vest and offers to put it on with `wear`; the locker uses `take_off`. The set_costume,
clear_costume and courier_ready writes go.

## Progress

Full suites after the last code change: Rails 1440 runs, 0 failures, 1 skip; JS 485 of 485 files.

Built as designed, with two changes found on the way: the refusal toast names at most two
watchers ("Tom and 4 others"), since the lab floor has five; and an older game's worn globals are
worked out on its first sync, not saved from the bootstrap (that save held no row lock).

Files: `lib/break_escape/wearable_model.rb`, `app/models/break_escape/wearables.rb`, `POST wear`
(controller, route, policy, row lock), `public/break_escape/js/systems/wearables.js` (loaded by
`core/game.js`; `inventory.js`, `interactions.js`, `inventory-menu.js` and `apply-actions.js`
reach it through `window.wearables`, so no test harness copy list changed), `css/hud.css`,
`scripts/validate_wearable.rb`, schema, `scenarios/test_wearable`, the lab and its tests,
`README_scenario_design.md`.

Tests: `test/controllers/break_escape/wearable_test.rb` (18), `test/js/wearables.test.mjs` (14),
`test/js/validator-wearable.test.mjs` (6), the lab model tests updated.

Browser proof (keyless server, port 3016):

- `test_wearable`, game 1207: W1 put on from the tray menu with its confirm (courier sprite,
  frame, "(worn)", `vest_on` true, server record and globals), W2 take off, W3 the hook's `wear`
  and the locker's `take_off`, W4 the jacket replaces the vest (frame moves, vest onRemove toast),
  W5 change and drop refused in the office with Sam there ("Not here: Sam Ellery is watching"),
  allowed back in the changing room with Kim (ignored) there, W6 a drop takes it off and a
  pick-up can be worn again (the server copy keeps `wearable`), W7 a reload keeps the costume and
  the frame, W8 the bin's `remove_item` takes it off with Sam watching. From the page, a forged
  `sync_state` of `vest_on: true` left the server value false, and `POST wear` for the binned vest
  answered 422.
- `lab_physical_pentest`, game 1209: put on at the hook in front of Ruth, refused on the open-plan
  floor (the toast named all five staff; it now reads "Tomasz Wisniewski and 4 others", unit-tested,
  not rerun in the browser), the parked tailgate
  behind Len (`kp_badge_tailgated`, `tailgate_in` complete), back to the briefing room, the locker
  takes it off ("Hi-vis off"), and with nothing worn the locker's own toast.

Spoken lines changed: none. Text changed in the lab (on-screen only): the vest's confirms say to
change out of the staff's sight; the ledger shelves' hint and observation say to take it off out
of the staff's sight ("the hall is nearest"); the locker's not-worn toast; the vest and hook
observations.

Open:

- Art: `hivis_vest.png` (the plan's tray picture) does not exist; the vest keeps the hook's
  sprite `aes_hivis_hook1` in the tray.
- The records door gate is still a client-side control. The server opens `secure_area` for Len's
  route (`npc_mapping_unlocks_door?`, method `npc`), so a player who calls `POST unlock` with
  method `npc` and attempt `len` loads the records office with no costume. Closing that needs the
  server to tell the guard's route unlock from the player's passage (an access model change, not
  this build's).
- `unseenOnly` is client-only (the server does not know where NPCs stand).
- The playtest harness's `inventoryAct` reports a confirm overlay as "confirmed" without clicking
  Confirm; follow it with `dismiss` "Confirm". A plain `location.reload()` in a run starts a new
  game (documented in the skill); game 1208 is such a stray.
- The `test_wearable` mission row was added to the shared database by hand (one record, the
  `db/seeds.rb` fields), because seeding from a worktree would delete other worktrees' missions.

## Handover

(only if the build stops at the context limit)
