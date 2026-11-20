# Office Life plan, section 12: adversarial review, round 5 (final full round)

Reviewed: `docs/achitechture/OFFICE_LIFE_PLAN.md` sections 12, 13, 13b, 13c and 13d as revised in bf23c605c,
against the working tree at that commit. Read-only; no code or plan edits. Paths are relative to
`public/break_escape/js/` unless they start with `scenarios/`, `scripts/`, `test/` or `docs/`. Finding ids are
new to this round; section 5 maps round 4's ids to an outcome.

**Count: 0 blockers, 2 major, 15 minor.**

## 1. Verdict

**The plan can go to the user for decisions.** Neither major changes the design. M1 is one missing call in
slice 20 and M2 is showcase numbers in slice 18b-i. Fold both in, and m1 (a false sentence on the approval
page), and check the text. Another full round is not needed.

| Slice | Ready to build? |
|---|---|
| 21 idle swivel | **Yes**, as written |
| 16 lock-screen habits and cues | **Yes**, as written |
| 18a coffee off | **Yes**, with m14 in the brief |
| 17 print and forget | **Yes**, with m11 to m13 in the brief |
| 18b-i the magnet | **After M2** (showcase numbers or a staged proof); engine text is ready |
| 18b-ii word of mouth | **Yes**, as written |
| 19 desk-phone calls | **Yes**, with m7 to m10 in the brief |
| 20 room tone | **After M1**; m1 to m6 in the brief |

All three round 4 majors are fixed in the text and match the code they name. Round 4's m16 rested on a wrong
reading of sis01: the shipped-mission claim built on it is wrong in the plan's favour (m1). The claim that
shipped missions are otherwise unchanged holds, apart from that one correction and the need to pin how the
unknown-key fade is built (m3).

How this was checked: every round 4 fix was read against the functions it names (`_tickNpc` 634-731,
`_turnBack` 1080-1097, `_checkCaught` 1393-1404, `_advanceJob` 1446-1483, `_completeJob` 1485-1536,
`_expectedAwayMs` 1363-1386, the adapter's `revealOutput` 2511-2537 and `describe` 2107-2120,
`fadeAmbientTo` and `suppressAmbience` in `systems/sound-manager.js` 360-430, `recalculateAmbientVolume` in
`core/rooms.js` 3169-3208, `needsStop` in `systems/seating.js` 1061-1077, `pickIconEntry` and `getState`).
`scenarios/` was grepped for every field the slices read (`needsHome`, `workstation`, `lockChance`,
`locksScreenOnLeave`, `revealOutput`, `officePresets`, `officeVisuals`, `affordance`, `needsCompany`,
`phoneOwner`, `answersPhones`, `swivel`, `lockCues`, `roomTone`, `ambientSound`), and sis01's three rooms were
traced through `recalculateAmbientVolume` by hand. The showcase cast's needs were listed from
`scenarios/test_needs_sims/scenario.json.erb`.

### Shipped missions with `roomTone` off, no needs NPCs and no new fields

- **Needs fields.** `needsHome`, `affordance`, `revealOutput`, `lockChance`, `locksScreenOnLeave`,
  `officePresets` and `needsCompany` appear only in `lab_physical_pentest` and the `test_*` scenarios. The
  `"workstation"` hits in m01-m04, m08-m10, ceo_exfil and others are `"type": "workstation"` (for example
  `m01_first_contact/scenario.json.erb` 1709), not the field `isWorkstation` reads (`workstation-state.js`
  51-54). The `"needs"` arrays in m02 (2452-2531) and sis01 (2512) are puzzle fields. Slices 16, 17, 18a, 18b,
  19 and 21 therefore change nothing in m01-m10, sis01, sis02 or the awareness scenarios. No scenario sets
  `officeVisuals`, `lockCues`, `roomTone`, `phoneOwner`, `answersPhones` or `swivel`.
- **Hidden use targets (18b item 7).** The lab's reveal objects (`planted_deviceA` 957, `usb_malware_note`
  991, `cable_note` 1035, `pierce_printout_left` 1180, `hampshire_badge_left` 1200, `network_port_planted`
  1485) carry no affordance, and the lab has no presets. Confirmed.
- **Ambient keys.** Only m01, m04, m09, sis01 and sis02 author `ambientSound`. Every key is
  `server_room_ventilation` (loaded, `sound-manager.js` 118) except sis01's `hospital_ambient` (`ward_7`) and
  `office_ambient` (`major_incident_room`). So the only change with `roomTone` off is the unknown-key fade, and
  only sis01 can hear it. Which sis01 rooms, and what approving `office_ambient` does, is m1.

