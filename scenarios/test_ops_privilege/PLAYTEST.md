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
- **A stick the policy refuses, accepted under admin.** The engine lets a remote or keyboard administrator plant such a stick only into a sign-in PC itself or a
  socket whose grant needs a session; the validator forbids `triggerOnInteract` on a sign-in PC, and one grant per PC and shape means the bay PC's one socket is
  the keystroke socket. So the stick port (`bay_port`) is refused for everyone (beat 3), and the plan's "plant a second stick under remote admin" (plan beat 5) and
  "token admin session expires, then a refused plant keeps the stick" (plan beat 8) are made by the Rails tests on a copy of the scenario in which the bay PC takes a stick.
- **A claim feeding the step up** needs the PC's owner to walk away at a moment the script cannot force; the Rails test sets the claim record by hand.
- **A token session expiring.** Beat 6 shows it only if the tester waits out the game clock (4 game minutes from the first sign-in); the server answer is read with `verify-run.rb`.
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
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/responses-<game_id>.jsonl [$S/responses-<game_id>-2.jsonl ...]
```

`--access` prints each session with its stored `access`, and (from unit 16) its computed level word `level admin`, `level user` or `level none`; before unit 16 lands
read the stored line only. `--ops-log` prints the `priv_audit` rows and ends with `ops log OK`. Until unit 16 lands the leak check may report the administrator's
`access` as a leak: that is the scanner not yet knowing the second way to earn it (report it, do not treat it as a game finding).

## Layout

- `lobby` (start): the drop box `kit_dropbox`; the wall port `office_port` (network `office_lan`, foothold `jack_office_port`); the cabinet `lobby_cabinet` (not locked) holding the card
  `card_stale` ("Field note: records updates") and the shared-screen code `assist_code` ("Uma assist code.txt"); the sign `sign_lobby`. Doors: north to `bay`, east to `store`.
- `bay` (north): `bay_pc` (a desk PC, host label BAY01, owner Olu, USB policy blocked, remote sign-in allowed); `bay_dock` ("USB socket by the bay PC", takes `kit_badusb`, a confirm
  whose grant needs a session at `bay_pc`); `bay_port` ("Stick port on the bay shelf", same policy, takes a USB stick through a confirm whose `remove_item` is first);
  `bay_breaker` ("Wall switch: bay power", turns the PC's service off); the items `kit_badusb` ("Keystroke injector"), `kit_stick_a` and `kit_stick_b` (sticks); Olu Marsh (owner).
- `store` (east): `store_pc` ("Records PC", a desk PC, host label RECS01, remote sign-in allowed; one service with one weakness, a step up to admin, needing a user session); the notes
  `note_uma` and `note_adel` (the typed logins: the earned secrets); Uma Quayle (`uma`, user) and Adel Wick (`adel`, the administrator: `creds.admin`).
- Accounts: Uma (`umaquay`), Adel (`adelwick`, administrator), Olu (`omarsh`, owner of the bay PC, never signs in). Profiles: `uma_files` ("Uma to do.txt"), `adel_files` ("Admin runbook.txt"),
  `olu_files` ("Olu notes.txt" and a folder "Olu projects" holding "Budget draft.txt"). Both PCs admit every staff account.
- Credentials: `adel_token` (a saved sign-in token for `bay_pc`, expires 4 game minutes after the foothold is gained; listed by the sign-in control over the foothold) and `uma_assist` (a
  shared-screen code for `store_pc`, from `assist_code`).
- The log source `priv_audit` takes `admin_profile_read` and `usb_install_overridden` (and the ops events).
- The one finding (`store_pc.records.stale_build`, id from the screen alias) is the step up; the card `stale_build_notes` fits it.

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
- Browser: the taskbar shows "Administrator"; the desktop lists "Admin runbook.txt", "Olu notes.txt" and the folder "Olu projects" (and no "Uma to do.txt"); open "Olu projects": "Budget draft.txt" is inside; open it and read it; close the folder and open it again.
- Server: `sessions.bay_pc` is `via password` for `adel`, `access` shown as `admin` by `--access` (and `level admin`); `--ops-log` shows one `admin_profile_read` row as `adelwick` at `bay_pc` for the profile `olu_files` (a repeat open merged: no second row); the row holds no password and no file text.

### 3. A stick at the shelf port is refused, for the administrator too

With Adel's session still open, close the desktop. Take `kit_stick_a`. `interact` `bay_port`.
- Browser: no confirm opens; a toast reads "USB devices are disabled on this PC."; `getState().inventory` still lists `kit_stick_a`; the event `usb_refused:bay_port` fires.
- Server: `plantedItems` is empty (`--access`); nothing else changed. (The shelf port is not a sign-in PC and has no grant, so no session overrides it: see "Not played in the browser".)

### 4. Lock the screen: a keystroke device is refused

Take `kit_badusb`. Open the `bay_pc` desktop (still Adel's), Start, Lock (`#pc-start-lock`); the taskbar marker is gone from the locked screen. `interact` `bay_dock`, answer "Plug it in".
- Browser: a toast "USB devices are disabled on this PC." (the policy line for a blocked PC); the device stays in the tray; no foothold mark appears on `bay_pc`.
- Server: `--access` shows the session locked with `level none`; no `usb_install_overridden` row; no `implant_bay_pc` foothold.

