# S8c review, round 1: leak scanner (second review)

Reviewed at `b51b97d50` on `ops-lock2`. Area: `tools/playtest/lib/lock_step_leak_rules.rb` (called
`rules` below), its hooks in `tools/playtest/lib/access_leak_scanner.rb` (`scanner`), and the
`access_leak_scanner_lock_step*` tests, after the R1 fixes (33d614a59, e544d0a65) and unit 28
(a2e99509b..b51b97d50). No code was changed.

Counts: 0 blockers, 6 majors, 5 minors.

## How it was checked

Every capture below was built in a scratch test and scanned with the real `AccessLeakScanner`.

- **Real run.** `include BreakEscape::OpsLockStepRun`, `play_whole_run` (114 answers), turned into
  rows as `access_leak_scanner_lock_step_real_test.rb` does. Unedited it reports 0 findings. Each
  "gap" below is one edit to a copy of those rows; each row number is the row's index in that run.
- **Honest runs on the real routes** with a small scenario of my own (`build_step_game` from
  `test/support/lock_step_routes.rb`, the flag-reward and prop-door set-ups copied from
  `lock_step_doors_test.rb:141-198`): every request posted to the real controller, every answer
  recorded as a row.
- **Before and after.** The scanner file at the merge base
  (`git show $(git merge-base main ops-lock2):tools/playtest/lib/access_leak_scanner.rb`) loaded
  beside today's, both run over the same rows.
- **Regression.** All 21 scanner test files (`test/controllers/break_escape/access_leak_scanner_*`
  and `test/unit/access_leak_scanner*`): `491 runs, 23534 assertions, 0 failures, 0 errors, 0 skips`.

Scratch tests: `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s8c-r1/probe{1,2,3,4,5}_test.rb`
(they print one `PROBE <label>: <n> findings` line per capture; the lines are quoted below).

## Findings

### R1-SCANNER1 (major) The S8a rules are loosened in every scenario, lock step or not

`scanner:4105`: `return if ls_lock_form?(body)`. `ls_lock_form?` (`rules:92-94`) is true for any
hash with a `targetType` or a `targetId` key, and the hook does not ask whether the scenario has a
lock step or whether the lock rules placed the answer. So a PC's cancel, expiry or lockout that
carries either key no longer closes the PC's step, and a wrong code that carries one is no longer
counted. The lock rules are inert in such a scenario (`rules:271`), so nothing reports the key.

Capture, on `scenarios/test_ops_mfa` unchanged (no `secondStep` anywhere), PC `code_pc1`, owner
`hana`:

1. `POST login` 200 `{success:false, mfaRequired:true, mfa:"code", pcId:"code_pc1", npcId:"hana"}`
2. `POST mfa/verify` 422 `{success:false, message:<LOGIN_INCORRECT>, expired:true, targetId:"zzz"}`
3. `POST mfa/verify` 200 `{success:true, npcId:"hana", via:"password", pcId:"code_pc1"}`

```
PROBE P5 code success,message,expired,targetId OLD: 1 findings [[3, "mfa_session", "mfa:session:hana"]]
PROBE P5 code success,message,expired,targetId NEW: 0 findings []
PROBE P5 code success,cancelled,targetType OLD: 1 findings [[3, "mfa_session", "mfa:session:hana"]]
PROBE P5 code success,cancelled,targetType NEW: 0 findings []
PROBE P5 code success,message,lockedOut,retryIn,targetId OLD: 2 findings [[2, "lockout_list", "lockedOut"], [3, "mfa_session", "mfa:session:hana"]]
PROBE P5 code success,message,lockedOut,retryIn,targetId NEW: 1 findings [[2, "lockout_list", "lockedOut"]]
```

The same for `code_pc2`/`ines` and `push_pc`/`cal`. A pass after an expiry was a finding before
this stage and is clean now. This breaks "never loosened" and "inert with no step".

**Fix** (`tools/playtest/lib/access_leak_scanner.rb:4105`): skip only what the lock rules placed:
`return if ls_placed?(body)`. `@ls_placed` is empty in a scenario with no step, holds a judged lock
pass or refusal otherwise, and a lock-form answer the lock rules reported then closes the PC step
too, which is the safe direction. Add the three captures above to
`access_leak_scanner_lock_step_limits_test.rb`, each asserting `mfa:session:<owner>`.

