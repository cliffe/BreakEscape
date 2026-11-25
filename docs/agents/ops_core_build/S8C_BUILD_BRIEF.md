# S8c build brief: a second step on any lock (feature A25, steps G1 to G4)

Written 2026-11-24 by the S8c designer. Read `docs/agents/OPS_CORE_BUILD_BRIEF.md` first; its rules
bind every builder here. Worktree `/data/be-ops-skin`, branch `ops-lock2` (cut from `main`; it
holds S8a and S6). `node_modules` there is a symlink: never touch or commit it. Leave the stray
untracked `.tmp` ink file under `scenarios/test_phone_calls/ink/` alone.

The design is `docs/achitechture/OPS_LOCK_SECOND_STEP_PLAN.md` (cited as `P<line>`). Builders do
not need to read the plan: this brief carries what each unit needs. Where this brief and the plan
disagree on a name, a file, a line number or how a thing is cut, THIS BRIEF is right (checked
against `ops-lock2` on the day). Line numbers are today's: re-find every anchor by name.

Short names: `GM` = `app/models/break_escape/game.rb`, `GC` =
`app/controllers/break_escape/games_controller.rb`, `MA` = `app/models/break_escape/mfa_access.rb`,
`MS` = `app/models/break_escape/mfa_sign_in.rb`, `MM` = `lib/break_escape/mfa_model.rb`,
`JS` = `public/break_escape/js`, `FX` = `test/fixtures/files/lock_step/answers.json`.

**No migration is needed.** All new state is two keys inside `player_state`. If you find you need
a schema change, stop and report.

**Another stage is being built at the same time** (S8b, helpdesk recovery, on its own branch). It
edits `GM`, `GC`, `MS`, `MM`, `scripts/validate_mfa.rb`, the scenario schema and the leak scanner.
S8c therefore puts its code in NEW files and touches those shared files only with one-line hooks,
each in its own clearly commented block (`# S8c lock second step`), so a merge is "keep both".
Never reorder, reformat or re-wrap a line you do not own in a shared file.

## 1. What S8c adds, in play

A lock may carry `secondStep: { kind, owner }`. After the lock's own first factor is right (the
password, PIN, card, key, and so on, exactly as today), the lock stays shut until the owner's
second step passes:

- `code`: the player types the six digits shown on the owner's `code_device`, which they must
  hold. Only on `password` and `pin` locks.
- `push`: a request goes to the owner. A careless owner approves when pestered (S8a's rule, the
  same per-owner count as sign-in). A player holding the owner's phone approves it themselves.
- `push_number_match`: the owner never approves. Only a held phone works, by tapping the number
  the lock's pane shows.

It may sit on a locked room object or a `contents` entry at any depth (G1), on a room, meaning
its door (G2, push kinds only unless the door's lock is `password` or `pin`), and on a carried
item: an NPC's `itemsHeld` entry, a start item, a declared grant's item, a `takeable` object
(G3). G4 closes a gap for any carried container: once it has left the inventory and every open
room, a hand-built request no longer reaches it.

Not built: a step on a `flag` lock, on a `login` PC (S8a owns that), on `ransomware_display`,
`network_architecture` or `alarm_panel`. `JS/minigames/dual-auth/` is unregistered and is left
alone.

## 2. Plan drift and rulings

| # | Plan | Code on `ops-lock2` | What builders do |
|---|---|---|---|
| D1 | "No new scene and no new module" (P417); `MfaClient.runLockStep`, `finishLock`, `cancelFeedback`, `window.MfaClient` | None exist. `JS/systems/mfa-client.js` is an ES leaf module exposed as `window.mfaClient` (`pc-sessions.js:1255`) | The lock logic goes in a NEW leaf module `JS/systems/lock-step.js`, exposed as `window.lockStep`: `run`, `cancelFeedback`, `isCancel`. `finishLock` is private to it |
| D2 | The pane is "the second pane of the `password` scene", opened over other pads "as a child with `secondStepOnly: true`" (P613-621) | No `secondStepOnly`. The second pane in `password-minigame.js` (3324 lines, `:2759-3300`) is bound to a PC (`pc:<id>`, `pcSessions`). The minigame framework holds ONE scene: starting another ends the pad, and the pad instance awaiting its `/unlock` answer dies (`minigame-manager.js:42-110`) | Ambiguity A1: the pane is a DOM layer of its own (`JS/ui/lock-step-pane.js`), not a framework scene. The pad stays live beneath and receives one ordinary answer. `password-minigame.js` is NOT edited |
| D3 | Phone and device opened from the pane as child scenes `authenticator-live`, `code-device` (P622-630) | Those scenes are started through the framework and would end the pad beneath | Ambiguity A2: the pane shows the held device's code and the held phone's one request card inline. `authenticator-live`, `code-device`, `minigames/index.js` and `minigame-starters.js` scene lists are not edited, and no overlay scene is added |
| D4 | `MfaModel` gains `LOCK_KINDS`, `CODE_LOCK_TYPES`, `PUSH_LOCK_TYPES`, `lock_step`, `lock_step_never_passes?` (P225-232) | None exist | New file `lib/break_escape/lock_step_model.rb` (`BreakEscape::LockStepModel`), so `MM` is not edited |
| D5 | `device_in_use?(npc_id)` from the MFA plan | Does not exist | Not needed: a lock's code is compared against the owner's `code_device` id through `MA#verify_second_step_code` |
| D6 | `/mfa/*` routes "take `target_type` and `target_id`" | The three POST actions refuse them with the generic 422 (`GC:1590`, `:1607`, `:1640`); `mfa_phone` reads `npc_id` only; `MS#mfa_declared?` (`:265`) is false in a scenario whose only second steps are on locks, so `GET /mfa/device` would answer 404 | Units 13 and 14 build the lock form. `mfa_declared?` gains one `||` (unit 13) |
| D7 | A pass "sets `passed`" | `MA` READS `rec['passed']` (tidy keeps it) but nothing writes it; for a non-PC subject `:passed` leaves the record and "the caller marks `passed`" | The lock callers (unit 13) set `rec['passed'] = true` |
| D8 | `MA` signatures | `verify_second_step_code(map, key, subject, typed, device_id, npc_id:)`, `send_second_step_prompt(map, key, subject, npc_id:, reenrolled: false)`, `approve_second_step(map, key, subject, npc_id:, number: nil, deny: false, reenrolled: false)`, `second_step_numbers(subject, pending, npc_id:)`, `second_step_requests(sets, npc_id:)` with `sets = [{ kind:, map: }]`, `mfa_subject_key(subject)` giving `"<kind>:<id>"` | Call them as they are. A lock always passes `reenrolled: false`. `MA` is NOT edited |
| D9 | Log rows reuse the eight `mfa_*` events | All eight are `places: %w[pc]`; `mfa_challenge` detail is `route` only (`ops_log_events.rb:62-69`) | Unit 05 widens `places` and adds a `method` detail |
| D10 | Validator: "the MFA plan's `code_device` error, widened here" (P940-942) | `scripts/validate_mfa.rb` `mfa_device_errors` (`:101-115`) refuses a `code_device` whose owner is not an account | Unit 06 widens it: an owner who owns a `secondStep` lock of kind `code` is also allowed |
| D11 | Line numbers throughout | Moved. Now: `GC#unlock` `:1194-1382` (`validate_unlock` call `:1212`, refusal branch `:1214-1244`, transaction `:1271`, badge rows `:1217`, `:1286`, `:1310`); `GC#container` `:627`; `GC#inventory` `:1386`; `serve_opened_room` `GC:3112`; `GM`: `unlock_room!` `:139`, `unlock_object!` `:695`, `carriable_object?` `:1375`, bootstrap room allowlist `:2443-2493`, `ACCESS_STATE_DEFAULTS` `:3058`, `path_unlocked?` `:3432`, `locate_object_in` `:4599`, `validate_unlock` `:4955`, `find_scenario_object` `:5225`, `filter_requires_and_contents_recursive` `:7537`; `unlock-system.js`: `notifyServerUnlock` `:25`, `requestRfidAccessUnlock` `:167`, `handleUnlock` `:1011`, `getLockRequirementsForDoor` `:1632`, `unlockTarget` `:1734`; `ApiClient.unlock` `api-client.js:105`; `validate_scenario.rb` run list `:9128`; schema `lockType` room block `:4366`, item block `:5536`; `lock_key_diff.rb` `REQ_KEYS` `:58` | Find by name |
| D12 | G1, G2, G3, G4 built one after another, each editing `GM`, `GC` and `unlock-system.js` | n/a | This brief cuts by FILE, not by plan step (section 4). The whole stage lands together, so the validator has no "not until G2" or "not until G3" errors |
| D13 | The plan's scenario uses one door, `records_room`, for both the card beat and the NPC-opened beats | One door can be opened once | The scenario has two gated doors (ambiguity A6) |
| D14 | Pinned overlay-scene list | `test/js/playtest-shellx-open-wait.test.mjs:149-151` pins 17 names on this branch (18 once `main` is merged in again) | Under A1 and A2 no overlay scene is added, so the list is unchanged. If any unit does add a scene that draws its own X, that unit updates the list and its count |

## 3. Constraints, in plain words

**Never sent to the browser.** A lock's password or PIN stays exactly where it is today (stripped
by `strip_lock_answers!` and the `requires` filters; this stage changes none of that). A code,
except in `GET /mfa/device` while that device is held. Which of the phone's three numbers is
right. Any hint on a wrong first factor that a step exists beyond what `secondStep` on the object
already says. The state keys `lockSteps`, `npcStepGrants`, `mfaPrompts`, `mfaAccounts`. The
owner's `habits` and `awareness`. The `contents` of an object, or a room's `roomData`, before
BOTH checks have passed. Sent on purpose: `secondStep` (`kind`, `owner`) on the object or room
as authored; on the gate answer the owner's `npcId` and, for number matching, the one number the
pane displays; for a door an NPC opened, the `opener` NPC id. Every `/mfa/*` answer is
`Cache-Control: no-store`.

