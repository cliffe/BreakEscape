# UI consoles review, round 1 (build/ui-consoles)

Reviewed tip 1d7869e84 against base fc4b4d8a5 (main). Paths are under public/break_escape/ unless
they start with test/, tools/ or docs/. Evidence paths are under the session scratchpad folder
`ui-consoles-r1/` (shots, logs and the scripts that made them).

Servers: tip worktree on :3485, baseline worktree on :3486, both keyless. Games: 3346 (audit, shell
X check), the builder's 3084/3104/3105/3106/3109 (shots, functional checks), 3368 (pump key probe),
3403 (test-blockchain-explorer). Headless shell with scrollbars shown (15px).

## Verdict

Not ready to merge as it stands: no blocker, but three majors, two of them regressions against main.
The builder's numbers hold (audit and shell X check below), the close-control work does what the
build log says, and the infusion pump's stacked layout and rotation work through real taps. The
majors are each a small CSS or JS change.

| | B | M | m |
|---|---|---|---|
| Count | 0 | 3 | 6 |

## Claims checked

| Claim | Result |
|---|---|
| Audit `--strict`, 1400x1000, 800x600, 915x412, 390x844, game 3346: window-offscreen 0, frame-offscreen 1, clipped 0, x-on-frame 0, overflow 3 | Confirmed: `SUMMARY window-offscreen 0, frame-offscreen 1 (1), clipped 0, x-on-frame 0, overflow 3 (1)`; the two lines are alarm panel 915 (by design) and network architecture 390 (NAD1). audit-tip.log |
| Shell X check 168 checked, 1 failed (segmentation map 915x412) | Confirmed, same single failure. shellx-tip.log |
| One close control per scene; confirms keep two named buttons with the scene X hidden; EHR keeps [UNDERSTOOD] | Confirmed for claims, warranty, coverage, blockchain, EHR, capture log, backup, DLI, SIS (detail, compare, confirm) and ESD confirm, at 1400x1000 and 390x844, with X and Esc closing each scene. Not true for the log filter's own pop-ups (M3). func-rest.log |
| Pump: stacked column under 784px, rotation keeps the typed rate, pop-ups centre on the visible canvas | Confirmed. 390x844 stacked 368x888; typed 2.5, turned to 844x390 (side by side, 2.5 kept), back to 390 (stacked, kept); Confirm opened the below-minimum pop-up centred in view. No restart loop while holding any width from 760 to 860. Real wheel scroll then tap hits every key at 390x844 and 915x412. func-pump.log, pumpwheel-tip.log, func/pump-*.png |
| Command board log input works on phones | Confirmed at 1400x1000, 390x844 and 915x412: typed entry logged as a new tile, field inside the board, X closes. func-cb.log |
| Log filter draws in the game area with the shell X | Confirmed: header hidden, `.lf-wrapper` inside the game area, X and Esc close. func-rest.log |

Probe note: setting `scrollTop` in script and clicking the canvas in the same tick sometimes pressed
the key one or two rows away (pumpkeys-tip.log, and the same on the baseline, pumpkeys-base.log).
A real wheel scroll before the tap never did (pumpwheel-tip.log), so this is a probe artefact and
not a finding.

## Tests

Plain `node file`, tip worktree: minigame-consoles-fit 10/10, minigame-shell-fit 30/30,
minigame-close-shell 19/19. Every test file that names a changed module or scene (the builder's 32
plus shell-fit): 502 pass, 0 fail across 33 files. No new static import in an engine module, so the
JS test harness copy lists need no change.

## Findings

### M1 Segmentation map consequence panel runs off the right edge from 901 to about 1100px (regression)

`css/network-segmentation-map-minigame.css:70` gives `.nsm-topology-area` `min-width: 760px`, and
`.nsm-consequence-panel` (:151) keeps `min-width: 220px; flex-shrink: 0` beside it. The panel only
stacks under 900px (:488). Between 901px and about 1100px the two no longer fit, so `.nsm-body`
scrolls sideways and the panel's right part, with its own scrollbar, sits past the window edge.

Failure: at 1024x768 (a common laptop and tablet size) the panel ends at x=1069, so 45px of the
consequence text is cut ("bridge enterprise an", "prescribing reverts to pape") and its vertical
scrollbar is off screen; at 915x412 117px are cut and the map shows only its top 200px. Baseline at
the same sizes: panel inside the window (right edge 915 and 1024). This is the text the player reads
before SEVER. The shell X failure at 915x412 (known open) is a symptom of the same layout.

