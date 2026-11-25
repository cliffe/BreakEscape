# S8a review, round 2 (server, client and docs together)

Scope: the tree at `200986e1a` on `ops-mfa`. The fixes are the eight `Ops S8a fix:` commits. The
leak scanner under `tools/playtest/` was not reviewed (it has its own reviewer); only the docs
paragraph about it was compared with its rule list.

Method: each of the three kinds was followed through the real modules as `PLAYTEST.md` plays it
(`password-minigame.js`, `mfa-client.js`, `pc-sessions.js`, `authenticator-live-minigame.js`,
`code-device-minigame.js`, `interactions.js`, `inventory.js`, then `games_controller.rb`,
`mfa_sign_in.rb`, `mfa_access.rb`, `mfa_model.rb`, `game.rb`), comparing at each boundary what one
side sends with what the other reads.

Counts: 0 blockers, 0 major, 10 minor. The engine can land. Most of the new findings are the
playtest script and the docs having fallen behind the round 1 fixes.

## What was run

- Rails: the 15 `mfa_*`, `ops_mfa_*` and `validate_mfa_number_match` files (controllers, models,
  unit): 152 runs, 0 failures.
- Node 22, each alone: `mfa-real-phone-flow`, `mfa-client`, `authenticator-live`,
  `mfa-signin-pane`, `mfa-signin-push-pane`, `mfa-child-handover`, `code-device`,
  `code-device-opener`, `pc-sessions-mfa`, `authenticator-snapshot`,
  `playtest-shellx-open-wait`: all pass.
- `ruby scripts/validate_scenario.rb scenarios/test_ops_mfa/scenario.json.erb`: the same `mfa:`
  lines as round 1. The tree was clean afterwards.

## Round 1 findings

| Id | State | Note |
|----|-------|------|
| R1-S1 | Fixed | `push_step_context` refuses a locked-out account (`mfa_sign_in.rb:242-244`); tests go through the routes. No new fault. See "Lockout" below. |
| R1-S2 | Fixed | One `mfa_subject_key` (`mfa_access.rb:17`) for the numbers at challenge, approve and the request list. The phone row still sends a bare `pcId` (`mfa_sign_in.rb:217`) and the client builds `pc:<pcId>` from it (`authenticator-live-minigame.js:131`), so both ends agree. |
| R1-S3 | Fixed | `validate_mfa.rb:202-204`, tested both ways. |
| R1-S4 | Open | A held phone lists and approves a request before any prompt. Acceptable to land: holding the phone is the factor, and the pane sends a prompt on opening. Cheap to close (skip records with `n` below 1 in `second_step_requests` and `approve_second_step`), but then a quick "Check phone" click shows an empty phone for up to one 3 s poll. I would record it as intended. |
| R1-S5 | Fixed | Bare 422, the record stays (`mfa_sign_in.rb:183-187`). |
| R1-S6 | Fixed | All three writers check `target_id`. |
| R1-S7 | Fixed | One `mfa_now` (in `MfaSignIn`); the device answer reads the clock once. |
| R1-S8 | Open | The info line still says "NPC 'cal' through no listed way" and lists a device that cannot be held. Acceptable to land (information only). Cheap to close now: two lines in `mfa_ways`. Whether a step nobody can pass is an error is the owner's (question 2). |
| R1-S9 | Open, acceptable | The loose-phone rule is now stated in A22 ("A phone lying loose ... is free to take"). It is not marked as a change from before; one sentence in the handover closes it. |
| R1-S10 | Open, acceptable | Needs an all-digit PC id or username, and raises only in test and development. Cheap: one validator error. |
| R1-S11 | Fixed | By R1-C3 (`locked_out`). |
| R1-S12 | Open, acceptable | `mfa_reenrolled?` still public (one line to close); `==` in `code_state`; the two log points are owner question 6. |
| R1-S13 | Partly closed | The lockout, `target_id` and validator tests were added. Still missing: approve before any prompt, the wider no-exposure reads, the technique route test. Acceptable to land. |
| R1-S14 | Open, acceptable | 13 warnings and the placeholder sprite (the docs say so). Beats: see "Beats by clicks". |
| R1-C1 | Fixed | The card reads `pcId` and `numbers`. |
| R1-C2 | Fixed | A `cancelled` answer counts as a refusal; the phone says which of the two it was, the sign-in screen says "Request cancelled." for both. |
| R1-C3 | Fixed for 422 | `locked_out` and `gone` leave the pane. A 403 or 404 keeps the pane with "This PC can't be reached.", which is right for a route that may come back. Remainder: R2-1. |
| R1-C4 | Fixed | `mfa-real-phone-flow.test.mjs` runs the real screens, manager, starters, `pc-sessions.js` and `mfa-client.js`. The bodies are copied by hand; there is no fixture that a controller test also asserts (R2-9). |
| R1-C5 | Fixed | Side effect on the playtest script: R2-3. |
| R1-C6 | Fixed | Focus and the live count line. |
| R1-C7 | Fixed | The code field is bound when the pane mounts. |
| R1-C8 | Fixed (first half) | The count starts from the answer. The pending step is still keyed by PC alone: R2-2. |
| R1-C9 | Fixed | A late approval signs the screen in from any pane. |
| R1-C10 | Fixed | "Too many wrong codes. Sign in again."; the dead case is gone. The docs still give the old line (R2-6). |
| R1-C11 | Fixed | The opener needs the item to be in the inventory. |
| R1-C12 | Fixed | "Approved. Close the phone to go back to the PC." |
| R1-C13 | Fixed | The count is 17 and the reason is a comment in the test. |

