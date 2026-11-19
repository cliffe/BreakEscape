# Ops layer: a second step on any lock (A25)

Stages L1 and L2. Needs stages M1b to M3 of `OPS_MFA_HELPDESK_PLAN.md` (the "MFA plan") and the
helper of `OPS_LOG_ROWS_PLAN.md` (the "log plan"). Code pointers are `file:line` in this
worktree; `game.rb` is `app/models/break_escape/game.rb`, `games_controller.rb` is
`app/controllers/break_escape/games_controller.rb`, JS paths are under
`public/break_escape/js/`.

## 1. What this adds and why, in play

A lock can carry a second step as an attribute of the thing it guards. After the lock's own
check passes (the right password, PIN, card, key), the lock asks its owner before it opens.
The step is the one sign-in uses in the MFA plan, with the same three kinds: `push` (a request
to the owner's phone), `push_number_match` (the same, with a two digit number to pick on the
phone) and `code` (six digits from the owner's code device).

**A locked PC.** The player walks up to Moira's PC and types the password from the note under
her keyboard. The screen does not open. It says a request has gone to Moira's phone and offers
"Send again". Moira is careless: after the third request she taps Approve to make it stop, and
the PC opens. A careful owner never approves, however often the player asks.

**An encrypted archive.** On that PC's desktop is `audit_2024.zip`. The player types its
password and the archive shows a two digit number and says Gordon must pick it on his phone.
Gordon cannot see the player's screen, so pestering does nothing. The file names and their text
stay on the server the whole time.

**Holding the owner's phone.** If the player has Gordon's phone (handed over in his story, or
picked up after a knock-out), the pane gains a "Check phone" button. The phone opens over the
pane and shows the request for this archive with three numbers; the player picks the one the
archive showed and it opens. A wrong pick cancels the request and costs the password again.
For a `code` lock the player opens the owner's code device from the pane and types the code
showing now.

What it teaches: a second step can guard one object as well as a sign-in; it is only as good
as the person or the device holding it; number matching removes the fatigue route; taking the
device defeats every kind.

Rules this plan keeps: every grant is a server decision from server-held state; nothing behind
the lock reaches the browser before both checks; no rolls (an owner approves on a count); the
kind and the owner are public, what satisfies the step is not.

## 2. What the code does today (verified)

**Opening an object.** `POST /unlock` (`games_controller.rb:1211-1335`) calls
`validate_unlock` (`game.rb:4597`), and on a refusal answers 403 or 422 before any write
(`:1228-1253`). On success it runs the released-flag check, the rfid card answer and the
route-room refusal (`:1256-1279`), then inside a transaction calls
`unlock_object!(target_id)` with **the string the browser posted** (`:1315`) and answers
`{ success: true, type: 'object', hasContents, contents }` (`:1317-1330`).
`unlock_object!` appends that string to `player_state['unlockedObjects']` and is the only
writer of the list (`game.rb:691-695`; `:7523` only initialises it).

**Finding an object.** `find_scenario_object` matches an id, a **name** or the client's
generated id `<room>_<type>_<index>`, first match in walk order, through rooms, nested
`contents`, account profiles, share items, held declared grants, held USB sticks, released
NPC containers and start items (`game.rb:4867-4915`, `:5025-5035`).

**Where a locked object's contents are withheld, and how "open" is tested today.**

| Place | Test for "open" | Pointer |
|---|---|---|
| Room payload: a top-level room object is marked `locked: false`, and the filter then keeps its `contents` | the list holds its id, its **name** or its generated id | `game.rb:2999-3010`, `:7226-7232` |
| `GET /container`, plain container | the list holds the **posted string** or the found object's id; the finder matches id or name | `games_controller.rb:3119-3126`, `:3036-3038` |
| `GET /container` under a sign-in PC, a profile or a share | `path_unlocked?`: id only | `:641-669`, `game.rb:3310-3313` |
| Taking an item out of a container | the list holds the container's `id`, **or its name when it has no id** | `games_controller.rb:3424-3430`, `:3664` |
| The inventory copy of a taken locked item | id only, then the same filter | `:3329-3332` |
| A nested locked container inside any payload | never marked open; its `contents` are always removed and fetched by `GET /container` | `game.rb:7226-7232` |

So a plain lock named "Office PC" that the player opens puts "Office PC" in the list, and the
next room load ships the contents of a different object with that name. This is an old gap
for every lock; a second step must not inherit it.

**Opening a door.** A door's lock is on the room it leads into. The schema says lock fields
on a `doors[]` entry are never read (`scripts/scenario-schema.json:4173`), and
`validate_unlock` reads `room_data(target_id)` (`game.rb:4607-4613`). The bootstrap ships an
allowlist of room fields for the door pad (`game.rb:2425-2427`). Rooms open through
`unlock_room!` (`game.rb:135`), called by `serve_opened_room` (`games_controller.rb:2930`),
`promote_route_room!` (`game.rb:475`) and a flag reward (`games_controller.rb:4020`).
`GET /room` serves a room only when it is the start room, a world room, in `unlockedRooms`
or a route room (`:568-582`).

**NPC and reward unlocks.** `method: "npc"` is a browser claim: for an object the server
checks only that the NPC was met and lists the target in `unlockable` (`game.rb:5051-5077`);
for a door an `unlockDoor` mapping needs no meeting at all (`:5041-5048`). Nothing records
that a conversation reached the unlock. `method: "flag_reward"` is a server record: it reads
`flag_rewards_claimed`, which the server writes (`game.rb:4539-4574`).

**The client.** The `password` pad treats a 200 answer with `success: false` as a wrong
password and counts an attempt (`minigames/password/password-minigame.js:1395-1408`). The
`pin`, `combination` and `cryptex` pads return `response.success`, so they count one too
(`minigames/pin/pin-minigame.js:699-710`). `requestRfidAccessUnlock` posts directly and
reports it as `denied` (`systems/unlock-system.js:177-179`). Every caller of
`notifyServerUnlock` (key, lockpick, biometric, bluetooth, ble, two rfid paths:
`unlock-system.js:1120`, `:1158`, `:1299`, `:1339`, `:1376`, `:1478`, `:1526`,
`systems/doors.js:699`) passes the answer straight to `unlockTarget` **without testing
`success`**, and `unlockTarget` marks the lock open in the browser and emits `item_unlocked`
or `door_unlocked` (`unlock-system.js:1696-1745`). So an unhandled second-step answer would
show those locks as open, with nothing behind them, and fire the events tasks listen for.
NPC door posts are at `systems/npc-game-bridge.js:108` and
`minigames/person-chat/person-chat-conversation.js:464`.

**An archive.** `zip_archive` is a type name and a sprite. No server, client or schema code
names it; it works because any object with `contents` is a container, and a locked nested
container hands over to the lock path (`minigames/container/container-minigame.js:2302-2304`).
`scenarios/test_access_signin/scenario.json.erb:78-97` has one with a `password` lock under a
sign-in PC, opened through `/unlock` and read through `GET /container`. The archive example in
this plan needs no new type. A locked object's own `text` and `observations` ship today;
only `contents` are withheld.

**A declared grant.** Its `contents` are removed from every payload
(`DeclaredGrants.strip_all_grant_contents!`, `game.rb:7176`; the take route,
`games_controller.rb:3323-3326`) and served from the held item by two routes only: the
`/unlock` answer (`:3070-3073`) and `GET /container` (`:3014-3016`), both of which test
`unlockedObjects`. No third route was found.

**Not built.** No second step on any lock, and no server count of `/unlock` attempts
(`docs/agents/ops_layer/digests/D6_locks_unlock_paths.md`, "Not found"). The unused
`minigames/dual-auth/` scene is registered nowhere and posts a method the server refuses;
this plan leaves it alone.

**From the MFA plan** (its sections "Shared model", "Server", "Server routes", "Client",
"State and saved games"): `MfaModel` (kinds, `numbers`, `code_state`, the prompt habit and
patience, the time constants); the `MfaAccess` functions that take an owner and a subject
(issue a challenge, send a prompt, verify a code, verify an approval, count a wrong attempt,
write the log row); the `/mfa/device`, `/mfa/verify`, `/mfa/prompt`, `/mfa/phone` and
`/mfa/approve` routes; the second pane of the `password` scene; the `authenticator-live` and
`code-device` scenes; the state keys `mfaPrompts` and `mfaAccounts`; the wrong-code closure
(five wrong codes end an attempt, thirty for one owner close that owner's code step for five
minutes). This plan is their second caller and changes none of their rules.

## 3. Build stages in order

| Stage | Adds | Done when | Size |
|---|---|---|---|
| L1 | `secondStep` on a locked object with a `password` or `pin` lock (a plain PC, a safe, an archive), all three kinds; the id-keyed gate and the single "is it open" test; `lockSteps`; the lock form of the `/mfa/*` routes; the pane for a lock; schema, validator, graph, `test_ops_lock_step` | A player types an archive's right password, gets no contents by any route, has the owner's phone approve, and only then sees the files | M |
| L2 | `secondStep` on a room (a door), and on `key`, `rfid`, `combination`, `cryptex`, `biometric`, `bluetooth` and `ble` locks, push kinds only; the door-opener rules of 5.3; every remaining pad and `notifyServerUnlock` caller | An rfid door stays shut after the right card until the request is approved, and `roomData` is in the last answer only | S |

Not planned: a step on a `flag` lock (the unlock submits to Hacktivity and is undone on an
error), on a `login` PC (its policy owns that step, MFA plan), and on lock types that never
open through `/unlock` (`ransomware_display`, `infusion_pump`, `backup_recovery`,
`network_architecture`, `alarm_panel`).

## 4. Scenario fields

**L1.**

```json
{ "type": "pc", "id": "moira_pc", "name": "Moira's PC", "locked": true,
  "lockType": "password", "requires": "…", "owner": "moira",
  "secondStep": { "kind": "push" },
  "contents": [
    { "type": "zip_archive", "id": "audit_zip", "name": "audit_2024.zip", "locked": true,
      "lockType": "password", "requires": "…",
      "secondStep": { "kind": "push_number_match", "owner": "gordon" },
      "contents": [{ "type": "text_file", "id": "audit_notes", "name": "notes.txt", "text": "…" }] }
  ] }
```

**L2.** The attribute sits on the room, beside the room's `lockType`:

```json
"records_room": { "type": "room_office", "locked": true, "lockType": "rfid",
  "requires": ["records_card"], "secondStep": { "kind": "push", "owner": "moira" } }
```

| Field | Values | Meaning |
|---|---|---|
| `secondStep` | object | After the lock's own check passes, the lock asks its owner before it opens. Absent: the lock is exactly as today |
| `secondStep.kind` | `"push"`, `"push_number_match"`, `"code"` | As the policy kinds of the MFA plan, without `none` |
| `secondStep.owner` | NPC id | Whose phone gets the request, or whose code device gives the code. May be left out on an object whose `owner` is one NPC id; required on a room, and on an object with no `owner` or several |

**Where it may sit.** L1: a room object or a `contents` entry at any depth (in a plain
container, under a sign-in PC, in a profile, a share, a held declared grant or a container an
NPC carries), with `locked: true`, an `id`, and `lockType` `password` or `pin`. Not on a
top-level item the player can carry (an NPC's `itemsHeld` entry, a start item, a `takeable`
object): open question 7. L2: a room with `locked: true`. Never a `doors[]` entry.

**Kinds per lock type** (open question 3).

| Lock type | Kinds | Stage |
|---|---|---|
| `password`, `pin` on an object | all three | L1 |
| `password`, `pin` on a room | all three | L2 |
| `key`, `rfid`, `combination`, `cryptex`, `biometric`, `bluetooth`, `ble`, on an object or a room | `push`, `push_number_match` | L2 |

The owner needs a `phone_friendface` item for a push kind or a `code_device` for `code`, and
may set the habits `approvesPrompts` and `promptPatience`, all as in the MFA plan. The owner
needs no `creds`: a safe's owner can approve a request without being an account. Anything meant
to be read only after the step goes in the lock's `contents`. The owner's spoken reactions (a
grumble when the phone buzzes again) are barks or ink in the scenario, mapped to the events of
5.4; the engine holds no spoken line.

## 5. Engine behaviour

### 5.1 Model

`MfaModel` gains `LOCK_KINDS = %w[push push_number_match code]`, `CODE_LOCK_TYPES = %w[password
pin]`, `PUSH_LOCK_TYPES` (those two plus `key rfid combination cryptex biometric bluetooth
ble`) and `lock_step(lockable)`: `{ kind:, owner: }` from a valid `secondStep` on something
with `locked: true`, the owner falling back to a single `owner` id; else nil. The validator,
the graph and the server all read the attribute through it.

### 5.2 Server: one gate, keyed on the object's id

`Game#second_step_ids` is the set of ids of objects that carry a valid `secondStep`, built once
per instance by the walk `find_scenario_object` uses. It is empty in a scenario without the
attribute, and every rule below is then inactive. A `secondStep` object with no `id` is never
opened and logs a server warning (the validator refuses it first).

**Rule A, one writer.** A string in `second_step_ids` enters `unlockedObjects` only through
`Game#record_step_open!(object)`, which writes the object's `id` and raises unless the step is
cleared (below). `unlock_object!` refuses to write a string in the set; the controller calls
`record_step_open!` for a `secondStep` object in place of `unlock_object!(target_id)`. So if a
plain object's name equals a `secondStep` object's id, opening the plain one answers the
generic 422 and writes nothing. A spec greps that nothing else appends to the list.

**Rule B, one reader.** `Game#step_object_open?(object)` is `unlockedObjects.include?(object['id'])`.
For a `secondStep` object every "is it open" test of section 2 uses it, and never the posted
string, the name or the generated id. Each place contents can leave the server:

| Exit | Change | Why it passes the gate |
|---|---|---|
| `/unlock` answer (`contents`) | reached only after the gate; resolves the object once and uses that object for the gate, the write and the contents | the id is written by Rule A in the same request |
| Room payload marker (`game.rb:2999-3010`) | a `secondStep` object is matched by id only | Rule B |
| `GET /container`, plain (`check_container_unlocked`) | a `secondStep` object is tested by its id only | Rule B |
| `GET /container`, scope branches (`path_unlocked?`) | none: id only today | Rule B already |
| Taking an item out of a container (`:3424-3430`) | the container is resolved and, if it carries `secondStep`, tested by id | Rule B |
| Inventory copy of a locked item (`:3329`) | none: id only today; top-level carried items may not carry the attribute | Rule B already |
| A nested locked container in any payload, an NPC-held or declared-grant item | none: `contents` are always removed, and served only by the first and third rows | those rows |
| `validate_unlock`'s "already open" shortcut (`game.rb:4696`) | the gate does its own test by id, so a posted alias that is in the list still meets the gate | Rule B |
| Room payload for a door (L2) | 5.3 | `unlockedRooms` writers listed there |

The object's own `text` and `observations` are not behind the gate, as today.

**The order in `GamesController#unlock`.**

1. **The first factor, as today.** `validate_unlock` runs unchanged. A wrong first factor takes
   today's refusal branch and answers byte for byte as today, so a wrong guess learns nothing
   about the attribute.
2. Today's checks after a valid attempt (released flag, rfid card answer, route room) stay.
3. **The gate**, new, before the transaction. The controller resolves the target once
   (`find_scenario_object`, or `room_data` for a door). The gate does nothing, and the action
   carries on as today, when the target has no `secondStep`, when it is already open by
   Rule B (`room_unlocked?` for a door), when the method is `flag_reward`, or when the lock's
   record is marked `passed`. **The `npc` method does not skip it**: the browser asserts that
   method, so an NPC's `unlockable` or `unlockDoor` stands in for the first factor only (open
   question 1). Otherwise:
   - a live record that has not passed is answered again from the record, with no write and
     no log row (so repeating the first factor, or reloading, costs no save and cannot reset
     the request count);
   - else the shared challenge function writes a new record, adds 1 to
     `mfaAccounts[owner].started`, writes `mfa_challenge` and saves.
   The answer is 200 `{ success: false, secondStep: true, kind, targetType, targetId, npcId,
   number?, ownPhone? }`, with `targetId` the object's id. Nothing is unlocked and the answer
   carries no `contents` and no `roomData`.
