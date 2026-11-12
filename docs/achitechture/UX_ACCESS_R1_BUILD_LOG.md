# UX access R1: build log

Branch `build/ux-access`, from main 13a0f9f96. Source: the screenshot pass in the session scratchpad (`ux-shots/main/`, 27 shots). This round stopped at the tool-call limit before the live proof; see the handover section at the end.

## Findings

| # | Finding | Status |
|---|---------|--------|
| 1 | Notepad tray icon broken ("Notep") | Fixed |
| 2 | Lockout answer shown three times | Fixed |
| 3 | PC desktop runs off the viewport; buttons on wallpaper; names break mid-word | Fixed (CSS), needs live check |
| 4 | Sign-in error lines unreadable on wallpaper | Fixed |
| 5 | Claimed open session looks like a password sign-in | Fixed |
| 6 | Clicking a PC while its owner sits there opens a conversation | Not done: investigation open |
| 7 | Post-it breaks a password at its hyphen | Fixed |
| 8 | Needs debug overlay text runs out of the room | Fixed (kept on in test scenarios) |
| 9 | Guard's bark shows as a toast far from the guard | Option for the user |
| 10 | Network view subtitle, icons, locked-share note, row order | Fixed |
| 11 | Frustration icon on a dark square chip | Not done |
| 12 | Toast stacking, Cancel looks disabled, Copy/Move widths, "type a username" overflow | Copy/Move widths and tile label fixed; the rest not done |
| 13 | Pixel-art rule across the access UIs | Partly done |

### 1. Notepad icon (fixed)
Cause: a wrong image key, not a missing asset. The tray picks the item's `sprite`, then its texture, then its `type` (`trayImageKey`, inventory.js). The notepad's mock sprite named `notes5` only as its `name`, which the tray never reads, so it asked for `objects/notepad.png`, which does not exist; the type fallback asked for the same file. The notepad's data now comes from `notepadItemData()` with `sprite: 'notes5'`. Test: `test/js/inventory-restore-sprite-image.test.mjs` checks the key and that the file exists.

### 2. Lockout shown once (fixed)
`signInLockedOut` (password-minigame.js) now shows the server's message only on the screen's own message line, disables the form, and closes the screen after `LOCKOUT_CLOSE_MS` (2.5 s, was 1.5 s). The toast (which covered the PC title) and the red failure box are gone. The screen still closes on a lockout, as before. Test: `password-signin-mode.test.mjs`.

### 3. PC desktop (fixed in CSS, not yet seen live)
`container-minigame.css`: in desktop mode the monitor is landscape, `max-width: 880px`, the screen keeps 16:10 and is capped at `calc(100vh - 440px)`, so it ends above the framework's footer buttons, which then sit on the dark backdrop. Icon labels are 112px wide (were 80px), so "Staff handbook.txt" wraps at its space; a single word longer than the line still breaks as a last resort. Pixel outline on labels instead of a blurred shadow.

Not done: moving Close and Add to Notepad onto a taskbar inside the monitor. Those are the framework's footer controls, which build/unlock-gaps-r1 owns; changing them here would collide. The empty `.desktop-taskbar` is restyled as a 2px-bordered bar.

Collision note: these rules are scoped to `.desktop-mode` and `.container-monitor-bezel`, which every desktop container uses (mission PCs too), not only sign-in PCs. If build/unlock-gaps-r1 changes the container view's bezel or sizing, merge by hand.

### 4. Sign-in error lines (fixed)
`.signin-message` has a solid dark backing and a 2px border; errors get a dark red backing, a red border and lighter text.

### 5. Claimed session (fixed)
The desktop of a claimed session shows a banner above the account bar, and the account line reads "Using <name>'s session" instead of "Signed in as". Owner claim: "You're on <name>'s open screen. It ends when they come back or the screen locks." Guest claim: "You're on the screen <name> left open. It ends when the screen locks." `pc-sessions.js` `publicSession` now carries `guest: true` for a guest claim so the desktop can tell them apart (bounded: one boolean, client side only, never synced). Test: `container-transfer-dialog.test.mjs` (`claimLineText`).

