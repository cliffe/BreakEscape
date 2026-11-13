# UX slice 4: wearable click (build log)

Branch `build/ux-slice4`, from batch 27 (a8f74b3b8). Plan: `docs/achitechture/UX_FEEDBACK_ROUND_PLAN.md` on `build/ux-feedback`, section "Slice 4: wearable click" and row main2-26.

## The user's decision (q91)

"Only from the inventory -- Interacting with the item in game, take it and adds it to inventory, then the player can click it to put on the disguise -- could potentially ask them if they want to equip when the first take it."

Read with q99 (a confirm keeps its two named buttons and has no X).

## What changed

- A click on a wearable in the world takes it, with no menu (as before). When that take makes a new tray slot, `wearables.offerAfterTake` asks once: "Taken: <name>. Put it on now?", buttons Put on and Not now, no X.
  - Put on goes through `putOn` with no second confirm, so the server's `POST wear`, the unseenOnly watcher check, the one-at-a-time swap and `onWear` all run exactly as from the tray.
  - Not now leaves it carried. It is not asked again for that item in this page load.
  - Not asked when it would only be refused (someone watching under unseenOnly, for the item or for the worn item that would come off), when the item is already worn, or while a minigame or menu is open.
  - Only the generic world pickup asks (`interactions.js`, after `announcePickup`). NPC gifts, container takes, `give_item` actions and reload restores do not, so a scenario's own `wear` action is never raced by a question.
- Put on, Take off, Drop here and Examine stay on the tray item (`inventory-menu.js`, unchanged): a droppable wearable opens its menu; a non-droppable one (the lab's carried vest) keeps its one click, the confirm.
- The wearable confirms (`confirmOn`, `confirmOff`) name their buttons, Put on / Not now and Take off / Keep it on, and have no X. Esc still answers no.
- `gameConfirm(..., { closeButton: false })` leaves the X out and adds `game-confirm-no-close`, whose message keeps no room for the X and whose buttons keep each label on one line (they wrap as whole buttons on a narrow screen). Every other confirm keeps its X.
- `confirm_action` takes `closeButton: false` (opt-in, in the schema). The lab's hook offer uses it, with confirmLabel Put on and cancelLabel Not now, so both "put it on now?" questions look the same.
- `test_wearable` signs W1, W2 and W4 describe the new flow.

## Server and sync

No server change. The server still owns the worn record and the worn global (`POST wear`). The offer adds no synced state: the "already offered" record is an in-memory set of item ids per window, at most one entry per wearable in the scenario, never saved or sent. Each Put on or Take off sends what it sent before (one `POST wear` with `item_id` and `worn`). Cost of keeping it in memory: after a reload, a wearable that was dropped and is taken again is offered once more.

## Tests

- `test/js/wearables.test.mjs`: confirm labels and `closeButton: false` for put on and take off; offer asked once (Put on wears it with one post and onWear, no confirmOn); Not now leaves it carried and is not asked again; skipped when watched (item or swap), worn, busy, not held, not a wearable; the offer text.
- `test/js/wearable-take-offer.test.mjs` (new): the real `interactions.js` with stubbed imports: a world wearable is taken and then offered, with no menu; no offer for an "already" or refused add or a non-wearable; a held wearable's click is the tray toggle, not an offer.
- `test/js/notifications-plain-default.test.mjs`: a confirm without the option keeps its X and both buttons; `closeButton: false` has no X, named buttons, and Esc cancels and closes it; the html form drops the X too.
- `test/js/apply-actions-hint-give.test.mjs`: `confirm_action` passes `{ closeButton: false }` only when set.
- Validator: `test_wearable` and `lab_physical_pentest`, 0 ❌ each (1 and 5 warnings, as before).

Suite counts are in the report for the final commit.

## Live proof

Keyless server on :3064, setFPS(20) with fixed steps, scrollbars shown, new games only. Shots in the scratchpad `ux-shots/slice4/` (PNG), each step's state in the JSON beside them.

- test_wearable, 1400x1000 (game 2941) and 390x844 (game 2951): `wear-a` take offer (no X, Put on / Not now); `b` Not now, carried; `c` tray menu Put on / Drop here / Examine; `d` put-on confirm; `e` worn (frame, label, costume); `f` tray menu Take off; `g` take-off confirm, Take off / Keep it on, then Esc leaves it on; `h` Examine; `i` jacket take offer while the vest is worn; `j` Put on swaps to the guard costume, vest_on false; `k` vest dropped and taken again: no second offer.
- lab_physical_pentest, 1400x1000 (game 2952) and 390x844 (game 2953): `lab-a` the hook's own offer, now Put on / Not now with no X; `b` the carried vest's confirm; `c` worn, courier_ready true.

## Noticed, not changed

- At 390x844 the tray runs past the right edge: the vest's slot centre is at x 396, so the proof clicks it through the DOM there (`offscreenTray` in the JSON). Not caused by this slice.
- The tray hover label can stay stale ("Hi-vis vest (worn)" after it came off) while the pointer rests on the slot. It is set on mouseenter only.
- Menu entries in the tray menu have no icons (the design rule asks for icons on menu entries).
- Every other confirm still has its X (the plan keeps that for a later pass).

## Handover

Done. Commits: bf83e3ca9 (offer, labels, no X, tests, signs), 8e6b9abc1 (confirm_action closeButton, lab offer, button wrap).
