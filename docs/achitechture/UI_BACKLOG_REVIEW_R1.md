# UI backlog review R1 (branch build/ui-backlog at e51fe31df, against main cb6d7feb4)

Read-only review of `git diff cb6d7feb4...e51fe31df`, with live checks on a keyless server from the worktree on :3475 (fresh game 4246, m01_first_contact). Shots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-backlog-r1/`.

## Verdict

**Not ready to ship: one major.** Items 1 (alarm panel) and 3 (dead button rules) are correct and verified. Item 2 (5d) moves the call banner off the PIN title but onto controls and the entry display the player needs, which is a worse trade than the one it fixes.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 3 |
| Nits (separate) | 3 |

## Findings

### M1 (Major). The moved call banner covers PIN keys and the PIN entry display

`public/break_escape/js/ui/hud-lanes.js:207` (`ringLayerSpot`), `:349` (`MINIGAME_TITLES`), `:351` (`placeRingLayer`).

`ringLayerSpot` checks a spot only against titles and the close X. It never looks at the minigame's controls, so the "lane" and "below" spots land on whatever sits there. The probe read element boxes and used `elementFromPoint` at each control's centre, top and bottom:

| size | banner after | what it covers |
|---|---|---|
| 1400x1000 | 520,12 to 880,104 (default, unchanged) | nothing in the PIN pad |
| 915x412 | 539,84 to 899,176 (lane) | keys **1, 2 and 3 wholly** (centre, top and bottom all hit the banner; keys at y 114..154), and the top of keys 4 to 6 (162..202) |
| 390x844 | 16,207 to 374,301 (below) | the PIN entry display (`.pin-minigame-display`, 22,215 to 368,265) wholly |
| 360x740 | 16,155 to 344,249 (below) | the PIN entry display (22,163 to 338,213) wholly |

The build log (`docs/achitechture/UI_BACKLOG_BUILD_LOG.md:39`) says the banner "covers the top of keys 4 to 6" at 915x412. That understates it: in `pin-ring-915x412.png` the whole top row of keys is hidden. On a phone held sideways (touch only) the player cannot press 1, 2 or 3 until they answer or decline. On a portrait phone they can still tap keys, but cannot see what they have typed. Before the branch the banner covered the title (and, at 390x844, the X). Text that names the safe is cheaper to lose than input. The ring lasts 20 s (`phone-ringer.js:89` `RING_TIMEOUT_MS`), and a forced call (`disableClose`) has no Decline and holds the banner for longer.

So yes, the banner now blocks input the player needs. Options, in order of preference:

- **A. Bottom of the screen while a minigame is open (recommended).** The banner already has a bottom spot for the tutorial case (`css/phone-ring.css:18`, `.under-tutorial { top: auto; bottom: 16px }`). Reuse it whenever `.minigame-container` shows. Worked out from the probe's boxes (not yet shot): at 915x412 a right-aligned bottom banner (539..899, 304..396) clears every key (the bottom row ends at about y 298) and touches only the keypad frame's bottom edge; at 1400x1000 (884..976) and 390x844 (734..828) it clears the pad and the Attempts Log; at 360x740 (630..724) it touches about 10px of the Attempts Log panel, no control. The bottom of most minigames is footer, log or empty space, while the top is title and the main control.
- **B. Avoid controls as well as titles.** Keep `ringLayerSpot`, but pass it the shown interactive boxes too (`button`, `input`, `[role=button]`, `[tabindex]`, plus readouts such as `.pin-minigame-display`) and try more spots (top centre, lane right, bottom right, bottom centre, under the title). Pick the first that touches neither. If none is clear, fall back to the top centre, because a covered title costs less than a covered control. This is more general and more code. Each new scene could still surprise it.
- **C. A compact banner over a minigame.** The ringer already knows when it rings over a minigame (`phone-ringer.js:351`, `overMinigame` in the banner view) and has a small "pill" view (`:358`). Over a minigame it could show a one-line strip (about 40px: headshot, name, Answer and Decline) at the bottom, or the pill with a ringing state. This needs the user's sign-off, because it changes how a call looks. Pair it with A.

Either way, add a live check that reads `elementFromPoint` on the scene's controls with the banner up at 915x412, 390x844 and 360x740, as the probe here does (`probe.mjs` in the shots folder).

### m1 (Minor). The assumption "only the call banner can cover a title" is false; warning and error toasts do too

`docs/achitechture/UI_BACKLOG_BUILD_LOG.md:22`; `public/break_escape/js/systems/notifications.js:18`.

Only `info` and `success` are held (`HOLDABLE_TYPES`). Warnings and errors show at once over an open minigame, by design (comment at `notifications.js:14`), and minigames raise them: the PIN pad itself (`minigames/pin/pin-minigame.js:745`, `'PIN entry failed', 'error'`), the mail bridge (`minigames/mail-client/mail-bridge.js:125`, a 2.5 s warning) and the chat helpers. In the live check a warning toast over the open PIN pad covered the "Enter PIN" title at every size: 1400x1000 (toast 780,86 to 1380,214 against the title 500,159 to 900,207), 915x412 (16,84 to 899,171, the full width, across the title at 98,67 to 506,115) and 390x844 (16,84 to 374,227 across the title at 22,151 to 368,199). Shots: `pin-warn-*.png`.

This is old behaviour, not a regression from this branch, so it is minor here. It does mean 5d is only half done. Suggested follow-up: while a minigame is open, start the notify lane below the scene's lowest title (`computeLanes` already takes `notifyTopMin`, `hud-lanes.js:133`), using the same title list. Or accept it on purpose for short warnings and log that decision.

### m2 (Minor). The banner's new spots overlap toasts in the notify lane

`public/break_escape/js/ui/hud-lanes.js:207` to `:218`.

The "lane" spot is the notify lane's right-hand end, and the "below" spot lies inside the notify lane on a phone. Yet the banner is not a lane member and ignores toasts. A warning raised while the banner shows sits under it (the banner is z-index 2300, toasts 2000). At 915x412 the banner covers the toast's right-hand end, 539..899 by 84..171, with the end of the message text under it (`pin-ring-warn-915x412.png`). At 390x844 it covers the toast's last 20px (207..227, `pin-ring-warn-390x844.png`). Before the branch there was a 20px overlap at 915x412 (the banner's 84..104), so the branch makes it bigger. With option A of M1 this goes away. Otherwise, stack the banner as the notify lane's first member (`stackMembers`) so toasts start below it.

### m3 (Minor). No test exercises the live placement

`test/js/hud-lanes-ring-layer.test.mjs`.

Five tests cover the pure spot maths and one matches source text. Nothing runs `placeRingLayer` or `applyLanes` with a banner and a minigame in the DOM. M1 got through for that reason: the maths is right for titles, and the live result still covers keys. The memory notes "new features need full tests" and "fix claims need live proof" ask for a test on the real path. Add a jsdom or headless test that opens the PIN pad, offers a ring and asserts that no key or display box is under the banner, at the three short sizes.

### Nits

- n1. `hud-lanes.js:211`: `hits(t, l, tp)` never uses `t` (it reads `titles` from the closure). Drop the parameter.
- n2. `hud-lanes.js:217`: the "below" fallback is not checked against the viewport bottom. A tall scene title near the bottom could push the banner off screen. Clamp it to `vh - h - 16`.
- n3. `vpn-log-viewer-minigame.css`, still linked at `app/views/break_escape/games/show.html.erb:73`, styles no markup anywhere (no `vpn-` class in any script). The builder left it for a decision, which is right. Record it on the backlog so it is not lost.

## Item checks

### 1. Alarm panel font at 390x844: correct

`alarm-panel-minigame.js:83` `SVG_W = 320`, `alarm-panel-minigame.css:30` `max-width: 324px` and `:83` `.ap-svg { width: 320px; max-width: none }`. The SVG is never scaled now. At every size the computed sizes are 8px (Press Start 2P) and 16px (GNF). The panel fits a 360px phone (18..342) with no sideways scroll (`scrollWidth` equals the viewport at 360, 390, 915 and 1400). I checked the lamp text against the real scenario data. The longest labels and statuses in use ("BOARD TO LOWER FLOORS" in m10, "SAFE STATE ACHIEVED" and "SETPOINT DEVIATION" in sis02) end at x 236 of the 320px viewBox, so nothing is cut by the narrower SVG. The panel titles wrap cleanly beside the X. At 915x412 the panel still scrolls (the baseline frame-offscreen 1). The text is crisp in `alarm-390x844.png`, `alarm-360x740.png`, `alarm-915x412.png` and `alarm-1400x1000.png`.

### 2. Banner over the PIN title (5d)

The title is clear at every size, and the timing paths (ring first, then PIN first) are as logged. See M1, m1 and m2 for the controls the banner now covers, the toasts that cover titles anyway, and the overlap with toasts.

### 3. Dead console button rules: all 16 removals verified

For each removed class (`cms-button`, `cms-button-primary`, `cms-button-secondary`, `dli-investigate-btn`, `ip-confirm-btn`, `ip-modal-btn`, `ip-modal-buttons`, `laptop-close-btn`, `notes-minigame-buttons-container`, `bluetooth-scan-btn`, `panel-close`, `ransomware-display-btn` and its `.icon`, `.label`, `.contact`, `.report` and `.recovery` variants, `sh-close-btn`, `vpn-close-btn`, `vpn-flag-btn`, `vpn-clear-btn`), I searched for it as a substring in `public/break_escape/js`, `app` (views, helpers, controllers), `lib`, `scenarios`, `test` (apart from the new guard test), `tools` and the public HTML pages, and in Hacktivity's `app/` (the host page loads these sheets). There were 0 hits for each. Then I checked for names built in code: prefix concatenation or template literals (`'cms-' +`, `` `vpn-${ ``, and so on for every prefix) and suffix building (`+ '-btn'`, `}-close-btn`, `}-scan-btn`, and so on). The only template hits were `cc-panel-${…}` (concept-card.js:23, an id), `#da-panel-${side}` (dual-auth:170, an id) and `cf-chip-${role}` (concern-form:244). None of these makes a removed class. No removed rule shared a selector list with a live class. The removed hunks hold only those selectors. No removal is wrong.

