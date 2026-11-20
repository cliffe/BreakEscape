# M5 review, round 1 (m05: Recruiter, Patricia, HaX root-flag ring and bring-in)

Reviewed 2026-11-12 at `7c0be1ba6` (config `1002c920f`, proofs `ae5c492d5`, log `7c0be1ba6`) and HacktivityLabSheets `229ba7d`.

**Result: 0 B, 2 M, 2 m, 4 n.** The config, the bring-in, the key diff and the sheet are right. Every M5 row item works on the real path, with fewer head starts than the implementer's proofs used. The two M findings are a missing `mission_complete` guard on the Recruiter's ring (seen live) and one voiced HaX line that still calls her first contact a text.

## Live check (keyless :3024, headless, server stopped afterwards)

Route: a scratch copy of `tools/phone_calls/routes/m05_live.sh` that does the trigger for real instead of emitting events. The only head starts were evidence globals and flags 1 to 3 (`--submit-flag`); flag 4 was typed into the drop-site terminal.

| Game | Case | Head start | What happened |
|---|---|---|---|
| 2046 | Recruiter, real trigger | `patricia_phone_available`, `found_medical_bills`, `found_upload_schedule` | Call button rang Patricia; I named Torres in the call (I know who it is, David Torres, Money, The upload schedule). `torres_identified` was set at 27.3 s and the call closed at 39.7 s. She rang at 47.3 s (7.6 s later) on `first_call`, with the TalentStack caption, while the phone sat open on Patricia's thread. Answered: her two opening lines, then three choices. `/tts` returned 503 for both lines. |
| 2063 | Reload in the 7.5 s window | same | Reloaded 3.8 s after the close. 12 s later: no ring, no row, `recruiter_texted=false`. I then opened HaX's thread and closed it with the X. `conversation_closed:agent_0x99_handler` fired, and she rang 7.5 s later. |
| 2071 | Ring re-armed at the bring-in | `torres_identified`, `final_choice=arrest`, flags 1 to 4 (the state a reload in the window leaves when no later Patricia or HaX close comes before the bring-in) | Real bring-in: Bring me in, then On my way. The debrief opened. 7.5 s after the call closed, `recruiter_texted` went true and her ring was queued (`queue=1`) behind the debrief person-chat. |
| 2078 | Root-flag ring, real submit | flags 1 to 3 | Flag 4 typed and submitted. The ring came 1.5 s later, while the drop-site terminal was open ("Answer puts them on hold until you close this"). Answered at 21 s, so the call was held; on closing the terminal it connected with "Finally. Sit down for this." and the body. `as=21`, all lines 503. |
| 2064 | Row 31, real order | flags 1 to 3 | Ring offered while the terminal was open. I closed the terminal, opened the phone and HaX's thread while it was still ringing, and chose [The Architect signed off…]. The ringer went to `connected` on `topic_architect`; the plain opening played; `queue=0`; the thread got "Outgoing call, 0:11" and no Missed row; `architect_discussed` came on. |
| 2085 | Root ring declined | flags 1 to 3 | Decline left a Missed row, a "Call back" button and the text "Root flag's in — the Architect's authorisation, the casualty projection, all of it. Ring me back. You need to hear this." Call back connected with "Thank you. Listen." (`callback as=0`). |

The implementer's proofs were not wrong, but they had more head start than their README says. `recruiter_*` emitted a synthetic `conversation_closed:agent_0x99_handler` with `torres_identified` set by hand. `root_*` emitted `global_variable_changed:flag4_submitted` without setting the global, and with no terminal open. `root_row31` set `architect_approval_confirmed=true` before the ring, so the hub choice existed before the ring, which can't happen in play: the choice only appears once the ring's `setGlobal` runs. The real-path runs above cover each of these and found no timing problem of the M1 R2 kind (no ring before its trigger text or line).

## Findings

### M1. The Recruiter's ring has no `mission_complete` guard, and a reload in her 7.5 s window can move her first call to the debrief

`scenario.json.erb:1546` (condition on all three ERB-loop mappings): `torres_identified === true && recruiter_contacted_player !== true && recruiter_texted !== true`. A5 R1 §3 asked for `!globalVars.mission_complete` here, because the bring-in call's close is one of the three triggers. It wasn't added.

