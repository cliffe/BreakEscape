# Office Life plan: adversarial review, round 1

Reviewed: `docs/achitechture/OFFICE_LIFE_PLAN.md` at commit 3584940a4. Read-only review; no code or
plan edits. Paths below are relative to `public/break_escape/js/` unless they start with
`scripts/`, `scenarios/`, `app/` or `docs/`.

Tally: **1 blocker, 11 major, 13 minor.** Verdict: **revise** (end of file).

## 1. Fact check of the plan's claims

Most line references are accurate. I checked each one in section 1.1 and the inline ones in
section 2.

### 1.1 Confirmed

- `npc-needs.js`: `roll` 136-138, `onExternalMove` 240-250, `control` 253-280, `tick` 284-294,
  no preemption in `_tickNpc` 365-368, `_claims`/`_free` 397-418, `_select` 445-467,
  `_useCandidate` 469-480, `_carryCandidate` 482-495, `_startJob` 497-517, `_completeJob` 576-604,
  `_playerProximity` 607-610, `createEngineWorld` 706-922, `describe` 716-727, `listObjects`
  773-787, `approachCell` 792-804, sync EasyStar `reachable` 805-832, pick up / consume / drop
  867-908, server removal on consume 891.
- `npc-behavior.js`: `goToAndStay` 2448 with the `onExternalMove` call at 2456, `cancelMove` 2499,
  `faceWorldPoint` 2518, `_triggerGoToStayArrival` 2524, chat freeze guard 706-717, route dwell
  1076-1109, route actions 1602-1647, route-room preload 658-672 (skips locked rooms).
- `npc-manager.js`: `needs` mapping field 855, `control` call 1164-1166, phone-style bark path
  1482-1521. No in-world speech bubble exists (the only "bubble" in the engine is the parked
  `showNpcIntentBubbles` flag, `npc-action-icons.js:11, 53`).
- `workstation-state.js` globals, events and the late-room path in `onInteract` 144-145.
- `core/rooms.js` `registerSpriteVariantListeners` 688; `unloadNPCSprites` 3335 has no caller
  (only the `window` assignment at 3357). `doors.js:763` loads rooms; `npc-lazy-loader.js:103, 139`.
- `lighting.js` header 1-45, `RANSOM_VARIANT` 87, `EMITTERS` from 180; `breathe`/`blink` honour
  reduced motion (174, 291, 967).
- `npc-sight-challenge.js` supports `near: { object, radius }` (38, 63).
- `room-state-sync.js` 17, 85, 138; `game-clock.js` `parseGameClockRate` 54, `timeParts` 158.
- `scripts/validate_npc_needs.rb` is 161 lines. All six named test files exist under `test/js/`.
- `NPC_NEEDS_SYSTEM.md` §12.3 does still describe Len's old `rounds` need while the lab uses a
  route (`scenarios/lab_physical_pentest/scenario.json.erb:651-654`). The plan is right to flag it.
- Lab names check out: Chris Hampshire on `staff_pc` (`locksScreenOnLeave: true`, 740-748),
  Melanie Pierce on `staff_pc_2` (`locksScreenOnLeave: false`, 820-828, with an
  `observationVariants` entry keyed on `staff_pc_2_owner_away`, 837), Sofia Lord on
  `usb_target_pc` (562), `coffee_station` (864-874), Len's `{unlockRoom, useObject: "badge_reader"}`.
- The stale-global-after-reload claim holds: `state-sync.js:164` syncs every global, including
  `<id>_owner_away` and `<id>_screen_locked`, while the `away` map (`workstation-state.js:80`)
  starts empty, so `onInteract` returns `'attended'` (143) against "away" text.

### 1.2 Wrong or inaccurate claims

