# UI consoles review, round 2 (build/ui-consoles)

Reviewed tip 99fd5ff83 (the round 1 fixes, c19b0f136..99fd5ff83) against base fc4b4d8a5. Main has
not moved (still fc4b4d8a5). Paths are under public/break_escape/ unless they start with test/ or
docs/. Evidence paths are under the session scratchpad folder `ui-consoles-r2/` (shots, logs and the
scripts that made them).

Servers: tip worktree on :3486, baseline worktree on :3487, both keyless, both stopped after the
review. Games: 3346 (audit, shell X check, ordinary-scene Esc checks), 3104/3105/3106 (shots, Esc
and click checks), 3403 (test-blockchain-explorer). Headless shell with scrollbars shown (15px).

## Verdict

Every round 1 claim holds, live. No blocker and no regression from this round. One major is left,
and it is not new: the segmentation map cannot be used on a phone held sideways, on the tip or on
main. The other findings are minor. The branch can merge as it stands if the orchestrator takes M1
as a follow-up. M1 is a small CSS change in a scene this branch already owns, so it could also go
in one more fix pass.

| | B | M | m |
|---|---|---|---|
| Count | 0 | 1 | 4 |

## Claims checked

| Claim | Result |
|---|---|
| Audit `--strict`, 1400x1000, 800x600, 915x412, 390x844, game 3346: 0/1/0/0/3 | Confirmed: `SUMMARY window-offscreen 0, frame-offscreen 1 (1), clipped 0, x-on-frame 0, overflow 3 (1)`. The two lines are alarm panel 915x412 and network architecture 390x844, both known. Exit 1 on those, as on R1. audit.log |
| Shell X check 168 / 0 | Confirmed at the four sizes: `SHELL-X-CHECK 168 checked, 0 failed`. The R1 segmentation map 915x412 failure is gone. shellx.log |
| M1 segmentation map stacks under 1100px, map 480px when stacked | Confirmed. At 1024x768 and 1100x800 the body stacks, with nothing sideways (scrollWidth equals clientWidth). From 1101 to 1920 wide (1101x800, 1150x800, 1200x800, 1280x720, 1366x768, 1400x1000, 1440x900, 1920x1080) the panel sits beside the map, right edge at the window edge, with all 19 devices inside their zones at every size. probe-nsmwide.log, probe/tip-nsm-1101x800.png to tip-nsm-1366x768.png |
| M2 backup confirm, `.siem-btn`, `.ip-more-below` GNF 16px | Confirmed as computed: 16px GNF at 320, 360, 390 and 915 wide. None is wider than its parent or the window. The backup confirm is 346px at 390 and 302px at 360 on one line, and wraps to two lines (76px tall) at 320. SIEM DISMISS and ESCALATE share the row (122 + 131px at 360). probe-rest.log, probe/tip-btn-*.png |
| M3 log filter pop-ups | Confirmed through real clicks (row, then [LOOK UP IP], then [FLAG SESSION]). The intel pop-up has the shared X in its header and the scene X is hidden. The pop-up X click closes the pop-up and leaves the scene open, scene X back. Flag rejected shows only [BACK TO LOG] with no X. The anomaly flag confirm was not reached by click (no row matched `_isAnomalyEntry` on game 3104); its shots via `_openOverlay('flag_confirm')` are clean at all eight sizes. esc.log, shots/log-filter-flagconfirm__*.png |
| m1 SIS title wraps | Confirmed: two lines. The text ends 20px (360x740), 26px (320x640) and 26px (390x844) left of the pop-up X. probe/tip-sisdetail-*.png |
| m2 Esc: pop-up first, then scene | Confirmed with real clicks and key presses. SIS detail and SIS confirm, ESD confirm (guard clicked, then button) and log filter intel and flag pop-ups: Esc 1 closes the pop-up, scene stays, X visible again, nothing confirmed (`sis_tamper_confirmed` false, `esd_activated` false). Esc 2 closes the scene. After an Esc cancel, SIS Confirm then Yes still records the confirm and the success timer closes the scene. At 1400 and 390 (800 for ESD). esc.log |
| m3 X bands | Confirmed. Warranty X is wholly inside the letterhead bar at 390 and 360. SIS at 390x844: X bottom 109, header box top 117; at 360x740 X bottom 48, header top 56. sheets/warranty-checklist-small.png |
| m4 blockchain graph pane | Confirmed on game 3403: `bce-graph-pane pixel-scroll`, pixel scrollbar drawn (14px at 390x844, sideways at 1400). probe/tip-bce-*.png |
| m5 small GNF, claims nav | `.nsm-device` and `.siem-source-count` are 16px. Claims "Correspondence" fits its button at 1400, 1100, 1024 and 800. No GNF text under 16px is left in the branch's scenes (fontscan-tip.log; the only GNF lines are the concern form, which is not a console scene). |
| m6 SCADA historian 667x375 | Confirmed: the chart column scrolls with a pixel scrollbar and the time axis can be reached. sheets/scada-historian-small.png |
| Segmentation map action bar wraps at 360 | Confirmed: the SEVER button wraps to two lines inside the window. sheets/network-segmentation-map-small.png |

