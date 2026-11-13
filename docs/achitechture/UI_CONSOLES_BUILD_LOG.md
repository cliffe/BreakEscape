# UI consoles build log (build/ui-consoles)

Branch build/ui-consoles from build/ui-shell fc4b4d8a5. Scope: critique B (consoles, SIS and
network scenes; scratchpad critique-b/findings.md) on top of the shell work. Paths are under
public/break_escape/ unless they start with tools/, test/ or docs/.

Not built (waiting on the user): X8 (one shared console window and title bar), NAD1 (network
architecture diagram text), CF1 (concern form full-bleed layout).

## 1. Baseline (fc4b4d8a5)

The baseline was taken from a detached worktree at fc4b4d8a5 (.claude/worktrees/p-ui-consoles-base,
keyless server :3481), so edits in this branch could not leak into it. Game 3084 (test_seating),
headless shell with scrollbars shown (15px).

`node tools/playtest/ui-rules-audit.mjs --port 3481 --game 3084 --all --strict --skip person-chat,network-view --sizes 1400x1000,800x600,915x412,390x844`

    SUMMARY window-offscreen 0 (0 surface-sizes), frame-offscreen 5 (5), clipped 23 (8), x-on-frame 0 (0), overflow 29 (12)

Same counts as the shell branch's R2 table. Scenes with a fit breach on the baseline: alarm panel
(915, by design), backup recovery (3), claims management (2), command board, coverage decision
form, drug library, EHR terminal, ESD pushbutton (2), network architecture, network segmentation
map, ransomware display, SCADA historian (2), SIEM, SIS config threshold (2), title screen (390,
accepted).

Shots: scratchpad ui-consoles/shots-before (base, real scenario objects in games 3104 to 3109,
title-only starts for coverage form, ransomware, blockchain and capture log) and
ui-consoles/shots-after (this branch). The SCADA historian spec named the wrong room and did not
open in either run (fix the spec: see handover).

### Critique items: already fixed by the shell branch / still open at the baseline

| Item | Baseline state |
|---|---|
| X1 border on the shell | Already fixed (border-box shell) |
| X2 overflow above the top | Mostly fixed (safe centring, scrolling shell); scene-owned heights still pushed ESD, claims, EHR, SIS, backup recovery, coverage form frames off or into the shell's scroll (overflow 29) |
| X3 phone columns | Open |
| X4 X inside frame | Open for EHR, ESD, SIS, backup recovery, command board, capture log; DLI, NAD, NCSC already opted in but text ran under the X |
| X5 scene Close buttons | Open (claims, coverage, warranty, blockchain "Close Terminal", log-filter "[CLOSE]", EHR "[CLOSE TERMINAL]") |
| X6 non-pixel styling | Open |
| X7 Press Start line height | Open |
| X9 small text | Open |
| Per-scene items | All open except SIEM3 (false positive, no change) and SH2 (chart labels already 16px SVG text at 1:1) |

## 2. Fixes

