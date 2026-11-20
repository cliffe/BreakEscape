# UI consoles review, round 4 (build/ui-consoles)

Reviewed tip 30ed762d3 (the round 3 fixes) against base fc4b4d8a5. Paths are under
public/break_escape/ unless they start with test/ or docs/. Evidence paths are under the session
scratchpad folder `ui-consoles-r4/` (logs, shots and the scripts that made them: ov.mjs,
shdouble.mjs, mx4.mjs, nsmdbg.mjs, specs4.mjs, grid.py).

Main has moved to 61c033b13 (50 commits). Only `css/network-view-minigame.css` is changed on both
sides; `git merge-tree` reports a clean merge. Not merged. Look at the network view once the merge
batch runs, because the audit skips it.

Servers: tip worktree on :3486, baseline worktree on :3487, both keyless, both stopped after the
review. Games: 3346 (audit, shell X check, title-only scenes), 3104 (segmentation map and the SIS01
sweep), 3105 (SCADA historian, ESD, SIS config, network architecture), 3106, 3109, 3403 (blockchain
explorer and the mixer board). Headless shell with scrollbars shown (15px).

Game state: none of the flows here confirmed anything. The SCADA report runs had `_executeActions`
stubbed, and every segmentation map confirm was cancelled with NO. The mixer board probe set the
client global `traced_fund_slot_r3probe` on game 3403 (the same key R3 used; no new key). The sweep
reused the first round's specs. Its NCSC brief step sets `warranty_checklist_complete` on game 3106,
as the earlier rounds did.

## Verdict

