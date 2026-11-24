# test_ops_privilege: scripted playtest (privilege stage S5a, feature A18)

The feature scenario for `docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md` stage S5a (its section 11 beat list, nine beats, plus the step-up
beats the build brief adds). One run in one game, about 40 minutes. Each beat says what to do, what the browser shows and what the server records.
The scenario is for testing, not play. It names no host, product, version, class or summary in any sign or task: those reach the browser only from
`GET /network`, scan, check and confirm answers.

**Not played in the browser.** No beat sends a forged, hand-built or replayed request (S3 R2 ruling N-13-3). Those checks are Rails tests:
`test/controllers/break_escape/ops_privilege_scenario_test.rb` (every beat below through the real routes, plus the lapsed-override refusals, a claim record
feeding the step up, and "a refused request writes nothing"), `ops_privilege_no_exposure_test.rb` (what no answer holds, a forged sync body),
`privilege_inventory_remove_test.rb`, `privilege_profile_read_test.rb`, `test/models/break_escape/admin_usb_test.rb`.
Four things have no browser beat, and why:
- **A stick the policy refuses, accepted under admin: no path in a validator-clean scenario today.** An administrator's override is judged at a sign-in PC or at the PC named by a socket's session grant,
  but a sign-in PC cannot take a stick (the validator forbids `triggerOnInteract` on it) and the bay PC's one socket grant is the keystroke socket's, so a governed stick port names no PC that could judge it.
  The server and client code for it (the remove check, the remote override, the lapsed-override refusal) is covered by Rails and node tests only: the stick port (`bay_port`) is refused for everyone (beat 3),
  and the plan's "plant a second stick under remote admin" (plan beat 5) and "token admin session expires, then a refused plant keeps the stick" (plan beat 8) are made by the Rails tests on a copy of the
  scenario in which the bay PC takes a stick. A later small unit may add a field on a governed port naming the PC that judges it (an open question for the owner, brief O3).
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
(here both PCs admit every account) an unnamed keyboard sign-in earns nothing, and the check then reports the administrator's `access` and the owner's items as leaks (these are the check failing closed, not a game finding).
List the sign-ins of the run, oldest first, with the order each has among its account's sign-ins (a remote one is marked and needs no entry):

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
' $S/responses-<game_id>.jsonl [$S/responses-<game_id>-2.jsonl ...]
```

Then give every KEYBOARD line to the check, with the PC you signed in at (`bay_pc` or `store_pc`; the beats say where), after the game id and before the files. Example for a run with Uma's and Adel's keyboard sign-ins at `bay_pc`:

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> \
  --signin uma@bay_pc#1 --signin adel@bay_pc#1 --signin adel@bay_pc#2 --signin adel@bay_pc#5 \
  $S/responses-<game_id>.jsonl [$S/responses-<game_id>-2.jsonl ...]
```

Each entry is credited from its own row onward and for its own account only (`--signin <account>@<pc>@<row time>` names the row by its `t` instead). A wrong PC named is a finding at the next answer for the real PC. The check also takes an earned step back at a sign-out, a lock, a later sign-in at that PC, a refused desktop, and a reload that no longer holds the session.
It cannot see a token running out between requests.

## Layout

- `lobby` (start): the audit log terminal `audit_log_pc` (reads `priv_audit`); the drop box `kit_dropbox`; the wall port `office_port` (network `office_lan`, foothold `jack_office_port`); the cabinet `lobby_cabinet` (not locked) holding the card
  `card_stale` ("Field note: records updates") and the shared-screen code `assist_code` ("Uma assist code.txt"); the sign `sign_lobby`. Doors: north to `bay`, east to `store`.
