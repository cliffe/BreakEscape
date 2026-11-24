# S5a build brief: privilege on a session (feature A18)

Written 2026-11-23 by the S5a planner. Read `docs/agents/OPS_CORE_BUILD_BRIEF.md` first; its rules
bind every builder here (worktree `/data/be-ops-build`, branch `ops-build`, the shared test lock,
no re-record of golden fixtures, no `git stash`, own files only).

The design is `docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md` (cited below as `P<line>`), stage
S5a only. S5b (cached credentials) and S5c (account kinds) are NOT built here. That plan was written
before the ops core stages landed; section 2 below rules on every place where it assumes something
the core built differently. Where this brief and the plan disagree on a name, a line number or
which method holds a parameter, THIS BRIEF is right (it was checked against the code on
`ops-build`). Where they would disagree on what a player can do, the item is marked FOR THE OWNER
and builders build the recommended option unless the orchestrator's prompt says otherwise.

Short names: `GM` = `app/models/break_escape/game.rb`, `NA` =
`app/models/break_escape/network_access.rb`, `NO` = `app/models/break_escape/network_ops.rb`,
`GC` = `app/controllers/break_escape/games_controller.rb`. Code line numbers are those on
`ops-build` when this was written; two fixers were editing at the time, so re-find each anchor by
name before editing.


## 1. What S5a adds, in play

- Every session the player holds on a sign-in PC now has a level, user or admin, worked out by the server on each read; nothing new is stored and no route is added.
- The player gets admin by signing in (typed or keyring) with an account the scenario marks `creds.admin: true`, or by the core's step up (a technique card on a local weakness whose grant says `access: "admin"`).
- An admin session at a PC opens the profiles of the accounts that use that PC, which under S5a alone means its `owner` (S5b widens it to cached accounts).
- An unlocked admin session on a PC whose service is on lets the player install a USB device the PC's policy would refuse; a device that needs someone signed in (a BadUSB socket) still takes only a session at that PC's own keyboard, and a remote or technique session there now gets the toast "Nobody is signed in at this keyboard."
- The player sees an Administrator marker on the desktop's taskbar; if an override has lapsed without the client knowing, the server refuses the plant and the item stays in the tray.

## 2. Mismatch rulings

Every row was checked at the plan line and at the code line. "Name only" means the design is
untouched and builders use the real name or place. M25 to M30 are the planner's own finds.

