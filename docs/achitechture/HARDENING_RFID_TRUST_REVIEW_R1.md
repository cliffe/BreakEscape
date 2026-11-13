# Adversarial review R1: RFID requires-only trust gap

Branch `build/hard-rfid`, commits `2f5471209..eeafd24eb`. Reviewer did an independent
scenario audit, traced the server and client unlock paths, checked the cheat and sync
surface, and ran the touched tests (including a revert to confirm they guard the fix).

## Verdict

APPROVE. No blocker, no major. The fix closes the "requires-only rfid lock opens for
anyone" gap without blocking any honest path in a deployed mission, adds no new synced
state, and opens no new forge surface. Findings below are minor or informational only.

## Counts

- Blocker: 0
- Major: 0
- Minor / informational: 3

## What the fix does (confirmed)

`app/models/break_escape/game.rb:2537` `rfid_lock_passes?` now returns
`rfid_requires_held?(lock)` for a lock with no `access`, and for an `access` lock reached
with no `card_ids` (the mixed lock opened by its `requires`). `rfid_requires_held?`
(`game.rb:2555`) passes only when the player provably holds, in server state, a non-revoked
required card: a keycard whose `card_id` or `opens_lock`/`key_id` (`held_keycard_ref_ids`,
`game.rb:2580`) is a required id, or a recorded clone (`serverClones`) while an
`rfid_cloner` is held, with a UID-only clone counting only at `acceptsUIDOnly`. The old
`rfid_requires_revoked?` (open-unless-revoked) is removed.

## Honest-path verification

- Client sends a bare `method:"rfid"` POST (no `card_ids`) only in step 1a — a held keycard
  matches `requires` (`unlock-system.js:1221`) — or step 1b, a saved clone matches
  (`:1237`). A lock whose `requires` no held card/clone satisfies never reaches a POST; the
  client refuses locally (`:1281`). So the server only ever needs to confirm a held card or
  recorded clone, which it now does.
- `held_keycard_ref_ids` precedence (`card_id` else `lock_ref`) is identical to the client's
  `getCardId = card_id || lockRef` (`unlock-system.js:75`), so the two agree on every card,
  including the opens_lock-only keycards (m01/m02/m04/m05/m07/m08/sis02).
- Door already open: `validate_unlock` early-returns on `room_unlocked?`/`object_unlocked?`
  (`game.rb:3078`, `:3171`) before the rfid branch, independent of `card_ids`. A gate- or
  HaX-opened door stays open.
- NPC `unlockDoor` route (m09 `stacks_release`; m10 `tg_story_lock_*`): these phantom ids
  have no card. Honest play opens them by HaX's `unlockDoor` mappings (method `npc`,
  including `door_unlock_attempt` with cooldown 0 and `game_loaded` for reload,
  `m10 scenario:1710-1848`), handled by the `method == 'npc'` branch (`game.rb:3099`). The
  rfid-no-card path that used to open them is exactly the cheat being closed.
- Clones persist in `player_state['serverClones']` (written only by `record_card_clone!`,
  `game.rb:2641`, which requires the cloner held, the NPC encountered and owner of the card).
  They count only while an `rfid_cloner` is held, same as the access-list rule
  (`held_rfid_cards`). Dropped then re-picked-up: the record survives and counts again. No
  per-player lending exists. UID-only (MIFARE_DESFire) clones count only at `acceptsUIDOnly`.
- Stored game in progress: reads only existing `inventory`, `serverClones` and the
  `revoked_card_ids` global; no field added, renamed or migrated. A keycard already in
  inventory still opens; a room already in `unlockedRooms` stays open.

## Cheat and sync surface

- `held_keycard_ref_ids` and `held_keycard_ids` skip `ItemIdentity.client_forged?` items and
  read only the server's canonical inventory copy. A client `/inventory` add is filtered by
  `canonical_inventory_item` -> `CLIENT_ITEM_FORBIDDEN_FIELDS` (strips `card_id`, `opens_lock`,
  `key_id`, whole `scenarioData`), so a client cannot mint a keycard id it did not earn.
