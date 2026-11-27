# Handover: office life slice 20, room tone (2026-11-07)

**Status: DONE (2026-11-07, second agent). A listen on a machine with audio is still needed: headless audio is inaudible, so every
beat was proved from the sound manager's volumes and logs.** Live proof games 996 (room tone), 999 (sis01 without roomTone), 1000
(leash, pass), 1001 (lab, score 100, USB 12 s, creds 63 s). `bin/test-js` 410/411 (desk-footprints, seat box commit 594226d2c). Results:
sims README "Slice 20"; plan 12.6 "Built". Open for the user: the shipped `fadeAmbientTo` start-volume spike; a possible faint tick at
the office and kitchen OGG loop seams. The "Left" list below is kept as written for the record. Earlier status: IN PROGRESS (handed over at the ~80-call budget). Plan: `OFFICE_LIFE_PLAN.md` 12.6 (spec), 12.8 row 8, 12.9 Q40/Q57.
Evidence: session scratchpad `s20/` (`lib.py`, `proof.py <game> walk|turnback|state`, `static_check.rb`, `testjs1.txt`,
`walk-995.json`, `turnback-995.json`).

## Done (commits on main)

- 881c13d1a engine + node tests: `systems/ambient-choice.js` (pure; without roomTone it is the old rooms-order loop, with it
  the four-step order, open door first, unloaded key = no bed, null room = keep); `core/rooms.js` calls it, sets
  `window.ambientChoice` under roomTone, exports `refreshAmbient()` (also `window.refreshAmbient`); `sound-manager.js`: seven
  new keys with CC0 credit comments (loops OGG only, no MP3 fallback files exist), key checked before any stop, an unknown key
  fades the current loop through the volume-0 path (the one change for everyone), `{ crossfade }` with `_outgoing` /
  `_outgoingTween`, turn-back, an older outgoing stopped at once, `_ambientLevel`, `setAmbientDuck`, `fadeLoopTo` (typing),
  suppressAmbience clears them; `systems/office-room-tone.js` (table load then `refreshAmbient`, duck, typing by count capped
  at 3, seeded spots every 20 s of needs clock, `room_tone_started:<room>`); `data/room-tones.json` (7 types, 3 beds);
  `npc-needs.js`: `npc_use_started:<obj>` via world.emit, `_heardUntil` in `_speak` for overheard lines, adapter emits
  `object_revealed:<producer>` `{ cosmetic: true }`; `npc-office-visuals.js`: `roomToneOn`, `onUseStarted` (startSound),
  `onRevealed` (outputSound, producerId only), installs with roomTone too; `seating.js`: `window.officeTypists`;
  `core/game.js` install; presets: `kettle` split (startSound kettle_boil), coffee startSound coffee_machine, copier
  outputSound copier_run; `test/js/room-tone.test.mjs`; office-presets test kettle1 -> 'kettle'. 2db.. test fix commit after it.
- 8ad1c6e4e validator (`validate_npc_needs.rb` check_room_tone, start/outputSound keys; `validate_scenario.rb` top-level
  whitelist) and schema (`roomTone`, `roomToneTypes`, `startSound`, `outputSound`, `kettle` enum); validator fixtures.
- 8006044a0 showcase: test_needs_sims `"roomTone": true`, task `hear_office` on `room_tone_started:*` (validated --no-graph:
  no errors, no room-tone warnings).
- 83f3b58e9 live fix: Phaser `play(config)` puts back the configured volume, so fades started near 1; zeroed after play on the
  room-tone paths only. **Not fixed, for the user:** the shipped `fadeAmbientTo` path has the same start spike (its
  `setVolume(0)` before `play({ loop: true })` is undone), so every shipped ambient loop starts at full and fades down.

## Tests

`bin/test-js` 410/411 pass (before 83f3b58e9; desk-footprints fails from the other session's 594226d2c, not this slice).
GOLDEN_SIMS_DAY unchanged (npc-needs-slots passes). room-tone.test.mjs 17 pass. No harness copy list needed changing (no test
copies rooms.js; new modules are imported from the repo path).

## Static check (sis01 and shipped missions)

`s20/static_check.rb` over 101 rooms in m01-m10, sis01, sis02: only sis01 `ward_7` and `it_security_office` reach an unloaded
key (`hospital_ambient`): was a cut, now a 400 ms fade. No shipped room reaches a newly loaded key; none sets roomTone.
New validator warning in sis01: `ward_7` ambientSound `hospital_ambient` not loaded (office_ambient is loaded now, so only one).

## Live proof so far (:3001, game 995, headless, my own new-game.rb id)

- Bed at spawn: room-tone log `table` then `started` office/office_ambient step 2 0.4 s later; office_ambient playing 0.5.
- East-west walk office -> kitchen -> office: crossfade calls with `{ crossfade: true }`, outgoing tracked, 120 samples at
  50 ms, **no gap** (one bed always > 0); typing faded to 0 in the kitchen and back to 0.4 (1 typist) in the office.
- Doorway (feet in the top wall rows): room null, choice `{ keep: true }`, no fade call, bed stays at 0.5.
- A background spot `copier_run` played in the office (slot 2, volume 0.09).

## Left

1. Reload game 995 (or a new game) so 83f3b58e9 is live; re-check the typing loop starts from 0.
2. Live turn-back inside 400 ms: the teleport in `proof.py turnback` did not trigger room changes (body.reset vs sprite
   position; it left the player in the kitchen). Use two `moveTo`s across the door, or body.reset with the body offset.
3. Typing with 1, 2, 3 seated workers (`npcNeedsSystem.control(id, { set: { work: 0 } })`), ducking under a voiced bark,
   a call (ring tom_phone, stand close) and an open person-chat; startSound (coffee/kettle) and outputSound (print with
   nobody at the copier: `control('tom', { print: ... })`) from `playLog` entries with `start`/`output`; the reload case.
4. Loop seams numerically (ffmpeg decode, compare seam step with median sample step) for the 3 OGGs and
   server_room_ventilation.mp3.
5. Local roomTone copies (never committed): m01 north-south door, m04 battery_hall_2, sis01 it_security_office /
   major_incident_room; and sis01 without roomTone in ward_7 / it_security_office showing the fade (fadeAmbientTo log).
6. Regressions: leash (`scratchpad/leash.py`) and lab replay (`s18a/lab_args920.json` via `scratchpad/lab.py`, then
   verify-run). Expected lab range on current main: USB 12-13 s, creds 57-65 s, score 100; on a tailgate failure retry once
   and report both.
7. Docs: 12.6 Built line, sims README live-proof table, the one slice 20 line in the lab IMPROVEMENT_LOOP_LOG (stage only
   that hunk), OFFICE_LIFE_HANDOVER_SESSION.md row, mark this file DONE. Note that a listen with real audio is still needed.

## Choices made without asking

- Spots (and startSound/outputSound) are own-room only (plan 12.6), not through an open door; openDoorHearing not used.
- Loops ship OGG only (no MP3 fallback files exist); Safari would not play them.
- Spot chance 0.5 per 20 s slot; typing levels 0.4/0.6/0.75; spot scales copier 0.6, distant phone 0.5 of a use sound.
- A profile with no bed (meeting) falls through to step 3 (an authored neighbour loop), as the four-step order reads.
- Room tone installs inside the needs install chain in game.js, so a roomTone scenario with no needs NPCs gets no room tone.
