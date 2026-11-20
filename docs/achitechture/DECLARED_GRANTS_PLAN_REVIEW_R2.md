# Declared grants plan: review, round 2

Reviewed: `docs/achitechture/DECLARED_GRANTS_PLAN.md` at eaac8b315 (the rewrite after R1).
Read-only adversarial review against the tree on 2026-11-06, with M6 (37701964a), M7
(cd9abc187) and the flag-station fix (e5a401bdc) all committed; `app/` has no uncommitted
changes. Line numbers are the current tree's.

## 1. Verdict

**Revise (light), then build.** Counts: 0 blockers, 2 major, 9 minor.

The design holds. The grant step on the full `addressed_by?` rule closes R1 B1, the three
lookups are the right three, the "held" gate works through save/reload and reset, the nested
archive resolves on both the unlock and the container fetch, the bootstrap strip is needed and
enough for today's two labs, and the client retry cannot double-grant. Every R1 outcome in §7 is
right except m1, which is now stale (the flag-station fix has landed).

The two majors are scope gaps rather than design faults:

1. Moving the contents out of the room hides them from the dungeon-graph generator and from
   the validator's room-only checks. After migration the SE lab's graph loses the
   `payroll_backup.zip` password lock and both labs lose the remote-session container (M1).
2. The plan stops a give_item under `flagRewards` from becoming a grant. It does not stop a
   grant that shares an identity with a flag-station's or NPC's `itemsHeld`. The grant step runs
   before `find_accessible_item`, so such a grant makes the item free and undoes e5a401bdc for
   it. The validator's collision rule covers room objects only (M2).

Both are a paragraph each in the plan. No further review round is needed if they are folded in
as suggested.

## 2. R1 findings: are the §7 outcomes right?

| R1 | Plan §7 says | Check | Evidence |
|---|---|---|---|
| B1 | Fixed: full `addressed_by?`, twins deleted | **Confirmed.** A name-only claim reaches the grant step before `find_accessible_item`, and `addressed_by?` falls to the name only when the claim has no id (`item_identity.rb:68–73`). A claim with a wrong id is not rescued by the name (`:68`). The stored copy is the grant's, with its id, so nothing else can be matched or stored | `games_controller.rb:1806–1818` (insertion point), `:1770–1782` |
| M1 | Accepted, no trigger check | Confirmed. §1.4 states the cost honestly | — |
| M2 | Accepted, one change | Confirmed: §2.3 and §4.2 go in one commit | — |
| M3 | All three lookups, gated on `held_in?` | **Confirmed.** `Game#find_scenario_object` (`game.rb:1285`, used by `validate_unlock` `:1138`, and also by `pin_cracker_feedback` `:1223` and `password_case_mismatch?` `:1233`, which the fallback serves for free), `find_object_in_scenario` (`games_controller.rb:1672`, used `:904`), `find_container_in_scenario` (`:1641`, used `:523`) | as cited |
| M4 | ~500 lines in one change | Plausible, a little low (§6.3) | — |
| M5 | Dropped, client retry | Confirmed; the retry is sound (§3.5) | — |
| M6 | Landed 37701964a; grant reuses `canonical_inventory_item` | **Confirmed.** `canonical_inventory_item` copies `@collectible_item` and runs `filter_requires_and_contents_recursive` (`:1770–1782`); that filter drops `contents` only when `locked` (`game.rb:2886–2889`), so the extra strip for grant copies is needed, as §2.2 says | as cited |
| M7 | Landed cd9abc187; grant contents use the same filter | **Confirmed.** `:913–916` runs `filter_container_contents` on the unlock response | — |
| m1 | "Out of scope; in progress separately" | **Stale.** Landed as e5a401bdc (`flag_station_item_earned?`, `:1869–1923`; `test/controllers/break_escape/flag_station_item_claim_test.rb`). The outcome is right; the wording and §0, §2.7, §6.2 need updating. See also M2 | `git log` |
| m2 | Fixed: every identified give_item outside `flagRewards` | Confirmed in intent; see m2 and m5 below on what "every" pulls in | — |
| m3–m7 | Moot or dropped | Confirmed | — |
| m8 | Stale details fixed | Confirmed: route, `scenarioClock.timers.fired`, esd source, 65513244e, twin lines (physical `:909–938`, SE `:1795–1871`) all match | — |
| R1 §7 | Locked-room warning goes away | Confirmed for declared grants (§4.3 rule 2) | — |
| R1 Q table | Settled as listed | Confirmed | — |

