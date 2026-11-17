# Review: A6 round 2 (callback and voicemail: the voicemail hold)

Reviewer: Opus, 2026-11-12. Reviewed at `2fdb990ef` (fix `a2f44896c`, proofs and outcomes `2fdb990ef`). No engine, test or app file has changed between `2fdb990ef` and the branch head, so the review ran in this worktree. Plan: `docs/achitechture/PHONE_CALLS_PLAN.md` 2.6 (with the hold rule), 2.7, 2.11, 9.1, 6 "A6". m07 read only from `build/phone-calls-writing` (`m07_architect_comms.ink`, `WRITER_CALLERS.md` M6, the m07 `timers`). No live server run: the defect below is in the client's slot and was reproduced with the real modules in the node harness (probe below); the server sanitiser keeps one `live` record, so it can't recover what the client dropped.

**Verdict: fix round.** One major (a held voicemail is lost on a reload when anything else of the same contact takes the slot: a newer offer, a second held voicemail, or a callback; m07 reaches it). One minor (two short windows in which the thread is open but does not hold the voicemail). Four nits. The hold itself, m3, n2, m4 and the mutations are right.

## Major

### M1. One slot record per contact: a held voicemail is dropped from the save by a newer offer, a second held voicemail or a callback

`syncSave` writes `slot.live = record(best)` when the contact has an offer, else the first held voicemail (`(voicemails.get(npcId) || [])[0]`), else the callback. The server keeps `{ forced, live }` and nothing else (`Game#clean_phone_pending_call`). So the save carries one of the three, and a reload delivers only that one. The outcomes note the first case as "rare"; the other two are not mentioned.

**Reproduced** with the real `NPCManager`, ringer, ink and `PhoneChatConversation` (harness of `phone-voicemail-hold.test.mjs`, fixture `phone_voicemail`; probe kept at `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2dd9046d-5103-4a95-9363-70f3aa5c1f4a/scratchpad/probe_a6r2.mjs`, not committed), `exportPhoneState` then `restorePhoneState` and `game_loaded` in a fresh world:

| Probe | Before the reload | Slot saved | After the reload |
|---|---|---|---|
| P1: thread open, ring 1 (`ring_vm`) declined in-phone, ring 2 from the same contact (`other_vm`) ringing | `ring_vm` held | `live`: ring 2, `ringing` | rows `[Missed call] [Missed call] [Voicemail] "First message."`: `ring_vm` never ran, `heard_vm` false, and ring 2's voicemail took its "first message" branch |
| P2: thread open, two voicemails held | both held | `live`: `ring_vm` only | `ring_vm` delivered; `other_vm` lost |
| P3: thread open, voicemail held, then a callback set for the same contact | vm held, callback pending | `live`: the voicemail | voicemail delivered; callback gone (`callbackFor` null) |

**m07 reaches it.** The Architect's home knots (`dead_air`, `parked`) rest on choices, so a decline from inside his thread is held, which is what A6 R1 M1 asked for. The hold lasts until that thread closes, and it also lasts through a call that puts the thread aside: `_closingForCall` skips `conversation_closed`, and the held run only wakes on that event (from the call's own close, the reopened thread's close, or `dropDisplaced`). The taunt timers are close together at the end: T-5 at 10 min after `cascade_armed`, T-1 at 14 min, `countdown_expired` (`seattle_call`) at 15 min; T-30 is on `room_entered:operations_floor` while T-20 runs 10 min from `team_assigned`, so those two can also land close together. Two paths:

- Decline T-1 from his thread, stay on it, `seattle_call` rings 60 s later. Answer it (the thread is put aside, T-1 still held) or let it ring. A reload during that call loses `taunt_t1_vm`: its lines, and `t1_first_contact` / `late_first_contact` when T-1 was the first call heard. A connected withheld call becomes nothing on a reload (row 27, answered, withheld), so nothing replaces it.
- Decline T-30 from his thread, T-20 rings before the player leaves it. A reload during T-20 loses `taunt_t30_vm` and with it `#set_global:architect_echo_heard:true`, the teacher-echo line the writer added so the m06/m07 thread survives a declined T-30 (WRITER_CALLERS M6 "Ink changes").
- P2 in m07: decline T-5 and T-1 from the same open thread (4 min apart), reload: T-1's voicemail is lost.

