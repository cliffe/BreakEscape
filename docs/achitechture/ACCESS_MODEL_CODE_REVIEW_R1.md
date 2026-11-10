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

## Fixer response

Every finding is fixed; none withdrawn. Each fix has a test that failed on the code before it and
passes after (checked by running the new test against the previous version of the changed files).

| Finding | Outcome | What changed | Test |
|---|---|---|---|
| M1 | Fixed | `find_container_recursive` and `search_nested_contents` skip sign-in PCs and everything under them, and `find_container_in_scenario` no longer walks into a PC's contents, so a sign-in PC and its folders are reached only through the session branch of `container`. | `access_model_no_password_test.rb`: "a name shared with a lobby note does not open a sign-in PC folder with no session", "... does not open the sign-in PC's own contents with no session" |
| M2 | Fixed | `Game#held_keycard_ids` (the `card_id`s on keycard items in the server inventory, which holds the server's own copy) decides "held" in `held_rfid_cards`; `clone_source_keycard` also requires the held item to carry the source's `card_id`, so a name match never stands in. | `access_model_rfid_test.rb`: "a held NPC badge does not count as another NPC's badge with the same name", "a held badge sharing a name with a distant keycard is not that keycard as a copy source" |
| m1 | Fixed | The validator errors on `access` or `acceptsUIDOnly` on any `doors[]` entry, gate or not. The plan puts the list on the room (the 5.6 room allow list and the server's `room_data` read), so the validator closes the gap without a second server rule; `doors.js` is unchanged. No scenario has either field on a door entry. | `validator-access-model.test.mjs`: "access or acceptsUIDOnly on any door entry (gate or not) is an error" |
| m2 | Fixed | A held keycard with no id sends `{ held_card: true }` as its copy source; `/clone_card` records it when a keycard in the server inventory carries that `card_id`, the scenario defines one, and neither is `cloneable: false` (source `{ held: <card_id> }`). The plan's `/clone_card` row says so. | `access_model_rfid_test.rb`: "a held keycard with no id is a copy source by its card_id, and the copy outlives the card", "a held-card copy of a card the player does not hold is refused"; `rfid-clone-card.test.mjs`: "a held keycard with no id (an NPC badge handed over) is recorded as a held card by its card_id" |
| m3 | Fixed | A folder opened from a sign-in desktop (`sourcePcId`, not the PC itself) registers with `pcSessions.registerDesktop`, so a session end closes it with the same message. | `container-transfer-dialog.test.mjs`: "a folder opened from a sign-in desktop closes with the message when the session ends" |
| m4 | Fixed | After a granted claim, `pcSessions.claim` checks `workstationState.presence`; with the owner back it ends the claim (`pc_signed_out`, `owner_returned`, `POST /logout`) and answers `owner_returned`, and `interactLoginPc` shows the message and opens no screen. | `pc-sessions.test.mjs`: "a claim granted after the owner has returned ends at once with owner_returned"; `access-signin-routing.test.mjs`: "a claim that ends because the owner returned shows the message and opens no screen" |
| m5 | Fixed | The `scenario` action answers the sessions, then `Game#end_claimed_sessions!` ends every claimed one on the server, so the reload rule no longer rests on the client's `POST /logout`; the client still sees each claim and reports `claim_ended` as before. Small and as the plan intends (5.3: a reload ends a claim). No logout retry. | `access_model_login_test.rb`: "GET /scenario reports a claimed session and ends it on the server; a password session stays" |
| m6 | Fixed | `recordCloneOnServer` keeps its request as `window.pendingCardCloneRecord` until it settles; `requestRfidAccessUnlock` waits for it (a failed record does not block). | `access-rfid-acl.test.mjs`: "an access-list request waits for a card copy record still in flight"; `rfid-clone-card.test.mjs`: "a save leaves its record as window.pendingCardCloneRecord until it settles" |
| m7 | Fixed | A claim is refused ("Sign in required") when a session is already held at the PC. | `access_model_login_test.rb`: "a claim never replaces a password session at the same PC" |
| m8 | Fixed | `logout_session!` resolves `pc_id` through `find_login_pc` and deletes the session under the PC's id. | `access_model_login_test.rb`: "POST /logout accepts the PC by name, as /login does" |
| m9 | Fixed | The three source-text tests are replaced by `test/js/access-signin-requests.test.mjs`, which runs `api-client.js`, `inventory.js` and the sign-in branch of `interactions.js`. The no-password test gains name-addressed `/container` and `/unlock` cases, a `/unlock` of a scoped folder with no session and two `/inventory` adds with no session; the two-badge, claim-race and folder-session cases are above. The scanner's blind spot is noted in `test_access_signin/PLAYTEST.md` and in `access_leak_scanner.rb`. | `access-signin-requests.test.mjs` (10 tests); `access_model_no_password_test.rb`: "POST /unlock of a scoped folder with no session is refused and carries no contents", "POST /inventory add of a sign-in PC file with no session is refused and carries no text" |

Not acted on: the deviations table's suggestion of a drift test between `lib/access_identities.rb`
and the copies in `Game` (not a finding).

Results: Rails 1067 runs, 0 failures, 0 errors, 1 skip; `bin/test-js` 405 files, all pass; the leak
scanner's tests 11 runs, 0 failures. The validator raises no errors on `test_access_doors`,
`test_access_signin`, `test_access_sessions` or `lab_physical_pentest`. A headless smoke of
`test_access_sessions` on :3001 (game 26, deleted) covered the claim and the reload: a claim at
`dana_pc` with Dana away opened her desktop; after a reload the scenario response still listed the
claim, the browser held no sessions, the server record had none, and a click on `dana_pc` gave
"Dana Reyes is using this PC."; the leak check found nothing.
