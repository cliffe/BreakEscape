# Phone calls M6 (m07) review, round 1

Reviewer: Opus, 2026-11-12. Commits reviewed: 0fa40e812 (ink merge and config), 035051e34 (titled M8 but carries the first M6 proofs), 8a20ee779 (remaining proofs), HacktivityLabSheets 46020b2.

**Verdict: accept with fixes. 0 B, 2 M, 2 m, 7 n.**

Live checks ran on a keyless server on :3028 (stopped afterwards), headless, with my own scripts reusing `tools/phone_calls/routes/m6_live.sh` helpers. Games: 2127 (answer and walk the replies, T-30 then T-20 then T-10), 2149 (rings inside the open phone, plus a decline), 2134 and 2153 (sign-off to bring-in to debrief, no sign-off or bring-in presets), 2152 (seattle_call), 2158 (replace rule behind a real person-chat), 2164 (timing of the closing line). The outputs are in the reviewer's scratchpad, not committed.

## Question 1: the "parked" phone

**There is no parked phone. It is a fault in the route script.** Answering a taunt and walking its reply choices to `#exit_conversation` ends the call and closes the phone. The next taunt rings straight away.

- Game 2127, phone closed: T-30 answered, first choice taken, `t30_close` ran, the minigame closed (`mg: null`, ringer idle) and left one `Call: No caller ID` row. T-20 was fired and rang at once, then went through the same steps, and so did T-10. Three rows. `/tts` asked for each taunt's own lines.
- Game 2149, phone open on HaX's thread: T-30 rang inside the phone, was answered and walked to the end, and the phone came back on HaX's thread. T-20, answered from the contact list, came back on the contact list. Plan 2.3 row 10 and row 25 hold.
- Games 2134 and 2153: the forced sign-off, walked to its end, closed itself.

The cause is in the route. `IN_CALL` (`m10_lib.sh`) tests for `#call-end-button`, which the terminal look never draws (`phone-call-ui.js:19`). So in m07 `wait_call` times out after 15 s, and `drive_taunt` leaves on its first check without ever clicking a choice. The call was still connected on its choices, and a taunt coming due behind a connected call correctly queues (row 5). That is what was read as "the ringer holds".

**M1. Route and proof docs.** The wrong conclusion is written into `proofs/M6/PROOF.md` ("Driver note"), `HANDOVER_M6.md` and the log (`PHONE_CALLS_LOG.md:184`), and it changed the proofs:
- `replay` ends every call on the back arrow, so the normal end of a taunt (the player answers and he hangs up) was never proved. It is proved now (2127, 2149).
- `signoff` never walked the sign-off. It force-closed a forced call with `endMinigame(false)`, which is the row 26/32 path and not the player's path, and then opened the debrief with `endHeld()`. The real path is proved now (2153, below).
- `later_first` never walked T-10.

Fix: in `m6_live.sh`, test for a terminal-look call with `window.phoneRinger.callActive()` or `currentMinigame?.params?.ringerCall`. Then let `replay` walk the choices, take the force-close out of `signoff`, and correct the three documents. m07 config, the ink and the engine need no change for this question.

## M2. The closing line of every Architect call is lost live (engine)

In the terminal look, `#exit_conversation` reaches `_completeRingerCallWithBeat()`. `showCallEnded()` returns false there (no call screen), so it calls `complete(true)` at once. The narration line that closes each call shows for less than one frame and the phone is gone. The lines affected:

- "The line drops. The log shows one call: no number, no name."
- "Dead air, then the ordinary hiss of the line."
- "The call ends mid-syllable."
- "Static. Then nothing."
- "He hangs up first. He has hung up first every time."
- the sign-off's "The line goes quiet. The log shows the calls now: no number against any of them."
- seattle's "The line goes quiet."

Game 2164 timed it: "Let it hurt afterwards…" appeared at 27.1 s and the phone closed at 30.5 s. A 50 ms poll never saw "The line drops". The lines do reach the thread history, so a reopen shows them, but they were written as the call's button.

This comes from plan 2.5 ("no beat in the terminal look"), so it is an engine and plan issue, not m07's. Fix: when `showCallEnded()` returns false and the call ended on its own path (`#exit_conversation` or the story's end, not the back arrow), wait before `complete(true)`. Reuse `FORCED_CALL_END_CLOSE_MS` (2000), or scale the wait by the last line's length. Add a node test for "terminal call, own end, read beat" and give it a live proof. With real audio the last voiced line finishes first, so this is only about the narration after it.

## Question 2: presets that could hide a problem

