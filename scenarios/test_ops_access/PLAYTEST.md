# test_ops_access: scripted playtest (core stage S3, feature N15)

The feature scenario for ops core stage S3 (`docs/achitechture/OPS_CORE_PLAN.md`, sections 4.3, 5.4, 5.5, 11.4, beat table
"`test_ops_access` (S3)", and the S3 line of 11.5). One run (beats 1 to 18) in one game, then a second short run (beat 19,
the first beats of the three older network playtests, in the same browser). About 60 minutes. One numbered beat below per row of the plan's table;
each says what to click, what the browser should receive and what the server should record. After every beat check the screen,
the server's record and what reached the browser.

The scenario is for testing, not play. No sign, task title or brief names a host, product, version, class or summary: those strings
reach the browser only from `GET /network`, `POST /network/scan`, `/network/check` and `/network/confirm`, and the card's works-on line only
once a card is held (`techniques` on `GET /network`). The world documents (`maint_log` on the lobby desk) say in plain words what is wrong with
which machine; the engine does not link them to the findings.

**Not played in the browser.** No beat here sends a forged or hand-built state sync from the page. The Rails tests make those checks
(`test/controllers/break_escape/network_technique_hostile_test.rb` and `network_ops_state_delta_test.rb`); the three hostile requests of the plan's
beat 10 that use real routes (a foothold that holds no session, a folder with no route, a card that is not held) are sent here by `fetch` because they are
ordinary requests.

## Setup

Keyless server on a free port (never :3000, :3085 or :3086). In a container set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`
and pass `--headless`. The scenario has no Mission row until it is seeded after landing, so `new-game.rb` cannot find it: make the game
with `swap-scenario-game.rb` (host scenario `test_access_signin`). Do not use `new-game.sh`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_access   # prints GAME_ID=
S=<scratchpad>/test_ops_access
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/responses-<game_id>.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
tools/playtest/cmd.sh <game_id> '{"cmd":"eval","fn":"() => window.__test.throttleFps(20)"}'
```

