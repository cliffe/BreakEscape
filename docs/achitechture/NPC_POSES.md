# NPC poses (drink, use-machine, phone)

## Handover (2026-11-15, session wound down early)

Built: nothing yet. No code, tests or art changed on build/ol-poses. This note holds the
reading done so far and the planned design, so the next agent can start straight away.

Tested: nothing. No server was started.

Left: all of it. In order:

1. Pipeline (`tools/pixellab_pipeline.py`, `tools/convert_pixellab_to_spritesheet.py`).
2. Engine hook (new `public/break_escape/js/systems/npc-poses.js`, installed from `core/game.js`).
3. Node tests, Python tests, skill doc section.
4. Live proof on :3093 with a scratchpad placeholder atlas or a bridge stub.

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

Planned pipeline change: `--pose-from name=<state id or URL>`, repeatable (`action="append"`),
names limited to `drink`, `use`, `phone`. A generalised `take_frames_from_state(root,
state_root, char, anim_name)` serves both sit and poses. The manifest gets
`"poses": {"drink": "<id>", ...}`, merged with the stored one on re-import (a new
`--pose-from` for one name replaces only that name).

Engine:

- `NPCBehavior.playAnimation` (npc-behavior.js ~2841) returns early when `this._seat` is set;
  it replays only when the anim key or flipX changes (`lastAnimationKey`). Facing is
  `behavior.direction` ('down', 'up-left', ...); seating.js ~37 has the map to compass names.
- Needs state is on `window.npcNeedsSystem.states` (Map id -> state). A use is
  `s.job.phase === 'using'` with `s.job.targetId`; the object comes from
  `npcNeedsSystem.world.getObject(id)` and its `affordance.satisfies`. Visits
  (`job.kind === 'visit'`), print errands and `socialDesk` uses are not machine uses.
  A desk-phone call is `s.call` (`{ phoneId, until }`, npc-needs.js ~4651); a colleague
  answering a ringing phone is `job.phone` in `using`.
- Blockers to respect: `b._seat` / `b._seatMove` (seated wins), `b.isMoving`,
  `b.currentState` in `face_player`, `maintain_space`, `chase`, `flee`,
  `npcHostileSystem.isNPCHostile/isNPCKO`, `npcNeedsSystem.world.inChatWith(id)`, and any
  playing hit, attack, punch, jab or death animation.
- `npc-office-visuals.js` already runs a `postupdate` pass (`followHeld`); the pose pass
  should be its own module on `postupdate` too, loaded by dynamic import in `core/game.js`
  (~2089) next to the office visuals. A new module with no static imports, and no new static
  import in npc-needs.js, means no JS test harness copy list changes (38 harnesses copy
  npc-needs.js).

### Planned design and default mapping

Per frame, for each needs NPC: work out the wanted pose, check the atlas has
`pose_<name>_<compass>_frame_000` (`scene.textures.get(key).has(frame)`), and if so stop
the animation and set that frame. When the pose ends (or a blocker appears), clear
`lastAnimationKey` and call `playAnimation('idle', direction)` so the normal animation comes
back. With no such frame nothing is touched, which is every atlas today.

Default mapping (an affordance's `pose` field overrides it; `pose: null` turns it off):

| Use | Pose |
| --- | --- |
| affordance satisfies `caffeine` or `thirst` | `drink` |
| same, at a machine (coffee machine, boiler, water cooler) | `use` for the first few seconds, then `drink` |
| other machine objects: copier, printer, microwave, vending, keypad, socket, boiler | `use` |
| desk-phone call or answering a ringing desk phone, standing | `phone` |
| eating, sitting, visits, social desk, anything else | none |

Per NPC: `"poses": false` on the NPC record turns poses off; a list such as
`["phone"]` allows only those names. Seated phone calls keep the sit frame (a seated phone
variant is only on request).

Note from the scenario scan: few objects across `scenarios/` declare `satisfies` inline next
to their `type` (the regex scan found cake1, staff_lockers; boiler, water cooler and
microwave had none inline), so the machine list should key on object `type` and texture as
well as `satisfies`. Check `scenarios/test_needs_sims/scenario.json.erb` before fixing the list.
