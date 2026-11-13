# UI shell build log (build/ui-shell)

Branch build/ui-shell from main 2f5471209. Scope: the minigame framework shell (critique B
X1 to X3, the shared root cause of frames running off screen) and the lock and core scenes of
critique A. Paths are under public/break_escape/ unless they start with tools/ or test/.

## 1. Framework shell

What and why:

- css/minigames-framework.css:3-29 `.minigame-container`: `box-sizing: border-box` (a scene's
  own border no longer makes the shell 4px larger than the window, X1), `left: 0`,
  `height: 100dvh` after `100vh` (phones), `justify-content: safe center` and
  `align-items: safe center` (a frame taller or wider than the window starts at the top-left
  edge instead of spilling off both edges, X2) and `overflow: auto` (the shell scrolls).
- css/minigames-framework.css:155-163 `:where(.minigame-container > .minigame-game-container)`:
  `max-width: 100%`, `max-height: 100%`, `box-sizing: border-box`. Zero specificity on
  purpose: a first version at (0,2,0) overrode scene sizes such as the PIN plate's 600px
  `max-width` and stretched the plate to the full window; caught in the live shots and fixed.
- css/minigames-framework.css: the success and failure toasts sit at the top edge
  (`top: 16px; transform: translateX(-50%)`), no longer in the middle of the window over the
  controls (A10 for the scenes that still use them: rfid fallback, text file, VM launcher,
  password fallback).
- css/minigames-framework.css: the flag station and VM launcher join the framed tool windows
  whose game area scrolls inside its frame (A29).
- css/minigames-framework.css: `.minigame-controls-overlay > .minigame-game-container` has no
  top and bottom margin. Full-window consoles (SIEM, network architecture, EHR, backup
  recovery) fill the window exactly; their 20px margins used to spill evenly off both edges of
  the centred shell, and with safe centring they pushed the console 20px down and past the
  bottom. The first after audit showed this as new frame-offscreen breaches; fixed.
- js/minigames/framework/base-minigame.js:67-68 the shell and the game area get the shared
  `.pixel-scroll` class (css/utilities.css), so any scrollbar the shell change brings is the
  pixel-art one.
- js/minigames/framework/base-minigame.js:142-155 `placeCloseButton()` adds the shell's
  `scrollTop` (the X is absolute inside the scrolled shell) and subtracts the shell's own
  scrollbar from the right offset; :166 re-places the X on the shell's `scroll` event, so a
  closeInsideFrame X stays at the visible top of its frame.

## 2. Lock and core scenes (critique A)