## 2. Major findings

### M1. With room tone on, the start room has no bed until the player leaves it (12.6, slice 20)

12.6 puts the four-step bed order in `core/rooms.js`, with the profile beds read from
`data/room-tones.json`, "read by the module", and installs `office-room-tone.js` "in `core/game.js` beside the
office visuals (1966)". That install runs inside the needs promise chain, after the preset table's fetch
(`core/game.js` 1954-1969). The profile table will be fetched the same way, as `office-presets.json` is
(`systems/office-presets.js` 34).

`recalculateAmbientVolume` has exactly two callers: a room change in `updatePlayerRoom` (`core/rooms.js` 3113)
and a `door_opened` that touches the player's room (3160-3165). The first room change happens on the first
frames after spawn, long before the dynamic imports and the fetch resolve. At that moment step 2 (the
player's room's profile bed) has no table, so the resolver falls to step 3 or 4. Nothing calls it again
until the player walks out or opens a door. In the showcase the player spawns in the office (`room_office`,
profile bed only, no authored loop). The office is silent at spawn and after every reload, and "Hear the
office at work" (`room_tone_started:<roomId>`) does not fire for the start room until the player has left
and come back. The live proof "the play log from each room" would show the gap, but the brief does not say
what to do about it.

**Fix.** When `office-room-tone.js` has the profile table, it calls an exported
`refreshAmbient()` from `core/rooms.js` (a recalculation for `currentPlayerRoom`), once at install. Node test:
a resolver call before the table loads gives no bed, and the refresh after it gives the office bed. Live
proof: spawn in the office and, without moving, the play log or fade-call log shows the bed starting, then
the same after a reload.

### M2. The pizza showcase cannot show "Missed it." or empty boxes in a capturable run (12.4, slice 18b-i)

Only three showcase NPCs have a need the pizza satisfies (`hunger` or `social`): Tom (hunger), Sanjay (hunger,
social) and Rosa (social; her post is in the lounge). Amara has caffeine and work, Grace rest and thirst,
Marek thirst and caffeine (`scenarios/test_needs_sims/scenario.json.erb`, the `needs` blocks of each NPC from
298 to 580). The plan's showcase uses `servings: 6`, `perPerson: 1` and `capacity: 3`.

- Temptation takes at most three servings (one per eligible NPC). The other three need urgent re-visits
  (Tom's hunger is urgent again about 6 minutes after a slice, Rosa's social about every 3 minutes), so the
  boxes empty only after ten minutes or more, and only if Rosa has walked into the kitchen.
- "Missed it." needs a walker on the way at the moment the count reaches 0. The office announce sends Tom
  and Sanjay together, but with six servings both eat. By the time the last serving goes the eaters are
  minutes apart, so a `gone` turn-back happens only by chance.

18b-i's declared proof is "people in the kitchen eat, the boxes empty, a late walker turns back with 'Missed
it.'", and 12.4's "What the player sees" promises the same. The node test (capacity 3, one serving left,
three tempted NPCs) covers the rule; the live proof as written is not something a headless run can be
relied on to capture.

**Fix.** Choose one and write it into 12.4's showcase paragraph and the 18b-i proof:
(a) `servings: 2` (and `kitchen_pizza_servings: 2`) with a hunger need for Amara, so the office announce sends
Tom, Sanjay and Amara at once: two eat, one turns back. Check that the split shows in under five minutes, as
16's threshold is checked. Or (b) keep the numbers and stage the proof: with Tom and Sanjay both on the way
after the announce, set the servings to 1 through the test bridge, and say in the README that a natural run
rarely shows `gone`. Under (b) the engine must read the count from the global (or the bridge must have a
needs command for it), which the text should state.

## 3. Minor findings

**Slice 20**

- **m1. Approving `office_ambient` does not change sis01, and `major_incident_room` is not one of the changed
  rooms.** sis01 has three rooms in a chain, in this order: `ward_7` (716, `hospital_ambient`, connects north to
  `it_security_office`, 740), `it_security_office` (1676, `server_room_ventilation` 0.25, south `ward_7` and
  north `major_incident_room`, 1691-1694), `major_incident_room` (2125, `office_ambient` 0.15, south only,
  2135-2137). `recalculateAmbientVolume` returns at the first room in that order that is the player's or
  adjacent (`core/rooms.js` 3172-3203). In `major_incident_room`, `ward_7` is not adjacent and
  `it_security_office` is, so the loop plays the ventilation bleed and returns before it reaches the room's
  own key. Without `roomTone`, `office_ambient` is never asked for, whether or not the file exists. The
  rooms that do change (cut becomes fade) are `ward_7` (its own key) and `it_security_office` (its neighbour
  `ward_7` comes first). **Fix:** in 12.6 (3485-3490), 12.8's approval row and "What changes for shipped
  missions", and 13d, say the change is in `ward_7` and `it_security_office` through `hospital_ambient`, and
  that approving `office_ambient` changes no shipped mission without `roomTone`. It plays in
  `major_incident_room` only with `roomTone` (step 1). Round 4's m16 was wrong on this point.
