# UI HUD review, round 1 (build/ui-hud at be4169251, against main 61c033b13)

Counts: 0 B, 6 M, 2 m, 4 n.

How it was checked: read the whole diff, then real runs on a keyless server (:3460) of m01_first_contact
(game 3603) and test_needs_sims (game 3604) at 390x844, 360x640, 844x390, 915x412, 800x600 and 1400x1000,
with scrollbars shown. Messages came through the real calls (gameAlert, showTaskCompleteNotification,
barkSystem.showBark with no forceToast, setHudLabel) and test_needs_sims' own chatter and captions. A
sampler read every HUD box every 250 ms and flagged any overlap between groups; hit tests used
elementFromPoint at each modal button. Shots and scripts are in the session scratchpad, `ui-hud-r1/`.
116 node test files that import or read a changed module were run one at a time: all exit 0, 1502 tests
pass (ui-hud-lanes 16, bark-release-policy 30, bark-lifetime 7, engine-fixes-round6 9,
toast-once-across-panel-handover 6).

## Major

### M1. The lanes draw over open dialogs and minigames, and phone texts take taps there
`css/npc-barks.css:15-37` (both bark containers z-index 9999), `css/notifications.css:11` (toasts 2000),
`css/tutorial.css:17` (tutorial prompt 1400).
- Tutorial prompt at 390x844: barks held behind the opening briefing are released when it closes, and the
  speech line lands on the tutorial's second button (358x53 overlap). At 360x640 it covers both buttons
  (shots `m01-tutorial-released__390.png`, `lane-speech__360x640.png`). Taps still reach the buttons
  because speech lines take no pointer events, but the player cannot see what they are tapping. The
  coordinator's shot shows the phone text over the question text. Phone texts do take taps, so a tap on
  a dialog under one opens a phone thread.
- Phone chat (does not hold barks): a speech line sits over the first reply choice
  (`m01-phonechat-speech__390.png`). On main barks did the same here; the lanes now place them in the
  middle of the screen, where replies and dialog buttons sit.
- Conversations (person-chat) hold barks correctly; nothing appeared over them.
- Fix: while a dialog layer is open (tutorial prompt or panel, confirm dialog, pause menu, password or
  preferences modal) lower both bark containers below it, as `body.minigame-holds-barks` already does
  for minigames, and hold new speech lines until it closes. In phone chat, hold speech lines: they are
  not notifications for another thread. Toasts over minigames are older behaviour (see n4).

### M2. The objectives pill cannot be read on phones, and folded task news is lost
`css/objectives.css:429`, `js/ui/objectives-panel.js:188, 196-210`.
- At 390 the text box is 66 px out of a 200 px pill ("Establi..."); at 360 it is 36 px ("Est...",
  "Don..."). The clipboard icon, the chevron (30 px), the header padding and the 18 px frame use the rest.
  The "n/m" count comes last in the string, so on a phone held upright it never shows. The picked option
  (H1 A) was "current aim + n/m".
- The four objective toasts are skipped on phones (`objectives-manager.js:1297, 1305, 1316, 1324`) and
  folded into the pill as "Done: <task>" for 4 s. At 390 that reads "Done: R..." and at 360 "Don...",
  so the task's name never reaches the player unless they open the sheet. Before this build the toast
  showed it in full.
- The PC polish label decision (16 px, ellipsis plus a title) is half met: 16 px GNF with an ellipsis, but
  the pill has no `title`.
- Fix: put the count in its own span that does not shrink, before the title; on phones drop the chevron
  (the whole pill is the button) and use the small square frame, not the 18 px one. For the fold, either
  flash only the count ("2/3" with a tick) and send the task name to the notify lane as a one-line toast,
  or keep the task-complete toast on phones and fold only "new task" and "new aim". Add `title`.

### M3. The objectives sheet does not close with Esc, and its frame runs off the screen
`js/ui/objectives-panel.js` (no key handler), `css/objectives.css:446-448`.
- Esc with the sheet open opens the pause menu and leaves the sheet open behind it
  (`m01-sheet-open__390.png`). The X closes it.