- `sync_state` merges globals, ink vars, mail, phone, notes, health, visibility, hostility,
  clock and captures — not `inventory` and not `serverClones`. Both stay server-authoritative.
- SYNC SIZE: no new per-game field. `card_ids` is request-only, never stored. Payload size and
  shape unchanged. Confirmed against `merge_last_write_wins_sections` / `merge_grow_only_sections`.

## Scenario audit (every rfid lock without `access`, deployed and test)

| Scenario | Required id | How the player holds it (server-visible) | OK |
|---|---|---|---|
| m01_first_contact | server_keycard | keycard `opens_lock=server_keycard` (pickup) | yes |
| m02_ransomed_trust | server_room_keycard | keycard `opens_lock` | yes |
| m03_ghost | receptionist_badge | keycard `card_id` + clone of receptionist | yes |
| m03_ghost | victoria_keycard_clone | physical keycard / clone / HaX relay; MIFARE_Classic (not UID) | yes |
| m04_critical_failure | server_room_keycard, facility_keycard_level1 | keycards `opens_lock` (+ clone) | yes |
| m05_insider_trading | employee_badge | keycard `opens_lock=employee_badge` | yes |
| m05_insider_trading | office_keycard | `torres_office_keycard` keycard `opens_lock=office_keycard` (no card_id) | yes |
| m06_follow_the_money | cto_badge | keycard `m06_cto_badge` `card_id=cto_badge` (also opens_lock=cto_access_badge; card_id wins, matches requires) | yes |
| m06_follow_the_money | executive_badge | keycard `card_id=executive_badge` | yes |
| m07 / m08 | server_zone_badge | keycard `opens_lock` + clone (EM4100) | yes |
| m09_digital_archaeology | reading_staff_door, stacks_card, tape_room_reader | keycards `card_id`/`opens_lock` (+ clone) | yes |
| m09_digital_archaeology | stacks_release | phantom; HaX `unlockDoor` (npc) | yes |
| m10_full_disclosure | tg_power_room_card | keycard `card_id`/`opens_lock` | yes |
| m10_full_disclosure | tg_story_lock_* (4) | phantom; HaX `unlockDoor` (npc) | yes |
| secgen_vm_lab | server_keycard | keycard `card_id` | yes |
| sis01_healthcare | ravi_rfid_card | keycard `card_id` | yes |
| sis02_energy | battery_hall_badge, workshop_rfid_key | keycards `opens_lock` | yes |
| lab_physical_pentest | cm_records_badge | clone of NPC (EM4100) or tailgate; see note | yes |
| lab_physical_pentest | lw_comms_card | keycard `card_id` + clone | yes |
| test_clone_left_card | clerk_card | keycard `card_id` + clone | yes |
| test_gate_tailgate | test_staff_badge | clone of NPC (EM4100), cloner is a start item; or gate | yes |
| test_access_habits | store_a_badge, store_b_badge | tailgate/gate (door_unlocked early return), not the rfid path | yes |
| test_bark_bubbles | store_a_badge (x2) | tailgate/gate | yes |
| test-rfid | master_keycard | clone of security_guard; cloner is a start item | yes |
| test-rfid-multiprotocol | employee_badge, hotel_keycard, corporate_badge | clones (EM4100 / MIFARE_Classic); cloner is a start item | yes (see minor 2) |

(lab_physical_pentest `P1` is an access-list lock and is unchanged by the fix.)

## Minor / informational findings

1. **Brief scope note (informational).** The brief lists `lab_social_engineering` among the
   deployed missions touched by this change. That scenario has no rfid lock
   (`grep -rn rfid scenarios/lab_social_engineering` is empty), so the fix does not affect it.
   No action; flagged so the deploy checklist is not run against a non-existent door.

