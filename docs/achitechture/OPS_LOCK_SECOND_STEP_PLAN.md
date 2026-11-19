# Ops layer: a second step on any lock (A25)

Stages G1 and G2. Needs stages M1a to M3 of `OPS_MFA_HELPDESK_PLAN.md` (the "MFA plan") and
stages L1a (the helper) and L1b (B11's `badge_swipe` row) of `OPS_LOG_ROWS_PLAN.md` (the "log plan"). Pointers are `file:line`; `game.rb` is
`app/models/break_escape/game.rb`, `games_controller.rb` is
`app/controllers/break_escape/games_controller.rb`, JS paths are under `public/break_escape/js/`.

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
taken after a knock-out), the pane gains a "Check phone" button. The phone opens over the
pane and shows the request for this archive with three numbers; the player picks the one the
archive showed and it opens. A wrong pick cancels the request and costs the password again.
For a `code` lock the player opens the owner's code device and types the code showing now.

What it teaches: a second step can guard one object as well as a sign-in; it is only as good
as the person or the device holding it; number matching removes the fatigue route; taking the
device defeats every kind. Every grant is a server decision, and nothing behind the lock, at
any depth, reaches the browser or opens before both checks. An owner approves on a count, not
a roll. The kind and the owner are public; what satisfies the step is not.

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
NPC containers and start items (`game.rb:4867-4915`, `:5025-5035`). It returns the object
alone, with no path, and walks no room object's `tableItems` (only the payload filter reads
them, `game.rb:7287`). A held USB stick is a fresh copy on every call
(`held_usb_sticks`, `game.rb:5011-5020`), so nothing can rely on an object's identity.
`locate_object_in` (`game.rb:4272-4291`) already returns `{ object:, scope:, path: }` for the
scope test. `/unlock` tests the parents only of an object under a sign-in PC, in a profile or
in a share (`login_scope_of`, `game.rb:3182-3203`; `unlock_scope_refused?` is false with no
scope, `:4194-4200`), so a plain nested object's parents are never tested. The answer then
finds the object again with `find_object_in_scenario` (`games_controller.rb:1318`,
`:3048-3104`), which matches id or name only and walks in a different order.

`validate_unlock(target_type, target_id, attempt, method, card_ids:)` is called in
production only by the controller (`games_controller.rb:1226`); the unit tests call it with
strings. It grants at once when the **posted string** is already in `unlockedObjects`
(`game.rb:4695-4698`), before it finds the object itself (`:4702`). With `method: "unlocked"` it grants any
object marked `locked: false` (`:4708-4711`); with `flag_reward` it grants a locked object only
when `flag_reward_unlocks_object?(object)` holds (`:4732-4735`).

**Where a locked object's contents are withheld, and how "open" is tested today.**

| Place | Test for "open" | Pointer |
|---|---|---|
| Room payload: a top-level room object is marked `locked: false`, and the filter then keeps its `contents` | the list holds its id, its **name** or its generated id | `game.rb:2999-3010`, `:7226-7232` |
| `GET /container`, plain container | the list holds the **posted string** or the found object's id; the finder matches id or name | `games_controller.rb:3119-3126`, `:3036-3038` |
| `GET /container` under a sign-in PC, a profile or a share | `path_unlocked?`: id only | `:641-669`, `game.rb:3310-3313` |
| Taking an item out of a room object or a released NPC container | the list holds the container's `id`, **or its name when it has no id**; the search looks one level into a room object's `contents` only, so a deeper item is never found | `games_controller.rb:3424-3430`, `:3662-3666`, `:3689-3694` |
| Taking an item from a share, or from a sign-in desktop | every locked folder or container on the path, by id | `network_access.rb:1720-1732`, `games_controller.rb:3510` |
| The inventory copy of a taken locked item | id only, then the same filter, which drops a locked copy's `contents` | `:3321-3332` |
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
`GET /room` serves a room only when it is the start room, an awareness world room, in
`unlockedRooms` or a route room (`:568-582`), and appends the start room or a world room to
`unlockedRooms` itself (`:584-591`). An `unlock_object` task completes when `object_unlocked?`
holds for its `targetObject` string as authored (`game.rb:5270`, `:697-699`).

**NPC and reward unlocks.** `method: "npc"` is a browser claim: for an object the server
checks only that the NPC was met and lists the target in `unlockable` (`game.rb:5051-5077`);
for a door an `unlockDoor` mapping needs no meeting (`:5041-5048`). The client's only NPC
unlocks are doors: the ink tag `unlock_door` (`minigames/helpers/chat-helpers.js:99-121`)
through `NPCGameBridge.unlockDoor` (`systems/npc-game-bridge.js:78`, `:108`), and the
conversation's door post (`minigames/person-chat/person-chat-conversation.js:464`). The
object branch is reached only by a crafted request. `method: "flag_reward"` reads
`flag_rewards_claimed`, which the server writes (`game.rb:4539-4574`).

**The client.** Every `/unlock` post goes through `ApiClient.unlock` (`api-client.js:105-119`),
which stamps `clientTs` at dispatch and applies the answer's server writes with it (`:107`,
`:117`). Its posters: `requestRfidAccessUnlock` (`systems/unlock-system.js:177`), the
`unlock_object` action (`systems/apply-actions.js:198-209`), the two NPC door posts, and,
through `unlockWithRouteRoomRetry` (`utils/lock-scope-refusal.js:50-77`), the `password`,
`pin`, `combination`, `cryptex` and `flag-station` pads and `notifyServerUnlock`
(`unlock-system.js:25-50`). The pads count an attempt on a 200 with `success: false`
(`password-minigame.js:1395-1408`, `pin-minigame.js:699-710`) and close a refusal
`lockScopeRefusal` recognises (`lock-scope-refusal.js:20-24`) as cancelled.
`notifyServerUnlock` swallows a rejection and returns nothing, and most of its callers
(`unlock-system.js:999` to `:1526`, `systems/doors.js:699`) pass the answer to `unlockTarget`
**without testing `success`**; `unlockTarget` marks the lock open and emits `item_unlocked`
or `door_unlocked` (`unlock-system.js:1696-1745`).

**An archive.** `zip_archive` is a type name and a sprite that no code names: any object with
`contents` is a container, and a locked nested one hands over to the lock path
(`minigames/container/container-minigame.js:2302-2304`; an example under a sign-in PC at
`scenarios/test_access_signin/scenario.json.erb:78-97`). A locked object's own `text` and
`observations` ship today; only `contents` are withheld. A declared grant's `contents` leave
every payload (`game.rb:7176`; `games_controller.rb:3323-3326`) and are served from the held
item only by the `/unlock` answer (`:3070-3073`) and `GET /container` (`:3014-3016`), both
testing `unlockedObjects`.

**Not built.** No second step on any lock, and no server count of `/unlock` attempts. The
unused `minigames/dual-auth/` scene is registered nowhere; this plan leaves it alone.

**From the MFA plan.** `MfaModel`, the owner-and-subject functions of `MfaAccess`, the five
`/mfa/*` routes, the `password` scene's second pane, the `authenticator-live` and
`code-device` scenes, `mfaPrompts`, `mfaAccounts` and the wrong-code closure. This plan is
their second caller.

