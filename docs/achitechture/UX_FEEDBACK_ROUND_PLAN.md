# UX feedback round: work plan

Source: the user's screenshot review of the access control, networking and office life features (review page, 2026-11-12), per-screen verdicts and notes plus eight option picks. Planning only: nothing here is built yet. All of build/ux-access, build/ux-devices and build/unlock-gaps-r1 are on main, so "now" below means main at c9a4f7a84. Engine paths below are under `public/break_escape/`.

Standing rules for every slice:
- Pixel-art UI rule: 2px solid square borders or the ui-themes.css 9-slice skin; GNF, Press Start 2P or VT323 only; no hairlines, border-radius, soft shadows or gradients; icons at whole-number scale. Stepped corners drawn in whole-pixel steps (a clip-path polygon, as on the card copier frame and the PC monitor bezel) are pixel art and stay; only smooth radius is banned.
- Sync size rule: each slice says how big synced state can grow and what each sync sends (the "Sync" line in every slice), and repeats it in its build log.
- Cheat policy: the server keeps deciding secrets, keys and cards from server-written state. Client flow rules are best effort and are named as such.
- Spoken lines stay in scenario files (bark fields or ink) so they can be voiced; no slice adds engine-written spoken text.
- No image generation inside any slice: art is listed in section 5 and waits for the user.

## 1. Every note and pick

Size: S under half a day, M about a day, L two days or more. Risk: chance of breaking something that works now.

### Change and unsure notes, and "ok" notes that ask for work

