# UX slice 3b: review round 2

Branch `build/ux-slice3b`, diff a8f74b3b8..932e8cb9d, with the focus on b4ad7ffaa..932e8cb9d (the round 1 fixes, 72142e6a7, and the build log). Read: round 1, the build log, the cheat resistance, UI design language and pixel-art rules, the shots in `ux-shots/slice3b-r1fix/`, and the code paths the fixes touch (`GamesController#unlock`, `Game#room_unlocked?` / `object_unlocked?`, `unlock-system.js` handleUnlock rfid branch and `unlockTarget`, `doors.js unlockDoor`, `rfid-minigame.js` `_askAccessList` and `placeCloseButton`, `base-minigame.js` close placement, `rfid-ui.js showDoorScreen`, `action-menu.js`, `hud.css` / `inventory.css`).

Tests run (single files, no lock): `bin/test-js` on access-rfid-acl, rfid-door-screen, action-menu, minigame-close-shell and the 13 other rfid and refusal files that import the changed modules: 17 files pass. Rails `access_model_rfid_test.rb`: 48 runs, 0 failures. (`node --test rfid-door-screen.test.mjs` reports one failure; the same file passes under `bin/test-js`, which runs plain `node` for the reason its header gives. Not a finding.)

Labels: B blocks the merge, M should be fixed before the merge, m can be fixed now or logged.

## 1. Round 1 findings

| R1 | Status | Evidence |
|---|---|---|
| M1 late yes opens the container | Fixed | `unlockTarget(..., { autoOpen })` gates both `handleContainerInteraction` timers (`unlock-system.js:1441`, `:1476`); the late path passes `late: true` (`:1186`) and `autoOpen: !late` (`:1141`). |
| m1 oracle at an open lock | Fixed, see below | `games_controller.rb:1100-1101`, `:1134`; Rails pin covers one copy, the other, both. |
| m2 refused badge event | Fixed | `unlock-system.js:1252`, one event, no toast; test asserts the payload and the per-room event. |
| m3 refused badge at the reader | Fixed | `rfid-ui.js` refused line and filter; ids derived as in `heldRfidCardIds` (`card_id`, else `lockRef`), so the filter matches what was sent. Shot shows the line and no Tap entry. |
| m4 signs | Fixed | D2 to D5 text reads correctly for the new flow. |
| m5 cancelled keycard only | Fixed | `unlock-system.js:1272`; the reader refuses the card as cancelled through `handleCardTap`'s revoked check before any request. |
| m6 two copiers | Fixed | `rfidTargetOpen` guard (`:1127-1130`) and the late close of a copier on the same lock (`:1134-1139`). |
| m7 busy state on a tap | Fixed | `showAccessChecking` plus the `unlessBusy` guard; an error answer goes through `_showDenial` and back rebuilds the list, so entries come back enabled. |
| m8 icon | Done, awaiting the user | See section 4. |
| m9 tests on public paths | Fixed | |

### Do the M1 and m6 tests exercise the real path?

Mostly. Both tests drive the real `handleUnlock`, `applyRfidAccessUnlock` and `unlockTarget` code. What is stubbed, and whether the stub is faithful:

- `doors.js unlockDoor`: the stub now sets `doorProperties.locked = false`. The real one does the same, synchronously, first thing (`doors.js:812`). Faithful, and the m6 guard depends on exactly that.
- The copier: replaced by the captured params. The result object the test passes (`{ success, cardName, emulated, serverResponse }`) has the shape `_askAccessList` builds (`rfid-minigame.js:343`), and the copier's own side (closed mid-request or mid-hold, then `late()`) is pinned in `rfid-door-screen.test.mjs`. The two halves meet on the same contract.
- `MinigameFramework.currentMinigame`: stubbed as `{ params: second, complete }`. The real scene keeps the same object as `this.params` (`base-minigame.js:29`) and `startRFIDMinigame` passes params straight through, so the identity check `open.params.rfidLockTarget === lockable` holds live.
- The 500 ms container timer: the M1 test captures `setTimeout` and runs every timer, so a launch would have been seen.

The untested joint is a real `RFIDMinigame` receiving `complete(false)` from the late path while its own request is out. Reading it through: that copier's answer arrives with `_isLive()` false, calls `late()`, and `applyRfidAccessUnlock` returns at `rfidTargetOpen()`. Correct by reading.

- **m1. No live proof of a late yes.** The build log says so itself, and helper tests have passed while the live path broke before. Fix: in the merge batch's live run, wrap `ApiClient.unlock` with a 1.5 s delay through the test bridge, Emulate at the test_access_doors finance cabinet (or any rfid access-list object with contents), press Esc during "Emulating...", and check: no container window, the cabinet unlocked, one toast, one `item_unlocked`. Then the door case with a second touch while the first answer is out: one `door_unlocked`.

