# S8a review: client, round 1

Scope: `git diff 334530092..HEAD` under `public/break_escape/` and `test/js/`, plus the one link
line in `app/views/break_escape/games/show.html.erb`. The leak scanner and the docs were not read.
Spec: `S8A_BUILD_BRIEF.md` units 02, 06, 07, 12, 15, 19, 19b and 21.

Method: for each screen I followed the real modules from the click to the server and back
(`interactions.js`, `minigame-starters.js`, `minigame-manager.js`, `password-minigame.js`,
`pc-sessions.js`, `mfa-client.js`, `api-client.js`, then `games_controller.rb`, `mfa_sign_in.rb`
and `mfa_access.rb`), and compared each field the client reads with what the server writes.

Counts: 1 blocker, 4 major, 8 minor.

## What holds

- **Paths and payloads.** `mfa-client.js` calls `GET mfa/device?item_id=`, `POST mfa/verify`
  `{pc_id, code}`, `POST mfa/prompt` `{pc_id}`, `GET mfa/phone?npc_id=` and `POST mfa/approve`
  `{pc_id, number?, deny?}`. These match `config/routes.rb:38-42` and
  `games_controller.rb:1568-1653`. `ApiClient.get` and `ApiClient.post` reject with
  `{status, body}` (`api-client.js:20-25`, `:48-58`), which is what `_wireMfa` hands on.
- **Refusal flags.** `mfaIncorrect` with `attemptsLeft`, `stale` (`used` or `expired`),
  `codeLocked` with `retryIn`, `expired`, `cancelled`, `tooSoon` with `retryAfterS`, the 200
  `approved: false` with `promptsSent`, the 403 on approve and on phone: the client reads the
  names the server sends. The fifth wrong code sends `mfaIncorrect` and `expired` together and
  the client tests `expired` first, which is right.
- **The wiring is real.** `core/game.js:1796` calls `pcSessions.load`, which calls `listen()`,
  which calls `_wireMfa()`. So `window.mfaClient` has its request function before a player can
  click a device or a PC. No stand-in is needed for that step.
- **No session before the second step.** `signIn` tests `body.mfaRequired === true` before it
  looks at `success` and returns before `_recordPasswordSession` (`pc-sessions.js:663-666`).
  `settle` only edits a session that already exists (`:1170-1172`), so a first-step answer cannot
  create one through it. The only writer on a pass is `completeSecondStep`, called by
  `mfa-client` from a server pass.
- **The 29 harness files.** Every edit is the `mfa-client.js` copy or data-URL splice. The three
  the brief said to leave unmodified (`pc-sessions.test.mjs`, `pc-sessions-access.test.mjs`,
  `pc-sessions-admin.test.mjs`) changed only in their import line. No assertion changed.
- **Authenticator split.** The fixture `test/js/fixtures/authenticator_snapshot.json` has one
  commit (unit 02, before any scene edit) and the snapshot test compares the whole container
  markup for six parameter sets (scripted, decision, with and without strings, and the ca03
  block). It passes on HEAD, so the old scene's markup is unchanged.
- **Code pane hand-over.** The real starter `startCodeDevice` adds only
  `requiresKeyboardInput` and `disableClose` (`socialOverlayParams`), the same as the stand-in in
  `mfa-child-handover.test.mjs`. The manager keeps the parent's params in `_parentParams`, so
  `mfaAccount`, `mfaTeach` and the wrapped `onComplete` survive the trip, and `init` unwraps it.
- **Held code device opener.** `inventory.js:1051` sets `takeable = false` on a held item and
  `:1061` calls `handleObjectInteraction`, which reaches the new branch at
  `interactions.js:1310`. The scenario's devices carry `owner`, which `heldCodeDevice` reads.
- **Hostile strings.** Every new node is built with `createElement` and `textContent`. I found no
  `innerHTML` with scenario or server text in the new code.
- **Enter and Esc.** The code field has its own handler; the old Enter handlers are bound to the
  username and password fields only, so Enter in the code field does not also submit the first
  step.
- **Countdowns.** The device bar is set from the server's `secondsLeft` and local elapsed time,
  so it can only run behind the server (by under a second plus the round trip), never ahead. The
  server accepts the current and the previous window, so a code read just before the roll still
  passes. `holdSendAgain(2)` starts when the answer arrives, so it cannot open before the
  server's 2 s gap.
