# m03 night sofa ghost: cause and fix

Finding: SLICE6_DRESSING_LIGHTING.md, item 1 (a seated head and shoulders figure of Zainab stays drawn on the reception sofa after the act-2 night turn; her sprite reports visible false, the hide mapping says hidden; a reload clears it).

## Cause

The figure is not the sprite. It is the breathing image, a second display object (`b.img`, an `add.image` of the sprite's frame cropped to the rows above the shoulders) that `public/break_escape/js/systems/sprite-breath.js:updateBreath` draws one pixel lower than the sprite while the figure is "breathing out" (the sprite itself is cropped to the rows below the cut). Seated NPCs use it through `seating.js:updateBreath` (line 94 before the fix), pose and idle frames through `npc-poses.js:_breathe`.

`setNPCVisible(false)` (`npc-behavior.js:384`) hid only the sprite and disabled its body. The image was only ever re-hidden by `updateBreath` itself, which runs from `NPCBehavior.update`, and that returns early for a body with `enable` false (`npc-behavior.js:~913`, "Skip all behaviour for hidden NPCs"). So if the hide landed in the part of the 3.6 s cycle where the image was visible (BREATH_DOWN 0.5 to 0.9, about 40 percent of the time), the image stayed drawn at full alpha for good. Yusuf hid correctly only because his phase was in the other 60 percent. A reload rebuilds the scene without it.

## Fix

- `seating.js`: new `endNpcBreath(behavior)` (exported on `window.seating`) ends the seat's breathing holder: destroys the image and clears the sprite crop.
- `npc-poses.js`: new `NpcPoses.stopBreath(id, sprite)` does the same for pose and idle breathing.
- `npc-behavior.js` `setNPCVisible`: on hide, calls both before hiding the sprite. A later show needs nothing special: `updateSeatedNPC` (or the poses loop) creates the image again when it next breathes.

General: any NPC hidden while seated loses every drawn object. Nothing is specific to m03.

Correction (R6 review nit): pose and idle breathing images do not outlive a hide. `NpcPoses.update` runs on every postupdate whatever the body state (`npc-poses.js:431`), and `updateBreath` hides the image when the sprite is invisible (`sprite-breath.js:69-72`). The `NpcPoses.stopBreath` call in `setNPCVisible` is defensive only. The seated case was the real one, because `updateSeatedNPC` runs inside `NPCBehavior.update`, which a disabled body skips.

Commit: "Hide a seated or posing NPC's breathing image when setNPCVisible hides it".

## Test

`test/js/npc-hide-seated-breath.test.mjs` (4 tests): hiding a seated NPC destroys the image, nulls the holder and clears the crop; hiding then showing restores sprite visibility and leaves no stale holder; an unseated NPC is untouched; hiding a posing NPC ends the pose breathing image. Before the fix 3 of 4 fail (the unseated one passes); after, 4 of 4 pass. No new static import in an engine module, so no harness copy list change.

## Live proof

Server on :3091 (keyless), fresh game 6698 from new-game.rb (m03_ghost_in_the_machine). Script: `<scratchpad>/sofa/night.mjs` (the slice 6 night run: KO Ffion, badge, conference room, KO Victoria, hall call, clone_call_done true, phase act2_infiltration, back to reception).

Scratchpad: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/sofa/`

- `night-reception.png`, `night-reception-fixed.png`: after the turn, sofa empty.
- `night.log` DUMP1: after the turn, scene children within 60 px of (150,235): only Zainab's sprite (vis false, alpha 0), Yusuf's (vis false) and furniture; no Zainab Image. hiddenMap true.
- `shown-again.png`, `shown-breathing.png` (DUMP2): `setNPCVisible('zainab_hussain', true)` draws her seated on the sofa, sprite vis true, breath image created and toggling.
- `hidden-while-breathing.png` (DUMP3): hidden again at the moment the breathing image was verified visible (the case that used to leave the ghost): the zainab Image is gone, sofa empty.

The turn itself hid her in a lucky phase this time, so DUMP3 forces the failing case deterministically (hide while the image is visible).

## Suites

`bin/test-js`: 736 files passed, 0 failed (includes the new test). `bin/rails test`: 3186 runs, 50670 assertions, 0 failures, 0 errors, 4 skips (LabPhysicalPentestSecretsTest, known flaky, passed this run). Server on :3091 (PID 3063530) killed by PID.

## Handover

Complete; nothing outstanding.

## Follow-up: a hidden sitter releases its chair (R6 minor and nit 1)

Finding: `setNPCVisible(false)` left `behavior._seat`, the chair's place (`chair._places`, `seatedBy`) and the `window.officeTypists` entry in place. The chair looked empty but `trySit` refused it (`seating.js` "taken: nothing happens"), and a roomTone room would keep its typing loop for nobody.

Fix: on hide, `setNPCVisible` calls `seating.unseatNPC(behavior, { instant: true })` (`npc-behavior.js`, hide branch). `unseatNPC` takes `opts.instant`: the NPC lands on its stand spot at once (no step, no chair push, because a hidden body cannot walk). Everything the normal stand-up clears goes with it: breath image and crop, place, officeTypists, saved collider. A plain seated NPC is marked `_seatTried`, so it reappears standing and stays standing. A needs-seat NPC has `_seatTried` cleared, but that flag is read only on the plain seated branch; see the R8 follow-up for what actually gates a needs re-sit. The needs system already treats a hidden NPC as absent (`st.hidden`), so nothing there thinks it is mid-use; a use that was under way is taken up again by the seat routine on show. `endNpcBreath` stays exported, no longer called by `setNPCVisible`.

Tests (`test/js/npc-hide-seated-breath.test.mjs`, now 6): a real `seatNPC` on a stub sofa. Hide frees the place, nulls `_seat`, drops the typist; another NPC can then sit; show leaves the NPC standing with the collider restored. Test 2 of the earlier version (null holder after a show) is replaced by this post-show state, because a shown NPC is no longer seated and has no breath to rebuild. Before the fix 3 of the new tests fail, after 6 of 6 pass.

Other missions: `test_seating` and `lab_physical_pentest` have seated NPCs and hide none; m02's hidden NPC is not seated. Left alone: the `sprite.once('destroy')` listener pile-up (`sprite-breath.js:81`), not a one-line safe fix.

Live proof (keyless server :3091, fresh game 6709 from new-game.rb, the night turn script from the sofa fix). Scratchpad `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/seatrelease/` (`night.mjs`, `night.log`):

- After the turn Zainab is hidden and unseated (`seat` false, sofa `_places` empty, officeTypists empty). `night-reception.png`, `night-sofa-before-sit.png`: sofa empty.
- The player walked to the sofa and sat (`PLAYER-SIT`: seated, place 0 taken by "player"). `player-on-sofa.png`. Before the fix that click did nothing for a full chair; Zainab's sofa has two places, so the unit test with another NPC is the sharper proof for a single seat.
- Stood up and showed Zainab: she is a needs NPC, so her routine sat her back down on the sofa (`ZAINAB-SHOWN`, `zainab-shown.png`, `zainab-shown-later.png`), at her usual seat, not floating, breath image built again by the normal update.

Suites: `bin/test-js` 736 passed, 0 failed. `bin/rails test` 3186 runs, 50670 assertions, 0 failures, 0 errors, 4 skips. `seating.test.mjs` and the other seat tests are in the JS run. Server :3091 (PID 3682193) killed by PID.

## R8 follow-up (R8-m1, m2, m3)

R8-m1. The earlier write-up credited `_seatTried` for a shown needs NPC sitting again. It does not gate that: a needs NPC returns from `updateNeedsSeat` before the plain branch. The gate is `_seatStopKey` plus `_seatTriedAt`, the retry count and `_seatGaveUp`. After a hide the stop key still matched, so a stop that is not a post never retried and a post stop waited `POST_SEAT_RETRY_MS` and spent a retry. The instant unseat of a needs sitter (`seating.js` `unseatNPC`) now clears `_seatStopKey`, `_seatTriedAt`, `_seatRetries`, `_seatGaveUp` and `_seatGaveUpAt`, so the shown NPC takes the new-stop path and sits at once with its retries untouched. The `_seatTried` line is left as it was (it only matters for plain sitters).

R8-m3. A needs NPC hidden mid-fetch kept `chair.seatedBy`, and a hidden NPC's update never ran to time the fetch out. A seat move in its step stage (a normal stand-up in progress) was also left behind. When an instant unseat finds no seat it now ends a seat move of any stage (`endSeatMove`) and a fetch (`cancelFetch`, which frees the chair if the NPC holds it; a walk to the chair is cancelled too).

R8-m2. `test/js/npc-hide-seated-breath.test.mjs` is now 12 tests. The stub has an open stand grid (`pathfindingManager.buildWorldGrid`), so the instant landing is asserted: feet off the seat, on a grid cell centre, no step move, collider restored. New: a needs sitter's gate state after hide and show (stop key null, no retry spent, not given up); a needs sitter lands on its work spot; a mid-fetch hide frees the reservation (and leaves another NPC's reservation alone); a hide during a step-off ends the step move. The re-sit itself is asserted as gate state, not by driving `updateNeedsSeat`, which needs the whole needs system; the live check covers the re-sit. Each fix was reverted locally to check: without m1 the gate test fails; without m3 the mid-fetch and step-move tests fail.

Live check (keyless server :3091, fresh game 6718 from new-game.rb, `night.mjs` rerun, scratchpad `seatrelease2/`): the night turn leaves Zainab hidden and unseated, sofa places empty, no typists. After the player sat and stood, showing Zainab seated her again within one second of wall time (first seated reading at 503 ms; needs clock 83250), at her usual seat, and she stayed there.

## R9 follow-up (R9-m1, n1)

R9-m1. An instant unseat that finds no seat now also resets the needs re-sit gate when it ends a needs seat move or a fetch (`resetNeedsSeatGate` in `seating.js`, shared with the seated branch), so a needs NPC hidden mid walk, roll-in or fetch sits at once on show.
R9-n1. `npc-hide-seated-breath.test.mjs` is now 13 tests; the new one hides a needs NPC mid walk and asserts the move ended, the chair freed and the gate reset (it fails with the reset removed).