- At 390 the sheet's box is 16 to 410 px: `width: calc(100vw - 32px)` is the content box, and the 18 px
  border on each side is added outside it. The right edge of the frame is 20 px off screen
  (`m01-sheet-open2__390.png`). The frame-wraps-content rule from the design language is not met.
- Fix: `box-sizing: border-box` on the sheet; make Esc close an open sheet before the game's Esc handler
  opens the pause menu.

### M4. People out of view whose room has not loaded still arrive as phone texts that open a chat
`js/ui/hud-lanes.js:74`, `js/systems/npc-barks.js:408`.
On the client, `window.gameScenario.rooms[*]` has only `type, connections, chatBackground, lighting,
hasPresentNpc, locked`; NPC lists come with the room when it loads. So `NPCBarkSystem.scenarioNpc()`
returns null for any NPC not yet registered, and `barkSource()` falls back to 'phone'. Live check: in m01
from reception, a bark from kevin_park (a person) went to the phone notification at all six sizes
(`lastRoute.source: 'phone'`). This is the case B2 set out to fix: speech in the building shown as a
text, with a tap that opens a phone thread. The unit tests never call `scenarioNpc`.
Fix: phone contacts are registered at start (`getNPC('agent_0x99').npcType === 'phone'` straight after
boot), so treat an unregistered NPC as 'speech' and keep 'phone' for a registered phone NPC, a payload
`channel`, or a caller's click handler. Remove `scenarioNpc` or keep it as a hint only. Add a test with
the client scenario's real shape (rooms without `npcs`).

### M5. With the phone open on a wide screen, toasts cover the phone again (regression of m06 F3)
`js/ui/hud-lanes.js:279-280` overrides `css/notifications.css:19-21`.
The lanes set an inline `width` on `#notification-container`, which beats
`body:has([data-minigame="phone-chat"]) #notification-container { width: max(240px, ...) }`. That rule
was there to keep toasts clear of the phone's header and unread badge. At 1400x1000 with the phone open,
a warning toast spans x 780 to 1380 and the phone spans x 500 to 900: 120 px of the header and the first
thread are covered (`m01-phone-toast__1400.png`). Phone texts now share that lane, so they cover the phone
too; on main they sat bottom left and missed it.
Fix: in `applyLanes`, when a phone-chat minigame is open on a wide screen, limit the notify lane's left
edge to the phone's right edge plus 12 px (measure the phone frame), or skip the inline width and let the
CSS rule apply.

### M6. In missions without Block/Punch the message lane covers the hearts (regression)
`js/ui/hud-lanes.js:170`.
`DOCK` measures `#inventory-container`, `#player-hud-buttons` and `#combat-buttons`. With the UI theme the
hearts (`#health-ui-container`) sit inside `#player-hud-buttons` but outside its box (390: hearts y 704 to
736, `#player-hud-buttons` y 738 to 842). With Block/Punch present their row is the dock's top, so this
never shows in m01 or test_needs_sims. With `disableAttacks: true` (ca00, ca01, ca03, ca04, ca05, ca07,
ca09, ca11 and their defend versions) the dock top is the tray, and the caption box (y 666 to 728) covers
the hearts (`m01-nocombat-caption__390.png`, Block/Punch removed to simulate). On main the themed caption
sat at bottom 148 px (`ui-themes.css:573`) and cleared them.
Fix: add `#health-ui-container` to `DOCK`, and add a no-combat case to the overlap proof.

## Minor

### m1. Phone texts step aside all at once, and their time runs out while hidden
`js/ui/hud-lanes.js:51, 255`, `css/npc-barks.css` `#npc-bark-container.hud-lane-yield`.
The yield hides the whole phone container. At 390 one text plus one toast fits, but two texts plus a
toast go past the 75% budget and hide both, even though the newest would fit. They keep counting down,
so an error toast (15 s) can outlast them and they close unseen (the builder lists this as open). They
stay in the thread with the badge, so nothing is lost, but the player may never see the notification.
Fix: pause their auto-close while yielded, and trim to the newest that fits (`barksToTrim` already does
this inside a lane) rather than hiding them all.

