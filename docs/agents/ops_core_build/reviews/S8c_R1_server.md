# S8c review, round 1: server, model, validator and graph

Reviewed: branch `ops-lock2` at `b51b97d50`, every commit since `git merge-base main ops-lock2`.
Area: `app/models/break_escape/lock_*.rb`, `lock_step_requests.rb` and the lock lines of
`games_controller.rb`, `game.rb` seams, `mfa_sign_in.rb` (one line; `mfa_access.rb` is not edited),
`lib/break_escape/lock_step_model.rb`, `ops_log_events.rb`, the validator, graph and schema, and
their Ruby tests.

How the behaviour evidence was made: two throwaway integration tests driving the real routes
(`/unlock`, `/mfa/*`, `/container`, `/inventory`, `/room`, `/scenario`, `/sync_state`) with
`test/support/lock_step_routes.rb`, kept outside the tree in the session scratch folder
(`s8c-r1/srv_probe_test.rb`, `s8c-r1/srv_probe2_test.rb`). Each answer quoted below is the
`[status, body]` those runs printed. Nothing in the tree was changed.

Counts: 0 blockers, 2 majors, 7 minors.

## Findings

### R1-SERVER1 (major): a name shared with another object opens a gated container through `GET /container`, with no first factor and no step

Rule B says a gated object is open by its id, never a name (`lock_second_step.rb:5-8`). `GET
/container` does not keep to it. `lock_step_container_refused?` (`lock_step_requests.rb:147-155`)
judges the object that `resolve_unlock_target` finds (the first match by id, name or generated id,
any object), but the container that is then served comes from `find_container_in_scenario`
(`games_controller.rb:3210-3255`), which takes the first match by id or name that has `contents`,
and `check_container_unlocked` (`:3435-3442`) accepts the request's own string when it is in
`unlockedObjects`. `unlock_object!` writes that string as sent for any object that is not gated
(`lock_step_requests.rb:125`).

Run, in a scenario with `{ id: decoy, name: "Safe" }` (a plain note, not locked) listed before
`{ id: realsafe, name: "Safe", locked, pin, secondStep, contents: [safe_memo] }`:

```
POST /unlock  targetId "Safe", method "unlocked"  -> [200, {"success"=>true, "type"=>"object"}]
unlockedObjects                                   -> ["Safe"]
GET /container/Safe -> [200, {"container_id"=>"Safe", "contents"=>[{"id"=>"safe_memo", ..., "text"=>"WORDS-safe_memo"}]}]
lockSteps                                         -> {}
```

The PIN was never sent and no step was asked. The validator refuses such a scenario
(`validate_lock_step.rb:243-256`), so a validated scenario is not exposed; but the standard is that
the server decides, and the plan asks for exactly this test ("Twin names (fixture that skips the
validator) ... opening the plain lock ships nothing of the other, by any exit",
`OPS_LOCK_SECOND_STEP_PLAN.md:1064`). No test in the stage covers it at route level
(`lock_second_step_test.rb:186` only checks which twin resolves). The comment at `game.rb:5263`
("an id resolves by id only") is also untrue: `walk_for_target` matches a name and a generated id.

Fix, in `app/controllers/break_escape/lock_step_requests.rb` and the three serving points of
`GamesController#container`: judge the object that is about to be served, not the one the id
resolved to. Add `lock_step_served_refused?(object)`: true when the object carries a step and
`@game.step_object_open?(object)` is false (an id-less gated object included), or when
`resolve_unlock_target(object['id'])` gives a path that `behind_closed_step?`. Call it on
`located[:object]` in both scope branches (`games_controller.rb:652`, `:658`) and on
`container_data` after `find_container_in_scenario`, each answering the same 404 "Container not
found". Add the plan's twin test to `test/controllers/break_escape/lock_step_objects_test.rb`: a
plain object whose name equals the gated object's name, and one whose name equals its id; after
opening the plain one, `/unlock`, `GET /container` and a take for the shared string ship nothing
of the gated object. Correct the comment at `game.rb:5263`.

### R1-SERVER2 (major): two test files define the same class with different parents, so they cannot be loaded in one run

