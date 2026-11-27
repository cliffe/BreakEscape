# OPS_CRACKING_PLAN.md: round 2 adversarial review

Plan under review: `docs/achitechture/OPS_CRACKING_PLAN.md` (619 lines, stage S7, feature A21), at
commit `c22d57701` in the `ops-plan` worktree.
Standard: `docs/agents/OPS_LAYER_BRIEF.md` sections 3, 5 and 7; the rulings in
`docs/agents/ops_layer/BRIEF_cracking_reviser.md` and `USER_PICKS_2026-11-19.md` (SHARED-3,
BLOCK-2, R2-2); R1 and its decisions file.
Grades: blocker, major, minor, nit. Plan line numbers are given as `L<n>`.

Short names: `GC` = `app/controllers/break_escape/games_controller.rb`, `GAME` =
`app/models/break_escape/game.rb`, `CK` = `app/models/break_escape/credential_keyring.rb`, `CM` =
`lib/break_escape/credential_model.rb`, `II` = `lib/break_escape/item_identity.rb`, `DG` =
`lib/break_escape/declared_grants.rb`.

## Summary

| Grade | Count |
|---|---|
| Blocker | 1 |
| Major | 4 |
| Minor | 12 |
| Nit | 9 |

R1's four blockers are fixed. Facts come from server events, the recipe lists fact ids, the grant
has its own list and builder, and the registry shapes are correct. One new hole remains. An item
handed over by a timer or object action is a "declared grant", and the server lets the client
claim it at any time with no trigger check. If that item carries `revealsFacts`, a forged
`POST /inventory` earns the fact, and the validator as written accepts the item as a
server-visible source (B1). Two majors are about the earned set: the start-item source can be
satisfied by a client-built notepad carrying a borrowed id (M1), and the flag-reward source needs
controller-private code that the model cannot call (M3). One major is a keyring cache bug: `crackFacts` and
`readyInSeconds` sit on the wrong side of the keyring digest (M2). The validator rules have no
tests (M4).

The salt model as written survives reloads and retries. Nothing new grows in synced state. A crack
cannot succeed without the hash record's proof, `harvested` included.

## Orchestrator's points, re-checked

- **`flag_rewards_claimed` is written only by `process_flag_rewards`.** Holds. The only appends
  are `GC:3987-3988`. `GAME:7567` initialises it to `[]`. `GAME:4544` and `GC:3560` read it. It
  is not a `sync_state` section: `merge_last_write_wins_sections` (`GC:2745`) and
  `merge_grow_only_sections` (`GC:2860`) take only named sections, and none of them is this key.
- **The mounted `POST inventory` stores the server's copy.** Holds (`GC:1426-1441`,
  `canonical_inventory_item` at `GC:3315-3333`). Two exceptions matter to this plan. When
  `@collectible_item` is nil (the notepad, `GC:3362-3365`, and decor cups, `GC:3368-3371`), it stores the
  client's hash minus `CLIENT_ITEM_FORBIDDEN_FIELDS`, with a client-chosen `id` (see M1). A
  declared grant is accepted with no trigger check (`GC:3384-3399`; see B1).
- **`api/games_controller.rb` is not routed.** Holds: `config/routes.rb` has no `api` scope, and
  the file's `add_inventory_item!(item.to_unsafe_h)` (`:43`) is unreachable.

**Is `revealsFacts` read from the scenario's own definition?** For source 1 yes: L250-253 says
"found as `restamp_item_credential!` finds it, never the client's item body", and that lookup
(`GAME:749-773`) matches type and id and skips notepads and decor cups. Source 2 (L254-255) says
only "read from their definitions", which does not carry those guards (M1).

**Is `revealsFacts` on the stripped forgeable list?** No. `II:28-32` `FORGEABLE_ITEM_FIELDS`
lists lock, card, flag and behaviour fields plus `credential`; `revealsFacts` is not there, so a
client-built notepad or an unsourced `add_object` keeps it (`GC:3304-3308`, `GAME:1183-1196`).
The plan's server reads should not depend on that field. Adding it to the list is still cheap
defence in depth (M1).

## Blocker

### B1. A declared-grant item carrying `revealsFacts` can be claimed at any time, and the validator accepts it as a source.

