# m06 Follow the Money: pre-voicing pass (2026-10-18)

Brief: the session's `prevoice_brief.md` (pre-voicing pass, m04–m08). No audio was generated. m06 has no current-model clips, so nothing is orphaned by these edits.

**Expected voiced lines: 523** (`bin/rails "app:break_escape:tts:wasted[m06_follow_the_money]"`: "0 of 0 current-model clips are not requested (523 lines expected)"). By speaker (extractor dump): HaX briefing 28, HaX debrief 115, Netherton 1, Nightshade 1, narrator 37, guard 19, Irina 81, Dani 47, Priya 77, Kemal 28, Satoshi 89. The phone hub (`m06_phone_agent_0x99.ink`) is a phone chat and isn't voiced, so it wasn't edited.

## 1. Printed variables in voiced lines

None. The extractor reports no notes and no variable lines. `player_name` is declared in five inks but never printed in a voiced line. The handler and Netherton say "Agent 0x00" as fixed text, the same way as the voiced m02/m03 briefings.

## 2. Spoken lines changed

19 lines. `tagdiff --old` against HEAD reports **STRUCTURE UNCHANGED** for all seven files touched. Prefixes, choices, knots, tags and globals are untouched.

| file:line | before | after | why |
|---|---|---|---|
| m06_opening_briefing.ink:44 | You turned Torres, so he's still taking their money, on our script now. That's how we traced the one going out. | You turned Torres. He's still taking their money, but on our script now. That's how we traced the one going out. | Carry-over line. Two commas in a row made a stumble aloud; it now breaks into separate breaths. |
| m06_opening_briefing.ink:48 | You handed Torres to the police after he talked, for Elena's treatment. He knew who paid him. … | You promised Torres we'd pay for Elena's treatment, and he talked before the police took him. He knew who paid him. … | Carry-over line. "Handed to the police … for Elena's treatment" read as if the arrest was for the treatment. Now it names what the player did in m05 (the "we pay for Elena" offer, m05_torres_confrontation.ink:333). |
| m06_opening_briefing.ink:86 | The CEO calls himself "Satoshi Nakamoto II". | The CEO calls himself "Satoshi Nakamoto the Second". | TTS may read "II" as "two" or "eye eye". |
| m06_closing_debrief.ink:204 | Log it honestly, though. We lost an asset. Write that. | Log it honestly, though. We lost an asset, and the file says so. | "Log it" followed by "Write that" said the same thing twice. |
| m06_closing_debrief.ink:225 | Pool keys and the wallet map before midnight, and the account that paid her. | She's promised the pool keys and the wallet map by tonight, and the account that paid her. | The debrief is at 4 a.m. (debrief_location), so "before midnight" was wrong. Now matches Irina's "go to your handler tonight". |
| m06_closing_debrief.ink:293 | Reading her notes first was good work. Know what they've already told themselves. | Reading her notes first was good work. You knew what she'd told herself before you said a word. | The second sentence was a cryptic maxim aloud. Now it's about Irina. |
| m06_closing_debrief.ink:308 | We detained "Satoshi Nakamoto II" in his own office. The police have him, … | We detained "Satoshi Nakamoto the Second" in his own office. The police have him, … | "II" read aloud. |
| m06_closing_debrief.ink:310 | We detained "Satoshi Nakamoto II" in his own office and handed him to the police. | We detained "Satoshi Nakamoto the Second" in his own office and handed him to the police. | "II" read aloud. |
| m06_closing_debrief.ink:504 | That's evidence the police can use. Several cells will face financial charges. | That's evidence the police can use. People in several cells will face charges over the money. | People face charges, not cells, and "financial charges" was vague. |
| m06_closing_debrief.ink:509 | You've the fund allocation. … | You've got the fund allocation. … | "You've the" sounds stilted aloud. |
| m06_npc_checkpoint_guard.ink:63 | IT come in through the back with a ticket number. You're not on my list. | Tech support come in through the back with a ticket number. You're not on my list. | TTS can read "IT come in" as the word "it". The choice label "[IT. …]" isn't voiced and stays as it is. |
| m06_npc_irina_volkova.ink:118 | You must be the FCA. Dr. Irina Volkova, Chief Technology Officer. | You must be the FCA. Dr Irina Volkova, Chief Technology Officer. | UK style, matching the briefing's "Dr Irina Volkova". The prefix `Dr. Irina Volkova:` is the displayName and stays. |
| m06_npc_irina_volkova.ink:332 | …I handed it over, they'll write a memo about it. | …I handed it over; they'll write a memo about it. | Comma splice. Punctuation only, so the normalised cache key is the same. |
| m06_npc_trader.ink:57 | Joking. It's all above board. Irina makes sure. Honestly. Ignore me. | Joking. It's all above board. Irina makes sure. Ignore me. | Dani says "Honestly" at :49 two lines earlier on the same first meeting, and again at :106 and in the "Honestly?" line. |
| m06_npc_trader.ink:174 | Depends on your perspective. | Depends who's asking. | Flat stock reply to "Is that suspicious?". Now it's nervy, and aimed at the regulator in front of him. |
| m06_npc_analyst.ink:106 | Yeah. Very. | Yeah. I've stopped pretending it isn't. | Reply to "That sounds suspicious." It was a shrug; now it shows that she's worried. |
| m06_npc_analyst.ink:182 | Pretty much. | Every hop of it. | Reply to a choice that restates her own line. Now she adds something, which leads into "With our logs you can unmix anything". |
| m06_satoshi_confrontation.ink:62 (narrator) | A man in his early forties leans against the front of an executive desk. The Bitcoin whitepaper is framed on the wall behind him, at exactly the height of his own head. (32 words) | A man in his early forties leans on the front of an executive desk. The Bitcoin whitepaper hangs framed behind him, level with his own head. (26 words) | The only voiced line over the 30-word cap. The joke is kept. |
| m06_satoshi_confrontation.ink:118 | "Nakamoto II" is for the brochure. The Ghost is who pays for things. | "Nakamoto the Second" is for the brochure. The Ghost is who pays for things. | "II" read aloud. Matches the briefing and debrief. |

