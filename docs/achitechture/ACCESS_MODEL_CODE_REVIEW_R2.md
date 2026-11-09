# Access model: implementation review, round 2

Reviewer: fresh, read-only (Opus). Scope: every feature change from the commit before "Access
model steps 1-2" (`12d0f5e6~1`) to HEAD (`ea24264b`) under `app`, `config`, `lib`, `public`,
`scripts`, `tools` and `test`, now including step 10 (`scenarios/lab_physical_pentest`: Melanie
Pierce's sign-in details, `staff_pc_2` as a sign-in PC, `accountProfiles.pierce_desktop` and the
new `PLAYTEST.md`). Checked against `ACCESS_MODEL_PLAN.md`, the deviations in
`ACCESS_MODEL_BUILD_LOG.md` and the round 1 review with its fixer response table.

## Verdict

Closed for this slice. No blockers and no majors. Every round 1 finding is fixed, and every fix
has a test that fails when the fix is taken out (checked by mutation, below). This is round 2 and
it finds nothing above minor, so under AGENTS.md "How a round works" the review loop can stop here.

Five minors remain. The one worth fixing before merge is m1: the round 1 fix for m5 made
`GET /scenario` write the game record outside `with_game_lock`, which reopens, in a narrow window,
the lost-update race that the lock exists to prevent. The fix is two lines. m2 needs a user
decision about what the plan promises for NPC-given keycards.

The withholding holds on every path I traced, including the new code: no response carries
`creds.password`, a capture secret, a sign-in PC's contents or a profile's contents without a
session that admits them. A scratch integration test on `lab_physical_pentest` confirmed it for
the step 10 lab (details under "Step 10" below).

## Baseline

- `bundle exec rails test` (run once): 1067 runs, 4328 assertions, 0 failures, 0 errors, 1 skip.
- `bin/test-js`: 405 of 405 files pass on an idle machine. A first run that shared the machine
  with my mutation runs had four load failures (`client-purchase`, `fingerprint-generator`,
  `password-signin-mode`, and `player-regen`, which hung until I stopped it); each passes alone
  and all pass in the clean rerun.
- Mutation checks ran in a scratch copy of the repository (not the working tree), each against the
  named test file only. Scratch tests were never written into the repository.

## Severity table

| Severity | Count | Findings |
|---|---|---|
| Blocker | 0 | |
| Major | 0 | |
| Minor | 5 | m1 to m5 |

## Round 1 confirmation

"Mutation" is what I removed or reverted in the scratch copy; "fails" names the test that then
failed. Every fix was put back before the next mutation.

