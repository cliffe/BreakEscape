# S8c review, round 3: leak scanner

Reviewed at `12dc96a08` on `ops-lock2`. Area: `tools/playtest/lib/lock_step_leak_rules.rb` (`rules`)
after the fix commit `12dc96a08`, its hooks in `tools/playtest/lib/access_leak_scanner.rb`
(`scanner`) and the scanner tests. No code was changed.

Counts: 0 blockers, 2 majors, 4 minors.

## How it was checked

- **Regression.** All 26 scanner test files (`test/controllers/break_escape/access_leak_scanner_*`,
  `test/unit/access_leak_scanner*`), one run: `534 runs, 41146 assertions, 0 failures, 0 errors, 0 skips`.
  `git diff 2788775bd..12dc96a08 --stat` over the S5a (`_privilege_real`), S7 (`_ops_access_real`, `_ops_real`,
  `_ops_skin_real`) and S8a (`_mfa*`) real-capture tests is empty; they pass as before: each whole played run reports
  nothing, and S5a's counted cases still give the 38 and 112 findings they assert.
- **Server read.** Id generator `game.rb:7914-7960` (`stamp_scenario_object_ids!`, `stamp_contents_ids!`) and
  `game.rb:2302-2307`; room reach `lock_step_reach.rb:52-63`; `GET room` `games_controller.rb:573-598`; route-room door
  open and object refusal `games_controller.rb:1281-1300`; reward answer `games_controller.rb:4250-4302`,
  `game.rb:4928-4958`; refusal integers `mfa_model.rb:22-26`, `mfa_access.rb:56-58`, `:107-115`,
  `lock_step_gate.rb:98`, `:118`, `:129`; number-match numbers 10..99 (`mfa_model.rb:152`).
- **Probes**, each a capture scanned by the real `AccessLeakScanner`:
  `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s8c-r3-scanner/r3a_test.rb`
  (`include BreakEscape::OpsLockStepRun`, `play_whole_run`: 114 rows of `test_ops_lock_step`, unedited `0 findings`).
  Line numbers in findings are the row index plus one.

## Round 2 findings

| Finding | State | Evidence |
|---|---|---|
| R2-SCANNER1 gated lock in a room not opened | closed for the case asked; **the "opened" proof is too weak** (R3-SCANNER1) | `rules:225-228` (`ls_room_shut?`), used at `:443`, `:493`, `:550`, `:586`. `P0 gate alone, closet shut: 1 findings [[1, "lock_step_answer", "lockstep:gate:room:object:priya_safe"]]`; `P2c real rows up to the gate (office GETs only): 1 findings [[37, ...gate:room:object:priya_safe]]`. Honest route runs G1-G3 pinned in `_r2fix_routes_test.rb:128`. Home room only for `home == :room` (`rules:166`), as `step_object_homes` (`lock_step_reach.rb:69-72`). |
| R2-SCANNER2 honest open of an ordinary room reported | closed; the generated ids match the server; **the owner-decision allowance reaches beyond the open** (R3-SCANNER2) | `rules:187-207`. `G server ids 42; missing from scanner: []; extra in scanner: []` (id-less objects, nested id-less contents two deep, explicit `id: nil`, an NPC holding an id-less item and an id-less box with id-less contents, against `stamp_scenario_object_ids!` run on the same data). Generated ids cannot excuse gated content: a gated lock's list must author every id (`rules:154`, raise). `_review_test.rb:410-424` restores the echo-less case. |
| R2-SCANNER3 flag reward opening a gated object | closed, with two loose ends (R3-SCANNER4) | `rules:273-276`, `:808-813`. `R1 reward from its station, then open: 0`, `R5 no reward, open: 1 findings [[1, "lock_step_content", "lockstep:open:object:priya_safe"]]`; routes test `_r2fix_routes_test.rb:182-200`. |
| R2-SCANNER4 values inside a placed open | closed | `rules:743-751` ((b)), `:837-841` ((a)); `_r2fix_real_test.rb:113-131` report the three R2 captures. |
| R2-SCANNER5 refusal integers unbounded | closed; bounds match the server | `rules:636-646`: `promptsSent` 1..`MAX_PROMPTS` (20; the server sends `n` after its increment, `mfa_access.rb:113-115`), `retryAfterS` 1..`PROMPT_GAP_SECONDS` (2; `gap - (now - last)` with `now - last` in 0..1, `mfa_access.rb:107`), `retryIn` 1..`CODE_CLOSED_SECONDS` (300; `left.positive?`, `mfa_access.rb:56-58`). Constants, not literals. What fits inside the bounds: limit 5. |

