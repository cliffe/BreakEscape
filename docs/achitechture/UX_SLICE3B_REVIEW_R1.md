# UX slice 3b: review round 1

Branch `build/ux-slice3b`, diff a8f74b3b8..6be91f42a. Read: the build log, the plan's slice 3b section (build/ux-feedback), the cheat resistance, delta sync, UI design language and pixel-art rules, the shots in `ux-shots/slice3b/`, and the server paths the new client flow calls (`Game#validate_unlock`, `rfid_lock_passes?`, `held_rfid_cards`, `rfid_unlock_card_answer`, `uid_only_refusal?`, `GamesController#unlock`). No tests were run (read-only review).

Labels: B blocks the merge, M should be fixed before the merge, m can be fixed now or logged.

## 1. Server authority and cheat resistance

The server is unchanged and still decides. A card id counts only when the server's own inventory copy carries a keycard with it (client-forged items skipped, `game.rb:2465`) or when `serverClones` holds a record for it while an `rfid_cloner` is held (`game.rb:2499`). A copy the server never recorded is refused, and so is any id in `revoked_card_ids`, for keycards and copies alike (`game.rb:2491-2507`). The new Rails pins (single-id copy opens with `viaCopy` only; unrecorded copy refused; cancelled copy refused; UID-only copy refused with `uid_only`) cover the four cases the brief asked about. An id the player never held cannot open anything. Replay of a yes is a no-op on an unlocked door. There is no rate limit on `/unlock`, but only held ids count, so there is nothing to brute force, and the per-request cost is the same as before.

One copy per request means the player learns which copy opened the door. The user chose that (q97), and the toast naming the chosen copy adds nothing the player did not pick. Hand-made single-id requests were already possible before the slice, so the server gives away no more than it did.

Sync: no player_state change. Each Emulate or tap sends one id; the first request sends the held keycards only (fewer ids than before). Nothing grows.

