# S7 review: server side, round 1

Reviewed 2026-11-24. Tree: `/data/be-ops-logs`, branch `ops-crack`, `git diff a63e2e952..6ee77a9f9`
limited to `app/`, `lib/`, `config/`, `scripts/`, `scenarios/test_ops_crack/`, `test/` (Ruby) and
`tools/playtest/new-game.rb`. Unit 14 (leak scanner, `abaa7578f`) landed while this was written and is
not reviewed here. Spec: `S7_BUILD_BRIEF.md` (cited as "brief").

## What was run

- `bin/ops-golden-compare` (no outer flock): 19 runs, 0 failures, no recapture.
- The twelve S7 Rails test files plus `credential_keyring_test.rb` and `credential_model_test.rb`: 171 runs, 0 failures.
- A throwaway probe test (a subclass of `OpsCrackScenarioTest`, deleted afterwards) for the points marked "probe" below.
- No shipped scenario other than `test_ops_crack` contains `revealsFacts`, `passwordDifficulty`, `crackSeconds`, a `hash` credential or a `grant_fact`, so none of the new validator rules (including the `osint.rb` one) can fire on them. `git diff --stat` shows no scenario edited outside `scenarios/test_ops_crack/`. A full before/after diff of validator output over all 206 scenarios was started and abandoned (the copy of the old tree could not compile ink, which made the output noisy); the statement above rests on the grep, not on that diff.

## Counts

Blockers 0, majors 2, minors 13.

## What holds up (checked, no finding)

- **Route input.** `facts` as a string, a hash or five entries, and `hash_id` as a non-string, all answer 400 `bad_request` (probe and by reading `games_controller.rb:1962-1969`). An absent `facts` reads as `[]`.
- **Locking.** `crack_refusal` and `run_crack!` both run inside `@game.with_lock` (`games_controller.rb:1973`), which reloads the row under `SELECT ... FOR UPDATE` before either reads state. A second post that arrives during the first waits, reloads, and finds the account in `crackedAccounts` or the wait in `crackStarted`. By reading, two true parallel posts grant once and start one wait. `sync_state` takes the same row lock, so it cannot write a stale `player_state` over a grant.
- **The wait.** There is no `sleep`; the wait is a stored server timestamp (`server_now`) compared on a later post, so it cannot tie up a worker. The length is read from the scenario at finish time and the start time is server-written, so it cannot be skipped. The verdict is stored at the start and a post during the wait does not replace it, so it cannot be replayed with a better pick. A `running` answer has exactly the keys `success`, `status`, `readyInSeconds`.
- **Client-built items cannot earn a fact.** `scenarioData` and `revealsFacts` are both stripped from a client-built item (`CLIENT_ITEM_FORBIDDEN_FIELDS`), `add_item_to_room!` strips `revealsFacts` at both levels, and the stamp reads only the stored copy. The declared-grant path passes `fact_source: false`. `process_item_reward` reads the item from the station's own `itemsHeld`.
- **`habits.passwordDifficulty`** never ships: the NPC filter keeps an allow list (`SHIPPED_HABIT_KEYS`), not a deny list. `credentials` (so `crack`) is `x-serverOnly`.
- **`credential_proof_holds?`** (`credential_keyring.rb:36`): the widening is narrow. A `technique_card` proof still needs the finding in `opsUsed`, and the kind list is closed to `saved_connection` and `hash`. A hash never connects (`connects: false`) and is in no `DEFAULT_ACCEPTS`.
- **A save from before S7.** Missing keys read as empty everywhere (`Array(...)`, `is_a?(Hash)` guards); `keyring_rev` gives the same digest when no hash row is listed. See R1-S5 for the one gap.

## Findings

### R1-S1 (major) The text of unearned item and flag-reward facts ships in the bootstrap

