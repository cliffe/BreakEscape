# Ops layer: a second step on any lock (A25)

Stages G1, G2, G3 and G4. Needs stages M1a to M3 of `OPS_MFA_HELPDESK_PLAN.md` (the "MFA plan") and
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

**Holding the owner's phone.** With Gordon's phone (handed over in his story, or taken after a
knock-out) the pane gains "Check phone": the phone shows the archive's request with three
numbers; the player picks the one the archive showed. A wrong pick cancels the request and costs
the password again. For a `code` lock the player types the code showing on the owner's device.

**A carried briefcase.** Gordon hands the player his briefcase. Its PIN is on a sticky note,
but the case still asks Gordon's phone before it opens, wherever the player carries it, and no
crafted request skips Gordon's approval.

What it teaches: a second step can guard one object as well as a sign-in; it is only as good as
the person or device holding it; number matching removes the fatigue route; taking the device
defeats every kind. Nothing behind the lock, at any depth, reaches the browser or opens before
both checks. An owner approves on a count, not a roll. The kind and owner are public; what
satisfies the step is not.

## 2. What the code does today (verified)

**Opening an object.** `POST /unlock` (`games_controller.rb:1211-1335`) calls
`validate_unlock` (`game.rb:4597`), and on a refusal answers 403 or 422 before any write
(`:1228-1253`). On success it runs the released-flag check, the rfid card answer and the
route-room refusal (`:1256-1279`), then inside a transaction calls
`unlock_object!(target_id)` with **the string the browser posted** (`:1315`) and answers
`{ success: true, type: 'object', hasContents, contents }` (`:1317-1330`).
`unlock_object!` appends that string to `player_state['unlockedObjects']` and is the only
writer of the list (`game.rb:691-695`; `:7523` only initialises it).

**Finding an object.** `find_scenario_object` matches an id, a **name** or the client's generated id
`<room>_<type>_<index>`, first match in walk order, through rooms, nested `contents`, account
profiles, share items, held declared grants, held USB sticks, released NPC containers and start
items (`game.rb:4867-4915`, `:5025-5035`). It returns the object alone, with no path, and walks no
room object's `tableItems` (only the payload filter reads them, `game.rb:7287`). A held USB stick is
a fresh copy on every call (`held_usb_sticks`, `game.rb:5011-5020`), so nothing can rely on an
object's identity. `locate_object_in` (`game.rb:4272-4291`) already returns
`{ object:, scope:, path: }` for the scope test. `/unlock` tests the parents only of an object under
a sign-in PC, in a profile or in a share (`login_scope_of`, `game.rb:3182-3203`;
`unlock_scope_refused?` is false with no scope, `:4194-4200`), so a plain nested object's parents
are never tested. The answer then finds the object again with `find_object_in_scenario`
(`games_controller.rb:1318`, `:3048-3104`), which matches id or name only and walks in a different
order.

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

**The client.** Every `/unlock` post goes through `ApiClient.unlock` (`api-client.js:105-119`), which
stamps `clientTs` at dispatch and applies the answer's server writes with it (`:107`, `:117`). Its
posters: `requestRfidAccessUnlock` (`systems/unlock-system.js:177`), the `unlock_object` action
(`systems/apply-actions.js:198-209`), the two NPC door posts, and, through
`unlockWithRouteRoomRetry` (`utils/lock-scope-refusal.js:50-77`), the `password`, `pin`,
`combination`, `cryptex` and `flag-station` pads and `notifyServerUnlock`
(`unlock-system.js:25-50`). The pads count an attempt on a 200 with `success: false`
(`password-minigame.js:1395-1408`, `pin-minigame.js:699-710`) and close a refusal
`lockScopeRefusal` recognises (`lock-scope-refusal.js:20-24`) as cancelled. `notifyServerUnlock`
swallows a rejection and returns nothing, and most of its callers (`unlock-system.js:999` to
`:1526`, `systems/doors.js:699`) pass the answer to `unlockTarget` **without testing `success`**;
`unlockTarget` marks the lock open and emits `item_unlocked` or `door_unlocked`
(`unlock-system.js:1696-1745`).

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

**Lock types and the keyring.** No lock reads the keyring (A15); sign-in at a login PC and
`GET /keyring` do. Cards and fobs, fingerprints and Bluetooth or BLE are separate first factors; none
stands in for another. Fingerprint, Bluetooth and BLE locks are trusted from the browser today
(`validate_unlock` returns true once the method matches, `game.rb:4652-4657`, `:4757-4760`; print
quality is the client's, `:1006-1044`), so on those the second step is the only server-checked part.

## 3. Build stages in order

| Stage | Adds | Done when | Size |
|---|---|---|---|
| G1 | `secondStep` on a locked object with a `password` or `pin` lock (a plain PC, a safe, an archive), all three kinds; the id-keyed gate, the single "is it open" test, the rule for everything below a closed step and the reach test for a carried gated object and everything inside it (Rule D, 5.5: G1 already places a step in a container an NPC carries and on a nested `takeable`); `lockSteps`; the lock form of the `/mfa/*` routes; the step handled once in `ApiClient.unlock`; the pane for a lock; schema, validator, graph, `test_ops_lock_step` | A player types an archive's right password, gets no contents and opens nothing inside it by any route, has the owner's phone approve, and only then sees the files | M |
| G2 | `secondStep` on a room (a door), and on `key`, `rfid`, `combination`, `cryptex`, `biometric`, `bluetooth` and `ble` locks, push kinds only; the door-opener rules of 5.3; the cancelled-step guard in `notifyServerUnlock` and `unlockTarget` | An rfid door stays shut after the right card until the request is approved, and `roomData` is in the last answer only | S |
| G3 | `secondStep` on a top-level item the player carries (5.5): an NPC's `itemsHeld` entry, a start item, a declared grant's item, a `takeable` room object; `secondStep` in the client-forged field list; the carried-item validator rules. Lock types `password` and `pin`, all three kinds; once G2 has landed, G2's types too, push kinds only | A player handed a gated briefcase opens it only through both checks, carrying it or after dropping it in reach; once it has left the inventory and every open room, a crafted request reaches it only after a re-add (5.5), which is a known best-effort route, and a re-added item still needs both checks unless its step had already passed (the step itself is never skipped); dropping and picking it up never resets its request count | S |
| G4 | Rule D extended to plain carried containers (5.5, "Plain carried containers"): `carried_step_chains` also holds each top-level carrier that has a lock or `contents`, and `carried_step_reachable?` runs on any path holding one; the tests of section 11 and the regression runs of the three shipped scenarios it touches. G4 starts by re-making that list mechanically from every scenario rendered through ERB (some `.json.erb` scenarios do not parse as plain JSON), nested carriers included, and runs every scenario on it | After G4, a crafted `/unlock`, `GET /container` or take for a plain carried container that has left the inventory and every open room is refused as an invented id (generic 422, 404 "Container not found", "Item not found in scenario"). A give, a start item, a nested container inside a held briefcase and a dropped item in an unlocked room all still pass. The `ops_unchanged` goldens are unchanged, and the critical paths of `test_unlock_gaps`, `ceo_exfil` and `test_social_m5_channels` still pass | S |

G3 needs G1 only, and lands after G1, before or after G2. G4 needs G1 (Rule D and
`carried_step_chains`) and lands last, after G3. In the build outline these four are
outline stage S8c (after S8b); the stage names here are G1 to G4.

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

**G3.** The same attribute on an item the player carries, here an NPC's held briefcase:

```json
"itemsHeld": [{ "type": "briefcase", "id": "gordon_briefcase", "name": "Gordon's briefcase",
  "locked": true, "lockType": "pin", "requires": "…", "owner": "gordon", "droppable": true,
  "secondStep": { "kind": "push" },
  "contents": [{ "type": "notes", "id": "board_minutes", "name": "Board minutes", "text": "…" }] }]
```

| Field | Values | Meaning |
|---|---|---|
| `secondStep` | object | After the lock's own check passes, the lock asks its owner before it opens. Absent: the lock is exactly as today |
| `secondStep.kind` | `"push"`, `"push_number_match"`, `"code"` | As the policy kinds of the MFA plan, without `none` |
| `secondStep.owner` | NPC id | Whose phone gets the request, or whose code device gives the code. May be left out on an object whose `owner` is one NPC id; required on a room, and on an object with no `owner` or several |

**Where it may sit.** G1: a room object or a `contents` entry at any depth (in a plain
container, under a sign-in PC, in a profile, a share, a held declared grant or a container an
NPC carries), with `locked: true`, an `id`, and `lockType` `password` or `pin`. A `takeable`
object nested in `contents` may carry it: it can be taken only once every step above it is
open, its inventory copy keeps `locked: true` and loses its `contents`
(`games_controller.rb:3328-3331`, `game.rb:7229-7232`), and opening it from the inventory meets
the gate as anywhere else. G3: also on a top-level item the player can carry, by the rules of
5.5: an NPC's `itemsHeld` entry, a start item, a declared grant's item, or a `takeable` room
object. Never inside a
`usb` item's `contents` (a held stick is served as a fresh copy) and never on or inside a
`tableItems` entry (no finder walks them). G2: a room with `locked: true` that is neither the start room nor an
awareness world room. Never a `doors[]` entry.

**Kinds per lock type.** `password` and `pin` take all three kinds (objects
in G1 and G3, rooms in G2); `key`, `rfid`, `combination`, `cryptex`, `biometric`, `bluetooth` and
`ble` take the push kinds only (G2). A typed code needs somewhere to type it, and only those two
locks have one.

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
opened past its gated parent. Rule D (5.5) runs with Rule C at every exit below, on the same
path. Each place an object can be opened or its contents can leave the server:

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
   first, then Rule D (5.5) on the same path and object. For a resolved object that carries `secondStep` and is not open by Rule B, it judges
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
   method, so an NPC's `unlockable` or `unlockDoor` stands in for the first factor (the card,
   key, PIN or password) only and the step is still due, even when that NPC is the step's owner; the validator warns
   (section 9). Of the methods, only a claimed flag reward skips it. Otherwise:
   - a live record that has not passed is answered again from the record, with no write and no
     log row (repeating the first factor, or reloading, costs no save and cannot reset the
     request count). The one exception is the NPC grant (5.3): an accepted `npc` post for a
     door writes it here too, as one small write with no row and no request count, whenever the
     grant is absent or names another NPC. This is the lock caller's own logic: it reads `kind` and `nonce` from the
     record and recomputes the number with the MFA plan's pure
     `numbers(key, game_id, <record key>, npc_id, record['nonce'])`;
   - else the shared challenge function writes a new record, adds 1 to
     `mfaAccounts[owner].started`, writes `mfa_challenge` and saves.
   The answer is 200 `{ success: false, secondStep: true, kind, targetType, targetId, npcId,
   number?, opener? }`, `targetId` being the object's id, `npcId` the step's owner and `opener`
   the grant's value after any write above (doors only, 5.3), also on a re-answer from any
   method; on a keycard post with a grant already held it is the grant's NPC, not the poster. Nothing is unlocked; no
   `contents`, no `roomData`.
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
judges reach, so the `/mfa/*` routes need no reach test of their own, except Rule D (5.5).

