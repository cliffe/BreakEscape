# OPS_CRACKING_PLAN: delta review R4

Scope: `git diff 32b39840d HEAD -- docs/achitechture/OPS_CRACKING_PLAN.md` (824 to 871 lines), against the R3 fixes in `OPS_CRACKING_DECISIONS.md`. Checked against `app/models/break_escape/game.rb`, `app/controllers/break_escape/games_controller.rb`, `app/models/break_escape/credential_keyring.rb`, `tools/playtest/new-game.rb`, `scripts/validate_npc_habits.rb`, `lib/break_escape/npc_habits/clues.rb` and the core, privilege and skin plans. No plan was edited.

## Verdict

Settled. Nothing above minor. M1 holds on every path; the findings below are two minors and three nits.

## What was checked and holds

**1. M1, every add path.** The stamp reads the stored copy, and no path lets a client-chosen id pick another item's `revealsFacts`.

| Path | Stored copy comes from | Result |
|---|---|---|
| Inventory route, room/container/share take | `canonical_inventory_item` copies `@collectible_item`, the scenario's own object (GC:3315-3333, add at GC:1441) | server copy only |
| NPC give | `find_accessible_item` returns the scenario's `itemsHeld` entry or a server-stored `objects_added` copy (GC:3605-3625) | server copy only |
| NPC KO drop (`add_object`, `sourceNpcId`) | `held_item.deep_dup` plus `x/y/position` from the client (GAME:1135-1137); only the id is client-chosen when the held item has none | the copy is the NPC's own item; a validator-checked `revealsFacts` item always has an id, so the held id wins (`presence ||`) |
| Player drop, re-take | held inventory copy (GAME:1144-1157) | server copy, client fields never merged |
| Unsourced room add | stripped of `FORGEABLE_ITEM_FIELDS`, which the plan extends with `revealsFacts` | client facts lost |
| Client-built inventory body (no `@collectible_item`) | `client_item.except(CLIENT_ITEM_FORBIDDEN_FIELDS)` (GC:3318-3320) | client facts lost once the field is added |
| Flag reward `give_item` | station's `itemsHeld` (GC:4003-4006) | server copy only |
| Start items | not through `add_inventory_item!` (GAME:7533-7550); read from `scenario_data` | no client input |
| `Api::GamesController#inventory` (`api/games_controller.rb:43`) | raw client body | unrouted, with a header saying it must stay so; and `fact_source` defaults false, so it stamps nothing anyway |

The forged-drop test row matches the code: the client sends the id-less note's type and name with a fact item's id, `find_npc_held_item` (GAME:2261-2290) matches on name because the held id is blank, and the stored copy has no `revealsFacts`.

"The stored copy" does exist at the stamp point: `add_inventory_item!(item)` receives it as its argument, already built by the server. See F1 for what the plan still has to say.

**2. `Game#stamp_earned_facts!`.** Buildable. In the seeder, `g` is a `Game`, rewards are replayed under one `g.save!` at the end (`new-game.rb:439`), and the `case r['type']` has an `else` branch that currently prints "client-only"; a `when 'grant_fact'` there works. `add_inventory_item!(item)` at `new-game.rb:416` takes the station's raw item, so `fact_source: true` is correct. The method must not save itself on the controller path (the plan says "under the save it already makes", which is right).

**3. Keyring digest.** `keyring_rev` is `Digest::MD5.hexdigest(JSON.generate([digested, captures]))` (CK:238-241) and has one caller (CK:84). Adding a third element only when `crackFacts` is present leaves the digest byte-identical for scenarios without a hash row. `crackFacts` is carried only "when at least one hash row is listed", so the golden compare is unchanged. A running row's `readyInSeconds` is excluded from the digest like `expiresInS`; the `running` to `ready` change moves `status`, so `rev` still changes then.

**4. m3, m4, m5.**
- m3: the rule and its test row ("`revealsFacts` and no `id`: refused") are both present. The "guessable habit and a hash record with no `crack`" row matches the rule at plan line 217.
- m4: severities match `scripts/validate_npc_habits.rb` (error for no object at `:133-138`, warning for unbacked at `:267-277`, warning for non-guessable at `:257-258`). The three test rows match the three rules.
- m5: the inventory route does refuse a non-takeable item from any location (GC:3417-3419), so "takeable NPC held item" is right, in the rule, the error text, the section 5 table and the test row.

