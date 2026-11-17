# UX slice 6 review, round 1: PC taskbar and start panel

Branch `build/ui-slice6`, tip 3b31e6903 (main 1ce7486c7). Reviewed against `UX_FEEDBACK_ROUND_PLAN.md`
"Slice 6" and section 3 option C, the UI design language and the pixel-art UI rule. Scope: the
taskbar and start panel on the desktop, share and file views; who shows (host, `desktopUser`, the
live session); E11; Places back to the desktop; Lock gating; the "Locked: <name>" banner.
Not reviewed: wallpapers, the server side of Lock, the "< Desktop" button.

## How it was checked

- Read the whole diff (`git diff main...HEAD`), the build log and the builder's shots and logs.
- Ran, without the lock: `pc-taskbar` (14), `pc-monitor-frame` (48), `container-transfer-dialog`
  (14), `access-remote-signin` (17), `container-shares` (43), `minigame-title-escape` (24),
  `engine-fixes-round6` (9), `escaping-shared-helpers` (21), `password-signin-mode` (64),
  `access-signin-postit` (8), `phone-intro-once-and-notepad-raw` (12). All pass.
- Live, own keyless server on :3461, a new `test_access_networks` game (3254), headless shell with
  scrollbars shown (measured 15 px). Document capture listeners counted through an instrumented
  `addEventListener`. Probe scripts and shots: scratch `ui-slice6-r1/` (`probe.mjs`,
  `probe-log.txt`, `shots/`).

## What holds

- Spoiler rule. `desktopUser` is read in one place only, `pcTaskbarModel`
  (`js/utils/pc-taskbar.js:77-92`): a PC with `lockType: 'login'` or a held session shows the
  session's account and never `desktopUser`; only a straight-to-desktop PC shows it. The password
  and sign-in screens do not import the module (grep: `desktopUser` appears in no other engine
  file), so it never reaches a lock screen. The new banner
  (`js/minigames/password/password-minigame.js:1438`) names the held session's own account.
- Frame. The monitor's rect is identical before and after, and across desktop, start panel,
  share, share panel, reader and reader panel, at 1400x1000, 800x600, 915x412 and 390x844 (my
  run for Sam's PC; the builder's logs for Kevin, Gary and Lena's remote desktop, which I compared
  line by line against the `before` logs).
- Overlaps (measured, all four sizes): no desktop icon under the taskbar or the description
  strip, no window tab over the account, the post-it clear of the chin button, every taskbar
  child inside the taskbar, the taskbar inside the screen. The panel stays inside the screen with
  no vertical or horizontal overflow at every size (915x412: 340x224 in a 310-high screen).
- Esc and focus. Start click focuses the first entry; Down and Up move and wrap; the first Esc
  closes the panel only and returns focus to Start; the second closes the PC. Same in the file
  reader. Enter on a focused Start opens the panel.
- Touch (390x844, `hasTouch`): a tap on Start opens; a tap on the wallpaper closes; a second tap
  on Start closes; a tap on a Place opens the share with the panel shut.
- View changes. Places to a share, Desktop from the share, Desktop from a file reader, and a
  desktop icon pressed with the panel open all land in the new view with the panel closed.
- Leaks. Document capture listeners: 0 at rest, 3 with the panel open, back to 0 after Esc,
  after five rounds of "panel open, then X", and after all the view changes above. The DOM
  listeners on Start and the panel die with the view; `cleanup()` calls `destroy()` in both
  minigames (`container-minigame.js:657`, `text-file-minigame.js:558`).
- Lock gating. `lockable` needs `lockSupported()` (both `lockingSupported()` true and
  `lockSession` a function) and `via === 'password'` and not guest (`pc-taskbar.js:94`, `108-112`);
  claimed and guest sessions get no Lock. Tested in `pc-taskbar.test.mjs` (hidden without
  `lockSession`, hidden for a claim, shown and called for a password session, refusal message).
