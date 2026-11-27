# m08 The Mole, 60 s trailer outline

## Decided lines (2026-11-23)

The owner's picks. Where the older text below disagrees, this block wins.

- **Ending:** Netherton, "There is a mole in SAFETYNET. I am reasonably certain they are within a hundred metres of where you are standing." (existing).
- **Hook:** ATHENA, as in the table. The proposed "reading you" line is out of the game.
- **Casualty rule (relaxed 2026-11-23):** figures are allowed when they are the stakes, never as an outcome and never a debrief total. This loosens any "Out" or "Off screen" entry below that bars a figure only because it is one.

Planning only. Model: `M03_TRAILER60_V3_PLAN.md`. Every line is "audio: check" until the scout tests the cache.

## Story

Portland went wrong. ENTROPY had the deployment before SAFETYNET signed it, and two agents died. Now the Citadel is on Level Red. ATHENA, the building's holographic AI, logs every step you take. Netherton has three names: Vector, Phantom and Nightshade. You interview each of them, put the door audit in front of them, break into SAFETYNET's own code repository, and work out which colleague sold you.

## Threat

ENTROPY has a sleeper inside SAFETYNET headquarters. He handed them the Portland deployment ("They were handed the board: your assignment, your timing, your identity on the ground", `ink/m08_director_netherton.ink:93`). Two agents are dead, and the mole is the thread to The Architect (`:140`). What ENTROPY actually took that night is the mission's end twist and stays off (see Spoiler notes).

## New mechanics

