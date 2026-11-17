# demo_access_tour plan: review R1 (server enforcement, security model, sync)

Plan: docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md at 9d55dd353. Scope: server claims, secret handling, player_state sync, server-side tests. Design and tour flow are covered by the other reviewer.

Counts: B 1, M 4, m 9, n 5

Stopped at the context limit: the autoLockMin effect (m8) and the `pc_in_use` suffixed event form (n3) are marked unchecked.

## Claims confirmed in code

- Implant `needsSession`: one action per [pc, shape] (network_access.rb:445-450); session must exist with a blank foothold and no relay or `from` route (496-501); the held item must not be client-forged (454-465); the USB policy refuses storage only under `storage_blocked` (access_work.rb:1198-1204, network_access.rb:506-512). So the injector (hid) passes the desk policy and the stick would not.
- B1 and B3 settled: every non-relay, non-token sign-in, claims and saved-connection credential sign-ins included, is added to `signedInPcs` (game.rb:4321-4326). The `unlock_object` task on a sign-in PC checks `signedInPcs` (game.rb:5159-5182), so t_julian_pc and t_open_session validate on the server as `unlock_object`. No fallback mapping needed.
- `unlock_object` on a jack checks `gainedFootholds` (game.rb:5168-5179) and on an AP the same (5171-5175): t_drop_box and t_staff_wifi are server-checked.
- Port security: refusal with `reason: 'port_security'` and the authored `portSecurityMessage` (network_access.rb:111-116, 243-245). Client emits the same reason (network-links.js:438), so P4's condition holds.
- Unplug: `endedPcIds` = expired tokens + sessions whose `foothold` is this jack + the prune (network_access.rb:290-321, 410-415, 1446-1475). Only sessions opened through the box end. See B1 for why that is not Julian's session by default.
- K-lock: server `session_lockable?` admits password sessions and credential sessions with a foothold or `from` (game.rb:3737-3743), `lock_session!` at 3749-3771; `sessionLockingSupported` is sent when the scenario has a login PC (games_controller.rb:443). Julian's session is lockable on either route.
- Sign-in PC contents (facilities.txt, julian.rdp, door codes) leave every room answer for `lockType: login` (game.rb:7094-7100). NPC `creds`, `role`, `awareness` and non-shipped habits are withheld; `addCapture.secret` on every NPC's mappings is withheld (game.rb:7214-7275).
- The server-built sticky note: `login_postit_for` uses the owner's creds only when `writesDown` holds and the PC authors no `postitNote` (game.rb:3330-3342), served only by GET /login_accounts.
- Staff psk: same `@random_password` per render (scenario_binding.rb:22-25); `join_network!` compares the key to the psk (network_access.rb:373-376).
- Card copy: server records a clone only with a cloner held and the NPC encountered (game.rb:4016-4053). The card itself ships by design (game.rb:7219-7221).

## Blocker

### B1. The unplug does not end Julian's session on the route the game picks
Stop 10 and stop 17, D4 and D5, and the 4.6 live check assume Julian's remote session rides the drop box. It does not, by default.
- `saved_connection` allows both `foothold` and `from` routes (credential_model.rb:23).
- GET /keyring lists a `{ from: <pc> }` row for every held session that reaches the target (credential_keyring.rb:444-465). The player holds a keyboard session on reception_pc from stop 3, and julian_pc is on the same office_lan, so `from_route_refusal` passes (network_access.rb:1349-1375).
- The client's Connect picks a `from` row before any foothold (keyring.js:69-92).
- A `from` session has no `foothold`, so `end_sessions_through!` skips it, and the prune keeps it while reception_pc's session stands (network_access.rb:1378-1395, 1460-1462).

Result: Connect on julian.rdp signs in `from: reception_pc`, before or after the box is planted; the unplug leaves it up; `endedPcIds` lacks julian_pc; D4 ("the box got you onto the network ... the saved connection did the rest") and D5 are wrong. The same holds for any sign-in to door_controller made from a desktop instead of the network view (the reception_pc session pivots to server_lan, network_access.rb:1256-1283).

