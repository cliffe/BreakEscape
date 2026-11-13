# UX feedback round: work plan

Source: the user's screenshot review of the access control, networking and office life features (review page, 2026-11-12), per-screen verdicts and notes plus eight option picks. Planning only: nothing here is built yet. All of build/ux-access, build/ux-devices and build/unlock-gaps-r1 are on main, so "now" below means main at c9a4f7a84.

Standing rules for every slice: the pixel-art UI rule (2px solid square borders or the ui-themes.css 9-slice skin; GNF, Press Start 2P or VT323 only; no hairlines, radius, soft shadows or gradients; icons at whole-number scale). One clarification from this review: **stepped corners drawn with a pixel clip-path (the card copier's frame, the PC monitor bezel) are pixel art and stay**. No image generation inside any slice: art is listed in section 5 and waits for the user.

Sync size: no slice adds to synced player state, except the optional Lock in start menu mock-up C (one boolean on a held session, server side, bounded by the number of sign-in PCs). Each slice says so again in its build log.

## 1. Every note and pick

Size: S under half a day, M about a day, L two days or more. Risk: chance of breaking something that works now.

### Change and unsure notes, and "ok" notes that ask for work

| Shot | What the user asked | Code that draws it | Change | Size | Risk |
|---|---|---|---|---|---|
| main-01 (ok) | Move the post-it off centre | `css/password-minigame.css` `.password-minigame-area .postit-note` (sign-in mode, centred under the bezel) | Pin the note to the bezel's lower-left, overlapping the frame, as the desktop's note already is (`.container-minigame.desktop-mode > .postit-note`) | S | Low |
| main-12 | Same: post-it off centre, to the left | as main-01 | as main-01 | (with main-01) | Low |
| main-11 | Post-it icon down, its bottom level with the PC sprite's bottom; PC on a desk, not the floor | `js/systems/postit-marks.js` `postitPosition` (inset from the top-left) | Anchor at the bottom-left: `y = top + h - POSTIT_SIZE/2` (no bottom inset), x as now. Desk: deferred (section 6) | S | Low (update its node test) |
| main-14 (ok) | Add a simple start menu: headshot, name, maybe computer name, Lock or Log out; what else? Mock up options | `js/minigames/container/container-minigame.js` `accountBarHtml`, `createDesktopUI` (the empty `.desktop-taskbar`) | New taskbar and start menu in the monitor; mock-ups in section 3 | M (A) to L (C) | Medium: touches every desktop container |
| after b07 (m01 desktop) | New pixel-art wallpapers; show the PC name and who is logged in (Kevin) even on a PC with no sign-in | `container-minigame.css` `.desktop-wallpaper` (one file, `assets/mini-games/desktop-wallpaper.png`, 320x320) | Optional PC fields `host` and `desktopUser` (name, character key) shown in the taskbar; `wallpaper` field per PC with a scenario default; new wallpapers (art, section 5) | M | Low (fields optional; m01 edit needs the user's yes) |
| main-16 | Gate refusal bark: use the new speech bubble | `js/systems/npc-barks.js` `_renderBark` (toast) and `_showBarkIcon` (pulsing talk.png); `js/systems/npc-world-bubbles.js` (needs-only today) | See o-barks | M | Medium |
| main2-16 (ok) | Add icons to the menu entries: the hand for Take, a new Flipper-like icon in the copier's colours for Copy | `js/systems/action-menu.js` `objectActions`; `js/ui/interaction-menu.js` already draws `icon: {src, frame, cols, cell}` in a 64px box | Pass `icon` on both entries: Take uses a frame of `assets/icons/hand_frames.png` (32px cells, x2); Copy uses the new copier icon (art) | S | Low |
| main2-17 | Keep the copier's pixel rounded corners; keep the other changes | `css/rfid-minigame.css` `.flipper-zero-frame` (commit 6990989ac removed the stepped `clip-path` polygon) | Restore the stepped clip-path from 6990989ac^; keep 2px borders, pixel icons, named card. Check the inset bevel at the clipped corners | S | Low |
| main2-19 (ok) | Keep the new door-reader screen | `js/minigames/rfid/rfid-ui.js` `showDoorScreen` | None | - | - |
| main2-21 (unsure) | We should still see the emulation details screen | `rfid-ui.js` `showEmulationScreen` (shows for 500 ms, then `handleEmulate`) | Hold the screen at least 1.5 s; breadcrumb "At the reader > Emulating" when opened from a door | S | Low |
| main2-22 | The rounded frame is pixel art, keep it | as main2-17 | as main2-17 | (with main2-17) | Low |
| main2-26 | Hook-with-vests tray icon is fine; no menu, go straight to the confirm | `js/systems/inventory-menu.js` (droppable wearable gets "Put on / Drop here / Examine"); `js/systems/wearables.js` | A wearable click opens the Put on / Take off confirm at once; where Drop and Examine go is question Q2 | S | Low to Medium (drop path) |
| main-22 (note) | Test PCs on the floor; full room-dressing pass later | test scenario rooms | Deferred (section 6) | - | - |
| main-24 (unsure) | Fine for now; build proper scenarios once features settle | `test_access_work` | Deferred (section 6) | - | - |
| main-27 (ok) | Should remote sign-in show account headshots like the local screen? | `js/systems/unlock-system.js` `openLoginSignIn` (remote: no tiles by design, slice 9.3a 4.4) | Part of the shared sign-in component (main3-07); what the tiles hold is Q3 | (with main3-07) | Medium |
| main3-01 (ok) | Is the Wi-Fi prompt a different theme from the password minigame? | `password-minigame.js` `passwordScreenKind` returns `prompt` for a join; `.prompt-mode` CSS | Answer in section 4. Optional: draw the prompt panel with the ui-themes frame skin (Q10) | S | Low |
| main3-02 | Wi-Fi joined view: make it look better | `js/minigames/network-view/network-view-minigame.js` `render`; `css/network-view-minigame.css` | Panel sized to its content (no tall empty panel), a "Joined Guest Wi-Fi" status line, Wi-Fi icon by the title, rows in the same heading layout as b03 | S | Low |
| main3-04 (ok) | All borders 2px, or no borders round the rows and a contrasting fill | `network-view-minigame.css` (block 2px, each row another 2px inside it, outer 4px) | Drop row borders; rows get a lighter fill on the block's darker fill with a 4px gap; block keeps its 2px frame | S | Low |
| main3-05 | Same landscape desktop fix as above? | `container-minigame.css` `.desktop-mode` rules (apply to remote desktops too) | Yes, already applies; the shot predates it. Retake. Also: share icon labels show the share name only, UNC path in the tooltip | S | Low |
| main3-06 | Same headings layout as the jack foothold view | `network-view-minigame.js` `blockSectionHtml` (same code since b03) | Retake to confirm; fix only if it differs | S | Low |
| main3-07 | Make the sign-in with account headshots one shared, reusable minigame | `password-minigame.js` sign-in mode (tiles, `applyTilePortrait`, captured sign-ins block) | Extract a sign-in screen module used by the local, remote and share sign-ins; the remote screen gets tiles (Q3), fixed field widths, a backed title line | M | Medium (pinned by `password-signin-mode.test.mjs`) |
| main3-08 | Fix the header image | `container-minigame.js` `openMappedShare` (`name: 'network_share'` asks for `assets/objects/network_share.png`, which does not exist) | Point the header at the share icon (`m09_folder1`, or the new share icon); open a share as a folder window (title bar with the UNC path, file list, no wallpaper) | S (header) + M (folder window) | Low |
| main3-10 | Improve it, with headings like the others | network view (pre-b03 shot) | Retake after b03; subtitle "<device> on <place>" for every foothold kind | S | Low |
| main3-11 | Make it look better (implant world view) | `scenarios/test_access_networks` `sam_dock`, `kiosk_dock`, `door_dock` use `network_rack1` (a server rack) | A desk USB socket sprite with an "implant in" state; distinct tray icons for the link items (art) | S code + art | Low |
| main3-12 | No USB stick visible in the shot? | `kit_stick` uses `drop_box1`; `js/systems/item-drop.js` drop spot | Answer in section 4. A USB stick sprite (art); drop spot in front of the player's feet, not under the head | S + art | Low |
| main3-13 (unsure) | Shots taken before the headings layout? Be consistent | network view | Answer in section 4. Same header layout and naming for all foothold kinds (see o-link-names) | (with o-link-names) | Low |
| main3-15 | Add "(powered down)" | `network-view-minigame.js` `rowHtml` (`not_responding`), server `host_service_off?` | Part of the down-device language below | (with next row) | Low |
| after own-down (note) | One shared design language for down devices, e.g. "(down)" | `network-view-minigame.js` (`(no route)`, `No route to X`, `not responding`, `remote sign-in off`, `linkOffText`) | One helper for every down state: name tag "(down)" for no route, "(powered down)" for a host whose service is off, link title "(down)" when its own PC is off; grey row, grey icon, plain (not italic) reason text, "Session kept: <name>" for a held session | M | Low (update `network-view.test.mjs`) |
| after own-down reload (unsure) | No note | same view after a reload | Q7 | - | - |
| main-13 (unsure) | No note | room view, open screen vs locked | Q7 | - | - |
| main-15 (unsure) | No note | gate hall | Q7 | - | - |

### Option picks

| Option | Pick | What it means | Code | Size | Risk |
|---|---|---|---|---|---|
| o-seated-pc | msg | Picking an in-use PC from the menu says "Omar is using this PC" | Already on main: `core/game.js` lines 2962 to 2981 (tap pick R1 M2, R2 m3), `unlock-system.js` `pcInUseBy`, `showPcInUse` | Retake main-10 only | - | - |
| o-link-names | server | One pattern "<device>: <place>" from the server for every foothold kind; authored names still override | `app/models/break_escape/network_access.rb` (Wi-Fi line 362, implant 502/540, jack 571) | Default device word per kind (Drop box, Keystroke injector, USB stick, Wi-Fi) and place from the source object's room name; drop the mixed `linkName`/`name` overrides from `test_access_networks` so it shows the default; update Rails tests that pin names | M | Medium (Rails tests, validator) |
| o-icons | draw | Inventory icons drawn by hand in the free pixel editor, approved by the user before merge | art, section 5 | - | - |
| o-vest | leave | Whole-character disguises stay | none | - | - |
| o-acl-doors | leave, with a rule | Held badges open access-list doors with no step; a copy opens only through the copier's emulation | `js/systems/unlock-system.js` `heldRfidCardIds`, `requestRfidAccessUnlock`; `rfid-ui.js` `showDoorScreen` | First request sends only physical keycards; if refused, or none held, and the copier has saved cards, open the copier on the door screen; Emulate sends that one card id. Server API unchanged | M | Medium (pinned by `access-rfid-acl.test.mjs`) |
| o-barks | bubble | Barks from a person NPC in view show as the new speech bubble over them; no pulsing talk icon and no toast. Toast kept for NPCs out of view and phone contacts | `npc-barks.js` `_renderBark`, `_showBarkIcon`; `npc-world-bubbles.js` | A `say(npcId, line, ms)` bubble source in npc-world-bubbles that does not need a needs state; barks route there when the NPC's sprite is in the player's room, lit and no minigame is open; TTS unchanged; pulsing icon removed (it also scales by 1.25, a non-integer scale) | M | Medium |
| o-feed-replay | replay | Keep replaying held toasts, Friendface included | none | - | - |
| o-pixel-pass | now | One branch: pixel pass on the older minigames the sweep flagged | see slice 7 | L | Medium (many files, visual only) |

## 2. Slices, in build order

Slices 1, 3, 4 and 5 touch different files and can run in parallel. Slice 2 and slice 6 both change `container-minigame.js` and run one after the other. Slice 7 leaves the container and password minigames alone. Slice 8 waits for approved art.

### Slice 1: network views (consistency, down language, link names)
- Down-device language (after own-down, main3-15): one exported helper `downState(row|block)` returning `{ tag, reason }`; tags "(down)", "(powered down)"; reasons "No route", "Powered down", "Remote sign-in off" (not a down state: no tag, row stays readable); "Session kept: <name>". Link title gets "(down)" when its implant's PC is off.
- Rows without borders, contrast fill (main3-04).
- Wi-Fi joined view (main3-02): content-height panel, joined status line, title icon.
- One header for every foothold kind: title is the link name, subtitle "<device> on <place>" (main3-10, main3-13).
- Server link names (o-link-names), and the test scenario's overrides removed.
- Tests: `test/js/network-view.test.mjs` (down tags per state, no italics, row CSS has no border), Rails tests for the default names (find with `grep -rn "Drop box\|Network drop box" test/`), validator on `test_access_networks` (0 ❌).
- Retake: main3-02, main3-04 (as b03), main3-06, main3-09, main3-10, main3-13, main3-15, after own-down and after reload.

### Slice 2: sign-in screens, remote desktop and shares
- Post-it on the bezel's lower-left in sign-in mode (main-01, main-12); room mark bottom-aligned (main-11).
- Shared sign-in module (main3-07, main-27): one renderer for tiles, typed name, password, captured sign-ins, used by the local, remote and share sign-ins. Remote tiles per Q3. Title line backed (white on sky was hard to read).
- Remote desktop share icons: name only, UNC in the tooltip (main3-05).
- Share opened as a folder window with a working header image (main3-08).
- Tests: `password-signin-mode.test.mjs`, `postit-marks` test, `container-transfer-dialog.test.mjs`, a new test for share labels and the share header source; every test file importing the password or container minigame.
- Retake: main-01, main-11, main-12, main-27, main3-05, main3-07, main3-08, after b07 (mission desktop unchanged).

### Slice 3: card copier and RFID doors
- Stepped corners back on the copier frame (main2-17, main2-22).
- Emulation screen held 1.5 s, door breadcrumb (main2-21).
- Copies through the copier at access-list doors (o-acl-doors).
- Menu icons: hand frame for Take, copier icon for Copy (main2-16; placeholder: `assets/objects/rfid_cloner.png` until the new icon is approved).
- Tests: `rfid-door-screen.test.mjs` (screen held, breadcrumb), `access-rfid-acl.test.mjs` (physical cards first, copy only via emulate), `action-menu.test.mjs` (icons on both entries), a CSS check that `.flipper-zero-frame` has the stepped clip-path; Rails `access_model_rfid_test.rb` (a single-id copy request).
- Retake: main2-16, main2-17, main2-19, main2-21, main2-22, main2-23, main2-25 (copy now needs the copier).

### Slice 4: wearable click
- A wearable in the tray opens the confirm directly (main2-26); Drop and Examine per Q2. While here, drop the X that duplicates Cancel on `gameConfirm` (devices finding 4d).
- Tests: inventory-menu test (wearable entries), wearables test (click opens the confirm).
- Retake: main2-26 (now shows the confirm), main2-27.

### Slice 5: speech bubble barks
- As o-barks. Bubble wraps at about 24 characters, at most three lines; lifetime from `bark-lifetime.js`; voiced through the existing `world.speak` / `_speakBark` path; the talk icon is muted while the bubble shows, as for chat.
- Tests: a routing function exported from npc-barks (in view gives bubble, out of view gives toast, phone NPC gives toast), `npc-world-bubbles` `say` lifetime and pooling, no tween on `talk` for a bark; live proof in test_access_habits at Sara's gate.
- Retake: main-16; one phone bark to show the toast still works.

### Slice 6: desktop taskbar, start menu, wallpapers
- Start menu per the user's pick from section 3. Headshot from the tile portrait (`applyTilePortrait`), cached client side at sign-in; not synced.
- Non-sign-in PCs: computer name and optional `desktopUser` in the taskbar (after b07).
- `wallpaper` field per PC and a scenario default; hashed choice among the approved set when none is set.
- Tests: container tests for the taskbar (signed in, claimed, remote, no sign-in), wallpaper selection, keyboard Esc closes the menu first.
- Retake: main-03, main-04, main-14 (b06), main3-05, after b07, plus one mission desktop (m02) to check nothing else moved.

### Slice 7: pixel pass on older minigames
- From the layout sweep (`UNLOCK_GAPS_BUILD_LOG.md`, worst first): drug-library-integrity (1px borders, Courier New, radius), PIN pad (soft shadows, gradients), scada-historian (hairlines, Courier New), biometrics, BLE and Bluetooth scanners, SIEM, text-file (system UI font), forensic data platform (also its line 434 border), NCSC brief, network architecture, infusion pump, notes; and the framework shell's one soft shadow and two gradients (`.minigame-container`, `.minigame-game-container`).
- Not in scope: the container desktop bezel and password screens (slices 2 and 6).
- Tests: a computed-style sweep script over the registered minigames, as the sweep did, failing on any border under 2px, radius without a pixel clip-path, blurred shadow, gradient or non-pixel font; existing tests of each minigame.
- Screenshots: before and after of every minigame touched, at 1400x1000 and 800x600.

### Slice 8: art integration (after the user approves the art)
- Wire the approved icons and sprites: tray icons for the kit and link items, USB socket and stick sprites, network view icons, the copier menu icon, wallpapers.
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
For: familiar, small, frees the header (Switch user and Sign out leave the title area); the computer name and in-game time sit in the taskbar. Against: the account is one click away, so the claim banner (b06) still has to stay in the header so a borrowed session is never hidden.

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
- **main3-01**: yes, a different look on purpose. The Wi-Fi key uses the password minigame in "prompt" mode (`passwordScreenKind`): a plain dark panel with a 2px frame and no wallpaper, used for any lock that is not a computer (Wi-Fi keys, archive passwords). Computer locks keep the monitor and wallpaper. Same minigame, two looks.
- **main3-12**: the stick is there but hard to see. It is the small blue square just left of the player's head (about 657,515 in the shot). It uses the drop box sprite (`drop_box1`), it landed under the player's head, and the candle table crowds it. Fix: a USB stick sprite (art) and a drop spot in front of the feet.
- **main3-13**: yes. The main3 shots (games 1750 to 1753) were taken on main before the network view headings change (b03, game 1801), so main3-04, 06, 09, 10 and 13 all show the old layout. They are retaken in slice 1.
- **main3-05**: yes, the landscape desktop CSS applies to every desktop container, remote ones included; the shot predates it.
- **main2-21**: the emulation screen is still there, but only for half a second before the result. Slice 3 holds it for 1.5 s.

### Questions
- Q1. main2-16: "add actions to that list of actions": does this mean icons on the two entries (planned), or new entries as well? If new entries, which?
- Q2. Wearables without a menu: where should Drop and Examine go? Proposal: the confirm shows the item's description (Examine) and has a third button "Drop here".
- Q3. Remote sign-in tiles: show headshots only for accounts the player has captured (no new information leaks), or the target PC's own picker as at the keyboard?
- Q4. Start menu: A, B or C? If C, do you want Lock (new server state)?
- Q5. m01 desktop: may slice 6 add `host` and `desktopUser` (Kevin) to m01's IT Monitoring Station? Other missions' PCs too, or only on request?
- Q6. Wallpapers: how many, and drawn by hand in the free editor or generated (count to confirm first)?
- Q7. main-13, main-15 and the after-reload down view were marked unsure with no note: what looked wrong?
- Q8. Copies at access-list doors are tried one at a time, so a player can learn which copy a door admits by trying each. Fine as in-world behaviour?
- Q9. May the pixel-art rule say that stepped clip-path corners count as pixel art, so reviews stop flagging them?
- Q10. Wi-Fi and archive prompt: keep the plain 2px panel, or draw it with the ui-themes frame skin?

## 5. Art needs

Every item needs the user's approval before merge. The count of any generated image must be confirmed with the user first; o-icons picked hand drawing in the free pixel editor, so no paid generation is planned. Sizes are native; shown at whole-number scale.

| Art | Native size | Shown at | Notes |
|---|---|---|---|
| Desktop wallpapers, 3 to 5 | 320x200 (16:10) | x2 or fit at a whole number | Office-neutral (city, sea, abstract pattern, company logo). Also used on sign-in screens. Count is Q6 |
| Copier menu icon (Flipper-like) | 32x32 | x2 in the 64px menu box | Copier palette: body #FF8200, light #ffb366, dark #b35a00, black screen with orange text |
| Take hand | none new | x2 | A frame of `assets/icons/hand_frames.png` (32px cells); user picks the frame |
| Keystroke injector (tray) | 24x24 | tray scale | Must not look like the drop box or the stick |
| USB stick (tray and floor) | 24x24 tray, about 12x8 floor | x1 world | Replaces `drop_box1` on `kit_stick` |
| Link item icons: drop box link, implant link, Wi-Fi link | 24x24 each | tray scale | Replace the shared rack icon |
| Desk USB socket, empty and with implant | about 16x12, two states | x1 world | Replaces `network_rack1` on the docks |
| Network view: headless device (door controller) | 36x24 | x2 (72x48, as the PC icon) | Today it gets the PC icon |
| Network view: PC powered down | 36x24 | x2 | Dark-screen variant of the PC icon, for "(powered down)" |
| Network share icon (share header, view rows) | 26x18 | x2 (52x36) | Or reuse `m09_folder1` and draw nothing |
| Start button, Lock and Sign out glyphs | 16x16 each | x2 | Only for mock-up A or C; text-only buttons need none |

Headshots for the start menu and remote tiles use the existing portraits.

## 6. Deferred

- Room dressing for the access and office-life test scenarios: PCs stand on the floor (main-11, main-22), the door-controller store is dressed with candles and ritual rugs (main3-12). Once the features settle, one full mission-dressing pass builds a new set of rooms for the Sims-like office (skill `mission-room-dressing`).
- Proper office-life scenarios to replace the test ones (main-24).
- From earlier rounds, still open: door captions far from their doors (devices 6b), reader icon drawn over the player at a back-wall door (6c, the walk-behind convention), player hidden behind the gate sprite (main-16 card note).
- o-vest (leave) and o-feed-replay (replay): no work.