### R1-SCANNER2 (major) An honest answer of `POST mfa/approve` is reported

`rules:71`: the approve list is `[%w[cancelled success], %w[message success]]`. The server also
answers `{success:false, expired:true}` with the echo from approve when the request has run out or
has already passed (`lock_step_gate.rb:134`, `lock_step_dropped`). The shared fixture has it
(`test/fixtures/files/lock_step/answers.json:119`, `approve_expired`); no scanner test reads it.

Real routes, a safe `amy_box` (push, owner `amy`), Amy's phone taken:

```
POST unlock 200 {"success":false,"secondStep":true,"kind":"push","targetType":"object","targetId":"amy_box","npcId":"amy"}
GET mfa/phone 200 {"requests":[{"targetType":"object","targetId":"amy_box","name":"amy box","n":0}]}
(301 seconds later)
POST mfa/approve 422 {"success":false,"expired":true,"targetType":"object","targetId":"amy_box"}
PROBE H6 approve after 301 s: 1 findings [[4, "lock_step_answer", "lockstep:refusal:mfa/approve"]]
```

A second press of Approve after the pass gives the same answer and the same finding. A player who
leaves the phone open for five minutes fails the leak check.

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb:71`): add `%w[expired success]` to the
`mfa/approve` list. In `access_leak_scanner_lock_step_review_test.rb` add a test that plays every
name in `answers.json` whose route is one of the three POST routes through `answer(name)` after its
gate and asserts no `lockstep:refusal` finding, so a shape the fixture gains is never missed again.

### R1-SCANNER3 (major) A refusal that carries `deviceId` or `requests` is judged by no rule

`rules:455`: `return unless placed && root['success'] != true && !root.key?('requests') && !root.key?('deviceId')`.
The two keys were meant to leave the 200 answers of `GET mfa/phone` and `GET mfa/device` to their
own rules, but the test is on the key alone, on every route and status. A lock's refusal on a POST
route with either key skips the shape check, and with the echo dropped nothing else sees it.

Real run, row 42 (`POST mfa/verify` 422, the wrong code at `priya_safe`) replaced:

```
PROBE P2 success,mfaIncorrect,attemptsLeft,deviceId: 0 findings []
PROBE P2 success,mfaIncorrect,attemptsLeft,requests: 0 findings []
PROBE P2 success,mfaIncorrect,attemptsLeft: 1 findings [[43, "lock_step_answer", "lockstep:refusal:mfa/verify"]]
```

`attemptsLeft` is the count the standards forbid on a lock answer; one extra key hides it.

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb:455`): apply the exemption only where it
belongs: `skip = info[:method] == 'GET' && info[:ok] && ((route == 'mfa/phone' && root.key?('requests')) || (route == 'mfa/device' && root.key?('deviceId')))`,
and `return unless placed && root['success'] != true && !skip`. Add both captures as tampers in
`access_leak_scanner_lock_step_real_test.rb`.

### R1-SCANNER4 (major) A lock below a closed gated container is not hidden from the gate and echo rules

The server never gates, and answers 404 with no echo for, a lock inside a gated container that is
still shut (Rule C, read in `lock_step_gate.rb:27` and `:214`: no gate, and `:not_found` for every action). The scanner
places a gate, a refusal and a waiting prompt by the lock's id alone and never asks whether the
lock's own container has opened.

Real run, the gate of `audit_zip` (row 16) copied to just after the gate of `moira_pc` (row 4),
before `moira_pc` has passed; `audit_zip` sits in `moira_pc`'s contents:

```
PROBE P1 gate for a lock inside a closed gated container (capture ends there): 0 findings []
PROBE P1 full run with that early gate: 0 findings []
PROBE P1b echoed expired for a lock inside a closed gated container: 0 findings []
PROBE P1c echoed waiting prompt for a lock with no gate, inside a closed container: 0 findings []
```