| R1 | Fixed? | Where | Mutation | Fails without the fix |
|---|---|---|---|---|
| M1 | Yes | `games_controller.rb:1761-1846`: `find_container_in_scenario`, `find_container_recursive` and `search_nested_contents` skip sign-in PCs and everything under them | removed the three `next if login_pc?` lines | `access_model_no_password_test.rb`: both name-collision tests (PC folder, PC's own contents) |
| M2 | Yes | `game.rb:1573-1601`: `held_keycard_ids` (card_ids on keycard items in the server inventory) decides "held" | `held_rfid_cards` back to `ItemIdentity.held_in?` | `access_model_rfid_test.rb`: "a held NPC badge does not count as another NPC's badge with the same name" |
| M2 (copy source) | Yes | `game.rb:1718-1733`: `clone_source_keycard` needs the held item to carry the `card_id` | dropped the `held_keycard_ids` condition | `access_model_rfid_test.rb`: "a held badge sharing a name with a distant keycard is not that keycard as a copy source" |
| m1 | Yes | `scripts/validate_scenario.rb:5940-5950`: `access` or `acceptsUIDOnly` on any `doors[]` entry is an error | not mutated (validator test reviewed) | `validator-access-model.test.mjs` covers gate and non-gate entries |
| m2 | Yes | `game.rb:1677-1683, 1703-1716`; `interactions.js:911-916`; `rfid-minigame.js:337-367` | server: `held_clone_source_keycard` returns nil; client: `{ held_card: true }` removed | `access_model_rfid_test.rb` (held keycard with no id); `rfid-clone-card.test.mjs` test 5 |
| m3 | Yes | `container-minigame.js:270-276` registers a folder opened from a sign-in desktop | registration skipped | `container-transfer-dialog.test.mjs` test 9 |
| m4 | Yes | `pc-sessions.js:224-235` ends a claim granted after the owner has returned | presence check disabled | `pc-sessions.test.mjs` test 16 |
| m5 | Yes, with a side effect | `games_controller.rb:381-384`, `game.rb:1490-1496` | `end_claimed_sessions!` call removed | `access_model_login_test.rb`: "GET /scenario reports a claimed session and ends it on the server" (see m1 below for the side effect) |
| m6 | Yes | `rfid-minigame.js:358-364`; `unlock-system.js:146-155` | wait removed; pending record not set | `access-rfid-acl.test.mjs` tests 18 and 19; `rfid-clone-card.test.mjs` test 9 |
| m7 | Yes | `game.rb:1458` refuses a claim where a session is held | refusal removed | `access_model_login_test.rb`: "a claim never replaces a password session at the same PC" |
| m8 | Yes | `game.rb:1478-1484` resolves the PC through `find_login_pc` | key back to the raw `pc_id` | `access_model_login_test.rb`: "POST /logout accepts the PC by name" |
| m9 | Yes | source-text tests replaced by `access-signin-requests.test.mjs` (runs the modules); new no-password cases; scanner blind spot noted in `test_access_signin/PLAYTEST.md:40-44` and `access_leak_scanner.rb:344-349` | reviewed, not mutated | the three source-text tests are gone; the remaining `readFileSync` uses load modules into data URLs, not string matches |

No round 1 finding is left open.

## The fixer's new code, looked at afresh

- **`held_keycard_ids`** (`game.rb:1573`). Sound. It reads `card_id` (or `scenarioData.card_id`)
  on inventory keycards. I traced every writer of `player_state['inventory']`: the
  `/inventory` add stores `canonical_inventory_item` (the scenario's own copy) or, for a
  client-built item, the client hash minus `CLIENT_ITEM_FORBIDDEN_FIELDS`, which strips
  `scenarioData`; a client-built item can only be a `notepad` or a decor cup, never `keycard`.
  `update_room` `add_object` permits no `card_id`. Flag rewards and starting items are
  server-authored. The `Api::GamesController#inventory` that adds client hashes unchecked is not
  routed. So a forged `card_id` cannot reach the inventory; what can is an NPC's real badge
  through an unproven give (m2).
- **`held_card` copies** (`record_card_clone!`, `held_clone_source_keycard`). Sound: held,
  defined by the scenario, neither copy nor definition `cloneable: false`, and the record keys on
  the definition's `card_id`. The NPC-level `cloneable: false` is not consulted on this path; the
  plan's `/clone_card` row does not ask for it, so I note it only.
- **`end_claimed_sessions!`**. Correct in effect, but it saves outside the game lock (m1).
- **The pending card record**. Sound; a record that fails resolves to null and does not block. A
  record that never settles would hold the reader tap until the browser gives up on the fetch;
  not worth a finding.
- **The claim-after-return path**. Sound for the owner's return; the same gap remains for the
  auto lock (m3).
- **The container lookup skipping sign-in PCs**. Sound. The other lookups now agree on order:
  `login_scope_of`, `find_scenario_object` and the controller's `find_object_in_scenario` all walk
  rooms, then top-level objects depth first, then profiles, matching id or name, so `/unlock`
  check 1 and the object whose contents an unlock answer returns are the same object.
  `find_accessible_item` (generic `/inventory` add) never enters a sign-in PC or a profile; a
  scratch request for a profile file with no session answered 422 "Item not found in scenario".

## Findings

### Minors

**m1. `GET /scenario` now saves the game outside `with_game_lock`, so a write that lands during a
reload can be lost.**
`app/controllers/break_escape/games_controller.rb:384` (the `scenario` action, not in the
`around_action :with_game_lock` list at `:88`), calling `Game#end_claimed_sessions!`
(`app/models/break_escape/game.rb:1490-1496`).

The round 1 m5 fix ends claimed sessions inside `GET /scenario`, which runs on the record loaded
by `set_game` with no row lock. `save!` writes the whole `player_state` column, so any locked
write that commits between that load and this save is overwritten with the stale copy. The
controller's own comment (`:34-80`, games 1021 and 1022) describes exactly this race and why the
lock list exists. Only games with an open claim save here (the method returns early otherwise),
so scenarios without the feature are unaffected.

Failing scenario: in `lab_physical_pentest`, the player has claimed Melanie's session and reloads
before she returns. The old page's `pagehide` flush (`state-sync.js:148`, a keepalive
`PUT /sync_state`, which takes its own row lock) commits while the new page's `GET /scenario` is
between its load and its save. The scenario action then saves the pre-flush `player_state`, so
the globals the flush carried (for example a `kp_unlocked_screen` set in the last 30 seconds) are
gone from the server. Reproduced at model level in a scratch test: a second `Game` instance adds
`CONCURRENT_UNLOCK` to `unlockedObjects` and saves, then the first instance's
`end_claimed_sessions!` runs, and `unlockedObjects` no longer holds it.

Fix: take the lock for the write only, so the action stays a cheap read for every other game:
in `end_claimed_sessions!`, return early when no claim is held (as now), then
`with_lock { claimed = ...; player_state['sessions'] = ...; save! }` (Rails' `with_lock` reloads
the row first). Add a test that saves a change through a second instance between the load and
the call and asserts it survives.

**m2. An NPC-given keycard is not a server-established fact, though the plan says a held
keycard is. USER DECISION.**
`app/controllers/break_escape/games_controller.rb:2056-2071` (location `npc` in
`validate_item_collectible`) and `:2210-2218` (`find_accessible_item` priority 0.5);
`docs/achitechture/ACCESS_MODEL_PLAN.md:247` ("A puzzle that must not be possible to get past
should rest on a fact the server checks itself: a keycard item held").

`/inventory` add with `source_npc_id` accepts any item in that NPC's `itemsHeld` once the NPC is
in `encounteredNPCs` (the player has entered their room). Nothing records that the ink actually
ran the give. So for a badge an NPC carries in `itemsHeld`, "held" means "the player entered the
room", the same strength the plan gives a card copy taken in conversation. After the round 1 M2
fix, `held_rfid_cards` trusts exactly this inventory. This is how the engine has always worked
(not a regression), but it undercuts the plan's sentence, and NPC badges are the plan's usual
example.

Failing scenario: in the round 1 two-badge fixture, a modified client that has entered Morgan's
room sends `POST /inventory { action_type: add, item: { type: keycard, name: "Staff badge" },
source_npc_id: "morgan" }` without ever talking to Morgan; the server stores Morgan's
`EXEC-DF-01` badge, and `POST /unlock` on `exec_suite` with that `card_id` answers 200.

Options for the user: (a) correct the plan's sentence to "a keycard placed in a room or
container, a password or PIN typed and checked on the server", and say NPC gives are as strong as
`encounteredNPCs`, with the validator noting an access list that only an `itemsHeld` badge opens;
or (b) have the server record gives it can prove (an ink `#give_item` routed through a server
call) and only count those. (a) is a documentation change; (b) is a separate piece of work
outside this slice.

**m3. A claim answered just as the screen auto locks is not ended by the auto lock.**
`public/break_escape/js/systems/pc-sessions.js:224-235` (`claim`) with `screenAutoLocked`
(`:247-252`).

The round 1 m4 fix covers the owner's return during the claim request, but not the auto lock.
`workstation_auto_locked:<pcId>` fires once, at `lockAt`; if that falls while the claim request is
in flight, `screenAutoLocked` finds no session and does nothing, the claim then lands and the
desktop opens on a screen that is now locked. The session lasts until the owner returns. Only a
scenario with a policy `autoLockMin` above 0 is affected, and the window is one round trip
(`onInteract` checks the auto lock just before it answers), so the effect is small.

Failing scenario: `test_access_sessions`-style PC with `autoLockMin: 1`; the player clicks one
tick before `lockAt`; the needs tick fires the auto lock during the `POST /login`; the desktop
opens and stays open until the owner is back.

Fix: after a granted claim, also check the screen (`window.gameState.globalVariables[pcId +
'_screen_locked']`, which the workstation layer sets) and end with `auto_locked` and
`SCREEN_LOCKED_MESSAGE`, as the presence check does. Add the matching `pc-sessions.test.mjs` case.

**m4. `lab_physical_pentest/PLAYTEST.md` beat 3 times Melanie's next leave from beat 1, but beat 2
runs in between.**
`scenarios/lab_physical_pentest/PLAYTEST.md:112`.

"Wait for Melanie's next `npc_left_post:pierce` (about two minutes after she came back in beat
1)". Beat 2 (fetch the keylogger from `briefing_room`, wait for Chris to leave, wait about two
minutes for his next sign-in) takes longer than that, so by beat 3 Melanie may already be away,
or back again. A `waitFor` on the event then waits a whole extra cycle (about three minutes) or,
if she is away now, the run misses a claim it could make at once. Not a defect in the scenario.

