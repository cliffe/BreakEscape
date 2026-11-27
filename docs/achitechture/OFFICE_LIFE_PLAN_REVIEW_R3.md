# Office Life plan: adversarial review, round 3 (confirmation)

Reviewed: `docs/achitechture/OFFICE_LIFE_PLAN.md` at commit 5aab2ce5d (revised after R1 and R2).
Read-only review; no code or plan edits. Paths are relative to `public/break_escape/js/` unless
they start with `scenarios/`, `public/`, `test/` or `docs/`.

Scope set by the user: build slices 1, 2, 3, 4, 5, 7, 8, 10 and 11 only (not 6 traits, 9
routines, 12 schedules, 13 consumables). Slice 0 (the own-desk core fix) is out of scope except
where slice 2 overlaps it.

Tally: **R1: all 25 findings closed. R2: 36 of 37 closed, N10 partly (see R3-M2). The nine simpler
remedies all work, two with a small gap (minors). New: 0 blockers, 3 major, 7 minor.** Verdict:
**ready to build, with three conditions** (end of file).

## 1. R1 and R2 findings against the code

### 1.1 R1 residuals (B1, M1, M4, M5)

| R1 | Status | Evidence |
|---|---|---|
| **B1** carry outcomes, reveal persistence, one-shot slots | Closed | Through N1-N4 below |
| **M1** parity test cannot pass | Closed for the node test | Fixture with a `useFrom`-aware stub (2.0), PCs need no override because presets set no `useFrom` (2.1). The live check has a new hole the fixture cannot see: room-map decor (R3-M1) |
| **M4** glows will not read in a lit room | Closed | Through N5 |
| **M5** overhear and pairing | Closed | Through N6; coffee chatter moves to slice 10 |

The other 21 R1 findings were confirmed closed by R2; nothing in the revision reopens them.

### 1.2 R2 findings

| R2 | Status | Evidence and remaining gap |
|---|---|---|
| **N1** (simpler remedy: direct show/hide, stow on sight) | Closed; remedy works | `showRevealedObject` is a plain function (`core/rooms.js:2970-2976`), not exported today, so the export is real work and is counted. A second show from the once-registered listener (`hideUntilReveal`, 2955-2965) is harmless. `revealRoom` runs again on first entry (`core/rooms.js:3089-3091`) and re-hides any slot whose global is false (3023-3026), so it agrees with `stow`. Gap: there is no "room loaded" event to hang "stow on sight when its room loads" on (m1) |
| **N2** notes slots consumed on read | Closed | `readDisplay: "gameDisplay"` reads in place (`systems/interactions.js:1698-1706`) and never reaches the notes minigame. Small side effect (m3) |
| **N3** (simpler remedy: outcome by item kind) | Closed; remedy works | The parcel stays on `consume` (`npc-needs.js` `_completeJob`, `consumeHeld` call at about 597), so its log is untouched. Edge: a taken slot that is `droppable` comes back as a player drop still carrying `outputOf` (m2) |
| **N4** room bookkeeping | Closed | Pickup looks in `rooms[currentPlayerRoom].objects[objectId]` and removes from `sprite.roomId` (`systems/inventory.js:509-532`), which is exactly what "register where it sits, keep `sp.roomId` declared" gives. Pickup sets `active = false` (515), which the free test reads |
| **N5** (simpler remedy: second emitter record) | Closed; remedy works | Emitters are an array, not a map keyed by object (`systems/lighting.js:531-555`), so a second record per object fits. With `base: null` a variant without `color`/`radius` resolves to no glow (575-577); `offsetX/Y` are honoured (1012); `createFlames` skips null (610); `clusterEmitters` damps only `effect: 'screen'` (590-591). Variant order gives locked before open, and `_publish` sets both globals on a locked leave (`systems/workstation-state.js:107-111, 113-124`), so first-match-wins is right |
| **N6** no pairing at capacity 1 | Closed | Slice 8 pairs at capacity 2+ only; coffee moves to slice 10 |
| **N7** stub world missing | Closed | Fixture budgeted in slice 1, extends `makeWorld` |
| **N8** (simpler remedy: no preset `useFrom` where the showcase has none; presets never make workstations) | Closed; remedy works for declared objects | Showcase values match the preset table: PCs 60/10 (`scenarios/test_needs_sims/scenario.json.erb:83, 92, 101`), office coffee 70/12 with `useFrom {-1,0}` (117), fridge `{0,1}` (285), microwave 60/10 (294), kitchen coffee `{0,-1}` (303), cooler cap 2 (312), sofa `{0,-1}` (345). Grace and Rosa have no `work` need (244-247, 363-367), so `affordance: false` on their laptops is the right override. Undeclared decor is not covered (R3-M1) |
| **N9** bob undone by `poseSprite` | Closed | `poseSprite` re-places only on a whole-pixel change (`systems/seating.js:599-604`); a `dy` inside it survives |
| **N10** own-desk use stands and re-sits | **Partly closed** | The landed fix leaves one `returning` tick after the use that the planned `needsStop` change does not cover (R3-M2) |
| m1-m14 | Closed | m2 (one-shots, `hearing` is pure window state, `lighting.js:706-711`), m5 (cut), m8 (moot under N3), m9 (moot), m14 (narrowed to routine steps) are the simpler remedies; each holds. m4: `postupdate` precedent confirmed (`seating.js:958`) |
| C1-C13 | Corrected | Each wrong claim is fixed in the text cited in section 6 of the plan. C13's lab lines check: 562/759 caffeine, 865, 874 |