That gate tells the browser the hidden archive exists, that its password was right, its kind, its
owner and the right number, all before the first lock has passed.

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb`): add `ls_below_closed?(key)`: true when the
lock's id is in the `contents_ids` of another object lock that is not in `@ls_opened`. In
`ls_judge_gate` (after `ls_gate_key`), in `ls_pass_gates`, in `ls_phone_answer_ok?` and in the echo
branch of `ls_judge_refusal`, a lock for which it is true is a finding (`lockstep:gate:below`,
`lockstep:refusal:<route>`). Do the same for a lock inside the `room_ids` of an unopened gated
door, but see "for the owner" 3 first: today's server does answer for those, so that half will
report the real server until it is decided.

### R1-SCANNER5 (major) A gated room's NPCs and what they hold are not watched, and room data with no known object id belongs to no room

`rules:128`: for a door the watched list is `lockable['objects']` only. The room's `npcs` and their
`itemsHeld` are not in `room_ids`, and `ls_content_owners` (`rules:521-529`) places a `roomData`
hash only by the object ids it lists. The server's room data does carry `npcs` (real run row 2).

Real run, with an NPC `archivist` holding `vault_key` authored into `records_room` for the scan,
and the first `POST inventory` answer replaced:

```
PROBE P12a the gated room NPC and its held item in an inventory answer: 0 findings []
PROBE P12b room data of the gated room with its NPC, objects emptied: 0 findings []
PROBE P12c the same after the door gate, before the pass: 0 findings []
PROBE P3 roomData of gated room, objects stripped: 0 findings []
```

P12b's body was `{success:true, roomData:{type:"room_ceo", door_sign:"Records room", requires:["RECORDS-01"], npcs:[{id:"archivist", itemsHeld:[{id:"vault_key", ...}]}], objects:[]}}`:
the card that opens the door, the NPC and the key it holds, and no finding.

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb`): (a) at bind (`:128`), for a door add the
ids of every item in the room NPCs' `itemsHeld` to `room_ids`, and raise as R1-L7 does when one has
no id; (b) in `ls_content_owners`, also read the ids under `roomData.npcs` (the NPC ids and their
held items) against a per-door set of the room's NPC ids, used only for hashes under `roomData`,
`room` or `rooms.<id>` so an NPC named in a feed or a contact list is not reported; (c) fail closed:
a `roomData` hash that lists no id of any room of the scenario belongs to every gated door not yet
opened (today only when that door authors no objects, `:527`). Add P12a, P12b and P3 as tampers.

### R1-SCANNER6 (major) The three allowances unit 28 added are proved only on hand-written answers, and the real run of the headless one is not clean

`access_leak_scanner_lock_step_routes_test.rb` is an `ActiveSupport::TestCase`; every answer in it
is written by hand (`:63-78`, `:139-144`), against "tests drive real routes" and the brief's rule
that a scanner change after the clean run may only tighten. I played each on the real routes:

```
PROBE H2 prop door answer: 0 findings []          PROBE H2 then the room: 0 findings []
PROBE H3 headless owner: 0 findings []            (gate, prompt passed by the owner, open)
PROBE H1 flag reward then the room: 1 findings [[4, "mfa_secret", "mfa:key:approvesPrompts"]]
PROBE H1b bootstrap alone: 1 findings [[1, "mfa_secret", "mfa:key:approvesPrompts"]]
    social: {"characters":{"ghost":{"channels":{"email":"ghost_mail"},"emailRecord":{"habits":{"approvesPrompts":"always"}}}}}
```

So the prop-door and flag-reward allowances match what the server sends, and a headless owner does
approve. But `GET scenario` sends a headless record's `habits.approvesPrompts` to the browser, and
the scanner rightly reports it. A headless owner can only ever approve when that habit (or a level)
is authored on its record, so no real capture of a headless-owner lock can be clean: the scenario
in the routes test (`:35-36`) is exactly this one. Room NPCs have the key stripped
(`game.rb:7795-7800`); headless records do not.

