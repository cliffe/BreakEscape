# Access model: implementation review, round 1

Reviewer: fresh, read-only (Opus). Scope: the diff `b12b8577..HEAD` (steps 1 to 9) under `app`,
`config`, `lib`, `public`, `scripts`, `tools`, `test` and `.claude`, against
`ACCESS_MODEL_PLAN.md` (sections 3 to 6 and 8) and the deviations in `ACCESS_MODEL_BUILD_LOG.md`.
`scenarios/lab_physical_pentest` (step 10) was not reviewed.

## Verdict

Not closed. No blockers. Two majors, both server checks that the plan says the server decides but
that can be bent by a modified client: one lets a sign-in PC's contents leave the server with no
session when a name collides, the other lets a held keycard count as a different keycard with the
same name at an access-list lock. Both have small, local fixes. The rest is minor: client session
edge cases, an unenforced door-level field and test gaps.

The withholding itself (NPC records in room data, the bootstrap, captures, tiles, sign-in failure
answers, keypad hints for refused scoped targets) is sound on every path I traced, apart from M1.
Behaviour for scenarios that use none of the new fields is unchanged in every path I checked
(see "Regressions" below).

## Baseline

- `bundle exec rails test`: 1056 runs, 4238 assertions, 0 failures, 0 errors, 1 skip.
- `bin/test-js`: 404 files, all pass.
- Two probes in a scratch test (not committed) confirmed M1 and M2 against the step 3 fixture
  (`AccessModelScenario.routes_scenario`).

## Severity table

| Severity | Count | Findings |
|---|---|---|
| Blocker | 0 | |
| Major | 2 | M1, M2 |
| Minor | 9 | m1 to m9 |

## Findings

### Majors

**M1. `GET /container` by a colliding name serves a sign-in PC's folder (or the PC's own
contents) with no session.**
`app/controllers/break_escape/games_controller.rb:535-556` with `find_container_in_scenario`
(`:1757`) and `Game#login_scope_of` (`app/models/break_escape/game.rb:1234`).

The `container` action asks `login_scope_of` first and only routes to the session checks when
the first object it finds is a sign-in PC or scoped. `login_scope_of` matches any object by id or
name. `find_container_in_scenario` matches only objects with `contents` and still walks into
sign-in PCs. When an unscoped object without contents comes first and shares the requested name,
`login_scope_of` answers "unscoped", the generic path then finds the folder inside the sign-in
PC, and `check_container_unlocked` passes because the requested string is in `unlockedObjects`.
The build log's deviation "`find_container_in_scenario` is unchanged" assumed both lookups find
the same object; they do not.

Failing scenario (reproduced): a lobby note named "Archive folder" (no contents) and an unlocked
folder "Archive folder" inside `jake_pc`. With no session:
`POST /unlock { targetType: object, targetId: "Archive folder", method: "unlocked" }` answers 200
(it validates the lobby note and records the string "Archive folder"), then
`GET /container/Archive%20folder` answers 200 with the PC folder's file text. The same works for
the sign-in PC's own local files when an earlier contents-less object shares the PC's name.
Common desktop names ("Documents", "Archive") make the collision plausible.

Fix: make the generic path unable to reach scoped objects. Either have
`find_container_recursive` and `search_nested_contents` skip the contents of `login_pc?` objects
(as `find_accessible_item` now does, `:2241`), or, after `find_container_in_scenario`, re-check
the object it returned (walk with `equal?` to find its scope and refuse anything scoped).
Add a no-password case that addresses a PC folder and the PC by a colliding name.

**M2. At an access-list lock, a held keycard counts as every keycard definition that shares its
name.**
`app/models/break_escape/game.rb:1556-1570` (`held_rfid_cards`), through
`BreakEscape::ItemIdentity.held_in?` (`lib/break_escape/item_identity.rb`).

`held_rfid_cards` decides that a definition's `card_id` is held when `held_in?` finds the
definition in the inventory. `held_in?` falls back to the name whenever either side has no id,
and NPC `itemsHeld` keycards are never stamped with ids (`stamp_scenario_object_ids!` walks room
objects and profiles only), so an NPC-given badge in the inventory has no id. Two badges with the
same name therefore make both `card_id`s "held". A modified client then sends the other badge's
`card_id` in `card_ids` and opens a lock the player's own card does not pass. The build log's
deviation ("a client-written field on another inventory item never counts") is right about the
field but misses the name fallback.

