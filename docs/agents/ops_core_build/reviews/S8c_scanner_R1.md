# S8c leak scanner review, round 1 (early)

Reviewed: commit `e57816c5d` on `ops-lock2` (`tools/playtest/lib/lock_step_leak_rules.rb`, the four
hooks in `tools/playtest/lib/access_leak_scanner.rb`, and
`test/controllers/break_escape/access_leak_scanner_lock_step_test.rb`). Review only; nothing fixed.
The server routes do not exist yet, so every capture below is hand-made from
`test/fixtures/files/lock_step/answers.json`. A second review is due when real answers exist.

Result: **1 blocker, 5 major, 9 minor.** The proof chain itself (gate, then pass, then open) holds
up: an open with no pass, a pass with no gate, a late pass, a late or closed phone answer, contents
on the container route and state carried between scans are all caught. The gaps are around it:
gated things that arrive under any key other than `contents` or `roomData`, two rules that will
flag the brief's own playtest, and one proof that is missing.

Short names below: "rules" is `tools/playtest/lib/lock_step_leak_rules.rb`; "scanner" is
`tools/playtest/lib/access_leak_scanner.rb`.

## How it was checked

- 51 scratch captures, run through the real scanner with
  `flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <file>`. The files are outside the
  repo, in `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s8c-scanner-review/`
  (`scratch_lock_step_test.rb`, `scratch_extra_test.rb`). Case names (A01, H03, M06 and so on) below
  are the labels in those files. The scratch scenario is the builder's test scenario plus a second
  push lock of the same owner, a gated object with no id, a gated object whose items have no id, a
  box inside a gated locker, a carried gated case, an NPC-opened door whose opener is not the step
  owner, and an ungated door.
- The mixed cases (M00 to M07, X01) use `scenarios/test_ops_mfa` with those lock objects added to
  one room.