**Fix:** (a) server, `app/models/break_escape/game.rb` `filtered_scenario_for_bootstrap` (`:2439`):
strip `habits.approvesPrompts` and `habits.promptPatience` from every
`social.characters.*.emailRecord` as the room-NPC filter does, with a test in
`ops_lock_step_no_exposure_test.rb`. (b) `access_leak_scanner_lock_step_routes_test.rb`: add an
`ActionDispatch::IntegrationTest` class that plays the flag reward, the prop door
(`lock_step_doors_test.rb:141-198`) and a headless owner on the real routes, with `GET scenario`
and `GET room/<door>` in each capture, and asserts no finding at all. Keep the hand-built cases only
for the missing-proof tampers, built from copies of those real rows.

### R1-SCANNER7 (minor) An honest open of a gated object that authors `contents: []` is reported at the next room read

The open answer of such a lock is `{success:true, type:"object"}`: it carries no id, so
`ls_judge_open` (`rules:563-564`) places nothing and the lock never reaches `@ls_opened`. The room
then lists it with `contents: []`, which `ls_content_owners` (`rules:516-519`) reads as its contents.

```
POST unlock 200 {"success":true,"type":"object"}
GET room/hall 200 ... {"id":"empty_safe","locked":false,"contents":[], ...}
PROBE H4c after the open: 1 findings [[5, "lock_step_content", "lockstep:content:object:empty_safe"]]
PROBE H4b no contents key: 0 findings []   (the same safe authored with no `contents` key)
```

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb`, `ls_judge_open`): a 200 `success: true`,
`type: "object"` answer with no `contents` is the open of the one passed object lock whose
`contents_ids` is empty; two such passed locks is a finding. Add the real capture as a test.

### R1-SCANNER8 (minor) Limit "an echo dropped in a mixed scenario": narrower than built, with what the capture already holds

`ls_pc_owns?` (`rules:473-477`) asks only that some PC step is open. It does not ask that the PC
step is of a kind the route serves, and a PC step never ends by time. Mixed scenario, a PC `code`
step opened, then an hour later: lock push gate, `POST mfa/approve` 422 `{success:false, cancelled:true}`
with no echo, then the lock's prompt pass and open with no new gate:

```
PROBE P4d PC code step an hour old: 0 findings []
PROBE P4c no PC step open, echo-less cancel: 4 findings [[2, "lock_step_answer", "lockstep:refusal:mfa/approve"], ...]
```

A code step cannot answer on the approve or prompt route, so that cancel cannot be the PC's.

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb`, `ls_pc_owns?`, which then takes `info`):
require an open PC step whose kind the route serves (`mfa/verify`: `code`; `mfa/prompt` and
`mfa/approve`: `push`, `push_number_match`), read from `@mfa_pending[..][:kind]`. Add P4d to
`access_leak_scanner_lock_step_limits_test.rb`. What is left is "for the owner" 2.

### R1-SCANNER9 (minor) Limit "no key list on open answers" (R1-L13, still open): it can be closed structurally

`ls_judge_open` checks `success` and `type` only. Real run, row 56 (the open of `moira_locker`):

```
PROBE P15 the open of moira_locker carries the right number of dana_cabinet under `number`: 0 findings []
PROBE P15c the open carries attemptsLeft: 0 findings []
```

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb`, `ls_judge_open`): hold the root keys of a
placed open to what `games_controller#unlock` can send: for a door `success type roomData
alreadyOpen` plus the rfid card answer's keys and the keys `add_server_writes_to_answer!` adds; for
an object `success type alreadyOpen hasContents contents rewards completedTasks updatedTasks` plus
the same. A key outside the list is `lockstep:open:key:<lock>`.

### R1-SCANNER10 (minor) An echoed refusal needs no gate and no matching kind

The server gives `mfaIncorrect`, `stale`, `codeLocked`, `tooSoon`, a waiting prompt or `cancelled`
only against a live record of the right kind; with none it answers `expired`, and on the wrong
route 404. The echo branch (`rules:462`) accepts any listed shape for any lock.

```
PROBE P13 verify mfaIncorrect for the push lock moira_pc: 0 findings []
PROBE P13 verify stale for the push lock moira_pc: 0 findings []
PROBE P13 waiting prompt with a count for a lock never gated: 0 findings []
```

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb`, `ls_judge_refusal`): an echoed refusal other
than `{expired}` or `{message}` needs a fresh gate in `@ls_gates` for the lock it names, of a kind
in `LS_ROUTE_KINDS[route]`.

