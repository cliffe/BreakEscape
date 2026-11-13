# UX feedback round, slice 2c: build log

Branch `build/ux-slice2c` (from batch 27, a8f74b3b8). Engine paths below are under `public/break_escape/`.

The user's notes on main-01, main-02 and main-03: the post-it was not stuck to the bezel, the tile headshots were crops of the talk image, the PC opened at different sizes in different views, and the desktop's bezel did not match the sign-in screen's.

## What changed

| Part | Change | Files |
|---|---|---|
| A. One frame | `utils/pc-monitor.js` holds the one PC monitor frame. `mountPcMonitor(scene)` puts a minigame's game area on the monitor's screen, moves the X into the bezel's top strip, makes the chin the host for footer buttons (Add to Notepad) and sticks the post-it on the chin. `css/pc-monitor.css` holds the one bezel look: a flat grey case, 2px outline, 2px inner edge, stepped corners, a webcam, a power light, the desktop wallpaper behind every view. Linked in `games/show.html.erb` after the password CSS. | `js/utils/pc-monitor.js`, `css/pc-monitor.css`, `app/views/break_escape/games/show.html.erb` |
| A. Views | Every PC view uses it: the sign-in screen (local and remote), a computer's own password screen (the 'screen' kind; Wi-Fi keys, archives and case locks keep the password frame), the desktop (local and remote) and a share's folder window. The desktop's account bar (headshot, name, Switch user, Sign out) is the screen's top bar; its description is in a taskbar along the screen's foot. The share window is maximised on the screen, so no wallpaper shows (slice 2a's main3-08 rule holds). The old desktop header box, the PC picture, the second bezel and the desktop's Close button are gone in these views: the X closes. | `js/minigames/password/password-minigame.js`, `js/minigames/container/container-minigame.js`, `css/password-minigame.css`, `css/container-minigame.css` |
| A. Sizing | `pcMonitorMetrics(w, h)` is the one sizing rule: the screen grows to fill the window less the gutters, the bezel and the room for the hanging post-it, up to 1120x700. A landscape window gets a 16:10 screen; a portrait window (a phone held upright) gets a portrait monitor that follows the space, no taller than 3:4. Below 560px in either direction the compact bezel is used (thinner sides, the existing short-window sign-in rules, now keyed to the frame's `data-compact` flag instead of a media query). Minimum screen 280x200 where the window has room; the frame never overflows. Sizes and the place are whole pixels, set inline from the metrics, so the frame depends only on the window: the sign-in screen and the desktop of a PC are at the same size and place (checked live and in unit tests). | `js/utils/pc-monitor.js` |
| B. Post-it | The note is a child of the frame, absolutely placed from the metrics: its top 4px under the screen's bottom edge, its left 24px (12px compact) past the side bezel, max width 45% of the monitor (up to 340px). It overlaps the chin, and the frame keeps 24px (16px compact) under the monitor for its overhang. Still draggable; a dragged note keeps its place on a resize. | `js/utils/pc-monitor.js`, `css/pc-monitor.css` |
| PC name | The PC's name is on the bezel's top strip, left, in the 8px pixel face, where the post-it never covers it. | `css/pc-monitor.css` |
| C. Headshots | `utils/npc-headshot.js`: the 32x32 `<key>_headshot.png`. Keys in order: an avatar that is already a headshot, the NPC record's world sprite (`spriteSheet`, after any lookalike swap; found by npcId or the account's username through the NPC manager), then the talk portrait's stem with `_v2` first (the v2 headshots match the talk art), then without. A sign-in tile shows the headshot at x2 (x1 in the compact window). The talk crop is used only when no headshot file loads, and the key is logged once (`[headshot] no <key>_headshot.png ...`). The desktop's top bar shows the signed-in NPC's headshot at x1. | `js/utils/npc-headshot.js`, `password-minigame.js` (`applyTilePortrait`), `container-minigame.js` |
| Chin buttons | Chin buttons and Switch user / Sign out use the theme's thin button skin (`--ui-small-button-*`), so they fit the chin and the top bar. | `css/pc-monitor.css`, `css/container-minigame.css` |

