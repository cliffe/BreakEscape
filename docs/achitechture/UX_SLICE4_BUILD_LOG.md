# UX slice 4: wearable click (build log)

Branch `build/ux-slice4`, from batch 27 (a8f74b3b8). Plan: `docs/achitechture/UX_FEEDBACK_ROUND_PLAN.md` on `build/ux-feedback`, section "Slice 4: wearable click" and row main2-26.

## The user's decision (q91)

"Only from the inventory -- Interacting with the item in game, take it and adds it to inventory, then the player can click it to put on the disguise -- could potentially ask them if they want to equip when the first take it."

Read with q99 (a confirm keeps its two named buttons and has no X).

## What changed

- A click on a wearable in the world takes it, with no menu (as before). When that take makes a new tray slot, `wearables.offerAfterTake` asks once: "Taken: <name>. Put it on now?", buttons Put it on and Leave it off, no X. The offer is the take's announcement: no "Picked up" toast beside it (R1 m6).
  - Put it on goes through `putOn` with no second confirm, so the server's `POST wear`, the unseenOnly watcher check, the one-at-a-time swap and `onWear` all run exactly as from the tray.
  - Leave it off leaves it carried. It is not asked again for that item in this page load.
  - Not asked when it would only be refused (someone watching under unseenOnly, for the item or for the worn item that would come off), when the item is already worn, or while a minigame, menu or another confirm is open.
  - Only the generic world pickup asks (`interactions.js`, after `announcePickup`). NPC gifts, container takes, `give_item` actions and reload restores do not, so a scenario's own `wear` action is never raced by a question.
- Put on, Take off, Drop here and Examine stay on the tray item (`inventory-menu.js`): a droppable wearable opens its menu; a non-droppable one with `observations` (the lab's carried vest, test_wearable's jacket) opens Put on or Take off, then Examine (R1 m5); one with no text keeps its one click.
- The wearable confirms use slice 16's `PUT_ON_LABELS` / `TAKE_OFF_LABELS`: Put it on / Leave it off and Take it off / Keep it on. The take offer and the lab's hook offer use the same put-on pair. Tray menu entries keep the short verbs Put on and Take off. No confirm has an X (slice 16); Esc still answers no.
- From the tray menu, Put on shows one confirm only when the scenario gives `confirmOn` (R1 m4). test_wearable's vest now says something the menu does not (change out of sight); its jacket has no confirm. README_scenario_design.md says to write `confirmOn` only for a cost or a risk.
- `test_wearable` signs W1, W2 and W4 name the new buttons.

## Server and sync

No server change. The server still owns the worn record and the worn global (`POST wear`). The offer adds no synced state: the "already offered" record is an in-memory set of item ids per window, at most one entry per wearable in the scenario, never saved or sent. Each Put on or Take off sends what it sent before (one `POST wear` with `item_id` and `worn`). Cost of keeping it in memory: after a reload, a wearable that was dropped and is taken again is offered once more.

## Tests

- `test/js/wearables.test.mjs`: confirm labels and `closeButton: false` for put on and take off; offer asked once (Put on wears it with one post and onWear, no confirmOn); Not now leaves it carried and is not asked again; skipped when watched (item or swap), worn, busy, not held, not a wearable; the offer text.
- `test/js/wearable-take-offer.test.mjs` (new): the real `interactions.js` with stubbed imports: a world wearable is taken and then offered, with no menu; no offer for an "already" or refused add or a non-wearable; a held wearable's click is the tray toggle, not an offer.
- The X tests in `notifications-plain-default.test.mjs` and `apply-actions-hint-give.test.mjs` went with the `closeButton` option in R1 (slice 16 covers the no-X confirm).
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

These three are fixed in review round 1 (below).

## Review round 1 fixes

Review: `docs/achitechture/UX_SLICE4_REVIEW_R1.md` (B 0, M 3, m 7).

### Merge with slice 16 (M1, M2)

`git merge --no-ff build/ux-slice16` (55779aba7). Conflicts and how they were resolved:

- `notifications.js`: slice 16's version whole (no X on any confirm, focus, keys, `gameConfirmOpen`). Slice 4's `closeButton` option is gone.
- `wearables.js`: slice 16's `PUT_ON_LABELS` / `TAKE_OFF_LABELS` and default `confirm`; slice 4's `CONFIRM_ON` / `CONFIRM_OFF` removed; `offerAfterTake` passes `PUT_ON_LABELS`.
- `notifications-plain-default.test.mjs`: slice 16's no-X test; slice 4's X test dropped.
- `wearables.test.mjs`: slice 16's default-confirm assertion, plus slice 4's offer tests asserting `['Put it on', 'Leave it off']`.
- Merged without conflict but reverted to slice 16's file: `notifications.css` (the `.game-confirm-no-close` block), `apply-actions.js` (the `closeButton` push), `scenario-schema.json` (the `closeButton` field).
- `lab_physical_pentest`: the hook's duplicate `confirmLabel` / `cancelLabel` / `closeButton` lines removed; one pair, Put it on / Leave it off (slice 16's).
- `apply-actions-hint-give.test.mjs`: the `closeButton` test replaced by one asserting `confirm_action` passes exactly three arguments.

