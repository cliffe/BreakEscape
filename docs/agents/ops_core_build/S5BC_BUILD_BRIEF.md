# S5b and S5c build brief: cached accounts, account kinds, and two owner rulings

Worktree `/data/be-ops-logs`, branch `ops-priv2` (cut from `main`, which holds S5a, S6, S7 and S8a). Plan: `docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md` ("PRIV"; its line numbers into code are stale, see section 3). Standing rules: `docs/agents/OPS_CORE_BUILD_BRIEF.md`, with the worktree above in place of the one it names. Earlier briefs: `S5A_BUILD_BRIEF.md`, `S7_BUILD_BRIEF.md`. Feature ids on landing: A19 (S5b), A20 (S5c).

Every unit is tagged **[S5b]**, **[S5c]**, **[A]** (ruling A) or **[B]** (ruling B). S5b, A and B can land without any [S5c] unit: see section 5, "Landing S5b alone".

Every unit re-finds its anchors by name (grep), never by the line numbers given here.

## 1. What this adds, in play

- **S5b.** A sign-in PC remembers some accounts that have signed in on it. A player holding an admin session there presses "Cached accounts" on the desktop and collects them. Each arrives as a hash record in the capture log's sign-ins list, never as a password; the S7 cracker turns it into a password if the player has learned the right facts. One account is cached only after its holder has borrowed the hot desk.
- **S5c.** An account may be local (it exists only on named PCs) or belong to a domain (it works on every PC in that domain). Some accounts have no person behind them. One shared local administrator opens every PC it is on once cracked; a PC with its own local administrator does not fall with the others.
- **Ruling A.** A governed USB port can say which PC it belongs to. An admin session at that PC lets a storage stick be planted that the policy would refuse.
- **Ruling B.** A relayed session (an assist invite) has the rights of the relayed account: admin if that account is an administrator at that PC, user otherwise. The relay itself never raises a level.

## 2. Constraints, in plain words

