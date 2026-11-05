# Office Life: plan for reusable NPC office behaviour

Status: **plan, 2026-11-05, revised after adversarial review R1
(`OFFICE_LIFE_PLAN_REVIEW_R1.md`; outcomes in section 5). Nothing here is built.** Engine changes
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
| Live adapter | `npc-needs.js` `createEngineWorld` 706-922 | Object scan (`listObjects` 773-787; it skips any object with neither `affordance` nor `needsTag` at 782, before `describe` runs), approach cells from `useFrom` (792-804), synchronous reachability via EasyStar (805-832), player proximity (`playerProximity` 833-846: same room, clear line, **96 px**), pick up / consume / drop held items (867-908). `pickUp` hides the sprite (872); a carry job **always consumes** at the target (`_completeJob` 588 → `consumeHeld`, which destroys the sprite and removes the object server-side, 884-892) |
| Script composition | `npc-needs.js` `onExternalMove` 240-250, `control` 253-280; `npc-behavior.js:2456`; `npc-manager.js:855, 1164-1166` | Any non-needs `goToAndStay` suspends needs; eventMapping `needs: "suspend" \| "resume" \| {set}` |
| Movement | `npc-behavior.js` `goToAndStay` 2448, `cancelMove` 2499, `faceWorldPoint` 2518, `_triggerGoToStayArrival` 2524; chat freeze guard 710 | The only way needs moves NPCs; collision, stall recovery and depth sorting come free |
| Route patrols | `npc-behavior.js` route waypoints with `dwellTime` (1072-1110), route actions `{unlockRoom, useObject}` (1609-1647), route-room preload (658-672) | Fixed beats such as Len's badge round in `lab_physical_pentest`; precedent for preloading rooms |
| Workstations | `systems/workstation-state.js` (`isWorkstation` 43-46, `ownerOf` 49-55, `onLeft`/`onReturned` 112-134, `installWorkstationState` 157); `interactions.js:792` | Owner leaves → screen locks or stays open (`locksScreenOnLeave`, seeded `lockChance`); globals `<id>_screen_locked`, `<id>_owner_away`; events `workstation_owner_left/returned`, `workstation_accessed`, `workstation_locked_attempt`. Reads `scenarioData` directly, so anything a preset adds must be visible to it too |
| Action icons | `systems/npc-action-icons.js` | **Text** glyph over an NPC's head while it has a job (`pickIcon` 22-32; a monospace `add.text`, 69-72; the showcase uses `"PC"`, `"C"`), pulsing during the wind-up. Shown for every NPC with a job, in any loaded room, lit or dark (64) |
| Debug overlay | `systems/npc-needs-debug.js` | Need bars and job label per NPC; `window.__test.needs.overlay()` |
| Seating | `systems/seating.js` (`updateSeatedNPC` 686, `needsStop` 739-748, `seatPreference` 759-768, chair fetch 899, `tuckIn` 883) | Needs NPCs sit at desks, fetch a swivel chair, tuck it in when they leave. Default: `'fetch'` for **any** object that satisfies `work` (even another NPC's desk) or the NPC's own post, else `'near'` (sit only on a chair already there). The "chairs at another NPC's post" guard lifts when the stop is that post (865-866). NPCs whose atlas has no `sit_*` frames always stand |
| Lighting | `systems/lighting.js` header 1-45; `RANSOM_VARIANT` 87; emitter table `EMITTERS` 180-196 (matched on **texture key**); draw order 1033-1041; `clusterEmitters` 584-600 | Per-object glow with condition variants (`emitters` keyed by object id, first matching `globalVars` condition wins); motion-sensor rooms; `screen`/`blink`/`pulse`/`breathe` effects. In a **lit** room a glow sits under the multiply light map, just in front of its object; only `ransom` and `above: true` variants draw above it. Plain screens within 32 px share a damped glow |
| Sprite variants | `core/rooms.js` `registerSpriteVariantListeners` 688-722 | Object texture swaps when a `globalVars` condition changes (globals only) |
| Reveal on global | `core/rooms.js` `hideUntilReveal`/`showRevealedObject` 2952-2976, `revealRoom` 3023 | A declared object stays hidden and non-interactive until a named global turns `true`; globals are restored before a room reveals, so the reveal survives a reload. **One-way**: the listener only handles `true` (2961-2963). The lab's planted keylogger uses it |
| Server object rules | `app/controllers/break_escape/games_controller.rb` `object_state_params` 2183-2188, `find_accessible_item` 1869; `app/models/break_escape/game.rb` `add_item_to_room!` 378, `remove_item_from_room!` 454 | `updateObjectState` may only change `opened, on, brightness, screen_state`, so **visibility is not saved server-side**. Collecting checks that the item is declared, in an accessible room and `takeable`; it does not look at `revealOnGlobal` or at the item's position. Adding a room object is limited to NPC-held items and player drops of held `droppable` items, so an NPC-moved scenario object cannot have its new position saved |
| State sync | `state-sync.js` 160-170 | Every global syncs (the server accepts any key that is not an imported global, `game.rb` 274-292); NPC visibility from `setNPCVisible` is saved (`npcVisibility`) |
| Sound | `systems/sound-manager.js` `play` 195, `playAmbient` 293; `assets/sounds/` | Non-positional play at a category volume; a looped ambience with fade-in. Office-usable files that exist: `drink_gulp`, `eat_snack`, `drawer_open`, `page_turn`, `chair_roll`, `footsteps`, `keypad_beep`, `phone_vibrate`, `message_received`, `GASP_UI_Clicks_*`, `server_room_ventilation` (an ambience precedent). No printer, kettle, coffee machine, desk-phone ring or office-room tone |
| Character atlases | `assets/characters/<key>.json` | Per-direction `breathing-idle`, `walk`, `cross-punch`, `lead-jab`, `taking-punch`, `falling-back-death`; `sit_*` frames on some atlases (`seating.js:173`). No typing, pouring or carrying animations |
| Small item sprites | `assets/objects/`, `assets/icons/` | Native-size sprites usable as held items or icons without resizing: `notes1` 16×16, `notes_postit1` 9×9, `coffee_cups1` 21×20, `office-misc-cup*`, `kettle1` 15×18, `phone1` 20×17, `dirty_mugs1`; icons `talk` 21×18, `mark-question`, `clipboard`, `mail-new` 16×16 |
| Sight challenge | `systems/npc-sight-challenge.js` 1-48 | `challengeOnSight` with `near: {object, radius}`, `requireGlobal`, `skipIfGlobal`, cooldown |
| Game clock | `systems/game-clock.js` (`parseGameClockRate` 54, `gameSecondsAt` 99, `timeParts` 158); installed in every game (`core/game.js:1678`) | Elapsed time that survives reload (`elapsedMs()`, saved with the sync); optional in-game time of day with a story `rate` and anchors. The **needs clock is separate**: in memory, 0 on every load (`npc-needs.js:115`, `reset` 199) |
| Room state sync | `systems/room-state-sync.js` (`addItemToRoom` 17, `removeItemFromRoom` 85, `updateObjectState` 138) | Server-side add/remove/update of room objects |
| Phone barks | `systems/npc-barks.js`; `npc-manager.js` 1482-1521 | DOM notification barks (phone style) from eventMappings. **There is no in-world speech bubble for sprite NPCs** |
| Validator | `scripts/validate_npc_needs.rb` (161 lines), `scripts/scenario-schema.json` | Bounds, missing targets, T1/P timing report, "target in another room" warnings |
| Tests | `test/js/npc-needs.test.mjs`, `workstation-state.test.mjs`, `npc-action-icons.test.mjs`, `seating.test.mjs`, `npc-sight-challenge.test.mjs`, `lighting-room-variants.test.mjs` | Stub-world, manual-clock node tests with byte-identical decision logs |

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
| 1 | Affordance presets by object type | `affordance` fields, `useFrom`, `approachCell`, validator | A preset table (one JSON file read by `office-presets.js` and the validator) keyed on **exact** types plus an `officeType` field; one resolver used by `listObjects`, `describe`, `getObject` and `isWorkstation` | **Keep, early.** Pure data; removes most hand-wiring |
| 2 | Multi-step routines | use and carry jobs, presence-driven carry, `revealOnGlobal`, capacity | Carry outcomes (`consume`/`place`/`stow`) and reusable reveal slots (slice 7, useful alone); then a `steps` list on the job, a scenario routine library, a seeded routine-or-plain-use mix (slice 9) | **Keep, central.** Build as a chain of the existing two job kinds, not a new mover |
| 3 | Visible object state | workstation-state, lighting emitter variants, spriteVariants | An "activity" registry (in use, busy, output waiting), built-in emitter variants for workstations, fix for stale workstation globals on reload | **Keep, early and small.** Half of it is authoring today |
| 4 | NPC↔NPC social, queues | capacity 2 cooler, `faceTo`, seating | In-world speech bubbles (new module), pairing at shared objects, queue cells | **Keep, split.** Bubbles + pairing first, queues later |
| 5 | Daily schedule | GameClock, `control({set})`, route patrols | Schedule entries that change need weights or start routines; preemption | **Defer to Tier 2.** Sessions are 20-40 min, so a "day" is compressed |
| 6 | Personality traits | need fields, `lockChance`, `roll()` | Trait sugar expanded at register time | **Keep, cheap.** No runtime system, only expansion |
| 7 | Consumables and refills | affordance, carry jobs | Per-object stock counter, a restock interest | **Defer.** Useful for longer absences, low priority |
| 8 | Interruptions | `control`, `onExternalMove`, eventMappings | Preempting a running job by priority | **Merge with 5.** Same mechanism |
| 9 | Opportunity windows | workstation-state, `npc_left_post`, `playerNearby`, `revealOnGlobal` | An away-estimate on `npc_left_post`, left-behind items via trait rolls, piles with a count | **Keep as gameplay states.** Mostly scenario wiring once 2, 3 and 6 exist |
| 10 | NPCs noticing the player at their desk | `_playerProximity`, sight challenge `near.object` | Proximity data on `npc_returned_post`, an `npc_caught_at_post` event; first, a fix so a use of the NPC's own desk is not a leave (2.11) | **Keep, early.** About 40 lines plus the fix; big payoff for the lab |
| — | What the player sees (added after R1) | action-icon loop, carried sprite, `faceWorldPoint`, sit frames, sound manager, small sprites | Sprite action icons, a carried item drawn at the hand, a work bob and an idle glance, per-preset use sounds heard only in the player's room (2.12) | **Keep, early (slice 3).** Without it the rest is invisible |

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

**Tests.** Node: the decision log for `test_needs_sims`'s stub world is byte-identical with steps
1-3 on; with step 4, a fixture with an unreachable target asserts at most one path search per
second, and a contention fixture asserts the waiting NPC still starts within four ticks of the
target freeing. A micro-benchmark in the node test: 20 NPCs × 200 objects × 1,000 ticks under a
set budget. Live: frame time with 15 NPCs, from a **generated, uncommitted** copy of
`test_needs_sims` (a node script writes `scenarios/test_needs_sims_15/`, where the server can load it,
with the five staff cloned three times at offset desks and seeds; never staged, deleted after the
run), before and after.

**Risk.** Back-off delays a blocked NPC by up to a second; clearing on every completion keeps
contention timing close to today.

### 2.1 Affordance presets by object type (proposal 1)

**Authoring.** An object gets a working affordance from its `type` alone; anything written on the
object overrides the preset field by field.

```jsonc
{ "id": "tom_pc", "type": "pc" }                               // work, 10 s, useFrom {0,1}, seat fetch, workstation
{ "id": "kitchen_coffee", "type": "coffee_station1" }          // caffeine, 12 s, useFrom {0,1}, seat near
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

Preset table (one value per cell; the values are `test_needs_sims`'s hand-wired ones where it has
the object, so the parity test below has few overrides):

| Preset id | Exact types | satisfies | restores | useSeconds | capacity | useFrom | seat | extra |
|---|---|---|---|---|---|---|---|---|
| `desk_pc` | `pc`, `pc3`, `pc10`, `laptop`, `workstation` | work | 60 | 10 | 1 | {0,1} | fetch | `workstation: true` |
| `coffee` | `coffee_station`, `coffee_station1`, `kettle` | caffeine | 70 | 12 | 1 | {0,1} | near | |
| `cooler` | `water_cooler`, `water_cooler1` | thirst, social | 70 | 15 | 2 | {0,1} | near | `chatter: "cooler"` (2.4) |
| `fridge` | `qdc_fridge1` | hunger | 80 | 15 | 1 | {0,1} | stand | |
| `microwave` | `microwave1` | hunger | 60 | 10 | 1 | {0,1} | stand | |
| `sofa` | `leather_sofa1` | rest | 80 | 20 | 2 | {0,-1} | near | |
| `copier` | `photocopier`, `photocopier1` | (none) | | 8 | 1 | {0,1} | stand | routine target; output slots (2.2) |
| `shredder` | `shredder`, `shredder1` | (none) | | 6 | 1 | {0,1} | stand | accepts `to_shred` |
| `filing` | (none: `officeType: "filing"` only) | (none) | | 12 | 1 | {0,1} | stand | routine target |
| `post_tray` | (none: `officeType` only) | (none) | | 5 | 1 | {0,1} | stand | routine target |
| `desk_phone` | (none: `officeType` only) | (none) | | 0 | 1 | owner's desk | | rings (2.9) |

A preset with no `satisfies` is a routine target only (2.2); it never draws an NPC on its own.
`seat` uses the values `seating.js` already understands; `'near'` is new to the schema (today's
schema enum is `fetch`/`stay`/`stand`, though `seatPreference` accepts `near`).

**Engine.** New `systems/office-presets.js` (about 60 lines, no imports) loads the table from
`public/break_escape/data/office-presets.json` (passed in at install, so node tests read the file
directly) and exports `resolveAffordance(scenarioData, scenario)`: authored fields over the preset,
`false` meaning none, exclusions above applied. One resolver, four callers:
- `listObjects` (`npc-needs.js:782`): the skip test becomes "no resolved affordance and no
  `needsTag`", or a preset object never reaches `describe` and the slice does nothing;
- `describe` (716-727) and so `getObject`, `approachCell`, seating's `needsObject`;
- `workstation-state.js` `isWorkstation` (43-46), which reads raw `scenarioData` through its env;
  the env gets the resolver so a preset `desk_pc` is a workstation;
- the action-icon `targetInfo` (36-49), so icons see preset `satisfies`.
The resolved value is cached on the sprite (`sp._officeAffordance`) and cleared when the scenario
flag is off. Dynamic import in `core/game.js` beside the needs install, so no test-harness copy
list changes. About 130 lines.

**Validator.** `validate_npc_needs.rb` reads the same JSON file (no Ruby copy, so no parity test
between two tables) and expands presets the same way, so the "need with no object" error and the
T1/P report see preset affordances. It lists every object that gained a preset, every preset
workstation with no owner (`ownerOf` would return null: harmless, but surprising), and every
`officeType` it does not know. About 50 lines.

**Schema.** `officePresets` (boolean, scenario level); `officeType` (enum of preset ids, object
level); `affordance` becomes `oneOf: [object, false]`; `seat` gains `near`. About 25 lines.

**Save/lazy-loading.** None new: presets are resolved when the object is described.

**Performance.** One map lookup per object, cached on the sprite.

**Visible change.** None by itself; it is what lets slice 5's indicators and the copier, tray and
filing targets of slices 7 and 9 work without per-object wiring.

**Tests.** Node: the resolver (exact match, `officeType` wins, exclusions, override merge, `false`
opt-out); `listObjects` on a stub room includes a preset-only object; `isWorkstation` through the
env. **Parity, stated honestly:** `test_needs_sims` cannot lose every affordance, because some of
its values are deliberate and not preset material. The fixture is a generated copy with
`officePresets: true` and each affordance replaced by **only the fields that differ from the
preset**, and that remaining-overrides list is written in the test so a reader sees it:
- `amara_pc`: `accepts: ["post"]` (the parcel beat);
- `office_coffee`: `useFrom: {dx: -1, dy: 0}`;
- `kitchen_coffee`: `useFrom: {dx: 0, dy: -1}`;
- `microwave`: `useFrom` absent today, so `useFrom: null` (falls back to nearest walkable);
- `water_cooler`: `useFrom: null`;
- `grace_laptop`, `rosa_laptop`: `affordance: false` (no affordance today; the preset would make
  them work targets);
- `washing_up_tray`: unchanged (`mugs_tray1` has no preset);
- `seat`: today's objects carry no `seat`, so every non-work object resolves to `'near'` as now;
  the `fridge`/`microwave` presets say `stand`, so those two get `seat: "near"` overrides in the
  fixture. (Whether new scenarios should stand at the fridge is a preset choice, not a parity one.)
The test asserts the decision log is byte-identical for the same seed, and that the fixture has
fewer affordance fields than the original (a guard against the overrides creeping back to a copy).
`test_needs_sims` itself switches to presets in this slice with exactly those overrides, so the
showcase demonstrates the feature. Live: one run; the README live-proof table is unchanged.

**Risks.** `pc` (102 uses) and `workstation` (27) are also puzzle terminals; the exclusions catch
those with a `lockType`, and the validator list catches the rest. The switch is per scenario, and
`affordance: false` opts an object out.

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
// on the accepting object: what happens to a delivered item (default "consume", today's behaviour)
{ "id": "amara_pc", "type": "pc", "affordance": { "accepts": ["post", "printout"], "onDeliver": "place" } }

// a reveal slot: a declared object, hidden until its global is true
{ "id": "copier_tray_1", "type": "notes", "name": "Printout", "takeable": true, "readable": true,
  "text": "...", "outputOf": "office_copier", "revealOnGlobal": "copier_tray_1_out",
  "needsTag": "printout", "position": { "x": 9, "y": 2 } }

// something that prints: an onUse hook (onUse already supports setGlobal/emitEvent, 597-600)
"onUse": { "sanjay_pc": { "revealOutput": "office_copier" } }
```

**Outcomes.** `onDeliver` (on the target's affordance; a routine's carry step may override it
with `then`):
- `consume`: today's path, unchanged, so the parcel and mug beats keep byte-identical logs.
- `place`: the item is set down on the target, at its centre plus `affordance.placeAt {dx, dy}`
  (tiles; default halfway from the centre towards the approach cell), visible and interactable.
  Client only: the server cannot save an NPC-moved object's position (1.2.2), so after a reload
  the item is back at its declared spot. The sprite keeps its **declared** room id
  (`sp._declaredRoomId`) so a player who picks it up at the desk removes it from the right room
  server-side (`remove_item_from_room!` checks `item_in_room?` against the room it names).
  A placed item is not a carry candidate (`describe` reports it not `pickable` to needs while
  `sp._npcPlacedBy` is set), or the deliverer's own interest would pick it straight back up.
  After `affordance.placeSeconds` (default 60, on the needs clock) the engine stows it: someone
  filed it. `placeSeconds: 0` leaves it until a reload.
- `stow`: the item goes back to its declared position, hidden and non-interactive, and its
  reveal global is set to `false`. No server call. A stowed slot is free again.

**Reveal slots.** A declared object with `outputOf: "<producer id>"` and a `revealOnGlobal` whose
global the engine owns (validator: both present, the global unique to the slot and not used in
any other condition). The existing `revealOnGlobal` gives the show and the reload: globals sync
(`state-sync.js` 164), are restored before a room reveals, and the server stores any key. The
engine adds:
- `revealOutput(producerId, npcId)` in the world adapter: take the first free slot of that
  producer (sorted by id; free = loaded, global not `true`, sprite not destroyed, not in the
  player's inventory), set its global `true` (the existing listener shows it), set a string
  global `<slotId>_by` to the NPC id, emit `object_revealed:<slotId>` `{producerId, npcId}`.
  Returns the slot id or null.
- A **hide path**: in `core/rooms.js`, the `hideUntilReveal` listener (2961-2963) also handles
  `value === false` for objects that have `outputOf` or `revealCycles: true`, hiding the sprite
  and disabling input again. Other `revealOnGlobal` objects keep today's one-way behaviour. About
  15 lines.
- **No free slot**: the producer shows a cosmetic sprite (the first slot's texture, or `notes1`)
  for its `placeSeconds`, client only and never takeable, built with the item-drop sprite code
  (`item-drop.js`). A routine that wanted the output carries nothing and still completes.

**Single beats and repeats.** A slot the player takes is gone server-side for good (the room
payload filters it out of every later load), so **each takeable slot is one beat**. Repeats come
from a pool (several slots with the same `outputOf`, used in id order: "the first three printouts
can be taken") or from non-takeable readable slots, which cycle for ever (place, then stow, then
reveal again). The validator prints, per producer, how many takeable beats the pool holds.

**The player takes an item an NPC was fetching.** Both `item_gone` paths (550, 557) go through
`_abortJob`, which logs and emits nothing. Add an `npc_job_failed` emit with `reason: "item_gone"`
and the item id to both (a few lines), so a scenario can map the owner noticing.

**Reload.** Needs state resets; globals do not. A slot that was revealed comes back visible at its
declared spot (on the tray, even if it had been placed on a desk). The NPC named in `<slotId>_by`
gets a one-off carry candidate for it at interest weight 2 that ends in `stow` (they tidy their
own printout away), so an orphan does not sit there for ever; until they get to it, it is a
window. A slot already taken stays gone. An NPC-moved item that was dropped by an abort
(`dropHeld`, client only) is back at its declared spot after a reload; accepted, and the same as
`item-drop.js` before `persistDrop` (whose server path only accepts player drops of held items).

**Engine size.** Outcomes about 70, slots and pool about 90, hide path 15, orphan candidate 30,
`item_gone` emit 5, validator about 40, schema about 25 (`onDeliver`, `placeAt`, `placeSeconds`,
`outputOf`, `revealCycles`, `onUse.revealOutput`). About 275 lines.

**Visible change.** A delivered item stays where it was put (the parcel on Amara's desk), then is
filed away; a printout appears on the copier tray when someone at a desk prints.

**Tests.** Node (stub world): `consume` log byte-identical to today; `place` leaves the item at
the target and not pickable to needs; `placeSeconds` stows it; `stow` frees the slot; pool order
and exhaustion fall back to the cosmetic sprite; the player taking an item mid-fetch emits
`npc_job_failed` `item_gone`; reload simulation (fresh system, slot global `true`, `_by` set)
gives the owner the stow candidate. A rooms test (extend the existing `revealOnGlobal` coverage)
for the hide path. `test_needs_sims`: an `office_copier` (`photocopier1`) in the **office**, the
start room, so it is always loaded; two non-takeable printout slots and one takeable; Sanjay's
`sanjay_pc` `onUse` reveals output; Amara's interests gain `printout` and `amara_pc` gets
`onDeliver: "place"`; a new objective "A printout is delivered to a desk" on
`npc_used:amara_pc` with `tag: printout`. Live: screenshots of the printout on the tray, in
Amara's hand (with slice 3) and on her desk; take the takeable one and check the reload keeps it
gone and the next print uses a non-takeable slot.

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
the destination, so it does not have to accept the tag. Its `then` defaults to `place`. It does
**not** need the target's claim either, since placing an item on a desk does not use the desk:
when the owner is seated there (holding the claim and standing on the approach cell), the
deliverer stands on the nearest free walkable cell beside the approach cell (`deliverFrom`
default: the two side cells, then one further out), faces the desk and places. No waiting.

**Seating.** A visitor must not take the owner's chair. Today `seatPreference` says `'fetch'` for
anything that satisfies `work` (`seating.js:768`), and the "chairs at another NPC's post" guard
lifts when the stop is that post (865-866), so Sanjay delivering to `tom_pc` would sit in Tom's
chair or roll one over. Two changes: a routine step carries `seat: "stand"` unless its target is
the NPC's own home, passed through the job into `needsStop` (739-748) so seating can read it; and,
for every job, a use of **another NPC's `needsHome` object** stands (a plain work use at a
colleague's free desk today sits in their chair too). About 15 lines in `seating.js`.

**Choosing routine or plain use.** Need scores are per need, not per object (`npc-needs.js:453`),
so a fixed "higher weight wins" rule makes an NPC always or never run a routine. Instead, when the
winning need has both a plain-use candidate and routine candidates, a seeded roll per leave,
`roll(npcId, 'routine:' + leaveCount)`, picks between them in proportion to their weights (plain
use weight 1 unless the NPC sets `plainWeight`). Varied, deterministic, and a scenario that wants
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
steps above four (warning), T1/P report per routine. Schema about 40 lines (`routines`,
`routineArgs`, `plainWeight`, step shapes). About 450 lines in all.

**Save/lazy-loading.** A reload mid-routine restarts the NPC at its post (constraint 3); a
revealed output slot is handled by Part A's orphan rule. A step target in an unloaded room makes
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
simulation (fresh system, slot visible) leaves it to Part A's orphan rule.
`seating.test.mjs`: a visitor at another NPC's desk stands; the owner at their own desk still
sits. `test_needs_sims`: Sanjay gets `print_and_deliver` with `colleague: tom`; Amara gets
`fetch_post` from a post tray in the office (`officeType: "post_tray"`; sprite: an existing box,
`office-misc-box1`, until a tray sprite is approved **[approval]**); a new objective "Someone
prints and delivers a document" on `npc_routine_done:sanjay`. Live: watch the chain in the log;
screenshots of the printout on the tray, in Sanjay's hand and on Tom's desk with Tom seated.

**Risks.** Chains make NPCs absent for longer and cross rooms more; jams at doors and the
"stuck walking into a wall" class of bugs show up more often. The whole-routine failure on a
step timeout and the four-step warning keep that bounded.

### 2.3 Visible object state (proposal 3)

**What exists.** `workstation-state.js` already decides locked or open on every leave, publishes
two globals, and an author can already hang a lighting emitter variant or a `spriteVariants`
entry on them. What is missing: a default look, any "in use" or "busy" state for other machines,
and correct globals after a reload.

**Prerequisite.** The own-desk fix in 2.11 (slice 2). Without it, a work use at the NPC's own PC
fires `npc_left_post`, workstation-state marks the owner away (`workstation-state.js:112-123`) and
the "away" indicator would show while the owner sits at the PC.

**Why indicators, not glow changes.** In a lit room a screen's glow sits under the multiply light
map, just in front of its object (`lighting.js:1033-1041`), and plain screens within 32 px share
a damped glow (`clusterEmitters`, 584-600). A dimmer, cooler "locked" glow or a slow `breathe` on
an open screen would be close to invisible at game zoom in the lab's lit office
(`lab_physical_pentest/scenario.json.erb:13`). Only `ransom` and `above: true` variants draw above
the map, and `above` keeps its own small radius. So every state is a **small `above: true`
indicator** offset to the screen's corner; the main screen glow does not change.

**Authoring.** Nothing for the defaults. With `officePresets` on, preset workstations and
machines get built-in emitter variants (the same mechanism as the ransomware screen variant,
`RANSOM_VARIANT`, `lighting.js:87`):

| State | Indicator (`above: true`, radius about 8 px, offset to the screen's top corner) |
|---|---|
| owner at desk | none (the ordinary screen glow) |
| owner away, open | warm-white dot with a slow `breathe`: an unattended, unlocked screen |
| owner away, locked | steady blue dot (lock screen) |
| machine in use (coffee, copier) | small amber `blink` above the machine |
| output waiting (copier tray) | the slot sprite itself is visible (Part A); no light |

Colours are first picks to be checked on screenshots, lit and dark; colour is never the only cue
(open breathes, locked is steady; `breathe` honours reduced motion, where the two differ by
colour and size). Authors can still override any of these with a room `emitters` entry on the
object id. If dots still do not read, the fallback is a lock-screen sprite variant for the two PC
types the lab and showcase use (`pc`, `laptop`): new art, **[approval]**, deferred.

**Engine.** A small client-only **activity registry** (`window.officeActivity`, new module
`office-activity.js`, about 80 lines): `{ objectId: { inUse: npcId|null, busyUntil, output: bool } }`,
written by the needs system on `using` and complete, read by lighting through a new condition
form `activity.<objectId>.<key>` in emitter variants (`evaluateGlobalCondition` gets one more
prefix; about 30 lines in `utils/conditional-text.js` and `lighting.js`). Not globals, on purpose:
transient machine state should not be saved or synced. Workstation lock state stays on its globals
because scenarios already key text variants on them.

The indicator variants are about 40 lines of data in `lighting.js` (or the preset JSON) plus 20
lines to attach them to preset objects. Schema: the `activity.` condition form documented on
emitter variants (about 5 lines). About 150 lines in all.

The reload mismatch fix for workstation globals (at `installWorkstationState`, 157) ships earlier,
in slice 2 (2.11).

**Save/lazy-loading.** Activity is not saved; after a reload nothing is in use, which is true.
Workstations in a room that loads after the owner left already take state on first interaction
(`onInteract` 144-145); the indicators read the same globals so they are correct on load.

**Performance.** Lighting re-resolves variants at most every `RESOLVE_MS`; the registry is a map
read.

**Visible change.** From across a lit office the player can tell an unattended open screen from a
locked one, and see which machine is busy.

**Tests.** Node: registry transitions from a stub needs run; condition parser accepts
`activity.x.inUse`; an own-desk work use does not mark the owner away (needs slice 2's fix).
`lighting-room-variants.test.mjs`: each indicator variant resolves for its state and has
`above: true`. `test_needs_sims` gains a `"lighting": { "enabled": true, "defaultMode": "on" }`
block in this slice (it has none today, so no glow shows at all) and `lockChance: 0.5` on
`tom_pc`; a new objective "Spot an unlocked, unattended screen" on `workstation_owner_left` with
`screenLocked: false`. Live: screenshots of Amara's PC at desk, away-open and away-locked, and the
coffee station in use, each with the office lit and dark; plus the lab's open-plan office lit,
with Melanie away, from the doorway.

**Risks.** Dots may still be too small at game zoom; the screenshots decide, and the fallback
(sprite variant, art) is listed above. A busy room of PCs gets many dots; only workstations with
an owner get the away indicators.

### 2.4 Speech bubbles and social pairing (proposal 4, first half)

**What exists.** Nothing in the world: barks are phone-style DOM notifications (`npc-barks.js`
15-65). Water cooler and sofa already have `capacity: 2`.

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
each other (`faceTo`) and take turns, lines picked by seeded roll. A `visit` step (2.2 Part B)
pairs the visitor with the NPC at that home the same way; that half lands with slice 9. A lone NPC at
a `chatter` object says nothing.

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
the number of lines fits the overlap; `overheard` true at 150 px and false at 170 px or through a
wall; `hush` stops after the current line. `test_needs_sims`: pools for the cooler and office
coffee; reading the activity board sends Sanjay and Rosa for a chat (a mapping with
`needs: { set: { social: 10 } }` on both; today only Sanjay has a social need near the cooler and
Grace a thirst need, so leaving it to chance could take a long run); objective "Two people chat at
the water cooler" on `npc_chatted:water_cooler`. Live: screenshot two NPCs facing with a bubble;
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
(deterministic by tick and NPC id). Validator about 20 lines: a queue cell within one tile of a
door (it would sit in the doorway), a cell that does not snap to a walkable tile. Schema about 10
lines (`affordance.queue`). About 150 lines.

**Why it matters for gameplay.** A queue lengthens an absence in a way the player can read from
across the room, and makes "owner away" windows longer at busy times without any scripting.

**Visible change.** Two or three people standing in line at the coffee machine, facing it.

**Tests.** Node: three NPCs, capacity 1, two cells: order, advancement, a queued NPC whose need
is met elsewhere leaves the queue, `maxWaitSeconds` sends one home. `test_needs_sims`: a mapping
on the activity board that drops three staff's caffeine together; objective "A queue forms at the
coffee machine" on a new `npc_queued:<objectId>` event. Live: screenshot three staff at one coffee
station.

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
indicators. Validator about 20 lines (prints expanded values in the needs report). Schema about
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

**Behaviour.** Each use takes `perUse`; at zero the object is not an option for needs and shows an
"empty" activity state. An NPC with an interest in the restock tag (or the first NPC who wanted
the object, with the facilities trait) runs a built-in two-step routine: use the store object,
carry stock back, use the empty object (refilled to `max`).

**Engine.** About 150 lines on top of 2.2 (stock in the activity registry, restock as a generated
routine), plus schema about 10 lines (`affordance.stock`).

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
room-limited sound (2.12): played only when the phone is in the player's current room, at a volume
scaled by distance, so an off-screen ring does not give away a beat in another room.

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
| Document waiting on a copier tray | reveal slots (2.2 Part A) | none beyond Part A. Each takeable slot is one beat (constraint 1.2.2); a pool gives a few; non-takeable readable slots repeat for ever. Taking a slot an NPC is fetching emits `npc_job_failed` with `reason: "item_gone"` (the emit is added in Part A; today `_abortJob` emits nothing), which a scenario can map to the owner noticing |
| Item left on a desk | traits (`tidiness`), Part A's slots and `stow` | a declared item with `leftBehindBy: "<npcId>"` and its own `revealOnGlobal`. On a real leave (2.11's rules), a seeded roll `roll(npcId, 'left:' + leaveCount) < 1 - tidiness` reveals it; on return the owner **stows** it (global false, hidden at its declared spot, no server call), so it can be left again on a later leave. If the player takes it, it is gone for good: a single beat, like a slot. A reload with it revealed shows it until the owner's next return stows it. About 50 lines |
| Pile waiting to be shredded | an object with `pileCount`, a `shred` routine that reduces it | about 50 lines. `spriteVariants` watch globals only (`core/rooms.js:688-722`), so the count is published as a global (`<id>_pile`, OQ3's opt-in `publishGlobal`) and sprite variants key on it; this one count is saved, which is fine (it self-heals by the routine). Sprites per pile level: try existing paper sprites (`notes_ledger1`, `supply_boxes1`) first, else **[approval]** |
| Door held for someone carrying something | the lab's tailgate wiring (route + `challengeOnSight`, `data.playerNearby`) | generalise later; no engine work now |

Rules for scenario design (not engine): every window must be readable from the floor (an action
icon, an indicator, a queue, an item in hand), must close again, and must reopen after a reload
because need state resets. A window built on a **takeable** item is the exception: it is a single
beat by design, and the scenario says so.

**Engine size.** Left-behind items about 50, piles about 50, queue-aware `expectedAwayMs` about
15, validator about 30 (`leftBehindBy` NPC exists and has a `needsHome`; the item has its own
`revealOnGlobal`; pile variants cover every level), schema about 15 (`leftBehindBy`, `pileCount`,
`publishGlobal`). About 160 lines.

**Visible change.** A badge or a phone sometimes sits on an empty desk; a paper pile shrinks after
someone visits the shredder.

**Tests.** Node: left-behind roll is seeded and respects `tidiness`; the owner's return stows the
item and a later leave can reveal it again; a taken item never comes back; reload with the item
revealed is stowed on the next return; pile count drives the global and decreases per `shred` use.
`test_needs_sims`: Tom (`tidiness: 0.3`) has a declared ID badge (`id_badge` sprite, exists) on
his desk with `leftBehindBy: "tom"`; a shred pile beside the kitchen door; objectives "Spot something left on an
empty desk" and "Watch the pile go down". Live: screenshots of the badge on the empty desk and
gone after Tom's return; take it once and check it never reappears after a reload.

### 2.11 Noticing the player at the desk (proposal 10)

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
(`locksScreenOnLeave: false`; work need decays 15/min from 60 with `urgentAt: 50`, so her first
own-desk use comes about 40 s in and recurs every few minutes) reports `staff_pc_2_owner_away`
during her own 8 s work dwells. A player who opens the PC then gets `workstation_accessed`, the
`opt_unlocked` task and the "she stepped away without locking the screen" capture while she is
sitting at it, and the `owner_away` observation variant (line 867) shows. Chris Hampshire's
`staff_pc` reads "locked" while he works at it. The keylogger beat (`npc_used:staff_pc`) is not
affected. Another agent is checking the lab live; this plan's slice 2 is the engine fix.

**Correct semantics.**
- A job is **at post** when it is a `use` whose target is the NPC's `needsHome` object and whose
  approach cell is within `HOME_EPS` of the NPC's home (true by construction for an object home;
  a coordinate home has no object, so never). Carry jobs are never at post (the NPC fetches the
  item first).
- An at-post job has no wind-up and emits no `npc_left_post`; `s.atPost` stays true. When it
  completes or aborts, the NPC goes straight to idle at its post: no `returning` and no
  `npc_returned_post`. `npc_used:<objectId>` still fires, so beats keyed on it hold.
- `npc_returned_post` fires only if `npc_left_post` fired for this absence (a `s.leftEmitted`
  flag), so the two events always pair and workstation-state's away map stays true to life.
- Unchanged: a script move (`onExternalMove`) still clears `atPost` without emitting
  `npc_left_post`, as today; whether a scripted walk-off should count as a leave is open
  question 12.
- Seating already keeps an NPC seated through an own-desk use (`needsStop` keys on the object,
  739-745). The action icon still shows the work icon while the NPC uses its desk, without the
  wind-up pulse.

Effects to re-check: the lab's Melanie window then opens only on real absences (her coffee trips:
caffeine 25/min from 100, `urgentAt: 50`, so the first about two minutes in); the lab's three
beats still complete. `test_needs_sims`'s `see_back_at_desk` objective (on `npc_returned_post` for
Amara and Tom) then ticks only after a real trip, which both make within the first minutes.
Re-run the README live-proof table: tick numbers do not move, but some `left_post`/`returned_post`
lines disappear. About 30 lines.

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

**Schema.** None (events only). **Size.** About 85 lines.

**Save.** None beyond the reload fix.

**Visible change.** Staff no longer show a "leaving" pulse when they only turn to their own PC; a
returning owner reacts when the player is at their desk.

**Tests.** Node: an own-desk work use emits no `npc_left_post`/`npc_returned_post` and no wind-up,
and keeps `atPost`; a coffee trip still emits both, paired; an aborted own-desk use emits neither;
`workstation-state.test.mjs`: no away state during an own-desk use, and globals reset at install;
stub proximity on return → `npc_caught_at_post` once; not on a return with the player elsewhere;
not after an own-desk use. `test_needs_sims`: a mapping on `npc_caught_at_post:tom` with a bark;
objective "Get caught at someone's desk". Live: stand at Tom's desk when he returns (log shows the
event and the bark); in the lab, open `staff_pc_2` while Melanie works at it and check it reads
"attended"; reload with Chris away and check the text is "attended".

**Risk.** A player who opened a PC minigame cannot react while it is open; NPCs keep moving during
minigames (only the VM freezes them). Decide whether a catch closes the minigame (open question 6).

### 2.12 What the player sees (added after review R1; slice 3)

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

Object textures are loaded per room, so the module loads any icon texture it needs on first use
(Phaser loader, one-off) and shows the text glyph until it arrives.

**Carried items in hand.** While carrying, the item's own sprite stays visible (instead of
`setVisible(false)` at 872) and follows the NPC at a hand offset per facing: in front at hip
height for south, east and west (depth just above the NPC), behind the body for north (just
below). Native size: today's carried items are small (`dirty_mugs1` 15×14, `notes1` 16×16,
`id_badge` 10×16, the parcel). The validator warns when a `needsTag` item's texture is over 24 px
on a side (it would look like carrying furniture). `consumeHeld`, `place`, `stow` and `dropHeld`
end the follow. No new art.

