# m08 The Mole: office-life plan

Base: main `a5b0c4a96`. Evidence: ANALYSIS.md. Baseline: BASELINE.md.

## 1. Decision

A busier office would distract from this mole hunt (ANALYSIS.md, "Why more people would hurt the mole hunt"). m08 gets room tone only: no people, lines, globals, objects or presets.

## 2. Change

Add `"roomTone": true` and a `roomToneTypes` map to scenario.json.erb. The keys are room types, not room ids (`profileForRoom` reads `scenario.rooms[roomId].type`, office-room-tone.js:50-53; the validator checks the same, validate_npc_needs.rb:96-107).

| Room id | Room type (map key) | Profile | Why |
|---|---|---|---|
| main_lobby, director_office, intel_analysis | room_hq_lobby, room_hq_director, room_hq_intel | quiet_office (air handling at 0.35, no spots) | still building at night |
| operations_floor, cryptography_lab | room_hq_ops, room_hq_crypto | it (air handling at 0.8) | equipment-heavy rooms |
| server_room | room_hq_servers | server (ventilation at 0.6) | server room |
| break_room | room_hq_break | kitchen (hum at 1.0) | kitchen; the hum source is the drinks vending machine (drinks_vending1), because the break room's Tiled map places no fridge (checked: the fridge images in room_hq_break.json are tileset entries only, and none is a placed object) |
| security_archives, interrogation_room | room_hq_archives, room_hq_interview | unmapped, silent | sealed rooms; silence suits them |

The lobby avoids the reception profile, whose distant-phone spots would ring at night and suggest a phone to answer (D76c: the lobby gets quiet air handling). The ops floor avoids the office profile because of its copier_run spots: the Tiled photocopier1 gets `scenarioData.type = "photocopier"` with the digits stripped (core/rooms.js:2909-2916), COPIER_TYPES matches that (office-room-tone.js:25), so a copier would run at night with nobody at it. The floor is not empty (Vector and the analyst sit there); the copier is the problem.

## 3. No people

The break room, crypto lab, interrogation suite, intel, director's office and archives get no people (the post-it, lockers and witness line of sight; the plot-located suspects; the fixed beats). All 12 NPC records stay unchanged. Story NPCs stay where the plot needs them; VM flags are untouched. officePresets stays off.

Why the existing people get no room-local needs either (the skill's protection 2 would technically allow them):

- Vector: in a whodunnit a suspect's movement reads as a behavioural tell, and ATHENA's "calmest person" hint (m08_receptionist_ai.ink:39) makes it worse.
- Phantom: the line-of-sight challenge (range 150, angle 120) depends on where he stands.
- nightshade_desk: it is a clue surface, so it gets no preset and no use by an NPC.

## 4. Expected results

- Lock and key diff against baseline_locks.json: empty.
- No change to sync or player_state.
- V1 summary unchanged; V6 still 0 clips.
- SPOKEN_LINES.md: no lines.

## 5. Tests

Live work on this branch uses :3091. That is inside the AC4 range 3090 to 3095 for parallel worktrees; the recorded :3001 (keyless drafts) and :3002 (worktree proofs) belong to other streams. Keyless server, no TTS. Never db:create, schema:load, migrate or reset (shared dev database).

1. Validator: 0 errors, the same 4 warnings, roomToneTypes accepted. Reasoning: with roomTone on, the validator emits an info line only for profile sounds that are not loaded (validate_npc_needs.rb:116-122); all three beds are loaded (sound-manager.js:122, :127, :129), so no new info or warning line should appear.
2. Diffs and counts:
   - `ruby scripts/lock_key_diff.rb scenarios/m08_the_mole/scenario.json.erb scenarios/m08_the_mole/office_life/baseline_locks.json`: empty.
   - The `--office-summary` output diffed against v1_summary_base.txt: unchanged.
   - V6: `env -u GEMINI_API_KEY RBENV_VERSION=2.7.8 bundle exec rake "app:break_escape:tts:office_lines[m08_the_mole]"` from the worktree root: `Total: 0 office-life clip(s)`.
3. Audio in headless runs. `isLoaded` checks `sm.sounds[key]` (core/rooms.js:3302) and `started` needs `sm.currentAmbient === c.key` (office-room-tone.js:145), so unloaded audio makes every check read null and pass or fail for the wrong reason. Launch Chromium with `--autoplay-policy=no-user-gesture-required`, as tools/playtest/chatter-falloff-proof.mjs does (line 20), wait for `__test.waitUntilReady`, and set `setFPS(20)` with fixed steps on. The skill's measurement-recipes.md holds no audio-loading recipe, so this is the repo precedent; confirm `soundManager.sounds` holds the three beds before reading any result.
4. Route to the locked rooms. Use the critical path in tools/playtest/m08-regress-trace.md (ATHENA gives TrustNoOne for the archives door; the lobby printer code 0311 gives the server-zone badge; the director safe code 2407 gives the key; the crypto lab and interrogation door follow), played on a fresh game from `tools/playtest/new-game.rb m08_the_mole`. If a faster route is needed, use a test-scenario copy on this branch. Never edit a game row's scenario or state.
5. Fresh game: visit all nine rooms and check `soundManager.currentAmbient` and `window.officeRoomTone.log` ("started" entries) against the table; the archives and interrogation suite fade to silence; one reload.
6. Dwell: stay at least 60 s in each mapped room (spots roll every SPOT_SLOT_MS = 20 s of needs clock, office-room-tone.js:19, :151-157, so a walk-through can miss them). Assert zero `spot` entries and no `typing` entry with a count above 0 in `window.officeRoomTone.log`.
7. Door listen (skill line 217): through one north or south door and one east or west door, check what plays. A null room under roomTone keeps the bed (ambient-choice.js:30, core/rooms.js:3305), which is what a doorway listen tests.
8. One scripted critical-path regression run (Haiku).
9. The user's listen check decides the beds. It plays them against the noir and threat playlists (scenario.json.erb:217-223), and the user may drop any room then. Machine rooms only (server room and break room) stays as a fallback.

## 6. Build size

One slice of about 10 lines of scenario JSON, 1 to 2 hours of agent time with the live check. No art, clips or engine change.

## 7. Decisions and open questions

Settled by the user (D76, 2026-11-17):

- a. Room tone only. The user chose room tone over no office life; the middle option (machine rooms only) is not offered as a choice, it stays as the listen-check fallback (section 5, item 9).
- b. No night watch officer. Reasons recorded earlier: reads as a fourth suspect, needs new art and ink, and would be attackable.
- c. The lobby gets quiet air handling (quiet_office).

Note: the brief said "HQ by day"; m08 is set at night (ANALYSIS.md, "The setting is night"). No decision needed.

Open:

- Q5. One once-only voiced bark from background_analyst on first entering the operations floor, in her established register, gated on her not being knocked out (`!globalVars.analyst_ko`): a. no human sound outside conversations (as now), b. yes, one clip. Draft line: SPOKEN_LINES.md, "Pending Q5". Recommendation: b. For: one clip and no new face; m08 has no bark on any NPC, so outside conversations the building makes no human sound at all. Against: a bark in the suspects' room could read as a tell, and Vector shares the room. The draft holds no clue and names no suspect, so I found no concrete clue risk. Until answered the plan builds a (no bark).

## 8. Lab sheet

After the build lands, update the m08 game walkthrough only if room tone changes anything a student does (it should not; note it in the build report).