Evidence: tip/network-segmentation-map__1024x768.png, tip/network-segmentation-map__915x412.png,
cmp-mid/network-segmentation-map__915x412_800x600.png; measured `.nsm-body` scrollWidth 1069 vs
clientWidth 1024 at 1024x768 (tip), 1024 vs 1024 (base). A scan of every scene for boxes that
scroll sideways (hscan-tip.log against hscan-base.log, 1024x768, 915x412, 667x375, 390x844) finds
`.nsm-body` as the only new one; at 667 and 390 that is the intended sideways map, at 915 and 1024 it
is this bug. Everything else either matches the baseline or no longer scrolls sideways (forensic
tabs, claims content, pump).

Fix: let the map scroll instead of the body. Give `.nsm-topology-area` `flex: 1 1 auto; min-width: 0;
overflow-x: auto` (pixel-scroll) and move the 760px minimum onto `.nsm-zones`, so the panel always
keeps its own width inside the window; or raise the stacking breakpoint to `max-width: 1100px`.
Then re-run the shell X check for the 915x412 item and add the 1024x768 size to the fit test.

### M2 Scene buttons declared as Press Start 2P render in GNF, and the new phone sizes shrink them to 8px GNF (regression)

`css/minigames-framework.css:111` sets `font-family: 'GNF'` on `.minigame-container button`
(specificity 0,1,1), which beats a scene's single-class `font-family: 'Press Start 2P'`. The builder
set Press Start sizes (8/16px) on buttons that actually render in GNF, where 8px is half its size:

- `css/backup-recovery-minigame.css` (the 860px media rule, `.backup-recovery-confirm-btn`): 14px on
  the baseline, now 8px GNF at 860px and narrower. This is the scene's main action, CONFIRM RESTORE
  FROM THIS SOURCE, and it reads as grey 5px caps (crops-390.png, bottom).
- `css/siem-dashboard-minigame.css:597` media rule, `.siem-btn` `font-size: 8px`: DISMISS and
  ESCALATE at 8px GNF under 600px (new rule in this branch).
- `css/infusion-pump-minigame.css` `.ip-more-below`: 8px GNF; the cue now shows at 390x844 because of
  the stacked layout.

Evidence: fontscan-tip.log against fontscan-base.log (the three lines above are the only new small
font lines on the tip); computed style of `#backup-recovery-confirm` 8px GNF (tip) vs 14px GNF (base)
at 390x844.

Fix: give these buttons a selector that wins (for example `.minigame-container .backup-recovery-confirm-btn`)
so Press Start 2P applies at 8px, or keep GNF and use 16px. Extend minigame-consoles-fit to check
the computed family of buttons that declare Press Start 2P, since the sheet text alone does not show
the override.

### M3 Log filter pop-ups keep their own [x] and the scene X; the flag confirm shows three close-type controls

`js/minigames/log-filter/log-filter-minigame.js:980` (`_overlayHeader`) puts a `[✕]` text button
in every overlay header, and nothing hides the scene X while an overlay is open. With the threat
intel pop-up open there are two close controls (scene X and `[✕]`); with the flag confirm
(`flag_confirm`) there are the scene X, `[✕]`, `[CANCEL]` and `[CONFIRM: FLAG ACTIVE SESSION]`. The
branch's own rule, applied to SIS and ESD, is one close control at a time and confirms with two
named buttons and no X. The log filter is one of the scenes this branch moved into the shared shell.

Evidence: probe-lf-flag_confirm-1400x1000.png, probe-lf-threat_intel-390x844.png; probe output lists
`minigame-close`, `lf-overlay-close`, `lf-flag-cancel-btn`.

Fix: as in SIS: info overlays use the shared `.minigame-close-button` inside the panel and hide the
scene X while open; the flag confirm drops its `[✕]` and keeps [CANCEL] and [CONFIRM]. Add the log
filter to the "pop-ups that are not confirms use the shared X" test.

### m1 SIS pop-up title runs under its X on 360px phones

`css/sis-config-threshold-minigame.css:197` pads the pop-up `h4` by 40px, but parameter names are
one unbreakable token (THERMAL_RUNAWAY_THRESHOLD). At 390x844 the text ends 2px short of the X; at
360x780 it ends at x=332 with the X starting at 304 (28px under the X), at 320x640 82px.

