# m08 The Mole: pre-voicing pass (2026-10-18)

The brief: `docs/agents/PASS4_BRIEF.md` and the pre-voicing brief for m04–m08 (the user, 2026-10-18: "You can make edits. Let's make sure it's great before we voice."). No audio was generated. The only TTS command run was the read-only `wasted` count.

## Spoken lines changed

| file:line (new) | Before | After | Why |
|---|---|---|---|
| `m08_opening_briefing.ink:21` | ATHENA: The PIN device you are thinking of is still signed out to Agent 0x47, as it has been since St. Catherine's. | ATHENA: The PIN device you are thinking of is still signed out to Agent 0x47, Nightshade, as it has been since St. Catherine's. | The first time the player hears a code it now comes with a name. They haven't met anyone yet. |
| `m08_opening_briefing.ink:22` | ATHENA: Read nothing into it. Agent 0x23 has a hardware token out tonight, and Agent 0x88 a travel pack. Everyone on the planning list keeps something they shouldn't. | ATHENA: Read nothing into it. Vector has a hardware token out tonight, and Phantom a travel pack. Everyone on the planning list keeps something they shouldn't. | Three hex codes in two lines, heard before any of the three has been introduced, were hard to follow. Netherton still gives each code when the player asks about them. |
| `m08_opening_briefing.ink:31` (carry-over, Trojan Horse redirected) | …reached the dispatch keys first. Nine days on, those counties are still answering. | …reached the dispatch keys first. Nine days on, dispatch in eleven counties is still answering. | "Those counties" had nothing to refer back to in this branch. The other carry-over branches name "eleven counties". |
| `m08_suspect_vector.ink:74` | …never touched the mission_planning share. | …never touched the mission-planning share. | The underscore would be read out. |
| `m08_suspect_phantom.ink:91` | Someone's been in mission_planning from Cryptography Lab terminal 03. | Someone's been in the mission-planning share from Cryptography Lab terminal 03. | Same underscore, and the line now matches Vector's wording. |
| `m08_suspect_nightshade.ink:43–44` (narrator) | The Crypto Lab is quiet. Nightshade turns as you come in and smiles as if the last nine days never happened. His desk behind him is bare: no photographs, no mug. | Split into two narrator lines at "happened." (words unchanged) | 31 words, over the 30-word cap. |
| `m08_suspect_nightshade.ink:89` | Then you have root on our own repository. I'm genuinely impressed. Nobody's touched that box in years. | Then you have root on our own repository. I'm impressed. Nobody's touched that box in years. | His second "genuinely" (the first is at :60, "I'd genuinely encourage it"). Repeating it sounds like a verbal tic, and the plain word is cooler. |
| `m08_director_netherton.ink:420` | And the box has an account on that terminal for the same forty-seven minutes. A door and a login, at the same minute. | …for those forty-seven minutes. A door and a login, at the same minute. | "Same" twice in one line. |
| `m08_nightshade_confrontation.ink:79–80` (narrator) | The case runs down the wall in order. … Mail to the Architect. Root, and forty-seven minutes on the Portland plan from Cryptography Lab terminal 03. | Split into two narrator lines before "Root," (words unchanged) | 36 words, over the cap. |
| `m08_closing_debrief.ink:242–250` | Director: They spent fifteen years turning one of ours into a weapon and pointing it at the rest of us. {nightshade_triple_agent:Tonight you turned it round.\|Tonight you took it off them.} | The same two lines, written as a `{ nightshade_triple_agent: … - else: … }` block (words unchanged) | **The mission's closing line had no clip.** The line walker gave up on this inline conditional (note "divert mid-line"), so `wasted` expected no line for it, a batch would never have voiced it, and the endpoint's validator (which uses the same walker) would probably have refused it live. As a block, both versions are extracted (checked against the before/after line dump). |

Expected voiced lines: **436 before, 440 after**. The four new lines are the two closing-line versions and the two narrator splits. Running `bin/rails "app:break_escape:tts:wasted[m08_the_mole]"` prints "440 lines expected".

## Voice config: no changes

I checked every voiced speaker against `docs/agents/CAST_PROPOSALS.md` (m08 section), `docs/agents/PASS3_VOICE_AUDIT.md` and the ink:

- ATHENA ×2 (Kore, RP): she is now a hologram, but she's still the building AI. Both styles already say "SAFETYNET's building AI", smooth and corporate. Nothing to change.
- Vector (Iapetus, Glasgow, early thirties): matches the cast (British-Chinese Glaswegian, about 32).
- Phantom (Fenrir, light educated Ghanaian English, early forties): matches.
- Junior Analyst (Vindemiatrix, Leicester, mid-twenties): matches.
- Off-Duty Agent (Puck, Geordie, forties): matches (white Geordie, about 46).
- Nightshade ×2 (Enceladus, RP): the same identity text as m02 and m03, with a scene part for before and after the unmasking. Matches.
- Netherton ×2 (Charon, RP), the narrator (Algenib, RP): match the bible and the earlier missions.
- HaX in person (Aoede): see below.