## 3. Design checks against the code

### 3.1 Where a give_item can appear

| Source | Runs `give_item` with an `item` hash? | In the walk? | Notes |
|---|---|---|---|
| `timers[].actions` | yes, `scenario-timer-dispatcher.js:231` → `apply-actions.js:172–186` | yes | the two labs |
| object `triggerOnInteract`, `onInteract.actions`, `confirm_action.onConfirm` | yes, `interactions.js:820, 845, 1819`, `apply-actions.js:262` | yes | no scenario uses it |
| esd-pushbutton `entry.actions` / `completionActions` | yes, `esd-pushbutton-minigame.js:213–222` | yes | no scenario uses it |
| flag-station rewards | the client re-runs the **server's** results (`flag-station-minigame.js:907`), which carry `item` from `process_item_reward` (`games_controller.rb:2392`); the add lands on the `:973` short cut | excluded (`flagRewards`) | the scenario's own rewards carry `item_type`/`item_name`, no hash (grep: no `"item"` near any give_item in m02, m03, m06, m07, secgen_vm_lab) |
| NPC `eventMappings` | **no**: npc-manager.js never calls `applyActions` and has no give key (grep) | **yes**, by the "every node" rule | see m2 |
| ink `#give_item:<type>` | not this path: `NPCGameBridge.giveItem` sends `sourceNpcId`, so the grant step is skipped (§2.2 first bullet) | n/a (no `item` hash in ink) | correct to leave out |

`grep '"give_item"'` across `scenarios/**/scenario.json.erb` and `test/` finds an `item` hash only
in the two labs' timers, and `"active": false` only at `lab_physical_pentest:919` and
`lab_social_engineering:1817`. §4.1 is right.

### 3.2 Matching a claim

- Insertion point and `item_id` are as stated (`validate_item_collectible` `:1784`, `item_id` at
  `:1789`, start items `:1806–1815`, `find_accessible_item` call `:1818`).
- A forged name-only claim **does** match an id-bearing grant, by design: grants are free. It
  cannot get anything else. The stored item is the grant's copy with the grant's id, so a later
  `has_key_in_inventory?` or lookup sees the scenario's fields, not the claim's. A claim with any
  id must share it (`item_identity.rb:68`).
- What the name rule can still do wrong: divert an honest pickup. If a room object with **no id**
  has the same type and name as a grant, its pickup (claim with no id) is decided by the grant
  step first and stores the grant's copy. No scenario does this today (m3).
- Identity collision with a **gated** item is the one real hole (M2).
- `:973` already-held short cut (`Game#inventory_includes?`, `game.rb:150–163`) runs before the
  grant step, so a repeat while held is a 200 and never re-validated. Correct.

### 3.3 Stored copy and payload strips

- Stored copy: `@collectible_item = grant['item']` plus a "grant copy loses `contents`, keeps
  `hasContents: true`" rule in `canonical_inventory_item` works. The rule can key on
  `@collectible_location[:type] == 'grant'`.
- Bootstrap: `filtered_scenario_for_bootstrap` (`game.rb:794–852`) deep-dups everything outside
  `rooms`, so `timers` ship whole. `filter_requires_recursive` (`games_controller.rb:1572–1592`)
  strips `requires` only; the archive's locked `contents` (`personal_banking.txt`) would ship.
  The strip is needed exactly as §2.3 says.
- Room payloads: `filtered_room_data` (`game.rb:854–866`) is the right second place. Other
  routes that serialise scenario sub-trees (`filter_container_contents` for GET /container and
  the unlock response, `process_item_reward` at `:2390`) would not strip a grant nested inside
  them. No scenario does this today (m4).
- No other route ships the raw scenario: `show` passes `scenario_data` only to the preference
  model and the view reads `titleScreenName`/title art; `scenario_map` sends room metadata;
  `public/break_escape/scenarios/` holds only `test_objectives.json`.

### 3.4 The three lookups, nesting, reload, reset

Traced for the SE lab after migration, opener held:

1. Inventory click: `interactions.js:1526` (`data.hasContents`) → `handleUnlock` →
   `unlock-system.js:122/143` `method: 'unlocked'`, target `scenarioData.id`. `validate_unlock`
   → `object_unlocked?` (`game.rb:1131`) false → `find_scenario_object` misses rooms → fallback
   finds the grant (`locked: false`) → true → `unlock_object!('sofia_remote')` (`:901`).
2. Response contents: `find_object_in_scenario` fallback → `filter_container_contents` → the
   three text files and `sofia_archive` with no `requires` and no `contents` (`game.rb:2879–2889`).
3. GET `/container/sofia_remote` → `find_container_in_scenario` fallback;
   `check_container_unlocked` passes from step 1.
4. Archive: `POST /unlock` password → `find_scenario_object` fallback recurses
   (`find_object_in_contents`, `game.rb:1297–1306`) → `requires` compared → unlock; its response
   and GET `/container/sofia_archive` resolve through `find_object_in_object` and
   `find_container_recursive`, both of which recurse into `contents`
   (`games_controller.rb:1656–1693`). `method: 'unlocked'` on the archive is refused
   (`locked: true`, `game.rb:1144–1151`).

Before the claim every step misses and fails as §2.3 says. After `remove`
(`remove_inventory_item!` by id, `game.rb:198`) step 1 still passes on `unlockedObjects`, steps
2–4 find nothing: the §5.1 expectations ("200 with no `contents` key", 404s) match the code.
Reload: `playerInventory` (`:373–374`) holds the stored copy with its id, `_restoredFromSave`
skips the POST (`inventory.js:454`), and the lookups answer. Reset: `reset_player_state!`
(`game.rb:89–107`) drops inventory and `unlockedObjects`, keeps `scenario_data`.

Implementation notes the plan should carry: `held_grant_items` must not be memoised (the
`container` action calls `@game.reload`, `:517`, and the inventory changes per request); only
`declared_grants` may be.

### 3.5 Client retry

- No double grant. Retries start only after the previous attempt settles; the server dedupes
  (`:973`, and `add_inventory_item!` re-checks, `game.rb:169`); a lost response after a commit
  comes back as 200 on the retry. `merge_scenario_clock!` unions `fired` (`game.rb:1814`), so an
  in-flight timer that later fires on another tab or after reload is not undone.
- Timers keep working. While in flight the id is out of `firedTimers`, so `exportState` keeps it
  in `started` (`scenario-timer-dispatcher.js:146–156`) and a reload re-fires it
  (`:81–90`). The HUD (`scenario-timer.js:175`) only lists `showCountdown` timers; neither grant
  timer has one.
- Gaps, all small (m6): `applyActions` returns early with `undefined` on an empty list
  (`apply-actions.js:73`); `addToInventory` can also resolve `reason: 'invalid'`
  (`inventory.js:367`), which is neither "settled" nor "error" in §2.5; retry timeouts need
  clearing in `destroy()`; the alert count; and the give-up rule.

### 3.6 M6, M7 and the validator

- M6 and M7: the plan's description of both matches the landed code (§2 above).
- e5a401bdc: `flag_station_item_earned?` handles hash-form `flagRewards`
  (`games_controller.rb:1895–1907`), so the walk's exclusion has to be a whole-subtree exclusion
  of any `flagRewards` key. `vm-launcher` (17 objects) and `launch-device` also carry
  `flagRewards`, not only `flag-station` (m5).
- `check_give_item_collectible` (`validate_scenario.rb:2035–2112`): §4.3 says what changes
  clearly, with three gaps: the collision rule's scope (M2), the existing test cases that flip
  (m7), and the shared module's ActiveSupport dependency (m1).

## 4. Findings

### Major

