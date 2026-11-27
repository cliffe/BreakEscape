# UI minigames 2 review, round 2

Branch build/ui-minigames2, tip db90cd566 (fix round 1). Paths are under public/break_escape/
unless they start with tools/, test/ or docs/.

Counts: **0 B, 0 M, 4 m, 7 n.** Three of the four m items were already on main and only
came to light in the live run; one (m4) is new in fix round 1.

## Merge with main

`git merge-tree --write-tree db90cd566 1f3ac1f0b` exits 0 with no conflicted paths. Not merged.

## How this round was checked

Keyless server on :3465 from the worktree. Every run got a fresh game from
tools/playtest/new-game.rb made just before it: A05 on 3832, 3843, 3852, 3867, 3881 and 3890
(one per size); a22 3912, a45 3925, vm 4019, a38 3967, a35 3974, s7 3989, s01 4000, flag probe
4035, strict audit 4041, shell-x 4066. Each page landed on the character picker first;
female_hacker_hood_v2 was chosen and the run carried on. The R1 live script was extended to
measure hover lift, the accent, overflow children, horizontal scrollbars and vignette block
size. All six sizes (1400x1000, 800x600, 915x412, 667x375, 390x844, 360x740), real clicks
and typing. Shots were looked at.

## R1 findings

| R1 | Status | Evidence |
|---|---|---|
| m1 S7-notes strips and pinned slip | closed | All three variants at all six sizes: strips inside the page (915x412: 367-419 and 494-546 in 297-618), pinned slip and shade inside, nothing over the pencil (gap 2 px at 915x412, 1 px at 667x375, 6 to 29 px elsewhere). |
| m2 Bluetooth accent | closed (n1 left) | Frame, search border, rows and the tray-opened panel are all #4f8dff at every size. Row hover: transform none, box-shadow none, top unchanged (no lift). |
| m3 two X looks after ui-pc2 | closed by ownership | No PC-reader X rule in this branch; left to build/ui-pc2 as agreed. |
| m4 S01 stacking swaps | closed for swaps; see m3 below | Stable id order (js/systems/npc-needs-debug.js:128-131). Five panels, no overlaps at six sizes. Swaps over time NOT measured (probe written, not run: context limit). |
| n1 PC reader "clipped" at 1400 | not a timing artefact; see n2 | Reproduced after a 3 s settle; the audit is misled by `zoom: 2`. |
| n2 vignette blocks | closed | Block size 9x9 (1400x1000), 5x5 (800x600), 6x6 (915x412), 5x5 (667x375), 8x8 (390x844), 7x7 (360x740). Image 160x120, pixelated, soft list empty. |
| n3 title art soft gradients | replaced, but see m4 | Now stepped bands with a 2 px flat text shadow. |
| n4 comment | closed | css/scanner-panel.css:28. |

## Items never checked live before (R1 list)

- **A05**: pass at all six sizes. Continue shows on the game-start brief and on the reload
  reopen (after Resume), and clicking it closes the brief. There is no Continue when the brief
  is opened from the Notepad tray, and none on an ordinary note. Esc closes. At 667x375 the
  notepad's top edge is at -11 px (n3, already on main).
- **A22**: search, chips, disclosure and Search Room all respond to real clicks. The Bluetooth
  scanner opens from its tray slot with real clicks at all six sizes, in its own blue. Typing
  loses letters in two of the three searches (m1).
- **A45**: cryptex, padlock, text file, container, empty container, flag station and VM
  launcher at six sizes, all centred (cx 0). Windows wrap their content up to the cap, with the
  X inside. The flag station at 390x844 and 360x740 really does overflow sideways (m2), and
  that overflow was already on main. Cryptex and padlock at 667x375 still have their outer
  wheels clipped; that is in the main baseline (n3).
