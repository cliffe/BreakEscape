# LIVE_L2 control: why van_two and malhotra_post were not reached

Follow-up to `LIVE_B2A.md` section D. In that run both targets failed with `arrived-but-outside-plain-range` while Darren and Sofia stood at the kettle. The question was whether the cause was the extras, the layout, or the harness's `moveToNear` helper.

## Verdict

**Harness helper fault.** The extras are not the cause.

- `moveToNear` walks the player to a stand point with a no-click pathfinder move (`moveVia: pathfinder-direct(no-click)`). That move stops 34 px short (van_two) or 48 px short (malhotra_post) of its own stand point, at the same spot every time, with no physics body on the target point.
- A raw `moveTo` to that same feet point (133,248), with no click, stops in the same place (147,186). The keyboard walk reaches the point. So the route is open, and the helper's pathfinder move is what fails.
- The failure happens with the extras away (teleported off the kettle) and with them at the kettle. The extras do not change the `moveToNear` result.
- The engine's own `interact` still succeeds after the failed move in the away runs (van_two by overlap walk, malhotra_post directly), so the objects are reachable.

Two layout notes sit alongside this verdict, but neither causes the reported code:

- van_two has no free aim point: `interact` reports `sharedWith: nightshade_van` and "No point of this target is free of other interactables".
- With a keyboard walk and E, the key opened a van-team NPC's chat rather than the object. For van_two it was Minder (2 of 2 logged runs); for malhotra_post it was Nightshade (2 of 2 logged runs). That is a player-facing layout issue to take to the level designer, separate from this failure.

## Method