| Case | Preset or shortcut | Risk | Covered by |
|---|---|---|---|
| all taunts | countdown globals; taunt events fired by setting the global and emitting `global_variable_changed` rather than running the timers | low: M6 did not change the timers, and the conditions read `value === true` | none needed |
| `signoff` | `debrief_requested=true` and all four flags before the sign-off, so the debrief could open on the sign-off's close; the call was force-closed (M1) | hid the real order: sign-off, then HaX's text, then the bring call, then the ending check | 2153 |
| `bring`, `bring_notyet` | `architect_signoff_started=true` and `architect_signoff_done=true`, so the sign-off never ran | hid the hand-off after the sign-off | 2153 |
| `replace` | "held behind a person-chat" was really HaX's phone text thread. With A3 that doesn't block: T-5 rang **inside the phone**, T-1 replaced the ringing offer, then the phone was force-closed | the M6 row asks for a taunt *queued* behind a person-chat | 2158 (m1) |
| most cases | taunt triggered with the phone closed | in-phone answer and return not shown | 2149 |

Real path, game 2153, with grid saved and four flags set but no sign-off or bring-in globals. Closing a minigame rang the forced sign-off. In this run that was the Mission Brief closing, which emits `minigame_completed`; that is an artefact of loading with `grid_saved` set. It answered itself, with no back arrow (`display: none`). After "You lost tonight." it played `signoff_close` and closed itself. `architect_signoff_done=true` was set, and the debrief did not open (`debrief_requested` was false). HaX's text followed: "Grid's held. Netherton wants you… Call me when ready…". Then: phone, HaX, `Bring me in.`, then CALLING, then "Putting you through. He's waiting." (voiced), then an `Outgoing call` row and `debrief_requested=true`. The ending check came up over HaX's thread: "1 optional objective is still open: Deal with Ray Hollis…". Choosing "End the mission now" opened `closing_debrief` as a person-chat (`disableClose`). Pass.

**m1.** `PROOF.md` and the log describe `replace` as "behind a held HaX chat… the ringer held only `taunt_t1` (queue 0)". The output shows `state: ringing`, which means it was ringing in the phone. A re-run behind a real person-chat (game 2158, `ray_hollis`) passes: T-5 queued (q 1), T-1 replaced it (still q 1), only T-1 rang when the chat closed, no T-5 rang afterwards, and the thread holds only `taunt_t1_vm`. Fix the wording, or the route, to match.

## Question 3: withheld look, voicemails, heard_* flags

- Banner and in-phone panel: "☎ No caller ID, Incoming call, Answer, Decline", no avatar. Rows read `Call: No caller ID`, `Missed call: No caller ID` and `Voicemail`. A withheld call has no Call back. As specified.
- Calls open in his terminal look ("SECURE CHANNEL ESTABLISHED", green on black) and voiced.
- Voicemail playback applies `voice.fx` (`phone-chat-ui.js:442`), so voice-distortion carries over. Keyless, so audio was not heard, only requested.
- **m2.** His thread, opened from the handset, is in the **device** look (green), not the terminal look. That is in `vm_play_thread.png` and in my 2149 shot. `phone-app.js:87` lets the device's `app.theme` win over `npc.phoneTheme`, and A3 decided that on purpose ("the look belongs to the device"). The M6 row's "a voicemail bubble in the terminal look plays" is therefore not met as written. Orchestrator's call: amend the plan row to "plays in the handset's look", or give a contact-level theme to a thread opened by hand. I lean towards amending the row: the handset is the player's own, and only his calls take it over.
- **n1. The heard_* claim is not accurate, but nothing breaks.**
  - `taunt_t1` and `taunt_t1_vm` set `heard_t5` but not `heard_t20` or `heard_t10`.
  - `taunt_t10` sets `heard_t20` only when `architect_t20_played`.
  - `seattle_call` sets no `heard_t30`.

  The conclusion still holds, for a different reason. The only reads are `heard_t30` (the openers of T-20, T-10, T-5 and T-1), `heard_t20` (the T-10 fold, `:206` and `:589`) and `t1_first_contact` (`t1_close`). T-10 cannot ring after T-5 (its condition), so a skipped `taunt_t5_vm` or `taunt_t20_vm` strands nothing. Correct the sentence in `PROOF.md`, `HANDOVER_M6.md` and the log.
- **n2. A late voicemail can echo the fold.** T-20 is declined while his own thread is open, so its voicemail waits (plan 2.6). T-10 is then answered first and folds in T-20's line ("Washington, then. San Francisco and the vendors are on your clock."). When `taunt_t20_vm` runs afterwards it says nearly the same thing ("You covered Washington. San Francisco and the vendors are on your clock."). This is rare, since it needs his thread held open from the decline until T-10. No action, or have `taunt_t20_vm` skip its "which two" line when `heard_t10`.

## Question 4: sign-off, the debrief and endingCheck