- Remote and 2b0. The builder's game 3252 run signs in through Lena's captured tile and reaches
  her remote desktop with the taskbar ("Lena Fox", Remote, HB-FIN-02) and the panel ("Remote
  through Drop box: Comms room", two Places); I checked those shots and logs.
- Pixel-art rule. Every new border is 2px solid with square corners, fonts are GNF 16px, no
  radius, shadow or gradient (`css/pc-monitor.css:361-605`). The five new icons are true pixel
  art at native size (16x16 and 32x32, 3 to 5 colours, no part alpha) and are drawn at x1 in
  CSS pixels (whole-number device scale under the monitor's zoom). The headshot is 32px at x1 in
  the taskbar and x2 in the panel (x1 on short screens).
- Sync. Nothing new is sent or stored server side: headshot lookups and each desktop's Places
  live in two in-memory maps (`pc-taskbar.js:184`, `256`), bounded by accounts and PCs.
- Tests drive the real `ContainerMinigame`, `TextFileMinigame` and `PcSessions` in jsdom, not
  only the helpers. Copy lists: every harness that copies `container-minigame.js` into a temp
  folder now copies `utils/pc-taskbar.js`; the text-file reader loads it by dynamic import with a
  catch, so the reader-only harness (`phone-intro-once-and-notepad-raw`) is unaffected.

## Findings

No blockers. No majors.

### minor 1: Take Container is clipped at phone width

`js/utils/pc-taskbar.js:144` puts Take Container on the taskbar, and the taskbar is
`overflow: hidden; white-space: nowrap` (`css/pc-monitor.css:371-386`). Injected live into Sam's
taskbar as `pcTaskbarHtml` writes it, the button runs from x=244 to x=441 in a 342 px taskbar at
390x844: about half of it, and its label, is cut off. At 915x412 it fits only by squeezing the
account to 75 px. On main the button sat in its own row. I found no shipped scenario that opens a
takeable PC's desktop, so this is latent, but the plan keeps the button and the brief asks that
nothing is cut at 390.
Fix: under `.pc-monitor[data-narrow]` hide `.pc-taskbar-host` when the taskbar holds
`#take-container-btn` (the bezel names the PC), or move Take Container to the chin controls on a
narrow frame; add a taskbar-fit assertion for a takeable desktop at a narrow width.

### minor 2: Lock from a file reader closes the reader before asking

`js/minigames/text-file/text-file-minigame.js:209` runs `leaveFor(() => lockPcSession(pcId))`:
the reader completes first, then Lock is requested. If the server refuses (the panel's own
contract, build log "Lock: what the server must provide" item 2), the alert shows over the game
world and the reader is gone. The desktop's Lock (`container-minigame.js:1110`) does not close
anything itself and leaves that to `pc-sessions.js`.
Fix: call `m.lockPcSession(pcId)` without `leaveFor`, as the desktop does, and let the lock
branch's `lockSession` close the PC's views on success.

### minor 3: Switch user in a file reader can do nothing

`text-file-minigame.js:210` acts only when a desktop was remembered for this PC; otherwise the
panel closes and nothing happens, while the panel still lists Switch user (the model's actions do
not know about the missing desktop). `rememberDesktop` runs whenever a monitor desktop mounts, so
this needs a reader reached without that desktop this page load; I could not reach one live.
Fix: drop `switch` from `this.taskbarModel.actions` when `desktop` is null (and Desktop falls back
to the reader's own Close, which it already does).

### minor 4: Places labels do not line up

The Desktop entry uses a 16x16 icon and the shares the 26x18 folder (`pc-taskbar.js:38`,
`165-167`), and `.pc-start-item-icon` sets no box (`css/pc-monitor.css:402`), so share labels
start 10 px further right than "Desktop" (visible in `remote-start__800x600.png`).
Fix: give `.pc-start-item-icon` a fixed 26px-wide box with the image centred at x1 (no scaling),
or draw a 16x16 share icon for the panel.

### minor 5: head-crop fallback in a new place

`applyAccountPicture` (`pc-taskbar.js:227-252`) falls back to the talk sheet's head crop before
the silhouette. The design language says NPC identities show the authored headshot, "never a crop
of the talk image". The fallback is the shared one from slice 2c (R1 m8), so this slice inherits
it, but it now also reaches the taskbar and the panel at x2.
Fix: for the user to rule; if the rule holds, skip the crop here and go straight to the
silhouette (the missing-headshot log still records the key).

### minor 6: tests miss the reader's actions and the listener count

`test/js/pc-taskbar.test.mjs` covers the reader's Desktop and Esc but not its Lock, Switch user
or Sign out (`text-file-minigame.js:207-213`), and no test asserts that the document listeners
go back to zero after X with the panel open (the live probe shows they do).
Fix: one reader test per action (with the minor 2 and 3 behaviour), and a count of document
`keydown`/`pointerdown`/`mousedown` capture listeners after close.

### nit 1: Tab leaves the panel open

The panel is `role="menu"`, but Tab moves focus on past the last entry to the page while the
panel stays open (`pc-taskbar.js:311-330`; live: Tab from Desktop went to Scanned-Inbox, and on).
Fix: close on `focusout` when the new focus is outside the panel and Start.

### nit 2: a failed headshot lookup is kept for the session

`pc-taskbar.js:241-243` caches a null result, so one failed image request shows the silhouette for
that account until reload. Fine for authored files; noted only.

## Not proven live in this round

- A claimed session: no `test_access_sessions` mission is loaded in the dev database, so the
  claim path rests on `pc-taskbar.test.mjs` ("a claimed session"), which shows the owner on the
  taskbar and keeps the claim line at the top.
- Lock and the "Locked:" banner end to end: they wait on `build/ui-slice6-lock` (out of scope).
- My own remote run did not get past planting the drop box in the harness; the remote views
  above rest on the builder's 3252 shots and logs.

## Drawn icons for the user's look

New, drawn at native size (crops copied from the branch, unchanged):

| Icon | Size | Branch file | Crop |
|---|---|---|---|
| Start (three bars) | 16x16 | `public/break_escape/assets/icons/pc-start.png` | `ui-slice6-r1/icons/pc-start.png` |
| Desktop (monitor) | 16x16 | `public/break_escape/assets/icons/pc-desktop.png` | `ui-slice6-r1/icons/pc-desktop.png` |
| Switch user | 16x16 | `public/break_escape/assets/icons/pc-switch-user.png` | `ui-slice6-r1/icons/pc-switch-user.png` |
| Sign out | 16x16 | `public/break_escape/assets/icons/pc-sign-out.png` | `ui-slice6-r1/icons/pc-sign-out.png` |
| No headshot | 32x32 | `public/break_escape/assets/icons/pc-user-silhouette.png` | `ui-slice6-r1/icons/pc-user-silhouette.png` |

A contact sheet at x8 (nearest neighbour, for viewing only): `ui-slice6-r1/icons/sheet_x8.png`.
Reused, not new: `npc-lock.png` (Lock) and `m09_folder1.png` (share Places).
Scratch folder: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/`.

## Verdict

Ready to merge after minors 1 to 3 (each is a few lines); 4 to 6 and the nits can ride along
or wait. The frame does not move, nothing overlaps at the four sizes, Esc order and focus are
right, listeners are cleaned up, the spoiler rule holds, and nothing new is synced.
