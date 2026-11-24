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

**Not played in the browser.** No beat here sends a forged, hand-built or replayed request or state sync from the page (S3 R2 ruling N-13-3): every beat uses the
real controls and reads what the client shows. The hostile and refusal checks (a foothold that holds no session, a folder with no route, a card not held, a sign-in
request to a blocked host, the same desktop request after the unplug, a forged state sync) are made by the Rails tests `test/controllers/break_escape/network_technique_hostile_test.rb`,
`network_technique_blocked_host_test.rb`, `network_technique_session_test.rb` and `network_ops_state_delta_test.rb`.

**Plan 11.5 (S3) clauses.** Each is shown by a real control in a beat below, except one: "the same desktop request then refused (`no_session`)" is shown here only as
the view (the host row has no Open and no bolt after the unplug, beats 16 and 17) and the world click (it asks for the keyboard sign-in), and the request itself is
`network_technique_session_test.rb` ("the unplug ends the session and the same desktop request answers no_session"). Two clauses have no beat: the screenshot review of the view's
states (a later step, for the user) and the plan's `:3002` note.

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

Name the files one by one, oldest first (the first file has no suffix): a glob such as `responses-<game_id>*.jsonl` sorts `-2` before the first file and reports every earlier sweep and scan as a leak (S3 PL7); the script now refuses files out of order (exit 2).

`--access` prints the `opsDiscovered`, `opsFindings` and `opsUsed` lines and each session with its level and `granted by` finding; `--ops-log`
prints the `access_audit` rows and exits 1 on a stored secret. The leak check must report no leaks after every beat. A card's registry key,
name and summary are not secret once the card is held; before that the `techniques` map must not appear (beat 1 asserts it).
The leak check judges the new strings (techniques, grants, session keys) per thing: the capture does not hold the technique request, so each grant is read from its answer, which here is enough (the one credential, and one session finding per host and level). Read the raw answers for the words
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
  `scanned`, `services`, `scan`, `checks`, `findings` with each finding's `select`/`confirm` selector (the state names a `select` selector even while no card is held, but the control is drawn, as a button, only while a card is held: with none the alias is a plain chip), and, once a session is held, `bolt: true` and `access: "admin"`),
  `pending`, and from this stage `techniques [{ id, name, summary, worksOn, itemId, selected, select }]`, `selectedFinding`, `selectedTechnique`, `use`, `canUse`,
  `grant { hostId, who, access? }` (all in `docs/test-bridge.md`, "Network view state"). Controls: Sweep `[data-network-id="office_lan"] [data-action="sweep"]`; Scan
  `[data-host-id="<id>"] [data-action="scan"]`; Check `[data-host-id="<id>"] [data-service="<name>"] [data-action="check"]`; Confirm `[data-finding="<alias>"] [data-action="confirm"]`;
  select a finding `[data-finding="<alias>"] [data-action="select-finding"]` (present only while a card is held); select a card `[data-technique="<card id>"] [data-action="select-technique"]`; Use `[data-techniques] [data-action="use"]`;
  a host row's Open `[data-host-id="<id>"] [data-action="open"]`. Use the selector the state names when it is there. A refusal shows on the view as a notice line
  with the words from `REFUSAL_TEXT` (`ops-model.js`): `not_confirmed` "That finding has not been confirmed yet.", `false_positive` "That finding turned out to be false.",
  `wrong_class` "That technique does not work on this kind of weakness.", `wrong_version` "That technique does not work on this version.", `need_unmet` "Something this needs is
  still missing." plus " Missing: Printer manual", `no_grant` "That finding gives nothing to use.", `fixed` "That weakness has been fixed.". Read the notice text with `eval` on the page
  (`document.querySelector('.network-view-notice').textContent`) and compare it with these strings.
- **With the view closed** read the last answer the client fetched: `{"cmd":"eval","fn":"() => window.__test.access.networkView('jack_office_port')"}`.
- **The marks.** `{"cmd":"eval","fn":"() => window.__test.access.compromiseMarks()"}` lists `[{ objectId, sources: [{ kind, footholdId }], tint }]`. (The call is in
  `public/break_escape/js/systems/test-bridge/access.js`, `compromiseMarks()`, and has its row in `docs/test-bridge.md`.) Sessions:
  `__test.access.sessions()`; footholds: `__test.access.footholds()`.