The sign-off is forced (`disableClose`): it answers itself, has no back arrow, closes itself after its last line and leaves no voicemail. The debrief's `minigame_completed` triggers need `architect_signoff_done`, and `all_in` needs `debrief_requested`, so the debrief never opens over the sign-off or before the player asks. The `endingCheck` hold works as the log rule says: m07 keeps the mapping's `endingCheck` with no bracketed tag, because it has no call-in task. The overlay comes up after the bring call, over HaX's thread, and "End the mission now" opens Netherton (2153). Pass. The ending warning appears before the debrief, as the mission ending convention asks.

## Question 5: the 70 Architect lines

- No printed variables in any voiced line. The only inline alternative is `{countdown_expired:The countdown has run out. }` in a `Narrator:` line, and narration is not voiced.
- No inline stage directions. No `#delivery`.
- Each call opens differently ("Don't look for the trace", "You've sent your team", the T-10 branches, "The man in your control room", "Closer than the file suggested" or "Late. I did wonder", "Seattle first", "You saved eight point four million people").
- The tone is quiet and precise, and it stays menacing. He never repeats a threat.
- "Somebody with a tablet" or "a room with a tablet" comes up in T-5 and T-1. It reads as a deliberate thread leading to Netherton's debrief, not as repetition.
- The voicemails are short and keep each taunt's point.
- **n3.** "He has hung up first every time" (`t1_close`) is untrue if the player cut earlier calls with the back arrow. It could branch on a `player_hung_up` flag, or be left as his conceit.
- **n4.** Seattle's "You'll have the figure by morning" and the sign-off's "I'll have the figures… by morning" / "You'll have the figures too" both play when the clock runs out before the abort. That is one phrase in two calls about ten minutes apart. Consider rewording seattle's reply.
- **n5.** The call header shows "The Architect" while the narration says "No caller ID". The spec withholds only the banner and the rows, and he is a saved contact, so this is acceptable. Noting it in case the user wants the header withheld during a withheld call too.

## Question 6: seattle_call

The M6 proofs had no case for it: the route header names `countdown_expired`, but no case uses it. Game 2152: T-1 ringing, `countdown_expired` fired, and `seattle_call` **replaced** the ringing T-1 (row 4). It rang withheld and was answered: "Seattle first. Exactly as scheduled.", "Three to go, and you're on the phone to me.", then the choice and its reply, then `seattle_close`, one `Call` row. HaX's 5 s text ("Seattle's dark. Step one ran…") arrived after the call. The old "Seattle first" bark is gone from the config (`scenario.json.erb:1666-1675` is the ring), and `seattle_call_vm` mirrors the call ("…and you let it ring."). Pass. **n6:** add a `seattle` case to the route.

## Question 7: keys and validators

`proofs/M6/keys_added_m07.tsv` has 72 rows: 70 `the_architect` and 2 `agent_0x99`. I checked every added line against every other mission's ink. The only text match is "Noted.", which is said in other voices, and the key includes the voice, so there is no clash. `validate_scenario.rb` on m07 passes: schema OK, ink OK, no new call-set warning, and only the 18 existing objective-wiring warnings and 2 cutscene `onceOnly` warnings. The regenerated `dungeon_graph.*` came out unchanged. Dialoguelint shows only the existing ERB `:951/:958/:966/:974` length errors and the "however" false positive. I did not re-derive the "−0" against the baseline file. Retired lines were texts, which have no key, so 0 is plausible.

## Question 8: the lab sheet

`HacktivityLabSheets/_labs/safetynet/m07_architects_gambit.md:525`, "open your phone and choose **[Bring me in.]**. HaX picks up and puts you through.", matches the live run (2153). The rest of the sheet does not describe the Architect's messages, so nothing else needs changing. **n7:** HaX only puts you through once all four flags are in; otherwise she says "Not yet…". A clause such as "(with all four flags submitted)" would keep the nudge true for a player who calls early. The VM companion was not opened.

## Housekeeping

- 035051e34 is titled "M8" but contains the first M6 proofs, handover and log entry. History only, no action.
- To finish the slice: the audio pass (72 clips).

## Fix list

| # | Grade | Owner | Change |
|---|---|---|---|
| M1 | M | route/docs | terminal-aware `IN_CALL` in `m6_live.sh`; `replay` walks the choices; no force-close in `signoff`; correct the parked-phone note in `PROOF.md`, `HANDOVER_M6.md` and log `:184` |
| M2 | M | engine | read beat before closing a terminal-look call that ended on its own path; node test and live proof |
| m1 | m | docs | describe `replace` as it ran, or move it behind a person-chat (2158 shows that passes) |
| m2 | m | orchestrator | voicemail look: amend the M6 row to "the handset's look", or theme the thread |
| n1–n7 | n | writer/docs | as above |
