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
- `pc-sessions.js` and `game.js`: `pcSessions.lockSupported`, from the scenario answer's
  `sessionLock: true`. Lock shows only when that is true and `pcSessions.lock` exists; neither
  exists yet, so Lock is hidden.
- Art (drawn at native size, pixel by pixel): `pc-start.png`, `pc-desktop.png`,
  `pc-switch-user.png`, `pc-sign-out.png` (16x16), `pc-user-silhouette.png` (32x32). Lock uses the
  existing `npc-lock.png`; shares use the share folder icon.
- CSS in `css/pc-monitor.css`: 2px borders, square corners, GNF 16px, pictures at whole scales;
  the taskbar is 38px tall; on a narrow screen the account shows as its headshot only.
- The bezel and chin sizing (`utils/pc-monitor.js`) is unchanged: the frame is the same size
  before and after at each window size (measured in the live shots).

## Lock: what the server must provide

1. The scenario answer carries `sessionLock: true` at the top level once the server supports it
   (the client passes it to `pcSessions.load`).
2. A request to lock the player's held session on a PC (for example `POST /lock_session`
   with `pc_id`), answering the session entry with `locked: true`. One boolean on a held
   session, bounded by the number of sign-in PCs; the client reads it and never sends it back.
3. The sessions in the scenario answer carry `locked: true` for a locked one, so a reload
   keeps it.
4. While locked, `GET /container/<pc>` refuses the desktop with a distinct answer (403 with
   `locked: true`, not `no_session`), so the client shows the sign-in screen for that account.
5. `POST /login` on a locked PC: the same account with the right password unlocks it (clears the
   flag, keeps `via`, the foothold and `signedInPcs`); another account replaces it as Switch user
   does; wrong passwords count toward the lockout as now.
6. A remote session locks the same way and keeps its foothold.
7. Decision needed: Lock on a claimed session (someone else's open screen). Suggest it ends the
   claim, as the screen's own auto lock does, rather than leaving a locked claim.

Client work once the server lands: `pcSessions.lock(pcId)` (the request, the local `locked`
flag, close the PC's open views with "Screen locked"), `load()` keeps `locked`, and the sign-in
screen preselects the locked account and asks only for its password.

## Merge with main 1ce7486c7 (slice 2b0)

Fast-forward of main into the branch before any slice 6 commit: no conflicts. 2b0's captured
sign-in tiles on the remote sign-in screen are untouched by this slice; the live proof signs in
to Lena's PC through her captured tile and checks the taskbar on that remote desktop.

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
- Run: every test file that imports a changed module (198 files), all pass.

## Live proof

Keyless server on :3460, games 3232 (m01), 3233 (test_access_networks), 3234 (m02), at 1400x1000,
800x600, 915x412 and 390x844 with scrollbars shown. Shots before (main) and after in
the scratch folder `ui-slice6/shots/before` and `ui-slice6/shots/after`.

(Results below.)

## Handover

(Filled in at the end of the build.)
