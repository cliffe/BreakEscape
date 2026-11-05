# Office Life: plan for reusable NPC office behaviour

Status: **plan, 2026-11-05. Nothing here is built.** Engine changes need the user's approval
(AGENTS.md). Builds on the needs system (`NPC_NEEDS_SYSTEM.md`), seating (`SEATING.md`) and the
showcase `scenarios/test_needs_sims`, which becomes the test bed for every slice below.

The user's goal (2026-11-05): "The Sims scenario should build some behaviour that we can reuse to
bring NPCs to life, especially behaviour for office spaces and tasks. Interacting with PCs,
printers, coffee machines, etc."

The short version: most of the hard parts already exist. The needs system already picks a
target, walks there, dwells, carries items and walks back; workstations already lock or stay
open when their owner leaves; lighting and sprite variants can already show state off globals.
What is missing is (a) less hand-wiring per object, (b) multi-step tasks, (c) anything NPCs say
to each other in the world, and (d) time structure (a day, interruptions). The plan below adds
those in eleven small slices, each usable on its own.

---

## 1. What exists, and what each proposal reuses or adds

### 1.1 The parts already built (checked 2026-11-05)

| Part | Where | What it gives office life |
|---|---|---|
| Needs core | `systems/npc-needs.js` | Decaying needs, 250 ms deterministic tick (`tick` 284-294), bounded selector (`_select` 445-467), home-object preference (`_useCandidate` 469-480), carry jobs for tagged items (`_carryCandidate` 482-495), capacity claims (`_claims`/`_free` 397-418), wind-up tell (`_startJob` 497-517), seeded `roll()` (136-138), `npc_used` with the NPC's `usePayload` and `playerNearby` (`_completeJob` 576-604, `_playerProximity` 607-610) |
| Live adapter | `npc-needs.js` `createEngineWorld` 706-922 | Object scan (`listObjects` 773-787), approach cells from `useFrom` (792-804), synchronous reachability via EasyStar (805-832), pick up / consume / drop held items (867-908; consume also removes the room object server-side, 891) |
| Script composition | `npc-needs.js` `onExternalMove` 240-250, `control` 253-280; `npc-behavior.js:2456`; `npc-manager.js:855, 1164-1166` | Any non-needs `goToAndStay` suspends needs; eventMapping `needs: "suspend" \| "resume" \| {set}` |
| Movement | `npc-behavior.js` `goToAndStay` 2448, `cancelMove` 2499, `faceWorldPoint` 2518, `_triggerGoToStayArrival` 2524; chat freeze guard 710 | The only way needs moves NPCs; collision, stall recovery and depth sorting come free |
| Route patrols | `npc-behavior.js` route waypoints with `dwellTime` (1072-1110), route actions `{unlockRoom, useObject}` (1609-1647), route-room preload (658-672) | Fixed beats such as Len's badge round in `lab_physical_pentest`; precedent for preloading rooms |
| Workstations | `systems/workstation-state.js` (whole module); `interactions.js:792` | Owner leaves → screen locks or stays open (`locksScreenOnLeave`, seeded `lockChance`); globals `<id>_screen_locked`, `<id>_owner_away`; events `workstation_owner_left/returned`, `workstation_accessed`, `workstation_locked_attempt` |
| Action icons | `systems/npc-action-icons.js` | Glyph over an NPC's head while it has a job (`pickIcon` 22-32), pulsing during the wind-up |
| Debug overlay | `systems/npc-needs-debug.js` | Need bars and job label per NPC; `window.__test.needs.overlay()` |
| Seating | `systems/seating.js` (`updateSeatedNPC` 686, chair fetch 899, `tuckIn` 883) | Needs NPCs sit at desks, fetch a swivel chair, tuck it in when they leave |
| Lighting | `systems/lighting.js` header 1-45; screen emitter table 179-192 | Per-object glow with condition variants (`emitters` keyed by object id, first matching `globalVars` condition wins); motion-sensor rooms; `screen`/`blink`/`pulse` effects |
| Sprite variants | `core/rooms.js` `registerSpriteVariantListeners` 688-722 | Object texture swaps when a `globalVars` condition changes |
| Sight challenge | `systems/npc-sight-challenge.js` 1-48 | `challengeOnSight` with `near: {object, radius}`, `requireGlobal`, `skipIfGlobal`, cooldown |
| Game clock | `systems/game-clock.js` (`parseGameClockRate` 54, `gameSecondsAt` 98, `timeParts` 158) | Elapsed time that survives reload; optional in-game time of day with a story `rate` and anchors |
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
   Engine-spawned props are cosmetic.