Evidence: probe-sisdetail-360x780.png, probe-sisdetail-320x640.png; crop-sis-detail-x.png (390).

Fix: `.sis-modal h4 { overflow-wrap: anywhere; }`.

### m2 Esc on a confirm closes the whole scene

With the ESD confirm, the SIS confirm or the log filter flag confirm open, Esc runs the framework's
`closeByPlayer` (`js/minigames/framework/base-minigame.js:214`) and closes the scene, although the
confirm itself has no X (by design now). Same on the baseline, but this branch is where confirms
lost the X, so Esc is now the only close path that skips the named buttons.

Evidence: func-rest.log ("esc with confirm open -> null" for ESD at 800 and 390).

Fix: while a confirm is open, Esc acts as its CANCEL (each scene can stop the event in its own
keydown handler when its confirm is open), and pop-ups with an X close the pop-up first.

### m3 X sits across a band edge in warranty and SIS at 390x844

Warranty: the X straddles the dark letterhead bar and the white page below it, beside the claim ref.
SIS: the X overlaps the top-right corner of the blue table header box. Both are inside the frame and
cover no text; they look misplaced.

Evidence: crops-390.png (top), tip/warranty-checklist__390x844.png, tip/sis-config-threshold__390x844.png.

Fix: warranty letterhead bar tall enough for the X (min-height about 46px, as for NAD); SIS header
box top margin or right padding so the X sits beside it.

### m4 Blockchain graph pane keeps the default scrollbar

`.bce-graph-pane` scrolls both ways with the browser's white scrollbar at 1400x1000 and 390x844
(it has no `pixel-scroll`), while the branch added `pixel-scroll` to the other console panes. Same
on the baseline; the builder's shots used a title-only start with no graph, so it was not seen.

Evidence: bce-pair.png (game 3403, test-blockchain-explorer).

Fix: add `pixel-scroll` to the graph pane in `js/minigames/blockchain-explorer/blockchain-explorer-minigame.js`.

### m5 Small GNF text left over

The build log says GNF/VT323 at 13 to 15px went to 16px. Left: segmentation map device labels
`.nsm-device` 15px GNF (`css/network-segmentation-map-minigame.css:127`, and the 384px map height was
sized for 16px), SIEM `.siem-source-count` 10px GNF (`css/siem-dashboard-minigame.css:521`). Both as
on the baseline. Claims nav: "Correspondence" still overflows its button by about 20px from 1024px
down (35px on the baseline).

Evidence: fontscan-tip.log; cmp-mid/claims-management-system__915x412_800x600.png.

Fix: 16px for both GNF labels (check the map height at 915x412 again); let the claims nav labels wrap
(`overflow-wrap: anywhere`) or widen the nav column.

### m6 SCADA historian chart cut at 667x375

At 667x375 (phone landscape, outside the audit's sizes) the chart SVG is cut by `.sh-charts` with no
scroll: the time axis and lowest gridline are hidden. Same on the baseline (clipped there too), so
not a regression, but the branch's SH1 work did not cover this size.

Evidence: cmp-small/scada-historian__390x844_667x375.png; tip.json `scada-historian` 667x375 breach
`div#sh-chart-area > svg ... cut (y) by div.sh-charts`.

Fix: a minimum chart height (about 160px) with the right panel scrolling, or the 600px stacking rule
extended to short landscape windows (`max-height: 420px`).

## Side-by-side sizes looked at

Every critique B scene at 1400x1000, 1024x768, 800x600, 915x412, 667x375 and 390x844 on tip and
base (tip/, base/, contact sheets in cmp-small/, cmp-mid/, cmp-big/, g667a.png, g667b.png,
g390a.png, g390b.png). Outside the findings above, the tip is equal to or better than the baseline
everywhere; the log filter, claims, EHR, ESD, backup recovery and pump at phone sizes are much
better. Pixel rules: no radius, soft shadow, blur or smooth gradient added in the diff (the EHR
dose bar and ESD stripes are hard stops, the ESD button bands are hard insets).

Not re-reported (known open): shell X check segmentation map 915x412 (see M1), 5d, X8, NAD1, CF1.
SIEM cancel-beside-x is the SIEM3 false positive.
