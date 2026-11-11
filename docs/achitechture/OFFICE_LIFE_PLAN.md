# Office Life: plan for reusable NPC office behaviour

Status: **plan, 2026-11-05, revised after adversarial reviews R1 and R2
(`OFFICE_LIFE_PLAN_REVIEW_R1.md`, `OFFICE_LIFE_PLAN_REVIEW_R2.md`; outcomes in sections 5 and 6),
and amended the same day for social compatibility and a room leash (section 7, new slice 2a),
then revised on 2026-11-06 after the amendment's review (`OFFICE_LIFE_PLAN_REVIEW_AMEND1.md`;
outcomes in section 8). Built: slices 0, 1, 2, 2a, 3, 3b, 4, 5, 7, 8, 10, 11, 14 and 15 (Built
lines in 2.0-2.5, 2.10-2.12, 7.2, 7.3 and sections 9-11). Not chosen: 6, 9, 12, 13. Section 12
(slices 16-21, added 2026-11-06): review complete after five rounds (sections 13-13e); the user's
decisions are in (2026-11-06, section 13f), and building starts with slice 21.** Line numbers
drift as slices land; the function names are the stable reference. Engine changes
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

**Built: 2026-11-06 (fcb8817a4, 3ff1efa29; showcase f97960f2e).** As written, with these choices made
without asking: an abort while carrying a slot files it (stow) instead of `dropHeld`, following the
schedules section's interruption rule ("or stowed if it is a slot"), since the server could not keep a dropped position; `revealOutput` lifts a
shown slot's depth above its producer (a tray slot is y-sorted under a tall copier otherwise); the
`used` log entry gains `outcome` only for slots, so plain-item logs are byte-identical (test against
a digest recorded before the change); new events `object_revealed:<slotId>` and `npc_placed:<itemId>`;
`placeSeconds` is clamped to 0-3600; `rooms.js` puts `showRevealedObject`/`hideRevealedObject` on
`window` as well as exporting them, so `npc-needs.js` gains no static import; the validator's
"global used elsewhere" rule is an error (any string naming it outside `globalVariables`), and
`validate_scenario.rb`'s pinned-proximity warning skips a slot with its producer or a sibling slot.
Tests: `test/js/npc-needs-slots.test.mjs` (18). Live: game 643 (sims README, slice 7 table), which
also caught a carry heading south.

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

**Built: 2026-11-06 (0af49071a; showcase 224a177c2, 40d8c3ea3; test 3a51f2aac). Regressions
2026-11-06: `test_needs_leash` game 668 (pass), `lab_physical_pentest` game 669 (score 100); see
`HANDOVER_OFFICE_S8.md`.** As written, with these choices
made without asking (smallest option each time): (1) an NPC's own pool for a topic adds to the
scenario's (or built-in) pool, and a scenario pool replaces the built-in pool of that name; (2)
`chattiness` is the seeded chance a speaker says a line on its turn (default 1); (3) the cooler
preset sets `chatter: "cooler"`, the sofa none (resting), so no scenario that uses presets gets
chatter on a sofa; no lab object has a chatter topic; (4) one pair per object (a capacity-3 object
still pairs only two); (5) the first speaker is a seeded roll, then they alternate; a line starts only
if it ends before the first of the two uses ends; (6) `hush` uses `playerNearby` (96 px, same room,
clear line) of either NPC; (7) the second NPC heading for a shared object stands one walkable tile
beside the first one's approach cell (adapter `besideCell`; the stub world has none, so fixture logs
are unchanged), so the two can face each other; (8) chat lines are events only, never in the decision
log, so every existing fixture's log is unchanged (tested on the sims day with and without chatter);
(9) bubbles: white rounded box with a tail, 10 px monospace, above the head where the action icon
sits; at most four, nearest the player; hidden under any open minigame; (10) `npc_chatted` also
carries `line` and `objectId`. Live, :3001 headless, games 665 and 667 (sims README slice 8 table).

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

**Built: 2026-11-06 (367a27627, 1bcdc550c, 3da2015f6, 33a7a8643; tests 963f790ef; showcase
4f16579b2). Regressions: `test_needs_leash` game 681 (pass), `lab_physical_pentest` game 680 (score
100); see `HANDOVER_OFFICE_S10.md`.** As written, with these choices made without asking (smallest
option each time): (1) queue cells are tile offsets from the approach cell, snapped exactly (radius
0) and dropped if not walkable; the coffee preset default is the plan's example `(-1,1), (-2,1)`, and
`queue: false` switches a preset queue off; (2) a queue is an option only when no free permitted
target is reachable, so a free machine elsewhere still wins (the long way to the kitchen keeps
working); (3) while a queue exists only its front may take a freed place (no queue jumping);
(4) `maxWaitSeconds` counts from joining and pauses while frozen; leaving logs `queue_left` with
`need_met`, `max_wait` or `no_queue_cell` and emits nothing; (5) only the first queuer can chat, and
an incompatible front means silence (the second never steps in); (6) the queued icon is `queue`
alone, so a scenario's per-object icon does not hide it; (7) the doorway check is static: a cell
within a tile of a wall that has a door, or outside the room. Two fixes outside the queue code, for
the slice 8 leftovers: needs moves walk on to their cell (`goToAndStay` `arriveWithin`, shared
`npc-behavior.js`; the 1-tile stop is kept as a 1.5 s fallback), and the cooler preset gains
`useFrom 0,1`. Queue-aware `expectedAwayMs` stays in slice 11. Live, :3001 headless, games 675,
676, 679 (sims README slice 10 table).

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

