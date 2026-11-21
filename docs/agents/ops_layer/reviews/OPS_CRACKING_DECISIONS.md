# OPS_CRACKING decisions (R1 outcomes and later orchestrator changes)

Plan: `docs/achitechture/OPS_CRACKING_PLAN.md`. Review: `OPS_CRACKING_R1.md`.

## R1 findings

- B1 accepted: the recipe lists fact ids in `crack.facts`.
- B2 accepted: facts the crack reads are server-granted (user ruling); the proof the hash was collected is also required.
- B3 accepted: grants recorded in `crackedAccounts`, served by its own builder as `<npcId>.cracked`.
- B4 accepted: `account` and proofs are strings, as the registry schema has them.
- M1 accepted: no runtime use of `clues.rb`; an unresolvable class fails closed with `no_recipe`.
- M2 accepted: a hash on a share is a plain `text_file` with `credential`; no `hash_file` kind.
- M3 accepted: own keyring row branch, the client files named, validator rules in `validate_cracking.rb`.
- M4 accepted: cracked entries tagged `cracked`; the leak scanner learns them.
- M5 accepted: `missingCount` counts unearned recipe facts; the pick must equal the recipe set; the class is not a secret.
- M6 accepted: no `reuse_from`; a `reused` run ignores the pick.
- M7 accepted: HMAC token, never stored, equal for equal unsalted passwords.
- M8 accepted: all crack state is server-only, never a sync section.
- M9 partly accepted: server-timed wait plus unsalted batch, no game minutes; the run count stays only for `strong`'s `infeasible`. The salt model is now a user question (plan section 15).
- m1 accepted: row lock, caps, idempotent repeats, `no-store`, closed refusal codes.
- m2 accepted: repeated requests change nothing.
- m3 accepted: no `slotGuess`.
- m4 accepted: launch from the hash row and the collect panel; no inventory tool item.
- m5 accepted: harness copy lists named; no import from the password guesser.
- m6 accepted: golden fixtures through `bin/ops-golden-compare`.
- m7 accepted: stages C1 and C2 each with a named test.
- m8 superseded: cracking writes no log rows.
- n1 fixed.
- n2 fixed (section 9 wording).
- n3 fixed in the rewritten sections.

## Orchestrator changes after R1

- Fact sources widened: a `grant_fact` entry in a station's `flagRewards`, counted once the server accepts the flag (`process_flag_rewards`, `flag_rewards_claimed`). Browser-reported outcomes still do not count. Validator error: a fact must come from a takeable item, a feed post or a flag reward.
- Salt model moved to section 15 as a question: (a) server-timed wait plus batch, recommended and written; (b) run count; (c) batch only.
- Privilege plan examples: section 14 asks it to use a string `account` and to add `crack.facts` to its guessable recipe. That plan was not edited.

## R2 fixes (2026-11-19)