Fix: a user call, since D100 rules out engine work. Options:
(a) Teach it. Rewrite stops 10 and 17, D4 and D5 to say sessions opened through the box end and sessions opened from a desktop you sat at stay; the full route shows both (Connect from Delphine's desktop, then the same from the network view after signing out of reception_pc). The 4.6 live check asserts both outcomes.
(b) Keep the current story: make reception_pc's session gone before stop 10 (for example sign out at the end of stop 3, prompted by Ama), and make the walk and live proof sign out first. Fragile: any later keyboard session on an office_lan PC (Yasmin, Thandiwe's claim) restores the `from` route.
Either way, add a test on the real scenario (see M4) that pins `endedPcIds` for each route.

## Major

### M1. Yasmin's password ships in the client copy
2.5 and 3.1 say yasmin_pc's note uses `postitNote` and `showPostit` (test_access_networks:735-736). That fixture authors the password literally (`"postitNote": "Sam: sokafor / Marmalade-82"`), and an object's `postitNote` goes out in the room answer. The payload scan does not catch it: `postitNote` and `text` are value-exempt (test/support/payload_scan.rb:119). It also switches off the server-built note (game.rb:3332), so the 3.1 row "built server-side from habits.writesDown" is wrong for that pattern.
Fix: yasmin_pc gets `owner: yasmin`, no `postitNote`, no `showPostit: false`; Yasmin gets `habits.writesDown` and `creds`. Same as Delphine. Change the 3.1 citation to game.rb:3330-3342.

### M2. Stop 11's refusal from the bare foothold will not show
Share admission is player-wide: `resource_admits_player?` admits an access-listed share if any held, unlocked, routed session's identity is on the list (network_access.rb:1580-1627), and the view's item add uses the same rule (1726). It takes no route. Once Julian's (partner) or Yasmin's (finance) session is held, the Finance share opens from the network view too.
Fix: show the refusal first. Move it right after stop 9, before stop 8 and stop 10 sign anyone with the role in, and say so in the full-route walk; or drop the "from the bare foothold" half of stop 11.

### M3. The captured Staff key is never shown
Stop 16 needs the player to read the key. `capture_secrets_for_client` returns nothing unless `social.captures.revealSecret` is true (game.rb:2494-2495; capture_model.rb:569-575). The plan does not set it; test_access_devices does (line 10) and so does the rogue AP Rails test (access_devices_rogue_ap_test.rb:29).
Fix: add `"social": { "captures": { "revealSecret": true } }` to 2.3, and note the capture proof stays `{ "planted": "kit_rogue_ap" }`.

### M4. No server test of the demo's own claims
4.3 relies on corpus tests. They check that no secret leaks and the schema holds; none checks `endedPcIds`, the implant preconditions, the `from` route, share refusals, or that Yasmin's and Delphine's notes are built server-side. The live proof (4.6) is a single run.
Fix: add test/controllers/break_escape/demo_access_tour_test.rb in slice 2/3, loading the real scenario as AccessDevicesRogueApScenarioTest does (access_devices_rogue_ap_test.rb:350-358). Cases: reception_pc and yasmin_pc notes only from GET /login_accounts and absent from bootstrap and room answers; facilities.txt and julian.rdp absent until a reception_pc session; door codes absent until a door_controller session; keypad code absent from every answer; implant refused without a session, with a stick, from a remote session, granted with the injector; unplug `endedPcIds` for the foothold route and for the `from` route (B1); Finance share refused before any role session (M2); capture before the plant refused, after it served, key joins staff_ap (M3); partner door refused for every card the player can get. Add the scenario to the leak live proof list (tools/playtest/secret-leak-withholding-live-proof.mjs) in slice 6.

## minor