| # | Plan says | Code says | Fix in plan |
|---|---|---|---|
| W1 | §1.3/§2.0: a waiting NPC (urgent, target claimed) re-runs a synchronous EasyStar search every tick | `_useCandidate` filters by `_free` before any `reachable` call (`npc-needs.js:470`), so an all-claimed wait does no path search. The repeat searches come from a **free but unreachable** target (each candidate in distance order, 434-443) and from **interests**, which path-check items before checking for a free accepting target (484-489) | Retarget the back-off at "no reachable candidate" and at interests with no free `accepts` target |
| W2 | §2.1: merging presets in `describe()` gives an object its affordance | `listObjects` drops any object with no `affordance` and no `needsTag` **before** `describe` runs (`npc-needs.js:782`) | Merge in `listObjects` (or a shared resolver both call); `getObject` too |
| W3 | §2.2: "an output slot already revealed stays revealed (its state is synced with `updateObjectState`)" | The server permits only `opened, on, brightness, screen_state` (`app/controllers/break_escape/games_controller.rb:2185-2187`); a `visible` change is dropped. There is no `hidden` object field in the engine; the existing mechanism is `revealOnGlobal` (`core/rooms.js:2952-2976, 3023`) | See blocker B1 |
| W4 | §2.2: "a step at the owner's desk sits; other steps stand (already the seating default for non-work, non-post objects)" | Default for a non-work, non-post object is `'near'` (sit if a chair is already there), and **any** object that satisfies `work` gets `'fetch'`, including someone else's desk (`seating.js:759-768`). The "chairs at another NPC's post" guard lifts when the stop is that post (865-866) | See M8 |
| W5 | §2.4: "talking to either freezes both as today" | Freeze is per NPC: `inChatWith(id)` is true only for the open conversation's `npcId` (`npc-needs.js:765-772`) | Make pair-freeze new work, or drop the claim |
| W6 | §2.10: taking a printout "fails the owner's carry step cleanly (`item_gone`) and emits `npc_job_failed`" | `item_gone` goes through `_abortJob`, which logs `job_aborted` and emits nothing (`npc-needs.js:550, 557, 620-627`); only `_failJob` emits `npc_job_failed` (612-618) | Add the emit (a few lines) and say so |
| W7 | §1.3: `targetInfo` scans every room per NPC per frame | Only for NPCs that have a job (`npc-action-icons.js:64-67`) | Wording |
| W8 | §2.8: "Today a running job is never preempted" | Scripts, `suspend` and KO/hostile/hidden already abort jobs (`npc-needs.js:243, 257, 305-311`). True only for need-vs-need | Wording |
| W9 | Line numbers | `isWorkstation` is 43-46, not 45-48; `installWorkstationState` starts at 157 (177-195 is the env); `gameSecondsAt` is 99 | Update refs |

## 2. Blocker

### B1. Output slots and left-behind items cannot work on today's carry path (§2.2, §2.10; slices 5 and 9)

Three facts combine:

1. **A carry always consumes.** `_completeJob` calls `consumeHeld` (`npc-needs.js:588`), which
   destroys the sprite and removes the object from the server's room state (884-892). So
   Sanjay's printout vanishes at Tom's desk. The plan's live check ("screenshot the printout on
   the tray and on Tom's desk", §2.2 Tests) cannot pass, and nothing is left for the player to
   find at the destination.
2. **The reveal is not persisted.** `updateObjectState` cannot carry visibility (W3), and
   `hidden: true` is not an engine field. After a reload the slot comes back in its declared
   state, so the "orphaned printout" recovery in §2.2 Save has nothing to recover.
3. **A declared slot is one-shot.** Once consumed it is gone server-side for good. The second
   print has no slot and falls back to the cosmetic sprite. The same goes for "item left on a
   desk ... on return the owner picks it up again" (§2.10): the pick-up and consume remove it, so
   the window cannot recur, which breaks the plan's own rule that windows "must be repeatable".

**Suggested change.**
- Add a carry outcome to the step: `"then": "consume" | "place" | "stow"`. `place` puts the
  item down at the target's approach cell (as `dropHeld` does, 893-908); `stow` hides it in place
  without destroying it or touching the server. Default stays `consume`, so existing beats
  (`test_needs_sims` parcel and mugs) keep their logs.
- Reveal slots with the existing `revealOnGlobal` and a per-slot global
  (`printer_tray_sanjay_out`), set by the engine. Globals sync (`state-sync.js:164`), so a reload
  keeps the reveal with no server change. Note that `revealOnGlobal` is one-way
  (`core/rooms.js:2961-2963` only listens for `true`); a "hide again" path is new work if a slot
  must cycle.
- State plainly that a **takeable** slot is a single beat ("the first printout of the day"),
  and that repeats are cosmetic. That is honest, and it is all a scenario beat needs.
- Re-size slice 5: the place/stow outcome, slot reveal/hide and the reload case add perhaps
  100-150 lines on top of the ~430.

## 3. Major findings

### M1. The preset parity test cannot pass as written (§2.1 Tests)

"A copy of the scenario with `officePresets: true` and the affordances deleted must give the same
decision log" assumes the preset table reproduces the hand-wired file. It does not:

- Both coffee stations use `useSeconds: 12` and their own `useFrom` (`scenarios/test_needs_sims/scenario.json.erb:117, 303`); the table says 45 s and "nearest" (the lab's value, `lab_physical_pentest/scenario.json.erb:874`).
- `amara_pc` carries `accepts: ["post"]` (83), which no preset gives; Amara's parcel beat would stop.
- `grace_laptop` (104-110) and `rosa_laptop` (332) have no affordance today; the `laptop` preset makes both work targets for everyone.
- The microwave/fridge row gives ranges ("60-80, 10-15"), not values.
- The coffee preset's `seat: false` changes today's default `'near'` (see M8).

Combined with W2, slice 3 would also do nothing at all until `listObjects` changes.

**Change.** Make the test "presets plus the per-object fields that differ give the same log", and
list those fields in the test fixture. Give one value per row. Fix the merge point (W2).

### M2. Prefix matching on `type` collides with existing object types (§2.1)

- `phone` is used 48 times across scenarios, mostly takeable phone items and phone-chat
  contacts (e.g. the "Your Phone" items). A `phone` preset would give them an affordance and a
  ring. There is no desk-phone sprite distinct from those (`assets/objects/phone*.png`).
- `printer` matches `printer_3d2`; the only office printer art is `photocopier1`.
- `filing_cabinet` matches `filing_cabinet_locked1/2`, which are lock puzzles; a `file` routine
  step `{ "type": "filing_cabinet" }` could send an NPC to the puzzle cabinet.
- The example output slot type `paper_sheet1` and the `post_tray` object have no art. The
  takeable paper type in use is `notes` (419 uses).
- The plan says "matched by prefix like the lighting table", but lighting matches the **texture
  key** (`lighting.js:180-196`), and objects often differ in `type` and `sprite` (the lab coffee
  station is `type: coffee_station`, `sprite: coffee_station1`, 864-867).

**Change.** Use an explicit allow-list of exact types per preset (no bare prefixes), add an
`officeType` field for anything not covered, and exclude anything `takeable: true` or with a
`lockType` from presets. List the art each slice needs (desk phone, printout, post tray).

### M3. `npc_left_post` fires when an NPC starts work at its own desk (§2.3, §2.10, §2.11)

`_startJob` winds up and calls `_leavePost` whenever `s.atPost` is true (`npc-needs.js:509-525`),
including a `work` use of the NPC's own home PC. A stub-world run confirms the sequence
`npc_left_post:a {targetId:"pc"}` → `npc_used:pc` → `npc_returned_post:a` with the NPC never
leaving its desk. `workstation-state.js:112-123` then marks the owner away and may lock the screen
for the whole dwell.

Effects on this plan:
- §2.3: the "owner away, open" glow would show while the owner sits at the PC.
- §2.11: after every home-desk work use the NPC is `returning` for a tick; a player reading the PC
  within 1.5 tiles triggers `npc_caught_at_post` although nobody left.
- §2.10: `expectedAwayMs` would announce absences that are not absences.
- Today, in the lab, Melanie's `staff_pc_2` reports `owner_away` (and `workstation_accessed`
  fires on interaction) during her own work dwells.

**Change.** Add a prerequisite fix to slice 2: skip `npc_left_post`/`npc_returned_post` when the
job's target is the NPC's home object (or emit with `atHome: true` and have workstation-state
ignore it). Add a node test and re-check the lab's Melanie window after the fix.

### M4. Workstation glows will not read in a lit office (§2.3, slice 4)

In a lit room an emitter's glow sits under the multiply light map, just in front of its object
(`lighting.js:1033-1041`); only `ransom` and `above: true` variants draw above it. The lab office
is lit (`"lighting": { "enabled": true, "defaultMode": "on" }`, `lab_physical_pentest/scenario.json.erb:13, 485-489`),
and `test_needs_sims` has no `lighting` block at all. A dimmer, cooler "locked" glow and a
`breathe` on an "open" screen will be close to invisible at game zoom, which is the opposite of
slice 4's promise ("readable from across the open plan"). Plain screens within 32 px also share a
damped glow (`clusterEmitters`, 584-600).

**Change.** Make the state indicators small `above: true` variants (a lock-screen dot, an
in-use dot), not changes to the main screen glow, or do the screen sprite swap now for the two
or three PC types the lab and sims use. Add a lighting block to `test_needs_sims` in slice 4 and
screenshot it lit and dark.