## 3. Build stages in order

| Stage | Adds | Done when | Size |
|---|---|---|---|
| G1 | `secondStep` on a locked object with a `password` or `pin` lock (a plain PC, a safe, an archive), all three kinds; the id-keyed gate, the single "is it open" test and the rule for everything below a closed step; `lockSteps`; the lock form of the `/mfa/*` routes; the step handled once in `ApiClient.unlock`; the pane for a lock; schema, validator, graph, `test_ops_lock_step` | A player types an archive's right password, gets no contents and opens nothing inside it by any route, has the owner's phone approve, and only then sees the files | M |
| G2 | `secondStep` on a room (a door), and on `key`, `rfid`, `combination`, `cryptex`, `biometric`, `bluetooth` and `ble` locks, push kinds only; the door-opener rules of 5.3; the cancelled-step guard in `notifyServerUnlock` and `unlockTarget` | An rfid door stays shut after the right card until the request is approved, and `roomData` is in the last answer only | S |

Not planned: a step on a `flag` lock (the unlock submits to Hacktivity and is undone on an
error), on a `login` PC (its policy owns that step, MFA plan), and on the lock types that
never open through `/unlock` (`ransomware_display`, `network_architecture`, `alarm_panel`).

## 4. Scenario fields

**G1.**

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

**G2.** The attribute sits on the room, beside the room's `lockType`:

```json
"records_room": { "type": "room_office", "locked": true, "lockType": "rfid",
  "requires": ["records_card"], "secondStep": { "kind": "push", "owner": "moira" } }
```

| Field | Values | Meaning |
|---|---|---|
| `secondStep` | object | After the lock's own check passes, the lock asks its owner before it opens. Absent: the lock is exactly as today |
| `secondStep.kind` | `"push"`, `"push_number_match"`, `"code"` | As the policy kinds of the MFA plan, without `none` |
| `secondStep.owner` | NPC id | Whose phone gets the request, or whose code device gives the code. May be left out on an object whose `owner` is one NPC id; required on a room, and on an object with no `owner` or several |

**Where it may sit.** G1: a room object or a `contents` entry at any depth (in a plain
container, under a sign-in PC, in a profile, a share, a held declared grant or a container an
NPC carries), with `locked: true`, an `id`, and `lockType` `password` or `pin`. Not on a
top-level item the player can carry (an NPC's `itemsHeld` entry, a start item, a `takeable`
room object): open question 7. A `takeable` object nested in `contents` may carry it: it can be
taken only once every step above it is open, its inventory copy keeps `locked: true` and
loses its `contents` (`games_controller.rb:3328-3331`, `game.rb:7229-7232`), and opening it
from the inventory meets the gate as anywhere else. Never inside a `usb` item's `contents`
(a held stick is served as a fresh copy) and never on or inside a `tableItems` entry (no
finder walks them). G2: a room with `locked: true` that is neither the start room nor an
awareness world room. Never a `doors[]` entry.

**Kinds per lock type** (open question 3): `password` and `pin` take all three kinds (objects
in G1, rooms in G2); `key`, `rfid`, `combination`, `cryptex`, `biometric`, `bluetooth` and
`ble` take the push kinds only (G2).

The owner rules are the MFA plan's (its 5.2), with one addition: the owner needs no `creds`,
so a safe's owner can approve without being an account. Anything meant to be read only after
the step goes in the lock's `contents`. The owner's reactions are barks or ink mapped to 5.4's events.

## 5. Engine behaviour

### 5.1 Model

`MfaModel` gains `LOCK_KINDS = %w[push push_number_match code]`, `CODE_LOCK_TYPES = %w[password
pin]`, `PUSH_LOCK_TYPES` (those two plus `key rfid combination cryptex biometric bluetooth
ble`) and `lock_step(lockable)`: `{ kind:, owner: }` from a valid `secondStep` on something
with `locked: true`, the owner falling back to a single `owner` id; else nil. This plan adds only
`lock_step_never_passes?(scenario, lockable)` (section 9) to the MFA plan's `MfaModel`; it reuses
`held_item_sources` from the MFA plan's M1a. The validator, graph and server read the attribute through it.

### 5.2 Server: one gate, keyed on the object's id

One walk over every authored home in `scenario_data`, whatever the player holds (rooms and
their contents, profiles, shares, every declared grant, every room NPC's and headless record's `itemsHeld`, start
items), builds `Game#second_step_ids`, the ids of objects that carry a valid `secondStep`. It
depends on the scenario only, so holding a grant later cannot add an id that a plain open
already wrote, and a memo per game instance never goes stale. It is empty in a scenario
without the attribute, and every rule below is then inactive. A `secondStep` object with no
`id` is never opened and logs a server warning (the validator refuses it first).

**The resolver returns a path.** `Game#resolve_unlock_target(target_id)` walks the same
sources in the same order as `find_scenario_object` and returns `{ object:, path: }`, where
`path` is the objects above the match, outermost first, as `locate_object_in` builds it.
`find_scenario_object(id)` becomes `resolve_unlock_target(id)&.dig(:object)`, so its other
callers are unchanged. The finders behind the other exits (`find_container_in_scenario`,
`find_accessible_item`, the take searches) carry the same `path` through their recursion. A
path holds the objects as found, copies included, and the rules read only their `id`s, so a
copied source such as a held stick works the same as a room.

**Rule A, one writer.** A string in `second_step_ids` enters `unlockedObjects` only through
`Game#record_step_open!(object)`, which writes the object's `id` and raises unless the step is
cleared (below). `unlock_object!` refuses to write a string in the set; the controller calls
`record_step_open!` for a `secondStep` object in place of `unlock_object!(target_id)`. So if a
plain object's name equals a `secondStep` object's id, opening the plain one answers the
generic 422 and writes nothing. A spec greps that nothing else appends to the list.

**Rule B, one reader.** `Game#step_object_open?(object)` is `unlockedObjects.include?(object['id'])`.
For a `secondStep` object every "is it open" test of section 2 uses it, and never the posted
string, the name or the generated id. An `unlock_object` task reads the list with its authored
`targetObject`, so the validator requires a task on a `secondStep` object to name its `id`.

**Rule C, nothing below a closed step.** `Game#behind_closed_step?(path)` is true when some
object on the path has an `id` in `second_step_ids` that fails Rule B; it is modelled on
`path_unlocked?` (`game.rb:3310-3313`). When a posted name matches two objects, the first in
walk order is the one judged and the one whose contents can ship, so a twin can be refused
but never leak. An object for which it is true is refused exactly as an invented id is,
whatever its own lock: a `locked: false` folder inside a gated PC cannot be opened with
`method: "unlocked"`, and an archive whose password the player learnt elsewhere cannot be
opened past its gated parent. Each place an object can be opened or its contents can leave the
server:

