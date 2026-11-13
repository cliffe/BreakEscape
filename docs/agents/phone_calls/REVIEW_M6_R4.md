# Phone calls M6 (m07) review, round 4 (light round after engine R2)

Reviewer: Opus, 2026-11-12. Code under test: committed HEAD `ba1300ab1` (engine R2: `ringWhile`/`callbackWhen` grammar check, latch restore, caption at first paint; m07 `6b6394ae9` drops the narration after "(Hang up.)"). HacktivityLabSheets at `ff4322a`. Keyless server on :3024, headless, stopped afterwards; no browsers left open. Script: `proofs/R4_m06_m07_m08/m07_r4.sh` (a copy of the R3 script with port and OUT changed). The bring-in "Not yet" run used `tools/phone_calls/routes/m6_live.sh bring_notyet` with the same OUT. Output per case is in `m07_<case>_output.txt` there.

**Verdict: accept. 0 B, 0 M, 0 m, 3 n.** Ready for audio, apart from the n1 wording call below, which is cheaper to make before the clips exist.

## Validators

- `validate_phone_calls.rb`: no output, exit 0.
- `validate_scenario.rb --no-graph`: "Validation complete", exit 0 (`val_m07_architects_gambit.txt`). The `ringWhile`/`callbackWhen` grammar check raises nothing. The warnings are the same set as earlier rounds: onceOnly overlaps, two cutscenes without `onceOnly`, the stacked `object_interacted` texts, and the dialoguelint word caps on `scenario.json.erb:952-975` (texts, not call lines). The two "however" WARNs hit `m07_architect_comms.ink:115` and `:559`. That line is in character, so leave it.

## Live checks

| Check | Game | What I saw | Result |
|---|---|---|---|
| T-30 answered, walked to the end | 2352 | Rang as "No caller ID / Incoming call". "Who am I speaking to?" took the call to "The line drops. The log shows one call: no number, no name.", which stayed on screen for three polls (about 1.8 s observed, 0.65 s polling), then `callActive` false and `mg: null`. One `Call: No caller ID` row. `/tts` asked for the five Architect lines. | pass |
| T-20 declined | 2355 | Rows `Call`, `Missed call`, `Voicemail`. His thread has the three voicemail transcripts. "(Hang up.)" is the only choice. Clicking it closes the phone with no player bubble (DOM 0, history still has only "Who am I speaking to?"). The "half-second" narration is gone from the ink (`6b6394ae9`), so nothing is written that nobody sees. | pass |
| Forced sign-off | 2358 | Rang on `minigame_completed`, answered itself, back arrow `display: none`. "You lost tonight." led to "I wasn't playing for tonight." and the close. The last narration held two polls, then the call closed itself. `architect_signoff_done=true`, `debrief_requested=false`, ending unarmed. | pass |
| Bring-in, a flag out | 2360 | The call screen showed "Agent HaX / SAFETYNET secure line" on its first paint, while still CALLING (`bring_notyet_calling.png`), which is the R2 caption fix working. Voiced "Not yet. Put the rest of the flags through the relay and he's on straight after.", `Outgoing call, 0:01`, `debrief_requested=true`, ending unarmed. | pass |
| Not yet, then the last flag, then the prompt | 2361 | Reopened hub: no "Bring me in.". Flag 4 set (global plus its event), ops floor entered: `closing_debrief` held on `room_entered:operations_floor`, and the "BEFORE THE MISSION ENDS" overlay listed one optional (Ray Hollis) with Keep going / End the mission now (`notyet_after_after_flag4.png`). | pass |

## Lab sheet (`m07_architects_gambit.md`, `ff4322a`)

Line 525 now says that if a flag is still outstanding she tells you to finish the relay, and that once the last flag is in, the game offers to end the mission the next time you go through a door or close a screen. That matches 2360 and 2361. R3 m1 is closed.

## Voiced lines read for audio

I read every spoken line in `m07_architect_comms.ink` (calls and voicemails) and `bring_me_in` in `m07_phone_agent_0x99.ink`. I found no typos, no printed variables and no inline stage directions. The `{countdown_expired:…}` prefix at `:363`/`:365` is in a Narrator line and makes two whole authored strings, which is fine. The team/city mapping agrees across T-20, T-10, T-5, the voicemails and the sign-off: fracture is Washington, trojan_horse is the vendor pipeline in Austin, and meltdown is San Francisco.

## Nits

- **n1 (ink, redirect branch, decide before audio).** On a redirect to Trojan Horse made before T-20, one run plays three lines that don't agree. T-20 says "You moved them already." (`m07_architect_comms.ink:153`). T-10 says "You moved them. I had wondered whether you would." (`:224`). The sign-off says "And you moved them. Late, but you moved them. I had you down for staying put." (`:431`). "Late" and "had you down for staying put" both contradict the earlier two. Suggested sign-off line: "And you moved them. Not everyone does." (T-10 already uses "I had wondered whether you would.") Not live-tested (needs a redirect run); this comes from reading the branches. It is a one-line change, and it costs nothing if made before this clip is generated.
- **n2 (lab sheet wording).** In the line 525 paragraph, the sentence after the new clause, "If you do not, the game starts the debrief by itself after about nine minutes", now reads as "if you do not go through a door". It meant "if you do not choose [Bring me in.]" (the 540 s fallback, `scenario.json.erb:750`). Suggested: "If you never ask, the game starts the debrief by itself after about nine minutes."
- **n3 (proof gap, keyless, carried).** The "wait for the last clip" half of the read beat still can't run without audio. Check one Architect call end and the Seattle clip in the audio pass.

Not re-run this round, as unchanged since R3 and outside this round's scope: back arrow on a taunt, Seattle, the flags-in bring-in.
