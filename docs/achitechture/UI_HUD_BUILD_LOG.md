# UI HUD build log (H1 and B2, option A of each)

Branch build/ui-hud, worktree .claude/worktrees/p-ui-hud, from main fc4b4d8a5, main merged in again at 61c033b13.

User picks (2026-11-14): H1 A, four lanes on the phone HUD; B2 A, bark toasts split by source.

## What changed

- `js/ui/hud-lanes.js` (new). Measures the top bar (objectives, menu buttons) and the dock (tray, avatar and hearts, Block/Punch) and places two lanes between them: the notify lane (system toasts, then phone texts) under the top bar, and the message lane (the caption, then speech from someone in the building) above the dock. Pure parts: `computeLanes`, `stackMembers`, `laneYields`, `laneBudgetShare`, `barkSource`, `arrowDirection`, `isCompactViewport`.
  - The lanes together use at most 75% of the free height on a phone held upright, 95% on a phone held sideways (500 px tall or less), 80% on a wide screen. Space no message needs is split 4:3; when the messages need more than the budget it is split by need. So the lanes never meet.
  - When the messages need more than the budget, the caption steps aside first (it comes back on the next hover or tap), then the phone texts (still in the phone thread with the unread badge). Speech and toasts never step aside.
  - Members are placed one after another inside a lane, each limited to what is left; a member's content past its limit is clipped by the lane, never drawn over the next lane.
  - Started at boot from `ui/hud.js` (dynamic import, so no test harness copy lists change) and again by the bark system; re-placed on resize, on any size change of a member or anchor (ResizeObserver), when HUD pieces come and go, when the caption shows or hides and when toasts come and go. Class writes happen only on change, so placing never triggers itself.
  - `body.hud-compact` marks the phone layout (under 900 px wide or 500 px tall or less).
- Bark toasts (`js/systems/npc-barks.js`, `css/npc-barks.css`, `css/ui-themes.css`). `barkSource`: phone contacts (and timed messages, which are texts whoever sends them, `channel: 'phone'` in `npc-manager.js`) go to `#npc-bark-container` as a phone notification: theme square frame, green stripe, phone icon, headshot, X, tap opens the thread. People in the building who are out of view go to the new `#npc-speech-container` in the message lane: caption frame, headshot, a pixel arrow towards the speaker, not clickable (pointer-events none), no X. The text is unchanged (`Name: line`), so nothing new is spoken and cached audio still matches. An NPC whose room has not loaded is looked up in the scenario. Headshots use `applyHeadshotBox` from `utils/npc-headshot.js`. "Clear all" shows only with two or more texts. No soft shadows or hover jumps.
- Toasts (`js/systems/notifications.js`, `css/notifications.css`). One toast at a time on phones (`maxShownToasts`), the rest queue; two lines of message (three for warnings and errors); verbatim toasts (a password to copy) are never cut.
- Objectives (`js/ui/objectives-panel.js`, `css/objectives.css`, `js/systems/objectives-manager.js`). On phones the panel loads collapsed as a one-line pill (current aim and n/m) that stops short of the menu buttons, never opens by itself, and opens on tap as a sheet with an X. The four objective toasts fold into the pill: it blinks (stepped, 2 px outline) and shows "Done: task" and the like for 4 s. Wide screens keep the open panel and the toasts. This also settles the integrator's minor: at 390x844 the panel no longer expands over the canvas centre (centre hit test in every proof run lands on the game, not the panel).
- `.popup-overlay` (integrator minor): the empty div in `games/show.html.erb` had no CSS anywhere, so its `active` class did nothing; removed with the two lines in `minigame-manager.js` that toggled it.

## Proof

Scripts and shots: scratchpad `ui-hud/` (`proof.sh`, `scene.js`, `measure.js`, `order.js`, `shots/`, `proof-*.txt`). Game: m01_first_contact, keyless server on :3460. Each size: rest, each lane alone (toast, task, phone, speech, caption, combat), then all at once (access-denied toast, task complete, phone text, speech line, caption, Block/Punch, tray). Every pair of HUD boxes from different groups is tested for intersection.

| size | rest | each lane alone | all at once |
| --- | --- | --- | --- |
| 390x844 | none | none | none (caption stepped aside for speech) |
| 844x390 | none | none | none (caption and phone text stepped aside) |
| 915x412 | none | none | none (caption and phone text stepped aside) |
| 800x600 | none | none | none |
| 1400x1000 | none | none | none |