### M5. Chatter: the overhear hook cannot fire, and the timing does not fit (§2.4)

- "The player approaching within 3 tiles makes them stop after the current line", but
  `playerNearby` is true within 96 px, i.e. 3 tiles (`npc-needs.js:845`). So `npc_chatted` with
  `playerNearby === true`, the lab's proposed overheard-intel hook (slice 6), can only carry the
  one line being finished. Pick one: stop on approach, or let the player overhear.
- Bubble life comes from `bark-lifetime.js`, whose minimum is 5 s (`BARK_MIN_MS`, line 18).
  Three to four exchanges is six to eight bubbles, 30-40 s, against a 15 s cooler dwell
  (`test_needs_sims/scenario.json.erb:312`). Either extend the dwell while a pair chats (this
  changes timings and the T1/P report) or cap at one exchange and use a shorter bubble timing.
- Pairing at the cooler needs two NPCs there at once. In `test_needs_sims` only Sanjay has a
  `social` need and Grace a `thirst` need, so the objective may take a long run to tick.

**Change.** Default to "keep talking, lower the frequency of new lines when the player is
close", decide the bubble timing separately from barks, and give the showcase a mapping that
nudges two NPCs to the cooler (`needs: { set }`) so the live check is not left to chance.

### M6. Schedules on the needs clock replay after a reload (§2.8, OQ1)

The needs clock is in memory and starts at 0 on every load (`npc-needs.js:115`, `reset` 199;
NPC_NEEDS_SYSTEM.md §10). "The schedule cursor is derived from the clock: on reload, the NPC
skips blocks already past" only works if `atMin` is measured on something that survives a reload:
the game clock's elapsed time (`gameClock.elapsedMs()`, which the needs adapter already reads at
745). On the needs clock the stand-up replays after each reload.

The built-in `leave` routine hides NPCs through `setNPCVisible`, which **is** persisted
(`npcVisibility`, `state-sync.js:168-170`). A reload after "leave" keeps that NPC hidden and
blocked (`npcStatus.hidden`, `npc-needs.js:762, 305`), and nothing brings them back.

**Change.** Say OQ1's shared clock is game-clock elapsed minutes, not needs-clock minutes. Have
the validator warn when a leaving NPC has later objectives, conversations or mappings, and
define how a "left" NPC returns (a schedule block that unhides, or never).

### M7. Schema work is missing from every slice (§2.1-§2.9)

`affordance` is `type: object` with `additionalProperties: false`
(`scripts/scenario-schema.json:4975-4988`). `"affordance": false` (the opt-out), `affordance.chatter`,
`affordance.queue` and `affordance.stock` all fail validation today. New keys (`officePresets`,
`routines`, `routineArgs`, `chatter`, `chattiness`, `traits`, `schedules`, `schedule`,
`scheduleJitterMin`, `outputOf`, `leftBehindBy`, `pileCount`, `phoneOwner`) need schema entries
and descriptions, which is how authors find them without reading the engine.

**Change.** Add a schema line to each slice's size and to its "done" list, and allow
`affordance: false` explicitly.

### M8. Seating will put visitors in the owner's chair (§2.2 Risks, §2.4 `visit`)

A `carry` to `{ npc: "$colleague", at: "home" }` or a `visit` step stops at another NPC's
work object. `seatPreference` returns `'fetch'` for anything that satisfies `work`
(`seating.js:768`), and the "chairs at another NPC's post" guard is lifted when the stop is that
post (865-866). Sanjay delivering to `tom_pc` would sit in Tom's chair or roll one over. The
plan's description of the default is wrong (W4).

**Change.** Make routine steps carry `seat: "stand"` unless the step is the NPC's own home, and
pass that through `needsStop` (744-746) so seating can see it. Test it in `seating.test.mjs`.

### M9. Much of this is plumbing the player will not see (§2, overall)

The goal is NPCs that look alive. Several things the player sees are not in the plan:
- **Carried items are invisible.** `pickUp` hides the item (`npc-needs.js:872`); a delivery looks
  like someone walking with a `?` glyph. A held-item sprite at the hand (or a small icon) is what
  makes print-and-deliver legible.
- **No use animations.** A use is standing or sitting still. Even a two-frame "typing" or
  "pouring" loop, or a facing-plus-bob, would do more than a glow.