**What a subject supplies.** The shared functions take `{ kind: 'object' | 'door', id: }`;
the MFA plan's subject-rules table (its 5.2) sets what a non-sign-in subject does. The
lock-only values:

| | A lock |
|---|---|
| Record | `lockSteps["object:<id>"]` or `["door:<roomId>"]` (the key `PinDust` uses, `pin_dust.rb:77-80`): the pending record's fields plus `'passed'?` |
| Code compared against | the owner's own `code_device` item, always, never `own:<npcId>` |
| Phone that may approve | the owner's held phone only; a lock's routes never read `accountResets`, so a helpdesk re-enrolment of the owner never reaches the owner's locks: the lock always uses the phone and code device the scenario gives the owner |

Shared and unchanged: the five-minute record life, the gap between requests and their cap, the
owner's patience `mfaPrompts[npcId]` (worn down by sign-in and lock requests alike), the
held-device and held-phone tests, the once-per-window code rule and `numbers`, to which a
lock passes its record key. No lock is stranded by its counts: five wrong codes drop the
record, and the thirty-code closure lifts after five minutes.

### 5.3 Doors (G2)

`lock_step` is read from the room. The client learns that a door is gated through three
copies, and each needs the field, or `lockRequirements.secondStep` is undefined at a door and
the early toasts of 5.4 still fire:

1. **Bootstrap.** `filtered_scenario_for_bootstrap` (`game.rb:2390`) copies door fields through
   the allowlist at `game.rb:2425-2427`. G2 adds `secondStep` there, copying `kind` and `owner`
   only, so a later author field under `secondStep` cannot ride the room payload. The same
   method adds `npcStepOpener: <npcId>` to a room's fields when `npcStepGrants["door:<roomId>"]`
   holds one and the room is not in `unlockedRooms` (it already reads `player_state` at
   `:2400`). A door opened without the step (a flag reward, a propped door) leaves the grant
   behind, and this test keeps the bootstrap from sending it for an open room.
2. **`doors.js` `doorProperties`** (`systems/doors.js:518-540`) copies fields one by one
   (`access`, `acceptsUIDOnly` at `:530-531`). G2 adds `secondStep` and `npcStepOpener` beside
   them, read as `lockProps.x ?? connectedRoomData?.x ?? null`.
3. **`getLockRequirementsForDoor`** (`systems/unlock-system.js:1594`) builds a fixed object at
   three places: the `doorProperties` return (`:1600-1608`), the scenario fallback's
   `overlappingRooms.push` (`:1644-1655`) and its return (`:1665-1673`). G2 adds both fields to
   all three.

The rfid direct-card and clone branches need neither field: their toasts already sit in a
`.then` after `ApiClient.unlock`, which settles only after the step, so testing `success` is
enough there.

**NPC grant.** When the gate accepts an `npc` first factor for a gated door, it writes
`npcStepGrants["door:<roomId>"] = npcId` and deletes it when `record_step_open!` opens the
door. A new record is saved with the grant in the same save. On a re-answer from a live record
(a keycard started it, then an NPC's ink posts `npc`) the gate still writes the grant when it is
absent or names another NPC: one small write, no row, no request count, so a reload finds the
client and server agreeing. The grant is server-only state: it is never in a sync body and
nothing re-sends it; the browser learns it as a delta, in the answer and, after a reload, the
bootstrap. It is what lets the player retry the step without the conversation (5.4). It holds
nothing the browser has not been told: the `secondStep` answer to that `npc` post carries
`opener`, the grant's value after the write, and the client sets `npcStepOpener` from it at once
(5.4 names the writer). A deny, an expiry or a closed pane drop `lockSteps`' record, never the grant. Objects
get no grant: no client posts `npc` for an object (section 2), and a crafted one is refused at
the gate as before.

Ways a door opens, and whether each meets the step. A propped door skipping the step is
accepted: an author who needs a door's step hard-enforced gives that door no `prop_door`
workaround, and propping stays a social-engineering route.

| Opener | Path | Meets the step? |
|---|---|---|
| The lock's own credential | `/unlock`, `serve_opened_room` (`games_controller.rb:1298`) | Yes, at the gate |
| An NPC's `unlockDoor` mapping or `unlockable` | `/unlock` with `method: "npc"` (`game.rb:4623-4626`) | Yes: the browser asserts it. The NPC stands in for the first factor, and a retry from the door re-posts the same `npc` claim, judged by today's NPC checks (`npc_mapping_unlocks_door?`, `validate_npc_unlock`) |
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
  `secondStep: true`, it does not return it. It hands the answer, with the request it just sent,
  to `MfaClient.runLockStep`, which opens the pane and waits. When the step passes, `finishLock`
  posts the same body again through `ApiClient.post('/unlock', …)`, not through
  `ApiClient.unlock`, so it never re-enters the step handler. It takes a fresh
  `stateSync.nextClientTs()` at that dispatch and applies the answer's server writes with it, so
  syncs made while the pane was up do not outrank the open. `ApiClient.unlock` resolves with that
  answer, and the caller sees one ordinary answer. There is one re-post per pass: if it answers
  `secondStep: true` again (the passed record was lost), it rejects as a cancel and the player
  starts over. When the player closes the pane, or the request is denied or expires, it rejects
  with a 403-shaped error whose `body.reason` is `second_step_cancelled` and whose
  `body.closedByPlayer` is `true` for the player's own X and `false` for a deny or an expiry.
  The request is held in that closure only, never stored. `ApiClient` reaches
  `window.MfaClient` as it reaches `window.stateSync`, so it gains no static import.
- **One cancel rule for every caller.** A deny or an expiry (`closedByPlayer: false`) plays the
  reject tone once and shows the UI line "Not approved."; the player's own X
  (`closedByPlayer: true`) plays and shows nothing, as the pads already treat a player's close
  (`minigame-starters.js:613-616`, `:672-673`). `MfaClient.cancelFeedback(error)` does both, so
  no caller writes its own line or tone. Neither counts an attempt nor emits
  `door_unlock_failed`.
- **The wait for a conversation lives in `MfaClient.runLockStep`.** The pane does not open over
  a chat: a pane over a talking NPC would hide the conversation that caused it. For a request whose
  `method` is `npc` (the person chat's `handleUnlockDoor`, `person-chat-conversation.js:447`;
  the ink `unlock_door` action in `chat-helpers.js:99-121`, shared by the person and phone
  chats; an `eventMappings[].unlockDoor`, `npc-manager.js:1886-1893`, fired under any scene or
  none), it opens the pane only when no scene is open and no chat return is pending. Clear means
  all three of: `window.MinigameFramework.currentMinigame` is null or has `_ending` set;
  `window.pendingConversationReturn` is null (set when a chat suspends itself for its own child,
  the NPC inventory at `npc-game-bridge.js:384` or the card copier at `chat-helpers.js:434`, and
  cleared by `minigame-manager.js:429-433` and `:455-474`); and `window.gameConfirmOpen?.()` is
  not true; `window.playerIsKnockedOut?.()` must also be falsy. It checks at once. If the first
  check is clear and no chat return is pending (nothing was ever open), the pane opens
  immediately with no toast. Otherwise it re-checks every
  `MinigameFramework.CHAT_RETURN_SETTLE_MS` (400 ms, `minigame-manager.js:446`) and opens on
  the second clear check in a row, so the 100 ms container reopen and a chat coming back are
  not taken for clear. A request that passes `{ fromDoor: true }` (the retry below, which has
  no conversation by definition) skips the wait and checks once; if that single check is not
  clear (a confirm dialog open, a chat return pending, the player knocked out) the request
  settles as a silent cancel (`closedByPlayer: true`), and it never queues behind a request
  that is waiting for a screen to close. A null return from
  `startMinigame` (it refuses while the player is knocked out) is a silent cancel
  (`closedByPlayer: true`), so the request's promise always settles. It does not listen for
  `conversation_closed:<npcId>`: `cleanup()` emits that (`person-chat-minigame.js:2117-2127`)
  when the chat suspends for a child too, and the phone ringer skips it on some paths
  (`phone-ringer-dom.js:486-537`). When the first check is not clear, `MfaClient` shows the UI
  toast "Second step pending. It opens when you finish here." once (engine UI text, not an NPC
  line). The wait has no timeout; a reload drops it, and the retry below picks it up. Every
  other method opens the pane at once, over its own pad or copier or alone.
- **One pane at a time.** `runLockStep` serialises on an open pane only: a request that is
  ready to open (any non-`npc` method, a `fromDoor` retry, or an `npc` request whose clear check
  has passed) is queued behind the pane that is open, if any, and behind nothing else. A request
  that is waiting for a screen to close holds no place in the queue: a pad's own step opens at
  once over its pad even while an event-mapping `npc` request waits under that pad, and the
  waiting request, once its scene is clear, queues behind any pane then open. Two `#unlock_door`
  tags in one knot, or a tag plus an event-mapping `unlockDoor`, give two panes in turn. A pane
  is never ended to make room for another, so no door reports "Not approved." that the player
  did not cause.
  When a queued request reaches the head and its clear check passes, `runLockStep` re-posts that
  request's `/unlock` body once before it opens the pane, and acts on the fresh answer, not the
  one it was queued with (a live record re-answers with no write and no count, section 5.2).
  A fresh `success: true` settles the request as a pass with no pane (the target was opened
  meanwhile, for example by the same door's earlier request; the door retry then calls
  `unlockTarget` and the bridge emits `door_unlocked_by_npc` once, as above). A request whose
  target is already open in the client (the client-sees-unlocked check) is dropped quietly as a
  silent cancel, so no error pane opens on an open door. A fresh `secondStep` answer opens the
  pane on its record, which is a new record if the old one expired while another pane was up.
- **What each caller does with it.** The pads that call `lockScopeRefusal` (`password`, `pin`,
  `combination`, `cryptex`, `flag-station`) already close a recognised refusal as cancelled with
  no attempt counted and no reject sound; `second_step_cancelled` joins that table, and the line
  and tone come from the cancel rule above. `notifyServerUnlock` returns `{ success: false, secondStepCancelled: true }` for
  that error, and `unlockTarget` returns at once on such an answer, so the callers that pass the
  answer untested (section 2) mark nothing open and emit no `item_unlocked` or `door_unlocked`.
  The pad callbacks (`unlock-system.js:1187-1240`) already call `unlockTarget` only on success.
  `requestRfidAccessUnlock` (`unlock-system.js:166-189`) gains an outcome: a rejection whose
  `body.reason` is `second_step_cancelled` returns
  `{ outcome: 'second_step_cancelled', response: body }` before the `uid_only`/`denied` test at
  `:183-184`; any other rejection with a status stays `denied`. The NPC door posts are below. The
  `unlock_object` action never receives one: its only source that passes
  `validate_unlock` for a locked object is `flag_reward`, which the gate skips. All of this is
  inactive for an answer without `secondStep: true`, and G1 lands it whole.
- **No success before the final answer.** The client knows a lock is gated from the
  `secondStep` field it already holds (section 7, and 5.3 for doors); nothing new is sent for
  this, and the door fields are 5.3's. On
  a gated lock nothing says "opened", plays a release sound or completes a task until the final
  answer has `success: true`; a cancel follows the cancel rule. A lock without the field behaves
  as today. The sites:
  - Bluetooth: the alert fires as the post is sent (`unlock-system.js:1339-1343`). It moves into
    the `.then`, after a `success` test.
  - rfid clone and direct card: `door_release` and the alert run in a `.then` with no `success`
    test (`:1478-1482`, `:1526-1529`). Each gains the test.
  - Key and lockpick: the toasts are raised by the starters in their `onComplete`, which has no
    server answer: `minigame-starters.js:232-234` (the lockpick scene, pick and key modes),
    `:481` (key selection), and the no-framework fallbacks `:83` and `:257`. Each starter calls
    `expectContainerAfterUnlock` at the same moment (`:230`, `:480`). On a gated lock the starter
    skips both, and the `unlock-system.js` callbacks raise them after `notifyServerUnlock`
    answers `success: true`: the lockpick callback (`:1153-1163`, whose "No toast here" comment
    then holds for ungated locks only) and the key selection's `unlockWithServerNotification`
    (`:1119-1122`).
  - Fingerprint: on "accepted" the reader plays `confirm`, shows "You unlocked the <type> with
    <owner>'s fingerprint." ("Biometric Unlock Successful") and calls `expectPanelWithin`
    (`minigames/biometrics/fingerprint-reader-minigame.js:241-256`, and `:291` for a close during
    the hold), all before `unlock-system.js:1299` posts. On a gated lock the reader plays
    `confirm` and shows "Print accepted." (true at that point), skips both `expectPanelWithin`
    calls, and the biometric callback (`unlock-system.js:1298-1302`)
    shows the "unlocked" toast after `success: true`.
  - BLE: on pairing the scanner emits `task_completed_by_npc` for the object's `completesTask`
    and writes `onPairSetGlobal` (`minigames/ble-scanner/ble-scanner-minigame.js:593-610`) before
    `unlock-system.js:1376` posts. On a gated lock the scanner skips both, and the BLE callback
    (`:1374-1378`) applies them after `success: true` through one helper,
    `applyBlePairEffects(scenarioData)`, exported from the scanner module and used by both. So a
    task and its globals move only when the lock opens.
- **The card copier and the access list.** `requestRfidAccessUnlock` has two callers, and the
  pane opens differently under each.
  - **STEP 2, held keycards** (`unlock-system.js:1543-1565`): the keycards are posted directly
    with no copier open (`:1549`), so the pane opens alone. A new first branch in the `.then`:
    on `second_step_cancelled`, the cancel rule only. No reject tone of its own, no
    `door_unlock_failed`, no copier, and the right keycards are not passed as
    `refusedKeycards`, which the branch at `:1553-1559` would otherwise do. `showAccessRefusal`
    (`:1505-1518`) gains the same branch before its `else` ("Failed to verify access",
    `:1515-1516`), so no future caller reports a cancel as an error.
  - **The copier** (`startRfidReader({ accessList: true })`, `:1456-1495`): each Emulate or tap
    posts through `params.requestAccess` (`:1489`), and the answer is handled in
    `rfid-minigame.js` `_askAccessList` (`:322-384`), not in `showAccessRefusal`. The pane
    suspends the copier, so the instance waiting on the answer is no longer live (`_isLive()`,
    `:308`). On a cancel it returns silently at `:351-354`, which is what is wanted: the copier
    comes back as a fresh instance through `returnTo` with no card marked refused, and the line
    and tone come from the cancel rule. For safety a live instance gets a
    `second_step_cancelled` branch before the denial (`:372-383`): back to the card list, no
    tone, no `card_emulated`, no `_showDenial`, so no `onRefused` and no `door_unlock_failed`.
    On a pass the not-live instance takes the late path (`:351-353`, `onLateAccessUnlock` at
    `unlock-system.js:1492`, `applyRfidAccessUnlock(…, { late: true })` at `:1434-1450`), which
    closes the returned copier with `complete(false)` and calls `unlockTarget`. On a gated lock
    the late call passes `autoOpen: true`: the player has done nothing since approving, so a
    gated container opens as it would from a direct card.
- **An NPC's door unlock.** All three `npc` posts (above) wait for the conversation as
  described. On a pass the door opens through the caller's existing success branch (the bridge's
  own success path for the chat and event-mapping callers). A cancel no
  longer becomes a failure: `NPCGameBridge.unlockDoor`'s `catch` (`npc-game-bridge.js:165-174`)
  returns `{ success: false, secondStepCancelled: true, roomId, npcId }` for a
  `second_step_cancelled` error in place of `error: error.message`. `chat-helpers.js:104-117` and
  `handleUnlockDoor`'s `catch` (`person-chat-conversation.js:483-486`) show nothing for it (the
  cancel rule has already spoken, and the chat's `ui` may be destroyed); the event-mapping
  caller logs it. No "Failed to unlock" line appears for a cancel.