4. **The step** runs on the `/mfa/*` routes with the lock as subject (section 6). A pass sets
   `passed` on the record and answers `{ success: true, stepPassed: true }`, with no contents.
5. **The first factor again.** The client repeats its `/unlock` post without asking. Step 1
   judges it afresh, the gate finds `passed`, `record_step_open!` opens the lock inside the
   existing transaction, the answer is today's, and the record is deleted.

The step cannot be taken first: only the gate writes a record, and the gate runs only after a
valid first factor. A pass is spent by the open, and an open lock stays open, so nothing is
reused. The `secondStep` answer confirms the first factor, as a real second prompt does, and
carries nothing else the player has not earned; for `biometric`, `bluetooth` and `ble`, whose
first factor the server takes on trust today (`game.rb:4652-4657`), the step is the part the
server enforces. Sending the first factor twice means reach is judged at the moment of
opening (`unlock_scope_refused?`, the route-room test), so the `/mfa/*` routes need no reach
check of their own for a lock.

**What a subject supplies.** The shared functions take `{ kind: 'object' | 'door', id: }`.

| | Sign-in (MFA plan) | A lock |
|---|---|---|
| Record | `mfaPending[pcId]` | `lockSteps["object\|<id>"]` or `["door\|<roomId>"]`, the same fields plus `'passed'?` |
| A wrong code adds to | `tries`, `mfaAccounts[owner].wrong`, the account's lockout key | `tries` and `mfaAccounts[owner].wrong` only |
| A pass | writes the session | sets `passed` |