### 6. PC click lands on the seated owner (not done)
Read so far: a tap gathers objects and NPCs near it (`gatherInteractablesNearClick`, game.js); two or more give a menu, one acts at once. The owner only gives way when walking away (`npcGivesWay`, interaction-reach.js). Shot 10 suggests the PC was not gathered at all (only the NPC), so the click went straight to the conversation. Why the PC was left out (tap slop, range, or the seated NPC's body covering the PC's hit area) needs a live check before any change. Options for the user once the cause is known:
- A. When a seated NPC is at the PC under the tap, the PC wins and gives the "is using this PC" answer; talking needs a tap on the head or the E key.
- B. Always list both in the menu (PC and person) when an NPC sits at a PC.
- C. Leave it: talking to the person is a fair answer.
Recommendation: B, as it never hides either action.

### 7. Post-it words (fixed)
New `escapeHtmlKeepWords` (utils/escape-html.js) escapes the note and wraps each word in `span.keep-whole` (`white-space: nowrap`, main.css). Used for the sign-in screen's note, the classic password screen's note and the desktop's note. Notes are 260px wide (were 200px). Tests: `password-signin-mode.test.mjs`, `minigame-title-escape.test.mjs` (still escaped).

### 8. Needs debug overlay (fixed, kept on)
It is on because the access test scenarios set `"needsDebugOverlay": true` (test scenarios only; `window.__test.needs.overlay(false)` turns it off). Choice: leave it on, keep the text over the NPC. The job line now wraps at spaces into lines of at most 16 characters, centred over the bars (`wrapLabel`, npc-needs-debug.js). Test: `npc-needs-debug.test.mjs`. Its Phaser font is still `monospace` (debug only; noted under 13).

### 9. Guard's bark (option)
An event mapping's `bark` always goes to the phone-style bark system (npc-manager.js, `barkSystem.showBark`), so an in-person guard's line appears as a toast in the corner. World speech bubbles exist (npc-world-bubbles.js) but are fed only by the needs system (`states.get(id).saying`). Options:
- A. For a person NPC in the player's room, send event-mapping barks to a world bubble over the NPC (a small public `say(npcId, line)` on the needs system, or a bubble source in npc-world-bubbles.js that does not need a needs state). Voicing goes through the same `world.speak` path.
- B. Keep the toast but name it as speech ("Sara Quinn, beside you: ...") and place it nearer the centre.
Recommendation: A. It is an engine change across npc-manager and the bubble module, so it wants its own plan and tests. The player hidden behind the gate sprite was not looked at.

### 10. Network view (fixed)
- Subtitle: the link item's trailing "Open it to see what it reaches." is dropped inside the view (`viewObservations`). The inventory text is unchanged. The capital in "Your Network drop box" comes from the server (`network_access.rb`, device name), left alone because Rails tests pin that text.
- Icons at whole-number scale: computers 72x48 (x2), shares 52x36 (x2), printers 48x48 (x3); padlock at its own 32px.
- Locked share: a "Locked" padlock badge where other rows have a button, and the reason as a plain line under the share's name.
- Order: computers, then file shares, then printers and other devices, each by name with numbers compared as numbers (`displayOrder`), with group headings when more than one kind is listed. Further-network blocks use the same order.
Tests: `network-view.test.mjs`.

### 11. Frustration icon (not done)
Not reached this round.

### 12. Smaller issues
- Copy / Move dialog: buttons stack at one full width (fixed).
- "type a username" now reads "type a name" so it fits its tile (fixed).
- Toasts and description boxes stacking, and the confirm dialog's Cancel looking disabled: not reached.

### 13. Pixel-art rule (partly done)
Done: sign-in and classic password screens and the desktop: no gradients or 19px radius on the bezels, no soft shadows, post-it and its pin with 2px borders and square corners, post-it font GNF (Pixelify Sans dropped: its C reads as O and 5 as S, which matters on a password), post-its square to the screen (rotation smeared the pixel font); network view italics removed.
Not done: Friendface, the phone, toasts and dialogs; the needs debug overlay font.

## Tests run (single files, no lock)
password-signin-mode (18 pass), container-transfer-dialog (14), inventory-restore-sprite-image (10), network-view (24), minigame-title-escape (23), npc-needs-debug (8); every test file importing password-minigame, container-minigame, escape-html, inventory.js, pc-sessions or network-view-minigame: 0 failures. No Rails files changed.

