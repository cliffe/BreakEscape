# Outcomes: A3 review round 1

Fixes for `REVIEW_A3_R1.md`. Engine commits: `0c0de4a54` (M1), `91e1abba4` (m3, m4, m5), `bfd8cf8be` (n1, n2), `9f0cd4839` (m1, the duplicate hub line). Proofs in `proofs/A3_r1/`. Every new test was run before its fix and failed for the stated reason.

| Finding | Outcome | Where |
|---|---|---|
| M1 | Fixed | `phone-ringer.js` `dropDisplaced`, `phone-ringer-dom.js` adapter `dropDisplaced` |
| m1 (duplicate hub line) | Fixed in the engine | `phone-chat-conversation.js` `settleOnSeenLines`, `phone-chat-minigame.js` `_resetAfterRingerCall` |
| m2 (home routers) | Not an engine gap; already handled on the writers' branch, and guarded in the engine | see below |
| m3, m4 | Fixed with one "Connecting" panel | `phone-ringer.js` `connectingInPhone`, `phone-chat-ui.js` `showIncomingCall` |
| m5 (A2c R3 m1) | Fixed | `phoneRinger.suspend(on)`, `scenario-music-events.js` `playEntry` |
| n1 | Behavioural test added | `test/js/phone-chat-closing-for-call.test.mjs` |
| n2 | Fixed | `phone-ringer-dom.js` `putAside` |

## M1. A displaced phone that is not reopened still emits its thread's `conversation_closed`

Every place the ringer gives up a displaced descriptor now goes through `dropDisplaced(d)`, which calls an adapter effect of the same name. For a `kind: 'phone'` descriptor with a thread, the adapter emits `conversation_closed:<thread>` once (the list, with no thread, owes nothing). The paths:

- `reopenDisplaced` when it does not reopen: ringer `closed`, a queued scripted beat, a hit inside `HIT_QUIET_MS` (`openBlocked()` or `hitWithin`). This covers row 25's drop, the hit before End, `giveUp` (which now also runs `reopenDisplaced` when the ringer is closed, where it used to lose the descriptor silently) and a call ended by its own path after `close()`.
- `finishCall` for row 32 and for a forced call hit after the ending began: the drop waits for `afterSwap`, because the end hook runs inside another minigame's `startMinigame` and a listener on the event could otherwise start something mid-swap.
- `close()`: a held offer whose phone was already put aside.
- `finishOpen`: a second descriptor (a forced call re-ringing into a phone the player opened again) replaces the first. The newer screen wins, as the review proposed, and the older thread's event fires through the helper.
- The adapter's `reopen` itself: if something else opened first, or `startMinigame` refuses, it drops through the same helper.

Decision: I did not add the optional "retry the reopen once `HIT_QUIET_MS` has passed". The plan's row 25 drop stays; the thread's event is the only thing that was missing.

Tests (`phone-ring-in-phone.test.mjs`, each exactly one event; a normal End emits none from the ringer, because the reopened phone fires its own at the real close): hit before End, a list phone (none owed), row 32, queued beat, ringer closed while connected, ringer closed while held with the phone put aside, `giveUp` with a beat queued, second phone during a forced re-ring (the call then ends back on the newer thread).

Live (`proofs/A3_r1/hit.log`, `hit_events.json`): `texter` thread open, `caller_thread` rings in the phone, Answer, `playerHealth.damage(5)`, End. Events: `phone_call_answered:caller_thread`, `conversation_closed:caller_thread`, `minigame_completed`, `conversation_closed:texter`, once, and still once 8 s later. The phone does not return. In the review the `texter` event never fired.

m09 HaX's `conversation_closed:agent_0x99` re-ring: no route reaches it. `m09` on this branch has no `ring` entries (the M-slice rings are on the writers' branch, unmerged), so Gary, Torres or Nightshade cannot ring over HaX's thread here. The mechanism is the same event through the same helper, covered by the harness tests above.

## m1. The duplicate hub line, fixed in the engine

Cause: the post-call reset moves the story to the home knot without continuing. Its first line is already in the thread (preloaded, or read at an earlier open), so the next open continued the knot and printed it again.

Approach: after `goToKnot(home)`, `_resetAfterRingerCall` calls `conversation.settleOnSeenLines(history)`. It runs the story on to the home knot's choices, silently (global observer off, no tags run, nothing written to the thread), and keeps the result only when all of these hold:

- every line it printed is already in the thread's history (matched on the raw line or the line without its speaker prefix);
- no step came from one of the call's own knots;
- it ended on choices and did not throw.

Otherwise the story is loaded back to exactly where the reset left it, so behaviour is as before for the cases that were right: a home knot nobody has seen still prints at first open, a home knot that now prints something new still shows it, and a home that ends the story is untouched. I chose this over restoring the state saved when the call opened because that state loses ink variables and visit counts the call changed, and the position it holds may not be the home knot at all. The read-ahead keeps the call's variables and counts and lands on the home knot, as the plan says (2.5).

