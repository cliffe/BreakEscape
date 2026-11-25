# S7 build brief: hash records and the offline cracking minigame (feature A21)

Written 2026-11-24 by the S7 designer. Read `docs/agents/OPS_CORE_BUILD_BRIEF.md` first; its rules
bind every builder here. For this stage the build worktree is `/data/be-ops-logs`, branch
`ops-crack` (it holds S1 to S5a and the log stream L1 to L3), unless your prompt names another.

The design is `docs/achitechture/OPS_CRACKING_PLAN.md` (cited as `P<line>`), build stages C1 and
C2. You should not need to open it: this brief restates what to build. Where this brief and the plan
disagree on a name, a line number or which file holds something, THIS BRIEF is right (it was
checked against `ops-crack`). The owner has said hashes come in, so that question is closed.

C1 and C2 are built here as ONE stage that lands together. The waves below cut across them, so a
half-built tree (a Crack button with no route) is expected between waves and never lands alone.

Short names: `GM` = `app/models/break_escape/game.rb`, `GC` =
`app/controllers/break_escape/games_controller.rb`, `CM` = `lib/break_escape/credential_model.rb`,
`CK` = `app/models/break_escape/credential_keyring.rb`, `VS` = `scripts/validate_scenario.rb`,
`JS` = `public/break_escape/js`. Line numbers are those on `ops-crack` today; re-find each anchor
by name before editing.

## 1. What S7 adds, in play

This is a game abstraction. A **hash record** is an invented opaque token that stands for the
stored, scrambled form of an account's password. The player gets one into the keyring, opens a
small **cracker** scene, picks intel facts they have earned about the account's owner, and presses
Crack. The server alone decides what happens, from the password's class:

- **strong**: never yields. First run "No match", from the second run "not feasible". Lesson: a good password is not made of personal facts.
- **guessable**: yields when the server has seen the player earn every fact the password is made from and the player picks exactly those. While facts are missing a run says how many, never which.
- **reused**: yields when the player already holds an equal password from another account.
- **common**: yields on the first run (for a shared account with no person behind it).

**Salt** is shown, not explained. Unsalted records of equal passwords show the same token and
crack together. A salted record shows its own token and every complete guess against it costs a
short real-time wait on the server, right or wrong. When a crack succeeds the password appears in
the keyring as an ordinary password entry and signs in like any other.

## 2. Constraints, in plain words

- **Game abstraction only.** No exploit content. No real cracking tool names, commands, wordlists, real hash formats or real hash strings anywhere: code, tests, scenario text, docs, comments. The token is an invented shape (section 4). The only place real tool ids may ever live is `config/break_escape/realism_catalog/*.json`, whose ids are append-only; **S7 adds nothing there** (the cracker has one look and no command-line skin). Do not open SecGen or any exploit-detail guide.
- **What never reaches the browser:** the recipe (`crack.facts`, `crack.passwordPattern`, `crack.difficulty`, `crack.password`, `passwordDifficulty`) and which earned facts a recipe uses; the class before any run; on a salted record, whether a pick was right before its wait ends; `creds.password` before the grant; the token key; the four state keys (`earnedFacts`, `crackRuns`, `crackStarted`, `crackedAccounts`) as state. No answer body may contain the word `difficulty`.
- **What does reach it:** on a hash row or a `POST /crack` answer: token, `salted`, account display name and username, `status`, `missingCount`, `readyInSeconds`, `crackFacts` (earned fact ids only). The password only after the grant, on the `"<npcId>.cracked"` keyring entry. An item's `revealsFacts` ids ride on the item as any item field does (they say which facts an item gives, not what any password is made of).
- **Nothing secret travels inbound.** The request carries a hash id and fact ids. A `se_intel_*` global is never read by the server for a crack.
- **The server decides every outcome.** The scene renders statuses. No runtime LLM anywhere; every word comes from scene strings or the scenario.
- **State.** The four keys are server-written only, in `ACCESS_STATE_DEFAULTS`, not sync sections, never sent whole, bounded at 64 entries each. A sync body that carries one is ignored.
- **Event mappings.** A new `eventMappings` entry goes LAST in its list (the server keys them by index) and `ruby tools/check_mapping_index_drift.rb` must pass. S7's engine needs none; the rule applies to the feature scenario.
- **JS imports.** A new static import in an engine JS module goes on every harness copy list that copies the importer. The lists that matter here: for `JS/minigames/index.js`, `test/js/patch-panel.test.mjs` (copy list at about line 30; it copies), `test/js/social-authenticator-wiring.test.mjs` and `test/js/ops-log-viewer.test.mjs` (both read the file; check each still passes). For `capture-log/signin-rows.js`: `capture-log.test.mjs`, `signin-rows.test.mjs`, `sync-request-sizes.test.mjs`. `systems/keyring.js` has NO static imports by design (its header says why); keep it so. `systems/inventory.js` is copied by about 60 harnesses: add no static import to it (unit 06 says how). Always grep `test/js` for the importer's file name; do not trust this list alone.
- **Existing scenarios unchanged.** After any engine Ruby edit run `bin/ops-golden-compare` with NO outer `flock` (it takes the lock itself). It must pass with no recapture; the only fixtures captured in this stage are unit 01's, before any engine edit.
- **Campaign missions (m01 to m10, sis*) and `.claude/skills/*` are not edited.** Only `scenarios/test_ops_crack/` is new.
- **Database.** The development database is shared and has no backup: never `db:create`, `db:schema:load`, `db:migrate`, `db:reset`, `db:drop`, `db:setup`, `db:seed`. **S7 needs no migration** (all new state is keys inside `player_state`). If you think you need one, stop and report.
- **Tests.** Rails: `flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <files>` from the worktree root, never `ruby -Itest`. Node: `node test/js/<file>`.
- **Writing.** UK English, plain words. Commit only your own files by explicit path, no attribution lines, only when your prompt says to.

## 3. Plan drift found (checked against `ops-crack`)