| Item | Fix | Where |
|---|---|---|
| X5 | Scene-owned close buttons and their handlers removed: claims Close, coverage Close, warranty Close (and its empty footer), blockchain Close Terminal, EHR [CLOSE TERMINAL] (online view), log filter [CLOSE]. The log filter now draws into the framework game area (it used to clear the whole shell), so it has the standard X. EHR [UNDERSTOOD] kept (acknowledges the outage notice). Sub-dialog buttons kept: ESD confirm-dialog CANCEL, SIS detail and compare pop-up Close (they shut the pop-up, not the scene) | the scene JS files |
| X4 | closeInsideFrame with closeAnchor on the frame: EHR (.ehr-terminal-panel), ESD (.esd-panel), SIS config (game area), backup recovery (.backup-recovery-shell), command board (#cb-panel), log filter (.lf-wrapper), capture log (game area, now a framed window). Header right padding for the X (48 to 56px) on SIS, backup recovery, claims, coverage, DLI, SCADA, warranty, log filter, blockchain, NAD (54px, min-height 46), NCSC bar (52px, 50px tall) | css and js per scene |
| X2 / scene heights | EHR, ESD, SIS, backup recovery: frames size to content with max-height 100% and scroll inside (pixel-scroll); claims, coverage, SCADA: 620/500px minimums gone; command board: 540px minimum and the `transform: scale(0.85)` below 1200px gone (crisp text), short windows scroll the board; ransomware: 100vw/100vh gone | css per scene |
| X3 | Under 600px: claims nav wraps above the record, cards one per row; command board timeline above status, [AUTO] under the time; SIEM alerts on two lines, queue below; SCADA channel list above the chart; log filter builder above the table; blockchain graph above detail; EHR patient list above the record; SIS table rows as cards with the column name in each cell (data-label); segmentation map panel under the map below 900px, the map keeps 760px and scrolls sideways; network view locked badge holds its width and drops under the text under 480px | css per scene; data-label attributes in sis-config-threshold-minigame.js |
| X6 | Courier New to VT323 (coverage, warranty, log filter, SIS fallback) with sizes raised to VT323 equivalents; 1px lines to 2px; gradients to flat fills (claims panel and progress, EHR panel; EHR dose bar and ESD stripes are hard stops); ESD radial button to flat red with hard inset bands; glows gone (segmentation zones, rule glow, SIS hover, EHR shadow, ESD backdrop blur); radius gone (log filter, blockchain); faux bold gone in every console sheet | css per scene |
| X7, X9 | Press Start 2P on 8/16/24px with whole-pixel line heights (16/24/32) in every console sheet; blockchain 5 to 7px text to 8px, GNF/VT323 13 to 15px to 16px; claims summary 7px to 8px | css per scene (scratchpad pixelfix.py did the mechanical part, then checked by hand) |
| BR1-3 | See X2/X4; slot state on its own line under 860px | backup-recovery css |
| CMS1-3 | See X2/X3/X5; Print Excerpt is the shared .minigame-button | claims css/js |
| CB1-3 | Status list scrolls in its column, header and log bar never shrink; title wraps at 16px (8px under 1200px) | command-board css/js |
| CDF1-2 | Form fills the window, sections scroll between header and footer | coverage css/js |
| DLI1-2 | Header padded, tabs wrap, the panel scrolls both ways (pixel scroll); Run verification is the shared .minigame-button | drug-library css/js |
| EHR1-2 | Panel sizes to content, content safe-centred and scrolls | ehr css/js |
| ESD1-2 | Transparent game area, the panel is the frame and scrolls inside, label padded for the X | esd css/js |
| FDP1 | Tabs wrap onto a second row | forensic css |
| IP2 | More below in its own strip under the canvas | infusion-pump css |
| NCSC1 | TLP bar 50px tall with 52px side padding, so the X sits inside the band clear of the text | ncsc css |
| NSM1-2 | Body scrolls, panel stacks under 900px; SVG rule labels in VT323 | segmentation css/js |
| NV1-2 | See X3; frame edge #6b7f8f so the 2px border reads | network-view css |
| RD1 | Timer row wraps, 24px timer (16px on phones), note 8px/16px | ransomware css |
| SH1 | See X3; toolbar groups wrap | scada css |
| SIEM1-2 | See X3; messages wrap from 1100px down | siem css |
| SIS1-2 | See X2/X3; opaque frame, no inset shadow, container border gone | sis css/js |
| WC1 | VT323 form, 2px boxes, letterhead padded and wraps, Close gone | warranty css/js |
| BCE1 | See X3/X9 | blockchain css/js |
| CL1 | Framed window (2px frame, max 760px) with the framework title inside the frame as its bar and the X in it; list scrolls inside; 2px rows; text 16 to 20px | capture-log css/js |
| LF1 | See X3/X5/X6 | log-filter css/js |

Skipped:
- IP1 (keypad beside the record at 390): the record and keypad are drawn on the Phaser canvas
  (784px wide), so stacking them needs a portrait layout in the scene's Phaser drawing code. Not
  attempted in this branch; at 390 the canvas scrolls sideways inside its box at 1x.
- X8, NAD1, CF1: waiting on the user.
- SIEM3: false positive (DISMISS is a per-alert action); the audit still counts it as
  cancel-beside-x.

## 3. Tests

- test/js/minigame-consoles-fit.test.mjs (8 tests, new): no scene-owned Close/[CLOSE]/Close
  Terminal button in the 12 changed scenes; log filter never clears the shell; the framed scenes
  opt into closeInsideFrame with the right anchor; no scene px minimum or viewport height that
  pushes a frame off a short window; the command board is never scaled; pixel rules in the
  console sheets (no Courier, 1px lines, radius, faux bold, soft gradients); Press Start on its
  grid with px line heights; every multi-column console has a 600px phone rule.
- Every test file that names a changed module, plus minigame-shell-fit and minigame-close-shell
  (34 files, plain `node file`): 513 pass, 0 fail (before the last shot-fix commit 8d6c5398f;
  the new test passes after it).

## 4. After results

See the handover: the after audit was running when the context limit came.

## Handover (context limit, 2026-11-13)

Done: sections 2 and 3, commits 8eb80aa66, 1ec5496d7, 20ee61065, dece21959, 836db485e,
b67176897, 8d6c5398f (and the commit of this log).

Open, in order:
1. Re-run the after audit and shell-x-check on the tip (the after audit in progress started
   before 8d6c5398f, so its numbers mix two states):
   start the keyless server from this worktree on :3480 (see UI_SHELL_BUILD_LOG.md "Merge
   batch" for the command, pid file test/dummy/tmp/pids/server-3480.pid), then
   `node tools/playtest/ui-rules-audit.mjs --port 3480 --game 3084 --all --strict --skip person-chat,network-view --sizes 1400x1000,800x600,915x412,390x844 --json <out>`
   and `node tools/playtest/shell-x-check.mjs --port 3480 --game 3084`. Compare with section 1
   (5 / 23 / 0 / 29) per kind and fill section 4. The baseline shell-x-check log is
   scratchpad ui-consoles/before/shell-x.log.
2. Re-shoot: `node <scratchpad>/ui-consoles/shoot.mjs --port 3480 --specs <scratchpad>/ui-consoles/specs.mjs --out <scratchpad>/ui-consoles/shots-after`
   and look at every changed scene at the four sizes. Fix the SCADA spec first: the object
   `historian_trend_viewer` is not in scada_control_room (grep sis02_energy for its room), or
   start it title-only. Shots looked at so far: ESD 915 (fixed after: panel now scrolls inside),
   backup recovery 915 (good), command board 390 (header overlap fixed after), SIEM 390 (good),
   EHR 915 (icon clipped, fixed after), segmentation map 390 (map widened after), claims 390
   (good). Not yet looked at: coverage form, ransomware, blockchain, capture log, log filter,
   warranty, DLI, SIS, NCSC, FDP, network view (needs a joined foothold, use the real path).
3. Remaining audit kinds to check in the after run: claims and backup recovery reported
   `font-size` (probably GNF at an odd size; check the detail in the JSON); ESD reported
   `gradient` (the hazard stripes are a hard-stop repeating gradient: check the audit's hard-stop
   test accepts it, or draw the stripes another way); network architecture 390 `overflow` (NAD1
   territory: note only).
4. IP1 portrait canvas layout (skipped, see above): ask the orchestrator whether to build it.
5. Coordinator additions (train 35 live check, shots in
   /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/train35-live/), not started:
   a. ESD at 800x600: frame ran 40px past the bottom inside the scrolling shell. Probably fixed by
      8d6c5398f (the panel is now the scroller, max-height 100%); confirm in the after audit.
   b. Title screen at 390x844: the oversized logo is clipped by its container. Make the logo fit
      at 390 (css/title-screen.css).
   c. Lockpicking at 915x412: the 224px header leaves 188px for a 494px lock. Compact the header
      or scale the lock by a whole step if it fits cleanly; otherwise note and skip.
   d. Agent HaX's incoming-call toast covers the PIN title at 915x412: see whether the toast can
      avoid an open minigame's title bar by layout alone; if it needs logic, note and skip.
   Recipe fix for UI_SHELL_BUILD_LOG.md "Merge batch" (new-game.rb, pid file path): done in this commit.
6. Known side effect to check: the ESD confirm modal is `position: absolute; inset: 0` inside
   the now-scrolling panel, so on a short window it covers the panel's top, not the scrolled
   view. Pressing the button scrolls the housing into view first in practice; check at 915x412.

Servers: :3480 (this worktree) and :3481 (the baseline worktree
.claude/worktrees/p-ui-consoles-base, detached at fc4b4d8a5) are stopped by PID at the end of
this run; the baseline worktree is left for the next agent (remove it with `git worktree remove`
when done).

Gotchas: the server serves files live, so never edit while a baseline run is going on the same
tree (the first baseline here was discarded for that reason); `font-weight: bold` hides in
one-line rules the pixelfix script does not see; jsdom-free source tests only, no new engine
imports (no harness copy list change needed).