- Plan: L197-200 ("When the server adds that item to the inventory (taken, given by an NPC, or a
  flag reward)"), L250-253, L262-264 ("exactly three kinds of server event"), L268-275 (the
  table has no row for a timer or object-action `give_item`), L428-431 (a source is "an item with
  `revealsFacts` naming it").
- Code: `GC:3384-3399` accepts any item that matches a declared grant, with the comment "NOTE: no
  trigger check; a declared grant can be claimed at any time". `DG:7-21` defines declared grants:
  `give_item` on `timers[i].actions`, `triggerOnInteract`, `onInteract.actions`,
  `completionActions` and `conditionalActions`, all run by the browser. `canonical_inventory_item`
  stores the grant's server copy and `add_inventory_item!` runs. `CM:249` `item_definition` also
  walks declared grants, so the source-1 stamp finds the definition and its `revealsFacts`.
- Effect: an author puts `revealsFacts` on an item a timer or object action hands over. The
  validator passes it because it is "an item with `revealsFacts`". From then on, a tampered client
  can post that item with no source and earn the fact before the timer fires or the object is
  touched. That breaks BLOCK-2 ("recorded only when the server sees the event that reveals it"),
  and a credential grant can then rest on a forged event.
- Fix:
  1. Server: no facts are stamped for an add whose `@collectible_location[:type]` is `'grant'`.
     Pass the location to the stamp (for example `add_inventory_item!(item, fact_source: false)`
     from the inventory route), or stamp in the controller from the validated location rather
     than inside `add_inventory_item!`.
  2. Validator, in `validate_cracking.rb`: `revealsFacts` is an error on an item that sits on a
     `DeclaredGrants.for` path and on a notepad or decor-cup type. A recipe fact's source counts
     only when the item is reachable through a server-checked path: a takeable room object or
     container content, a takeable share or PC file, an NPC's `itemsHeld`, a flag station's
     `itemsHeld` named by a `give_item` reward, or `startItemsInInventory`. Rewrite the error text
     at L429-430 to match ("a takeable item" is also wrong for NPC-held items, which need not be
     takeable).
  3. Section 5 table: add a row "an item a timer or object action hands over (`give_item`
     outside ink): no, the browser claims it; put the fact on a takeable item, an NPC's held item
     or a flag reward".
  4. Test (L490-492, forgeries): a declared-grant item with `revealsFacts`, posted with no
     source, adds the item and earns no fact.

## Major

### M1. The start-item source reads "items in the inventory now", and a client-built notepad can borrow a fact item's id.

- Plan: L254-255 ("The `revealsFacts` of items in the inventory now, read from their
  definitions (covers start items...)"), L262-263, L340-341.
- Code: a notepad passes `validate_item_collectible` at once (`GC:3361-3365`, `ALWAYS_ALLOWED_ITEMS`
  at `GC:3277`). `canonical_inventory_item` then stores the client's hash with the client's `id`
  (`GC:3316-3318`). `CM:210-250` `item_definition(scenario, id)` matches on id alone. Only
  `restamp_item_credential!` adds the type match and the notepad and decor-cup skips
  (`GAME:760-770`).
- Effect: if source 2 is built as "for each held item, `item_definition(id)['revealsFacts']`",
  `{ "type": "notepad", "id": "dana_vet_card" }` earns `dana_dog_name`. The plan's wording does
  not rule this out.
- Fix: make source 2 "the `revealsFacts` of every `startItemsInInventory` definition", read from
  `scenario_data` alone, with no inventory read. (A start item is the player's from the first frame,
  so it needs no proof of holding.) Or stamp start items into `earnedFacts` where
  `initialize_player_state` seeds them (`GAME:7532-7553`) and drop source 2. Either way, state
  that every definition lookup uses `restamp_item_credential!`'s guards (type equal, id equal, no
  notepad or decor cup, no `clientAdded` item). Add `revealsFacts` to `II:28-32`
  `FORGEABLE_ITEM_FIELDS`, so neither client filter keeps it. Tests: a notepad posted with a fact
  item's id earns nothing; an `add_object` carrying `revealsFacts` stores the item without it.

### M2. `crackFacts` sits outside the keyring digest and `readyInSeconds` inside it, so the `unchanged` answer goes stale or churns.

- Plan: L316-320 (the hash row carries `status` and, while running, `readyInSeconds`; the answer
  carries `crackFacts`), L381-384, L414-415.
