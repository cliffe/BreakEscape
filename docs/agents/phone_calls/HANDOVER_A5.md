# Handover: A5 (outgoing calls and the post-call thread)

Branch `build/phone-calls`, started at 56a9e74b2. Server :3025 stopped at the end. The A4 fixer committed to the same branch in parallel (commits between mine); no file clashed.

## Done
- Commits `d31b55ce0` (engine, extractor, parity), `83e92eae0` (tests), `589ad5e77` and `f74018e63` (scenario, route) and the proofs commit carrying this note.
- **Config** (`phone-ring-config.js`): `pickButtonCall(entries, holds, callback)`, `pickPlacedCall(entries, holds, knot, callback)`, `placeCallFromTags(tags)`. A pending callback wins and skips `when`; `unavailable: "hidden"` entries never give a button; with only `no_answer` entries failing the call rings out.
- **Ringer** (`phone-ringer.js`): `dial(npcId, entry, { callback, dial })` makes the outgoing call the ringer's active offer (`direction: 'outgoing'`, `connected`, `opened`), puts the player's phone aside, opens the call; a ringing offer (any contact) goes back to the queue head; a connected or held call, the ending, a quiet-time hit, a blocking scene refuse it. `outgoingConnected(npcId, id)` is row 31 (queued same-knot non-forced offers of the contact dropped, no row, no event). `finishCall` has an outgoing branch (own end: `ended` row and reopen; row 32: ended row, no reopen, thread's close event owed through `dropDisplaced`; `noAnswer` info: `no_answer` outcome). `syncSave` never saves an outgoing call.
- **Adapter** (`phone-ringer-dom.js`): `callButtonFor(npcId, phone)`, `placeCall(npcId, { knot })`, `openCall` for outgoing (explicit `startKnot`, `dial: { when, callback }`, contact's `currentKnot` not touched until the connect), `onOutcome('no_answer')`, `noAnswer` in the end hook.
- **Phone** (`phone-chat-minigame.js`, `phone-chat-ui.js`, CSS): `_runDial` (CALLING for `DIAL_MS`, `when` at the end, `_ringOut` after `RING_OUT_MS`, `NO ANSWER` beat, then `complete(true)` with `_endedByCall` and `_noAnswer`); `_connectOutgoing`; `_stopDial` in End, cleanup; `_placeCallFromTags` (after the lines, before exit and story-end checks in both paths; an ended story is moved to the home knot and settled on the seen hub before dialling, so a ring-out comes back on its hub; a dial that cannot start re-shows the choices); header button (`setCallButton`), `setCallStatus`; the "ended with no lines" early branch in `_presentOutput` now skips a step that places a call. Terminal look: no dial screen, connects or gives up at once. The new calls of `_stopDial`, `_refreshCallButton` and `_placeCallFromTags` use `?.` because older tests build instances by hand.
- **Ring-back** (`phone-dial.js`, new static import in `phone-chat-minigame.js`): Web Audio 400+450 Hz, 0.4/0.2/0.4/2 s, gain = sound manager master x notifications volume x 0.2. No harness copy list needed: tests that load the minigame strip imports; `phone-outgoing-call.test.mjs` loads `phone-ring-config.js` and `phone-dial.js` by data URL.
- **Extractor and client**: `callStartKnots` and `call_start_knots` add every call entry; `voiced_phone_call?` is true for a contact with one; `NPCManager.callConditionHolds(when)`.
- **Tests**: `phone-outgoing-call` (+34), `phone-outgoing-ringer` (14), `phone-outgoing-dom` (11), `phone-outgoing-ui` (6), `phone-call-knots-parity` (+5), Rails `tts_line_extractor_calls_test` (5). Wrote tests with the code in the same pass; the `placeCall` early-branch bug was found by a test (49) failing first.
- **Scenario**: `test_phone_calls` gains `desk_contact` (list: `desk_call` button, `extract_call` `button: false`, `ring_desk` lever), `away_contact`, `hidden_contact` (`lever_back` sets `away_back`), `caller_debrief` call entry and hub choice. Validator 0 errors (same warnings as before). README rows added.
- **Live** (`tools/phone_calls/routes/a5_live.sh`, `proofs/A5/README.md`): desk, row31, away, placed_ringout, debrief, ending_keep, ending_end all pass; lab SE hashes, contact list and DM list identical; key identity holds against A4.

## Open
- A reviewer pass over A5.
- Callback (A6): `callButtonFor` and `placeCall` pass `null` for the pending callback; the plumbing (`callback` through `dial`, `isCallback` in `connecting`) is there and unit-tested.
- Not live: the terminal-look dial; a `#place_call` in a terminal-theme thread; `#place_call` with no knot.
- `a5_live.sh` is a little loose in `away` (it navigates by closing the phone).

## Gotchas
- A call placed from a thread whose phone is not reopened (`debrief`, `ending_end`) fires `conversation_closed:<npc>` twice (the call's own plus `dropDisplaced`'s owed thread event). By design from A3; a mapping with `onceOnly: false` on that event would run twice.
- The dial timeline lives in the minigame (timers on the screen), the connect is reported to the ringer with `outgoingConnected`; if the minigame is closed before the connect the ringer sees an end with no `connectedAt` and writes no row.
- The route helper `choose_text` takes a substring and is inside a double-quoted JS string: no apostrophes in the text.
- `bin/test-js` takes over 2 minutes; run it in the background under the lock.
