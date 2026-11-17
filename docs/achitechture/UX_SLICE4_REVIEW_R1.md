# UX slice 4 review, round 1 (wearable click)

Branch `build/ux-slice4`, diff a8f74b3b8..a4d49ab98. Read with the build log, the slice 4 shots (test_wearable and lab_physical_pentest, 1400x1000 and 390x844), slice 16's branch (`build/ux-slice16`, b9a89b86a) and its R1 review.

Verdict: the behaviour matches q91 and the server path is untouched. The slice cannot merge as it stands after slice 16: four files conflict, and one scenario merges silently into a broken object. Fix the merge items (M1, M2) and the phone tray (M3), then it is ready.

## 1. Fit with q91

q91: a world click takes the item; the player puts it on from the inventory; optionally ask once on the first take.

- World click: `interactions.js:1992-1998` takes the item, no menu, then `offerAfterTake` asks once. Matches.
- Put on, Take off, Drop and Examine live on the tray item (`inventory-menu.js:99-107`). Keeping the tray menu for droppable wearables is right: q91 moves the actions to the inventory, and the inventory needs Drop and Examine as well as Put on, so three entries is a real menu (not a one-item menu the design rule forbids).
- The offer is skipped when it could only lead to a refusal, when the item is already worn, and when something else is open. That is sensible.

No finding against q91 itself. Two smaller points are m4 and m5 below.

## 2. Overlap with slice 16

A trial merge of slice 4 onto slice 16 (`git merge-tree build/ux-slice16 build/ux-slice4`) gives:

| File | Result | What clashes |
|---|---|---|
| `public/break_escape/js/systems/notifications.js` | conflict | slice 16 removes the X from the template and adds focus, keyboard and `gameConfirmOpen`; slice 4 removes the X only when `closeButton === false` (`notifications.js:470-475`, `514-520`) |
| `public/break_escape/js/systems/wearables.js` | conflict | slice 16 `PUT_ON_LABELS` / `TAKE_OFF_LABELS` arrays (`['Put it on','Leave it off']`, `['Take it off','Keep it on']`); slice 4 `CONFIRM_ON` / `CONFIRM_OFF` objects (`wearables.js:33-34`) and the default `confirm` passing `{ closeButton: false }` (`wearables.js:128-130`) |
| `test/js/wearables.test.mjs` | conflict | both rewrite the default-confirm assertion with different labels and argument shapes |
| `test/js/notifications-plain-default.test.mjs` | conflict | slice 4's "a confirm without the option keeps its X" contradicts slice 16's "gameConfirm has no close X" |
| `scenarios/lab_physical_pentest/scenario.json.erb` | merges silently, broken | the hook's `confirm_action` ends up with `confirmLabel` and `cancelLabel` twice (slice 4's "Put on"/"Not now" above `text`, slice 16's "Put it on"/"Leave it for now" below it) plus `closeButton: false` |
| `public/break_escape/css/notifications.css` | merges, redundant | slice 4's `.game-confirm-no-close` rules (`notifications.css:154-166`) repeat slice 16's general `flex-wrap`, `nowrap` and full-width message |
| `public/break_escape/js/systems/apply-actions.js` | merges | both edits sit side by side; slice 4's `closeButton` push (`apply-actions.js:415-417`) becomes dead code |
| `scripts/scenario-schema.json` | merges | slice 4's `closeButton` field (`scenario-schema.json:5266`) describes an X that no longer exists |
| `public/break_escape/js/systems/interactions.js`, `scenarios/test_wearable/scenario.json.erb` | merge cleanly | different hunks |

### Recommended labels (one set, all 12 characters or fewer)

One concept, one pair of buttons (the design rule). The put-on question is the same question wherever it appears, so it gets the same answers:

| Question | Confirm | Cancel |
|---|---|---|
| Take offer ("Taken: <name>. Put it on now?") | Put it on | Leave it off |
| Tray put-on confirm (`confirmOn`) | Put it on | Leave it off |
| Lab hook offer (`confirm_action`) | Put it on | Leave it off |
| Tray take-off confirm (`confirmOff`) | Take it off | Keep it on |

These are slice 16's constants, so slice 4 adopts them instead of adding its own. "Leave it off" mirrors "Keep it on", and still reads as "not now": the question says "now", and the lab text already tells the player they can put it on from the kit later. The lab's cancel moves from slice 16's "Leave it for now" (16, at the limit) to "Leave it off" (12). The tray menu entries keep their short verbs ("Put on", "Take off", `wearables.menuLabel`): a menu entry names the action, and a button answers a question.

### M1. The lab scenario merges silently into duplicate keys

`scenarios/lab_physical_pentest/scenario.json.erb:1020-1022` (slice 4) and slice 16's two lines after `text`. Git reports no conflict. JSON parsers keep the last value, so the result looks fine in game but is invalid by intent and hides which labels are meant. The validator may not catch duplicate keys.

