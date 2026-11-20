# lab_physical_pentest networks and habits: code review, round 2 (scenario half)

Branch `build/lab-networks-habits` against `main`, scenario half only:
`scenarios/lab_physical_pentest` (scenario.json.erb, ink and compiled JSON, PLAYTEST.md) and its
scenario-level tests (`test/models/break_escape/lab_physical_pentest_secrets_test.rb`,
`test/controllers/break_escape/lab_physical_pentest_network_test.rb`). Engine code is reviewed
separately. Read-only; no browser run. Fresh reviewer: round 1's claims were checked against the
files, not taken from the build log.

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 3 |
| Nit | 6 |

## Static checks run

- `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb scenarios/lab_physical_pentest/scenario.json.erb --skip-ink --no-graph`:
  exit 0, no errors. Warnings: the two unmodelled multi-door connections, Len's person-chat
  without onceOnly, `cm_store_key`, Chris's `kp_creds_captured` relay, and the controller's
  `maxAttempts` twice (access model, network model). Identity reach, network reach, the two
  "Reachable without a foothold" lines and the habits report are exactly as PLAYTEST.md lists them.
- `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/lab_physical_pentest/`: totals by
  rule none.
- Compiled ink: `ruth.json`, `ruth_phone.json` and `ruth_debrief.json` each hold the new text, and
  no `.ink` is newer than its JSON.

## Round 1 findings: verified

| R1 | Status | Evidence |
|---|---|---|
| M1 guessable password | Closed | `scenario.json.erb:1216` Chris is `Fjord-Tinsel-Marrow-83`. No part of it (fjord, tinsel, marrow, 83) appears in any other password, the rendered scenario, or any lab `.ink`; grep over the lab folder finds only the `creds` line. `captureProof` on Chris is the keylogger at `staff_pc` only, and `capture_secrets_for_client` serves nothing without it (secrets test). The new test at `lab_physical_pentest_secrets_test.rb:627` guards it |
| m1 debrief order | Closed | `ruth_debrief.ink:182-190`: plant line, then view (185), then door admin (188), all inside `kp_netdrop_planted`. `kp_door_admin` always implies `kp_netdrop_planted`: a sign-in through the box needs the plant, and the plant's `network_foothold_gained` completes `opt_netdrop` (`objectives-manager.js:321-324`, reconciled on load at 247-257) |
| m2 pointer to the controller | Closed, see m3 below | `ruth_phone.ink:109, 125, 140, 147-149` |
| m3 "service port" | Closed | `scenario.json.erb:2168` |
| m4 capture note | Closed | `scenario.json.erb:742`; one leftover in the credits, nit n2 |
| m5 H5.20 message | Closed | PLAYTEST H5.20 expects the toast and checks `verify-run.rb --access` |
| m6 stale PLAYTEST output | Closed | The expected validator paragraph matches today's run line for line; one wrong cross reference added, nit n1 |
| m7 tests | Closed | `lab_physical_pentest_network_test.rb:44-83`: `opt_netdrop` refused then completed with `kp_netdrop_planted`; `opt_door_admin` refused before and after a wrong password, completed after Chris's remote sign-in with `kp_door_admin`; pages through GET /container with the foothold, refused without it and after the unplug |
| n1, n2 | Closed | `ruth.ink:46`; `kit_dropbox` observations say "office network" |
| n3, n4 | Kept by choice | Reasons logged; both acceptable |

## Fresh checks

**Chris's password.** Reachable only through the keylogger capture, as above. The username is
public (`initial.surname`), which is fine now that the password is a four-part passphrase with no
pattern shared with Melanie's (`Ledgerwell#Autumn26`) or Sofia's (`Ledgerwell#Welcome1`). The
store room answer and the bootstrap carry no password (existing test, `:56`).

