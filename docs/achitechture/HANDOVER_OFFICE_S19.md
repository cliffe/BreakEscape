# Handover: office life slice 19, desk-phone calls (2026-11-07)

**Status: IN PROGRESS, handed over part-way (the first session hit its tool-call budget, as
expected for the largest slice).** Engine, validator, schema, node tests and showcase are built and
committed; `bin/test-js` passed in full (408 files) after the engine commit. Live proof has case A
only. Left: the rest of the live proof, regressions, docs.

Plan: `OFFICE_LIFE_PLAN.md` 12.5 (spec), 12.8 row 7 and the files list, 12.9 OQ37-39, OQ48, OQ53,
OQ55, 13f. Hand-offs: `HANDOVER_OFFICE_S21.md` (call speakers in `_buildSpeakers`: done),
`HANDOVER_OFFICE_S18A.md` (`answered` / `rang_out`: done), `HANDOVER_OFFICE_S16.md` (flash, glyph,
limiter channels: used), `HANDOVER_OFFICE_S15.md` (exchange machinery: reused).

## Done (commits on main; `git log --oneline --grep "slice 19"`)

- c95a2fcb2 engine and tests:
  - `npc-needs.js`: `RING_MS` 3000, `RINGS` 4, `PICKUP_MS` 2250, `CALL_GAP_MS` [1500, 3000],
    `CALL_POOL_LINES` 3, `CALL_PICTURES` 3; `PICTURE_CHATTER.phone` / `phone_message` (icon `phone`,
    i.e. `icons/npc-phone.png` in picture chat). State `call: { phoneId, until }`; `_rings`,
    `_calls`, `_callSeq` (cleared by `reset`). `onPhoneRing(phoneId)` (ignored, `ring_ignored`,
    while ringing or in a call, or for an object with no `phoneOwner`); `_tickRings` before the NPC
    ticks; `_ownerCanAnswer` (idle or own-desk `using` at its post, not frozen, in a chat,
    blocked, suspended or on a call); `_ownerAnswers` (turns answerers back `answered`);
    `_claimAnswerer` (from ring 2, nearest `answersPhones` NPC idle at its post in the phone's
    room, not avoiding the owner either way, reachable; `_chooseCall` at the claim, then
    `_startJob` with `phoneCall`); `_endAnswerer` (frozen: job cleared, `prevMode` returning, no
    move; else `_turnBack`); `_ringOut`; `_colleagueAnswers` (on arrival; `useUntil` = call length);
    `_chooseCall` (first unheard own-line knot, else pool lines from the bag, else pictures; seeded
    gaps via `roll(npcId, 'callgap:<seq>:<i>')`; capped at `EXCHANGE_MAX_MS`); `_beginCall`
    (owner's own-desk `useUntil += total`); `_tickCalls` after `_tickChats`; `_finishCall`
    (`heard_<knot>`, `npc_call_heard:<knot>` only if every line was voiced); `_hangUp`
    (`desk_phone_hung_up` `{ speakerId, reason }`, `world.cancelSpeech`, colleague remainder 0,
    owner's desk use loses the rest of the call); `_delayCall` (lock busy: the call and its use are
    pushed back). `_tickNpc`: no news and no selection while `s.call` (after the job branch, so a
    colleague's use still advances). A colleague's phone use ends with its call, not on
    `useUntil`. `_expectedAwayMs` uses `job.callMs`. `getState().call`, `job.phone`; `_talking`
    returns call lines (`call: true`); `_buildSpeakers` adds call speakers for the whole call.
    Adapter: `describe` carries `phoneOwner`/`rings`; `cancelSpeech`; `playerProximityAt`;
    listener `desk_phone_ring:*` in `installNpcNeeds`.
  - `seating.js`: `isTyping` and `typingBob` are off while `ns.call`.
  - `npc-needs-chatter.js`: `preload` includes `phoneCalls`; `cancel(npcId)` (generation per NPC,
    stops the clip in flight and resolves its wait, skips queued lines).
  - `npc-action-icons.js`: `DEFAULT_ICONS.phone = { sprite: 'phone1' }`, stand-in `Ph`;
    `st.call` shows the phone; `targetInfo` adds `phone: true` for a `phoneOwner` object and
    `pickIconEntry` tries `phone` after the target id.
  - `lighting.js`: `FLASH_KINDS.ring` (amber 0xffb347, 18 to 10 px, fading); `flash(id, kind, ms,
    at)` with `at = { sprite, roomId }` draws on an object with no indicator record.
  - `npc-office-visuals.js`: `onPhoneRinging` on `desk_phone_ringing:*` (when officeVisuals is on):
    flash with lighting, else `showPhoneGlyph` (phone1 on the dark backing, alpha 1 to 0.35 yoyo,
    never scaled, 2.25 s); `rattle` (1 px, 60 ms steps, 2.25 s, x restored); `playAt
    ('desk_phone_ring', ..., { ownRoomOnly: true, channel: 'ring', scale: RING_SCALE 0.8 })`;
    `desk_phone_ring_heard:<id>`; `cueLog` entries with `how: 'ring'`.
  - `sound-manager.js`: `desk_phone_ring` loaded, CC0 credit comment above it.
  - `office-presets.json`: `desk_phone` gains `"seat": "stand"`, `_comment` reworded.
  - `test/js/npc-desk-phone.test.mjs`.
- 108a0b557 validator, schema, showcase:
  - `validate_npc_needs.rb` `check_phones` (errors: owner not an NPC, owner's needsHome object not
    in the phone's room, no affordance, not standing, takeable, rings outside 1-20, more than 1.5
    tiles from the owner's post; warnings: no `useFrom`, approach within 36 px of the owner's cell,
    phoneCalls knot missing / prefixed / `{ }` (errors), no voice, `heard_<knot>` undeclared,
    answersPhones with no colleague's phone in the room, phoneCalls with no phone, scenario-level
    `phone` / `phone_message` line naming an NPC). Positions are checked only when both objects
    declare one (the sims PCs come from Tiled, so reach is not checked there).
  - Schema `answersPhones`, `phoneCalls`, `phoneOwner`, `rings`; known fields in `validate_scenario.rb`.
  - `test_needs_sims`: `tom_phone` (phone1, `officeType: desk_phone`, `useFrom {1, 0.5}`, live
    approach cell (132,196), 51 px from Tom's chair spot (92,164)); `spare_phone` (phone2 on the empty
    lower-right desk, `triggerOnInteract` emit_event `desk_phone_ring:tom_phone` plus a hint);
    `call_supplier` in `tom.ink`, `call_take_message` in `amara.ink` (compiled); Tom's `phone`
    pool, Amara's `answersPhones`, `phoneCalls`, `phone_message` pool; globals `heard_call_supplier`,
    `heard_call_take_message`; tasks `hear_tom_call` (`npc_call_heard:call_supplier`),
    `see_amara_answer` (`desk_phone_answered:tom_phone`, `data.answeredBy === 'amara'`),
    `see_call_missed` (`desk_phone_unanswered:tom_phone`), mappings on Amara's list.
    Validator `--no-graph`: 30 warnings, as before the slice.
- ba7975873 live fixes (game 962): a ring calls `world.warmStory` (new `npcChatterVoice.warm`) for
  the owner and every answersPhones NPC, because `preload` at install runs before the NPCs exist and
  Tom's first call fell to his pool; both phones get `position.elevation: 24` (they drew under the
  desk).
- Tests: `npc-desk-phone.test.mjs` 25 (22 engine/chatter, 3 validator). `bin/test-js` 408 files
  pass (run after c95a2fcb2; re-run after the later commits). `GOLDEN_SIMS_DAY` unchanged.

## Live proof so far (:3001, headless; evidence in the session scratchpad `s19/`)

Driver: `s19/lib.py <game>` (`rec`, `events`, `plog`, `st`, `ring`, `move`, `setneed`,
`wait_until`, `tts`, `shot`), `s19/a_owner.py <game>`. Start: new game, `session-start.sh --url ...
--headless --log s19/sess<id>.jsonl`, `bootstrap {"tutorial":"decline","resume":"new"}`, `rec()`,
then `move(154,82)`, `move(250,190)` (clear of the desks).

- **Game 963, case A (lighting on): pass.** Tom idle at his desk; ring; pickup; the five
  `call_supplier` lines voiced (`npcChatterVoice.log`: knot `call_supplier`, spoken, volume 0.82;
  keyless server so `/tts` 503s), five `npc_overheard:tom`, `npc_call_heard:call_supplier`;
  `desk_phone_ring_heard:tom_phone` volume 0.528 (hearing 1, channel `ring`); cueLog flash `ring`,
  rattle true; colleagues looked round: `npc_swivelled` grace, marek, sanjay. Output
  `s19/a_owner-963.txt`; frames `a1-ring-lit-963.png`, `a2-line0..2-963.png`,
  `a3-gap-icon-963.png` (phone1 icon over Tom in a gap, reads well, so `phone1` stays), strip
  `a-strip-963.png`. Game 962 (before the fixes) took the pool for the first call.
- **Not yet seen:** the amber flash itself (the 0.6 s frame shows none; shoot at about 0.15 s and
  crop round (100,179) world, screen about (583,448)); check `window.lightingSystem.flashes` while it
  draws.

## Left (exact next steps)

1. Re-run `bin/test-js` in full (after ba7975873) and the node file.
2. **Live proof, new `test_needs_sims` game(s)** (one or two headless browsers at most):
   - Ring with lighting: frame at ~0.15 s for the amber flash; ring **without lighting**
     (`localStorage.breakEscapeLighting = 'off'`, reload): the phone1 glyph pulsing over the phone;
     from the kitchen or lounge (player there, Tom's phone ringing): `playLog` entry hearing 0,
     volume 0, no `desk_phone_ring_heard`.
   - **Colleague answers**: send Tom for coffee (`setneed('tom','caffeine',10)`), ring once he has
     left (`npc_left_post:tom`), Amara walks over from ring 2: frames of her standing at (132,196)
     with Tom's chair empty, her half of `call_take_message`, `see_amara_answer` completed,
     `npc_left_post:amara` with `expectedAwayMs` about the call's length.
   - **Owner first**: ring while Tom walks back (or make Amara slower), Tom arrives and answers,
     `npc_turned_back:amara` reason `answered`, no grumble.
   - **Ring-out with rang_out**: Tom away, open a chat with Amara on her way (`interact` or the
     person-chat for amara), wait past ring 4: one `desk_phone_unanswered`, `npc_turned_back:amara`
     `rang_out`, no `desk_phone_answered`, no call lines; she goes home after the chat.
   - **Player chat ends the call**: open a chat with Tom on line 2 of a call (needs an unheard knot:
     a fresh game, or his pool): `desk_phone_hung_up` reason `player`, `npcChatterVoice.log` entry
     `cancelled`, no `npc_call_heard`.
   - Seated staff turning towards a call: already in game 963 (`npc_swivelled` reason `listen`);
     take a frame of a turned chair for the README.
3. **Regressions**: `scratchpad/leash.py <game>` on a new `test_needs_leash` game; the lab by
   replaying `scratchpad/s21/lab_cmds.json` (without `quit`) through `scratchpad/lab.py` on a new
   `lab_physical_pentest` game, then `tools/playtest/verify-run.rb` (score 100; creds about 63-65 s,
   USB about 10 s). The lab has no `phoneOwner` objects that I know of (check with grep): if it has
   desk phones and anything changes, stop and report.
4. **Docs**: plan 12.5 Built line (commits, games, the choices below); sims README live-proof table;
   the one slice 19 line in `scenarios/lab_physical_pentest/IMPROVEMENT_LOOP_LOG.md`;
   `OFFICE_LIFE_HANDOVER_SESSION.md` row; this file marked DONE. Optional: the npc-dialog-review
   skill on the two knots (the plan asks for it).

## Choices made without asking (for the Built line)

1. The owner picks up `PICKUP_MS` 2250 ms after the first ring (one double ring heard), not at once;
   an owner arriving later answers at once.
2. A call line is voiced only when the player is in earshot at that line; otherwise it shows as the
   phone picture (no `/tts` request) and the knot stays unplayed. A call with no lines left is three
   phone pictures; a pool call is up to three lines from the speaker's bag.
3. With the speech lock busy at a line's start, the call waits and is pushed back (its use too),
   as exchanges queue.
4. A colleague's phone use ends when its call ends (tick rounding can carry a call past
   `useUntil`); `useUntil` is still set to the call's length at pick-up.
5. No `npc_announced` news while on a call (the speaker is on the phone).
6. `desk_phone_answered` / `desk_phone_unanswered` carry the player's distance to the phone
   (`playerProximityAt`), not to an NPC.
7. The ring sound is heard only in the phone's room (the brief), not the plan's 0.4 through a door;
   `RING_SCALE` 0.8.
8. A ring warms the answerers' stories (`warmStory`), since `preload` at install sees no NPCs.
9. `phone1` stays as the call icon and ring glyph (the 963 frame reads well); `npc-phone` is used
   only by picture chat (`icons/npc-phone.png`).
10. Showcase phones use `position.elevation: 24` to draw on the desk.
11. The validator needs `useFrom` on every phone (warning) and checks reach only when both objects
    declare positions.
