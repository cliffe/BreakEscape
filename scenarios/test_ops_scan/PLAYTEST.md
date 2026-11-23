# test_ops_scan: scripted playtest (core stage S1, feature N13)

The feature scenario for ops core stage S1 (`docs/achitechture/OPS_CORE_PLAN.md`, sections 4.1, 6 and
11.4, beat table "`test_ops_scan` (S1)"). One run, one new game, about 20 minutes. One numbered
beat below per table row, each with what the browser should receive and what the server should
record. After every beat check the screen, the server's record and what reached the browser.

The scenario is for testing, not play. The one password the run types is read from the lobby note in
the game first; none is written here or on a sign. No sign, task title or brief names a host, product
or version: those strings reach the browser only from `GET /network` and `POST /network/scan`, and the
leak check proves it.

## Setup

Keyless server on a free port (never :3000, :3085 or :3086). In a container set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` and pass `--headless`. The scenario has no
Mission row until it is seeded after landing, so `new-game.rb` cannot find it: make the game with
`swap-scenario-game.rb` (host scenario `test_access_signin`). Do not use `new-game.sh`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_scan   # prints GAME_ID=
S=<scratchpad>/test_ops_scan
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/responses-<game_id>.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
tools/playtest/cmd.sh <game_id> '{"cmd":"eval","fn":"() => window.__test.throttleFps(20)"}'
```

