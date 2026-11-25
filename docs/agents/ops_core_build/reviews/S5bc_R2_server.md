# S5b/S5c stage review, round 2: server, model, validator and graph

Branch `ops-priv2`, fixes `a9dbb0588..077ae5f8b` read against round 1 (`S5bc_R1_server.md`,
8702cac02). Reviewer changed no code.

How the behaviour evidence was made: a scratch integration test (not committed,
`<scratchpad>/s5bc-r2-server/probe_test.rb`) that includes `OpsPrivilegeBeats`, builds a game from
the real `scenarios/test_ops_privilege/scenario.json.erb` (with the one change each probe states)
and calls the real routes, run as
`flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <scratch>/probe_test.rb`. Each
`PROBE` line below is a line that run printed.

Also run:

- The stage's Ruby tests (every `*_test.rb` changed since `f0fef9a53`, 25 files):
  `471 runs, 43525 assertions, 0 failures, 0 errors, 0 skips`. The network technique tests
  (`test/*/break_escape/network_technique*_test.rb`, `technique_session_record_test.rb`):
  `127 runs, 0 failures`.
- The stage's validator and graph node tests (7 files, including the new
  `dungeon-graph-kinds.test.mjs` and `validator-privilege-l9.test.mjs`): `tests 102, pass 102, fail 0`.
- `ruby scripts/validate_scenario.rb scenarios/test_ops_privilege/scenario.json.erb --no-graph`:
  `Result: 0 errors (0 known), 3 warnings` (none is about an account-only name).
- `bin/ops-golden-compare` (not under flock): `31 runs, 62 assertions, 0 failures, 0 errors`.
- Validator output before and after the fixes over all 208 shipped folders: see "Shipped scenarios".

## Round 1 findings

| R1 | Severity | Verdict | Evidence |
|---|---|---|---|
| SERVER1 `access.people` names an account-only id | blocker | closed for objects and for every lazy room answer; **not closed** for a room's own access list in the bootstrap (R2-SERVER1) | `game.rb:7593-7601` `strip_account_only_people!`, called first in `filter_requires_and_contents_recursive`. PROBE A: room, container, network, sync and keyring answers carry no `deskadmin`; the bootstrap does. |
| SERVER2 collect 500 on an old save | major | closed | `cached_credentials.rb:55-61`, the assignment sits inside `unless added.empty?`. Test `ops_privilege_r1_server_test.rb:157` passes; PROBE D (relay admin collect at `hot_desk` on a save without both keys): `200 ... "harvested":[{"npcId":"priya",...` then `200 "harvested":[]`. The other writer of the two keys, `note_borrow_cached!` (`cached_credentials.rb:108`), writes only when it adds a pair. |
| SERVER3 `/ink`, `/tts` tell account-only from invented | major | closed | `games_controller.rb:4196-4197`; test `ops_privilege_r1_server_test.rb:99` asserts status and body equal (id replaced) for `deskadmin`, `labadmin` and `zz_nobody`, all 404; passes. |
| SERVER4 `/sync_state` keeps hostility for an account-only id | major | closed | `game.rb:6524-6538`, both branches skip `account_only?`; tests at lines 118 and 128 pass. PROBE B widens it to every NPC-keyed sync section (below). |
| SERVER5 graph draws edges the kind refuses | major | closed | `access_identities.rb:302-307` judges `account_kind_admits?` first. Committed `scenarios/test_ops_privilege/dungeon_graph.md:175-181,222-233`: `deskadmin` reaches `desk_a`/`desk_b` only, `labadmin` `lab_pc` only, `ravi` `hot_desk`/`bay_pc` only (the two `northwind` PCs, `scenario.json.erb:345,465`). The two inline copies now call it (18a606f9f). |
| SERVER6 log reader names an account-only owner | major | closed (its test is a direct call, not the real `log_rows` row round 1 asked for) | `ops_log_events.rb:307-309`; the only caller is `ops_log.rb:525`; test `ops_privilege_r1_server_test.rb:143`. |
| SERVER7 manifest blind to indirect readers, four wrong `keep`s | minor | closed | `LOOP_PATTERN` has the six names; manifest 130 entries; controller `find_npc_in_scenario` is `skip`; the four reasons are corrected; `validate_privilege.rb:486-488` errors on `creds.card`, and `rfidCard` (the other source of `npc_card`, `access_identities.rb:39`) is refused by the key allow-list (`validate_privilege.rb:328,493`). |
| SERVER8 technique grant not judged against admission | minor | closed | `network_ops.rb:566-567`; test `ops_privilege_scenario_test.rb:810` (a `local` account outside `localTo`: `no_grant`, level stays `user`, no row) passes. A refused grant answers as a weakness with no grant. |
| For the owner: port override and HID | - | decided: storage and HID | `port_override_test.rb` pins a HID device overridden at a `portOf` port. |

