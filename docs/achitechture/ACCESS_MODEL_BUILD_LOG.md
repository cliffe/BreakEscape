# Access model: build log

Build notes for `ACCESS_MODEL_PLAN.md`, first slice (section 8). One section per step or group of
steps: what was built, the tests, suite results, deviations from the plan and what the next step
needs to know.

## Steps 1 and 2: schema and loader, server withholding (2026-11-09)

### Built

- `app/models/break_escape/game.rb`
  - `prepare_scenario_data!` (public): runs `normalise_access_model!`, then
    `stamp_scenario_object_ids!`. `generate_scenario_data` calls it where it called the stamp.
    Both steps are idempotent.
  - `normalise_access_model!` (private): for each room NPC, copies `rfidCard` into `creds.card`
    when `creds.card` is absent (and keeps `rfidCard`); for an account holder, sets an authored
    `usePayload`'s `address` and `secret` from `creds.username` and `creds.password`.
  - `stamp_scenario_object_ids!` also walks `accountProfiles` (`<profile>_content_<n>`, nested as
    room contents).
  - Class helpers for later steps: `Game.account_holder?(npc)`, `Game.npc_card(npc)`
    (`creds.card || rfidCard`), `Game.normalise_username(value)` (trimmed, lower case, 64 chars),
    `Game.scenario_room_npcs(data)`, `Game.capture_route?(npc)`.
  - `withhold_npc_secrets!(npc)` (private), called on each NPC in the `npcs` loop of
    `filter_requires_and_contents_recursive` before it recurses: deletes `creds`, `role`,
    `awareness`, `habits`, `workarounds`; for an account holder also `usePayload.secret` and every
    `addCapture.secret` in its `eventMappings`; sets `rfidCard` from `creds.card` when present.
  - The same filter drops `contents` from every `lockType: "login"` object, locked or not, and sets
    `hasContents: true`.
  - `filtered_scenario_for_bootstrap`: deletes `accountProfiles`; adds `access` and
    `acceptsUIDOnly` to the room allow list. `policies` and `defaultPolicy` already ship as
    authored (the bootstrap is a copy of the whole scenario with rooms reduced).
  - `capture_secrets_for_client`: the "no landing-page secret" early return is gone; an
    account-holder pass (`account_capture_passwords`) answers an earned credential entry whose
    address matches, normalised, the username of a room NPC with an account and a capture route.
  - `apply_room_state_changes!` concatenates a deep copy of `room_states.npcs_added` (see
    deviations).
- `scripts/validate_scenario.rb`: known fields for top level (`accountProfiles`, `policies`,
  `defaultPolicy`), rooms (`access`, `acceptsUIDOnly`), NPCs (`role`, `creds`, `staff`,
  `cloneable`) and items (`access`, `acceptsUIDOnly`, `loginPicker`, `policy`, `transfer`,
  `cloneable`, `identity`); profile items get the same unknown-field and `minigameData` checks as
  room objects.
- `scripts/scenario-schema.json`: `login` in the item `lockType` enum; an `accessList` definition;
  the fields above with types and descriptions; `accountProfiles` and `policies` shapes.