`test/models/break_escape/lock_step_doors_test.rb:5` is `class LockStepDoorsTest <
ActiveSupport::TestCase` and `test/controllers/break_escape/lock_step_doors_test.rb:8` is `class
LockStepDoorsTest < ActionDispatch::IntegrationTest`, both in `module BreakEscape`.

```
$ flock ... bin/rails test test/models/break_escape/lock_step_doors_test.rb ... test/controllers/break_escape/lock_step_doors_test.rb ...
test/controllers/break_escape/lock_step_doors_test.rb:8:in `<module:BreakEscape>': superclass mismatch for class LockStepDoorsTest (TypeError)
```

No test runs at all in a process that loads both, which includes the full `bin/rails test`. Run
apart, both pass (6 runs; and 237 runs for the rest of the stage's server tests).

Fix: rename the model one to `LockStepDoorsModelTest` in
`test/models/break_escape/lock_step_doors_test.rb:5`, then run the two files together.

### R1-SERVER3 (minor): a takeable room object that has left the player is still in reach, and the docs say it is not

`carried_step_reachable?` leg 2 answers true for any `room` or `nested` home
(`lock_step_reach.rb:48-49`) without asking whether the item is still there. The plan's rule is "in
place while its id is not in its room's `objects_removed`" (`OPS_LOCK_SECOND_STEP_PLAN.md:707`),
but a take writes no such record (`room_states` was `nil` after the take below).

```
take roomcase -> [200, success]; inventory remove roomcase -> 200; inventory -> ["startcase"]
POST /unlock roomcase 1111 pin -> [200, gate]
POST /mfa/prompt object:roomcase -> [200, stepPassed]
POST /unlock roomcase 1111 pin -> [200, contents: [roomcase_memo ... "WORDS-roomcase_memo"]]
GET /container/roomcase -> [200, contents ...]
```

Both checks are still needed, so nothing is skipped; the fault is the claim.
`docs/ACCESS_AND_NETWORKS.md` (A25, "Carried locks") says a carried gated container that is "held
neither in the inventory nor as a dropped copy in an unlocked room" is refused as an invented id.
That is true only for an NPC's item, a start item and a grant item.

Fix: in `docs/ACCESS_AND_NETWORKS.md` say that a takeable room object (top level or nested) stays
in reach by a hand-built request after it has left the player, because the server keeps no record
of a take; correct the comment at `lock_step_reach.rb:33-34` ("still in its authored place") to
match; add a test of this case to `test/controllers/break_escape/lock_step_carried_test.rb` so the
limit is pinned. (Whether to record a take is for the owner, below.)

### R1-SERVER4 (minor): "add routes can put a gone item back" is true for two of the four routes only

`docs/ACCESS_AND_NETWORKS.md` (A25, "Best effort"): "The routes that add an item to the inventory
again can put a gone item back; the step itself is never skipped." The second half holds on every
route tried. The first half does not: `lock_step_take_refused?` (`lock_step_requests.rb:159-164`)
judges the item's own chain, the item included, so a gone start item or NPC-given item is refused
(the plan judged "the chain minus the item itself", `:736-741`).

```
remove startcase; add startcase                    -> [422, "Item not found in scenario: briefcase"]
give bobcase (source_npc_id bob) -> 200; remove; give again -> [422, "Item not found in scenario: briefcase"]
claim grantcase -> 200; remove; POST /unlock -> [422, Invalid attempt]; add again -> [200]; POST /unlock -> [200, gate]
room takeable: see R1-SERVER3 (still in reach, can be taken again)
```

The code is the stricter and safer of the two, and no click path removes and re-adds a start item
or a given item. Fix the sentence in `docs/ACCESS_AND_NETWORKS.md`: a grant item and a takeable
room object can be added again after they have gone, and then ask both checks again (or open, if
the step had passed); a start item and an item an NPC gave cannot. Add one test per route to
`lock_step_carried_test.rb` (the plan's "Re-add after removal" row has none).

### R1-SERVER5 (minor): the lock form of `/mfa/prompt` and `/mfa/approve` tells a real gated id from an invented one, in a room the player has not reached

`lock_step_action_target` (`lock_step_gate.rb:181-196`) tests Rule C and Rule D but not whether the
object's room has been reached, and a target with no record answers 422 `expired` with the echo,
where an invented id answers 404.

```
POST /mfa/prompt  object:vaultsafe (push lock, in a locked room never entered) -> [422, {"success"=>false, "expired"=>true, "targetType"=>"object", "targetId"=>"vaultsafe"}]
POST /mfa/prompt  object:nothing_here                                           -> [404, {"success"=>false, "error"=>"not found"}]
POST /mfa/verify  object:vaultsafe                                              -> [404, not found]   (so the kind shows too)
```

The plan allows it ("the target resolves by id, carries `secondStep` and is not open ... else
404", `:833`), and no step can start without a right first factor at `/unlock`. It still does not
meet "a refusal for a hidden thing is identical to one for a thing that does not exist". Fix, if
the owner wants it closed: in `lock_step_gate.rb`, answer `:not_found` from `prompt_lock!`,
`approve_lock!` and `verify_lock_code!` when the map holds no record for the key (a record exists
only after the gate, which `/unlock` has already judged for reach), and update the `*_expired`
fixture entries and the client's reading with it.

### R1-SERVER6 (minor): two validator lines of the plan are missing

Run of `check_lock_step` on a scenario with one gated safe, an id-less takeable locked room bag
with contents, and a gated takeable item with `healAmount: 20`: no line at all.

- `lock_step_carried_warnings` (`validate_lock_step.rb:361-371`) covers `start`, `npc` and `grant`
  homes only. The plan's G4 warning also names "a `takeable` room object" (`:930-932`). Fix: add
  top-level `takeable` room objects (home `:room`, no ancestors) to that walk.
- `lock_step_consumable?` (`:229-234`) reads `consumable: true` and the type patterns; the plan
  also counts "a positive `healAmount`" (`:914`). Fix: add `node['healAmount'].to_f.positive?`.
  Add one case each to `test/js/validator-lock-step.test.mjs`.

### R1-SERVER7 (minor): a log row for a carried gated object is placed in the room it was authored in, wherever it is opened

`OpsLogEvents.object_entry` (`ops_log_events.rb:178-182`) asks `gated_object_entry` and
`npc_held_entry` before the player's own state, so a gated case always resolves to its authored
room, or to no room for a start, grant, profile or share item.

```
bobcase (given, held, player elsewhere) -> {:room_id=>"hall"}     startcase -> {:room_id=>nil}
```

A log source filtered by room (`ops_log.rb:746-748`) therefore lists the briefcase rows under the
NPC's room, and lists a start or grant item's rows under no room. Every row still resolves, so
nothing raises. Fix in `lib/break_escape/ops_log_events.rb`: for an id the player holds or has
dropped, let `player_object_entry` answer first (the dropped copy's room, else no room), and say in
the comment which room a held item's row belongs to; extend
`test/unit/ops_log_object_kind_test.rb` with a gated case that was given and then dropped in
another room.

### R1-SERVER8 (minor): the gate itself names the owner as the door's opener and writes that grant; the controller then overwrites both

`lock_step_gate` notes the grant for the OWNER (`lock_step_gate.rb:44`) and puts the owner in
`opener` (`:277`); `lock_step_name_opener!` (`lock_step_requests.rb:93-101`) then replaces both
with the request's `attempt`. The route answer is right, but the fact has two writers, the first
one wrong, a model caller gets the wrong opener, and a repeat gate on a live record saves the grant
again although the tests say a repeat "writes nothing more". Fix: give `lock_step_gate` an
`opener:` keyword, use it for the grant and the body in `lock_step_gate.rb`, pass
`params[:attempt]` from `lock_step_gate_rendered?`, note the grant only when the step is issued,
and delete `lock_step_name_opener!`.

### R1-SERVER9 (minor): the docs list two ways round the step; the code has three

`docs/ACCESS_AND_NETWORKS.md` (A25, "Ways round the step" and "Known limits") names the propped
door and the `unlock_door` flag reward. A flag reward the server accepts for a gated OBJECT also
opens it with no step (`lock_step_gate.rb:31-32`, `lock_step_requests.rb:112-118`, proved by
`lock_step_objects_test.rb:305`). Fix: add it to both paragraphs. The validator says nothing when
a gated room has a `prop_door` workaround or an `unlock_door` reward, or a gated object a flag
reward: see "for the owner".

## Checked and found sound

- Every route that returns contents, `roomData` or an item, against a closed gated lock:
  `POST /unlock` (gate before the transaction; wrong factor, `unlocked`, `npc` and unaccepted
  `flag_reward` all 422 after a pass too), `GET /container` (404 until open, apart from
  R1-SERVER1), `GET /room/<gated room>` (403 before the gate, during it and after the pass, 200
  only after the open), `GET /scenario` (no contents word of a start, grant, room or gated-room
  item, no state key; the room carries `secondStep` kind and owner only), `GET /room/<start>` (no
  contents of gated or plain locked objects), `POST /inventory` add (a child of a closed gated
  container, with an id, without one, takeable or not, answers "Item not found in scenario:
  <type>", the same as an invented item; a child of a case an NPC still holds likewise),
  `PUT /sync_state` (a body naming `unlockedRooms`, `unlockedObjects` and `lockSteps` wrote none of
  them). The only writers of `unlockedRooms` outside the gate are `prop_door`, the `unlock_door`
  reward, route-room promotion and the awareness world room; the validator refuses a step on the
  last two.
- `item` is read as `object` at the gate and on all four `/mfa` actions; any other type word fails
  closed (the gate answers nil and `lock_step_may_open?` refuses).
- Replays: a second gate on a live record is the same answer; a prompt or a deny after a pass is
  422 `expired` and the pass stands; a pass for lock A leaves lock B asking its own gate; the open
  deletes the record; the first factor is judged again on the open, so a revoked factor cannot
  finish a step it began.
- Counts: a lock answer carries no `attemptsLeft`; wrong first factor is today's refusal.
- The ops log lookup fix (`482b92bd2`): `object_entry` can now resolve an id in an NPC's hands or
  anywhere a step sits, but every caller hands it an id the server derived (`ops_badge_where` from
  the lock `/unlock` resolved, `lock_step_where` from `lock_step_for`); no route passes it a
  client-chosen id, and an unknown id is still nil. No row is written for a Rule C or D refusal or
  for a 404.
- G4 as decided: in a scenario with no gated object `lock_step_resolve_id` answers nil
  (`lock_step_requests.rb:39-43`), so nothing of Rule C or D runs and a hand-built request does
  all it did before the stage. In a gated scenario Rule D runs for every carrier with an id,
  gated or plain: an NPC's item, a start item and a grant item are refused on `/unlock`,
  `/container`, the take and `/mfa/*` once they are neither held nor dropped in an open room; a
  takeable room object is not (R1-SERVER3); an id-less carrier is not covered.
- Unchanged behaviour: `bin/ops-golden-compare` 33 runs, 0 failures; `ops-unchanged-validator`
  17 pass; `validator-lock-step` 57 pass; `dungeon-graph-lock-step` 7 pass; the validator on
  `test_ops_lock_step` (`--no-graph --skip-ink`) 0 errors, 4 warnings.
- Tests: the stage's Ruby tests use object-scoped `stub` only; none reopens an application class.
- Schema: `secondStep` on rooms and items, closed key set, kinds as the model's.

## For the owner

1. Record a take, or accept R1-SERVER3 as a stated limit? Closing it needs the server to note a
   takeable room object's removal, which today's engine does not do for any item.
2. R1-SERVER5: keep the plan's rule (a gated id anywhere answers 422 `expired`), or make "no
   record" a 404 so a real id and an invented one read the same?
3. Should the validator warn when a gated room has a `prop_door` workaround or an `unlock_door`
   reward, or a gated object is the target of a flag reward? The plan accepts the routes but an
   author gets no line saying the step can be walked round.
