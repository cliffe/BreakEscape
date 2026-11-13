# Review: A2b round 3 (ringer wiring and the banner, phone closed)

**Verdict: revise.** 0 blocker, 1 major, 4 minor. The major is the orchestrator's decision on the story-end "Call ended" beat; everything else is small.

HEAD `7524c65af` (R2 fixes). Runs at HEAD with node and no server: `phone-ring-layer` 21/0, `phone-outgoing-call` 22/0, `phone-call-bark-hold` 2/0, `phone-call-busy` 7/0, `phone-call-vars` 5/0, `phone-call-knots-parity` 4/0, `phone-ringer` 122/0, `phone-call-queue` 8/0, `scripted-conversation-queue` 14/0, `social-lab-dev-call` 5/0, `finale-forced-call-and-closing-card` 17/0.

Live runs: keyless server on :3024 (stopped afterwards), headless, `test_phone_calls` games 1586, 1593, 1594, 1595, 1597 and 1601. A logger was injected in the page **before** `bootstrap`. It sampled the ringer state, queue, open minigame, the timed conversation's delivered flag and `hasPendingOpeningConversation()` every 100 ms, with times measured from `npcManager.gameStartTime`. Clicks went through the real banner buttons. The probe scripts are reviewer scratch and are not committed.

## Priority question: why `timed_caller` "never rang"

**This is a harness timing artefact, not an engine bug.** The queue rules hold live.

`timed_caller` rings first on every run. The fixer never saw it because `bootstrap` blocks the shell for the whole ring.

- `bootstrap` waits up to `OPENING_WAIT_MS = 20000` (`.claude/skills/playtest-scenario/scripts/bootstrap-steps.js:21,29`) while `hasPendingOpeningConversation()` is true.
- That is true for the whole time the timed opening offer is ringing (row 30, `npc-manager.js:1981`).
- `RING_TIMEOUT_MS` is also 20 s. So the timed call rings out inside `bootstrap` ("an opening conversation is still pending after the wait; carrying on without it").
- The fixer's `ring_timed` (`tools/phone_calls/routes/a2b_r1_finish.sh:10`) only starts polling after `bootstrap` returns. By then the timed call has already been missed, and `caller_basic`, queued behind it, is ringing.
- "The timed offer did not return after its decline" was really the timed offer having been missed already. The decline the script sent was to `caller_basic`.

Timeline, game 1593 (`skip_timed=false`, `autoBrief`, `caller_basic` auto-declined in the page):

```
 6.8  -                     mg=person-chat/debrief_host  tc=false/8624 brief=true
 7.9  -                     mg=                          tc=false/8624 brief=true
 9.0  timed_caller:ringing  q=0                          tc=true       brief=true   (delivered on the 1 s tick at 8.6)
10.9  timed_caller:ringing  q=1 basic=queued             (caller_basic offered 3 s after the briefing: row 6)
29.2  caller_basic:ringing  q=0 timed=null  brief=false  (timed rang out, row 21; head of queue rings, row 8)
29.5  -  q=1 basic=queued   mg=notes/Mission Brief       (brief opens; any minigame requeues the ring in A2b, see m4)
30.1  caller_basic:ringing                               (brief closed by bootstrap; rings again with its elapsed time kept)
```

Game 1595 (ring-out) gives the same sequence, and `caller_basic` then times out at 49.8 s: 0.3 s plus 19.8 s of ringing, so `ringMs` carries over the requeue.

What would have been a bug, and isn't: a timed offer made while another call rings goes to `queued` and rings when that call ends (`phone-ringer.js` `offer` → `queue.push`, `runOnce` row 8). The reverse order happens too (game 1593, `caller_basic` queued behind the ringing timed call). There is no path where a queued offer is lost on the other call's decline: `declineOffer` → `finishOffer` → `run()` → head of the queue.

### timed_caller decline and ring-out, thread afterwards

- **Decline** (game 1594, in-page click on Decline 1.5 s into the ring):
  - Rings at 9.0 s with `brief=true`.
  - Declined at 10.5 s.
  - The Mission Brief opens only after the decline (10.8 s). Row 30 holds through the ring.
  - `timed_ringing` is true.
  - `currentKnot` is `start` after the decline and with the thread open. The thread shows "Timed here." and "1. Anything new?", never "This call came in on a timer".
- **Ring-out** (game 1595): rings at 9.1 s and is gone at 29.2 s. The thread shows the same as for the decline, with `currentKnot` `start`.

The timed path now has the live proof that R1 M2 lacked.

### Ended thread story, then a declined mapping ring (`restartAfterEnd`)

This is the case the fixer did not run (R2 M1 failure scenario 2). Game 1597:

1. Decline `caller_basic`.
2. Open Caller Decline's thread and pick "Anything new?", so the history is not preload-only.
3. Run the thread's story to `-> DONE` on the engine without `goToKnot`, so `lastEnteredKnot` stays `start`. Save it and close the phone.
4. Emit `ring_decline` and decline the ring.