Failing scenario (reproduced): Len holds "Staff badge" (`LOW-01`), Morgan holds "Staff badge"
(`EXEC-DF-01`). The player is handed Len's badge. `held_rfid_cards` returns
`{"LOW-01"=>false, "EXEC-DF-01"=>false}` and `POST /unlock` on `exec_suite` (people: exec) with
`card_ids: ["EXEC-DF-01"]` answers 200.

Fix: decide "held" by `card_id`, not by identity or name: a `card_id` is held when an inventory
item of type `keycard` carries it. The inventory stores the server's canonical copy
(`canonical_inventory_item`), so its `card_id` is server-written. If keeping the definition walk,
require `held_in?` and an equal `card_id` on the matched inventory item. Add a test with two
same-named NPC badges.

### Minors

**m1. A door-level `access` is read by the client but ignored by the server.**
`public/break_escape/js/systems/doors.js:530-531`; server door branch
`app/models/break_escape/game.rb:1976` reads `room_data(target_id)` only.
`doorProperties` takes `access` from a `doors[]` override before the connected room, but the
server's door check reads the connected room. An author who puts `access` on a non-gate door
override gets a lock the client treats as an access list and the server treats as a plain `rfid`
door (client-trusted): any held card the client sends opens it. The validator errors on `access`
only for gate doors (`scripts/validate_scenario.rb:5937-5949`). Fix: drop the `lockProps.access`
and `lockProps.acceptsUIDOnly` reads in `doors.js`, or make the validator error on `access` on
any `doors[]` entry.

**m2. A borrowed NPC keycard with no id can never be recorded as a copy source.**
`public/break_escape/js/systems/interactions.js:914`; `Game#clone_source_keycard`
(`game.rb:1665`). The keycard click sends `object_id` only when the item has an id, and the
server finds the source only by id. NPC `itemsHeld` keycards have no stamped id (several
missions author none, for example m02 and m04 workshop cards), yet the plan names "one an NPC
handed over to borrow" as the usual case. The copy is saved locally, nothing is recorded, and at
an access-only lock it is "Access denied" with no clue why. Fix: let `/clone_card` take a held
keycard's `card_id` as the source when no id exists (the server checks a held keycard carries
it, as in M2), or have the validator warn about an id-less keycard whose `card_id` an access
list would admit.

**m3. A folder opened from a sign-in desktop stays open when the session ends.**
`public/break_escape/js/minigames/container/container-minigame.js:240, 253`. Only the desktop
itself registers with `pcSessions.registerDesktop`. Opening a folder replaces the desktop
minigame, whose `cleanup` unregisters it, so when a claim ends (owner returns, auto lock) the
folder view stays open with no message. Takes are refused by the server, but the player can keep
reading the owner's folder. Fix: register the folder container too (it already knows
`sourcePcId`) and close it with the same message.

**m4. A claim answered after the owner has returned is never ended.**
`public/break_escape/js/systems/unlock-system.js:222`; `pc-sessions.js:202-224`.
`ownerReturned` ignores a PC with no session yet, so a `workstation_owner_returned` that fires
while the claim request is in flight is lost; the claim then lands, the desktop opens with the
owner at the desk, and the session lasts until a reload (the auto lock needs the owner away).
Fix: after a successful claim, check `workstationState.presence(pcId)` (or the away record) and
end the claim with `owner_returned` when the owner is back.

**m5. A failed `/logout` leaves the server session alive.**
`pc-sessions.js:244, 263, 281` delete the local session before the request and ignore its
failure. For a claim this keeps the owner's profiles open to any request on the server
(`session_admits?` admits a profile through a session at any PC) until the next reload's
`load()`. Fix (cheap hardening): have the `scenario` action, or `sessions_for_client`, end
`via: "claim"` sessions on the server itself, so the reload rule does not depend on a client
request; optionally retry the logout once.

**m6. The copy record is not awaited.** `public/break_escape/js/minigames/rfid/rfid-minigame.js:300`.
`recordCloneOnServer` runs in the background; a player who taps the reader of an access-only lock
straight after saving can be refused before the record lands. Fix: keep the promise on the
minigame (or `window.pcSessions`-style module) and await it in `requestRfidAccessUnlock` when one
is pending.

**m7. A claim overwrites a password session at the same PC.**
`app/models/break_escape/game.rb:1446-1471` and `start_login_session!` (`:1813`). The client never
claims where it holds a session, but the server does not refuse it; a stray claim replaces the
password session, and the next reload's claim rule then signs the PC out entirely. Fix: refuse a
claim when `sessions[pcId]` is already set.