- **"Use a different account".** It clears only the client's record. The server's record stays
  for up to 300 s and is overwritten by the next first step at that PC (`issue_second_step!`
  writes one record per key with `last: 0`, so no `tooSoon` follows). After `clear`, the next
  `noteRequired` starts at `n = 0`, so the first push is sent again. I found no state that hurts
  the player. See the owner question on whether it should cancel on the server.

## Findings

### R1-C1 (blocker): the live phone reads fields the server never sends, so no card can be answered

- **Where:** `public/break_escape/js/minigames/authenticator/authenticator-live-minigame.js:122`,
  `:126-127`, `:155`.
- **What is wrong:** each card takes its subject from `req.key` and decides number matching from
  `req.kind`. The server's rows are `{ pcId, host, username, n, numbers? }`
  (`mfa_sign_in.rb:210-211`, and the brief's unit 18). There is no `key` and no `kind`. So
  `key` is `undefined`, `_tap` returns at `!isStr(key)` (`:155`), and Approve, Deny and every
  number button do nothing. A number-matching request is drawn with a plain Approve button
  instead of the three numbers, because `req.kind` is never `push_number_match`. Even a
  bare `pcId` would not do: `mfa-client` needs the subject as `pc:<id>`, or it posts
  `target_type`, which the controller refuses.
- **Effect:** the held-phone route for `push` and the whole of `push_number_match` (the owner
  never approves it, so the phone is the only way in) cannot be played. Playtest steps that use
  a held phone will fail.
- **How to see it:** `test/js/authenticator-live.test.mjs:76` and `:86` feed
  `{ key: 'pc:desk', kind: 'push' }`, a shape only the test has. Change the stub to the server's
  shape, `{ pcId: 'desk', host: 'Desk PC', username: 'sam', n: 1, numbers: [11, 42, 73] }`, and
  the click assertions fail. In the game: sign in at a `match_gate` PC holding the owner's phone,
  press "Check ...'s phone", press a number: nothing happens.
- **Smallest fix:** in `_liveCard`, build `const key = isStr(req.pcId) ? \`pc:${req.pcId}\` : req.key`
  and choose the number buttons on `Array.isArray(req.numbers) && req.numbers.length`. Drop the
  "Request" row (`:122`): it would show an internal id. Change the test stubs to the server's
  shape.

### R1-C2 (major): a denial on the phone is reported as a timeout, and a wrong number is not explained

- **Where:** `authenticator-live-minigame.js:161-169`; `password-minigame.js:3098`,
  `:3125`.
- **What is wrong:** the server answers a deny, and a wrong number, with 422
  `{ success: false, cancelled: true }` (`mfa_sign_in.rb:187-191`, `mfa_access.rb:135-138`).
  `mfa-client` turns that into `{ ok: false, reason: 'cancelled' }`. The scene counts a denial
  only when `res.ok` is true (`:161-162`), so `deniedCount` stays 0 and the status line says
  "That request is no longer open." Back on the sign-in screen, `resumeSecondStep` reads
  `denied` as false and shows "That sign-in timed out. Sign in again." in place of "Request
  cancelled." The `reason === 'wrong'` branch (`:164-166`, "the card stays so the player can
  try again") can never run: the server sends no `mfaIncorrect` on approve, and a wrong number
  ends the attempt.
- **How to see it:** `test/js/mfa-signin-push-pane.test.mjs:200-211` passes only because the
  test ends a stub scene with `{ denied: 1 }` by hand. `authenticator-live.test.mjs:86-100`
  passes because its stub answers a deny with `{ ok: true }` and a wrong number with
  `reason: 'wrong'`; the real client gives neither.
- **Smallest fix:** in `_tap`, treat `res.reason === 'cancelled'` as the end of the request:
  add 1 to `deniedCount`, and say "Refused." for a deny or "That number did not match. The
  request was cancelled." for a number. Remove the `'wrong'` branch. Then the parent's
  "Request cancelled." line is reached with no change there.

### R1-C3 (major): a second step that has ended on the server leaves the player on a pane that can never succeed

- **Where:** `mfa-client.js:195-196` (the `refused` fallback); `password-minigame.js:3066-3070`
  and `:3189-3196` (the two `default` cases).
- **What is wrong:** three server answers carry no flag the client knows, so all become
  `reason: 'refused'`, and both panes answer "That did not work. Try again." and stay put, with
  the client's pending record kept:
  1. **The record has gone** (older than 300 s, or replaced). `verify_sign_in_code!` and
     `push_step_context` answer the bare `credential_login_refusal` (`mfa_sign_in.rb:107`,
     `:228-230`). The brief (unit 15) says "if the record has gone the first verify falls back
     to the password pane". It does not. A reopened screen goes straight back to the dead pane
     (`resumeSecondStep`), so every right code fails until the player happens to press "Use a
     different account".
  2. **The login lockout.** A wrong code counts as a login failure. At the policy's
     `maxAttempts` the server answers `{ lockedOut: true, attemptsLeft: 0 }`
     (`mfa_sign_in.rb:114`, `:315`; `game.rb:4643`). The pane shows "That did not work. Try
     again." and never the lockout screen. The test scenario hides this with `maxAttempts: 8`
     against five code tries; any policy at 5 or fewer hits it.
  3. **The first step would now be refused** (`notPermitted`, or the route closed:
     `second_step_refusal`, `mfa_sign_in.rb:42-55`). Same line, same dead pane.
- **How to see it:** in `test/js/mfa-signin-pane.test.mjs`, answer verify with
  `{ status: 422, body: { success: false, message: 'Incorrect username or password' } }`:
  `signInPane` stays `code` and `pendingFor` still holds the record. No test covers a flagless
  422 or `lockedOut` at the second step.
- **Smallest fix:** in `refusalResult`, map `b.lockedOut === true` to a new reason
  `locked_out` (clear the pending record) and treat a flagless 422 as `expired` without the
  `mfa_failed` event, or as a new reason `gone` (clear the pending record). In the two panes,
  `locked_out` calls `signInLockedOut(result)` as the password pane does, and `gone` and
  `refused` call `client.clear` and `showPasswordPane` with "That sign-in timed out. Sign in
  again." (or the server's `message` for `notPermitted`).

### R1-C4 (major): no test runs a push scene against the server's answer shapes, so R1-C1 and R1-C2 passed every test

- **Where:** `test/js/authenticator-live.test.mjs:52-62`;
  `test/js/mfa-signin-push-pane.test.mjs:48-52`, `:66`, `:184-222`;
  `test/js/mfa-child-handover.test.mjs:62-66`; `test/js/mfa-signin-pane.test.mjs:68-72`.
- **What is wrong:** these are the stand-ins, by test:
  - `authenticator-live.test.mjs`: `deps.mfa` is a stub, not `mfa-client.js`. Its `phone`
    returns rows with `key` and `kind`; its `approve` returns `{ ok: true }` for a deny and
    `reason: 'wrong'` for a wrong number. None of these is what the real client and server give.
  - `mfa-signin-push-pane.test.mjs`: the phone scene is `PhoneStub`. Approval is a direct
    `mfa.approve('pc:desk', {})` call, denial is `mfa.clear` plus a hand-written
    `{ denied: 1 }`, and expiry is `mfa.clear`. The real `authenticator-live` scene is never
    loaded. `window.startAuthenticatorLive` is the test's own.
  - `mfa-child-handover.test.mjs`: `window.startCodeDevice` is the test's own (it matches the
    real starter today, see "What holds") and `window.pcSessions.signIn` is a fake that calls
    `noteRequired` itself. Its `mfa/approve` answer is used on a code step, which the server
    would refuse.
  - `mfa-signin-pane.test.mjs` and the push pane test: `window.pcSessions` is a fake, so the
    real `signIn` to pane path is only covered in two halves (`pc-sessions-mfa.test.mjs` for
    the first, these for the second).
  - `code-device-opener.test.mjs`: `window.startCodeDevice` is a recorder; nothing checks that
    a real inventory click ends in a device scene with a code on it.
