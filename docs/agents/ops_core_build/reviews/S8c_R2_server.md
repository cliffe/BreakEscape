# S8c review, round 2: server, model, validator and graph

Reviewed: branch `ops-lock2` at `2788775bd`, the server part of `git diff 7f7fbf0a2..HEAD`
(`games_controller.rb`, `lock_step_requests.rb`, `game.rb`, `lock_second_step.rb`, `lock_step_gate.rb`,
`lock_step_reach.rb`, `ops_log_events.rb`, `validate_lock_step.rb`, their tests and the A25 docs).

How the evidence was made: throwaway integration tests through the real routes, kept outside the
tree in the session scratch folder `s8c-r2-server/` (`probe_a_test.rb`, `probe_b_test.rb`,
`c_test.rb`, `cmp_test.rb`, `d_test.rb`, `e_test.rb`; outputs `a_out.log`, `b_out.log`, `c_branch.txt`,
`c_main.txt`, `cmp_branch.txt`, `cmp_main.txt`, `d_out.txt`, `e_out.txt`). Each quoted answer is `[status, body]` as printed.
Nothing in the tree was changed but this file.

Counts: 0 blockers, 0 majors, 8 minors.

## Round 1 findings

| Finding | State | Evidence |
|---|---|---|
| R1-SERVER1 (major) name twin opens a gated container on `GET /container` | closed | `lock_step_served_refused?` at `games_controller.rb:651` and `:669`. Decoy named `Folder` unlocked by `unlocked`, then `GET /container/Folder` for the id-less folder inside the closed safe: `[404, "Container not found: Folder"]`; `lock_step_r1_server_test.rb` twin test passes. A residue on the take route is R2-SERVER4. |
| R1-SERVER2 (major) two test classes of one name | closed | All the stage's Ruby tests in ONE process: `bin/rails test test/controllers/break_escape/lock_step_*_test.rb .../ops_lock_step_*_test.rb test/models/break_escape/lock_step_*_test.rb test/unit/lock_step_*_test.rb test/unit/ops_lock_step_click_paths_test.rb test/unit/ops_log_object_kind_test.rb` gives `239 runs, 14623 assertions, 0 failures, 0 errors`. |
| R1-SERVER3 (minor) takeable room object stays in reach | closed as a stated limit | Doc and the comment say so; pinned in `lock_step_carried_test.rb`. What a hand-built request can do is set out below. |
| R1-SERVER4 (minor) "add routes put a gone item back" | closed | Doc sentence corrected; one test per route in `lock_step_carried_test.rb` (pass). |
| R1-SERVER5 (minor) `/mfa/*` tells a hidden gated id from an invented one | closed for a room object; one residue | 55 request pairs (real hidden id against `nothing_here`, before the room opens) are identical in status, body and state change: see "Checked". The residue is an NPC-held case on the take route (R2-SERVER4). |
| R1-SERVER6 (minor) two validator lines | closed | `validate_lock_step.rb:231`, `:364-368`; `node --test validator-lock-step ops-unchanged-validator dungeon-graph-lock-step`: 83 pass. |
| R1-SERVER7 (minor) log row room of a carried gated object | closed for an NPC's item, a start item and a grant item; not for a taken room object | R2-SERVER5. |
| R1-SERVER8 (minor) the opener has two writers | closed | `lock_step_name_opener!` is gone; `grep -rn lock_step_name_opener app lib test` finds nothing. One behaviour changed with it: R2-SERVER6. |
| R1-SERVER9 (minor) third way round the step not in the docs | closed | `docs/ACCESS_AND_NETWORKS.md` A25 "Ways round the step" and "Known limits" name the object flag reward. |

## New findings

### R2-SERVER1 (minor): `GET /scenario` answers 500 when `social.mailClient` is not an object (new in 4c13651ea)

`withhold_headless_habits!` calls `social.dig('mailClient', 'contacts')` (`game.rb:7802`), which
raises when `mailClient` is an Array or a String. Main serves the same scenario.

```
branch: bootstrap mailClient=[]  -> 500   direct call: TypeError: no implicit conversion of String into Integer at game.rb:7802
branch: bootstrap mailClient="x" -> 500   direct call: TypeError: String does not have #dig method at game.rb:7802
main:   bootstrap mailClient=[]  -> 200   bootstrap mailClient="x" -> 200
```

No shipped scenario has such a value (golden compare passes), so nothing shipped breaks; it is a
new way for the bootstrap to fail. Fix in `app/models/break_escape/game.rb:7802`: read
`mail = social['mailClient']` and walk `mail['contacts']` only when `mail.is_a?(Hash)` and the
value is an Array. Add the two shapes to the habits test in `lock_step_r1_server_test.rb`.

