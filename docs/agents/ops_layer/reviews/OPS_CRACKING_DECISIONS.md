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
