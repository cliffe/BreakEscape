# demo_access_tour plan: review R2 (server enforcement, security model, sync)

Plan: docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md v2 at f641a104e. Previous round: DEMO_ACCESS_TOUR_PLAN_REVIEW_R1_SERVER.md (2217b2e86). Scope: server claims, secrets in the client copy, player_state sync, server tests and live proof. Plan line numbers refer to v2.

Counts: B 1, M 3, m 5, n 3

Stopped at the context limit. Not checked this round: whether the rogue AP's known client must sit on a network with `wifi` (thandiwe_laptop's network field), and whether `office_life_event?` counts `npc_used:` mappings in V8 (it would add at most 1 to the onceOnly count).

## R1 resolution

| R1 | Status | Where in v2 | Note |
|---|---|---|---|
| B1 unplug and the `from` route | RESOLVED for Julian, PARTIAL for the door controller | 61-64, 251, 270-272, 344, 398-399, 519-521, 536 | Option (b) plus teaching: stop 5 signs out (P0, W5), the keyring then offers only the foothold row (credential_keyring.rb:444-465 lists `from` rows only for held sessions; keyring.js:75-88 falls back to a foothold), so Julian's session carries `foothold: meeting_jack` and `end_sessions_through!` ends it (network_access.rb:410-415). D5b and the third walk teach the other case. The door-controller reasoning is wrong: see new M1. |
| M1 Yasmin's note in the client | RESOLVED | 168, 217, 425 | `owner: yasmin`, `habits.writesDown`, no `postitNote`. Same path as Delphine: `login_postit_for` (game.rb:3330-3342); `writesDown` is not in SHIPPED_HABIT_KEYS (game.rb:7228), creds withheld (7216). |
| M2 Finance refusal | RESOLVED | 249, 297, 515 | Stop 4 shows it before any session exists. |
| M3 revealSecret | RESOLVED | 149, 432 | Same shape as test_access_devices:10; read by capture_model.rb:569-575 and game.rb:2494-2495. |
| M4 server test of the demo | RESOLVED, with corrections | 496-521, 563-564 | Cases are right in kind. Two are on a path the client never uses or assert the wrong reason (new M1, m3). |
| m1 account fields | RESOLVED | 162-172 | |
| m2 partner door unreachable | RESOLVED | 172, 480 | |
| m3 magnet servings | RESOLVED | 458 | |
| m4 foothold count | RESOLVED | 449 | Two APs only, so 5 is right. |
| m5 onceOnly list | RESOLVED | 299, 451 | |
| m6 keypad code | RESOLVED | 125, 215, 421 | `@random_pin` is `rand(1000..9999)` in the one binding (scenario_binding.rb:22-25), so keypad and file match. |
| m7 ama_phone in reception's npcs | RESOLVED | 47, 165 | |
| m8 autoLockMin | RESOLVED | 154-158, 556 | autoLockMin is read only for guest and claim sessions (npc_frustration.rb:281-306, game.rb:3471, 3539); a password or credential session never auto-locks. |
| m9 client-completed tasks | RESOLVED | 439 | Stated as best-effort, which R1 allowed. |
| n1 knownClients | RESOLVED | 71 | |
| n2 portSecurityMessage | RESOLVED | 212, 365 | |
| n3 `pc_in_use:<pcId>` | RESOLVED | 54 | `_emit` sends the suffixed form for any payload with `pcId` (pc-sessions.js:328-333). |
| n4 psk citation | RESOLVED | 431-432 | |
| n5 PAYLOAD_SCAN_ONLY | RESOLVED | 492, 560 | |

New claims checked and confirmed:
- Open guest Wi-Fi: `join_network!` skips the key check when the network's psk is absent (network_access.rb:371-374). The Wi-Fi block is per network (`wifi_of(scenario_data, network)`, network_access.rb:345; fixture test_access_devices:18-19), so the guest SSID goes in `networks.guest.wifi` with no `psk`.
- `networks`, `networkLinks` and `resources` never ship (network_access.rb:16-25), so the Staff psk is not in the bootstrap; the capture mapping's `addCapture.secret` is withheld on every NPC (game.rb:7212-7215, 7255 onward).
- Sign-in PC contents leave every room answer under `lockType: login` (game.rb:7094-7100); a pin room's `requires` is deleted (game.rb:7088-7091, 7210).
- The sign-in screen offers keyring credentials and keeps its own route (password-minigame.js:2290-2296), so the presenter note at 271 (unlock a locked Julian session at its own screen with the saved connection) keeps the foothold route.
- Globals sync as deltas (state-sync.js:33-41, 262); 23 booleans plus `cake_servings`, each declared, set once, none growing. onceOnly handlers land in `triggeredEvents` keyed per handler (game.rb:5711-5732), so P0 to P5 and the two mappings add 8 fixed keys. The rota board mappings have no onceOnly and write needs, not globals.

