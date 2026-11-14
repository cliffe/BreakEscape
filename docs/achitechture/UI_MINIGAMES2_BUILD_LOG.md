# UI minigames 2 build log (build/ui-minigames2)

Branch build/ui-minigames2 from build/ui-consoles 30ed762d3. Scope: the user's picks of
2026-11-14 for minigame UI (A05, A22, A45, A38, S7-weight, A35, S7-notes, S01). Paths are
under public/break_escape/ unless they start with app/, tools/ or test/.

Shots: before from a detached worktree of 30ed762d3 on :3466, after from this branch on
:3465, same specs (scratchpad ui-mg2/specs.mjs, shooter ui-mg2/shoot.mjs), sizes 1400x1000,
800x600, 915x412, 390x844, 667x375. Games: 3513 test_seating, 3514 test_needs_sims,
3525 test_simple_vm_flag.

## Items

| Id | Result | Where |
|---|---|---|
| A05 | The notepad draws no Continue; X and Esc close it. `showMissionBrief()` (the popup at game start, or on reload when the scenario's `show_scenario_brief` says so) passes `missionBrief: true`, and only then is Continue drawn (`notesShowsContinue`). Reading the brief later from the Notepad has no Continue. | js/minigames/notes/notes-minigame.js; test/js/notes-continue-brief.test.mjs (4) |
| A22 | One stylesheet, css/scanner-panel.css, for the BLE scanner, Bluetooth scanner and biometrics kit: frame, toggle, header, search, chips, list header, count, list box, action button and instructions. Each scene adds `scanner-panel scanner-panel--<key>` and shared `scan-*` classes. Accents: BLE cyan #00bcd4, Bluetooth blue #4f8dff (was cyan like BLE), biometrics red #e74c3c. The panel stays left, 2vw in. Bluetooth's instructions are now a closed "How to use the scanner" disclosure like the kit's. The scenes' own sheets lost the rules the shared sheet owns. | css/scanner-panel.css, the three scanner CSS and JS files, app/views/break_escape/games/show.html.erb; test/js/minigames2-ui.test.mjs |
| A45 | Flag station, VM launcher, container (not in PC desktop mode), combination, cryptex and text file windows: `width: fit-content; min-width: min(480px, 100%); max-width: min(960px, 100%); height: auto; max-height: min(720px, 100%); margin: auto`. | css/minigames-framework.css; test/js/minigames2-ui.test.mjs |
| A38 | The vignette is tools/make_title_vignette.py's 160x120 RGBA image (5 flat alpha bands, stair-stepped edges), stretched with `image-rendering: pixelated`; the logo's soft drop-shadow glow is gone. The old values are in a comment for a quick revert. Not touched: the scanlines (hard stops) and the title art's contrast gradients (css/title-screen.css, `.title-screen-art` area), which are outside A38. | css/title-screen.css, assets/ui/title-vignette.png, tools/make_title_vignette.py |
| S7-weight | No change: the blanket single-weight rule stays (css/minigames-framework.css). | none |
| A35 | For the user's confirmation. css/notepad-window.css gives the world text viewer a Windows 95 notepad look (grey bevelled frame, navy title bar with the X at its right end, GNF 16px white title, bevelled grey toolbar buttons, sunken light page, dark GNF text) and turns the PC file reader's dark pane light to match (its title bar was already navy). One link in show.html.erb; removing it restores the old looks. | css/notepad-window.css, app/views/break_escape/games/show.html.erb |
| S7-notes | For the user's choice. Title 16px Press Start on short screens too, one line, ellipsis. The note slip: default "tape" (yellowed tape over both top corners, ends cut in 2px teeth); `.note-style-torn` (bottom edge torn in square steps, one tape strip on top); `.note-style-pinned` (yellow slip set 12px right and 6px down, off the ruled lines, hard 4px offset shade, a pixel pin). Classes go on `.notes-minigame-notepad`. | css/notes.css |
| S01 | The GNF bitmap sprite-sheet font exists (assets/fonts/gnf-bitmap, js/utils/pixel-text.js). The needs overlay now draws with it: outlined white labels at 1x, display names from the NPC manager (id as fallback), bar letters in GNF, bars one GNF line box apart, and panels that would overlap are stacked upward (`stackOverlayBoxes`). | js/systems/npc-needs-debug.js; test/js/npc-needs-debug.test.mjs (+4) |

## Tests

Run alone (plain `node file`), all pass: minigames2-ui 5, notes-continue-brief 4,
minigame-shell-fit 30 (three source and rule checks updated for the shared classes),
minigame-close-shell 19, minigame-pixel-art 48, minigame-controls-layout 11, notepad-start-page 5,
npc-needs-debug 12, canvas-fonts 5, minigame-title-escape 24, pc-monitor-frame 47,
engine-fixes-pass4b 10, social-intel 10, test-state-text 4, examine-minigame 20,
rfid-door-screen 46, conversation-end-paths 8.

## Proof

Merged main 61c033b13 into the branch (f53272502), then on the merged tip, game 3513, :3465:

- Audit (`--all --strict --skip person-chat,network-view`, four sizes): window-offscreen 0,
  frame-offscreen 1, clipped 0, x-on-frame 0, overflow 3. Same as the baseline 0/1/0/0/3.
  Log: scratchpad ui-mg2/audit-tip.log.
- shell-x-check: 168 checked, **4 failed** (baseline 168/0). All four are the `container` scene
  at every size: "X not inside its frame", frame inner height 0. This is a regression from A45:
  the cap rule's `height: auto` lets the container's game area collapse to 0px when the check
  opens it. Log: scratchpad ui-mg2/shellx-tip.log. NOT FIXED (see Handover).
- Shooter audit, before against after: nothing new apart from the above. The Bluetooth
  scanner's old clipped breach (all sizes) is gone.
- Tests after the merge (plain `node file`), all pass: minigames2-ui 5, minigame-shell-fit 30,
  minigame-close-shell 19, minigame-pixel-art 48, minigame-controls-layout 11,
  notes-continue-brief 4, notepad-start-page 5, npc-needs-debug 12, canvas-fonts 5,
  minigame-title-escape 24, pc-monitor-frame 53, engine-fixes-pass4b 10, social-intel 10,
  test-state-text 4, examine-minigame 20, rfid-door-screen 46, conversation-end-paths 8,
  pc-taskbar 30, pc-observations 6.

Shots: scratchpad ui-mg2/before (base 30ed762d3) and ui-mg2/after (branch, before the merge),
side-by-sides in ui-mg2/cmp. Images for the review page are in ui-mg2/for-user/
(A35-before-world, A35-after-world, A35-before-pc, A35-after-pc, A38-before, A38-after at five
sizes; S7-notes-before, -tape, -torn, -pinned at 1400x1000, 390x844, 915x412).

## Handover (context limit reached)

Done and committed: A05, A22, A45 (with the regression below), A38, S7-weight (no change), A35
(for review), S7-notes (default tape; torn and pinned classes for review), S01, tests, merge of
main.

Open:

1. A45 regression in the container scene: css/minigames-framework.css line 257, `height: auto`
   in the A45 cap rule (the block after the comment "Tool windows wrap their content, at most
   960x720"). In shell-x-check the container's game area collapses to 0px tall. Likely fix:
   leave the container out of `height: auto`, or check css/container-minigame.css for children
   placed absolutely that give no height. Then re-run shell-x-check on a test_seating game
   (expect 168 checked, 0 failed) and the audit (expect 0/1/0/0/3).
2. The after shots were taken before the merge; main changed the PC file reader and
   container-minigame.css. Re-shoot text-file-pc and container with the shooter in scratchpad
   ui-mg2 (shoot.mjs, specs.mjs; game ids 3513 test_seating, 3514 test_needs_sims, 3525
   test_simple_vm_flag).
3. For the user: A35 (notepad look; to revert, remove the notepad-window.css link in
   app/views/break_escape/games/show.html.erb), S7-notes (pick tape, torn or pinned), A38
   (confirm the stepped vignette). Small things seen: the pinned slip's hard shade touches the
   observation pencil button; at 915x412 the right tape strip runs onto the notepad's edge.
4. Not in scope, left alone: the title art's soft contrast gradients in css/title-screen.css.

Servers: :3465 (this worktree, test/dummy/tmp/pids/server-3465.pid) and :3466 (the base
worktree in scratchpad ui-mg2/base, detached at 30ed762d3) were stopped at handover. The base
worktree is still registered with git; remove it once the before shots are no longer needed.

## Fix round (A45 regression closed)

Cause: in shell-x-check the container scene is opened without its content being drawn (the
game area was empty), and the A45 cap rule's `height: auto` let that empty frame collapse to its
padding (36px), so the X sat outside it. With content drawn (probed live) the window wraps it
(480x460 at 800x600) and centres. Fix: the cap rule gains `min-height: min(160px, 100%)`
(css/minigames-framework.css), a floor that holds the X and a line of content; the cap, wrap and
centring are unchanged for flag station, VM launcher, container, combination, cryptex and text
file. test/js/minigames2-ui.test.mjs (A45 test) now asserts the floor.

Merged main 372600713 (format hardening 8b and 8c) into the branch (f9ffc9a8e). On the merged
tip, game 3513, :3465: shell-x-check 168 checked, 0 failed (log scratchpad ui-mg2/shellx-fixed.log).
Shots on the fixed tip: scratchpad ui-mg2/for-user/A35-after-pc__ and container-after__ at
1400x1000, 800x600, 915x412, 390x844, 360x740.
Audit on the merged fixed tip (`--all --strict --skip person-chat,network-view`, four sizes):
window-offscreen 0, frame-offscreen 1, clipped 0, x-on-frame 0, overflow 3, the baseline
(log scratchpad ui-mg2/audit-fixed.log). Server :3465 stopped by PID. The 19 node test files
listed under Proof pass on the merged tip.

## Fix round 1 (review R1: 0 B, 0 M, 4 m, 4 n)

Changes (commit 5aae68eff):

- m1 S7-notes: tape strips are inset (left 6px, right 44px so the right one clears the pencil
  button) and stay on the page at every size. The pinned slip is set 4px right and 4px up (was
  12px right and 6px down) with a 3px shade; at 915x412 the shade ends 2px above the pencil.
  All three variants fixed. Measured at 915x412: strips 367-419 and 494-546 inside the page
  297-618.
- m2 A22: the Bluetooth frame fallback border, scrollbar thumbs, device hover, expanded and
  hover-preserved rows use `--scan-accent`, `--scan-accent-dim` and `--scan-accent-mid`
  (blue fallbacks). The row lift (`translateY(-2px)`, 4px lift shade) and `transition: all`
  on `.bluetooth-device` are gone.
- m3 A35: decided that build/ui-pc2 owns the PC reader's title-bar X. This branch adds no
  PC-reader X or button styling (checked: no `window-close` rule in this branch's diff against
  main); it keeps the reader's page colours (css/notepad-window.css) and the world viewer.
  Nothing to remove.
- m4 S01: `stackOverlayBoxes(boxes, gap, stable)`; the overlay now passes `stable = true`, so the
  panels are processed in id order and two NPCs passing each other never swap panels. New test
  in test/js/npc-needs-debug.test.mjs (13 pass).
- n2 A38: the 160x120 vignette is scaled by a whole number to cover the screen and centred
  (`--vignette-size`, set by the title screen from its box, refreshed on resize). Measured:
  1400x1000 at 9x, 667x375 at 5x, 390x844 at 8x. No stretching.
- n3: the title art's two contrast gradients are now stepped bands with hard edges (7 bands up
  the bottom, 10 along the right), and the text shadow is a flat 2px offset (`2px 2px 0 #000`).
  Before and after shots: scratchpad ui-mg2/for-user/N3-title-art-{before,after}__*.png.
- n4: comment in css/scanner-panel.css corrected (square corners, no clip-path).

Live checks (reviewer's live.mjs, one part at a time, games 3697, 3698, 3699, :3465):

| Part | Result |
|---|---|
| a05 | pass: Continue on the start brief and on the reload reopen (after Resume), none from the Notepad tray |
| a22 | pass: all three scanners, Bluetooth opened from its tray slot, accent per panel |
| a45 | pass: all windows clean at 1400x1000, 915x412, 390x844 |
| vm | pass: flag station and VM launcher clean |
| a38 | pass: soft list empty, whole-number scales |
| a35 | pass for the viewers; the PC reader's "clipped" note at 1400x1000 is still reported by the audit though the shot shows nothing cut (n1, not changed) |
| s7 | pass: strips and slip inside the page; pencil gap 2px at 915x412 |
| s01 | pass: five panels, no overlaps |

The script needed two changes of its own (title screen click-through at game start; Resume
click on reload). Live.mjs is in the scratchpad, not the repo.

Gates after fix round 1 (tip below, game 3697, :3465): strict audit (`--all --strict --skip
person-chat,network-view`, four sizes) window-offscreen 0, frame-offscreen 1, clipped 0,
x-on-frame 0, overflow 3 (same as baseline, alarm-panel 915x412 and network-architecture
390x844; the siem-dashboard cancel-beside-x, shredded-document and examine font-size lines are
unchanged from before the round). shell-x-check 168 checked, 0 failed. The 19 named node tests
pass one at a time (npc-needs-debug now 13).

## Final pass (review R2: 0 B, 0 M, 4 m, 7 n)

Merged train/47 (it contains main 5edb17541 and the earlier trains) into the branch, then fixed
every R2 item. Live runs on a keyless server on :3465, one browser at a time, a fresh game made
right before each run.

- m1: Bluetooth and biometrics search fields now stop keydown and keyup from reaching the game
  (as the BLE panel does). Typing "Head" and "Alice" gives the full word at 1400x1000 and 390x844.
- m2: `.flag-input` has `min-width: 0` and the row may wrap. Flag station at 390x844 and 360x740:
  no scrolling box inside, page scrollWidth equals the viewport, the button is inside the window.
- m3: `stackOverlayBoxes` takes the camera's top edge; a panel that would climb above it is placed
  below the panels it overlaps. Unit test added (npc-needs-debug now 14). S01 swap probe over 160
  samples: 1400x1000 swaps 0, jumps over 20 px 2, panels above the view none; 390x844 swaps 0,
  jumps 5, above the view none.
- m4: the stepped bands over the title art are gone. `tools/make_title_vignette.py --art` makes
  `assets/ui/title-vignette-art.png`: the oval vignette plus a darker zone to the right and along
  the bottom, as the same 160x120 whole-number blocks with curved steps. Only screens with art
  use it (`.has-art::after`), so screens without art keep the plain vignette. Flat 2px text
  shadow kept. Shots from ca01_invoice_fraud at 1400x1000 and 390x844.
- Nits: Bluetooth row `transition: none` and the list thumb hover uses the panel accent; search
  focus border uses `--scan-accent`; biometrics panel has a 40 px right gutter so the X never sits
  over the search field (search right edge 412, X left edge 418 at 915x412 scrolled to the end);
  notepad top is 8 px at 667x375 (was -11) and 6 px at 915x412; tape strips both inset 44 px;
  the pinned slip's pin sits in the slip's top-right corner, clear of the title and its underline;
  `ui-rules-audit.mjs` scales clientWidth and clientHeight by the zoom ratio.
- Gates: strict audit window-offscreen 0, frame-offscreen 1, clipped 0, x-on-frame 0, overflow 3
  (known baseline); shell-x-check 168 checked, 0 failed. The 19 named node tests pass one at a
  time (358 tests).

## User picks (2026-11-15)

- S7-notes: torn. The short note is now the torn slip with one tape strip at the top centre, as
  the only look. Removed: the tape variant (two corner strips and their `::after`), the pinned
  variant (offset yellow slip, shade and pin), the `.note-style-*` selectors and the comment
  naming three looks. Nothing in JS or assets used the classes. `.notes-minigame-celotape`
  stays (hidden, still built by the JS and covered by an existing test). New test in
  `test/js/minigame-shell-fit.test.mjs` pins the single look.
- A35 (text viewer, notepad look): approved as built, no change.
- A38 (title-screen vignette): not decided; untouched.
