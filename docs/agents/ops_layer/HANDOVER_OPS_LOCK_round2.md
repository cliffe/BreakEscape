# Handover: lock second-step plan, round 2 revision

Worktree `.claude/worktrees/ops-plan`. Plan `docs/achitechture/OPS_LOCK_SECOND_STEP_PLAN.md`
(1063 lines, **unedited so far**). Decisions log
`docs/agents/ops_layer/reviews/OPS_LOCK_SECOND_STEP_DECISIONS.md` (unedited; append under a new
heading "## Round 2 picks (2026-11-19)", one line per change). Rulings: end of
`docs/agents/ops_layer/USER_PICKS_2026-11-19.md` (R2-4 a, R2-5 b, R2-10 a, R2-11 a). Edit tool
only; no commit; plan stays standalone (no reviews/rounds/picks wording).

## Done

- Read the whole plan and the rulings.
- Finished the inventory audit in the real code (below). No plan edits made yet.

## Open (all edits still to do)

1. **Section 15**: delete questions 1 (lines 1022-1035, including the "cut options" text) and 9
   (1036-1039). Renumber the rest or leave numbers and fix references; the body cites "open
   question 1" at 5.2 step 4 (line 291-292), "open question 2/3/4/5/7/8" elsewhere. Remove
   question 7 too (R2-5 answered b).
2. **State as decisions** where the body cites them: 5.2 step 4 (`npc` does not skip the
   step), 5.4 (pane waits for conversation and its screens). Replace "(open question 1)" with
   a plain statement; question 9 is not cited in the body.