2. **test-rfid-multiprotocol DESFire demo (minor, non-deployed).** Its "Level 4" cloned
   `executive_card` is `MIFARE_DESFire` (UID-only) and no lock sets `acceptsUIDOnly`, so after
   the fix a UID-only clone opens no requires-only lock. The scenario's own completion path
   uses `corporate_badge` (MIFARE_Classic, not UID-only), which still opens, so the demo is
   still completable; the change only stops a UID-only clone opening a lock it was never meant
   to. This scenario has no automated-test references. No fix needed; noting the behaviour
   change for anyone who uses it as a manual protocol demo. Suggested: if the DESFire level is
   meant to be a positive open, give its lock `acceptsUIDOnly: true`; otherwise relabel it as
   the "cannot clone" negative case.

3. **UID-only rule is correct and consistent (informational).** A UID-only clone now counts at
   a requires-only lock only with `acceptsUIDOnly`, matching `rfid_passing_card_id`'s access-list
   rule. No deployed mission clones a MIFARE_DESFire card for a required door (all deployed
   cloned cards are EM4100 or MIFARE_Classic_*), so no honest clone play is blocked.

## Tests (run by reviewer, RBENV_VERSION=2.7.8, no lock)

- `access_model_rfid_test.rb`: 53 runs, 212 assertions, 0 failures.
- `unlock_system_test.rb` + `game_test.rb`: 145 runs, 566 assertions, 0 failures.
- Load-bearing check: forcing `rfid_requires_held?` to return true (old open-for-anyone)
  produced 7 failures across the two controller/integration files, so the tests genuinely
  guard the fix on the real `/unlock` path, not only a helper.

Live browser: not re-run by the reviewer; the integration test drives the real `/unlock`
controller path and the builder's recorded browser proof on `test-rfid` exercised the same
`notifyServerUnlock -> POST /unlock method:rfid -> rfid_lock_passes? -> rfid_requires_held?`
chain that m01's opens_lock keycard uses. The `access_model_rfid_test` "opened by a held
opens_lock keycard" case covers m01/sis02's card shape directly.

## Outcomes (R1 follow-up by the builder)

- Minor 1 (brief lists lab_social_engineering, which has no rfid lock): no change.
  Informational note for the deploy checklist; nothing to fix.
- Minor 2 (test-rfid-multiprotocol Level 4 DESFire/UID): fixed. Level 4's documented
  intent is a positive UID-emulation demo, but the Level 4 door required corporate_badge
  (a Classic card) and the DESFire card gated nothing, so acceptsUIDOnly on that door
  alone would have been inert. The DESFire guard (guard_high) was moved to the Level 3
  room so its UID clone is obtainable before the door, and the desfire_room lock now
  `requires: ["executive_card"]` with `acceptsUIDOnly: true`. A DESFire clone is recorded
  uidOnly and is credited only at an acceptsUIDOnly lock, so the UID clone now opens the
  weakly-configured Level 4 reader, teaching the intended lesson. Validator: 0 errors.
- Minor 3 (UID-only rule correct and consistent): no change. Confirmed by the fix.

### Live proofs on the real page (builder, keyless server :3634, window.__test present)

Real page's own fetch, apiClient.unlock('door', <door>, null, 'rfid') shape (no card_ids):

| Mission | Game | Door | Held | Request | Answer |
|---|---|---|---|---|---|
| m01 honest | 3187 | server_room | keycard opens_lock=server_keycard | POST /unlock door server_room method rfid (no card_ids) | 200 {success:true} |
| m01 forged | 3188 | server_room | none | POST /unlock door server_room method rfid (no card_ids) | 422 {success:false, "Invalid attempt"} |
| sis02 honest | 3189 | battery_hall_1 | keycard opens_lock=battery_hall_badge | POST /unlock door battery_hall_1 method rfid (no card_ids) | 200 {success:true} |

The honest opens_lock keycard is resolved server-side (held_keycard_ref_ids) and matches
the door's requires; the forged no-card request is refused by rfid_requires_held?, the
closed gap. Server stopped after the run.
