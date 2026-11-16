# NPC poses: review round 1

Scope: 609ad4cc7 (pipeline `--pose-from`), 3bfde3849 (`systems/npc-poses.js`, the `core/game.js`
dynamic import, schema keys `affordance.pose`, `affordance.machine` and NPC `poses`, tests) and
11b574bae (face-player no longer blocks a pose; docs). cd108c21a (art and overrides) was checked
only for frame changes. Line numbers are from the files as of 11b574bae. The branch has moved since
(fec3cb9f7 breathing, 1eb466575 pipeline re-import, 0775b0992 art); the breathing move is not
reviewed here.

Owner intent (D20): drink, use-machine and phone poses for office-life NPCs; seated wins; fall
back silently when frames are missing. Design: `docs/achitechture/NPC_POSES.md`, decisions 1 to 5.

R1: 0/3/11 (plus one Major in 609ad4cc7 already fixed on the branch by 1eb466575)

## Checks that passed

- Art commit cd108c21a: all three atlases keep every one of their 264 existing frames, pixel for
  pixel and with identical frame metadata; each gains exactly the 24 `pose_drink`, `pose_use` and
  `pose_phone` frames. The atlas canvas grew from 1392x1310 to 1392x1392 to fit them.
- The 85 overrides saved for male_office_worker_v2 are 60x60 export frames. Pasted at the
  converter's offset (10, 11) on the 80x80 canvas, all 85 match the frames committed before
  cd108c21a exactly (transparent pixels compared as transparent).
- npc-sprites.js turns `pose_drink_east` into `npc-<id>-pose_drink-right`, which is the key
  `poseAnimKey` builds from a behaviour direction. The one-frame animations get repeat 0, which is
  fine for a held frame.
- Frame-missing fallback: `hasPoseAnim` (npc-poses.js:94) checks the animation has frames, so an
  atlas without pose frames, or missing one direction, is never touched.
- Seated wins through `poseBlocked` (`_seat`, `_seatMove`), and `playAnimation` already returns
  early for a seated NPC.
- KO, hostility, chat and combat animations block; walking off releases without an idle replay;
  a destroyed sprite or a missing behaviour clears the entry. Room unload is covered by the
  destroyed-sprite check.
- The install guard follows the npc-office-visuals pattern; one `postupdate` listener per scene.
- Schema: the three keys are declared where the validator's schema walk finds them, and the
  known-keys reader test is satisfied (the names occur in npc-poses.js).
- `node --test test/js/npc-poses.test.mjs`: 13 pass. `python3 tools/test_pixellab_pipeline.py`:
  passes.

## Majors

### M1. The pose and the idle are both replayed on every behaviour tick

npc-poses.js:173-177, with npc-behavior.js:1054-1057 and 2869.

The pose pass sets `b.lastAnimationKey = key` (the pose key). `NPCBehavior.playAnimation` replays
whenever the key it computes differs from `lastAnimationKey`. A needs NPC standing at a machine is
in the `idle` behaviour state, whose `executeState` calls `playAnimation('idle', direction)` on
every behaviour tick (every 50 ms); `face_player` does the same through `facePlayer`. So every tick:
the behaviour plays the idle (restarting it at frame 0), then the pose pass sees the current
animation is no longer the pose and plays the pose again. That is two `sprite.play` calls per posed
NPC per tick, each firing animation start events, and the one-frame repeat-0 pose fires its
complete event every time. It is invisible only because `postupdate` runs before render.

Failure scenario: six NPCs at the coffee machine and cooler in test_needs_sims cost twelve
animation restarts every 50 ms for nothing, and any listener added later on
`animationcomplete` for an NPC sprite (the KO and combat code already uses `once` listeners) fires
on the pose every tick. The test "a held pose is not replayed every frame" (test:131) passes only
because the stub `playAnimation` (test:106) has no key check and no behaviour tick runs between the
passes.

