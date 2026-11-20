# m05 Insider Trading: pre-voicing pass (2026-10-18)

Brief: the pre-voicing pass for m04–m08 (user, 2026-10-18: "You can make edits. Let's make sure it's great before we voice."). No audio was generated. m05 has never been voiced on gemini-3.8-flash-tts; `tts_cache/m05_insider_trading/` holds 8 old 2.5 clips with no sidecars.

Scope: every line the TTS extractor (`TtsLineExtractor`) lists for m05, which is 595 lines over the narrator, HaX (briefing and debrief), Netherton, Nightshade, Lisa, Owen, Halloran, Patricia (in person) and Torres. Phone chats (HaX's phone, Patricia's phone, the Recruiter) aren't voiced. I read them for writing but didn't change them.

## Spoken lines changed

| file:line | before | after | why |
|---|---|---|---|
| ink/m05_insider_trading_opening.ink:90 (HaX) | …The system that routes 999 calls. | …The system that routes nine-nine-nine calls. | TTS can read "999" as "nine hundred and ninety-nine". Matches the Recruiter's "Nine-nine-nine" (m05_phone_recruiter.ink:131). |
| ink/m05_npc_dr_halloran.ink:96 (Halloran) | …The system that routes 999 calls. | …The system that routes nine-nine-nine calls. | Same. |
| ink/m05_torres_confrontation.ink:78, :84 (narrator) | 20:14. The data centre. The racks roar. | Eight-fourteen. The data centre. The racks roar. | "Twenty fourteen" said aloud sounds like a year. Spelt out as spoken. |
| ink/m05_torres_confrontation.ink:81 (narrator) | 20:02. The data centre. The racks roar. | Eight-oh-two. The data centre. The racks roar. | Same. |
| ink/m05_closing_debrief.ink:322 (HaX) | Patricia Morgan spent the night in A&E. … | Patricia Morgan spent the night in hospital. … | Avoids "&" being read literally. Nothing is lost. |
| ink/m05_closing_debrief.ink:595 (HaX) | Then backing off was right. It cost us him, and I'd still rather have you back. | Then backing off was right. It cost us whatever he knew, and I'd still rather have you back. | "It cost us him" is awkward aloud, and he's in custody, so it isn't quite true. What was lost is his intelligence, which the next line says (no deal). |
| ink/m05_npc_lisa_park.ink:91 (Lisa) | He'd hate that I told you even that much. He hates a fuss. | He'd hate that I told you even that much. He can't stand a fuss. | "Hate… hates" twice in one line. |
| ink/m05_npc_lisa_park.ink:173–174 (Lisa) | "I didn't tell you that. You didn't get it from me." then "Yes. It's David. His wife's called Elena." | The same two lines, swapped: the confirmation first, then "I didn't tell you that…" | She denied telling you before she'd told you. Same words, so no extra clips. |
| ink/m05_npc_owen_gallagher.ink:68 (narrator) | …a staff badge on a lanyard round his neck. He swivels round. | …a staff badge on a lanyard round his neck. He swivels to face you. | "Round… round" in one line. The 2026-10-17 sprite match (beard, lanyard) is kept. |
| ink/m05_npc_owen_gallagher.ink:176 (Owen) | One for every office. Whose? Doesn't matter, actually. A spare means going through someone's desk, and that's not my call. | One for every office. Don't tell me whose. A spare means going through someone's desk, and that's not my call. | He asked a question and then waved it off, which sounded muddled. Now he stays out of it, which sets up the next line (tell Patricia who and why). |
| ink/m05_npc_patricia_morgan.ink:157 (Patricia) | …Read it before you go. Your who starts there. | …Read it before you go. The who starts in there. | "Your who" sounds like a slip when spoken. Keeps her who/why set-up for "bring me the why and the proof". |
| ink/m05_npc_patricia_morgan.ink:421 (Patricia) | David. Slowly, I'm writing this down. Why? | David. Go slowly. I'm writing this down. Why? | "Slowly," read as an adverb on "writing". She means "say it slowly". |

Route assertions updated for the reworded text (behaviour unchanged): r2, r10, r15, r16, r18, r23, r41 in `scripts/ink_runtime_check/m05_routes/`.

## Checked and left alone

- **Printed variables:** none in any voiced line. `player_name` is declared in several files but never printed in a voiced line.
- **"Agent 0x00." (Netherton, opening:34) and "HaX -- the detail." (opening:66):** m03's voiced briefing uses the same spelling and the same "--" (m03_opening_briefing.ink:37, :71), so both stay.
- **Digits that read cleanly:** "99 per cent", "Stage 3", "2030s", "USB", "VPN", "VLANs". Each is unambiguous aloud.
- **No voiced line is over 30 words.** The longest are the m04 carry-over lines (28 and 29) and two debrief lines (30). dialoguelint reports no line-len or text-len findings.
- **Carry-over lines (opening:43–51):** both new branches name what the player did in m04, as the 2026-10-17 storytelling rule asks. "Every cell we've hit bought something. This time, a person." still sets up the "Bought with what?" choice. The never-played branch stays word for word, per that rule.
- **The 2026-10-17 rewrites:** Lisa's vaguer tin story (torres_sympathy) names nobody and reads well. I fixed one line. Patricia's in-person naming (name_torres, torres_why, case_why, case_proof) is tight; I fixed the "Slowly" line. Owen's spare-cards topic is fixed above, and his narration matches the sprite. HaX's nudge rungs (m05_phone_agent_0x99.ink:1059–1121) are phone text, so they aren't voiced. The order still holds back "One file fits", and nothing needed changing.