### m2. Speech bubbles do not avoid the new speech line
`js/systems/npc-world-bubbles.js:94`. `HUD_SELECTORS` lists `#npc-bark-container .npc-bark` but not
`#npc-speech-container .npc-bark`, so a nearby NPC's bubble can draw under the speech line in the message
lane. Add the selector.

## Nits

- n1. `public/break_escape/index.html.reference:107` still has `<div class="popup-overlay"></div>`. It is a
  reference page, not served. The removal is otherwise safe: nothing else in the repository refers to it
  (JS, CSS, Ruby views, tests, mjs), main had no CSS for it, and no other repo under Code/ mentions it.
- n2. The speaker arrow is set when the line shows and does not follow movement (builder's open item). For
  a line of a few seconds this is acceptable.
- n3. Older behaviour, not from this build: at 360x640 the hearts container's box overlaps Block/Punch by
  24 px (the sampler flags it; on screen the hearts end before Block).
- n4. Older behaviour, not from this build: toasts (z 2000) show over every minigame, conversations
  included (`m01-chat-inject__390.png`, over the briefing portrait). Worth a decision with M1.

## Checked and fine

- Overlaps: with real messages at all six sizes, and the builder's injected scenes at 360x640 (a size the
  build log did not cover), no lane overlapped another lane, the objectives, the menu buttons, Block/Punch,
  the tray or the inventory, apart from M6 and n3.
- Bark order, timing and voice: `bark-release-policy.js` and `bark-lifetime.js` are unchanged. The
  `npc-barks.js` changes come after routing and only choose the container and markup. The hold/defer
  queue, `HELD_BARK_GAP_MS`, `_speakBark` and the TTS promise path are unchanged; speech lines start the
  same `barkLifetimeMs` timer. Held barks were released after the briefing closed, as on main.
- A tap on a phone text opens that contact's thread (agent_0x99, phone-chat, bark removed). A speech line
  has `pointer-events: none`; elementFromPoint at its centre reaches the game or the dialog under it.
- The objectives sheet opens on a tap of the pill and closes with its X (Esc fails, M3). At 390 the
  centre of the screen hits the game, not the panel.
- Pixel-art rule: new CSS uses 2 px borders or the theme square and frame skins; no radius, soft shadow
  or gradient. The arrows are 1x SVG pixel art drawn at 2x and turned in quarter turns. The phone icon is
  16x16 at 1x, headshots 32x32 at 1x, GNF at whole sizes, Press Start 16 for the sheet's X. The one
  breach is the sheet frame running off screen (M3).
- Design language: headshots on both bark kinds (from `applyHeadshotBox`, hidden when a character has
  none), one X per phone text, "Clear all" only with two or more.
- Sync size: nothing touches player_state or any synced record.
- Static imports added to `npc-barks.js` (`ui/hud-lanes.js`, `utils/npc-headshot.js`): every test file
  that imports `npc-barks.js` passes, so no harness copy list is missing them.

## The builder's judgement calls

- Budget shares (75% upright, 95% short landscape, 80% wide) and the 4:3 split: fine. At 844x390 a toast
  covers most of the room while it shows, which matches the 95% choice and lasts only a few seconds.
- Caption steps aside first, then phone texts; speech and toasts never: right order. See m1 for how the
  phone texts step aside.
- One toast at a time on phones, two lines (three for warnings and errors), verbatim never cut: fine.
- Objective toasts folded into the pill: right idea, but it cannot be read at phone widths (M2).
- Timed messages always `channel: 'phone'`: right; they are texts.
- Unloaded NPCs looked up in the scenario: does not work on the client (M4).
- `.popup-overlay` removal: safe (n1).
- Lanes started from `hud.js` by dynamic import: fine.