**On the 7.5 s question:** her first call is not lost for good. A pending `delayMs` isn't saved, but `onceOnly` is only spent when the ring is offered (`npc-manager.js:1228-1233`). After a reload, the next close of Patricia (in person or phone) or of HaX's thread re-arms it (README_scenario_design.md:1697; game 2063). That makes `untilAnswered` unnecessary: she is an antagonist cold-calling, so a ring-out that leaves a callback and her text is the right shape. The real risk is where the deferred call lands. If the next of those closes is the bring-in, she rings into the debrief (game 2071: queued behind the person-chat, so she rings when it ends).

Fix:
- Add `&& globalVars.mission_complete !== true` to the shared condition (one edit, in the ERB loop).
- Recommended alongside it: a `game_loaded` twin with `delayMs: 7500` and the same ring, `onceOnly`, `setGlobal`, and condition `globalVars.torres_identified === true && globalVars.recruiter_contacted_player !== true && globalVars.recruiter_texted !== true && globalVars.mission_complete !== true`. With it, a reload re-arms her at once instead of waiting for the next close. On a fresh start `torres_identified` is false, so it can't fire early.

**Twice or never (the three mappings).** There are three because the ERB has always looped over `patricia_morgan`, `patricia_phone` and `agent_0x99_handler`, and WRITER_CALLERS M5 asks for all three; there were never two. Her two follow-up mappings (`phone_call_declined` / `phone_call_missed`) are the other `onceOnly` pair, and both are kept.

They can't ring twice. Each is a separate handler, so two closes inside 7.5 s can leave two pending, but `_handleEventMapping` re-runs `_mappingWouldFire` when the delay is up (`npc-manager.js:789-808` and the re-check after it). The first to fire sets `recruiter_texted`, so the rest fail their condition. In game 2071, two `conversation_closed:agent_0x99_handler` events (the A5 double fire) gave one ring.

"Never" needs `torres_identified` and then no close of those three threads for the rest of the mission. That isn't reachable: naming always happens in one of them. With M1 fixed, the remaining gap is a reload in the window followed by no close before the bring-in, which the twin covers.

### M2. HaX's voiced bring-in line still calls the Recruiter's first contact a text

`m05_phone_agent_0x99.ink:987` (`extract_call`, voiced, one of the +118): "That TalentStack text never got an answer. She's lost him. Ring her if you want to hear her lose." The condition is `recruiter_texted and not recruiter_contacted_player`. Her first contact is now a call. `recruiter_texted` is set when the ring is offered, so this line plays after a declined call (the text came second) and after a reload-induced miss, where `!data.reload` means no text was sent at all. In that second case the line is false.

The silent twin in `report_progress` (`:1162`, "That TalentStack text is still unanswered…") has the same problem, and the comment at `scenario.json.erb:1270` is stale.

Reword both before the audio run; no clip exists yet, so it costs nothing now. For example: "TalentStack rang and you let it go. She's lost him. Ring her if you want to hear her lose." and "TalentStack's still waiting on you. Hear her out if you want. Just don't give her anything." The HaX text mapping at `:1274` ("That TalentStack number is the Recruiter…") already reads right for a call.

### m1. What the `/tts` 503 shows

`proofs/M5/README.md` and the log say a 503 "confirms … call lines are voiced". A 503 here (`games_controller.rb:754`, "TTS not configured … and no cached audio") shows three things:

1. The client classed the line as voiced and requested it.
2. `TtsLineResolver` accepted the text as that NPC's line. Its `own_story_line` fallback accepts any text in the NPC's ink, so this check is loose.
3. There is no cached clip.

It does not show that the batch extractor will generate the line. The key diff shows that (+118, rechecked below). It also covers only the lines a run walked through. Reword the README line to say both, and list the head starts as in the table above.

### m2. The proof README understates the head starts

See the last paragraph of the live check. Note the synthetic events in the README's "Preconditions are head-start globals only" line, and add the real-path runs above (or rerun with `--submit-flag` plus a typed flag 4 and a real naming call) so the proofs show the order a player sees.

### n1. `bring_end` row

