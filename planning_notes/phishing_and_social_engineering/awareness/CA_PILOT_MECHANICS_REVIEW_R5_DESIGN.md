# CA pilot mechanics plan: design review, round 5 (final delta)

Reviewed: `CA_PILOT_MECHANICS_PLAN.md` at 94698cb89, diff from ad7a61892, against R4 (0B 0M 6m). Six code reads under `public/break_escape/js/` plus the validator.

Counts: 0 BLOCKER, 0 MAJOR, 3 MINOR (new). R4: 6 of 6 minors resolved.

Verdict: the plan is ready to build. Every cited line says what the plan claims. The three new minors are wording and test-scope points, none changes a design.

## Part A. R4 findings

| R4 | Status | Where | Note |
|---|---|---|---|
| m1 miss timer counts from the door | Resolved | 1.1 step 5, `ca12_t_door_missed` (14000 ms), mapping 2, live (l), routes, risks | Every mention now says "after she leaves the door"; the choice of the smaller fix is stated. The "few seconds after she sits down" rests on her walk time, so live (l) still measures it. |
| m2 no live proof of E2 | Resolved | Section 4 step 2b | `test_side_door_gate` extended; covers done global, cap, reload, open chat, and the no-`holdUntil` case; runs before E3. |
| m3 `remove_world_item` room lookup | Resolved | E4 action text, E4 test, live (b) | Id scheme confirmed (below). No-room form walks every declared room, destroys the sprite if loaded, always sends the room-state delete. Unloaded-room unit test and reload-then-timeout live step added. |
| m4 key table drift | Resolved | E4 validator text, E4 tests | Drift test reads the `case` labels. See R5-m3 for its direction. |
| m5 watcher criterion | Resolved | E3 "Reload", 3 E3 (f), episode-state check | Now a pure function of saved state: `worldBeatPickedVia === "lookup"`. The lookup, carry, resumed, unset table is complete and tested. |
| m6 ink and `globalVars` bridge | Resolved | 2.6 globals, section 3 bridge check | Declaration rule and the page-level check are in. |

## Part B. Code facts

- `item-drop.js:366` is `id: worldData.id` inside `persistDrop`; `:467` is `obj.objectId = data.id || ...`. Both as cited, so `item` finds the object.
- `room-state-sync.js:104` is `removeItemFromRoom(roomId, itemId)`. It posts `remove_object` to `update_room`, and deletes `rooms[roomId].objects[itemId]` only on success.
- `npc-conversation-state.js`: `isGlobalVariable` at `:466` (`global_` prefix, then the declared set or `gameScenario.globalVariables`), `syncGlobalVariablesToStory` at `:503`, `variableChangedEvent` at `:593`. The plan's rule (declared or `global_`-prefixed, otherwise NPC-local) is right.
- `chat-helpers.js:561-595` is the `set_global` tag; it writes `gameState.globalVariables`, broadcasts, then emits `global_variable_changed:<name>`. As cited.
- `apply-actions.js`: one `switch (action.type)` at `:203`, 20 case labels, flat, so a `case '<name>'` parser is safe.

## Part C. New findings

### MINOR

#### R5-m1. The synced-state risk line still says `worldBeatPicked` is "one boolean, written once"

Section 1 line 18. R4-m5 added `worldBeatPickedVia`, a string written up to twice per beat (`lookup` then `resumed`, or `carry`). It is still bounded and a delta, so the rule holds, but the sentence is now wrong and the plan's own check list would miss it.

Fix: say "one boolean and one short string per beat, each written at most twice, sent as deltas".

#### R5-m2. "No log above debug" for `remove_world_item` is not what `removeItemFromRoom` does

E4 action text. For each declared room that never held the stick, the server answers `success: false` and `removeItemFromRoom` runs `console.warn("Failed to sync item removal ...")` (`room-state-sync.js` just after the local-state update). A no-room call over the whole scenario logs one warning per empty room, and costs one POST per room. A live proof that treats console warnings as failures would trip.

Fix: either keep the wrapper's quiet promise by calling the sync with a flag that silences the warn, or reword to "a warning per room that did not hold it" and have the live proofs expect it. Narrowing with `roomIds` where the shell can (ca15's drop rooms) also cuts the POSTs.

#### R5-m3. The drift test checks one direction, and two `known_actions` types have no client case

`known_actions` (`scripts/validate_scenario.rb:3129`) lists `unlock_task` and `unlock_aim`; `apply-actions.js` has no case for either (no match in the file). The plan's test asserts "every `apply-actions.js` case label is in the key table and `known_actions`", which passes. The key table must still carry keys for those two types, or "every type in `known_actions`" is not met.

Fix: say in the plan that `unlock_task` and `unlock_aim` are handled elsewhere (server or another module, whichever it is) and take their keys from there, or note them as table-only entries the drift test skips.