### R2-SERVER2 (minor): a headless record still ships `awareness`, which decides the prompt habit the strip was meant to hide

The strip removes `approvesPrompts` and `promptPatience` from each `emailRecord`, but leaves
`awareness` (and `role`). `MfaModel.prompt_habit` falls back to the level's preset when no habit
is authored (`lib/break_escape/mfa_model.rb:162-168`; `PROMPT_PRESETS`, `:28`: `low` is `pestered`,
the others `never`). A room NPC loses `awareness` and `role` (`WITHHELD_NPC_KEYS`, `game.rb:7754`).

```
GET scenario 200: FOUND ["awareness"]
social: {"characters"=>{"ghost"=>{... "emailRecord"=>{"role"=>"clerk", "habits"=>{"screen"=>"locks"}, "awareness"=>"low", "itemsHeld"=>[]}}},
         "mailClient"=>{"contacts"=>[{"npc"=>"pat_mail", "name"=>"Pat", "emailRecord"=>{"habits"=>{"screen"=>"locks"}, "awareness"=>"high"}}]}}
```

So for a headless owner the browser can still read whether pestering will pass. Every other route
tried (`scenario_map`, `room`, `objectives`, `keyring`, `network`, `capture_secrets`, `mfa/phone`,
`sync_state`, `feed_post`, the gate and the prompt answer) carried none of `approvesPrompts`,
`promptPatience`, `pestered` or `awareness`. No shipped `emailRecord` carries `awareness` or
`habits`. Fix in `app/models/break_escape/game.rb`, `withhold_headless_habits!`: delete
`awareness` from each record as well (and `role`, if the owner agrees: see below), after a grep of
`public/break_escape/js` for a reader of `emailRecord.awareness`; add both words to the test at
`lock_step_r1_server_test.rb:124`.

### R2-SERVER3 (minor): the open echo is the request's own words, not the lock's canonical name

`lock_step_open_echo` (`lock_step_requests.rb:94-99`) answers `targetId: target_id` and
`lock_step_type(target_type)`, so a gated object opened by its name, by its generated id or with
any type word but `item` is echoed as sent. The gate for the same requests names the id.

```
gate  by name "Real safe"        -> "targetType"=>"object", "targetId"=>"realsafe"
open  by name "Real safe"        -> {"success":true,"type":"object","targetType":"object","targetId":"Real safe", ...contents}
open  by generated id            -> "targetId":"hall_safe_2"
open  with targetType "foo"      -> "targetType":"foo","targetId":"realsafe"
```

The commit says the open answer "names it", the code comment says "canonical", and the scanner
places an open by this echo. The real client sends ids, so no click path shows it. Fix in
`app/controllers/break_escape/lock_step_requests.rb`: keep the `lock_step_info` result and answer
`{ targetType: info[:subject][:kind], targetId: info[:subject][:id] }`; add the name and the
generated-id case to the open test in `lock_step_answer_shapes_test.rb:205`.

### R2-SERVER4 (minor): the take route still tells two gated things from an invented item

`lock_step_take_refused?` (`lock_step_requests.rb:171-176`) judges only an item the lookup found,
and by resolving its id string again (first match by id OR name), not the object itself.

```
before the vault opens, viccase = a gated case held by an NPC inside the vault:
  POST inventory add {briefcase, viccase}        -> [422, "NPC not encountered: vic"]
  POST inventory add {briefcase, nothing_here}   -> [422, "Item not found in scenario: briefcase"]
twin: a plain note named "safe_memo" listed before the closed gated safe that holds the item safe_memo:
  POST inventory add {notes1, safe_memo}         -> [422, "Container not unlocked: realsafe"]
  POST inventory add {notes1, nothing_here}      -> [422, "Item not found in scenario: notes1"]
```

Nothing is added in either case. The first names an NPC in a room the player has not opened,
which commit 072a72a70 says the take no longer does ("refused as an invented id on ... take");
main answers the same for any NPC's item, so it is not new, only not closed. The second needs a
twin the validator refuses. Fix in `app/controllers/break_escape/games_controller.rb:1449` and
`lock_step_requests.rb`: judge `@collectible_item` with `lock_step_served_refused?`-style identity
(`@game.locate_served_object(item)` then `lock_step_scope_refused?`), and when the lookup failed
with an error but the request's id is exactly a gated object's id (or below one) that
`lock_step_scope_refused?`, answer "Item not found in scenario: <type>" too. Add both cases to
`lock_step_r1_server_test.rb`.

### R2-SERVER5 (minor): a gated room object the player took is still logged in the room it was authored in

`object_entry` asks `login_scope_of` before `player_carried_entry` (`ops_log_events.rb:186`), and
`login_scope_of` answers for any room object. The comment above it (`:179-182`) says a held item
belongs to no room and a dropped copy to the room it lies in.