- **m1. Post-unlock oracle for further copies.** `validate_unlock` grants any request at an already-unlocked door (`game.rb:3054-3058`), and `GamesController#unlock` then still runs `rfid_unlock_card_answer` on the sent ids (`games_controller.rb:1129`, `game.rb:2587-2598`). After a copy opens the door, a hand-made request per remaining copy answers `viaCopy: true` for each one the list admits and nothing for the rest, so the player learns every admitted identity among their copies. Honest play stops at the first yes. Under q78 this is time-saving only (a fresh game and a different Emulate order gets the same answer), so it is minor. Fix: in `rfid_unlock_card_answer`, return nil when the target was already unlocked before this request (check `room_unlocked?` / the object's unlocked state in the controller before `validate_unlock` and skip the card answer), plus a Rails test: open with copy A, then a single-id request with copy B gets `success: true` with no `viaCopy` key.

## 2. Regressions from the changed door flow

### door_unlock_failed listeners

Every listener found:

| Where | Door | Lock | Affected |
|---|---|---|---|
| m04 `scenario.json.erb:990` | plant_room | not an access list | no |
| m05 `:1337` | data_center | not an access list | no |
| m06 `:1265-1279` | executive_wing | not an access list | no |
| m07 `:1239` | scada_control | not an access list | no |
| m09 `:214`, `:223`, `:408` | restricted_stacks, tape_room, staff_passage | not access lists | no |
| m10 `:1758` | power_room | not an access list | no |
| test_access_doors `:85` | evidence_store | rfid, `access: { roles: [security] }` | yes, still reachable |

No engine module listens (`objectives-manager.js` listens to `door_unlocked` only; no needs, office-life or security-window code subscribes to `door_unlock_failed`). No ink file references it. Of the shipped scenarios only `lab_physical_pentest` has `access` lists, and all three are `login` locks, so no shipped rfid access-list door exists today.

The one affected listener, `d4_evidence_refused`, still fires: Emulate on Priya's UID-only copy is refused locally with reason `uid_only` (`rfid-minigame.js:377-395`), which reaches `refusedWithHint`. It now needs that Emulate press, where before touching the door was enough. It also fires for any UID-only copy at evidence_store, not only one whose identity the list admits; harmless in a test scenario.

- **m2. A refused badge emits no event.** When the held keycards are refused and the copier opens (`unlock-system.js:1227-1231`), the reader has refused a real card, yet no `door_unlock_failed` fires. A player who then closes the copier has made a failed attempt that no listener sees. Today nothing depends on it (table above), but a future mission line keyed on "tried the door with the wrong badge" would silently miss whenever the player carries a copy. Fix: call `emitDoorUnlockFailed(outcome === 'uid_only' ? 'uid_only' : 'wrong_card')` before `startRfidReader({ accessList: true })`, with no toast; change the `access-rfid-acl.test.mjs` assertion "the copier reports its own refusals" to expect exactly one `door_unlock_failed` with reason `wrong_card` and no toast.

- **m3. No sign the badge was refused.** At the same point the reject sound plays and the copier opens on "At the reader", with no line saying the badge was tried and refused (shot `acl-keycard-refused-copier-at-reader-1400x1000.png`). The refused card is still offered as "Tap Visitor card 07", which invites a second request that the server will refuse again. Fix: pass `refusedKeycards: accessKeycardIds` to the reader params and, in `showDoorScreen` (`rfid-ui.js:185`), show a dim line under the reader head ("Your badge was refused. Try a saved card.") and leave those cards out of "Tap a card you hold" (or mark them refused). Test in `rfid-door-screen.test.mjs`.

- **m4. Test scenario signs describe the old flow.** `test_access_doors` signs D2 (`:108`), D3 (`:191`), D4 (`:260`) and D5 (`:319`) say the door "opens" or "says Reader requires full authentication" once the copy is saved. Now the copier opens and the player must press Emulate. Fix: add "Emulate it at the door" to each sign (D4: "Emulate it at the evidence store: Reader requires full authentication"). Spoken-lines rule does not apply (signs are text objects). Run the validator after.

### Other door kinds and cases

- Non-access-list doors: `rfidAccessList` false, so step 2 is skipped and steps 1a, 1b and 3 run as before. Correct.
- RFID locks with `requires` and an access list: `requires` matches still go through 1a/1b with the old local decision. A non-matching player goes to step 2 with `requiredCardIds` set, and the access-list branch in `handleEmulate` runs before `isCorrect`, so the server decides. Correct.
- No copier: keycards refused gives the refusal toast and event as before; no keycards gives "Requires RFID keycard". Correct.
- Copier with no saved cards: keycards refused gives the toast (no copier), matching sign D2. Correct.
- **m5. Pre-existing edge: copier opens in browse mode at an access-list door.** With a copier, only cancelled (or id-less) keycards and no saved cards, step 2 is skipped (`accessKeycardIds` empty, `copierHasCopies` false) and step 3 calls `startRfidReader()` without `accessList` (`unlock-system.js:1247-1249`). `requiredCardIds` is `[]`, so `isLockingAttempt` is false and the copier opens on its main menu, where tapping the cancelled card starts a clone read. Not introduced by this slice, but the slice owns this branch now. Fix: in step 3, when `rfidAccessList` is true, open with `{ accessList: true }` (the cancelled card is then refused at the reader as "Card cancelled"), and add a case to `access-rfid-acl.test.mjs`.

### Copier closed before the answer

Within one copier the yes is applied once: the success hold either completes (`complete(true)` then `onComplete` with `serverResponse`) or, if the copier is gone, calls `late()`; never both (`rfid-minigame.js:295-309`). `onComplete(false)` from the X returns at once. The test "closed during the success hold" pins this. It cannot open the wrong door: the closure holds the lock the request was for, and the server has unlocked that one.

- **M1. A late yes on an object pops the container open wherever the player is.** `onLateAccessUnlock` calls `applyRfidAccessUnlock`, which calls `unlockTarget` (`unlock-system.js:1121-1128`, `:1166`). For an object with contents, `unlockTarget` auto-launches the container minigame after 500 ms (`unlock-system.js:1411-1416`), and `handleContainerInteraction` (`interactions.js:2095`) checks neither range nor an open minigame. A player who closed the copier at an access-list cabinet and walked off, or opened a conversation, gets the cabinet's container window replacing whatever is on screen. Fix: give `unlockTarget` an option (`{ autoOpen: false }`) and pass it from the late path, so a late object unlock marks the object unlocked, takes the contents, shows the toast and leaves the container for the player to open; or launch only when `window.MinigameFramework.currentMinigame` is null and the object is in interaction range. Test in `access-rfid-acl.test.mjs`: late yes on an rfid object with contents does not call `handleContainerInteraction`.

- **m6. Two copiers on the same door can both apply the yes.** Close the copier while the request is out, touch the door again (still locked client-side): a new keycard request, then a second copier. The first copier's late yes opens the door under the new copier, and an Emulate in the new one also gets a yes (the server grants an unlocked door), so `unlockDoor`, `door_unlocked` and the success toast run twice. Fix: in `applyRfidAccessUnlock`, return early when the target is already unlocked client-side (`lockable.doorProperties?.locked === false`, or `scenarioData.locked === false` for an object), and close an open copier for that lock when the late yes lands. Test: two `startRfidReader` instances on one lock, both answered yes, one `door_unlocked`.

- **m7. A tap at the reader shows nothing while the server answers, and a second card waits silently.** A held-card tap in access-list mode leaves the list on screen with no busy state (`rfid-minigame.js:145-155`). Choosing Emulate on another card meanwhile shows "Emulating <card B>..." and then, because `_askAccessList` returns early on `_accessPending` (`:272`), shows the first card's answer ("this reader doesn't take <card A>") under card B's emulation screen. Fix: show a "Checking..." line on tap (as Emulate shows "Emulating..."), and disable the door list entries while `_accessPending` is true, so the second choice cannot start.

## 3. UI

- Corners: the copier frame's corners in the shots are stepped in whole-pixel steps (checked at 10x on the top-left corner of `acl-keycard-refused-copier-at-reader-1400x1000.png`), from the clip-path in `rfid-minigame.css:31-109`. That is the stepped-corner exception the user approved; `rfid-minigame.css` has no `border-radius`. No finding.
- Empty area below the buttons: the device rule ("a device has one frame at one size across all its views") takes precedence over "frame wraps content" for a device, so the copier should keep its size. No finding. (m3's refusal line would use some of the space.)
- **m8. The copier icon is drawn at a different pixel size from the hand and does not look like the copier.** At x4 each icon pixel is 4 screen pixels; the hand beside it is drawn at x2 (`menu-icons-zoom-1400x1000.png`), so the two menu icons have different pixel densities in the same menu. The icon is also landscape (16x11 content), while the copier's world sprite (11x22) and its on-screen frame are portrait, so it reads as a generic orange box or radio. It is awaiting the user's approval in any case. Fix: redraw at 32x32 and show at x2 (the hand's density), portrait, with the copier's screen at the top and the button below, in the frame's colours; update `COPIER_ICON_SCALE` to 2 and the size check in `action-menu.test.mjs`. Put both versions on the approval page.
- Focus, keyboard, Esc on the reader screen: unchanged from slice 3a. The door list takes focus (`showList`), refusals take focus and accept Enter or Space, and Esc closes through the base minigame handler. The new path adds one gap (m7: no busy state while a tap is answered). Esc while a request is out goes through the late path correctly (subject to M1).
- Out of scope, noted only: the close X in the shots sits at the page's top-right, outside the copier frame; the design language wants it inside the frame. Pre-existing; belongs in a later copier pass.

## 4. Tests

- The tests pin the right behaviour: keycards only in the first request, one id per Emulate, no second unlock call, local refusals send nothing, no-answer is a notice, the late path applies once per copier. The Rails pins cover the server side the brief asked about.
- **m9. Some assertions reach into internals.** `rfid-door-screen.test.mjs` asserts the whole `g.gameResult` object with `deepEqual` and calls `g._endDenial()` between cases; a field added to the result or a renamed private would break them without a behaviour change. Fix: assert `gameResult.serverResponse` and `cardName` only, and end the denial by the public path (advance the stubbed timer, or dispatch a click on the screen).
- Missing cases, to add with the fixes above: M1 (late object yes does not auto-open), m6 (two copiers, one `door_unlocked`), m2 (one event on the badge refusal).
- Harness copy lists: no new static imports in the diff (checked `^+import` in `public/`), so no list changes are needed. The new PNG is read by path in `action-menu.test.mjs`, not imported.

## Counts

B 0, M 1, m 9.
