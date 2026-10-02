# Break Escape voice audit (m01–m08)

Date: 2026-10-01. Scope: `scenarios/m01_*` to `m08_*` `scenario.json.erb`, with sis01–sis03 and biometric_breach checked for reference (none of them reuses a mission character; biometric_breach has no voiced NPCs).

How voices work, as checked in the code:
- `app/services/break_escape/tts_service.rb` passes `voice.name` straight to Gemini as `prebuiltVoiceConfig.voiceName`, with `style` as the prompt and `language` as `languageCode`. There is no allow-list in the app, so any Gemini prebuilt voice name is accepted. Names in use across the repo: Achernar, Algenib, Algieba, Alnilam, Aoede, Autonoe, Charon, Despina, Enceladus, Erinome, Fenrir, Iapetus, Kore, Leda, Puck, Rasalgethi, Sulafat. This pass adds Gacrux, Laomedeia, Orus, Pulcherrima, Sadaltager, Schedar, Umbriel and Vindemiatrix, all standard Gemini TTS voices.
- Cache key = MD5 of text | name | style | language, stored per scenario in `tts_cache/<scenario>/`. Any change to name, style or language discards that character's cached lines.
- Client side, an NPC without a `voice` block gets no TTS (`npc-manager.js:955` `useTTS: … && !!npc.voice`; `phone-chat-ui.js:217`). Before this pass, most of the m04 and m05 cast were silent.
- Cache sizes at the time of the audit: m01 769 files (34 MB), m02 847 (43 MB), m03 77, m04 2, m05 50, m06 3, m07 6, m08 17. Edits to m03–m08 discard very little; edits to m01/m02 would discard a lot.

Bible coverage: `story_design/universe_bible/04_characters` gives no accents. Useful facts: HaX is late 30s to early 40s, warm and calm under pressure (`agent_0x99_haxolottle.md:70-76,125-137`); Netherton is late 50s with a British flag in his office (`director_netherton.md:109,138`); the Architect is "middle-aged to elderly … likely Western European or North American" (`the_architect.md:24-26`); the Recruiter is a former intelligence recruiter with twenty years' service (`03_entropy_cells/insider_threat_initiative.md:27-37`), and m05 ink calls her "she".

## (a) Cast table per mission

Verdict key: OK = detailed and consistent; THIN = missing age, pitch or region; FIXED = edited this pass; PROPOSED = change written below for approval or for the orchestrator; NONE→ADDED = had no voice block.

### m01 First Contact (do not edit)
| Character | id | Implied nationality | Voice | Accent | Lang | Verdict |
|---|---|---|---|---|---|---|
| Narrator | narrator | – | Algenib | none stated | en-GB | OK (canonical narrator) |
| Agent HaX (briefing) | briefing_cutscene | British | Aoede | RP | en-GB | OK, canonical |
| Agent HaX (phone) | agent_0x99 | British | Aoede | RP | en-GB | OK, canonical |
| Agent HaX (debrief) | closing_debrief_person | British | Aoede | RP | en-GB | OK, canonical |
| Sarah O'Brien | sarah_martinez | Irish | Kore | Irish (no region) | en-GB | THIN (no age, region), optional |
| Kevin Park | kevin_park | Korean-Australian | Charon | Australian | en-GB | THIN (no age), optional |
| Kevin's voicemail | reception_desk_phone (ttsVoice) | – | Charon | Australian | en-GB | OK, matches Kevin |
| Derek Lawson | derek_lawson | English | Algieba | RP | en-GB | THIN (no age), optional |
| Maya Chen | maya_chen | Chinese-American | Leda | Chinese-American | en-GB | THIN (no age, pitch, pace), PROPOSED |
| Maya's voicemail | patricia_desk_phone (ttsVoice) | – | Leda | Chinese-American | en-GB | matches Maya, PROPOSED with her |