| Exit | The `secondStep` object itself | An object below a closed step |
|---|---|---|
| `/unlock` (`games_controller.rb:1211-1335`) | the gate, in the order below; the answer's `contents` come from the object the gate resolved | `validate_unlock` refuses it first, beside `unlock_scope_refused?` (`game.rb:4688-4691`): the generic 422. The same refusal branch (`games_controller.rb:1236-1252`) writes the log plan's refused `badge_swipe` row (L1b); G1 edits it so the closed-step refusal (`behind_closed_step?(path)`) returns before that row is written, and a swipe here writes no row. `pin_cracker_feedback`, `password_case_mismatch?` (`game.rb:4793`, `:4808`) and `unlock_session_refusal` (`:4214`) answer nil for it, so the body is an invented id's |
| Room payload marker (`game.rb:2999-3010`) | matched by id only | nothing to do: the filter drops a closed object's `contents` (`:7226-7232`) |
| `GET /container`, plain (`games_controller.rb:672-680`, `check_container_unlocked` `:3119-3126`) | tested by id only | 404 "Container not found", as an invented id |
| `GET /container` scope branches (`:641-669`), take from a share (`network_access.rb:1720-1732`) or from a sign-in desktop (`games_controller.rb:3510`) | `path_unlocked?` or the path test, by id already | refused already: a `secondStep` object is locked, so a closed one fails the path test |
| Take from a room object or a released NPC container (`:3424-3430`, `:3662-3666`, `:3689-3694`) | the container is tested by id | the found item is tested by Rule C and refused as an item not found; today the search reaches only one level down, so this guards a deeper search added later |
| Inventory copy (`:3321-3332`) | `locked` cleared by id only; a locked copy loses its `contents` | the copy builder asks Rule C of the take route's path and refuses, so no take source can bypass it |
| A nested locked container in any payload, an NPC-held or declared-grant item | `contents` always removed, served only by `/unlock` and `GET /container` | those rows |

The `/unlock` answer uses the object the gate resolved in place of the second finder at
`games_controller.rb:1318` whenever `second_step_ids` is not empty, so the two finders cannot
disagree about which object's contents ship; a scenario without the attribute keeps the old
call. The object's own `text` and `observations` are not behind the gate, as today.

**The order in `GamesController#unlock`.**

1. **Resolve once.** The controller resolves the target with `resolve_unlock_target` (or
   `room_data` for a door) before anything else, and every later step uses that result.
   `validate_unlock` gains a keyword, `resolved: nil`, taking that `{ object:, path: }`; given
   it, it uses it in place of its own find at `game.rb:4702`. Left nil, it resolves as the
   controller does: `resolve_unlock_target` for an object (object and path, so Rule C always
   has a path), `room_data` for a door (no path; Rule C reads objects only). The unit tests'
   string calls work unedited. `/unlock` passes `resolved:` so the lookup runs once.
2. **The first factor.** `validate_unlock` runs as today, with Rule C on the resolved path
   first. For a resolved object that carries `secondStep` and is not open by Rule B, it judges
   the first factor with the "already open" shortcut (`game.rb:4695-4698`) turned off, so a
   posted name or alias that some other open put in the list proves nothing. A wrong first
   factor takes today's refusal branch and answers byte for byte as today.
3. Today's checks after a valid attempt (released flag, rfid card answer, route room) stay. For
   a `secondStep` target `alreadyOpen` (`games_controller.rb:1223-1224`, which tests the posted
   string) is computed by Rule B.
4. **The gate**, new, before the transaction. It does nothing, and the action carries on as
   today, when the target has no `secondStep`, when it is already open by Rule B
   (`room_unlocked?` for a door), when the lock's record is marked `passed`, or when the method
   is `flag_reward` and `flag_reward_unlocks_object?` holds for the resolved object
   (`game.rb:4732-4735`). **The `npc` method does not skip it**: the browser asserts that
   method, so an NPC's `unlockable` or `unlockDoor` stands in for the first factor only (open
   question 1). Otherwise:
   - a live record that has not passed is answered again from the record, with no write and
     no log row (so repeating the first factor, or reloading, costs no save and cannot reset
     the request count). This is the lock caller's own logic: it reads `kind` and `nonce` from
     the record and recomputes the number with the MFA plan's pure
     `numbers(key, game_id, <record key>, npc_id, record['nonce'])`;
   - else the shared challenge function writes a new record, adds 1 to
     `mfaAccounts[owner].started`, writes `mfa_challenge` and saves.
   The answer is 200 `{ success: false, secondStep: true, kind, targetType, targetId, npcId,
   number? }`, with `targetId` the object's id. Nothing is unlocked and the answer
   carries no `contents` and no `roomData`.
5. **The step** runs on the `/mfa/*` routes with the lock as subject (section 6). On a pass
   the shared function returns `:passed` and drops nothing; the lock caller sets `passed` on
   the record and answers `{ success: true, stepPassed: true }`, with no contents.
6. **The first factor again.** The client repeats its `/unlock` post without asking. Step 2
   judges it afresh, the gate finds `passed`, `record_step_open!` opens the lock inside the
   existing transaction, the answer is today's, and the record is deleted. If the record is
   gone by then, the gate starts a new challenge and the client gives up rather than loop (5.4).

Only the gate writes a record, after a valid first factor, so the step cannot be taken first;
a pass is spent by the open. The `secondStep` answer confirms the first factor, as a real
second prompt does; for `biometric`, `bluetooth` and `ble`, whose first factor the server takes
on trust (`game.rb:4652-4657`), the step is the part the server enforces. The second post
judges reach, so the `/mfa/*` routes need none.

**What a subject supplies.** The shared functions take `{ kind: 'object' | 'door', id: }`;
the MFA plan's subject-rules table (its 5.2) sets what a non-sign-in subject does. The
lock-only values:

| | A lock |
|---|---|
| Record | `lockSteps["object:<id>"]` or `["door:<roomId>"]` (the key `PinDust` uses, `pin_dust.rb:77-80`): the pending record's fields plus `'passed'?` |
| Code compared against | the owner's own `code_device` item, always, never `own:<npcId>` |
| Phone that may approve | the owner's held phone only; a lock's routes never read `accountResets` (open question 8) |

Shared and unchanged: the five-minute record life, the gap between requests and their cap, the
owner's patience `mfaPrompts[npcId]` (worn down by sign-in and lock requests alike), the
held-device and held-phone tests, the once-per-window code rule and `numbers`, to which a
lock passes its record key. No lock is stranded by its counts: five wrong codes drop the
record, and the thirty-code closure lifts after five minutes.

### 5.3 Doors (G2)

`lock_step` is read from the room. G2 adds `secondStep` to the bootstrap room allowlist
(`game.rb:2425-2427`) so a door pad knows the kind before its room loads. Ways a door opens,
and whether each meets the step (open question 2):