**The 5-attempt lockout.** Server side (`game.rb:1517-1523, 1945-1967`): failures count per PC and
normalised username; at 5 that username is locked at `store_controller` for the mission, even with
the right password. A correct password for an account the controller does not admit (Melanie's)
returns "not permitted" and does not count. Each wrong try shows "Incorrect username or password. N
attempts left." from the first one, so the lab does warn, but only after the first failure.

Fair for a mistyper: yes. The Captured sign-ins picker fills both fields, and a student who types
the 22 characters by hand from the tablet gets four counted warnings. The only realistic way to
reach 5 is guessing before the capture, and the rules of engagement put "guessing or cracking
passwords you did not capture" out of scope. So the lockout is a fair consequence. What is not
handled is the aftermath (m1).

**The new phone reply and the reworded lines.** "The drop box goes on a spare port. Once it's in,
it shows you what answers on their network." reads well and sets up the view. The debrief lines at
168, 169, 183, 185 and 188 read naturally; the commas that replaced the dashes are right, and
"Two small gaps, one large one" lands. The phone reply works for the common case; see m3.

**Debrief order.** Correct (table above). The extras block is entered whenever
`kp_netdrop_planted` is true, so both new lines are always reachable when earned.

**Lines to voice.** The ink diff against `main` changes or adds exactly seven spoken lines:
`ruth.ink:46` (new), `ruth_debrief.ink:168, 169, 183` (re-voiced), `:185, :188` (new), and
`ruth_phone.ink:148` (new). The combined step 9 and round 1 tables in
`ACCESS_MODEL_SLICE_9_3_BUILD_LOG.md` list the same seven with the right line numbers, old clip
ids and text, and no line holds a variable, cue or direction. One marker is wrong (m2).

**Soft-lock or dead end.** None on the critical path: the network beats are all optional, the
unplug gives the box back exactly once (tested), re-plant works, and the end-of-mission check
offers "End the mission now" with any optional task open. The lockout makes one optional task
impossible to finish (m1); that is a dead end for the task, not for the mission.

**PLAYTEST.md.** H5.15 to H5.21, the earned-secrets table and the expected validator output match
the scenario and today's validator. Two small slips (n1, n5).

**Reload resumes in `briefing_room`.** This is the engine's normal resume, not a lab bug.
`public/break_escape/js/core/game.js:2145-2161` always places the player in
`gameScenario.startRoom` (an opt-in `resumeSpawn` only moves the spot within that room); the
server keeps no player position to restore. The lab already relies on it
(`scenario.json.erb:667`: "A game resumes in the briefing room ... so game_loaded puts it back to
false"), and PLAYTEST R8 step 5 says "every scenario resumes this way". Nothing to fix.

## Minor

### m1. After a lockout the lab keeps pointing the player at the controller

`scenario.json.erb:93` (`door_controller` policy), `ruth_phone.ink:109, 125, 140`, `:363`
(`opt_door_admin`). Once `c.hampshire` is locked at `store_controller`, Ruth's phone still offers
"The drop box is in. What now?" and sends the player to the controller; the task stays open for
the rest of the mission and the end-of-mission check lists it; the debrief says nothing. The
engine message, "This account is locked on this PC.", is the only explanation, and it does not
say why or for how long. A student who guessed (out of scope) learns nothing from the lockout,
which is the one thing it could teach, and one who later captures the password legitimately is
stuck with no word on why it fails.

The lockout protects nothing the chain needs any more: the passphrase cannot be guessed, so the
server already enforces "only through the keylogger".

Fix, a design call for the user:

1. Drop the policy (`"policy": "door_controller"` at `:2124` and the `policies` block at
   `:92-94`) and the two accepted validator warnings go with it. Simplest; no dead end. Update
   H5.18 (no "4 attempts left") and the test assertion at `lab_physical_pentest_secrets_test.rb:641`
   and `lab_physical_pentest_network_test.rb:62`. Or
2. Keep it and close the loop: a mapping on Ruth such as
   `{ "eventPattern": "pc_signin_failed:store_controller", "condition": "data.reason === 'locked_out'", "onceOnly": true, "setGlobal": { "kp_door_locked": true } }`
   (the same shape as `test_access_signin`'s `s7_locked_out`); gate the phone option with
   `and not kp_door_locked`; add a phone reply for the locked case ("You guessed, and it locked
   Chris out. That's out of scope, and on a real job it's the client's helpdesk phoning us.");
   optionally a debrief line under `kp_netdrop_planted` (would need voicing). Add a lab test that
   five wrong passwords lock `c.hampshire` at `store_controller` and not at `hot_desk_pc`.

Either way, the ROE could say one line about it ("Systems may lock an account after a few wrong
passwords"), so the student hears the rule before meeting it.

### m2. The "Lines to voice" table marks the phone reply for voicing; Ruth's phone is not voiced

`docs/achitechture/ACCESS_MODEL_SLICE_9_3_BUILD_LOG.md:232` ("VOICE (new, phone)") and `:251`
("plus the phone line await voicing"). The lab's `ruth_phone` has no `voiced: true` call, and the
tts-audio rules say phone chats are not extracted. Whoever runs the audio step will look for a clip
that the extractor never lists. Fix: mark row 2 "not voiced (phone chat)" and say "the six lines
of step 9" in the handover.

### m3. The phone reply misleads after an unplug, and "it" is ambiguous

`ruth_phone.ink:148`: "Open it from your bag. The door controller's on its list, and it takes a
front of house account." The option is gated on `kp_netdrop_planted`, which never goes back to
false. After an unplug the box is back in the bag and the link item is gone, so "open it from your
bag" opens the device, not the view. Even before an unplug, "it" follows "The drop box is in", so
it reads as the box in the wall; what the player opens is the link item named "Drop box: comms
cupboard". "Front of house" relies on the player matching the tablet's role label to Chris; that
is a fair small deduction, but the option only appears once Chris's password is captured, so it
can name her without giving anything away.

Fix: reword, for example "Open the drop box link in your bag; plug the box back in first if you
pulled it. The door controller's on its list, and Chris's account works on it." The line is not
voiced (m2), so a rewording costs nothing.

## Nits

- **n1.** `PLAYTEST.md:1016` cites H5.4 for the hot desk; H5.4 is the debrief gate. The hot desk
  sign-ins are H5.2 (Chris) and H5.13 (Melanie).
- **n2.** `scenario.json.erb:609`, credits: "the door-entry controller ... found administrable
  from an unlocked cupboard". Since round 1 the folder says the login needs a service cable and
  must not be used. Suggest "found in an unlocked cupboard with its login on a label".
- **n3.** `lab_physical_pentest_secrets_test.rb:630` scans `[0-9]{2,}` against the whole rendered
  scenario JSON, coordinates included. A future `"x": 4.83` or `"elevation": 183` fails the test
  for a reason unrelated to the password. Scan text fields only, or match whole numbers
  (`\b83\b`).
- **n4.** PLAYTEST's "Pass rule for the scripted runs" (`:996-1006`) covers H1, H2 and H4 but not
  H5, so H5.15 to H5.21 have no stated pass rule. This predates the branch for H5.1 to H5.14; the
  new steps make it more visible. Add "every H5 step run is PASS as written".
- **n5.** `PLAYTEST.md:1015` "No password is typed in any run", while H5.18 types a guessed
  password. Say "No real password is typed".
- **n6.** H5.21 (reload with the box planted) does not say where the player reappears; R8 step 5
  does. A cross reference ("as R8 step 5, you are back in `briefing_room`") stops a tester from
  reporting it as a bug, which is what prompted this round's question.

## For the engine reviewer

The locked-out message "This account is locked on this PC." (`game.rb:1182`) reads oddly for a
headless network host and gives no duration. Not a lab change.

## Not covered here

No browser run, no persona run, no audio. The full validator without `--skip-ink` was not run
(it would rewrite the dungeon graph).

## Verdict

Approve. Every round 1 scenario finding is closed or kept by a logged choice, Chris's password now
comes only from the keylogger, the debrief order is right, the voiced list matches the ink diff,
and there is no soft-lock. m1 needs the user's choice between dropping the lockout and closing
its loop; m2 and m3 are text-only fixes that can go in the same small commit with the nits.
