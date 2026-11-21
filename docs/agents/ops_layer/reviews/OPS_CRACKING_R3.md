# OPS_CRACKING_PLAN.md: round 3 delta review

Plan under review: `docs/achitechture/OPS_CRACKING_PLAN.md` at `4edaa255b` (824 lines), delta
`git diff fbecdc5a3 HEAD`. Previous round: `OPS_CRACKING_R2.md`; fixer outcomes under "R2 fixes" in
`OPS_CRACKING_DECISIONS.md`. Code read in this worktree; the branch changes no file under `app/`
or `lib/`, so the code is main's. Plan lines are `L<n>`.

Short names: `GC` = `app/controllers/break_escape/games_controller.rb`, `GAME` =
`app/models/break_escape/game.rb`, `CK` = `app/models/break_escape/credential_keyring.rb`, `CM` =
`lib/break_escape/credential_model.rb`, `II` = `lib/break_escape/item_identity.rb`.

## Summary

| Grade | Count |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 5 |
| Nit | 6 |

R2's blocker and four majors are fixed as written. The declared-grant hole is closed on the
server and in the validator, start items no longer read the inventory, flag facts are stamped at
acceptance, `crackFacts` is in the digest and `readyInSeconds` rides on `unchanged`, and the
validator has a test file. The m4 fix holds: a salted pick cannot be judged before its wait ends,
reload and retry gain nothing, and nothing new is synced.

One new forgery path remains (M1). The stamp re-finds the definition by the stored item's `id`,
and one existing server path stores an item under an id the client chose: an NPC KO drop of a held
item that has no id. That lets a tampered client earn any item's facts. The fix is to read
`revealsFacts` from the server copy the route already validated instead of looking it up by id.

## Questions asked, answered

1. **Can a fact be earned without the server seeing the event?** Yes, through M1. Every other
   path checks out. `add_inventory_item!` callers: `GC:1441` (inventory route, true unless
   `@collectible_location[:type] == 'grant'`, `GC:3395`), `GC:4006` (`process_item_reward`, true),
   `api/games_controller.rb:43` (not routed, default false is right), test callers, and
   `tools/playtest/new-game.rb:416`, which the plan does not list and which defaults wrongly
   (m1). The notepad and decor-cup adds reach the stamp with `fact_source: true` (location nil,
   `GC:3362-3371`), but the type guards stop them (`GAME:762-763`). An unsourced `add_object` gets
   a fresh server id (`GAME:1193`), so no definition matches it.
2. **Does the salt wait leak a right pick?** No. Every complete run on a salted record answers
   `running` with the same `readyInSeconds`; `hit` lives only in server-held `crackStarted`, which
   is outside every sync section and outside the digest. A new pick during a wait is not read; a
   miss deletes the entry only after the wait. Reload resumes from `at`; Restart wipes. Two
   parallel first posts: the second finds a wait running inside the lock and its pick is dropped.
   Nothing grows in synced state. One small tell remains (n1).
3. **`keyring_live_crack_waits` beside `expiresInS`.** Correct, and the same pattern as K5
   (`CK:89-95`, `GC:1880-1885`): left out of `keyring_rev`, served as a `{ id => seconds }` map on
   `unchanged`. A `running` row at 0 keeps its status, so `rev` does not move until the verdict
   post. Two gaps: digesting `crackFacts` must not change `rev` for scenarios with no hash rows
   (m2), and no JS test covers the client applying the map (n4).
4. **`not_found` and the `REFUSAL_TEXT` words.** `not_found` matches the core list
   (`OPS_CORE_PLAN.md` L1157, L1169-1174). Both lines are plain UK English, blame nobody and name
   nothing missing; `fact_not_held` gives no count at all, which is fine. "Record" is not the word
   the player sees anywhere else (n3). The 400/404 split for a malformed `hash_id` differs from the
   core's rule (n2).
5. **Section 14 requests.** The privilege plan took all three at `79ce67a33`, after the fixer's
   commit: `OPS_PRIVILEGE_ACCOUNTS_PLAN.md` L280-296 (this plan owns `crack` rules, the poster is a
   takeable `notes` item with `revealsFacts`) and L888-893 (no `passwordPattern` requirement, the
   `reused` check deferred here). The core already reads as asked: L1374 (warning skips `hash`)
   and L1381 (error widens to `hash`). L764-779 still reads as open requests (n5).
6. **`validate_cracking_test.rb`.** One case per rule, except two rules that have no case or the
   wrong expected severity (m3, m4).

## Major

### M1. A forged NPC KO drop stores an item under a client-chosen id, and the stamp then reads another item's `revealsFacts`.