## New findings

### R2-SERVER1 (major): the bootstrap still sends a room's `access.people` as authored

- Where: `app/models/break_escape/game.rb:2469-2473`, `filtered_scenario_for_bootstrap` copies each
  room's `access` into `kept_fields` (for rfid doors, comment at 2462). The S5c strip lives only in
  `filter_requires_and_contents_recursive`, which the bootstrap never calls; the controller's
  `filter_requires_recursive` (`games_controller.rb:3181`) does not touch `access`. The lazy room
  answer of the same room is stripped, so the fix is inconsistent between the two answers that
  carry one room's list.
- Evidence (PROBE A: `rooms.it_room.access = {roles:[it], people:[deskadmin, adel]}`,
  `rooms.lobby.access = {people:[deskadmin, adel]}`, fresh game, no session):

  ```
  PROBE A bootstrap 200 deskadmin: true
  PROBE A bootstrap it_room access {"roles":["it"],"people":["deskadmin","adel"]}
  PROBE A bootstrap lobby access {"people":["deskadmin","adel"]}
  PROBE A room lobby own access {"people":["adel"]}
  PROBE A room it_room own access {"roles":["it"],"people":["adel"]}
  ```

  The validator does not stop it: the same change in a scratch copy of the scenario gives only
  `WARNING: privilege: rooms.it_room.access.people[0]: authored text holds the account-only name
  'deskadmin' as a whole word, and the browser is served it` and `Result: 0 errors`. Listing an IT
  admin account on the IT room's door is a natural thing for an author to write.
- Fix (`app/models/break_escape/game.rb`, `filtered_scenario_for_bootstrap`): after `kept_fields`
  is built, call `strip_account_only_people!(kept_fields)` (it reads `kept_fields['access']`, a
  copy of the deep-duplicated scenario). Test in `ops_privilege_r1_server_test.rb`: a room-level
  `access.people` naming `deskadmin` and `adel`; `GET scenario` names no `deskadmin` and the room
  keeps `people: ["adel"]` and its roles. Optionally make the L9 warning an error for an
  `access.people` entry naming an account-only id, which never admits anyone at a door (an
  account-only NPC holds no card).

## Checked and found sound

- Every other answer that carries an access list, with `deskadmin` added to the access list of a
  room, a resource (`staff_mail`), a start item and `desk_a` (PROBE A): `room/lobby`,
  `room/it_room`, `room/bay`, `room/store` (each `deskadmin: false`), `GET network`, `PUT
  sync_state`, `GET keyring`, `container/desk_a` with Adel signed in (all `deskadmin: false`). The
  neighbouring rooms' doors reach the browser only through the bootstrap (R2-SERVER1).
- The strip never touches stored data: after all those answers `scenario_data` still holds
  `{"people":["deskadmin","adel"]}` on `desk_a` and on `it_room`, and `deskadmin` then signs in at
  `desk_a` with `200 true` (PROBE A). `filtered_room_data` deep-dups (`game.rb:2782`), the
  inventory echoes filter copies (`games_controller.rb:3626,3727`), start items are copied
  (`game.rb:7978`).
- Hidden equals invented on `PUT sync_state` across `npcInkVariables`, `npcVisibility`,
  `npcHostility` (with `ko: true`), `timedMessages`, `phoneState` and `mailState` (PROBE B, one
  fresh game each, the stored diff and answer with the id replaced):
  `PROBE B deskadmin==zz true`, `PROBE B labadmin==zz true`. All three store ink variables,
  visibility and timed messages alike and drop hostility alike; the bootstrap echoes the stored
  sections for all three alike.