## Live evidence

Server: keyless, from the worktree, :3475, PID recorded in the shots folder (`server.pid`), stopped at the end of the review. Game 4246 (m01_first_contact, fresh from `tools/playtest/new-game.rb`). The probe picks female_hacker_hood_v2 if the character picker shows; the game booted at every size.

Probe (`probe.mjs` in the shots folder): opens the PIN pad ("Enter PIN: Director's Safe"), offers a ring from agent_0x99, records the banner, title, X and covered controls, raises a warning toast, then opens the alarm panel with sis02's lamp text.

| size | PIN + banner | PIN + banner + warning | PIN + warning | alarm panel |
|---|---|---|---|---|
| 1400x1000 | `pin-ring-1400x1000.png`: clear | `pin-ring-warn-1400x1000.png` | `pin-warn-1400x1000.png`: toast over title | `alarm-1400x1000.png`: 8/16px |
| 915x412 | `pin-ring-915x412.png`: keys 1 to 3 hidden | `pin-ring-warn-915x412.png`: banner over toast | `pin-warn-915x412.png`: toast over title | `alarm-915x412.png`: 8/16px, scrolls |
| 390x844 | `pin-ring-390x844.png`: display hidden | `pin-ring-warn-390x844.png` | `pin-warn-390x844.png`: toast over title | `alarm-390x844.png`: 8/16px |
| 360x740 | `pin-ring-360x740.png`: display hidden | `pin-ring-warn-360x740.png` | `pin-warn-360x740.png` | `alarm-360x740.png`: 8/16px, fits |