## The three kinds, end to end

**Code.** First step: `signIn` reads `mfaRequired`, `mfa`, `npcId` (`pc-sessions.js:663`), which
`issue_mfa_challenge!` sends. The pane offers "Use <device>" from the inventory item's `type`,
`owner` and `id`; the device scene asks `mfa/device?item_id=` and reads `code`, `secondsLeft`,
`used`, `displayName`, `npcId`, the six keys the server sends. Verify: `mfaIncorrect` with
`attemptsLeft`, `stale`, `codeLocked` with `retryIn`, `expired`, `lockedOut` and the bare 422 are
each read by name and each has a pane outcome. A pass body goes to `completeSecondStep`. A
reload loses only the browser's record: the password pane shows, and the next first step replaces
the server's record. "Use a different account" clears the browser only; the next first step
replaces the server's record with `last: 0`, so no `tooSoon` follows. No mismatch found.

**Push.** The pane opens and sends the first prompt when `n` is 0. A waiting answer
(`approved: false`, `promptsSent`) updates the count; `tooSoon` holds the button; a pass signs in.
The owner's count is per owner and survives a reload. Held phone: `mfa/phone` rows
`{pcId, host, username, n}` are drawn as Account and Computer with Approve and Deny; approve
posts `pc_id`; the pass body is kept for the parent screen, which signs in when the phone is
closed. Deny: 422 `cancelled`, the parent shows "Request cancelled.". No mismatch found.

**Number match.** The first-step answer carries `number`, shown as "Number: nn". The phone row
carries `numbers` (three, none marked) and the card shows three buttons and Deny; a tap posts
`number` as an integer, which the controller accepts. Right: pass. Wrong: 422 `cancelled`.

**Deny and a wrong number share 422 `cancelled`: is that enough?** Yes for the client. The scene
knows which button was tapped, nothing else can cancel a push step, and the parent's line is the
same for both. A distinct flag would only matter if the two should read differently in the audit
log (both write `mfa_prompt_denied` today); that is owner question 6.

**Lockout (R1-S1) against the client.** By clicks, a lockout during a second step can only
arrive through wrong codes: verify answers `lockedOut`, the client maps it to `locked_out`, and
the lockout screen shows the server's line. A push step cannot be locked by clicks while the pane
is open, because typing a wrong password needs "Use a different account", which clears the
browser's record. The prompt and approve refusals are therefore reached only by a hand-built
request; the push pane handles `locked_out` correctly all the same, the phone does not (R2-7).