`currentKnot` is `start` at every step (ringing, after the decline, with the thread open). The reopened thread restarts at `start`: "Decline here. I will try again later." / "1. Anything new?".

Control (game 1601): the same run, but after the decline `npc.currentKnot = 'ring_call'` is set by hand, which is what the pre-fix `_handleEventMapping` did. The thread then restarts on the call knot: "Glad you picked up." / "That is all." / "1. Goodbye.". So the fix is what keeps this case right, and the live check can tell the two apart.

## Findings

### M1. A call ended by the story shows no "Call ended m:ss" beat (orchestrator decision)

A real handset shows "Call ended" whichever side hangs up. Today only End and the back arrow (`closeConversation`, `phone-chat-minigame.js:1608-1620`) show the beat. The story-end close and `#exit_conversation` call `complete(true)` directly. R1's `ended2_timeline.json` shows the screen staying on the last line and then vanishing.

**Failure:** the caller says their last line, the story ends (`caller_basic` "Finish it here.", any bring-in), and about 2 s later the call screen disappears with no ended state. A player can't tell a hang-up from a crash or a dropped call.

**Fix:**

- `_releaseForcedCall` timer (`phone-chat-minigame.js:1327-1336`). For a ringer call, after `_endedByCall = true` and `_resetAfterRingerCall()`:
  - stop `_callVoice`;
  - set `_callEndedPending = true`;
  - if `this.ui.showCallEnded?.()` returns true, `complete(true)` after `CALL_ENDED_BEAT_MS`;
  - otherwise (terminal look) complete at once.
- `_exitRingerCall` (`:1373-1378`): the same, after the save and the reset. It covers both `#exit_conversation` paths, `:906` and `:1270`.
- Put the beat in one helper (for example `_completeRingerCallWithBeat()`) shared with `closeConversation`, so the three paths can't drift. `_endedByCall` and `_callFinished` are already set before the beat, so a hit or a knockout during the beat stays row 25 (`callEnded` with `endedByCall`), as R2 checked for the End path.
- `callActive()` stays true for the 900 ms beat (the minigame is still current), so a queued debrief and held barks wait. That is right.
- Note it in plan 2.5 "Ending": the `_releaseForcedCall` and `#exit_conversation` bullets each show the beat, skipped in the terminal look.
- Tests in `phone-outgoing-call.test.mjs`:
  - story end on a ringer call shows the beat, then completes once;
  - `#exit_conversation` on both paths does the same;
  - the terminal look completes at once;
  - a legacy voiced call and a `callLaunch` call are unchanged (no `ringerCall`, no beat).
- Live: re-run `ended2` and `#exit_conversation` (`caller_basic` "Hang up politely"), and the `caller_debrief` hand-off. The debrief person-chat opens about 0.9 s later than now, after the beat.

### m1. A refused open leaves `npc.currentKnot` on the call knot

`phone-ringer-dom.js:190` sets `npc.currentKnot = offer.knot` before `startMinigame`. If `startMinigame` returns null or throws (`:191-212`), the ringer sends the offer back to `held` (row 19). After `MAX_OPEN_REFUSALS` it gives up with `phone_call_missed`, outcome `dropped`. The contact's `currentKnot` is then the call knot with no call open. That is the R2 M1 state by another route: an ended thread restarts on the call knot, and a fresh thread opens on it as silent texts.

This is narrow in A2b, because the second `openBlocked` check catches the knockout that is `startMinigame`'s main refusal. A2c adds more refusal routes, though.

**Fix:** keep the previous value and put it back when `started` is falsy or in the `catch`. Add a harness case: `startMinigame` returns null, then `currentKnot` is unchanged.

### m2. The plan still says a timed ring is covered by its delivered flag; A4 has no work item for the fix

- `PHONE_CALLS_PLAN.md:374` (2.7, first bullet) still ends "`ring` on a `timedConversation` is covered by its delivered flag (2.3, after the table)". The corrected 2.3 paragraph (`:280`) says it isn't, and that the fix is in A4.
- The A4 slice (`:776-781`) lists the reload proof for `timed_caller` but not the work: persist the delivered mark with the offer.
- `:768` (A2c accept) reads "moved here from A2b, R1 m5), and the rest below. the A2c rows". The move was asked for in R1's open items and done as R2 m5, and "the" should be "The".

**Fix:**

- In 2.7, replace the sentence with "`ring` on a `timedConversation` is not yet covered: its delivered mark is not saved (2.3, after the table; A4)."
- Add "persist a ring `timedConversation`'s delivered mark (2.3)" to A4's bullets.
- Fix the two slips at `:768`.

### m3. The harness hides a timed opening ring; record the gotcha and fix the route

As above, `bootstrap`'s opening wait equals the ring timeout, so any mission whose opening is a timed `ring` (Part B) rings out inside `bootstrap`. A tester then reports the opening call as missing.

