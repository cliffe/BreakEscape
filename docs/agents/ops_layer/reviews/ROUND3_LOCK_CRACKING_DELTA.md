# Round 3 delta review: lock second step (G4) and cracking difficulty

Scope: `docs/achitechture/OPS_LOCK_SECOND_STEP_PLAN.md` (commit 72fa1a349) and
`docs/achitechture/OPS_CRACKING_PLAN.md` (commit 61a8bc8bc), against the decisions in
`USER_PICKS_2026-11-19.md`, "Round 3" (R3-3, R3-4, R3-5, R3-8). No plan edited, nothing committed.
No SecGen XML or exploit field guide opened.

## Verdicts

- **Lock plan: pass with one major and two minors.** G4 is buildable and refuses no legitimate flow
  that the plan lists. The id-less `ceo_exfil` tablet needs a stated rule.
- **Cracking plan: pass with two minors and a nit.** Difficulty cannot let a crack win without the
  facts, weakens no server check and adds no synced state. The placement question has an answer
  (below) that the plan does not state.

## Lock plan

Checks that held:

- R3-5: the re-add wording promises only what the server enforces; the "carriedGone" option is gone
  from section 15, which reads "None open". No review or round reference remains in the file.
- Scenario list. Rendered every `scenarios/*/scenario.json*` through `BreakEscape::ScenarioBinding`
  (all render, ERB ones included) and listed top-level carriers with a lock or `contents`: a
  `startItemsInInventory` entry, an NPC `itemsHeld` entry, or a `takeable` room object. Result is
  exactly four objects in the three named scenarios: `test_start_cryptex`, `test_courier_bag`
  (`test_unlock_gaps`), the `ceo_exfil` "Tablet Device", and `m5_locked_terminal`
  (`test_social_m5_channels`). No other scenario holds one, so the list is complete. The only
  existing test touching these is `payload_scan_opened_state_test.rb:144-153`, which reads the
  scenario, not a crafted request after removal.
- Cost. `carried_step_chains` gets one entry per top-level carrier, is built in the existing single
  walk and memoised, and a nested `takeable` has no entry. Bounded, and a scenario with no carried
  container pays one empty-table check. Four entries across all shipped scenarios.
- Legitimate flows walked against the Rule D legs: give then open (held), start item (held from the
  start), drop into an unlocked room (dropped leg), KO drop of an NPC bag (`objects_added` leg),
  room carrier in place (leg 2 true, room test decides), take of the carrier itself (chain minus
  itself is empty, true), nested container inside a held bag (deepest carrier judged). None is
  refused.

### Findings

**Major 1. Plan 5.5 "Plain carried containers", `ceo_exfil` sentence (around line 773-777).** The
tablet in `reception` has no `id` (`scenarios/ceo_exfil/scenario.json.erb:171-179`). Chains, Rule D
leg 1 and every closed-list route are keyed by id. The plan lists the tablet as a touched object and
the section 11 shipped-scenario row says the run covers "the reception tablet", but the plan never
says what an id-less plain carrier gets. The validator rule at line 917 refuses an id-less carrier
only above a `secondStep` object, so nothing covers this. A builder could key the table by nil or
by name, and `ItemIdentity.held_in?` falls back to type and name when ids are absent
(`item_identity.rb:106-120`), so the outcome would depend on the choice. Fix: add one sentence to
5.5: a plain carrier with no `id` gets no entry, is reachable by no id-keyed route, and is left as
today; the tablet is therefore listed as "in the list, unchanged". Add it to the "Plain carriers:
chain table" test row ("none for an id-less carrier"). Keep the line-917 rule unchanged (gated
carriers still need an id).

**Minor 1. Line 689-691 (Rule D trigger) and line 975-977 (section 10).** The trigger text still
reads "neither the object nor any object on its path has an id in `carried_step_ids`", and section
10 says Rule D acts "only on a path holding an id of its subset `carried_step_ids`". After G4 the
trigger is the union of `carried_step_ids` and the plain carriers. G4's own paragraph says so, and
section 10 is scoped "G1 to G3", so it is not wrong, but a builder reading 5.5 top to bottom meets
the G1 trigger first. Fix: end the Rule D paragraph with "(from G4 the trigger also includes plain
carriers, below)".