- A PC `owner` naming an account-only NPC would be served in the room answer (PROBE E:
  `owner field: "deskadmin"`), but the validator errors on it (`privilege: sign-in PC 'desk_a': its
  owner 'deskadmin' is an account-only NPC`), so no clean scenario can ship it.
- Remote sign-in `domain` (8ddb0c022, `network_access.rb:1003-1004`): added only on the 200 tile
  answer, after the foothold or `from` reach check, the remote-blocked check and the service check
  (`network_access.rb:950-984`). PROBE C, office foothold planted: `bay_pc` (northwind) `200` with
  the domain; `hot_desk` (northwind, not reached) `403 {"error":"PC not reachable: hot_desk"}`; no
  foothold, `bay_pc` `403`. The PC's `domain` is already in its room answer (`domain` is not in
  `WITHHELD_OBJECT_FIELDS`), so the remote answer gives a reached PC's screen nothing the keyboard
  screen does not.
- `account_admitted?` callers: graph (`generate_dungeon_graph.rb:423,806`), `reach`, validators
  (`validate_access_work.rb`, `validate_npc_habits.rb`, `validate_network.rb`,
  `validate_scenario.rb:8295,8359`, `validate_capture_log.rb:138`) and `npc_habits/clues.rb:378`,
  which only the validator and the graph load. No app or runtime code calls it; the server keeps
  `CredentialModel.pc_admits_account?`. Only `test_ops_privilege` has `accountKind` or
  `accountOnly` (`grep -rl` over `scenarios/*/scenario.json.erb`), and `account_kind_admits?`
  returns true when `creds` has no `accountKind` (`access_identities.rb:350`), so the graph and
  validator answers for every other scenario are unchanged by construction.

EOF
- No client route moves an NPC (`games_controller.rb:1163`, `move_npc_to_room!` is server and test
  only, `game.rb:1742`), so `npcs_added` in `scenario_npc_ids` (`game.rb:6539-6543`, not filtered)
  cannot gain an account-only id from a request. The other `Game#find_npc_in_scenario` callers
  (`game.rb:1101,5438,5451`, `mfa_access.rb:182`) sit behind `npc_in_room?`, an encounter check or a
  server-held id.

## Shipped scenarios

The validator before the fixes (scripts, lib and app/models from 8702cac02, every other path linked
to this worktree) and at 077ae5f8b, both `ruby scripts/validate_scenario.rb <scenarios/x/scenario.json.erb> --no-graph`
from their own root, over all 208 folders, outputs compared after replacing the root path:
`diffs 1 of 208`, every run `exit 0`. The one is `test_ops_privilege`, and only in the intended
lines: identity reach now `deskadmin` at `desk_a`, `desk_b`; `labadmin` at `lab_pc`; `rmenon-adm`
at `hot_desk`, `bay_pc` (was every PC), and the four missing position/behaviour lines for the two
account-only NPCs are gone (077ae5f8b). No `dungeon_graph.*` file was written (`git status` clean
apart from this file).

## Recorded limits

- A technique session grant may name an account-only account (no validator rule against it). The
  server then names that account's username and display name in the session answer and the
  `GET network` host row's `heldAs` (`network_access.rb:1100-1104`). Not run. Whether a technique
  session earns the username as a proved typed sign-in does is the scanner's rule to state.
- `access.people` entries are stripped by exact id; a case variant of an account-only id is served
  as authored (it admits no one, `acl_admits?` matches exact ids) and only the validator's L9
  warning names it.
- Items reached only through ink (`give_item` from an NPC conversation) were not driven; they reach
  the browser through the inventory echo, which filters a copy (`games_controller.rb:3626,3727`).
- `profile_shown_name` is proved by a direct call, not by a real `admin_profile_read` row read
  through `GET log_rows`.

## Verdict

1 major (R2-SERVER1), 0 blockers, 0 minors. Round 1: 8 of 8 findings closed, SERVER1 closed for
every answer but the bootstrap.

not clean
