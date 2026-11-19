# D5b: schema, validator, graph, cheat policy, deltas and tests

Second digest. It picks up what `D5_conventions_state_tooling.md` left out (its sections 4 to 7 were marked "not yet read"). It does not repeat the slice plan template, the 9.3b build-log lessons, the AGENTS.md process rules or the delta rule in outline. Pointers are `file:line` in this worktree (`docs/achitechture/` is the spelling of the folder in the repo). Every claim was read in the file unless it is marked UNCONFIRMED or INFERRED. Pointers are to the state of the tree on 2026-11-19.

One stale statement to know about before reading: the outage field is `offWhen` today, not `downIf`. See section 7.1. D5 section 4 also said `validate_network.rb` holds a reserved-field list at lines 15 to 72. That range holds requires only (`scripts/validate_network.rb:8` to `:14`), and no reserved-name list was found (section 8).

## 1. Scenario format rules

### 1.1 What the format docs say

- `docs/achitechture/SCENARIO_FORMAT_REVIEW_ACCESS.md` (198 lines) is a design review of the access, network, office-life and Friendface fields, reviewed at main `6a834437c`. Its verdict: "No format choice forces player_state to grow without bound" (:11). It counts 2 blockers, 7 majors, 8 minors, 4 nits (:17). It says no main mission (m01 to m10) uses these fields (:19).
- Its blockers and majors are the best guide to naming choices a new field must not repeat: B1 ownership spelt about ten ways (:57, :59); B2 outages as two fields with two grammars (:65); M1 screen locking with eight knobs (:72); M2 secrets held back by name-based deny lists (:76).
- Its recommendations (:169 onward, "Recommendations, ranked") are review proposals, not decisions. Several recommended moves are later reflected in the code: the one-owner field (step 8b), the one-outage field (step 8a) and the habits block (step 8c). See section 1.4.
- Its "Who uses what" table (:23 to :34) lists the scenarios that use each field group. Test scenarios use them; no m01 to m10 mission does (:43).
- Caution: this review quotes `game.rb:4663-4667` for the withheld NPC keys, and lists `usbHabit` among the work keys. The code now sits at `app/models/break_escape/game.rb:7332` and `:7336`, and the work list is `workNeeds frustration feed` (no `usbHabit`). The review is older than the code. Treat its line numbers as stale.
- `docs/achitechture/SCENARIO_JSON_FORMAT_AUDIT.md` (355 lines) is a 2025-era audit of two NPC structures (`patrol` under `behavior`, `eventMappings` and `los` at NPC root, :192 to :226). It is not about the access fields. It is useful only for the NPC layout rules.
- Neither doc sets a naming rule for new fields. The naming rules are in the schema file itself (1.3) and in `README_scenario_design.md` (1.2).

### 1.2 Rules in `README_scenario_design.md` (read at the lines D5 cited; not re-read in full)

- Closed blocks: access, network and office-life blocks reject unknown keys with a "did you mean" hint. Elsewhere an unknown key is a warning (`README_scenario_design.md:73`, cited by D5 section 4).
- A key starting with `_` inside a closed block is always allowed and is not checked. A `_comment` under a map (an id map such as `networks`) is an error (`:73`). A note never reaches the browser (`:73`).
- Every new open node must carry exactly one of three marks: an id map (`additionalProperties` schema or `"x-id-map": true`), `"x-free-data": true`, or structure where `_` means a note. `test/unit/scenario_schema_test.rb` enforces this (`:75`, cited by D5; the test file was not opened).
- A field the engine reads must be declared in `scripts/scenario-schema.json` "with a short description naming its reader" (`:77`, cited by D5).
- A template must never set `formatVersion` (`:101`, cited by D5). The server stamps it on create (`app/models/break_escape/game.rb:37`, `before_create :stamp_format_version`).
- The feature index (A1 to A17, N1 to N12) is at `:1004` to `:1044` (cited by D5; the index rows are at `:1019` to `:1040`).

### 1.3 Schema file: how a field is declared (`scripts/scenario-schema.json`, 5,773 lines)

Marker counts in the file: `x-free-data` 19, `x-id-map` 77, `x-ref` 36, `x-serverOnly` 36, `x-servedBy` 15, `x-engineGlobals` 1 (grep count, this session).