## Blocker

### B1. Stop 10 (full route) needs the box that is still in meeting_jack
Stop 10 says "the managed port refuses the box; the patch panel's spare port gives only guest" (255, 213, 355). There is one rogue device, `kit_dropbox` (204), and it sits in meeting_jack from stop 3 until stop 17.
- The client refuses a jack click with no held rogue device before any request: `_heldDevice()` is null, so it shows the no-device hint and emits `network_device_refused` with `reason: 'no_device'` (network-links.js:400-405). P4's condition `data.reason === "port_security"` never matches and the managed port's message never shows.
- The plant consumes the device into the foothold record (network_access.rb:253-268); only `unplug_device!` gives it back (network_access.rb:303-308).
- So to show either port the player must pull the box from meeting_jack first. That unplug ends Julian's session and the door controller session at stop 10, completes t_unplug through its mapping (287), sets `julian_ended_by_unplug` (344) and fires P5 "Box is out ... come back to reception" (356) mid-tour. Stops 13 to 17 then run without the box, stop 17 has nothing to show, and the 4.6 full-route pass condition "stop 17 ends exactly julian_pc and door_controller" (535) fails.

Fix (no engine work): add a second rogue device to the kit table, `kit_dropbox_spare` (`rogueDevice`, its own id and name, for example "Spare drop box"), used only at stop 10. The plan must then say:
- `network_device_unplugged` mappings stay keyed on `:meeting_jack` (they are, 287, 344, 356), so the spare's unplug from guest_vlan_port fires none of them.
- `gainedFootholds` and footholds stay bounded (guest_vlan_port was already counted in 449).
- The 4.4 test plants the spare at managed_port (expect 422 `port_security`, the device stays held) and at guest_vlan_port (foothold on guest), with the main box still in meeting_jack, and checks that julian_pc's session is untouched.
Alternative: move the port contrast after stop 17 (pull the box, then try the comms ports), and drop P5's "come back" wording until both are done. That changes the route order the design reviewer owns.

## Major

### M1. The door controller is signed in through the network view's foothold, not "from Julian's desktop"
Plan 64, 252, 272, 510 and 545 say the door controller session rides the box because the pivot starts on Julian's desktop, and that a pivot from a reception_pc keyboard session survives the unplug.
- The client sends a `from` sign-in only for a keyring Connect or a credential refusal screen of a connecting kind (keyring.js:60, CONNECT_KINDS; unlock-system.js:359-362, 418-420). Lorna's credential is a `password` (credential_model.rb:21, `connects: false`). The door controller is headless, so its sign-in screen opens only from the network view, which passes the view's foothold (network-view-minigame.js:687-694, `start(row, footholdId)`). The session records that foothold (game.rb:4316-4317).
- The pivot only decides reach: `reach_spread` counts any held, unlocked session on office_lan (network_access.rb:1259-1284, 1396-1411). Julian's remote session, the front-desk keyboard session or Thandiwe's claim all serve equally.
- So what decides the unplug is the foothold the view was opened from. Opened at meeting_jack (or its link item), the session ends on the unplug whichever desk was the pivot. Opened from the implant's or Staff Wi-Fi's link item, it survives.

Consequences: the presenter note at 272 is wrong (a reception_pc pivot through the meeting_jack view still ends). The 4.7 `from` case at 545 cannot be produced as written. The 4.4 case "admitted from a julian_pc session" (510) would pass with `from: julian_pc` on POST /login (the server accepts it, games_controller.rb:1493-1520) but tests a path the game never takes.
Fix:
- 64 and 252: "Stop 7: open the network view at the meeting room jack (or its tray link) with Julian's session held; server_lan is in reach because a session on office_lan is held. The door controller session then carries the box's foothold."
- 272: "The door controller session survives the unplug only if the network view was opened from another foothold (the implant or Staff Wi-Fi link). Open stop 7's view from the box."
- 4.4 (510): refused through meeting_jack with no office_lan session held; admitted through meeting_jack once julian_pc's session is held (POST /login with `foothold`, no `from`); also admitted through the implant foothold, and that session is not in `endedPcIds` after the unplug.
- 4.7 (545): replace the `from` door-controller case with "a door controller session opened from the implant's link survives the unplug". Keep the Julian `from` case (keyring Connect while holding a reception_pc keyboard session), which is real (B1 of R1).

