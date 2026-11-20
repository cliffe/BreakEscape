# Phone-mode audit: ink writing vs. how each conversation is opened

Read-only. No repo file was edited. Paths below are relative to `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/scenarios/` unless shown in full.

## Method and coverage

- Mappings come from `phone_table.txt`. Timed conversations and contact-level `voiced` came from grepping each `scenario.json.erb`.
- A scanner (`knot_cues.py`, in the scratchpad) counted spoken and text cue words per knot. It was too noisy to decide on its own, so I read the decision-relevant knots by hand.
- Covered in detail: the m02, m04, m05, m07, m09 and m10 phone NPCs, lab_social_engineering, lab_tesseract_trials, sis02 and sis03 phone NPCs, and the person-type voice entries in m10 and m09.
- Not read in full: most silent KO cards (m03, m04, m05, m06), the m06 recap and hubs, the m07 agent hub, the m08 hubs, m09 status and bring-in knots, the m10 six_oclock phone beat, and the lab_physical_pentest Ruth thread.

## Clearest mismatches

1. **m09 Nightshade `call` is a live call, sent as silent text.** `m09_digital_archaeology/ink/m09_phone_nightshade.ink:20` ("I'd ask how the leave was, but HaX would tell me to get off her line."), `:26` ("[HaX is on this line.]"), `:27` ("She's been listening since before you picked up."). Opened by `flag1_submitted` as `phone-chat` with no `voiced`. The NPC has `voice` set. Confidence: high.
2. **m09 Torres `call` is a live call, sent as silent text.** `m09_phone_torres.ink:27` ("I gave you this address back in October."), `:42-43` ("[Are you safe?]" / "Safe enough. Please be quick."). Opened by `object_interacted`, `item_unlocked` and `room_exited`, all `phone-chat` with no `voiced`. Confidence: high.
3. **m09 Gary `call` is a live call, sent as silent text.** `m09_phone_gary.ink:26` ("It's Gary. Whitlock, from St. Catherine's. HaX says you're through that keypad already."). Opened by `door_unlock_attempt` as `phone-chat` with no `voiced`. Confidence: high.
   - Fix for 1 to 3: add `"voiced": true` to each mapping (the knot is a call and the NPCs have voices), or rewrite as a text thread. The m09 Recruiter call already does the first.
4. **m07 The Architect speaks as a call but is delivered as silent text.** `m07_architects_gambit/ink/m07_architect_comms.ink:97`, `:141`, `:215`, `:289`, `:351` ("Your handset lights without ringing. The call is already connected") and `:399` / `:401` ("Your handset rings anyway."). The taunts come from `sendTimedMessage` texts and the `timers` block. The sign-off comes from a `phone-chat` mapping with no `voiced` (`scenario.json.erb` around line 1635). No `voiced` key appears anywhere in the m07 scenario. Confidence: high that the writing is call-style and the delivery is silent. Medium on intent: the writing may be meant as a text feed that describes a call.
5. **m10 Agent HaX in person says she is on the phone.** `m10_full_disclosure/ink/m10_hax_post.ink:27` ("I'm on your phone now. Ring me.") and `:49` ("Ask me on the phone. I'll hear you just as well underground."). `hax_post` is `npcType: person` with her sprite (`scenario.json.erb` ~1599 to 1612). The config has no hide rule after `breach_open`. The file's own header says "After the breach she is 'on the phone'", but the sprite stays in front of the player. Confidence: high. Fix: hide `hax_post` once `breach_open` is set, or change the post-breach line.
6. **m05 Recruiter and m04 Vance are call logs in a silent thread.** Neither has a mapping, so the player opens them from the phone and they stay silent. The writing is call-shaped.
   - m05 `m05_phone_recruiter.ink:393` and `:403` ("Narrator: She hangs up first."), `:414` ("[Ring the TalentStack number back.]"), `:417` ("It rings out."). The recruiter has `voice` set, so the author may have meant a voiced call. Confidence: medium.
   - m04 `m04_phone_robert_vance.ink:86` ("Vance. What do you need?") and `:273` ("Call me if you need it."). Confidence: medium-low. Vance has `voice` set and no mapping.

## Consistent (no mismatch found)

- m09 Recruiter `call` (voiced, `room_entered` / `room_exited` / `game_loaded`). Reads as a call.
- m09 HaX `tesseract_call`, `identity_scene`, `identity_resume`, `deck_resume` (voiced). Reads as a call.
- m09 HaX `hour_read` (silent). The ink says "Text, not voiced." on line 588, and it reads as text.
- m10 HaX `breach_call` to `gallery_open_call`, including the short `inner_door_call`, `tripwire_call`, `ladder_call`, `stair_call` (voiced). Reads as calls.
- m10 Victoria `victoria_call`, Vance `cut_call`, Elena `cut_call`, Ghost `ghost_call` (voiced). Reads as calls.
- m02 Ghost `on_recovery_console` and `on_console_again` (video-call, voiced). "A video window opens" fits.
- lab_tesseract_trials Ghost `the_offer_call` (video-call). Same.
- m01 and m02 HaX `first_call` (home knot, silent). Text-like. The m01 knot says the first message "comes as a timed message".
- sis02 Marcus and Tom (no mapping, silent). Text-like.
- lab_social_engineering Ruth (`ruth_phone`, no `voiced`). Her lines ("Call's done. Now the page.", "Ring Dev back") fit a text thread about calls.
- m10 co-speaker voices. Wendell, Imran, Gary and Tesseract are in-person scenes with no remote cues. Gary is "at the far bench". The m10 Hearing (`m10_hearing.ink`) is an in-person hearing room.

## lab_social_engineering

- **Dev service desk** is set with `voiced: true` on the NPC itself, plus `callLabel` (`lab_social_engineering/scenario.json.erb` lines 1794 to 1796). The ink opens "Service desk, Dev speaking." (`ink/dev_service_desk.ink:51`). The writing and the config match.
- The engine honours this. `public/break_escape/js/minigames/phone-chat/phone-chat-speaker.js:201-202` voices the contact's home knot when the contact has `voiced: true`. The rule is for calls the player starts, such as the pretext call from a desk phone.
- The docs do not say this. README_scenario_design.md's "Voiced phone calls" section says only the mapping or `timedConversation` carries `voiced`. This is a documentation gap, not a writing mismatch.
- **Ruth** is text. No `voiced` key (`scenario.json.erb` ~1633 to 1640). Her ink matches a text thread.

## Lower-confidence notes

- **m10 `line_dead` and `jammed`** (`m10_phone_agent0x99.ink:63-73`). Each is a dead-line state: "..." then "[Hang up.]". It reads as a dropped call inside a silent text thread. Reached from `start` when `ending == "joined"` or `hax_jammed`. Confidence: low. Probably intended as the thread's dead state.
- **sis03 James, Hartley and Ngata** (`call_initial` knots, e.g. `sis03_cyber_insurance/ink/npc_james_whitworth.ink:45-49`). Voice is off, so they are silent. The prose reads as a meeting ("I know you're reviewing the coverage"). Only the knot names say "call". Confidence: low.

## Assumptions

- Assumption: the phone table lists every event mapping. Timed conversations were checked by grep, not by a full JSON parse.
- Assumption: an NPC with `voice` set is meant to speak when it is called. Under that reading, silent call writing is a mismatch even when a mapping exists.
- Assumption: m10 `hax_post` is never hidden after the breach. I found no hide rule for it in the scenario config, but did not check the engine for a generic rule.
- Judgement: items 4 to 6 are medium because the writing could be a text feed that describes a call. Items 1 to 3 are high because the knots are plainly calls behind silent mappings.
