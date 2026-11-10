# Office Life plan: adversarial review, round 2

Reviewed: `docs/achitechture/OFFICE_LIFE_PLAN.md` at commit 3543e225a (revised after
`OFFICE_LIFE_PLAN_REVIEW_R1.md`). Read-only review; no code or plan edits. Paths are relative to
`public/break_escape/js/` unless they start with `scenarios/`, `app/`, `scripts/`, `test/` or
`docs/`.

Tally: **R1 findings: 21 of 25 closed, 1 partly closed, 3 not closed; all 9 corrections closed.
New: 0 blockers, 10 major, 14 minor.** Verdict: **revise** (end of file).

## 1. Round-1 findings against the code

| R1 | Status | Evidence and what is left |
|---|---|---|
| **B1** carry consumes; reveal not saved; slots one-shot | **Partly closed** | The three facts are answered: `onDeliver` outcomes, reveals on engine-owned globals (globals are merged before rooms reveal, `core/game.js:1621-1624`; `revealRoom` checks them, `core/rooms.js:3023`), slot pools and the single-beat rule. The server facts in 1.1 are right (`games_controller.rb:2183-2188` permits only `opened, on, brightness, screen_state`; `find_accessible_item` 1869-1958 ignores `revealOnGlobal`; `game.rb` 454-490 checks `item_in_room?`). Four gaps reopen it: after a reload a revealed slot can never be shown again (N1); readable `notes` slots are removed on first read whether takeable or not (N2); `place`/`stow` are undefined for the parcel, the plan's own example (N3); the placed sprite's room bookkeeping does not match what the pickup paths read (N4) |
| **M1** parity test cannot pass | **Not closed** | The override list misses the three PCs (no `useFrom` today, preset `{0,1}`) and the `workstation: true` the preset adds (N8). The "stub world for `test_needs_sims`" the test runs in does not exist, and the existing stub ignores `useFrom` (N7) |
| **M2** prefix matching | Closed | Exact types, `officeType`, exclusions for `takeable` and `lockType`. Showcase types match the table (`pc`, `laptop`, `coffee_station1`, `qdc_fridge1`, `microwave1`, `water_cooler1`, `leather_sofa1`; `scenarios/test_needs_sims/scenario.json.erb` 77-340) |
| **M3** own-desk use fires `npc_left_post` | Closed | Semantics in 2.11 are right and match `npc-needs.js:497-525, 660-669`. One visible side is missed (N10). Grep check of listeners in section 4 |
| **M4** glows will not read in a lit room | **Not closed** | Moving to `above: true` is right, but a variant replaces the emitter's only glow, so "the main screen glow does not change" is false (N5) |
| **M5** overhear and bubble timing | Partly closed | Overhear radius, own bubble timing and no dwell stretch are sound. Pairing still needs two `using` jobs on one object, and both coffee stations the plan pairs at have capacity 1 (N6) |
| **M6** schedules replay; `leave` persists | Closed | Game-clock elapsed minutes, `arrive` blocks, presence re-derived on load, validator warning |
| **M7** schema | Closed | Every slice has a schema line. Small gaps in m7 below. Only `affordance` is closed (`scripts/scenario-schema.json:4976-4988`); `item` and `npc` definitions have no `additionalProperties: false`, so the other keys are for discovery, not validation |
| **M8** visitors in the owner's chair | Closed | `seat: "stand"` through the job into `needsStop`, plus "another NPC's home stands". The second rule is a behaviour change for existing scenarios that the plan does not list (m14) |
| **M9** plumbing the player won't see | Closed in the plan | Slice 3 exists. Engine fit has problems: the bob (N9), sound reuse and ambience (m1, m2), icons for carries (m3), follow lag (m4), glance (m5) |
| **M10** missing test blocks | Closed | Every section now has node, showcase and live tests. Slices 1 and 4 lean on a harness that does not exist (N7) |
| **M11** routine choice; carry `accepts` | Closed | Seeded roll, `plainWeight`, carries skip `accepts` and the claim, side-cell delivery. `leaveCount` is not defined (m10) |
| m1-m7, m9-m13 | Closed | As the plan's section 5 says; checked against `npc-needs.js:446, 875, 889, 907`, `core/rooms.js:688-722`, `workstation-state.js:49-55` |
| m8 minigame object id | Closed (deferred) | The plan checks it at the start of slice 2 with a fallback at `interactions.js:792`; acceptable |
| W1-W9 | Closed | Each correction is in the text, and the line numbers in 1.1 match the code |

