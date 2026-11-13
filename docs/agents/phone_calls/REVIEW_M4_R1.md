# Review M4 R1: m04 Vance callable, HaX dial ring, HaX bring-in call

Reviewer: Opus, 2026-11-12. Reviewed at 7c0be1ba6 (M4 source `2a92e3de2`, proofs `007a3c1f9`, HacktivityLabSheets `c1a707f`). Live checks on a keyless server on :3023, headless, stopped afterwards. My route is a scratch script in the session scratchpad that sources `tools/phone_calls/routes/m10_lib.sh`. It wraps `eventDispatcher.emit` to record a stack for every `conversation_closed` and `mission_complete` emit. Nothing in the repo changed except this file.

## Verdict

**Accept with minors: 0 blocker, 0 major, 2 minor, 5 nits.** The merge is the writing branch's ink word for word. The config matches both writers' notes. Every item in the M4 row holds on the path I could drive. The dial ring fires off the dial read itself, so it can't get ahead of its own trigger the way M1 R2's fallback did. It also queues behind an in-person challenge instead of ringing over it. One timing case is weak: a late dial read, when the clock is already running, brings a ring 5 s after HaX has texted "The ESD is live. Press it." Both doubled hand-off events are harmless in m04. The `conversation_closed` double comes from this track's engine and goes to the sweep.

## What I ran

| Check | Result |
|---|---|
| Merge | `git diff build/phone-calls-writing HEAD` on `m04_phone_agent0x99.ink` and `m04_phone_robert_vance.ink`: no difference. The `.json` files differ only by recompile, and the ERB only by the M4 config. The debrief header comments now match plan 7.5. |
| Config vs notes | HaX `call` = `on_anomaly_confirmed`, `extract_call` (both `button:false`). The `:903` mapping drops `sendTimedMessage` and gains `delayMs 6000`, `phone-chat`, `targetKnot`, `ring:{onMissed:"callback"}`, and keeps its event and condition. The decline and missed texts are "Got your reading. Ring me back." (missed has `!data.reload`). Vance has `call {support_call, when vance_is_ally && !robert_vance_ko, unavailable no_answer}` and `callLabel "Albion ops desk"`. All of this is as `WRITER_HAX_CALLS.md` m04 and `WRITER_CALLERS.md` M4 ask. |
| `validate_phone_calls.rb` m04 | No output, exit 0. |
| `validate_scenario.rb --no-graph` m04 | "Validation complete", exit 0. The only ERRORs are the three earlier word caps (`m04_closing_debrief.ink:289`, `m04_phone_agent0x99.ink:258`, `scenario.json.erb:1154`). No phone-call warnings. Warning 1 (three onceOnly `anomaly_detected` mappings can pass together) was already there; see m1. |
| Key diff (`dump_tts_keys.rb`, labelled, working tree) | m04 has +70 and −0 against `keys_baseline/`, the same set as `proofs/M4/keys_added_m04_critical_failure.tsv` (HaX 22, Vance 48). None of the 70 keys appears in any other scenario's current dump or in any baseline. None of the 70 lines contains `{`, `}`, `[` or `(`. |
| Live `early` (game 2042): start in the SCADA room, walk into Hall 1 by the door, examine the thermometer | `anomaly_detected` at 4.1 s. The room-entry text "The workshop wants a Level 2 card…" at 5.1 s. HaX rings at 10.2 s, and the banner holds. Answered at about 12 s: the slow opener "There you are. No time for hello.", then the body and "With how they're driving it." The crew hint, due at 34.1 s, was held and landed at 35.0 s, just after the call closed. **After the call the hub no longer offers [About the dial reading.]** (the ink-local `anomaly_call_heard` survives the call). |
| Live `late` (game 2045): `attack_mechanism_known` and `voltage_neutralised` set, then the same walk | At 4.1 s, `anomaly_detected` and `esd_authorized` in the same tick. At 5.9 s HaX texts "…The ESD is live. Press it." At 11.0 s she rings, and the call gives four lines on the reading. End mid-call leaves [About the dial reading.] in the hub. See m1. I set no `server_room_reached`, so the reply choice shown was "Then where do I start?". A real late player would see "Then the dial was the last piece." This is not a finding. |
| Live `cipher` (game 2075): dial read, then Cipher's real `player_spotted` mapping fired 2 s later | Cipher's person-chat opens and the ring offer waits in the queue (`queue 1`, no banner) for the whole 16 s window. It does not ring over the challenge. |
| Live `vance` (game 2049): ally, available and `anomaly_detected` set; Call button pressed | Connects on "Vance. What do you need?". The night-crew topic gives the cost line, "Sound it." sets `crew_warned` and `clock_started`, and HaX's "That's the evacuation…" text arrives during the call. "That's everything for now." ends on "Call me if you need it. / I'm not going anywhere.", then the thread is on its `(Close.)` stub. |
| Live `handoff` (game 2058): bring-in with nothing optional open | `call_in_after_sweep` completes on the `[Bring me in.]` reply (20.7 s). `[On my way.]` asks nothing. The last line is typed at 23.2 s, the call closes, the debrief person-chat opens, and `debrief_started` is set. The debrief mapping's trigger count is 1. The emit stacks are under "Double events" below. My script could not advance the debrief's choices, so I did not see the debrief close. |