## HaX's style (rule 3): nothing to apply

None of m08's HaX styles has the old "speak quickly with urgency, as if time is short" wording, so there's nothing to change at voicing time:

- `agent_0x99` (phone, `scenario.json.erb:728`): "…Normally quick and dry; tonight the dryness keeps slipping, because one of the three names is a friend and she does not yet know which." Phone chats aren't voiced, so no line uses this style today (but see the HaX debrief item below).
- `agent_0x99_person` (`scenario.json.erb:2251`): "The player's handler, in person, off duty, hurting. … here, quieter and tired, trying not to show how much this one costs her." This is the "m08 hurt" mood that rule 3 names as one to keep. Leave it as it is.

## The ten weakest spoken lines

1. Opening :22, three hex codes in a row before any introductions. **Fixed** (codenames).
2. Closing :242, the last line of the mission, which was never extracted, so it would have had no clip. **Fixed** (block conditional).
3. Opening :31, "those counties" with nothing to refer to. **Fixed.**
4. Vector :74, "mission_planning" would be spoken with its underscore. **Fixed.**
5. Phantom :91, the same. **Fixed.**
6. Narrator, confrontation wall, 36 words. **Fixed** (split).
7. Narrator, Nightshade's lab entrance, 31 words. **Fixed** (split).
8. Nightshade :89, his second "genuinely". **Fixed.**
9. Netherton :420, "same … same". **Fixed.**
10. "Two of ours are dead": Netherton :94, Phantom :62, the debrief :80 and a player choice. **Left.** It works as a refrain, the three spoken uses are in different scenes, and each one goes somewhere different.

Considered and left alone: Netherton's "I have run field operations for five years" (canon, settled in pass 4 and quoted in the voice bible). Nightshade's "I'm always here" refrain (deliberate). Netherton's "Agent 0x23." / "Agent 0x88." / "Agent 0x47." (he's reading from a file, and the player has just asked about that person by name).

## How codenames are written for speech

The voiced m01–m03 ink writes the player's code as "Agent 0x00" inside spoken lines (`m02_opening_briefing.ink:36`, `m02_closing_debrief.ink:141`, `m03_opening_briefing.ink:37`), and those three 3.8 clips have been reviewed. Everyone else in m01–m03 is called by codename alone ("Nightshade", "HaX"). Speaker prefixes such as `Agent 0x47 'Nightshade':` are stripped before TTS, so they're never spoken. m08 follows the same rule: hex codes stay where a character is reading a file or a locker label ("0x47, second from the end"), and codenames are used everywhere else. m08 also uses a bare "0x00" as a form of address (HaX :76, Nightshade ×4, the debrief). It's the same written form as the approved clips without the word "Agent". Listen to one of these when voicing.

## Checks

- Ink compiles (all 12 files, no errors or warnings).
- `ruby scripts/validate_scenario.rb scenarios/m08_the_mole/scenario.json.erb --skip-ink --no-graph`: 0 errors (the existing onceOnly/cutscene warnings are unchanged).
- dialoguelint: "Totals by rule: none". The only entries are the three ALLOWED `{suite_code}` lines.
- tagdiff (against HEAD): structure unchanged in 11 files. The one difference is `m08_closing_debrief.ink` `[close] + else`, the new block conditional on the same `nightshade_triple_agent` test that the inline form used.
- loopcheck: closing debrief (both fates), suspect Nightshade, confrontation, opening briefing and Netherton are all clean. reopencheck: 0 problems.
- m08 route driver: all 33 routes pass. Route wording updated: r26 ("Vector has a hardware token out tonight") and r28–r33 ("Nine days on, dispatch in eleven counties is still answering"). These are text assertions only; the behaviour is the same.

## For the user or the lead to decide

1. **HaX's two debrief lines are refused (engine).** `m08_closing_debrief.ink:65–66` ("He said it to you? Afterwards, not during…" and "Same classroom, 0x00…") are prefixed `Agent HaX:`. The extractor and the client resolve that prefix to the phone NPC `agent_0x99`, whose own story doesn't contain these lines, so the endpoint refuses them (403) and they'll be silent. m07's debrief has the same problem with about 30 HaX lines. The fix belongs in the engine: let a co-speaker's line through when the host's story contains it. That makes it an approval item, so it isn't done here. Once fixed, these lines will use the phone style quoted above.
2. **"The code is 5386."** Netherton says the suite code (a fixed constant, `{suite_code}`, allowed on purpose) at `m08_director_netherton.ink:428, 430, 436`. Check by ear that the TTS reads it as digits ("five three eight six").
3. **"terminal 03"** (Phantom :91, the narrator on the wall): this should come out as "zero three" or "oh three". Check one clip when voicing.
