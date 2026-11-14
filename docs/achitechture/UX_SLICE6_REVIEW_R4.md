# UX slice 6 review, round 4: start panel Places scroller, locked sign-in, locked row

Branch `build/ui-slice6`, tip 2143b6bf8: the R3 fixes (aeb0c4fef) with main bbf94cee9 merged on
top (release log only). Reviewed against `UX_SLICE6_REVIEW_R3.md`, the build log's "review round 3
fixes" section, the UI design language and the pixel-art UI rule. No code was changed.

## How it was checked

- Read the R3 fix diff (`8f625b5fc..aeb0c4fef`): `css/pc-monitor.css`, `css/network-view-minigame.css`,
  `utils/pc-taskbar.js`, `network-view-minigame.js`, `password-minigame.js` and the new tests.
- Tests, without the lock: `pc-taskbar` 26, `pc-sessions` 43, `pc-monitor-frame` 49, `network-view`
  46, `workstation-state` 55, `password-signin-mode` 66, all pass (285, `node --test`). Rails
  `access_model_login`, `network_pivot`, `network_remote_signin`: 76 runs, 745 assertions,
  0 failures, 0 errors.
- Live: own keyless server on :3472 (stopped by PID). Games from `swap-scenario-game.rb
  --unlock-all`: 3323 (Sam's PC, local), 3324 (`door_box`), 3325 (Lena's PC), all
  `test_access_networks`; 3326 (`store_controller`, `lab_physical_pentest`); 3331 (safe,
  `lab_tesseract_trials`). Headless shell with scrollbars shown (14 px, measured on the Places list).
  The drop box was taken and plugged in through `window.__test`; every Start, Lock, row and sign-in
  control was a real click, key press or touch. Scripts, logs and shots: scratch `ui-slice6-r4/`
  (`probe.mjs`, `touch.mjs`, `resize2.mjs`, `safe.mjs`, `out-*.txt`, `shots/`).

## R3 findings

| R3 | Status | Evidence |
|---|---|---|
| major 1 remote panel scrolls, Switch user and Sign out hidden | Fixed at the four review sizes; regression at other phone sizes, see major 1 below | Panel `scrollHeight - clientHeight` 0 at 390x844, 800x600, 915x412 and 1400x1000 on `door_box`, Lena's PC, `store_controller` and Sam's local panel; Lock, Switch user and Sign out inside the panel and the screen every time. |
| minor 1 locked remote sign-in scrolls 21 px | Fixed | Locked screen from the row: area overflow 0, no Captured strip, remote line, "Locked: <name>" banner, username filled, focus in the password field, at all four sizes on all three hosts. |
| nit 1 locked row stacks | Fixed | 1400x1000: badge and Sign in side by side on `door_box` and Lena's PC (row 54 px, was 98); stacked at 390, 800 and 915, and on `store_controller` at 1400 (its two-line name leaves no room). No overlap with the label, no page scroll sideways. |
| nit 2 focus ring | Left, as allowed | Unchanged. |

## The fixes, live

- Panel width. 340 CSS px at every size. At 390x844 the screen is 346 px, so the panel fits with
  3 px each side (`lena_pc-panel__390x844.png`). No horizontal overflow anywhere.
- Compact mode. Remote panels with three Places go compact on open at 915x412 and also at
  1400x1000 (x1 picture, no PC name line); at 390x844 and 800x600 they do not. `store_controller`
  (one Place) never goes compact. At 1400x1000 the Places list then shows all three entries.