- **A38**: square whole-number blocks (table above).
- **Title art bands**: m4.
- **A35**: world viewer and PC reader page #fbfbf2, text #111 GNF 16px, navy bar, at all sizes.
  The PC reader at 1400x1000 is not cut (shot), but the audit still says so after settling (n2).
- **S7-notes**: as in the table above. Small look notes in n4.
- **S01**: no overlaps, but stacking can push a panel off the top of the view (m3).

## Gates

- Strict audit (`--all --strict --skip person-chat,network-view`, 1400x1000, 800x600, 915x412,
  390x844, game 4041): window-offscreen 0, frame-offscreen 1, clipped 0, x-on-frame 0,
  overflow 3. The expected baseline is 0/1/0/0/3; strict exits 1 on the known frame-offscreen
  breach outside this branch.
- shell-x-check, game 4066: **168 checked, 0 failed**.
- Node tests, plain `node file`, one at a time, all pass (351): minigames2-ui 5,
  minigame-shell-fit 30, minigame-close-shell 19, minigame-pixel-art 48,
  minigame-controls-layout 11, notes-continue-brief 4, notepad-start-page 5,
  npc-needs-debug 13, canvas-fonts 5, minigame-title-escape 24, pc-monitor-frame 53,
  engine-fixes-pass4b 10, social-intel 10, test-state-text 4, examine-minigame 20,
  rfid-door-screen 46, conversation-end-paths 8, pc-taskbar 30, pc-observations 6.
- Sync size: fix round 1 writes nothing to player_state.

## Findings

### m1. Bluetooth and biometrics search fields lose typed letters (already on main)

Typing "Head" into the Bluetooth search gave "H". Typing "Alice" into the biometrics search
gave "lic". The game's key handler takes the letters it uses for controls (a, d, e and so on)
before the input gets them. The BLE panel stops this with keydown and keyup stopPropagation
(js/minigames/ble-scanner/ble-scanner-minigame.js:142-143). The other two panels have only the
input listener: js/minigames/bluetooth/bluetooth-scanner-minigame.js:138-141 and
js/minigames/biometrics/biometrics-minigame.js:182-185. The same code is on main
(1f3ac1f0b), so this is not a regression. A22 made the three searches look like one control,
though, and two of them cannot be typed into properly. Fix: the same two listeners as BLE.
Shots: a22-bluetooth__*.png, a22-biometrics__915x412.png.

### m2. Flag station: the Submit button runs off the window at 390x844 and 360x740 (already on main)

scrollWidth 381 against clientWidth 354, with a 14 px horizontal scrollbar under the form. The
button sits at 281-399 in a 390 px viewport (shot a45-flag_station__390x844.png). This is
real sideways overflow. The audit passes it only because a scroll box can reach it. The
cause is not A45: with the A45 cap rule switched off in the page, the numbers are identical.
`.flag-input` is `flex: 1` with the default `min-width: auto`, and its size=20 intrinsic
width (233 px), plus the 118 px button and the 10 px gap, do not fit in 314 px
(css/flag-station-minigame.css:37-43). Fix: `min-width: 0` on `.flag-input`, and let the row
wrap below about 360 px.

### m3. S01: a stacked panel can climb off the top of the view

At 1400x1000 (shot s01-needs__1400x1000.png) Sanjay's panel is stacked above Grace's and
Marek's. It runs up past the room into the black, and its top bar is cut at screen y 0. A
panel processed later in id order always goes up past every panel already placed
(js/systems/npc-needs-debug.js:128-145, called at :264). With the fixed order, the NPC lower on
screen can get the panel at the top, which crosses the other NPCs. Nothing clamps a stacked
panel to the camera's view. Suggest placing the panel below the head when the upward stack would
leave the view (or capping the stack and fading the extra panels), and a 2 px leader line once a
panel is more than one panel-height from its head. Swaps over time were not measured.

### m4. Title art: the stepped bands show as translucent vertical columns (new in fix round 1)

