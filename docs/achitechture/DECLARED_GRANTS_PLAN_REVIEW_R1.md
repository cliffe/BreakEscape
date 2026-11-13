# Declared grants plan: review, round 1

Reviewed: `docs/achitechture/DECLARED_GRANTS_PLAN.md` at bdaf9ce3d. Read-only adversarial review,
checked against the working tree on 2026-11-05. Line numbers are the current tree's.

## 1. Verdict

**Rethink phase 1.** Counts: 1 blocker, 7 major, 8 minor.

The reading of today's code (§1) is accurate almost everywhere, and the three extra holes it
reports are real. The design built on it has three problems:

1. The trigger check certifies itself. The claim carries the trigger's globals (§2.5), so a
   forged claim is one request, the same as today, and an honest claim looks exactly like a
   forged one in the log. For the only two scenarios that need grants, the condition evaluator,
   `trigger_globals`, the 409 path and the sync-and-retry buy no protection.
2. A claim sent with the name and no id skips the grant rule and is accepted through the twin,
   so even the cheap early claim the plan says it stops still works (B1).
3. Phase 1 keeps the twins. The user's pain is having to keep a hidden twin in step with the
   grant, and that only goes away in phase 2.

A design about half the size removes the twins in one step: a declared-item allowlist with no
trigger check, plus grant-held contents. It leaves trigger checking for a later phase, when a
lab has a trigger the server can establish for itself (§4). The flag-station hole, the
field-injection hole (worse than the plan says: it is a lock bypass) and an unlock response that
leaks nested lock answers should be separate small commits that do not wait for grants.

## 2. Claims checked