3. **Needs state does not persist.** On reload levels reset to `initial` and NPCs start at their
   posts (`NPC_NEEDS_SYSTEM.md` §10). Globals do persist. Anything we add must self-heal from
   "everyone at their desk, globals as saved".
4. **Determinism.** No `Math.random()`; seeded rolls only (`roll(npcId, salt)`), sorted iteration.
   Node tests depend on it.
5. **Cyber-neutral engine.** The engine moves people and items and emits events. What a printout
   says or what an open screen yields is scenario data.
6. **No runtime LLMs** (standing rule). Chatter is authored lines.

### 1.3 Proposal-by-proposal: reuse versus new

| # | Proposal | Reuses | Adds | Verdict |
|---|---|---|---|---|
| 1 | Affordance presets by object type | `affordance` fields, `useFrom`, `approachCell`, validator | A preset table (new module `office-presets.js`), merge in `describe()` and the validator | **Keep, first.** Pure data; removes most hand-wiring |
| 2 | Multi-step routines | use and carry jobs, presence-driven carry, `revealOnGlobal`, capacity | A `steps` list on the job, a scenario routine library, an output-slot mechanism for printers | **Keep, central.** Build as a chain of the existing two job kinds, not a new mover |
| 3 | Visible object state | workstation-state, lighting emitter variants, spriteVariants | An "activity" registry (in use, busy, output waiting), built-in emitter variants for workstations, fix for stale workstation globals on reload | **Keep, early and small.** Half of it is authoring today |
| 4 | NPC↔NPC social, queues | capacity 2 cooler, `faceTo`, seating | In-world speech bubbles (new module), pairing at shared objects, queue cells | **Keep, split.** Bubbles + pairing first, queues later |
| 5 | Daily schedule | GameClock, `control({set})`, route patrols | Schedule entries that change need weights or start routines; preemption | **Defer to Tier 2.** Sessions are 20-40 min, so a "day" is compressed |
| 6 | Personality traits | need fields, `lockChance`, `roll()` | Trait sugar expanded at register time | **Keep, cheap.** No runtime system, only expansion |
| 7 | Consumables and refills | affordance, carry jobs | Per-object stock counter, a restock interest | **Defer.** Useful for longer absences, low priority |
| 8 | Interruptions | `control`, `onExternalMove`, eventMappings | Preempting a running job by priority | **Merge with 5.** Same mechanism |
| 9 | Opportunity windows | workstation-state, `npc_left_post`, `playerNearby`, `revealOnGlobal` | An away-estimate on `npc_left_post`, left-behind items via trait rolls, piles with a count | **Keep as gameplay states.** Mostly scenario wiring once 2, 3 and 6 exist |
| 10 | NPCs noticing the player at their desk | `_playerProximity`, sight challenge `near.object` | Proximity data on `npc_returned_post`, an `npc_caught_at_post` event | **Keep, early.** About 40 lines; big payoff for the lab |

Not in the proposal but needed first: **tick-cost hygiene** (section 2.0). Every idle NPC calls
`listObjects()` each tick, which walks and sorts every loaded room's objects (773-787), and a
waiting NPC (urgent need, target claimed) re-runs a synchronous EasyStar search every tick
(805-832). `npc-action-icons.js` `targetInfo` (36-49) scans every room's objects per NPC per
frame. Fine for five NPCs; not for fifteen with routines.

---

## 2. Features

Each feature lists: authoring format, engine changes (size is new or changed lines, excluding
tests), save and lazy-loading, performance, tests, risks. "Live check" means the keyless server
on :3001, headless, driven through `window.__test` (playtest-scenario skill), with the decision
log as evidence.

### 2.0 Tick-cost hygiene (prerequisite)

**Engine.** In `npc-needs.js`: build the object list once per tick and pass it to every NPC's
`_select` (today each idle NPC calls `listObjects()`); cache `reachable(npcRoom, targetId)` for
the tick; give a waiting NPC (urgent, no free target) a 1 s re-select back-off instead of every
250 ms. In `npc-action-icons.js`: cache `targetInfo` by id and drop the entry when the target's
sprite is destroyed. About 80 lines.