- "More below". Shows only when Places runs on (915x412 on `door_box` and Lena's PC, 18 px). It is
  GNF 16 px in the heading colour with a 12 x 6 stepped clip-path arrow, sits on the Places
  heading's line, right of "PLACES" and left of the scrollbar, and overlaps neither the heading
  text, the list nor any entry (`crop-door-panel-915.png`). Pixel art.
- Keyboard. Start, Enter, then ArrowDown: Desktop, the share, then the third share scrolls the list
  to 18 and the cue hides, then Lock, Switch user, Sign out. ArrowUp back to Desktop scrolls to 0
  and the cue returns.
- Touch and wheel. In a touch context at 915x412 a finger swipe on Places scrolled it 0 to 18, the
  cue hid, the panel stayed open, and a tap on the revealed "Scanned-Inbox" opened that share. The
  mouse wheel also scrolls the list and leaves the panel itself at 0.
- Captured strip. The unlocked remote sign-in screen still shows it ("Captured sign-ins: none
  yet."), first time and again after Sign out, on all three hosts.
- Keyboard Lock then Sign in. Start, arrows to Lock, Enter: one lock request, the server record
  `locked: true`, "Locked. Sign in again to continue." Then Tab to the row's Sign in, Enter, type
  the password, Enter: back on the remote desktop and the server record has no `locked`. Same on
  Sam's PC locally (reopen, type, Enter).
- Password minigame on non-PC locks. The Special Collections safe opens the old password screen
  (no monitor, taskbar or sign-in parts), focus in the field, no overflow at 1400x1000 or 390x844,
  a wrong guess answers "Incorrect password. 4 attempts remaining." Every slice change in
  `password-minigame.js` and `unlock-system.js` is behind the sign-in or PC-session path.

## Findings

### major 1: on landscape phones the Places list spills over Lock, and a tap on Lock opens a share

`.pc-start-places` may shrink to nothing (`flex: 1 1 auto; min-height: 0`,
`css/pc-monitor.css:610-614`) while its list keeps `min-height: 40px` (`:616-621`). When the panel
is short, the section box ends above its own list, so the list hangs out into the actions section.
The section is `position: relative` (for the cue), so it paints and takes clicks above the static
actions. Measured on Lena's PC with three Places, fresh open, compact on:

| Viewport | List bottom vs Lock top | Hit at Lock | Actions all on show |
|---|---|---|---|
| 667x375 | 224 vs 204 | Ledger-Archive | yes, but Lock is overdrawn |
| 740x360 | 224 vs 190 | Desktop | yes, but Lock is overdrawn |
| 844x390 | 224 vs 220 | Lock (4 px overlap at its top) | yes |
| 568x320 | 224 vs 176 | Desktop | no: the panel scrolls 26 px |

`lena_pc-fresh-small__667x375.png` shows "Ledger-Archive" written over "Lock". The same happens at
915x412 when the panel was opened at 800x600 and the window then changed size (`hitAtLock`
Ledger-Archive, `crop-lena-resize-915.png`). The four review sizes all pass on a fresh open, which
is why the fix proof did not see it; 667x375 and 740x360 are ordinary phone landscape sizes.

Fix: do not let the Places section shrink below its heading plus the list's minimum (drop
`min-height: 0` from `.pc-start-places`, or give it `min-height: min-content`), so a panel that
truly cannot fit falls back to the panel scroller rather than overlapping; consider a one-row list
minimum (24 px) so 667x375 and 740x360 fit without it. A model test cannot see this; re-measure live
at 667x375, 740x360 and 844x390 with three Places (list bottom at or above the actions' top, and
`elementFromPoint` on Lock returns Lock).

### nit 1: compact mode and the panel picture are only worked out when the panel opens

`show()` decides compact (`utils/pc-taskbar.js:375-388`); the resize listener (`:344`) only
refreshes the cue. A panel opened large and then shrunk keeps the x2 picture on a short screen, so
Places drops to 40 px (Sam's panel 1400 to 915: second entry cut by 4 px, cue shown; Lena's 800 to
915: see major 1). A panel opened small and then enlarged keeps the x1 picture. Closing and opening
again puts it right. Optional once major 1 is fixed: re-run the compact check and `panelPicture()` on
resize while open.

### nit 2: two different "Locked" badges in one view

In the network view a host with a locked session and a share that needs an account both show the
same "Locked" padlock badge (`door_box-locked-row__1400x1000.png`). The share's line under it
explains itself; the host's does not, though its Sign in button beside it makes the meaning clear
enough. Not from the R3 fixes; noted for the wording pass.

## Verdict

Not ready to merge until major 1 is fixed. Every R3 finding is resolved at the four review sizes,
and the rest of the hunt came back clean: 340 px fits at 390, the cue is pixel art and hides
nothing, Places scrolls by keyboard, touch and wheel, the unlocked sign-in keeps its Captured
strip, the keyboard Lock and Sign in path works, and non-PC password locks are unchanged. Major 1
is a regression from the new flex layout: on common landscape phone sizes the Places list draws
over Lock and takes its taps. The fix is a one-line CSS change plus a live re-measure at the sizes
above.
