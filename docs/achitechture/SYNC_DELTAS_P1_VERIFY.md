# Sync deltas P1 verification (step 4, cloner saved cards as one-card deltas)

Date: 2026-11-12. Base: `build/sync-deltas` at `fb25a92c0` (step 4). Branch: `build/sync-p1-verify`.
Scope: verifies SYNC_DELTAS_PLAN sections 5.3 (wire format and size) and 5.4 (compatibility), the
three open P1 items in the build log's "P1 verification items" list. No engine code was changed.

Server caps checked (game.rb:3468 to 3470): 4 KB per card (`MAX_SAVED_CARD_BYTES`), 50 cards
(`MAX_SAVED_CARDS`), 64 KB total (`MAX_SAVED_CARDS_BYTES`).

## 1. Cloner-card census

Method: each scenario's ERB was rendered to JSON and the cloneable card definitions were extracted
exactly as the server does, keycards (`type == "keycard"` with a `card_id`, `cloneable != false`,
found in room objects, container `contents`, NPC `itemsHeld`, `startItemsInInventory` and
`accountProfiles` contents, game.rb:2135) and NPC cards (`creds.card` or `rfidCard` with a `card_id`,
on an NPC that is not `cloneable: false`, game.rb:1133). A card_id shared by a keycard and an NPC
card counts once (the stored list is keyed by `card_id`, add_saved_card! game.rb:3510). The
worst-case stored size per card was built as `add_saved_card!` builds it (card_id, name,
rfid_protocol, any authored `rfid_*`, `rfid_data` picked to `SAVED_CARD_DATA_KEYS`, timestamp), with
`rfid_data` at the maximum its protocol allows: a fully cracked MIFARE Classic carries 16 sectors of
`{keyA, keyB}` (12 hex chars each), EM4100/HID carries cardId/hex/facility/cardNumber/uid, DESFire is
UID-only.

All 176 scenarios rendered and were checked. Every scenario is within all three bounds. The named
set and every other card-bearing scenario:

| Scenario | Cloner in game | Cloneable cards | Worst-case total (bytes) | Largest card (bytes) | Within 50 / 64 KB / 4 KB |
|---|---|---:|---:|---:|---|
| test-rfid | yes | 2 | 533 | 298 | yes |
| lab_physical_pentest | yes* | 2 | 482 | 243 | yes |
| m03_ghost_in_the_machine | yes | 2 | 2179 | 1100 | yes |
| m04_critical_failure | yes | 2 | 498 | 251 | yes |
| m05_insider_trading | yes | 1 | 247 | 247 | yes |
| m06_follow_the_money | yes | 2 | 492 | 252 | yes |
| m07_architects_gambit | yes | 1 | 253 | 253 | yes |
| m08_the_mole | yes | 1 | 1084 | 1084 | yes |
| m09_digital_archaeology | yes | 3 | 1565 | 1076 | yes |
| m10_full_disclosure | yes | 1 | 246 | 246 | yes |
| test-rfid-multiprotocol | yes | 7 | 4161 | 1085 | yes |
| test_access_doors | yes | 5 | 1176 | 253 | yes |
| test_clone_left_card | yes | 2 | 470 | 236 | yes |
| test_gate_tailgate | yes | 1 | 241 | 241 | yes |
| test_access_habits | no cloner | 2 | 466 | 233 | yes |
| test_access_work | no cloner | 1 | 237 | 237 | yes |
| secgen_vm_lab | no cloner | 1 | 240 | 240 | yes |
| sis01_healthcare | no cloner | 1 | 266 | 266 | yes |

\* lab_physical_pentest acquires the cloner during the lab; it is not in the start inventory.
All other scenarios define no cloneable card (worst-case saved_cards is empty).

The worst case anywhere is test-rfid-multiprotocol: 7 cards, about 4.1 KB total, largest card about
1.1 KB. That is 14 % of the 50-card cap, 6 % of the 64 KB total cap, and 27 % of the 4 KB per-card
cap. The real stored card is smaller than this worst case, because a card only carries the sectors it
has cracked and few scenarios reach a full MIFARE crack. The bound holds with wide headroom
everywhere.

Per-card detail for the named set (card_id, protocol, source):

