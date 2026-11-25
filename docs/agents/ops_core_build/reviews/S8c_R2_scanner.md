# S8c review, round 2: leak scanner

Reviewed at `2788775bd` on `ops-lock2`. Area: `tools/playtest/lib/lock_step_leak_rules.rb` (`rules`),
its hooks in `tools/playtest/lib/access_leak_scanner.rb` (`scanner`), the
`access_leak_scanner_lock_step*` tests and the two new support files, after the fix commit
`2788775bd`. No code was changed.

Counts: 0 blockers, 2 majors, 3 minors.

## How it was checked

- **Regression.** All 24 scanner test files (`test/controllers/break_escape/access_leak_scanner_*`,
  `test/unit/access_leak_scanner*`): `516 runs, 32810 assertions, 0 failures, 0 errors, 0 skips`.
  `git diff 7f7fbf0a2..HEAD --stat -- test/controllers/break_escape/access_leak_scanner_mfa*` is
  empty: the S8a real-capture and fix tests are untouched and pass.
- **Round 1 probes rerun unchanged** (`scratchpad/s8c-r1/probe{1,2,3,4,5}_test.rb`) against the
  fixed scanner; their lines are quoted in the table.
- **New probes**, each a capture scanned by the real `AccessLeakScanner`, in
  `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s8c-r2-scanner/`:
  `r2a_test.rb` (edits to copies of the real run of `test_ops_lock_step`, 114 rows, unedited: 0
  findings), `r2b_test.rb` and `r2c_test.rb` (honest runs on the real routes of small scenarios
  built with `build_step_game`). Scanner line numbers below are the row's index plus one.

## Round 1 findings

| Finding | State | Evidence |
|---|---|---|
| R1-SCANNER1 PC hook loosened everywhere | closed | `scanner:4105` is `return if ls_placed?(body)`. Probe 5 on `test_ops_mfa`, old scanner beside new, all five PC steps: the same findings again, for example `P5 code success,message,expired,targetId OLD: 1 findings [[3, "mfa_session", "mfa:session:hana"]]` / `NEW: 1 findings [[3, "mfa_session", "mfa:session:hana"]]`; the lockout case `OLD: 2` / `NEW: 2`. Pinned in `..._r1fix_test.rb:49`. |
| R1-SCANNER2 honest approve `expired` reported | closed | `rules:84`. Real routes: `H6 approve after 301 s: 0 findings`, `H6 approve twice (the second after the pass): 0 findings`. `..._r1fix_test.rb:75` plays every POST-route name of `answers.json`. |
| R1-SCANNER3 `deviceId` / `requests` skip | closed | `rules:503`. `P2 success,mfaIncorrect,attemptsLeft,deviceId: 1 findings [[43, "lock_step_answer", "lockstep:refusal:mfa/verify"]]`, the same for `requests`. |
| R1-SCANNER4 lock below a closed gated container | closed for the container; **the room half is not done and the server has since decided it** | `P1 ... (capture ends there): 2 findings [[6, "lock_step_answer", "lockstep:gate:below:object:audit_zip"], ...]`, P1b and P1c 1 finding each. Room half: R2-SCANNER1. |
| R1-SCANNER5 gated room NPCs, unknown room data | closed, **with a new false alarm** | P12a, P12b, P12c, P3, P3b each report `lockstep:content:door:records_room`. An honest run with an NPC in the gated room and the bootstrap in the capture is clean (`N2 whole honest run: 0 findings`). The false alarm: R2-SCANNER2. |
| R1-SCANNER6 allowances proved by hand | closed | `..._r1fix_routes_test.rb` is an `ActionDispatch::IntegrationTest`; headless owner, flag reward and prop door are played on the real routes with `GET scenario` and `GET room/<door>` and asserted to report nothing; the missing-proof cases edit copies of those rows. `H1b bootstrap alone: 0 findings` (the server strips the habit, `4c13651ea`). |
| R1-SCANNER7 empty gated object | closed | Placed by the echo. `H4c after the open: 0 findings`; `..._r1fix_routes_test.rb:125`. |
| R1-SCANNER8 PC step of the wrong kind | closed | `rules:539-540`. `P4d PC code step an hour old: 4 findings [[3, "lock_step_answer", "lockstep:refusal:mfa/approve"], ...]`. `@mfa_pending` records do carry `:kind` (`scanner:4101`). What is left (`P4e PC push step an hour old: 0 findings`) is the accepted limit. |
| R1-SCANNER9 open key list | closed at the root; values inside allowed keys are not looked at | `P15 ... under number: 3 findings [[57, "lock_step_answer", "lockstep:open:key:object:moira_locker"], ...]`, P15b, P15c the same. Honest keys pass: `D2 honest extra keys on the open: 0 findings` (`alreadyOpen`, `cardId`, `completedTasks`, `rewards`), and the list matches `games_controller.rb:1318-1392` and `game.rb:252-260`. Inside: R2-SCANNER4. |
| R1-SCANNER10 refusal needs a gate of the route's kind | closed; the deviation is sound | See "The deviation" below. |
| R1-SCANNER11 limits test wrote answers by hand | closed | `..._limits_test.rb` builds every lock answer with `answer(name)` from `test/support/lock_step_scanner_rows.rb`; only the PC form's own answers are literals. |

