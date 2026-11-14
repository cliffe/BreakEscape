# UI consoles review, round 3 (build/ui-consoles)

Reviewed tip 422c55061 (the round 2 fixes, 40d178748..422c55061) against base fc4b4d8a5. Main has
not moved (still fc4b4d8a5). Paths are under public/break_escape/ unless they start with test/ or
docs/. Evidence paths are under the session scratchpad folder `ui-consoles-r3/` (shots, logs and
the scripts that made them: r3.mjs, mx.mjs, modal.mjs, modal2.mjs, svgscale.mjs).

Servers: tip worktree on :3486, baseline worktree on :3487, both keyless, both stopped after the
review. Games: 3346 (audit, shell X check), 3104 and 3105 (pump, drug library, segmentation map,
SCADA historian), 3106 (claims), 3403 (blockchain explorer and the mixer board). Headless shell with
scrollbars shown.

Game state note: the real-click flows severed the segmentation link and noted a drug library source
on game 3104 and completed the historian report on 3105. `network_isolated`,
`mar_charts_drug_referenced` and `drug_library_override` were set back to false on 3104 afterwards.

## Verdict

Most round 2 claims hold live, and the Esc test now fails when the real handler is broken. One
regression from this round blocks a step: on a 360px phone the blockchain mixer board's slot
buttons, now 16px, overflow into the withdrawals column and the correct slot cannot be tapped (B1).
The new "hide the scene X while a confirm is open" rule leaves a portrait phone player stuck in the
SCADA historian report, whose buttons were already out of reach (M1). Fix B1 and M1 before merge;
both are small CSS changes and B1's is proven live.

| | B | M | m |
|---|---|---|---|
| Count | 1 | 1 | 2 |

## Gaps checked

| Gap | Result |
|---|---|
| 1. Shell X check and strict audit on the tip | `SHELL-X-CHECK 168 checked, 0 failed`. Audit `--strict` at 1400x1000, 800x600, 915x412, 390x844 on game 3346: `window-offscreen 0, frame-offscreen 1 (1), clipped 0, x-on-frame 0, overflow 3 (1)`, the two known lines (alarm panel 915x412, network architecture 390x844). The log is line for line the same as R2's. shellx.log, audit.log |
| 2. Mixer board live at 390x844, 360x740, 800x600, 1400x1000 (and 320x640, 915x412) | Footer buttons fit at every size: one row at 1400, 800 and 390, two rows at 360 and 320 (`flex-wrap` works, no button wider than its parent). Slot buttons are 64px at 16px GNF, none overflows its parent. The middle column does not fit its row on phones: B1. bce.log, mx-tip.log, mx-base.log, shots/tip-mx-slots-*.png |
| 3. Pump, drug library and SCADA pop-ups at 1400x1000, 915x412, 390x844, 667x375 (and 360x740) | Pump: scene X hidden while open, the modal stays inside the pump box, MORE BELOW reaches RE-ENTER at 667x375. Drug library: frame in view at every size (scrolls inside at 915x412 and 667x375), shared X in the header row inside the frame, over no text. SCADA: buttons below the window at 390x844 and 360x740, title above the window at 667x375: M1. sheet-pump.png, sheet-dli.png, sheet-scada.png, popflow.log, modal-tip.log |
| 4. Mutation check of the Esc test | Three mutants of `js/minigames/framework/base-minigame.js:216`, each restored with `git checkout --` and `git status` clean afterwards: hook moved after `closeByPlayer()` fails test 14; `return` dropped fails tests 12 and 14; hook call removed fails 12 and 14. Clean run 18/18. mutant1.log to mutant3.log |
| 5. Buttons that grew to 16px, at 390 and 360 (and 320) | No button overflows its box, its parent or the window in the segmentation map, EHR, claims, drug library or SCADA scenes. Wrapping: SEVER wraps to two lines at 360 and 320 (as R2), claims nav buttons two to four lines (label plus status, unchanged rule). Four of the ten rules style no markup at all: m2. bpbtn.log |
| 6. Breakpoint at 1180px | 1181x800, 1200x800, 1280x720, 1366x768, 1400x1000, 1440x900: panel beside the map, wholly in the window, nothing sideways, 19/19 devices inside their zones, action bar in view. 1024x600, 1024x768, 1100x800, 1180x800: stacked, the map 480px tall and in view, the panel below it reached by scrolling the body, nothing sideways. No rule label crosses a zone border at any width. The "!" text boxes touch the WARD 5 and FLEET label boxes (line-box contact only, the glyphs are clear in the shots). SVG drawn at scale 1, so the labels are 16px on screen. bpbtn.log, svgscale.log, crop-nsm-1400.png |