## Handover
- Done: findings 1, 2, 3 (CSS), 4, 5, 7, 8, 10, and parts of 12 and 13. Commits 88fbc2072, 39296480d, plus this log.
- Open: live proof on a keyless :3063 server and the after shots (none taken; no server started, no game ids created); finding 6 (live check of why the PC is not gathered, then the option above); 9 (option); 11; 12 (toasts, Cancel); 13 (Friendface, phone, toasts, dialogs).
- Files touched: public/break_escape/js/utils/escape-html.js, css/main.css, js/systems/inventory.js, js/systems/pc-sessions.js, js/systems/npc-needs-debug.js, js/minigames/password/password-minigame.js, css/password-minigame.css, js/minigames/container/container-minigame.js, css/container-minigame.css, js/minigames/network-view/network-view-minigame.js, css/network-view-minigame.css, and the tests named above.
- Gotchas: `escaping-shared-helpers.test.mjs` pins the exact `import { escapeHtml } from ...` line, so the new helper is imported on a line of its own. The desktop sizing rule uses `100vh`; check it at 1400x1000 and at a short viewport before merging.

## Round 2 (live proof, network view points, finding 6)

Keyless server on :3063, headless, 1400x1000, setFPS(20) with fixed steps. Games 1766 (test_access_signin) and 1767 (test_access_habits), made with new-game.rb (both scenarios have Mission rows). After shots and manifest: session scratchpad `ux-shots/after_access/`.

### Seen live and fixed in this round
- Notepad icon, lockout once, backed sign-in errors, landscape desktop with the footer on the backdrop, Copy/Move button widths, post-it password kept whole, wrapped debug label: all as intended.
- Desktop post-it was loose at the window's left edge (it was appended to the page, not the monitor). Now appended to `.container-minigame.desktop-mode` and placed on the monitor's lower-left frame.
- Desktop icons zoomed 1.1x on hover (non-integer scale of pixel art): removed; the frame highlight stays.
- Desktop icon labels were Press Start 2P at 8px, hard to read: now GNF 16px.
- Switch-user line "Signed in now" was yellow straight on the sky: now on the same dark backing as the message line (CSS fix, not re-shot).

### Network view (review R3 of build/readme-93b, after merging main 72e26f911)
- m1: already met here; each kind is drawn at a whole-number scale of its own size (R1), and the merge kept those rules.
- m2: the up-block title reads "Server network, through HB-FIN-02" (no em dash). The JS line landed in the merge commit be25bec9d; the test and CSS are in c6a6f45e9.
- n1: `.network-view` has `font-style: normal` and `font-synthesis: none`, and every descendant `font-style: normal`.

### Finding 6: cause
Live, with Omar seated at his PC and the player in reach of both, a real tap on the PC's centre shows the pick-one menu with "Omar's PC" and "Omar Haddad" (shot a10). So option B is already the behaviour when both are in reach. The before shot came from the harness clicking the PC's top-left corner from 43px away: the PC was out of reach (INTERACTION_RANGE is 32px), Omar (seated over it, drawn above it) was in reach, so `gatherInteractablesNearClick` returned one candidate and `pointerdown` acted on it before the object branch that would have walked to the PC. This is the same defect as the C3 replay's U3 (an in-reach phone taken when the out-of-reach stick under the pointer was tapped).

Not fixed here, by budget. Constraints for the fix, for its own branch: the single-candidate shortcut must not fire when the tap lies inside the bounds of an interactable object that is not that candidate and is out of reach; but a seated NPC drawn over the PC is also under the pointer, so for that case the choice is a menu that lists the out-of-reach PC (walk, then use) beside the NPC, or "PC wins". The out-of-reach object's walk is inline in `pointerdown` (game.js), so the menu option needs that walk pulled out into a function first. Tests needed: phone and stick (C3 U3), seated owner with the PC out of reach, seated owner with both in reach (menu stays), memo next to an NPC (menu stays), plain tap on a seated NPC's head (talk).

### Not done this round
- Claimed-session banner (owner and guest), network view, guard bark, the m01/m02 mission desktop check: no after shots (budget). The desktop CSS applies to every desktop container, so a mission PC still needs one look.
- Findings 11 (frustration chip), 12 (toast queue, Cancel styling), 13 (toasts, dialogs, debug overlay font): not started.

