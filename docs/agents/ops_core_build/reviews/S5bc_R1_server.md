# S5b/S5c stage review, round 1: server, model, validator and graph

Branch `ops-priv2`, commits `f0fef9a53..449556f1c`. Reviewer changed no code.

How the behaviour evidence was made: a scratch integration test (not committed) that includes
`OpsPrivilegeBeats`, builds a game from the real `scenarios/test_ops_privilege/scenario.json.erb`
(sometimes with one field changed, stated in the finding) and calls the real routes. Run as
`flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <scratch>/probe_test.rb -n /probe/`.
Each "Output" block below is a line that run printed.

Also run: the stage's server tests (16 files, 174 runs, 0 failures), the five validator and graph
node tests (all pass), `bin/ops-golden-compare` (31 runs, 0 failures), and
`ruby scripts/validate_scenario.rb scenarios/test_ops_privilege/scenario.json.erb --no-graph`
(0 errors, 3 warnings, 1 privilege info line).

## Findings

### R1-SERVER1 (blocker): an object's `access.people` is sent as authored, so a room answer names an account-only account

- Where: `app/models/break_escape/game.rb`, `filtered_room_data` (the S5c `reject!` at line 2789
  drops the NPC entry only) and `filter_requires_and_contents_recursive` (line 7575), which never
  touches `access`. `WITHHELD_OBJECT_FIELDS` (`network_access.rb:21`) does not hold it either.
- Evidence: scenario changed in one place, `desk_a['access'] = { 'people' => ['deskadmin', 'adel'] }`,
  fresh game, no session, `GET room/it_room`:

  ```
  P1 room status 200 names deskadmin: true
  P1 desk_a keys access,hasContents,host,id,lockType,locked,loginAccounts,loginPicker,name,... access= {"people":["deskadmin","adel"]}
  P1 bootstrap names deskadmin: false
  ```

  The brief's never-list (4.6) has "an `accountOnly` NPC's room entry" and its id is the username
  here. The shipped test scenario avoids this only by admitting with `roles: ["it"]`
  (`scenario.json.erb:733,748,763`); the validator accepts `people` naming an account-only account.
- The client reads `access` only on rfid locks, and there only "is there a list" and
  `people.length > 0` (`unlock-system.js:121,251`). A sign-in PC's `access` is not read at all.
- Fix (`app/models/break_escape/game.rb`): in `filter_requires_and_contents_recursive`, for every
  Hash that has `access` as a Hash with a `people` Array, remove each id whose scenario NPC is
  `AccessIdentities.account_only?` (build the id set once per answer, as the object index is).
  Keep the `people` key. Tests, through the real serialiser, one per answer as unit 13 did for
  `cachedAccounts`: room answer (PC, nested item, NPC `itemsHeld`), container answer, inventory
  add answer, bootstrap. Then extend `OpsPrivilegeCachedNoExposureTest#fetched`
  (`ops_privilege_no_exposure_test.rb:193`): its container list is `bay_pc hot_desk sam_pc store_pc`
  and leaves out `desk_a`, `desk_b`, `lab_pc`, the three PCs that cache the account-only accounts.
  Give one of those PCs `access.people` naming its account in the scenario so the run proves it.
- Note, not new in this stage: `access.people` also names ordinary accounts on a PC whose picker
  is `known` and hides their tiles. Say in the fix reply whether that is stripped too or left.

### R1-SERVER2 (major): the collect answers 500 on a save made before this stage

- Where: `app/models/break_escape/cached_credentials.rb:61`,
  `player_state['harvestedAccounts'] = store` runs even when nothing was added, and
  `games_controller.rb:2153` then calls `keyring_for_client(stamp: true)`, which takes the game
  lock again (`credential_keyring.rb:130`). `ACCESS_STATE_DEFAULTS` is applied only when a game is
  created (`game.rb:7982`), so an older save has no `harvestedAccounts` key; the assignment makes
  the record dirty, and `lock!` refuses a dirty record.
