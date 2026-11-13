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
| X5 | Scene-owned close buttons and their handlers removed: claims Close, coverage Close, warranty Close (and its empty footer), blockchain Close Terminal, EHR [CLOSE TERMINAL] (online view), log filter [CLOSE]. The log filter now draws into the framework game area (it used to clear the whole shell), so it has the standard X. EHR [UNDERSTOOD] kept (acknowledges the outage notice). Coordinator decisions (rule: minigames close with the X only; confirms keep two named buttons and no X): the ESD confirm keeps CONFIRM and CANCEL; the SIS detail and compare pop-ups are not confirms, so their Close text buttons became the shared X (`.minigame-close-button`) inside the pop-up, with the pop-up title padded for it. While the SIS overlay (pop-ups or confirm) or the ESD confirm is open, the scene X hides, so one close control shows at a time | the scene JS files |
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
| IP1 | When the pump's box is narrower than the 784px side-by-side canvas, the scene lays out one 368px column: the MAR record (as tall as its rows) above the pump; the pump screen wraps its rows and holds a two-line message; keypad and Confirm below, reached by scrolling the box with More below. Whole zoom only, no game-logic change. Turning the phone round rebuilds the scene in the other layout and keeps the typed rate. The pop-ups now centre on the visible part of the canvas (they were centred on the canvas, so off screen when scrolled) | infusion-pump js |
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

Second builder (final pass):

| Item | Fix | Where |
|---|---|---|
| 5a ESD at 800x600 | Fits (audit clean, shot checked). The confirm also now covers the part of the panel in view when the panel is scrolled (it sat at the panel's scroll top) and the panel holds still under it | esd js |
| 5b title logo at 390 | Logo width min(300px, 50vw - 16px), so the zoom to 200% ends inside the screen | title-screen css |
| 5c lockpicking at 915x412 | Short landscape windows (max-height 560, min-width 769): item strip compact, picture at its own 1x size in a row with the name; the strip went from 224 to about 112px and the pins, shear line and tools show without scrolling. The lock itself is not scaled (no whole step fits) | lockpicking css |
| ESD audit | Hazard stripes start with an explicit 0 stop (hard stops, the audit accepts them); ESD button text size 16px (was the 13.33px button default) | esd css |
| SIEM (after shots) | Rows had min-height in a fixed-height flex column, so they shrank and wrapped messages ran over the next row at 915x412; at 800 the message column was squeezed to one letter a line. Rows never shrink now, and below 1100px the message takes its own line under badge, time, host and buttons | siem css |
| Command board (after audit) | The log field was 100% wide plus padding and ran 14px past the board at 390: border-box, minmax(0, 1fr) column | command-board css |
| Segmentation map (after audit) | Map area 384px tall at least, so the clinical zone's six devices are not cut at 915x412 | segmentation css |
| Pixel scrollbars (after shots) | Default scrollbars showed on the ransomware note, log filter panes and backup consequence panel: `pixel-scroll` added | those scene js |
| Claims, backup recovery font-size | Nav buttons and source tiles had the 13.33px button default (their parts set their own sizes): 16px | those css |

Not done:
- 5d (Agent HaX incoming-call toast over the PIN title at 915x412): needs logic. The ring layer
  is a fixed top-centre strip, and at 412px tall the minigame frame fills the window, so any
  fixed spot covers some scene's content (top centre: titles; bottom: the lock or keypad rows;
  top right: the X). Avoiding the title needs the open minigame's title rectangle measured and
  the toast moved clear of it. Not attempted.
- X8, NAD1, CF1: waiting on the user. NAD1 is the one remaining overflow line (network
  architecture at 390, the 700px diagram).
- SIEM3: false positive (DISMISS is a per-alert action); the audit still counts it as
  cancel-beside-x.

## 3. Tests

- test/js/minigame-consoles-fit.test.mjs (10 tests): no scene-owned Close/[CLOSE]/Close
  Terminal button in the 12 changed scenes; pop-ups that are not confirms use the shared X,
  confirms keep two named buttons, the scene X hides while either is open, EHR keeps
  [UNDERSTOOD]; log filter never clears the shell; the framed scenes opt into closeInsideFrame
  with the right anchor; no scene px minimum or viewport height that pushes a frame off a short
  window; the command board is never scaled; pixel rules in the console sheets; Press Start on
  its grid; every multi-column console has a 600px phone rule; the after-shot fixes (SIEM rows,
  command board field, pixel scrollbars).
- test/js/minigame-close-shell.test.mjs (19 tests, 3 new): pump stacking width and layouts,
  keypad and Confirm geometry (side by side unchanged, stacked fits), pop-up centring on the
  visible canvas.
