# Credential keyring K3b: code review, round 1

Diff: `git diff main...f8b4a623e` on `build/keyring-k3b` (main `427680566`). Spec: plan 8.2 (K3b), 8.4, 8.5; build log K3b runs 1 to 3.

## Verdict: FIX (B0 M0 m4 t4)

No blocker and no major. The one server change (`heldItem`) names only an item the player carries, every author string reaches the DOM as text, the server still decides every sign-in, and nothing is added to player_state or globals. Connect's steps run in the plan's order with the race answers and refusal mapping as written, and the find toasts diff, group, stay silent for captures and wait for `foundIn` as 8.2 says. The minors are a race between overlapping no-screen asks, the use of the finished-task `brief` flag to lift the phone clamp (and the teaching toast, which has no such lift), a silent first find after a failed prime, and a 403 mapping that is wider than the plan's.

Runs on `f8b4a623e`: `keyring-client.test.mjs` 51/51, `inventory-menu.test.mjs` 28/28, `keyring-signin.test.mjs` 53/53; `keyring_route_test.rb` 12 runs, 0 failures; `bin/test-js` 716 files, 0 failed. No server was started (port 3063 is the live-proof agent's), so the live beats and phone shots were not checked here.

Mutations of my own (each restored with `git checkout -- <file>`, `git status` clean apart from `node_modules`):

| Mutation | Caught by |
|---|---|
| `trayChanged`: never ask on a removal (`removedHeld = false`) | keyring-client "trayChanged asks on an add or a heldItem removal" |
| conversation hold: never start the poll timer | keyring-client "a held find is released when the conversation flag clears" |
| direct Connect: drop the covered-tray (`busy()`) check | inventory-menu "with nothing to read, the click is Connect itself" |

## Security walk (8.4), what holds

- **`heldItem` reveals nothing unheld.** `credential_keyring.rb:178-181` reads `proof.held`, but the row is only built after `credential_proof_holds?` (`credential_keyring.rb:135`). `CredentialModel.proof_kind` accepts exactly one proof key (`credential_model.rb:60-65`), so a row with a `held` key is a row whose held proof passed: a non-forged inventory entry with the credential id, the authored type and the authored id (`credential_keyring.rb:42-63`). The id sent is therefore the player's own item id. The four new route tests cover the held case, a dropped item, a forged (wrong-type) entry and a foothold-proven connection; the dropped and forged cases assert the id is absent from the whole body.
- **Client never decides access.** Steps 3 to 7 only choose a toast from the server's answer; skipping them client-side still ends in POST /login, which runs section 7's checks. The refused screen greys a button the server has already refused.
- **No XSS.** The find toast and every Connect toast go through `gameAlert` without `html: true`, so `renderNotification` sets the title with `textContent` and the message with `setPlainLines` (`notifications.js:638-641`). The refusal line on the screen goes through `setSignInMessage`, which uses `nowrapHostsHtml(text, escapeHtml)` on a remote screen (`password-minigame.js:2354`). The test "find toasts reach the DOM as text" drives markup through the real `notifications.js`.
- **Nothing synced.** `latest`, `connecting`, `_findIds`, `_waitingFor`, `_held` and `_signedInPcs` are in memory only; the "nothing is written" test checks globals and player state.
- **Harness copy lists.** No engine module gains a static import: `keyring.js` loads `remote-host-text.js` by dynamic import (already in the copy list), `inventory-menu.js` reads `window.keyring`, `unlock-system.js` exposes `openCredentialSignIn` on `window`, and `password-minigame.js` imports `credentialRefusalLine` from a module it already imported.

## Deviations (build log K3b runs 1 to 3)

1. **The server's keyring rows carry `heldItem`.** **Accept.** The item-level `credential` is stripped from the client, so without it Connect cannot tell which tray item proves which entry. It names only a held proof's item (see the security walk), and the foothold test kills the "named for any proof" mutation.
2. **`returnTo` polls every 250 ms for the minigame layer to close.** **Accept for now.** There is no generic minigame-ended event: `MinigameFramework.endMinigame` calls named window hooks in its end path (`window.playerPoses.onMinigameEnd`, `window.phoneRinger.onMinigameEnded`, `minigame-manager.js:228` and `:322`) and emits nothing on `eventDispatcher`. The poll stops once the screens close (or after the 3 s open wait), and only K4 will pass `returnTo`. K4 should add one emit (`minigame_ended`) in that `finally` and listen for it instead (t1).
3. **Direct Connect fires when Examine has nothing to show (observations or text).** **Accept.** It is the menu's existing `heldItemHasText` rule, so the tray item behaves like every other held item; "observations" in 8.2 was shorthand for what Examine shows.
4. **`trayChanged` asks on any add, but on a removal only for a `heldItem`.** **Accept.** The client cannot see `credential`, so any add may be one; one GET per pickup, usually `unchanged`, in credential scenarios only. A removal that is not some row's `heldItem` cannot change a connecting row, and a password row's file proof re-shows at the next ask.
5. **Brief toasts with no title.** **Reject the `brief` flag, keep no title.** See m2.
6. **"and N more" has no full stop.** **Accept.** It is 8.2's own wording, and each name line above it keeps its full stop.
7. **After a failed prime, the next answer becomes the baseline and toasts nothing.** **Accept the rule, with a retry.** See m3.
8. **The conversation hold is released on `conversation_closed:*` or when a poll sees the flag clear.** **Accept.** Person and phone chat emit `conversation_closed:<npcId>` before clearing `currentConversationNPCId` (`person-chat-minigame.js:1993` then `:2008`); the mail runner sets the flag with no close event, which the 500 ms poll covers, and `releaseHeld` clears the timer on both paths (the second of my mutations above is caught).

## Minors

**m1. Overlapping no-screen asks can apply out of order, so a find toasts twice and the tray loses Connect.** `keyring.js:156` (`noteFinds` on every no-screen answer), `keyring.js:132` and `:138` (`latest`), `keyring.js:226` (`refresh`).
Several triggers each start their own `refresh()`: an inventory add, `network_foothold_gained`, `pc_desktop_opened`, `noteOpened`, and Connect's own GET. Nothing serialises them, and the server can answer two GETs in either order. Scenario: an NPC gives two items in one conversation; the first give's GET (A) leaves before the second give's write, the second's GET (B) after it. If B is answered first, the .rdp find is held for the conversation and `_findIds` gains it; then A's older answer replaces `_findIds` and `latest` without it. The tray's Connect entry vanishes until the next ask, and the next ask finds the .rdp "new" again, so the player gets "Saved connection found: HB-FIN-02.rdp ..." a second time.
Fix: number each no-screen request when it is sent and ignore (for `latest`, `_findIds` and `_waitingFor`) any answer older than the newest one applied, or chain no-screen asks on one promise so they run one at a time. Test: two refreshes with the second answered first; one toast, `latest` keeps the newer entries.

**m2. The find toast uses `brief`, the finished-task flag, and the teaching toast has no clamp lift at all.** `keyring.js:289`, `keyring.js:368`.
`brief` does more than lift the phone's two-line clamp: it skips the shown-toast limit (`notifications.js:605-607`) and makes `hud-lanes.js:1000-1015` push every other toast aside, countdown paused, for as long as it shows (7 s here), and give it the notify floor. That is the priority 2.x of the toast plan reserved for a finished task or aim. A grouped find toast is three lines of long sentences, so on a phone it now takes the lane over every warning and objective toast for 7 s. One look per concept is also bent: a find now shares the finished-task look. Separately, Connect's teaching toast (`keyring.js:368`, and K3a's `password-minigame.js:2240`) is info with no lift, and the saved connection line is about 135 characters: under `body.hud-compact` (`notifications.css:183-189`) it is cut at two lines, losing the half that teaches the policy. Not measured live.
Fix: add a separate option that only lifts the clamp (a `whole` class beside `verbatim`, with the same `line-clamp: none` rule as `.brief` in `notifications.css:198-205`) and use it for both the find toast and the teaching toast; keep `brief` for tasks and aims. Check both at 390x844 in the live shots.

**m3. After a failed prime, the first find of the page is always silent.** `keyring.js:168-172`, `keyring.js:242-258`.
When the page-start GET fails, `_findIds` stays null, and the next no-screen answer becomes the baseline. That next answer is almost always the one a find triggers (take the .rdp, `trayChanged`, GET), so that find, the one the toast exists for, never toasts. The reload rule of 8.1 justifies the stricter "nothing earned before this page" for `foundVisible`; it does not need the first real find to be lost.
Fix: on a failed prime, retry the baseline GET on a short timer (for example twice, 5 s apart) without waiting for a trigger, so the baseline is normally in place before the player finds anything; keep today's rule as the last resort. Test: prime rejects, retry answers, then a take of the .rdp toasts.

**m4. Every 403 from POST /login is shown as "can't be reached from here".** `keyring.js:373-374`.
8.2 maps 403 `not_responding` to step 4 and 403 unreachable to step 7. The code maps any other 403 to step 7's line, so a 403 with another reason (a session-scope refusal, an authorisation failure, a future reason such as K5's token checks) tells the player to find a way onto the network when the network is not the problem.
Fix: map 403 to step 7's line only when `serverReason` is `unreachable` (or absent, as the bare `render_error` path sends), and give any other 403 the Connect failure line. Test: a 403 with an unknown reason gives `CONNECT_FAILED_TEXT`.

## Trivial

**t1.** K4, the first caller of `returnTo`: emit one `minigame_ended` event from `minigame-manager.js`'s end `finally` and replace `watchScreensClose`'s poll with it. Two overlapping Connects with `returnTo` would also run two watchers today; the in-flight guard prevents that for now.

**t2.** `keyring.js:362` calls `w.pcSessions.signInWithCredential` without `?.`; with no `pcSessions` it throws, `connect()` rejects, and the tray's `w.keyring?.connect?.(el)` (`inventory-menu.js:226`, `:247`) leaves an unhandled rejection and no toast. Guard it and toast `CONNECT_FAILED_TEXT`, as a failed GET does.

**t3.** `credential_keyring.rb:180` reads `entry.dig('proof', 'held')` on its own; it is safe only because `proof_kind` admits exactly one key and the row is built after the proof holds. Reading it as `CredentialModel.proof_kind(entry['proof']) == 'held'` would keep it safe if a later proof kind ever allowed two keys.

**t4.** The capture filter sits in both `findKindToasts` (`keyring.js`) and `findLine` (`remote-host-text.js`), so removing either alone is not caught (build log run 3). Keep the double guard if wanted, but say so in a comment at each, or test `findLine` on a capture entry directly.

## Tests against 8.2's list

Covered: baseline at load, `rev` reuse, wording per kind and grouping, capture silence, the `foundIn` wait, Connect's outcomes in order with both failures, the 403 and 422 races, the no-route text, the missing-entry toast named from the tray item, the conversation hold (both releases), the in-flight guard, the flush before the GET, the screen only on a policy or lockout refusal, `LOGIN_NOT_PERMITTED`, `returnTo`; inventory-menu: `[Connect, Examine]`, direct Connect, the covered-tray guard. Missing: out-of-order answers (m1), a 403 with another reason (m4), a failed prime followed by a find (m3). The assist code's tray slot is K3c's.
