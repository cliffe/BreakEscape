# UI backlog build log (branch build/ui-backlog, from main 9e23e384b)

Three small items. Live proof ran on a keyless server from this worktree on :3470 (game 4188, m01).
Shots are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-backlog/` (scratchpad, not in the repo).

## 1. Alarm panel font sizes at 390x844

Cause: the panel drew its SVG at `width: 100%; max-width: 420px` of a 420px viewBox. On a 390px phone the box was 354px, so the browser reported the pixel faces at 8 x 354/420 = 6.74px (Press Start 2P) and 16 x 0.843 = 13.49px (GNF). The audit flagged both as fractional / off the 8px grid, at four labels and four status lines.

Fix: the SVG is always its own width, and the panel is as wide as the SVG plus its borders, so nothing is scaled.
- `public/break_escape/js/minigames/alarm-panel/alarm-panel-minigame.js:83` `SVG_W` 420 to 320 (fits a 360px phone: 324px panel).
- `public/break_escape/css/alarm-panel-minigame.css:30` `.ap-panel-wrap` `max-width` 460px to 324px; `:83` `.ap-svg` is `width: 320px; max-width: none; display: block`.
- The label (Press Start 2P 8px) and status (GNF 16px) sizes were already on the grid in the CSS and are unchanged.

Tests: `test/js/minigame-shell-fit.test.mjs` (alarm panel test updated: 320px SVG, 324px panel, `SVG_W = 320`), 30/30. Mutation: HEAD's CSS and JS put back, the test fails (29/1); fix restored, 30/30. Also run: escaping-shared-helpers 21/21, minigame-html-sweep-a 6/6, engine-fixes-pass4b 10/10.

Live: `ui-rules-audit --scenes alarm-panel` at 1400x1000, 800x600 and 390x844 is clean (390x844 was `font-size 8`, now clean); 915x412 still shows the baseline `frame-offscreen 1` and nothing else. At 915x412 the footer now wraps to two lines (the panel is 324px, not 460px), so the panel is 16px taller (420 against 404) in a window whose scroll area is 372px; it already did not fit and scrolls, and the count is unchanged.
Shots: `before-390.png`, `after-390.png`, `before-915.png`, `after-915.png`.

## 2. Incoming-call banner over the PIN title (5d)

The "HaX toast" is the incoming-call layer `#phone-ring-layer` (`css/phone-ring.css`): a fixed top-centre strip at z-index 2300, above minigames. At 915x412 it sat over the PIN pad's "Enter PIN" title. (Ordinary info and success toasts are held while a minigame is open, `systems/notifications.js` HOLDABLE_TYPES, so they never cover a title.)

Fix, in the HUD lane code (`public/break_escape/js/ui/hud-lanes.js`):
- `:207` `ringLayerSpot` (pure): tries the top centre, then the right-hand end of the notify lane (which starts below the top bar and the close X), then just under the lowest title. The first that touches no title (each grown by the 8px lane gap) wins.
- `:349` `MINIGAME_TITLES`: `.console-titlebar`, `.minigame-header`, `[class*="minigame-title"]`, `.minigame-close-button`, measured inside shown `.minigame-container`s.
- `:351` `placeRingLayer` is called at the end of `applyLanes` (`:543`); with no banner, or under the tutorial panel (CSS owns that spot), it removes its inline top, left and transform. `startHudLanes` also observes the layer so a banner coming or going is placed.

Tests: new `test/js/hud-lanes-ring-layer.test.mjs` 6/6 (spot maths for the four cases plus source wiring). Mutation: HEAD's hud-lanes.js put back, the file fails to import `ringLayerSpot`; restored, 6/6. Also run: ui-hud-lanes 40/40, bark-release-policy 31/31, npc-bark-delay 20/20, phone-call-bark-hold 2/2, phone-ring-layer 23/23.

Live proof (`window.phoneRinger.offer` for agent_0x99 while the PIN pad "Enter PIN: Director's Safe" is open; box edges read from the page):
| size | banner before | banner after | title / X |
|---|---|---|---|
| 1400x1000 | 520,12 to 880,104 | unchanged (clear already) | title 500,159; X at the frame's top right, clear |
| 915x412 | 278,12 to 638,104, over title (98..506, 67..115) | 539,84 to 899,176 (lane, right end) | clear of title and X |
| 390x844 | 16,12 to 374,106, over the X | 16,207 to 374,301 (under the title, 151..199) | clear of title and X |
| 390x844, EHR console | 16,84 | lane, 8px under the 26..76 title bar | clear |
| 915x412, EHR console | 539,84 | lane | clear |
Ring first then PIN opened, and PIN first then ring, both place it. On 915x412 the banner now covers the top of keys 4 to 6 (it covers part of some scene whichever spot it takes; the brief was the title).
Shots: `toast-before-915.png`, `toast-after-915.png`, `toast-before-1400.png`, `toast-after-1400.png`, `toast-before-390.png`, `toast-after-390.png`, `toast-console-390x844.png`, `toast-console-915x412.png`, `toast-after-915-ringfirst.png`.

