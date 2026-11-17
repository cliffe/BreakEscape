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

Fix: on hide, `setNPCVisible` calls `seating.unseatNPC(behavior, { instant: true })` (`npc-behavior.js`, hide branch). `unseatNPC` takes `opts.instant`: the NPC lands on its stand spot at once (no step, no chair push, because a hidden body cannot walk). Everything the normal stand-up clears goes with it: breath image and crop, place, officeTypists, saved collider. A plain seated NPC is marked `_seatTried`, so it reappears standing and stays standing. A needs-seat NPC has `_seatTried` cleared (as `updateNeedsSeat` does after any unseat), so its normal routine can walk it back to the chair. The needs system already treats a hidden NPC as absent (`st.hidden`), so nothing there thinks it is mid-use; a use that was under way is taken up again by the seat routine on show. `endNpcBreath` stays exported, no longer called by `setNPCVisible`.

Tests (`test/js/npc-hide-seated-breath.test.mjs`, now 6): a real `seatNPC` on a stub sofa. Hide frees the place, nulls `_seat`, drops the typist; another NPC can then sit; show leaves the NPC standing with the collider restored. Test 2 of the earlier version (null holder after a show) is replaced by this post-show state, because a shown NPC is no longer seated and has no breath to rebuild. Before the fix 3 of the new tests fail, after 6 of 6 pass.

Other missions: `test_seating` and `lab_physical_pentest` have seated NPCs and hide none; m02's hidden NPC is not seated. Left alone: the `sprite.once('destroy')` listener pile-up (`sprite-breath.js:81`), not a one-line safe fix.

Live proof (keyless server :3091, fresh game 6709 from new-game.rb, the night turn script from the sofa fix). Scratchpad `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/seatrelease/` (`night.mjs`, `night.log`):

- After the turn Zainab is hidden and unseated (`seat` false, sofa `_places` empty, officeTypists empty). `night-reception.png`, `night-sofa-before-sit.png`: sofa empty.
- The player walked to the sofa and sat (`PLAYER-SIT`: seated, place 0 taken by "player"). `player-on-sofa.png`. Before the fix that click did nothing for a full chair; Zainab's sofa has two places, so the unit test with another NPC is the sharper proof for a single seat.
- Stood up and showed Zainab: she is a needs NPC, so her routine sat her back down on the sofa (`ZAINAB-SHOWN`, `zainab-shown.png`, `zainab-shown-later.png`), at her usual seat, not floating, breath image built again by the normal update.

Suites: `bin/test-js` 736 passed, 0 failed. `bin/rails test` 3186 runs, 50670 assertions, 0 failures, 0 errors, 4 skips. `seating.test.mjs` and the other seat tests are in the JS run. Server :3091 (PID 3682193) killed by PID.