- **Retrying an NPC-opened step.** "Walking away" means the step ended without a pass while no
  conversation is open: the player's X on the pane, a deny, an expiry, a reload during the wait
  or with the pane up, or a knock-out. Each leaves the door shut and `npcStepGrants` holding the
  opener (5.3), and `doorProperties.npcStepOpener` set, from the `secondStep` answer at once or
  from the bootstrap after a reload.
  - **Who writes the field.** One writer: `MfaClient.runLockStep`, on a `secondStep` answer
    that carries `opener` and `targetType: 'door'`, sets
    `window.gameScenario.rooms[targetId].npcStepOpener` and the field on every sprite from
    `NPCGameBridge._findAllDoorSpritesForRoom(targetId)` (`npc-game-bridge.js:184`). The `npc`
    post has no sprite of its own, and zero, one or two sprites may lead to the room. A sprite
    built later reads the field from `gameScenario.rooms` (5.3), as does the scenario fallback
    of `getLockRequirementsForDoor`.
  - **The retry.** The next interaction with that door retries the step without the
    conversation: in `handleUnlock` (`unlock-system.js:973`), after `lockRequirements`
    (`:992-994`) and the client-sees-unlocked check (`:1014-1031`), a door whose
    `lockRequirements` carry both `secondStep` and `npcStepOpener` posts directly, in place of
    its lock-type branch:
    `ApiClient.unlock('door', unlockTargetId(lockable, 'door'), npcStepOpener, 'npc', {}, { fromDoor: true })`.
    The sixth argument is new, is handed to `runLockStep` and is never posted (the fifth,
    `extra`, is spread into the body). The target is `doorProperties.connectedRoom`, the locked
    room (`unlockTargetId`, `unlock-system.js:55-58`); `doorProperties.roomId` is the room the
    sprite sits in. `ApiClient.unlock` rejects on a cancel; it never resolves with
    `secondStepCancelled` (that field is made by the bridge's `catch` and `notifyServerUnlock`,
    which the retry does not use), so the retry handles the rejection itself:
    `.then(response => { if (response?.success) { unlockTarget(lockable, 'door', lockable.layer,
    response); emit door_unlocked_by_npc } })` and `.catch(err => { if
    (err?.body?.reason === 'second_step_cancelled') { MfaClient.cancelFeedback(err); return; }
    console.error(…); window.gameAlert('Failed to verify access', 'error', 'Error', 3000); })`.
    A cancel at the door therefore raises no unhandled rejection and no failure alert (the line
    and tone come from `cancelFeedback`, as for every caller), and a network error, a 500 or a
    lost-record re-post shows the alert the sibling branches of `handleUnlock` show
    (`unlock-system.js:1003-1006`, `:1024-1027`). On `success` `unlockTarget` opens the sprite
    from the answer's `roomData` and `door_unlocked` fires. The retry does not go through
    `NPCGameBridge.unlockDoor`, whose success path never calls `unlockTarget`.
    **`door_unlocked_by_npc` fires exactly once per open of a gated door, from whichever path
    opens it.** Scenarios key state on it (m10's `breach_open`, `inner_door_open`,
    `stair_open`, `gallery_open`, `outer_lock_open`; m09's `cage_opened`, all `setGlobal`
    mappings; `objectives-manager.js:348` also listens), so it must not depend on whether the
    player closed the pane once. When the step passes inside the conversation path (the first
    post's promise resolves), the bridge emits it as today (`npc-game-bridge.js:136-143`) and
    the retry never runs. When the first post's promise was cancelled, so the bridge never
    emitted, the retry's pass emits it, with `{ roomId, npcId: npcStepOpener, source: 'npc',
    retry: true }`; the two paths are exclusive for one open. A mapping that plays a bark can
    add `!data.retry` to its condition to keep the bark off a door the NPC is not at. A door
    with no second step keeps today's timing exactly: the bridge emits on its own success, the
    gate and the retry are not involved. The bridge change stays limited to its `catch`. The server judges the `npc`
    claim with today's checks and the gate answers from the live record (same pane, same
    number) or starts a new challenge. The NPC's grant stays best-effort, as any `npc` post is
    today; the step stays server-checked. Both server checks are static (the mapping check has
    no encounter test, and `encounteredNPCs` only grows), so a claim accepted once is not
    refused later and the retry has no fallback path.
- **The pane** is the second pane of the `password` scene. A `password` lock swaps to it in
  place. Any other pad (or the card copier) stays open beneath and the scene opens over it as a
  child with `secondStepOnly: true`; with no pad (key, lockpick, a direct card, a copy played
  back outside an access list, whose branch closes the copier before it posts at
  `unlock-system.js:1470-1483`, a biometric or wireless lock, the STEP 2 keycards, or an NPC's
  door once the scenes are clear) it opens alone. It sits under the lock's name, in the monitor
  frame for a `pc` and the plain lock frame otherwise, VT323 text, 2px borders. X closes it and
  sends nothing; the server record lives out its five minutes, so a retry inside them reopens
  the same request.
- **The phone and the device** are the MFA plan's scenes, opened only from the pane ("Check
  phone", "Use device") as its children. `authenticator-live` draws the one request for this
  lock as a card with the lock's name and the owner's headshot. **A held phone opened from
  the inventory lists no lock request**: a pending lock request is approved only from the
  pane the unlock attempt opened, by the owner or by the player on the owner's phone while
  that pane is up; the phone's own menu never lists waiting requests. The pane that comes back after a child is a new
  instance; it asks `MfaClient.takeCompleted(subject)` first (for a lock, the pass answer a
  child received, handed out once), and on a pass calls `finishLock(subject)`. A child forced
  shut clears it, as for sign-in.
- **After a reload or a closed pane** the held request is gone. The player gives the first
  factor again (for an NPC-opened door, the retry above gives it): a `passed` record opens the
  lock, a live one reopens the same pane with the same number, an expired or denied one starts a
  new challenge.
- **Events** `mfa_required`, `mfa_prompt_sent`, `mfa_approved` and `mfa_failed` are emitted by
  `MfaClient`, as for sign-in, with `targetType` and `targetId` in place of `pcId`, so a
  scenario maps the owner's bark the same way. A lock never touches `pc-sessions.js`.

### 5.5 Carried items

A **carrier** is an object the player can hold: an NPC's top-level `itemsHeld` entry, a start
item, a declared grant's item or any `takeable` object. A gated object is **carried** when it,
or an object above it, is a carrier. The walk that builds `second_step_ids` also builds
`Game#carried_step_ids`, the carried ones, and `Game#carried_step_chains`, for each of them
the ids of every carrier at or above it, outermost first, each tagged with its home (`npc`,
`start`, `grant`, `room` for a top-level room object, `nested` for a `takeable` inside
another object). Both come from the scenario only and are memoised the same way. G1
places a step inside a container an NPC carries, inside a held declared grant and on a nested
`takeable`, so Rule D below lands in G1; G3 adds the top-level placements (an NPC's held
briefcase, a start item, a grant's item, a `takeable` room object) and their validator rules
(section 9).

**Where the state lives.** Every inventory path stores or resolves the object's authored id,
and the server never resolves an inventory copy for `/unlock`. `find_scenario_object`
(`game.rb:4867-4916`) walks rooms (the scenario copy, ignoring `objects_removed`), profiles,
shares, held grants (`held_grant_items`, `:4969-4980`, only while held), held USB sticks,
released NPC containers (`released_npc_containers`, `:4945-4959`, the scenario copy once a give
or knock-out record releases it) and start items (`:4909-4914`, the authored copy);
`find_container_in_scenario` (`games_controller.rb:3000-3025`) walks the same homes except
profiles and shares, which `GET /container`'s scope branches find (`:641-669`). So the
record `lockSteps["object:<id>"]` and the id in `unlockedObjects` follow the item through
every move. No copy holds step state, no inventory path writes, moves or resets a record, and
nothing is added to `player_state` for carried items: the inventory copy carries only the
public `secondStep` it already has (section 7).

**Every inventory path.**

| Path | Where | The step on the move | Risk and answer |
|---|---|---|---|
| Start inventory | `game.rb:7532-7555` (a filtered copy); a re-add is always valid (`games_controller.rb:3373-3382`) | the copy keeps `locked` and `secondStep`; `contents` and `requires` stripped | a crafted re-add of a held item answers `already: true` (`:1416-1425`); the same record either way. A re-add after the item has gone is accepted (below, "Re-adds") |
| Pick-up from a room | `POST /inventory` add (`games_controller.rb:1400-1452`), `validate_item_collectible` (`:3335-3491`), `canonical_inventory_item` (`:3315-3333`, a server copy, `locked` cleared by id only); the room records `objects_removed` (`game.rb:1225-1262`) | kept | none new |
| Pick-up from a container | the same route; the container tested by id, or by name when it has none (`:3424-3430`); one level into a room object (`:3660-3666`); released NPC containers (`:3688-3695`) | kept | for a gated container Rule B replaces the name test (5.2) |
| An NPC's give in ink | `chat-helpers.js:126` to `NPCGameBridge.giveItem` to `addToInventory` (`systems/inventory.js:753`, posting `source_npc_id`, `:856`); server priority 0.5 (`games_controller.rb:3617-3640`), then `record_npc_gift!` (`game.rb:817-834`) | kept (the scenario copy, filtered) | before the give the item resolves nowhere for `/unlock`, so no record can start before a give; a give is the browser's word (a post with `source_npc_id` needs only an encountered NPC, `:3449-3462`) |
| A declared grant (action `give_item`) | `apply-actions.js:249-266`; the grant branch (`games_controller.rb:3384-3400`); `contents` stripped (`:3324-3327`) | kept | resolves only while held, so a dropped grant item resolves nowhere until it is picked up again; the validator refuses `droppable: true` on a gated grant item (section 9) |
| Taking from an NPC's inventory | the NPC-mode container (`container-minigame.js:2380-2400`, `:2579-2650`), the same add route with `source_npc_id`; no separate pickpocket route | kept | a click on a locked item still in the NPC's hands goes to the unlock path (`:2302-2304`) and resolves nothing: the invented-id 422 |
| Knock-out drop | `add_object`, NPC branch (`game.rb:1077-1138`): the full held definition, authored id, into the room's `objects_added` | on the server only; the room filter drops a locked object's `contents` (`:7226-7232`) | picked up through priority 0 (`games_controller.rb:3605-3615`), then the canonical copy: none new |
| Player drop | `item-drop.js` (`add_object` with `player_drop`, then an inventory remove); the server needs `droppable: true` and stores the held copy under the same id (`game.rb:1143-1167`) | kept | neither the drop nor the pick-up touches `lockSteps`: the request count never resets |
| Put in a container | no route stores a held item in a container | | none |
| NPC carry (needs) | `carriable_object?` (`game.rb:1365-1376`) refuses `locked`, `lockType`, `requires` and `contents` | never carried | none |
| Removed, consumed, planted, hidden | `remove_item` (`apply-actions.js:274-293`), `consumables.js`, the inventory `remove` (`games_controller.rb:1454-1460`, `remove_inventory_item!` at `game.rb:845-850`, by id with no other check), `hide` (`:1462-1473`), and two server routes that skip `remove`: the network jack plant (`network_access.rb:262`) and the USB implant (`:516`). The validator refuses neither a gated `rogueDevice` nor an item an implant's `needsHeld` names; Rule D reads membership, so it holds for both | the item leaves; its record stays under its id | a nested `takeable` returns to its container, listed and takeable again, as today (`filter_container_contents` hides an item only while it is in the inventory, `games_controller.rb:3235-3258`); a top-level carrier does not. **Stale reach**: the released-container and start-item walks still resolve a top-level carrier after it has gone. Rule D |
| Flag-station reward | a flag station's `itemsHeld`, handed over on a flag and re-collected through the `flag_station` location (`games_controller.rb:3476-3485`) | | no walk covers it, so the validator refuses `secondStep` there (section 9) |
| Card copier | `clone_card` (`games_controller.rb:1655`) copies keycards into `saved_cards`, not inventory objects | | a keycard inside a gated case is taken only once the case is open, by id |
| Copy transfer (sign-in desktop, share) | `record_copied_item!` (`game.rb:4258`; `games_controller.rb:1448`, only for `transfer == 'copy'`) | one id, two copies | the copies share one record and one `unlockedObjects` entry (below) |
| Reload and bootstrap | `GET /scenario` sends `client_inventory` (`game.rb:1774-1783`, `filter_inventory_for_client!` at `:1902-1922`); the stored copy keeps `locked: true` after an open, and a reopen goes through `/unlock` "already open" by id | `secondStep` kept; `lockSteps` server-only | none new |
| Dedupe | `inventory_includes?` by id, else type and name (`game.rb:704-717`) | | a gated item always has an id (section 9) |
| A client-built object | a client-added object gets a fresh id and loses `FORGEABLE_ITEM_FIELDS` (`lib/break_escape/item_identity.rb:28-32`, `game.rb:1183-1196`) | | `secondStep` joins that list (below) |

**Rule D, reach.** `Game#carried_step_reachable?(object, path)` is a path rule beside Rule C.
It is true, and Rule D does nothing, when neither the object nor any object on its path has an
id in `carried_step_ids`: an object with no gated carried object at or above it resolves
exactly as today. Otherwise it takes the chain of the deepest such id (`carried_step_chains`)
and adds any `takeable` object on the path below that one, or the object itself when it is
`takeable`, read by id from the path; so the contents of a gated briefcase are judged by the
briefcase's chain. It then decides in two legs:

1. **Held or dropped, innermost first.** Walk the chain from the innermost carrier outward.
   The first carrier the player holds (`ItemIdentity.held_in?` by id, client-added items
   excluded as `held_grant_items` excludes them, `game.rb:4975`) or has dropped (a copy with
   that id in the `objects_added` of a room for which `Game#room_unlocked?`, `game.rb:141-143`,
   holds: in `unlockedRooms` or the start room; a route room in `npcRouteRooms` does not
   count, and an awareness world room counts once its first `GET /room` has added it to
   `unlockedRooms`, `games_controller.rb:581-591`) makes the test true. Everything below that carrier is where
   it was put: a nested `takeable` that left the inventory is back in its container, as the
   engine lists it today.
2. **In its authored place.** When no carrier on the chain is held or dropped, the outermost
   one decides by its home. A `nested` carrier (a `takeable` inside a room object, under a
   sign-in PC, in a profile or in a share) is in place: the test is true and the route's
   existing reach tests decide with their own answers, as today: the room test, Rule B for
   each gated container above, `path_unlocked?`, and `session_admits?` or the folder route
   for a sign-in PC, a profile or a share (`GET /container`'s scope branches,
   `games_controller.rb:641-669`, `unlock_scope_refused?` at `game.rb:4194-4200`, and the
   transfer routes already apply them). A `room` carrier is in place while its id is not in
   its room's `objects_removed`, and the room test then decides. An `npc`, `start` or `grant`
   carrier has no place in the world once it has left the player's hands, so the test is
   false. An NPC-held item that no give or knock-out has released resolves nowhere in any case.
(From G4 the trigger also includes plain carriers, below.)

When the test is false the object is refused as an invented id, and the refusal comes from
the closed lists only: the generic 422 at `/unlock` (beside Rule C in `validate_unlock`, so no
first factor is judged and no feedback helper answers), 404 "Container not found" at `GET
/container`, "Item not found in scenario: <item_type>" at the take routes (`games_controller.rb:3406`), and
the `/mfa/*` 404 for the lock form, so a pane left up after the item has gone closes as an
expiry. Nothing is written, and the record stays as it was.

**Where it runs.** Rules C and D run straight after the finder at every exit of 5.2's table,
before any test that answers 403 or 422 with the item's name: before `check_container_unlocked`
(`games_controller.rb:3119-3126`) and the scope branches' 403s at `GET /container`, before the
take route's takeable test ("Item is not takeable: <name>", 422), "Container not unlocked" and
room tests (`:3416-3437`) and the sign-in desktop and share take tests, in the inventory copy
builder, in `validate_unlock`, and in the `/mfa/*` lock form's hook (section 14, item 2). So a gone,
unopened briefcase answers 404 and never a 403 that tells the player it exists, and a
non-takeable object inside it never gets the takeable answer, which carries its name: Rule D's
refusal at a take route is the closed-list "Item not found in scenario: <item_type>" (`games_controller.rb:3406`, the type the request sent,
byte for byte as today), with no name in it. An
object in its authored place passes Rule D and meets the 403s as any object does today. At the
take routes and the copy builder the item being taken is not held yet, so Rule D judges the
item's own carrier chain minus the item itself. The trigger is as above (the item or any object
on its path has an id in `carried_step_ids`); take the chain of the deepest such id, the item
included when it is takeable; drop the item's own entry; an empty chain is true. A give, a start
item and a grant item have only themselves in the chain, so they pass to their own add branch,
as today. A gated item inside a briefcase that has gone is judged by the briefcase, so it is
refused even though the item itself was never the one removed.