- **The tray, the take message and the toasts.** `{"cmd":"eval","fn":"() => window.__test.getState().inventory"}` lists `{ id, name, type }`. Taking an item out of a container (the cabinet, the drawer, the cupboard)
  raises no toast: the open container window says "Added <item name> to inventory" for three seconds in `.container-message` (`container-minigame.js` `takeItem` and `showMessage`), so screenshot and read it
  straight after the Take click (`{"cmd":"eval","fn":"() => document.querySelector('.container-message')?.textContent"}`). `{"cmd":"toasts"}` reads the game's toasts (the keyring's find toast in beat 6, a refusal toast); an empty list after a container take is right.
- **The keyring** has no screen of its own in this scenario (no capture log or keyring item is authored). The player sees it in two places: the toast the keyring raises when an entry is new (beat 6, read with `toasts`; the
  text names what was found), and the sign-in control of a PC, which lists each saved connection as a "Connect with ..." button (`.signin-cred`; beat 7). Before beat 6 that list has no `print_admin` entry.
  The client's own `GET /keyring` fetches are in the capture file, so the leak check judges them.
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
- Browser: the Take click shows "Added Field note: factory accounts to inventory" in the container window for three seconds (screenshot at once; no toast is raised for a container take), and `getState().inventory` lists `{ id: "card_factory", type: "technique_card" }` (the tray slot). The Techniques panel lists only the card
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
- Browser: statuses: `f2` `false` (with its reason), the other six `confirmed`; `f1` lists the need "Printer manual" unmet, `f6` the need for a session (its label is the PC's host label, "VAULT01"; the object's name "Vault server" is not shown) unmet. Use on `f2`: "That finding turned out to be false." (422 `false_positive`). Task `a4_confirmed`, `a5_refused` tick.
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
- Browser: the notice reads "That gave you a saved sign-in. It is in your keyring." and the keyring's find toast follows (read it with `toasts`, screenshot it); the keyring itself is shown by `files01`'s sign-in control, which now lists `print_admin` as a "Connect with ..." button: open that control from `files01`'s row and take a screenshot of the list (this is the keyring step; close the control with its back or close button without connecting, beat 7 connects). The repeat answers `already: true` and `keyringChanged: false` (no new keyring ask). Task `a6_used` ticks and Ian's global `technique_used_seen` is set.
- Server: `opsUsed` holds `printer01.admin_page.factory_login` once; one `technique_used` row for the grant, the repeat merged (`n` 2); `--access` lists the line `opsUsed: f1 printer01.admin_page.factory_login`.

### 7. Open the saved connection