## 2. New major findings

### N1. After a reload, a revealed slot can be stowed but never shown again (2.2 Part A, 2.10)

`hideUntilReveal` registers the reveal listener, and it only runs for objects whose global is
**not** true when the room reveals (`core/rooms.js:2955-2965, 3023`). After a reload with a slot
revealed, `revealRoom` shows it and registers nothing. The orphan rule then stows it (hidden,
global false), and the next `revealOutput` sets the global true with no listener to show it.
The slot stays invisible, `describe` reports it not `pickable` (`npc-needs.js:722`), its global
stays true, so it is never "free" again and the pool shrinks by one per reload. The same applies to
`leftBehindBy` items (2.10). The plan's hide path ("the listener also handles `false`") has the
same hole, since there is no listener to extend.

A second gap: `pickUp` deletes the sprite from `rooms[roomId].objects` (`npc-needs.js:875`). A
slot that was carried and then stowed must be put back under its key, or `findSprite` and
`revealOutput` ("free = loaded") never see it again.

**Change.** For objects with `outputOf`, `leftBehindBy` or `revealCycles`, register the listener
at room creation whatever the global's value (and handle both `true` and `false` in it), or have
`revealOutput` and `stow` call show and hide directly. `stow` re-inserts the sprite into its
declared room's `objects` under its original key. Add a node or rooms test: reveal, reload with
the global true, stow, reveal again, sprite visible.

### N2. Readable `notes` slots are consumed on first read, takeable or not (2.2 Part A)

The plan's slot example is `"type": "notes"`, and it relies on "non-takeable readable slots,
which cycle for ever". Any readable `notes*` object opens the notes minigame
(`interactions.js:1715-1750`), whose auto-add removes the note from the scene, sets
`active = false` and calls `removeItemFromRoom` on the server (`minigames/notes/notes-minigame.js:235-271, 707-709`),
whether or not it is takeable. So a "non-takeable" printout disappears for good the first time the
player reads it. The plan's "free" test (global not true, not destroyed, not in inventory) then
still counts it free, and the next reveal shows a sprite that is inactive and absent from the
server.

**Change.** Cycling slots must not be `notes*` with the default read path: use
`"readDisplay": "gameDisplay"` (reads in place, `interactions.js:1699-1706`) or a non-notes
type, and have the validator reject a cycling slot that would be consumed on read. Add
`active !== false` and "not in `objects_removed`" to the free test. State in 2.2 that a slot the
player reads through the notebook is a single beat, like a taken one.

### N3. `place` and `stow` are undefined for items that are not declared slots (2.2 Part A)

The plan's example puts `onDeliver: "place"` on `amara_pc`, and slice 7's visible change is "the
parcel stays on Amara's desk, then is filed away". The parcel is a player drop: it lives in the
server's `objects_added` at the drop point (`item-drop.js:11-16, 41-60`), with no declared
position and no reveal global. `stow` ("back to its declared position, global false") has nothing
to go back to. With `place`, the server still holds it at the drop point, so after a reload it
reappears there and Amara fetches it again; today `consume` removes it server-side
(`npc-needs.js:884-892`). The plan's own claim that the parcel beat keeps a byte-identical
`consume` log contradicts setting `place` on `amara_pc`.

