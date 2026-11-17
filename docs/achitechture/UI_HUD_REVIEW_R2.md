# UI HUD review, round 2 (build/ui-hud at fb55a3b73, main 372600713 merged)

Counts: 0 B, 4 M, 1 m, 4 n.

How it was checked: read the fix-round diff (9e1d9e4fc to fb55a3b73) and compared the release code with
main. Live runs on a keyless server (:3460), fresh games from new-game.rb: m01_first_contact 3739 (size
sweep) and 3740 (targeted checks), ca01_invoice_fraud 3742 (size sweep), at 390x844, 360x640, 844x390,
915x412, 800x600 and 1400x1000, scrollbars shown. Real functions throughout: `gameAlert`, `gameConfirm`,
`gameMenu.open/close`, `showPasswordModal`, `playerHUD.openPlayerPreferences`,
`getTutorialManager().showTutorialPrompt()` and `.relaunch()`, `showTaskCompleteNotification`,
`barkSystem.showBark` with no forceToast, `openPhoneChat`, `MinigameFramework.endMinigame`, `setHudLabel`,
real clicks on dialog buttons and the pill, and Esc as a keydown event through `window` (the path both
Esc listeners use). The sampler from fix round 1 was reused, with one change: a lane member cut by its
lane is now recorded as a clip rather than dropped. Scripts and shots: session scratchpad `ui-hud-r2/`.

Node tests, each file alone with plain node: the seven named files plus every test that imports or reads
a changed module, 58 files, 673 tests, 0 failures (ui-hud-lanes 27, bark-release-policy 30,
bark-lifetime 7, engine-fixes-round6 9, toast-once-across-panel-handover 6, npc-bark-delay 20,
phone-call-bark-hold 2).

## Round 1 findings

| R1 | Status | Live evidence |
| --- | --- | --- |
| M1 dialogs | Closed for the five dialog types; see new M1 and M3 | Confirm, pause menu, password, preferences, tutorial prompt at 390x844: 3 barks held, 0 shown, both bark lanes at z 1390, poll timer running; after the close, speech, text, speech in the order sent, first at 234 to 290 ms, gaps 2501 to 2531 ms; timer cleared, queue empty (`m01-confirm__390x844.png`) |
| M1 phone chat | Speech held: closed. Texts on top: see M2 | Speech from kevin_park held at all six sizes, shown 2 to 7 ms after the phone closed |
| M2 pill | Mostly closed; see M4 and m1 | Count first in its own box at every size; title on the header; no chevron on phones; clipboard hidden under 420 px; finished task as a short line, full text, alone (`m01-brief__390x844.png`) |
| M3 sheet | Closed | 390: sheet 16 to 374; 360: 16 to 344; 844x390: 16 to 828. Esc closes the sheet, the pause menu stays shut; a second Esc opens it, a third closes it (390, 360, 844x390) |
| M4 routing | Closed | m01 client rooms have no `npcs` key (`type, connections, locked, lockType, door_sign, chatBackground, hasPresentNpc, pinLength`). kevin_park, not registered, went to the speech lane, `pointer-events: none`; agent_0x99 (`npcType: phone`) to the phone lane. Same at 390, 360, 844x390, 1400 |
| M5 phone on a wide screen | Closed | 1400x1000: phone 500 to 900, toast and text 916 to 1380 |
| M6 hearts | Closed | Block/Punch removed: 390 hearts 704, caption ends 696; 360 hearts 500, caption ends 492 (`m01-nocombat__360x640.png`); ca01 shows no hearts |
| m1 texts step aside | Closed | 360, 844x390, 915x412, 800x600: the text stepped aside while the toast and speech showed and came back after |
| m2 bubbles | Closed | `npc-world-bubbles.js:96` lists `#npc-speech-container .npc-bark` |
| n1 reference page | Closed | |

Release and voice: `bark-release-policy.js` and `bark-lifetime.js` are byte-identical to main.
`drainDeferredBarks` calls `releaseHeldBarks` with the same `shouldHold`, `render` and
`hasPersistentCopy`; `_voiceEnd` and `_speakBark` are untouched. The server was keyless, so the voice-end
wait itself was not exercised live; the code path is unchanged.

The 250 ms poll (`npc-barks.js:724-733`): one interval at most (guarded by `_dialogHoldTimer`), started only
while a dialog is open with barks held, cleared on the first tick that finds no dialog. Each tick is one
`querySelectorAll` of seven selectors and a computed style per match. The bark system is one window global
for the page (`main.js:145`) and has no destroy step; a scene restart does not make a second one, so
nothing leaks. If the game ends with barks held behind the success screen, the interval ticks until the
page unloads: harmless.

