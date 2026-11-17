# UI consoles 2 review, round 1 (build/ui-consoles2 at 50cd4c46f)

Scope: X8 (one shared console window) and NAD1 (network diagram at a whole-number scale, panning).
Paths are under public/break_escape/ unless they start with docs/, test/ or scenarios/.

Counts: 0 blockers, 3 majors, 5 minors, 5 nits.

## How it was checked

- All 26 contact sheets in scratchpad ui-consoles2/sheets looked at (before row over after row).
- Live, keyless server :3481 from this worktree, games 3104, 3105, 3106, 3109, 3084 (as the build).
  A probe opened 20 scenes at 1400x1000, 800x600, 915x412, 667x375, 390x844 and 360x740, measured
  the window, title bar, X, scrollers and repeated titles, pressed Esc, reopened and clicked the X.
  Opening was a real canvas click (`__test.interact`) where the object was in a loaded room: EHR,
  infusion pump, ESD (1400), network architecture (915 and smaller), claims, warranty, FDP, concern
  form. The others opened through `handleObjectInteraction` on the scenario object (object in
  another room, or the bridge reported blocking UI at phone sizes); everything inside was real
  clicks and keys. Scripts and shots: scratchpad ui-consoles2-r1/ (probe.mjs, nad.mjs, shots/).
- Strict audit (`--strict --skip person-chat,network-view`, four sizes, game 3346):
  window-offscreen 0, frame-offscreen 1 (alarm panel 915, by design), clipped 0, x-on-frame 0,
  overflow 0. Same as the build log. Only other console line: SIEM DISMISS cancel-beside-x (known).
- Node tests, one file at a time: minigame-shell-fit 30/0, minigame-close-shell 19/0,
  minigame-pixel-art 48/0, minigame-consoles-fit 21/0, plus 133 files that name a changed scene or
  the framework: 1925 pass, 0 fail.
- Shell X check: partial, see the end.

Confirmed across every probed scene and size: the window is 1280 wide and at most 880 tall,
centred to the pixel above 600x500; at 915x412 and smaller it is the window less 8px each side;
the title is Press Start 2P 16px/24px in the accent colour, the subtitle GNF 16px; the X sits in
the bar and never overlaps the title block; Esc closes and the X closes, every scene, every size;
no page overflow. Infusion pump and ESD keep their own frames (no console window), Esc and X work.

## Majors

**M1. Network architecture: the diagram pane is unusable on short landscape windows (known open, confirmed).**
Pane height measured live: 630px at 1400x1000, 334 at 800x600, 154 at 915x412, 97 at 667x375
(no whole node visible, only the zone label strip; shot nad__667x375.png). The detail pane keeps
`min-height: 110px` (css/network-architecture-minigame.css:233) and the legend wraps to two lines
(54px) at 667. The 2x diagram is 1800x1144, so the player pans a 603x97 slot over it.
Fix as the handover says: under `max-height: 500px` put the detail pane beside the diagram, or drop
its min-height and cap it near 25%. Pan, wheel, both scrollbar thumbs, node click (selects) and drag
(does not select) all worked at 1400x1000.

**M2. The shared title bar and frame take too much height on short windows, and some scenes' working panes collapse.**
The bar is Press Start 16px with a 24px line that wraps (2 lines at 800 and 667 wide for most
scenario titles, 3 to 4 at 360/390), plus a GNF subtitle line, 18px frame each side and 8px gutter
(css/minigames-framework.css:465-500; the phone rule at :556-566 only trims padding). Measured
working panes:
- network segmentation map, 800x600: map pane 156px tall (`nsm-body` 734x156), down from about
  320px before (base shot); no zone contents visible without scrolling. A regression at a desktop
  size. ACTIVE INCIDENT now takes its own row (js/minigames/network-segmentation-map/network-segmentation-map-minigame.js:66-67),
  where before it shared the title row. 169px at 360x740.