| # | Plan says | Code now | What builders do |
|---|---|---|---|
| D1 | `VS:7469` refuses an unbuilt kind | the check is `VS:7617` ("is not supported until phase 3") | Unit 08 leaves the line; it stops firing for `hash` once `CM:26` flips. Fix the comment. |
| D2 | hooks beside `VS:26` and `VS:8968` | requires at `VS:23-50`; `check_credentials` run line `VS:9117` | Find by name. |
| D3 | `CK:77`, `:238-241`, `:266-287`, `:312-328`, `:89-95` | `keyring_for_client` `CK:116`, `keyring_rev` `:280`, `implicit_keyring_entries` `:308`, `registry_keyring_entries` `:354`, `keyring_live_expires` `:131` | Find by name. |
| D4 | `GAME:719`, `:749-773`, `:3067` | `add_inventory_item!` `GM:721`, `restamp_item_credential!` `:751`, `ACCESS_STATE_DEFAULTS` `:3056`, `SERVER_OWNED_GLOBAL_NAMES` `:3112` | Find by name. |
| D5 | `GC:3948-3992`, `:4006`, `:1441`, `:1879`, `:2094` | `process_flag_rewards` `GC:4149`, `process_item_reward` `:4195`, inventory add `:1437`, `keyring` `:1920`, `submit_flag` `:2181`, flag-lock rewards `:1350` | Find by name. |
| D6 | the core's `grants.credential` rule lives "in the core plan" | `scripts/validate_network_ops.rb:495` (kind must be `saved_connection`) and `network_ops_check_granted_use` (`:548`) | Unit 08 edits there. |
| D7 | graph hash node at `:1626-1634` | registry loop at `scripts/generate_dungeon_graph.rb:1719`, gated on `kind_built?` (`:1721`); habit read `:427-450` still right | Unit 09. |
| D8 | S7 adds `no_recipe` and `fact_not_held` to `ops_refusal_codes.json` and `REFUSAL_TEXT` | BOTH are already in the fixture and in `JS/minigames/network-view/ops-model.js:34-35`, with other words ("There is no way to do that yet." / "You do not hold what that needs.") | Fixture untouched. Unit 05 rewords the two lines (open item Q5). |
| D9 | the flag station's `processRewardEvents` "gains a `grant_fact` case" | it hands every reward to `applyActions` (`flag-station-minigame.js:1023-1026`), which already handles `grant_fact` (`apply-actions.js:217`) | No flag-station code change. Unit 06 adds the test only. |
| D10 | `startMinigame('ops-cracker', { hashId })` | the framework call takes three arguments: `startMinigame(sceneType, container, params)` (see `patch-panel.test.mjs:242`) | Launch with `startMinigame('ops-cracker', null, { hashId })`. |
| D11 | harness lists: two files copy `minigames/index.js` | three test files name it (`ops-log-viewer.test.mjs` too) | See section 2. |
| D12 | leak scanner at `access_leak_scanner.rb:1270` | the `registry` checks are at `:1497` and `:1788` | Unit 14, by name. |
| D13 | seeder `new-game.rb:410-437`, `:416` | reward replay at `tools/playtest/new-game.rb:431-455`; `give_item` at `:435` | Unit 10. |
| D14 | client lines `keyring.js:774`, `:752-771`; `signin-rows.js:30,184` | `FIND_KINDS` `keyring.js:785`, `screenEntries` `:764`, `entryTagKind` `:54`; `signin-rows.js:30,184` still right | Find by name. |
| D15 | `credential_login.rb:180-181` | the non-connecting refusal is `:192` | Nothing to change. |
| D16 | fixtures "captured before C1" by a compare of its own | the mechanism is `test/support/ops_unchanged_cases.rb` plus `bin/rails app:ops:unchanged:capture ONLY=<name>` (see `lib/tasks/ops_unchanged.rake`), replayed by `bin/ops-golden-compare`; empty `ACCESS_STATE_DEFAULTS` keys are already ignored by `OpsGolden` | Unit 01. No change to `ops_golden.rb`. |
| D17 | S7 "lands after S6 and S8a" | neither is on `ops-crack`; S7 uses nothing from either | Build now (Q6). |
| D18 | tests "at S8b time" for the `.reset` entry (P429-434, P736-738) | no reset entry exists | Not built (Q7). |
| D19 | log rows: "none", and names `credentials_harvested` | the log stream is built; `share_folder_opened` and `technique_used` exist in `lib/break_escape/ops_log_events.rb`; `credentials_harvested` does not (S5b) | See Q2. |

Still right as cited: `CM:26`, `:30`, `:36`, `:39`; `lib/break_escape/npc_habits.rb:24`, `:29`;
`lib/break_escape/item_identity.rb:28-32`; `server_now` at `npc_frustration.rb:60`;
`framework/social-overlay.js:33`; `validate_npc_habits.rb:135-138`, `:257-258`.

## 4. The design, restated for builders

**Scenario fields.**

- Hash record: a `credentials` entry with `kind: "hash"`, `account` (NPC id), `proof` (exactly one: `{ "held": "<itemId>" }` for a takeable file, or `{ "technique_card": "<findingId>" }` with the weakness naming the record in `grants.credential`), optional `salted` (boolean), optional `crackSeconds` (integer 10 to 600, salted records only), optional `crack`. No `connectsTo`. The token is never authored.
- `crack`: closed object. `password` (`strong`, `guessable`, `reused`, `common`; optional when the NPC has a `password` habit, required otherwise; `common` exists only here); `facts` (guessable only: 1 to 4 bare `social.intelFacts` ids, no repeats, never with the `se_intel_` prefix); `passwordPattern` (an object id, the readable clue); `difficulty` (`easy`, `medium`, `hard`).
- NPC `habits.passwordDifficulty` (`easy`, `medium`, `hard`): a habit PARAMETER, not a habit. The record's own `crack.difficulty` wins over it.
- Item `revealsFacts`: array of bare fact ids on an item definition.
- Flag reward `{ "type": "grant_fact", "fact": "<id>", "label": "..." }` in a station's `flagRewards`.

