# m01 "First Contact": trailer scout v2

Stage 1 of `docs/video/M01_TRAILER_V2_PLAN.md` (section 3, item 1), using the method of `docs/video/scout/m01_scout.md`. No game file was changed. The scratch files are in `/tmp/claude-0/-home-user-BreakEscape/4ad0f0fc-9167-59c4-a9ed-f5bc845c2a2d/scratchpad/video-scout2/`.

## Headline

- **Part A, lines.** 44 candidate lines were tested live on a fresh m01 game (game 48). All 44 returned 200 `audio/mpeg` with a playable clip (durations from ffprobe). A control line that appears in no ink file was refused with 403, so the text check is live.
- **Durations.** 21 of the 44 clips are 4.0 s or shorter and 19 are between 2 and 4 s. The rest run from 4 to 8.8 s, so the takes will need the shortest lines.
- **Top picks** (the top 3 per speaker are marked in the tables):
  - Agent HaX: "Whatever they're building, it's targeted and sophisticated." (3.77 s), "Everyone else is innocent. Keep collateral damage to zero." (3.82 s), "Most employees at Viral Dynamics have no idea what's happening." (3.98 s).
  - Kevin: "I flagged it to management three times. Nothing happened." (3.53 s), "You're not just an auditor, are you." (2.57 s, gated behind the contingency file), "Honestly? I'm worried." (2.02 s).
  - Maya: "Anyone who gets too close gets removed." (3.46 s), "Only if you're here to stop it. People are going to die." (4.18 s), "You have three days to stop it." (2.74 s).
  - Sarah: the weakest speaker. "Next thing you know, HR calls her in and she's gone." (4.18 s), "I don't know. He mentioned it to management but nothing happened." (4.10 s), "I guess. Her office has been empty since. It's kind of creepy." (5.26 s).
  - Narrator (the only spoiler-free narrator line): "Viral Dynamics Media. A weekday morning in the city centre." (5.42 s), a noir voice-over opener.
  - Derek (finale only, outside the spoiler rule): "Working late on the security audit?" (3.50 s), "I'm not a villain. I'm a prophet." (4.25 s), and the plan's Entropy line (8.78 s).
- **Part B, set pieces.** 11 set pieces that are not on the recorded list, plus an inventory of the m01 minigames. Top 3: the CyberChef workstation, Derek's Computer in the lit office, and Kevin's Workstation. No room shows two NPCs at once, so walking shots need one NPC each.

## Environment (read first)

- The keyless server on :3001 was down when this scout started. Its last log line was at 12:37 (`tmp/keyless-3001.log`) and no Puma process was running. Postgres 16 `main` was down too. The scout started Postgres (`pg_ctlcluster 16 main start`) and a Rails server on 127.0.0.1:3001 with `GEMINI_API_KEY` unset. Nothing was listening on port 3000 when the scout started, and it was not touched.
- Game 48 was created with `tools/playtest/new-game.rb m01_first_contact` (fresh, no head-start). The tool also writes `tools/playtest/m01_first_contact-flags-game48.xml`, which git ignores.
- At the end the scout stopped the server and Postgres it had started, to leave the machine as it was found. The restart commands are under "Cleanup" at the end of this report.

## Part A: voiced lines

### Method

