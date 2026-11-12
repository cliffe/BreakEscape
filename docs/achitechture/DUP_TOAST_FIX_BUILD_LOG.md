# Duplicate toasts: build log

Branch `build/dup-toast`, made from main 72e26f911. Two reports:

1. test_access_networks, game 1750: the Task Complete toasts for P2, P3, N2 and N3 each showed twice.
2. test_access_social on build/c3-replies, game 1733: "Asha Rao posted on Friendface" showed twice, the second copy at the same moment as Kofi's reply toast.

## What the logs show

The playtest harness records every toast element added to `#notification-container` (`playtest-session.js`, toast capture). A toast that is drawn, pulled back and drawn again counts twice, and the player sees it twice: once briefly, once again later.

Neither report is two listeners, one event emitted twice, or a task completed by both a mapping and a listener. `completeTask` refuses a task that is `completing` or `completed`, and the server log for game 1750 has one POST per task (p2_plant, p3_see, n2_pivot, n3_signin_across). Both duplicates come from the hold-and-replay logic in `systems/notifications.js`:

- Info and success toasts raised while a panel (a minigame or a workstation popup) is open are held and released by a 300 ms poll once the screen is clear.
- When a panel starts, a toast that has been on screen for under 700 ms (`RECENT_TOAST_MS`, a "glimpse") is pulled back into the hold and shown again when the panel closes.

### 1. test_access_networks (game 1750)

P2 to N3 completed while the network screens were open, so all four were held. The two renders in the log are 1.5 s apart, at 14:42:33.510 and 14:42:35.040. The first came 7 ms after the Close on the remote desktop, the second just after the next Close.

Closing a network screen hands over to another one a tick later. A share reopens its desktop and a folder its desktop (`container-minigame.js` `reportNetworkExit`, `setTimeout(..., 0)`). A desktop reopens the view through `network-links.js` `landed`, then `resume`, both one `nextTick` later. For that tick no panel is open. When the release poll ran in the gap, it drew the held toasts; the reopened view then pulled them back as a glimpse, and they were drawn again after the next Close.

Cause: held toasts were released in the gap between a panel closing and the panel it hands over to.

### 2. Friendface (game 1733)

Asha's post toast was drawn at 14:21:07.585 in the open world. The harness opened the phone about 0.5 s later (`openInventoryItem` at 14:21:08.107), inside the 700 ms glimpse window, so the toast was pulled back. It was replayed when the phone closed at 14:22:18.9, together with Kofi's and Mei's reply toasts, which had been held while the phone was open. Ivy's post at 14:22:51.3 did the same: the phone opened 0.45 s later, and the toast came back at the next Close.

Cause: the designed glimpse replay, set off because the harness opened a panel faster than a person can react to a toast. None of the code involved changes on build/c3-replies (C3 does not touch `notifications.js` or the framework), so there is nothing to hand to C3. No fix is made for this one: see "Open question" below.

## The fix (case 1)

`notifications.js` gains `PANEL_SETTLE_MS = 400` and `settleAfterPanelClose()`, which is `expectPanelWithin(PANEL_SETTLE_MS)`. `MinigameFramework.endMinigame` calls it twice:

- as the minigame starts ending, before `cleanup()` (which is where the network screens schedule their reopen);
- after cleanup, `onComplete` and return-to, when no minigame is open. The window then counts from the end of the close work, which can take longer than the window on a busy machine.

While the expectation stands, held toasts stay held, and new info or success toasts wait with them. The reopened panel's `startMinigame` already calls `clearExpectedPanel()`, so nothing changes while it is open. When nothing reopens, the toasts show once the window passes. This follows the pattern already used at the known reopen sites (`notes-minigame.js`, `text-file-minigame.js`, `container-minigame.js` 1575, `npc-manager.js`), applied once in the framework so every hand-over is covered.

Effects to know about:

- After the last panel closes, held toasts appear 0.4 to 0.7 s later than before (previously 0 to 0.3 s).
- Warnings and errors are never held, so they are not delayed.
- A hand-over whose reopen comes more than 0.4 s after the close is not covered. The armed network return (`NETWORK_RETURN_GRACE_MS`, 2.5 s, after a successful hand-over that opens nothing) is such a path; it only fires when nothing else opened, so it was left alone.
- Repeated toasts are not suppressed. Two different tasks that complete together both show. The same toast raised again after the first has gone shows again. Only the existing rules decide de-duplication (`isQueuedDuplicate` in the hold, `findShownDuplicate` on screen).

Files:

- `public/break_escape/js/systems/notifications.js`
- `public/break_escape/js/minigames/framework/minigame-manager.js`
- `test/js/toast-once-across-panel-handover.test.mjs` (new)

## Tests

`test/js/toast-once-across-panel-handover.test.mjs` drives the real `MinigameFramework` and the real `notifications.js`. A child panel's cleanup reopens a parent one tick later after a 450 ms slow close. Two task toasts are held over it, then the chain closes. Five cases: the two tasks show once each, with nothing drawn in the gap; toasts held over a panel that reopens nothing still show; the same toast raised again after the first has gone shows again; a starting panel clears the settle window; warnings are not delayed.

- With the fix: 5 pass.
- With main's `minigame-manager.js`: case 1 fails. Without the gap assertion, P2 is drawn twice (expected 1, actual 2).

Affected files: every `test/js` file that loads `notifications.js` or the minigame manager, or raises toasts (102 files), 1502 tests, 0 failures. Run without the lock, per the test lock rule. No Rails code changed.

## Live proof

Keyless headless server on :3065, `session-start.sh --headless`, `setFPS(20)` with fixed steps on, kit given by `new-game.rb --give kit_dropbox --give kit_badusb --give kit_stick`.

| Game | Build | Run | Result |
| --- | --- | --- | --- |
| 1779 | main | comms port, Lena's desktop, server host, share, close chain | P2, P3, N2, N3 once each |
| 1780 | main | the 1750 command sequence, pauses capped at 2 s | once each |
| 1810 | main | the 1750 sequence with its original pauses | once each |
| 1811 | fix | the 1750 sequence with its original pauses | once each |
| 1810 | main | desktop to view hand-over made 350 ms slow, two probe toasts held over the desktop | each probe drawn twice, 1.9 s apart (the 1750 signature) |
| 1811 | fix | the same slow hand-over and probes | each probe once |
| 1815 | fix | the 1750 sequence with the slow hand-over in place | N8, N10, P2, P3, N2, N3 once each |

The exact 1750 race did not happen by itself in any run on either build. Game 1750 took four Close clicks to get back to the world where every replay took three, so it had one more panel in the chain, which I could not reproduce. On a run like 1750 the gap only opens when the release poll lands in it. The slowed hand-over makes that certain, and it shows the old build doubling and the fix not doubling.

## Open question for the user (case 2)

The Friendface double is the glimpse replay working as designed (m07 confirmation N1): a toast seen for under 0.7 s before a panel opened is shown again when the panel closes. A person cannot open the phone in response to a toast that fast, so in play this happens only when they were already opening the phone as the toast appeared. Even then, a "posted on Friendface" replay after they have just read the feed is redundant.

If that should change, here is a precise option. It needs a decision, because it changes how feed toasts behave:

- `notifications.js`: honour a toast option `replay: false` in `holdRecentNotifications`, removing such a toast instead of pushing it back into `heldNotifications`. Add `replay` to the `_toast` record in `renderNotification`.
- `systems/social-feed.js` (C3 changes this file): the `toast` dependency passes `{ verbatim: true, replay: false }`.
- Test: a feed toast drawn, then a panel opened within 700 ms, is never drawn again; a task toast in the same position is still replayed.

Toasts raised while the phone is open showing the same thread (Kofi's and Mei's replies) are held and shown on close. They are not duplicates. Whether they should be dropped when the open panel already shows them is a separate design question.

## Handover

Done: cause of both, fix and test for case 1, live proof, this log. Open: the case 2 decision above. No server or session left running (the :3065 server and sessions 1779, 1780, 1810, 1811 and 1815 are stopped).