## Beats by clicks

Read from the code, not played.

- **Beat 4 step 2 will fail as written.** After a pass the client forgets the code
  (`mfa-client.js:159`) and a device read marked `used` is not stored (`:139`), so closing the
  device leaves the field empty and Verify says "Enter the six-digit code." The device still
  shows the digits with "Wait for the next code". The player must type them to see "That code has
  been used." (R2-3).
- **Beat 8 (unplug, then verify)** plays only by walking to "Accounts PC". The pending step is
  keyed by PC, so the keyboard screen shows the code pane begun over the drop box; Verify is
  judged on the stored route and answers 403, shown as "This PC can't be reached." with no
  session. That meets the beat, by a path the script does not describe (R2-2). I did not trace
  whether the network view offers a sign-in control with no foothold.
- **Beat 10 step 4:** the desktop opens as soon as the pane does. The first prompt is sent on
  opening and is Cal's third, so there is no "Send again" to click (R2-4). The reload itself
  behaves as the script says.
- **Beat 11** plays: the pane sends 1, nineteen clicks make 20, the twentieth click answers
  `expired`. At 3 s a click that is about a minute, inside the five-minute life of the step. A
  run slower than 15 s a click meets the five-minute end first, with the same line.
- **Beat 15 (knock-out)** rests on the knock-out drop path built for Friendface phones in an
  earlier stage (`npc_room_drop_allowed?`, `game.rb:2178`): the pickup is allowed once the
  browser's knock-out record has reached the server. Nothing in S8a changes that path and I
  found no reason for it to fail, but I did not trace the sync timing or how Cal and Dev react
  to the attack in the same room.
- **Beats 12 and 15:** the sign-in screen returns signed in only after the phone is closed; the
  script omits that click. While the phone is open the sign-in screen, and its number, is not on
  screen (R2-8).

## New findings

### R2-1 (minor): a 403 on approve is always read as "no phone"
`public/break_escape/js/systems/mfa-client.js:219`. The server also answers 403 when the stored
route is no longer reachable or the PC is off (`game.rb:3672`, `:3681`, `:3722`, through
`second_step_refusal`). The phone then says "That request is no longer open." On the two panes
the same answers pass `serverReason: null` (`password-minigame.js:3085`, `:3217`), so a PC that
is off reads "This PC can't be reached." To see it: begin a push step over a foothold holding the
phone, unplug, tap Approve. Smallest fix: map 403 to `no_phone` only when the body has
`error: 'no such phone'`, and pass `result.body.reason` as `serverReason`.

### R2-2 (minor): a step begun on one route is resumed and finished on another
`password-minigame.js:2758`, `:3125`; `mfa-client.js:32`. The browser's record is `pc:<id>` with
no route. A step begun over a foothold shows on the keyboard screen and is judged on the
foothold (a pass gives a remote session at the keyboard; after an unplug the keyboard says the
PC cannot be reached). Smallest fix: note the route in `noteRequired` and have `resumeSecondStep`
ignore a record from another route. Owner question 5.

### R2-3 (minor): PLAYTEST beat 4 step 2 no longer matches the client
`scenarios/test_ops_mfa/PLAYTEST.md:60`. See "Beats by clicks". Smallest fix: the script says
"type the six digits the device shows, click Verify".

### R2-4 (minor): PLAYTEST beat 10 step 4 asks for a click that cannot be made
`PLAYTEST.md:110-111`. Smallest fix: "See: the desktop opens at once (the request sent on opening
is the third)".

### R2-5 (minor): other stale lines in PLAYTEST
`PLAYTEST.md:22` still says the checks wait for unit 23, which has landed. `:46` expects "That
did not work."; the pane says "Incorrect code. 4 attempts left." `:124-125` and `:145-146` omit
closing the phone. `:5` says the run sleeps once; beats 10, 11 and 14 wait between sends.

### R2-6 (minor): A22 in `docs/ACCESS_AND_NETWORKS.md` is behind the code
- `:765` "Five tries gone: ... That sign-in timed out." The pane now says "Too many wrong codes.
  Sign in again." The login lockout shows the ordinary lockout line, not "Too many wrong codes."