Meaning of each marker, from the schema text and the readers in section 1.5:
- `x-free-data: true`: everything under the node is game state or minigame input, never a note. Walkers do not look for `_` keys there. Read by `lib/break_escape/scenario_schema.rb:72`, `:303`, `:349`.
- `x-id-map: true` (or an `additionalProperties` schema): a map whose keys are ids. Read by `scenario_schema.rb:357`.
- `x-ref: "<kind>"`: the value names an id of that kind. Example: `defaultPolicy` at `scripts/scenario-schema.json:280` has `"x-ref": "policy"`. Read by `lib/break_escape/schema_walk.rb:37` and by the reference check at `scripts/validate_scenario.rb:8540` (comment) and `:8667` (`check_references`).
- `x-serverOnly: true`: the field is never sent to the browser. Examples: `networks` (`:317`), `networkLinks` (`:341`), `credentials` (`:281`), and room NPC `creds` (`:4402` area), `awareness` (`:4413`), `workNeeds` (`:4907`), `frustration` (`:4908`), `workarounds` (`:4909`), `feed` (`:4912`). Read by `scripts/validate_secret_leaks.rb:311` to `:328` (the validator's secret-leak check lists every property the schema marks, so that the scan knows what must not appear).
- `x-servedBy`: names the route that serves the field instead (e.g. `"GET /network"`, `"GET /keyring"`, `"GET /capture_secrets"`, `"GET /login_accounts"`). Examples at `:317`, `:341`, `:281`, `:4405`.
- `x-engineGlobals`: one occurrence, not read (UNCONFIRMED purpose; no reader grep done).

Closed-block example, `networks` (`scripts/scenario-schema.json:317` to `:340`): the map is `x-serverOnly` with `x-servedBy` (:318). Each entry is `"type": "object"`, `"additionalProperties": false`, `"patternProperties": { "^_": {} }` (:324), with `name` (required, :336), `offWhen` (:327, the requireGlobal form), `wifi` (:328 to :338, with its own closed shape and `psk`), and `_comment` (:339). Adding a key here means adding a `properties` entry with a `description` that names its reader.

Second example, `policies` (`scripts/scenario-schema.json:261` to `:280`): an `additionalProperties` object, closed, with `_` note pattern, and properties `autoLockMin` (:269), `maxAttempts`, `usb`, `social`, `remote`, `remoteScreen`, `accepts`, `_comment`. Each property's description names its plan section (for example "ACCESS_MODEL_PLAN.md 5.5" at :262).

Outage field, current shape (both occurrences of the word `downIf` in the file are inside description strings, `:327` and `:363`; the field itself is `offWhen`):
- `networks.<id>.offWhen` (`:327`) and `resources.<id>.offWhen` (`:363`) accept a bare global name or a requireGlobal map (`oneOf`, `:327`).
- An object's `offWhen` sits at the object level (`:5510`), not under `affordance` (the description at `:5510` says it was moved from `affordance.offWhen` by step 8a).
- So the answer to D5's open question is: current outage field is `offWhen` (see section 7.1).

### 1.4 Format versions and upgrade steps (`lib/break_escape/format_upgrade.rb`, 525 lines)

- The module is `BreakEscape::FormatUpgrade` (`:15`). `STEPS` is `[STEP_8A, STEP_8B, STEP_8C]` (`:114`). The steps are:
  - `STEP_8A` (`:47`), version 1, `one_outage_field_offWhen`: a network's or resource's `downIf` becomes `offWhen`; an object's `affordance.offWhen` moves up to the object. Retired-key list at `:57` to `:61`.
  - `STEP_8B` (`:76`), version 2, one owner field: `owner` on objects and items, with `private` and `deskPhone` marks; five old owner spellings retired (comment at `:78` onward).
  - `STEP_8C` (`:102`), version 3, `habits_in_one_block`: `screenHabit`, `printHabit`, `usbHabit` fold into `habits.screen`, `habits.print`, `habits.usb` (`HABIT_FOLD` at `:471`).
- `ALIASES = [].freeze` (`:119`): no old key is still accepted as an alias. The comment says none of the deployed scenarios uses a retired key.
- `current` (`:131`) is the last step's version, so the current format is 3 (INFERRED from `:103` and `:131`).
- `version_of` (`:139`) treats an absent `formatVersion` as 0 and refuses anything not a non-negative Integer (`Unreadable`, `:18`).
- `upgrade!` (`:152`) runs every step above the stored version, then stamps the current version. It raises `TooNew` (`:22`) when the stored version is above current.
- Readers: `app/controllers/break_escape/games_controller.rb:326` to `:327` (bootstrap writes `formatVersion` into the filtered copy), `:878` to `:938` (refusal before any other work on sync or load), `:2398` to `:2409`, `:2470` to `:2507` (a row-locked judgement of the stored version). `app/controllers/break_escape/application_controller.rb:62` sets the response header `X-Break-Escape-Format`.
- A development-only test step is appended by `lib/break_escape/engine.rb:26` to `:31` (version 900) when `BREAK_ESCAPE_FORMAT_TEST_STEP=1` is set in development. Not for production.
- Step 7 (empty STEPS) was the mechanism; step 8a is the first rename (from the header comments at `format_upgrade.rb:8` to `:13` and `:24` to `:45`).

### 1.5 What the other lib files do (two or three lines each)

- `lib/break_escape/scenario_schema.rb` (425 lines): the single resolver that decides, for every key in a walked scenario, whether it is a property, an id, free data or undeclared (`classify`, `:319`). Holds `STARTS` (`:32` to `:58`), the list of schema pointers the code may ask for. A pointer not in this list raises (comment at `:27` to `:29`). `ScenarioSchema.load` (`:241`) reads and compiles the file, and `boot_check!` (`:280`) does it at boot when eager loading is on. Rules, in order: property (`:319` onward, rule 1), id (rule 2, a map branch), free data (rule 3), undeclared (rule 4).
- `lib/break_escape/schema_walk.rb` (56 lines): `SchemaWalk.walk` (`:26`) yields `[value, node, path]` for every live value, paired with its schema node. `ref_kind` (`:33`) reads `x-ref`. Used by the reference and id checks in the validator.
- `lib/break_escape/author_notes.rb` (75 lines): `AuthorNotes.note?` (`:18`) decides whether a key is a note by the schema, not by a name list. `each_live` (`:32`) walks only live values. `strip_notes!` (`:57`) removes notes from a payload copy.
- `lib/break_escape/scenario_binding.rb` (119 lines): one ERB binding for every renderer of `scenario.json.erb`. `ScenarioBinding.render` (`:39`), `vm_object` (`:48`), `flags_for_vm` (`:65`), `vm_flags_json` (`:90`). The server, the validator and the graph generator all render through it (header at `:13` to `:19`).
- `lib/break_escape/format_upgrade.rb`: see 1.4.

### 1.6 Where server-only fields are stripped before the browser gets the scenario

Filter for the bootstrap (`GET /scenario`):
- `filtered_scenario_for_bootstrap` in `app/models/break_escape/game.rb:2390` (method starts at `:2390`, returns at `:2508`). It deep-copies `scenario_data` and then:
  - keeps only an allow-list of room fields (`game.rb:2406` copies each room into `kept_fields`; the allow-list is `%w[type connections locked lockType requires ...]` at `:2425`);
  - deletes `flags` (`game.rb:2465`), `acknowledgedClues` (`:2469`), `accountProfiles` (`:2474`), `roles` (`:2478`), `credentials` (`:2483`);
  - calls `withhold_network_keys!` (`game.rb:2488`, defined in `app/models/break_escape/network_access.rb:23`; keys `networks`, `networkLinks`, `resources` at `network_access.rb:18`; object fields `network`, `linkName`, `linkStoreIn` at `:21`);
  - calls `withhold_feed_facts!` (`game.rb:2491`, defined at `app/models/break_escape/social_feed.rb:306`);
  - calls `strip_capture_secrets!` (`game.rb:2500`, defined at `game.rb:7158`), which removes `secret` from each key in `CAPTURE_SECRET_KEYS` (`game.rb:7152`: `capture`, `addCapture`, `usePayload`);
  - calls `BreakEscape::DeclaredGrants.strip_all_grant_contents!` (`game.rb:2505`; defined at `lib/break_escape/declared_grants.rb:87`).
- Room NPC withholding: `withhold_npc_secrets!` (`game.rb:7372`) deletes `WITHHELD_NPC_KEYS` (`game.rb:7332`, `%w[creds awareness role workarounds]`) and `WITHHELD_WORK_NPC_KEYS` (`game.rb:7336`, `%w[workNeeds frustration feed]`). Comment at `:7325` to `:7331` gives the rule (access model 5.6).
- The controller re-filters on the way out: `app/controllers/break_escape/games_controller.rb:316` (`filter_requires_recursive(filtered)`), and the `savedX` blocks it attaches at `:353` to `:437` (section 5).
- `x-serverOnly` and `filtered` are not read by a single generic filter. The filters are named per field, as above. Whether a generic filter reading the schema flag exists is UNCONFIRMED: `grep` found `x-serverOnly` read only in `scripts/validate_secret_leaks.rb:311` to `:328`.
- Two grep hits for "strip"/"withhold" in `app/` that the brief named: `lib/break_escape/author_notes.rb:57` (`strip_notes!`) and `app/models/break_escape/game.rb:5429` (`strip_objective_notes`).

## 2. Validator

### 2.1 Entry point and output

- `scripts/validate_scenario.rb` (9,138 lines). `main` (`:8424`) parses options, including `--no-graph` (`:8454`), `--skip-ink` (`:8458`), `--no-known-failures` (`:8474`) and `--campaign` (`:8478`). The default known-failures path is `scripts/validator_known_failures.json` (`:8433`).
- A `ValidatorReport` (`scripts/validator_report.rb:21`) wraps stdout (`:8515`). The body is `run_validation` (`:8757`). It never exits; `ValidatorReport#finish` (`validator_report.rb:149`) returns the exit code. Exit 1 when any error line is not covered by a known-failures entry (`:149` to `:177`, `unlisted.positive? ? 1 : 0`).
- Stages are `ink schema common habits work social` (`validator_report.rb:22`). Each check runs inside `report.run_check(stage, name)` (`:67`), so a raise becomes a "validator raised" note rather than a crash.
- Line classes (`validator_report.rb:1` to `:19` header, `:23` to `:28` regexes): a line starting with `❌` (after indent or a list number) is an error (`ERROR_RE`, `:25`); a line starting with `⚠️` is a warning (`WARNING_RE`, `:28`); `ℹ️ acknowledged clue:` is counted separately. Headers printed with `header` are never counted (`:137`). A `❌` later in a line is author content and is not counted.
- Summary line: `Result: <n> errors (<k> known), <m> warnings[, N acknowledged clues]` (`validator_report.rb:166` to `:167`). Stale known-failure entries print as `❌ ERROR: stale known failure ...` (`:155` to `:160`).

### 2.2 Order of checks in `run_validation` (`validate_scenario.rb:8757`)

In order, with the stage each reports under:
1. Directory structure, `check_scenario_directory_structure` (`:8771`). Item types loaded (`:8782`), render (`:8797`), carry-over globals (`:8805`).
2. Structure, `check_structure_validity` and `check_duplicate_show_scenario_brief` (`:8816`, stage `schema`).
3. Unknown fields, `check_unknown_fields` (`:8831`, stage `common`). Desktop users (`:8842`). Author notes that hold an action (`:8847`, `check_notes_hold_no_actions`, defined `:689`).
4. Ink, `check_ink_files` (`:8865`, stage `ink`) unless `--skip-ink` (`:8858` to `:8861`). Dialogue lint (`:8878`).
5. Objectives wiring, `check_objectives_wiring` (`:8885`). Mission scoring, result and ending (`:8892` to `:8895`).
6. Room geometry (`check_room_geometry`, `:8904`) and door alignment (`check_door_alignment`, `:8906`).
7. JSON schema validation, `validate_json` (`:8933`, stage `schema`).
8. The common block (`:8940` to `:8987`), each through `run.call`: `check_common_issues` (`:8941`), `check_references` (`:8942`), `check_room_types`, `check_lock_credentials`, `check_pin_locks`, `check_combination_cryptex_locks`, `check_dispenses_containers`, `check_npc_held_containers`, `check_npc_patrol_and_catch_locks`, `check_give_item_collectible`, `check_interaction_warnings`, `check_revoke_card_globals`, `check_engine_limits`, `check_vm_flags_load_bearing`, `check_recurring_bugs` (`:8955`), `check_retired_keys` (`:8956`), `check_owner_fields` (`:8957`), `check_wall_mounted`, `check_unheard_room_triggers`.
9. Access and network block, `:8960` to `:8987`: `NpcHabits.expanded_copy` (`:8961`), `ValidateNpcNeeds.check` (`:8966`), `ValidateAccessWork.check` (`:8967`), `ValidateOfficeLife.check` (`:8969`), `ValidateNpcHabits.check` (`:8972`). The `run.call` list also has `check_access_model` (`:8967` per `grep`; the grep showed the call at that line), `check_credentials`, `check_gated_door_credit`, `check_speaker_id_name_clashes`, `check_network_model` (`:8971`), `check_capture_log` (`:8972`), `check_secret_leaks` (`:8973`), `check_wearables`, `check_plant_hiding`, `check_phone_calls`, `check_tooling_pass4c`, `check_carry_over` (`:8985`).

  Note: the line numbers in this block come from one grep and were not each opened. The `ValidateAccessWork` and `check_access_model` numbers may be off by one or two lines. The block order is INFERRED from the sequence in the file.
10. ValidateSocial (`:8991`, stage `social`), then `check_recommended_fields` (`:9013`, warnings).
11. Habits report (`:9047`, stage `habits`), work report `ValidateAccessWork.report_lines` (`:9057`, stage `work`), office-life sync budget and summary (`:9065`, `:9071`).
12. Dungeon graph (`:9091` to `:9109`): runs `ruby scripts/generate_dungeon_graph.rb <erb>` with `DUNGEON_GRAPH_TEST_NO_SCRUB` unset (`:9094`). Exit status 3 means a Wi-Fi key reached an output and the old graph files were deleted (`:9100` to `:9106`). Any other failure is an error line.
13. `--strict-social` no longer changes the exit code (`:9112`).

Where each access-model file plugs in:
- `check_access_model` is defined inline at `validate_scenario.rb:7642`.
- `check_network_model` is defined in `scripts/validate_network.rb:43`. It requires `lib/break_escape/network_model`, `access_identities`, `access_work`, `capture_model`, `declared_grants`, `author_notes` and `npc_habits/clues` (`validate_network.rb:8` to `:14`).
- `ValidateAccessWork` is `scripts/validate_access_work.rb:16` (module). `ValidateOfficeLife` is `scripts/validate_office_life.rb:29`. `ValidateNpcNeeds` is `scripts/validate_npc_needs.rb:12`. `ValidateNpcHabits` is `scripts/validate_npc_habits.rb:20`. `ValidateSocial` is `scripts/validate_social.rb:20`. `ValidatePhoneCalls` is `scripts/validate_phone_calls.rb:16`.
- Module-less functions: `check_capture_log` (`validate_capture_log.rb:15`), `check_wearables` (`validate_wearable.rb:44`), `check_plant_hiding` (`validate_plant_hiding.rb:47`), `check_secret_leaks` (`validate_secret_leaks.rb:817`), `check_phone_calls` (`validate_phone_calls.rb:739`).
- The plan's pattern for a new check file (D5, from `ACCESS_MODEL_SLICE_9_3B_PLAN.md:652-670`): a module with its own error, warning and info lines, plus a hook in `validate_scenario.rb`. The hook list is `run.call` at `:8940` to `:8987`.

### 2.3 Known failures (`scripts/validator_known_failures.json`, 68 lines)

- Purpose: lists `❌` lines another track owns, so the run can pass while they stay open. An entry does not fix anything.
- Fields per entry: `scenario`, `stage`, `match` (substring), `count` (how many lines it may cover), `owner`, `added`, `reviewBy`, `approved`, `note` (`scripts/validator_known_failures.json:2` to `:12` for the first entry).
- Six entries today: four `missing required 'keyPins' array` (common stage) for `biometric_breach` (`:3`), `crypto1_captain_meow` (`:14`), `crypto2_rsa_asymmetric` (`:25`), `crypto3_aes_symmetric` (`:36`); and two for `ceo_exfil` (`:47` ink stage, match `in itemsHeld. Add {`; `:58` common stage, match `is a phone NPC event mapping with 'targetKnot'`). All owned by `escape-room track` (for the four keyPins entries) and dated 2026-11-12 (`added`).
- Matching (`validator_report.rb:233` onward): same scenario path, same stage, substring `match`, under `count`. Lines containing `could not run`, `stale known failure` or `Result:` never match (`:23`, `UNMATCHABLE`). An ink compile failure never matches (`:27`, `INK_COMPILE_FAILURE_RE`).
- Governance: each `approved` value must name a dated heading in `docs/agents/VALIDATOR_DECISIONS.md` (file exists in this worktree). `test/js/validator-known-failures.test.mjs` checks that every `approved` string is a heading there and that the JSON block restates the entry (`:3`, `:18`, `:77` to `:78`). Adding or raising an entry needs a sign-off in that file (per D5 section 7, from `README_scenario_design.md:66`; not re-read).

## 3. Dungeon graph (`scripts/generate_dungeon_graph.rb`, 2,415 lines)

Partly read. What was read:
- Helpers: `add_node(id, label, klass, optional:)` (`:77`) and `add_edge(from, to, dashed:, label:, undirected:)` (`:82`). A dashed, undirected edge is how a `link` is drawn (per `docs/ACCESS_AND_NETWORKS.md:1189`, not verified in code).
- Access locks are drawn through `access_lock_node({ kind: 'login', lock:, room: }, rooms)` (calls at `:423`, `:775`, `:802`, `:1047`, `:1070`, `:1139`). Kind `login` is the sign-in lock.
- Graph events: `game_loaded` is special-cased at `:1471` ("a reload backstop re-applies a gate; it doesn't open it").
- Network drawing: `ACCESS_AND_NETWORKS.md:721` says it is built at `scripts/generate_dungeon_graph.rb:528-760` and reads `NetworkModel`. Not verified in the code by this digest (UNCONFIRMED).
- The plan (`ACCESS_MODEL_SLICE_9_3B_PLAN.md:717-724`) says the graph gains network link, pivot, Wi-Fi and implant nodes, and D5 section 2 records that section 9.3 was never built in the logs. Whether that is still true was not checked (UNCONFIRMED).
- Where a new node kind goes: `add_node` (`:77`) is the one constructor; edges via `add_edge` (`:82`). The main sweep, where each feature's nodes are added, was not read (UNCONFIRMED line ranges for network, link, outage, Wi-Fi and implant nodes).
- The validator regenerates the graph on every run unless `--no-graph` (`validate_scenario.rb:9091`, and AGENTS.md:245 per D5).

## 4. Cheat resistance (written policy)

- No standalone written policy was found. `grep -i cheat` over `README_scenario_design.md`, `AGENTS.md` and `docs/` returns only plan and review files. The rule is quoted in plans as "the cheat policy (user)".
- The rule, as the plans state it:
  - `docs/achitechture/SYNC_DELTAS_PLAN.md:33` to `:35`: "the server hard-enforces secrets, keys and forged items. Steps whose verdict is computed in the browser (a phish landing, an NPC using a planted device) stay best effort, with a real server sanity check, and the check must never block the intended route."
  - `docs/achitechture/FRIENDFACE_REACTIONS_PLAN.md:580` to `:581`: same wording.
  - `docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md:53` to `:59`: "A step that must not be skipped ends in something the server checks"; "Anything the browser merely claims (a global, a capture entry) can pace a puzzle ... and can never be the only thing between the player and a secret."
  - `docs/achitechture/SYNC_DELTAS_PLAN.md` has a "Cheat policy" subsection per change: `:417` (3.6), `:584` (4.5), `:742` (5.5), `:1290` (6.6), `:1523` (7.4).
- A worked list of the split is at `docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md:489` ("Hard-enforced (the client cannot fake these)") and `:508` ("Best-effort (client side, by design)"). The hard-enforced table names, for example, the keypad code checked by `requires` (`game.rb:7088`), the Wi-Fi key compared on join (`network_access.rb:23`, `:371` to `:374`), and unplug ending sessions server-side (`network_access.rb:290` to `:321`).
- Repository note: `NPC_CARRIED_ITEMS_PLAN.md:304` and `PLANT_HIDING_PLAN.md:155` say "the cheat-resistance rule in AGENTS.md". `AGENTS.md` in this worktree contains no such rule (grep for "cheat" returns no lines). Stale reference, or the rule lives elsewhere (UNCONFIRMED where it lives).
- Outage globals are client-writable in the plan's own model: a soft gate (`ACCESS_MODEL_SLICE_9_3B_BUILD_LOG.md:715` to `:724`, cited by D5).
- `IDEAS_BACKLOG.md:247` to `:266` lists client-trust gaps accepted as best effort "under q78".

## 5. Player state deltas (`docs/achitechture/SYNC_DELTAS_PLAN.md`, 1,804 lines)

- Opening: rule at `:12` to `:17`; problems P1, P2, R1, R2, R3 at `:21` to `:26` (table); cheat policy at `:33` to `:35`.
- Sections: `## 0` (`:12`), `## 1` summary and effort table (`:42`), `## 2` shared groundwork: order-independent comparison (`:56`), sync parts and tracked requests (`:234`), items in answers (`:262`), one locked bootstrap step (`:268`), pre-parse body caps (`:292`). Then `## 3` R1 seed (`:301`), `## 4` P2 inventory deltas (`:497`), `## 5` P1 cloner saved cards (`:602`), `## 6` R2 server-owned capture record (`:785`), `## 7` R3 capture-log seen rows (`:1500`), `## 8` growth table (`:1534`), `## 9` build order (`:1550`), `## 10` shared tests and live proof (`:1614`), `## 11` "How to keep state deltas" (`:1750`), `## 12` open points (`:1784`).
- Section 8 table (`:1536` to `:1547`): each state, its bound, what is sent up and down. Example: saved room `player_state.currentRoom`, one string, sent once per load as `savedCurrentRoom`.
- Section 11 (`:1750` to `:1782`) gives nine rules for a new feature that keeps player state:
  1. Decide who owns it. Server-owned if the server reveals, admits or scores with it, otherwise a client global.
  2. One key per thing (`prefix:<id>` or a server record one entry per request).
  3. Bound it by authoring, and say what happens at the cap.
  4. Answers carry what changed, not the whole collection. Whole collections go down once in the bootstrap.
  5. Every delta is safe to repeat: upsert by id, and an `already` answer carries the same delta.
  6. Take fields from the scenario, not from the client.
  7. Write under `with_game_lock` or `with_lock` and re-check after reload.
  8. Measure request sizes in the node test and the live proof.
  9. Check what the student sees, including fallbacks such as `displaySecret`.
- The reference Friendface reactions design under those rules is at `:1780` to `:1782` (a server-owned `feedReactions` map beside `feedRevealed`).

How sections are sent, and where a new section goes:
- Client diff: `public/break_escape/js/state-sync.js`. `KEYED_SECTIONS` at `:43` (`globalVariables`, `npcVisibility`, `npcHostility`, `triggeredEvents`, `npcInkVariables`, `mailState`), `WHOLE_SECTIONS` at `:54` (`commandBoardLog`, `biometricSamples`, `playerHealth`), and the single keys at `:135` and `:157` (`currentRoom`, `scenarioBriefShown`, `timedMessagesKey`, `clockKey`, `clockElapsedMs`). Notes go by id (`:149`).
- Server route: `PUT /sync_state` (`config/routes.rb:32`). `GamesController#sync_state` (`app/controllers/break_escape/games_controller.rb:867`) loads `SYNC_STATE_COLUMNS` (`:2442`, `%i[id player_type player_id player_state updated_at]`) under a row lock (`:875`).
- Server-side section lists for the ring (the sync writer): `RING_KEYED_SECTIONS` (`games_controller.rb:2463`) and `RING_WHOLE_SECTIONS` (`:2468`).
- Saved games and reloads: the bootstrap `GET /scenario` (`games_controller.rb:278` to `:415`) attaches one `saved*` block per section, read from `player_state` (`:353` `savedGlobalVariables`, `:367` `savedCurrentRoom`, `:372` `savedNotes`, `:378` `savedBiometricSamples`, `:384` `savedNpcInkVariables`, `:390` `savedTriggeredEvents`, `:396` `savedTimedMessages`, `:401` `savedScenarioClock`, `:409` `savedCommandBoardLog`, `:414` `savedNpcVisibility`, `:419` `savedNpcHostility`, `:431` `savedPhoneState`, `:437` `savedMailState`). R1 seeds the client's `confirmed` from these (plan `:301` to `:375`).
- A new section: add its name to the bootstrap `saved*` list, to the client's KEYED or WHOLE list, and to the server's merge list. Whether the server merge and bootstrap lists can drift is not checked here (UNCONFIRMED).
- Access records (footholds, sessions, seCaptures) are not sync sections. The server writes them through its own routes (`PLAYER_STATE_SYNC_AUDIT.md:41` to `:44`, D5). `player_state['seCaptures']` is server-owned, per the comment in `app/models/break_escape/game.rb` just after `reveal_capture_secret?` (around `:2511` to `:2530`; line numbers approximate).
- Saved games from before a slice read new fields as empty (`ACCESS_MODEL_SLICE_9_3B_PLAN.md:629` to `:633`, D5).
- The format version check (section 1.4) runs before any sync (`games_controller.rb:2470` to `:2507`).

## 6. Tests and playtest harness

- Matrix: `docs/achitechture/NEW_FEATURES_TEST_MATRIX.md` (255 lines) is an audit dated 2026-11-05 for the features built for `lab_physical_pentest`. Columns: unit tests, focused test scenario, live browser proof, docs/schema/validator (`:1` to `:12` header and summary table). Its `bin/test-js` result: 371 files passed, 0 failed (`:3`). It says the Rails suite and the browser were not run.
- Controller tests: `test/controllers/break_escape/` has, among others, `access_devices_rogue_ap_test.rb`, `access_model_login_test.rb`, `access_model_no_password_test.rb`, `access_model_rfid_test.rb`, `access_model_desktop_test.rb`, `network_footholds_test.rb`, `network_host_service_off_test.rb`, `lab_physical_pentest_network_test.rb`, `demo_access_tour_test.rb`. Three contents were not opened, so their assertions are UNCONFIRMED. Names only, from `ls`.
- Node tests: `test/js/*.test.mjs`. D5 section 7 lists `validator-network-model.test.mjs`, `network-links.test.mjs`, `network-view.test.mjs`, `password-join-mode.test.mjs`, `grant-foothold-action.test.mjs` (from the logs, not opened here). `validator-known-failures.test.mjs` is confirmed (section 2.3).
- `bin/test-js`: the harness. Line 17 warns that a copied module tree can be imported from the wrong place. The copy-list rule (a new static import needs the file added to each harness copy list) comes from the memory note `js-test-harness-copy-list`, not from the repo. The copy lists were not located in this pass (UNCONFIRMED where they are).
- Scripted playtests: `scenarios/test_access_*` (nine folders at this worktree: `test_access_devices`, `test_access_doors`, `test_access_habits`, `test_access_keyring`, `test_access_networks`, `test_access_sessions`, `test_access_signin`, `test_access_social`, `test_access_work`). Structure of `scenarios/test_access_networks/PLAYTEST.md`:
  - title and scope line (`:1`);
  - `## Which runs need which step` (`:13`);
  - `## Setup (each run)` (`:25`);
  - `## Harness notes for this scenario` (`:54`);
  - `## Run 0 (step 7)` (`:93`);
  - `## The beats (P1 to P12; Runs A to C with step 8)` (`:128`), then one `### Pn` subsection per beat from `:137` (P1) to `:259` (P11) and onward.
- `tools/playtest/lib/access_leak_scanner.rb` (1,816 lines). Class constructor at `:174` takes `scenario_data`, `served_npcs:`, `game:`. `scan(lines)` (`:297`) scans captured response text; `report_lines` (`:340`); `redact` (`:349`). Collectors of known secrets: `collect_workarounds` (`:405`), `collect_passwords` (`:420`), `collect_capture_secrets` (`:441`), `collect_network_secrets` (`:494`), `collect_wifi_secrets` (`:521`), `collect_items` (`:475`). Scan verdict line is `VERDICT: no leaks found` in the build logs (D5 section 7). What it asserts, as a list, is the union of these collectors: every secret value they collect must not appear in any served response. Full assertion logic was not read (partial).
- Keyless servers: `AGENTS.md:187` says draft playtests use the keyless server on `:3001`, with `PLAYTEST_PORT=3001` and `tools/playtest/start-keyless-serv...` (the script name is cut off in the grep; UNCONFIRMED full name). `AGENTS.md:238` says the main tree, every worktree and the `:3000`, `:3001` and `:3002` servers share Postgres `break_escape_development`, and that `db:create`, `db:schema:load`, `db:migrate`, `db:reset`, `db:drop` and `db:setup` need the user's say-so. The memory note on `:3002` (wiped all games 2026-10-30) is not in the repo.

## 7. The two facts to settle

### 7.1 Outage field: `offWhen` or `downIf`?

Answer: `offWhen`. Verified:
- `scripts/scenario-schema.json:327` (networks) and `:363` (resources) have `"offWhen"`, with description "Format 1 (hardening step 8a; was downIf)". The only other `downIf` text in the schema is inside these descriptions (grep count 2).
- An object's `offWhen` is at `:5510`, described as "Format 1 (hardening step 8a; was affordance.offWhen)".
- The upgrade that renames `downIf` to `offWhen` is `STEP_8A` (`lib/break_escape/format_upgrade.rb:47` to `:74`, retired keys at `:57` to `:61`).
- `docs/ACCESS_AND_NETWORKS.md:60` (feature N7) and `:1034` of `README_scenario_design.md` use `offWhen` too.
- Stale: `ACCESS_MODEL_SLICE_9_3B_PLAN.md:182` and `:652` to `:653` still say `downIf` (D5 section 4). `SCENARIO_FORMAT_REVIEW_ACCESS.md` (:45, :65) describes the pre-8a state.
- `scripts/validate_network.rb` and the reader code for `offWhen` were not grepped in this pass.

### 7.2 `docs/ACCESS_AND_NETWORKS.md`

Exists, in `docs/` (not `docs/achitechture/`). Its feature index (`:32` section, rows `:36` to `:65`) lists A1 to A17 (with A10b at `:46`) and N1 to N12. Section headings confirm the set: `### A1` (`:71`) to `### A17` (`:682`), and `### N1` (`:726`) to `### N12` (`:1149`). Coverage matrix at `:2020`, "Not built" at `:2057`. Note: the feature index lists A10b, so the count is 18 access rows including A10b; the brief's "A1 to A17" is correct for the named set.

## 8. Unconfirmed or not read

- Not read: the body of `scripts/generate_dungeon_graph.rb` (network, link, outage, Wi-Fi and implant node drawing), the bodies of `scripts/validate_network.rb` and `validate_access_work.rb`, `tools/playtest/` runner and `new-game.rb`/`session-start.sh` argument formats, the `bin/test-js` copy-list locations, `SYNC_DELTAS_BUILD_LOG.md` (1,556 lines), `SYNC_DELTAS_PLAN.md` sections 3 to 7 in detail.
- Unconfirmed: whether a generic reader for `x-serverOnly` exists beyond `validate_secret_leaks.rb:311` to `:328`.
- Unconfirmed: the `validate_network.rb` "reserved field" list D5 cited at `:15` to `:72`. Not found in that range.
- Unconfirmed: the `cheat-resistance rule in AGENTS.md` cited by two plans. Not present in this worktree's `AGENTS.md`.
- Inferred, not read: the order of the access block in `run_validation` (section 2.2, step 9).
- Partial: `docs/achitechture/SCENARIO_FORMAT_REVIEW_ACCESS.md` is a review at main `6a834437c`, and several line numbers it gives are stale (section 1.1).