## The M4 row, item by item, and the head starts

| Item | Proved on the real path? | Head start, and whether it could hide timing |
|---|---|---|
| Vance before allying, after allying, after KO | After allying: yes (theirs and mine). Before and after KO: yes, for the button's ring-out. | Globals set by hand. `vance_before` sets `vance_phone_available` without `vance_is_ally`, a state the story never reaches (`:1547` sets availability only with the ally flag). See n3. No timing involved: the call is placed by the player. |
| Dial ring, decline, Call back with callback line | Yes. The thermometer is examined for real and the ring comes from the real mapping. | `--start-room battery_hall_1`. My `early` run walks in from the SCADA room and gets the same order. This hides no timing, because the ring is keyed on the dial read itself. |
| Answered after 12 s, slow opener | Yes (theirs, and mine by accident). | as above |
| Bring-in, blocked and clear | Yes, from the hub choice. | `attack_prevented` set and its event emitted. This can't be avoided without the VM stage. The call is placed by the player, so no ring timing is involved. |
| Hand-off: last line voiced, debrief opens after it | Yes (theirs, `bring_clear` /tts; mine, typed before the close). | as above |
| Keep going voices nothing, sets no `mission_complete`; nothing optional → no question | Yes (`bring_keep`, `bring_clear`). | as above |
| Hub choice retires once the dial call is heard | **Not shown in their proofs** (n1). Shown in mine. | — |

## Findings

### Minor