| Plan claim | Result | Evidence |
|---|---|---|
| Timer fires 300 ms after the trigger, `applyActions` not awaited, timer marked fired whether or not the add succeeds | Confirmed | `ui/scenario-timer-dispatcher.js:174–195, 202–243` (`firedTimers.add` at :235 after `applyActions` at :231); `systems/apply-actions.js:172–186` calls `window.addToInventory` without `await` |
| `addToInventory` POSTs the client's item hash, no grant marker | Confirmed | `systems/inventory.js:454–478` (`item: itemData`, `source_npc_id`) |
| `:971` short cut, `validate_item_collectible` order, `find_accessible_item` priorities, no `active` check | Confirmed | `games_controller.rb:971, 1752–1838, 1869–1957` |
| `flag_station` branch accepts with no check | Confirmed | `games_controller.rb:1834–1840`; itemsHeld reached at priority 2, `:1934–1941` |
| Stored item is the client's hash | Confirmed | `games_controller.rb:983` `add_inventory_item!(item.to_unsafe_h)` |
| Globals reach the server only through sync_state; the trigger writes do not sync | Confirmed | `merge_last_write_wins_sections` `:1469–1471` → `game.rb:274`; mapping setGlobal `npc-manager.js:1027–1039` and timer/ink writes do not call `stateSync`. The only sync on the `applyActions` path is inside `recordSECapture` (`apply-actions.js:36`), and neither lab's trigger runs an `add_capture` |
| StateSync every 30 s, on pagehide, `syncConfirmed` retries | Confirmed | `state-sync.js:126, 144, 148, 486–499` |
| sync_state and inventory never interleave | Confirmed | sync_state takes `Game.lock` in its own transaction (`:718–719`); inventory is under `with_game_lock` (`:84, :1564`) |
| The race: trigger almost never on the server at claim time | Confirmed for lab_physical_pentest (nothing syncs between the mapping and the claim). Likely for lab_social_engineering: the mail bridge syncs a foothold capture at send time (`mail-bridge.js:89, 450–455`), but the global is set later, when the mail runner delivers and runs `on_email`, so the ordering is not reliable | as cited |
| Only two client-side give_items, only two `active:false` objects | Confirmed | grep of every `scenarios/*/scenario.json.erb`: give_item with an `item` hash only in the two labs' timers; `active: false` only at `lab_physical_pentest:919` and `lab_social_engineering:1817` |
| `complete_task!` validates five types; `manual` passes | Confirmed | `game.rb:1476–1502` (`enter_room` and `custom` are also unchecked) |
| Twin's second job: the opener needs it | Confirmed, but the path is wrong in detail (see §8, item 4). The opener calls `POST /unlock` with `method: 'unlocked'` (`unlock-system.js:122, 143`) → `Game#validate_unlock` → `find_scenario_object` (`game.rb:1134, 1281`), then `GET /container/:container_id` (`container-minigame.js:141`, `routes.rb:27`) → `find_container_in_scenario` (`games_controller.rb:1637`). The unlock response itself also carries the contents, through a third lookup, `find_object_in_scenario` (`:1665`, used at `:917–924`) |
| Hole: flag-station items claimable without the flag (m02, m03, m06, m07, secgen_vm_lab) | **Confirmed.** Each of those five has a flag-station with takeable `itemsHeld` (secgen_vm_lab's keycard has no `id` and matches by name). One POST with the item's type and id (or name) adds it | `games_controller.rb:1934–1941, 1834–1840` |
| Hole: client fields stored as sent | **Confirmed, and worse than stated** (M6). `has_key_in_inventory?` (`game.rb:204–226`) reads `opens_lock` and `scenarioData` from stored items, and `has_lockpick_in_inventory?` (`:229–240`) reads `scenarioData.type`. A notepad (`ALWAYS_ALLOWED_ITEMS`, no scenario lookup, `:1761–1765`) sent with `opens_lock: '<any key lock>'` or `scenarioData: { type: 'lockpick' }` is stored, then opens that lock, or every key lock, through `POST /unlock` | as cited |
| Hole: twin contents readable without the item | **Confirmed, and worse than stated** (M7). `POST /unlock` `{targetType:'object', targetId:'sofia_remote', method:'unlocked'}` succeeds with no room check (`game.rb:1140–1143`), and the response returns `object_data['contents']` **unfiltered** (`games_controller.rb:921–924`), including the nested archive's `"requires": "Sofia2026!"`. GET /container filters (`:1712`); the unlock response does not | as cited |

## 3. Findings

### Blocker

**B1. A name-only claim skips the grant rule and is accepted through the twin.**
Plan §2.2 step 2 matches grants on type plus id only ("never name"), and §5.1 even tests "Name-only
match → not treated as a grant". Such a claim falls through to `find_accessible_item`, where
`ItemIdentity.addressed_by?` uses the name when the client sends no id
(`lib/break_escape/item_identity.rb:63–74`). The twin matches by name. `open_plan` has no lock, so the
priority 2 room check passes (`games_controller.rb:1809–1815`) and the item is stored as sent. The
opener then works: the client keys the container on `id || name` (`container-minigame.js:128–130`)
and `find_container_recursive` matches by name (`games_controller.rb:1658`). So
`POST /inventory {action_type:'add', item:{type:'pc', name:'Remote Session — LW-RECORDS-02'}}` still
gets the reward from the first second, and §2.6 ("a twin can no longer be claimed early") and §3.2
("Claim before the trigger: refused") are false.
*Change:* decide "does a grant cover this claim" with the full `addressed_by?` rule (name included,
as every other lookup does), or make `find_accessible_item` skip any scenario object whose
type+identity equals a declared grant's item. Flip the §5.1 test to "name-only claim of a granted
item → decided by the grant rule".

### Major

**M1. The trigger check certifies itself (§2.5, §3.2).** The claim carries
`trigger_globals: { kp_usb_foothold: true }` and the server merges it before evaluating, so the
forged claim is one request, not "two requests instead of one". The suggested audit signal ("a grant
claimed with its trigger set by the claim itself") is what every honest claim looks like too, because
§1.4 shows the global almost never reaches the server first. For both labs the condition evaluator,
`trigger_globals`, the 409 code and the sync-and-retry stop only someone who replays a request
without reading the client code that builds it.
*Change:* drop the trigger check for triggers that are client globals. Check triggers only where the
server establishes the fact itself (flag submitted, room or object unlocked), and leave
client-global triggers to the later phase that makes them server-established (Q8).

**M2. Phase 1 does not remove the twin (§4.2).** The twin still holds `contents` for all three
lookups (unlock, unlock response, container fetch), so phase 1 keeps the fragility the user wants
gone: two copies that must agree on type and id, `takeable: true`, `active: false`, a reachable room
and an F11 comment. Phase 1 adds a second copy of the same rule for the server to apply.
*Change:* do grant-held contents (phase 2) first, or in the same change, and delete both twins there.

**M3. The phase 2 lookup list is incomplete (§4.2).** It names `find_container_in_scenario` and
`Game#find_scenario_object` (for the nested archive). It misses:
- the opener's own `POST /unlock` `method: 'unlocked'` for the pc: `validate_unlock` finds the object
  with `find_scenario_object` (`game.rb:1134`) and returns false when it is not found (`:1202–1203`),
  so with the twin deleted the opener shows "Access denied" (`unlock-system.js:122–131`);
- the controller's `find_object_in_scenario` (`games_controller.rb:1665`), which builds the unlock
  response's `contents` (`:917–924`).
*Change:* list all three lookups, and gate each on the grant item being held
(`ItemIdentity.held_in?`), not on `grantsClaimed` alone, so an opener that has left the inventory
no longer serves its contents.

**M4. Phase 1 is over-built for its users (§2.3, §6.1).** Of the trigger kinds, only
`startOnGlobal` has users (two timers), and M1 shows its check adds nothing. No scenario has a
give_item under a timer `condition`, a plain-delay timer, or `triggerOnInteract`/`onInteract`
(grep of all scenarios). The Ruby condition port, the drift risk it brings (§6.2), the `created_at`
rule, the interact-reachability anchor, `grant_source`, `trigger_globals` and the 409 retry are about
half of the ~700 lines and serve no current scenario.
*Change:* the design in §4 of this review, about 325 lines including tests.

**M5. `pendingGrants` is undefined for interact grants (§2.4).** The filter is "trigger met and the
source has fired by the client's record (`scenarioClock` for timers)". An interact grant's trigger is
"its object is reachable", true long before the player touches it, and there is no fired record. As
written an implementer either never repairs interact grants or hands them out on load without the
interaction.
*Change:* restrict `pendingGrants` to timer grants, or replace it with the client-side retry in §4.

**M6. Field injection is a lock bypass, so Q7's "audit separately, later" is too relaxed.** See §2:
a notepad or decor cup is stored with any fields, and the server's key and lockpick checks read
`opens_lock`, `key_id`, `scenarioData` and `scenarioData.type` from stored items. One forged add opens
every key lock in the mission, and key locks are the core of the server-validated progression.
*Change:* a separate, small commit before grants: on every add, store either the matched scenario
item or the client hash with `opens_lock`, `key_id`, `keyId`, `scenarioData` and `type` taken from
the scenario (or removed for notepad and decor), plus tests that a forged notepad opens nothing.
Canonical storage for grants then comes free.

**M7. The unlock response leaks nested lock answers.** `games_controller.rb:921–924` returns the
container's raw `contents` from `scenario_data`, which still holds `requires`. Any container unlock
in any mission hands the client the PIN, password or key id of every locked item nested inside it.
For `sofia_remote` that is reachable with no item and no room (`method: 'unlocked'`). The plan's §3.1
"read the twin's contents" understates it.
*Change:* run the same `filter_requires_and_contents_recursive` the container endpoint uses
(`:1709–1712`, `game.rb:2852`) on the unlock response. Separate commit, with a test.

### Minor

**m1. §3.3 is not "a few lines".** `flag_rewards_claimed` stores the flag string as submitted
(`:2293`), while a reward names its item by `item_name`/`item_type` with a loose OR match (`:2306`). The
check has to go from the item to its `flagRewards` index, then to `flags[index]` through
`resolve_flag_value`, then compare lower-case. About 20 lines plus tests. Ship it on its own; it does
not need grants.

**m2. The grant walk misses sources (§2.1).** The esd-pushbutton minigame runs `applyActions` on
`entry.actions` and `completionActions` (`esd-pushbutton-minigame.js:213–222`). The validator already
walks every `give_item` node with an `item` hash anywhere (`validate_scenario.rb:2072–2105`). Use that
rule ("every give_item with an item hash, outside flagRewards") on the server and share it, which also
does §4.3 item 6.

**m3. The 409 retry is dead code for honest clients and noisy for everyone.** With the trigger's
globals in the claim, the server sees exactly what the client evaluated, so an honest 409 needs the
start global to have flipped back within 300 ms (the dispatcher does not re-check it at fire time).
Also `inventory.js:484–490` raises an "Invalid Action" alert on every refusal, before any retry, and
for `grant_already_claimed`.

**m4. Once-only plus `triggerOnInteract` gives an error alert on every later interaction** once the
item has left the inventory. No scenario does this yet; note it, or make interact grants
repeat-while-not-held.

**m5. `grant_source` adds nothing.** It can only narrow the match, the client asserts it, and type
plus id already identify the grant (two grants with one type+id get a validator warning). The
interact source label is a bare `'object_interact'` (`interactions.js:820, 845, 1819`), so
`interact:<object id>` needs new plumbing. Drop it.

**m6. Reset.** `reset_player_state!` keeps only listed keys (`game.rb:89–107`), so `grantsClaimed`
clears on reset, which is right; say so. `created_at` does not change on reset, as §6.2 suspects.
That matters only for the plain-delay rule M4 proposes to drop.

**m7. Condition grammar parity (§6.2).** The JS evaluator is lenient: an unknown expression falls to
"first `globalVars.X` is truthy" (`scenario-timer-dispatcher.js:334–339`), and `||` is not
recognised. A strict Ruby subset would differ on such strings. Moot if the port is dropped.

**m8. Stale details:** see §8.

## 4. A simpler design

Yes, there is one. It removes the twin, keeps today's security for the physical lab, and leaves
the anti-cheat work for a later phase where it can mean something.

**Step 1: declared items (server, ~50 lines).** `DeclaredGrants.for(scenario_data)` collects every
`give_item` node with an `item` hash that has `type` and `id` (or `opens_lock`), anywhere outside
`flagRewards`: the validator's walk, shared. In `validate_item_collectible`, after the start-items
check, if `addressed_by?(grant.item, type, id, name)` holds for a grant (full rule, name included,
which closes B1), accept, store `grant.item.deep_dup` and set `@collectible_location = { type: 'grant' }`.
No trigger check, no `grant_source`, no `trigger_globals`, no 409. Optionally record `grantsClaimed`
for the log.

**Step 2: contents on the grant item (server, ~50 lines).** The three lookups (M3) also search
declared grant items and their nested `contents`, only while the grant item is held
(`ItemIdentity.held_in?`). Move each twin's `contents` into its timer's `item` and delete both twins
and their F11 comments in the same change. The validator's "no matching object" error (rule 1 in plan
§4.3) is dropped for declared items.

**Step 3: lost-grant repair (client, ~25 lines).** Have `applyActions` return the give_item promises
and let `_fireTimer` await them. On a network failure, take the id back out of `firedTimers` so the
next tick tries again, with a cap. On a refusal, log and stop. No bootstrap change. If server-side
repair is still wanted, `pendingGrants` = timer grants whose id is in `scenarioClock.timers.fired`
and whose item is neither held nor in `grantsClaimed`. That needs no trigger evaluation either.

**What it gives up.** In lab_social_engineering the opener could be claimed before
`operations_room` is unlocked, where today it needs the room (a server-verified key lock). In
lab_physical_pentest nothing changes: the reward can already be claimed from the first second. The
item is a flavour opener. The SE lab's archive is the only content behind it, and the optional task
it completes is `manual`, so it can be forged anyway. If the user wants to keep the SE lab's room
gate, one optional field does it without a trigger evaluator: `"grantAfterRoom": "operations_room"`
on the action, checked against `unlockedRooms`.

**Separate commits, no dependency on grants:** the flag-station check (m1), stripping or
canonicalising lock-relevant fields on every stored item (M6), filtering the unlock response (M7).

**Later phase (Q8):** give each lab a trigger the server establishes, for example the BadUSB use
recorded through an endpoint that checks the device is held and the target room is unlocked, or the
mail runner's delivery marking the foothold. Then a trigger check on grants means something, and
the plan's §2.3 table (server-verified kinds only) is the right design for it.

Size: about 125 lines of code plus about 200 of tests, against ~700, and the twins are gone at the
end of it.

## 5. Tests

The plan's list is thorough for what it builds. The gaps matter more than the volume.

Missing, whichever design is chosen:
- **Name-only claim of a granted item** (B1): `{type:'pc', name:'<grant name>'}` with a twin in an
  open room must be decided by the grant rule. The plan currently tests the opposite.
- **The opener's real path after the twin is deleted**: `POST /unlock` `method: 'unlocked'` on the
  grant id → 200 only while held; then `GET /container/<id>` → contents; the nested archive's
  password unlock → 200. Before the item is held, all three → refused. This is the live path
  (`unlock-system.js:122` → `container-minigame.js:141`), and per the fix-claims memory a helper test
  on `find_container_in_scenario` alone is not proof.
- **The unlock response carries no `requires`** for nested locked items (M7).
- **Forged fields**: a notepad add with `opens_lock: '<door key id>'`, then a door `key` unlock → 422;
  a notepad with `scenarioData: {type:'lockpick'}`, then a `lockpick` unlock → 422 (M6).
- **Flag-station**: the plan's case is right. Add secgen_vm_lab's id-less keycard (name match), and a
  flag typed in a different case.
- **Reset** clears `grantsClaimed` and the opener (m6).

Fine as planned: the Rails allow/refuse matrix for type, id and undeclared items; repeat-while-held
through `:971`; legacy suites (`npc_give_test.rb`, `headless_give_test.rb`,
`flag_reward_unlock_door_test.rb`, all present); `inventory-restore-no-revalidate.test.mjs` (present).

Not worth it if §4 is taken: the trigger_globals race tests, the two-thread test (the serialisation
is already pinned by `test/controllers/break_escape/game_state_locking_test.rb`, which is the
"game-1022" test the plan is unsure exists), and the JS/Ruby condition table.

Live checks: keep both labs' runs (play the beat, opener appears, open it, reload, open again; SE
archive unlock) and the blocked-request repair. Change the "console POST before the beat returns
409" step to match the chosen design: under §4 it is accepted in both labs, and that should be
stated in the commit message rather than discovered.

