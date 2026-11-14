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

## Fix round 2 (review R2: 4 M, 1 m)

Main 1f3ac1f0b merged in first, no conflicts (9fd12dbb0). Code d2874ff6b, toast hide fix 45c2e2296.

- M1. `npc-barks.js` `drainDeferredBarks`: when it finds a hold, it now starts `_watchDialogHold()` before it returns, so a minigame that closes under a dialog leaves the dialog's watch running and the queue goes when the dialog closes (the watch does nothing if no dialog is open; a minigame still drains on its own close).
- M2 (coordinator's decision). On the phone layout (`body.hud-compact`), `_shouldDefer` holds every bark while phone chat is open, texts from other contacts included; they go in order when the phone closes (the existing close drain). A text already showing when the phone opens sits under it (`css/npc-barks.css`, z 1400), so it cannot take a tap. `phone-chat-ui.js`: `refreshBackUnread()` puts an unread count on the back button (unread texts and missed calls in the phone's other threads, the list's `unread-badge` look, aria label "Back, n unread"); called from `showConversation` and from `showBark` while the phone is open. `listContacts` and `unreadCountFor` are shared with the contact list, which keeps its badges. Wide screens keep the m04 rule. The count also shows on wide screens (it reads history, so it is right there too).
- M3. `.tutorial-overlay .tutorial-panel` added to `DIALOG_SELECTORS` (the coordinator's call, not the reviewer's lane option): barks wait while a step panel shows and go in order after, through the dialog watch.
- M4. A finished-task or aim line (`.notification.brief`) has priority in the notify lane (`hud-lanes.js` `applyLanes`): caption and texts step aside first (as before), then the other toasts, oldest first, stay aside while a brief line shows (countdown paused and resumed, `notifications.js` `laneYieldHandler`, at least 1.5 s on return); if the brief line still does not fit, `computeLanes` takes `notifyFloor` and gives the notify lane its height whole, the message lane keeping the rest (lanes still never meet). A brief toast no longer queues behind the one-toast limit (it shows at once with the pill's blink; R2 n3). `.notification.hud-lane-yield` needs `!important`: `css/utilities.css` has `.show { display: block !important }`.
- m1. Phones held upright (`max-width 899.98px`, `min-height 501px`, portrait): the pill's aim wraps to two lines, clamped with an ellipsis after that; width unchanged, so it stays 8 px clear of the menu buttons. ca01's "Send the email in Derek's name" and m01's "Establish Access" now read in full at 390 and 360.
- n1. The CSS comment now says how its list and `DIALOG_SELECTORS` differ.

### Tests

Each file alone with plain node: 71 files (the R2 list plus every test reading a changed module), 872 pass, 0 fail. ui-hud-lanes 35 (8 new: M1 sequence, M2 hold and order, M2 back count, M3 hold and order, M4 floor, M4 toast step-aside, M4 brief does not queue, m1 CSS), bark-release-policy 31 (1 new: person-chat hold, dialog opens, minigame closes, dialog closes, released in order; its stub `dialogLayerOpen` now reads `globalThis.__dialogOpen`), bark-lifetime 7, engine-fixes-round6, toast-once-across-panel-handover, npc-bark-delay 20, phone-call-bark-hold 2: all green.

### Proof (keyless server :3460, fresh games 3829 m01_first_contact, 3831 ca01_invoice_fraud)

Scripts and shots: scratchpad `ui-hud-f2/` (`sweep.sh`, `scene.js`, `watch.js`, `shots/`, `sweep-m01.txt`, `sweep-ca01.txt`). The sampler (`watch.js`) now fails a run on any overlap and on any line cut by its lane for three samples in a row (750 ms; a line sliding in is cut for one sample at most).

| size | m01 | ca01 | pill aim (lines, full) |
| --- | --- | --- | --- |
| 390x844 | pass | pass | m01 1, ca01 2, both full |
| 360x640 | hearts x Block 24 px only (R1 n3, older) | pass | m01 2, ca01 2, both full |
| 844x390 | pass | pass | 1, full |
| 915x412 | pass | pass | 1, full |
| 800x600 | pass | pass | 1, full |
| 1400x1000 | pass | pass | open panel |

360x640 m01 (error toast, finished task, phone text, speech, caption): the error toast stepped aside (display none), the brief line 84 to 172 whole, the lane 96 px, speech 328 to 448 whole, text and caption aside; the error toast came back at 3.1 s into the sample with time left.

### Handover (stopped at the coordinator's handover call)

Done: all five code items, unit tests, size sweeps above, all committed.
Not done (live, scripts written and untried): `ui-hud-f2/fix2.sh <game> <tag> WxH m1 m2 m2toast m3` drives `m1seq.js` (phone holds speech, confirm, phone closes, Stay clicked: bark should release), `m2phone.js` and `m2back.js` (second sender's text showing before the phone opens and two more while open; back badge, hit tests at back, header and replies, real tap on back, release order on close) at 390x844, 360x640, 844x390, 915x412, and `m3tut.js` (tutorial relaunch, three barks, Skip clicked, release order). Fresh m01 game 3830 is unused for these. m2phone registers `r2_second` via `registerNPC` if m01's phone has one contact only; check that registration works and that the back badge counts it.
Files: `js/systems/npc-barks.js` (`_shouldDefer` ~227, `drainDeferredBarks` ~296, `_refreshPhoneUnread`, `compactHud` at the end), `js/ui/hud-lanes.js` (`DIALOG_SELECTORS` 97, `computeLanes` floor ~150, brief priority in `applyLanes` ~345), `js/systems/notifications.js` (`laneYieldHandler` ~225, brief no-wait ~390), `js/minigames/phone-chat/phone-chat-ui.js` (`listContacts`, `unreadCountFor`, `refreshBackUnread` ~590 to 660), CSS in npc-barks, notifications, objectives, phone-chat-minigame.
Gotcha: any new hide class on a toast needs `!important` (utilities.css `.show`).

## Fix round 2 proofs

Keyless server :3460, a fresh m01_first_contact game before each run (3844 to 3858 and later), scripts in scratchpad `ui-hud-f2/` (`fix2.sh`, `hp.sh`, `hearts.js`). No script needed fixing and no product bug showed in the five R2 proofs. m04 was not started; the 1400x1000 wide-screen run used the same code path in m01 (the rule is in the bark system, not the mission).

| proof | result |
| --- | --- |
| M1 stuck-bark sequence (phone holds speech, confirm opens, phone closes, Stay clicked) | pass: held 1 in the phone; after the phone closed it stayed held with the dialog watch running (timer true); Stay hit at its centre; the speech showed 284 ms after the click, queue 0, timer cleared |
| M2 390x844, 360x640, 844x390, 915x412, phone open | pass at all four: compact true, second sender's pre-shown text sat under the phone (z 1400, a tap at its centre reached the phone, not the text), nothing from another sender over the phone, 3 held (text, speech, text), back button "Back, 3 unread" with badge 3, a real tap on back opened the contact list (r2_second badge 3), on close the held lines released in order: text at about 0 ms, speech at about 2.5 s, text at about 5 s, queue 0 |
| M2 1400x1000 (wide) | pass: compact false, two texts shown beside the phone (x 916 to 1380, phone ends 900), z 9999, hit as barks; only speech and the third text held; back "Back, 3 unread"; release in order |
| M3 tutorial step panel (390x844) | pass: panel up (step 1 of 5), 3 barks held and none on screen, timer on; Skip clicked; released at 99 ms, 2.6 s, 5.1 s in order, queue 0, overlay gone |

Seen, not changed: at 844x390 and 915x412 the phone's second reply sits below the phone frame (the frame is 20 to 293 high, the reply 301 to 338; a tap there reaches the notebook button). The reply list scrolls inside the frame; this is the existing landscape layout, not the bark rules.

### Hearts against Block/Punch (R1 n3)

At 360x640 the hearts (8 to 176) overlapped Block (172 on); at 320x568 by 44 px. Two changes:
- `css/hud.css`: on phones (max-width 480px) the Block/Punch gap is 12 px (was 28), so the pair is 148 px wide and starts at vw - 172. The hearts now clear it from 356 px wide, with the 8 px lane gap.
- `js/ui/hud-lanes.js`: `heartsLift(hearts, combat, gap)` (pure) and `placeHearts` at the top of `applyLanes`. Below 356 px, where the two still reach each other, the hearts rise to end 8 px above Block/Punch, through `--hearts-lift` (read by the max-width 480px rule in `css/ui-themes.css`). It is measured with the lift cleared, so it does not depend on the last answer; with no Block/Punch there is no lift. The dock top then follows the hearts, so the lanes stay clear of them as before.

Live: 360x640 hearts 8..176 x 500..532, Block 188..256, no overlap, no lift; 320x568 lifted to 344..376, Block 384..452 (8 px above); 390x844 clear as before (hearts 704, Block 660, side by side 26 px). ca01 (no Block/Punch): no hearts box, nothing to meet. Lane sampler at 360x640 m01: pass (it failed before this round on the overlap). At 320x568, the five-things-at-once scene reports the error toast and speech cut by their lanes (39 and 44 px), because lifting the hearts takes 84 px from the lane budget; 320 is below the sizes in the sweep and the scene is the worst case, noted as a known limit.

Tests: `ui-hud-lanes` 36 (1 new: widths 320 to 480 in steps of 4, with and without Block/Punch, hearts never within the gap of the buttons, no lift at 356 and up, lift below, none without Block/Punch). `bark-release-policy` 31, `bark-lifetime` 7, `npc-bark-delay` 20, `phone-call-bark-hold` 2, `engine-fixes-round6` 9, `toast-once-across-panel-handover` 6: all green, one at a time.

Shots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-hud-f2/shots/` (`b-m2__390x844.png`, `c-m2__360x640.png`, `c-m2__844x390.png`, `c-m2__915x412.png`, `e-m2__1400x1000.png`, `hearts-before-*.png`, `hearts-after-*.png`, `hearts-g-360x640.png`).

## Final pass (after review round 3)

Main merged first (3a083f167 or later, no conflicts). Then the R3 findings and the older phone bug, each as its own commit.

- m1 `js/ui/hud-lanes.js`: with no finished-task line, a toast that stepped aside comes back oldest first, only when it fits whole next to the speech line and the visible texts (`sum([toasts + its saved height, texts]) + message content <= budget`). Until then it stays aside with its countdown paused. A toast with nothing else sharing the lanes always comes back. Its height is saved as `_laneH` when it steps aside.
- m2 `css/objectives.css` and `css/ui-themes.css`: the themed one-line cap (`calc(40px + 2 * square-px)`) beat the two-line rule, so the second line was cut. On upright phones the collapsed pill now has `max-height: none` (sized from its content). 360x640 m01: 56 px became 70 px tall, "Access" whole.
- m3 `js/systems/notifications.js`: a repeat of a toast that is stepped aside sets its saved time left to the new duration instead of starting a countdown.
- n1 `phone-chat-ui.js`: `listContacts(phoneId, quiet)`; the back-badge count passes `quiet`, so no console lines per bark.
- n2 `css/phone-chat-minigame.css`: `.back-button .back-unread` is GNF 16px.
- Older bug (own commit): `@media (max-height: 500px)` in `phone-chat-minigame.css`. The thread's minimum is 40 px, the replies shrink, scroll inside the frame and use tighter padding. 844x390: frame 20 to 293, replies 215 to 244 and 248 to 277, both inside, both hit by a tap at their centre (before: second reply drawn under the clip, tap hit Add to Notepad). 915x412: frame 20 to 308, replies 231 to 260 and 264 to 292. A tap on the second reply was a real click at its centre: the conversation ended and the phone closed, Add to Notepad did not open. With more replies than fit, the list scrolls inside the frame.
- Tests: `ui-hud-lanes` 40 (4 new: return-when-it-fits, repeat while aside, pill and badge CSS, short landscape replies CSS); the M4 return test now gives the hidden toast no height, as the real container does.
- Gotcha: the lightweight toast tests (`toast-duplicate`) stub elements without `classList.contains`, so the repeat path keys off `_yieldLeft` only.

Live (keyless server :3460, a fresh game per size, scrollbars shown, one browser at a time; scripts in scratchpad `ui-hud-r3/`: `sweep2.sh`, `rt.sh`, `replytap.js`): the five-at-once sweep passes at 320x568, 360x640, 390x844, 844x390, 915x412 and 1400x1000 in m01_first_contact and ca01_invoice_fraud (12 of 12, no overlap, no line cut for three samples). 320x568 m01 passes now (R3 m1 failed it). ca01 has no phone contacts, so the landscape reply proof is m01 only. At 320 ca01's aim still takes three lines (ends "email in..."), accepted in R3.

## Merge train 46

Merged train/46 (1c44f0807) into build/ui-hud as fd7ba4805; test added in e32ccc1db. One conflict, in `js/systems/npc-barks.js` `_renderBark`, where the toast is finished off: train 41 (bark-followups) added the voice hold on a toast (its own voice, or the bubble's voice a continuation carries), and this branch added the speech-lane early return and the lane-yield hook for phone texts.

Resolution: the voice hold runs before the speech return, so a no-room line from someone in the building (a speech-lane toast) stays up until its voice ends; phone texts then get the lane-yield hook, hover pause and click as before. Everything else merged cleanly: train 41's continuation bypass of the queue sits beside this branch's `_watchDialogHold` arming in `showBark`, the superseded-play null and NaN-as-playing are in `_speakBark`, and `npc-world-bubbles.js` has both the speech-lane HUD selector and `voiceLive`. One addition: `_bubbleLeft` also calls `_watchDialogHold()` after putting a covered bubble's line back at the front of the queue, so a line held under a dialog (which never drains the queue on close) is released by the watch.

How the two holds meet: a bubble covered mid-voice stops its voice and goes to the front of the queue (`unshift`); barks that arrived while the panel was open sit behind it. The release takes from the live queue (`queue.shift()`), so the replay goes first, and the next bark waits for the replay's voice to end, as for any held bark. The covered line is not toasted as well (`_bubbleLeft` returns before `_toastRemainder`), so it shows once. A lane-yielded phone text whose voice ends while it is hidden stays paused; its countdown starts when it shows again (`_resumeAutoClose` does nothing while `_voiceHold` is set, and the hold release does nothing while paused).

### Tests

New `test/js/bark-lanes-voice-merge.test.mjs` (3): voiced speech-lane toast held for its voice; voice-held phone text that steps aside keeps its countdown paused; a bubble held under a dialog arms the watch and replays before a later bark, shown once. Removing the new `_watchDialogHold()` line fails the third test.

Run one file at a time with plain `node`, all pass: bark-release-policy 31, npc-bark-delay 20, ui-hud-lanes 40, tts-superseded-play 5, nsm-continue-after-sever 8, bark-lifetime 7, phone-call-bark-hold 2, engine-fixes-round6 9, toast-once-across-panel-handover 6, toast-duplicate 8, bark-voice-followups 15, phone-voice-superseded 1, toast-once-before-container 8, toast-hold-over-panels 6, bark-lanes-voice-merge 3; and every other test that imports npc-barks, npc-world-bubbles, tts-manager, bark-release-policy or phone-chat-ui (31 files, 499 tests).

### Live (keyless server :3460, m01_first_contact, a fresh game per run, scripts in scratchpad `ui-hud-m46/`)

The server has no TTS key, so no real voice plays: the keyless runs prove holding, order, gaps and the silent paths. The voiced paths were driven with a stand-in TTS manager for Sarah in the page (audio that "plays" for 6 s, as in the unit tests).

| proof | result |
|---|---|
| Barks sent while the notes minigame is open (1400x1000, game 4085) | 3 held (Sarah, a phone text, unregistered speech), none on screen; after close: Sarah's bubble at 107 ms, phone text at 2615 ms, speech line at 5109 ms, each once, queue 0 |
| Bubble covered by a minigame, no voice (game 4089) | bubble closed under the panel; its rest held as a continuation, the later phone text behind it; after close: rest as a speech-lane toast at 69 ms, phone text 2.5 s later, each once |
| Bubble covered mid-voice, stand-in voice (game 4093) | voice stopped once, whole line held first with its voice; after close the line replays in her bubble 55 ms later, voiced again (2 plays in all); the phone text waits for the replay's voice and shows at 6.3 s; the bubble shows once after the close |
| Five-at-once sampler | 390x844 (game 4094) pass, 1400x1000 (game 4095) pass: no overlap, no line cut for three samples |

Shots looked at: `held-1st/2nd/3rd__1400x1000.png`, `replay-after-close__1400x1000.png`, `replay-stub-after-close__1400x1000.png`, `m46-scene__390x844.png`, `m46-scene__1400x1000.png`, in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-hud-m46/shots/`.
