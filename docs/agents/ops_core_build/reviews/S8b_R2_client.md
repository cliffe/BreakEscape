# S8b review, round 2: client, scenario, playtest script and docs

Branch `ops-helpdesk` at `65b993fe1`. Fix commits reviewed: `810d63364`, `eb77ef6a1`
(`git diff c225aa772..HEAD -- public/break_escape scenarios/test_ops_helpdesk test/js README_scenario_design.md`).
No code was changed. Scratch: `<scratchpad>/s8b-r2-client/rows.mjs` (loads the real `signin-rows.js` from the tree).

Counts: 0 blockers, 0 major, 3 minor.

## Round 1 findings

| Finding | State | Evidence |
|---|---|---|
| R1-CLIENT1 (blocker) playtest beats 4 and 5 not clickable | closed | `PLAYTEST.md` beat 3b signs in at the Front PC; beats 4 and 5.3 use inventory > "Records PC.rdp" > "Connect". Traced: the item has `text`, so the tray click opens a menu (`inventory-menu.js:166-170`, `trayClickIsConnect` false) with "Connect" (`:157-163`); `keyring.js:571` `connect` > `connectRoute` picks `{ from: 'front_pc' }` (`keyring.js:77-86`; server lists it, `credential_keyring.rb:508-512`). Same-network assertion added (`helpdesk-scenario-click-paths.test.mjs:98-103`, 10 pass). |
| R1-CLIENT2 (blocker) "Connect could not reach the game server" for a changed password | closed | `keyring.js:683` returns an `info` toast with `result.message` (`pc-sessions.js:172-175`, `:812`). `node --test test/js/helpdesk-keyring-connect.test.mjs`: 6 pass, 0 fail (both `password_changed` from the fixture and `second_step`; one POST, no desktop, no screen). `keyring-client` 86 pass. |
| R1-CLIENT3 (major) reset password shown nowhere after the form | closed, with a gap (R2-CLIENT1) | `keyring.js:347-348`, `signin-rows.js:179`, `:242-246`, `password-minigame.js:417`, `:443`, `remote-host-text.js:62`, `:257`; `capture_log` item in the scenario. Tests "the sign-ins list shows the Reset row", "the sign-in tile carries the Reset tag", "a grant refreshes the keyring at once" pass. The owner question of round 1 was answered by the fix (readable again). |
| R1-CLIENT4 (minor) Close during a send drops the grant | closed, with a limit (R2-CLIENT2) | `helpdesk-request-minigame.js:233-236`; Escape goes through the same `requestClose` (`social-overlay.js:122`; the base Esc handler is off, `base-minigame.js:329`, `disableClose`). Test "Close and Escape during an in-flight send are held" passes (`helpdesk-request` 24 pass). |
| R1-CLIENT5 (minor) own taken from a memory note | closed | `authenticator-live-minigame.js:166` passes `own: true` only when `this.own` (set from `params.own === true`, `:36`; the only openers with `own` are `password-minigame.js:2882`, `:3142`); `mfa-client.js:296`. `own-phone-scenes` 11 pass (no note: `mfa/approve?own=1`; held scene, no note: `mfa/approve`). |
| R1-CLIENT6 (minor) playtest quotes | closed | Beat 1 quotes "This account is locked on this PC"; "keyring (K)" is gone. |
| R1-CLIENT7 (minor) docs | closed | `docs/ACCESS_AND_NETWORKS.md:828`, `:836`, `:861`, `:863`; `README_scenario_design.md` row A23. |
| R1-CLIENT8 (minor) lint list | closed | `helpdesk-no-handwritten-answers.test.mjs:14-15` lists both files; 11 pass. |

## New findings

### R2-CLIENT1 (minor): an account that was captured and then reset shows the old password in Sign-ins; the reset value is not drawn