## 3. Dead console button rules

Method: every class in a console or minigame sheet containing button, btn, cancel, close or console, not found as text in `public/break_escape/js`, `app/views`, `app/helpers`, `app/controllers` or `lib`; then each checked across the whole repo (scenarios, tests, tools, docs) and for dynamic names (`'cms-' +`, template strings). New `test/js/dead-console-button-rules.test.mjs` 2/2 (no sheet styles them, no script or view uses them); mutation: HEAD's `notes.css` put back, it fails (1/1).

Removed (class: file, evidence = no markup anywhere outside the css; docs hits are build logs and planning notes):
- `.cms-button`, `-primary`, `-secondary`: claims-management-system-minigame.css. UI_CONSOLES_BUILD_LOG m2 correction already says "match no markup".
- `.dli-investigate-btn`: drug-library-integrity-minigame.css.
- `.ip-confirm-btn`, `.ip-modal-btn`, `.ip-modal-buttons`: infusion-pump-minigame.css. The pump's buttons are Phaser text (UI_CONSOLES_BUILD_LOG).
- `.ransomware-display-btn` and its `.icon`, `.label`, `.contact/.report/.recovery`, `:disabled` rules: ransomware-display-minigame.css (same m2 note).
- `.sh-close-btn`: scada-historian-minigame.css.
- `.vpn-close-btn`, `.vpn-flag-btn`, and the lone `.vpn-clear-btn` rule: vpn-log-viewer-minigame.css.
- `.laptop-close-btn`: main.css.
- `.bluetooth-scan-btn`, `.panel-close`: panels.css.
- `.notes-minigame-buttons-container`: notes.css.

Left alone, with reasons:
- `.vpn-filter-row button, .vpn-clear-btn, .vpn-action-btn` (vpn-log-viewer-minigame.css:104): `.vpn-clear-btn` and `.vpn-action-btn` are dead, but the rule is shared with `.vpn-filter-row button`, and nothing creates `.vpn-filter-row` either. The whole sheet, linked at `app/views/break_escape/games/show.html.erb:73`, looks orphaned (no `vpn-` class appears in any script). Left for a decision on deleting the sheet and its link.
- `.phone-access-button`, `-icon`, `-badge` (npc-barks.css, hud.css): nothing creates the element, but the class is still named in `systems/npc-world-bubbles.js:94` and a grouped rule in hud.css, and it is a HUD button, not a console one. Not touched.

Tests run after the removals: minigame-consoles-fit 32/32, minigame-pixel-art 48/48, minigame-shell-fit 30/30, minigame-html-sweep-a 6/6, minigame-controls-layout 11/11, minigame-close-shell 19/19, engine-fixes-pass4b 10/10, escaping-shared-helpers 21/21, scada-historian-data 8/8, validator-minigame-data-layers 1/1.

## Gates

Run on the merged tip (main cb6d7feb4 merged into the branch, a5a2db3b7, then the log commit):
- `ui-rules-audit --all --strict --skip person-chat,network-view` at 1400x1000, 800x600, 915x412, 390x844: `frame-offscreen 1` (alarm panel at 915x412, the baseline), clipped 0, x-on-frame 0, overflow 0. The other non-clean lines are old: SIEM `cancel-beside-x` (known false positive, UI_CONSOLES_BUILD_LOG) and `examine` `font-size` at 390x844 (`h3.examine-name` Press Start 2P 13px; not touched here, left for the owner of that scene).
- `shell-x-check`: 172 checked, 0 failed.
- Node tests on the merged tip: minigame-shell-fit 30/30, hud-lanes-ring-layer 6/6, dead-console-button-rules 2/2, ui-hud-lanes 40/40, phone-ring-layer 23/23.

## Fix round 1 (review R1, UI_BACKLOG_REVIEW_R1.md)