Playability through real clicks (mouse clicks at the element centre, after a hit test), popflow.log,
flows.log, flow2.log:

- Pump, library conflict confirm (1400x1000, 390x844, 667x375): Esc closes the pop-up, scene stays,
  X back, `confirmed` false. Reopen, click RE-ENTER RATE: closed, X back. Reopen, click KEEP THIS RATE:
  `confirmed` true.
- Drug library source pop-up (1400x1000, 390x844): click [REFERENCE], pop-up open, scene X hidden;
  click the pop-up X: closed, scene X back; reopen, Esc: closed, source not consulted; reopen, CONFIRM:
  source consulted.
- SCADA report (1400x1000, 390x844): Esc cancels, [CANCEL] cancels, CONFIRM runs `_onComplete`. At
  390x844 the script's click needed `scrollIntoView`, which can scroll an `overflow: hidden` box; a
  player cannot (M1).
- Segmentation map (1400x1000, 390x844, 667x375): click the "!" marker (rules reviewed), click SEVER,
  confirm open with the scene X hidden; Esc closes it with nothing severed; SEVER again, NO cancels;
  SEVER again, YES severs.

## Findings

### B1 Mixer board: on phones the slot buttons sit under the withdrawals column; at 360x740 the answer cannot be tapped (regression)

`css/blockchain-explorer-minigame.css:767` stacks the three columns of `.bce-mx-body` into one grid
column under 720px, but `.bce-mx-col` keeps `min-height: 0` (:632) and the body has a fixed height
with `overflow-y: auto` (:768), so the implicit rows shrink to share the body height and each column's
content spills into the next row. The OUT column comes later in the DOM and paints over the middle
column's overflow. This round made the slot buttons (`.bce-mx-slot-btn`, :716) 16px, 64px wide, so
the six slots need two rows and the middle column grows by one row.

Failure scenario: an m06 player on a 360x740 phone traces all three deposits, reaches ADDRESS REUSE
and taps slot 4471. The tap lands on a withdrawal card in the OUT column; the board stays untraced
(`traced` false) and the custody step cannot start. Measured after real-click matching:

| Size | Tip: slot buttons under the OUT column | Base |
|---|---|---|
| 390x844 | 8846 (middle content 217px in a 166px row) | none |
| 360x740 | 2207, 3815, 4471 (the answer), 5093 (240px in 107px) | 8846 |
| 320x640 | none (rows fall differently) | all six |

Evidence: mx-tip.log, mx-base.log, shots/tip-mx-slots-360x740.png (the OUT heading and a withdrawal
card drawn over the ADDRESS REUSE text and the first slot row), sheet-bce-small.png.

Fix: in the 720px rule, `.bce-mx-body { grid-auto-rows: max-content; }`. Injected live on the tip:
all six slots reachable and 4471 traces at 390x844, 360x740 and 320x640, no overlap, the body
scrolls (mx-fix.log). Add the mixer board to the shell X and audit lists (it needs
`lockable.scenarioData.minigameData` with `mode: 'mixer_match'`; mx.mjs has the data) so the
phone sizes are checked.

### M1 SCADA historian report: buttons out of reach on portrait phones, and now no way out

`js/minigames/scada-historian/scada-historian-minigame.js:771` appends the report overlay to
`.sh-charts`, which is `overflow: hidden` (`css/scada-historian-minigame.css:185`) except under
560px height (:358). The overlay is `inset: 0` with the modal centred (:248). On a portrait phone the
modal is 590 to 666px tall in a 338 to 442px charts box, so the box clips both ends and nothing
scrolls. Round 2 (9fda215ad) hides the scene X while the report is open.

Failure scenario: a sis02 player on a 360x740 phone unlocks ANNOTATE FINDING and opens the report.
[CONFIRM: MARK AS INJECT...] and [CANCEL] are both below the charts box (0px tappable), the scene X
is hidden, and a phone has no Esc key. The player cannot confirm, cancel or leave; only a reload
gets them out. At 390x844 a 14px strip of each button can be tapped. On main the buttons were also
out of reach (pre-existing), but the scene X stayed, so the player could leave.

