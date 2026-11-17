# UX slice 4 review, round 2 (wearables, with slice 16 merged in)

Branch `build/ux-slice4` at 56bfc1f85. Diff reviewed: ae9f4a6ea..HEAD (slice 4 work and the merge resolution), with a8f74b3b8..HEAD where it matters. Read with R1, the build log, the R1-fix shots in `scratchpad/ux-shots/slice4-r1fix/` and slice 16's newer tip (`build/ux-slice16`, 11 commits past ae9f4a6ea).

Verdict: the merge is correct, every R1 fix is real, and the phone tray now works. Nothing blocks the merge. The m items below can go in a follow-up, and the two new icons still need the user's approval.

## 1. Merge resolution

- `notifications.js`, `notifications.css`, `apply-actions.js`, `scripts/scenario-schema.json` and `notifications-plain-default.test.mjs` are byte-identical to slice 16 at ae9f4a6ea (`git diff --stat ae9f4a6ea..HEAD` on them is empty).
- `closeButton` plumbing is gone from the engine, CSS, schema and scenarios. The one remaining `closeButton` is in `test/js/apply-actions-hint-give.test.mjs:250`. It passes a stale key on purpose, to show that `confirm_action` ignores it and still calls `gameConfirm` with exactly three arguments. Keep it.
- `CONFIRM_ON` / `CONFIRM_OFF` are gone. `offerAfterTake` passes slice 16's `PUT_ON_LABELS`.
- The lab hook has one `confirmLabel` / `cancelLabel` pair, Put it on / Leave it off (`lab_physical_pentest/scenario.json.erb:1021-1022`). R1's M1 is fixed.

### Against slice 16's newer tip

`git merge-tree --write-tree HEAD build/ux-slice16` merges with no conflicts (tree de8d6d24d). I exported that tree to the scratchpad and ran the test files that either branch touched. All of them pass:

| File | Pass |
|---|---|
| inventory-tray-narrow | 5 |
| wearables | 33 |
| wearable-take-offer | 5 |
| inventory-menu | 21 |
| apply-actions-hint-give | 11 |
| notifications-plain-default | 13 |
| confirm-holds-keys | 10 |
| hud-caption-wrap | 3 |
| info-label-proximity | 6 |
| person-chat-pixel-art | 3 |

Other files failed in the partial export, but only because of what the export left out (no Ruby validator, missing assets). The orchestrator's merge-batch suite covers those.

The textual merge is clean, but one change interacts. Slice 16 R2 m1 makes `setHudLabel` show a 1.5 s label on screens that cannot hover, where it used to do nothing. Slice 4's `refreshHoveredLabel` calls `setHudLabel` on every tray refresh, so the two now combine (m1).

Slice 16's `gameConfirmOpen(text)` still returns "any confirm open" when called with no argument, which is how `offerSkipReason` calls it. Its held-key guard also protects the take offer: a held arrow cannot move focus to Put it on.

## 2. R1 fixes

| R1 | Real? | Evidence |
|---|---|---|
| M1 duplicate lab keys | yes | one label pair at 1021-1022 |
| M2 closeButton | yes | see section 1 |
| M3 phone tray | yes | see section 3 |
| m1 menu icons | yes | `inventory-menu.js:128-138`; shots `wear-c`, `lab-c` |
| m2 stale hover label | yes | `inventory.js:157-168`; `wear-l` shot; test in `inventory-tray-narrow` |
| m3 offer over a confirm | yes | `wearables.js` `offerSkipReason` checks `gameConfirmOpen()` |
| m4 asks twice | yes | README guidance; test_wearable's `confirmOn` now carries a risk, and the jacket has no confirms |
| m5 Examine on the lab vest | yes, with a gap | m4 below |
| m6 toast and "Taken:" | yes | `interactions.js:1999-2006`; `wear-a` has no toast, `wear-k` (retake) has the toast |
| m7 tests | yes | watcher during the offer, server refusal, busy under a confirm, give_item with no offer, one caller of `offerAfterTake` |

## 3. Phone tray (M3)