- Plan: L289-295 ("The definition is the server's own, found with `restamp_item_credential!`'s
  guards (`GAME:749-773`: type equal, id equal, no notepad, no decor cup, no client-added item)"),
  L123-125, L543-544.
- Code: `POST /games/:id/room` `add_object` takes `sourceNpcId` and `sourceType` from the client
  (`GC:1097-1104`). In `add_item_to_room!`, `find_npc_held_item` matches a held item with no id by
  type and name (`GAME:2268-2283`), and the stored object takes
  `'id' => held_item['id'].presence || item['id']`, the client's id (`GAME:1135-1137`). A
  `npc_defeated` drop from an encountered, non-immune NPC in the room records the KO itself
  (`GAME:1101-1107`, `npc_ko_claimable?` at `GAME:2029-2034`). A later `POST /inventory` for that
  id matches `objects_added` first (`GC:3606-3614`), passes as a room item, and is stored as that
  object. `restamp_item_credential!` then looks up `item_definition(scenario_data, id)`
  (`GAME:765-770`), which matches on id alone (`CM:210-250`), and the guards pass when the types
  agree. There is no client-added check in `restamp_item_credential!`; the plan's "no client-added
  item" guard is not in the code.
- Failure: Dana holds an id-less `notes` item named "Shopping list". A tampered client sends
  `add_object` `{ type: "notes", name: "Shopping list", id: "dana_vet_card" }` with
  `sourceNpcId: "dana"`, `sourceType: "npc_defeated"`, then takes `{ type: "notes", id:
  "dana_vet_card" }`. The stamp reads the vet card's definition and earns `dana_dog_name`. The
  player never took the vet card, which may sit in a locked container. The same path re-stamps a
  `credential` today, so it can also mint a `held` proof (an existing engine bug, outside this
  plan; raise it with the orchestrator).
- Fix: read `revealsFacts` from the server copy the add stores, not from a lookup by id. Every
  client path strips the field once it is in `FORGEABLE_ITEM_FIELDS` (`GC:3318`, `GAME:1184`), and
  every stored copy that keeps it was built by the server: the scenario object
  (`canonical_inventory_item`, `GC:3315-3333`), the NPC's held item (`GAME:1135`), the player's
  held copy (`GAME:1154`) or the station's item (`GC:4003`). So: `add_inventory_item!(item,
  fact_source: true)` stamps `(item['scenarioData'] || item)['revealsFacts']`, after the existing
  notepad and decor-cup skips. Replace L291-295 with that rule and correct the "no client-added
  item" claim at L124 and L293. Optionally also stop `add_item_to_room!` adopting a client id for
  an id-less held item (a server id such as `"#{room_id}_drop_#{hex}"`); that closes the
  credential hole too, but it changes the KO-drop pickup, so it needs its own test. Test in
  `ops_crack_test.rb`: the forged KO drop above earns no fact.

## Minor

### m1. The playtest seeder bypasses the new stamp, so seeded games never earn flag facts.

- Plan: L289-291 (default false "so a new caller stamps nothing until it opts in"), L703-707 (build
  steps name only the inventory route and `process_item_reward`).
- Code: `tools/playtest/new-game.rb:410-437` replays `process_flag_rewards` by hand for seeded
  flags (the standing way to give flags here). It calls `g.add_inventory_item!(item)` (`:416`),
  which under the plan stamps nothing, and sends `grant_fact` to the `else` branch as
  "client-only, not applied" (`:432-433`).
- Failure: the scripted playtest of `test_ops_crack` (L680-684), or any mission whose recipe fact
  comes from a flag reward, seeds the flag and then sees `needMoreFacts` forever. That reads as a
  stuck mission.
- Fix: put the `grant_fact` stamp in one model method (for example `Game#stamp_earned_facts!(ids)`)
  that `process_flag_rewards` and the seeder both call; pass `fact_source: true` at `:416`. List
  `new-game.rb` in section 12's shared files and C2's steps.

### m2. Adding `crackFacts` to the digest changes `rev` for every scenario unless it is left out when absent.

- Plan: L399-404 ("it digests `entries`, `captures` and `crackFacts`"), L590 (golden `GET
  /keyring` for `test_access_networks`).
- Code: `CK:238-241` digests `JSON.generate([digested, captures])`. A third array element, even
  `nil` or `[]`, gives a different MD5 for the same entries. The golden helper fails on a changed
  body (`OPS_LOG_ROWS_PLAN.md` L510-512), and `rev` is in the body.
- Failure: the C2 golden compare fails for `test_access_networks`, or the implementer drops `rev`
  from the comparison to make it pass.
- Fix: digest `[digested, captures]` when the answer has no `crackFacts`, and
  `[digested, captures, crackFacts]` only when it does. Test: `rev` for a scenario with no hash row
  equals the value captured before C2.

### m3. An item with `revealsFacts` and no `id` is counted as a source but can never stamp.

- Plan: L535-538 (source list), L557-558.
- Code: the planned lookup and `restamp_item_credential!` both return when the id is empty
  (`GAME:765-766`). Many scenario items are addressed by name or `opens_lock` only.
- Failure: an author puts `revealsFacts` on an id-less note; the validator passes; the server
  never stamps; the crack is dead. If M1's fix (read from the stored copy) is taken, the id stops
  mattering for the stamp, but the client's `grantFact` and the graph edge still need a stable
  identity.
