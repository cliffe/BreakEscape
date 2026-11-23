# L1b review R1 (code against plan)

Reviewed at `66101d30d` (commits `1530fec5e`, `28c6f6cad`, `1a637d36e`, `66101d30d`), by reading
only; no tests run. Line numbers are at `66101d30d`. Plan = `docs/achitechture/OPS_LOG_ROWS_PLAN.md`.

## Findings

### M1 (major) The playtest and a test say a password unlock of a locked screen writes no row; it raises `signin_ok` to x2
- Where: `scenarios/test_ops_logs/PLAYTEST.md:125-127` (beat 6) and `:138-141` (expected final rows);
  `test/controllers/break_escape/ops_logs_scenario_test.rb:107` (comment "no sign-in row") and `:110-111`;
  `HANDOVER_L1b_3.md` gotcha 2.
- Plan: 13.8 `signin_ok` ("`start_login_session!`, `via` password", "one per sign-in"); section 11 scripted playtest
  ("checks the events, the merged failure count").
- What: typing the right password at a locked session goes through `attempt_login!` -> `start_login_session!(..., 'password')`
  (`game.rb:3541`), which writes `signin_ok` (`game.rb:4580-4584`). The row equals the earlier one in event, as, where,
  result and detail, so `ops_log_write_rows` merges it (`ops_log.rb:574-600`): no new row, but `n` becomes 2, and
  `verify-run.rb:277` prints ` x2`. The script's expected table (`signin_ok`, no count) and "writes no new row (the known
  gap)" are therefore wrong, and a scripted tester will either report a false failure or wave through a wrong count. The
  controller test asserts only event names, so it passes while its comment is false. The code follows the plan; the
  script, test and handover do not describe it.
- Fix: PLAYTEST beat 6 and the final table expect `signin_ok x2` (and say the unlock is logged as a second sign-in,
  merged into the first row, so it sorts before `session_lock`); the test asserts `rows[1]['n'] == 2`. If the owner
  would rather a screen unlock not count as a sign-in, that is a plan question for the orchestrator, not a build fix.

### m1 (minor) A session that is not an account writes a row with no identity
- Where: `game.rb:3711-3713` (`session_end`), `:3906-3908` (`session_lock`), `:4580-4584` (`signin_ok`), via
  `ops_account_as` (`:4518-4521`) answering nil.
- Plan: 13.8 gives `{ account: }` for all three.
- What: a claimed guest session (its record id is the guest, not an account NPC) signed out writes `session_end` with
  `as` nil. The plan does not say whether a guest's sign-out is logged; no test covers it.
- Fix: decide (skip the row when `ops_account_as` is nil, or keep it and say so in A24) and add one test of a guest
  claim signed out.

