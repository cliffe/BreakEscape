# UX slice 6 build log: PC taskbar and start panel

Branch `build/ui-slice6`, from main 6b2344e20, merged with main 1ce7486c7 (slice 2b0) on 2026-11-13.
Plan: `UX_FEEDBACK_ROUND_PLAN.md`, "Slice 6" and section 3 option C (user pick q93); field names q94.

Not in this build: wallpapers (wait on the user, q95), the server side of Lock (waits on a
coordination answer), the "< Desktop" toolbar button (E08, being asked separately).

## What is built

- `js/utils/pc-taskbar.js` (new): the taskbar and start panel for every view of a PC in the
  monitor frame, one module.
  - Taskbar along the bottom of the screen: Start, the open window's name (share or file),
    the account (32px headshot at x1 and name), "Remote" for a remote session, the computer
    name, and Take Container where the container is takeable.
  - Start panel (option C): the account (64px, the 32px headshot at x2, name, username), This PC
    (computer name, PC name, "Remote through <link>"), Places (Desktop and the shares mapped on
    the desktop), then Lock (hidden, see below), Switch user and Sign out. Entries carry pixel
    icons.
  - Keyboard: Start is a button; opening focuses the first entry; Up and Down move between
    entries; Esc closes the panel and returns focus to Start, and only a second Esc reaches the
    minigame's own close. A press outside the panel closes it. The X on the bezel closes the PC.
  - Who shows (q94, agreed with the data owner): a sign-in PC shows its live session's account
    and never `desktopUser`; a PC that opens straight to the desktop shows `desktopUser` when set,
    else no account. The password and sign-in screens are untouched, so `desktopUser` never shows
    on a lock screen.
  - Computer name: a remote session's host label, else the PC's `host`, else its `name`.
  - Headshots: the authored `<key>_headshot.png`, else the talk sheet's head crop (the existing
    fallback), else a pixel silhouette (`assets/icons/pc-user-silhouette.png`). One lookup per
    account, kept in memory; nothing synced.
  - Places for the share and file views come from the desktop's contents, kept in memory per PC
    (`rememberDesktop`), bounded by the number of PCs.
- `container-minigame.js`: the monitor desktop drops its top account bar. The account is on the
  taskbar; the remote and claim lines stay in a top strip (a borrowed session is never hidden);
  the description moves to a strip above the taskbar (`.pc-desktop-status`, same wrapping and
  scrolling rules). A share window opened from a desktop gets the taskbar too (E11: the account
  stays in view) and its Desktop place goes back as its own Close does. Switch user is one method
  (`switchUser`) for the old button and the panel. `getTestState().taskbar` reports host,
  account, panel state, places and actions.