- Fix: validator error "an item with `revealsFacts` needs an `id`", with a test row. Also a
  `guessable` habit with no `crack` record (L197-198 says it is refused) has no test row; add one.

### m4. The `passwordPattern` rule asks for "the error" the habit check gives, but the habit check's backing result is a warning.

- Plan: L547-548, L631 ("`crack.passwordPattern` with no backing clue: the backing error").
- Code: `scripts/validate_npc_habits.rb:135-138` gives an **error** only when `passwordPattern`
  names no object; the backing check is a **warning** (`:267-277`, "has password \"guessable\" but
  it is not backed"). `:257-258` also warns on a pattern without `guessable`. The privilege plan
  (L1308) expects "your fact-reachability warning".
- Failure: the C2 test asserts an error the rule cannot give, or the implementer makes the crack's
  rule stricter than the habit's without saying so.
- Fix: mirror the habit: error when `crack.passwordPattern` names no object; warning when the
  pattern does not back the password; warning on `passwordPattern` with a class other than
  `guessable`. Three test rows.

### m5. "An NPC's `itemsHeld`" as a source leaves out the takeable check the server makes.

- Plan: L535-537. R2 B1's fix text said NPC-held items "need not be takeable"; the code says
  otherwise.
- Code: `validate_item_collectible` refuses a non-takeable item at every location, NPC included
  (`GC:3415-3421`, before the location branches). A flag station's re-collect also needs it;
  `process_item_reward` does not (`GC:3999-4006`).
- Failure: an NPC holds a non-takeable card with `revealsFacts`; the validator counts it; the give
  is refused, so the fact is never earned.
- Fix: the source list reads "a takeable item in an NPC's `itemsHeld`". A flag station's item named
  by a `give_item` reward stays as written.

## Nits

- n1. L355: a salted `strong` record answers `nomatch` at once while every other class waits, so
  the first press shows the class one press earlier than unsalted records do. The second press
  says `infeasible` anyway. Either let a salted `strong` run wait too, or say the tell is accepted.
- n2. L447-448: a `hash_id` that is a string but not of the id form answers `bad_request` here and
  `not_found` under the core's rule (`OPS_CORE_PLAN.md` L1146-1158, "an id that is a string but not
  of the id form"). Neither leaks; pick the core's rule or say why this route differs.
- n3. L469: the player sees "hash" everywhere else ("Hash collected", the hash row). "This hash
  can't be cracked." matches. "You haven't learned that yet." is fine.
- n4. L425 and L677-680: no JS test covers the client taking `readyInSeconds` from an `unchanged`
  answer. Add one to `keyring-client.test.mjs`.
- n5. L764-779: the privilege plan took all three requests at `79ce67a33` (its L280-296, L888-893).
  Restate them as agreed, with those lines. The core's count "twelve" (its L1169, and the skin
  plan's L614) becomes fourteen with S7; the core already says later plans add codes (its L1828),
  so a one-line note in this section is enough.
- n6. L298 and L647: the only rollback in the flag-lock path is raised before rewards are processed
  (`GC:1340-1344`; rewards at `:1350-1354`), so "a rolled-back unlock rolls the stamp back" cannot
  happen today. Name the case the test covers: a transient Hacktivity error on a flag lock leaves
  no stamp.

## Checks that pass

- **Declared grants.** `@collectible_location` is `{ type: 'grant' }` exactly when the grant branch
  accepts (`GC:3389-3398`), and grant items always carry an identity (`declared_grants.rb:45-53`),
  so `addressed_by?` compares by id (`II:91`) and a real take is never misread as a grant.
- **Start items.** Source 2 reads `startItemsInInventory` from `scenario_data`; a name-matched
  client post stores the start item's own copy (`GC:3374-3382`), so it cannot borrow another id.
- **Flag facts.** Both `process_flag_rewards` callers (`GC:1353`, `GC:2182`) run only after the
  server accepts the flag; the stamp rides the existing `save!` (`GC:3987-3989`); a repeat is
  "Already claimed" (`GC:3953-3955`).
- **`FORGEABLE_ITEM_FIELDS`.** Used only inbound (`GC:3304-3318`, `GAME:1215-1222`), so adding
  `revealsFacts` does not hide it from the client's `grantFact` on a real take.
- **Salt state.** `crackStarted` is server-held, bounded at 64, deleted on a miss, never synced or
  digested.
- **Refusal codes.** The closed list is `bad_request not_found no_recipe fact_not_held`, the two
  new ones go in `ops_refusal_codes.json` and `REFUSAL_TEXT`, and the core's node test covers them.
- **Core consistency.** `OPS_CORE_PLAN.md` L1374 and L1381 already say what section 14 asks.

## Verdict

Not settled: one major (M1). After M1, m1 and m2 are fixed, the rest are minors and nits that a
delta check can confirm.