Left as written after reading aloud:
- "$2.4 million", "$847,000" and "$12.8 million" read cleanly.
- "R&D" and "A&E" are said as letters.
- "EM4100" (narrator) is a card standard, said as letters and a number.
- "nobody's-- did you--" is Dani breaking off, which is intended.
- "6120" and "2140" (Irina) stay as digits because the player types them. "2140" is followed by "The year the last bitcoin is mined", which points the TTS to "twenty-one forty". Listen for it at voicing time (see section 6).

## 3. Voice config: checked, no changes

| Speaker | Voice | Checked against | Result |
|---|---|---|---|
| Dani Okonkwo (`trader_npc`) | Puck | CAST_PROPOSALS M06-4 (young man, about 23, British-Nigerian, Peckham), the user's 2026-10-16 call | Style already says "Young man … early twenties, British-Nigerian … Peckham". The ink uses "he"/"his" (trader.ink:192 is about Satoshi; :10 comment "his"). Matches. |
| Kemal Aydin (`satoshi_minder`) | Iapetus | M06-1 (Turkish-German, about 58, Hamburg, 30 years a vault security chief) | Style says "Turkish-German … late fifties … German accent (Hamburg) … thirty years of guarding other people's money". The ink's "Moin" and "Na gut" fit a Hamburg accent; the narrator says "late fifties". Matches. |
| Irina Volkova | Kore | M06-3, PASS3 audit (d) | Russian, mid-thirties, pitch given. The narrator says "mid-thirties". Matches. |
| Priya Raghavan | Leda | M06-5 | British-Indian, Leeds, mid-thirties. Her "nowt", "me", "Ta" fit. Matches. |
| Satoshi Nakamoto II | Umbriel | M06-6, audit (Charon clash fixed) | West Coast, early forties. The narrator says "early forties". Matches. |
| Checkpoint guard | Alnilam | M06-2 (British-Colombian, born in South London, about 45) | "forties … South London". Matches. Ethnicity isn't needed in the style. |
| Netherton, Nightshade, narrator | Charon, Enceladus, Algenib | m03/m04/m05 wording | Same as the voiced m03. |

No two characters share a voice name, except HaX's three contexts.

## 4. HaX's style: apply at voicing time (rule 3), not now

m06's HaX styles don't contain the exact old "speak quickly with urgency" wording, but they are variants of it ("brisk and purposeful", "under time pressure"). None of them is a scene mood named in rule 3. Apply these in `scenario.json.erb` in the same commit as the m06 clips.

