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