- Code: `CK:84` answers `{ rev, entries, captures }`, and `CK:238-241` `keyring_rev` digests
  `entries` and `captures` only. `GC:1880-1885` answers `{ rev, unchanged: true }` when the
  client's `rev` matches. K5 solved the same problem for tokens: `expiresInS` is left out of the
  digest (`CK:239`) and rides on the `unchanged` answer (`keyring_live_expires`, `CK:89-95`).
- Effect: a newly earned fact does not change `rev`, so a client that sends its `rev` gets
  `unchanged` and its scene keeps offering the old fact list. Meanwhile a running salted crack
  changes `readyInSeconds` every second, so `rev` changes on every poll, and every answer is the
  full answer.
- Fix: put `crackFacts` inside the digested value (for example digest
  `[entries, captures, crackFacts]`). Leave `readyInSeconds` out of the digest as `expiresInS` is,
  and add it to the `unchanged` answer through a sibling of `keyring_live_expires`. The digest
  still changes when `status` moves from `running` to `cracked`. Test: earning a fact changes
  `rev`; a running crack keeps `rev` stable across two reads one second apart and both answers
  carry the falling `readyInSeconds`.

### M3. The flag-reward source needs controller-private code that the model module cannot call.

- Plan: L236-237 ("It reads only `scenario_data`, `player_state` and the server clock"),
  L256-260 (resolved "as `find_flag_rewards`, `GC:3897`, finds it"), L320 (`crackFacts` in
  `GET /keyring`, built in the model), L409-410.
- Code: `find_flag_rewards` (`GC:3897-3946`), `find_flag_station_for_flag` (`GC:4242`),
  `resolve_flag_value` (`GC:4197-4201`) and `find_flag_station_by_id` (`GC:4088`) are private
  controller methods. The resolver reads `@game.resolve_flag_ref` and falls back to
  `player_state['flags_by_vm']` (`GC:4273-4290`). `CK` and the planned `ops_cracking.rb` are
  model concerns.
- Effect: as written, either the builder moves about 150 lines of flag resolution into the model
  (a refactor the plan does not list in section 12), or it copies the code and the two drift
  apart. The earned set is also recomputed through VM flag resolution on every `GET /keyring` and
  every `POST /crack`.
- Fix (simplest): stamp the facts once, at acceptance. In `process_flag_rewards`, a `grant_fact`
  reward appends its `fact` to `player_state['earnedFacts']` (only ids that name a
  `social.intelFacts` entry, under the existing save) and is forwarded to the browser. Drop source
  4 as a derived read. Update L256-264 and L409-410 to match, and add "a flag the server accepts
  with a `grant_fact` reward" to the `earnedFacts` row of section 8 (L404). The flag-lock path runs inside
  the unlock transaction (`GC:1335-1355`), so a rolled-back unlock rolls back the stamp too. A save
  from before C2 has no stamped flag facts. That is fine, because no shipped scenario has a
  `grant_fact` reward.

### M4. The validator's rules have no tests.

- Plan: section 9 rules L425-436; section 11 (L473-512) names no validator test; build steps
  L516-519 list none. Brief section 3 requires schema and validator checks with unit tests.
- Fix: add `test/unit/validate_cracking_test.rb` (as `test/unit/validate_plant_hiding_test.rb`)
  with one minimal scenario per rule: `account` not an account holder; no resolvable class; a
  `guessable` crack with 0, 5 or repeated facts; a fact with no server-visible source, plus B1's
  declared-grant and notepad cases; `facts` on a non-guessable class; `crackSeconds` without
  `salted` or out of range; `connectsTo` on a hash; `accepts: ["hash"]`; an unknown
  `revealsFacts` or `grant_fact` id; the class-mismatch warning; and the widened `grants.credential`
  rule (L441-442), which section 11 never names. Put the file in C1's build steps and its
  rows in C2's.

## Minor

### m1. Section 14's two requests to the privilege plan are already done, and three new mismatches are missing.

- Plan L572-579. The privilege plan already writes `"account": "priyaN"` (its L246-249) and gives
  its guessable recipe `facts` (its L289-291).
- Mismatches to raise instead:
  1. The privilege validator (its L886-889) requires `passwordPattern` on a `guessable` recipe,
     where this plan makes it optional (L184-186). One plan owns the rule; say which.
  2. The privilege plan (its L888-889) expects this plan to check "a `reused` source that exists".
     This plan has no such rule (see m2).
  3. Its example fact `it_rota_poster_seen` comes "from finds and items (a note, a file, a
     poster)" (its L284-291). Under this plan's L275 a read-only poster is not a server-visible
     source, so the example fails this plan's validator unless the poster is takeable or the fact
     also comes from a flag reward.