**Re-adds.** Rule D reads inventory membership, and four existing add paths put a gone item
back with no record that it left: a start item (`validate_item_collectible` accepts one
always, `games_controller.rb:3373-3382`), a declared grant (claimable at any time,
`:3384-3400`), an NPC give (`source_npc_id` with an encountered NPC, `:3449-3462`) and a
`takeable` room object (`find_accessible_item`'s priorities 1 and 2 never read
`objects_removed`, `:3642-3666`). These are known best-effort routes in today's engine, under
the project's cheat-resistance policy: the server hard-enforces secrets, keys and forged items,
and some steps stay best-effort. A re-added item keeps its step record, which no inventory path
writes or resets, so the owner's approval is still needed unless the step had already passed;
a crafted re-add never skips the step. A take of an item that sits inside a gone carrier is
not one of these routes: Rule D judges the carrier chain above the item (the briefcase's
release record and `unlockedObjects` entry do not make the item reachable), so it is refused.
The server does not track removal, so these re-add routes stay known best-effort routes, and
the step itself is never skipped.

**Plain carried containers (G4).** The shipped code has the same stale-reach gap for a carried
container with no second step: after it has left the player, a crafted `/unlock` or take can
still reach a plain locked briefcase or a plain container that holds contents (the
released-container and start-item walks do not test that it is held, `game.rb:4945-4959`,
`:4909-4914`). Once Rule D is built (G1), G4 extends its trigger and its two legs to a **plain
carrier**: a top-level carrier (home `npc`, `start`, `grant` or `room`) that has a lock or a
`contents` list, whether or not any object at or below it carries `secondStep`. Rule D then runs
on any path that holds a plain carrier id, with the same chain, the same two legs and the same
closed-list refusals (generic 422 at `/unlock`, 404 "Container not found", "Item not found in
scenario: <item_type>" at the take routes). Nothing else changes: a plain container in its
authored place, a nested container inside a held carrier, a give, a start item and a dropped
item in an unlocked room all pass exactly as above.

`carried_step_chains` therefore also holds one entry per plain carrier. The cost is bounded: only
top-level carriers with a lock or `contents` get an entry, each entry is the carrier's own chain
(at most the nesting depth, because a nested `takeable` is judged by the deepest carrier on its
path and has no entry of its own), and the table is built in the same single scenario walk as
`second_step_ids` and memoised per scenario for the process. A lookup is a hash read per object
on the request's path, so a scenario with no carried container pays nothing. Test items, notes
and keys have neither a lock nor `contents`, so they get no entry.

**A plain carrier with no `id` is not covered.** Chains, Rule D's held leg and every closed-list
route are keyed by id, so a plain carrier with no `id` gets no entry in `carried_step_chains`, is
reachable by no id-keyed route, and keeps today's best-effort behaviour (the held-item match by
type and name where ids are absent, `ItemIdentity.held_in?`, `item_identity.rb:106-120`). The
`ceo_exfil` tablet is such a carrier (it has no `id`), so it is in the list below, unchanged. The
validator warns on it (section 9) and the rule that a carrier above a `secondStep` object needs an
id is unchanged: a gated carrier must have one.