**Difficulty table** (`CrackDifficulty.resolve(record, npc)` returns `{ salted:, crack_seconds: }`,
or nil for an unknown grade from either place):

| Grade | `salted` default | wait default | guessable facts expected |
|---|---|---|---|
| `easy` | false | none | 1 |
| `medium` | true | 60 s | 2 |
| `hard` | true | 120 s | 3 or 4 |
| none | false | 60 s if the record says `salted: true` | no expectation |

A field written on the record always wins. The grade never supplies facts and never changes the class.

**Token.** Derived on each answer, never stored: a keyed digest (key from the app's
`secret_key_base` with a fixed purpose string) over the game id plus, for an unsalted record, the
account's `creds.password`, or, for a salted record, the record id. Shown as 24 characters from a
32-letter alphabet in groups of four. Equal unsalted passwords in one game give equal tokens;
salted tokens match nothing; tokens differ between games. "Salted" always means the resolved value.

**Earned facts.** The set is the union of: (1) `player_state['earnedFacts']`; (2) the `revealsFacts`
of every `startItemsInInventory` definition, read from `scenario_data`; (3) the `fact` of each feed
post the server has served (`feedRevealed`), with one leading `se_intel_` removed. `earnedFacts` is
written in two places only: `add_inventory_item!(item, fact_source: true)` from the STORED copy's
`(item['scenarioData'] || item)['revealsFacts']` (never by an id lookup; never for a notepad or
decor-cup type; inside the not-already-held branch, before the existing `save!`), and
`stamp_earned_facts!(ids)` (writes only ids that name a `social.intelFacts` entry; cap 64) for a
`grant_fact` reward of a flag the server has just accepted.

**Class.** `crack.password`, else the NPC's `habits.password`. No class, an unknown value, an
unknown grade or an account with no `creds.password` fails closed as `no_recipe`.

**`password_held_for?(npc_id)`.** True when the account is in `crackedAccounts`, or the keyring
lists for it a capture entry (with or without the value) or a registry `password` entry whose proof
holds.

**One run** (under `with_lock`):

1. Already held: `cracked`, nothing changes, whatever the pick.
2. `strong`: bump `crackRuns[hashId]` (cap 2); `nomatch` on the first run, `infeasible` after. No wait even when salted.
3. `common`: a hit.
4. `guessable`: if the earned set does not cover `crack.facts`, `needMoreFacts` with `missingCount`; the pick is not compared. Otherwise the pick as a set equals `crack.facts`: hit, else miss.
5. `reused`: the pick is ignored; a hit when some OTHER account that `password_held_for?` has an equal `creds.password`.
6. Unsalted: verdict at once. A hit grants this record's account and the account of every other held unsalted hash record with an equal password. A miss is `nomatch`.
7. Salted (classes other than `strong`): store `crackStarted[hashId] = { "at" => server_now, "hit" => true|false }` and answer `running` with `readyInSeconds`. Posts during the wait answer `running` and read no pick. After the wait the next post gives the verdict: a hit grants that record alone; a miss answers `nomatch` and deletes the entry. At zero the row stays `running` with `readyInSeconds: 0` until a post.

**Grant.** Append the account id to `crackedAccounts`. `cracked_keyring_entries` lists, per cracked
account, `{ id: "<npcId>.cracked", kind: "password", source: "cracked", label: "Cracked", account
block, password }` with the password always attached. One password row per account: if a capture
entry for the account carries the value, leave the cracked entry out; if it carries none, leave the
capture entry out.

**Hash row** (in `GET /keyring`): `id`, `kind: "hash"`, `source: "registry"`, account block,
`label`, `token`, `salted`, `status` (`ready`, `running` with `readyInSeconds`, `infeasible`,
`cracked`). No routes, no `connectsTo`, no password. A record whose grade does not resolve lists no
row. When any hash row is listed the answer also carries `crackFacts` (sorted earned ids).

**Digest.** `keyring_rev` digests `[digested, captures]` exactly as today when there is no
`crackFacts`, and `[digested, captures, crackFacts]` when there is. `readyInSeconds` is left out of
the digest (as `expiresInS` is). `keyring_live_crack_waits(entries)` returns `{ hashId =>
readyInSeconds }` for running rows; the `unchanged` answer carries it as `readyInSeconds` when not
empty.

**Route.** `POST /games/:id/crack`, `games#crack`, policy `crack?` (as `sync_state?`). Params
`hash_id` (string) and `facts` (array of 0 to 4 strings of 1 to 64 characters). Checks in order,
each refusal `{ success: false, reason: "<code>" }`:

1. policy and game load (403 or 404 as every route);
2. `bad_request` 400: `hash_id` missing, not a string or over 200 characters; `facts` not an array, more than 4, or an entry not a 1 to 64 character string;
3. `not_found` 404: not of the registry id form, unknown, not a hash record, or a hash whose proof does not hold now (one body for all four);
4. already held: 200 `status: "cracked"`;
5. `no_recipe` 422;
6. `fact_not_held` 422: any picked id not in the earned set (compared exactly, so an `se_intel_` id fails);
7. the run.

Success: `200 { success: true, status, runs?, missingCount?, readyInSeconds?, accountId?,
credentialIds? }`, `status` one of `nomatch infeasible needMoreFacts running cracked`. Never the
password. Every answer sets `Cache-Control: no-store`.

## 5. Units and waves

Rules for every unit: edit only the files in your list; if you need a change elsewhere, report it.
New Ruby unit tests go in `test/unit/` (pure `lib/` and validators) or `test/models/break_escape/`;
controller tests in `test/controllers/break_escape/`; node tests in `test/js/`. "Done" always
includes: your tests pass, the existing tests you name still pass unmodified, and (after an engine
Ruby edit) `bin/ops-golden-compare` passes with no recapture.