**M1. Moving the contents hides them from the dungeon graph and the room-only validator checks
(plan §4.2 step 5, §4.3).** `scripts/generate_dungeon_graph.rb` walks room objects only
(`walk_objects`, `:152–166`; no `timers` or `give_item` anywhere in the file). Today the SE graph
has `lock_sofia_archive` ("payroll_backup.zip / Password lock",
`scenarios/lab_social_engineering/dungeon_graph.md:89, 217`) and the `rc_sofia_remote_16`
container with its four children (`:363–398`). The physical graph has
`rc_records_remote_session_25` (`lab_physical_pentest/dungeon_graph.md:312, 355–357`). After the
migration, "regenerate both dungeon graphs" removes all of them, and the SE lab's
password-reuse payoff is no longer on the map the user reviews. In the validator,
`check_item_fields` (`validate_scenario.rb:519, 545`) and `check_item_type` (`:2188, :2427`) run
from room objects, start items and `itemsHeld`, so the moved files and the `zip_archive` lose
their unknown-field and sprite checks. (Whole-JSON walks such as `check_pin_locks` `:1852` and
`check_lock_credentials` `:1768` still see them.)
*Change:* add to §2.7 and §4.3: the graph generator adds a node per declared grant (from
`DeclaredGrants.for`), attached to the trigger's global or the timer, and walks its `contents`
with `walk_objects`. The validator runs `check_item_fields` and `check_item_type` over each
grant item and its contents. Add §5.2 cases, and say in §4.2 that the regenerated graphs must
still show the archive lock.

**M2. A grant that shares an identity with gated `itemsHeld` bypasses the gate (plan §2.1, §4.3
rule 2, §3.3).** §2.1 excludes give_items **under** `flagRewards` so the allowlist "cannot undo"
the flag-station fix. The grant step, though, matches by identity, before
`find_accessible_item` (`games_controller.rb:1818`). So any grant whose type and identity equal a
flag-station's `itemsHeld` entry makes that item claimable with no flag
(`flag_station_item_earned?`, `:1869–1879`, never runs). The same goes for an NPC's `itemsHeld`
(encounter check `:1854–1868`) and for a key grant whose `opens_lock` equals a real key's. §4.3
rule 2 errors only when a **room object, at any depth** shares the identity, so the validator
would not catch the first two.
*Change:* widen the §4.3 collision ERROR to every holder the validator already collects
(`holders`, `validate_scenario.rb:2053–2069`: room objects, container contents, flag-station
`itemsHeld`, NPC `itemsHeld`). The message should name the gate the grant would bypass. Add a
§5.1 case: a grant sharing a flag-station item's identity, claimed before the flag. With the
validator error in place the server behaviour can stay as planned; say so in §3.3.

### Minor

**m1. The shared module cannot call `ItemIdentity` from the validator, and the identity rule
differs (plan §2.1).** §2.1 says `DeclaredGrants` uses no ActiveSupport so the validator can
`require_relative` it, then defines a grant by "`ItemIdentity.identity_candidates` is not
empty". `ItemIdentity` uses `blank?`/`present?` (`item_identity.rb:23, 33, 50, 61, 68, 71`), and
the validator loads no ActiveSupport (`validate_scenario.rb:11–19`; `{}.respond_to?(:blank?)`
is false in plain Ruby), so that call raises `NoMethodError`. Also `identity_candidates` ignores
`keyId` (`:32–36`; only `addressed_by?` adds it, `:65–66`), while §2.1 lists `keyId` and the
validator's `identities` lambda includes it (`validate_scenario.rb:2040`).
*Change:* either make `ItemIdentity` ActiveSupport-free (small: `nil?`/`empty?` checks) and
share it, or give `DeclaredGrants` its own plain-Ruby identity helper. Pick one rule for `keyId`
and use it in the server, the validator and the §2.1 text.