- Evidence: real scenario; the two keys removed from `player_state` with `update_column`; Adel
  signs in at `store_pc` (no cached accounts there); `adel_assist_code` taken (one keyring entry
  not yet stamped); `POST harvest_credentials { pc_id: 'store_pc' }`:

  ```
  P10 keys gone true
  P10 pending ["adel_assist"]
  P10 collect 500 Locking a record with unpersisted changes is not supported. Use `save` to persist the changes, or `reload` to discard them explicitly. | RuntimeError
  ```

  The panel shows the button for any admin session, so every scenario with an administrator
  account can reach this on an existing game.
- Fix (`cached_credentials.rb`): move the assignment inside `unless added.empty?`, before
  `write_log_row!`. Test in `harvest_credentials_test.rb`: a game whose `player_state` lacks both
  keys, an unstamped keyring entry, an admin collect that adds nothing: 200, `harvested: []`,
  and the stored state still has no `harvestedAccounts` key.

### R1-SERVER3 (major): `GET /ink` and `POST /tts` tell an account-only id from an invented one

- Where: `games_controller.rb:4194` `find_npc_in_scenario` and
  `app/services/break_escape/tts_line_resolver.rb:88` `self.find_npc`. Both are marked `keep` in
  the manifest.
- Evidence, fresh game, no session:

  ```
  P2 ink deskadmin 400 {"error":"NPC deskadmin has no storyPath defined"}
  P2 ink zz_nobody 404 {"error":"NPC not found in scenario: zz_nobody"}
  P2 tts deskadmin 400 {"error":"No voice configured for NPC: deskadmin"}
  P2 tts zz_nobody 404 {"error":"NPC not found: zz_nobody"}
  ```

- Fix (`games_controller.rb`): `find_npc_in_scenario` returns nil when the found record is
  `AccessIdentities.account_only?`, so both routes give the invented-id answer. Leave
  `TtsLineResolver.find_npc` as it is for the tooling callers, or give it the same skip; either
  way mark the controller entry `skip` in `test/models/account_only_readers.yml`. Test: both
  routes, status and body equal for the two ids once the echoed id is replaced.

### R1-SERVER4 (major): `PUT /sync_state` keeps hostility for an account-only id and drops an invented one

- Where: `game.rb:6524` `scenario_npc_ids` ("every NPC id the game can have in a room") reads
  `scenario_npc_records` unfiltered; `merge_npc_hostility!` (`game.rb:6372`) keeps what is in it.
  The narrow branch of `scenario_npc_ids` (the SQL read used when `scenario_data` is not loaded)
  has the same gap. The manifest marks `self.scenario_npc_records` `keep`.
- Evidence: `PUT sync_state` with `npcHostility` for `deskadmin`, `zz_nobody` and `olu`, each
  `{ hostile: true, ko: false }`, then `GET scenario`:

  ```
  P9 stored {"olu":{"ko":false,"hostile":true},"deskadmin":{"ko":false,"hostile":true}}
  P9 bootstrap deskadmin: true zz: false
  ```

  The bootstrap then carries the account-only id, and its presence tells the browser the account
  exists.
- Fix (`game.rb`): `scenario_npc_ids` leaves out account-only NPCs in both branches (the narrow SQL
  needs `accountOnly` in its select, as `NARROW_ROOM_NPC_STUBS_SQL` got). Check
  `merge_npc_visibility!` and any other sync merge that tests an id against the scenario's NPCs
  and say what each does. Test: the sync above stores `olu` only, with `scenario_data` loaded and
  with the narrow load.

### R1-SERVER5 (major): the dungeon graph draws sign-in and administrator edges that the account kind refuses

- Where: `lib/break_escape/access_identities.rb:300` `account_admitted?` judges the access list
  only. `reach` (line 309) uses it, and `scripts/generate_dungeon_graph.rb:1875` (admin edges),
  `:423` and `:806` draw from it. The server uses `CredentialModel.pc_admits_account?`, which
  judges the kind first.