| Size | Tip | Base |
|---|---|---|
| 390x844 | title in view, buttons 14px tappable | title above the window, buttons none |
| 360x740 | title in view, buttons none | title above, buttons none |
| 667x375 | charts box scrolls, buttons reachable, title 15px above the top with the box scrolled to 0 | buttons none |
| 915x412, 844x390 | all reachable | buttons none |

Evidence: modal-tip.log, modal-base.log, modal2-tip.log, modal2-base.log,
shots/tip-modal-scada-390x844-bottom.png, sheet-scada.png.

Fix: let the overlay scroll and centre safely:
`.sh-modal-overlay { overflow-y: auto; align-items: safe center; }` with the `pixel-scroll` class on
the overlay (or `align-items: flex-start` and `.sh-modal { margin: auto; }`). Then check at 390x844,
360x740 and 667x375 that the title and both buttons can be reached with a wheel scroll, not
`scrollIntoView`. Until that lands, do not hide the scene X for this pop-up.

### m1 Segmentation map confirm: title above the window on short screens (not a regression)

`css/network-segmentation-map-minigame.css:405` centres `.nsm-modal` in an overlay with
`align-items: center`, inside `.minigame-container`, which scrolls. When the modal is taller than the
window the top half of the overflow is unreachable: with every scroller at 0 the title CONFIRM NETWORK
ISOLATION is 67px (915x412), 78px (844x390), 86px (667x375) and 55px (360x740) above the window.
The buttons are reachable at every size and the flow works (tip and base alike; the 16px buttons add
7px). The player confirms a network isolation without seeing the heading or the warning icon.

Evidence: modal-tip.log, modal-base.log, sheet-nsm-modal.png.

Fix: `align-items: safe center` on `.nsm-modal-overlay.nsm-modal-visible` (or `margin: auto` on
`.nsm-modal` with `align-items: flex-start`).

### m2 Four of the ten button rules changed in round 2 style no markup

`.cms-button` (`css/claims-management-system-minigame.css:285`), `.ip-confirm-btn`
(`css/infusion-pump-minigame.css:162`), `.ip-modal-btn` (:254) and `.ransomware-display-btn` with
its `.icon`, `.label` and state rules (`css/ransomware-display-minigame.css:152` to :200) match no
element: no JS, scenario or view in the branch uses those classes. The pump's real confirm buttons
are Phaser rectangles with 8px Press Start text (`js/minigames/infusion-pump/infusion-pump-minigame.js:936`,
:1022), unchanged. So the build log's "six were rendering at 8px, now 16px" holds for the three
blockchain buttons only, and the pump line in it is wrong. No player impact, but the new static
test now guards rules that do nothing, and the next reader will think the pump modal is DOM.

Fix: delete the dead rules (or say in the build log that they are unused), correct the build log
line, and if the static test is kept, have it skip classes that no JS file contains.

## Not findings, noted

- The Esc behaviour test (`test/js/minigame-consoles-fit.test.mjs:211`) copies base-minigame.js and
  its two current imports into a temp folder. A new static import in base-minigame.js will make it
  fail with ERR_MODULE_NOT_FOUND; add that file to this list as with the harness copy lists.
- This round adds no static import to an engine module (`git diff 99fd5ff83 422c55061` has no new
  import line), so no harness copy list needs a change.
- The new CSS meets the pixel-art rule: `.dli-modal-head` 2px border, `.nsm-wrapper` uses the
  shared `.pixel-scroll` (css/utilities.css:340), no radius, gradient or soft shadow added.

## Tests

Plain `node file`, tip worktree, one file at a time: 14 files (the seven named plus every test file
naming a changed module), 228 pass, 0 fail. minigame-consoles-fit 18/18, minigame-shell-fit 30/30,
minigame-close-shell 19/19, blockchain-mixer-match 7/7, minigame-pixel-art 48/48,
minigame-controls-layout 11/11, scada-historian-data 8/8. tests.log, testlist.txt.

## Not checked or out of scope

Pump double-check modal (the non-tampered path) by real click: game 3104's pump runs the tampered
library, so the conflict confirm was used. Known open items from R1 and R2 not re-reported: alarm
panel 915, network architecture 390, NAD1, 5d, X8, CF1, SIEM3.