**m8. `/logout` does not accept what `/login` accepts.** `game.rb:1474`. `/login`,
`/login_accounts` and `container` resolve `pc_id` through `login_scope_of` (id or name) and store
the session under the PC's id; `/logout` deletes the raw string, so a logout by name does
nothing and answers success. Fix: resolve through `find_login_pc` and delete by its id.

**m9. Test gaps and tests that cannot fail on behaviour.**
- `test/js/access-signin-routing.test.mjs` ("interactions.js sends a sign-in PC to
  interactLoginPc", "api-client.js has login, logout and loginAccounts") and
  `test/js/container-transfer-dialog.test.mjs` ("inventory.js sends source_pc_id and transfer")
  read source text; they pass for code that has the strings but the wrong behaviour.
- The no-password test (`test/controllers/break_escape/access_model_no_password_test.rb`) has no
  name-addressed `/container` or `/unlock` case (M1), no `/inventory` add answer, and no `/unlock`
  object answer for a scoped folder without a session.
- No test has two keycards sharing a name (M2), a claim racing the owner's return (m4), or a
  session ending while a folder from the desktop is open (m3).
- `tools/playtest/lib/access_leak_scanner.rb:344-350` allows any item from a scoped folder in the
  top-level `contents` of a `POST /unlock` answer without knowing the target, so it would not flag
  a wrongly served folder there. Worth a note in `PLAYTEST.md` that this class is covered by the
  server tests, not by the scanner.

## The build log's deviations

| Deviation | Judgement |
|---|---|
| `usePayload` filled, never created | Sound; creating one would give every account a capture route. |
| `npcs_added` deep-copied before the filter | Sound and necessary. `objects_added` is still mutated in place (pre-existing). |
| Capture lookup order | Sound; the single-secret fallback never answers with an account password. |
| Loader touches room NPCs only | Sound. |
| `find_container_in_scenario` unchanged | Unsound: see M1. |
| `login_scope_of` returns object and room | Sound. |
| Status codes (422, 403, 404, 400) | Sound and consistent with the client. |
| Keypad hints silent for refused scoped targets | Sound and needed. |
| Held keycard by `ItemIdentity.held_in?` | Unsound: see M2. |
| Profiles without `for` admit nobody | Sound; the validator warns. |
| "PC reachable" also checks containers above the PC | Sound. |
| Desktop adds skip the already-held shortcut; `transfer` defaults to `move` | Sound; `add_inventory_item!` still dedupes. |
| Claim globals logged only | As planned. |
| `|` in PC ids | Sound now that the validator errors on it. |
| Shared rules in `lib/access_identities.rb` with copies in `Game` | Acceptable; a drift test between the two would help. |
| Reach lines and graph nodes only for access-model scenarios | Sound; keeps other output unchanged. |
| No request at an access lock with nothing held | Sound; avoids an empty `card_ids` reading as a trusted claim. |
| Access lock with no `requires` skips step 1 | Sound. |
| Switch user replaces the desktop | Acceptable given one minigame at a time; see m3 for its side effect. |
| Lockout closes the screen | Sound. |
| Dialog only on sign-in desktops; Open returns to the world | Acceptable. |
| Leak scanner allows scoped items in `/unlock` answers | Acceptable with the caveat in m9. |
| Interaction in `unlock-system.js` via `window.interactLoginPc` | Sound. |
| Presence message as a toast; extra events and fields | Sound, all additive. |
| Unowned workstation answers `signin` in every env | Sound; callers ignore the answer for plain workstations. |
| `ownerTracked`, `clockMs`, `onTick` in the env | Sound. |

## Regressions (scenarios with no access fields)

Checked and unchanged: `rfid` doors and objects without `access` (`rfid_lock_passes?` returns
true, as the old trusted branch did); the client `rfid` branch order (a valid saved copy still
reaches the reader); room data for NPCs with a legacy `rfidCard` (the loader adds `creds.card`,
the filter removes `creds` and writes the same `rfidCard` back); no existing mission authors
`role`, `creds` or `lockType: "login"` on a room NPC or object (checked by rendering every
`scenarios/*/scenario.json.erb`), so deleting `role` from NPC records changes nothing there;
`find_accessible_item` only skips sign-in PCs; `/unlock` check 1 is false for every unscoped
object; plain workstations' `onInteract` answers change only where the plan says (unowned or
untracked owner `signin`, knock-out as a leave), and `interactions.js` ignores them. The new
`/clone_card` request after a conversation or keycard copy in m03 to m10 is harmless (recorded or
403, logged only).
