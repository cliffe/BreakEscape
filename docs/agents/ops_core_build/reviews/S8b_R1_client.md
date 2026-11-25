# S8b review, round 1: client, scenario, ink, playtest script and docs

Branch `ops-helpdesk` at `08d6d11c1`; the stage is every commit since `git merge-base main ops-helpdesk`.
Area: `public/break_escape/js` helpdesk files, CSS, `scenarios/test_ops_helpdesk/`, the JS tests and
lint, and the unit 25 docs. No code was changed. Scratch scripts are named where their output is quoted;
they load the real modules from the tree and stub only the network.

Counts: 2 blockers, 1 major, 5 minor.

## Findings

### R1-CLIENT1 (blocker): PLAYTEST beats 4 and 5 step 3 cannot be played by clicking

`scenarios/test_ops_helpdesk/PLAYTEST.md` beat 4 says: "Records: click "Records PC". On the sign-in
screen choose Tess's saved connection". Beat 5 step 3 says "Choose the saved connection again".
No such choice exists on that screen, and at that point in the run no other click path works either.

Evidence:
- The keyboard sign-in screen takes passwords only from the keyring:
  `public/break_escape/js/minigames/password/password-minigame.js:2410`
  (`s.keyring = ... keyring.filter(e => e?.kind === 'password')`) and the comment at `:448`
  ("passwords only reach this screen"). A `saved_connection` entry never becomes a button there.
- The server refuses a saved connection with no route: `lib/break_escape/credential_model.rb:23`
  (`routes: %w[foothold from]`) and `app/models/break_escape/credential_login.rb:223-228`
  (exactly one of `foothold`, `from`, `relay` must be given and allowed).
- The scenario has no foothold. The validator says so itself
  (`ruby scripts/validate_scenario.rb scenarios/test_ops_helpdesk/scenario.json.erb --no-graph`):
  `35. WARNING: credentials: credential 'tess_saved' is a saved_connection but no foothold or access point can reach its connectsTo.`
- The only route is `from` a PC the player is signed in at
  (`credential_keyring.rb:508-512`, `network_access.rb:1398-1399`). The Rails test for these beats signs
  in at the Front PC first (`test/controllers/break_escape/ops_helpdesk_scenario_test.rb:293`,
  `sign_in('front_pc', *SAM)`, then `from: 'front_pc'`). In PLAYTEST.md the Front PC sign-in is beat 7,
  after beats 4 and 5.

What a player sees today, following the script: at the Records PC sign-in screen there is the Tess
tile and a password field, nothing about a saved connection. The only way to use the file is the
inventory: click "Records PC.rdp", choose Connect. With no session anywhere the keyring entry has no
route, so `keyring.js:642-643` shows the toast "REC01 can't be reached from here. You need a way onto
its network." (`utils/remote-host-text.js:156`). No "password has been changed" line, no sign-in.

Fix (`scenarios/test_ops_helpdesk/PLAYTEST.md`, and R1-CLIENT2 must land with it):
1. Before beat 4 add the Front PC sign-in (read "Note: Sam's login", click "Front PC", Sam tile,
   password, Sign in, then the X, which keeps the session). Beat 7 then starts from "click Front PC".
2. Rewrite beat 4 step 1 as: open the inventory, click "Records PC.rdp", choose "Connect".
3. Rewrite beat 5 step 3 the same way (after Start > Sign out at the Records PC: inventory,
   "Records PC.rdp", Connect; see the Records PC desktop open from the Front PC).
4. Change the server test's beat comments only if the beat numbers move.
5. Add one line to the scenario click-path test (`test/js/helpdesk-scenario-click-paths.test.mjs`,
   test "the locked account") asserting that `front_pc` and `records_pc` are on the same network, so
   the `from` route the script relies on is pinned.

### R1-CLIENT2 (blocker): the stale saved connection shows "Connect could not reach the game server", never the "password has been changed" line

Even with a session at the Front PC (the fix above), the only click path to the saved connection is
Connect from the inventory, and that path has no branch for the `typeToSignIn` refusal.
`public/break_escape/js/systems/keyring.js:677-694`: only `kind_refused` and `locked_out` open the
sign-in screen; everything else goes to `credentialRefusalLine(reason, ...)`, which has no case for
`type_to_sign_in` (`utils/remote-host-text.js:225-237`) and returns null, so the toast is
`CONNECT_FAILED_TEXT`. The line "This password has been changed. Type the new one to sign in."
(`pc-sessions.js:172-175`) is shown only by `PasswordMinigame.useCredential`
(`password-minigame.js:2592-2595`), a button on a remote sign-in screen that this scenario gives no
way to reach before the refusal.

