# test_access_networks: scripted playtest (P1 to P12)

The feature scenario of networks, slice 9.3a (`docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md`,
section 9, step 7's beat table). One numbered step per beat below, each with the server record
expected after it. After every beat, check what is on screen, what the server recorded and what
reached the browser.

The scenario is for testing, not play. Every password and PIN a run types is read from its in-game
source first (see "Earned secrets" at the end); none is written here or on a sign. No sign, task
title or brief names a network, a share, a printer or a share's host: those strings must reach the
browser only from `GET /network` and `GET /container`, and the leak check proves it.

## Which runs need which step

- **Step 7 (the jack and the link item)**: the scripted run below, "Run 0": P2 without the view,
  an unplug, a second plant, and a reload that checks the link item, the jack's look and
  `gainedFootholds`. Until step 8 lands, clicking the link item (or the first plant) shows a
  one-line toast naming the network ("Drop box: comms room, on Harbour office LAN") instead of the
  view, and fetches the view so `window.__test.access.networkView("jack_comms_port")` can be read.
- **Step 8 (the view, remote sign-in and shares)**: Runs A, B and C over P1 to P12, then the first
  slice's three suite runs. P1, P3 to P9, P11 and P12 need step 8; their tasks complete on events
  step 8 emits (`network_share_opened`, `network_viewed`, `remote` on the sign-in events).
  Results of the step 8 runs after the round 1 code review: `reports/2026-11-10_step8_runs.md`.

## Setup (each run)

Keyless server on :3001 (never touch :3000). In a container, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` and pass `--headless`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_access_networks
S=<scratchpad>/test_access_networks
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/responses-<game_id>.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

The two checks after every beat:

```bash
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/responses-<game_id>.jsonl
```

The leak check must say `VERDICT: no leaks found` after every beat. Compare the `footholds`,
`gainedFootholds`, `sessions` (with `remote` and `foothold`), `signedInPcs`, `copiedItems` and
`loginFailures` lines with the record each beat expects. The browser's side:
`{"cmd":"eval","fn":"() => window.__test.access.footholds()"}`,
`{"cmd":"eval","fn":"() => window.__test.access.networkView('jack_comms_port')"}` and
`{"cmd":"eval","fn":"() => window.__test.access.sessions()"}`.

## Harness notes for this scenario

- **The jack's prompts are `gameConfirm` dialogs, not minigames.** Answer the plant confirm with
  `{"cmd":"dismiss","label":"Plug it in"}` (or `"Cancel"`), and the planted jack's prompt with
  `{"cmd":"dismiss","label":"Unplug it"}` or `"Leave it"`. `mg clickSelector` cannot see them.
- **The link item** is `netlink_jack_comms_port` (or `netlink_jack_bench_port`) in the inventory.
  Its click opens the view; it has no menu.
- **The view's rows** (step 8) carry `data-host-id`, `data-resource-id` and `data-action`
  (`sign-in`, `open`, `observe`): for example
  `{"cmd":"mg","action":"clickSelector","args":["[data-host-id=\"lena_pc\"] [data-action=\"sign-in\"]"]}`.
- **The jack's look**: `{"cmd":"eval","fn":"() => { for (const r of Object.values(window.rooms)) for (const s of Object.values(r.objects||{})) if (s.scenarioData?.id==='comms_port') return s.texture.key; }"}`
  answers `pi_cluster1` while the box is in it and `network_rack1` otherwise (the comms room must
  be loaded).
- **Globals**: `comms_port_planted` and `bench_port_planted` follow the footholds held.
- **A reload** is always followed by `{"cmd":"bootstrap","tutorial":"decline","resume":"resume"}`.
  Without `"resume":"resume"` the bootstrap can answer the resume overlay with "New Session",
  which discards the save.
- **A PIN pad** (the locked folder, the vault, the finance door) takes digits with
  `{"cmd":"mg","action":"pressKey","args":["2"]}` and then `"Enter"`.
- **The remote sign-in screen** has the username as field 0 and the password as field 1:
  `{"cmd":"mg","action":"type","args":[0,"<username>"]}`, then
  `{"cmd":"mg","action":"type","args":[1,"<password>",{"submit":true}]}`. A mapped
  share on a desktop is `[data-resource-id="<id>"]` (`mg clickSelector`).

## Run 0 (step 7): plant, unplug, plant again, reload

1. Walk to `comms_room` with nothing in hand. `interact` `comms_port`: the toast is the port's
   hint ("Something small could be plugged in here"). No `/network/plant` request in the
   responses file.
2. Walk back to `lobby` and take `kit_dropbox` from the table.
3. `interact` `comms_port`: the confirm "Plug the drop box into this port?". Answer `Cancel`: the
   box is still in the inventory and no request was sent.
4. `interact` again and answer `Plug it in`. Expect: the box leaves the inventory, the link item
   "Drop box: comms room" arrives (no `POST /inventory` in the responses), the port shows
   `pi_cluster1`, `comms_port_planted` is true, task `p2_plant` completes, and the one-line toast
   names the network. `window.__test.access.footholds()` lists `jack_comms_port`.
   - Server: `footholds` has `jack_comms_port` on `office_lan`; `gainedFootholds` has
     `comms_port`; the link item in the inventory and the box not.
5. Click the link item in the inventory: the same one-line toast; `networkView('jack_comms_port')`
   lists the hosts `door_box`, `kiosk_pc`, `lena_pc`, `sam_pc` (in that order), then
   `ledger_archive`, `print_queue`, `scanned_inbox`, and nothing of the workshop network.
6. `interact` `comms_port`: "Your Network drop box is plugged in here. Open it from your
   inventory." with `Unplug it` and `Leave it`. Answer `Leave it`: nothing changes, no request.
7. `interact` again and answer `Unplug it`: one box in the inventory, none on the lobby table, no
   link item; the port is back to `network_rack1`; `comms_port_planted` is false.
   - Server: no `footholds`; `gainedFootholds` still has `comms_port`; `p2_plant` still complete.
8. Plant again (`Plug it in`): the link item is back; the toast does not repeat as a first
   foothold's view (the view opens by itself only the first time at a jack).
9. Reload (`{"cmd":"sync"}`, then `{"cmd":"eval","fn":"() => { location.reload(); return true; }"}`,
   about 15 s, then `{"cmd":"bootstrap","tutorial":"decline","resume":"resume"}`). Check: the link item is in the
   inventory once, `footholds()` lists `jack_comms_port`, `comms_port_planted` is true before the
   comms room is entered, the port shows `pi_cluster1` once its room loads, and `p2_plant` is
   still complete.
   - Server: `footholds`, `gainedFootholds` unchanged.

Then `{"cmd":"sync"}`, the full `verify-run.rb <game_id>`, the leak check over the whole file, and
`{"cmd":"quit"}`.

## The beats (P1 to P12; Runs A to C with step 8)

Room layout: `lobby` (start; the drop box on a table, the lobby vault, Sam, Lena and Ian) with
`comms_room` north, `workshop` west and `desk_room` east. Off `desk_room`: `finance_office` north
(PIN door), `kiosk_room` east and `store` south. Every beat has a sign.

Run A: P1 to P6, with a reload after P5. Run B: P2, P4, P5, then P7, P8 and P12. Run C: P2, P4,
P5, P8, then P9, P10 and P11. Each run is a new game.

### P1 An open share at the keyboard

Before anything is planted, sign in at `sam_pc` (desk room) with the sticky note. His desktop
shows the open share's folder and not the finance one. Open it and read the letter. Task
`p1_open_share_keyboard` completes (`network_share_opened` with `via: "session"`).

Server: `sessions.sam_pc` Sam, no `foothold`; no `footholds`.

### P2 Plant

As Run 0 steps 1 to 4, with the view (step 8) opening by itself after the plant.

Server: `footholds.jack_comms_port` on `office_lan`; `gainedFootholds` has `comms_port`; the link
item in the inventory and the box not.

### P3 See

The view: `HB-DESK-01` with **Open** and Sam's name (from P1), `HB-FIN-02` **Sign in**,
`HB-KIOSK-01` remote sign-in off, `HB-DOOR-01` **Sign in**; then the open share with **Open**, the
finance share with a padlock, the print queue. Nothing of the workshop network. Task `p3_see`
completes (`network_viewed` for `office_lan` with all four hosts). The leak check over every
response before P2 finds no network, host or share string.

Server: no change.

### P4 Open share from the view

Open the open share from its row; Copy the letter into the inventory (it stays listed). Closing
the share returns to the view. Task `p4_share_from_view` completes.

Server: `copiedItems` has `inbox_letter`.

### P5 Remote sign-in

From the view, `HB-FIN-02` (the finance door still locked). No tiles. Sam's right password:
"This account can't sign in on this PC". A wrong password for Lena: 4 attempts left. Lena's
password from the letter opens her desktop, its header naming her and "Remote session through
Drop box: comms room", with the finance share mapped. Open the finance share and read the
handover note: closing the reader shows the finance share again, and closing the share shows
Lena's desktop. Click the locked folder and close the PIN pad without a PIN: the share shows again
(4.3, a lock left without opening anything). Open the locked folder with the PIN from the note;
closing the folder shows the share again. Task `p5_remote_signin` completes. No close on the way drops the player
into the world: only closing the view does.

Server: `sessions.lena_pc = { id: "lena", via: "password", foothold: "jack_comms_port" }`;
`signedInPcs` has `lena_pc`; `finance_office` still locked; no failure entry for Lena (her sign-in
cleared it); `ledger_yearend` in `unlockedObjects`.

### P6 Switch user, remotely

On Lena's remote desktop, Switch user: the remote sign-in screen with no tiles. Sam's details are
refused; leaving the screen shows Lena's desktop again. Task `p6_switch_remote` completes.

Server: `sessions.lena_pc` unchanged.

### P7 Remote sign-in off

The view's `HB-KIOSK-01` row offers no sign-in. At `kiosk_pc` itself, Sam's password signs in.
Task `p7_remote_off` completes.

Server: `sessions.kiosk_pc` Sam, no `foothold`.

### P8 A host with no screen, and the chain

A click on `door_box` in the store shows only its observation. From the view, Ian's details from
the handover note sign in to `HB-DOOR-01`; "Door codes" gives the vault code; the lobby vault
opens. Task `p8_headless_chain` completes (an `unlock_object` task the server checks).

Server: `sessions.door_box` Ian, with `foothold`; `lobby_vault` in `unlockedObjects`.

### P9 Sit down at it

Open `finance_office` with the code from "Door codes". A click on `lena_pc` opens Lena's desktop
with no password. Task `p9_sit_down` completes.

Server: `sessions.lena_pc` has no `foothold` now.

### P10 Unplug

`interact` `comms_port`: "Unplug it" and "Leave it". `Unplug it` returns the box (one in the
inventory, none on the lobby table) and removes the link item; the `HB-DOOR-01` session ends.
`lena_pc` still opens at its keyboard. After planting again, `HB-DOOR-01` asks for a password
again. Task `p10_unplug` completes.

Server, after the unplug: no `footholds`, no `sessions.door_box`, `sessions.lena_pc` kept;
`signedInPcs` and `gainedFootholds` unchanged.

### P11 The other network

Unplug, then plant at `bench_port` in the workshop. The link item is "Network drop box: Bench
switch". Its view lists only the workshop share, which opens. Nothing of the office network. Task
`p11_other_network` completes.

Server: `footholds.jack_bench_port` on `workshop_lan` only.

### P12 Reload

With the box at `comms_port` and a remote session at `HB-FIN-02`, reload. The link item is in the
inventory, the port shows its planted look, the view lists the same rows, Lena's desktop opens
from the view with no password, and every task stays complete. Task `p12_reload` completes.

Server: `footholds`, `gainedFootholds`, `sessions` and `signedInPcs` unchanged.

## Implants (slice 9.3b sub-slice I): N11 to N13

Set-up pieces in the lobby: the "Keystroke injector" (`kit_badusb`, `usbClass` `hid`) and the
"Spare USB stick" (`kit_stick`, droppable, `usbClass` `storage`). Pick both up first. An implant
gives a foothold on the PC's own network and nothing else: no session, no desktop, no owner's
access.

### N13 The kiosk's USB policy refuses the BadUSB

Sign in at the kiosk itself (Sam's sticky-note password), then use the "Kiosk USB socket"
(`kiosk_dock`) with the keystroke injector held. The kiosk's `kiosk_locked` policy blocks USB, so
the server refuses: "USB devices are disabled on this PC." No foothold is granted and the injector
stays in the inventory.

Server: no `implant_kiosk_pc` foothold; `kit_badusb` still held.

### N12 BadUSB at Sam's desk

Sign in at `sam_pc` (keyboard, the sticky note), then use the "USB socket by Sam's PC"
(`sam_dock`) with the keystroke injector held. The server grants `implant_sam_pc` on `office_lan`,
removes the injector, and the link item "BadUSB: Sam's desk" arrives. The implant's view lists the
office network's hosts and shares; it opens no account on its own. Task `n12_badusb_implant`
completes.

Server: `footholds.implant_sam_pc` (`via` `implant`) on `office_lan`; `kit_badusb` gone from the
inventory; no new session.

### N11 A dropped stick the door controller reads

Drop the spare USB stick in the store, then use the "Door controller USB port" (`door_dock`): the
dropped-device action fires and the server, seeing the stick on its `droppedItems` record, grants
`implant_door_box` on `office_lan`. No session is opened; the door controller's own desktop still
needs Ian's account. Task `n11_dropped_implant` completes.

Server: `footholds.implant_door_box` (`via` `implant`) on `office_lan`; no session at `door_box`.

### Reload (implants) and tampered-client checks

A reload (set `location.href` to the game URL with `?skip_resume=1`) keeps `implant_sam_pc` and
`implant_door_box` with their `via` and network, and the link items come back. Tampered requests
are refused by the server: `POST /network/implant` for a PC with no declared `grant_foothold`
action answers 404 `no_action`; a view of a foothold the server never granted answers 404.

## Slice 9.3b sub-slice W: Wi-Fi (N8, N9)

Added by slice 9.3b (`ACCESS_MODEL_SLICE_9_3B_PLAN.md`, section 11, beats N8 and N9). A guest
Wi-Fi network (`guest_wifi`, SSID `Harbour-Guest`), two access points in the lobby (`guest_ap`,
`guest_ap2`) and a small open share on it (`guest_notice`). The key is on the reception Wi-Fi
card (`wifi_note`); the tester reads it there, as with every earned secret.

| Beat | Steps | Server record afterwards |
|---|---|---|
| **N8 Wi-Fi join** | Click `guest_ap`. A keyed network opens the join minigame (`#password-field`, label "Network key", no attempts counter): a wrong key shows "That key was not accepted" and clears the field (no count); the right key joins. The view opens and lists `guest_notice` (its own network only, no office host). `n8_wifi_join` is an `unlock_object` task on `guest_ap`: it ticks on the join with no reload, and the server checks `gainedFootholds`. | `footholds` has `wifi_guest_wifi` (`via wifi`, source `guest_ap`); `gainedFootholds` has `guest_ap`; a wrong key changed nothing |
| **N9 Second access point** | Click `guest_ap2`. The keyless probe answers `already`, so no minigame; `network_joined` fires again and `n9_second_ap` (an `unlock_object` task on `guest_ap2`) ticks. After a reload both AP ids are in `gainedFootholds`. | `gainedFootholds` has `guest_ap` and `guest_ap2`; still one `wifi_guest_wifi` foothold |

Harness: clicking an access point runs `networkLinks.interactWifiAp`, which first tries a keyless
join (an open network would join at once, with no prompt) and, on `wrong_key`, opens the password
minigame in join mode. Drive the key field as any password field
(`{"cmd":"mg","action":"type","args":[0,"<key>",{"submit":true}]}`); read its state with
`{"cmd":"eval","fn":"() => window.__test.minigame?.()?.join"}`. The Wi-Fi key and SSID must reach
the browser from no response; the leak check's `wifi_secret` rule proves it.

## Slice 9.3b sub-slice P: Port security (N10)

Added by sub-slice P. A new game. Take the drop box, go north to the comms room, and
`interact` `secure_port` (the second, locked wall port). Confirm the plant. The switch refuses
the device: a toast shows the switch message ("The switch logs the device address and shuts the
port... unused ports like this should be disabled."), no view opens, no link item arrives, and the
box is still in the inventory. `network_device_refused { jackId: 'secure_port', reason:
'port_security' }` fires, so task `n10_port_security` completes. Planting at `comms_port`
afterwards still works (an open port is unaffected). The state survives a reload (the box is still
held, `secure_port` has no foothold).

Server, after the refusal: no `footholds.jack_secure_port`, the drop box still in `inventory`, no
`gainedFootholds` entry for `secure_port`; nothing else changed. The port-security refusal carries
only the authored message: no network name, host or share reaches the browser (the leak check
covers it).

## Slice 9.3b sub-slice O: Outages (N5 to N7)

Added by sub-slice O (`ACCESS_MODEL_SLICE_9_3B_PLAN.md`, section 5.2). `server_net` now carries
`downIf: "servers_offline"` and the global starts `false` (up), so the pivot beats N1 to N4 are
unchanged. In the server room (north of the comms room) a rack breaker (`server_breaker`) takes
the network down, a power switch (`server_power`) restores it. All outage state is read on the
server from its own globals, so a tampered client cannot reach a downed network, clear the global
it cannot set, or keep using a no-route session.

| Beat | Steps | What should happen | Server afterwards |
|---|---|---|---|
| **N5 Outage** | With the box planted and a pivot session at `lena_pc`, `interact` `server_breaker` (sets `servers_offline` true). Open the box's view. | The Server network block is gone (no name, no greyed row): the player holds no session on it. A sign-in on `sv_fs02` through the box is 403 `unreachable`. `n5_outage` ticks. | `player_reach(jack_comms_port)` is `office_lan` only; no `server_net` string in any read route |
| **N6 Repair** | `interact` `server_power` (sets `servers_offline` false). Open the box's view; sign in to `sv_fs02` through the box. | The Server network block fills back in (route `up`, through `lena_pc`); `sv_fs02` signs in. `n6_repair` ticks. | `player_reach` includes `server_net` again |
| **N7 Held route down** | Sign in to `sv_fs02` through the box first, then `interact` `server_breaker`. The desktop closes to a greyed "No route to SV-FS02" row; a desktop fetch is refused. Then `interact` `server_power` and reopen `sv_fs02`. | The session is kept throughout; while down the view shows a greyed `server_net` block with the "no route" row; on repair the desktop opens again with no password. `n7_held_route` ticks (on `pc_desktop_opened` for `sv_fs02` while armed and repaired). | `sessions.sv_fs02` present the whole time; `endedPcIds` never names it for an outage |

### N14: a host whose own service is off (plan 5.2)

In the workshop, `bench_pc` (WS-BENCH-01, a sign-in PC on `workshop_lan`, `access` staff) carries
`affordance.offWhen: "bench_pc_off"`, true at the start. The `bench_power` switch flips it with two
`confirm_action`s. The box's view sends the latest globals before it fetches, so a flip shows at
once. Off is off at the keyboard too (user decision q72). While off the PC shows `aw_pc_off1` (a
dark monitor and tower, through `spriteVariants`), and back on it shows its map picture again.
Its desktop holds a PIN folder, `bench_logs` (PIN 3141, given in its observations).

| Beat | Steps | What should happen | Server afterwards |
|---|---|---|---|
| **N14 Host off** | Plant the box in `bench_port` (unplug it from the comms room first). The view lists `bench_pc` as "not responding" with no control (`action: "not_responding"` in the test state). `interact` `bench_power`, Confirm, open the link item again: `bench_pc` offers Sign in. Sign in with Sam's sticky-note details. | `n14_seen_off` is set by the first view; `n14_host_off` ticks on the remote sign-in. With the PC switched off again, a held session's row shows "not responding", a desktop fetch through the box is 403 and the session is kept. A forced `POST /login` through the box while off is 403 `not_responding` and counts no failure. At the keyboard (q72): with the PC off, `interact` `bench_pc` shows "This PC is off." and opens nothing, a held session included; switched back on, the same click opens the sign-in screen or the session's desktop | `sessions.bench_pc` remote through `jack_bench_port` and kept while off; `loginFailures` 0 |
| **N14 Left open** | Signed in at the keyboard, open the desktop, then switch the PC off while it is open (another player action or `__test` setting `bench_pc_off`). Again with the Bench-Notes share open, and with the `bench_logs` PIN pad open (then enter 3141). | The desktop or share closes with "This PC is off." and nothing opens empty. The PIN pad says "This PC is off." and closes, with no wrong-PIN verdict and no attempt counted. Switched back on, the PIN opens the folder | `unlockedObjects` has no `bench_logs` while off; the session is kept |

The scoped-request route test: a folder, inventory add or unlock scoped under the remote
`sv_fs02` session is allowed only while the route is up, read from the server's own
`sessions[sv_fs02].foothold`, never a client parameter. A local (keyboard or claim) session is
never affected. A resource whose own `downIf` is truthy is withheld from the view and not served
in the same way, returning when its global clears.

## Earned secrets

| Secret | In-game source | Used in |
|---|---|---|
| Sam's password | The sticky note on `sam_pc` | P1, P5 (refused), P6 (refused), P7 |
| Lena's username and password | The scanned letter in the open office share | P5, P12 |
| Ian's username and password | The IT handover note in the finance share | P8, P10 |
| The locked folder's PIN | The same handover note | P5 |
| The finance door and vault codes | "Door codes" on the door controller | P8, P9 |

Wrong passwords are made up by the tester. Nothing is set from the console; a reload is a page
reload.

## Expected validator output

`ruby scripts/validate_scenario.rb scenarios/test_access_networks/scenario.json.erb` (with
`LANG=C.UTF-8`): no errors. One warning, the `maxAttempts` lockout warning the first slice gives
for `lena_pc` (policy `counted`). No "doors skipped" warning (`counted` writes `remote` out).
Information lines: the identity reach of each account (every account holder has the implicit
`staff` role, so Lena and Ian also sign in at `sam_pc` and `kiosk_pc`); each jack's reach (now
including `secure_port` on `office_lan`, sub-slice P); and
"Reachable without a foothold" for `sam_pc` and `kiosk_pc` (open rooms, not headless) and for the
finance share, which maps for Lena on both of those. The open shares are not on that list, nor is
`lena_pc` (behind a PIN door) or `door_box` (headless): the chain's payoff, "Door codes", is on the
headless host, so it still needs the box. Plus the generic suggestions every small test scenario
gets.

Slice 9.3b sub-slice O adds one information line and no error or warning: "Outage: network
'server_net' is down while 'servers_offline' is truthy; it starts up." `servers_offline` is
declared in `globalVariables`, so no undeclared-global warning; `backup_vault` is an access-listed
share (not an open share), so the start-down open-share warning does not apply.

Slice 9.3b sub-slice I adds one expected warning: the `grant_foothold` at the kiosk socket targets
`kiosk_pc`, whose `kiosk_locked` policy refuses the keystroke injector's USB class (this is beat
N13 on purpose, so the refusal can be shown). The `kit_stick` "droppable without a needsTag"
warning is the generic droppable one.