Bark order and timing (live, 390x844): three barks held behind a conversation, released FIFO (speech, phone, speech) with gaps of 2548 ms and 2503 ms (HELD_BARK_GAP_MS 2500). The release policy and voice waits are unchanged; bark-release-policy and bark-lifetime tests pass.

## Tests

New: `test/js/ui-hud-lanes.test.mjs` (lane maths at the five sizes, stacking, yields, budget, source split, arrow, bark DOM split and click behaviour, CSS rules, one toast on phones, pill summary and folding). Run plain `node file` for every test file that imports or reads a changed module.

## Open

- Phone texts that step aside on a short landscape screen keep their lifetime running; they stay in the thread and the badge, but may close unseen if the toast or speech outlasts them.
- The pill text at 390 shows about ten characters before the ellipsis; the full aim is one tap away.
- The arrow points from the player to the speaker's sprite at the moment the line shows; it does not follow movement.
- Toast type stripe under the theme skin (critique T1) is not part of this build.

## Fix round 1 (review R1: 6 M, 2 m, n1)

Main 372600713 (format hardening) merged in first, no conflicts (9e1d9e4fc).

- M1, dialogs and phone chat. `hud-lanes.js` `DIALOG_SELECTORS` / `dialogLayerOpen()`: tutorial prompt (also counted from the call, before its overlay shows, `isPromptOpen`), confirm dialog, pause menu, password and preferences modals, the ending check and success screen. While one shows, `NPCBarkSystem._shouldDefer` holds every new bark, as for a minigame; dialogs are not minigames, so `_watchDialogHold` looks every 250 ms and calls the usual `drainDeferredBarks` once the dialog has gone (also re-armed when a dialog opens part way through a release). The release itself is unchanged: `releaseHeldBarks`, first in first out, `HELD_BARK_GAP_MS`, voice waits; no voice-end code touched. Phone chat holds speech lines only (phone texts for other threads stay on top, as m04 settled); the phone's close already drains. CSS: both bark containers drop to z 1390 under any of those dialogs and the tutorial overlay (`body:has(...)`), and the speech container to 1400 under phone chat, so a line already showing sits under them and a phone text cannot take a dialog's tap.
- M2, the pill. Count first in its own span that never shrinks, then the aim cut with an ellipsis; `title` on the header carries the full aim and count. The pill is as wide as the room up to 8 px short of the menu buttons (`--hud-pill-room`, measured by the lanes; CSS fallback), drops its chevron (the whole pill is the button), takes the small square frame on phones instead of the 18 px panel frame, and under 420 px wide drops the clipboard too (the count says what it is). At 390 "0/2 Establish Access" now reads in full. A finished task (and a finished aim) on a phone is a short notify-lane line with no title, its full text wrapping and never cut (`gameAlert(..., { brief: true })`, `.notification.brief`); the pill blinks with it. New task and new aim only blink the pill: its count and line show them. The pill no longer swaps its text for a flash.
- M3, the sheet. Esc closes an open sheet before the pause menu (capture listener on window, stops the event); `box-sizing: border-box` keeps its frame on screen (390: 16 to 374; 360: 16 to 344).
- M4. `barkSource` defaults to speech: only registered phone contacts, `channel: 'phone'` (timed messages) and a caller's click handler make a phone text. `scenarioNpc` removed (the client scenario has no NPC lists until a room loads).
- M5. On a wide screen with the phone open, `measureHud` takes the phone frame's right edge as the notify lane's left limit (the inline width had replaced the CSS rule). 1400x1000: phone 500 to 900, toast 916 to 1380.
- M6. `#health-ui-container` is part of the dock, so lanes stay above the hearts with or without Block/Punch.
- m1. Phone texts step aside one at a time, oldest first (`laneYields` takes each text's height; texts alone keep the newest, speech or a toast can push them all aside). A hidden text's countdown pauses (`_onLaneYield`, and a mouse-leave cannot restart it while hidden) and resumes when it shows again. With the lanes placing them, the phone stack is no longer closed for want of room (only the three-text cap); the lanes step texts aside instead. "Clear all" hides while fewer than two texts show, and counts in the lane only then (its height is remembered, so placing cannot flip).
- m2. `#npc-speech-container .npc-bark` added to the world bubbles' HUD avoid list.
- n1. `popup-overlay` div removed from `index.html.reference`.

Judgement calls: dialogs hold phone texts as well as speech (a text under a modal would only time out unseen); phone chat keeps texts on top on all sizes (the reviewer asked to hold speech there, and m04 kept texts as notifications for other threads), so on a phone held upright a text or toast sits over the phone's header row, never over its reply buttons (hit tests below).

Harness copies: `bark-release-policy`, `npc-bark-delay` and `phone-call-bark-hold` stub npc-barks' imports; they gained `dialogLayerOpen` (and `barkSource` in phone-call-bark-hold). In `_shouldDefer` the ringer check now comes before the phone-chat speech hold.

### Proof (keyless server :3460, fresh games 3671 and 3729 m01_first_contact, 3670 ca01_invoice_fraud)

Scripts and shots: scratchpad `ui-hud-f1/` (`sizes.sh`, `targeted.sh`, `scene.js`, `watch.js`, `dialog*.js`, `phonechat*.js`, `sheet.js`, `texts.js`, `brief.js`, `nocombat.js`, `tut*.js`, `shots/`). Real functions throughout: `gameAlert`, `gameConfirm`, `showTaskCompleteNotification`, `barkSystem.showBark`, `openPhoneChat`, `setHudLabel`, real taps on dialog buttons and the pill, a real Esc key press.

- Tutorial (fresh game, 390x844): two barks sent during the briefing plus HaX's opening text were held through the tutorial prompt (3 held, 0 on screen; both prompt buttons hit-test clear), then released after "No" in order at 284, 2757 and 5235 ms.
- Confirm dialog (390x844 and 360x640): 3 barks held, 0 shown, both buttons clear; after "Stay" released at about 0.3, 2.9 and 5.3 s, speech, text, speech, in the order sent.
- Phone chat (1400x1000, 390x844, 844x390): speech held while the phone was open, shown as the phone closed; every reply and the back button hit-test to themselves.
- Sheet (390, 360): opens by a tap on the pill inside the screen; Esc closes it and the pause menu stays shut.
- Texts (360x640): three texts, a speech line and an error toast: all three texts stepped aside, paused (remaining 6745, 5562, 5398 ms unchanged three seconds later); with the toast gone the newest came back and the older two stayed aside, still paused. 844x390 and 915x412: two texts and a toast, both aside and paused, both back when the toast went.
- No Block/Punch (m01 with the row removed, as the review simulated): 390 hearts 704 to 736, caption ends 696, speech above it; 360 hearts 500, caption ends 492. ca01 shows no hearts at all.
- Size sweep: see the table below.

Size sweep (`sizes.sh`, after `settle.js` closes the briefing and declines the tutorial): an error toast, a finished task, a phone text, speech from an unregistered NPC (routed as speech in every run) and the caption, then a 5 s sampler of every HUD box. The sampler now clips each lane member by its lane container (overflow hidden), so a toast cut by its lane or a line still sliding in from below no longer counts as an overlap; that is what showed as 2 to 24 px hits in the first, unclipped sweep.

| size | m01 overlaps | m01 pill (count, aim width) | ca01 overlaps (no Block/Punch, no hearts) |
| --- | --- | --- | --- |
| 390x844 | none | 0/2, 152 px, 20 to 236 | none |
| 360x640 | hearts x Block 24 px (n3, older) | 0/2, 122 px | none |
| 844x390 | none | 0/2, 388 px | none |
| 915x412 | none | 0/2, 388 px | none |
| 800x600 | none | 0/2, 388 px | none |
| 1400x1000 | none | open panel | none |

Shots looked at: `m01-tutorial-held__390x844`, `m01-confirm-released__390x844`, `m01-sheet-open__390x844`, `m01-texts__360x640`, `m01-nocombat__360x640`, `ca01-brief__390x844`, `m01-real__844x390`, `m01-phonechat__1400x1000`.

### Open after fix round 1

- n2 (arrow does not follow movement) and n3, n4 (older behaviour) untouched.
- On a phone held upright with the phone open, a toast or another contact's text covers the phone's header row (not its replies or back button, which hit-test clear). Holding those too would be a change to the m04 decision.