- Evidence, committed `scenarios/test_ops_privilege/dungeon_graph.md`:

  ```
  177:  signin_deskadmin --> lock_lab_pc
  179:  signin_labadmin --> lock_desk_a
  187:  signin_ravi --> lock_desk_a
  247:  signin_deskadmin -->|administrator| admin_at_lab_pc
  240:  signin_labadmin -->|administrator| admin_at_desk_a
  249:  signin_ravi -->|administrator| admin_at_lab_pc
  ```

  The recorded server answers say the opposite (`ops_privilege_answers.json`):
  `signin_deskadmin_lab_refused 422 notPermitted`, `signin_ravi_desk_a_refused 422 notPermitted`.
  So the graph shows the hardened PC falling to the shared administrator, which is the one thing
  S5c is there to show does not happen. `dungeon-graph-cached.test.mjs` tests collect edges only.
- The same kind-blind helper feeds validator checks: `validate_access_work.rb:1145,1191,1235`,
  `validate_npc_habits.rb:310,588`, `validate_scenario.rb:8357`, `validate_network.rb:541`; and
  `validate_capture_log.rb:138` and `validate_scenario.rb:8293` repeat the access-list-only rule
  inline. For an account with a kind they judge PCs it can never sign in at.
- Fix (`lib/break_escape/access_identities.rb`): `account_admitted?` returns false unless
  `account_kind_admits?(pc, npc)`; make the two inline copies call it. No shipped scenario has a
  kind, so repeat the before/after comparison of validator output and graphs over the shipped
  folders (`--no-graph` for the validator). Regenerate the `test_ops_privilege` graph. Node test:
  on `privilege_kinds_clean.json`, no sign-in or `administrator` edge from a local account to a PC
  outside `localTo`, nor from a domain account to a PC off its domain.

### R1-SERVER6 (major): the log reader's profile cell names an account-only account that has no tile

- Where: `lib/break_escape/ops_log_events.rb:300` `profile_shown_name`. Its rule is "show the
  owner's display name where the sign-in screen shows that account's tile anyway" (picker
  `accounts`, PC admits it). S5c removed the tile for an account-only account
  (`login_account_tiles`, `game.rb:4121`) but not this branch. `profile_owner` (line 287) is marked
  `keep` in the manifest.
- Evidence: scenario plus one profile, `accountProfiles['desk_files'] = { for: { people: ['deskadmin'] }, ... }`;
  Adel signed in at `desk_a`, nothing collected:

  ```
  P7 desktop 200 deskadmin: false Desk administrator: false   (the profile's file is listed, unnamed: sound)
  P7 shown name "Desk administrator"     (OpsLogEvents.profile_shown_name(game, 'desk_files', { 'kind' => 'pc', 'id' => 'desk_a' }))
  P7 harvested []
  ```

  This is a direct call of the function the reader uses, not a `log_rows` answer: I did not drive
  an `admin_profile_read` row into a terminal. The admin reach to a cached account's profile
  before the collect is by design (brief 4.5); the name in the row is not on 4.6's list of earning
  answers.
- Fix (`ops_log_events.rb`): `profile_shown_name` returns the id when the owner is
  `AccessIdentities.account_only?`. Test: a real `admin_profile_read` row for such a profile, read
  through `GET log_rows`, shows the profile id; a person's profile at the same PC still shows the name.

### R1-SERVER7 (minor): the manifest cannot see indirect readers, and four `keep` entries are wrong

- Where: `test/models/break_escape/account_only_readers_test.rb:13`, `LOOP_PATTERN`. It matches
  `['npcs']`, `scenario_room_npcs` and `dig(... 'npcs')`. It does not match `account_npcs`,
  `scenario_room_npc(`, `scenario_npc_records`, `AccessIdentities.room_npcs`,
  `CredentialModel.room_npcs` or `room_npc_list`, which is about 90 call sites
  (`grep -rnE "account_npcs|scenario_room_npc\b|scenario_npc_records|room_npcs|room_npc_list" app lib`).
  Findings 4 and 6 both sit behind such a call, so "every method that loops room NPCs" (the
  manifest's first line and unit 20's commit message) is not true.