### 5. Remote administrator: told nobody is at the keyboard

Unlock by signing in again as Adel at the keyboard (type the password) so the lock is gone, sign out (`#pc-start-signout`). Go to the lobby, take `kit_dropbox`, `interact` `office_port`, answer "Plug it in"; the box's network view opens.
Sweep `office_lan`, Scan `bay_pc`. In the view open `bay_pc`'s sign-in control, choose the Adel tile, type the password: the remote desktop opens (a red frame; the taskbar shows "Administrator"). Close it, close the view, walk to `bay`, `interact` `bay_dock`, answer "Plug it in".
- Browser: a toast "Nobody is signed in at this keyboard."; the event `network_device_refused` with reason `needs_console`; `kit_badusb` is still in the tray.
- Server: the `bay_pc` session shows a foothold (`jack_office_port`), `level admin`, `access admin`; no `implant_bay_pc`; no `usb_install_overridden` row.

### 6. The token session, then it lapses

Open the network view again; `bay_pc`'s sign-in control lists "Bay PC sign-in token" as a "Connect with ..." button (the foothold earned it). Sign out of the remote session first (taskbar Start, `#pc-start-signout`), then connect with the token: the remote desktop opens as Adel with the marker.
- Browser: the marker shows. Optional: wait about 5 game minutes (`{"cmd":"eval","fn":"() => window.__test.getState().gameClock ?? null"}` if the bridge shows it, else real time) without touching the PC.
- Server: `--access` lists the session `via credential`; once the clock has run out it reads `level none` (the browser's marker may stay until the next request: that is the point; the server answers on every read). A reopen of the desktop is then refused with "sign in again".

### 7. At the keyboard the administrator's override installs the device

Sign out any remote session at `bay_pc`, unplug the drop box (view's Unplug) if it is still planted. At the keyboard, sign in as Adel (typed). `interact` `bay_dock`, answer "Plug it in".
- Browser: no refusal toast; `kit_badusb` leaves the tray; `bay_pc` is marked with the compromise bolt (the implant foothold, source `implant_bay_pc`; read `{"cmd":"eval","fn":"() => window.__test.access.compromiseMarks()"}`).
- Server: `footholds` holds `implant_bay_pc`; `--ops-log` shows one `usb_install_overridden` row as `adelwick` at `bay_pc` with device `hid`; a user session doing the same (sign out, sign in as Uma with a second device, which this scenario does not hold) would be refused: Rails test.

### 8. The power switch ends the level

`interact` `bay_breaker` (hint "The bay PC has gone quiet."), then `{"cmd":"sync"}`, then open `bay_pc` again.
- Browser: the desktop is refused ("not responding" or "off", as the PC state words it) and the taskbar marker for that session is gone.
- Server: `--access` reads `level none` for `bay_pc`.

### 9. The step up from a typed user session

In the lobby take `card_stale` from `lobby_cabinet`. Plant the drop box again if unplugged. In the view: Sweep `office_lan`, Scan `store_pc`, Check its service, Confirm the finding. Select the finding and the card, Use.
- Browser: "Something this needs is still missing." (no session). Open `store_pc`'s sign-in control, choose the Uma tile and type her password (remote): the desktop opens; close it. Select the finding and the card, Use: success; the host row shows the bolt and the admin tag; the desktop now opens in the remote-view frame with the marker.
- Server: `sessions.store_pc` is `via technique`, `access admin`, the foothold `jack_office_port`, granted by the finding; one `technique_used` row.

### 10. A shared screen never steps up

Sign out of `store_pc` (Start, `#pc-start-signout`). Take `assist_code` from the cabinet. In the view, `store_pc`'s sign-in control lists "Uma's assist code"; connect with it (a relay session: the owner's own screen). Select the finding and the card, Use.
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
