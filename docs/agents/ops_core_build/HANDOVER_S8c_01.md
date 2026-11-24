# S8c unit 01 handover: unchanged fixtures and the carrier survey

Written 2026-11-24. Branch `ops-lock2`, captured before any S8c engine edit.

## What the existing fixtures already pinned

`log_unlock_refusals` (pin door and object, rfid doors and one rfid object with an access list,
an unknown object), `log_container_cases` (a pin safe before and after it opens, sign-in PCs,
profile folders), the `privilege_*` cases (password archive under a session, sign-in, keyring),
the `core_*` cases (bootstraps and rooms of every scenario with `networks`), and the `mfa_*` cases
(sign-in, lockout, phone rule, three bootstraps). Not pinned until now: password, key, lockpick,
combination, cryptex, biometric, bluetooth, ble and rfid-without-a-list locks; a container take
before and after a lock opens; the `npc` door method; the carried-item flows of the three G4
scenarios.

## What unit 01 added (`test/support/ops_unchanged_cases.rb`, `lock_cases`)

| Fixture | Scenario | Pins |
|---|---|---|
| `lock_unlock_gaps_give` | test_unlock_gaps | start cryptex (`test_start_cryptex`), combination locker, cryptex box, courier bag given by `test_courier`, combination and cryptex doors, container and take before and after |
| `lock_unlock_gaps_ko` | test_unlock_gaps | courier bag held, then dropped by a knock-out, opened, picked up and emptied |
| `lock_ceo_exfil_locks` | ceo_exfil | password PC, pin safe, Bluetooth `Tablet Device` (generated id `reception_tablet_3`), key and lockpick doors and key box, pin doors, method mismatches |
| `lock_ceo_exfil_npc_door` | ceo_exfil | `npc` door unlock: NPC not met, no permission, unknown, right, repeat |
| `lock_biometric_breach` | biometric_breach | biometric doors, safe and suitcase; pin door; key door |
| `lock_ble_scanner` | test-ble-scanner | ble safe and tablet |
| `lock_rfid_no_list_single`, `lock_rfid_no_list_multi` | test-rfid, test-rfid-multiprotocol | rfid doors with no access list |
| `lock_m5_channels_terminal` | test_social_m5_channels | `m5_locked_terminal` (takeable, pin): container and inventory add before and after |

Every case begins and ends with `GET /scenario` (the bootstrap), and fetches the rooms it opens.
rfid WITH an access list stays pinned by `log_unlock_refusals`; a door-level `bluetooth` lock has
no shipped scenario (only objects), so none is pinned.

## Carrier survey (top-level carried items with a lock or `contents`, every scenario rendered through ERB)

A carried item is a start item, an NPC `itemsHeld` entry (room NPCs and headless records), a
declared grant item (`DeclaredGrants.for`) or a `takeable` room object. "Depth" is 0 for the
top-level carrier and 1 or more for a container nested inside one.

| Scenario | Home | Id | Type | Lock | Depth |
|---|---|---|---|---|---|
| ceo_exfil | room:reception | (no id; generated `reception_tablet_3`) | tablet | bluetooth | 0 |
| test_social_m5_channels | room:m5_room | m5_locked_terminal | mail_terminal | pin | 0 |
| test_unlock_gaps | start | test_start_cryptex | bag1 | cryptex | 0 |
| test_unlock_gaps | npc:test_courier | test_courier_bag | bag1 | password | 0 |
| lab_social_engineering | grant:timers[0]/actions[0] | sofia_remote | pc | none (holds `contents`) | 0 |
| lab_social_engineering | grant:timers[0]/actions[0] | sofia_archive | zip_archive | password | 1 (inside `sofia_remote`) |
| lab_physical_pentest | grant:timers[11]/actions[0] | records_remote_session | pc | none (holds `contents`) | 0 |
| test_capture_log | grant:timers[3]/actions[0] | remote_session_box | pc | none (holds `contents`) | 0 |

Notes for unit 16:

- No scenario has a nested carrier inside a start item, an NPC `itemsHeld` entry or a `takeable`
  room object. The only nesting is the grant `sofia_remote` holding `sofia_archive`.
- Only one carrier has no id: the `ceo_exfil` tablet (a bluetooth lock). An id-less plain carrier
  is not covered by the carried check and keeps today's behaviour.
- The three grant items are Remote Session openers (type `pc`); their `contents` are served only
  while the grant is held (`DeclaredGrants`).
- Campaign missions (m01 to m10, sis*) and the other scenarios have no carried item with a lock or
  `contents`. 8 rows in all, from 237 scenario folders, none failing to render.
