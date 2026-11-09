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