## 2. New major findings

### R3-M1. Room-map decor gets presets (slice 4, 2.1)

Unreserved Tiled items are registered in `rooms[roomId].objects` with a synthetic
`scenarioData` whose `type` is the image name stripped of digits and any `-suffix`
(`core/rooms.js:2736-2741`). So decor `laptop6.png` becomes `type: "laptop"`, `pc11.png`
becomes `"pc"`, and the same holds for `coffee_station`, `water_cooler`, `photocopier`,
`shredder`, `kettle`: exact preset types. Decor has no `id`, is `takeable: false` and has no
`lockType`, so none of 2.1's exclusions catch it. `listObjects` keys it by `sp.objectId`
(`npc-needs.js:782-795`), so with `officePresets: true` every decor PC and laptop becomes a work
target.

In the showcase: `public/break_escape/assets/rooms/room_office.json` has 3 PCs and 4 laptops on
`table_items`; the scenario declares 3 PCs and one laptop in the office, so about three decor
laptops gain `desk_pc`. `_useCandidate` prefers the home object only while it is free and
reachable (`npc-needs.js:472-481`); otherwise the NPC walks to the nearest free decor laptop and
seating fetches a chair to it (`seating.js:767`). The hand-written fixture holds only declared
objects, so the node parity test passes while the live game differs, and the validator never sees
decor either. In any other scenario that switches presets on (the lab's open plan, new office
maps), every decorative screen becomes a desk.

**Change.** In `resolveAffordance`: no preset for an object without a scenario `id` (or with
`decor: true`), i.e. presets apply only to objects declared in `scenario.rooms[*].objects`. About
2 lines. Node test: a decor-shaped sprite (`{ type: 'laptop', takeable: false }`, no id) resolves
to no affordance. Live: have the slice-4 run list every object with a resolved preset through
`window.__test`, and compare it with the validator's list.

### R3-M2. The landed own-desk fix leaves a `returning` tick; slice 2's seating change misses it (2.11)

The core fix landed as b642594be. It does not send an own-desk use "straight to idle" as 2.11's
semantics say: `_completeJob` still calls `_goHome` (`npc-needs.js:612`), which sets
`mode = 'returning'` and queues an arrival (670-679); the next tick turns it idle and, with
`atPost` still true, emits nothing (351-358). For that tick (250 ms, and for longer if the
completion races a frame) `needsStop` returns null, since it only knows `using` and
`idle && atPost` (`seating.js:741-748`). `updateNeedsSeat` then unseats the NPC and tucks the
chair (827-831), and re-seats it on the next tick. Slice 2's change, "the home stop for an at-post
job in any phase", covers the wind-up and `goto_target` but not this tick, so the hop the slice
promises to remove still shows at the end of every own-desk use.