- **Smallest fix:** one new test that loads the real `password-minigame.js`,
  `authenticator-live-minigame.js`, `code-device-minigame.js`, `pc-sessions.js`,
  `mfa-client.js`, `minigame-starters.js` starters and the real manager over a fake
  `ApiClient` whose bodies are copied from the controller tests
  (`test/controllers/break_escape/mfa_phone_test.rb`, `mfa_push_test.rb`): sign in, open the
  phone, tap the right number, close, and assert the session; then the same with Deny and with
  a wrong number. Keep the bodies in one fixture file that a controller test also asserts, so
  the two sides cannot drift again.

### R1-C5 (minor): a code read long ago, or already used, is filled into the field

- **Where:** `mfa-client.js:137`, `:143-148`.
- **What is wrong:** `lastRead` stores `at` but `codeFor` never reads it, and a pass does not
  clear `lastRead`. A screen reopened minutes after a device read is filled with a dead code
  ("That code has expired."), and the next sign-in to the same account after a sign-out is
  filled with the code just used ("That code has been used.").
- **Smallest fix:** in `codeFor`, return null when `cfg.now() - lastRead.at` is over 60 s; in
  `passed`, clear `lastRead` when its `npcId` is the body's.

### R1-C6 (minor): the push pane takes no focus and loses it

