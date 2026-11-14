# UI consoles review, round 5 (build/ui-consoles)

Reviewed tip 8600a2a34: the round 4 fixes (584667414) plus main 61c033b13 merged in. Paths are under
public/break_escape/ unless they start with test/ or docs/. Evidence is in the session scratchpad
folder `ui-consoles-r5/` (logs, shots and the scripts that made them: double.mjs, ov.mjs, nv.mjs,
nv2.mjs, nv3.mjs, specs5.mjs).

Server: tip worktree on :3486, keyless, stopped after the review. Headless shell with scrollbars
shown. Games: 3105 (SCADA historian), 3104 (segmentation map), 3346 (audit), and a fresh
test_access_networks game 3580 (comms room start, lobby unlocked, kit_dropbox given) for the
network view and the shell X check.

Game state: the SCADA report runs stubbed `_executeActions` and never confirmed; the segmentation
map confirm was always cancelled with NO. On game 3580 the drop box was plugged into the comms port
(the step the brief asks for) and left there.

## Verdict

M1 and m1 from round 4 are fixed, live, through the real buttons and the wheel. The merge with main
has broken one thing: on phones a locked file share row in the network view squeezes its text into a
column one or two letters wide (M1 below). A one-rule deletion fixes it, proven live. Fix that, then
merge.

| | B | M | m | n |
|---|---|---|---|---|
| Count | 0 | 1 | 0 | 4 |

## Checks

| Check | Result |
|---|---|
| R4 M1, real clicks: ANNOTATE, ANNOTATE again, wheel to CANCEL, one click. 1400x1000, 390x844, 667x375 | The second click lands on the button at all three sizes and the overlay count stays at 1. One Cancel leaves 0, the scene X comes back, a chart point is hit again, and Esc then closes the scene. double-tip.log, shots/tip-double-*.png |
| R4 m1, wheel 15 notches over the report past its end, same sizes | `.sh-charts` stays at scrollTop 0 at every size; only the overlay scrolls (174 at 390x844, 390 at 667x375). Backdrop gaps 0/81, 0/81, 9/81 (the 9 are the `.sh-charts` scrollbar column, as on the base in R4). double-tip.log, ov-tip.log, shots/tip-double-667x375-wheeldown.png |
| SCADA report and segmentation map confirm, player path (ov.mjs), 1400x1000, 390x844, 667x375 | Same numbers as R4 except 667x375 SCADA, where `sh-charts:0/5` now holds after "down" (R4 had 5/5). Desktop centring 227/227 and 133/133 kept. All cancels close. ov-tip.log |
| Network view after the merge, real path (interact comms_port, Plug it in, then the inventory jack), 1400x1000, 390x844, 320x640 | 1400 and 320 are fine. At 390 the locked "Ledger-Archive" row is 979px tall with a 17px label (M1). No sideways scroll at any size. nv.log, shots/nv-390x844-0.png |
| Same row, one fresh page per CSS file and width (route-served CSS) | Merged: broken at 480, 390 and 375 wide (label 121, 17, 2px). Main's CSS and the merged CSS without the one rule: label 324, 234, 205px, badge under the text, at all widths. nv3.log, shots/nv3-*.png |
| Audit `--strict`, game 3346, 1400x1000, 800x600, 915x412, 390x844 | `window-offscreen 0, frame-offscreen 1 (1), clipped 0, x-on-frame 0, overflow 3 (1)`, exit 1 on the two lines known since R1. The log matches R4 line for line. audit.log |
| Shell X check | `SHELL-X-CHECK 168 checked, 0 failed`; same lines as R4. Run on game 3580 (see n3). shellx.log |
| Regression sweep of every console from its real object at 390x844 and 1400x1000 | NOT DONE. Stopped at the context limit. Fresh games are made and specs5.mjs is ready (sis01 3654, sis02 3655, sis03 3656, exercise station 3657, title-only scenes on 3580). |

Tests, each run alone with plain `node`: minigame-consoles-fit 19, minigame-shell-fit 30,
minigame-close-shell 19, blockchain-mixer-match 7, scada-historian-data 8, engine-fixes-pass4b 10,
escaping-shared-helpers 21, minigame-html-sweep-b 12, minigame-html-sweep-c 13, minigame-pixel-art 48,
minigame-title-escape 24, network-view 51. 262 passed, 0 failed. tests.log

## Findings

### M1 Network view on phones: a locked file share row squeezes its text to one or two letters a line (merge regression)

`css/network-view-minigame.css:387`

```
.network-row-wide > .network-row-label {
    min-width: 0;
    overflow-wrap: anywhere;
}
```

This branch added the rule in 20ee61065 ("network view badge holds its width"). Main has since
solved the same problem its own way: `.network-row-resource .network-row-label { min-width:
min-content; flex: 1 1 0 }` (:256, :350) with `flex-wrap: wrap` on the row, so the badge drops under
the text when they do not fit side by side. Both selectors have the same specificity and the
branch's comes later, so `min-width: 0` wins. With a zero minimum and `flex-basis: 0` the label never
forces the row to wrap; the 195px "Needs account" badge (kept by `flex-shrink: 0`, :383) stays beside
it, and the label gets what is left. The merge was textually clean, so nothing flagged it.

Failure scenario: a player plugs a drop box in and opens the network view on a 390px phone. Under
"File shares" the locked Ledger-Archive row reads "Fil / e / s / h / ar / e / o / n / HB-FS01 / N / e
/ e / d / s ..." down almost a full screen, with the badge 470px below the name. Every phone width
from 375 to 480 is hit (label 2px at 375). 320 and 360 happen to wrap and look right.

Evidence: nv.log, nv3.log, shots/nv-390x844-0.png (merged), shots/nv3-noLabelRule-390x844.png (fixed).

Fix: delete the rule at :387-390. Served live with only that change, the row matches main at every
width tested (1400, 480, 390, 375, 320): badge under the text, label 324/234/205/150px, no sideways
scroll. The `flex-shrink: 0` rule (:383) and the `max-width: 480px` block (:392) are then redundant
with main's rules but harmless; they can go too (the "noBlock" CSS gave the same result). Add a
network-view test that renders a locked share at 390 wide, or a CSS assertion that no later rule sets
`min-width: 0` on a resource label.

## Notes (no change asked)

- n1 R4 suggested `overscroll-behavior: contain` on `.nsm-modal-overlay` as well. It was not added.
  The map does not chain today (`.nsm-wrapper` kept 720 under the overlay at 667x375), so nothing
  to do.
- n2 ANNOTATE stays live and highlighted while the report is open. With the guard
  (`js/minigames/scada-historian/scada-historian-minigame.js:741`) a press does nothing, which is
  fine, but a player may read the highlight as "press me". Cosmetic, matches the base.
- n3 Games 3346, 3104, 3105, 3106 and 3109 now answer 409 (format too new): another branch's server
  upgraded their stored format in the shared database during this review. The first shell X run died
  mid-way on that. Later rounds and the merge batch need fresh games; R4's game ids no longer work
  on this branch.
- n4 On phone sizes the test bridge refuses `interact` and `interactInventory` because the
  objectives panel counts as blocking UI. nv3.mjs hid `#objectives-panel` before opening the
  view; at 1400 the real path works unaided. Bridge behaviour, not this branch.