- **Action icons are placeholder text** (`"PC"`, `"C"`, `npc-action-icons.js:7-9, 69-72`). Real
  icons are probably the cheapest single improvement.
- **No idle variety** at the post (glance, stretch, look at phone).
- **No office sound.** No printer, kettle, coffee or ringing assets exist (only
  `phone_vibrate.mp3`), and `sound-manager.js` has no positional play (195), so a desk phone in
  another room rings at full volume.

**Change.** Add a "what the player sees" slice early (after slice 2): real action icons, a held
item sprite, a per-preset use sound at low volume and only in the player's room, and one simple
idle fidget. Track art and audio asset needs per slice.

### M10. Not every slice has the tests §3 promises

§3 says every slice ships with node tests, a `test_needs_sims` objective and a live check. §2.6
(traits) lists node and validator only; §2.10 (windows), §2.9 (desk phone) and §2.7
(consumables) have no tests section. §2.0's live check needs a 15-NPC fixture that is not
described.

**Change.** Give each of those a test block, and describe the temporary 15-NPC variant (a
generated copy, not a committed scenario).

### M11. Routine selection is all-or-nothing, and carry targets need `accepts` (§2.2, OQ9)

Need scores are per need, not per object (`npc-needs.js:453`). With OQ9's rule ("the higher
weight; ties to the plain use"), an NPC whose routine weight is higher **always** runs the routine
for that need, and one whose weight is equal **never** does. There is no variety either way.
Separately, today's carry needs a target whose `affordance.accepts` lists the tag and which is
`_free` (488-492); a colleague working at their desk holds the claim. The plan does not say
whether routine carries bypass `accepts` and how they wait for an occupied desk.

**Change.** Choose between plain use and routines with a seeded roll per leave
(`roll(npcId, 'routine:'+n)`) against the weights, so the mix is varied but deterministic. Say
that routine carries skip the `accepts` check and treat an occupied target as "wait nearby, then
place".

## 4. Minor findings

- **m1. Tick cache invalidation (§2.0).** A per-tick object list goes stale when an NPC picks up,
  drops or consumes within the same tick (`npc-needs.js:875, 889, 907`). `_itemClaimed` covers
  most cases, but to keep the log byte-identical, rebuild or patch the list on those three calls.
  Also short-circuit `_select` before `listObjects` when no need is urgent and the NPC has no
  interests (446): that is a cheaper win than sharing the list.
- **m2. Back-off target (§2.0).** "Clear the back-off for NPCs waiting on that object" has no
  meaning today: a waiting NPC has no candidate, so it does not know what it waits for. Clear all
  back-offs on any job completion, or record the blocked need's candidate set.