**Fix:**

- Add a line to "Harness gotchas from the phone calls track" in `.claude/skills/playtest-scenario/SKILL.md` (main checkout). It should say: a timed opening `ring` keeps `bootstrap` in its 20 s opening wait for the whole ring and rings out there; inject an in-page watcher (answer or decline on `phoneRinger.current()`) before `bootstrap`, or call `bootstrap` with `autoBrief:false` and handle the ring first.
- Better, make `bootstrap` return early with `ringing: true` when `.incoming-call` is showing, as it does for `briefingPending`. Then a route sees the ring instead of waiting it out.
- Update `a2b_r1_finish.sh` `m2` to inject its watcher before `bootstrap`. As written, it can never pass.

### m4. The Mission Brief opens over a ringing non-opening call and requeues it

Game 1593, 29.2 to 30.1 s:

1. The timed opening call rings out, so `hasPendingOpeningConversation()` turns false.
2. `caller_basic` starts ringing on the same tick.
3. The brief poll (`utils/helpers.js:53-56`, every 500 ms) sees nothing open and opens the Mission Brief 0.3 s later.
4. In A2b any minigame blocks ringing, so the call goes back to the queue.

The player sees the banner for a moment, then the brief. The call rings again when the brief closes, with its elapsed time kept, so nothing is lost. Plan 2.2 treats the Mission Brief as "paused" with the banner kept, and that arrives in A2c, when a notes minigame stops blocking.

**Fix:** acceptable to leave for A2c. If so, add "Mission Brief opening while a call rings: banner kept, ring paused" to A2c's proofs. In A2b, `briefPopupBlocked` could also hold while an offer is `ringing`. The brief would then wait up to 20 s, which is cheap.

## R2 findings on the real path

| R2 | Status | Real-path check |
|---|---|---|
| M1 mapping ring `currentKnot` | Fixed | `npc-manager.js:1272` skips the write for `isRing` (`:1077`: `ring`, phone-chat mapping, phone NPC). `phone-ringer-dom.js:190` sets the knot at open. The tests drive the real `_handleEventMapping` and adapter, and fail if either line is removed: "answer" asserts the open-time write, and "decline"/"ringout" assert no offer-time write. Live: the fixer's `r2m1_*`, plus the reviewer's ended-story case and its control above. The "queued or replaced" test only exercises queued; row 4 replace is not driven. That is a nit, since replace never writes `currentKnot`. |
| m1 ringtone exits | Done | The six exits are behaviour tests on the real adapter with `fakeSoundManager`. `restore()` is left for A4, which is reasonable. |
| m2 Keep-going tags | Fixed, gated | `phone-chat-minigame.js:875-880`: tags are cleared only when `params.ringerCall` is set. The test checks both sides through `_presentOutput`. |
| m3 Esc through `start()` | Fixed | The test runs the real `PhoneChatMinigame.prototype.start` over the real base `start`. Removing the `_dropBaseEscOnRingerCall` call from `start()` fails it. |
| m4 Call ended style | Done | "CALL ENDED", with a `.call-ended` rule. The test is a source regex, which is fine for a cosmetic check. |
| m5 plan corrections | Done | The A2b accept no longer lists the guard and A2c's does. 2.3 is corrected; 2.7 and A4 are not (m2). |

## Accept list (plan section 6, A2b)

Met, apart from M1. All the named test files exist and pass.

Live proofs: `proofs/A2b/README.md` and `proofs/A2b_r1/` cover:

- `caller_basic`: both speeds, End, story end, `#exit_conversation`;
- `caller_patient`;
- `caller_decline`: decline and timeout;
- `caller_debrief`: the ringing hand-off, the held text (`m3_*`) and the knockout variant;
- `caller_queue`, `caller_replace`, `legacy_voiced` and `texter`;
- the regression routes, and the lab SE `storyState` comparison.

`timed_caller` (without the reload) now has every part live. Answered: R1 `m1_timeline.txt`, with the brief held. Declined and rung out: this round, with the brief held through the ring and opening only after the decline or the ring-out. A2c's accept now carries the guard's dropped challenge. That move is sound: `phone-call-busy.test.mjs` drives the real NPCManager busy branch, and the patrolling guard is on A2c's scenario list.

## lab_social_engineering

Still gated everywhere. The R2 changes are:

- the `!isRing` guard, where `isRing` needs `config.ring` and the lab's ERB has no `"ring"`;
- the adapter's `openCall`, which runs only for ringer offers;
- the tag clear, gated on `ringerCall`;
- CSS that applies only to `.call-ended`, a class only ringer calls add.

The fixer's re-run of the Dev proof after R2 (`live/se_dev/`) matches A0's `sha256_noseed`. M1's fix must stay inside the `ringerCall` branches, and its tests should assert that the lab's `callLaunch` path is unchanged.