### Can the already-open skip hide a legitimate answer?

No answer the player is owed. `validate_unlock` grants any request at an open target whatever is sent, so once the target is open no card "passes" in any sense the list decides; naming one would only be the oracle round 1 described. The door still opens on the client, because `success: true` is unchanged. What changes is the toast wording in two cases where the server was open before the client knew:

1. The first-touch keycard request (`unlock-system.js:1246`): no `cardId`, so `rfidOpenedLine(null)` says "Card accepted." (`:192`). This happens when the copier's yes was applied server-side but its late answer has not reached the client yet, and the player touches the door again holding a badge the list refuses. The toast credits a card the list did not take.
2. A second copier's Emulate in the same window: the copier names the copy itself ("Opened with your copy of B"), even if B is not on the list. In practice the first copier's late yes nearly always lands first and closes the second copier (m6 fix), so this needs answers to arrive out of order.

Both are narrow races and neither leaks anything (the player caused the open). `room_unlocked?` also covers the start room and rooms opened through another door; in those cases the old code named a card for a request that any card would have passed, so the new silence is the more truthful answer.

- **m2. The open-already answer reads as a card being accepted.** `games_controller.rb:1134`, `unlock-system.js:192`. Fix: when `already_open`, add `alreadyOpen: true` to the success body (it tells the player nothing they did not cause); in `rfidOpenedLine`, return "The door is already open." for it; in `_askAccessList`'s yes branch, when `response.alreadyOpen`, show "Already open" rather than "Access Granted" and set `cardName` to null so the toast does not name the copy. Rails pin: the existing m1 test asserts `alreadyOpen`. Can be logged instead.

- **m3. Style slip.** `games_controller.rb:1103`: `is_valid =@game.validate_unlock` lost its space. Fix: `is_valid = @game.validate_unlock`.

## 2. The grey strip along the bottom at 390x844

It is not the copier and not the toast, and it is not a page-level horizontal scroll. It is the inventory strip's own scrollbar, and it is already on main.

Evidence:

- The strip is the bottom 8 px of the window (rows 836 to 843) in every 390x844 shot, including `menu-icons-390x844.png`, taken before any copier opened, and it shows dimmed under the copier's backdrop in the copier shots.
- `#inventory-container` is `position: fixed; bottom: 0; left: 0; right: 0` with `overflow-x: auto` (`hud.css:258-270`) and an 8 px webkit scrollbar, track `rgba(255,255,255,0.1)`, thumb `rgba(255,255,255,0.3)` (`hud.css:273-284`). Those colours over the dark HUD backing give the measured track (34,35,43) and thumb (100,101,106).
- The thumb's width follows what the player carries: 290 px in the game A shots (visitor badge, cloner, notes and more) and 337 px in the game B shots (fewer items). A page overflow would not track the inventory. In the toast shot the inventory slots run off the right edge ("Notes" cut in half), which is the overflow the bar is scrolling.
- `body` and `#game-container` (`main.css:2-21`) do not grow: the container is 100vw with `overflow: hidden`, and the fixed strip cannot widen the document.
- Neither `hud.css` nor `inventory.css` is in this slice's diff.

So the layout rule (no horizontal page scroll) holds. The bar does break the pixel-art rule and the scrollbar rule: its thumb has `border-radius: 4px` (`hud.css:283`, also `inventory.css:26`), it uses translucent colours with no 2px edge, and the strip has no "more" cue.

- **m4. The inventory strip's scrollbar is not pixel art (pre-existing, not this slice).** `hud.css:273-284`, `inventory.css:16-27`, `app/views/break_escape/games/show.html.erb:135`. Fix, in a HUD pass or now as a two-line change: add `class="pixel-scroll"` to `#inventory-container` in `show.html.erb`, delete the two sets of `#inventory-container::-webkit-scrollbar*` rules (the shared `.pixel-scroll` rule in `utilities.css:340-378` then draws a square thumb with a 2px edge), and give the strip a right-edge "more" cue when `scrollWidth > clientWidth`. Check that `.pixel-scroll`'s 14 px height still fits the 80 px (108 px themed) strip without clipping the slots at 390x844 and 915x412. Log in `docs/IDEAS_BACKLOG.md` if not done here.

## 3. The X inside the frame, and the battery

Checked at 6x on `acl-keycard-refused-copier-at-reader-1400x1000.png` and on `acl-close-x-zoom-*`:

- The X sits wholly inside the frame, clear of the 2px outline, the bevel and the stepped corner (the nearest corner step is about 12 px from the X's top right). It is vertically centred on the "CARD COPIER" name line. Good, and it meets the design language.
- The battery and "100%" sit 8 px left of the X at both sizes. Nothing overlaps.
- The header rule under the name line runs to the X's left half and stops; it does not cut through the X.
- `RFIDMinigame.placeCloseButton` resets and re-measures `paddingRight` on every resize; header width is set by the frame, so the change cannot feed back into the frame's size through the ResizeObserver. The frame is built in `init()`, before `start()` attaches the observer, so the observer watches the right element.
- The class names it adds (`minigame-close-in-frame`, `rfid-close-in-frame`) have no CSS. Harmless; the first is used by tests and other scenes.
- The only cloner name in the scenarios is "RFID Cloner" (the default is "Card copier"), so the header has room at 390 px with the reserve.

- **m5. The X's band reservation is now spare space, and short screens were not shot.** `rfid-minigame.css:746-770` still reserves 32 px above and below the frame for an X that used to sit above it (the comment was updated, the bands were not). At 915x412 and 800x600 those 64 px are a large share of the height, and the design language asks for the frame to wrap content at those sizes. Fix: take shots at 915x412 and 800x600 with the reader screen and the emulation screen; if the frame is cramped, cut the band to the toast clearance it still needs (or 8 px) and recompute the `100vh - 104px` terms. If the shots look fine, no change.

## 4. The 32x32 icon

- Path: `copyIcon()` builds `${assetsPath}/icons/card-copier-32.png` the same way as the hand (`action-menu.js:39`); the file is in `public/break_escape/assets/icons/` beside `hand_frames.png`, so it is served under the engine mount and in standalone. The default-path test covers the fallback.
- Scale: 32x32 file, drawn at 64x64 (x2), the hand's scale; the zoom shot shows both crisp at the same pixel density. Content is 20x30 inside the 32 box, portrait, so it sits in the 64 box at about the hand's visual weight. Meets the pixel-art rule.
- The 16x16 file is kept and unreferenced, which is right while the user chooses.
- The drawing reads as a handheld games console: the d-pad and the round button under the screen are the classic console layout, and the copier's own on-screen frame has neither (it is an orange body, a header and a screen). It is also unlike the world sprite (`objects/rfid_cloner.png`, tan with a blue oval), though the frame is the better reference. The orchestrator's recommendation of the 32 version is sound on density and shape; the console look is the one thing a player might misread.

- **m6. The 32px icon looks like a games console.** `public/break_escape/assets/icons/card-copier-32.png`. Fix, only if the user picks the 32 version and agrees: replace the d-pad and round button with a card held to the device's top edge plus two signal arcs on the screen, or a single wide button row like the frame's footer, so the device reads as a card reader. Put that on the approval page as an alternative rather than swapping it unasked.
- **m7. After the user's choice, retire the other file.** Move the unused PNG to `tmp/delete/` (the delete rule) and stage its removal; tidy the `action-menu.js:28-31` comment that still mentions both. The test line `action-menu.test.mjs:144` compares 64/32 with 64/32 (`take.icon.cell * 2 / 32`), which is always true; assert `copy.icon.width / 32 === 64 / take.icon.cell` (the hand's drawn scale) instead.

## 5. Regressions in other RFID doors and minigames

- Non-access-list doors and objects: steps 1a, 1b and 3 unchanged apart from `rfidLockTarget` in the params (read only by the access-list late path) and `{ accessList: false }` at step 3, which is the old call. `unlockTarget`'s new option defaults to `autoOpen: true`, and every other caller passes four arguments.
- `requires` plus access list: unchanged from round 1.
- The X inside the frame applies to every RFID copier screen (clone from the inventory, clone from a conversation tag, non-list doors). The placement code is the same in each, and `disableClose` (display none) returns early, leaving the header as it was.
- m2's event: a refused badge followed by a refused copy now gives two `door_unlock_failed` events. Each is a real refusal at the reader; no listener in the scenarios (round 1 table) counts them.
- m3's filter only drops held keycards whose id was in the refused request; saved copies and other keycards are listed as before.
- The other rfid test files (clone entry, clone card, flipper back, revocation, denial hold, dictionary attack, crypto contrast, no-keycards hint, the f18 toast, locked-hint refusals, the knocked-out door event, inventory menu, clone after line) pass.

No regression found.

## Counts

B 0, M 0, m 7.

Ready to merge. m1 (the live late-yes check) belongs in the merge batch's live run; m4 is pre-existing and can go to the backlog; m6 and m7 wait on the user's icon choice; m2, m3 and m5 can be fixed now or logged.
