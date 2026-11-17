# Engine sweep review, round 1

Reviewer: Opus 5.5, 2026-11-12. Commits reviewed: `752d9d612` (part 1), `88862563c` (self-latch), `40a15667c`
(items 9, 10, 11, 7b), `76bde80cb` (log, proofs). The code was read at `ff4f929ee`. Live proofs ran on a keyless
server on :3027 (its own pid file, stopped afterwards). Proof files, the route (`r1_live.sh`) and the in-page
beat probe (`beat_probe.js`) are in `proofs/ENGINE_SWEEP_R1/`.

**Verdict: accept with one Major.** Item 8 doesn't re-check the m04 ring it was written for (M1). Items 1, 2, 4, 9,
10 and 11 behave as specified live. Lab SE is unchanged. There are three minors (one is a warning for whoever fixes
M1) and four nits.

**Which code the proofs ran on.** Every m01, m04, m07 and test_phone_calls run (games 2216 to 2263) finished by
20:59, on committed code. During the lab SE run, uncommitted edits by another agent landed in the shared tree:
`phone-ringer-dom.js` at 21:01:26 (ring caption) and `npc-manager.js` at 21:02:14 (`ringConditionHolds`, labelled
"M4 R3 m1"). The lab page loaded at 21:01:43 and reloaded at about 21:03, so that run served those edits. Lab SE
never goes through the ringer and its hashes match the baseline, but it isn't a clean committed-code run. Rerun it
once those edits are committed. I didn't review those edits.

## Findings

### M1: item 8 never re-checks most ring conditions, including m04's dial ring (the case it was built for)
`NPCManager.ringConditionHolds` (`npc-manager.js:593-598`) re-evaluates a condition only when **every** `&&` term
starts with `globalVars.`. A `value === true` term, a `data.` term or a negated `!globalVars.x` term makes it return
true (keep ringing) for the whole condition.

- m04's dial ring is `value === true && globalVars.esd_authorized !== true`, so it is never re-checked. In node,
  `ringConditionHolds` returns true with `esd_authorized` set. Live on game 2241 (`m04_esd_ringing`): HaX's ring
  went on ringing for 6 s after `esd_authorized` was set true (`m04_esd_ringing_esd_ringing.png`). That is
  M4 R2 n1, which the sweep claims to fix (`ENGINE_SWEEP.md` item 8 and README "Voiced phone calls").
- A scan of every ring mapping in the shipped missions shows what the committed code re-checks. It covers the
  four m05 Recruiter mappings and two m09 Nightshade mappings, and nothing else. It skips:
  - m03's revelation ring and its twin;
  - m04's dial ring;
  - m05's HaX flag4 ring;
  - every m07 taunt (`!globalVars.grid_saved`, `!globalVars.architect_t5_played`);
  - m09's cage, Torres and Gary rings.

  m07's sign-off is forced, so it is exempt. The scan is `ring_recheck_scan.tsv` (made by `ruby scan_rings.rb .`); `r1_live.sh m04_esd_ringing`
  repeats the live check.

Fix direction: re-check only the terms that read nothing but globals, negated ones included, and treat event-data
terms as holding. That is the same slicing 8b uses for self-latches. An uncommitted change of this shape appeared
in the tree during this review (see the note above). Whoever lands it needs to:
- add tests for the m04 shape, `!globalVars.x`, and a mixed `globalVars.x === data.y` term;
- prove the m04 drop live;
- read m2 below first.

### m1: item 1 can leave zero `conversation_closed` emits when the call never opened a conversation
`dropDisplaced` now skips whenever `d.thread === d.callNpcId` (`phone-ringer-dom.js:374`), on the grounds that "the
call already emitted". That only holds when the call's phone-chat opened a conversation for that contact.
`_emitConversationClosed` needs `this.conversation`, and `putAside` had already suppressed the thread's own emit
with `_closingForCall`. In these paths the call never opens its story, so the thread's close is never reported at
all (before the sweep it was reported once):
- `giveUp` after repeated open refusals (`phone-ringer.js:629-641`, through `reopenDisplaced`'s drop branch);
- `close()` (the ending) with a held offer that had already put the phone aside (`phone-ringer.js:1068-1079`);
- an outgoing dial placed from the contact's own thread that rings out while the reopen is blocked (a hit within
  `HIT_QUIET_MS`, or the ending has started). During a dial `conversation` is null, so `_ringOut` emits nothing.