### R1-SCANNER11 (minor) The limits test writes server answers by hand

`access_leak_scanner_lock_step_limits_test.rb:53-58`, `:86-91`: gate, device, pass and open are
literal hashes, not `answers.json` entries or rows of the real run. This is how R1-SCANNER2 was
missed. **Fix:** build them with the `answer(name)` helper of
`access_leak_scanner_lock_step_review_test.rb` (move it to a shared support file) or from the real
run's rows.

## The first review's findings

L1, L2, L3, L4, L5 (but see R1-SCANNER1 for the hook it added), L6, L7, L8, L9, L10 (lock rules
only), L11, L12, L14: closed; each has a test in `..._review_test.rb` that passes and my captures
against them were reported. L13: `name`, `waiting` and `type` done; the open key list is not
(R1-SCANNER9). L15: left as built (fail-closed); the real run has no collision.

## Checked and found sound

- **Echo placement.** A pass that names an honestly gated lock cannot excuse another lock's
  contents: the open is placed by the ids it carries (P9, P9b, P10, P10b each reported
  `lockstep:open:` or `lockstep:content:` for the other lock).
- **Opener.** An `opener` that may not open that door is reported (P11: `gordon` on `records_room`).
- **Headless owner.** Real: the server passes the prompt of a headless owner; habit `never` and an
  unknown owner stay findings.
- **Prop door and flag reward.** Real answers match the shapes the rules expect; the answer must
  name the door, the scenario must author it for that door, and another gated room's ids in the same
  answer are still reported. Neither excuses a room it did not open.
- **PC-form refusal only with its message.** `mfa_sign_in.rb:122-157` sends `message` with
  `mfaIncorrect`, `stale`, `codeLocked`, `tooSoon` and `expired`; the cancel (`:193`) and the
  waiting prompt (`:163`) have none. The rule matches the server.
- **Type check on opens.** Real opens say `type: "object"` and `type: "door"`.
- **S5a, S7, S8a real-capture tests** pass unchanged; only `access_leak_scanner_mfa_fix_test.rb`
  gained two lines (R1-L6). The stage's diff of `access_leak_scanner.rb` is 12 insertions and 4 deletions.
- **Inert with no step:** true for the lock rules (`rules:271`); false for the PC hook (R1-SCANNER1).
- **Recorder:** no file of the recorder changed in this stage; the rules read no request body.
  `tools/playtest/verify-run.rb` is unchanged (the brief listed "one block" for unit 28; the scanner
  is run by `access-leak-check.rb`, which prints the merged rule text).

## For the owner

1. **An open names no lock** (stated limit). It cannot be closed with what the recorder keeps: the
   answer `{success:true, type:"object"}` holds nothing to place it by. The server answer would need
   the request's own `targetType` and `targetId` on the 200 open answer of `POST /unlock`, as the
   three `/mfa` routes already echo them. Neither is secret. R1-SCANNER7 is the part that can be
   fixed without it.
2. **An echo dropped while a PC push step is open** (what is left of the first limit after
   R1-SCANNER8). A PC cancel `{success:false, cancelled:true}` and a lock cancel with its echo
   dropped are the same bytes. The PC-form cancel and waiting-prompt answers would need `pcId` (the
   PC's gate answer already carries it). Accept the limit or add the key.
3. **Server, outside this area, for the server reviewers.** On the real routes, with a gated safe
   inside a gated room that has never been opened: `POST mfa/prompt` for it answers
   `422 {success:false, expired:true, targetType, targetId}` where an invented id answers
   `404 {success:false, error:"not found"}` (an existence test for a hidden lock, no first factor
   needed); and a hand-built `POST unlock` with the right PIN is gated, passed and opened, and
   `GET container/<it>` serves its contents, with `unlockedRooms` still `["hall"]`. The scanner
   reports the second (`lockstep:content:door:vault`, probe H5b). Decide whether a lock inside an
   unopened room is refused like one inside a closed container; R1-SCANNER4's room half follows.
