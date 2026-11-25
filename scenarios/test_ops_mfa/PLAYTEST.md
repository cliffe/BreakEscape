# test_ops_mfa: scripted playtest (multi-factor sign-in, S8a, feature A22)

Feature scenario for the second sign-in step. One run in one game, about 40 minutes. Each beat is one click-level step per line, then what the browser shows and what `verify-run.rb` prints.
The scenario is for testing, not play: it names no code, number or password on any sign. Passwords are on the notes in the rooms; the six digits are only ever read from the code device on screen.
The run never computes a code, never types a forged or hand-built request, and waits only where a beat says so: in beat 4 (up to a minute for the device to show a new code, twice) and 3 seconds between sends in beats 10, 11 and 14.

**Three things that hold all through the run.**
- The X on a PC screen closes the desktop and keeps the session. Only Start > Sign out ends a session (Start > Lock locks it). Wherever a beat says "sign out", it means Start > Sign out on the open desktop; if a desktop is left open, reopening that PC shows it at once and the password and the second step are skipped.
- A reload puts the player in the Lobby at the start point (the inventory and the server's record of a pending step are kept; no pane reopens by itself, you click the PC again). A pending step is dropped after five minutes: beats 2 to 3, 5, 8 to 9 and 14 to 15 leave one pending, so do not leave them longer than that, so walk back to the room you were in.
- The desks in the Store room (and Nia) are reached from the south side; from the north the walk stops behind the desk row.

**Not played in the browser (Rails tests):** the plan's F2 (the device route before the device is held, a crafted inventory add), a forged sync body, every hostile case, the exact-second expiry of a pending step, the step ending after the fifth wrong code and the thirtieth wrong code in total, and the refusal of a code after the drop box is unplugged (beat 8 step 4). They are `test/controllers/break_escape/mfa_device_gate_test.rb`, `mfa_code_test.rb`, `mfa_push_test.rb`, `mfa_keyring_test.rb`, `ops_mfa_no_exposure_test.rb`. Every beat below is also played through the real routes by `ops_mfa_scenario_test.rb`.

## Setup

Keyless server on ports 3011 to 3013 (never :3000, :3001, :3002, :3085 or :3086). The scenario has no Mission row until it is seeded, so make the game with the swap script (host scenario `test_access_signin`); do not use `new-game.sh`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
PLAYTEST_PORT=3011 tools/playtest/start-keyless-server.sh
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_mfa   # prints GAME_ID=
S=<scratchpad>/test_ops_mfa
tools/playtest/session-start.sh --url <URL> --headless --log $S/session-<game_id>.jsonl --capture-responses $S/responses-<game_id>.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

Checks after the run and after any beat that says so:

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb --log $S/session-<game_id>.jsonl --access <game_id>
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb --ops-log <game_id>
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> <capture files, oldest first>
```

The recorder tags each sign-in, sign-out, lock and second-step row with its PC, so the leak check needs no `--signin` or `--logout` name for a new run (it exits 2 if you give one). Expected: exit 0 and "no leaks found". Give every capture file of the game, oldest first; a reload keeps the same capture file, a new browser starts a new one. A capture made before recorder 1.0.21 holds no tags: check it with `--untagged`, plus the two names it needs (`--signin hana@code_pc1#1 --signin cal@plain_pc#1`, where each name must match where the tester really signed in; a name that is wrong or whose desktop row is missing exits 2).

**Read the log** (any time): in the lobby, click "Audit log terminal". Rows read `MFA` (challenge, code, prompt, expired) and `SIGN_IN`. No row shows a code or a number. Close it with the X.

## The places and the people

- Lobby: "Network drop box" (take it), "Office wall port" (plant it), "Audit log terminal", "Cabinet by the front door" (holds "Accounts PC.rdp"), a loose "Code device" (it belongs to Ines), "Sign: Start here". Doors: north to the Floor, east to the Store room.
- Floor (network Office): "Accounts PC" (code, Hana only), "Ledger PC" (code, Hana, Ines and the Sync service). Notes with each login. Hana Quill, Ines Brandt, Sync service (exempt from the second step).
- Store room: "Orders PC" (push; Cal and Dev), "Stock PC" (number matching; Nia), "Shipping PC" (no second step; Hana and Cal). Notes with each login. Cal Moss (low awareness, no phone), Dev Kapoor (high awareness, phone offered in his story), Nia Faraday (medium, phone only after a knock-out).


## Beats

### 1. Password, then the pane
1. Walk north to the Floor. Click the note "Note: Hana's login" and read it.
2. Click "Accounts PC". Click the Hana tile, type her password, click Sign in.
- See: the screen swaps to a pane: "Second step for Hana Quill", "Enter the six-digit code from the code device.", a Code field, Verify, "Use a different account". No error line. There is no "Use Code device" button.
- Server: no session at `code_pc1`; log row `mfa_challenge`.

### 2. No device, no button
1. On the pane type `123456`, click Verify.
- See: "Incorrect code. 4 attempts left." Still no "Use" button.
- Server: one `mfa_code_wrong`.

### 3. Handed the device
1. Click X to close the screen. Click Hana Quill, choose "Could I borrow your code device?". She says "Go on then. Bring it back when you are done." and the inventory shows "Code device".
2. Click "Accounts PC" again.
- See: the code pane again (not the password pane), headed "Second step for Hana Quill".
3. Click "Use Code device". The device opens over the screen: the name "Hana Quill", six digits and a bar draining.
4. Click the device's X. The field is now filled with the six digits (it is filled only for a code not yet used). Click Verify.
- See: the desktop opens ("Desktop is empty", Start, Hana Quill, ACC01).
- Server: session via password, no pending record, `mfa_code_ok`, `used` set.
5. Click Start > Sign out. (The screen's X would only close the desktop and keep the session.)

### 4. One code, one use
1. Wait until the device shows a new code: a code's use is kept per account, not per PC, so the code used in beat 3 reads as used at Ledger too until the minute changes. Click "Ledger PC". Click the Hana tile, type her password, click "Use Code device" (if it says "Wait for the next code", close it and wait, then open it again), close it, click Verify. The new code is a first use and passes. Click Start > Sign out.
2. Click "Ledger PC" again at once, Hana tile, password, "Use Code device". The device still shows the same digits, now marked used ("Wait for the next code"). Close it: the field stays empty, because a used code is not filled in. Type the six digits the device showed, click Verify. Start this step as soon as the device shows a new code, so it is still the same minute (a code's window is the clock minute, not 60 seconds from its first use).
- See: "That code has been used. Wait for the next one." The tries left do not change.
3. Click "Use Code device" and watch the bar drain to empty (the second wait, at most a minute); the digits change. Close it (the new digits fill the field), click Verify.
- See: the desktop opens. Click Start > Sign out.

### 5. Drop it
1. Open the inventory, click "Code device", choose "Drop here".
2. Click "Ledger PC", Hana tile, password, Sign in.
- See: the code pane with no "Use Code device" button.
3. Pick the device up from the floor (click it).
- See: reopening "Ledger PC" shows the button again.

### 6. Loose device and the exempt account
1. Go to the Lobby. Click the loose "Code device" (do not meet Ines). It joins the inventory (two devices now).
2. Go to the Floor and read Ines's note and the Sync service note. Click "Ledger PC", click "Use a different account" if a pane is open, click the Ines tile, type her password, click Sign in, click "Use Code device" (owner "Ines Brandt"), close it, click Verify.
- See: the desktop opens for Ines. Click Start > Sign out.
3. Click "Ledger PC", click the Sync service tile, type its password (from its note), click Sign in.
- See: the desktop opens at once, with no pane. Click Start > Sign out.

### 7. Unlock needs no device
1. Sign in as Hana at "Accounts PC" as in beat 3 (device held; if the desktop is still open from beat 3, sign out first). On the desktop click Start > Lock. The desktop closes.
2. Drop the device (beat 5 step 1).
3. Click "Accounts PC": "Locked: Hana Quill. Enter the password to unlock". Type Hana's password only, click Sign in.
- See: the desktop opens straight away, no pane.
- Server: unlocked, no pending record.

### 8. The route is judged again
Played by clicks as far as the Unplug. After that the network view will not open again without a foothold, so the refusal itself is only the Rails test `beat 8` (`ops_mfa_scenario_test.rb`).
1. Pick the device up again (from the floor). Click Start > Sign out. In the Lobby take the "Network drop box" and click "Office wall port": "Plug the drop box into the office port?", click "Plug it in".
- See: the network view "Drop box: Lobby / On Office network, at Office wall port / Unplug". Click Sweep: the computers ACC01, LED01, ORD01, SHP01, STK01.
- Server: a foothold at `office_port`. This starts the clock on Hana's session token (see beat 9).
2. In the network view click the sign-in control at "Accounts PC": the Hana tile shows "Hana Quill / hquill" with a Token option. Click the tile, type her password, click Sign in.
- See: "Second step for Hana Quill", Verify, "Use Code device" (the pane says the sign-in is remote, through the Drop box).
3. Click "Use Code device", close it, go back to the network view and click Unplug.
- See: the view closes. The office port asks "Plug the drop box into the office port?" again; the sign-in control cannot be reopened without a foothold.
4. By clicks: walk to "Accounts PC" and click it. The step began over the drop box, so the keyboard screen does not take it up: it shows the password pane with tiles, not the code pane. The refusal itself (a code sent after the unplug is refused as out of reach, no session) is only in the Rails test `beat 8`.
- If the pane is wanted back: plant the drop box again (beat 9 step 1); the same drop box resumes the pending code pane.

### 9. Token and saved connection
How the token is earned: the keyring entry `hana_token` is proved by the foothold `jack_office_port`, that is, by taking the Network drop box from the Lobby and planting it at the Office wall port (beat 8 step 1). The player does it by clicks and nothing else is needed; the clock (30 minutes) starts at the first plant, so beat 9 has to come within 30 minutes of beat 8. The token option therefore already shows on Hana's tile in beat 8.
1. Plant the drop box again (Lobby, "Office wall port", "Plug it in") and open the network view. Click the sign-in control at "Accounts PC": the pending code pane returns first ("Remote sign-in through Drop box: Lobby"). Click "Use a different account", click the Hana tile: "Session token" and "Connect with / Accounts PC sign-in token" are offered. Click it.
- See: signed in at once, no pane ("Remote session through Drop box: Lobby, with a session token, about 29 min left"). Click Start > Sign out.
2. In the Lobby click "Cabinet by the front door", take "Accounts PC.rdp". (After the drop box was planted the inventory also lists a netlink item for it: that is the plant, not an item to use.)
3. In the network view open the sign-in control at "Accounts PC", click the Hana tile ("Saved connection, Session token"), click "Connect with / Accounts PC saved connection".
- See: the notice "This PC asks for a second step. Type the password to sign in." No session.
4. Type the password, click Sign in.
- See: the code pane ("Second step for Hana Quill").

### 10. Pestering
1. Go to the Store room (read Cal's note). Click "Orders PC", click the Cal tile, type Cal's password.
- See: "Second step for Cal Moss", "A request was sent to Cal Moss's phone.", "Requests sent: 1", "Send again", "Use a different account".
2. Wait 3 seconds, click "Send again".
- See: "Requests sent: 2". Not approved.
3. Reload the page (resume the game). The player is in the Lobby: walk back to the Store room, click "Orders PC".
- See: the password pane with the Cal and Dev tiles (not the request pane).
4. Click the Cal tile, type his password, click Sign in. Do not click Send again: the request sent when the pane opens is the third, and it is approved.
- See: the desktop opens at once ("Desktop is empty", Start, Cal Moss, ORD01). Click Start > Sign out.
- Server: `mfa_prompt_approved` (approver owner); Cal's count back to 0.

### 11. A careful owner
1. Click "Orders PC", click the Dev tile, type Dev's password, click Sign in ("Requests sent: 1").
2. Click "Send again" nineteen more times, each after the 3 second gap (twenty requests in all). Click it once more.
- See: never approved. The next click ends the attempt: "That sign-in timed out. Sign in again." and the password pane returns.
- Server: `mfa_expired`.

### 12. His phone
1. Walk to Dev from the south side. Click Dev Kapoor, choose "Could I borrow your phone for a minute?". He says "Fine. Do not lose it." "Dev's phone" joins the inventory.
2. Click "Orders PC", Dev tile, password, Sign in. Click "Check Dev Kapoor's phone".
- See: the phone opens over the sign-in screen: "AUTHENTICATOR / Are you trying to sign in? / Account dkapoor / Computer ORD01 / Approve / Deny".
3. Click Approve.
- See: "Approved. Close the phone to go back to the PC."
4. Close the phone (its X).
- See: the sign-in screen is back, signed in: the desktop opens (Dev Kapoor, ORD01).
- Server: `mfa_prompt_approved` with approver `held_phone`.

### 13. X is not cancel
1. Click Start > Sign out. Sign in as Hana at "Accounts PC" to the code pane. Click "Use Code device", close it with X.
- See: the code pane is back, the attempt still live, no failure row.
2. Sign in as Dev at "Orders PC" to the request pane. Click "Check Dev Kapoor's phone", close it with X.
- See: the request pane is back ("Requests sent: 1"), still live, no `mfa_expired` or `mfa_prompt_denied` row.

### 14. Number matching, the owner holds the phone
1. Walk to the south side of the Stock PC. Click "Stock PC", click the Nia tile, type her password.
- See: "Second step for Nia Faraday", "A request was sent to Nia Faraday's phone.", "Number: n", "Requests sent: 1", "Send again".
2. Click "Send again" five times, 3 seconds apart.
- See: never approved.

### 15. Number matching, with the phone
1. Knock Nia Faraday out: walk to her from the south and punch (F). Her body itself cannot be clicked (it is out of reach); click "Nia's phone" lying near it and take it. Her hits cost you health, so punch until she falls (about six presses) and no more. Taking the phone opens the OSINT "Browser" minigame at once; close it.
2. Click "Stock PC": the pending request is still there ("Second step for Nia Faraday", the number, "Check Nia Faraday's phone"). Click it. The phone shows "Choose the number shown on the sign-in screen." and three numbers, with Deny. The sign-in screen's number is not visible while the phone is open: note it first (the pane says so once the phone is held).
3. Tap a number that is not the one on the sign-in screen.
- See: the phone says "That number did not match. The request was cancelled." Close it: the password pane with "Request cancelled."
4. Type the password again, click Sign in (a new number appears), note it, click "Check Nia Faraday's phone", tap that number.
- See: "Approved. Close the phone to go back to the PC." Close the phone: the desktop opens (Nia Faraday, STK01).
- Server: one `mfa_prompt_denied`, then `mfa_prompt_approved` (approver `held_phone`).

### The PC with no second step
1. Click "Shipping PC", Cal tile, his password: the desktop opens with no pane. Click Start > Sign out.
2. Five wrong passwords for Cal.
- See: "Incorrect username or password. 4 attempts left." down to "1 attempt left.", then "This account is locked on this PC." (The Shipping PC locks after five wrong passwords; the Orders PC allows eight, so its "attempts left" count starts from 8.) The locked screen has "Use a different account", which returns to the account choice. (Nothing here ever shows a pane.)
- Server: `signin_fail` five times, then `signin_lockout`. Run the three checks in Setup.