**Built: 2026-11-06 (slice 11, 5e3fd1e89, 5cccaf6ea). Regressions: `test_needs_leash` game 686
(pass), `lab_physical_pentest` game 685 (score 100); see `HANDOVER_OFFICE_S11.md`.** Left-behind items
and queue-aware `expectedAwayMs` as written; no piles. Choices made without asking (smallest option
each time): (1) the roll's salt is `left:<leaveCount>:<itemId>`, so two items of one owner roll
independently (the plan's `left:<leaveCount>` named one item); `leaveCount` counts in `_leavePost`
before the roll, so the first leave is 1, and lives in the needs state (resets on reload);
(2) the item shows as the owner leaves (before `npc_left_post`, which gains `leftBehind: [ids]`);
it is collected on `npc_returned_post`, logged `stowed` `reason: "collected"`; (3) a taken item logs
`left_item_gone` and emits `npc_left_item_gone:<npcId>` once on the owner's return (not in the plan;
the counterpart of slot `item_gone`, so a scenario can map the owner noticing); its global stays
true; (4) the item draws just above its owner's `needsHome` object when that is within two tiles
(desk dressing shares the desk's depth, so the badge was hidden behind the pen pot), as a tray slot
is lifted above its copier; stow puts the declared depth back; (5) the queue wait is
`ceil(place / capacity) × useSeconds` (the plan's "position times the dwell" for capacity 1);
(6) validator: `leftBehindBy` with `outputOf` is an error, an item outside the owner's post room a
warning, missing `leftBehindChance` a warning (default 0). Tests: `test/js/npc-left-behind.test.mjs`
(15), fixture `addLeftBehind`. Live: game 684 (sims README slice 11 table), `expectedAwayMs` with
Tom first in the queue 28.2 s against Amara's 15.7 s at the machine (12 s dwell).

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

**Built: 2026-11-06 with slice 8 (see 2.4's Built line); the slice 10 part (queue chatter for
compatible pairs only, avoided pairs queue in silence) with slice 10 (see 2.5's Built line).** As written, with these choices made
without asking: (1) `npc_avoided:<npcId>` names the NPC that was refused and waits; it fires once per
pair and object until that NPC next starts a job; (2) `_free` checks avoidances only when some
registered NPC has `needsCompany`, so scenarios without it run exactly as before; (3) a `requireGlobal`
read with no adapter (the node stub without `globalHolds`) counts as not holding; (4) the showcase's
outcast is Marek Nowak (`male_telecom_v2`), and Sanjay's chat urge is mapped to `npc_left_post:marek`
(target the cooler) rather than to the rota itself, so Marek always claims the cooler first and
Sanjay is the one who waits (with both set at once, whoever was at the cooler already, often Grace,
decided it); (5) validator: an over-long or multi-line chat line is an error, an unknown pool name or a
chatter object below capacity 2 a warning, an unknown NPC in `avoids` an error, an undeclared group or
global a warning, and the info line names every need whose objects are all shared with someone the NPC
avoids unconditionally.

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

## 9. Addition 2026-11-06: an icon set for actions and pressing needs (slice 3b)

**Built: 2026-11-06 (art 59f291e82; code d19e81840, 8ffa8502d).** As written, with these choices made
without asking (smallest option each time): (1) every scenario `actionIcons` entry is tried for all
keys before any default, so a scenario's `work` beats the default `print`; (2) `print` is a use of
an object whose preset is `copier`, whose `officeType` is `copier` or whose type contains
"copier"/"printer", or a use whose NPC `onUse` has `revealOutput` (in the showcase, Sanjay's PC
use shows the printer); (3) `file` is `job.files`: a reveal slot carried to a target with
`onDeliver: "stow"`, known from the job start; (4) `blocked` and `noticed` show in the action slot
only when the NPC has no job, `noticed` wins, `NOTICED_MS` = 3 s of the needs clock; both show only
with `showPressingNeeds` or an explicit `actionIcons` entry, so the lab (no opt-in) is unchanged;
(5) `blocked` means an urgent need that a room rule left with nothing permitted (`leashNoted`); an
urgent need with nothing reachable at all shows only the bubble; (6) the bubble is drawn to the
upper right of the head (13 px right, 6 px up), on a light backing so it reads apart from the dark
action icon, and its pulse is 1 + 0.12 |sin(t/400)| (the wind-up is 0.35 at t/120), off under
`prefers-reduced-motion` as seating's bob is; (7) `pressing` ignores `maxUnmetMin` starvation
(the plan says "at or below urgentAt"); (8) the old `showNpcIntentBubbles` stays a known field so
it draws one rename warning, not also an unknown-field warning. Slice 8's speech bubbles must hide
the thought bubble (not built yet). Live, :3001 headless, game 649 (`test_needs_sims`): every icon
but `queue` over a head, a bubble for each of the six needs, the bubble handing over to the hunger
icon as Sanjay leaves for the kitchen (the `file` and `blocked` cases forced, see the sims README
slice 3b table). `test_needs_leash` game 656: leashed 0 of 46 samples on Maya's floor, unleashed 6 of
35. `lab_physical_pentest` game 658: score 100, 10/10 tasks. Screenshots:
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s3b/` (`s3b-contact-sheet.png`, `s3b-handover-strip.png`).

**Requested by the user (2026-11-06):** use PixelLab to make a set of icons for the NPCs' current
actions and their pressing needs. This lifts two items from 4.2 Defer: "new icons (hunger, rest)"
and the "next want" thought bubble (`showNpcIntentBubbles`). Paid art approved for this set; the
user asked for icons generated several to an image (grid extract, memory note
`pixellab-grid-extract`).

### 9.1 Art

One consistent 16×16 set, the size of the existing UI icons (`clipboard`, `talk`,
`mark-question`), drawn at that size and never rescaled. Generated as grids, several icons per
PixelLab image, then cut out with exact pixel crops and reviewed on a nearest-neighbour contact
sheet. Files go in `assets/icons/npc-<name>.png`, so they cannot clash with the UI icons.

| Group | Icon | Shows | Replaces |
|---|---|---|---|
| Needs | `npc-caffeine` | steaming coffee mug | `coffee_cups1` object sprite |
| | `npc-thirst` | glass of water | `office-misc-cup` object sprite |
| | `npc-hunger` | sandwich | text `F` |
| | `npc-rest` | "Zz" | text `Z` |
| | `npc-social` | two speech bubbles | `talk` |
| | `npc-work` | monitor and keyboard | `clipboard` |
| | `npc-curiosity` | magnifying glass | `mark-question` |
| Actions | `npc-post` | envelope / parcel | `mail-new` |
| | `npc-printout` | printed sheet | `mail-new` |
| | `npc-print` | printer / copier (a use of a copier, slice 7) | — |
| | `npc-queue` | hourglass (waiting in a queue, slice 10) | — |
| | `npc-file` | folder (stowing a slot, slice 7) | — |
| | `npc-blocked` | no-entry sign (urgent need, nothing permitted reachable: `leashed`) | — |
| | `npc-noticed` | exclamation (caught someone at the desk, slice 2) | — |
| | `npc-workaround` | red arrow hopping a striped barrier (access slice 9.2, user decision q21: an NPC doing a workaround: a `writes_down`, `prop_door` or `share_login` visit, the use of a PC borrowed by `borrow_session`, and 4 s after an `emit`; also the picture of the `wk_*` start lines) | `npc-work` |
| | `npc-barrier` | plain striped barrier (access slice 9.2, user decision q27: a judged use that just failed, shown for 4 s once the failure's line has gone; also the picture of the `station_fail`, `work_fail_no_access`, `work_fail_fed_up`, `social_blocked` and `usb_refused` pools). Kept apart from `npc-blocked`, which still means nothing permitted reachable and is the standing frustration icon | `npc-blocked` |
| | `fallback` | no icon drawn: stays the text `•` | — |

The defaults in `npc-action-icons.js` `DEFAULT_ICONS` switch to these. A scenario's own
`actionIcons` still win, so the lab's emoji glyphs stay until the other session opts in.

### 9.2 Pressing needs

A **pressing need** is a need at or below its `urgentAt` (the existing `urgentFlag`) that the NPC
is not acting on yet: no job, a job for a different need, or a back-off after `leashed`/no target.
It shows as the need's icon inside a thought bubble (a rounded backing with two trailing dots,
drawn with Phaser graphics, no extra art) beside the head, offset from the action icon. When the
NPC starts a job for that need, the bubble goes and the action icon takes over, so the same need
is never shown twice.

- One bubble per NPC: the most pressing need, lowest `level / urgentAt`, ties by need name
  (determinism).
- Same visibility rule as action icons: the player's room only, not while it is dark.
- A need below half its `urgentAt` pulses slowly (the wind-up pulse at a lower rate).
- Slice 8's speech bubbles hide it while the NPC talks.
- Opt-in per scenario: `showPressingNeeds: true` (schema; the parked `showNpcIntentBubbles` is
  renamed to it, the validator warns on the old name). Off by default, because in a mission it
  telegraphs when someone is about to leave the desk, which changes how hard a window is to catch.
  `test_needs_sims` turns it on; the lab decides for itself.
- `getState` already returns `levels`; it gains `pressing: { need, ratio } | null`, worked out in
  the needs system from its own `urgentAt` so the icon module does not read needs config.

### 9.3 Size, order, tests

About 70 lines: the icon module (defaults, thought bubble, pulse), `getState.pressing`, schema
and validator rename. Build after slice 7 and before slice 8, since 8's bubbles must hide it.
Tests: node, `pickIconEntry` returns the new defaults and a scenario entry still wins;
`pressing` picks the lowest ratio and clears when a job for that need starts; no bubble with
`showPressingNeeds` off. Showcase: the option on, and a README row. Live: screenshots of each need
bubble and of the bubble handing over to the action icon as the NPC leaves; then the lab
regression (its scenario does not opt in, so its icons should be unchanged).

## 10. Addition 2026-11-06: avoidance at a distance, balking and parked needs (slice 14)

**Requested by the user (2026-11-06):** NPCs that avoid each other should do so around a need, not
only when sharing an object: if someone they avoid is at the coffee, in its queue or near it, they
walk away or look for another source. Show it ("a thought bubble of not wanting to be near
someone"). Story needs should not give way; environmental needs (food, coffee) can. A queue that is
too long sends an NPC to another source, and if there is none, it moves on to other things. A need
with no source in any loaded room parks until a door opens or a room loads. Numbered slice 14
because 12 and 13 are already used (schedules, consumables; not chosen).

### 10.1 What exists (checked 2026-11-06)

- **Avoidance applies to sharing only** (slice 8, `NPC_NEEDS_SYSTEM.md` compatibility): a capacity-2+
  object held by someone this NPC avoids, or who avoids it, counts as full, so the NPC waits and
  `npc_avoided` fires. Nobody turns back because an avoided person is *near* the object or in its
  queue, and slice 10 deliberately lets an avoider queue silently behind someone it avoids.
- **No source in reach already parks implicitly**: reachable means the object's room is loaded and a
  path exists, so coffee behind a closed door is not an option; the NPC holds still and retries on
  the selector back-off. Two flaws: the level keeps falling, so after `maxUnmetMin` the need is
  starved and wins outright, and when a door opens every starved NPC rushes at once; and nothing
  tells "about to go" apart from "can't get any".
- **Queues** (slice 10): `maxWaitSeconds` already makes an NPC leave a line (reneging). Nothing makes
  it refuse to join a long one (balking).

### 10.2 One rule: unacceptable target, fallback, give up

Avoidance, a long queue and no source all go through one path in the selector, not three special
cases.

1. **Unacceptable target.** Candidate filtering (where leash, privacy and capacity already filter)
   gains two checks, for NPCs that opt in:
   - **Social:** someone this NPC avoids (an id, `group:`, `"*"`, with `requireGlobal`, as in 7.3), or
     who avoids it, is using the object, holds a place in its queue, or stands within
     `needsCompany.avoidRadius` tiles of its approach cell (default 2; 0 restores slice 8's
     sharing-only rule). Both ways, as now.
   - **Queue:** the number already queued ahead is at least the NPC's `maxQueue` (balking). Unset means
     no limit (today's behaviour).
2. **Re-check while committed.** On the walk there and in a queue, the same checks run again, driven
   by events (an NPC joins or leaves that object's queue, an NPC arrives at or leaves the object or
   its radius), not every frame. An NPC changes its mind **at most once per job** (hysteresis), so it
   cannot dither. Turning back is logged `turned_back` with the reason and emits
   `npc_turned_back:<npcId>` `{need, targetId, reason: "avoid"|"queue", avoidedId?}`.
3. **Fallback chain.** The selector takes the next acceptable source for the same need (nearest
   first, as today). Only if none is acceptable does the NPC give up.
4. **Give up: the need is parked.** For a **deferrable** need (the default for every need):
   `deferredUntil = now + needsDeferMin` (needs clock; per NPC, default 4 min), the level holds at
   `urgentAt + 1` with decay paused, and it cannot become starved while parked. Other needs and
   interests run meanwhile; with nothing else urgent the NPC stays at, or goes back to, its post.
   Logged `parked` `{need, reason: "avoid"|"queue"|"no_source"}`, event
   `npc_need_parked:<npcId>`. A parked need is retried when its timer runs out, **and at once** when
   any room loads or any door opens (an engine event the needs system already hears through the
   lazy loader and `doors.js`), so a door opening releases parked NPCs one by one on their normal
   select (staggered by the existing per-NPC select offset, not all on one tick).
   - **No source** parks the same way, which fixes the starvation rush: a need with nothing
     reachable no longer falls to starved while nothing can satisfy it.
5. **Story needs do not give way.** A need declared `deferrable: false` (for scenario needs such as
   a guard's rounds or "deliver the report") never parks for `avoid` or `queue`: the NPC goes anyway
   and shows the avoidance bubble on the way, a deliberate moment. `no_source` still parks it (it
   cannot do otherwise). The validator warns on `deferrable: false` for the built-in environmental
   needs (caffeine, thirst, hunger, rest), since that is rarely meant.

Parking, not topping up: a top-up would erase the tension and make `expectedAwayMs` wrong; a parked
need keeps a believable trip for later.

### 10.3 What the player sees

- **Avoidance bubble:** while turning back (and for a few seconds after), and for a non-deferrable
  NPC on its way, a thought bubble holds the **avoided person's face**: the head of their own walk
  sprite (south-facing idle frame, top rows to the chin), cropped at native size as a Phaser frame,
  never scaled, plus the new `npc-avoid` icon (a small storm cloud) beside it. No new art per
  character.
- **Parked need:** the need's bubble drawn greyed (alpha and a desaturated tint on the existing icon,
  no new art) with a small badge: `npc-closed` (a closed door) for `no_source`, the existing
  `npc-queue` with a red cross drawn in graphics for `queue`, `npc-avoid` for `avoid`. Shown under
  `showPressingNeeds`, like every 3b bubble.
- **Grumble:** turning back says one short line from a `grumble` chatter pool ("I'll come back
  later.", "Not now.", "Maybe the kitchen's quieter."), a scenario pool replaces it as in slice 8.
  It is a normal slice 8 speech bubble, so `npc_overheard` fires and the player can learn who avoids
  whom.
- **Art:** two new 16×16 icons, `npc-avoid` and `npc-closed`, made the same way as section 9 (one
  PixelLab pro call each, 64 candidates, outline clean-up by hand). Approved by the user.

### 10.4 Why players care (design intent)

Borrowed from games that do this well: The Sims' face-in-bubble for relationships; RimWorld's
readable reason for every decision; Prison Architect and Two Point Hospital's visible patience,
balking and storming off; and above all Hitman's routines that are readable first and manipulable
second. Here the avoidance map becomes a lever the player can pull (keep Derek at the coffee machine
and Chris stays at his desk; make Chris walk to the far kitchen and the window is longer; open a
locked kitchen and a coffee run starts), and overheard grumbles are social reconnaissance, which is
what the lab and the awareness course teach. The engine stays cyber-neutral: it moves people and
emits events; scenarios map them to intel.

### 10.5 Authoring

```jsonc
// on an NPC
"needsCompany": { "groups": ["accounts"], "avoids": ["marek"], "avoidRadius": 2 },
"maxQueue": 1,            // refuse to join a line with 1 or more ahead
"needsDeferMin": 4,       // how long a given-up need stays parked
"needs": { "rounds": { "decayPerMin": 20, "urgentAt": 40, "deferrable": false } }

// scenario level
"chatter": { "grumble": ["I'll come back later.", "Not now."] }
```

Everything is opt-in per NPC: `avoidRadius` defaults to 2 **only for NPCs that declare
`needsCompany.avoids`**; `maxQueue` unset means no limit; parking for `no_source` is on for every
needs NPC (it replaces a starvation spiral that has no visible upside), so it is the one change
that reaches existing scenarios, and the lab regression must check it.

### 10.6 Size, order, tests

About 220 lines (selector checks and the once-per-job re-check about 80, parking and wake on room
load/door open about 60, bubbles, face crop and badges about 50, validator and schema about 30).
Build after slice 11 (same functions in `npc-needs.js`).

Tests (node, stub world): avoided NPC at the object, in its queue and within the radius each make
the target unacceptable, both ways; radius 0 restores slice 8; the fallback picks the next source;
no source left parks the need with the reason; parked level holds, decay paused, no starvation;
timer expiry and a room-load event each retry, staggered; once-per-job hysteresis (an avoided NPC
arriving, leaving and arriving again turns the NPC back once); `deferrable: false` goes anyway and
shows the bubble; `maxQueue` balks; determinism (seeded, `Math.random` throwing); the sims-day log
byte-identical where nobody avoids anyone and nothing is parked. Showcase: Marek at the office
coffee, Sanjay turns back with the face bubble and a grumble, tries the kitchen, finds it shut,
parks with the closed-door badge, and goes when the player opens the kitchen; an objective on
`npc_turned_back:sanjay`. Live proof of each, then the leash and lab regressions; in the lab, check
the coffee timing of Chris and Melanie, since `no_source` parking reaches every needs NPC.

**Built: 2026-11-06 (slice 14: engine b7606efd0, bubbles efe347968, validator and schema e4408c2f9,
showcase 5e7dec2c7, fixes b546cb3c8, a6f5fbc1f, 3f5350d40). Regressions: `test_needs_leash` game 692
(pass), `lab_physical_pentest` game 693 (score 100); sims live proof games 689 to 691; see
`HANDOVER_OFFICE_S14.md`.** As written, with these choices made without asking (smallest option each
time): (1) after a turn-back the abandoned source is left out of that one fallback, so the parked
reason comes from the remaining sources (the showcase parks `no_source` with the closed door); (2) a
busy source (claimed, cooling down) still means wait, as before: only avoid, queue and nothing
reachable park, and a leash that leaves nothing permitted keeps the slice 2a/3b `blocked` behaviour
(no parking); (3) the radius belongs to the checking NPC: default 2 only when it declares `avoids`,
and an explicit `avoidRadius` opts in without `avoids`; the relation holds both ways; (4) hysteresis
is per need episode (first turn-back until the need is met), so the fallback or a retry never turns
back twice; the re-check runs each needs tick while committed and acts only on a change of who is
there; (5) a story need (`deferrable: false`) ignores the avoid and queue checks, takes the nearest
as before and shows the face bubble while someone avoided is there (`deferrable` is read from the NPC
record each time); (6) a parked need's level is `urgentAt + 1`, on release it is set to `urgentAt`
and selected at once, the unmet clock shifts by the time parked, and the wake is staggered by rank
(id order): 1 s, then 0.5 s per parked NPC (no per-NPC select offset existed); (7) a grumble emits
`npc_overheard` only (no `npc_chatted`, which would complete chat tasks) and rolls no chattiness; the
built-in pool is neutral, the kitchen line lives in the showcase `chatter.grumble`; (8) an NPC's own
`needsHome` object is exempt from the social check; (9) showcase: Marek `avoidRadius: 0` (keeps the
slice 10 queue beat), Sanjay `needsDeferMin` 2 and `maxQueue` 1, and the notice is a new `notes1`
object, auto-placed. Golden logs unchanged. Live proof found two bugs, both fixed: a `needs: {set}`
mapping on a parked need now unparks it first, and the plain thought bubble resets dimming with
optional calls. For the lab: staff who declare `needsCompany.avoids` (for example a guard avoided by
id) would turn back from a coffee he stands near, because `_avoidedAt` counts any NPC with a position.

## 11. Addition 2026-11-06: voiced chatter and scripted exchanges (slice 15)

**Requested by the user (2026-11-06):** chatter lines (slice 8 pools, slice 10 queue chat, slice 14
grumbles) should be voiceable by the TTS, and must be integrated with the TTS rules so the cache
tools do not treat their audio as unneeded. Add a few scripted interactions between particular
NPCs. Don't repeat spoken lines too often; a full exchange should be heard once. The user approved
this session making the server-side TTS change (normally the other session's area).

### 11.1 What exists (checked 2026-11-06)

- **Scenario barks are already voiceable.** The `/tts` endpoint accepts an NPC's text when
  `ScenarioBarkValidator.bark_texts(npc)` lists it: `eventMappings[].bark`,
  `eventMappings[].sendTimedMessage.message`, `timedMessages[].message`
  (`app/services/break_escape/scenario_bark_validator.rb`). `npc-barks.js` speaks a bark through a
  per-NPC `TTSManager` when the NPC has a voice. Slice 11's "Has anyone seen my badge?" is such a
  bark (`test_needs_sims` line ~365), so it is voiceable today.
- **The pruner is already safe for scenario strings.** `TtsExpectedLines` unions every string in the
  rendered `scenario.json.erb` (its source 4), so a clip for any scenario string is never an orphan.
  Batch generation (`TtsLineExtractor`) does not pre-generate barks; they are generated on first
  request and cached.
- **Not voiceable:** slice 8's chatter pools (NPC `chatter` lines, scenario-level `chatter` pools)
  and the engine's built-in pools. The endpoint refuses them because `bark_texts` does not read
  those fields; the built-in pools are not in any scenario file at all.
- **Ink:** `InkTextValidator` accepts a line spoken by an NPC in its own story, and a co-speaker's
  prefixed line is accepted only for that speaker (`spoken_as_npc_in_scenario?`). Ink has once-only
  sequences (`{!a|b}`) and visit counts.

### 11.2 Where lines live: by kind

| Kind | Where | Voiced | Repeats |
|---|---|---|---|
| **Bark** (one speaker, short, repeatable: greeting, grumble, cooler small talk, "anyone seen my badge") | scenario JSON on the NPC, beside its `eventMappings` barks: `"chatter": { "cooler": [...], "grumble": [...], "greet": [...] }` | yes, on first play (cached) | shuffle-bag per NPC and pool, seeded: no line again until the bag is empty; per-NPC cooldown (`chatterCooldownMin`, default 5 needs-clock minutes) |
| **Shared bark pool** (scenario level, any NPC) | scenario JSON `chatter` (exists) | yes, for every NPC with a voice (the validator accepts scenario-level pool lines for any voiced NPC in the scenario); keep pools small, since each line is one clip per voice | as above |
| **Scripted exchange** (two or more speakers, once, can carry story) | ink: a knot in one NPC's story, other speakers' lines prefixed with their name, e.g. `exchange_rosa_reorg` | yes, each line in its speaker's voice (existing co-speaker rule) | once per game; only with the player in earshot |
| **Picture chat** (nothing new left to say) | engine | no | unlimited: a speech bubble holding an icon (coffee, weather, `social`), the Sims' pictogram idea |

Engine built-in pools stop being spoken text: they become the picture-chat fallback, so nothing
spoken lives outside a scenario file.

### 11.3 Server change (this slice; approved)

- `ScenarioBarkValidator.bark_texts(npc)` also returns the NPC's `chatter` pool strings, and a new
  `ScenarioBarkValidator.validate_shared(scenario, text)` accepts scenario-level `chatter` lines for
  any NPC that has a voice. The controller (or wherever `validate` is called) tries both. About 25
  lines plus tests in the existing validator test.
- `TtsLineExtractor` (batch top-up) gains an opt-in that lists NPC chatter and shared pool lines
  under each voiced NPC, so a mission can pre-generate them (`tts:batch_generate` gets them; no
  change for missions without chatter).
- Ink exchange knots need no server change: they are ordinary ink lines, already extracted,
  validated and kept.
- Tests: the controller accepts an NPC chatter line for that NPC and refuses it for another; a
  shared-pool line is accepted for a voiced NPC and refused for a scenario without that pool; the
  pruner keeps a chatter clip (regression); the extractor lists chatter only when opted in.
- Docs: the tts-audio skill (`.claude/skills/tts-audio/SKILL.md`, "Which lines exist") and its
  rules get one paragraph: chatter lives in NPC or scenario `chatter` pools or in ink exchange
  knots, never in engine code; rule 2 (no printed variables) applies.
- The other session is told in the lab log's "Office-life slices" note.

### 11.4 Engine

- **Exchanges.** NPC config `"exchanges": [{ "with": "rosa" | "group:accounts", "knot":
  "exchange_rosa_reorg", "requireGlobal": "reorg_announced" }]`. When a compatible pair meets
  (slice 8 pairing or slice 10 queue chat) and the player is in earshot (slice 8 `overheard` rule:
  same room, lit, within range, clear line), the engine plays the first unplayed exchange for that
  pair: it runs the knot on a **separate** ink story instance for the NPC (never the player's
  conversation state), one line per bubble, each line spoken in its speaker's voice through the
  `TTSManager` of that speaker, speakers facing each other, the whole exchange held to the pair's
  overlap (extended by the length of the knot, capped). When it ends, global `heard_<knot>` is set
  (saved server-side, so once per game survives a reload) and `npc_exchange_heard:<knot>` fires.
  With no audience, the exchange stays unplayed; the pair falls back to a bark or picture chat.
- **Order of preference** when two NPCs chat: an unplayed exchange (with audience), then a bark from
  the bag (if off cooldown), then picture chat.
- **Audio.** Chatter and grumbles play only from the player's room (slice 3 hearing), quieter with
  distance, never two lines at once (a global speech lock, so exchanges and barks queue rather than
  overlap); the bubble is the subtitle. Muted when TTS is off: bubbles only.
- **Validator.** Every `exchanges[].knot` exists in that NPC's ink; every speaker named in the knot
  is an NPC in the scenario with a voice (warning if not voiced); chatter strings have no `{var}`
  (rule 2); warn when a scenario still relies on built-in pools (now picture-only).

### 11.5 Size, order, tests

About 260 lines: engine exchanges, bag and cooldown, speech lock and picture chat about 170;
server validator and extractor about 40; engine validator about 30; schema about 20. Build after
slice 14 (grumbles move from text-only to the voiced bag; same chatter code).

Tests (node): bag never repeats until empty and is identical for a seed; cooldown; exchange only
with the player in earshot, played once, `heard_<knot>` set, not replayed after a reload (global
true); no audience → stays unplayed; separate story instance leaves the NPC's conversation state
untouched; speech lock serialises two speakers; picture chat once nothing is left. Rails: the
validator and extractor tests above. Showcase (`test_needs_sims`): voices for the cast if not
already set; small `cooler` and `grumble` pools per NPC; two exchanges (Sanjay and Rosa about the
kitchen rota; Tom and Amara about the parcel), each with an objective on
`npc_exchange_heard:<knot>`. Live: hear an exchange once, stay for the next meeting and see a
bark, then picture chat; reload and confirm the exchange does not replay; on :3001 (keyless) the
audio requests return 503, so audio is proved by the requests made and accepted by the validator
in a Rails test, not by sound. Run the npc-dialog-review skill on the new knots. Then the leash
and lab regressions.

**Built: 2026-11-06 (slice 15: server c6288e3be; engine c4949a517; validator and schema d6dc1f5b1;
fixes 5222d2d3f, da3387e92; graph 33c55c3bb). Regressions: `test_needs_leash` game 698 (pass),
`lab_physical_pentest` 788 (score 100); sims live proof game 694; see `HANDOVER_OFFICE_S15.md`.**
As written, with these choices made without asking: (1) the extractor opt-in is the scenario flag
`ttsPregenerateChatter` (plus a `chatter:` keyword), and `keys` always include chatter so
`tts:wasted` never reports chatter clips as unrequested; (2) a bag is per NPC and topic over the pool
that NPC speaks (shared plus own lines), refills when empty without starting on the line just said,
and lives in memory only; (3) the cooldown (`chatterCooldownMin`, default 5) starts on a spoken line,
pictures never start or wait for it, and a grumble on cooldown or with the lock busy shows the
`avoid` picture; (4) the speech lock is global across rooms, bark and exchange turns wait for it, a
turn that waits past the overlap ends the chat as before, `npc-needs-chatter.js` keeps its own audio
queue because real clips can outrun the bubble, and a queued line older than 8 s is dropped; (5) an
exchange plays only if every line's speaker is one of the pair (a `group:` partner is matched by
`needsCompany.groups`), the audience is checked every turn so the player can walk up mid-meeting, a
meeting interrupted mid-exchange leaves it unplayed, and afterwards the same meeting carries on with
barks, then pictures; (6) exchange bubbles use `exchangeLineMs`, capped at 6 s; (7) picture icons come
from the existing set (coffee: caffeine, social, work; cooler: thirst, social, work; greet: social;
grumble: avoid), no new art; (8) distance volume sets the element volume (0.35 to 1) after play, which
Chrome may ignore with Web Audio routing, and cannot be heard on keyless `:3001`; (9) `playerHears`
now also needs the NPC's room lit (`roomLevel >= 0.5`), so slice 8's `npc_overheard` and slice 14
grumbles no longer fire in a dark room (no shipped scenario maps `npc_overheard`; checked with grep).
Live proof (game 694, keyless): one exchange of five lines heard once with a bubble per speaker, the
global and the `hear_rota_exchange` task set, the next meeting a bark then a picture (thirst icon),
after a reload only a bark; every `/tts` request (503) matched `window.npcChatterVoice.log` line for
line. The lab has no chatter pools or exchanges, so its barks are unchanged: its `/tts` requests in game 788 are identical to game 693's (game 709 lacked Hampshire's bark request, a replay timing race with the Examine popup; score 100 too).
Fix 28422d70a: the "empty bubble" beside chatter lines was the press-to-talk icon (`talk.png`, overlay depth, above the bubble) of the speaker or its partner when the player stood in range; `npc-world-bubbles.js` now hides it while a line shows and restores it after, on `postupdate` (live proof game 864, `s15/fix-*`).

## 12. Addition 2026-11-06: player levers, lock-screen habits, print and forget, desk phones, room tone, idle swivel (slices 16-21)

**Status: plan only, nothing built. Review complete: five rounds (`OFFICE_LIFE_PLAN_REVIEW_S12_R1.md` to
`_R5.md`; outcomes in sections 13, 13b, 13c, 13d and 13e). The user's decisions are in (2026-11-06):
every item in the approval table (12.8) is approved, the open questions (12.9) are answered, and three
answers changed the plan (magnets are dropped anywhere, the idle motion is mostly a chair roll, the new
art is one PixelLab sheet; section 13f). Building starts with slice 21.** The
user picked these on 2026-11-06, in this order:

1. **Lock-screen habits**, with "some visual or audio cue when lock screen is locked and unlocked so
   players can pick up on this".
2. **Print and forget**: printouts left on the copier tray, fetched late or never.
3. **Social magnets, directed by the player**: "Rather than a schedule (maybe later), the player should
   be directing the events through the existing systems, for example, could deliver a cake to attract
   everyone to the kitchen. How does something like introducing a cake relate to the needs system? Does
   the presence of the cake create the need?" Generalised here as **player levers**.
4. **Desk-phone calls**: half a conversation overheard, an NPC away from the desk misses the call.
5. **Room tone**: office ambience heard only in the player's room, with levels by room type.
6. **Idle swivel**: "just the swiveling without needing animations for now".

Later, not in this section: a defender "spot the risk" mode (12.11 notes what it can reuse). Not
chosen, so not built and not assumed: traits (slice 6), routines (slice 9), timetabled schedules
(slice 12, "maybe later"), a suspicion ladder, shoulder surfing, rumours. Line numbers were checked
again at 4e3b90bc8 (`core/rooms.js` moved by three lines in ba1a4fa51); function names are the stable
reference. New sounds and art are marked
**[approval]**.

### 12.1 What exists (checked 2026-11-06)

| Part | Where | What it gives this section |
|---|---|---|
| Lock decision | `workstation-state.js` `decideLocked` 65-74, `onLeft` 141-152, `onReturned` 154-164 | On `npc_left_post` the owner's stations lock or stay open: the object's `lockChance` (seeded `screen:<id>:<leaves>` roll) or `locksScreenOnLeave` (default true). Return always unlocks. `install` (86-91) passes only `d?.npcId` to `onLeft`, so the `expectedAwayMs` that `npc_left_post` has carried since slice 2 (`npc-needs.js` `_leavePost` 1300-1313) is never read. There is no timer: an open screen stays open until the owner is back. `workstation_owner_left` carries `screenLocked` (150) |
| When the lock happens | `npc-needs.js` `_startJob` 1254-1293, `_leavePost` 1300 | `npc_left_post` fires when the wind-up ends, while the NPC is still at its desk, so "locks it as they stand up" is already the moment the state changes |
| Indicator dots | `lighting.js` `INDICATOR_LOCKED`/`INDICATOR_OPEN` 106-107, `workstationIndicators` 115-124, the second record 615-626, `RESOLVE_MS` 97 | Steady blue (locked) or breathing warm white (away and open), from globals only. A change shows as a dot appearing or going within 250 ms, with no transition. No transient effect exists for one object |
| One-shot sounds | `npc-office-visuals.js` `useVolume` 37-41, `SoundLimiter` 44-51, `playAt` 194-213, `onUsed` 216-230 | `scene.sound.play` one-shots at effects × 0.4 × a fall-off to 0 at eight tiles × the hearing level. **One** limiter for every NPC sound (one per second, 209), so a lock click and a gulp would cancel each other |
| Hearing | `room-hearing.js` `hearingLevel` 9-15; `lighting.js` `hearing` 782 | Own room 1, a room joined by a door 0.4, else 0 |
| Sound registry | `sound-manager.js` `preloadSounds` 33-118, `initializeSounds` 125-162; validator `loaded_sounds` (`validate_npc_needs.rb` 442) | A fixed list in two places. A new file means two new lines there, and the validator reads the list, so a `useSound` naming an unloaded key is caught |
| Ambient loop | `sound-manager.js` `currentAmbient` 15, `playAmbient` 293-320, `fadeAmbientTo` 360-404; `core/rooms.js` `recalculateAmbientVolume` 3169-3208; `music/music-widget.js` 186-195 | **One** looping track. Its level uses `volumeSettings.music`, a constant 0.5 that nothing changes (`setCategoryVolume`, 447, has no caller); the player's SFX slider drives every Phaser sound, ambient included, and the Music slider drives only the playlist. A key change stops the old loop at once and fades the new one in over 400 ms (367-372). A room's `ambientSound` plays at `ambientVolume` in that room, 0.125 next door with the door open, 0.01 with it shut. The loop over `gameScenario.rooms` returns at the first room that is the player's **or** adjacent, so an adjacent ambient room listed earlier beats the player's own. The bootstrap keeps `type`, `ambientSound` and `ambientVolume` on every room (`game.rb` 820-821) |
| Existing sound files | `assets/sounds/` | `server_room_ventilation` (9.9 s loop), `chair_roll` 15.9 s, `phone_vibrate` 2.2 s, `page_turn` 0.6 s, `drawer_open` 1.2 s, `keypad_beep` 0.24 s, `card_scan` 0.3 s, `rfid_unlock` 1.7 s, `message_received` 1.9 s, `footsteps` 19.4 s, `drink_gulp`, `eat_snack`, the GASP UI and lock sets. No office room tone, typing, copier, kettle, coffee machine, desk-phone ring or screen-lock sound. `phone_vibrate` is the player's own phone (notifications category, `sound-manager.js` 87, 184), so it cannot stand in for anything else. Credits are a comment above each `load.audio` line (63, 72, 91). The tube's click is synthesised at run time with WebAudio and has no file (`lighting.js` `playStrikeClick`, 787) |
| Seated facing | `seating.js` `updateNeedsSeat` 1185-1222 (facing 1201-1213, `want = st.homeFacing` at 1203), `setChairFacing` 301-310, `snapFacing` 281-291; `core/rooms.js` 2546-2549 | A seated needs NPC on a swivel chair faces `homeFacing`, or the player while they talk. The chair turns with it (texture per facing). Only Tiled map chairs become swivels; a scenario-placed chair is a static seat (the lab's staff chairs, `lab_physical_pentest/scenario.json.erb` 1115-1121). All 108 atlases with seated frames have all eight `sit_*_frame_000` facings (counted in `assets/characters/*.json`). `needsStop` keeps a seated NPC down only for a job on its own `needsHome` object (1067) |
| Lighting availability | `lighting.js` `initLighting` 1429-1441 | No lighting system (so no dots or flashes) without a scenario `lighting` block, on the Canvas renderer, or when the player turned lighting off |
| Determinism in seating | `seating.js` `typingBob` 1095-1100; `fidgetOffset`/`fidgetChair` 897-929 | The typing bob is derived from the needs clock, so it is the same every run; the chair fidget uses `Math.random` (897, 911), cosmetic and outside the decision log |
| Printing | `npc-needs.js` `_completeJob` 1485-1531 (`onUse.revealOutput` at 1524), `_revealOutput` 1556-1570; adapter `revealOutput` 2511-2537 | Every completed job at the hooked object prints, carries included (the hook does not look at `job.need`), and `s.job.prints` is set at job start (1268). The first free slot by id is shown on the tray, with no owner. Anyone with an interest in its tag may carry it (`_carryCandidate` 1237-1252). A shown slot stays on the tray until carried, or a reload files it |
| Selector | `_select` 842-870 (the urgency test at 852), `_useCandidate` 872-932 | A need is acted on only at or below `urgentAt`, or starved. With the tick cache on (the live default), `_select` returns before any scan when nothing is urgent and the NPC has no interests (844, `_anyUrgent` 830-835). Candidates filter by `satisfies`, `_free` (claims against `capacity`, 783-786), leash, privacy and avoidance. An empty result with a give-up reason parks the need at `urgentAt + 1` (857-858, `_park` 1023-1028) |
| Job phases | `_advanceJob` 1446-1483 | Every use walks to the target's approach cell; `using` starts on arrival and ends after `useSeconds` (a 0 s use completes on the next tick). `_recheck` (1066-1078) returns at once for an NPC with no avoidance radius |
| Presence makes options | `NPC_NEEDS_SYSTEM.md` 3.1 (interests) | An interest has no level; an item's presence makes an option. The same rule answers the cake question (12.4) |
| Hidden objects | adapter `listObjects` 2238-2252 | Skips only objects with neither a tag nor an affordance. A hidden `revealOnGlobal` object with an affordance **is** a use target today (no shipped scenario has one: a scan of every `scenario.json.erb` found none) |
| Carrying kit to a spot | `interactions.js` 797-846 (`triggerOnInteract`, `requiresItem`, `consumesItem`); `apply-actions.js` `set_global` 81-90, `emit_event` 114 | "Deploy the item you carried here": the player clicks an object while holding a named item; the actions fire and the item leaves the inventory, server copy included. The lab's keylogger uses it |
| Player drop | `item-drop.js` `persistDrop` 41-75; `game.rb` `add_item_to_room!` 427-444 | A dropped `droppable` item is saved as a room object built from the server's **held copy**, so every scenario field (an `affordance` too) survives, at the drop point |
| Reveal | `core/rooms.js` `hideUntilReveal` 2970, `hideRevealedObject` 2986, `showRevealedObject` 2999 | One global shows a declared object, saved through the global; the engine can hide it again by a direct call |
| Turning back, parking | `_recheck` 1066-1078, `_turnBack` 1080-1097, `_grumble` 1103-1121, `_park` 1023 | Reasons `avoid` and `queue`; a grumble is one spoken bark from a pool; parking holds a need when nothing is acceptable |
| Spoken lines | `_pickBark` 1147, `_speak` 1163, speech lock `_speechFree` 1138; `_findExchange` 1189-1207; `npc-needs-chatter.js` `exchangeLines` 150-166, `say` 214; `scenario_bark_validator.rb` `bark_texts` 33, `validate_shared` 56 | A shuffle bag per NPC and topic, one global speech lock, ink knots run on a separate story. The server accepts NPC and scenario-level `chatter` lines for TTS, so a new pool needs no server change. `_pickBark` speaks only with lines, off the 5-minute cooldown and with the lock free, else returns a picture (default `social`). `preload` (144-148) loads stories only for NPCs with `exchanges`; `splitPrefix` (30-34) reads "Look: it's Tuesday" as a speaker prefix |
| Mapping actions | `npc-manager.js` `emitEvent` 842, `needs` 855 and 1165; `npc-needs.js` `control` 421-451 | A mapping can emit any event, and pass a command to the needs system. Timed messages (`npc-manager.js` 1711-1737) deliver texts and knots and emit no arbitrary event |
| Desk-phone preset | `office-presets.json` `desk_phone`; schema `officeType` enum 5043, `officePresets` 147 | Exists (use 0 s, capacity 1), reached only through `officeType` and only with `officePresets: true`. No ring, no owner field, no call |
| Small art | `assets/objects/`, `assets/icons/` | `phone1`-`phone5` handsets 20×17, `pizza_boxes1` 23×22, `kettle1`, `photocopier1` 35×46, the 16×16 `npc-*` icon set (section 9), `padlock_32` (32×32, too big for the action slot). No cake, no desk-phone body |

### 12.2 Lock-screen habits and cues (slice 16)

**Built: 2026-11-06 (slice 16: engine, validator, schema and tests aebba3ab5; showcase a3cd35e6d, ea3ec20a2; fix from live proof f84c777de).
Regressions: `test_needs_leash` game 914 (pass), `lab_physical_pentest` game 915 (score 100); sims live proof games 904, 906 and 912; see
`HANDOVER_OFFICE_S16.md`.** As written (`habitOf`, `decideLocked` with the habit, `autoLockMs`, `tick` and the idle map in
`workstation-state.js`; `afterTick` in `npc-needs.js`; `flash` in `lighting.js`; the cue layer in `npc-office-visuals.js`; the
validator's `check_lock_habits`; `bin/test-js` 402 files pass, `bin/rails test` 953 runs, 0 failures, 1 skip), with these choices made
without asking: (1) `lockIfAwayOverSeconds` counts a trip of exactly the threshold as short (`expectedAwayMs <= threshold` stays open);
Amara's 20 s splits as hoped (office coffee 15.4 to 15.7 s open, kitchen 21.8 s and a queue place 27.7 s locked). (2) `sanjay_pc`
`autoLockSeconds` is 20, not 30: his live trips take 19 to 27 s, so 30 s rarely showed the beat. (3) A late decision (`how: "late"`) fires
the event only when it locks and does not republish the globals (unchanged behaviour); an auto-lock already due at discovery counts for a
late station. (4) While a minigame is open on the object the idle clock restarts every tick, rather than pausing, so the screen locks
`autoLockSeconds` after the minigame closes; f84c777de made the hold match a minigame whose params name the object by string `itemId` or
`objectId` (the examine view a PC click opens), which the first version missed. (5) The glyph (no lighting) shows the first state for
300 ms, then the end state until 1 s (lock: open then closed; return: closed then open), on the action icons' dark backing, 2 px above the
object's top centre, depth 5000, with text stand-ins `L` and `U` until the icons load; both icons are preloaded on install when there is no
lighting system. (6) Chimes are two 0.22 s sine notes 110 ms apart (A5 and D5), at half a use sound's level (`CHIME_SCALE` 0.5), with the
use sounds' eight-tile fall-off, own room only, on their own limiter channel `chime`; leave and return only, never the auto-lock. (7) The
flash is drawn in the room's pass (hidden with its room off screen) at depth `LIGHT_DEPTH + 2`, with the indicators' hue-keep stamp in a
lit room; its clock starts on its first draw. (8) `npc_caught_at_post` still uses the object-param-only minigame test; only the
workstation hold uses `minigameOnObject` (worth aligning later, not in scope). **The lab:** `lockCues` defaults on, so
`lab_physical_pentest` now shows the lock flash and chime on Chris's PC and the wake flash on his return (12.10); its lock decisions are
untouched (object `locksScreenOnLeave` and no `autoLockSeconds`). The lab session should confirm that or set `"lockCues": false`.

**Design.** Two things change on a workstation, and they belong to different owners.

- **The person's habit** goes on the NPC: `screenHabit: { lockChance, lockIfAwayOverSeconds }`.
  `lockChance` (0-1) is the chance they lock on a leave; `lockIfAwayOverSeconds` means they lock only
  when they expect to be gone longer than that (a dash to the copier stays open, a kitchen run
  locks). The second reads `expectedAwayMs` from `npc_left_post`, so `install` passes the whole
  payload to `onLeft`. When both are set, a short trip stays open and a long one rolls `lockChance`.
  The habit's roll has its own salt, `habit:<objectId>:<leaves>`, distinct from the object's
  `screen:<id>:<leaves>`, so adding a habit never shifts another roll. `lockIfAwayOverSeconds` alone
  means a long trip always locks (an implied `lockChance` of 1). When `expectedAwayMs` is null (no
  approach cell, `npc-needs.js` 1363-1371) the trip counts as long. A station found after its owner
  left takes its state in `onInteract` (`workstation-state.js` 173-174): it decides through the habit
  too, with the `expectedAwayMs` stored at the leave, and its idle clock counts from the leave, not
  from the discovery.
- **The machine's policy** goes on the object: `autoLockSeconds`. Real auto-lock is idle-based, so
  the clock starts when the owner leaves, **restarts on `workstation_accessed`**, and holds while a
  minigame is open on the object (the same check `npc_caught_at_post` uses for `inMinigame`). The
  screen never locks under a player who is using it. The timer runs on the needs clock, so it pauses
  while a VM is open, as every other absence does.
- **Precedence.** An object's own `lockChance` or `locksScreenOnLeave` still wins, so no shipped
  scenario changes. `workstation: true` alone defers to the owner's habit. With neither, the default
  stays "locks" (`decideLocked` 73). A scenario that wants a habit on a station that has a lock field
  removes the field.
- **Unlock** stays as it is: on `npc_returned_post`, when the owner reaches its home cell, just
  before it sits (`onReturned` 159-161, `npc-needs.js` 694-701).

Workstation-state gains one event, `workstation_screen_changed:<objectId>`
`{ objectId, ownerId, locked, how: "leave" | "auto" | "return" }`, fired on every change of the
locked state (so a return to a screen that was left open fires nothing). A station first seen after
its owner left takes its state in `onInteract` as the player clicks (173-174); that decision fires the
event with `how: "late"`, which the visuals ignore, so no flash or chime plays as if the owner had just
locked it. The existing
`workstation_owner_left` and `workstation_owner_returned` keep their payloads.

**The cue.** Three layers, so colour is never the only signal, and one of them works without
lighting.

1. **Indicator transition** (no new art). `lighting.js` gains `flash(objectId, kind, ms)`. The glow
   texture is a soft radial blob scaled once per variant change (`lighting.js` 657), so the flash is a
   **shrinking glow**, not a ring: `lock`, a blue glow that starts at radius 18 and shrinks to the
   steady 10 px dot over 500 ms (per-frame `setScale`, as the ransom glow does at 1117); `unlock`, a
   warm-white glow at radius 16 that fades over 500 ms. Flashes live in a side map keyed by object
   id and are drawn after the emitters, because `buildEmitters` discards every record when a room's
   texture signature changes (604-631). One flash per change (WCAG 2.3.1); under reduced motion a
   single 300 ms step at the end size. The wake flash shows only when the screen was locked.
2. **A glyph that needs no lighting.** When `window.lightingSystem` is null (no `lighting` block,
   the Canvas renderer, or lighting turned off by the player, `initLighting` 1429-1441), the same
   change shows for one second as a small closed or open padlock above the screen, drawn by
   `npc-office-visuals.js` in the action-icon layer's style (backing, text stand-in until art
   exists, `npc-action-icons.js` 190-199). A 16×16 `npc-lock` icon (closed and open) is
   **[approval]**, in the OQ42 batch. With lighting on, the glyph is not drawn.
3. **Sound**, from the player's room only: a lock chime and an unlock chime, **synthesised at run
   time** with WebAudio as the tube's click is (`lighting.js` `playStrikeClick`, 787), so there is no
   file and no licence, though they are still sounds for the user to approve **[approval]**. They go
   through `playAt`-style gating with a new `ownRoomOnly` option, which requires a known room equal
   to the player's (`hearingLevel` returns 1 for a missing room id, `room-hearing.js` 12, so it does
   not trust the hearing level alone), and a separate limiter channel per kind of sound, so a chime
   and a gulp never cancel each other. `keypad_beep` and `card_scan` mean keypads and badge readers in
   the missions, and the UI clicks are the player's own feedback (OQ17), so none stands in. Until
   the user approves them the chimes are not played, but each attempt is logged in the visuals'
   `playLog` with its volume and `reason: "unapproved"`, so the gating can be proved silent; a short
   recorded sample of each goes on the approval page (12.8), since a chime cannot be approved from a
   description.
4. **Auto-lock** gets the flash or glyph and no sound: nobody pressed a key.

`npc-office-visuals.js` listens for `workstation_screen_changed:*`, shows the cue, and emits
`workstation_lock_heard:<objectId>` `{ ownerId, locked, how, volume }` when the chime was heard (the
pattern of `npc_use_heard`). The cue has its own scenario switch, `"lockCues": false` (default on),
because `"officeVisuals": false` also hides carried items and use sounds (`npc-office-visuals.js`
17-19, 235). The module therefore installs when either switch is on (today `installNpcOfficeVisuals`
returns null when `officeVisuals` is false, 233-235), and each layer checks its own switch. Whether the
lab keeps the cue on is the lab session's decision, asked before this slice lands (12.10).

**Authoring.**

```jsonc
// on the NPC: the person's habit
{ "id": "amara", "needsHome": "amara_pc", "screenHabit": { "lockIfAwayOverSeconds": 20 } }
{ "id": "sanjay", "needsHome": "sanjay_pc", "screenHabit": { "lockChance": 0 } }
// on the workstation: the machine's policy
{ "id": "sanjay_pc", "type": "pc", "workstation": true, "autoLockSeconds": 30 }
// scenario level, to turn the cue off
"lockCues": false
```

**Engine.** `workstation-state.js` about 65 lines (habit lookup through `env.npcs()`, the payload
pass-through, an idle clock per station that restarts on access and holds under a minigame,
`tick(nowMs)`, the new event). `npc-needs.js` about 5: `tick()` calls
`this.world.afterTick?.(clockMs)` and the live adapter calls `window.workstationState?.tick` from it,
so neither module imports the other. `lighting.js` about 35 (`flash`, the side map, expiry, reduced
motion). `npc-office-visuals.js` about 60 (the listener, the no-lighting glyph, the run-time chimes
and their log, `ownRoomOnly`, limiter channels, installing under either switch). Validator about 25: `screenHabit` bounds; a `screenHabit` on an NPC
that owns no workstation (warning: nothing to lock), or whose stations all carry a lock field
(warning: the object wins); `autoLockSeconds` on a non-workstation (warning), or on one with
`locksScreenOnLeave: true` and no habit that leaves it open (warning: never applies). Schema about 15
(`screenHabit`, `autoLockSeconds`, `lockCues`). **About 205 lines (65 + 5 + 35 + 60 + 25 + 15), M.**

**Save and reload.** Nothing new is saved. The away clocks reset with the needs state, and the
install-time reset of `_owner_away`/`_screen_locked` (`resetGlobals` 97-116) is unchanged.

**What the player sees and hears.** From across a lit office, Amara stands to fetch a printout and
her PC shows the breathing white dot; later she heads for the kitchen and a blue glow shrinks to a dot
on her screen with a soft chime. Sanjay never locks, and 30 seconds after he leaves his white dot
turns blue on its own, unless the player is on his PC, in which case it waits. When a locked screen's
owner comes back, a white flash wakes it. With lighting off, a padlock glyph shows each change over
the screen for a second.

**Showcase.** `test_needs_sims`: Amara gets `screenHabit.lockIfAwayOverSeconds: 20` (`amara_pc` keeps
`workstation: true` with no lock field, so the habit applies; today it locks on every leave, a
deliberate change the README notes). Her printout fetch and a coffee at the office machine estimate
under 20 s and stay open; a place in the coffee queue, or the deadline memo's kitchen run, goes over
and locks. The build checks the threshold against the logged `expectedAwayMs` values and moves it if
the split does not show. Sanjay gets `screenHabit.lockChance: 0`; `sanjay_pc` gets
`autoLockSeconds: 30`. Tom's object-level `lockChance: 0.5` stays, showing that the object wins.
Objectives: "Hear a screen lock as its owner walks off" on `workstation_lock_heard:amara_pc` (once
the chimes are approved; until then on `workstation_screen_changed:amara_pc` with `how === "leave"`),
"Watch a screen lock itself" on `workstation_screen_changed:sanjay_pc` with `how === "auto"`, and
"Use Sanjay's screen while he is away" on `workstation_accessed:sanjay_pc` (not a race: using it
restarts the idle clock).

**Tests.** Node, `workstation-state.test.mjs`: precedence (object `lockChance` over habit, habit
over default, `workstation: true` alone defers); `lockIfAwayOverSeconds` against `expectedAwayMs`
on both sides of the threshold; the habit roll uses its own salt and an existing `screen:` sequence is
unchanged when a habit is added; auto-lock fires once after `autoLockSeconds` of idle needs-clock
time, restarts on access, holds under an open minigame, and not after a return; `how` on each event;
no event on a return to an open screen; a late decision fires `how: "late"` and no cue; a null
`expectedAwayMs` counts as long; a station found
after the leave uses the habit with the stored estimate and an idle clock from the leave; the reload
reset unchanged. `lighting-workstation-
indicators.test.mjs`: a flash appears in the side map, expires, survives an emitter rebuild, and leaves
the base and indicator records as they were; reduced motion gives one step. Office visuals:
`ownRoomOnly` gives 0 through a door and for a missing room id; two channels in the same second both
play; with no lighting system the glyph shows and with one it does not; `lockCues: false` shows
nothing; with `officeVisuals: false` and `lockCues` on the cue still shows; an unapproved chime is
logged with `reason: "unapproved"` and not played. Live: a strip of Amara's PC (white dot, lock flash, blue dot, wake flash) lit and dark; one
strip with lighting turned off (glyph); the play log from inside the office and from the kitchen
doorway (heard, then 0); the lab regression.

**Risks.** A 500 ms flash at game zoom may be missed: the screenshots decide, and the fallback is a
bigger glow. `expectedAwayMs` is a lower bound (`NPC_NEEDS_SYSTEM.md` 7), so a trip just over the
threshold can stay open; it is still seeded, so a day replays the same. In the lab, Chris locks on
every leave (object field), so his chime would play on every coffee run; the lab session decides
whether to keep `lockCues` on.

**Per-NPC credentials and desktops (the user's note on OQ28, checked 2026-11-06; not part of slice 16).**
The user asked whether each NPC could have its own credentials and desktop, reusing the remote desktop
the SE lab gives for a phished foothold. That desktop is not a minigame of its own. It is a declared
grant: the timer `grant_remote_session` (`lab_social_engineering/scenario.json.erb` 170-234) starts on
`phish_lord_foothold` and runs `give_item` with a `pc`-type item that has `hasContents`; the server
stores the scenario's copy and serves its contents, and the unlock of a nested password-locked archive
whose `requires` is her password, while the player holds it (`DECLARED_GRANTS_PLAN.md`); the container
minigame shows it as a desktop because of the type (`container-minigame.js` 23-24, 114-123).
- **Reuse for an open screen is free.** `workstation-state.js` 179 already sets `<objId>_accessed` when
  the player sits at an open screen with the owner away, so a timer with `startOnGlobal:
  "<objId>_accessed"` can grant "Melanie's session" with her files. Data only, no engine lines.
- **Per-NPC credentials fit the same item**: a file in the session can hold a login, and a locked
  archive inside it can take that NPC's password as `requires`, exactly as Sofia's archive does.
- **Logging in at a locked screen needs engine work.** The object's own `locked`/`requires` lock cannot
  model it: the server validates that lock and keeps it open for good, while a screen locks and unlocks
  with every trip. It would need a `screenPassword` on the workstation, the existing password minigame
  opened from `workstation_locked_attempt`, and on success the same `<objId>_accessed` write. Two gaps
  remain: there is no `remove_item` action (`apply-actions.js`), so a sat-down session stays in the
  inventory after the owner returns (right for a remote foothold, wrong for a borrowed chair), and a
  declared grant can be claimed at any time (`DECLARED_GRANTS_PLAN.md` 3.2), so the password check at
  the screen would be client side, like the drop and timer gates today.
- **Where it goes:** a separate follow-on slice, **16b, per-NPC sessions** (about 70 lines: the screen
  password through the password minigame 30, ending a sat-down session when the owner returns 25,
  validator 15), not scheduled until the user picks it. Slice 16 keeps its size. Its README may show the
  data-only open-screen grant as an authoring example, since that costs no engine lines.

### 12.3 Print and forget (slice 17)

**Built: 2026-11-06 (slice 17: engine, validator, schema and tests 351fb11fe; showcase 6e253b502; fix from the live proof da3a984db).
Live proof games 923 and 924; leash game 925 (pass); lab game 926 (score 100, 9/9 tasks; keylogger creds 64.5 s and USB foothold 10.1 s, against 64.2 s and 10.1 s in game 920).** As written, with these choices made without
asking: (1) the engine's own map of owned prints (`_prints`) is what reserves a slot, so the stubs need no change; the adapter's
`_printedBy` stamp is set or cleared on every reveal and cleared on stow, as specified, but nothing reads it; (2) after an errand
the owner goes home with a plain `_goHome(s)`, not `{ stayPut: true }`: standing on its home cell it arrives on the next tick
anyway (live: `npc_returned_post` 250 ms after the placing), and a placing a few pixels off walks home instead of sitting down off
the cell; (3) `useCount` counts at job start, so an aborted use still moves the roll on; (4) `print_no_slot` is logged beside the
existing `revealed` `no_free_slot` line, and only where the world has `freeSlotOf` (the full-pool check ran); (5) the errand's
target needs no `_free` check (the owner's own, usually private, post); (6) an errand that times out before the pickup keeps its
reservation and may run again after the item's fail cooldown; one that picked the slot up, or found it gone, ends it; (7) a
forgotten print the player takes is dropped without an event (`npc_print_gone` is for prints the owner meant to fetch), and an
errand under way is never "uncollected"; (8) the roll salts are `print_forget:<n>` and `print_due:<n>` on the owner's id and
per-owner print count; (9) the Print Queue note has no `position`, like the other notes, and lands on the desk south of the
copier; (10) the live proof found `playerAtPost` missing the examine view's string `itemId` (slice 16 had fixed the same gap in
`workstation-state.js`), so the caught payload said `inMinigame: false` with the view open; fixed in da3a984db; (11) 12.8 says
`npc-needs-slots.test.mjs` is not to change, but one of its validator assertions pins the showcase pool at 3 slots, which the
plan's slots d and e make 5; only that line changed, and `GOLDEN_SIMS_DAY` is the same digest.

**Design.** Today a printout belongs to nobody: whoever has an interest in `printout` carries it off
(`_carryCandidate` 1237-1252), and every finished job at the hooked object prints (1524). Print and
forget gives a printout an owner and the owner a habit.

- **The printer owns the printout, when ownership applies.** `revealOutput` stamps the slot with the
  NPC that printed it (client only, `_printedBy`) **only when that NPC has a `printHabit` or the print
  comes from a `print` command**, and **every reveal sets or clears it**: slot sprites persist and are
  reused (adapter `revealOutput` 2511-2535), so a slot Tom once owned, filed and later revealed for one of
  Sanjay's prints must come back unowned. Every other print stays unowned, as today, so Sanjay's prints are
  still free for Amara's interest. Nothing is saved: a reload files every shown slot already (stow on
  sight, 3.3a), and the reservations go with it.
- **Only a need use prints.** The `revealOutput` hook fires only for a job with a need that carried
  nothing (`job.need && !job.carrying`). Today it also fires when an item is delivered to the
  hooked object, so a fetched printout put on the owner's PC would print again and errands would
  chain. `setGlobal` and `emitEvent` hooks keep today's behaviour (any finished job), documented as
  such, so no mapping that relies on a delivery changes. The showcase's `sanjay_pc` accepts nothing,
  so Sanjay's beat is unchanged.
- **Not every use prints.** The hook gains `chance` (0-1, default 1). It is rolled **at job start**,
  `roll(npcId, 'print:' + useCount)` where `useCount` counts need uses of that object only, stored on
  the job, and `s.job.prints` (the printing action icon, 1268) is set from that roll, so the icon
  never promises a print the job will not make.
- **The habit** is an NPC field, `printHabit: { fetchAfterSeconds: [min, max], forgetChance,
  weight }`. At the print, two seeded rolls on `<ownerId>:<printCount>` (a per-owner count of owned
  prints, not the slot id, so a recycled or re-used slot does not repeat its fate): forget (`forgetChance`, default 0),
  else a due time inside `fetchAfterSeconds` (default `[20, 60]`).
- **The fetch errand.** From the due time the owner has a carry option for that slot only, scored
  `weight` (default 2) like an interest, so an urgent coffee can still win. It runs only from idle
  or returning (the selector's usual rule; no preemption). The target is the owner's `needsHome`
  object without an `accepts` check, as section 2.2 Part B planned for carries to a named person,
  and the outcome is `place`, then filed after `placeSeconds` (Part A). A leashed owner who cannot
  reach the copier is skipped by the usual back-off. On arrival the errand **completes without entering
  `using`**: entering it for one tick would give seating the post stop (`seating.js` 1073-1075) and could
  start a chair fetch, and would fire slice 20's `npc_use_started` for a use that never happens. For the
  same reason `_expectedAwayMs` leaves out the target's `useSeconds` (1376-1377) when `job.errand`
  holds, so the lock habit (12.2) does not judge an errand 10 s too long.
- **The way back is the return.** A carry to the NPC's own `needsHome` is not `_atOwnPost` (that
  needs a `use`, `npc-needs.js` 1295-1298), so today the owner stays in `job` mode on the way back,
  goes into `using` on its own PC for the PC's `useSeconds` (10 s from `desk_pc`, seated), and only
  then turns to `returning` (1526-1529), the only mode in which `_checkCaught` runs (691) and in which
  `npc_returned_post` fires. With the lever, the player is often still in Tom's minigame when he walks
  back. So **for the print errand only** the last leg counts as the return. The errand job carries
  `job.errand`, set when it starts, and only that flag changes anything: the NPC stays in `job` mode on
  the leg (switching it to `returning` would let `_tickNpc` select a new job for an idle-or-returning
  NPC, 717-724, with the printout still in hand); `_advanceJob` calls `_checkCaught` only while
  **`job.errand && job.carrying && !s.atPost && !s.caughtEmitted`**. `_checkCaught` itself has no
  once-per-return guard (1393-1404; the guard sits at today's call site, 691), and the errand holds
  `job.errand` from its start, so without these conditions it would emit `npc_caught_at_post` four
  times a second, and fire on the outbound leg when the copier is in the home room (as the showcase's
  is), before the owner had been away at all; on arrival the slot is placed (an errand always carries a
  slot) with no PC dwell; then `_goHome({ stayPut })` gives the `returning` arrival on the next tick, so
  `npc_returned_post` (and with it the unlock and the wake flash, 12.2) fires before the next `work`
  use. Every other carry to an own `needsHome` keeps today's path and timing: Amara's parcel and printout
  deliveries to `amara_pc` (the sims-day golden, `GOLDEN_SIMS_DAY`, `test/js/npc-needs-slots.test.mjs`
  21, is unchanged) and the lab's footholds, which are Sofia's carries of the dropped devices to her own
  `usb_target_pc` with its authored 6 s plug-in (`lab_physical_pentest/scenario.json.erb` 732, 987) and
  the barks, captures and task mapped on `npc_used:usb_target_pc`. If a shorter dwell is ever wanted for
  those, it is an opt-in on the target (`affordance.deliverSeconds`), not a rule.
- **The early return in `_select`.** `_select` returns before any scan when nothing is urgent and
  the NPC has no interests (844). Tom, the showcase's printer, has no interests, so with the tick
  cache on (the live default) a due errand would never be seen. The guard also checks "no due print
  errand" (and, with slice 18b, "no known magnet in the tempt band"). Node tests run with the tick
  cache on and off.
- **Reserved.** While a slot has an owner, other NPCs' interests do not see it. `pickable` stays as it
  is (`describe` has no viewer, 2117, and `_advanceJob` reads it for the owner's own fetch, 1455, so a
  reserved slot marked unpickable would abort the errand with `item_gone`); the reservation is a filter
  in `_carryCandidate` (1239: skip `o.printedBy && o.printedBy !== s.npcId`) and in the errand
  candidate. A forgotten slot stays reserved, so it lies on the tray until a reload
  or until the player deals with it; `printHabit.shareAfterSeconds` (unset by default) hands it to
  the interest NPCs after that long, for a scenario that wants a tidy colleague.
- **Uncollected.** A reserved slot still on the tray after `uncollectedAfterSeconds` (on the
  producer's affordance, default 60) emits `npc_print_uncollected:<ownerId>`
  `{ ownerId, slotId, producerId, ageMs, forgotten }` once. Per owner, because mapping patterns
  match exactly.
- **A full pool.** Slots are taken by id (adapter `revealOutput` 2511-2535). When **any** print, owned or
  not, finds no free slot, it **recycles the oldest forgotten reserved slot of that producer**, taking
  read-in-place slots before takeable ones (oldest first within each), so the player's one takeable
  forgotten printout (`copier_out_a`, first by id) is the last to go: that slot is filed
  (stowed, as a reload would), logged `recycled`, and the new print takes it, with its owner and errand.
  With no forgotten slot to recycle, the print falls back to today's cosmetic copy (no owner, no errand,
  no timer) and logs `print_no_slot`. The printing icon is decided at job start (12.3, `chance`), so the
  start also checks that a slot is free or recyclable, and shows no printing icon when neither holds;
  otherwise the icon would promise a fetch that never comes. Without this, forgotten prints would fill
  the pool, the print-job lever would make only cosmetic copies, and Tom would never get up again.
- **Taken first.** If the player took or read away the slot before the owner set off, the owner
  emits `npc_print_gone:<ownerId>` `{ slotId, playerNearby, playerDistance }` at the due time (the
  counterpart of `npc_left_item_gone`); taken on the way there is today's
  `npc_job_failed` `item_gone` (1455).
- **The player's lever: send a print job.** A mapping `needs: { "print": "<producerId>" }` on an NPC
  prints as that NPC, with its habit; `{ "print": { "producer": "...", "fetchAfterSeconds": [5, 10],
  "forget": false } }` overrides the habit, which is what a lever wants, and `"forget": true` makes a
  print nobody fetches. The usual trigger is the player at an open PC: `workstation_accessed:tom_pc`.
  When Tom comes back, he gets up again for the copier: a second window opened by the player.
  `control` (421-451) gains the `print` command.

What makes a printout confidential is scenario text on the slot (constraint 1.2.5); the engine knows
only owner, timing and tray.

**Authoring.**

```jsonc
// on the NPC
"onUse": { "tom_pc": { "revealOutput": "office_copier", "chance": 0.4 } },
"printHabit": { "fetchAfterSeconds": [30, 120], "forgetChance": 0.5 },
// on the producer
{ "id": "office_copier", "type": "photocopier1", "affordance": { "uncollectedAfterSeconds": 60 } },
// the lever, on the same NPC
{ "eventPattern": "workstation_accessed:tom_pc", "cooldown": 60000,
  "needs": { "print": { "producer": "office_copier", "fetchAfterSeconds": [5, 10], "forget": false } } }
```

**Engine.** `npc-needs.js` about 133 lines (the need-use rule for `revealOutput`, the start-time
`chance` roll and the icon from it, owner stamp and habit rolls, the errand candidate and the wider
early-return guard in `_select`, the reservation in the carry filter, the uncollected and gone timers
on the existing `_placed`-style map, the `print` command, the `job.errand` return leg about 15, the
full-pool recycling for any print and the start-time slot check about 15, the caught guard, the
no-`using` arrival, the estimate without dwell, the conditional stamp and the `<ownerId>:<printCount>`
rolls about 15, read-in-place slots recycled first and `npc_print_fetched` about 8). Adapter about 12
(`printedBy` set or cleared on every reveal, stowing a recycled slot). Validator about 35: `chance`, `fetchAfterSeconds` and `forgetChance`
bounds; `printHabit` on an NPC with no `revealOutput` hook and no mapping `print` command (warning);
an owner with no `needsHome` object (error: the errand has nowhere to go); an owner whose home room and
the producer's room are not joined by rooms it may enter (warning); per producer, the number of slots
against the number of printing NPCs (info: forgotten prints hold slots until a reload, and an empty
pool prints only cosmetic copies). Schema about 20 (`printHabit`, `onUse.*.chance`,
`affordance.uncollectedAfterSeconds`, the `needs.print` command). **About 200 lines (133 + 12 + 35 +
20), M.**

**What the player sees.** A printout appears on the tray. Nobody comes. A minute later its owner
walks over with the printout icon, carries it back in hand and puts it on the desk; or never comes,
and it is still there when the player passes. Access Tom's open screen and, when he is back, he
gets up for the copier.

**Showcase.** `test_needs_sims`: Tom prints (`chance: 0.4`) with `printHabit: { fetchAfterSeconds:
[30, 120], forgetChance: 0.5 }`. Tom's work use comes about every 7.5 minutes, so left to chance the
"uncollected" beat could take most of an hour: a second lever, reading a note in the office (a mapping
on `object_interacted` with `needs: { print: { producer: "office_copier", forget: true } }`), prints
as Tom at once and is never fetched; it has a 60 s `cooldown`, not `onceOnly`, because `onceOnly`
is saved to the server (`npc-manager.js` 1004-1009) while a reload files the forgotten print, so a
reload would lose the quick beat for good. Recycling keeps repeated reads from exhausting the pool. Two
more non-takeable slots that read in place (`copier_out_d`, `copier_out_e`, neutral text: Tom's holiday
request) widen the pool. Slots are filled by id, so Tom's first forgotten print takes `copier_out_a`,
the one takeable slot, which then waits on the tray for the player; `b` to `e` read in place. The extra
slots do not by themselves protect Sanjay's beat; recycling does, because any print, Sanjay's unowned
ones included, recycles the oldest forgotten slot. Sanjay has no `printHabit`, so his prints stay unowned and Amara still delivers them
(`see_printout` unchanged). The showcase copier sets `uncollectedAfterSeconds: 150`, above Tom's
`fetchAfterSeconds` range of 30 to 120, so the uncollected objective marks a print that is really
forgotten (the payload's `forgotten` flag says so in any case). Objectives: "A printout sits uncollected on the copier" on
`npc_print_uncollected:tom`; "Send a print job from Tom's open screen and watch him fetch it" on a new
event, `npc_print_fetched:<ownerId>` `{ slotId, viaCommand }`, emitted when a print errand completes,
with `data.viaCommand === true`, so a natural habit fetch does not complete it. The errand's completion
also emits `npc_used:tom_pc`, and the showcase's two unconditioned mappings on that event
(`test_needs_sims/scenario.json.erb` 345-346, `last_activity` and "Someone works at a desk") gain
`data.need === "work"`. `workstation_accessed` fires only while Tom is away (`workstation-state.js`
170-182) and the lever's due time is 5-10 s, so the errand usually starts while Tom is walking back:
the README says he comes back by way of the copier, not that he gets up again.

**Tests.** Node (sims fixture), each with the tick cache on and off: `chance` gives the expected share
over 200 need uses and repeats for a seed; the icon matches the roll; a delivery to the hooked object
prints nothing; a forgotten print never gets an errand; the errand starts only after its due time and
only from idle, for an owner with no interests; Amara's interest skips a reserved slot and takes an
unowned one; `shareAfterSeconds` releases it; `npc_print_uncollected` once; taken before the due time
gives `npc_print_gone` and no walk; the `print` command with `forget: false` always fetches and with
`forget: true` never does; a fresh system after a reload has no reservations; the sims-day log is
byte-identical for NPCs without `printHabit`; an errand back to the post emits `npc_caught_at_post`
when the stub reports the player in a minigame on the home object, and `npc_returned_post` comes before
the next `work` use; a lab-shaped fixture (a plain item carried to an own `needsHome` whose
affordance authors `useSeconds: 6`) keeps its dwell and its log, and `GOLDEN_SIMS_DAY` is unchanged; a
full pool with one forgotten print recycles it and the lever's print gets an errand; a full pool with no
forgotten print makes a cosmetic copy, no errand and no printing icon; an unowned print with a full pool
recycles the oldest forgotten slot; a print by an NPC with no `printHabit` stays unowned and Amara can
take it; the owner's own errand never aborts with `item_gone` on a reserved slot; a player at the desk
during the outbound leg gives no `npc_caught_at_post`; one errand gives at most one; an errand started
from `returning` emits at most once across the walk and the errand; the errand completes without a
`using` phase; the note lever's cooldown allows a second read after 60 s. Live: screenshots of Tom's printout on the tray, in his hand and on his desk; the
lever with the player still in Tom's minigame when he comes back; the note lever's forgotten print still there two minutes later, with no reload in between; the lever from
Tom's open PC; the lab regression.

**Risks.** Forgotten prints fill a producer's pool until a reload; the validator's info line and
the cosmetic fallback cover it. A fetch adds a leave, so Tom's screen window opens more often; that
is the point, and the README says so. The need-use rule changes when `revealOutput` fires for any
scenario that delivers items to a hooked object; a grep at build time lists them (the lab has no
`revealOutput` hook). The `job.errand` scope keeps every existing carry as it is.

### 12.4 Social magnets and player levers (slices 18a, 18b-i and 18b-ii)

**The user's question: does the presence of the cake create the need?** No. Needs belong to
people; objects only advertise. A cake advertises hunger and social, and while it is there it lowers
the level at which an NPC that knows about it will act on those needs. Tom's hunger at 60, with
`urgentAt: 40`, would not send him to the fridge; with a cake's `tempt: 30` he gets up for cake. It
is the rule interests already follow: an item's presence makes an option, never a need
(`NPC_NEEDS_SYSTEM.md` 3.1). Three results are worth keeping. An NPC with no hunger or social need
ignores the cake (in the showcase, Marek has only thirst and caffeine and stays at his desk), and
the player can see that. A cake pulls only the people who know about it, so word of mouth decides
the order, which is where social compatibility comes in. And temptation never makes anyone hungrier:
it never lowers a level, and one person takes one slice unless the scenario says otherwise.

The levers come first because the smallest one, switching off the coffee machine, is its own slice
(18a); magnets are 18b.

**Player levers.** A lever is a way the player moves people through systems that already exist,
without scripting the NPC. The engine stays neutral: it moves people and emits events.

| Lever | Through | Build |
|---|---|---|
| Switch off the office coffee machine | `affordance.offWhen` (below): the machine stops being a source; NPCs on the way turn back, take the kitchen or park (slice 14) | **Now**, slice 18a |
| Send a print job | the `print` command (12.3) on `workstation_accessed` | **Now**, slice 17 |
| Bring food (cake, pizza) | magnets, word of mouth, servings | **Now**, slice 18b |
| Ring a desk phone | `desk_phone_ring:<id>` (12.5): the owner answers, or a colleague walks over | **Now**, slice 19 |
| Turn the kitchen lights off | a rule that a dark room is not a source | Defer: changes every lit scenario's choices; wants its own review |
| Call a meeting, a fire drill | leave and arrive, preemption (2.8) | Defer with schedules (slice 12) |
| Printer out of paper | stock (2.7) | Defer with consumables (slice 13) |
| Prop a door, tell someone something | doors never re-close (`doors.js`); dialogue | Defer: not a needs lever |

#### Slice 18a: coffee off

**Built: 2026-11-06 (slice 18a: engine, validator, schema and tests 84babc54c; showcase 9589e5bfd).
Regressions: `test_needs_leash` game 919 (pass), `lab_physical_pentest` game 920 (score 100); sims live proof game 918; see
`HANDOVER_OFFICE_S18A.md`.** As written (`offWhen` in the use and queue candidate filters, the `off` check in `_advanceJob` before
`_recheck`, the `TURN_BACK` table with `rang_out`, `mindChanged` only for `avoid`, the wake on a real change, `grumble_<reason>` chosen by
lines, `PICTURE_CHATTER.grumble_off` and `grumble_gone`, the validator's `check_off_when`, schema `affordance.offWhen`;
`bin/test-js` 404 files pass, `npc-coffee-off` 12 tests; `GOLDEN_SIMS_DAY` unchanged), with these choices made without asking:
(1) The switch is the approved `wall_socket1` (17×18, 9742108c2), not the `notes_postit1` stand-in, at (9.05, 7.3) on the office's east
wall beside the machine, square to the wall; `game.js` preloads it; the stand-in `_comment` is gone. (2) The topic rule is
`grumble_<reason>` when it has lines, else `grumble` when it has lines, else the `grumble_<reason>` picture; `avoid` never reads a
`grumble_avoid` pool, so every existing grumble is unchanged. An `off` (or `gone`) picture is always the need's own icon, cooldown
included, from a local `NEED_ICONS` list in `npc-needs.js` (no import of `npc-action-icons.js`, so the harness copy lists are unchanged),
falling back to `avoid`. (3) The wake compares each `offWhen` object's off state, recorded at its last candidate check or turn-back,
and wakes (with the select back-offs cleared, as a door does) only when one goes from off to on; switching off wakes nothing. It logs
`switched_on` with `npc: null`, the only system-level line in the decision log. (4) The `off` check reads `job.offWhen`, copied from the
target at job start, so a walking NPC costs no object lookup per tick; only `use` jobs check. (5) `turned_back` log entries carry
`grumble: <topic>` for every reason that grumbles, `avoid` included. (6) The table has a `parks` column and `_select` takes
`exclude.noPark`, ready for 18b's `job.tempted`; `answered` and `rang_out` need no `need`, and dropping the claimed call is left to slice 19.
(7) The schema's `triggerOnInteract` action list gains `hint` (`applyActions` already ran it; the schema refused the socket). (8) The
showcase objective `see_coffee_off` uses one mapping `npc_turned_back:*` with `data.reason === 'off'` (not two named ones) plus the
kitchen mapping, on Amara's list; `see_turned_back` now needs `data.reason === 'avoid'`, so a dead machine does not tick the avoidance
task. (9) The validator's "nothing sets it" looks for `set_global` actions and mapping `setGlobal`, not ink. (10) Walkers turn back
wherever they are when the socket is clicked, as designed; one who has already started pouring finishes (seen live). The new
`grumble_off` and `grumble_gone` lines have no cached TTS audio yet (keyless :3001).

**Built: 2026-11-06 (slice 18b-i: engine, validator, schema and tests 91227f828; showcase 60f41190f; fix from the live proof
2643c23f3).** Regressions: `test_needs_leash` game 951 (pass), `lab_physical_pentest` game 952 (score 100, 9/9 tasks, keylogger
creds 63.2 s, USB foothold 10.0 s); sims live proof games 930, 938, 939, 948, 949, 950 (README table); see `HANDOVER_OFFICE_S18B1.md`.
`bin/test-js` 406 files pass, `npc-magnet` 16 tests, `GOLDEN_SIMS_DAY` unchanged. As written, drops only (the OQ31 redesign: the
cake is a droppable start-inventory item, like the lab's USB), with these choices made without asking: (1) **The declared spot
(option B) is cut**: no `triggerOnInteract` deploy, no refill at 0, no `hideRevealedObject` finish, no spot validator checks; only
its "a `revealOnGlobal` object whose global does not hold is no use target" rule is in. A magnet declared as a room object gets a
validator warning. (2) Magnets are found on a drop, on a room load and on any object scan; there is no per-tick scan of their own
(the tick-cost test asserts no scans for an NPC with nothing urgent). (3) A magnet the NPC does not know of is no source at all,
even for an urgent need (otherwise an unknowing NPC would walk to the nearest food, cake included); the magnet try for an urgent
need is quiet too, and leash notes come from the usual-source try. (4) New events and log lines beyond the plan:
`npc_saw_magnet:<npcId>`, `magnet_serving:<id>`, log `magnet_seen`, `serving_taken`, `magnet_gone`, `magnet_left`;
`magnet_placed` also carries `servings`. (5) A tempted job's once-only avoid turn-back uses its own `temptBack` flag. (6) The
showcase's cake chatter is room-free and there is no announce pool yet (18b-ii); the description points at the kitchen.
**Found live and fixed:** a pickup during an NPC's windup failed the job with `no_approach` and a 60 s cooldown on the cake
instead of a `gone` turn-back, so a re-drop tempted nobody; the windup end now checks the magnet first. **Found live, not
changed:** "Missed it." is a voiced line and obeys the speech lock (a chatting eater turns it into the hunger icon); the existing
avoidance keeps Sanjay from a cake within two tiles of Marek; a doorway drop takes the player's click on the door (it picks the
cake up); a reloaded drop comes back about 13 px south-east.

**Built: 2026-11-07 (slice 18b-ii: engine, validator, schema and tests 94c190820; showcase 20d779678; fix from the live proof
e4a035212).** Regressions: `test_needs_leash` game 956 (pass), `lab_physical_pentest` game 957 (score 100, 9/9 tasks, keylogger
creds 65.0 s, USB foothold 10.8 s); sims live proof games 954 and 955 (README table); see `HANDOVER_OFFICE_S18B2.md`.
`bin/test-js` 407 files pass, `npc-news` 16 tests, `npc-magnet` 16, `GOLDEN_SIMS_DAY` unchanged. As written (OQ33's default: any
compatible knower within `newsRadius` in its own room tells; avoidance blocks it both ways, groups do not; the telling happens
whether or not the line is spoken; OQ35: learning by sight or word wakes that NPC's parked needs the magnet satisfies, through
`_wakeParkedFor`), with these choices made without asking: (1) **When a knower tells:** it is in its own post room, away from
the magnet's room (everyone there can see it), and idle, walking home, or using its own post object (working at its desk; found
live in game 954, where a told Sanjay back at his PC could never pass it on). Entering the post room counts, so a knower coming
back through the door speaks there, and the radius is measured from the door. (2) **An empty-room skip keeps the news:** a knower
with nobody to tell says nothing and tells whoever comes within range later; once it has spoken it never announces that magnet
again. Told NPCs are knowers too, so the word can pass on. (3) The lock wait starts when a line first waits and survives a job in
between; after 30 s the `news` picture shows (the first `satisfies` with an icon, else `social`). With no `announce` pool the
picture shows at once. The announce ignores the bark cooldown and starts it. (4) New beyond the plan: log `announced` (`heard`,
`line` or `picture`) and `told` (`from`), event `npc_announced:<speakerId>` `{ magnetId, heard, topic, line, picture }`; a pickup
or finish also forgets who announced, so a re-drop is told again. (5) `_grumble`'s bubble, voice and `npc_overheard` are shared
with the announce as `_showSaying`. (6) Validator `check_magnet_news`: `announce` names a scenario-level pool with lines (error),
`newsRadius` 0-50 (error), and a line naming one of the scenario's rooms (id, door sign or type) warns, since a drop can be
anywhere. (7) The showcase's `news_cake` lines are room-free; its task `hear_cake_news` maps `npc_told:*`. **Seen live:** Grace
took the dirty mugs to the kitchen, saw the cake, and announced from the office door ("Cake! It's somebody's birthday."): Tom and
Sanjay (14 and 22 px) were told and got up at once; Marek at 130 px was not (he avoids everyone), nor Amara, by then beyond five
tiles; the TTS request came back 503 (keyless). Only two hungry people heard, so no "Missed it." in these runs.

**Design.** `affordance.offWhen` takes the `requireGlobal` form (a name, truthy, or
`{ name: value }`, `requiredGlobalsHold` 123-130). While it holds, the object is not a candidate.

- **Walkers and queuers turn back.** `_recheck` cannot carry it: it returns at once for an NPC with no
  avoidance radius and for a job without a need (1066-1069). A separate check runs in `_advanceJob`
  before `_recheck`, for `goto_target` and `queued`: the target is off, so `_turnBack` with reason
  `off`, a grumble, and the next source or parking `no_source`.
- **Grumbles by reason.** `_grumble(s, objectId, reason)` (today `_grumble(s, objectId)`, 1103)
  chooses its topic **before** calling `_pickBark`: `grumble_<reason>` when that pool has lines
  (`chatterPool(...).lines.length`), else `grumble`. It cannot try one and fall back on the result,
  because `_pickBark` returns a picture, not null, for a topic with no lines whenever pictures are
  allowed (1147-1160, `chatterPool` 110-121), which would turn every existing grumble into a `social`
  picture, the lab's two spoken grumbles about Sofia included (`lab_physical_pentest/scenario.json.erb`
  43-45). `PICTURE_CHATTER` gains `grumble_off` and `grumble_gone`. Their picture is the need's own icon
  (`npc-caffeine`, `npc-hunger`), falling back to `avoid`, since the grumble picture today is `avoid`
  (`PICTURE_CHATTER.grumble`, 69-74), which reads as avoiding a person. `_grumble` logs the topic it
  chose, not always `grumble` (1108, 1114). A scenario's `grumble` pool is often about a person (the lab's
  is), so a scenario that uses `offWhen` adds a `grumble_off` pool.
- **One turn-back function, a table of reasons.** `_turnBack` (1080-1097) today always sets
  `mindChanged`, grumbles, re-selects with the source excluded, and goes home. With four reasons:

  | Reason | Sets `mindChanged` | Grumble | Fallback select | Parks if nothing |
  |---|---|---|---|---|
  | `avoid` (slice 14) | yes | `grumble` | yes | yes |
  | `off` (18a) | no | `grumble_off`, else `grumble` | yes | yes, unless `job.tempted` |
  | `gone` (18b) | no | `grumble_gone`, else `grumble` | yes | yes, unless `job.tempted` |
  | `answered` (19, a colleague's phone job, `need: null`) | no | none | no | no: straight home |
  | `rang_out` (19, an answerer still on the way when the phone rings out) | no | none | no | no: straight home; the call chosen at the claim is dropped |
- **Only `avoid` sets `mindChanged`** (the table). `_turnBack` sets `mindChanged[need]` (1083), which today stops a
  second avoidance turn-back in the same episode. An `off` (or 18b's `gone`) turn-back does not set it,
  so a later avoidance still works.
- **An NPC already `using` the machine finishes** its use.
- **Switching it back on wakes parked needs.** A real change of an `offWhen` global's value calls
  `_wakeParked`, as a door opening does. `set_global` emits on every call, same value or not
  (`apply-actions.js` 81-89), so the wake compares old and new value.
- **The switch is its own object** (a wall socket beside the machine), not the machine.
  `triggerOnInteract` replaces an object's normal interaction on every click
  (`interactions.js` 844-846), so a switch on the machine would turn it off whenever the player
  clicked it to read its observations, and repeat the hint on each click. On a socket the click is
  deliberate and the machine's observations stay reachable. One-way (`set_global` has no toggle); a
  scenario that wants it back adds a second object or a mapping. `triggerOnInteract` returns before
  the observation step (`interactions.js` 820-846) and the examine view skips trigger objects
  (`examine.js` 6-12), so a trigger object's observations are never shown, and `applyActions` has no
  per-action condition (`apply-actions.js` 78-280), so the hint cannot be gated. The review suggested a
  `onceOnly` mapping on `global_variable_changed:office_coffee_off` instead; event mappings can bark
  from an NPC but have no player hint (`npc-manager.js` mapping fields 840-860), so a bark would read
  as a message from a colleague. The hint therefore stays in the trigger and is written as a state, not
  an action, so it reads well on every click: "The coffee machine is switched off at the wall." It
  carries a neutral `title` ("Wall socket"): without one, `hint` shows the alert under "Intelligence
  Received" (`apply-actions.js` 168-171), a spy title in a neutral showcase. The validator warns on a
  `hint` with no `title` in any scenario that sets `officePresets` or has needs NPCs (a machine-checkable
  stand-in for "no security story"); one validator fixture.

```jsonc
"globalVariables": { "office_coffee_off": false },
{ "id": "office_coffee", "type": "coffee_station1", "affordance": { "offWhen": "office_coffee_off" } },
{ "id": "office_coffee_socket", "type": "notes_postit1", "name": "Wall socket",
  "_comment": "Stand-in sprite until a wall-socket sprite is approved; room dressing replaces it.",
  "triggerOnInteract": [{ "type": "set_global", "key": "office_coffee_off", "value": true },
                        { "type": "hint", "title": "Wall socket", "message": "The coffee machine is switched off at the wall." }] }
```

No wall-socket sprite exists (`assets/objects` has only large switchgear and panels); a small one is
**[approval]**, and until then the switch is the existing 9×9 `notes_postit1`. An existing
`spriteVariants` or emitter variant on the global shows the machine off.

**Engine.** `npc-needs.js` about 60 lines (`offWhen` in the candidate filter, the check in
`_advanceJob`, the `off` reason, `mindChanged` only for `avoid`, the wake on a real global change,
`grumble_<reason>` chosen by lines with its own icon and logged topic, the turn-back table, two
`PICTURE_CHATTER` entries). Validator about 15 (`offWhen` names a declared global; no object in the scenario can set it,
warning; a `hint` with no `title` where the default title does not fit, warning). Schema about 10.
**About 85 lines (60 + 15 + 10), S.**

**Showcase and tests.** `test_needs_sims`: `office_coffee` gains `offWhen`; a socket object beside it.
Objective "Switch the coffee off and watch someone go to the kitchen" on `npc_turned_back:sanjay` and
`npc_turned_back:tom` with `data.reason === "off"` (two mappings: conditions have no `||`), and a third
mapping on `npc_used:kitchen_coffee` with `globalVars.office_coffee_off`, since a turn-back needs Tom to
be walking or queued at the moment of the click (Sanjay's caffeine decays 1 point a minute,
`test_needs_sims/scenario.json.erb` 433). `grumble_off` and `grumble_gone` pools join the showcase. Node:
`offWhen` removes a source; a walker and a queuer turn back with `off`; an NPC using it finishes; the
fallback takes the kitchen; an `off` turn-back leaves a later `avoid` turn-back possible; a real global
change wakes a parked need and a repeated set of the same value does not; `grumble_off` is used when it
has lines and a scenario with only a `grumble` pool still grumbles a spoken line for `off` (the lab's
case); the `answered` and `rang_out` reasons go straight home with no grumble; the `grumble_off` picture is
the need's icon and the log names the topic chosen; the validator warns on a `hint` with no `title` in
the showcase; the sims-day log byte-identical with no `offWhen`. Live: the socket click,
the turn-back bubble, the walk to the kitchen.

#### Slices 18b-i and 18b-ii: magnets (split at the end of this part)

**Design.**

1. **A magnet** is a declared object whose affordance has a `magnet` block: what it satisfies
   (`hunger`, `social`), its `capacity`, a `chatter` topic for pairs that meet there, and
   `magnet: { tempt, servings, perPerson, announce, newsRadius }`.
2. **Who knows.** An NPC learns of a magnet by **sight** (it is in the magnet's room, lit or not,
   while the magnet shows; checked each tick against `npcPos(id).roomId`, reading the shown magnets
   from the per-tick object cache, not a fresh scan, so the tick-cost bound `objectScans <= ticks + 40`,
   `test/js/npc-needs-tick-cost.test.mjs` 95, still holds; that test is re-run in 18b-i) or by **word**. The
   knowledge map is client only; after a reload, NPCs in the magnet's room notice it again.
3. **Word of mouth.** Telling is a state change, not a line. A knower who gets back to its post, or
   arrives at its post room from the magnet, announces once per magnet: every NPC in the same room
   within `newsRadius` tiles (default 5) that does not know yet, and is **compatible** with the speaker
   (no avoidance either way, 7.3; groups do not matter), learns it, whatever is shown. The hearers are
   those in range **when the line or picture shows**, not at the speaker's arrival, so a player sees
   the line before anyone gets up. When nobody in range would learn (an empty office, or Marek, whom
   nobody listens to), there is no announce at all: no line, no picture, no TTS request.
   What is shown: a line from the magnet's `announce` pool through `_pickBark` and `_speak`, but the
   announce **ignores the bark cooldown** (it is news, not small talk) and **waits for the speech
   lock** (`waitForLock: true`, already supported), retrying until spoken or 30 s have passed; then a
   picture with a new `news` topic in `PICTURE_CHATTER`, whose icon is the magnet's first `satisfies`
   (`npc-hunger`, `npc-social`, from the section 9 set), falling back to `social`. With `"chatter": false` nothing is shown and the telling still happens.
   NPCs are visited in id order, so it is deterministic. The result is the shape the user described:
   the kitchen knows first, the office hears when someone comes back, and an NPC who avoids everyone
   (`avoids: ["*"]`) is never told and learns only by walking into the room. Events:
   `npc_told:<hearerId>` `{ magnetId, fromId }` per hearer, and `npc_overheard:<speakerId>` as for any
   bark the player is near.
4. **Temptation.** A need that a known, live magnet satisfies counts at `level <= urgentAt + tempt`
   (capped at 95), and its candidates are the known magnets only, so temptation never sends anyone to
   the fridge. An urgent need tries known magnets first and falls back to its usual sources. Score as
   today, against the raised threshold. Leash, privacy, avoidance, capacity and balking all apply as
   for any object, so a cake in Maya's private office draws nobody else. Three rules keep it apart
   from parking (slice 14), whose `_park` sets a level to `urgentAt + 1` (1023-1028) and would
   otherwise make a told NPC hungrier:
   - **a tempted need never parks**: a failed tempted selection is simply no option, and the level is
     untouched;
   - **a parked need is not tempted** (its `urgentAt + 1` lies inside the band);
   - **learning of a magnet, by sight or word, wakes the parked needs it satisfies** for that NPC, so
     someone who gave up on the fridge hears about the pizza and goes. `_wakeParked` (1046-1060) wakes
     every parked need of every NPC, so this is a new per-NPC, per-need call, `_wakeParkedFor(s, needs)`;
   - **a tempted selection is a quiet look.** "Tempted" means `urgentAt < level <= urgentAt + tempt`
     and not starved: a starved need is acted on at any level (852-853), and the lab's Chris and Melanie
     have `maxUnmetMin: 6` (`lab_physical_pentest/scenario.json.erb` 683, 901), so a starved need keeps
     today's leash notes and parking. For a tempted need, `_useCandidate` skips `_noteLeash`,
     `_notePrivate` and `s.giveUp` and returns null, and a quiet look that found nothing sets
     `selectRetryAt` as a searched select does (`SELECT_BACKOFF_TICKS`), so a told NPC that cannot reach
     a full magnet does not run a full `_select` every 250 ms. Without this, `_decay` clears
     `leashNoted`, `privateNoted` and `mindChanged` on every tick a need is above `urgentAt`
     (750-758), and a candidate dropped by the leash never reaches `_reachable`, so no select back-off
     applies (`_selectSearched`, 541-544): a told NPC whose leash forbids the magnet's room would log
     `leashed` and emit `npc_needs_leashed` every 250 ms while the magnet is out;
   - **`job.tempted`** is recorded at job start, because the level can decay below `urgentAt` on the
     way. A tempted job that turns back neither parks nor grumbles twice, and the
     "turn back once, then go anyway" rule (`_recheck` 1075) holds for it through its own flag, since
     `_decay` clears `mindChanged` for a need above `urgentAt`.
   An NPC that learns of a magnet mid-job does not retarget: Tom at the fridge finishes his fridge use.
5. **The early return.** `_select`'s guard (844, 12.3) also checks "no known live magnet that
   satisfies a need inside its tempt band", or temptation never fires with the tick cache on (Tom has
   no interests). Node tests run with the cache on and off.
6. **Servings.** `_free` admits up to `capacity` claims whatever is left (783-786). A magnet is free
   while **`claims < capacity` and `servingsLeft > 0`**, and a serving is **taken when the `using`
   phase starts**, so the count never goes below zero and nobody eats a slice that is not there.
   Several walkers can head for the last slice; the first to arrive takes it, and the moment the count
   reaches 0 every NPC still on the way turns back with `gone` (18a's check in `_advanceJob`), while one
   that arrives at 0 never starts `using`. That keeps "Missed it." and the test below, and capacity
   still limits the crowd. (Round 1's rule, `claims < min(capacity, servingsLeft)`, made `gone`
   unreachable, because `_claims` counts walkers and eaters alike, 767-775, so every walker who could
   claim got a serving.) The count is saved in an engine-owned global,
   `<magnetId>_servings`, declared in `globalVariables` at the starting count (globals sync, and the
   server takes any key that is not an imported global; saved through the periodic sync and the
   pagehide flush, `state-sync.js` 126-148). When the last serving is taken and every NPC still
   `using` the magnet has finished, the engine takes the magnet away, logs `magnet_finished` and emits
   `magnet_finished:<magnetId>`. A dropped magnet (the usual case, OQ31) is removed as a room object
   through the path an NPC's `consumeHeld` already uses (`RoomStateSync.removeItemFromRoom`), so the
   server forgets it; a magnet at a declared spot is hidden (`hideRevealedObject`) with its reveal
   global set false. Either way a reload keeps it gone. A walker turned back with
   `gone` grumbles from `grumble_gone` ("Missed it."); an untempted one falls back or parks, a tempted
   one (`job.tempted`) does neither. **One slice each:** `magnet.perPerson` (default 1) is how many servings
   one NPC takes before the magnet stops tempting it; a plain urgent need may still use it. Without
   this, an NPC starting at 25 with `restores: 40` ends at 65, still inside a band of 70, and eats
   again at once. Eaters are remembered client side, so after a reload someone may have one more.
   **Redeploying:** at a declared spot, when a magnet's reveal global turns true while its servings
   are 0, the engine refills them, so a second pizza at the same spot is a full one. A dropped magnet
   is gone once finished; a second one is a second item with its own id and servings global. **A reload between the last serving
   and the last eater** would restore 0 servings with the reveal global still true, and nobody would
   ever finish it. So at install, and whenever nobody is using it, a shown magnet at 0 servings finishes
   (taken away as above, `magnet_finished`).
7. **A hidden object is not a use target.** `_useCandidate` skips an object whose `revealOnGlobal`
   global is not true (today `listObjects` 2238-2252 lists it). Hidden is read from the global, not
   from `visible`, which other code toggles. No shipped scenario has a hidden object with an
   affordance (the lab's and the showcase's reveal objects carry none, and only the showcase uses
   presets, where its reveal objects are `notes1` and `id_badge`, which have no preset); the build
   re-checks.

**Placing it: what fits constraint 2.** The cake starts in the player's inventory, and only a
declared object or a held droppable item can become a room object.

| Option | How | For | Against |
|---|---|---|---|
| A. Drop it | The cake is `droppable` and carries its own `affordance.magnet`; the server saves the held copy at the drop point (`game.rb` 427-444) | No engine change to placement; anywhere | Approach cells, leash and lighting cannot be checked; it can land in a corridor or a dark store; the player can pick it up again mid-meal; a drop point is not a table |
| **B. Deploy at a declared spot** | A declared spot (a kitchen table) with `triggerOnInteract`, `requiresItem: "pizza"` and `consumesItem: true` runs `set_global kitchen_pizza_out`; a declared magnet object with `revealOnGlobal: kitchen_pizza_out` appears on the table (`interactions.js` 797-846, `core/rooms.js` 2970) | Existing primitives end to end (the lab's keylogger uses the same three fields); saved through one global; fixed position, so the validator can check approach cells, the leash and the announce pool; it sits on the table | One declared magnet per spot; the player can put it only where the scenario offers; the trigger replaces the table's normal click, which is acceptable for a table |
| C. Drop with snapping | A, but the drop point snaps to a declared spot nearby | Free and tidy | A change to `item-drop.js` and the drop path, for little over B |

**Chosen by the user: A, drop it anywhere (2026-11-06), with B kept as a second, optional way.** The
user wants the player to put a magnet out the way the lab's USB stick and QR code go down: click it in
the inventory and it lands at the player's feet. That path exists end to end.
`item-drop.js` (`dropInventoryItem`) places a held `droppable` item at the nearest walkable cell within
two tiles of the player's feet (`dropPoint`), emits `item_dropped:<itemId>` `{ itemId, tag, roomId, x, y }`
and saves it with `sourceType: 'player_drop'`; the server accepts that only for a held droppable item
and saves **the held copy**, so the item's own `affordance` (and its `magnet` block) travels with it,
with only the placement taken from the client (`game.rb` 427-440). The adapter's `listObjects`
(`npc-needs.js` 2238-2252) already lists any room object with an affordance, so a dropped magnet is a
use target with no new placement code. What 18b-i adds for drops:
- **The magnet is the item.** The pizza in the inventory is `droppable: true` and carries
  `affordance.magnet`. It has a fixed `id` (validator error without one: `dropInventoryItem` would
  otherwise name it `dropped_<type>_<Date.now()>`, which breaks the `<id>_servings` global and the
  object order the decision log depends on) and **no `needsTag`** (validator error: an NPC with a
  matching interest would pick it up and carry it off, `npc-needs.js` 1239).
- **Placed:** on the drop, the engine emits `magnet_placed:<id>` `{ roomId, x, y, how: "drop", reachable }`,
  where `reachable` lists the NPCs with a need it satisfies whose leash and privacy allow that room. With
  nobody, it logs `magnet_unreachable`, so a pizza in a store room nobody may enter is explained in the
  log and a mapping can hint at it.
- **Picked up again:** allowed; taking the pizza away is a lever too. The room object goes the usual way,
  so walkers turn back with `gone`, an NPC `using` it finishes at once (the serving it took is eaten),
  and every NPC's knowledge of it is cleared, so a re-drop is learnt again by sight or word. The servings
  global keeps its count across the pickup.
- **Finished:** removed as a room object (point 6), not hidden.

**B, a declared spot,** stays as written above for a scenario that wants food on one table: it costs the
hidden-object rule (point 7), the refill and the spot checks in the validator, about 35 lines, and can be
cut if the build runs long. C is dropped. **Discoverability** for A: the item's description says where
people eat ("Pizza for the office. Put it out where people will see it; the kitchen is a good bet."). For
B, the table's own observations are never shown (its `triggerOnInteract` returns before the observation
step, `interactions.js` 820-846, and the examine view skips it, `examine.js` 6-12), so the hint goes in
`requiresItemHint`.

**Authoring.**

```jsonc
// scenario level: the announce pool lives in scenario JSON, voiced for any NPC (11.2)
"chatter": { "news_pizza": ["There's pizza in the kitchen!", "Someone brought pizza in."] },
"globalVariables": { "pizza_servings": 2 },

// A (chosen): the magnet is the held item; the player drops it anywhere
// (startItemsInInventory, or a give_item)
{ "id": "pizza", "type": "pizza_boxes1", "name": "Pizza", "droppable": true,
  "observations": "Pizza for the office. Put it out where people will see it; the kitchen is a good bet.",
  "affordance": { "satisfies": ["hunger", "social"], "restores": 40, "useSeconds": 12, "capacity": 3,
                  "chatter": "pizza", "useSound": "eat_snack",
                  "magnet": { "tempt": 30, "servings": 2, "perPerson": 1, "announce": "news_pizza", "newsRadius": 5 } } }

// B (optional): a declared spot, with "kitchen_pizza_out": false and "kitchen_pizza_servings": 2
// in globalVariables. The spot: deploy the carried item here
{ "id": "kitchen_table", "type": "glass_coffee_table1", "name": "Kitchen table",
  "triggerOnInteract": [{ "type": "set_global", "key": "kitchen_pizza_out", "value": true }],
  "requiresItem": "pizza", "requiresItemHint": "Somewhere to put food out.", "consumesItem": true },
// the magnet, on the table, hidden until it is put out
{ "id": "kitchen_pizza", "type": "pizza_boxes1", "name": "Pizza", "takeable": false,
  "revealOnGlobal": "kitchen_pizza_out", "position": { "x": 4, "y": 5 },
  "affordance": { "satisfies": ["hunger", "social"], "restores": 40, "useSeconds": 12, "capacity": 3,
                  "chatter": "pizza", "useSound": "eat_snack",
                  "magnet": { "tempt": 30, "servings": 2, "perPerson": 1, "announce": "news_pizza", "newsRadius": 5 } } }
```

**Engine.** `npc-needs.js` about 245 lines: the knowledge map and sight check 35, temptation and the
wider early-return guard 40, the parking rules, the quiet look and `job.tempted` 25, telling with the
lock wait, retry and the empty-room skip 70, servings at `using` start, `perPerson`, refill and finish
45, the `gone` reason in 18a's check 10, hidden objects skipped 5, the `news` picture topic 5,
`_wakeParkedFor` 10. Adapter about 15 (hide a
finished magnet, the global write). Validator about 65: a magnet declared as a room object (the spot
way; a droppable item is checked by the drop rules below) must be non-takeable, with its own `revealOnGlobal`, and some spot's `triggerOnInteract` must set that global with
`requiresItem` naming an item the player can hold (`startItemsInInventory` or a `give_item`) and
`consumesItem: true` (error); `announce` names a scenario-level pool with lines (error), each at most 40
characters with no `{ }` (the existing pool checks); `<id>_servings` declared and equal to `servings`
(error); `satisfies` names a need some NPC has (warning, naming those who will never come); the magnet's
room forbidden to every NPC with the need (warning). Schema about 30 (`affordance.magnet`). No server change. With the quiet look's
back-off, the starved exclusion, the reload finish and the sight cache (about 15 more in
`npc-needs.js`, so 245 + 15 = 260 there), these parts sum to about 370 lines (260 + 15 + 65 + 30), so
18b is built as two slices (245 + 125 = 370), each with its own live proof.

**Dropping, added after the user's decision (OQ31, 2026-11-06): about 70 more lines in 18b-i.**
`npc-needs.js` about 35 (`magnet_placed` with `reachable` and `magnet_unreachable` 15, the pickup:
walkers `gone`, an eater finishing at once and knowledge cleared 15, a dropped magnet live while it is a
room object 5); adapter about 10 (finish a dropped magnet through the `removeItemFromRoom` path);
validator about 20 (a droppable magnet item has an `id` and no `needsTag`, errors; the player can hold it;
`<id>_servings` declared; this replaces the old "unsupported" warning); schema about 5 (`affordance` on
an inventory item). No server change and nothing in `item-drop.js`. **18b-i is now about 315 (245 + 70),
L**; dropping the optional declared spot would save about 35.

- **18b-i, the magnet** (about 315, with the reload finish, the sight cache and dropping): the magnet
  item dropped anywhere, `magnet_placed`, pickup, the optional declared spot with hidden objects not
  targets, sight, temptation with the parking rules, the quiet look and `job.tempted`, servings,
  `perPerson`, refill (spot) and finish, the `gone` reason, the wider `_select` guard, the validator's
  magnet, drop item, spot and servings checks, the schema. Proof: the player drops the pizza in the
  kitchen; the people told in the office walk over together; two eat, the boxes empty, and the third
  turns back with "Missed it." (two servings, three hungry NPCs, no staging).
- **18b-ii, word of mouth** (about 125): telling, the announce with the lock wait, retry and empty-room
  skip, the `news` picture, `_wakeParkedFor`, `npc_told`, the validator's announce-pool checks. Proof:
  the announce bubble in the office, the TTS request, the hearers who get up.

**What the player sees and hears.** The player puts the pizza boxes down in the kitchen. Nobody is
in the kitchen, so nothing happens until someone comes in: Grace for water, or Tom, whose own hunger
takes him to the kitchen. Grace has no hunger or social need and leaves the pizza alone, but back at
her desk she says "There's pizza in the kitchen!" and the three in the office who want food, Tom,
Sanjay and Amara, get up together for two slices. Two of them chat over the boxes; the third arrives
to an empty box. Marek, at the cooler later, sees it too and does nothing: no need
to act on, and nobody who will listen to him. The boxes empty, and a late arrival turns back:
"Missed it."

**Showcase.** `test_needs_sims`: `pizza` (`pizza_boxes1`, already in `assets/objects`; the cake
sprite once the art sheet lands, OQ46) in the start inventory as a droppable magnet with
**`servings: 2`**, its description pointing at the kitchen; the player drops it there (or anywhere);
a `news_pizza` pool and a `pizza` chatter pool. The declared spot is shown only by a validator
fixture and a node test, not by a showcase beat. **Amara
gains a hunger need**, `{ "decayPerMin": 1, "urgentAt": 40, "initial": 65 }`: inside the tempt band
(40 + 30 = 70) from the start, so the office announce sends Tom, Sanjay and Amara at once, two eat and
one turns back with "Missed it." without staging. At 1 point a minute her hunger does not reach
`urgentAt` until about minute 25, so before then it adds no decision-log line (decay logs nothing until
`urgent`, and the `registered` line carries no data, `npc-needs.js` 331) and moves no existing showcase
beat; `GOLDEN_SIMS_DAY` is unchanged, both because the sims fixture is a hand-copied stub
(`test/js/fixtures/needs-sims-world.mjs` 1-7) and because the 15-minute day ends before her hunger is
urgent. If Tom finds the pizza himself first, he eats one slice and his announce sends Sanjay and Amara
for the last one, which gives the same turn-back. The build checks that the split shows within five
minutes of the pizza going out, as slice 16's threshold is checked, and adjusts `initial` if not. Who finds it first is a race
(Tom's hunger and Grace's thirst both come due at about 2.5 minutes), so the objective "Word gets round"
is a mapping per NPC on `npc_told:<id>` (Tom, Sanjay, Amara), each completing the same task, and the
task's text says that whoever finds the pizza tells the office. "The pizza runs out" on
`magnet_finished:pizza`. The five-minute check assumes a drop in the kitchen; a drop elsewhere is
the player's choice and may draw nobody (the `magnet_placed` event's `reachable` says who could come). The README states that Marek never comes (no hunger or social need),
and that Tom's and Sanjay's hunger start at 65 and 64, already inside a band of 70, so for them
temptation reads as "goes at once".

**Tests.** Node, with the tick cache on and off: no temptation before an NPC knows; sight in the room;
told only by a compatible speaker, avoidance both ways, groups ignored; a knower on bark cooldown still
tells, and one with the lock busy tells when it is free or after 30 s with a `news` picture; one
announcement per knower; `tempt` raises the threshold only towards known magnets; an urgent need
prefers a known magnet; a told, leashed NPC keeps its level and logs no `parked`; a parked need is not
tempted, and learning of a magnet wakes it for that NPC only; a told, leashed NPC over 2 minutes of
needs clock logs no `leashed`, `private_skipped` or `parked` and emits no `npc_needs_leashed`; a tempted
walker turned back with `gone` does not park; a fresh system with servings 0 and the reveal global
true finishes the magnet at install; the tick-cost bound holds with the sight check; the hearers are those in range when the line shows, and
an announce with nobody to tell makes no line and no TTS request; the `news` picture follows the
magnet's first `satisfies`; an NPC that learns mid-job does not retarget; capacity 3 with one serving left and three tempted NPCs:
one eats, two turn back with `gone`, the count ends at 0; `perPerson: 1` stops a second helping by
temptation; servings save to the global and a redeploy at 0 refills; a fresh system with the reveal
global false sees no magnet; a hidden object is not a candidate; determinism; the sims-day log
byte-identical with no magnets. Dropping (stub world, the magnet placed at fixed coordinates as the
drop would place it): a dropped magnet is a candidate with no spot or reveal global; `magnet_placed`
lists only NPCs whose leash and privacy allow the room, and a drop in a room nobody may enter logs
`magnet_unreachable` and draws nobody; a pickup turns walkers back with `gone`, ends a use at once and
clears knowledge, and a re-drop is learnt again only by sight or word; the servings count survives a
pickup and re-drop; a finished dropped magnet is removed through the room-removal path and is absent
after a reload; two runs with the same drop point give the same decision log. Validator: one fixture
per check, including a droppable magnet without an `id` and one with a `needsTag`. Live: the player
drops the pizza in the kitchen with the door open; screenshots of the first eater, the announce bubble
in the office, two NPCs chatting at the boxes, the empty floor; one drop in a room every hungry NPC's
leash forbids (nobody comes; `magnet_unreachable` in the log); one pickup mid-meal (eaters stop,
walkers turn back); the play log of the voiced announce (keyless :3001 returns 503, so the request is
the proof, as in slice 15); a reload mid-meal keeps the servings count and the pizza where it was
dropped. Then the leash and lab regressions (the lab's USB and QR drops must behave as before: they
carry a `needsTag` and no affordance, so the new code never sees them).

**Risks.** A stampede: capacity, servings at `using` start and one announcement per knower keep it
staggered. Pairing is one pair per object (slice 8 choice 4), so a third eater is silent; group chat is
not in this slice. A magnet near a leashed room can go unvisited; the validator warning covers the
static case, and the parking rules keep a leashed, told NPC's level as it was. An announce line names a
room ("in the kitchen"), so each spot's magnet has its own pool; `{ }` variables are not allowed in
spoken lines.

New risks from dropping anywhere (OQ31), checked against the rules above:
- **Wrong room in the line.** A dropped pizza can be anywhere, but the pool says "in the kitchen". The
  showcase's pool says where it was meant to go; a scenario that expects drops in several rooms writes
  room-free lines ("Someone brought pizza in."). Validator: none possible; noted in the README.
- **Leash and privacy** now apply at run time only: the static "room forbidden" warning cannot see a
  drop. `magnet_placed` with `reachable`, and `magnet_unreachable`, make a dead drop visible in the log;
  the parking rules still keep a told, leashed NPC's level as it was. Avoidance works as before, so
  a pizza dropped beside someone others avoid draws fewer people, which is a lever, not a bug.
- **Claims and capacity on open floor.** A dropped item has no `useFrom`, so `approachCell` finds one
  walkable cell near it (`npc-needs.js` 2258-2262); where the second and third eaters stand with
  `capacity: 3` is unverified, and a drop in a narrow corridor may block the way. The build checks
  three eaters on open floor and in a corridor before the live proof, and lowers the showcase's
  `capacity` if they stack.
- **Servings global** is keyed on the item's scenario id, so the `id` rule above is required; the
  server keeps that id on the drop (`game.rb` 427-440).
- **Determinism.** The drop point comes from the player, so a magnet run's log depends on where the
  player stood; with the same point it replays the same. `GOLDEN_SIMS_DAY` has no magnet and no drop,
  so it does not move.
- **Pickup as an exploit.** Picking the pizza up mid-meal and dropping it elsewhere drags the office
  round the building. Each re-drop must be learnt again, and `perPerson` still caps servings, so it
  costs the player time and gains little.

### 12.5 Desk-phone calls (slice 19)

Builds on 2.9, which assumed schedules' preemption (2.8, slice 12, not chosen). The user's rule,
"an NPC away from the desk misses the call", removes the need for it: nobody is ever pulled out of
a job.

**Design.**

- **The phone.** A declared, non-takeable object with `phoneOwner: "<npcId>"`, now required. 2.9's
  fallback, "the NPC whose home desk is nearest", is dropped: it is ambiguous on a desk row, and the
  validator can name the owner instead. Its affordance comes from the `desk_phone` preset through
  `officeType` only when the scenario has `officePresets: true`; otherwise it is written out,
  `"affordance": { "useSeconds": 0, "capacity": 1, "seat": "stand" }`. The `desk_phone` preset gains
  `"seat": "stand"` too (seating reads `affordance.seat`, `seating.js` 1111-1112; seating is outside the
  decision log, so the preset parity test is unaffected). The phone sits within 1.5 tiles of the owner's
  home approach cell, so the owner can answer without moving (validator error otherwise). Its own
  approach cell, where a colleague stands, must not be the owner's chair spot: a phone beside a PC shares
  the PC's approach cell unless `useFrom` says otherwise, and that is where the owner's swivel chair was
  slid (`slideChairFootTo`, `seating.js` 1246-1247), so a colleague routed there could stall against the
  chair and time out (`_failJob('timeout')`, `npc-needs.js` 1437, 1459). The phone authors `useFrom` to
  the side, and the validator warns when its approach cell is within `NEAR_CHAIR` (36 px) of the owner's
  home approach cell.
- **The ring.** Any source emits `desk_phone_ring:<phoneId>`: a mapping's `emitEvent`
  (`npc-manager.js` 842) or an object's `triggerOnInteract` `emit_event` (`apply-actions.js` 114). No
  new action type. Timed messages emit no arbitrary event (`npc-manager.js` 1711-1737), so a timed
  ring needs a mapping on the message's delivery. It rings `rings` times (default 4), one every 3 s
  **of the needs clock**, so it pauses while a VM is open. A ring while the phone is ringing **or in a
  call** is ignored, so a second ring from the spare phone mid-call does nothing, and an owner arriving
  then does not answer a busy line.
- **The owner at its post answers there, as a call overlay, not a job.** Every use job walks to the
  target's approach cell and starts `using` on arrival (`_advanceJob` 1458-1475), seating keeps an NPC
  down only for a job on its own `needsHome` (`needsStop`, `seating.js` 1067), and a desk-phone use
  lasts 0 s. So the owner's answer is `s.call = { phoneId, until }` on the NPC state, set when the
  owner is idle at its post or in an own-desk use. While it holds: an own-desk use's `useUntil` is
  pushed back by the call (an idle owner simply selects nothing); there is no move, no
  `npc_left_post` and no wind-up; `needsStop` returns the post stop, so the owner stays seated; the
  typing bob is off (`typingBob` reads only `work` and `using`, `seating.js` 1095-1100); and the
  action icon is the phone. Seating reads the raw needs state (`seating.js` 1003, 1145), so it sees
  `s.call` directly; the action icons read `getState()` (`npc-action-icons.js` 47), which copies named
  fields only (`npc-needs.js` 2046-2066), so `getState` gains `call: { phoneId, remainingMs } | null`.
  Slice 21's idle swivel does not run during a call. **While `s.call` holds, `_tickNpc` returns after
  `_decay` and the return-path checks, before selection**, as it does for `scriptSuspended`
  (`_tickNpc` 659-731 otherwise runs `_select` for any idle NPC). Decay continues; a need that turns
  urgent waits for the call to end; a due print errand (17) stays due; a told NPC stays told and
  tempted (18b). Each starts on the first select after the call. Without this, a pizza announce or a
  due errand during a 30-50 s call would wind the owner up, emit `npc_left_post` and walk him off with
  the call still being voiced (OQ55). An owner who walks back in while it still rings
  answers on arrival, and **the owner wins**: a colleague on the way turns back with reason
  `answered`, with no grumble and no park.
- **The owner away misses it.** Walking, queued, using something else, in its wind-up (it has already
  decided to go) or talking to the player: the phone rings out and emits
  `desk_phone_unanswered:<phoneId>` `{ ownerId, playerNearby, playerDistance }`.
- **A colleague may walk over.** From the second ring, the nearest NPC with `answersPhones: true` in
  the phone's room that is idle at its post, not on a call of its own (`s.call`), and compatible with
  the owner (no avoidance, 7.3) takes
  an ordinary use job on the phone: a real leave, so its own screen window opens. It stands because
  the phone's affordance says `seat: "stand"`. Without that, the phone satisfies nothing, so seating
  falls to `near` and sits on a chair within 36 px, and the phone's required closeness to the owner's
  post, together with the "unless this is that spot too" exception (`seating.js` 1240-1242), would
  seat the colleague in the owner's chair. Its `useUntil` is set to the call's
  length the way `_startExchange` extends a pair's uses (`npc-needs.js` 1215-1223), not the phone's
  0 s; its `expectedAwayMs` uses the same length, so its lock habit (12.2) judges the call properly.
  The call (a knot, the `phone_message` pool, or a picture) and its length are chosen **when the
  colleague claims the phone**, because `npc_left_post` fires at the end of the wind-up (`_leavePost`
  1300-1313), before the colleague reaches the phone; a story still loading (`exchangeLines` returns
  null) falls to the pool for this call.
  The phone **keeps ringing while an answerer holds a claim on it**, so a wind-up (0.7 s,
  `npc-needs.js` 2201) and a long walk do not let it ring out. This is the lever: ring an empty desk
  and its neighbour leaves theirs.
- **Ring-out ends every answerer job.** When the phone rings out (no answerer arrived, or the only one
  was frozen in a player chat, which does not keep it ringing), every answerer job on that phone ends
  with the turn-back reason `rang_out` (12.4's table: no `mindChanged`, no grumble, no fallback select,
  straight home) and the call chosen at the claim is dropped. A frozen answerer has its job cleared and
  its `prevMode` set to `returning`, so the unfreeze runs `_goHome` (`_tickNpc` 682-683) instead of
  restoring the job and walking on to a dead line (671-680). One ring therefore fires either
  `desk_phone_unanswered` or `desk_phone_answered`, never both. **Any turn-back of a frozen answerer**,
  `answered` as well as `rang_out`, clears the job and sets `prevMode` to `returning` with no move;
  going through `_turnBack` would call `_goHome`, set `returning` over `frozen` and issue a `moveTo`
  during the chat (1621-1631) that the next tick cancels.
- **Half a conversation.** The answerer's `phoneCalls: [{ knot, requireGlobal }]` names ink knots in
  its own story whose lines are all its own (no `Name:` prefixes). They run on the slice 15 machinery
  (`exchangeLines`, a separate story instance, voiced in the answerer's voice through `_speak` with the
  per-line `overheard` flag, which hands it to `npcChatterVoice.say`, so slice 20's bed dips under a
  call the player hears), one line
  per bubble with a seeded listening gap of 1.5 to 3 s between lines, so the other half is silence.
  `preload` (`npc-needs-chatter.js` 144-148) also loads the stories of NPCs with `phoneCalls`, or the
  first call would find no lines. The audience rule is the exchange rule: same room, lit, in range,
  checked every line. **Through a listening gap the call holds the speech lock only while that check
  passes**; when the player leaves, the lock is released at once. The lock is global (`_speechUntil`,
  1138-1166), so holding it for a whole call of 30-50 s regardless would silence every bark and
  exchange in the building and turn a waiting announce (18b) into a picture.
- **The runner lives in the system tick**, beside the exchange runner (`_tickChats`, 1737-1811), not
  in `_tickNpc`, which returns early for an NPC in a chat with the player (659-671). **A call ends when
  its speaker enters a chat with the player**: the remaining lines are dropped, the speech lock is
  released, the knot stays unplayed (no `heard_<knot>`, no `npc_call_heard`), the overlay or the
  colleague's use ends, and the system emits `desk_phone_hung_up:<phoneId>`
  `{ speakerId, reason: "player" }`, so a scenario can map a "Sorry, had to go" beat. A call also ends
  when its speaker turns KO, hostile or hidden, or is script-suspended (the blocked branch, 644-651,
  aborts a job but would leave `s.call` set): the same drop and release, with `reason: "unavailable"`. The line already
  playing stops too: `npcChatterVoice` gains `cancel(npcId)`, which stops that NPC's audio and drops its
  queued lines (`say` 214-235 has no way to stop a clip today), so it does not play over the
  conversation's opening. `say` chains every line on one promise and, after `mgr.play`, waits out the
  clip's length with a `setTimeout` (225-234), so `cancel` also resolves that wait and marks the NPC's
  queued entries to skip; otherwise every later line, from any speaker, would wait out the cancelled
  clip. The hang-up sets the colleague's `job.useRemaining` to 0, since the freeze
  stored the call's remainder (663) and the unfreeze would restore it (676), leaving her standing
  silent at the phone after the chat. A colleague frozen on the way does not keep the phone ringing. Otherwise the
  speaker would go on voicing the call over the conversation's own lines, and a player in a chat with
  Tom would pass the audience check and complete "Overhear Tom on the phone" behind the chat window. Heard to the end, it sets `heard_<knot>` and emits
  `npc_call_heard:<knot>`, once per game. With nobody listening the call still happens (picture chat
  with the phone icon) and the knot stays unplayed. When every knot is heard, calls use the owner's
  `phone` pool or a colleague's `phone_message` pool, then picture chat. A colleague's knots are its own ("Tom's phone. No, he's stepped out.
  Can I take a message?"). A scenario-level pool is merged into every NPC's (`chatterPool`, 110-119),
  so lines that name the owner go on the owner (`chatter.phone` on Tom), and answerers draw from a
  separate topic, `phone_message`; scenario-level lines stay speaker-neutral.
- **Events.** `desk_phone_ringing:<phoneId>` `{ ownerId, ring }` per ring;
  `desk_phone_answered:<phoneId>` `{ ownerId, answeredBy, knot, playerNearby, playerDistance }`;
  `desk_phone_unanswered:<phoneId>`; `desk_phone_hung_up:<phoneId>`; `npc_call_heard:<knot>`.

**The cue.** Until a desk-phone ring is approved, the ring is **visual only**: 12.2's `flash` on the
phone (amber) each ring, or, with no lighting, 12.2's glyph layer showing the existing `phone1` sprite
(20×17, native size) pulsing in alpha only, never in scale (a scale tween would rescale pixel art),
over the phone, so no new art, and a 1 px rattle of the phone sprite for the ring's length (client only; the declared
position comes back after). `phone_vibrate` does not stand in: it is the player's own phone
(notifications category, `sound-manager.js` 87, 184), and players hearing it would open theirs. The
approved ring plays through `playAt` on its own limiter channel, with the hearing rule 2.9 set: full in
the phone's room, 0.4 through a door, silent further off. During a call the answerer's action icon is
the phone: `{ "sprite": "phone1" }` (20×17, existing, drawn at native size on the backing,
`npc-action-icons.js` 302-305) as the default, or a new 16×16 `npc-phone` icon **[approval]**.

**What changes from 2.9.** No preemption and no dependency on slice 12; the owner away misses the
call instead of getting up from a coffee; the owner's answer is an overlay, not a job; `phoneOwner` is
required and the phone must be within reach of the post and makes its user stand; a colleague can
answer, and the owner arriving wins; calls carry voiced half-conversations from ink and end when the
player opens a chat with the speaker; the ring is an event, not a mapping action. The sprite question stays:
`phone1` on a desk first, judged on a screenshot.

**Authoring.**

```jsonc
// the phone, on Tom's desk (presets on: officeType gives the affordance)
{ "id": "tom_phone", "type": "phone1", "officeType": "desk_phone", "phoneOwner": "tom",
  "takeable": false, "position": { "x": 2.4, "y": 5.3 }, "affordance": { "useFrom": { "dx": 1, "dy": 0 } } },
// without presets, the affordance is written out
{ "id": "front_desk_phone", "type": "phone1", "phoneOwner": "receptionist", "takeable": false,
  "affordance": { "useSeconds": 0, "capacity": 1, "seat": "stand" } },
// the lever: a spare phone the player can use
{ "id": "spare_phone", "type": "phone2", "name": "Spare desk phone", "takeable": false,
  "triggerOnInteract": [{ "type": "emit_event", "event_name": "desk_phone_ring:tom_phone" },
                        { "type": "hint", "title": "Desk phone", "message": "You dial Tom's extension." }] },
// the answerers: owner lines on the owner, a separate topic for colleagues
{ "id": "tom", "phoneCalls": [{ "knot": "call_supplier" }],
  "chatter": { "phone": ["Hello, Tom speaking.", "Can I call you back?"] } },
{ "id": "amara", "answersPhones": true, "phoneCalls": [{ "knot": "call_take_message" }],
  "chatter": { "phone_message": ["He's not at his desk.", "Can I take a message?"] } }
```

**Engine.** `npc-needs.js` about 245 lines (the parts below, 240, plus the frozen-answerer turn-back
without a move, 5): ring state and timing on the needs clock, with rings ignored
while ringing or in a call, 55, the call overlay at the post 40, the colleague's job with the call's
length, the claim that keeps it ringing and the `answered` turn-back 40, the `rang_out` end with the
frozen answerer sent home 10, no selection during a call 10, the call chosen at the claim 10, the call
runner in the system tick (one speaker, listening gaps, lines through `_speak`, the lock held only while
heard, audience, `heard_<knot>`, the hang-up on a player chat or an unavailable speaker) 65, `call` in
`getState` 5, the event payloads 5. `seating.js` about 10 (`needsStop`, the typing bob and the swivel read
`s.call`). `npc-action-icons.js` about 8 (the phone icon from `getState().call` for the owner, and for
a target with `phoneOwner` for the colleague, whose icon keys today, `pickIconEntry` 92-100, match
nothing in `DEFAULT_ICONS` and show the fallback dot). `npc-needs-chatter.js` about 18 (`preload` for
`phoneCalls`, `cancel(npcId)` with the wait resolved and queued entries skipped). Visuals about 25 (flash or glyph, rattle, the ring channel once
approved, the phone icon). Validator about 40: `phoneOwner` exists and has a `needsHome` in the phone's
room (error); the phone within 1.5 tiles of the owner's home approach cell (error); a `phoneOwner`
object with no resolved affordance (error: presets off and none written), or whose resolved affordance
does not stand (error); the phone not takeable (error); a scenario-level `phone` line that contains an
NPC's display name (warning: every NPC may say it); each `phoneCalls` knot exists in that NPC's story and every line is the NPC's own, with no line
that `splitPrefix` would read as a speaker prefix (error, since it is refused at run time), and the NPC
has a voice (warning); `heard_<knot>` declared (warning); an `answersPhones` NPC with no phone in its
room (warning); `phone` pool lines pass the pool checks. Schema about 20 (`phoneOwner`, `rings`,
`answersPhones`, `phoneCalls`; `seat` in the preset). **About 366 lines (245 + 10 + 8 + 18 + 25 + 40 +
20), L.** No server change: ink lines are already
extracted and validated, and the `phone` pool is a scenario-level chatter pool.

**What the player sees and hears.** Tom's phone rings while he types; he stops typing and picks up
without standing, and the player, nearby, hears his half: "Yes, Tuesday's fine... No, the big boxes."
Ring it again while he is in the kitchen: it rings out. Ring it a third time from the spare phone with
Tom away: Amara gets up, walks round and answers it, and her own screen is unattended for the length
of the call.

**Showcase.** `test_needs_sims`: `tom_phone` on Tom's desk, `spare_phone` on an empty desk, Tom's
`call_supplier` knot and Amara's `call_take_message` knot (neutral content; the npc-dialog-review
skill runs on both), a `phone` pool. Objectives: "Overhear Tom on the phone" on
`npc_call_heard:call_supplier`; "Ring Tom while he is out and see who answers" on
`desk_phone_answered:tom_phone` with `data.answeredBy === "amara"`; "Tom misses a call" on
`desk_phone_unanswered:tom_phone`.

**Tests.** Node: a ring with the owner idle at the post is answered there, with no `npc_left_post` and
the `needsStop` key unchanged across the call (the owner stays seated); with the owner in an own-desk
use, the use is extended, not aborted, and the typing bob is 0 during the call; the owner away, and the
owner in its wind-up, give `desk_phone_unanswered` once, after the last ring; the owner arriving
mid-ring answers; a colleague answers only from the second ring, only if idle, compatible and in the
room, its answer is a real leave with `useUntil` and `expectedAwayMs` at the call's length, it stands
(the owner's chair stays empty), and the phone keeps ringing until it arrives; the owner arriving first
turns the colleague back with `answered` and no grumble; a chat opened on the second line leaves the
knot unplayed, fires no `npc_call_heard`, releases the lock and emits `desk_phone_hung_up`; the lock is
released in a gap once the player is out of earshot; `getState().call` is set during a call; an
colleague frozen in a chat on the way, then the phone rings out and the chat ends: she goes home, with
one `desk_phone_unanswered`, no `desk_phone_answered` and no call lines; a ring during a call is
ignored; an NPC on its own call is never chosen to answer; a speaker turned KO or script-suspended ends
the call with `reason: "unavailable"`; call lines go through `_speak` with `overheard`; an
urgent need, a due print errand and a tempted magnet each start no job during a call and start on the
first select after it; a hang-up stops the line in flight, the colleague's remainder is 0, and a
colleague frozen on the way does not keep it ringing; the call is chosen at the claim and a pending
story falls to the pool; the colleague stands at a side cell, not on the owner's chair spot; a second ring while ringing is ignored; the ring pauses with the
needs clock; `preload` loads a `phoneCalls` NPC's story; call lines in order with gaps, the lock held
through the gaps, audience checked per line, `heard_<knot>` once and not replayed after a reload; no
audience leaves the knot unplayed; determinism. Live: the three cases above with screenshots and the
`/tts` request log, including a screenshot of Amara standing at Tom's phone with his chair empty, and a
chat opened with Tom mid-call, and a chat with Amara on her way to the phone until it rings out (she
goes home after the chat, one `desk_phone_unanswered`, no call lines); the flash and rattle in the office, nothing from the lounge; the leash and lab
regressions.

**Risks.** A call extends an own-desk work use, which shifts that NPC's next selection by the call's
length (deterministic, and the README table notes it). A visual-only ring is easy to miss until the
sound is approved. A colleague crossing a room to a phone can collide with walkers at a desk row; the
job uses the ordinary move, so the usual stall recovery applies.

**Built: 2026-11-07 (slice 19: engine, validator, schema and tests c95a2fcb2, 108a0b557; showcase 108a0b557; fixes from the live proof
ba7975873, a6f2d927e; the open-door ring 7dfc15b06).** Regressions: `test_needs_leash` game 967 (pass: leashed 0 samples on Maya's
floor, unleashed 6), `lab_physical_pentest` game 968 (score 100, 9/9 tasks, keylogger creds 63.3 s, USB foothold 9.5 s, 0 "No path" /
"Failed to escape wall"; the lab has no desk phones, so nothing changed); sims live proof games 963, 964, 965 (lighting off), 966; see
`HANDOVER_OFFICE_S19.md` and the README table. `bin/test-js` 408 files pass, `npc-desk-phone` 25 tests, `npc-office-visuals` 35,
`GOLDEN_SIMS_DAY` unchanged. As written, with these choices made without asking: (1) the owner picks up 2.25 s after the first ring
(`PICKUP_MS`, one double ring heard), not at once; an owner arriving later answers at once. (2) A call line is voiced only with the
player in earshot at that line, else it shows as the phone picture (no `/tts` request) and the knot stays unplayed; a call with no
lines left is three phone pictures; a pool call is up to three lines from the speaker's bag. (3) With the speech lock busy at a line's
start the call waits and is pushed back, its use too, as exchanges queue. (4) A colleague's phone use ends when its call ends (tick
rounding can carry a call past `useUntil`). (5) No `npc_announced` news while on a call. (6) `desk_phone_answered` /
`desk_phone_unanswered` carry the player's distance to the phone (`playerProximityAt`). (7) **The ring is heard in the phone's room
and, by the user's decision of 2026-11-07, at 0.4 of the in-room level from an adjacent room whose connecting door is open (a door that
was opened loses its sprite on both sides, so no sprite or `open: true` counts as open); silent with the door shut or further away**
(`openDoorHearing`, `playAt` `openDoorOnly`; `RING_SCALE` 0.8; live: kitchen with the door open, hearing 0.4, volume 0.087 at 174 px,
`desk_phone_ring_heard` emitted; the shut case was proved with a synthetic closed door sprite, since the engine cannot re-shut a
door, and by the node test). The first build was the phone's room only. (8) A ring warms the answerers' stories (`warmStory`), since
`preload` at install sees no NPCs. (9) `phone1` stays as the call icon and ring glyph; `npc-phone` is used only by picture chat.
(10) Showcase phones use `position.elevation: 24` to draw on the desk. (11) The validator needs `useFrom` on every phone (warning)
and checks reach only when both objects declare positions. (12) `validator-office-presets.test.mjs` lists `tom_phone` among the sims
preset objects. Live results: the amber flash caught at 0.15 s (game 964); the phone1 glyph without lighting (965); silence from the
kitchen under the first build (game 964, hearing 0, no `desk_phone_ring_heard`; superseded by 7); Amara answering at a side cell with Tom's chair empty
(964); Tom arriving first, `npc_turned_back` `answered` (964); a ring-out with `rang_out` while Amara was held in a chat (964); a
player chat ending Tom's call, `desk_phone_hung_up` reason `player` (966). Not seen live: a `cancelled` entry in `npcChatterVoice.log`
(on the keyless server a clip resolves at once, so nothing is in flight; the node test covers it).

### 12.6 Room tone (slice 20)

**Built: 2026-11-07 (slice 20: engine and tests 881c13d1a; validator and schema 8ad1c6e4e; showcase 8006044a0; fix from the
live proof 83f3b58e9). Live proof games 995 and 996 (sims README "Slice 20"); sis01 without `roomTone` game 999; leash game 1000
(pass); lab game 1001 (score 100, 9/9 tasks; creds 63 s, USB foothold 12 s, tailgate passed first time); `bin/test-js` 410 of 411
files pass, the one failure `desk-footprints.test.mjs` from the seat box commit 594226d2c; `room-tone.test.mjs` 17 tests,
`GOLDEN_SIMS_DAY` unchanged; see `HANDOVER_OFFICE_S20.md`. A listen on a machine with audio is still needed: headless audio is
inaudible, so every beat was checked through the sound manager's volumes and logs.** Built as the design below reads; the choices
made without asking: (1) spots, `startSound` and `outputSound` are heard in the player's room only (`ownRoomOnly`), not through an
open door, so `openDoorHearing` is not used; (2) the new loops ship as OGG only, because no MP3 fallback files exist, so Safari would
not play them; (3) a spot rolls at chance 0.5 per 20 s slot, typing levels are 0.4 / 0.6 / 0.75 for one, two and three typists, and
spot scales are copier 0.6 and distant phone 0.5 of a use sound; (4) a profile with no bed (meeting) falls through to step 3, an
authored neighbour loop, as the four-step order reads; (5) room tone installs inside the needs install chain in `game.js`, so a
`roomTone` scenario with no needs NPCs gets no room tone; (6) the validator warns in every scenario about an authored
`ambientSound` that is not loaded (today only sis01 `ward_7`, `hospital_ambient`). Typing volumes read half the table (0.2, 0.3,
0.375) because they multiply the music setting (0.5). **Open for the user:** (a) the shipped `fadeAmbientTo` path has the same
start spike that 83f3b58e9 fixed on the room-tone paths (Phaser's `play({ loop: true })` undoes its `setVolume(0)`), so a shipped
ambient loop can start near full and fade down; it was left alone on purpose. (b) The office and kitchen OGG loops have a seam
step at the very top of their own sample-step range (kitchen 0.078 against an in-file maximum of 0.051), so each wrap may carry a
faint tick; it needs a listen, and if audible a short wrap crossfade baked into the two files fixes it.

**Fix after the build (2026-11-07, commit 977099989):** the shipped `fadeAmbientTo` start spike is fixed. A new ambient is now zeroed straight after `play`, so it fades in from silence instead of starting at its base volume for a frame (live proof sis01 game 1030). See `HANDOVER_OFFICE_FIXES_S20S22.md`.

**Design.** Two layers, both heard only from the player's room.

**Opt-in, and what shipped missions keep.** Everything in this slice that changes which loop plays, or
at what level, runs only when the scenario sets `"roomTone": true`: the bed order, the profile beds,
"own room first", the null-room keep, the crossfade and the preference for an open door. A scenario
without `roomTone` keeps today's `recalculateAmbientVolume` and `fadeAmbientTo` behaviour, with one
change: **a key that is not loaded fades the current loop out over the usual 400 ms instead of
stopping it at once.** The level it ends at is the same as today (silence), so no audible level
changes; only a hard cut becomes a fade. The fade goes **through the existing volume-0 path**,
`fadeAmbientTo(current, 0)` (`sound-manager.js` 374-389), which keeps its tween in `_ambientTween`, so a
step straight back finds the loop playing, stops that tween and tweens it up (395-415); never through
`stopAmbient(400)` (327-349), whose untracked tween would stop the loop the player had just stepped back
into. In shipped missions that touches exactly two sis01 rooms, `ward_7` and `it_security_office`,
both through `hospital_ambient` (`sis01_healthcare/scenario.json.erb` 727): `ward_7` authors it, and
from `it_security_office` the rooms-order loop reaches `ward_7` first as a neighbour (`ward_7` 716,
`it_security_office` 1676, `major_incident_room` 2125; connections 740, 1691-1694, 2135-2137).
`major_incident_room` does not change: `it_security_office` is adjacent and comes first in rooms order,
so the loop plays the ventilation bleed and returns before it reaches the room's own `office_ambient`.
For the same reason **approving the `office_ambient` file changes no shipped mission** without
`roomTone`; that room plays it only with `roomTone` (step 1 of the bed order). Nothing else in m01-m10, sis01 or sis02 changes.

Why the gate: built for everyone, "own room first" would raise authored levels that playtests have
never heard. In rooms order, an earlier adjacent ambient room wins today, so these rooms play a
neighbour's 0.125 or 0.01 instead of their own level: m04 `battery_hall_2` (its own 0.6;
`battery_hall_1` is listed first), m09 `server_closet` (0.4), `restricted_cage` (0.5), `tape_room`
(0.35) and `salvage_cage` (0.6), and sis01 `it_security_office` (0.25, silent today because `ward_7`'s
unloaded key comes first and cuts the loop). Those missions belong to the other session. With
`roomTone` on in a local copy, those are the rooms whose levels change, and the live check listens to
two of them.

- **A bed** (with `roomTone`): one quiet loop per room profile (air handling and distant murmur for an
  office, a fridge hum for a kitchen, near silence for a meeting room), on the existing ambient track.
  Which loop plays is decided in this order:
  1. the player's room's **authored** `ambientSound`, at its `ambientVolume`;
  2. the player's room's **profile bed**, at the profile level;
  3. an adjacent room's **authored** loop, at today's 0.125 with the door open or 0.01 shut; with two
     authored neighbours, one with an open door first, then rooms order (sis02's
     `scada_control_room` touches `battery_hall_1` and `engineering_workshop`; three m09 rooms have two
     each);
  4. nothing.
  Profile beds never bleed into a neighbour. So m01's server room keeps `server_room_ventilation` at its
  authored 0.4 (`m01_first_contact/scenario.json.erb` 2070), and in `it_room` next door (`room_it`, a
  profile bed) the office bed replaces today's 0.125 bleed of the ventilation, a deliberate change when
  the scenario sets `roomTone`; the m01 copy used for the north-south proof sounds different for that
  reason.
- **A key with no sound.** `fadeAmbientTo` stops the current loop on a key change **before** it checks
  the new key exists (`sound-manager.js` 366-372 against 393), so an unknown key cuts the loop the
  player came from. It now checks the key first. With `roomTone`, the resolver treats a key missing from
  the audio cache (not yet approved, or never made) as "no bed" and moves to the next step, so the bed
  already playing is not cut. Without `roomTone`, an unknown key fades the current loop out through the
  volume-0 path, as above. The office bed is keyed `office_ambient`, so sis01's `major_incident_room`
  would play it once approved **if sis01 sets `roomTone`**; without it nothing reaches that key.
  `hospital_ambient` stays unloaded until someone makes it.
- **The calls.** `core/rooms.js` calls `fadeAmbientTo(key, level, ms, { crossfade })` with
  `crossfade: true` only under `roomTone` (the sound manager has no scenario access), and the sound
  manager stores the current normalised level in `_ambientLevel`, so the duck can re-apply it. The choice
  of key and level is a pure function in a small new module (`systems/ambient-choice.js`: rooms order,
  player room, door states, `roomTone`, profiles and loaded keys in; key and level out), called by
  `core/rooms.js`, because `recalculateAmbientVolume` is private (3169) and no node test imports
  `core/rooms.js`; the module joins the test-harness copy lists.
- **Room tone at spawn and after a reload.** `recalculateAmbientVolume` has two callers, a room change
  (3113) and a `door_opened` touching the player's room (3160-3165). The first room change happens in the
  first frames after spawn, before the dynamic imports and the profile table's fetch resolve
  (`core/game.js` 1954-1969), so step 2 has no table and the start room would stay without a bed until
  the player left it. `core/rooms.js` exports `refreshAmbient()` (a recalculation for
  `currentPlayerRoom`), and `office-room-tone.js` calls it once the profile table has loaded, at install.
- **No bleed by default.** With beds in every profiled room and the player's room checked first, the
  track always plays the player's own room's bed, so a neighbour's bed is not heard through a door.
  Bleed would need a second, quieter neighbour channel, built only if the user asks for it.
- **Crossfades that can turn back** (with `roomTone`). Today `fadeAmbientTo` holds one tween,
  `_ambientTween`, stops the old loop at once on a key change, and for a key already playing tweens it
  from its current volume (360-404). A crossfade keeps the **outgoing sound and its tween in their own
  fields** (`_outgoing`, `_outgoingTween`) and fades it to 0 over the same 400 ms. When `fadeAmbientTo`
  is asked for the outgoing key while it is still fading (the player steps back through the door),
  it cancels that fade-out, tweens the sound up from its current volume, and fades the other one out.
  Without this, A to B and back to A inside 400 ms would leave A's fade-out running: A stops and the
  room the player stands in goes silent until the next room change or door event. A to B to C fades
  both A and B out and leaves C: when a new outgoing sound replaces one still fading, the older one is
  stopped at once, so no untracked fade-out is left to stop A if the player then goes C to A. About 15 lines more than a plain crossfade, in shared code, named in
  the slice report.
- **North and south doorways** (with `roomTone`). A room's top two tile rows are wall, outside its floor
  (`updatePlayerRoom`, `core/rooms.js` 3074-3103), so walking through a north or south door the player's
  feet are in no room. `updatePlayerRoom` still calls `recalculateAmbientVolume(null)` before its "keep
  previous" return (3113-3117), and with a null room the loop ends in a fade to 0 (3207), so the bed
  drops out in the doorway and the next one starts after it. With `roomTone`, a null room leaves the
  current bed as it is, as the comment at 3116 already intends. Without `roomTone` the doorway dip stays
  as it is today (m01's server-room door joins `it_room` to the north, 2067-2071).
- **Spot sounds**, one-shots gated with `ownRoomOnly` (12.2) and played only with `roomTone`: **activity
  first**.
  - **Use sounds** stay as slice 3 built them: one `useSound` per affordance, at completion, in every
    scenario as today.
  - **`affordance.startSound`** is new: played when the `using` phase starts, so a coffee machine can
    grind at the start of a use and `drink_gulp` still plays at the end. The needs system emits nothing
    when `using` begins (`_advanceJob` 1475-1478 only logs), so it gains `npc_use_started:<objectId>`
    `{ npcId, objectId, need }` there, and the visuals play `startSound` on it. It is emitted through
    `world.emit` directly, not `_emit`, which calls `_worldChanged` (480-483) and would drop the
    per-tick object cache; the tick-cost bound (`objectScans <= ticks + 40`,
    `test/js/npc-needs-tick-cost.test.mjs` 95) is re-run.
  - **`affordance.outputSound`** is new: played at the producer on `object_revealed:<slot>`, which the
    adapter already emits with `producerId` (`npc-needs.js` 2531). Nobody uses the copier (the print
    comes from the PC's hook, 1524, and the copier preset satisfies nothing), so a copier is heard when
    it prints. A cosmetic copy emits no `object_revealed` (2525-2534), so the adapter emits
    `object_revealed:<producerId>` with `cosmetic: true` when it makes one, and the visuals play
    `outputSound` for it **under the same gates** (`roomTone`, `ownRoomOnly`); the adapter never plays a
    sound itself. `outputSound` plays only for a payload with a `producerId`: `object_revealed` also
    fires for left-behind items (`npc-needs.js` 2571), which must stay silent. (Core reveals, the pizza's
    included, emit nothing; only `npc-needs.js` emits it, 2531 and 2571.)
  - **Behind `roomTone`.** `startSound` and `outputSound` sit in the `coffee`, `kettle` and `copier`
    presets, but the office visuals play them only when the scenario sets `roomTone`, so a presets-on
    scenario without room tone hears nothing new once the files are approved.
  - **The kettle gets its own preset.** `kettle` and `kettle1` are in the `coffee` preset's types
    (`office-presets.json` 5), so a kettle and a coffee machine could not sound different by default.
    A new `kettle` preset with the coffee values (so every decision log is unchanged) adds
    `startSound: kettle_boil`; `coffee` adds `startSound: coffee_machine`; `copier` adds
    `outputSound: copier_run`. The validator's `officeType` enum gains `kettle`.
  - **Typing**: while one or more seated NPCs in the player's room are in a `work` use (the state
    `typingBob` already reads), a soft typing loop plays, louder with more typists, capped at three.
    Seating publishes the count per room once per frame from its existing loop (`seating.js`, about 5
    lines); nothing is computed per NPC pair. The typing loop ducks with the bed and stops on a room
    change; the credits stop it with every other loop (`silenceBackgroundForEnding`,
    `music/ending-audio.js` 69-85).
  - **Background spots** fill the gaps: every 20 s of needs clock, a seeded roll per room
    (`seededRoll(seed, roomId, 'tone:' + slot)`, `npc-needs.js` 153) may play one sound from the
    profile's list, filtered by what the room holds (no copier spot in a room with no copier). A distant
    phone never plays in a room with a declared desk phone, so it is not mistaken for 12.5's ring.
- **Levels by room type.** Profiles live in `public/break_escape/js/data/room-tones.json`, beside the
  office presets, read by the module and by the validator (one table, as 2.1 did). A room's exact
  `type` picks its profile; a scenario maps bespoke types with `roomToneTypes` (the lab's
  `room_lw_accounts` to `office`). Seven default types, three beds, and no bed beyond those:

  | Room type (uses across scenarios) | Profile | Bed | Bed level | Spots |
  |---|---|---|---|---|
  | `room_office` (102) | office | `office_ambient` | 1.0 | typing, copier, distant phone |
  | `room_reception` (23) | reception | `office_ambient` | 0.6 | distant phone |
  | `room_it` (5) | it | `office_ambient` | 0.8 | typing |
  | `room_ceo` (13) | quiet_office | `office_ambient` | 0.35 | none |
  | `room_meeting` (4) | meeting | none | | none |
  | `room_break` (3) | kitchen | `kitchen_tone` | 1.0 | kettle, coffee (through their `startSound`) |
  | `room_servers` (18) | server | `server_room_ventilation` (exists) | 0.6 where nothing is authored | none |

  A meeting room is quiet by design: no bed, so the previous room's bed fades out on entry. A room type
  not in the table and not mapped has no profile and no bed.
- **Installing.** `office-room-tone.js` is imported in `core/game.js` beside the office visuals
  (1966), and installs only when the scenario sets `roomTone`.
- **`server_room_ventilation` stays an MP3.** It exists (credited CC0, BigSoundBank, `sound-manager.js`
  116-117) and is used by m01, m04, sis01 and sis02 as the server-room bed and by m09 as a stand-in
  loop. It needs no approval; it joins the live seam check, since MP3 padding can gap at the loop point.
- **Volume.** Beds and spots go through Phaser, so they follow the player's **SFX** slider, as every
  ambient loop already does (`music/music-widget.js` 186-195; `volumeSettings.music` is a constant 0.5
  that nothing changes, `sound-manager.js` 447). No new volume category.
- **Speech stays clear** (with `roomTone`). While a needs line **that the player hears** is playing
  (`_speak` passes `overheard`; calls go through `_speak` too, 12.5; the lock itself is taken for every
  bark, heard or not, 1163-1167, and a grumble two rooms away must not duck the office) **or any
  conversation minigame is open** (a voiced person-chat or phone call with the player, which the lock
  does not cover), the bed ducks to half and no spot starts. The duck is a multiplier held inside
  `sound-manager.js`, applied in `fadeAmbientTo`, so the next `recalculateAmbientVolume` (on a room
  change or a door event, `core/rooms.js` 3113, 3164) keeps it instead of undoing it.

**Sounds needed, all [approval].** Nothing in `assets/sounds/` covers these (12.1).

- **Source: Freesound, CC0 only.** Freesound also hosts CC-BY and CC-BY-NC files, so filter by
  licence. No Sonniss bundles: their licence forbids redistributing the files as assets in their own
  right, and the repository has a public GitHub remote.
- **Credits** follow the existing convention: a comment above each `load.audio` line with the licence,
  author and source (`sound-manager.js` 63, 72, 91).
- **Format.** Loops (the beds and the typing loop) ship as **OGG**: MP3 encoder padding leaves a short
  gap at the loop point in browsers. Phaser takes a list of URLs, so an MP3 can sit beside it as the
  fallback; the seam is checked live, not in an editor. One-shots stay MP3, like the existing files.
- **The chimes are not files**: they are synthesised at run time (12.2), as the tube's click is.
- No intelligible speech in any recording.

| Key | What | Length | Format | Used by |
|---|---|---|---|---|
| `office_ambient` | office bed: air handling, faint murmur | 20-30 s loop | OGG | 12.6 bed (and sis01's `major_incident_room` only if sis01 ever sets `roomTone`) |
| `kitchen_tone` | fridge hum | 10-20 s loop | OGG | 12.6 bed |
| `typing_loop` | soft keyboard typing | 4-6 s loop | OGG | 12.6 typing |
| `copier_run` | copier printing a few pages | 3-5 s | MP3 | copier preset `outputSound`, spots |
| `kettle_boil` | kettle coming to the boil, click | 4-6 s | MP3 | kettle preset `startSound` |
| `coffee_machine` | grind and pour | 3-4 s | MP3 | coffee preset `startSound` |
| `desk_phone_ring` | UK double ring, one cycle | about 2 s | MP3 | 12.5 ring |
| `distant_phone` | the ring through walls | about 2 s | MP3, made from `desk_phone_ring` with an ffmpeg low-pass | 12.6 spots |

Eight files: seven Freesound downloads and one ffmpeg derivative, plus the two run-time chimes of
12.2. Until a file is approved its layer stays silent (OQ16's rule: never a placeholder that reads as
something else, which is why `phone_vibrate` stands in for nothing). `server_room_ventilation` stays
the server-room bed.

**Authoring.**

```jsonc
"roomTone": true,
"roomToneTypes": { "room_lw_accounts": "office", "room_lw_kitchen": "kitchen" },
// a room can still name its own loop, which wins
"server_room": { "type": "room_servers", "ambientSound": "server_room_ventilation", "ambientVolume": 0.6 },
// an object can still name its own sounds, which win over the preset
{ "id": "lounge_kettle", "type": "kettle1", "affordance": { "startSound": "kettle_boil" } }
```

**Engine.** New `systems/office-room-tone.js` about 105 lines (profile lookup, the bed fallback, the
spot scheduler, typing by count, the duck conditions, the `refreshAmbient()` call once the table loads);
`npc-needs.js` about 5 (`npc_use_started`); `core/rooms.js` about 28 (behind `roomTone`: the four-step bed
order through the pure choice, the open-door preference, no change on a null room, a missing key treated
as no bed; the exported `refreshAmbient()`); new `systems/ambient-choice.js` about 10 (the pure choice of
key and level); `sound-manager.js` about 55 (the new keys in both lists with OGG and MP3 URLs for loops,
the crossfade with the outgoing sound and its tween tracked, reversed and an older one stopped, the
`{ crossfade }` option and `_ambientLevel`, the duck multiplier, the key check before the stop, the
fade-out for an unknown key through the volume-0 path without `roomTone`); `npc-office-visuals.js` about 15 (`startSound` on `npc_use_started`, `outputSound` on
`object_revealed` with a `producerId`, both gated); `seating.js` about 5 (the typist count); the adapter
about 3 (the `cosmetic` emit); `core/game.js` about 3 (the install); `office-presets.json` the `kettle`
split and the three sound fields; validator about 30 (unknown profile or mapped type, profile sounds
loaded, `roomTone` with no room that resolves to a profile, a `useSound`, `startSound` or `outputSound`
key not loaded, an authored `ambientSound` key not in `loaded_sounds` (warning), profile bed keys not
loaded (info until the approval list clears, or every `roomTone` scenario would warn), the `kettle`
preset in the `officeType` enum); schema about 20 (`roomTone`, `roomToneTypes`, `affordance.startSound`,
`affordance.outputSound`). Any new static import goes on every test-harness copy list (memory note
`js-test-harness-copy-list`). **About 279 lines (105 + 5 + 28 + 10 + 55 + 15 + 5 + 3 + 3 + 30 + 20),
L.**

**What the player hears.** In the office, a low hum and keyboards while people work, the copier when
it prints; walking through the kitchen door the hum crossfades to a fridge, and the kettle when someone
makes tea; in the lounge, quiet. Nothing from a room the player is not in. The bed dips under a voiced
line, a call the player hears, or a conversation.

**Showcase.** `test_needs_sims`: `"roomTone": true` (its three rooms are `room_office`, `room_break`
and `room_meeting`, all default profiles). Objective "Hear the office at work" on a new
`room_tone_started:<roomId>` (once per room, when its bed first plays). Live: the play log from each
room and doorway (spots only from the player's room, the bed's volume by room); a recorded walk through
one east-west and one north-south doorway with no gap in the bed, and a step back through a door
inside 400 ms; typing level with one, two and three seated workers; ducking under a voiced bark, a call
and an open person-chat (request log on keyless :3001); the copier's sound on a print with nobody at
the copier. **Local copies of shipped missions, never committed** (generated and deleted by the check,
as slice 1's 15-NPC copy is): m01 with `roomTone` on, for the north-south door (its server room gives
the one loaded bed, so the proof works before any approval); m04 with `roomTone` on, standing in
`battery_hall_2`; sis01 with `roomTone` on, standing in `it_security_office`, and stepping between
`major_incident_room` and `it_security_office`. Each shipped mission is also played once **without**
`roomTone` (the real files) to show nothing changes apart from sis01's fade-out of an unknown key in
`ward_7` and `it_security_office`. **At spawn:** in the showcase office, without moving, the fade-call log
shows the office bed starting once the profile table loads, and again after a reload. **Slice report:**
names the two new validator warnings in sis01 (its authored `hospital_ambient` and `office_ambient` are
not loaded), so the other session is not surprised.
Until at least one new bed file is approved, the playback proof is the play log and the fade calls,
not audio.

**Tests.** Node: profile resolution (exact type, scenario map, authored `ambientSound` wins); the spot
scheduler is seeded and respects the room's objects; no distant phone with a desk phone present;
typing count capped; ducking while a heard line or call plays or a chat minigame is open, not for a
line the player does not hear, kept across a `recalculateAmbientVolume`; with `roomTone`, a null room
keeps the current bed, the four-step bed order holds, two authored neighbours prefer the open door, and
an unknown key leaves the current bed playing; without `roomTone`, `recalculateAmbientVolume` gives
exactly today's choices (rooms order, the null-room fade, tested on the pure `ambient-choice.js`), and
an unknown key followed by the previous key within 400 ms leaves the previous key playing (the volume-0
path); a resolver call before the profile table loads gives no bed and `refreshAmbient()` after it gives
the office bed; A to B to C to A inside the fades leaves A playing; an unknown key fades out instead of
stopping; the crossfade (with the tween stub the sound-manager tests use, or a fake scene): A to B to A
inside 400 ms leaves A playing at its level and B stopped, and A to B to C leaves only C;
`startSound` and `outputSound` silent without `roomTone`; `outputSound` only with a `producerId`, and
for a cosmetic copy through the visuals; the tick-cost bound holds with `npc_use_started`;
`npc_use_started` fires once per use; `startSound` plays at `using` start and `useSound` at completion;
the preset parity test is byte-identical with the `kettle` split.

**Risks.** Loop seams and fatigue over a 30-minute session: OGG loops, a live seam check, and low
starting levels. Room types are bespoke in many scenarios (`room_aw_*`, `room_lw_*`), so the default
table covers few rooms until a mission maps them. A mission that later sets `roomTone` hears the level
changes listed above; whoever opts it in plays those rooms first. If the user wants a neighbour's bed
heard through an open door, that is a second channel and about 30 more lines.

### 12.7 Idle swivel (slice 21)

**Built: 2026-11-06 (slice 21: engine, validator, schema and tests 9779363f6; showcase cbfe37bea).
Regressions: `test_needs_leash` game 899 (pass), `lab_physical_pentest` 900 (score 100); sims live proof
games 896 and 897; see `HANDOVER_OFFICE_S21.md`.** As written (`fidgetOffset`, `fidgetStep`, `newFidget`,
`isTyping`, `idleMotionHeld`, `swivelFacing`, `listenTarget`, `swivelEnabled` in `seating.js`;
`_buildSpeakers` and `speakers` in `npc-needs.js`; `bin/test-js` 402 files pass, the sims-day golden
unchanged), with these choices made without asking: (1) where a facing has an east or west part
(diagonals too, not only east and west), `x` rolls only away from the desk, 1 to 2 px; where it has a
north or south part, `y` is 0 or 1 px away; a roll is never zero; north- and south-facing chairs roll
1 to 3 px either way along `x`. (2) A hold mid-roll eases straight back rather than finishing the
hold. (3) The speakers list has chat, exchange and picture lines and grumbles; call speakers wait for
slice 19, which must add them (the `s.call` hold is already read). (4) The listening position is the
body centre, as `npcPos`, for both NPCs; no line-of-sight check. (5) `swivelChance` is an NPC field
(schema, 0 to 1) beside `swivel`; the validator also errors on a `swivelChance` out of range. (6) The
event fires on each turn away from `homeFacing` (including a listener following a moving speaker),
not on the return. (7) The showcase maps `npc_swivelled:*` (any NPC) with `reason === "listen"`, not
Tom alone: Tom is often typing when a line is spoken, and the Coffee Notice's turn-back grumble
turned Amara, Tom and Grace in game 896. (8) Reduced motion does not stop the roll or the swivel
(the plan does not ask it to; the typing bob still honours it).

**The user's note (2026-11-06, OQ45):** "Do some small rolling motions mostly along x with just a
little swivel very occasionally." So the idle motion is mostly a **chair roll along x**, and the
swivel below becomes rare.

**The roll.** It already exists: `fidgetChair` and `fidgetOffset` (`seating.js` 912-948) roll a seated
NPC's swivel chair up to 3 px sideways and 2 px back, relative to its facing, every 4 to 11 s, eased
over 700 ms, using `Math.random`. Slice 21 retunes it rather than adding a second motion:
- **Mostly x on screen.** `fidgetOffset` returns `x` within ±3 px and `y` within ±1 px in screen
  terms, never towards the desk: for a chair facing east or west, `x` moves only away from the desk,
  up to 2 px.
- **Out and back.** Each roll goes out, holds 1 to 2 s, and eases back to where the NPC sat down, in
  place of today's 30% chance of returning.
- **Held** under the same conditions as the swivel (the "When" list below: a call, a pairing, a line,
  typing, a chat with the player), not only during a chat with the player as today.
- **Cosmetic and unseeded** (OQ34): it keeps `Math.random`, is outside the decision log and emits no
  event. It moves only the chair and figure sprites (`placeBody` as today), never the NPC's position
  for pathing.

**The swivel**, now rare. A seated needs NPC on a swivel chair very occasionally turns its chair a
little and back.
No new frames: `setChairFacing` (301-310) already turns the chair, and the atlases have all eight
seated facings. Only Tiled map chairs are swivels (`core/rooms.js` 2546-2549); a scenario-placed
chair is a static seat and never turns, so the lab's staff, on static seats
(`lab_physical_pentest/scenario.json.erb` 1115-1121), are unaffected.

- **When.** Only while seated at its post and idle, or in a non-`work` use; never during a phone call
  (`s.call`, 12.5); never while paired at a chatter object or saying a line (`_chatPartner`,
  `_talking`); never while typing (the `work` use's `using` phase), never while talking to the player (which already turns the chair,
  1201-1213), never on a static chair, KO or hostile, and never for an NPC with `los.enabled`: turning
  the chair sets `behavior.direction` (`seating.js` 1211), which LOS cones read (`npc-los.js` 163).
  No seated needs NPC has `los` today; the validator warns if one gets both.
- **How, deterministic and cheap.** The needs clock is cut into 6 s slots. Each slot, a seeded roll
  `roll(npcId, 'swivel:' + slot)` below `swivelChance` (default **0.05**, about once in two minutes,
  lowered from 0.25 for the user's "very occasionally") turns the chair one compass
  step left or right (the same roll picks which, and a hold of 2 to 4 s), snapped to the chair's
  valid facings, then back to `homeFacing`. A pure function, `swivelFacing({ state, clockMs,
  homeFacing, valid, roll })`, gives the facing for any moment, so a frame never stores state and a
  reload replays the same. It stops with the needs clock, as the typing bob does. The swivel stays
  on the keyed roll, not `Math.random`, because its rate and the `npc_swivelled` event are tested;
  `roll` draws from its own stream (`npc-needs.js` 262-270), so it moves no other roll and no
  decision-log line, which keeps OQ34's intent.
- **Listening.** If an NPC in the same room within four tiles is speaking, the chair turns towards the
  speaker instead, for the line's length, with no roll. The needs system builds a speakers list
  (`{ npcId, roomId, x, y, until }`, call speakers included, so colleagues look round at Tom on the
  phone) once per needs tick and seating reads it, rather than calling
  `getState()` (which builds a large object, 2046-2068) for every pair of NPCs every frame.
- **Off switches.** NPC `swivel: false`; scenario `"officeVisuals": false`. On by default for needs
  NPCs: it only turns chairs that seating already turns.
- **Not touched.** The roll keeps its `Math.random` (cosmetic, outside the decision log); OQ34.

**Engine.** `seating.js` about 42 lines (the pure swivel function, the listening check from the
speakers list, one change at the `want = st.homeFacing` line in `updateNeedsSeat`, 1224; the roll's
x-dominant offset, out-and-back and wider hold about 7); `npc-needs.js` about 10 (the per-tick speakers
list); an event `npc_swivelled:<npcId>` `{ facing, reason: "idle" | "listen" }` on each turn. Schema
about 5 (`swivel`), validator about 8 (`swivel` on an NPC with no needs, and `los.enabled` on a seated
needs NPC, warnings). **About 65 lines (42 + 10 + 5 + 8), S.** No new art.

**What the player sees.** Seated staff roll their chairs a few pixels side to side and back between
bursts of typing, now and then glance round, and turn towards two colleagues talking nearby.

**Showcase.** `test_needs_sims` declares no chairs, so its office chairs come from the Tiled map and
should be swivels (slice 3's chair fetch, which rolls only swivels, seated Tom and Sanjay); the build
checks this before writing the objective. Objective "See someone look round at a conversation" on
`npc_swivelled:tom` with `data.reason === "listen"`.

**Tests.** Node, `seating.test.mjs`: `swivelFacing` is the same for a seed, turns in about 5% of slots
over 1,000 slots, never during a `work` use, returns to `homeFacing`, snaps to `valid`;
listening faces the speaker and ends with the line; a chat with the player overrides both; no swivel
while `s.call` holds or while paired or talking; a call speaker is in the speakers list; an NPC with
`los.enabled` never swivels; the speakers list is built once per tick; `fidgetOffset` (with a stub
`rand`) keeps `|y| <= 1` and `|x| <= 3`, never moves towards the desk for east and west facings, and
returns to zero after the hold; the roll is held during typing, a call, a pairing and a line. Live: a
strip of a roll out and back, a three-frame strip of a
swivel and one of a listening turn towards the office coffee queue's chatter (the cooler is in the
kitchen, where no needs NPC has a post, so no seated NPC is within four tiles of it); the lab regression (no change expected: static
seats).

**Risks.** A north-facing turn puts the face behind the backrest (seating draws rear facings behind
the chair), which reads as looking away; the step is one compass point, so a desk facing north turns
only to north-east or north-west. Too much movement in a busy office: `swivelChance` is per NPC and the
default is now 0.05. The roll change reaches every NPC seated on a swivel chair, needs or not
(`fidgetChair` is also called for `seated` NPCs, `seating.js` 1059); only `test_seating` and the lab
declare `seated`, and the lab's seats are static, so no shipped mission changes.

### 12.8 Slices

Sizes are engine, validator and schema lines, excluding tests, as in section 3. Each slice ends as
the others did: node tests, a showcase beat with an objective, live proof on :3001 with screenshots
in the session scratchpad, the README live-proof table, then the `test_needs_leash` and
`lab_physical_pentest` regressions and a line in the lab's "Office-life slices" note.

| Order | # | Slice | Size | Depends on | Visible or audible change |
|---|---|---|---|---|---|
| 1 | 21 | Idle motion (12.7): the chair roll mostly along x, out and back, and a rare swivel, with the per-tick speakers list; none while on a call, paired, talking or typing | S, ~65 | none | seated staff roll a little side to side, glance round now and then, and turn towards a conversation |
| 2 | 16 | Lock-screen habits and cues (12.2): `screenHabit`, idle-based `autoLockSeconds`, `workstation_screen_changed`, `lighting.flash`, the no-lighting glyph, run-time chimes, `ownRoomOnly` and limiter channels, `lockCues`, no cue for a late decision | M, ~205 | 2 (`expectedAwayMs`), 5 (indicators): built | the lock shrinks to a dot on screen, or a padlock glyph without lighting; the wake flash; chimes once approved |
| 3 | 18a | Coffee off (12.4): `offWhen`, the `off` turn-back outside `_recheck`, the wake on the global, the switch object with a state-worded hint, grumble topic chosen by lines, the turn-back table with `rang_out`, a neutral hint title | S, ~85 | 14 (turn back, parking): built | someone turns round at a dead machine and goes to the kitchen |
| 4 | 17 | Print and forget, and the print-job lever (12.3), with the need-use rule for `revealOutput`, the wider `_select` guard, the return leg for the errand only (`job.errand`), recycling the oldest forgotten slot for any print, the guarded caught check, ownership only with a habit or command | M, ~200 | 7 (slots), 11: built | a printout waits on the tray; its owner comes late or never; Tom gets up for a job the player sent |
| 5 | 18b-i | The magnet (12.4): dropped anywhere like the lab's USB (OQ31), `magnet_placed` and pickup, the optional declared spot with hidden objects, sight, temptation with the parking rules, the quiet tempted look with its back-off, servings at `using` start with `gone`, `perPerson`, the reload finish, sight from the tick cache; showcase with 2 servings and a hungry Amara | L, ~315 | 17 (the `_select` guard), 18a (the turn-back table), 14: built | pizza on the kitchen table, the kitchen eats, the boxes empty, "Missed it." |
| 6 | 18b-ii | Word of mouth (12.4): telling, the announce, the `news` picture, `_wakeParkedFor` | M, ~125 | 18b-i; 15: built | the announce bubble in the office, and the people who get up |
| 7 | 19 | Desk-phone calls (12.5): the call overlay with no selection during a call, the colleague's standing walk-over to a side cell, half-conversations chosen at the claim that end on a player chat or an unavailable speaker, `rang_out` for answerers on the way, no ring on a busy line | L, ~366 | 15 (exchange machinery); 16 (flash, glyph layer, limiter channels) | a ringing desk phone, half a call overheard, a colleague walking over to answer |
| 8 | 20 | Room tone (12.6), all behind `roomTone`: the four-step bed order, unknown keys as no bed, crossfades that can turn back, a bed at spawn (`refreshAmbient()`), the pure `ambient-choice.js`, no drop in a doorway, `startSound`/`outputSound` behind `roomTone`, typing, ducking for heard speech | L, ~279 | 16 (`ownRoomOnly`, channels); the sounds' approval for anything to be heard; after the lab's room dressing settles if the lab adopts it | a room that sounds like an office at work |

**About 1,640 lines in all** (after the user's decisions, 13f: 65 + 205 + 85 + 200 + 315 + 125 + 366 + 279;
each figure is the sum of its slice's parts, given in its section; it was 1,563 after review round 5).
Not in the total or the order: **16b, per-NPC sessions** (about 70, 12.2), unscheduled until the user
picks it. The reviewer's order, adopted: 21 first (no
dependencies, no approvals, smallest; it touches only `seating.js` and a few lines of
`npc-needs.js`), then 16, then 18a (a small lever that reuses slice 14 directly), then 17 and 18b-i
(18b-i extends 17's `_select` guard and 18a's turn-back table), then 18b-ii, then 19, then 20 last,
since nothing in it is heard until the files are approved. One at a time: all of them touch
`npc-needs.js`, seating or the office visuals. The review is complete after five rounds: round 5 found
every slice ready to build once its two majors (a bed at spawn in 20, showcase numbers that can show
"Missed it." in 18b-i) and its minors were folded in, which is done here (13e).

**Files beyond each slice's own modules, for the build briefs.**
- 16: `systems/lighting.js` (shared with lighting work), the lighting test harness copy lists if a
  static import is added.
- 18a: `systems/npc-needs.js` `PICTURE_CHATTER` (two entries).
- 17: `test/js/npc-needs-slots.test.mjs` is **not** to change (`GOLDEN_SIMS_DAY` at 21 stays as it is;
  a changed digest means the errand scope leaked).
- 19: `public/break_escape/js/data/office-presets.json`: its `_comment` says "Presets set no seat",
  which `desk_phone`'s `seat: "stand"` contradicts, so the comment is reworded; `npc-needs-chatter.js`
  (`preload`, `cancel`); `npc-action-icons.js`.
- 20: `test/js/office-presets.test.mjs` 25 asserts `presetIdFor({ type: 'kettle1' }) === 'coffee'`,
  which the `kettle` split changes to `'kettle'`; `core/rooms.js` and `sound-manager.js` (shared, named
  in the slice report).

**The approval list, one page before slice 16 starts (OQ42, OQ46).** Everything new that the user must
see or hear, in one place, so that 16, 19 and 20 can ship heard rather than silent. **The user approved
all of it on 2026-11-06.** The sounds still follow OQ42's sourcing rules, and each slice's
screenshots or play log are the check that a file works in place. **The new art is one PixelLab sheet
(OQ46):** the cake, the wall socket, both `npc-lock` icons and `npc-phone`, each in a cell at its native
size (16×16 icons; the socket and cake sized from the object catalogue), cropped exactly, never resized
(the grid-extract recipe). One attempt first; only a piece that fails is generated on its own.

| Item | Kind | Needed by | Until it is in | Decision (2026-11-06) |
|---|---|---|---|---|
| `screen_lock`, `screen_unlock` | two run-time WebAudio chimes, with a short recorded sample of each for the page | 16 | logged as `unapproved`, not played | **Approved** |
| `npc-lock` closed and `npc-lock` open | two 16×16 icons (PixelLab, as section 9) | 16 (cue without lighting) | text glyph stand-in | **Approved** |
| `office_ambient`, `kitchen_tone`, `typing_loop` | OGG loops, Freesound CC0. Approving them changes no shipped mission: sis01's `major_incident_room` authors `office_ambient`, but without `roomTone` the rooms-order loop never reaches that key (12.6) | 20 | no bed (the room's previous bed is not cut) | **Approved** |
| `copier_run`, `kettle_boil`, `coffee_machine` | MP3 one-shots, Freesound CC0 | 20 | silent | **Approved** |
| `distant_phone` | not a download: made from `desk_phone_ring` with an ffmpeg low-pass, so it is judged once, with the ring | 20 | silent | **Approved** |
| `desk_phone_ring` | MP3, Freesound CC0 | 19 | the ring is visual only | **Approved** |
| a small wall-socket sprite | object sprite | 18a | `notes_postit1` with a stand-in `_comment` | **Approved** |
| a cake sprite | object sprite, now wanted (OQ46) | 18b-i (the showcase magnet once it exists) | `pizza_boxes1` (exists) | **Approved** |
| `npc-phone` | 16×16 icon, made in the art sheet; used if `phone1` reads badly | 19 | `phone1` (exists), also the ring glyph without lighting | **Approved** |

Eight sound files (seven Freesound downloads and one ffmpeg derivative), two synthesised chimes, two
required icons and one required sprite; the cake is now wanted and `npc-phone` is made with the sheet. Round 3 changed only the
office bed's key, `office_tone` to `office_ambient`, so sis01's meeting room
(`sis01_healthcare/scenario.json.erb` 2133) picks it up once approved. Round 2 added nothing new to it; it made the chimes' sample, the second
`npc-lock` icon and the socket sprite explicit, and the ring glyph without lighting uses `phone1`, so it
needs no art.

Behaviour changes for existing scenarios: 21 makes the existing chair roll mostly sideways on screen,
out and back, for any NPC on a swivel chair (only `test_seating` and the test scenarios have one), and
turns seated needs NPCs' swivel chairs everywhere unless
`swivel: false` (static seats, the lab's included, never turn); 16 adds cues to every workstation with
an owner unless `lockCues: false`, while lock decisions change only where a scenario adds the new
fields; 18a is opt-in by data, and its grumble-topic rule keeps every existing grumble as it is; 17
changes when a `revealOutput` hook fires (need uses only), and nothing else unless an NPC has
`printHabit` or a hook has `chance` (the return leg is scoped to `job.errand`, so the sims-day golden
and the lab's footholds are unchanged); 18b stops hidden `revealOnGlobal`
objects being use targets (none shipped); 19 is opt-in by data; 20 is opt-in by `roomTone`, bed order,
crossfade, "own room first" and null-room keep included.

**What changes for shipped missions (m01-m10, sis01, sis02), none of which sets `roomTone`:** only that
an ambient key that is not loaded fades the current loop out over 400 ms instead of stopping it at once,
ending at the same silence as today, and through the existing volume-0 path, so a step straight back
keeps the loop. In shipped content that is exactly two sis01 rooms, `ward_7` and `it_security_office`,
both through `hospital_ambient` (12.6 traces the rooms order). `major_incident_room` does not change,
and approving `office_ambient` changes no shipped mission. Slices 21 and 16, whose visuals are on by default, change no shipped
mission: only `lab_physical_pentest` and the test scenarios declare `needsHome` or a workstation field
(checked with grep; the `needs` arrays in m02 and sis01 are puzzle fields, not NPC needs). The lab's
seats are static, so 21 leaves it alone, and the lab session decides `lockCues` for 16.

### 12.9 Open questions (recommended default in bold)

Numbered on from 4.3. Revised after review rounds 1-5 (sections 13, 13b, 13c, 13d, 13e).
**Answered by the user on 2026-11-06 (13f):** the default in bold is accepted for OQ27, 29, 30, 32,
34-40, 42-44 and 47-59 (OQ41 is withdrawn). OQ33 was left unanswered and takes its default. OQ28, 45
and 46 are accepted with a note, and OQ31 changed; each says so below.

27. **Lock cues on every workstation?** **Yes by default, with their own switch (`"lockCues": false`),
    since `"officeVisuals": false` also hides carried items and use sounds. The lab session agrees
    before slice 16 lands.**
28. **Where does a lock habit live?** **The person's habit on the NPC (`screenHabit`, rolled with its
    own salt `habit:<objectId>:<leaves>`), the machine's auto-lock on the object (`autoLockSeconds`);
    an object's own `lockChance` or `locksScreenOnLeave` still wins.** (2.6 planned traits for this;
    they were not chosen, and this is the smallest piece of them.) *Accepted, with the user's note:
    "Can we reuse the approach used for the remote desktop received via phishing?" for each NPC's own
    credentials and desktop. Answered in 12.2: an open screen can grant a per-NPC session with no engine
    lines; logging in at a locked screen is a follow-on slice 16b (about 70), unscheduled.*
29. **Does an auto-lock make a sound?** **No: the flash or glyph only, since nobody touched the
    keyboard.**
30. **May another NPC take someone's printout?** **No while it is reserved; `shareAfterSeconds` (unset
    by default) lets a scenario hand forgotten prints to a tidy colleague.**
31. **How does the player put a magnet out?** *Changed by the user:* **dropped anywhere, the way the
    lab's USB stick and QR code are dropped (`item-drop.js`): the magnet is a droppable held item with
    its own `affordance.magnet`, saved by the server's `player_drop` path; it can be picked up again.
    A declared spot (`triggerOnInteract`, `requiresItem`, `consumesItem`, revealing a declared magnet)
    stays as an optional second way.** (12.4; 18b-i grows to about 315.)
32. **Are servings saved across a reload?** **Yes, in an engine-owned `<id>_servings` global, so a
    half-eaten pizza stays half-eaten; a redeploy at 0 refills. A magnet is free while
    `claims < capacity` and servings are left; a serving is taken at `using` start, never by an arrival
    at 0; walkers left when it runs out turn back with `gone`.** (2.7 kept stock client-only; a lever
    the player paid an item for should not refill.)
33. **Who passes the word?** **Any compatible knower within `newsRadius` in its own room; avoidance
    blocks it both ways, groups do not; the telling happens whether or not the line is spoken.**
    *Not answered; the default is taken.*
34. **Seed the chair fidget as well?** **No: it is cosmetic and nothing tests it; seed it only if a
    test needs a fixed seated pose.**
35. **How strong is temptation?** **`tempt` 30 points above `urgentAt` by default, capped at 95. A
    tempted need never parks, a parked need is never tempted, learning of a magnet wakes that NPC's
    parked needs it satisfies, and a tempted selection that finds nothing logs and emits nothing.**
36. **Does an urgent need prefer a known magnet over a nearer usual source?** **Yes: the novelty is
    the point of the lever; `perPerson` still limits each NPC's servings.**
37. **Who answers an unattended phone?** **Only NPCs with `answersPhones: true`, from the second
    ring, idle, in the phone's room and compatible with the owner; the phone keeps ringing while an
    answerer is on the way; they stand; the owner arriving first wins and the colleague turns back with
    `answered`; an answerer still on the way when the phone rings out goes home (`rang_out`).**
38. **Are calls heard once?** **Yes, like exchanges (`heard_<knot>`); then the owner's `phone` pool or
    the colleague's `phone_message` pool, then picture chat.**
39. **Does an NPC in conversation with the player answer its phone?** **No: it misses the call
    (`desk_phone_unanswered`), and a mapping can react.**
40. **Room tone on by default?** **No: `"roomTone": true` per scenario.**
41. **Withdrawn.** It asked for a separate ambient volume because the bed seemed to ride the music
    slider. It does not: Phaser sounds, ambient included, follow the SFX slider, and
    `volumeSettings.music` is a constant nothing changes (12.1).
42. **Which new sounds, from where?** **The eight files in 12.6, asked for as one batch with the
    chimes' samples and the two `npc-lock` icons (the approval list in 12.8): Freesound CC0 only (no Sonniss: its licence forbids redistributing the files, and
    the repository is public), OGG for the loops, credits as a comment above each `load.audio` line.
    The two chimes are synthesised at run time, with no file.**
43. **Can the coffee machine be switched back on?** **Not by the engine: the switch is a one-way
    `set_global` on its own object (a wall socket), never on the machine; a scenario that wants it
    back adds a second object or a mapping.**
44. **Hidden reveal objects as use targets.** **Never a target, in every scenario (none shipped
    relies on it); "hidden" means the `revealOnGlobal` global is not true, not `visible`.**
45. **Swivel on by default?** **Yes, for seated needs NPCs on swivel chairs; `swivel: false` turns it
    off. The lab is unaffected (static seats).** *Accepted, with the user's note: "Do some small
    rolling motions mostly along x with just a little swivel very occasionally." Slice 21 now retunes
    the existing chair roll to move mostly along x, out and back, and lowers `swivelChance` to 0.05
    (12.7).*
46. **Art.** **Pizza first (`pizza_boxes1` exists); a cake sprite only if the user wants cake. The
    phone icon is `phone1` first; a 16×16 `npc-phone` only if the screenshot shows it reads badly.
    `phone1` stays the desk phone until a screenshot says otherwise (2.9). A small wall-socket sprite
    for 18a, with `notes_postit1` until then.** All are **[approval]**. *Accepted and approved, with
    the user's note: "Try to get them all on one sprite sheet (try once first)." The cake is wanted.
    The cake, wall socket, both padlock icons and the phone icon are generated together on one PixelLab
    sheet, one attempt first, and only a piece that fails is generated on its own (12.8).*
47. **Does auto-lock reset when the player uses the screen?** **Yes: it is idle-based, restarting on
    `workstation_accessed` and holding while a minigame is open on the object.**
48. **What does an owner do when its phone rings during its wind-up?** **It misses the call: it has
    already decided to go.**
49. **Does the ring cadence run on the needs clock?** **Yes: it pauses with a VM, like every other
    needs timer.**
50. **One serving per person?** **Yes, `perPerson: 1`: after that the magnet no longer tempts that
    NPC, though a plain urgent need may still use it while servings are left.**
51. **Do print hooks fire on deliveries?** **No: `revealOutput` fires only for need uses.
    `setGlobal` and `emitEvent` hooks keep today's behaviour (any finished job), documented. The
    return-leg rule applies to the print errand only (`job.errand`); every other carry home keeps its
    dwell.**
52. **Does an announcement need the voice line?** **No: telling happens on the announce, whatever is
    shown; the announce ignores the bark cooldown and waits up to 30 s for the speech lock, then shows
    a `news` picture. The hearers are those in range when it shows, and with nobody to tell there is no
    announce.**
53. **What happens to a call when the player opens a chat with the speaker?** **It ends: the
    remaining lines are dropped, the lock released, the knot left unplayed, and
    `desk_phone_hung_up:<phoneId>` fires with `reason: "player"`.**
54. **Are grumble lines per reason?** **Yes: `grumble_<reason>` (`grumble_off`, `grumble_gone`) when that
    pool has lines, else `grumble`, chosen before `_pickBark` so an existing spoken grumble never turns
    into a picture. The picture for `grumble_off` and `grumble_gone` is the need's own icon, falling back
    to `avoid`.**
55. **Can an NPC on a phone call start a job?** **No: while `s.call` holds, selection waits. Decay goes
    on; an urgent need, a due errand or a tempted magnet starts on the first select after the call.**
56. **A print with a full slot pool?** **Any print, owned or not, recycles the oldest forgotten reserved
    slot of that producer (filed, logged `recycled`); with none, a cosmetic copy, `print_no_slot`, and no
    printing icon.**
57. **Should room tone's ambient changes reach missions that do not set `roomTone`?** **No: the bed
    order, "own room first", the null-room keep and the crossfade run only with `roomTone`. The one change
    for everyone is that an unloaded key fades the current loop out instead of cutting it, which ends at
    the same level as today.**
58. **How often can the note lever print a forgotten job for Tom?** **Once a minute (`cooldown: 60000`),
    not `onceOnly`, which is saved to the server and would lose the beat after a reload.**
59. **Which forgotten slot is recycled first?** **Read-in-place slots before takeable ones, oldest first
    within each, so the player's takeable forgotten printout is the last to go.**

### 12.10 What it means for the lab

`lab_physical_pentest` belongs to the other session; nothing here edits it. Each slice's report
says what changed, and the other session decides.

- **Slice 21.** No change: Chris, Melanie and Sofia sit on static seats (scenario-placed chairs,
  `lab_physical_pentest/scenario.json.erb` 1115-1121), which never swivel. The regression confirms it.
- **Slice 16.** Lock decisions do not change: Chris's `staff_pc` has `locksScreenOnLeave: true` (935)
  and Melanie's `staff_pc_2` has `false` (1015), and object fields win. With `lockCues` on (the lab
  session's call, asked before the slice lands), the lab gains the lock flash on Chris's PC as he
  leaves (and the chime once approved) and the wake flash on return, so the player can read the
  keylogger window without walking over. Options for the lab: `autoLockSeconds` on `staff_pc_2` puts
  an idle clock on Melanie's open-screen window; an NPC `screenHabit` makes lock habits a property of
  the person, but only once the station's own `locksScreenOnLeave` is removed, since the object wins.
- **Slice 18a.** The lab's `coffee_station` (1050-1051) could take `offWhen` and a socket: switching it
  off sends Chris and Melanie elsewhere or parks their coffee, a longer or shorter window by the
  player's choice. Its scenario-level `grumble` pool is about Sofia (43-45), so it would want a
  `grumble_off` pool too; without one, the turn-back grumbles from `grumble` as today (the topic is
  chosen by which pool has lines), so the lab never loses a spoken grumble to a picture.
- **Slice 17.** The accounts-floor "Shared printer" (1102-1113) and the post-room photocopier
  (1362-1372) describe uncollected output in static text. Either could become a producer with slots
  that a named member of staff prints and forgets, with `npc_print_uncollected:<npcId>` as the
  capture hook; a takeable slot is one beat. Melanie's left-behind printout
  (`pierce_printout_left`, 1181) already uses slice 11. The lab has no `revealOutput` hook, so the
  need-use rule changes nothing there. The lab has no `npc_caught_at_post` mapping (the only one in any
  scenario is the showcase's Tom). Sofia's footholds are carries of the dropped devices to her own
  `usb_target_pc` (732, 987, the mappings at 766-799); the return-leg rule is scoped to the print
  errand (`job.errand`), so they keep their 6 s plug-in and their log.
- **Slice 18b.** The staff kitchen (`room_lw_kitchen`, 1517) has a kitchenette that is a "social draw"
  with no affordance (1511, 1567-1577). A pizza dropped there (or at a declared spot), with an announce pool, would
  empty the accounts floor for a while: the player's lever for a longer window at both PCs. The
  slice 14 caveat applies: staff who declare `needsCompany.avoids` turn back from a source that an
  avoided NPC stands near.
- **Slice 19.** The front desk (`room_lw_front_desk`, 541) could get a desk phone; ringing it from
  elsewhere pulls the receptionist off the desk, a standard physical-test distraction. The lab does
  not switch presets on, so its phone writes its affordance out (`useSeconds: 0, capacity: 1,
  seat: "stand"`). The
  lab has only the player's phone today (57, 288).
- **Slice 20.** The lab sets no `ambientSound`; its rooms are bespoke `room_lw_*` types, so room tone
  stays off until the lab sets `roomTone` and `roomToneTypes`, best after its room dressing settles.

The regression after each slice is the one in the handover note, section 4: score 100, Len's route
unlock, the tailgate, no path or wall-escape warnings, no console errors.

### 12.11 What a later skill needs, to bring office life into m01-m10

The user will commission a skill for this after these slices. Notes for whoever writes it:

- **Kind of game.** The SAFETYNET missions are a spy thriller with required VM flags (AGENTS.md,
  "Kinds of game"). Office life is dressing and levers; it must never gate the critical path or a
  VM flag. A story beat that an NPC must reach uses `deferrable: false` (slice 14), and a timing the
  mission depends on stays on scripts, which win over needs.
- **Audio costs money.** Every chatter pool, announce pool, exchange and call is a spoken line. The
  skill lists them all before writing, follows the tts-audio rules, and asks before touching m01,
  whose audio is cached and which is left alone (AGENTS.md, standing rules).
- **People first.** Posts (`needsHome`), a leash for anyone who must not wander (`needsPrivateTo` on
  private offices, `needsRooms`), `needsCompany.avoids` for distrusted NPCs (m01's Derek is the
  user's own example, section 7), cast diversity per mission, and every NPC who speaks has a voice.
- **Order of work.** Presets and needs, then workstation habits, then chatter, then levers, then room
  tone, then a playtest of the whole mission. Exchanges and calls go through the npc-dialog-review
  skill. Room dressing and lighting come before room tone, which copies the final layout.
- **Checks to rely on**, all from `scripts/validate_npc_needs.rb` unless named:
  - the T1/P timing report per NPC (when the first beat happens);
  - impossible needs under the leash, targets reachable only through a forbidden room, private
    objects nobody owns;
  - the list of objects that gained a preset (it catches puzzle terminals: `pc` is used about 100
    times across scenarios, and only those with a `lockType` are excluded automatically);
  - slot and left-behind rules (one global per slot, read-in-place for cycling slots, takeable beats
    per producer);
  - queue cells in doorways or forbidden rooms;
  - chatter pools: line length, one line, no `{ }`, known topics; exchange and call knots exist and
    their speakers have voices;
  - from these slices: workstation owners, habit bounds and habits shadowed by an object's lock field
    (16), `offWhen` globals that nothing sets (18a), print habits and pool size (17), magnet spot,
    item, servings global and announce pool (18b), phone owners, the phone within reach of the post, a
    resolved phone affordance when presets are off, and call lines that would parse as a speaker prefix
    (19), room tone profiles and loaded sounds (20), swivel on an NPC with `los` (21);
  - `validate_scenario.rb` and the dungeon graph for the critical path, and `scenario-schema.json`
    for every field.
  The validator's `ℹ️` lines are stable enough to diff before and after a change; a short per-NPC
  summary flag would help the skill and is cheap to add when the skill is written.
- **Approvals first.** The approval list (12.8) is settled before any mission adopts slices 16, 19 or
  20, so a mission never ships a silent cue it expects to be heard.
- **Doors.** Room tone and every ambient loop are proved through a north or south door as well as an
  east or west one: north-south doors are where the doorway gap (12.6) showed.
- **Live proof.** The `window.__test.needs` bridge, a playtest of the mission's walkthrough with
  office life on, and a check that nothing a mission maps (`npc_arrived`, conversations, sight
  challenges) fires early or twice because NPCs now move.

The later defender "spot the risk" mode can reuse these slices' events as its record of what was
risky and when: `workstation_screen_changed` (an open screen and for how long),
`npc_print_uncollected`, the left-behind `object_revealed`, `desk_phone_answered` by a colleague.
It needs a reporting interaction of its own, which is not planned here.

### 12.12 Slice 22: printer power (added 2026-11-07)

The user, 2026-11-07: "Having a way to disrupt printers (like the power off the coffee machine?) seems like a great way to
allow the player to interact with the game systems, and force npcs to re-route their needs. Maybe the npc would seek out a
printer in a nearby room, which would give the player more time with the npc out of the room." Numbered 12.12 because 12.10
and 12.11 were taken. Built on 17 (print and forget) and 18a (`offWhen`).

**Fix after the build (2026-11-07, commit 977099989):** `_expectedAwayMs` now follows the walking route through doors (`routeLength` on the engine world, straight-line fallback per leg) instead of a straight line. Live `npc_left_post:tom.expectedAwayMs` was 10935 ms against 4482 ms before (game 1028); `GOLDEN_SIMS_DAY` unchanged. See `HANDOVER_OFFICE_FIXES_S20S22.md`.

**Built: 2026-11-07 (slice 22: plan f650c1a5f; engine, validator, schema and tests 9da18dfc9; showcase e787ce25b, 9053df59e,
9600031e4). Live proof game 973; leash game 974 (pass); lab game 975 (score 100, 9/9 tasks; creds 64.6 s, USB foothold 11.2 s);
`bin/test-js` 409 files pass, `npc-printer-power` 14 tests, `GOLDEN_SIMS_DAY` unchanged; see `HANDOVER_OFFICE_S22.md`.** As
written, with these choices made without asking: (1) numbered 12.12, not 12.10, which was taken; (2) a producer the world does not
know (its room not loaded) counts as off in a list of two or more, so with the office copier off and the kitchen never opened Tom's
print is blocked rather than lost; a list of one keeps the old path; (3) the `needs.print` command takes the same list (string, list,
or `{ producer: list }`), so both of Tom's levers still work with the copier off; a blocked command emits `viaCommand: true` and
does not grumble; (4) `npc_print_fetched` gains `producerId`, which the showcase task reads, and slice 17's exact-payload test
gained that field; (5) the `revealed` log line carries `skipped` only when a producer was passed over, so existing logs are
byte-identical; (6) the kitchen copier has its own socket (the brief asked for one on the office copier), so the none-on beat can
be played and the validator's "nothing sets it" warning does not fire; both sockets are one-way, like 18a's; (7) the kitchen slots
read in place (they cycle); (8) the showcase's `npc_print_fetched:tom` now has two `onceOnly` mappings (`send_print_job`,
`keep_tom_away`) that can fire together, which the validator warns about; a lever print fetched from the kitchen completes both,
as intended; (9) Tom's lock is a 0.5 roll per leave (`lockChance` on `tom_pc`), not an away-time habit, so the longer absence
does not change his lock; his screen stayed open on both live errands. Live: copier on, expectedAwayMs 2307, away 3.25 s of needs
clock; copier off, the print at `kitchen_out_a`, expectedAwayMs 4482, away 10.25 s (the estimate is straight-line, a lower bound
through the door); both off, Tom's ninth work use (his first print roll under 0.4 for this seed) gave `npc_print_blocked:tom` and
"Is anything switched on today?"; Sanjay's string hook was blocked too.

**Design (agreed with the user).**

1. **A list of printers.** `revealOutput` on a use hook may be a list of producer ids in preference order; a string stays
   valid and means a list of one. A print goes to the first producer that is on (its `affordance.offWhen` does not hold)
   and has a free or recyclable slot (slice 17's `_slotAvailable`). When no producer that is on has one, the first producer
   that is on gets today's full-pool path (a cosmetic copy, `print_no_slot`). Order is the scenario's; no new rolls. A
   producer the world does not know (its room not loaded) counts as off in a list of two or more; a list of one keeps
   today's behaviour, so every existing hook prints exactly as before. The `needs.print` command's `producer` takes the
   same list, with the same rule.
2. **The errand follows the paper.** The fetch errand already walks to the slot (a carry: item first, then the owner's
   `needsHome`), so it goes to whichever printer printed. `_expectedAwayMs` already routes a carry through the item's cell,
   so a print at a further printer gives a longer estimate on `npc_left_post`, and slice 16's lock habit
   (`lockIfAwayOverSeconds`) sees the longer absence. No new code for this; tests prove it.
3. **None on.** A use whose roll printed but finds every listed producer off prints nothing: log `print_blocked`
   `{ target: <hooked object>, producers }`, event `npc_print_blocked:<npcId>` `{ npcId, objectId, producers, viaCommand,
   playerNearby, playerDistance }`, and the owner grumbles from the chatter pool `grumble_printer_off` (scenario or NPC
   JSON, TTS-voiceable, no room names); with no lines it shows the existing `blocked` picture (`PICTURE_CHATTER`). The
   start-time printing icon is shown only when a producer is on and has a slot, so a blocked use shows no printing icon.
   A command that finds none on logs and emits the same, with `viaCommand: true`, and no grumble (the NPC is elsewhere).
4. **Switching off later.** A print already on a tray stays there when its printer is switched off (the paper is out);
   the switch touches only where new prints go. An errand already walking to a printer that is then switched off still
   collects: errands are carry jobs, and the 18a `off` turn-back checks only `use` jobs.
5. **Copiers as need sources** (an NPC whose need a copier satisfies) already turn back through 18a's `offWhen`; a test
   confirms it, nothing is added.
6. **Validator.** Each listed producer is an object id (error) with output slots (warning, as today); an empty list
   (error) and a repeated id (warning); for an owner (`printHabit` or a print command), a listed producer whose room the
   owner's leash or a private room keeps it out of warns as today, for every entry of the list. Schema: string or array.
7. **Showcase** (`test_needs_sims`): a second copier in the kitchen, square to a wall, with its own wall socket; a socket
   beside the office copier (`wall_socket1`); Tom's hook and both levers list `["office_copier", "kitchen_copier"]`; a
   `grumble_printer_off` pool; objectives "Switch the office copier off and keep Tom away from his desk longer" (his
   print errand to the kitchen copier, `npc_print_fetched:tom` with the producer) and "Switch both copiers off and hear
   Tom grumble" (`npc_print_blocked:tom`). Validate with `--no-graph`.

**Size.** Engine about 45 (the list helper, `_pickProducer`, the hook and command paths, the blocked log, event and
grumble, the producer on `npc_print_fetched`), validator about 25, schema about 6. **About 76 lines, S.**

**Tests.** Node: list order (first on with a slot wins), fallback past an off producer, fallback past a full one, none
on (no reveal, `print_blocked`, the event, the grumble line or the `blocked` picture, no printing icon), a string hook
unchanged, the errand walks to the second printer and its `expectedAwayMs` is longer than the same errand to the first,
a print on a tray stays when switched off, an errand walking to a printer switched off still collects, a copier as a
need source turns back (18a), the command with a list, determinism (two runs, same log), `GOLDEN_SIMS_DAY` unchanged,
validator fixtures. Live on :3001: copier off, Tom's print at the kitchen copier, Tom there and back with the longer
away time (and his lock if his habit says so), both off (the grumble).

### 12.13 Slice 23: magnet on a table (added 2026-11-07)

The user, 2026-11-07, yes to "Should a cake dropped beside a table snap onto the table?". Today a drop lands at the
player's feet, so a cake put down beside the kitchen table sits on the floor (game 930, `k1-kitchen-eating-930.png`).

**Built: 2026-11-07 (slice 23: plan dce9f463c; engine and tests 2d6295ef5; fixes from the live proof ff5fd7a41, fdbc431a1,
6cfc8e18e). Live proof games 979, 982, 985 (sims README "Slice 23"); leash game 987 (pass); lab game 989 (score 100, 9/9 tasks;
creds 65 s, USB foothold 13 s) and game 988 (score 40: the replay's tailgate into `secure_area` failed); both lab games ran after
seat box slice 7 moved the accounts PCs, `usb_target_pc` among them (594226d2c, b5d8897d2), which slice 23 cannot reach (no magnet
in the lab; a non-magnet drop moves by at most half a pixel); `bin/test-js` 409 of 410 files pass, the one failure
`desk-footprints.test.mjs` from the same seat box commit (`room_lw_accounts` now opts in); `table-drop` 10 tests,
`GOLDEN_SIMS_DAY` unchanged; see `HANDOVER_OFFICE_S23.md`.** Built as the
design below reads now; the points that changed from the first version, and the choices made without asking: (1) magnets only
(point 1); (2) the snap range is measured to the table's drawn rectangle, not its top, because the player cannot stand nearer
the top than the front face (37 px from the top band in front of a smalldesk1, which would never snap); (3) a table nobody can
stand at is skipped for the next in range (game 978: the cake went onto the kitchen's north-east table, whose front and west end
touch other tables, and the only edge left was behind it, closed in by the sofas; Sanjay "ate" it from his desk); (4) eaters
never stand behind a table; (5) the server keeps only `position.x` and `.y` of a drop (`games_controller` `item_add_params`),
so the elevation is not persisted; instead the needs system re-raises a magnet standing on a table when it registers it (on the
drop and on a room load, `settleOnTable`), client only, no server change; (6) a reloaded magnet on a table takes the drop's
centre origin again, since reach is measured to `sprite.y` and the top-left a reload gives was 38 px from the player in front
of the table (game 981); (7) the floor drift fix (save the top-left) applies to every drop, magnet or not: it moves a drop by at
most half a pixel at the drop and removes the reload drift; (8) no `front` data exists yet, so the base row is 40% of the sprite
height (smalldesk1: row 16 of a 26-row top); (9) `validator-office-presets.test.mjs` had gone stale with slice 22's
`kitchen_copier` and was updated (11044a15f). No scenario, validator or schema change.

**Design.**

1. **Scope: magnets only.** A droppable item whose affordance has a `magnet` snaps; every other drop lands at the feet as
   today. The lab's USB stick and QR card (a `needsTag`, no affordance) are collected by NPCs from the floor, and moving them
   onto desks would change who can reach them and the lab's timings, so extending it is not trivially safe.
2. **Which surfaces.** Sprites in the player's room whose `scenarioData.type` is `table` (the Tiled `tables` layer and
   scenario-made tables), live and not destroyed. The top is the sprite's span, inset 2 px, with the item's base on one row:
   `front - 2` when `table_surfaces.json` has a `front` for the texture (none do yet; TABLE_SURFACE_PLAN), else 40% of the
   sprite height (inside the measured tops of desk1, smalldesk1 and hospital_desk1).
3. **When it snaps.** The player's feet within 32 px (one tile) of a table's drawn rectangle, and the table usable (an
   edge cell exists, point 6). The nearest table wins, ties by object id; on it, the player's x clamped into the top. A spot whose item rectangle
   would overlap another object on the table (a lamp, the microwave) slides along the top to the nearest clear x (4 px
   steps); a table with no clear spot is skipped. Nothing in range: the floor, as today. Pure and deterministic, in a new
   import-free module `table-drop.js` imported by `item-drop.js` (no test harness copies `item-drop.js`).
4. **Drawing.** Depth is the table's depth + 0.05 as an elevation over the item's bottom + 0.5 (the `setDepthAndStore`
   formula): drawn over the table and its items, under an NPC standing in front. Elevation > 0 also keeps the cake out of
   path-avoid and sight occlusion, as the slice 19 phones are. The server drops `position.elevation`, so the needs system
   re-applies it (and the centre origin) to a magnet standing on a table whenever it registers one (`settleOnTable`).
5. **Persistence and the 13 px drift.** The drop saves `position` as the sprite's centre, but a reload places a scenario
   object by its top-left (origin 0), so a 25x27 cake comes back half its size south-east. A client fix: save the top-left
   (integer pixels). The elevation rides along but the server keeps only `position.x` and `.y` (point 4 re-raises it).
6. **Eaters.** `approachCell` for a magnet standing on a table (its base point inside a table's top) asks
   `window.tableDrop.approach`: the walkable cell just in front of the table under the cake, else the nearer of its left
   and right ends, never behind it and never a cell inside or within 4 px of any table (the kitchen's four tables touch). `besideCell` then puts
   the second and third eater along the same edge. npc-needs.js keeps no static imports.
7. **Pickup and doors.** Unchanged code: the cake is a takeable object above the table, so a click on it picks it up; a cake
   on a table is no longer by a door, so a door click cannot grab it (a floor drop in a doorway still can).
8. **No new scenario fields**; no validator or schema change.

**Size.** `table-drop.js` about 90, `item-drop.js` about 20, the `approachCell` hook about 8. **About 120 lines, S.**

**Tests.** Node (`table-drop.test.mjs`): snap within range, none beyond, nearest table and the tie by id, slide past an
object, a full table skipped, determinism, the persistence round trip (the saved top-left and elevation, read back by the
reload formula, give the same rectangle and depth; a floor drop no longer drifts), the edge cell (front first, never in a
table gap). `GOLDEN_SIMS_DAY` byte-identical. Live on :3001: a drop beside the kitchen table lands on it, eaters at the edge
with an eating frame, a reload keeps it there, pickup from the table, an open-floor drop on the floor; leash and lab regressions.

## 13. Changes after section 12 review R1

Review: `OFFICE_LIFE_PLAN_REVIEW_S12_R1.md` (commit 20f8263b7; 0 blockers, 9 major, 17 minor; "not ready
to build as written; ready after the nine majors are folded in"). Every finding was checked against the
working tree at c5fef9810 before it went in. **All 26 findings are folded in; none is rejected.** Three
take a slightly different remedy from the reviewer's, said in the row (M7, M9, m3). The reviewer's slice
order is adopted (12.8), OQ41 is withdrawn and OQ47-52 are added (12.9), and the sound sourcing follows
the review's section 7.

| Finding | Checked against | Outcome | Section |
|---|---|---|---|
| **M1** the phone is not answered at the post | `seating.js` `needsStop` 1067, 1072-1076, `updateNeedsSeat` 1192-1196, `typingBob` 1095-1100; `npc-needs.js` `_advanceJob` 1458-1475; `office-presets.json` 14 (`useSeconds` 0) | Folded: the owner's answer is a call overlay `s.call` (no job, no move, seated, bob off, phone icon); the colleague's answer stays a use job with `useUntil` at the call's length; validator error unless the phone is within 1.5 tiles of the owner's home approach cell; `seating.js` added to the slice | 12.5, 12.8 |
| **M2** `_select` returns before temptation or a print errand | `npc-needs.js` 844, `_anyUrgent` 830-835; Tom has no interests (`test_needs_sims` 362-390) | Folded: the guard also checks for a due print errand and a known magnet in the tempt band; node tests run with the tick cache on and off | 12.1, 12.3, 12.4 |
| **M3** temptation and parking work against each other | `_select` 857-858, `_park` 1023-1028 | Folded: a tempted need never parks, a parked need is not tempted, learning of a magnet wakes the parked needs it satisfies; test that a told, leashed NPC keeps its level | 12.4 (18b item 4), OQ35 |
| **M4** servings counted at completion while three eat at once | `_free` 783-786 | Folded: free while `claims < min(capacity, servingsLeft)`, a serving taken at `using` start; `perPerson` (default 1); test with one serving and three NPCs | 12.4 (18b item 6), OQ50 |
| **M5** a delivery to the owner's desk prints again; the icon promises a print | `_completeJob` 1520-1525; `_startJob` 1268 | Folded: `revealOutput` fires only for need uses; `chance` rolled at job start and the icon set from it; `setGlobal`/`emitEvent` hooks unchanged and documented; test that a delivery prints nothing | 12.1, 12.3, OQ51 |
| **M6** word of mouth can fail silently | `_pickBark` 1147-1160; `CHATTER_COOLDOWN_MIN` 64; `PICTURE_DEFAULT` 75; the cooler preset's pool | Folded: telling is a state change; the announce ignores the bark cooldown, waits up to 30 s for the lock, then shows a new `news` picture; test with a knower on cooldown | 12.4 (18b item 3), OQ52 |
| **M7** the lock cue disappears without lighting | `lighting.js` `initLighting` 1429-1441 | Folded, slightly different remedy: a one-second padlock glyph over the screen, drawn by `npc-office-visuals.js` in the action-icon layer's style (an object anchor, which the head-anchored action icons do not have); `npc-lock` icon **[approval]**; live strip with lighting off | 12.1, 12.2 |
| **M8** one ambient track cannot carry a bed per room | `core/rooms.js` 3174-3177; `sound-manager.js` 367-372 | Folded: a crossfade in `fadeAmbientTo`; no bleed by default (a neighbour channel only if asked for); live recording through two doorways | 12.6 |
| **M9** "activity first" spot sounds do not fire | `npc-needs.js` 1524, 2531; `office-presets.json` 5, 10; `npc-office-visuals.js` 216-230 | Folded: `affordance.outputSound` on `object_revealed`, `affordance.startSound` at `using` start; different remedy for the kettle: its own `kettle` preset with the coffee values (data only, logs unchanged), so kettles and coffee machines sound different by default | 12.6 |
| m1 the bed does not ride the music slider | `sound-manager.js` 304, 392, 447 (`setCategoryVolume` has no caller); `music/music-widget.js` 186-195 | Folded: the `ambient` category is dropped, OQ41 withdrawn, the m01 level check removed; the bed follows the SFX slider like any ambient loop | 12.1, 12.6, OQ41 |
| m2 the lab's staff never swivel | `lab_physical_pentest/scenario.json.erb` 1115-1121; `core/rooms.js` 2536-2539 | Folded: the lab is unaffected; the showcase's chairs are Tiled map chairs (none declared), checked at build | 12.1, 12.7, 12.10, OQ45 |
| m3 the coffee switch is easy to hit and cannot be undone | `interactions.js` 844-846 | Folded, with the switch on its own wall-socket object (a stand-in sprite until one is approved) rather than a choice; an NPC using the machine finishes | 12.4 (18a), OQ43 |
| m4 auto-lock runs under the player | `workstation-state.js` `onInteract` 167-182 | Folded: idle-based, restarting on `workstation_accessed` and holding under a minigame; the showcase objective is no longer a race | 12.2, OQ47 |
| m5 the flash is a glow, and records are rebuilt | `lighting.js` 604-631, 657, 1117 | Folded: a shrinking glow with per-frame scale, held in a side map drawn after the emitters | 12.2 |
| m6 `off` and `gone` cannot ride `_recheck` | `npc-needs.js` 1066-1069, 1083 | Folded: a separate check in `_advanceJob`; only `avoid` sets `mindChanged`; an `offWhen` global change wakes parked needs | 12.4 (18a, 18b) |
| m7 phone timing | `npc-needs.js` 2201 (wind-up), 1376-1377 (`expectedAwayMs`) | Folded: the phone keeps ringing while an answerer holds a claim; the cadence is on the needs clock; an owner in its wind-up misses; the answerer's estimate uses the call's length | 12.5, OQ37, OQ48, OQ49 |
| m8 call plumbing | `npc-needs-chatter.js` `preload` 144-148, `splitPrefix` 30-34 | Folded: `preload` also for `phoneCalls`; the lock held through the gaps with the player in earshot; validator error on a prefix-like line | 12.5 |
| m9 desk phones need presets or an authored affordance | `office-presets.json` 14; schema 147, 5043 | Folded: the affordance is written out without presets; validator error on a `phoneOwner` object with none; noted for the lab's front desk | 12.1, 12.5, 12.10 |
| m10 `phone_vibrate` is the player's phone | `sound-manager.js` 87, 184 | Folded: no stand-in; the ring is visual (flash or glyph, rattle) until a ring is approved | 12.1, 12.5, 12.6 |
| m11 swivel cost and LOS | `npc-needs.js` `getState` 2046-2068; `seating.js` 1211; `npc-los.js` 163 | Folded: a speakers list built once per needs tick; no swivel for an NPC with `los.enabled`, and a validator warning | 12.7 |
| m12 showcase timing | `test_needs_sims` needs (Tom 65 at 10/min, Grace 79 at 15/min) | Folded: "Word gets round" is a mapping per NPC on `npc_told:<id>`, the text says whoever finds it tells; a note lever prints as Tom with `forget: true`; the Amara threshold note stays | 12.3, 12.4 |
| m13 ducking misses the loud speech | `npc-needs.js` `_speechUntil` 1164; `core/rooms.js` 3110, 3161 | Folded: the bed also ducks while a conversation minigame is open; the duck is a multiplier inside `sound-manager.js`, kept across recalculations | 12.6 |
| m14 a timed message is not a ring source | `npc-manager.js` 1711-1737 | Folded: dropped from the ring sources; a timed ring needs a mapping on the delivery | 12.1, 12.5 |
| m15 habit precedence and salt | `workstation-state.js` 65-74; lab 935, 1015 | Folded: the habit's salt is `habit:<objectId>:<leaves>`; the lab note says the object field must go for a habit to apply; the wake flash shows only when the screen was locked; validator warning for a shadowed habit | 12.2, 12.10, OQ28 |
| m16 magnet discoverability and reuse | `interactions.js` 797-846 | Folded: the hint goes on the item's description and the table's observations; a redeploy while servings are 0 refills | 12.4 (18b), OQ32 |
| m17 lock cues need their own switch | `npc-office-visuals.js` 17-19, 235 | Folded: `"lockCues": false`; the lab session decides before slice 16 lands | 12.2, 12.10, OQ27 |
| Wrong claim: unlock "when the owner sits down" | `npc-needs.js` 694-701 | Corrected: on arrival at the home cell, just before it sits | 12.2 |
| Wrong claim: a copier is heard "because someone is at it" | as M9 | Corrected through M9 | 12.6 |
| Line drift: `want = st.homeFacing` | `seating.js` 1203 | Corrected (was 1197) | 12.1, 12.7 |
| Section 6: split slice 18 and reorder | slice contents | Adopted: 18a coffee off (~65), 18b magnets (~310); order 21, 16, 18a, 17, 18b, 19, 20; total about 1,260 lines | 12.4, 12.8 |
| Section 7: sourcing | `sound-manager.js` 63, 72, 91; `lighting.js` `playStrikeClick` 787 | Adopted: Freesound CC0 only, no Sonniss; OGG for loops; credits as comments above `load.audio`; the chimes synthesised at run time, so eight files, not ten | 12.2, 12.6, OQ42 |

**Found while folding in.** (1) No small wall-socket sprite exists in `assets/objects` (only
switchgear and panels), so 18a's switch uses `notes_postit1` until one is approved (OQ46). (2) 18b now
depends on 17 (the shared `_select` guard) and 18a (the shared turn-back check), so the reviewer's order
is also the dependency order. (3) The plan header's status line was stale ("slice 6 is next"); it now
lists the built slices.

### 13b. Changes after section 12 review R2

Review: `OFFICE_LIFE_PLAN_REVIEW_S12_R2.md` (commit 23fd7c56d; 0 blockers, 6 major, 16 minor, plus a
table of round 1 findings only partly fixed: R1 M1, M3, M4, M8, M9, m8, m13, m17). Every finding was
checked against the working tree at 23fd7c56d before it went in. **All 22 are folded in; none is
rejected.** One is folded in part: m1's claim that seating cannot see `s.call` is wrong, since seating
reads the raw needs state (`seating.js` 1003, 1145); only the action icons need `call` in `getState`.
M3 takes the reviewer's recommended option. The partly fixed round 1 findings close through the rows
named in the last column.

| Finding | Checked against | Outcome | Section |
|---|---|---|---|
| **M1** a call in progress when the player opens a chat with the speaker | `npc-needs.js` `_tickNpc` 659-671, the exchange runner in the system tick | Folded: the runner lives in the system tick; a chat with the speaker ends the call, drops the lines, releases the lock, leaves the knot unplayed and emits `desk_phone_hung_up`; OQ53; node test (closes R1 M1's remainder with M2, m1, m2) | 12.5, OQ53 |
| **M2** the colleague who answers sits in the owner's chair | `seating.js` `seatPreference` 1110-1120, the post exclusion 1240-1242; `office-presets.json` 14 | Folded: `seat: "stand"` in the `desk_phone` preset and the written-out affordance; the "passes `seat`" sentence and the 2.2 Part B reference dropped; validator error; live screenshot with the owner's chair empty | 12.5, 12.10 |
| **M3** `gone` unreachable under the round 1 servings rule | `_claims` 767-775 (walkers and eaters both count) | Folded, the reviewer's recommended option: free while `claims < capacity` and servings are left; a serving taken at `using` start; walkers turn back with `gone` when it reaches 0, an arrival at 0 never eats; the finish waits for every eater; test, beat and budget agree (closes R1 M4) | 12.4 (18b item 6), OQ32 |
| **M4** a tempted need floods the log and the leash event | `_useCandidate` `nothing()` 899-904; `_decay` 750-758; `_selectSearched` 541-544; `_recheck` 1075; `_turnBack` 1093-1096 | Folded: a tempted selection is a quiet look (no `_noteLeash`, `_notePrivate` or `giveUp`); `job.tempted` recorded at job start, so a tempted job neither parks nor grumbles twice and keeps its own turn-back-once flag; tests over 2 minutes of needs clock (closes R1 M3) | 12.4 (18b item 4), OQ35 |
| **M5** the print errand comes home without the return path | `_atOwnPost` 1295-1298; `_checkCaught` only in `returning` (691); `_completeJob` 1526-1529; `needsStop` 1072-1076 | Folded: a carry to the NPC's own `needsHome` treats its last leg as the return (`_checkCaught` runs, no PC dwell, `npc_returned_post` before sitting); Amara's deliveries share the path (README note); node and live tests | 12.3, 12.10 |
| **M6** north and south doorways stop the bed | `core/rooms.js` `updatePlayerRoom` 3074-3117, `recalculateAmbientVolume` 3206-3207; m01 2067-2071 | Folded: no change on a null room; proof through a north-south door (m01 copy or a showcase pair); audio proof waits for an approved bed (closes R1 M8) | 12.6, 12.11 |
| m1 call overlay plumbing | `getState` 2046-2066; `npc-action-icons.js` 47; `seating.js` 1003, 1145 | Folded in part: `getState` gains `call`; `npc-action-icons.js` joins slice 19's files. Seating already reads the raw state, so it needs no `getState` change | 12.5 |
| m2 owner and colleague both answer | 12.5 text | Folded: the owner wins and the colleague turns back with `answered`, no grumble or park; `playerNearby` and `playerDistance` on `desk_phone_answered` | 12.5, OQ37 |
| m3 when the call's lock is judged | `_speechUntil` 1138-1166 | Folded: held through a gap only while the per-line audience check passes (closes R1 m8) | 12.5 |
| m4 the `phone` pool | `chatterPool` 110-119 | Folded: owner lines on the owner, a `phone_message` topic for answerers, speaker-neutral scenario lines; validator warning on a display name in a scenario-level `phone` line | 12.5 |
| m5 grumbles are not per reason | lab 43-45 | Folded: `grumble_<reason>` first, then `grumble`; showcase `grumble_off`, `grumble_gone`; lab note; OQ54 | 12.4 (18a), 12.10, OQ54 |
| m6 `lockCues` tied to `officeVisuals` | `npc-office-visuals.js` 233-235 | Folded: the module installs under either switch, each layer checks its own (closes R1 m17) | 12.2 |
| m7 no event at `using` start; cosmetic prints silent | `_advanceJob` 1475-1478; adapter 2525-2534 | Folded: `npc_use_started:<objectId>`, so slice 20 touches `npc-needs.js`; `outputSound` also for a cosmetic copy (closes R1 M9) | 12.6 |
| m8 the duck fires on unheard speech | `_speak` 1163-1167 | Folded: duck only for a line the player hears, or an open chat minigame (closes R1 m13) | 12.6 |
| m9 chime gating cannot be proved before approval | `playAt` log 194-212 | Folded: unapproved chimes are logged with `reason: "unapproved"`; a recorded sample goes on the approval page | 12.2, 12.8 |
| m10 when telling happens, and to whom | 12.4 text | Folded: the hearers are those in range when the line or picture shows; no announce when nobody would learn | 12.4 (18b item 3), OQ52 |
| m11 18a's objective window; repeated wake and hint | `scenario.json.erb` 433; `apply-actions.js` 81-89 | Folded: a third mapping on `npc_used:kitchen_coffee` with the global; wake only on a real change of value; an observation variant once off; the hint gated | 12.4 (18a) |
| m12 swivel during a call; the listening proof | `scenario.json.erb` 478-511 | Folded: no swivel while `s.call` holds; the listening proof at the office coffee queue | 12.7 |
| m13 habit edge cases | `_expectedAwayMs` 1363-1371; `workstation-state.js` 173-174 | Folded: `lockIfAwayOverSeconds` alone implies `lockChance` 1; a null estimate counts as long; a late-discovered station uses the habit with the stored estimate and an idle clock from the leave | 12.2 |
| m14 uncollected fires for a print that will be fetched | 12.3 showcase values | Folded: the showcase copier's `uncollectedAfterSeconds` is 150, above `fetchAfterSeconds` | 12.3 |
| m15 the approval list; seven room types, two beds | 12.6, OQ42, OQ46 | Folded: one approval table in 12.8; a bed per room type (office, reception, IT and CEO office on `office_tone` at 1.0, 0.6, 0.8 and 0.35; meeting room none; break room `kitchen_tone`; server room the existing `server_room_ventilation`). **No new sound added**; the ring glyph without lighting uses `phone1`, so no new art either | 12.6, 12.8, OQ42 |
| m16 small 18b gaps | `_wakeParked` 1046-1060 | Folded: the `news` icon from the magnet's first `satisfies`; no retarget mid-job; a new per-NPC, per-need `_wakeParkedFor` | 12.4 (18b) |
| Socket stand-in `_comment` | review section 5 | Folded: the socket object carries a stand-in `_comment` for the room-dressing skill | 12.4 (18a) |

**Sizes after round 2:** 21 ~55, 16 ~205, 18a ~70, 17 ~175, 18b ~325, 19 ~305, 20 ~220; about 1,355
lines. Order unchanged. **Found while folding in:** m1's seating half is already met by the code (above);
nothing else new.

### 13c. Changes after section 12 review R3

Review: `OFFICE_LIFE_PLAN_REVIEW_S12_R3.md` (commit 4e3b90bc8; 0 blockers, 3 major, 17 minor, plus round 2
findings only partly fixed: R2 M5, m5, m11). Every finding was checked against the working tree at
4e3b90bc8 before it went in. **All 20 are folded in: 18 as the reviewer proposed, 1 in part, and 1 with its
remedy replaced; none is rejected outright.** M3's slot-order bullet is half wrong (only `copier_out_a` is takeable); m5's `onceOnly`
mapping for the socket's hint cannot be built (mappings have no player hint), so the hint is worded as a
state instead. The partly fixed round 2 findings close through M1, m1 and m5 here.

| Finding | Checked against | Outcome | Section |
|---|---|---|---|
| **M1** the return-leg rule reaches the lab's footholds and the sims golden | lab 732, 744-749, 766-799, 987; `test_needs_sims` 110; `test/js/npc-needs-slots.test.mjs` 21; `_tickNpc` 717-724; lab has no `npc_caught_at_post` (grep) | Folded: the rule applies to the print errand only (`job.errand`); the NPC stays in `job` mode on the leg, `_advanceJob` calls `_checkCaught`, the slot is placed, then `_goHome({ stayPut })`. Amara's deliveries and Sofia's footholds keep their dwell; the golden and the lab log are unchanged; a lab-shaped node test; 12.8 and 12.10 corrected (no lab `npc_caught_at_post` mapping); `affordance.deliverSeconds` named as a future opt-in (closes R2 M5) | 12.3, 12.8, 12.10, OQ51 |
| **M2** an owner on a call can start a job | `_tickNpc` 659-731; `_startJob` 1284; `seating.js` `needsStop` 1061-1076 | Folded: while `s.call` holds, `_tickNpc` returns after decay and the return-path checks, before selection; urgent needs, due errands and tempted magnets wait for the call; node tests; OQ55 | 12.5, OQ55 |
| **M3** owned prints and a full slot pool | adapter `revealOutput` 2511-2535; `_revealOutput` 1556-1570; `test_needs_sims` 218-262 | Folded: the note lever is `onceOnly`; an owned print with no free slot recycles the oldest forgotten reserved slot (`recycled`), else a cosmetic copy with `print_no_slot` and no printing icon (checked at job start); OQ56. **In part:** slots are filled by id, but only `copier_out_a` is takeable (`b`, `c` read in place), so the reviewer's "takeable ones first" is corrected; the plan keeps `a` first, as a forgotten print the player can take, and drops the claim that `d` and `e` protect Sanjay's beat | 12.3, OQ56 |
| m1 `grumble_<reason>` through `_pickBark` gives pictures | `_pickBark` 1147-1160; `chatterPool` 110-121; `PICTURE_DEFAULT` 75-83; lab 43-45 | Folded: the topic is chosen by which pool has lines before `_pickBark`; `_grumble` gains `reason`; `PICTURE_CHATTER` gains `grumble_off` and `grumble_gone`; a test that a `grumble`-only scenario still speaks for `off` (closes R2 m5) | 12.4 (18a), 12.10, OQ54 |
| m2 `_turnBack` per reason | `_turnBack` 1080-1097 | Folded: one table of reasons (`avoid`, `off`, `gone`, `answered`) for `mindChanged`, grumble, fallback select and parking | 12.4 (18a) |
| m3 hang-up leaves the line playing and the colleague standing | `npc-needs-chatter.js` `say` 214-235; `npc-needs.js` 663, 676 | Folded: `cancel(npcId)` on the voice; the hang-up sets `useRemaining` to 0; a frozen answerer does not keep the phone ringing | 12.5 |
| m4 the colleague's `expectedAwayMs` needs the call's length first | `_leavePost` 1300-1313; `exchangeLines` null while loading | Folded: the call and its length are chosen at the claim; a pending story falls to the pool | 12.5 |
| m5 trigger observations unreachable; a trigger action cannot be gated | `interactions.js` 820-846; `examine.js` 6-12; `apply-actions.js` 78-280 | Folded with a different remedy for the socket: mapping fields (`npc-manager.js` 840-860) have a bark but no player hint, so a `onceOnly` mapping would speak as a colleague; the hint stays in the trigger, worded as a state ("The coffee machine is switched off at the wall.") so a repeat reads well. The table's hint moves to the pizza's description and `requiresItemHint`; observations dropped from both objects (closes R2 m11) | 12.4 (18a, 18b) |
| m6 bed order with authored neighbours | `core/rooms.js` 3169-3208; m01 2067-2071 | Folded: authored own, profile own, authored neighbour at 0.125/0.01, nothing; profile beds never bleed; the m01 `it_room` change stated | 12.6 |
| m7 unknown and unapproved bed keys cut the loop | `sound-manager.js` 366-372, 393; sis01 727, 2133 | Folded: a key missing from the audio cache is no bed; `fadeAmbientTo` checks the key before stopping the old loop; validator warning for authored keys not loaded, info for profile keys until approval; the office bed is keyed `office_ambient` | 12.6, 12.8 |
| m8 `server_room_ventilation` is an MP3 loop | `sound-manager.js` 116-117 | Folded: stays MP3, no approval, joins the seam check; authored levels win over the profile's 0.6 | 12.6 |
| m9 start and output sounds not behind `roomTone`; `object_revealed` without a producer | `npc-needs.js` 2571 | Folded: both play only with `roomTone`; `outputSound` only with a `producerId` | 12.6 |
| m10 two existing files the preset changes touch | `test/js/office-presets.test.mjs` 21-25; `office-presets.json` `_comment` | Folded: listed in the 19 and 20 briefs | 12.8 |
| m11 the quiet look catches starved needs and skips the back-off | `_select` 852-853; lab 683, 901; `SELECT_BACKOFF_TICKS` | Folded: tempted means `urgentAt < level <= urgentAt + tempt` and not starved; a quiet look that found nothing backs off | 12.4 (18b) |
| m12 a late-discovered station would cue at the click | `workstation-state.js` 173-174 | Folded: the late decision fires `how: "late"`, which the visuals ignore; test | 12.2 |
| m13 swivel during a pairing | `_chatPartner`, `_talking` | Folded: no idle swivel while paired or talking; call speakers are in the speakers list | 12.7 |
| m14 "pulsing" must not scale | standing rule (no rescaled pixel art) | Folded: alpha pulse only | 12.5 |
| m15 the phone's approach cell may be the owner's chair spot | `seating.js` 1246-1247; `npc-needs.js` 1437, 1459 | Folded: the phone authors `useFrom` to the side; validator warning within `NEAR_CHAIR` | 12.5 |
| m16 sizes do not add up | 12.3, 12.4 part sums | Folded: every figure is now its parts' sum; 18b split into 18b-i (~235) and 18b-ii (~125); total about 1,475 | 12.4, 12.8 |
| m17 stale text | `core/rooms.js` after ba1a4fa51; OQ38; `_emit` 480-483; `npc-needs-tick-cost.test.mjs` 95 | Folded: status line and line-number note updated, `core/rooms.js` citations in section 12 renumbered, OQ38 names `phone_message`, `npc_use_started` goes through `world.emit` and the tick-cost bound is re-run | 12, 12.1, 12.6, OQ38 |

**Final slice list after round 3, in build order:** 21 idle swivel (S, ~60); 16 lock-screen habits and
cues (M, ~210); 18a coffee off (S, ~80); 17 print and forget (M, ~180); 18b-i the magnet (M, ~235);
18b-ii word of mouth (M, ~125); 19 desk-phone calls (L, ~335); 20 room tone (M, ~235). About 1,475
lines.

**Found while folding in.** (1) Event mappings cannot show the player a hint, only an NPC bark, so any
"show the player a message once" lever needs either a state-worded trigger hint (used here) or a small
mapping field later. (2) Only `copier_out_a` of the showcase's slots is takeable. (3) sis01's two
authored ambient keys are unloaded today, and slice 20's key check fixes the cut they cause; naming the
office bed `office_ambient` means its meeting room gains a bed once the file is approved.

### 13d. Changes after section 12 review R4

Review: `OFFICE_LIFE_PLAN_REVIEW_S12_R4.md` (commit 744eb1cf7; 0 blockers, 3 major, 19 minor; round 3's M3
and m16 marked partly fixed, with follow-ons on m1, m2, m3, m6, m7 and m9). Every finding was checked
against the working tree at 744eb1cf7 before it went in. **All 22 are folded in; none is rejected.** One
goes further than the reviewer asked: m14 is answered by putting the whole ambient change behind
`roomTone` (the coordinator's rule that shipped missions change only if they opt in), not only by
listing the changed rooms.

| Finding | Checked against | Outcome | Section |
|---|---|---|---|
| **M1** a frozen answerer answers after the phone rang out | `_tickNpc` 659-683 (freeze keeps the job; unfreeze calls `_moveForPhase`) | Folded: ring-out ends every answerer job with `rang_out` (no `mindChanged`, grumble, fallback or park) and drops the chosen call; a frozen answerer's job is cleared and `prevMode` set to `returning`; one ring fires unanswered or answered, never both; node test; OQ37 | 12.4 (18a table), 12.5, OQ37 |
| **M2** the errand's caught check has no guard and runs on the way out | `_checkCaught` 1393-1404 (no guard); call site 691; `_leavePost` 1304; showcase copier and `tom_pc` both in `office` | Folded: called only while `job.errand && job.carrying && !s.atPost && !s.caughtEmitted`; tests for the outbound leg, at most one per errand, and an errand started from `returning` | 12.3 |
| **M3** a crossfade that turns back silences the room | `sound-manager.js` 360-404 (one `_ambientTween`; a playing key is not restarted) | Folded: the outgoing sound and its tween are tracked in their own fields; asking for the outgoing key cancels its fade-out and tweens it up; node test A to B to A within 400 ms, and A to B to C | 12.6 |
| m1 recycling does not cover Sanjay's unowned prints | 12.3 "A full pool" | Folded: any print, owned or not, recycles the oldest forgotten slot; test with an unowned print (closes R3 M3's remainder with m2 and m6) | 12.3, OQ56 |
| m2 ownership stamped unconditionally | 12.3 design bullet | Folded: an owner is stamped only with a `printHabit` or a `print` command | 12.3 |
| m3 `pickable` has no viewer | `describe` 2117; `_advanceJob` 1455; `_carryCandidate` 1239 | Folded: `pickable` unchanged; the reservation is a filter in `_carryCandidate` and the errand candidate | 12.3 |
| m4 the errand's arrival and estimate | `seating.js` 1073-1075; `_expectedAwayMs` 1376-1377 | Folded: the errand completes on arrival without `using`; its estimate leaves out the target's `useSeconds` | 12.3 |
| m5 the print's roll id | 12.3 habit bullet | Folded: rolls on `<ownerId>:<printCount>` | 12.3 |
| m6 the note lever's `onceOnly` and reloads | `npc-manager.js` 1004-1009 | Folded: a 60 s cooldown instead; OQ58 | 12.3, OQ58 |
| m7 the hint's default title | `apply-actions.js` 168-171 | Folded: neutral titles ("Wall socket", "Desk phone"); validator warning on an untitled hint in the showcase or a scenario with no security story | 12.4 (18a), 12.5 |
| m8 a magnet left on show at 0 servings after a reload | 12.4 item 6 | Folded: at install and whenever nobody is using it, a shown magnet at 0 servings finishes; test | 12.4 (18b-i) |
| m9 the sight check and the tick-cost bound | `npc-needs-tick-cost.test.mjs` 95 | Folded: sight reads the per-tick object cache; the test is re-run in 18b-i | 12.4 (18b-i) |
| m10 `grumble_off` with the `avoid` icon; logged topic | `PICTURE_CHATTER` 69-74; `_grumble` 1108, 1114 | Folded: the need's own icon, falling back to `avoid`; the chosen topic is logged; OQ54 | 12.4 (18a), OQ54 |
| m11 a ring during a call | 12.5 ring rule | Folded: a ring while ringing or in a call is ignored; test | 12.5 |
| m12 answerers on their own call; other ways a call stops | `_tickNpc` 644-651 | Folded: NPCs with `s.call` never answer; KO, hostile, hidden or script-suspended ends the call with `reason: "unavailable"` | 12.5 |
| m13 call lines and the duck | `_speak` and `overheard` | Folded: call lines go through `_speak` with `overheard`; calls in 20's duck test | 12.5, 12.6 |
| m14 own-room-first changes levels in four shipped missions | m04 `battery_hall_2`; m09 four rooms; sis01 `it_security_office`, `ward_7` (rooms order and door neighbours) | Folded, further than asked: the bed order, own room first, the null-room keep and the crossfade run only with `roomTone`, so none of these rooms changes; the rooms are listed as what a mission hears if it opts in; local, uncommitted copies of m01, m04 and sis01 with `roomTone` on join the live check, and each shipped mission is also played without it; OQ57 | 12.6, 12.8, OQ57 |
| m15 two authored neighbours | sis02 `scada_control_room`; m09 three rooms | Folded (with `roomTone`): an open door first, then rooms order; test | 12.6 |
| m16 approving `office_ambient` changes sis01 | sis01 2133 (`room_hospital_meeting`) | Folded: the approval table and 12.6 say so; the room type is corrected | 12.6, 12.8 |
| m17 the cosmetic copy's sound skips the gate | 12.6 adapter text | Folded: the adapter emits `object_revealed:<producerId>` with `cosmetic: true` and the visuals play it under the same gates | 12.6 |
| m18 files missing from 20's brief | `core/game.js` 1966 | Folded: `seating.js` (the typist count, about 5) and the install site beside the office visuals | 12.6 |
| m19 sizes and stale text | part sums; 12.9 header; 12.6 file count; 12.5 pool sentence | Folded: every slice size is now its parts' sum, written beside it; the 12.9 header, "seven downloads and one derivative" and the `phone_message` pool corrected (closes R3 m16) | 12.5, 12.6, 12.8, 12.9 |

**What changes for shipped missions** (corrected after review R5, 13e: round 4's m16 was wrong). Only an
unloaded ambient key: it fades the current loop out over 400 ms instead of cutting it, ending at the
same silence as today, in sis01's `ward_7` and `it_security_office`, both through `hospital_ambient`.
`major_incident_room` is unchanged, and approving `office_ambient` changes no shipped mission without
`roomTone`. Nothing else: no shipped mission has needs NPCs or workstation fields, and none sets
`roomTone`.

**Final slice list after round 4, in build order:** 21 idle swivel (S, ~58); 16 lock-screen habits and
cues (M, ~205); 18a coffee off (S, ~85); 17 print and forget (M, ~190); 18b-i the magnet (M, ~245);
18b-ii word of mouth (M, ~125); 19 desk-phone calls (L, ~355); 20 room tone (M, ~256). About 1,519 lines.

**Found while folding in.** (1) No shipped mission declares needs NPCs or workstation fields, so slices
16 and 21 cannot change one; the `needs` arrays in m02 and sis01 are puzzle fields. (2) Gating the
ambient change behind `roomTone` also removes the m01 server-room crossfade from shipped play, which
round 3 had listed as a deliberate change; it now applies only to the local m01 copy used for the proof.

### 13e. Changes after section 12 review R5 (final full round)

Review: `OFFICE_LIFE_PLAN_REVIEW_S12_R5.md` (commit 4ea361d9a; 0 blockers, 2 major, 15 minor; round 4's m16
marked a wrong premise and m19 partly fixed). Every finding was checked against the working tree at
4ea361d9a before it went in. **All 17 are folded in; none is rejected.** M2 takes the reviewer's option (a).
With this round **the review of section 12 is complete**; the plan waits for the user's decisions on the
open questions (12.9) and the approval table (12.8).

| Finding | Checked against | Outcome | Section |
|---|---|---|---|
| **M1** with room tone on, the start room has no bed until the player leaves it | `core/rooms.js` callers 3113, 3160-3165; `core/game.js` 1954-1969; `office-presets.js` 34 | Folded: `core/rooms.js` exports `refreshAmbient()`, and `office-room-tone.js` calls it once the profile table loads; node test (no bed before the table, the office bed after the refresh); live proof at spawn and after a reload without moving | 12.6 |
| **M2** the pizza showcase cannot show "Missed it." | showcase `needs` blocks 298-580 (only Tom, Sanjay and Rosa have hunger or social) | Folded, option (a): `servings: 2`, and Amara gains hunger `{ decayPerMin: 1, urgentAt: 40, initial: 65 }`, inside the tempt band at once; the office announce sends three for two slices. Her hunger is not urgent until about minute 25, so it adds no decision-log line (decay logs nothing before `urgent`; `registered` carries no data, `npc-needs.js` 331) and moves no existing beat; `GOLDEN_SIMS_DAY` cannot move (the sims fixture is a hand-copied stub, and the 15-minute day ends first). Option (b), staging through the test bridge, was not needed | 12.4 (18b-i), 12.8 |
| m1 approving `office_ambient` does not change sis01 | sis01 716, 740, 1676, 1691-1694, 2125, 2135-2137; `core/rooms.js` 3172-3203 | Folded: the unknown-key change is in `ward_7` and `it_security_office` through `hospital_ambient`; `major_incident_room` never reaches its key without `roomTone`, so approval changes no shipped mission; corrected in 12.6, 12.8 (approval row and shipped-mission statement) and 13d (closes R4 m16) | 12.6, 12.8, 13d |
| m2 the bed order cannot be node-tested in `core/rooms.js` | `recalculateAmbientVolume` private (3169); tests stub `core/rooms.js` | Folded: a pure `systems/ambient-choice.js` (about 10 lines) on the test-harness copy lists | 12.6 |
| m3 how the unknown-key fade is built | `sound-manager.js` 327-349, 374-389, 395-415 | Folded: through the volume-0 path, never `stopAmbient(400)`; `fadeAmbientTo(key, level, ms, { crossfade })` from `core/rooms.js` under `roomTone`, and `_ambientLevel`; node test with `roomTone` off (unknown key, then the previous key within 400 ms) | 12.6 |
| m4 a third room inside the fade | 12.6 crossfade | Folded: a replaced outgoing sound still fading is stopped at once; test A to B to C to A | 12.6 |
| m5 the typing loop's duck and stop | `music/ending-audio.js` 69-85 | Folded: it ducks with the bed and stops on a room change; the credits stop it already | 12.6 |
| m6 new validator warnings in sis01 | sis01 727, 2133 | Folded: the slice report names them | 12.6 |
| m7 a frozen colleague turned back with `answered` | `_goHome` 1621-1631; `_tickNpc` 659-668 | Folded: any turn-back of a frozen answerer clears the job and sets `prevMode` to `returning` with no move; test | 12.5 |
| m8 the colleague's action icon | `pickIconEntry` 92-100 | Folded: a target with `phoneOwner` gives the phone icon; test | 12.5 |
| m9 `cancel` must end the queue's wait | `npc-needs-chatter.js` 225-234 | Folded: `cancel` resolves the current wait and marks queued entries to skip; test that a later line plays at once | 12.5 |
| m10 the ring-out case in the live list | R4 section 6 | Folded | 12.5 |
| m11 clear `_printedBy` on every reveal | adapter `revealOutput` 2511-2535 | Folded: every reveal sets or clears it; test a slot owned, filed and revealed again unowned | 12.3 |
| m12 recycling takes the takeable slot first | slot order by id | Folded: read-in-place slots are recycled before takeable ones; OQ59 | 12.3, OQ59 |
| m13 the lever objective and Tom's mappings | `_completeJob` 1508-1513; showcase 345-346; `workstation-state.js` 170-182 | Folded: `npc_print_fetched:<ownerId>` `{ slotId, viaCommand }` for the lever objective; the two mappings conditioned on `data.need === "work"`; README reworded (Tom comes back by way of the copier) | 12.3 |
| m14 "no security story" is not checkable | validator scope | Folded: the hint-title warning applies where a scenario sets `officePresets` or has needs NPCs; one fixture | 12.4 (18a) |
| m15 sizes and stale text | 12.5, 12.4, 12.6, 12.8 | Folded: 19's validator is 40 in its sum; 18b's `npc-needs.js` is 245 + 15 = 260, stated; the section 12 status line, the 12.8 "Round 3" paragraph, the 12.9 header and the "core reveal" sentence corrected (closes R4 m19) | 12, 12.4, 12.5, 12.6, 12.8, 12.9 |

**Sizes after round 5:** 17 gains m11 to m13 (190 to 200), 19 gains m7 to m9 (355 to 366, with the
validator at 40), 20 gains M1, m2, m3 and m4 (256 to 279, now L). **Final slice list, in build order:** 21
idle swivel (S, ~58); 16 lock-screen habits and cues (M, ~205); 18a coffee off (S, ~85); 17 print and
forget (M, ~200); 18b-i the magnet (M, ~245); 18b-ii word of mouth (M, ~125); 19 desk-phone calls (L,
~366); 20 room tone (L, ~279). About 1,563 lines.

**What changes for shipped missions, final.** One thing: in sis01's `ward_7` and `it_security_office`,
the unloaded `hospital_ambient` key fades the current loop out over 400 ms through the volume-0 path
instead of cutting it, ending at the same silence as today. Approving any of the new sounds changes no
shipped mission. Nothing else changes in m01-m10, sis01 or sis02.

**Self-check after folding in.** Every "about N lines" in section 12 was compared with the sum of the parts
written beside it (16: 205; 17: 200; 18a: 85; 18b: 370 = 245 + 125; 19: 366; 20: 279; 21: 58; total
1,563), and section 12 was searched for claims about sis01 and `office_ambient`: the only remaining
mentions are the corrected ones.

### 13f. User decisions (2026-11-06)

The user answered 12.9 and the approval table in 12.8. What changed in the plan:

| Decision | Change | Section |
|---|---|---|
| All nine rows of the approval table approved (chimes, lock icons, room-tone beds, one-shots, phone ring and its derivative, wall socket, cake, phone icon) | Table marked approved; the cake is now wanted and may replace pizza in the 18b-i showcase | 12.8 |
| OQ27, 29, 30, 32, 34-40, 42-44, 47-59: defaults accepted; OQ33 unanswered, default taken | None | 12.9 |
| OQ28 accepted, with a question about per-NPC credentials and desktops | Investigated: the SE lab's remote desktop is a declared `give_item` grant of a `pc` container; an open-screen session reuses it with data only, logging in at a locked screen needs a follow-on slice 16b (about 70, unscheduled); slice 16 unchanged | 12.2, 12.8 |
| OQ31 changed: drop a magnet anywhere, like the lab's USB and QR | The magnet is a droppable held item with `affordance.magnet` through `item-drop.js` and the server's `player_drop`; `magnet_placed` with `reachable`, `magnet_unreachable`, pickup and re-drop rules, removal on finish; declared spot kept as an option; new risks listed; 18b-i 245 to 315 (L) | 12.4, 12.8, 12.10 |
| OQ45 accepted, with "small rolling motions mostly along x, a little swivel very occasionally" | Slice 21 retunes the existing chair roll (`fidgetOffset`) to x-dominant, out and back, held while typing or talking, still `Math.random`; `swivelChance` 0.25 to 0.05; 58 to 65 lines | 12.7, 12.8 |
| OQ46 accepted, with "try to get them all on one sprite sheet (try once first)" | Cake, wall socket, two padlock icons and phone icon on one PixelLab sheet at native cell sizes, one attempt, single generation only for failures | 12.8, 12.9 |

**Sizes after the decisions:** 21 is about 65 and 18b-i about 315; the total is about 1,640 (was 1,563).
Build order unchanged: 21, 16, 18a, 17, 18b-i, 18b-ii, 19, 20. **Building starts with slice 21.**
