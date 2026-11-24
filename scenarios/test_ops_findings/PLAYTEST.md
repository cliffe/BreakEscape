# test_ops_findings: scripted playtest (core stage S2, feature N14)

The feature scenario for ops core stage S2 (`docs/achitechture/OPS_CORE_PLAN.md`, sections 4.2, 5.3, 6 and 11.4, beat table
"`test_ops_findings` (S2)", and the S2 line of 11.5). Two games: run A (beats 1 to 10) and run B (beat 11, a fresh game). About 30
minutes. One numbered beat below per table row, each with what the browser should receive and what the server should record. After
every beat check the screen, the server's record and what reached the browser.

The scenario is for testing, not play. No sign, task title or brief names a host, product, version, class or summary: those strings
reach the browser only from `GET /network`, `POST /network/scan`, `/network/check` and `/network/confirm`. The world documents
(`maint_log` on the lobby desk, `installer_sheet` in the supply cupboard) say in plain words which printer finding is real and which is
not; the engine does not link them to the findings.

## Setup

Keyless server on a free port (never :3000, :3085 or :3086). In a container set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`
and pass `--headless`. The scenario has no Mission row until it is seeded after landing, so `new-game.rb` cannot find it: make each game
with `swap-scenario-game.rb` (host scenario `test_access_signin`). Do not use `new-game.sh`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_findings   # prints GAME_ID=
S=<scratchpad>/test_ops_findings
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/responses-<game_id>.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
tools/playtest/cmd.sh <game_id> '{"cmd":"eval","fn":"() => window.__test.throttleFps(20)"}'
```