### The rest (fafc5ce53)

- M3, phone-width tray. At `max-width: 480px` the themed portrait group is the 80 px ring alone and health sits above it (fixed, so the scrolling strip does not clip it); four slots fit beside it at 390. When slots are out of view a "More items" cue (the small button skin, the theme's chevron turned right, or left at the end) sits at the strip's right edge: a tap scrolls a page on, or back to the start. A slot added for a take is scrolled into view. The strip has the shared `.pixel-scroll` scrollbar (`show.html.erb`); the smooth 8 px scrollbar rules in `hud.css` and `inventory.css` are gone, and the strip grows by the scrollbar's height where a classic scrollbar shows (`--tray-scrollbar`). Logic in `inventory.js` (`updateTrayOverflow`, `revealTraySlot`, `trayOverflowSide`), no new imports.
- m1: every tray menu entry has an icon (`inventoryMenuIcon`): the item's own tray picture for Put on, Take off and Use (whole-number scale, or an exact halving for a picture over 64 px), and two new 32x32 icons drawn by hand for Drop here (`assets/icons/menu-drop.png`) and Examine (`assets/icons/menu-examine.png`), shown at 2x like the hand icon. No icon existed for either (`assets/icons/search.png` is a text placeholder). The new icons await the user's approval.
- m2: `refreshInventoryTray` sets the hover label again when the pointer rests on a tray item, so it never reads "(worn)" for an item just taken off.
- m3: the offer's busy check includes `gameConfirmOpen()`.
- m4, m5, m6: as in "What changed" above. The lab vest's text now says to choose Put on or Take off.
- m7: tests for a watcher walking in while the offer is open (refused, no post, the toast), the server refusing after the offer (not worn, no onWear), busy under an open confirm, the non-droppable wearable's menu, a `give_item` wearable with no offer, `offerAfterTake` having one caller (the world take), the offer replacing the toast, menu icons, the tray cue and reveal, the pixel scrollbar, and the hover label refresh (`test/js/inventory-tray-narrow.test.mjs`, new).

### Suites (on fafc5ce53)

`MERGE_BATCH=1 bin/test-js -j 3`: 603 files passed, 0 failed. `bin/rails test`: 2392 runs, 42555 assertions, 0 failures, 0 errors, 1 skip. Validator: test_wearable and lab_physical_pentest, 0 ❌ each.

### Sync

Unchanged: no new synced state. The cue, the scroll position and the hover label are page state only.

### Live proof (R1)

Keyless server on :3064, new games only (3039 to 3045), `setFPS(20)` with fixed steps, scrollbars shown. Every tray action is a real tap or click at the slot's coordinates; at phone width the proof taps the cue, never a DOM click. Shots and per-step JSON in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/ux-shots/slice4-r1fix/`.

- `wear-*` (test_wearable, 1400x1000 game 3039, 390x844 game 3040): a, offer with Put it on / Leave it off and no toast; b, left off; c, tray menu with icons; d, the one put-on confirm with the vest's confirmOn; e, worn; f, Take off menu; g, Take it off / Keep it on, Esc keeps it on; l (1400 only), the hover label goes from "Hi-vis vest (worn)" to "Hi-vis vest" with the pointer resting on it; h, Examine; i and j, jacket offer and swap; m, the jacket's Take off / Examine menu; k, retaken: no offer, so the Picked up toast shows.
- `lab-*` (1400x1000 game 3041, 390x844 game 3042): a, the hook offer; b, five items; c, the carried vest's Put on / Examine menu; d, one confirm with the costs; e, worn, courier_ready true.
- `tray-*` (800x600 game 3043, 915x412 game 3044, 390x844 game 3045): five items, every slot reached by a real tap (`reach` in the JSON); at 390 the strip opens scrolled to the newest item with the cue pointing left, the pixel scrollbar shows (14 px), and a tap on the cue goes back to the start. At 800 and 915 all five fit.

Proof gotcha: Chrome treats `--hide-scrollbars=false` as the switch being set, so it hides scrollbars. Launch with `ignoreDefaultArgs: ['--hide-scrollbars']` and no `--hide-scrollbars` argument at all (measured: 0 px with the argument, 14 px without).

### Still open

- At 390 the portrait ring scrolls with the strip, so it goes off screen while the strip is scrolled to the end. The cue brings it back. Making the ring sticky would let slots slide under the gradient backing.
- The lab's hook text still says "click it there to put it on or take it off"; a click now opens the two-entry menu. Left as it is.

## Handover

Done. Commits: bf83e3ca9, 8e6b9abc1 (slice), 55779aba7 (merge slice 16, M1, M2, m3), fafc5ce53 (R1 fixes).