These are edge paths and I didn't prove them live. Suggested fix: skip only when the call's minigame really emitted
for `callNpcId`. For example, the adapter's end hook could mark the descriptor when the call's `conversation_closed`
fired, or the ringer could pass `o.openedAt && o.connectedAt` into the drop. The test in `phone-displaced-emit`
should cover one never-opened case.

### m2 (warning for the M1 fix): a quiet drop keeps the mapping's own latch, which blocks its twin
`dropQuietly` (`phone-ringer.js:421-427`) doesn't undo the `setGlobal` the mapping ran when it was offered. On the
committed code this can't happen: the only re-checked terms are m05's and m09 Nightshade's, and their globals only
move when the call is truly moot (`mission_complete`, `recruiter_contacted_player`). Once negated terms are
re-checked (M1), two m09 rings can be lost for good:
- **Torres lid ring** (`m09 scenario.json.erb:1020`). It rings on `object_interacted` with `!globalVars.hl_box_opened`,
  sets `torres_rang`, and has a 1.5 s delay. If the player unlocks the box while it is queued, `hl_box_opened`
  flips, the ring drops, and the `item_unlocked` twin is blocked by `!torres_rang`. The comment at `:1016` says the
  call already plays the right branch for an opened box, so the drop is wrong here.
- **Cage ring**. It rings on `cage_opened` with `!globalVars.flag1_read_heard` and sets `nightshade_rang`. If the
  read-out is heard while the ring is queued, the ring drops and the `room_entered` and `conversation_closed` twins
  are blocked by `!nightshade_rang`.

Either restore the self-latch on a quiet drop, or leave out of the re-check any term the author meant as "state at
offer time". Then re-prove m09 Torres and the cage ring.

### m3: item 10 also delays the player's own hang-up by 2.6 s, and the back arrow is dead during the beat
`closeConversation` (back arrow, Esc) also runs `_completeRingerCallWithBeat`, so in the terminal look a player who
hangs up early waits `TERMINAL_CALL_END_READ_MS`. The screen freezes on the partial thread, and a second press is
ignored (`_callEndedPending`). Live on game 2257 (`m07_back`): back pressed at 28 672 ms, and the phone went at
31 354 ms (`m07_back_after_back_1s.png`). The read beat is for the story's own end. Gate it on the story-end and
`#exit_conversation` paths (`_exitRingerCall`, `_releaseForcedCall`) and let `closeConversation` close at once,
as before the sweep.

### n1: item 8, a global term with a data operand is evaluated as if the data were undefined
`globalVars.room === data.roomId` starts with `globalVars.`, so it passes the filter and is evaluated with `{}`. In
node it returns false (drop) once `room` is set. No shipped mapping has this shape. The uncommitted M1-shaped change
appears to exclude it (I didn't review it).

### n2: item 11, the README should state the decision in so many words
README:1955 says a `phoneTheme: "terminal"` contact "shows its call and its own thread in the CRT terminal look". A
reader can take that to mean that tapping his thread in the list re-themes it. Add the decision: the look is set once
per phone session. A thread tapped from the device's contact list keeps the device look. Only the contact's calls,
and a phone opened directly on that contact (notification, timed message), use its `phoneTheme`. It is also worth
saying that a device with no `app.theme` takes its fallback look from the **first** contact's `phoneTheme`
(`interactions.js:1795`), so a terminal contact must not be listed first on the player's phone.

### n3: item 9 tests miss the paused clock and the banner class
`phone-ring-tutorial.test.mjs` has no case where the hold time doesn't build up while paused (Mission Brief, menu,
hidden tab). It also doesn't check that `under-tutorial` is set on the ring layer and cleared by `hideBanner`. The
live proof covers the placement.

### n4 (m07 content, for the M6 round): the Architect's thread stub "Hang up." isn't parenthesised
When his thread is tapped from the list (handset look, per the item 11 decision), the home stub "1. Hang up." shows
as a text reply (`m07_theme_tapped.png`). Pressing it posts a "Hang up." bubble. Item 2's rule covers `(Hang up.)`.

## Per item