Shipped scenarios the extension touches (grep of `scenarios/` for carried containers: a
`startItemsInInventory` entry, an `itemsHeld` entry or a `takeable` room object that has a lock
or `contents`): `test_unlock_gaps` (the start cryptex bag `test_start_cryptex`, and
`test_courier_bag`, a password bag held by the NPC `test_courier`), `ceo_exfil` (the
Bluetooth-locked `Tablet Device`, a takeable object in `reception`, which has no `id` and so is
listed but unchanged) and
`test_social_m5_channels` (the PIN-locked `m5_locked_terminal`, a takeable object in
`m5_room`). The other scenarios (the missions, the labs, the `ca` set) hold no locked or
`contents` item in a start list or an `itemsHeld`; `lab_tesseract_trials`'s lockbox is
`takeable: false` and so is not a carrier. The critical path of each of the three must still
pass after G4 (section 11, "Plain carried containers").

**Copies share one step.** A gated file a sign-in desktop or a share lets the player copy
(`transfer` `copy`, or `both`, the default, when the player picks Copy) leaves one copy in
place and one in the inventory, both under one id. They share one record and one
`unlockedObjects` entry, so passing the step on one opens both. After a Move the desktop
listing hides the file while it is held (`filter_container_contents`), and once it leaves the
inventory it is listed in place again (Rule D, leg 2). The validator warns on such a file
(section 9).

**A client-built object.** `secondStep` joins `ItemIdentity::FORGEABLE_ITEM_FIELDS`, so an
object the client adds loses it, and it gets a fresh server id in any case: a client cannot
make a gated item or borrow a gated id.

**Opening from the inventory.** A click on a gated item in the inventory runs its lock's pad
and, after a right first factor, the pane of 5.4, as anywhere else. After a reload the player
gives the first factor again: a live record reopens the same pane with the same number, a
passed one opens the item.

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
| all four below | the target resolves by id, carries `secondStep` and is not open, and it passes Rule D on its path (5.5) (else 404) | |
| the three posts | `lockSteps` holds a live record that has not passed, of the right kind (else generic 422). No route re-judge and no lockout | |
| `POST /mfa/verify` (`code`) | owner's code step not closed (422 `codeLocked`, `retryIn`); six digits; `MfaModel.code_state` | Stale: 422, no write. Wrong: `tries` and `mfaAccounts[owner].wrong` move, 422 `mfaIncorrect: true`; the fifth drops the record and adds `expired: true`. Right: `passed` set, `{ success: true, stepPassed: true, targetType, targetId }` |
| `POST /mfa/prompt` | gap since the last request (422 `tooSoon`); under the cap (else record dropped, 422 `expired`) | The owner's decision as for sign-in. Not approved: `{ success: false, approved: false, promptsSent, waiting? }`. Approved: `mfaPrompts[owner] = 0`, `passed` set, the pass answer plus `approvedBy: "owner"` |
| `GET /mfa/phone` | `npc_id` is the lock's owner and that phone is held (else 403 `no such phone`) | No write. `{ requests: [ { targetType, targetId, name, n, numbers? } ] }` with that one lock's request when a live, unpassed record exists, and an empty list (200) when none does, so an open phone never shows an error for an expired request. The `own=1` form and a form with no lock named never list a lock request |
| `POST /mfa/approve` | the owner's phone is held (else 403); a re-enrolment is ignored | `deny`, or a wrong or missing number: record dropped, `{ success: false, cancelled: true }`. Right: `passed` set, the pass answer plus `approvedBy: "player"` |

`POST /mfa/verify` for a lock compares against the owner's `code_device` item id, never
`own:<npcId>`. `GET /mfa/device` also answers when no policy declares a kind but a lock carries
`kind: "code"`. The lock subject kind registers with the MFA plan's `device_in_use?(npc_id)`,
true while a live, unpassed `code` lock record names that owner, so a sign-in re-enrolment never blanks a device a
lock still needs. All are inside the game lock and `no-store`.

## 7. What reaches the browser, and what never does

`secondStep` (`kind`, `owner`) is public, with the object as authored (on a carried item, in
its inventory copy too) or, for a room, in the bootstrap door fields (G2, `kind` and `owner`
only). For a door an NPC has opened toward its
step, the opener's NPC id comes back in that `secondStep` answer (`opener`) and, after a
reload, as the room's `npcStepOpener`: the player saw that NPC open the door, so it tells them
nothing new. After a right first factor the browser learns only that, and for
number matching its own two digits. `contents` and `roomData` come after both checks (5.2), a
code only from `GET /mfa/device` while the device is held. It never receives which of the
phone's three numbers is right, any hint on a wrong first factor, `lockSteps`, `mfaPrompts`,
`mfaAccounts`, the owner's patience or habit.

## 8. State and saved games

Two server-owned keys join `ACCESS_STATE_DEFAULTS` beside the MFA plan's five, each a flat
top-level `{}`:

| Key | Shape | Bound | Sent |
|---|---|---|---|
| `lockSteps` | `{ "object:<id>" or "door:<roomId>" => record }`; the record is the MFA plan's pending record plus `'passed'?` | One record per `secondStep` lock in the scenario. Unpassed records past five minutes are dropped on every read and write of the map; a passed one is deleted by the open | Never. It is not read from a sync body |
| `npcStepGrants` (G2) | `{ "door:<roomId>" => npcId }` | One entry per gated door; written by the gate on an accepted `npc` first factor, deleted by the open | Never as state. The bootstrap derives each room's `npcStepOpener` from it (5.3); the `secondStep` answer carries `opener`. Not read from a sync body |