`signin-rows.js:226-246`: the new `helpdesk` branch is an `else if` after `if (caps.length)`. When the
account already has a captured password, the row keeps the captured value and only adds "Also in Reset.".
The server keeps serving the old captured value after a reset (`credential_keyring.rb:314-333`; the doc
says so, `ACCESS_AND_NETWORKS.md` "After a reset, old notes stay old"), so the one value on the row is the
dead one, under a "Reset password" tag. The form note and `ACCESS_AND_NETWORKS.md:828` ("shows a Reset row
with the value") are then untrue. `test_ops_helpdesk` has no capture, so no beat hits it.

Ran `node <scratchpad>/s8b-r2-client/rows.mjs` (real `buildSignInRows`; entries `tess.password` source
`capture` value `OLDPASS`, then `tess.reset` source `helpdesk` value `NEWPASS`, one capture for `tess`,
`social.captures.revealSecret: true`):

```
[{"kinds":["captured","reset"],"sources":["Phished","Issued"],"value":"OLDPASS","use":"OLDPASS","lines":["Also in Reset."]}]
```

By reading, the remote sign-in tile has the same order: `password-minigame.js:2154`
(`t.capture?.password || t.keyPassword`) fills the captured value before the reset one (the keyboard
tile, `:2392`, takes `keyPassword`, where the later `helpdesk` entry wins).

Fix: `public/break_escape/js/minigames/capture-log/signin-rows.js`, step 3: test the `helpdesk` case
first. When `row.password?.source === 'helpdesk'` and it has a `password`, set `row.value`, `row.use` to
it and `valueState` null, and for a row that also has captures push the captured notes as lines (no
"Also in Reset." line). `password-minigame.js:2154`: when `t.kinds` includes `reset`, use
`t.keyPassword` first. Add a case to `test/js/helpdesk-keyring-connect.test.mjs` built from
`answer('keyring.reset_entry')` plus a captured entry for the same account.

### R2-CLIENT2 (minor): a send that never answers leaves the form with no way out and no sign that it is waiting

`helpdesk-request-minigame.js:198-210`, `:233-236`. While `_sending`, the only visible change is the
greyed Send button. The × gets `aria-disabled` but no stylesheet styles it
(`grep -rn 'aria-disabled' public/break_escape/css` lists only `.signin-cred` and
`.container-content-slot` rules), so it looks live and a click or Escape does nothing, silently. There
is no "sending" line in `.hr-result`. `ApiClient.post` (`api-client.js:33-45`) has no timeout and the
form passes no `signal`, so a request that the server holds open keeps the form, and the chat or call
under it, until the page is reloaded. A dropped connection rejects and is handled (`TEXT.error`).
By reading; not run.

Fix (`helpdesk-request-minigame.js`): on send write a line into `resultEl` ("Sending your request...",
a new `TEXT.sending`); race `client.send(request)` against a timer (15 s, the keyring's
`ASK_TIMEOUT_MS`); on timeout set `_sending = false`, re-enable Send and Close, and show `TEXT.error`.
A late answer still sets the global and refreshes the keyring in `helpdesk-client.js:129-139`; show it
if the form is still open. Add `.se-overlay-close[aria-disabled="true"] { opacity: .5; cursor: default; }`
to `public/break_escape/css/helpdesk-request-minigame.css` under the `.hr-` root. Test in
`test/js/helpdesk-request.test.mjs` with a `send` that never resolves and mocked timers.

### R2-CLIENT3 (minor): the form note names a capture log the player may not hold, and a tag the row does not show

`helpdesk-request-minigame.js:27`: 'It is saved as "Reset" under Sign-ins in your capture log, and on
the sign-in screen.' is shown for every password grant. A scenario with a desk and no held `capture_log`
is valid (`ACCESS_AND_NETWORKS.md:828` says the log is optional; the validator on `test_ops_helpdesk`
has no rule about it), and then the first half is untrue. The row's tag reads "Reset password" and
"Issued" (`remote-host-text.js:62`, `signin-rows.js:280`, `rowKindName` gives `full`); only the sign-in
tile says "Reset".

Fix: `helpdesk-request-minigame.js` `_showResult`: choose the note by `heldCaptureLog()` (exported from
`systems/keyring.js:797`, read through `window.keyring` or an injected dep): with a log, 'It is saved
under Sign-ins in your capture log, and on the sign-in screen.'; without, 'It is saved on the sign-in
screen for this account.' Update the assertion at `test/js/helpdesk-request.test.mjs:173` and add the
no-log case. `PLAYTEST.md` beat 3: say the row is tagged "Reset password" and "Issued".

## The questions asked of this round

- Where the reset password is held. The form's `.hr-password` (cleared in `cleanup()`, `:245`); the
  keyring's cached `GET /keyring` answers (`keyring.js:238-240`, memory only); the capture log's row
  while it is open, and its `getTestState` (`capture-log-minigame.js:473`, `:482`, as for a captured
  value); the sign-in tile and, once the tile is clicked, the password field. Not in events
  (`keyring_changed` carries `rev` only; `helpdesk_answered` carries `deskId`, `result`), globals,
  toasts (`findKindToasts` and `findLine` skip `helpdesk`), storage or console (the test "a grant
  refreshes the keyring at once" asserts each; the sign-in path `_submitSignInOnce` does not log the
  field, the older `_submitPasswordOnce` log at `password-minigame.js:1330` is not on that path).
- An entry for a grant the server did not make: none. Entries come only from `GET /keyring`
  (`keyring.js:233-240`); `source: 'helpdesk'` is set in one place on the server
  (`helpdesk_access.rb:114-126`, behind `account_reset?`), never from scenario data
  (`credential_keyring.rb:386`, `:403` write `registry`).
- `own` on approve. An own-phone scene always sends it (`authenticator-live-minigame.js:166`). A held
  scene sends it only through the kept note fallback (`mfa-client.js:296`), which needs a pending note
  with `ownPhone` for the same PC; the held phone of a re-enrolled account lists nothing
  (`mfa_sign_in.rb:238`), the note is replaced whole at each first step (`mfa-client.js:100`), and the
  server ignores `own` for an account that is not re-enrolled (`mfa_access.rb:131-139`). No path found.
- The two tests fixed outside the area. `minigame-font-16-default`: the test was right and the stage's
  CSS was wrong (rule D164, GNF text on the 8px grid; the test file is unchanged in this stage,
  `git log` last touch `1e950e65a`); 20px to 24px is the correct fix; 4 pass. `ops-log-viewer`: the
  code was right and the test's hand-built scope for `handleInteractiveItem` lacked the new module
  constant `HELPDESK_FORM_TYPE` (`container-minigame.js:412`); the stand-in value matches; 38 pass.
- The `capture_log` item. Validator (`ruby scripts/validate_scenario.rb scenarios/test_ops_helpdesk/scenario.json.erb --no-graph`):
  `Result: 0 errors (0 known), 16 warnings`, the same 16 as round 1. It changes no earlier beat's
  clicks. It adds: a tray item with a badge after the grant, and, once opened, browser writes of
  `__capture_log_seen:<row key>` globals (`capture-log-minigame.js:410`). The real capture fixture was
  not regenerated, so the scanner has not seen those rows or the no-screen `GET /keyring` answer
  carrying the `helpdesk` entry in this scenario (scanner area; watch the leak check of this run).
- 112 JS test files that touch the changed modules: all pass except `capture-log.test.mjs` test 2
  ("one secrets request", two requests seen), which fails the same way on `main`
  (`/home/deploy/BreakEscape` at `2d9e963c8`: 32 pass, 1 fail) and is not of this stage.
- Commit messages of `810d63364` and `eb77ef6a1`: each named item is in the diff; nothing claimed that
  is absent.

## PLAYTEST.md traced again (code only)

Sound by trace: 1, 2, 3 (form, verdict, capture log row), 3b, 4, 5.1, 5.2, 6, 7, 8, 9, 10, 11, 12, 13,
14, 15. Beats I doubt, for the playtester:
- Beat 3, capture log line: the row shows the tags "Reset password" and "Issued" and the title
  "Tess Ama", not the word "Reset" alone. It appears only after the background `GET /keyring` the grant
  starts has answered (`helpdesk-client.js:76`, after the pending sync); open the log a moment after
  the form closes.
- Beats 4 and 5.3: both depend on the Front PC session of beat 3b still being held and unlocked on the
  server when Connect is clicked (`network_access.rb:1392-1405`). The server test signs in and
  connects in one breath; nothing client side was traced that would lock it on the walk to Records, but
  it is the one condition the click path cannot show. If Connect says "REC01 can't be reached from
  here", this is why.
- Beat 5.1: the Tess tile fills the new password (`password-minigame.js:2392`); the script's "clear the
  field" is needed, or the first Sign in uses the new password and step 1's refusal never happens.
- Beat 16: see the scanner note above for the new `__capture_log_seen` writes.

## For the owner

- R2-CLIENT2: hold Close until the desk answers however long (today), or release it after a timeout
  with an error line (the fix written above; a grant that lands after the release is still in the
  keyring, but the NPC's line may not match).

Verdict: clean