| Shot | What the user asked | Code that draws it | Change | Slice | Size | Risk |
|---|---|---|---|---|---|---|
| main-01 (ok) | Move the post-it off centre | `css/password-minigame.css` `.password-minigame-area .postit-note` (sign-in mode, centred under the bezel) | Pin the note to the bezel's lower-left, overlapping the frame, as the desktop's note already is (`.container-minigame.desktop-mode > .postit-note`) | 2a | S | Low |
| main-12 | Same: post-it off centre, to the left | as main-01 | as main-01 | 2a | (with main-01) | Low |
| main-11 | Post-it icon down, its bottom level with the PC sprite's bottom; PC on a desk, not the floor | `js/systems/postit-marks.js` `postitPosition` (inset from the top-left) | Anchor at the bottom-left: `y = top + h - POSTIT_SIZE/2` (no bottom inset), x as now. Desk: deferred (section 6) | 2a | S | Low (update its node test) |
| main-14 (ok) | Add a simple start menu: headshot, name, maybe computer name, Lock or Log out; what else? Mock up options | `js/minigames/container/container-minigame.js` `accountBarHtml`, `createDesktopUI` (the empty `.desktop-taskbar`) | New taskbar and start menu in the monitor; mock-ups in section 3 | 6 | M (A) to L (C) | Medium: touches every desktop container |
| after b07 (m01 desktop) | New pixel-art wallpapers; show the PC name and who is logged in (Kevin) even on a PC with no sign-in | `container-minigame.css` `.desktop-wallpaper` (one file, `assets/mini-games/desktop-wallpaper.png`, 320x320) | Optional PC fields `host` and `desktopUser` (name, character key) shown in the taskbar; `wallpaper` field per PC with a scenario default; new wallpapers (art, section 5) | 6 | M | Low (fields optional; m01 edit needs the user's yes) |
| main-16 | Gate refusal bark: use the new speech bubble | `js/systems/npc-barks.js` `_renderBark` (toast) and `_showBarkIcon` (pulsing talk.png); `js/systems/npc-world-bubbles.js` (needs-only today) | See o-barks | 5 | M | Medium |
| main2-16 (ok) | Add icons to the menu entries: the hand for Take, a new Flipper-like icon in the copier's colours for Copy | `js/systems/action-menu.js` `objectActions`; `js/ui/interaction-menu.js` already draws `icon: {src, frame, cols, cell}` in a 64px box | Pass `icon` on both entries: Take uses a frame of `assets/icons/hand_frames.png` (32px cells, x2); Copy uses the new copier icon (art) once approved, and until then a whole-number placeholder (slice 3a) | 3a | S | Low |
| main2-17 | Keep the copier's pixel rounded corners; keep the other changes | `css/rfid-minigame.css` `.flipper-zero-frame` (commit 6990989ac removed the stepped `clip-path` polygon) | Restore the stepped clip-path from 6990989ac^; keep 2px borders, pixel icons, named card. Check the inset bevel at the clipped corners | 3a | S | Low |
| main2-19 (ok) | Keep the new door-reader screen | `js/minigames/rfid/rfid-ui.js` `showDoorScreen` | None | - | - | - |
| main2-21 (unsure) | We should still see the emulation details screen | `rfid-ui.js` `showEmulationScreen` (shows for 500 ms, then `handleEmulate`) | Hold the screen at least 1.5 s; breadcrumb "At the reader > Emulating" when opened from a door | 3a | S | Low |
| main2-22 | The rounded frame is pixel art, keep it | as main2-17 | as main2-17 | 3a | (with main2-17) | Low |
| main2-26 | Hook-with-vests tray icon is fine; no menu, go straight to the confirm | `js/systems/inventory-menu.js` (droppable wearable gets "Put on / Drop here / Examine"); `js/systems/wearables.js` | A wearable click opens the Put on / Take off confirm at once; where Drop and Examine go is q91 | 4 | S | Low to Medium (drop path) |
| main-22 (note) | Test PCs on the floor; full room-dressing pass later | test scenario rooms | Deferred (section 6) | - | - | - |
| main-24 (unsure) | Fine for now; build proper scenarios once features settle | `test_access_work` | Deferred (section 6) | - | - | - |
| main-27 (ok) | Should remote sign-in show account headshots like the local screen? | `js/systems/unlock-system.js` `openLoginSignIn` (remote: no tiles by design) | Part of the shared sign-in module (main3-07); what the tiles hold is q92 | 2b | (with main3-07) | Medium |
| main3-01 (ok) | Is the Wi-Fi prompt a different theme from the password minigame? | `password-minigame.js` `passwordScreenKind` returns `prompt` for a join; `.prompt-mode` CSS | Answer in section 4. Prompt panel skin is q98 | 2a | S | Low |
| main3-02 | Wi-Fi joined view: make it look better | `js/minigames/network-view/network-view-minigame.js` `render`; `css/network-view-minigame.css` | Panel sized to its content, title and subtitle that do not repeat each other, a joined status line in place of the stale "Open it to see what it reaches", Wi-Fi icon by the title, rows in the same heading layout as the jack view | 1 | S | Low |
| main3-04 (ok) | All borders 2px, or no borders round the rows and a contrasting fill | `network-view-minigame.css` (outer panel 4px on line 9, block 2px, each row another 2px inside it) | Outer panel border to 2px solid; drop row borders; rows get a lighter fill on the block's darker fill with a 4px gap; block keeps its 2px frame | 1 | S | Low |
| main3-05 | Same landscape desktop fix as above? | `container-minigame.css` `.desktop-mode` rules (apply to remote desktops too) | Yes, already applies; the shot predates it. Retake. Also: share icon labels show the share name only, UNC path in the tooltip | 2a | S | Low |
| main3-06 | Same headings layout as the jack foothold view | `network-view-minigame.js` `blockSectionHtml` | Retake to confirm; fix only if it differs | 1 | S | Low |
| main3-07 | Make the sign-in with account headshots one shared, reusable minigame | `password-minigame.js` sign-in mode (tiles, `applyTilePortrait`, captured sign-ins block) | Extract a sign-in screen module used by the local, remote and share sign-ins; the remote screen gets tiles (q92), fixed field widths, a backed title line | 2b | M | Medium (pinned by `password-signin-mode.test.mjs`) |
| main3-08 | Fix the header image | `container-minigame.js` `openMappedShare` (`name: 'network_share'` asks for `assets/objects/network_share.png`, which does not exist) | Point the header at the share icon (`m09_folder1`, or the new share icon); open a share as a folder window (title bar with the UNC path, file list, no wallpaper) | 2a | S (header) + M (folder window) | Low |
| main3-10 | Improve it, with headings like the others | network view (shot predates the headings layout) | Retake; one header pattern for every foothold kind (slice 1) | 1 | S | Low |
| main3-11 | Make it look better (implant world view) | `scenarios/test_access_networks` `sam_dock`, `kiosk_dock`, `door_dock` use `network_rack1` (a server rack) | A desk USB socket sprite with an "implant in" state; distinct tray icons for the link items (art) | 8 | S code + art | Low |
| main3-12 | No USB stick visible in the shot? | `kit_stick` uses `drop_box1`; `js/systems/item-drop.js` drop spot | Answer in section 4. A USB stick sprite (art); drop spot in front of the player's feet, not under the head | 8 | S + art | Low |
| main3-13 (unsure) | Shots taken before the headings layout? Be consistent | network view | Answer in section 4. Same header layout and naming for all foothold kinds (see o-link-names) | 1 | (with o-link-names) | Low |
| main3-15 | Add "(powered down)" | `network-view-minigame.js` `rowHtml` (`not_responding`), server `host_service_off?` | Part of the down-device language below | 1 | (with next row) | Low |
| after own-down (note) | One shared design language for down devices, e.g. "(down)" | `network-view-minigame.js` (`(no route)`, `No route to X`, `not responding`, `remote sign-in off`, `linkOffText`) | One helper for every down state: name tag "(down)" for no route, "(powered down)" for a host whose service is off, link title "(down)" when its own PC is off; grey row, grey icon, plain (not italic) reason text, "Session kept: <name>" for a held session | 1 | M | Low (update `network-view.test.mjs`) |
| after own-down reload (unsure) | No note | same view after a reload | q96 | - | - | - |
| main-13 (unsure) | No note | room view, open screen vs locked | q96 | - | - | - |
| main-15 (unsure) | No note | gate hall | q96 | - | - | - |

### Option picks

| Option | Pick | What it means | Code | Slice | Size | Risk |
|---|---|---|---|---|---|---|
| o-seated-pc | msg | Picking an in-use PC from the menu says "Omar is using this PC" | Already on main: `core/game.js` lines 2962 to 2981, `unlock-system.js` `pcInUseBy`, `showPcInUse` | Retake main-10 only | - | - |
| o-link-names | server | One pattern "<device>: <place>" from the server for every foothold kind; authored names still override | `app/models/break_escape/network_access.rb` (Wi-Fi line 362, implant 502 and 540, jack 571) | 1 | M | Medium (Rails tests, validator) |
| o-icons | draw | Inventory icons drawn by hand in the free pixel editor, approved by the user before merge | art, section 5 | 8 | - | - |
| o-vest | leave | Whole-character disguises stay | none | - | - | - |
| o-acl-doors | leave, with a rule | Held badges open access-list doors with no step; a copy opens only through the copier's Emulate | `js/systems/unlock-system.js` `heldRfidCardIds`, `requestRfidAccessUnlock`; `js/minigames/rfid/rfid-minigame.js`; `rfid-ui.js` `showDoorScreen` | 3b | M | Medium (pinned by `access-rfid-acl.test.mjs`) |
| o-barks | bubble | Barks from a person NPC in view show as the speech bubble over them; no pulsing talk icon and no toast. Toast kept for NPCs out of view and phone contacts | `npc-barks.js` `_renderBark`, `_showBarkIcon`, `_speakBark`; `npc-world-bubbles.js` | 5 | M | Medium |
| o-feed-replay | replay | Keep replaying held toasts, Friendface included | none | - | - | - |
| o-pixel-pass | now | One branch: pixel pass on the older minigames the sweep flagged | see slice 7 | 7 | L | Medium (many files, visual only) |

## 2. Slices

### Order and parallel work

File overlaps:
- Slices 2a, 2b and 6 all change `container-minigame.js` or `password-minigame.js`: 2a first, then 2b, then 6.
- Slices 2a and 3b both edit `unlock-system.js`, in functions far apart (sign-in and RFID blocks). They can run at the same time; merge one before the other and rebase the second onto it.
- Slices 1 and 8 both touch `test_access_networks`: 8 after 1.
- Slices 3a and 8 both touch the Copy icon in `action-menu.js`: 8 after 3a.
- Slices 1, 3a, 5 and 7 share no files with each other or with 2a.

Before slices 3a, 3b and 5 start, check whether the unmerged edits to `npc-barks.js`, `rfid-minigame.js` and `rfid-ui.js` on other branches (merge/m03-improvement-loop, build/phone-calls and its siblings) are still live; rebase onto or merge any that are.

### Can start now
- Slice 1 (network views)
- Slice 2a (sign-in post-it, room mark, share labels, share header, share folder window)
- Slice 3a (copier look and menu icons)
- Slice 5 (speech bubble barks)
- Slice 7 (pixel pass on older minigames)

### Waits on
- Slice 2a: q98 adds the prompt skin to it once answered; the rest of 2a does not wait.
- Slice 2b: q92 (remote tiles); and slice 2a merged.
- Slice 3b: q97 (one copy at a time, or all copies in one request); build/revoked-cards merged.
- Slice 4: q91 (where Drop and Examine go).
- Slice 6: q93 (start menu option), q94 (m01 fields), q95 (wallpapers); approved wallpaper art; slice 2b merged.
- Slice 8: the user's approval of the art in section 5; slices 1 and 3a merged.
- q90 blocks only new menu entries, if the answer asks for any; the icons in 3a do not wait.
- q96 blocks nothing; any work it turns up becomes its own slice.

### Slice 1: network views (consistency, down language, link names)

Can start now: all of it. Waits on: nothing.

- Down-device language (after own-down, main3-15): one exported helper `downState(row|block)` returning `{ tag, reason }`; tags "(down)", "(powered down)"; reasons "No route", "Powered down", "Remote sign-in off" (not a down state: no tag, row stays readable); "Session kept: <name>". Link title gets "(down)" when its implant's PC is off.
- Borders (main3-04): the outer panel border (`network-view-minigame.css` line 9, `border: 4px solid`) becomes `2px solid`; row borders go; rows get a lighter fill on the block's darker fill with a 4px gap; the block keeps its 2px frame.
- Link names (o-link-names): the server writes "<device>: <place>" into each foothold record at grant, unless the source object has an authored `linkName`.
  - Device word per kind: "Drop box", "Keystroke injector", "USB stick", "Network jack", "Wi-Fi".
  - Place: the source object's room name for every physical kind. For Wi-Fi the place is the network name, as today (`"Wi-Fi: #{net_name}"`), because one network spans several rooms.
  - The test scenario's mixed `linkName` and `name` overrides are removed from `test_access_networks` so it shows the defaults.
  - Names are written at grant time, so a game that already holds footholds keeps its old names. A retake must use a new game; an old game showing the old name is not a failure.
- Header (main3-02, main3-10, main3-13): one layout for every foothold kind. Title is the link name. Subtitle adds what the title lacks, so the two never repeat:
  - Physical kinds: "On <network name>, at <source object name>".
  - Wi-Fi: "Access point: <access point object name>, <room name>".
- Wi-Fi joined view (main3-02): panel sized to its content (no tall empty panel), Wi-Fi icon by the title, rows in the heading layout of the jack view. On a joined view the stale observation line "Open it to see what it reaches" is replaced by a status line "Joined. Reaches <n> hosts." (n counted from the rows rendered, client side).
- Tests:
  - `test/js/network-view.test.mjs`: down tags per state, no italics on reason text, row CSS has no border, outer panel border is 2px, subtitle differs from the title for each foothold kind, joined view shows the status line and not the stale line.
  - Rails tests for the default names (find with `grep -rn "Drop box\|Network drop box\|Wi-Fi:" test/`), one per kind, plus one showing an authored `linkName` still wins.
  - Validator (`--no-graph`, 0 ❌) on `test_access_networks` and `lab_physical_pentest` (its authored `linkName` "Drop box: comms cupboard" already follows the pattern; it is the only shipped scenario whose names the default touches, so it is listed to confirm nothing changed).
- Sync: one string per foothold record in `player_state['footholds']`, written once at grant and sent once in the grant answer. Bounded by the scenario's footholds; no new field and nothing re-sent.
- Retake: main3-02, main3-04, main3-06, main3-09, main3-10, main3-13, main3-15, after own-down and after reload, all in a new game.

### Slice 2a: sign-in post-it, room mark, shares, prompt skin

Can start now: post-it, room mark, share labels, share header, share folder window. Waits on: q98 for the prompt skin only.

- Post-it in sign-in mode (main-01, main-12): `.password-minigame-area .postit-note` pinned to the bezel's lower-left, overlapping the frame, as the desktop's note.
- Room mark (main-11): `postitPosition` anchors at the bottom-left of the sprite, `y = top + h - POSTIT_SIZE/2`.
- Remote desktop share icons (main3-05): label shows the share name only; the UNC path goes in the tooltip.
- Share header (main3-08): `openMappedShare` points the header at `m09_folder1` (26x18, shown x2) until a share icon is approved.
- Share folder window (main3-08): a share opens as a folder window (title bar with the UNC path, file list, no wallpaper). It opens with `desktopMode` false but keeps `parentLockable`, so Close reopens the desktop it came from, and keeps the remote return path, so Close on a remote share returns to the remote desktop.
- Prompt skin (main3-01), per q98: keep the plain 2px panel, or draw `.prompt-mode` with the ui-themes frame skin (`--ui-frame-*`).
- Tests, each failing on main before the change:
  - A CSS assertion (in `test/js/access-signin-postit.test.mjs`, which drives the sign-in post-it) that reads `css/password-minigame.css` and checks `.password-minigame-area .postit-note` is placed at the bezel's lower-left (left and bottom offsets set, no centring transform).
  - `test/js/postit-marks.test.mjs`: the mark's bottom edge equals the sprite's bottom.
  - A new test for share labels (name only, UNC in the title attribute) and the share header source (`m09_folder1`, never `network_share`).
  - A folder window test: opened from a local desktop, Close reopens that desktop (`parentLockable` kept); opened from a remote desktop, Close returns to the remote desktop.
  - Also run `password-signin-mode.test.mjs`, `container-transfer-dialog.test.mjs` and every test file importing the password or container minigame.
- Sync: client display only. Nothing stored, nothing new sent.
- Retake: main-01, main-11, main-12, main3-01 (if q98 changes it), main3-05, main3-08, after b07 (mission desktop unchanged).

### Slice 2b: shared sign-in module and remote tiles

Can start now: nothing (the extraction alone would be rework if q92 changes what the tiles hold). Waits on: q92; slice 2a merged.

- Shared sign-in module (main3-07, main-27): one renderer for tiles, typed name, password and the captured sign-ins block, used by the local, remote and share sign-ins. Fixed field widths; a backed title line (white on sky was hard to read).
- Remote tiles, by the answer to q92:
  - "Captured accounts only": tiles come from GET /capture_secrets, which the server already filters to what the player has captured. Portraits: the builder checks whether the client already holds each captured account's owner and character key in scenario data it has loaded; if not, the capture_secrets answer gains a `portrait` key per captured entry. No tile, name or portrait is returned for an account the player has not captured.
  - "The target PC's own picker": the remote screen calls GET /login_accounts with the `foothold` parameter (the client skips this call for remote screens today). The server judges reachability through the named foothold (the foothold is held by this player, the target host is reachable from it, and remote sign-in is on) and returns tiles only then; otherwise it returns no tiles. The `foothold` parameter already withholds the post-it, and still does.
- Tests: `password-signin-mode.test.mjs` and `access-signin-postit.test.mjs` (both drive code the module moves), `access-remote-signin.test.mjs`, `access-signin-requests.test.mjs`, `access-signin-routing.test.mjs`; a test that the remote screen shows tiles per the q92 answer; a Rails test for the chosen server path (an uncaptured account never appears; or an unreachable foothold returns no tiles).
- Sync: no player_state change. Each sign-in screen makes one read request; its answer is bounded by the accounts on that PC (or the player's captured accounts).
- Retake: main-27, main3-07, main-01 and main-12 (local screen unchanged).

### Slice 3a: copier look and menu icons

Can start now: all of it. Waits on: nothing (the approved copier icon replaces the placeholder in slice 8).

- Stepped corners back on the copier frame (main2-17, main2-22): restore the clip-path from 6990989ac^.
- Emulation screen held at least 1.5 s, with the breadcrumb "At the reader > Emulating" when opened from a door (main2-21).
- Menu icons (main2-16): Take uses a frame of `hand_frames.png` (32px cells, x2 fills the 64px box). Copy uses `assets/objects/rfid_cloner.png` (11x22) as a placeholder at x2 (22x44), centred, with `background-size` set to that exact size instead of `contain`, so it is never scaled by a fraction.
- Tests: `rfid-door-screen.test.mjs` (screen held at least 1.5 s, breadcrumb), `action-menu.test.mjs` (icons on both entries; the Copy placeholder's size is a whole-number multiple of 11x22), a CSS check that `.flipper-zero-frame` has the stepped clip-path.
- Sync: client display only.
- Retake: main2-16, main2-17, main2-19, main2-21, main2-22.

### Slice 3b: copies at access-list doors through the copier

Can start now: nothing. Waits on: q97 (it decides whether Emulate sends one copy or all of them); build/revoked-cards merged (card cancellation is being fixed there as its own security branch, and 3b's Emulate must refuse cancelled cards the same way that branch makes the rest of the game refuse them).

Today the copier cannot open an access-list door: for a door with no `requires`, `startRfidReader` passes `requiredCardIds: []`, so `isLockingAttempt` is false, the door screen never shows and Emulate answers "No reader here". Even with that forced on, `handleEmulate` decides locally against `requiredCardIds` and its success path calls `notifyServerUnlock` with no card ids, which the server refuses for an access-list-only lock.

- First request at an access-list door sends only physical keycards (`heldRfidCardIds` without copies). If refused, or none held, and the copier holds saved cards, the copier opens on the door screen.
- Access-list mode in `js/minigames/rfid/rfid-minigame.js`:
  - The door screen shows for a lock that has an access list, even with no `requires`.
  - Emulate sends the chosen card's id through `requestRfidAccessUnlock(lockable, type, [cardId])` and waits for the answer. If q97 asks to keep the admitted identity hidden, Emulate instead offers every saved copy in one request.
  - It keeps the UID-only refusal (unless the lock `acceptsUIDOnly`), the cancelled-card refusal from build/revoked-cards, and the wait for a pending clone record.
  - On success it passes the server's answer to `unlockTarget`. It makes no second unlock call.
- What the server decides, unchanged: the card comes from server-written state. `held_keycard_ids` is read from the server's own inventory copy, ignoring client-forged items; copies count only from `server_clones` while an `rfid_cloner` is held; UID-only copies are refused unless the lock accepts them. The server already refuses a copy it has no record of.
- "A copy opens a door only through the copier" is client flow. The server cannot tell an Emulate press from a hand-made request carrying the same recorded copy's id. This is acceptable under the cheat policy (the player genuinely holds the copy and the copier) and is a best-effort UX rule, not a server rule.
- Tests:
  - `access-rfid-acl.test.mjs`: physical cards first and copies never in the first request; Emulate at an access-list-only door sends a single-id request (or the all-copies request, per q97) and the door opens from the server's answer with no second unlock call; a UID-only copy and a cancelled card are refused.
  - `rfid-door-screen.test.mjs`: the door screen shows at an access-list-only door.
  - Rails `access_model_rfid_test.rb`: a single-id copy request opens the door. This is a regression pin (the server is unchanged, so it passes before the slice), not a must-fail test.
- Sync: no player_state change. Each Emulate sends one request holding one card id (or the saved copies, bounded by the copier's slots); the answer is the unlock result.
- Retake: main2-19, main2-21, main2-23, main2-25 (a copy now needs the copier).

### Slice 4: wearable click

Can start now: nothing. Waits on: q91.

- A wearable in the tray opens the Put on / Take off confirm at once (main2-26); Drop and Examine per q91.
- The X on `gameConfirm` duplicates Cancel. It is removed only from this confirm, through a new option (`options.closeButton === false`) passed by `wearables.js`. Every other confirm (breaker, jack plant and unplug, power switch, interaction warnings, scenario confirm actions) keeps its X, so no other screen changes in this slice. Esc still cancels the wearable confirm through `registerModal`.
- Tests: inventory-menu test (wearable click opens the confirm, no menu), wearables test (confirm has no X, Esc cancels), a notifications test that a confirm without the option still has its X and every confirm has a Cancel button.
- Sync: no change beyond what putting on, taking off or dropping a wearable already sends.
- Retake: main2-26, main2-27.

### Slice 5: speech bubble barks

Can start now: all of it. Waits on: nothing.

Routing (o-barks): a bark goes to the bubble when the NPC is a person NPC whose sprite is in the player's room, the room is lit, and no minigame is open; otherwise it goes to the toast, as today. Phone contacts always use the toast. TTS is unchanged: the full line is always voiced through `_speakBark` (and `world.speak` for needs), whether it shows in a bubble, a toast or both. The pulsing talk icon is removed (it also scales by 1.25, a non-integer scale).

New bubble source: `say(npcId, line, { audioMs })` in npc-world-bubbles that does not need a needs state.

Long lines:
- The bubble wraps at its width (about 24 characters a line) and shows the line in pages of at most 3 lines, split at word boundaries. Joined, the pages are the whole line, word for word.
- Timing: each page's time is its share of the whole line's time, by word count, with at least 1.2 s per page. The whole line's time is the voiced audio's length when `TTSManager.play` returns one, plus 0.8 s; without audio, it is `barkLifetimeMs(line)` (reading time). The first page shows at once with reading-time pacing; when the audio length arrives, the pages still to come are re-timed to it.
- If the NPC leaves view mid-line (the player changes room, the room goes dark, or a minigame opens), the bubble closes and the rest of the line, from the page being shown onwards, goes to the toast with the speaker's name. The toast follows the usual hold rules (held while a panel is open, shown when it closes). The audio carries on.

Capacity:
- The bubble layer shows at most `MAX_BUBBLES` (4). Bark bubbles rank before needs chatter, then by distance, so a bark pushes out the farthest needs bubble.
- If four bark bubbles are already up, a further bark from an NPC farther than all four goes to the toast; a nearer one takes the place of the farthest bark bubble, whose remainder goes to the toast.

Pixel-art redraw of `npc-world-bubbles.js` (it draws needs bubbles too, so both change):
- Text in a pixel font (VT323, or GNF if the other world labels use it; the builder checks door captions and matches them), at a size the font draws at whole pixels, awaited through `document.fonts.load` before the first Text object is made. Not `monospace`.
- Frame: `lineStyle(2, ...)` with `fillRect` and `strokeRect`, square or stepped corners drawn as whole-pixel notches. No `fillRoundedRect` or `strokeRoundedRect`.
- Tail drawn as stepped whole-pixel rectangles; bubble positions rounded to whole pixels; no fractional scale on the container or its children.

Tests:
- A routing function exported from npc-barks: in view gives bubble, out of view gives toast, dark room gives toast, phone NPC gives toast, minigame open gives toast.
- Paging: a 150-character line gives pages of at most 3 lines whose joined text equals the line; page times follow the audio length when given and reading time when not; leaving view on page 2 sends pages 2 onwards to the toast.
- Capacity: a bark outranks needs chatter; a fifth, farthest bark goes to the toast; a minigame opening mid-bark sends the remainder to the toast.
- Pixel art: the bubble's Text uses the chosen pixel font, the stroke width is 2, and no rounded-rect call is made (spy on the Graphics object).
- No tween on `talk` for a bark.
- Live proof in `test_access_habits` at Sara's gate, plus the longest authored bark (150 characters, in the labs) in its own scenario.
- Sync: client display only. Barks are not synced.
- Retake: main-16; one long bark in a lab; one phone bark to show the toast still works.

### Slice 6: desktop taskbar, start menu, wallpapers

Can start now: nothing. Waits on: q93, q94, q95; approved wallpaper art; slice 2b merged.

- Start menu per the q93 pick from section 3. Headshot from the tile portrait (`applyTilePortrait`), cached client side at sign-in; not synced.
- The "Take Container" button lives in `.desktop-taskbar` today; it stays in the taskbar when the taskbar moves inside the bezel.
- Non-sign-in PCs: computer name and optional `desktopUser` in the taskbar (after b07), per q94.
- `wallpaper` field per PC and a scenario default; hashed choice among the approved set when none is set.
- Tests: container tests for the taskbar (signed in, claimed, remote, no sign-in), Take Container still present, wallpaper selection, Esc closes the menu first.
- Sync: options A and B add nothing. Option C's Lock is one server-side boolean on a held session, bounded by the number of sign-in PCs; the client reads it in the sessions answer and never sends it back.
- Retake: main-03, main-04, main-14, main3-05, after b07, plus one mission desktop (m02) to check nothing else moved.

### Slice 7: pixel pass on older minigames

Can start now: all of it. Waits on: nothing.

- From the layout sweep (`UNLOCK_GAPS_BUILD_LOG.md`, worst first): drug-library-integrity (1px borders, Courier New, radius), PIN pad (soft shadows, gradients), scada-historian (hairlines, Courier New), biometrics, BLE and Bluetooth scanners, SIEM, text-file (system UI font), forensic data platform (also its line 434 border), NCSC brief, network architecture, infusion pump, notes; and the framework shell's one soft shadow and two gradients (`.minigame-container`, `.minigame-game-container`).
- Not in scope: the container desktop bezel and password screens (slices 2a, 2b and 6).
- Tests: a computed-style sweep script over the registered minigames, failing on any border under 2px, radius without a pixel clip-path, blurred shadow, gradient or non-pixel font; existing tests of each minigame.
- Sync: client display only.
- Screenshots: before and after of every minigame touched, at 1400x1000 and 800x600.

### Slice 8: art integration

Can start now: nothing. Waits on: the user's approval of the art in section 5; slices 1 and 3a merged.

- Wire the approved icons and sprites: tray icons for the kit and link items, USB socket and stick sprites, network view icons, the copier menu icon (replacing the 3a placeholder), wallpapers if slice 6 has not.
- Drop spot in front of the player's feet (main3-12).
- Sync: client display only.
- Retake: main3-03, main3-11, main3-12, main2-16, network views with the new icons.

Also: retake main-10 to confirm o-seated-pc "msg" works live (no code expected).

## 3. Start menu mock-ups (main-14)

All three put a taskbar along the bottom of the monitor (the empty `.desktop-taskbar` moves inside the bezel), with Close and Add to Notepad left where the framework puts them.

### A. Small start menu (recommended)

```
+--------------------------------------------------------------+
|  [txt]                                                       |
|  Staff                                                       |
|  notice                                                      |
|                                                              |
|  +------------------------+                                  |
|  | [##] Dana Reyes        |                                  |
|  | [##] dreyes            |                                  |
|  |------------------------|                                  |
|  | PC: HB-DESK-03         |                                  |
|  | On: Harbour office LAN |                                  |
|  |------------------------|                                  |
|  | > Switch user          |                                  |
|  | > Sign out             |                                  |
|  +------------------------+                                  |
|[Start]|                                HB-DESK-03   09:42    |
+--------------------------------------------------------------+
```
For: familiar, small, frees the header (Switch user and Sign out leave the title area); the computer name and in-game time sit in the taskbar. Against: the account is one click away, so the claim banner still has to stay in the header so a borrowed session is never hidden.

### B. Always-visible account in the taskbar, no menu

```
+--------------------------------------------------------------+
|  (wallpaper and icons)                                       |
|                                                              |
|--------------------------------------------------------------|
|[##] Dana Reyes (dreyes)  | HB-DESK-03 |  [Switch] [Sign out] |
|     Using Dana's open screen                         09:42   |
+--------------------------------------------------------------+
```
For: no hidden state, cheapest build, the claim line lives with the account. Against: crowded at 800px wide; no room to grow; reads less like a PC.

### C. Full start panel with sections

```
+--------------------------------------------------------------+
|  +-------------------------------+                           |
|  | [##] Dana Reyes   dreyes      |                           |
|  |-------------------------------|                           |
|  | THIS PC                       |                           |
|  |  HB-DESK-03, Harbour office   |                           |
|  |  Remote through Drop box:     |                           |
|  |  comms room (when remote)     |                           |
|  |-------------------------------|                           |
|  | PLACES                        |                           |
|  |  > Desktop                    |                           |
|  |  > \\HB-FS01\Scanned-Inbox    |                           |
|  |-------------------------------|                           |
|  | > Lock    > Switch   > Sign out|                          |
|  +-------------------------------+                           |
|[Start]|                                HB-DESK-03   09:42    |
+--------------------------------------------------------------+
```
For: most like a real PC; mapped shares one click away; teaches where the player is on the network. Against: largest build; "Lock" is new (a held session that needs the password again on return, server state); "Places" duplicates desktop icons.

What else could go in (any option): in-game clock (`game-clock.js`), network name, remote link name, held sessions elsewhere, a Notepad shortcut. Left out on purpose: anything that duplicates the inventory.

## 4. Answers and questions for the user

### Answers
- **main3-01**: yes, a different look on purpose. The Wi-Fi key uses the password minigame in "prompt" mode (`passwordScreenKind`): a plain dark panel with a 2px frame and no wallpaper, used for any lock that is not a computer (Wi-Fi keys, archive passwords). Computer locks keep the monitor and wallpaper. Same minigame, two looks. Whether the prompt gets the theme skin is q98.
- **main3-12**: the stick is there but hard to see. It is the small blue square just left of the player's head (about 657,515 in the shot). It uses the drop box sprite (`drop_box1`), it landed under the player's head, and the candle table crowds it. Fix: a USB stick sprite (art) and a drop spot in front of the feet (slice 8).
- **main3-13**: yes. The main3 shots (games 1750 to 1753) were taken on main before the network view headings change (game 1801), so main3-04, 06, 09, 10 and 13 all show the old layout. They are retaken in slice 1.
- **main3-05**: yes, the landscape desktop CSS applies to every desktop container, remote ones included; the shot predates it.
- **main2-21**: the emulation screen is still there, but only for half a second before the result. Slice 3a holds it for at least 1.5 s.
- **Stepped corners**: answered by the user (2026-11-12): stepped corners are pixel art and stay. No question needed.

### Questions (decisions form numbers)
- **q90** (main2-16): "add actions to that list of actions": does this mean icons on the two entries (planned), or new entries as well? If new entries, which?
- **q91** (slice 4): Wearables without a menu: where should Drop and Examine go? Proposal: the confirm shows the item's description (Examine) and has a third button "Drop here".
- **q92** (slice 2b): Remote sign-in tiles: show headshots only for accounts the player has captured (no new information leaks), or the target PC's own picker as at the keyboard (the server returns it only when the target is reachable through the player's foothold)?
- **q93** (slice 6): Start menu: A, B or C? If C, do you want Lock (new server state)?
- **q94** (slice 6): m01 desktop: may slice 6 add `host` and `desktopUser` (Kevin) to m01's IT Monitoring Station? Other missions' PCs too, or only on request?
- **q95** (slice 6): Wallpapers: how many, and drawn by hand in the free editor or generated (count to confirm first)?
- **q96**: main-13, main-15 and the after-reload down view were marked unsure with no note: what looked wrong?
- **q97** (slice 3b): Copies at access-list doors are tried one at a time through the copier's Emulate. This reverses a decided server rule: today, when the player holds several cards, the server answers "a copy opened it" without saying which one, on purpose, so a door never reveals whose identity it admits. Trying one copy at a time lets a player learn that by trial. Is that fine as in-world behaviour (planned), or should Emulate offer every saved copy in one request so the door still says only "a copy opened it"?
- **q98** (slice 2a): Wi-Fi and archive prompt: keep the plain 2px panel, or draw it with the ui-themes frame skin?

## 5. Art needs

Every item needs the user's approval before merge. The count of any generated image must be confirmed with the user first; o-icons picked hand drawing in the free pixel editor, so no paid generation is planned. Sizes are native; shown at whole-number scale.

| Art | Native size | Shown at | Notes |
|---|---|---|---|
| Desktop wallpapers, 3 to 5 | 320x200 (16:10) | x2 or fit at a whole number | Office-neutral (city, sea, abstract pattern, company logo). Also used on sign-in screens. Count is q95 |
| Copier menu icon (Flipper-like) | 32x32 | x2 in the 64px menu box | Copier palette: body #FF8200, light #ffb366, dark #b35a00, black screen with orange text. Until approved, slice 3a uses `rfid_cloner.png` at x2 |
| Take hand | none new | x2 | A frame of `assets/icons/hand_frames.png` (32px cells); user picks the frame |
| Keystroke injector (tray) | 24x24 | tray scale | Must not look like the drop box or the stick |
| USB stick (tray and floor) | 24x24 tray, about 12x8 floor | x1 world | Replaces `drop_box1` on `kit_stick` |
| Link item icons: drop box link, implant link, Wi-Fi link | 24x24 each | tray scale | Replace the shared rack icon |
| Desk USB socket, empty and with implant | about 16x12, two states | x1 world | Replaces `network_rack1` on the docks |
| Network view: headless device (door controller) | 36x24 | x2 (72x48, as the PC icon) | Today it gets the PC icon |
| Network view: PC powered down | 36x24 | x2 | Dark-screen variant of the PC icon, for "(powered down)" |
| Network share icon (share header, view rows) | 26x18 | x2 (52x36) | Or keep `m09_folder1` and draw nothing |
| Start button, Lock and Sign out glyphs | 16x16 each | x2 | Only for mock-up A or C; text-only buttons need none |

Headshots for the start menu and remote tiles use the existing portraits.

## 6. Deferred

- Room dressing for the access and office-life test scenarios: PCs stand on the floor (main-11, main-22), the door-controller store is dressed with candles and ritual rugs (main3-12). Once the features settle, one full mission-dressing pass builds a new set of rooms for the office-life scenarios (skill `mission-room-dressing`).
- Proper office-life scenarios to replace the test ones (main-24).
- Still open from earlier screenshot reviews: door captions far from their doors, the reader icon drawn over the player at a back-wall door (the walk-behind convention), the player hidden behind the gate sprite (main-16).
- Removing the duplicate X from every other `gameConfirm` (slice 4 removes it from the wearable confirm only): a later pass with retakes of main-18, main-25 and main3-14, if the user wants it.
- Card cancellation at access-list doors: being fixed in build/revoked-cards, not in this round.
- o-vest (leave) and o-feed-replay (replay): no work.
