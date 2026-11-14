# UX slice 6 review, round 3: taskbar and start panel with the server Lock

Branch `build/ui-slice6`, tip 297421c24: the R2 fixes (ba6240f95) and the merge of main 48b755b81
(d69f27281, bark hold drain in `bark-release-policy.js` and `npc-barks.js`). Reviewed against
`UX_SLICE6_REVIEW_R2.md`, the build log's "review round 2 fixes" section, the UI design language
and the pixel-art UI rule. No code was changed.

## How it was checked

- Read the R2 fix diff (`b7ccdccfe..ba6240f95`) and the merged bark changes.
- Tests, without the lock: `pc-taskbar` 22, `pc-sessions` 43, `pc-monitor-frame` 49,
  `network-view` 45, `workstation-state` 55, all pass (214). Bark files touched by the merge:
  `bark-release-policy` 30 and `bark-lifetime` 7, pass. Rails `access_model_login`,
  `network_pivot`, `network_remote_signin`: 76 runs, 745 assertions, 0 failures, 0 errors.
- Live: own keyless server on :3470 (stopped by PID). Games from `swap-scenario-game.rb
  --unlock-all`: 3293, 3294 and 3295 (`test_access_networks`), 3296 (`lab_physical_pentest`).
  Headless shell with scrollbars shown (14 px). The drop box was taken and plugged in through
  `window.__test`; every network-view, Start, Lock and sign-in control was a real click or key
  press on the page. Scripts, log and shots: scratch `ui-slice6-r3/` (`remote.mjs`, `local.mjs`,
  `screens.mjs`, `probe-log.txt`, `out-*.txt`, `shots/`).
- `lab_physical_pentest` has no `door_box`; its headless door controller is `store_controller`
  (LW-DOOR01), so that was the host used there. `door_box` was run in `test_access_networks`.

## R2 findings

| R2 | Status | Evidence |
|---|---|---|
| blocker 1 locked remote session stranded | Fixed, live on three hosts | See "Locked remote rows, live" below. |
| major 1 stale taskbar test | Fixed | `pc-taskbar.test.mjs:271-276` sets `lockSession = undefined`, opens the panel, asserts it is open and has no Lock; 22 of 22 pass. It still tests a server that reports locking with a client that cannot ask. |
| minor 1 panel scrolls 4 px at 1400x1000 | Fixed for the local panel only | Sam's PC: `scrollHeight - clientHeight` 0. Remote panels still scroll, by more: see major 1. |
| minor 2 reader Lock closes silently | Fixed, live | Lock from a file reader on Sam's PC: request and 200 answer with the reader open, then the reader closed and the alerts list ended with "Locked. Sign in again to continue." (one new entry after a fresh page load). |
| minor 3 panel uses its own Lock rule | Fixed, live | `pc-taskbar.js:94-96` uses `canLock` when given; the desktop (`container-minigame.js:1084`) and the reader (`text-file-minigame.js:190`) pass `pcSessions.canLock(pcId)`. Live: with `canLock` forced to return false on a password session, the panel listed only Switch user and Sign out. A claim-marked record in the real `pcSessions.sessions` map also hid Lock (`canLock` false). |
| nit 1 sprite ignores the player's own lock | Left, as allowed | Unchanged. |

The fixer's own claim probe (`ui-slice6-fix2/local.mjs:121`) changed the copy that
`pcSessions.get()` returns (`pc-sessions.js:237-240`), so its "claim-marked actions [lock ...]
canLock true" line proves nothing either way; the probe above used the map record.

## Locked remote rows, live

Each host: signed in through the drop box's row, Start, Lock (one `POST /lock_session`, the
server record `locked: true`, toast shown), view reopened, row Sign in, wrong password, right
password.

| Host | Row after Lock | Locked sign-in from the row | Wrong | Right |
|---|---|---|---|---|
| `door_box` HB-DOOR-01 (headless) | "Locked" badge + Sign in, no Open | Banner "Locked: Ian Shaw. Enter the password to unlock", username `ishaw` filled, focus in the password field, "Remote sign-in through Drop box: Comms room" | "Incorrect username or password."; server still `locked: true` | Remote desktop, server record has no `locked` |
| `lena_pc` HB-FIN-02 | same | same for Lena Fox (`lfox`) | same | same |
| `store_controller` LW-DOOR01 (headless) | same | same for Chris Hampshire (`c.hampshire`), "through Drop box: comms cupboard" | same | same |

- Keyboard: Tab from the view's start reaches the locked row's Sign in after the HUD's Objectives
  toggle, the view's X and the rows above it, in reading order; Enter on it opened the locked
  sign-in screen in all three runs (the sign-ins above were made that way, not by click).
- Row versus world. A headless host walked up to in the world still shows its observations only
  ("A door controller with no screen or keyboard. It is managed over the network."), so the row is
  the only way back and now works. Lena's PC, locked remotely and then opened at her desk, shows
  the same "Locked: Lena Fox" banner and filled username in the same monitor rect, without the
  remote line; the right password there turns the session into a local one (`via: password`, no
  `remote`), which is the ordinary local sign-in.