The next real open restores the saved state, finds choices and shows them. If a global changed meanwhile, `reopenWithCurrentGlobals` re-runs the knot as for any resting thread and drops the lines the thread already shows. Tests (`phone-ring-home-hub.test.mjs`, real ink in `fixtures/ring_home_hub.ink`): the bug reproduced (the knot can still continue), the settle, a save and restore round trip with a choice picked afterwards, an unseen line, a two-line hub with one line missing, a silent home, a router that diverts into a call knot, a router that does not, a home that ends, no writes and the observer put back. `phone-outgoing-call.test.mjs` checks the minigame calls it after the move home and before the save, and not for a call that diverted out of its knots. The legacy voiced and `callLaunch` calls never run the reset (no `ringerCall`), so lab SE is untouched.

Live, on the reviewer's reproduction (`proofs/A3_r1/closed.log`, `closed_thread.png`): the phone is never opened. `caller_thread` rings (banner), Answer, End. Then phone, thread: `Thread here. This is the home knot. | This is the thread caller. You can hear me now.`, choices `1. Anything new? 2. Tell me more.`, the saved `choiceTargets` are the home knot's (`start.0.c-0`, `start.0.c-1`). Review: the home line three times. A second open of the thread is identical. The own-thread End case (`own.log`): the same two lines and the same choices after the reopen, `choiceTargets` on `start`, one `conversation_closed:caller_thread` from the call and one from the real close.

## m2. Home routers that replay call knots as texts

The writers' branch (`build/phone-calls-writing`, read with `git show`) has already changed both:

- m05 `recruiter` `start` is now "a silent by-hand resting router": `{not torres_identified: -> not_yet}`, else `-> idle`, and `idle` and `not_yet` print nothing but a narrator tag and a `+ [Leave it.]` / `+ [No messages.]` choice. It no longer routes into `return_contact`.
- m07 `the_architect` `start` ("this home router never enters a taunt or the sign-off") routes only to `after_win`, `dead_air` and `dormant`.

So the replay in m2 is gone at the source. The engine also guards it: if a home router did divert into a call knot, `settleOnSeenLines` sees a step from `callKnots` and puts the story back as the reset left it, rather than leaving the call's choices on the thread as texts. My fix does not repair such a router (the old replay would return); the validator rule the review proposed for A7 is still the right net. I did not read `dead_air`, `dormant` or `after_win` for printed lines: if they print and the thread already shows them, the read-ahead covers them.

## m3 and m4. The "Connecting" panel

While an answered call is on the player's own phone and has not opened (`held`, or `connected` before `opened`, which is the 500 ms `SCRIPTED_CALL_START_MS` wait), the ringer renders a panel view with `connecting: true`. The panel shows "Connecting…", no Answer or Decline, and Hang up when the call is held and not forced (`hangUp` already worked on a held offer). Hold time counts while that panel shows, so the 90 s rang-off limit still applies. Tests: m4 (panel up in the 500 ms, gone once the phone is put aside), m3 (held by a queued beat: panel, Hang up declines it and the phone stays open), a forced call that answered itself (no Hang up). The mutation the review found surviving (the host exclusion in `minigameOpen`) is now caught by the m3 test.

## m5. `phoneRinger.suspend(on)`

`ringBlocked()`, `openBlocked()` and the ringer's own open check return true while suspended. Queued, ringing and held offers stay, and the tick keeps running; a ringing call can still be answered and is then held. `playEntry` calls `suspend(true)` just before `concludeMission()` and `suspend(false)` in the refusal branch; agreement still `close()`s. Tests in `phone-ring-suspend.test.mjs`: a queued offer does not ring until lifted; an offer answered during the suspension is held and opens after; one held before the suspension does not open when the way clears; suspend then close removes the offer with no events; and `playEntry` driven for real with stubbed imports: suspend before the request, nothing lifted while pending, agreement closes and opens the credits, refusal lifts and does not close.

## n1 and n2

n1: `phone-chat-closing-for-call.test.mjs` drives the real `PhoneChatMinigame.cleanup` (imports stubbed): a phone with `_closingForCall` emits nothing and still unregisters; the same phone closed otherwise emits once; a list phone emits nothing; `callReopenState` drops the flag and does not mutate the live params. With the skip removed it fails 1 of 4.

n2: `putAside` clears the flag and returns null when `endMinigame` threw and the phone is still open, so a later real close still emits its event.

## Regression

- `bin/test-js` and the Rails TTS tests: see the log line.
- Lab SE (`proofs/A3_r1/se_dev/`): `sha256_noseed` for `dev_service_desk` (`ffe4c083…`) and `ruth_phone` (`52c50b7a…`) identical to `A3/se_dev` after the call and after reload; the `/tts` request list identical.
- Not run: `phone-ring-in-phone` as a live Connecting panel. The 500 ms window is too short to capture reliably in a headless run, and the held case needs a queued beat over the phone; both are covered by the harness against the real adapter.
