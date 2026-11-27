# Review: A2b round 1 (ringer wiring and the banner, phone closed)

Commits reviewed: `81d4cf1f7`, `a4bcf86e0`, `2cb86788c`, `8baac0e96`, `ad74d6257`. `phone-ringer.js` itself is out of scope; it was read only where the wiring calls it.

Runs at HEAD `78f088fd3`:

- `node --test` on the seven named files: 67 pass, 0 fail.
- `tts_line_extractor_ring_test.rb` under the lock: 6 runs, 0 failures.
- Key dump against `keys_baseline_a1/`: differs only in m09 and m10 (the M2 moves; neither has `ring`, so A2b's extractor change cannot touch them), plus two new test scenarios, `test_phone_calls` (32 keys) and `test_phone_call_notes` (from the M track, not A2b). `lab_social_engineering` is identical.

## Findings

### M1. The Mission Brief opens in front of an answered opening call (row 30 fails live)

`npc-manager.js:1980` asks `phoneRinger.hasOpeningOffer()`, and that check (`phone-ringer.js:843-845`) leaves out an offer in state `connected`. Between Answer and the call's `startMinigame` (the 500 ms open delay), `connected` is the state and nothing is `currentMinigame` yet. So `briefPopupBlocked()` (`utils/helpers.js:53`) is false and the brief poll opens the Mission Brief. The second `openBlocked` check then fails and the call drops back to `held`. With no pill in A2b, the player has answered a call that has vanished behind the brief.

The proof shows exactly this: `timed_session.jsonl`, where the state goes ringing → answered → Mission Brief open → `held`, `opened: false`. The README files it under A2c, but plan 5.3 asks A2b's `timed_caller` to show "the Mission Brief popup waits".

**Fix:** in `hasPendingOpeningConversation`, also return true while `window.phoneRinger?.callActive?.()` (true through the open delay), or count a connected offer with `opening && !opened` in `hasOpeningOffer`. Add a harness test (opening offer answered, brief check true until the call's minigame is open) and re-run the `timed_caller` proof.

### M2. A timed ring call moves `npc.currentKnot` to the call knot when it is offered

`npc-manager.js:2129` sets `npc.currentKnot = conversation.targetKnot` at offer time. The legacy path does this only in `beforeOpen` (`:2166`), as the call opens. A thread opened with no saved story starts on `npc.currentKnot` (`phone-chat-minigame.js:473`), and the preload skips a call knot (`phone-chat-conversation.js:883-887`).

Failure: the timed call is declined, times out, is still queued behind the briefing, or the offer comes back `dropped` or `refused`. The player then opens the contact's thread and the call knot runs as silent text, choices included. This is the "call's choices as texts" case that 2.5 exists to prevent. After a connected call the reset's `goToKnot(home)` repairs it, which is why the proofs never showed it.

**Fix:** delete the assignment. `openCall` already passes the knot explicitly as `startKnot`, the same as for mapping rings. Add a harness case: a timed ring is declined, and the thread then opens on `homeKnot`.

### M3. The bark hold during a call has no behaviour test and no live proof

The `_shouldDefer` term (`npc-barks.js:181-183`) is checked only by a source regex (`phone-ring-layer.test.mjs:175`). The "held text" variant of `caller_debrief` is in the A2b acceptance and is not in `proofs/A2b/README.md`. The risk this term guards against is a toast click that ends a bring-in call (row 32). The drain on close depends on `callActive()` being false when `endMinigame` drains, before the end hook runs (`minigame-manager.js:303-310`).

**Fix:**
- Add a test with the real `NPCBarkSystem._shouldDefer`: true while the call is open, false at drain time.
- Add the live proof: `texter` sends via a `delayMs` mapping during a connected call; no toast shows during the call, and it shows after.

### M4. The regression routes that the plan sets for after A2b were not run

Plan 5.4's cadence runs m09 Recruiter + resume, m09 `identity_scene` and m10 `breach_call` after A2b. The m09 Recruiter route is the one with real exposure. It is a legacy forced call closed by a hit, which now goes through the changed `endMinigame` (try/finally plus hook), `_releaseForcedCall` (`phone-chat-minigame.js:1302`) and `cleanup` → `_resetRingerCallOnTeardown`. Each is gated on `ringerCall`, so I expect no change, but the plan asks for proof.

**Fix:**
- Run the m09 Recruiter route. If another agent is editing m09, run it from a detached worktree at this HEAD. Compare its `/tts` list and `pendingCall`/`storyState` with `proofs/A0/m09_hit_*` and `m09_recruiter_*`.
- Also run `identity_scene` and m10 `breach_call`. They are lower risk but cheap, and the cadence names them.

### m1. Esc on a ringer call avoids `complete(false)` only by listener order

`phone-chat-minigame.js:293` routes Esc to `closeConversation()`. The base `_fallbackCloseHandler` (`base-minigame.js:72-81`) is still registered. It is skipped today only because the phone's listener is added first (in `init`, `:185`) and `cleanup` removes the base one during dispatch, with the superseded-instance guard in `complete()` as a backstop.

The test (`phone-outgoing-call.test.mjs`, "Esc is End call") calls `handleKeyPress` directly, so the base handler is never in play. A2a R4 m2 asked for the base listener to be removed or bypassed.

**Fix:** in `start()`, after `super.start()`, remove `_fallbackCloseHandler` when `params.ringerCall` is set. Add a jsdom keydown test that registers both listeners.

### m2. The continue path keeps `#exit_conversation` after "Keep going"

`phone-chat-minigame.js:861` clears only `accumulatedMessages` when `_endingKeptGoing` says keep going. The after-choice path clears both lists. The new exit check at `:886` then ends a ringer call the player chose to stay on. No shipped ring uses `#ending_check` yet.

**Fix:** clear `accumulatedTags` too, or gate the `:886` check on the kept-going result.

### m3. Several A2b paths are tested only by source regex

These checks match the source text, not behaviour:
- the `#exit_conversation` continue path (`phone-outgoing-call.test.mjs`, "both #exit_conversation paths");
- the minigame-manager `finally` and the hook placement (`phone-ring-layer.test.mjs:169-178`; the harness's fake framework calls the hooks itself);
- `callScreenOnly`.

Each can fail on a refactor without the behaviour breaking, and can pass with the behaviour broken.

**Fix:**
- Call `_presentOutput([], ['exit_conversation'], {choices: []})` on the stubbed instance and assert `_exitRingerCall`.
- Load the real `minigame-manager.js` with a scene whose `cleanup` throws and assert the end hook still gets the ending minigame.

### m4. `callScreenOnly` also hides the context of a resumed ringer call

`phone-chat-minigame.js:505-507` hides all history on a ringer call. That fixes the preloaded-opening subtitle. But a call reopened with `resume` (no `startKnot`: row 26 after a hit, row 27, a `resume` ring) restores to its choices with no line above them, because the question the choices answer came from history. Legacy calls are unaffected (gated).

**Fix, before A2c ships row 26:** keep the call's own last NPC line when `startKnot` is null, or drop only `preloaded` rows and rows older than the call's start.

### m5. No "Call ended m:ss"

Plan 2.5 "Ending" says `closeConversation` shows it (skipped in the terminal look). HANDOVER_A2b open item 6 notes it is missing.

**Fix:** add it in A2b, or move it explicitly to A4 (with the "Incoming call, m:ss" row) and note that in the plan.

### m6. The timed delivered flag is not saved, so the plan's reload claim is wrong

Plan 2.3 (the paragraph after the table) says a timed ring "is marked delivered when it is first offered … a reload during the ring therefore does not schedule it again". `timedConversations[].delivered` lives in memory only (`npc-manager.js:2039-2041`). After a reload only `skipIfGlobal` stops a re-delivery. `test_phone_calls` `timed_caller` uses `skipIfGlobal: skip_timed` with `setGlobalOnStart: timed_ringing`, so it re-rings after every reload. That is the handover's open note.

**Fix (A4):** either persist delivered timed conversations, or require `skipIfGlobal` equal to `setGlobalOnStart` for a timed ring (validator) and fix the test scenario. Correct the plan sentence.

## Checklist

### 1. The adapter against A2a_NOTES

| Item | Status |
|---|---|
| Trigger persisted at offer by `_handleEventMapping` | OK (`npc-manager.js:1077-1083`) |
| End hook in a `finally`, passing the ending minigame | OK (`minigame-manager.js:227-317`) |
| `callEnded(npcId, {id, endedByCall, callFinished})` | OK (`phone-ringer-dom.js:259-269`) |
| `openBlocked({second:true})` drops only the queue term | OK (`:133-136`) |
| One clock | OK (`performance.now`; `lastHitAt` is null until A2c converts the stamp) |
| `dropped` / `refused` handled | OK (`npc-manager.js:1520-1533` returns) |
| × is End call | OK |
| No Cancel | OK (init and `openCall`) |
| No Add to Notepad on a ringer call | OK |
| Forced banner has no Decline | OK |
| Esc never reaches `complete(false)` | OK in practice, but see m1 |
| `savePendingCall` gets the `{forced, live}` slot | OK (stored on the NPC as given; A4 persists it) |
| Half-built call ended when `openCall` throws | OK |

### 2. Deployed-lab safety

`lab_social_engineering` has no file changes. Dev's `callLaunch` and Ruth's thread never carry `ringerCall` or `ring`. Every change in `phone-chat-minigame.js` is gated on `params.ringerCall`. The npc-manager branches, the delayed bypass, the extractor and `callStartKnots` are gated on `ring`. The term added to `npc-barks.js`, the busy rule and the brief hold read `callActive()`, which is false without a ringer offer. The keys are identical, and the `se/` proof's `storyState` hashes equal A0.

m01–m10 threads and the legacy voiced calls (m09/m10 forced, m02 video, tesseract) behave the same without `ring`. The only change that always runs is the try/finally plus hooks in `minigame-manager.js`, which does nothing when there is no offer.

### 3. Story position after a call

`_resetAfterRingerCall` matches the plan text and is called from:
- End (`:1581`, before the close event);
- story end (inside the timer, after the branches' saves);
- `#exit_conversation` on both paths (`_exitRingerCall` saves, then resets);
- `cleanup` (row 32).

A hit in the two-second gap takes the reset (`_callFinished`) and is reported as row 25.

`call_answer_seconds` reaches the story through the `phone-call` writer at the loader's `applyEngineVariables`, while the call is `currentMinigame`. `RUN_SCOPED_NAMES` keeps both names out of the recorded VARs, and no shipped ink uses them.

### 4. The two fixes in ad74d6257

Both are gated on `ringerCall`, so legacy calls lose nothing. Only m4 matters, and only later.

### 5. Server side

`ring?`, `voiced_phone_call?` and `call_start_knots` match the client. No shipped scenario has `ring`, so no shipped key moves (the dump confirms it).

### 6. Tests

All pass and drive real code: the real NPCManager and adapter, and the real `PhoneChatMinigame` methods. Gaps: m3, M3.

### 7. Proofs

Checked:
- `basic2_banner` and `basic2_call`: banner fields; no Cancel or Notepad; × present.
- `reload_mid_call_choices`.
- `reg/m10_victoria_call` against `A0/m10_victoria_call`: same two `victoria_line` `/tts` texts; the screen is identical apart from the toast.
- The `/tts` lists for the m02 and tesseract calls.
- The `timed_session` and `basic2` sound logs.

The patient log starts its sound wrapper mid-ring, so its "every 2 s for 10 s" is only the logging window. It is not a fault.

## Open items: which belong to A2b

- **timed_caller re-ring after a reload:** A4's (m6). Fix the scenario guard with it.
- **HaX toast over m10 Victoria:** pre-existing, not caused by A2b. It is a HaX bark in the bark column. Barks from other contacts show over a phone thread by design (`npc-barks.js` `_shouldDefer`), and the bark hold is for ringer calls only. A0's screenshot was taken at 0:31 into the call, after the bark had gone; A2b's was at 0:08. Nothing to do in A2b. If the user wants barks held over legacy calls too, that belongs to Part B, when m10's calls move to `ring`.
- **m09 Recruiter, identity scene and m10 breach routes:** must be done in A2b (M4). Recruiter first.
- **Guard's dropped challenge live:** acceptable to move to A2c with the guard NPC, because `phone-call-busy.test.mjs:117` drives the real NPCManager busy branch. Record the move in the plan.

## Verdict

**Revise.** Fix M1 and M2 (small code changes, each with a test). Add M3's test and live proof, and run the M4 routes. The minor findings can go into the same round, apart from m4 and m6, which belong to A2c and A4.