**Change.** Define the outcomes by item kind: a slot (declared, with `revealOnGlobal`) can
`place`/`stow`; any other item `place`s client-side and, when `placeSeconds` ends, is consumed
(server removal), so a reload cannot duplicate it. Make `onDeliver` a map by tag
(`{ "post": "consume", "printout": "place" }`, m8) and keep the parcel on `consume` in the
showcase.

### N4. The placed sprite's room bookkeeping does not match what the pickup paths read (2.2 Part A)

The plan keeps the declared room in a new `sp._declaredRoomId`. Nothing reads that field. The
pickup path only syncs the server removal when the sprite is registered as
`rooms[currentPlayerRoom].objects[sprite.objectId]`, and it then uses `sprite.roomId`
(`systems/inventory.js:510-533`); the notes path also uses `this.item.roomId`
(`notes-minigame.js:252-271`). `dropHeld` overwrites `sp.roomId` with the NPC's room
(`npc-needs.js:907`). For a printout placed on a desk in another room (the lab case), the item
would either miss the server removal or be removed from the wrong room, and keyboard interaction
may not find it if it is registered under the wrong room.

**Change.** On `place`, register the sprite under the room it now sits in, keyed by its object id,
and keep `sp.roomId` as the **declared** room (the one the server knows it in); do not overwrite
it in the place path. Test a cross-room place and pickup: one `remove_object` call naming the
declared room.

### N5. An `above` indicator replaces the screen glow; it cannot sit beside it (2.3, slice 5)

Each emitter has one glow image and one light-map stamp (`systems/lighting.js:539-553, 1011-1050`).
A matching variant is merged over the base and becomes the emitter's whole definition
(`resolveEmitters`, 559-583). A small `above: true` variant offset to a corner therefore turns the
screen's glow into an 8 px dot, so "the main screen glow does not change" is false. The ransom
variant cited as precedent also replaces the glow.

**Change.** Add an indicator layer to emitters: an optional second glow per emitter, driven by its
own variant list (`indicators: [...]`), drawn on the `above` path. That is maybe 40-60 lines in
`lighting.js`, plus a `lighting-room-variants` test that the base glow is unchanged while an
indicator shows. Re-size slice 5 to about 200.

### N6. Chat pairing cannot happen at either coffee station (2.4, slice 8)

Pairing needs two NPCs `using` the same object. `office_coffee` is "one person at a time"
(`test_needs_sims/scenario.json.erb` 112-117, no `capacity`), and the lab's `coffee_station`
has no `capacity` either (`lab_physical_pentest/scenario.json.erb:909`), so both are capacity 1.
The `coffee` pool, the showcase's "pools for the cooler and office coffee" and slice 8's lab
payoff ("chatter at `coffee_station` the player can overhear") can never fire. Only the kitchen
cooler (capacity 2) can pair.

**Change.** Either pair NPCs who are near the same object in any job phase (one `using`, one
queued or waiting within 1.5 tiles), which fits slice 10's queues, or give the lab station
`capacity: 2` and accept the timing change for Chris and Melanie (re-run the lab beats). Until
then, drop the coffee pairing from slice 8's tests and lab payoff.

### N7. The `test_needs_sims` stub world that slices 1 and 4 test against does not exist (2.0, 2.1)

Slice 1 asserts "the decision log for `test_needs_sims`'s stub world is byte-identical"; slice 4's
parity test runs a "generated copy" in one. No test loads `test_needs_sims`
(`grep` of `test/` and `scripts/`); `test/js/npc-needs.test.mjs` has its own `office()` fixture.
Building one means rendering the `.json.erb`, and the PCs and laptops have no `position` (they
are placed from the room map at runtime), so coordinates must be invented. The existing stub's
`approachCell` ignores `useFrom` (`npc-needs.test.mjs:29`), so a parity test there cannot see the
`useFrom` differences the override list is about.