Fix: leave `lastAnimationKey` on the idle key the behaviour would compute for the current
direction (`npc-<id>-idle-<direction>`), so the behaviour's per-tick `playAnimation('idle', same
direction)` is a no-op. A direction change still replays the idle in `update` and the pose pass
replaces it in `postupdate`; `release` already clears `lastAnimationKey` before playing the idle.
Make the test stub copy the real dedupe (`lastAnimationKey` and flipX check), run a behaviour tick
between passes, and count plays.

### M2. The use pose shows when the NPC is not facing the machine

npc-poses.js:79-85; 11b574bae (face-player no longer blocks); npc-needs.js:4313 and 4942;
office-presets.json (`cooler` satisfies `thirst` and `social`); test:23.

`use` is "hands at a machine". It is chosen from the need and the object alone, never from where
the NPC faces. Three common cases turn the NPC away from the machine while `use` holds:

1. Social at the cooler. The cooler preset satisfies `social`, so an NPC that goes there for its
   social need is a machine use with a non-drink need and gets `use` for the whole 15 s.
   test:23 pins this.
2. Pairing. `_maybePair` turns the two cooler users to face each other on arrival
   (npc-needs.js:4313); the queue chat turns the user to the first queuer (4942). Both then
   show `use` (the whole use in case 1, the first 3 s for a drink need) reaching at a colleague.
3. Face-player. Since 11b574bae the pose follows the facing when the player comes within 96 px,
   so a copier or coffee-machine user turns round and reaches at the player.

Failure scenario: the cooler chat, the showcase office-life moment, shows two NPCs reaching into
each other with the machine behind one of them.

Fix: show `use` only while `b.direction` is within one compass step of the direction from the NPC
to the object (`calculateDirection` on the object's centre); otherwise fall through to `drink`
for a drink need, or none. For a social use at an object that also satisfies `thirst` or
`caffeine`, `drink` (a cup in hand) is the likely intent; that is an owner call, so ask. Replace
test:23 with tests for the facing rule and the social case.

### M3. The drift audit cannot parse pose frame names; `--adopt` crashes on them

tools/pixellab_drift_audit.py:87-88 and 106-107; pixellab_pipeline.py:2019-2026.

The audit splits a frame name with `n.split("_", 1)`, which assumed animation names without
underscores. `pose_drink_south_frame_000` gives the animation `pose` and the direction
`drink_south`. The override-skip check looks at the wrong path (harmless while the rebuild
matches), but `adopt` opens `animations/pose/drink_south/frame_000.png`, which does not exist.

Failure scenario: someone fixes the `use` take by hand on the atlas (NPC_POSES.md already says the
use take reads as a reach on side views). `import` refuses to run until the drift is adopted;
`--adopt` raises FileNotFoundError part-way through the sorted list, leaving some frames adopted and
the rest not. The only ways through are `--ignore-drift` (the edit is lost) or writing the override
by hand. CLAUDE.md names this tool as the hand-edit path.

Fix: parse from the right, since directions have no underscores:
`stem, fr = n.rsplit("_frame_", 1); anim, direction = stem.rsplit("_", 1)`, in both places. Add a
test with a `pose_drink` frame through `audit` and `adopt`.

### Found in scope, already fixed on the branch (not counted)

pixellab_pipeline.py:1988-1995 in 609ad4cc7 read the stored `poses` only when the import target
was a manifest key. A re-import by character id or URL with `--key` rebuilt the atlas without the
pose frames while the manifest still listed them. 1eb466575 reports fixing this (and the same
loss of `sit_from` and `idle_from`); round 2 should confirm it with its test.

## Minors

### m1. Machine recognition false positives and misses

npc-poses.js:36 and 46-53. `coffee` matches `coffee_cups1` (the "Takeaway coffees" consumable,
consumables.js:84) and `glass_coffee_table1` (game.js:1089). A caffeine use of the cups shows
`use` for 3 s before `drink`; any use at the coffee table (social, rest) shows `use` throughout.
No other texture or scenario type in the tree hits `cooler`, `boiler`, `keypad` or `socket` by
accident today, but a substring match will keep catching names like these. The hand-operated
presets `shredder`, `filing` and `post_tray` are missed. Fix: check the resolved preset id first
(`spritePreset` in office-presets.js, cached on the sprite as `_officeAffordance.preset`) against
a list (coffee, kettle, cooler, microwave, copier, shredder), then fall back to the regex with
`table`, `cup` and `mug` excluded. Add tests for both false positives.

### m2. The microwave shows `use` for the whole meal

The microwave preset satisfies `hunger` (eat_snack sound). By the mapping it is a machine and gets
`use` for its 10 s. NPC_POSES.md's table says both "eating: none" and "microwave: use". Pick one:
for example `use` for `USE_LEAD_MS`, then none. Owner call.

### m3. Per-frame lookups

npc-poses.js:165. `world.getObject` runs every frame for every needs NPC that has a target and is
not blocked, including queued and waiting jobs, where `wantedPose` then returns null because the
phase is not `using`. Each call runs `findSprite` and `describe` (npc-needs.js:5152-5163, 5099),
allocating a fresh object; for a target in an unloaded room, `findSprite` walks every object in
every room. Fix: look the object up only when `job.phase === 'using'`, and cache the decision per
NPC keyed on the job object, phase, direction and whether the lead time has passed, so the
steady state is a few comparisons.

### m4. The use lead keeps counting through a conversation; stale `useStart` entries

npc-poses.js:118-124. The lead is measured on the needs clock from the first sight of `using`.
The needs system freezes the use during a chat (`useRemaining`), but the lead does not stop, so an
NPC talked to at the coffee machine for more than 3 s resumes straight into `drink`. `useStart`
entries for NPCs that leave `states` are never removed. Fix: pause the lead while `inChat`
(store the elapsed time), and delete `useStart` entries for ids not seen this pass, as `active`
already does.

### m5. A possible pose flash before sitting

The needs tick sets `using`; seating's `updateSeatedNPC` runs in the behaviour update, throttled to
50 ms. In between, the pose pass can show `use`, `drink` or `phone` for a few frames before
`_seatMove` appears, at a desk or at a coffee machine with a chair. Not seen in the live proof, but
not tested for either. Check `npcPoses.log` in a live run for a pose on and off within about
100 ms on a seated use; if present, wait one behaviour tick (or ask seating whether it will sit)
before the first pose.

### m6. Poses ignore `"officeVisuals": false`

Every other office-life visual (held items, use sounds, the typing bob) is switched off by
`"officeVisuals": false`; the pose pass is not. Gate it, or record in NPC_POSES.md that poses
follow only the per-NPC `poses` switch.

### m7. No validator checks beyond the schema

`swivel` and `swivelChance` get semantic warnings (validate_npc_needs.rb:580-587); the pose keys
get none. Worth warning on: `poses` on an NPC without needs (does nothing); `affordance.pose` or
`affordance.machine` on an object that no needs NPC can use; `poses` naming a pose that the NPC's
atlas has no frames for (silent at run time by design, but the author should hear about it).

### m8. A stored pose cannot be removed

pixellab_pipeline.py `parse_pose_from` merges over the manifest; `drink=` exits with an error, and
there is no other way to drop a pose. Removing a bad take needs a hand edit of
`tools/pixellab_characters.json`. Add `--no-pose NAME` (or accept `NAME=` as removal).

### m9. Pose frames do not set or follow their own feet line

convert_pixellab_to_spritesheet.py:189-192 and 201-203. Pose frames are left out of the feet-line
samples. When a pose state comes back on a canvas size that no standing frame shares, its frames
are centred on the canvas rather than placed on the feet line, and the NPC jumps up or down when
the pose starts. All three current characters share one size, so this does not bite today. Their
south poses do sit 2 px lower than the south idle (bounding-box bottom 68 against 66), and east,
north and west match within a pixel. Fix: when a pose size has no standing samples, sample the
pose frames themselves (a standing pose has the same feet). Look at the south drop on screen.

### m10. Test gaps

- Pipeline: no test of the `cmd_import` and `convert_and_record` manifest round trip, or of
  `frame_offsets` leaving pose frames out; both were planned in NPC_POSES.md.
- Pass: no test of hostility, KO or chat inside `update`, of an NPC leaving `states`, of a
  destroyed sprite, or of a behaviour tick between passes (M1).
- test:23 pins the M2 behaviour and should change with it.

### m11. NPC_POSES.md planned-design section is stale

It still says `pose: null` turns a pose off (the code and schema use `false`), lists
`face_player` among the blockers, and describes setting a texture frame with
`textures.get(key).has(frame)` instead of playing the animation. Rewrite it as the design as built,
or drop it now that the handover records the decisions.

## Outcomes (fourth session)

- M1 fixed: `lastAnimationKey` stays on the idle key; the test stub copies the real dedupe and
  runs behaviour ticks between passes (100 ticks, 0 plays). Live, test_needs_sims, Tom at the
  coffee machine: 0 animation start events in 5 s (300 frames, 93 behaviour playAnimation calls).
- M2 fixed: `use` only within one compass step of the object; turned away, `drink` for a drink
  need, else none. Owner call taken: a social use at the cooler shows `drink`. test:23 replaced.
- M3 fixed: `split_frame_name` parses from the right in audit and adopt; tests for the split
  and for adopting a `pose_drink` frame.
- m1 fixed: preset list first (coffee, kettle, cooler, microwave, copier, shredder), regex with
  table, cup and mug excluded; tests for coffee_cups1 and glass_coffee_table1. `filing` and
  `post_tray` are drawers and trays, not machines; an author can set `affordance.machine: true`.
- m2 fixed: a hunger use at a machine shows `use` for the lead, then nothing.
- m3 fixed: the object is looked up once per job, only in `using` (test counts lookups).
- m4 fixed: the lead pauses while in a chat; stale `useStart` and pending entries are removed.
- m5 fixed: the first pose waits `SETTLE_MS` (150 ms real time); test with a seat appearing
  inside the window. Live pose log: no on-off pair under 100 ms.
- m6 fixed: `"officeVisuals": false` turns poses off.
- m7 fixed: three validator warnings (`test/js/validator-npc-poses.test.mjs`).
- m8 fixed: `--pose-from name=` removes a stored pose and its export folder.
- m9 fixed: a pose-only canvas size uses the pose frames' feet. The south drop was PixelLab's
  breathing-idle drawn 1 to 2 px above the rotations (the pose states match the rotations), so the
  converter now aligns each pose frame to its direction's idle frame 0 (shifts up to 4 px). The
  three atlases were rebuilt offline by key; only pose frames changed.
- m10: pipeline tests for the manifest round trip, feet line and shifts; pass tests for
  hostility, KO, chat, leaving `states`, a destroyed sprite and behaviour ticks.
- m11: the planned-design section now points at the design as built.
