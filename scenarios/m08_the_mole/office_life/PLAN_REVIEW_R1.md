# m08 office-life plan review R1

Scope: PLAN.md, ANALYSIS.md, SPOKEN_LINES.md and BASELINE.md in scenarios/m08_the_mole/office_life/ on plan/ol-m08 at 6cceb0b16. I only read files. I started no server and opened no SecGen XML or field guides. Engine paths below are relative to public/break_escape/js/ unless they start with scripts/, app/ or scenarios/.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 3 |
| Minor | 9 |

## What checks out (verified)

- **Profiles.** All six names exist with the beds and levels the plan quotes (data/room-tones.json:13-19). quiet_office is office_ambient at 0.35 with no spots, it is office_ambient at 0.8 with no spots, server is server_room_ventilation at 0.6, and kitchen is kitchen_tone at 1.0. reception has the distant_phone spot (:14) and office has copier_run and distant_phone (:13). All three beds are loaded (systems/sound-manager.js:122, :127, :129).
- **Engine path.** The engine is systems/office-room-tone.js. profileIdFor checks `scenario.roomToneTypes[roomType]` first, then the table's exact types (:42-47). It is keyed by the room's **type**: profileForRoom reads `scenario.rooms[roomId].type` (:50-53). `roomTone` is read in core/rooms.js:3280 (the bed order, systems/ambient-choice.js:30-47), in systems/npc-office-visuals.js:69-71 (roomToneOn, which gates install at office-room-tone.js:178 and the start and output sounds at :338 and :354), and in core/game.js:2108-2109, which installs it after the needs system and inside `if (window.npcManager)` at :2060 (m08 has NPCs).
- **Keys.** Every m08 room has its own bespoke type: main_lobby room_hq_lobby (scenario.json.erb:611), director_office room_hq_director (:1447), operations_floor room_hq_ops (:1625), intel_analysis room_hq_intel (:1758), server_room room_hq_servers (:1885), security_archives room_hq_archives (:1978), cryptography_lab room_hq_crypto (:2040), interrogation_room room_hq_interview (:2160) and break_room room_hq_break (:2324). The plan's keys are those types, so the map resolves. The schema allows the profile enum (scripts/scenario-schema.json:219). The validator errors on an unknown profile and warns on a type no room has (scripts/validate_npc_needs.rb:96-107), so test 1's "accepted" can be checked.
- **Bootstrap.** filtered_scenario_for_bootstrap (app/models/break_escape/game.rb:2341 onwards) deletes only named top-level keys (flags, acknowledgedClues, accountProfiles, roles, credentials and similar) and keeps each room's `type` (:2372). Nothing in game.rb touches roomTone, so both keys reach the client, as m02 already shows live (scenarios/m02_ransomed_trust/scenario.json.erb:624-625).
- **Spots at night.** None of the chosen profiles has a spot. `it` has `typing: true` (room-tones.json:15), but typing needs a seated NPC on a `work` need (systems/seating.js:1192-1196, :2339-2340), and no m08 NPC has needs, so no typing plays. The rejected profiles would have misled, as the plan says. reception's distant_phone is filtered only when the room holds a `deskPhone` object (office-room-tone.js:73, :105-113), and the lobby has none. copier_run is filtered on a copier. A Tiled-only photocopier1 gets `scenarioData.type = "photocopier"` with the digits stripped (core/rooms.js:2909-2916), which COPIER_TYPES matches (office-room-tone.js:25), so under `office` it would play on the ops floor.
- **Silent rooms.** The archives and interrogation suite fade to silence. With roomTone, step 3 needs an adjacent room with an authored ambientSound and m08 has none (BASELINE.md:76, confirmed in the rendered scenario), so they fall to step 4 (ambient-choice.js:37-47).
- **officePresets trap.** It is correct. In the rendered scenario, nightshade_desk (pc, no lockType) and cyberchef_workstation (workstation) are the only preset-eligible declared objects. badge_printer (pc) is excluded by `lockType: pin`, and the opt-out is `affordance === false` (systems/office-presets.js:51). The Tiled cooler, copier, kettle and espresso machine are not declared, so presets would not touch them.
- **Night setting.** It is right. Every citation checks out: m08_receptionist_ai.ink:17 and :31, m08_background_analyst.ink:13, m08_director_netherton.ink:202, m08_closing_debrief.ink:74, :81 and :118, and LIGHTING_PLAN.md section 1, which sets ambient #b8bfce at scenario.json.erb:606.
- **Cast table.** All 12 record lines (631 to 2363) match. The evidence lines also match: the badge audit FACILITIES entries (:2027), fingerprintCandidates (:2554), the post-it (:2426-2434) and lockpick_used_in_view (:2414).
- **Sync.** No sync or player_state change. room_tone_started has no reader outside office-room-tone.js, and nothing in app/ or any Ruby file references it. The `started` set and the log are client memory (office-room-tone.js:88-99).
- **End credits.** Ambience is suppressed at the credits (systems/sound-manager.js:550-560, music/ending-audio.js:67), so the beds stop at the ending.