The round 3 fixes hold live. A player can reach the mixer board's slots and complete the trace
on phones with the wheel and real clicks only. Both confirms open with the title in view and scroll
to their buttons by wheel and by touch drag, short modals stay centred at desktop sizes, and the
backdrop covers the scene box before and after scrolling. Neither overlay takes wheel or touch from
the scene once closed (the SCADA overlay is removed and the segmentation map's is `display: none`).

One finding is new to this review but was introduced in round 2. A second press on ANNOTATE while the
SCADA report is open stacks a second report, and the first can then never be cancelled (M1). It is
a two-line fix, proven live. One minor polish item (m1). Merge after M1.

| | B | M | m | n |
|---|---|---|---|---|
| Count | 0 | 1 | 1 | 3 |

## Checks

| Check | Result |
|---|---|
| Audit `--strict`, game 3346, 1400x1000, 800x600, 915x412, 390x844 | `window-offscreen 0, frame-offscreen 1 (1), clipped 0, x-on-frame 0, overflow 3 (1)`, exit 1 on the two known lines (alarm panel 915x412, network architecture 390x844). The log matches R3's line for line. audit.log |
| Shell X check, game 3346 | `SHELL-X-CHECK 168 checked, 0 failed`. Same lines as R3; only the order of sizes in the log differs. shellx.log |
| Mixer board trace by wheel and real clicks only (no `scrollIntoView`), 390x844, 360x740, 320x640, 1400x1000 | All six deposit and withdrawal matches clicked, all six slot buttons under the pointer after wheeling, 4471 traces: `.bce-mx-big` shown and the onTraced global set, at every size. mx4-tip.log, shots/tip-mx-done-390x844.png |
| SCADA report, player path (ANNOTATE clicked, then wheel over the modal), 1400x1000, 1024x768, 915x412, 667x375, 390x844, 360x740 | Title in view at open; wheel scrolls the overlay to both buttons; Cancel by real click closes it. Desktop centring kept: gaps 227/227 (1400x1000) and 111/111 (1024x768), the same as the base. Backdrop covers 81/81 sample points of the visible charts box at every size except 667x375 (m1). ov-tip.log, ov2-tip.log, ov2-base.log |
| Segmentation map confirm, player path ("!" marker clicked, SEVER clicked, wheel over the modal), same sizes | Title in view at open, wheel reaches both buttons, NO closes it. Gaps 133/133 at 1400x1000 (base 140/140, the modal is 7px taller with 16px buttons) and 17/17 at 1024x768. Wheel at the end of the overlay does not move `.nsm-wrapper` behind it (scrollTop 524 and 720 kept at 915x412 and 667x375). Backdrop 81/81 at every size. ov-tip.log, ov2-tip.log |
| Touch drag (CDP touch events) inside both overlays at 390x844 | The overlay scrolls to its end (174/174 SCADA, 131/131 map), nothing behind it scrolls, and a tap on Cancel or NO closes it. touch-tip.log |
| Sweep of every console scene from its real scenario object at 390x844 and 1400x1000 (plus ESD and SIS pop-up states) | 53 tip shots, audit rules clean except the two lines known since R1: SIEM `cancel-beside-x` and network architecture overflow at 390. On the base, 42 of the same 53 shots show one or more breaches (font-size, hairline, shadow, clipped and others). No new visual problem in the contact sheets. sweep-tip.log, sweep-base.log, sheet-390-a.png, sheet-1400.png |

Tests, each run alone with plain `node`: minigame-consoles-fit 18, minigame-shell-fit 30,
minigame-close-shell 19, blockchain-mixer-match 7, scada-historian-data 8, plus the files that import
the R3-changed modules: engine-fixes-pass4b 10, escaping-shared-helpers 21, minigame-html-sweep-b 12,
minigame-html-sweep-c 13, minigame-pixel-art 48, minigame-title-escape 24. 210 passed, 0 failed.
tests.log

## Findings

### M1 SCADA report: a second ANNOTATE press stacks a second report, and the first can no longer be cancelled

`js/minigames/scada-historian/scada-historian-minigame.js:739` `_openAnnotateModal()` has no guard
for a report that is already open. The overlay sits inside `.sh-charts` only, so the ANNOTATE button
in the left panel (:181, and above the charts on phones) stays live while the report is open. Each
press appends another `.sh-modal-overlay` and overwrites `this._annotateOverlay`. `_closeAnnotateModal()`
(:776) removes only the overlay in that field. Round 2 changed the buttons from `overlay.remove()`
(their own overlay) to `_closeAnnotateModal()`, so the earlier report is orphaned. Its Cancel does
nothing, and Esc then closes the whole scene because `handleEscapeKey()` (:789) sees no overlay.

Failure scenario: a sis02 player finds the falsified point. ANNOTATE starts pulsing, and they press
it twice (a double tap on a phone, or a second click when the first seems slow). They read the
report and press [CANCEL] to look at the chart again. The scene X comes back but the report stays
over the charts. Further presses of [CANCEL] do nothing. They can confirm the report or leave the
scene, but they cannot return to the chart. On the base both reports clear with two Cancels.

Evidence (real clicks; shdouble.mjs, shd-tip.log, shd-base.log, shots/tip-sh-double-*.png):

| Size | Tip | Base |
|---|---|---|
| 1400x1000 | ANNOTATE hit while open: yes; overlays 2; Cancel: 1 left; Cancel again: 1 left | overlays 2; Cancel: 1; Cancel: 0 |
| 390x844 | same as 1400x1000 | same as 1400x1000 |

Fix: at the top of `_openAnnotateModal()`, `if (this._annotateOverlay) return;`. Injected live, it
gives one overlay after the second press and 0 after one Cancel at both sizes (shd-fix.log). Add a
case to `test/js/minigame-consoles-fit.test.mjs` that opens the report twice and checks one Cancel
leaves no `.sh-modal-overlay`. Optionally, also have each button remove its own `overlay` and clear
the field only when it matches. That survives any future caller that skips the guard.

### m1 SCADA report on landscape phones: the wheel chains into the chart column and moves the backdrop

`css/scada-historian-minigame.css:248`. Under `max-height: 560px` (:356) `.sh-charts` scrolls
(5px of overflow at 667x375). The overlay is `position: absolute; inset: 0` inside it. Once the
overlay is scrolled to its end, further wheel input chains to `.sh-charts`. The overlay moves up with
the content and leaves a 5px undimmed strip of chart under it, and 17/81 sample points of the
visible charts box are then outside the backdrop (9/81 before, all in the `.sh-charts` scrollbar
column, which the base also leaves undimmed). Cosmetic: the buttons stay reachable.

Evidence: ov2-tip.log (`sh-charts:5/5` after "down", uncovered 17/81), shots/tip-ov-scada-667x375-down.png.

Fix: `overscroll-behavior: contain;` on `.sh-modal-overlay` (and on `.nsm-modal-overlay` for the same
rule, although the map does not chain today). Injected live at 667x375 and 390x844, `.sh-charts`
stays at 0 and coverage stays at 9/81 and 81/81 (ov-fix.log).

## Notes (no change asked)

- n1 The segmentation map is 840px wide inside a 376px body at 390x844, so a phone player scrolls
  sideways to reach the "!" markers. This is the stated design (build log X3). The base clipped the
  map with no way to reach them, so the tip is better. Scripts that click the markers must wheel
  sideways (ov.mjs does).
- n2 The SIS config confirm and compare cards (`css/sis-config-threshold-minigame.css:174`) have
  no dimmed backdrop, and the list behind stays live. That matches the base, and the single
  reused `overlayEl` means nothing stacks.
- n3 R3 m2's four dead button rules are still in place, as the coordinator's log says ("left for a
  later tidy").