- `bay` (north): `bay_pc` (a desk PC, host label BAY01, owner Olu, USB policy blocked, remote sign-in allowed); `bay_dock` ("USB socket by the bay PC", takes `kit_badusb`, a confirm
  whose grant needs a session at `bay_pc`); `bay_port` ("Stick port on the bay shelf", same policy, takes a USB stick through a confirm whose `remove_item` is first);
  `bay_breaker` ("Wall switch: bay power", turns the PC's service off) and `bay_breaker_on` ("Wall switch: bay power back on", turns it on again); the items `kit_badusb` ("Keystroke injector"), `kit_stick_a` and `kit_stick_b` (sticks); Olu Marsh (owner).
- `store` (east): `store_pc` ("Records PC", a desk PC, host label RECS01, remote sign-in allowed; one service with one weakness, a step up to admin, needing a user session); the notes
  `note_uma` and `note_adel` (the typed logins: the earned secrets); Uma Quayle (`uma`, user) and Adel Wick (`adel`, the administrator: `creds.admin`).
- Accounts: Uma (`umaquay`), Adel (`adelwick`, administrator), Olu (`omarsh`, owner of the bay PC, never signs in). Profiles: `uma_files` ("Uma to do.txt"), `adel_files` ("Admin runbook.txt"),
  `olu_files` ("Olu notes.txt" and a folder "Olu projects" holding "Budget draft.txt"; the folder is an ordinary unlocked `folder` item, so one click opens it). Both PCs admit every staff account.
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
- Browser: the taskbar shows "Administrator"; the desktop lists "Admin runbook.txt", "Olu notes.txt" and the folder "Olu projects" (and no "Uma to do.txt"); click the "Olu projects" icon (`clickText` on its name, or `clickSelector` `.desktop-icon[aria-label="Olu projects"]`): the folder window lists "Budget draft.txt"; open that file and read it; close the folder and open it again.
- Server: `sessions.bay_pc` is `via password` for `adel`, `access` shown as `admin` by `--access` (and `level admin`); `--ops-log` shows one `admin_profile_read` row as `adelwick` at `bay_pc` for the profile `olu_files` (a repeat open merged: no second row); the row holds no password and no file text.

### 2b. The audit terminal shows the read

Walk to the lobby and `interact` `audit_log_pc`.
- Browser: the log reader opens and lists the privilege events so far; one row of kind `ADMIN_READ`, identity `adelwick`, location the PC's display name ("Bay desk PC"), detail the word `profile` only (no raw id of the profile or the PC, no password, no file text). Close it.
- Server: opening the reader saves nothing (`GET /log_rows` writes no row); `--ops-log` still shows exactly one `admin_profile_read` row.

### 3. A stick at the shelf port is refused, for the administrator too

With Adel's session still open, close the desktop. Take `kit_stick_a`. `interact` `bay_port`.
- Browser: no confirm opens; a toast reads "USB devices are disabled on this PC."; `getState().inventory` still lists `kit_stick_a`; read the refusal from the toast (`{"cmd":"toasts"}`): `drain` does not keep `usb_refused:*` or `network_device_refused` events (its filter holds `pc_*`, workstation and game events), and a direct socket refusal does not take the gated-remove path that emits them. The event is covered by `test/js/apply-actions-gated-remove.test.mjs`.
- Server: `plantedItems` is empty (`--access`); nothing else changed. (The shelf port is not a sign-in PC and has no grant, so no session overrides it: see "Not played in the browser".)

### 4. Lock the screen: a keystroke device is refused

Take `kit_badusb`. Open the `bay_pc` desktop (still Adel's), Start, Lock (`#pc-start-lock`); the taskbar marker is gone from the locked screen. `interact` `bay_dock`, answer "Plug it in".
- Browser: a toast "USB devices are disabled on this PC." (the policy line for a blocked PC); the device stays in the tray; no foothold mark appears on `bay_pc`.
- Server: `--access` shows the session locked with `level none`; no `usb_install_overridden` row; no `implant_bay_pc` foothold.

### 5. The drop box and the token session (the clock starts here: four real minutes)

Unlock the locked screen by typing Adel's password into the password box it shows (the lock screen has NO tile for Adel to click; the box is for the locked account), then sign out (`#pc-start-signout`). Go to the lobby, take `kit_dropbox`, `interact` `office_port`, answer "Plug it in".
**The token's deadline is four real minutes from this first plant; a re-plant does not restart it, and nothing in the game brings it back.** Do the next steps without a pause, and note the wall-clock time of the plant.
The box's network view opens (if it does not, `interact` `office_port` again). A toast "Session token captured: Bay PC sign-in token for Adel Wick on BAY01." appears. Sweep `office_lan`, Scan `bay_pc`, open `bay_pc`'s sign-in control, click the Adel tile: "Connect with / Bay PC sign-in token" is offered. Connect with it.
- Browser: the remote desktop opens as Adel (a red frame, `desktop-remote-line`) with the "Administrator" marker. Read the marker, then sign out of the remote session (Start, `#pc-start-signout`).
- If the four minutes have already passed: the tile offers no "Connect with" and reads "Bay PC sign-in token has expired." Report beat 5 as failed on timing, not as a game fault, and run the rest in a fresh game (a re-plant does not help).
- Server: `--access` lists the session `via credential` at `bay_pc` while it is held.

### 6. Typed remote administrator: nobody at the keyboard; then the token lapses

Still in the view (or reopen it from `office_port`), open `bay_pc`'s sign-in control, click the Adel tile and TYPE the password (not the token): the remote desktop opens with the marker. Close it, close the view, walk to `bay`, `interact` `bay_dock`, answer "Plug it in". Read the toast now, before the bay PC is switched off in beat 8.
- Browser: a toast "Nobody is signed in at this keyboard." (take the screenshot now); `kit_badusb` is still in the tray. The `network_device_refused` event (reason `needs_console`) is not kept by `drain`; it is covered by `test/js/network-links-needs-console.test.mjs`.
- Server: the `bay_pc` session shows a foothold (`jack_office_port`), `level admin`, `access admin`; no `implant_bay_pc`; no `usb_install_overridden` row; the refused plug is a 422 with reason `needs_console` in the capture.
- The lapse, optional: if you still hold a token session (connect with the token again before the four minutes are up) leave the desktop open until four real minutes have passed since the plant. The marker clears itself at expiry (no request is needed) with a toast "Bay PC sign-in token expired. Your session on BAY01 ended."; reopening from the Adel tile is refused with "Bay PC sign-in token has expired." and sends no request. The server reads `level none` for that session.

### 7. At the keyboard the administrator's override installs the device

Sign out any remote session at `bay_pc`, unplug the drop box (view's Unplug) if it is still planted. At the keyboard, sign in as Adel (typed). `interact` `bay_dock`, answer "Plug it in".
- Browser: no refusal toast; `kit_badusb` leaves the tray; `bay_pc` is marked with the compromise bolt (the implant foothold, source `implant_bay_pc`; read `{"cmd":"eval","fn":"() => window.__test.access.compromiseMarks()"}`).
- Server: `footholds` holds `implant_bay_pc`; `--ops-log` shows one `usb_install_overridden` row as `adelwick` at `bay_pc` with device `hid`; a user session doing the same (sign out, sign in as Uma with a second device, which this scenario does not hold) would be refused: Rails test.

### 8. The power switch ends the level, and the second switch gives it back

`interact` `bay_breaker` (hint "The bay PC has gone quiet."), then `{"cmd":"sync"}`, then open `bay_pc` again.
- Browser: the toast "This PC is off." and no desktop; the taskbar marker for that session is gone.
- Server: `--access` reads `level none` for `bay_pc`.
Then `interact` `bay_breaker_on` (hint "The bay PC hums again."), `{"cmd":"sync"}`, and sign in again as Adel at the keyboard (the old session may have ended with the power; type the password).
- Browser: the desktop opens and the "Administrator" marker is back. (That the marker returns for a SURVIVING session after power-on, without a new sign-in, is the node test `test/js/pc-sessions-admin.test.mjs` ("a locked entry never gains the level; a technique entry gets it back after not_responding") and the Rails test "the bay power switch ends the level" which sets the global back and reads `admin` again.)
- Server: `--access` reads `level admin` for `bay_pc` again.

### 9. The step up from a typed user session

In the lobby take `card_stale` from `lobby_cabinet`. Plant the drop box again if unplugged. In the view: Sweep `office_lan` (`[data-network-id="office_lan"] [data-action="sweep"]`), Scan `store_pc` (`[data-host-id="store_pc"] [data-action="scan"]`), Check its service with `.network-check` and Confirm the finding with `.network-confirm` (`clickText` hits the host row, whose text holds the same words). Select the finding (`.network-finding-select`) and the card (`.network-technique-select`), Use (`.network-use`).
- Browser: "Something this needs is still missing." (no session). Open `store_pc`'s sign-in control, choose the Uma tile and type her password (remote): the desktop opens; close it. Select the finding and the card, Use: success; the host row shows the bolt and the admin tag; the desktop now opens in the remote-view frame with the marker.
- Server: `sessions.store_pc` is `via technique`, `access admin`, the foothold `jack_office_port`, granted by the finding; one `technique_used` row.

### 10. A shared screen never steps up

Sign out of `store_pc` (Start, `#pc-start-signout`). Take `assist_code` from the cabinet (a toast says to connect it from your inventory). The sign-in control does NOT list it. Open the tray item (`{"cmd":"inventoryAct","item":"assist_code","entry":"Connect"}`; `{"cmd":"openInventoryItem","item":"assist_code"}` opens the menu first): it opens `store_pc`'s desktop as a relay session (Uma's own screen; toast "Uma Quayle let you into the session. Check who is asking before you share access."). Close it. Select the finding and the card, Use.
- Browser: "Something this needs is still missing."; no bolt, no admin tag on the row.
- Server: `sessions.store_pc` is `via credential` with `relay` true, no `access`; no new `technique_used` row.

### 11. End of run

`{"cmd":"sync"}`, the leak check over every capture file, `verify-run.rb <game_id> --access` and `--ops-log` as two commands.
- No answer holds the key `admin` under an NPC, the administrator's password (outside the note in `store`), or Olu's items before beat 2. `--ops-log` ends `ops log OK`.

## Earned secrets

Uma's and Adel's passwords are typed in beats 1, 2, 5, 7 and 9, from their notes. Olu's password is never given; the scanner treats all three as secrets.

## Expected validator output

`LANG=C.UTF-8 ruby scripts/validate_scenario.rb scenarios/test_ops_privilege/scenario.json.erb`: 0 errors, two warnings, both intended: "sign-in PC 'bay_pc' is owned by 'olu', who has no valid needs or interests entry, so the owner never
leaves" (no owner claim is wanted here), and "grant_foothold ... targets pc 'bay_pc', whose USB policy refuses the usbClass of 'kit_badusb', so the implant can never be used there" (true for every session but an
administrator at the keyboard: the whole point of beats 4, 5 and 7). The generic suggestions follow.
