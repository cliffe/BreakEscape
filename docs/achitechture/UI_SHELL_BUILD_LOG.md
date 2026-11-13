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