```
roomcase (takeable, gated, authored in hall), taken:            object_entry -> {:room_id=>"hall"}
then dropped in vault and removed from the inventory:          object_entry -> {:room_id=>"hall"}
bobcase (an NPC's), held -> {:room_id=>nil}; dropped in vault -> {:room_id=>"vault"}   (as the fix intends)
```

Every row resolves and no place is revealed (a drop needs an open room: `update_room` refuses any
other, and a forged drop of `bobcase` or `vaultsafe` was refused 422). Fix in
`lib/break_escape/ops_log_events.rb`: ask `player_carried_entry` first when
`game.second_step_ids.include?(id)` (so no shipped row moves), and add the taken room case to
`test/unit/ops_log_object_kind_test.rb`; or, if the authored room is wanted, say so in the comment.

### R2-SERVER6 (minor): a repeat gate names an opener the server does not remember

Since 5726bd0a9 the grant is noted only when the step is issued (`lock_step_gate.rb:42-48`), but
the answer names the opener of every request (`:50`). The removed `lock_step_name_opener!` wrote
the grant on each `npc` gate.

```
PIN gate at door lab, then POST /unlock door lab carl npc -> gate with "opener"=>"carl"; npcStepGrants -> {}
carl gate, then dave (also allowed) -> gate with "opener"=>"dave"; npcStepGrants -> {"door:lab"=>"carl"}
```

`docs/ACCESS_AND_NETWORKS.md` (A25, "Who is who") says the opener is remembered so a reload at the
door reopens the pane; after the first case the bootstrap room has no `npcStepOpener`. Only an
opener `validate_unlock` accepted is ever named: `erin` (no `unlockable`), an invented `zed`, an
Array, a Hash and nil as `attempt` are each `[422, Invalid attempt]` with no grant, before and
after the pass. Fix in `app/models/break_escape/lock_step_gate.rb`: for a door and method `npc`,
call `note_npc_step_grant!` (and save) whenever the stored grant differs from `opener_id`, fresh
or not; keep "a repeat by the same opener writes nothing" in `lock_step_gate_test.rb:185`.

### R2-SERVER7 (minor): a gated object in a route room the player has slipped into is now refused as a wrong attempt, not as "retry"

`step_room_unreached?` (`lock_step_reach.rb:53-63`) is true for a room in `npcRouteRooms` (it is
not in `unlockedRooms`), so `validate_unlock` fails (`game.rb:5085-5088`) and the controller
answers the 422 "Invalid attempt" (`games_controller.rb:1231`) before the route-room refusal
`403 room_not_reachable, retryable: true` (`:1282-1285`) that the client's object retry waits for.
Run with `npcRouteRooms: ["lab"]` and two safes in `lab`, each sent its right PIN:

```
gated gsafe -> [422, {"success"=>false, "message"=>"Invalid attempt"}]
plain psafe -> [403, {"success"=>false, "reason"=>"room_not_reachable", "retryable"=>true}]
```

An honest player who has just earned the pass and is one sync behind would see a wrong PIN. No
shipped or test scenario has a gated object in a split-gated room. Fix in
`app/models/break_escape/lock_step_reach.rb`: answer false from `step_room_unreached?` when
`in_npc_route_room?(home)`, so the existing refusal answers; add a route test.

### R2-SERVER8 (minor): at a gated door with no first lock, the request names any opener it likes

The controller hands the gate `params[:attempt]` as the opener for every `npc` post at a door
(`lock_step_requests.rb:79`), and the gate stores and answers it (`lock_step_gate.rb:42-50`). The
only proof is `validate_unlock`, which passes anything at a room that is not `locked`. A room with
`secondStep` and no lock (the validator refuses it: `validate_lock_step.rb:141`; the server runs it):

```
POST /unlock door lab attempt "zedzedzed" method npc
  -> [200, {"success"=>false, "secondStep"=>true, "kind"=>"push", "targetType"=>"door", "targetId"=>"lab", "npcId"=>"amy", "opener"=>"zedzedzed"}]
npcStepGrants -> {"door:lab"=>"zedzedzed"}
GET scenario, rooms.lab -> {..., "secondStep"=>{"kind"=>"push", "owner"=>"amy"}, "npcStepOpener"=>"zedzedzed"}
```

`zedzedzed` is no NPC. The string is kept in the player's state with no length limit and served
back in the bootstrap. It opens nothing (the step still has to pass, and the open posts the same
attempt). At a locked door every unproved opener was refused (see R2-SERVER6). Fix in
`app/models/break_escape/lock_step_gate.rb`: use the given opener only when it is the id of an NPC
in the scenario whose `unlockable` lists this room; otherwise name the owner and note no grant.
Add the case to `test/models/break_escape/lock_step_gate_test.rb`.

