# Review: A6 round 1 (callback and voicemail; A5 R1 M1; A4 R2 m1, m2, n5)

Reviewer: Opus, 2026-11-12. Reviewed at `4805d5ab5` (A6 commits `1668894b0`, `cb357c252`, `4805d5ab5`) in a detached temporary worktree, now removed. Plan: `docs/achitechture/PHONE_CALLS_PLAN.md` 2.3 (rows 7, 17, 18, 20, 21, 27, 32), 2.6, 2.7, 2.11, 3.1 to 3.4, 4.2, 6 "A6". Live check: keyless :3024, headless, game 1888, server stopped afterwards.

**Verdict: fix round.** One major (a voicemail that lands while the caller's own thread is open loses its ink VARs; reproduced live). Four minor, six nits. Everything else matches the plan, and the callback half is solid.

## Major

### M1. A voicemail that lands while the caller's thread is open loses the VARs its knot set

`PhoneChatConversation.runVoicemail` restores `npc.storyState`, runs the knot, goes home and saves once (`phone-chat-conversation.js` `runVoicemail`, the `npc.storyState = conversation.saveState()` line). The open phone-chat holds its own loaded story, and that story never saw the voicemail. Its next save (`_saveStoryStateFor` after any choice, `_pressCall`, `#place_call`, `_flushPendingMessages` with pending lines) writes that story over `npc.storyState`. `recordInkVariables` then replaces the contact's saved ink variables with the open story's values as well. Both copies lose the voicemail's VARs and its visit counts.

This is the ordinary path. A3 rings inside the phone (row 10), so a player reading X's thread when X rings sees the in-phone panel and presses Decline. The thread is then still open on X.

**Reproduced live** (`test_phone_calls`, game 1888, at `4805d5ab5`). Open the phone on `caller_voicemail`'s thread, fire `ring_voicemail`, press the in-phone Decline (`button[aria-label="Decline call"]`):

| Step | `npc.storyState` `heard_vm` | saved ink vars `heard_vm` | open story `heard_vm` |
|---|---|---|---|
| before the ring | (none) | false | false |
| after Decline (thread still open): rows, two voice bubbles, toast "New voicemail" | **true** | **true** | false |
| after choosing "Anything new?" in the open thread | **false** | **false** | false |

The thread then reads "Unknown number. Nothing to say yet." It should read "You listened to my message. Good.", and the reopened thread says the same wrong line. The same happens if the player opens X's thread while the runner is loading: the thread loads the old state, and its first choice overwrites the run's save.

**Why it is a major:** m07 is the consumer. The Architect's `taunt_*_vm` knots set only ink-local VARs (`heard_t30`, `heard_t20`, `late_first_contact`, `t20_folded`, `t1_first_contact`). If they are lost, the next live taunt opens as first contact again, or folds a line the player has already heard. That is a visible story error on a path the player reaches just by declining from the caller's own thread. The globals survive (`#set_global:architect_echo_heard` goes through `applyTags`), so only the ink-local state is lost.

**What should happen: queue it.** In `NPCManager.runVoicemail`, when the contact's thread is the open phone-chat (`_sceneType === 'phone-chat'`, `currentNPCId === npcId`, not `_ending`), hold the run until that thread closes. Both `closeConversation` and `cleanup` emit `conversation_closed:<npcId>`. Then run the voicemail and show the toast. Check again just before the single save: if the thread opened while the story loaded, drop the result and queue a fresh run. The "Missed call" row is drawn at once as now; the voicemail row, bubbles and toast follow when the player leaves the thread. This keeps 2.6's single-save rule as it stands, and a voicemail turning up a moment after the missed call is how a real handset behaves.

Running the knot in the open thread's story is worse. Its position is on that thread's choices, and ink can't return there except by restoring a saved state, which would also undo the VARs. The other workable option is to run now and then write each ink-local VAR that the run changed into the open story with `setDeclaredVariable`, so the thread's next save carries it. That keeps the bubbles live but still loses the knot's visit counts and gives 2.6 a second rule. Take it only if live bubbles in an open thread matter more than that.

Tests: a unit test with a fake open phone-chat on the contact: no run while it is open, one run after `conversation_closed`, and the VAR survives a save by the open story. The live probe above as a route in `a6_live.sh` (`voicemail_open`), with the in-phone Decline. Add a line to plan 2.6.

## Minor

### m1. A voicemail with no lines redraws the whole thread into the open phone

`NPCManager._drawVoicemailLive` takes `history.slice(-(lines.filter(...).length))`. With no non-empty line, that is `slice(-0)`, which is `slice(0)`: every message in the contact's history is appended to the open thread again and marked read. A knot whose `voice:` lines all sit in branches that fail, or a knot that only sets VARs, triggers it. Guard with `if (!count) return;`. Under M1's queue this path mostly goes away, but keep the guard.

### m2. `NPCManager.runVoicemail` has no unit test

Mutations that survive every phone test: the toast shown after a reload (`quiet` ignored); the caller's name shown for a withheld caller; the live draw removed. The live proofs cover the toast and the withheld text for an ordinary Decline. "Quiet after a reload" is covered only at the adapter, which passes the flag, and the handover lists it as not live. Add a test of `NPCManager.runVoicemail` with a stubbed `showNotification`: named, withheld, quiet; and the live draw into a fake open thread, which M1 changes anyway.

### m3. The forced-call skip in the mid-call reset is per contact, not per knot

`_resumeCallState` skips `_resumeMidCallStory` whenever `_resumePendingCall` restored any forced entry (`return forced.length > 0`). Row 5 allows a forced offer from X to queue behind a connected outgoing call to X on another knot. If the game reloads then, the forced call F is restored and the thread stays on the outgoing call's choices. F re-rings `RERING_AFTER_LOAD_MS` later and auto-answers within `AUTO_ANSWER_MS`. A player who opens X's thread in those few seconds sees the outgoing call's choices as silent text, the A5 R1 M1 symptom. Skip only when a restored forced entry was on the line (`state` not `queued`) and its knot is `npc.currentKnot`; otherwise reset as usual. Add one test.

### m4. `refreshSave` (A4 R2 m1) is not what the tests prove

Removing `ringer.refreshSave?.(npc.id)` from `_resumePendingCall` fails no test. In both tested paths, the sync comes from the `syncSave` inside `setCallback` (a callback) or inside `leaveMissed` (a voicemail). `refreshSave` is needed only when the resume leaves nothing and saves nothing: a withheld caller with the default `onMissed` (which A7 makes a validator error, though the engine accepts it), or a contact with no `missedOffline`. The fix is right; the test "the resume that leaves nothing … still schedules a sync" should use the case that leaves nothing, a withheld ring without a voicemail knot. As written it uses a voicemail, which syncs anyway.

## Nits

- **n1.** Three of the changed older tests (`phone-ringer` M3, M7, R2 M2) now assert only `.state === 'missed'`. That is the right update: the call is gone and its callback is saved. M7 should also assert `knot === 'call_b'`, so a stale `call_a` callback can't pass.
- **n2.** Mutations that survive: `_midCallChecked` (the once-only guard) and `resetToHome`'s "thread moved on while the story loaded" check (`npc.storyState !== saved`). The handover already calls the late-registered test weak. One assertion each.
- **n3.** In `leaveMissed`, the voicemail branch's `dropCallback` can be removed without any test failing. It matters only for an offer that is missed without ever ringing (a queued one lost to a reload) while an older callback is pending. Test it, or say in a comment that row 7 makes it rare.
- **n4.** `runVoicemail`'s `mirrorSetGlobalTags` and `recordInkVariables` lines can each be removed without a failure. A test that reads the global inside the knot after `#set_global`, and the saved ink variables after the run, would pin them.
- **n5.** Row 18 with `onMissed: "voicemail"` but no `voicemailKnot`: the "rang off" toast is suppressed, then `leaveMissed` falls back to a callback, so the player gets a callback and no toast. A7's validator rule (voicemail needs a knot) prevents it; it could also be fixed by testing `o.voicemailKnot` as well in `miss()`.
- **n6.** A callback dial cut by something else leaves the callback again (`finishCall`, `!own && o.callbackDial`). Plan row 32 says an outgoing call leaves no callback. The extension is sensible, because the player never got the callback conversation. Add a line to row 32 so the plan matches.

## Checks, item by item

### 1. Callback and voicemail against 2.6, 2.11 and the rows

- **`onMissed` on every miss path:** Decline (row 20) and Hang up from hold (row 17) through `declineOffer`; ring-out (row 21) and the hold limit (row 18) through `miss`; row 32 and `giveUp` with `answered: true` (always a callback); reload (row 27) through `missedOffline`, which treats `connected` as answered. `voicemail` needs a knot, and an answered call never leaves one. A withheld caller with no voicemail leaves nothing. A forced call is never missed. This matches 2.6 and rows 18 and 32. Unit-tested, with the mutations below all killed.
- **Header "Call back"** (`callButtonFor`, also with no `call` block) and **the row button** (`refreshRowCallBack`, latest missed row only, `aria-label="Call <name> back"`): right. `callbackChanged` refreshes an open thread when the callback is set or cleared. Live: `decline`, `patient`, `debrief_ko` proofs.
- **`call_is_callback`** is true exactly on a callback connect. The flag rides `connecting.isCallback` from `dial` and is gated by `callVariablesFor`'s open-call check, so the thread, previews and other channels read false. Both buttons, a bare `#place_call` and `#place_call:<callback knot>` all dial it. `pickPlacedCall` now lets the callback's knot dial with no `call` entry (needed for a ring-only caller). The connect clears the callback and emits `phone_call_answered` with `callback: true` (3.4).
- **Row 7:** `startRinging` clears the callback, and a queued offer keeps it. One detail: while the new offer is queued, the saved slot holds the offer, not the callback (`syncSave`: "a contact's offer outranks it"). A reload then turns that offer into its own outcome, which is what row 7 says happens once it rings anyway. Fine.
- **Voicemail run:** restores the saved story and saved ink vars, syncs globals (also in `loadStory`), applies engine VAR defaults, goes to the knot, continues to the end, mirrors and applies tags, writes the row, then the lines unread, goes home, puts `currentKnot` back, saves once. `voice:` bubbles play on tap under the contact's id (`voicemail`, `terminal` proofs; `/tts` requests under `caller_voicemail` and `caller_terminal`). The toast is "New voicemail from <name>", or "New voicemail" when withheld. Matches 2.6, apart from M1.
- **`withheld`:** banner "No caller ID", row "Missed call: No caller ID", toast without a name, no callback. Right.
- **m07 voicemail knots** (`build/phone-calls-writing`, `m07_architect_comms.ink` `taunt_t30_vm` to `seattle_call_vm`, read only): they run through `runVoicemail` unchanged. `~ heard_* = true` assignments (ink-local VARs), conditionals on ink and global VARs (`team_assignment`, `redirect_window_closed`, `countdown_expired`, `architect_t20_played`), one tag (`#set_global:architect_echo_heard:true` on its own line; it rides the next line's tags and goes through `mirrorSetGlobalTags` and `applyTags`), `voice:` lines inside branches, and `-> DONE`. No diverts out, no `#exit_conversation`, no `Narrator:` lines. The extractor's static walk lists every branch's `voice:` lines under `the_architect`. M1 is the one problem for m07, because every one of those knots sets ink-local VARs.

### 2. The open item (voicemail with the thread open)

Reproduced and rated a major: M1 above, with the recommended behaviour.

### 3. A5 R1 M1 (option b)

- The fix is right for the probed cases. `_ringerCallKnots` covers `call` entries, `ring` mappings and a `ring` timed conversation, and never a legacy voiced call. The home knot is excluded, so Dev's form (a ring onto a `voiced: true` home knot) is never reset. `resetToHome` restores the saved story, goes home, saves once, and steps aside if the thread moved on. The `midcall_out`, `midcall_in` and `reload_forced` proofs match the review's acceptance list.
- **"No row" for an outgoing call cut by a reload:** keep it, and record it in plan 9.1 together with A5 R1 n3 (End during the dial leaves no row). A reload is outside the fiction. No duration is known, because an outgoing call is never saved. "Call ended" and "Call failed" are not 2.6 row texts, and either would be a new `callEvent` for the server whitelist and the validator. The incoming case keeps "Missed call", which is right: the caller's side of the story (a callback) depends on it.
- **A thread that rests on a call knot for a good reason:** I found none that is wrongly reset. A call that ends by diverting into the home hub leaves `currentKnot` on the call knot (`_resetAfterRingerCall` returns early when the choices are not in `callKnots`). A reload then moves the story to the home knot it was already on, which is harmless. A text mapping that opens the thread on a knot that is also a `call`/`ring` knot would be reset, but that knot is a voiced call knot by definition (3.1, 3.2), and A7's validator should flag such a mix. The one wrong *skip* is m3 above.

### 4. A4 R2 m1, m2, n5

- **m1:** fixed. Every resume path that changes the slot now saves it, and the debounced sync follows. The test only goes through `syncSave` (m4).
- **m2:** fixed. "A4 R2 m2: suspend(false) reopens a kept descriptor once and empties the list…" in `phone-callback-ringer.test.mjs`. Mutation (leave `keptDisplaced` as it is in `suspend(false)`): killed.
- **n5:** fixed. Callbacks live in the ringer (`callbacks` Map), and every `syncSave` writes them as `live: { state: "missed" }`. Mutation "slot drops the callback": killed by five files.

### 5. Tests

- At `4805d5ab5`: all 43 `test/js/phone-*.test.mjs` files pass, and 177 lab SE, social and pretext files pass. `tts_line_extractor_voicemail_test.rb`: 5 runs, 0 failures.
- **Mutations, one at a time, across all 43 phone test files: 54 run, 43 killed, 11 survived.** Killed: row 7 drop; withheld leaves a callback; answered leaves a voicemail; no `leaveMissed` on Decline, ring-out, `giveUp` or row 32; slot drops the callback; connect keeps the callback; answered event `callback: false` or missing; a cut callback not left again; dial `isCallback` false; `restoreCallback` sets nothing; `missedOffline` never answered or not quiet; rang-off toast with a voicemail; `setCallback` without refresh, save or label; adapter label "Call", no button without a `call` block, `placeCall` ignoring the callback, a callback dial not marked, `callbackChanged` a no-op, voicemail `quiet` or `withheld` dropped; `pickPlacedCall` in the old order; row button not drawn by `addCallRow`, put on the first missed row, or shown for any kind; resume without `missedOffline` or `restoreCallback`; mid-call reset not skipped for a forced call, ignoring `call` entries, ignoring `ring` mappings, including legacy voiced, not resetting the story; a late-registered contact not resumed; voicemail not going home, not restoring the saved story, not applying tags, no row; `suspend(false)` not emptying. Survived: m2 (3), m4 (1), n2 (2), n3 (1), n4 (2), `runVoicemail` not putting `currentKnot` back (equivalent here: home is `start`), and `resetToHome` not setting `currentKnot` (equivalent: the caller sets it).
- **The changed older tests** (persistence ×3, ringer ×4) are right updates and not weaker: each still proves the call itself is gone (it would read `ringing`/`connected` otherwise). The first persistence change also checks the knot. See n1 for M7.

### 6. TTS

Key dumps (`TTS_DUMP_CHATTER=1`) rerun at `8ec328b28` (A6 start) and at `4805d5ab5`: every scenario is identical except `test_phone_calls`, which gains 5 keys and loses none: the three voicemail texts (the terminal's second line shares a key with `caller_voicemail`'s identical line and voice) and the two `ring_call` lines. The A6 dump matches `proofs/A6/keys_new_a6/test_phone_calls.txt`. Voicemail lines are listed under the contact's id with the prefix stripped and no delivery note, and only for knots named in `ring.voicemailKnot`. A knot that merely holds `voice:` lines is not voiced (Rails test).

### 7. Lab SE

Unchanged. `proofs/A6/se_dev/`: `sha256_noseed` `ffe4c083…` (`dev_service_desk`) and `52c50b7a…` (`ruth_phone`) equal A5's; `se_phone_contacts.png` is byte-identical (`d30d40ce72a7…`); the four `/tts` texts are identical. No lab scenario file changed. In the code, Dev has `callId` (no button, no callback dial) and the lab has no `ring`/`call`, so `_ringerCallKnots` is empty for both contacts.

## For the next round

Fix M1 (queue, with a test and a live route), m1 to m4, and n1 to n6 where convenient. A round 2 can check M1 live, plus the m3 test, and rerun the surviving mutations.
