# m03 night sofa ghost: cause and fix

Finding: SLICE6_DRESSING_LIGHTING.md, item 1 (a seated head and shoulders figure of Zainab stays drawn on the reception sofa after the act-2 night turn; her sprite reports visible false, the hide mapping says hidden; a reload clears it).

## Cause

The figure is not the sprite. It is the breathing image, a second display object (`b.img`, an `add.image` of the sprite's frame cropped to the rows above the shoulders) that `public/break_escape/js/systems/sprite-breath.js:updateBreath` draws one pixel lower than the sprite while the figure is "breathing out" (the sprite itself is cropped to the rows below the cut). Seated NPCs use it through `seating.js:updateBreath` (line 94 before the fix), pose and idle frames through `npc-poses.js:_breathe`.

`setNPCVisible(false)` (`npc-behavior.js:384`) hid only the sprite and disabled its body. The image was only ever re-hidden by `updateBreath` itself, which runs from `NPCBehavior.update`, and that returns early for a body with `enable` false (`npc-behavior.js:~913`, "Skip all behaviour for hidden NPCs"). So if the hide landed in the part of the 3.6 s cycle where the image was visible (BREATH_DOWN 0.5 to 0.9, about 40 percent of the time), the image stayed drawn at full alpha for good. Yusuf hid correctly only because his phase was in the other 60 percent. A reload rebuilds the scene without it.

## Fix

- `seating.js`: new `endNpcBreath(behavior)` (exported on `window.seating`) ends the seat's breathing holder: destroys the image and clears the sprite crop.
- `npc-poses.js`: new `NpcPoses.stopBreath(id, sprite)` does the same for pose and idle breathing.
- `npc-behavior.js` `setNPCVisible`: on hide, calls both before hiding the sprite. A later show needs nothing special: `updateSeatedNPC` (or the poses loop) creates the image again when it next breathes.

General: any NPC hidden while seated, posing or idling with breath loses every drawn object. Nothing is specific to m03.

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