1. This is a game abstraction. No exploit content, no real credential-dumping tool names, no real commands, no real hash material. Words to use: "cached accounts", "collect", "hash". The token of a hash row is S7's made-up token. Real tool ids live only in `config/break_escape/realism_catalog/*.json` (append-only ids); this stage adds none.
2. The server decides every grant. The client never decides a level, never sees a password in a collect answer, and never sees the lists in section 4.6.
3. No runtime LLMs.
4. New `eventMappings` in a scenario go last; run `ruby tools/check_mapping_index_drift.rb`.
5. Existing scenarios do not change: `bin/ops-golden-compare` after every engine edit, **never under flock** (it takes the lock itself). Campaign missions (m01 to m10, sis*) are not edited.
6. Shared dev database: never `db:create`, `db:schema:load`, `db:migrate`, `db:reset`, `db:drop`, `db:setup`, `db:seed`. **This stage needs no migration** (two new keys inside the `player_state` JSON). A builder who thinks one is needed stops and reports.
7. Tests: `flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <files>`; never `ruby -Itest`; node tests with `node test/js/<file>`.
8. Never edit `.claude/skills/`. Do not depend on the planned recorder change. UK English, plain words.
9. No test may prepend to, alias or redefine a method on an application class, or replace a global (timers included), without restoring it in `ensure` (`finally` in node).
10. Git: commit only your unit's files, by explicit path, plain message, no attribution lines; no stash, reset, rebase or push.
11. **Merges are "keep both".** S8b and S8c are being built on other branches and touch `game.rb`, `games_controller.rb`, the schema, the validator, the scanner and `test/support/ops_unchanged_cases.rb`. Put this stage's code in new files where this brief says so; in shared files add a separate method or a separate block with a `# S5b`, `# S5c`, `# S5 ruling A` or `# S5 ruling B` comment; never reorder or reformat neighbours; add a new key or list entry on its own line.
12. The stage lands only after `main` is merged into `ops-priv2` and the merged tree passes the whole Rails and node suites, the golden compare and the mapping drift check.
13. A new static JS import goes on every test harness copy list that loads the importing file (grep `test/js` for the importer's file name first; 32 tests load `container-minigame.js`).
14. This stage adds **no overlay scene**: the collect panel is a part of the PC desktop (unit 21). The pinned list in `test/js/playtest-shellx-open-wait.test.mjs` stays at 18. A builder who finds a new scene is needed stops and reports, and that unit then owns the list.

## 3. Plan drift found (code as it is on `main` now)

| # | Plan says | Code now | What builders do |
|---|---|---|---|
| D1 | S5b "adds only the `harvested` proof kind" on top of S7 | `scripts/validate_cracking.rb` (hash loop) errors unless a hash proof is `held` or `technique_card`; `credential_proof_holds?` has no branch | Unit 10 widens that one validator rule; unit 09 adds the branch |
| D2 | `validate_privilege.rb` is new | It exists (S5a) and holds "not built yet" errors for `cachedAccounts`, `harvested`, PC `domain`, `accountKind`, `localTo`, `creds.domain`, `accountOnly` | Unit 10 removes the two S5b guards; unit 18 removes the S5c ones. If S5c does not land its guards stay |
| D3 | Refusals `not_admin`, `locked`, `not_reachable` to be added | All three are already in `test/fixtures/files/ops_refusal_codes.json` and `REFUSAL_TEXT` (`ops-model.js`) | Nothing to add; unit 12 uses them |
| D4 | `DEVICE_ACTIONS` list in the policy test | No such constant anywhere | Unit 12 adds `harvest_credentials?` beside `crack?` in `game_policy.rb` and a case in `test/unit/break_escape/policy_test.rb` the way `crack?` is tested |
| D5 | `admin_profiles_at` widens to `pc_present_accounts` | The seam is `admin_present_accounts(pc)` in `game.rb` (owner only) | Unit 08 widens that method; no new name |
| D6 | Two `acl_admits?` definitions must be proved equal before delegation | One body (`AccessIdentities.acl_admits?`); `Game` calls it through the class. Two `pc_admits_account?` bodies remain (`Game#` and `CredentialModel.`) | Unit 17 proves the two `pc_admits_account?` agree on every shipped scenario, then makes `Game#` call `CredentialModel.` |
| D7 | Keyring row is the hash's home | A hash row is listed only in the capture log's sign-ins list (`minigames/capture-log/signin-rows.js`), and `validate_cracking.rb` errors when a scenario has hash records and no holdable capture log | The scenario gives the player a capture log; the collect panel's Crack button and the sign-ins row both call `MinigameFramework.startMinigame('ops-cracker', null, { hashId })` |
| D8 | `lib/break_escape/mfa_sign_in.rb` | It is `app/models/break_escape/mfa_sign_in.rb`; it holds a third `signin_refused` call | Unit 17 checks all three call sites |
| D9 | `signin_refused` takes an optional `kind` detail | The event table (`lib/break_escape/ops_log_events.rb`) gives it no `detail` | Unit 07 adds `detail: { 'kind' => %w[local domain] }` |
| D10 | `credentials_harvested` detail `count` is an integer | Detail shapes in the table are enums or ids | Unit 07 uses the enum `%w[1 2 3 4 5 6 7 8]` unless the table already has a number shape (Q12) |
| D11 | "A relay session is always user" is written as settled (S5a) | `session_access` returns `'user'` for any relay record before it looks at the account | Ruling B changes it: unit 02 |
| D12 | An admin overrides the USB policy for a storage stick | `plant_admin_pc` finds a judging PC only from a `needsSession` grant or when the object is itself a sign-in PC; a sign-in PC cannot take a stick, so the override is unreachable in a valid scenario (S5a O3) | Ruling A: units 03, 06, 11, 14 |
| D13 | Outline: a policy `localAdmin: "unique"` | PRIV (later) says no policy field; uniqueness is authored as one `local` account per PC | Build PRIV (Q8) |
| D14 | Three PCs share the local administrator in the test scenario | `test_ops_privilege` already has two PCs and a 40 minute playtest | Two shared PCs, one hardened PC (Q9) |
| D15 | PRIV does not list `capture_proofs.rb` (`account_password_opens_something?`) as an S5c edit | It calls `pc_admits_account?`, so it follows unit 17 with no edit | Unit 17 adds a test for it; no edit to that file by S5c |
| D16 | The scanner treats admin on a relay as a leak | `access_leak_scanner.rb` rule R4-2a flags any relay answer with `access: admin` | Unit 15 replaces that half of the rule with a proof-tied one (section 4.7) |

## 4. The design, restated for builders

### 4.1 Scenario fields

| Field | Where | Stage | Sent to browser? |
|---|---|---|---|
| `cachedAccounts`: up to 8 of `{ "npc": id, "after"?: "borrow" }` | sign-in PC object | S5b | Never (`WITHHELD_OBJECT_FIELDS`) |
| `proof: { "harvested": "<pcId>" }` | a `hash` credential | S5b | Never (registry is server-only) |
| `portOf: "<sign-in PC id>"` | a USB-governed object that is not a sign-in PC | A | Yes, in the room answer; an id the room already shows |
| `creds.accountKind` (`local`, `domain`), `creds.localTo` (PC ids), `creds.domain` | NPC `creds` | S5c | Never (`creds` is withheld) |
| `domain` (pattern `^[A-Za-z0-9.-]{1,32}$`) | sign-in PC object | S5c | Yes, in the room answer; shown with `textContent` |
| `accountOnly: true` | room NPC | S5c | Never: the NPC entry is dropped from every room answer |

Pair strings are `"<pcId>|<npcId>"`; an id holding `|` is a validator error.

### 4.2 Server state

Two keys in `ACCESS_STATE_DEFAULTS`, both `[]`, grow-only, server-written, never read from a sync body, never sent: `cachedAt` (written only when a declared `after: "borrow"` borrower's "done" is accepted at that PC and the borrower is not locked out there) and `harvestedAccounts` (written only by the collect). S5c adds none.

### 4.3 The collect route

`POST /games/:id/harvest_credentials`, `games#harvest_credentials`, policy `harvest_credentials?` (same rule as `crack?`), under the game lock, `Cache-Control: no-store` on every answer. Params: `pc_id` and the desktop's own route params (`relay`, `foothold`, `from`, through `desktop_route_params`).

Checks in order; nothing is written on a refusal:
1. `pc_id` missing, not a string, empty or over 40 characters: 400 `{ success: false, reason: "bad_request" }`.
2. Not a sign-in PC in a room, or no session record there: 404 with the same body `GET /container` gives an invented id.
3. Route params conflict or the desktop request would be refused: 403 `{ success: false, reason: "not_reachable" }`.
4. Session locked: 422 `reason: "locked"`.
5. `session_access` nil for any other reason: 403 `not_reachable`.
6. `session_access == "user"`: 422 `reason: "not_admin"`.
7. Collect; `save!` only when a pair was added; one `credentials_harvested` row only then.

Success: `200 { success: true, harvested: [row], held: [row], keyringRev }`, `row = { npcId, displayName, username, portrait, avatar, hashId }`. `harvested` is what this call added, `held` everything collected at this PC. `portrait` and `avatar` are null for an `accountOnly` account. No password, no token, no fact, no recipe, no `localTo`.

### 4.4 Account kinds (S5c)

`AccessIdentities.account_kind_admits?(pc, npc)`: no kind, true; `local`, the PC's id is in `localTo`; `domain`, the PC's `domain` equals `creds.domain` (an absent PC domain never matches). `CredentialModel.pc_admits_account?` calls it first, then the access list; kinds only narrow. A kind refusal is the existing uncounted `notPermitted` 422, and its `signin_refused` row carries `kind`. The second sign-in step is unchanged. `account_only?(npc)` is `npc['accountOnly'] == true`; such an account has no tile on any PC and is typed.

### 4.5 Rulings A and B

**A.** `CaptureModel.port_pc(obj)`: the object's `portOf` when it is a non-empty string, else nil. `plant_admin_pc(obj)` reads, in order: the `needsSession` grant's PC (as now), the object's own id when it is a sign-in PC (as now), then `port_pc(obj)` when it names a sign-in PC in a room. `keyboard_or_session_admin?` is unchanged, so a storage stick takes any admin session at that PC and a session-shaped device still needs the keyboard. The existing `plant_policy_refusal` and `usb_install_overridden` row (`device: storage`) then work as built. The client mirrors it: `pcPolicy.portPc(objectData)` and `plantAdmin` reading it after `sessionGrantPc`.

**B. What the code does today:** `session_access` returns `'user'` for every relay record (and every claim) before reading the account, so a relayed administrator is reduced to user. That is stricter than the owner's intent. The fix (unit 02): a relay record falls through to the `'password', 'credential'` branch, so its level is `account_admin_at?(npc, pc)`. A claim stays `'user'` (Q11). `ops_need_session` still refuses every relay record, so a relay never feeds a step up (S5a O1 option B stands); `keyboard_admin?` still excludes a relay. The client needs no rule change: `sessionAdmin` reads the server's `access`, `keyboardAdmin` already excludes a relay; unit 06 proves the relay entry keeps `access`.

Access checks this widens, each by ruling or plan, none a side effect: (1) a relay session of an administrator account reads as admin: admin profile reach, the collect, the storage-stick override at a `portOf` port; (2) `admin_present_accounts` adds the accounts cached at the PC now (PRIV); (3) `plant_admin_pc` gains the `portOf` source.

### 4.6 What reaches the browser, and what proves it was earned

| New field or value | First answer that carries it | Proof it was earned |
|---|---|---|
| Collect rows (`npcId`, `displayName`, `username`, `portrait`, `avatar`, `hashId`) | `POST /harvest_credentials` 200 | A live admin session at that PC (step 6) and the pair in `harvestedAccounts` |
| A collected hash row (S7 shape: token, `salted`, `status`, account block) | First `GET /keyring` after the collect | `credential_proof_holds?`: the pair is in `harvestedAccounts` |
| A cracked password | S7's keyring password row after a successful `POST /crack` | S7's rules, unchanged |
| Fact label and text for a recipe | S7's inventory-add answer or `crackFacts` | S7's `earned_fact_ids`, unchanged; a poster's `revealsFacts` is withheld until taken |
| `access: "admin"` on a relay session | The relay sign-in answer, then the desktop answer | Assist invite proof holds, and `account_admin_at?` |
| `portOf` | Room answer of the port's room | Not a secret (a PC id) |
| PC `domain` | Room answer of the PC's room | Not a secret |
| An `accountOnly` account's display name | Its session answer after a typed sign-in, a collect row, or its hash row | The sign-in, or the collect |
| An `accountOnly` account's username | A collect row or its hash row | The collect |

Never in any answer, the bootstrap included: `cachedAccounts`, `cachedAt`, `harvestedAccounts`, `accountKind`, `localTo`, `creds.domain`, `accountOnly`, an `accountOnly` NPC's room entry, a collect pair string, any uncollected account's name or username on a PC whose picker does not already show it, and any password in a collect answer. The bootstrap `sessions` never holds a relay record (existing rule), so relay admin never appears on load.

### 4.7 Leak scanner rules (unit 15)

Rule for the unit: **never loosened; every allowance tied to proof in the capture; fails closed.**
- Key names of the "never" list above anywhere in any answer: a leak.
- A collect row or a `hashId` for an account before a 200 collect answer at that PC in the same capture named it: a leak. A collect 200 is credited only when the capture shows an admin session at that PC before it (the S5a `admin:<pc>` step); otherwise a leak.
- A hash row whose registry proof is `harvested` listed before the collect that named its `hashId`: a leak.
- An `accountOnly` display name or username before its earning answer: a leak.
- R4-2a split: a claim shown with admin stays a leak. A relay shown with admin is allowed only when the scenario's registry holds an assist invite for that account connecting to that PC, the scenario marks the account `creds.admin: true`, and the PC admits it; with no game to read, or any doubt about the PC, it is a leak.
- A password of a collected account appearing without S7's cracked answer for that account: S7's rule, unchanged.

## 5. Units and waves

No two units in one wave share a file. A wave starts when the waves it waits for are committed.

| Wave | Waits for | Units |
|---|---|---|
| 0 | none | 01 unchanged cases [S5b][S5c][A][B] · 02 relay level [B] · 03 schema [S5b][S5c][A] · 04 proof kind and pair helpers [S5b] · 05 kind and account-only predicates [S5c] · 06 client admin predicates [A][B] · 07 log events [S5b][S5c] · 11 port override, server [A] |
| 1 | 0 | 08 cached set and collect, model [S5b] · 09 keyring proof [S5b] · 10 validator S5b [S5b] |
| 2 | 1 | 12 collect route [S5b] · 13 borrow writer and withheld field [S5b] · 14 validator port [A] · 15 leak scanner rules [S5b][S5c][B] · 16 graph [S5b] |
| 3 | 2 | 17 admission by kind [S5c] · 18 validator S5c [S5c] · 19 scenario, S5b part, and answers fixture [S5b][A][B] |
| 4 | 3 | 20 account-only readers [S5c] · 21 collect panel [S5b] · 22 test bridge [S5b] · 23 scanner on real answers [S5b][A][B] |
| 5 | 4 | 24 scenario, S5c part [S5c] |
| 6 | 5 | 25 client for S5c [S5c] · 26 docs [S5b][S5c][A][B] |
| after | 6 | merge `main`, full suites, golden compare, scripted playtest, live browser proof |

Scanner reviews: once after wave 2 (unit 15), once after wave 4 (unit 23), before the stage review.

**Landing S5b alone.** Skip units 05, 17, 18, 20, 24, 25. Unit 03's S5c schema fields may stay (the validator's S5c "not built yet" errors still guard them); unit 07's `kind` detail and unit 15's S5c names are inert. Unit 26 then documents A19 only.

### Unit 01 (wave 0): unchanged cases [S5b][S5c][A][B]
- **Files:** `test/support/ops_unchanged_cases.rb` (one new method `harvest_cases`, merged in `all` on its own line), new fixtures `test/fixtures/files/ops_unchanged/harvest_*.json`.
- **Build:** before any engine edit, capture from this branch as cut: a relay sign-in and its desktop answer on `test_access_keyring` (ruling B); a refused storage-stick remove on a scenario with a `storage_blocked` or `blocked` governed object (ruling A); a room answer with sign-in tiles, `hasNPCs` and `hasPresentNpc`, a `notPermitted` typed sign-in and a keyring sign-in on `test_access_signin` and `test_access_sessions` (S5c). Skip any the existing `privilege_cases` already replay, and say which.
- **Tests:** `test/lib/ops_unchanged_replay_test.rb` replays them.
- **Done:** replay green before and after every later unit.

### Unit 02 (wave 0): relay level [B]
- **Files:** `app/models/break_escape/game.rb` (`session_access` only), new `test/models/break_escape/relay_access_level_test.rb`.
- **Build:** section 4.5 B. Change the one line; update the comment above it.
- **Tests:** relay of an admin account admitted at the PC reads `admin`; relay of a non-admin reads `user`; relay of an admin account the PC's access list refuses reads `user`; a claim of an admin's open desktop reads `user`; `ops_need_session` unmet for a relay admin at both levels; `keyboard_admin?` false; the relay sign-in answer carries `access: "admin"` only in the first case; an ended invite reads nil.
- **Done:** tests green, golden compare clean (no shipped scenario outside `test_ops_privilege` has an assist invite and an admin account together).

### Unit 03 (wave 0): schema [S5b][S5c][A]
- **Files:** `scripts/scenario-schema.json`.
- **Build:** the fields of 4.1, each as its own property, smallest edit (the file has very long lines; do not reformat). `cachedAccounts` and `harvested` marked `x-serverOnly`. `portOf` on the item definition.
- **Tests:** `node test/js/` schema tests that exist stay green; unit 10, 14 and 18 fixtures exercise the fields.
- **Done:** every shipped scenario still validates with the same output.

### Unit 04 (wave 0): proof kind and pair helpers [S5b]
- **Files:** `lib/break_escape/credential_model.rb` (`PROOF_KINDS` gains `harvested`), new `lib/break_escape/cached_accounts.rb` (pure, `module_function`: `candidates(pc)`, `pair(pc_id, npc_id)`, `hash_record_id(scenario, pc_id, npc_id)`, `borrow_candidate?(pc, npc_id)`), the file that requires the lib modules, new `test/unit/cached_accounts_test.rb`.
- **Tests:** malformed lists give `[]`; a non-holder is ignored; `hash_record_id` is nil for none or two records; `proof_kind` reads `harvested`.
- **Done:** tests green; no behaviour change (no scenario uses the kind).

### Unit 05 (wave 0): kind and account-only predicates [S5c]
- **Files:** `lib/break_escape/access_identities.rb` (`account_kind_admits?`, `account_only?`, new methods at the end of the module), `lib/break_escape/npc_habits.rb` (`expand!` skips `account_only?`), new `test/unit/account_kind_predicates_test.rb`.
- **Tests:** every cell of 4.4; junk values (`localTo` a string, `domain` a number) refuse; `expand!` leaves an account-only NPC untouched.
- **Done:** tests green; nothing calls the predicates yet.

### Unit 06 (wave 0): client admin predicates [A][B]
- **Files:** `public/break_escape/js/systems/pc-policy.js` (`portPc`, added to the frozen export), `public/break_escape/js/systems/pc-sessions.js` (`plantAdmin` reads `portPc` after `sessionGrantPc`; a relay entry keeps the server's `access`), new `test/js/pc-policy-port.test.mjs`, new `test/js/pc-sessions-relay-admin.test.mjs`.
- **Build:** no new import (`pc-sessions.js` reads `window.pcPolicy`). Only a strict `access === 'admin'` from the server counts.
- **Tests:** `portOf` junk values give null; `plantAdmin` true for a port whose PC holds a remote admin session and false when locked; a relay entry with `access: 'admin'` gives `sessionAdmin` true and `keyboardAdmin` false; these two tests may use literal entries because they test predicates, not answers.
- **Done:** tests green with the existing `pc-policy*`, `pc-sessions*` and `interactions-admin-plant` tests.

### Unit 07 (wave 0): log events [S5b][S5c]
- **Files:** `lib/break_escape/ops_log_events.rb`, its existing test file.
- **Build:** `credentials_harvested` (label `CRED_COLLECT`, place `pc`, result `ok`, detail `count`, D10) as a new entry after the S5a pair; `signin_refused` gains the `kind` detail (D9).
- **Done:** table tests green; golden compare clean.

### Unit 11 (wave 0): port override, server [A]
- **Files:** `lib/break_escape/capture_model.rb` (`port_pc`), `app/models/break_escape/capture_proofs.rb` (`plant_admin_pc` third source), new `test/models/break_escape/port_override_test.rb`.
- **Tests:** on an inline scenario: storage stick refused at a `storage_blocked` port with no session, with a user session, with a locked admin session; planted with a keyboard admin, a remote admin and a relay admin session at the named PC, each writing one `usb_install_overridden` row with `device: storage`; a lapsed session refuses and the stick stays; `portOf` naming a missing id or a non sign-in object never overrides; a port with no `portOf` behaves as before.
- **Done:** tests green; golden compare clean.

### Unit 08 (wave 1): cached set and collect, model [S5b]
- **Files:** new `app/models/break_escape/cached_credentials.rb` (concern: `cached_accounts_at(pc)`, `harvest_cached_credentials!(pc_id)`, `harvested_rows(pc_id, pairs)`, `note_borrow_cached!(pc, npc)`), `app/models/break_escape/game.rb` (the `include`, the two default keys on their own line, `admin_present_accounts` widened), new `test/models/break_escape/cached_accounts_test.rb`, `harvest_test.rb`.
- **Build:** PRIV section 5 rules as in the digest: declared list only, order kept, stale pairs ignored, own account collected only when cached, nothing trimmed, writers add a pair only when absent. `harvest_cached_credentials!` requires `session_admin?` itself and writes the log row when a pair is added. Confirm the two keys are kept out of every sync and bootstrap answer the way `crackedAccounts` is.
- **Tests:** the model cases of PRIV 11 that need no route or borrow (the borrow cases call `note_borrow_cached!` directly); second collect adds nothing and writes no row; admin profile reach now includes a cached account's profile and not an uncached one.
- **Done:** tests green; golden compare clean.

### Unit 09 (wave 1): keyring proof [S5b]
- **Files:** `app/models/break_escape/credential_keyring.rb` (one `when 'harvested'` branch: kind is `hash` and the pair is in `harvestedAccounts`), new `test/models/break_escape/harvested_proof_test.rb`.
- **Tests:** the row lists only after the pair is set, for that PC only; no password row appears; an account already cracked reads `cracked`; `POST /crack` on an uncollected harvested hash is S7's 404; the keyring `rev` changes when a pair is added.
- **Done:** tests green.

### Unit 10 (wave 1): validator S5b [S5b]
- **Files:** `scripts/validate_privilege.rb` (new function `privilege_cached_accounts`, called from `check_privilege`; the two S5b guards removed), `scripts/validate_cracking.rb` (the proof rule accepts `harvested`; nothing else), new `test/js/validator-privilege-cached.test.mjs` with fixtures under `test/js/fixtures/`.
- **Build:** the S5b errors, warnings and info lines of the digest section 10, including: one hash record per candidate; `after: "borrow"` only on an unowned, non-headless PC with a matching `borrow_session`; at most 8; `|` in an id; PC id over 40 characters; `harvested` only on a `hash`; the no-admin-path warning.
- **Tests:** one fixture per line and a clean one.
- **Done:** tests green; the validator output for every shipped scenario is unchanged.

### Unit 12 (wave 2): collect route [S5b]
- **Files:** `app/controllers/break_escape/games_controller.rb` (new action in its own block beside `crack`; its name on the `set_game` list), `config/routes.rb`, `app/policies/break_escape/game_policy.rb`, `test/unit/break_escape/policy_test.rb`, new `test/controllers/break_escape/harvest_credentials_test.rb`.
- **Build:** section 4.3 exactly.
- **Tests:** each refusal in order with nothing written; unknown id and real id with no session give the same status and body once the echoed id is replaced; hostile `pc_id` (array, hash, 41 characters, 10 KB, another game's id); a relay admin collects with `relay=1` and is refused without it; success body key set is exactly 4.3's; `no-store`; repeat answer; `keyringRev` equals the next `GET /keyring` rev.
- **Done:** tests green; golden compare clean.

### Unit 13 (wave 2): borrow writer and withheld field [S5b]
- **Files:** `app/models/break_escape/npc_frustration.rb` (one call to `note_borrow_cached!` after the lock-out branch of `record_borrow_done!`), `app/models/break_escape/network_access.rb` (`cachedAccounts` in `WITHHELD_OBJECT_FIELDS`), new `test/models/break_escape/borrow_cached_test.rb`.
- **Tests:** PRIV's borrow cases through the real "done" path: cached after an accepted "done" at that PC only; not for an early or resent one; `cut: true` caches; a locked-out borrower does not; a careful guest does; survives a reload; no object in any room answer holds `cachedAccounts`.
- **Done:** tests green; golden compare clean.

### Unit 14 (wave 2): validator port [A]
- **Files:** `scripts/validate_privilege.rb` (new function `privilege_port_of`), new `test/js/validator-privilege-port.test.mjs`.
- **Build:** errors: `portOf` not naming a sign-in PC in a room; on a sign-in PC; on an object no policy governs; on an object whose `needsSession` grant names another PC. Warning: the port's policy differs from the PC's (Q4).
- **Done:** fixtures green; shipped scenarios unchanged.

### Unit 15 (wave 2): leak scanner rules [S5b][S5c][B]
- **Files:** `tools/playtest/lib/access_leak_scanner.rb` (new methods in one block marked S5b/S5c; the R4-2a edit), its unit test file, new fixtures under `test/fixtures/files/access_leak/`.
- **Build:** section 4.7. Refuse to run against a game object that lacks the readers the rules need, as S7 did.
- **Tests:** one capture per rule that must be flagged and its nearest clean twin; the relay-admin allowance flagged in each of its three missing-proof cases.
- **Done:** tests green; the existing real-capture tests for S5a, S7 and S8a still report what they reported. Reviewed after this wave.

### Unit 16 (wave 2): graph [S5b]
- **Files:** `scripts/generate_dungeon_graph.rb` (a new helper called beside the hash-record edges), its node test.
- **Build:** an edge `admin@<pcId>` to each cached account's hash record, labelled "collect"; a second input from the borrow workaround for `after: "borrow"`. No password text in a label.
- **Done:** graphs of shipped scenarios unchanged byte for byte.

### Unit 17 (wave 3): admission by kind [S5c]
- **Files:** `lib/break_escape/credential_model.rb` (`pc_admits_account?`), `app/models/break_escape/game.rb` (`pc_admits_account?` delegates; `login_account_tiles` skips `account_only?`; the `kind` detail at the typed refusal), `app/models/break_escape/mfa_sign_in.rb` (the `kind` detail, only if its refusal can be a kind refusal), new `test/models/break_escape/pc_admits_account_test.rb`, `account_kind_test.rb`, `login_tiles_test.rb`.
- **Build:** first commit inside the unit's work is the agreement test over every shipped scenario, run green before the delegation.
- **Tests:** the digest's S5c unit cases; `account_password_opens_something?` follows the kind (D15); refusals uncounted; row `kind` only when the kind refused.
- **Done:** tests green; golden compare clean.

### Unit 18 (wave 3): validator S5c [S5c]
- **Files:** `scripts/validate_privilege.rb` (new function `privilege_account_kinds`; S5c guards removed), `scripts/validate_access_work.rb` (the awareness skip), new `test/js/validator-privilege-kinds.test.mjs`.
- **Build:** the S5c lines of the digest section 10, including the `accountOnly` key allow-list and required `staff`.
- **Done:** fixtures green; shipped scenarios unchanged.

### Unit 19 (wave 3): scenario, S5b part, and answers fixture [S5b][A][B]
- **Files:** `scenarios/test_ops_privilege/` (scenario, `mission.json`, graph, `PLAYTEST.md`), `test/controllers/break_escape/ops_privilege_scenario_test.rb`, `ops_privilege_no_exposure_test.rb`, new `test/fixtures/files/ops_privilege_answers.json`, new `test/support/privilege_answers.rb`, new `test/js/support/privilege-answers.mjs`.
- **Build (append only; new `eventMappings` last; existing beats must still play):**
  - `capture_log_kit` in `startItemsInInventory` (type `capture_log`, `holds.captures: true`) unless one exists.
  - `hot_desk` in `lobby`: sign-in PC, no owner, `"locked": false`, admits `adel`, `cachedAccounts: [{ "npc": "priya" }, { "npc": "sam", "after": "borrow" }]`.
  - `bay_pc` gains `cachedAccounts: [{ "npc": "olu" }, { "npc": "uma" }]`.
  - NPCs `priya` and `sam` with `creds` and a `password` habit; `sam` has a `borrow_session` workaround at `hot_desk` and a need the player can make fail.
  - Hash records `baypc_olu`, `baypc_uma`, `hotdesk_priya`, `hotdesk_sam`, each `proof: { "harvested": <pc> }`, crackable by facts on takeable `notes` items (`"takeable": true`, in an open room, not inside a locked container).
  - Ruling A: `bay_usb_port` in `bay`, a clickable object type the engine already draws for a USB socket, `"locked": false`, `policy: "bay_locked"`, `portOf: "bay_pc"`, taking the storage stick `survey_stick` (`usbClass: "storage"`, a start item); the plant proves something the scenario test can read.
  - Ruling B: credential `adel_assist` (`assist_invite`, account `adel`, `connectsTo: "hot_desk"`, `proof: { "held": "adel_assist_code" }`), the code a takeable item.
  - The scenario test plays every beat of section 7 (S5b, A, B) through the real routes and writes each real answer, by name, to the fixture when run with `PRIV_ANSWERS_RECORD=1`; without it, it asserts the real answers equal the fixture. Ids and clock values are real, not placeholders. The two helpers only read the file by answer name.
  - The no-exposure test scans the bootstrap, every room answer, sync, `GET /container`, `GET /keyring` and every collect answer for section 4.6's "never" list, at the start and after every beat.
- **Tests:** the two controller tests; `ruby scripts/validate_scenario.rb` clean; drift check.
- **Done:** tests green; the builder has opened the game in a browser and confirmed each click path of section 7 opens what it says (or corrected `PLAYTEST.md` and reported the difference).

### Unit 20 (wave 4): account-only readers [S5c]
- **Files:** `app/models/break_escape/game.rb` (each person-in-the-world reader skips `account_only?`: `filtered_room_data`, `hasPresentNpc`, `npc_in_room?`, `ko_claimable_room_npc_ids`, `character_sprite_keys`), `app/controllers/break_escape/games_controller.rb` (`hasNPCs` and the NPC count), new `test/models/account_only_readers.yml`, `test/models/break_escape/account_only_readers_test.rb`.
- **Build:** account readers (`scenario_room_npcs` and what reads accounts from it) keep the NPC. The manifest lists every method in `app` and `lib` that loops room NPCs, each marked skip or keep; the test fails on a missing or stale entry.
- **Done:** tests green; golden compare clean.

### Unit 21 (wave 4): collect panel [S5b]
- **Files:** new `public/break_escape/js/minigames/container/cached-accounts-panel.js`, `public/break_escape/js/minigames/container/container-minigame.js` (one import, one mount call on the sign-in desktop), the desktop's stylesheet, every harness copy list that loads `container-minigame.js`, new `test/js/cached-accounts-panel.test.mjs`.
- **Build:** shown only when `sessionAdmin(pcId)`; a "Cached accounts" button posts to the collect route with the desktop's own route params, then calls the keyring's `refresh()`. The panel lists `held`: headshot (generic when `portrait` is null), display name, username, the word "hash", a Crack button calling `startMinigame('ops-cracker', null, { hashId })`, and one line saying the password comes from cracking. "Nothing new is cached here." when `harvested` is empty. Refusals through `refusalText`. All text by `textContent`. Pixel-art UI rules (2px borders, no rounded corners).
- **Tests:** every server answer comes from `privilege-answers.mjs` (no hand-written bodies): success, repeat, `not_admin`, `locked`, `not_reachable`; hostile display name rendered as text (the one allowed edit of a fixture answer is replacing a name with a hostile string in the test); no control for a user session; the control present for a relay admin entry and the request carries `relay`.
- **Done:** tests green, and all tests that load `container-minigame.js` still pass.

### Unit 22 (wave 4): test bridge [S5b]
- **Files:** `public/break_escape/js/systems/test-bridge/access.js`, `test/js/test-bridge-access.test.mjs`.
- **Build:** bridge readers the scripted player needs: whether the collect control is shown, the panel rows, a click on the control and on a row's Crack button. They click real DOM; they send no request of their own.
- **Done:** tests green.

### Unit 23 (wave 4): scanner on real answers [S5b][A][B]
- **Files:** `test/controllers/break_escape/access_leak_scanner_privilege_real_test.rb`, and `tools/playtest/lib/access_leak_scanner.rb` only for a fault this test finds.
- **Build:** run the scanner over the real answers unit 19 records (the whole run in order: clean), then over the same run with each proof removed (collect before admin, hash row before collect, relay admin for a non-admin): each flagged.
- **Done:** tests green. Reviewed after this wave.

### Unit 24 (wave 5): scenario, S5c part [S5c]
- **Files:** as unit 19.
- **Build (append only):** room `it_room` (open) with `desk_a`, `desk_b`, `lab_pc` (sign-in PCs, `"locked": false`, each admitting `adel`); account-only NPCs `deskadmin` (`local`, `localTo: ["desk_a","desk_b"]`, `admin: true`, `staff: false`) and `labadmin` (`local`, `localTo: ["lab_pc"]`); each cached on its PCs with a hash record per PC; `deskadmin`'s records carry `crack: { "password": "guessable", "facts": ["it_rota_seen"] }`, `labadmin`'s `strong`; takeable `it_rota_poster` (type `notes`, `revealsFacts`); `domain: "northwind"` on `bay_pc` and `hot_desk`; NPC `ravi` (a person, `domain` kind, `admin: true`) whose password a takeable note gives. Re-record the fixture; extend both controller tests and the scanner real test's capture.
- **Done:** as unit 19, for the S5c beats.

### Unit 25 (wave 6): client for S5c [S5c]
- **Files:** the sign-in screen module that reads `loginAccounts` (find it from `api-client.js` and `unlock-system.js`), `public/break_escape/js/utils/pc-taskbar.js` only if the test below fails, new `test/js/signin-domain.test.mjs`, `test/js/account-only-session.test.mjs`.
- **Build:** the sign-in screen shows "Domain: <name>" when the PC has one; a session answer for an NPC the client never loaded shows its display name and the generic headshot.
- **Tests:** answers from `privilege-answers.mjs`; hostile `domain` as text.
- **Done:** tests green.

### Unit 26 (wave 6): docs [S5b][S5c][A][B]
- **Files:** `README_scenario_design.md`, `docs/ACCESS_AND_NETWORKS.md`.
- **Build:** A19 and A20 in the feature index; `portOf`; the relay level rule as now built; the S5a text that says the storage override is unreachable is corrected.

## 6. Ambiguities and open questions

Builders build the recommendation.

- **Q1. Which admin acts does a relayed administrator get?** *Recommended:* all that any remote admin session gets (profile reach, collect, storage-stick override at a `portOf` port), never the keyboard-only ones and never a step up. *If otherwise* (relay admin limited to reading): one term in `harvest_cached_credentials!` and in `keyboard_or_session_admin?`, two tests, one scanner rule.
- **Q2. Name of the port field.** *Recommended:* `portOf`. *If otherwise:* a rename across units 03, 06, 11, 14, 19.
- **Q3. Which admin sessions override for a storage stick?** *Recommended:* any admin session at the named PC, as PRIV section 4 says for a device that needs no session. *If otherwise* (keyboard only): `keyboard_or_session_admin?` returns `keyboard_admin?` for a `portOf` port; the remote and relay cases of unit 11 flip.
- **Q4. Whose policy judges the stick?** *Recommended:* the port object's own policy, as today; a validator warning when it differs from the PC's. *If otherwise* (the PC's policy): `usb_policy_for` must follow `portOf`, which changes NPC-side readers too; that is a fourth unit and should be its own stage item.
- **Q5. Is the collect panel a new overlay scene?** *Recommended:* no, a part of the desktop. *If otherwise:* a new minigame registration, the pinned scene list goes to 19, and every `minigames/index.js` copy list gains the file.
- **Q6. Must a scenario with cached accounts still give a capture log?** *Recommended:* yes, S7's validator rule stands; the panel's Crack button is a second door to the same scene. *If otherwise:* a change to S7's rule and to where a hash row is listed after the panel closes.
- **Q7. Collect through a relay.** *Recommended:* allowed, with `relay=1`, as the desktop itself is. Follows from ruling B.
- **Q8. `localAdmin: "unique"` policy (outline).** *Recommended:* not built; PRIV is later and says no policy field. *If otherwise:* a new policy field, validator rule and scenario change: a stage of its own.
- **Q9. Two shared PCs or three in the test scenario?** *Recommended:* two plus the hardened one; the lesson needs one reuse. *If otherwise:* one more PC and hash record in unit 24.
- **Q10. Fixture first or server first?** *Recommended:* the answers fixture is recorded from the real scenario test (unit 19), so the collect panel waits for wave 4. *If otherwise* (hand-written shapes in wave 0): the panel could start in wave 1 but lesson 1's fault can return.
- **Q11. Does a claim follow ruling B?** *Recommended:* no; a claimed desktop stays user, as built and as the scanner enforces. *If otherwise:* the same one-line change for `via: 'claim'`, with the scanner's claim rule replaced by a proof-tied one.
- **Q12. `count` in the log row.** *Recommended:* the enum of strings `1` to `8` unless a number shape exists. *If otherwise:* a new detail shape in the log helper, which is the log plan's file to change.
- **Q13. Admin profile reach widened to cached accounts.** *Recommended:* build as PRIV says (owner plus accounts cached now). *If otherwise:* drop the `admin_present_accounts` edit from unit 08; nothing else depends on it.
- **Q14. Does the collect cost game time or risk?** Settled in PRIV: no.

## 7. Playtest outline (scripted browser player, `test_ops_privilege`)

Click paths are the expected ones; unit 19 confirms each in a browser and `PLAYTEST.md` is the final word. After each beat the leak check runs over the capture.

| # | Stage | Beat | Click path | Expect |
|---|---|---|---|---|
| 1 | S5b | No collect as a user | Click `bay_pc`; type Uma's username and password from her note; desktop opens | No "Administrator" marker, no "Cached accounts" button |
| 2 | S5b | Collect as admin | Taskbar: Switch user; click the Adel tile; type the password; desktop | Marker shown; click "Cached accounts": rows for Olu and Uma, each "hash" with a Crack button; a second click says nothing new |
| 3 | S5b | Hash rows listed | Close the desktop; inventory tray: click the capture log; sign-ins list | Two hash rows; no password row for either |
| 4 | S5b | Crack one | Take the fact note in `bay` (click it, Take); capture log; hash row; Crack; pick the facts; run | Status cracked; a password row for that account; sign in with it at `hot_desk` |
| 5 | S5b | Borrow, then collect | Make Sam's need fail until he asks for the hot desk (as `test_access_social`); let him finish; click `hot_desk` (his desktop left open): no collect button; Switch user to Adel; "Cached accounts" | Before the borrow only Priya was listed; now Sam's row is new |
| 6 | S5b | Crack from the panel | In the panel click Crack on Sam's row | The cracker opens for that hash |
| 7 | A | Stick refused | Click `bay_usb_port` in `bay` holding `survey_stick`, no session at `bay_pc` | The policy's refusal line; the stick stays in the tray |
| 8 | A | Stick as admin | Sign in at `bay_pc` as Adel; close; click `bay_usb_port` | The stick is planted; the audit log PC shows a USB override row |
| 9 | B | Relayed admin | Take `adel_assist_code`; capture log or keyring row for it; Connect to `hot_desk` | Shared screen shows the Administrator marker and the collect button; the network view offers no step-up card for it |
| 10 | B | Relayed user | Use Uma's assist code to `store_pc` (existing beat) | No marker, no collect button |
| 11 | S5c | Collect the shared local admin | Take `it_rota_poster` in `it_room`; click `desk_a`; type Adel's sign-in (no `deskadmin` tile is offered); "Cached accounts" | A row with username `deskadmin`, generic headshot |
| 12 | S5c | Crack and reuse | Crack that row with the poster's fact; click `desk_b`; type `deskadmin` and the password | Admin desktop on `desk_b`; "Cached accounts" there shows the row already cracked |
| 13 | S5c | Hardened PC holds | Click `lab_pc`; type `deskadmin` and the password | "Not permitted"; as Adel, collect `labadmin`: its hash cannot be cracked |
| 14 | S5c | Domain admin | Click `bay_pc` (sign-in screen shows "Domain: northwind"); sign in as Ravi; then the same at `hot_desk`; then at `desk_a` | Admin on both domain PCs; "Not permitted" on `desk_a` |

Server-side checks after the run: `sessions`, `cachedAt`, `harvestedAccounts`, the log rows (`credentials_harvested` once per adding collect, `usb_install_overridden` with `storage`, `signin_refused` with `kind`). Not played in the browser (Rails tests carry them): forged or replayed requests, hostile `pc_id`, a lapsed override.

## 8. Security review points

1. Every refusal of the collect writes nothing and looks the same for an invented PC id and a real one with no session.
2. No answer, the bootstrap included, holds anything on section 4.6's "never" list; each new value appears first in the answer the table names.
3. A relay never meets a `session` need and never counts as the keyboard; a claim is never admin.
4. `portOf` can only name a sign-in PC; an override always writes its row; a lapsed session refuses before anything is removed.
5. Account kinds only narrow admission; no path admits an account the access list refuses.
6. The two new state keys are bounded by the scenario's declared pairs and are never read from the client.
7. The scanner was not loosened: each allowance names its proof and fails closed without a game.
8. No test leaves an application method or a global replaced.
