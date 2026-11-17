# m08 The Mole: office-life plan

Base: main `a5b0c4a96`. Evidence: ANALYSIS.md. Baseline: BASELINE.md.

## 1. Decision

A busier office would distract from this mole hunt (ANALYSIS.md, "Why more people would hurt the mole hunt"). m08 gets room tone only: no people, lines, globals, objects or presets.

## 2. Change

Add `"roomTone": true` and a `roomToneTypes` map to scenario.json.erb:

| Room | Profile | Why |
|---|---|---|
| room_hq_lobby, room_hq_director, room_hq_intel | quiet_office (air handling at 0.35, no spots) | still building at night |
| room_hq_ops, room_hq_crypto | it (air handling at 0.8) | equipment-heavy rooms |
| room_hq_servers | server (ventilation at 0.6) | server room |
| room_hq_break | kitchen (fridge hum at 1.0) | kitchen |
| room_hq_archives, room_hq_interview | unmapped, silent | sealed rooms; silence suits them |

The lobby avoids the reception profile, whose distant-phone spots would ring at night and suggest a phone to answer. The ops floor avoids the office profile, whose copier_run spots would play in an empty room.

## 3. Left alone

The break room, crypto lab, interrogation suite, intel, director's office and archives get no people (the post-it, lockers and witness line of sight; the plot-located suspects; the fixed beats). All 12 NPC records stay unchanged. Story NPCs stay where the plot needs them; VM flags are untouched. officePresets stays off.

## 4. Expected results

- Lock and key diff against baseline_locks.json: empty.
- No change to sync or player_state.
- V1 summary unchanged; V6 still 0 clips.
- SPOKEN_LINES.md: no lines.

## 5. Tests

1. Validator: 0 errors, the same 4 warnings, roomToneTypes accepted.
2. Keyless server on :3091, fresh game: walk all nine rooms; check `soundManager.currentAmbient` and `window.officeRoomTone.log` ("started" entries) against the table; archives and interrogation fade to silence; one reload.
3. One scripted critical-path regression run (Haiku).
4. The user's listen check decides the beds.

## 6. Build size

One slice of about 10 lines of scenario JSON, 1 to 2 hours of agent time with the live check. No art, clips or engine change.

## 7. Open questions for the user

- Q1. The brief said "HQ by day"; m08 is at night. Recommendation: record the correction.
- Q2. Room tone with the table above: a. yes (recommended: a quiet hum adds to being watched in a still building), b. no office life in m08 at all.
- Q3. An optional night watch officer on the ops floor (a needs NPC leashed to the cooler and copier): a. no (recommended: reads as a fourth suspect, needs ink and voicing, no D53 cast member fits a SAFETYNET officer so it needs new art, and it would be attackable, needing KO handling and a debrief line), b. yes, about a tier-2 slice of a day or more plus art and voicing approvals.
- Q4. Lobby bed: a. quiet_office (recommended), b. silent.

## 8. Lab sheet

After the build lands, update the m08 game walkthrough only if room tone changes anything a student does (it should not; note it in the build report).