- **m3. Slices 1-4 do change shipped behaviour.** The back-off moves tick numbers in the lab and
  in the `test_needs_sims` README live-proof table (e.g. "283 tom job_start ... same tick Amara's
  use completes", README line 63). Say so and re-run the table.
- **m4. JS/Ruby preset parity.** A node test that parses a Ruby file is brittle. Put the table in
  one JSON file that `office-presets.js` and `validate_npc_needs.rb` both load.
- **m5. Pile sprites (§2.10).** `spriteVariants` watch globals only (`core/rooms.js:688-722`), so a
  sprite per pile level needs the count as a global, which contradicts the client-only registry.
  Either publish the count as a global (OQ3's `publishGlobal`) or use a lighting/overlay cue.
- **m6. Slice dependencies.** Traits' lock link needs `workstation-state.js`, not slice 4.
  `expectedAwayMs` needs only walk estimates and could ship with slice 2. Bubbles' `visit`
  pairing needs slice 5.
- **m7. Example inconsistency (§2.2).** The routine says `"output": "printout"` and
  `"carry": "printout"`, but the slot's tag is `printout:sanjay`. Say how a per-NPC tag is formed,
  and note that each NPC needs its own declared slot per printer (an authoring cost).
- **m8. Caught-in-minigame detection (§2.11).** "Has a minigame open on the home object" needs the
  open minigame's object id; check `MinigameFramework.currentMinigame` carries it for the PC
  minigames the lab uses, or the event will never set `inMinigame: true`.
- **m9. Bubble visibility.** Bubbles should render only for NPCs in rooms the player can see
  (not through walls into a loaded neighbour) and should dim or hide in a dark room, like the
  NPC itself. Action icons do neither today (`npc-action-icons.js:64`).
- **m10. Default chatter content.** Engine-shipped pools are content in the engine. Keep them
  generic office small talk in UK English, no work or security content, and allow a scenario to
  switch them off (`"chatter": false`). Voiced NPCs speaking silent bubbles is a mismatch to note
  for OQ2.
- **m11. Desk phone audio.** A ring is global today (no positional play, M9). Limit it to the
  player's room or scale by distance, or it gives away an off-screen beat.
- **m12. Preset workstations with no owner.** With `officePresets` on, every `pc` becomes a
  workstation. `ownerOf` returns null for unowned PCs (`workstation-state.js:49-55`), which is
  harmless, but the validator should list them so authors are not surprised.
- **m13. Queue cells and doors (§2.5).** Two default cells "beside the approach cell" for a
  machine near a door will sit in the doorway. Have the validator flag queue cells within one
  tile of a door.

## 5. Design questions the brief asked about

**Slice independence and order.** The order is mostly sound: cheap, invisible fixes first, then
data, then behaviour. Two changes: put the M3 left-post fix and the M9 "what the player sees"
work before slice 4, since slice 4's glows depend on the first and are weak without the second.
Slices 3 and 5 are not independent of the schema (M7) or of the carry outcome (B1).

**Size estimates.** Slices 1, 2, 6 and 7 look about right. Slice 3 is light once the
`listObjects` merge, schema and exact-type list are added (call it ~220). Slice 5 is light by
100-150 lines (B1, M8, M11). Slice 10 (~420) is plausible for the code but the review of every
"a job runs to completion" assumption is the real cost; the plan says this, which is good.

**Save/reload and state-sync.** Covered well for needs and activity. Gaps: slot reveals (B1),
schedule clock (M6), persisted NPC visibility after `leave` (M6), and the workstation globals,
which the plan already catches.

**Lazy-loaded rooms.** Handled honestly: nothing simulates unloaded rooms, and OQ5's opt-in
preload has a precedent. One gap: a routine whose output slot sits in a room the player has not
opened is unavailable, so the `test_needs_sims` "print/post corner" needs to be preloaded or
start open, or the slice 5 objective will not tick.

**Seating and carry claims on preemption.** `_abortJob` drops the carried item at the NPC's feet
locally only (`dropHeld`, no server call); the chair is tucked by seating noticing the stop
change (`seating.js:656-668`), not by `_abortJob`. Both are fine but the plan's wording ("chair
tucked" by `_abortJob`) should point at the right place, and a preempted carry of a **takeable**
item leaves it on the floor somewhere new, which the server does not know about. That is the
same position problem `item-drop.js` solved with `persistDrop`; reuse it or accept that a reload
puts the item back.

**Door and pathing jams.** The plan names the risk and caps steps at four. Add a step timeout
that counts as a failure for the whole routine (not just the step), so a jammed NPC goes home.

**Performance.** Fifteen NPCs is a fair target. The plan measures before and after, which is
right; correct the premise (W1) first.

**Authoring burden.** Presets, traits and default pools reduce it a lot. Routines with
`routineArgs`, per-NPC output slots and schedules add a lot. Without schema entries (M7) an
author has to read the engine. Ship one fully-annotated example per feature in the
`test_needs_sims` README.

**Security content.** The plan stays out of exploit detail. Tier 3 items (open screen, printout
on a tray, left-behind badge) are described as gameplay states, and what each yields is
scenario data. No change needed.

**Open questions.** OQ2, OQ3, OQ5, OQ6, OQ7 and OQ8 have sensible defaults. OQ1 needs the clock
named (M6). OQ9 should become a seeded mix (M11). OQ10 is right. Missing questions:
- What happens to a carried item at the target: consume, place or stow (B1)?
- Should a work use at the NPC's own desk count as leaving the post (M3)?
- Does chatter stop or continue when the player comes close (M5)?
- Are takeable output slots single beats or repeatable (B1)?
- How does an NPC that has "left" come back, and what does a reload do with it (M6)?

## 6. Verdict

**Revise.** The direction is right and the reuse analysis is mostly accurate, but the central
slice (routines with output slots) rests on a carry path that consumes its item and on a reveal
that the server will not save (B1). The preset slice would do nothing until `listObjects`
changes, and its parity test cannot pass (W2, M1). The visible-state slice needs the
own-desk `left_post` fix first and indicators that show in a lit room (M3, M4). Fix B1 and
M1-M8 in the plan, add the player-facing slice (M9), and it should be ready for round 2.