- All 57 `keep` bodies read. Wrong: `games_controller.rb#find_npc_in_scenario` and
  `tts_line_resolver.rb#self.find_npc` (finding 3); `game.rb#self.scenario_npc_records` through
  `scenario_npc_ids` (finding 4); `ops_log_events.rb#profile_owner` through `profile_shown_name`
  (finding 6). Right in effect but with a false reason: `avatar_unlocks.rb#scenario_npcs` says
  "reads a record by id"; it lists every `person` NPC and is safe only because the validator
  forbids `spriteSheet` on an account-only NPC. `ops_log_events.rb#npc_named`,
  `game.rb#ops_badge_as` and `game.rb#confirmable_clone_source` would name an account-only account
  that carries `creds.card`; the validator's allow-list (`validate_privilege.rb:328`) limits the
  NPC's keys but not the keys inside `creds`.
- The other 49 are right: item and object walkers, voice tooling, base lists, and readers that
  act on a room answer already filtered or on an id the client cannot use for an account
  (`P8`: `npc_frustration`, `npc_workaround`, `feed_post`, `friendface_phone`, `clone_card`,
  `mfa/prompt` and an inventory add with `source_npc_id` answer the same for `deskadmin` and
  `zz_nobody`).
- Fix: widen `LOOP_PATTERN` with the six names above and classify what it then finds; correct the
  four entries and the `why` of `avatar_unlocks`; add a validator error in
  `privilege_account_only` (`scripts/validate_privilege.rb`) for `creds.card` on an account-only NPC.

### R1-SERVER8 (minor): a technique's session grant is not checked against the PC's admission at run time

- Where: `app/models/break_escape/network_ops.rb:560` `ops_grant_of` takes the account from the
  weakness and never calls `pc_admits_account?`; `session_access` (`game.rb:3340`) then returns
  the stored `access` for `via: 'technique'` without reading the account. Brief 8.5: "no path
  admits an account the access list refuses". Only the validator stops it
  (`validate_network_ops.rb:532`, which does judge the kind). Code read only, not run. The
  access-list half predates this stage; the kind half is new.
- Fix (`network_ops.rb`): `ops_grant_of` returns nil for a session grant unless
  `pc_admits_account?(host object, npc)`. Test in the network ops technique tests: a grant for a
  `local` account on a PC outside `localTo` gives no session.

## Checked and found sound

- Collect refusals in order, nothing written: tests pass, and by probe a port object's id
  (`bay_usb_port`), another PC with no session, and a PC after sign-out all give the invented-id
  404; `relay=0`, `relay=false`, a foothold not held give 403. A claim and a relayed user give 422
  `not_admin`. A real PC with no session is not told apart from an invented id.
- Typed sign-in is no oracle: `deskadmin` and `zz_nobody` with a wrong password answer alike at
  `desk_a`, `lab_pc` and `bay_pc`, and both are counted alike.
- `POST /crack` on an uncollected harvested hash is the invented-id 404. The strong hash answers
  `nomatch` then `infeasible`, which is S7's rule (`ops_cracking.rb:201`), unchanged.
- Pairs are per PC: `harvested_rows` and the `harvested` proof both read `"<pc>|<npc>"`, so a
  collect cannot name an account cached elsewhere. A borrow candidate is read only through
  `cachedAt`; the pair is saved by the borrow's own `save!`; each borrower has its own pair.
- Admission by kind: typed, credential, claim, guest claim and `account_admin_at?` all go through
  `CredentialModel.pc_admits_account?`. A cracked local or domain password is refused off its PCs
  (recorded answers). Kinds only narrow.
- Relay level and port override: code matches brief 4.5; tests pass. `portOf` is ignored unless it
  names a sign-in PC in a room.
- Before any collect, an admin at `desk_a` sees no account-only word in `login_accounts`,
  `network`, `keyring`, `container/desk_a`, the bootstrap, the room answer or a sync body.
- Account-only NPCs are out of room answers, tiles, KO ids (both branches), sprite keys,
  `hasNPCs` and `hasPresentNpc`. The filter runs after the KO and room-state injection.
- No stage test in this area alters an application class. Golden compare clean.

## For the owner

- Ruling A speaks of a storage stick. `keyboard_or_session_admin?` (`capture_proofs.rb:201`) has
  no device class test, so at a `portOf` port any admin session at the PC, remote and relay
  included, also overrides the policy for a HID class device that needs no session (code read, not
  run). Keep that, or limit the port override to `storage`?

not clean