- **Ring and health.** At `max-width: 480px` the group is 80 px wide (`ui-themes.css:654-672`). At 390 four slots fit beside the ring, as `tray-c-tray-start-390x844.png` shows. Health moves to `position: fixed` above the ring. No shot shows hearts, though: neither the lab nor test_wearable draws any health at any width (m3).
- **"More items" cue.** It uses the small-button skin. The chevron is 7x4, drawn at 4x, a whole-number scale. The tap target is 44 px wide and as tall as a slot. The aria label changes to "Back to the first items" at the end of the strip. The cue is hidden when nothing overflows, and the `tray-overflows` end padding (52 px) lets the last slot clear it. In `tray-a-tray-390x844.png` the last slot ends at x 332 and the cue starts at about 348. Good.
- **Fresh take scrolled into view.** In `tray-390x844.json` the step "five items, newest in view" has `scrollLeft` 114 equal to `overflow` 114, with the vest fully on screen at x 272, width 60. A slot restored on reload is not scrolled (`trayRestored`), which is right.
- **Pixel scrollbar.** `show.html.erb` puts `.pixel-scroll` on the strip. The smooth 8 px rules with `border-radius` are gone from `hud.css` and `inventory.css`. At 390 it measured 14 px. Real phones draw overlay scrollbars, so on a phone the cue is the signal and the pixel scrollbar is what a narrow desktop window shows.
- **800x600 and 915x412.** All five slots fit and there is no cue (`tray-a-tray-800x600.png`, `tray-a-tray-915x412.png`). Both sizes keep the 252 px group. Slice 16's phone caption rule (`bottom: 200px` with combat) matches 800x600 but only applies with Punch and Block present, and the lab has no combat. I found no overlap with it in these shots. With combat and a classic scrollbar, the stacking needs m2.
- **Ring scrolls off with the strip.** I accept the builder's choice. The avatar's only action, Player Settings, is also in the game menu as Character (`game-menu.js:134`), and before this slice the 252 px group scrolled with the strip too, so nothing regressed. One cost: on a phone with five or more items, putting on a take scrolls the ring away, so the player does not see the costume change on the portrait. For the backlog: a sticky ring with an opaque backing box of its own (so slots do not show through the translucent bar backing), if playtests ask for it.

## 4. The new icons

`menu-drop.png` and `menu-examine.png` are 32x32, shown at 2x like `hand_frames.png`. I compared them at 6x with the open hand, the fist and `talk.png`:

- They use the same dark plum outline (44,24,41) as the hands. Each has seven or eight colours, with no anti-aliasing and no stray pixels.
- Drop is a crate over a down arrow over a floor line, and reads as "put it down here". Examine is a magnifier with a highlight on the glass, the common verb icon.
- At menu size (`wear-c-tray-menu-put-on-icons-1400x1000.png`, `wear-c-…-390x844.png`, `lab-c-vest-menu-390x844.png`) both are crisp and the same visual weight as the item picture above them.

I recommend the user approves both.

## 5. m5 consistency

Put on plus Examine for a non-droppable wearable with observations is the right outcome. The rule behind it is narrower than the one used everywhere else, though (m4).

## 6. Leftover lab hook text

It is wrong, but only a little. A click now opens a two-entry menu, so "click it there to put it on" is one step short. The player still reaches Put on, so I rate it m (m5). The rest of the lab already uses the pattern "click it in your inventory and choose Drop here", so the fix only needs to match it.

## 7. Scrollbar claims

- This round's final shots show scrollbars. `tray-390x844.json` measures 14 px, and every 390 shot has the band described in m7. The `probe/` shots (before and after) were taken with scrollbars hidden. They support no scrollbar claim, and none is made from them.
- The 800x600 and 915x412 JSON report a scrollbar of 0 because nothing overflowed. That says nothing about the scrollbar's width at those sizes.
- R1's M3 said the strip "shows no visible scrollbar". That rested on R1 shots, which probably had scrollbars hidden: on a desktop the old 8 px smooth scrollbar would have shown. M3's conclusion still holds for phones, which use overlay scrollbars.

## Findings

### m1. A tray refresh shows the last-tapped item's label on phones once slice 16's newer tip is merged

`public/break_escape/js/systems/inventory.js:164-168`. Mobile browsers keep `:hover` on the last tapped element. After slice 16 R2 m1, `setHudLabel` on a no-hover screen shows a 1.5 s label and adds a capture `pointerdown` listener. Every `refreshInventoryTray` (each wear, take off, take or badge change) would then flash the name of the last-tapped tray item over the room.

Fix: return early from `refreshHoveredLabel` when `matchMedia('(hover: none)')` matches. Better, export `cannotHover` from `ui/info-label.js` and use it, since `inventory.js` already imports from there, so no harness copy-list change is needed. Add a case to `inventory-tray-narrow.test.mjs` with a `(hover: none)` `matchMedia` stub that expects no label.

