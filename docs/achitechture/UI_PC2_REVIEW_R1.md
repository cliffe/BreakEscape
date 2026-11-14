# UI PC 2 review, round 1

Branch `build/ui-pc2`, tip 900323876, diffed against main 372600713. Picks E06 A (one sign-in
card), E08 B (window X in the file reader's title bar), N05 B (planted box opens the view, Unplug
inside it).

Counts: **B 0, M 2, m 5, n 5.** M2 is older than this branch (main, slice 6) and is reported
here because the coordinator asked about it.

## How it was checked

- Keyless server on :3447 (stopped by PID afterwards). Fresh games only (new-game.rb, 3632 to
  3700). Scrollbars shown. Real clicks (Playwright) on tiles, Change, Sign in, Lock, the share,
  Open, the window X, the bezel X, Unplug and the network view's rows; world clicks through
  `__test.interact`. Sizes 390x844, 360x640, 844x390, 667x375, 1400x900 and 915x412 (the
  height budget the E06 critique named).
- Covered: Sam's PC (tiles, chosen, wrong, Change back, Lock then the locked screen, locked and
  wrong, unlock), Derek's Computer in m01 (plain password, wrong), the remote sign-in from the
  drop box's view (typed form, Captured sign-ins), the file reader on a local desktop and on a
  remote desktop (window X, Esc, bezel X), N05 (first view after the plant, jack click, X with no
  request, Unplug refused through a 403 route, Unplug for real, plant again, inventory path, a
  jack trip through a remote desktop and back, the box already planted when the game loads).
- Shots and logs: scratchpad folder `ui-pc2-r1` (`shots/r1-*`, `log.txt`, `run-*.log`,
  `proof.mjs`, `reload.mjs`). One gap: Derek at 360x640 timed out on load under machine load;
  the builder's shot covers that size.
- Named node tests, one file at a time, all green: network-links 69, network-view 57,
  pc-monitor-frame 57, password-signin-mode 64, access-remote-signin 17, network-links-routing 4,
  pc-taskbar 30, minigame-title-escape 24, container-shares 43, test-bridge-access 15,
  objectives-network-footholds 8, access-signin-routing 23, container-transfer-dialog 14.
- Validator on test_access_networks: 0 ❌.
- `ui-rules-audit.mjs --strict --scenes password,text-file,network-view,container` at the five
  sizes: 0 fit breaches; exit 1 only because network-view does not open with a title-only start
  (it needs a held foothold). The live run above covers it.
- `shell-x-check.mjs` on the same scenes and sizes: 15 checked, 0 failed (network-view not
  opened, as above).

## What works

- E06: on every PC type the form, Sign in and the message sit in one 2px card, nothing inside
  sticks out of it (no child outside the card's box at any size), no sideways scroll. The
  selected account shows `male_office_worker_v2_headshot.png` for Sam at every size. 915x412 and
  667x375 fit with the tiles folded.
- E08: the window X and Esc return to the share folder; Esc from the share goes to the desktop;
  the bezel X from the reader closes the PC with nothing left pending
  (`pendingContainerReturn` null), and the PC opens again normally. On a remote desktop the
  window X returns to the share and the bezel X lands in the drop box's view, which keeps
  Unplug because the trip started at the jack.
- N05: a planted jack opens the view at once with Unplug (no confirm). The X sends no request.
  A 403 keeps the view open, the button comes back, the toast says why. Unplug returns the box to
  the tray, the link item goes, the trip ends, and the world shows. A box planted before the page
  loaded behaves the same.

## Major

**M1. The tile screen always shows the card, holding only "Choose an account."**
`password-minigame.js:1659` sets the prompt whenever no account is chosen, and `syncSignInCard`
(`password-minigame.js:1798-1803`) shows the card whenever the message line has text. So the card
is never hidden on a real tile screen: at 1400x900 it is a 640x84 framed panel under the tiles
(`r1-sam-1-tiles__1400x900.png`), at 390x844 a 320x42 one. It reads as an empty text field.
Main had a small chip there. The build log says "No empty frame on the tiles", and the test named
"no card on the tiles alone" (`test/js/pc-monitor-frame.test.mjs:504`) asserts the card shows the
prompt; it only reaches `hidden` through a state the game never enters. Suggested fix: show the
card only once an account is chosen or for a result message (error, lockout), and show the prompt
outside it as a plain line (or not at all; the tiles say it).

**M2 (on main since slice 6, not this branch). The taskbar shows the silhouette for Sam while the
sign-in shows his headshot.** The coordinator's question (1): no, the right headshot is not used
everywhere. `applyAccountPicture` (`utils/pc-taskbar.js:266-270`) builds its source from
`npcRecordFor` alone, which reads `window.npcManager`. NPCs register lazily by room
(`npc-lazy-loader.js:37-103`); Sam's NPC lives in `lobby`, so with the player in `desk_room` the
manager has no record (live: `npcManager.npcs.size` 0) and the source is empty, so the
silhouette shows. The sign-in tile uses the server's tile (`portrait`, `game.rb:2497-2509`), so it
finds `male_office_worker_v2_headshot.png`. Seen at every size, local and remote
(`r1-sam-4-desktop__*.png`, `r1b-net-7-remote-reader__390x844.png`). The same will happen for any
remote sign-in to an NPC in an unloaded room. Suggested fix: keep the tile's headshot source
(avatar, portrait) on the session record when the sign-in succeeds, or fall back to the scenario's
NPC data (`gameScenario.rooms[*].npcs`) when the manager has no record. A test should sign in
with an empty manager.

## Minor

**m1. The view that opens by itself after the plant has no Unplug.** `network-links.js:450` opens
the first foothold's view without `atJack`, although the player is standing at the jack and the
sprite is in hand. Clicking the same jack a second later gives the same view with Unplug
(`r1b-net-1-after-plug` against `r1b-net-2-planted`). Pass `{ atJack: jackId, jackSprite: sprite }`
there too.

**m2. A refused Unplug's toast covers the view's header and the Unplug button** at 390x844 and
360x640 (`r1b-net-3-refused__390x844.png`) for the toast's lifetime. The view has its own notice
line (`.network-view-notice`); the refusal could show there, next to the button
(`network-view-minigame.js:614-635`, `network-links.js:560`).

**m3. Unplug on its own row costs short landscape a third of the list.** At 667x375 the header is
140 of 375 px and the list shows one and a half rows (`r1-net-2-planted__667x375.png`); at 844x390
two rows. `css/network-view-minigame.css:152-165`. On a wide, short screen the button fits on the
subtitle's line (right-aligned, left of the X's column).