| Wave | Units, side by side | Waits for |
|---|---|---|
| 0 | 01 golden fixtures | nothing; alone, before any engine edit |
| 1 | 02 difficulty table and habit parameter; 03 schema; 04 client hash rows; 05 cracker scene; 06 client fact grants; 07 earned facts on the server | wave 0 |
| 2 | 08 hash kind, token and row; 10 playtest seeder | 02 and 07 |
| 3 | 09 validator and graph; 11 the run and the grant | 08 (and 03 for 09) |
| 4 | 12 the route | 07, 11 |
| 5 | 13 feature scenario and its tests | 03, 04, 05, 06, 09, 12 |
| 6 | 14 leak scanner and verify-run; 15 docs | 13 |

No file appears in two units of one wave. Files touched in more than one wave: `GM` (07 then 08),
`CK` and `ops_cracking.rb` (08 then 11).

### Unit 01: unchanged-scenario fixtures (wave 0, alone)

- **Files:** `test/support/ops_unchanged_cases.rb`; new `test/fixtures/files/ops_unchanged/cracking_keyring.json`, `cracking_inventory_add.json`, `cracking_flag_submit.json`.
- **Build:** three cases, added as the header of `lib/tasks/ops_unchanged.rake` describes. `cracking_keyring`: `GET /keyring` (with and without a matching `rev`) for `test_access_networks`. `cracking_inventory_add`: in a shipped test scenario, a room take, an NPC give, a declared grant and a flag-station re-collect, with each answer and the stored inventory. `cracking_flag_submit`: a `POST` flag answer whose station has `give_item` and `set_global` rewards, with the stored `flag_rewards_claimed`. Capture each with `ONLY=<name> bin/rails app:ops:unchanged:capture` on the untouched tree. If an existing `core_*` or `privilege_*` case already plays the same steps, say so and add only what is missing.
- **Done:** the three JSON files are committed; `bin/ops-golden-compare` passes; no engine file changed.

### Unit 02: difficulty table and habit parameter (wave 1)

- **Files:** new `lib/break_escape/crack_difficulty.rb`; `lib/break_escape/npc_habits.rb`; `scripts/validate_npc_habits.rb`; new `test/unit/crack_difficulty_test.rb`; new `test/unit/npc_habits_password_difficulty_test.rb`.
- **Build:** `BreakEscape::CrackDifficulty` (plain Ruby, no Rails): `GRADES`, the table of section 4, `resolve(record, npc)`, and `fact_band(grade)` for the validator. `NpcHabits::PARAMETERS` becomes `%w[passwordPattern passwordDifficulty]`. In `validate_npc_habits.rb`, beside the `passwordPattern` checks: an unknown `passwordDifficulty` is an error; one on an NPC with no `password` habit warns "passwordDifficulty has no effect without a password habit".
- **Tests:** `resolve` for each grade with no overrides; `salted` written each way; `crackSeconds` written; no grade (false, 60); `easy` with `salted: true` (salted, 60); NPC `hard` with no record grade resolves `hard`; record `easy` beats NPC `hard`; an unknown value from either place returns nil. The two habit-validator rows. `test/unit/npc_habits_test.rb` and `npc_habits_clues_test.rb` pass unmodified (no habit reader changes).
- **Done:** the above, and `ruby scripts/validate_scenario.rb` on two shipped scenarios prints what it printed before.

### Unit 03: schema (wave 1)

- **Files:** `scripts/scenario-schema.json`; new `test/unit/scenario_schema_cracking_test.rb`.
- **Build:** the whole stage's schema in one edit pass, each block edited alone (very long lines; never reformat). In the closed `credentials` entry (about line 284): `salted`, `crackSeconds` (integer 10 to 600), `crack` (closed: `password` enum, `facts` array of strings max 4, `passwordPattern` string, `difficulty` enum with the table in its description). In `habits`: `passwordDifficulty` beside `passwordPattern`; the `password` description stops saying "No run-time effect" and says the cracker reads its class. In `definitions.item`: `revealsFacts` (array of strings). In the `flagReward` type enum: `grant_fact`, with a `fact` string. `credentials` stays `x-serverOnly`; add nothing that ships `crack` to the browser.
- **Tests:** each new field accepted; an unknown `crack` key, a fifth fact, `crackSeconds: 5` and an unknown `difficulty` refused; `test/unit/scenario_schema_test.rb` and `scenario_schema_boot_test.rb` pass unmodified.
- **Done:** tests pass and `git diff --stat` shows only the blocks named.

### Unit 04: client hash rows (wave 1)

- **Files:** `JS/systems/keyring.js`; `JS/minigames/capture-log/signin-rows.js`; `JS/utils/remote-host-text.js`; `test/js/keyring-client.test.mjs`; `test/js/signin-rows.test.mjs`.
- **Build:** `entryTagKind`: a password with `source: "cracked"` is `cracked` (not `in_file`), visible at once, never a find waiting on a `foundIn` file. `FIND_KINDS` gains `hash`; a new hash entry gives the find toast "Hash collected". The store keeps `crackFacts` from a full answer and, from an `unchanged` answer carrying `readyInSeconds`, resets each running hash row's countdown to the served value (an answer without it leaves rows as they were). `signin-rows.js`: hash rows in their own group, each with username, token (grouped in fours), a "Salted" marker, status words, and a Crack button only for `ready` or `running`; a `running` row counts down and at 0 reads "Ready to finish"; a `cracked` row shows the account's password row beside it. The button calls `window.MinigameFramework.startMinigame('ops-cracker', null, { hashId })`. All server strings through `escapeHtml`. `remote-host-text.js`: tag text for `hash` and `cracked` where it lists keyring kinds. No new static import in `keyring.js`.
- **Tests (added to the two existing files):** a cracked password is visible at once and never `findWaiting`; the hash toast; the countdown reset and the no-reset case; the row lists username, token and status and never a password; the button only for `ready` or `running`; "Ready to finish" at 0; a hostile string in a label is escaped. Existing assertions untouched.
- **Done:** both files pass, and so do `capture-log.test.mjs`, `sync-request-sizes.test.mjs`, `keyring-signin.test.mjs`, `keyring-token.test.mjs`.

