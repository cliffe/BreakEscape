# UI consoles 2 build log (build/ui-consoles2)

Branch build/ui-consoles2 from build/ui-consoles 30ed762d3. Scope: the user's decisions X8 (one
shared console window) and NAD1 (network architecture diagram readable at every size), from
critique B (scratchpad critique-b/findings.md). Paths are under public/break_escape/ unless they
start with tools/, test/ or docs/. Main (61c033b13) merged in at 5428d3779, no conflicts.

## 1. The shared console window (X8)

Built once in the base class (js/minigames/framework/base-minigame.js), opt-in like
closeInsideFrame:

- `static consoleWindow = true` draws the shell as one `.console-window`: the theme's 9-slice frame
  (`--ui-frame-*`), `width: min(1280px, 100%)`, `max-height: min(880px, 100%)`, centred over the game
  dimmed to 85% black, with 8px round it. Under 600px wide or 500px tall the window is the whole
  window less 8px each side.
- One title bar (`.console-titlebar`): title in Press Start 2P 16px / 24px line, optional GNF 16px
  subtitle, and the X as a flex item at the right of the bar, so it never covers the title (a long
  title wraps beside it). The X keeps `#minigame-close` and gets `minigame-close-in-frame`, so the
  shell X check measures it against the window.
- `consoleTitle()` (default `params.title`), `consoleSubtitle()` (default `params.consoleSubtitle`),
  `setConsoleTitle(title, subtitle)` for titles that change at run time. Plain text, escaped.
- The scene draws into `.console-body` (the game area) under the bar, which scrolls with the pixel
  scrollbar. `closeAnchor()` returns the window, so the audit's frame checks measure the window.
- `static consoleWindowFill = true` for data consoles whose own panes scroll (diagram, logs,
  dashboards): the window takes its full size (`height: min(880px, 100%)`). Forms and documents
  wrap their content (frames wrap content).
- No X placement watcher for console windows (the bar lays the X out).

Gotchas: a global `.show { display: block !important }` beats a scene overlay's display rule (SIS
used `display: flex !important`); the body stretches each top-level child, so a scene with several
top-level nodes wraps them in one root (drug library: `.dli-wrap`); scene rules on the shell element
(`.xxx-minigame-container`) are overridden by `html .minigame-container.minigame-console`.

## 2. Scenes moved

| Scene | Title / subtitle in the bar | Window | Kept inside as content |
|---|---|---|---|
| concern-form | "Raise a concern" (config) | wrap | awareness skin; the scene unhides the shared X and routes it through its keep-going check; own Close removed |
| coverage-decision-form | form title / policy and claims manager line | wrap | Close row removed |
| drug-library-integrity | scenario title / subtitle | fill | file-name strip, tabs |
| forensic-data-platform | title / case ref | fill | tabs; scrolls as one on short windows; Close Terminal row removed |
| ncsc-brief | "NCSC Attribution Brief" | wrap | TLP band (page content) |
| network-architecture | scenario title | fill | legend strip (now wraps), diagram, detail pane |
| scada-historian | scenario title / old subtitle line | fill | toolbar, channels |
| blockchain-explorer (and mixer board) | scenario title; mixer board title | fill | case-ref strip; mixer board Close beside the X removed |
| capture-log | "Capture log" | wrap | list |
| warranty-checklist | "Warranty Compliance Checklist" | wrap | letterhead |
| log-filter | "ACCESS LOG ANALYSER" (overridable) | fill | filter builder, table |
| claims-management-system | system name / "MC-2023-ALBE-007 \| Coverage Analysis Workspace" | fill | progress and status header |
| backup-recovery | scenario consoleTitle or default | wrap | key-slots strip, outcome heading |
| command-board | scenario title and subtitle (setConsoleTitle) | fill | dots and clock strip |
| ehr-terminal | "NORTHGATE TRUST EHR - PRESCRIBING MODULE" | wrap offline, fill online | [OFFLINE]/[ONLINE] badge strip, [UNDERSTOOD] |
| sis-config-threshold | "SIS CONFIGURATION - BATTERY HALL SIS" | wrap | table (720px max, centred); pop-ups now cover the whole shell |
| ransomware-display | the neutral params title | fill | red notice and skull panel |
| siem | "NORTHGATE TRUST // SIEM CONSOLE" | fill | clock strip |
| network-segmentation-map | scenario title or "NETWORK SEGMENTATION MAP" | fill | ACTIVE INCIDENT badge; now draws into the game area with the framework X (was its own `#nsm-close` shell) |
| network-view | link name (with the "(down)" tag as text) / old subtitle | wrap | status strip, More below; Wi-Fi icon moved to the status line |

Every scene lost its own title bar, outer frame and the header padding that cleared the old X.
Pop-up rules are unchanged: info pop-ups keep the shared X in their own header row, confirms keep two
named buttons and no X, the scene X hides while either is open, Esc closes the pop-up first.