Owner points of round 1: 1 (the open names its lock) done by the server and used by the scanner;
2 (PC cancel) waits for the recorder-tags stage by decision; 3 decided in `072a72a70`, not followed
by the scanner (R2-SCANNER1).

## The deviation from R1-SCANNER10

`rules:527`: a refusal of `mfa/prompt` or `mfa/approve` is accepted against a fresh gate of either
push kind. The server does send these for a number lock (`lock_step_gate.rb:97-126`:
`prompt_lock!` asks only for a live push record; real run rows 64 to 68 are waiting prompts for
`dana_cabinet`). It is tied to proof: the echo must name a lock, that lock must hold a gate not older
than 300 s, and the gate's kind must be a push kind. A leaking server gets nothing from it:

```
PROBE C1 prompt PASS for the number lock dana_cabinet: 1 findings [[65, "lock_step_answer", "lockstep:pass:no-gate"]]
PROBE C2 waiting prompt for the code lock priya_safe after its gate: 1 findings [[38, "lock_step_answer", "lockstep:refusal:mfa/prompt"]]
PROBE C3 approve cancel for the code lock after its gate: 1 findings [[38, "lock_step_answer", "lockstep:refusal:mfa/approve"]]
PROBE C5 waiting own_phone: 1 findings [[65, "lock_step_answer", "lockstep:refusal:mfa/prompt"]]
PROBE C6 waiting prompt for the number lock carries number: 3 findings [[65, "lock_step_answer", "lockstep:refusal:mfa/prompt"], [65, "lock_step_secret", "lockstep:key:number"], ...]
PROBE C7 waiting prompt carries numbers: 2 findings [[65, "lock_step_answer", "lockstep:refusal:mfa/prompt"], [65, "lock_step_secret", "lockstep:key:numbers"]]
PROBE C8 waiting prompt 301 s after the gate: 1 findings [[59, "lock_step_answer", "lockstep:refusal:mfa/prompt"]]
PROBE C10 tooSoon for moira_pc long after it opened (no gate): 1 findings [[38, "lock_step_answer", "lockstep:refusal:mfa/prompt"]]
```

A pass keeps the narrower list (a prompt never passes a number lock). Accepted as built.

## New findings

### R2-SCANNER1 (major) A gated lock in a room that has not opened still gets a gate, a refusal and a phone answer

The server changed in `072a72a70` (`lock_step_reach.rb:53`, `step_room_unreached?`): a gated object
in a room the player has not opened is refused as an invented id. On the real routes (`r2b_test.rb`,
a gated safe in an ordinary locked room and one in a gated room, both shut):