m1. Account fields unstated. 2.4 gives Lorna only `creds.card`. The door-controller password credential needs `account: lorna` and Lorna needs `creds.username`, `creds.password` and `role: "facilities"` (the comms ACL reads the cloned card's identity roles; the door controller's `access.roles` reads her account). Delphine, Yasmin, Julian and Thandiwe need `creds` too (the note, the saved connection's `account`, the claim). Fix: one row per account NPC with username, role and whether the password is ERB-random.

m2. Partner door "none reachable" (4.2) holds only if Julian has no `creds.card` (or `cloneable: false`, game.rb:4025) and no other NPC carries role `facilities` or `it` except Lorna. Fix: state both in 2.4 and in the lock and key check.

m3. V8 "magnet servings" counts magnet objects, not servings (validate_office_life.rb:787-789). The cake is 1, not 2. Fix the 2.6 and 3.2 rows.

m4. Foothold count: Guest Wi-Fi and the guest VLAN port are separate footholds (a Wi-Fi one per network, network_access.rb:332; a jack one per jack), so up to 5 at once; `gainedFootholds` takes jack ids, AP ids and the implant PC id, so up to 6 (meeting_jack, guest_vlan_port, staff_ap, guest_ap, reception_pc, plus a second AP if any). Bounded, not growing. Fix the 3.2 line.

m5. onceOnly count: 3.2 lists 8 and omits t_unplug's mapping and any onceOnly on the briefing. That is 9 or 10 against a cap of 10, if the validator counts them (it counts only office-life events and actions, validate_office_life.rb:796-799). Fix: list every onceOnly mapping by id, and drop onceOnly from t_unplug (completeTask is idempotent, game.rb:5110-5133).

m6. Keypad code "fixed": the scan cannot see a 4-digit code inside longer text (payload_scan.rb:19-25), and a fixed code is known to every colleague who has seen the demo. Fix: `<%= @random_pin %>` in both the keypad `requires` and the door_controller file, one render. Keep `@random_password` for the Staff psk only; give accounts their own literals or values.

m7. `ama_phone` carries the capture mapping. Captures are found through room NPC lists (capture_model.rb:122-129); the fixture lists `ruth_phone` under a room's `npcs` with no position. Fix: say ama_phone sits in reception's `npcs`.

m8. Unchecked: the desk policy's `autoLockMin: 5`. A locked session is no pivot for access and a locked `from` source is unreachable (network_access.rb:1270-1275, 1362). If reception_pc locks mid-tour, stop 12 can fail. Fix: check in slice 2; give reception_pc a policy without autoLock, or say the player re-enters the note.

m9. t_copy_badge, t_implant, t_capture_key and t_unplug are client mappings with no server check on the task (custom tasks pass, game.rb:5203-5204). This is within policy, but t_copy_badge and t_unplug are required. Fix: record the sanity check: the server holds the clone in `serverClones` and the foothold history, so the debrief or the conclusion can refuse if neither exists; or say plainly they are best-effort.

## nit

n1. The rogue AP's client list is `knownClients: [{ npcId, label }]` (test_access_devices:168), not `knownClient`.
n2. The managed port field is `portSecurityMessage` (network_access.rb:114); 2.5 says only "a refusal message".
n3. B4: `pc_in_use` carries `{ pcId, ownerId, signedInBefore }` (pc-sessions.js:750). Unchecked whether a `pc_in_use:<pcId>` form is emitted; the condition `data.pcId === "thandiwe_laptop"` works either way.
n4. 3.1 cites capture_payload_secret_test.rb:147 for the psk; that test covers capture secrets. The psk is withheld by `withhold_network_keys!` (network_access.rb:23). Cite both.
n5. 4.4: the payload scans can be run for this scenario alone with `PAYLOAD_SCAN_ONLY=demo_access_tour` (payload_scan_fresh_state_test.rb:247-251). Use it in each slice for speed.
