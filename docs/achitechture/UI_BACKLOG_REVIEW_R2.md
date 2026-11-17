# UI backlog review R2 (branch build/ui-backlog at b670b9afd, against main d69c29089)

Read-only review of `git diff d69c29089...b670b9afd`, with live checks on a keyless server from the worktree on :3475 (fresh m01_first_contact games 4285 for the probes and 4286 for the gates). Shots and outputs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-backlog-r2/`.

## Verdict

**Ship.** R1's major (M1) is closed live: over the PIN pad at all four sizes, over the EHR console at 915x412 and 390x844, and over every registered minigame at 915x412 and 390x844, the banner covers no control, title or X whenever it takes one of the new spots, and stays in the viewport. Answer and Decline take real clicks in the new spots, a forced call places the same way, and the banner returns to the top centre when the minigame closes. m2 (toasts) works both ways. The m1 revert is clean. Three minors remain, none blocking: the real measuring path still has no test, the banner is not re-placed when a minigame's own content changes, and a toast can push the banner to the fallback (over the X) when a clear spot exists just below the toast.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 3 |
| Nits (separate) | 4 |

## R1 findings: status

| R1 | Status | Evidence |
|---|---|---|
| M1 banner over PIN keys and display | Closed | Probe and sweep below; `pin-*-ring.png` |
| m1 warning toasts over titles | Reverted on purpose (orchestrator); backlog entry present | `docs/IDEAS_BACKLOG.md` 2026-11-14 entry; `measureHud` is byte-identical to main |
| m2 banner over lane toasts | Closed | Toast arrives: banner moves; toast leaves: banner moves back (`r2-toast-up-390x844.png`, `r2-toast-gone-390x844.png`). See m3 below for the spot it picks |
| m3 no live-path test | Partly closed | The new test fails on R1 code (6 of 8), but nothing tests `measureMinigame`. See m1 below |
| n1 unused `t` | Closed | `hud-lanes.js:224` |
| n2 below spot not clamped | Closed in code (`fit`, `hud-lanes.js:228`); the test for it does not reach it (n3 below) |
| n3 vpn sheet | Closed | Backlog entry 2026-11-14 |

## Findings

### m1 (Minor). `measureMinigame`, the path that caused M1, has no test

`test/js/hud-lanes-ring-layer.test.mjs`; `public/break_escape/js/ui/hud-lanes.js:376` to `:403`.

The new tests feed hand-written boxes into the pure `ringLayerSpot`. M1 in R1 was a measuring gap (controls never collected), and that is still untested. Mutation: in a scratch copy of the tip, I removed both control collectors in `measureMinigame` (the `MINIGAME_CONTROLS` query at `:396` and the pointer-cursor pass at `:397`), so it returns no controls at all. `hud-lanes-ring-layer` still passes 8/8. The live probe (`tools/playtest/ring-banner-probe.mjs`) would catch it, but it is a manual tool, not a gate.

The R1 mutation the builder ran does hold: with R1's `hud-lanes.js` put back, 6 of 8 fail (tests 1 to 5 and 8), 2 pass (6 and 7). Confirmed.

Suggested fix: a jsdom test that builds a small `.minigame-container` with a title, a few buttons, a `.pin-minigame-display`, a `div` with `cursor: pointer` and a backdrop over half the screen (stub `getBoundingClientRect`), and asserts what `measureMinigame` returns; then calls `applyLanes` with a shown `#phone-ring-layer .incoming-call` and asserts the inline `top`/`left` and `win.__hudLanes.ringSpot`.

### m2 (Minor). The banner is not re-placed when the open minigame's own content changes

`public/break_escape/js/ui/hud-lanes.js:625` to `:636`.

`startHudLanes` re-runs on resize, on body children, on toasts, on the caption and on the ring layer, but nothing watches the minigame's subtree. A control that appears inside the minigame while the call rings (a view switch in a console, a confirm step, an async render) can end up under the banner and stay there until something else triggers a layout pass.

Evidence (synthetic, `late-control.mjs` in the shots folder): PIN pad at 915x412, ringing, banner at the bottom centre (278,304 to 638,396). A button added inside the minigame at 300,330 to 500,370 is then covered by the banner. 1.2 s later it is still covered; only a manual `hudLanesRelayout()` moves the banner (to the bottom right, 539,304 to 899,396). I did not find a shipped scene that does this inside the 20 s ring, so this is minor.

Suggested fix: while the banner is placed over a minigame, observe that `.minigame-container` with `{ childList: true, subtree: true }` (rAF-throttled already by `relayout`), and disconnect when the banner or the minigame goes.

### m3 (Minor). A toast pushes the banner to the fallback over the X when a clear spot exists below the toast

`public/break_escape/js/ui/hud-lanes.js:229` to `:233`.