### m02 Ransomed Trust (do not edit)
| Character | id | Implied nationality | Voice | Accent | Lang | Verdict |
|---|---|---|---|---|---|---|
| Narrator | narrator | – | Algenib | none stated | en-GB | OK |
| Agent HaX ×3 | opening_briefing_cutscene, agent_0x99, closing_debrief_trigger | British | Aoede | RP | en-GB | OK, matches m01 |
| Director Netherton | director_netherton | British | Charon | RP | en-GB | OK, canonical (no age, optional) |
| Agent 0x47 Nightshade | agent_nightshade | British | Enceladus | RP | en-GB | OK, canonical |
| Bernie Nwosu | receptionist | British-Nigerian | Despina | South London / MLE | en-GB | OK |
| Ghost | ghost | unplaceable | Iapetus (+fx) | trained-out English | en-GB | OK |
| Sister Doyle | ward_nurse | Irish | Kore | Belfast | en-GB | OK |
| Nurse Raval | roaming_ward_nurse | British-Indian | Erinome | West Yorkshire (Bradford) | en-GB | OK |
| Mr Pryce | patient_bed4 | English | Rasalgethi | South London | en-GB | OK |
| Mrs Hargreaves | patient_bed2 | English | Sulafat | Lancashire | en-GB | OK |
| Ms Chen | patient_bed5 | British-Chinese | Autonoe | Scottish (Edinburgh) | en-GB | OK |
| Gary Whitlock | gary_whitlock | English | Charon | Birmingham / Black Country | en-GB | OK; shares Charon with Netherton, never in the same scene |
| Dr Sarah Kim | dr_sarah_kim | British-Korean | Achernar | RP | en-GB | THIN (no guard, age, pitch), PROPOSED |
| Graham Reeves | night_security_supervisor | English | Enceladus | Estuary | en-GB | OK; shares Enceladus with Nightshade, never in the same scene |
| Val Okonkwo | security_guard_patrol | Black British (Nigerian surname) | Leda | Scouse | en-GB | OK |
| Hospital Comms Terminal | press_terminal_system | – | none | – | – | object terminal, no voice needed |

### m03 Ghost in the Machine (edited)
| Character | id | Implied nationality | Voice | Accent | Lang | Verdict |
|---|---|---|---|---|---|---|
| Narrator | narrator | – | Algenib | – | en-GB | OK |
| Agent HaX ×3 | briefing_cutscene, agent_0x99, closing_debrief | British | Aoede | RP | en-GB | OK (debrief pace is a scene note) |
| Director Netherton | director_netherton | British | Charon | RP | en-GB | OK |
| Nightshade | agent_nightshade | British | Enceladus | RP | en-GB | OK ("technical analyst" wording drift, left) |
| Receptionist | receptionist_npc | – | Kore | South Wales (Cardiff) | en-GB | FIXED (was vague "Southern English", no guard/age/pitch) |
| Victoria Sterling | victoria_sterling | English | Despina | RP | en-GB | FIXED (age, pitch, guard added) |
| Security Guard | night_guard | English | Algieba | Estuary (Essex) | en-GB | FIXED (pitch, guard) |
| Danny Foster | danny_foster | English | Iapetus | East Midlands (Nottingham) | en-GB | FIXED (region, pitch, guard) |

