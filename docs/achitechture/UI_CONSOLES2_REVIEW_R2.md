# UI consoles 2 review, round 2 (build/ui-consoles2 at 73d6deef2)

Scope: fix round 1 and 1b (build log section 5) against review round 1.
Paths are under public/break_escape/ unless they start with docs/, test/, scripts/ or scenarios/.

Counts: 0 blockers, 0 majors, 2 minors, 4 nits. Several checks were not run (see "Not checked"):
the reviewer reached the context limit before the second browser pass.

## Merge with main

`git merge-tree --write-tree 73d6deef2 1f3ac1f0b`: clean (exit 0, tree 65a3a8a6d). Merge base
372600713; main is 5 commits ahead (launch device final state), the branch 49. No file is changed
on both sides.

## How it was checked

- Keyless server :3481 from this worktree. Fresh games from new-game.rb made right before the run:
  sis01 3821 (`--unlock it_security_office --unlock major_incident_room`), sis02 3822
  (`--unlock engineering_workshop`), sis03 3823 (`--unlock meridian_evidence_archive`), exercise
  station 3824, test_seating 3826, test_access_networks 3827 (`--start-room comms_room --unlock
  lobby --give kit_dropbox`). Two games landed on the character picker; the probe chose
  female_hacker_hood_v2.
- Probe (scratchpad ui-consoles2-r2/review/probe.mjs, log probe.log, shots shots/): each scene at
  1400x1000, 800x600, 915x412, 667x375, 390x844, 360x740. Opened by a real canvas click
  (`__test.interact`) where the object was in a loaded room (EHR, infusion pump, ESD at 1400, network
  architecture), else `handleObjectInteraction` on the scenario object; then a real Esc key, reopen,
  real click on the X. Measured: bar height, title line count and ellipsis, subtitle display and
  row, the bar's `title` attribute, X inside the bar and clear of title and subtitle, repeated
  titles (bar text against every visible leaf in the body), every inner scroller, scene panes.
- Shots looked at: segmentation map 800x600 and 360x740, SIEM 667x375, log filter 667x375,
  EHR 360x740, drug library 667x375, command board 915x412, backup 800x600, network
  architecture 667x375.
- sis03 validator (`--no-graph`): 0 errors, 11 warnings, no ❌ line. Schema: `subtitle` is in the
  claims_management_system optional list (scripts/minigame-data-schemas.json:247).
- Node tests, plain `node`, one file at a time: minigame-consoles-fit 29, minigame-shell-fit 30,
  minigame-close-shell 19, minigame-pixel-art 48, network-view 51, engine-fixes-pass4b 10,
  backup-recovery-when-available 3, escaping-shared-helpers 21, exercise-station 14,
  forensic-data-platform-tabs 5, minigame-controls-layout 11, minigame-html-sweep-b 12,
  minigame-html-sweep-c 13, minigame-title-escape 24, pc-monitor-frame 53, social-concern-form 26,
  social-engine-batch13 17, social-engine-ux1 16: 402 pass, 0 fail (18 files). The other files that
  import base-minigame were not rerun.

Probe result, 22 scenes x 6 sizes = 132 scene-sizes (21 console or device scenes plus the network
view): Esc closed and a real X click closed in 126; the 6 others are the network view (below).
Window placement correct in every console scene-size (centred, 1280 by at most 880 above 600x500;
window less 8px each side on short or narrow windows). Title one line in all 132 (no line count above
1); X inside the bar and clear of title and subtitle in all; no page overflow; no page errors.
Repeated titles: none, except the claims subtitle's case reference also shown as a value in a
section summary card (`span.cms-summary-value`), which the fixer noted as data and left.

## R1 findings

| R1 | State | Evidence |
|---|---|---|
| M1 network diagram on short windows | closed | Pane 238px at 915x412, 201px at 667x375 (R1: 154, 97), a full node row in view (shot network-architecture__667x375.png); detail folds to a 32px "Details [SHOW]" row; legend 16px, one line, no overflow at both short sizes. Matches the fixer's table. |
| M2 bar height on short windows | closed | Bar 50px at every short or narrow size, 58px (74 with subtitle) at 1400x1000 and 800x600; title one line in every probed scene-size; full text in the bar's title attribute in every console scene. Spot checks against the fixer's table: segmentation map `.nsm-body` 800x600 309 (fixer 309), drug library `.dli-panel` 667x375 153 (153), SIEM alert/queue 667x375 177/87 (177/87), backup panel 800x600 328 with no own scroller (328). Warranty and FDP scroll as one column on short and narrow windows: warranty 667x375 the scene body 273 (fixer col 273), FDP 360x740 638 (col 638); at 800x600 the warranty `.wcc-doc-body` keeps its own scroller (264). |
| M2 status rows | closed | SIEM clock sits in `.siem-status-bar`, no `.siem-header` (all six sizes); ACTIVE INCIDENT sits in `.nsm-legend`, no `.nsm-header-bar`; SEVER hint beside the button at 1400x1000, 800x600 and 915x412, stacked above it on phones (by design). |
| M3 repeated titles | closed | Concern form: no heading under the bar at any size, no duplicate found. sis03 warranty: bar "Warranty Compliance Checklist", paper keeps the reference only, no duplicate at any size. No repeated title in any other console scene (probe, all sizes). |
| m1 NCSC envelope label | closed | Label gone from both envelope states (js/minigames/ncsc-brief/ncsc-brief-minigame.js); probe found no duplicate at any size (opened sealed). |
| m2 backup nested scroller | closed | `.backup-recovery-panel` has no own scroller at any size; the scene scrolls as one (`backup-recovery-shell`). |
| m3 SIEM clock row | closed | as M2 status rows. |
| m4 node focus ring | not checked live this round | Code as described in "Not checked". |
| m5 network view live | partly | Fresh game 3827, real `interact('comms_port')` and "Plug it in" at 1400x1000: window 1280x538, bar 74px, subtitle on its own line, title attribute set, Esc closed it. The probe could not reopen it for the X click or the other five sizes: `interact` returned blocked after the first plug-in (probe tooling, the port was already used; not looked into). Phone sizes rest on the fixer's 1b proof (ui-consoles2-r2 shots 390x844 and 360x740: bar 78px, subtitle on its own row). |

