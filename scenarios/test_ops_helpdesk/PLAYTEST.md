# test_ops_helpdesk: scripted playtest (helpdesk recovery, S8b, feature A23)

Feature scenario for helpdesk recovery. One run in one game, about 45 minutes. Each beat is one click-level step per line, then what the browser shows and what `verify-run.rb` prints. The scenario is for testing, not play: no sign names a recovery answer, a reset password or a code. Logins are on the notes in the rooms; the answers are only on the staff file and the team post.

The run never types a forged or hand-built request, never waits five minutes (the desk's stop lifting is a Rails test), and never computes a code. Hostile cases (a crafted request, a repeated grant, a desk that serves a knocked-out NPC, the stop lifting) are Rails tests named in the units 10, 13 and 18 files, not played here.

**Holding for the whole run.**
- The X on a PC screen closes the desktop and keeps the session; only Start > Sign out ends it.
- A reload puts the player at the start point in the Front Office; click the PC again to reopen a pane.
- The form is a paper request: the username field, "Password" or "Second step", and one field per question ("Staff number", "Line manager"). Close it with its Close button.

## Setup

Keyless server on ports 3011 to 3013 (never :3000, :3001, :3002, :3085 or :3086). The scenario has no Mission row until it is seeded, so make the game with the swap script (host scenario `test_access_signin`); do not use `new-game.sh`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
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
- You start with: "Records PC.rdp" (Tess's saved connection), "Your phone" (one contact, the IT service line) and "Your feed phone" (the Friendface feed).

## Beats

### 1. Lock the account
1. Walk east to Records. Click "Note: Tess's login" and read it.
2. Click "Records PC". Click the Tess tile, type a wrong password, click Sign in. Repeat twice more.
- See: a refusal on the first two, "Locked out" on the third.
- Server: a lockout held for Tess at `records_pc`; `--ops-log` prints three `SIGN_IN` fails and a lockout.
3. Click the X on the sign-in screen.

### 2. Refused, then stopped
1. Walk back through the Front Office and north to the Service Desk. Click Ria Vance. Choose "Ask for an account reset". Ria says "Fill in the form and I will look at it." and the "IT request form" opens over the chat.
2. Type Ugo's username (on the "Staff file" in Records, `u.reyes`), choose "Password", type any text in "Staff number" and "Line manager". Click Send.
- See: "Tries left: 2". Close the form: Ria says "I can't verify you."
3. Choose "Ask for an account reset" again, repeat with different wrong answers: "Tries left: 1", then "Tries left: 0".
4. A fourth Send for the same username.
- See: "not taking requests for that account". Ria says "I can't take more requests for that account just now."
- Server: tries 3 for `it_desk|u.reyes`, stopped yes; `HELPDESK` rows refused, refused, refused, blocked.

### 3. An unknown name looks the same
1. Ria, "Ask for an account reset", a username nobody has (for example `z.nobody`), "Password", any answers, Send.
- See: the same refusal line and "Tries left: 2" as the first try of beat 2.

### 4. Find the answers
1. Walk to Records. Click "Staff file" and read it: two staff numbers (Tess and Wim) and the usernames.
2. Open your phone's Friendface ("Your feed phone", inventory): read Nell Brook's team post: two line managers.
- See: the facts on screen. They are public by design.

### 5. The reset
1. Service Desk: Ria, "Ask for an account reset". Type Tess's username, "Password", Tess's staff number and her line manager from beat 4. Send.
- See: "Password reset. New password:" and the password. Close the form: Ria says "That matches our records." The bark "Next, please." shows.
- Open the keyring (K): a "Reset" sign-in for Tess.
- Server: reset password yes for Tess; the lockout at `records_pc` gone; typed no. `ACCT_RESET` row.

### 6. The saved connection is stale
1. Records: click "Records PC". On the sign-in screen choose Tess's saved connection ("Records PC saved connection").
- See: "This password has been changed. Type the new one to sign in." No session.

### 7. Old out, new in
1. Same screen: click the Tess tile, type the OLD password (from her note), Sign in.
- See: refused; one attempt counted.
2. Type the new password from beat 5, Sign in.
- See: signed in at the once-locked PC. Server: typed yes.
3. Start > Sign out. Choose the saved connection again.
- See: it now signs in.

### 8. Asking twice is harmless
1. Service Desk: Ria, "Ask for an account reset", the same request as beat 5. Send.
- See: the same granted form. Server: state unchanged (no second `ACCT_RESET` row).

### 9. Over a PC
1. Front Office: click "Note: Sam's login" and read it. Click "Front PC", click the Sam tile, type the password, Sign in.
2. On the desktop click the "IT request form" icon (it has no picture of its own, so it shows the plain document icon with the name under it).
- See: the "IT request form" window opens over the PC.
3. In "Username" type Wim's username, under "Ask for" choose "A sign-in approval reset", fill "Staff number" and "Line manager" with Wim's staff number and his line manager from beat 4. Click "Send".
- See: "Sign-in approvals now come to your phone."
- Server: reset second step yes for Wim; `ACCT_MFA` row; the request names `front_pc`.
4. Click the close "×" (its label is "Close").
- See: the Front PC desktop is back, with the "IT request form" icon still there.

### 10. My phone, push
1. Service Desk: click "Operations PC", click the Wim tile, type his password (note), Sign in.
- See: the push pane with a "My phone" button.
2. Click "My phone", then Approve on the phone, then close the phone (its Close button).
- See: the sign-in screen reopens signed in. Server: approver `own_phone`.

### 11. No phone, no callback
1. Front Office: click Omar Stack. Choose "Ask for an account reset". The form opens.
2. Type Vera's username (`v.holt`), "Second step". Send.
- See: refused. Close the form: Omar says "I can't verify you."

### 12. With her phone
1. Records: click Vera Holt, choose "Could I borrow your phone for a minute?". "Vera's phone" joins the inventory.
2. Front Office: click Omar, "Ask for an account reset", `v.holt`, "Second step". Send.
- See: "Sign-in approvals now come to your phone." Omar says "That matches our records."
- Server: reset second step yes for Vera.

### 13. My phone, code
1. Records: click "Vault PC", click the Vera tile, type her password (note), Sign in.
- See: the code pane shows "My phone" and no "Use" button.
2. Click "My phone". Read the code on the phone, close the phone.
- See: the code field is filled. Click Verify: signed in. Server: `used` set for Vera.

### 14. The old device
1. Click "Code device" on the Records desk to take it. Open the inventory, click "Code device".
- See: "No longer in use", no digits.

### 15. From a call
1. Open "Your phone" (inventory). Ring "IT service line". If a preparation card shows, start the call.
2. Choose "Request a reset".
- See: the form opens when the ask is granted. Close it without sending.

### 16. Checks
1. Run the leak check and `verify-run.rb` above.
- See: no leak; the per-account and per-desk lines match beats 2, 5, 7, 9 and 12.