- `text-file-minigame.js`: a file read in the PC monitor gets the taskbar under its window
  (loaded with a dynamic import, as the note's drag is). Desktop reopens the desktop, a share
  opens the share, and Switch user / Sign out / Lock act as on the desktop; none of these reopen
  what the file came from.
- `npc-headshot.js`: `applyHeadshotBox` takes `onResult` (what was drawn, or null) so the taskbar
  can keep the lookup; the headshot key is set before it reports.
- Lock (coded against the lock branch's API, `build/ui-slice6-lock`, not yet merged here): the
  panel shows Lock only when `pcSessions.lockingSupported()` is true, `pcSessions.lockSession`
  exists, and the held session came from a password sign-in (integration ruling: claimed and
  guest sessions are hidden, since the server refuses them with a 422). A refusal shows its
  message. This branch leaves `pc-sessions.js` and `game.js` alone so the lock branch merges
  cleanly (checked with `git merge-tree`: no conflicts).
- `password-minigame.js`: a locked session's sign-in banner reads "Locked: <name>. Enter the
  password to unlock" instead of "Signed in now: <name> (<username>)" (integration ruling; reads
  `current.locked` from the lock branch's session entry).
- Art (drawn at native size, pixel by pixel): `pc-start.png`, `pc-desktop.png`,
  `pc-switch-user.png`, `pc-sign-out.png` (16x16), `pc-user-silhouette.png` (32x32). Lock uses the
  existing `npc-lock.png`; shares use the share folder icon.
- CSS in `css/pc-monitor.css`: 2px borders, square corners, GNF 16px, pictures at whole scales;
  the taskbar is 38px tall; on a narrow screen the account shows as its headshot only. On a
  short screen (915x412) the panel draws the headshot at x1, is 340px wide, leaves the PC name
  to the bezel's top strip and drops the entries' padding, so it fits without scrolling
  (measured: no overflow in any shot).
- The bezel and chin sizing (`utils/pc-monitor.js`) is unchanged: the frame is the same size
  before and after at each window size (measured in the live shots).

## Lock: what the server must provide

Built separately on `build/ui-slice6-lock` (`lockSession`, `isLocked`, `lockingSupported`). What
this panel relies on:

1. `pcSessions.lockingSupported()` true once the scenario answer reports that the server
   supports locking.
2. `pcSessions.lockSession(pcId)` resolving `{ ok: true }`, or `{ ok: false, message }` on a
   refusal (the panel shows the message); it closes the PC's open views itself.
3. The server refuses Lock on a claimed or guest session (422); the panel already hides it there.
4. `pcSessions.get(pcId).locked === true` for a locked session (the sign-in banner wording), and
   the open flow sends a locked session to the sign-in screen with the account pre-chosen.
5. The locked flag is one boolean per held session, bounded by the sign-in PCs; the client never
   sends it back.

## Merge with main 1ce7486c7 (slice 2b0)

Fast-forward of main into the branch before any slice 6 commit: no conflicts. 2b0's captured
sign-in tiles on the remote sign-in screen are untouched by this slice. Live proof: game 3252
(created after the merge, so it has the capture cards), Lena's capture card read, then the remote
sign-in screen through the drop box shows her captured tile; signing in through it reaches her
remote desktop with the taskbar (Lena Fox, Remote, HB-FIN-02) and the panel (Remote through
Drop box: Comms room; Places Ledger-Archive and Scanned-Inbox).

## Tests

- New `test/js/pc-taskbar.test.mjs` (14): who shows (session, no session, desktopUser, claimed,
  lock), the computer name, a signed-in desktop with panel sections, focus and arrow keys and a
  Place, a claimed session, a remote desktop, no sign-in and no desktopUser, desktopUser with its
  headshot, the missing-headshot silhouette at x1 and x2 with one cached lookup, Take Container
  on the taskbar, Esc order (panel first, then PC), a press outside, the X, Lock hidden until
  supported, a share window (E11, Desktop back), a file reader (taskbar, Esc, Desktop reopens the
  desktop), and no taskbar on a share opened from the network view.
- Updated: `container-transfer-dialog`, `access-remote-signin` (Switch user and Sign out through
  the panel), `pc-monitor-frame` (headshot in the taskbar and panel; the description strip),
  `container-shares` (copy list).
- Lock (ruling): shown for a password session when supported; hidden without `lockSession`,
  for a claimed session; a refusal's message shown. The locked banner wording is tested in
  `pc-monitor-frame`.
- Run: every test file that imports a changed module, plus the password minigame's importers
  (210 files), all pass. No Ruby changed.

## Live proof

Keyless server on :3460; games 3232 (m01), 3233 and 3252 (test_access_networks), 3234 (m02); at
1400x1000, 800x600, 915x412 and 390x844, scrollbars shown (Playwright without
`--hide-scrollbars`). Shots in the scratch folder `ui-slice6/shots/before` (main 6b2344e20) and
`ui-slice6/shots/after` (this branch), with `log.txt` measurements.

- m01 Kevin's Workstation (password, then straight to the desktop): taskbar "Kevin Park",
  KEVIN-WS, his authored headshot; the panel; a file opened from the desktop keeps the taskbar.
- test_access_networks Sam's PC (sign-in): desktop, panel, the Scanned-Inbox share window and
  a file from it, each with the taskbar and panel (E11).
- Remote: Lena's PC through the drop box and her 2b0 captured tile, desktop, panel, a mapped share.
- m02 Gary's Workstation (password): "Gary Whitlock", IT-ADM-01.
- The monitor frame is the same size and place before and after at every size, and the same from
  the sign-in screen to the desktop (measured).
- Harness note: at 390x844 the tray's link item did not open the network view in the script, so
  the 390 remote shots open Lena's held session with `openRemoteDesktop` (the call the view's
  Open makes); the 2b0 tile sign-in itself was shot at 1400x1000 and 800x600.

## Handover

- Done: taskbar and start panel on desktop, share and file views; who-shows rules; silhouette;
  Esc order; Lock behind the lock branch's API with the password-only ruling; locked banner
  wording; tests; live proof at four sizes.
- Open: wallpapers (q95); E08 "< Desktop" button (not added, by instruction); merging
  `build/ui-slice6-lock` (merges clean today) and a live Lock proof once it is in.
- For the user: the five new icons are drawn by hand at 16x16 and 32x32 (Start is three bars,
  no brand logo); swap them if wanted. On a short screen the panel leaves out the PC name
  (the bezel shows it).
- Files: `js/utils/pc-taskbar.js` (new), `container-minigame.js`, `text-file-minigame.js`,
  `password-minigame.js`, `npc-headshot.js`, `css/pc-monitor.css`, five icons, tests
  `pc-taskbar` (new), `pc-monitor-frame`, `container-transfer-dialog`, `access-remote-signin`,
  `container-shares`.
- Gotcha: a game created before a scenario change keeps its old scenario (game 3233 had no
  capture cards); make a new game for a scenario that changed.

## 2026-11-13: review round 1 fixes

All six minors and both nits from `UX_SLICE6_REVIEW_R1.md`. Live proof on a keyless server (:3462)
with the test_access_networks scenario swapped into a game (`tools/playtest/swap-scenario-game.rb`,
copy in the scratch folder, with an added takeable "Spare PC"; no mission edited), at 1400x1000
and 390x844, scrollbars shown. Lock is not merged here, so the live Lock proofs stub
`pcSessions.lockingSupported` and `lockSession` in the page.

- m1 Take Container cut off at 390: fixed. The button has an `aria-label` "Take Container", reads
  "Take" on a narrow screen, and the taskbar drops the computer name there (the bezel names the
  PC). Measured at 390: taskbar 342 px, button 259 to 338, nothing cut. At 1400 the full label fits.
- m2 Lock from a reader: fixed. `lockPcSession` takes `onRefuse`; the reader asks the server and
  stays open, says a refusal on its own message line, and closes only on success. The desktop
  shows a refusal as a line above the taskbar inside the screen (`.pc-taskbar-notice`), not as an
  alert over the game world. Both seen live at both sizes.
- m3 Switch user in a reader: fixed by hiding it. `pcTaskbarModel` takes `canSwitch`; a reader
  or share with no desktop to return to does not list it. Live: reader with no remembered desktop
  lists Lock and Sign out only; with one it lists Switch user too.
- m4 Places labels: fixed. `.pc-start-item-icon` is a fixed 26x18 box, image centred at its own
  size (`object-fit: none`). Measured: Desktop and Scanned-Inbox labels start at the same x.
- m5 head-crop fallback: removed. `applyHeadshotBox` no longer takes a talk image or crops; no
  authored `<key>_headshot.png` means the box is hidden and the caller draws the pixel
  silhouette (taskbar, panel, and now the sign-in screen's selected account in
  `password-minigame.js`). The talk image is not even requested (tested). Not changed: the
  sign-in tiles' own talk-sheet crop in `applyTilePortrait` (slice 2c, on main, with its own
  tests); the user may want that ruled on too.