## Regression checks

Esc on ordinary minigames (game 3346, Esc pressed with the scene open): lockpicking, notes, PIN,
container, a PC container, person chat, phone chat, password and text file all close on Esc. The
result is identical on the baseline, including lockpicking returning to a Notes scene on the first
close after load. That Notes scene is the start-of-game note the probe force-closed at boot, and the
same thing happens with SIS on its first close. esc.log, esc-base.log.

Hook use: `handleEscapeKey` is defined only in SIS, ESD and the log filter, and called only from
`base-minigame.js:216`. Each returns false when nothing is open, so the scene closes as before. No
other module has a method of that name, so no scene picks up the hook by accident. The social
overlay's own Esc handler (`social-overlay.js:81`) stops propagation before the framework sees the
key, unchanged.

1101 to 1400 wide: see M1 claim above. The panel is beside the map in view at every width tried.

Button widths at 390 after the M2 font change: none too wide (claim table).

## Tests

Plain `node file`, tip worktree, one file at a time: minigame-consoles-fit 15/15, minigame-shell-fit
30/30, minigame-close-shell 19/19. Every test file that loads `base-minigame.js` or names a changed
module or scene (log filter, ESD, SIS, SCADA historian, blockchain explorer, the three fit tests):
123 files, 1830 pass, 0 fail. tests.log, testlist.txt.

JS test harness copy lists: this round adds no static import to any engine module (`git diff
c19b0f136 99fd5ff83` has no new import line), so no copy list needs a change.

## Findings

### M1 Segmentation map unusable in phone landscape: 29 to 38px of map in view (not a regression)

`css/network-segmentation-map-minigame.css:265` (`.nsm-action-bar`) keeps the legend, the hint and
the SEVER button pinned under the body at every height, and the 600px rule (:522) only narrows its
padding. At 667x375 and 740x360 the action bar takes 257px and the header 51 to 75px, so `.nsm-body`
(:54) gets a 29px (667x375) or 38px (740x360) window onto 944 / 920px of stacked map and panel. The
player has to scroll a strip the height of one device label to find a dashed line to click, then
scroll it again to read the consequence text. At 844x390 and 915x412 the body gets 193 and 215px,
which can be played.

Baseline at the same sizes: body 57px and 42px, with the whole map squashed into it (scrollHeight
60), which is no better. So this is not caused by the round 1 fix, but the scene is not playable on a
phone held sideways on either side, and this branch owns this layout.

Evidence: nsmshort.mjs output (tip and base rows, quoted above), cmp-nsm-667.png (base left, tip
right), shots/network-segmentation-map__667x375.png.

Fix: under `@media (max-height: 500px)`, let `.nsm-wrapper` scroll as one column (`overflow-y: auto`
with `pixel-scroll`; `.nsm-body { flex: none; overflow: visible }`), so the map, panel and action
bar follow each other and the player scrolls the whole scene. Or keep the bar but shrink it there:
hide `.nsm-legend`, keep the hint to one line and give `.nsm-body` `min-height: 220px`. Then add
667x375 to the shots and check that a rule line can be clicked after a real wheel scroll.

### m1 Segmentation map confirm keeps the scene X and Esc closes the scene

