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
  set when the game is created; a game with no list works it out from its own scenario snapshot
  on its first sync, inside the sync's row lock) are read-only to `sync_state`, as imported
  globals are. A client cannot set `courier_ready` by a sync.
- An item leaving the server inventory (`remove_inventory_item!`, a network plant, a player drop)
  clears the worn record and its global. A player drop of the worn item takes it out of the
  inventory in the same request, so a client that sends no inventory remove after it cannot keep
  the costume.
- In a scenario with wearables `pp_disguise` is read-only to `sync_state` too: only `POST wear`
  dresses the avatar there.
- Taking off with no worn record clears any worn global still true (and `pp_disguise`): a guard
  for a hand-edited game, and harmless after a drop the server already took off.
- Games in progress at deploy (review R2, server m1 and client 2, settled by a Rails test,
  `WearableLabTest` "a lab game from before wearables keeps the old costume behaviour"). A
  game's `scenario_data` is a snapshot taken when it is created (`Game#generate_scenario_data`
  returns when one is present, and nothing regenerates it), so a lab game started before this
  build holds the old lab JSON: its vest has no `wearable` field, in the room or in the
  inventory. The new code does not touch such a game. Its first sync stores `wearableGlobals` as
  `[]`, so `courier_ready` and `pp_disguise` stay writable by sync; nothing is ever worn; the
  bootstrap sends no `wornItem`; `POST wear` answers 422; on the client the vest has no
  wearable spec, so the tray shows no frame and no "Put on", and the old `set_costume`,
  `set_global` and `clear_costume` actions in its snapshot keep working. The client cannot lose
  a worn frame it never had. It plays the old way until the player restarts, which takes the new
  lab. The earlier reconcile on first sync and the client's take-off for a stray worn global
  could never run for a real game, so both were removed with their tests.