- **Mole hunt: interview the suspects, then read the evidence back.** First in m08. Three suspect interviews (`scenario.json.erb:389-422`, objectives), the door audit put to each man to confirm his row (`:435-450`; Vector's "Eight minutes..." `ink/m08_suspect_vector.ink:137`), and the door reading for the Director, a question-by-question deduction (`ink/m08_director_netherton.ink:282-316`, wrong-answer replies `:377-387`). `mole_identified` and `accused_*` exist only in m08. **This gets the card.**
- **Holographic NPC.** ATHENA is drawn see-through with a cyan glow and flicker (`spriteStyle`, `scenario.json.erb:648,715`; engine `js/systems/npc-sprite-style.js`). Only m08 uses `spriteStyle`. Visual hook, no card of its own.
- **Unattended console window.** The relief watch's console sits open while Julian is at the cooler (`scenario.json.erb:1664,1843-1861`). Already in m03 and m06: not new.
- **Print on a surface.** `fingerprintSurface: "glossy_dark"` (`:2712`) is new as a key, but dusting dates from m04, and this print belongs to the mole: off screen.

Card: `Interview / Suspects` (alternative `Hunt the / Mole` if the user wants story words; the rule prefers the mechanic's name).

## Music

Not in the record yet. Candidates, none used by m01-m03:
1. SpyAction "Midnight Double Agent" (the title fits a mole story).
2. Noir "Shadowline Protocol" (analysed as an m02 alternative, 124 BPM).
3. Noir "Encrypted Shadows" (analysed as an m02 alternative, 99 BPM).

## Beat sheet (the 46 s between the presets)

The whole mission is one night (`lighting.defaultMode: "on"`, motion lights only in the server room, archives and suite: `scenario.json.erb:601,2040,2133,2318`). No day block. Keep the lit floor shots together, then the dark rooms.

| # | Section | Shot | Entry state | Line (speaker), audio: check |
|---|---|---|---|---|
| 1 | Hook (J-cut under the title) | ATHENA hologram in the lobby, briefing portrait | fresh game, `main_lobby`; opening cutscene `opening_briefing_cutscene` | ATHENA: "The leak came from inside this building. Director Netherton has three names, and one of them got two of your colleagues killed." (long: trim at the scout or use the fallback) Fallback, ATHENA: "Welcome back, Agent 0x00. Security posture is Level Red." (first sentence only if the cut allows) |
| 2 | Card | `Mission 8 / The Mole` | | |
| 3 | Stakes | Netherton turns from the window, portrait | `director_office`, briefing not yet taken | Director Magnus Netherton: "They did not out-think us at Portland. They were handed the board: your assignment, your timing, your identity on the ground." |
| 4 | Card | `Interview / Suspects` (new mechanic) | | |
| 5 | Mechanic, about 4 s | three straight walks, one per suspect, each with his opener: Vector on the ops floor, Phantom in intel, Nightshade in the Crypto Lab | after the Director's brief (`brief_taken`) | Agent 0x23 'Vector': "I know how it looks. The hours, the locked screen, me flinching just now." / Agent 0x88 'Phantom': "Agent 0x00. The Director's own bloodhound. Sit." / Agent 0x47 'Nightshade': "There you are. I wondered when they'd send you." |
| 6 | Mechanic payoff | pick up the badge audit printout in the archives (lights strike on entry), then put it to Vector | `found_badge_audit` | Agent 0x23 'Vector': "Eight minutes. I went in for a hardware token from the token cabinet, and I came out again." |
| 7 | Card | `Real / Hacking` | | |
| 8 | Hacking | badge through the server-room reader (RFID, motion lights strike), walk to the Field Console (Kali), console clip on SAFETYNET's own GitList repo, CyberChef if room | `netherton_card_cloned` or printed badge; flag station `flag_station_evidence_relay` | none (console clip planned elsewhere) |
| 9 | Card | `Be Quiet. / Be Quick.` (ATHENA's words, `ink/m08_opening_briefing.ink:46`) | | |
| 10 | Action | the player at Phantom's desk, strikes, Phantom comes at the player; chase a few steps | `intel_analysis`; hostile on strike (`scenario.json.erb:1008-1014`) | Agent 0x88 'Phantom': "I've been hunting this leak longer than you've known it existed. Accuse me properly, or get out of my way and let one of us catch him." (needs an angry read; ask before a re-voice) |
| 11 | Card | `Before They / Vanish` (`ink/m08_opening_briefing.ink:46`, "The moment they know you are hunting, they vanish") | | |
| 12 | Crescendo | every minigame (lockpick on a locker, PIN on the Director's safe or the badge printer with 3 non-code digits, password on the archives, RFID clone at Netherton's lanyard, CyberChef, flag station, phone chat with HaX, notes) and flashes of Julian, Agnieszka, the junior analyst, the off-duty agent | various; most from montage takes | none |
| 13 | Ending | see Ending: wide, then the 3x close | per line | per line |

## Cards

- `Mission 8 / The Mole`
- `Interview / Suspects`
- `Real / Hacking`
- `Be Quiet. / Be Quick.`
- `Before They / Vanish`

## Ending

1. Director Magnus Netherton: "There is a mole in SAFETYNET. I am reasonably certain they are within a hundred metres of where you are standing." (`ink/m08_director_netherton.ink:97`). The premise in one breath, menace without a name, and it sends the viewer back to the three faces they just saw. A natural cut point after "SAFETYNET."
2. ATHENA: "The calmest person in a frightened building is not always the bravest. Sometimes they are simply the one who is not surprised." (`ink/m08_receptionist_ai.ink:40`). Eerie from a hologram, but it points at the calm suspect; only use it if the edit does not also show Nightshade's calm lines.
3. Agent 0x47 'Nightshade': "Fear is what you feel when the outcome is still uncertain. I made my peace with most outcomes long ago." (`ink/m08_suspect_nightshade.ink:68`). Strong menace, but ending on one suspect singles him out. Rank last.

## Spoiler notes

- **The mole's identity.** The mission withholds it until the reading or the evidence names him (`mole_identified`, `ink/m08_director_netherton.ink:400-401`). Show all three suspects equally. Nothing from `m08_nightshade_confrontation.ink` (his portrait there is the reveal), no interrogation-suite shots with him in the chair, no "He's coming over the table." text.
- The fingerprint dusting of the USB stick (owner is the mole, `scenario.json.erb:2708-2712`), the go-bag, the sealed psych evaluation, and the "Deep State" brief once its ENTROPY header shows.
- The database theft ("The attacks were the noise", `ink/m08_nightshade_confrontation.ink:210-211`) and the Tomb Gamma coordinates (`:216-217`).
- Answers: the suite code, the safe PIN (service number), the archive passphrase, flag values, the door-reading answer choices. Accusation and fate screens (`disposition_terminal`), the debrief.

## Risks

- **Interview beat staging.** Three walks plus three openers in about 4 s means very short line fragments; the openers run 3-5 s each at full length. The scout may need to pick two of the three, or cut each to its first sentence where there is a natural gap.
- **The door-audit confirmation** needs `found_badge_audit` and Vector not yet accused or struck; Vector's line plays only through the audit topic.
- **Phantom's action line** is an accusation reply: the take needs `phantom_interviewed` and the accuse branch; the cached read may be calm. Striking him latches `phantom_hostile`; the chase needs room to run in `intel_analysis`.
- **ATHENA's hologram** depends on `npc-sprite-style.js` alpha, glow and flicker rendering in the capture build; the briefing itself is a person-chat cutscene, so the hologram look shows only on the reception ATHENA (`receptionist_ai`).
- **Lights strike** only in the server room, archives and suite; the archives shot needs the passphrase door already open (entry state, not filmed).
- Netherton's stakes line comes from the first briefing, which runs once: one take per fresh game.

## New lines (proposed, 2026-11-22)

Proposals only: no ink edited, nothing voiced. Each needs the user's pick, an `npc-dialog-review` and the user's yes through AC0 before TTS. The villain is the mole, and his identity is the mission's twist. So the menace comes from the two voices that watch all three suspects: Netherton and ATHENA. Neither line points at one suspect (all three have planning access, `m08_director_netherton.ink:134`).

**Ending**

1. **Pick.** Director Magnus Netherton: "They have read our plans for months, Agent. Tonight they will be reading you." (14 words, about 4.5 s)
   - Insertion: `ink/m08_director_netherton.ink`, opening of the first talk, **added** after `:97` ("There is a mole in SAFETYNET. I am reasonably certain they are within a hundred metres of where you are standing."), before "Ask me what you need. Then go and prove something."
   - `#delivery: low and grave, each word placed`
   - State: the cheapest one. First talk with Netherton in his office (`met` false).
   - Why: the current #1 states the premise. This line turns it on the player, and it can follow #1 in the cut as its button.
2. ATHENA: "Whoever it is, Agent, they are still in the building. So are you." (13 words, about 4 s)
   - Insertion: `ink/m08_receptionist_ai.ink`, `hub`, option "What have you seen tonight, ATHENA?", **added** after `:40` ("I will say only this. The calmest person in a frightened building..."), before `-> back`.
   - `#delivery: serene and pleasant, faintly unsettling`
   - State: talk to ATHENA in the lobby and take that option.
   - Why: an eerie, short closer from the hologram that names no trait, so it does not single out the calm suspect the way `:40` does.

**Hook:** ATHENA's "The leak came from inside this building." works if it is cut at the first sentence. No new hook.