- B1 fixed: `add_inventory_item!` gains `fact_source:` (default false); the inventory route passes false for a declared grant (`@collectible_location[:type] == 'grant'`). Validator refuses `revealsFacts` on a declared-grant item, a notepad or a decor cup; source list narrowed to server-checked paths; table row and forgery test added. The endpoint's missing trigger check is not planned here (orchestrator raises it).
- M1 fixed: source 2 reads only `startItemsInInventory` definitions; every lookup uses `restamp_item_credential!`'s guards; `revealsFacts` appended to `FORGEABLE_ITEM_FIELDS` as an additive change beside the lock plan's `secondStep`; notepad and `add_object` tests.
- M2 fixed: `crackFacts` digested in `keyring_rev`; `readyInSeconds` left out and served on `unchanged` through `keyring_live_crack_waits`; rev tests added.
- M3 fixed: `process_flag_rewards` stamps `grant_fact` facts into `earnedFacts` when the flag is accepted; the derived flag source is dropped; section 8 row updated; rollback test on the flag-lock path.
- M4 fixed: `test/unit/validate_cracking_test.rb`, C1 rows and C2 rows, one case per rule, in the build steps.
- m1 fixed: section 14's privilege requests replaced with the three new mismatches (recipe-rule ownership, the `reused` check, the poster example).
- m2 fixed: validator runs the `Clues` backing check on `crack.passwordPattern` and warns on an unbacked `reused` recipe.
- m3 fixed: section 2 and section 5 describe NPC gives and room takes as the existing best-effort checks and name the hard gates.
- m4 fixed by deferring the verdict: every complete pick on a salted record waits; `crackStarted` holds `{ at, hit }`; a miss clears the entry so the next pick waits again. Section 1 and question 1's option (a) reworded to match; the question stays open on (a)/(b)/(c).
- m5 fixed by the second option: a flag-lock `grant_fact` shows only in the crack scene's chips; no new client path (flag-lock `set_global` is already dropped today, outside S7).
- m6 fixed: `no_hash` becomes `not_found`; `no_recipe` and `fact_not_held` added to `ops_refusal_codes.json` and `REFUSAL_TEXT`; "where it exists" dropped.
- m7 fixed: `facts` entries are 1-64 character strings; new fields use bare ids, `se_intel_` prefix refused by the validator; feed-post facts normalised once.
- m8 fixed: one predicate `password_held_for?`, holding not seeing; both rules taken: section 7 says a crack always shows plain text, and the validator warns when `revealSecret` is off and a hash password equals a capture target's. One-row rule keeps whichever entry carries the value.
- m9 fixed: build order matches the outline; C2 example uses `technique_card` and a habit-less account; feature scenario uses a plain account holder.
- m10 fixed: `cracking_inventory_add.json` and `cracking_flag_submit.json` fixtures added.
- m11 fixed: keyring-client, signin-rows, flag-station and graph tests added.
- m12 fixed: S7 makes the core `connectsTo`/policy warning skip `hash`, with a test; section 14 says so.
- n1 fixed: `network_access.rb` and `credential_login.rb` paths given under `app/models/break_escape/`.
- n2 fixed: `crackStarted.at` is `server_now` float seconds.
- n3 fixed: two hook lines and `check_cracking` named.
- n4 fixed: scanner assertion stated.
- n5 fixed: harness names given; `exercise-station.test.mjs` unchanged.
- n6 fixed: already-cracked moved to check 4, before `no_recipe` and `fact_not_held`.
- n7 fixed: hash row `cracked` comes from `password_held_for?`.
- n8 fixed: `running` at 0 until the next post; the scene posts once by itself; the row reads "Ready to finish".
- n9 fixed: validator refuses duplicate item ids where either carries `revealsFacts`.

## R3 fixes (2026-11-19)

- M1 fixed: the stamp reads `revealsFacts` from the stored, server-built copy after the notepad/decor-cup skips, never by id lookup; section 2 drops the false "client-added" guard and describes the KO-drop id path; forged KO-drop test added to `ops_crack_test.rb`. The same path's `credential` re-stamp is named as a dependency the fix does not rely on (raised with the user separately).
- m1 fixed: `Game#stamp_earned_facts!` shared by `process_flag_rewards` and `tools/playtest/new-game.rb`'s reward replay; `new-game.rb:416` passes `fact_source: true` (it replays a flag's `give_item`, a server-accepted source); listed in section 12 and C2 steps, with a seeder test.
- m2 fixed: `crackFacts` digested only when present, so `[digested, captures]` and `rev` are unchanged without hash rows; test compares `rev` to the pre-C2 value.
- m3 fixed: validator error for `revealsFacts` with no `id`; test rows for it and for a `guessable` habit with no `crack`.
- m4 decided as mirror-the-habit: error when `crack.passwordPattern` names no object, warning when it does not back the password, warning on a non-guessable class. Reason: the crack yields on `crack.facts`, not the readable clue, so an unbacked clue is a teaching weakness, not a dead puzzle; and the habit and privilege plan already treat it as a warning. Three test rows.
- m5 fixed: NPC-held source must be takeable (rule, error text, section 5 table, test row).
- n1 fixed by accepting the tell: a salted `strong` answers at once; section 5 says so and points to section 7.
- n2 fixed: core's rule adopted; a string `hash_id` not of the id form answers `not_found`.
- n3 fixed: "This hash can't be cracked."
- n4 fixed: `keyring-client.test.mjs` covers `readyInSeconds` on an `unchanged` answer.
- n5 fixed: section 14's privilege requests marked taken (privilege plan L280-296, L888-893, commit 79ce67a33), kept as a record; one line on the core code count going from twelve to fourteen.
- n6 fixed: the case is named as a transient Hacktivity error on a flag lock, rolled back before rewards run; test reworded.
- Coordinator nit fixed: the core's `grants.credential` `connectsTo`/policy check is called "the core's S3 error rule" (core L1381) in section 9, the C1 test rows, section 12 and section 14, not a warning.

## R4 fixes (2026-11-19)

