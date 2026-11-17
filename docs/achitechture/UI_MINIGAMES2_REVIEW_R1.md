# UI minigames 2 review, round 1

Branch build/ui-minigames2, tip 44bf1bd22, diffed against main 372600713 (the branch also
carries build/ui-consoles, which is not on main yet; this review covers the twelve
build/ui-minigames2 commits from 9c67a5941 on). Paths are under public/break_escape/ unless
they start with app/, tools/ or test/.

Counts: **0 B, 0 M, 4 m, 4 n.**

## Not checked this round (context limit)

The live click-through script (scratchpad ui-mg2-r1/live.mjs) was written but not run before
the context limit. These were NOT checked live by this reviewer at 1400x1000, 800x600,
915x412, 667x375, 390x844 or 360x740:

- A05 real clicks: Continue on the game-start brief and on the reload reopen, none from the
  Notepad tray. Judged from source and test/js/notes-continue-brief.test.mjs only.
- A22 real clicks: search typing, chips, disclosure, the Search Room button, and the
  Bluetooth scanner opened from its tray slot.
- A45 per-window measurements (wrap, centring, the min-height floor) and the flag station and
  VM launcher on a fresh VM game.
- A38, A35, S7-notes and S01 at the six sizes: judged from the builder's shots in scratchpad
  ui-mg2/for-user (looked at: A35-after-pc 1400x1000, A35-after-world 800x600, A38-after
  667x375, container-after 1400x1000, S7-notes-pinned 1400x1000 and 915x412, S7-notes-tape
  915x412) and the builder's after3.json audit data.

Round 2 should run live.mjs (`--part a05|a22|a45|vm|a38|a35|s7|s01`, one part at a time) on
fresh games 3697 test_seating, 3698 test_needs_sims and 3699 test_simple_vm_flag, made with
tools/playtest/new-game.rb after main's format 3 (older games such as 3513 may answer 409).

## Gates

- Strict audit (`--all --strict --skip person-chat,network-view`, four sizes, game 3513):
  window-offscreen 0, frame-offscreen 1, clipped 0, x-on-frame 0, overflow 3. The baseline
  0/1/0/0/3. The remaining breaches are outside this branch (alarm-panel 915x412,
  network-architecture 390x844).
- shell-x-check, fresh game 3697: **168 checked, 0 failed**. (A first run on 3513 timed out
  booting, 240 s, under load average near 100; not a branch failure.)
- Node tests, plain `node file`, one at a time, all pass (350 tests): minigames2-ui 5,
  minigame-shell-fit 30, minigame-close-shell 19, minigame-pixel-art 48,
  minigame-controls-layout 11, notes-continue-brief 4, notepad-start-page 5, npc-needs-debug 12,
  canvas-fonts 5, minigame-title-escape 24, pc-monitor-frame 53, engine-fixes-pass4b 10,
  social-intel 10, test-state-text 4, examine-minigame 20, rfid-door-screen 46,
  conversation-end-paths 8, pc-taskbar 30, pc-observations 6.
- Sync size: nothing in this branch writes player_state (A05 passes a client-only param).

## Findings

### m1. S7-notes: the tape strips and the pinned slip leave the page at 915x412