**Change.** `needsStop` returns the home stop for `mode === 'returning' && atPost` as well as for
an own-post job in any phase (the key `at:<homeId>` is the same in all three). Extend the planned
`seating.test.mjs` case to the tick after completion. Update 2.11 to describe what landed: cite
b642594be, say an own-desk use returns through one `returning` tick, and replace the `s.leftEmitted`
wording with the `atPost` gate that was built (m6).

### R3-M3. Slice 11 depends on slices 6 and 9 (subset coherence)

As written, slice 11 cannot be built without two slices the user has not chosen:
- **Left-behind items** roll `< 1 - tidiness` (2.10), and `tidiness` is a trait (2.6, slice 6).
- **Piles** shrink through "a `shred` routine" (2.10), i.e. slice 9. The `shredder` preset has no
  `satisfies` and "never draws an NPC on its own" (2.1), so without routines nothing visits the
  shredder. The pile's `publishGlobal` (OQ3) exists only for piles.

The rest of slice 11 is fine in the subset: `leaveCount` is added by slice 11 when 9 has not
landed (2.10 says so), and the queue part of `expectedAwayMs` needs slice 10, which is chosen.

**Change.** Scope slice 11 to left-behind items and queue-aware `expectedAwayMs`:
- replace `tidiness` with an item field, `leftBehindChance` (0-1, schema entry, validator bound),
  rolled as `roll(npcId, 'left:' + s.leaveCount) < leftBehindChance`; a later slice 6 can fill it
  from `tidiness` without changing the roll;
- move piles, `pileCount` and `publishGlobal` to a slice that follows 9 (or drop them);
- the showcase uses `leftBehindChance: 0.7` on Tom's badge instead of `tidiness: 0.3`, and drops
  the "Watch the pile go down" objective.
Size drops from ~155 to roughly 90.

The other chosen slices stand alone:

| Slice | Needs 6, 9 or 12? | Notes |
|---|---|---|
| 1, 2, 3 | No | |
| 4 | No | Fixture from 1 |
| 5 | No | The showcase sets `lockChance: 0.5` on `tom_pc` directly; slice 6 would only replace it |
| 7 | No | Producer is an `onUse` hook on an NPC (`npc-needs.js` `_completeJob`, hook at 606-610); delivery is a plain interest carry; filing is `placeSeconds`. The `then: "stow"` and output reservation parts belong to 9 and are simply unused |
| 8 | No | `visit` pairing is explicitly slice 9's half; drop it from slice 8's schema and README example so nothing half-built ships |
| 10 | No | Queue chatter needs 8 (chosen). Default queue cells come from presets (4, chosen) |
| 11 | **Yes, as written** | R3-M3 |

## 3. The orchestrator's decisions

**OQ18: a plain work use at a colleague's free desk keeps sitting; only routine steps stand.**
Sound. It is today's behaviour, and in the chosen subset slice 9 is not built, so no stand rule is
built at all and nothing changes for shipped scenarios. One gap in the wording: a carry to a
colleague's free desk (an author making `tom_pc` accept a tag) also sits, because `seatPreference`
gives `fetch` to any target that satisfies `work` (`seating.js:767`) and the other-post guard lifts
when the stop is that post (865-866). Same rule, same answer; say so in OQ18 (m7).

**OQ19: lab coffee chatter waits for slice 10's queue chatter; `coffee_station` stays capacity 1.**
Sound, with a corrected rationale. Chris and Melanie have identical caffeine needs (25/min from
100, `urgentAt: 50`; `scenarios/lab_physical_pentest/scenario.json.erb:562, 759`), so both go
urgent on the same tick about two minutes in, and the station's `useSeconds` is 45 (909). With a
queue the second one reliably queues and the pair reliably chats, which is a good payoff. But the
plan prefers queues partly because `capacity: 2` "moves the lab's coffee timing"; a queue moves it
too: the second NPC now leaves its post (a real `npc_left_post`, workstation away window) up to
45 s earlier than today, where it now waits at the desk. Slice 10 must list that as a lab behaviour
change and re-run the lab beats, and the lab has to author `affordance.queue` and
`affordance.chatter` on `coffee_station` itself, since it does not switch presets on (m4).