3. **Section 14, "Found in existing code"** (lines 1010-1018): mark both bugs as fixed outside
   this plan on their own branch; keep the text that depends on them (the keyring revocation
   and the validator's card types). Section 9's `code_device` and card wording unchanged.
4. **Section 4 "Where it may sit"** (lines 182-192) and section 9's error at line 702-703:
   replace the carried-item refusal with the G3 rules below; drop "open question 7".
5. **Stage table** (line 144-147): add G3, carried items, needs G1, lands after G1 either side
   of G2; `password`/`pin` only until G2, then G2's types.
6. **New subsection** (suggest 5.5 "Carried items (G3)") with the audit table and the design.
7. **Tests** (section 11): Rails rows per risky path; node rows; beat B13 in the feature
   scenario (e.g. Gordon's ink hands over `gordon_briefcase`, `pin`, `push`, owner Gordon;
   drop it, pick it up, request count unchanged; remove_item via ink while a record is live,
   then a crafted /unlock is the invented-id 422; give it back... ). Add the briefcase to the
   cast/locks paragraph (line 890-900).
8. **Sections 10, 12**: G3 is behind `second_step_ids`; shared-file rows for `game.rb`
   (reach test), `games_controller.rb` (GET /container, take routes), validator.
9. Decisions log lines; then report.

## Audit (verified file:line, worktree code)

Server identity: every path stores or resolves the **authored scenario id**; the server never
resolves an inventory copy for /unlock. `find_scenario_object` (`game.rb:4867-4916`) walks
rooms (scenario copy, ignores `objects_removed`), profiles, shares, held grants
(`held_grant_items` `:4969-4980`, needs the grant held), held USB sticks (`:5011-5021`, fresh
copy, needs held + give/KO record), `released_npc_containers` (`:4945-4959`, scenario copy of an
NPC-held container once `npc_given_items` or KO releases it; **does not test that the player
still holds it**), start items (`:4909-4914`, authored copy). GET /container's
`find_container_in_scenario` (`games_controller.rb:3000-3025`) walks the same homes.
So a step record keyed `object:<authoredId>` follows the item through every move; copies never
hold step state.

| Path | Where | Lock/step state travels? | Server record keyed by surviving id? | Risk |
|---|---|---|---|---|
| Start inventory | `game.rb:7530-7555` (filtered copy, `restamp_item_credential!`); re-add always valid `games_controller.rb:3373-3382` | `locked`, `secondStep` (public) yes; `contents`/`requires` stripped | yes, authored id | re-add by crafted add at any time (existing); harmless: same record |
| Pick-up from world | `POST /inventory add` `games_controller.rb:1400-1452` → `validate_item_collectible` `:3335-3491` → `canonical_inventory_item` `:3315-3333` (server copy, `locked` cleared if id in `unlockedObjects`, then filtered); room `remove_item_from_room!` `game.rb:~1225-1262` (`objects_removed`) | yes | yes | none new |
| Pick-up from containers | same route, location `container`, test `unlockedObjects.include?(container_id)` by id or **name** (`:3424-3430`); search one level (`:3660-3666`) and released NPC containers (`:3688-3695`) | yes | yes | name test: Rule B already replaces it for gated containers |
| NPC give_item (ink) | client `chat-helpers.js:126` → `NPCGameBridge.giveItem` (`npc-game-bridge.js:~230-300`, `sourceNpcId`) → `addToInventory` (`inventory.js:753`, posts `source_npc_id` `:856`); server `find_accessible_item` priority 0.5 (`games_controller.rb:3617-3640`), then `record_npc_gift!` (`game.rb:817-834`) | yes (scenario itemsHeld copy, filtered) | yes; release makes `released_npc_containers` resolve it | before release `/unlock` resolves nothing (422), so no record can exist before a give |
| Declared-grant give (action `give_item`) | `apply-actions.js:249-266` → `addToInventory`; server grant branch `games_controller.rb:3384-3400`; contents stripped `:3324-3327` | yes | yes; resolves only while held | none new |
| NPC inventory take / "pickpocket" | NPC-mode container `npc-game-bridge.js:~370-400`, `container-minigame.js:2380-2400`, `:2579-2650`; same add route with `source_npc_id`. No separate pickpocket feature in client; server comments name it as a give record (`game.rb:4985`) | yes | yes | clicking a locked held item in NPC mode delegates to unlock (`container-minigame.js:2302-2304`) while still held: resolves nothing → 422 |
| KO drop | `update_room add_object` npc branch, `game.rb:1077-1138`: persists the **full** held definition (contents, requires) into `objects_added` with authored id | full def stored server-side; room payload filter drops locked contents (`game.rb:7226-7232`), marker by id | yes | pickup via priority 0 (`games_controller.rb:3605-3615`) then canonical filter: fine |
| Player drop | `item-drop.js:~370-395` (add_object `player_drop`, then inventory remove); server `game.rb:1143-1167` needs `droppable: true`, stores the held (filtered) copy, same id, `droppedItems` | yes | yes | drop and pick up does not touch `lockSteps`, so no reset of request count; no bypass |
| Put in container | none for player items (no route stores a held item into a container); `storeIn` is a tray filing only (`capture-log-model.js:51`) | n/a | n/a | none |
| NPC carry (needs) | `carry_object` etc. `games_controller.rb:1140-1183`; `carriable_object?` `game.rb:1365-1376` refuses `locked`, `lockType`, `requires`, contents | never carries a lock | n/a | none |
| remove_item / consume / plant | `apply-actions.js:274-293` (`sendInventoryRemove` `:37-50`, `used_on`), `consumables.js:235-250`, server `inventory remove` `games_controller.rb:1454-1460` → `remove_inventory_item!` `game.rb:845-850` (no validation; by id) | item leaves; `lockSteps` untouched | record stays under id | **stale record**: `released_npc_containers` and start items still resolve after the item has gone, so a crafted `/unlock` on a gated item the player no longer holds would open it (also true today for plain locked carried items) |
| Hide device | `inventory hide` `games_controller.rb:1462-1473`, `capture_proofs.rb:79` | item leaves | stays | as above |
| Card copier / cloning | `POST clone_card` `games_controller.rb:1655`; `clone_source_keycard` `game.rb:4173-4188` copies keycards only (`saved_cards`, not inventory objects); in-reach via `path_unlocked?` by id | n/a (cards are first factors) | n/a | keycard nested in a gated carried item: take needs the container open by id; consistent |
| Copy transfer (desktop/share) | `record_copied_item!` `game.rb:4258`, `games_controller.rb:1448` | yes | **one id, two copies** | copies share one record and one `unlockedObjects` id: opening one opens both |
| Save/reload/bootstrap | `GET /scenario` sends `playerInventory` = `client_inventory` (`game.rb:1774-1783`, `filter_inventory_for_client!` `:1902-1922`) and deletes `startItemsInInventory` (`games_controller.rb:484-491`); stored copy keeps `locked: true` after an open (no writer updates it); reopen goes through `/unlock` "already open" by id | `secondStep` public, kept | yes; `lockSteps` server-only | none new; reopen after reload as today for a locked start item |
| Re-send on reload | add with no source and already held → `already: true` (`games_controller.rb:1416-1425`) | n/a | n/a | none |
| Dedupe | `inventory_includes?` by id, else type+name (`game.rb:704-717`) | | | gated item must have an id (validator already) |
| Server inventory validation | `validate_item_collectible` (above); client-added objects get a fresh id and lose `FORGEABLE_ITEM_FIELDS` (`item_identity.rb:28-32`, `game.rb:1183-1196`) | | | add `secondStep` to `FORGEABLE_ITEM_FIELDS` so a client-built object cannot claim one |
| Priority-0 type-only match | `games_controller.rb:3610-3612` (`item_id.nil?`) | | | existing; same record either way |

## Design decided (write into the plan)

- **Keying**: unchanged `lockSteps["object:<authoredId>"]`; no state on any copy; no new key; no
  write on any inventory path. Drop/pick-up, give, KO, reload never reset or move a record.
- **Rule D, reach for a carried gated object** (G3): a gated object is *carried* when it is a
  start item, an `itemsHeld` entry, a declared-grant item, or `takeable`. For it, the gate in
  `/unlock`, GET /container, the take routes and the `/mfa/*` lock routes first require
  `Game#carried_step_reachable?(object)`: the server inventory holds it (`ItemIdentity.held_in?`
  by id, client-added excluded), or an open room's `objects_added` holds a copy with its id, or
  it is still in its authored place and that place is reachable today (a room object not in its
  room's `objects_removed`, room open; a nested takeable not held and not dropped, parent open by
  Rule B). NPC-held before release: never. Fails → invented-id 422 at `/unlock`, 404 "Container
  not found", the take route's "Item not found in scenario", `/mfa/*` 404 (pane closes as an
  expiry). Closed list only: no new refusal body. Active only for ids in `second_step_ids`.
- Copies share one record (decision, stated); validator warning on a gated object with a
  `transfer` that allows copy.
- **Validator** (replaces the carried refusal): allowed on carried items with an id; errors on
  `secondStep` on a key or card (`opens_lock`, `key_id`, `card_id`, type `keycard`), a `usb`
  item, a consumable (`consumable: true` or a consumable type), a hideable device, or an
  item an NPC can carry (already excluded by `locked`). Same uniqueness rules.
- **Tests**: Rails per risky path (remove then crafted /unlock 422; drop/pick-up keeps the
  count; give then KO-drop copy; copy-transfer shares; start item re-add; client-added object
  with `secondStep` stripped; reach refusal leaves the record). Node: the pane over an
  inventory item; a gated held item reopened after reload.
- Shipped scenarios: all behind `second_step_ids` (empty), section 10 proof covers it.

## Section 14 requests to add

- MFA plan: `/mfa/*` lock form calls the reach test (or accepts a hook) before the record.
- Core plan (or whoever owns `item_identity.rb`): add `secondStep` to `FORGEABLE_ITEM_FIELDS`.

## Files touched

- This note only.
