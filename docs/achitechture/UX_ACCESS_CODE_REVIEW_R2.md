Counts: 0 blockers, 0 majors, 3 minors, 3 nits.

# UX access: code review R2

Branch `build/ux-access` at 4469a2a1b, reviewed as `git diff main...build/ux-access` (merge base f2d53bb40, so the diff is this branch plus build/dup-toast). Read with the build log (all sections), code review R1, AGENTS.md and the common builder brief (pixel-art UI rule, sync size rule). The R1 fixes (0dc6762dc to 442d2f534), the merge 5dd1ea698 and d40485916 were read line by line.

Not graded, by the orchestrator's ruling: the 720px desktop crop, and the bag's name showing twice.

Verdict: no blockers or majors. The R1 majors are closed. The toast queue and the dup-toast settle window work together: no toast is lost or shown twice in any path I traced or ran. What is left is a burst case where the cap does not hold, a stale-metrics detail in the font redraw, and a short-viewport sizing edge.

## R1 findings: closed

| R1 | Outcome |
|----|---------|
| M1 (unlock-gaps merge) | Closed. Both helpers kept; the panel takes `prompt-mode` and `case-lock` together; desktop-mode keeps `height: auto` with the `calc` line gone; minigame-controls-layout test 4 expects `auto` with a comment. Precedence checked below. |
| M2 (cap and duration-0 toasts, no wait limit) | Closed. `shownToasts` counts only `duration > 0`; a duration-0 toast skips the cap; `MAX_TOAST_WAIT_MS` 4 s. See m1 for a burst case the limit opens up. |
| m1 (post-it jump) | Closed. `makeDraggable` pins top/left from the drawn box on every press, now subtracting the parent's border, which the old branch did not. |
| m2 (lockout gone in 2.5 s) | Closed. The screen stays until Close; Close, the cross and Esc are bound again after `cleanup()`, and are removed by the framework's own `cleanup()` on close, so nothing leaks. Close now goes through `closeByPlayer`, so a remote sign-in returns to the screen it came from, which the old self-close did not do. |
| m3 (keyword list) | Closed. One list in `utils/computer-keywords.js`; container keeps its substring test, password screen tests whole segments of type and texture key. Door sprites use `door_32` and `door_side_sheet_32`, and room types such as `room_qdc_servers` do not match (`servers` is not a segment), so every m05 to m09 password door keeps the plain panel. |
| m4 (pixel-art leftovers) | Closed for the four places named. One more on a rule this branch restyled: n2. |
| m5 (VT323 on canvas) | Closed in substance. See m2 for the redraw keeping the fallback font's height metrics. |
| m6 (test_access_networks confirms) | Closed. Validator 0 lines with ❌. |
| n1 to n3 | Closed. n2's order holds for minigames; see n1 for workstation popups. |

## Checks run

- JS tests, no lock, every test file that imports or copies a changed module (notifications, minigame-manager, password and container minigames, network-view, helpers, escape-html, computer-keywords, canvas-fonts, npc-action-icons, npc-needs-debug, pc-sessions), plus the seven test files that copy lock-scope-refusal.js without computer-keywords and minigame-controls-layout: `bin/test-js -j 3`, 195 files, 195 passed, 0 failed.
- Two scratch tests (session scratchpad `r2ux/`, not committed): five task toasts held over a share-to-parent handover with a 450 ms close, then a panel opened while some still wait: each toast drawn exactly once. Six task toasts raised together outside a panel: 2 shown and 4 waiting, then 6 on screen at 4.1 s (m1).
- Validator on test_access_networks (`--no-graph`): 0 lines with ❌.
- Mission spot-check (static, ERB rendered through the validator): m05 `Exfiltration Upload Terminal` (pc, 1 file) and m07 `crisis_control_system` "Cascade Control System" (pc, 1 file, flag-locked) open as desktops through `mentionsComputer` on type `pc`; neither has a post-it. m08 `security_archives` door (password, room type `room_hq_archives`) takes the plain panel. m06 `transaction_server` opens the blockchain explorer, not a desktop. No live run this round; the live desktop proof is the build log's d01, d02, d05 and d06.
- The 8 copy lists: access-remote-signin, container-transfer-dialog, container-shares, lock-scope-refusal, password-case-hint, password-join-mode, password-signin-mode, password-minigame-submit. The other test files that copy password or container modules import them from the repository path, and all pass.