- **Where:** `app/models/break_escape/social_feed.rb:303-318` (`withhold_feed_facts!`, the only filter on `social.intelFacts`); `app/models/break_escape/earned_facts.rb` adds two new server-seen sources with no matching filter.
- **What is wrong:** A feed post's fact is deleted from the bootstrap's `social.intelFacts` until the post is served. S7 adds two more ways the server sees a fact earned (an item's `revealsFacts`, a `grant_fact` flag reward) but their entries ship whole from the first answer. In `test_ops_crack` the bootstrap carries `dana_pet` ("Dana has a cat called Juniper.") and `dana_year` ("Dana joined the firm in 2003.") before the player takes the notes or submits the flag. `dana_town` (the feed fact) is rightly absent. The flag-reward fact is the one meant to cost a VM flag.
- **How to see it:** Probe: `bootstrap_scenario` on a new `test_ops_crack` game returns `social.intelFacts` with `dana_pet` and `dana_year`, text included. The body contains "Juniper" and "2003" and not "Ashby". The existing test at `ops_crack_scenario_test.rb:111` checks only whole passwords and key names, so it passes.
- **Why it matters:** The crack itself is not bypassed (the server still checks its own earned set), so this is not rated a blocker. But two of the three pieces of a guessable password are readable without earning them, and the review rule "no fact the player has not earned in any answer" is broken.
- **Smallest fix:** Extend the bootstrap filter to delete every fact id that is named by any `revealsFacts` or any flag-reward `grant_fact` and is not in `earned_fact_ids`, exactly as feed facts are withheld. Do it for every such fact, not only those in a recipe, so the gap says nothing about recipes. The client then needs the entry when the fact is earned: return it on the inventory-add and flag answers (as the feed route returns its post), or serve labels beside `crackFacts`. Add a test that the bootstrap holds no entry for an unearned item or flag fact.

### R1-S2 (major) The validator counts a container item as a fact source even when it cannot be taken

- **Where:** `scripts/validate_cracking.rb:78-80`.
- **What is wrong:** `crack_item_is_source?` returns true for any item inside a room object's `contents` chain without looking at `takeable`. The server refuses every add of a non-takeable item (`games_controller.rb`, `validate_item_collectible`: "Item is not takeable"). A guessable recipe whose only source for a fact is a readable, non-takeable note in a cabinet passes the validator with no error and can never be cracked. The same file requires `takeable` for a bare room object (`:79`) and for share and PC files (`:82`).
- **How to see it:** By reading. A unit test in `validate_cracking_test.rb` with `contents: [{ type: 'notes', id: 'n', takeable: false, revealsFacts: ['pet'] }]` and a recipe on `pet` would show a clean result.
- **Smallest fix:** Replace line 80 with `item['takeable'] == true` for content items too, and add the test row.

### R1-S3 (minor) A post during a wait reads the pick after all

- **Where:** `app/models/break_escape/ops_cracking.rb:135-136` (`crack_refusal`), against brief section 4, run step 7 ("posts during the wait answer `running` and read no pick").
- **What is wrong:** `fact_not_held` is checked before `run_crack!` looks at `crackStarted`, so a post during a wait with an unearned id answers 422 `fact_not_held`, not `running`. No secret leaks and the scene's own end-of-countdown post sends no pick, so nothing breaks today.
- **How to see it:** Probe: start a wait on `dana_hash`, then post `facts: ["nope"]`: `422 {"success":false,"reason":"fact_not_held"}`.
- **Smallest fix:** In `crack_refusal`, return nil when `crack_started_for(hash_id)` is set, before the fact check. Or state in the brief that the route order wins.

### R1-S4 (minor) The `osint.rb` award-path rule is right in the main case, a little wide, and gives a wrong message

- **Where:** `scripts/validate_social/osint.rb:324-333` (`item_reveals`) and `:347`, `:356`.
- **What is right:** A fact named only by an item's `revealsFacts` no longer errors as "granted by nothing". That is needed and it cannot fire on any shipped scenario.
- **What is wrong:**
  1. Line 356 was written for two causes. With `reveals` added to `outside`, a fact that has an OSINT element or feed post and also an item prints "and also by a pretext call", which is false.
  2. `item_reveals` counts any hash with a `type` and `revealsFacts`, including an item the server never stamps (not takeable, a declared grant, a notepad). `validate_cracking.rb` errors on the last two, and on the first only when a recipe uses the fact. So a fact outside any recipe, on an item nobody can take, now passes as awarded.
  3. A `grant_fact` flag reward, which S7 makes a first-class source, still warns "fine for a stand-in, but the lab needs one OSINT element per fact" (`:361`), while an item source warns nothing. The feature scenario therefore validates with one warning; the brief (unit 13) says none, and `ops_crack_scenario_test.rb:82-89` was written to expect the warning.
- **Smallest fix:** (1) name the third cause in the message; (2) count only items for which `crack_item_is_source?` is true (the function is already loaded by the same validator run), or leave as is and say so in a comment; (3) owner decision, see the list at the end.

### R1-S5 (minor) An item already held never stamps its facts

- **Where:** `app/models/break_escape/game.rb:733-741` (stamp only in the not-held branch) and `games_controller.rb` "Already held and no giver named" early return.
- **What is wrong:** If the fact item is in the inventory with no stamp (a save from before the scenario gained the field, an inventory seeded directly, or any add made with `fact_source: false`), no later add stamps it. The fact can then never be earned and a guessable record needing it stays at `needMoreFacts`.
- **How to see it:** Probe: put `desk_notes` in the inventory with `earnedFacts` empty, post the add again: `{"success":true,"already":true}`, earned set still empty.
- **Smallest fix:** In `earned_fact_ids`, also union the `revealsFacts` of stored inventory copies that are server copies (not a notepad or decor cup type, no client-added marker). This needs care: a declared-grant item is also a server copy, so it would need a marker. If that is too much for this round, document it as a known limit for scenarios edited under live games.

### R1-S6 (minor) The validator does not limit a hash record's proof to the two kinds the brief allows

- **Where:** `scripts/validate_cracking.rb:232-237` (no proof check); the generic proof rules in `validate_scenario.rb` `check_credentials` accept any proof kind.
- **What is wrong:** The brief allows `held` or `technique_card` only. A hash with a `session` or `foothold` proof passes the validator and the server lists its row when that proof holds (`registry_keyring_entries` does not look at the proof kind for a hash).
- **How to see it:** By reading; no test row covers it.
- **Smallest fix:** One error in `check_cracking`: a hash record's proof must be `held` or `technique_card`.

### R1-S7 (minor) The graph: only the picture is affected, but it misleads in three ways

- **Where:** `scripts/generate_dungeon_graph.rb:1760-1803`; see `scenarios/test_ops_crack/dungeon_graph.json`.
- **Answer to the question asked:** The missing link from `crackpw_<npcId>` to `signin_<npcId>` breaks no check. No validator rule reads these nodes; `scripts/lock_key_diff.rb` reads the graph for room reachability, and the `signin_*` nodes already hang off their rooms. (`lock_key_diff.rb` was read, not run.)
- **What misleads:** (1) every `crackpw_*` node is a dead end, so the graph does not show that a crack is a way to the sign-in; (2) a `strong` record gets the same "crack" edge to "Eli Brandt password" as a crackable one, although it never yields; (3) a `reused` record's real dependency (the other account's password being held) is not drawn, and nor is the unsalted batch pair.
- **Smallest fix:** add an edge `crackpw_<npcId>` to `signin_<npcId>` when that node exists; for a `strong` class draw no password node (or label the edge "dead end"); for `reused`, an edge from the other account's `signin_` or `crackpw_` node.