**m4. Locked and wrong at 360x640 scrolls inside the screen**, the card's bottom border under the
fold (`r1-sam-5b-locked-wrong__360x640.png`): the locked line, the tiles (still shown in portrait)
and the card do not fit 502 px. The unlocked wrong state fits. Not checked on main, so this may
predate the card (it adds about 24 px). The locked screen has its account chosen already, so the
tiles could fold as they do in a short window.

**m5. One PC, two window idioms.** After the file's window X the player lands in the share
window, whose navy title bar has no X; only the bezel X remains (`r1-sam-7-after-window-x__*.png`).
The builder logged this as out of scope. It needs a pick: give the share window the same X
(closing to the desktop) or accept the mix.

## Nits

**n1.** The test name at `test/js/pc-monitor-frame.test.mjs:504` says "no card on the tiles
alone" and asserts the opposite (see M1).

**n2.** At 844x390, 915x412 and 667x375 the window X (28x24) sits right under the bezel X (30x30),
10 px in and 12 px down. With a coarse pointer its 44 px hit area (`text-file-minigame.css:551`)
reaches the bezel X's bottom edge with no gap. No overlap, but a fat-finger risk worth a look on a
real phone.

**n3.** The status lines outside the card keep their own plates: "Locked: ...", "Remote sign-in
through ...", "Captured sign-ins: none yet." The remote line is 326 px wide against the card's
320, so its edges stick out 3 px each side at 390x844 (`r1-net-6b-remote-chosen__390x844.png`).
Matching widths (or putting the locked line inside the card) would finish the "one unit" look.

**n4.** The builder's 1400x900 Sam shots were overwritten by later runs on a game already signed
in: `after-sam-1-tiles` and `after-sam-2-chosen` show the desktop, and the 1400 reader line in
the proof log has `winX: false` from a run before the code. The 1400 behaviour is fine (this
round's shots), but those files are not proof of E06 at 1400.

**n5.** A view opened from the inventory gives no hint how to get the box back. Not offering
Unplug there is right: the server checks only that the jack's room is reachable
(`network_access.rb:121-126, 286`), not that the player is at the jack, so an inventory Unplug
would pull a box from across the map. A one-line note ("Unplug it at its port") would answer the
question the player will have.

## Merge with build/ui-minigames2 (coordinator question 2)

- `git merge-tree` of the two branch tips: no textual conflicts. Both touch
  `css/network-view-minigame.css`, in separate hunks.
- No double styling of the reader's X: `notepad-window.css` (ui-minigames2) styles the world
  viewer's window and, on a PC, only `.pc-monitor .pc-file-window .pc-file-body` (light page, dark
  ink). It never names `.pc-window-close`. After both merge, the PC reader is navy title bar, grey
  bevelled X, light page: the A35 look. The X's colours here (#c0c0c0, #fff, #404040) equal
  ui-minigames2's `--np-face`, `--np-light`, `--np-dark`.
- What will still differ: the reader's toolbar buttons stay `.pc-os-btn` (blue-grey) while the
  world viewer's become bevelled grey `.action-btn`. That is an A35 question, not a clash.
- A45 in ui-minigames2 caps `.minigame-container[data-minigame="text-file"] > .minigame-game-container`.
  In the monitor the game container sits under `.pc-monitor-screen` (`css/pc-monitor.css:74`), so
  the child selector should not match. The merge batch should still take one 1400x900 shot of the
  PC reader to confirm the monitor does not shrink.
- Recommendation: build/ui-pc2 owns the reader's X (its markup, binding and style in
  `text-file-minigame.css`), because the X is behaviour (E08) as much as look. ui-minigames2 owns
  the page colours. Once the user confirms A35, a small follow-up can move the X's colours onto
  the `--np-*` tokens. Do not add a second X rule to `notepad-window.css`. Merge order does not
  matter.