## Findings

**M1 (major). Test plan section 5 does not prove the claims in sections 2 and 4.** PLAN.md:34-39.
- Nothing checks the "no spots at night" claim. Spots roll every SPOT_SLOT_MS = 20 s of needs clock (office-room-tone.js:19, :151-157), so a walk-through can miss them. Add a dwell of at least 60 s in each mapped room, with an assertion of zero `spot` entries and zero `typing` entries with count above 0 in `window.officeRoomTone.log`.
- The skill's room-tone listen through a north or south door and an east or west one is missing (.claude/skills/mission-office-life/SKILL.md:217). A null room under roomTone keeps the bed (ambient-choice.js:30, core/rooms.js:3305), which is exactly what a doorway listen tests.
- "Fresh game: walk all nine rooms" does not say how the agent reaches the locked director's office, archives, server room, crypto lab and interrogation suite. Name the route: the critical path from tools/playtest/m08-regress-trace.md, or a test-scenario copy on the branch. The standing rule is no edits to a game row's scenario or state.
- Section 4's lock and key diff, V1 diff and V6 have no commands in section 5. Add `lock_key_diff.rb` against baseline_locks.json, the `--office-summary` diff against v1_summary_base.txt, and the V6 rake line from BASELINE.md:95.

**M2 (major). Q2 is framed as all or nothing.** PLAN.md:44.
The options are seven beds or no office life. The m02 precedent mapped only two rooms, "so the noir playlist carries them" (scenarios/m02_ransomed_trust/office_life/PLAN.md:261). m08 plays noir and then threat playlists across the whole mission (scenario.json.erb:217-223), and the plan never weighs a bed in seven of nine rooms against that music. Add a middle option, for example "c. machine rooms only: server room (server) and break room (kitchen), the rest left to the music", and say which one the plan recommends and why. Q4 (lobby bed) is a sub-case of this and should fold into the Q2 options (minor, see m8).

**M3 (major). The "smaller human touch" is never offered, so Q3 is a false binary.** PLAN.md:45, ANALYSIS.md:34-38.
Q3 offers no or a new needs NPC (a day of work plus art and voicing). It misses the cheap option of a once-only voiced bark on an existing person NPC that the text already fixes in place. For example, background_analyst (voice set, ops floor, scenario.json.erb:1700) on `room_entered:operations_floor`, gated on `!globalVars.analyst_ko` and onceOnly, with a line in her established register ("Still the same paragraph"). That adds no face and no suspect, costs one clip, and barks are on main (1164500ce "TTS barks: review round 5"), so V6 counts them (skill gotchas.md:84). The skill also asks the analysis to list existing barks (SK 79). m08 has none on any NPC, which ANALYSIS.md never states. That absence is the strongest evidence of what is lost by adding no people: outside conversations the building makes no human sound at all. Add this as a Q3 option, or as a Q5 with a draft line in SPOKEN_LINES.md, and record the reasons to reject it if the plan still recommends no. Possible reasons: a bark in the suspects' room could read as a tell, and Vector shares the room.

**m1 (minor). The table's "Room" column holds room types.** PLAN.md:13-19.
roomToneTypes keys are types (office-room-tone.js:44; validate_npc_needs.rb:96-102). The plan's values are correct, but the build agent will read "Room" as a room id, and the brief already called them ids. Show both columns, for example `operations_floor` / `room_hq_ops`, and say the keys are types.

**m2 (minor). The section 2 note on the ops floor is worded loosely.** PLAN.md:21.
"copier_run spots would play in an empty room" is wrong: the ops floor holds Vector and the analyst (:1645, :1700). The real problem is a copier running at night with nobody at it. Also cite why it would fire: the Tiled copier gets type `photocopier` (core/rooms.js:2909-2916) and COPIER_TYPES matches it (office-room-tone.js:25).