```
POST unlock 422 {"success":false,"message":"Invalid attempt"}
POST mfa/prompt 404 {"success":false,"error":"not found"}
POST unlock 422 {"success":false,"message":"Invalid attempt"}
POST mfa/prompt 404 {"success":false,"error":"not found"}
POST mfa/prompt 404 {"success":false,"error":"not found"}      (an invented id)
```

The rules still assume the old answers. `rules:34-35` says "the server answers for such a lock today
(R1-SCANNER4's room half waits for the owner's decision)"; the decision landed half an hour before
the fix commit. `ls_below_closed?` (`rules:181-186`) looks at object containers only. Captures (the
scenario given to the scanner has the lock moved into the room; the row is the real run's gate):

```
PROBE A1 gate for a safe inside an unopened gated room (capture is that one row): 0 findings []
PROBE A2 echoed expired for it: 0 findings []
PROBE A4 gate for a safe inside an unopened ordinary locked room: 0 findings []
PROBE A5 number-lock gate (carries the right number) for a cabinet inside an unopened gated room: 0 findings []
```

That gate tells the browser a hidden lock exists, that its first factor was right, its kind, its
owner and the right number, before the room has opened. It is the same leak R1-SCANNER4 was a major
for, and no real server answer needs the allowance any more.

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb`): at bind (`:140-163`) keep each object
lock's home room: `entry[:room]` when `entry[:home] == :room` (nil for a carried, profile or share
lock, which the server does not judge by room). Keep per game (in `ls_select_game`'s state, cleared
by `ls_note_reset`) a set of rooms served: add a room on a 200 `GET room/<id>` (the id from the
path), when its gated door enters `@ls_opened` (open, prop door, flag reward), and on a 200
`POST unlock` open with `type: "door"` whose `roomData` lists an id of that one room (authored, or
generated as in R2-SCANNER2). Add `ls_room_shut?(key)`: true for an object lock with a home room
that is not `@data['startRoom']` and not in that set. Use it wherever `ls_below_closed?` is used
(`:368`, `:418`, `:475`, `:511`): a gate is `lockstep:gate:room:<key>`, a pass, a phone answer and an
echoed refusal are findings as for the container. Replace the third limit in the header. Tests:
A1, A2, A4, A5 as tampers of the real run in `..._r1fix_real_test.rb`; in
`..._r1fix_routes_test.rb` an honest real-route run with a gated safe inside an ordinary locked room
and one inside a gated room (refused while shut, then room opened, gate, pass, open), asserted
clean (today: `G1 ... 0 findings`, `G2 ... 0 findings`, `G3 the whole honest run: 0 findings`, and
it must stay so).

### R2-SCANNER2 (major) An honest open of an ordinary locked room is reported in any scenario that has a gated door

New in `2788775bd`. `rules:591`: room data that lists no id in `@ls_known_ids` belongs to every shut
gated door. `@ls_known_ids` (`rules:168-172`) holds authored ids only. The server gives an object
with no authored id the id `<room>_<type>_<index>` (`game.rb:7911`), and a room may have no objects.
Real routes, a scenario with one gated door (`vault`) and an ordinary PIN room (`closet`), the
closet opened with its PIN and nothing else done:

```
POST unlock 200 {"success":true,"type":"door","roomData":{"type":"room_office","locked":true,"objects":[{"id":"closet_notes1_0","name":"Memo","text":"hello","type":"notes1","readable":true}],"lockType":"pin","connections":{"west":"hall"},"pinLength":4}}
PROBE F1 honest open of an ordinary room, id-less objects: 1 findings [[1, "lock_step_content", "lockstep:content:door:vault"]]
POST unlock 200 {"success":true,"type":"door","roomData":{"type":"room_office","locked":true,"objects":[],"lockType":"pin","connections":{"west":"hall"},"pinLength":4}}
PROBE F2 honest open of an ordinary empty room: 1 findings [[1, "lock_step_content", "lockstep:content:door:vault"]]
```

Before the fix this happened only when a gated room authored no objects (the old `R1-L7` test). How
common: `PROBE COUNT locked rooms in scenarios/: 169; with no authored object or NPC id: 78`. The
first mission to gain one gated door fails the leak check on an honest run, which is the pressure
that gets a scanner loosened. `test_ops_lock_step` does not show it because both its locked rooms are
gated.

The fix also changed the test that pinned the narrow case:
`access_leak_scanner_lock_step_review_test.rb:410-414` is still titled "flags an id-less roomData of
an ungated door" but its capture is now an open that echoes `records_room`, so no test holds the
echo-less case at all.

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb:168-172`): add to `@ls_known_ids`, for every
room, the id the server generates for each object with no authored id
(`"#{room_id}_#{obj['type']}_#{index}"`, index in the room's `objects`, as `game.rb:7911`). A gated
room's objects must author ids (`rules:151`), so this adds no way to hide one. Tests: F1 on the real
routes in `..._r1fix_routes_test.rb`, asserted clean; P3 (already there) still reported. Restore an
echo-less capture to `..._review_test.rb:410` and retitle the echoed one. The room with no objects
and no NPCs (F2) cannot be placed from the capture: see "for the owner" 1.

### R2-SCANNER3 (minor) An honest flag reward that opens a gated object is reported

The plan lets a flag reward open a gated object with no step (`lock_step_objects_test.rb:305-318`);
unit 28 gave the door reward an allowance tied to its `POST /flags` answer and nothing for the
object reward. Real routes:

```
POST flags 200 {"success":true, ... "rewards":[{"type":"unlock_object","objectId":"lk","flag_station_id":"station","room_id":"hall"}], ...
POST unlock 200 {"success":true,"type":"object","targetType":"object","targetId":"lk","hasContents":true,"contents":[{"id":"lk_memo", ...}]}
PROBE H honest flag reward open of a gated object: 3 findings [[2, "lock_step_content", "lockstep:open:object:lk"], [3, "lock_step_content", "lockstep:content:object:lk"], [4, "lock_step_content", "lockstep:content:object:lk"]]
```

Fails closed, and no shipped or test scenario authors it, so minor.

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb`): in `ls_collect_door_routes` also collect
the `objectId` of each authored `unlock_object` reward; in `ls_earn_door_routes` a 200 `POST /flags`
answer with `success: true` whose `rewards` holds `{type: "unlock_object", objectId: <a gated object
the scenario authors that reward for>}` adds `object:<id>` to `@ls_passed` (the reward stands in for
the pass; the echoed open then moves it to `@ls_opened` as any pass). Tests in
`..._r1fix_routes_test.rb` on the real routes: clean; then on copies of the rows: no reward authored,
the reward authored for another object, the open before the flag answer, a 422 flag answer: each
reported.

### R2-SCANNER4 (minor) A placed open is checked at its root keys only

`rules:662` holds the root keys; nothing looks inside the allowed ones, and `ls_judge_secrets`
(`:736`) reports `number` only in a lock-shaped hash or on an `mfa/` route. Real run, the open of
`moira_locker` (row 56) and of `records_room`:

```
PROBE B open of moira_locker carries {"rewards":[{"type":"x","number":97}]}: 0 findings []      (any number)
PROBE B open of moira_locker carries {"completedTasks":[{"attemptsLeft":2}]}: 0 findings []
PROBE B6 the open of records_room carries the plant room metadata, no ids: 0 findings []
```

(`{"rewards":[{"code":"511239"}]}` is reported, by both code rules.) B6: the `roomData` of a placed
door open is taken as that door's whatever it holds, so another shut room's `door_sign`, `lockType`
and `requires` pass when its object and NPC ids are left out.

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb`): (a) in `ls_judge_secrets`, inside a placed
open (the hashes under the root that `ls_judge_open` returned a key for) report `number` and
`attemptsLeft` under any hash, as `lockstep:key:number` and `lockstep:open:key:<lock>`; (b) in
`ls_judge_open`, for a door whose lock authors ids (`room_ids` or `npc_ids` not empty) and whose
answer has no `alreadyOpen`, a `roomData` that lists none of them is `lockstep:open:room:<lock>`.
Add the three captures to `..._r1fix_real_test.rb`.