`pin-noring-*.png` show each size with no banner.

Node tests, each run alone with `node test/js/<file>.test.mjs`: minigame-consoles-fit 32/32, minigame-pixel-art 48/48, minigame-close-shell 19/19, minigame-controls-layout 11/11, bark-release-policy 31/31, phone-call-bark-hold 2/2, and the other files that read a changed file: minigame-shell-fit 30/30, hud-lanes-ring-layer 6/6, dead-console-button-rules 2/2, ui-hud-lanes 40/40, phone-ring-layer 23/23, npc-bark-delay 20/20, engine-fixes-pass4b 10/10, escaping-shared-helpers 21/21, minigame-html-sweep-a 6/6, scada-historian-data 8/8, validator-minigame-data-layers 1/1. All pass.

Gates:
- `ui-rules-audit --all --strict --skip person-chat,network-view --sizes 1400x1000,800x600,915x412,390x844`: frame-offscreen 1 (mg-alarm-panel at 915x412, the baseline), window-offscreen 0, clipped 0, x-on-frame 0, overflow 0. Exit 1 on that baseline breach only. Old, as the build log says: mg-siem-dashboard cancel-beside-x at all four sizes (a known false positive) and mg-examine font-size 1 at 390x844. Output: `audit.txt`.
- `shell-x-check`: 172 checked, 0 failed, exit 0 (as expected). Output: `shellx.txt`.