**Briefing** (`opening_briefing_npc`, erb :804)
- Before: `Professional intelligence handler delivering a mission briefing. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Steady, mid-range pitch, brisk and purposeful.`
- After: `Professional intelligence handler delivering a mission briefing. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. A seasoned professional who has done this a hundred times. Quick, clipped and businesslike because time is short, yet completely unflustered; the urgency is in the pace, never in the voice.`

**Debrief** (`closing_debrief_person`, erb :1605)
- Before: `Professional intelligence handler in debrief. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Steady, mid-range pitch, reviewing critical information under time pressure.`
- After: `Professional intelligence handler in debrief. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. A seasoned professional who has done this a hundred times. Quick, clipped and businesslike because time is short, yet completely unflustered; the urgency is in the pace, never in the voice.`
- This matches m03's debrief. The m06 debrief has a quiet personal beat at the end (Tesseract, "I was one of his students", `*quietly*`), which the inline cue covers, so it doesn't need a scene mood like m05's.

**Phone** (`agent_0x99_handler`, erb :868): its ink is a phone chat and isn't voiced, so this style keys no clips today. For consistency only:
- Before: `Intelligence handler speaking over a secure phone line. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Quick, warm, slightly wry.`
- After (m03's wording): `Intelligence handler speaking over a secure phone line. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. A seasoned professional who has done this a hundred times. Quick, clipped and businesslike because time is short, yet completely unflustered; the urgency is in the pace, never in the voice.`

## 5. The ten weakest spoken lines, and what was done

1. analyst.ink:106 "Yeah. Very.": **fixed** (table).
2. analyst.ink:182 "Pretty much.": **fixed**.
3. trader.ink:174 "Depends on your perspective.": **fixed**.
4. closing_debrief.ink:293 "Know what they've already told themselves.": **fixed**.
5. closing_debrief.ink:204 "We lost an asset. Write that.": **fixed**.
6. closing_debrief.ink:225 "before midnight" at 4 a.m.: **fixed** (a continuity slip).
7. opening_briefing.ink:48 the treatment carry-over (ambiguous "for Elena's treatment"): **fixed**.
8. closing_debrief.ink:504 "Several cells will face financial charges.": **fixed**.
9. analyst.ink:295 "It looks bad.": **kept**. It's a clipped opener and the next line ("Anywhere else, I'd call it a criminal network paying itself.") carries it; cutting it would change her knot's rhythm for little gain.
10. satoshi_confrontation.ink:172 "Everything justifies something. You just don't like my arithmetic.": **kept**. The first sentence is a little glib, but it's in character (he turns every moral objection into maths), and the second half lands.

Also checked and kept: the six carry-over lines (two fixed above; "public_exposure", "arrest", "combat_nonlethal" and "combat_lethal" each name what the player did and read cleanly). Kemal's lines ("Thirty years I stood between people and their money. Never between them and a grave.") are among the strongest in the mission. The debrief location line (reworded 2026-10-17) reads well and needed no change.

## 6. Checks

- Ink compile: all seven changed files compile (`bin/inklecate`), with no warnings.
- `tagdiff --old` against HEAD: STRUCTURE UNCHANGED for opening_briefing, closing_debrief, checkpoint_guard, irina_volkova, trader, analyst and satoshi_confrontation (prose only: 3, 7, 1, 2, 2, 2, 2 lines).
- `ruby scripts/validate_scenario.rb`: 0 errors. The warnings are the existing eventMapping and onceOnly notes, unchanged.
- `dialoguelint`: "Totals by rule: none" (no line-len or text-len).
- loopcheck @ start, all seven files: no runtime errors.
- reopencheck (all missions): 0 problems, including m06's phone.
- m06 route driver: all 43 routes pass. r36, r40 and r41 asserted the old wording of the two reworded carry-over lines; only the asserted strings were updated.
- No audio generated. `wasted`: 523 lines expected, 0 current-model clips.

## 7. For the user to decide

- Nothing blocking.
- Optional: listen to Irina's "His safe is 2140." at voicing time. If the TTS says "two thousand one hundred and forty", the fix is "His safe is twenty-one forty. The year…". That shows words on screen for a number the player has to type, so it's left as digits for now.