- test-rfid: `ceo_keycard` EM4100 (world keycard, 298 B); `master_keycard` EM4100 (NPC security_guard, 235 B).
- lab_physical_pentest: `lw_comms_card` EM4100 (world keycard, 239 B); `cm_records_badge` EM4100 (NPC len, 243 B).
- m03: `receptionist_badge` MIFARE_Classic_Weak_Defaults (keycard + NPC ffion_rees, 1079 B); `victoria_keycard_clone` MIFARE_Classic_Custom_Keys (keycard + NPC victoria_sterling, 1100 B).
- m04: `facility_keycard_level1` EM4100 (NPC robert_vance, 251 B); `server_room_keycard` EM4100 (NPC operative_relay, 247 B).
- m05: `employee_badge` EM4100 (NPC owen_gallagher, 247 B).
- m06: `cto_badge` EM4100 (keycard + NPC irina_volkova, 240 B); `executive_badge` EM4100 (keycard, 252 B).
- m07: `server_zone_badge` EM4100 (NPC ray_hollis, 253 B).
- m08: `server_zone_badge` MIFARE_Classic_Custom_Keys (NPC director_netherton, 1084 B).
- m09: `reading_staff_door` EM4100 (keycard + NPC noor_haddad, 246 B); `stacks_card` MIFARE_Classic_Custom_Keys (keycard + NPC sorensen_hatch, 1076 B); `tape_room_reader` EM4100 (keycard, 243 B).
- m10: `tg_power_room_card` EM4100 (keycard + NPCs imran and gary_tech, 246 B).

## 2. The `#clone_keycard` ink-tag check

Every `#clone_keycard:<card_id>` tag in m03 to m10 and lab_physical_pentest was found in the ink
sources, the NPC that carries each tag was identified by `storyPath`, and the tag's `card_id` was
compared with that NPC's own `npc_card` definition (`rfidCard`/`creds.card`). Every tag names its own
NPC's `card_id`, every such NPC is cloneable (no `cloneable: false`), and every definition carries a
`card_id`, so the new server path accepts each: a chat clone sends `{ npc_id }`, `record_card_clone!`
(game.rb:2262) resolves the NPC, reads `npc_card`, the definition's `card_id` equals the tag's
`card_id` (so `recorded: true`), and `add_saved_card!` stores it; the bootstrap repair finds the same
definition through `npc_card_definition_for` (game.rb:3577).

| Mission | Ink file (storyPath) | NPC id | Tag card_id | NPC card_id | Cloneable | Resolves |
|---|---|---|---|---|---|---|
| m03 | m03_npc_ffion_rees | ffion_rees | receptionist_badge | receptionist_badge | yes | yes |
| m03 | m03_npc_victoria | victoria_sterling | victoria_keycard_clone | victoria_keycard_clone | yes | yes |
| m04 | m04_npc_operative_relay | operative_relay | server_room_keycard | server_room_keycard | yes | yes |
| m04 | m04_npc_robert_vance | robert_vance | facility_keycard_level1 | facility_keycard_level1 | yes | yes |
| m05 | m05_npc_owen_gallagher | owen_gallagher | employee_badge | employee_badge | yes | yes |
| m06 | m06_npc_irina_volkova | irina_volkova | cto_badge | cto_badge | yes | yes |
| m07 | m07_npc_ray_hollis | ray_hollis | server_zone_badge | server_zone_badge | yes | yes |
| m08 | m08_director_netherton | director_netherton | server_zone_badge | server_zone_badge | yes | yes |
| m09 | m09_noor_haddad | noor_haddad | reading_staff_door | reading_staff_door | yes | yes |
| m09 | m09_sorensen_hatch | sorensen_hatch | stacks_card | stacks_card | yes | yes |
| m10 | m10_gary | gary_tech | tg_power_room_card | tg_power_room_card | yes | yes |
| m10 | m10_imran | imran | tg_power_room_card | tg_power_room_card | yes | yes |
| lab_physical_pentest | len | len | cm_records_badge | cm_records_badge | yes | yes |

Note: m04's `operative_relay.ink` carries the `server_room_keycard` tag on two lines (:133, :176) and
`robert_vance.ink` carries `facility_keycard_level1` on three lines (:274, :291, :315); m10's
`tg_power_room_card` is cloned from two NPCs (gary_tech and imran), both of which carry that card_id.
All resolve. No tag names a card_id that is not its speaker's own.

The keycard walk re-run (plan 5.4): a game created since the id stamping (2026-03-06) gives every
world object an id, so a world keycard is always sent as `{ object_id }`. test-rfid's world
`ceo_keycard` is authored with no id and is stamped `test_secure_keycard_1`; it is sent as
`{ object_id }` (confirmed by the server path `clone_source_keycard`). No `#clone_keycard` tag sits on
a card lacking a `card_id`. The behaviour change in 5.4 (a card with no `card_id`, or a chat clone
with no NPC id, is not kept across a reload) affects no mission clone beat.