EHR console at 390x844: the banner rings in the "lane" spot (16,84 to 374,178), clear of the title and X. A warning toast then arrives (16,84 to 374,227). No candidate is clear, so the banner jumps to the top centre (16,12 to 374,106) and covers the console's close X (320,30 to 360,70) and the toast's heading and own X (`r2-toast-up-390x844.png`). When the toast leaves (about 3 s), the banner moves back to the lane spot. Both moves work as built (m2 closed).

Two costs. The X is covered while a toast shows, although the space just below the toast (231 to 325) holds only the "!" icon and message text, no control. And the Answer button jumps about 70px under the player's thumb at the moment a toast lands. The orchestrator's ruling covers the fallback when no spot is clear; here a clear spot exists that the list never tries.

Suggested fix: add one candidate, the lane spot moved below the lowest toast (`top = max(toast.bottom) + LANE_GAP`, clamped with `fit`), tried after "lane" and before the fallback.

### Nits

- n1. Readouts other than the PIN display are not obstacles. At 915x412 the bottom-centre banner covers the PIN pad's Attempts Log text ("No attempts yet" in `pin-915x412-ring.png`), and at 360x740 the lower half of the Attempts Log panel. That is where a failed attempt is listed while the player retries. Canvas scenes are not measured either: over the lockpicking scene at 915x412 the banner sits on the lower 90px of the lock body (`r2-sweep-lockpicking-915x412.png`; tools and pins are clear). Both cost less than a covered key; worth a line in the backlog if the PIN pad is reworked.
- n2. `tools/playtest/ring-banner-probe.mjs:94`: the step 3 comment still says "the lane starts below the titles", which was the reverted m1. The header (`:1`) also cites m1. And the probe only fails overlaps on a non-default spot (`:76`, `:90`), so a fallback that covers a control passes silently; print the covered controls as a note in that case too.
- n3. `test/js/hud-lanes-ring-layer.test.mjs:66`: "the below spot is clamped to the viewport" returns the "bottom" spot (no controls, title only at the top), so it never reaches the `below` clamp. Make the bottom row blocked (a control across `y 190..300`) so the test exercises `fit(frame.bottom + ...)`.
- n4. `shownRect` (`hud-lanes.js:265`) ignores ancestor clipping and opacity, and `cursor` is inherited. Rows scrolled out of a list (still inside the viewport under a footer), an `opacity: 0` element, or every child of a large `cursor: pointer` panel just under half the screen all count as blockers. In the sweep no fallback was caused by this: each of the six fallbacks at 915x412 (password-guesser, authenticator, siem-dashboard, sis-config-threshold, log-filter, cryptex) and the one at 390x844 (log-filter) had visible controls in every candidate, checked in the shots. Note it for when a scene falls back without a visible reason.

## Item checks

### 1. M1 live