## The two toast changes together

Traced paths, each with no loss and no double:
- A waiting toast whose 4 s timer fires during the 400 ms settle window: `showWaitingToast` sees `panelExpected()` and moves it to the held queue (deduplicated), released when the settle ends.
- `removeNotification` during the settle: `showNextWaiting` moves every waiting toast to the held queue in one loop (each returns true), in order.
- A panel opens: `holdRecentNotifications` pulls the glimpses, then `takeWaiting()` clears their timers and holds them behind the pulled ones. A pulled toast that is released, waits again and is held again keeps `seen`, and was never on screen in between, so it is not replayed twice.
- The held queue released after a panel goes through the cap: the first two show, the rest wait with a fresh 4 s limit.
- A waiting toast and a held copy of the same toast: `holdForPanel` skips the copy, and once one is on screen the other only restarts its countdown (`findShownDuplicate`).
- The return-false branch of `showWaitingToast` is unreachable from `showNextWaiting` (its loop checks the cap first); harmless.

## Minors

### m1. A burst shows every waiting toast at once at the 4 s limit, past the cap

File: public/break_escape/js/systems/notifications.js:250-257 (`addWaiting`, one timer per toast), :269-276.

Failure scenario: a trigger completes three tasks, sets an aim and gives two items (6 info or success toasts, or the held queue released after a long conversation). Two show; four wait, each with its own 4 s timer started at the same moment. At 4 s all four timers fire and render over the limit while the first two (5 s) are still up: six toasts on screen, the stack finding 12 set out to stop, and the last four now stay until 9 s instead of 5 s. Measured in a scratch test: 2 on screen at 0 s, 6 at 4.1 s.

Fix: arm the limit only on the head of the line. When the head's timer fires, show it over the limit and arm the next waiting toast's timer from then (for example a further 1.5 s), so a burst shows at most one extra toast at a time; or let `showWaitingToast(..., true)` show only one over the limit and re-arm the rest. Add a test: six toasts raised together never put more than three on screen. Add one test combining the settle window with the cap (three or more held toasts across a handover), which neither toast-queue nor toast-once-across-panel-handover covers today.

### m2. The font redraw keeps the fallback font's height metrics

Files: public/break_escape/js/systems/npc-action-icons.js:361, :398; public/break_escape/js/systems/npc-needs-debug.js:147-149.

Failure scenario: a Phaser 3.60 Text measures its ascent and descent once, in `TextStyle` (`metrics = MeasureText(style)`) when it is made, and `updateText()` reuses them; only the line widths are measured again. A text made before VT323 arrived (any NPC icon or needs label in the first room, when the page's load event comes late on a slow connection) is redrawn in VT323 with the monospace box height, so the glyphs can sit off-centre in the light card or lose a row at the top or bottom. The build log's live check found VT323 ready straight after boot, so this shows only when the font is late; not seen live, worked out from the Phaser 3.60 source as I know it.

Fix: in both redraw callbacks call `text.style?.update?.(true)` (recomputes metrics, then calls `updateText`) instead of `text.updateText?.()`, and for the needs labels and letters the same. Extend the canvas-fonts or action-icons test with a stub whose `style.update` records the `true` argument.

### m3. Below about 662px tall, the desktop's 240px floor makes it spill under the Close row

File: public/break_escape/css/container-minigame.css:46-47 (`max-height: calc(100vh - 440px)`, `min-height: 240px`).

Failure scenario: from the build log's own measures (desktop block = screen + 128px, starting up to 193px down on m01, game area ending 101px above the window's foot), the m01 desktop fits only while `H - 294 >= 368`, that is a window at least 662px tall. A 1366x768 laptop with browser chrome, or Hacktivity's page with its own header, gives about 620 to 660px. There the screen is held at 240px, the desktop runs past the game area (which shrinks, `min-height: 0`), and the monitor's foot and the post-it at `bottom: 64px` sit under the in-flow Close row. Close stays clickable (it paints above), so this is a look and reach problem, not a trap. Not seen live; worked out from the logged measures.

