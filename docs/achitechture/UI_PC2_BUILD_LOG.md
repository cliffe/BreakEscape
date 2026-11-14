# UI PC 2 build log

Branch `build/ui-pc2`, from main 61c033b13 (slice 6 PC taskbar, the Lock server, PC polish), with
main 372600713 (format hardening 8b and 8c) merged in before the report. Three of the user's picks
from the UI Fresh Look page (2026-11-14): E06 A, E08 B, N05 B.

## What changed

1. E06 A, one sign-in card (`minigames/password/password-minigame.js`, `css/password-minigame.css`).
   - On a PC's screen the sign-in form and its message line sit in one `.signin-card`: the chosen
     account (headshot or silhouette from `applySelectedHeadshot`, name, Change), the fields, Sign
     in and the message. One dark panel, one 2px border, the frame wrapping its content.
   - Nothing inside has a backing of its own any more: no chip behind the name or a label, no box
     round the message (plain coloured text under a 2px rule).
   - The plain password screen (`.pc-lock-panel`, e.g. Derek's Computer in m01) is the same card,
     its description a plain line at the top.
   - The card is hidden while it would be empty (`syncSignInCard`); the tiles and the remote
     screen's Captured sign-ins stay outside it (`placeCapturedBlock` anchors on the card).
   - Compact: max 320px (x2 on a big screen, 640px), 10px padding (8px compact, 6px 8px short),
     so a themed wallpaper (build/ui-art) still reads round it.
   - The old non-monitor frame (`.password-frame`) is unchanged.
2. E08 B, window X in the file reader (`minigames/text-file/text-file-minigame.js`,
   `css/text-file-minigame.css`, one line in `minigames/container/container-minigame.js`).
   - The reader's navy title bar has its own X (`.pc-window-close`, `#pc-file-close`): a raised
     grey square, 2px bevel, square corners, an 8x7 pixel cross drawn at x2, 28x24 drawn, a 44px
     touch target on phones and touch screens.
   - The window X and Esc close the file only (back to the desktop or folder, the existing
     `closeByPlayer` return).
   - The bezel X now closes the PC (`closePc`, `closeWholePc`): no return to the desktop. On a
     remote desktop's file the network trip lands as that desktop's own close would
     (`networkLinks.landed(kind, 'close')`; `window.networkScreenKind` exposed for this).
3. N05 B, planted box opens the view (`systems/network-links.js`,
   `minigames/network-view/network-view-minigame.js`, `css/network-view-minigame.css`).
   - A click on a jack with the player's box in it opens that box's network view at once (no
     "Open it from your inventory" prompt, no Unplug it / Leave it confirm).
   - The view has an Unplug button under its header lines (`[data-unplug]`, the row buttons'
     size). It shows from the start, even if the link does not answer.
   - Unplug calls `networkLinks.unplugFromView(jackId)`, which is the same server path as before
     (POST /network/unplug through `unplug()`), allowed only for the jack the trip was opened at.
     On success the view closes with reason `unplugged` (a new LANDINGS.view entry: back to the
     world, no toast); a refusal keeps the view open with the button back.
   - A view opened from the inventory, or reopened after a sign-in on another trip, has no Unplug;
     one reopened on the same jack trip keeps it.
   - `LEAVE_LABEL` is gone; `UNPLUG_LABEL` is now 'Unplug'.
   - test_access_networks: sign P10 and PLAYTEST.md steps 6 and 7 describe the view. Validator: 0 errors.

## Tests (named files, no suites)

- New: network-links (5 N05 tests replace the 2 prompt tests), network-view (+6),
  pc-monitor-frame (+2 E06, +2 E08; one old label-slab assertion reversed for the card).
- Run green after the merge of main: network-links 69, network-view 57, pc-monitor-frame 57,
  password-signin-mode 64, access-remote-signin 17, network-links-routing 4,
  objectives-network-footholds 8, test-bridge-access 15, container-shares 43, pc-taskbar 30,
  minigame-title-escape 24, escaping-shared-helpers 21, access-signin-routing 23,
  container-transfer-dialog 14, validator-network-model 64. Before the merge also every other
  file importing a changed module (password, text-file, container importers), all green.

## Live proof

Keyless server on :3447. Scrollbars shown. Shots and scripts in the scratchpad folder `ui-pc2`
(`shots/after-*`, `proof.mjs`, `lib.mjs`, `mkgames.sh`, `games.txt`). Sizes 390x844, 360x640,
1400x900 and 844x390.

- E06: Sam's PC (test_access_networks desk_room) chosen tile and wrong password; Derek's Computer
  (m01) lock and wrong password. Every child inside the card's box, no sideways scroll, no
  scroll inside the screen.
- E08: scan_0412.pdf from the Scanned-Inbox share. Window X back to the folder, Esc back to the
  folder, bezel X from the reader closes the PC (no minigame open after).
- N05: see the section below.

## Not done / notes

- The share folder window on the PC has the same idiom question (no window X; the bezel X
  goes to the world or its parent). Not changed: not in the pick.
- No full suites (the merge batch runs them).

## Handover

Built and committed; see the final report for the tip hash.