## Checked and found sound

- **Open echo only on gated locks.** `bin/ops-golden-compare`: 33 runs, 0 failures. Direct
  comparison: the same 15 `/unlock` requests and 5 `GET /container` requests against an ungated
  scenario (right and wrong PIN, `item`, name, generated id, case mismatch, `unlocked`, an NPC door,
  an open door, invented ids), run on this branch and on main (`/home/deploy/BreakEscape`,
  `2d9e963c8`): `cmp cmp_branch.txt cmp_main.txt` reports identical (20 lines, 3452 bytes). In a
  gated scenario a plain box and a plain door answer with no echo
  (`{"success":true,"type":"object","hasContents":true,...}`; door keys `success, type, roomData`).
- **A gated thing in an unopened room.** For `vaultsafe` (gated safe), `vaultcase` (gated takeable)
  and `vault_memo` (inside the safe), and `viccase` on every route but the take, each of these
  answered exactly as `nothing_here` did (status; body with the id blanked; `player_state`, which
  holds the ops log rows, unchanged): `/unlock` with the right PIN, a wrong PIN, `unlocked`, `npc`
  and `rfid`; `GET /container`; `/mfa/verify`, `/mfa/prompt`, `/mfa/approve`; `GET /mfa/phone`; the
  take, with and without a giver; a hand-built drop. By name and by generated id: 422 and 404
  likewise. State after all of it: `lockSteps {}`, `opsLog` absent, inventory empty. After the
  door opens, `vaultsafe` and `vaultcase` gate (one `mfa_challenge` row each) and `viccase` (still
  with its NPC) stays `[422, Invalid attempt]` and `[404, not found]`.
- **`PUT /sync_state`** with `unlockedRooms`, `unlockedObjects`, `lockSteps`, `npcStepGrants`,
  `inventory` and `room_states` in the body wrote none of them; the answer has `success` and
  `message` only.
- **The kept limit (takeable room object that has left the player).** `roomcase` taken, then
  removed from the inventory (inventory `[]`, `room_states {}`): `GET /container` 404; wrong PIN
  and `unlocked` 422; right PIN gives the gate; `/mfa/prompt` passes (owner `always`); the next
  right PIN opens and ships the contents; `GET /container` 200; its memo can be taken; the case
  can be taken again. So a hand-built request can go on using the lock where it was authored,
  and re-add the item, but skips neither check; in an unopened room it is refused as an invented
  id. A plain locked takeable in the same scenario behaves as on main.
- **Honest flag reward that opens a gated object** (the scanner reviewer's case). With the flag
  not claimed: `[422, Invalid attempt]`. With the flag in `flag_rewards_claimed`, `POST /unlock
  object hsafe method flag_reward` answers `[200, {"success":true,"type":"object",
  "targetType":"object","targetId":"hsafe","hasContents":true,"contents":[hsafe_memo]}]`: the open
  answer with the gated echo, no gate, `lockSteps {}`, no ops log row, `unlockedObjects ["hsafe"]`;
  `GET /container/hsafe` then 200. That is the plan's allowance and the echo is what lets the
  scanner place it. For a gated safe in an unopened room with its flag claimed the same post is
  `[422, Invalid attempt]`, as for `nothing_here`.
- **NPC give.** The give is the take route with a giver (`POST inventory`, `npc_id`); its rows are
  in the 55 pairs above and its one difference is R2-SERVER4.
- **Validator.** `ruby scripts/validate_scenario.rb scenarios/test_ops_lock_step/scenario.json.erb
  --no-graph --skip-ink`: 0 errors, 4 warnings, as in round 1. The other 207 shipped scenarios run
  with `--no-graph --skip-ink`: 0 lines naming "lock step" (`check_lock_step` returns at
  `validate_lock_step.rb:45` when nothing carries a step; only `test_ops_lock_step` does). No
  scenario file but `test_ops_lock_step/PLAYTEST.md` changed since round 1.
- **Not of this stage:** a plain locked box in an unopened room opens by a hand-built `/unlock`
  on main too (`vbox` in the comparison run). The stage neither made nor changed it.

## For the owner

1. R2-SERVER2: should a headless record lose `awareness` and `role` in the bootstrap, as a room
   NPC does? They shipped before this stage; `awareness` is what now tells the prompt habit.
2. R2-SERVER4, first case: "NPC not encountered: <id>" names the holder of any item in an
   unopened room, gated or not, on main too. Blank it for every item (changes an answer shipped
   scenarios can get from a hand-built request), or only below a gated thing?

Commit messages: 072a72a70 says the take refuses "as an invented id"; that holds for a room object
and not for an NPC's (R2-SERVER4). The others read true against the code.

Verdict: clean