## 6. Open questions Q1–Q9

| Q | Plan default | Review |
|---|---|---|
| Q1 trigger globals in the claim or sync first | carry them | Moot under §4. If a client-global trigger check is kept, carrying is the better of the two mechanically, but it must not be described as security (M1). |
| Q2 trigger unmet, twin reachable: refuse | refuse | Agree, but only meaningful once B1 is fixed. Under §4 there is no trigger to be unmet. |
| Q3 ink `#give_item` | out | Agree. `itemsHeld` plus `encounteredNPCs` already covers it. |
| Q4 flag-station fix in the same change | yes | Fix it, but as its own commit ahead of grants; it is independent and ~20 lines, not "a few" (m1). |
| Q5 repeatable grants | no | Agree. Note the interact-grant alert (m4). |
| Q6 phase 2 later | follow-up | Disagree. Removing the twin is the point; do it in the first change (M2). |
| Q7 canonical item for every pickup | grants only, audit later | Disagree. Field injection is a lock bypass (M6). Do at least the lock-field strip now, separately. |
| Q8 server-verified lab triggers | not now, backlog | Agree, and it is the right home for all trigger checking (§4, later phase). Ask the user whether the labs need cheat resistance at all. |
| Q9 eventMapping give_item | no | Agree. Confirmed: mappings carry no actions list (`npc-manager.js:856` and the mapping fields around it). |

