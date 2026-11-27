# sis02 cast design (Albion Energy Storage)

Draft for the user, 2026-10-05. Nothing here has been generated or wired yet.

Albion Energy Storage is a 200 MWh lithium-ion battery site on the Trent near Newark, Nottinghamshire. The game opens at 06:30 on Saturday 21 March 2026: just after sunrise, still GMT (the clocks go forward on 29 March), a few degrees above freezing. Most voices are East Midlands. Each character's look and voice should fit their name and role.

Who is where that morning:

- **On site:** Helen Marsh, alone apart from the player's team (the contractors "booked for the seven o'clock window on the grid PLC", `ink/npc_helen_marsh.ink:61`). Marcus confirms it: "Whitworth's on leave, so it's me and Helen this morning" (`ink/npc_marcus_webb.ink:65`).
- **Off site, by text:** Marcus Webb at home (`ink/npc_marcus_webb.ink:2`) and Tom Hadley at the CastleTech SOC (`ink/npc_tom_hadley.ink:2`, `:43`). Both are phone contacts whose texts are never voiced: bark TTS is only for person NPCs (`public/break_escape/js/systems/npc-manager.js:1099`, `phone-chat-speaker.js:14`).
- **Arrives late:** Priya S. from the NCSC, hidden until the safe state or the evacuation (`scenario.json.erb:887`, `:893-898`), then in the control room.
- **Gone home:** Jay Patel, the night operator (handover sheet, `scenario.json.erb:1147`; `ink/npc_helen_marsh.ink:63`).