The checks after every beat (the first two read the server's record, the third the responses file; run the leak
check over the whole file each time, it reads the earned steps from the answers in order; `--access` and `--ops-log` are
two runs, the script takes one at a time):

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --ops-log
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/responses-<game_id>.jsonl
```

`verify-run.rb --access` prints the `opsDiscovered` line (networks, then hosts, each in id order,
ids only); `--ops-log` prints the `network_audit` rows and exits 1 on a stored secret. The leak
check must say `VERDICT: no leaks found` after every beat. Beat 2's by-name requests are answered as an open network
answers and carry no host or product string, so the check reads them too and still passes.

## Layout

- `lobby` (start): the drop box `kit_dropbox` on the right, the guest port `guest_port` (network
  `guest_lan`, an open network) and the office port `office_port` (network `office_lan`, a discovery
  network), the wall switch `camrec_switch`, the desk note `it_note` (the file server's sign-in), the
  sign `sign_lobby`, Ian (`ian`, role it, owns the account), and the guest kiosk `guest_kiosk`
  (a sign-in PC on `guest_lan` with one service).
- `comms_room` (north, open): `files01`, a headless sign-in file server on `office_lan` with one service.
- `back_office` (east, PIN door nobody is given): `desk01`, a sign-in PC on `office_lan`. The run never
  enters it.
- Not in any room: three `hosts` entries, which are never clicked in the world: `printer01` (second floor
  printer, two services) and `camrec01` (camera recorder, one service, powered down by the switch)
  on `office_lan`, `doorctl01` (door controller, two services) on `plant_lan`.
- `office_lan` and `plant_lan` are `discovery: "scan"`; `office_lan` and `plant_lan` are linked, so
  a session on an `office_lan` PC opens `plant_lan`. `office_lan` also holds the open share
  `office_drop`. The log source `network_audit` takes `network_swept` and `host_scanned` and has no `where`.
- Footholds: planting the box in `office_port` gives `jack_office_port`; in `guest_port`, `jack_guest_port`.
  Only one box exists, so unplug before the second plant.
- Ian's account is `iokafor`; his password is on the lobby note `it_note`. It admits him at
  `guest_kiosk`, `files01` and `desk01`.

## Harness notes

- **The jacks ask first** (`gameConfirm`, not a minigame): answer the plant prompt with
  `{"cmd":"dismiss","label":"Plug it in"}`; `mg clickSelector` cannot see it. A planted jack opens the box's
  network view with an Unplug button (`[data-unplug]`).
- **Taking the box.** `{"cmd":"moveToNear","id":"kit_dropbox"}` then `{"cmd":"interact","id":"kit_dropbox"}`.
- **The view** is the minigame `network-view`. Read it with
  `{"cmd":"mg","action":"getState"}`, or `window.MinigameFramework.currentMinigame.getTestState()`.
  Fields used here (all in `docs/test-bridge.md`, "Driving the network screens"): `footholdId`, `status`
  (`ready` when loaded), `ownNetwork` (`{ id, swept?, ops?, sweep? }`, present only for a network that carries an ops
  key), `rows` (the own network's rows: `id`, `kind`, `name`, `scanned`, `services`, and `scan`, the Scan selector, only
  while Scan is offered), `networks` (every block: `id`, `route`, `swept`, `ops`, `sweep` (the Sweep selector, only while offered),
  `rows`), `pending` (only while a request is out). Services are `{ name, label, port, product, version }`.
- **With the view closed** read the last answer the client fetched:
  `{"cmd":"eval","fn":"() => window.__test.access.networkView('jack_office_port')"}`. Its `networks`
  blocks carry `swept`, `ops` and rows with `scanned` and `services`. It is the answer as the server sent it; a script
  that wants to look at a fresh one reopens the view.
- **Clicking an action.** Sweep: `{"cmd":"mg","action":"clickSelector","args":["[data-network-id=\"office_lan\"] [data-action=\"sweep\"]"]}`.
  Scan: `{"cmd":"mg","action":"clickSelector","args":["[data-host-id=\"printer01\"] [data-action=\"scan\"]"]}`.
  Sign in: `[data-host-id="files01"] [data-action="sign-in"]`. Use the selector the state names
  (`sweep`, `scan`) when it is there; when it is absent the control is not offered, which is itself the check.
  A beat names actions (sweep, scan), so the same beats run against another renderer.
- **After a click** wait for `pending` to go away (about a second), then read the state again. The view refetches
  itself after an ops answer.
- **The remote sign-in screen** has the username as field 0 and the password as field 1:
  `{"cmd":"mg","action":"type","args":[0,"iokafor"]}`, then
  `{"cmd":"mg","action":"type","args":[1,"<password from the note>",{"submit":true}]}`. The note's text is read with
  `interact` `it_note` (a `gameDisplay`; read its text from the screen and dismiss it).
- **Hostile requests** are sent from the page with `eval` and `fetch`, carrying the CSRF token
  (`document.querySelector('meta[name=csrf-token]').content`) in an `X-CSRF-Token` header, as JSON, so the session's
  response capture records them for the leak scan. The scan route is
  `POST /break_escape/games/<id>/network/scan` with `{ foothold, network_id }` or `{ foothold, host_id }`.
- **Reload.** `{"cmd":"sync"}`, then `{"cmd":"eval","fn":"() => { location.reload(); return true; }"}`, wait about 15 s, then
  `{"cmd":"bootstrap","tutorial":"decline","resume":"resume"}`. Without `"resume":"resume"` the bootstrap can answer the
  resume prompt with a new session, which discards the save.
- **The switch.** `interact` `camrec_switch`: a hint "The recorder's light goes out" and the global `camrec_off` is true.
  The global is written by the client and synced, so `{"cmd":"sync"}` before the next scan.

## Beats

Read `sign_lobby` first. Take the box. The "Browser receives" column is what to assert; "Server records" is the
`verify-run.rb` output.

### 1. The office network opens empty

Plant the box in `office_port` (`Plug it in`). The view opens by itself the first time.
- Browser: `networkView('jack_office_port').networks` has one block, `office_lan`, with `swept: false`, no host rows and
  no `ops` key; `getState` has `ownNetwork.sweep` naming the Sweep control and no row has a `scan`. No host name, count,
  product or version string appears anywhere in the view text. (Product names to look for: none of Inkvale, Lookwell,
  Gatewright, Brackley, Larkspur, nor "printer", "recorder", "controller", `FILES01`, `DESK01`.)
- Server: `footholds` has `jack_office_port`; `opsDiscovered` prints nothing; `network_audit` has no rows.

### 2. By direct request: answered as on an open network, and the ops requests are one 404

As a player who learnt the names somewhere else, by `eval` and `fetch` (CSRF token as above), with the foothold
`jack_office_port` and the view closed:
- `GET /login_accounts?pc_id=desk01&foothold=jack_office_port` and `GET /container/office_drop?foothold=jack_office_port`.
- Then (hostile) `POST /network/scan` with `host_id: "printer01"`, with `host_id: "invented_one"`, with `network_id: "plant_lan"`
  and with `network_id: "invented_net"`. Reopen the view.
- Browser: the account tiles and the share answer 200, as they would on an open network, because discovery governs only what the view
  lists. The four scan requests get one identical body, `{"success":false,"reason":"not_found"}`, status 404 (compare the
  real and the invented id: byte for byte the same). The reopened view still lists no rows.
- Server: nothing (`opsDiscovered` empty, no log row). The leak check is told that these by-name requests were sent; they are
  answered as an open network answers and leak nothing, so it still reads them and must pass.

### 2b. A sign-in by name before the sweep (the stage's live proof; a second, short game)

Make a second game (setup), plant the box in `office_port` and, with the view closed, sign in to `files01` by name, because its row is
not listed: `POST /break_escape/games/<id>/login` by `fetch` with
`{ pc_id: "files01", username: "iokafor", password: <the note's>, foothold: "jack_office_port" }`. Then open the view.
- Browser: the sign-in answers `{"success":true,...}` exactly as it would on an open network. The view's `office_lan` block lists exactly one row,
  `files01`, with a session shown and the Open control, `swept: false`, and nothing else in the block: no `printer01`, `camrec01`,
  `desk01` or share row, no `scan` selector on any row. `plant_lan` appears as a second block, unswept and empty.
- Server: `sessions.files01` a password session with the foothold; `opsDiscovered` still empty; no log row.
- Then click Sweep on `office_lan`: the block now lists all five rows, `files01` keeping its session.

### 3. Sweep, then Sweep again

In the main game, with the view open on `office_lan`, click Sweep.
- Browser: the block lists five rows: `camrec01` and `printer01` (devices), `desk01` and `files01` (sign-in PCs) and the share
  `office_drop`; none has `scanned` or `services`. The Sweep control is gone (`swept: true`). The view offers Sweep no more, so repeat it from the page: `POST /network/scan` with `network_id: "office_lan"` answers `{"success":true,"already":true,...}` with the same rows.
- Server: `opsDiscovered` has `networks office_lan`; `network_audit` has one `network_swept` row, `where` the network, count 2
  after the repeat (merged); `where.kind` is `network`.

### 4. Scan the printer, then again

Click Scan on `printer01`.
- Browser: two service tiles in the row: `print`, port 9100, product `Inkvale JetServe`, version `1.4`; and `admin_page`, label
  "Admin page", port 80, `Inkvale WebPanel` `2.0`. The Scan control is gone from that row; every other row still shows Scan and no services. The repeat
  by `fetch` (`host_id: "printer01"`) answers `already: true` with the same `services`.
- Server: `opsDiscovered` hosts `printer01`, once; one `host_scanned` row (`where.kind` `host`).

### 5. Flip the switch, scan the camera recorder

`moveToNear` and `interact` `camrec_switch`, `sync`, reopen the view, click Scan on `camrec01`.
- Browser: the row shows powered down (`responding: false` in its row, action `not_responding`); a click on Scan (if offered) or the request by
  `fetch` answers 403 `{"success":false,"reason":"not_responding"}`.
- Server: nothing new (`opsDiscovered` still `printer01` only; no new row).

### 6. Sign in to the file server, the plant network appears

Sign in to `files01` from the view (click Sign in on its row; the sign-in screen asks for the note's username and password).
- Browser: a second block, `plant_lan` (reached through `files01`), `swept: false`, no rows, the Sweep control offered.
- Server: `sessions.files01` with the foothold; `opsDiscovered` unchanged.

### 7. Sweep the plant network, scan the controller

Click Sweep on `plant_lan`, then Scan on `doorctl01`.
- Browser: the block lists one row, `doorctl01`; then its two services, `control` (port 502, `Gatewright DoorLink` `2.3`) and
  `status_page` (label "Status page", port 8080, `Gatewright LinkView` `1.1`).
- Server: `opsDiscovered` networks `office_lan plant_lan`, hosts `doorctl01 printer01`; four `network_audit` rows
  (`network_swept` office_lan x2, `host_scanned` printer01, `network_swept` plant_lan, `host_scanned` doorctl01: the repeats merged), no secret in any.

### 8. Reload

Reload (harness notes), reopen the view.
- Browser: the same blocks, rows and service tiles as before the reload.
- Server: unchanged.

### 9. Unplug, plant again

Press Unplug in the view, then plant the box in `office_port` again.
- Browser: sessions are gone, so no `plant_lan` block; `office_lan` still `swept: true`, its rows listed and `printer01`'s tiles still shown.
  Sign in to `files01` again: `plant_lan` returns, already swept, with `doorctl01` and its tiles (no second sweep or scan).
- Server: `sessions` empty after the unplug (and `files01` signed in again after the second sign-in); `opsDiscovered` unchanged throughout.

### 10. The open guest network

Unplug, plant the box in `guest_port`.
- Browser: the block `guest_lan` lists `guest_kiosk` at once; it has no `swept` key and no Sweep control; Scan is offered on `guest_kiosk` and
  on nothing else; no service is shown yet. A Sweep sent by `fetch` (`network_id: "guest_lan"`) answers 422 `not_needed`. Click Scan: one tile,
  `portal`, port 8000, `Heronvale PortalLite` `1.2`.
- Server: `opsDiscovered` hosts gain `guest_kiosk`; one more `host_scanned` row.

### 11. End of run

`{"cmd":"sync"}`, the full leak check over the whole responses file, then `verify-run.rb <game_id> --access` and `verify-run.rb <game_id> --ops-log` as two commands (each prints its own part and exits), then `{"cmd":"quit"}`.
- The leak check: no host, product, version or service text before the beat that earned it, over every answer.
- `verify-run.rb --access` prints the `opsDiscovered` line; `verify-run.rb --ops-log` ends with `ops log OK`.

## Earned secrets

| Secret | In-game source | Used in |
|---|---|---|
| Ian's username and password (`iokafor`) | the note `it_note` in the lobby | 2b, 6, 9 |

## Expected validator output

`ruby scripts/validate_scenario.rb scenarios/test_ops_scan/scenario.json.erb` (with `LANG=C.UTF-8`) reports 0 errors and one warning:
`guest_kiosk` runs a service on the open network `guest_lan` where nothing has a weakness (services that are only scenery). That is
intended: S1 has no weakness field (it is S2's), and the open network's scan beat needs a service. The identity and network reach
info lines and the generic suggestions of a small test scenario follow.
