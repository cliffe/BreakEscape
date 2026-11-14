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

- Audit (, four sizes): window-offscreen 0,
  frame-offscreen 1, clipped 0, x-on-frame 0, overflow 3. Same as the baseline 0/1/0/0/3.
  Log: scratchpad ui-mg2/audit-tip.log.
- shell-x-check: 168 checked, **4 failed** (baseline 168/0). All four are the  scene
  at every size: "X not inside its frame", frame inner height 0. This is a regression from A45:
  the cap rule's  lets the container's game area collapse to 0px when the check
  opens it. Log: scratchpad ui-mg2/shellx-tip.log. NOT FIXED (see Handover).
- Shot scripts' audit, before vs after: no new breaches apart from the above. The Bluetooth
  scanner's old clipped breach (all sizes) is gone.
- Tests after the merge (plain ), all pass: minigames2-ui 5, minigame-shell-fit 30,
  minigame-close-shell 19, minigame-pixel-art 48, minigame-controls-layout 11,
  notes-continue-brief 4, notepad-start-page 5, npc-needs-debug 12, canvas-fonts 5,
  minigame-title-escape 24, pc-monitor-frame 53, engine-fixes-pass4b 10, social-intel 10,
  test-state-text 4, examine-minigame 20, rfid-door-screen 46, conversation-end-paths 8,
  pc-taskbar 30, pc-observations 6.

Shots: scratchpad ui-mg2/before (base 30ed762d3) and ui-mg2/after (branch, before the
merge), side-by-sides in ui-mg2/cmp. Images for the review page: ui-mg2/for-user/
(A35-before|after-world|pc__WxH, A38-before|after__WxH, S7-notes-before|tape|torn|pinned__WxH).

## Handover (context limit reached)

Done and committed: A05, A22, A45 (with the regression below), A38, S7-weight (no change), A35
(for review), S7-notes (default tape, torn and pinned classes for review), S01, tests, merge of
main.

Open:
1. A45 regression, container: css/minigames-framework.css, the A45 cap rule (the block after
   "Tool windows wrap their content, at most 960x720"), . The container's game
   area collapses to 0px tall in shell-x-check. Likely fix: drop the container from the cap
   rule's , or give it  from its content (check
   css/container-minigame.css for absolutely placed children). Then re-run
    and expect
   168/0, and re-run the audit (expect 0/1/0/0/3).
2. After shots of the merged tip were not re-taken (the after set predates the merge; main
   changed the PC file reader and container-minigame.css). Re-shoot text-file-pc and container
   with 
   in scratchpad ui-mg2 (specs use game ids 3513, 3514, 3525).
3. For the user: A35 (notepad look, revert = remove the notepad-window.css link in
   app/views/break_escape/games/show.html.erb), S7-notes (pick tape, torn or pinned), A38
   (confirm the stepped vignette). Small things seen: the pinned slip's box shade touches the
   observation pencil button; the right tape strip at 915x412 runs onto the notepad's edge.
4. Not done: the title screen's other soft gradients (the title art contrast,
   css/title-screen.css  area) are outside A38 and still smooth.