**Change.** Budget a fixture: a hand-written node fixture shaped like `test_needs_sims` (five NPCs,
their needs, the objects with fixed coordinates and `useFrom`), and a stub `approachCell` that
honours `useFrom`. Say that slice 1's byte-identical check runs on that fixture and the existing
`office()` one, and make the live README table the check for the real scenario.

### N8. The parity override list misses the PCs (2.1)

`amara_pc`, `tom_pc` and `sanjay_pc` have no `useFrom` (`test_needs_sims/scenario.json.erb`
83, 92, 101). The `desk_pc` preset gives `{0,1}`, so in the live game `approachCell` uses
`findNearestWalkableWorldCell(x, y+32, 1)` instead of `(x, y, 3)` (`npc-needs.js:792-804`). That
moves where each NPC stands at its PC, and since the home is that approach cell
(`_resolveHome`, 646-659), it moves the posts too. The preset's `workstation: true` also makes
all three PCs workstations, which publishes `<id>_screen_locked`/`_owner_away` and emits
`workstation_owner_left` on every leave from slice 4 on. "The README live-proof table is
unchanged" does not hold.

**Change.** Add `useFrom: null` for the three PCs to the override list (or measure and adopt the
new posts deliberately), and list the workstation side effect as a behaviour change of slice 4.

### N9. The typing bob is overwritten every frame (2.12, slice 3)

A seated NPC is re-posed every frame: `updateNeedsSeat` calls `poseSprite` (`seating.js:849`),
which moves the sprite back if its rounded position differs (604). A 1 px bob applied from a
separate module is undone on the next frame (or fights it, depending on update order). A Phaser
sprite has no separate "display offset"; for a standing NPC (the coffee dip), moving `sprite.y`
moves the arcade body with it.

**Change.** Put the bob inside seating: `poseSprite` takes a `dy` that the visuals module sets
(seated only, collisions are already off there, 636). For standing dips, change the frame or
tint instead of the position, or accept a body-moving 1 px and say so.

### N10. An own-desk use still stands the NPC up and sits it down again (2.11, slice 2)

The plan says "Seating already keeps an NPC seated through an own-desk use". `needsStop` returns a
stop only for `idle && atPost` or `job && phase === 'using'` (`seating.js:739-748`). During the
wind-up and the `goto_target` tick, it returns null, so a seated NPC is unseated, its chair tucked
(`unseatNPC`, 652-675; `updateNeedsSeat`, 827-830), and then re-seated with the chair pulled out
again when `using` starts. Today this lasts the 700 ms wind-up plus a tick. With slice 2's "no
wind-up" it is still at least one 250 ms tick: a visible hop on every own-desk work use, in the
slice whose visible change is that staff no longer react when they only turn to their own PC.

**Change.** In slice 2, have `needsStop` return the home stop (`at:<homeId>`, `post: true`) for an
at-post job in any phase. About 5 lines; add a `seating.test.mjs` case that an own-desk job never
yields a null stop.

## 3. New minor findings

- **m1. Room ambience already exists (2.12).** Rooms take `ambientSound` and `ambientVolume`,
  faded by door adjacency (`core/rooms.js:3129-3176`, schema `scripts/scenario-schema.json:4004`).
  The plan's new room `ambience` key on `playAmbient` duplicates it. Use the existing key; only the
  office room-tone asset is new **[approval]**.
- **m2. Sound reuse (2.12).** The UI clicks are loaded as `ui_click_1`-`ui_click_6`
  (`systems/sound-manager.js:60-64`), not `GASP_UI_Clicks_*`, and they are the player's own UI
  clicks, so NPC typing in those sounds will read as interface feedback. `play` reuses one Phaser
  sound per key and sets its volume (195-225): a quiet NPC `drink_gulp` restarts the player's own
  consumable gulp. Have `playAt` use `scene.sound.play(key, { volume })` one-shots. For room
  scoping reuse `lightingSystem.hearing(roomId)` (`systems/lighting.js:706-711`: own room 1,
  through a door 0.4), which already exists for the tube clicks.