Shared and unchanged: the record's five-minute life, the gap between requests and the cap on
them, the owner's patience count `mfaPrompts[npcId]` (worn down by sign-in and lock requests
alike), the held-device and held-phone tests, the once-per-window code rule, the numbers (the
subject key takes the PC id's place), and re-enrolment onto the player's own phone. No lock
can be stranded by its counts: five wrong codes drop the record, which costs the first factor
again, and the thirty-code closure lifts after five minutes.

### 5.3 Doors (L2)

`lock_step` is read from the room. L2 adds `secondStep` to the bootstrap room allowlist
(`game.rb:2425-2427`) so a door pad knows the kind before its room loads. Ways a door opens,
and whether each meets the step (open question 2):

| Opener | Path | Meets the step? |
|---|---|---|
| The lock's own credential | `/unlock`, `serve_opened_room` (`games_controller.rb:1298`) | Yes, at the gate |
| An NPC's `unlockDoor` mapping or `unlockable` | `/unlock` with `method: "npc"` (`game.rb:4623-4626`) | Yes: the browser asserts it. The NPC stands in for the first factor |
| A flag reward | `process_door_unlock_reward` (`games_controller.rb:4011-4020`) | No: the server's own record of a claimed flag |
| A propped door | a finished `prop_door` workaround (`games_controller.rb:1702`) | No: the door is held open, so its reader is never asked; the server decides the workaround |
| A split gated door: NPC slip-in, promotion by pass, promotion by credential | `record_npc_route_room!`, `promote_route_room!` (`game.rb:475`), `/unlock` | Not allowed together in L2: the validator refuses `secondStep` on a room whose doorway carries a `gate` |
| Already open, the start room, a room with `locked: false` | none | Not asked |

The two "No" rows call `unlock_room!` directly and are left as they are; a controller test
pins each. `unlock_room!` has no other caller.

### 5.4 Client

No new scene and no new module.

- `utils/lock-scope-refusal.js` gains `secondStepDue(response)`. Each poster tests it before
  its failure branch and before `unlockTarget`, so a step that is due is not counted against
  the pad's `maxAttempts`, plays no reject sound, marks nothing open and emits no
  `item_unlocked`. L1: the `password` and `pin` pads and the object unlock in
  `minigames/helpers/chat-helpers.js` (the NPC route). L2: `combination`, `cryptex`,
  `requestRfidAccessUnlock` (`unlock-system.js:177`), every `notifyServerUnlock` caller listed
  in section 2, and the two NPC door posts.
- `MfaClient` (MFA plan, "Client") keys its notes by subject. For a lock it holds, in memory
  only, the first factor just sent, and `finishLock(subject)` posts it again and hands the
  answer to `unlockTarget` as the pad would have.
- **The pane** is the second pane of the `password` scene. A `password` lock swaps to it in
  place. Every other pad closes quietly and the scene opens with `secondStepOnly: true`: the
  pane alone under the lock's name, in the monitor frame for a `pc` and the plain lock frame
  otherwise, VT323 text, 2px borders. X closes it and leaves the record to expire.
- **The phone and the device** are the MFA plan's scenes, opened only from the pane ("Check
  phone", "Use device") as its children. `authenticator-live` draws the one request for this
  lock as a card with the lock's name and the owner's headshot. **A held phone opened from
  the inventory lists no lock request**: a pending lock request is approved only from the
  pane the unlock attempt opened, by the owner or by the player on the owner's phone while
  that pane is up (open question 4).
- **After a reload or a closed pane** the memory is gone. The player gives the first factor
  again: a `passed` record opens the lock at once, a live one reopens the same pane with the
  same number, an expired one starts a new challenge.
- Events `mfa_required`, `mfa_prompt_sent`, `mfa_approved` and `mfa_failed` carry `targetType`
  and `targetId` in place of `pcId`, so a scenario maps the owner's bark the same way.

## 6. Server routes

No new route. `POST /unlock` keeps its parameters and gains the one 200 answer of 5.2.

The `/mfa/*` routes (MFA plan, "Server routes") take a lock where they take a PC:
`target_type` (`object` or `door`) with `target_id` in place of `pc_id`. A request naming
both a PC and a lock, or neither, is the generic 422. With a lock as subject, in order:

| Route | Checks | Answer |
|---|---|---|
| all four below | the target resolves, carries `secondStep` and is not open (else 404); `lockSteps` holds a live record that has not passed, of the right kind (else generic 422). No route re-judge and no lockout | |
| `POST /mfa/verify` (`code`) | owner's code step not closed (422 `codeLocked`, `retryIn`); six digits; `MfaModel.code_state` | Stale: 422, no write. Wrong: `tries` and `mfaAccounts[owner].wrong` move, 422 `mfaIncorrect: true`; the fifth drops the record and adds `expired: true`. Right: `passed` set, `{ success: true, stepPassed: true, targetType, targetId }` |
| `POST /mfa/prompt` | gap since the last request (422 `tooSoon`); under the cap (else record dropped, 422 `expired`) | The owner's decision as for sign-in. Not approved: `{ success: false, approved: false, promptsSent, waiting? }`. Approved: `mfaPrompts[owner] = 0`, `passed` set, the pass answer plus `approvedBy: "owner"` |
| `GET /mfa/phone` | `npc_id` is the lock's owner and that phone is held (else 403 `no such phone`) | No write. `{ requests: [ { targetType, targetId, name, n, numbers? } ] }` with that one lock's request, or an empty list. It never lists lock requests without a named lock |
| `POST /mfa/approve` | the owner's phone is held, or the owner is re-enrolled onto the player's phone (else 403) | `deny`, or a wrong or missing number: record dropped, `{ success: false, cancelled: true }`. Right: `passed` set, the pass answer plus `approvedBy: "player"` |

`GET /mfa/device` is unchanged, except that it also answers when no policy declares a kind
but a lock carries `kind: "code"` (request 2). All are inside the game lock, `no-store`, and
use the policy methods the MFA plan adds.

## 7. What reaches the browser, and what never does

| Thing | Reaches the browser | Never |
|---|---|---|
| `secondStep` (`kind`, `owner`) | With the object as authored; for a room, in the bootstrap door fields (L2). Public, as `owner` is today | |
| That the first factor was right | The `secondStep` answer, only after a right first factor | Any hint on a wrong one |
| `number` (number matching) | In that answer: it is the player's own screen | Which of the phone's three numbers is right |
| A code | Only from `GET /mfa/device` while the device is held | In any other answer |
| `contents`, `roomData` | Only in the `/unlock` answer after both checks, and by the exits of 5.2 after it | Before the object's id (or the room) is recorded open |
| `lockSteps`, `mfaPrompts`, `mfaAccounts` | Only the changed value in an answer (`promptsSent`, `approved`) | The maps, the owner's patience, the habit |

## 8. State and saved games

One server-owned key joins `ACCESS_STATE_DEFAULTS` beside the MFA plan's five, as a flat
top-level `{}`:

| Key | Shape | Bound | Sent |
|---|---|---|---|
| `lockSteps` | `{ "object\|<id>" or "door\|<roomId>" => record }`; the record is the MFA plan's pending record plus `'passed'?` | One record per `secondStep` lock in the scenario. Unpassed records past five minutes are dropped on every read and write of the map; a passed one is deleted by the open | Never. It is not read from a sync body |

`mfaPrompts` and `mfaAccounts` gain entries for lock owners who are not accounts: one per
owner. `unlockedObjects` grows by one id per opened lock, as today. Nothing is added to synced
state and no synced value grows; answers carry single changed values. **Reload:** 5.4.
**Old games:** a saved scenario without the attribute has an empty `second_step_ids`, so the
gate never fires and the lock form of each `/mfa/*` route answers 404.

## 9. Validator, schema and dungeon graph

**Schema** (`scripts/scenario-schema.json`). `secondStep` is a closed object (`kind` enum,
`owner` with `x-ref: "npc"`), not `x-serverOnly`, in the object lock block beside `lockType`
(`:5279`) in L1 and in the room block (`:4170`) in L2. It is not added to `doors[]` items.

**Validator errors.**

- `secondStep` on something without `locked: true` and a `lockType`; an unknown `kind`; no
  resolvable owner, or an owner that is not an NPC.
- A `secondStep` object with no `id`, or whose `id` or `name` equals another object's `id` or
  `name` anywhere in the scenario, or matches the generated-id form `<room>_<type>_<index>`
  of any room object.
- `secondStep` in a `doors[]` entry (added to `DOOR_ENTRY_LOCK_FIELDS`,
  `scripts/validate_scenario.rb:6944`), on a `flag` or `login` lock, or on a type that never
  opens through `/unlock`.
- `code` on a lock type outside `CODE_LOCK_TYPES`; until L2 lands, any `secondStep` on a room
  or on a type outside those two.
- A top-level carried item with `secondStep` (4, "Where it may sit").
- L2: `secondStep` on a room whose doorway carries a `gate`.
- `code` with no `code_device` owned by the owner; a push kind whose owner has no
  `phone_friendface` item. The MFA plan's error for a `code_device` whose "owner is not an
  account" widens to "is neither an account nor the owner of a lock's `secondStep`".
- The step can never be passed and the graph marks the lock as needed: `push` with an owner
  who never approves, or `push_number_match`, where the owner's phone can never be obtained.
  Off the critical path it is a warning, so an author can build a lock that never opens.

**Warnings.** A `secondStep` target named in any NPC's `unlockable` or
`eventMappings[].unlockDoor`: "the step still applies; the NPC replaces the first factor
only". A `secondStep` object with its own `text`: "shipped before the step; put it in
`contents`".

**Lock and key diff.** `scripts/lock_key_diff.rb` adds `secondStep` to `REQ_KEYS`.

**Dungeon graph.** A lock with `secondStep` gets a second requirement edge from the owner's
phone or code device (or from the owner's habit node for a `push` an owner will approve),
labelled with the kind, so a lock is reachable only when both edges are.

## 10. Effect on existing scenarios

None. No scenario carries `secondStep` today, and each change is behind it:

| Change | Why a scenario without the attribute is unchanged |
|---|---|
| The gate in `unlock` | `lock_step` is nil, so the gate returns before any new code |
| Rules A and B, the marker, `check_container_unlocked`, the take route | Apply only to ids in `second_step_ids`, which is empty |
| `/mfa/*` lock form | 404 for any target without the attribute |
| `secondStepDue` in the pads | False for every answer without `secondStep: true` |
| `lockSteps` default | An empty map, never sent |
| Bootstrap allowlist (L2) | Copies a field only when the room has it |

**Proof.** (1) A spec loads every scenario under `scenarios/` and asserts `second_step_ids`
is empty for all but `test_ops_lock_step`. (2) Before any change of this plan, a capture
script records, for the fixture scenarios the unlock and container controller tests use, the
JSON of every `/unlock` answer, `GET /container` answer and `filtered_room_data` room; the
capture is committed, and a spec compares byte for byte after each stage, with `lockSteps`
empty afterwards. (3) The existing unlock, container, inventory and door suites pass with no
edit. (4) The Hacktivity fixture scenarios (`test_objectives`, `test_simple_success`) are in
the capture set.

## 11. Tests

**Unit (Ruby).** `mfa_model_test.rb`: `lock_step` for each valid and invalid shape, owner
fallback, the two type lists. `lock_second_step_test.rb`: `second_step_ids` over every home
the finder walks; Rule A (`unlock_object!` refuses a string in the set, `record_step_open!`
raises when the step is not cleared); Rule B at each exit of 5.2; a `secondStep` object with
no id never opens.

**Controller.**

| Test | Asserts |
|---|---|
| Wrong first factor | Today's 422 body, byte for byte; `lockSteps` empty; no log row |
| Right first factor | 200 `secondStep` body; no `contents`; `unlockedObjects` unchanged; one `mfa_challenge` row |
| Nothing leaves early | For a room PC, an archive nested in it, an archive under a sign-in PC and an archive in a held declared grant: after the right first factor and after every refused `/mfa/*` call, `/unlock` again, `GET /container` (by id and by name), `GET /room`, the take route and a bootstrap contain none of the contents' ids, names or text |
| Twin names (fixture that skips the validator) | A plain lock whose name equals a `secondStep` object's name, then one whose name equals its id: opening the plain lock ships nothing of the other, by any exit |
| Each kind | Owner approves at patience; never-approving owner reaches the cap and expires; held phone approves; wrong number cancels; right code passes; five wrong codes drop the record; the thirty-code closure answers `codeLocked` and lifts |
| The second post | After a pass the same first factor opens the lock and deletes the record; a wrong first factor after a pass is refused and the record stays |
| Repeat and reload | A second right first factor against a live record answers the same body (same number), writes nothing and adds no row |
| Skips | `flag_reward` opens with no step. `npc` (an `unlockable` object; in L2 an `unlockDoor` door) gets the `secondStep` answer and opens nothing |
| Phone | `GET /mfa/phone` with no lock named lists no lock request; with a lock named and the phone not held, 403 |
| L2 doors | Credential and `npc` meet the gate with no `roomData` and no `unlockedRooms` write; a flag-reward door and a finished `prop_door` open with no step; `GET /room` is 403 before the pass |

**JS** (`second-step-lock.test.mjs`, plain `node`; no new module, so no harness copy list
changes). `secondStepDue`; the `password` pad swaps panes and counts no attempt; the `pin` pad
closes with no reject sound; `finishLock` re-posts the held first factor and calls
`unlockTarget` once. L2: each `notifyServerUnlock` caller and `requestRfidAccessUnlock` on a
`secondStep` answer call `unlockTarget` zero times and emit no `item_unlocked` or
`door_unlocked`.

**Feature scenario** `scenarios/test_ops_lock_step/`. Cast: Moira (low awareness, approves
when pestered, patience 3, keeps her phone), Gordon (high awareness; his ink hands over his
phone), Priya (owns a code device her ink hands over), Dana (high awareness, phone never
given). Locks: `moira_pc` (`password`, `push`) holding `audit_zip` (`password`,
`push_number_match`, Gordon); `moira_locker` (`pin`, `push`, listed in Moira's `unlockable`);
`priya_safe` (`pin`, `code`); `dana_cabinet` (`password`, `push_number_match`, off the
critical path); in L2 `records_room` (`rfid`, `push`, Moira). The scenario declares
`logSources` so rows can be read.

**Scripted playtest** (`window.__test`; each beat also checks the captured network answers
and the server record):

| Beat | What happens | Server record and browser afterwards |
|---|---|---|
| K1 | Wrong password at `moira_pc` | Today's refusal; `lockSteps` empty |
| K2 | Right password | `secondStep` answer; no contents in any captured answer; `GET /container` 403; one live record; `mfa_challenge` row |
| K3 | "Send again" until Moira approves | `passed`, then the record gone; `unlockedObjects` has `moira_pc`; contents listed; `mfa_prompt_approved` `by: owner` |
| K4 | Right password at `audit_zip`; three requests | Never approved; no file name or text in any answer |
| K5 | Reload; right password again | The same number; no second `mfa_challenge` row |
| K6 | Take Gordon's phone in his ink; "Check phone"; wrong number | Cancelled; record gone |
| K7 | Password again; right number | Archive open; `approvedBy: player`; files readable |
| K8 | Right PIN at `priya_safe`; device route before holding the device; take it; one wrong code, then the right one | 403; `tries` 1; then open |
| K9 | Moira's ink "lets you in" to `moira_locker` | `secondStep` answer; locker shut; approve by pestering opens it |
| K10 | Right password at `dana_cabinet`; requests to the cap | Expired; never opens; nothing shipped |
| K11 (L2) | Right card at `records_room`; pester until approved | `roomData` only in the last answer; `unlockedRooms` gains the room then |

**Live proof** on the real path, headless, on the keyless server: K2, K3, K6, K7 and K8 for L1
with screenshots of the pane in each frame; K11 for L2. The proof uses the test scenario and
edits no game record.

## 12. Build steps and shared files

Order: MFA plan M1a to M3 and the log helper first; then L1; then L2. On landing, A25 goes in
the `README_scenario_design.md` feature index and `docs/ACCESS_AND_NETWORKS.md`, and D6's
line that `doors[]` entries carry their own lock fields is corrected.

1. L1 server: `MfaModel.lock_step`; `second_step_ids`, `record_step_open!`,
   `step_object_open?`; the gate; the four exits of 5.2; `lockSteps`; the lock form of the
   routes; rows. Unit and controller tests, the capture of section 10 first.
2. L1 client: `secondStepDue`, the two pads, `MfaClient` subject keys and `finishLock`, the
   pane's `secondStepOnly` mode, the lock card on `authenticator-live`. JS tests.
3. L1 schema, validator, graph, `lock_key_diff.rb`, the feature scenario, beats K1 to K10,
   live proof.
4. L2: the room attribute and allowlist, the remaining lock types, every remaining poster,
   the door tests, beat K11, live proof.

| Shared file | This plan's edit | Also edited by |
|---|---|---|
| `game.rb` | `ACCESS_STATE_DEFAULTS`; `unlock_object!` (Rule A); the marker at `:2999-3010`; the bootstrap allowlist (L2) | MFA plan, privilege and accounts plan, core plan |
| `games_controller.rb` | the gate in `unlock`; `check_container_unlocked`; the take route's container test; the lock form in the `/mfa/*` actions | MFA plan, log plan |
| `lib/break_escape/mfa_model.rb`, `app/models/break_escape/mfa_access.rb` | the lock constants and `lock_step`; the `object` and `door` subjects | MFA plan (owner) |
| `utils/lock-scope-refusal.js`, the `password` and `pin` pads (L1); `unlock-system.js`, `doors.js`, the other pads, the NPC door posters (L2) | `secondStepDue` branches | none in the ops plans |
| `mfa-client.js`, the `password` scene's second pane, `authenticator-live` | subject keys, `secondStepOnly`, the lock card | MFA plan (owner) |
| `scripts/scenario-schema.json`, `scripts/validate_scenario.rb`, `scripts/generate_dungeon_graph.rb`, `scripts/lock_key_diff.rb` | section 9 | every ops plan |

## 13. Log rows this feature writes

Every row goes through the log plan's `write_log_row!` (its section "The helper"). A lock's
step writes the MFA plan's eight `mfa_*` events from the same shared functions, and registers
no new event name.

- **`as`** is `{ npc: ownerId }` on every row, whether or not the owner has an account. The
  owner's NPC id ships with the lock; an account username may be something the player has not
  yet seen, so it is never written here.
- **`where`** is `{ kind: 'object', id: }` with the found object's `id` (never the posted
  string), or `{ kind: 'door', id: }` with the room id.
- No detail holds a code, a number to match, a password or any first factor.

| Event | When, for a lock | Result | Detail | Bound | Saved by | Stage |
|---|---|---|---|---|---|---|
| `mfa_challenge` | the gate, when it writes a new record | `ok` | `method`: the unlock method's name | merged repeats; one per record | the save that stores the record | L1 |
| `mfa_code_ok` | verify, right code | `ok` | none | one per open | the save that sets `passed` | L1 |
| `mfa_code_wrong` | verify, wrong code | `fail` | none | merged; the code caps | the save that stores the counts | L1 |
| `mfa_code_locked` | verify, the code that reaches the thirty-code total | `locked` | none | merged; one per closure | the save that stores `closedAt` | L1 |
| `mfa_prompt_sent` | prompt, each counted request | `ok` | none | merged; the request cap | the save that stores the count | L1 |
| `mfa_prompt_approved` | prompt (owner) or approve (player) | `ok` | `by`: `owner`, `held_phone`, `own_phone` | one per open | the save that sets `passed` | L1 |
| `mfa_prompt_denied` | approve, Deny or a wrong number | `denied` | none | one per record | the save that drops the record | L1 |
| `mfa_expired` | verify or prompt at the per-record cap | `expired` | none | one per record | the save that drops the record | L1 |

L2 writes the same rows with `kind: 'door'`. Every row above rides a save its branch already
makes. Branches that write nothing today and still write nothing (a wrong first factor, a
repeat against a live record, a stale code, a too-soon request, a 403 or 404) write no row.
If a build adds a row to such a branch it passes `save_limit:`, never `once:`. The open that
follows a pass writes no row of this plan's.

## 14. Cross-plan requests

1. **MFA plan, shared functions.** The owner-and-subject functions accept the subjects
   `object` and `door` with the three differences of 5.2 (record home, no lockout key,
   `passed` in place of a session), and the challenge function can answer again from a live
   record. A change to those functions, the pending record or the counts is checked against
   this plan.
2. **MFA plan, routes.** The four step routes accept `target_type` and `target_id`;
   `GET /mfa/device` answers when a lock carries `kind: "code"` though no policy declares a
   kind; `GET /mfa/phone` lists a lock request only for a named lock.
3. **MFA plan, validator.** The `code_device` owner error admits a lock's owner (section 9).
4. **MFA plan, later slice.** Its slice "approving from the phone with no sign-in screen open"
   would, if built, be the place to add lock requests to a phone's own list (question 4).
5. **Log plan.** Register place kinds `object` and `door`, the `method` detail key on
   `mfa_challenge` (a value from the unlock method list), and `{ npc: }` as an allowed `as`
   on the eight `mfa_*` events; recompute the row ceiling for a 40-character object id.
6. **Orchestrator.** Feature id A25; add `test_ops_lock_step` to the brief's list of feature
   scenarios; correct D6's `doors[]` line.
7. **Core, privilege and cracking plans.** A password one of them yields is a first factor
   like any other and meets the step. A plan that opens an object by its own server route
   uses `record_step_open!` and `step_object_open?`, or the validator refuses `secondStep` on
   that object.

## 15. Open questions for the user

1. **Should an NPC-granted unlock skip the step?** An NPC opens a lock when the browser says
   the conversation got there; the server cannot check that. (a) No: the step is still due
   and the NPC replaces the first factor only; the validator warns. (b) Yes, always. (c) Yes,
   only when that NPC is the step's owner (the owner letting you in is the approval).
   *Recommend (a).* Under (b) or (c) any player who has met the NPC can skip the step with a
   crafted request, so the step would be best-effort on exactly the locks where an author
   most wants it. A flag reward, which the server records, skips it in every option.
2. **Which door openers skip a door's step (L2)?** (a) As the table in 5.3: the credential
   and an NPC meet it; a flag reward and a propped door skip it; a split gated door may not
   carry the attribute. (b) Nothing skips it: the validator also refuses `secondStep` on a
   room a flag reward or a `prop_door` can open. (c) As (a), and allow gated doors, with the
   slip-in and the pass promotion skipping and the credential promotion meeting it.
   *Recommend (a).* It matches what a reader's second step does in a building (it is asked
   only of someone using the reader) and keeps L2 small.
3. **Which lock types take a typed code?** (a) `password` and `pin` only; other types take
   push kinds. (b) Also `rfid`, `biometric`, `bluetooth` and `ble`, through the code-only pane
   (card plus PIN, the familiar badge reader). (c) As (b), and no push on `key` and
   `lockpick`, where a latch that asks its owner is odd fiction. *Recommend (a)* for the first
   build: the lock already has somewhere to type. (b) needs no new scene and can follow when a
   mission wants a card-plus-code door.
4. **Can a held phone show lock requests with no prompt open?** (a) No: a request is approved
   only from the pane the unlock attempt opened, while it is up. (b) Yes: the phone's own menu
   lists waiting requests, so the player can walk off and approve later; this needs the same
   for sign-in, which the MFA plan names as a later slice. *Recommend (a).*
5. **Does a passed approval lapse?** A pass is normally spent at once by the automatic second
   post. It lingers only if that post fails (a reload, the PC going out of reach). (a) It
   waits until a right first factor spends it. (b) It lapses after five minutes, as a real
   approval would. *Recommend (a):* it only ever spares the player a step they already
   completed, and the bound is one record per lock either way.
6. **Stages.** (a) L1 (objects with `password` or `pin`), then L2 (doors and the other lock
   types). (b) One stage. (c) L1 only until a mission wants a door that asks its owner.
   *Recommend (a):* L1 covers both examples; L2 touches every pad.
7. **A step on something the player carries** (a locked briefcase an NPC hands over, a start
   item). (a) Not in L1: the validator refuses it; a file inside a carried container is fine.
   (b) Allow it, after auditing every path an inventory copy of a locked item takes.
   *Recommend (a).*

Nothing in this plan costs game minutes. The only real-time values are the MFA plan's own
(the code window, the five-minute record life and closure).