Fix: say "check `window.__test.access.workstation('staff_pc_2')`; if `present` is false she is
away now, so click; otherwise wait for `npc_left_post:pierce`".

**m5. Test gaps in the new code.**
- No test for m1 (a write between the scenario action's load and its save).
- `access-signin-routing.test.mjs` "a claim that ends because the owner returned shows the message
  and opens no screen" stubs `pcSessions.claim`, so it passes with the m4 presence check removed;
  `pc-sessions.test.mjs` test 16 is the one that guards m4. Fine as a pair, but worth a comment
  in the routing test so nobody deletes the other.
- No test that the `held_card` path ignores a keycard the player is not holding when the client
  clicked a world keycard with no id (the client sends `held_card: true` for any id-less keycard
  sprite, `interactions.js:916`). Behaviour is right (403, nothing recorded); only the test is
  missing.

## Withholding, traced afresh

| Path | Result |
|---|---|
| `GET /scenario` | No NPC records (rooms are stripped to navigation fields), no `accountProfiles`; `sessions` carries npcId, username, displayName and via only. |
| `GET /room/:id`, a door `/unlock` answer, NPC moves (`npcs_added`, deep-copied before the filter) | `withhold_npc_secrets!` removes `creds`, `role` and the account's `usePayload.secret` and `addCapture.secret`; a sign-in PC loses `contents` and stays `locked: true` whatever `unlockedObjects` or object state says (`object_state_params` permits only `opened`, `on`, `brightness`, `screen_state`). |
| `GET /container/:id` | A sign-in PC needs a reachable PC and a session; a scoped folder needs an admitting session and an unlocked path; the generic path never enters a sign-in PC (M1). |
| `POST /unlock` (object) | Check 1 runs before every method, including `unlocked` and `flag`; PIN pips, the letter-case hint and `reason: uid_only` are all silent for a refused scoped target. |
| `POST /inventory` add | With `source_pc_id`: session, scope, path, `takeable`, `transfer`. Without: profiles and sign-in PC contents are never searched. Errors name the item the client asked for, or a scoped item's name only after the session check. |
| `POST /login` | Unknown username and wrong password answer alike; `notPermitted` only after a correct password (as planned); no letter-case hint. |
| `GET /capture_secrets` | Account passwords only for NPCs with a capture route, only for an earned capture (client-reported, as the plan accepts). |
| `GET /login_accounts` and room tiles | username, displayName, portrait, avatar. |
| Reloads | A password session survives; a claim is answered once and ended on the server (m1 for the lock). |
| Test bridge | `window.__test.access` reads client state only. |

## Regressions (scenarios with no access fields)

Unchanged from round 1's check, and the new code keeps it so: `end_claimed_sessions!` returns
before saving when no claim exists; `copiedItems`, `sessions` and the other new keys are read
through `Array()` or type checks, so games created before this slice need no migration; the new
`next if login_pc?` lines and the profile pass in `find_object_in_scenario` find nothing in a
scenario without sign-in PCs or profiles; the client `rfid` order is the same for a lock without
`access` (`hasValidClone` implies a cloner with saved cards, which reached the reader before).

## Step 10: `lab_physical_pentest`

- **Withholding.** A scratch integration test created a game from the real mission, opened every
  room and met every NPC, then checked: `GET /scenario` and every `GET /room/:id` carry neither
  `Ledgerwell#Autumn26` nor the profile text, and no `"creds"`; `GET /container/staff_pc_2`
  answers 403 "Not signed in"; `GET /container/pierce_saved_logins` 403; `POST /unlock` on the
  profile file 422 "Invalid attempt"; `POST /inventory` add of it 422; `GET /capture_secrets` with
  no capture carries no password. After a claim (200, `via: claim`), the desktop answer carries the
  profile and still not the password; a wrong sign-in as `M.Pierce ` answers the generic
  "Incorrect username or password".
- **The scenario matches the plan's step 10.** Pierce has `role: finance` and `creds`; her
  `usePayload` keeps `host` only and the loader fills the rest; the capture mapping keeps
  everything but `secret`; `staff_pc_2` is `locked: true, lockType: login` with no `contents`,
  `locksScreenOnLeave: false`, `screenOwner: pierce`; `pierce_desktop` holds the one
  `takeable: false` file with the passwords as dots; the lesson moved to the
  `staff_pc_2_accessed && staff_pc_2_owner_away` variant (the build log explains why both).
- **Outside step 10, unchanged.** Chris's (`c.hampshire`) and Sofia's (`s.lord`) passwords are
  still inline `usePayload.secret` on NPCs without accounts, and Chris's is in a keylogger
  `observationVariants` text, so both reach the browser in room data as before. The plan scoped
  step 10 to Pierce; converting them would be a later content pass, not a finding here.
- **`PLAYTEST.md` against the scenario.** The PC, profile, file, task ids (`opt_unlocked`,
  `plant_kl`, `grab_creds`), globals (`kp_unlocked_screen`, `kp_creds_captured`), item
  (`kit_deviceA`, "Planted keylogger"), the "Harvested Credentials" terminal, the events and the
  expected validator output (I ran the validator: no errors, the listed warnings, and the two
  identity reach lines) all match. The one inaccuracy is the beat 3 timing (m4).

## Notes on the deviations (no new findings)

- The validator route for round 1 m1 (an error on any `doors[]` `access`) is a sound choice: the
  server reads the room, and `doors.js` reading an override can no longer matter in a valid
  scenario.
- At a lock with both `access` and `requires`, a request with no `card_ids` keeps the trusted rule
  (`rfid_lock_passes?`, `game.rb:1632`). As planned, and round 1 judged it sound; noted again only
  because a modified client gets past such a lock by omitting `card_ids`, so authors who want the
  list enforced should not also set `requires`. The plan or the validator could say so.