- The bootstrap sends `wornItem` so the tray frame comes back after a reload.
- Not server-checked: `unseenOnly`. The server does not know where NPCs stand; the rule is about
  presentation, not access. Recorded as a limit, and confirmed by the orchestrator after code
  review round 1: it stays a client check, because the server has no NPC positions (they come
  from the client's simulation) and nothing server-side reads what the costume grants.

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
- No other writer of a worn global: a `set_global` with that key, a mapping's `setGlobal`, an ink
  assignment (`~ name =`) or an ink `# set_global:name:value` tag is an error.
- Two wearables may not share a global.
- `set_costume` / `clear_costume` in a scenario with wearables is a warning (the costume and the
  worn item can disagree).
- `wear` / `take_off` must name a wearable item id.
- The `# set_variable:name=value` tag (and `# set_variable:name`, which sets it true) is an ink
  writer too.

### Lab change

The vest moves to `wearable` (costume courier, global `courier_ready`, `unseenOnly` with Ruth
ignored, so the briefing room stays a place to change and the open-plan floor does not). The hook
gives the vest and offers to put it on with `wear`; the locker uses `take_off`. The set_costume,
clear_costume and courier_ready writes go.

## Progress

Full suites after code review round 2 and the merge of `main` (ed9d1898f): Rails 1483 runs,
0 failures, 1 skip; JS 489 of 489 files. (After round 1: Rails 1481 runs, JS 489 of 489 files. Before the
first review: Rails 1440 runs, JS 485 files.)

Built as designed, with two changes found on the way: the refusal toast names at most two
watchers ("Tom and 4 others"), since the lab floor has five; and a game with no worn global list
works it out on its first sync, not saved from the bootstrap (that save held no row lock).

Files: `lib/break_escape/wearable_model.rb`, `app/models/break_escape/wearables.rb`, `POST wear`
(controller, route, policy, row lock), `public/break_escape/js/systems/wearables.js` (loaded by
`core/game.js`; `inventory.js`, `interactions.js`, `inventory-menu.js` and `apply-actions.js`
reach it through `window.wearables`, so no test harness copy list changed), `css/hud.css`,
`scripts/validate_wearable.rb`, schema, `scenarios/test_wearable`, the lab and its tests,
`README_scenario_design.md`.

Tests: `test/controllers/break_escape/wearable_test.rb` (29 after review round 2, with the plant,
no-wearable and lab path classes), `test/js/wearables.test.mjs` (25), `test/js/wearable-hooks.test.mjs` (4),
`test/js/validator-wearable.test.mjs` (6), `test/js/inventory-drop-label.test.mjs` (5), the lab
model tests updated.

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

After code review round 1 and a merge of `main` (keyless server, port 3016, headless):

- `test_wearable`, game 1214: W1 put on from the tray menu and confirm (courier sprite, frame,
  "(worn)", hint); W2 take off with confirm, and the locker's `take_off`; W3 the hook's `wear`;
  W4 the jacket replaces the vest (guard sprite, frame moves, vest onRemove); in the office with
  the vest worn, W5 Take off and Drop here refused ("Not here: Sam Ellery is watching") and W5b
  the jacket refused (the swap would take the vest off in front of Sam); W6 a drop in the
  changing room takes it off, and the server's bootstrap then has no `wornItem` and `vest_on`
  false; picked up and worn again; W7 a reload (same game) keeps the costume and the frame; W8
  the bin takes it off with Sam watching, and a `POST wear` for it then answers "That item is not
  in your inventory."
- `lab_physical_pentest`, game 1215: the hook gives the vest and its confirm puts it on (server
  record, `courier_ready` true, `pp_disguise` courier); a reload keeps it; on the open-plan floor
  the change is refused ("Tomasz Wisniewski and 4 others are watching"); in the hall it comes off
  with its confirm and "Hi-vis off", and the server agrees.

Spoken lines changed: none. Text changed in the lab (on-screen only): the vest's confirms say to
change out of the staff's sight; the ledger shelves' hint and observation say to take it off out
of the staff's sight ("the hall is nearest"); the locker's not-worn toast; the vest and hook
observations.

Open:

- Art: `hivis_vest.png` (the plan's tray picture) does not exist; the vest keeps the hook's
  sprite `aes_hivis_hook1` in the tray.
- The records door gate is a client-side control, and the gap is on `main`, not this branch's.
  No forged call is needed: Len's own route action runs in the player's browser and unlocks
  `secure_area` through `validate_unlock` (method `npc`, `npc_mapping_unlocks_door?`), so after
  his first trip the room is in the player's `unlockedRooms` and loads with no costume. The
  lab's credit for the tailgate (`kp_badge_tailgated` and the manual task `tailgate_in`) is
  written by client mappings and is writable by `sync_state` and `POST complete_task` anyway. So
  the worn global's server ownership matters only to a server reader of it, and the lab has none
  today. The sketched fix (route rooms kept apart from `unlockedRooms`, promoted only while the
  gate's worn global is true, and a server-set credit) is in `docs/IDEAS_BACKLOG.md`; it is an
  access model change with its own plan, not done here (orchestrator decision, review round 1).
- `unseenOnly` is client-only (see Server above).
- The playtest harness's `inventoryAct` reports a confirm overlay as "confirmed" without clicking
  Confirm; follow it with `dismiss` "Confirm" (now in the playtest-scenario skill). A plain
  `location.reload()` in a run starts a new game (documented in the skill); game 1208 is such a
  stray.
- The `test_wearable` mission row was added to the shared database by hand (one record, the
  `db/seeds.rb` fields), because seeding from a worktree would delete other worktrees' missions.

## Code review round 1: outcomes

Reviews: `WEARABLE_CODE_REVIEW_R1_SERVER.md` (m, n) and `WEARABLE_CODE_REVIEW_R1_CLIENT.md`
(numbered). Every finding, with what was done:

| Finding | Outcome |
|---------|---------|
| Server m1 (costume protects no server outcome, pre-existing) | Wording corrected under Open; backlog entry with the review's sketch; not fixed here (orchestrator) |
| Server m2 (in-flight lab games stuck with `courier_ready` true) | Fixed: take off with no record clears true worn globals; an older game's first sync reconciles once; the client's `take_off` also posts when the item's global is true with no record. Rails and JS tests. The reconcile and the client's stray take-off were removed in round 2: an old game never reaches them (round 2, server m1) |
| Server m3 (a player drop alone keeps the worn item) | Fixed: `player_drop` of the worn item removes it from the inventory and takes it off. The drop test now sends no remove |
| Server m4 (validator misses `# set_global:` tags) | Fixed, with a test. The scan still reads only `<scenario>/ink`, which holds every lab `storyPath` |
| Server m5 (test gaps) | Added: the lab's grant then wear then take off, a planted worn device, `POST wear` on another player's game (403), the drop and in-flight cases, `check_wearables` on the lab in a Rails test |
| Server n1 (log line) | Fixed: "read-only global", silent when the stored value is nil and the client sends false, "" or nil |
| Server n2 (`spec_for_id` unused) | Removed |
| Server n3 (`pp_disguise` client-writable) | Fixed: read-only to `sync_state` in a scenario with wearables only. Test |
| Server n4 (unrouted `Api::GamesController`) | Comment added saying why it must stay unrouted |
| Server n5 (docs) | README sentence: a mapping that copies the worn global into another global is still client-writable |
| Client 1 (text to innerHTML) | Fixed: every wearable toast and confirm passes `{ plainText: true }`, the tray drop refusal too. Tests with a hostile `displayName` and the server message |
| Client 2 (swap under watch) | Fixed: `putOn` also checks the worn item's `unseenOnly`. Unit test and sign W5b |
| Client 3 (watchers before the confirm only) | Fixed: checked again after the confirm, put on and take off. Test |
| Client 4 (no in-flight guard) | Fixed: one change at a time per window; a second click is dropped, a forced take-off waits. Tests |
| Client 5 (failed `setCostume` recorded as worn) | Fixed: the costume goes on first; on failure nothing is recorded, the server is told to take it off, the player gets a toast. Test |
| Client 6 (`restore()` untested duplicate) | `restore()` and its test deleted; `core/game.js` keeps the inline read (the module loads after it) |
| Client 7 (hooks no test would miss) | `test/js/wearable-hooks.test.mjs`: `removeFromInventory`, `refreshInventoryTray`, the tray click in `interactions.js`, the drop refusal in `openInventoryItemMenu`; each fails with its hook removed (checked). The forced take-off after a 422 is in `wearables.test.mjs` |
| Client 8 (W5 sign) | Fixed: wear the vest first, then both Take off and Drop here are refused |
| Client 9 (sign coverage) | W5b for the swap; W5 now says Kim in the next room does not count and where the long-form toast shows. No third NPC added |
| Client 10 (themed keyline) | Fixed: the selector is raised with `#inventory-container` |
| Client 11 (faux bold) | `font-weight: bold` dropped |
| Client 12 (`menuLabel` window) | Fixed: passed the window it found |
| Client 13 (raw id as a name) | Fixed: "someone" when there is no `displayName`. Test |
| Client 14 (`triggerOnInteract` on a wearable) | Already a validator warning (`check_wearables`); no change |
| Client 15 (`inventoryAct` note) | Not a bug; the skill note added (user approved, q09) |

## Code review round 2: outcomes

Reviews: `WEARABLE_CODE_REVIEW_R2_SERVER.md` (m, n) and `WEARABLE_CODE_REVIEW_R2_CLIENT.md`
(numbered). No blockers or majors. Fixes in d25add50c, then a merge of `main` (ed9d1898f, a
backlog conflict resolved keeping both sides).

| Finding | Outcome |
|---------|---------|
| Server m1 (in-flight games not upgraded; reconcile cannot run) | Settled: an old game keeps its snapshot and the old costume behaviour until restarted (Server above). Rails test builds such a game from the real lab with every `wearable` stripped. `reconcile_worn_globals!` and its two tests removed; the snapshot fallback in `worn_global_names` kept as a guard (it yields `[]` for an old game), with its test renamed; `clear_stray_worn_globals!` kept |
| Server m2 (`# set_variable:` tag) | Fixed: `wearable_ink_writers` also matches `# set_variable:name=`, `# set_variable:name` alone and one followed by another tag. Fixture lines in `validator-wearable.test.mjs`, including a longer name that must not match |
| Server m3 (`pp_disguise` without wearables) | Test added: `WearableAbsentTest`, a scenario with `disguises` and no wearable, where a sync of `pp_disguise` is stored and `wearableGlobals` is `[]` |
| Server n1 (null delete, reset) | Both tests added: a `null` sync leaves the worn global and `pp_disguise`; a reset while worn leaves no record and the list restored |
| Server n2 (action targets under listed keys only) | Not done: no scenario puts `wear` or `take_off` outside the listed keys; left as the review's suggestion |
| Client 1 (nested `wear` / `take_off` dropped silently) | Fixed, the smaller option: a call dropped because another change is in progress logs `[wearables] another change is in progress, dropped: <what>` and returns `null` (a refusal still returns `false`; no caller reads either). Tests: a coat whose `onRemove` wears the vest, and a `take_off` while a tray confirm is open. Not queued: an author who wants "take the jacket off and the vest goes on" needs a queue, which no scenario asks for yet |
| Client 2 (older games, first session) | Withdrawn by the same evidence as server m1: an old game's vest has no wearable spec on the client either, so there is no frame to lose and no "Put on" to offer. The client's stray take-off path (`strayWornId`) removed with its test |
| Client 3 (themed keyline) | Not done: accepted as it reads (the amber outline shows over the theme frame); not trivial to move |
| Client 4 (hover label and alt) | Fixed: `inventoryHoverLabel` adds " (worn)" for the worn item; `decorateSlot` sets the image `alt` to the name plus "(worn)" and back. Tests |
| Client 5 (unnamed watchers) | Fixed: named watchers first; with no names, "2 people are watching". Tests |

## Handover

(only if the build stops at the context limit)