## Voice config

Every voiced speaker has a voice block (name, style, language). No changes.

| speaker | voice | check |
|---|---|---|
| narrator | Algenib, "Cinematic noir detective voice over narrator." | Same wording as voiced m01 and m03. |
| Netherton | Charon, RP, low, deliberate | Matches the voice bible (late 50s). |
| Nightshade | Enceladus, RP, calm, precise | OK. |
| Lisa Park | Laomedeia, British-Korean, New Malden, south-west London | Matches CAST_PROPOSALS M05-3. |
| Owen Gallagher | Puck, late twenties, Manchester accent | The cast change (mixed-race Black British, from Manchester, CAST_PROPOSALS M05-4) doesn't change the accent. The style already says Manchester and late twenties, and the narration's beard matches. I didn't add an ethnicity label, because the TTS needs the accent, and a label could pull it towards a different accent. |
| Dr Ruth Halloran | Erinome, mid-forties, educated Dublin | Matches M05-5. |
| Patricia Morgan | Kore, early fifties, ex-military, Cardiff | Matches M05-6. The phone twin has the same voice plus "On the phone." |
| David Torres | Schedar, late forties, born in Madrid, twenty years in England, light Castilian accent in fluent British English | Matches M05-2 word for word. |
| The Recruiter (phone, not voiced) | Gacrux, en-US, Washington DC / Mid-Atlantic | Matches M05-1. |

## HaX's style: apply at voicing time (tts-audio rule 3)

Not changed in the erb now. Two voices still have the old wording. The debrief (`closing_debrief_trigger`, erb:1544) has its own scene mood ("Unhurried; the night is over…") and stays as it is.

**`opening_briefing` (scenario.json.erb:806)**

Before:
> Intelligence handler giving a mission briefing. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with a sense of urgency, as if time is short.

After:
> Intelligence handler giving a mission briefing. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. A seasoned professional who has done this a hundred times. Quick, clipped and businesslike because time is short, yet completely unflustered; the urgency is in the pace, never in the voice.

**`agent_0x99_handler` (phone, scenario.json.erb:871)**

Before:
> Intelligence handler speaking over a secure phone line. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with urgency, as if time is short.

After:
> Intelligence handler speaking over a secure phone line. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. A seasoned professional who has done this a hundred times. Quick, clipped and businesslike because time is short, yet completely unflustered; the urgency is in the pace, never in the voice.

Both use the same wording as m02's voiced styles (m02 erb:621, :714). The phone voice has 0 voiced lines today, so changing it costs nothing either way.

## The ten weakest spoken lines

1. Patricia, "Your who starts there." Fixed (above).
2. Patricia, "David. Slowly, I'm writing this down. Why?" Fixed.
3. Owen, "Whose? Doesn't matter, actually." Fixed.
4. HaX debrief, "It cost us him…" Fixed.
5. Lisa, the denial before the confirmation (confirm_david). Fixed by the swap.
6. Lisa, "He hates a fuss" after "He'd hate". Fixed.
7. Owen's narration, "round… round". Fixed.
8. Netherton carry-over, "Every cell we've hit bought something. This time, a person." Kept. It's terse but in his voice and sets up the next choice, and the never-played branch it mirrors is frozen.
9. Patricia, "My log of what's been flagged is on the desk, by your hand." Kept. It's a bit stiff, but it was added for blind run B (players left the log behind), and the placement cue matters.
10. Owen, "Mind, a spare only tells you which card. The front door's on there too…" Kept. It's on the nose, but it's the deliberate clue rung from the 2026-10-17 fixes, and softening it would undo a playtest fix.

## Expected voiced lines

`bin/rails "app:break_escape:tts:wasted[m05_insider_trading]"`: **595 lines expected**, 0 current-model clips, 8 old MP3s without sidecars. The count is the same before and after this pass, because every edit replaces a line with one line.

## Checks run (static, no browser)

- Ink compile (`scripts/compile-ink.sh m05_insider_trading`): 10 files, 0 failed.
- `ruby scripts/validate_scenario.rb … --no-graph`: 0 errors. The warnings are the existing eventMapping/onceOnly and timed-text ones.
- dialoguelint: no line-len or text-len findings. The only findings are a you-after-choice CHECK and a not-x-but-y WARN in m05_phone_recruiter.ink, which is a phone file and unchanged.
- tagdiff `--old` against the pre-edit snapshot, for all seven edited files: STRUCTURE UNCHANGED.
- loopcheck on all seven edited files: no runtime errors.
- reopencheck (all missions): 0 problems.
- m05 route driver: all 47 routes pass.

## For the user

- Nothing needs a decision before voicing. At voicing time, apply the two HaX styles above in the same commit as the clips (rule 5).
- Optional: the narrator style has no accent line (unlike m07/m08's "Consistent British Received Pronunciation…"). It matches voiced m01 and m03, so I left it alone.