| Opener | Path | Meets the step? |
|---|---|---|
| The lock's own credential | `/unlock`, `serve_opened_room` (`games_controller.rb:1298`) | Yes, at the gate |
| An NPC's `unlockDoor` mapping or `unlockable` | `/unlock` with `method: "npc"` (`game.rb:4623-4626`) | Yes: the browser asserts it. The NPC stands in for the first factor |
| A flag reward | `process_door_unlock_reward` (`games_controller.rb:4011-4020`) | No: the server's own record of a claimed flag |
| A propped door | a finished `prop_door` workaround (`games_controller.rb:1702`) | No: the door is held open, so its reader is never asked. Best-effort, as tailgating is: the server checks the hand-over, dwell and room (`npc_frustration.rb:151-201`), but the failures are reported by the browser and only paced (`:2-5`, `:121`), so a crafted client can prop it |
| A split gated door: NPC slip-in, promotion by pass, promotion by credential, the clone-as-entry card post (`systems/doors.js:699`) | `record_npc_route_room!`, `promote_route_room!` (`game.rb:475`), `/unlock` | Not allowed together in G2: the validator refuses `secondStep` on a room whose doorway carries a `gate`, so none of these meets a gated room |
| Already open, the start room, a room with `locked: false` | none | Not asked |

The two "No" rows call `unlock_room!` directly and are left as they are; a controller test
pins each. The one other writer of `unlockedRooms`, `GET /room` (`games_controller.rb:584-591`),
adds only the start room and an awareness world room, which cannot carry the step.

### 5.4 Client

No new scene and no new module.

- **One place handles the step: `ApiClient.unlock`.** When an answer carries
  `secondStep: true`, it does not return it. It hands the answer, with the request it just
  sent, to `MfaClient.runLockStep`, which opens the pane and waits. When the step passes,
  `finishLock` posts the same body again through `ApiClient.post('/unlock', …)`, not through
  `ApiClient.unlock`, so it never re-enters the step handler. It takes a fresh
  `stateSync.nextClientTs()` at that dispatch and applies the answer's server writes with it,
  so syncs made while the pane was up do not outrank the open. `ApiClient.unlock` resolves
  with that answer, and the caller sees one ordinary answer. There is one re-post per pass: if
  it answers `secondStep: true` again (the passed record was lost), it rejects as a cancel and
  the player starts over. When the player closes the pane, or the request is denied or
  expires, it rejects with a 403-shaped error whose `body.reason` is `second_step_cancelled`.
  The request is held in that closure only, never stored. `ApiClient` reaches
  `window.MfaClient` as it reaches `window.stateSync`, so it gains no static import.
- **What each caller does with it.** The pads that call `lockScopeRefusal` (`password`, `pin`,
  `combination`, `cryptex`, `flag-station`) already close a recognised refusal as cancelled
  with no attempt counted and no reject sound; `second_step_cancelled` joins that table with
  the line "Not approved." `notifyServerUnlock` returns `{ success: false,
  secondStepCancelled: true }` for that error, and `unlockTarget` returns at once on such an
  answer, so the callers that pass the answer untested (section 2) mark nothing open and emit
  no `item_unlocked` or `door_unlocked`. The pad callbacks (`unlock-system.js:1187-1240`)
  already call `unlockTarget` only on success. `requestRfidAccessUnlock` reports a rejection with a
  status as `denied`, which is true: the door stayed shut. The two NPC door posts treat it as
  the NPC failing to open the door. The `unlock_object` action never receives one: its only
  source that passes `validate_unlock` for a locked object is `flag_reward`, which the gate
  skips. All of this is inactive for an answer without `secondStep: true`, and G1 lands it
  whole.