A passed record the player never spends stays for the rest of the game and survives reloads,
within the one-per-lock bound: a passed approval never lapses, and waits for a right first
factor, since it only spares a step already done. An NPC grant also stays until its door opens,
so the player can always retry. `reset_player_state!` drops `lockSteps` and `npcStepGrants`
with the other access keys (`game.rb:3019-3020`). `mfaPrompts` and `mfaAccounts` gain one entry
per lock owner who is not an account. `unlockedObjects` grows by one id per opened lock, as
today. Carried items add no key: a carried item's step is its `object:<id>` record, which no
inventory path writes or moves (5.5), and `carried_step_ids` is derived from the scenario.
Nothing is added to synced state; answers carry single changed values. **Reload:** 5.4.
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
NPC's `itemsHeld` (room NPCs and headless records), each flag station's `itemsHeld`, declared
grants, account profiles, shares and `startItemsInInventory`, keeping the ancestor chain so the placement errors can be told
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
- Until G3 lands, `secondStep` on a top-level carried item (4, "Where it may sit"): an NPC's
  `itemsHeld` entry, a start item, a declared grant's item, a `takeable` room object. From G3
  these may carry it, and the following carried-item errors take that rule's place; they apply
  to a nested `takeable` from G1. `secondStep` on a key or card (`opens_lock`, `key_id`,
  `keyPins`, `card_id`, or type `key` or `keycard`): a first factor never carries a second
  step. On a `usb` item. On a consumable (`consumable: true`, a positive `healAmount`, or a type
  `consumables.js` heals by default, `DEFAULT_HEAL_BY_TYPE` at `:47-58`), which leaves the
  inventory when used. The validator has no Ruby copy of that list: `validate_lock_step.rb`
  reads the patterns out of `consumables.js` once per run (the `DEFAULT_HEAL_BY_TYPE` block,
  each `[/^(…)/, n]` line), and a spec fails when the read finds no pattern or a pattern Ruby
  cannot compile, so the two cannot drift. On a declared grant's item with `droppable: true`:
  a dropped grant item resolves nowhere until it is picked up (5.5), and no shipped grant needs
  it. On a flag station's `itemsHeld` entry or anything inside one: no server walk covers it,
  so the step would be silently ignored. On a hideable device (a `hideable` block,
  `lib/break_escape/hiding_spots.rb:64-76`), which leaves it when hidden. An item an NPC could
  carry for its needs is excluded already: `carriable_object?` refuses anything `locked`.
- `secondStep` on anything inside a `usb` item's `contents`, at any depth, and on any
  `tableItems` entry or anything inside one.
- A carrier (5.5) at or above a `secondStep` object with no `id`: leg 1 of Rule D tests held
  items by id, and the take route and the NPC-container release match a carrier by name, so a
  bag without an id would be refused as an invented id while the player holds it.
- Warning (G4, a plain carrier, no `secondStep` needed): any plain carrier the validator sees
  with no `id` (an NPC `itemsHeld` entry, a start item, a granted item or a `takeable` room object,
  with a lock or `contents`): "not covered by the carried check; give it an id". Rule D keys by
  id, so the container keeps today's best-effort behaviour (5.5, "Plain carried containers"). A
  warning, not an error, because the shipped `ceo_exfil` tablet, a `takeable` room object in
  `reception`, is one.
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
filter removes only `contents`, `game.rb:7280-7287`). A `secondStep` object a sign-in desktop
or a share lets the player copy (`transfer` `copy` or `both`, or no `transfer`, whose default
is `both`): "a copy shares this step: passing it on one copy opens every copy" (5.5). A
`remove_item` action that names a gated nested `takeable`: "a nested item that leaves the inventory goes back to its container (5.5)", since the author
probably expects it gone.
`scripts/lock_key_diff.rb` adds `secondStep` to `REQ_KEYS`, its output unchanged
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

G1 to G3: none. No scenario carries `secondStep` today, and each change is behind it: the gate returns
when `lock_step` is nil; Rules A, B, C and D, the shortcut turned off and the answer's finder
act only on ids in `second_step_ids` (Rule D only on a path holding an id of its subset
`carried_step_ids`; from G4 also on a path holding a plain carrier id, below), which is empty;
`secondStep` joining `FORGEABLE_ITEM_FIELDS` strips a field no shipped item has; until G4, a plain locked
carried item resolves and opens exactly as today; `resolve_unlock_target` finds what
`find_scenario_object` found, plus the path; the `/mfa/*` lock form answers 404; each client
branch fires only on `secondStep: true` or `second_step_cancelled`; the bootstrap copies the
field only when a room has it. Every game gains an empty `lockSteps` and an empty
`npcStepGrants` on its next initialise (`game.rb:7576`), never sent. The grants are written
only behind `lock_step`, and the bootstrap adds `npcStepOpener` only from them, so an existing
scenario's bootstrap is unchanged.

**G4 is the exception.** It changes what a crafted request reaches for a plain carried
container that has left the player, in three shipped scenarios: `test_unlock_gaps`, `ceo_exfil`
and `test_social_m5_channels` (5.5, "Plain carried containers"). Every legitimate flow in them
is unchanged, and the critical path of each must still pass after G4 (section 11). The captured
`ops_unchanged` answers hold for all five of its scenarios (`test_objectives`,
`test_simple_success`, `test_pin_dust`, `m01_first_contact` and `m02_ransomed_trust`), because the fixed script only posts to
containers in their authored place or held.

**Proof.** (1) A spec walks every scenario under `scenarios/` (a pure scenario walk) and
asserts `second_step_ids` is empty for all but `test_ops_lock_step`. (2) The shared mechanism
built in the log plan's L1a: this plan adds to `test/fixtures/files/ops_unchanged/` the files
`lock_step_unlock.json`, `lock_step_container.json` and `lock_step_rooms.json`, holding the
`/unlock` answers, the `GET /container` answers and the `filtered_room_data` rooms for
`test_objectives`, `test_simple_success` (the Hacktivity fixtures), `test_pin_dust`,
`m01_first_contact` and `m02_ransomed_trust`. The fixed script, through the real routes: every
lock posted once wrong and once right, breadth-first from the start room along room connections
in file order, each room's objects in file order, after its room and container ancestors are open,
the lock's `requires` item seeded into the inventory by test setup (directly, identically on main
and branch; every captured answer still comes through the real routes); a lock the scope refuses
is recorded as refused, and locks below it as unreached. `GET /container` for each open container,
then `filtered_room_data` for each room (`test_simple_success` has no locks or containers: room
answers only). The log plan's rake task `ops:unchanged:capture` writes them once from main before
any change of this plan, and `bin/ops-golden-compare` compares them in
`test/controllers/break_escape/lock_step_unchanged_test.rb` after each stage; they cover answers,
not stored state (the empty `lockSteps`). (3) The existing unlock, container, inventory and door
suites pass with no edit.

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
itself); Rule C at each exit; `carried_step_chains` for each carrier home (`npc`, `start`, `grant`,
`room`, `nested`) at three depths, and `carried_step_reachable?` true for a path with no
carried gated id; a `secondStep` object with no id never opens; the expiry tidy keeps
a passed record. Secret guard, as the MFA plan has per stage: a row holding a code after
`note_issued_secret`, and one holding the lock's own `requires`, each raise in tests.