Attire conventions for Albion (a typical UK grid battery site; details are Albion's own choices):

- Site staff wear an **orange hi-vis vest** outside and in the battery halls, over their own warm layer. Orange matches the art Helen already uses (`female_telecom_v2`), so new and old art agree.
- The warm layer is a **plain navy site fleece** with no logo. Logos and piping do not survive at pixel-art size, and there are no real company brands.
- **Safety boots** and dark work trousers. Safety glasses go on in the halls, but nobody is shown wearing them in the control room.
- **No hard hats.** The halls and the control room are indoors with no overhead work today, and a hat hides the face in a 32 px sprite.
- **No arc-rated clothing.** Nobody is doing live DC work this morning.
- Staff wear an Albion site ID on a lanyard. A visitor gets a **red VISITOR lanyard**, which matches the art Priya S. already has.
- Off-site people wear what they would wear where they are: Marcus is at home, and Tom is on the last hour of a SOC night shift.

## Cast

| Key | Character | Role and where | Look and attire | Accent |
|---|---|---|---|---|
| `helen_marsh` | Helen Marsh | SCADA engineer, the senior person on site. Person NPC in the control room. | White British woman, late 40s, fair skin a little weathered, shoulder-length mid-brown hair greying at the temples, tied back in a low ponytail. No make-up. Plain navy site fleece zipped to the collarbone, orange hi-vis vest over it, a handheld radio clipped to the vest, dark grey work trousers, black safety boots, Albion site ID on a lanyard. Steady and a little tired: she came in early for the PLC window and has not sat down. | Nottingham, East Midlands |
| `priya_s` | Priya S. | NCSC incident manager (surname withheld). Person NPC, control room, late in the game. | Unchanged from sis01 (`scenarios/sis01_healthcare/CAST_DESIGN.md`): British Indian woman, early 40s, medium-brown skin, black hair tied back, dark navy suit, white shirt, red VISITOR lanyard. She stays in the control room, so she needs no hi-vis. | Neutral southern English |
| `marcus_webb` | Marcus Webb | OT Security Manager. Phone contact, at home. | White British man, mid-40s, short dark hair going grey, stubble. His contact photo is a work photo: navy site fleece and orange hi-vis vest, as on site. (At home this morning he is in a hoodie at the kitchen table, but nobody sees that.) | Lincoln, Lincolnshire (Newark is on the county border) |
| `tom_hadley` | Tom Hadley | CastleTech SOC analyst on the managed service. Phone contact, at the SOC. | British man, late 20s, short dark hair, stubble at the end of a twelve-hour night shift. Open-neck shirt with the sleeves rolled up, no tie, a headset round his neck, CastleTech lanyard. Office clothes, no site PPE. | Derby, East Midlands (the pack does not say where CastleTech is; Derby is this document's choice) |

**Background figures.** None recommended. The story depends on Helen being on her own: Jay Patel has gone home, and his handover sheet in the desk drawer is how he appears (`scenario.json.erb:1147`). A static Jay would contradict Helen ("Jay was on nights", `ink/npc_helen_marsh.ink:63`) and Marcus ("it's me and Helen this morning"). The fire service arrives only in the evacuation ending, when Hall 1 is theirs and the game is about to close (`ink/npc_helen_marsh.ink:360`); a static firefighter there would add nothing the narration does not already say.

The player sprite (`male_nerd`, red T-shirt, `scenario.json.erb:140`) is out of scope here; it is shared across missions.

## Voices

No voice change is needed. Current settings, quoted from `scenario.json.erb`:

| Character | Voice | Current style | Proposal |
|---|---|---|---|
| Narrator (`:133-134`) | Charon | "Calm, precise narrator; measured industrial tone; unhurried" | Keep. |
| Helen Marsh (`:595-596`) | Aoede | "Senior SCADA engineer in her late forties from Nottinghamshire; warm, plain-spoken and calm under pressure. Speak with a consistent East Midlands (Nottingham) accent throughout. Do not shift to any other accent." | Keep. It already matches the age, accent and manner above. |
| Priya S. (`:877-878`) | Leda | "NCSC incident manager in her early forties, calm, forensic, unhurried. Speak with a consistent neutral southern English accent throughout — do not shift to any other accent." | Keep. It is identical to sis01 (`scenarios/sis01_healthcare/scenario.json.erb:2362-2363`), so she sounds like the same person in both games. The old dash is existing text, not new. |
| Marcus Webb (`:916-917`) | Charon | "Frustrated but controlled OT security manager; speaks with precision" | No change needed: phone texts are never voiced, so this block has no effect. |
| Tom Hadley (`:990-991`) | Charon | "Competent SOC analyst; helpful but aware of scope limitations" | No change needed, for the same reason. |

Within sis02 the voiced cast (Narrator Charon, Helen Aoede, Priya Leda) has no shared voices. Marcus and Tom share Charon with the Narrator, which only matters if they are ever made voiced. If that happens, swap them off Charon first and add an accent sentence in the house pattern, for example:

- Marcus Webb: "OT security manager in his mid-forties from Lincoln; frustrated but controlled, speaks with precision. Speak with a consistent Lincolnshire accent throughout. Do not shift to any other accent." (with a voice nobody else in sis02 uses)
- Tom Hadley: "SOC analyst in his late twenties from Derby at the end of a night shift; helpful but careful about what his contract covers. Speak with a consistent East Midlands (Derby) accent throughout. Do not shift to any other accent."

Changing a voice style re-voices every line for that character, because the TTS cache key includes it. The 137 files in `tts_cache/sis02_energy/` come from before the rewrite, and Helen and Priya are due to be re-voiced in full anyway (`docs/agents/RESUME.md:96`), so a decision now costs nothing extra.

## Asset plan and reuse options

Art goes in `public/break_escape/assets/characters/`. Costs use the playbook figures (`docs/agents/SIS_IMPROVEMENT_PLAYBOOK.md:88`): about **125** generations for a full walking character with lip sync, about **50** for a bust-only character, and a phone headshot counted as a bust. The measured per-stage costs in the `pixellab-character-pipeline` skill (bust 1 per variant, talk 2 per variant, visemes about 36, walk character 20 to 40 plus 48 for the six animations) suggest a headshot alone, with no talk sheet or visemes, would really cost nearer 5 to 10. The totals below use the playbook figures so they are not underestimates.

### Helen Marsh

What she has now (`scenario.json.erb:589-590`):

- Walk: `female_telecom_v2` (8 directions, all six standard animations, 256 frames). No other scenario uses it, so she does not share a body with anyone in the SIS games.
- Lip sync: `female_telecom_visemes.png` (7 shapes at 128 px), made from the older `female_telecom` bust, not from v2. The hair and vest are close enough that the mismatch is hard to see.
- No `spriteTalk`. The engine derives `female_telecom_v2_talk.png`, which does not exist (`person-chat-portraits.js:369-381`), so the viseme sheet is her only portrait. A matching 2x2 talk sheet, `female_telecom_talk.png`, already exists and is unused.
- Problems with the borrowed art: it reads as a woman in her late 20s, and it has a short-sleeved polo under the vest. Her voice says late forties, and nobody stands in a short-sleeved polo on a March dawn call-out. The orange vest and brown hair are right.

Options:

| Option | What it means | Generations |
|---|---|---|
| H0 Reuse as is | Keep the walk sheet and visemes. Optionally add `"spriteTalk": "assets/characters/female_telecom_talk.png"` as a fallback if the viseme sheet fails to load. | 0 |
| H1 Bespoke bust, borrowed body | Gemini concept from the look above, then PixelLab bust, talk sheet and visemes (`helen_marsh_talk.png`, `helen_marsh_visemes.png`). Keep `female_telecom_v2` for walking. Keep the orange vest and brown hair in the concept so the 32 px walker still matches the portrait. | about 50 |
| H2 Full bespoke | As H1, plus a walk character with the six standard animations, imported as `helen_marsh`. | about 125 |

**Recommendation: H1 when there is budget, H0 until then.** Students look at Helen's portrait through most of the game's dialogue, so the age and the fleece show there. At walking size the borrowed body reads as "site engineer in orange hi-vis", which is all it needs to say, and she barely walks.

### Priya S.

Nothing new is needed. sis02 already wires sis01's art (`scenario.json.erb:870-872`): `priya_s.png`/`.json` (8 directions, six animations, 256 frames), `priya_s_talk.png`, `priya_s_visemes.png`/`.json` and `priya_s_headshot.png` all exist. The suit and red VISITOR lanyard suit a visiting NCSC officer who stays in the control room. **0 generations.**

### Marcus Webb (phone headshot only)

Now: `male_telecom_headshot.png` (`scenario.json.erb:914`): a young man in a blue cap and yellow hi-vis. The same face is a contact in m04 (`scenarios/m04_critical_failure/scenario.json.erb:1050`, `:1158`) and m05 (`scenarios/m05_insider_trading/scenario.json.erb:1264`).

| Option | What it means | Generations |
|---|---|---|
| M0 Swap to `male_telecom_v2_headshot.png` | An older man with stubble, a cap and hi-vis. Closer to mid-40s, and no scenario uses it as an avatar. The yellow vest is off Albion's orange convention, which hardly shows at 32 px. | 0 |
| M1 Bespoke headshot | Concept, then a PixelLab bust downscaled to a 32 px headshot (`marcus_webb_headshot.png`). No talk sheet or visemes while his texts are unvoiced. | about 50 (playbook), likely 5 to 10 |

**Recommendation: M0.**

### Tom Hadley (phone headshot only)

Now: `male_office_worker_headshot.png` (`scenario.json.erb:988`). **This clashes with sis03**, where the same face is James Whitworth, Albion's General Manager (`scenarios/sis03_cyber_insurance/scenario.json.erb:740`). Students who play sis02 and then sis03 would see Tom's face on Whitworth. The face is also used in m04 and m06.

| Option | What it means | Generations |
|---|---|---|
| T0 Swap to `male_office_worker_v2_headshot.png` | A tired-looking man with stubble, an open collar and a loosened tie: close to a SOC analyst at the end of a night shift. No scenario uses it as an avatar. | 0 |
| T1 Bespoke headshot | Concept, then a PixelLab bust downscaled to a 32 px headshot (`tom_hadley_headshot.png`), with the headset. | about 50 (playbook), likely 5 to 10 |

**Recommendation: T0.** Do it whatever else is decided, to clear the sis03 clash.

### Other reuse candidates checked and rejected

- `engineer_female`: the same red T-shirt and glasses as `male_nerd`, the player sprite. Wrong look for Helen.
- `female_scientist_v2`, `female_office_worker_v2`, `female_security_guard_v2`: lab coat, office suit or uniform, and all are used in other missions (`female_office_worker_v2` is Eleanor Vance in sis03).
- sis01's named staff (`ravi_anand`, `david_osei`, `helen_carver` and the rest): bespoke faces of other people in the same series. Reusing them would look like the same person in a different job.

## Spend estimate

| Character | Full bespoke | Recommended |
|---|---|---|
| Helen Marsh | H2: 125 | H1: 50 (or H0: 0) |
| Priya S. | 0 | 0 |
| Marcus Webb | M1: 50 | M0: 0 |
| Tom Hadley | T1: 50 | T0: 0 |
| Background figures | 0 (none) | 0 |
| **Total** | **about 225** | **about 50** |

Using the measured per-stage costs for the two headshots instead of the playbook's bust figure, full bespoke comes to about 135 to 145.

**Recommended minimum spend: 0 generations.**

1. Tom: `avatar` → `assets/characters/male_office_worker_v2_headshot.png` (clears the sis03 Whitworth clash).
2. Marcus: `avatar` → `assets/characters/male_telecom_v2_headshot.png`.
3. Helen: keep `female_telecom_v2` and `female_telecom_visemes.png`, and add `"spriteTalk": "assets/characters/female_telecom_talk.png"` as a fallback.
4. Priya: no change.

These are three one-line edits in `scenario.json.erb` for whoever owns that file next. If the user then wants to spend, the one purchase worth making is Helen's bespoke bust (H1, about 50). Following the playbook, her Gemini concept goes to the user for approval first, and `python3 tools/pixellab_pipeline.py balance` (which shows generations remaining) is checked before any PixelLab call.

## Status

- 2026-10-05: draft written for the user's review. No art generated and no scenario edits made.