**m1 (config). A late dial read brings a ring right after "The ESD is live. Press it."**
`scenario.json.erb:903` rings 6 s after any first `anomaly_detected`. When the dial is read last (after the attack is mapped and Voltage is down, the late path the knot's own comment allows for), the `:1452` mapping sets `esd_authorized` in the same tick. Its text "He's out of the way, the sixty-one degrees in Hall 1 is on record… The ESD is live. Press it." arrives at +1.8 s. HaX then rings at +6.9 s while the clock is running (`clock_started` is set when the attack is mapped). The call spends four lines on the reading before its one choice. The old text was a toast and stopped nothing. Live: game 2045 above. She tells the player to press the button and then rings to talk about Nightshade's view of the cells.
Fix: add `&& globalVars.esd_authorized !== true` to the ring mapping's condition. The condition is checked again when the 6 s delay ends (`delayMs`, `npc-manager.js:1031`), and by then `:1452` has set the flag. On that path there is then no ring, and because nothing rings, there is no decline or missed text either. The hub choice [About the dial reading.] still offers the call to anyone who wants it, and "Then the dial was the last piece." still fits there. The `first_call_end` line "I'll ring once you've got a real reading." is then wrong only for a player who reads the dial last, and that player gets HaX's ESD text at once. Re-prove with a late read that sets `server_room_reached`, `attack_mechanism_known` and `voltage_neutralised`.

**m2 (engine, for the follow-up sweep). A placed call whose thread is not reopened emits `conversation_closed` twice.**
Live stacks (game 2058, both at 24.6 s): the first comes from `PhoneChatMinigame.cleanup` → `_emitConversationClosed` (`phone-chat-minigame.js:2001`, the call itself). The second comes from `phone-ringer-dom.js` `dropDisplaced` (`:347`, added in A3 R1 M1 `0c0de4a54`) for the thread the call was placed from, because the queued debrief stops the reopen. Both carry `agent_0x99`. Plan 2.5 says the event "fires once". This is new on this track. Before it, the bring-in was a text and its thread closed once. **No effect in m04.** Nothing in m04 listens to `conversation_closed:agent_0x99`: no mapping, music trigger, timed text `waitForEvent` or objective. The engine listeners (music, npc-manager mappings, ringer) do nothing on it here. It matters wherever a mission maps that event without `onceOnly`, or with a delay that a second emit restarts. Suggested sweep fix: `dropDisplaced` skips the emit when the call that displaced the phone was to the same contact and has already emitted for it. Or the call path could keep `_closingForCall` semantics and let only the thread emit.

### The `mission_complete` double (no finding)

Live stacks: one emit comes from the ink variable observer for `~ mission_complete = true` (`npc-conversation-state.js:595`) and one from `#set_global:mission_complete:true` (`chat-helpers.js:600`), in the same tick. **This was already there before the track**: `extract_go` at base `39eedbb9a` has both lines (`:464-465`). It is the same shape as m08's `mole_identified` (M10 note 2). The debrief mapping (`:1586`, onceOnly, `endingCheck`) counts its trigger synchronously on the first emit, so the second is skipped (trigger count 1, live). The room-entry backstops (`:1596`) are onceOnly and need `debrief_started` unset. No music trigger, objective or `ending-check.js` listener reads `mission_complete`. Nothing acts twice. This is not an engine bug. Dropping the `~` line is optional and costs nothing. Leave it to the sweep's judgement (n5).

### Nits

- **n1 (proof).** The M4 route's `glob anomaly_call_heard` reads `gameState.globalVariables`, but the flag is ink-local, so every `heard=` in the logs is `{"ok":true,"cmd":"eval"}`. The proofs never showed the hub choice retiring after the call. My `early` run did, and End mid-call keeps it (`late`). Fix the route to read the hub choices instead.
- **n2 (writing).** "Lose her or put her down, then call." (and its four siblings) is now said inside a call. Plan 7.2 accepts it, and "then call" reads as "ring again". It's fine, but "then ring me" would be clearer. It would re-key five clips, so leave it unless the lines are re-voiced anyway.
- **n3 (proof).** `vance_before` sets `vance_phone_available` without `vance_is_ally`, a state the story never reaches. It still proves the `when` ring-out. A real "before" proof would ring him with nothing set, if his contact is listed then. I did not check whether it is listed before availability.
- **n4 (config, unproved).** A declined or missed dial ring leaves a pending callback that nothing clears. After the shutdown, the header "Call back" would still dial `on_anomaly_confirmed`, and the hub choice is gone by then (`not attack_prevented`). The reply "It was. Grid control can see the difference now." would still fit, so this is harmless. I found it by reading the code and did not drive it.
- **n5.** `extract_go` writes `mission_complete` twice (see above). Harmless.

## Writing checks

- **Dial ring moment.** It rings 6 s after the read, with the room-entry text first and the crew hint held until the call ends. It queues behind an in-person challenge. The only bad moment is m1.
- **Decline and missed text.** "Got your reading. Ring me back." It is short, doesn't repeat the call's "Nightshade" line, and sits right above the "Call back" button. It reads well.
- **Vance's 48 lines.** They suit a call. They are spoken guidance from a man at a desk: "I'm watching bank B climb while we talk", "I can sound the evacuation from here", and they end with "Call me if you need it." / "I'm not going anywhere." There are no printed variables, no inline stage directions and no `(…)` asides (the only bracketed text is the silent `start` stub, `[(Close.)]`, which is not voiced). The openers vary by state. His `when` (`vance_is_ally && !robert_vance_ko`) matches the story: the ally flag is what makes `vance_phone_available` and his "Call me for the engineering side" text appear (`:1547-1550`), and KO is `globalVarOnKO` (`:1664`). The evacuation from the call works live.
- **Bring-in vs 7.6 and the bring-in rule.** The four lines are exactly the 7.6 m04 row. The redial opener is "Forensics are almost on-site. Last chance." `#complete_task:call_in_after_sweep` sits on the `[Bring me in.]` reply, before `[On my way. #ending_check]`, and `#set_global` plus the assignment stay in `extract_go`. Every exit is `#exit_conversation` / `-> DONE`. Live: the task completed at the reply, and the last line was typed before the hand-off.

## Lab sheet (`_labs/safetynet/m04_critical_failure.md`, `c1a707f`)

- `:82` "later Robert Vance, whom you can ring from his thread": true. He only picks up once he's on your side. Adding "once he's on side" would save a confused "No answer". Optional.
- `:281` "Answer the call… If you decline or miss it, ring her back from her thread.": true (Call back button or hub choice). For m1's late path the call would not ring. The sheet's step order (dial early) still holds.
- `:452` "The phone rings HaX and she picks up; choose **[Bring me in.]**, then **[On my way.]**. If anything optional is still open, the game asks…": true, live.
- `:509` "ring HaX from her thread to be brought in": true.
- I did not open any `*-vm-technical-steps.md`. No VM step is affected.