The coordinator's shot (scratchpad ui-mg2/for-user/N3-title-art-after__1400x1000.png),
compared with the before shot, shows hard vertical edges every 84 px across the illustration
(x about 364, 448, 532, 616, 700, 784, 868) and horizontal edges every 60 px at the bottom.
They come from css/title-screen.css:157-159, two hard-stop gradients of 7 and 11 bands at
0.1 alpha steps. Each step is a full-height straight line through the art, so the picture
reads as if seen through glass panes. This looks worse than before. The vignette's own steps
follow the oval and read as pixel art; these do not.

Cleanest option that keeps the rule: drop the two band gradients. Bake the right-hand and
bottom darkening into a 160x120 scrim PNG (or into the vignette PNG itself), drawn with the
same `--vignette-size` whole-number scale. The steps then follow the same square blocks as the
vignette and can curve or dither, with no straight full-height columns. A simpler fallback is
a flat dark text plate (one solid colour, 2 px border or the theme frame) behind the title
block only, leaving the art untouched. Keep the flat `2px 2px 0 #000` text shadow (:178) in
either case.

### n1. Bluetooth rows: a colour fade and a green thumb hover remain

css/panels.css:105 still gives `.bluetooth-device` `transition: all 0.2s`, measured live, so
the hover colour fades in instead of switching. css/bluetooth-scanner.css:248-250 turns the
list's scrollbar thumb green (#4caf50) on hover. Neither is a lift; both are leftovers from
the one-accent change.

### n2. PC reader "clipped" at 1400x1000 is an audit false positive from zoom

css/pc-monitor.css:75 sets `zoom: var(--pc-ui-scale)`, which is 2 at 1400x1000.
tools/playtest/ui-rules-audit.mjs:110-111 builds the clipping box from the zoomed rect's
corner plus the unzoomed `clientWidth` (544), so the box is half as wide as the drawn one.
The audit read 154-698 against a drawn 152-1248, and the result is the same after a 3 s
settle. The shot shows nothing cut. Fix in the audit: scale clientWidth and clientHeight by
`rect.width / offsetWidth`. Nothing to change in the game.

### n3. Already on main, seen at 667x375

The notepad frame's top sits at -11 px (brief, Notepad and all three slip variants). The
title line still ends in an ellipsis inside the page. Cryptex and padlock have their outer
wheels and dials clipped. Both are in the builder's before.log, so neither is a regression;
667x375 is not one of the strict audit's sizes.

### n4. S7-notes look details

The tape strips are asymmetric: the left one is 6 px in, the right one 44 px in so that it
clears the pencil (css/notes.css:493-494). On the pinned variant at 915x412 the red pin sits
on the title's underline (css/notes.css:520-528 with the slip moved 4 px up at :516). At
667x375 the pencil touches the slip's corner (gap 0 to 1 px). The user picks one variant
anyway; this is for whichever one stays.

### n5. Vignette at portrait sizes

Cover scaling (js/minigames/title-screen/title-screen-minigame.js:61-72) crops the vignette's
side bands away on tall screens. At 390x844 only the top and bottom bands show. This is the
expected cost of square blocks.

### n6. Search focus border is green in all three panels

css/scanner-panel.css:146-148 uses #4caf50 for focus rather than `--scan-accent`. It is the
same in all three panels, so it is consistent, but it goes against "one accent drives the
panel". Needs a ruling.

### n7. Biometrics: the X sits over the search field once the panel scrolls

At 915x412, after a click in the search field scrolls the panel, the X stays at the top and
lies over the search input (shot a22-biometrics__915x412.png). It can still be clicked, and
shell-x passes it.

## Not checked this round

- S01 swaps and jumps over time (scratchpad ui-mg2-r2/s01probe.mjs written, not run: the
  coordinator called the handover).
- The title art at the six sizes on this tip: the test title screen opened without art. m4 is
  judged from the coordinator's 1400x1000 shot of this tip's CSS (title-screen.css has not
  changed since).
