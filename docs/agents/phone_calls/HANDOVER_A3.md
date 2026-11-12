# Handover: A3 (ringing inside an open phone)

Branch `build/phone-calls`, started at 6776b18ba. Server :3025 stopped.

## Done
- Engine (row 10). `phone-ringer.js`: the world predicates get the caller (`ringBlocked(npcId)`, `openBlocked({ npcId, second? })`, `minigameOpen(npcId)`, `putAside(npcId)`) and a new `phoneHost(npcId)`; the banner view carries `inPhone` and the render key includes it. `phone-ringer-dom.js`: `registerPhone` / `unregisterPhone`; `hostPhone(npcId)` is the open minigame when it is the registered phone and its `phoneId` is the caller's (`npc.phoneId || 'player_phone'`); the panel goes into the phone, a phone that is not the caller's (desk phone, DM app) stays a minigame (row 12, banner and hold). `putAside` closes the host phone with `params._closingForCall` (via `endMinigame(false)`) and returns `{ kind: 'phone', params, thread }`; `reopen` starts a phone-chat from those params without `startKnot`, with `npcId` set to the thread or deleted for the contact list.
- `phone-chat-minigame.js`: `_registerWithRinger` in `init` (skips `ringerCall`, `voiced`, `disableClose`, `pretextCallId`, `cutscene`), unregister at the end of `cleanup`, `callReopenState()`, `showIncomingCall` / `hideIncomingCall`, number keys ignored while the panel shows, `_emitConversationClosed` returns early when `params._closingForCall` (this is where row 10's skip lives, so the cleanup regex tests keep passing). `phone-chat-ui.js`: `showIncomingCall(view)` (panel appended to `.phone-screen`), `hideIncomingCall`, `incomingCallShowing`, torn down in `cleanup`. `css/phone-ring.css`: `.phone-incoming-call`.
- Tests: `test/js/phone-ring-in-phone.test.mjs` (14 tests). No new static import, so no harness copy list change.
- Scenario: `test_phone_calls` gains `caller_thread` (lever `lever_thread`, 8 s delay), `desk_line` and the `desk_phone` object; README table row. Validator 0 errors.
- Live (`tools/phone_calls/routes/a3_live.sh own|other|list|desk`, `PC_PORT=3025`; logs and shots in `proofs/A3/`): all four cases pass. Own thread: End pressed with the call's choices showing; reopened thread is on `start` (`choiceTargets` `start.0.c-0`, `start.0.c-1`, `own.log`).

## Observations
- `conversation_closed:caller_thread` fires once from the call's own phone-chat at End, and once more when the reopened thread is really closed (own case). No event fires at Answer for the thread that was open. Another thread (texter) or the list: one event for the caller at End, one for texter at the real close.
- After End on the own thread the reopened thread shows the home knot's first line again (hub line twice: before and after the call's own line). This is the existing "thread comes back on its hub" behaviour (goToKnot then continue), not new. A5 owns the post-call thread; say if you want a single hub line.
- Other and list cases: `caller_thread`'s saved story is on `start` with no pending choices until its thread is next opened (nothing continued it). The own case has the choices because the thread was reopened on it.
- A phone that is open when a call is answered stays on screen for the 500 ms open delay with the panel gone.
- No A0 baseline exists for a Friendface DM list screenshot (A0 has only `se_phone_contacts.png`); `proofs/A3/dm_list.png` is the new baseline from `test_dm_social`.

## Regression
- Lab SE (`proofs/A3/se_dev/`): `sha256_noseed` for `dev_service_desk` and `ruth_phone` identical to `A2b_r3` and `A2c` after the call and after reload; `/tts` request list identical to A2c; contact list screenshot pixel-identical to A0 and A2c; Dev thread identical to A0 (A2c's differs by 832 pixels in the footer row, its own variance).
- `bin/test-js -j 3`: 509 files passed, 0 failed.

## Open
- Reviewer's pass over A3.
- Not tried: a ring over the phone while a text bark toast is up; a phone-chat opened by a notification click with `startKnot` (the reopen drops `startKnot` by design).