- m6 tests: added a reader test each for Lock (refusal, success, order), Switch user (hidden, and
  opens the sign-in screen) and Sign out, and a count of document capture listeners (none at rest,
  three with the panel open, none after shut, Esc x5, the X, and a reader's cleanup).
- nit 1 Tab leaves the panel open: fixed. Focus moving out of the panel and Start closes it.
  Live: five Tabs from the first entry end with the panel shut.
- nit 2 failed lookup cached: left as is. A missing file and a failed request look the same, and
  the file is authored, so one lookup per account stays.

Tests: `pc-taskbar` 22 (was 14), `pc-monitor-frame` 48; 27 test files that import a changed module
(434 tests) all pass. Files: `pc-taskbar.js`, `npc-headshot.js`, `password-minigame.js`,
`container-minigame.js`, `text-file-minigame.js`, `css/pc-monitor.css`, `pc-taskbar.test.mjs`,
`pc-monitor-frame.test.mjs`.

## 2026-11-13: review round 2 fixes

Every finding of `UX_SLICE6_REVIEW_R2.md`. Live proof on a keyless server (:3464, stopped by PID),
games made with `tools/playtest/swap-scenario-game.rb`, 1400x1000, scrollbars shown. Scripts and
shots are in the scratch folder `ui-slice6-fix2/`.

- Blocker 1, a locked remote session was stranded: fixed by the preferred route. A locked host
  row in the network view keeps its padlock "Locked" badge and gains a "Sign in" button
  (`data-action="sign-in"`); it opens the remote sign-in screen, exactly as a locked local PC opens
  its own. That screen now passes `preselect` (the held session's username) as the local screen
  does, so the "Locked: <name>" banner shows and the account is pre-filled. Unlock is the ordinary
  POST /login; no new server route. Lock stays on remote sessions. Live, each through the drop box:
  `door_box` (test_access_networks, headless), Lena's PC (captured card read first) and
  `store_controller` (lab_physical_pentest, headless). Each one: Lock, the row reads "Locked" plus
  Sign in, the sign-in screen shows the locked banner with the account filled, a wrong password
  gives "Incorrect username or password." and keeps the screen, the right password returns to the
  remote desktop and the server record has no `locked`.
- Major 1, stale taskbar test: the first half of the Lock test now sets `lockSession` to
  undefined on the sessions object, opens the panel and checks it is open with no Lock entry, so it
  still tests a server that reports locking with a client that cannot ask. `pc-taskbar` 22 of 22.
- Minor 1, 4 px panel overflow at 1400x1000: entries take 1 px vertical padding (was 2 px), which
  pays for the 18 px icon box. Live: panel `scrollHeight - clientHeight` is 0. No layout in the
  test harness, so `pc-monitor-frame.test.mjs` pins the two numbers (padding and icon height).
- Minor 2, Lock from a reader closed silently: after a successful lock the reader takes the parked
  message from `pcSessions.takeEndedMessage` and shows it as the toast, then closes. Live: the
  alerts list ends with "Locked. Sign in again to continue." after the reader Lock.
- Minor 3, own Lock rule: `pcTaskbarModel` takes `canLock` (passed from `pcSessions.canLock(pcId)`
  by the desktop and the reader) and uses it for the Lock entry, keeping `lockSupported` as the
  gate and the guest exclusion. With no `canLock` supplied it falls back to the old password test,
  so direct model calls and tests are unchanged.
- Nit 1, the PC sprite does not show the player's own lock: left, as the review marks it optional
  polish.

New test: `network-view` "a locked remote session shows a Locked badge and a Sign in control, not
Open" (also clicks it and checks the sign-in screen opens for `lena_pc`). Counts: `pc-taskbar` 22,
`pc-sessions` 43, `pc-monitor-frame` 49, `network-view` 45, `workstation-state` 55, bark tests 173
(10 files), all pass; Rails `access_model_login`, `network_pivot`, `network_remote_signin` 76 runs,
745 assertions, 0 failures.

Merge of main (48b755b81, train 34: bark hold drain in `bark-release-policy.js` and `npc-barks.js`,
plus `sis01_healthcare` and docs): clean, no conflicts, merge commit only.

Files: `network-view-minigame.js`, `unlock-system.js`, `pc-taskbar.js`, `container-minigame.js`,
`text-file-minigame.js`, `css/pc-monitor.css`, tests `network-view`, `pc-taskbar`, `pc-monitor-frame`.