- **Pool.** `BreakEscape::TtsLineExtractor.for_scenario("m01_first_contact").entries` lists 594 voiced lines, the same list the batch generator uses. Each entry is a whole ink line, because the TTS endpoint accepts only text that the ink says for that NPC, so no line can be trimmed.
- **Filters.** 12 words or fewer, a hook that works out of context, and spoiler-free. The ink file and line come from the file itself. The knot path comes from the extractor and the choices from reading each knot.
- **Spoiler rule.** A line was dropped if it names Derek as the culprit or implies it (for example Kevin's "I think it's Derek Lawson", line 100), if it uses "operative", if it carries a code or PIN, if it gives a casualty figure (42 to 85, or "sixty"), or if it belongs to the ending or the debrief. The closing debrief (260 lines) is all ending and was not tested.
- **Live test.** `POST /break_escape/games/48/tts` with JSON `{npc_id, text}`, the session cookie from `GET /break_escape/games/48`, and the client's CSRF token (`breakEscapeConfig.csrfToken`). Stage directions stay in the text, as the client sends them. Status and content type come from the response, and the duration from ffprobe on the saved clip. Raw bodies are in `scratchpad/video-scout2/live/`.
- **Not tested.** Agent HaX's phone lines (`agent_0x99`). The brief limits HaX to the briefing, and scout 1 found no phone clips (503). The closing debrief (ending).

### Summary

| Speaker | Lines tested | 200 audio/mpeg | Top 3 (ID, spoken length) |
|---|---|---|---|
| Agent HaX (briefing) | 9 | 9 | hax_v2_1 (3.77 s), hax_v2_2 (3.82 s), hax_v2_4 (3.98 s) |
| Kevin Park | 10 | 10 | kevin_v2_1 (3.53 s), kevin_v2_7 (2.57 s, gated), kevin_v2_2 (2.02 s) |
| Maya Chen | 10 | 10 | maya_v2_1 (3.46 s), maya_v2_2 (4.18 s), maya_v2_4 (2.74 s) |
| Sarah O'Brien | 8 | 8 | sarah_v2_1 (4.18 s), sarah_v2_3 (4.10 s), sarah_v2_2 (5.26 s) |
| Derek Lawson (finale only) | 4 | 4 | derek_v2_1 (3.50 s), derek_v2_3 (4.25 s), derek_v2_2 (8.78 s) |
| Narrator | 1 | 1 | narr_v2_1 (5.42 s) |
| Desk-phone voicemails | 2 | 2 | none, too long (16.97 s and 27.70 s) |
| Control (in no ink file) | 1 | refused, 403 | n/a |

### Line tables

Each speaker's table gives the speaker id (the ID column), the exact text, the ink file and line, the knot, the conversation path from the NPC's start, the cheapest entry state, the word count, the spoken length and the live result. Top picks are marked. "Choice" counts are clicks in the dialogue.

### Agent HaX (briefing)

Briefing ink only, voice `Aoede`, `briefing_cutscene`. Phone lines (`agent_0x99`) have no clip and are not in this table.

| ID | Exact text (ink, speaker removed) | Ink file:line | Knot | Conversation path from start | Cheapest entry state | Words | Spoken (s) | Live |
|---|---|---|---|---|---|---|---|---|
| **hax_v2_1** (top) | Whatever they're building, it's targeted and sophisticated. | m01_opening_briefing.ink:71 | `root.data_concerns[0]` | start > 'What are they doing?' > 'What kind of data?'. data_concerns knot; 2 choices | fresh | 7 | 3.77 | 200 audio/mpeg |
| **hax_v2_2** (top) | Everyone else is innocent. Keep collateral damage to zero. | m01_opening_briefing.ink:142 | `root.employee_interaction` | start > 'I'm ready. What's the mission?' > 'How do I get inside?' > 'What about the employees?'. employee_interaction; 4 choices. Tested in scout 1 (hax_3) | fresh | 9 | 3.82 | 200 audio/mpeg |
| **hax_v2_4** (top) | Most employees at Viral Dynamics have no idea what's happening. | m01_opening_briefing.ink:138 | `root.employee_interaction` | start > 'I'm ready. What's the mission?' > 'How do I get inside?' > 'What about the employees?'. employee_interaction; 4 choices | fresh | 10 | 3.98 | 200 audio/mpeg |
| hax_v2_3 | Large-scale data aggregation. Personal profiles, vulnerability assessments. | m01_opening_briefing.ink:69 | `root.data_concerns[0]` | start > 'What are they doing?' > 'What kind of data?'. tested in scout 1 (hax_2) | fresh | 7 | 5.45 (over 4 s) | 200 audio/mpeg |
| hax_v2_5 | One more thing: there's someone inside named Maya Chen. | m01_opening_briefing.ink:147 | `root.innocent_warning` | start > 'I'm ready. What's the mission?' > 'How do I get inside?' > 'What about the employees?' (then auto to innocent_warning). names an NPC, not the culprit | fresh | 9 | 3.74 | 200 audio/mpeg |
| hax_v2_6 | The details are unclear, but it's active and operational. | m01_opening_briefing.ink:54 | `root.briefing_threat[0]` | start > 'What are they doing?'. briefing_threat; 1 choice | fresh | 9 | 3.62 | 200 audio/mpeg |
| hax_v2_7 | Use that advantage. Gather intelligence and evidence before making any moves. | m01_opening_briefing.ink:185 | `root.final_instructions[0]` | start > 'I'm ready. What's the mission?' > 'What resources do I have?' > 'I'm ready to go'. final_instructions; 3 choices | fresh | 11 | 5.06 (over 4 s) | 200 audio/mpeg |
| hax_v2_8 | You'll have phone comms with me throughout. I'll provide guidance as needed. | m01_opening_briefing.ink:162 | `root.resources_available[0]` | start > 'I'm ready. What's the mission?' > 'What resources do I have?'. resources_available; 2 choices. Long, weak hook | fresh | 12 | 3.89 | 200 audio/mpeg |
| hax_v2_9 | Get inside, find out what ENTROPY is planning, and report back. | m01_opening_briefing.ink:218 | `root.deployment` | start > 'I'm ready. What's the mission?' > 'How do I get inside?' > 'I'm ready to go'. deployment; directive, weak hook | fresh | 11 | 4.42 (over 4 s) | 200 audio/mpeg |

### Kevin Park

Voice `Charon`. Ink: `scenarios/m01_first_contact/ink/m01_npc_kevin.ink`.

| ID | Exact text (ink, speaker removed) | Ink file:line | Knot | Conversation path from start | Cheapest entry state | Words | Spoken (s) | Live |
|---|---|---|---|---|---|---|---|---|
| **kevin_v2_1** (top) | I flagged it to management three times. Nothing happened. | m01_npc_kevin.ink:84 | `root.security_situation[0]` | start > 'Happy to help. What's the security situation?'. security_situation; 1 choice | fresh, via IT room PIN (note K1) | 9 | 3.53 | 200 audio/mpeg |
| **kevin_v2_7** (top) | You're not just an auditor, are you. | m01_npc_kevin.ink:265 | `root.warn_kevin_details[0].c-0` | as kevin_v2_6 > 'Act normal. We handle Derek. You won't be touched.'. warn_kevin_details c-0; gated | as kevin_v2_5 (note K2) | 7 | 2.57 | 200 audio/mpeg |
| **kevin_v2_2** (top) | Honestly? I'm worried. | m01_npc_kevin.ink:80 | `root.security_situation[0]` | start > 'Happy to help. What's the security situation?'. security_situation; 1 choice | fresh, via IT room PIN (note K1) | 3 | 2.02 | 200 audio/mpeg |
| kevin_v2_10 | Act normal. Okay. I can do that. | m01_npc_kevin.ink:264 | `root.warn_kevin_details[0].c-0` | as kevin_v2_6 > 'Act normal. We handle Derek. You won't be touched.'. warn_kevin_details c-0; gated | as kevin_v2_5 (note K2) | 7 | 2.42 | 200 audio/mpeg |
| kevin_v2_3 | Now she's gone and nobody will tell me why. | m01_npc_kevin.ink:142 | `root.kevin_stress[0]` | start > 'You seem stressed'. kevin_stress; 1 choice | fresh, via IT room PIN (note K1) | 9 | 3.58 | 200 audio/mpeg |
| kevin_v2_4 | Just... be careful, okay? Something's not right here. | m01_npc_kevin.ink:172 | `root.offer_tools[0].c-0` | start > 'I'll need access to secure areas for testing' > 'I'll take all of it'. offer_tools; 2 choices. Gives items | fresh, via IT room PIN (note K1) | 8 | 3.53 | 200 audio/mpeg |
| kevin_v2_5 | You found something. I can tell. | m01_npc_kevin.ink:238 | `root.warn_kevin_direct[0]` | start > ... > hub 'I need to tell you something about Derek' (needs contingency_file_read). warn_kevin_direct; gated | needs contingency_file_read (note K2) | 6 | 1.94 | 200 audio/mpeg |
| kevin_v2_6 | Say that again. | m01_npc_kevin.ink:249 | `root.warn_kevin_details[0]` | as kevin_v2_5 > 'Kevin. Stop. Derek is planning to frame you for the entire breach.'. warn_kevin_details; gated, 3 words | as kevin_v2_5 (note K2) | 3 | 1.37 | 200 audio/mpeg |
| kevin_v2_8 | Don't answer that. I think I'm better off not knowing. | m01_npc_kevin.ink:266 | `root.warn_kevin_details[0].c-0` | as kevin_v2_7 (same branch). same branch as kevin_v2_7 | as kevin_v2_5 (note K2) | 10 | 3.22 | 200 audio/mpeg |
| kevin_v2_9 | Patricia was asking the right questions. Then she was gone. | m01_npc_kevin.ink:443 | `root.audit_question_4[0].c-1` | start > 'Happy to help' > 'That's what I'm here to investigate' > 'I'll take all of it' > hub 'I'd like to give you a preliminary security audit update' > any answer on audit_question_1, 2, 3 > 'A manager investigating security concerns was suddenly fired'. audit_question_4 branch | fresh, via IT room PIN (note K1); needs a hub choice after the lockpicks or keycard (note K3) | 10 | 4.46 (over 4 s) | 200 audio/mpeg |

### Maya Chen

Voice `Leda`. Ink: `m01_npc_maya.ink`.

| ID | Exact text (ink, speaker removed) | Ink file:line | Knot | Conversation path from start | Cheapest entry state | Words | Spoken (s) | Live |
|---|---|---|---|---|---|---|---|---|
| **maya_v2_1** (top) | Anyone who gets too close gets removed. | m01_npc_maya.ink:180 | `root.patricia_story[0].c-1` | start > first_meeting (either) > 'SAFETYNET sent me' > 'Tell me everything' > 'When does it launch?' > hub 'What happened to Patricia?' > 'That's suspicious timing'. patricia_story; about 6 choices | fresh, Maya's office open | 7 | 3.46 | 200 audio/mpeg |
| **maya_v2_2** (top) | Only if you're here to stop it. People are going to die. | m01_npc_maya.ink:64 | `root.reveal_check[0].c-0[5].c-1` | start > 'That's right. I'm reviewing security systems' > 'What message?' > 'Tell me more about this operation'. reveal_check; 3 choices | fresh, Maya's office open | 12 | 4.18 (over 4 s) | 200 audio/mpeg |
| **maya_v2_4** (top) | You have three days to stop it. | m01_npc_maya.ink:113 | `root.operation_details[0].c-1` | start > first_meeting > 'SAFETYNET sent me' > 'Tell me everything' > 'When does it launch?'. operation_details; 4 choices | fresh, Maya's office open | 7 | 2.74 | 200 audio/mpeg |
| maya_v2_10 | They're planning to kill people. On purpose. They call it "Operation Shatter." | m01_npc_maya.ink:82 | `root.informant_reveal[0]` | start > first_meeting > 'SAFETYNET sent me'. informant_reveal; 2 choices | fresh, Maya's office open | 12 | 7.10 (over 4 s) | 200 audio/mpeg |
| maya_v2_3 | Operation Shatter launches Sunday. We don't have much time. | m01_npc_maya.ink:193 | `root.tactical_advice[0].c-0` | start > first_meeting > 'SAFETYNET sent me' > 'Tell me everything' > 'When does it launch?' > hub 'What should I do first?' > 'That's a lot to do'. tactical_advice; 6 choices, needs revealed_informant | fresh, Maya's office open | 9 | 4.66 (over 4 s) | 200 audio/mpeg |
| maya_v2_5 | Sunday. 6 AM. That's when the messages go out. | m01_npc_maya.ink:112 | `root.operation_details[0].c-1` | start > first_meeting > 'SAFETYNET sent me' > 'Tell me everything' > 'When does it launch?'. same branch as maya_v2_4 | fresh, Maya's office open | 9 | 4.34 (over 4 s) | 200 audio/mpeg |
| maya_v2_6 | I have reason to be. Things aren't what they seem here. | m01_npc_maya.ink:46 | `root.first_meeting[0].c-1` | start > 'You seem nervous'. first_meeting; 1 choice. Cheapest Maya line | fresh, Maya's office open | 11 | 4.54 (over 4 s) | 200 audio/mpeg |
| maya_v2_7 | *glances at door* Is it safe to talk? | m01_npc_maya.ink:26 | `root.start[16].b` | any later visit to Maya after the first meeting (start, met_maya true). start knot, return visit; the line is the first thing said | after the first meeting | 8 | 3.98 | 200 audio/mpeg |
| maya_v2_8 | The tip. To SAFETYNET. About Operation Shatter. | m01_npc_maya.ink:55 | `root.reveal_check[0].c-0` | start > first_meeting > 'What message?'. reveal_check; 2 choices | fresh, Maya's office open | 7 | 4.97 (over 4 s) | 200 audio/mpeg |
| maya_v2_9 | *exhales* Finally. I've been waiting for weeks. | m01_npc_maya.ink:70 | `root.reveal_check[0].c-1` | start > first_meeting > 'SAFETYNET sent me'. reveal_check; 2 choices | fresh, Maya's office open | 7 | 3.86 | 200 audio/mpeg |

### Sarah O'Brien

Voice `Kore` (Irish). Ink: `m01_npc_sarah.ink`. None of the eight lines names Derek. Two lines use a pronoun or name for others, flagged in the table.

| ID | Exact text (ink, speaker removed) | Ink file:line | Knot | Conversation path from start | Cheapest entry state | Words | Spoken (s) | Live |
|---|---|---|---|---|---|---|---|---|
| **sarah_v2_1** (top) | Next thing you know, HR calls her in and she's gone. | m01_npc_sarah.ink:174 | `root.ask_about_manager[0].c-0` | start > 'Thanks. I'm here to audit...' (any first_checkin) > hub 'I noticed the manager's office is vacant?' > 'That sounds suspicious'. ask_about_manager; 3 choices | fresh, reception | 11 | 4.18 (over 4 s) | 200 audio/mpeg |
| **sarah_v2_3** (top) | I don't know. He mentioned it to management but nothing happened. | m01_npc_sarah.ink:111 | `root.ask_kevin[0].c-0` | start > first_checkin > hub 'Tell me about Kevin' > 'Who would do that?'. ask_kevin; 3 choices. 'He' is Kevin | fresh, reception | 11 | 4.10 (over 4 s) | 200 audio/mpeg |
| **sarah_v2_2** (top) | I guess. Her office has been empty since. It's kind of creepy. | m01_npc_sarah.ink:178 | `root.ask_about_manager[0].c-1` | start > first_checkin > hub 'I noticed the manager's office is vacant?' > 'These things happen'. ask_about_manager; 3 choices | fresh, reception | 12 | 5.26 (over 4 s) | 200 audio/mpeg |
| sarah_v2_4 | I don't know. Something about him makes me uncomfortable. | m01_npc_sarah.ink:151 | `root.ask_about_staff[0].c-0` | start > first_checkin (influence needs 3) > hub 'Anyone else I should know about?' > 'That seems unusual'. ask_about_staff; needs influence 3, about 5 choices. 'him' is Derek by pronoun | fresh, reception | 9 | 3.86 | 200 audio/mpeg |
| sarah_v2_5 | Kevin's our IT manager. Really nice guy, kind of overworked. | m01_npc_sarah.ink:106 | `root.ask_kevin[0]` | start > first_checkin > hub 'Tell me about Kevin'. ask_kevin; 2 choices | fresh, reception | 10 | 4.54 (over 4 s) | 200 audio/mpeg |
| sarah_v2_6 | Oh, that was Patricia's office. She was our department manager. | m01_npc_sarah.ink:166 | `root.ask_about_manager[0]` | start > first_checkin > hub 'I noticed the manager's office is vacant?'. ask_about_manager; 2 choices | fresh, reception | 10 | 4.01 (over 4 s) | 200 audio/mpeg |
| sarah_v2_7 | Hi! You must be the IT contractor. I'm Sarah, the receptionist. | m01_npc_sarah.ink:21 | `root.start[4].b` | start (first meeting, no choice). start knot; no choices | fresh, reception | 11 | 4.97 (over 4 s) | 200 audio/mpeg |
| sarah_v2_8 | Here's your visitor badge and a key for the main office area. | m01_npc_sarah.ink:58 | `root.receive_items` | start > first_checkin (either). receive_items; 1 choice | fresh, reception | 12 | 4.58 (over 4 s) | 200 audio/mpeg |

### Derek Lawson (ENDING, reference only)

Voice `Algieba`. Every line is in the finale, so the spoiler rule excludes all of them. Listed because the plan already uses the Entropy line.

| ID | Exact text (ink, speaker removed) | Ink file:line | Knot | Conversation path from start | Cheapest entry state | Words | Spoken (s) | Live |
|---|---|---|---|---|---|---|---|---|
| **derek_v2_1** (top) | Working late on the security audit? | m01_derek_confrontation.ink:39 | `root.start[0]` | finale: entropy_reveal_read set, then start. ENDING: the confrontation. Excluded from the spoiler-free set | needs entropy_reveal_read (head-start --set) | 6 | 3.50 | 200 audio/mpeg |
| **derek_v2_3** (top) | I'm not a villain. I'm a prophet. | m01_derek_confrontation.ink:255 | `root.derek_final_philosophy[0]` | finale: derek_final_philosophy. ENDING | needs entropy_reveal_read | 7 | 4.25 (over 4 s) | 200 audio/mpeg |
| **derek_v2_2** (top) | Entropy is inevitable. Trust is a lie. Security through obscurity fails. | m01_derek_confrontation.ink:234 | `root.architect_reference` | finale: architect_reference. ENDING. The plan already names this line | needs entropy_reveal_read | 11 | 8.78 (over 4 s) | 200 audio/mpeg |
| derek_v2_4 | Murder? No. Think of it as... forced education. | m01_derek_confrontation.ink:170 | `root.evil_monologue_part1[0]` | finale: evil_monologue_part1. ENDING | needs entropy_reveal_read | 8 | 7.10 (over 4 s) | 200 audio/mpeg |

### Narrator

Voice `Algenib` (top-level `narrator` in the scenario, `skipTextValidation`). Only one line is spoiler-free.

| ID | Exact text (ink, speaker removed) | Ink file:line | Knot | Conversation path from start | Cheapest entry state | Words | Spoken (s) | Live |
|---|---|---|---|---|---|---|---|---|
| **narr_v2_1** (top) | Viral Dynamics Media. A weekday morning in the city centre. | m01_opening_briefing.ink:233 | `root.arrival` | end of briefing: start > 'How urgent is this?'... 4 choices to deployment > arrival. narrator voice-over (Algenib), arrival knot | fresh; plays at the end of the briefing | 10 | 5.42 (over 4 s) | 200 audio/mpeg |


### Entry-state notes

- **K1, Kevin's room.** `it_room` is PIN-locked (`lockType: pin`). The reception desk phone carries `puzzle_graph_unlocks: it_room`, and its message gives the PIN (not written here). The expected route is: examine the reception desk phone, cross the main office (Sarah's key), then enter the IT room. Not played in a browser. Test-only head-start: `--start-room it_room`.
- **K2, Kevin's gated lines.** The hub choice "I need to tell you something about Derek" needs `contingency_file_read` (a scenario global, set when the CONTINGENCY file on Derek's computer is read, `scenarios/m01_first_contact/scenario.json.erb:1955`) and an empty `kevin_choice`. The lines sit in `warn_kevin_direct` and `warn_kevin_details`. A test-only head-start should reach them: `--start-room it_room --set contingency_file_read=true`. Expected from the ink, not played.
- **K3, the audit line (kevin_v2_9).** It needs the hub choice "I'd like to give you a preliminary security audit update", which is open after the lockpicks or keycard have been given, then four audit questions. About nine choices in total. Expensive.
- **Maya.** `maya_office` is unlocked. Fresh route: Sarah's key, the main office, then Maya's office. Test-only head-start: `--start-room maya_office`.
- **Sarah.** Start room, so fresh with no head-start. Her lines need 3 choices at most, except sarah_v2_4 (about 5).
- **HaX.** The briefing starts on load in reception. Each listed line needs the choices shown first.
- **Narrator.** The line is in the arrival knot after the briefing. Cheapest path: start, "How urgent is this?", "What's my mission?", "How do I get inside?", "I'm ready to go", then deployment and arrival. Four choices.
- **Derek.** The finale gate is `entropy_reveal_read` (scout 1's head-start: `--start-room break_room --set entropy_reveal_read=true`). Not played.

### Notes on the picks

- The teaser's HaX line, "Whatever they're planning, it's active. And it's dangerous." (`docs/video/edits/M01_TEASER_SELECTS.md`), is left out of the new picks. Scout 1's hax_2 and hax_3 come back as hax_v2_3 and hax_v2_2, tested again here.
- Kevin's three top picks are one ungated line (kevin_v2_1), one gated line with the strongest hook (kevin_v2_7) and one short intimate line (kevin_v2_2). The gated line costs a long walk, so it is the first to swap out if the takes run short.
- Maya's top three are a menace line (maya_v2_1), a stakes line (maya_v2_2) and a short ticking clock (maya_v2_4). Her Operation Shatter and Sunday-launch lines are good alternates, but they run past 4 s.
- Sarah is thin: her short lines carry little tension, and her hooks lean on pronouns (he, her, him), so they need the conversation before them.
- Derek's lines are all finale. The plan already uses the Entropy line (derek_v2_2, 8.78 s). The shorter Derek lines are a separate decision for the user, because they sit in the confrontation that ends the mission.
- The desk-phone voicemails are one long message each. Reception's (27.7 s, 84 words) gives the IT room PIN, so its subtitle must stay off screen. Patricia's desk-phone message (17.0 s, 43 words) is Maya's voicemail.


## Part B: set pieces and minigames

The recorded set pieces are not repeated: title screen, HaX briefing, lights-on walk, the briefcase lockpicking, phone chat, the IT door keypad, the IT monitoring station log, the server room and drop-site flag terminal, and Derek's finale.

"Answer on screen" means a value that solves the puzzle is visible without solving it. Codes, PINs and logins are not copied into this report, so a yes means the screen shows one.

### m01 minigame inventory

| Minigame or viewer | Where (object ids) | Notes |
|---|---|---|
| lockpicking | `patricia_briefcase` (suitcase, key lock, medium) | Recorded |
| pin (keypad) | `it_room` (room lock), `derek_personal_safe`, `derek_cabinet`, `derek_storage_safe`, `main_office_area_safe_0` | Five keypads in all. The IT room door is recorded |
| password | `derek_computer`, `kevin_office_pc_0` | Both show a post-it on screen |
| pc (desktop) | `it_room_pc_0` (recorded), `derek_computer`, `kevin_office_pc_0` | |
| rfid (keycard reader) | `server_room` door (room lock, keycard) | |
| flag lock and flag station | `entropy_encrypted_archive` (flag lock), `flag_station_dropsite` (recorded) | The archive needs a VM flag |
| vm-launcher | `vm_launcher_intro_linux` (server room) | Needs a SecGen VM. None in this container |
| phone-chat and phone objects | `agent_0x99` (phone NPC), `reception_desk_phone`, `patricia_desk_phone` | The two desk phones play voicemails |
| person-chat | Sarah, Kevin, Maya, Derek (dialogue) | |
| document viewers | notes, notes2, notes4, notes5 and text files, about 30 readable documents | |
| container | three bins | |
| CyberChef workstation | `cyberchef_workstation` (inventory item from `patricia_briefcase`) | An overlay holding the real CyberChef v10.19.4, not a registered minigame |
| examine | two chalkboards, one bookcase (`main_office_area`) | No text |

### Set pieces not on the recorded list

| # | Set piece | Room and object id | Entry state | Answer on screen? | Visual judgement |
|---|---|---|---|---|---|
| 1 | **CyberChef workstation** (a real recipe UI in an overlay) | `manager_office`, `patricia_briefcase` > `cyberchef_workstation` | Speed-run. Kevin's lockpick kit comes from his dialogue, then the recorded briefcase. `--give` cannot supply the kit, so no head-start skips it. | No. The briefcase notes give worked base64 examples, which are examples and not the answer. | **Top 1.** The most recognisable tool on screen. It is a third-party tool, so check the licence before use. |
| 2 | **Derek's Computer** (password screen in the lit office) | `derek_office` (lit "on"), `derek_computer` (pc, password lock) | Derek's office key is in Patricia's briefcase, so the lockpicks come first, then the locked office. Test-only head-start: `--start-room derek_office`. | **Yes.** A post-it on the screen carries a login. Crop or blur it. | **Top 2.** The brightest desk in the mission. The monitor is the light source, and the report on screen is mid-game evidence with no ending. |
| 3 | **Kevin's Workstation** (password screen) | `kevin_office` (unlocked, motion-lit), `kevin_office_pc_0` (pc, password lock, keyboard shown) | Fresh: Sarah's key opens the main office, then Kevin's office, which is unlocked. Test-only head-start: `--start-room kevin_office`. | **Yes.** A post-it on the screen carries a login. Crop it. The log on screen names Derek, so check the frame. | **Top 3.** A dark motion-lit office with one desk monitor. The screen is the only light. |
| 4 | Main Filing Cabinet keypad | `main_office_area`, `main_office_area_safe_0` (pin) | Fresh: Sarah's key opens the main office. Test-only head-start: `--start-room main_office_area`. | No. The keypad shows nothing, and the contents are office clutter and a business outline. | Answer-free close-up in an open-plan room with two chalkboards (no text). The fallback if Kevin's screen cannot be cropped. |
| 5 | Derek's personal safe and filing cabinet (pin keypads) | `derek_office`, `derek_personal_safe`, `derek_cabinet` | As 2. | No on the keypad. The contents are spoilers: the Architect's letter quotes the Entropy line, and the cabinet holds casualty projections, so keep them off screen. | Keypads are fine as close-ups. Do not show the contents. |
| 6 | ENTROPY Encrypted Archive (drive case, flag lock) | `server_room`, `entropy_encrypted_archive` (lockType flag, requires `shatter_server:flag_1`) | Needs a VM flag. No VM here. Test-only: `--start-room server_room --submit-flag vm:flag_1` (not tested). | No on the lock. The three documents it opens carry the operation's plan and target data, so keep them off screen. | Strong: a drive case in the dark motion-lit server room. Blocked here without the flag head-start. |
| 7 | Server room card reader (rfid) | `server_room` door (room lock `rfid`, card `server_keycard`) | Kevin's keycard, from his `get_keycard` knot or "I'll take all of it". Then the door. | No. | Medium. A clean card tap at a dark door. The recorded server-room shots may not show the scan (check). |
| 8 | Maya's notes: "SAFETYNET Contact" and "Disinformation Research" | `maya_office`, `maya_office_notes2_1`, `maya_office_notes2_0` (notes2) | Fresh, through Sarah's key and the main office. Test-only: `--start-room maya_office`. | No. The tip names Operation Shatter, which is not a spoiler, and has no code. | The "notes or evidence view" candidate. Document-led and medium-strength. |
| 9 | Patricia's desk phone (blinking light) | `manager_office`, `patricia_desk_phone` (phone) | Fresh. The manager's office is motion-lit and unlocked. | The subtitle shows the message. | The blinking light is the shot. The message is 17.0 s and too long to cut in. |
| 10 | Reception desk phone | `reception_area`, `reception_desk_phone` (phone) | Fresh, start room. | **Yes.** The 27.7 s message includes the IT room PIN. Keep its subtitle off screen. | Low for the trailer. Too long, and it leaks the PIN. |
| 11 | IT Audit Station (Kali) | `server_room`, `vm_launcher_intro_linux` (vm-launcher) | Needs a SecGen VM. None here. | A post-it shows a generic lab login. Not copied. | Strong terminal look, but it cannot run in this container. |
| 12 | Inserts and props | `manager_office_notes_2` (Termination Letter), `reception_area_notes_2` (visitor sign-in log), `main_office_area_chalkboard_1` and `_2` (no text), bins `break_room_bin_2`, `conference_room_bin_1`, `main_office_area_bin_4` | Fresh. | No. | Low. Use as inserts only. |

### Rooms with several NPCs visible together

**None.** Each room has at most one NPC on the map:

| Room | Visible person | Position (tile x, y) |
|---|---|---|
| `reception_area` (start room) | Sarah O'Brien (`sarah_martinez`) | 4, 2.25 |
| `it_room` | Kevin Park (`kevin_park`) | 5.2, 5.1 |
| `break_room` | Derek Lawson (`derek_lawson`) | 5, 4 |
| `maya_office` | Maya Chen (`maya_chen`) | 2, 4 |

Agent HaX (`briefing_cutscene`) and the closing-debrief person both sit at (500, 500), far outside the room, so they appear only as dialogue portraits. The phone NPC has no sprite. Walking shots therefore need one NPC plus the player. The montage can cross rooms, as in the plan.

### Top 3 set pieces

1. **CyberChef workstation.** It is the most recognisable and answer-free image, and it is the one piece the plan asked for by name. The route needs the lockpick kit first.
2. **Derek's Computer.** The best light in the mission, in a lit office. Crop the post-it, and keep the report's text out of frame.
3. **Kevin's Workstation.** A dark motion-lit office with a single screen. The same post-it caveat applies.

The Main Filing Cabinet keypad (4) is the answer-free fallback if the post-its cannot be cropped.

## What was not verified

- Nothing was played in a browser. Entry states come from the ink and the scenario data, and the head-start flags are expected to work but are not tested (the `--set contingency_file_read` route, the `--submit-flag vm:flag_1` route, and `--start-room` for each room).
- The spoiler judgement is the scout's. The orchestrator and the user should confirm the top picks and the Derek exclusions.
- Durations are ffprobe values on the clips the endpoint returned. The takes will hear the same audio, because the clips are cached.

## Cleanup and restart

- The Rails server on :3001 and the Postgres 16 cluster were both started by this scout and both were down when it began. They are stopped at the end of the scout, as the brief asks for processes the scout started. Game 48 stays in the database (a fresh m01 game), and its flags XML in `tools/playtest/` is gitignored.
- To restart for the takes: `pg_ctlcluster 16 main start`, then from `/home/user/BreakEscape` with `LANG=C.UTF-8 LC_ALL=C.UTF-8 BUNDLE_FORCE_RUBY_PLATFORM=true BE_DB_USER=root`, run `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3001 bin/rails server -b 127.0.0.1 -p 3001`. The server log for this scout is in `scratchpad/video-scout2/server-3001.log`.
- No repo file was changed other than this report.