## New findings

### R3-SCANNER1 (major) A room counts as opened on proof that does not tie the answer to that room

`ls_note_rooms` (`rules:236-247`) adds a room on any 200 `GET room/<id>`, and on any 200 door open whose `roomData` lists
one id of that room, whatever else it lists. Neither is a thing the server sends for a shut room, and neither row is
reported, so a leaking server's own answer excuses the gate that follows. Scenario: `priya_safe` moved into an ordinary
PIN room `closet` (with one id-less note), plus an ordinary PIN room `annex` holding `annex_memo`:

```
PROBE P0 gate alone, closet shut: 1 findings [[1, "lock_step_answer", "lockstep:gate:room:object:priya_safe"]]
PROBE P1 annex open lists priya_safe, then gate: 0 findings []
PROBE P1b annex open lists closet_notes1_0, then gate: 0 findings []
PROBE P2 GET room/closet 200 alone: 0 findings []
PROBE P2b GET room/closet 200 then gate: 0 findings []
```

P1 and P1b: an open of the annex that also lists a closet id (the gated safe itself, or the generated id of its note).
The server's door open serves one room (`serve_opened_room(target_id)`, `games_controller.rb:1314`); a first open lists
only that room's objects. P2: `GET room/<id>` answers 200 only for the start room, a room already in `unlockedRooms`
(which only a door open, a reward or a workaround puts there), the awareness world room, or a route room
(`games_controller.rb:586`), so in a capture from the start of a game it is never the first proof of a room except for the
world room, and for a route room it proves the opposite (R3-SCANNER5).

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb`, `ls_note_rooms`): (a) a 200 `GET room/<id>` adds the room only
when it is the awareness world room (`social.awarenessEpisode.world.room`, as `Game#awareness_world_room?`); (b) a door
open (no `alreadyOpen`) adds a room only when the scenario ids it lists (`@ls_room_ids` values) all belong to that one room;
when they belong to two or more rooms, add none and report `lockstep:room:mixed` (`lock_step_content`). Replace the header
sentence at `rules:36-38`. Tests in `_r2fix_real_test.rb`: P1, P1b, P2b reported; the honest G1-G3 run in
`_r2fix_routes_test.rb:128` stays clean (its proof is the store's own door open). What is left (P1c, below) is limit 1.

### R3-SCANNER2 (major) The "no ids, nothing to protect" allowance was applied to every room data, and a test was loosened for it

The round-2 owner question was about one answer: the echo-less 200 door open of an empty locked room. The fix put the
exception in `ls_content_owners` (`rules:673`), which every route uses, and changed
`access_leak_scanner_lock_step_test.rb:349-354` from reported to `[]` for a `GET scenario` that carries a gated room's
`roomData`. No server route sends `roomData` outside a door open (`games_controller.rb:1318-1322`, `:4350`; `GET scenario`
sends room metadata only). Real run row 23 edited:

```
PROBE P3 GET scenario carries records_room roomData with no ids: 0 findings []     (with door_sign, lockType, requires: ["records_card"])
PROBE P3b GET scenario carries a root roomData with no ids: 0 findings []
```

That is a rule loosened to make a test pass, beyond the case decided. I found no record of the owner's decision in
`docs/agents/ops_core_build/` or the hand-on file; the commit message is the only place it is stated.

**Fix** (`rules:671-673`): keep `!ids.empty?` only for the root `roomData` of a 200 `POST unlock` answer with
`type: "door"` (pass a flag from `ls_judge_contents` for that hash); everywhere else an id-less `roomData` belongs to every
shut gated door as before. Restore the assertion at `access_leak_scanner_lock_step_test.rb:353` to
`[['lock_step_content', 'lockstep:content:door:records_room']]`, add P3b. Record the owner's decision in the S8c docs.

### R3-SCANNER3 (minor) `awareness` on a headless owner's record is not reported; the server's fix this round has no scanner rule

The server fixer is stripping `awareness` from headless records (`game.rb:7807-7809` in the working tree): it picks the
preset prompt habit (`MfaModel.prompt_habit`, `mfa_model.rb:162-168`), so it tells the player whether a headless owner
approves. The withheld-key rule skips `social` at the root (`access_leak_scanner.rb:1785`), and the lock rules check
only `approvesPrompts`:

```
PROBE W1 GET scenario carries a headless owner record with awareness low: 0 findings []
PROBE W2 same with habits.approvesPrompts (control): 1 findings [[1, "mfa_secret", "mfa:key:approvesPrompts"]]
```

**Fix** (`tools/playtest/lib/lock_step_leak_rules.rb`): in a scenario with a lock step, report `awareness` (and
`promptPatience`) on any `emailRecord` under `social.characters.*` or `social.mailClient.contacts[]`, as the
approvesPrompts rule does (`mfa:key:awareness`). Test W1 in `_r2fix_real_test.rb`; the real run stays clean once the server
fix lands (it fails until then, which is the point).

### R3-SCANNER4 (minor) The flag-reward allowance ignores the station the answer names, and an authored reward by name is a false alarm

`@ls_reward_objects` (`rules:273-276`) is one set for the whole scenario, and `ls_earn_door_routes` (`:808-813`) does not
read the answer's `flag_station_id`, which the server always merges in (`games_controller.rb:4254`, `:4261`, `:4267`).
The server also accepts a reward that names its object by `name` (`game.rb:4930`, `:4937`); the scanner keys by id only.
Probes (station `st_a` authors the reward for `priya_safe`, `st_b` authors none):

```
PROBE R2 reward named by st_b (which authors no such reward), then open: 0 findings []
PROBE R3 reward with no station, then open: 0 findings []
PROBE R4 reward authored by name "Wall safe" (server accepts), then open: 1 findings [[2, "lock_step_content", "lockstep:open:object:priya_safe"]]
```

**Fix**: collect `{station id => objectIds}` (resolving an `objectId` that is an object's `name` to that object's id, as
`flag_reward_unlocks_object?` does); accept a reward only when `flag_station_id` names a station that authors it for that
object. The same for the door rewards (`r['flag_station_id']` against the station's own `unlock_door` list). Tests: R2, R3
reported; R4 clean on the real routes.

### R3-SCANNER5 (minor) A route room is served and still refuses its objects; the scanner counts it opened

`GET room/<id>` answers 200 for a route room without promoting it (`games_controller.rb:584-598`), and the route-room door
open is the same bytes as a real open (`games_controller.rb:1294-1303`, `:1318-1322`), while every object action there
is refused 403 `room_not_reachable` (`:1281-1284`); the fixer's working-tree change to `step_room_unreached?`
(`lock_step_reach.rb:63`, `!in_npc_route_room?(home)`) leaves that refusal in charge. So a gate for a safe in a route room
that has not been promoted is not an answer the server gives, and the scanner passes it after either proof (P2b is those
bytes). Promotion (`viaPass` through `sync_state`, `game.rb:506-521`) leaves no room answer, so the scanner cannot see it
either way. No shipped scenario has both a route room and a lock step yet. **Fix**: an owner choice: the server marks
the route-room answers (`routeRoom: true` on the door answer and the `GET room` answer) and the scanner treats a marked room
as shut until a door open without the mark; or this is recorded as a limit of the stage.

## The rest of the fix as new code

- **Generated ids.** All three patterns are as the server makes them (G above): `<room>_<type>_<i>` with `i` the index in
  `objects` (id-less only when `id` is nil, as `||=`), `<npc>_held_<i>` only for a room NPC with a string id,
  `<parent>_content_<i>` recursively with the parent's final id. Resource and profile contents are not added; they are
  never room data, so nothing needs them.
- **Integer bounds.** Correct against the server (table). No honest answer is refused: real run rows 8-10 (`promptsSent`
  1, 2; `retryAfterS` 2) and 65-69 (1..5) pass.
- **Flag-reward object.** Tied to a 200 `POST flags` answer and to `!ls_hidden?` (a reward for an object in a shut room
  earns nothing); the routes tests refuse a missing reward, another object, an open before the answer and a refused answer.
- **R2-SCANNER4 (b)** reports an honest first open of a gated room whose only authored ids are NPCs that were all moved out
  before it opened (`npcs_removed`, `game.rb:2963-2964`). Rare and fail-closed: limit 6.

## Rules that depend on the server's answers changing this round

1. `awareness` stripped from headless records: no scanner rule reads it (R3-SCANNER3). Until the server fix lands, a real
   capture with a headless owner that authors `awareness` still carries it and the scanner does not say so.
2. The take route answering a gated item in an unopened room (or in a shut gated container, or held by an NPC not met) as
   an invented id (`games_controller.rb:1449`, `lock_step_take_error_hidden?` in the working tree): no scanner rule judges
   refusal messages (`grep "not found in scenario\|not encountered\|does not give" tools/playtest/lib/*.rb` is empty).
   The difference between the two messages is checked by the server's tests only; the scanner neither depends on the old
   answer nor checks the new one.
3. The 500 on `GET /scenario`: the scanner reads only bodies that are JSON; a 500 body is skipped like any refusal. The
   lock rules' proof for headless owners and door routes comes from the scenario file, not from that answer, so nothing
   depends on it. A capture taken before the fix simply lacks the bootstrap row.
4. The gate's `opener` (working tree, `lock_step_gate.rb:39-43`: only an NPC the player has met whose `unlockable` lists
   the door). The scanner's `ls_may_open_door?` (`rules:430-433`) requires `unlockable` but not "met"; that is looser than
   the new server and was already so; an NPC id is the most it lets through.
5. R2-SCANNER1's rule (`ls_room_shut?`) depends on the round-1 server change `072a72a70` and on the route-room exception
   now being added (R3-SCANNER5).

## Limits the stage lands with

1. A door open lists no room id; one that serves another shut room's data whole (P1c, `PROBE P1c a door open lists only
   closet_notes1_0, then gate: 0 findings []`) is the same bytes as that room's honest open, because the recorder keeps no
   request body. The first factor of an ordinary door is not the scanner's to judge.
2. With a PC push step open in a mixed scenario, an echo-less cancel or waiting prompt reads as the PC's (R2 limit 1,
   by decision for the recorder-tags stage).
3. An echo-less open of a gated lock that serves no contents and no room data is not reported (R2 limit 2), and an
   echo-less door open with an empty object and NPC list is placed nowhere (owner decision, once R3-SCANNER2 narrows it).
4. Values under `serverGlobals`, the text of contents, and id-less content under unknown keys of an honestly opened item
   are not judged (R2 limit 3). Freshness is on the recorder's clock (R2 limit 4).
5. Integers inside the server's bounds can still carry a value: `promptsSent` 10..20 can equal a right number (10..99),
   `retryIn` any number 10..99 (`C1 ... promptsSent 17: 0 findings`, `C2 codeLocked retryIn 99: 0 findings`). Closing it
   needs the scanner to count the prompt answers per gate; not asked for here.
6. A gated room whose only ids are NPCs moved out before it opens is reported on its honest first open (fail closed).
7. Route rooms (R3-SCANNER5) if the owner chooses to record it rather than mark the answer.

Verdict: not clean
