# Lab UX, interface items: build log (2026-11-12)

The interface half of the user's answer q53 (docs/handover/2026-11-11_USER_DECISIONS.md), plus q55 (d). Branch `build/lab-ux-ui`. The other q53 items (keying event at a badge reader, `noticeRadius`, the player not shoving routed NPCs) are in the lab UX NPC build.

## What changed

### (a) Pickup toasts for every item type
- `systems/inventory.js`: `pickupToast(data)` and `announcePickup(sprite, result)` (also `window.announcePickup`). A world pickup that adds a new slot says "Picked up <name>" (info, 2.5 s). The crypto workstation and lab workstation keep their own wording ("... added to inventory. You can now use it ..."); their old branches in interactions.js were never reached for a takeable one, because the pick-up-then-open branch caught them first. Nothing is said for notes ("Added to your notes" covers them), the lockpick set (own toast), an item already held ("Already in inventory"), a refused add, or an item a tray rule files in a holder ("Added to <holder>: <item>").
- `systems/interactions.js`: the three world pickup paths call `window.announcePickup` once their add answers: the plain takeable path, the pick-up-then-open types (phone, workstations, mail terminal, VM launcher) and a takeable text file read in the world (the toast waits for the reader to close, notifications.js holds it). Called through `window` so the many interactions.js test harnesses that stub inventory.js need no change.
- Not changed: container takes (they already say "Added X to inventory" in the panel) and NPC gives.
- Doubled toasts: checked every `item_picked_up` mapping in m01 to m10 and the labs. They send phone messages (`sendTimedMessage`), set globals, complete tasks or open a conversation; none shows a pickup toast, so nothing doubles. A phone message after a pickup still arrives as its own notification, as before.

### (b) A text file closes back to its container
- `minigames/text-file/text-file-minigame.js` `cleanup()`: a file read from any container (a drawer, a PC desktop, an NPC's items) reopens that container 100 ms after the reader closes, through `returnToContainerAfterNotes()` as the notes viewer does. Network screens keep their own reopen. `TextFileMinigame.cameFrom(back, fileName)` checks the file is among that container's contents, so a return left over from a container the player closed another way never sends a file read in the world back into it; that stale return is cleared as before. If something else has opened by the time the return fires, the return is dropped.

### (c) "More below" on the objectives panel
- `ui/objectives-panel.js`: `hasMoreBelow()` and `updateMoreBelow()` set `has-more-below` on the panel after a render, on scroll, at the end of an aim folding (transitionend), on resize (and a ResizeObserver), and on collapse.
- `css/objectives.css`: a 40 px fade strip at the panel's bottom edge and a 7x4 pixel down arrow at 2x drawn with box-shadow pixels. No new art. `css/ui-themes.css`: themed panels fade to `--ui-surface` and draw the arrow in `--ui-text-dim`.

### (d) A click on an open gate walks the player through
- `systems/door-gates.js` `walkThroughTarget(doorSprite, feet)`: for a gate that is open to the player (or any open gate when he is inside the secured room), a point 2 tiles past the doorway's centre for a north or south door, 1.5 tiles for a side door, on the far side from the player. Null for a shut gate, an open gate that bars him (undisguised while a guard holds it), or no gate.
- `core/game.js` scene pointerdown, door branch: an open gate with a target walks there with `movePlayerToPoint`, near or far. Before, an in-range click did nothing and a far click stopped on the near side. A barred gate still refuses through doors.js; a shut gate is unchanged.

### q55 (d) An owner walking away no longer steals the click
- `systems/interaction-reach.js`: `npcWalkingAway(player, sprite)` (body speed at least 10 px/s, velocity pointing away from the player) and `withoutLeavingNpcsIfObjects(candidates)`.
- `core/game.js`: the tap's pick list drops an NPC walking away when an object (not a chair) is also gathered; and an NPC walking away under the tap gives way to an interactable object under the same tap (it is used, or walked to when out of reach). An NPC standing or coming towards the player is unchanged.
- `systems/interactions.js` `tryInteractWithNearest` (E key): an NPC walking away scores like a chair, so anything else in reach that is faced wins.

## Tests
- New `test/js/lab-ux-ui.test.mjs` (15): pickupToast and announcePickup through the real addToInventory (added, already, refused, key, filed in a holder); interactions.js announcing on the plain, pick-up-then-open and text-file paths and not for the lockpick set; the E key preferring the PC over an NPC walking away and the faced NPC when standing; npcWalkingAway and withoutLeavingNpcsIfObjects; walkThroughTarget for shut, barred, open N/S both sprites, leaving from inside, and E/W; hasMoreBelow and the panel class through render, scroll and collapse.
- `test/js/container-shares.test.mjs`: the old "an ordinary container still closes to the world" is now "reopens its file list", plus a stale return closing to the world and a return dropped when something else opened. 18 pass.
- Stubs of interaction-reach.js in interaction-warning, wearable-hooks and notifications-plain-default gained `npcWalkingAway`.
- Full suites: bin/test-js 508 files passed, 0 failed. The Rails suite was not run: the shared test lock was queued behind other builds for over 20 minutes, and this build changes no Ruby.

## Live proof (keyless server on :3040)
- (a) test_gate_tailgate game 1395: taking the RFID cloner showed "Picked up RFID cloner" (toast log and screenshot).
- (d) same game, with the lanyard: a click on the gate while Sam held it open walked the player from (88,123) through the doorway into the staff room (track: office ... (48,30) then staff_room (48,0) ... (48,-56)); the objective completed. From inside, a click on the open gate walked him back out to (48,58) in the office. A click while Sam stood in the doorway left the player pressed against Sam until Sam moved on; the gate does not wait for the doorway to clear.
- (c) lab_physical_pentest game 1401: with five aims unlocked the list was 1352 px in a 557 px view; the panel showed the fade and arrow; scrolled to the end, the cue went away.
- q55 (d): test_access_habits game 1414. The player stood beside Dana's PC; a trap clicked the PC's centre the moment Dana, leaving for coffee (`npc_left_post:dana` 48 s in), was walking away with her sprite over the PC. The first try (game 1411) opened a conversation with Dana: the PC was just out of reach, so only Dana was gathered under the tap and the single-candidate path took her. With the fix (leaving NPCs alone under the tap give way to an object there), no conversation opened and the player walked to the PC; a second click opened her desktop, signed in as her.
- (b) same game: on Dana's desktop, clicking Staff notice.txt opened the reader; Close brought back the desktop (ContainerMinigame with its icons) within 100 ms, and the pending return was spent.
- Screenshots in `docs/achitechture/lab_ux_ui/`: `a_pickup_cloner.png`, `c_more_below2.png` and `c_crop2.png` (the cue, enlarged), `d_gate_after.png` (a click while Sam stood in the doorway), `d_gate_through.png` (through, objective done), `b_back_to_desktop.png`.

## Open
- The pick-up-then-open branch re-runs the world sprite a second later; its second add answers "already", so no second toast, but the existing re-entry is unchanged.

## Handover
Not needed: the build finished in one context.
