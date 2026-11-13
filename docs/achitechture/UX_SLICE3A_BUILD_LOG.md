# UX feedback round, slice 3a: build log

Branch `build/ux-copier` (from `build/ux-feedback`). Plan: `docs/achitechture/UX_FEEDBACK_ROUND_PLAN.md`, slice 3a (cards main2-16, main2-17, main2-21, main2-22; retake main2-19).

## What changed

### Stepped corners back on the card copier (main2-17, main2-22)

`public/break_escape/css/rfid-minigame.css`, `.flipper-zero-frame`. The clip-path polygon from 6990989ac^ is back, held in a custom property `--copier-steps` so three layers share it. A border or inset box-shadow on a clipped box is cut away at the corners, so the 2px outline and the bevel from 6990989ac are now layers:

- the frame's own background is the dark outline (#1a0d00);
- `::before`, inset 2px, is the light bevel (#ffb366);
- `::after`, offset 2px further down and right, is the orange body with the dark bevel (#b35a00) as a hard inset shadow on its right and bottom edges.

A staircase of 2px steps inset by 2px is the same staircase, so the outline and the light bevel follow every step. The dark bevel follows the straight edges and stops where the bottom-right steps start; the steps there meet the outline directly. The soft drop shadow from before 6990989ac stays out (pixel-art rule; the clip would cut it anyway). Padding is 20px, so the content sits where it did.

### Emulation screen held (main2-21)

`public/break_escape/js/minigames/rfid/rfid-ui.js`, `showEmulationScreen`: the screen (signal icon, protocol, card name, three data fields, "Emulating...") now stays up for `EMULATION_HOLD_MS` = 1500 ms before `handleEmulate` (was 500 ms). Opened at a reader its breadcrumb reads "At the reader > Emulating"; from the inventory it stays "RFID > Saved > Emulating". Measured live: about 1.5 s from the Emulate press to the result.

### Menu icons on Copy and Take (main2-16)

- `public/break_escape/js/systems/action-menu.js`: Take carries the open hand (`hand_frames.png` frame 0, 32px cells, x2 fills the 64px box). Copy carries `assets/objects/rfid_cloner.png` (11x22) at x2, 22x44, as the placeholder until the copier menu icon is drawn (slice 8).
- `public/break_escape/js/ui/interaction-menu.js`: a plain image icon may give `width` and `height`; it is then drawn at exactly that size, centred, so it is never scaled by a fraction. Icons without them keep `contain`.

## Tests

Run without the lock (test lock rule), every file touching the changed modules:

- `rfid-door-screen.test.mjs` 10/10. New: the frame's stepped polygon (36 points, every offset a whole 0/2/4/6/10px), the frame clipped to it, no border or shadow on the clipped frame, both layers clipped to the same steps, no blurred shadow; the emulation screen held at least 1.5 s with the reader breadcrumb at a door and the device's own trail from the inventory. The old check that banned `clip-path` now bans only `border-radius` and 1px borders.
- `action-menu.test.mjs` 13/13. New: both entries carry icons; the Copy placeholder is the same whole multiple of 11 and 22 and fits the box; default assets path.
- `inventory-menu.test.mjs` 19/19. New: an exact-size icon is centred at that size, a sheet frame scales to the box, a plain image keeps `contain`.
- Also green: engine-fixes-pass3 6, engine-fixes-pass4b 10, rfid-clone-card 12, minigame-html-sweep-c 13, rfid-no-keycards-hint 3, rfid-dictionary-attack 3, rfid-denial-hold 10, rfid-crypto-contrast 12, rfid-flipper-back 3, escaping-shared-helpers 20.

No new static imports, so no harness copy lists change. No Rails code changed.

## Live proof

Keyless server on :3320 from this worktree, physics at setFPS(20) with fixed steps. Game 2405: `test_access_doors` swapped onto a `test_access_social` host with `tools/playtest/swap-scenario-game.rb`. Path: pick up the copier, interact with the visitor card, Copy, Save, go to the IT lobby, use the visitor-room reader, Emulate.

Shots (webp) in the session scratchpad, `ux-shots/slice3a/`:

- `after-main2-16-left-card-clone-or-take-menu.webp`, `after-main2-16-menu-zoom.webp`: both entries with icons (computed sizes 22px 44px centred, and 256px auto for the hand sheet).
- `after-main2-17-left-card-cloner-reading.webp`, `after-main2-17-corner-zoom.webp`, `after-main2-17-corner-br-zoom.webp`: stepped corners with outline and bevel.
- `after-main2-19-cloned-card-at-reader.webp`: the door screen in the stepped frame.
- `after-main2-21-flipper-emulating-clone.webp`: the details screen, 0.7 s after the press, breadcrumb "At the reader > Emulating".
- `after-main2-22-flipper-emulate-result.webp`: Access Granted in the stepped frame.

## Sync

Client display only. No player_state change, no new request.

## Art needed

- Copier menu icon (already in the plan's art list): 32x32, shown x2 in the 64px menu box, copier palette (body #FF8200, light #ffb366, dark #b35a00, black screen with orange text). Replaces the `rfid_cloner.png` placeholder in slice 8 (pass `frame`/`cell` or `width: 64, height: 64`).

## Notes

- The copier overlay is centred in a space of odd height, so at 1400x1000 the frame sits at y = 160.5 and the stepped edge pixels blend slightly. This is general to the minigame overlay, not to this slice; snapping the overlay to whole pixels would fix it.
- The edits to `rfid-ui.js` and `rfid-minigame.js` on `merge/m03-improvement-loop` (Back to the read, Abandon read, dictionary attack) are already on this branch; nothing to merge.

## Handover

Slice 3a is done. Nothing in progress.