Servers: :3465 (this worktree, pid file test/dummy/tmp/pids/server-3465.pid) and :3466 (base
worktree at scratchpad ui-mg2/base, a detached worktree of 30ed762d3) were stopped at handover.
The base worktree is still registered (/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape                                                                               61c033b13 [main]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape-merge                                                                         1cece9079 [merge/m03-improvement-loop]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/agent-ab846af84a003a2d3                                     c3c0a9ace [worktree-agent-ab846af84a003a2d3]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/agent-ae40074c527a6f395                                     92686e4a4 [worktree-agent-ae40074c527a6f395]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/orch-merge                                                  8d3c5f755 [orch-merge]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-b                                                     62bee4c1f [build/9-2-b]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-c                                                     fea96124c [build/9-2-c]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-c2                                                    98f009770 [build/9-2-c2]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-c3-plan                                               1ca5301ca [build/9-2-c3-plan]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h                                                     fa0f92445 [build/9-2-h]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-l                                                     ea19141bb [build/9-2-l]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-u-a                                                   3f88e9c97 [build/9-2-u-a]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-3b-i                                                    7476c082e [build/9-3b-i]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-3b-k                                                    f9a661a14 [build/9-3b-k]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-3b-o                                                    857ce87a7 [build/9-3b-o]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-3b-p                                                    32b767faf [build/9-3b-p]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-3b-plan                                                 81d2bad0d [build/9-3b-plan]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-3b-w                                                    708b154e8 [build/9-3b-w]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-addobject-keys                                            24dccd516 [build/addobject-keys]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-bark-delay                                                bc63e32cf [build/bark-delay]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-c3-build                                                  6d222c6fa [build/c3-replies]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-c3-review                                                 6993fd3b0 (detached HEAD)
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-capture-npcid                                             68a29cd6c [build/capture-npcid]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-conclude-race                                             dbe77cc85 [build/conclude-race]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-del-scen                                                  d632dd6de [build/del-scen]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-dup-toast                                                 d8b6721fb [build/dup-toast]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-escaping                                                  2f67525ae [build/escaping]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-exchange-heard                                            3d507401f [build/exchange-heard]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-feed-lockout                                              948705099 [build/feed-lockout]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ff-phone                                                  a78fe1847 [build/ff-phone]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-gated-doors-plan                                          ca222f618 [build/gated-doors-plan]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-gnf-font                                                  01c96714d [build/gnf-canvas-font]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-graph-net                                                 326dfa0ed [build/graph-net]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-h-fixes                                                   de7553dc5 [build/h-fixes]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-habits-validator-gaps                                     d88a66b5c [build/habits-validator-gaps]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-hard-8b                                                   e6491615d [build/hard-8b]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-hard-8b-base                                              2f5471209 (detached HEAD)
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-hard-8c                                                   2ca7980bd [build/hard-8c]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-hard-fixes                                                ea187caf4 [build/hard-fixes]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-hard-fixes2                                               ac526d218 [build/hard-fixes2]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-hard-phish                                                2c135867f [build/hard-phish-plan]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-hard-rfid                                                 d98369da2 [build/hard-rfid]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-hard-tailgate-f                                           9b6b095c8 [build/hard-tailgate-f]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-hard-tailgate-plan                                        08a3073e8 [build/hard-tailgate-plan]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-hard-tg-base                                              fc4b4d8a5 (detached HEAD)
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-harden-1                                                  a2395e169 [build/harden-step1]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-harden-2                                                  e13392d17 [build/harden-step2]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-harden-2b                                                 27cbb1ed4 [build/harden-2b]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-harden-7                                                  7d5605ead [build/harden-7]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-harden-8a                                                 7d5aae891 [build/harden-8a]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-harden-8a-base                                            8b6cf6a0d (detached HEAD)
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-harden-amend                                              35993ec89 [build/harden-amend]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-icons-wiring                                              22255f183 [build/icons-wiring]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-k0                                                        c240ee5e8 [build/keyring-k0]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-keypin                                                    a524171df [build/keypin-seed]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-keyring-plan                                              479099725 [plan/keyring]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-kieran                                                    334fa74a8 [build/kieran-art]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-lab-networks-habits                                       6cf4cb00c [build/lab-networks-habits]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-lab-portsec                                               8b9f3f671 [build/lab-portsec]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-lab-r5                                                    004bdfdfe [build/lab-r5]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-lab-ux-npc                                                a655acd5c [build/lab-ux-npc]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-lab-ux-ui                                                 b8e8f2708 [build/lab-ux-ui]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-lab-wedge                                                 dc53034a0 [build/lab-wedge]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-locked-screens                                            5efde616b [build/locked-screens]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-m02-voice-tidy                                            ecc009d10 [build/m02-voice-tidy]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-minigame-title                                            1c54bce6d [build/minigame-title]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-net-fixes                                                 8d0a77884 [build/net-fixes]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ol-plan                                                   1aaf57349 [plan/office-life-missions]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ol-sims                                                   df75423f0 [build/ol-sims]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-owner-claim                                               13a0f9f96 [build/owner-claim]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-phone-calls                                               e00177f6c [build/phone-calls]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-phone-merge                                               af329a002 [build/phone-calls-merge]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-phone-writing                                             734b6e922 [build/phone-calls-writing]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-q33-lockout                                               ab934c0c5 [build/q33-lockout]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-reaction-icons                                            20ad1565b [build/reaction-icons]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-reactions-build                                           b022a414b [build/reactions]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-reactions-plan                                            2b57ce943 [build/reactions-plan]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-reactions-review                                          e38471f0f (detached HEAD)
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-readme-93b                                                3da7627c5 [build/readme-93b]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-rel-barkfu                                                f66a486e8 [build/bark-followups]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-rel-flag                                                  f0b31855a [build/flag-final-state]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-rel-harness                                               7f1eae3ad [build/harness-click-target]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-revoked-cards                                             e813be1d9 [build/revoked-cards]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-rounds-int                                                97024634f [int/r1]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-schema-review                                             6f3de96a3 [build/schema-review]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-sd-m01-m08                                                f863fde95 [build/sd-m01-m08]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-sd-m09-m10                                                dad40c583 [build/sd-m09-m10]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-sd-shared-tests                                           92502ed3d [build/sd-shared-tests]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-shots-a                                                   13a0f9f96 (detached HEAD)
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-shots-b                                                   13a0f9f96 (detached HEAD)
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-shots-main                                                13a0f9f96 (detached HEAD)
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-skill-wording                                             1569f13a0 [build/skill-wording]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-spies                                                     33577ab22 [build/spy-starters]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-sync-audit                                                7ccba7693 [build/sync-audit]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-sync-base                                                 6a834437c (detached HEAD)
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-sync-build                                                fd6dbaa58 [build/sync-deltas]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-sync-review                                               901dd8bc8 (detached HEAD)
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-sync-tools                                                7bca2de76 [build/sync-proof-tools]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-sync-verify                                               7e15af426 [build/sync-p1-verify]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-tap-pick                                                  b5e76add1 [build/tap-pick]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-tooling-minors                                            1235caa52 [build/tooling-minors]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train10                                                   f2d53bb40 [build/train10]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train11                                                   483ec1ceb [build/train11]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train12                                                   222146fe6 [build/train12]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train13                                                   b7d500ccf [build/train13]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train14                                                   e26def51c [build/train14]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train15                                                   406fa7791 [build/train15]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train16                                                   c9a4f7a84 [build/train16]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train17b                                                  8b6cf6a0d [train/17b]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train2                                                    66996634d [build/train2]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train22b                                                  769f62c52 [train/22b]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train3                                                    a8daf345b [build/train3]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train36                                                   61c033b13 [train/36]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train36-live                                              372600713 (detached HEAD)
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train37                                                   372600713 [train/37]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train38                                                   1f3ac1f0b [train/38]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train4                                                    de866cd20 [build/train4]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train5                                                    39fb4cf33 [build/train5]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train6                                                    6a834437c [build/train6]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train7                                                    13a0f9f96 [build/train7]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train8                                                    72e26f911 [build/train8]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-train9                                                    33c003230 [build/train9]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-tts-lookalike                                             6d70ae886 [build/tts-lookalike]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-tts-r3-minors                                             1f5a0f7fb [build/tts-r3-minors]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-6                                                      100730121 [build/ui-slice6]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-6-lock                                                 20a8a83a7 [build/ui-slice6-lock]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-art                                                    b9c80ef88 [build/ui-art]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-consoles                                               8600a2a34 [build/ui-consoles]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-consoles-base                                          fc4b4d8a5 (detached HEAD)
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-consoles2                                              5428d3779 [build/ui-consoles2]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-hud                                                    be4169251 [build/ui-hud]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-mg2                                                    f53272502 [build/ui-minigames2]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-pc-polish                                              61c033b13 [build/ui-pc-polish]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-pc2                                                    02f57d55a [build/ui-pc2]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-quick                                                  f261e96a5 [build/ui-quick]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-se                                                     c60b9048f [build/ui-se]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-shell                                                  fc4b4d8a5 [build/ui-shell]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-shell-main                                             6b2344e20 (detached HEAD)
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ui-sweep                                                  2f5471209 (detached HEAD)
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-unlock-gaps                                               ef7a36534 [build/unlock-gaps]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-unlock-r1                                                 ab3870aa9 [build/unlock-gaps-r1]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-usb-habit                                                 d6a51a89a [build/usb-habit]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-usepayload                                                91849ba67 [build/usepayload-secret]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-16                                                     28f4f9ed6 [build/ux-slice16]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-2b0                                                    c0c274522 [build/ux-slice2b0]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-2c                                                     82d3e548c [build/ux-slice2c]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-3b                                                     d559df39a [build/ux-slice3b]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-4                                                      f956f5355 [build/ux-slice4]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-access                                                 483ec1ceb [build/ux-access]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-audit                                                  3bccf7130 [build/ux-audit]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-barks                                                  1ddf057ea [build/ux-barks]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-copier                                                 041e28ef3 [build/ux-copier]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-devices                                                9666fd48c [build/ux-devices]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-feedback                                               6290be45c [build/ux-feedback]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-net                                                    e1fe01f6b [build/ux-net]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-pixel                                                  0a63155e0 [build/ux-pixel]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-signin                                                 741e64969 [build/ux-signin]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ux-world                                                  59260eabb [build/ux-world]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-wearable                                                  ec3a91717 [build/wearable]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/r1-fixes                                                    6c21de2de [review-r1-fixes]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/r2-fixes                                                    48b10c597 [review-r2-fixes]
/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/sync-merge                                                  30311f0fa [merge/origin-main-2026-11-10]
/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-mg2/base  30ed762d3 (detached HEAD)); remove it with
 when the before shots are no longer needed.