- **Where:** `password-minigame.js:2933-2985`, `:3030`.
- **What is wrong:** `showCodePane` focuses its field; `showPushPane` focuses nothing, so focus
  falls to the page when the password form is hidden. "Send again" is disabled while it has
  focus (`:3030`), which drops focus again. The count line ("Requests sent: n") is not a live
  region, so a screen reader hears nothing when a request goes. The status line has
  `role="status"` but its text never changes after it is added.
- **Smallest fix:** after mounting, focus "Check ...'s phone" when it is present, else "Use a
  different account"; put `aria-live="polite"` on the count line; use `aria-disabled` and an
  early return in place of `disabled` for the 2 s hold, or move focus to the back button.

### R1-C7 (minor): the code field is not bound to the on-screen keyboard reveal

- **Where:** `password-minigame.js:1766`.
- **What is wrong:** `bindKeyboardReveal` gets the username and password fields only. On a
  phone, the keyboard that opens for the code field can cover Verify and the message line.
- **Smallest fix:** let `bindKeyboardReveal` look the focused field up by a class
  (`.password-field`, which the code field has) or bind the code field when the pane mounts.

### R1-C8 (minor): `noteRequired` carries the old prompt count into a new attempt

- **Where:** `mfa-client.js:91`; `password-minigame.js:2983`.
- **What is wrong:** an `mfaRequired` answer always means a new server record with `n = 0`, but
  the client keeps the previous `n` when the account is the same. If a pending record is still
  held (a second screen for the same PC, such as the remote sign-in), the new pane shows "A
  request was sent" and "Requests sent: 1" and sends nothing, because the first push goes only
  when `n` is below 1. The pending record is also keyed by PC alone, so a step started at the
  keyboard resumes inside a remote screen for that PC and finishes on the keyboard route.
- **Smallest fix:** start `n` at `b.promptsSent` or 0, never the previous value.

### R1-C9 (minor): a push approved after the player stepped back leaves the screen out of step

- **Where:** `password-minigame.js:3037`.
- **What is wrong:** if the owner approves a request that was in flight when the player pressed
  "Use a different account", `mfa-client` has already recorded the session (`onSession`), but
  the screen returns early and stays on the password pane of a PC that is now signed in.
- **Smallest fix:** on `result.ok && result.passed`, call `signInAccepted` whatever the pane.

### R1-C10 (minor): wording after five wrong codes, and one dead case

- **Where:** `password-minigame.js:3182-3188`, `:3063-3065`.
- **What is wrong:** the fifth wrong code answers `expired` and the player reads "That sign-in
  timed out. Sign in again." Nothing timed out. The `locked` case in `sendPush` cannot be
  reached: the server sends no `codeLocked` on a prompt.
- **Smallest fix:** when the body also carries `mfaIncorrect`, say "Too many wrong codes. Sign
  in again." Remove the dead case.

### R1-C11 (minor): a code device that is on the floor and not takeable opens its scene

- **Where:** `interactions.js:1310`.
- **What is wrong:** the branch tests `!takeable`, not "held". A device authored with
  `takeable: false`, or with the key left out, opens "This device shows nothing." from the room.
  The server refuses the read, so nothing leaks; the player just gets a dead end.