The reach is narrow (the player keeps his thread open across two taunts, then reloads before closing it), but the brief's test case loses a voicemail, and the m07 T-30 loss costs a story global. A major by this round's terms.

**Fix.** Save held voicemails beside the live record, not in it: `slot.voicemails: [{ knot, withheld }]` in arrival order, written by `syncSave` whenever the map is non-empty, whatever `live` holds. On resume, run every saved voicemail (quietly, in order, through `runVoicemail`, which holds each again until it has run), then handle `live` as now. The callback (P3) can ride the same way, as `slot.callback: { knot, callLabel }` when a held voicemail or an offer is in `live`; or decide in plan 2.6 that a held voicemail outranks a newer callback and say so. Server side, `clean_phone_pending_call` must keep the new key: an array capped like `forced` (`MAX_PHONE_FORCED_CALLS` or its own small cap), each entry through `clean_phone_call_record` or a narrower cleaner (knot pattern, `withheld` boolean), with a Rails test of the cap and of a hostile entry. Tests: P1, P2 and P3 above as unit tests, each failing first; one live route (`voicemail_held_newer`: open the thread, decline, fire a second ring of the same contact, reload while it rings, expect both voicemails' rows).

## Minor

### m1. The thread is open but holds nothing while `isConversationActive` is false

`_threadOpenOn` also requires `open.isConversationActive !== false`. The phone-chat sets that false in two states where the thread is still on screen:

- **While the thread loads** (`openConversation` sets `currentNPCId` at once and `isConversationActive = true` only after `loadStory`). A voicemail whose load finishes in that gap runs and saves. The data is safe, because the thread reads `npc.storyState` after its own load. The screen is not: the thread drew its history before the voicemail added its row and lines, so the player sees "New voicemail from X" while looking at X's thread and nothing new in it, until a reopen.
- **Once the thread's story has ended** (the `hasEnded` branches set it false and leave `this.conversation` in place). The voicemail runs now. If the contact has a `call` entry, the header button stays, and `_pressCall` calls `saveStoryState()` with the thread's old story: the A6 R1 M1 overwrite again (VARs and visit counts lost). Rare (an ended home thread with a `call` block and a voicemail ring), but it is the bug this round fixed.

This also answers item 3: removing `_drawVoicemailLive` is sound only if nothing can run with the thread on screen, and these two windows are the exceptions. The simpler fix is in the check, not a redraw: hold whenever the open phone-chat is on that contact and not ending (`currentNPCId === npcId && !open._ending`), dropping the `isConversationActive` clause. Both windows then hold until `conversation_closed`, and the existing "ending or closed" test still passes (it clears `currentNPCId`). Add a test with `isConversationActive: false` on an open thread.

## Nits

- **n1. A held voicemail arrives after the contact's next call.** Held behind X's thread, then X rings again and is answered: the voicemail runs at that call's close, after the call. m07's `taunt_t1_vm` already allows for this (`{countdown_expired: voice: Late. I did wonder.}`), and the other `*_vm` knots fold their VARs, so nothing reads wrong there. Worth one sentence in plan 2.6 so a writer knows a voicemail can follow the caller's next call.
- **n2. Held behind a thread put aside for another contact's call.** X's thread put aside for Y's call: X's voicemail waits through Y's call and then through the reopened X thread, until that closes (or `dropDisplaced` fires the owed event). Delivered, not lost, and consistent with the rule. No change; noting it because the brief asked.
- **n3. The ending releases held voicemails with a toast.** `close()` drops kept descriptors through `dropDisplaced`, which emits `conversation_closed`, and the phone closing as the ending starts does the same; the held run then writes its row and shows "New voicemail from X", not quietly. Not seen live. Pass `quiet` (or skip the toast) when the ringer is closed or suspended.
- **n4. The 20-attempt cap drops a voicemail silently.** After 20 blocked runs `runVoicemail` resolves false and `finally` releases the hold, so the slot forgets it. Twenty open-during-load races are not a real path; a `console.warn` there would make it visible if it ever happens.

## Checks, item by item

### 1. The hold (A6 R1 M1)

- **Hold and recheck:** right. `_whileThreadOpen` waits for `conversation_closed:<npcId>`; `isBlocked` is asked after the voicemail's `loadStory` and nothing awaits between it and the single save, so a thread opened during the load sends it back to wait and run afresh. The reload path (`_resumePendingCall`, `heldVoicemail`) runs it quietly with no second "Missed call" row (unit test and `voicemail_held_reload` proof).
- **Thread closed by a call (`_closingForCall`):** the event is skipped, and the voicemail still arrives: from the call's own close when the call is X's (a ringer call is a phone-chat on X, so `_threadOpenOn(X)` is true during it and its close emits), from the reopened thread's close, or from `dropDisplaced` when the reopen is refused. Late (n1, n2), and exposed to M1 on a reload in between.
- **Phone closed by a hit or knockout:** `cleanup` emits for an ordinary thread; `dropDisplaced` emits for one put aside. A knockout of X's own answered call leaves a callback while the voicemail is held, which is the P3 case of M1 until the voicemail runs.
- **Two voicemails from one contact:** run in order in memory (test); a reload keeps only the first (M1, P2).
- **A voicemail and a callback from one contact:** in memory both stand (`runVoicemail` does not clear a newer callback; `leaveMissed` clears an older one at the miss, n3 test). A reload keeps only the voicemail (M1, P3).
- **Credits/conclude suspend:** n3.

### 2. The known limitation (m07)

Yes, a voicemail is lost there, and on two more paths the outcomes did not list. M1 above.

### 3. m1 (`_drawVoicemailLive` removed)

Sound for an active thread. Not quite "can never fire": see m1 above. Fix the check, not the redraw.

### 4. m3, n2, mutations

- **m3:** right. `_resumePendingCall` returns true only for a restored forced entry not `queued` and on `npc.currentKnot`'s knot; `currentKnot` is saved and restored (`exportPhoneState` / `_applySavedPhoneState`), so the comparison uses the pre-reload knot. Three tests in `phone-callback-dom.test.mjs`.
- **n2:** right. `saved` is now read before the load, so "the thread moved on" can be true; its mutation is killed.
- **Mutations:** 19 of 20 killed (`proofs/A6_r1/mutations.txt`). The survivor, `_midCallChecked` removed, is equivalent as far as I can see: `_resumeMidCallStory` moves `currentKnot` home synchronously, and `_applySavedPhoneState` deletes its saved entry, so `_resumeCallState` runs once per contact per load (from `resumePendingCalls` or, for a contact registered later, from the apply). A second run would need a second `game_loaded`. Keeping the guard is fine.
- The five A6 test files (`phone-voicemail-hold`, `phone-voicemail-run`, `phone-callback-dom`, `phone-callback-ringer`, `phone-ringer`) pass at the head: 182 tests, 0 failed. I did not rerun the full suite or the mutation set.

### 5. Lab SE and key identity

- `a2f44896c` changes no file under `app/`, `lib/` or `scenarios/` (JS engine, tests, the test fixture, plan and proofs only), so the TTS extractor's input is unchanged and keys match the parent, as `keys_vs_merge.txt` says. The m06/m08/m09 differences there are the M10 and M1 commits, not A6.
- Lab SE: Dev and Ruth have no `ring` and no voicemail knot, so `holdVoicemail`, `_threadOpenOn` and the `heldVoicemail` resume branch never touch them; the m3 return change only affects contacts with forced entries. `proofs/A6_r1/se_dev/` hashes match `merge_main_1`. Unchanged.

## For the next round

Fix M1 (slot list for held voicemails, and the callback or a plan line, server cleaner and Rails test, P1 to P3 as unit tests, one live route) and m1 (the check). n1 is a plan sentence, n3 a `quiet` flag. A round 3 can rerun P1 to P3, the new route and the m1 test.