### R1-S8 (minor) Tests that prove less than their names say

- `test/controllers/break_escape/ops_crack_test.rb:240` "two posts in turn grant once": two posts one after the other. It proves the already-held branch, not the lock. The lock is right by reading (see above); nothing in the suite would fail if `with_lock` were removed. A two-thread test with two connections, or a note in the test that the lock is unproved, would be honest.
- `test/unit/playtest_seed_facts_test.rb`: all three assertions are `assert_includes` on the source text of `new-game.rb`. The brief's "done" for unit 10 is a seeded flag leaving both facts in `earnedFacts`; that is not run.
- `test/controllers/break_escape/ops_crack_scenario_test.rb:96` "no object id or name gives away...": reads room objects only. Share files, profile files (`eli_hash_file` contains the forbidden word "hash"), NPC ids, credential labels and fact ids are not read.
- `test/controllers/break_escape/ops_crack_test.rb:385` "no answer holds the password before the grant or a state key": the crack post in it is a refusal (`town` is not earned), so no `running`, `needMoreFacts`, room, inventory or flag answer is read.
- No test asks for the keyring with a `pc_id` while a hash row is listed (`keyring_scope_to_pc` then marks it `forThisPc: false`, `accepted: false`; right by reading).

### R1-S9 (minor) Two password rows for one account when a registry password is gained after a crack

- **Where:** `app/models/break_escape/credential_keyring.rb:315-326`.
- **What is wrong:** The one-row rule compares cracked entries with capture entries only. Crack an account, then pick up the item that proves a registry `password` entry for the same account: the keyring lists both `<id>` (registry) and `<npcId>.cracked`. The other order is fine (the account is already held, so no grant is made).
- **How to see it:** By reading.
- **Smallest fix:** In `keyring_for_client`, also drop a cracked entry whose account has a registry password entry with a value. Or accept and note it.

