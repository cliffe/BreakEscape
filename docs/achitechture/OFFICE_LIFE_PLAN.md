# Office Life: plan for reusable NPC office behaviour

Status: **plan, 2026-11-05, revised after adversarial reviews R1 and R2
(`OFFICE_LIFE_PLAN_REVIEW_R1.md`, `OFFICE_LIFE_PLAN_REVIEW_R2.md`; outcomes in sections 5 and 6),
and amended the same day for social compatibility and a room leash (section 7, new slice 2a),
then revised on 2026-11-06 after the amendment's review (`OFFICE_LIFE_PLAN_REVIEW_AMEND1.md`;
outcomes in section 8). Slices 0, 1 and 2 have landed (b642594be, 5b1749a05, b670d2fcd and
b6b579e39); slice 2a, slice 3, slice 4 and slice 5 landed on 2026-11-06 (Built lines in 7.2, 2.12, 2.1 and
2.3); slice 6 is next.** Line numbers drift as slices land; the function names are the
stable reference. Engine changes
need the user's approval (AGENTS.md); so does any new art or audio (marked **[approval]**). Builds on the needs system (`NPC_NEEDS_SYSTEM.md`), seating (`SEATING.md`) and the
showcase `scenarios/test_needs_sims`, which becomes the test bed for every slice below.

The user's goal (2026-11-05): "The Sims scenario should build some behaviour that we can reuse to
bring NPCs to life, especially behaviour for office spaces and tasks. Interacting with PCs,
printers, coffee machines, etc."

The short version: most of the hard parts already exist. The needs system already picks a
target, walks there, dwells, carries items and walks back; workstations already lock or stay
open when their owner leaves; lighting and sprite variants can already show state off globals.
What is missing is (a) less hand-wiring per object, (b) multi-step tasks, (c) anything NPCs say
to each other in the world, (d) time structure (a day, interruptions), and (e) most of what the
player would actually see: carried items are hidden, action icons are text, a use is a still
figure, and nothing makes a sound. The plan below adds those in thirteen small slices, each usable
on its own, and puts the visible layer early (slice 3) so later slices have something to show.

---

## 1. What exists, and what each proposal reuses or adds

### 1.1 The parts already built (checked 2026-11-05)

| Part | Where | What it gives office life |
|---|---|---|
| Needs core | `systems/npc-needs.js` | Decaying needs, 250 ms deterministic tick (`tick` 284-294), bounded selector (`_select` 445-467), home-object preference (`_useCandidate` 469-480), carry jobs for tagged items (`_carryCandidate` 482-495), capacity claims (`_claims`/`_free` 397-418), wind-up tell (`_startJob` 497-517), seeded `roll()` (136-138), `npc_used` with the NPC's `usePayload` and `playerNearby` (`_completeJob` 576-604, `_playerProximity` 607-610) |
| Live adapter | `npc-needs.js` `createEngineWorld` 706-922 | Object scan (`listObjects` 773-787; it skips any object with neither `affordance` nor `needsTag` at 782, before `describe` runs), approach cells from `useFrom` (792-804), synchronous reachability via EasyStar (805-832), player proximity (`playerProximity` 833-846: same room, clear line, **96 px**), pick up / consume / drop held items (about 876-916). `pickUp` hides the sprite and deletes it from `rooms[roomId].objects`, keeping room and key in `rec._needsCarried`; `dropHeld` re-registers it under the NPC's room and overwrites `sp.roomId` with it; a carry job **always consumes** at the target (`_completeJob` 588 → `consumeHeld`, which destroys the sprite and removes the object server-side, 884-892) |
| Script composition | `npc-needs.js` `onExternalMove` 240-250, `control` 253-280; `npc-behavior.js:2456`; `npc-manager.js:855, 1164-1166` | Any non-needs `goToAndStay` suspends needs; eventMapping `needs: "suspend" \| "resume" \| {set}` |
| Movement | `npc-behavior.js` `goToAndStay` 2448, `cancelMove` 2499, `faceWorldPoint` 2518, `_triggerGoToStayArrival` 2524; chat freeze guard 710 | The only way needs moves NPCs; collision, stall recovery and depth sorting come free |
| Route patrols | `npc-behavior.js` route waypoints with `dwellTime` (1072-1110), route actions `{unlockRoom, useObject}` (1609-1647), route-room preload (658-672) | Fixed beats such as Len's badge round in `lab_physical_pentest`; precedent for preloading rooms |
| Workstations | `systems/workstation-state.js` (`isWorkstation` 43-46, `ownerOf` 49-55, `onLeft`/`onReturned` 112-134, `installWorkstationState` 157); `interactions.js:792` | Owner leaves → screen locks or stays open (`locksScreenOnLeave`, seeded `lockChance`); globals `<id>_screen_locked`, `<id>_owner_away`; events `workstation_owner_left/returned`, `workstation_accessed`, `workstation_locked_attempt`. Reads `scenarioData` directly, so anything a preset adds must be visible to it too |
| Action icons | `systems/npc-action-icons.js` | **Text** glyph over an NPC's head while it has a job (`pickIcon` 22-32; a monospace `add.text`, 69-72; the showcase uses `"PC"`, `"C"`), pulsing during the wind-up. Shown for every NPC with a job, in any loaded room, lit or dark (64) |
| Debug overlay | `systems/npc-needs-debug.js` | Need bars and job label per NPC; `window.__test.needs.overlay()` |
| Seating | `systems/seating.js` (`poseSprite` 598-609, `updateSeatedNPC` 686, `needsStop` 739-748, `seatPreference` 759-768, chair fetch 899, `tuckIn` 883) | Needs NPCs sit at desks, fetch a swivel chair, tuck it in when they leave. Default: `'fetch'` for **any** object that satisfies `work` (even another NPC's desk) or the NPC's own post, else `'near'` (sit only on a chair already there). The "chairs at another NPC's post" guard lifts when the stop is that post (865-866). NPCs whose atlas has no `sit_*` frames always stand. `needsStop` is non-null only for `idle && atPost` or a job in phase `using`, so any other phase unseats the NPC (827-830). A seated NPC is re-posed every frame (`poseSprite` from `updateNeedsSeat`, 849), which puts the sprite back if its rounded position moved |
| Lighting | `systems/lighting.js` header 1-45; `RANSOM_VARIANT` 87; emitter table `EMITTERS` 180-196 (matched on **texture key**); `variantsFor` 515, `buildEmitters` 531-555, `resolveEmitters` 558-583; draw loop 1011-1070; `clusterEmitters` 586-600; `hearing` 706-711 | Per-object glow with condition variants (`emitters` keyed by object id, first matching `globalVars` condition wins); motion-sensor rooms; `screen`/`blink`/`pulse`/`breathe` effects. **One glow and one light-map stamp per emitter, one emitter per object**: a matching variant is merged over the base and becomes the whole definition. In a **lit** room a glow sits under the multiply light map, just in front of its object; only `ransom` and `above: true` definitions draw above it (with figure fade and hue keep). Plain `screen` emitters within 32 px share a damped glow. `hearing(roomId)` gives a room's sound level where the player is (own room 1, through a door 0.4, else 0); `window.lightingSystem` is null in a scenario without lighting |
| Sprite variants | `core/rooms.js` `registerSpriteVariantListeners` 688-722 | Object texture swaps when a `globalVars` condition changes (globals only) |
| Reveal on global | `core/rooms.js` `hideUntilReveal`/`showRevealedObject` 2952-2976, `revealRoom` 3023 | A declared object stays hidden and non-interactive until a named global turns `true`; globals are restored before a room reveals, so the reveal survives a reload. **One-way**: the listener only handles `true` (2961-2963). **The listener is registered only by `hideUntilReveal`, i.e. only for objects whose global is not true when the room reveals**: after a reload with the global true, `revealRoom` shows the object and registers nothing. The lab's planted keylogger uses it |
| Reading notes | `systems/interactions.js` 1694-1750; `minigames/notes/notes-minigame.js` `removeNoteFromScene` 235-271, auto-add 660-709 | Any readable `notes*` object opens the notes minigame, which (auto-add on by default) hides the sprite, sets `active = false` and calls `removeItemFromRoom` on the server, **takeable or not**. `"readDisplay": "gameDisplay"` reads in place instead (1699-1706) and leaves the object where it is |
| Player drops | `systems/item-drop.js` (`persistDrop` 41-75) | A dropped `droppable` item is saved as a server room object (`objects_added`, `sourceType: 'player_drop'`) at the drop point. It has no declared position and no reveal global. Player pickup (`inventory.js` 510-533) and the notes path (`notes-minigame.js` 252-271) both remove an item from `rooms[currentPlayerRoom].objects[objectId]` and tell the server using `sprite.roomId` |
| Server object rules | `app/controllers/break_escape/games_controller.rb` `object_state_params` 2183-2188, `find_accessible_item` 1869; `app/models/break_escape/game.rb` `add_item_to_room!` 378, `remove_item_from_room!` 454 | `updateObjectState` may only change `opened, on, brightness, screen_state`, so **visibility is not saved server-side**. Collecting checks that the item is declared, in an accessible room and `takeable`; it does not look at `revealOnGlobal` or at the item's position. Adding a room object is limited to NPC-held items and player drops of held `droppable` items, so an NPC-moved scenario object cannot have its new position saved |
| State sync | `state-sync.js` 160-170 | Every global syncs (the server accepts any key that is not an imported global, `game.rb` 274-292); NPC visibility from `setNPCVisible` is saved (`npcVisibility`) |
| Sound | `systems/sound-manager.js` `play` 195-230, `playAmbient` 293; room `ambientSound`/`ambientVolume` (`core/rooms.js` 3129-3176, schema `scenario-schema.json:4004`); `assets/sounds/` | Non-positional play at a category volume. `play` reuses **one Phaser sound per key** and sets its volume, so a second caller restarts the first's sound. Rooms already take a looped `ambientSound`, faded by door adjacency. Office-usable files that exist: `drink_gulp`, `eat_snack`, `drawer_open`, `page_turn`, `chair_roll`, `footsteps`, `keypad_beep`, `phone_vibrate`, `message_received`, `server_room_ventilation` (an ambience precedent). The UI clicks are loaded as `ui_click_1`-`ui_click_6` and are the player's own interface sounds. No printer, kettle, coffee machine, desk-phone ring, typing or office-room tone |
| Character atlases | `assets/characters/<key>.json` | Per-direction `breathing-idle`, `walk`, `cross-punch`, `lead-jab`, `taking-punch`, `falling-back-death`; `sit_*` frames on some atlases (`seating.js:173`). No typing, pouring or carrying animations |
| Small item sprites | `assets/objects/`, `assets/icons/` | Native-size sprites usable as held items or icons without resizing: `notes1` 16×16, `notes_postit1` 9×9, `coffee_cups1` 21×20, `office-misc-cup*`, `kettle1` 15×18, `phone1` 20×17, `dirty_mugs1`; icons `talk` 21×18, `mark-question`, `clipboard`, `mail-new` 16×16 |
| Sight challenge | `systems/npc-sight-challenge.js` 1-48 | `challengeOnSight` with `near: {object, radius}`, `requireGlobal`, `skipIfGlobal`, cooldown |
| Game clock | `systems/game-clock.js` (`parseGameClockRate` 54, `gameSecondsAt` 99, `timeParts` 158); installed in every game (`core/game.js:1678`) | Elapsed time that survives reload (`elapsedMs()`, saved with the sync); optional in-game time of day with a story `rate` and anchors. The **needs clock is separate**: in memory, 0 on every load (`npc-needs.js:115`, `reset` 199) |
| Room state sync | `systems/room-state-sync.js` (`addItemToRoom` 17, `removeItemFromRoom` 85, `updateObjectState` 138) | Server-side add/remove/update of room objects |
| Phone barks | `systems/npc-barks.js`; `npc-manager.js` 1482-1521 | DOM notification barks (phone style) from eventMappings. **There is no in-world speech bubble for sprite NPCs** |
| Validator | `scripts/validate_npc_needs.rb` (161 lines), `scripts/scenario-schema.json` | Bounds, missing targets, T1/P timing report, "target in another room" warnings |
| Tests | `test/js/npc-needs.test.mjs`, `workstation-state.test.mjs`, `npc-action-icons.test.mjs`, `seating.test.mjs`, `npc-sight-challenge.test.mjs`, `lighting-room-variants.test.mjs` | Stub-world, manual-clock node tests with byte-identical decision logs. The stub world is `makeWorld` with an `office()` fixture (`npc-needs.test.mjs` 12-60); its `approachCell` ignores `useFrom` (29). **No test loads `test_needs_sims`**; that scenario is proved only live, by its README table |

### 1.2 Constraints that shape every feature

1. **Only loaded rooms exist.** Rooms load when a door opens (`doors.js:763`) or a route action
   loads them; `unloadNPCSprites` (`rooms.js:3335`) is exported but nothing calls it, so a loaded
   room stays loaded. NPCs register per room (`npc-lazy-loader.js:103, 139`). The needs system
   sees only loaded rooms' objects. An NPC in an unloaded room does not exist yet; an object in one
   is not an option. Nothing below simulates unloaded rooms.
2. **The server owns takeable items.** The player can only collect an item the server knows about.
   So anything the player should be able to *take* (a printout, a left-behind badge) must be a
   declared scenario object that is revealed, never an item the engine invents at runtime.
   Engine-spawned props are cosmetic. Three server facts follow (1.1, "Server object rules"):
   visibility is not saved per object, so **a reveal must hang on a global** (`revealOnGlobal`);
   an NPC moving a scenario object cannot save its new position, so **after a reload a moved item
   is back at its declared spot**; and once the player takes a declared item it is gone for good,
   so **a takeable slot is a single beat** (repeats come from a pool of slots or are cosmetic).
   Hidden slots are hidden client-side only (the server does not check `revealOnGlobal` on
   collect), the same position as the lab's planted keylogger; acceptable for props, not for
   anything that gates scoring.
3. **Needs state does not persist.** On reload levels reset to `initial`, the needs clock restarts
   at 0 and NPCs start at their posts (`NPC_NEEDS_SYSTEM.md` §10). Globals, NPC visibility and the
   game clock's elapsed time do persist. Anything we add must self-heal from "everyone at their
   desk, globals and visibility as saved", and anything that must not replay after a reload
   (schedules) runs on the game clock, not the needs clock.
4. **Determinism.** No `Math.random()`; seeded rolls only (`roll(npcId, salt)`), sorted iteration.
   Node tests depend on it.
5. **Cyber-neutral engine.** The engine moves people and items and emits events. What a printout
   says or what an open screen yields is scenario data.
6. **No runtime LLMs** (standing rule). Chatter is authored lines.
7. **Every slice shows something.** Each slice's "done" list names what the player sees or hears
   change, not only the events it emits. Build the visible layer from what exists (1.1: atlases,
   small sprites, sounds); new icons, sprites, animations or audio are marked **[approval]** and
   wait for the user. Pixel art is drawn at native size, never scaled down (standing rule).
8. **Schema with every field.** `affordance` has `additionalProperties: false`
   (`scripts/scenario-schema.json:4975-4988`), so every new field is a schema entry with a
   description in the slice that adds it, and counts in that slice's size.

### 1.3 Proposal-by-proposal: reuse versus new

| # | Proposal | Reuses | Adds | Verdict |
|---|---|---|---|---|
| 1 | Affordance presets by object type | `affordance` fields, `useFrom`, `approachCell`, validator | A preset table (one JSON file read by `office-presets.js` and the validator) keyed on **exact** types plus an `officeType` field; one resolver used by `listObjects`, `describe` (so `getObject`) and the action-icon `targetInfo`. Presets never make an object a workstation | **Keep, early.** Pure data; removes most hand-wiring |
| 2 | Multi-step routines | use and carry jobs, presence-driven carry, `revealOnGlobal`, capacity | Reusable reveal slots that are placed and stowed instead of consumed (slice 7, useful alone; the outcome follows from the item's kind); then a `steps` list on the job, a scenario routine library, a seeded routine-or-plain-use mix (slice 9) | **Keep, central.** Build as a chain of the existing two job kinds, not a new mover |
| 3 | Visible object state | workstation-state globals, lighting emitter variants and their `above` draw path | A second ("indicator") emitter record per workstation, with built-in away-open and away-locked variants; fix for stale workstation globals on reload. No activity registry: a busy machine already shows through the action icon over the NPC using it (slice 3) | **Keep, early and small.** Half of it is authoring today |
| 4 | NPC↔NPC social, queues | capacity 2 cooler and sofa, `faceTo`, seating | In-world speech bubbles (new module), pairing at shared objects with capacity 2 or more; pairing with the first queued NPC once queues exist; queue cells | **Keep, split.** Bubbles + pairing first, queues (and coffee-machine chatter) later |
| 5 | Daily schedule | GameClock, `control({set})`, route patrols | Schedule entries that change need weights or start routines; preemption | **Defer to Tier 2.** Sessions are 20-40 min, so a "day" is compressed |
| 6 | Personality traits | need fields, `lockChance`, `roll()` | Trait sugar expanded at register time | **Keep, cheap.** No runtime system, only expansion |
| 7 | Consumables and refills | affordance, carry jobs | Per-object stock counter, a restock interest | **Defer.** Useful for longer absences, low priority |
| 8 | Interruptions | `control`, `onExternalMove`, eventMappings | Preempting a running job by priority | **Merge with 5.** Same mechanism |
| 9 | Opportunity windows | workstation-state, `npc_left_post`, `playerNearby`, `revealOnGlobal` | An away-estimate on `npc_left_post`, left-behind items via trait rolls, piles with a count | **Keep as gameplay states.** Mostly scenario wiring once 2, 3 and 6 exist |
| 10 | NPCs noticing the player at their desk | `_playerProximity`, sight challenge `near.object` | Proximity data on `npc_returned_post`, an `npc_caught_at_post` event; first, a fix so a use of the NPC's own desk is not a leave (2.11) | **Keep, early.** About 40 lines plus the fix; big payoff for the lab |
| — | What the player sees (added after R1) | action-icon loop, carried sprite, seating's per-frame pose, sit frames, `lighting.hearing`, small sprites | Sprite action icons, a carried item drawn at the hand, a typing bob for seated NPCs (inside seating), use sounds heard only from the player's room (2.12) | **Keep, early (slice 3).** Without it the rest is invisible |

Not in the proposal but needed first: **tick-cost hygiene** (section 2.0). Every idle NPC calls
`listObjects()` each tick, before it knows whether any need is urgent (446), which walks and sorts every loaded
room's objects (773-787). Repeated synchronous EasyStar searches come from a target that is
**free but unreachable** (each candidate is path-checked in distance order, 434-443) and from
interests, which path-check the item before looking for a free accepting target (484-489). An NPC
whose targets are all claimed does no path search (`_useCandidate` filters by `_free` first, 470).
`npc-action-icons.js` `targetInfo` (36-49) scans every room's objects per frame for each NPC that
has a job (64-67). Fine for five NPCs; not for fifteen with routines.

---

## 2. Features

Each feature lists: authoring format, engine changes (size is new or changed lines including
validator and schema, excluding tests), save and lazy-loading, performance, the visible change,
tests, risks. "Live check" means the keyless server on :3001, headless, driven through
`window.__test` (playtest-scenario skill), with the decision log and screenshots as evidence.

### 2.0 Tick-cost hygiene (prerequisite)

**Built: 2026-11-05 (slice 1, commit 5b1749a05).** Steps 1-4 and the icon cache as written; the
room-load hook (R3 m1) is the adapter's `roomIds()`, checked at the start of each tick
(`_onRoomsLoaded` is the place slice 7 hangs "stow on sight"); a need newly going urgent also
clears that NPC's back-off. Fixture: `test/js/fixtures/needs-sims-world.mjs` (extends
`makeWorld`, now in `fixtures/needs-stub-world.mjs`); tests in `npc-needs-tick-cost.test.mjs`.
Live, `test_needs_sims` (games 541 before, 544 after, same script): object scans 3.5 to 0.9 per
tick, path searches 0.36 to 0.11 per tick, mean tick 0.34 to 0.19 ms; every README beat still
happens and the contention start lands on the same tick as the freeing use. Not done: the
15-NPC generated copy and its `.gitignore` line, and the README live-proof table re-run.

**Engine.** In `npc-needs.js`, in this order:
1. Short-circuit `_select` before `listObjects` when no need is urgent or starved and the NPC has
   no interests (446). The cheapest win: most NPCs most ticks are not choosing anything.
2. Build the object list once per tick, lazily (only when the first NPC needs it), and pass it to
   every `_select`. Patch the cached list on the three calls that change it within a tick
   (`pickUp` 875, `consumeHeld` 889, `dropHeld` 907) so the log stays byte-identical.
3. Cache `reachable(npcId, targetId)` for the tick.
4. Back-off where the repeated searches really are: an NPC whose `_select` returned nothing
   **after** running a path search (a free but unreachable target, or an interest item with no
   free accepting target) re-selects after 1 s instead of every 250 ms. An NPC that found every
   target claimed does no search and keeps the 250 ms check. Clear **all** back-offs whenever any
   job completes or aborts (a waiting NPC has no candidate, so it does not know which object it
   waits for), and whenever a room loads.
In `npc-action-icons.js`: cache `targetInfo` by id and drop the entry when the target's sprite is
destroyed. About 90 lines.

**Save/lazy-loading.** None. A room load clears the cache and the back-offs.

**Visible change.** None intended; this slice is the one exception to constraint 7.

**Behaviour change.** Steps 1-3 keep the decision log byte-identical. Step 4 can move the tick on
which a blocked NPC starts by up to four ticks. That touches the `test_needs_sims` README
live-proof table (e.g. "283 tom job_start ... same tick Amara's use completes", README line 63)
and could move a beat in `lab_physical_pentest` by up to a second; re-run both and update the
table.

**Fixture (new in this slice, test code, about 150 lines).** No test loads `test_needs_sims`
today, and it cannot be loaded as is: it is a `.json.erb`, and its PCs and laptops have no
`position` (they are placed from the room map at runtime). So this slice adds a hand-written node
fixture, `test/js/fixtures/needs-sims-world.mjs`, shaped like the showcase: the five staff with
their needs, `needsHome`, interests and seeds as in `scenario.json.erb`; every object with its
affordance and fixed coordinates read off a live run (`window.__test` object positions, recorded
in a comment with the commit they came from); and a stub `approachCell` that honours `useFrom`
the way the live adapter does (`useFrom` given: the cell at that offset from the object; absent:
the nearest-walkable cell the live run recorded for that object, since the stub has no walls). It extends `makeWorld` rather than replacing it, so the
`office()` tests stay as they are. Slices 4, 7 and 9 reuse it.

**Tests.** Node: the decision log is byte-identical with steps 1-3 on, on both the `office()`
fixture and the new sims fixture; with step 4, a fixture with an unreachable target asserts at
most one path search per second, and a contention fixture asserts the waiting NPC still starts
within four ticks of the target freeing. A micro-benchmark in the node test: 20 NPCs × 200
objects × 1,000 ticks under a set budget. The real scenario is checked live: the README live-proof
table re-run, with any moved ticks noted. Live performance: frame time with 15 NPCs, from a
generated copy of `test_needs_sims` (a node script writes `scenarios/test_needs_sims_15/`, where
the server can load it, with the five staff cloned three times at offset desks and seeds). The
slice adds `scenarios/test_needs_sims_15/` to `.gitignore`, so the copy never shows as untracked
to other agents in the shared tree and cannot be swept into a commit; the script deletes it after
the run.

**Risk.** Back-off delays a blocked NPC by up to a second; clearing on every completion keeps
contention timing close to today.

### 2.1 Affordance presets by object type (proposal 1)

**Built: 2026-11-06 (aab2943c1), apart from the `lab_physical_pentest` live regression (skipped:
another agent was dressing its accounts floor; the lab has no `officePresets`, so the resolver
returns its authored affordances unchanged, and the validator finds no preset there).** As
written, with these choices: the table lives at `public/break_escape/js/data/office-presets.json`
(the engine serves only `/js`, `/css` and `/assets`; a `/data` route would need a server
restart), fetched relative to the module; `kettle1` joins the `coffee` types (the showcase's
kettle from slice 2a); presets carry the default `useSound`s 2.12 lists (`drink_gulp` coffee and
cooler, `eat_snack` fridge and microwave, `drawer_open` filing); the cooler's `chatter` waits for
slice 8 (the schema's `affordance` takes no unknown keys); an unknown `officeType` gets no preset
(validator error) and an `officeType` without the switch is a validator warning. The resolver
reaches `npc-needs.js` and `npc-action-icons.js` through `window.officePresets` (npc-needs keeps
no static imports), installed by `core/game.js` before the needs system, so no harness copy list
changed. The validator expands presets before every other check, so `affordance: false` (now
legal) no longer crashes its `dig` calls. The parity list gained the PCs' `private: true` (slice
2a, OQ25) and the kettle's `useFrom`; the parity test runs a 15-minute sims day (43 uses at nine
objects) and the logs are byte-identical. `test_needs_sims` opts in with exactly those overrides
and a new task, `hear_snack` (the fridge and microwave now carry no affordance at all, so the
`eat_snack` heard comes from the preset). Live (:3001 headless, game 599, office only so far):
the four office objects resolve to their presets, the two decor `laptop` sprites with no id and
the declared `grace_laptop` (`affordance: false`) do not, no workstation globals appear, the
contention beat is unchanged (Amara `used office_coffee` at tick 278), Amara uses the office
coffee from the left (own `useFrom` over the preset's), and `hear_drink` ticks from the preset's
default `drink_gulp`. Kitchen, lounge and `test_needs_leash` live runs are open
(`HANDOVER_OFFICE_S4.md`).

**Authoring.** An object gets a working affordance from its `type` alone; anything written on the
object overrides the preset field by field.

```jsonc
{ "id": "tom_pc", "type": "pc" }                               // work, 10 s, nearest walkable cell, seat fetch (seating's default for work)
{ "id": "kitchen_coffee", "type": "coffee_station1" }          // caffeine, 12 s, nearest walkable cell, seat near
{ "id": "cooler", "type": "water_cooler1",
  "affordance": { "useSeconds": 20 } }                         // override one field
{ "id": "lobby_sofa", "type": "leather_sofa1", "affordance": false }   // opt out
{ "id": "front_desk_phone", "type": "phone1", "officeType": "desk_phone" }   // opt in by role, not by type
```

Scenario switch: `"officePresets": true` (default false, so no shipped scenario changes).

**Which objects get a preset.** Exact `type` values only, no prefixes: `type` is what scenarios
write and is often not the texture key (the lab coffee station is `type: coffee_station`,
`sprite: coffee_station1`), so matching it like lighting's texture-key regexes would miss and
mis-hit. An object can name its role instead with `officeType` (a preset id), which wins over
`type`. Never preset: anything `takeable: true`, anything with a `lockType`, anything with
`affordance: false`. So the 49 takeable `phone` items, the `filing_cabinet_locked*` puzzles and
`printer_3d2` stay as they are; a desk phone, a filing cabinet NPCs may use and a post tray are
opted in with `officeType`.

**Only scenario-declared objects (R3-M1, a condition of building this slice).** Unreserved Tiled
items are registered in `rooms[roomId].objects` with a synthetic `scenarioData` whose `type` is
the image name without digits (`core/rooms.js` about 2736-2741), so decor `laptop6.png` reads as
`type: "laptop"` and would become a work target. `resolveAffordance` therefore gives no preset to
an object without a scenario `id` (or with `decor: true`): presets apply only to objects declared
in `scenario.rooms[*].objects`. Node test: a decor-shaped sprite (`{ type: 'laptop',
takeable: false }`, no id) resolves to no affordance. Live: the slice-4 run lists every object
with a resolved preset through `window.__test` and compares the list with the validator's.

Preset table (one value per cell; the values are `test_needs_sims`'s hand-wired ones where it has
the object, so the parity test below has few overrides). A blank `useFrom` means the preset sets
none, so the live adapter uses the nearest walkable cell, as the showcase's PCs, microwave and
cooler do today. Presets set **no `seat`**: seating's defaults (`fetch` for anything that
satisfies `work` or is the NPC's post, `near` elsewhere; `seatPreference`, `seating.js:759-768`)
are what the showcase runs on now, and an author who wants an NPC to stand at the fridge writes
`seat: "stand"` on the object.

| Preset id | Exact types | satisfies | restores | useSeconds | capacity | useFrom | extra |
|---|---|---|---|---|---|---|---|
| `desk_pc` | `pc`, `pc3`, `pc10`, `laptop`, `workstation` | work | 60 | 10 | 1 | | |
| `coffee` | `coffee_station`, `coffee_station1`, `kettle` | caffeine | 70 | 12 | 1 | {0,1} | |
| `cooler` | `water_cooler`, `water_cooler1` | thirst, social | 70 | 15 | 2 | | `chatter: "cooler"` (2.4) |
| `fridge` | `qdc_fridge1` | hunger | 80 | 15 | 1 | {0,1} | |
| `microwave` | `microwave1` | hunger | 60 | 10 | 1 | | |
| `sofa` | `leather_sofa1` | rest | 80 | 20 | 2 | {0,-1} | |
| `copier` | `photocopier`, `photocopier1` | (none) | | 8 | 1 | {0,1} | routine target; output slots (2.2) |
| `shredder` | `shredder`, `shredder1` | (none) | | 6 | 1 | {0,1} | accepts `to_shred` |
| `filing` | (none: `officeType: "filing"` only) | (none) | | 12 | 1 | {0,1} | routine target |
| `post_tray` | (none: `officeType` only) | (none) | | 5 | 1 | {0,1} | routine target |
| `desk_phone` | (none: `officeType` only) | (none) | | 0 | 1 | owner's desk | rings (2.9) |

A preset with no `satisfies` is a routine target only (2.2); it never draws an NPC on its own.

**Presets never make a workstation.** An earlier draft had `desk_pc` add `workstation: true`.
That would make every preset PC lock on its owner's first leave (`decideLocked` returns
`locksScreenOnLeave !== false`, i.e. true, when nothing is set; `workstation-state.js:62-71`),
publish `<id>_screen_locked`/`<id>_owner_away` and emit `workstation_owner_left`, a behaviour
change in every scenario that switches presets on. A workstation stays opt-in per object
(`workstation: true`, `locksScreenOnLeave` or `lockChance`, as today), so `isWorkstation` needs
no resolver and workstation-state is untouched by this slice.