| # | Plan | Code (on `ops-build`) | Verified | Ruling | What builders do |
|---|---|---|---|---|---|
| M1 | P186-188: an `access:` keyword on `login_session_answer` | keyword is on `start_login_session!` (`GM:4583`); `login_session_answer` (`GM:4638`) takes none and reads `client_access_level(pc_id)` at `GM:4652` | yes | code stands (name only) | Add no parameter. The answer line stays as built. |
| M2 | plan never names `client_access_level`; `session_access` may answer nil (P336-339) | `client_access_level` (`GM:4671-4674`) reads the stored key and answers `'admin'` or `'user'`, never nil; FOUR callers, not three: `GM:4652`, `NA:1077`, `NO:391`, `NO:603` | yes (digest missed `NO:603`) | code stands for the name; plan stands for the rule | Unit 02 adds `session_access` and makes the body of `client_access_level` `session_access(pc_id)` (it may now answer nil; the three `== 'admin'` readers need no change). Unit 03 fixes `NO:603` (see M27). |
| M3 | P360-362, P1289-1291, P1403-1404: `needs.session: "user"` is met by any live session, "relay and claims included" | `ops_need_session` (`NO:386-394`) refuses a relay record, an expired token session and a locked session, by the S3 server R1 ruling M1; a claim does meet it; it does not ask `session_route_up?` | yes | NEW DECISION, FOR THE OWNER (O1 below) | Recommended build: keep the relay exclusion; a claim still feeds a step up; the level comes from `session_access`. |
| M4 | P847-848: `access` is "a new parameter" of `login_session_answer`, `session_for_client` and the host row | all three already call `client_access_level` (`GM:4652`, `NA:1077`; `session_for_client` `GM:3838` passes `pc_id:`) | yes | code stands (name only) | Nothing: M2's one body change feeds all three. |
| M5 | P681-683: the mirror deletes `access` when it marks a session locked | `publicSession` copies `access` (`pc-sessions.js:197-198`) whatever `locked` is; the lock writer sets `s.locked = true` (`:920`) and leaves `access` | yes | plan stands (not built yet) | Unit 09 deletes `access` at the lock writer and never copies it out of a locked entry. |
| M6 | P674-683: S5a adds `access` to `publicSession` and the bootstrap adopt | already there: `:197-198`, `accessFields` `:248-250`, used at `:386`, `:596`, `:614`, `:689`, `:734` | yes | code stands | Nothing beyond M5. |
| M7 | P685-686: Administrator marker on the taskbar | the network view already tags admin (the core's); `utils/pc-taskbar.js` has no mention of `access` | yes | plan stands for the taskbar; core plan 14.1 stands for the network view | Unit 09 adds the taskbar marker only. No change to the network view. |
| M8 | P698: `plantRefusal(..., { admin })` at `pc-policy.js:67`, called at `interactions.js:1056` | `plantRefusal(heldItems, objectData, scenario)` at `pc-policy.js:71`; caller `interactions.js:1098` | yes | plan stands; lines drifted | Unit 08 adds the fourth argument; unit 11 passes it. |
| M9 | P498-499, P701-707: `sessionAdmin`, `keyboardAdmin`, `plantAdmin`, `sessionGrantPc`, `gatedRemove` | none exist (the `pcPolicy` export at `pc-policy.js:81` lists neither) | yes | plan stands (build target) | Units 08 and 09. |
| M10 | P514-516: `sendInventoryRemove(..., { withBody })`, retry at `apply-actions.js:42-63` | `sendInventoryRemove(id, { usedOn, gameId })` at `apply-actions.js:37-65`, no `withBody` | yes | plan stands; lines drifted | Unit 10. |
| M11 | P478-482: `interactions.js:1081-1088`, `apply-actions.js:271-293` | `consumesItem` branch `interactions.js:1123`; `remove_item` `apply-actions.js:277-292`; `confirm_action` `:412-430` | yes | drift only | Find by name. |
| M12 | P464, P1212: remove branch at `GC:1454-1460` | `when 'remove'` at `GC:1447`; `record_planted_item!` `:1451`; `remove_inventory_item!` `:1452` | yes | drift only | Unit 07 edits there. |
| M13 | P96-97, P402, P442: implant lines `NA:498`, `:501`, `:509`; `remote_route_session?` at `:1544` | the two `implant_not_ready` returns sit at about `NA:499` and `:502`; `plant_refused?` call `NA:509`; `remote_route_session?` at `NA:1561` | yes | drift only | Unit 06 edits there. |
| M14 | P756: `desktop_request_allowed?` at `NA:1495` | `NA:1511`, with the core's technique term in the foothold branch (`:1527`) | yes | not S5a's (the collect route is S5b) | Nothing. |
| M15 | plan's `GM:` numbers for `start_login_session!`, `session_identity`, `session_lockable?`, `session_for_client`, `login_session_answer`, `WITHHELD_NPC_KEYS`, `ACCESS_STATE_DEFAULTS`, `session_route_up?` | now `GM:4583`, `:3288`, `:3884`, `:3838`, `:4638`, `:7555`, `:3056`; `session_route_up?` `NA:1174`; also `session_admits?` `GM:3305`, `scope_admitted_by_session?` `:3333`, `admitted_profiles` `:3363`, `login_desktop_contents` `:3382`, `find_login_item` `:3393`, `pc_admits_account?` `:3421`, `login_pc_owner` `:3429` | yes | drift only | Find by name. |
| M16 | P789: the implant action "adds one reason, `needs_console`, to its closed list"; digest asked whether that means `ops_refusal_codes.json` | that fixture is read only by the ops-route tests (`network_scan_test.rb:389`, `ops-model.test.mjs:20`, `network-view-techniques.test.mjs:310`) and every code in it must have a `REFUSAL_TEXT` line; the implant route is not one of those routes. It already holds `not_admin`, `locked`, `not_reachable` | yes | code stands | Do NOT add `needs_console` or `usb_refused` to `ops_refusal_codes.json`. The implant route's reasons are pinned in `admin_usb_test.rb`. |
| M17 | P986-993: `privilege_<scenario>.json` fixtures "captured from `main` before any engine change", replayed by `test/integration/ops_privilege_unchanged_test.rb` | the fixture folder holds `core_*` and `log_*` only; the engine already has S1 to S3; the built mechanism is ONE replay test (`test/lib/ops_unchanged_replay_test.rb`) fed by the folder, with capture through `lib/tasks/ops_unchanged.rake` | yes | new decision (mechanism: code stands) | Unit 01 captures the privilege fixtures from `ops-build` as it stands BEFORE any S5a engine edit, through the rake task, and adds no second replay test. This is a first capture, not a re-record. |
| M18 | P1007, P1374: unit tests in `test/models/` | the engine's unit tests live in `test/models/break_escape/` | yes | code stands (name only) | New unit tests go in `test/models/break_escape/`. |
| M19 | P1258: `OpsLog::EVENTS` | `BreakEscape::OpsLogEvents::EVENTS` (`lib/break_escape/ops_log_events.rb:23`) | yes | code stands (name only) | Unit 04 adds its two lines there. |
| M20 | P133-134: proof kinds `session planted dropped held foothold` | `PROOF_KINDS` now ends with `technique_card` (`credential_model.rb:36`) | yes | not S5a's (S5b adds `harvested`) | Nothing. |
| M21 | P1219: "the network host row's serialiser (the core plan's)" | `host_row` is in `NA:1054`; its admin line is `NA:1077`; the `NO` wrapper was removed | yes | code stands (name only) | Nothing: M2 feeds it. A locked or switched-off admin session then sends no `access`, as P849 wants. |
| M22 | core plan 14.1 (line 2006): the `needs.session` check "calls the same reader once it exists" | `ops_need_session` calls `client_access_level` (`NO:391`) | yes | same as M3 | Unit 03. |
| M23 | P1215-1216: `#container` writes `admin_profile_read` "in its profile branch" | `container` (`GC:627`) now takes its refusals from the pure, shared `container_reach_refusal` (`GC:3203`, also used by `GET /log_rows`), which must write nothing | yes | code stands for the helper; plan stands for the row | Unit 07 writes the row in `#container` itself, after the refusal check, in the scoped branch (`GC:649`), never inside `container_reach_refusal`. |
| M24 | P1298-1299: a password sign-in that replaces a technique record takes the level of the account | `start_login_session!` builds a fresh record and writes `access` only when given (`GM:4596-4604`); a password record has no key | yes | no conflict | Nothing to change; unit 02's step 7 gives the account's level and a test pins it. |
| M25 | P1262: detail `profile` with rule `{ id: 'profile' }` | `OpsLogEvents::KINDS` has no `'profile'` entry (kinds: door, object, pc, jack, ap, account, npc, card, network, host, service, technique, foothold); the events check refuses an id kind with no entry (`ops_log_events.rb:281`) | yes | plan stands; one more edit | Unit 04 adds a `'profile'` kind (name: the id when `accountProfiles` holds it, else nil; no room). |
| M26 | P1309-1311: the core's refused-implant test "does not assert the reason, so the S5a commit does not break it" | it does: `network_technique_session_test.rb:110` asserts `not_ready`; so do `network_implants_test.rb:116` (a foothold session) and `demo_access_tour_devices_test.rb:341` (a foothold session on `reception_pc`) | yes | plan is wrong on the fact; its design stands | Unit 06 changes exactly those three assertions to `needs_console` (section 4). Nothing else in those files. |
| M27 | (S3 server R1 m11) | `ops_technique_repeat_answer` writes the log detail `access` from `client_access_level` (`NO:603`); once that can answer nil (route down, account gone) the detail is not in `%w[user admin]` and the log helper raises in test and development | yes | new decision | Unit 03 makes that line read the repeat record's own stored `access` (`'admin'` when the record says so, else `'user'`). |
| M28 | P339: `session_access` step 4 asks `session_route_up?` | `ops_need_session` does not | yes | plan stands (stricter) | Unit 03: a `session` need is met only when `session_access` is not nil, on top of the terms already there. If an S3 test fails on the stricter term, report it; do not edit the test. |
| M29 | P961-962: "no technique session exists" in a scenario without the new fields | `scenarios/test_ops_access` (landed with S3) has an `access: "admin"` grant and a `needsSession` socket | yes | new fact | Section 4: its technique admin session gains the two admin powers; its graph gains an `admin@` node. |
| M30 | P1262: the row is written by `GET /container` "in its profile branch" | a profile's TOP-LEVEL items are listed by the desktop itself (`render_login_desktop`, `GC:3273`, through `login_desktop_contents`), not by the profile branch; only a folder inside a profile is opened through that branch | yes | plan stands as written; see open item 1 | Unit 07 writes the row on a profile-scoped container open only. |

**Summary.** 30 rows, all verified. 12 are a name, a place or line drift only (M1, M4, M6, M11, M12, M13, M15, M16, M18, M19, M21, M24). 2 are not S5a's (M14, M20). M22 is M3 seen from the core plan. 8 are things the plan asks for that are simply not built yet, with the real anchor given (M5, M7, M8, M9, M10, M23, M25, M28). 7 needed a ruling (M2, M3, M17, M26, M27, M29, M30); one of them changes what a player can do (M3, item O1). The digest was wrong in one place (M2: it listed three callers of `client_access_level`; there are four) and the plan in one (M26).

### FOR THE OWNER

**O1 (M3): may a relay session feed a step up to admin?**
- *Option A, as the plan was signed off (P361-362, P1403-1404):* any live user session meets `needs.session: "user"`, a relay (the shared screen of an assist invite) included. In play: a player who has only talked someone into sharing their screen can use a local-weakness card there and come away with admin. For safety: the relay record is the account holder's own session, ends when the invite ends and is dropped on every reload; the step up would replace it with a technique record that carries the foothold and outlives the invite. That is the case the S3 server review flagged (M1: "a stale or relay record must not be stepped up to admin").
- *Option B, as built (recommended):* a relay record never meets a `session` need; a typed sign-in, a keyring sign-in, a claim of a desktop left open, and a technique user session all do. In play: the "unlocked screen" lesson of P1403-1404 still works through a claim; an assist invite alone is not a way to admin, the player must first get a session of their own on the machine. Nothing a reviewed safety ruling covers is loosened.
- The design can work either way, so the safety ruling stands unless the owner says otherwise. Builders build B. If the owner picks A, the change is one term in `ops_need_session` plus one test, and it must be listed in section 2b.
- Either way a locked session and an expired token session do not meet a need: the plan (steps 2 and 3) and the code agree.

**O2 (M29): `test_ops_access` changes when S5a lands.** Not a design choice, but the owner should know that the plan's "no existing scenario can be admin" was written before that scenario existed. See section 4. Recommendation: accept; it is the designed behaviour of a technique admin session (core plan 14.1) arriving in the one scenario that has one.

### 2b. Access checks this stage widens (each is the plan's design; none is a side effect)

1. **Profile scope.** `session_admits?` and `scope_admitted_by_session?` (profile branch) today admit a profile only for a session whose own identity its `for` list admits. S5a adds: or an admin session at a PC whose owner the `for` list admits. This widens `GET /container`, the inventory add from a desktop, and every caller of `session_admits?` (the unlock and take paths at `unlock_scope_refused?`; S3 security F5 notes these ask `session_admits?` alone, with no route check beyond `session_route_up?`).
2. **USB policy.** `AccessWork.plant_refused?` answers false when the caller passes `admin: true`. Only three player-side server sites may pass it (the implant path, the plant proof, the new remove check). The NPC-side reader (`access_work.rb:1265`) and both validators (`validate_access_work.rb:333`, `validate_network.rb:761`) must keep the default.
3. **`needs.session: "admin"`.** Today only a technique record stored at admin meets it. S5a adds a typed or keyring session of a `creds.admin` account (core plan 14.1 asks for this).
4. **Nothing else.** The implant path's keyboard-only rule, the relay exclusion (O1), "an access level is sent only when admin" and "`access` is stored only on a technique record" all stand. Two checks get STRICTER: the inventory `remove` action refuses a plant the policy refuses (today it removes the item silently), and a `session` need now also requires the session's route to be up (M28). A stored `access` key on a record that is not `via: "technique"` is now ignored (today `client_access_level` would honour it).

## 3. The build: ordered units, one builder each, disjoint files

**Rules for every unit.** Edit only the files in your list; if you need a change elsewhere, report
it. Re-find each anchor by name (lines drift). New Ruby unit tests go in
`test/models/break_escape/`, controller tests in `test/controllers/break_escape/`, JS tests in
`test/js/` (run with `node <file>`). Run Rails tests as
`flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <files>` from the worktree root, and
after any edit to an engine Ruby file run `bin/ops-golden-compare` (no outer `flock`). It must
pass with NO capture or re-record; the only fixtures anyone captures in this stage are unit 01's
new ones, before any engine edit. "Must pass unmodified" means you do not edit that test file at
all, except the three assertions named in unit 06. A new static JS import goes on every harness
copy list that copies the importing module (grep `test/js` for the importer's file name). Commit
only when your prompt says so, by explicit path. S5b and S5c are not built: no `cachedAccounts`,
`cachedAt`, `harvestedAccounts`, collect route, `harvested` proof, `accountKind`, `localTo`,
`domain`, `accountOnly`, and no `pc_admits_account?` delegation.

**Order and what runs side by side.**

| Wave | Units (side by side within a wave) |
|---|---|
| 0 | 01 alone (it must capture before any engine edit) |
| 1 | 02, 04, 08, 12, 13 |
| 2 | 03, 05, 06, 09, 14 (03, 05, 06 need 02; 06 needs 04; 09 needs 08's signature; 14 needs 13) |
| 3 | 07 (needs 05, 06), 10 (needs 08, 09) |
| 4 | 11 (needs 10), 15 (needs 07, 13, 14) |
| 5 | 16 (needs 15), 17 |
| after | scripted playtest and live browser proof by a tester (not a builder unit), from unit 15's `PLAYTEST.md` |

`game.rb` is edited by units 02 then 05 only, never at the same time. Shared single-line files
have one owner each: `ops_log_events.rb` unit 04, `scenario-schema.json` and
`validate_scenario.rb` unit 13, `ops_unchanged_cases.rb` unit 01. `config/routes.rb`,
`game_policy.rb` and the controller's `set_game` and lock lists are NOT edited in S5a (no route
is added; the collect route is S5b's).

### Unit 01: unchanged-scenario fixtures (first, alone)

- **Files:** `test/support/ops_unchanged_cases.rb` (add cases), `test/fixtures/files/ops_unchanged/privilege_test_access_signin.json`, `privilege_test_access_sessions.json`, `privilege_test_access_keyring.json`, `privilege_test_access_social.json` (new).
- **Read:** P986-1003; `lib/tasks/ops_unchanged.rake` (its header says how to add a fixture); `docs/agents/ops_core_build/HANDOVER_L1a_1.md`; the existing cases in `ops_unchanged_cases.rb` as a model.
- **Build:** one case per scenario, replaying through the real routes: sign-in, lock, unlock, keyring sign-in, borrow "done", an implant, a plant the USB policy ALLOWS through the inventory `remove` action (with `used_on`), `GET /container` of a desktop and of a profile folder, `GET /keyring`. Each case only where its scenario has the thing. Capture with `ONLY=<name> bin/rails app:ops:unchanged:capture` on the worktree as it stands.
- **Do NOT:** put a session-shaped implant under a live foothold, `from`, relay or technique session in any case (that one answer changes by design, section 4, and is covered by unit 06's tests); touch any `core_*` or `log_*` fixture; edit an engine file; add a second replay test (M17).
- **Tests:** none new; the fixtures are replayed by `test/lib/ops_unchanged_replay_test.rb`.
- **Proof:** `bin/ops-golden-compare` passes with the four new names; `git status` shows only your files.
- **Hand on:** the four fixture names, and for each the list of step ids, so later units know what is pinned.

### Unit 02: the level helper and its readers (`game.rb`)

- **Files:** `app/models/break_escape/game.rb`; `test/models/break_escape/session_access_test.rb` (new).
- **Read:** P334-371 (the helper; ignore the sentence about relays feeding a step up, see O1), P674-683, P846-850; core plan lines 63-84; `HANDOVER_core_10a.md`.
- **Build:**
  - `session_access(pc_id)` beside `session_identity`, the eight steps of P336-343 in that order: no record → nil; `credential_session_expired?` → nil; `session_identity` nil → nil; `session_route_up?` false → nil; `relay_session?` or `via == 'claim'` → `'user'`; `via == 'technique'` → `'admin'` only when the record's `access` is exactly `'admin'`, else `'user'`; `via` `password` or `credential` → `'admin'` when `account_admin_at?(npc, pc)`, else `'user'`; anything else → `'user'`.
  - `account_admin_at?(npc, pc)`: `npc['creds']['admin'] == true` (the literal `true`, nothing truthy) and `pc_admits_account?(pc, npc)`.
  - `session_admin?(pc_id)`: `session_access(pc_id) == 'admin'`.
  - `keyboard_admin?(pc_id)`: `session_admin?(pc_id)` and the record has a blank `foothold` and is not `remote_route_session?` (P432-433).
  - `client_access_level(pc_id)`: body becomes `session_access(pc_id)`; fix its comment. Leave its callers at `GM:4652` and `NA:1077` as they are, and leave `login_session_answer`'s signature alone (M1, M4).
  - A stored `access` key is read ONLY in step 6. A password, credential or claim record that somehow carries `access: 'admin'` is a user session.
- **Do NOT:** write a level anywhere; add a key to `ACCESS_STATE_DEFAULTS`; change `start_login_session!`; pass `pc_id:` from the two claim callers of `login_session_answer` (a claim is never admin, so its answer needs no level); touch profiles (unit 05), `network_ops.rb` (unit 03) or `network_access.rb`.
- **Tests (`session_access_test.rb`), sessions made through the real routes where one exists:** password user; password admin; keyring credential admin; token session of an admin account (admin); owner claim of an admin account (user); guest claim (user); relay (user); locked (nil); expired token (nil); route down (nil); PC service off (nil); account NPC gone (nil); lock then unlock keeps admin; Switch user to a user account drops it; a borrow hand-back that displaces a keyboard admin session drops it, a remote admin session survives it; a technique record at `access: 'admin'` is admin and at `'user'` is user even when its account has `creds.admin`; a password sign-in that replaces a technique admin record takes the account's level (M24); a hand-built password record with `access: 'admin'` and no `creds.admin` is user; an admin account at a PC whose `access` list refuses it is never admin; `access: "admin"` is present on the sign-in answer, the mirror entry (`session_for_client`) and the host row for a password admin session, absent for a user session and for a technique USER session, and absent from the next answer once the session is locked, the route drops or the PC goes off; `creds.admin` set to the string `"true"` or `1` is not admin.
- **Proof:** your file; then, unmodified: `test/models/break_escape/technique_session_record_test.rb`, `credential_sessions_test.rb`, `access_model_rules_test.rb`, `test/controllers/break_escape/network_technique_session_test.rb`, `ops_access_scenario_test.rb`, `network_no_exposure_test.rb`, `network_ops_no_exposure_test.rb`; `bin/ops-golden-compare`.
- **Hand on:** the four method names and their visibility (unit 06 calls `keyboard_admin?` and `session_admin?` from `network_access.rb` and `capture_proofs.rb`; say whether they are private and reachable there), and the test file's helper for making an admin game.

### Unit 03: the needs predicate and the repeat row (`network_ops.rb`)

- **Files:** `app/models/break_escape/network_ops.rb`; `test/models/break_escape/ops_need_session_level_test.rb` (new).
- **Read:** `HANDOVER_core_10b.md`; section 2 rows M3, M27, M28 and item O1 of this brief; P360-364.
- **Build:** in `ops_need_session` (`NO:386`), keep `!relay_session?`, `!credential_session_expired?` and `!session_locked?` exactly as they are, and replace the level term with: met when `session_access(host_id)` is not nil and (`level == 'user'` or (`level == 'admin'` and `session_admin?(host_id)`)). Update the comment (it says "until S5a"). In `ops_technique_repeat_answer` (`NO:603`), write the detail `access` from the repeat record's own stored key (`'admin'` when it is `'admin'`, else `'user'`), not from `client_access_level`.
- **Do NOT:** let a relay record meet a need (O1, unless your prompt says the owner chose option A); change `ops_grant_of`, `use_technique!` or the order of the needs rows.
- **Tests:** a `user` need is met by a password session, a keyring session, a guest claim, an owner claim and a technique user session; NOT by a relay session, a locked session, an expired token session, a session whose route is down, or no session; an `admin` need is met by a technique admin session and by a typed session of a `creds.admin` account, NOT by a user session, a claim of an admin's desktop, or a locked admin session; a guest claim then feeds a real step up through `use_technique!` and the record becomes `via: 'technique'`, `access: 'admin'`, with the foothold; a relay session does not (the refusal is `need_unmet`); a repeat use writes a `technique_used` row whose `access` is the stored level even when the route has since dropped (no raise).
- **Proof:** your file; unmodified: `test/controllers/break_escape/network_technique_session_test.rb`, `ops_access_scenario_test.rb`, every `test/controllers/break_escape/network_ops_*_test.rb`; `bin/ops-golden-compare`. If one fails only because the need is now stricter (M28), report the test and line; do not edit it.
- **Hand on:** the final rule in one sentence for unit 17's docs.

### Unit 04: the pure pieces (`lib/`)

- **Files:** `lib/break_escape/access_work.rb`, `lib/break_escape/capture_model.rb`, `lib/break_escape/ops_log_events.rb`; `test/models/break_escape/privilege_lib_test.rb` (new).
- **Read:** P399-401, P413-431, P1252-1263; `OPS_LOG_ROWS_PLAN.md` lines 1126-1162 (the row shapes and the "refused plant writes no row" rule); the header of `ops_log_events.rb` (lines 1-60).
- **Build:**
  - `AccessWork.plant_refused?(data, obj, item, admin: false)`: answers false at once when `admin` is exactly `true`; otherwise today's body. No other caller changes.
  - `CaptureModel.session_grant_pc(obj)`: walks `obj['triggerOnInteract']`, recursing into `confirm_action` `onConfirm` as `removes_item?` does (`capture_model.rb:400`), depth-first in list order, and answers the `pc` of the first `grant_foothold` action that has `needsSession`, or nil. A grant with a `condition` still counts. The file must stay ActiveSupport-free.
  - Two `EVENTS` lines in `BreakEscape::OpsLogEvents`, after the S3 lines:
    - `'admin_profile_read'`: places `%w[pc]`, results `%w[ok]`, detail `{ 'profile' => { id: 'profile' } }`, a label within the label pattern (suggested `ADMIN_READ`). Called by unit 07 in `GamesController#container` with `once: true`.
    - `'usb_install_overridden'`: places `%w[pc]`, results `%w[ok]`, detail `{ 'device' => %w[storage hid] }` (the schema's `usbClass` values), suggested label `USB_OVERRIDE`. Called by unit 06 in the implant path (`NetworkAccess`) and in the plant proof (`record_planted_item!`), with no `once` and no `save_limit` (repeats merge, as the helper already does for a plain call).
  - One `KINDS` entry, `'profile'`: `name` answers the id when the scenario's `accountProfiles` holds it, else nil; `room` answers nil (M25). Follow the shape of the `'technique'` entry.
- **Do NOT:** add `credentials_harvested` (S5b) or the `kind` detail of `signin_refused` (S5c); touch the NPC-side reader at `access_work.rb:1265`.
- **Tests:** `plant_refused?` truth table with and without `admin:` (and `admin: 'yes'` does not override); `usb_habit_refused?` and the reader at `:1265` answer as before; `session_grant_pc` for a top-level grant, a grant inside a `confirm_action` (the `sam_dock` shape), two grants naming different PCs (first, depth-first), a grant with a `condition`, and no grant (nil); the events table still passes its own self-check (run `test/models/break_escape/ops_log_test.rb`).
- **Proof:** your file; unmodified: `ops_log_test.rb`, `capture_record_test.rb`, `hide_device_test.rb`, `node test/js/validator-capture-log.test.mjs` (it loads `capture_model.rb` alone); `bin/ops-golden-compare`.
- **Hand on:** the two event names, labels and detail keys exactly as written, for units 06 and 07.

### Unit 05: admin profiles (`game.rb`, after unit 02)

- **Files:** `app/models/break_escape/game.rb`; `test/models/break_escape/admin_profiles_test.rb` (new).
- **Read:** P373-397; section 2b item 1 of this brief; `S3_step11_security_R1.md` lines 341-352 (F5).
- **Build:**
  - `admin_profiles_at(pc)`: the `[profile_id, profile]` pairs, in `accountProfiles` order, whose `for` list admits the PC's owner (`login_pc_owner(pc)`); empty when the PC has no owner. You may route the owner through a private one-line seam so S5b can widen it; it must read nothing but `owner`.
  - `login_desktop_contents(pc, npc)`: when `session_admin?(pc['id'])`, also add the contents of each profile in `admin_profiles_at(pc)` that `admitted_profiles(npc)` did not already add, each once, after the admitted ones and before the mapped shares.
  - `scope_admitted_by_session?(scope, pc_id)`, profile branch: also true when `session_admin?(pc_id)` and the profile is in `admin_profiles_at` of that PC.
  - `session_admits?(scope)`, profile branch: also true when some PC P has `session_admin?(P)` and the profile is in `admin_profiles_at(P)`.
  - `admin_profile_reader(profile_id)` (new, for unit 07's log row): nil when any live session's OWN identity is admitted by the profile's `for` (that is an ordinary read); otherwise `{ pc_id:, npc: }` for the first PC, in session order, whose admin session opens the profile through `admin_profiles_at`; nil when none does.
  - `find_login_item` already searches every profile (`GM:3397`); check that the listing and the lookup agree and leave it unless they do not.
- **Do NOT:** open every profile to admin, or the profile of an account that does not own that PC; read `cachedAccounts`; write any row here; change the `login_pc` or `resource` branches.
- **Tests:** admin at P lists the owner's profiles once (also when the admin is the owner); a user session at P lists only its own; a role profile opens when the owner has the role; admin at an unowned PC adds nothing; `GET /container` of a folder in ANOTHER PC's owner's profile through the admin session at P is refused exactly as today; `session_admits?` is true for the owner's profile only while the admin session is live (false once locked, expired, route down or PC off); an inventory add from the owner's profile at P works under admin and is refused under user; `admin_profile_reader` answers the admin PC, and nil when the owner's own session is also live.
- **Proof:** your file; unmodified: `access_model_rules_test.rb`, `access_model_withholding_test.rb`, `desktop_user_room_data_test.rb`, `credential_sessions_test.rb`, every `test/controllers/break_escape/*container*` and `log_rows_test.rb` file that exists; `bin/ops-golden-compare`.
- **Hand on:** the signature of `admin_profile_reader` for unit 07.

### Unit 06: the USB override on the server (after units 02 and 04)

- **Files:** `app/models/break_escape/network_access.rb`, `app/models/break_escape/capture_proofs.rb`; `test/models/break_escape/admin_usb_test.rb` (new); and exactly three assertions: `test/controllers/break_escape/network_technique_session_test.rb:110`, `network_implants_test.rb:116`, `demo_access_tour_devices_test.rb:341`.
- **Read:** P399-476; P1022-1041 (tests); P1380-1394; `OPS_LOG_ROWS_PLAN.md` lines 1157-1162.
- **Build:**
  - Implant path (`NA:495-512`): where the record is a Hash that is NOT a keyboard session (a present `foothold`, or `remote_route_session?`) and `session_access(pc_id)` is not nil, answer `422 { success: false, reason: 'needs_console', error: 'Nobody is signed in at this keyboard.' }` (a constant beside `IMPLANT_NOT_READY`). Every other case of those two returns stays `implant_not_ready`. The refusal comes before the device is copied, so the item stays held. The keyboard-only rule itself is not widened.
  - Same path, policy call (`NA:509`): `plant_refused?(scenario_data, info[:object], entry, admin: keyboard_admin?(pc_id))`. When the policy would refuse with `admin: false` and the override let it through, write `usb_install_overridden` (`as` the session's account, `where` the PC, detail `device` = the item's `usbClass`); the path already saves.
  - `capture_proofs.rb`: one private predicate, `plant_admin?(obj)`: when `CaptureModel.session_grant_pc(obj)` names a PC, `keyboard_admin?` of THAT PC; else when the object is a sign-in PC, `session_admin?(obj['id'])`; else false. `record_planted_item!` passes `admin: plant_admin?(found[:object])` at its policy line (`:52`) and writes `usb_install_overridden` under the same condition as above (it already saves).
  - `Game#plant_policy_refusal(item_id, used_on)`, in `capture_proofs.rb` beside `record_planted_item!` (the plan lists it under `game.rb`; it lives here so the two cannot drift): finds the held item and the target exactly as `record_planted_item!` does, with the same early returns (empty ids, a hideable item, a client-forged item, an item not held, no target object, an object that does not take the item), each answering nil; then answers the policy's refusal line (`USB_REFUSAL_LINES`, as the implant path words it) when the policy refuses and `plant_admin?` is false; else nil. It writes nothing.
  - A locked admin session still takes an implant the policy ALLOWS (today's rule) and never overrides.
- **Do NOT:** call `plant_policy_refusal` from the controller (unit 07); add a row for a refused plant; change the dropped-device branch; add `cachedAccounts` to `WITHHELD_OBJECT_FIELDS` (S5b).
- **The three assertions:** run the three files first. Change an assertion from `'not_ready'` to `'needs_console'` only if it now fails and the session in that test is a live foothold or technique session; change nothing else in those files and list each changed line in your report (M26).
- **Tests (`admin_usb_test.rb`):** the P1022-1041 rows that do not go through the inventory `remove` action: implant and plant proof allowed under keyboard admin, refused under user; plant proof allowed under remote admin (foothold, and `from`); both refused under a locked admin session and a relay session; refused under any admin session when the PC's service is off; `needs_console` with its line for a foothold, `from`, relay and technique session, admin or not, device still held; `not_ready` kept for no session and for no device; a `needsSession` object's plant proof refused under remote admin and allowed under keyboard admin, judged at the grant's PC; `plant_policy_refusal` nil for each early return; technique admin overrides, technique user does not; `usb_install_overridden` written once per override and never for a refusal or for a plant the policy allows anyway; the NPC-side `usb_habit_refused?` unchanged while the player holds admin.
- **Proof:** your file and the three touched files; unmodified: `test/models/break_escape/capture_record_test.rb`, `hide_device_test.rb`, `network_withholding_test.rb`, `test/controllers/break_escape/ops_access_scenario_test.rb`; `bin/ops-golden-compare` (the two `implant_*_session` answers in `core_test_access_networks.json` are keyboard sessions and must still answer `not_ready`).
- **Hand on:** `plant_policy_refusal`'s return shape (a String line or nil) for unit 07.

### Unit 07: the controller (after units 05 and 06)

- **Files:** `app/controllers/break_escape/games_controller.rb`; `test/controllers/break_escape/privilege_inventory_remove_test.rb`, `test/controllers/break_escape/privilege_profile_read_test.rb` (new).
- **Read:** P461-476; P788-792; P1262; `OPS_LOG_ROWS_PLAN.md` lines 186-192 and line 323; section 2 rows M12, M23, M30.
- **Build:**
  - Inventory `remove` branch (`GC:1447`): when `used_on` is present, call `@game.plant_policy_refusal(item['id'], used_on)` BEFORE `record_planted_item!` and `remove_inventory_item!`; a line answers `422 { success: false, reason: 'usb_refused', error: <line> }` and returns, so nothing is removed or recorded. No new param.
  - `#container` (`GC:627`): in the scoped branch, after `container_reach_refusal` has passed, when the scope is a profile and `@game.admin_profile_reader(<profile id>)` answers, write `admin_profile_read` (`as` that session's account, `where` that PC, detail `profile`, `once: true`) and `save!` only when the returned row is stored. `container_reach_refusal` itself stays pure.
- **Do NOT:** add a route, a policy method, or an entry in the `set_game` or lock lists; write the row from `GET /log_rows` or from `render_login_desktop`; change any other refusal body of either action.
- **Tests:** *remove:* a token admin session past expiry, a foothold admin session after its foothold is unplugged, and one whose route an outage drops each send a blocked stick through `remove` and get 422 `usb_refused` with the policy's line, the item still held and no `plantedItems` entry; the same through an object that takes the item by a confirm's `remove_item`; a plant the policy accepts is removed and recorded as today; two identical gated removes under admin: the first 200 with one `plantedItems` entry, the second 200, nothing removed, still one entry; a remove with no `used_on`, of a hideable item, of an item not held, and on an object that does not take the item each answer as today; a user session's remove of a blocked stick is refused (today it was silently removed: this is the stricter check of section 2b). *profile:* the first admin open of a folder in the owner's profile stores one row and saves once; a reopen stores none; the owner's own open stores none; in a scenario without `logSources` nothing is saved; `GET /log_rows` writes none; with `logSources`, the validator refuses a 41-character profile id (existing check in `validate_log_rows.rb`; assert it, do not rebuild it).
- **Proof:** your files; unmodified: `test/controllers/break_escape/log_rows_test.rb` and every existing controller test that names `inventory` or `container` in its file name; `bin/ops-golden-compare` Also unmodified: `test/controllers/break_escape/capture_proofs_test.rb` (its test at `:221` sends a refused plant through `remove` and asserts only that nothing is recorded, which still holds; if a helper there asserts a 200, report the line, see section 4 item 4).
- **Hand on:** the exact refusal body for unit 10.

### Unit 08: client policy helpers (`pc-policy.js`)

- **Files:** `public/break_escape/js/systems/pc-policy.js`; `test/js/pc-policy-admin.test.mjs` (new).
- **Read:** P413-431 (the walk), P485-490, P698-714.
- **Build:** `plantRefusal(heldItems, objectData, scenario, { admin = false } = {})`: with `admin === true` every item goes through (first item, no refusal); otherwise today's body. `sessionGrantPc(objectData)`: the same walk as the server's `session_grant_pc` (unit 04): `triggerOnInteract`, into `confirm_action` `onConfirm`, depth-first in list order, the `pc` of the first `grant_foothold` with `needsSession`, else null; a grant with a `condition` counts. `gatedRemove(item, objectData, scenario)`: true exactly when `usbRefused(usbPolicyFor(objectData, scenario), classOf(item))`. Add both to the frozen `pcPolicy` export and as named exports.
- **Do NOT:** read the session mirror here (no import of `pc-sessions.js`); change `usbRefused`, `usbPolicyFor` or the refusal lines.
- **Tests:** `plantRefusal` with and without `admin` (and `admin: 'yes'` does not override); `sessionGrantPc` for the `sam_dock` shape (inside a confirm), top level, two different PCs (first), a conditioned grant, none (null); `gatedRemove` true only for a governed object whose policy refuses that item's class, false for an ungoverned `wall_port`-style object and for an item with no `usbClass`.
- **Proof:** your file; unmodified `node test/js/pc-policy.test.mjs`.
- **Hand on:** the three signatures, exactly.

### Unit 09: the session mirror and the taskbar marker

- **Files:** `public/break_escape/js/systems/pc-sessions.js`, `public/break_escape/js/utils/pc-taskbar.js`, `public/break_escape/css/pc-monitor.css` (the marker's rule only); `test/js/pc-sessions-admin.test.mjs`, `test/js/pc-taskbar-admin.test.mjs` (new); harness copy lists in `test/js` only where your new import forces it (list each in your report).
- **Read:** P674-686, P698-718; section 2 rows M5, M6, M7.
- **Build:**
  - `sessionAdmin(pcId)`: the mirror entry for that id has `access === 'admin'` and is not `locked`. No entry → false.
  - `keyboardAdmin(pcId)`: `sessionAdmin(pcId)` and the entry has none of `remote === true`, a non-empty `footholdId`, `relay === true`, a non-empty `fromPcId`.
  - `plantAdmin(objectData)`: `keyboardAdmin(sessionGrantPc(objectData))` when `sessionGrantPc` (unit 08) finds a PC, else `sessionAdmin(objectData.id)`.
  - Where the mirror marks a session locked (`s.locked = true`, about `:920`) delete `access` in the same step, and make `publicSession` leave `access` out of a locked entry.
  - A desktop 403 whose `serverReason` is `'off'` or `'not_responding'` drops `access` from that PC's entry. Every fresh server answer already replaces the entry, so an answer without `access` clears it: keep that so.
  - Taskbar: an "Administrator" marker beside the account name when the session's `access` is `'admin'`, text through `textContent`, styled by the pixel-art rule (2px border, pixel font). Nothing for a user session.
- **Do NOT:** decide a level on the client from anything but the server's `access`; add the "Cached accounts" control or panel (S5b); change the network view.
- **Tests:** `access` survives `publicSession` and the bootstrap adopt and is dropped at lock; `sessionAdmin` false for a locked entry that had `access`, true for a `remote` admin entry, false for a relay entry, false for an id with no entry; a later answer without `access` clears it; after a desktop 403 `off` it is false; `keyboardAdmin` false for each of `remote`, `footholdId`, `relay`, `fromPcId` and for a technique copy, true for a keyboard admin entry; `plantAdmin` for a `sam_dock`-shaped object follows the grant's PC, not the socket's id, and for an object with no grant follows the object's id; the taskbar shows the marker only for admin, and a hostile display name still renders as text; a session whose `npcId` the client never loaded renders.
- **Proof:** your files; unmodified `node test/js/pc-sessions.test.mjs`, `pc-sessions-access.test.mjs`, `pc-taskbar.test.mjs`, `test-bridge-access.test.mjs`, and every harness whose copy list you touched.
- **Hand on:** how unit 10 and 11 reach `plantAdmin` (import path or `window` name).

### Unit 10: gated removes in `apply-actions.js` (after units 08 and 09)

- **Files:** `public/break_escape/js/systems/apply-actions.js`; `test/js/apply-actions-gated-remove.test.mjs` (new); copy lists as forced.
- **Read:** P478-541 (all of it; this is the unit's spec), P720-726.
- **Build:** `sendInventoryRemove(id, { usedOn, gameId, withBody })`: with `withBody: true` it resolves `true` on success, the refusal body on a refusal that has one, `false` after the retried network failure, a 5xx, or a refusal with no body; without it, exactly today's behaviour. `applyActions` accepts `objectData` in its opts and the `confirm_action` branch threads it to `onConfirm`. The `remove_item` action: pick among held matches not in flight the first one the object's policy accepts under `plantAdmin(objectData)`, else the first match; when that remove is `gatedRemove`, stop the list there, send with `withBody` and wait; on success remove the item from the tray and run the rest by a NEW `applyActions(rest, opts)` call; on `usb_refused` show the server's `error` through `gameAlert` and emit `usb_refused:<objectId>`; on another refusal show its `error` if it has one; on a network failure show "That did not go through. Try again."; on anything but success the item stays and nothing after it runs. Two exported sets, objects in flight (`plantsInFlight`) and items in flight, filled from the send until every kind of answer; a `remove_item` for an object in flight does nothing but a console line.
- **Do NOT:** change a remove that is not gated (same order, same fire-and-forget send); read `message` from a refusal body (only `error`); add any `player_state`.
- **Tests:** the P1099-1113 rows that concern `remove_item` and `sendInventoryRemove`: a gated `remove_item` inside `onConfirm` under a lapsed override keeps the item and runs none of the later actions; on success it removes the item and runs them; two matching items, one refused and one accepted, spends the accepted one; another refusal and a network failure each keep the item with their line; a second `remove_item` while the object is in flight sends nothing; the sets empty on failure; an ungoverned `wall_port`-style remove keeps today's order and send; `withBody` absent behaves as before; a 500 whose body has `message: "Inventory error: ..."` never reaches a toast.
- **Proof:** your file; unmodified every `test/js/apply-actions*.test.mjs` and every test whose copy list you touched.
- **Hand on:** the names of the two sets and of the `objectData` opt, for unit 11.

### Unit 11: the plant in `interactions.js` (after unit 10)

- **Files:** `public/break_escape/js/systems/interactions.js`; `test/js/interactions-admin-plant.test.mjs` (new); copy lists as forced.
- **Read:** P485-501, P535-541, P698-726.
- **Build:** at the `requiresItem` branch (about `:1082-1130`): leave items in flight out of the `requiresItem` match; pass `{ admin: plantAdmin(sprite.scenarioData) }` to `plantRefusal`; pass `objectData: sprite.scenarioData` in the opts of both `applyActions` calls; do nothing (console line) for an object already in flight; for a `consumesItem` plant that is `gatedRemove`, send the remove first with `withBody` and wait, and fire `triggerOnInteract` and remove the item from the tray only on success, with the same refusal handling as unit 10 (share it, do not copy it, if unit 10 exported a helper).
- **Do NOT:** change the path for an ungoverned object or for a plant the policy accepts without admin; change the hint or condition branches.
- **Tests:** a gated `consumesItem` plant waits; a 422 `usb_refused` keeps the item, shows the server's line, emits `usb_refused:<objectId>` and fires no `triggerOnInteract`; a stick refused for a `remote` USER entry shows the policy's line and stays; for a `sam_dock`-shaped socket with a policy of its own the override follows `keyboardAdmin` of the grant's PC; a second interact while in flight sends nothing; a second object asking for the same item while it is in flight takes the "not held" path; when both attempts fail the item stays and the next try succeeds and fires `triggerOnInteract` once; `plantAdmin` gives `interactions.js` and `apply-actions.js` the same answer for the same object.
- **Proof:** your file; unmodified every `test/js/interactions*.test.mjs` and `requires-item*.test.mjs` that exists.
- **Hand on:** nothing further; report the copy lists touched.

### Unit 12: `needs_console` in `network-links.js` (any time)

- **Files:** `public/break_escape/js/systems/network-links.js`; `test/js/network-links-needs-console.test.mjs` (new).
- **Read:** P442-452.
- **Build:** beside the `usb_refused` branch (about `:490-493`): a 422 with `reason: 'needs_console'` shows a toast with the server's `error`, emits `network_device_refused` with `{ pcId, reason: 'needs_console' }` and returns `{ action: 'refused', reason: 'needs_console' }`; it never takes the quiet `not_ready` path and never retries. Add the reason to the event's doc comment at the top of the file.
- **Do NOT:** change the `not_ready` retry or its quiet ending.
- **Tests:** the toast and the event for `needs_console`; `not_ready` still quiet; `usb_refused` unchanged.
- **Proof:** your file; unmodified `node test/js/network-links.test.mjs` and `network-links-routing.test.mjs`.

### Unit 13: schema and validator

- **Files:** `scripts/scenario-schema.json` (the `creds` block at about `:4517` only), `scripts/validate_privilege.rb` (new), `scripts/validate_scenario.rb` (one `require_relative` beside line 29 and one `run.call('check_privilege') { check_privilege(json_data) }` beside line 9122, nothing else); `test/js/validator-privilege.test.mjs` (new).
- **Read:** P215-225, P875-889, P928-938, P1123-1130; `scripts/validate_network_ops.rb` (top 60 lines, for the file shape) and `test/js/validator-capture-log.test.mjs` (the test shape).
- **Build:**
  - Schema: `"admin": { "type": "boolean", ... }` inside `creds.properties`. Nothing else.
  - `check_privilege(json_data)` with these S5a checks: (a) warn when two profiles have top-level items of the same name that meet on one PC only through an admin session (a `creds.admin` account admitted there, or a weakness on that PC's host whose grant has `access: "admin"`), and only when the PC's owner is admitted by one of the two profiles; (b) warn when a `remove_item` is not the first action of its list (`triggerOnInteract` or an `onConfirm`) on a USB-governed object; (c) warn when one object's `needsSession` grants, found by `CaptureModel.session_grant_pc`'s walk, name two different PCs. Admission is asked through `CredentialModel.pc_admits_account?`.
  - **Not built yet.** The fields of later stages must fail loudly, with one fixed line each: `"<field>" is not built yet (privilege plan stage S5b)` for `cachedAccounts` on any object and for a `harvested` credential proof; `... (stage S5c)` for `creds.accountKind`, `creds.localTo`, `creds.domain`, `accountOnly` on an NPC (the NPC schema is open, so only the validator catches it), and `domain` on a sign-in PC. Each is an ERROR. The schema stays closed to them as well.
- **Do NOT:** add any S5b or S5c field to the schema; edit `check_access_model`, `check_credentials` or `validate_network_ops.rb`; add the `cachedAccounts` solvability warning or the info lines of P904-906.
- **Tests:** one fixture per warning and per "not built yet" error, and a clean one; for (b): governed object with `remove_item` second in an `onConfirm` (warn), first (none), ungoverned with it second (none); for (c): two different PCs (warn), the same PC twice (none); `creds.admin: "yes"` fails the schema; a scenario with no `creds.admin` and no admin grant gets no line from `check_privilege`.
- **Proof:** your file; unmodified `node test/js/ops-unchanged-validator.test.mjs` (the snapshot over every shipped scenario: NO new error, warning or info line; if `test_ops_access` or any other gains a line, report it and stop, do not re-record) and `node test/js/validator-network-ops*.test.mjs` if present.
- **Hand on:** the warning texts, for unit 17.

### Unit 14: the dungeon graph (after unit 13)

- **Files:** `scripts/generate_dungeon_graph.rb`; `test/js/dungeon-graph-admin.test.mjs` (new); `scenarios/test_ops_access/dungeon_graph.{json,md,html}` (regenerated, section 4).
- **Read:** P947-956 (the `admin@` part only; the "collect" edges are S5b); the block at `generate_dungeon_graph.rb:1785-1796` and its comment "also ends at the lock until S5a"; `test/js/dungeon-graph-ops-hosts.test.mjs` for the test shape.
- **Build:** a node `admin@<pcId>` for each sign-in PC with an admin path, with an edge from each `creds.admin` account admitted there (from that account's password node, as the password edges at about `:427-450` are drawn) and from every weakness on that PC's host whose session grant has `access: "admin"`. Such a weakness keeps its existing `grants session` edge to `lock_<pcId>` (it does give a session) and gains the edge to `admin@<pcId>`. No password text in any label. A scenario with neither gets no new node.
- **Do NOT:** add hash-record or "collect" edges, or change `AccessIdentities.reach`.
- **Tests:** an admin account admitted at one PC and refused by another's `access` list gets a node only at the first; an admin grant draws both edges; a user grant draws no `admin@` node; a scenario with no admin path has none; no label holds a password.
- **Proof:** your file; unmodified every `test/js/dungeon-graph-*.test.mjs`. Run `node test/js/ops-unchanged-validator.test.mjs`: a diff confined to `test_ops_access`'s new `admin@` node and edge is expected (section 4 item 3); report it and do not re-record yourself; any other diff is a bug. If an existing assertion pins "an admin grant has no edge but the lock", report its file and line; do not edit it.
- **Hand on:** the node id format and edge labels, for unit 15's graph and unit 17's docs.

### Unit 15: the feature scenario and its end-to-end tests (after units 07, 13, 14)

- **Files:** `scenarios/test_ops_privilege/` (new: `scenario.json.erb`, `mission.json`, `PLAYTEST.md`, the generated `dungeon_graph.*`, any `ink/` it needs); `test/controllers/break_escape/ops_privilege_scenario_test.rb`, `test/controllers/break_escape/ops_privilege_no_exposure_test.rb` (new; the plan allows either existing no-exposure file, a new file keeps units disjoint).
- **Read:** P1132-1137, P1146-1158, P1171-1175, P796-798, P826-837 (S5a's part: `creds.admin` never sent); `scenarios/test_ops_access/` (scenario and `PLAYTEST.md`) as the model; build brief rules on games, `swap-scenario-game.rb` and event mappings.
- **Build:** the scenario of P1134-1137: an ordinary user account and an administrator (`creds.admin`); an owned PC with its owner's profile (at least one item in a FOLDER inside the profile, so the log row of unit 07 can be seen, and one at top level); one profile per account; one PC with `usb: "blocked"`; beside it a BadUSB socket whose `needsSession` grant sits inside a `confirm_action` and names the PC; a governed port that takes a stick through a confirm's `remove_item` listed FIRST; a second desktop and what the playtest's remote admin sign-in needs (a `from` route or a foothold); a token credential for the administrator so a token admin session can expire; a way to turn the PC's service off; `logSources` so the two rows can be read; and one step-up weakness (`needs.session: "user"`, `grants.session.access: "admin"`) with its card, so S3's path to admin is exercised here too. Products invented; no real tool names. Validator clean (no error; state every warning in the report), graph generated.
- **`PLAYTEST.md`:** the nine beats of P1149-1158 in order, each with what the player sees and what `verify-run.rb` should print, plus a beat for the step up from a claimed desktop and (per O1) a beat showing a relay session does NOT offer it. No hand-built or forged request (S3 R2 ruling N-13-3): name the Rails tests that make those checks instead.
- **Tests:** `ops_privilege_scenario_test.rb` plays the same beats through the real routes on the real scenario file and asserts both sides (answers carry `access` only for admin; `sessions`, `plantedItems`, inventory and log rows on the server). `ops_privilege_no_exposure_test.rb`: at each step of that run, no answer (bootstrap, every room answer with its tile lists, sync, `GET /container`, `GET /network`) holds the key `admin` under any NPC, the administrator's password, or the owner's profile items before an admin session at that PC exists; a forged sync body carrying `sessions` or an `access` key changes no level.
- **Do NOT:** add S5b or S5c content; edit any other scenario; seed a Mission row.
- **Proof:** your two files; `ruby scripts/validate_scenario.rb scenarios/test_ops_privilege/scenario.json.erb` clean; `ruby tools/check_mapping_index_drift.rb` passes; `bin/ops-golden-compare`.
- **Hand on:** the game-making command for the tester, the beat list, and any beat a headless run cannot do.

### Unit 16: the leak scanner and `verify-run.rb` (after unit 15)

- **Files:** `tools/playtest/lib/access_leak_scanner.rb`, `tools/playtest/verify-run.rb`; `test/controllers/break_escape/access_leak_scanner_privilege_real_test.rb`, `test/models/break_escape/privilege_verify_run_test.rb` (new).
- **Read:** the scanner's header (lines 120-180) and its S3 block (about `:2338-2600`), in particular the `admin:<pc id>` step and the `ops:key:access` rule at about `:2581`; `verify-run.rb:75-95`; S3 R2 rulings N-13-1 and N-13-2 in the build brief (steps are earned PER THING).
- **Build:**
  - Scanner: today `access` on a session answer is a leak unless `admin:<pc>` was earned by a technique grant. Add the second way to earn it, per PC: a sign-in answer (`POST /login` or a keyring sign-in) for an account the scenario marks `creds.admin` and that PC admits. A new session at that PC takes the step back, as now. New structural rules: the key `admin` inside any NPC or `creds` object in an answer is a leak wherever it appears; an item of an owner's profile in a desktop or container answer for PC P, when the session there is not the owner's, is a leak unless `admin:<P>` is earned; `access` on a mirror entry or host row is judged by the same per-PC step.
  - `verify-run.rb`: each session line also prints the computed level, `level admin`, `level user` or `level none` (from `session_access`), beside the stored `access` it prints today; words and ids only.
- **Do NOT:** loosen any existing scanner rule; make one whole-game "admin earned" step.
- **Tests:** the scanner over a real captured run of `test_ops_privilege` reports nothing; the same run with one answer doctored each way (an `access` on a user session's answer, an `admin` key in an NPC, the owner's profile item under a user session, admin earned at PC A used at PC B) reports each; the existing real tests still pass. `verify-run` prints the three level words for an admin, a user and a locked session.
- **Proof:** your files; unmodified `access_leak_scanner_ops_access_real_test.rb`, `access_leak_scanner_ops_real_test.rb`, every `test/models/break_escape/ops_*_verify_run_test.rb`.

### Unit 17: docs (last)

- **Files:** `README_scenario_design.md` (one A18 row in the feature index, after A17), `docs/ACCESS_AND_NETWORKS.md` (an A18 section; correct the N15 text where it says the level is the stored key or that an implant under a technique session answers `not_ready`), `scenarios/test_ops_access/PLAYTEST.md` only if section 4 item 3 makes a beat's expected text wrong (report the line first).
- **Read:** this brief's sections 1, 2 and 4; the hand-on notes of units 03, 13 and 14.
- **Build:** what `creds.admin` does; the two admin powers and their limits (owner only until S5b; keyboard only for a session-shaped device); the toast; the validator warnings and the "not built yet" errors; the `admin@<pcId>` graph node; the author's note of P454-459 (a PC with an admin path loses its USB lesson for ordinary plants). A short "plan corrections" list at the end of your report (not in the plan file): P188, P847-848, P1309-1311, and P360-362, P1290, P1403-1404 as the owner decides O1.
- **Do NOT:** document S5b or S5c as available; edit either plan.

## 4. What changes for existing scenarios

Checked against the plan's section 10 (P958-977) and the code. A scenario with no `creds.admin`
account and no admin grant can never reach admin, so every admin branch is a guard not taken and
no answer gains `access`. Five things do change:

1. **The implant refusal under a live non-keyboard session** (accepted by the owner, P1388-1394). Where a player holds only a foothold, `from`, relay or technique session on a PC and plugs a session-shaped device into its socket, the implant action answers `422 needs_console` with "Nobody is signed in at this keyboard." where it answered a quiet `not_ready`. Scenarios with such a socket: `test_access_networks` (`sam_dock`, `kiosk_dock`), `demo_access_tour` (`implant_socket`), and, not known to the plan, `test_ops_access` (the `desk01` socket at `scenario.json.erb:481`). The screen change is one toast; nothing is granted, recorded or removed.
   - Existing tests that legitimately change, and only these assertions: `network_technique_session_test.rb:110`, `network_implants_test.rb:116`, `demo_access_tour_devices_test.rb:341` (`'not_ready'` becomes `'needs_console'`; unit 06, and only where the test's session is live, see that unit). The plan's claim that no core test pins the reason is wrong (M26).
   - Golden fixtures: NONE changes. The two `implant_*_session` answers in `core_test_access_networks.json` follow a KEYBOARD sign-in and stay `not_ready`. If `bin/ops-golden-compare` shows any diff, that is a bug to report, never a reason to capture again.
   - JS: `test/js/network-links.test.mjs` pins the quiet `not_ready` path, which is unchanged.
2. **The inventory `remove` action refuses a plant the USB policy refuses** (`422 usb_refused`; today a silent 200 that removes the item and records nothing). An honest client never sends such a remove in a shipped scenario: `plantRefusal` stops it first, and no shipped `remove_item` object is USB-governed (P543-546). So no screen changes. A hand-sent request now keeps its item.
3. **`test_ops_access` has a technique admin session** (M29). Once S5a lands that session is a full admin session: it would open the PC owner's profiles and override the USB policy. The scenario has no `owner`, no `accountProfiles` and no `usb` value in its policies (checked), so neither power has anything to act on, so the two powers change no answer (item 5 is the one answer that does change). Its dungeon graph gains one `admin@<pcId>` node and one edge (unit 14 regenerates `scenarios/test_ops_access/dungeon_graph.*`; that regenerated file is a legitimate change). Its `PLAYTEST.md` does not mention the implant refusal reason (checked), so it should need no edit. One snapshot may move with it: `test/js/fixtures/ops_unchanged/validator_and_graph.json` (read by `test/js/ops-unchanged-validator.test.mjs`) records validator and graph output per scenario. If it holds `test_ops_access`'s graph, the new node and edge are the ONE legitimate snapshot update of this stage: unit 14 reports the exact diff and stops; the orchestrator then allows `OPS_UNCHANGED_RECORD=1 OPS_UNCHANGED_ONLY=test_ops_access node test/js/ops-unchanged-validator.test.mjs` only if the diff is that node and edge and nothing else. No other scenario's entry may change.
4. **A stricter `session` need** (M28): a session whose route is down, or whose account is gone, no longer meets `needs.session`. No shipped scenario depends on it; if an S3 test does, unit 03 reports it for a ruling.
5. **A technique admin session whose route is down or whose PC is off no longer sends `access`** (S5a server R1 F8; plan P849, brief M21; accepted by ruling). Before S5a `client_access_level` read the stored key, so such a session (or one whose account was gone) still sent `access: "admin"` on its mirror entry and host row; now the level is `session_access`, which is nil for it, and none is sent. Only `test_ops_access` has a technique admin session; the case is the one commit `5361d49a6` met in `technique_session_record_test.rb`. Also for unit 17's plan-corrections list.

Nothing else: tile lists, the keyring and its `rev`, `ACCESS_STATE_DEFAULTS` (no new key), sign-in
answers for non-admin accounts, the mirror for non-admin sessions and the host rows are
byte-for-byte as before. The validator snapshot (`test/js/ops-unchanged-validator.test.mjs`) must
show no new line for any shipped scenario; the three new warnings and the "not built yet" errors
fire on none of them (checked for `test_ops_access`: no `remove_item`, one `needsSession` grant).

## 5. Security review points

A reviewer of S5a attacks these, each with a test or a file:line.

1. **What admin unlocks, and only that.** Profiles: only those whose `for` admits the OWNER of the PC the admin session is on; never another PC's owner, never every profile, never through an admin session at a different PC. Check all four readers agree (`login_desktop_contents`, `find_login_item`, `scope_admitted_by_session?`, `session_admits?`): `find_login_item` searches every profile today and relies on the scope check that follows it, so look for any caller that uses its result without `scope_admitted_by_session?`.
2. **`session_admits?` has no route check of its own** (S3 security F5). The admin profile branch is reachable by the unlock, take and container paths from anywhere, on `session_route_up?` alone. Confirm that is no more than the technique or remote session's own desktop already reaches, including a technique admin session on a `remote: "blocked"` host.
3. **Can a level be forged?** No sync body writes `sessions` (every writer of `player_state['sessions']` is server code: `game.rb`, `network_access.rb`, `credential_keyring.rb`, `npc_frustration.rb`), and unit 15 tests it. `session_access` honours a stored `access` only on a `via: "technique"` record; a stored key on any other record must be ignored. `creds.admin` must be the literal `true`. The client's `access` is display and tray logic only: every server gate recomputes.
4. **Does any path read a missing level as admin?** `session_access` answers nil for no session, locked, expired, route down, PC off, account gone, and `'user'` for an unknown `via`. Every reader must compare with `== 'admin'`; look for a negated test (`!= 'user'`, `unless ... == 'user'`) or a truthiness test on the level. On the client, `sessionAdmin` must require `access === 'admin'` and not locked.
5. **The USB override keyword.** `plant_refused?(..., admin:)` must default false and be passed by exactly three call sites. The NPC reader and both validators must not pass it. `plant_admin?` must answer false for a governed object that is neither a sign-in PC nor a `needsSession` object.
6. **The lapsed override.** A token admin session past expiry, an unplugged foothold and an outage each make the `remove` action refuse before anything is removed or recorded; the retry of a processed remove answers success and changes nothing; `plant_policy_refusal` never refuses a remove the plant proof would not have judged (so it cannot be used to probe objects or hold items).
7. **The implant path.** Still keyboard-only for a session-shaped device. `needs_console` must not tell a browser anything `not_ready` did not: it is sent only for a PC where the player already holds a live session. A locked admin session takes an allowed implant and never overrides.
8. **Step up and technique sessions.** A relay record never meets a need (O1); a locked or expired session never does; a claim does and the result is a technique record with the foothold, never a keyboard admin session (so it cannot satisfy `needsSession`). A technique grant at `access: "user"` for a `creds.admin` account stays user. A password sign-in over a technique admin record takes the account's level. A borrow hand-back ends a keyboard admin session and leaves a remote or technique one.
9. **What is sent.** `access` appears only as `"admin"`, only on the sign-in answer, the mirror entry and the host row, never on a locked, expired, off or route-down session, never for a technique user session. `creds.admin` never leaves the server (`WITHHELD_NPC_KEYS` holds `creds`). Tile lists gain nothing.
10. **Log rows.** `admin_profile_read` and `usb_install_overridden` carry an account, a PC, a profile id or a `usbClass`: no secret. A refused plant writes no row. `GET /log_rows` writes none. A malformed call (an over-long id) must fail the request before any grant is kept.
11. **The collect route is NOT S5a's.** No `harvest_credentials` route, policy or controller entry may appear in this stage; its indistinguishable 404 is reviewed in S5b. The reviewer confirms `config/routes.rb` and `game_policy.rb` are untouched.
12. **Delta sync.** S5a adds no state key and no sync section; confirm no answer grew a list that is re-sent whole.

## 6. Open items

0. **Open with the owner (O3, S5a server R1 F13, major).** An admin planting a storage stick the PC's USB policy refuses has no path in a validator-clean scenario today. The override is judged at a sign-in PC or at the PC named by a socket's session grant; a sign-in PC cannot take a stick (validator rule on `triggerOnInteract`), and one grant per PC and shape leaves the PC's one session socket to the keystroke device, so a governed stick port names no PC that could judge it. The server and client code for it (07's remove check, units 10 and 11) is covered by Rails and node tests only, and the scripted playtest cannot do plan beats 3, 5 and 8. Ruled for now as the reviewer's option 1: docs say so plainly (`scenarios/test_ops_privilege/PLAYTEST.md`; unit 17 documents the override as reachable only for a session-shaped device at the keyboard and corrects P454-459 and P466-471), no engine or validator change. A later small unit may add an optional field on a governed port naming the PC that judges it (the reviewer's option 2: server, client, schema and validator together; a fourth entry for section 2b). The owner's choice is open. (Numbered O3 because O2 above is M29.)

1. **A flat profile writes no `admin_profile_read` row (M30).** The plan puts the row in `#container`'s profile branch, which only a FOLDER inside a profile reaches; an admin who reads top-level profile items on the desktop leaves no row. Built as the plan says. If the owner wants a row on the desktop listing too, it is one more call in `render_login_desktop` and a change to the log plan's line 323 test; not decided here.
2. **`admin_profile_reader` is this brief's reading** of "one per PC, profile and account" and "`as` the session's": no row when the profile's own account also holds a live session, and the first admin PC in session order when two could claim it. The plan does not say.
3. **Whether `needs_console` needs a LIVE session.** The plan says "a live session that is a foothold, relay or `from` session". This brief reads live as `session_access` not nil, so a locked or expired remote session still answers the quiet `not_ready`. If a reviewer prefers the toast for a locked remote session, it is one term.
4. **O1** (relay and the step up) awaits the owner; builders build option B.
5. **`creds.admin` on an NPC with no `username`** is not checked by the plan's validator list. It is harmless (never an account) and no check is specified here; a later pass could warn.
6. **The scenario's remote-admin beats** (P1151-1157) need a `from` route, a token credential for the administrator and an outage. Unit 15's builder must confirm each can be authored with existing features without S5b fields; if a beat cannot be scripted (the token expiry "without a client update" needs the frozen clock in the Rails test and real waiting or a short `expiresMin` in the browser), it says so and the Rails test carries it.
7. **Two fixers were editing the worktree** while this was written (`test/controllers/break_escape/ops_access_scenario_test.rb` was modified and uncommitted). Line numbers in that file and in engine files may have moved; every unit re-finds its anchors by name.
8. **Not verified by running anything:** this brief is from reading the plan and the code. No test was run, and the claims "no shipped scenario has a gated remove" (P543-546) and "the snapshot gains no line" are the plan's, spot-checked for `test_ops_access` only; units 01, 07 and 13 prove them.
