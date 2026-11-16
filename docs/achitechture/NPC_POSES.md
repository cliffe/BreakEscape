# NPC poses (drink, use-machine, phone)

## Handover (2026-11-16, fourth session; earlier sessions below)

Fourth session: review R1 fixed (outcomes in NPC_POSES_REVIEW_R1.md) and player poses built.

- NPC pass: the behaviour's `lastAnimationKey` stays on the idle key for the current direction,
  so its per-tick `playAnimation('idle')` is a no-op (live: 0 animation starts in 5 s at the
  coffee machine, 93 behaviour calls). `use` shows only while the NPC faces the object (within
  one compass step); turned to a colleague or the player it shows `drink` for a drink, else
  nothing. A social use of a drinks object (the cooler chat) shows `drink` (owner decision). A
  hunger use at a machine (microwave) shows `use` for the lead, then nothing. Machines: resolved
  office preset first (coffee, kettle, cooler, microwave, copier, shredder), then the name regex
  without table, cup or mug. The object is looked up once per job; the lead pauses during a chat;
  a first pose waits `SETTLE_MS` (150 ms) so an NPC about to sit never flashes one;
  `"officeVisuals": false` turns poses off.
- Pipeline: `--pose-from name=` removes a stored pose; the drift audit parses names from the right
  (`pose_drink_south` adopts); the converter puts each pose frame on its direction's idle feet
  line (PixelLab's breathing-idle sits 1 to 2 px higher than the rotations, south most), and a
  pose canvas size no standing frame shares uses the pose frames' own feet. The three test
  atlases were rebuilt offline by key: only pose frames moved (art commit, still not approved).
- Validator: warnings for `poses` on an NPC with no needs, a listed pose the atlas lacks, and
  `affordance.pose`/`machine` on an object that satisfies no need.
- Player poses: `systems/player-poses.js` (below). Live proof on test_phone_calls with the player
  swapped to male_office_worker_v2; shots in the owner's quality pack (scratch, not committed).

Left: owner verdicts D26 and on standing idle breathing; whether a phone pose should also show a
moment before the phone opens (it shows from the frame it opens, see Player poses).

## Player poses

`systems/player-poses.js`, installed from `core/game.js` after `createPlayer` (dynamic import;
one static import, sprite-breath.js). It plays the player animations `pose_<name>_<compass>`
that core/player.js already builds from any atlas frames; with no such frames nothing changes.

| Trigger | Where | Pose |
| --- | --- | --- |
| a drink consumed (coffee, tea, energy drink, soda, water) | consumables.js `useConsumable` | drink, 1.6 s, with the existing sound |
| a world object interaction (not an inventory item) | interactions.js `handleObjectInteraction`, after the facing turn | use, 0.5 s; the interaction runs at once |
| a phone-style minigame opens / closes | minigame-manager.js start and end | phone, held while open, then 0.6 s |

Phone-style minigames: `phone-chat` (texts, voice calls, ringing incoming calls) and
`person-chat` with `videoCall` (a video call). Not included: `authenticator` (it shows the
target's phone, not the player's), the scanners (handheld tools), `mail-client` and the rest.
The pose starts the frame the minigame opens; the open is not delayed, because
`startMinigame` returns the instance synchronously and callers rely on it.

Skipped while seated, walking, knocked out, fighting (punch, jab, hit or death animation, or an
NPC chasing) or with `"officeVisuals": false`; a walk or any other animation ends a pose at once.
Client only: nothing is synced. A held pose breathes (sprite-breath.js). `updatePlayerSprite`
now also removes the `pose_*` animations, so a swapped-in atlas never shows the old one's poses.
Tests: `test/js/player-poses.test.mjs` (9, including the three trigger sites).

## Handover (2026-11-16, third session; second session below)

Third session (2026-11-16):

- Breathing (D24) is built. `systems/sprite-breath.js` (no imports) holds `breathRows`,
  `breathDown`, `updateBreath`, `endBreath` and `prefersReducedMotion`, moved verbatim from
  seating.js, which imports them (and still exports `breathRows`/`breathDown`). No JS test harness
  copies seating.js or npc-poses.js (they import in place), so no copy list changed; a harness
  that copies either must now copy sprite-breath.js too. `test/js/sprite-breath.test.mjs` pins the
  seated output call for call against `test/js/fixtures/seated-breath-trace.json`, recorded from
  the old seating.js before the move (a changed depth step fails it).
- npc-poses.js breathes pose frames (each NPC its own phase) and ends the breath when the pose
  drops. When a pose drops because the NPC sat down in the same frame, it clears seating's crop
  marker (`_seat.breath.crop`) so seating crops again on the next frame.
- Standing idles: opt-in, off by default. NPC `"idleBreathing": true` (schema), or
  `window.npcPoses.idleBreathing = true` for every NPC (debug). Screenshot verdict: no seam or
  gap at the cut, but the idle already plays PixelLab's 4-frame breathing-idle, so the 1px sink
  adds a second, unsynchronised rhythm to the same figure. Keep it off; it may suit an atlas
  whose idle is a single frame.
- male_office_worker_v2 re-imported with the retest states: phone 7d83b546 (smartphone), use
  dc21f2ad (right hand); drink kept (6bd09056). Only the 16 phone and use frames changed; every
  other frame, sit frames included, is byte-identical. Pending owner verdict D26. In-game check:
  all 3 poses x 8 directions with breathing on, a phone breathing cycle and a live test_needs_sims
  run (phone, use, drink, idle; no page errors). The images were made in a scratch folder, not
  committed.
- Pipeline fix found on the way: an import by character id or URL with `--key <existing key>`
  used to ignore the stored `sit_from`, `idle_from` and `poses` (it dropped the sit and drink
  frames). Now `apply_stored_import_settings` keeps them when the key's entry is the same
  character; tests in `StoredImportSettingsTest`.
- Skill doc: Stage 4c (pose frames, `--pose-from`) in pixellab-character-pipeline.

Second session (2026-11-15):

Built on build/ol-poses:

- Pipeline: `import --pose-from name=<state id or URL>` (repeatable; drink, use, phone) copies a
  standing state's 8 rotations to `animations/pose_<name>/<dir>/frame_000.png`. They are
  flood-filled with the rest (manifest threshold), the converter keeps the `pose_` name and leaves
  pose frames out of the feet line, and the manifest stores `"poses": {name: state id}`, merged on
  re-import (a re-import with no flags rebuilt all three poses; checked live).
- Engine: `systems/npc-poses.js`, imported dynamically from `core/game.js` beside the office
  visuals (no static imports, so no harness copy lists changed). It runs on `postupdate`, reads
  `npcNeedsSystem.states`, and plays `npc-<id>-pose_<name>-<direction>` when that animation has
  frames. Nothing changed in npc-needs.js.
- Schema: `affordance.pose` ("drink" | "use" | "phone" | false), `affordance.machine` (boolean),
  NPC `poses` (false or a list of names).
- Tests: `test/js/npc-poses.test.mjs` (13: mapping, machines, override, phone, exclusions,
  seated precedence, per-NPC limits, blockers, and the postupdate pass with a stub scene: use then
  drink then idle, no frames means nothing touched, a missing `use` frame skipped silently,
  seated kept, walking off, facing). `tools/test_pixellab_pipeline.py` gained 6 (`PoseFromTest`).
- Art (test only, not approved to merge, own commit so it can be dropped): pose frames for
  ernesto_bautista, hodan_warsame and male_office_worker_v2 from the 9 existing test states.
  male_office_worker_v2's committed atlas had 85 frames that differed from PixelLab plus overrides;
  they were adopted as overrides first, so the re-import added the 24 pose frames and changed
  nothing else (all three atlases: 0 existing frames changed).
- Live proof (test_needs_sims, Tom): the desk phone rings while he stands at his post, the phone
  pose shows from pickup and follows his facing; he sits mid-call and the sit frame wins; with
  caffeine low he walks to office_coffee, shows use for 3 s, then drink, then the idle as he leaves.

Decisions:

1. Machines: `affordance.machine` when given (works through office presets too), else the
   object's `type`, `officeType` or texture key matched against
   coffee|kettle|cooler|boiler|copier|printer|microwave|vending|keypad|socket. `affordance.pose`
   overrides the whole mapping for one object.
2. Speech bubbles: the pose holds under a world speech bubble (cooler chatter, a phone call's
   lines). It drops for a conversation with the player (`inChatWith`), hostility, a knock-out,
   combat animations, seating and movement. Face-player is not a blocker: the first live run showed
   it suppressed every pose whenever the player stood within 96 px, and it only turns the NPC,
   which the pose follows anyway.
3. Drink "at the machine first, then standing": at a drinks machine the NPC shows `use` for
   `USE_LEAD_MS` (3 s of needs clock), then `drink` for the rest of the use. A drink source that
   is no machine (a mug) shows `drink` from the start. With no `use` frames the idle shows until
   drink.
4. Seated always wins, including a seated owner on a desk call. A colleague answering a ringing
   phone stands, so it gets the phone pose.
5. The hook is keyed by pose name only. A new take (a smartphone phone, a one-handed use)
   replaces a state through `--pose-from phone=<new id>` without engine changes.

Left:

- Owner verdicts: D26 (new phone and use takes), and whether standing idles should breathe.
- Pose art for ernesto_bautista and hodan_warsame still uses the first takes; nothing is approved
  to merge (the art commits are separate so they can be dropped).

### What the reading found

Pipeline, seated frames end to end:

- `cmd_import` (~line 1980) reads `sit_from` back from `tools/pixellab_characters.json` on a
  re-import, calls `take_sit_from_state(root, state_root, char)` (~2094), which copies the
  state's 8 `rotations/*.png` to `animations/sit/<direction>/frame_000.png`, then runs
  `clear_white_backgrounds(root)` (it already covers every `animations/**.png`) and
  `apply_overrides`. `convert_and_record` (~2120) writes `sit_from` to the manifest.
  The `--sit-from` argument is at ~2453.
- The converter names frames `<anim_type>_<direction>_<stem>`, so `sit` gives
  `sit_south_frame_000`. `normalize_anim_type` (converter ~24) turns `_` into `-`, so a
  folder named `pose_drink` would come out as `pose-drink`. It needs a case that keeps names
  starting `pose_` unchanged, so frames come out as `pose_drink_south_frame_000`.
- `frame_offsets` (converter ~162) skips `anim_type == 'sit'` when sampling the feet line.
  Extend that test to `anim_type.startswith('pose_')`.
- Tests live in `tools/test_pixellab_pipeline.py` (128 lines, `ClearEdgeWhiteTest` only so far).
  Add tests for `take_pose_from_state` (8 rotations copied, wrong count exits), the
  `normalize_anim_type` pose case, `frame_offsets` ignoring pose frames, and the manifest
  round trip (`poses: {name: state id}` kept on re-import).

The pipeline, engine and mapping planned here are built; "Decisions" in the second session and
the fourth session's notes above describe them as built. Per NPC, `"poses": false` turns poses
off and a list such as `["phone"]` allows only those names; an affordance's `pose: false` turns
one object's pose off. The pass plays the pose animation (`npc-<id>-pose_<name>-<direction>`)
when it has frames, never sets a texture frame directly, and face-player is no blocker.