**Engine.** New `systems/office-presets.js` (about 60 lines, no imports) loads the table from
`public/break_escape/data/office-presets.json` (passed in at install, so node tests read the file
directly) and exports `resolveAffordance(scenarioData, scenario)`: authored fields over the preset,
`false` meaning none, exclusions above applied. One resolver, three callers:
- `listObjects` (`npc-needs.js`, the skip test, about 782): the skip test becomes "no resolved
  affordance and no `needsTag`", or a preset object never reaches `describe` and the slice does
  nothing;
- `describe` (about 721) and so `getObject`, `approachCell`, seating's `needsObject`;
- the action-icon `targetInfo` (`npc-action-icons.js` 35-47), so icons see preset `satisfies`.
The resolved value is cached on the sprite (`sp._officeAffordance`) and cleared when the scenario
flag is off. Dynamic import in `core/game.js` beside the needs install, so no test-harness copy
list changes. About 85 lines.

**Validator.** `validate_npc_needs.rb` reads the same JSON file (no Ruby copy, so no parity test
between two tables) and expands presets the same way, so the "need with no object" error and the
T1/P report see preset affordances. It lists every object that gained a preset and every
`officeType` it does not know. About 45 lines.

**Schema.** `officePresets` (boolean, scenario level); `officeType` (enum of preset ids, object
level); `affordance` becomes `oneOf: [object, false]`. About 20 lines. (`seat: "near"` is no longer
needed in the schema, since presets set no `seat`.)

**Save/lazy-loading.** None new: presets are resolved when the object is described.

**Performance.** One map lookup per object, cached on the sprite.

**Visible change.** None by itself; it is what lets slice 5's indicators and the copier, tray and
filing targets of slices 7 and 9 work without per-object wiring.

**Tests.** Node: the resolver (exact match, `officeType` wins, exclusions, override merge, `false`
opt-out); `listObjects` on a stub room includes a preset-only object; a preset `pc` is **not** a
workstation (`isWorkstation` false, no `_owner_away` global after a leave). **Parity, stated
honestly:** `test_needs_sims` cannot lose every affordance, because some of its values are
deliberate and not preset material. The parity test runs on slice 1's sims fixture
(`needs-sims-world.mjs`, whose `approachCell` honours `useFrom`, so a `useFrom` difference would
show). It builds a second copy of the fixture with `officePresets: true` and each affordance
replaced by **only the fields that differ from the preset**, and that remaining-overrides list is
written in the test so a reader sees it:
- `amara_pc`: `accepts: ["post"]` (the parcel beat);
- `office_coffee`: `useFrom: {dx: -1, dy: 0}`;
- `kitchen_coffee`: `useFrom: {dx: 0, dy: -1}`;
- `grace_laptop`, `rosa_laptop`: `affordance: false` (no affordance today; the preset would make
  them work targets);
- `washing_up_tray`: unchanged (`mugs_tray1` has no preset).
The three PCs, the microwave and the cooler need no `useFrom` override because their presets set
none, exactly as the showcase has them now; the fridge and sofa match their presets' `useFrom`; no
object needs a `seat` override because presets set none. The test asserts the decision log is
byte-identical for the same seed, and that the preset copy has fewer affordance fields than the
original (a guard against the overrides creeping back to a copy). `test_needs_sims` itself
switches to presets in this slice with exactly those overrides, so the showcase demonstrates the
feature. Live: one run; since no approach cell, post or workstation changes, the README live-proof
table should be unchanged, and the run checks that.

**Risks.** `pc` (102 uses) and `workstation` (27) are also puzzle terminals; the exclusions catch
those with a `lockType`, and the validator list catches the rest. The switch is per scenario, and
`affordance: false` opts an object out. A preset with no `useFrom` lands the NPC on whichever
walkable cell is nearest, which on a crowded desk row can be the wrong side; the author adds
`useFrom` (the lab already does for its PCs).

### 2.2 Routines: multi-step tasks (proposal 2)

Two slices. **Part A** (slice 7) changes what happens to a carried item at the target and adds
reveal slots that can be reused and survive a reload; it works with today's interests and has its
own showcase beat. **Part B** (slice 9) chains jobs into routines on top of it.

#### Part A: carry outcomes and reveal slots (slice 7)

**Why first.** Today a carry always consumes: `_completeJob` calls `consumeHeld` (588), which
destroys the sprite and removes the object from the server's room state (884-892). A printout
delivered to a desk would vanish there, a declared slot would be gone for good after one use, and
an item "picked up again" by its owner could never come back. None of the printer or left-behind
windows can work until a carry can end in something other than consumption.

**Authoring.**

```jsonc
// the accepting object needs nothing new: the outcome follows from what is delivered
{ "id": "amara_pc", "type": "pc", "affordance": { "accepts": ["post", "printout"] } }
// optional, for a target that files or shreds slots instead of setting them down
{ "id": "office_shredder", "type": "shredder1", "affordance": { "accepts": ["to_shred"], "onDeliver": "stow" } }

// a reveal slot: a declared object, hidden until its global is true; read in place, so it cycles
{ "id": "copier_tray_1", "type": "notes", "name": "Printout", "takeable": false, "readable": true,
  "readDisplay": "gameDisplay", "text": "...", "outputOf": "office_copier",
  "revealOnGlobal": "copier_tray_1_out", "needsTag": "printout", "position": { "x": 9, "y": 2 } }

// something that prints: an onUse hook (onUse already supports setGlobal/emitEvent, about 600)
"onUse": { "sanjay_pc": { "revealOutput": "office_copier" } }
```

**Outcomes follow the item's kind**, not a per-target setting:
- **A plain item** (anything that is not a slot: the parcel, the dirty mugs, any player drop) is
  **consumed**, today's path unchanged, so the parcel and mug beats keep byte-identical logs. A
  player drop exists only in the server's `objects_added` at the drop point (`item-drop.js`
  41-75), with no declared spot and no reveal global, so there is nothing to put it back to;
  consuming it is also what stops a reload from bringing it back at the drop point.
- **A slot** (a declared object with `outputOf` or `leftBehindBy` and an engine-owned
  `revealOnGlobal`, below) is **placed** at the target by default, or **stowed** at once when the
  accepting object says `onDeliver: "stow"` (a shredder, a filing cabinet) or a routine step says
  `then: "stow"`. `onDeliver` takes only `"place"` or `"stow"` and only affects slots; the
  validator warns when it is set on an object no slot's tag reaches.

`place`: the slot is set down on the target, at its centre plus `affordance.placeAt {dx, dy}`
(tiles; default halfway from the centre towards the approach cell), visible and interactable.
Room bookkeeping, matched to what the pickup paths read (`inventory.js` 510-533 looks the sprite
up in `rooms[currentPlayerRoom].objects[objectId]` and sends `sprite.roomId` to the server;
`notes-minigame.js` 252-271 sends `this.item.roomId`): the sprite is registered under the room it
now **sits in**, keyed by its object id, and `sp.roomId` stays the **declared** room, the one the
server knows it in. The place path does not touch `sp.roomId` (unlike `dropHeld`, which overwrites
it). A placed slot is not a carry candidate (`describe` reports it not `pickable` to needs while
`sp._npcPlacedBy` is set), or the deliverer's own interest would pick it straight back up. After
`affordance.placeSeconds` (default 60, on the needs clock) the engine stows it: someone filed it.
`placeSeconds: 0` leaves it until a reload. Client only: the server cannot save an NPC-moved
object's position (1.2.2).

`stow`: the slot goes back to its declared position, hidden and non-interactive; it is removed
from whichever room's `objects` holds it and re-inserted into its declared room's `objects` under
its original key (`pickUp` deleted it there, about 882; without this, `findSprite` and the free
test never see it again); its reveal global is set to `false`. No server call. A stowed slot is
free again.