## 3. Keycard walk, re-verified live

Keyless headless server on :3130 (GEMINI warning confirmed in the boot log), `setFPS(20)` with fixed
steps on, driven through the `window.__test` bridge, every request to
`/break_escape/games/:id/*` recorded (method, path, request bytes, response bytes), reusing the pure
helpers of `tools/playtest/sync-delta-proof.mjs` (`routeLabel`, `summarise`, `renderTable`,
`hasSavedCards`). The tool's own cases stop at bootstrap/A/B (cases C to F are deferred to step 7), so
the clone drive was a scratch driver over the tool's recorder.

Game 1820 (test-rfid). Chat-clone the guard's `master_keycard` ("Subtly scan their badge",
`#clone_keycard:master_keycard`), reload, emulate at the one RFID door (test_secure):

| Phase | Method | Route | Status | Req bytes | Resp bytes | Notes |
|---|---|---|---:|---:|---:|---|
| clone | POST | clone_card | 200 | 230 | 45 | body keys `npc_id, card_id, card`; one card only |
| reload | GET | scenario | 200 | 0 | 2367 | cloner list rides `playerInventory` once (as designed, 5.3) |
| emulate | POST | unlock | 200 | 77 | 963 | door opens with the cloned card |

The `/clone_card` request body carried exactly one card (savedCardForServer output):
`{ card_id: "master_keycard", name: "Master Keycard", rfid_protocol: "EM4100",
rfid_data: { cardId, hex, facility, cardNumber } }`, 230 bytes, well under the 600/1500-byte
expectations and the 4 KB per-card cap. Confirmed:

- No `POST /inventory { action_type: "update_saved_cards" }` request was sent, at clone or at any
  point (the old whole-list save is gone; `persistSavedCards` is deleted).
- No request body carried a `saved_cards` list (`hasSavedCards` false on every request). The only
  `saved_cards` seen anywhere was in the `GET /scenario` bootstrap response, which loads the cloner's
  list once in `playerInventory`, exactly as plan 5.3 keeps it.
- `savedCards()` was `["master_keycard"]` after the clone and still `["master_keycard"]` after a full
  page reload (the copy persists server-side; no re-send needed).
- After the reload, emulating the cloned card at the test_secure RFID door answered `POST /unlock`
  200 and opened the door, so the recorded copy is usable end to end.

The live measurement supports the request-size expectation: an EM4100 clone body is about 230 bytes
(plan 5.3 says about 300). A fully cracked MIFARE Classic was not driven live; the census worst case
(about 1.1 KB stored) stays under the 1500-byte request expectation.

### Mission-side live drive: not completed within budget

The mission chat clones (m03 to m10) use the identical client path (chat-helpers.js
`#clone_keycard` to `recordCloneOnServer` to `savedCardForServer`) and server path
(`record_card_clone!` with `npc_id`) proven in test-rfid above, and all 13 tags were verified
statically in section 2. A full live drive of an m04-to-m10 clone beat needs a cumulative RFID cloner
that a fresh standalone playtest game does not hold (the cloner is carried over from m03, not a start
item), and lab_physical_pentest's clone beats need the mid-lab cloner plus Len's timed keying window;
this is why the plan's own live proof (case C) drives the cloner only in test-rfid and
lab_physical_pentest. The test-rfid run covers the chat-clone (`npc_id`) code path exactly; the
world-keycard (`object_id`) and action-menu paths remain to be driven in step 7's full case C to F
proof. Games created this session: 1820 (test-rfid, driven), 1829 (lab_physical_pentest, created, not
driven).

## 4. Request-size node test

Belongs to step 7 (plan 5.6 / 10.1), as the build log records. Not added here, to keep off step 7's
and the JS test harness's files near the context budget. The live run measured a real EM4100
`/clone_card` body at 230 bytes (expectation: under 600); the census bounds the MIFARE Classic worst
case under 1.5 KB.

## 5. Failures against a bound

None. Every scenario is within the 50-card, 64 KB and 4 KB-per-card bounds with wide headroom; every
`#clone_keycard` tag resolves to a card the new server path accepts; the live walk shows one-card
deltas, no whole-list save, and a cloned card that still opens its door after a reload.

## 6. Defects found

None in the P1 engine code. One observation, not a defect: the `#clone_keycard` tag string also
appears in compiled `*.json` ink next to the sources; the source `*.ink` files are the authority and
were used for the tag-to-NPC mapping.