### R2-SCANNER5 (minor) The integers of a lock refusal are unbounded

`rules:561` and `:571-572` ask only `is_a?(Integer)` of `promptsSent`, `retryAfterS` and `retryIn`.
The server's are small: `promptsSent` up to `MfaModel::MAX_PROMPTS` (20), `retryAfterS` up to
`PROMPT_GAP_SECONDS` (2). The phone entry's `n` is already bounded (`rules:483`). Real run:

```
PROBE C4 waiting prompt for the number lock with promptsSent 85000: 0 findings []
PROBE C9 codeLocked retryIn=511239 (the code) for priya_safe, capture to that row: 0 findings []
```

C9 is the owner's live six-digit code sent to a player who has not read the device. Round 1 missed
it; the PC rules are no tighter, which is outside this stage.

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb`, `ls_refusal_values_ok?`): `promptsSent` in
`1..MfaModel::MAX_PROMPTS`; `retryAfterS` in `1..MfaModel::PROMPT_GAP_SECONDS`; `retryIn` in `1..`
the longest wait `verify_lock_code!` can answer (`lock_step_gate.rb:91`; use the model's constant,
not a literal). Add C4 and C9 to `..._r1fix_real_test.rb`.

## The fix commit as new code: checked and found sound

- **Opens placed by the echo.** Honest opens with task, reward and card keys pass (D2); a repeat
  open passes (`D1 ... 0 findings`); no echo, a changed echo and an unknown lock are each reported
  for every open of the real run (`..._r1fix_real_test.rb:63-80`). The open's root is handed to the
  PC rules through `@ls_placed`, but every hook that reads it (`scanner:3763`, `:3837`, `:3942`,
  `:4105`) is for `numbers` or the three `mfa/` routes, and a root `numbers` or `number` on an open is
  reported by the key list, so nothing hides there.
- **The four edited test files.** `_test.rb:250` and `:588`, `_review_test.rb:240` and `:518`,
  `_routes_test.rb:142`: each change follows a rule change (the echo on opens, the gate kind for a
  refusal) and no assertion got weaker; `:518` gained a finding. The one exception is
  `_review_test.rb:410` (in R2-SCANNER2).
- **The server's other change.** `GET scenario` no longer carries `approvesPrompts`; the scanner
  never excused it (`..._r1fix_test.rb:194`), so no rule assumed the old answer.
- **Commit message.** Its claims hold, with one exception in the code it adds: the header limit at
  `rules:34-35` was already untrue when committed (R2-SCANNER1).
- **Shipped scenarios.** The commit touches no file under `app/`, `lib/` or `scenarios/`.

## Limits I accept for landing

1. With a PC push step open in a mixed scenario, an echo-less cancel on `mfa/approve` or waiting
   prompt on `mfa/prompt` reads as the PC's (`P4e PC push step an hour old: 0 findings`). Waits for
   the recorder-tags stage, by decision.
2. An echo-less open of a gated lock that serves no contents and no room data is not reported (the
   same bytes as an ordinary open). For a lock with contents the missing echo is reported at once and
   at every later row (`D3: 28 findings`).
3. Values under `serverGlobals` and the text of contents are not judged; content with no id under an
   unknown key of an item inside an honestly opened container is not either (round 1's P10c, still 0).
4. Freshness is judged on the recorder's clock, the server's on its own.

## For the owner

1. **A locked room with no objects and no NPCs, in a scenario with a gated door** (what is left of
   R2-SCANNER2 after its fix). Its honest open is `{success, type: "door", roomData}` with nothing to
   place it by, and the same bytes as a gated room's data with its objects stripped. Choose: the
   server echoes `targetType` and `targetId` on every 200 door open when the scenario has a lock step
   (no shipped scenario's answers change; the scanner then reports any echo-less room data and the
   loose rule has no false alarm), or the validator requires such a room to author one object with an
   id, or the false alarm is accepted and documented.

Verdict: not clean