| Id | Fix | Where |
|---|---|---|
| A01 blocker | Below 600px the three dials stack, label beside the arrows, 32px digits; `safe center`, no crop; the active dial is scrolled into view when it changes | css/combination-minigame.css (end), js/minigames/combination/combination-minigame.js `_refreshDials` |
| A02 blocker | Below 600px each wheel is 56px with a 41px GNF letter (crisp size); the row wraps for 6+ letters | css/cryptex-minigame.css (end) |
| A03 blocker | Notepad min-width only up to 92vw, no `left: -50px`; width leaves room for the rows under it | css/notes.css:36, :55-58 |
| A04 major | Nav row in the shell's column under the notepad (`gameContainer.after(nav)`), wraps; the short-landscape rule keeps it beside the page | css/notes.css nav rule, js/minigames/notes/notes-minigame.js |
| notes X, scrollbar | `closeAnchor()` is the notepad; the page scrolls with `.pixel-scroll` in paper colours | js/minigames/notes/notes-minigame.js, css/notes.css content area |
| A06 minor | The "empty title field" was the celotape strip: now a short yellowed tape | css/notes.css celotape |
| A10 major | PIN feedback on its own line under the display (`showPinMessage`), cleared by the next code; refusal, network error and lock-out use it too | js/minigames/pin/pin-minigame.js, css/pin.css (end) |
| A11 minor | Attempt rows solid #2c3e50 with a 2px coloured edge; empty text #c9d1d9 | css/pin.css |
| A12 minor | Fixed by the border-box shell | css/minigames-framework.css |
| A41 blocker | Alarm panel game area `safe center` and `overflow: auto`; panel `max-height: 100%`; SVG rows shrink between header and footer | css/alarm-panel-minigame.css:12-24, panel wrap |
| A42 major | Lamps are stepped octagons (`steppedLampPoints`, crispEdges polygons); live dot square; labels and footer 8px; separators 2px; footer #6b7fa8 | js/minigames/alarm-panel/alarm-panel-minigame.js, css/alarm-panel-minigame.css |
| A43 minor | `closeInsideFrame` with the panel as anchor; header padded for the X | same files |
| A18 major | Samples list `flex: 0 0 auto; min-height: 160px`; instructions are a closed "How to use the kit" disclosure; list has `.pixel-scroll` | css/biometrics-minigame.css, js/minigames/biometrics/biometrics-minigame.js |
| A19 minor | Filter chips stay inline and wrap on phones | css/biometrics-minigame.css |
| A24 major | Reader LED in a heading row left of the title, stepped octagon in every state; row padded clear of the X | js/minigames/biometrics/fingerprint-reader-minigame.js, css/biometrics-minigame.css |
| A25 minor | First card focused with `preventScroll` | js/minigames/biometrics/fingerprint-reader-minigame.js |
| A14 major | Dusting `closeInsideFrame`, anchor `.dusting-root`, title padded | js/minigames/dusting/dusting-game.js, css/dusting.css |
| A15 major | `.dusting-root` capped to the window and scrolls inside (pixel scroll); its game area uncapped | css/dusting.css |
| A16 major | Close buttons removed from every step (X and Esc remain). Also queued for slice 9: expect a trivial conflict | js/minigames/dusting/dusting-game.js |
| A17 minor | Pixel checkboxes, 2px rules, Press Start 2P at 16/8px, no glow | css/dusting.css |
| A26, A27 major | Flag station `closeInsideFrame`; VT323 in place of Courier New (CSS and the scene's inline style blocks), Press Start at 16px, 2px rules | css/flag-station-minigame.css, js/minigames/flag-station/flag-station-minigame.js |
| A29, A30 major | VM launcher scrolls inside its frame; `closeInsideFrame`; VT323 address; muted console tag; 2px rules | css/vm-launcher-minigame.css, js/minigames/vm-launcher/vm-launcher-minigame.js |
| A31 minor | "This terminal connects to a virtual machine..." | js/minigames/vm-launcher/vm-launcher-minigame.js |
| A34 major | Text file X anchored to the file window's title bar; traffic-light buttons removed | js/minigames/text-file/text-file-minigame.js, css/text-file-minigame.css |
| A36 minor | Toolbar 16px on phones, header wraps | css/text-file-minigame.css |
| A39, A40 minor | Examine: no image box without a sprite; `closeInsideFrame`, card padded for the X | js/minigames/examine/examine-minigame.js, css/examine-minigame.css |
| A07 major | Lockpicking phone window over world x=0..580 (lock, wrench and pick labels, SHEAR LINE), scaled by FIT; the game area scrolls to the feedback strip | js/minigames/lockpicking/lockpicking-game-phaser.js, css/lockpicking.css |
| A08 major | Spring, Driver Pin, Key Pin and SHEAR LINE labels on a dark backing | js/minigames/lockpicking/pin-management.js |
| A37 major | Title hint 8px / 16px line height; 16px phone gutter, title 16px under 480px; the logo zoom kept inside the screen | css/title-screen.css |
| A13 minor | Prompt-mode button row 10px below the field | css/password-minigame.css |
| A20, A21 | Bluetooth toggle beside the header box; chips inline on phones | css/bluetooth-scanner.css |
| A32, A33 | Container label columns 88px with room for two-line labels; empty actions row hidden | css/container-minigame.css |
| A44 minor | Copier empty text #c8c8c8 | css/rfid-minigame.css |

Not done (left for later or for other slices): A09 (whole-number zoom of the lock on desktop),
A23 (BLE list cue and SAVE colour), A28 (emoji flag icon, slice 12), A07's themed frame for the
lock, GNF off-grid body sizes in the flag station and VM launcher (11 to 14px), the critique B
per-scene console work (frame-offscreen remains in claims management, EHR at 915x412 and ESD,
all scene-owned heights; slices for consoles).

### Ask items (not implemented, for the orchestrator)

- A05 notes Continue beside the X (recommend: drop Continue, keep X and Esc).
- A22 three scanner panels, three layouts (recommend: one shared scanner-panel stylesheet).
- A35 light text-file window (recommend: light on a PC desktop, dark themed frame otherwise).
- A38 title vignette gradient and glow (recommend: keep as a diegetic CRT effect).
- A45 frames fill the window around small content (recommend: cap tool windows at 960x720).
- A46 frame art highlight break (recommend: repaint the edge strips).

## 3. Tests and audit

- tools/playtest/ui-rules-audit.mjs copied from the p-ux-audit worktree (7abca72ad) with the
  scrollbar recipe (no --hide-scrollbars), an exported `audit()`, the 390x844 size by default,
  two new checks and `--strict`:
  - `frame-offscreen`: the scene frame (`closeAnchor()`, else the game area) not wholly inside
    the viewport;
  - `clipped`: a text, control, image or canvas element cut by more than 2px by an ancestor
    with overflow hidden or clip, or sitting before the start of a scroll box; content past
    the end of a scroll box is reachable and passes (that rule was added after the first
    after run, see Results);
  - a SUMMARY line counts window-offscreen, frame-offscreen and clipped; `--strict` exits 1
    when any is found.
- test/js/minigame-shell-fit.test.mjs (18 tests): shell rules, the zero-specificity cap, toast
  placement, pixel-scroll classes, the X's scroll offset and scroll re-placement (jsdom), and
  one test per critique A fix group.
- test/js/ui-rules-audit-fit.test.mjs (3 tests): the audit's clipped, scroll-reach and
  frame-offscreen checks on stubbed jsdom layouts.
- Every test file that imports or names a changed module (138 files, bin/test-js -j 3, no
  lock): 138 passed, 0 failed.

## 4. Live proof

Keyless server on :3450 from this worktree; test_seating game 3084 for the title-only scenes,
the sweep's real-object games for alarm panel (3105), flag station and VM launcher (3110),
examine (3112) and the console evidence (3104, 3106, 3105). Scrollbars shown (15px measured).

Shots, same names before (main) and after, in the scratchpad ui-shell/shots/before and
ui-shell/shots/after. Bluetooth scanner, rfid and the title screen at 390 were added to the
spec list after main had moved on in this worktree, so their before shots are copied from the
main sweep (sweep-minigames/shots, also 2f5471209).

Results (all 55 registered scenes, title-only params, game 3084, sizes 1400x1000, 800x600,
915x412, 390x844; counts are breaches, then surface-sizes):

| Run | window-offscreen | frame-offscreen | clipped |
|---|---|---|---|
| before (main), first audit version | 28 (28) | 10 (10) | 115 (31) |
| after 455338ff0-era, current audit (scroll-reach rule), before the overlay-margin fix | 0 (0) | 11 (11) | 53 (16) |
| after 3ad9ccdd5 overlay fix, first audit version (no scroll-reach rule, so it still counts content past a scroll box's end); the 17775fe74 cap fix landed mid-run | 0 (0) | 4 (4) | 104 (29) |

The six new frame-offscreen hits in the second row (network architecture, SIEM) were the
overlay-console margins; 3ad9ccdd5 fixed them (spot audit of SIEM, network architecture, EHR,
backup recovery: frame-offscreen 0). Remaining frame-offscreen: claims management 800/915,
ESD 800/915, EHR 915: scene-owned fixed heights (critique B, console branch). Remaining clipped
(current audit): biometrics and Bluetooth panels (the shell is the panel and hides overflow),
command board 915, drug library 390, network segmentation map 390, ransomware 390, SCADA
historian 390/915, SIEM 390, title screen 390 (the logo mid-zoom, by design).

Shots: shots/before is complete (90 files). shots/after holds the run from before 17775fe74
(the zero-specificity cap fix) except the PIN, which was re-shot after it; scenes with their own
game-area max-width (the PIN plate) were wrong in that run, so shots/after needs one more run.


## Handover (context limit, 2026-11-13)

Done:
- Scope 1 (shell): border-box, safe centring, scrolling shell with pixel scroll, zero-
  specificity game-area cap, toasts at the top, X follows the shell's scroll, overlay consoles
  without margins. Every scene opened in the audit at all four sizes (network-view needs a
  foothold and does not open from a title-only start, as on main).
- Scope 2: every critique A blocker and major in the table above, and the listed minors.
- Scope 3: audit checks, `--strict`, 21 new unit tests; 138 importer test files pass.

Open:
- Final after audit with the current audit (tools/playtest/ui-rules-audit.mjs --all, sizes
  default) and the first version (scratchpad ui-shell/ui-rules-audit-v1.mjs) on the tip, for a
  like-for-like count; then fill the results table.
- Re-run the after shots on the tip: `node shoot.mjs --specs specs.mjs --out shots/after` in the
  scratchpad ui-shell folder (port 3450), and compare with shots/before.
- Not done items and asks listed in section 2.
- The keyless server on :3450 (started from this worktree, pid file tmp/pids/server-3450.pid)
  is still running; stop it by that PID when finished.

Files: css/minigames-framework.css, js/minigames/framework/base-minigame.js, and the scene
files in the table; tools/playtest/ui-rules-audit.mjs; test/js/minigame-shell-fit.test.mjs,
test/js/ui-rules-audit-fit.test.mjs.

Commits: `git log 2f5471209..build/ui-shell` (67d7fdab2 to the tip).

Gotchas: (1) any new shell-wide rule on the game area must have zero specificity or it
overrides scene sizes; (2) `pkill -f` or a `pgrep -f` wait loop whose pattern appears in your
own command line matches your own shell (one killed the shell, one waited for ever); (3) jsdom
does not expand the `overflow` shorthand, so audit unit tests set overflow-x and overflow-y;
(4) the dusting and container files overlap slice 9 (Close buttons, X placement).


## Round 2 (2026-11-13): A09, A23, like-for-like audit, tip shots

Commit 6da40d3f6 (tests in test/js/minigame-shell-fit.test.mjs, now 20).

- A09 lockpicking: on desktop widths (over 768px) the game works out the room left for the
  canvas (game area less the strips around it) and zooms the Phaser canvas by the largest whole
  number that fits (`LockpickingMinigamePhaser.wholeZoom`, 1 when it does not fit, re-fitted on
  resize); the canvas box is widened to 600px times the zoom and, on windows over 560px tall,
  centred in the frame with auto margins. At 1400x1000 the lock now draws at 2x in the middle.
  Phone and short windows are unchanged.
- A23 BLE scanner: the device list is a `.pixel-scroll` box with a "More below" strip under it
  (shown while the list runs on, same words and stepped arrow as the network view and the PC
  desktop); the local 6px scrollbar rules are gone; SAVE is the cyan accent with a 2px border
  (filled when saved). The "Paired" chip wrapping onto its own row was left as is.
- Note: the ble-scanner scene has no entry in specs.mjs (the 90 before shots have bluetooth
  scanner only); its check shots are in run2/wip with run2/spec-ble.mjs.

Like-for-like audit: the same tools/playtest/ui-rules-audit.mjs (tip version), `--all`, game
3084, 1400x1000, 800x600, 915x412, 390x844. "Before" is main at 6b2344e20 (a detached worktree
.claude/worktrees/p-ui-shell-main, served on :3452, server stopped, worktree left for the
orchestrator), "after" is the tip with 6da40d3f6 on :3450. Counts are breaches, then
surface-sizes.

| Run | window-offscreen | frame-offscreen | clipped |
|---|---|---|---|
| main 6b2344e20 | 28 (28) | 10 (10) | 64 (18) |
| tip | 0 (0) | 4 (4) | 53 (16) |

Remaining breaches on the tip, by scene:

| Scene (sizes) | Reason | Owner |
|---|---|---|
| ESD pushbutton (800, 915) frame-offscreen | scene-owned 620px panel height | consoles |
| claims management (800, 915) frame-offscreen | scene-owned fixed height | consoles |
| command board (915) clipped x5 | status rows cut at the game area's bottom | consoles |
| SIEM (390) clipped x3 | pane titles wider than the panel on a phone | consoles |
| network segmentation map (390) clipped | SVG wider than its area | consoles |
| SCADA historian (915, 390) clipped x4 | chart SVG taller than its box; range buttons past the right panel | consoles |
| ransomware display (390) clipped x2 | timer row wider than the screen | consoles |
| drug library integrity (390) clipped | disabled tab past the right edge | consoles |
| biometrics, Bluetooth scanner (all sizes) clipped x5, x4 | the controls block is collapsed to zero height by its toggle, so its search box and chips count as cut: an audit false positive on a collapsed block | shell (audit rule) |
| title screen (390) clipped | logo mid-zoom, by design | shell (accepted) |

Nothing remains on the social or phone scenes (phone chat, person chat, notes, dusting,
combination, cryptex show only the older font-size or style findings, no clipped or offscreen
breach), so the social follow-up branch has no breach to take from this audit.
(mg-dusting, mg-notes, mg-cryptex, mg-combination breached only on main.)

Tests: the files touching a changed module or the shell tests (6 files: minigame-shell-fit,
minigame-pixel-art, minigame-html-sweep-c, minigame-title-escape, engine-fixes-pass4b,
escaping-shared-helpers): 6 passed, 0 failed (full suites are the orchestrator's).

Shots: run2/shots-after in the scratchpad ui-shell folder, same names as shots/before,
re-shot on the tip.


## Review round 1 fixes (2026-11-13)

Review: docs/achitechture/UI_SHELL_REVIEW_R1.md. Fix commit 28596758f (code and tests), this log
in the commit after it. Paths are under public/break_escape/ unless they start with tools/ or test/.

| Finding | Outcome |
|---|---|
| M1 default X scrolls away | Fixed, one framework fix. `.minigame-container > .minigame-close-button` is `position: fixed` (css/minigames-framework.css) with `right: calc(15px + var(--minigame-shell-bar))`; base-minigame.js `_watchShellScrollbar()` publishes the shell's scrollbar width in that variable (resize and a ResizeObserver on the shell), so the X sits left of the bar. Scenes that move their X into a frame (a parent other than the shell: password, network view, PC bezel) keep their own absolute rules. |
| M2 X ignores scrollLeft | Fixed by the same change: `placeCloseButton` now works in window coordinates (frame rect against the shell's visible edge, less its scrollbar), so a sideways scroll is already in the frame's rect, and the X is clamped to the visible right edge. closeInsideFrame scenes (notes, pin, network architecture, biometrics, rfid, infusion pump) still sit in their frame's corner. |
| M3 notes X on the scrollbar | Fixed: css/notes.css starts the page's scroll box at `top: 48px` (below the X) with `height: calc(90% - 48px)` and no top padding, so its bar never runs under the X. |
| M4 lockpicking strip on phones | Fixed: css/lockpicking.css gives `#phaser-game-container` `aspect-ratio: 580 / 340; height: auto; flex: 0 0 auto` at 768px and under, so the strip follows the lock. |
| M5 alarm panel text scaled | Fixed: the SVG is drawn at its viewBox size (`width` and `height` in the markup, 1:1), the panel is `flex: 0 0 auto` with no max-height or max-width, and `.ap-game-container` (already `overflow: auto`) scrolls. On a 390px phone the panel scrolls sideways at native size. |
| m1 stale pointer after a scroll | Fixed: lockpicking-game-phaser.js `_watchLockScroll()` calls `game.scale.updateBounds()` on scroll of the game area and the shell (listeners removed in `complete`). Not re-measured at 50 ms in a browser; covered by a source test. |
| m2 PIN line wraps | Fixed: `.pin-minigame-message` `min-height: 56px` (two lines), and the lock-out text shortened to "Locked out. Your guesses are kept." so it never takes three. shell-x-check asserts the keypad top does not move for either message at three sizes. |
| m3 audit false positive (collapsed block) | Fixed in tools/playtest/ui-rules-audit.mjs: a clipping ancestor with zero client height or width, or opacity 0, is skipped. Unit test added. |
| m4 `--strict` passes unopened scenes | Fixed: an unopened scene or an open error is "NOT AUDITED", and `--strict` fails on it unless it is in `--skip a,b`. `container` and `phone-chat` got BUILTIN_PARAMS and now open. `person-chat` (needs the game's NPC) and `network-view` (needs the game's network links) cannot open from a title-only start: allowed with `--skip person-chat,network-view`, and the review's own shots cover them. The clipped loop no longer stops at the first scroll box: the box stands in for the element and the outer boxes are still checked. Unit tests added. |
| m5 two horizontal bars, network architecture | Deferred: scene content wider than the frame, the consoles branch owns it. Note for that branch: at 390x844 the diagram scroller and the shell both scroll sideways. |
| m6 PC view inherits the scrolling shell | Fixed: `.minigame-container.pc-view { overflow: hidden }` in css/pc-monitor.css. Found by reading, as the review did; checked in CSS and by a test, not by dragging a post-it past the edge. |
| m7 `box-sizing` zero-specificity rule narrows some scenes | Deferred, noted: the ESD panel is 600px wide, not 640px, at 800x600 (its status line wraps). Nothing broke. Consoles owners decide whether to restore the width. |
| m8 tests read source text | Fixed in part: new behaviour tests for the default X (published scrollbar width), `placeCloseButton` in window coordinates with a vertical and a horizontal scroll, the right-edge clamp, `hasMoreBelow`; the alarm, PIN, notes, lockpicking and PC view tests now check the new values. Live: tools/playtest/shell-x-check.mjs (below). Not done: `showPinMessage` timing and `_refreshDials` `scrollIntoView` tests (the live message check covers the layout part). |

### New live check: tools/playtest/shell-x-check.mjs

Opens each registered scene (or `--scenes a,b`) at 915x412, 800x600 and 390x844, scrolls the shell
and every scroll box to the end, and fails if the X is outside the viewport, over the shell's
scrollbar or over the scrollbar of the box under it (M1, M2, M3), and for the PIN pad if a wrapped
message moves the keys (m2). `--legacy` puts the old absolute X and the old notes box back: the
check then fails (backup recovery: X at y=-177, -247, -21; notes: X over the page's scrollbar),
which is the proof it bites. Merge batch:

    PLAYWRIGHT_CHROMIUM_EXECUTABLE=... SHELL_X_PORT=<keyless port> SHELL_X_GAME=<game id> \
        node --test test/js/shell-x-check.test.mjs

(skips when the two variables are unset; `SHELL_X_SCENES=a,b` narrows it). Audit gate:
`node tools/playtest/ui-rules-audit.mjs --port P --game G --all --strict --skip person-chat,network-view`.

### Results (tip 28596758f, game 3084, :3450, 1400x1000, 800x600, 915x412, 390x844)

| Run | window-offscreen | frame-offscreen | clipped | `--strict` |
|---|---|---|---|---|
| main 6b2344e20 | 28 (28) | 10 (10) | 64 (18) | not run |
| tip a6fc9e79c (review) | 0 (0) | 4 (4) | 53 (16) | exit 1 |
| tip 28596758f | 0 (0) | 5 (5) | 23 (8) | exit 1, 0 surface-sizes not audited |

Clipped fell from 53 to 23 (the biometrics and Bluetooth false positives are gone; the changed
scroll-box rule found nothing new). Frame-offscreen rose by one on purpose: the alarm panel at
390x844 is now drawn at 1x (460px) and scrolls sideways, so the audit sees its frame past the
window edge (M5 chose native size over blurred text). The rest are the consoles' own, as before:
ESD pushbutton and claims management (800, 915), command board (915), SIEM, network segmentation
map, SCADA historian, ransomware display and drug library (390), title screen (390, accepted).
`--strict` still exits 1 for those. Run with `--skip person-chat,network-view`.

shell-x-check, all registered scenes, three sizes: 120 checked, 0 failed. Tests: minigame-shell-fit
27, ui-rules-audit-fit 5, minigame-close-shell 16 (two expectations updated for the shell
observer), shell-x-check 1 skipped without a server; 122 importer files run, all pass (two flaked
under load and passed alone: rfid-door-screen, toast-once-across-panel-handover).

Handover: nothing in progress. Open: consoles owners (m5, m7 and the breaches above); `showPinMessage`
timing and dial `scrollIntoView` tests; a before/after re-shot of lockpicking at 390x844 to see the
strip under the lock (checked by CSS and the numbers only). The keyless server on :3450 is still
running (tmp/pids/server-3450.pid), left for the orchestrator.

## Review round 2 fixes (2026-11-13)

Review: docs/achitechture/UI_SHELL_REVIEW_R2.md (at 73a4557fe). Paths are under public/break_escape/
unless they start with tools/, test/ or docs/. Game 3084 on the keyless server :3450, headless
shell with scrollbars shown.

| Finding | Outcome |
|---|---|
| B1 scanner X invisible and unclickable | Fixed. `placeCloseButton` (js/minigames/framework/base-minigame.js) now measures `right` from the window (`document.documentElement.clientWidth`), because the X is `position: fixed`; the clamp to the shell's visible edge uses the same base. Live, shell-x-check at four sizes: biometrics, BLE scanner and Bluetooth scanner all pass the in-frame and `elementFromPoint` tests (biometrics 1400x1000 X now at 312,78, inside the panel; before 1362,78). Shot biometrics-1400x1000.png, biometrics-390x844.png. |
| M1 notes text box past the page | Fixed. css/notes.css short-landscape rule: `height: calc(94% - 48px)` and `padding: 0 9% 9% 17%` (no top padding). Live: text box bottom against notepad bottom 382 / 406 at 915x412, 558 / 594 at 800x600, 361 / 384 at 844x390; the audit no longer reports notes `overflow` at any size. |
| M2 alarm panel on phones | Fixed without scaling. `.ap-panel-wrap` is `width: 100%; max-width: 460px`, `.ap-svg` is `width: 100%; max-width: 420px`, and the SVG has `preserveAspectRatio="xMinYMin slice"` with its height attribute kept, so the scale stays 1 and only the empty right-hand end is cut. At 390x844 with four lamps the panel is 358px wide, no sideways scroll, the X inside the frame (338-368 against the border at 373). The footer wraps. A very long status text on a lamp row would now be cut at the panel's edge rather than scroll: none of the current missions has one (not checked beyond the test scenarios). Shot alarm-panel-390x844.png, alarm-panel-1400x1000.png. |
| m1 X follows scrolls inside the game area | Fixed. The scroll listener is registered on the shell in the capture phase (scroll does not bubble); `addEventListener` in the framework takes an options argument and removes the listener with the same options on cleanup. Unit test (a scroll on a child re-places the X; none after cleanup). |
| m2 lockpicking X over the canvas (phones) | Fixed, simple: portrait phone `margin: 32px auto 10px` on `#phaser-game-container` (css/lockpicking.css). Not re-shot. |
| m3 shell-x-check bites B1 | Done (below). |
| m4 `--strict` | Done: `--strict` also fails on `x-on-frame` and `overflow`; the summary line prints both counts. |
| Wiring | Done (below). |

### shell-x-check changes (tools/playtest/shell-x-check.mjs)

- For scenes that put the X in a frame (class `minigame-close-in-frame`): the X's box must be inside
  the frame's inner rect (`closeAnchor()`, border excluded), both before and after scrolling.
- For every scene: `document.elementFromPoint` at the X's centre must return the X (or a child): it
  is visible, on top and clickable.
- Scrolls every scroll box to the end in both axes (was down only).
- Default sizes now include 1400x1000; phone chat is checked (it is no longer skipped); params added
  for phone chat, BLE scanner, Bluetooth scanner and the alarm panel (four lamps).
- Proof it fails on the old code: run against the unfixed B1 code, `--scenes
  biometrics,ble-scanner,bluetooth-scanner,notes` gave 12 FAIL lines (every scanner at every size,
  for example "biometrics 1400x1000: X not inside its frame (X 1362,78-1392,108; frame inner
  4,74-346,294); X not clickable: elementFromPoint at its centre returns canvas"; at 390x844 the X
  straddled the border, 352-382 against 378) and `SHELL-X-CHECK 16 checked, 12 failed`. After the
  fix the same scenes pass, and the full run reports 0 failed (see Results).
- ui-rules-audit.mjs also got the alarm panel's four-lamp params, so it audits the real panel.

### Merge batch: how to run the shell X check

test/js/shell-x-check.test.mjs now FAILS under `MERGE_BATCH=1` when `SHELL_X_PORT` or
`SHELL_X_GAME` is unset (message says how to set them). Without `MERGE_BATCH=1` it still skips.
The orchestrator (or integrator) needs, before `MERGE_BATCH=1 bin/test-js -j 3`:

    # 1. a keyless server serving the tree being merged (a free port, here 3451; the keyless
    #    script is hard-wired to :3001, so start it by hand the same way)
    cd <merge tree>
    mkdir -p tmp
    env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true nohup bundle exec rails server \
        -b 127.0.0.1 -p 3451 -P tmp/pids/server-3451.pid > tmp/keyless-3451.log 2>&1 &
    #    or, on :3001: tools/playtest/start-keyless-server.sh
    # 2. a game: open http://127.0.0.1:3451/break_escape/missions in a browser (or drive
    #    tools/playtest/session-start.sh), start any mission with a title-only start such as the
    #    test_seating scenario, and read the game id from the URL /break_escape/games/<id>
    #    (a POST /break_escape/games with mission_id also makes one; it needs the CSRF token)
    # 3. the variables, then the suite
    export PLAYWRIGHT_CHROMIUM_EXECUTABLE=$HOME/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell
    export SHELL_X_PORT=3451 SHELL_X_GAME=<game id>
    MERGE_BATCH=1 bin/test-js -j 3
    # the check on its own (about 10 minutes for every scene at four sizes):
    node tools/playtest/shell-x-check.mjs --port 3451 --game <game id>
    # and the audit gate:
    node tools/playtest/ui-rules-audit.mjs --port 3451 --game <game id> --all --strict --skip person-chat,network-view \
        --sizes 1400x1000,800x600,915x412,390x844

`SHELL_X_SCENES=a,b` narrows the check. Stop the server afterwards by its pid file. The audit gate
still exits 1 for the consoles' own breaches (list below), so a merge batch compares its
SUMMARY line with this section rather than expecting a clean exit.

### Results (four sizes: 1400x1000, 800x600, 915x412, 390x844)

| Run | window-offscreen | frame-offscreen | clipped | x-on-frame | overflow | `--strict` |
|---|---|---|---|---|---|---|
| R2 review, 73a4557fe | 0 (0) | 5 (5) | 23 (8) | 12 (not counted) | not counted | exit 1 |
| this tip | 0 (0) | 5 (5) | 23 (8) | 0 (0) | 29 (12) | exit 1, 0 not audited |

`overflow` is now counted for every surface, so 29 includes breaches in other scenes that were never
tallied before; none is notes or a scanner. They are: backup recovery (content of its scrolling
shell, all three small sizes), claims management, ESD pushbutton, EHR terminal, coverage decision
form, SIS config threshold and network architecture (consoles' own, already in the earlier lists).
frame-offscreen 5 is the same set as the last round plus the alarm panel at 915x412, now audited
with four lamps: the panel (440px tall) scrolls in its game area on a short window by design (A41).
Clipped is unchanged (command board, SCADA historian, SIEM, ransomware display, drug library,
network segmentation map, title screen: consoles' own).

shell-x-check, all registered scenes at four sizes (1400x1000, 800x600, 915x412, 390x844): 164 surface-sizes checked, 0 failed, exit 0 (the R2 tip run reported 160 and passed the scanners wrongly).

Tests run (no full suites, per the rule): every test file that imports or names a changed module
(137 files, 1977 pass); rfid-door-screen failed once under `node --test` (a test-runner message
deserialisation error, as in earlier rounds) and passes alone under plain `node` (46). New tests:
placeCloseButton from a narrow panel (B1), scroll inside the game area and removal on cleanup (m1),
notes short-landscape rule (M1), alarm panel width rules (M2).

Open: a before/after shot of lockpicking at 390x844 with the new top margin; the consoles' breaches
above; per-kind baseline delta for `--strict` (not built). The :3450 server is still running.
