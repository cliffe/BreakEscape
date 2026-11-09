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