Left out, as physical devices (the user's rule: device apps keep their diegetic frames):
- infusion-pump: the pump is drawn as the hardware (Phaser canvas, keypad, screen, MAR sheet beside
  it). A console title bar over it would make it a window on a computer, which it is not.
- esd-pushbutton: a wall panel with a guarded red button and hazard stripes. Same reason.
Both keep closeInsideFrame with the X inside their own frame (test asserts it).

Scenario note (not changed): sis03's own title for the warranty checklist is "Warranty Compliance
Checklist", a dash, then "MC-2023-ALBE-007" (scenario.json.erb about line 1024), so the reference shows in the
bar and again in the letterhead. Dropping it from that title would tidy it; scenario edits are out of
this branch's scope.

## 3. NAD1

- The diagram draws at a whole-number scale of its viewBox, set as the SVG's width and height
  attributes (never stretched to the pane): 900x572 becomes 1800x1144. `diagramScale()` picks the
  scale (min and max constants). It is always 2x: the labels are 8 viewBox units of VT323 (16px on
  screen) and 4 units of Press Start 2P (8px), and the scenario's node boxes (75 to 150 units wide,
  30 to 36 tall) cannot hold 16px text at 1x. 1x would need the diagram redrawn with larger boxes;
  lowering the minimum then switches it on.
- The pane pans: pixel scrollbars both ways, and drag with the mouse (a drag does not select a node;
  touch scrolls natively). Lines and boxes draw on whole pixels (`shape-rendering: crispEdges`,
  strokes 1 or 2 units = 2 or 4px); node corners square (rx gone).
- "TRENT WATER SERVICES": the two label lines sit at +9 and +17 units, clear of the first node at
  +20 (they ran into it). The legend no longer runs under the X: the title and the X are in the
  shared bar, and the legend is its own strip that wraps.
- The audit now sizes SVG text on screen (CSS size times the SVG's scale); the pixel-art font tests
  do the same for the diagram's label rules.

## 4. Proof

Server :3480 (keyless, this worktree), game 3346 for the audit and shell X check; shots from games
3104, 3105, 3106, 3109, 3084 (specs as in build/ui-consoles).

`node tools/playtest/ui-rules-audit.mjs --port 3480 --game 3346 --all --strict --skip person-chat,network-view --sizes 1400x1000,800x600,915x412,390x844`

| Kind | Base 30ed762d3 | Tip (before the 372600713 merge) |
|---|---|---|
| window-offscreen | 0 | 0 |
| frame-offscreen | 1 (alarm panel 915, by design) | 1 (same) |
| clipped | 0 | 0 |
| x-on-frame | 0 | 0 |
| overflow | 3 (network architecture 390, NAD1) | 0 |

Shell X check (`node tools/playtest/shell-x-check.mjs --port 3480 --game 3346`): 172 checked,
0 failed (base 168 / 0; the four extra are the scenes that now report their X in the window).
Logs: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-consoles2/audit-tip.log, shellx-tip.log.

Shots: every critique B scene at 1400x1000, 800x600, 915x412, 390x844, 667x375 and 360x740, before
(base) in /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-consoles2/before and after in /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-consoles2/after, plus the SIS and ESD states. The only audit line on
the after shots is the SIEM DISMISS cancel-beside-x (known false positive, SIEM3). Contact sheets,
before row over after row: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-consoles2/sheets/<scene>.png (26). I looked at the network architecture,
segmentation map, SIEM and NCSC sheets myself; the helpers looked at every shot of their scenes
(work-forms, work-data, work-control folders) and drove a main action per scene by real clicks
(SIEM escalate, segmentation map sever/confirm/Esc, log filter add filter, SCADA range, concern form
start to close, coverage form submit, NCSC break seal, warranty verdicts, FDP tabs and confirm,
claims nav, backup tile, command board post, EHR understood, SIS row/detail/confirm).

Tests (plain `node file`): every test/js file that names a changed module plus minigame-shell-fit,
minigame-close-shell, minigame-pixel-art and minigame-consoles-fit: 125 files, 1886 pass, 0 fail,
on 5428d3779 and again after merging 372600713 (47e0f97a2). No new static imports, so no harness
copy lists changed.

## Handover (context limit, 2026-11-14)

Done: sections 1 to 4. Main merged twice (61c033b13 at 5428d3779, 372600713 at 47e0f97a2), both
clean, tests rerun after each.

Open, in order:
1. NAD on short landscape windows (915x412, 667x375): the diagram pane is about one node row tall,
   because the detail pane keeps `min-height: 110px` (css/network-architecture-minigame.css,
   `.nad-detail`) and the legend strip and title bar take the rest. Likely fix: under
   `max-height: 500px` let `.nad-body` lay the detail pane beside the diagram, or drop its
   min-height and cap it at about 25% so the pane gets the height. Check the sheet
   sheets/network-architecture.png, then rerun the audit and shell X check.
2. Not looked at by me (helpers did): the after sheets for the other 24 scenes. A reviewer should
   go through /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-consoles2/sheets once.
3. Scenario tidy (not this branch's scope): sis03 warranty checklist title repeats the case
   reference (section 2).
4. Network view is proved only with a stubbed GET /network (scratchpad work-data/drive.mjs); no
   spec in specs.mjs, and the audit skips it.

Servers: :3480 stopped by PID; nothing else started. Game ids used: 3104, 3105, 3106, 3109, 3084
(shots), 3346 (audit, shell X).

To resume: start a keyless server from this worktree on a port in 3480 to 3484 (recipe in
UI_SHELL_BUILD_LOG.md "Merge batch"), then
`node /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-consoles2/shoot.mjs --port <port> --specs /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-consoles2/specs.mjs --only network-architecture --out /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-consoles2/after --json /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-consoles2/after.json`
and `python3 -I /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-consoles2/sheet2.py /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-consoles2/before /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-consoles2/after /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-consoles2/sheets`.