## Major

### M1. Barks held by a minigame are stuck if a dialog is open when the minigame closes
`js/systems/npc-barks.js:293` (returns before the re-arm at `:310`), `:202`.
`drainDeferredBarks` returns at `if (this._shouldDefer()) return;` when a dialog is open, before it
reaches `_watchDialogHold()`. `showBark` only arms the poll when a dialog is open at the time of the bark.
So: a minigame holds a bark, a dialog opens over it, the minigame closes (its drain returns at 293), the
dialog closes, and nothing drains. Live, 390x844: phone chat open, speech from kevin_park held; a
`gameConfirm` opened, the phone closed, the confirm closed: 4 s later `held: 1, timer: false, speech
shown: 0`. Same with the preferences modal. The bark (and every bark behind it) waits until some later
bark arrives. Before this round dialogs held nothing, so a minigame's close always released.
Ways in during play: `confirm_action` from a timer or ink event (`apply-actions.js:422`) while a
conversation is open; the ending check (`systems/ending-check.js:299`) shown as the last task completes
in a conversation, where "finish up first" then leaves the held barks stuck.
Fix: arm `_watchDialogHold()` before the early return at 293 (or in `_shouldDefer` whenever it answers
true for a dialog). Add a unit test: minigame holds, dialog opens, minigame closes, dialog closes, the
bark is released.

### M2. On phones, the notify lane runs across the open phone, and a text there takes taps meant for the phone
`js/ui/hud-lanes.js:247` (the phone-frame limit is for wide screens only), `js/systems/npc-barks.js:225-232`,
`css/npc-barks.css:65`.
This is the open point from the build log, and it is wider than the header row:
- 390x844 and 360x640: a text from another sender sits at y 84 to 184 (390), over the phone's back button
  (25 to 72, 99 to 135) and contact name, and over the first message (`m01-phonetext__390x844.png`). Phone
  texts take taps, so a tap on "back" opens the other sender's thread instead. With a toast as well, the
  toast takes the header and the text sits over the messages (`m01-phonetoast__360x640.png`).
- 844x390 and 915x412: toast and text cover the whole message pane of the phone (phone frame 20 to 293,
  toast 84 to 171, text 187 to 236; `m01-phonetoast__844x390.png`).
- 1400x1000: fine (M5).
The fix-round log's hit tests ran with no text on screen; with one, the back button is under it.