### Tests (single files, no lock)
network-view 26, container-transfer-dialog 14, password-signin-mode 18, inventory-restore-sprite-image 10, minigame-title-escape 23, npc-needs-debug 8; all 17 test files importing the container, password or network-view minigames: 0 failures.

## Round 2, part 2 (findings 11 to 13, the networks queue, the missing after shots)

Keyless server on :3067, headless, 1400x1000, setFPS(20) with fixed steps. Games 1801 (test_access_networks, given the drop box, keystroke injector and stick), 1802 (test_access_habits), 1804 (m01, not used: no door to the IT room), 1805 (test_needs_sims), 1812 (m01 with --start-room it_room). After shots b01 to b09 in the session scratchpad `ux-shots/after_access/`, appended to its manifest.

### Findings from R1
| # | Status | What changed |
|---|--------|--------------|
| 11 | Fixed | Action icons (`_make`, npc-action-icons.js) sit on the thought bubbles' light card with their dark outline, square. The dark chip is gone, so a "doing" icon and a "wanting" bubble read as one family (also the R2 queue's "two icon styles mixed"). Text stand-ins in VT323, dark on light. Shots b08, b09. |
| 12 | Fixed | Toast queue: at most two toasts on screen (`MAX_SHOWN_TOASTS`, notifications.js). A further info or success toast waits and shows as one goes; a waiting duplicate waits once; one that comes up while a panel is open joins the held queue. Warnings and errors still show at once. The confirm dialog's Cancel has full-strength text and no dimming filter. Tests: new `toast-queue.test.mjs` (5), `toast-duplicate.test.mjs` updated for the cap. Shots b02, b05, b08. |
| 13 | Fixed (toasts, dialogs, debug font) | Dialog buttons in GNF 20px like the dialog text (they were Press Start 2P 11px); no soft shadow on toasts and dialogs; toast progress bar 4px; display-dialog title rule 2px; themed success and failure messages keep the 2px outline and lose the 16px glow; the password field's focus glow is gone. Needs debug overlay text in VT323. Friendface and the phone are build/c3-replies's. |