**m3 (minor). The kitchen rationale may name a machine the room does not have.** PLAN.md:18, ANALYSIS.md:42.
kitchen_tone is a fridge hum (sound-manager.js:128-129), but the break room's machines are listed as espresso, kettle and vending, with no fridge. I did not trace placed gids to confirm either way. Cite the drinks vending machine as the source of the hum, or confirm a fridge is placed.

**m4 (minor). Section 3's heading reads as if those rooms get nothing.** PLAN.md:25-27.
"Left alone" lists the break room, crypto lab, intel and director's office, which section 2 gives beds. Retitle it "No people" or similar.

**m5 (minor). The fourth-suspect argument is weaker than stated.** ANALYSIS.md:36.
"A new face reads as a fourth" is the weakest of the three reasons: m08 already has two non-suspect people (the analyst and the off-duty agent) and players handle them. The Facilities-in-evidence point (:37) and the break-room crowding (:38) carry the decision; lead with those. The overall conclusion (no new people) holds.

**m6 (minor). Room-local needs for existing NPCs are dismissed in one phrase.** PLAN.md:27 ("the plot-located suspects").
The skill's protection (2), needs confined to the NPC's own room with every target in it, would technically allow Vector a cooler trip on the ops floor. Record why it is rejected: in a whodunnit, a suspect's movement reads as a behavioural tell, which ATHENA's "calmest person" hint at m08_receptionist_ai.ink:39 makes worse. Phantom's LOS challenge (range 150, angle 120) is position-dependent, and nightshade_desk is a clue surface. One sentence each closes it.

**m7 (minor). Live-check practicalities are missing.** PLAN.md:37.
- Port :3091 is not the recorded convention (:3001 for keyless drafts, :3002 for worktree proofs). Say why, or that it does not clash.
- isLoaded checks `sm.sounds[key]` (core/rooms.js:3302) and `started` requires `sm.currentAmbient === c.key` (office-room-tone.js:145). A headless run must load audio (an autoplay-permitting flag, or the recipe m02 used), or every check reads null and passes or fails for the wrong reason. Name the recipe from measurement-recipes.md.

**m8 (minor). Q4 duplicates Q2, and Q1 is a note rather than a question.** PLAN.md:43, :46.
Fold Q4 into the Q2 options. Q1's wording is fair and the evidence supports it; it could simply say "noted: m08 is set at night (ANALYSIS.md:5-7)" without asking for a decision.

**m9 (minor). The expected validator result needs one line of reasoning.** PLAN.md:36.
Section 5 says "the same 4 warnings". Add why: with roomTone on, the validator emits an info line only for profile sounds that are not loaded (validate_npc_needs.rb:116-122), and all are loaded, so no new info or warning line should appear.

## Verdict

Revise and re-review. There are no blockers. The core change works as specified: the profiles, the type-keyed map, the bootstrap pass-through, the spot-free night profiles, the officePresets trap and the night setting all hold against the code and scenario. The case against new people stands, mainly on the Facilities evidence and the crowded break room. Three things need fixing before round 2:
1. A test plan that proves the absence of spots, the door behaviour and room reachability.
2. A Q2 with a middle option that weighs the beds against the music, following m02.
3. A Q3 that offers the existing-NPC bark as the smaller human touch, with what is lost by declining it.

## Assumptions

- I treated the ops-floor photocopier as placed from ANALYSIS.md:42 and the map's tileset image (room_hq_ops.json:3514), without tracing placed gids.
- Whether the break room places a fridge is unverified (m3).
- I took build/tts-barks as landed from the main log entry 1164500ce, without diffing the branch.

## Outcomes (orchestrator)

- User decisions since this review (D76, 2026-11-17): a. room tone only; b. no night watch officer; c. lobby quiet air handling.
- M1: to fix (test plan).
- M2: resolved by D76a (the user chose room tone). The middle option (machine rooms only) moves to the live listen check: the user hears the beds against the noir and threat playlists and can drop any room then.
- M3: put to the user as a new question (one once-only analyst bark); the plan records it as open until answered.
- m1 to m9: to fix; m8's Q1 and Q4 become recorded decisions.
