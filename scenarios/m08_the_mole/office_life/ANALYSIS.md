# m08 The Mole: office-life analysis (Stage 1)

Base: main `a5b0c4a96`. Inputs: BASELINE.md, HANDOVER.md, scenario.json.erb and the ink.

## The setting is night

The brief assumed SAFETYNET HQ by day. The text puts it at night: receptionist_ai.ink:17, background_analyst.ink:13, director_netherton.ink:202, closing_debrief.ink:74, :81 and :118, and LIGHTING_PLAN.md section 1 (the night-shift ambient). The skill's rule for a night mission is a thinning office or nothing.

## The text pins every person in place

- The analyst: "If I leave this desk, somebody writes down that I left this desk" (background_analyst.ink:26).
- The off-duty agent: "I'm sitting where I can see the door" (background_agent.ink:37).
- ATHENA: "I log everything now" (receptionist_ai.ink:43).

## Cast (scenario.json.erb line)

| NPC | Line | Class |
|---|---|---|
| opening_briefing_cutscene | 631 | cutscene |
| receptionist_ai | 694 | story-critical, not human |
| agent_0x99 | 767 | phone |
| closing_debrief | 1270 | cutscene |
| director_netherton | 1464 | story-critical |
| agent_vector | 1645 | suspect |
| background_analyst | 1700 | fixed by the text |
| agent_phantom | 1771 | suspect, line of sight |
| agent_nightshade | 2057 | suspect |
| nightshade_confrontation | 2194 | second record of one character |
| agent_0x99_person | 2337 | fixed by the text |
| background_agent | 2363 | witness, line of sight; lockpick_used_in_view at 2414 feeds the tip-off chain at 1165 to 1216 |

None of these gains needs.

## Why more people would hurt the mole hunt

- "Facilities" is already a name in the evidence: the badge audit (:2027), fingerprintCandidates (:2554) and ATHENA's kettle hint pointing at the post-it (:2426 to :2434). A cleaner or facilities NPC would look like a suspect.
- The break room's only coffee point holds the post-it, beside the three lockers and inside the witness's line of sight. Staff using it would crowd a clue.
- The puzzle is a closed list of three suspects. A new face may read as a fourth, though this is the weakest reason: m08 already has two non-suspect people (the analyst and the off-duty agent) and players handle them.

The room-local needs of the existing people are rejected too (PLAN.md section 3): a suspect's movement reads as a tell, Phantom's line-of-sight challenge is position-dependent, and nightshade_desk is a clue surface.

## Barks today

No m08 NPC has any bark: no `eventMappings[].bark` exists in scenario.json.erb. Outside conversations the building makes no human sound at all. PLAN.md Q5 offers one once-only analyst bark as the smallest human touch.

## Machines in the maps

Break room: qdc_espresso1, kettle1, drinks_vending1 (no fridge is placed in room_hq_break.json, so the kitchen hum is the vending machine's). Ops floor: water_cooler1, photocopier1. Crypto lab: shredder1. None is declared as an affordance. All nine room types are bespoke room_hq_* types.

## officePresets trap

Turning presets on would give nightshade_desk (type pc, no lockType) and cyberchef_workstation (type workstation) the desk_pc preset. The opt-out is `"affordance": false` on each (js/systems/office-presets.js:51). The plan leaves presets off.

## Secrets

Office life adds no items, so nothing new can carry a secret.

## Sound today

No room authors an ambientSound, so m08 has music and no room sound at all. office_ambient is air handling only, with no murmur (OFFICE_LIFE_SOUND_CREDITS.md:9); beds do not bleed between rooms; typing needs a `work` need (seating.js isTyping), so none plays; beds duck under conversations.

## Tier

Tier 0 plus room tone.