### m2 (minor) A24 says two things the code does not do
- Where: `docs/ACCESS_AND_NETWORKS.md:705` ("It never holds a password, card id, ...") and `:706` ("a request the
  server refuses writes no row").
- Plan: build item 3 (docs say what is built); 13.8 (`{ card: id }` for a card with no single holder; `denied`,
  `fail`, `blocked` rows).
- What: `as: { card: id }` stores a card id (`game.rb:4236`; test `access_model_rfid_test.rb:812`). Refused swipes and
  refused sign-ins do write rows; it is a forged or unvalidated request that writes none.
- Fix: "never a password, key, foothold or relay id; a card with no single holder is named by its card id"; "a request
  the server could not validate (a forged swipe, a sign-out with no session) writes no row".

### m3 (minor) PLAYTEST says the card id is a registered secret
- Where: `scenarios/test_ops_logs/PLAYTEST.md:35-36`.
- What: the registered sources at `66101d30d` are account passwords, pin/password lock answers, wifi keys and capture
  secrets (`ops_log.rb:718-756`); a card id is not one (an rfid `requires` is not in `SECRET_LOCK_TYPES`, and `{ card: }`
  rows store it). The fixer may change the registry; the script should name only what is registered.
- Fix: drop "the card id" or re-check against the registry after the L1a fixes land.

### m4 (minor) Test gaps against section 11 and build item 2
Each is a behaviour with no test that would fail if it broke:
- a. A refused swipe at an unreached door: `access_model_rfid_test.rb:796` posts a card that admits `far_door`, so only
  the granted side of the reach check is covered (`game.rb:4209` is untested for reach).
- b. "A lock not in force": no case of an rfid lock with `locked: false` (door or object); `:794` is a non-rfid room.
- c. "A requires-only lock logs `ok` with the matched card's holder": `:807-812` covers only a card with no holder
  (`{ card: }`); no requires-only lock opened by an NPC's card or a copy of it.
- d. `signin_ok` by credential and the `route` codes `foothold`, `from`, `relay` (`game.rb:4581`): only
  password/keyboard is asserted (`access_model_login_test.rb:612`).
- e. "The denied count does not spend the blocked one": the test at `access_model_login_test.rb:683` names it but makes
  no denied attempt.
- f. "A call with `save_limit: false` neither spends nor is stopped": no test by that name in `ops_log_test.rb` at this
  commit; no L1b call site can show it (no event has both kinds of call), so it belongs to the helper suite.
- g. The malformed-call test covers a sign-in only (`:731`); nothing proves a malformed badge call rolls the unlock back
  (the row is written inside the transaction, `games_controller.rb:1290`, so it should).
- h. `alreadyOpen` for a card-less rfid post at an open object (only the door is asserted, `:723-732`).
- i. `rfid_requires_card` has no direct test; it is covered only through the existing `rfid_requires_held?` cases.

### m5 (minor, by reading only) A forged rfid post carrying an NPC id as `attempt` at a split gated rfid door
- Where: `games_controller.rb:1290-1299`.
- Plan: 13.3 "validated events only"; 13.8 "one per unlock".
- What: the ok row is written before the `gated_route_room?(attempt, target_id)` branch, which records a route room and
  does not unlock it. A valid card plus `attempt: <npc in gate.openFor>` would write `badge_swipe ok` for a door that
  stays not unlocked, and again on each repeat (merged). Forged only; no new save (the branch saves already). I did not
  confirm that `record_npc_route_room!` is reachable with `method: "rfid"`.
- Fix: write the row inside the `else` (real unlock) branch, or skip it when the route-room branch is taken; one test.

### m6 (minor) The `alreadyOpen` change is outside section 10's promise and outside the golden captures
- Where: `games_controller.rb:1224-1225`.
- Plan: section 10 "No answer from an existing route gains a field"; section 12 item 2 asks for the change (accepted by
  the orchestrator).
- What: a card-less rfid post at an open target now answers `alreadyOpen: true` in every scenario, with or without
  `logSources`. Client readers: `rfid-minigame.js:342-359` and `unlock-system.js:199,214` only change the wording
  ("Already open" / "The door is already open." instead of "Access Granted" / "Card accepted."); nothing gates on it.
  No scenario reads it. The golden fixture has no such case, so the compare cannot see it.
- Fix: none in code. Note the exception in section 10 (or the handover) and add the card-less case to the JS/controller
  expectations so it is pinned.

## Checks

1. **Rows of 13.8.** Each L1b row is written by the method and on the branch the plan names: `signin_ok`
   `game.rb:4580`, `signin_fail` `:4503`, `signin_lockout` `:4538` (after the early return), `signin_refused` blocked
   `:3520` and denied `:3531`, `session_end` `:3711` (Hash only), `session_lock` `:3906` (past the refusals), badge ok
   `games_controller.rb:1290` -> `game.rb:4192`, badge denied `games_controller.rb:1233` -> `game.rb:4207`. `as`,
   `where`, result, detail, `save_limit:` match the table; no L1b row uses `once:`, as the table has it. None doubled.
   `signin_refused` has no `kind` detail (S5c), `behind_closed_step?` and the second-step gate are absent (S8c): right.
   Findings: M1 (merge on unlock), m1, m5.
2. **Saves.** Every call sits before its method's `save!` or saves only on `stored?` (`game.rb:3522`, `:3534`,
   `games_controller.rb:1235`). The three new saves are each bounded at 10 per place, result and window by
   `save_limit: true`; no unbounded client-driven save found.
3. **Unlock route.** See m6. `rfid_requires_card` (`game.rb:4075-4095`) answers non-nil exactly where the old
   `rfid_requires_held?` answered true (same list, same revoked and UID-only rules); behaviour-identical.
4. **Reach check on the granted row.** Accept. 5.1's granted bullet names no reach condition, but section 11 lists "at
   an unreached door" among the forged posts that write nothing, and the refused row needs reach; the builder applies
   one rule to both. Side effect, by the plan's own definition of reach: a swipe made from inside an unpromoted route
   room at an onward door writes no row (the route room is not in `unlockedRooms`).