The checks after every beat (the first two read the server's record, the third the responses file; run the leak check over the whole file
each time (a session resumed in a new browser writes a new capture file: give the check EVERY capture file of the game, oldest first, in one run, because the scans and checks a later file's answers rely on were earned in an earlier one); `--access` and `--ops-log` are two runs, the script takes one at a time):

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --ops-log
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/responses-<game_id>.jsonl
```

`verify-run.rb --access` prints the `opsDiscovered` line (networks, hosts, then checked services as `<host>.<service>`) and the
`opsFindings` line (`f1 <finding id> <status word>; ...` in alias order; compare it with the beat's "Server" line);
`--ops-log` prints the `findings_audit` rows and exits 1 on a stored secret.
The leak check must report no leaks after every beat. Its check-stage tags cover the class, severity and summary of a finding
(`check:<host>.<service>`), a decoy's reason and a real finding's need labels (`confirm:<finding id>`); a string tagged `never`
(a link id, a global name, an unlinked entry's module) is a leak at any stage. Structural rules
need no distinctive string: a finding row before its confirm that carries `needs`, `fixed`, `falseBecause` or a status other than
`unconfirmed`; a `fixedIf`, `grants`, `realism`, `weaknesses` or `decoys` key anywhere; the name of a gating global inside a finding row.

## Layout

- `lobby` (start): the drop box `kit_dropbox`, the office port `office_port` (network `office_lan`, foothold `jack_office_port`), the annex
  port `annex_port` (also `office_lan`, foothold `jack_annex_port`), the wall switch `share_switch` (sets the global `share_locked`), the
  desk log `maint_log`, the sign `sign_lobby`, Ian (`ian`, role it; his mappings tick the two objective tasks).
- `supply_room` (west, open): the supply cupboard `supply_cupboard` (not locked) holding `printer_manual` ("Printer manual", the item
  the printer finding needs) and `installer_sheet` ("Installer's sheet"). Take the manual in beat 5, not before.
- `comms_room` (north, open): `files01`, a headless sign-in file server on `office_lan`. `back_office` (east, PIN door nobody is given,
  never entered): `desk01` and the note `vault_note` that holds the archive login; the credential `archivist_login` is never given.
- Not in any room: `printer01` (second floor printer: `print`, then `admin_page` with weakness `factory_login`, needs the item
  `printer_manual`, and decoy `old_banner`) and `camrec01` (camera recorder: `stream` with only the decoy `old_firmware`).
- `files01` services: `files` (weakness `open_share`, `fixedIf` the global `share_locked`) and `backup` (weaknesses `archive_login`,
  needs the credential `archivist_login`, and `backup_list`, needs nothing).
- Finding ids are `<host>.<service>.<id>`; aliases `f1`, `f2`, ... follow the order the findings are first listed in the game.
  In this order of play: `f1` `printer01.admin_page.factory_login`, `f2` `printer01.admin_page.old_banner`, then later
  `files01.files.open_share` is `f3`, `camrec01.stream.old_firmware` `f4`, `files01.backup.archive_login` `f5`,
  `files01.backup.backup_list` `f6`. Read aliases from the screen; use these only if the order above was followed.
- The log source `findings_audit` takes `network_swept`, `host_scanned`, `service_checked` and `finding_confirmed`, no `where`.
- No weakness has `grants`, `needs.session` or a technique card; nothing here is S3.

## Harness notes

- **The jacks ask first** (`gameConfirm`, not a minigame): answer the plant prompt with `{"cmd":"dismiss","label":"Plug it in"}`. A planted
  jack opens the box's network view with an Unplug button (`[data-unplug]`).
- **Taking the box.** `{"cmd":"moveToNear","id":"kit_dropbox"}` then `{"cmd":"interact","id":"kit_dropbox"}`.
- **The view** is the minigame `network-view`. Read it with `{"cmd":"mg","action":"getState"}` (the minigame's `getTestState()`). Fields
  used here (all in `docs/test-bridge.md`, "Driving the network screens"): `footholdId`, `status`, `ownNetwork`, `rows` (each row's
  `id`, `scanned`, `services`, `scan` (the Scan selector, only while offered), `checks` (service name to the selector of its Check
  control, only while Check is offered) and `findings`), `pending` (only while a request is out). `findings` (only once the player holds
  some, in alias order) is a list of `{ alias, id, service, class, severity, summary, status, fixed, needs, reason, confirm? }`:
  `status` is `unconfirmed`, `confirmed` or `false`; `needs` is `[{ kind, label, met }]` for a confirmed finding; `reason` is a false
  finding's reason; `confirm` is the Confirm selector, only while the finding is unconfirmed.
- **With the view closed** read the last answer the client fetched:
  `{"cmd":"eval","fn":"() => window.__test.access.networkView('jack_office_port')"}`; a host row of `networks[].hosts` carries `findings`
  once a service of it has been checked. It is the answer as the server sent it; to read a fresh one, reopen the view (one `GET /network`).
- **The controls.** Check: `{"cmd":"mg","action":"clickSelector","args":["[data-host-id=\"printer01\"] [data-service=\"admin_page\"] [data-action=\"check\"]"]}`.
  Confirm: `{"cmd":"mg","action":"clickSelector","args":["[data-finding=\"f2\"] [data-action=\"confirm\"]"]}` (the finding's alias). Sweep:
  `[data-network-id="office_lan"] [data-action="sweep"]`; Scan: `[data-host-id="printer01"] [data-action="scan"]`. Use the selector the
  state names (`checks`, `confirm`, `scan`, `sweep`) when it is there; when it is absent the control is not offered, which is itself the
  check. A need line is `.network-need[data-met="true|false"]`, the reason of a false finding `.network-finding-reason`, and a fixed
  finding shows `.network-finding-fixed`.
- **After a click** wait for `pending` to go away (about a second), then read the state again. The view refetches itself after an ops
  answer. Each success fires `network_service_checked` or `network_finding_confirmed` (events read with `{"cmd":"eval", ...}` on the
  bridge's event log, or from the two objective tasks ticking: `s1_check_admin` on the admin page check, `s2_confirm_false` on the first
  false confirm).
- **Hostile requests** are sent from the page with `eval` and `fetch`, carrying the CSRF token
  (`document.querySelector('meta[name=csrf-token]').content`) in an `X-CSRF-Token` header, as JSON, so the session's response capture
  records them for the leak scan. Routes: `POST /break_escape/games/<id>/network/check` with `{ foothold, host_id, service }` and
  `POST .../network/confirm` with `{ foothold, finding_id }` (the built id, never the alias).
- **Picking up the manual.** `{"cmd":"moveToNear","id":"supply_cupboard"}` (it walks through the lobby's west door; if the walk stops,
  `interact` the door first), `{"cmd":"interact","id":"supply_cupboard"}`, then `{"cmd":"mg","action":"take","args":["Printer manual"]}`
  and close the container. The manual goes into the notes ("Added 'Printer manual' to your notes"), not into `inventory`, so do not look for it there; the tick in the reopened view is the check. Do not take the installer's sheet:
  only `printer_manual` is a need.
- **The switch.** `interact` `share_switch`: a hint "The file server's open share is switched off" and `share_locked` is true. The global is
  written by the client and synced, so `{"cmd":"sync"}` before the next read.
- **Reload.** `{"cmd":"sync"}`, then `{"cmd":"eval","fn":"() => { location.reload(); return true; }"}`, wait about 15 s, then
  `{"cmd":"bootstrap","tutorial":"decline","resume":"resume"}`. Without `"resume":"resume"` the bootstrap can answer the resume prompt with
  a new session, which discards the save.

## Beats (run A)

Read `sign_lobby` and `maint_log` first. Take the box. The "Browser receives" lines are what to assert; "Server" lines are the
`verify-run.rb` output.

### 1. Plant, sweep, and a check before any host scan

Plant the box in `office_port` (`Plug it in`), click Sweep on `office_lan`. Then, from the page by `fetch`, with the foothold
`jack_office_port`: `POST /network/check` with `host_id: "printer01", service: "admin_page"` (the printer is listed but not scanned), and again with
`service: "invented_service"`.
- Browser: both requests answer one identical body, `{"success":false,"reason":"not_found"}`, status 404 (compare byte for byte). The view
  lists four host rows (the real count: DESK01 and FILES01, the two sign-in machines, shown by their ids, then Camera recorder and Second floor printer; the sweep lists no share) with no tile and no
  Check control anywhere.
- Server: `opsDiscovered.networks` has `office_lan`; no `opsFindings`; one `network_swept` row and no `service_checked` row.

### 2. Scan the printer, check the admin page

Click Scan on `printer01` (two tiles: `print` port 9100 and `admin_page` port 80), then click Check on the `admin_page` tile. Neither tile
shows a finding before the click.
- Browser: before the click the state's `findings` is absent and `checks` names a Check control for each tile. After: two findings under
  the tile, both `unconfirmed`, aliases `f1` and `f2`, with the same keys on each (`alias`, `class`, `severity`, `summary`, `status`, no `needs`,
  no `reason`, no `fixed`) in id order (`factory_login`, then `old_banner`). `f1` reads "The admin page still accepts the account it shipped
  with." (class default credentials, high); `f2` reads "The page reports an old build number." (unpatched, medium). Each has a Confirm control.
  The `print` tile still offers Check and lists nothing (it has no weakness or decoy).
  The task `s1_check_admin` ticks. Nothing in the answer says which finding is the decoy.
- Server: `opsFindings` has `printer01.admin_page.factory_login` as `u1` and `printer01.admin_page.old_banner` as `u2`;
  `opsDiscovered.services` has `printer01.admin_page`; one `service_checked` row.

### 3. Read the log, confirm the decoy

Read `maint_log` (it says the panel was updated last month). Click Confirm on `f2`.
- Browser: `f2` becomes `false` and shows its reason in `.network-finding-reason`: "The build number is cosmetic. The panel was updated last
  month." It has no needs and no Confirm control. The task `s2_confirm_false` ticks.
- Server: `opsFindings` entry for `old_banner` is `f2`; one `finding_confirmed` row (`status` false).

### 4. Confirm the real finding, check again

Click Confirm on `f1`. Then click Check on the `admin_page` tile again, and send the same check by `fetch`.
- Browser: `f1` becomes `confirmed` and lists one need, "Printer manual", with `data-met="false"` (a cross). Pressing Check again changes
  nothing visible: the same two findings, `f1` confirmed and `f2` false, aliases kept, no third finding. The `fetch` answers
  `"already":true` with both statuses and aliases.
- Server: `factory_login` is `c1`; two `finding_confirmed` rows in all; still one `service_checked` row.

### 5. Take the manual, reopen the view

Without a reload, take `printer_manual` from the supply cupboard (harness notes), leave the supply room and open the view again
(`interact` the planted jack `office_port`; that is one fresh `GET /network`).
- Browser: `f1` is still `confirmed`, its need "Printer manual" now has `data-met="true"` (a tick). Nothing else changed; no reload of the page.
  Pressing Check again by `fetch` answers `already: true` with the same need met.
- Server: unchanged (`met` is computed on read): same `opsFindings`, no new log row.

### 6. Scan the file server, check its first service

Click Scan on `files01`.
- Browser: the file server's tiles appear (`files`, `backup`) and no finding.

**6a (hostile, now, before any check of `files01`).** By `fetch`, `POST /network/confirm` with `finding_id: "files01.files.open_share"`
(the weakness exists but has never been checked).
- Browser: the one 404 `{"success":false,"reason":"not_found"}`, the same bytes as an invented id once the id is masked (beat 9 sends the
  invented one and compares). Server: nothing written. After this, every finding in the scenario has been checked, so this is the only
  moment for it.

Then click Check on the `files` tile.
- Browser: one finding, `open_share` ("The share is open to anyone on the network.", misconfiguration, medium), `unconfirmed`, with a
  Confirm control. No Fixed mark.
- Server: `files01.files.open_share` is `u<n>`; `opsDiscovered.services` has `files01.files`; one more `service_checked` row.

### 7. Flip the switch before the confirm, then confirm

`interact` `share_switch` (a hint titled "File server switch" reads "The file server's open share is switched off."; capture it from the hint or toast), `sync`, reopen the view (the finding is still unconfirmed).
- Browser: the finding is still `unconfirmed`: no `.network-finding-fixed`, no `fixed` in the state, the same keys as before the switch.
  Now click Confirm: it becomes `confirmed` with no needs and shows Fixed at once (`.network-finding-fixed`, `fixed: true` in the state).
  This is the plan's "Fixed only after its confirm" (11.5, S2). (Beat 11 is the other rule: a switch flipped before any check lists nothing.)
- Server: the stored status is `c<n>` (never a fixed word); one more `finding_confirmed` row.

### 8. The camera recorder

Scan `camrec01`, Check its `stream` tile, Confirm the one finding.
- Browser: one finding, unconfirmed, then `false` with its reason "The date is a leftover from the factory image. The firmware was replaced when the
  unit was installed."
- Server: a `f<n>` entry; one `service_checked` and one `finding_confirmed` row more.

### 8a. The file server's second service

Check the `backup` tile; Confirm both findings; then Confirm the first one again by `fetch`.
- Browser: two findings in id order (`archive_login`, then `backup_list`). After the confirms, `archive_login` lists one need, the label
  "Note: archive login", unmet (a cross) and it stays unmet: the login is on a note in a room nobody can enter. `backup_list` is confirmed with no needs.
  The repeat Confirm answers `{"success":true,"already":true,...}` with the same finding.
- Server: two more `finding_confirmed` rows and none for the repeat.

Beat 8b (a forged sync body writing the server's records) is not played in the browser: the Rails tests make that check, `test/controllers/break_escape/network_ops_state_delta_test.rb` and the hostile tests in `test/controllers/break_escape/network_technique_hostile_test.rb`.

### 9. (hostile) an invented finding id

By `fetch`, `POST /network/confirm` with `finding_id: "printer01.admin_page.nothing_here"`. Compare it with the never-checked id of beat 6a.
- Browser: the same 404 `{"success":false,"reason":"not_found"}` as 6a, byte for byte once the id is masked.
- Server: nothing.

### 10. Reload, and the other port

Reload, reopen the view. Unplug, plant the box in `annex_port`, open the view.
- Browser: every finding is as it was, with the same aliases, statuses, needs and the Fixed mark; the annex foothold shows the same findings (they belong to the game).
- Server: unchanged.

### 12. End of run A

`{"cmd":"sync"}`, the leak check over the whole responses file, then `verify-run.rb <game_id> --access` and `verify-run.rb <game_id> --ops-log`
as two commands, then `{"cmd":"quit"}`.
- No class word or summary before a check; no reason or need before the confirm; no `grants`, `fixedIf` or `realism` key anywhere; no
  `share_locked` in any check, confirm or `GET /network` answer (it does appear in the bootstrap's declared globals and in the lobby switch's
  room data, so a `grep` of the whole responses file will find it there: that is not a leak, and the leak check prints a note saying so);
  the answers carry no `needs`, `fixed` or `falseBecause` key and no status but `unconfirmed` on a finding before its confirm.
- `--ops-log` ends with `ops log OK`.

## Beat 11 (run B, a fresh game)

Make a second game (setup). Plant, sweep, scan `files01`, then BEFORE checking anything `interact` `share_switch` and `sync`. Then click Check
on `files01`'s `files` tile, then press it again (or send the check by `fetch`).
- Browser: the first check lists no finding: the tile shows no finding (the view's no-findings notice) and the answer's `findings` is `[]` with no
  `already`. The repeat answers `already: true`. Then confirm by `fetch` the id `files01.files.open_share`: the same 404 as an invented id.
- Server: no `opsFindings` entry; `opsDiscovered.services` has `files01.files`; exactly one `service_checked` row.

## Earned secrets

None: nothing in this scenario is typed. The credential `archivist_login` is never obtainable, on purpose.

## Expected validator output

`ruby scripts/validate_scenario.rb scenarios/test_ops_findings/scenario.json.erb` (with `LANG=C.UTF-8`) reports 0 errors and 0 warnings:
no weakness has `grants` or `needs.session`, no `needs.global` is used (so no soft-gate warning), and every service on the network has a
way to be checked. The generic suggestions of a small test scenario and the identity and network reach info lines follow.