`ring-banner-probe.mjs` (builder's tool), each size on a fresh page, exit 0 at every size:

| scene and size | spot | banner | covered controls / titles | in viewport |
|---|---|---|---|---|
| PIN 1400x1000 | bottom | 520,892 to 880,984 | 0 / 0 | yes |
| PIN 915x412 | bottom | 278,304 to 638,396 | 0 / 0 | yes |
| PIN 390x844 | bottom | 16,734 to 374,828 | 0 / 0 | yes |
| PIN 360x740 | bottom | 16,630 to 344,724 | 0 / 0 | yes |
| EHR 915x412 | bottom | 278,304 to 638,396 | 0 / 0 | yes |
| EHR 390x844 | lane | 16,84 to 374,178 | 0 / 0 | yes |

These match the build log's table exactly. I looked at every `pin-*-ring.png` and `ehr-terminal-*-ring.png`: keys, display, title and X are all clear.

Cases the builder did not try (`r2probe.mjs`, `r2probe-cases.json`):

- **Ringing before the minigame opens.** No minigame: top centre (278,12 to 638,104). Opening the PIN pad moves it to the bottom (278,304 to 638,396). Note: a fresh m01 page boots with the title screen and then the Mission Brief notes open as minigames, so a probe must close those first or it measures over them.
- **Resize while ringing**, 915x412 to 390x844 to 360x740 to 1400x1000 and back: re-placed each time, same boxes as fresh pages, no overlaps, in viewport (`r2-B-resize-*.png`).
- **Answer and Decline clickable.** `elementFromPoint` at each button's centre returns the button in every placed case. Playwright trial clicks (which check the hit target) pass, and a real click on Decline dismisses the call.
- **Forced call (`disableClose`, no Decline)** over the PIN pad: 915x412 bottom (278,315 to 638,396), 390x844 bottom (16,747 to 374,828), no overlaps, Answer takes a trial click (`r2-E-forced-*.png`).
- **Closing the minigame while ringing.** The banner returns to the top centre and its inline style is cleared.
- **Every registered minigame** (title-only start, as the audit does; person-chat, network-view, phone-chat, title-screen skipped), `r2probe-sweep-915x412.json` and `r2probe-sweep-390x844.json`. On a placed spot (bottom, below or lane) the banner never covered a control or title, measured independently (my control list adds `canvas`). Fallbacks: 6 at 915x412, 1 at 390x844 (listed in n4). Each covers the console title or a small part of the top, as ruled; authenticator at 915x412 and log-filter at 390x844 also cover the close X in the fallback (`r2-sweep-*.png`).

### 2. The obstacle list and its cost

The list covers buttons, inputs, textareas, selects, links, `role=button`, `onclick`, focusable `tabindex`, the PIN display and anything with a pointer cursor; titles come from `MINIGAME_TITLES`. The over-half-the-screen rule applies to controls only, so a big canvas (lockpicking) or a full-height textarea is not an obstacle (n1). False positives: none found live (n4 lists the code-level risks). False negatives: readouts and canvas (n1), and controls that appear after placement (m2).

Cost: `placeRingLayer` returns before measuring unless a banner is showing, so the `querySelectorAll('*')` and `getComputedStyle` pass runs only while a call rings over a minigame. Measured in the page (mean of 5): `measureMinigame` 0.04 to 0.32 ms for most scenes, 0.62 to 1.46 ms for log-filter (385 elements, 304 controls) and 0.64 ms for scada-historian (804 elements); a whole `applyLanes` pass 0.14 to 1.92 ms. Acceptable for a rAF-throttled pass that runs on mutations and resizes.

### 3. m2 toast avoidance and re-place

With the banner up over the PIN pad, a warning toast arrives and the banner stays clear of it at every size (`toastVsBanner` 0; `pin-*-ring-warn.png`). Over the EHR console at 390x844 the toast forces the fallback and the banner returns to the lane spot once the toast is removed (seconds 2 and 3 fallback, second 4 onwards lane). Re-place works both ways; see m3 for the spot choice.

### 4. The m3 test fails on R1 code

Confirmed by mutation in a scratch copy: R1 `hud-lanes.js` (e51fe31df) with the new test, 2 pass and 6 fail; tip restored, 8/8. The gap is the measuring path (m1 above).

### 5. The m1 revert and the probe

`git diff d69c29089 b670b9afd -- hud-lanes.js` has no `notifyTopMin` change: `measureHud` is as on main. The `withControls` parameter and its `continue` went with the revert, the header comment lost its m1 sentence, and the one source assertion was removed from the test. No dead code is left. The probe records a toast over a title as `note3` and does not fail on it (all PIN runs exit 0 with `note3` set). One stale comment remains (n2).

### 6. R1 items 1 and 3 after the merge

- Alarm panel: `alarm-panel-minigame.js:83` `SVG_W = 320`, `alarm-panel-minigame.css:30` `max-width: 324px`, `.ap-svg` `max-width: none` (`:87`). The merge of d69c29089 changed neither file.
- Dead button rules: a fresh search for every removed class across `public/break_escape`, `app`, `lib`, `scenarios` and `tools` finds 0 hits, apart from `.vpn-clear-btn` in the shared selector list at `vpn-log-viewer-minigame.css:104`, which R1 already accepted (the sheet is on the backlog). `dead-console-button-rules` passes 2/2.

## Gates

- `ui-rules-audit --all --strict --skip person-chat,network-view --sizes 1400x1000,800x600,915x412,390x844` (game 4286), run on the tip after the revert: window-offscreen 0, frame-offscreen 1 (mg-alarm-panel at 915x412, the baseline), clipped 0, x-on-frame 0, overflow 0. Exit 1 on that baseline only. Other lines as before (mg-examine font-size 1 at 390x844). Output `audit.txt`.
- `shell-x-check`: 172 checked, 0 failed, exit 0. Output `shellx.txt`.
- Node, each file alone with `node test/js/<file>.test.mjs` (every file that reads a changed file, plus the R1 list): bark-release-policy 31/31, engine-fixes-pass4b 10/10, escaping-shared-helpers 21/21, hud-lanes-ring-layer 8/8, minigame-close-shell 19/19, minigame-consoles-fit 32/32, minigame-html-sweep-a 6/6, minigame-pixel-art 48/48, minigame-shell-fit 30/30, npc-bark-delay 20/20, phone-call-bark-hold 2/2, ui-hud-lanes 40/40, validator-minigame-data-layers 1/1, dead-console-button-rules 2/2, phone-ring-layer 23/23, minigame-controls-layout 11/11, scada-historian-data 8/8. All pass.

Server: keyless, from the worktree on :3475, PID 1551108, stopped by PID at the end.