- Server: keyless, port 3099 (pre-existing, not touched). Browser: headless chromium via `tools/playtest/m10-ol-lib.mjs` `start()`, setFPS(20), fixed steps on, tutorial declined, `/tts` aborted.
- Every run used a fresh game from `tools/playtest/new-game.rb m10_full_disclosure`. Game ids are listed below.
- Extras "away": after `settle()`, the extras stayed on the kettle use cells (276,268) and (308,268) by default (job null, caffeine about 95). They did not leave on their own. At 8 s they were moved to (96,96) and (128,96) with `sprite.setPosition` and `body.reset`. This is a harness intervention, not a game event. They then walked back toward the kettle to brew (caffeine fell to about 20), passing about 60 to 130 px north of the approach path. They were not on it, but the "away" control is not perfectly clean.
- Extras "kettle": `needs.set` caffeine 5 for both. Both stood at the kettle within 2 px of the use cells within 1 s.
- Control A: `moveToNear(target)`, then `interact(target)`.
- Control B: keyboard `walk(direction, 200)` steps toward the object's centre until `getState().nearby` reports the target `inRange`, then `pressKey('e')`.
- Pathfinder check (P): `moveTo(133,248, {pointer:false})` from the start, extras away.
- Scripts and raw JSON: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/probe_l2/probe.mjs` and the `*.json` files beside it.

## Game ids

| Game id | Control | Target | Extras | Note |
|---|---|---|---|---|
| 8001 | A | van_two | kettle | Script bug (object lookup crashed); discarded |
| 8009 | A | van_two | away | First valid run |
| 8012 | A | van_two | away | Repeat with blocker diagnostics |
| 8016 | B | van_two | away | Walk reached range, E opened a person chat |
| 8020 | A | malhotra_post | away | |
| 8023 | B | malhotra_post | away | E opened Nightshade's chat |
| 8026 | A | van_two | kettle | |
| 8028 | B | van_two | kettle | E opened Minder's chat |
| 8032 | P | van_two (raw moveTo) | away | Pathfinder check |
| 8033 | A | malhotra_post | kettle | |
| 8036 | B | malhotra_post | kettle | Walk stalled 44 px from Malhotra (greedy route, see below) |
| 8038 | B | van_two | away | E opened Minder's chat (logged) |
| 8040 | B | malhotra_post | kettle | Repeat, reached range, E opened Nightshade's chat |
| 8044 | A | van_two | kettle | Repeat, logged the blocking UI |

## Control A: moveToNear, then interact

| Game | Target | Extras | Result | Shortfall | Arrived (sprite centre) | Feet target | Plain distance | Interact | Player body after |
|---|---|---|---|---|---|---|---|---|---|
| 8012 | van_two | away | `arrived-but-outside-plain-range` | 34 | (147,186) | (133,248) | 48 | ok, `overlap-walk-then-menu`, picked The Second Van, opened ExamineMinigame | (124.4,217) |
| 8020 | malhotra_post | away | `arrived-but-outside-plain-range` | 48 | (118,186) | (83,251) | 39 | ok, `direct`, picked null; no minigame open after (not identified) | (65.4,217) |
| 8026 | van_two | kettle | `arrived-but-outside-plain-range` | 34 | (147,186) | (133,248) | 48.4 | `blocking-ui` | (131.9,217) |
| 8033 | malhotra_post | kettle | `arrived-but-outside-plain-range` | 48 | (118,186) | (83,251) | 40 | `blocking-ui` | (72.9,217) |
| 8044 | van_two | kettle | `arrived-but-outside-plain-range` | 34 | (147,186) | (133,248) | 48.4 | `blocking-ui` | (131.9,217) |

Object positions as the bridge reports them. For van_two the entity is at (106,234), size 20 by 8 px (top-left origin). For malhotra_post the entity is at (64,225), size 80 by 80 px (NPC sprite). Interaction range is `INTERACTION_RANGE` = 32 px (`public/break_escape/js/utils/constants.js:65`). The failure code is set at `public/break_escape/js/systems/test-bridge/index.js:1150` when the harness's plain-range check after the move is over 32 px. The bridge's own `inRange` on the entity reads True for malhotra_post in 8020 even though the plain check reads 39, so the two measures disagree there.

The `blocking-ui` in the kettle runs was an Agent HaX phone bark, `npc-bark--phone`, reading "Field console by the gate first. Start it, then the terminal." The bark was on screen before `interact` was called. It did not appear in the away runs. It was not traced to a cause. Kettle events in the same window were `npc_use_started:fp_kettle`, `npc_chatted:fp_kettle` and `npc_overheard:darren_price`. So the three kettle runs with a bark (8026, 8033, 8044) against zero away runs with one is a correlation, not an explanation. The kettle interactions were never a clean test, because the stand point failed first.

## Control B: keyboard walk, then E

| Game | Target | Extras | Steps | Final sprite centre | In range at stop | E opened | Player body at E |
|---|---|---|---|---|---|---|---|
| 8016 | van_two | away | 4 | (147,208.5) | yes | PersonChatMinigame (speaker not logged) | (147,239.5) |
| 8038 | van_two | away | 4 | (147,212.2) | yes | PersonChatMinigame, "Minder" | (147,243) |
| 8028 | van_two | kettle | 4 | (147,216) | yes | PersonChatMinigame, "Minder" | (147,247) |
| 8023 | malhotra_post | away | 7 | (102.1,246) | yes | PersonChatMinigame, "Agent 0x47 'Nightshade'" | (102.1,277) |
| 8036 | malhotra_post | kettle | 15 | (72,268), stalled | no (Malhotra 44 px) | nothing (E not scored) | n/a |
| 8040 | malhotra_post | kettle | 7 | (102.1,246) | yes | PersonChatMinigame, "Agent 0x47 'Nightshade'" | (102.1,277) |

The walk reached a point the engine marks in range for both objects, with the extras both away and at the kettle. In each case E opened a neighbouring NPC's chat, not the object. 8036 is a greedy-route stall (the walker drifted one row low at x 72 to 109 and hit a wall), not an extras effect. Its repeat, 8040, took the route that worked in 8023.

## Pathfinder check (P)

| Game | Call | Extras | Result | Arrived sprite centre | Feet | Distance to target | Shortfall |
|---|---|---|---|---|---|---|---|
| 8032 | `moveTo(133,248, {pointer:false})` from start | away | `ok:true`, `reachedTarget:false` | (147,186) | (147,217) | 34 | 34 |

The keyboard reached (132,246) in the B walk. So the feet point is walkable, and the no-click pathfinder call is what stops short. A real click on the same point was not tested, so this does not separate the bridge's pathfinder call from the engine's click path. It is a harness helper fault in the sense the brief uses: the stand point the helper chooses is reachable, and its own move does not get there.

## Caveats

- The "away" control is partial. The extras walked back toward the kettle after the teleport, passing about 60 to 130 px north of the approach. They were not on the route to either stand point.
- The `blocking-ui` in the kettle runs is unexplained. It may be a timed hub bark, not something the extras caused.
- Malhotra's `interact` in 8020 reported ok with no minigame open afterwards. I did not identify what it did.
- I did not run a control where the approach is blocked by a placed NPC, so the claim that the NPCs themselves do not block the route is based on the three runs above.

## Next steps (not done here)

1. Make `moveToNear` retry from the keyboard route or try a second stand point when the pathfinder move stops short (harness, owner: playtest lib).
2. Layout: van_two's aim area is shared with Nightshade and Minder. Decide whether the van is meant to be reachable by E from the van-team stand point, or whether the NPCs should move (scenario, owner: level designer).
3. Identify what triggers the Agent HaX field-console bark, to rule it in or out for the kettle runs.