### Unit 05: the cracker scene (wave 1)

- **Files:** new `JS/minigames/ops-cracker/ops-cracker-model.js` and `ops-cracker-minigame.js`; `JS/minigames/index.js`; `JS/minigames/network-view/ops-model.js` (two `REFUSAL_TEXT` lines only); the copy lists in `test/js/patch-panel.test.mjs`, `test/js/social-authenticator-wiring.test.mjs` and `test/js/ops-log-viewer.test.mjs` where they copy `index.js`; new `test/js/ops-cracker.test.mjs`. CSS, if needed, in a new file of its own beside the scene.
- **Build:** a pure model (state in, view description and next request out) and a `SocialOverlayScene` subclass. It shows the account's headshot or an account icon, the token, the salt marker, and the ids in `crackFacts` as pickable chips labelled from `social.intelFacts`. The player picks one to four and presses Crack; the scene posts `{ hash_id, facts }` to `/crack` and draws the answer: a progress bar while `running`, "N facts still missing", "No match", the infeasible line ("This one will not fall to guessing. Try another way in."), or "Cracked" with the password read afterwards from the keyring. When a countdown ends the open scene posts once by itself with no pick. A refusal is drawn through `refusalText`. It decides nothing and holds no password before the grant. Do not import the `password-guesser` module; copy its row pattern if useful. Register the scene as `ops-cracker` in `index.js`. Reword `no_recipe` to "This hash cannot be cracked." and `fact_not_held` to "You have not learned that yet." (Q5).
- **Tests:** the model renders each status; offers only `crackFacts`; sends fact ids only (no label, token or word); posts once at countdown end and not twice; a stale answer never overwrites a newer one; picks above four are refused in the model; hostile fact labels are escaped. `ops-model.test.mjs` and `network-view-techniques.test.mjs` still pass (every code in the fixture has a line).
- **Done:** the new test passes under plain `node`, and the three harness files pass.

### Unit 06: client fact grants (wave 1)

- **Files:** `JS/systems/inventory.js`; new `test/js/inventory-reveals-facts.test.mjs`; new `test/js/flag-station-grant-fact.test.mjs`.
- **Build:** when an item whose data carries `revealsFacts` enters the inventory (a take, a server item shown, a start item), grant each id on the client so the intel board agrees with the server. Do it through `window.applyActions?.([{ type: 'grant_fact', fact: id }], { source: 'item' })`, so `inventory.js` gains NO static import. A restore on reload must not toast again (the grant is flip-only already). No flag-station code changes (drift D9).
- **Tests:** an item with two facts grants both once; an item without the field grants nothing; a reload grants nothing new; a `grant_fact` reward passed to the flag station's `processRewardEvents` reaches `grantFact`.
- **Done:** both tests pass, with `inventory-server-items.test.mjs`, `item-gain-toast.test.mjs` and `flag-station-polish.test.mjs` unmodified and passing.

### Unit 07: earned facts on the server (wave 1)