The checks after every beat (the first two read the server's record, the third the responses file). A session resumed in a new browser
writes a new capture file: give the leak check EVERY capture file of the game, oldest first, in one run (a resumed file judged alone reports
false findings, see the header of `tools/playtest/access-leak-check.rb`). `--access` and `--ops-log` are two commands; the script takes one at a time:

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --ops-log
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/responses-<game_id>.jsonl [$S/responses-<game_id>-2.jsonl ...]
```

`--access` prints the `opsDiscovered`, `opsFindings` and `opsUsed` lines and each session with its level and `granted by` finding; `--ops-log`
prints the `access_audit` rows and exits 1 on a stored secret. The leak check must report no leaks after every beat. A card's registry key,
name and summary are not secret once the card is held; before that the `techniques` map must not appear (beat 1 asserts it).
Until 13b's collector entries land the leak check does not judge the new strings (techniques, grants); read the raw answers for the words
`grants`, `fixedIf`, `technique_card` and `realism` too (they must appear in no `GET /network`, scan, check, confirm or technique answer).

## Layout

- `lobby` (start): the drop box `kit_dropbox` and a spare `kit_dropbox_2`; the wall ports `office_port` (network `office_lan`, foothold `jack_office_port`) and
  `annex_port` (same network, foothold `jack_annex_port`); the wall switch `share_switch` (sets the global `share_locked`); the cabinet `lobby_cabinet`
  (not locked) holding the card `card_factory` ("Field note: factory accounts"); the desk log `maint_log`; the sign `sign_lobby`; Ian (`ian`, role it, creds
  `iokafor`, holds the card `card_release` and gives it in conversation; his mappings tick the six tasks).
- `supply_room` (west, open): `supply_cupboard` holding `printer_manual` ("Printer manual", the item the printer finding needs); `supply_drawer` holding
  `card_config` ("Field note: reviewing settings", class misconfig) and `card_older` ("Field note: storage updates (earlier)", right product, earlier version).
- `comms_room` (north, open): `files01` (headless sign-in file server, remote sign-in allowed, policy `managed`) and `vault01` (headless, policy `sealed`:
  remote sign-in blocked).
- `back_office` (east, open): `desk01` (a PC with a screen, remote sign-in allowed, loginPicker accounts), the note `desk_note` (holds the `iokafor` login),
  the device `desk_implant` ("Keystroke injector") and its socket `desk_dock` ("USB socket by the desk PC").
- Not in any room: `printer01` (`print`; `admin_page` with weakness `factory_login`, class default creds, needs the item `printer_manual`, grants the
  credential `print_admin` (a saved connection to `files01`), and decoy `old_banner`) and, on the second network `plant_lan` (linked to `office_lan`),
  `pumpctl01` (one service, nothing to find).
- Findings (ids `<host>.<service>.<id>`), seven, in the order this script checks them: `f1` `printer01.admin_page.factory_login`, `f2` `...old_banner`
  (the decoy), `f3` `files01.files.open_share` (class misconfig, `fixedIf share_locked`, grants a user session as Ian), `f4` `files01.backup.backup_list` (cleartext,
  `fixedIf share_locked`, grants nothing: "the spare"), `f5` `vault01.archive.old_release` (unpatched, grants a user session), `f6` `vault01.archive.old_release_admin`
  (unpatched, needs the user session, grants admin), `f7` `desk01.remote_desk.shipped_login` (default creds, grants a user session). Read aliases from the screen;
  use these only if the check order below was followed.
- Cards (the registry `techniques` and the items that carry each): `factory_accounts` (class default_creds, on `card_factory`), `release_notes` (class unpatched,
  product of `vault01`'s service, version 3.1, on `card_release`), `older_release_notes` (same product, version 2.4, on `card_older`), `config_review` (class
  misconfig, on `card_config`). Which card fits which finding is in the server only; the panel never says.
- The log source `access_audit` takes `network_swept`, `host_scanned`, `service_checked`, `finding_confirmed`, `technique_refused` and `technique_used`.

## Harness notes

- **The jacks ask first** (`gameConfirm`): answer the plant prompt with `{"cmd":"dismiss","label":"Plug it in"}`. A planted jack opens the box's network view with an
  Unplug button (`[data-unplug]`). **Taking the box.** `{"cmd":"moveToNear","id":"kit_dropbox"}` then `{"cmd":"interact","id":"kit_dropbox"}`. A second device the same way
  from `kit_dropbox_2`, planted in `annex_port` (beat 10).
- **The view** is the minigame `network-view`. Read it with `{"cmd":"mg","action":"getState"}` (its `getTestState()`): `footholdId`, `status`, `rows` (each row's `id`,
  `scanned`, `services`, `scan`, `checks`, `findings` with each finding's `select`/`confirm` selector, and, once a session is held, `bolt: true` and `access: "admin"`),
  `pending`, and from this stage `techniques [{ id, name, summary, worksOn, itemId, selected, select }]`, `selectedFinding`, `selectedTechnique`, `use`, `canUse`,
  `grant { hostId, who, access? }` (all in `docs/test-bridge.md`, "Network view state"). Controls: Sweep `[data-network-id="office_lan"] [data-action="sweep"]`; Scan
  `[data-host-id="<id>"] [data-action="scan"]`; Check `[data-host-id="<id>"] [data-service="<name>"] [data-action="check"]`; Confirm `[data-finding="<alias>"] [data-action="confirm"]`;
  select a finding `[data-finding="<alias>"] [data-action="select-finding"]`; select a card `[data-technique="<card id>"] [data-action="select-technique"]`; Use `[data-techniques] [data-action="use"]`;
  a host row's Open `[data-host-id="<id>"] [data-action="open"]`. Use the selector the state names when it is there. A refusal shows on the view as a notice line
  with the words from `REFUSAL_TEXT` (`ops-model.js`): `not_confirmed` "That finding has not been confirmed yet.", `false_positive` "That finding turned out to be false.",
  `wrong_class` "That technique does not work on this kind of weakness.", `wrong_version` "That technique does not work on this version.", `need_unmet` "Something this needs is
  still missing." plus " Missing: Printer manual", `no_grant` "That finding gives nothing to use.", `fixed` "That weakness has been fixed.". Read the notice text with `eval` on the page
  (the view's `.network-notice`-style line near the Techniques panel) and compare it with these strings; if the class name differs, search the view for the string.
- **With the view closed** read the last answer the client fetched: `{"cmd":"eval","fn":"() => window.__test.access.networkView('jack_office_port')"}`.
- **The marks.** `{"cmd":"eval","fn":"() => window.__test.access.compromiseMarks()"}` lists `[{ objectId, sources: [{ kind, footholdId }], tint }]`. (This call is in
  `public/break_escape/js/systems/test-bridge/access.js`, `compromiseMarks()`; `docs/test-bridge.md` has no row for it yet: the docs step adds it.) Sessions:
  `__test.access.sessions()`; footholds: `__test.access.footholds()`.
- **The tray and the toasts.** `{"cmd":"eval","fn":"() => window.__test.getState().inventory"}` lists `{ id, name, type }`; the pickup toast is read with `{"cmd":"toasts"}`.
- **The keyring** is read by `fetch` of `GET /break_escape/games/<id>/keyring` from the page (CSRF token as below, so the capture records it): `entries[].id`. Before beat 6 it holds no
  `print_admin`.
- **Hostile requests** are sent from the page with `eval` and `fetch`, carrying the CSRF token (`document.querySelector('meta[name=csrf-token]').content`) in an `X-CSRF-Token`
  header, as JSON, so the capture records them. Routes: `POST /break_escape/games/<id>/network/technique` with `{ foothold, finding_id, item_id }` (the built finding id, never the alias;
  the card item id), `GET /break_escape/games/<id>/container/<pc id>?foothold=<id>`.
- **Picking up.** Cabinet or cupboard: `{"cmd":"moveToNear","id":"lobby_cabinet"}`, `{"cmd":"interact","id":"lobby_cabinet"}`, then `{"cmd":"mg","action":"take","args":["Field note: factory accounts"]}`
  and `{"cmd":"mg","action":"close"}`. The supply room is west of the lobby (`enterRoom`, or `moveToNear` on `supply_cupboard`). The manual goes into the notes, not the tray.
- **Ian's card.** `{"cmd":"moveToNear","id":"ian"}`, `{"cmd":"interact","id":"ian"}`, then choose "Do you have any notes on the storage machines?" (`{"cmd":"mg","action":"chooseMatching","args":["notes on the storage"]}`).
  The tray then holds `card_release`.
- **After a click** wait for `pending` to go away (about a second); the view refetches itself after every ops answer.
- **Reload.** `{"cmd":"sync"}`, then `{"cmd":"eval","fn":"() => { location.reload(); return true; }"}`, wait about 15 s, then `{"cmd":"bootstrap","tutorial":"decline","resume":"resume"}`.
- **Real keys.** `window.__test.pressKey` and `mg pressKey` send synthetic key events: they do not press a focused button. Beat 3a (keyboard alone) needs the browser's own
  keyboard (Playwright `page.keyboard`), which `cmd.sh` does not expose; see 3a.

## Beats (one run, one game)

### 1. Take the first card, plant, sweep, scan and check everything

Read `sign_lobby` and `maint_log`. Open `lobby_cabinet` and take `card_factory` (harness notes). Then take the box, plant it in `office_port` (`Plug it in`), click Sweep on `office_lan`, then Scan on
`printer01`, `files01`, `vault01` and `desk01`, then Check on `printer01`'s `admin_page`, `files01`'s `files` then `backup`, `vault01`'s `archive` and `desk01`'s `remote_desk` (this order).
- Browser: the pickup shows a toast naming the card, and `getState().inventory` lists `{ id: "card_factory", type: "technique_card" }` (the tray slot). The Techniques panel lists only the card
  held so far: "Factory accounts", its summary ("Devices often ship with a published account that nobody changes.") and a works-on line naming the class only; `techniques` in the state has one entry,
  `factory_accounts`, `itemId: "card_factory"`. Before the pickup `access.networkView(...)` has no `techniques` key. Seven findings in all, every one `unconfirmed`, with the same keys
  (no `needs`, `reason` or `fixed`). `compromiseMarks()` lists the jack: `office_port`, sources `[{ kind: "jack", footholdId: "jack_office_port" }]`, a `tint` value; the sprite is tinted with the
  bolt (screenshot). Tasks `a1_swept`, `a2_scanned`, `a3_checked` tick.
- Server: `opsDiscovered` holds `office_lan`, the four hosts and five services; `opsFindings` holds seven `u<n>` entries; one `network_swept`, four `host_scanned`, five `service_checked` rows.

### 2. A card on an unconfirmed finding

Select `f1` (select-finding) and the factory card, click Use.
- Browser: the notice reads "That finding has not been confirmed yet."; no session, no keyring change; the Use control comes back. A 422 body `{"success":false,"reason":"not_confirmed"}`.
- Server: one `technique_refused` row (reason `not_confirmed`, technique `factory_accounts`); nothing else changed.

### 3. Confirm all seven, then the decoy

Click Confirm on `f1` to `f7`, then use the factory card on `f2`.
- Browser: statuses: `f2` `false` (with its reason), the other six `confirmed`; `f1` lists the need "Printer manual" unmet, `f6` the need for a session (label "Vault server" is the host label) unmet. Use on `f2`: "That finding turned out to be false." (422 `false_positive`). Task `a4_confirmed`, `a5_refused` tick.
- Server: seven `finding_confirmed` rows; a second `technique_refused` row (`false_positive`).

### 3a. Select then Use by keyboard alone (needs the browser's own keyboard)

With the view open and nothing picked, Tab to the finding alias buttons: focus `f1`'s alias button (`select-finding`), press Space or Enter; Tab to the card button, press Enter; Tab to Use, press Enter. Do this
with a real keyboard (Playwright `page.keyboard.press("Tab")`, `"Enter"`) in a one-off script against the same server; the session command set has no real-key command. It must reach the same refusal as beat 2 (now `need_unmet`
for `f1`, since `f1` is confirmed). Focus must stay on the Use button after the answer, and the notice be announced in text. The scripted tester may instead point at `techniques[].select`, `findings[].select` and `use` (the selectors
the state names) with `clickSelector`, which covers the same handlers but not the key path; say which was done.

### 4. The drawer's cards on `vault01`'s first weakness

Take `card_config` and `card_older` from `supply_drawer`. Select `f5` and each card in turn, Use.
- Browser: the panel now lists three cards, each with its works-on line (`config_review`: class only; `older_release_notes`: class, product and the version list). `config_review` on `f5`: "That technique does not work on this kind of weakness." (`wrong_class`); `older_release_notes` on `f5`: "That technique does not work on this version." (`wrong_version`).
- Server: two more `technique_refused` rows (details differ).

### 5. The printer without the manual

Select `f1` and the factory card, Use.
- Browser: 422 `need_unmet` with `need: { kind: "item", label: "Printer manual" }`; the notice reads "Something this needs is still missing. Missing: Printer manual".
- Server: one more `technique_refused` row; the keyring answer still holds no `print_admin`.

### 5a. Every held card on the spare

Select `f4` ("The list of backups can be read without signing in.", grants nothing). Use the factory, config and older cards on it in turn, then the factory card once more.
- Browser: "That finding gives nothing to use." each time (422 `no_grant`), the repeat the same.
- Server: one `technique_refused` row per card (`technique` differs), the repeat merged into its row's count (`n` 2); a use sends no more than ten refusals in all, so every row is saved. No session in `--access`.

### 6. The credential grant, and a repeat

Take `printer_manual` from `supply_cupboard`, reopen the view (the need ticks, no reload). Select `f1` and the factory card, Use; then Use again.
- Browser: the notice or toast names the credential grant (a saved connection); `fetch GET /keyring` now lists `print_admin`, which the answer in beat 5 did not. The repeat answers `already: true` and `keyringChanged: false` (no new keyring ask). Task `a6_used` ticks and Ian's global `technique_used_seen` is set.
- Server: `opsUsed` holds `printer01.admin_page.factory_login` once; one `technique_used` row for the grant, the repeat merged (`n` 2); `--access` lists the line `opsUsed: f1 printer01.admin_page.factory_login`.

### 7. Open the saved connection

In the view, open `files01` (its row's sign-in control, `[data-host-id="files01"] [data-action="sign-in"]`, which lists the saved connection `print_admin`) and connect; if the control is not there, the same request
`POST /login` with `{ pc_id: "files01", credential: "print_admin", foothold: "jack_office_port" }`.
- Browser: the `files01` desktop opens (headless server, so through the foothold), as the account `iokafor`; close it with its own Close.
- Server: `sessions.files01` is `via credential` with the foothold.

### 8. Remote sign-in to `vault01`

In the view, `vault01`'s row offers no sign-in or Open (its host allows no remote sign-in, no session yet). Request it from the page:
`POST /login` `{ pc_id: "vault01", username: "iokafor", password: "Dockyard-Ian-41", foothold: "jack_office_port" }`.
- Browser: the row shows "Remote sign-in off" (state `action: "off"`); the request answers 422 with `remoteBlocked: true`.
- Server: no `vault01` session, no new log row.

### 9. Ian's card, and the blocked host's desktop

Talk to Ian and take the storage notes (harness notes). Select `f5` and "Release notes: current build", Use.
- Browser: success, and the `vault01` desktop opens at once from the Use control, in the red remote-view frame (`.pc-monitor-screen.desktop-frame--remote-view`; screenshot) with the line "Remote view: Ian Okafor through ..." (`.desktop-remote-view-line`) and the short stepped wipe,
  no sign-in screen. The row for `vault01` shows the bolt (`bolt: true`) and, being user level, no `access`. Use again: `already: true`, no second session. Close the desktop with its own Close.
- Server: `sessions.vault01`: `via technique`, foothold `jack_office_port`, `access user`, `granted by` `vault01.archive.old_release`; `signedInPcs` holds `vault01`; one `technique_used` row as the account `iokafor` (the repeat merged).

### 10. A second foothold, and the hostile requests

Take `kit_dropbox_2`, plant it in `annex_port`, open that view. Then by `fetch`: `GET /container/vault01?foothold=jack_annex_port`, `GET /container/vault01_folder` (a name with no route), and `POST /network/technique`
with `item_id: "card_not_held"`.
- Browser: the annex view's `vault01` row has no session and no Open control; the two desktop requests answer 403 `unreachable` and the folder one 404 (or 403); the technique request answers `{"success":false,"reason":"not_found"}` (404).
- Server: nothing changed (compare `--access` before and after).

### 10a. `desk01`

From the office view select `f7` and the factory card, Use. The grant succeeds; close the desktop it opens. Walk to `desk01` (`moveToNear`), look at the sprite, `interact` `desk01`, close that desktop. Then, standing beside `desk01`, request its desktop with no route:
`GET /container/desk01`.
- Browser: `compromiseMarks()` lists `desk01` (kind `technique`, foothold `jack_office_port`) and `desk01` is drawn tinted with the bolt at its top right while its screen keeps the locked look (screenshot); the click opens the remote view through the office foothold with the red frame, the line "Remote view: Ian Okafor through <the box's name>" and the wipe, and no sign-in screen; closing returns the player to the room. The no-route request answers the desktop as the account.
- Server: `sessions.desk01` a technique session through `jack_office_port`, its foothold kept after both opens.

### 11. The step up

Select `f6` and "Release notes: current build", Use.
- Browser: success; the `vault01` row and the answer now carry `access: "admin"` (an admin tag on the row; `rows[].access === "admin"` in the state). Before `f5`'s session this card would have answered `need_unmet`; it is met now.
- Server: the `vault01` record replaced: `access admin`, same foothold, `granted by` `...old_release_admin`; a `technique_used` row with `access admin`.

### 12. The plant network

Open the view.
- Browser: a `plant_lan` block appears, reached through `vault01` (its `via` names the host); sweep it (Sweep on `plant_lan`): `pumpctl01` is listed.
- Server: `opsDiscovered.networks` holds `plant_lan`; one more `network_swept` row.

### 13. Locking the session

In the world or through the taskbar try to lock the `vault01` session (the lock control, if offered; otherwise `fetch POST /lock_session` with `{ pc_id: "vault01" }`).
- Browser: refused (422). Server: unchanged.

### 14. Reload

Reload (harness notes), reopen the view.
- Browser: sessions, findings with the same aliases, cards, the keyring entry and the `vault01` admin level are as before; `compromiseMarks()` as before the reload. Server: unchanged.

### 15. The switch

`interact` `share_switch` (hint "The open share on the storage machine is switched off."), `sync`, reopen the view. Select `f3` and "Reviewing settings"'s card (`card_config`), Use; then `f4` with any card, Use.
- Browser: `f3` and `f4` now show Fixed. The first use answers "That weakness has been fixed." (422 `fixed`), the second "That finding gives nothing to use." (`no_grant`, because that check comes before `fixed`). The `vault01` session still opens (Open on its row).
- Server: two more `technique_refused` rows only.

### 16. Unplug

Close any open desktop with its own Close (the unplug control cannot be reached while one is open). Open the office view and click Unplug (`[data-unplug]`, answer the prompt `Unplug it`).
- Browser: the `vault01`, `files01` and `desk01` sessions end, `plant_lan` is gone, the marks on the jack and on `desk01` are gone (`compromiseMarks()` empty; the sprite tint cleared, screenshot) and the `vault01` row bolt too. A desktop request `GET /container/vault01?foothold=jack_office_port` answers 403 `no_session`.
- Server: sessions gone; `opsUsed` and the keyring entry kept.

### 17. Plant again

Plant the box again and open the view (it shows the findings as before). Select `f5` and the release card, Use.
- Browser: the session again, the desktop opens. Server: a new `vault01` record.

### 17a. Taskbar, sign out, the typed sign-in, the implant

Use the factory card on `f7` again and click `desk01`; read the taskbar. Open the `vault01` remote view from the view and read its taskbar. Back at `desk01`, click it to open the remote view, then choose Sign out (`#desktop-sign-out`).
Click `desk01` again and sign in with the password from `desk_note` (`iokafor` / the note's text). Take `desk_implant`, `interact` `desk_dock`, answer `Plug it in`.
- Browser: `desk01`'s taskbar offers Sign out and Switch user (`#desktop-switch-user`); `vault01`'s offers Sign out only (blocked host). After Sign out the mark comes off (`compromiseMarks()` no longer lists `desk01`) and the next click shows the sign-in screen; the typed sign-in opens the keyboard desktop with no red frame; the implant is accepted and `desk01` is marked again, `compromiseMarks()` naming the implant foothold (`implant_desk01`) in `sources`.
- Server: `sessions.desk01` a technique session, then gone, then a `password` session with no foothold; an implant foothold `implant_desk01`.

### 18. End of run

`{"cmd":"sync"}`, the leak check over every capture file of the game, then `verify-run.rb <game_id> --access` and `--ops-log` as two commands, then measure the answer at full discovery:
`fetch GET /network?foothold=jack_office_port` and read its byte length (`new Blob([text]).size`).
- No `grants`, `fixedIf`, `technique_card` or `realism` key in any answer; the `techniques` map only after a card is held; the answer under 16 KB. `--ops-log` ends with `ops log OK`, and shows one `technique_refused` row per distinct refusal of beats 2 to 5a and 15.
- Server `--access`: the `opsUsed` line lists `printer01.admin_page.factory_login`, `vault01.archive.old_release`, `vault01.archive.old_release_admin` and `desk01.remote_desk.shipped_login`.

### 19. The three older network playtests, first beats

In the same browser (a fresh game each, made with `new-game.rb` or `swap-scenario-game.rb`): run the first beats of `scenarios/test_ops_scan/PLAYTEST.md`, `scenarios/test_ops_findings/PLAYTEST.md` and
`scenarios/test_access_networks/PLAYTEST.md`. The unchanged view must still load, plant and act on an old scenario (no Techniques panel, no `techniques` key, no bolt anywhere).

## Earned secrets

`iokafor`'s password `Dockyard-Ian-41` is typed in beat 17a, from `desk_note`, after the sign-out. It is also sent in beat 8 to prove the refusal; the leak check treats it as the account's secret.

## Expected validator output

`ruby scripts/validate_scenario.rb scenarios/test_ops_access/scenario.json.erb` (with `LANG=C.UTF-8`): 0 errors and two warnings, both intended: `backup_list` "grants nothing, so a technique card used on it is refused with no_grant" (the report-only
finding, on purpose), and `open_share` "`fixedIf` is the only thing before the grant" (the plan's own example; the switch's global is the gate the beats test). The generic suggestions of a small test scenario and the identity and network reach info lines follow.
