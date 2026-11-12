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
