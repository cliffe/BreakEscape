# test_ops_mfa: scripted playtest (multi-factor sign-in, S8a, feature A22)

Feature scenario for the second sign-in step. One run in one game, about 40 minutes. Each beat is one click-level step per line, then what the browser shows and what `verify-run.rb` prints.
The scenario is for testing, not play: it names no code, number or password on any sign. Passwords are on the notes in the rooms; the six digits are only ever read from the code device on screen.
The run never computes a code, never types a forged or hand-built request, and never sleeps except for the one wait in beat 4.

**Not played in the browser (Rails tests):** the plan's F2 (the device route before the device is held, a crafted inventory add), a forged sync body, every hostile case, the exact-second expiry of a pending step, lockout after the fifth wrong code and the thirtieth wrong code in total. They are `test/controllers/break_escape/mfa_device_gate_test.rb`, `mfa_code_test.rb`, `mfa_push_test.rb`, `mfa_keyring_test.rb`, `ops_mfa_no_exposure_test.rb`. Every beat below is also played through the real routes by `ops_mfa_scenario_test.rb`.

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

Checks after the run and after any beat that says so (`verify-run.rb` for this scenario is unit 23's; until it lands, read the rows at the audit terminal, step "Read the log" below):

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --ops-log
```

**Read the log** (any time): in the lobby, click "Audit log terminal". Rows read `MFA` (challenge, code, prompt, expired) and `SIGN_IN`. No row shows a code or a number. Close it with the X.

## The places and the people

- Lobby: "Network drop box" (take it), "Office wall port" (plant it), "Audit log terminal", "Cabinet by the front door" (holds "Accounts PC.rdp"), a loose "Code device" (it belongs to Ines), "Sign: Start here". Doors: north to the Floor, east to the Store room.
- Floor (network Office): "Accounts PC" (code, Hana only), "Ledger PC" (code, Hana, Ines and the Sync service). Notes with each login. Hana Quill, Ines Brandt, Sync service (exempt from the second step).
- Store room: "Orders PC" (push; Cal and Dev), "Stock PC" (number matching; Nia), "Shipping PC" (no second step; Hana and Cal). Notes with each login. Cal Moss (low awareness, no phone), Dev Kapoor (high awareness, phone offered in his story), Nia Faraday (medium, phone only after a knock-out).

## Beats

### 1. Password, then the pane
1. Walk north to the Floor. Click the note "Note: Hana's login" and read it.
2. Click "Accounts PC". Click the Hana tile, type her password, click Sign in.
- See: the screen swaps to a pane asking for a six-digit code, with no error line. There is no "Use Code device" button.
- Server: no session at `code_pc1`; log rows `mfa_challenge`.

### 2. No device, no button
1. On the pane type `123456`, click Verify.
- See: "That did not work." with the tries left. Still no "Use" button.
- Server: one `mfa_code_wrong`.

### 3. Handed the device
1. Click X to close the screen. Click Hana Quill, choose "Could I borrow your code device?". She hands it over; the inventory shows "Code device".
2. Click "Accounts PC" again.
- See: the code pane again (not the password pane).
3. Click "Use Code device". The device opens over the screen: a name, six digits and a bar draining.
4. Click the device's X. The field is now filled with the six digits. Click Verify.
- See: the desktop opens.
- Server: session via password, no pending record, `mfa_code_ok`, `used` set.

### 4. One code, one use
1. Click the screen's X (sign out) and click "Ledger PC". Click the Hana tile, type her password.
2. Click "Use Code device", close it, click Verify within the same minute.
- See: "That code has been used. Wait for the next one." The tries left do not change.
3. Click "Use Code device" and watch the bar drain to empty (the one wait, at most 60 seconds); the digits change. Close it, click Verify.
- See: the desktop opens.

### 5. Drop it
1. Sign out. Open the inventory, drag "Code device" to the floor (or use Drop).
2. Click "Ledger PC", sign in as Hana to the pane.
- See: no "Use Code device" button.
3. Pick the device up from the floor (click it).
- See: the button is back.

### 6. Loose device and the exempt account
1. Go to the Lobby. Click the loose "Code device" (do not meet Ines). It joins the inventory.
2. Go to the Floor. Click "Ledger PC", click the Ines tile, type her password (from her note), click "Use Code device", close it, click Verify.
- See: the desktop opens for Ines. Sign out.
3. Click "Ledger PC", click the Sync service tile, type its password (from its note), click Sign in.
- See: the desktop opens at once, with no pane.

### 7. Unlock needs no device
1. Sign in as Hana at "Accounts PC" as in beat 3 (device held). On the desktop click Lock.
2. Drop the device (beat 5 step 1).
3. Click "Accounts PC", type Hana's password only, click Sign in.
- See: unlocked straight away, no pane.
- Server: unlocked, no pending record.

### 8. The route is judged again
1. Pick the device up again. Sign out. In the Lobby take the "Network drop box" and plant it at "Office wall port" (confirm).
2. In the network view click the sign-in control at "Accounts PC", click the Hana tile, type her password.
- See: the code pane.
3. Click "Use Code device", close it. Go back to the network view and click Unplug. Reopen the sign-in control at "Accounts PC": the pane is still waiting (the PC is no longer reachable, so it may offer nothing; if it does, continue).
4. Type the six digits and click Verify.
- See: refused as out of reach; no session. (If the network view will not reopen without a foothold, record that and run the check as the Rails test `beat 8`.)

### 9. Token and saved connection
1. Plant the drop box again. In the network view open the sign-in control at "Accounts PC" and click the Hana tile: "Connect with / Accounts PC sign-in token" is offered. Click it.
- See: signed in at once, no pane. Sign out.
2. In the Lobby click "Cabinet by the front door", take "Accounts PC.rdp".
3. In the network view open the sign-in control at "Accounts PC", click the Hana tile, click "Connect with / Accounts PC saved connection".
- See: the notice "This PC asks for a second step. Type the password to sign in." No session.
4. Type the password.
- See: the code pane.

### 10. Pestering
1. Go to the Store room. Click "Orders PC", click the Cal tile, type Cal's password (from his note).
- See: a pane saying a request was sent to Cal, "Requests sent: 1", "Send again".
2. Wait 3 seconds, click "Send again".
- See: "Requests sent: 2". Not approved.
3. Reload the page (resume the game). Click "Orders PC".
- See: the password pane (not the request pane).
4. Click the Cal tile, type his password, click Sign in. Click "Send again" once (after the 3 second gap).
- See: the desktop opens (the owner's count survived the reload: this is the third request). Sign out.
- Server: `mfa_prompt_approved` (approver owner); Cal's count back to 0.

### 11. A careful owner
1. Click "Orders PC", click the Dev tile, type Dev's password.
2. Click "Send again" about twenty times, each after the 3 second gap.
- See: never approved. At the cap the attempt ends: "That sign-in timed out. Sign in again." and the password pane returns.
- Server: `mfa_expired`.

### 12. His phone
1. Click Dev Kapoor, choose "Could I borrow your phone for a minute?". "Dev's phone" joins the inventory.
2. Click "Orders PC", Dev tile, password. Click "Check Dev's phone".
- See: the phone opens over the sign-in screen with a request card (host ORD01, user dkapoor).
3. Click Approve.
- See: the sign-in screen reopens signed in.
- Server: `mfa_prompt_approved` with approver `held_phone`.

### 13. X is not cancel
1. Sign out. Sign in as Hana at "Accounts PC" to the code pane. Click "Use Code device", close it with X.
- See: the code pane is back, the attempt still live, no failure row.
2. Sign in as Dev at "Orders PC" to the request pane. Click "Check Dev's phone", close it with X.
- See: the request pane is back, still live, no `mfa_expired` or `mfa_prompt_denied` row.

### 14. Number matching, the owner holds the phone
1. Click "Stock PC", click the Nia tile, type her password.
- See: a pane showing a number ("Number: n"), "Send again".
2. Click "Send again" five times, 3 seconds apart.
- See: never approved.

### 15. Number matching, with the phone
1. Knock Nia Faraday out (attack her). Click her fallen body and take "Nia's phone".
2. Click "Stock PC", Nia tile, password. Click "Check Nia's phone". The phone shows the request with three numbers.
3. Tap a number that is not the one on the sign-in screen.
- See: "Request cancelled." and the password pane.
4. Type the password again, click "Check Nia's phone", tap the number the sign-in screen shows.
- See: the sign-in screen reopens signed in.
- Server: one `mfa_prompt_denied`, then `mfa_prompt_approved` (approver `held_phone`).

### The PC with no second step
1. Click "Shipping PC", Cal tile, his password: the desktop opens with no pane. Sign out.
2. Five wrong passwords for Cal.
- See: locked out. (Nothing here ever shows a pane.)