- Every test file that names a changed module, plus minigame-shell-fit and minigame-close-shell
  (36 files, plain `node file`): 524 pass, 0 fail on c13feb914..a2a4f5220; the files for the
  last commit cc897d552 rerun after it: all pass (consoles-fit 10/10).

## 4. After results

Audit on the tip (cc897d552), fresh game 3346 (test_seating), and the baseline worktree
(fc4b4d8a5, :3481) re-run on the same game:

`node tools/playtest/ui-rules-audit.mjs --port <port> --game 3346 --all --strict --skip person-chat,network-view --sizes 1400x1000,800x600,915x412,390x844`

| Kind | Baseline fc4b4d8a5 | Tip cc897d552 |
|---|---|---|
| window-offscreen | 0 | 0 |
| frame-offscreen | 5 | 1 (alarm panel 915, by design, in the baseline too) |
| clipped | 23 | 0 |
| x-on-frame | 0 | 0 |
| overflow | 29 | 3 (network architecture 390, NAD1, in the baseline too) |

The baseline re-run on game 3346 gave exactly the first builder's figures (5 / 23 / 0 / 29). No
fit line on the tip is new against the baseline. An interim tip run (before cc897d552) had SIEM
800/915 clipped and command board 390 clipped; cc897d552 fixed them. The title screen 390 line
(accepted at the baseline) and ESD 800x600 are clean. SIEM still reports cancel-beside-x
(SIEM3, false positive). Logs: scratchpad ui-consoles/after2/audit-base.log, audit-tip2.log.

Shell X check (`node tools/playtest/shell-x-check.mjs --port 3480 --game 3346`): 168 checked, 1 failed (baseline: 164 checked, 0 failed). The failure is new: network segmentation map 915x412, "scrolled to the end: X over the scrollbar of div.nsm-consequence-body". Probably from cc897d552 (map area raised to 384px), which leaves the consequence panel short enough to scroll beside the map, with its scrollbar under the X. Open, see Handover. Log: after2/shell-x-tip.log.

Shots: scratchpad ui-consoles/after2 (every critique B scene at the four sizes, plus SIS
detail/compare/confirm, ESD confirm and confirm-scrolled, pump conflict and double-check
pop-ups and rotation, lockpicking door, title screen); contact sheets in after2/sheets. Looked
at every scene at every size. The SCADA spec now opens the historian from hmi_ops_01's
contents (it is not a room object). The earlier coverage form, ransomware, blockchain and
capture log shots are title-only starts with no data (layout only).

## Final state (2026-11-13)

Branch build/ui-consoles, tip: the commit of this log (after cc897d552). Not ready to merge until the open item below is fixed. Commits after the first builder's
9518023ca: c13feb914 (IP1), 7e9810557 (close controls, ESD), a2a4f5220 (5b, 5c), cc897d552
(after-shot fixes), and this log.

Servers :3480 and :3481 stopped by PID. The baseline worktree .claude/worktrees/p-ui-consoles-base
(detached at fc4b4d8a5) is left in place for the coordinator to remove.

Gotchas: the server serves files live, so never edit while a baseline run is going on the same
tree; `font-weight: bold` hides in one-line rules; a button with no text of its own still gets
flagged for the 13.33px default size; a flex column that scrolls needs `flex-shrink: 0` on rows
that set an explicit min-height.

## Handover (context limit, 2026-11-13)

Done: IP1, the close-control decisions, 5a to 5c, the after audit and shell X check, shots of
every scene at four sizes looked at, fixes from them (sections 2 to 4).

Open, in order:
1. Shell X check failure, network segmentation map 915x412: X over the scrollbar of
   `.nsm-consequence-body` when scrolled to the end. Look at the right edge of the body at
   915x412 (the panel sits beside the map from 901px up); likely fixes: give the consequence
   panel's top the X's clearance, or let `.nsm-body` scroll and drop the inner scroll on
   `.nsm-consequence-body` at max-height 560. Then rerun
   `node tools/playtest/shell-x-check.mjs --port <port> --game 3346` (about 10 minutes) and the
   audit, and expect 168 checked, 0 failed with audit 0 / 1 / 0 / 0 / 3.
2. 5d (toast over the PIN title): needs logic; see "Not done".
3. X8, NAD1, CF1: waiting on the user.

To resume: start the keyless server from this worktree on a port in 3480 to 3484 (recipe in
UI_SHELL_BUILD_LOG.md "Merge batch"), game 3346. Shots: `node <scratchpad>/ui-consoles/shoot.mjs
--port <port> --specs <scratchpad>/ui-consoles/specs.mjs --only network-segmentation-map --out
<scratchpad>/ui-consoles/after2`, then `python3 -I <scratchpad>/ui-consoles/sheet.py after2
after2/sheets` for a contact sheet.