- **m3. Icons for carries (2.12).** `pickIcon` returns `curiosity` for every carry
  (`systems/npc-action-icons.js:25`), so the "post, printouts: `mail-new`" row needs a tag lookup
  (`icons[job.tag]` before `curiosity`). It is also keyed on the first `satisfies` only (43),
  so the cooler shows thirst for a social use.
- **m4. Follow lag (2.12).** Listeners on the scene `update` event run before `scene.update()`,
  where NPCs move and set depth (`core/game.js:2404-2419`, `npc-behavior.js:2240-2249`). A held item
  following there is a frame behind at walking speed. Use the scene's `postupdate` event.
- **m5. The glance rarely shows in the showcase (2.12).** It is for standing NPCs only, and desk
  staff sit (`seatPreference` gives `fetch` for work, `seating.js:768`). Allow a seated swivel
  turn (the chair already re-faces for the player, 834-846), or say the glance is for standing
  posts.
- **m6. Rosa has a social need (2.4).** "Today only Sanjay has a social need" is wrong:
  Rosa has `social` (`test_needs_sims/scenario.json.erb` ~364). The proposed mapping works for both.
- **m7. Schema gaps.** `officeVisuals` (2.12), `deliverFrom` (2.2 Part B) and
  `officeLife.preloadRooms` (OQ5) are not in any slice's schema list.