5. **Secrets and identity.** No password reaches a row: `signin_refused` denied takes the account's stored username
   only after a right password; typed names go through `ops_log_typed` (normalised, control characters stripped, 32
   characters, 96 bytes; `ops_log.rb:426-445`). Known and unknown usernames write the same shape for `signin_fail`,
   `signin_lockout` and `blocked` (test `access_model_login_test.rb:645`). A copy among several cards stores no
   identity unless a source sets `showCardHolder`; an NPC id is stored only for the holder of the card that passed.
   `{ card: id }` stores a card id, which is not a registered secret (m2, m3).
6. **No `logSources`.** `ops_rfid_lock_in_force` answers nil first (`game.rb:4150`), so no badge call runs;
   every other call returns at the helper's first lines; arguments built before the call only read. No answer body
   changes except m6. No new synced key or browser output in these commits (the helper's own keys were L1a's review).
7. **Scenario.** `scenarios/test_ops_logs/` matches the L1b description: lobby, rfid door with an access list, sign-in
   PC, NPC card to copy, `gameClock`, two sources, no reader, no seed rows, no L3 content. Controller tests read a
   re-read game. PLAYTEST: commands used exist (`bootstrap`, `moveToNear`, `interact`, `converse`, `mg type/getState/
   clickSelector/close`, `eval`, `sync`), rows are checked with `verify-run.rb --ops-log`. The two flagged usages:
   `mg clickSelector` is scoped to the active minigame's container (`test-bridge/minigames.js:217-221`) and the ids
   `#pc-start-lock` / `#pc-start-signout` exist (`pc-taskbar.js:284`); whether the taskbar sits inside that container
   is not proven by reading, and the script's `eval` fallback is sound: accept, to be settled by the first run. The
   clock read `window.gameClock.elapsedMs()` exists (`game-clock.js:149`, `game.js:1855`) and `eval` is a documented
   command (`docs/test-bridge.md:743`): accept. The script has not been run in a browser. Findings: M1, m3.
8. **Tests.** Build item 2's five named cases each have a test (`access_model_rfid_test.rb:734,747,781,770`). Gaps: m4.
9. **Docs.** README index row and A24 say only what is built, apart from m2.

## Builder departures

| Departure | Ruling |
|---|---|
| Granted swipe also needs the target in reach | accept (check 4) |
| `alreadyOpen` for every rfid request | accept, the plan's and the orchestrator's; m6 |
| `showCardHolder` stored when any source sets it | accept (orchestrator decision; L2a reader hides it per source) |
| A copy sent with no `card_ids` at a requires-only lock names its holder | accept: the lock names one card, so nothing is sorted |
| `behind_closed_step?` and the second-step gate not built | accept (S8c) |
| `save_limit: false` behaviour not tested here | m4 f |
| `signin_refused` without `kind` | accept (S5c) |
| "Right password on a locked session writes NO row" (item 3) | M1 |
| `mg clickSelector` scope and `eval` clock read unconfirmed | accept, settle in the first scripted run (check 7) |
| Dungeon graph files committed with the scenario | accept (other test scenarios do) |

## Counts and verdict

| Severity | Count |
|---|---|
| blocker | 0 |
| major | 1 |
| minor | 6 |

**Verdict: pass with fixes.** The call sites follow 5.1 and 13.8, no secret path was found, and a scenario without
`logSources` is untouched apart from the planned `alreadyOpen` answer. Fix M1 before the scripted playtest runs; the
minors can go in the same pass. All nine checks were completed, by reading only (no test was run).

## R1 outcomes

| Finding | Outcome | Commit |
|---|---|---|
| M1 | Fixed per ruling: code stands; PLAYTEST beat 6 and final table expect `signin_ok x2`; test asserts `n == 2`; HANDOVER_L1b_3 corrected | a84ab7d02, 40d47ac12 |
| m1 | Fixed: guest rows keep `as` nil; test pins a guest claim signed out; A24 says so | a84ab7d02, 40d47ac12 |
| m2 | Fixed: A24 wording (card id named for a holderless card; unvalidated requests write no row, refusals do) | 40d47ac12 |
| m3 | Fixed: PLAYTEST no longer names the card id as a registered secret | 40d47ac12 |
| m4 | a, b, c, d, e, g, h, i: tests added (mutation-proved: a, d via route code, m5). f: not mine, belongs to `ops_log_test.rb` (other fixer); open | a84ab7d02 |
| m5 | Confirmed reachable (method rfid with attempt naming a gate.openFor NPC takes the route-room branch). Fixed: the ok row now sits in the real-unlock branches; test shows no row and room in npcRouteRooms | 49211abbb, a84ab7d02 |
| m6 | Fixed as ruled: code stays; controller test for card-less alreadyOpen (open object, and a game with no logSources); A24 line | a84ab7d02, 40d47ac12 |