- `:767` says the phone lists the request count. The card shows Account and Computer only
  (`authenticator-live-minigame.js:122-126`).
- `:758` and `:791` "the twentieth request ends the step". Twenty requests are sent; the next
  call ends it (`mfa_access.rb:105`).
- Not said anywhere: a locked-out account is refused at prompt and approve as at verify
  (R1-S1), and a wrong code writes `signin_fail` beside `mfa_code_wrong`.
- `:800` The `verify-run.rb` sentence matches the code as built. The scanner sentence is right
  but short: the scanner also reports the one right `number` outside the `mfaRequired` answer,
  `mfa` inside a `creds`, and an `mfaRequired` answer of another shape or for a PC that owes no
  step (`access_leak_scanner.rb:3449-3463`).
The row in `README_scenario_design.md:1030` matches the code.

### R2-7 (minor): the phone has one line for every refusal it does not know
`authenticator-live-minigame.js:174-176`; `password-minigame.js:3144`. A `locked_out` or `gone`
answer to a tap says "That request is no longer open.", the card stays (the server still lists
it), and the sign-in screen then says "That sign-in timed out." Not reachable by clicks today.
Smallest fix: on `locked_out` or `gone`, close the phone and let the parent show its own line.

### R2-8 (minor): the number cannot be seen while the phone is open
`password-minigame.js:3110`; `authenticator-live-minigame.js:133`. The phone replaces the
sign-in screen, so the player must remember two digits, and a slip costs the attempt. Smallest
fix: the push pane tells the player to note the number before opening the phone. Owner
question 3.

### R2-9 (minor): small points
- No answer fixture is shared by a controller test and `mfa-real-phone-flow.test.mjs`, so the
  shapes can drift again without a failure (the rest of R1-C4).
- `mfa-client.js:34` says codes live in 30 s windows; `STEP_SECONDS` is 60.
- `mfa_access.rb:4` still says "code kind", and the module calls `mfa_now`, which now lives only
  in `MfaSignIn`; say so in the header.

### R2-10 (minor): cheap round 1 items worth closing before landing
R1-S8 (the two info lines), R1-S10 (one validator error), `mfa_reenrolled?` made private
(R1-S12), and R1-S9's one sentence. None blocks.

## For the owner

1. **Code policy with no device.** The account signs in on the password alone and the validator
   makes it an error. Should the server refuse instead?
2. **A step nobody can pass** (R1-S3, R1-S8): validator error when no other route is listed, or
   a warning as now?
3. **A wrong number ends the attempt**, and the number is off screen while the phone is open
   (R2-8). Is one try intended? If so, should the pane tell the player to note the number?
4. **Approve before any request** (R1-S4): intended, or should the phone list a request only
   after one is sent?
5. **One pending step per PC, whatever the route** (R2-2): acceptable, or should the browser key
   include the route? The subject key `"<kind>:<id>"` with a bare map key (R1-S2) is built; is it
   the shape S8c wants?
6. **Log rows.** `signin_fail` beside `mfa_code_wrong`; `mfa_prompt_sent` for a push nobody
   receives; one `mfa_prompt_denied` for both a deny and a wrong number. Wanted as they are?
7. **"Use a different account"** tells the server nothing, and a wrong password typed while a
   step is pending does not drop the record. Leave both, or cancel the step on the server?
8. **The held phone on its own.** It opens Friendface from the inventory; requests show only
   from the sign-in screen. Is that the design?
9. **Wrong codes and `maxAttempts`.** With `maxAttempts` at 5 or below the login lockout comes
   before the step's own five tries. Should the test scenario have one such PC? And is "Sign in
   again" the right cost after five wrong codes, when the password is known to be right?
10. **A knock-out the browser does not report.** The owner keeps approving until the record
    reaches the server. Enough for a `pestered` owner?
11. **Loose owned phones** (R1-S9): is the relaxed pickup rule meant for phones as well as the
    code device?