### R1-S10 (minor) The caps drop silently

- **Where:** `earned_facts.rb:33` (64 facts), `ops_cracking.rb:249` (64 cracked accounts, yet the answer still says `cracked`), `ops_cracking.rb:263` (the oldest wait is thrown away).
- **What is wrong:** A scenario with more than 64 stampable facts or hash accounts loses grants with no error. The validator has no matching rule.
- **Smallest fix:** A validator error when the count of distinct `revealsFacts` plus `grant_fact` ids, or of hash records, passes 64.

### R1-S11 (minor) `password_held_for?` rebuilds the capture entries for every hash row and every account

- **Where:** `ops_cracking.rb:78-87`, called from `crack_status` once per hash row in every `GET /keyring`, and from `crack_reused_hit?` once per account NPC under the row lock.
- **What is wrong:** Each call runs `implicit_keyring_entries` and a registry scan with proof checks. Cost grows as rows times registry size on a route the client polls. Not measured.
- **Smallest fix:** Compute the set of held account ids once per request (a memo on the instance, cleared on reload) and test membership.

### R1-S12 (minor) The feature scenario cannot be finished from inside the game

- **Where:** `scenarios/test_ops_crack/scenario.json.erb:249` (the sign) and `:347` (the flag).
- **What is wrong:** Containers are fine: `lobby_cabinet` (`filing_cabinet_locked1`) and `eli_folder` (`folder`) both have `"locked": false`. But the flag `flag{crack_floor_year}` is written only in `PLAYTEST.md`; nothing in the game shows it, so beat 4 cannot be played without the document. The scripted test also opens the cabinet through `unlock_object` and builds the game with all rooms unlocked and all NPCs met, so it does not show the click path.
- **Ids and names:** nothing gives an answer away. Ids such as `dana_hash` and `eli_hash_file` use the game's own word and the row id is shown to the client anyway. The poster (`it_poster`) states the recipe's shape, by design.
- **Smallest fix:** Put the flag on the lobby sign, as other test scenarios do.

### R1-S13 (minor) Small points

- `app/policies/break_escape/game_policy.rb:33`: `crack?` is `show?`, so an admin or a managing account manager can run a crack on a player's game. This matches `sync_state?`, as the brief says; noted only so that it is a choice.
- `ops_cracking.rb:146,152`: `run_crack!` answers `nomatch` for a record that is not found or has no class. The caller always checks first, so it is unreachable; a raise would be safer than a quiet wrong answer.
- `validate_cracking.rb:15` defines a top-level `CRACK_CLASSES` that repeats `OpsCracking::CRACK_CLASSES`; one of them should read the other or both should read a constant in `lib/`.
- `validate_cracking.rb:63-67`: a station's `give_item` source matches by `item_name` only; the server (`games_controller.rb:4244`) and the seeder also match by `item_type`. The validator is stricter than the server, which is the safe side, but an author will see a false error.
- `validate_cracking.rb:71-73`: an inline `item` under a flag reward counts as a source; the server never gives one (it reads the station's `itemsHeld`). Remove the branch.

## For the owner

1. **Should unearned fact text be withheld (R1-S1)?** Feed facts are. Item and flag-reward facts are not, and in a guessable recipe they are pieces of the password. Withholding them needs a small client change so the entry arrives when earned.
2. **Is a `grant_fact` flag reward a real award path or a stand-in (R1-S4)?** Today the social validator warns on it in every scenario that uses one, including the feature scenario, which the brief says must validate with no warning.
3. **Is a fact with both an OSINT or feed source and an item source an error?** The social validator says yes ("each fact has one award path"); the cracking validator is happy with either. One rule should win.
4. **Unlimited instant guesses on an unsalted guessable record.** With all facts earned, a client can try every subset at once. Is `easy` meant to be that easy, or should a wrong unsalted guess cost something?
5. **`missingCount` as a hint.** It falls by one each time the player earns a recipe fact, so it tells them which facts matter. The brief accepts "how many, never which"; this is close to "which".
6. **Typing the password without the cracker.** A guessable password is the fact words joined, so a player who has read the three facts can type it at the PC and skip the hash. Intended as part of the lesson, or should the feature scenario's password be less direct?
7. **Scenarios edited under live games (R1-S5).** Is it acceptable that a player who already holds a fact item never earns its fact?
8. **The graph for a `strong` record (R1-S7).** Should a dead end be drawn at all?