## 4. Slice 2 against the landed slice-0 fix

No duplication: b642594be changed only `npc-needs.js` (`_atOwnPost`, wind-up and `_leavePost`
gates, `returned_post` gate) and added tests to `test/js/npc-needs.test.mjs` and
`test/js/workstation-state.test.mjs`. Slice 2's own work (caught at the desk, `expectedAwayMs`,
workstation reload fix, `needsStop`, docs) touches none of those lines. Two conflicts in the
plan's text, not in code: the `returning` tick (R3-M2), and the pairing claim (m6). The plan still
says the fix "is being fixed now" and "lands separately"; it has landed, and slice 2's first step
("read the landed fix and its tests") can start.

## 5. New minor findings

- **m1. No room-load hook.** "Stow on sight when its room loads" (2.2 Part A) and slice 1's "clear
  all back-offs whenever a room loads" (2.0) need an event that does not exist: `loadRoom` creates
  and reveals the room and emits nothing (`core/rooms.js:860-866`); `room_entered` fires only when
  the player walks in (3095-3101). Add an emit after `revealRoom` at 865 (`room_loaded:<id>`), or
  have the adapter notice new room ids in its per-tick object list. Name it in slice 1 so slice 7
  reuses it.
- **m2. A taken, dropped slot.** If a slot is `droppable`, the player can take it and drop it; the
  drop keeps its `scenarioData` (with `outputOf`) and lives in `objects_added` at the drop point
  (`systems/item-drop.js:25, 41-75`). By 2.2's rule it is still a "slot", so an NPC would place
  and stow it, and a reload would bring it back at the drop point. Validator: reject `droppable` on
  a slot or `leftBehindBy` item; or classify a `sourceType: 'player_drop'` sprite as plain.
- **m3. Read-in-place adds a note per read.** `gameDisplay` still calls `addNote` unless
  `addToNotes: false` (`systems/interactions.js:1700-1705`). For cycling printouts the example
  should set `addToNotes: false`, or the README should say each read files a copy.
- **m4. OQ19 rationale.** As section 3: queues also move the lab's coffee timing; list it in
  slice 10 and author queue and chatter on the lab's station.
- **m5. Cooler pairing in the showcase may not overlap.** Slice 8 sets Sanjay's and Rosa's
  `social` to 10 on the same tick, but they start in different rooms (office, meeting room), and
  pairing needs both `using` at once inside a 15 s dwell (`scenario.json.erb:312`). If their walk
  times differ by more than about 12 s, they never overlap. Check the arrival gap in the first live
  run and stagger the mapping if needed; do not lengthen the cooler's dwell (that breaks slice 4
  parity and the README table).
- **m6. Event pairing claim.** 2.11 says `npc_returned_post` fires only if `npc_left_post` fired
  (`s.leftEmitted`). The landed fix gates on `atPost` instead, so a script move (which clears
  `atPost` without `npc_left_post`, `onExternalMove`) followed by a needs return still emits an
  unpaired `npc_returned_post`. Harmless today (`onReturned` for an owner who was never away just
  re-publishes false, `workstation-state.js:126-134`). Slice 2 either adds the flag or drops the
  claim.
- **m7. OQ18 wording.** Extend it to carries delivered to a colleague's free desk (section 3).

## 6. Verdict

**Ready to build, with three conditions**, each a small edit to the plan or to the slice's brief
rather than a change of design, so no fourth review round is needed:

1. **Slice 4**: presets apply only to scenario-declared objects (R3-M1), with the decor test and the
   live list of preset objects.
2. **Slice 2**: `needsStop` also covers `returning && atPost`, and 2.11 describes the fix that
   landed in b642594be (R3-M2, m6).
3. **Slice 11**: scoped to left-behind items (with `leftBehindChance` in place of `tidiness`) and
   queue-aware `expectedAwayMs`; piles move after slice 9 (R3-M3).

Fold the minors into the slice that owns each (m1 into slice 1, m2 and m3 into 7, m4 into 10, m5
into 8, m7 into the OQ text). Slice order for the subset stays 1, 2, 3, 4, 5, 7, 8, 10, 11.