- **The pane** is the second pane of the `password` scene. A `password` lock swaps to it in
  place. Any other pad stays open beneath and the scene opens over it as a child with
  `secondStepOnly: true`; with no pad (key, lockpick, a card, a biometric or wireless lock, an
  NPC's door) it opens alone. It sits under the lock's name, in the monitor frame for a `pc`
  and the plain lock frame otherwise, VT323 text, 2px borders. X closes it; the record expires.
- **The phone and the device** are the MFA plan's scenes, opened only from the pane ("Check
  phone", "Use device") as its children. `authenticator-live` draws the one request for this
  lock as a card with the lock's name and the owner's headshot. **A held phone opened from
  the inventory lists no lock request**: a pending lock request is approved only from the
  pane the unlock attempt opened, by the owner or by the player on the owner's phone while
  that pane is up (open question 4). The pane that comes back after a child is a new
  instance; it asks `MfaClient.takeCompleted(subject)` first (for a lock, the pass answer a
  child received, handed out once), and on a pass calls `finishLock(subject)`. A child forced
  shut clears it, as for sign-in.
- **After a reload or a closed pane** the held request is gone. The player gives the first
  factor again: a `passed` record opens the lock, a live one reopens the same pane with the
  same number, an expired one starts a new challenge.
- **Events** `mfa_required`, `mfa_prompt_sent`, `mfa_approved` and `mfa_failed` are emitted by
  `MfaClient`, as for sign-in, with `targetType` and `targetId` in place of `pcId`, so a
  scenario maps the owner's bark the same way. A lock never touches `pc-sessions.js`.

## 6. Server routes

No new route. `POST /unlock` keeps its parameters and gains the one 200 answer of 5.2. Both
routes extend existing ones, so they keep their bodies: `/unlock` and `GET /container` refuse as
today (generic 422, 404 "Container not found", 403), and the `/mfa/*` lock form uses the MFA
plan's flag bodies (`mfaIncorrect`, `codeLocked`, `tooSoon`, `expired`, `cancelled`). No new answer needs
`{ success: false, reason }`; `second_step_cancelled` is a client-made reason.

The `/mfa/*` routes (MFA plan, "Server routes") take a lock where they take a PC:
`target_type` (`object` or `door`) with `target_id` in place of `pc_id`. A request naming
both a PC and a lock, or neither, is the generic 422. The 403 and 404 bodies are the MFA plan's `/mfa/*` ones (`{ success: false, error: "no such device" }`, `"no such phone"` or `"not found"`). `target_id` is resolved by id only: an
object id must be in `second_step_ids` and a door id must name a room with `secondStep`; the
name-matching finder is never used here. With a lock as subject, in order:

| Route | Checks | Answer |
|---|---|---|
| all four below | the target resolves by id, carries `secondStep` and is not open (else 404) | |
| the three posts | `lockSteps` holds a live record that has not passed, of the right kind (else generic 422). No route re-judge and no lockout | |
| `POST /mfa/verify` (`code`) | owner's code step not closed (422 `codeLocked`, `retryIn`); six digits; `MfaModel.code_state` | Stale: 422, no write. Wrong: `tries` and `mfaAccounts[owner].wrong` move, 422 `mfaIncorrect: true`; the fifth drops the record and adds `expired: true`. Right: `passed` set, `{ success: true, stepPassed: true, targetType, targetId }` |
| `POST /mfa/prompt` | gap since the last request (422 `tooSoon`); under the cap (else record dropped, 422 `expired`) | The owner's decision as for sign-in. Not approved: `{ success: false, approved: false, promptsSent, waiting? }`. Approved: `mfaPrompts[owner] = 0`, `passed` set, the pass answer plus `approvedBy: "owner"` |
| `GET /mfa/phone` | `npc_id` is the lock's owner and that phone is held (else 403 `no such phone`) | No write. `{ requests: [ { targetType, targetId, name, n, numbers? } ] }` with that one lock's request when a live, unpassed record exists, and an empty list (200) when none does, so an open phone never shows an error for an expired request. The `own=1` form and a form with no lock named never list a lock request |
| `POST /mfa/approve` | the owner's phone is held (else 403); a re-enrolment is ignored | `deny`, or a wrong or missing number: record dropped, `{ success: false, cancelled: true }`. Right: `passed` set, the pass answer plus `approvedBy: "player"` |

`POST /mfa/verify` for a lock compares against the owner's `code_device` item id, never
`own:<npcId>`. `GET /mfa/device` also answers when no policy declares a kind but a lock carries
`kind: "code"`. The lock subject kind registers with the MFA plan's `device_in_use?(npc_id)`,
true when any `code` lock names that owner, so a sign-in re-enrolment never blanks a device a
lock still needs. All are inside the game lock and `no-store`.

## 7. What reaches the browser, and what never does

`secondStep` (`kind`, `owner`) is public, with the object as authored or, for a room, in the
bootstrap door fields (G2). After a right first factor the browser learns only that, and for
number matching its own two digits. `contents` and `roomData` come after both checks (5.2), a
code only from `GET /mfa/device` while the device is held. It never receives which of the
phone's three numbers is right, any hint on a wrong first factor, `lockSteps`, `mfaPrompts`,
`mfaAccounts`, the owner's patience or habit.

## 8. State and saved games

One server-owned key joins `ACCESS_STATE_DEFAULTS` beside the MFA plan's five, as a flat
top-level `{}`:

| Key | Shape | Bound | Sent |
|---|---|---|---|
| `lockSteps` | `{ "object:<id>" or "door:<roomId>" => record }`; the record is the MFA plan's pending record plus `'passed'?` | One record per `secondStep` lock in the scenario. Unpassed records past five minutes are dropped on every read and write of the map; a passed one is deleted by the open | Never. It is not read from a sync body |

A passed record the player never spends stays for the rest of the game and survives reloads,
within the one-per-lock bound (open question 5); `reset_player_state!` drops `lockSteps` with
the other access keys (`game.rb:3019-3020`). `mfaPrompts` and `mfaAccounts` gain one entry
per lock owner who is not an account. `unlockedObjects` grows by one id per opened lock, as
today. Nothing is added to synced state; answers carry single changed values. **Reload:** 5.4.
**Old games:** a saved scenario without the attribute has an empty `second_step_ids`, so the
gate never fires and the lock form of each `/mfa/*` route answers 404.

## 9. Validator, schema and dungeon graph

**Schema** (`scripts/scenario-schema.json`). `secondStep` is a closed object (`kind` enum,
`owner` with `x-ref: "npc"`), not `x-serverOnly`, beside `lockType` in the object lock block
(`:5279`, G1) and the room block (`:4217`, G2), and not on `doors[]` items.

**Validator errors.** One new check, `check_lock_step(json_data)`, in a new
`scripts/validate_lock_step.rb`. `validate_scenario.rb` gains only a `require_relative` as
`validate_network.rb` has (`:26`) and the run-list call beside `check_npc_held_containers`
(`:8948`), no door-loop edit. The file requires `lib/break_escape/mfa_model.rb` itself and
relies on `headless_npc_records` (`validate_scenario.rb:1259`) as other split files rely on
shared helpers. Its one walk covers rooms and their `contents`, each room object's `tableItems`, every
NPC's `itemsHeld` (room NPCs and headless records), declared grants, account profiles, shares
and `startItemsInInventory`, keeping the ancestor chain so the placement errors can be told
apart; its own loop over `rooms[].doors[]` covers the two door rules.

- `secondStep` on something without `locked: true` and a `lockType`; an unknown `kind`; no
  resolvable owner, or an owner that is not an NPC.
- A `secondStep` object with no `id`, or whose `id` or `name` equals another object's `id` or
  `name`, or matches the generated-id form `<room>_<type>_<index>` of any room object.
- A `secondStep` object's id, a gated room's id or the owner's NPC id longer than 40
  characters or outside `[A-Za-z0-9_.:-]` (the log plan's id rule; else its rows are dropped).
- `secondStep` in a `doors[]` entry is an error (the same severity as `access` and
  `acceptsUIDOnly` there, `scripts/validate_scenario.rb:8058-8064`; not a warning like
  `DOOR_ENTRY_LOCK_FIELDS`, `:8050-8055`), raised by `validate_lock_step.rb`. Also on a `flag` or `login`
  lock, or a type that never opens through `/unlock`.
- `code` on a lock type outside `CODE_LOCK_TYPES`; until G2 lands, any `secondStep` on a room
  or on a type outside those two.
- A top-level carried item with `secondStep` (4, "Where it may sit"): an `itemsHeld` entry, a
  start item, a `takeable` room object.
- `secondStep` on anything inside a `usb` item's `contents`, at any depth, and on any
  `tableItems` entry or anything inside one.
- An `unlock_object` task whose `targetObject` names a `secondStep` object by anything but its `id`.
- G2: `secondStep` on a room that some room's `doors[]` entry with `connectedRoom` naming it
  marks with a `gate` (raised by `validate_lock_step.rb`), on the `startRoom`, or on the room named
  by `social.awarenessEpisode.world.room` (as `awareness_world_room?` reads it, `game.rb:153-159`).
- `code` with no `code_device` owned by the owner; a push kind whose owner's NPC has
  `phone: false`. The MFA plan's `code_device` error "owner is not an account" widens to "is
  neither an account nor the owner of a lock's `secondStep`".
- A step that can never be passed on a lock a task needs. The rule is one pure function,
  `MfaModel.lock_step_never_passes?(scenario, lockable)` in `lib/break_escape/mfa_model.rb`,
  that is true when the owner's code device (`code`) or phone (a push kind) sits in no place
  the player can take it from and, for `push` only, `prompt_habit` also reads `never`. A
  `push` step passes by the owner's approval or a held phone, so only both routes shut means
  never. `push_number_match` has one route, a held phone (pestering never approves it; MFA
  plan, `POST /mfa/approve` and the M3 graph edge, which draws the phone item only), so its
  habit is not read. `code` has one route, the device. In the worked example `dana_cabinet`
  (`push_number_match`, Dana keeps her phone) is the lock that matches; `moira_pc`,
  `moira_locker` and `records_room` are `push` with an owner who approves when pestered, so
  none does. Items come from `MfaModel.held_item_sources(scenario)`, which the MFA plan's stage
  M1a builds (this plan reuses it), a plain-Ruby walk beside `device_for` that counts a device exactly when the game lets the player hold it, as
  `held_friendface_phone` does (`social_feed.rb:190-221`): room objects and `contents`, start
  items, and a room NPC's `itemsHeld` only when its story or record offers that type
  (`AccessWork.offers_item_text?`) or the NPC can be knocked out: not `koImmune`, not
  `npcType: "phone"`, and no scenario `disableAttacks` (the server's knock-out gate,
  `game.rb:2045-2059`, excludes the first two; `disableAttacks` is the client's refusal to punch,
  `player-combat.js`, mirrored in `owner_claim.rb:73-74`). Headless records and declared grants are not counted,
  because those tests do not. The validator and the graph call the predicate. A task needs
  the lock when any task's target is the lock or sits below it (an `unlock_object` or
  `collect_items` task naming an id in the subtree, from the walk's ancestor chain) or, for
  a room, any task target in it or an `unlock_room` or `enter_room` task naming it
  (`check_objectives_wiring`, `:1602`, `:1719`). With no such task it is only a warning.

**Warnings.** A `secondStep` target named in any NPC's `unlockable` or
`eventMappings[].unlockDoor`: "the step still applies; the NPC replaces the first factor
only". A `secondStep` object with its own `text`: "shipped before the step; put it in
`contents`". The same for a gated room object's `tableItems`, which ship before the step (the
filter removes only `contents`, `game.rb:7280-7287`). `scripts/lock_key_diff.rb` adds `secondStep` to `REQ_KEYS`, its output unchanged
for a scenario without the field.

**Dungeon graph.** `generate_dungeon_graph.rb` draws a lock as `lock_<id>` from its parent in
`walk_objects` (`:141-155`) and a room's lock from the room list (`:99`). A lock with
`secondStep` gains one more edge into that node, labelled with the kind, from the owner's NPC
node, named and added as the room walk adds one (`npc_<nid(display name)>`, `:218-226`),
adding the owner's node when missing, with the room edge the room walk gives (`:221-222`), or
unattached for a headless record. A step for which `MfaModel.lock_step_never_passes?` is true
gets a dashed edge labelled "never passes". The graph uses the `mfa_model.rb` require the MFA
plan adds (`:21-29` loads `lib/` files only; `mfa_model.rb` requires `npc_habits` itself).
A scenario without the field draws exactly as before.

## 10. Effect on existing scenarios

None. No scenario carries `secondStep` today, and each change is behind it: the gate returns
when `lock_step` is nil; Rules A, B and C, the shortcut turned off and the answer's finder act
only on ids in `second_step_ids`, which is empty; `resolve_unlock_target` finds what
`find_scenario_object` found, plus the path; the `/mfa/*` lock form answers 404; each client
branch fires only on `secondStep: true` or `second_step_cancelled`; the bootstrap copies the
field only when a room has it. Every game gains an empty `lockSteps` on its next initialise
(`game.rb:7576`), never sent.

**Proof.** (1) A spec walks every scenario under `scenarios/` (a pure scenario walk) and
asserts `second_step_ids` is empty for all but `test_ops_lock_step`. (2) The shared mechanism
built in the log plan's L1a: this plan adds to `test/fixtures/files/ops_unchanged/` the files
`lock_step_unlock.json`,
`lock_step_container.json` and `lock_step_rooms.json`, holding the `/unlock` answers, the
`GET /container` answers and the `filtered_room_data` rooms for `test_objectives`,
`test_simple_success` (the Hacktivity fixtures), `test_pin_dust`, `m01_first_contact` and
`m02_ransomed_trust`. The fixed script, through the real routes: every lock posted once
wrong and once right, breadth-first from the start room along room connections in file order,
each room's objects in file order, after its room and container ancestors are open, the lock's
`requires` item seeded into the inventory by test setup (directly, identically on main and branch; every captured answer still comes through the real routes); a lock the scope
refuses is recorded as refused, and locks below it as unreached. `GET /container` for each
open container, then `filtered_room_data` for each room (`test_simple_success` has no locks
or containers: room answers only). The log plan's rake task `ops:unchanged:capture` writes them once from main before any change of this plan, and `bin/ops-golden-compare`
compares them in `test/controllers/break_escape/lock_step_unchanged_test.rb` after each
stage; they cover answers, not stored state (the empty `lockSteps`). (3) The existing
unlock, container, inventory and door suites pass with no edit.

## 11. Tests

**Unit (Ruby).** `mfa_model_test.rb`: `lock_step` for each valid and invalid shape, owner
fallback, the two type lists; `lock_step_never_passes?` with the routes open and shut (four
cases for `push`, two for `push_number_match` and `code`), with the item walk's cases
(`held_item_sources`) left to the MFA plan's `mfa_model_test.rb`. `lock_second_step_test.rb`: `second_step_ids` over every authored
home, the same before and after a grant is held; Rule A (`unlock_object!` refuses a
string in the set, `record_step_open!` raises when the step is not cleared); Rule B at each
exit of 5.2; `resolve_unlock_target` finds the same object as `find_scenario_object` for
every id, name and generated id in the fixture scenarios, with the path at three depths;
`validate_unlock` with `resolved:` and without it agree (the second form resolves the path
itself); Rule C at each exit; a `secondStep`
object with no id never opens; the expiry tidy keeps a passed record. Secret
guard, as the MFA plan has per stage: a row holding a code after `note_issued_secret`, and one
holding the lock's own `requires`, each raise in tests.

**Validator and graph.** One validator spec per error and warning of section 9, each with a
passing twin, including a task target inside a never-passable gated object.
`test/js/dungeon-graph-lock-step.test.mjs`: the second edge per kind, the dashed "never
passes" edge, and a scenario without the field drawn unchanged.

**Controller.**

| Test | Asserts |
|---|---|
| Wrong first factor | Today's 422 body, byte for byte; `lockSteps` empty; no log row |
| Right first factor | 200 `secondStep` body; no `contents`; `unlockedObjects` unchanged; one `mfa_challenge` row, stored (a malformed log call raises in tests) |
| Nothing leaves or opens early | Fixtures: a room PC, an archive nested in it, an archive under a sign-in PC, one in a held declared grant, and inside the closed PC a `locked: false` folder, a plain-locked archive and a takeable gated archive. After the right first factor and after every refused `/mfa/*` call, `/unlock`, `GET /container` (by id and by name), `GET /room`, every take route, the inventory copy and a bootstrap ship none of the contents' ids, names or text. The three inner objects, posted by id and by name (the folder with `method: "unlocked"`, the archive with its right password), get the invented-id 422 (no pips, no case hint) and write nothing. After the PC opens they open as plain objects, and the takeable archive is taken with `locked: true` and no `contents`, then meets the gate from the inventory |
| Refused swipe below a closed step | An rfid object below a closed step, swiped with a held card: the invented-id 422 and no `badge_swipe` row; with the step open, the same swipe writes today's `denied` row |
| Copied source (fixture that skips the validator) | A held habit stick holding a `secondStep` folder with a file inside: the file, reached through the stick's fresh copy, is refused by `/unlock`, `GET /container` and the take routes until the folder's step opens, then served |
| Twin names (fixture that skips the validator) | A plain lock whose name equals a `secondStep` object's name, then one whose name equals its id: opening the plain lock ships nothing of the other, by any exit. With that name in `unlockedObjects`, a post of it to the gated object with no password is refused, and one with `method: "flag_reward"` and no claimed flag is refused |
| Finders disagree (fixture that skips the validator) | A scenario where `find_object_in_scenario` and `find_scenario_object` pick different objects for one posted name: the `/unlock` answer ships the contents of the object the gate resolved only |
| Each kind | Owner approves at patience; never-approving owner reaches the cap and expires; held phone approves; wrong number cancels; right code passes; five wrong codes drop the record; the thirty-code closure answers `codeLocked` and lifts |
| The second post | After a pass the same first factor opens the lock and deletes the record; a wrong first factor after a pass is refused and the record stays. Every row in the log table of section 13 is stored by its branch's save |
| Repeat and reload | A second right first factor against a live record answers the same body (same number, recomputed from the record's `nonce`), writes nothing and adds no row |
| Skips | `flag_reward` for a claimed reward opens with no step. A crafted `npc` post for an object in an NPC's `unlockable` (no client sends one) gets the `secondStep` answer and opens nothing; in G2 the same for an `unlockDoor` door |
| Phone and ids | `GET /mfa/phone` with no lock named, or `own=1`, lists no lock request; with a lock named and the phone not held, 403; held with no live record, an empty list. A step route given the gated object's `name` in place of its id answers 404 |
| Re-enrolled owner | After a helpdesk re-enrolment of the owner: the player's own phone cannot approve the lock (403); verify still takes the code from the owner's `code_device`, which `GET /mfa/device` still shows; `own:<npcId>` codes are refused |
| G2 doors | Credential and `npc` meet the gate with no `roomData` and no `unlockedRooms` write; a flag-reward door and a finished `prop_door` open with no step; `GET /room` is 403 before the pass; at an rfid door no `badge_swipe` row until the final post |

**JS** (`second-step-lock.test.mjs`, plain `node`). No new module: the tests depend on the
MFA plan's stage M1b having put `mfa-client.js` and its scenes on every harness copy list.
`ApiClient.unlock` on a `secondStep` answer opens the pane, never returns that answer,
resolves with the re-posted answer on a pass and rejects with `second_step_cancelled` on a
close, a deny or an expiry; on any other answer it behaves as today. The re-post takes a new
`nextClientTs()` (later than one taken while the pane was up) and applies its writes with it;
a re-post answered with `secondStep: true` again rejects with no third post and no second
pane. One caller per kind of handling: the `password` pad swaps panes and counts no attempt;
the `pin` pad keeps its state beneath the pane and plays no reject sound on a cancel; a
`notifyServerUnlock` caller
(key) and `requestRfidAccessUnlock` call `unlockTarget` zero times on a cancel and emit no
`item_unlocked` or `door_unlocked`; the `unlock_object` action with source `flag_reward`
posts as today. A grep spec asserts that nothing in `public/break_escape/js/` posts to
`/unlock` except `ApiClient.unlock` and `MfaClient.finishLock`.

**Feature scenario** `scenarios/test_ops_lock_step/`. Cast: Moira (low awareness, approves
when pestered, patience 3, keeps her phone), Gordon (high awareness; his ink hands over his
phone), Priya (owns a code device her ink hands over), Dana (high awareness, `koImmune: true`,
phone in her `itemsHeld`, no give in her ink). Locks: `moira_pc` (`password`, `push`)
holding `audit_zip` (`password`, `push_number_match`, Gordon); `moira_locker` (`pin`,
`push`; in Moira's `unlockable` for the crafted-post test only); `priya_safe` (`pin`,
`code`); `dana_cabinet` (`password`, `push_number_match`, off the critical path); in G2
`records_room` (`rfid`, `push`, Moira). The scenario declares
`logSources` and a `gameClock` so rows can be read, and every beat that asserts rows calls
`assert_ops_log_holds_no_secret`.

**Scripted playtest** (`window.__test`; each beat also checks the captured network answers
and the server record):

| Beat | What happens | Server record and browser afterwards |
|---|---|---|
| B1 | Wrong password at `moira_pc` | Today's refusal; `lockSteps` empty |
| B2 | Right password | `secondStep` answer; no contents in any captured answer; `GET /container` 403; one live record; `mfa_challenge` row |
| B3 | "Send again" until Moira approves | `passed`, then the record gone; `unlockedObjects` has `moira_pc`; contents listed; `mfa_prompt_approved` with `approver: owner` |
| B4 | Right password at `audit_zip`; three requests | Never approved; no file name or text in any answer |
| B5 | Reload; right password again | The same number; no second `mfa_challenge` row |
| B6 | Take Gordon's phone in his ink; "Check phone"; wrong number | Cancelled; record gone |
| B7 | Password again; right number | Archive open; `approvedBy: player`; files readable |
| B8 | Right PIN at `priya_safe`; device route before holding the device; take it; one wrong code, then the right one | 403; `tries` 1; then open |
| B9 | Right PIN at `moira_locker`; the pane opens over the PIN pad; close it with X; right PIN again; pester until Moira approves | After the close: locker shut, the pad's attempt count unchanged, no reject sound, no `item_unlocked`. The second PIN reopens the same live record with the same request count and writes no row; the approval opens the locker |
| B10 | Right password at `dana_cabinet`; requests to the cap | Expired; never opens; nothing shipped. The validator warns that `dana_cabinet`'s step never passes, and the graph draws its dashed edge |
| B11 (G2) | Right card at `records_room`; pester until approved | `roomData` only in the last answer; `unlockedRooms` gains the room then; `mfa_challenge` after the first card, one `badge_swipe` after the last post only |

**Live proof** on the real path, headless, on the keyless server: B2, B3, B6, B7, B8 and B9 for G1
with screenshots of the pane in each frame; B11 for G2. The proof uses the test scenario and
edits no game record. Judge each beat by the server record: the `unlock_object` action emits
`object_remotely_unlocked` before it posts (`apply-actions.js:200`), so a refused gated
object can look open on screen.

## 12. Build steps and shared files

Order: MFA plan M1a to M3 and log L1a and L1b first; then G1; then G2. On landing, A25 goes in
the `README_scenario_design.md` feature index and `docs/ACCESS_AND_NETWORKS.md`, and D6's
`doors[]` line is corrected. Within G1: capture the section 10 `ops_unchanged` fixtures, then server (5.1, 5.2,
section 6, rows) with tests, then client (5.4) with JS tests, then schema, validator, graph,
the feature scenario, B1 to B10 and the live proof. G2 adds 5.3, the other lock types, the
door tests and B11.

| Shared file | This plan's edit | Also edited by |
|---|---|---|
| `game.rb` | `ACCESS_STATE_DEFAULTS`; `resolve_unlock_target` behind `find_scenario_object`; `unlock_object!` (Rule A); `validate_unlock` (`resolved:`, Rule C, the shortcut); the feedback helpers; the marker at `:2999-3010`; the bootstrap allowlist (G2) | MFA plan, privilege and accounts plan, core plan |
| `games_controller.rb` | the gate and the answer's finder in `unlock`; the plain `GET /container` branch and the path through its finders; the room-object take test; the inventory copy; the lock form in the `/mfa/*` actions; the refused-row branch of `unlock` (L1b's `badge_swipe` row), edited to return before the row behind a closed step | MFA plan, log plan |
| `lib/break_escape/mfa_model.rb`, `app/models/break_escape/mfa_access.rb` | the lock constants, `lock_step` and `lock_step_never_passes?` (`held_item_sources` is the MFA plan's); the `object` and `door` subjects | MFA plan (owner) |
| `api-client.js`, `utils/lock-scope-refusal.js`, `systems/unlock-system.js` (G1) | the step in `ApiClient.unlock`; the refusal line; the cancelled guard | none in the ops plans |
| `mfa-client.js`, the `password` scene's second pane, `authenticator-live` | subject keys, `secondStepOnly`, the lock card | MFA plan (owner) |
| `scripts/scenario-schema.json`, `scripts/validate_scenario.rb` (the `require_relative` and run-list lines only), `scripts/generate_dungeon_graph.rb` (no require of its own; it uses the MFA plan's `mfa_model` require), `scripts/lock_key_diff.rb` | section 9; `scripts/validate_lock_step.rb` is new | every ops plan |

## 13. Log rows this feature writes

Every row goes through the log plan's `write_log_row!` (its section "The helper"). A lock's
step writes the MFA plan's eight `mfa_*` events from the same shared functions, and registers
no new event name.

- **`as`** is `{ npc: ownerId }` when the pane names the owner, which it does for every kind
  as planned, and nil for a lock whose pane hides the owner; never `{ account: }` (locks name
  no account). No detail names the owner.
- **`where`** is `{ kind: 'object', id: }` with the found object's `id` (never the posted
  string), or `{ kind: 'door', id: }` with the room id.
- No detail holds a code, a number to match, a password or any first factor.

| Event | When, for a lock | Result | Detail | Bound | Saved by | Stage |
|---|---|---|---|---|---|---|
| `mfa_challenge` | the gate, when it writes a new record | `ok` | `method`: one of `key`, `lockpick`, `rfid`, `biometric`, `bluetooth`, `ble`, `pin`, `password`, `combination`, `cryptex`, `npc` (the methods that can reach the gate) | merged repeats; one per record | the save that stores the record | G1 |
| `mfa_code_ok` | verify, right code | `ok` | none | one per open | the save that sets `passed` | G1 |
| `mfa_code_wrong` | verify, wrong code | `fail` | none | merged; the code caps | the save that stores the counts | G1 |
| `mfa_code_locked` | verify, the code that reaches the thirty-code total | `locked` | none | merged; one per closure | the save that stores `closedAt` | G1 |
| `mfa_prompt_sent` | prompt, each counted request | `ok` | none | merged; the request cap | the save that stores the count | G1 |
| `mfa_prompt_approved` | prompt (owner) or approve (player) | `ok` | `approver`: `owner` or `held_phone` (never `own_phone` for a lock) | one per open | the save that sets `passed` | G1 |
| `mfa_prompt_denied` | approve, Deny or a wrong number | `denied` | none | one per record | the save that drops the record | G1 |
| `mfa_expired` | verify or prompt at the per-record cap | `expired` | none | one per record | the save that drops the record | G1 |

G2 writes the same rows with `kind: 'door'`. The branches not in the table (a wrong first
factor, a repeat against a live record, a stale code, a too-soon request, a 403 or 404, a
refusal by Rule C) write no row, nor does the open that follows a pass. Every call keeps the
default `save_limit: false`: each row rides its branch's own save, and the `mfa_*` events
register no limit. At an `rfid` lock the log plan's `badge_swipe` `ok` row is written
inside the `/unlock` transaction, after the gate: the first right card writes `mfa_challenge`
and no badge row, repeats write nothing, and the final post writes the one `badge_swipe`.

## 14. Cross-plan requests

1. **MFA plan, shared functions and state:** met by the MFA plan's 5.1, 5.2, 5.3 and section 8.
2. **MFA plan, routes** (section 6). The four step routes accept `target_type` and
   `target_id`; `GET /mfa/device` answers when a lock carries `kind: "code"` though no policy
   declares a kind; `GET /mfa/phone` lists a lock request only for a named lock, never in its
   `own=1` form. Its validator's `code_device` owner error (section 9) admits a lock's owner.
   Its "approving from the phone" slice is where lock requests would join (question 4).
3. **Log plan.** Add `door` and `object` to the `places` of the eight `mfa_*` events; register
   the `method` detail key on `mfa_challenge` with the closed code list of section 13; allow
   `{ npc: }` as `as` on those events; say in 5.1's granted `badge_swipe` bullet that the row is
   written after this plan's gate (section 13); stage L1b carries its call site, and its refused-row condition gains `behind_closed_step?` when G1 lands (section 5.1, section 12).
4. **Orchestrator.** Feature id A25; add `test_ops_lock_step` to the brief's feature list; correct D6's `doors[]` line.
5. **Core, privilege and cracking plans.** A password they yield is a first factor and meets
   the step. A plan that opens an object by its own server route uses `record_step_open!` and
   `step_object_open?`, or the validator refuses `secondStep` on that object.

## 15. Open questions for the user

1. **Should an NPC-granted unlock skip the step?** An NPC opens a lock when the browser says
   the conversation got there; the server cannot check that. (a) No: the step is still due
   and the NPC replaces the first factor only; the validator warns. (b) Yes, always. (c) Yes,
   only when that NPC is the step's owner. *Recommend (a).* No client posts `npc` for an
   object today (only doors). Under (b) or (c) any player who has met the NPC can skip the
   step with a crafted request. A flag reward skips it in every option. Written to (a).
2. **Should a door's step be hard-enforced against a propped door (G2)?** A propped door
   skips the step (5.3), and propping is best-effort, so a crafted client can prop a gated
   door. (a) Accept it: an author who needs it hard-enforced gives that door no `prop_door`
   workaround. (b) The validator refuses `secondStep` on a room a `prop_door` targets.
   *Recommend (a):* it keeps a real social-engineering route open. Written to (a).
3. **Which lock types take a typed code?** (a) `password` and `pin` only; other types take
   push kinds. (b) Also `rfid`, `biometric`, `bluetooth` and `ble`, through the code-only pane.
   (c) As (b), and no push on `key` locks. *Recommend (a)* for the first build: the lock
   already has somewhere to type. Written to (a).
4. **Can a held phone show lock requests with no prompt open?** (a) No: a request is approved
   only from the pane the unlock attempt opened. (b) Yes: the phone's own menu lists waiting
   requests; this needs the same for sign-in, a later MFA slice. *Recommend (a).* Written to (a).
5. **Does a passed approval lapse?** It lingers only if the automatic second post fails.
   (a) It waits for a right first factor. (b) It lapses after five minutes. *Recommend (a):*
   it only spares a step already done. Written to (a).
6. **Stages.** (a) G1, then G2. (b) One stage. (c) G1 only until a mission wants a door that
   asks its owner. *Recommend (a):* G1 covers both examples; G2 touches every pad. Written to (a).
7. **A step on something the player carries** (a briefcase an NPC hands over, a start item).
   (a) Refused for now; a file inside a carried container is fine. (b) Allow it, after
   auditing every inventory copy path. *Recommend (a).* Written to (a).
8. **Does a helpdesk re-enrolment of the owner carry to the owner's locks?** (a) No: a lock's
   step always goes to the phone and code device the scenario gives the owner. (b) Yes: the
   lock form gains `own=1` and verify compares against `own:<npcId>`. *Recommend (a):* a work
   sign-in reset reaching a private safe is odd fiction. Written to (a).