Ran (scratch `s8b-r1/connect-changed.test.mjs`: the setup of `test/js/keyring-client.test.mjs`
lines 1-130, real `keyring.js`, `pc-sessions.js`, `remote-host-text.js`; the entry's route is
`{ from: 'front_pc' }` and `POST /login` answers 422 `{ success: false, typeToSignIn: 'password_changed' }`):

```
OUTCOME {"outcome":"type_to_sign_in","message":"Connect could not reach the game server. Try again."}
TOASTS [["Connect could not reach the game server. Try again.","error","HB-FIN-02.rdp",4000,{"plainText":true}]]
SCREENS 0  POSTS [["post","lena_pc","k_rdp",{"from":"front_pc"}]]
```

The message is false (the server answered) and it is an error toast, where the brief and
`docs/ACCESS_AND_NETWORKS.md` A23 promise the notice. The same gap exists on `main` for S8a's
`typeToSignIn: 'second_step'` (`keyring.js` is unchanged in this stage), but S8b makes it a
headline beat.

Fix (`public/break_escape/js/systems/keyring.js`, `_connect`, before the `saved_connection` branch at
`:679`): `if (reason === 'type_to_sign_in') return toast(result.message || t.CONNECT_FAILED_TEXT, 'type_to_sign_in', 'info');`
(`result.message` is already `typeToSignInMessage(why)` from `pc-sessions.js:812`). Add a test to
`test/js/keyring-client.test.mjs` for both reasons (`password_changed` read from the shared fixture
entry `keyring.password_changed`, and `second_step`): one info toast with the exact line, one POST, no
desktop, no sign-in screen. Then state in PLAYTEST beat 4 that the line appears as a notice titled
"Records PC.rdp".

### R1-CLIENT3 (major): the reset password is shown nowhere after the form closes; "It is in your sign-ins." is untrue and "Open the keyring (K)" has no click path