css/notes.css:493-494 place the tape at `left: -18px` and `right: -18px` of the slip, and
css/notes.css:513-518 move the pinned slip `translate(12px, 6px)` with a 4px shade. At 915x412
(builder shots S7-notes-tape and S7-notes-pinned) the right tape strip runs past the page edge
onto the notepad border, the left one sits over the spiral rings, and the pinned slip runs off
the right edge of the page. The pinned slip's shade meets the observation pencil button
(.notes-minigame-edit-btn) at 915x412. Whichever variant the user picks, the strips need to
stay inside the page (for example inset by the content area's padding on short screens) and
the pinned variant needs room below it for the pencil.

### m2. A22: the Bluetooth panel's rows and scrollbars stay cyan under a blue frame

A22 made Bluetooth's accent blue (#4f8dff, css/scanner-panel.css:15) so it differs from BLE,
but the scene sheet still draws its own parts in BLE cyan: device hover and expanded rows
(css/bluetooth-scanner.css:266-274, 418-421), the list and instructions scrollbar thumbs
(css/bluetooth-scanner.css:120, 244), and the frame fallback border
(css/bluetooth-scanner.css:15). The row hover also keeps a `translateY(-2px)` lift and
`transition: all 0.3s` (css/bluetooth-scanner.css:260, 268). Move these onto
`var(--scan-accent)` / `--scan-accent-dim` so one accent drives the whole panel.

### m3. A35 and build/ui-pc2: two X looks in the text viewers after both merge

No textual conflict: `git merge-tree` of this tip with build/ui-pc2 (900323876) is clean, and
pc-monitor-frame on the merged tree passes 56 of 57 (the one failure, and the two in
minigames2-ui and minigame-pixel-art, are only asset files missing from my partial extract of
the merged tree). The clash is visual. build/ui-pc2 adds a grey bevelled Win95 window X to the
PC reader's navy title bar (css/text-file-minigame.css, `.pc-monitor button.pc-window-close`,
and the button in text-file-minigame.js setupMonitorInterface). A35's world viewer keeps the
shared theme X (the blue-grey square with the red cross) at its navy bar's right end
(css/notepad-window.css:31-38). After both merge the two "notepad" windows have different
Xs, and the PC reader's toolbar keeps the slate .pc-os-btn buttons while the world viewer has
grey bevelled ones (css/notepad-window.css:80-95). Ownership: build/ui-pc2 should own the PC
reader's title-bar X (it carries the E08 behaviour: window X closes the file, bezel X closes the
PC); build/ui-minigames2 should own only the reader's page colours (css/notepad-window.css:
131-140). If the user confirms A35, a follow-up on top of both merges should give the world
viewer the same Win95 X and buttons, or ui-pc2's X should move into notepad-window.css as the
shared one.

### m4. S01: stacked panels are re-solved every frame and can jump

js/systems/npc-needs-debug.js:261 runs stackOverlayBoxes over all shown panels on every frame
(not on the 200 ms redraw), and the order is by each block's bottom edge. When two NPCs walk
past each other the "lowest" block changes and both panels swap places at once; a stacked
panel also floats with no tie to its NPC. Not seen live (unchecked); from the code. Consider
holding the order for a moment (hysteresis) or drawing a 2px leader line to the head.

### n1. A35: the PC reader "clipped" at 1400x1000 is a timing artefact

The builder's audit data (scratchpad ui-mg2/after3.json) records the text line 172-1228 cut by
#file-content at 154-698, while the shot taken in the same pass shows #file-content spanning
154-1248 with nothing cut. The audit read the box while the window was still growing.
Dismissed, but not re-measured live this round.

### n2. A38: non-square blocks on wide or short screens

The 160x120 vignette is stretched `100% 100%` (css/title-screen.css:53), so blocks are about
8.75x8.3 px at 1400x1000 and 4.2x3.1 px at 667x375. Still pixelated and stepped; a
`cover`-sized image or an aspect-matched pair would keep blocks square.

### n3. Outside A38's scope, still soft on the title screen

css/title-screen.css:157-158 (title art contrast gradients) and :177 (`text-shadow: 0 0 6px`
on the title and prompt over art) are soft. The build log says they are outside A38; leaving
them is right for this branch, but they breach the pixel-art rule and need a ruling.

### n4. A22: the shared sheet's header comment

css/scanner-panel.css:28 says "stepped corners for all three", but the frame rule has no
clip-path; the three panels have square corners. Fix the comment.

## Items checked from source (and the builder's shots)

- A05: notesShowsContinue (js/minigames/notes/notes-minigame.js:755) is true only for
  `missionBrief === true`, which only showMissionBrief passes (:779); utils/helpers.js calls it
  for the start popup and every on_start reload. The Notepad path never sets it. Correct.
- A22: one sheet, loaded after the three scene sheets; search, chips, list header, count,
  Search Room button and the disclosure keep their scene ids and hooks. Bluetooth's
  instructions are now a closed details disclosure.
- A45: the cap rule (css/minigames-framework.css:248-263) leaves the PC desktop out and has
  the min-height floor; shell-x 168/0 confirms the container regression is closed.
- A38: the vignette PNG is 160x120 RGBA with five alphas (0, 70, 130, 185, 235); the logo glow
  is gone.
- S7-notes: title 16px Press Start on short screens, one line, ellipsis, in css/notes.css.
- S01: labels in the GNF bitmap font, outlined, display names; npc-needs-debug tests pass.
- Pixel-art UI rule on the new CSS: 2px borders, square corners, pixel fonts, no gradients or
  soft shadows in scanner-panel.css, notepad-window.css or the notes slip rules (the pinned
  shade is a hard 4px offset, which the rule allows as flat colour).