## 7. The lab_social_engineering locked-room case

The validator warns that `pc/sofia_remote` only matches an object in the key-locked
`operations_room` (`validate_scenario.rb:2096–2101`; reproduced on the current tree), on the premise
that the trigger can fire first.

**In honest play it cannot.** `phish_lord_foothold` is set only by `ink/lord_mail.ink:43`, which runs
when a phish sent from the mail client is delivered. The only mail client is `mail_workstation`, a
`takeable: false` `mail_terminal` inside `operations_room` (`scenario.json.erb:1752–1765`). Every
`mail_terminal` opens the mail minigame (`minigame-registry.js:32`); there is no other entry. So the
room is in `unlockedRooms` before any phish can be sent, and the warning is a false positive for
this lab. (The warning is still right in general, for a reward whose trigger does not depend on the
room.)

**Does the plan fix it anyway?** Yes. A matched grant bypasses room checks (plan §3.4), so a
trigger that fired early would be accepted. The opener's later `POST /unlock` and `GET /container`
apply no room check today either. §4 of this review fixes it the same way, and its validator change
removes the warning for declared items.

## 8. Wrong or stale claims

1. §3.2 "The attacker now needs two requests instead of one." With §2.5 the claim carries the
   trigger: one request (M1).
2. §2.6 "a twin can no longer be claimed early" and §3.2 "Claim before the trigger: refused (409),
   even if a twin is reachable." False for a name-only claim (B1).
