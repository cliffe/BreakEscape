# UX feedback round, slice 3b: build log

Branch `build/ux-slice3b` (from batch 27, a8f74b3b8). Plan: `docs/achitechture/UX_FEEDBACK_ROUND_PLAN.md` on build/ux-feedback, slice 3b and the o-acl-doors row; main2-16 for the menu icon.

User decisions: q97, copies at access-list doors are used one at a time through the copier's Emulate, with the server deciding; q90, icons on the two left-card menu entries, a hand for Take and a new copier icon for Copy, drawn by hand (no paid generation), awaiting the user's approval.

## What changed

### Copies at access-list doors go through the copier (o-acl-doors, q97)

`public/break_escape/js/systems/unlock-system.js`, the rfid branch of `handleUnlock`:

- `heldRfidCardIds({ copies: false })` returns the physical keycards only. The default still returns keycards and saved cards (other callers unchanged).
- Step 2 (a lock with an access list, no `requires` match): the first request carries the held keycards only. A saved copy is never in it.
  - Yes: the door opens from the answer, as before.
  - Refused (or `uid_only`) and the copier holds saved cards: the reject sound plays and the copier opens on the reader in access-list mode. No refusal toast and no `door_unlock_failed` at this point; the copier reports its own refusals through `onRefused`.
  - Refused and nothing saved on the copier (or no copier): the refusal toast as before.
  - No answer: "Failed to verify access", no copier.
  - No keycard held and the copier holds saved cards: the copier opens at once, with no request.
- A cancelled copy still counts as "saved" for opening the copier, so the player sees it refused there ("Card cancelled") instead of the door silently ignoring it.
- `startRfidReader({ accessList: true })` passes `accessList`, `requestAccess(cardIds)` (a wrapper over `requestRfidAccessUnlock`, which still waits for a copy still being recorded) and `onLateAccessUnlock`. Its `onComplete` uses `result.serverResponse` when the copier already has the server's yes, so there is no second unlock request; the requires path still calls `notifyServerUnlock` as before. A shared `applyRfidAccessUnlock` takes object contents from the answer, plays the door sound, unlocks and shows the toast.

`public/break_escape/js/minigames/rfid/rfid-minigame.js`:

- `accessList` is on only when the caller passes both `accessList: true` and a `requestAccess` function. `isLockingAttempt` is true for it even with an empty `requiredCardIds`, so the door screen shows at an access-list-only door.
- `handleEmulate` keeps its local refusals first: no reader, a cancelled card (`isCardRevoked`), and a UID-only copy at a lock without `acceptsUIDOnly`. Then, in access-list mode, `_askAccessList` sends that one card id and follows the answer: "Access Granted" and `complete(true)` with `gameResult.serverResponse`; "Card not accepted" (`wrong_card`); "Reader requires full authentication" (`uid_only`); "No answer from the reader" as a notice with nothing reported to the door. `card_emulated` is emitted as before.
- A held card tapped in access-list mode goes the same way (one id, `emulated: false`).
- One request at a time: a second press while one is out does nothing.
- If the copier is closed (or replaced) before the yes arrives, or during the 2 s success hold, `onLateAccessUnlock` opens the door from the answer, once, because the server has already unlocked it. A refusal after closing is dropped.
- `_showDenial` reports to `onRefused` only when it has a reason (the no-answer notice has none).
- The two cancelled-card detail lines had em dashes; now full stops.

The toast after an Emulate names the copy the player chose ("Opened with your copy of Dana Reyes's badge."). This tells the player nothing they did not pick themselves; the server's answer still says only `viaCopy`.

Server: unchanged. It already reads keycards from its own inventory copy, counts copies only from `serverClones` while a copier is held, refuses revoked ids and UID-only copies without `acceptsUIDOnly`, and refuses a copy it has no record of. "A copy opens a door only through the copier" is client flow: a hand-made request with a recorded copy's id is indistinguishable from an Emulate press. Acceptable under the cheat policy (the player really holds that copy and the copier).

Sync: no player_state change. Each Emulate sends one request with one card id; the first request carries at most the held keycards.

### Copier icon on the Copy entry (main2-16, q90)