Shots and probe output: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-backlog-f1/` (game 4258 on :3470; audit game 4267). Main d69c29089 merged, not rebased.

**M1 (banner covered controls).** `ringLayerSpot` (hud-lanes.js) now takes the open minigame's title boxes, control boxes (button, input, textarea, select, a[href], role=button, onclick, tabindex, `.pin-minigame-display`, plus anything with a pointer cursor, except an element over half the screen), the notify lane's toasts and the minigame's frame (`measureMinigame`). Order: bottom centre, bottom right, just under the frame (clamped to the viewport), the notify lane's right end, and only when none is clear the original top centre. Boxes are grown by 4px. No minigame boxes: top centre as on main. The banner's look is unchanged.

Spot used, measured by `tools/playtest/ring-banner-probe.mjs` (boxes of every control read in the page, intersected with the banner box; 0 overlaps each time):
| scene and size | spot | banner box |
|---|---|---|
| PIN 1400x1000 | bottom | 520,892 to 880,984 |
| PIN 915x412 | bottom | 278,304 to 638,396 |
| PIN 390x844 | bottom | 16,734 to 374,828 |
| PIN 360x740 | bottom | 16,630 to 344,724 |
| EHR 915x412 | bottom | 278,304 to 638,396 |
| EHR 390x844 | lane (the [UNDERSTOOD] button sits at 127..263 x 705..757, so the bottom is not clear) | 16,84 to 374,178 |

**m1 (warning toasts over titles).** `measureHud` raises `notifyTopMin` to the lowest bottom of the open minigame's headings and X (headings above 60 percent of the height), so the notify lane starts below them. PIN warning toast boxes, none touching a title or the X: 1400x1000 780,215 to 1380,343; 915x412 16,123 to 899,210; 390x844 16,207 to 374,350; 360x740 16,155 to 344,298. Trade-off: a toast is a wide box under the title, so it now covers part of the PIN display or the top keys for its few seconds (1 to 7 controls at the four sizes), where before it covered the title. It is feedback the player has just asked for and it times out. The user may want to rule on this (see the report).

**m2 (banner over lane toasts).** Chose to make the banner avoid the toasts' current boxes (one extra array in the same overlap test) rather than make it a lane member, which would have changed `computeLanes` and its tests for a banner that is only placed while a minigame is open. A toast coming or going already re-places it (the toast container is observed). If nothing is clear the top centre fallback may still overlap a toast (EHR 390x844 with a warning up: default, over the toast at y 84); the probe records that as a note.

**m3.** `test/js/hud-lanes-ring-layer.test.mjs` 8/8: feeds boxes measured from the PIN layout at 915x412 and 390x844 into `ringLayerSpot` and asserts no key, display, title or X is under the banner, plus the R1 spot (539,84) is rejected, a toast is avoided, the fallback, the viewport clamp, no-minigame and the source wiring. Mutation: R1's hud-lanes.js put back, 6 of 8 fail (2 pass); new code restored, 8/8. Reusable live probe: `tools/playtest/ring-banner-probe.mjs --port P --game G --size WxH [--scene pin|ehr-terminal]`; it exits 1 on any control, title or toast overlap.

**Nits.** `hits` lost its unused `t` parameter; the below spot is clamped to the viewport; the vpn-log-viewer stylesheet is on `docs/IDEAS_BACKLOG.md` (2026-11-14).

Gates on the merged tip (main d69c29089 merged): `ui-rules-audit --all --strict --skip person-chat,network-view` at 1400x1000, 800x600, 915x412, 390x844: frame-offscreen 1 (mg-alarm-panel at 915x412, the baseline), window-offscreen 0, clipped 0, x-on-frame 0, overflow 0; the other lines are the old ones (examine font-size 1 at 390x844). `shell-x-check`: 172 checked, 0 failed. Node: hud-lanes-ring-layer 8/8, ui-hud-lanes 40/40, phone-ring-layer 23/23, bark-release-policy 31/31, npc-bark-delay 20/20, phone-call-bark-hold 2/2.

**m1 reverted (coordinator ruling, after the 915x412 shot).** The `notifyTopMin` raise in `measureHud` is removed, so warning and error toasts place as on main (over a minigame's title). The Wrong PIN toast it produced covered the PIN display and keys 1 to 6 just as the player retries, which is worse than covering the title. M1, m2, m3 and the nits stand. The m1 toast boxes and the "1 to 7 controls" trade-off above describe the reverted state. Backlog entry added to `docs/IDEAS_BACKLOG.md` (2026-11-14). Tests after the revert: hud-lanes-ring-layer 8/8, ui-hud-lanes 40/40, phone-ring-layer 23/23 (the one source-text assertion for the raise was removed).