**Minor 2. G4 test row, nothing for a takeable `usb` or `hideable` plain carrier.** A takeable
`usb` stick with `contents`, or a `hideable` device that holds contents, is a plain carrier by the
plan's definition ("a lock or `contents`"). The planted-stick and implant routes
(`network_access.rb:262`, `:516`) take the item out of the inventory without `remove`, so Rule D
would now refuse a later `GET /container` on it. That is the intended direction, and no shipped
scenario has one, but the fixture list should include one so the behaviour is decided rather than
found. Fix: add "a takeable stick with `contents`, after a plant" to the G4 fixture row.

**Nit 1. Section 10 "ops_unchanged ... all five scenarios".** The count is not defined near the
sentence. Fix: name them or point to the earlier list.

## Cracking plan

Checks that held:

- No weakened server check. Difficulty supplies `salted` and `crackSeconds` only. `facts` is read
  from the authored list at the server, `needMoreFacts`, `fact_not_held` and the exact-pick check
  are untouched, a `strong` record stays a dead end, and a `guessable` record with no `facts` is
  refused by the validator. The "band" is a validator warning and the server never reads it.
- No synced state. The plan states `crack.difficulty` adds no key, is resolved from `scenario_data`
  on each answer, stays out of the bootstrap (`credentials` is stripped) and out of every keyring
  answer, and tests that no keyring body contains the word `difficulty`. Nothing in the browser;
  the client already takes `readyInSeconds` from the server.
- Unknown value. Section 5 adds "an unknown `crack.difficulty`" to the closed list, so a
  hand-edited game row answers `no_recipe` and writes nothing; the validator refuses it at
  authoring. A test row covers the game-row case.
- Shared module. `lib/break_escape/crack_difficulty.rb` sits beside `npc_habits.rb` and
  `credential_model.rb`, which `scripts/` already `require`; one `resolve` serves the server and the
  validator, with its own unit test. Sensible.
- R3-3 and R3-4 are applied as picked: the wait defaults to 60 s of real time, and `common` stays
  recipe only. Section 15 reads "None". The plan mentions no review or round.

### Placement answer

An author can already set a difficulty for a person's account, but only through a hash record. The
player cracks a hash record, never a habit: the hash record names its `account`, and a person with a
`password` habit has a hash record like any other holder (the habit supplies the class, line 213).
So `"crack": { "difficulty": "hard" }` on that record grades a person's password, for a `strong` or
`reused` habit with nothing else needed, and with `facts` added for a `guessable` habit (line 266
already requires the facts). An `accountOnly` account is the same with `crack.password` required.
What an author cannot do is write the grade next to the password in the NPC's `habits`, once, for
every record of that account. The plan does not say any of this; the "Where it lives" bullet reads
as if a person's account were not covered.

Minimal change if the habit-side setting is wanted: add `passwordDifficulty` (`easy|medium|hard`) to
`NpcHabits::PARAMETERS` beside `passwordPattern` (`lib/break_escape/npc_habits.rb:24`), validated in
`scripts/validate_npc_habits.rb` with the same enum, and let `CrackDifficulty.resolve(record, npc)`
use it as the grade when the record has no `crack.difficulty` (order: record `salted` or
`crackSeconds`, then `crack.difficulty`, then the habit's `passwordDifficulty`, then defaults). It
touches no habit reader, because a parameter is not a habit. The unknown-value rule then covers the
habit value as well. It is optional: the hash-record route works with no engine change.

### Findings

**Minor 1. "Where it lives" bullet (lines 248-253).** Does not answer whether a person's account
can carry a difficulty. Fix: add the two sentences above ("a person's account is graded on its hash
record, `guessable` also needs `facts`; a habit-side default is a later `passwordDifficulty`
parameter, not built here") so the author-facing story matches the user's question.

**Minor 2. Test line 730, "`crackSeconds` without `salted`".** Reads as a flat rule, but the
resolved rule (line 647, tests at 738-740) allows `crackSeconds` with no `salted` key on a `hard`
or `medium` record. Fix: reword to "`crackSeconds` on a record that does not resolve salted".

**Nit 1. Unknown difficulty in `CrackDifficulty.resolve`.** The plan fails closed in `POST /crack`
but does not say what `resolve` returns for an unknown value when the keyring row is listed (token,
`salted` marker). If it falls back to unsalted, a hand-edited row lists a shared token. Fix: say
`resolve` raises or returns nil for an unknown value, and the row lister and `POST /crack` treat
that as no recipe. Also consider a validator warning for `difficulty` on a `strong` record (no
effect at any grade); the plan tests that no band warning appears, which is right, but silence may
mislead an author.