### m04 Critical Failure (edited; UK site, Albion Energy Storage)
| Character | id | Implied nationality | Voice | Accent | Lang | Verdict |
|---|---|---|---|---|---|---|
| Narrator | narrator | – | Algenib | – | en-GB | OK |
| Agent HaX (briefing) | opening_briefing_cutscene | British | Aoede | RP | en-GB | NONE→ADDED (m01 briefing text) |
| Agent HaX (phone) | agent_0x99 | British | Aoede | RP | en-GB | NONE→ADDED (m01 phone text) |
| Agent HaX (debrief) | agent_0x99_debrief | British | Aoede | RP | en-GB | FIXED (guard and canonical pitch line) |
| Director Netherton | director_netherton | British | Charon | RP | en-GB | OK |
| Nightshade | agent_nightshade | British | Enceladus | RP | en-GB | OK |
| Security Guard | security_guard | English | Schedar | West Country (Bristol) | en-GB | NONE→ADDED |
| Robert Vance (person) | robert_vance | English | Orus | North-East (Teesside) | en-GB | FIXED (was Charon, Netherton's voice, with no accent) |
| Robert Vance (phone) | robert_vance_phone | English | Orus | North-East (Teesside) | en-GB | NONE→ADDED |
| Op. 'Cipher' (m) | operative_cipher | – | Fenrir | Dutch-accented English | en-GB | NONE→ADDED |
| Op. 'Relay' (f) | operative_relay | – | Pulcherrima | Scottish (Edinburgh) | en-GB | NONE→ADDED |
| Voltage (m) | voltage | – | Alnilam | South African (Johannesburg) | en-GB | NONE→ADDED |
| Op. 'Static' (m) | operative_static | – | Umbriel | Polish-accented English | en-GB | NONE→ADDED |

### m05 Insider Trading (edited; UK, 999 network)
| Character | id | Implied nationality | Voice | Accent | Lang | Verdict |
|---|---|---|---|---|---|---|
| Narrator | narrator | – | Algenib | – | en-GB | OK |
| Agent HaX (briefing) | opening_briefing | British | Aoede | RP | en-GB | NONE→ADDED |
| Agent HaX (phone) | agent_0x99_handler | British | Aoede | RP | en-GB | NONE→ADDED |
| Agent HaX (debrief) | closing_debrief_trigger | British | Aoede | RP | en-GB | FIXED (guard and pitch line) |
| Director Netherton | director_netherton | British | Charon | RP | en-GB | OK |
| Nightshade | agent_nightshade | British | Enceladus | RP | en-GB | OK |
| The Recruiter (f) | recruiter | American (ex-intelligence) | Gacrux | Educated American (DC / Mid-Atlantic) | en-US | NONE→ADDED |
| Patricia Morgan (person) | patricia_morgan | Welsh (surname) | Kore | South Wales (Cardiff) | en-GB | NONE→ADDED |
| Patricia Morgan (phone) | patricia_phone | Welsh | Kore | South Wales (Cardiff) | en-GB | NONE→ADDED |
| Lisa Park | lisa_park | British-Korean | Laomedeia | South-west London | en-GB | NONE→ADDED |
| Owen Gallagher | owen_gallagher | English (Irish surname) | Puck | Manchester | en-GB | NONE→ADDED |
| Dr Ruth Halloran | dr_halloran | Irish | Erinome | Irish (Dublin) | en-GB | NONE→ADDED |
| David Torres | david_torres | Spanish | Schedar | Light Castilian Spanish | en-GB | NONE→ADDED |

### m06 Follow the Money (not edited; proposals in (d))
| Character | id | Implied nationality | Voice | Accent | Lang | Verdict |
|---|---|---|---|---|---|---|
| Narrator | narrator | – | Algenib | – | en-GB | OK |
| Agent HaX (briefing) | opening_briefing_npc | British | Aoede | RP | en-GB | OK |
| Agent HaX (phone) | agent_0x99_handler | British | Aoede | RP | en-GB | PROPOSED (missing canonical pitch line) |
| Agent HaX (debrief) | closing_debrief_person | British | Aoede | RP | en-GB | OK |
| Director Netherton | director_netherton | British | Charon | RP | en-GB | OK |
| Nightshade | agent_nightshade | British | Enceladus | RP | en-GB | OK |
| Checkpoint Guard | checkpoint_guard | English | Alnilam | London | en-GB | THIN, PROPOSED |
| Dr Irina Volkova | irina_volkova | Russian | Kore | "light Eastern European" | en-GB | PROPOSED (make it Russian, add pitch) |
| Dani Okonkwo | trader_npc | British-Nigerian | Puck | London | en-GB | THIN, PROPOSED |
| Priya Raghavan | blockchain_analyst | British-Indian | Leda | "Northern English" | en-GB | THIN, PROPOSED |
| Satoshi Nakamoto II | satoshi_nakamoto | American persona | Charon | US West Coast | en-US | PROPOSED (shares Charon with Netherton; no age/pitch) |

### m07 Architect's Gambit (edited; US Pacific Northwest)
| Character | id | Implied nationality | Voice | Accent | Lang | Verdict |
|---|---|---|---|---|---|---|
| Narrator | narrator | – | Algenib | RP | en-GB | OK |
| Netherton (briefing, debrief) | opening_briefing_cutscene, closing_debrief | British | Charon | RP | en-GB | OK |
| Agent HaX (phone) | agent_0x99 | British | Aoede | RP | en-GB | FIXED (canonical pitch line restored) |
| Jake Morrison | jake_morrison | American | Puck | PNW working class | en-US | FIXED (age, pitch). Rename to Ray Hollis still pending per PASS3 log |
| The Architect | the_architect | W. European / N. American | Sadaltager (+fx) | unplaceable, faintly mid-Atlantic | en-GB | FIXED (was Enceladus = Nightshade's voice) |
| Elena Rodriguez | elena_rodriguez | Mexican-American | Leda | Californian | en-US | FIXED (age, pitch) |
| Dr James Mercer | james_mercer | American | Iapetus | General American, PNW | en-US | FIXED (pitch) |
| Thomas Park | thomas_park | Korean-American | Rasalgethi | Korean-American, PNW | en-US | FIXED (age, pitch) |

### m08 The Mole (edited; SAFETYNET HQ)
| Character | id | Implied nationality | Voice | Accent | Lang | Verdict |
|---|---|---|---|---|---|---|
| Narrator | narrator | – | Algenib | RP | en-GB | OK |
| ATHENA ×2 | opening_briefing_cutscene, receptionist_ai | AI | Kore | RP | en-GB | OK |
| Agent HaX (phone) | agent_0x99 | British | Aoede | RP | en-GB | FIXED (pitch line) |
| Agent HaX (in person) | agent_0x99_person | British | Aoede | RP | en-GB | FIXED (pitch line) |
| Netherton ×2 | director_netherton, closing_debrief | British | Charon | RP | en-GB | OK |
| Nightshade ×2 | agent_nightshade, nightshade_confrontation | British | Enceladus | RP | en-GB | FIXED (was Charon, the Director's voice) |
| Agent 0x23 'Cipher' | agent_cipher | – | Iapetus | Scottish (Glasgow, educated) | en-GB | FIXED (was RP; age, pitch) |
| Agent 0x88 'Phantom' | agent_phantom | – | Fenrir | Light educated Ghanaian English | en-GB | FIXED (was RP; age, pitch) |
| Junior Analyst | background_analyst | British-Indian | Vindemiatrix | East Midlands (Leicester) | en-GB | FIXED (was Kore, same as ATHENA; RP) |
| Off-Duty Agent | background_agent | English | Puck | Geordie | en-GB | FIXED (was RP; age, pitch) |

## (b) Recurring characters

Each style is treated as an identity part, which must match the canonical text, plus a scene part, which may vary. Differences that are only punctuation ("--" against "—", "Speak with a consistent" against "Consistent") were left alone, because changing them discards cached audio and changes nothing a listener would hear.

### Agent HaX (agent_0x99, agent_0x99_handler, briefing and debrief NPCs)
- Canonical (m01): `Aoede`, `en-GB`. Identity: "Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch." Scene part examples: "Intelligence handler speaking over a secure phone line … Speak quickly with urgency, as if time is short."
- m02, m03, m06 briefing/debrief: match.
- m04: briefing and phone had no voice block, so HaX was silent there (fixed). The debrief lacked the accent guard and the pitch sentence (fixed).
- m05: briefing and phone had no voice block (fixed). The debrief lacked the guard and pitch sentence (fixed).
- m06 phone: no pitch sentence ("Quick, warm, slightly wry."). Proposal in (d).
- m07 phone, m08 phone, m08 in person: no pitch sentence (fixed). Their "quick, dry" personality is accepted as a scene note for the late-series tone.
- Not stated anywhere: age. The bible gives late 30s to early 40s. Adding it would mean changing m01/m02 (see (d), optional).

### Director Magnus Netherton (director_netherton, plus m07/m08 briefing and debrief NPCs)
- Canonical (m02): `Charon`, `en-GB`. Identity: "SAFETYNET's director. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, deliberate, unhurried". Scene part in m02: "hands off quickly and lets his handler run the detail".
- m03–m08: name, accent and "low, deliberate, unhurried" all match. m08 prefixes "Cinematic thriller.", which is harmless.
- Voice clashes: Charon was also Robert Vance (m04, fixed), Satoshi Nakamoto II (m06, proposed) and Nightshade (m08, fixed). Gary Whitlock (m02) also uses Charon, but never shares a scene with him; left alone.

### Agent 0x47 'Nightshade' (agent_nightshade, nightshade_confrontation)
- Canonical (m02): `Enceladus`, `en-GB`. Identity: "SAFETYNET's cryptographic-hardware analyst. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Calm, precise, technically fluent; a colleague you trust."
- m03–m06: Enceladus, RP, same personality, but the role reads "technical analyst". Left alone: it's a minor wording drift in a seed briefing.
- **m08: was `Charon` (the Director's voice) in both blocks.** Fixed: now Enceladus with the m02 identity text plus a scene part (the mole, before and after he is unmasked). `scenarios/m08_the_mole/CONTRACT.md:25-26` still lists Charon. I didn't edit it because it's outside the voice blocks; whoever owns m08 should update it.
- m07: the Architect used Enceladus, Nightshade's voice. Nightshade is the m08 mole and is not the Architect (m08 ink has him give away the Architect's location), so a shared timbre would point players at a false reveal. The Architect now uses Sadaltager.

### Narrator (top-level `narrator`)
- Canonical (m01): `Algenib`, `en-GB`, "Cinematic noir detective voice over narrator." No accent is stated. m02 gives a different scene tone. m07/m08 add "British Received Pronunciation". The same voice is used throughout; the tone changes per mission, which is acceptable.

### Characters that appear only once (no cross-mission check needed)
- The Recruiter: m05 only (voiced this pass). Ghost: m02 only. The Architect: voiced only in m07. Voltage: m04 only. Satoshi Nakamoto II / "Satoshi's Ghost": m06 only. ATHENA: m08 only.
- Same name, different person (not voice problems, just noted): Patricia Wells (m01, unvoiced, mentioned only) vs Patricia Morgan (m05). ENTROPY operative 'Cipher' (m04) vs Agent 0x23 'Cipher' (m08) vs the bible's Agent 0xAA 'Cipher'. The surname Okonkwo appears in both m02 (Val) and m06 (Dani). Park appears in m01 (Kevin), m05 (Lisa) and m07 (Thomas).
- sis01–sis03 have their own casts (Aoede, Kore, Leda and Charon reused heavily). They don't overlap with mission characters, so they weren't touched.

### Nationality spread after this pass (m01–m08, including the m06 proposals)
UK: RP (HaX, Netherton, Nightshade, Derek, Victoria, Dr Kim, ATHENA), Irish (Dublin; Belfast; unspecified for Sarah O'Brien), Scottish (Edinburgh ×2, Glasgow), Welsh (Cardiff ×2, in different missions), Northern English (Bradford, Lancashire, Liverpool, Manchester, Teesside, Geordie, Leeds as proposed), Midlands (Birmingham, Nottingham, Leicester), London (MLE, south London, south-west London, Estuary/Essex), West Country (Bristol).
Elsewhere: US (DC/Mid-Atlantic, California, Pacific Northwest ×3), Australian, Chinese-American, Korean-American, Mexican-American, South African, Dutch, Polish, Spanish, Russian (m06 proposal) and Ghanaian.
Within each edited mission no two different characters now share a Gemini voice name.

## (c) Changes made

Only `"voice"` blocks were touched: name/style/language lines, or a new block inserted straight after `npcType`. A line-by-line diff against pre-edit backups confirms that nothing outside those blocks changed. Line numbers point to the `"voice": {` line in the file as it is now.

Validator (`ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb`): **0 errors** for m03, m04, m05, m07 and m08. The remaining warnings (5, 6, 6, 6, 1) are the existing eventMapping/onceOnly warnings and none of them is about voices. The validator also rewrites `dungeon_graph.*`. For m07 and m08 the output was identical. For m03, m04 and m05 those files already had uncommitted changes, and graphs contain no voice data.

Cached audio discarded: only these characters' lines in m03 (77 files in total), m04 (2), m07 (6) and m08 (17). Blocks marked "new" had no audio before.

### m03_ghost_in_the_machine/scenario.json.erb
- :517 receptionist_npc (Kore): Southern English → South Wales (Cardiff); added mid-twenties, pitch/pace, guard.
- :970 victoria_sterling (Despina): added late forties, low-to-mid pitch, pace, guard.
- :1138 night_guard (Algieba): Estuary → Estuary (Essex); added pitch/pace, guard.
- :1332 danny_foster (Iapetus): "English Midlands" → East Midlands (Nottingham); added pitch/pace, guard.

### m04_critical_failure/scenario.json.erb
- :458 opening_briefing_cutscene (HaX), new, Aoede, the m01 briefing style.
- :534 agent_0x99 (HaX phone), new, Aoede, the m01 phone style.
- :960 agent_0x99_debrief: added guard and "Use a steady, mid-range pitch."; scene part kept.
- :1021 robert_vance: Charon → **Orus**; North-East (Teesside), mid-fifties, firm low-to-mid pitch, brisk; personality kept.
- :913 robert_vance_phone, new, Orus, same identity + "Speaking over a phone line from the control room."
- :517 security_guard, new, Schedar, West Country (Bristol), mid-fifties.
- :1327 operative_cipher, new, Fenrir, Dutch-accented English (Rotterdam), late twenties.
- :1463 operative_relay, new, Pulcherrima, Scottish (Edinburgh), late thirties.
- :1555 voltage, new, Alnilam, South African English (Johannesburg), mid-forties, ex-grid engineer.
- :1604 operative_static, new, Umbriel, Polish-accented English, early thirties.

### m05_insider_trading/scenario.json.erb
- :596 opening_briefing (HaX), new, m01 briefing style.
- :659 agent_0x99_handler (HaX phone), new, m01 phone style.
- :1024 closing_debrief_trigger: added guard and pitch sentence.
- :951 recruiter, new, Gacrux, educated American (DC / Mid-Atlantic), fifties, `en-US`.
- :1401 patricia_morgan, new, Kore, South Wales (Cardiff), early fifties, ex-military.
- :992 patricia_phone, new, Kore, same identity + "On the phone."
- :1109 lisa_park, new, Laomedeia, British-Korean, south-west London (New Malden), early thirties.
- :1154 owen_gallagher, new, Puck, Manchester, late twenties.
- :1356 dr_halloran, new, Erinome, educated Irish (Dublin), mid-forties.
- :1501 david_torres, new, Schedar, light Castilian Spanish in fluent British English, late forties.

### m07_architects_gambit/scenario.json.erb
- :639 agent_0x99: inserted the canonical "Use a steady, mid-range pitch."; scene part kept.
- :866 jake_morrison (Puck): added mid-thirties, low flat pitch, pace.
- :934 the_architect: Enceladus → **Sadaltager**; man in his sixties, faintly mid-Atlantic unplaceable English (per the bible's W. European / N. American), low pitch, slow pace; `fx` kept.
- :1178 elena_rodriguez (Leda): added early thirties, mid-range pitch.
- :1329 james_mercer (Iapetus): added low-to-mid pitch.
- :1483 thomas_park (Rasalgethi): added forties, mid-low pitch, steady pace.

### m08_the_mole/scenario.json.erb
- :504 agent_0x99 and :1292 agent_0x99_person: inserted the canonical pitch sentence; scene parts kept.
- :1109 agent_nightshade and :1216 nightshade_confrontation: Charon → **Enceladus**; m02 identity text + scene part.
- :856 agent_cipher (Iapetus): RP → educated Scottish (Glasgow), early thirties, mid-to-high pitch.
- :945 agent_phantom (Fenrir): RP → light educated Ghanaian English (raised in Accra, educated in London), early forties.
- :891 background_analyst: Kore → **Vindemiatrix** (Kore is ATHENA); RP → British-Indian, East Midlands (Leicester), mid-twenties.
- :1310 background_agent (Puck): RP → Geordie (Newcastle), forties.

## (d) Proposed changes

### m06 Follow the Money: for the orchestrator to apply

The file is being edited by another agent and line numbers are moving, so each change is keyed by NPC id. Replace only the listed fields in that NPC's `"voice"` block. Cached audio lost: m06 has only 3 files.

1. **agent_0x99_handler**: add the canonical HaX pitch sentence.
   `"style": "Intelligence handler speaking over a secure phone line. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Quick, warm, slightly wry."`
2. **satoshi_nakamoto**: stop sharing Charon with Netherton (the villain's confrontation would sound like the Director). The age is my choice; check it against m06's ink.
   `"name": "Umbriel"`
   `"style": "Charismatic ideologue and exchange founder in his early forties, entirely unrepentant. Speak with a consistent American West Coast (San Francisco) accent throughout — do not shift to any other accent. Warm, mid-low pitch; calm, unhurried pace. Faintly amused, as if the conversation is going exactly the way he expected."` (language stays `en-US`)
3. **irina_volkova**: the name implies Russian; add pitch.
   `"style": "Brilliant academic cryptographer, mid-thirties, Moscow-educated and ten years in British academia, guarded and precise. Speak with a consistent light Russian accent in fluent English throughout — do not shift to any other accent. Low-to-mid pitch; measured pace. Dry and tightly controlled."` (name stays Kore)
4. **trader_npc** (Dani Okonkwo): the surname implies British-Nigerian; add age and pitch. The ink uses "they"; Puck is a male-sounding voice, so check that matches the sprite.
   `"style": "Young cryptocurrency trader in their early twenties, British-Nigerian, jittery on caffeine and increasingly frightened by what they have noticed. Speak with a consistent south-east London (Peckham) accent throughout — do not shift to any other accent. Mid-to-high pitch; fast, nervy pace, over-explaining."`
5. **blockchain_analyst** (Priya Raghavan): the name implies a British-Indian family; give a region and pitch. The ink says mid-thirties.
   `"style": "Blockchain forensics analyst in her mid-thirties, British-Indian, who loves the work and has not yet understood what her own graph proves. Speak with a consistent Northern English (Leeds) accent throughout — do not shift to any other accent. Bright, mid-to-high pitch; quick pace. Enthusiastic and technical."`
6. **checkpoint_guard**: give a region and pitch.
   `"style": "Contract security guard in his forties on a long shift. Speak with a consistent South London accent throughout — do not shift to any other accent. Low, flat pitch; slow, procedural pace. Unimpressed; goes by his list and nothing else."`

After applying, m06 has no two characters sharing a voice name (Aoede, Charon, Enceladus, Alnilam, Kore, Puck, Leda, Umbriel, Algenib).

### m01 and m02: need your approval

These are finished missions with large caches (m01 769 files, m02 847). Each change discards every cached line for that character in that mission. I recommend items 1 and 2. The rest are optional polish.

1. **m02 dr_sarah_kim** (`scenarios/m02_ransomed_trust/scenario.json.erb:2449`). Recommended. This is the thinnest definition among the prominent characters: no guard, age, pitch or pace. Discards all of Dr Kim's m02 lines.
   `"style": "Hospital chief executive in her early fifties, British-Korean, privately educated. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Controlled mid-range pitch that keeps catching; clipped, careful pace. Authoritative on the surface, guilty and frightened underneath."` (name Achernar, en-GB unchanged)
2. **m01 maya_chen** (`scenarios/m01_first_contact/scenario.json.erb:1732`) and the voicemail **patricia_desk_phone** `ttsVoice` (`:1626`). Recommended. There is no age, pitch, pace or region. Discards Maya's lines and the voicemail.
   maya_chen: `"style": "Content analyst in her late twenties. Speak with a consistent Chinese-American (California) accent throughout — do not shift to any other accent. Soft, mid-to-high pitch; quiet, hesitant pace. Nervous and concerned."`
   patricia_desk_phone: the same text + " Speaking quietly, like she doesn't want to be overheard."
3. Optional: add an age to the identity of **m01 sarah_martinez** (Irish → "Irish (Dublin)", age), **kevin_park** and the Kevin voicemail `reception_desk_phone` (Australian → e.g. "Australian (Sydney)", age) and **derek_lawson** (age). Each discards that character's m01 lines.
4. Optional, not recommended: add an age to the recurring identities (HaX "late thirties", Netherton "late fifties", per the bible). This would have to be applied in every mission at once to keep them identical, which discards all HaX and Netherton audio in m01–m08.
5. Optional, not recommended: state an accent for the narrator in m01/m02 to match m07/m08 ("British Received Pronunciation"). It discards every narrator line in m01 and m02, and Algenib with en-GB already sounds British.
6. No change suggested: in m02, Charon is shared by Netherton and Gary Whitlock, and Enceladus by Nightshade and Graham Reeves. Neither pair ever shares a scene, and both pairs have distinct accent prompts.

### Other notes (not acted on)
- `scenarios/m08_the_mole/CONTRACT.md:21-29` cast table still lists Nightshade as Charon and the Junior Analyst as Kore.
- m07 `jake_morrison`: PASS3 log records the decision to rename him Ray Hollis, ids included. The voice block will carry over unchanged when that happens.