3. §3.2 "The server log records a grant claimed with its trigger set by the claim itself … something
   to audit." Honest claims look the same (M1).
4. §1.2 step 8 "fetches `GET .../container?container_id=<id>`." The route is
   `GET /container/:container_id` (`routes.rb:27`, `container-minigame.js:141`), and it runs after a
   `POST /unlock` `method: 'unlocked'` whose response already carries the raw contents (M3, M7).
5. §2.4 and §5.1 `scenarioClock.fired`. The fired list is `scenarioClock.timers.fired`
   (`state-sync.js:178–182`, `game.rb:1806–1811`).
6. §3.1 field injection "Type and id must match a real object". Not for `notepad` (no lookup at all,
   `:1761`) or a decor cup (`:1768`), and the consequence is a lock bypass (M6).
7. §3.3 "takes a few lines" (m1).
8. §2.1 walk sources: misses the esd-pushbutton minigame's actions (m2).
9. §4.3 "uncommitted at the time of writing": `check_give_item_collectible` is committed
   (65513244e, `validate_scenario.rb:2035`).
10. §4.1 twin line numbers for lab_physical_pentest (`:926–955`) were right at bdaf9ce3d but have
    drifted after 53f184204 and b8dbed380: the object now starts at `:912`.
11. §1.3 "33 call sites" counts comment lines too. Harmless; the conclusion (none on the timer or
    trigger path for these two labs) holds.

Everything else in §1 checked out (§2 of this review).