- warranty checklist: `wcc-doc-body` 75px at 667x375, 124px at 915x412.
- forensic data platform: `fdp-panel` 96px at 360x740, 200 at 390x844 (a scroller inside a scroller).
- drug library: `dli-panel` 113px at 667x375 (two drug rows); SIEM queue list 50px at 667x375.
Suggested direction (orchestrator's call, the pick fixes the font): on `max-height: 500px` keep the
title to one line (no wrap, ellipsis, full title in the accessible name) and put the subtitle on
the same line or drop it; let fill scenes scroll the body as one column on short windows, as FDP
already does at 915x412; NSM could put the badge back beside its legend.

**M3. Titles repeated under the shared title bar (one look per concept).**
- concern form: the bar says "Raise a concern" and the intro heading says it again, every size
  (js/minigames/concern-form/concern-form-minigame.js:127, default text in concern-form-model.js:36-37).
  The heading is also the autofocus target, so dropping it needs focus moved to the step text or
  the bar title.
- warranty checklist in sis03: the bar shows "Warranty Compliance Checklist - MC-2023-ALBE-007"
  (the scenario's own title, scenarios/sis03_cyber_insurance/scenario.json.erb:1024), then the
  letterhead repeats the reference (js/minigames/warranty-checklist/warranty-checklist-minigame.js:238)
  and the document title repeats the name (:241). The default title fix in c6ef3d909 does not reach
  sis03 because the scenario sets its own title. Either drop the reference from the scenario title
  or strip the letterhead's document-title line when the bar carries it.
Other scenes: no repeated title found by the probe (text match of the bar title against every leaf
element in the body) in the 17 other console scenes.

## Minors

**m1. NCSC brief: the envelope label repeats the bar title** ("NCSC Attribution Brief",
js/minigames/ncsc-brief/ncsc-brief-minigame.js:96 and :111). It is a label on a drawn envelope, so
weaker than M3; also hard-coded while the bar uses `sd.title`.

**m2. Backup recovery: the consequence panel is a 24px-high scroller inside the scrolling shell**
at 800x600 and every smaller size (`backup-recovery-panel` 692x24 with 328px of content, probe).
Not looked at in a shot (backup.mjs was written but not run); check whether the panel needs
`flex: none` under the shared body rule (css/minigames-framework.css, `.console-body > *` flex 1 1 auto).

**m3. SIEM: the clock is now a row of its own** (css/siem-dashboard-minigame.css:55-69,
js/minigames/siem/siem-dashboard-minigame.js:394-395), about 56px at every size, while the title
moved to the bar. On short windows that height is what the alert list lacks (M2).

**m4. Network architecture: a clicked node shows the browser's rounded focus ring** (white, smooth
corners; shot nad-selected__1400x1000.png). The `<g tabindex="0">` nodes have no focus style
(css/network-architecture-minigame.css:199-202 styles only the selected stroke). Older than this
branch but larger now at 2x. A 2px square outline or `:focus-visible` rule would meet the pixel rule.

**m5. Network view has no live proof** (handover item 4: only a stubbed GET /network). Not checked
in this round either; the audit skips it.

## Nits

- n1. Wrap-style windows (capture log, NCSC, concern form) become full height on phones and at
  915x412, so a one-line capture log sits in a mostly empty window. That is what X8 says for
  phones; mention only.
- n2. The console window has no `role="dialog"`, `aria-modal` or `aria-labelledby` pointing at the
  bar title (js/minigames/framework/base-minigame.js:62-70).
- n3. SIS config title is hard-coded (js/minigames/sis-config-threshold/sis-config-threshold-minigame.js:50-52)
  and ignores `params.title`, unlike the other scenes.
- n4. NAD always 2x: at 1400x1000 the player sees about two thirds of the width and half the
  height, with no overview. Accepted (see judgements).
- n5. Probe tooling: `__test.interact` reports `blocking-ui` at 390 and 360 wide in SIS games, so
  phone opens fell back to `handleObjectInteraction`. Not an engine finding as far as checked.

## Judgements asked for

- Infusion pump and ESD left out as hardware: agree. Both are drawn devices (pump with keypad and
  MAR sheet, wall panel with guarded button); a computer title bar over them would contradict the
  diegetic device frame rule. They keep their X inside their own frame and close with Esc and X.
  Side effect: they do not get the 85% dim, so the game shows brighter behind them than behind
  consoles (ESD at 1400x1000). Fine to leave.
- Dim at 85%: agree. The game stays readable as context behind the window without competing with it.
- Always 2x for NAD1: agree with the reasoning. At 1x the labels would be 8px VT323 and the node
  boxes cannot hold 16px text; 2x keeps every label on whole pixels. The cost is M1 on short
  windows and n4 on desktop; a later redraw of the scenario diagram with bigger boxes would allow 1x.

## Not checked this round

- Esc closing pop-ups before the scene (SIS detail/compare/confirm, segmentation map confirm, log
  filter picker, SCADA report, drug library, concern keep-going check): the builder's drive scripts
  were copied (scratchpad ui-consoles2-r1/drive/) but not rerun. The code path is unchanged in the
  base class (`handleEscapeKey` first, base-minigame.js:266-268).
- Each scene's main action, beyond the network architecture (pan, select, Esc) and open/close on
  all 20 scenes: not rerun.
- Coverage decision form: its body is empty in both base and tip shots (title-only start, no
  scenario object); not looked into.
- Network view (m5).

## Shell X check

Stopped part way at the reviewer's context limit (port 3481, game 3346): 87 scene-sizes checked,
0 failed, before reaching the EHR terminal's later sizes. The build log's full run was 172/0. A full
rerun is not checked here.