**Reveal slots.** A declared object with `outputOf: "<producer id>"` and a `revealOnGlobal` whose
global the engine owns (validator: both present, the global unique to the slot and not used in
any other condition). The existing `revealOnGlobal` keeps the slot hidden from the start. **Show
and hide are direct calls, not the global's listener**: that listener exists only for objects
that were hidden when their room revealed (`core/rooms.js:2955-2965`), so after a reload with the
global true there is none, and a slot stowed then could never be shown again. `core/rooms.js`
exports `showRevealedObject` and a new `hideRevealedObject` (the first half of `hideUntilReveal`,
about 10 lines). The engine adds:
- `revealOutput(producerId, npcId)` in the world adapter: take the first free slot of that
  producer (sorted by id; free = loaded, sprite not destroyed and `active !== false`, global not
  `true`, not in the player's inventory), set its global `true` and call `showRevealedObject` on
  it, emit `object_revealed:<slotId>` `{producerId, npcId}`. Returns the slot id or null. Where the
  listener does exist it shows the sprite a second time, which is harmless. (`active !== false`
  catches a slot the player took or read through the notebook earlier in the session; after a
  reload a taken slot is not loaded at all, because the room payload filters it out.)
- `stow` calls `hideRevealedObject`, then sets the global false (order does not matter: no
  listener reacts to `false`).
- **No free slot**: the producer shows a cosmetic sprite (the first slot's texture, or `notes1`)
  for its `placeSeconds`, client only and never takeable, built with the item-drop sprite code
  (`item-drop.js`). A routine that wanted the output carries nothing and still completes.

**Reading a slot.** Any readable `notes*` object opened the default way goes through the notes
minigame, which removes it from the scene and from the server on first read, whether or not it is
takeable (`notes-minigame.js` 235-271, 707-709). So a slot meant to cycle must read in place:
`"readDisplay": "gameDisplay"` (`interactions.js` 1699-1706), or be a non-`notes` type. The
validator rejects a non-takeable readable `notes*` slot without `readDisplay: "gameDisplay"`. A
takeable `notes*` slot read through the notebook is collected, so it is a single beat like any
taken slot.

**Single beats and repeats.** A slot the player takes (or reads through the notebook) is gone
server-side for good, so **each takeable slot is one beat**. Repeats come from a pool (several
slots with the same `outputOf`, used in id order: "the first three printouts can be taken") or
from non-takeable slots that read in place, which cycle for ever (place, then stow, then reveal
again). The validator prints, per producer, how many takeable beats the pool holds.

**The player takes an item an NPC was fetching.** Both `item_gone` paths (550, 557) go through
`_abortJob`, which logs and emits nothing. Add an `npc_job_failed` emit with `reason: "item_gone"`
and the item id to both (a few lines), so a scenario can map the owner noticing.

**Reload: stow on sight.** Needs state resets; globals do not, so a slot that was revealed comes
back visible at its declared spot (on the tray, even if it had been placed on a desk), with no
listener. Rather than give an NPC a one-off errand to tidy it (the R1 plan's "orphan candidate",
which also had no target to walk to, R2 m9), the adapter **stows every revealed slot that no NPC
holds when its room loads** (and at install, for rooms already loaded): `hideRevealedObject`,
global false. The player sees the tray empty after a reload, which matches "everyone at their
desk"; the pool is whole again, less any slot already taken; the next print shows a slot through
the direct call. A `leftBehindBy` item (2.10) follows the same rule. An item that was dropped by an
abort (`dropHeld`, client only) is back at its declared spot after a reload; accepted.

**Engine size.** Outcome by kind about 40, place and stow with the room bookkeeping about 50,
slots, pool and `revealOutput` about 60, `hideRevealedObject` and the exports in `core/rooms.js`
about 10, stow on sight about 15, `item_gone` emit 5, validator about 45 (slot rules, the
read-in-place rule, `onDeliver` reach, takeable beats per producer), schema about 20
(`onDeliver`, `placeAt`, `placeSeconds`, `outputOf`, `onUse.revealOutput`). About 245 lines.

**Visible change.** A printout appears on the copier tray when someone at a desk prints; a
colleague picks it up, puts it on their desk, and it is filed away a minute later.

**Tests.** Node (sims fixture from slice 1, plus a small stub of the rooms helpers): a plain
item's `consume` log is byte-identical to today (the parcel beat); a slot delivered to
`amara_pc` is placed, not pickable to needs, and stowed after `placeSeconds`; `onDeliver: "stow"`
stows at once; `stow` frees the slot and re-inserts it into its declared room under its key; pool
order and exhaustion fall back to the cosmetic sprite; the player taking an item mid-fetch emits
`npc_job_failed` `item_gone`; **reload then cycle**: a fresh system with the slot's global true
and no listener stows it on load, and the next `revealOutput` makes it visible again; **read a
cycling slot**: a slot marked `active = false` (as the notebook leaves it) is not free; **cross-room
place then pickup**: a slot declared in the office, placed on a desk in the kitchen, picked up
there by the player, gives exactly one `remove_object` call naming the office. Validator: a
non-takeable `notes` slot without `readDisplay: "gameDisplay"` is an error. `test_needs_sims`: an
`office_copier` (`photocopier1`) in the **office**, the start room, so it is always loaded; two
non-takeable printout slots that read in place and one takeable; Sanjay's `sanjay_pc` `onUse`
reveals output; Amara's interests gain `printout` and `amara_pc` accepts `["post", "printout"]`
(the parcel is still consumed); a new objective "A printout is delivered to a desk" on
`npc_used:amara_pc` with `tag: printout`. Live: screenshots of the printout on the tray, in
Amara's hand (with slice 3) and on her desk; read a non-takeable one and check it stays; take the
takeable one, reload, and check it stays gone, the tray is empty, and the next print shows a
non-takeable slot.

#### Part B: routines (slice 9)

**Idea.** A routine is an ordered list of steps, and each step is a job the system already runs:
`use` (walk, dwell, emit `npc_used`) or `carry` (walk to an item, pick it up, walk to a target,
then `consume`, `place` or `stow`). The selector treats a routine as one more way to satisfy a
need. No new mover.

**Authoring.** A library at scenario level, referenced by NPCs; the engine ships a few defaults
under the same ids that a scenario can override.

```jsonc
"routines": {
  "print_and_deliver": {
    "satisfies": "work", "restores": 50, "weight": 1,
    "steps": [
      { "use": "$home", "seconds": 8 },
      { "use": { "preset": "copier" }, "seconds": 10, "output": true },
      { "carry": "$output", "to": { "npc": "$colleague", "at": "home" }, "then": "place" }
    ]
  },
  "tea_round": {
    "satisfies": "social", "restores": 60,
    "steps": [
      { "use": { "type": "kettle" }, "seconds": 30 },
      { "visit": { "npcs": "$team" }, "seconds": 4 }
    ]
  },
  "fetch_post": {
    "satisfies": "work", "restores": 30,
    "steps": [
      { "use": "post_tray", "seconds": 5, "output": true },
      { "carry": "$output", "to": "$home", "then": "place" }
    ]
  }
}

// on an NPC
"routines": ["print_and_deliver", "fetch_post"],
"routineArgs": { "colleague": "tom", "team": ["tom", "grace", "sanjay"] }
```

Step targets: an object id, `$home`, `{ "preset": "<preset id>" }` (nearest reachable free object
with that resolved preset), or `{ "npc": id, "at": "home" }` (that NPC's needs home object).
`visit` walks to each listed NPC's home in turn and faces them (a social step; with 2.4 it shows a
bubble). `output: true` on a use step calls `revealOutput` for that object (Part A) and records
the slot as `$output`; a later `carry: "$output"` collects **that slot by id**, not by tag, so
NPCs share one printer's pool and no per-NPC tag or per-NPC slot is needed. The routine reserves
its output slot (an item claim, as `_itemClaimed` does today) from reveal until its carry step
ends, so another NPC's interest cannot take it in between; the player still can.

**Carrying to a person.** A routine carry step **skips the `accepts` check**: the author named
the destination, so it does not have to accept the tag. Its `then` defaults to `place` for a slot;
a plain item carried by a routine is consumed, as in Part A, and `then` is ignored for it. It does
**not** need the target's claim either, since placing an item on a desk does not use the desk:
when the owner is seated there (holding the claim and standing on the approach cell), the
deliverer stands on the nearest free walkable cell beside the approach cell (`deliverFrom`
default: the two side cells, then one further out), faces the desk and places. No waiting.

**Seating.** A visitor must not take the owner's chair. Today `seatPreference` says `'fetch'` for
anything that satisfies `work` (`seating.js:768`), and the "chairs at another NPC's post" guard
lifts when the stop is that post (865-866), so Sanjay delivering to `tom_pc` would sit in Tom's
chair or roll one over. One change: a routine step carries `seat: "stand"` unless its target is
the NPC's own home, passed through the job into `needsStop` (739-748) so seating can read it.
About 10 lines in `seating.js`. A plain (non-routine) work use at a colleague's free desk keeps
today's behaviour and sits in their chair (README finding F: Sanjay at `tom_pc`); widening the
stand rule to every job would change existing scenarios, so it is left as open question 18.

**Choosing routine or plain use.** Need scores are per need, not per object (`npc-needs.js:453`),
so a fixed "higher weight wins" rule makes an NPC always or never run a routine. Instead, when the
winning need has both a plain-use candidate and routine candidates, a seeded roll per leave,
`roll(npcId, 'routine:' + s.leaveCount)`, picks between them in proportion to their weights (plain
use weight 1 unless the NPC sets `plainWeight`). `s.leaveCount` is new: the needs state has no
leave counter today (workstation-state's `leaves`, `workstation-state.js:113-115`, is separate
and per workstation owner). It counts real leaves (`_leavePost`), starts at 0 and resets on a
reload, which is fine because the roll stays seeded. Varied, deterministic, and a scenario that wants
a fixed beat sets `plainWeight: 0` or leaves routines off that NPC.

**Engine.** In `npc-needs.js`:
- `_select` gains routine candidates for the winning need, reachability checked on the first step
  only (later steps check when they start).
- `s.job` gains `routine: { id, step, args, outputSlotId }`. `_completeJob` advances to the next
  step instead of going home; the last step goes home. The NPC's post is left once, at the first
  step that moves it, and returned to once (2.11's rules).
- **Failure ends the routine, not just the step.** A step's target unreachable, a step that hits
  its deadline (the existing per-phase `deadline`, 538), or a missing output → `npc_job_failed`
  with `routine` and `routineStep`, a carried item dropped (`dropHeld`) or, if it is a slot,
  stowed, any output reservation released, a 60 s cooldown on that routine, home. So a jammed NPC
  goes home rather than retrying the next step.
- Claims: a routine claims only its current step's target, so a copier is free between prints.
- New events: `npc_routine_started:<npcId>`, `npc_routine_step:<npcId>` `{routine, step, targetId}`,
  `npc_routine_done:<npcId>`. `npc_used:<objectId>` fires per step as today, so existing mappings
  keep working; a `$home` step still emits `npc_used:staff_pc`, so the lab's keylogger beat holds.
- `npc_left_post` carries `expectedAwayMs` summed over the routine's steps (2.10).
About 330 lines in `npc-needs.js` and seating. Validator about 80 lines: unknown step targets,
`$arg` with no `routineArgs`, `$output` with no earlier `output: true` step, a producer with no
slots (warning: cosmetic only), a routine whose steps span rooms not loaded together (warning),
steps above four (warning), T1/P report per routine. Schema about 45 lines (`routines`,
`routineArgs`, `plainWeight`, `affordance.deliverFrom`, step shapes). About 450 lines in all
(the narrower seating change and `leaveCount` roughly cancel).

**Save/lazy-loading.** A reload mid-routine restarts the NPC at its post (constraint 3); a
revealed output slot is stowed on sight (Part A). A step target in an unloaded room makes
the routine unavailable (first step) or fails it (later step); the validator warns at author
time. The showcase keeps every routine target in the office or in rooms the README tells the
player to open first.

**Performance.** One more candidate per routine for an NPC whose need is urgent; with 2.0's
per-tick cache this is an array filter. Steps add one path search each.

**Visible change.** Someone walks to the copier, waits, walks across the office with the printout
in hand (slice 3) and puts it on a colleague's desk while the colleague keeps working.

**Tests.** Node (stub world): a three-step chain completes in order with one `npc_used` per step;
output reveal then carry by slot id; delivery to an occupied desk uses a side cell and places;
step timeout fails the whole routine and cleans up (claims and reservation released, slot stowed,
cooldown set); a second NPC can use the copier between another's steps; the routine/plain mix
over 50 leaves matches the weights within a set margin and is identical for a seed; reload
simulation (fresh system, slot visible) stows the slot on load.
`seating.test.mjs`: a routine visitor at another NPC's desk stands; the owner at their own desk
still sits; a plain work use at a colleague's free desk still sits (unchanged). `test_needs_sims`: Sanjay gets `print_and_deliver` with `colleague: tom`; Amara gets
`fetch_post` from a post tray in the office (`officeType: "post_tray"`; sprite: an existing box,
`office-misc-box1`, until a tray sprite is approved **[approval]**); a new objective "Someone
prints and delivers a document" on `npc_routine_done:sanjay`. Live: watch the chain in the log;
screenshots of the printout on the tray, in Sanjay's hand and on Tom's desk with Tom seated.

**Risks.** Chains make NPCs absent for longer and cross rooms more; jams at doors and the
"stuck walking into a wall" class of bugs show up more often. The whole-routine failure on a
step timeout and the four-step warning keep that bounded.

### 2.3 Visible object state (proposal 3)

**Built: 2026-11-06 (b820a5d24, b2577fac1; showcase b14016be1).** As written, with these choices made
without asking: the dots sit at the object's top-right corner, inset 5 px (offsets from its display
size); after the first screenshots read faint, indicator records draw at full strength in a lit room
(other `above` glows keep 0.6) and the first colours changed to locked `#3d8bff` radius 10, steady,
and open `#fff1c8` radius 14, `breathe`; the light-map stamp stays (no halo seen). A workstation whose
art has no glow still gets its dot. A room `indicators` list works by object id only (never by texture
prefix), and it can also give a non-workstation dots of its own. The owner is looked up when the
room's emitters are built (live NPC manager, else the scenario). `lighting.js` now imports
`isWorkstation`/`ownerOf` from `workstation-state.js`, so the five lighting test harness copy lists
copy it. Tests: `test/js/lighting-workstation-indicators.test.mjs` (9); the own-desk test already
existed in `workstation-state.test.mjs`. Live (keyless :3001): `test_needs_sims` games 631 and 634
(Tom's PC at desk, away-open and away-locked, lit and dark; `spot_open_screen` completed);
`lab_physical_pentest` game 636, score 100, 11/11 tasks, Len's route unlock, the keylogger planted
while Chris was away and locked (blue dot on his PC), Melanie's open screen (white dot) accessed.
`test_needs_leash` game 630 passes. Screenshots and the README table: `test_needs_sims/README.md`.

**What exists.** `workstation-state.js` already decides locked or open on every leave, publishes
two globals, and an author can already hang a lighting emitter variant or a `spriteVariants`
entry on them. What is missing: a default look, any "in use" or "busy" state for other machines,
and correct globals after a reload.

**Prerequisite.** The own-desk fix in 2.11 (its core lands separately, ahead of slice 2). Without it, a work use at the NPC's own PC
fires `npc_left_post`, workstation-state marks the owner away (`workstation-state.js:112-123`) and
the "away" indicator would show while the owner sits at the PC.

**Why indicators, not glow changes.** In a lit room a screen's glow sits under the multiply light
map, just in front of its object (`lighting.js:1033-1041`), and plain screens within 32 px share
a damped glow (`clusterEmitters`, 584-600). A dimmer, cooler "locked" glow or a slow `breathe` on
an open screen would be close to invisible at game zoom in the lab's lit office
(`lab_physical_pentest/scenario.json.erb:13`). Only `ransom` and `above: true` variants draw above
the map, and `above` keeps its own small radius. So each state is a **small `above: true`
indicator** offset to the screen's corner.

**An indicator cannot be a variant.** Each object has one emitter with one glow image and one
light-map stamp (`buildEmitters`, `lighting.js:531-555`), and a matching variant is merged over
the base and becomes the emitter's whole definition (`resolveEmitters`, 558-583). A small offset
`above` variant would therefore turn the screen's glow into an 8 px dot. (The ransom variant
cited as precedent in R1 also replaces the glow; that is its point.)

**The indicator layer: a second emitter record on the same object.** `buildEmitters` pushes, for
an object that has indicator definitions, a second record `{ obj, base: null, variants:
indicators, indicator: true, ... }` beside the first. Everything else already works for it:
`resolveEmitters` picks its variant from globals (with `base: null` it shows only while a variant
with `color` and `radius` matches, 539-540, 575-577), the draw loop gives it the `above` path
(figure fade, hue keep, the true on/off `blink` for `above`, 1016-1019, 1042-1056), and
`clusterEmitters` leaves it alone because it only damps `effect: 'screen'` (590-591). The screen's
own record, and so the main glow, is untouched. The indicator's stamp on the light map is small
(radius 8); it can be skipped for `indicator` records if the screenshots show a halo. About 25
lines in `lighting.js`.

**Authoring.** Nothing for the defaults. Every **workstation** (`isWorkstation`, so only objects
opted in as today; 2.1) whose owner is known gets two built-in indicator definitions, the way the
ransomware variant is attached by `variantsFor` (527):

| State | Indicator (`above: true`, radius about 8 px, offset to the screen's top corner) |
|---|---|
| owner at desk | none (the ordinary screen glow) |
| owner away, locked | steady blue dot (`globalVars.<id>_screen_locked`, listed first) |
| owner away, open | warm-white dot with a slow `breathe` (`globalVars.<id>_owner_away`, listed second): an unattended, unlocked screen |

The conditions use the existing `globalVars.` form (`utils/conditional-text.js` 72-79), so the
condition parser is unchanged; the first matching variant wins, so the locked dot takes
precedence and the open dot shows only while the owner is away and the screen is not locked
(`onReturned` clears both globals, `workstation-state.js` 125-134). Colours are first picks to be checked on screenshots,
lit and dark; colour is never the only cue (open breathes, locked is steady; `breathe` honours
reduced motion, where the two differ by colour and size). A room `emitters` entry can replace the
built-ins with its own `indicators: [...]` list on the object id. If dots still do not read, the
fallback is a lock-screen sprite variant for the two PC types the lab and showcase use (`pc`,
`laptop`): new art, **[approval]**, deferred.

**Cut from this slice: the activity registry.** The R1 plan added a client-only registry
(`office-activity.js`, about 80 lines), a new `activity.` condition prefix (about 30 lines) and an
amber "machine in use" indicator. Slice 3's sprite icon over the NPC using a machine already says
which machine is busy, and the output on a copier tray is the slot sprite itself. Without the
in-use state the indicators need only the two workstation globals that exist today. If slice 13
(consumables) wants an "empty" light, it publishes a global (OQ3).

Built-in indicator data and attaching it to workstations about 30 lines; schema about 10 lines
(`indicators` on a room `emitters` entry). About 65 lines in all.

The reload mismatch fix for workstation globals (at `installWorkstationState`, 157) ships earlier,
in slice 2 (2.11).

**Save/lazy-loading.** Nothing new is saved. Workstations in a room that loads after the owner
left already take state on first interaction (`onInteract` 144-145); the indicators read the same
globals, which slice 2's reload fix keeps true to life.

**Performance.** One more emitter record per workstation with an owner; lighting re-resolves
variants at most every `RESOLVE_MS`.

**Visible change.** From across a lit office the player can tell an unattended open screen from a
locked one.

**Tests.** Node, `lighting-room-variants.test.mjs`: a workstation with an owner gets a second,
`indicator` record; with `<id>_owner_away` true the indicator resolves to the open dot, with
`<id>_screen_locked` true to the locked dot, with neither to nothing; **the screen's own record
resolves to the same definition in all three states** (the base glow is unchanged while an
indicator shows); `clusterEmitters` does not damp the indicator; a room `indicators` entry
replaces the built-ins. `workstation-state.test.mjs` (with slice 2's fix): an own-desk work use
does not set `_owner_away`. `test_needs_sims` gains a `"lighting": { "enabled": true,
"defaultMode": "on" }` block in this slice (it has none today, so no glow shows at all) and
marks its three PCs as workstations: `tom_pc` with `lockChance: 0.5`, `amara_pc` and `sanjay_pc`
with `workstation: true` (they lock on every leave, which the showcase then demonstrates). This is
a deliberate behaviour change of the showcase: clicking an unattended PC now says it is locked,
and the README says so. A new objective "Spot an unlocked, unattended screen" on
`workstation_owner_left` with `screenLocked: false`. Live: screenshots of Tom's PC at desk,
away-open and away-locked, each with the office lit and dark; plus the lab's open-plan office lit,
with Melanie away, from the doorway.

**Risks.** Dots may still be too small at game zoom; the screenshots decide, and the fallback
(sprite variant, art) is listed above. A busy room of PCs gets many dots; only workstations with
an owner get indicators.

### 2.4 Speech bubbles and social pairing (proposal 4, first half)

**What exists.** Nothing in the world: barks are phone-style DOM notifications (`npc-barks.js`
15-65). Water cooler and sofa already have `capacity: 2`. Both coffee stations in the showcase
(`office_coffee`, `kitchen_coffee`) and the lab's `coffee_station`
(`lab_physical_pentest/scenario.json.erb`, about 909) have no `capacity`, so 1: two NPCs can never
be `using` one at the same time, and today the second waits at its desk.

**Authoring.**

```jsonc
// scenario level: line pools by topic; NPC-level pools add to or replace them
"chatter": {
  "coffee":  ["Machine's slow again.", "Who finished the milk?"],
  "cooler":  ["Did you see the email about the car park?", "Friday drinks?"],
  "greet":   ["Morning.", "Alright?"]
},
// on an object (or its preset): which pool a shared use draws from
{ "id": "water_cooler", "type": "water_cooler1", "affordance": { "chatter": "cooler" } }
// on an NPC
"chatter": { "cooler": ["My team's moving floors."] }, "chattiness": 0.6
```

**Behaviour.** When two NPCs hold uses on the same object with a `chatter` pool, they turn to face
each other (`faceTo`) and take turns, lines picked by seeded roll. That needs an object with
`capacity` 2 or more (the cooler, the sofa). A `visit` step (2.2 Part B) pairs the visitor with
the NPC at that home the same way; that half lands with slice 9. **Coffee-machine chatter waits
for queues** (slice 10): there, the NPC using the machine pairs with the first NPC queued within
1.5 tiles of it, the same turn-taking, for as long as both stay. A lone NPC at a `chatter` object
says nothing. (The alternative, `capacity: 2` on a coffee station, changes Chris's and Melanie's
coffee timing in the lab; open question 19.)

**Who may pair (amendment, 7.3).** Only compatible NPCs pair: a per-NPC `needsCompany: { groups,
avoids }` (named so after review m9: the scenario-level `social` block is the social-engineering
contract, and `social` is also a need name), where an avoidance (an NPC id, `group:<name>`, `"*"`,
or an object entry `{ npc | group, requireGlobal }`) is declared one way and acts both ways, and
also stops the two sharing a capacity-2 object (the second waits, `npc_avoided:<npcId>`). A group
mismatch only stops chat. With no `needsCompany` anywhere, everyone pairs as above. When a line is overheard, the system also emits
`npc_overheard:<speakerId>`. This adds about 95 lines to the slice.

**Timing fits the dwell; the dwell does not stretch.** Bubbles get their own timing, not the
toast lifetime (`bark-lifetime.js` floors at 5 s, `BARK_MIN_MS`, line 18, which would need 30-40 s
for three or four exchanges against the showcase cooler's 15 s dwell). A bubble shows for
2.5 s + 50 ms per character, at most 4 s, with a 0.5 s gap. Turns are scheduled on the needs
clock only for the time both NPCs are still `using`, so a 15 s overlap gives up to four lines and
a short overlap gives one or two. Dwell times, and so the T1/P report and every existing beat,
are unchanged.

**The player overhears; chatter does not stop.** Stopping when the player comes within 3 tiles
would defeat the overhear hook, since `playerNearby` is itself the 96 px (3-tile) test
(`npc-needs.js:845`). So chatter carries on when the player is close. Each line emits
`npc_chatted:<objectId>` `{speakerId, partnerId, topic, lineId, overheard, playerDistance}`, where
`overheard` uses a chat-specific radius (`overhearRadius`, default 160 px, five tiles; settable on
the pool or the object) with the same same-room and clear-line tests as `playerProximity`. A pool
marked `"hush": true` (gossip) instead stops after the current line when the player is inside
96 px; off by default.

**Talking to one of a pair.** The person-chat freeze is per NPC (`inChatWith`,
`npc-needs.js:765-772`): only the NPC in the conversation freezes. The pairing simply ends when
either NPC is frozen, leaves, or is interrupted; the other finishes its use in silence. No
pair-freeze.

**Where bubbles show.** Only for NPCs in the player's current room, and hidden in a room whose
lighting is dark (the same rule slice 3 applies to action icons), so nothing reads through walls
or in the dark. One bubble per NPC, at most four on screen; a bubble hides that NPC's action icon
while shown; bubbles hide under any open minigame.

**Default pools.** The engine ships small generic pools (`coffee`, `cooler`, `greet`): office small
talk in UK English, no work, security or plot content. A scenario adds or replaces pools by name
and turns the defaults off with `"chatter": false`. Voiced NPCs speaking silent bubbles is a known
mismatch (OQ2).

**Engine.** New `systems/npc-world-bubbles.js` (about 170 lines): a pooled Phaser text-with-
background container above the head (depth beside the action icon), the timing above, the room
and darkness rules. Pairing logic in `npc-needs.js` (about 80 lines): on entering `using`, look
for another NPC using the same object; if found, schedule turns on the needs clock
(deterministic) for the overlap. Validator about 20 lines (one line per bubble, at most 40
characters; unknown pool names). Schema about 20 lines (`chatter` at scenario, NPC and
`affordance` level, `chattiness`, `overhearRadius`, `hush`). About 290 lines.

**Save/lazy-loading.** Nothing saved. Only loaded NPCs chat.

**Performance.** Bubbles are pooled; at most four live. No TTS (see open question 2).

**Visible change.** Two staff at the cooler face each other and trade short lines.

**Tests.** Node: pairing picks the same partner and lines for a seed; no bubble for a lone use;
the number of lines fits the overlap; no pairing at a capacity-1 object; `overheard` true at
150 px and false at 170 px or through a wall; `hush` stops after the current line.
`test_needs_sims`: a pool for the cooler (the coffee pool waits for slice 10); reading the
activity board sends Sanjay and Rosa for a chat (a mapping with `needs: { set: { social: 10 } }`
on both). Both already have a social need (Sanjay 12/min from 76, Rosa 15/min from 70,
`test_needs_sims/scenario.json.erb` 267, 364), and the cooler is the only social object they can
reach once the kitchen is open, but their urgent moments rarely overlap, so leaving it to chance
could take a long run. Objective "Two people chat at the water cooler" on
`npc_chatted:water_cooler`. Live: screenshot two NPCs facing with a bubble;
check the bubble hides under a person-chat, does not show from the next room, and the phone bark
stack is unaffected.

**Risks.** Bubble text overlaps at close spacing; one line, at most 40 characters, validator
enforced. Writers' time: every scenario now wants lines; the default pools cover the gap.

### 2.5 Queues at shared machines (proposal 4, second half)

**Today.** A second NPC whose need goes urgent while the only target is claimed waits **at its
desk** (README, "Contention"). That is tidy but invisible.

**Authoring.** `affordance.queue: { "cells": [{"dx":-1,"dy":1},{"dx":-2,"dy":1}] }` (preset
default: two cells beside the approach cell). Off unless set or preset.

**Engine.** In `_useCandidate`, a claimed target with a free queue cell is an option; the job
gets phase `queued` at that cell, advancing to the next cell or the approach cell as claims free.
A queued NPC that has waited longer than `queue.maxWaitSeconds` (default 30) leaves the queue and
goes home with a 60 s cooldown on that object. About 120 lines. Queue order is claim order
(deterministic by tick and NPC id). **Queue chatter**: with slice 8 in, the NPC `using` an object
with a `chatter` pool pairs with the first queued NPC within 1.5 tiles of the approach cell, using
slice 8's turn-taking; about 20 lines in the pairing code. This is how coffee-machine chatter
happens at capacity-1 machines, and only between compatible NPCs (7.3): an avoided NPC still
queues, in silence (about 10 lines). **Queue cells and the leash (review m8):** a queue that runs
through a doorway can put a cell in a room that is forbidden to a queuer (7.2), where the ring
makes it unreachable and the queuer would stall until its job times out. Queue places skip cells
in rooms forbidden to that NPC (the queuer takes the next permitted cell, or waits at its post if
none is left). Validator about 25 lines: a queue cell within one tile of a door (it would sit in
the doorway), a cell that does not snap to a walkable tile, a cell in a room forbidden to an NPC
that needs the machine (warning). Schema about 10
lines (`affordance.queue`). About 180 lines.

**Why it matters for gameplay.** A queue lengthens an absence in a way the player can read from
across the room, and makes "owner away" windows longer at busy times without any scripting.

**Visible change.** Two or three people standing in line at the coffee machine, facing it, and
the one at the front chatting with the one pouring.

**Tests.** Node: three NPCs, capacity 1, two cells: order, advancement, a queued NPC whose need
is met elsewhere leaves the queue, `maxWaitSeconds` sends one home; the NPC using the machine and the first queued
NPC pair and trade lines, the second queued NPC does not. `test_needs_sims`: a mapping on the
activity board that drops three staff's caffeine together; the `coffee` chatter pool on
`office_coffee`; objectives "A queue forms at the coffee machine" on a new `npc_queued:<objectId>`
event and "Chat in the coffee queue" on `npc_chatted:office_coffee`. Live: screenshot three staff
at one coffee station with a bubble.

**Risks.** Queue cells on a blocked tile (furniture moved later). Snap with
`findNearestWalkableWorldCell` like approach cells and skip a cell that does not snap.

### 2.6 Personality traits (proposal 6)

**Authoring.** Sugar on the NPC, expanded at registration into fields that already exist.

```jsonc
"traits": { "diligence": 0.8, "sociability": 0.3, "caffeine": 0.9, "punctuality": 0.5, "tidiness": 0.2 }
```

| Trait (0-1) | Expands to |
|---|---|
| diligence | `lockChance` on the NPC's workstation equal to diligence (0.8 locks 80% of the time); work need weight |
| sociability | social need decay and weight; `chattiness`; chat length |
| caffeine | caffeine `decayPerMin` scale |
| punctuality | schedule jitter (2.8) |
| tidiness | chance to leave a declared desk item visible while away (2.10); routine weights for `file`/`shred` |

Anything written explicitly wins over the trait. A trait with nothing to apply to (no caffeine
need) does nothing.

**Engine.** `expandTraits(record)` in a small pure module called from `register` (about 90 lines).
`workstation-state.js` reads the owner's expanded `lockChance` when the object has none; that is
the only coupling, so traits depend on workstation-state (which exists), not on slice 5's
indicators. A trait never makes an object a workstation (2.1): `diligence` applies only to
objects already opted in; the validator notes an NPC with `diligence` whose `needsHome` is not a
workstation. Validator about 20 lines (prints expanded values in the needs report). Schema about
15 lines (`traits` with five bounded numbers). About 125 lines.

**Visible change.** With slice 5's indicators, a careless NPC's screen shows the open dot more
often than a careful one's; with bubbles, a sociable NPC talks more.

**Tests.** Node: expansion table, explicit fields win, determinism, `lockChance` reaches
`decideLocked` through the owner. `test_needs_sims`: Tom gets `diligence: 0.9` and Sanjay
`diligence: 0.1` (replacing slice 5's explicit `lockChance` on `tom_pc`); objective "Find a
careless colleague's open screen" on `workstation_accessed:sanjay_pc`. Live: over a ten-minute
run the log shows Tom's screen locking on most leaves and Sanjay's on few; screenshot both PCs
while their owners are away.

**Risks.** Hidden coupling: an author changes a trait and a beat's timing moves. The validator's
T1/P report after expansion is the guard.

### 2.7 Consumables and refills (proposal 7)

**Authoring.** `affordance.stock: { "max": 5, "perUse": 1, "restockFrom": "stationery_cupboard", "tag": "paper" }`.

**Behaviour.** Each use takes `perUse`; at zero the object is not an option for needs and
publishes `<id>_empty` (the opt-in `publishGlobal` of OQ3), which an indicator or a sprite variant
can key on. (The R1 plan's activity registry is cut, 2.3.) An NPC with an interest in the restock tag (or the first NPC who wanted
the object, with the facilities trait) runs a built-in two-step routine: use the store object,
carry stock back, use the empty object (refilled to `max`).

**Engine.** About 150 lines on top of 2.2 (stock on the needs system's object state, the empty
global, restock as a generated routine), plus schema about 10 lines (`affordance.stock`).

**Save.** Stock is client-only and resets on reload (full), consistent with needs.

**Visible change.** The copier's indicator shows "empty"; someone walks to the cupboard and back
with paper (held item, slice 3).

**Tests.** Node: stock decrements, zero removes the object from candidates, the restock routine
refills to `max`, reload resets to full. `test_needs_sims`: the copier gets `stock.max: 3`; a
stationery cupboard (`officeType: "filing"`) as the store; objective "Someone refills the copier".
Live: screenshot the empty indicator and the refill trip.

**Why defer.** It mostly creates longer absences and walking, which queues and routines already
give. Build it when a scenario wants "the printer is out of paper" as a beat.

### 2.8 Schedule and interruptions (proposals 5 and 8)

**Authoring.** A schedule is a list of time blocks per NPC, or shared by a group.

```jsonc
"schedules": {
  "office_day": [
    { "atMin": 0,  "do": { "set": { "caffeine": 30 } } },              // arrive, want coffee
    { "atMin": 6,  "routine": "standup", "priority": "high" },          // everyone to the meeting room
    { "atMin": 15, "weights": { "hunger": 2 } },                         // lunchish
    { "atMin": 28, "routine": "leave", "priority": "high" }
  ]
},
// on an NPC
"schedule": "office_day", "scheduleJitterMin": 1
```

`atMin` is **game-clock elapsed minutes** (`gameClock.elapsedMs()`, which the needs adapter
already reads, `npc-needs.js:745`, and which is saved with the sync), not needs-clock minutes: the
needs clock starts at 0 on every load (`npc-needs.js:115`, `reset` 199), so on it a stand-up would
replay after each reload. When the scenario sets `gameClock` with a `rate`, `at: "10:00"` in-game
time may be used instead. Blocks either nudge levels (`set`, which `control` already does), scale
need weights, start a routine, or change presence (`leave`, `arrive`). Elapsed game time keeps
running while a VM is open and needs are frozen; a block that falls due then applies on the first
needs tick after the VM closes.

**Leaving and coming back.** The built-in `leave` routine walks the NPC to an exit object and
hides it with `setNPCVisible(false)`, which **is** saved (`npcVisibility`, `state-sync.js`
168-170), and a hidden NPC is blocked in the needs system (`npcStatus.hidden`, 762, 305). So `leave`
needs a way back, and a reload must agree with the schedule:
- An `arrive` block unhides the NPC at its exit object and sends it home (`setNPCVisible(true)`,
  then an ordinary return).
- On every load the schedule cursor is re-derived from elapsed time, and presence is made to match
  the latest `leave`/`arrive` block at or before now: an NPC that should be out stays hidden; one
  that should be in is shown at its post. That self-heals a reload taken mid-walk.
- An NPC with no later `arrive` is gone for the session. The validator warns when a leaving NPC
  has later objectives, conversations, `eventMappings` or `challengeOnSight` that would then never
  fire.

**Interruptions.** Need-versus-need never preempts today (`_tickNpc` 365-368); scripts
(`onExternalMove`, 243), a `suspend` mapping (257) and KO, hostile or hidden status (305-311)
already abort jobs. Add one rule: a `high` priority schedule block or an eventMapping
`needs: { "interrupt": "<routine>" }` aborts the current job through the existing `_abortJob`
(carried item dropped at the NPC's feet by `dropHeld`, client only, or stowed if it is a slot;
claim released) and starts the routine. The chair is tucked by seating noticing the stop change
(`seating.js:656-668`), not by `_abortJob`. Nothing else preempts. The desk phone is an
interruption (2.9).

**Engine.** About 330 lines: schedule cursor per NPC (deterministic, seeded jitter), the
game-clock adapter, preemption path, presence re-derivation on load, two built-in routines
(`standup`: walk to a meeting-room object with capacity, dwell, return; `leave`/`arrive`).
Validator about 60 lines. Schema about 30 lines (`schedules`, `schedule`, `scheduleJitterMin`,
block shapes, `needs.interrupt`). About 420 lines.

**Save/lazy-loading.** The cursor is derived from elapsed game time: on reload, the NPC skips
blocks already past (it does not replay a stand-up) except the latest weight block and the latest
presence block, which apply. An NPC registered late (its room loaded at minute 12) joins at the
block current at minute 12. Because elapsed time is shared, every NPC on a schedule is on the same
day.

**Visible change.** At set times the office empties into the meeting room and fills again; at the
end someone puts their coat on (walks out) and does not come back.

**Tests.** Node: block order, jitter determinism, preemption cleans up in each phase (wind-up,
walking, using, carrying), reload skip with a stubbed elapsed clock, presence re-derivation (out
before reload stays out; in after an `arrive` shows), the VM-frozen case. `test_needs_sims`: a
compressed day (stand-up at 3 min, lunch weights at 6 min, Grace leaves at 9 min and arrives at
11); objective "Everyone attends the stand-up". Live: the stand-up in the log and on screen; a
reload at minute 10 keeps Grace out, at minute 12 shows her at her desk.

**Risks.** Preemption is the riskiest change in the plan: every place that assumes "a job runs to
completion" (seating, action icons, workstation leave/return pairing, carry claims) needs review.
Keep it last in Tier 2 and cover it with tests that interrupt each phase.

### 2.9 Desk phone (part of 2.8)

A desk phone is opted in by role, never by type: `officeType: "desk_phone"` on a non-takeable
object (the 49 `phone` objects in scenarios are mostly takeable handsets and phone-chat contacts,
and the `desk_phone` preset excludes anything takeable). Owner: `phoneOwner`, else the NPC whose
home desk is nearest. A `ring` (a mapping action or schedule action) interrupts its owner with a
short `use` of the phone (2.8's preemption); a ring while the owner is away emits
`desk_phone_unanswered:<id>` with `playerNearby` (a gameplay hook: the player can answer; what
that leads to is the scenario's).

**Art and sound.** No desk-phone sprite distinct from the handsets exists (`phone1`-`phone5` are
handsets, 20×17); first try `phone1` on a desk and judge it on a screenshot, otherwise a desk-phone
sprite **[approval]**. No ring exists either (only `phone_vibrate.mp3`); use `phone_vibrate` as a
stand-in and ask for a desk-phone ring **[approval]**. The ring is heard only through slice 3's
room-limited sound (2.12): full level in the phone's room, quieter through an open door, silent
further off, and scaled by distance, so an off-screen ring does not give away a beat in a distant
room.

**Size.** About 60 lines plus schema about 10 (`phoneOwner`, the `ring` action).

**Visible change.** The phone rings and its owner gets up from a coffee to answer it.

**Tests.** Node: ring interrupts the owner with a phone use; a ring with the owner away emits
`desk_phone_unanswered` once; a takeable `phone` never gets the preset. `test_needs_sims`: a desk
phone on Tom's desk rung by a mapping on the activity board; objective "Tom answers his phone".
Live: ring with Tom at the coffee station and watch him return; ring while he is in the kitchen and
check it is not heard from the lounge.

### 2.10 Opportunity windows (proposal 9)

Described as gameplay states only; what each one yields is scenario wiring.

| Window | Built from | New engine work |
|---|---|---|
| Owner away, screen open | workstation-state (exists), the own-desk fix (2.11), indicators (2.3), traits (2.6) | none beyond those |
| Owner queuing or on a long routine | queues (2.5), routines (2.2) | `npc_left_post` carries `expectedAwayMs`: from slice 2, walk estimate there and back plus the dwell; from slice 9, summed over a routine's steps; from slice 10, plus the queue position times the dwell. A scenario hint or an NPC line can say "back in a minute" |
| Document waiting on a copier tray | reveal slots (2.2 Part A) | none beyond Part A. Each takeable slot is one beat (constraint 1.2.2); a pool gives a few; non-takeable slots that read in place (`readDisplay: "gameDisplay"`) repeat for ever. Taking a slot an NPC is fetching emits `npc_job_failed` with `reason: "item_gone"` (the emit is added in Part A; today `_abortJob` emits nothing), which a scenario can map to the owner noticing |
| Item left on a desk | an item field `leftBehindChance` (R3-M3: not the `tidiness` trait, which is slice 6 and not chosen), Part A's slots, direct show and hide, and `stow` | a declared item with `leftBehindBy: "<npcId>"`, `leftBehindChance` (0-1) and its own `revealOnGlobal` (a slot by Part A's definition). On a real leave (2.11's rules), a seeded roll `roll(npcId, 'left:' + s.leaveCount) < leftBehindChance` (`leaveCount` from slice 9; slice 11 adds it if 9 has not landed; a later slice 6 may fill `leftBehindChance` from `tidiness` without changing the roll) reveals it with `showRevealedObject`; on return the owner **stows** it (`hideRevealedObject`, global false, no server call), so it can be left again on a later leave. If the player takes it, it is gone for good: a single beat, like a slot. A reload with it revealed stows it on sight (Part A); the owner is at the desk after a reload, so that matches. About 45 lines |
| Pile waiting to be shredded (**moved out of slice 11 to a slice after 9**, R3-M3: only a `shred` routine visits the shredder) | an object with `pileCount`, a `shred` routine that reduces it | about 50 lines. `spriteVariants` watch globals only (`core/rooms.js:688-722`), so the count is published as a global (`<id>_pile`, OQ3's opt-in `publishGlobal`) and sprite variants key on it; this one count is saved, which is fine (it self-heals by the routine). Sprites per pile level: try existing paper sprites (`notes_ledger1`, `supply_boxes1`) first, else **[approval]** |
| Door held for someone carrying something | the lab's tailgate wiring (route + `challengeOnSight`, `data.playerNearby`) | generalise later; no engine work now |

Rules for scenario design (not engine): every window must be readable from the floor (an action
icon, an indicator, a queue, an item in hand), must close again, and must reopen after a reload
because need state resets. A window built on a **takeable** item is the exception: it is a single
beat by design, and the scenario says so.

**Engine size (slice 11, scoped by R3-M3 to left-behind items and queue-aware
`expectedAwayMs`).** Left-behind items about 45, queue-aware `expectedAwayMs` about 15, validator
about 20 (`leftBehindBy` NPC exists and has a `needsHome`; `leftBehindChance` in 0-1; the item has
its own `revealOnGlobal`; a readable left-behind `notes*` item reads in place, Part A's rule),
schema about 10 (`leftBehindBy`, `leftBehindChance`). About 90 lines. Piles (`pileCount`,
`publishGlobal`, about 50 more) wait for a slice after 9.

**Visible change.** A badge or a phone sometimes sits on an empty desk.

**Tests.** Node: left-behind roll is seeded and respects `leftBehindChance`; the owner's return
stows the item and a later leave can reveal it again; a taken item never comes back; reload with
the item revealed stows it on load, and a later leave can reveal it again (no listener needed).
`test_needs_sims`: Tom has a declared ID badge (`id_badge` sprite, exists) on his desk with
`leftBehindBy: "tom"` and `leftBehindChance: 0.7`; objective "Spot something left on an empty
desk" (no pile, no "Watch the pile go down"). Live: screenshots of the badge on the empty desk and
gone after Tom's return; take it once and check it never reappears after a reload.

### 2.11 Noticing the player at the desk (proposal 10)

**Built: 2026-11-06 (slice 2, commits b670d2fcd, b6b579e39).** `npc_caught_at_post`, checked only
while the returning NPC is in its home room; `expectedAwayMs` and proximity on
`npc_left_post`, proximity on `npc_returned_post`; `needsStop` keeps the home stop for an at-post
job in every phase and for `returning && atPost` (R3-M2, a condition of building slice 2; in code
at `seating.js` `needsStop`, about line 822, test in `seating.test.mjs`); the install-time
workstation reset;
`inMinigame` read from the open minigame's params (`lockable`, `sprite`, `containerItem` carry the
object), so `interactions.js` was not touched; showcase objective `see_caught` with a bark on
Tom. **The plan was wrong twice.** (1) A seated NPC's body sits about 30 px off its home cell, so
`_moveForPhase` did not find it "already there": own-desk work called `moveTo`, which unseats,
and with the stop key now unchanged the NPC never sat again. Fixed in `npc-needs.js`: an at-post
job and its end never move the NPC (b6b579e39). (2) The reload reset at install sees only
workstations in rooms loaded then; room objects are not in `gameScenario.rooms` before the room
loads, and the lab restarts in the briefing room, so `staff_pc_2_owner_away` stayed true after a
reload and Melanie's PC read "walked off without locking" while she sat at it (`onInteract` said
"attended", so no capture). **Fixed 2026-11-06 (follow-up):** install also resets by name every
saved `<id>_owner_away` / `<id>_screen_locked` pair, which covers workstations in unloaded rooms
(the client never has their objects: the bootstrap strips room contents); node test in
`workstation-state.test.mjs`.
Live, :3001, headless, load about 40: `test_needs_sims` games 552-553 (Amara and Tom seated through
every own-desk use; caught at Tom's desk at 9 px, bark, task), `lab_physical_pentest` game 555
(Pierce and Hampshire seated through own-desk work; Melanie's PC "attended" during her work and
opened only after her real departure; keylogger `npc_used:staff_pc` unchanged).

**Authoring.** None required: the events gain data. A scenario maps them.

```jsonc
{ "eventPattern": "npc_caught_at_post:hampshire",
  "conversationMode": "person-chat", "knot": "caught_at_my_desk", "onceOnly": false, "cooldown": 30000 }
```

**Prerequisite, and a current bug: a use of the NPC's own desk is not a leave.** `_startJob`
winds up and calls `_leavePost` whenever `s.atPost` is true (`npc-needs.js:497-525`), including a
`work` use of the NPC's own home object. The NPC never moves: its home is that object's approach
cell (`_resolveHome`, 645-651), so `_moveForPhase` finds it already there (`dist <= HOME_EPS`).
Yet the log reads `npc_left_post` → `npc_used` → `npc_returned_post`, the wind-up tell fires, and
`workstation-state.js` (112-123) marks the owner away for the whole dwell and may lock the screen.

In `lab_physical_pentest` this probably shows today: Melanie Pierce's `staff_pc_2`
(`locksScreenOnLeave: false`, line 865; her work need decays 15/min from 60 with `urgentAt: 50`,
lines 758-759, so her first own-desk use comes about 40 s in and recurs every few minutes)
reports `staff_pc_2_owner_away` during her own 8 s work dwells. A player who opens the PC then gets
`workstation_accessed` (mapped at 764), the `opt_unlocked` task and the "she stepped away without
locking the screen" capture while she is sitting at it, and the `owner_away` observation variant
(line 874) shows. Chris Hampshire's `staff_pc` reads "locked" (variant at 794) while he works at
it. The keylogger beat (`npc_used:staff_pc`, 567) is not affected.

**The core of this fix landed as b642594be (slice 0).** It added `_atOwnPost(s)` (a `use` job
whose target is the NPC's `needsHome` object), skips the wind-up and `_leavePost`'s
`npc_left_post` for it, and emits `npc_returned_post` only when `atPost` is false. It does not send
an own-desk use straight to idle: `_completeJob` still calls `_goHome`, so the use ends through
one `returning` tick (with `atPost` true, emitting nothing) before idle. Slice 2 covers that tick
in seating. R2's grep (its section 4) found no
listener that the fix breaks: `test_npc_needs`'s clerk has only `caffeine`, `test_needs_sims`'s
`see_back_at_desk` then ticks only after a real trip, and in the lab the Melanie capture and the
"locked" text stop showing while the owner sits at the PC. It also means fewer counted `leaves` in
workstation-state, which salt `lockChance` rolls; no shipped scenario uses `lockChance` yet.

**Correct semantics.**
- A job is **at post** when it is a `use` whose target is the NPC's `needsHome` object and whose
  approach cell is within `HOME_EPS` of the NPC's home (true by construction for an object home;
  a coordinate home has no object, so never). Carry jobs are never at post (the NPC fetches the
  item first).
- An at-post job has no wind-up and emits no `npc_left_post`; `s.atPost` stays true. When it
  completes, the NPC passes through one `returning` tick at its post (as built in b642594be) and
  emits no `npc_returned_post`. `npc_used:<objectId>` still fires, so beats keyed on it hold.
- `npc_returned_post` fires when `atPost` is false on arrival (the gate built in b642594be; no
  `s.leftEmitted` flag). A script move clears `atPost` without `npc_left_post`, so a later needs
  return emits an unpaired `npc_returned_post`; harmless today, since `onReturned` for an owner
  who was never away re-publishes false (R3 m6).
- Unchanged: a script move (`onExternalMove`) still clears `atPost` without emitting
  `npc_left_post`, as today; whether a scripted walk-off should count as a leave is open
  question 12.
- **Seating does not yet keep an NPC seated through an own-desk use.** `needsStop` returns a stop
  only for `idle && atPost` or a job in phase `using` (`seating.js:739-748`); during the wind-up
  and the `goto_target` tick it returns null, so `updateNeedsSeat` unseats the NPC and tucks the
  chair (827-830), then re-seats it with the chair pulled out when `using` starts: a visible hop
  on every own-desk work use. With no wind-up it is still at least one 250 ms tick. Change:
  `needsStop` returns the home stop (`key: at:<homeId>`, `post: true`) for an at-post job in any
  phase, so the key never changes. About 5 lines. If the separately landing fix already does
  this, slice 2 only adds the test.
- The action icon still shows the work icon while the NPC uses its desk, without the wind-up
  pulse.

Effects to re-check: the lab's Melanie window then opens only on real absences (her coffee trips:
caffeine 25/min from 100, `urgentAt: 50`, so the first about two minutes in); the lab's three
beats still complete. `test_needs_sims`'s `see_back_at_desk` objective (on `npc_returned_post` for
Amara and Tom) then ticks only after a real trip, which both make within the first minutes.
Re-run the README live-proof table: tick numbers do not move, but some `left_post`/`returned_post`
lines disappear (the `430 tom returned_post` / `432 amara returned_post` rows may change). About
30 lines, **landing separately**; not counted in slice 2's size.

**Engine (caught at the desk).** In `npc-needs.js`: `npc_returned_post` and `npc_left_post` carry
`playerNearby` and `playerDistance` (reuse `_playerProximity`), and `npc_left_post` carries
`expectedAwayMs` (walk estimate there and back at `speedFor`, plus the target's `useSeconds`,
plus the item leg for a carry; routines and queues extend it later, 2.10). While `returning` from
a real leave, if the player is within 1.5 tiles of the home object's approach cell, or has a
minigame open on the home object, emit `npc_caught_at_post:<npcId>`
`{objectId, playerDistance, inMinigame}` once per return. The sight challenge with
`near: { object }` covers "seen near the desk from across the room"; this covers "came back and
you were in my chair". About 45 lines.

**Which object the open minigame belongs to.** Not yet checked: `MinigameFramework.currentMinigame`
may not carry the object id for the PC minigames the lab uses. The slice first checks the params
those minigames get; if the id is not there, `interactions.js:792` (where
`workstationState.onInteract(objectId)` already runs) records the object id as the minigame opens,
and the framework clears it on close. Without one of these, `inMinigame` would never be true.

**Workstation reload fix (2.3).** At `installWorkstationState` (157) set every workstation's
`_owner_away` and `_screen_locked` globals to false, matching the in-memory map (the NPCs are at
their posts after a reload). Today a save taken while an owner was away keeps "away" text after a
reload while `onInteract` says "attended" (`state-sync.js` 164 syncs every global; the `away` map,
`workstation-state.js:80`, starts empty). About 10 lines; confirm with a reload test first.

**Docs.** Correct `NPC_NEEDS_SYSTEM.md` §12.3 (still describes Len's old `rounds` need) and add
the at-post rule to its events section.

**Schema.** None (events only). **Size.** About 60 lines left for slice 2: caught at the desk
45, the reload fix 10, the `needsStop` change 5 (the own-desk core, about 30, lands separately).

**Save.** None beyond the reload fix.

**Visible change.** Staff no longer show a "leaving" pulse, or hop up and sit down again, when
they only turn to their own PC; a returning owner reacts when the player is at their desk.

**Tests.** Node (the first three come with the separately landing fix; slice 2 checks they are
there and adds any that are missing): an own-desk work use emits no
`npc_left_post`/`npc_returned_post` and no wind-up, and keeps `atPost`; a coffee trip still emits
both, paired; an aborted own-desk use emits neither; `seating.test.mjs`: an own-desk job never
yields a null stop in any phase (wind-up, `goto_target`, `using`), so the NPC stays seated;
`workstation-state.test.mjs`: no away state during an own-desk use, and globals reset at install;
stub proximity on return → `npc_caught_at_post` once; not on a return with the player elsewhere;
not after an own-desk use. `test_needs_sims`: a mapping on `npc_caught_at_post:tom` with a bark;
objective "Get caught at someone's desk". Live: stand at Tom's desk when he returns (log shows the
event and the bark); in the lab, open `staff_pc_2` while Melanie works at it and check it reads
"attended"; reload with Chris away and check the text is "attended".

**Risk.** A player who opened a PC minigame cannot react while it is open; NPCs keep moving during
minigames (only the VM freezes them). Decide whether a catch closes the minigame (open question 6).

### 2.12 What the player sees (added after review R1; slice 3)

**Built: 2026-11-06 (845dadb4c, 804e8dfde), apart from the `lab_physical_pentest` live regression
(open, `HANDOVER_OFFICE_S3.md`).** As written, with these choices: the icon lookup for a use is
object id, the job's `need`, the target's first `satisfies`, type (R2 m3's order; the 2.12
sentence read as "need before id" would hide per-object entries); a scenario entry wins where it
is usable and an unusable one falls back to the default; `useSound` is per object only (presets
in slice 4 may give defaults); the hearing helper is `systems/room-hearing.js` (lighting imports
it, so the five lighting harness copy lists gained it); an audible use emits
`npc_use_heard:<objectId>` `{npcId, key, volume, hearing}`, which the showcase's new task
`hear_drink` keys on; a carried item's physics body is switched off while it is in hand. The
existing `see_parcel` task (retitled "Watch Amara carry a dropped parcel to her desk") is the
plan's parcel objective. Live, :3001 headless: game 593 (`test_needs_sims`): every default icon
seen over a head (coffee cups, cup, clipboard, talk, `F`, `Z`, mark-question, mail-new), icons
hidden for NPCs outside the player's room; Sanjay and Tom typing, sprite y alternating 1 px every
600 ms of the needs clock during `work/using` only; sounds from the play log: microwave in the
kitchen 0.139 (151 px, hearing 1), microwave through the kitchen door 0.006 (245 px, hearing 0.4),
cooler from the lounge 0 (hearing 0, not played), cooler at 44 px 0.281 with the player's own
`drink_gulp` started in the same frame (two instances playing); `hear_drink`, `see_parcel`,
`see_mugs`, `see_long_way` ticked. Game 596: Amara's parcel in hand walking north and north-east,
Grace's mugs in hand at her hip in the kitchen seen from the office through the door (no icon over
her, the office's icons showing). No pure south-facing carry was caught (the showcase's carries
all head north or west); the front placement shows in the side and diagonal frames. Screenshots
in the session scratchpad `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/s3/` (`icons-sheet.png`, `parcel-sheet.png`, `door-sheet.png`,
`held-sheet-1.png`, `bob-sheet.png`; play logs `sound-log*.json`). `test_needs_leash` game 597:
out and back by `west_corridor`, 0 of 96 samples on Maya's floor.

The needs system already moves people about, but the player sees very little of what they are
doing: `pickUp` hides the carried item (`npc-needs.js:872`), so a delivery is someone walking
with a `?` over their head; action icons are monospace text (`"PC"`, `"C"`); a use is a figure
standing or sitting still; and nothing makes a sound. This slice adds the visible layer, built
from what the engine already has. Every later slice lists its own "visible change".

**Action icons as sprites.** `actionIcons` values may be a texture (`{ "sprite": "coffee_cups1" }`
or `"icon:talk"` for `assets/icons/`), drawn at native size on today's dark backing; text stays
the fallback. Defaults from existing art, none resized:

| Icon for | Existing art | Size |
|---|---|---|
| caffeine | `coffee_cups1` (object) | 21×20 |
| thirst | `office-misc-cup` (object) | 11×11 |
| work | `clipboard` (icon) | 16×16 |
| social | `talk` (icon) | 21×18 |
| curiosity / fetching | `mark-question` (icon) | 16×16 |
| post, printouts | `mail-new` (icon) | 16×16 |
| hunger, rest | none suitable: text `F`, `Z` until icons are drawn **[approval]** | |

Which icon: `pickIcon` today returns `curiosity` for every carry (`npc-action-icons.js:24`) and
reads only the first `satisfies` (`targetInfo`, 43), so the cooler shows thirst for a social use.
The lookup becomes: for a carry, `icons[job.tag]` (so `post` and `printout` map to `mail-new`)
before `curiosity`; for a use, the job's own `need` before the target's id, `satisfies` and type.
About 5 lines.

Object textures are loaded per room, so the module loads any icon texture it needs on first use
(Phaser loader, one-off) and shows the text glyph until it arrives.

**Carried items in hand.** While carrying, the item's own sprite stays visible (instead of the
`setVisible(false)` in `pickUp`) and follows the NPC at a hand offset per facing: in front at hip
height for south, east and west (depth just above the NPC), behind the body for north (just
below). The follow runs on the scene's **`postupdate`** event, as seating's chair placement does
(`seating.js:958`): listeners on `update` run before `scene.update()` moves NPCs and sets their
depth (`npc-behavior.js` `updateDepth`, 2240-2249), so they would trail a frame behind. The held
item's visibility is **tied to its NPC sprite's** (visible exactly when the NPC is), not to the
room rule below, so a parcel does not vanish from the hands of a carrier seen through an open
door. Native size: today's carried items are small (`dirty_mugs1` 15×14, `notes1` 16×16,
`id_badge` 10×16, the parcel). The validator warns when a `needsTag` item's texture is over 24 px
on a side (it would look like carrying furniture). `consumeHeld`, `place`, `stow` and `dropHeld`
end the follow. No new art.

**A typing bob, inside seating.** The atlases have no typing, pouring or carrying frames (1.1).
From what exists: the NPC faces the object (exists) and sits at desks where its atlas has `sit_*`
frames (exists). A seated NPC is re-posed every frame by `poseSprite` (`seating.js:598-609`,
called at 849), which puts the sprite back whenever its rounded position moves, so a bob applied
from another module would be undone on the next frame. So the bob lives in seating:
`poseSprite` takes a `dy` (0 or 1 px) that seating computes from the needs clock while the seated
NPC's job is a `work` use, every 0.6 s. Collisions are already off for seated NPCs (636), so the
1 px does not disturb the body. Off under reduced motion. About 15 lines in `seating.js`.
Proper use animations (typing, pouring) through PixelLab custom animations are new art per
character per direction **[approval]**, deferred.

**Cut from this slice** (R2 N9, m1, m2, m5): the standing "dip" at the coffee machine (a standing
NPC has no display offset separate from its arcade body, so the dip would move the body); the idle
glance (desk staff sit, since `seatPreference` gives `fetch` for work, and a seated NPC's facing
follows the chair, so it would rarely show in the showcase); the typing click (the UI clicks are
the player's own interface feedback, `ui_click_1`-`6`, and would read as such); and a new room
`ambience` key (rooms already take `ambientSound`, 1.1).

**Sounds, heard only near the player.** Per-object `useSound` (a preset may give a default),
from existing files: `drink_gulp` at the end of a coffee or cooler use, `eat_snack` at the fridge
or microwave, `drawer_open` at a filing cabinet, `page_turn` when a slot is revealed or placed. A
small `playAt(key, x, y, roomId)` helper plays a **one-shot** with
`scene.sound.play(key, { volume })`, not `soundManager.play`, which reuses one Phaser sound per key
and so would restart the player's own consumable gulp (`sound-manager.js:195-225`). The volume is
the effects volume × at most 0.4 × a linear fall-off to zero at eight tiles × the room's hearing
level. The hearing level is `lightingSystem.hearing(roomId)` (own room 1, through a door 0.4,
`lighting.js:706-711`, already used for the tube clicks); that method is moved to a small pure
helper both use, because `window.lightingSystem` is null in a scenario without lighting. At most
one NPC use sound per second overall. New sounds for a kettle, coffee machine, copier, typing and
a desk-phone ring **[approval]**. Office ambience needs no engine work: an author sets the room's
existing `ambientSound` once an office room-tone loop exists **[approval]**.

**Where any of this shows.** Icons and bubbles (2.4) only for NPCs in the player's current room,
and hidden in a room whose lighting is dark (`LightingSystem.roomLevel`, `lighting.js:762`; a
room without lighting counts as lit). Held items follow their NPC's visibility (above). Sounds use
the hearing level. Today icons show for every NPC with a job in any loaded room, lit or dark
(`npc-action-icons.js:64`).

**Engine.** New `systems/npc-office-visuals.js` (about 110 lines: held-item follow on
`postupdate`, `playAt` and the hearing helper); `npc-action-icons.js` sprite icons, the tag and
need lookup, and the room/dark rule (about 65); the bob in `seating.js` (about 15). Schema about
15 lines (`actionIcons` object values, `affordance.useSound`, scenario-level `officeVisuals`).
About 205 lines. Not behind `officePresets`: icon defaults and sounds apply only where a scenario
has needs NPCs, and a scenario can turn the layer off with `"officeVisuals": false`.

**Save.** None.

**Visible change.** The point of the slice: sprite icons, the parcel in Amara's hands on the way to
her desk, a seated typist's bob, a gulp at the cooler when you are in the kitchen, a quieter one
through the open door and silence further off.

**Tests.** Node (pure helpers): icon resolution (sprite, `icon:`, text fallback); a carry with tag
`post` gets the post icon, a cooler use for `social` gets the social icon; hand offset and depth
per facing; the held item hides and shows with its NPC; `playAt` volume by distance and hearing
level (own room, through a door, elsewhere, and with no lighting system); one-per-second limit;
the room/dark visibility rule. `seating.test.mjs`: `poseSprite` with `dy` 1 places the sprite one
pixel lower and the next frame keeps it there while the bob is due. `test_needs_sims`: switch
`actionIcons` to the sprite defaults; objective "Watch someone carry the parcel to a desk" on
`npc_used:amara_pc` with `tag: post`. Live: screenshots of each icon over a head; the parcel in
hand walking north and south, and seen through the kitchen door; three frames of a seated bob;
the play log with volumes from inside the kitchen, through its door and from the lounge, plus a
player gulp during an NPC gulp (both heard); the lab's open plan to check icons and bob there.

**Risk.** Small sprites on a dark backing may read worse than the text at game zoom; the
screenshots decide per icon, and the text stays as the fallback.

---

## 3. Build order

Each slice ships alone. Its "done" list: node tests; a `test_needs_sims` addition with an
objective that ticks when the behaviour is seen; a live check on :3001 with screenshots of the
visible change (constraint 7); schema entries for every new field (constraint 8); a fully
annotated example of the feature in the `test_needs_sims` README; the README live-proof table
re-run; and a `lab_physical_pentest` regression run (the lab's three beats still complete). Sizes
are engine, validator and schema lines, excluding tests. S = under 100, M = 100-250, L = over 250.

| # | Slice | Size | Depends on | Who benefits first |
|---|---|---|---|---|
| 0 | Own-desk use is not a leave (core of 2.11) | ~30 | none | **built** (b642594be) |
| 1 | Tick-cost hygiene (2.0), plus the sims node fixture | S, ~90 (+ ~150 test fixture) | none | every needs scenario; unblocks larger casts; the fixture is what slices 4, 7 and 9 test on |
| 2 | Caught at the desk; `expectedAwayMs`; workstation reload fix; seated through an own-desk use (2.11) | S, ~60 | 0 | lab: Chris returns to find the player at `staff_pc` during the keylogger beat; stale "away" text after a reload goes; no stand-and-sit hop at the desk |
| 2a | Room leash and private objects (7.2 as revised in section 8; amendment 2026-11-05, requested) | M, ~230 | 1 (fixture, back-off); build after slice 2's edits are committed (same functions) | any mission that gives needs to NPCs with their own rooms (m01's Derek kept out of Maya's office); sims: colleagues stop working at each other's desks, the lounge is Rosa's and Grace's |
| 3 | What the player sees: sprite icons, item in hand, seated typing bob, room-limited use sounds (2.12) | M, ~205 | none (1 helps) | every needs scenario: deliveries, coffee runs and desk work become legible. New icons for hunger and rest, use animations, office sounds and room tone wait for **[approval]** |
| 4 | Affordance presets (2.1): **built** (aab2943c1) | M, ~150 | 1 (fixture) | `test_needs_sims` drops to a short list of per-object overrides; new scenarios get an office from `type` alone |
| 5 | Workstation indicators: a second emitter record per workstation (2.3): **built** (b820a5d24) | S, ~65 | 0, 2 | lab: Melanie's open screen and Chris's locked one read from across the lit open plan |
| 6 | Traits (2.6) | M, ~125 | 0 (workstation link); 5 to see it | lab: lock habits become traits; awareness scenarios get careful and careless staff from one field |
| 7 | Reveal slots: place and stow instead of consume (2.2 Part A) | M, ~245 | 1 (fixture); 3 to see items in hand | sims: a printout appears on the copier tray and is put on Amara's desk, then filed. Lab: a findable document on a tray if the lab wants one, as a single beat |
| 8 | Speech bubbles and pairing at capacity-2 objects (2.4), with social compatibility (7.3) | L, ~365 | 1, 3 (room/dark rule) | sims: cooler chat, and an outcast contractor nobody chats with. Lab: none directly (its coffee station is capacity 1; its chatter comes with slice 10) |
| 9 | Routines, with `visit` pairing (2.2 Part B) | L, ~450 | 4, 7; 8 for `visit` bubbles | sims: print and deliver, fetch the post. Lab: staff gain reasons to leave the desk other than coffee; the keylogger beat holds because a `$home` step still emits `npc_used:staff_pc` |
| 10 | Queues, and chatter in the queue between compatible NPCs (2.5, 7.3) | M, ~180 | 1, 4; 8 for queue chatter | lab: a queue at the coffee station stretches Chris's absence in a way the player can see, and the player can overhear the queue (`overheard`), a place for a social-intel grant in the awareness build |
| 11 | Window helpers: left-behind items (`leftBehindChance`, not `tidiness`) and queue-aware `expectedAwayMs` (2.10; scoped by R3-M3, piles move after slice 9) | S, ~90 | 7; adds `leaveCount` if 9 has not landed; 10 for the queue part | lab and awareness: more than one kind of window per office without scripting |
| 12 | Schedule, preemption, leave/arrive, desk phone (2.8, 2.9) | L, ~490 | 9 | longer scenarios with a stand-up or a fire drill; lab: optional later move of Len's badge round onto a schedule |
| 13 | Consumables and refills (2.7) | M, ~160 | 9 | deferred until a scenario asks |

Slices 1-6 come to about 695 lines (against about 930 before R2: the activity registry, the
workstation coupling of presets, the glance, the dip and the ambience key are cut, and the
own-desk core lands separately). They are not behaviour-neutral, and each says how: slice 1 can
move a blocked NPC's start by up to four ticks; slice 2 keeps desk staff seated through own-desk
work; slice 3 changes how every needs scenario looks and sounds (a scenario's explicit
`actionIcons` still win, so the lab's emoji glyphs stay until it opts in); slice 4's defaults are
behind `officePresets` and never create a workstation; slice 5 adds indicators to every
workstation with an owner (the lab's two PCs, and the showcase's three once it opts them in,
which it does in that slice on purpose). Slice 7 is the first that changes where items end up, and
only for slots: plain items are still consumed. Slice 2a (amendment, section 7) changes what NPCs
choose, but only for NPCs, rooms and objects that carry the new leash or `private` fields; slice
8's avoidance changes who shares a cooler only for NPCs with `needsCompany`. Slice 9 is the first that
changes choices for NPCs that list routines.

**The user's chosen slices (2026-11-05): 1, 2, 2a (requested with the amendment), 3, 4, 5, 7, 8,
10, 11.** About 1,685 lines plus the 150-line fixture (7.4, adjusted in section 8: slice 2a up
about 30, slice 10 up about 5, slice 11 down about 65).

`test_needs_sims` grows by no rooms (the room-leash route proof of slice 2a uses its own small
scenario, `test_needs_leash`, section 8; the copier and post tray go in the office, the start room, so
they are always loaded and no objective waits on a door) and at most one NPC (an outcast contractor
from slice 8, who also queues in slice 10 and can serve refills later). Keep the five current staff
and their timings, so the README's live-proof table stays valid apart from the changes slices 1, 2
and 2a name; add rows per slice.

**Lab notes.** The own-desk fix (slice 0, landing separately) fixes a lab bug (2.11): Melanie's
unattended-screen capture can today be taken while she is at her desk. Len
stays on his multi-room route with `challengeOnSight` (`lab_physical_pentest/scenario.json.erb`,
his `behavior.patrol.route` with the `{unlockRoom, useObject: "badge_reader"}` action).
`NPC_NEEDS_SYSTEM.md` §12.3 still describes the older `rounds` need; slice 2 corrects it. Sofia
Lord (the dropped-device beat) needs nothing new; she benefits from 10 (overheard queue chatter)
and 11 only.

---

## 4. Cut, defer, and open questions

### 4.1 Cut

- **Simulating unloaded rooms.** No off-screen NPCs or abstract time. If a scenario wants the
  whole office alive from the start, it preloads the rooms (open question 5).
- **A real-length working day.** Sessions are 20-40 minutes; schedules are compressed.
- **Runtime-generated dialogue.** Standing rule; chatter is authored pools.
- **Engine-invented takeable items.** Only declared slots can be taken (constraint 1.2.2).
- **Persisting need levels across a reload.** Reset stays; designs must self-heal instead.
- **Saving NPC-moved item positions.** The server only adds room objects for NPC-held items and
  player drops (`game.rb` `add_item_to_room!`); a placed or dropped item is back at its declared
  spot after a reload. Accepted rather than widening the server's add rules.
- **Pair-freeze in conversation.** Talking to one of a chatting pair freezes only that NPC; the
  pairing ends (2.4).
- **After review R2**, where the design fought the engine:
  - the activity registry, the `activity.` condition prefix and the "machine in use" light (2.3):
    the action icon already shows it; indicators read only existing workstation globals;
  - indicators as variants (2.3): replaced by a second emitter record that reuses the whole
    resolve and `above` draw path;
  - presets making workstations, and the workstation-state resolver hook (2.1);
  - preset `seat` values, preset `useFrom` where the showcase has none, and `seat: "near"` in the
    schema (2.1): parity with the showcase without overrides;
  - a per-target `onDeliver` map (2.2 Part A): the outcome follows the item's kind;
  - the listener-based hide path, `revealCycles`, the `<slot>_by` global and the orphan tidy-up
    errand (2.2 Part A): direct show and hide calls, and stow on sight after a reload;
  - the standing dip, the idle glance, the typing click and a new `ambience` key (2.12);
  - "another NPC's home stands" for plain jobs (2.2 Part B): routine steps only.

### 4.2 Defer

- Consumables (slice 13) until a scenario wants the beat.
- Use animations (typing, pouring) and idle fidgets: new PixelLab animations per character
  **[approval]**; the seated bob in 2.12 stands in. An idle glance for seated NPCs (a swivel turn;
  the chair already re-faces for the player, `seating.js:834-846`) if the showcase looks too still.
- New icons (hunger, rest), a desk-phone sprite, a post-tray sprite, pile sprites, and new sounds
  (kettle, coffee machine, copier, typing, desk-phone ring, an office room tone for the existing
  `ambientSound`) **[approval]**; each slice works with the existing stand-ins named in its
  section.
- Voiced chatter (TTS for bubbles): text first; revisit with the tts-audio pipeline if the lines
  settle.
- "Door held for someone carrying something" as an engine feature: the lab's route + sight wiring
  does it today.
- Moving Len to needs or a schedule: his route works and is tested.
- Screen sprite swaps per PC type (art cost); `above` indicators first (2.3).
- A "next want" thought bubble (`showNpcIntentBubbles`, parked in `npc-action-icons.js`).

### 4.3 Open questions (recommended default in bold)

1. **Schedule clock.** Per-NPC minutes since it registered, the needs clock, or the game clock?
   **Game-clock elapsed minutes (`atMin`, `gameClock.elapsedMs()`) by default; in-game `at` only
   when `gameClock.rate` is set.** Not the needs clock, which restarts at 0 on every load and
   would replay blocks. A late-loading room then joins the day in progress.
2. **Chatter voice.** Text bubbles only, or voiced? **Text only for now.**
3. **Transient machine state.** Client-only registry or globals? **Neither until a slice needs
   it: the registry is cut (2.3). A pile count (slice 11) or an empty machine (slice 13) uses an
   opt-in `publishGlobal` per object, so lighting, sprite variants and text variants can all key
   on it.**
4. **Routine library.** Engine-shipped defaults (print, post, tea round, file, shred, stand-up,
   leave) or scenario-only? **Ship the defaults; a scenario overrides by id.**
5. **Preloading office rooms.** Load listed unlocked rooms at start so their NPCs and objects are
   live (the route-patrol preload at `npc-behavior.js:658-672` is the precedent)? **Opt-in per
   scenario (`officeLife.preloadRooms`), unlocked rooms only, off by default.** Not in any slice
   yet; whichever slice adopts it adds the schema entry with it.
6. **Caught while in a minigame.** If the owner returns while the player has their PC open, does
   the engine close the minigame? **No: emit `npc_caught_at_post` with `inMinigame: true`; the
   scenario decides (a mapping can close it).**
7. **Preemption scope.** What may interrupt a running job? **Only high-priority schedule blocks
   and an explicit `needs.interrupt` mapping; ordinary need scores never preempt.**
8. **Presets on by default for new scenarios?** **No: opt-in `officePresets: true`**, reconsider
   once three scenarios use it without surprises.
9. **Routine vs plain use for the same need.** When a routine and a plain use both satisfy `work`,
   which runs? **A seeded roll per leave, in proportion to the weights (`plainWeight` default 1),
   so the mix varies but is deterministic; `plainWeight: 0` or no routines on the NPC gives a
   fixed beat.** (Was "higher weight wins", which made an NPC always or never run a routine.)
10. **Workstation reload fix.** Reset `_owner_away` / `_screen_locked` globals to false at install?
    **Yes, after a reload test confirms the stale text today.**
11. **What happens to a carried item at the target?** **It follows the item's kind: a plain item
    (including any player drop) is consumed, as today; a slot is placed, or stowed when the target
    says `onDeliver: "stow"` or a routine step says `then: "stow"`.** (Was a per-target
    `onDeliver` for every item, which could not work for player drops, R2 N3.)
12. **Does a scripted walk-off count as leaving the post?** Today `onExternalMove` clears `atPost`
    without `npc_left_post`, so workstation-state never sees a scripted absence. **Leave as is
    for now; revisit if a scenario scripts an owner away from a workstation and expects the
    screen window.**
13. **Chatter near the player.** **It continues (the player can overhear, within
    `overhearRadius`); a pool marked `hush` stops instead.**
14. **Takeable output slots: one beat or repeatable?** **One beat per takeable slot (the server
    removes a taken item for good); a pool gives a few; non-takeable slots that read in place
    repeat for ever. After a reload every revealed slot is stowed, so a printout lying on the tray
    at reload time is gone until the next print.**
15. **How does an NPC that has left come back?** **Through an `arrive` block; presence is
    re-derived from elapsed time on every load, so a reload agrees with the schedule. With no
    `arrive`, gone for the session, and the validator warns about anything that would then never
    fire.**
16. **Art and audio for the visible layer.** Which of these does the user want made: icons for
    hunger and rest; a desk-phone sprite; a post-tray sprite; pile sprites; kettle, coffee
    machine, copier and desk-phone ring sounds; an office room-tone loop; PixelLab typing and
    pouring animations? **None before the slice that needs it; each slice ships with the
    existing stand-ins, and its screenshots show whether the stand-in is good enough.**
17. **UI clicks as typing.** Acceptable as a stand-in for desk work, or silence until a typing
    sound is approved? **Silence.** (R2 m2: they are the player's own interface clicks and would
    read as feedback; was "try it and judge".)
18. **Should a plain work use at a colleague's free desk stand?** Today it sits in their chair
    (README finding F: Sanjay at `tom_pc`). **Leave it; only routine steps stand (slice 9).
    Widening it changes existing scenarios.**
19. **Coffee chatter in the lab: wait for queues, or `capacity: 2` on `coffee_station`?**
    Capacity 2 gives chatter with slice 8 but lets Chris and Melanie use the station together,
    which moves the lab's coffee timing and needs its beats re-run. **Wait for slice 10's queue
    chatter.**

Added with the amendment of 2026-11-05 (section 7):

20. **Does an avoidance stop sharing, or only chat?** **Both: the avoiding pair never shares a
    capacity-2 object (the second waits), but may queue one behind the other in silence.** A
    group mismatch stops chat only.
21. **One-way or mutual avoidance?** **Declared one way, acts both ways**, so one line on the
    distrusted NPC is enough.
22. **NPCs with no `needsCompany`.** **Compatible with everyone**, so slice 8 behaves as written
    until a scenario opts in.
23. **Do scripted moves and route patrols honour the leash?** **No: scripts win, as with
    suspend.** A needs NPC a script leaves inside a forbidden room walks out by the shortest
    route; only its targets and the rooms it crosses on the way are restricted.
24. **Leash conditions on globals** (a room becomes private only after a story beat)? **Decided by
    the user, 2026-11-06: the leash is fixed per NPC, with no global condition.** (Review m15 asked
    whether "sometimes leash an NPC" meant some NPCs or some times; it means some NPCs.) No
    `requireGlobal` on `needsRooms`, `needsAvoidRooms` or `needsPrivateTo`; avoidances (7.3) keep
    theirs.
25. **Should presets (slice 4) make desk PCs private?** **No: `private` is opt-in per object, since
    it changes which desk an NPC uses (README finding F); revisit with OQ8.**

Added after the amendment's review (section 8):

26. **Does `private` stop deliveries (`accepts`) or only uses (`satisfies`)?** (Review m7.) A desk
    that accepts deliveries is a drop point: slice 9's Sanjay delivering a printout to `tom_pc`
    would be refused if `private` covered carries. **Uses only: `private` and `owners` are read
    when the object is chosen for a `satisfies` need; any NPC may still deliver to it. Room rules
    (forbidden rooms) apply to both.** An author who wants a desk nobody else drops things on can
    leave `accepts` off it.

---

## 5. Changes after review R1

Kept as the record of round 1. Where a remedy below was later replaced, section 6 says so.

Review: `OFFICE_LIFE_PLAN_REVIEW_R1.md` (1 blocker, 11 major, 13 minor, plus the corrections in
its section 1.2 and the design notes in its section 5). Every finding was checked against the
code before acting on it. **All 25 findings and all nine corrections are folded in; none is
withdrawn.** Where the plan adopts a different remedy from the one the reviewer suggested, the
row says so.

| Finding | Checked against | Outcome | Where in the plan |
|---|---|---|---|
| **B1** carry consumes; reveal not saved; slots one-shot | `npc-needs.js:588, 884-892`; `games_controller.rb:2183-2188`; `rooms.js:2952-2976`; `game.rb` 378, 454; `find_accessible_item` 1869 | Folded. Carry outcomes `consume`/`place`/`stow`; slots revealed through `revealOnGlobal` on engine-owned globals (saved), a new hide path for cycling slots, slot pools, single-beat rule for takeable slots, orphan recovery via `<slot>_by`, placed items keep their declared room for server removal. Split out as its own slice (7) | 1.1, 1.2.2, 2.2 Part A, 2.10, 3 |
| **M1** parity test cannot pass | `test_needs_sims/scenario.json.erb` 83, 104-110, 117, 285, 294, 303, 312, 332 | Folded. Preset values taken from the showcase; parity is "presets plus a listed set of overrides", with the list in the plan and in the test, and a guard that the fixture has fewer fields | 2.1 Tests |
| **M2** prefix matching collides | type counts across `scenarios/` (49 `phone`, `printer_3d2`, `filing_cabinet_locked1`); `lighting.js:180-196` | Folded. Exact types only, `officeType` for roles, takeable and `lockType` objects excluded; art needs listed with stand-ins | 2.1, 2.2 Part B, 2.9, 2.10 |
| **M3** `npc_left_post` fires for an own-desk use | `npc-needs.js:497-525, 645-651`; `workstation-state.js:112-123`; lab 748-757, 858, 867 | Folded as slice 2's prerequisite, with semantics (at-post jobs, paired events) and the lab bug written up for the agent checking it live | 2.11, 2.3, 3 |
| **M4** glows will not read in a lit room | `lighting.js:1033-1041, 584-600`; lab line 13; showcase has no `lighting` | Folded. Small `above: true` indicators instead of glow changes; lighting block added to the showcase; sprite swap kept as an art fallback | 2.3 |
| **M5** overhear hook cannot fire; bubble timing | `npc-needs.js:845`; `bark-lifetime.js:18`; cooler dwell 312 | Folded with a different remedy: chatter continues near the player (opt-in `hush` stops it), a separate `overhearRadius`, bubble timing of its own fitted to the overlap (dwells not stretched), and a mapping that sends two NPCs to the cooler | 2.4 |
| **M6** schedules replay after reload; `leave` persists | `npc-needs.js:115, 199, 745, 305, 762`; `state-sync.js` 168-170 | Folded. Game-clock elapsed minutes; `arrive` blocks; presence re-derived on every load; validator warning for NPCs that never return | 2.8, OQ1, OQ15 |
| **M7** schema missing | `scenario-schema.json:4975-4988` | Folded. Constraint 8; a schema line in every slice's size; `affordance: false` and `seat: "near"` allowed | 1.2, every 2.x, 3 |
| **M8** visitors sit in the owner's chair | `seating.js:739-748, 759-768, 865-866` | Folded. Routine steps stand unless at the NPC's own home; any use of another NPC's home object stands | 2.2 Part B |
| **M9** plumbing the player won't see | `npc-needs.js:872`; `npc-action-icons.js:7-9, 64, 69-72`; atlases; `assets/sounds`, `assets/icons`, `assets/objects`; `sound-manager.js:195, 293` | Folded as a new slice 3 (2.12): sprite icons from existing art, the item drawn in hand, a bob, dip and glance, room-limited use sounds from existing files; every slice now lists its visible change; new art and audio marked **[approval]** | 1.2.7, 2.12, every 2.x, 3, 4.2, OQ16-17 |
| **M10** missing test blocks; 15-NPC fixture | plan 2.6, 2.7, 2.9, 2.10, 2.0 | Folded. Test blocks with a showcase objective and a live check for each; the 15-NPC copy is generated and never committed | 2.0, 2.6, 2.7, 2.9, 2.10 |
| **M11** routine choice all-or-nothing; carry needs `accepts` | `npc-needs.js:453, 488-492` | Folded. Seeded roll per leave against weights; routine carries skip `accepts` and the target's claim, and deliver from a side cell when the desk is occupied | 2.2 Part B, OQ9 |
| m1 tick cache invalidation; early short-circuit | `npc-needs.js:446, 875, 889, 907` | Folded | 2.0 |
| m2 back-off target | `npc-needs.js:470, 434-443` | Folded: clear all back-offs on any completion, abort or room load | 2.0 |
| m3 slices 1-4 change behaviour | showcase README line 63 | Folded: each early slice states its behaviour change; live-proof table re-run per slice | 2.0, 3 |
| m4 JS/Ruby parity brittle | — | Folded: one JSON table read by both | 2.1 |
| m5 pile sprites need a global | `rooms.js:688-722` | Folded: pile count published as a global (`publishGlobal`) | 2.10 |
| m6 slice dependencies | — | Folded: traits depend on workstation-state; `expectedAwayMs` in slice 2; `visit` pairing with routines | 3 |
| m7 per-NPC tag inconsistency | plan 2.2 example | Folded differently: carry collects `$output` by slot id, so no per-NPC tags or per-NPC slots | 2.2 Part B |
| m8 minigame object id | `minigame-manager.js:174`; `interactions.js:792` | Folded: check the PC minigames' params first, else record the id at interaction | 2.11 |
| m9 bubbles through walls and in the dark | `npc-action-icons.js:64` | Folded for bubbles, icons, held items and sounds | 2.4, 2.12 |
| m10 default chatter content | — | Folded: generic UK small talk, no work or security content, `"chatter": false` | 2.4 |
| m11 desk-phone ring is global | `sound-manager.js:195` | Folded via `playAt` (room-limited, distance-scaled) | 2.9, 2.12 |
| m12 preset workstations with no owner | `workstation-state.js:49-55` | Folded: validator lists them | 2.1 |
| m13 queue cells in doorways | — | Folded: validator flags cells within a tile of a door | 2.5 |
| W1 waiting NPC does no path search | `npc-needs.js:470, 434-443, 484-489` | Corrected; back-off retargeted | 1.3, 2.0 |
| W2 merge must happen before `listObjects`' skip | `npc-needs.js:782` | Corrected; one resolver used by four callers | 2.1 |
| W3 `updateObjectState` cannot carry visibility; no `hidden` field | `games_controller.rb:2183-2188`; no `hidden` object field in `core/` or `systems/` | Corrected (see B1) | 1.1, 1.2.2, 2.2 Part A |
| W4 seating default misdescribed | `seating.js:759-768` | Corrected (see M8) | 1.1, 2.2 Part B |
| W5 conversation freeze is per NPC | `npc-needs.js:765-772` | Corrected: no pair-freeze; the pairing ends | 2.4, 4.1 |
| W6 `item_gone` emits nothing | `npc-needs.js:550, 557, 612-627` | Corrected; the emit is added in slice 7 | 2.2 Part A, 2.10 |
| W7 `targetInfo` only for NPCs with a job | `npc-action-icons.js:64-67` | Corrected | 1.3 |
| W8 jobs are already aborted by scripts, suspend, status | `npc-needs.js:243, 257, 305-311` | Corrected | 2.8 |
| W9 line numbers | `workstation-state.js:43-46, 157`; `game-clock.js:99` | Corrected | 1.1, 2.3, 2.11 |
| §5 notes: print corner room loading; chair tuck wording; preempted carry position; whole-routine step timeout; annotated README examples | `seating.js:651-668`; `item-drop.js` `persistDrop` 41 | Folded: copier and tray in the start room; tuck attributed to seating; dropped items return on reload (accepted, 4.1); a step timeout fails the routine; annotated example in every slice's "done" list | 2.2, 2.8, 3, 4.1 |

**Slice order after the changes.** The own-desk fix moved into slice 2 (it is a current bug and a
prerequisite for indicators); the visible layer is a new slice 3, before indicators; the old
routines slice split into carry outcomes and slots (7) and routines (9); bubbles moved ahead of
routines, with `visit` pairing moving to slice 9; traits moved up to 6. Thirteen slices instead
of eleven; total about 2,900 lines against about 2,000, mostly from B1, schema work and the
visible layer.

---

## 6. Changes after review R2

Review: `OFFICE_LIFE_PLAN_REVIEW_R2.md` (verdict revise: R1's B1 partly closed and M1, M4 not
closed, M5 partly; 10 new majors N1-N10, 14 minors m1-m14, 13 wrong claims C1-C13). Every finding
was checked against the code at commit f05dc85b9 (file:line in the table). **All 37 findings are
folded in; none is withdrawn.** Nine (N1, N3, N5, N8, m2, m5, m8, m9, m14) take a different or simpler remedy than the reviewer
suggested, mostly by reusing what the engine already does; the row says so. R1's open items close
through them: B1 through N1-N4, M1 through N7 and N8, M4 through N5, M5 through N6.

| Finding | Checked against | Outcome | Where |
|---|---|---|---|
| **N1** revealed slot invisible for good after a reload; `pickUp` drops the sprite from `objects` | `core/rooms.js:2955-2965` (listener only in `hideUntilReveal`), 3023; `npc-needs.js` `pickUp` (about 882) | Folded, simpler remedy: show and hide are **direct calls** (`showRevealedObject`, new `hideRevealedObject`, exported), so no listener is needed; `stow` re-inserts the sprite under its declared room and key; **stow on sight** after a reload replaces the hide listener and the orphan errand. Reload-then-cycle test | 1.1, 2.2 Part A, 2.10 |
| **N2** readable `notes` slots removed on first read | `interactions.js:1694-1750`; `notes-minigame.js:235-271, 660-709` (auto-add default on) | Folded: cycling slots read in place (`readDisplay: "gameDisplay"`, 1699-1706), validator error otherwise; `active !== false` in the free test; a slot read through the notebook is a single beat. Read-a-cycling-slot test | 1.1, 2.2 Part A, 2.10 |
| **N3** `place`/`stow` undefined for player drops | `item-drop.js:41-75`; `npc-needs.js` `consumeHeld` | Folded, simpler remedy: the outcome follows the item's kind (plain items, including drops, are consumed; slots place or stow), so no per-tag `onDeliver` map; the parcel stays on `consume`, the showcase's placed item is the printout | 2.2 Part A, OQ11 |
| **N4** placed sprite's room bookkeeping | `inventory.js:510-533`; `notes-minigame.js:252-271`; `dropHeld` overwrites `sp.roomId` | Folded as suggested: register under the room it sits in, keyed by object id; `sp.roomId` stays the declared room; `_declaredRoomId` dropped. Cross-room place-then-pickup test (one `remove_object`, declared room) | 2.2 Part A |
| **N5** an `above` variant replaces the screen glow | `lighting.js:531-555, 558-583` | Folded, simpler remedy: the indicator is a **second emitter record** on the same object, reusing resolve, the `above` draw path and cluster rules unchanged (about 25 lines, not 40-60). Base-glow-unchanged test. The activity registry and in-use light are cut, so slice 5 is ~65, not ~200 | 1.1, 2.3, 3 |
| **N6** no pairing at capacity-1 coffee stations | `test_needs_sims/scenario.json.erb` 111-117, 297-303; lab about 909 | Folded: slice 8 pairs only at capacity 2+ (cooler, sofa); coffee chatter moves to slice 10 (the NPC using the machine pairs with the first queued NPC); the lab's overhear payoff moves with it; `capacity: 2` left as OQ19 | 2.4, 2.5, 3, OQ19 |
| **N7** the `test_needs_sims` stub world does not exist | `grep` of `test/`, `scripts/`; `npc-needs.test.mjs:12-60`, 29 | Folded: slice 1 builds a hand-written sims fixture (about 150 lines of test code) with a `useFrom`-aware `approachCell`; byte-identical checks run on it and on `office()`; the README table is the live check | 1.1, 2.0, 2.1, 3 |
| **N8** parity list misses the PCs; preset makes them workstations | `scenario.json.erb` 77-101; `workstation-state.js:43-46, 62-71` | Folded, simpler remedy: presets set no `useFrom` where the showcase has none (PCs, microwave, cooler), so no override is needed and no post moves; presets **never** make a workstation, which also drops the workstation-state resolver hook. The showcase opts its PCs in on purpose in slice 5, listed as a behaviour change | 2.1, 2.3, 3 |
| **N9** `poseSprite` undoes the bob | `seating.js:598-609, 849, 636` | Folded: the bob is a `dy` inside `poseSprite`, computed in seating; the standing dip is cut | 1.1, 2.12 |
| **N10** own-desk use still stands and re-sits | `seating.js:739-748, 827-830` | Folded into slice 2: `needsStop` returns the home stop for an at-post job in any phase (about 5 lines), unless the separately landing fix already does; seating test | 2.11, 3 |
| m1 ambience exists | `core/rooms.js:3129-3176`; schema 4004 | Folded: new `ambience` key cut; office room tone via `ambientSound` **[approval]** | 1.1, 2.12, 4.2 |
| m2 sound reuse | `sound-manager.js:60-64, 195-225`; `lighting.js:706-711` | Folded: one-shots via `scene.sound.play`; hearing level reused (moved to a helper because `lightingSystem` can be null, `lighting.js:1342-1344`); typing click dropped | 2.12, OQ17 |
| m3 icons for carries | `npc-action-icons.js:24, 43` | Folded: `icons[job.tag]` before `curiosity`; the job's `need` before the target's first `satisfies` | 2.12 |
| m4 follow lag | `npc-behavior.js:2240-2249`; `seating.js:958` (`postupdate` precedent) | Folded: held item follows on `postupdate` | 2.12 |
| m5 glance rarely shows | `seating.js:759-768` | Folded by cutting the glance; a seated swivel glance deferred | 2.12, 4.2 |
| m6 Rosa has a social need | `scenario.json.erb` 364 | Folded: corrected; the mapping stays because their urgent moments rarely overlap | 2.4 |
| m7 schema gaps | plan 2.12, 2.2 Part B, OQ5 | Folded: `officeVisuals` in slice 3, `deliverFrom` in slice 9; `preloadRooms` comes with whichever slice adopts it | 2.12, 2.2 Part B, OQ5 |
| m8 `onDeliver` per tag | `npc-needs.js` `_carryCandidate` (about 491) | Folded differently: no per-tag map needed, since the outcome follows the item (N3) | 2.2 Part A |
| m9 orphan stow has no target | plan 2.2 Part A | Moot: the orphan errand is cut; stow on sight after a reload | 2.2 Part A |
| m10 `leaveCount` undefined | `npc-needs.js` (no counter); `workstation-state.js:113-115` | Folded: `s.leaveCount` added in slice 9 (or 11), counted in `_leavePost`, reset on reload | 2.2 Part B, 2.10 |
| m11 lab line drift | `lab_physical_pentest/scenario.json.erb` 758-759, 764, 794, 865, 874 | Folded: lines updated | 2.11 |
| m12 15-NPC copy in the shared tree | — | Folded: the path goes in `.gitignore` in slice 1 | 2.0 |
| m13 held item hidden while its NPC is visible | plan 2.12 | Folded: held-item visibility follows the NPC sprite; the room rule stays for icons and bubbles | 2.12 |
| m14 "another NPC's home stands" changes scenarios | `seating.js:768` | Folded by narrowing: routine steps only; the wider rule is OQ18 | 2.2 Part B, OQ18 |
| C1 glow unchanged; "40 lines of data" | `lighting.js:539-583` | Corrected (N5) | 2.3 |
| C2 seating keeps an NPC seated through an own-desk use | `seating.js:739-748, 827-830` | Corrected (N10) | 2.11 |
| C3 the bob builds on seating's offset | `seating.js:604, 849` | Corrected (N9) | 2.12 |
| C4 non-takeable readable slots cycle for ever | `notes-minigame.js:235-271, 707-709` | Corrected (N2): only those that read in place | 2.2 Part A, 2.10, OQ14 |
| C5 hide path extends the `hideUntilReveal` listener | `core/rooms.js:2955-2965` | Corrected (N1): direct calls | 2.2 Part A |
| C6 `_declaredRoomId` makes pickup remove from the right room | `inventory.js:510-533` | Corrected (N4) | 2.2 Part A |
| C7 the parcel stays on Amara's desk, then is filed | `item-drop.js:41-75` | Corrected (N3): the parcel is consumed; the printout is placed and filed | 2.2 Part A, 3 |
| C8 README live-proof table unchanged after presets | `npc-needs.js` `approachCell` (about 800); `workstation-state.js:62-71` | Corrected (N8): now true by construction, and the live run checks it | 2.1 |
| C9 `test_needs_sims` stub world | `test/` grep | Corrected (N7): built in slice 1 | 2.0, 2.1 |
| C10 lab chatter at `coffee_station` in slice 8 | lab about 909 | Corrected (N6): moved to slice 10 | 2.4, 2.5, 3 |
| C11 a new room `ambience` key | `core/rooms.js:3144` | Corrected (m1) | 2.12 |
| C12 only Sanjay has a social need | `scenario.json.erb` 364 | Corrected (m6) | 2.4 |
| C13 lab lines 748-757, 858, 867 | lab 758-759, 865, 874 | Corrected (m11) | 2.11 |

**R2 section 4 (listeners of the own-desk fix).** Taken as written: no listener breaks; the lab's
Melanie capture and "locked" text stop showing while the owner is seated; fewer counted leaves
shift `lockChance` salts, which no shipped scenario uses yet. Noted in 2.11. The fix itself lands
separately (slice 0).

**Slices, sizes and tests after R2.** Order unchanged apart from the own-desk core moving out as
slice 0 and coffee chatter moving from 8 to 10. Sizes: slice 2 ~85 → ~60 (core lands
separately), slice 3 ~275 → ~205 (cuts), slice 4 ~205 → ~150 (no workstation hook, no seat
column), slice 5 ~150 → ~65 (no registry, indicator as a second record), slice 7 ~275 → ~245
(direct calls and stow on sight replace the listener and the orphan errand), slice 9 ~470 →
~450, slice 10 ~150 → ~170 (queue chatter), slice 11 ~160 → ~155. Total about 2,635 lines plus
the 150-line test fixture, against about 2,900. New tests from R2: the sims fixture (slice 1);
the seated-through-own-desk seating case (2); `poseSprite` with `dy` and the hearing levels (3);
base glow unchanged while an indicator shows (5); reload-then-cycle, read-a-cycling-slot and
cross-room place-then-pickup (7); no pairing at capacity 1 (8); queue chatter (10).

---

## 7. Amendment 2026-11-05: social compatibility and room leash

The user (2026-11-05): "For NPC chatting together, may need to have some way to represent who
valid NPCs are with compatible affordances — specifically if there is an NPC the others don't
trust (like Derek in m01, then others shouldn't start chatting with him around a water cooler).
Likewise, we may want to enable needs but still sometimes leash an NPC to specific rooms. So
(just for example) Derek doesn't walk into Maya's personal office to get a glass of water."

Two features follow. The **room leash and private objects** are a new slice, **2a**, built early
because they matter as soon as any mission gives needs to NPCs who have their own rooms (m01's
Derek and Maya, if they get needs). **Social compatibility** is a filter inside the pairing code,
which does not exist until slice 8, so it folds into slices 8 and 10 rather than standing alone.
Line numbers are from the working tree on 2026-11-05 with slice 1 in progress (`npc-needs.js`
has its tick cache); function names are the stable reference.

### 7.1 What exists (checked)

- **Candidate selection** knows nothing about rooms beyond interests' `noticeRooms`
  (`npc-needs.js` `_carryCandidate` 579-592, rooms at 580). `_useCandidate` (566-577) filters by
  `satisfies` and `_free` (500), then takes the home object or `_nearestReachable` (521-530).
  `_reachable` (357) is answered once per NPC and object per tick.
- **`needs` is a map keyed by need name** (`register`, 157-169), so a `needs.rooms` key would be
  read as a need called "rooms". The leash goes beside `needsHome` and `needsSpeed` as NPC-level
  fields (schema `scenario-schema.json` 4493, 4505).
- **Pathfinding is one EasyStar grid over the whole world** at 8 px (`npc-pathfinding.js`
  `rebuildWorldGrid` 230-306; `PATHFINDING_STEP`, `utils/constants.js:37`), corner cutting off
  (291). `findWorldPath` (347-386) already applies **per-search constraints and removes them
  straight after `calculate()`**: `avoidAdditionalPoint` for the player's NPC avoidance (313-340)
  and `setAdditionalPointCost` for prefer-avoid objects (403-409). So a route *can* be kept out of
  a room with the mechanism already in use; no fallback heuristic is needed. Two kinds of search
  must carry it: the needs system's synchronous reachability check (`reachable`, `npc-needs.js`
  `createEngineWorld`) and the walk itself. `goToAndStay` (`npc-behavior.js` about 2448) only
  writes a one-waypoint patrol; **the walk is planned in `chooseWaypointTarget` (about 1417)**,
  or in `chooseWaypointTargetMultiRoom` (about 1546) for a `patrol.multiRoom` route, and
  re-planned after collision avoidance inside `updatePatrol` (about 1053) and by the stuck
  recovery (`_recoverFromStuck`, about 1282). All four are planning points (review M1; the
  amendment named only 1053 and 1282, which would have let the first plan take the short cut).
- **Which room a point is in.** The player's room is the room whose floor (its rectangle minus
  the top two tile rows of wall) holds the feet (`core/rooms.js` `updatePlayerRoom` 3052-3080).
  An NPC's room uses the full rectangle, first match (`npc-behavior.js` `updateCurrentRoom`
  756-788), which can name the northern room while the NPC stands in a doorway. The leash uses
  the floor rule.
- **Unloaded rooms.** World bounds cover every room (`core/game.js:1803`), but an unloaded room
  has no bodies and sits behind the closed doors of loaded rooms, so nothing can path into it and
  nothing there needs blocking.
- **Trust and relationship data.** There is **no NPC-to-NPC relationship anywhere** in the
  engine. What exists is NPC-to-player: `systems/social-influence.js` (influence per social
  character, bands calm, wary, refusing, reported, locked out; thresholds whose effects set
  scenario globals, re-armed with `clearOnRearm`; the SE lab's are `dev_wary`, `lord_wary`,
  `pierce_wary`) and the hostility `influence` on `npc-behavior.js` (292, 2644). Globals are the
  shared currency, and the sight challenge already has a condition form for them, `requireGlobal`:
  a name (truthy) or `{ name: value }` (`npc-sight-challenge.js:130-138`). The social hook reuses
  that form; it does not read influence directly.
- **Ownership.** `workstation-state.js` `ownerOf` (48-55): `screenOwner`, else the NPC whose
  `needsHome` is the object.
- **Seating fetches chairs only in the NPC's own room** (`chairsNear(behavior.roomId, …)`,
  `seating.js` 943-950, `FETCH_RANGE` 192 px, 811), so keeping targets out of a room keeps chair
  fetches out too.
- **m01 ids** (read from the NPC blocks only): Derek is `derek_lawson` (starts in `break_room`;
  his office is `derek_office`, his PC `derek_computer`); Maya is `maya_chen` (room
  `maya_office`). m01 has no needs today; the examples below are the pattern if it gets them.

### 7.2 Room leash and private objects (slice 2a)

**Built: 2026-11-06 (engine, validator, schema, tests: 42575dda0; `test_needs_leash`: 2af3d7493).** **Changed 2026-11-06 (845dadb4c, with slice 3):** `leashed` (log and `npc_needs_leashed`) now
fires only when a room rule (`needsRooms`, `needsAvoidRooms`, a `needsPrivateTo` room) removed a
target, and its `skipped` lists only those; passing over another owner's `private` object is
expected and is logged as `private_skipped {need, skipped, chose}` with no event, and the overlay
adds ` private` (`job.privateSkipped`, `privateNoted`). Game 593: 9 `leashed`, all skipping
`lounge_kettle`, none for `work`; 11 `private_skipped`, all `work`.
As revised in section 8. Live, :3001 headless, load about 25, game 583 (`test_needs_leash`, all
four doors opened first): leashed, Ravi went `ravi_office → west_corridor → store` and back the
same way, never on `maya_office`'s floor (sampled every 250 ms); with `needsPrivateTo` removed
from the loaded room, the same NPC came back through `maya_office`. Screenshot of the long route
in the session scratchpad. **Finished 2026-11-06 (02f304b7c, 2e4a7a190):** the overlay label,
the sims showcase and a second leash proof. `test_needs_leash`'s cooler moved to the store's
north-east (8,2), so both legs contrast; game 587, doors opened first: leashed, three round
trips by `west_corridor`, 0 of 1,966 samples on Maya's floor, `returned_post` once the player
stood clear; unleashed (field dropped through the bridge), out `maya_office → store` and back
`maya_office → ravi_office`, 32 of 86 samples on her floor. `test_needs_sims` game 585 (doors
opened at 1:45, after the contention beat): contention unchanged (Tom urgent at tick 240,
`job_start office_coffee` at 278 as Amara's use ends); every work use at the NPC's own PC
(`leashed` entries name the colleagues' PCs as skipped); the deadline memo set both caffeine
levels to 20 and Tom took `kitchen_coffee` with `lounge_kettle` skipped though nearer (274 px
against 323 from his desk), twice; Rosa used `lounge_kettle`; Amara, Tom and Sanjay were never on
the lounge floor (899 samples); task `see_long_way` ticked; console errors only the keyless TTS
503 and one 404 that also appears on the leash game (the favicon answers 404 on :3001).
Screenshot `s2a/sims-amara-office-coffee-leashed.png` in the session scratchpad. **Differences
from the plan:** (1) a target cut off only by the route (rooms in a row, the middle forbidden)
is skipped by `reachable` without a `leashed` entry; the log notes only options the filter
removed. (2) The objective needs two mappings (`data.npcId === "tom"`, `... "amara"`): mapping
conditions have no `||`. (3) The memo is a readable note whose `object_interacted` mappings (on
Tom and Amara, keyed on `data.objectName`) set `needs: { set: { caffeine: 20 } }`;
`kitchen_coffee` moved from (6,8) to (3,8) so the kettle is nearer to Tom's desk too. (4) The
`lab_physical_pentest` live regression was **not run**: its expansion step 2 landed mid-session
(2ea86f714) and is the other agent's to prove; see the handover note.

**Authoring.** Three forms, from coarse to fine. Prefer the room form for "someone's office": one
line on the room instead of a deny list on every other NPC.

```jsonc
// Room level: only these NPCs' needs may use anything in the room or walk through it
"maya_office": { "type": "room_office", "needsPrivateTo": ["maya_chen"], ... }

// NPC level, beside needsHome: an allow list and/or a deny list for needs-driven moves
{ "id": "derek_lawson", "needsHome": "derek_computer",
  "needs": { "thirst": { "decayPerMin": 10, "urgentAt": 40 } },
  "needsAvoidRooms": ["server_room"] }                  // never for a drink, never as a shortcut
{ "id": "night_guard", "needsHome": "guard_desk",
  "needsRooms": ["reception_area", "break_room"] }      // allow list; the home room is always allowed

// Object level: only its owners' needs use it
{ "id": "maya_kettle", "type": "kettle1",
  "affordance": { "satisfies": "caffeine", "private": true, "owners": ["maya_chen"] } }
{ "id": "tom_pc", "type": "pc",
  "affordance": { "satisfies": "work", "private": true } }   // owner: the NPC whose needsHome is tom_pc
```

**Rules.**
- An NPC's forbidden rooms are: every room outside `needsRooms` (when given), every room in
  `needsAvoidRooms`, and every room whose `needsPrivateTo` does not list it. The leash is fixed
  per NPC (OQ24, decided): no global conditions. Its home room is never forbidden; the validator
  errors if an author forbids it.
- **The home room comes from scenario data, not the resolved home (review M2).** `register` sets
  `home: null`, and an object home stays provisional (at the spawn point, `objectId: null`) until
  its object loads; start-room NPCs register before their room's objects. So "forbidden" is a
  per-room predicate, `_roomForbidden(s, roomId)`, evaluated when candidates are filtered, not a
  set built at register. The home room it exempts is, in order: `needsHome.room` (coordinate
  home); the room of the `needsHome` object once the world can find it (`getObject`); the
  resolved home's room; the NPC record's spawn `roomId`. All four are static or settle once.
  Room `needsPrivateTo` is read from the loaded room (the bootstrap scenario strips room fields it
  does not list, so `createRoom` keeps `needsPrivateTo` on `window.rooms[roomId]`); an unloaded
  room has no objects to choose and no ring to draw, so nothing is lost.
- **Candidates.** A new `_permitted(s, o, use)`: the object's room is not forbidden, and, for a
  use (`satisfies`), the object is not `private` or the NPC is one of its owners. It is applied in
  `_useCandidate` (the options filter) and in `_carryCandidate` (items, and accepting targets with
  the room rule only: `private` does not stop deliveries, OQ26). The filter runs before the
  home-object preference, so the preference is unchanged.
- **Routes.** `reachable` and the walk both pass `avoidRooms` (the loaded forbidden rooms).
  `findWorldPath` gains an options argument, `{ avoidRooms }`. For each **loaded** room in it,
  except the room whose floor holds the search's start point (so an NPC that a script left inside
  a forbidden room can still walk out), it marks the room's **inner ring**: the outermost cells
  of the room's own floor, by the player's floor rule (`core/rooms.js` `updatePlayerRoom`: full
  width, from two tiles below the top to the bottom edge), corners included, with
  `avoidAdditionalPoint`. It then runs the search and removes **those same cells** with
  `stopAvoidingAdditionalPoint` (not `stopAvoidingAllAdditionalPoints`, which would also drop the
  player's NPC-avoid set) **in a `finally` straight after `calculate()`**, never in the callback,
  which runs a tick later in async mode (review m4). `calculate()` runs every queued search to the
  end before it returns, so nothing else can search while a ring is set; the early return when
  the grid is not ready comes before any marking.
- **Why a ring holds (corrected, review m1).** In EasyStar 0.4.4 the no-corner-cutting test reads
  only the grid (`isTileWalkable`), not avoid points; avoid points are checked only for the cell
  being entered. So a diagonal step *can* pass between two avoided orthogonal neighbours. A
  closed ring still blocks because every step changes x and y by at most one, so a path from
  outside to inside must land on a ring cell, **provided the ring includes its four corner cells**
  (without them a diagonal step at a corner crosses it). The grid model in `path-avoid.test.mjs`
  must check avoid points on the entered cell only, and include a cornerless ring that leaks, so
  the model is known to match EasyStar.
- **Inner, not outer (review m2).** A ring round the outside of the floor would sit in the
  neighbouring rooms' edge cells and could seal a permitted target whose approach cell lands
  there. The inner ring lies wholly in the forbidden room, which never holds a permitted target,
  and any route into the room crosses it.
- **No walkability filter, no cache (review m3).** `doors.js` opens a doorway by editing the grid
  in place and rebuilds 250 ms later, so a cached "walkable cells only" ring would miss a door
  opened in between. An avoid point on a blocked cell does nothing, so the ring is every cell of
  the floor's edge, computed per search from the room's position and map size (a few hundred
  integer pairs; no cache to clear).
- **When the constrained search fails**, the candidate is unreachable, exactly as a walled-off
  target is today: `_nearestReachable` tries the next one and slice 1's back-off applies. No
  separate "skip candidates whose path crosses a forbidden room" step is needed, because the
  search itself refuses the crossing.
- The behaviour keeps the move's `avoidRooms` (`this._moveAvoidRooms`) and passes it from **one
  helper** used at all four planning points (`chooseWaypointTarget`,
  `chooseWaypointTargetMultiRoom`, the collision repath in `updatePatrol`, `_recoverFromStuck`;
  review M1). It is cleared on arrival, on `cancelMove` and on any `goToAndStay` not owned by
  needs; **a needs move without `avoidRooms` keeps the current value** (review m5: seating's chair
  fetch is a needs-owned move with no rooms, and stays in the NPC's own room). The walk home
  passes it too. **Scripted moves and route patrols ignore the leash** (scripts win, the same rule
  as `onExternalMove`). Node test: a needs `moveTo` followed by `chooseWaypointTarget` passes the
  rooms to `findWorldPath`.
- **Owners** of a private object: `affordance.owners` when given, else the `ownerOf` rule:
  `screenOwner`, else the first NPC whose `needsHome` is the object (one owner, matching
  `workstation-state.js` `ownerOf` and the validator). `screenOwner` is on the object, not on the
  NPC record (review m6), so the adapter's `describe` gains `screenOwner`, and the `needsHome`
  test reads the registered NPC records (`world.getNpc`). npc-needs does not import
  `workstation-state.js`, so no test harness copy list changes.
- **Private is about NPC needs only.** The player can still use the object; workstation-state is
  unchanged (a private PC still locks or stays open when its owner leaves); seating is unchanged
  (a non-owner never picks the object, so never sits there). Marking desks private closes README
  finding F (a colleague working at someone else's desk) for scenarios that opt in; OQ18 stays as
  the default for unmarked desks.
- **Why an NPC is not going.** When free options existed but the leash or privacy removed at
  least one, the decision log gets `leashed {need, skipped, chose}` and the system emits
  `npc_needs_leashed:<npcId>` with the same payload, once per job start, or once per urgent
  episode when nothing was left to choose. The debug overlay shows "leashed" on the job label.

**Engine.** `npc-needs.js` about 80 lines (`_roomForbidden` with the scenario-data home room,
`_permitted`, owners, `avoidRooms` to `reachable` and `moveTo`, the log and event).
`npc-behavior.js` about 20 (store, clear, and one helper used at the four planning points).
`npc-pathfinding.js` about 35 (options argument, inner-ring cells, exact removal in a `finally`).
`core/rooms.js` one line (keep `needsPrivateTo` on the loaded room). Validator about 60, schema
about 25 (`needsRooms`, `needsAvoidRooms` on the NPC; `needsPrivateTo` on the room;
`affordance.private`, `affordance.owners`). **About 230 lines, M.**

**Validator** (`validate_npc_needs.rb`, beside the existing "no object" error at 107-110 and
`room_warnings` at 153-160):
- unknown room ids in `needsRooms`, `needsAvoidRooms`, `needsPrivateTo`; unknown NPC ids in
  `needsPrivateTo` or `owners` (errors);
- the NPC's home room forbidden, or its `needsHome` object private to someone else (error);
- **a need made impossible by the leash**: objects satisfy it, but none the NPC may use (error,
  naming the rule that excludes each); the same for an interest's accepting objects (error) and
  for items outside the rooms it may enter (warning);
- **a permitted target that can only be reached through a forbidden room**: a walk over the rooms'
  `connections` from the home room, never entering a forbidden room (warning: the engine will
  skip it);
- a private object with no owner (no `owners`, no `screenOwner`, no NPC with it as `needsHome`):
  warning, "serves nobody";
- `noticeRooms` naming a forbidden room (warning);
- the T1/P timing report picks `nearest` from the targets the NPC may use, not all targets
  (review m12).

**Save and lazy loading.** All authored configuration; nothing is saved and nothing needs to be.
An unloaded room has no objects to choose and no ring to draw. `_moveAvoidRooms` is rebuilt by
the next job after a reload.

**Performance.** `_roomForbidden` is a few list checks per object per select. A 12×10-tile room's
floor is 48×32 cells, its ring about 160; two loaded forbidden rooms cost about 320 avoid calls
and 320 removals per search, only for leashed NPCs, and searches are already limited by slice 1's
per-tick cache and back-off. A target cut off by the leash costs more than an open one: EasyStar
floods the whole permitted region before it gives up, and `_nearestReachable` tries every
candidate nearest first, so a leashed NPC with three cut-off candidates pays three floods per
select, capped at one select a second by the back-off (review m14). Slice 1's micro-benchmark
gains a leashed variant **that includes a cut-off candidate**, so that cost is measured.

**Visible change.** An NPC goes the long way to the kitchen, or waits at its desk, instead of
cutting through someone's office; nobody but its owner uses a private kettle; colleagues stop
sitting at each other's desks.

**Tests.** Node, `npc-needs.test.mjs` (the stub world gains a room adjacency map and a
`reachable(id, obj, {avoidRooms})` that walks it): a deny list removes a room's objects and the
next candidate wins; an allow list with the home room implied; **an allow list while the home is
still provisional** (review M2: the home room still comes from `needsHome`'s object or the spawn
room, never forbidden); `needsPrivateTo` lets the owner in and keeps others out; rooms A-B-C in a
row with B forbidden and the target in C: not chosen, `leashed` logged; an NPC starting inside a
forbidden room walks home; private owners from `owners`, `screenOwner` and `needsHome`, and a
capacity-2 private object; a private object still accepts another NPC's delivery (OQ26);
`moveTo` receives `avoidRooms`; the decision log is byte-identical for `office()` and the sims
fixture, which have no leash fields. Behaviour (`npc-behavior.test.mjs` or a focused file): a
needs `goToAndStay` with `avoidRooms` followed by `chooseWaypointTarget` passes the rooms to
`findWorldPath`; a needs move without them keeps the value; a script move clears it.
Pathfinding, in the pattern of `npc-pathfinding-world-grid.test.mjs`: inner-ring cells (the
floor's edge, corners included, blocked cells included, the start room skipped);
`findWorldPath` with a recording stub pathfinder avoids the ring before `calculate()`, removes
the same cells after it even when `calculate()` throws, and never calls
`stopAvoidingAllAdditionalPoints`. In `path-avoid.test.mjs`'s EasyStar-rules model, with avoid
points checked on the entered cell only: three rooms in a row with the middle ring avoided give
no path, and a ring without its corners leaks (review m1). Validator: one fixture per check
above.

**Showcase, `test_needs_sims`** (the candidate filter; its rooms lie in a row, so no shortest
path ever crosses the lounge): the three PCs get `private: true` (owners from `needsHome`); the
lounge gets `"needsPrivateTo": ["rosa", "grace"]` (Rosa's room, where Grace rests) and a
`lounge_kettle` (`kettle1`, caffeine) that only those two may use; a note in the office whose
mapping drops Tom's and Amara's caffeine together, so one finds `office_coffee` taken and walks
to the kitchen, never the lounge kettle (place the kettle so it is nearer to their desks than
`kitchen_coffee`, or the test proves nothing). The kettle is a candidate only once the lounge is
loaded and the kitchen outcome needs the kitchen loaded, so **the live run opens both doors
first and says so** (review m11). Objective "Tom keeps out of the lounge" keyed on
`npc_used:kitchen_coffee` by Tom or Amara (an `eventMapping` condition on `data.npcId`), not on
`npc_needs_leashed`, which fires whenever the leash removes an option, wherever the NPC then goes
(review m11); `leashed` stays a decision-log check. **Behaviour change in the showcase:** Rosa
makes coffee in the lounge instead of walking to `office_coffee`; private PCs stop the fallback
to a colleague's free desk when one's own is taken (README row "285 sanjay used work amara_pc"
was already superseded by the home-preference fix, row 65; 2a stops the fallback itself); the
contention row (`README.md` 63) depends on the kitchen being unloaded at tick 241 and is
re-checked. Both recorded in the live-proof table re-run. Live: the decision log shows no job
target and no NPC position inside the lounge for the other four, and a screenshot of Tom at
`kitchen_coffee` while Amara is at `office_coffee`.

**Route proof, `test_needs_leash`** (review M3: the ring is the riskiest part and needs a live
case on the real path): a small scenario with four rooms in a loop (two above, two below, each
pair joined by doors), a needs NPC whose home is in one room and whose only target sits in the
diagonally opposite room, and one of the two rooms between them private to someone else. The
short way crosses the private room; the long way goes round. Proof: the decision log, the NPC's
sampled positions (never on the private room's floor), and a screenshot of it on the long route;
then the same NPC with the leash removed (a second game, or the room's field dropped through the
test bridge before the job) taking the short route through the room.

**Risks.** A leash too tight leaves an NPC never acting: the validator's impossible-need error and
the `leashed` log catch it. A deny list on a corridor cuts off everything beyond it: the
connectivity warning catches it. Two rooms whose floors meet without a wall: the inner ring sits
on the forbidden side only, which is the intent. An approach cell snapped (up to three cells)
onto a forbidden room's edge makes that target unreachable for a leashed NPC; the validator
cannot see it, and the `leashed` log and job back-off show it. The player's own avoid points can still be present during an
NPC search between the player's `calculate()` and its deferred callback; that is true today and
unchanged.

### 7.3 Social compatibility (in slices 8 and 10)

**Authoring.** On the NPC:

```jsonc
"needsCompany": {
  "groups": ["research"],                       // optional
  "avoids": [
    "derek_lawson",                             // an NPC id
    "group:contractors",                        // everyone in a group
    { "npc": "derek_lawson", "requireGlobal": "derek_exposed" },  // only while a global holds
    { "group": "contractors", "requireGlobal": "audit_running" },  // a group, conditionally
    { "npc": "*", "requireGlobal": "derek_exposed" }               // everyone, conditionally
  ]
}
// Derek, whom nobody trusts: avoidance works both ways, so one line on him is enough
{ "id": "derek_lawson", "needsCompany": { "avoids": ["*"] } }
```

**Name (review m9).** The field was `social` in the amendment. The scenario-level `social` block
is the social-engineering contract (`scenario-schema.json` about 229, `validate_social.rb`,
`social-influence.js`) and the sims NPCs have a need called `social`, so the NPC field is
`needsCompany`, beside `needsHome`, `needsSpeed` and `needsRooms`. The object form of an
avoidance takes `npc` (an id or `"*"`) or `group`, plus `requireGlobal` (review m10).

`requireGlobal` takes the sight challenge's form (a name, truthy; or `{ name: value }`, all must
match). It is the hook to existing trust data: a scenario with social influence can key an
avoidance on a band global it already sets (`dev_wary` in the SE lab), and any scenario can key
it on a story global set from ink.

**Rules.**
- **Chat** (slice 8 pairing, slice 10 queue chatter) needs both: the **group test** (passes when
  either NPC has no `groups`, else they must share one) and **no avoidance** in either direction.
  With no `needsCompany` on anyone, everyone pairs, exactly as slice 8 is written today.
- **An avoidance is declared one way and acts both ways.** The visible result (no chat, no
  sharing a cooler) is two-sided anyway, and one line on the distrusted NPC is easier to write
  than one on every colleague.
- **Sharing.** Avoidance also stops sharing: in `_free`, an object with capacity 2 or more that is
  claimed by an NPC this one avoids (or that avoids it) counts as full, so Maya waits at her desk
  rather than standing silently beside Derek at the cooler. A group mismatch alone only stops
  chat; they share in silence. **Queues** (slice 10): an avoided NPC may queue behind or in front
  of the other; they never chat in the queue.
- Conditions are read when the pairing starts (and when `_free` runs); a global that flips
  mid-chat lets the pairing finish.
- **Events.** `npc_avoided:<npcId>` `{npcId, avoidedId, objectId}` when sharing is refused, once
  per urgent episode per pair and object. `npc_chatted:<objectId>` already carries `speakerId`
  and `partnerId`; when `overheard` is true the system also emits `npc_overheard:<speakerId>` with
  the same payload, so a mapping can react to overhearing one particular NPC.
- Globals are read through a new world-adapter call (`globalHolds(cond)`, reading
  `window.gameState.globalVariables`), so npc-needs gains no static import. `requiredGlobalsHold`
  is not exported from `npc-sight-challenge.js`, and importing it would be a new static import
  (test harness copy lists), so its six lines are copied into the adapter (review m10).

**Engine.** Slice 8: `_compatible`, the `_free` check, the two events and their dedupe in
`npc-needs.js` about 45 lines; the adapter call about 6; validator about 20 (unknown NPC ids and
groups in `avoids`; a `requireGlobal` naming a global not in `globalVariables`, warning; an NPC
whose only social object is shared with someone who avoids it, info); schema about 25
(`needsCompany`, `groups`, `avoids` and its object form). Slice 8 goes from about 270 to **about 365**. Slice 10:
queue chatter calls `_compatible` (about 10 lines), from about 170 to **about 180**.

**Save and lazy loading.** Nothing saved; conditions follow globals, which persist.

**Performance.** One small list check per pairing and per `_free` call on a shared object.

**Visible change.** The distrusted NPC stands alone at the cooler; colleagues wait their turn
instead of joining him, and chat with each other once he has gone.

**Tests.** Node: same group pairs and chats; different groups share in silence; an avoidance
declared on one side stops chat and sharing in both directions, the second NPC waits and emits
`npc_avoided`, then takes the place when the first leaves; `"*"` and `group:` entries;
`requireGlobal` false pairs, true avoids (for `npc`, `group` and `"*"` object entries); the log is
byte-identical for fixtures without `needsCompany`;
`npc_overheard:<speakerId>` only when `overheard` is true. Slice 10: an avoided pair queues with
no `npc_chatted`. `test_needs_sims` (slice 8): the one extra NPC the plan allows becomes an
outcast contractor (`needsCompany: { avoids: ["*"] }`, a thirst need, a `needsHome` spot in the office;
cast per the diversity rule, sprite from an existing atlas); a mapping sends him and Sanjay to the
cooler together. Objective "Nobody chats with the contractor" on `npc_avoided:sanjay`. Live:
screenshot of the contractor alone at the cooler and Sanjay at his desk, then Sanjay at the cooler
with no bubble on the contractor.

**Risks.** `avoids: ["*"]` on a central NPC can starve others of a social object for long
stretches; the validator's info line names who shares only with someone they avoid. Writers may
expect a one-way avoidance to be one-way; the schema description says it is mutual.

### 7.4 Slices and sizes after this amendment

| Slice | Before | After | Change |
|---|---|---|---|
| **2a** Room leash and private objects (7.2), **new, requested** | — | M, ~230 (was ~200; section 8) | needs 1 (fixture, back-off); build after slice 2's edits are committed |
| 8 Speech bubbles and pairing | ~270 | ~365 (L) | social compatibility (7.3) |
| 10 Queues and queue chatter | ~170 | ~185 (M) | compatible pairs only in the queue; queue cells skip forbidden rooms (m8) |
| 11 Window helpers | ~155 | ~90 (S) | scoped by R3-M3 (section 8) |

The user's chosen slices become **1, 2, 2a, 3, 4, 5, 7, 8, 10, 11**: about 1,715 lines plus the
150-line fixture as the amendment had it, about 1,685 after section 8, against about 1,410 for
the same set before. Slice 9 (routines, not chosen)
would honour the leash for its steps, and a `visit` to a home in a private room would need its NPC
listed; noted for when it is picked up.


## 8. Changes after amendment review

The amendment's review (`OFFICE_LIFE_PLAN_REVIEW_AMEND1.md`, 2026-11-06: 0 blockers, 4 major,
15 minor; "revise, then build; no further review round needed") checked section 7 against the
working tree and EasyStar 0.4.4. Every finding is folded in; each was checked against the code
before it went in.

| Finding | Where it was checked | Outcome | Section |
|---|---|---|---|
| **M1** wrong walk call sites | `npc-behavior.js`: `goToAndStay` writes a one-waypoint patrol; `chooseWaypointTarget` plans at about 1417, `chooseWaypointTargetMultiRoom` at about 1546, the collision repath at about 1053, `_recoverFromStuck` at about 1282 | All four go through one helper that adds `avoidRooms`; node test that a needs move then `chooseWaypointTarget` passes the rooms | 7.1, 7.2 Rules |
| **M2** home room unknown at register | `register` sets `home: null`; `_resolveHome` gives a provisional home until the object loads | Per-room predicate `_roomForbidden`, home room from `needsHome.room`, the object's room, or the spawn room; test with a provisional home and an allow list | 7.2 Rules, Tests |
| **M3** no live route proof | `test_needs_sims` rooms lie in a row (kitchen, office, lounge) | New `test_needs_leash`: four rooms in a loop, long route versus short route with the leash removed; the sims showcase keeps "no new rooms" | 7.2 Tests |
| **M4** R3's three conditions not in the text | 2.1, 2.10, 2.11, slice table | Slice 4: presets only on declared objects, decor test, live list (2.1). Slice 2: `needsStop` covers `returning && atPost`, in code at `seating.js` about 822 (2.11 Built line). Slice 11: `leftBehindChance` in place of `tidiness`, piles after slice 9, ~90 lines (2.10, table) | 2.1, 2.10, 2.11, 3 |
| m1 corner-cutting reason wrong | EasyStar 0.4.4: corner test reads the grid only; avoid points apply to the entered cell | Ring includes corners, reason corrected; the grid model checks the entered cell only and includes a leaking cornerless ring | 7.2 Rules, Tests |
| m2 outer ring seals neighbours | `core/rooms.js` floor rule; wall colliders | Inner ring: the forbidden floor's own edge cells | 7.2 Rules |
| m3 cached walkable-only ring misses a door | `doors.js` edits the grid in place, rebuilds 250 ms later | No walkability filter, no cache: computed per search | 7.2 Rules |
| m4 where cleanup runs | `findWorldPath` clears NPC-avoid in the callback | Rings removed in a `finally` right after `calculate()` | 7.2 Rules |
| m5 chair fetch is a needs move with no rooms | `seating.js` `moveNeeds` | A needs move without `avoidRooms` keeps the current value | 7.2 Rules |
| m6 owners map source | `screenOwner` is on the object; `describe` lacked it; `ownerOf` returns the first match | `describe` carries `screenOwner`; one owner, the first match | 7.2 Rules |
| m7 does `private` stop deliveries | `_carryCandidate` filters accepting targets | New OQ26: uses only by default; room rules apply to both | 4.3, 7.2 |
| m8 queue cells in forbidden rooms | slice 10 text | Queue places skip forbidden cells; validator warning | 2.5 |
| m9 `social` name collides | `scenario-schema.json` scenario-level `social` | NPC field renamed `needsCompany` | 2.4, 7.3, 3 |
| m10 object form of an avoidance | `npc-sight-challenge.js` `requiredGlobalsHold` not exported | `group` and `"*"` object entries allowed; six lines copied into the adapter | 7.3 |
| m11 showcase objective and README rows | `npc_needs_leashed` fires on any removed option | Objective on `npc_used:kitchen_coffee` by Tom or Amara; both doors opened first; README rows reworded | 7.2 Tests |
| m12 T1/P report from all targets | `validate_npc_needs.rb` `nearest` | Permitted targets only | 7.2 Validator |
| m13 stale status line | header | Slices 0, 1, 2 landed | header |
| m14 cut-off searches cost more | `_nearestReachable`, slice 1 back-off | Benchmark includes a cut-off candidate | 7.2 Performance |
| m15 "sometimes" leash: some NPCs or some times | OQ24 | **User, 2026-11-06: fixed per NPC, no global condition** | 4.3 OQ24 |

One addition the review did not raise, found while checking M2: the bootstrap scenario sent to the
client strips room fields it does not list (`Game#filtered_scenario_for_bootstrap`), and the full
room from `/room/:id` is not kept after `createRoom`, so `needsPrivateTo` would be invisible to
the engine. `createRoom` keeps it on `window.rooms[roomId]` (one line); only loaded rooms matter.
