# Review: A2b round 2 (ringer wiring and the banner, phone closed)

**Verdict: revise.** 0 blocker, 1 major, 5 minor.

Scope: `git diff 81d4cf1f7~1 HEAD` over `public/break_escape/js`, `app/`, `test/`, `public/break_escape/css`, `scenarios/test_phone_calls/`, with attention on the R1 fixes (`39eedbb9a`) and the A8 ringtone (`379e81959`). HEAD `5113cfe5c`.

Runs at HEAD (node, no server): `phone-ring-layer` 17/0, `phone-call-bark-hold` 2/0, `phone-call-busy` 7/0, `phone-call-vars` 5/0, `phone-call-knots-parity` 4/0, `phone-outgoing-call` 20/0, `phone-ringer` 122/0, `phone-call-queue` 8/0, `scripted-conversation-queue` 14/0, `finale-forced-call-and-closing-card` 17/0, `social-lab-dev-call` 5/0, `phone-voiced-contact` 2/0. Two throwaway probes on the real harness (`phone-ring-harness.mjs`), deleted afterwards: one for M1 below, one for the ringtone exit paths. No live server was run.

## Findings

### M1. A mapping ring still moves `npc.currentKnot` to the call knot when it is offered (R1 M2 fixed for timed rings only)

`npc-manager.js:1269-1272` sets `npc.currentKnot = config.targetKnot || config.knot` for every event mapping, before the phone-chat branch reaches the ring offer at `:1520`. R1 M2 removed the same assignment from the timed path (`_deliverTimedConversation`), but most rings are mappings: every caller in `test_phone_calls` except `timed_caller`, and the Part B migrations (m03 HaX, m05 Recruiter first contact and others).

Probe on the real NPCManager and adapter: a `ring` mapping on `ring_call` → `ringing`, `currentKnot` is `ring_call` at offer; Decline → `currentKnot` is still `ring_call` (`homeKnot` is `start`). The connected path hides it, because `_resetAfterRingerCall`'s `goToKnot(home)` puts it back.

