# m07 The Architect's Gambit: voicing prep (2026-10-18)

The last read before m07's first voicing on `gemini-3.8-flash-tts`. No audio was generated. Brief: the session's `prevoice_brief.md` (pre-voicing pass, m04–m08).

**Expected voiced lines:** 525 (`bin/rails "app:break_escape:tts:wasted[m07_architects_gambit]"`: "0 of 0 current-model clips … 525 lines expected"). The count is the same before and after the edits. Of the 525: narrator 97, Netherton (briefing) 81, Netherton (debrief) 153, Elena 73, Mercer 71, Hollis 29, Park 21. HaX's 34 debrief lines are **not** in the count (see "For the user" 1).

## Printed variables (rule 2)

None. The "1 `{player_name}` line" from the 2026-10-17 decisions form is `VAR player_name = "Agent 0x00"` at `m07_npc_james_mercer.ink:19`, a declaration that nothing prints. The briefing (`:8`) and the debrief (`:22`) declare it the same way. No voiced line in m07 prints `{player_name}`, `player_name()` or any other variable. The declarations stay, since the brief keeps globals unchanged.

HaX's `topic_teacher` carry-over line is in `m07_phone_agent_0x99.ink`. Phone chats aren't voiced (no ink has `voice:` lines), so it wasn't checked for audio.

## Spoken lines changed

| file:line (new) | before | after | why |
| --- | --- | --- | --- |
| m07_opening_briefing.ink:240 | Trojan Horse: access to forty-seven million systems. No projected fatalities. A decade to rebuild. | Trojan Horse. Access to forty-seven million systems. No projected fatalities. A decade to rebuild. | The client strips any leading "Two Words: " from the text it sends to TTS (`person-chat-minigame.js:1381`, `TtsLineExtractor::CLIENT_STRIP_PREFIX`), so the clip would have started at "access to…" without saying the operation's name. |
| m07_opening_briefing.ink:238 | Fracture: an election nobody believes in. … | Fracture. An election nobody believes in. … | The same punctuation as Trojan Horse, so the three side-by-side lines match. |
| m07_opening_briefing.ink:242 | Meltdown: eighty to a hundred and forty dead this week. … | Meltdown. Eighty to a hundred and forty dead this week. … | As above. |
| m07_opening_briefing.ink:24 (narrator) | 02:41 Pacific. Rain on the I-5, … | Two forty-one in the morning, Pacific time. Rain on the I-5, … | A clock time read aloud could come out as "oh two forty-one" or "two forty-one". The on-screen threat desk summary still says "02:41 PT". |
| m07_opening_briefing.ink:96 (narrator) | … outside Portland, 03:24 by the dashboard clock. | … outside Portland, three twenty-four by the dashboard clock. | As above. Route r23 updated to assert the new wording. |
| m07_closing_debrief.ink:90 (narrator) | … On the secure link, Netherton sits down in front of the camera with a tablet, in the suit he briefed you in. | … On the secure link, Netherton sits down with a tablet, in the suit he briefed you in. | 34 words, the longest voiced line in the mission (the lint exempts narration from the 30-word cap). Now 29; "secure link" already says it's a call. |
| m07_closing_debrief.ink:176 | Two thousand four hundred vendors are having a miserable fortnight. | Twenty-four hundred vendors are having a miserable fortnight. | The briefing says "twenty-four hundred vendors", so the debrief now uses the same figure. It's also shorter aloud. |
| m07_closing_debrief.ink:213 | Two Digital Vanguard insiders were detained in the SOC. … | Two Digital Vanguard insiders were detained on the twenty-fourth floor. … | "SOC" could come out as "sock" or "S-O-C". The briefing and line 209 call it TechCore's twenty-fourth floor. |
| m07_closing_debrief.ink:744 | Report to headquarters when your leave ends. Not to this room. Somewhere without windows. | When your leave ends, report to headquarters. I will find us a room without windows. | dialoguelint's not-x-but-y finding. "Not to this room" made little sense, because nobody would report to a borrowed office at the grid site. The windowless room still pays off his look at the dark window (:643, "He looks at the dark window a little too long") and the mole lines after it. |
| m07_npc_elena_rodriguez.ink:254 | As in 911 call routing. | Yes. Where every nine-one-one call goes first. | She repeated the player's choice label word for word, and "911" could be read as "nine hundred and eleven". The choice label keeps "911", because labels aren't voiced. |
| m07_npc_james_mercer.ink:175 | I did publish. Four papers, two of them still cited. I testified twice. The same submission went in two times in eight years. | I did publish. Four papers, two of them still cited. I gave evidence to two committees. The same submission went in twice in eight years. | "Two times" is clumsy aloud, and "twice" was already used in the line. It still agrees with "This is the third submission" (mercer:234, the projection quote) and "Three submissions" later. |

11 voiced lines changed. Structure: `tagdiff` reports **STRUCTURE UNCHANGED (8 files)**, with prose changes only in the four files above.

## Voice config

**No changes.** Each voice was checked against `docs/agents/CAST_PROPOSALS.md` (m07 section, approved 2026-10-16), `docs/agents/PASS3_VOICE_AUDIT.md` (m07 table) and the ink:

| speaker | voice | as cast | verdict |
| --- | --- | --- | --- |
| narrator | Algenib, RP, en-GB | – | OK (canonical narrator; m07 grave tone) |
| Netherton (opening_briefing_cutscene, closing_debrief) | Charon, RP, en-GB | Black British, Caribbean heritage, late fifties | OK; both blocks carry identical style text |
| Ray Hollis | Puck, PNW working-class, en-US, mid-thirties | Black American, about 35 | OK |
| Elena Rodriguez | Leda, Californian with Mexican-American inflection, en-US, early thirties | Mexican-American, about 32 | OK |
| Dr James Mercer | Iapetus, General American PNW, en-US, late fifties | white American, about 58 (narration says fifty-eight) | OK |
| Thomas Park | Rasalgethi, Korean-American PNW, en-US, forties | Korean-American, about 45 | OK |
| The Architect (phone) | Sadaltager, distorted | – | Not voiced in m07: his story is phone-only |
| Agent HaX (phone) | Aoede, RP | – | See below and "For the user" 1 |

The m07 cast proposals took their looks from these voice styles, so gender, age and accent already agree. None of the m05–m08 recasts on 2026-10-16/17 changed an m07 character's gender or age.

## HaX's style (rule 3)

**Nothing to apply.** The m07 style (`scenario.json.erb:828`) has no "speak quickly with urgency, as if time is short" wording. It is the "m07 strain" scene mood that rule 3 names and keeps:

> Intelligence handler on a secure line, running four crises at once with one agent in range. Speak with a consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Use a steady, mid-range pitch. Quick, dry, clipped. Fond of the agent and audibly under strain, which she handles by getting drier rather than louder.

Before = after = the text above. The only place she'd be voiced is the debrief (see "For the user" 1), where "running four crises at once … audibly under strain" fits less well after the abort. If the lead fixes that routing, consider (optional, user's ear decides) appending to it: "In the debrief the crisis is over; the strain is in what she has found, not in the clock."

## The ten weakest spoken lines

| # | line | what I did |
| --- | --- | --- |
| 1 | Elena, elena:254 "As in 911 call routing." (echoes the player's choice) | Rewritten (table above). |
| 2 | Netherton, briefing:240 "Trojan Horse: access to…" (the operation's name is cut from the audio) | Fixed (table above). |
| 3 | Mercer, mercer:175 "…went in two times in eight years." | Rewritten (table above). |
| 4 | Netherton, debrief:744 "Not to this room. Somewhere without windows." | Rewritten (table above). |
| 5 | Narrator, debrief:90 (34 words) | Trimmed (table above). |
| 6 | Netherton, debrief:213 "detained in the SOC" | Rewritten (table above). |
| 7 | Netherton, debrief:624 "A safetynet.gov address, the name stripped before it reached us." (also HaX, debrief:550, "From a safetynet.gov address") | **Kept.** "safetynet dot gov" is how a person says it, and the domain is the clue that the sender is inside SAFETYNET. Flagged so a listener can check the clip. |
| 8 | Ray Hollis, hollis:242 "Stay there. STAY THERE." | **Kept.** The shout is meant: he's backed into the turnstile frame. The capitals tell the TTS to raise his voice. |
| 9 | Narrator, mercer:64 "His screen says ABORT ACCEPTED." | **Kept.** On-screen capitals are voiced the same way in m01 ("HEADER MISMATCH DETECTED", already voiced and reviewed). |
| 10 | Elena, elena:248 "…prefixed EHR or CAD." | **Kept.** The next choice spells both out, and either reading ("C-A-D" or "cad") is what an engineer would say. |

Also read and left as they are: briefing:65 "There are, to the other three." (a clipped answer to "There must be teams closer", in character), hollis:169 "The log doesn't say who. Then go and find something that does." (his defiance reads fine aloud), and the m06 carry-over lines in the briefing (froze / watched / undecided / never played). Each carry-over line names what the player did in m06 and stays under 30 words. The never-played line is unchanged word for word.

## Checks

- Ink compiled (inklecate) for the four edited files.
- `ruby scripts/validate_scenario.rb scenarios/m07_architects_gambit/scenario.json.erb`: 0 errors. The warnings are the existing eventMapping/onceOnly, cutscene onceOnly and timed-text-spacing ones; none is about dialogue text.
- `dialoguelint`: no line-len or text-len findings. What remains: transition ×1 (Architect phone), blank-reentry ×3 (Hollis/Park parked hubs), crowded-hub ×1 (HaX phone), all present before this pass. The not-x-but-y finding is fixed.
- `tagdiff` against HEAD: STRUCTURE UNCHANGED (8 files).
- `loopcheck` on the four edited stories: no runtime errors.
- `reopencheck` (missions.json): 0 problems (m07 HaX 1800 reopens, the Architect 472).
- Route driver: 39/39 routes pass. r23 asserts the reworded "three twenty-four by the dashboard clock".

## For the user

1. **HaX's 34 debrief lines will be silent.** In `m07_closing_debrief.ink` (e.g. :248, :399–411, :540–580, :634–635, :750), HaX speaks as a co-speaker in Netherton's debrief. The TTS endpoint checks a co-speaker's line against that speaker's own story, and HaX's `storyPath` is her phone ink, so the endpoint refuses all 34 lines (403). The extractor already leaves them out, which is why they aren't among the 525. m01–m03 don't hit this, because their debrief host voices HaX itself, and m08 gives her a separate in-person NPC (`agent_0x99_person`), with 2 lines still refused there. Fixing it needs an engine change (for example, accept a co-speaker's line when it's in the host conversation's story) or a scenario change (an in-person HaX for the debrief, as in m08). Both are outside a text-only prep pass, so it's for the lead or the user to decide **before** m07 is voiced, or her half of the mole reveal plays without sound. Voicing them adds 34 clips under her phone style (see the HaX section for an optional debrief note).
2. None of the 11 rewrites changes the plot, so any of them can be reverted on taste. They have no clips yet, so there's no cost either way.