Origin of the rule. `holdsBarks()` in `js/minigames/framework/minigame-manager.js:185-195` (D5, commit
c0c76a804, 2026-10-03): "Phone chat keeps barks on top, since a bark there is a notification for another
thread." `scenarios/m04_critical_failure/CONFIRM_2026-10-17.md` N1 reported HaX's bark beside her open
thread; `docs/agents/ENGINE_FIXES_2026-10-17.md:55` kept the rule ("there a bark flags another contact's
thread") and held only barks from the open thread's contact. Both were judged on a desktop screen, with
texts bottom left beside a centred phone. Neither considered a phone-sized screen, where the lane now
crosses the phone.

Recommendation: show them inside the phone. On the compact layout, while phone chat is open, hold texts
from other contacts as speech is held now (`_shouldDefer`, the same branch). A phone contact's text is
already in its thread, and the contact list shows the unread badge (`phone-chat-ui.js:747`); add an
unread count to the open thread's back button so the player knows something came in. Release the rest
when the phone closes, as now. Keep texts on top on wide screens, where the m04 rule was made and M5 now
keeps them clear. Holding alone (no badge) is the smallest safe step; accepting it is not, because of
the tap on the back button. Toasts over the phone are older behaviour (R1 n4) and take no taps here.

### M3. During the tutorial's steps on a phone, phone texts arrive under the tutorial panel
`css/npc-barks.css:56` (`.tutorial-overlay` in the lowering list), `js/ui/hud-lanes.js:96`
(`DIALOG_SELECTORS` has no tutorial overlay, so nothing is held) and `:205` (`TOP_BAR` does not measure
`.tutorial-panel`).
The tutorial overlay is transparent and stays up through all five steps while the player moves about
(`css/tutorial.css:129-137`). The CSS drops both bark lanes to z 1390, under it, but barks are not held and
the lanes do not avoid its panel. At 390x844 the step panel covers y 0 to 340; HaX's text landed at 84 to
158, under the panel, and showed only as a faint ghost through its 95% background
(`m01-tutsteps2__390x844.png`). The speech line, lower down, showed. A player who says Yes to the tutorial
gets HaX's opening texts released straight into step 1 (the prompt holds them), so they time out unseen.
On main they drew over the panel.
Fix: treat `.tutorial-panel` as part of the top bar in `measureHud` (the notify lane starts under it), and
take `.tutorial-overlay` out of the lowering rule, since the overlay itself takes no pointer events and
covers nothing. Holding barks for the whole tutorial would delay them by minutes.

### M4. The finished-task line is cut by the notify lane when a second toast and speech show
`js/ui/hud-lanes.js` `laneYields` and `applyLanes` (toasts never step aside and share what is left;
the lane has `overflow: hidden`), `js/systems/objectives-manager.js:1299`.
An error toast, a finished task and a speech line together: on phones one toast shows at a time, so the
task line waits about 4 s and then shows over the limit as the second toast. At 360x640 the lane is 84 to
279 and the task line 235 to 323: 44 px cut, one line of the task left ("Read the note on the", frame
bottom gone) for as long as the speech line shows (`m01-briefcut__360x640.png`). At 844x390, 31 px cut.
At 390x844 it fits. This is the R1 M2 complaint (the task's name cannot be read) in a narrower case.
The fix-round sampler skipped members cut by their lane, which is why the sweep did not show it.
Fix: when a toast would be cut, step aside the caption and texts first (as now), then let the older
toast go early (it has been read for 4 s), or keep the task line waiting until there is room for it
whole. Add the "cut by its lane" case to the overlap proof.

## Minor

### m1. The pill still cuts ordinary aims on phones held upright
`css/objectives.css:428-462, 488-495`.
The count is always readable. The aim is not: ca01's first aim reads "Send the email in D..." at 390 and
360, m01's "Establish Acce..." at 360 (text box 122 px). The pill is already as wide as it can be (8 px
short of the music button). Options: VT323 at 16 px for the aim on the compact pill (narrower glyphs,
still a pixel font), or let the upright pill take two lines. Or accept: the sheet is one tap away. The
fixer's call to drop the clipboard under 420 px is right; it gives 28 px back and the count says what the
pill is.

## Nits

- n1. The comment at `css/npc-barks.css:52-55` says the list matches `DIALOG_SELECTORS`; it does not
  (`.tutorial-overlay`, `#password-modal.show`, the inline-style forms). Tie them together when fixing M3.
- n2. In phone chat, once a speech line is held, a later text from another contact waits behind it until
  the phone closes (`npc-barks.js:198`, the queue keeps order). Live: the second text was held
  (`held: [kevin_park, r2_timed]`). The m04 N1 fix noted the same side effect. Moot if M2 holds texts on
  phones; on a wide screen it delays a notification by the length of the phone visit.
- n3. On phones a finished-task line behind another toast shows about 4 s after the pill blinks
  (one-toast limit, head released after its wait). Acceptable, noted for the M4 fix.
- n4. Older, unchanged: speaker arrow fixed at show time (R1 n2), hearts box over Block at 360x640 by
  24 px (R1 n3), toasts over minigames (R1 n4; over the phone, see M2).

## The fixer's assumptions

1. Phone texts from other contacts stay on top during phone chat (the m04 rule): right on a wide screen,
   wrong on phones. See M2 for the origin and the recommendation (inside the phone, held, with an unread
   count on the back button).
2. All barks wait under a modal, phone texts included: agree. A text under a modal would time out
   unseen; the thread keeps it anyway. Verified for all five dialog types, with the release unchanged.
3. The pill drops its icon under 420 px: agree. See m1 for what is still cut.

## Checked and fine

- Size sweep, m01 and ca01 at all six sizes, real messages (error toast, finished task, phone text,
  unregistered speaker, caption), 5 s sampler: no lane overlapped another lane, the pill, the menu
  buttons, Block/Punch, the hearts, the tray or the inventory, apart from R1 n3. Clips of 4 to 20 px for
  about 200 ms are lines sliding in or out, not cuts. The 1400x1000 layout is unchanged from round 1.
- Pixel-art rule: the new CSS uses the square skin, 2 px outlines and GNF 16; no radius, soft shadow or
  gradient added. The brief line keeps the toast frame.
- Sync size: nothing touches player_state or any synced record.
- Harness copies: `bark-release-policy`, `npc-bark-delay` and `phone-call-bark-hold` stub
  `dialogLayerOpen` (and `barkSource`); all pass.