The route pushes a probe optional so the ending question will show, then clicks "End the mission now". `bring_end_overlay.png` shows the debrief and no question, so the probe never counted as an open optional. The README's description ("the ending question never shows") matches what happened, but not what the route set out to do. The M5 row needs only the nothing-open run (`bring_clear`, proved), and the "End the mission now" branch is proved for the engine in A5 R1 m1. Drop the probe or relabel the case.

### n2. "Don't ring this number again" repeats

`m05_phone_recruiter.ink:303`: after an accepted deal, every Call press before the confrontation replays "We have an arrangement. Don't ring this number again." (and `:307` "You said no once…" after a refusal). Setting `recruiter_line_dead` there would cut her post-confrontation lines (`deal_accepted_response`), so leaving it is defensible. It's noted only so the choice is on record.

### n3. Callback to `first_call`, then "Here's why I actually called."

`player_rang` is only set in `return_contact`, so a Call back after a declined first call opens "You rang back. Manners, or curiosity?" and later says "Here's why I actually called." That still reads as her original call, so no change is needed.

### n4. The root-flag decline mapping has no knot condition

`scenario.json.erb:1114`: `phone_call_declined:agent_0x99_handler`, `onceOnly`, no condition. Today it is HaX's only ring in m05, so it's fine. If another HaX ring is ever added, gate it on the knot.

## Checks

- **Merge and config against the writer notes.** All of these match: `recruiter_line_dead` declared (`:741`); the Recruiter `call {return_contact, when !recruiter_line_dead, no_answer}`; ring on `first_call` with `onMissed: callback` and `callLabel`; `setGlobal recruiter_texted` kept; decline and missed follow-ups (`!data.reload` on missed). Patricia `call {phone_call, when available && !ko}`. HaX `call [topic_architect, extract_call]`, both `button:false`. The root mapping has `untilAnswered`, `delayMs 1500` and `setGlobal` kept. The four ERB and two ink rewords are in. Missing: the `mission_complete` guard (M1).
- **The 118 voiced lines** (21 HaX, 49 Patricia, 48 Recruiter, from `keys_added.tsv`), all read. No printed variables. No inline stage directions (the player's "You: ..." isn't voiced). No text-speak, and no narration left in a call knot: the "Caller ID", "line goes dead" and "hangs up first" lines are gone. Two Patricia lines open with "..." ("...Damn.", "...Every night."), which TTS handles as a pause. Only M2 reads wrong.
- **Bring-in against 7.6 and the log's rule.** All match. First-dial opening unchanged; redial "QDC's people are nearly at the vault. Say when."; [Bring me in.] "Front entrance. Walk like you work there." with `#complete_task:call_in_after_sweep` on that reply; lethal "Your call. He hasn't got long." unchanged; else "Then look. The vault's yours till someone notices."; `[On my way. #ending_check]`; last line "Thursday, nine o'clock. My office." with `#set_global:mission_complete`. Game 2071's real bring-in set `mission_complete` and opened the debrief.
- **Key diff**, rerun with `dump_tts_keys.rb` (labels) against `keys_baseline/m05_insider_trading.txt`. +118 added, 0 removed, exactly the set in `proofs/M5/keys_added.tsv`. None of the 118 appears in any other scenario's current dump.
- **Validators.** `validate_scenario.rb` exit 0, schema passed, no phone-call warnings. The ERRORs are the two existing word caps (`m05_closing_debrief.ink:353`, `m05_phone_agent_0x99.ink:1083`) and the documented villain WARN (`m05_phone_recruiter.ink:388`). `dialoguelint.mjs` exit 0 with the same two. The validator rewrote m05's dungeon graph files byte for byte, so git shows no change.
- **Lab sheet** (`_labs/safetynet/m05_insider_trading.md`, 229ba7d), four sentences, all correct against live behaviour. `:80` and `:213`: Patricia rung with the call button. `:517`: the Recruiter calls; decline or ring-out leaves a text and a call-back button; ringing her after the confrontation gets no offer. `:572`: open HaX's thread and choose Bring me in; the phone rings her. `:407` ("Ring Patricia…") and `:593` still hold. I didn't open the VM companion.