- **Smallest fix:** test `takeable === false` and that the item is in `window.inventory.items`,
  or have the validator require `takeable: true` on a `code_device`.

### R1-C12 (minor): the status line of an approved phone gives no next step

- **Where:** `authenticator-live-minigame.js:163`, `:170`.
- **What is wrong:** after a right tap the scene says "Approved.", then `refresh()` replaces it
  at once with "No sign-in requests right now." The player is signed in but must guess that
  closing the phone finishes the sign-in.
- **Smallest fix:** keep "Approved. Close the phone to go back to the PC." when the list is
  empty after a pass, or close the scene on a pass.

### R1-C13 (major): the two new scenes break `playtest-shellx-open-wait.test.mjs`

- **Where:** `test/js/playtest-shellx-open-wait.test.mjs:147`; caused by
  `public/break_escape/js/minigames/index.js:220-221`.
- **What is wrong:** the test derives the scenes that draw their own X (every registered
  `SocialOverlayScene` subclass) from the real tree and pins the count at 15. `code-device` and
  `authenticator-live` make it 17, so the file fails: "the real tree gives exactly 15 scenes
  (..., authenticator-live, code-device, ...)". Unit 12's "done when" asked for every test that
  reads `minigames/index.js` to pass unmodified; this one was missed. It also means nobody has
  yet decided whether the shell X check should open the two new scenes.
- **How to see it:** `bin/test-js test/js/playtest-shellx-open-wait.test.mjs`.
- **Smallest fix:** set the count to 17 and add the two names to the list on the next line, in
  the same commit as a line in the shell X check's notes saying how each new scene is closed
  (its own steel X in the frame; the phone's window bar Close).

## Tests run

- The nine new client tests (`mfa-client`, `pc-sessions-mfa`, `mfa-signin-pane`,
  `mfa-signin-push-pane`, `mfa-child-handover`, `code-device`, `code-device-opener`,
  `authenticator-live`, `authenticator-snapshot`) pass.
- The whole `test/js` suite, run once with `bin/test-js -j 6`. Failures:
  `capture-log.test.mjs` (known, fails on main); `playtest-shellx-open-wait.test.mjs` (R1-C13);
  `lockpick-mode-switch-roundtrip.test.mjs` (a `ReferenceError` inside the test file, "Cannot
  access 'PinManagement' before initialization"; neither the test nor any lockpicking file is in
  this diff, so it is not from S8a, but it fails alone as well and someone should own it);
  `lab-ux-ui.test.mjs` failed under load and passes alone.
- A probe, not committed: `authenticator-live.test.mjs` with its stub rows changed to the
  server's shape fails "approve and deny call approve with the request key", which confirms
  R1-C1.

## For the owner

1. **The held phone on its own.** The brief (unit 19) says the live authenticator opens "as a
   child of the sign-in screen or from the held phone". Unit 19b left the inventory route
   unwired, so a held phone still opens Friendface and the requests can only be seen from the
   sign-in screen. Is that the design, or should the phone show waiting requests when opened
   from the inventory?
2. **"Use a different account".** It was added beyond the brief and does not tell the server.
   The old record lingers for up to five minutes and does no harm that I could find. Should
   stepping back cancel the attempt on the server (a new route, and a log row), or is a silent
   client step back what you want in the log?
3. **A wrong number.** The server ends the attempt on one wrong number; the scene was written
   to let the player try again. Which is intended? If the server's rule stands, the player
   needs a line that says the request was cancelled because the number was wrong.
4. **The lockout during the second step.** Wrong codes count towards the PC's `maxAttempts`.
   With `maxAttempts` at 5 or below the login lockout arrives before the code step's own five
   tries end. Should the feature scenario include one such PC so the playtest covers it?
5. **One pending step per PC.** The server and the client both key the step by PC, whatever the
   route. A step begun at the keyboard is offered again on a remote screen for the same PC and
   completes on the first route. Is that acceptable, or should the client key include the
   route?
6. **Five wrong codes.** Is "Sign in again" with the password the right cost, given the
   password is already known to be right, or should the pane just ask for a new code?
