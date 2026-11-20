# m04 Critical Failure: pre-voicing pass (2026-10-18)

The last read of m04 before it is voiced on `gemini-3.8-flash-tts`. No audio was generated. Brief: `docs/agents/PASS4_BRIEF.md`, the tts-audio skill (standing rules 2 and 3) and the 2026-10-18 entry in `docs/agents/RESOLVED_DECISIONS.md`.

## Printed variables (rule 2)

None in any voiced line. The briefing, debrief, guard, Vance and Voltage stories (and both phone stories) declare `EXTERNAL player_name()`, but no line calls it or prints a `{var}`. Every `{...}` in a spoken line is an inline conditional or a `{&a|b|c}` sequence between fixed strings, which rule 2 allows. HaX's debrief opener is already the fixed "Agent, report." The declarations are harmless and were left alone.

## Spoken lines changed

14 edits, 15 voiced lines (the narrator edit covers two variants).

| File:line | Before | After | Why |
|---|---|---|---|
| m04_opening_briefing.ink:151 | Their traffic puts it at 0800 local. | Their traffic puts it at eight in the morning, local time. | "0800" reads aloud as "zero eight hundred", "oh-eight-hundred" or "eight hundred". |
| m04_opening_briefing.ink:252 | …Strikes across the region, all timed to 0800. | …Strikes across the region, all timed for eight o'clock. | Same, and it now matches Voltage's "not eight o'clock". |
| m04_closing_debrief.ink:159 | And the gate guard's in A&E with a sore head… | And the gate guard's in hospital with a sore head… | The ampersand might be read out as a symbol. |
| m04_npc_voltage.ink:241 | …the dialysis unit at St Aldate's… | …the dialysis unit at Saint Aldate's… | "St" can be read as "Street". |
| m04_npc_voltage.ink:293 | The laptop is open on the plant-room bench with the trigger armed on screen, and the red mushroom head of the hardwired shutdown is on the wall behind him. You cannot reach both. (33 words) | The laptop's open on the bench, the trigger armed on screen. Behind him, on the wall, is the red mushroom head of the hardwired shutdown. You cannot reach both. (29) | Over the 30-word cap; one long breath. |
| m04_npc_voltage.ink:295 | (the same line without "You cannot reach both.") | (the same new line without it) | Its other variant. |
| m04_npc_voltage.ink:348 | You've picked the slow option. | Then you'll have to be faster than one keystroke. | Weak line (list item 1). |
| m04_npc_security_guard.ink:164 | I'll need to see some ID before you go any further. | Go on, then. Let's have a proper look at it. | Weak line (item 2): the player has just said "Here's my ID." |
| m04_npc_security_guard.ink:145 | Testing my protocols. | Testing my protocols. At four in the morning. | Weak line (item 3). |
| m04_npc_robert_vance.ink:648 | Alright. You know where I am if you need me. | Alright. If you say so. | Weak line (item 4). The next line, every time, is "Anything else, I'm at the ops desk." |
| m04_npc_robert_vance.ink:86 | Right. I run a tight ship here, budget and all. | Right. I run a tight ship here, on a tighter budget. | Weak line (item 5). |
| m04_npc_robert_vance.ink:185 | Which is why an audit at this hour is... hard going. We do what we can… | Which is why an audit at this hour is the last thing I need. We do what we can… | Weak line (item 6). |
| m04_npc_robert_vance.ink:207 | Staff records, maintenance logs, whatever you need off this desk. | Staff records, maintenance logs, anything off this desk. | It followed "Alright. What do you need?", so "need" was said twice. |
| m04_npc_robert_vance.ink:612 | Come back to the ops desk when you need it, and I'm on comms while you move. | Come back to the ops desk when you need me. I'm on comms while you move. | Two clauses that didn't join. |

No choice text, knot, tag, global or condition changed.

## Voice config changes

| NPC | Before | After |
|---|---|---|
| `agent_nightshade` (erb:648) | SAFETYNET's **technical analyst**. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Calm, precise, technically fluent; a colleague you trust. | SAFETYNET's **cryptographic-hardware analyst**. (the rest unchanged) |

Why: the voice bible adopts m02's job title and says the m03–m06 styles "could be aligned to m02's identity text when their audio is regenerated". m04 has no current-model clips, so the change is free. It affects his two briefing lines. m03, which is already voiced, still says "technical analyst" and was left alone.

Every other voiced speaker was checked against the portraits (the m04 cast has its own art; `CAST_PROPOSALS.md` leaves it out of scope), `PASS3_VOICE_AUDIT.md`, the voice bible and the ink. No change was needed:

- **Gender and age match the art:** guard (grey beard, mid-fifties), Vance (greying, glasses, mid-fifties), Cipher (young man), Relay (woman, late thirties), Voltage (man, mid-forties), Static (shaved head, early thirties).
- **Each accent matches the ink:** the guard's "my lover" (Bristol), Vance's "Aye" (Teesside), Cipher's "Verdomme" (Dutch), Relay's "Keep the heid" (Edinburgh), Voltage's "Ja" (Johannesburg).
- **No two speakers share a Gemini voice:** Aoede, Charon, Enceladus, Schedar, Orus, Fenrir, Pulcherrima, Alnilam, Umbriel, and Algenib for the narrator.
- **Netherton and the narrator** match the voice bible and the voiced m03.