`js/minigames/network-segmentation-map/network-segmentation-map-minigame.js:221` (`_openModal`) and
:247 (`_closeModal`) only toggle the overlay class. With CONFIRM NETWORK ISOLATION open (NO and YES
buttons) the scene X (`#nsm-close`) stays visible and on top of the modal (hit test at its centre
hits the X at 390x844, 915x412 and 667x375), and Esc closes the whole scene. That is the pattern
this round removed from SIS, ESD and the log filter (one close control at a time, a confirm has two
named buttons and no X, Esc is Cancel). Same on the baseline, so not a regression.

Evidence: probe-nsmplay.log ("modal open, xVis visible", "Esc with modal open -> null"),
probe-nsmplay-base.log, probe/tip-nsm-modal-390x844.png (X over the modal's top-right corner).

Fix: in `_openModal` hide `#nsm-close` (`visibility: hidden`, as `_hideSceneX` does in SIS), show it
again in `_closeModal`, and add `handleEscapeKey() { if (!overlay.classList.contains('nsm-modal-visible')) return false; this._closeModal(); return true; }`.
Add the scene to the m2 test list. The pump, DLI and SCADA historian also have confirms or pop-ups
(`grep modal-overlay|confirm-modal`); they were not checked here and are worth the same look.

### m2 The Esc "behaviour" test replays a copy of the handler, not base-minigame.js

`test/js/minigame-consoles-fit.test.mjs:186` builds its own object and repeats the `if` from
`base-minigame.js:216` inside the test, so it passes whatever the real handler does: if the hook
call were moved after `closeByPlayer()`, or the `return` dropped, this test would still pass. The
static regex at :180 would catch a text change but not a reorder of the surrounding lines.

Fix: import `MinigameScene`, give it a fake `document` with `addEventListener` capturing the
keydown handler, call
`start()` with a subclass whose `handleEscapeKey` returns true and then false, fire the captured
handler with `{ key: 'Escape' }`, and assert on `closeByPlayer` calls.

### m3 Segmentation map SVG labels are VT323 at 9 to 13px, bold

This branch changed the rule labels from `monospace` to VT323 (`network-segmentation-map-minigame.js:676`),
which is right for the pixel-font rule, but kept their sizes: 11px default (:669), 13px for the
ward labels (:488), 9px for the "!" marker (:730), all with `font-weight: bold`. VT323 at 11px is
about 7px of cap height and bold makes the browser smear it, so "NO SEGMENTATION" and "WARD 7" read
as blurred specks next to 16px device names.

Evidence: fontscan-tip.log (VT323 9px "!", 13px "WARD 5", "FLEET", 11px "WARD 7", "NO
SEGMENTATION" at 390, 915 and 1400 wide).

Fix: 16px VT323 (the floor the fit test already applies to VT323 in CSS) and no bold; check that the
labels still clear the zone boxes at 1101 and 1024 wide.

### m4 Button rules still declare Press Start 2P and render GNF

The M2 fix made three rules declare what they render. Others in this branch's sheets still declare
`font-family: 'Press Start 2P'` on a single-class button rule that `.minigame-container button`
(`css/minigames-framework.css:111`) overrides to GNF: `.nsm-sever-btn` (network-segmentation-map
:358), `.nsm-modal-btn` (:457), `.cms-button` (claims :289), `.bce-flag-btn` (blockchain :474),
`.ip-confirm-btn` and `.ip-modal-btn` (infusion pump :168, :256), `.ehr-terminal-button` (EHR :305),
`.ransomware-display-btn` (:164). All are 16px, so they render at a good size (font scan clean), but
the sheet says otherwise. The next person to add an 8px phone rule to one of them will repeat M2.
The new test (:200) only checks GNF and VT323 rules, so it cannot see this.

Fix: change these to GNF (no visual change) and add a test that fails when a rule whose selector ends
in a button class declares Press Start 2P without a selector that beats the framework rule.

## Not checked or out of scope

The log filter anomaly flag confirm by real click (no anomaly row found on game 3104; covered by
state shots and the fixer's live check). The concern form's GNF 14/15px text (fontscan) belongs to
the social scenes, not this branch. Known open items from R1 not re-reported: alarm panel 915,
NAD1, 5d, X8, CF1, SIEM3 false positive.