- Layout of the locked row at 1400x1000, 800x600 and 390x844: no horizontal page scroll, badge
  and button inside the row, no overlap between the badge, the button and the host name or
  description ink (crops `crop-store-390.png`, `crop-store-800.png`). The badge sits over the
  button in the control column, so a locked row is 98 px tall where others are 54; at two columns
  its neighbour in the same grid row stretches to match. "Door-entry controller" wraps to two lines
  at 390 and 800, as an unlocked row's description would.
- Pixel art: the Sign in button is the shared theme button (9-slice `border-image`, GNF 16 px, no
  radius or shadow); the badge is 2 px solid, square, GNF 18 px; the padlock is 32 px at its own
  size, `image-rendering: pixelated`.

## Merge with main (barks)

Read: the drain now lasts until the last held bark's voice ends and goes round again for barks
that joined late (`npc-barks.js:266-279`). The view hands over to the sign-in screen and the
desktop to the view inside one tick, as before, so a held bark still waits for the last of them
to close. Keyless runs have no voices, so the new voice wait resolved at once; no bark showed over
any slice 6 screen in these runs, and nothing in the slice reads `isDrainingDeferred`. No finding.

## Findings

### major 1: the start panel still scrolls on a remote desktop at 1400x1000, hiding Switch user and Sign out

R2 minor 1 was fixed and measured on Sam's local panel only. On a remote desktop the panel also
carries the "Remote through <link>" line (`pc-taskbar.js:173`, two lines at this width) and the
share Places, and it overflows: `scrollHeight - clientHeight` was 54 px on `door_box` and
`lena_pc` and 6 px on `store_controller` (`out-door.txt`, `out-lena.txt`, `out-store.txt`; shot
`door_box-remote-panel__1400x1000.png`). With 54 px, Lock is the last entry on show; Switch user
and Sign out are below the fold with a pixel scrollbar but no "More below" cue, which the design
language asks for. Sign out is how a player ends a remote session, and this is the main desktop
size. The cause is the panel sizing itself: one scroller (`css/pc-monitor.css:541-551`,
`max-height: calc(100% - 38px); overflow-y: auto`) over every section.

Fix: make `.pc-start-panel` a flex column where the account header, This PC and the actions
section are `flex: none` and only the Places section scrolls (`.pixel-scroll` with the shared
"More below" cue), so Lock, Switch user and Sign out are always on show; or shorten the remote
line to one line ("Via <link>"). Re-measure live on a remote desktop with two Places at 1400x1000
and 800x600. The CSS-number test added for R2 m1 (`pc-monitor-frame.test.mjs:1268`) cannot
see this; a model test that the actions section is outside the scroller would.

### minor 1: the locked remote sign-in screen scrolls by 21 px at 1400x1000

The R2 fix opened a new view: the remote sign-in screen with a held, locked session. It stacks
the remote line, the "Locked" banner, the form and the Captured sign-ins strip, and at 1400x1000
the screen area (`pc-monitor-area pixel-scroll`) overflows by 21 px and opens scrolled by 19 px to
keep the password field in view, so the remote line sits clipped against the top of the screen
(`lena_pc-row-locked-signin__1400x1000.png`; `screens.mjs` output). The same screen unlocked
(Sam's PC) and the locked one at 800x600 and 390x844 do not scroll. No "More below" or "more
above" cue shows.

Fix: on a locked screen (`preselect` set from a held locked session,
`unlock-system.js:677-678`), leave out the Captured sign-ins strip, which has no use when the
account is already chosen (`password-minigame.js:1614`), or merge the remote line into the
locked banner ("Locked: Lena Fox, through Drop box: Comms room") at `password-minigame.js:1448-1452`.
Measure live at 1400x1000.

### nit 1: the locked row could keep the row height at wide sizes

At 1400x1000 a row is 477 px wide; icon, label, badge and button fit side by side (about 420 px),
so the stacked control doubles the row (and its grid neighbour) for no gain. Optional: lay the
control out in a row when it fits (`.network-row-control` is a column,
`css/network-view-minigame.css:255-262`); keep the stack for one-column widths.

### nit 2: the focus ring on row buttons is the browser's `outline: auto`

Tab focus on the Sign in button draws Chrome's default ring (`outline: auto 1px`), which is not a
2 px square pixel border. It is the same for every `.minigame-button` in the game, so not from
this slice; noted for the pixel-art sweep.

## Verdict

Ready to merge once major 1 is fixed. Every R2 finding is resolved, with blocker 1 proven live on
all three hosts (row Sign in, locked banner and filled account, wrong password refused, right
password back to the remote desktop, keyboard reach), the claim and `canLock` wiring proven with
the real map, and the reader Lock toast shown. The main merge's bark changes do not touch these
views. Major 1 is the R2 panel-overflow finding on the case R2 did not measure, now hiding Sign
out on remote desktops; minor 1 can ride with it.