| Item | Code and tests | Live (this round) |
| --- | --- | --- |
| 1 `conversation_closed` once | Correct for an answered call that opened (see m1 for the never-opened paths). `phone-displaced-emit` passes. | test_phone_calls: own thread plus a hit (not reopened): `caller_thread` x1 (game 2216). Texter thread displaced plus a hit: `caller_thread` x1 and `texter` x1 (2219). Own thread reopened: x1 after End, x2 only after the real close of the reopened thread (2224). m04: HaX dial ring answered over her own thread: x1 after End, x2 after the real close (2237). |
| 2 "(Close.)" no bubble | Regex `^\s*\([^()]*\)\s*$` on the trimmed text; the choice is still taken. Tested. | m04 Vance's home stub: no player bubble, empty history, one `conversation_closed:robert_vance_phone` (2236). |
| 3 A5 n-1 | Listener count and the dial-in-progress no-op are now asserted. | n/a |
| 4 refused dial | Toast only while `callButtonFor` is non-null; otherwise the button goes. | desk_contact with a knockout stub: "Can't call right now" toast, no call, button kept. Stub removed, then a second press connects (2229). |
| 5 validator warning | Tests pass. Validator logic read only briefly. | n/a |
| 7, 7b `callbackWhen` | In memory only, so the save format is unchanged. Recovered by knot after a reload (`_ringCallbackWhenFor`, first match wins). Tests pass. | Not rerun here (the CALLLABEL fixer proved m04 live). |
| 8 re-check | **M1**, m2, n1. The 8b self-latch slicing is right. | m04: no drop after `esd_authorized` (2241). |
| 9 tutorial hold | Bounded: the modal holds fully. A step holds for at most 20 s of unpaused time, or until the step changes or the tutorial ends. Forced calls follow the same rule. | m01, tutorial accepted and left idle on step 1: offer queued at about 5 s, rang at 25.6 s (about 20 s after the offer). The banner sits at the bottom (`under-tutorial`), clear of SKIP TUTORIAL, the step counter, the panel and Continue, and SKIP is topmost (2245, `m01_tut_idle_ring_over_tutorial.png`). |
| 10 terminal read beat | Gated on `theme === 'terminal'`. The clip wait is capped at 8 s. See m3. | m07 T-30: last line fully typed at 57 660 ms, beat at 58 857, close at 61 512 (2655 ms), last line and narration on screen (`m07_taunt_during_beat.png`, 2250). T-20 offered inside the beat: rang the moment T-30 closed, not lost (2253). Forced sign-off: beat at 42 542, closed itself at 45 147 (2260). Keyless, so `/tts` returned 503 and no clip played; the clip wait is unit-tested only. |
| 11 `phoneTheme` | `resolvePhoneApp` order is `app.theme`, then `params.theme`, then `npc.phoneTheme`. | m07: inventory phone, contact list in the handset look (first contact `agent_0x99`). Tapping the Architect keeps the handset look (`paramsTheme` null, no terminal elements). Opened directly through `barkSystem.openPhoneChat`: terminal. His call: terminal (2263). Matches the orchestrator's decision. README: see n2. |

## The regression questions

- **Item 8 drops for other reasons.** On the committed code only m05 Recruiter and m09 Nightshade are re-checked.
  Their non-latch globals change only when the call is moot (the ending, the player already reached her), so dropping
  is right. `data.` terms are never re-checked, because the whole condition is skipped; the mixed-operand case is n1.
  The risk grows once M1 is fixed (m2).
- **Item 10 and closes, the ending, the next ring.** A forced call still closes itself, 2.6 s later than before, so
  whatever waits on that close (the debrief, the ending) waits 2.6 s more. A clip still playing can add up to 8 s. A
  ring offered during the beat queues and rings at the close; it is not lost. Timers are guarded by
  `gameState.isActive`, so a teardown during the beat is safe. The one new cost is m3.
- **Item 9 never releasing.** It can't hang. The opening modal is a full hold by design, until the player answers it.
  A step panel holds for at most 20 s of unpaused time, even if the step never changes. Paused time (Mission Brief,
  menu, hidden tab) doesn't count, by design.

## Lab SE
- JS: `social-lab-*`, `validator-social-lab`, `pretext-*`, `validator-phone-calls`: 84/0. The sweep's own test
  files: 123/0.
- Live (`se_dev.sh`, game 2265, `proofs/ENGINE_SWEEP_R1/lab_se/`): Dev `ffe4c083…` and Ruth `52c50b7a…`, after the
  call and after the reload, are identical to `merge_main_1`. The four Dev `/tts` lines are the same, all 200. See
  the note at the top: this run served the other agent's uncommitted ringer edits.