Fix: on slice 4, delete the three lines at 1020-1022 (`confirmLabel`, `cancelLabel`, `closeButton`). Slice 16 supplies the labels; whoever merges second changes slice 16's `"cancelLabel": "Leave it for now"` to `"Leave it off"`. After the merge, grep the hook object for a single `confirmLabel` and run the validator on the lab.

### M2. The `closeButton` option conflicts with slice 16's design

Slice 16 makes no-X the default for every `gameConfirm`. Slice 4's opt-in option, its CSS class, its schema field and its `confirm_action` plumbing are then all redundant, and they conflict in four files.

Fix, so slice 4 merges cleanly after slice 16 (rebase or merge `build/ux-slice16` into `build/ux-slice4` first, then make these changes):

1. `notifications.js`: take slice 16's version whole. Drop the `closeButton` comment and the `noClose` branch (slice 4 lines 470-475 and 514-520).
2. `notifications.css`: delete the `.game-confirm-no-close` block (slice 4 lines 154-166). Slice 16's `.game-confirm-buttons` rules cover it.
3. `apply-actions.js`: restore the single `window.gameConfirm(text, label(...), label(...))` call. Delete `confirmArgs` and the `closeButton` comment (slice 4 lines 405, 415-417). Keep slice 16's `gameConfirmOpen` guard.
4. `scripts/scenario-schema.json:5266`: delete the `closeButton` field.
5. `wearables.js`: take slice 16's `PUT_ON_LABELS` / `TAKE_OFF_LABELS` and its default `confirm` (`labels[0]`, `labels[1]`, no options). Delete `CONFIRM_ON` / `CONFIRM_OFF`. In `putOnNow`, `takeOffNow` and `offerAfterTake` (slice 4 lines 229, 299 and 376), pass `PUT_ON_LABELS` / `TAKE_OFF_LABELS`. Keep `OFFER_TEXT`, `offerText`, `offerSkipReason` and `offerAfterTake`.
6. Tests:
   - `notifications-plain-default.test.mjs`: drop slice 4's added test (the "X stays unless closeButton is false" case). Slice 16's no-X test covers it.
   - `apply-actions-hint-give.test.mjs`: drop slice 4's `closeButton` test. Replace it with one asserting that `confirm_action` passes exactly three arguments.
   - `wearables.test.mjs`: keep slice 16's default-confirm assertion. In the offer tests, assert `labels[0]` deep-equals `['Put it on', 'Leave it off']`.
7. `scenarios/test_wearable/scenario.json.erb:60, 75`: the signs name the buttons. Change "choose Put on" (in the offer) to "choose Put it on", "Not now" to "Leave it off", "then Put on again in the confirm" to "then Put it on in the confirm", and "Take off in the confirm (Keep it on ...)" to "Take it off in the confirm (Keep it on ...)". Keep "choose Put on" where it names the tray menu entry.
8. Build log: update the "What changed" bullets on `closeButton`, and remove "Every other confirm still has its X".

## 3. Cheating and sync

No findings.

- Put on from the offer calls `putOn(id, {}, deps)` (`wearables.js:377`). That is the same path as the tray: `refused()` runs before the post, so a watcher who walks in while the offer is open still refuses it. The server's `POST wear` and the one-at-a-time swap run, and `onWear` runs after the server accepts. The server is unchanged and still owns the worn record and the worn global.
- The offer skips nothing the server checks; it only skips asking.
- The "already offered" record is a `WeakMap` keyed by window holding a `Set` of item ids (`wearables.js:330-340`). It is held in memory, never saved or sent, and bounded by the number of wearables in the scenario. No new synced state. Each Put on or Take off sends what it sent before: one `POST wear` with `item_id` and `worn`. The player_state size is unchanged.
- A reload forgets the record, so a wearable taken again is offered once more. That costs one question and grants no access.

## 4. Existing problems seen at 390 px

### M3. The inventory tray runs off the right edge at phone width

Seen in `wear-j-jacket-worn-390x844.png` and `wear-c-tray-menu-put-on-390x844.png`. The vest's slot centre is at x 396 (`offscreenTray` in `wear-390x844.json`), and the jacket is entirely off screen. The cause is in `css/ui-themes.css:459-467`. The themed `#player-hud-buttons` group is a fixed 252 px wide, to make room for the hearts, and that is two thirds of a 390 px screen. The strip scrolls (`hud.css:258-271`, `overflow-x: auto`), but it shows no visible scrollbar or cue, so a phone player cannot tell that the vest they just took is in the tray. This slice makes the tray the only place to put a wearable on, so the defect now blocks a core action on phones. It predates the slice; I rate it M because of that.

Fix (one change, plus a backstop):
1. At `@media (max-width: 480px)`, shrink the group to the avatar ring. Give `[data-ui-theme] #player-hud-buttons` a width of 80 px, and either put the health display above the ring (absolute, `bottom: 100%`) or move it into the top HUD row. That leaves about 290 px, or four 68 px slots.
2. Backstop: when `addToInventory` adds a slot, call `slot.scrollIntoView({ inline: 'nearest', block: 'nearest' })` so a fresh take is always visible. Also give the strip the shared `.pixel-scroll` scrollbar or a "More" chevron (`assets/icons/chevron-down.png`, turned to point right) while `scrollWidth > clientWidth`.