### M2. The secret-leak live proof has no scenario list to add to
4.5 (527) and 4.7 (546) say to add the demo to tools/playtest/secret-leak-withholding-live-proof.mjs's list. The tool has no list: each case is hand-written with its own fixed secrets (header lines 6-35; cases at 168 and 247). The demo's pin and psk are per-game renders, so a scan needs the game's own values.
Fix: in slice 6 write tools/playtest/demo-access-tour-leak-proof.mjs on the same pattern. It creates the game through new-game.rb, reads the rendered pin and psk and the five literal passwords from the game row read-only (`Game.find(id).scenario_data` via rails runner, no writes), then scans the whole raw bootstrap, every GET /room, GET /keyring, GET /capture_secrets and GET /container answers before each earning step, and finds each value after it (note after reaching the PC, codes after the door-controller session, key after the plant and the laptop's use). Name it in 4.5 and 4.7 in place of the list entry.

### M3. The capture mapping is under-specified for the server
2.7 (267) gives the mapping only `addCapture` with proof and secret. The server matches a client capture against the authored writers by `targetId` (capture_model.rb:552-556 `served_capture_writer?`; `client_target_ids`, 576-580), and the fixture's mapping carries `targetId`, `kind`, `host`, `address`, `roleLabel` and `note` (test_access_devices:280-281).
Fix: spell the mapping out as the fixture does: `"addCapture": { "targetId": "staff_wifi_key", "kind": "credential", "roleLabel": "Merrin & Sallow, reception", "host": "MerrinSallow-Staff, rogue access point", "address": "MerrinSallow-Staff", "secret": "<%= @random_password %>", "note": "...", "proof": { "planted": "kit_rogue_ap" } }`, and add `captureProof: [{ "planted": "kit_rogue_ap" }]` on thandiwe if the fixture's kieran pattern needs it (test_access_devices:319). The 4.4 capture case drives it as AccessDevicesRogueApScenarioTest does (access_devices_rogue_ap_test.rb:348-362), reading the psk from `scenario_data.dig('networks', 'office_lan', 'wifi', 'psk')`.

## minor

m1. `onPickup` key. 2.5 (200) says `onPickup` "sets the global". The schema field is `onPickup.setVariable` (scenario-schema.json:5259-5267), applied by inventory.js:623 and interactions.js:1909. Fix: write `"onPickup": { "setVariable": { "has_julian_rdp": true } }`.

m2. door_controller's lock type. Its codes file is withheld only if the object is `lockType: "login"` (game.rb:7094-7100). 2.5 (215) says "sign-in" without the field. Fix: state `lockType: "login"` and `headless: true` on it, and add it to the 4.4 case "door-codes file absent until a door_controller session".

m3. Implant with the stick. 4.4 (514) "refused ... with the stick" will answer `implant_not_ready`, not `usb_refused`: the socket's `needsHeld` names kit_injector, so `inventory_item_matching` finds nothing before the USB policy runs (network_access.rb:503-506). The storage-blocked line is client-only at the hub (interactions.js:1015-1043). Fix: assert `reason` from implant_not_ready for the stick case and say the policy refusal is a client beat (3.1 already lists it as best-effort, 437).

m4. Yasmin's absence is a client gate. GET /login_accounts serves her note to any player who can reach yasmin_pc (game.rb:3326-3342 has no presence check), so a player can read it while she sits. Within policy (office-life timing is best-effort) and t_yasmin_pc is optional, but 4.4 must not assert a refusal while she sits, and 3.1 (438) should list "Yasmin's note while she is at her desk" under best-effort.

m5. Guest Wi-Fi placement. 2.3 (148) gives the guest SSID but not where it lives. Fix: `"networks": { "guest": { "name": "...", "wifi": { "ssid": "MerrinSallow-Guest" } } }`, no `psk` key; the 4.4 case "Guest AP joins with no key" posts no key.

## nit

n1. 2.10 (341): `front_desk_signed_out` is set by a mapping with no onceOnly, so it fires again at any later sign-out of reception_pc (stop 14). Harmless (same value, delta sync only on change), but say so or add onceOnly and count it (9 of 10).

n2. 1 (61) says Connect "picks a `from` row before any foothold (keyring.js:68-91)". The function is at 75-88 and, among several `from` rows, prefers the desktop Connect started on, then the most recently opened (keyring.js:69-74). Cite the range and the tie rule, since the third walk depends on it.

n3. 3.1 (432) still cites capture_payload_secret_test.rb:147 for "the capture secret must match the psk"; that file tests withholding of capture secrets. The match is the scenario's one render (scenario_binding.rb:22). Cite that instead.