## HaX's style: apply when m04 is voiced (rule 3)

Not changed in the erb now. Change these two in the same commit as the new clips.

**`opening_briefing_cutscene` (erb:591), which voices about 75 lines**

Before:
> Intelligence handler giving a mission briefing. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with a sense of urgency, as if time is short.

After:
> Intelligence handler giving a mission briefing. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. A seasoned professional who has done this a hundred times. Quick, clipped and businesslike because time is short, yet completely unflustered; the urgency is in the pace, never in the voice.

**`agent_0x99` (erb:732), the phone. Phone chats aren't voiced, so this costs nothing; changing it keeps m04 in line with m01–m03**

Before:
> Intelligence handler speaking over a secure phone line. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with urgency, as if time is short.

After:
> Intelligence handler speaking over a secure phone line. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. A seasoned professional who has done this a hundred times. Quick, clipped and businesslike because time is short, yet completely unflustered; the urgency is in the pace, never in the voice.

**`agent_0x99_debrief` (erb:1513): leave it.** It has a scene mood ("Unhurried — the emergency is over and she is choosing her words carefully."), which rule 3 says to keep, and it has no "speak quickly" wording.

## The ten weakest spoken lines

| # | Line | Action |
|---|---|---|
| 1 | Voltage, after "I'm taking you down. Now.": "You've picked the slow option." | Rewritten: "Then you'll have to be faster than one keystroke." It's his clock-and-keystroke threat, and says what "slow" meant. |
| 2 | Guard, after "Forget it. Here's my ID.": "I'll need to see some ID before you go any further." | Rewritten: he asked for what he had just been handed. |
| 3 | Guard: "Testing my protocols." | A flat echo. Added "At four in the morning." to give it his grumpy suspicion before he's talked round. |
| 4 | Vance: "Alright. You know where I am if you need me." | Rewritten. The very next line said the same thing. |
| 5 | Vance: "Right. I run a tight ship here, budget and all." | "budget and all" didn't mean anything. Rewritten. |
| 6 | Vance: "Which is why an audit at this hour is... hard going." | A limp phrase after a dramatic pause. Rewritten. |
| 7 | HaX, after "Right. What else should I know?": "Ask. Quickly." | Kept. It reads as "pick a topic" and suits her clipped voice. |
| 8 | HaX: "Good luck. Find Vance first." (the fourth "find Vance" in the briefing) | Kept. It's the last instruction before play, and the repetition is deliberate. |
| 9 | Cipher: "Wrong night to come looking." | Kept. A stock line, but it's a one-off fight bark and it fits his bluster. |
| 10 | HaX: "How do we handle this publicly?" | Kept. Plain, and it sets up the disclosure choice clearly. |

I also checked the carry-over lines added on 2026-10-17 (the four Victoria Sterling lines in the briefing, the four Danny Foster lines in the debrief). Each names what the player did, stays under 25 words and needed no change.

## Checks

- Ink compiled with `bin/inklecate`, all five changed stories.
- `tagdiff` against HEAD: **STRUCTURE UNCHANGED (10 files)**, prose only.
- `loopcheck` on the five changed stories: no runtime errors.
- `reopencheck`: 0 problems (m04 phones included).
- `dialoguelint`: no line-len or text-len findings. The person-chat maximum is 30 words. The two blank-reentry notes (cipher_gone, voltage_escape_success) were there before and are deliberate: both are resting knots for an NPC who has left.
- `ruby scripts/validate_scenario.rb`: 0 errors. Schema passes, warnings unchanged, dungeon graph unchanged.
- Route driver: **40 of 40 routes pass**, before and after. None asserted a reworded line.

## Expected voiced lines

`bin/rails "app:break_escape:tts:wasted[m04_critical_failure]"`: **423 lines expected**, 0 current-model clips.

## For the user to decide

1. **Vance's 26 debrief lines will be silent.** The disclosure reactions and his last words ("I don't know what you are. I know what you did." and the rest) are spoken in HaX's debrief story under `#speaker:robert_vance`. Vance has his own `storyPath`, so the TTS endpoint checks each line against `m04_npc_robert_vance.json`, doesn't find it, and refuses it (`games_controller.rb` around :589–611; `TtsLineExtractor#refused_by_endpoint?` skips them, which is why they aren't in the 423). There are two ways to fix it:
   - **Engine:** let a co-speaker's line through when it is in any of the scenario's ink stories. The endpoint already does this for NPCs that have no `storyPath`, at :611. This likely affects other missions' debriefs too.
   - **Mission:** add a hidden, storyless `robert_vance_debrief` NPC with Orus's voice and retag the debrief's Vance lines. That changes tags, so it's outside this pass.

   Either way, settle it before voicing, or Vance goes quiet at the emotional end of the mission.
2. **The brief's known item didn't hold for m04.** It said five voiced lines print `{player_name}`, but the five stories only declare `EXTERNAL player_name()`. Nothing to fix.