- Fix: replace L574-579 with these three requests.

### m2. The validator does not check that a record-level `reused` or `guessable` recipe is backed.

- Plan L184-186 says `passwordPattern` lets "the habit validator's backing check" run on a record
  with no habit, but no rule in section 9 runs it, and `validate_npc_habits.rb` walks NPC habits,
  not registry records. A `reused` recipe on an account with no habit has no check that any other
  account or registry password has an equal `creds.password`, so the crack can be dead.
- Fix: in `validate_cracking.rb`, run the `Clues` backing check on a record's
  `crack.passwordPattern` (authoring time only, as `clues.rb:9-13` allows). Warn when a `reused`
  recipe has no other account, registry `password` entry or capture target with an equal
  `creds.password`. Add both to M4's test file.

### m3. The plan calls NPC gives and room takes server-seen; they are the existing best-effort checks.

- Plan L103-105 ("NPC gives checked against `npc_given_items`"), L271 ("yes, the inventory route
  checks the NPC held it").
- Code: an NPC give is checked only for "NPC encountered and holds the item" (`GC:3449-3475`).
  `npc_given_items` records gifts after the fact (`GC:1444-1446`); it does not gate them. A room
  item in an unlocked room (`GC:3431-3438`) is claimable without visiting the room. The
  conversation that hands an item over is not seen by the server.
- Fix: say so in the L271 row and the L262-264 paragraph. An NPC give or room take counts on the
  inventory route's existing sanity check, which the cheat policy allows for dialogue-gated steps.
  An author who needs a hard gate uses a container behind a lock, a share file, or a flag reward.
  Correct L104.

### m4. On a salted record, the instant `running` versus `nomatch` answer tells the player at once whether a pick is right.

- Plan L42-46, L299-304. Only a correct pick starts the wait, so a wrong pick answers `nomatch`
  instantly. The salt wait then costs nothing during the search, and `running` means "right".
- This is a refinement of the open question's option (a), not a reopening of it. Either state it
  as intended (the wait stands for the run against this record's salt after the right candidate
  is found), or defer the verdict: any complete pick on a salted record starts the wait, and the
  answer at the end is `cracked` or `nomatch`. Deferring needs one boolean stored beside
  `crackStarted[hashId]` (the pick's outcome, never the pick), still bounded at 64.

### m5. A `grant_fact` reward from a flag lock never reaches the intel board.

- Plan L213-214 ("The server forwards it to the browser as it forwards `set_global`, so the
  intel board shows the fact too"), L340-343.
- Code: only the flag station handles `rewards` (`flag-station-minigame.js:625-626`, `:926-930`,
  `processRewardEvents` at `:1023`). The flag-lock unlock answer carries `response[:rewards]`
  (`GC:1354`), but no client code reads it, so `set_global` rewards on flag locks are already
  dropped there today.
- Fix: either handle `rewards` in the unlock answer's client path (and test it), or state that a
  flag-lock `grant_fact` shows only in the crack scene's chips (served from `crackFacts`). The
  crack itself is unaffected.

### m6. The refusal codes do not line up with the core list and its `REFUSAL_TEXT` test.

- Plan L355-375. The core plan's shared list (`OPS_CORE_PLAN.md` L1100-1106) uses `not_found` for
  a 404, and its node test asserts that every code in `ops_refusal_codes.json` has a
  `REFUSAL_TEXT` line (its L1454). The core plan builds that file before S7, so "where it exists"
  (L374-375) is always true.
- Fix: reuse `not_found` in place of `no_hash`, or keep `no_hash` and say why. Add the codes to
  `test/fixtures/files/ops_refusal_codes.json` and their words to `REFUSAL_TEXT` (or to a crack
  scene table that the same test reads), and drop "where it exists".

### m7. The `facts` parameter check refuses real fact ids.

- Plan L350-351 and L358-359: each entry must match "the registry id pattern"
  (`CM:40`, `^[a-z][a-z0-9_]{0,63}$`). The schema puts no pattern on `social.intelFacts` keys
  (`scenario-schema.json:497-500`), and shipped scenarios use `staffId`. A legitimate pick of
  such a fact answers `bad_request`.
- Fix: check each entry as a string of 1 to 64 characters and let check 5 (`fact_not_held`) do
  the rest. Or add a validator error that a recipe fact id matches the pattern. Also say whether
  a recipe may name a fact with the `se_intel_` prefix (`validate_social/awareness.rb:1829`
  accepts both forms elsewhere) and normalise it once.

### m8. "The keyring already serves a password" is undefined, and a cracked entry can show a password that `revealSecret: false` hides.

- Plan L286-287, L295-297, L308-313.
- Code: a capture entry exists without a `password` value when `social.captures.revealSecret`
  is not true (`CK:266-287`). A registry `password` entry never carries a value (`CK:330-343`).
- Effect: the plan uses "serves a password" in three places: the already-cracked test, the
  `reused` comparison and the de-duplication. Read as "an entry exists", a captured but
  unrevealed account shows `cracked` with no password in the scene. Read as "a value is served",
  cracking a `reused` account whose twin was captured unrevealed shows the twin's password in
  plain text through the `.cracked` entry.
- Fix: define one predicate, for example `password_held_for?(npcId)`, and use it in all three
  places. Then decide one of two rules. (a) The validator warns when a scenario with
  `revealSecret` not true has a hash record whose password equals a capture target's. (b) A crack
  always reveals the plain text, and the plan says so in section 7.

### m9. Examples and the feature scenario lean on terms from stages that build after S7.

- Plan L127 ("S7 lands after S3 and before S5b"; the outline's order is S6, S8a, S7, S5b, S5c,
  `OPS_LAYER_PLAN_OUTLINE.md` L148). L178-181 and L189-194 use `accountOnly` (S5c) and the
  `harvested` proof (S5b, not in `CM:36` until then) in the C2 example. L505-507 puts an
  `accountOnly` account in `test_ops_crack`.
- Effect: S7 itself depends on no later stage. Its C2 example, though, fails `proof_kind` and the
  validator at S7 time, and the feature scenario names a field nothing reads yet (the NPC schema
  is open, so it passes silently).
- Fix: phrase the rule as "an account with no `password` habit" and mention `accountOnly` only as
  S5c's future case. Give the C2 example a `held` or `technique_card` proof. Build the
  feature scenario's `common` account as a plain habit-less account holder. Make L127 match the
  outline.

### m10. The unchanged-scenario fixtures do not cover the two existing routes that C2 edits.

- Plan L461-467. C2 changes `add_inventory_item!` (every take) and `process_flag_rewards` (every
  flag), and adds a `grant_fact` branch. The fixtures cover `GET /keyring`, one bootstrap and
  the validator output.
- Fix: add `cracking_inventory_add.json` (a take, an NPC give and a flag-station re-collect in a
  shipped scenario: answer bodies and stored inventory) and `cracking_flag_submit.json` (a
  `POST /flags` answer with `give_item` and `set_global` rewards, and the stored
  `flag_rewards_claimed`), captured with the others before C1.

### m11. Client changes have no JS tests, and the graph edges have none.

- Plan L336-343 changes `keyring.js` (the `cracked` tag, the hash find toast), `signin-rows.js`
  (the hash group and Crack button) and the flag station's `processRewardEvents`, and adds
  `grantFact` on an inventory add. L450-454 adds graph edges. Section 11 (L500-503) tests only the
  scene's model.
- Fix: extend `test/js/keyring-client.test.mjs` (a `cracked` password is visible at once and is
  never `findWaiting`) and `test/js/signin-rows.test.mjs` (the hash row, its Crack button only
  for `ready` or `running`, no password on the row). Add a flag-station test for the `grant_fact`
  case, and a graph test that the hash node has its source edge and its "crack" edge with no
  password text.

### m12. The core plan's S3 warning about where a granted credential can be used also needs the hash exception.

- Plan L441-442 and L581-582 widen the core error rule (`OPS_CORE_PLAN.md` L1326). The core
  warning rule at its L1319 ("`grants.credential` whose `connectsTo` PC blocks remote sign-in or
  whose policy does not accept `saved_connection`") would then fire for every technique-granted
  hash, which has no `connectsTo` and is never accepted by a policy.
- Fix: S7 also makes that warning skip `hash` entries, with a test.

## Nits

- n1. L118: `network_access.rb` is `app/models/break_escape/network_access.rb`, not under `lib/`.
  L88: `credential_login.rb` is also under `app/models/break_escape/`; give the path.
- n2. L406: `crackStarted` holds "server ms", but `server_now` returns float seconds
  (`npc_frustration.rb:60-62`). Name one unit.
- n3. L421-422: the hook is two lines, a `require_relative` beside `VS:26` and a
  `run.call('check_cracking') { check_cracking(json_data) }` beside `check_credentials` (`VS:8968`), as the core plan
  writes it (its L1292-1294). Name the function.
- n4. L497-498: "learns the `cracked` entries and passes on them" should state the assertion R1 M4 asked for: a
  `cracked` entry is present only when `crackedAccounts` holds its account, and no hash row
  carries `password`.
- n5. L502: name the harnesses that copy `minigames/index.js` (`test/js/patch-panel.test.mjs`,
  `test/js/social-authenticator-wiring.test.mjs`). `exercise-station.test.mjs:31` copies the
  guesser, which S7 no longer imports, so it needs no change.
- n6. L363-365 against L286-287: a request for an already-cracked account with an unearned pick
  answers `fact_not_held` rather than `cracked`. Either move the already-cracked answer before
  check 5 or say the order is intended.
- n7. L316-319 and L566: say how the hash row's `status` reaches `cracked` (the same predicate as
  the run's already-cracked test, m8), since the privilege plan asks for a row whose account's
  password is held from any source to read as cracked.
- n8. L301-304: say what the row and scene show once `readyInSeconds` reaches 0 and before the
  next `POST /crack` (still `running` with 0, or `ready to finish`), and whether the scene posts
  again by itself.
- n9. L250-253: `item_definition` returns the first match by id across the whole scenario
  (`CM:210-250`). Add a validator error for two item definitions that share an id when either
  carries `revealsFacts`, so the stamp cannot read the wrong one.

## Checks that pass

- **A forged sync.** The four new keys are server-only, outside every `sync_state` section, and in
  `ACCESS_STATE_DEFAULTS`, which the bootstrap does not ship (`credential_login.rb:107`). The
  `se_intel_*` globals are never read. L490-492 tests both.
- **A feed post the server never served.** `feedRevealed` is written only by
  `reveal_feed_post!` (`social_feed.rb:51-111`), which refuses an NPC the player has not met and
  enforces the pace floor and the source rules. No sync section writes it.
- **A flag reward claimed twice.** The earned set is a union, so a repeat adds nothing. Under M3's
  fix the stamp is grow-only and idempotent.
- **A reload.** The re-sent inventory is answered `already` without an add (`GC:1416-1425`).
  `crackStarted` and `crackRuns` are server-held, so a reload resumes the wait and cannot restart
  or skip it. A Restart (`reset_player_state!`, `GAME:113-122`) wipes the inventory and the facts
  as well, so it gains nothing.
- **The `harvested` proof.** Check 3 (L360-361) refuses a record whose proof does not hold now.
  The unsalted batch grants only "held" records (L299-300). A second PC's record cannot be cracked
  or listed without its own proof.
- **Leaks before the grant.** `credentials` (and so `crack`) is `x-serverOnly` (`SCH:282`).
  `creds.password` is read only by the `.cracked` builder. The answer bodies carry no password
  (L370-372), the three `no_hash` cases share one body, and an unknown fact id answers as
  `fact_not_held`. The token is a keyed digest that cannot be inverted.
- **Accounts with no password habit.** The class comes from `crack.password` (L178-181), and
  `common` is enum-checked in the schema (L445-446) and resolved at run time (L280-282, fail
  closed). Only the backing check is missing (m2).
- **Synced growth.** Nothing new is a sync section. Every key is bounded (L402-407), and
  `crackFacts` is bounded by the authored facts.
- **Brief section 5.** It has its own validator file (n3 on the hook), golden fixtures through
  `bin/ops-golden-compare`, which already strips empty `ACCESS_STATE_DEFAULTS` keys
  (`OPS_LOG_ROWS_PLAN.md` L510-512), and closed `{ success: false, reason }` refusals (m6).
- **Log rows.** It writes none, as `OPS_LOG_ROWS_PLAN.md` L1158-1159 and L1238-1239 expect, and
  the keyring's existing secret source covers `.cracked` entries.
- **Build order.** S7 depends only on earlier stages (S3's `technique_card`, the core refusal
  list, L1a's golden helper, S8a's second step). The S8b reset (L313-314) is described behaviour,
  not a dependency.
- **Section 15.** Both questions are open for the user, each with options and a recommendation.