Fix: drop the floor to about 180px, or make it `min-height: min(240px, calc(100vh - 480px))`; check live at 1366x650 on Sam's PC and m01 IT Monitoring Station.

## Nits

- n1. notifications.js:153: waiting toasts move to the held queue only when `holdRecentNotifications` runs (minigame start, conversation start, mission brief). The CyberChef and lab-sheet popups (`overlay-open.js` POPUP_IDS) hold toasts without calling it, so toasts raised in the popup go to the held queue first and older waiting toasts join behind them when their 4 s timers fire: out of order, R1 n2's case for popups. Fix: in `showNotification`'s hold branch, `holdForPanel(takeWaiting())` before pushing the new toast.
- n2. password-minigame.css:747: `.signin-message`, which this branch gave a solid backing and 2px frame, keeps `text-shadow: 1px 1px 0 #000` and `font-size: 17px` (both from before this branch). On the solid backing the shadow is half a GNF pixel and adds nothing; 17px is off GNF's grid. Fix: drop the shadow and use 16px. The same 1px shadow is on `.signin-current` (:642), `.signin-selected` (:728), `.signin-remote` (network-view-minigame.css:231) and `.container-content-label` (container-minigame.css:375), none changed by this branch; worth a sweep in the pixel-art pass.
- n3. password-minigame.css:183-192 and :783-797: the case-lock look leans on `prompt-mode` for its `min-height: 0` and for removing the label's dark backing. It works because a case type is never a computer type, but the two tests are independent (`isCaseLockTarget` on the type, `passwordScreenKind` on the type and texture key), so a case on a sprite named with a computer segment would show the gold label on the dark `#101820` box at 250px tall. Fix: give `.password-minigame-area.case-lock` its own `min-height: 0` and `label { background: none; padding: 0; }` so it stands alone.

## Pixel-art rule (changed CSS)

Every added or changed line in container-minigame.css, password-minigame.css, network-view-minigame.css, notifications.css, minigames-framework.css, ui-themes.css and main.css: borders 2px, no radius, no gradient, shadows hard (`4px 4px 0`, `inset 0 0 0 4px`) or none, fonts GNF or VT323. The disabled Sign in (d40485916) is a flat fill with a 2px inset frame; `[data-ui-theme]` has no `.submit-btn` rule, so the theme does not override it. The desktop label's 8-way 2px outline is one GNF pixel at 16px. Only n2 is left on a rule this branch touched.

## Merge resolution (5dd1ea698)

- password-minigame.js:323-332: both classes on the panel. `.password-minigame-area.case-lock` rules (0,3,0) beat `.prompt-mode` (0,2,0) for the bezel, screen background and border, and the label colour and font; `.prompt-mode` supplies `min-height: 0` and clears the label backing, which case-lock does not set (n3). A Wi-Fi join gets `prompt-mode` only. Matches live shots d04 and d07.
- The controls-overlay consoles (SIEM, EHR, backup recovery, network architecture) set `static controlsOverlay = true`; neither the password nor the container scene does, so `.minigame-controls-overlay .minigame-game-container { min-height: auto }` never meets this branch's rules.
- container-minigame.css:19-28: one `height: auto`, no leftover `calc`.

## Secrets and sync size

Unchanged from R1: no new synced field; `guest` is one client-side boolean; the toast queue and font promise are module memory. The lockout path shows only the server's message.