- **m2. The bed order cannot be node-tested where the text puts it.** The tests list "without `roomTone`,
  `recalculateAmbientVolume` gives exactly today's choices" and the four-step order with `roomTone`, but
  `recalculateAmbientVolume` is a private function in `core/rooms.js` (3169), and no node test imports that
  module (tests stub it, for example `test/js/examine-minigame.test.mjs` 30, or read its source text,
  `test/js/consumables.test.mjs` 195). **Fix:** put the choice in a pure function in a small module (rooms
  order, player room, door states, `roomTone`, profiles, loaded keys in; key and level out) that
  `core/rooms.js` calls, and add it to the test-harness copy lists. About 10 more lines.
- **m3. Pin how the unknown-key fade is built, and test the step back without `roomTone`.** "Fades the current
  loop out over the usual 400 ms" can be built two ways. Reusing the volume-0 path (`fadeAmbientTo(current,
  0)`, which keeps the tween in `_ambientTween`, `sound-manager.js` 374-389) is safe: a step back finds the
  sound playing, stops that tween and tweens it up (395-415). Calling `stopAmbient(400)` (327-349) is not: its
  tween is untracked and stops the sound on completion. In sis01, from `major_incident_room` (ventilation
  bleed) into `it_security_office` (picks `hospital_ambient`) and straight back would then leave
  `major_incident_room` silent: a new regression in the one shipped change. The sound manager also needs two
  inputs the text does not name: the `roomTone` flag for the crossfade (it has no scenario access) and the
  current normalised level, so the duck can re-apply it. **Fix:** say "through the volume-0 path"; name
  the call, for example `fadeAmbientTo(key, level, ms, { crossfade })` from `core/rooms.js` under `roomTone`,
  and a stored `_ambientLevel`; node test with `roomTone` off: an unknown key, then the previous key within
  400 ms, leaves the previous key playing.
- **m4. A third room inside the fade orphans the first fade-out.** With one `_outgoing` field, A to B to C
  moves B into the field while A's fade-out tween keeps running untracked. C back to A inside 400 ms finds A
  playing but not outgoing, tweens it up, and A's old fade-out then stops it. This is rare (three rooms in
  400 ms). **Fix:** when a new outgoing sound replaces one still fading, stop the older one at once; test
  A to B to C to A.
- **m5. The typing loop's channel and duck are unspecified.** It is a second looping sound beside the
  ambient track. The text does not say whether it ducks under speech (only "the bed ducks to half and no
  spot starts"). It also does not say who stops it when the room changes or the credits start;
  `silenceBackgroundForEnding` stops any looping Phaser sound (`music/ending-audio.js` 69-85), so the credits
  are covered. **Fix:** one sentence: the typing loop ducks with the bed and stops on a room change.
- **m6. New validator warnings in a shipped mission.** "An authored `ambientSound` key not in `loaded_sounds`
  (warning)" adds two warnings to sis01's validator output (the other session's mission). That is correct,
  but the slice report should name it, so the other session is not surprised.

**Slice 19**

- **m7. A frozen colleague turned back with `answered`.** M1's fix handles a frozen answerer on ring-out. The
  owner arriving while the colleague is frozen in a player chat (she does not keep the phone ringing, but
  the rings may not have run out) turns her back with `answered`. Through `_turnBack`, `_abortJob` then
  `_goHome` sets `mode = 'returning'` over `frozen` and issues a `moveTo` during the chat (`npc-needs.js`
  1621-1631). The next tick re-freezes her and cancels the move (659-668), so she twitches for one tick and
  her end state is right. **Fix:** any turn-back of a frozen answerer (`answered` or `rang_out`) clears the job
  and sets `prevMode` to `returning`, with no move; test the `answered` case too.
- **m8. The colleague's action icon during the walk and the call.** `getState().call` is set only for the
  owner's overlay. The colleague's icon comes from `pickIconEntry` with the phone as target: keys
  `[target.id, null, null, target.satisfies, 'phone1']` (`npc-action-icons.js` 92-100), none of which is in
  `DEFAULT_ICONS`, so she shows the fallback dot. **Fix:** a target with `phoneOwner` gives the phone icon (or
  the colleague's `getState` carries `call` too); test.
- **m9. `cancel(npcId)` must also end the queue's wait.** `say` chains every line on one promise and, after
  `mgr.play`, waits out the clip's length with a `setTimeout` (`npc-needs-chatter.js` 225-234). Stopping the
  audio alone leaves that wait running, so every later NPC line, from any speaker, waits for the cancelled
  clip's length. **Fix:** the cancel resolves the current wait and marks the NPC's queued entries to skip;
  test that a line queued after a cancel plays at once.
- **m10. Live list.** Round 4 (section 6) asked for "a chat with Amara on the way, then ring-out" in 19's
  live list; it is only in the node tests. **Fix:** add it; it is capturable through `window.__test`.

**Slice 17**

- **m11. Clear `_printedBy` on every reveal.** Slot sprites persist and are reused (`revealOutput` 2511-2535).
  "Stamps ... only when" read literally sets the owner and never clears it, so a slot Tom once owned, filed
  and later revealed for Sanjay's unowned print stays reserved, and Amara never takes it: Sanjay's beat
  breaks. **Fix:** every reveal sets `_printedBy` to the owner or clears it; test a slot owned, filed and
  revealed again unowned.
- **m12. Recycling usually takes the takeable slot.** Slots fill by id, so Tom's first forgotten print is
  `copier_out_a`, the one takeable slot. It is also the oldest forgotten, so it is the first recycled, and
  under one of Sanjay's prints it becomes unowned and Amara carries it off. The player's takeable forgotten
  print goes first. **Fix:** recycle read-in-place slots before takeable ones (oldest first within each), or
  accept it and say so in the README.
- **m13. The lever objective and Tom's existing mappings.** "Send a print job from Tom's open screen and watch
  him fetch it" on `npc_used:tom_pc` with `tag === "printout"` also completes from a natural habit fetch. The
  errand's completion emits `npc_used:tom_pc` (`_completeJob` 1508-1513), and the showcase's unconditioned
  mappings on that event (`scenario.json.erb` 345-346) set `last_activity` to `desk_work` and complete
  "Someone works at a desk". Separately, `workstation_accessed` fires only while Tom is away
  (`workstation-state.js` 170-182) and the lever's due time is 5-10 s, so the errand usually starts from
  `returning`: Tom comes back by way of the copier rather than "gets up again". **Fix:** condition 345-346 on
  `data.need === "work"`; when a print errand completes, emit `npc_print_fetched:<ownerId>`
  `{ slotId, viaCommand }` and put the lever objective on it with `data.viaCommand`; reword the README line.

**Slice 18a**

- **m14. "Any scenario with no security story" is not a rule a validator can check.** The hint-title warning
  (12.4, 3020-3021; validator about 15) has no machine test for "no security story". **Fix:** warn in
  `test_needs_sims` only, or wherever a scenario sets `officePresets` or has needs NPCs, or behind a scenario
  flag; one fixture.

**All slices**

- **m15. Sizes and stale text.** 19's sum, "240 + 10 + 5 + 13 + 25 + 42 + 20", uses 42 for a validator the
  text gives as "about 40" (3420, 3428). 18b's "these parts sum to about 370 lines (260 + 15 + 65 + 30)" uses
  260 for `npc-needs.js`, which the same paragraph gives as about 245, with parts summing to 245
  (3190-3204). Section 12's status line still says "Revised after review rounds 1, 2 and 3 ... sections 13,
  13b and 13c" (2568-2569). 12.8's paragraph "Round 3 found 21, 16 and 18a ready ... a check of the 17 text
  and of 12.5's selection rule is enough, not a fourth round" (3791-3793) is stale. 12.6 says
  `object_revealed` fires "for any core reveal (the pizza)" (3561); core reveals emit nothing, and only
  `npc-needs.js` emits it (2531, 2571). The `producerId` rule is still right.

## 4. Buildability, slice by slice

| Slice | Files | Tests | Live proofs capturable headless? | Showcase | Regressions | Size |
|---|---|---|---|---|---|---|
| 21 | `seating.js`, `npc-needs.js`, validator, schema | named, `seating.test.mjs` | yes (frame strips) | Tiled chairs checked at build | lab: static seats | 35+10+5+8 = 58 |
| 16 | `workstation-state.js`, `npc-needs.js`, `lighting.js`, `npc-office-visuals.js`, validator, schema | named, three existing test files | yes; chimes proved through `playLog` | habit split checked against logged estimates | lab `lockCues` decision first | 205 |
| 18a | `npc-needs.js` (`PICTURE_CHATTER`), validator, schema | named | yes | socket stand-in sprite | lab grumbles kept | 85 |
| 17 | `npc-needs.js`, adapter, validator, schema; `npc-needs-slots.test.mjs` frozen | named, including M2 R4 guards | yes; note lever without reload | m12, m13 | golden unchanged (fixture is a stub) | 190 |
| 18b-i | `npc-needs.js`, adapter, validator, schema | named; tick-cost re-run | **not as written (M2)** | M2 | leash, lab | 245 |
| 18b-ii | `npc-needs.js`, validator | named | yes; `/tts` request on keyless :3001 | `npc_told` per NPC | leash, lab | 125 |
| 19 | `npc-needs.js`, `seating.js`, `npc-action-icons.js`, `npc-needs-chatter.js`, visuals, `office-presets.json` comment, validator, schema | named | yes; add m10 | spare phone, two knots | leash, lab | 353 (text says 355, m15) |
| 20 | new `office-room-tone.js`, `npc-needs.js`, `core/rooms.js`, `sound-manager.js`, visuals, `seating.js`, adapter, `core/game.js`, `office-presets.json`, `office-presets.test.mjs` 25, validator, schema; plus m2's pure module | named, but m2 | fade-call log until a bed is approved; M1 needs a spawn proof | `roomTone` on | local, uncommitted m01, m04, sis01 copies; each shipped mission once without | 256 (+10 for m2) |

The total stays about 1,519 lines (1,529 with m2's module). Order and dependencies in 12.8 hold.

## 5. Round 4 findings

| R4 | Outcome | Notes |
|---|---|---|
| M1 frozen answerer answers after ring-out | **Fixed** | `rang_out` row, job cleared, `prevMode = 'returning'` reaches `_goHome` at `_tickNpc` 682-683; OQ37. Same shape for `answered` (m7) |
| M2 unguarded `_checkCaught` on the errand | **Fixed** | Guard `job.errand && job.carrying && !s.atPost && !s.caughtEmitted` matches the call site at 690; three tests listed |
| M3 crossfade that turns back | **Fixed** | `_outgoing` and `_outgoingTween`; A-B-A and A-B-C tests. A-B-C-A edge (m4) |
| m1 recycling and Sanjay's beat | Fixed | Any print recycles; test with an unowned print. Recycling takes the takeable slot first (m12) |
| m2 unconditional ownership | Fixed | Needs a clear on unowned reveals (m11) |
| m3 `pickable` has no viewer | Fixed | Filter at `_carryCandidate` 1239 |
| m4 errand arrival and estimate | Fixed | No `using`; `_expectedAwayMs` without dwell when `job.errand` holds |
| m5 roll id | Fixed | `<ownerId>:<printCount>` |
| m6 `onceOnly` note lever | Fixed | 60 s cooldown; OQ58 |
| m7 hint default title | Fixed | Titles in both examples; the validator's scope is not checkable as worded (m14) |
| m8 magnet at 0 servings after reload | Fixed | Install-time and idle finish; test |
| m9 sight and tick cost | Fixed | Per-tick cache; test re-run in 18b-i |
| m10 grumble picture and logged topic | Fixed | |
| m11 ring during a call | Fixed | |
| m12 answerers on a call; other stops | Fixed | `reason: "unavailable"` |
| m13 call lines and the duck | Fixed | Through `_speak` with `overheard`; in 20's duck test |
| m14 own-room-first in shipped missions | Fixed, further than asked | All behind `roomTone`; local copies in the live check |
| m15 two authored neighbours | Fixed | Open door first, then rooms order |
| m16 approving `office_ambient` changes sis01 | **Premise wrong** | Without `roomTone` the room never reaches its key; the plan now repeats the wrong claim (m1) |
| m17 cosmetic copy's sound and the gate | Fixed | Adapter emits, visuals play under the gates |
| m18 files missing from 20's brief | Fixed | Install site named; its timing is M1 |
| m19 sizes and stale text | **Partly fixed** | Most sums now hold; 19 and 18b and two stale passages remain (m15) |

## 6. Open questions 27-58 and the approval table

OQ27-58 match the text. OQ37 now covers `rang_out`; OQ54 the grumble picture; OQ56 unowned prints; OQ57 and OQ58
are new and consistent with 12.6 and 12.3. The approval table matches 12.6, OQ42 and OQ46 in items and
counts (eight files: seven downloads and one derivative; two chimes; two required icons and one required
sprite; cake and `npc-phone` optional). One correction: the `office_ambient` row's warning that approval
changes a shipped mission is wrong (m1). As things stand approval changes nothing shipped, which is simpler
to put to the user.