Prove it with a 390x844 shot holding five items, with the newest slot fully on screen.

### m1. Tray menu entries have no icons

`inventory-menu.js:160-165` maps entries to `{ label, detail, disabled, onSelect }` with no `icon`. `ui/interaction-menu.js:202-215` already draws `icon.src` / `icon.frame`. The design rule says menu entries carry icons. Seen in `wear-c-…-390x844.png` and `wear-f-…`.

Fix: add an `icon` to each entry in `inventoryMenuFor` and pass it through `openInventoryItemMenu`. Reuse the icons the world interaction menu already uses for the same verbs (one look per concept): the item's own tray sprite for Put on and Take off, a drop icon for Drop here, and the examine icon for Examine. If no drop icon exists, make one as 16x16 pixel art at 2x. This is not specific to wearables; every droppable item's menu gets the icons.

### m2. The tray hover label goes stale after Put on or Take off

`inventory.js:904` sets the label on `mouseenter` only. After a toggle, `refreshInventoryTray` and `decorateSlot` redraw the frame and the "(worn)" mark, but the label still says "Hi-vis vest (worn)" until the pointer leaves. On a desktop it misleads. Slice 16's `info-label.js` change only silences hover labels on screens that cannot hover.

Fix: at the end of `wearables.decorateSlot` (or in `refreshInventoryTray`), when `slot.matches(':hover')`, call `setHudLabel(inventoryHoverLabel(item.scenarioData))`. Add a node test that toggles a hovered slot and reads the label.

## Other findings

### m3. The take offer does not check for an open confirm

`wearables.js:356` treats a minigame or an interaction menu as busy, but not an open `gameConfirm`. After slice 16, a world wearable whose `triggerOnInteract` or `interactionWarning` opens a confirm could have the offer stack over it. No scenario does this today.

Fix: add `|| w.gameConfirmOpen?.()` to the busy test once slice 16 is in. Extend the "skipped when busy" test with a stubbed `gameConfirmOpen` that returns true.

### m4. Put on from the tray menu asks twice

For a droppable wearable with `confirmOn` (test_wearable's vest), the player picks Put on in the menu and is then asked "Put the hi-vis vest on?" (`wear-c` then `wear-d`). That is two steps for one choice. The confirm is useful when `confirmOn` carries a warning (the lab's costs), but it is the scenario's choice.

Fix: no engine change. Note in the wearable README section that `confirmOn` should say something the menu entry does not (a cost or a risk), and drop test_wearable's plain `confirmOn` if it is only "Put it on?". Ask the user if they want the engine to skip `confirmOn` when Put on came from the menu.

### m5. The lab's carried vest has no Examine in the inventory

`inventory-menu.js:91` gives no menu to a wearable that cannot be dropped, so the lab vest's tray click is the one-click toggle and it cannot be examined from the tray. q91 puts the actions in the inventory; the one-action rule says to act directly. Both readings are defensible.

Fix, if the user wants Examine on every wearable: give a non-droppable wearable a two-entry menu (Put on or Take off, then Examine) and leave the one-click toggle for wearables with no `observations`. Otherwise leave it. This is a question for the user, not a defect.

### m6. "Picked up" toast and "Taken:" both announce the take

In `wear-a-take-offer-390x844.png`, the "Picked up Hi-vis vest" toast is drawn over the Objectives panel behind the offer's backdrop, and the offer itself opens with "Taken: Hi-vis vest." The two say the same thing, and the overlap looks messy at phone width.

Fix: in `interactions.js:1993`, skip `announcePickup` when `offerSkipReason` returns null, since the offer is the announcement. The alternative is to drop the "Taken:" line from `offerText` and keep the toast. Either works; choose one.

## 5. Tests

What is pinned is right:
- the offer is asked once, and Put on wears the item with one post and `onWear` and no second confirm;
- Not now leaves the item carried and is not asked again;
- the offer is skipped when watched (the item, or a swap), when worn, when busy, when the item is not held, and for a non-wearable;
- the real `interactions.js` path takes then offers, gives no offer for an "already" or refused add, and treats a held wearable's click as the toggle.

### m7. Missing tests

1. A watcher enters while the offer is open. Answer Put on and expect `false`, no post, and the refusal toast. This pins the `refused()` re-check on the offer path, which is the cheat-resistance point of item 3.
2. The server refuses the `POST wear` after Put on in the offer. Expect the item not worn and no `onWear`.
3. Gift paths give no offer. Run a `give_item` action and an NPC give for a wearable through their real callers and expect no `offerAfterTake` call. The build log claims this but nothing pins it.
4. After the M2 rework, assert that the offer passes `['Put it on', 'Leave it off']`. This replaces the `{ ok, cancel }` object assertions.

All in `test/js/wearables.test.mjs`, except item 3, which belongs in `test/js/wearable-take-offer.test.mjs`.

## Counts

B 0, M 3 (M1 to M3), m 7 (m1 to m7).