Failure scenarios (all in A2b's "phone closed" scope, since the player can open the phone after a decline):

1. The player declines `caller_decline` (or lets it ring out) before ever opening the phone. The preload skips a call knot (`phone-chat-conversation.js:883-887`), so the contact has no history. Opening the thread takes the fresh path, `targetKnot = npc.currentKnot` (`phone-chat-minigame.js:487`) → `goToEntryKnot('ring_call')` (`:674`). The call knot runs as silent texts, "[Goodbye.]" included. That is the case plan 2.5 exists to prevent. In Part B this is m05's Recruiter first-contact call, declined.
2. A contact whose thread story has already ended (`-> DONE`) gets a ring that is declined or missed. On the next open, `_showRestoredThread` → `restartAfterEnd()` (`phone-chat-conversation.js:276-286`) picks `currentKnot` because it differs from `lastEnteredKnot`, and jumps to the call knot.
3. The same applies while the ring is still `queued` behind a scene, and when `offer()` returns `dropped` or `refused`.

Why the proofs missed it: `proofs/A2b_r1/live/m2_decline_thread.*` uses `timed_caller` (the fixed path). `proofs/A2b/decline_thread_after_decline.png` passed because `caller_decline` had preloaded history from an earlier phone open, so the thread restored its saved `start` position. The test `phone-ring-layer.test.mjs:220` drives only `_deliverTimedConversation`.

**Fix:**
- In `_handleEventMapping`, skip the `knotToSet` assignment when `isRing`.
- In the adapter's `openCall` (`phone-ringer-dom.js:179-201`), set `npc.currentKnot = offer.knot` just before `startMinigame`. This matches what the legacy timed path did in `beforeOpen`. A `resume` ring whose saved story has ended still lands on the call knot through `restartAfterEnd`, and the post-call reset moves it home as now.
- Test: a mapping ring that is declined, rung out, and replaced while queued (row 4) leaves `currentKnot` on `start`. A `resume` ring still opens on its knot.
- Live: on a fresh game, decline `caller_decline` before opening the phone at all. Then open its thread: it shows "Decline here…" and "[Anything new?]", never "Glad you picked up."

### m1. The A8 ringtone tests cover only Answer, Decline, timeout and the fallback

`phone-ring-layer.test.mjs:252-309`. Plan 2.4 says the ringtone "stops on any outcome and while paused". I probed the other exits on the real adapter, and each one works:

| Exit | Result |
|---|---|
| A minigame opens over the ring | requeued, stopped |
| A workstation popup opens | requeued, stopped |
| Knockout | requeued, stopped |
| `close()` | offer gone, stopped |
| Pause menu (`.game-menu-overlay.visible`) | stopped, banner kept; restarts on close |
| `document.hidden` | stopped |
| `restore()` of a forced call | rings after 3 s, stops at auto-answer |

None of these is a test yet, so a refactor of `render()` or `ringtone()` could break one silently.

The loop also drops 2.4's "`phone_vibrate` once per cycle".

**Fix:**
- Add these cases to `phone-ring-layer.test.mjs` with the existing `fakeSoundManager`.
- If the vibrate drop is intended, say so in plan 2.4 or `proofs/A8/README.md`.

### m2. The "Keep going" tag clear is not gated on `ringerCall`

`phone-chat-minigame.js:875` now clears `accumulatedTags` on every phone-chat's continue path, not only on ringer calls. Before, `processGameActionTags` still ran the tags that came before `#ending_check` in the batch; it returns at that tag (`chat-helpers.js:475-493`).

Failure: a text-thread knot with `#complete_task:x` and then `#ending_check`. On "Keep going" the task is no longer completed. No shipped ink has that order today: m01, m09, lab_tesseract_trials and lab_physical_pentest put `#ending_check` first or in a choice body. lab_social_engineering does not use the tag.

The hard constraint says every phone-chat change is gated, so this should be a conscious choice, not an accident.

**Fix:** gate the tag clear on `this.params?.ringerCall`. Alternatively, keep it for all phone-chats and record that decision in the outcomes file.

### m3. The R1 m1 Esc test calls the helper directly, not through `start()`

`phone-outgoing-call.test.mjs:319` calls `probe._dropBaseEscOnRingerCall()` itself. If the call in `PhoneChatMinigame.start()` (`phone-chat-minigame.js:342`) were deleted, Esc on a ringer call would reach the base `complete(false)` again, and the test would stay green.

**Fix:** run the real `PhoneChatMinigame.prototype.start` on the probe, with `preloadIntroMessages` and the rest of `start` stubbed, instead of calling the helper.

### m4. The "Call ended" beat has no style of its own and no screenshot yet

`phone-chat-ui.js:226-238`:
- The label becomes mixed-case "Call ended" beside the bar's upper-case "ON CALL" convention.
- The added `call-ended` class has no CSS rule (none in `css/`).
- The blinking dot is removed with the label text. That reads correctly, but it is a side effect, not a choice.

The live screenshot is still on the R1 outcomes' open list.

**Fix:** pick the case to match the bar ("CALL ENDED"), add a rule for `.call-ended` or drop the class, and take the screenshot.

### m5. R1's plan corrections were not made

- `PHONE_CALLS_PLAN.md:760` still lists "the guard's dropped challenge" under A2b's accept, and A2c's accept does not mention it. R1 accepted the move to A2c and asked for it to be recorded.
- `PHONE_CALLS_PLAN.md:280` still says a reload during a timed ring "does not schedule it again". R1 m6 showed it does (only `skipIfGlobal` stops it) and asked for the sentence to be corrected, with the fix itself in A4.

**Fix:** edit both lines.

## R1 findings on the real path

| R1 | Status | Real-path check |
|---|---|---|
| M1 brief in the Answer gap | Fixed | `hasPendingOpeningConversation` reads `callActive()` (`npc-manager.js:1983`), which `briefPopupBlocked` (`utils/helpers.js:53-56`) polls. The test drives the real NPCManager and adapter and fails without the line. The live timeline `m1_timeline.txt` keeps `brief=false` until the call ends. |
| M2 `currentKnot` at offer | Timed path only | See M1 above. |
| M3 bark hold | Test is real | The real `endMinigame` drains before the end hook in the `finally`, and the real `_shouldDefer` sees `callActive()` false at drain. The drain itself is a stub that records `_shouldDefer`, which is enough for the ordering claim. The live toast proof is with the other agent. |
| M4 regression routes | Done | Recruiter before/after table, identity and breach request lists. Not re-run. |
| m1 Esc | Fixed in code | Test weakness: m3 above. |
| m2 keep-going tags | Fixed | Ungated: m2 above. |
| m3 regex tests | Replaced | `_presentOutput`, `openConversation` `callScreenOnly` and the real minigame-manager `finally` are now behaviour tests. |
| m5 Call ended | Present | Beat at `phone-chat-minigame.js:1594-1616`. A second End or Esc in the beat returns early. A knockout during the beat ends the call as row 25 (`_endedByCall` is already set), and the beat timer then hits the superseded-instance guard in `complete()`. Cosmetics: m4 above. |

## Accept list (plan section 6, A2b)

Present:
- `phone-ringer-dom.js` (layer, banner, pause checks, A2b blocking rule), `phone-ring.css` and its link;
- the npc-manager ring branches, the delayed-mapping bypass, the trigger persisted at offer, the `scriptedConversationActive()` split;
- `callStartKnots` and `call_start_knots` / `voiced_phone_call?` parity (`ring?` matches the JS `rings()` on nil and false);
- the `npc-barks.js` hold;
- the phone-chat end changes and `_resetAfterRingerCall`;
- `RUN_SCOPED_NAMES`;
- the start and end hooks (the end hook in a `finally`, passing the ending minigame);
- the `game_loaded` listener and `phone_ringtone` in the notifications match.

All the named test files exist, and `caller_basic` has `ring` and no `voiced`.

Live proofs: every listed caller is in `proofs/A2b/README.md`, apart from the guard's challenge (moved to A2c, m5) and the R1 items still running elsewhere: the M3 held toast, the Call ended screenshot and the lab SE Dev re-run after the R1 fixes.

## lab_social_engineering

Every phone-chat change is gated on `params.ringerCall`, except m2:
- `showCancel`, Notepad, the × clone, Esc, `_dropBaseEscOnRingerCall`, `callScreenOnly`, `_notifyConversationEnded`;
- `_releaseForcedCall`, which returns as before for a non-ringer, unlocked call;
- the continue-path exit check, `_resetRingerCallOnTeardown`, and the `closeConversation` beat.

The npc-manager branches are gated on `config.ring` or `conversation.ring`. Dev's `callLaunch` and Ruth's thread carry neither.

The hooks, the bark term, the busy rule and the brief check read `callActive()`, which is false with no offer. With no offer, `run()` renders nothing and starts no tick.

`phone-chat-ui.js` gains one method that only a ringer call calls. The extractor change touches only contacts with `ring`.

## Ringtone (A8)

Starts at the first ring, through `render()`. It stops:
- on Answer (`answerOffer`), Decline, timeout and `close()`;
- on a requeue when a minigame, popup or knockout blocks (the start hook nudges at once, the tick catches popups within 250 ms);
- while paused (menu, session overlay, Mission Brief, hidden tab), and restarts afterwards.

A forced ring has no Decline and Esc does nothing to the banner. Its ringtone stops at auto-answer. `restore()` rings after `RERING_AFTER_LOAD_MS` and stops the same way.

There is no in-page scene restart: the sound manager is created once (`core/game.js:2427-2439`), and a page navigation ends the audio. Player volume and mute go through the music bus gain (`music/phaser-audio-bus.js`), so they apply to a ringtone that is already playing.

The exit paths work. Only their tests are missing (m1).

## Anticipating later slices

Nothing here will need undoing in A2c to A6. These are placeholders and need no change:
- `minigameOpen: () => false`, `putAside: () => null`, `reopen: () => {}`, `lastHitAt: () => null`, `outgoingActive: () => false`;
- `savePendingCall`, which writes only `npc.pendingCall` (no other JS reads that field).

The `resume` branch of `openCall` (`startKnot: null` when a saved story exists), combined with `callScreenOnly`, is R1 m4. It still belongs to A2c, before row 26 ships. The M1 fix above moves the `currentKnot` write into `openCall`; A2c's resume path should keep that write.