### Networks queue (ux_queue_access_r2.md)
- Wi-Fi key and zip password on the PC sign-in skin: fixed. `passwordScreenKind` (password-minigame.js) gives a Wi-Fi join and any lock whose object type is not a computer (pc, laptop, workstation, terminal, tablet, kiosk, smartscreen, server and their numbered or hyphenated forms) a plain dark panel with a 2px frame, no wallpaper, and a light label. A Wi-Fi panel names the access point ("Join Wi-Fi: Guest access point"). The SSID itself is a withheld field until joined, so the access point's name is what the client can show. On the PC screen the green field label gets a dark backing. Test in `password-signin-mode.test.mjs`. Shot b01. The zip prompt in lab_social_engineering was not shot live.
- Network view: fixed. The title is the link's name alone; the own network is a block with its name as a heading, so "Wi-Fi: Guest Wi-Fi, on Guest Wi-Fi" no longer repeats and the office network is named beside a pivot's network. Every block heading is a bar (fill and 2px rule), so "Server network, through HB-FIN-02" stands out. A PC that is off or not responding is greyed with a grey icon, like a no-route row. Tests in `network-view.test.mjs`. Shot b03.
- Server breaker with no confirm or feedback: fixed in test_access_networks. It asks first, then a hint toast says the network is down; a second click says it is already off. Shots b04, b05.
- Keystroke injector used with no confirm: fixed in test_access_networks (confirm_action around grant_foothold; the server honours a grant under onConfirm, DeclaredGrants.executed?). Not shot live (needs a sign-in at Sam's PC first). Validator: 0 failures.
- Remote desktop share icon labels (full UNC path), a share opening as a full desktop, broken share header image: skipped. All three are in container-minigame.js, the container view that build/unlock-gaps-r1 owns. Suggested fix for that branch: label a `network_share` icon with the part before " (\\\\", keep the UNC path in the tooltip, give `openMappedShare` a folder mode without the wallpaper, and point the header at the share icon instead of `objects/network_share.png`.
- Link item naming across kinds ("Drop box: ...", "BadUSB: ...", "USB foothold: ..."): option. Names come from scenario `linkName`/`name` and the server's defaults (`network_access.rb`), with Rails tests pinning them. A. One pattern "<device>: <place>" by default on the server, authored names left alone. B. Leave it to the scenarios. Recommendation A, on its own branch with Rails tests.
- Observation panels staying for minutes: skipped (not reached).
- X2 extinguisher placed tiles from its door: skipped (scenario and engine placement in test_access_work).
- Padlock badge on food and sleep bubbles; Ruth's empty speech bubble in H4: skipped (not reached).
- Host icons and desktop thumbnails shrunk: host icons were already at whole-number scale (R1); desktop thumbnails are in the container view (build/unlock-gaps-r1).
- Duplicate toasts (build/dup-toast), inventory icon art (needs the user), the lab jack confirm text in lab_physical_pentest (scenario content, noted only): not touched.

### Missing after shots from R1
- Owner claim banner: b06 (game 1802). Guest claim: not shot. It needs a colleague's hot-desk borrow in test_access_work; the wording is covered by `container-transfer-dialog.test.mjs`.
- Network view: b03.
- Mission desktop: b07, m01 IT Monitoring Station. The desktop CSS holds on a mission PC: landscape monitor, footer on the backdrop, file label wrapped at its space.

### Collision notes
- notifications.js (the queue) is also build/dup-toast's file. The queue sits in `renderNotification` before the element is built and in `removeNotification`; merge by hand if that branch changes the same spots. `toast-duplicate.test.mjs` was updated for the cap.
- minigames-framework.css (two glow lines) sits beside build/unlock-gaps-r1's footer rules.

### Tests (single files, no lock)
toast-queue 5, toast-duplicate 8, password-signin-mode 19, network-view 26, npc-action-icons 4, npc-needs-debug 8, minigame-title-escape 23, grant-foothold-action, pc-policy, dungeon-graph-networks; every test file importing notifications.js, npc-action-icons, npc-needs-debug, password-minigame or network-view-minigame: 0 failures. Validator on test_access_networks: 0 failures. No Rails files changed.

## Code review R1 fixes

Review: `UX_ACCESS_CODE_REVIEW_R1.md` (0 blockers, 2 majors, 6 minors, 3 nits). Main 33c003230 and build/dup-toast d8b6721fb merged in first (fa6991cc1, f71eee5eb), both clean; the 8 toast test files passed on the merged tree before any change.

| # | Status | What changed |
|---|--------|--------------|
| M1 | Left for later | The build/unlock-gaps-r1 merge. That branch is still in review; the resolution to apply when it reaches main is below. |
| M2 | Fixed (0dc6762dc) | notifications.js: `shownToasts` counts only timed toasts, so a toast that stays until closed (Key Ring, the Mission Brief fallback) takes no place and never waits for one. A waiting toast shows after `MAX_TOAST_WAIT_MS` (4 s) even with both places taken, going over the cap for a moment. A waiting toast that comes up while a panel is open still joins the held queue. |
| m1 | Fixed (8536d5775) | `makeDraggable` (helpers.js) pins the element's drawn box as top/left on every press, so an element already absolute but placed by `bottom` (the desktop post-it) no longer snaps to its static place. Test: `draggable-bottom-anchored.test.mjs`. |
| m2 | Fixed (8536d5775) | A lockout keeps the sign-in screen open, form disabled, until the player closes it. `LOCKOUT_CLOSE_MS` is gone. The Cancel button reads Close and has focus; `cleanup()` had taken every listener, so Close, the cross and Esc are bound again. |
| m3 | Fixed (8536d5775) | New `utils/computer-keywords.js` holds one keyword list. The container's desktop mode keeps its substring test over name, type and sprite name (`mentionsComputer`): whole segments would drop m01's "IT Monitoring Station" desktop and `cctv_monitors1`. The password screen tests whole segments of the type and the sprite's texture key (`isComputerType`), not the name, so a door named "Server Room" and room types such as `room_servers` keep the plain panel. It now reads `params.lockable \|\| params.sprite`. A scan of every scenario's password-locked objects found none that changes face. Eight test harness copy lists gained the new file. |
| m4 | Fixed (7daaffd25) | The computer password screen's gradient overlay is a flat tint; `.password-hint`, `.key` and `.attempts-counter` borders are 2px; the desktop icon label outline is 2px (one GNF pixel at 16px). |
| m5 | Fixed (e2da2ee78, 7ded34fe6) | New `utils/canvas-fonts.js`: main.js asks for VT323 before it creates the game and publishes `window.canvasFontsReady`. Action icons, thought bubbles and the needs-debug label and letters redraw (and the icons re-lay out) once it resolves, with no new import in those modules. Live, the first version resolved at once with nothing fetched: the `@font-face` rules come from a stylesheet `@import` that had not loaded yet. The load now waits for the page's load event, and a load that matches no face resolves false. Live after the fix: `document.fonts.check("16px 'VT323'")` true straight after boot with no minigame opened. |
| m6 | Fixed (71b2d809e) | `kiosk_dock` wraps its `grant_foothold` in a `confirm_action` like `sam_dock`. PLAYTEST.md: a harness note lists the three confirms and how to answer them, and N5, N7, N12 and N13 say to answer them. Validator: 0 lines with ❌. |
| n1 | Fixed (71b2d809e) | No session global exists to gate on, so both socket confirms now say the injector only types into a PC you are signed in at, rather than promising the plug-in. |
| n2 | Fixed (0dc6762dc) | `holdRecentNotifications` moves waiting toasts into the held queue behind the pulled ones, so they show ahead of toasts raised while the panel is open. |
| n3 | Fixed (1cce475bc) | A down block draws each row as its own kind and icon, through `rowsHtml`, so group headings show there too. |

Choices to check: a duration-0 info toast raised with both places taken shows at once rather than waiting (it answers a click, like the Key Ring). The wait limit is 4 s as the brief suggested, not the review's 8 s.

### M1: resolution to apply when build/unlock-gaps-r1 reaches main
- password-minigame.js, two conflict hunks. Keep both helpers: close `passwordScreenKind` with its `}` before unlock-gaps' `isCaseLockTarget` doc comment. Keep both classes: `password-minigame-area${kind === 'prompt' ? ' prompt-mode' : ''}${caseLock ? ' case-lock' : ''}`. A case is never a computer type, so it gets both; `.case-lock` rules are more specific and win. Note: since m3, `passwordScreenKind` is called with `this.params.lockable || this.params.sprite`, the same target `isCaseLockTarget` reads.
- container-minigame.css merges silently: the `.container-minigame.desktop-mode` rule ends up with unlock-gaps' `height: calc(100% - 40px)` and this branch's `height: auto`. Keep `auto` (the 16:10 screen needs it) and delete the `calc` line.
- `test/js/minigame-controls-layout.test.mjs` test 4 ("the password and container panels fit inside the game area"): change the desktop-mode expectation from `calc(100% - 40px)` to `auto`, with a comment that the desktop sizes itself to its 16:10 screen.
- unlock-gaps moves the framework's Cancel row into the flow, so this branch's `max-height: calc(100vh - 440px)` on the desktop screen is unproven. Check live at 1400x1000 and 1280x720 on a sign-in desktop (test_access_networks Sam's PC) and a mission desktop (m01 IT Monitoring Station): Close must stay on screen. Retune the 440px if it is cut off.

### Live proof
Keyless server on :3150 from this worktree, headless, 1400x1000, setFPS(20) with fixed steps on. Games 1832 (test_access_networks, made and not used), 1833 (test_access_networks, injector given) and 1843 (test_access_networks, start in desk_room, finance office unlocked). Server and sessions stopped afterwards.
- Toast cap (game 1833): a Key Ring toast through the real `handleKeyRingInteraction` with two stand-in keys, then two task toasts: all three on screen, nothing waiting; a third timed toast waited and showed 4.9 s later over the cap. Shots c01, c02.
- Post-it (game 1843, Sam's PC desktop): on press the note stayed at (246, 717); moved by (+60, -50) it sat at (306, 667). Shots c03, c04. The drag used dispatched mouse events on the note and the document, the same handlers a real drag reaches.
- Lockout (game 1843, Lena's PC, five wrong passwords for lfox): the message stayed with the screen open 6.5 s later, Close focused; Close ended it with no toast. Shot c05. The disabled Sign in button still looks active (no disabled style); not changed here.
After shots c01 to c05 appended to the session scratchpad's `ux-shots/after_access/manifest.json`.

### Tests (single files, no lock)
toast-queue 10, toast-duplicate, toast-hold-over-panels, toast-hold-verbatim, toast-once-across-panel-handover, toast-once-before-container, toast-verbatim, toast-click-through, error-toast-floor, lockpick-close-toast, social-ready-toast, f18-toast-flag-rfid; password-signin-mode 19, draggable-bottom-anchored 1, canvas-fonts 4, network-view 27; every test file that copies or imports the password, container or network-view minigames, helpers.js, main.js, npc-action-icons or npc-needs-debug (about 30 files): 0 failures. Validator on test_access_networks: 0 lines with ❌. Full suites not run (orchestrator's merge batch).

## Merge with main and M1

Main f2d53bb40 (with build/unlock-gaps-r1 and build/ux-devices) merged in 5dd1ea698.

- password-minigame.js: the two conflict hunks resolved as planned. Both helpers kept (`passwordScreenKind` closed before `isCaseLockTarget`), and the panel takes both classes: `password-minigame-area${kind === 'prompt' ? ' prompt-mode' : ''}${caseLock ? ' case-lock' : ''}`.
- inventory.js and the notepad merged with no conflict; inventory.js is now the same as main's, with one `notepadItemData()`.
- M1: `.container-minigame.desktop-mode` keeps `height: auto` (unlock-gaps' `calc(100% - 40px)` line removed). minigame-controls-layout.test.mjs test 4 expects `auto`, with a comment that the desktop sizes itself to its 16:10 screen.
- The `100vh - 440px` budget holds with the Cancel row in the flow, so it is unchanged. Measured: the desktop block is the screen plus 128 px, starts 144 to 193 px down, and the game area ends 101 px above the window's foot. At 720 px tall the screen caps at 280 px and the desktop ends 18 px (sign-in PC) or 67 px (m01) above the game area's foot; at 1000 px tall the screen is 515 px (its 16:10 height) and there is 63 to 112 px spare. Close was on screen in all four.
- Disabled Sign in (d40485916): `.submit-btn:disabled` is a flat grey fill with a 2px inset frame, muted text, a not-allowed cursor and no hover change; disabled account tiles keep their look on hover, and the chosen one keeps its frame. Test added to minigame-controls-layout.test.mjs.

### Live proof
Keyless headless server on :3195 from this worktree, setFPS(20) with fixed steps on and the setTimeout loop. Games 1865 (test_access_networks, start desk_room, finance office unlocked), 1867 (m01_first_contact, start it_room) and 1868 (test_unlock_gaps swapped onto test_seating). Server and sessions stopped afterwards. Shots d01 to d07 appended to the session scratchpad's `ux-shots/after_access/manifest.json`.
- Sam's PC signed in, at 1400x1000 and 1280x720 (d01, d02); m01 IT Monitoring Station at both sizes (d05, d06): Close on screen each time.
- Lena's PC after five wrong passwords for lfox (d03): Sign in computed grey with the 2px frame and a not-allowed cursor; Close focused.
- Guest Wi-Fi access point (d04): `prompt-mode` only, one "Join Wi-Fi" title line.
- Courier Bag after a KO (d07): classes `prompt-mode case-lock`, brass bezel and border, gold label on no backing; no prompt title line. Satchel42 opens it.

### Noticed, not changed
- At 720 px tall the capped screen is wider than 16:10 (824x280): the wallpaper is cropped, not stretched, and the icons fit. Keeping 16:10 would need the monitor's width capped from the same budget, which makes it about 500 px wide; left as is.
- The bag's name shows twice, in the heading beside its picture and in the field label ("Enter password: Courier Bag"). Main draws it the same way, and the label wording comes from m07 #5, so it is left for a design call.

### Tests (single files, no lock)
Every test file that imports or copies password-minigame.js, container-minigame.css or password-minigame.css, plus minigame-controls-layout: 19 files, 215 tests, 0 failures. Full suites not run (orchestrator's merge batch).