- Hooks: the tree at the parent of `e57816c5d` and the tree at `e57816c5d` were exported to scratch
  (so no builder's unfinished work was in them) and the task's test command was run in each.

## What is caught (no finding)

| Case | Capture | Reported |
|---|---|---|
| A02 | `GET container/inner_box` (a box inside the gated locker) with `deep_note`, two levels down | `lock_step_content` |
| A05, A11 | A room answer or the bootstrap lists the gated locker with a `contents` key | `lock_step_content` |
| A08 | The open of another door whose `roomData.objects` holds an object of the gated room | `lock_step_content` |
| A13 | Gate and pass in scan 1, open in scan 2 on the same scanner object | `lock_step_content` (no state carried) |
| A19, A20 | A phone answer after a pass closed the gate; a phone answer 301 s after the gate | `lock_step_answer`, `lock_step_secret` |
| A26 | A gate naming the wrong owner for the lock | `lock_step_answer` |
| A27 | Gate, pass, then contents by `GET container/<id>` before the open | `lock_step_content` |
| A28 | A passed locker's contents nested inside the open answer of another door | `lock_step_content` |
| A29 | The open on the loose path `unlock.json` | `lock_step_content` |
| A30 | `GET container/<gated id>` with id-less contents | `lock_step_content` (by the route's id) |
| X02 | A lock refusal with `attemptsLeft` | `lock_step_answer` |
| X03 | A phone answer with no phone taken | `lock_step_answer` |

Honest sequences that stay clean: a wrong number then a retry with a new number (H05); the pane
closed and reopened on the same lock, the lock opened, read again and opened again (H06); a carried
gated case dropped in another room and listed there with no `contents` key (H07); a wrong first
factor between the pass and the open (H10); an expiry then a new gate (H12); two gates open with
only waiting answers (H13); an owner approving by habit with no phone taken (the builder's own
`owner_push`).

## Findings

### R1-L1 (blocker) Gated things are seen only under the keys `contents` and `roomData`

`rules:324-341` (`ls_content_owners`), `rules:359-375` (`ls_judge_contents`).

The rule looks for a hash that has a `contents` array or a `roomData` object. A gated item or a
gated room's object that reaches the browser under any other key is not looked at. All of these
report nothing, with no gate, no pass and no open in the capture:

- A03: `POST /inventory` 200 `{ "success": true, "item": { "id": "locker_memo", "text": "..." } }`
  (`locker_memo` is inside gated `moira_locker`).
- A04: `GET room/hall` 200 `{ "room_id": "hall", "room": { "objects": [ { "id": "locker_memo", "text": "..." } ] } }`.
- A06: `GET room/hall` 200 with `room.objects` holding `rec_file`, an object of gated `records_room`
  (the neighbour's answer).
- A07: `GET room/store` 200 `{ "room_id": "records_room", "room": { ... "objects": [ { "id": "rec_file" } ] } }`
  (the route check at `rules:372-374` reads only the path).
- A10: `GET scenario` 200 `{ "rooms": { "records_room": { "locked": true, "objects": [ { "id": "rec_file", "text": "..." } ] } } }`
  (the bootstrap carries the gated room's objects).

The real room route answers `{ room_id, room }` (`games_controller.rb:610`) and the bootstrap nests
rooms under `rooms.<id>.objects`, so the key `roomData` appears only in the door-open answer. A
server filter that forgot a gated room would therefore pass the scan. No older rule reported these
either.

Smallest fix, still structural (ids are authored, not content strings): until a lock is in
`@ls_opened`, report `lock_step_content` for (a) any hash anywhere whose `id` is in that lock's
`contents_ids` or `room_ids`, other than inside the open answer placed to that lock; (b) any hash
with an `objects` key that sits under `rooms.<gated room id>` or beside `room_id: <gated room id>`;
keep the existing `contents`, `roomData` and route checks. Add each capture above to the rule test.

### R1-L2 (major) An NPC-opened door is accepted only when the opener is the step's owner

`rules:175`: `keys -= ['opener'] if lock[:type] == 'door' && body['opener'] == lock[:owner]`.

The brief's own scenario has `plant_room` opened by gordon's ink with the step owned by moira
(brief, unit 23 table), and `npcStepGrants` stores the NPC who gave the first factor. The honest gate
is `{ ..., "targetType": "door", "targetId": "plant_room", "npcId": "moira", "opener": "gordon" }`.
H01: that gate is reported `lock_step_answer`, then its pass (`no-gate`), then its open
(`lock_step_content`). Beats 12a to 12e of the playtest outline will all be findings. The fixture
hides it because `gate_door_npc` uses moira for both.

Smallest fix: accept `opener` only on a door gate and only when it names a room NPC whose authored
`unlockable` list holds that room (as `game.rb:5467-5468` checks); owner equality proves nothing.
Change the fixture to two different NPCs so the test would have caught it.

### R1-L3 (major) A code pass needs no code device

`rules:223-227`: for the route `verify` the proof is `else true`.

A14: `gate_code` for `moira_cabinet`, `verify_passed`, then the open, with no `POST /inventory` row
for any code device and no `GET /mfa/device` answer: nothing reported. The brief says the server
checks `held_code_device` and answers 403 without it (unit 13), so this is a pass the server could
not have produced. The phone route already asks for the phone (`rules:225`).

Smallest fix: for `verify`, require a code device whose authored `owner` is `gate[:npc]` to be in
`@mfa_taken` (the same test `mfa_device_answer_ok?` makes at `scanner:3672-3673`).

### R1-L4 (major) Two open gates make an honest pass a finding, and one abandoned number lock is enough

`rules:198-209`, `rules:212-229`, `LS_ROUTE_KINDS` at `rules:58`.

The builder listed this limit. Two details make it wider than it reads:

- H03: the locker's pane is closed with X (which sends nothing, so the gate stays open for 300 s),
  then the records door is worked: the door's pass is `pass:ambiguous` and its open is reported.
- H04: `POST mfa/approve` closes both push kinds, so a number lock left waiting (the `dana_cabinet`
  shape, which can never pass) makes every phone approval of any other lock a finding for 300 s.

How likely: in the brief's section 7 outline, not at all if every beat finishes. Each beat that
leaves a gate open (4, 5, 9, 12b, 12d, 13b, 13c) returns to the same lock, beat 6 ends in a cancel
that closes the gate, and `dana_cabinet` is not played. In any blind or free playtest it is likely:
closing a pane and trying another lock inside five minutes is ordinary play.

Is there a structural way to place a pass without the request body? Two, and both need work outside
this file:

1. The server echoes the lock. Every lock answer of `POST /mfa/verify`, `/mfa/prompt` and
   `/mfa/approve` (the pass and each refusal) carries `targetType` and `targetId`, as the plan's
   section on these routes had it before brief 4.3 dropped them. The scanner then places a pass to
   the gate with that key, and a cancel or expiry closes that gate alone. This also solves R1-L5.
2. The recorder writes the request's own words on the row, as it does `inv` for inventory:
   `"lock": { "targetType": ..., "targetId": ... }` on `POST /unlock` and `POST /mfa/*`. This also
   places an open to its lock, which the server echo does not (the open answer is "today's answer,
   unchanged" and names nothing).

Until one exists the rule must stay as it is (a finding); do not pick the newest gate.

### R1-L5 (major) In a scenario with PC steps too, honest lock answers are reported and the two sets of rules close each other's steps

The builder listed the first half. Measured on `test_ops_mfa` plus lock objects:

- M01, M03, M04: every lock pass is `mfa_session` `mfa:session:unknown` (`scanner:3834` sends every
  `success: true` answer of the three routes to `mfa_judge_pass`, and `scanner:4046` wants `npcId`
  and `via`).
- M02: the lock's phone answer is `mfa_secret` `mfa:key:numbers` (`scanner:3762`; the PC phone check
  at `scanner:3690` wants a query of `npc_id` alone).
- By reading `scanner:3939-3940`: a lock pass while a `--signin` name waits for its desktop raises
  "named, unconfirmed" (exit 2).
- M06: a lock's `expired` closes the PC's open push step (`scanner:4116-4121`), so the PC's honest
  pass is `mfa_session`.
- M07: a PC's `cancelled` closes the lock's gate (`rules:425-427`), so the lock's honest pass and
  open are reported.
- X01 (a loosening, not a false alarm): while any PC step is open, `rules:290-292` accepts any
  refusal on a lock route whose keys are in the PC list, with any values and any status, including
  `attemptsLeft`, which brief 4.3 says a lock never sends. A PC step never times out in the scanner
  (S8a R5 limit 6), so this lasts for the rest of the capture.

The fix is unit 28's; see "Instructions for unit 28".

### R1-L6 (major) An existing scanner test fails as soon as the feature scenario exists

Not in `e57816c5d`, but in this stage's gate. `test/controllers/break_escape/access_leak_scanner_mfa_fix_test.rb:391`
("R1-L7 every shipped scenario scans clean of second-step findings over its own room answers")
feeds each scenario's authored rooms to the scanner and expects no `mfa_` finding unless a policy
asks for a step (`has_step`, line 407). `scenarios/test_ops_lock_step/scenario.json.erb:427-428`
authors `approvesPrompts` and `promptPatience` for moira and has no such policy, so the test fails
with `mfa:key:approvesPrompts` and `mfa:key:promptPatience`. Seen in the live tree at `3f490bda7`
(421 runs, 1 failure, 0 errors).

Smallest fix: in that test only, count a scenario as `has_step` when
`BreakEscape::LockStepModel.each_lock_step(data)` is not empty. Do not touch `MFA_NEVER_KEYS`: the
keys are still a leak in a served answer.

### R1-L7 (minor) Items with no id are invisible, and an empty gated room flags honest doors

`rules:327-328`, `rules:333-337`, `rules:89`.

- A01: an open with no gate carrying the contents of a gated object whose items have no `id`:
  nothing reported. A32: the same contents inside the honest open of another lock: nothing. A09: a
  door open whose `roomData` is the gated room's id-less object: nothing.
- H02 (honest, flagged): with a gated room that authors no objects, the open of any ungated door
  whose `roomData.objects` has no ids is `lock_step_content` (`rules:337`, first arm).
- The builder listed "a gated object with no id" (its opens are always findings); the id-less
  contents are the part that fails open.

Smallest fix: refuse at `ls_bind` (raise `ArgumentError`, so the check exits 2 with a line naming
the lock) when a gated object has no id or a gated lock's `contents` or `objects` holds an entry
with no id. Ask unit 06's validator for the matching error. Keep the first arm of `rules:337`; it
is the safe direction.

### R1-L8 (minor) A repeat gate restarts the 300 seconds and may change the number

`rules:193`, `rules:414`. A15: gate, the same gate again at +250 s, pass at +400 s: nothing
reported. The server answers a live record again "with no write" (unit 13), so its clock does not
restart. A16: a second `gate_number` with another number and no cancel between: accepted, and the
phone answer is then judged against the new number.

Smallest fix: when a fresh gate for the key is already open, keep its `at`, and report
`lock_step_answer` if `kind`, `npcId` or `number` differ.

### R1-L9 (minor) Nothing ends the proof: another game, a reset, a lost body

- A12: a gate on `/games/2/unlock`, the pass and open on `/games/1/`: nothing reported (S8a R5
  carried limit 13, now also true of locks).
- A21, A22: `POST /games/1/reset` 200 between the pass and the open, or after the open: the earlier
  proof still stands.
- A23: a row with no body on `POST mfa/prompt` (it could be the expiry) leaves the gate open
  (`scanner:527` skips the row before `scan_lock_steps`; `rules:134` returns on unparsed text).

Smallest fix, all in the closing direction: store the game id of the path with each gate and place
a pass and an open only within one id; on a 200 `POST .../reset` clear `@ls_gates`, `@ls_passed`
and `@ls_opened`; on a bodyless or unparsed row of `POST unlock` or `POST mfa/*` clear `@ls_gates`
and `@ls_passed`.

### R1-L10 (minor) The rules are not inert in a scenario with no lock step

`rules:144-146`, `rules:151`, `rules:123-128`. Only the contents, secrets and refusal rules test
`@ls_active`. I02: with no `secondStep` in the scenario, an answer holding `secondStep: true`,
`opener`, `stepPassed`, or a `requests` entry with `targetId` is reported `lock_step_answer`. No
shipped answer uses those keys today and every existing test passes (see "Hooks"), so nothing
changes in practice. It is fail-closed and can stay, but the header should say so, and
`ls_judge_phone` (`rules:236`) is the most likely to collide with a later feature's `requests` list.

### R1-L11 (minor) `numbers` beside a `pcId` key is skipped by both sets of rules

`rules:385`. A17: `{ "pcId": "x", "numbers": [31, 47, 82] }` on a room answer in a lock-only
scenario: nothing reported. The lock rule leaves it to the PC rule, and the PC rule
(`scanner:3762`) runs only when a policy asks for a number match.

Smallest fix: skip on `pcId` only when `@mfa_numbers_possible` is true.

### R1-L12 (minor) An honest open that lists an inner container with its own contents is reported

`rules:366`. A24: the placed open of `moira_locker` with
`contents: [ { "id": "locker_memo" }, { "id": "inner_box", "contents": [ { "id": "deep_note" } ] } ]`
is reported at `$.contents[1].contents`; only the root hash is excused. This is the builder's
"nested more than one level" limit.

Smallest fix: excuse `open_key` for every hash inside the placed open's own root `contents` (or
`roomData`), never outside it.

### R1-L13 (minor) Values the rules do not judge

- A25: the placed open may carry any other key; the lock rules judge only that it is
  `success: true` with the lock's ids (`rules:345-357`). Other rules still read it.
- X03: `waiting`, the phone entry's `name`, `message` and `error` are any string (`rules:265`,
  `rules:297`, `rules:306`, `rules:317`).

Smallest fix: compare `name` with the lock's authored `name` (a structural equality, known from the
scenario); hold `waiting` to the server's list once unit 13 fixes it; require the fixture's open
keys (`success`, `type`, `hasContents`, `contents` or `roomData`) once real answers exist.

### R1-L14 (minor, by reading, not run) Two gaps at bind

`rules:90`: a second gated object with the same id is dropped with its `contents_ids`, so its
contents are not watched. `rules:101-105`: `ls_ids` follows `contents` only, while
`LockStepModel.each_lock_step` also walks `itemsHeld` inside an object.

Smallest fix: merge the ids into the existing entry; follow `itemsHeld` too.

### R1-L15 (minor) A lock id used as some other `targetId` is reported

`rules:127`. H11: a sync answer's capture entry `{ "targetId": "moira_locker", "kind": "credential" }`
(the shape of `games_controller.rb:1033`) is `lockstep:unplaced`. Capture targets and mail drafts
already use `targetId`. Fail-closed, and no collision exists in the brief's scenario; leave the
rule, and have the validator warn when a gated lock's id equals a capture or mail target id.

## Hooks (step 4)

- Parent of `e57816c5d`, exported clean: 384 runs, 4238 assertions, 0 failures, 0 errors.
- `e57816c5d` (the three files laid over that export): 421 runs, 4474 assertions, 0 failures,
  0 errors. The 384 existing tests pass unmodified; 37 are new.
- Live worktree, first two runs (builders mid-edit): 118 and 122 errors, all
  `ActiveRecord::AssociationTypeMismatch: BreakEscape::Mission`, only when the unit and controller
  files run together, with or without the new test file. Gone at `3f490bda7`; it came from other
  units' unfinished files, not from the hooks.
- Live worktree at `3f490bda7`: 421 runs, 1 failure (R1-L6), 0 errors.
- With no `secondStep` in the scenario (I01): ordinary answers on every route the rules read
  (`unlock` success with contents, `container`, `room`, `mfa/phone`, a PC refusal with
  `attemptsLeft`, loose `numbers`, `number`, `code`, `targetId`) raise no `lock_step_` finding. The
  one exception is R1-L10.

## Instructions for unit 28

1. Tell a lock answer from a PC answer by what the lock rules placed, never by a key alone. Make
   `scan_lock_steps` return the hashes it placed (its `judged` list: a gate root, a pass root, the
   phone answer and its one entry) and hand them to `scan_mfa`. Then:
   - `scanner:3834`: do not call `mfa_judge_pass` for a root in that list.
   - `scanner:3939`: a root in that list does not unconfirm a waiting `--signin` name.
   - `scanner:3762`: a `numbers` key in a placed phone entry is not `mfa:key:numbers`. The entry is
     already told structurally: its query has `target_type` and it carries `targetType` and
     `targetId`.
   - `scanner:4106-4114`: a root in that list earns no PC session.
   A lock-shaped pass the lock rules did not place stays a finding under both rules.
2. Refusals cannot be told apart from the answer: `{ success: false, cancelled: true }` is the same
   for both. Ask units 13 and 14 for `targetType` and `targetId` on every lock answer of the three
   POST routes (R1-L4, option 1). With them: `scanner:4116-4121` closes PC steps only for an answer
   with no `targetType`; `rules:425-427` closes only the named gate for an answer that names one and
   closes nothing for an answer the PC rules own (no `targetType`, a PC step open). Without them,
   leave both closings as they are and record M06 and M07 as limits.
3. Replace `ls_pc_refusal_context?` (`rules:290-292`). With the echo, an answer naming a lock must
   match `LS_REFUSAL_SHAPES` exactly whatever PC step is open. Without it, at least keep
   `ls_refusal_values_ok?` and the status check in force, and never allow `attemptsLeft` or
   `lockedOut` unless the PC rules' own lockout allowance accepts that row.
4. Fix R1-L6 in `access_leak_scanner_mfa_fix_test.rb:407` (one line).
5. Apply R1-L1, R1-L2 and R1-L3 before scanning real answers, then R1-L7 to R1-L14 (each only adds
   or tightens). For R1-L4 use whichever of the two options the orchestrator chooses.
6. In the real test, capture and scan these before the open, with a gate and a pass already
   earned, and doctor each: the bootstrap, `GET room/<room of the lock>`,
   `GET room/<neighbour of a gated room>`, `GET container/<lock>`, the inventory answer for a
   carried gated item, and a sync answer. Add a run with two locks worked in turn and one with a PC
   step and a lock step open together.
7. Change the fixture's `gate_door_npc` so `opener` and `npcId` differ, with unit 02's agreement.

## Assumptions the server units must meet (13, 14, 15)

Each is something the rules rely on that the brief does not already state. Meet it or tell the
scanner unit.

1. Before its open, a gated object is sent with no `contents` key at all, in every answer (room,
   bootstrap, inventory copy, container). An empty `contents: []` beside the lock's `id` is a
   finding (H08).
2. Every object of a gated room and every item inside a gated object keeps its authored `id` in the
   open answer, and `roomData.objects` is an array. The open is placed by those ids.
3. The open is always a 200 on exactly `POST /games/<id>/unlock`, including an NPC-opened door. A
   gated room opened by any other route that returns `roomData` (as
   `games_controller.rb:1797` does for a workaround) is a finding.
4. `npcId` in a gate is the owner as `LockStepModel.lock_step` resolves it (the authored
   `secondStep.owner`, else the object's single `owner`); `targetType` is `object` for a carried
   item; `number` is an Integer from 10 to 99; `opener` appears on door gates only.
5. No gate is ever answered for a lock that has passed or opened (`rules:187`), and a lock cannot
   become locked again.
6. A pass has exactly `success`, `stepPassed` (plus `approvedBy` on prompt and approve) and nothing
   else. If the echo of R1-L4 is adopted this changes for the scanner and the fixture together.
7. `POST /mfa/prompt` passes only a plain `push` lock, only for an owner who is a room NPC (a
   headless owner is not in the scanner's list), whose habit is not `never`, and never once the run
   has taken that owner's phone, even if the phone was later dropped. `POST /mfa/approve` passes
   only while a phone of the owner is held.
8. The 300 seconds are measured by the scanner on the recorder's row time `t`; an answer the server
   gives at 299 s by its own clock can be 301 s on the row.
9. `GET /mfa/phone` for a lock has exactly the three query fields (no cache-buster), one entry
   while the gate is live and `{ "requests": [] }` otherwise, entry keys exactly `targetType`,
   `targetId`, `name`, `n` (plus `numbers`), `n` an Integer 0 to 20, and `numbers` three different
   Integers in ascending order. The ascending order is the fixture's, not the brief's.
10. `GET /mfa/device` for a lock is asked with `item_id` alone and answers S8a's six keys.
11. Refusals have exactly the fixture's key sets and statuses (422, except `prompt_waiting` at 200
    and the 403 and 404 `error` shapes); `retryIn`, `retryAfterS` and `promptsSent` are Integers; a
    refusal never carries `stepPassed`, even as `false`.
12. After `cancelled`, `expired` or `codeLocked` no pass comes for that lock without a new gate
    answer first (the scanner closes every gate of the route's kinds).
13. No other answer uses the keys `opener`, `stepPassed`, a non-object `secondStep`, or a `requests`
    list whose entries have `targetId`; the bootstrap's `secondStep` is always the object
    `{ kind, owner }`.

## For the owner: limits that would remain

- The open names no lock, so it is placed by the ids it carries. A passed lock's proof can be
  spent by any `POST /unlock` success that carries its ids; only the recorder writing the request's
  target (R1-L4, option 2) closes this.
- A passed step has no time limit in the scanner, as on the server.
- A capture that starts after a lock was opened (a reload scanned alone, H09) reports the lock's
  contents; the earlier capture must be scanned with it.
- A code, the choices or the right number under a key other than `code`, `numbers` or `number`
  (A18) is not seen; the rules judge by key and the scanner cannot compute the code.
- `number` on a route outside `mfa/*`, in a hash with no lock marker, is not judged; the player is
  shown that number at the gate anyway.
- Until the server echoes the lock or the recorder writes it: two locks worked inside 300 s is a
  finding (R1-L4), and in a scenario with PC steps a cancel or expiry on one side closes the other
  (R1-L5).
- An empty gated room makes every door open with id-less objects a finding (R1-L7).
- The routes are matched by `/games/<any id>/` until R1-L9 is applied.
- All of this rests on hand-made answers. Round 2 must repeat every capture above on real ones.