Pixel art: 2px borders, stepped corners, flat fills, pixel fonts, headshots at whole scales. No radius, gradients or soft shadows.

## Sync

Client display only. No player_state field, no new request.

## Headshot keys with no file

From every scenario's `spriteSheet` and `spriteTalk` (ERB-built keys in m09 and m10 not resolved): these fall back to the talk crop and are logged once.

- `mr_ahmed`, `mrs_kowalski`, `ms_okafor` (sis01_healthcare)
- `mr_pryce`, `mrs_hargreaves`, `ms_chen` (m02_ransomed_trust)
- `leila_nassar` (ca03_helpdesk_reset)
- `david_torres_ko` (m05_insider_trading, the knocked-out talk variant; `david_torres_headshot.png` exists)
- `hacker`, `hacker-red` (the lab scenarios' legacy player sprites)
- `bed2`, `bed_*` are bed sprites, not people.

None of these is an account holder in the sign-in test scenarios. No art was generated.

## Tests

New `test/js/pc-monitor-frame.test.mjs` (14 tests): the frame fits at 1400x1000, 800x600, 915x412 and 390x844 with the post-it's room; it fills the space (1120x700 at 1400x1000); 16:10 in landscape, portrait on a phone; compact flag and minimums; the post-it's place on the frame at each size; headshot keys and URLs; the scenario NPCs' files exist; a missing key is logged once; a tile shows the headshot at x2, uses the NPC record's sprite, and falls back to the crop; the sign-in screen and the desktop have the same frame (inline size and place, post-it place, compact flag) at all four sizes; the desktop bar shows the headshot; the bezel rule lives only in `pc-monitor.css`.

Updated to the new layout: `password-signin-mode` (the row in the chin; the frame-snap test uses a non-computer lock; the message line in the monitor screen; the tile shows the headshot; the post-it is always in view so only the line is revealed), `container-transfer-dialog` (top bar and taskbar), `container-shares` (folder window on the monitor, title-bar icon, status bar names the host), `minigame-title-escape` (hostile names on the bezel and in the screen note; the old device panel checked with a non-computer lock).

Harness copy lists: `utils/pc-monitor.js` and `utils/npc-headshot.js` added to access-remote-signin, container-transfer-dialog, container-shares, password-join-mode, password-signin-mode, lock-scope-refusal, password-minigame-submit and password-case-hint.

Suites, under the shared lock: `bin/rails test` 2386 runs, 42523 assertions, 0 failures, 0 errors, 1 skip; `MERGE_BATCH=1 bin/test-js -j 3` 599 files passed, 0 failed. Validator (`--no-graph`): 0 ❌ on test_access_signin and test_access_networks.

## Live proof

Keyless server on :3062, setFPS(20) with fixed steps, scrollbars shown. New games: 2888 (test_access_signin), 2890 to 2893 (test_access_networks). Shots (webp) in the scratchpad's `ux-shots/slice2c/`: `main-01`, `main-02`, `main-03`, `remote-signin`, `remote-desktop`, `shares`, each at 1400x1000, 800x600, 915x412 and 390x844, and `pair-*.webp` before/after pairs at 1400x1000 against `slice2a-final`. Driver: `ux-shots/slice2c/drive.mjs`.

At every size: the monitor's box is identical for sign-in, wrong password and desktop, and for remote sign-in, remote desktop and the share; the X is inside the bezel and off the screen; the frame is inside the viewport; the post-it's top is 4px under the screen and it is inside the viewport; the screen's scroll area has no overflow; tiles show `male_office_worker_v2`, `male_nerd_v2`, `female_blowse_v2` headshots; the desktop bar shows the signed-in NPC's headshot.

## Not done, or left as is

- The 8px sign-in title in the compact window is the existing short-window rule, kept; it is small on a phone.
- On a phone held upright the compact rules still apply (smaller tiles), although there is vertical room.
- The remote sign-in's Captured sign-ins list shows usernames only, no headshots.
- In a compact window the post-it wraps to two lines and hangs about 18px under the monitor (inside the reserved room).
- The classic password screen of a computer (not a sign-in PC) is covered by unit tests; it was not retaken live (the test scenarios have no such PC).