**Use poses without new animation.** The atlases have no typing, pouring or carrying frames
(1.1). From what exists: the NPC faces the object (exists) and sits at desks where its atlas has
`sit_*` frames (exists). Add a 1 px display-only bob every 0.6 s while using a `work` object
(typing), and one short dip at the start and end of a coffee, cooler, fridge or microwave use
(pouring, drinking). The bob moves the display offset, never the physics body (seating already
offsets seated sprites, so it builds on that), and is off under reduced motion. Proper use
animations (typing, pouring) through PixelLab custom animations are new art per character per
direction **[approval]**, deferred.

**Idle glance.** At its post, every 20-40 s (seeded on the needs clock) an NPC turns to face a
neighbour's desk or the room's centre for 2-3 s, then back to its desk (`faceWorldPoint`).
Standing NPCs only (a seated NPC's facing follows the chair), and never while `facePlayer` is
turning it to the player or it is in a conversation.

**Sounds, heard only in the player's room.** Per-preset `useSound`, from existing files:
`drink_gulp` at the end of a coffee or cooler use, `eat_snack` at the fridge or microwave,
`drawer_open` at a filing cabinet, `page_turn` when a slot is revealed or placed, and a soft
`GASP_UI_Clicks_*` now and then during desk work (whether it reads as typing is for the user to
judge). The sound manager has no positional play (`sound-manager.js:195`), so a small
`playAt(name, x, y)` helper plays a sound only when the source is in the player's current room
and within eight tiles, at a volume scaled down linearly with distance (at most 0.4 of the
effects volume), and at most one NPC use sound per second overall. New sounds for a kettle, coffee
machine, copier and desk-phone ring **[approval]**. Optional office ambience: a room-level
`ambience` key on `playAmbient` (293), off by default; it needs an office room-tone loop
**[approval]** (`server_room_ventilation` is the only ambience file).

**Where any of this shows.** Icons, held items, bubbles (2.4) and sounds only for NPCs in the
player's current room, and icons and bubbles hidden in a room whose lighting is dark. Today icons
show for every NPC with a job in any loaded room, lit or dark (`npc-action-icons.js:64`).

**Engine.** New `systems/npc-office-visuals.js` (about 200 lines: held-item follow, bob and dip,
glance, `playAt`); `npc-action-icons.js` sprite icons and the room/dark rule (about 60). Schema
about 15 lines (`actionIcons` object values, `affordance.useSound`, room `ambience`). About 275
lines. Not behind `officePresets`: icon defaults and sounds apply only where a scenario has
needs NPCs, and a scenario can turn the layer off with `"officeVisuals": false`.

**Save.** None.

**Visible change.** The point of the slice: sprite icons, the parcel in Amara's hands on the way to
her desk, a seated typist's bob, a glance across the office, a gulp at the cooler when you are in
the kitchen and silence when you are not.

**Tests.** Node (pure helpers): icon resolution (sprite, `icon:`, text fallback); hand offset and
depth per facing; `playAt` volume by distance and the same-room rule; one-per-second limit; the
glance schedule is deterministic for a seed; the room/dark visibility rule. `test_needs_sims`:
switch `actionIcons` to the sprite defaults; objective "Watch someone carry the parcel to a desk"
on `npc_used:amara_pc` with `tag: post`. Live: screenshots of each icon over a head; the parcel in
hand walking north and south; three frames of a seated bob; the sound manager's play log with
volumes from inside and outside the kitchen; the lab's open plan to check icons and bob there.

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
| 1 | Tick-cost hygiene (2.0) | S, ~90 | none | every needs scenario; unblocks larger casts |
| 2 | Own-desk use is not a leave; caught at the desk; `expectedAwayMs`; workstation reload fix (2.11) | S, ~85 | none | lab: fixes Melanie's open-screen window opening while she sits at her PC (a current bug); Chris returns to find the player at `staff_pc` during the keylogger beat; stale "away" text after a reload goes |
| 3 | What the player sees: sprite icons, item in hand, bob and glance, room-limited use sounds (2.12) | L, ~275 | none (1 helps) | every needs scenario: deliveries, coffee runs and desk work become legible. New icons for hunger and rest, use animations, office sounds and ambience wait for **[approval]** |
| 4 | Affordance presets (2.1) | M, ~205 | 1 | `test_needs_sims` drops to a short list of per-object overrides; new scenarios get an office from `type` alone |
| 5 | Visible state: activity registry and `above` indicators (2.3) | M, ~150 | 2; 4 for defaults (works with explicit config without it) | lab: Melanie's open screen and Chris's locked one read from across the lit open plan |
| 6 | Traits (2.6) | M, ~125 | 2 (workstation link); 5 to see it | lab: lock habits become traits; awareness scenarios get careful and careless staff from one field |
| 7 | Carry outcomes and reveal slots (2.2 Part A) | L, ~275 | 1; 3 to see items in hand | sims: a printout appears on the copier tray and is put on a desk; the parcel stays on Amara's desk. Lab: a findable document on a tray if the lab wants one, as a single beat |
| 8 | Speech bubbles and pairing at shared objects (2.4) | L, ~270 | 1, 3 (room/dark rule) | sims: cooler and coffee chat. Lab: chatter at `coffee_station` the player can overhear (`overheard`), a place for a social-intel grant in the awareness build |
| 9 | Routines, with `visit` pairing (2.2 Part B) | L, ~470 | 4, 7; 8 for `visit` bubbles | sims: print and deliver, fetch the post. Lab: staff gain reasons to leave the desk other than coffee; the keylogger beat holds because a `$home` step still emits `npc_used:staff_pc` |
| 10 | Queues (2.5) | M, ~150 | 1, 4 | lab: a queue at the coffee station stretches Chris's absence in a way the player can see |
| 11 | Window helpers: left-behind items, piles, queue-aware `expectedAwayMs` (2.10) | M, ~160 | 6, 7; 10 for the queue part | lab and awareness: more than one kind of window per office without scripting |
| 12 | Schedule, preemption, leave/arrive, desk phone (2.8, 2.9) | L, ~490 | 9 | longer scenarios with a stand-up or a fire drill; lab: optional later move of Len's badge round onto a schedule |
| 13 | Consumables and refills (2.7) | M, ~160 | 9 | deferred until a scenario asks |

Slices 1-6 come to about 930 lines. They are not behaviour-neutral, and each says how: slice 1
can move a blocked NPC's start by up to four ticks; slice 2 removes a false leave that the lab
currently shows; slice 3 changes how every needs scenario looks and sounds (a scenario's explicit
`actionIcons` still win, so the lab's emoji glyphs stay until it opts in); slices 4 and 5 are
behind `officePresets` for their defaults. Slice 7 is the first that changes where items end up,
and only for objects that set `onDeliver` or producers with slots; slice 9 is the first that
changes what NPCs choose, and only for NPCs that list routines.

`test_needs_sims` grows by no rooms (the copier and post tray go in the office, the start room, so
they are always loaded and no objective waits on a door) and at most one NPC (a facilities person
for queues and refills). Keep the five current staff and their timings, so the README's live-proof
table stays valid apart from the changes slices 1 and 2 name; add rows per slice.

**Lab notes.** Slice 2 fixes a lab bug (2.11): Melanie's unattended-screen capture can today be
taken while she is at her desk; another agent is checking it live, and the fix lands here. Len
stays on his multi-room route with `challengeOnSight` (`lab_physical_pentest/scenario.json.erb`,
his `behavior.patrol.route` with the `{unlockRoom, useObject: "badge_reader"}` action).
`NPC_NEEDS_SYSTEM.md` §12.3 still describes the older `rounds` need; slice 2 corrects it. Sofia
Lord (the dropped-device beat) needs nothing new; she benefits from 8 (overheard chatter) and 11
only.

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

### 4.2 Defer

- Consumables (slice 13) until a scenario wants the beat.
- Use animations (typing, pouring) and idle fidgets beyond a glance: new PixelLab animations per
  character **[approval]**; the bob and dip in 2.12 stand in.
- New icons (hunger, rest), a desk-phone sprite, a post-tray sprite, pile sprites, and new sounds
  (kettle, coffee machine, copier, desk-phone ring, office ambience) **[approval]**; each slice
  works with the existing stand-ins named in its section.
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
3. **Transient machine state.** Client-only registry or globals? **Client-only, with an opt-in
   `publishGlobal` per object for scenarios that need it in text variants.**
4. **Routine library.** Engine-shipped defaults (print, post, tea round, file, shred, stand-up,
   leave) or scenario-only? **Ship the defaults; a scenario overrides by id.**
5. **Preloading office rooms.** Load listed unlocked rooms at start so their NPCs and objects are
   live (the route-patrol preload at `npc-behavior.js:658-672` is the precedent)? **Opt-in per
   scenario (`officeLife.preloadRooms`), unlocked rooms only, off by default.**
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
11. **What happens to a carried item at the target?** **`consume` by default (today's beats keep
    their logs); `place` or `stow` per accepting object (`onDeliver`) or per routine step
    (`then`); routine deliveries to a person default to `place`.**
12. **Does a scripted walk-off count as leaving the post?** Today `onExternalMove` clears `atPost`
    without `npc_left_post`, so workstation-state never sees a scripted absence. **Leave as is
    for now; revisit if a scenario scripts an owner away from a workstation and expects the
    screen window.**
13. **Chatter near the player.** **It continues (the player can overhear, within
    `overhearRadius`); a pool marked `hush` stops instead.**
14. **Takeable output slots: one beat or repeatable?** **One beat per takeable slot (the server
    removes a taken item for good); a pool gives a few; non-takeable slots repeat for ever.**
15. **How does an NPC that has left come back?** **Through an `arrive` block; presence is
    re-derived from elapsed time on every load, so a reload agrees with the schedule. With no
    `arrive`, gone for the session, and the validator warns about anything that would then never
    fire.**
16. **Art and audio for the visible layer.** Which of these does the user want made: icons for
    hunger and rest; a desk-phone sprite; a post-tray sprite; pile sprites; kettle, coffee
    machine, copier and desk-phone ring sounds; an office room-tone loop; PixelLab typing and
    pouring animations? **None before the slice that needs it; each slice ships with the
    existing stand-ins, and its screenshots show whether the stand-in is good enough.**
17. **`GASP_UI_Clicks_*` as typing.** Acceptable as a stand-in for desk work, or silence until a
    typing sound is approved? **Try it in slice 3 and let the user judge from a recording.**

---

## 5. Changes after review R1

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

