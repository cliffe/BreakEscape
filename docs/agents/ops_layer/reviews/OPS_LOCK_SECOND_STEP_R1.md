# OPS_LOCK_SECOND_STEP_PLAN.md, review round 1

Reviewer: Opus, 2026-11-19. Plan at commit fec5fbf5f, 618 lines. Code read in this worktree.

The review stopped at the context limit. Attack points 1 to 3 were checked against the code. Points 4 to 6 (fit with the MFA plan's functions and routes, the log plan's contract, state and reload, schema and validator line numbers) were **not checked** this round and should be the main job of round 2.

Counts: 1 blocker, 3 major, 4 minor, 1 nit.

## Blocker

### B1. A gated object's descendants are not behind the gate

Plan lines 38-40, 210-233, 454: "nothing behind the lock reaches the browser before both checks". Rules A and B only cover the gated object itself. Nothing stops the player opening an object *inside* it.

- `/unlock` checks ancestors only for scoped objects (under a sign-in PC, in a profile or a share). `unlock_scope_refused?` returns false when `login_scope_of` gives no scope (`game.rb:4194-4200`), so a plain nested object never has its parents tested.
- Take an unlocked child container (a folder with `contents`, `locked: false`) inside a gated PC. A post of `/unlock` with `method: "unlocked"` and the child's id **or name** passes `validate_unlock` (`game.rb:4708-4711`). It has no `secondStep`, so the gate does nothing. `unlock_object!` writes it, and the answer ships `filter_container_contents(child)` (`games_controller.rb:1315-1331`). No first factor and no step are needed. Both finders match names (`games_controller.rb:3096`, `game.rb:4867`), so a guessed common name ("Documents") is enough.
- The same applies to a plain-locked child whose answer the player knows from elsewhere. In the plan's own example, if only `moira_pc` carried the step, posting `audit_2024.zip` with its password would skip Moira.
- After that write, the plain `GET /container` branch tests only the container itself (`games_controller.rb:3119-3126`), so the child keeps serving.

**Fix.** Add an ancestor rule beside Rules A and B. An object whose path holds a `secondStep` object that is not open by id is refused exactly as an invented id would be: at `/unlock` before `validate_unlock` reports, at plain `GET /container`, at the take route and at the inventory copy. `locate_object_in` already builds the path and `path_unlocked?` (`game.rb:3310`) is the model. Add to the "Nothing leaves early" test (plan 454) a `locked: false` child folder and a plain-locked child, each posted by id and by name.

## Major

### M1. A posted alias that is already open skips the first factor

Plan 230: "a posted alias that is in the list still meets the gate". This means the gate then **issues a challenge**. But `validate_unlock` returned true only because the posted string was already in `unlockedObjects` (`game.rb:4695-4698`), not because a credential was given.

How it happens: plain object P shares a name with gated G. P opens by name, so the name enters the list; Rule A blocks ids only (plan 210-215). A post of that name to G then gets a `secondStep` answer with no password, and pestering opens G. With `method: "flag_reward"` the gate is skipped outright (plan 243-245), so `record_step_open!(G)` writes G's id with no reward. The validator refuses such twin names, but the plan's own "Twin names" fixture (plan 455) is the case where it has not run, and the server must not depend on the validator.

**Fix.** For a target with `secondStep` that is not open by id, judge the first factor against the resolved object's id with the already-open shortcut turned off. Skip for `flag_reward` only when `flag_reward_unlocks_object?(object)` holds for the resolved object (`game.rb:4732-4735`). Add both cases to the twin-names test.

### M2. `chat-helpers.js` is not an object-unlock poster, and no client path posts `npc` for an object

Plan 311-312 and 459, beat K9 (plan 492).

- `minigames/helpers/chat-helpers.js:99-121` handles only the `unlock_door` tag, through `NPCGameBridge.unlockDoor`.
- `npc-game-bridge.js` has `unlockDoor` (`:78`) and `giveItem` (`:210`), and no object unlock.
- The only `'npc'` posts in the client are door posts (`npc-game-bridge.js:108`, `person-chat-conversation.js:464`).
- The server branch for objects (`game.rb:4719-4722`, `:5051-5077`) is reachable only by a crafted request.

So the L1 client item has nothing to edit, and K9 cannot be played.