Claims subtitle from data (1b): the scene reads `params.subtitle || minigameData.subtitle`
(js/minigames/claims-management-system/claims-management-system-minigame.js:158, :168); sis03 sets
it (scenarios/sis03_cyber_insurance/scenario.json.erb:837); no case reference left in the claims
scene. Live: claims at 1400x1000 shows the subtitle in the bar (probe); at 390x844 and 360x740 it is hidden and in the title attribute.

## Minors

**m1. On phones every long title ends after its organisation prefix, so the scene's own name is gone.**
With one line and an ellipsis (css/minigames-framework.css:491-493), every sis01 console at 390x844
and 360x740 reads "NORTHGATE TRUS..." (EHR, SIEM, segmentation map, backup, drug library; shots
ehr-terminal__360x740.png, network-segmentation-map__360x740.png), and the command board "NORTHGATE
GENERAL HOSP...". The part that says which console this is (the text after "//" or " - ") never
shows; on touch the title attribute cannot be read either. Not a regression of the fix's intent
(the bar was 162px), but the title now carries no information on phones. Options for the
orchestrator: on narrow windows drop the prefix before "//" or " - " (or ellipsis in the middle),
or have scenarios give consoles a short title.

**m2. On short landscape windows the folded subtitle is usually invisible.**
Under `max-height: 500px` the subtitle shares the title's line and takes only what the title leaves
(css/minigames-framework.css:580-597). With the long titles above, it gets no width: command board
915x412 and drug library 667x375 report the subtitle displayed on the row with an ellipsis, and the
shots show none of it (command-board__915x412.png, drug-library-integrity__667x375.png). Only the
network view marks its subtitle essential. Fine where the subtitle is decoration; check whether the
drug library's or the command board's subtitle tells the player anything they need.

## Nits

- n1. js/systems/minigame-starters.js:854 still falls back to the old title (the document name, a dash and
  sis03's case reference) when a scenario gives none; the scene's own default is now the short
  name (js/minigames/warranty-checklist/warranty-checklist-minigame.js:5), so such a scenario would
  bring back the repeated reference and the paper's name line. No scenario hits it today.
- n2. The warranty letterhead still hard-codes sis03's case reference
  (js/minigames/warranty-checklist/warranty-checklist-minigame.js:243), the same kind of thing 1b
  moved out of the claims scene. Older than this branch.
- n3. Command board keeps a clock row of its own under the bar (about 56px; shot
  command-board__915x412.png), the pattern R1 m3 removed from SIEM. Older than this branch.
- n4. js/minigames/framework/base-minigame.js:185-188: the comment on `consoleSubtitleEssential`
  sits on its own between two methods, above the comment for `syncConsoleTitleTip()`; reads as if it
  documents that method.

## Not checked (context limit)

- NAD detail toggle by keyboard (Enter/Space, `aria-expanded`) and the node focus outline by Tab:
  script written (scratchpad ui-consoles2-r2/review/nad.mjs), not run. Code: the toggle is a
  `<button>` with `aria-expanded`/`aria-controls` updated in `_setDetailOpen`
  (js/minigames/network-architecture/network-architecture-minigame.js:107, :134-143);
  `.nad-node:focus-visible` draws a 2px solid square outline (css/network-architecture-minigame.css:198-206).
  The fixer's live proof (fix1/nad/nad.json) covered mouse toggle and Tab plus Enter.
- Esc closing pop-ups first (log filter overlay, drug library source modal, concern form keep-going,
  SIS confirm, segmentation map confirm) and each scene's main action: scripts written
  (review/esc-popups.mjs, review/drive/*.mjs with the new game ids), not run. Base path unchanged
  since R1.
- Strict audit and full shell-x-check: not run this round. Last figures are the fixer's on game
  3689: audit 0/1/0/0/0, shell X 172/0 (build log section 5).
- Contact sheets end to end: not built; individual shots only, as listed.
- Tests: the ~105 other files that import base-minigame.
- Network view: X click, and all sizes other than 1400x1000 (see m5 row).