- F1 fixed: section 5 says the stamp does its own `ALWAYS_ALLOWED`/`DECOR_CUPS` type check (the skips live in `restamp_item_credential!`) and runs inside the not-already-held branch of `add_inventory_item!` before its `save!`; a test row says a duplicate add earns nothing new.
- F2 fixed: sections 9 and 14 cite the core's S3 rows and the refusal-code paragraph by name instead of line number (they had moved to L1386/L1393, L1181, L1841, skin L627); the kind rule that adds `hash` is now named as a second change.
- F3 fixed: the `passwordPattern` backing check takes the account's room NPC (an `accountOnly` one included) and is skipped when none has `creds.password`.
- F4 not applied: it needs a new validator warning, not a one-line change; the loss is a missed fact, never a wrongly granted one.
- F5 fixed: one sentence in section 5 says `Api::GamesController#inventory` is unrouted and passes no `fact_source`.

## Round 3 decisions applied (2026-11-19)

- R3-3 a: section 15 question 1 removed; section 1 states the 60 s real-time wait per salted guess as a design fact, with the reason the run count and batch-only options were dropped.
- R3-4 a: section 15 question 2 removed; section 4 states `common` is recipe-only, with the reason. Section 15 now reads "None."
- R3-4 note: optional `crack.difficulty` (`easy`/`medium`/`hard`) added on the hash record's recipe only (section 4), setting `salted`/`crackSeconds` defaults (easy unsalted; medium salted 60 s; hard salted 120 s) and a guessable fact-count band (1 / 2 / 3-4) checked as a validator warning; written fields override; it supplies no facts, does not change the class and adds no state.
- Shared table `lib/break_escape/crack_difficulty.rb` (`CrackDifficulty.resolve`) used by server and validator; token and wait read the resolved salt (section 5); unknown difficulty fails closed with `no_recipe`; difficulty never reaches the browser (section 7); no state key (section 8).
- Section 9: validator rules (enum, `crackSeconds` against resolved salt, fact-band warning), schema enum, graph edge label "crack (hard)".
- Sections 3, 10, 11, 12: C1 row, unchanged-scenario note, `crack_difficulty_test.rb` and test rows in the row, validator and route tests, feature scenario record per difficulty, build step and new-file list.
- No section 14 request: the privilege plan's examples need no change, since difficulty is optional.

## Round 3 delta fixes (2026-11-19)

- Placement (user: difficulty "when specifying the password"): optional habits parameter `passwordDifficulty` (`easy`/`medium`/`hard`) beside `passwordPattern` in `NpcHabits::PARAMETERS` (`lib/break_escape/npc_habits.rb:29`, skipped by `sources` at `:114`); validated in `validate_npc_habits.rb`, added to the schema habits object and to C1 (built with S7). Not a habit: the habit list stays strong/guessable/reused.
- `CrackDifficulty.resolve(record, npc)`: the record's `crack.difficulty` first, then the NPC's `passwordDifficulty`, then none. Facts still come only from the authored `facts`. Test rows added (resolver, validator, route, game-row cases).
- Cross-plan: a fourth request to the privilege plan recorded in section 14 of this plan (one line, for its next edit); the privilege plan itself not edited in this pass.
- Minor 1: "Where it lives" now says a person's account is graded on its hash record (`guessable` also needs `facts`, `accountOnly` needs `crack.password`) and names the habit-side default.
- Minor 2: the validator test row now reads "`crackSeconds` on a record that does not resolve salted", matching the resolution rule.
- Nit 1: `resolve` returns nil for an unknown value (record or NPC); the keyring row lister lists no hash row and `POST /crack` answers `no_recipe`. Added a validator warning for a difficulty on a `strong` record (no band warning), with a test.

## Cross-plan R8 fixes (2026-11-19)

- m3: the `crackSeconds` rule resolves the grade as the record's `crack.difficulty`, else the NPC habit `passwordDifficulty`, else none, matching the validator test.
- n1: the request lead-in reads "Four requests ... all taken" and request 4 points to privilege plan section 4, L283-286.
- n2: "the band warning above" now reads "below".
- n3: the overview names the NPC `passwordDifficulty` as the second place to grade a record, the record's grade winning.

## Section 14 dependency closure (2026-11-19)

- Sync deltas: the entry is now this plan's own obligation under `SYNC_DELTAS_PLAN.md` section 11 (that plan is not edited); the four state keys are server-only, never sent, never re-sent whole, with a C2 test line; section 8's "growth table gains these rows" sentence now points to section 14. `crackFacts` stays marked open: it goes whole in each changed-`rev` keyring answer, which that section's rule 4 forbids, and making it a delta is a design choice no plan settles.