### m2. The strip grows by `--tray-scrollbar`, but the things stacked above it do not move

`public/break_escape/css/ui-themes.css:571-572` (`#hud-info-label` at bottom 148, `#npc-bark-container` at 108) and `public/break_escape/css/hud.css:121-126` (`#combat-buttons` at bottom 116, `--combat-strip-height`). In a narrow desktop window with a classic 14 px scrollbar and an overflowing strip, the strip is 122 px tall:

- Punch and Block (bottom 116) overlap it by 6 px.
- At 900 px and wider, the buttons are centred on 108, not 122.
- At 480 px and narrower, the hearts (fixed at 122 to 154) overlap a caption at 148.

Phones are unaffected, because overlay scrollbars measure 0.

Fix: add `+ var(--tray-scrollbar, 0px)` to those three bottoms and to `--combat-strip-height` in `ui-themes.css:517-520`.

### m3. The health placement at phone width is not proven

`public/break_escape/css/ui-themes.css:665-671`. No shot in this round shows hearts or the bar at 390. Fixed positioning inside the zoomed strip, with `zoom: 1` on the health container, is easy to get wrong, and on a phone the hearts now share the space above the strip with slice 16's raised caption and with Punch and Block.

Fix: take one 390x844 shot in a test scenario with combat. It should show the hearts, then the bar style, with Punch and Block up and a long caption showing, and the strip both at its start and scrolled to the end.

### m4. The Examine rule for a non-droppable wearable reads `observations` only, as a plain string

`public/break_escape/js/systems/inventory-menu.js:97`. `examineHeldItem` shows `observations` or `text`, after conditional variants (`examineTextFor`, `interactions.js:798`). A carried wearable with only `text`, or with variant observations, gets no Examine, and its click stays the one toggle. Every droppable item gets Examine whether or not it has text, so the two rules differ.

Fix: use `resolveObjectField(data, 'observations', null) || resolveObjectField(data, 'text', null)` from `utils/conditional-text.js`. Importing `interactions.js` would make an import cycle. Add the new import to each JS test harness copy list that copies `inventory-menu.js`. Add a test with a `text`-only carried wearable.

### m5. Lab and test-scenario text still says a click puts the item on

These lines still describe a click that puts the item on:

- `scenarios/lab_physical_pentest/scenario.json.erb:1028` (hook observations)
- `scenarios/lab_physical_pentest/scenario.json.erb:1012` (the onRemove hint)
- `scenarios/lab_physical_pentest/scenario.json.erb:1066` (the changing locker hint)
- `scenarios/test_wearable/scenario.json.erb:102` and `:113` (vest and jacket observations)

Fix: match the lab's own Drop here wording. For example, 1028 ends "Take it and it goes into your kit: click it there and choose Put on, out of sight of the staff", and 1012 and 1066 say "click it there and choose Put on". Run the validator on both scenarios afterwards.

### m6. Tray pictures over 64 px are shrunk by a fraction in the menu

`public/break_escape/js/systems/inventory-menu.js:136`. `1 / Math.ceil(big / 64)` halves or thirds the picture. That breaks the whole-number icon rule and the no-downscaling rule for pixel art. Today's wearables are small (the vest is 30x25, drawn at 2x), so nothing shows it yet.

Fix: when the picture is larger than 64 px, use the shared open-hand icon (`openHandIcon()`, the world menu's look for using a thing) in place of a shrunk picture, and add a test case.

### m7. Every 390 shot this round has a 15 px band at the right edge (backlog, likely not slice 4)

Every `slice4-r1fix/*-390x844.png` has a flat #333 band at x 375 to 389, drawn under the HUD (captions and menus cover it), so the room canvas stops 15 px short. Earlier rounds' 390 shots, which hid scrollbars, do not have it. It looks like the canvas was sized while a page scrollbar briefly existed during load: `body` in `css/main.css:2-11` has no `overflow: hidden`, and `#game-container` is `100vw`.

Fix: reproduce on main with scrollbars shown. If it appears there, put it in the backlog: `overflow: hidden` on `html, body` in the game view, and a Phaser scale refresh after load. If it does not, find which slice 4 change causes it before merging.

## Counts

B 0, M 0, m 7 (m1 to m7).

Merge verdict: ready to merge after slice 16. Fix m1 when slice 16's newer tip is merged in, because that is when it starts to show on phones. m2 to m6 can go in a follow-up. m7 needs one check on main. The user still needs to approve the two new icons, and I recommend both.