- `public/break_escape/assets/icons/card-copier.png`: new 16x16 icon, a handheld copier in the copier frame's colours (#ff8200 body, #ffb366 and #b35a00 bevels, dark outline, grey screen with orange lines, round button). Drawn by hand as a pixel grid with PixelLab's free pixelart_workbench (`draw` from scratch); no paid generation. **Awaiting the user's approval.**
- `public/break_escape/js/systems/action-menu.js`: `copyIcon()` now uses it at x4 (64x64, `COPIER_ICON_SCALE = 4`), filling the 64px box like the hand. Take is unchanged (`hand_frames.png` frame 0, from slice 3a).
- Preview at 4x: `ux-shots/slice3b/card-copier-icon-x4.png` and, beside the hand, `card-copier-icon-x4-beside-hand.png` (session scratchpad).

## Tests

Run without the lock (builder rule), every file touching the changed modules:

- `access-rfid-acl.test.mjs` 34/34. New: the first request carries keycards only; `heldRfidCardIds({ copies: false })`; refused keycards open the copier in access-list mode with no toast or `door_unlock_failed`; no keycard opens it at once with no request; `requestAccess` sends a single id and `onComplete` with the answer opens the door with no second unlock call and names the copy; the late-unlock path; refused keycards with an empty copier toast as before; no answer opens no copier; a cancelled copy still opens the copier. Changed: the uid_only, object and viaCopy tests now use keycards (copies are no longer in the first request); the in-flight clone record tests go through `requestAccess`.
- `rfid-door-screen.test.mjs` 42/42. New: the door screen at an access-list door with no `requires`; Emulate sends one id and keeps the answer; a second press sends nothing; refusals (`wrong_card`, `uid_only`) and the no-answer notice; UID-only and cancelled copies refused locally with no request (and a UID-only copy is asked about where the lock accepts it); a yes after closing, and closing during the success hold, reach the door once; a tap at an access list asks about that card.
- `action-menu.test.mjs` 16/16, updated: Copy uses `icons/card-copier.png` at a whole multiple of 16, and the file is 16x16.
- Every other test file importing unlock-system, rfid-minigame or action-menu: 41 files, 522 passing, 0 failing.
- Rails `access_model_rfid_test.rb` 47/47. New regression pins (the server is unchanged, so they passed before the slice): a single-id request for a recorded copy opens the door with `viaCopy` only; a single-id request for a copy the server never saw made is refused; a recorded copy of a cancelled card is refused; a UID-only copy is refused with reason `uid_only`.
- Validator, `test_access_doors`: 0 ❌ (1 warning, existing). No scenario files changed.
- Full suites under the lock: see "Suites" below.

No new static imports, so no harness copy lists change.

## Live proof

Keyless server on :3065 from this worktree, physics at setFPS(20) with fixed steps, scrollbars shown (headless shell without `--hide-scrollbars`), stopped afterwards. New games, each `test_access_doors` swapped onto a `test_access_social` host with `tools/playtest/swap-scenario-game.rb`. Script: `slice3b-tools/proof.js` in the session scratchpad.

Game 2947, 1400x1000: take the copier and the visitor card (menu with both icons), copy Dana's badge in conversation and save, then the finance office door. Requests seen: `card_ids: ["VISITOR-07"]`, 422; the copier opens on "At the reader: Finance office" with Emulate Dana and Tap Visitor card 07; Emulate sends `card_ids: ["FIN-DANA-01"]`, 200; "Access Granted", then the toast "Opened with your copy of Dana Reyes's badge." Two unlock requests at the door in all, no third. Server: `finance_office` in unlocked rooms, `serverClones` holds FIN-DANA-01.

Game 2940, 390x844: take the copier only; a copy of Dana's badge put on the client's copier with no clone record. The door opens the copier at once with no request; Emulate sends `card_ids: ["FIN-DANA-01"]`, 422, "Card not accepted". With FIN-DANA-01 cancelled, Emulate shows "Card cancelled" and sends no request. Server: `finance_office` still locked, `serverClones` empty.

Shots (PNG) in the session scratchpad, `ux-shots/slice3b/`:

- `menu-icons-1400x1000.png`, `menu-icons-zoom-1400x1000.png`, `menu-icons-390x844.png`, `menu-icons-zoom-390x844.png`: both entries with icons (computed 64x64 for both, `image-rendering: pixelated`).
- `acl-keycard-refused-copier-at-reader-1400x1000.png`, `acl-emulating-dana-1400x1000.png`, `acl-emulate-access-granted-1400x1000.png`, `acl-door-opened-toast-1400x1000.png`.
- `acl-no-keycard-copier-opens-at-once-390x844.png`, `acl-unrecorded-copy-refused-390x844.png`, `acl-cancelled-copy-refused-390x844.png`.
- `card-copier-icon-x4.png`, `card-copier-icon-x4-beside-hand.png`: the icon preview for approval.

## Not done, open

- The copier icon needs the user's approval; slice 8 may replace it.
- Retakes of main2-19, main2-21, main2-23 and main2-25 by the plan's shot names were not taken as such; the shots above cover the same screens for the access-list path.
- A UID-only copy (Priya's) at evidence_store was not driven live; unit and Rails tests cover it.

## Suites

Under the shared lock, on 2e0fda0e8:

- `RBENV_VERSION=2.7.8 bin/rails test`: 2390 runs, 42539 assertions, 0 failures, 0 errors, 1 skip.
- `MERGE_BATCH=1 bin/test-js -j 3`: 598 files passed, 0 failed.

f7b3edb12 came after (two refusal lines lose their em dashes, text only); the rfid test files that load that module were rerun and pass (revocation 7, door screen 42, denial hold 10).

## Review round 1 fixes

Review: `UX_SLICE3B_REVIEW_R1.md` (B 0, M 1, m 9). Commit 72142e6a7.

- **M1, a late yes on an object.** `unlockTarget` takes `{ autoOpen }` (default true). The late path (`onLateAccessUnlock`) passes `late: true` to `applyRfidAccessUnlock`, which calls `unlockTarget` with `autoOpen: false`: the object is unlocked, its contents kept, `item_unlocked` and the toast as before, and the container waits for the player. A yes while the copier is still up opens the container as before. Test in `access-rfid-acl.test.mjs`: the late path never calls `handleContainerInteraction`; the `onComplete` path does.
- **m1, oracle at an open lock.** `GamesController#unlock` notes whether the target was already open (`room_unlocked?` or `object_unlocked?`) before `validate_unlock`, and then skips `rfid_unlock_card_answer`. Rails pin: after a copy opens the records door, requests with either copy or both get `success: true` with no `viaCopy` and no `cardId`.
- **m2, refused badge event.** When the held keycards are refused and the copier opens, `emitDoorUnlockFailed` fires once (`wrong_card`, or `uid_only` for that answer), with the usual payload and the `door_unlock_failed:<room>` event, and no toast.
- **m3, refused badge at the reader.** `startRfidReader` passes `refusedKeycards`; the door screen shows "Your badge was refused. Try a saved card." (plural for more than one) under the reader head and leaves those badges out of the tap list.
- **m4, signs.** `test_access_doors` D2 to D5 now say to Emulate the copy at the door. D3 says the server room opens with the badge you hold (Ian's spare badge stays in the inventory, so the first request opens it), and to Emulate the copy without the badge. Validator: 0 ❌, 1 warning (existing).
- **m5, cancelled keycards only.** Step 3 opens the copier with `accessList: true` at an access-list lock, so it opens on the reader, where the cancelled card is refused, not on the menu.
- **m6, two copiers on one door.** `applyRfidAccessUnlock` returns at once when the target is already open on the client. A late yes also closes a copier still up on the same lock (`params.rfidLockTarget`). Test: two copiers both answered yes give one `door_unlocked`, one `unlockDoor` and one toast.
- **m7, busy state on a tap.** A held-card tap at an access list shows "Checking <card>..." under the reader head and disables the door list until the answer replaces the screen; entries do nothing while `_accessPending` is true. Disabled entries are dimmed (`rfid-minigame.css`).
- **m8, the icon.** `public/break_escape/assets/icons/card-copier-32.png`: a new 32x32 portrait drawing (body 20x30, screen at the top with signal waves and text lines, a d-pad and a round button below, header dashes and a battery, in the frame's oranges with the dark outline), drawn by hand as a pixel grid with the free pixelart_workbench (`draw`), no paid generation. `copyIcon()` uses it at x2 (`COPIER_ICON_SIZE` 32, `COPIER_ICON_SCALE` 2), the hand's scale. The 16x16 `card-copier.png` is kept. Comparison for the user: `ux-shots/slice3b-r1fix/card-copier-icon-16-vs-32.png` (top row every icon pixel at x4; bottom row as the menu shows them). **Still awaiting the user's choice.**
- **m9, tests on public paths.** `rfid-door-screen.test.mjs` checks `gameResult.serverResponse`, `cardName` and `emulated` only, and ends refusals by running the hold timer (the public path back to the reader) instead of `_endDenial()`.
- **The close X inside the frame.** `RFIDMinigame` sets `closeInsideFrame` with `closeAnchor()` on `.flipper-zero-frame` and its own `placeCloseButton`: 12px in from the frame's top and right (clear of the 2px outline, the 2px bevel and the body's stepped corner), level with the header's name line, and the header's battery moved left to stay 8px clear. Re-placed on resize and frame resize (the base class watcher). Measured live: at 1400x1000 the X is at 878 to 908 in a frame ending at 920; at 390x844 at 332 to 362 in a frame ending at 374; the battery ends 8px left of the X at both.

### Tests

- `access-rfid-acl.test.mjs` 39/39 (new: m2 for wrong_card and uid_only, no event when no badge was tried, M1, m6, m5; the doors stub now sets `doorProperties.locked = false` as the real `unlockDoor` does).
- `rfid-door-screen.test.mjs` 45/45 (new: m3, m7, the X placement at 1400x1000, 390x844 and a frame taller than the window).
- `action-menu.test.mjs` 16/16 (the 32px icon at x2).
- Rails `access_model_rfid_test.rb` 48/48.
- Full suites under the shared lock, on 72142e6a7: `RBENV_VERSION=2.7.8 bin/rails test` 2391 runs, 42552 assertions, 0 failures, 0 errors, 1 skip; `MERGE_BATCH=1 bin/test-js -j 3` 598 files passed, 0 failed.

### Live proof

Keyless server on :3065 from this worktree, setFPS(20) with fixed steps, scrollbars shown, stopped afterwards. New games of `test_access_doors` (swapped onto `test_access_social` hosts): 2977 (A, 1400x1000), 2978 (A, 390x844), 2979 (B, 1400x1000), 2980 (B, 390x844). Script `slice3b-r1fix-tools/proof.js` in the session scratchpad.

- A: the visitor card alone is sent and refused (422); one `door_unlock_failed` with reason `wrong_card`; the copier opens with "Your badge was refused. Try a saved card." and no Tap entry for the visitor card; Emulate sends `FIN-DANA-01` alone (200); "Access Granted" and the toast naming the copy. Two unlock requests in all. Server: `finance_office` unlocked, `serverClones` holds FIN-DANA-01, in both games.
- B: no keycard, the copier opens at once with no request and no event; the unrecorded copy is refused (422, "Card not accepted"); a cancelled copy is refused with no request. Server: `finance_office` still locked, no clones.
- The menu shows the 32px icon at 64x64 beside the hand, both `pixelated`.

Shots in `ux-shots/slice3b-r1fix/` (session scratchpad), each looked at: `menu-icons`, `menu-icons-zoom`, `acl-keycard-refused-copier-at-reader`, `acl-close-x-zoom`, `acl-emulating-dana`, `acl-emulate-access-granted`, `acl-door-opened-toast`, `acl-no-keycard-copier-opens-at-once`, `acl-close-x-zoom-b`, `acl-unrecorded-copy-refused`, `acl-cancelled-copy-refused`, each at 1400x1000 and 390x844; and `card-copier-icon-16-vs-32.png`.

### Open after round 1

- The icon choice (16 or 32) is the user's.
- M1 and m6 were not driven live (a late yes needs the copier closed mid-request); unit tests cover them.
- Noticed, not changed: the 390x844 toast shot shows a grey horizontal scrollbar strip along the bottom of the page under the game, outside the copier. It looks like the game page's own overflow, not part of this slice.