**m2. "Every give_item anywhere" also allowlists give_items the engine never runs.** NPC
`eventMappings` cannot give items (plan §1.1, §2.6), yet a give_item with an `item` hash written
there is walked, becomes a grant, and is claimable while no honest client ever receives it. The
existing validator test fixture has exactly that shape
(`test/js/validator-give-item-collectible.test.mjs`, "an eventMapping give_item is checked
too"). The same goes for any authoring scratch block.
*Change:* keep the whole walk (R1 m2), but have the validator ERROR on a give_item that is not
under one of the executed paths (`timers[].actions`, `triggerOnInteract`, `onInteract.actions`,
`confirm_action.onConfirm`, esd `entry.actions`/`completionActions`), naming the path.

**m3. Name collisions can divert an honest pickup.** A no-id claim for a room object that has the
same type and name as a grant is decided by the grant step and stores the grant's copy (§3.2).
*Change:* validator ERROR when a grant's type and name equal those of any id-less holder, or any
other grant.

**m4. The contents strip lives in two payload builders, not in the filters.** A grant nested in
something served by `filter_container_contents` (GET /container, the unlock response) or by
`process_item_reward` would still ship its `contents`. Zero users today.
*Change:* put the strip inside `filter_requires_and_contents_recursive` (`game.rb:2856`) and
`filter_requires_recursive` (`games_controller.rb:1572`): when a hash is
`{ type: 'give_item', item: <identified> }`, drop `item.contents` and set `hasContents`. Every
route then inherits it, and `strip_contents!` becomes that one rule.

**m5. The `flagRewards` exclusion must be a subtree rule for any parent.** §2.1 says "a
flag-station's `flagRewards`". `vm-launcher` and `launch-device` objects carry `flagRewards`
too, and `find_flag_rewards` reads hash and array forms (`games_controller.rb:2289–2310`).
*Change:* "skip any subtree under a `flagRewards` key", with §5.1 cases for the hash form and a
non-station parent.

**m6. Retry details (§2.5).**
- Giving up marks the timer fired, so a reward lost to a 15-second outage is lost for good,
  even after the server recovers. Leave it unfired after the last retry and stop retrying for
  this page: the next load re-fires it (`started` is still exported), with no loop.
- "Three alerts in 14 s" (§6.2): the first POST plus three retries is four failures, four
  "Network error" alerts (`inventory.js:496–498`).
- `applyActions` must return `[]` on its early return (`apply-actions.js:73`).
- Treat every result other than `reason: 'error'` as settled (`'invalid'` exists,
  `inventory.js:367`), so a timer cannot sit in `_inFlight` for ever.
- Clear pending retry timeouts in `destroy()`.

**m7. Validator test churn is understated (§4.3, last paragraph).** Five of the seven cases in
`validator-give-item-collectible.test.mjs` give an **id-bearing** item with a matching world
object ("matching takeable object passes", "not takeable errors", the key case, NPC
`itemsHeld`, the locked-room warning). Under §4.3 each becomes a declared grant, and the matching
object becomes the "twin left behind" ERROR. Only the no-id variants keep today's meaning.
*Change:* say the file is rewritten: keep the twin cases with id-less items, add grant cases.

**m8. Migration completeness (§4.2).**
- `scenarios/lab_physical_pentest/EXPANSION_PLAN.md:564, 578, 601` plans to move
  `records_remote_session` and "repoint" it in the open-plan resize. That work and this
  migration touch the same scenario file and dungeon graph (both currently modified in the
  shared tree). Add a line to §4.2: whichever lands second drops the repoint step, and note it
  in the expansion plan's log.
- One more stale SE comment: `lab_social_engineering/scenario.json.erb:906–909` ("the
  sofia_remote PC container, unlocked by phish_lord_foothold").
- Nothing else depends on the twins: no engine reader of `foothold.containerId` (grep), no ink,
  no lab sheet in HacktivityLabSheets; `tools/playtest/*session.jsonl` hits are old logs.
  `test/models/break_escape/game_test.rb:216` builds its own room `sofia_remote` and is right to
  stay.

**m9. Size (§6.1) is a little low.** With M1 (generator and two more validator walks) and the
wider collision and executed-path rules, the validator and graph part is closer to 120 than 60
lines, and the tests about 330. Say ~600–650 changed lines; still about a day.

## 5. Wrong or stale claims

1. §0 ("in progress, uncommitted in `games_controller.rb`"), §2.7, §6.2 and §7 m1: the
   flag-station fix is committed (e5a401bdc); `app/` is clean.
2. §2.1 "legacy `key_id`/`keyId`: `ItemIdentity.identity_candidates` is not empty":
   `identity_candidates` does not read `keyId` (`item_identity.rb:32–36`). See m1.
3. §2.1 "uses no ActiveSupport … `scripts/validate_scenario.rb` can `require_relative` it": true
   only if it does not call `ItemIdentity` (m1).
4. §2.1 "a flag-station's `flagRewards`": other object types carry `flagRewards` (m5).
5. §3.1 understates today's exposure. Both twins are `locked: false`, and
   `filter_requires_and_contents_recursive` drops `contents` only from locked objects
   (`game.rb:2886`), so every load of `open_plan` or `operations_room` already sends the twin's
   files (the archive arrives without `requires` or `contents`). Reading them takes zero extra
   requests. The design closes this anyway, since the twins go.
6. §2.1 / §2.4 "until restarted": Reset (`reset_player_state!`) keeps the old `scenario_data`;
   only New Session (`new_session`, `games_controller.rb:237–262`) renders a fresh snapshot. Say
   "until a new session".
7. §4.3 "Flag rewards … are skipped as now": the validator does not skip `flagRewards`; they
   pass only because no reward carries an `item` hash (`validate_scenario.rb:2075`).
8. §4.3 "the 'no matching world object errors' case becomes a pass": five other cases flip too
   (m7).
9. §6.2 "Three alerts in 14 s": four (m6).
10. §5.1 "Unchanged and passing" omits `test/controllers/break_escape/flag_station_item_claim_test.rb`.
11. Drift, harmless: `filtered_scenario_for_bootstrap` is `game.rb:794` (plan `:790`); the
    already-held short cut is `:973` (plan `:971`); `process_flag_rewards`/`process_item_reward`
    are `:2332`/`:2378`.

Checked and right: §1.1 sources (apart from the eventMappings caveat in m2); §1.2 steps 3–8;
§2.2 line references; §2.3 lookup table and the before/while/after behaviour; §2.4 reload;
§4.1 scenario census; §4.2 line ranges (physical `:158–178`, `:164–168`, `:909–938`; SE
`:158–166`, `:167–182`, `:289`, `:911`, `:1795–1871`; `interactions.js:1488`).

## 6. Tests, live checks, size, open questions

### 6.1 Tests

§5.1 goes through the real endpoints, covers both R1 test gaps (name-only claim decided by the
grant; the opener's real path before, while and after holding) and pins the bootstrap strip with
a body search. Add:

- `GET /room/<id>` for a room whose object carries a `triggerOnInteract` grant with `contents`:
  no `contents` in the payload (the `filtered_room_data` strip has no test as planned).
- A grant sharing a flag-station `itemsHeld` identity: refused before the flag, with the M2
  validator error. The same for an NPC `itemsHeld` identity before the encounter.
- `flagRewards` in hash form and under a `vm-launcher`: not grants (m5).
- An id-less room object with a grant's type and name: its pickup stores the room object (or
  the validator errors, whichever m3 picks).
- Legacy: assert the stored copy is the timer item (no `contents`), and the contents still come
  from the twin.
- `pin_cracker_feedback` / `password_case_mismatch?` on the nested archive through the fallback
  (`caseMismatch` for `sofia2026!`): cheap, and it pins the third `find_scenario_object` caller.
- Node: `applyActions([])` returns `[]`; a `reason: 'invalid'` give settles; the give-up rule as
  m6 settles it; `destroy()` cancels a pending retry.
- Validator: the M1 graph node for a grant and the archive lock; the m2 executed-path error.
- Add `flag_station_item_claim_test.rb` to the unchanged-and-passing list.

### 6.2 Live checks

Sufficient as listed. Two additions:
- After the SE run, regenerate the graph and confirm the `payroll_backup.zip` lock and the
  Remote Session node are still drawn (M1).
- In the lost-grant check, also block for longer than the retry window, then reload with the
  server back: under the m6 change the opener arrives; under §2.5 as written it never does,
  which the user should see before choosing.

### 6.3 Size

~600–650 changed lines with M1 and the minors, not ~500 (m9). Still about a day with one review
round and the two live checks.

### 6.4 Open questions

| Q | Default | Review |
|---|---|---|
| Q1 SE room gate | no | Agree. Honest play always has `operations_room` open first (R1 §7), and the room payload already sends the twin's files today (§5 item 5). |
| Q2 id-less grants | no | Agree. Names are not unique, and `held_in?`/`inventory_includes?` fall back to them. |
| Q3 trigger checks | later, backlog | Agree. Ask the user whether the labs need cheat resistance at all before planning. |
| Q4 retry policy | 1/3/10 s, network errors only, then mark fired | Agree on the delays and "network errors only". Disagree on "then mark fired": leave it unfired so the next load retries (m6). |
| Q5 held vs ever claimed | held | Agree. It is what the lookups can check cheaply, and dropping the opener ending access is the right behaviour. |
| Q6 ink and eventMappings | unchanged | Agree, with the m2 validator error so an eventMapping give_item is reported instead of silently allowlisted. |