**Validator and graph.** One validator spec per error and warning of section 9, each with a
passing twin, including a task target inside a never-passable gated object.
The G4 warning has its own spec: an NPC `itemsHeld` entry, a start item and a `takeable` room
object, each with a lock or `contents` and no `id`, warn; the same with an `id` is clean; a note or key with no `id` is clean.
`test/js/dungeon-graph-lock-step.test.mjs`: the second edge per kind, the dashed "never passes"
edge, and a scenario without the field drawn unchanged.

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
| G2 NPC grant | An `npc` post to a gated door writes `npcStepGrants["door:<roomId>"]` and answers with `opener`; a deny, an expiry and a five-minute lapse leave the grant; the bootstrap then carries the room's `npcStepOpener` (and `secondStep` with `kind` and `owner` only, an extra authored key dropped); a second `npc` post from the same NPC reopens the live record or starts a new one; an `npc` post against a record a keycard already started writes the grant and answers `opener` as that NPC, and an `npc` post from another NPC replaces it; the open deletes the grant; an `npc` post from an NPC the checks refuse gets today's 422 and writes no grant |
| Reach after removal, NPC briefcase (G1) | A gated archive inside an NPC's ungated briefcase, with a plain note inside the archive: it opens through both checks while the briefcase is held. After an inventory `remove` of the briefcase (and a `hide` fixture that skips the validator) a crafted `/unlock` of the archive with the right password, and of the note, is the invented-id 422 with no pips or case hint; `GET /container` for the archive is 404 "Container not found"; a take of the archive answers "Item not found in scenario: <item_type>" (the note sits two levels down, where the finder does not reach in any case, so it tests nothing); every `/mfa/*` lock call is 404; for a live record, a passed record and an opened archive alike. Nothing is written and the record is left as it was |
| Reach after removal, nested takeable (G1) | A takeable gated archive in a room PC: taken with `locked: true`, opened from the inventory through both checks. After an inventory `remove` it is listed in the PC's `GET /container` answer again and can be taken again, as today; with a live record a crafted `/unlock` with the right password re-answers from the record and opens nothing without the approval; with a passed record it opens in place |
| Innermost carrier (G1) | An ungated NPC briefcase holding a takeable gated archive; the player is given the briefcase and takes the archive. (a) `remove` the briefcase: the held archive still opens through both checks and its contents ship after the pass. (b) `remove` the archive instead: it is listed in the held briefcase again, a crafted `/unlock` re-answers from its record and nothing opens without the approval. (c) `remove` both: the archive is the invented-id 422, `GET /container` 404, and a crafted take of the archive (`POST /inventory` add, with the briefcase released and in `unlockedObjects`) answers "Item not found in scenario: <item_type>"; the same take while the briefcase is held, or a give of the briefcase again, passes |
| Gated contents path (G1) | After the gated briefcase is opened and removed, every exit for an object inside it with no step of its own (`/unlock`, `GET /container`, the take routes, the inventory copy) refuses it as an invented id; the same object while the briefcase is held is served as today |
| Sign-in desktop in place (G1) | A takeable gated archive on a sign-in PC's desktop: with a session and nothing held, it opens in place through both checks; without a session, each route gives today's scope answer, unchanged. After a copy is taken and removed, the desktop copy still opens with a session. The same for a gated file in a profile and in a share, through their session and foothold tests |
| Refusal order (G1) | For a gone, unopened gated briefcase: `/unlock`, `GET /container` (plain branch, where `check_container_unlocked` would answer 403) and a take of an object inside it each answer the invented-id body, never a 403; the same for a non-takeable object inside it, whose take answers "Item not found in scenario: <item_type>" and never "Item is not takeable: <name>"; a gated briefcase still in place and unopened meets today's 403 |
| Not yet released (G1) | `/unlock` on a gated object inside a container an NPC still holds, before any give or knock-out: the invented-id 422, no record |
| Drop and pick up (G3) | A gated held briefcase with a live record: a player drop into an open room and a pick-up keep the record, its request count and `nonce`; the dropped copy is in reach (a right first factor re-answers from the record); the same after a knock-out drop's copy in `objects_added`. No route can drop into a room the player has not opened (`update_room` answers 403 "Room not accessible" for `add_object` unless `room_unlocked?` holds, `games_controller.rb:1087-1089`), so the out-of-reach case is a model test: a copy written directly into `objects_added` of a room not in `unlockedRooms` is out of reach |
| Every carried home (G3) | A gated start item, an `itemsHeld` briefcase after a give and after a knock-out, a declared grant's item and a top-level `takeable` room object: each opens through both checks while held and is refused by Rule D once removed, as in the G1 NPC briefcase row; a gated `takeable` room object still in its room is in reach while the room is open |
| Re-add and dedupe (G3) | A crafted add of a held gated start item answers `already: true` and leaves the record; a re-sent add on reload the same |
| Re-add after removal (G3) | After a `remove` of a gated start item with a live record, a crafted re-add is accepted (today's start-item rule); a right first factor then re-answers from the record, opens nothing and ships nothing without the approval. The same for a passed record: the item opens, as its step had passed. The same with a crafted `source_npc_id` give of the removed briefcase |
| Client-built object (G3) | An `add_object` with no source carrying `secondStep` and a gated object's id: stored with a fresh id and no `secondStep`; `second_step_ids` and `carried_step_ids` unchanged; the gated object's record untouched |
| Plain carried containers (G4) | Fixtures with no `secondStep` anywhere: a locked start-item bag, a locked bag an NPC holds, a `takeable` locked room object and a plain `contents` briefcase. Held, each opens as today. After an inventory `remove` (and, for the NPC bag, after the give), a crafted `/unlock`, `GET /container` and take for the bag or an object inside it are refused with the closed-list answers (generic 422, 404 "Container not found", "Item not found in scenario"), with nothing of the contents in any answer and nothing written. Legitimate flows still pass: a give (`source_npc_id`) adds the bag; a start item is held from the start and its re-add answers `already: true`; a nested container inside a held briefcase opens and yields its contents; a bag dropped into an open room is in reach and can be picked up and opened; a `takeable` room object still in its room is in reach while the room is open. A takeable `usb` stick with `contents`, after a plant (`network_access.rb:262`, `:516`): a later `GET /container` on it is refused, the intended direction. An id-less plain carrier (a start item and an NPC-held one, each with a lock or `contents`) behaves as on main, and the validator warns on it |
| Plain carriers: chain table (G4) | `carried_step_chains` holds exactly one entry per top-level carrier with a lock or `contents`, none for notes, keys or tools, none for a nested `takeable`, none for a carrier with no `id` (the `ceo_exfil` tablet); the table is built once per scenario and a second call reads the memo (a counter on the walk); a scenario with no carried container has an empty table and `carried_step_reachable?` returns true at the first check |
| Shipped scenarios (G4) | `test_unlock_gaps`, `ceo_exfil` and `test_social_m5_channels`: the existing scenario tests and the critical-path walkthrough (the `playtest-scenario` run for each) still pass, covering the start cryptex bag, `test_courier_bag` after the courier's give, the reception tablet (id-less, unchanged: a crafted request for it behaves as on main) and the `m5_room` terminal; the `ops_unchanged` comparison is unchanged |
| Copies (G3) | A gated file copied from a sign-in desktop (`transfer: "copy"`): one record for both copies; passing the step on the inventory copy opens the desktop copy too. After the inventory copy is removed, the desktop copy is still in reach with a session. A `transfer: "both"` file the player moves: hidden from the desktop listing while held, listed and in reach again after a `remove` |

**JS** (`second-step-lock.test.mjs`, plain `node`). No new module: the tests depend on the
MFA plan's stage M1b having put `mfa-client.js` and its scenes on every harness copy list.
`ApiClient.unlock` on a `secondStep` answer opens the pane, never returns that answer,
resolves with the re-posted answer on a pass and rejects with `second_step_cancelled` on a
close, a deny or an expiry; on any other answer it behaves as today. The re-post takes a new
`nextClientTs()` (later than one taken while the pane was up) and applies its writes with it;
a re-post answered with `secondStep: true` again rejects with no third post and no second
pane. The cancel rule: a deny and an expiry each give one reject tone and "Not approved."; the
player's X gives neither; the same for every caller below.

No early success, one row per site, each on a gated lock and its ungated twin (as today):
Bluetooth, the rfid clone and direct card, the lockpick scene in both modes, key selection,
the two no-framework fallbacks, the fingerprint reader (it shows "Print accepted.", no
"unlocked" toast and no `expectPanelWithin` before `success: true`; the toast after it) and
BLE (no `task_completed_by_npc` and no `onPairSetGlobal` write before `success: true`; both
after it, once). For key and lockpick, `expectContainerAfterUnlock` is called after the answer,
not at completion.

Access lists: at STEP 2 with held keycards, a cancel opens no copier, emits no
`door_unlock_failed` and passes no `refusedKeycards`; `showAccessRefusal` given
`second_step_cancelled` shows no "Failed to verify access". At the copier, a cancel while the
asking instance is suspended returns silently and the returning copier marks no card refused;
a live instance given `second_step_cancelled` goes back to its list with no `card_emulated`
and no `onRefused`; a pass while suspended runs the late path once and opens a gated container
with `autoOpen: true`.

NPC doors (the clock and `MinigameFramework` stubbed): an ink knot with `#unlock_door` then
`#give_item` opens the pane only after the NPC inventory and the chat are both shut and
`pendingConversationReturn` is null for two checks; the same with the card copier opened from
the chat; a phone-chat `unlock_door`; an event-mapping `unlockDoor` fired while a container is
open (the pane waits for it). The waiting toast shows once, and only when the first check is
not clear: with nothing open the pane opens at once with no toast. While the player is
knocked out the request waits and never calls `startMinigame`; a null return from it settles
as a silent cancel. Two `npc` requests under one chat give two panes in turn and no "Not
approved."; the second re-checks clear before it opens. A queued request that reaches the head
re-posts its `/unlock` body first: a stale one (its record expired while the head pane was up)
opens on the re-post's new record; a duplicate for a door the head pane just opened settles as
success with no second pane when the re-post answers `success: true`, and is dropped quietly,
with no pane and no alert, when the target is already open in the client. An event-mapping
`npc` request waiting under a gated `pin` pad does not hold the queue: the right code opens the
pad's pane at once over the pad, and the NPC's pane opens after both are shut. A `fromDoor`
request whose single check is not clear settles as a silent cancel and never queues behind a
waiting request. A cancel reaches the bridge as
`secondStepCancelled: true` and neither chat caller shows "Failed to unlock". With
`npcStepOpener` set, `handleUnlock` on the door posts `npc` for `doorProperties.connectedRoom`
with `{ fromDoor: true }` and not the lock-type branch; after a pass, `unlockTarget` runs once
with the answer's `roomData` and `door_unlocked_by_npc` fires once with `retry: true`; after a
cancel (a rejection whose `body.reason` is `second_step_cancelled`) nothing runs, there is no
unhandled rejection and no alert; after a network error or a 500 the "Failed to verify access"
alert shows and nothing opens. On the conversation path the bridge emits
`door_unlocked_by_npc` once, with no `retry`, and a following door click does not emit it
again; a door with no second step emits it exactly as today (one emit on the bridge's success,
no gate, no retry). After an `npc` post answered with `opener`, both the loaded sprite's and a later-built
sprite's `lockRequirements` carry `npcStepOpener`. A door built from bootstrap data with
`secondStep` and `npcStepOpener` has both in `lockRequirements` from every exit of
`getLockRequirementsForDoor` before its room loads.

One caller per kind of handling: the `password` pad swaps panes and counts no attempt;
the `pin` pad keeps its state beneath the pane and plays no reject sound on the player's X; a
`notifyServerUnlock` caller
(key) and `requestRfidAccessUnlock` call `unlockTarget` zero times on a cancel and emit no
`item_unlocked` or `door_unlocked`; the `unlock_object` action with source `flag_reward`
posts as today. A grep spec asserts that nothing in `public/break_escape/js/` posts to
`/unlock` except `ApiClient.unlock` and `MfaClient.finishLock`.

Carried items: a gated item opened from the inventory opens the pane over the `pin` pad, and
the player's X leaves it locked with no `item_unlocked`; a gated held item after a reload (the
stored copy keeps `locked: true` and `secondStep`) reopens the same pane and number from a live
record; a drop and pick-up between two right PINs keeps the pane's request count.