**5. Section 14.** Privilege plan L280-296 and L888-893 do carry the three taken requests (no `passwordPattern` requirement, `reused` pointer, takeable poster). The core plan has the S3 skip-for-`hash` text (see F2 for line numbers).

**6. Synced state and wording.** The four keys are `ACCESS_STATE_DEFAULTS`, server-written and never sent; `earnedFacts` is capped at 64 and grow-only. The plan text mentions no reviews or rounds (grep for `review`, `round`, `R3` found none; "kept here as a record" is about requests, not reviews).

## Findings

### F1 (minor): "after the existing notepad and decor-cup skips" does not exist in `add_inventory_item!`, and dedupe placement is unstated

- Plan: lines 297-299 (section 5, earned facts, item 1) and the C2 step list near line 749.
- Code: `game.rb:719-740` (`add_inventory_item!` has no type guard); the notepad and decor-cup early returns are inside `restamp_item_credential!` (`game.rb:757-760`) and cover only the credential stamp.
- Failure scenario: a builder follows the plan literally and finds no skip to sit after. They either stamp unguarded (a client-built notepad body has already lost `revealsFacts` through the strip, so this is only defence in depth) or they put the stamp before the `inventory_includes?` check (`game.rb:730`), so a rejected duplicate add still earns facts and the save happens twice. Both versions pass the listed tests.
- Fix: say that the stamp does its own `ALWAYS_ALLOWED`/`DECOR_CUPS` type check on the stored copy, and that it runs inside the `unless item_exists` branch, before the existing `save!`, so one save covers the item and its facts. Add a test row: a duplicate add earns nothing new.

### F2 (minor): section 14 cites line numbers that moved

- Plan: lines 821-829 (section 14, core plan paragraph) and the grant rule paragraph in section 9.
- Code: in `OPS_CORE_PLAN.md` the skip-for-`hash` row is L1386 (the plan says L1381); the kind rule that "adds `hash` when built" is a separate row at L1393 and is not cited; the "twelve codes" text is L1181-1184 (plan says L1169); the "later plans add codes" row is L1841 (plan says L1828). In the skin plan the twelve-codes lines are L627, L1275 and L1543 (plan says L614).
- Failure scenario: the S7 builder opens L1381 and finds a different rule, or fixes only the L1386 `connectsTo` skip and misses the L1393 kind rule, which would still reject `hash` as a granted kind. The C1 test row "accepts a granted `hash`" would catch it, but the plan names only one rule.
- Fix: cite L1386 for the skip and L1393 for the kind rule (both change), L1181/L1184 for the code count, L1841 for the table row, and the skin plan's L627 and L1275. Better still, cite the row text rather than a line number.

### F3 (nit): the pattern-backing warning has no stated NPC input

- Plan: section 9, `crack.passwordPattern` bullet (about line 574).
- Code: `clues.rb:432-436`: `backing(npc, ...)` returns `backed: false` unless `npc['creds']['password']` is a non-empty string.
- Failure scenario: for a hash record the plan does not say which NPC supplies `creds.password`. If the builder passes `nil` (a record with `crack` and no habit), every `passwordPattern` gets the "does not back the password" warning, including correct ones.
- Fix: add "the account's room NPC, an `accountOnly` one included; skip the check when none has `creds.password`".

### F4 (nit): a same-name, id-less held item blocks a fact item

- Plan: section 5, item 1 and the table row for takeable items.
- Code: `game.rb:703-715`: `inventory_includes?` falls back to type and name when either side has no id.
- Failure scenario: the player holds an id-less `notes` item named "Note"; a fact item of type `notes` named "Note" with an id is then treated as already held, and its facts are never stamped. This loses a fact and never grants one wrongly.
- Fix: add a validator warning when an item with `revealsFacts` shares type and name with another item that has no id, or note the rule in the authoring guidance.

### F5 (nit): C2 list should name the unrouted API controller as a non-caller

- Plan: section 12 file list.
- Code: `api/games_controller.rb:43` calls `add_inventory_item!` with a raw client body.
- Failure scenario: none today (unrouted, and `fact_source` defaults false). If someone routes it, the default still stamps nothing. A one-line note stops a later reviewer from raising it again.
- Fix: one sentence in section 5: "`Api::GamesController#inventory` is unrouted and passes no `fact_source`."