**Save/lazy-loading.** None. A room load invalidates nothing extra: the list is rebuilt next tick.

**Tests.** Node: the decision log for `test_needs_sims`'s stub world is byte-identical before and
after (the back-off changes tick numbers for waiting NPCs only, so pin a fixture with no
contention, and a second fixture that asserts the waiting NPC still starts on the tick the
target frees, ±4 ticks). A micro-benchmark in the node test: 20 NPCs × 200 objects × 1,000
ticks under a set budget. Live: frame time in `test_needs_sims` with 15 NPCs (a temporary
fixture variant) before and after.

**Risk.** Back-off delays a waiting NPC by up to a second. Keep it out of the "target just freed"
path: when a job completes, clear the back-off for NPCs waiting on that object.

### 2.1 Affordance presets by object type (proposal 1)

**Authoring.** An object gets a working affordance from its `type` alone; anything written on the
object overrides the preset field by field.

```jsonc
{ "id": "tom_pc", "type": "pc" }                               // work, 10 s, useFrom {0,1}, seat fetch, workstation
{ "id": "kitchen_coffee", "type": "coffee_station1" }          // caffeine, 45 s, stand
{ "id": "cooler", "type": "water_cooler1",
  "affordance": { "useSeconds": 20 } }                         // override one field
{ "id": "lobby_sofa", "type": "leather_sofa1", "affordance": false }   // opt out
```

Scenario switch: `"officePresets": true` (default false, so no shipped scenario changes). Preset
table (first draft; names are the existing sprite types, matched by prefix like the lighting
table at `lighting.js:179`):

| Type prefix | satisfies | restores | useSeconds | capacity | useFrom | seat | extra |
|---|---|---|---|---|---|---|---|
| `pc`, `laptop`, `workstation` | work | 60 | 10 | 1 | {0,1} | fetch | `workstation: true` |
| `coffee_station`, `kettle` | caffeine | 70 | 45 | 1 | nearest | false | activity `busy` |
| `water_cooler` | thirst, social | 70 | 15 | 2 | nearest | false | social hub |
| `qdc_fridge`, `mini_fridge`, `microwave` | hunger | 60-80 | 10-15 | 1 | {0,1} | false | |
| `leather_sofa` | rest | 80 | 20 | 2 | {0,-1} | stay | |
| `photocopier`, `printer` | (none) | | 8 | 1 | {0,1} | false | routine step target; output slot |
| `filing_cabinet` | (none) | | 12 | 1 | {0,1} | false | routine step target |
| `shredder` | (none) | | 6 | 1 | {0,1} | false | accepts `to_shred` |
| `phone` (desk) | (none) | | 0 | 1 | owner's desk | | rings (2.9) |

A preset with no `satisfies` is a routine target only (2.2); it never draws an NPC on its own.

**Engine.** New `systems/office-presets.js` (data plus `presetFor(type)`, about 90 lines, no
imports). `createEngineWorld().describe()` (`npc-needs.js:716-727`) merges the preset under the
authored affordance when the scenario flag is on; `workstation-state.js` `isWorkstation` (45-48)
also accepts a preset's `workstation: true`. Dynamic import in `core/game.js` beside the needs
install, so no test-harness copy list changes. About 120 lines in all.

**Validator.** `validate_npc_needs.rb` expands presets the same way (a Ruby copy of the table,
pinned to the JS one by a node test that reads both), so the "need with no object" error and the
T1/P report see preset affordances. About 40 lines.

**Save/lazy-loading.** None new: presets are resolved when the object is described.

**Performance.** One prefix match per object, cached on the sprite.

**Tests.** Node: `presetFor` table, override merge, opt-out with `false`; the JS/Ruby table
parity test. `test_needs_sims`: a copy of the scenario with `officePresets: true` and the
affordances deleted must give the same decision log for the same seed (the strongest check that
presets reproduce the hand-wired file). Live: one run of that copy.

**Risks.** Type names are inconsistent across missions (`pc`, `pc2`, `laptop1`, `ehr-terminal`).
Prefix matching may catch props that should not be used (a broken PC in a store room). Mitigation:
the switch is per scenario, and `affordance: false` opts an object out. The validator lists every
object that gained a preset so an author sees them.

### 2.2 Routines: multi-step tasks (proposal 2)