The form's note (`helpdesk-request-minigame.js:28`, `passwordNote: 'It is in your sign-ins.'`),
PLAYTEST beat 3 ("Open the keyring (K): a "Reset" sign-in for Tess"), README row A23 ("the keyring
lists it") and `docs/ACCESS_AND_NETWORKS.md` A23 ("the keyring lists it as a "Reset" sign-in") all
describe something the client does not do.

Evidence:
- There is no K key and no keyring panel. The only list of sign-ins is the capture log's "Sign-ins"
  section, opened from a held `capture_log` item (`minigames/capture-log/capture-log-model.js:17`).
  `scenarios/test_ops_helpdesk/scenario.json.erb` has no `capture_log` item
  (`grep -n capture_log` gives nothing; `test_access_keyring` has one at its line 91).
- No client file was changed for the new entry (`source: 'helpdesk'`, `how: 'issued'`,
  `helpdesk_access.rb:116-124`), so it is treated as a password found in a file:
  `keyring.js:345-349` (`foundVisible`: a non-capture password is visible only if it was in the
  page-start answer or its `foundIn` file was opened; this entry has no `foundIn`),
  `signin-rows.js:41-42` (unknown `how` falls back to "Found") and `:242-244`
  ("A password in a file alone: never the value"), `password-minigame.js:441-444` and `:416-420`
  (tag kind `in_file`; only `captured` fills `keyPassword`).

Ran (scratch `s8b-r1/rows.mjs`: real `signin-rows.js` and `keyring.js` on the shared fixture entry
`keyring.reset_entry`):

```
foundVisible before reload: false
rows same page: []
rows after reload: [{"kinds":["in_file"],"sources":["Found"],"use":"Type it from Reset."}]
```

So in the page where the desk granted it, no row and no tile tag appears. After a reload a holder of
a capture log would see "Password in a file", "Found", "Type it from Reset." with no value, and the
sign-in tile would say "Type the password from / Reset". The value the server sends in `GET /keyring`
is never drawn. A player who closes the form without noting the password can only ask the desk again.

Fix:
1. `public/break_escape/js/systems/keyring.js` `foundVisible`: return true for
   `entry.source === 'helpdesk'`.
2. `public/break_escape/js/utils/remote-host-text.js`: add `issued: 'Issued'` to `SOURCE_TAG_TEXT`
   and a tag `reset: { tag: 'Reset', full: 'Reset password', group: 'key' }` to `TAG_TEXT`.
3. `public/break_escape/js/minigames/capture-log/signin-rows.js`: for a password entry with
   `source === 'helpdesk'` push kind `reset`, and set the row's `value` and `use` to `e.password`
   (the server has already handed it over; it replaces the "Type it from" line).
4. `public/break_escape/js/minigames/password/password-minigame.js` `keyringTagKind` and
   `mergeRemoteTiles`: a `helpdesk` password entry gives tag `reset` and fills `tile.keyPassword`
   as `captured` does.
5. `scenarios/test_ops_helpdesk/scenario.json.erb`: add a `capture_log` item to
   `startItemsInInventory` (copy the `test_access_keyring` entry). PLAYTEST beat 3: replace
   "Open the keyring (K)" with "open the capture log (inventory): under Sign-ins, a "Reset" row for
   Tess showing the new password".
6. Tests: a `signin-rows` case and a sign-in tile case built from `answer('keyring.reset_entry')`;
   add both files to the lint list in `helpdesk-no-handwritten-answers.test.mjs`.
If the owner would rather the password be shown once only, see "For the owner": then the note, the
PLAYTEST line and both docs must say so instead.

### R1-CLIENT4 (minor): Close while a request is in flight drops a granted password and the chat voices the wrong line

`helpdesk-request-minigame.js:198-208`: Send is disabled while `_sending`, Close and Escape are not.
On close `cleanup()` sets `_closed`, and `_send` returns at `if (this._closed) return;` without
showing the answer. The chat has already resumed with the global still empty, so Ria says "I can't do
that one." (`ink/ria.ink` verdict, else branch) while the server may have granted and written the
reset; the client then sets `helpdesk_it_desk_result` to `granted` after the line was voiced. By
reading; not run.

Fix (`helpdesk-request-minigame.js`): override `requestClose()` to do nothing while `this._sending`
(and set `aria-disabled` on the close control for that time); add a test to
`test/js/helpdesk-request.test.mjs` with a client whose `send` resolves late.

### R1-CLIENT5 (minor): whether an approval is "own" is taken from a memory note, not from the phone that was opened

`public/break_escape/js/systems/mfa-client.js:296-302`: `approve` adds `?own=1` only when
`pendingBySubject` holds a note with `ownPhone` for that subject. The own phone lists the requests
of every re-enrolled account (`GET /mfa/phone?own=1`), including one whose note is gone (a reload,
or `reset()`); a tap on that card is posted without `own` and the server refuses it as "no such
phone", which the scene words as "You are not holding this phone."
(`authenticator-live-minigame.js:105`), wrong for "My phone".

Ran (scratch `s8b-r1/own-note.mjs`, real `mfa-client.js`, after `reset()`):

```
[["GET","mfa/phone","{\"own\":1}"],["POST","mfa/approve","{\"pc_id\":\"ops_pc\"}"]] "no_phone"
```

Fix: `mfa-client.js` `approve(subject, { number, deny, own })`: send the query when
`own === true || note.ownPhone === true`; `authenticator-live-minigame.js:166` passes
`own: this.own`; at `:105` say "The phone cannot connect." when `this.own`. Add the case to
`test/js/own-phone-scenes.test.mjs`.

### R1-CLIENT6 (minor): PLAYTEST quotes text the game does not show

- Beat 1: `See: ... "Locked out" on the third.` The line is "This account is locked on this PC"
  (`app/models/break_escape/game.rb:3134`, `password-minigame.js:3180`). No client string is "Locked out".
- Beat 3: "Open the keyring (K)" (see R1-CLIENT3).
Fix: `scenarios/test_ops_helpdesk/PLAYTEST.md`, quote the real line in beat 1.

### R1-CLIENT7 (minor): docs statements that do not match the code

`docs/ACCESS_AND_NETWORKS.md`, section A23:
- "Shown in. `test_ops_helpdesk` (two desks, five accounts, three PCs of different kinds": there are
  four sign-in PCs (`ops_helpdesk_scenario_test.rb:172` lists `front_pc`, `ops_pc`, `records_pc`,
  `vault_pc`).
- "Known limits. The recovery answers inside arrays are not caught by the leak scanner": stale since
  `08d6d11c1` (`tools/playtest/lib/helpdesk_leak_rules.rb:192`, rule `helpdesk:recovery:array`). The
  limit that remains is an answer split across two keys or arrays.
- "Three ways to open the form", item 1: say that `helpdesk_<deskId>_result` is written by the
  browser (`helpdesk-client.js:131`) and synced like any global, so a lock, objective or door must
  never be gated on it; it is for the NPC's next line only.
- "the keyring lists it as a "Reset" sign-in": true of the `GET /keyring` answer, not of anything the
  player sees until R1-CLIENT3 is fixed.
`README_scenario_design.md` row A23: "a saved connection must be retyped" reads as if the connection
is typed; write "a saved connection is refused until the new password has been typed once".

### R1-CLIENT8 (minor): the hand-written-answer lint misses one stage test file

`test/js/helpdesk-no-handwritten-answers.test.mjs:12-15` lists eight files;
`test/js/helpdesk-client-wiring.test.mjs` (a client test of this stage that serves a helpdesk answer
at its line 70) is not on it. It reads the fixture today, so nothing is wrong yet; the lint would not
catch a later hand-written answer there. Fix: add `helpdesk-client-wiring` to `FILES`.

## Checked and found sound

- JS tests of the area all pass here (node 22.11): `helpdesk-client` 13, `helpdesk-client-wiring` 3,
  `helpdesk-desktop-form` 4, `helpdesk-ink-tag` 9, `helpdesk-no-handwritten-answers` 9,
  `helpdesk-pretext-open` 9, `helpdesk-request` 23, `helpdesk-scenario-click-paths` 9,
  `helpdesk-answer-shapes` 5, `mfa-client-own` 12, `mfa-signin-my-phone` 11, `own-phone-scenes` 10,
  `playtest-shellx-open-wait` ok (the pinned list is 18 and names `helpdesk-request`).
- Every test that copies `systems/pc-sessions.js` also copies `systems/helpdesk-client.js` (the three
  files that match "pc-sessions" without it only mention it in comments).
- The client decides nothing: `helpdesk-client.js` maps status and `reason` to a result and nothing
  else; the form reads only `what`, `triesLeft`, `retryIn`, `password` from the body; no rule, count
  or state key is held client side.
- The password: shown in `.hr-password` through `textContent`, cleared in `cleanup()`, absent from
  `closeResult()`, `getTestState()`, the global, both events and module state; `ApiClient.post` logs
  nothing; the desktop opener logs the item, which has no secret.
- The result global is set on every answered send (`granted`, `refused`, `blocked`, `unavailable`,
  `error`); Ria's and Omar's ink clear it before the tag, so a close without sending reaches the else
  line (test "a form closed without sending").
- Ink tag path: beats 3, 6, 9, 10, 14, 15 trace from the choice "Ask for an account reset" to
  `POST /helpdesk/request` with `desk_id` and no `pc_id`; the chat resumes at the verdict.
- Desktop path (beat 7): icon "IT request form", `pc_id: front_pc`, Close returns to the desktop
  with focus on the icon; the item is never takeable.
- Call path (beat 13): card, "Make the call", "Request a reset", the form once; a second ask in the
  same call after closing opens it again (scratch `s8b-r1/second-ask.test.mjs`: scene
  `helpdesk-request`, one form); a call closed inside the 1.2 s opens nothing.
- Form opened twice: an ink tag is refused while another non-chat minigame is open
  (`ink-minigame-launch.js:113-117`); Send is guarded by `_sending`.
- Escape and Close are the same normal exit (`social-overlay.js:107-143`); the close control carries
  `aria-label="Close"`; the root is a labelled region; the result is a polite live region; the
  username field takes focus on start.
- Own forms: `GET mfa/device?npc_id=`, `GET mfa/phone?own=1`, `POST mfa/approve?own=1` (query, through
  `ApiClient.post('/mfa/approve?own=1')`); "My phone" replaces the held-item buttons only when the
  server's first-step answer carried `ownPhone`; a code read from a held item never fills an own pane.
- Validator on `test_ops_helpdesk`: 0 errors, 16 warnings, as the hand-on record says. Labels in
  PLAYTEST beats 7 to 15 match `TEXT` in the form, the code device ("No longer in use") and the
  preparation card.
- CSS: 16px text, 44px targets, scoped under `.hr-`; the stylesheet link is in `show.html.erb`.

## For the owner

- R1-CLIENT3: should the player be able to read the reset password again after closing the form
  (the brief's wording, and the fix written above), or is it shown once only and re-asked from the
  desk? Either is coherent; the note, the playtest line and both docs must match the choice.