- **Files:** `lib/break_escape/item_identity.rb`; new `app/models/break_escape/earned_facts.rb`; `GM` (one `include EarnedFacts` line after `include CredentialKeyring`, four keys in `ACCESS_STATE_DEFAULTS`, the keyword on `add_inventory_item!`); new `test/models/break_escape/earned_facts_test.rb`.
- **Build:** append `revealsFacts` to `FORGEABLE_ITEM_FIELDS` (remove nothing). Add `'earnedFacts' => [], 'crackRuns' => {}, 'crackStarted' => {}, 'crackedAccounts' => []` to `ACCESS_STATE_DEFAULTS` with a comment in the house style (server-written only, never in a sync body or any answer, at most 64). The concern holds `earned_fact_ids` (the union of section 4, sorted), `stamp_earned_facts!(ids)` (known ids only, cap 64, no save of its own when called inside a caller's save; say which in a comment) and the private stamp used by `add_inventory_item!(item, fact_source: false)`. The keyword defaults to false, so every existing caller is unchanged.
- **Tests:** a stamp on add with `fact_source: true`, none with false; none for a notepad or decor-cup type; none on a duplicate add, and one save; the stored copy is read, never an id lookup (an item stored under another item's id earns only its own facts); start-item facts count with an empty inventory; a served feed post's fact counts in both id forms; `stamp_earned_facts!` drops unknown ids and stops at 64; a pre-S7 state with no keys reads as empty.
- **Done:** tests pass; `bin/ops-golden-compare` passes (the new keys are empty, so ignored).

### Unit 08: hash kind, token and keyring row (wave 2)

- **Files:** `CM`; new `app/models/break_escape/ops_cracking.rb`; `CK`; `GM` (one `include OpsCracking` line); `test/unit/credential_model_test.rb` and `test/models/break_escape/credential_keyring_test.rb` (only the assertions that say `hash` is unbuilt: `:9-14` and `:198-202`); new `test/models/break_escape/cracking_row_test.rb`.
- **Build:** `CM:26` becomes `'hash' => { built: true, connects: false }`; `DEFAULT_ACCEPTS` untouched. `OpsCracking`: `crack_token(id, entry, npc)`, `crack_class(entry, npc)`, `crack_status(id, entry, npc)` (reading the state keys; `cracked` from `password_held_for?`), `password_held_for?`, and `hash_keyring_entry`. `registry_keyring_entries` gains a `hash` branch before the connecting branch. `keyring_for_client` adds `crackFacts` when a hash row is listed and passes it to `keyring_rev`, whose third argument is used only when present. Add `keyring_live_crack_waits`.
- **Tests:** taking a share file lists a hash row with token, username, `status: "ready"` and no password; a technique grant lists the same row; the token is stable across reloads, differs between two games, is equal for two unsalted records with equal passwords and matches nothing when salted; grade rows (`hard` with no `salted` lists `salted: true`; `hard` with `salted: false` shares its token; `easy` lists false); an unknown grade lists no row; no keyring answer body contains `difficulty`, `facts` or the password; a hash never signs in (`credential_login` refuses it); for a scenario with no hash row `rev` equals the value before this unit.
- **Done:** tests pass; `keyring_route_test.rb` passes unmodified; golden compare passes.

### Unit 09: validator and dungeon graph (wave 3)

- **Files:** new `scripts/validate_cracking.rb`; `VS` (one `require_relative`, one `run.call('check_cracking')` line after `check_credentials`, the comment at `:7617`); `scripts/validate_network_ops.rb` (`:495` and `network_ops_check_granted_use`); `scripts/generate_dungeon_graph.rb`; new `test/unit/validate_cracking_test.rb` (built as `test/unit/validate_plant_hiding_test.rb` is); new `test/js/dungeon-graph-crack.test.mjs`.
- **Build, errors:** `account` not an account holder; class does not resolve; a `guessable` class (from the record or the habit) without 1 to 4 `facts`, or with repeats; `facts` on another class; a recipe fact with no server-visible source, with the message "fact `<id>` must come from an item the server sees the player get (a takeable item, a share or container file, a takeable NPC held item, a flag reward item or a start item), a feed post or a `grant_fact` flag reward"; `revealsFacts` on an item a declared grant hands over (`DeclaredGrants.for`) with "a timer or object action hands this item over, so the server cannot see the player earn its facts", and on a notepad or decor cup; `revealsFacts` with no `id`; two item definitions with one id where either carries `revealsFacts`; any `revealsFacts`, recipe or `grant_fact` id that is not a `social.intelFacts` id or carries the `se_intel_` prefix; `crackSeconds` on a record that does not resolve salted, or outside 10 to 600; an unknown `crack.difficulty`; `connectsTo` on a hash; `accepts` containing `hash` on a policy; `crack.passwordPattern` naming no object. A source counts only when it is a takeable room object or container content, a takeable share or PC file, a takeable item in an NPC's `itemsHeld`, a station `itemsHeld` item named by a `give_item` reward, a start item, a feed post's `fact`, or a `grant_fact` reward.
- **Build, warnings:** record class differs from the habit; a `reused` crack with no equal password on any other account, registry password entry or capture target; a hash account's password equal to a capture target's when `social.captures.revealSecret` is not true; a grade on a `strong` record ("difficulty has no effect on a strong password; it is a dead end at every grade", and no band warning); a guessable fact count outside its grade's band ("difficulty `hard` expects 3 or 4 facts; this recipe has 1"); `crack.passwordPattern` that does not back the password, or on a class other than `guessable`.
- **Build, the core rule:** in `validate_network_ops.rb` a granted credential may be `saved_connection` or `hash`; for a hash skip `network_ops_check_granted_use`.
- **Build, graph:** edges from the source (the file item or the technique's weakness node) to the hash node, and from the hash node plus each recipe fact's source (item, feed post, flag station) to the `<npcId> password` node, labelled "crack", or "crack (hard)" and so on with a grade. No password text in any label.
- **Tests:** one minimal scenario per rule above plus a clean one; the grade rows (`medium` with 2 and `hard` with 4 clean; `crackSeconds` on `easy` refused, clean with `salted: true`, clean on `hard`, refused on `hard` with `salted: false`; the NPC-grade variants); a technique-granted hash raises no `connectsTo` or policy error. Graph: source edge and "crack" edge present, grade in the label, no password text. `dungeon-graph-grants.test.mjs`, `dungeon-graph-habits.test.mjs`, `dungeon-graph-admin.test.mjs` and `validator-credentials.test.mjs` pass unmodified.
- **Done:** tests pass, and the validator's output on every shipped `test_*` scenario you try is unchanged.

### Unit 10: playtest seeder (wave 2)

- **Files:** `tools/playtest/new-game.rb`; `test/unit/playtest_reward_keys_test.rb` only if the seeder's reward helper is tested there, else a new `test/unit/playtest_seed_facts_test.rb`.
- **Build:** in the reward replay, `give_item` calls `add_inventory_item!(item, fact_source: true)`; a `grant_fact` reward calls `stamp_earned_facts!` and is listed as applied, not as client-only.
- **Done:** a seeded flag whose station has both rewards leaves both facts in `earnedFacts`.

### Unit 11: the run and the grant (wave 3)

- **Files:** `app/models/break_escape/ops_cracking.rb`; `CK`; new `test/models/break_escape/ops_cracking_run_test.rb`.
- **Build:** `crack_refusal(hash_id, facts)` (checks 3, 5 and 6 of the route, pure, writing nothing), `run_crack!(hash_id, facts)` (the run of section 4, caller holds the lock), the grant, `cracked_keyring_entries` beside `implicit_keyring_entries`, and the one-row-per-account rule in `keyring_for_client`. Time comes only from `server_now`.
- **Tests (frozen clock, `travel_to`):** each class's outcomes; `missingCount` right and the pick not compared while facts are missing; a right and a wrong salted pick both answer `running` with the same `readyInSeconds`; the right one then grants, the wrong one answers `nomatch` and the next pick starts a fresh wait; a different pick during the wait changes nothing; zero stays `running`; `hard` waits 120 s, `crackSeconds: 30` waits 30 s, NPC `hard` waits 120 s, record `easy` over NPC `hard` is unsalted; a salted `strong` record answers at once; the unsalted batch grants every held equal record and no unheld one; an unknown grade or a missing habit is `no_recipe` and writes nothing; a captured then cracked account shows one password row, with the value when the capture hides it; a row held from any source reads `cracked`; earning a fact changes `rev`; a running wait keeps `rev` stable across reads one second apart while `keyring_live_crack_waits` falls.
- **Done:** tests pass; `cracking_row_test.rb` and `credential_keyring_test.rb` still pass; golden compare passes.

### Unit 12: the route (wave 4)

- **Files:** `GC`; `config/routes.rb`; `app/policies/break_escape/game_policy.rb`; new `test/controllers/break_escape/ops_crack_test.rb`.
- **Build:** `games#crack` as section 4 gives it, with `no-store` on every answer and the run inside `with_lock`. The inventory route passes `fact_source: true` unless the add was accepted as a declared grant (`@collectible_location[:type] == 'grant'`); `process_item_reward` passes true. `process_flag_rewards` gains a `grant_fact` branch: stamp through `stamp_earned_facts!` under the save it already makes, then forward the reward as `set_global` is forwarded. The `keyring` action's `unchanged` answer carries `readyInSeconds` from `keyring_live_crack_waits` when not empty. Writes no log row (Q2).
- **Tests:** refusals in order with the closed body (a fact id such as `staffId` passes `bad_request`; unknown, non-hash and unheld ids give one identical 404); an already-held account answers `cracked` with an unearned pick; facts stamped by a take, an NPC give and a `give_item` reward; a `grant_fact` reward stamped when the flag is accepted through `submit_flag` and through a flag lock, not before, and not when a transient error rolls a flag-lock unlock back; forgeries ignored (a synced `se_intel_*` global; a synced `earnedFacts`, `crackRuns`, `crackStarted`, `crackedAccounts` or `flag_rewards_claimed`; a `set_global` reward of `se_intel_<id>`; a declared-grant item carrying `revealsFacts`; a notepad posted with a fact item's id; an `add_object` carrying `revealsFacts`; an NPC drop stored under a fact item's id); two parallel posts grant once; no answer body, bootstrap or sync answer in the file holds the password before the grant or any of the four state keys; `POST /crack` leaves the log row count unchanged.
- **Done:** tests pass with `keyring_route_test.rb` and the flag-reward controller tests unmodified; golden compare passes.

### Unit 13: the feature scenario and its tests (wave 5)

- **Files:** new `scenarios/test_ops_crack/` (`scenario.json.erb`, `mission.json`, `ink/` if needed, `PLAYTEST.md`, generated `dungeon_graph.*`); new `test/controllers/break_escape/ops_crack_scenario_test.rb`.
- **Build:** a small test scenario with invented names and `logSources` declared. Cast and records (ids may differ, the shapes may not):
  - `dana`, habit `guessable`: `dana_hash`, a takeable file on a file share, `crack: { difficulty: "hard", facts: [three] }` with `crackSeconds: 10`. One fact from a takeable notes item in the first room, one from a served feed post, one from a `grant_fact` reward of a flag station whose flag is the scenario's own.
  - `farah`, habit `reused`, password equal to dana's: `farah_hash`, a file on the same share, `crack: { difficulty: "medium" }` (the default 60 s wait).
  - `deskAdmin`, a plain account holder with no `password` habit and `creds.admin: true`: `deskadmin_hash`, proof `technique_card` on a weakness that grants it, `crack: { password: "common", difficulty: "easy" }`.
  - `spareDesk`, no habit, password equal to deskAdmin's: `sparedesk_hash`, a file on the share, `crack: { password: "common" }`, unsalted (the batch pair).
  - `eli`, habit `strong`: `eli_hash`, a takeable file inside eli's profile on a sign-in PC that eli owns and deskAdmin can sign in to (the S5a admin read; Q3). No grade.
  The file texts are flavour and hold no token, no password and no real-format string. Passwords are invented. Any `eventMappings` entry goes last. The validator runs with no error and no warning; generate the graph with the `break-escape-dungeon-graph` procedure.
- **Tests:** the playtest beats of section 7 through the real routes with a frozen clock; the log rows the run writes are exactly the acquisition and sign-in rows (`share_folder_opened`, `technique_used` with `grant: credential`, `signin_ok`, `admin_profile_read`) and none from a crack; the validator is clean; `ruby tools/check_mapping_index_drift.rb` passes.
- **Done:** tests pass and a game made with `swap-scenario-game.rb test_access_signin test_ops_crack` boots on a keyless server.

### Unit 14: leak scanner and verify-run (wave 6)

- **Files:** `tools/playtest/lib/access_leak_scanner.rb`; `tools/playtest/verify-run.rb`; new `test/unit/access_leak_scanner_crack_test.rb`.
- **Build:** structural rules, not string matches: a hash row never carries `password`, `routes` or `connectsTo`; a `source: "cracked"` entry may appear only after a `POST /crack` answer (or a keyring answer following one) named its account; the key names `crack`, `facts` (inside a credential), `passwordPattern`, `difficulty`, `passwordDifficulty`, `earnedFacts`, `crackRuns`, `crackStarted`, `crackedAccounts` are a leak wherever they appear in an answer; a `running` answer never carries a hit marker. `verify-run.rb` gains a `crack` line listing each hash record's status and the cracked accounts from the server's state.
- **Tests:** a clean captured run passes; one fixture per rule fails with that rule's message. Existing scanner tests pass unmodified.

### Unit 15: docs (wave 6)

- **Files:** `README_scenario_design.md` (feature index row A21 after A18); `docs/ACCESS_AND_NETWORKS.md` (a section "A21 Hash records and the cracker", the coverage matrix row, and the "Not built" list losing `hash`).
- **Build:** author-facing: the fields, the four classes, the difficulty table, the table of where a fact can come from and what the author does, and the warning that a fact granted only by dialogue, an object action, an OSINT page or a mail highlight does not count. Game-design level; no real tool or format named.
- **Done:** every field in section 4 is documented once, and the docs name the validator `check_cracking`.

## 6. Conflicts and open questions

Builders build each recommendation. "If otherwise" says what changes should the owner choose differently.

**Q1. Game time or a real-time wait for salt.** The outline says "salted hashes cost more game
time"; the plan uses a real server-side wait (default 60 s) and no game minutes. *Recommended: the
plan.* There is no server-held game clock to charge, the server already has `server_now`, and a
client-held clock could not be trusted with a grant. The wait is frozen in tests, so runs repeat.
*If otherwise:* the salt cost needs a server-owned game clock first (a stage of its own); units 11
and 12 would change the `crackStarted` rule and unit 04 the countdown, nothing else.

**Q2. Log rows.** The outline's S9 says every feature route writes a row; the plan writes none.
*Recommended: no row for a crack.* The log is what the target's systems record, and offline work
leaves nothing there; that absence is part of the lesson. The moves around it are already logged
by built events: opening the share folder, the technique that grants a hash, the admin profile
read, and the later sign-in with the cracked password. Unit 13 asserts those rows and asserts the
crack adds none. No edit to `lib/break_escape/ops_log_events.rb`. *If otherwise:* one more unit in
wave 4 adds an event (for example `hash_cracked`, place kind `account`, results `ok`) to the
registry and a `write_log_row!` call in the grant; it must be decided which log source would own
such a row, since no target system sees it.

**Q3. Where a hash comes from: S5a or S5b.** The outline says "from S5a admin, or a file on a
share"; the plan names a file, a technique grant and the S5b collect. *Recommended:* build the two
sources that exist (a `held` file and a `technique_card` grant) and no collect. The outline's
"S5a admin" source is met with built code: a hash file inside an owner's profile, which an admin
session can open (the `eli_hash` record in unit 13). The `harvested` proof and the collect panel
stay S5b's. *If otherwise:* S5b is built next from its own brief; S7's row, scene and route serve
it unchanged.

**Q4. C1 and C2 as one landing.** The plan makes each shippable alone. *Recommended:* build and
land them together, which lets each client file be edited once. *If otherwise:* unit 04 loses its
Crack button and unit 05 its `index.js` registration until a second landing, and the waves split
after unit 09.

**Q5. Words for the two refusal codes (drift D8).** The codes exist with generic words; the plan
wants "This hash can't be cracked." and "You haven't learned that yet." *Recommended:* the plan's
meaning in the table's house style (no contractions): "This hash cannot be cracked." and "You have
not learned that yet." Only the crack route sends these codes. *If otherwise:* unit 05 leaves
`ops-model.js` alone.

**Q6. Order (drift D17).** The plan places S7 after S6 (the skin) and S8a (a second sign-in step).
Neither is built and S7 reads nothing from either: the cracker has one look, and a cracked
password is an ordinary first factor. *Recommended:* build now. When S8a lands, its tests add
"a cracked password still meets the second step".

**Q7. The reset rows (drift D18).** Two test rows need S8b's reset entry. *Recommended:* not built;
the S8b brief must carry them: after a reset the old hash row still reads `ready`, a crack of it
is not answered `cracked` by the reset alone, and a `reused` crack elsewhere does not hit on the
reset entry.

**Q8. The outline's "builds its wordlist from the intel facts".** The plan has the player pick
facts and the server compare the set; nothing is generated. *Recommended:* the plan. It keeps the
move abstract and sends no candidate words anywhere.

**Q9. The hard-grade default wait in the browser.** A 120 s wait per guess is slow to play.
*Recommended:* the scenario's hard record writes `crackSeconds: 10`, the medium record keeps the
60 s default for one beat, and the 120 s default is proved in Rails with a frozen clock.

**Q10. A fact from a flag lock.** No client code reads a flag lock's reward answer, so such a fact
shows as a chip in the cracker but not on the intel board. *Recommended:* leave as the plan has
it; the crack works either way. A later small unit could read that answer.

## 7. Playtest outline (`scenarios/test_ops_crack/PLAYTEST.md`, unit 13)

One game on a keyless server, made with `swap-scenario-game.rb`, driven through `window.__test`
with responses captured for the leak check. No beat sends a forged or hand-built request; those are
Rails tests. Each beat states what the browser shows and what `verify-run.rb` reads on the server.

1. **Start.** The Sign-ins list has no hash group. `crack` line: nothing held.
2. **First hash.** Join the network, open the file share, take dana's file. Toast "Hash collected"; a hash row with username, token, the Salted marker, status Ready and a Crack button. No password anywhere in the capture.
3. **Missing facts.** Open the cracker for dana: no chips yet. Take the notes item; one chip appears. Crack with it: "2 facts still missing", no wait.
4. **Earn the rest.** Read the feed post; submit the flag at the station. Three chips. The intel board shows the same facts.
5. **A wrong pick costs a wait.** Pick two of the three and Crack: a 10 s progress bar, then "No match". The capture shows `running` with no hint of the verdict.
6. **The right pick.** Pick all three: the wait, then "Cracked" with the password; the row reads Cracked and a password row sits beside it.
7. **Reuse.** Take farah's file and Crack with no pick: a 60 s wait, then Cracked (dana's equal password is held). Reload during the wait: the countdown resumes from the server's time.
8. **Common, and the batch.** Take spareDesk's file. Use the technique card on the weakness: deskAdmin's hash row appears with the SAME token as spareDesk's, neither marked Salted. Crack either: both read Cracked at once.
9. **The real path.** Sign in at eli's PC with deskAdmin's cracked password from the keyring; the taskbar shows Administrator.
10. **Strong is a dead end.** Open eli's profile, take the file. Crack: "No match"; again: the infeasible line, and the Crack button goes.
11. **Checks.** Run the leak check over every capture file, oldest first; `verify-run.rb` shows four accounts cracked and eli's record infeasible; the log reader shows the share, technique, profile and sign-in rows and nothing for any crack.

## 8. Security review points

- A hash row, a `running` answer and a refusal say nothing about the recipe; `needMoreFacts` gives a count only.
- The 404 body is identical for unknown, non-hash and unheld ids.
- `revealsFacts` is stripped from every client-built item; the stamp reads the stored copy only.
- A crack always shows the plain password, even where `revealSecret` hides captures; the validator warns when the two meet.
- The token cannot be recomputed without the server key and differs per game.
- This stage widens no existing access check. The only new way to a password is the grant.