**Idea.** A routine is an ordered list of steps, and each step is a job the system already runs:
`use` (walk, dwell, emit `npc_used`) or `carry` (walk to an item, pick it up, walk to a target,
use it). The selector treats a routine as one more way to satisfy a need. No new mover.

**Authoring.** A library at scenario level, referenced by NPCs; the engine ships a few defaults
under the same ids that a scenario can override.

```jsonc
"routines": {
  "print_and_deliver": {
    "satisfies": "work", "restores": 50, "weight": 1,
    "steps": [
      { "use": "$home", "seconds": 8 },
      { "use": { "type": "printer" }, "seconds": 10, "output": "printout" },
      { "carry": "printout", "to": { "npc": "$colleague", "at": "home" } }
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
      { "use": "post_tray", "seconds": 5, "output": "post_bundle" },
      { "carry": "post_bundle", "to": "$home" }
    ]
  }
}

// on an NPC
"routines": ["print_and_deliver", "fetch_post"],
"routineArgs": { "colleague": "tom", "team": ["tom", "grace", "sanjay"] }
```

Step targets: an object id, `$home`, `{ "type": "<preset type>" }` (nearest reachable free one),
or `{ "npc": id, "at": "home" }` (that NPC's needs home object). `visit` walks to each listed NPC's
home in turn and faces them (a social step; with 2.4 it shows a bubble).

**Outputs.** `output: "printout"` names an **output slot**: a declared object on or beside the
printer, normally hidden.

```jsonc
{ "id": "printer_tray_sanjay", "type": "paper_sheet1", "needsTag": "printout:sanjay",
  "name": "Printout", "outputOf": "office_printer", "takeable": true, "hidden": true }
```

When the step completes, the engine reveals the slot (visible, pickable, synced with
`updateObjectState`), and the next `carry` step collects it through the ordinary carry path. If
the scenario declares no slot, the engine spawns a cosmetic sprite the player cannot take. That
keeps the server rule (1.2.2) and makes a printout on the tray a natural gameplay state (2.10).

**Engine.** In `npc-needs.js`:
- `_select` gains routine candidates: score as a use for the routine's need, reachability checked
  on the first step only (later steps check when they start).
- `s.job` gains `routine: { id, step, args }`. `_completeJob` advances to the next step instead of
  going home; the last step goes home. A step's target unreachable, timed out, or its output
  missing → `npc_job_failed` with `routineStep`, the 60 s cooldown on that routine, home.
- Claims: a routine claims only its current step's target, so a printer is free between prints.
- New events: `npc_routine_started:<npcId>`, `npc_routine_step:<npcId>` `{routine, step, targetId}`,
  `npc_routine_done:<npcId>`. `npc_used:<objectId>` fires per step as today, so existing mappings
  keep working.
- Output reveal: a world-adapter method `revealOutput(slotId)` (sets visible, pickable, emits
  `object_revealed:<id>`, calls `updateObjectState`). Cosmetic spawn reuses the item-drop sprite
  code (`item-drop.js`).
About 300 lines in `npc-needs.js` plus 50 in the adapter. Validator about 80 lines: unknown step
targets, `$arg` with no `routineArgs`, output slot missing, a routine whose steps span rooms not
loaded together (warning, as today), T1/P report per routine.

**Save/lazy-loading.** A reload mid-routine restarts the NPC at its post (constraint 3). An output
slot already revealed stays revealed (its state is synced) and still carries its `needsTag`, so
design the collector's step as presence-driven: on reload, give the routine's owner a temporary
interest in its own output tag (`printout:<npcId>`) while one is visible. The NPC then collects
the orphaned printout through the normal interest path. A step target in an unloaded room makes
the routine unavailable (first step) or fails it (later step); the validator warns at author time.

**Performance.** One more candidate per routine per idle NPC per tick; with 2.0's per-tick cache
this is an array filter. Steps add one path search each.

**Tests.** Node (stub world): a three-step chain completes in order with one `npc_used` per step;
output reveal then carry; step failure cleans up (claims released, carried item dropped,
cooldown set); a second NPC can use the printer between another's steps; reload simulation
(re-register with the slot visible) recovers the printout. `test_needs_sims`: add a printer to
the office; Sanjay gets `print_and_deliver` with `colleague: tom`; Amara gets `fetch_post` (from a
post tray in the kitchen corridor); a new objective "Someone prints and delivers a document".
Live: watch the chain in the log and screenshot the printout on the tray and on Tom's desk.

**Risks.** Chains make NPCs absent for longer and cross rooms more; jams at doors and the
"stuck walking into a wall" class of bugs show up more often. Keep step counts short (validator
warning above 4). Interaction with seating: a step at the owner's desk sits; other steps stand
(already the seating default for non-work, non-post objects). A routine's `$home` step with a
`work` restore and the plain work use both exist: the selector must prefer one consistently
(routine weight vs need weight); start with routines only winning when their weight is higher.

### 2.3 Visible object state (proposal 3)

**What exists.** `workstation-state.js` already decides locked or open on every leave, publishes
two globals, and an author can already hang a lighting emitter variant or a `spriteVariants`
entry on them. What is missing: a default look, any "in use" or "busy" state for other machines,
and correct globals after a reload.

**Authoring.** Nothing for the defaults. With `officePresets` on, workstations get built-in
emitter variants (the same mechanism as the ransomware screen variant, `lighting.js:84-96`):

| State | Glow |
|---|---|
| owner at desk | the current screen glow |
| owner away, open | the screen glow plus a slow `breathe` (a lit, unattended screen) |
| owner away, locked | dimmer, cooler glow (lock screen) |
| machine in use (coffee, printer) | `blink` indicator above the machine (small, `above: true`) |
| output waiting (printer tray) | the tray slot itself is visible; no glow |

Authors can still override any of these with a room `emitters` entry on the object id.

**Engine.** A small client-only **activity registry** (`window.officeActivity`, new module
`office-activity.js`, about 80 lines): `{ objectId: { inUse: npcId|null, busyUntil, output: bool } }`,
written by the needs system on `using` and complete, read by lighting through a new condition
form `activity.<objectId>.<key>` in emitter variants (`evaluateGlobalCondition` gets one more
prefix; about 30 lines in `utils/conditional-text.js` and `lighting.js`). Not globals, on purpose:
transient machine state should not be saved or synced. Workstation lock state stays on its globals
because scenarios already key text variants on them.

Fix the reload mismatch: at `installWorkstationState` (177-195) set every workstation's
`_owner_away` and `_screen_locked` globals to false, matching the in-memory map (the NPCs are at
their posts after a reload). Today a save taken while an owner was away keeps "away" text after a
reload while `onInteract` says "attended". About 10 lines; check with a reload test first.

**Save/lazy-loading.** Activity is not saved; after a reload nothing is in use, which is true.
Workstations in a room that loads after the owner left already take state on first interaction
(`onInteract` 144-145); the glow reads the same globals so it is correct on load.

**Performance.** Lighting re-resolves variants at most every `RESOLVE_MS`; the registry is a map
read.

**Tests.** Node: registry transitions from a stub needs run; condition parser accepts
`activity.x.inUse`; workstation globals reset at install (extend `workstation-state.test.mjs`).
`lighting-room-variants.test.mjs`: a workstation variant resolves for each state. Live: in
`test_needs_sims` with lighting on in the office, screenshot Amara's PC at desk, away-open and
away-locked (set `lockChance` on one PC), and the coffee station while in use.

**Risks.** Glow alone may be too subtle at game zoom; the activity readout may need a tiny screen
sprite swap instead (needs art per PC type, so start with glow). Reduced-motion: `breathe` and
`blink` already respect it.

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

**Behaviour.** When two NPCs hold uses on the same object with a `chatter` pool, or one walks past
another's home during a `visit` step, they turn to face each other (`faceTo`) and take turns: one
bubble each, three to four exchanges over the dwell, lines picked by seeded roll. A lone NPC at a
`chatter` object says nothing. The player approaching within 3 tiles makes them stop after the
current line; talking to either freezes both as today.

**Engine.** New `systems/npc-world-bubbles.js` (about 150 lines): a pooled Phaser text-with-
background container above the head (depth beside the action icon, hides the icon while shown),
reading time from `bark-lifetime.js`, one bubble per NPC at a time, at most four on screen.
Pairing logic in `npc-needs.js` (about 70 lines): on entering `using`, look for another NPC using
the same object; if found, schedule bubble turns on the needs clock (deterministic). Emits
`npc_chatted:<objectId>` `{npcIds, topic, lineIds, playerNearby}` so a scenario can turn an
overheard line into intel (an `addCapture`-style or social-intel grant mapping on
`data.playerNearby === true`).

**Save/lazy-loading.** Nothing saved. Only loaded NPCs chat.

**Performance.** Bubbles are pooled; at most four live. No TTS (see open question 2).

**Tests.** Node: pairing picks the same partner and lines for a seed; no bubble for a lone use;
`npc_chatted` payload. `test_needs_sims`: add pools for the cooler and office coffee; objective
"Two people chat at the water cooler". Live: screenshot two NPCs facing with a bubble; check the
bubble hides under a person-chat and the phone bark stack is unaffected.

**Risks.** Bubble text overlaps at close spacing; keep one line, max 40 characters, validator
enforced. Writers' time: every scenario now wants lines. Default pools ship with the engine so a
scenario gets chatter without writing any.

### 2.5 Queues at shared machines (proposal 4, second half)

**Today.** A second NPC whose need goes urgent while the only target is claimed waits **at its
desk** (README, "Contention"). That is tidy but invisible.

**Authoring.** `affordance.queue: { "cells": [{"dx":-1,"dy":1},{"dx":-2,"dy":1}] }` (preset
default: two cells beside the approach cell). Off unless set or preset.

**Engine.** In `_useCandidate`, a claimed target with a free queue cell is an option; the job
gets phase `queued` at that cell, advancing to the next cell or the approach cell as claims free.
About 120 lines. Queue order is claim order (deterministic by tick and NPC id).

**Why it matters for gameplay.** A queue lengthens an absence in a way the player can read from
across the room, and makes "owner away" windows longer at busy times without any scripting.

**Tests.** Node: three NPCs, capacity 1, two cells: order, advancement, a queued NPC whose need
is met elsewhere leaves the queue. Live: three staff at one coffee station in `test_needs_sims`.

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
`workstation-state.js` reads the owner's expanded `lockChance` when the object has none.

**Tests.** Node: expansion table, explicit fields win, determinism. Validator prints the expanded
values in its needs report so authors see what a trait did.

**Risks.** Hidden coupling: an author changes a trait and a beat's timing moves. The validator's
T1/P report after expansion is the guard.

### 2.7 Consumables and refills (proposal 7)

**Authoring.** `affordance.stock: { "max": 5, "perUse": 1, "restockFrom": "stationery_cupboard", "tag": "paper" }`.

**Behaviour.** Each use takes `perUse`; at zero the object is not an option for needs and shows an
"empty" activity state. An NPC with an interest in the restock tag (or the first NPC who wanted
the object, with the facilities trait) runs a built-in two-step routine: use the store object,
carry stock back, use the empty object (refilled to `max`).

**Engine.** About 150 lines on top of 2.2 (stock in the activity registry, restock as a generated
routine).

**Save.** Stock is client-only and resets on reload (full), consistent with needs.

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

`atMin` is needs-clock minutes on one shared scenario clock (recommended default, open
question 1), or, when the scenario sets `gameClock` with a `rate`, `at: "10:00"` in-game time. Blocks either nudge levels (`set`, which
`control` already does), scale need weights, or start a routine.

**Interruptions.** Today a running job is never preempted (`_tickNpc` 365-368). Add one rule: a
`high` priority schedule block or an eventMapping `needs: { "interrupt": "<routine>" }` aborts the
current job through the existing `_abortJob` (carried item dropped, claim released, chair tucked)
and starts the routine. Nothing else preempts. The desk phone is an interruption: its
`ring` (a mapping or schedule action) plays a sound at the phone and interrupts its owner with a
short `use` of the phone.

**Engine.** About 300 lines: schedule cursor per NPC (deterministic, seeded jitter), preemption
path, `atMin` vs `at` clock adapter, two built-in routines (`standup`: walk to a meeting-room
object with capacity, dwell, return; `leave`: walk to an exit object and hide via `setNPCVisible`).
Validator about 60 lines.

**Save/lazy-loading.** The schedule cursor is derived from the clock: on reload, the NPC skips
blocks already past (it does not replay a stand-up) except the latest weight block, which applies.
An NPC registered late (its room loaded at minute 12) joins at the block current at minute 12 on
the shared clock. The alternative, each NPC starting its own day at registration, is open
question 1.

**Tests.** Node: block order, jitter determinism, preemption cleans up, reload skip. Live: a
compressed `test_needs_sims` day (stand-up at 3 min, lunch at 6 min).

**Risks.** Preemption is the riskiest change in the plan: every place that assumes "a job runs to
completion" (seating, action icons, workstation leave/return pairing, carry claims) needs review.
Keep it last in Tier 2 and cover it with tests that interrupt each phase.

### 2.9 Desk phone (part of 2.8)

Phone ring as a preset type with an owner (`screenOwner` style `phoneOwner`, else the NPC whose
home desk is nearest). Uses the existing sound manager. A ring while the owner is away emits
`desk_phone_unanswered:<id>` with `playerNearby` (a gameplay hook: the player can answer; what
that leads to is the scenario's). About 60 lines including the interrupt hook.

### 2.10 Opportunity windows (proposal 9)

Described as gameplay states only; what each one yields is scenario wiring.

| Window | Built from | New engine work |
|---|---|---|
| Owner away, screen open | workstation-state (exists), traits (2.6) | none beyond 2.3 and 2.6 |
| Owner queuing or on a long routine | queues (2.5), routines (2.2) | `npc_left_post` gains `expectedAwayMs` (sum of walk estimates and dwells), so a scenario hint or an NPC line can say "back in a minute" |
| Document waiting on a printer tray | output slots (2.2) | none beyond 2.2; the slot is a takeable declared item; taking it fails the owner's carry step cleanly (`item_gone`) and emits `npc_job_failed` with `reason: item_gone`, which a scenario can map to the owner noticing |
| Item left on a desk | traits (`tidiness`), declared hidden item with `leftBehindBy: "<npcId>"` | on `npc_left_post`, a seeded roll reveals the item; on return the owner picks it up again (an interest in its own item's tag) |
| Pile waiting to be shredded | an object with `pileCount`, a `shred` routine that reduces it | about 40 lines: a count in the activity registry, a sprite variant per level |
| Door held for someone carrying something | the lab's tailgate wiring (route + `challengeOnSight`, `data.playerNearby`) | generalise later; no engine work now |

Rules for scenario design (not engine): every window must be readable from the floor (an action
icon, a glow, a queue), must close again, and must be repeatable after a reload because need
state resets.

### 2.11 Noticing the player at the desk (proposal 10)

**Authoring.** None required: the events gain data. A scenario maps them.

```jsonc
{ "eventPattern": "npc_caught_at_post:hampshire",
  "conversationMode": "person-chat", "knot": "caught_at_my_desk", "onceOnly": false, "cooldown": 30000 }
```

**Engine.** In `npc-needs.js`: `npc_returned_post` and `npc_left_post` carry `playerNearby` and
`playerDistance` (reuse `_playerProximity`). While `returning`, if the player is within 1.5 tiles of
the home object's approach cell, or has a minigame open on the home object, emit
`npc_caught_at_post:<npcId>` `{objectId, playerDistance, inMinigame}` once per return. The
sight challenge with `near: { object }` covers "seen near the desk from across the room"; this
covers "came back and you were in my chair". About 40 lines.

**Save.** None.

**Tests.** Node: stub proximity on return → event once; not on a return with the player elsewhere.
Live: in `test_needs_sims` stand at Tom's desk when he returns; log shows the event and the
mapped bark.

**Risk.** A player who opened a PC minigame cannot react while it is open; NPCs keep moving during
minigames (only the VM freezes them). Decide whether a catch closes the minigame (open question 6).

---

## 3. Build order

Each slice ships alone: it has its own node tests, a `test_needs_sims` addition with an objective
that ticks when the behaviour is seen, a live check, and a `lab_physical_pentest` regression run
(the lab's three beats still complete). Sizes are engine plus validator lines, excluding tests.
S = under 100, M = 100-250, L = over 250.

| # | Slice | Size | Depends on | Who benefits first |
|---|---|---|---|---|
| 1 | Tick-cost hygiene (2.0) | S, ~80 | none | every needs scenario; unblocks larger casts |
| 2 | Caught at the desk + workstation reload fix (2.11, 2.3 fix) | S, ~50 | none | lab: Chris Hampshire returns to find the player at `staff_pc` during the keylogger beat; a mapped line makes the risk real. Also fixes stale "away" text after a reload on `staff_pc` / `staff_pc_2` |
| 3 | Affordance presets (2.1) | M, ~160 | 1 | `test_needs_sims` loses most hand-written affordances; new scenarios get an office from `type` alone |
| 4 | Visible state: activity registry and workstation glow (2.3) | M, ~150 | 3 for defaults (works with explicit config without it) | lab: Melanie Pierce's open screen (`staff_pc_2`, `locksScreenOnLeave: false`) and Chris's locked one are readable from across the open plan, so the player reads the window instead of examining each PC |
| 5 | Routines with output slots; printer preset (2.2) | L, ~430 | 1, 3 | sims: print and deliver, fetch the post. Lab: staff gain a reason to leave the desk other than coffee; a printout on the tray becomes a findable document if the lab wants one. The keylogger beat keeps working because a routine's `$home` step still emits `npc_used:staff_pc` |
| 6 | Speech bubbles and pairing (2.4) | M, ~220 | 1 | sims: cooler and coffee chat. Lab: staff chatter at `coffee_station` the player can overhear (`npc_chatted` with `playerNearby`), a natural place for a social-intel grant in the awareness build |
| 7 | Traits (2.6) | S, ~90 + validator | 4 for the lock link | lab: Chris and Melanie's lock habits become traits rather than per-object flags; awareness scenarios get "careful" and "careless" staff from one field |
| 8 | Queues (2.5) | M, ~120 | 1, 3 | lab: a queue at the coffee station stretches Chris's absence in a way the player can see |
| 9 | Window helpers: `expectedAwayMs`, left-behind items, piles (2.10) | M, ~150 | 5, 7 | lab and awareness: more than one kind of window per office without scripting |
| 10 | Schedule, preemption, desk phone (2.8, 2.9) | L, ~420 | 5 | longer scenarios with a stand-up or a fire drill; lab: optional later move of Len's badge round onto a schedule |
| 11 | Consumables and refills (2.7) | M, ~150 | 5 | deferred until a scenario asks |

Slices 1-4 are about 440 lines in all and change no shipped scenario's behaviour (presets and
glows are behind `officePresets`; the reload fix only touches text variants). Slice 5 is the
first that changes what NPCs do, and only for NPCs that list routines.

`test_needs_sims` grows by one room at most (a small print/post corner off the office) and one
NPC (a facilities person for queues and later refills). Keep the five current staff and their
timings, so the README's live-proof table stays valid; add rows per slice.

**Lab notes.** Len stays on his multi-room route with `challengeOnSight`
(`lab_physical_pentest/scenario.json.erb`, his `behavior.patrol.route` with the
`{unlockRoom, useObject: "badge_reader"}` action). `NPC_NEEDS_SYSTEM.md` §12.3 still describes the
older `rounds` need and is out of date on this; correct it when slice 2 lands. Sofia Lord (the
dropped-device beat) needs nothing new; she benefits from 6 (overheard chatter) and 9 only.

---

## 4. Cut, defer, and open questions

### 4.1 Cut

- **Simulating unloaded rooms.** No off-screen NPCs or abstract time. If a scenario wants the
  whole office alive from the start, it preloads the rooms (open question 5).
- **A real-length working day.** Sessions are 20-40 minutes; schedules are compressed.
- **Runtime-generated dialogue.** Standing rule; chatter is authored pools.
- **Engine-invented takeable items.** Only declared slots can be taken (constraint 1.2.2).
- **Persisting need levels across a reload.** Reset stays; designs must self-heal instead.

### 4.2 Defer

- Consumables (slice 11) until a scenario wants the beat.
- Voiced chatter (TTS for bubbles): text first; revisit with the tts-audio pipeline if the lines
  settle.
- "Door held for someone carrying something" as an engine feature: the lab's route + sight wiring
  does it today.
- Moving Len to needs or a schedule: his route works and is tested.
- Screen sprite swaps per PC type (art cost); glow first.
- A "next want" thought bubble (`showNpcIntentBubbles`, parked in `npc-action-icons.js`).

### 4.3 Open questions (recommended default in bold)

1. **Schedule clock.** Per-NPC minutes since it registered, or one shared scenario clock, or
   in-game time? **Shared scenario minutes (`atMin`) by default; in-game `at` only when
   `gameClock.rate` is set.** A late-loading room then joins the day in progress.
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
   which wins? **The higher weight; ties go to the plain use, so existing beats keyed on a plain
   use keep their timing.**
10. **Workstation reload fix.** Reset `_owner_away` / `_screen_locked` globals to false at install?
    **Yes, after a reload test confirms the stale text today.**