- **m8. `onDeliver` per object, not per tag (2.2 Part A).** One target can accept several tags
  with different outcomes (Amara's parcel and printouts). Allow a map by tag (see N3).
- **m9. Orphan stow has no target (2.2 Part A).** "A one-off carry candidate that ends in `stow`"
  from the tray back to the tray has no `targetId` for `_moveForPhase`. Model it as a `use` of the
  slot with outcome `stow`.
- **m10. `leaveCount` is undefined (2.2 Part B).** The needs state has no leave counter
  (workstation-state's `leaves` is separate, `workstation-state.js:113-115`). Add one to the needs
  state; it resets on reload, which is fine because the roll stays seeded.
- **m11. Lab line drift.** The plan cites lab lines 748-757, 858 and 867; they are now 755-759
  (Melanie's needs), 865 (`locksScreenOnLeave: false`) and 874 (the `owner_away` variant).
- **m12. Generated 15-NPC copy in a shared tree (2.0).** Writing `scenarios/test_needs_sims_15/`
  in the shared working tree will show as untracked to every other agent and can be swept into a
  commit. Generate it in a worktree, or add the path to `.gitignore` in the slice.
- **m13. Held item hidden while its NPC is visible (2.12).** "Held items only for NPCs in the
  player's current room" hides a parcel while the carrier stays visible through an open door. Tie
  the item's visibility to the NPC sprite's, and keep the room rule for icons, bubbles and sound.
- **m14. "Another NPC's home stands" changes existing scenarios (2.2 Part B).** It applies to every
  job, not just routines, so a plain work use at a colleague's free desk (README finding F: Sanjay
  at `tom_pc`) stops sitting. List it among slice 9's behaviour changes, or limit it to routine
  steps.

## 4. Would the slice-2 fix break existing listeners?

Grep of every scenario for `npc_left_post`, `npc_returned_post`, `_owner_away`,
`workstation_owner_left/returned`, `workstation_accessed` and `npc_action_windup` (ink included):

| Scenario | Listener | Effect of the fix |
|---|---|---|
| `test_npc_needs` | `npc_left_post:clerk` → `clerk_left_desk` (line 144); globals `clerk_pc_owner_away`, `finder_pc_owner_away` (24, 27) | None: the clerk has only `caffeine` (139), so every leave is real |
| `test_needs_sims` | `npc_returned_post:amara` / `:tom` → `see_back_at_desk` (203-204) | Ticks only after a real trip. Amara's first coffee comes at about 0.9 min (caffeine 20/min from 58 to 40), so it still ticks early. The README table's `430 tom returned_post` / `432 amara returned_post` rows may change; the plan says so |
| `lab_physical_pentest` (grep only) | `workstation_accessed:staff_pc_2` (764); `staff_pc_2_owner_away` variant (874); `staff_pc_screen_locked` variant (794) | The intended fix: the Melanie capture and the "locked before he walked off" text no longer show while the owner sits at the PC. The keylogger beat keys on `npc_used:staff_pc` (567), which still fires |
| Tests | `npc-needs.test.mjs` 111-112, 329-342 (clerk, caffeine only); `workstation-state.test.mjs` 107-109 (handlers called directly) | None |

No ink file listens to these events. The fix does not break a listener. It does change one thing
the plan should name: `leaves` in workstation-state (`workstation-state.js:113-115`) is the salt
for `lockChance` rolls, so fewer counted leaves shift which leave locks for any `lockChance`
workstation. No shipped scenario uses `lockChance` today, so nothing moves now.

## 5. The new visible layer and the other design questions

**Does the engine support slice 3 as described?**

| Piece | Engine support | Verdict |
|---|---|---|
| Sprite icons from existing art | All named assets exist at the stated sizes (`coffee_cups1` 21×20, `office-misc-cup` 11×11, icons `talk`, `mark-question`, `clipboard`, `mail-new`). Icons are a text object today (`npc-action-icons.js:69-72`); swapping in an image with a backing is straightforward, and a one-off runtime `scene.load` with a text fallback until it lands is workable | Supported; needs the tag lookup (m3) |
| Carried item in hand | `pickUp` hides the sprite and drops it from the room's `objects` (`npc-needs.js:870-875`) but keeps it alive, so it can be shown and moved. NPC depth is `bottomY + 0.5`, set every frame (`npc-behavior.js:2240-2249`); "depth just above / just below" is a fixed ± offset from it | Supported; use `postupdate` (m4), visibility tied to the NPC (m13) |
| Typing bob and dip | There is no animation for it; the bob is a position nudge, and seating re-poses seated NPCs every frame | Not as described (N9) |
| Idle glance | `faceWorldPoint` exists (`npc-behavior.js:2518`); idle NPCs with `facePlayer` re-face the player when near, which the plan excludes | Supported; rarely seen in the showcase (m5) |
| Room-local use sounds | `play` is non-positional and shares one instance per key; there is no room scoping in the sound manager. `lighting.hearing` already scopes by room with door attenuation | Supported with a small helper; reuse `hearing`, use one-shots (m2) |
| Ambience | Already exists per room (`ambientSound`) | Duplicate (m1) |
| Dark-room rule | `LightingSystem.roomLevel(state)` (`lighting.js:762`) gives a level per room; a room without `lighting` counts as lit | Supported |

**Slice independence and order.** The order is sound: the own-desk fix before indicators, the
visible layer before the slices that need it, carry outcomes before routines. Three points:
- Slice 2 should carry the `needsStop` change (N10), or its visible change does not happen.
- Slice 5's indicator layer (N5) is engine work in `lighting.js`, not data; it does not affect
  order but moves the size.
- Slice 8 claims a lab payoff that depends on queues (slice 10) or a capacity change (N6). Either
  move the coffee half of chatter after slice 10 or drop it from slice 8.

**Size estimates.** Slices 1, 2, 4 and 6 look right (add ~5 to slice 2 for N10). Slice 3 at ~275 is
fair once the bob moves into seating (~10 more in `seating.js`). Slice 5 is more like ~200 with an
indicator layer (N5). Slice 7 needs ~50-70 more for N1-N4 (listener at creation, re-insert on
stow, free test, non-slot outcome rule, room bookkeeping). The fixture for N7 is test code, so it
is outside the sizes, but it is real effort (perhaps 150 lines) that slices 1 and 4 depend on;
name it.

**Tests per slice.** Every slice now has a node test, a showcase objective and a live check. Gaps:
slices 1 and 4 need the fixture in N7; slice 7 needs the reload-then-cycle test (N1), the read-a-
cycling-slot test (N2) and a cross-room place-then-pickup test (N4); slice 5 needs a test that the
base glow is unchanged while an indicator shows (N5); slice 2 needs the seating case (N10).

**Performance with many NPCs.** The visible layer is per-frame but cheap: one sprite follow per
carrier, at most four bubbles, a room check per icon (`currentPlayerRoom` and one lighting state
read). Slice 3 does not depend on slice 1, so until slice 1 lands the icon `targetInfo` scan still
walks every room's objects per frame for each NPC with a job (`npc-action-icons.js:36-48, 64-67`);
with sprite icons that is the same cost as today. No concern at fifteen NPCs once slice 1 is in.

**Authoring burden.** An author can use presets, traits, chatter and the visible layer from the
README example and the validator alone. Reveal slots are the hard part: an author has to know that
a cycling slot must not be a `notes` object read through the notebook (N2), that each slot needs
its own engine-owned global, and that a parcel-like drop behaves differently from a slot (N3). The
validator rules in N2 and a slot section in the README with one cycling and one takeable example
cover that.

## 6. Plan claims that are wrong

| # | Plan says | Code says |
|---|---|---|
| C1 | 2.3: "the main screen glow does not change"; indicators are "about 40 lines of data" | One glow per emitter; a variant replaces it (`lighting.js:539-583`). Needs an indicator layer (N5) |
| C2 | 2.11: "Seating already keeps an NPC seated through an own-desk use" | `needsStop` is null outside `using`, so the NPC stands and re-sits (`seating.js:739-748, 827-830`) (N10) |
| C3 | 2.12: the bob "builds on" seating's offset | `poseSprite` resets the position every frame (`seating.js:604, 849`) (N9) |
| C4 | 2.2 Part A: "non-takeable readable slots, which cycle for ever" | A readable `notes*` object is removed on first read, client and server (`notes-minigame.js:235-271, 707-709`) (N2) |
| C5 | 2.2 Part A: the hide path extends "the `hideUntilReveal` listener" | That listener exists only for objects hidden at reveal time (`core/rooms.js:2955-2965`) (N1) |
| C6 | 2.2 Part A: `sp._declaredRoomId` makes the player's pickup remove it from the right room | Pickup reads `sprite.roomId` and the current room's `objects` map (`inventory.js:510-533`) (N4) |
| C7 | 2.2 Part A visible change: "the parcel on Amara's desk, then is filed away" | The parcel is a player drop with no declared spot or global; `stow` cannot apply (`item-drop.js:41-60`) (N3) |
| C8 | 2.1 Tests: "the README live-proof table is unchanged" | Preset `useFrom` moves the three PCs' approach cells and posts; the preset makes them workstations (N8) |
| C9 | 2.0, 2.1 Tests: "the decision log for `test_needs_sims`'s stub world" | No such stub world exists (N7) |
| C10 | §3 slice 8: "Lab: chatter at `coffee_station` the player can overhear" | Capacity 1; no pairing (N6) |
| C11 | 2.12: a new room `ambience` key | `ambientSound` exists (m1) |
| C12 | 2.4: "today only Sanjay has a social need" | Rosa has one too (m6) |
| C13 | 2.11, §5 M3 row: lab lines 748-757, 858, 867 | Now 755-759, 865, 874 (m11) |

## 7. Verdict

**Revise.** Round 1's blocker is answered in design, and the slice order, the own-desk fix and the
visible layer are right. The carry-and-slot slice still fails in four concrete ways once a reload,
a read or a player drop is involved (N1-N4); each has a small, local fix. The indicator slice needs
an engine change it describes as data (N5), coffee chatter cannot pair (N6), and slices 1 and 4 test
against a harness that does not exist (N7, N8). Fold in N1-N10 and the wrong claims in section 6;
none of it calls for a change of direction, and round 3 should then be a check of those edits.

