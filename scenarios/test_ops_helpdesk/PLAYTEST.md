# test_ops_helpdesk: scripted playtest (helpdesk recovery, S8b, feature A23)

Feature scenario for helpdesk recovery. One run in one game, about 45 minutes. Each beat is one click-level step per line, then what the browser shows and what `verify-run.rb` prints. The scenario is for testing, not play: no sign names a recovery answer, a reset password or a code. Logins are on the notes in the rooms; the answers are only on the staff file and the team post.

The run never types a forged or hand-built request, never waits five minutes (the desk's stop lifting is a Rails test), and never computes a code. Hostile cases (a crafted request, a repeated grant, a desk that serves a knocked-out NPC, the stop lifting) are Rails tests named in the units 10, 13 and 18 files, not played here.

**Holding for the whole run.**
- The X on a PC screen closes the desktop and keeps the session; only Start > Sign out ends it.
- A reload puts the player at the start point in the Front Office; click the PC again to reopen a pane.
- The counter in the Front Office (about x 280, y 130) blocks the direct walk to the Records door, and the Service Desk's south door has the same counter. Walk round the west end of it and approach the door from about (283, 81); a straight line ends with `did-not-cross`.
- After a form closes, the desk NPC speaks its scripted verdict first ("That matches our records.", "I can't verify you.", "I can't take more requests for that account just now.", or "I can't do that one." when nothing was sent), then "Anything else?" replaces it with the choices. The verdict is on screen only for its reading time, so look straight after the close. The headless chat test `helpdesk-ink-tag.test.mjs` proves the order; the second browser playtest (commit 65b993fe1) saw only "Anything else?", so say which you saw. The bark "Next, please." shows only after you leave the chat.
- The form is a paper request: the "Username" field, an "Ask for" choice ("A password reset" or "A sign-in approval reset") only when the desk does both, and one field per question ("Staff number", "Line manager"). Close it with its Close button.

## Setup

Keyless server on ports 3011 to 3013 (never :3000, :3001, :3002, :3085 or :3086). The scenario has no Mission row until it is seeded, so make the game with the swap script (host scenario `test_access_signin`); do not use `new-game.sh`.

```bash
# `/opt/rbenv` does not exist on this host: use the ruby on your PATH (2.7.x). The swap script prints only `GAME_ID=`.
PLAYTEST_PORT=3011 tools/playtest/start-keyless-server.sh
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_helpdesk   # prints GAME_ID=
S=<scratchpad>/test_ops_helpdesk
tools/playtest/session-start.sh --url <URL> --headless --log $S/session-<game_id>.jsonl --capture-responses $S/responses-<game_id>.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

Checks after the run and after any beat that says so:

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb --log $S/session-<game_id>.jsonl --access <game_id>
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb --ops-log <game_id>
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> <capture files, oldest first>
```

**Read the log** (any time): in the Front Office click "Audit log terminal". Rows read `HELPDESK` (request, result), `ACCT_RESET`, `ACCT_MFA`, `SIGN_IN` and `MFA`. No row shows a password, an answer or a code. Close it with the X.

## The places and the people

- Front Office (start): "Front PC" (Sam; its desktop holds "IT request form"), "Note: Sam's login", "Audit log terminal", "Sign: Start here", Sam Okoro, Omar Stack (the identity desk, `id_desk`). Doors: north to the Service Desk, east to Records.
- Service Desk: "Operations PC" (push; Wim only), "Note: Wim's login", Ria Vance (the IT desk, `it_desk`), Wim Duarte (high awareness, no phone).
- Records: "Records PC" (three tries then locked; Tess and Ugo), "Vault PC" (code; Vera), notes with each login, "Staff file", a loose "Code device" (Vera's), Tess Ama, Ugo Reyes, Vera Holt.
- You start with: "Capture log" (the Sign-ins list), "Records PC.rdp" (Tess's saved connection; opened with Connect from the inventory), "Your phone" (one contact, the IT service line) and "Your feed phone" (the Friendface feed).

## Beats

The order matters to the leak scanner: a desk stop (beat 14) stops credit for every grant for five minutes, and the run never waits that long, so the refusals and the stop come last and no grant follows them.

### 1. Lock the account
1. Walk east to Records. Click "Note: Tess's login" and read it.
2. Click "Records PC". Click the Tess tile, type a wrong password, click Sign in. Repeat twice more.
- See: a refusal on the first two, "This account is locked on this PC" on the third.
- Server: a lockout held for Tess at `records_pc`; `--ops-log` prints three `SIGN_IN` fails and a lockout after this beat. In the full run it ends with four `signin_fail` rows at `records_pc`: the fourth is beat 5's old-password refusal, which lands on the same row as beat 1's.
3. Click the X on the sign-in screen.

### 2. Find the answers
1. Walk to Records. Click "Staff file" and read it: two staff numbers (Tess and Wim) and the usernames.
2. Open your phone's Friendface ("Your feed phone", inventory): read Nell Brook's team post: two line managers.
- See: the facts on screen. They are public by design.

### 3. The reset
1. Service Desk: Ria, "Ask for an account reset". Type Tess's username, "A password reset", Tess's staff number and her line manager from beat 2. Send.
- See: "Password reset. New password:" and the password. Close the form: Ria says "That matches our records." (briefly, then "Anything else?"). The bark "Next, please." shows only after you leave the chat.
- The form note says where it is kept: under Sign-ins in your capture log, and on the sign-in screen. Open the inventory, click "Capture log": under Sign-ins a row for Tess, tagged "Reset password" and "Issued", shows the new password, with no reload. (The sign-in tile on the PC says "Reset"; the capture log row says "Reset password".)
- Server: reset password yes for Tess; the lockout at `records_pc` gone; typed no. `ACCT_RESET` row.

### 3b. Sign in at the Front PC
The saved connection has no foothold: its only route is from a PC you are signed in at, so sign in at the Front PC first.
1. Front Office: click "Note: Sam's login" and read it. Click "Front PC", click the Sam tile, type the password, Sign in. Click the X (it keeps the session).
- See: back on the room, session held at the Front PC.

### 4. The saved connection is stale
1. Open the inventory, click "Records PC.rdp", choose "Connect".
- See: a notice titled "Records PC.rdp": "This password has been changed. Type the new one to sign in." (not an error). No desktop opens and no session starts.

### 5. Old out, new in
1. Records: click "Records PC". Click the Tess tile (it has a "Reset" tag and fills the new password: clear the field), type the OLD password (from her note), Sign in.
- See: refused; one attempt counted.
2. Type the new password from beat 3, Sign in.
- See: signed in at the once-locked PC. Server: typed yes.
3. Start > Sign out. Open the inventory, click "Records PC.rdp", choose "Connect".
- See: it now signs in: the Records PC desktop opens from the Front PC.

### 6. Asking twice is harmless
1. Service Desk: Ria, "Ask for an account reset", the same request as beat 3. Send.
- See: the same granted form. Server: state unchanged (no second `ACCT_RESET` row).

### 7. Over a PC
1. Front Office: click "Front PC" (the session from beat 3b is held, so the desktop opens). If it asks, click the Sam tile, type the password, Sign in.
2. On the desktop click the "IT request form" icon (it has no picture of its own, so it shows the plain document icon with the name under it).
- See: the "IT request form" window opens over the PC.
3. In "Username" type Wim's username, under "Ask for" choose "A sign-in approval reset", fill "Staff number" and "Line manager" with Wim's staff number and his line manager from beat 2. Click "Send".
- See: "Sign-in approvals now come to your phone."
- Server: reset second step yes for Wim; `ACCT_MFA` row; the audit log names the desk `it_desk`, not `front_pc` (that is what it shows today).
4. Click the close "×" (its label is "Close").
- See: the Front PC desktop is back, with the "IT request form" icon still there.

### 8. My phone, push
1. Service Desk: click "Operations PC", click the Wim tile, type his password (note), Sign in.
- See: the push pane with a "My phone" button.
2. Click "My phone", then Approve on the phone, then close the phone (its Close button).
- See: the sign-in screen reopens signed in. Server: approver `own_phone`.

### 9. No phone, no callback
1. Front Office: click Omar Stack. Choose "Ask for an account reset". The form opens.
2. Type Vera's username (`v.holt`). Omar's form has no "Ask for" choice (his desk resets the second step only). Send.
- See: "The desk could not verify you. Tries left: 2." Close the form: Omar says "I can't verify you." (briefly, then "Anything else?").

### 10. With her phone
1. Records: click Vera Holt, choose "Could I borrow your phone for a minute?". "Vera's phone" joins the inventory.
2. Front Office: click Omar, "Ask for an account reset", `v.holt`. Send.
- See: "Sign-in approvals now come to your phone." Omar says "That matches our records." (briefly, then "Anything else?").
- Server: reset second step yes for Vera.

### 11. My phone, code
1. Records: click "Vault PC", click the Vera tile, type her password (note), Sign in.
- See: the code pane shows "My phone" and no "Use" button.
2. Click "My phone". Read the code on the phone, close the phone.
- See: the code field is filled. Click Verify: signed in. Server: `used` set for Vera.

### 12. The old device
1. Click "Code device" on the Records desk to take it. Open the inventory, click "Code device".
- See: "No longer in use", no digits.

### 13. From a call
1. Open "Your phone" (inventory). Click the contact "IT service line". (The `it_line` NPC carries `callId: "it_line_call"`, so the click opens the preparation card, not a plain chat.)
- See: a preparation card first. Title "Prepare the call", "Calling: IT service line", "Nothing on the board yet." and the button "Make the call", enabled with nothing held.
2. Click "Make the call". The call menu shows "1. Request a reset" and "2. Hang up".
3. Click "Request a reset". Ink says "Right, here is the form."; about a second later the form "IT request form" opens over the call (desk `it_desk`, no PC).
- See: the form opens once. Close it without sending (the "×" Close): back in the same call. The call's ask line reads "ASK OK needs -30 or better, now at 0." with no "The desk put the form through.", the `helpdesk_it_desk_result` global stays empty, no request is in the audit log, and hanging up shows no "You got what you came for." (the ask is not done).
4. Hang up, make the call again, open the form and send the same granted request as beat 3.
- See: the answer line and the `helpdesk_it_desk_result` global set; after the form closes the ask line reads "ASK OK ... The desk put the form through." and hanging up shows "You got what you came for.".

### 14. Refused, then stopped
1. Walk to the Service Desk. Click Ria Vance. Choose "Ask for an account reset". Ria says "Fill in the form and I will look at it." and the "IT request form" opens over the chat.
2. Type Ugo's username (on the "Staff file" in Records, `u.reyes`), choose "A password reset", type any text in "Staff number" and "Line manager". Click Send.
- See: "Tries left: 2". Close the form: Ria says "I can't verify you."
3. Choose "Ask for an account reset" again, repeat with different wrong answers: "Tries left: 1", then "Tries left: 0".
4. A fourth Send for the same username.
- See: "not taking requests for that account". Ria says "I can't take more requests for that account just now."
- Server: tries 3 for `it_desk|u.reyes`, stopped yes; `HELPDESK` rows refused, refused, refused, blocked.

### 15. An unknown name looks the same
1. Ria, "Ask for an account reset", a username nobody has (for example `z.nobody`), "A password reset", any answers, Send.
- See: the same refusal line and "Tries left: 2" as the first try of beat 14.

### 16. Checks
1. Run the leak check and `verify-run.rb` above.
- See: no leak; the per-account and per-desk lines match beats 3, 5, 7, 10 and 14.