**Fix.** Drop the chat-helpers item. Make the `npc` object case a controller test of a crafted post: the gate still applies. Rewrite K9 around a real path. If an ink tag that opens an object is wanted, that is new work: an open question with a recommendation.

### M3. Handling `secondStepDue` in each poster misses callers; one central check would cover them all

Plan 308-314 lists the callers by hand. It misses these:

- `systems/apply-actions.js:198-209`: the `unlock_object` action posts with `method` set to the action's source. The `flag_reward` source takes the skip path, but the poster is still unlisted.
- `unlock-system.js:999` and `:1020`: the `'unlocked'` posts.
- The callbacks in `unlock-system.js:1187-1240`, which pass on `result?.serverResponse`.

`doors.js:699` is listed, but it is the gate clone-as-entry path, which plan 299 rules out for a `secondStep` room, so it can never fire there.

Every object poster already goes through `unlockWithRouteRoomRetry` (`utils/lock-scope-refusal.js:49-77`) or `ApiClient.unlock` (`api-client.js:105-119`).

**Fix.** Catch `secondStep: true` once, in `ApiClient.unlock`. Open the pane there, and resolve with the final answer from `finishLock`, or with a "cancelled" value that every caller treats as not open. The JS test then pins the one choke point plus one caller per pad, and a grep spec confirms that nothing posts `/unlock` except through it.

## Minor

### m1. `prop_door` is only partly decided by the server

Plan 297 and 301. The hand-over, the dwell and the room are server-checked (`npc_frustration.rb:151-201`, `:349-351`). But the failures that raise frustration are reported by the browser, which the server only paces and checks for sense (`npc_frustration.rb:2-5`; `failWhy` is "what the client reported", `:121`). A crafted client can drive the count up and get a `secondStep` door propped open without the step.

**Fix.** Call it best-effort, the same class as tailgating under the cheat policy (brief §3). Reword question 2 so that (b), refusing `secondStep` on a room a `prop_door` targets, is weighed on that basis.

### m2. The exits table is incomplete for take routes

Plan 227-228. Two take routes are missing from the table: the share take (`network_access.rb:1732`) and the sign-in desktop take (`games_controller.rb:3510`). Both already test the path by id, so they pass Rule B, but the table should list them.

`find_accessible_item` looks only one level into a room object's contents (`games_controller.rb:3662-3666`). An item inside a gated archive that is itself nested in a PC is never found, so it cannot be taken from the room. Say so, or the "take" beat in K7 may surprise the builder.

### m3. Name which finder is "resolved once"

Plan 223 and 241. The controller answers with `find_object_in_scenario` (`games_controller.rb:1318`, `:3048-3104`). That finder matches id or name, has no generated-id form and walks in a different order from `Game#find_scenario_object`, which the gate is to use. The plan should name `find_scenario_object`, replace the `:1318` call with its result, and add a test where the two finders disagree.

### m4. Nested takeable objects

Plan 172-176 refuses a `takeable` top-level item but allows any `contents` entry. A takeable archive inside a PC can be carried. Its inventory copy has its contents stripped (`games_controller.rb:3328-3331`, `game.rb:7229-7232`), and opening it later from the inventory reaches the gate, so this probably works. State the rule either way and add the case to the "Nothing leaves early" test.

## Nit

### n1. Length

These sections repeat:

- Plan 121-129 (the MFA plan summary) repeats cross-plan requests 1 to 3 (plan 557-566).
- Section 7 (plan 354-363) restates the 5.2 gate answer and the exits table.
- The door-opener table (plan 292-299) and question 2 (plan 587-592) give the same three options twice.
- Plan 549-553 restates what the row table already says.

About 40 lines could go.

## Checked and sound

- The pads' handling of a 200 `success: false` (`password-minigame.js:1395-1408`, `pin-minigame.js:699-710`) is as the plan states.
- `notifyServerUnlock` callers pass the answer to `unlockTarget` untested.
- `object_state_params` cannot set `locked` (`games_controller.rb:3878-3883`).
- The room marker runs before the contents filter (`game.rb:2740`, `:2999-3011`).
- The callers of `unlock_room!` are as listed.

## Verdict

Not ready. B1 breaks the plan's central claim. M1 lets an alias skip the first factor. M2 and M3 leave the client half resting on a poster that does not exist and a caller list that is incomplete. Round 2 should also do the unchecked points 4 to 6.