**Feature scenario** `scenarios/test_ops_lock_step/`. Cast: Moira (low awareness, approves
when pestered, patience 3, keeps her phone), Gordon (high awareness; his ink hands over his
phone), Priya (owns a code device her ink hands over), Dana (high awareness, `koImmune: true`,
phone in her `itemsHeld`, no give in her ink). Locks: `moira_pc` (`password`, `push`)
holding `audit_zip` (`password`, `push_number_match`, Gordon); `moira_locker` (`pin`,
`push`; in Moira's `unlockable` for the crafted-post test only); `priya_safe` (`pin`,
`code`); `dana_cabinet` (`password`, `push_number_match`, off the critical path); in G2
`records_room` (`rfid`, `push`, Moira), which Gordon's ink also opens with
`#unlock_door:records_room` followed by a `#give_item` in the same knot; in G3
`gordon_briefcase` (`pin`, `push`, Gordon, `droppable: true`, in Gordon's `itemsHeld`, given
by a `#give_item` in a later knot), and a `courier_box` whose `triggerOnInteract` runs a
`remove_item` action naming the briefcase by its id (so another briefcase in the inventory
cannot match first). The scenario declares
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
| B12a (G2) | A fresh game (B11 has opened the room). Talk to Gordon; his ink runs `#unlock_door:records_room` then `#give_item` (his inventory opens from the chat). Close the inventory, then the chat | No pane while the chat or inventory is up; the "Second step pending" toast once; the pane opens after both are shut. `lockSteps["door:records_room"]` live, `npcStepGrants` names Gordon, one `mfa_challenge` with `method: npc` |
| B12b | Close the pane with X | No tone, no line, no "Failed to unlock". Door shut; record still live; grant kept |
| B12c | Use the door | No conversation; the pane opens at once with no toast, with the same request count; no new `mfa_challenge`; no `door_unlocked_by_npc` yet (the step has not passed) |
| B12d | Reload with the pane up; use the door again | Bootstrap door carries `npcStepOpener: gordon`; the pane reopens on the same live record |
| B12e | "Send again" until Moira (the owner, elsewhere) approves | Door sprite opens at once from the answer, with no second click; `door_unlocked` fires; `door_unlocked_by_npc` fires once (`retry: true`) and the scenario's mapped global is set once; `unlockedRooms` gains it; record and grant deleted; `mfa_prompt_approved` with `approver: owner`; no `badge_swipe` row (an NPC, not a card) |
| B13a (G3) | After B7 (Gordon's phone held). Gordon's ink gives `gordon_briefcase` | In the inventory with `locked: true` and `secondStep`, no `contents`; `lockSteps` has no briefcase record |
| B13b | Right PIN at the briefcase from the inventory; one request | `secondStep` answer; one live record, request count 1; one `mfa_challenge` row; no contents in any answer |
| B13c | Drop the briefcase, pick it up, right PIN again | The same live record and request count; no new `mfa_challenge` row |
| B13d | "Check phone"; approve | Briefcase open; `approvedBy: player`; `board_minutes` listed |
| B13e | Use `courier_box` (it removes the briefcase by its id); crafted `/unlock` and `GET /container` for `gordon_briefcase`; crafted `/unlock` and a take for `board_minutes` (takeable or not, the take answer is the same) | The invented-id 422 at both `/unlock` posts, 404 "Container not found", and "Item not found in scenario: <item_type>" at the take (Rule D on the briefcase's path, before any 403); nothing of the contents in any answer; the passed open stays in `unlockedObjects` |
| B13f | A fresh game: B13a and B13b, then `courier_box`; crafted right PIN at `/unlock`, then `POST /mfa/prompt`, `GET /container` for `gordon_briefcase` and a take of `board_minutes` | 422, 404, 404 "Container not found" (never a 403) and "Item not found in scenario: <item_type>"; the live record untouched; nothing opens |

**Live proof** on the real path, headless, on the keyless server: B2, B3, B6, B7, B8 and B9 for G1
with screenshots of the pane in each frame; B11 and B12a to B12e for G2; B13a to B13f for G3. The proof uses the test scenario and
edits no game record. Judge each beat by the server record: the `unlock_object` action emits
`object_remotely_unlocked` before it posts (`apply-actions.js:200`), so a refused gated
object can look open on screen.

## 12. Build steps and shared files

Order: MFA plan M1a to M3 and log L1a and L1b first; then G1; then G2. On landing, A25 goes in
the `README_scenario_design.md` feature index and `docs/ACCESS_AND_NETWORKS.md`, and D6's
`doors[]` line is corrected. Within G1: capture the section 10 `ops_unchanged` fixtures, then server (5.1, 5.2,
section 6, rows) with tests, then client (5.4) with JS tests, then schema, validator, graph,
the feature scenario, B1 to B10 and the live proof. G2 adds 5.3 (the bootstrap allowlist, the
`doors.js` `doorProperties` fields, the three `getLockRequirementsForDoor` copies and
`npcStepGrants`), the other lock types with their early-success sites (5.4), the NPC wait and
retry, the door tests, B11 and B12a to B12e. G1 also builds `carried_step_ids`, `carried_step_chains` and Rule D (5.5)
with the server rules. G3, after G1 and either side of G2, lifts the validator's carried-item
refusal for its carried-item errors (section 9), adds `secondStep` to `FORGEABLE_ITEM_FIELDS`,
the G3 controller and JS tests, the briefcase and B13a to B13f. G4, last, extends
`carried_step_chains` and `carried_step_reachable?` to plain carriers (5.5), adds the three G4
test rows of section 11, and runs the existing tests and the critical-path walkthroughs of
`test_unlock_gaps`, `ceo_exfil` and `test_social_m5_channels`; it edits `game.rb` only.

| Shared file | This plan's edit | Also edited by |
|---|---|---|
| `game.rb` | `ACCESS_STATE_DEFAULTS`; `resolve_unlock_target` behind `find_scenario_object`; `unlock_object!` (Rule A); `validate_unlock` (`resolved:`, Rule C, the shortcut); the feedback helpers; the marker at `:2999-3010`; the bootstrap allowlist and `npcStepOpener` in `filtered_scenario_for_bootstrap` (G2); `carried_step_ids`, `carried_step_chains` and `carried_step_reachable?(object, path)` (Rule D) | MFA plan, privilege and accounts plan, core plan |
| `games_controller.rb` | the gate and the answer's finder in `unlock`; the plain `GET /container` branch and the path through its finders; the room-object take test; Rules C and D straight after the finder at every `GET /container` branch and take route, before their 403s; the inventory copy; the lock form in the `/mfa/*` actions; the refused-row branch of `unlock` (L1b's `badge_swipe` row), edited to return before the row behind a closed step | MFA plan, log plan, privilege plan (`#container` profile branch and the collect action), core and cracking plans (the `set_game` and `with_game_lock` action lists), log plan L3 (`#container`, `share_folder_opened`); agree the order |
| `lib/break_escape/mfa_model.rb`, `app/models/break_escape/mfa_access.rb` | the lock constants, `lock_step` and `lock_step_never_passes?` (`held_item_sources` is the MFA plan's); the `object` and `door` subjects | MFA plan (owner) |
| `api-client.js`, `utils/lock-scope-refusal.js`, `systems/unlock-system.js` (G1; G2 adds the early-success sites, the access-list branches, the `getLockRequirementsForDoor` fields and the NPC retry in `handleUnlock`) | the step in `ApiClient.unlock` (including the sixth argument `{ fromDoor }` handed to `runLockStep` and never posted); the refusal line; the cancelled guard | none in the ops plans |
| `lib/break_escape/item_identity.rb` (G3) | `secondStep` in `FORGEABLE_ITEM_FIELDS` | the cracking plan (C2, appends `revealsFacts` to the same constant; additive, neither removes anything) |
| `systems/doors.js` (G2) | `secondStep` and `npcStepOpener` in `doorProperties` | none in the ops plans |
| `systems/minigame-starters.js`, `minigames/biometrics/fingerprint-reader-minigame.js`, `minigames/ble-scanner/ble-scanner-minigame.js`, `minigames/rfid/rfid-minigame.js` (G2) | the gated-lock skips of 5.4 (toasts, `expectContainerAfterUnlock`, `expectPanelWithin`, `applyBlePairEffects`); the copier's cancel branch | none in the ops plans |
| `systems/npc-game-bridge.js`, `minigames/helpers/chat-helpers.js`, `minigames/person-chat/person-chat-conversation.js` (G2) | `secondStepCancelled` from `unlockDoor`; no failure line for it | none in the ops plans |
| `mfa-client.js`, the `password` scene's second pane, `authenticator-live` | subject keys, `secondStepOnly`, the lock card; in `MfaClient`, the scene-clear wait for `npc` requests, the waiting toast, the serialised queue (open pane only) with its re-post at the head, the knock-out check, the `npcStepOpener` writer (door sprites and `gameScenario.rooms`, which are not `MfaClient`'s own state) and `cancelFeedback` | MFA plan (owner) |
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
Both `badge_swipe` rows, `ok` and `denied`, need `method: "rfid"` (a card presented), counted
because `validate_unlock` accepted it against the lock type: an NPC (`npc`) or a flag reward
(`flag_reward`) opening an rfid lock writes the `mfa_*` rows and no badge row. When a cloned
card opens a gated door, the badge row's `as` follows the log plan's rule for a copy (its
section 13.8 row table: the holder when the request carried one card or `showCardHolder` is set,
none when it carried several), and the step rows name the step owner. The two can differ by
design, so the player sees a copied card is not the owner's approval.

## 14. What this plan relies on from other plans

Each entry names what this plan needs from another plan and the section of that plan that provides it.

1. **`OPS_MFA_HELPDESK_PLAN.md`, sections 5.1, 5.2, 5.3 and 8: shared functions and state.**
   The second-step functions take a subject (kind and id) and keep its pending record in the
   caller's own map, so this plan calls them with a lock as the subject. The MFA plan's section 5.2
   subject rules and its section 14, item 11, list the names this plan uses.
2. **`OPS_MFA_HELPDESK_PLAN.md`, section 6 (server routes) and section 9 (validator).** The four
   step routes accept `target_type` and `target_id`; `GET /mfa/device` answers when a lock
   carries `kind: "code"` though no policy declares a kind; `GET /mfa/phone` lists a lock request
   only for a named lock, never in its `own=1` form. The validator's `code_device` owner error
   admits a lock's owner. A held phone lists no lock request outside the pane the attempt opened
   (section 5.4 of this plan), so the "approving from the phone" slice needs no lock form. The lock
   form's subject check leaves one hook before the record is read; this plan's G1 puts
   `carried_step_reachable?(object, path)` (section 5.5) in it, answering the lock form's 404 when
   it fails, so G1 does not depend on the MFA plan for its own refusal. The MFA plan's section 6
   ("The lock subject") and section 9 state both, and its section 11 tests them with G1 and G2.
3. **`OPS_LOG_ROWS_PLAN.md`, section 13 (log rows) and its L1b stage.** The eight `mfa_*` events
   list `door` and `object` among their `places`; `mfa_challenge` registers the `method` detail
   key with the closed code list of section 13 here; `{ npc: }` is allowed as `as` on those
   events; both `badge_swipe` rows are written only for `method: "rfid"` (not `npc` or
   `flag_reward`) and the granted one after this plan's gate (section 13 here). Stage L1b carries
   the call site, and its refused-row condition gains `behind_closed_step?` when G1 lands
   (sections 5.1 and 12 here).
4. **`OPS_LAYER_BRIEF.md` (in `docs/agents/`), sections 4 and 5.** This plan is feature id A25, and
   `test_ops_lock_step` is in the brief's feature list.
5. **`OPS_CORE_PLAN.md` (section 14), `OPS_PRIVILEGE_ACCOUNTS_PLAN.md` (section 6) and
   `OPS_CRACKING_PLAN.md` (section 14, "Second-step and lock plan").** A password they yield is a
   first factor and meets the step. A plan that opens an object by its own server route uses
   `record_step_open!` and `step_object_open?`, or the validator refuses `secondStep` on that
   object. The core and privilege plans open no lockable object by their own routes, so they call
   neither.

**Found in existing code, not in this plan's scope** (none is changed here):

- Fixed outside this plan, on its own branch with tests: a keycard carrying a keyring
  `credential` still signed in after revocation; the keyring test never read revoked ids
  (`credential_keyring.rb:42-64`, against `game.rb:4019-4021`). Owner: the keyring (A15) work.
- Fixed outside this plan, on the same branch: the validator counted `fob` and `rfid` item
  types as cards (`scripts/validate_scenario.rb:2321`); the engine accepts only `keycard`
  (`game.rb:4045`, `unlock-system.js:89-90`). Owner: the validator.
- Open until G4: a plain locked carried item that has left the inventory still resolves for
  `/unlock` and `GET /container` (`released_npc_containers` and the start-item walk do not
  test that it is held, `game.rb:4945-4959`, `:4909-4914`), so a crafted request can open one
  the player no longer has. This is a gap in the shipped code. Rule D (5.5) covers gated items
  from G1; G4 (5.5, "Plain carried containers") extends it to plain carried containers.
- Known: four add paths put back an item that has left the inventory, with no record that it
  left (5.5, "Re-adds"), for any carried item. They stay known best-effort routes. For a gated
  item the step record survives, so the owner's approval is still needed and the step itself is
  never skipped.

## 15. Open questions for the user

None open.
