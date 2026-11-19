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