In the view, open `files01` (its row's sign-in control, `[data-host-id="files01"] [data-action="sign-in"]`, which lists the saved connection `print_admin`) and connect with the "Connect with ..." button (`.signin-cred`, `mg clickText "Connect with"`). Do not use the sign-in form's plain Sign in button: with the saved account picked it asks for a typed password ("Enter the password."), because the connection is a separate control and nothing was typed. If the control is not there, that is a finding: report it.
- Browser: the `files01` desktop opens (headless server, so through the foothold), as the account `iokafor`; close it with its own Close.
- Server: `sessions.files01` is `via credential` with the foothold.

### 8. Remote sign-in to `vault01`

In the view, read `vault01`'s row: it offers no sign-in or Open (its host allows no remote sign-in, no session yet). Nothing is sent by hand; the refused sign-in request
(`remoteBlocked: true`) is `network_technique_blocked_host_test.rb`.
- Browser: the row shows "Remote sign-in off" (state `action: "off"`) and no sign-in control.
- Server: no `vault01` session, no new log row.

### 9. Ian's card, and the blocked host's desktop

Talk to Ian and take the storage notes (harness notes). Select `f5` and "Release notes: current build", Use.
- Browser: success, and the `vault01` desktop opens at once from the Use control, in the red remote-view frame (`.pc-monitor-screen.desktop-frame--remote-view`; screenshot) with the line "Remote view: Ian Okafor through ..." (`.desktop-remote-view-line`) and the short stepped wipe,
  no sign-in screen. The row for `vault01` shows the bolt (`bolt: true`) and, being user level, no `access`. Use again: `already: true`, no second session. Close the desktop with its own Close.
- Server: `sessions.vault01`: `via technique`, foothold `jack_office_port`, `access user`, `granted by` `vault01.archive.old_release`; `signedInPcs` holds `vault01`; one `technique_used` row as the account `iokafor` (the repeat merged).

### 10. A second foothold

Take `kit_dropbox_2`, plant it in `annex_port`, open that view. Nothing is sent by hand (the hostile requests are the Rails tests named at the top).
- Browser: the annex view's `vault01` row has no session, no bolt and no Open control (it is seen in this view, not by a request), while the office view still shows the session and Open.
- Server: nothing changed (compare `--access` before and after).

### 10a. `desk01`

From the office view select `f7` and the factory card, Use. The grant succeeds; close the desktop it opens. Walk to `desk01` (`moveToNear`), look at the sprite, `interact` `desk01`, close that desktop.
- Browser: `compromiseMarks()` lists `desk01` (kind `technique`, foothold `jack_office_port`) and `desk01` is drawn tinted with the bolt at its top right while its screen keeps the locked look (screenshot); the click opens the remote view through the office foothold with the red frame, the line "Remote view: Ian Okafor through <the box's name>" and the wipe, and no sign-in screen; closing returns the player to the room.
- Server: `sessions.desk01` a technique session through `jack_office_port`, its foothold kept after both opens.

### 11. The step up

Select `f6` and "Release notes: current build", Use.
- Browser: success; the `vault01` row and the answer now carry `access: "admin"` (an admin tag on the row; `rows[].access === "admin"` in the state). Before `f5`'s session this card would have answered `need_unmet`; it is met now.
- Server: the `vault01` record replaced: `access admin`, same foothold, `granted by` `...old_release_admin`; a `technique_used` row with `access admin`.

### 12. The plant network

Open the view.
- Browser: a `plant_lan` block appears, reached through one of the PCs the player holds a session on in `office_lan` (the block's header names it: "Plant network, through <host>"; the server picks the held session with the lowest sequence number, then the lowest host id, so with sessions on `desk01`, `files01` and `vault01` the proof run read DESK01; any of the three is right, `vault01` is not special, since all four hosts are on `office_lan`); sweep it (Sweep on `plant_lan`): `pumpctl01` is listed.
- Server: `opsDiscovered.networks` holds `plant_lan`; one more `network_swept` row.

### 13. Locking the session

A player locks a session through the desktop's Start menu: `Start` (`.pc-start-btn`) opens a panel whose actions are `Lock` (`#pc-start-lock`), `Switch user` (`#pc-start-switch`) and `Sign out` (`#pc-start-signout`). Lock is offered only
for a session the player could unlock again: a password sign-in, or a credential session over a foothold (`sessionLockable`, `pc-sessions.js:176`; the server's `session_lockable?` is the authority). A technique session is neither, by design
(plan 5.4, "How a technique session differs from a password session": "Lock the session: refused with no code change"; the table of readers: "not lockable, on both sides"), so its desktop has no Lock control at all.
Open the `vault01` remote view (the Open control on its row), click Start and read the actions.
- Browser: the panel offers `Sign out` (`#pc-start-signout`) and nothing else: no `#pc-start-lock`, and no `#pc-start-switch` either (`vault01` blocks remote sign-in, so Switch user is withheld too; `desk01`'s Start, beat 17a, offers Switch user and Sign out). Screenshot the open panel. Close the panel and the desktop with their own controls. Nothing is sent.
- Contrast, for the same beat if time allows or at beat 17a: after the typed sign-in at `desk01` the Start panel of that password session does list `#pc-start-lock`. A refused lock request itself is `network_technique_session_test.rb`.
- Server: unchanged.

### 14. Reload

Reload (harness notes), reopen the view.
- Browser: sessions, findings with the same aliases, cards, the keyring entry and the `vault01` admin level are as before; `compromiseMarks()` as before the reload. Server: unchanged.

### 15. The switch

`interact` `share_switch` (hint "The open share on the storage machine is switched off."), `sync`, reopen the view. Select `f3` and "Reviewing settings"'s card (`card_config`), Use; then `f4` with any card, Use.
- Browser: `f3` and `f4` now show Fixed. The first use answers "That weakness has been fixed." (422 `fixed`), the second "That finding gives nothing to use." (`no_grant`, because that check comes before `fixed`). The `vault01` session still opens (Open on its row).
- Server: two more `technique_refused` rows only.

### 16. Unplug

Close any open desktop with its own Close (the unplug control cannot be reached while one is open). Open the office view and click Unplug (`[data-unplug]`, the button's label is `Unplug`). There is no prompt to answer, unlike the plant (`gameConfirm`): the jack goes at once and a toast says "Unplugged. Your sessions on ... ended." (read it with `toasts`); do not wait for or dismiss a dialog.
- Browser: the `vault01`, `files01` and `desk01` sessions end, `plant_lan` is gone, the marks on the jack and on `desk01` are gone (`compromiseMarks()` empty; the sprite tint cleared, screenshot) and the `vault01` row bolt too. A click on `desk01` in the world no longer opens a remote view: it asks for the keyboard sign-in (the `no_session` request itself is a Rails test).
- Server: sessions gone; `opsUsed` and the keyring entry kept.

### 17. Plant again

Plant the box again (`Plug it in`); the plant does not open the view by itself, so `interact` `office_port` to open it (it shows the findings as before). Select `f5` and the release card, Use.
- Browser: before the Use, `vault01`'s row has no bolt, no session and no Open (the unplug ended it: the view form of the refused desktop request); after it the session is back and the desktop opens. Server: a new `vault01` record.

### 17a. Taskbar, sign out, the typed sign-in, the implant

Use the factory card on `f7` again and click `desk01`; read the taskbar. Open the `vault01` remote view from the view and read its taskbar. Back at `desk01`, click it to open the remote view, then open Start (`.pc-start-btn`) and choose Sign out (`#pc-start-signout`, inside the Start panel). That remote view was opened by a world click, so Sign out returns to the world (the room), not to the network view.
Click `desk01` again and sign in with the password from `desk_note` (`iokafor` / the note's text). Take `desk_implant`, `interact` `desk_dock`, answer `Plug it in`.
- Browser: `desk01`'s taskbar offers Sign out and Switch user (`#pc-start-switch`, in the Start panel; also `#pc-start-lock` after the typed sign-in, which is a password session); `vault01`'s offers Sign out only (blocked host). After Sign out of the `desk01` remote view the player is back in the world (no network view opens), the mark comes off (`compromiseMarks()` no longer lists `desk01`) and the next click shows the sign-in screen; the typed sign-in opens the keyboard desktop with no red frame; the implant is accepted and `desk01` is marked again, `compromiseMarks()` naming the implant foothold (`implant_desk01`) in `sources`.
- Server: `sessions.desk01` a technique session, then gone, then a `password` session with no foothold; an implant foothold `implant_desk01`.

### 18. End of run

`{"cmd":"sync"}`, the leak check over every capture file of the game, then `verify-run.rb <game_id> --access` and `--ops-log` as two commands, then measure the answer at full discovery: with the office view open,
`{"cmd":"eval","fn":"() => JSON.stringify(window.__test.access.networkView('jack_office_port')).length"}` (the length of the stored answer, no new request).
- No `grants`, `fixedIf`, `technique_card` or `realism` key in any answer; the `techniques` map only after a card is held; the answer under 16 KB. `--ops-log` ends with `ops log OK`, and shows one `technique_refused` row per distinct refusal of beats 2 to 5a and 15.
- Server `--access`: the `opsUsed` line lists `printer01.admin_page.factory_login`, `vault01.archive.old_release`, `vault01.archive.old_release_admin` and `desk01.remote_desk.shipped_login`.

### 19. Older network scenarios still work

In the same browser (a fresh game each, made with `new-game.rb` or `swap-scenario-game.rb`): rerun the first beats of two scenarios that PRE-DATE the ops core, `scenarios/test_access_networks/PLAYTEST.md` and
`scenarios/test_access_keyring/PLAYTEST.md`, and the network beats H5.15, H5.16 and H5.20 of `scenarios/lab_physical_pentest/PLAYTEST.md`. The unchanged view must still load, plant and act on an old scenario (no Techniques panel, no `techniques` key, no bolt anywhere, no Sweep or Check control). (`test_ops_scan` and `test_ops_findings` are ops scenarios themselves and are not this beat's evidence.)
In the container window the Copy menu is on a file's icon, and its feedback is an in-window line, not a toast.

## Earned secrets

`iokafor`'s password `Dockyard-Ian-41` is typed in beat 17a, from `desk_note`, after the sign-out. The leak check treats it as the account's secret; no beat sends it by hand.

## Expected validator output

`ruby scripts/validate_scenario.rb scenarios/test_ops_access/scenario.json.erb` (with `LANG=C.UTF-8`): 0 errors and two warnings, both intended: `backup_list` "grants nothing, so a technique card used on it is refused with no_grant" (the report-only
finding, on purpose), and `open_share` "`fixedIf` is the only thing before the grant" (the plan's own example; the switch's global is the gate the beats test). The generic suggestions of a small test scenario and the identity and network reach info lines follow.