**Every open is a server decision from server-held state.** No global, event or client claim
passes a step. The `npc` unlock method does NOT skip the step. Only a `flag_reward` unlock the
server itself accepts (`flag_reward_unlocks_object?`) skips it. A propped door and a flag-reward
door open with no step (settled in the plan).

**Determinism.** No random draw (`rand`, `SecureRandom`, `Math.random` are out). Codes and
numbers come from S8a's HMAC functions. No runtime LLM decides or words anything.

**Time.** Server time only through `MS#mfa_now`. The constants are S8a's in `MM`
(`PENDING_SECONDS = 300`, `PROMPT_GAP_SECONDS = 2`, `MAX_PROMPTS = 20`, `MAX_CODE_TRIES = 5`,
`MAX_CODE_WRONG_TOTAL = 30`, `CODE_CLOSED_SECONDS = 300`); add none. Rails tests freeze time
(`travel_to`). Client code takes its clock and its timers from `configure` (injected), and JS
tests never wait on a real timer. A scripted run reads codes from the device and never computes
one.

**No exploit content.** Abstract, invented mechanics and product names. Do not open SecGen XML or
any exploit-detail field guide.

**Existing scenarios unchanged.** No shipped scenario carries `secondStep`, so every existing
lock in every shipped scenario must behave exactly as before: same answers, same writes, same
sounds and toasts. After any engine Ruby edit run `bin/ops-golden-compare` with NO outer `flock`
(it takes the lock itself; wrapping it deadlocks every session's queue). A diff is a bug to
report, never a reason to capture again. `node test/js/ops-unchanged-validator.test.mjs` must
show no new line for any shipped scenario. Campaign missions (m01 to m10, sis*) and every
existing scenario are not edited. The one planned change for old scenarios is G4's: a HAND-BUILT
request for a carried container that has left the player is refused (ambiguity A4); every flow a
player can reach by clicks is unchanged.

**Database.** Shared development database, no backup: never `db:create`, `db:schema:load`,
`db:migrate`, `db:reset`, `db:drop`, `db:setup`, `db:seed`. Rails tests:
`flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <files>`; never `ruby -Itest`.

**Tests do not change application classes.** No test may `prepend` to, `alias`, reopen or
redefine a method on an application class or module (`Game`, `GamesController`, `MfaAccess`,
`AccessLeakScanner`, and so on) unless it restores the original in an `ensure` block in the same
test. Prefer a stub scoped to one object (`obj.stub(:name, value) { ... }`) or a subclass made
inside the test. A change that leaks breaks another file only in the full run.

**Server answers in client tests come from one file.** `FX` holds every answer shape of this
stage. Every node test that needs a server answer reads it from `FX`. No node test may write a
server answer by hand, not even "a small one". Unit 15's Rails test proves `FX` equals what the
routes really send. If `FX` is wrong, report it: the fixture and both sides change together.

**Event mappings.** A new `eventMappings` entry goes LAST in its list;
`ruby tools/check_mapping_index_drift.rb` must pass.

**New static JS imports** go on every harness copy list that copies the importing module. Re-grep
`test/js` for the importer's file name before editing; the grep is the authority. This stage is
designed to add static imports only in unit 24 (the wiring). `api-client.js` reaches
`window.lockStep` as it reaches `window.stateSync`, so it gains no import; the pads and
`unlock-system.js` read `secondStep` straight off the data they hold and call
`window.lockStep?.…`, so they gain none either.

**Leak scanner.** `tools/playtest/lib/access_leak_scanner.rb` is never loosened. Every allowance
is tied to proof in the capture (the request that earned it, by id), and anything the scanner
cannot judge fails closed (reported as a finding). A hit is a finding to report, never a rule to
relax. A recorder change is planned elsewhere: do not depend on it.

**Never edit `.claude/skills/`.**

**State.** `lockSteps` and `npcStepGrants` are server-owned: no sync body may write them and they
are not a sync section (delta sync rule).

**Text.** UK English. All server and author text reaches the DOM through `textContent`.

**Every unit.** Edit only the files in your list; a needed change elsewhere is reported, not
made. Commit only when your prompt says, by explicit path, no attribution lines. "Unmodified"
means you do not edit that test file.

## 4. The contract every unit builds to

### 4.1 State (server only)

- `player_state['lockSteps']`: `{ "object:<id>" | "door:<roomId>" => record }`. The record is
  S8a's pending record (`id`, `kind`, `n`, `tries`, `nonce`, `at`, `last`) plus `npcId`, and
  `passed: true` once the step has passed. Unpassed records older than 300 s are dropped on every
  read and write (`tidy_pending!`). A passed record waits, for the rest of the game if need be,
  for the next right first factor, and is deleted by the open.
- `player_state['npcStepGrants']`: `{ "door:<roomId>" => npcId }`, written when the gate accepts
  an `npc` first factor at a gated door, deleted when that door opens.
- `mfaPrompts[npcId]` and `mfaAccounts[npcId]` are S8a's and are shared with sign-in.

### 4.2 Server functions (names are fixed; files in section 5)

`LockStepModel` (pure Ruby): `LOCK_KINDS = %w[push push_number_match code]`,
`CODE_LOCK_TYPES = %w[password pin]`,
`PUSH_LOCK_TYPES = %w[password pin key rfid combination cryptex biometric bluetooth ble]`,
`lock_step(lockable)` (a `{ 'kind', 'owner' }` Hash or nil; the owner falls back to the object's
own `owner` when that is one NPC id), `each_lock_step(scenario)` (every gated lockable with its
home), `lock_step_never_passes?(scenario, lockable)`.

`Game` concern `LockSecondStep` (rules): `second_step_ids` (memoised Set of object ids);
`resolve_unlock_target(target_id)` giving `{ object:, path: }` or nil;
`step_object_open?(object)` (Rule B: `unlockedObjects.include?(object['id'])`, never a name);
`record_step_open!(object)` (Rule A: the only writer of a gated id into `unlockedObjects`;
raises unless the record is `passed`; deletes the record); `behind_closed_step?(path)` (Rule C);
`lock_step_for(target_type, target_id)` giving `{ subject:, key:, step:, object: | room: }` or
nil, by ID only (an object id must be in `second_step_ids`; a door id must name a room with
`secondStep`); `lock_steps_map`.

`Game` concern `LockStepGate`: `lock_step_gate(target_type, target_id, method, resolved:)`
answering nil (nothing to do, or a passed record: go on and open) or the gate answer Hash;
`verify_lock_code!`, `prompt_lock!`, `approve_lock!`, `lock_phone_answer`, each taking
`(target_type, target_id, ...)` and answering `[body, status]` or a symbol (`:not_found`,
`:no_phone`).

`Game` concern `LockStepReach` (Rule D): `carried_step_ids`, `carried_step_chains`,
`carried_step_reachable?(object, path)`.

`Game` concern `LockStepDoors`: `note_npc_step_grant!(room_id, npc_id)`,
`clear_npc_step_grant!(room_id)`, `npc_step_opener_for(room_id)`.

### 4.3 Answers (unit 02 writes these into `FX`; unit 15 proves them)

| Name in `FX` | Route | Status and body |
|---|---|---|
| `gate_push` | `POST /unlock`, right first factor | 200 `{ success: false, secondStep: true, kind: "push", targetType, targetId, npcId }` |
| `gate_number` | same | as above with `kind: "push_number_match"` and `number` (two digits) |
| `gate_code` | same | as above with `kind: "code"` |
| `gate_door_npc` | `POST /unlock`, door, method `npc` | `gate_push` plus `opener: <npcId>` |
| `open_object`, `open_door` | the repeat `POST /unlock` after a pass | today's success answer, unchanged (`contents` or `roomData` appear here and nowhere earlier) |
| `first_factor_wrong` | `POST /unlock` | today's refusal, byte for byte |
| `verify_passed` | `POST /mfa/verify` | 200 `{ success: true, stepPassed: true }` |
| `verify_wrong`, `verify_stale_used`, `verify_stale_expired`, `verify_dropped`, `verify_closed` | same | 422 with S8a's keys: `mfaIncorrect: true`; `stale`; `expired: true`; `codeLocked: true, retryIn`. Never `attemptsLeft` (a lock has no lockout) |
| `prompt_waiting`, `prompt_passed`, `prompt_too_soon`, `prompt_expired` | `POST /mfa/prompt` | 200 `{ success: false, approved: false, promptsSent, waiting? }`; 200 `{ success: true, stepPassed: true, approvedBy: "owner" }`; 422 `tooSoon: true, retryAfterS`; 422 `expired: true` |
| `approve_passed`, `approve_cancelled` | `POST /mfa/approve` | 200 `{ success: true, stepPassed: true, approvedBy: "player" }`; 422 `{ success: false, cancelled: true }` |
| `phone_one_request`, `phone_number_request` | `GET /mfa/phone?npc_id=&target_type=&target_id=` | 200 `{ requests: [{ targetType, targetId, name, n, numbers? }] }`, at most the one request of the lock named |
| `not_found`, `no_phone`, `no_device`, `generic_refusal` | any | 404 `{ success: false, error: "not found" }`; 403 `"no such phone"`; 403 `"no such device"`; the generic 422 the PC form uses |

A lock form names its subject with `target_type` (`object` or `door`) and `target_id` in place of
`pc_id`. Both forms at once, or neither, is the generic 422. A pass answer never carries
`contents` or `roomData`.

### 4.4 Client (names are fixed)

`JS/systems/lock-step.js`, a leaf with NO imports:

- `configure({ mfa, post, nextClientTs, applyServerWrites, openPane, isClear, isOpenInClient, setTimer, clearTimer, toast, rejectTone, writeOpener })`.
- `run(answer, request, opts = {})`: `answer` is the `secondStep: true` body, `request` the body
  just posted. Returns a promise that resolves with the FINAL `/unlock` answer or rejects with a
  cancel error. `opts.fromDoor` marks the door retry.
- The cancel error: shaped like a refused post (`status: 403`,
  `body: { success: false, reason: 'second_step_cancelled', closedByPlayer }`); read how
  `ApiClient.post` shapes a refusal and match it.
- `isCancel(error)`, `cancelFeedback(error)` (a deny or expiry: the reject tone once and the line
  "Not approved."; the player's own X: nothing).

`openPane(ctx)` (from `JS/ui/lock-step-pane.js`) returns
`{ done: Promise<'passed' | 'denied' | 'expired' | 'closed'>, close() }`.

A lock's subject on the client is the string `"<targetType>:<targetId>"`, which `mfa-client.js`
already turns into `target_type` and `target_id`.

## 5. Units and waves

| Wave | Units (side by side) | Waits for |
|---|---|---|
| 0 | 01 unchanged fixtures and carrier survey, 02 answer-shape fixture, 03 lock step model | nothing; 01 BEFORE any engine edit |
| 1 | 04 `game.rb` seams, 05 log events, 06 schema and validator, 07 dungeon graph, 08 `lock-step.js`, 09 `api-client.js` hand-off, 10 `mfa-client.js` lock phone, 11 leak scanner rules | wave 0 |
| 2 | 12 rules A to C, 16 reach, 17 door grants, 18 pane (frame and code), 19 pane (push and phone card), 20 `unlock-system.js` part one, 21 starters and readers, 22 doors and NPC callers | 04 (12, 16, 17); 02 (18, 19); 09 (20, 21, 22) |
| 3 | 13 gate and lock callers, 14 controller, 23 feature scenario, 24 wiring and test bridge, 25 `unlock-system.js` part two | 12, 16, 17 (13, 14); 06, 07 (23); 08, 10, 18, 19 (24); 20, 21 (25) |
| 4 | 15 controller tables and answer proof, 26 scenario tests, 27 client real-flow tests | 13, 14 (15); 23 (26); 24, 25 (27) |
| 5 | 28 scanner real answers and `verify-run`, 29 docs | 26 |
| after | merge `main` in, train the merged tree, scripted playtest, live proof | 28 |

Review points: the scanner (unit 11) is reviewed once after wave 1 and again after unit 28. The
server is reviewed after wave 3 and after wave 4.

Plan step of each unit: G1 = 01 to 15, 18 to 21, 24, 25 (object halves). G2 = 17, 22 and the door
halves of 06, 13, 14, 20, 25. G3 = the carried halves of 06, 14, 16, 23. G4 = 16 and the survey
in 01.

Single owners of shared files: `GM` unit 04 only; `GC` unit 14 only (unit 15 may fix `GC` in
wave 4); `MS` unit 13 (one line); `ops_log_events.rb` unit 05; `scenario-schema.json`,
`validate_scenario.rb`, `validate_mfa.rb`, `lock_key_diff.rb` unit 06;
`ops_unchanged_cases.rb` unit 01; `access_leak_scanner.rb` unit 11 (one hook) then 28;
`unlock-system.js` unit 20 then 25; `mfa-client.js` unit 10; `api-client.js` and
`lock-scope-refusal.js` unit 09; `item_identity.rb` unit 16; `systems/test-bridge/index.js`
unit 24. `MA`, `MM`, `password-minigame.js`, `pc-sessions.js`, `minigames/index.js`,
`config/routes.rb` and `game_policy.rb` are edited by NOBODY.

### Unit 01: unchanged fixtures and carrier survey (wave 0)

- **Files:** `test/support/ops_unchanged_cases.rb` (add cases in one new block at the end),
  new `test/fixtures/files/ops_unchanged/lock_*.json`.
- **Build:** read the header of `lib/tasks/ops_unchanged.rake` and the `mfa_*` cases as the
  model. Say in your report what the existing fixtures already pin, then add cases for what they
  do not: (a) one right and one wrong `POST /unlock` per lock type that a shipped test scenario
  has (`password`, `pin`, `key`, `rfid` with and without an access list, `combination`,
  `cryptex`, `biometric`, `bluetooth`, `ble`), for an object and for a door where one exists;
  (b) `GET /container` and an inventory add for a locked container before and after it opens;
  (c) an `npc` door unlock; (d) the legitimate flows of the three scenarios G4 touches:
  `test_unlock_gaps` (the start cryptex bag `test_start_cryptex`; `test_courier_bag` given by
  `test_courier`), `ceo_exfil` (the Bluetooth `Tablet Device`), `test_social_m5_channels`
  (`m5_locked_terminal`); (e) the bootstrap of each scenario used. Capture with
  `ONLY=<name> bin/rails app:ops:unchanged:capture`.
- **Survey:** list, mechanically, every top-level carried item (start item, NPC `itemsHeld`
  entry, declared grant item, `takeable` room object) that has a lock or `contents`, in every
  scenario rendered through ERB (some `.json.erb` do not parse as plain JSON), nested carriers
  included, with scenario, home, id (or "no id") and lock type. Put the list in your report and
  in `docs/agents/ops_core_build/HANDOVER_S8c_01.md`. Unit 16 builds from it.
- **Do NOT:** edit an engine file; touch an existing fixture; add a second replay test.
- **Done when:** `bin/ops-golden-compare` passes with the new names; `git status` shows only your
  files.

### Unit 02: answer-shape fixture (wave 0)

- **Files:** `test/fixtures/files/lock_step/answers.json` (new), `test/js/lock-step-answers.test.mjs` (new).
- **Build:** `FX` is one JSON object keyed by the names of section 4.3. Each entry is
  `{ "route", "status", "body" }`. Values that vary are written as real examples (`"number": 47`,
  `"n": 1`) and listed per entry under `"varies": ["number"]`, so unit 15 compares the rest
  exactly. Use the scenario ids of unit 23 (`moira_locker`, `priya_safe`, `records_room`, and so
  on). For `open_object`, `open_door` and `first_factor_wrong`, copy the body shape from an
  existing controller test of today's `/unlock` (name the test in a `"from"` field) and do not
  invent keys. The node test checks the file against itself: every name of 4.3 present; no gate,
  verify, prompt, approve or phone body holds any of `contents`, `roomData`, `requires`, `code`,
  `password`, `pin`, `right`; `numbers` only under the two `phone_*` entries; statuses as 4.3.
  Export one helper, `loadAnswer(name)`, from `test/js/helpers/lock-step-answers.mjs` (yours,
  new) that every client test uses.
- **Done when:** the node test passes. Hand on the helper's path and the entry names.

### Unit 03: lock step model (wave 0)

- **Files:** `lib/break_escape/lock_step_model.rb`, `test/unit/lock_step_model_test.rb` (new).
  No Rails in the model (as `mfa_model.rb`).
- **Build:** the names of section 4.2. `lock_step(lockable)`: nil unless `secondStep` is a Hash
  with a kind in `LOCK_KINDS`. `each_lock_step(scenario)`: one walk over every authored home
  (room objects and their `contents` at any depth, rooms themselves, NPC `itemsHeld` including
  headless records, start items, declared grant items), yielding the lockable, its kind
  (`:object` or `:door`), its id and its home. `lock_step_never_passes?`: true when the owner's
  code device (`code`) or phone (push kinds) is in no place the player can take it from
  (`MfaModel.held_item_sources`) and, for `push` only, `MfaModel.prompt_habit` is `never`.
- **Tests:** `lock_step` for each kind, a bad kind, the owner fallback (one NPC id, none,
  several); the walk finds a lock in each home; `never_passes` with four cases for `push`
  (pestered owner; careful owner with a takeable phone; careful with none; `always`), two each
  for `push_number_match` and `code`.
- **Done when:** your file passes. Hand on every signature.

### Unit 04: `game.rb` seams, no behaviour change (wave 1)

- **Files:** `GM`; new `app/models/break_escape/lock_second_step.rb`, `lock_step_gate.rb`,
  `lock_step_reach.rb`, `lock_step_doors.rb` (STUBS only: each a concern defining every function
  of section 4.2 with a neutral body: an empty Set or Hash, `nil`, `true` for
  `carried_step_reachable?`, `false` for `behind_closed_step?`, no-ops for the door writers);
  `test/models/break_escape/lock_step_seams_test.rb` (new).
- **Build, each hook in its own commented block:**
  1. `include` the four concerns after `MfaSignIn`.
  2. State: `lockSteps` and `npcStepGrants` default `{}`, declared and made server-owned the way
     `mfaPending` is (`ACCESS_STATE_DEFAULTS`, `:3058`, on their own line at the END of the Hash;
     dropped by `reset_player_state!` with the other access keys). If declaring them changes any
     golden fixture or bootstrap, use lazy accessors instead and say so.
  3. `validate_unlock` gains `resolved: nil`. When given, it uses that object and path and does
     not search again. Before its own checks it refuses (exactly as for an invented id) a target
     for which `behind_closed_step?(path)` is true or `carried_step_reachable?(object, path)` is
     false. For a resolved object in `second_step_ids` that is not `step_object_open?`, the
     "already open" shortcut is off.
  4. `find_scenario_object(id)` keeps its answer; when `second_step_ids` is not empty it is
     `resolve_unlock_target(id)&.dig(:object)`.
  5. `unlock_object!(id)` refuses (returns without writing, logs a server warning) a string in
     `second_step_ids`: only `record_step_open!` writes those.
  6. Room payloads: wherever a locked object's `contents` are removed today
     (`filter_requires_and_contents_recursive`, `:7597`), a gated object counts as locked until
     `step_object_open?`. `secondStep` itself stays on the object as authored.
  7. Bootstrap room allowlist (`:2443-2493`): copy `secondStep` (its `kind` and `owner` only)
     and add `npcStepOpener` when `npc_step_opener_for(room_id)` is not nil and the room is not
     unlocked.
  8. `unlock_room!` calls `clear_npc_step_grant!(room_id)` (a no-op that must not create the
     key).
  9. `carriable_object?` already refuses anything locked: confirm by test, change nothing.
- **Do NOT:** write any rule body (units 12, 13, 16, 17 fill the stubs in their own files).
- **Tests:** with the stubs, every hook is inert on a scenario with and without `secondStep`;
  a grep test: nothing under `app/` or `lib/` appends to `unlockedObjects` except
  `unlock_object!` and `record_step_open!`.
- **Done when:** `bin/ops-golden-compare` passes including unit 01's cases; unmodified
  `unlock_response_filter_test.rb`, `npc_container_unlock_test.rb`,
  `combination_cryptex_unlock_test.rb`, `flag_reward_unlock_door_test.rb`.

### Unit 05: log events (wave 1)

- **Files:** `lib/break_escape/ops_log_events.rb` (the eight `mfa_*` lines only),
  `test/unit/lock_step_log_events_test.rb` (new).
- **Build:** each of the eight `mfa_*` events gains the places `object` and `door` beside `pc`.
  `mfa_challenge` gains a second detail key `method`: `key`, `lockpick`, `rfid`, `biometric`,
  `bluetooth`, `ble`, `pin`, `password`, `combination`, `cryptex`, `npc`. No new event name. If
  the registry cannot hold two optional detail keys on one event, report it rather than adding
  an event.
- **Tests:** each event accepts a row at an object and at a door; `mfa_challenge` accepts each
  `method` and refuses another word; `mfa_prompt_approved` still lists `own_phone` (S8b's).
  `test/unit/mfa_log_events_test.rb` and `test/models/break_escape/ops_log_test.rb` unmodified.
- **Hand on:** how existing tests trip the secret guard (grep `secret in` under `test/`).

### Unit 06: schema, validator, lock diff (wave 1)

- **Files:** `scripts/scenario-schema.json` (your two blocks only), `scripts/validate_lock_step.rb`
  (new, one entry `check_lock_step(json_data)`), `scripts/validate_scenario.rb` (one
  `require_relative` after `validate_mfa` at `:31` and one `run.call` after `check_mfa` at
  `:9128`), `scripts/validate_mfa.rb` (D10 only), `scripts/lock_key_diff.rb` (`secondStep` added
  to `REQ_KEYS`), `test/js/validator-lock-step.test.mjs` (new).
- **Build:**
  - Schema: `secondStep`, a closed object (`kind` enum of the three kinds; `owner` with
    `x-ref: "npc"`), NOT `x-serverOnly`, beside `lockType` in the item lock block and in the
    room block. Not on `doors[]` items.
  - Errors: `secondStep` on something not `locked: true` with a `lockType`; unknown kind; owner
    missing where required (a room; an object with no single-NPC `owner`) or not an NPC; an
    object with no `id`, or whose id or name equals another object's id, name or generated
    `<room>_<type>_<index>` form; an id over 40 characters or outside `[A-Za-z0-9_.:-]`; on a
    `doors[]` entry; on a `flag` or `login` lock or a type that never opens; `code` outside
    `CODE_LOCK_TYPES`; any kind outside `PUSH_LOCK_TYPES`; on a key or card (`opens_lock`,
    `key_id`, `keyPins`, `card_id`, types `key`, `keycard`); on a `usb` item or inside one's
    `contents`; on or inside a `tableItems` entry; on a consumable (the type list is read from
    `JS/systems/consumables.js` `DEFAULT_HEAL_BY_TYPE`; a test checks the two lists agree); on a
    declared grant item with `droppable: true`; on a flag station's `itemsHeld`; on a hideable
    device (`lib/break_escape/hiding_spots.rb`); a carrier above a gated object with no id;
    `code` whose owner has no `code_device`; a push kind whose owner has `phone: false`; an
    `unlock_object` task that names a gated object by anything but its `id`; on a room whose
    doorway carries a `gate`, on the start room, or on the awareness world room; a step that
    never passes (`LockStepModel.lock_step_never_passes?`) on a lock a task needs.
  - Warnings: a step that never passes on a lock no task needs; a gated target named in an
    NPC's `unlockable` or an `eventMappings[].unlockDoor`; a gated object with its own `text`
    ("put it in `contents`"); a gated room object's `tableItems`; a copyable gated file;
    `remove_item` on a gated nested `takeable`; a carried container with a lock or `contents`
    and no id ("not covered by the carried check; give it an id").
- **Tests:** a fixture per error and warning, each with a passing twin; a scenario with no
  `secondStep` gets no line from the new check.
- **Done when:** your files; unmodified `node test/js/ops-unchanged-validator.test.mjs` shows NO
  new line for any shipped scenario EXCEPT the no-id carrier warning, which is expected for
  `ceo_exfil`'s tablet only: if that test pins warnings too, report and stop rather than
  re-recording; `node test/js/validator-mfa.test.mjs` unmodified.

### Unit 07: dungeon graph (wave 1)

- **Files:** `scripts/generate_dungeon_graph.rb`, `test/js/dungeon-graph-lock-step.test.mjs` (new).
- **Build:** a gated lock gets a second edge into its lock node from the owner's NPC node,
  labelled with the kind; dashed and labelled "never passes" when
  `LockStepModel.lock_step_never_passes?`. Model on the MFA block (`:1861-1902`), in a block of
  your own after it. No code, number, password or PIN in a label.
- **Done when:** your file; every `test/js/dungeon-graph-*.test.mjs` unmodified; a scenario
  without the field draws exactly as before.

### Unit 08: `lock-step.js` (wave 1)

- **Files:** `JS/systems/lock-step.js`, `test/js/lock-step-core.test.mjs` (new).
- **Build:** section 4.4, with everything it needs injected through `configure`.
  - `run`: emit nothing itself (`mfa.noteRequired(subject, answer)` emits `mfa_required`). For a
    door answer that carries `opener`, call `writeOpener(targetId, opener)` first.
  - **When the pane may open.** A request whose `method` is `npc` waits for a clear screen:
    `isClear()` is asked at once; clear on the first ask opens at once with no toast; otherwise
    show the toast "Second step pending. It opens when you finish here." once, re-ask every
    400 ms through `setTimer`, and open on the second clear answer in a row. No timeout. A
    `fromDoor` request asks once and, if not clear, settles as a silent cancel
    (`closedByPlayer: true`). Every other method opens at once.
  - **One pane at a time.** A request ready to open queues behind an open pane and behind
    nothing else. When a queued request reaches the head it re-posts its own `/unlock` body once
    and acts on the fresh answer: `success: true` settles as a pass with no pane; a target
    `isOpenInClient` reports open settles as a silent cancel; a fresh `secondStep` answer opens
    the pane on it. A pane is never closed to make room for another.
  - **Outcome.** `'passed'`: post the same body again through `post` (NOT through
    `ApiClient.unlock`), with a fresh `nextClientTs()`, apply its server writes with
    `applyServerWrites`, and resolve with that answer. If that answer is `secondStep: true`
    again, reject as a cancel (`closedByPlayer: false`). `'denied'` and `'expired'`: reject with
    `closedByPlayer: false`. `'closed'`: reject with `closedByPlayer: true`. A pane that fails
    to open is a silent cancel, so the promise always settles.
  - The request body lives only in the closure; nothing is stored.
- **Tests (answers from `FX` only; clock, timers and pane stubbed):** each outcome; the re-post
  uses `post` once with a new timestamp; a second `secondStep` answer rejects; the `npc` wait
  (clear at once; not clear then clear twice; toast once); `fromDoor` not clear; two requests
  give two panes in turn with the re-post at the head; `cancelFeedback` for both flags;
  `writeOpener` called only for a door answer with `opener`.
- **Hand on:** the exact `configure` keys and the `openPane(ctx)` fields you pass, for units 18,
  19, 24.

### Unit 09: `api-client.js` hand-off (wave 1)

- **Files:** `JS/api-client.js`, `JS/utils/lock-scope-refusal.js`,
  `test/js/second-step-lock.test.mjs`, `test/js/unlock-one-poster.test.mjs` (new).
- **Build:** `ApiClient.unlock(targetType, targetId, attempt, method, extra = {}, opts = {})`.
  When the answer has `secondStep === true` it does not return it: it returns
  `window.lockStep.run(answer, body, opts)` (with no `window.lockStep`, it rejects as a silent
  cancel). `opts` is never posted. An answer without the field takes today's path, byte for
  byte. In `lock-scope-refusal.js`, `second_step_cancelled` joins the table of refusals a pad
  closes as cancelled with no attempt counted and no reject sound, with NO line of its own (the
  line and tone come from `lockStep.cancelFeedback`, called here once); `unlockWithRouteRoomRetry`
  never retries on it.
- **Tests (answers from `FX`; `window.lockStep` stubbed, which is a client module, not a server
  answer):** a gated answer is handed over with the body sent and resolves with the final
  answer; a cancel rejects with the error; an ungated answer never touches `lockStep`; the grep
  test: nothing under `JS/` posts to `'/unlock'` except `api-client.js` and `lock-step.js` (the
  latter through its injected `post`).
- **Done when:** your files; unmodified `unlock-route-room-retry.test.mjs`,
  `lock-scope-refusal.test.mjs`, `unlock-r1-ux.test.mjs`.

### Unit 10: `mfa-client.js` lock phone (wave 1)

- **Files:** `JS/systems/mfa-client.js` (one new exported function and nothing else),
  `test/js/mfa-client-lock.test.mjs` (new).
- **Build:** `lockPhone(subject, { npcId })`: `GET mfa/phone` with `npc_id`, `target_type` and
  `target_id`. Confirm by test, without changing them, that `verify`, `prompt` and `approve`
  with an `object:` or `door:` subject send `target_type` and `target_id`, never reach
  `onSession`, emit their events with `targetType` and `targetId`, and never cause
  `pc_signin_failed`.
- **Tests:** answers from `FX`. `mfa-client.test.mjs` unmodified.

### Unit 11: leak scanner rules (wave 1; reviewed after this wave and again after unit 28)

- **Files:** `tools/playtest/lib/lock_step_leak_rules.rb` (new; a module with its own constants
  and methods), `tools/playtest/lib/access_leak_scanner.rb` (ONE `require_relative`, one
  `include` or call, and one line in the rule text table, in a commented block of their own),
  `test/controllers/break_escape/access_leak_scanner_lock_step_test.rb` (new).
- **The rule for this file: never loosened; every allowance tied to proof in the capture; fails
  closed.** Rules are ADDED and structural (judged by key and by which request earned what, not
  by matching strings), and earned PER LOCK:
  - The `contents` of a gated object, or the `roomData` of a gated room, in ANY answer is a leak
    unless the capture holds, earlier and for that same id, a gate answer followed by a pass
    answer (`stepPassed: true`) followed by the `/unlock` answer with `success: true`. An open
    of that id with no pass before it is itself a finding.
  - `lockSteps`, `npcStepGrants`, `mfaPrompts`, `mfaAccounts` as a key anywhere is a leak.
  - `numbers` is allowed only in a `mfa/phone` answer whose request named that lock and a held
    phone; `number` only in a gate answer of kind `push_number_match`; a six-digit `code` only
    in `mfa/device`. Anywhere else each is a leak. A mark of which number is right is a leak.
  - A gate, pass or refusal answer carrying any key outside section 4.3's list for it is a leak.
  - Anything the rules cannot place (an answer for a gated id from a route they do not know)
    is reported, not passed.
- **Tests:** build captures from `FX` (read the file; do not retype answers): a clean run
  reports nothing; the same run doctored once per rule reports exactly that rule; an open with
  no pass is reported; an unknown route is reported. The S8a scanner tests
  (`access_leak_scanner_mfa_*_test.rb`) unmodified and green.
- **Done when:** your files. Do not edit `.claude/skills/`; do not depend on any recorder change.

### Unit 12: rules A to C (wave 2)

- **Files:** `app/models/break_escape/lock_second_step.rb`,
  `test/models/break_escape/lock_second_step_test.rb` (new).
- **Build:** fill the stub. `second_step_ids` from `LockStepModel.each_lock_step`, memoised per
  instance; a gated object with no `id` is never listed and never opens (server warning).
  `resolve_unlock_target` must agree with today's `find_scenario_object` for every id it finds;
  a twin name is judged by the first match in walk order. `behind_closed_step?(path)`, modelled
  on `path_unlocked?` (`GM:3432`): true when any object ABOVE the target on the path is gated and
  not `step_object_open?`. `record_step_open!` and `step_object_open?` as section 4.2.
  `lock_step_for` by id only.
- **Tests:** ids from every home; Rule A raises without a passed record and writes the id and
  deletes the record with one; Rule B ignores a posted name; Rule C at three depths and under a
  sign-in PC, a share and a held grant; the resolver against `find_scenario_object` at three
  depths; an id-less gated object never opens; the tidy keeps a passed record.
- **Done when:** your file; `lock_step_seams_test.rb` unmodified.

### Unit 13: gate and lock callers (wave 3)

- **Files:** `app/models/break_escape/lock_step_gate.rb`, `MS` (ONE line: `mfa_declared?` also
  true when any lock step of kind `code` exists), `test/models/break_escape/lock_step_gate_test.rb` (new).
- **Build:**
  - `lock_step_gate`: nil when the target has no step, is open by Rule B (a door: the room is
    unlocked), its record is `passed`, or the method is `flag_reward` and
    `flag_reward_unlocks_object?` holds. The `npc` method does NOT skip. A live unpassed record
    is answered again with no write and no row. Otherwise `issue_second_step!` into
    `lock_steps_map` under `mfa_subject_key`, with `npcId`; write `mfa_challenge`
    (`as: { npc: owner }`, `where: { kind: 'object' | 'door', id: <the found id> }`, detail
    `method`); for a door with method `npc`, `note_npc_step_grant!`; `save!`; answer section
    4.3's gate body (`number` from `second_step_numbers`, registered as an issued secret).
  - `verify_lock_code!`: target by id, gated, not open, `carried_step_reachable?` (else
    `:not_found`); the owner's `code_device` must be held (`held_code_device`), else the device
    403; then `MA#verify_second_step_code` against the device's id. `:passed` sets `passed`,
    writes `mfa_code_ok`, answers `verify_passed`. Wrong, dropped and closed as S8a writes them,
    with NO lockout counter touched.
  - `prompt_lock!`, `approve_lock!`: the same shape over `send_second_step_prompt` and
    `approve_second_step` with `reenrolled: false`; rows `mfa_prompt_sent`,
    `mfa_prompt_approved` (`approver` `owner` or `held_phone`, never `own_phone`),
    `mfa_prompt_denied`, `mfa_expired`.
  - `lock_phone_answer(npc_id, target_type, target_id)`: `:no_phone` unless that owner's phone
    is held; else the ONE request of the lock named, through
    `second_step_requests([{ kind:, map: lock_steps_map }], npc_id:)` filtered to that key, with
    the lock's display name. S8a's `mfa_phone_answer` is not changed, so a phone opened from the
    inventory lists no lock request.
  - No row holds a code, a number, a password or a first factor. No row for: a wrong first
    factor, a repeat against a live record, a stale code, a too-soon request, a 403 or 404, the
    open after a pass.
- **Tests (model level, time frozen):** every nil case; a repeat writes nothing; each kind to a
  pass; patience shared with sign-in and reset on approval; the cap; five wrong codes drop the
  record; the thirty-code closure shared with sign-in; a wrong number cancels; a passed record
  survives 300 s and a reload of the row; the rows above and the rows NOT written; the secret
  guard refuses a row holding the code or the lock's `requires`.

### Unit 14: controller (wave 3)

- **Files:** `GC`; new `app/controllers/break_escape/lock_step_requests.rb` (a module included
  in `GamesController`, holding every helper below so `GC` gains only short calls);
  `test/controllers/break_escape/lock_step_inert_test.rb` (new).
- **Build, in `GC#unlock`, in this order:**
  1. Resolve once: `resolved = @game.resolve_unlock_target(target_id)` for an object when
     `second_step_ids` is not empty (else nil: the old call, unchanged); pass `resolved:` to
     `validate_unlock`.
  2. A wrong first factor takes today's refusal byte for byte. A refusal caused by Rule C or
     Rule D returns BEFORE the `badge_swipe` denied row (`:1217`), as an invented id does.
  3. Today's checks stay. `already_open` for a gated target uses Rule B.
  4. The gate, before the transaction (`:1271`): `gate = @game.lock_step_gate(...)`;
     `return render json: gate` (200, `no-store`) when not nil.
  5. Inside the existing transaction a gated object opens through `record_step_open!`, never
     `unlock_object!`; a gated door through `unlock_room!` after deleting its record. The
     `badge_swipe` ok row is written here as today, so the first right card writes
     `mfa_challenge` and no badge row, and the final post writes one badge row.
  6. The answer uses the gate's object when `second_step_ids` is not empty.
- **`/mfa/*`:** in `mfa_verify`, `mfa_prompt`, `mfa_approve` replace the "names a target" half of
  the guard with a dispatch: exactly one of `pc_id` or (`target_type` in `object`, `door` plus
  `target_id`) must be given, else the generic 422; the lock form calls the unit 13 function
  inside `with_game_lock`. `mfa_phone` with `target_type` and `target_id` calls
  `lock_phone_answer`; without them it is unchanged. Statuses as section 4.3, all `no-store`.
- **Other exits (each refused exactly as an invented id is, and nothing written):**
  `GET /container` (plain and scope branches) and every take or inventory add from a container,
  share or sign-in desktop, for an object below a closed step (Rule C), a gated object not
  `step_object_open?`, or one that fails Rule D. The inventory copy of a gated `takeable` keeps
  `locked: true` and `secondStep` and loses `contents`. A client-built object loses
  `secondStep` (unit 16's `FORGEABLE_ITEM_FIELDS`) and gets a fresh id.
- **Tests:** on a scenario with no `secondStep`, every route answers as before (the detailed
  tables are unit 15's). **Done when:** `bin/ops-golden-compare`; every existing unlock,
  container and `mfa_*` controller test unmodified.

### Unit 15: controller tables and answer proof (wave 4)

- **Files:** `test/controllers/break_escape/lock_step_answer_shapes_test.rb`,
  `lock_step_objects_test.rb`, `lock_step_doors_test.rb`, `lock_step_carried_test.rb` (new);
  may fix `GC` and `lock_step_requests.rb`; reports anything else.
- **Build:** `lock_step_answer_shapes_test.rb` drives the real routes once per `FX` entry and
  asserts status and body equal the entry, ignoring only the keys under `varies` (whose TYPE is
  still checked). The three tables, one row each:
  - Objects: wrong first factor; right first factor (no `contents`); nothing leaves or opens
    early for a room PC, a nested archive, an archive under a sign-in PC and one in a held
    grant (no contents ids, names or text in ANY answer; the invented-id 422 for inner
    objects); twin names; each kind end to end; second post; repeat and reload; the skips
    (`flag_reward` opens; a hand-built `npc` post does not); ids only on `/mfa/*`; the phone
    lists one request and only when named; refusal order; a not-yet-released container.
  - Doors: an rfid door stays shut after the right card until approval, with `roomData` in the
    last answer only; the badge rows of step 5; the NPC grant written and deleted; a propped
    door and a flag-reward door open with no step; `npcStepOpener` in the bootstrap after a
    reload and gone once open.
  - Carried: every carried home; drop and pick up keep the request count; re-add and dedupe;
    reach after removal (an NPC's briefcase, a nested takeable); the innermost carrier; a
    client-built object; G4 plain carriers and the three shipped scenarios of unit 01 (a
    hand-built `/unlock`, `GET /container` or take is refused once the item has left the
    inventory and every open room; a give, a start item, a nested container in a held
    briefcase and a dropped item in an unlocked room still pass).
- **Done when:** all four files and `bin/ops-golden-compare` pass.

### Unit 16: reach, Rule D and G4 (wave 2)

- **Files:** `app/models/break_escape/lock_step_reach.rb`, `lib/break_escape/item_identity.rb`
  (`secondStep` appended to `FORGEABLE_ITEM_FIELDS`, on a line of its own),
  `test/models/break_escape/lock_step_reach_test.rb` (new).
- **Build:** `carried_step_ids`: the ids of every top-level carried item (unit 01's survey
  definition) that has a lock or `contents`, gated or not (this is G4; ambiguity A4).
  `carried_step_chains`: for each, the chain of carriers down to it, with the outermost
  carrier's home (`nested`, `room`, `npc`, `start`, `grant`). `carried_step_reachable?(object,
  path)`: true when nothing at or above the target is in `carried_step_ids`. Otherwise walk the
  deepest chain in two legs: (1) held or dropped, innermost first (`ItemIdentity.held_in?` by
  id; or a dropped copy in the `objects_added` of a room where `room_unlocked?` holds);
  (2) still in its authored place, decided by the outermost carrier's home (`nested` and `room`
  can be; `npc`, `start` and `grant` are false once the item has gone). Nothing is written. An
  id-less plain carrier is not covered and keeps today's behaviour.
- **Tests:** one case per home and per leg; a nested carrier inside a held briefcase; unit 01's
  survey rows, each rendered through ERB; a forged item loses `secondStep`.
- **Done when:** your files; `bin/ops-golden-compare`.

### Unit 17: door grants (wave 2)

- **Files:** `app/models/break_escape/lock_step_doors.rb`,
  `test/models/break_escape/lock_step_doors_test.rb` (new).
- **Build:** the three functions of section 4.2 over `player_state['npcStepGrants']`, keyed
  `door:<roomId>`. `clear_npc_step_grant!` never creates the key. `npc_step_opener_for` answers
  nil for an unlocked room.
- **Tests:** write, read, clear; nothing created on a scenario with no gated door; the bootstrap
  field appears and goes (through unit 04's hook).

### Unit 18: pane, frame and code (wave 2)

- **Files:** `JS/ui/lock-step-pane.js`, `public/break_escape/css/lock-step.css` (new), the one
  place stylesheets are linked (add `lock-step.css` and `lock-step-push.css`; find where
  `device-frame.css` is linked), `test/js/lock-step-pane.test.mjs` (new).
- **Build:** `openPane(ctx)` builds ONE DOM layer appended to `document.body`, above the minigame
  container and any pad: a backdrop that takes every click, the plain lock frame (2px borders,
  VT323, no rounded corners), the lock's name as title, an X. It is not a framework scene and
  never calls `startMinigame`. It stops `keydown`, `keyup` and `keypress` from leaving the layer
  (so digits typed here never reach a PIN pad beneath) and treats Escape as its own X. If no
  scene was open when it opened, it pauses the world keys (`window.pauseKeyboardInput`) and
  resumes them on close; if a scene was open, it leaves them alone. Every 400 ms (injected
  timer) it closes itself as `'closed'` when `window.playerIsKnockedOut?.()` is true or the pad
  that was open beneath it has gone.
  - Kind `code`: the line "Enter the code from <owner>'s device.", one six-digit field, Verify
    (`mfa.verify(subject, code)`). Wrong, used, expired and closed lines as the sign-in code
    pane words them. A dropped record (five wrong codes) settles `'expired'`.
  - When the player holds that owner's `code_device`: a strip "<device name>" with a button
    "Read code" that calls `mfa.readDevice({ itemId })` and shows the six digits and the seconds
    left in the strip; a second click on "Use this code" fills the field. It is never submitted
    for the player.
  - Kinds `push` and `push_number_match`: call `mountPush(host, ctx, settle)` from
    `JS/ui/lock-step-push.js` (unit 19).
  - X settles `'closed'` and sends nothing.
  - `getTestState()` on the returned handle: `{ open, kind, title, lines, fields, controls }`.
- **Tests (answers from `FX`; real `mfa-client.js` with a stubbed request function):** each
  outcome; a hostile lock or owner name renders as text; keys do not leave the layer; the device
  strip only with the right device; the world keys paused only when nothing was beneath.

### Unit 19: pane, push and phone card (wave 2)

- **Files:** `JS/ui/lock-step-push.js`, `public/break_escape/css/lock-step-push.css`,
  `test/js/lock-step-push.test.mjs` (new).
- **Build:** `mountPush(host, ctx, settle)`. "A request was sent to <owner>'s phone.", the
  two-digit number when the gate answer carried one, the count sent, and "Send again" (disabled
  for the server's `retryAfterS`). The first request is sent when the part mounts. `prompt_passed`
  settles `'passed'`; `prompt_expired` settles `'expired'`. When the player holds that owner's
  `phone_friendface`: a button "Check <owner>'s phone" that calls `mfa.lockPhone(subject, { npcId })`
  and draws, inside the pane, one card with the lock's name and Approve and Deny (number
  matching: the three numbers as buttons and Deny). A tap calls `mfa.approve`. `approve_passed`
  settles `'passed'`; `approve_cancelled` settles `'denied'`.
- **Tests (answers from `FX`):** each kind; send again and its wait; the button only with the
  right phone; approve, deny, a wrong number; the three numbers shown with none marked.

### Unit 20: `unlock-system.js`, part one (wave 2)

- **Files:** `JS/systems/unlock-system.js`, `test/js/lock-step-unlock-system.test.mjs` (new).
- **Build:** (a) `notifyServerUnlock` returns `{ success: false, secondStepCancelled: true }` for
  a cancel error (`window.lockStep?.isCancel`), and `unlockTarget` returns at once on such an
  answer: nothing marked open, no `item_unlocked`, no `door_unlocked`. (b)
  `requestRfidAccessUnlock` returns `{ outcome: 'second_step_cancelled', response }` for a cancel,
  before its `uid_only` and `denied` test; its two callers show nothing for it (the copier goes
  back to its card list; the held-keycard path passes no `refusedKeycards`). (c)
  `getLockRequirementsForDoor` copies `secondStep` and `npcStepOpener` at each of its return
  points, and `getLockRequirementsForItem` copies `secondStep`. (d) The door retry: in
  `handleUnlock`, after the requirements and the client-sees-unlocked check, a door whose
  requirements carry both `secondStep` and `npcStepOpener` posts
  `ApiClient.unlock('door', unlockTargetId(lockable, 'door'), npcStepOpener, 'npc', {}, { fromDoor: true })`
  in place of its lock-type branch. On `success`: `unlockTarget(...)` and emit
  `door_unlocked_by_npc` with `{ roomId, npcId, source: 'npc', retry: true }`. On a cancel:
  `lockStep.cancelFeedback(err)` only. Any other error: the alert the sibling branches show.
- **Tests:** answers from `FX`. Unmodified: `unlock-r1-ux.test.mjs`,
  `unlock-route-room-retry.test.mjs`, `dispense-on-unlock.test.mjs`.

### Unit 21: starters and readers (wave 2)

- **Files:** `JS/systems/minigame-starters.js`,
  `JS/minigames/biometrics/fingerprint-reader-minigame.js`,
  `JS/minigames/ble-scanner/ble-scanner-minigame.js`, `JS/minigames/rfid/rfid-minigame.js`,
  `test/js/lock-step-no-early-success.test.mjs` (new).
- **Build:** on a GATED lock (the lockable's data carries `secondStep`; read the field, import
  nothing) nothing says "opened", plays a release sound or completes a task before the final
  answer. Starters: the key and lockpick `onComplete` skip their "unlocked" toast and
  `expectContainerAfterUnlock`. Fingerprint: plays `confirm` and shows "Print accepted.", skips
  both `expectPanelWithin` calls. BLE: skips the task event and `onPairSetGlobal` on pairing and
  exports `applyBlePairEffects(scenarioData)` that does both. Card copier: a live instance gets a
  `second_step_cancelled` branch before its denial (back to the card list, no tone, no
  `card_emulated`, no denial screen); a physical read or played-back copy shows "Card read."
  rather than a success line. An UNGATED lock behaves exactly as today in all four files.
- **Tests:** one row per site, gated and ungated.

### Unit 22: doors and NPC callers (wave 2)

- **Files:** `JS/systems/doors.js`, `JS/systems/npc-game-bridge.js`,
  `JS/minigames/helpers/chat-helpers.js`,
  `JS/minigames/person-chat/person-chat-conversation.js`, `test/js/lock-step-npc-doors.test.mjs` (new).
- **Build:** `doorProperties` (both places it is built from room data) copies `secondStep` and
  `npcStepOpener`. `NPCGameBridge.unlockDoor`'s `catch` returns
  `{ success: false, secondStepCancelled: true, roomId, npcId }` for a cancel; its success path
  is unchanged, so it emits `door_unlocked_by_npc` once when the step passes inside the
  conversation path. `chat-helpers.js` (`unlock_door`) and `handleUnlockDoor`'s `catch` show
  nothing for a cancel. Export from the bridge (or reuse) the function that finds every door
  sprite for a room, for unit 24's `writeOpener`.
- **Tests:** answers from `FX`; `door_unlocked_by_npc` fires exactly once per open on each path.

### Unit 23: feature scenario (wave 3; BEFORE the client is finished)

- **Files:** `scenarios/test_ops_lock_step/` (new: `scenario.json.erb`, `mission.json`,
  `PLAYTEST.md`, `ink/`, generated `dungeon_graph.*`), `test/unit/ops_lock_step_click_paths_test.rb` (new).
- **Build:** copy the layout of `scenarios/test_ops_mfa/`. Declares `logSources` and `gameClock`.
  Rooms `office` (start), `records_room`, `plant_room`. Cast: `moira` (low awareness, approves
  when pestered, patience 3, keeps her phone), `gordon` (high awareness; his ink hands over his
  phone and, separately, the briefcase), `priya` (her ink hands over her `code_device`), `dana`
  (high awareness, `koImmune: true`, phone in `itemsHeld`, no give). Locks:

  | Id | Where | Lock | Second step |
  |---|---|---|---|
  | `moira_pc` | `office`, a plain `pc` with `contents` | `password` | `push`, moira |
  | `audit_zip` | inside `moira_pc` | `password` | `push_number_match`, gordon |
  | `moira_locker` | `office` | `pin` | `push`, moira |
  | `priya_safe` | `office` | `pin` | `code`, priya |
  | `dana_cabinet` | `office`, off the critical path | `password` | `push_number_match`, dana (never passes: validator warning, dashed edge) |
  | `records_room` | door from `office` | `rfid` (card in `office`) | `push`, moira |
  | `plant_room` | door from `office` | `key`, no key in the scenario; in gordon's `unlockable`, opened by his ink `#unlock_door` | `push`, moira |
  | `gordon_briefcase` | gordon's `itemsHeld`, `droppable: true`, holds `board_minutes` | `pin` | `push`, gordon |
  | `courier_box` | `office`, `"locked": false`, `triggerOnInteract` runs `remove_item` on the briefcase by id | none | none |

  Every password and PIN is on a readable note in `office`. Every container-like object is of a
  clickable type and has either a real lock or `"locked": false`. Any new `eventMappings` entry
  goes last. `PLAYTEST.md` holds section 7's beats with their click paths and expected results,
  and lists the validator warnings that are expected.
- **Tests:** the click-path test renders the scenario and asserts, for every row above: the
  object or door exists, is reachable from the start room through doors a beat opens, has a
  clickable type, is `locked: true` with a `lockType` or `locked: false`, and its first factor is
  written on a note; each item an ink hands over is offered in that ink; no gated object is
  nested where the validator forbids.
- **Done when:** your test; `ruby scripts/validate_scenario.rb` on the scenario shows only the
  listed warnings; `ruby tools/check_mapping_index_drift.rb`; the graph is generated.

### Unit 24: wiring and test bridge (wave 3)

- **Files:** the game's entry module (the one that sets `window.ApiClient`; say which),
  `JS/systems/test-bridge/lock-step.js` (new), `JS/systems/test-bridge/index.js` (one import, one
  line), `test/js/lock-step-wiring.test.mjs`, `test/js/test-bridge-lock-step.test.mjs` (new), and
  every harness copy list that copies a file you add an import to (list each).
- **Build:** import `lock-step.js` and `lock-step-pane.js`, `configure` (`mfa: window.mfaClient`;
  `post` and the timestamp from `ApiClient` and `stateSync`; `isClear`: no live minigame, no
  `window.pendingConversationReturn`, no `gameConfirmOpen`, not knocked out; `writeOpener`: sets
  `gameScenario.rooms[id].npcStepOpener` and the field on every door sprite of that room;
  `toast`, `rejectTone` from the notification and sound helpers), and set `window.lockStep`.
  Bridge: `__test.lockStep.state()`, `.click(label)`, `.type(text)`, `.close()` over the pane's
  `getTestState()`.
- **Done when:** your tests; every harness you touched; `playtest-shellx-open-wait.test.mjs`
  unmodified and green (no scene was added).

### Unit 25: `unlock-system.js`, part two (wave 3)

- **Files:** `JS/systems/unlock-system.js`, `test/js/lock-step-late-success.test.mjs` (new).
- **Build:** the other half of unit 21. On a gated lock, after `success: true`: the key and
  lockpick callbacks raise the toast and `expectContainerAfterUnlock` the starters skipped; the
  biometric callback shows the "unlocked" toast; the BLE callback calls `applyBlePairEffects`;
  the Bluetooth alert moves after a `success` test; the rfid clone and direct-card branches gain
  a `success` test before `door_release` and the alert. Ungated: unchanged.
- **Tests:** one row per site, answers from `FX`; a cancel at each site shows nothing but the
  cancel rule.

### Unit 26: scenario tests (wave 4)

- **Files:** `test/controllers/break_escape/ops_lock_step_scenario_test.rb`,
  `ops_lock_step_no_exposure_test.rb` (new).
- **Build:** the first plays every beat of `PLAYTEST.md` through the real routes on the real
  scenario, one test per beat, time frozen, judged by the server record. The second collects
  EVERY answer of a full run and asserts none holds a password, a PIN, a code outside
  `mfa/device`, a right-number mark, the four state keys, or a gated object's contents before its
  pass. Expose the collected answers through one helper that unit 28 can call.

### Unit 27: client real-flow tests (wave 4)

- **Files:** `test/js/lock-step-real-flow.test.mjs`, `test/js/lock-step-carried.test.mjs` (new).
- **Build:** the real `api-client.js`, `lock-step.js`, pane, `mfa-client.js` and PIN pad together,
  with only the network stubbed from `FX`: a PIN pad posts, the pane opens over it, the code
  passes, the pad receives one ordinary success and completes once. The same for a cancel. A
  gated item clicked in the inventory runs its pad and then the pane.

### Unit 28: scanner real answers and `verify-run` (wave 5)

- **Files:** `test/controllers/break_escape/access_leak_scanner_lock_step_real_test.rb` (new),
  `tools/playtest/verify-run.rb` (one block), and fixes to `lock_step_leak_rules.rb`.
- **Build:** scan the REAL answers unit 26's helper collects: nothing reported. Then doctor those
  real answers once per rule: each reported. A fix may only ADD or tighten a rule; if the clean
  run reports something, that is a server finding to report, not a rule to relax.

### Unit 29: docs (wave 5)

- **Files:** `README_scenario_design.md` (row A25), `docs/ACCESS_AND_NETWORKS.md` (an A25 section).
- **Build:** the field, the three kinds, where it may sit, what never passes, what is best
  effort (the four re-add routes; an id-less plain carrier), and the limits of section 6.

## 6. Ambiguities and open questions

| # | Question | Built as (recommended) | If the owner chooses otherwise |
|---|---|---|---|
| A1 | The plan opens the pane as the `password` scene over other pads "as a child". The framework holds one scene, so the pad would end and lose the answer it awaits | A DOM layer of its own over whatever is open. Every caller receives one ordinary answer, and S8b's `password-minigame.js` is untouched | Replace units 18, 19 and 27 with a `secondStepOnly` mode in `password-minigame.js`; every pad then needs a "resume after child" path and unit 20 a late-open path for each lock type. About six more units, and a merge with S8b in that file |
| A2 | Phone and device as child scenes | Inline in the pane: a code strip and one request card | Units 18 and 19 open `authenticator-live` and `code-device` with `returnTo`; needs A1's alternative first, and the pinned overlay list is rechecked |
| A3 | `MfaModel` and `mfa-client.js` "gain" the lock functions | New files (`lock_step_model.rb`, `lock-step.js`, four concerns) | Move the functions after S8b lands; names stay |
| A4 | G4 changes what a HAND-BUILT request reaches for plain carried containers in `test_unlock_gaps`, `ceo_exfil`, `test_social_m5_channels` | Built, as the plan says; unit 01 pins the legitimate flows first | `carried_step_ids` lists only carriers on a chain that holds a gated object: a one-predicate change in unit 16, and the G4 rows of unit 15 go |
| A5 | The plan's validator refuses rooms "until G2" and carried items "until G3" | The stage lands whole, so those errors are not built | Nothing, unless the stage is split when landing |
| A6 | One gated door for both the card beat and the NPC beats | Two doors: `records_room` (card) and `plant_room` (NPC-opened; the validator's "named in `unlockable`" warning is expected there) | One door and two fresh games in the playtest |
| A7 | How the two state keys are declared | In `ACCESS_STATE_DEFAULTS`, on their own last line; lazy accessors if a golden moves | Lazy accessors always, plus one line in `reset_player_state!` |
| A8 | Log rows for a lock | The eight `mfa_*` events widened to `object` and `door`; `mfa_challenge` gains `method` | Eight new `lock_step_*` events in unit 05 and renamed rows in unit 13 |
| A9 | `dana_cabinet` "expires" in the plan's beat B10 | Not played by clicks (twenty requests two seconds apart); the Rails scenario test covers it, and the scripted run checks the validator warning and the dashed edge | Add a beat that presses "Send again" to the cap |
| A10 | A re-enrolled owner (S8b) | A lock always passes `reenrolled: false`: an owner's own-phone reset never approves a lock | After S8b merges, add one controller row proving it; no code change expected |
| A11 | Wrong-code count shown to the player | No count is sent for a lock (it has no lockout) | Add `triesLeft` to `verify_wrong` in `FX`, unit 13 and unit 18 |

Known limits, accepted: a locked object's own `text`, `observations` and `tableItems` ship before
the step, as today (the validator warns). A propped door skips the step. The four re-add routes
can put a gone item back; the step itself is never skipped.

## 7. Playtest outline

A scripted browser player on `test_ops_lock_step`, through `window.__test`, one fresh game unless
a beat says otherwise. Judge each beat by the server record, not by a client event. No beat sends
a hand-built request: those checks are Rails tests (unit 15).

| Beat | Click path | Expect |
|---|---|---|
| 1 Wrong password | click `moira_pc`; type a wrong password in the password pad; Enter | today's refusal; no pane |
| 2 Pane (push) | click `moira_pc`; type the password from `note_moira`; Enter | the pane opens over the pad titled with the PC's name: "A request was sent to Moira's phone.", count 1; nothing inside the PC is listed |
| 3 Pestered owner | in that pane click "Send again" twice (waiting out the button's delay) | third request approves; pane closes; the PC opens and lists `audit_zip` |
| 4 Pane (number), no phone | click `audit_zip` in the open PC; type its password; Enter | the pane shows a two-digit number and no "Check phone" button; click X: no reject sound, no line |
| 5 Reload | reload the page; click `moira_pc` (open), `audit_zip`, type the password | the same number as beat 4 |
| 6 Wrong number | X; talk to `gordon`, choose the line that hands over his phone; click `moira_pc`, `audit_zip`, password; in the pane click "Check Gordon's phone"; click a number that is not the one shown | "Not approved." once with the reject tone; pane closes; archive still shut |
| 7 Right number | `audit_zip`, password, "Check Gordon's phone", click the number shown | pane closes; the archive's files are listed |
| 8 Code | talk to `priya`, choose the line that hands over her device; click `priya_safe`; type the PIN from `note_priya`; in the pane click "Read code", then "Use this code", then Verify | the safe opens; one `mfa_code_ok` row at `priya_safe` |
| 9 Close and reopen | click `moira_locker`; type its PIN; click X on the pane; click `moira_locker` again, PIN again; "Send again" until approved | X is silent; the second pane is the same request (count continues); approval opens the locker |
| 10 Never passes | none in the browser | `validate_scenario.rb` warns for `dana_cabinet`; the graph draws its edge dashed |
| 11 Card door | pick up the keycard in `office`; click the door to `records_room` | the pane opens alone (no pad): push to Moira; "Send again" until approved; only then does the door open and the room load |
| 12a NPC door | talk to `gordon`, choose the line that opens the plant room; finish the chat | the toast "Second step pending. It opens when you finish here." during the chat; the pane opens only after the chat has closed |
| 12b Walk away | click X on that pane | silent; door shut |
| 12c Retry at the door | click the door to `plant_room` | the pane reopens with no conversation and no key prompt |
| 12d Reload | reload; click the door to `plant_room` | the pane again (the opener came from the bootstrap) |
| 12e Approve | "Send again" until approved | the door opens; `door_unlocked_by_npc` fired exactly once, with `retry: true` |
| 13a Carried | talk to `gordon`, choose the line that hands over the briefcase | `gordon_briefcase` in the inventory, locked |
| 13b First factor | click the briefcase in the inventory tray; type its PIN | the pane: one request to Gordon's phone |
| 13c Drop and pick up | X; drop the briefcase from its inventory menu; click it on the floor to pick it up; click it in the tray; PIN | the request count carries on from 13b |
| 13d Approve | "Check Gordon's phone"; Approve | the briefcase opens and lists `board_minutes` |
| 13e Removal (fresh game) | 13a, then click `courier_box` | the briefcase leaves the inventory; nothing in the tray or the room opens it |

Live proof after the scripted run: beats 2, 3, 6, 7, 8, 9, 11, 12a to 12e and 13a to 13d with a
screenshot of each form of the pane (push, number, code with the device strip, the phone card,
alone over a door, over a PIN pad), then `tools/playtest/access-leak-check.rb` on the capture.

## 8. Landing

The stage lands only after `main` is merged INTO `ops-lock2` (merge, never rebase) and the merged
tree passes the full train: every Rails file under the shared lock, every node test,
`bin/ops-golden-compare`, the validator snapshot and the mapping drift check. S8b will be on
`main` by then or soon after: expect "keep both" merges at the hooks of units 04, 05, 06, 11, 13
and 14, re-check the pinned overlay list count, and add ambiguity A10's row.
