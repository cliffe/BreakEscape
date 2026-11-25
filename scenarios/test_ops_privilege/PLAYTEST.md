# test_ops_privilege: scripted playtest (privilege stages S5a, S5b and S5c, features A18 to A20)

The feature scenario for `docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md` stage S5a (its section 11 beat list, nine beats, plus the step-up
beats the build brief adds), then S5b and S5c (cached accounts, a stick at a governed port, a relayed administrator, shared, hardened and domain accounts: beats 12 to 25). One run in one game, beats 1 to 25 top to bottom (about 75 minutes in all, estimated from game 173's clock times; the waits are beat 5's four minutes and beat 16's two). Each beat says what to do, what the browser shows and what the server records.
The scenario is for testing, not play. It names no host, product, version, class or summary in any sign or task: those reach the browser only from
`GET /network`, scan, check and confirm answers.

**Not played in the browser.** No beat sends a forged, hand-built or replayed request (S3 R2 ruling N-13-3). Those checks are Rails tests:
`test/controllers/break_escape/ops_privilege_scenario_test.rb` (every beat below through the real routes, plus the lapsed-override refusals, a claim record
feeding the step up, and "a refused request writes nothing"), `ops_privilege_no_exposure_test.rb` (what no answer holds, a forged sync body),
`privilege_inventory_remove_test.rb`, `privilege_profile_read_test.rb`, `test/models/break_escape/admin_usb_test.rb`.
Three things have no browser beat, and why:
- **A claim feeding the step up** needs the PC's owner to walk away at a moment the script cannot force; the Rails test sets the claim record by hand.
- **A token session expiring** is shown in beat 6 only by waiting four REAL minutes from the plant of beat 5 (see the deadline there); the exact-second expiry is the Rails test's (`travel_to`).
- **A refused request leaves nothing behind** is read in the Rails test (state before and after); the browser only shows the toast.

## Setup

Keyless server on ports 3011 to 3013 (never :3000, :3085 or :3086). The scenario has no Mission row until it is seeded after landing, so `new-game.rb` cannot find
it: make the game with `swap-scenario-game.rb` (host scenario `test_access_signin`). Do not use `new-game.sh`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
PLAYTEST_PORT=3011 tools/playtest/start-keyless-server.sh
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_privilege   # prints GAME_ID=
S=<scratchpad>/test_ops_privilege
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/responses-<game_id>.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

Checks after the run (and after any beat that says so). A session resumed in a new browser writes a new capture file: give the leak check EVERY capture file of the
game, one by one, oldest first (the first file has no suffix; never a glob):

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --ops-log
```

`--access` prints each session with its stored `access` and its computed level word `level admin`, `level user`, `level none` (`level error` if the work raised). `--ops-log` prints the `priv_audit` rows and ends with `ops log OK`.

**The leak check needs each keyboard sign-in named.** The capture holds neither the request body nor a PC id in a keyboard sign-in answer (a remote sign-in carries its PC's host label, so it needs nothing). Where more than one PC admits the account
(here every sign-in PC admits several accounts) an unnamed keyboard sign-in earns nothing, and the check then reports the administrator's `access` and the owner's items as leaks (these are the check failing closed, not a game finding).
List the sign-ins and sign-outs of the run, oldest first, with the order each has among its kind (a remote sign-in is marked and needs no entry):

```bash
python3 -c '
import json,sys,collections
c=collections.Counter()
for f in sys.argv[1:]:
    for l in open(f):
        r=json.loads(l);b=r.get("body")
        if r.get("method")=="POST" and r.get("path","").endswith("/login") and isinstance(b,dict) and b.get("success"):
            c[b["npcId"]]+=1
            print(b["npcId"]+"#"+str(c[b["npcId"]]),"remote host "+b["host"] if b.get("host") else "KEYBOARD (name its PC)",r["t"])
        if r.get("method")=="POST" and r.get("path","").endswith("/logout") and isinstance(b,dict) and b.get("success"):
            c["LOGOUT"]+=1
            print("logout #"+str(c["LOGOUT"]),"(an answer never says which PC)",r["t"])
' $S/responses-<game_id>.jsonl [$S/responses-<game_id>-2.jsonl ...]
```

Then give every KEYBOARD line to the check, with the PC you signed in at (`bay_pc`, `store_pc`, `hot_desk`, `desk_a`, `desk_b` or `lab_pc`; the beats say where), after the game id and before the files. `n` counts EVERY successful sign-in answer of that account in the log, remote and relay ones included: in a run where Adel signs in at the keyboard, remotely with the token and again at the keyboard, the keyboard ones are `adel#1` and `adel#3`, not 1 and 2 (the printout above shows which). Name every keyboard sign-in, an ordinary account's too, at the PC it was really at. Example for a run with Uma's and Adel's keyboard sign-ins at `bay_pc`:

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> \
  --signin uma@bay_pc#1 --signin adel@bay_pc#1 --signin adel@bay_pc#2 --signin adel@bay_pc#5 \
  --logout adel@store_pc#5 \
  $S/responses-<game_id>.jsonl [$S/responses-<game_id>-2.jsonl ...]
```

That command (the entries as the listing shows them for a run played as written: Uma's and Adel's keyboard sign-ins are `uma#1`, `adel#1`, `adel#2` (the lock-screen unlock) and `adel#5`, the sign-out of `store_pc` is the fifth) gave 0 findings over the four capture files of the second real run (game 72: `test/fixtures/files/ops_privilege_run72_{1,2,3,4}.jsonl`, pinned by `access_leak_scanner_privilege_real_test.rb`). Your numbers differ if you sign in or out a different number of times: use the listing.

**Sign-outs.** A sign-out answer does not say which PC either, so the check takes it as ending EVERY PC's session (fail closed). That is right while one PC holds a session, and wrong when you sign out of one PC while an administrator session stays open at another: here, beat 10's sign-out of `store_pc` while Adel's keyboard session at `bay_pc` is still open (the next network answers show it). Name that one sign-out with `--logout <account>@<pc>#<n>` (n counts EVERY successful sign-out answer in the log, from 1; or `<account>@<pc>@<row time>`): the PC it was at and the account the run held there when it came (for the sign-out of `store_pc` after the step up, Adel, whose technique session is there). The sign-out then ends that PC only. It is an error (exit 2) if the entry matched no row, or the account was not held at that PC at that row (the row then ends every PC as before), or the next answer that lists that PC's session (a desktop, a `GET /network` host row, a reload's bootstrap) still shows that account there. Where no such answer follows, the name stands. Without it the check reports about 38 false findings after that row: the leak check cannot know the bay desk session went on.

Each entry is credited from its own row onward and for its own account only (`--signin <account>@<pc>@<row time>` names the row by its `t` instead). The check refuses (exit 2, with a message) an entry that names a PC the account is not admitted at, an unknown PC or account, a badly formed number or a repeated entry, and also an entry that matched no row (a typo, or a sign-in that did not happen): all are errors, never silence. A keyboard sign-in named at a PC whose desktop answer right after it shows the account somewhere else (a PC where the run held no session of that account) is an error (exit 2) too; where no such answer follows, the name stands. So name each sign-in where it was. The check also takes an earned step back at a sign-out, a lock, a later sign-in at that PC, a refused desktop, a reload or desktop answer or `GET /network` host row that no longer shows the session as the administrator's, and when a token's `expiresInS` has run out since its sign-in row. When you check after every beat, give only the entries for rows already in the files.
It cannot see a power cut or a dropped route between requests, unless a desktop answer, a `GET /network` host row or a reload comes before the leaking request.

## Layout

- `lobby` (start): the audit log terminal `audit_log_pc` (reads `priv_audit`); the drop box `kit_dropbox`; the wall port `office_port` (network `office_lan`, foothold `jack_office_port`); the cabinet `lobby_cabinet` (not locked) holding the card
  `card_stale` ("Field note: records updates") and the shared-screen code `assist_code` ("Uma assist code.txt"); the sign `sign_lobby`. Doors: north to `bay`, east to `store`.
- `bay` (north): `bay_pc` (a desk PC, host label BAY01, owner Olu, USB policy blocked, remote sign-in allowed); `bay_dock` ("USB socket by the bay PC", takes `kit_badusb`, a confirm
  whose grant needs a session at `bay_pc`); `bay_port` ("Stick port on the bay shelf", same policy, takes a USB stick through a confirm whose `remove_item` is first);
  `bay_breaker` ("Wall switch: bay power", turns the PC's service off) and `bay_breaker_on` ("Wall switch: bay power back on", turns it on again); the items `kit_badusb` ("Keystroke injector"), `kit_stick_a` and `kit_stick_b` (sticks); Olu Marsh (owner).
- `store` (east): `store_pc` ("Records PC", a desk PC, host label RECS01, remote sign-in allowed; one service with one weakness, a step up to admin, needing a user session); the notes
  `note_uma` and `note_adel` (the typed logins: the earned secrets); Uma Quayle (`uma`, user) and Adel Wick (`adel`, the administrator: `creds.admin`).
- `lobby` also holds `hot_desk` (host label HOT01, a sign-in PC, no owner, domain `northwind`), `sam_pc` (Sam Okoro's strict desk, `offWhen: sam_pc_off`), `sam_breaker` (his power switch) and the noticeboard `lobby_noticeboard`; `bay` also holds `bay_usb_port` and the pinboard `bay_pinboard`; `it_room` (south of `lobby`) holds `desk_a` (DESKA), `desk_b` (DESKB), `lab_pc` (LAB01), `it_rota_poster` and `ravi_note`. Beats 12 to 25 describe them.
- Accounts: Uma (`umaquay`), Adel (`adelwick`, administrator), Olu (`omarsh`, owner of the bay PC, never signs in). Profiles: `uma_files` ("Uma to do.txt"), `adel_files` ("Admin runbook.txt"),
  `olu_files` ("Olu notes.txt" and a folder "Olu projects" holding "Budget draft.txt"; the folder is an ordinary unlocked `folder` item, so one click opens it). `bay_pc` and `hot_desk` admit every staff account; `desk_a`, `desk_b` and `lab_pc` are IT only.
- Credentials: `adel_token` (a saved sign-in token for `bay_pc`, expires 4 REAL minutes after the drop box is first plugged in at `office_port`; a re-plant does not restart it; listed by the sign-in control over the foothold) and `uma_assist` (a
  shared-screen code for `store_pc`, from `assist_code`).
- The log source `priv_audit` takes `admin_profile_read` and `usb_install_overridden` (and the ops events).
- The one finding (`store_pc.records.stale_build`, id from the screen alias) is the step up; the card `field_release_notes` fits it.

## Harness notes

- **Sign-in screen and desktop:** as `scenarios/test_access_signin/PLAYTEST.md` "Harness notes": `interact` the PC, `{"cmd":"mg","action":"getState"}` has a `signIn` block with `tiles`; choose a tile
  with `{"cmd":"mg","action":"clickText","args":["Adel Wick"]}` and type the password with `{"cmd":"mg","action":"type","args":[0,"<password>",{"submit":true}]}`. Wait about 2 s for the desktop.
  The desktop's `getState` has `signedInAs` and `items`. Open a folder with `clickText` on its name. Start, Lock, Sign out: `.pc-start-btn`, `#pc-start-lock`, `#pc-start-signout`.
- **The marker:** the taskbar shows `span.pc-taskbar-admin` with the text "Administrator" beside the account name for an administrator session only. Read it with
  `{"cmd":"eval","fn":"() => document.querySelector('.pc-taskbar-admin')?.textContent ?? null"}`. The client's own levels: `{"cmd":"eval","fn":"() => window.__test.access.sessions()"}` lists
  `[{ pcId, npcId, username, displayName, via }]` (the call does not print the level; the marker and `verify-run` do).
- **Doors:** the ids of the doorways are listed by `{"cmd":"doorways"}`; `interact` on `door:bay->lobby` from the bay answers unknown-entity, so walk with `moveToNear` on an object of the next room (for example `audit_log_pc` for the lobby).
- **Items:** `moveToNear` then `interact` on `kit_badusb`, `kit_stick_a`, `kit_stick_b`; cabinet items: `interact` `lobby_cabinet`, then `{"cmd":"mg","action":"take","args":["Field note: records updates"]}`
  and `["Uma assist code.txt"]`, then `{"cmd":"mg","action":"close"}`. The tray: `{"cmd":"eval","fn":"() => window.__test.getState().inventory"}`. Toasts: `{"cmd":"toasts"}`.
- **Plugging in.** The drop box asks first: `{"cmd":"dismiss","label":"Plug it in"}`. The USB sockets (`bay_dock`, `bay_port`) ask the same way: `interact` the socket, then `dismiss` "Plug it in".
- **Network view:** as `scenarios/test_ops_access/PLAYTEST.md` "Harness notes" (Sweep `[data-network-id="office_lan"] [data-action="sweep"]`, Scan, Check, Confirm, the finding and card selectors named in `mg getState`).
- **Passwords** are typed from the notes (`note_uma`, `note_adel` in `store`); read each note first with `interact`.

## Beats (one run, one game)

### 1. An ordinary account sees only its own profile

Read `sign_lobby`. Walk north to `bay`. `interact` `bay_pc`, choose the Uma Quayle tile, type her password from `note_uma` (read it in `store` first, then come back), submit.
- Browser: the desktop opens; it lists only "Uma to do.txt"; the taskbar shows no `.pc-taskbar-admin` (the eval returns null). Sign out (`#pc-start-signout`) when done.
- Server: `--access` lists a `password` session at `bay_pc` for `uma`, no `access`; `--ops-log` has no `admin_profile_read` row.

### 2. The administrator sees the owner's profile, and the read is logged once

Sign in at `bay_pc` as Adel Wick (password from `note_adel`).
- Browser: the taskbar shows "Administrator"; the desktop lists "Admin runbook.txt", "Olu notes.txt" and the folder "Olu projects" and "Uma to do.txt" (Uma's profile: her account is cached at this PC, and an administrator at a PC sees the profile of each account cached there as well as the owner's. This is intended, not a leak; an ordinary session, beat 1, sees only its own); click the "Olu projects" icon (`clickText` on its name, or `clickSelector` `.desktop-icon[aria-label="Olu projects"]`): the folder window lists "Budget draft.txt"; open that file and read it; close the folder and open it again (closing the folder also closes the desktop: `interact` `bay_pc` first, then click the folder icon again).
- Server: `sessions.bay_pc` is `via password` for `adel`, `access` shown as `admin` by `--access` (and `level admin`); `--ops-log` shows one `admin_profile_read` row as `adelwick` at `bay_pc` for the profile `olu_files` (a repeat open merged: no second row); the row holds no password and no file text.

### 2b. The audit terminal shows the read

Walk to the lobby and `interact` `audit_log_pc`.
- Browser: the log reader opens and lists the privilege events so far; one row of kind `ADMIN_READ`, identity `adelwick`, location the PC's display name ("Bay desk PC"), detail `profile: Olu Marsh`, the display name of the account the profile is for (never the profile id `olu_files` or the PC id, no password, no file text). Close it.
- Server: opening the reader saves nothing (`GET /log_rows` writes no row); `--ops-log` still shows exactly one `admin_profile_read` row.

### 3. A stick at the shelf port is refused, for the administrator too

With Adel's session still open, close the desktop. Take `kit_stick_a`. `interact` `bay_port`.
- Browser: no confirm opens; a toast reads "USB devices are disabled on this PC."; `getState().inventory` still lists `kit_stick_a`; read the refusal from the toast (`{"cmd":"toasts"}`): `drain` does not keep `usb_refused:*` or `network_device_refused` events (its filter holds `pc_*`, workstation and game events), and a direct socket refusal does not take the gated-remove path that emits them. The event is covered by `test/js/apply-actions-gated-remove.test.mjs`.
- Server: `plantedItems` is empty (`--access`); nothing else changed. (The shelf port is not a sign-in PC and has no grant, so no session overrides it. A stick at a port that names a PC is beat 19.)

### 4. Lock the screen: a keystroke device is refused

Take `kit_badusb`. Open the `bay_pc` desktop (still Adel's), Start, Lock (`#pc-start-lock`); the taskbar marker is gone from the locked screen. `interact` `bay_dock`, answer "Plug it in".
- Browser: a toast "USB devices are disabled on this PC." (the policy line for a blocked PC); the device stays in the tray; no foothold mark appears on `bay_pc`.
- Server: `--access` shows the session locked with `level none`; no `usb_install_overridden` row; no `implant_bay_pc` foothold.

### 5. The drop box and the token session (the clock starts here: four real minutes)

Unlock the locked screen by typing Adel's password into the password box it shows (the lock screen has NO tile for Adel to click; the box is for the locked account), then sign out (`#pc-start-signout`). Go to the lobby, take `kit_dropbox`, `interact` `office_port`, answer "Plug it in".
**The token's deadline is four real minutes from this first plant; a re-plant does not restart it, and nothing in the game brings it back.** Do the next steps without a pause, and note the wall-clock time of the plant.
The box's network view opens (if it does not, `interact` `office_port` again). The player holds the capture log, so a token's find toast is the capture-log line ("New in your capture log: ..."), not "Session token captured: ..." (that line is only for a player with no capture log); it comes with the keyring's next answer and was not seen in game 173, where the proof was the "Connect with / Bay PC sign-in token" offer on Adel's tile below (wait for the offer, do not repeat the plant). Sweep `office_lan`, Scan `bay_pc`, open `bay_pc`'s sign-in control, click the Adel tile: "Connect with / Bay PC sign-in token" is offered. Connect with it.
- Browser: the remote desktop opens as Adel (a red frame, `desktop-remote-line`) with the "Administrator" marker. Read the marker, then sign out of the remote session (Start, `#pc-start-signout`).
- If the four minutes have already passed: the tile still shows the "Connect with" option but with the line "Bay PC sign-in token has expired." under it (it does nothing). Report beat 5 as failed on timing, not as a game fault, and run the rest in a fresh game (a re-plant does not help).
- Server: `--access` lists the session `via credential` at `bay_pc` while it is held.

### 6. Typed remote administrator: nobody at the keyboard; then the token lapses

Still in the view (or reopen it from `office_port`), open `bay_pc`'s sign-in control, click the Adel tile and TYPE the password (not the token): the remote desktop opens with the marker. Close it, close the view, walk to `bay`, `interact` `bay_dock`, answer "Plug it in". Read the toast now, before the bay PC is switched off in beat 8. The toast arrives after the server's answer, not at the click: wait about 3 seconds before `{"cmd":"toasts"}` (a read straight after `dismiss` can miss it; plug again if it did).
- Browser: a toast "Nobody is signed in at this keyboard." (take the screenshot now); `kit_badusb` is still in the tray. The `network_device_refused` event (reason `needs_console`) is not kept by `drain`; it is covered by `test/js/network-links-needs-console.test.mjs`.
- Server: the `bay_pc` session shows a foothold (`jack_office_port`), `level admin`, `access admin`; no `implant_bay_pc`; no `usb_install_overridden` row; the refused plug is a 422 with reason `needs_console` in the capture.
- The lapse, optional: if you still hold a token session (connect with the token again before the four minutes are up) leave the desktop open until four real minutes have passed since the plant. The marker clears itself at expiry (no request is needed) with a toast "Bay PC sign-in token expired. Your session on BAY01 ended."; reopening from the Adel tile is refused with "Bay PC sign-in token has expired." and sends no request. The server reads `level none` for that session.

### 7. At the keyboard the administrator's override installs the device

Sign out any remote session at `bay_pc`, unplug the drop box (view's Unplug) if it is still planted. At the keyboard, sign in as Adel (typed). `interact` `bay_dock`, answer "Plug it in".
- Browser: no refusal toast; `kit_badusb` leaves the tray; a "Keystroke injector: Bay" network view opens by itself (the implant is a foothold of its own; not a fault: close it); `bay_pc` is marked with the compromise bolt (the implant foothold, source `implant_bay_pc`; read `{"cmd":"eval","fn":"() => window.__test.access.compromiseMarks()"}`).
- Server: `footholds` holds `implant_bay_pc`; `--ops-log` shows one `usb_install_overridden` row as `adelwick` at `bay_pc` with device `hid`; a user session doing the same (sign out, sign in as Uma with a second device, which this scenario does not hold) would be refused: Rails test.

### 8. The power switch ends the level, and the second switch gives it back

`interact` `bay_breaker` (hint "The bay PC has gone quiet."), then `{"cmd":"sync"}`, then open `bay_pc` again.
- Browser: the toast "This PC is off." and no desktop; the taskbar marker for that session is gone.
- Server: `--access` reads `level none` for `bay_pc`.
Then `interact` `bay_breaker_on` (hint "The bay PC hums again."), `{"cmd":"sync"}`, and open `bay_pc` again (if "Someone's in the way." appears, `moveToNear` `bay_pc` and `interact` again). The session does NOT end with the power (the server keeps the record at level none while the PC is off, and the client keeps its entry): the desktop opens at once with the "Administrator" marker and no sign-in screen. There is no sign-in row to name.
- Browser: the desktop opens with the marker and no sign-in; `GET container/bay_pc` answers 200 with `access: "admin"`.
- Leak check: the client sends NO request while the PC is off (no 403 `off` row exists in a real capture), so unless an answer showed the power cut the check still holds Adel's admin step from the keyboard sign-in: **no `--resume` is needed then, and an unused entry is exit 2**. A `--resume adel@bay_pc@<t>` is only for the run where an answer DID show the session suspended while the PC was off: the `GET /network` host row an off PC really gets (no `session`, `responding: false`, `heldAs` Adel's display name; the answer lists each PC twice, which is fine), a reload's bootstrap that lists Adel's session at `bay_pc` with no `access`, or a 403 `off` or `not_responding` desktop answer. The check then suspends the step (and remembers it), and only the ONE 200 `GET container/bay_pc` row after it that shows Adel's session with `access: "admin"` again, named by its `t` (`--resume adel@bay_pc@2026-11-24T00:39:42.418Z`), restores it, from that row only, if that row is the same account and the same kind of session (password or token, not a claim or relay), is not past a token's deadline, and nothing else ended the session in between (sign-in, lock, sign-out, `endedPcIds`, a bootstrap without the session, another account's row; a claim or relay shown without admin counts as another kind). A 200 answer never restores the step by itself. A resume that matches no row, or whose conditions fail, is an error (exit 2).
- Server: `--access` reads `level admin` for `bay_pc` again. (`--access` is read at the end of the run only: the off moment is not read.)

### 9. The step up from a typed user session

In the lobby take `card_stale` from `lobby_cabinet`. Plant the drop box again if unplugged (a second `interact` `office_port` opens the view). On a re-plant the view has NO Sweep control: the office LAN list from the earlier sweep is still there, so go straight to Scan (sweep only if the control is listed: `[data-network-id="office_lan"] [data-action="sweep"]`). In the view: Scan `store_pc` (`[data-host-id="store_pc"] [data-action="scan"]`), Check its service with `.network-check` and Confirm the finding with `.network-confirm` (`clickText` hits the host row, whose text holds the same words). Select the finding (`.network-finding-select`) and the card (`.network-technique-select`), Use (`.network-use`).
- Browser: "Something this needs is still missing. Missing: RECS01" (no session). Open `store_pc`'s sign-in control, choose the Uma tile and type her password (remote): the desktop opens; close it. Select the finding and the card, Use: success; the remote desktop replaces the view at once (the host row's bolt and admin tag are not on screen then: read them from the view if it stays, otherwise skip that cell); the desktop is in the remote-view frame with the marker.
- Server: `sessions.store_pc` is `via technique`, `access admin`, the foothold `jack_office_port`, granted by the finding; one `technique_used` row.

### 10. A shared screen never steps up

Sign out of `store_pc` (Start, `#pc-start-signout`). Take `assist_code` from the cabinet (a toast says to connect it from your inventory; it arrives about 6 seconds later, with the next view refresh: wait, then read the toasts). The sign-in control does NOT list it. Open the tray item (`{"cmd":"inventoryAct","item":"assist_code","entry":"Connect"}`; `{"cmd":"openInventoryItem","item":"assist_code"}` opens the menu first): it opens `store_pc`'s desktop as a relay session (Uma's own screen; toast "Uma Quayle let you into the session. Check who is asking before you share access."). Close it. Select the finding and the card, Use.
- Browser: "Something this needs is still missing. Missing: RECS01"; no bolt, no admin tag on the row.
- Server: `sessions.store_pc` is `via credential` with `relay` true, no `access`; no new `technique_used` row.

### 11. Where the run stands

Nothing to click: Adel's keyboard session at `bay_pc` is still open, no session at `store_pc` or `hot_desk`. Beats 12 to 25 continue in the same game; the end-of-run checks come after beat 25 ("End of run").

## Stage S5b and the two rulings (A: a stick at a governed port; B: a relayed administrator)

Beats 12 to 25 follow beat 11 in the same game, played top to bottom. They are numbered as section 7 of `docs/agents/ops_core_build/S5BC_BUILD_BRIEF.md` (its rows 1 to 10, then 11 to 14). The scenario adds `hot_desk` (lobby, sign-in PC, no owner, `locked: true` so the sign-in screen shows; admits every staff account; domain `northwind`), cached accounts on `bay_pc` (Olu, Uma) and `hot_desk` (Priya; Sam only after he has borrowed the hot desk), the hash records `baypc_olu`, `baypc_uma`, `hotdesk_priya`, `hotdesk_sam` (each earned by collecting at that PC), the fact notes `bay_pinboard` (bay) and `lobby_noticeboard` (lobby), `bay_usb_port` in the bay (`portOf: bay_pc`, `survey_stick` in the start items), and the assist code `adel_assist_code` (a cabinet item in the lobby, relay to `hot_desk`). The capture log is a start item. The lobby also has `sam_breaker` (Sam's PC power switch; `sam_pc` is `offWhen: sam_pc_off`, the global starts false), the only way to make Sam's need fail by clicking (beat 16).
Server rows to read after the run: `credentials_harvested` once per collect that adds a pair, `usb_install_overridden` with `device: storage`; `sessions`, `cachedAt`, `harvestedAccounts` in `verify-run.rb --access`.

Played in a real browser on 2026-11-24 (fresh game 173, keyless server, the commit before this one): the labels below are what the screen showed, in the order the beats are written. Each beat starts with **Needs** (who is signed in where when it begins) and **Get there** (the steps that make it so). A session stays open when its desktop is closed with x: only Start, "Sign out" (`#pc-start-signout`) ends it, and with a session open, clicking the PC opens its desktop at once, with no sign-in screen. The bridge reads the panel: `window.__test.access.collectControl()`, `cachedAccounts()`, `clickCollect()`, `clickCrack(hashId)` (they click the real DOM). Tiles read "Name" then username; a cracked account's tile also reads "Cracked". Reach another room with `{"cmd":"enter","room":"<id>"}` first (objects of other rooms are unknown until you are in that room). Passwords: Uma `Quayside-Uma-17`, Adel `Lanternwick-Adel-52` (from `note_uma`, `note_adel`).

**Where each session is after beat 11:** Adel's keyboard session at `bay_pc` (from beat 7, open since; beat 8's power cut did not end it). No session at `store_pc` (signed out in beat 10), none at `hot_desk`. The player holds `kit_stick_a` (beat 3), `kit_stick_b` is still on the bay shelf, and `survey_stick` is in the tray from the start.

12. **No collect as a user.**
    **Needs:** nobody signed in at `bay_pc`. **Get there:** in `bay`, click `bay_pc` (Adel's desktop opens); Start, "Sign out" (this closes the desktop).
    Click `bay_pc` again; click the "Uma Quayle" tile; type `Quayside-Uma-17`. Taskbar reads "Start", "Uma Quayle", "BAY01". No "Administrator" marker, no "Cached accounts" button (`collectControl().shown` false).
13. **Collect as admin.**
    **Needs:** Uma signed in at `bay_pc` (beat 12). Start, "Switch user" (the screen says "Signed in now: Uma Quayle (umaquay)"), the "Adel Wick" tile, `Lanternwick-Adel-52`. Taskbar: "Adel Wick", red "Administrator", "BAY01". The "Cached accounts" button sits in a bar above the desktop icons. Click it: two rows, each with a headshot, "Olu Marsh omarsh" and "Uma Quayle umaquay", a "hash" tag and a "Crack" button, with the line "The password comes from cracking the hash." A toast reads "Hash collected" (twice on two lines, one per hash: it is a find toast and shows when the keyring answers, which can be a moment after the press; a capture-log player sees the same text); read it at once, it does not stay. A second click: status "Nothing new is cached here." and the two rows stay listed. The panel is short (the desktop icons share the window): the second row is clipped until the list is scrolled.
    **Leaves:** Adel signed in at `bay_pc`, desktop open.
14. **Hash rows listed.**
    **Needs:** the beat 13 collect done. Close the desktop (x; Adel's session stays open). Tray: the capture log ("Capture log"). The two hashes are under the heading "HASHES" ("Hash records. A hash cannot sign in until it is cracked; open one to try."): each reads "Hash record", name, username, a token like `9WNU-XMJP-T6TG-UBJN-SFGQ-ZWKH`, "Ready", a "Crack" button, and "New". The SIGN-INS list is NOT empty, but holds no password row for either of them: "Session token / Recorded / Adel Wick" (the token of beat 5) and "Remote assist / Found / Uma Quayle" (the code of beat 10).
15. **Crack one.**
    **Needs:** the capture log open or closed, no particular session. `interact` `bay_pinboard`: it opens straight in the notes viewer ("Note 3 of 3"; there is no Take button) and toasts "Noted: Olu's dog" and "Noted: Uma's home town" (the toasts can show on a later read). Close, open the capture log, click "Crack" on Uma's hash: the "Cracker" scene lists her hash and two chips, "Olu's dog" and "Uma's home town". Click "Uma's home town", then "Crack": "Cracked", "Uma Quayle (umaquay): Quayside-Uma-17". Close: the cracker closes outright (it does not return to the capture log). The capture log now has a SIGN-INS row "Cracked password / Cracked / Uma Quayle / umaquay / Quayside-Uma-17" and her hash row reads "Cracked". `enter` `lobby`; click `hot_desk`: her tile now carries a "Cracked" badge; type that password: taskbar "Uma Quayle", "HOT01", no collect button. Start, "Sign out" (this closes the desktop).
    **Leaves:** nobody at `hot_desk`; Adel still at `bay_pc`.
16. **Collect before the borrow, then borrow, then collect again.**
    **Needs:** nobody at `hot_desk`; in the lobby.
    *Before the borrow.* Click `hot_desk`, the "Adel Wick" tile, `Lanternwick-Adel-52` (taskbar "Adel Wick", "Administrator", "HOT01"; the screen also names "Domain: northwind" before you sign in). Click "Cached accounts": one row, "Priya Nair pnair" (this is the first `CRED_COLLECT` row for `hot_desk`). Start, "Sign out".
    *The borrow* is made by clicking the power switch, not by locking Sam out at his own desk (a click on `sam_pc` only says "Sam Okoro is using this PC." while he sits there). Click `sam_breaker` ("Sam's PC power", `moveToNear` then `interact`): the question "Switch Sam's PC off?"; `dismiss` "Switch off". Note the time of the click. Sam's work then fails at his own desk; he mutters, walks to `hot_desk`, uses it and walks back to `sam_pc`, leaving the hot desk signed in. Wait until the need log shows `borrow_set`, `using` at `hot_desk` and `borrow_done` with `met: true, leftOpen: true` (read it with `{"cmd":"eval","fn":"() => window.__test.needs.log().slice(-8)"}`). Timing: game 167 logged 104 s from `borrow_set` to `borrow_done`; in game 173 `borrow_done` was there at the read 106 s after the switch click (not read earlier). **Switch his PC back on afterwards** (`sam_breaker` again, "Switch Sam's PC back on?", "Switch on"): while it is off he keeps borrowing, and each visit ends the session you opened at `hot_desk`. Leaving it off was not played.
    *After the borrow.* `interact` `hot_desk`: the desktop reads "You're on the screen Sam Okoro left open. It ends when the screen locks.", taskbar "Sam Okoro", "HOT01", no "Cached accounts" button (`collectControl().shown` false). Start, "Switch user", the "Adel Wick" tile, `Lanternwick-Adel-52`; "Cached accounts" lists both "Priya Nair pnair" and "Sam Okoro sokoro" (the list shows what is held; Sam's is the pair this press added). A second click: "Nothing new is cached here."
    **Leaves:** Adel signed in at `hot_desk` (desktop open) and at `bay_pc`.
17. **Crack from the panel.**
    **Needs:** Adel at `hot_desk` (beat 16). Click "Crack" on Sam's row: the "Cracker" shows "Sam Okoro / sokoro", a token like `8Q35-P6HU-ZF49-QXUC-L5AH-LY4H`, and two chips, "Olu's dog" and "Uma's home town" (both facts were learned in beat 15; there is no "You have not learned anything about this account yet" line). Close the cracker with x.
18. **Stick refused.**
    **Needs:** NO session at `bay_pc`. **Get there:** walk to `bay`, click `bay_pc` (Adel's desktop opens at once: that is his session from beat 13), Start, "Sign out". Hold `survey_stick` (it is in the tray from the start; `kit_stick_a` is a different item). `interact` `bay_usb_port` ("Survey port on the bay desk"): a warning toast "USB devices are disabled on this PC." There is no "Plug it in" question; `survey_stick` stays in the tray. (The object line "A USB port on the bay desk. The bay policy refuses storage sticks here unless an administrator is signed in at the bay PC." was not read in game 173.)
19. **Stick as admin.**
    **Needs:** Adel at `bay_pc`. **Get there:** click `bay_pc`, the "Adel Wick" tile (the sign-in screen names "Domain: northwind"), `Lanternwick-Adel-52`; close the desktop (x). `interact` `bay_usb_port`: the question "Plug the survey stick into the bay desk port?" with "Plug it in" and "Leave it". Click "Plug it in": `survey_stick` leaves the tray (no toast follows; `kit_stick_a` stays). The audit log terminal ("Audit log terminal", `audit_log_pc`) lists these rows (Adel's sign-in at `hot_desk` is still open, which is why this beat can show them): `CRED_COLLECT adelwick Bay desk PC OK count: 2` (beat 13), `CRED_COLLECT adelwick Hot desk PC OK x2 count: 1` (two collects of one pair each: Priya before the borrow, Sam after it, merged into one row with "x2") and `USB_OVERRIDE adelwick Bay desk PC OK device: storage`.
    **Leaves:** Adel at `bay_pc` and at `hot_desk`.
20. **Relayed admin.**
    **Needs:** no session at `hot_desk` (a relay opens the shared screen only when none is held). **Get there:** click `hot_desk` (Adel's desktop opens), Start, "Sign out". In `lobby`, `lobby_cabinet`: take "Adel assist code.txt" (and "Uma assist code.txt"). Toast "New in your capture log: Adel's assist code (remote assist for Adel Wick)." The capture log lists each under SIGN-INS as "Remote assist / Found / ...". Open the tray item "Adel assist code.txt" and its "Connect" entry (`{"cmd":"inventoryAct","item":"adel_assist_code","entry":"Connect"}`): "Remote assist session / Using Adel Wick's session (adelwick)", then the shared screen titled "HOT01" with taskbar "Adel Wick", "Administrator", "Assist", "HOT01" and the "Cached accounts" button. Clicking it answers "Nothing new is cached here." and lists both rows, "Priya Nair pnair" and "Sam Okoro sokoro" (both were collected in beat 16). `hot_desk` is in no network (its room has none), so the network view lists no row for it and offers no card for it. The step-up card was checked on the other relay: see beat 21.
21. **Relayed user.**
    **Needs:** nobody at `store_pc`. Tray item "Uma assist code.txt", "Connect": "Remote assist session / Using Uma Quayle's session (umaquay)", then the shared screen "RECS01" with taskbar "Uma Quayle", "Assist", "RECS01"; the toast "Uma Quayle let you into the session. Check who is asking before you share access."; no "Administrator" marker, no "Cached accounts" button. The relay step-up card: with the drop box planted (take `card_stale` from `lobby_cabinet` and `kit_dropbox`, `interact` `office_port`, `dismiss` "Plug it in"; the view's earlier findings are still listed), Scan RECS01, Check and Confirm if the finding "f1 / Out of date / High / Confirmed" is not already listed. Close the desktop, select the finding (`.network-finding-select`) and the card (`.network-technique-select`), Use (`.network-use`): the notice "Something this needs is still missing. Missing: RECS01", no bolt, no admin tag on the row. The relay never steps up.

## Stage S5c: shared, hardened and domain accounts (beats 22 to 25)

Rows 11 to 14 of section 7 of the brief. The scenario adds the room `it_room` (south of `lobby`, open), the sign-in PCs `desk_a` ("Desk PC A", DESKA), `desk_b` (DESKB) and `lab_pc` (LAB01), each `access: { roles: ["it"] }` (never a `people` list: an account-only id in it would reach the browser in the room answer), the account-only accounts `deskadmin` (local to `desk_a` and `desk_b`, admin; username `deskadmin`, password `Winter2026`) and `labadmin` (local to `lab_pc`; password `q8-Fen-31-Lab`), the person Ravi Menon (`ravi`, a domain administrator: `rmenon-adm` / `Tidewater-Ravi-64`, domain `northwind`, also on `bay_pc` and `hot_desk`; only these two PCs carry `domain: northwind`), the hash records `desk_a_deskadmin`, `desk_b_deskadmin` (guessable from the fact `it_rota_seen`) and `lab_labadmin` (strong), the takeable notes `it_rota_poster` (the fact) and `ravi_note` (Ravi's login), and the log event `signin_refused` in the audit source. Reach `it_room` with `{"cmd":"enter","room":"it_room"}`. Played in game 173; the labels below are what the screen showed.

22. **Collect the shared local administrator.**
    **Needs:** nobody at `desk_a`. `interact` `it_rota_poster` (it opens in the notes viewer titled "IT rota poster", "Note 6 of 6", with Save and Cancel: "IT rota: desk administrator duty is shared by everyone in turn. The shared desk password follows the season and the year, so nobody has to write it down."; the toast "Noted: The desk administrator's habit" comes with it); close it. `interact` `desk_a`: the sign-in screen offers only the "Adel Wick" tile and "Other user" (no tile for `deskadmin` or Ravi) and no "Domain:" line. Adel's tile, `Lanternwick-Adel-52`; "Cached accounts" shows one row: "Desk administrator deskadmin", a "hash" tag, a generic headshot, "Crack".
    **Leaves:** Adel at `desk_a`.
23. **Crack and reuse.**
    **Needs:** the row of beat 22. "Crack" on that row: the Cracker lists "Desk administrator / deskadmin" and the chip "The desk administrator's habit"; click the chip, then "Crack": "Cracked", "Desk administrator (deskadmin): Winter2026". Close. `interact` `desk_b`: still only Adel's tile (a cracked account-only account gets no tile); "Other user", type `deskadmin`, then `Winter2026`: the desktop opens, taskbar "Desk administrator", "Administrator", "DESKB", with "Cached accounts". Its click: toast "Hash collected" and the row "Desk administrator deskadmin" reads "cracked" with the button "Open" (the keyring already lists that hash as cracked, since the same token serves both desks); "Open" shows the Cracker already reading "Cracked" with the chip and Crack disabled.
24. **The hardened PC holds.**
    **Needs:** nobody at `lab_pc`. `interact` `lab_pc`, "Other user", `deskadmin` / `Winter2026`: the screen stays on the sign-in with the line "This account can't sign in on this PC." (a `signin_refused` row with detail `kind: local` goes to the audit log; no lockout is counted). Change, the Adel tile, his password: the desktop opens; "Cached accounts": one row, "Lab administrator labadmin". "Crack" opens the Cracker with the (unrelated) chip "The desk administrator's habit"; pick it and Crack: "No match". The lab administrator's password does not fall to the rota fact.
25. **Domain administrator.**
    **Needs:** nobody at `hot_desk`, `bay_pc` or `desk_a`, or the desktop opens instead of the sign-in screen. **Get there:** at `hot_desk` click the PC and, whatever is open (Adel's shared screen of beat 20, or his keyboard session), Start, "Sign out"; the same at `bay_pc` (Adel's session from beat 19) and at `desk_a` (Adel's from beat 22).
    `interact` `ravi_note` (the notes viewer: "Ravi's domain login (administrator): rmenon-adm / Tidewater-Ravi-64"). At `hot_desk` and at `bay_pc` the sign-in screens name "Domain: northwind" and list a "Ravi Menon rmenon-adm" tile; his password gives the desktop with taskbar "Ravi Menon", "Administrator", "HOT01" or "BAY01", and the "Cached accounts" button. At `desk_a` (no domain, no "Domain:" line) typing `rmenon-adm` / `Tidewater-Ravi-64` under "Other user" leaves the sign-in with "This account can't sign in on this PC." and the audit log (`audit_log_pc`) gains `SIGN_IN rmenon-adm Desk PC A DENIED kind: domain`.

### End of run

`{"cmd":"sync"}`, the leak check over every capture file, `verify-run.rb <game_id> --access` and `--ops-log` as two commands.
- No answer holds the key `admin` under an NPC, the administrator's password (outside the note in `store`), or Olu's items before beat 2. `--ops-log` ends `ops log OK` (16 rows in game 173). `--access` in game 173 ended with `bay_pc` = ravi (password, level admin), `desk_b` = deskadmin (level admin), `lab_pc` = adel (level admin), `store_pc` = uma (credential, level user).
- The leak check names every keyboard sign-in. Game 173's command (your numbers follow your own listing): `--signin uma@bay_pc#1 --signin adel@bay_pc#1 --signin adel@bay_pc#2 --signin adel@bay_pc#6 --signin adel@bay_pc#7 --signin uma@bay_pc#4 --signin adel@bay_pc#8 --signin uma@hot_desk#5 --signin adel@hot_desk#9 --signin sam@hot_desk#1 --signin adel@hot_desk#10 --signin adel@bay_pc#11 --signin adel@desk_a#13 --signin deskadmin@desk_b#1 --signin adel@lab_pc#14 --signin ravi@hot_desk#1 --signin ravi@bay_pc#2`, with `--logout` entries for each sign-out made while another PC held an administrator session (`adel@store_pc#6`, `adel@bay_pc#7`, `uma@hot_desk#8`, `adel@hot_desk#9`, `adel@bay_pc#10`, `adel@hot_desk#11`, `ravi@hot_desk#12`, `adel@desk_a#13`, `adel@bay_pc#14`). That run gave three findings, all about what an administrator at `bay_pc` is meant to see (the profile of an account cached at that PC, "Uma to do.txt", beat 2) or the audit row of the stick override: these are reported to the scanner side.


## Earned secrets

Uma's and Adel's passwords are typed in beats 1, 2, 5, 7, 9 and 12 to 25, from their notes. Olu's password is never given; the scanner treats all three as secrets. Ravi's password is on `ravi_note` (beat 25); the shared desk administrator's password is learned only by cracking (beat 23), the lab administrator's never.

## Expected validator output

`LANG=C.UTF-8 ruby scripts/validate_scenario.rb scenarios/test_ops_privilege/scenario.json.erb`: 0 errors, three warnings, all intended: "sign-in PC 'sam_pc' is under a policy with maxAttempts 3: a lockout lasts the mission" (Sam's strict desk, beat 16 and the Rails borrow test), "sign-in PC 'bay_pc' is owned by 'olu', who has no valid needs or interests entry, so the owner never
leaves" (no owner claim is wanted here), and "grant_foothold ... targets pc 'bay_pc', whose USB policy refuses the usbClass of 'kit_badusb', so the implant can never be used there" (true for every session but an
administrator at the keyboard: the whole point of beats 4, 5 and 7). The generic suggestions follow, with the information line "privilege: ... (deskadmin): a shared local administrator (it opens 2 PCs once cracked)".