- `test/test_helper.rb`: `create_access_game(mission:, player:, scenario:, player_state: {})`.
- `test/support/access_model_scenario.rb`: the shared fixture (Jake: account with a capture route;
  Dana: account with none; Len: card-only, legacy `rfidCard` with protocol fields; a sign-in PC with
  local contents; Jake's profile; an `rfid` object with `access`).

### Tests added

- `test/models/break_escape/access_model_loader_test.rb` (10): `creds.card` filled, an authored
  `creds.card` kept; `usePayload` filled, never created; profile ids; a second run (and a run after
  a database round trip) changes nothing; an `rfidCard`-only scenario keeps working; a game created
  with `Game.create!` and hand-set data is left untouched; a game generated from the
  `lab_physical_pentest` mission runs the loader at creation.
- `test/models/break_escape/access_model_withholding_test.rb` (14): NPC withholding, account
  holder `usePayload` and `addCapture`, `rfidCard` from `creds.card`, a card-only NPC's full card,
  pre-loader data, an NPC added by `move_npc_to_room!` (withheld, and `player_state` keeps the full
  record), sign-in PC contents (also when listed in `unlockedObjects`), `rfid` object fields,
  bootstrap, and the capture passes (no `landingPages`, normalised match, forged entry with no
  capture route, `revealSecret` off, landing-page fallback never answering with an account
  password).
- `test/controllers/break_escape/access_model_no_password_test.rb` (7): the no-password test over
  `/scenario`, `/room/:id`, a door `/unlock`, `update_room` `move_npc` then `/room/:id`, and
  `/capture_secrets` with no entry and with a forged entry; plus the earned case serving only
  Jake's password. Each response is checked for both passwords, the PC's local file text and the
  profile file text.

### Results

- Rails: 974 runs, 0 failures, 0 errors, 1 skip (baseline 943; 31 added).
- `bin/test-js`: 392 files, all pass.
- `scripts/validate_scenario.rb` on `lab_physical_pentest`, `m01_first_contact`,
  `test_needs_sims`, `m10_full_disclosure` and `test-rfid-multiprotocol`: output identical to the
  validator at HEAD (checked in a temporary worktree). A scratch scenario built from the test
  fixture passes the schema with `lockType: "login"`; its only unknown-field warnings are
  `awareness`, `habits` and `workarounds`, which belong to a later slice.
- `test/dummy/db/schema.rb` unchanged.

### Deviations and choices

- **`usePayload` is filled, never created.** The loader sets `address` and `secret` only on a
  `usePayload` the author wrote. Creating one for every account would give every account a capture
  route (section 5.6 counts "a `usePayload` the loader filled"), so a forged capture entry could
  read any password. Step 10's Pierce keeps an authored `usePayload` (address and host), so it is
  unaffected.
- **`npcs_added` is copied before the filter.** `filtered_room_data` concatenated the
  `player_state` records themselves, and `move_npc_to_room!` stores a shallow merge of the
  scenario NPC, so withholding in place would have stripped `creds` from `player_state` on the next
  save (and a `usePayload` secret, a nested hash shared with `scenario_data`, in memory). The concat now
  takes a deep copy. `objects_added` is still concatenated as is (the existing filter already strips
  `requires` from those records in place); left alone as out of scope.
- **Capture lookup order.** Landing-page exact address first, then the account-holder match, then
  the landing-page single-secret fallback. The fallback still answers a non-matching entry with the
  one landing-page secret, as before, but never with an account password.
- **Loader scope.** Only `rooms.<id>.npcs` records are touched, so a top-level or phone NPC never
  gains `creds` and the bootstrap (which ships those unfiltered) stays clean.
- **Validator field lists.** `identity` (keycard), `staff` and `cloneable` (NPC) are accepted now
  as well, since sections 3 and 6 define them. `test/js/validator-portrait-variants.test.mjs` greps
  for the exact text `gender portraitVariants _comment`, so the new NPC fields sit on their own line
  above it.

### For step 3

- Build every hand-written access scenario with `create_access_game`; the fixture in
  `test/support/access_model_scenario.rb` can be extended (it has no policy lockout data, no
  `screenOwner`, no needs).
- A sign-in PC's `locked` is not forced to true in room data. It stays true only because nothing
  adds it to `unlockedObjects` (step 3's `/unlock` refusal) and nothing writes `object_states`
  `locked: false` for it. If either can happen, force `locked: true` for `lockType: "login"` in
  `filter_requires_and_contents_recursive` beside the `hasContents` line.
- Games created before this change have `rfidCard` and no `creds`; read cards through
  `Game.npc_card`. Account checks go through `Game.account_holder?` and username comparisons
  through `Game.normalise_username`.
- The no-password test lives in `access_model_no_password_test.rb`; add `/login_accounts` and the
  signed-out `/container/:id` cases there.

## Step 3: server routes (2026-11-09)

### Built

- `config/routes.rb`: `POST login`, `POST logout`, `GET login_accounts`, `POST clone_card` on a
  game. `GamePolicy` gains `login?`, `logout?`, `login_accounts?` and `clone_card?` (all `show?`).
- `app/controllers/break_escape/games_controller.rb`
  - The four actions; `login`, `logout` and `clone_card` are in the `with_game_lock` list, and all
    four in `set_game`.
  - `container`: `@game.login_scope_of` first. A sign-in PC goes to `render_login_desktop` (PC
    reachable, session set, `unlockedObjects` ignored; its own contents, then the admitted
    profiles, through `filter_container_contents`). A scoped folder needs `session_admits?` and
    `path_unlocked?` for its path and itself. Anything else as before.
  - `unlock`: passes `card_ids` (nil when the request has none); on a refused `rfid` attempt with
    `card_ids` it asks `uid_only_refusal?` and answers `reason: "uid_only"`.
  - Inventory add: `source_pc_id` and `transfer`; `validate_login_item_collectible` runs the six
    checks of section 6 and sets location `{ type: 'login_pc' | 'profile', ... , path }`; a Copy
    joins `copiedItems`. Without `source_pc_id`, `find_accessible_item` no longer searches a
    sign-in PC's contents (profiles were never searched there).
  - `find_object_in_scenario` walks profiles (after rooms, before grants), so a profile archive's
    unlock answer carries its contents.
  - `filter_container_contents` keeps an item whose id is in `copiedItems`.
  - `scenario` adds `sessions` (`{ pcId: { npcId, username, displayName, via } }`) and
    `signedInPcs`, always (empty when none).
- `app/models/break_escape/game.rb`, one new section before `UNLOCK_METHODS_BY_LOCK_TYPE`:
  - Class rules: `login_pc?`, `identity_roles` (role plus implicit `staff`), `acl_admits?`,
    `needs_tracked?` (the client's `register` rule, including numeric strings for needs as
    JavaScript's `Number()` reads them; a bare interest must be a number), `npc_talk_portrait`,
    `acl_lock?`, `normalise_card_ids`.
  - Lookups: `account_profiles`, `scenario_room_npc`, `account_npcs`, `account_for_username`,
    `login_scope_of` (returns `{ object:, room_id:, scope:, path: }`), `find_login_pc`,
    `login_pc_reachable?`, `find_login_item`, `login_desktop_contents`, `admitted_profiles`
    (role profiles first, then personal, declaration order).
  - Sessions: `session_admits?`, `scope_admitted_by_session?` (one PC's session, for inventory
    adds), `path_unlocked?`, `session_identity`, `sessions_for_client`, `signed_in_pcs`.
  - `attempt_login!`, `claim_login_session!`, `logout_session!`, each returning
    `{ status:, body: }` for the controller; failure counting with `seq` and the 200-entry bound
    for non-account usernames in both keys; `login_account_tiles`, attached to every sign-in PC in
    `filtered_room_data` as `loginAccounts`.
  - Cards: `scenario_keycard_definitions`, `held_rfid_cards`, `rfid_lock_passes?`,
    `rfid_identity_passes?`, `uid_only_refusal?`, `record_card_clone!`, `clone_source_keycard`.
  - `unlock_scope_refused?` (check 1 of `/unlock`), called first in `validate_unlock`'s object
    branch, before the "already in `unlockedObjects`" return and the `npc` and `flag_reward`
    methods. `validate_unlock` takes `card_ids:`; its door and object `rfid` cases call
    `rfid_lock_passes?` (no `access`: trusted as before).
  - `find_scenario_object` walks profiles after rooms; `complete_task!` meets an `unlock_object`
    task on a sign-in PC from `signedInPcs`; `initialize_player_state` fills the six keys from
    `ACCESS_STATE_DEFAULTS` (not on `preserved_keys`, so a reset empties them).
  - The room filter now also forces `locked: true` on every `lockType: "login"` object (the step 2
    note): `apply_room_state_changes!` marks an object open when `unlockedObjects` holds its id,
    its name or its client id, so an unrelated unlocked object sharing the PC's name would have
    opened it.
- `test/support/access_model_scenario.rb`: `routes_scenario`, the base fixture plus a second
  profile, three more sign-in PCs (profiles only, `it` only, one in a locked room), six `rfid`
  doors, a DESFire holder, a shared card, three keycards (one in a locked safe), a copy-only file,
  a file in the locked archive and an `unlock_object` task on `jake_pc`.

### Tests added

- `test/controllers/break_escape/access_model_login_test.rb` (25): sign-in success and its
  answer; trimmed, case-insensitive usernames; an unknown username and a wrong password giving the
  same bodies and `attemptsLeft` 4, 3, 2, 1; a case-only mistake answered as a wrong password (no
  `caseMismatch`); `notPermitted` leaving the count alone; lockout with the right password, a wrong
  one and an invented username; a sign-in clearing its failure entry; unreachable and unknown PCs;
  300 invented names with `game.reload` between attempts (200 non-account entries in each key,
  the earliest dropped, real accounts' counts and lockouts kept); sign out then 403; switching
  account; a profiles-only PC; sessions and `signedInPcs` in the scenario response; reset; claim
  success (needs, interests as a number and as an object), a lockout not stopping a claim, nine
  claim refusals (unreachable, unowned, untracked, invalid entries only, no account, access list,
  `lockChance` 1, default locking, `autoLockMin` 0) and `locksScreenOnLeave: false`; tiles for
  `accounts`, `known` and `false`, in room data (with `locked` forced true) and refused for an
  unreachable PC; the `unlock_object` task.
- `test/controllers/break_escape/access_model_rfid_test.rb` (24): `/clone_card` from an NPC, a
  DESFire NPC (UID-only), an unmet or `cloneable: false` NPC, a held keycard, a keycard in a
  reachable room, one in a locked safe (refused, then accepted after the safe opens), another
  card id (`recorded: false`) and no copier; role-list doors with a held keycard, a recorded copy,
  the copy after the copier is removed, a `saved_cards`-only copy, no `card_ids`, an identity the
  list does not admit; UID-only refused with `reason: "uid_only"` and accepted at an
  `acceptsUIDOnly` door; mixed doors (trusted `requires`, a held `requires` card, an identity
  outside the list); a shared card through either holder's role; the first passing card of
  several; refusals without a reason; tiles in a door unlock's room data; the same rules on an
  `rfid` object.
- `test/controllers/break_escape/access_model_desktop_test.rb` (14): desktop order and a locked
  folder's contents withheld; signed out (also with the PC in `unlockedObjects`) and unreachable
  refused; `/unlock` refusing a sign-in PC for `unlocked`, `npc`, `flag_reward`, `password` and
  `login` while it sits in `unlockedObjects`; the profile archive refused before sign-in, opened
  while signed in, refused by `/unlock` and `container` after sign-out; no `caseMismatch` for a
  refused scoped target; a profile folder refused to an identity it does not admit; Copy and Move
  of a profile file and a PC-local file (listed or gone on reopening, gone from the profile on
  another PC after a Move), refused signed out; Move refused on `transfer: "copy"`; the archived
  file refused until the archive opens; a profile file refused through a session it does not
  admit; PC and profile files not found without `source_pc_id`.
- `test/models/break_escape/access_model_rules_test.rb` (5): `identity_roles`, `acl_admits?`,
  `needs_tracked?`, `login_scope_of` scope and path, empty state on a new game.
- `access_model_no_password_test.rb` (+3): `/login_accounts`, `/container/:id` signed out (the PC
  and the profile archive, both listed in `unlockedObjects`), and failed sign-ins.

### Results

- Rails: 1045 runs, 0 failures, 0 errors, 1 skip (974 before; 71 added).
- `bin/test-js`: 392 files, all pass.
- `test/dummy/db/schema.rb` unchanged. RuboCop clean on the changed app files.

### Deviations and choices

- **`find_container_in_scenario` is unchanged.** The `container` action resolves every sign-in PC
  and scoped object through `login_scope_of` before it reaches that lookup, so the rooms-only
  search only ever answers for unscoped containers. Walking profiles there as well would add a
  second path to the same objects with no caller.
- **`login_scope_of` returns the object and its room as well as scope and path**, so the routes
  look an object up once.
- **Status codes**, which the plan leaves open: sign-in refusals (wrong details, lockout, not
  permitted) and every claim refusal answer 422; `/login` with a password answers 404 for an
  unknown PC and 403 for an unreachable one, while a claim answers "Sign in required" (422) for
  both. `/clone_card` checks 1 and 2 answer 403, check 3 answers 200
  `{ success: true, recorded: false }`, and a request with neither source 400.
  `/login_accounts` answers 404 or 403 like `/login`.
- **Keypad hints for refused scoped targets.** `pin_cracker_feedback`, `password_case_mismatch?`
  and `uid_only_refusal?` now say nothing for a target `/unlock` check 1 refuses: once
  `find_scenario_object` walks profiles, a PIN-locked profile folder would otherwise have answered
  the PIN cracker's pips without a session.
- **A held keycard** is a scenario keycard definition (rooms and their contents, NPC `itemsHeld`,
  starting items, profiles) that `ItemIdentity.held_in?` finds in the inventory. Its `card_id` is
  read from the definition, so a client-written field on another inventory item never counts.
- **Profiles without `for` admit nobody.** The plan does not say; nobody is the safe reading, and
  the step 4 validator can flag it.
- **"PC reachable" also checks the containers above the PC** (`path_unlocked?`), for a PC authored
  inside a locked container. No current scenario does this.
- **Inventory add from a sign-in desktop** skips the "already held, accept without revalidation"
  shortcut, so its checks run and a Copy is recorded; `transfer` defaults to `move` when absent,
  and any other value is refused.
- **Claim globals** are taken from `globals` (a hash) or `screen_locked` / `owner_away`, and only
  logged, as the plan says.
- **Failure keys** are `pcId|username` with the normalised username; account entries are told
  apart by the part after the first `|`, so a PC id containing `|` would be misread. Step 4's
  validator could reject such ids.
- **A claim answers the owner's details even on a `loginPicker: false` PC** (as the plan says), and
  a claim checks `needs_tracked?` before the account check, as in the plan's order.

### For the next steps

- Route shapes for the client (steps 7 and 8):
  - `POST /login` `{ pc_id, username, password }`: 200 `{ success, npcId, username, displayName,
    via }`; 422 `{ success: false, message, attemptsLeft }` (`attemptsLeft` null without a
    limit), `{ ..., lockedOut: true, attemptsLeft: 0 }` or `{ ..., notPermitted: true }`.
  - `POST /login` `{ pc_id, claim: "owner", globals: { ... } }`: 200 as above with
    `via: "claim"`, or 422 "Sign in required".
  - `POST /logout` `{ pc_id }`: `{ success: true }`.
  - `GET /login_accounts?pc_id=`: `{ pc_id, loginAccounts: [{ username, displayName, portrait,
    avatar }] }`.
  - `POST /clone_card` `{ card_id, npc_id | object_id }`: `{ success, recorded }`.
  - `POST /unlock` takes `card_ids`; a UID-only refusal carries `reason: "uid_only"`.
  - `POST /inventory` add takes `source_pc_id` and `transfer: "copy" | "move"`.
  - `GET /container/<pcId>`: the desktop for the session, or 403 (no session, or the PC not
    reachable); `pc-sessions.js` drops its local session on that 403.
  - Room data: every sign-in PC carries `loginAccounts` and `locked: true`.
- Step 4 (validator): the server's rules to mirror are `Game.identity_roles`, `Game.acl_admits?`
  and `Game.needs_tracked?`.
- `routes_scenario` in `test/support/access_model_scenario.rb` is a ready-made fixture for the
  later steps' server checks.

## Steps 4 and 5: validator checks, dungeon graph identities (2026-11-09)

### Built

- `lib/break_escape/access_identities.rb` (new): `BreakEscape::AccessIdentities`, plain Ruby
  (no ActiveSupport) like `declared_grants.rb`, so the validator and the graph generator share
  one set of identity rules. It mirrors the server's `Game.identity_roles`, `acl_admits?`,
  `needs_tracked?` (with `positive_number?`), `account_holder?`, `npc_card`,
  `normalise_username` and `login_pc?`, read from the authored scenario. It adds `room_npcs`,
  `room_objects` (room objects and NPC `itemsHeld`, recursing into `contents`), `workstation?`
  (the `isWorkstation` rule plus every sign-in PC), `owner_id`, `locks` (locked `rfid` rooms as
  doors, locked `rfid` objects, every sign-in PC), `cards` (one entry per `card_id` with every
  holder), `card_opens?`, `account_admitted?`, `reach` and `uses_access_model?`.
- `scripts/validate_scenario.rb`: `check_access_model(json_data, repo_root, scenario_dir)`,
  called with the other common checks in `main`. Every error and warning in step 4's list, plus:
  - an error for a sign-in PC id containing `|` (the step 3 note);
  - an error for a sign-in PC whose `screenOwner` names no room NPC (an unresolved person);
  - a warning for a profile with no `for` roles or people (it admits nobody, step 3 note).
  - Identity reach: one `ℹ️ Identity reach:` line per NPC card (the doors and `rfid` objects
    it opens, through `requires` or `access`) and per account (the sign-in PCs that admit it).
  Messages never quote a password.
- `scripts/generate_dungeon_graph.rb`: `login` labelled "Sign-in" in `LOCK_TYPE_LABELS`. For a
  scenario that uses the access model, a key node per `card_id` that opens something
  (`card_<card_id>`, labelled with the card name and every holder's display name) and per
  account that can sign in somewhere (`signin_<npc id>`, labelled with the display name and
  username), each with an edge from its holder's room and an edge to every lock it opens:
  `door_<room>` for a door, `lock_<object id>` for an object or sign-in PC (created, from its
  room, if no other walk made it).

### Tests added

- `test/js/validator-access-model.test.mjs` (23): a clean fixture with no error or warning;
  reach lines; a scenario without access model fields gets no output; one fixture per error
  (unresolved person, policy and card references; an unknown `screenOwner`; profile id clashes;
  `role` or `creds` on top-level, phone and headless NPC records; a missing password and a
  duplicate username; a keycard `identity`; a password in compiled ink, with no message quoting
  it; `usePayload` and `addCapture` on an account holder, a case-only address difference
  allowed; an `rfid` lock with neither field and `access` on a gate door, a disabled gate
  allowed; `unlockable` and an `unlock_object` flag reward; `triggerOnInteract` and a `|` id)
  and per warning (an unheld role and a profile admitting nobody; `needsHome` not admitted;
  `lockChance` 0.5, but not 0 or 1; an untracked owner, an interest counting; owners in another
  room, through `needsHome` and `screenOwner`; `maxAttempts`; a capture route without
  `revealSecret`; another NPC's `#clone_keycard`, the speaker's own allowed; a shared card at an
  access lock).
- `test/js/dungeon-graph-identities.test.mjs` (5): a role-list door with an edge from each
  admitted identity's card node and none from a card it does not admit; a shared card as one
  node naming both holders; a sign-in PC with an edge from each admitted account's sign-in node
  (an access list and no access list), no password in any label; a card matching `requires`;
  no identity nodes for a scenario without access model fields.

### Results

- `bin/test-js`: 397 files, all pass (392 before; this step's two new files, the rest from step 6,
  which was being built at the same time).
- The new check over all 161 scenarios (rendered, `check_access_model` alone): no output for
  any of them, so no existing scenario gains an error, a warning or a reach line. The full
  validator (`--no-graph --no-lint`) on `lab_physical_pentest`, `m01_first_contact`,
  `m10_full_disclosure` and `test_needs_sims` completes, with nothing from the access model;
  the ink it recompiles came out unchanged (no diff).
- RuboCop clean on `lib/break_escape/access_identities.rb`. The Rails suite was not run here
  (the orchestrator runs it); nothing on the server changed.

### Deviations and choices

- **Shared rules in `lib/`.** The plan puts the checks in `validate_scenario.rb`; they are
  there, but the identity rules sit in `lib/break_escape/access_identities.rb` so the graph uses
  the same ones. `Game` keeps its own copies; the two must change together (the lib's header
  says so).
- **"Unresolved profile reference".** Nothing in the first slice refers to a profile by id (a
  PC shows every profile whose `for` admits the account), so there is nothing to resolve. The
  nearest fault, a profile with no `for`, is a warning.
- **"Unresolved card reference"** is a card in the `requires` of an `rfid` lock that has
  `access` which no NPC card or authored `card_id` anywhere in the scenario carries. A
  requires-only lock keeps the existing `check_lock_credentials` warning, so legacy scenarios
  get no new error. A keycard `identity` is its own error, as listed.
- **Persons** are checked in `access.people`, profile `for.people` and a sign-in PC's
  `screenOwner`, against room NPC ids (the only NPCs that can carry an identity).
- **Usernames in `usePayload.address` and `addCapture.address`** compare normalised (trimmed,
  case-insensitive), as the server's capture match does; `usePayload.secret` compares exactly.
- **Gate doors**: a `doors[]` entry with a `gate` (not `enabled: false`) is an error when the
  entry or its `connectedRoom` has `access`.
- **Owner placement** applies to every workstation (`isWorkstation`, plus sign-in PCs), owned
  through `needsHome` (a string) or `screenOwner`, reported once per owner and PC. No existing
  scenario triggers it.
- **Ink files** are every `storyPath` in the scenario (any record) plus the scenario's
  `ink/*.json`. The password check reads the compiled JSON's strings (the `.ink` source when
  there is no compiled file); the `#clone_keycard` check reads the `.ink` source when present.
  Templated tags (`{card_card_id}`) are skipped, as are cards no NPC carries and files no NPC
  uses. Without `repo_root` the ink checks are skipped.
- **Reach lines and graph nodes appear only for scenarios that use the access model**
  (`uses_access_model?`: `accountProfiles`, `policies`, `defaultPolicy`, NPC `creds` or `role`,
  `access` on a room or object, or a sign-in PC), so every other scenario's validator output
  and graph are unchanged. Errors and warnings that apply to any scenario (owner placement,
  `#clone_keycard`, an `rfid` lock with no `requires`) run everywhere.
- **Graph edges** from a room to an identity node are solid, like the NPC nodes'. A card held
  only inside the room it opens makes a cycle (room, card, door, room); the critical path is
  computed on the aim graph, so it is unaffected.
- **No UID-only note in reach.** A DESFire card's copy is UID-only, but reach lists what the
  identity opens, as the plan's step 4 says, and does not separate a copy from the real card.

### For the next steps

- Run the validator on each feature scenario as it is written (steps 7 to 9); `PLAYTEST.md`
  lists the warnings expected there (for example `maxAttempts` on `test_access_signin`'s
  `corp_default`, and `lockChance` between 0 and 1 if a beat needs one).
- `BreakEscape::AccessIdentities` can serve later tooling (an "opens a lock earlier than
  intended" check once the graph exposes an order).

## Step 6: playtest tooling (2026-11-09)

### Built

- `.claude/skills/playtest-scenario/scripts/response-capture.js` (new) and
  `playtest-session.js --capture-responses <file>`. One line per JSON response from the game
  server: `{ n, t, method, path, [query], status, cmdSeq, cmd, cmdActive, body }` (`bodyText`
  when the body does not parse, `bodyError` when the browser no longer holds it). `cmdSeq` is
  the session log `seq` of the command's `in` line (`logLine` now returns its seq); `cmd` is
  the command's name only, since its arguments can hold typed secrets; `cmdActive` is false for
  a response that arrived between commands (a timer's sync), which keeps the last command's
  seq. Responses before the first command carry `cmdSeq: null`. The listener is on the browser
  context and installed before the first navigation, so the bootstrap is captured. Kept: same
  origin as `--url`, a JSON content type, not a static path (`/js/`, `/css/`, `/assets/`,
  `/stylesheets/`), not a redirect. Lines are appended whole, in arrival order, and flushed
  before the browser closes on `quit`. The session-open line reports `capturePath`.
- `tools/playtest/lib/access_leak_scanner.rb` (new) and `tools/playtest/access-leak-check.rb`
  (new): `bin/rails runner tools/playtest/access-leak-check.rb <game_id> <responses.jsonl>
  [more.jsonl ...]`. The secrets come from the game's scenario data: every room NPC's
  `creds.password`, and the name, text and content strings of every item under a sign-in PC,
  under an account profile, or inside a container authored `locked: true`. Four rules:
  `password`, `signin_content`, `profile_content`, `locked_content`. Each finding prints the
  rule, `owner=npc:<id>` or `item:<id>`, the route (method and path, no query), the file and
  line, the command's log seq and the JSON path; every output line goes through a redaction
  pass against the secret values as a last guard. Exit 0 clean, 1 on any finding, 2 on a usage
  error.
- `tools/playtest/verify-run.rb`: an access section (`sessions` as `pc = npc (via)`,
  `signedInPcs`, `serverClones` with source and UID-only, `copiedItems`, `loginFailures` as a
  count per key in `seq` order, `loginLockouts`). The full report prints it when any key holds
  something, else one line; `--access` (before or after the game id) prints only the game line
  and the section and exits 0.
- `public/break_escape/js/systems/test-bridge/access.js` (new), exposed as
  `window.__test.access`: `sessions()`, `workstation(pcId)`, `savedCards()`. Documented in
  `docs/test-bridge.md` ("Access model state").
- `.claude/skills/playtest-scenario/SKILL.md`: the `--capture-responses` option row and an
  "Access model checks" paragraph.
- `test/js/fixtures/verify-run-stub.rb`: `STUB_PLAYER_STATE` (JSON merged into the stub's
  player state).

### Tests added

- `test/unit/access_leak_scanner_test.rb` (10), over `test/fixtures/files/access_leak/`
  (`scenario.json`, `responses.jsonl`): the fixture file gives exactly its five planted findings
  with route, command seq and JSON path; a password planted in room data is reported, the same
  password in an authored note (with its id, as notepad text without one, and as a
  `postitNote`) is not, the bare password lifted out of a note is; `/capture_secrets` allowed
  only under `revealSecret` for an NPC with a capture route, and only on that route; profile
  text reported in a room response and another object's container, not in a sign-in PC's or
  its own folder's container response; sign-in PC content only in that PC's container, and
  allowed later once served there; a locked container's contents reported while marked locked
  and not once marked unlocked, in its own container response or when listed locked without
  contents; public and short strings ignored; no output line holds a secret; the runner script
  (loaded against a `create_access_game` game) exits 1 with five findings and no values, and 0
  on a clean file.
- `test/js/playtest-session-capture.test.mjs` (6): one line per JSON response with the running
  command's seq, the between-commands and before-first-command cases, the query, refusals kept;
  static, other-origin, redirect and non-JSON responses skipped; arrival order kept when bodies
  resolve out of order; unparsed and unreadable bodies; only the command's name recorded; the
  harness wiring (listener before `page.goto`, start, end, flush).
- `test/js/playtest-verify-run-access.test.mjs` (4): `--access` with every key set, `--access`
  first and on a game without the keys, the section in the full report, the one-line form.
- `test/js/test-bridge-access.test.mjs` (6): the block is exposed; `sessions()` without and
  with a `pcSessions` module; `workstation()` through a real `WorkstationState` (present, away
  and back, a non-workstation, an unknown id, `ownerPresent` and `lockAt` when present, a copy
  of the away record); no module; `savedCards()`.

### Results

- `bin/test-js`: 397 files, all pass (392 before; this step adds 3, steps 4 and 5 add 2).
- `bin/rails test test/unit/access_leak_scanner_test.rb`: 10 runs, 94 assertions, 0 failures.
  The full Rails suite was not run here (the orchestrator runs it).
- RuboCop clean on the new and changed Ruby files.
- Live check on the keyless server (:3001, stopped afterwards): real `/scenario`, `/room/:id`,
  `/capture_secrets`, `/login_accounts` and signed-out `/container/:id` responses for a game
  built from `AccessModelScenario.routes_scenario` (all rooms unlocked, an earned capture for
  Jake) gave no findings, with Jake's password served by `/capture_secrets` and allowed; a
  tampered copy (a password in an NPC field, PC content in room data, the capture answer under
  another path) gave exactly those three findings, without values, exit 1. `m01_first_contact`
  (24 locked-container items, all rooms unlocked) and `m10_full_disclosure` gave no false
  positives. `verify-run.rb --access` ran through `bin/rails runner`. The four games were
  deleted afterwards. The browser harness itself could not be run here: this container's
  Playwright expects chromium build 1254 and has 1243, so `--capture-responses` is tested
  through the module and the wiring, not in a live browser session.

### Deviations and choices

- **The capture logic is its own module** (`response-capture.js`, beside `vm-steps.js` and
  `config-gate.js`), so it is tested without a browser; `playtest-session.js` only wires it.
- **A capture line names the command and its log seq, not its arguments.** The plan says "the
  session log line of the command"; the seq points at that line, which already carries the
  (redacted) arguments.
- **Content that has been served by its own route may travel.** Once a sign-in PC or profile
  item has appeared in an allowed `container` response, later responses carrying it (the
  inventory add's answer, a reload's bootstrap) are not findings: the browser already held it
  legitimately. The checker therefore takes several response files in order, for a run split
  across sessions.
- **Which strings count as content.** Names match a whole string; a text matches inside a
  longer string only from 20 characters. Strings under 6 characters, and strings also authored
  on an object outside every secret scope, are not checked, because they cannot be told apart
  from ordinary data (a "Mail" app, a "Visitor log" in two places). A password under 6
  characters is matched as a whole token rather than a substring.
- **Deliberate clues.** A password is allowed inside a response hash whose `id` is an item
  (not an NPC) with an authored string holding that password (any of its own fields, so
  `text`, `postitNote`, observations), or in a string that contains such an authored string
  whole (a note in the notepad). The bare password elsewhere is still a finding.
- **The locked-container rule is per response**, as the plan says: a response that marks a
  container `locked: true` anywhere and carries its contents' strings anywhere. A sign-in PC is
  not treated as a locked container (it is always marked locked; its own rule covers it).
- **`workstation(pcId)`** returns `workstation: false` rather than an error for an object the
  module does not treat as a workstation, because a sign-in PC is not one until step 9; owner
  and screen fields are still read. `present` uses `env.ownerPresent` when step 9 adds it, else
  "not away".
- **`sessions()`** reads `window.pcSessions`, through `list()` if it has one, else a
  `sessions` map. Step 8 should expose the module as `window.pcSessions` with a `list()`
  returning `[{ pcId, npcId, username, displayName, via }]`, or update `access.js`.

### For step 7

- Start each scripted run's session with `--capture-responses <scratch>/<scenario>-responses.jsonl`,
  and after each beat run `verify-run.rb <game_id> --access` and
  `access-leak-check.rb <game_id> <that file>` (SKILL.md, "Access model checks").
- Live sessions need a Playwright whose chromium build is installed; in this container the
  harness's `chromium.launch` fails (expects 1254, has 1243 under `/opt/pw-browsers`).

## Step 7: client doors and card copies, `test_access_doors` (2026-11-09)

### Built

- `public/break_escape/js/api-client.js`: `unlock(targetType, targetId, attempt, method, extra)`
  merges `extra` into the body (`{ card_ids }` for an access-list lock); `cloneCard(source,
  cardId)` posts `/clone_card` with `{ npc_id | object_id, card_id }`.
- `systems/doors.js`: `doorProperties` gains `access` and `acceptsUIDOnly` (door definition first,
  then the connected room, like `requires`).
- `systems/unlock-system.js`
  - `getLockRequirementsForDoor` (both the `doorProperties` path and the scenario fallback) and
    `getLockRequirementsForItem` return `access` and `acceptsUIDOnly`.
  - New exports beside `evaluateRfidCredential`: `hasRfidAccessList(req)`, `heldRfidCardIds()`
    (keycards, then the copier's `saved_cards`, each id once, ids worked out as
    `evaluateRfidCredential` does) and `requestRfidAccessUnlock(lockable, type, cardIds)`, which
    resolves to `unlocked`, `uid_only`, `denied` or `error`. A private `unlockTargetId` is shared
    with `notifyServerUnlock`.
  - The `rfid` branch runs: 1a a held keycard matching `requires` opens directly (unchanged); 1b a
    saved copy matching `requires` opens the reader, which applies the lock's `acceptsUIDOnly`
    (unchanged); 2 on a lock with `access` and at least one held card id, one `/unlock` with
    `card_ids`: opened ("Card accepted"; an object takes the `contents` it gets back), `uid_only`
    ("Reader requires full authentication", `door_unlock_failed` reason `uid_only`), any other
    refusal ("Access denied", reason `wrong_card`), no answer ("Failed to verify access", no
    event); 3 today's flow (empty copier refusal, the reader, "Requires RFID keycard"). Both
    refusals append the lock's `lockedHint`.
- `systems/interactions.js`: the held-keycard click passes `cloneSource: { object_id }` (the
  keycard's scenario `id`; none when it has no id).
- `minigames/helpers/chat-helpers.js`: `clone_keycard` passes `cloneSource: { npc_id }` (the
  conversation's NPC).
- `minigames/rfid/rfid-minigame.js`: `cloneSource` from the params; `recordCloneOnServer(cardData)`,
  called in `handleSaveCard` once `saveCardToCloner` reports success (a new card or an update),
  sends the source and the saved `card_id`, only in clone mode and only with a source and a
  `card_id`. A failure is logged, never shown; the save stands.
- `scripts/validate_scenario.rb` (`check_lock_credentials`): a keycard whose `card_id` is an NPC's
  card that an access lock admits through that NPC's identity is no longer reported as "a
  credential no rfid lock requires" (Ian's spare badge in D3 tripped it).
- `scenarios/test_access_doors/` (new): `scenario.json.erb`, `mission.json` (`test_scenarios`,
  `test_type: access_model`), six ink files (Sam at the front desk holds every task mapping; Dana,
  Ian, Priya, Gary, Imran), `PLAYTEST.md`, dungeon graph. Lobby with Finance north, IT east,
  Security south, Plant west; the visitor room is north of the IT lobby. Every beat room is open
  and every locked room is within two doors of the start. Card copier and visitor card in the
  lobby, a sign per beat, `npcNeedsSeed: "test_access_doors"`, `npcWindupMs: 0`,
  `needsDebugOverlay: true`, one `custom` task per beat completed by Sam's mappings on the beat's
  unlock event (D4: once `cctv_room` has opened and `evidence_store` has refused with `uid_only`,
  in either order, through two globals).

### Tests added

- `test/js/access-rfid-acl.test.mjs` (17), `unlock-system.js` imported for real with its browser
  imports stubbed: both getters return `access` and `acceptsUIDOnly`, and `doors.js` copies them;
  `hasRfidAccessList`; `heldRfidCardIds`; a held card matching `requires` opens with no
  `card_ids`; a saved copy matching `requires` opens the reader with the lock's `acceptsUIDOnly`;
  every held card id in one request on an access lock; a mixed lock with a non-matching card;
  `uid_only` and other refusals (as HTTP 422 and as a body), with `lockedHint`; an unreachable
  server; an `rfid` object with role-only `access` taking its contents; "Requires RFID keycard"
  for a lock without `access`; nothing held at an access lock; a keycard with no id at an
  access-only lock.
- `test/js/rfid-clone-card.test.mjs` (8), `chat-helpers.js`, the keycard click branch,
  `rfid-minigame.js` and `rfid-data.js` run for real: a save from `clone_keycard` calls
  `cloneCard` once with `npc_id`; an update calls it again; a tag naming another card still sends
  the speaker; a held-keycard save calls it once with `object_id`; a keycard with no id sends
  nothing; a failed save (copier full) and unlock mode call nothing; a server error leaves the save
  in place.
- `test/js/validator-access-model.test.mjs` (+1): the `check_lock_credentials` change, and a card
  no access lock admits still reported.
- The existing `rfid-*.test.mjs`, `locked-hint-refusals` and `minigame-launch-routes` tests pass
  unchanged.

### Results

- `bin/test-js`: 399 files, all pass (397 before; 2 added).
- Rails: 1055 runs, 0 failures, 0 errors, 1 skip (no server change in this step; the no-password
  test is in the suite). `test/dummy/db/schema.rb` unchanged.
- `LANG=C.UTF-8 ruby scripts/validate_scenario.rb scenarios/test_access_doors/scenario.json.erb`:
  valid, no dialogue lint findings, geometry and door alignment OK, one expected warning (the
  shared card `PLANT-SHARED-01` at `plant_room`, D5), identity reach lines for the four cards.
  `scripts/check_door_alignment.py`: all OK.
- `bundle exec rails db:seed`: `test_access_doors` seeded (mission 161). The seed's existing
  `test_table_items` error ("Difficulty level is not included in the list") is unrelated.
- Headless smoke on the keyless server (:3001, stopped afterwards; games 5 and 6 deleted): every
  beat passed. D1 refused then opened with the visitor card; D2 sent `card_ids: ["VISITOR-07"]` and
  was refused, then opened door and cabinet after Dana's copy; D3 recorded `IT-IAN-01 from object
  ian_spare_badge` and opened; D4 opened `cctv_room` and refused `evidence_store` with
  `reason: "uid_only"`; D5 opened `plant_room` with Gary's copy. After a reload the copier still
  listed the three copies and the tasks stayed complete. `verify-run.rb --access` showed the
  expected `serverClones`; the leak check found nothing. The Haiku run was not done here.

### Deviations and choices

- **Nothing held at an access lock sends no request.** Step 2 needs at least one held card id;
  with none, the lock falls through to today's refusals ("Requires RFID keycard", or "Access
  denied. No keycard, and nothing saved on the cloner." with an empty copier). The server could
  only refuse an empty list, and an empty `card_ids` risks reaching the server as no `card_ids`,
  which a mixed lock treats as today's trusted claim. D2's "Access denied" before the copy holds
  because the visitor card is sent.
- **An access lock with no `requires` skips step 1**, so a keycard with no `card_id` and no
  `opens_lock` cannot match a missing `requires` through `lockRef` returning nothing.
- **Success toast "Card accepted"** for an access-list unlock (the plan names no text); the server
  does not say which card passed.
- **"Reader requires full authentication" is a toast**, not the minigame screen: an access-list
  lock is decided before any reader screen opens.
- **A network failure is not a refusal**: "Failed to verify access" with no `door_unlock_failed`,
  as `handleUnlock`'s other server checks do.
- **Ink tag source**: `clone_keycard` always sends the conversation's NPC; the server answers
  `recorded: false` for a card that is not theirs (plan 4.2).
- **Validator `check_lock_credentials`** changed (above): the step 4 checks had not taught the old
  "opens nothing" warning about access lists.
- **Scenario layout**: the visitor room is off the IT lobby, not the lobby, because the lobby's four
  sides go to the four NPC beats; it is still two doors from the start.
- **Harness quirk**: `converse` with a named scan choice closes the card copier screen the clone
  tag opens, so the copy is lost. `PLAYTEST.md` drives the choice with `mg chooseIndex` and clicks
  Save through `eval`. Worth fixing in `playtest-session.js` later (treat an RFID clone minigame
  opened by a tag as part of the conversation).

### For the orchestrator: the D1 to D5 run

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
export PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium   # in a container
tools/playtest/start-keyless-server.sh
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_access_doors
tools/playtest/session-start.sh --url <URL> --headless \
  --log <scratch>/test_access_doors-haiku/session-<game_id>.jsonl \
  --capture-responses <scratch>/test_access_doors-haiku/test_access_doors-responses.jsonl
```

Then follow `scenarios/test_access_doors/PLAYTEST.md` (D1 to D4, reload, D5), with
`verify-run.rb <game_id> --access` and `access-leak-check.rb <game_id> <responses>` after each
beat, and `tools/playtest/stop-keyless-server.sh` at the end.

## Step 8: client sign-in, profiles and files, `test_access_signin` (2026-11-09)

### Built

All under `public/break_escape/js/` unless named otherwise.

- `systems/pc-sessions.js` (new): `PcSessions`, a singleton exposed as `window.pcSessions`. The
  only place the client signs in or out and the only source of the sign-in events. It holds the
  sessions (`pcId -> { npcId, username, displayName, via, restored }`, from the server's answers),
  the signed-in set and the open desktops (`registerDesktop(pcId, close)`). Methods: `load`
  (password sessions kept and marked `restored`; a claimed one ends with `POST /logout` and
  `pc_signed_out`), `signIn` (the old session stays until the new password is accepted, then
  `pc_signed_out` for it and `pc_signed_in` for the new one), `signOut` (`POST /logout`,
  `pc_signed_out`, the open desktop closes with "Signed out"), `dropLocal` (a container 403: no
  request, one `pc_signed_out`), `has`, `get`, `list`, `wasSignedIn`, `signedInPcs`,
  `screenShown`, `desktopOpened`. Events, each also as `<name>:<pcId>`: `pc_signed_in`
  `{ pcId, npcId, username, via }`, `pc_signed_out` `{ pcId, npcId }`, `pc_signin_failed`
  `{ pcId, reason, attemptsLeft }`, `pc_signin_shown` `{ pcId, usernames, usernameList }`,
  `pc_desktop_opened` `{ pcId, npcId, via, restored }`.
- `api-client.js`: `login(pcId, fields)`, `logout(pcId)`, `loginAccounts(pcId)`; a failed `GET`
  now carries `err.status` (as `POST` already did), so the sign-in screen can tell an unreachable
  PC from a network failure.
- `core/game.js`: imports `pc-sessions.js` and calls `pcSessions.load(sessions, signedInPcs)` where
  `savedGlobalVariables` is merged.
- `systems/unlock-system.js`: `isLoginPc`, `openLoginPc` (desktop with a session, else the sign-in
  screen), `openLoginDesktop` (`startContainerMinigame(lockable, null, false, true)`) and
  `openLoginSignIn(lockable, { switching })`, which refreshes the tiles from `GET
  /login_accounts`, emits `pc_signin_shown`, and starts the password minigame in sign-in mode
  with no `maxAttempts`. On success it opens the desktop; after Switch user, leaving the screen
  without a new sign-in reopens the desktop of the session that is still there. `handleUnlock`
  sends a sign-in PC there first, before `DISABLE_LOCKS`, so it never reaches `unlockTarget` or
  `/unlock`. `window.openLoginPc` and `window.openLoginSignIn`.
- `systems/interactions.js`: a `lockType: "login"` branch ahead of the workstation call, calling
  `handleUnlock(sprite, 'item')` and returning before the generic flow.
- `minigames/password/password-minigame.js`: sign-in mode (`params.signIn`): the PC's name, a
  "Signed in now" line on Switch user, account tiles (portrait, display name, username), Other
  user, the username field (shown for Other user and `loginPicker: false`), the password field,
  "Sign in", the PC's own `postitNote` with "Add to Notepad", and a message line with the server's
  answer and `attemptsLeft`. No attempt limit of its own and no attempts counter; it stops only on
  a lockout (the message, a "Locked out" toast, then it closes). No letter-case hint. Exported
  helpers: `applyTilePortrait` (portrait, then `avatar`, then initials; a talk sheet shows only
  its top-left frame through `background-size: 200% 200%`), `isTalkSheetSize`, `portraitUrl`,
  `tileInitials`, `signInRefusalMessage`. `getTestState()` has a `signIn` block.
- `minigames/container/container-minigame.js`: a sign-in PC (`loginPcId`) always loads its desktop
  from `container` (it stays locked in room data); a 403 calls `pcSessions.dropLocal`, closes the
  desktop and reopens the sign-in screen. The desktop registers with `pcSessions` and emits
  `pc_desktop_opened`. The header shows "Signed in as <name> (<username>)" with Switch user and
  Sign out above the observations. `sourcePcId` (the PC, or a folder's PC carried on the sprite
  it was opened from) makes a takeable item open the Open / Copy to inventory / Move to inventory /
  Cancel dialog (`transferChoices`: only Open and Cancel once held; `transfer` restricts the
  takes). Open shows a copy of the file with `takeable: false`; Copy keeps the icon; Move removes
  it. `getTestState()` has `signedInAs`, `sourcePcId` and `transferDialog`.
- `systems/inventory.js`: the add sends `source_pc_id` and `transfer` (default `move`) when the
  sprite has a `sourcePcId`, and `item_picked_up` carries `sourcePcId` and `transfer`.
- `systems/objectives-manager.js`: `pc_signed_in` meets an `unlock_object` task on that PC; the
  load-time reconcile also reads `pcSessions.wasSignedIn`.
- `public/break_escape/css/password-minigame.css`, `container-minigame.css`: tiles, the sign-in
  form and message, the account bar and the dialog (a title bar in the PC's window chrome).
- `systems/test-bridge/access.js`, `docs/test-bridge.md`: `sessions()` notes updated (the module
  now exists; it reads `list()`).
- `scripts/validate_scenario.rb`: the objective wiring check no longer warns about an
  `unlock_object` task on a `lockType: "login"` PC (the objectives manager meets it on
  `pc_signed_in`, the server from `signedInPcs`).
- `tools/playtest/lib/access_leak_scanner.rb`: a profile or sign-in PC item inside a folder may sit
  in the top-level `contents` of a `POST /unlock` answer (see deviations).
- `scenarios/test_access_signin/` (new): `scenario.json.erb`, `mission.json` (`test_scenarios`,
  `test_type: access_model`), three ink files (Sam holds every task mapping; Ian; Lena),
  `PLAYTEST.md`, dungeon graph. Lobby with the hot desk room north, the IT office east (finance
  beyond it), the known-people room south and the lockout room west; every room within two doors.
  Accounts: Sam (`staff`), Ian (`it`), Lena (`finance`). Policy `corp_default` (`maxAttempts: 5`,
  no auto lock) on `hot_desk` and `lockout_pc` only. Profiles `staff_desktop` (handbook with the
  archive password, mail) and `ian_files` (two takeable files, a copy-only file, a
  password-locked archive with one file). Sam's password on the hot desk's `postitNote`, Ian's on
  a note in his unlocked desk drawer. Seed `test_access_signin`, `npcWindupMs: 0`,
  `needsDebugOverlay: true`; one task per beat: S3 is the `unlock_object` task on `ian_pc`, the
  rest are `custom` tasks completed by Sam's mappings on `pc_signed_in`, `pc_signin_shown`,
  `item_picked_up`, `item_unlocked`, `pc_signed_out`, `pc_signin_failed` and
  `pc_desktop_opened` (S8: `restored === true`, so only after a reload).

### Tests added

- `test/js/pc-sessions.test.mjs` (9): the module is `window.pcSessions` with `list()`; a password
  sign-in emits one `pc_signed_in` (and one `:<pcId>`) with `npcId` and `via: "password"`;
  refusals (wrong, not permitted, locked out) keep no session and report the reason; no answer
  is an error with no event; Sign out sends `POST /logout`, emits one `pc_signed_out` with
  `npcId` and closes the open desktop with "Signed out"; a container 403 (`dropLocal`) emits one
  `pc_signed_out` and sends nothing; a switch keeps the first session through a wrong password,
  then emits `pc_signed_out` for the first and `pc_signed_in` for the second, in that order; on
  load, password sessions are kept and `restored`, a claimed one ends with `POST /logout`;
  `pc_signin_shown`.
- `test/js/password-signin-mode.test.mjs` (11, real `password-minigame.js` and `base-minigame.js`
  on jsdom): tiles plus Other user, the form per choice, the post-it, no attempts counter;
  `loginPicker: false`; no attempt limit (fourteen refusals, the server's message and
  `attemptsLeft`, still open); it stops only on a lockout; not permitted stays open and no
  letter-case hint shows even when the answer carries `caseMismatch`; a correct password signs in
  through `pcSessions.signIn`; empty fields; the talk-sheet rule and portrait URLs; a talk sheet
  shows its top-left frame and a single image is shown whole; a failed portrait falls back to the
  avatar, then initials; the refusal line.
- `test/js/container-transfer-dialog.test.mjs` (12, real `container-minigame.js`,
  `base-minigame.js` and `pc-sessions.js` on jsdom): `transferChoices`; the desktop loads from
  `container` and shows the account bar above the observations; a takeable file offers Open,
  Copy, Move and Cancel, Copy keeps it listed and sends `sourcePcId` and `transfer: "copy"`, then
  only Open; Move removes it; `"transfer": "copy"` offers no Move; Open shows it without taking
  it; a plain PC desktop keeps today's behaviour; a folder keeps its PC as the source; Sign out;
  Switch user; a container 403 (one `pc_signed_out`, no `POST /logout`, the sign-in screen); the
  `source_pc_id` and `transfer` fields in `inventory.js`.
- `test/js/objectives-signin-pc.test.mjs` (3): `pc_signed_in` completes the `unlock_object` task
  on that PC and no other (not one with no target); the load-time reconcile completes it when
  `wasSignedIn`, and not otherwise.
- `test/js/access-signin-routing.test.mjs` (8, real `unlock-system.js` with stubbed imports): with
  a session the desktop opens with no `/unlock`; without one the sign-in screen opens with the
  refreshed tiles, no `maxAttempts` and the post-it; `loginPicker: false`; `DISABLE_LOCKS` never
  unlocks a sign-in PC; the screen's completion paths (signed in, cancelled switch, plain
  cancel); an unreachable PC; the `interactions.js` branch order; the `api-client.js` calls.
- `test/unit/access_leak_scanner_test.rb` (+1): a profile folder's own `/unlock` answer may
  carry its contents; a top-level profile file or the folder's text elsewhere in an `/unlock`
  answer is still a finding.

### Results

- `bin/test-js`: 404 files, all pass (399 before; 5 added). The existing password, container,
  objectives, rfid and test bridge tests pass unchanged.
- Rails: 1056 runs, 0 failures, 0 errors, 1 skip (1055 before; the scanner test added).
  `test/dummy/db/schema.rb` unchanged. RuboCop clean on the scanner and its test.
- `LANG=C.UTF-8 ruby scripts/validate_scenario.rb scenarios/test_access_signin/scenario.json.erb`:
  valid, ink compiles, no dialogue lint findings, geometry and door alignment OK, schema passed;
  the two expected warnings (`maxAttempts` on `hot_desk` and `lockout_pc`), identity reach lines
  for the three accounts, and the generic suggestions. `scripts/check_door_alignment.py`: all OK.
- `bundle exec rails db:seed`: `test_access_signin` created (mission 162). The seed's existing
  `test_table_items` error is unrelated.
- Headless smoke on the keyless server (:3001, started and stopped here; game 8 deleted), every
  beat in one game: S2 showed only Sam before finance and all three after; S1 answered "Incorrect
  username or password. 4 attempts left." then opened Sam's desktop (handbook and mail only);
  S3 answered "This account can't sign in on this PC." for Sam and opened Ian's desktop, the task
  completing; S4 kept Sam through a wrong password, returned to his desktop on cancel, then
  switched to Ian with Ian's files; S5 offered Copy only for the licence keys, copied the rota
  (still listed, then Open only) and moved the VPN notes; S6 opened the archive and Sign out closed
  the desktop with "Signed out"; S7 counted 4, 3, 2, 1 down to "This account is locked on this
  PC." for Sam (also with his right password) and for an invented username, then Ian signed in;
  after the reload `sessions()` kept both of Ian's sessions, `ian_pc` opened without a password
  showing the rota and not the VPN notes, and all eight tasks were complete. A session ended on
  the server behind the browser's back (a direct `POST /logout`) gave one `pc_signed_out` and the
  sign-in screen on the next click. `verify-run.rb --access` matched each beat's record; the leak
  check over the 94 captured responses found nothing (after the scanner change below). The Haiku
  runs were not done here.

### Deviations and choices

- **Extra events.** Besides `pc_signed_in` and `pc_signed_out`, `pc-sessions.js` emits
  `pc_signin_failed`, `pc_signin_shown` and `pc_desktop_opened`, so every feature-scenario beat
  has an event of its own for its task (S2, S7, S8). `pc_signin_shown` carries `usernameList`, a
  comma-joined string, because mapping conditions support `.includes()` on strings only. Every
  event is emitted under its bare name and as `<name>:<pcId>`, as `door_unlock_failed` is.
- **The claim's reload rule is in `load` already.** Step 9 owns claims, but `load` has to do
  something with a `via: "claim"` entry, and the plan's rule (sign it out with `POST /logout`) is
  three lines; nothing in step 8 creates a claim.
- **"Over the desktop".** The minigame framework runs one minigame at a time, so Switch user
  replaces the desktop with the sign-in screen; leaving the screen without a new sign-in reopens
  the desktop of the session that is still there.
- **A lockout closes the screen** (the plan's "stops"), with the message and a "Locked out" toast.
  Reopening it shows the same answer for that username.
- **Sign out, not Log out**, as the plan's header and S6 name it.
- **The dialog appears only on a sign-in desktop** (and folders opened from one), for every
  takeable item there that is not a locked folder: the server requires `source_pc_id` and
  `transfer` for any take from a sign-in PC. Plain PC desktops in existing missions keep today's
  behaviour. Open shows a copy with `takeable: false`, so the viewer never takes the file; like
  every text file viewer today, closing it returns to the world, not the desktop.
- **Folders.** The sprite a desktop opens a folder from carries `sourcePcId`, so the archive's own
  container sends `source_pc_id` for anything taken from it. No step 8 beat takes a file from the
  archive.
- **`ApiClient.get` errors carry `status`.** A shared change, additive only.
- **Validator objective wiring**: `login` added beside the existing exceptions (the warning
  assumed every lock type reaches `unlockTarget`).
- **Leak scanner and folder unlocks.** Step 3 made `/unlock` answer a profile archive with its
  contents (for a session that admits it), and the step 6 scanner allowed scoped content only in
  `GET /container`, so the smoke run's archive unlock was reported as `profile_content`. The
  scanner now allows an item inside a scoped folder in the top-level `contents` of a `POST
  /unlock` answer; anywhere else in that answer it is still a finding. The answer does not name
  its target, so the scanner cannot check which folder it was for.
- **Scenario details**: the mail app is a read-only `text_file` called "Mail" (no mail client
  object fits a profile); Ian's password note is in an unlocked desk drawer (`filing_cabinet`);
  the hot desk's sticky note shows on its sign-in screen and its desktop. Finance is off the IT
  office so the known-people PC (south of the lobby) is never next to it.

### For the orchestrator: the two S runs

Each run starts with its own new game.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
export PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium   # in a container
tools/playtest/start-keyless-server.sh

# Run A: S1 to S4, then a reload
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_access_signin
tools/playtest/session-start.sh --url <URL> --headless \
  --log <scratch>/test_access_signin-haiku/session-<game_id>.jsonl \
  --capture-responses <scratch>/test_access_signin-haiku/test_access_signin-A-responses.jsonl

# Run B: S5 to S8 (S8 is the reload), on a second new game
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_access_signin
tools/playtest/session-start.sh --url <URL> --headless \
  --log <scratch>/test_access_signin-haiku/session-<game_id>.jsonl \
  --capture-responses <scratch>/test_access_signin-haiku/test_access_signin-B-responses.jsonl
```

Follow `scenarios/test_access_signin/PLAYTEST.md` (Run A, then Run B), with `verify-run.rb
<game_id> --access` and `access-leak-check.rb <game_id> <that run's responses>` after each beat,
then the step 7 run again as the suite, and `tools/playtest/stop-keyless-server.sh` at the end.

## Step 8 playtest fixes (2026-11-09)

The two Haiku runs (Run A game 10, Run B game 9) passed every beat; report in
`scenarios/test_access_signin/reports/2026-11-09_haiku_regression.md`. Their findings were task
mappings that could complete outside their own beat.

### Changed

- `systems/pc-sessions.js`: `pc_signed_in` adds `previousNpcId` (the account signed in at that PC
  just before, so set on a switch, else null) and `firstAtPc` (true when the PC was not yet in the
  signed-in set, which after a reload includes the server's `signedInPcs`). `pc_signed_out` adds
  `reason`: `sign_out` (the Sign out button), `switch` (the first half of a switch), `no_session`
  (a container 403) or `claim_ended` (a claimed session ended on load). All additive.
- `scenarios/test_access_signin/scenario.json.erb`: S1 needs `data.firstAtPc === true` (Sam's
  sign-in at `hot_desk` in S7 had completed it); S4 needs `data.previousNpcId === 'sam'` (Ian's
  plain sign-in at `hot_desk` in Run B's set-up had completed it); S6 needs `data.npcId === 'ian'`
  and `data.reason === 'sign_out'` (a Switch user away from Ian after the archive opened would have
  completed it); S8 also checks `data.npcId === 'ian'`. S2, S3, S5 and S7 already completed only
  from their own beats.
- `PLAYTEST.md`: S8 step 3 opens Ian's kept desktop at `lockout_pc`, so Switch user comes before
  choosing Sam; a reload starts the player in the lobby; `signedInPcs` means "ever signed in at",
  not "signed in now"; which tasks stay open in Run B and why.
- Tests: `pc-sessions.test.mjs` (+1, now 10): a plain sign-in, a sign-in after Sign out and a
  switch give the right `previousNpcId` and `firstAtPc`, also after a load, and each
  `pc_signed_out` its `reason`; the existing event assertions there and in
  `container-transfer-dialog.test.mjs` carry the new fields.

### The interaction menu at `ian_pc` after the reload

Not a duplicate interactable. After a reload the room has one `ian_pc` sprite; the menu listed
"Ian's PC" and "Cup of coffee". The IT office's dressing has a coffee cup (`office-misc-cup`,
a consumable) on the desk 26 px above the PC, and from where `moveToNear` stood the player after
the reload (approaching from the lobby, y 119) both were in reach and within tap slop, so the game
asked which was meant. Before the reload `moveToNear` had already reported the cup as a menu
candidate (`viaMenu: true`), but the player stood further south (y 138) and the click went
straight to the PC. This is the menu working as designed; the harness picks the PC from it.

### Results

- `bin/test-js`: 404 files, all pass.
- Validator: clean apart from the two expected `maxAttempts` warnings.
- `bundle exec rails db:seed`: `test_access_signin` updated (the `test_table_items` error is the
  known unrelated one).
- Headless on :3001 (games 11 and 12, left in place): Ian signing in at `hot_desk` with no one there
  left S4 open; after Sign out, Sam's later sign-in there left S1 open; the switch from Sam to Ian
  completed S4; on a new game Sam's first sign-in through his tile completed S1. The sign-ins on
  game 11 were driven through `window.pcSessions.signIn` (the same path the sign-in screen uses);
  game 12's through the screen. Leak check on both: no leaks found.

## Step 9: unlocked sessions and the workstation rule, `test_access_sessions` (2026-11-09)

### Baseline first

Before any step 9 code changed, `tools/playtest/needs-baseline-capture.js` (new, reusable)
recorded `test_needs_sims`, `test_npc_needs` and `test_needs_leash` headless on :3001 (commit
`dc0c4a52`, the step 8 engine). Each capture loads the scenario's rooms, resets the needs system to
the scenario's seed with the manual clock, then steps it one 250 ms tick per 250 ms of real time
over a fixed span (240 s, 120 s, 180 s), with a `debugKO` of one tracked owner at the desk where
attacks are allowed (Tom at 20 s, the finder at 20 s), and writes the decision log, the needs,
workstation, sign-in and task events and the workstation globals (each with the needs clock),
every workstation's state changes, `onInteract` probes at fixed times, and task order. Outputs and
a README are in `docs/achitechture/access_model_needs_baseline/`.
`tools/playtest/needs-baseline-compare.js` (new) compares two captures by the order of decisions
and events per NPC and per workstation.

### Built

All under `public/break_escape/js/` unless named otherwise.

- `systems/npc-needs.js`: `isAvailable(npcId)` (sprite there; not `ko`, `hostile` or `hidden`),
  which `_tickNpc` now calls after its no-sprite return and `_updateHome`, in place of the inline
  status test; `onTick(fn)`, end-of-tick listeners that survive `reset()` (returns an unsubscribe).
- `systems/workstation-state.js`: `isWorkstation` accepts any `lockType: "login"` object. The live
  env gains `ownerTracked(id)` (`getState` not null), `ownerPresent(id)` (tracked, `atPost`,
  `isAvailable`), `policyFor(data)` (`policies[data.policy || defaultPolicy]`), `clockMs()` and
  `onTick(fn)`. `onInteract`: no owner answers `signin`; present answers `attended`; not present
  with no away record answers `signin` (an env without `ownerPresent` keeps `attended`); otherwise
  `accessed` or `locked` as before. `npc_ko:*` runs a leave for a tracked owner with no away record
  (`onKnockedOut`). `decideLocked` takes the policy: `autoLockMin: 0` locks in the roll. An open
  screen under `autoLockMin` above 0 gets `lockAt` (needs clock at the leave plus the minutes),
  checked at the end of every needs tick and in `onInteract`; at `lockAt` the screen locks, the
  globals are published and `workstation_auto_locked:<id>` `{ objectId, ownerId }` fires. The
  owner's return clears it. `presence(objectId)` returns `{ ownerId, present }`.
  `workstation_owner_left` carries `reason` (`needs` or `ko`).
- `systems/pc-sessions.js`: `claim(pcId)` (`POST /login` with `claim: "owner"` and the two
  workstation globals; `pc_signed_in` with `via: "claim"`; a refusal emits nothing);
  `ownerReturned(pcId)` and `screenAutoLocked(pcId)` end a claimed session (never a password one)
  with `POST /logout`, `pc_signed_out` (`reason` `owner_returned` or `auto_locked`, plus
  `firstAtPc`) and the desktop closing with "<owner's displayName> is back at the desk" or "The
  screen locked"; `listen()` wires them to `workstation_owner_returned:*` and
  `workstation_auto_locked:*` (from `load` and `claim`, idempotent). Each session keeps the
  `firstAtPc` of its sign-in. `inUseShown(pcId, ownerId)` emits `pc_in_use`
  `{ pcId, ownerId, signedInBefore }`. `screenShown` takes a `reason`, added to `pc_signin_shown`.
  The reload rule for claims was already in `load` (step 8).
- `systems/unlock-system.js`: `interactLoginPc(lockable)`, the interaction at a sign-in PC (5.4):
  owner present: the toast "<displayName> is using this PC." plus the resolved observations, and
  `pc_in_use`; a session: the desktop; else `onInteract`, where `accessed` claims (desktop, or the
  sign-in screen on a refusal) and anything else opens the sign-in screen. `openLoginSignIn` takes
  `reason` (`switch` on Switch user). `window.interactLoginPc`.
- `systems/interactions.js`: the `lockType: "login"` branch calls `window.interactLoginPc` (falls
  back to `handleUnlock` when it is missing). Plain workstations keep the generic flow.
- `systems/test-bridge/log.js`: the event log keeps `pc_*` and `workstation_*` events, so `drain`
  shows them (`docs/test-bridge.md` updated).
- `docs/achitechture/ACCESS_MODEL_PLAN.md`: section 5.3's event list now gives every field
  `pc-sessions.js` carries (`previousNpcId`, `firstAtPc`, `reason` and its values, and the other
  sign-in events); 5.4 documents `reason` on `workstation_owner_left`.
  `docs/achitechture/NPC_NEEDS_SYSTEM.md` notes `isAvailable` and `onTick`.
- `scenarios/test_access_sessions/` (new): `scenario.json.erb`, `mission.json` (`test_scenarios`,
  `test_type: access_model`), four ink files (Rob at the front desk holds every task mapping; a
  shared owner ink; Mei's, whose choice sets `mei_hidden`, which her own mapping turns into
  `setVisible: false`; Tom's, whose choice sets `tom_removed` and runs `#remove_npc`),
  `PLAYTEST.md`, dungeon graph. Lobby with Dana north (Omar beyond), Ian east (Kai beyond), Priya
  south (Mei beyond) and the hot desk west (Tom beyond); every beat room within two doors. Seven
  accounts, all tracked, each owner at the desk of an owned sign-in PC with `observations`, a
  private coffee station in their own room (`needsRooms` leashes them there). Policies
  `corp_default` (`autoLockMin: 5`) on `omar_pc` and `instant_lock` (`autoLockMin: 0`) on
  `priya_pc`, no `defaultPolicy`, no `maxAttempts`. Profiles `staff_desktop` and `dana_files`
  (a takeable forecast). Seed `test_access_sessions`, `npcWindupMs: 0`, `needsDebugOverlay: true`,
  attacks allowed. One custom task per beat; `PLAYTEST.md` has a table of why each mapping fires
  only from its own beat.

### Tests added

- `test/js/workstation-state.test.mjs` (+11): login objects are workstations and an unowned one
  answers `signin` with no event (and a plain unowned one); present `attended`, away open
  `accessed`, away locked `locked` with their events; a tracked owner knocked out at the desk rolls
  once on a plain workstation and on a sign-in PC, `reason: "ko"`, and a second `npc_ko` changes
  neither `leaves` nor the screen; a knock-out while already away; an untracked owner knocked out
  sets no away record and answers `signin`; removed, hidden, hostile, untracked and scripted owners
  answer `signin` with no event; an env without `ownerPresent` keeps today's answers;
  `autoLockMin: 0` locks in the roll (and `decideLocked` with 0, 5 and null); `autoLockMin: 5` locks
  only once the clock passes five minutes, emitting `workstation_auto_locked` once; `onInteract`
  runs the check itself; the owner's return cancels it. The existing tests pass unchanged.
- `test/js/npc-needs.test.mjs` (+4): `isAvailable` false with no sprite and for `ko`, `hostile`,
  `hidden`; with no sprite `_tickNpc` only decays (no `blocked`, no home), and with one it blocks
  exactly when `isAvailable` is false and unblocks after; an `interests`-only NPC is registered;
  `onTick` runs once per tick after the NPCs, unsubscribes, and survives `reset`.
- `test/js/pc-sessions.test.mjs` (+5): a claim sends the globals and emits one `pc_signed_in` with
  `via: "claim"`, a refused one keeps no session and emits nothing; a claim ends on the owner's
  return and on the auto lock (with their messages and `firstAtPc`), a password session on
  neither; the dispatcher wiring (`listen`, idempotent); on load every restored claim is signed out
  with one `pc_signed_out` each; `pc_in_use`.
- `test/js/access-signin-routing.test.mjs` (+4, 1 changed): owner present shows the message with the
  observations and stops, even with a session; a session with the owner away opens the desktop
  without asking the workstation; `accessed` claims, opening the desktop or (refused) the sign-in
  screen; `locked`, `signin`, `attended` and null open the sign-in screen with no claim. The
  interactions.js source test now expects the `interactLoginPc` branch.
- The whole needs suite (`npc-needs*.test.mjs`, `npc-pressing-needs.test.mjs`) and
  `lighting-workstation-indicators.test.mjs` pass unchanged.

### Results

- `bin/test-js`: 404 files, all pass (no new files; tests added to existing ones).
- Rails: 1056 runs, 0 failures, 0 errors, 1 skip. `test/dummy/db/schema.rb` unchanged.
- `LANG=C.UTF-8 ruby scripts/validate_scenario.rb scenarios/test_access_sessions/scenario.json.erb`:
  valid, ink compiles, no dialogue lint findings, objective wiring OK, geometry and door alignment
  OK, schema passed, **no warnings**; needs timing lines, identity reach lines and the generic
  suggestions only.
- `bundle exec rails db:seed`: `test_access_sessions` created (mission 163); the known unrelated
  `test_table_items` error.
- Headless smoke on :3001 (game 17, one game, every beat): T1 toast and task; T2 claim (desktop
  "Signed in as Dana Reyes (dreyes)"), copy, task; T3 "Dana Reyes is back at the desk", task, then
  "is using" again; T4 note read, sign-in screen with Ian away, his password, the desktop stayed
  open over his return, then "is using"; T5 sign-in screen, task; T11 claim on Dana's next leave,
  reload: only `ian_pc` kept, Dana at her desk, Ian's desktop opened with no password once he left
  (`restored`), task. T6 claim, manual clock: open at four minutes, "The screen locked" past five,
  task; T7 `debugKO`, claim, task; after a reload Kai stayed down and `kai_pc` gave the sign-in
  screen; T8, T9, T10 sign-in screens and tasks. All eleven tasks complete; `verify-run.rb
  --access` matched; the leak check over all responses found nothing. Game 17 deleted.
- Needs regression: see "Baseline comparison" below.

### Deviations and choices

- **The sign-in interaction lives in `unlock-system.js`** (`interactLoginPc`), called from the
  `interactions.js` branch through `window.interactLoginPc`, so it can be tested with the existing
  `unlock-system.js` harness and so the tests that stub `unlock-system.js` for `interactions.js`
  keep working. The end messages are made in `pc-sessions.js` and handed to the desktop's
  `close(message)` (the step 8 hook in `container-minigame.js`), which needed no change.
- **The presence message is a toast** ("<owner> is using this PC." then the observations), as other
  refusals are. The harness reports `no-effect-confirmed` for it; `PLAYTEST.md` says to read
  `toasts`.
- **Extra events and fields** so each beat's task fires only from its own beat: `pc_in_use`
  (`signedInBefore`), `reason` on `pc_signin_shown`, `firstAtPc` on the claim-end
  `pc_signed_out`, `reason` on `workstation_owner_left`. All additive; the plan's 5.3 and 5.4
  now document them.
- **`ownerTracked` in the env** beside the plan's `ownerPresent` and `policyFor`, for the knock-out
  rule; an env without it treats the owner as tracked (unit tests). `clockMs` and `onTick` too.
- **An owner with no owner is `signin` in every env**, not only with `ownerPresent` (the plan's
  "unowned result" applies to every workstation; no existing test had an unowned workstation).
- **Omar's station `useSeconds` is 600**, not 900: the schema caps `useSeconds` at 600. Ten
  minutes still keeps him away past the five-minute auto lock.
- **Kai, Mei and Tom have a slow need** (urgent after twelve minutes), not one that leaves within a
  minute: their beats need them at the desk (knocked out, hidden, removed there). The other four
  owners leave about 50 s after their room loads.
- **Dana's, Ian's and Priya's coffee takes 45 s**, not about 30, to give a scripted run time to
  copy a file or sign in while the owner is away.
- **T11's task is Ian's kept desktop opening after the reload** (`pc_desktop_opened`,
  `restored`), not the claim's end: the `claim_ended` sign-out fires while the page loads, before
  the lobby NPC's mappings are certain to be registered. Because an owner at the desk blocks his PC
  even with a session, the run waits for Ian to leave (about 50 s after his room loads) to open it.
- **The needs clock starts per owner when their room loads**, so `PLAYTEST.md` times every wait
  from entering the room.

### Baseline comparison

`docs/achitechture/access_model_needs_baseline/COMPARISON.md`. Every behavioural difference is one
the plan predicts: in `test_npc_needs` and `test_needs_sims` the knocked-out owner now leaves the
screen as rolled (`workstation_owner_left`, the globals, later clicks `accessed`); in
`test_needs_sims` that also completes `spot_open_screen`, whose mapping is on that event.
`test_needs_leash` is unchanged. Flagged and not in the plan's table: the new `reason` field on
`workstation_owner_left` (additive). The first after-capture of `test_needs_sims` also differed in
three NPCs' walks (timeouts and an order); a second capture on the same code
(`test_needs_sims.after2.json`) reversed those, so they are walking variance under load.

### For the orchestrator: the two T runs

Each run starts with its own new game.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
export PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium   # in a container
tools/playtest/start-keyless-server.sh

# Run 1: T1 to T5, then T11 (the reload)
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_access_sessions
tools/playtest/session-start.sh --url <URL> --headless \
  --log <scratch>/test_access_sessions-haiku/session-<game_id>.jsonl \
  --capture-responses <scratch>/test_access_sessions-haiku/test_access_sessions-1-responses.jsonl

# Run 2: T6 to T10, with a reload after T7, on a second new game
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_access_sessions
tools/playtest/session-start.sh --url <URL> --headless \
  --log <scratch>/test_access_sessions-haiku/session-<game_id>.jsonl \
  --capture-responses <scratch>/test_access_sessions-haiku/test_access_sessions-2-responses.jsonl
```

Follow `scenarios/test_access_sessions/PLAYTEST.md` (Run 1, then Run 2), with `verify-run.rb
<game_id> --access` and `access-leak-check.rb <game_id> <that run's responses>` after each beat.
Dana leaves about 50 s after her room loads, so Run 1 goes straight to `dana_room` for T1. Then
the step 7 and step 8 runs again as the suite (the workstation rule now applies to their sign-in
PCs, all unowned, so they should answer as before). The needs regression captures are already in
`docs/achitechture/access_model_needs_baseline/`; to repeat them,
`node tools/playtest/needs-baseline-capture.js --scenario <name> --out <file>` and
`needs-baseline-compare.js`. Stop the server with `tools/playtest/stop-keyless-server.sh` at the
end only if you started it.

## Step 10: `lab_physical_pentest`, the converted Pierce beat (2026-11-09)

### Built

- `scenarios/lab_physical_pentest/scenario.json.erb`:
  - Melanie Pierce (`pierce`) gains `"role": "finance"` and `creds` (`username: "m.pierce"`, the
    password her capture carried). Her `usePayload` keeps only `host` (the loader fills `address`
    and `secret` from `creds`); her `workstation_accessed:staff_pc_2` capture loses its inline
    `secret` and keeps `address`, `host`, the note, `kp_unlocked_screen` and `opt_unlocked`.
  - `staff_pc_2` is `"locked": true, "lockType": "login"`, keeping `workstation`,
    `locksScreenOnLeave: false`, `screenOwner: "pierce"` and its `affordance`. No `contents`.
  - New top-level `accountProfiles.pierce_desktop` (`for: { people: ["pierce"] }`) with one
    `takeable: false` text file, "Saved logins" (`pierce_saved_logins`): the finance portal and
    webmail logins for `m.pierce` on `LW-OPEN-07` with the passwords as dots, then why an unlocked
    session matters, what you do on a real job (screenshot, note the time, stop) and the control
    (Win+L, an auto lock policy as the backstop).
  - `observationVariants`: one variant, the merged lesson for the desktop header; the away and
    locked variants are removed. The base observation stays.
  - Chris's `staff_pc` (keylogger), `usb_target_pc` and every other beat unchanged. No ink changed.
- `scenarios/lab_physical_pentest/PLAYTEST.md` (new): the three beats for the Haiku run (Pierce's
  claim, the keylogger beat, a reload during the claim), each with what should happen and the
  `verify-run.rb --access` record, the earned-secrets table, the expected validator output, and the
  timing and harness notes (from `test_access_sessions/PLAYTEST.md` plus two from this smoke check).
- `scenarios/lab_physical_pentest/dungeon_graph.{html,json,md}`: regenerated (the sign-in node for
  `m.pierce` and Len's card identity).

### Results

- Validator: no errors; the lab's existing warnings only (none from the access model), and two new
  identity reach lines (`cm_records_badge` (len) opens `secure_area`; `m.pierce` signs in at
  `staff_pc_2`). No `lockChance` warning (effective chance 0) and no `maxAttempts` warning.
- `bundle exec rails db:seed`: "UPDATE: Physical Penetration Testing"; the known unrelated
  `test_table_items` error.
- Headless smoke on :3001 (games 24 and 25, both deleted):
  - Beat 1 (game 24): with Melanie at the desk, the toast "Melanie Pierce is using this PC." plus
    the base observation and `pc_in_use`, no workstation event; server no session. After
    `npc_left_post:pierce` the click opened her desktop ("Signed in as Melanie Pierce (m.pierce)",
    the lesson in the header, "Saved logins"); `pc_signed_in` `via: "claim"`, `firstAtPc: true`;
    `se_captures.pierce` (no secret in the globals), `kp_unlocked_screen` true, `opt_unlocked`
    complete; `/capture_secrets` answered for `pierce`; the file read as written; server
    `sessions 1: staff_pc_2 = pierce (claim)`. On her return, `pc_signed_out` `reason:
    "owner_returned"`, server `sessions 0`, `signedInPcs` kept, and a click gave "is using" with
    the base observation.
  - Beat 3 (game 24): a second claim on her next leave, `sync`, reload: browser and server
    sessions empty, `kp_unlocked_screen` and the capture kept, `opt_unlocked` still complete on
    the server, `signedInPcs 1: staff_pc_2`.
  - Beat 2 (game 25, see below): keylogger taken, planted while Chris was at the coffee, his next
    sign-in set `kp_creds_captured`; `plant_kl` and `grab_creds` complete on the server.
  - Leak check over the whole responses file: no leaks found.
- `bin/test-js`: 404 files, all pass. Rails: 1067 runs, 0 failures, 0 errors, 1 skip. Both ran on
  the working tree with the review-round-1 fixes another agent has in progress (files outside this
  step), so they cover those uncommitted changes as they stood.

### Deviations and choices

- **The header lesson's condition is `staff_pc_2_accessed && staff_pc_2_owner_away`**, not
  `staff_pc_2_accessed` alone. Variants resolve first match and the "is using this PC" toast
  resolves them too, so with `_accessed` alone the lesson would replace the base observation under
  "is using" for the rest of the game, against the plan's "base observation kept while she is at
  the desk". The claim happens only while she is away, so the header still shows the lesson on
  every claim (and on a password sign-in while she is away).
- **`roleLabel` and the capture note keep their existing wording** (with their em dashes); only the
  `secret` was removed from that mapping. The new text (lesson, file, comments) has none.
- **Beat 2 ran on a second game by accident.** After the reload, the second `bootstrap` defaulted
  to `resume: "new"` and clicked New Session on the resume overlay, which made game 25. Beat 3's
  checks were all made on game 24 before that; the keylogger beat then played on game 25 from a
  fresh start, which is still the unchanged beat. `PLAYTEST.md` tells the run to bootstrap with
  `"resume":"resume"` after a reload and to check `location.href`.
- **No engine change.**

### For the orchestrator: the Haiku run

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
export PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium   # in a container
tools/playtest/start-keyless-server.sh
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb lab_physical_pentest
tools/playtest/session-start.sh --url <URL> --headless \
  --log <scratch>/lab_physical_pentest-haiku/session-<game_id>.jsonl \
  --capture-responses <scratch>/lab_physical_pentest-haiku/lab_physical_pentest-responses.jsonl
```

Follow `scenarios/lab_physical_pentest/PLAYTEST.md` (beats 1, 2, 3 on one game), with
`verify-run.rb <game_id> --access` and `access-leak-check.rb <game_id> <responses>` after each
beat. Melanie and Chris first leave about two minutes after `open_plan` loads.

## Implementation review round 1: fixes (2026-11-09)

The fixer acted on every finding of `ACCESS_MODEL_CODE_REVIEW_R1.md` (0 blockers, 2 majors, 9
minors): all fixed, none withdrawn or deferred. The table with each outcome and its test is the
review's "Fixer response". Each new test failed on the code before its fix.

Behaviour that changed, for later rounds and runs:

- **Sign-in PCs leave the generic container lookup** (M1): `GET /container` reaches a sign-in PC
  and its folders only through the session branch. The step 3 deviation "`find_container_in_scenario`
  is unchanged" no longer holds.
- **"Held" is a `card_id` on a keycard in the server inventory** (M2), replacing the step 3 deviation
  "held keycard by `ItemIdentity.held_in?`". A copy taken from a held keycard object also needs the
  held item to carry that `card_id`.
- **`/clone_card` takes `held_card: true`** (m2) for a held keycard with no id (an NPC's badge);
  the record's source is `{ held: <card_id> }`. The plan's `/clone_card` row is updated.
- **The validator errors on `access` or `acceptsUIDOnly` on any `doors[]` entry** (m1); the plan's
  validator list is updated. `doors.js` still reads them from an override, which the validator now
  forbids.
- **The server ends claimed sessions when it answers `GET /scenario`** (m5), after putting them in
  the answer, so the client's `claim_ended` sign-out still fires and its `POST /logout` is a no-op.
  The plan's 5.3 note says so.
- **A claim is refused where a session is held** (m7), and **`/logout` resolves the PC by id or
  name** (m8); the plan's route rows are updated.
- Client: a folder from a sign-in desktop closes on the session's end (m3); a claim granted after
  the owner came back ends at once with `owner_returned` and shows the owner's message (m4); an
  access-list unlock waits for a card copy record still in flight (`window.pendingCardCloneRecord`,
  m6).
- Tests: `test/js/access-signin-requests.test.mjs` (new) replaces three source-text tests (m9).

Results: Rails 1067 runs, 0 failures, 0 errors, 1 skip; `bin/test-js` 405 files, all pass; the
leak scanner's tests 11 runs, 0 failures; validator clean (no errors) on the three feature
scenarios and `lab_physical_pentest`. Headless smoke of `test_access_sessions` on :3001 (game 26,
deleted): a claim at `dana_pc`, then a reload ended it on both sides and Dana was at her desk; leak
check clean. The other beats of the T runs were not repeated.

## Implementation review round 2: fixes (2026-11-09)

The fixer acted on m1, m3, m4 and m5 of `ACCESS_MODEL_CODE_REVIEW_R2.md` (0 blockers, 0 majors,
5 minors); m2 (NPC-given keycards and the plan's "held keycard" sentence) awaits the user. The
review's "Fixer response" table has each outcome and its test; each new test failed with its fix
taken out.

Behaviour that changed:

- **`end_claimed_sessions!` takes the row lock for its write** (m1). It still returns, unlocked,
  when no claim is held, so `GET /scenario` stays a plain read for every other game; with a claim,
  `with_lock` reloads the row and the claims are recomputed from it before the save.
- **A claim answered as the screen auto locks ends at once** (m3), with `auto_locked` and "The
  screen locked"; the click then shows that message and the sign-in screen, not the desktop.
- `lab_physical_pentest/PLAYTEST.md` beat 3 checks whether Melanie is away before waiting for her
  next leave (m4).
- The owner-returned routing test now runs the real `PcSessions.claim` (m5).

### The captures check (skipped by the last lab run)

Headless on the keyless server (:3001), game 29 of `lab_physical_pentest`, PLAYTEST.md beat 1:
after Melanie left, a click on `staff_pc_2` opened her desktop by a claim ("Signed in as Melanie
Pierce (m.pierce)", the lesson, "Saved logins"). `se_captures.pierce` then held `m.pierce`,
`LW-OPEN-07` and no secret, and `kp_unlocked_screen` was true. The "Harvested Credentials"
terminal (captures view) listed `m.pierce` with her password. Of the 56 captured responses, her
password was in one only: `GET /capture_secrets` (`{"secrets":{"pierce":...}}`), fetched when the
terminal opened. `access-leak-check.rb` accepted it: `VERDICT: no leaks found`. `verify-run.rb
--access`: `sessions 1: staff_pc_2 = pierce (claim)`, `signedInPcs 1: staff_pc_2`. Game 29 was
deleted afterwards.
