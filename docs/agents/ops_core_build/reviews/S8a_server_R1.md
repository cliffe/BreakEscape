# S8a server review, round 1

Scope: `git diff 334530092..HEAD` over `app/`, `lib/`, `config/`, `scripts/`,
`scenarios/test_ops_mfa/` and the Ruby tests, fixtures and support under `test/`. The leak scanner
under `tools/playtest/`, the docs and the client JavaScript were not reviewed.

Counts: 0 blockers, 3 major, 11 minor.

## What was run

- The S8a Ruby tests (the `mfa_*` and `ops_mfa_*` files under `test/controllers`, `test/models`
  and `test/unit`, with the lockout key and habit key tests): 145 runs, 0 failures.
- `bin/ops-golden-compare` (no outer flock): 24 runs, 0 failures.
- `node test/js/ops-unchanged-validator.test.mjs` on node 22: 17 pass, 0 fail.
- `ruby scripts/validate_scenario.rb scenarios/test_ops_mfa/scenario.json.erb`: 0 errors,
  13 warnings. The tree was unchanged afterwards.
- A throwaway probe test kept outside the tree (six cases through the real routes) for R1-S1,
  R1-S4, R1-S5 and R1-S6, and a direct call of `check_mfa` on edited copies of the test scenario
  for R1-S3 and R1-S8. The results quoted below are from those runs.
- No scenario other than `test_ops_mfa` is touched by the diff. No campaign mission is edited.

## What holds

These were checked and no fault was found.

- **What reaches the browser.** A code leaves only through `mfa_device_answer`, after
  `held_code_device` matches type, id and owner against the authored device and refuses a
  client-forged entry. The three numbers leave only through `mfa_phone_answer`, after
  `held_friendface_phone`. The one caller of `second_step_requests` (`mfa_sign_in.rb:203-206`)
  passes only records whose `npcId` is that owner. Holding another account's device gives that
  account's code, which fails here. `mfaPending`, `mfaAccounts` and `mfaPrompts` are not written
  by a sync body and are in no answer the no-exposure test reads.
- **Routes round the step.** Typed at the keyboard, over a foothold and with `from`: all go
  through `attempt_login!` and owe the step; the stored route is judged again at verify, prompt
  and approve. Saved connection: refused with `typeToSignIn` (`credential_login.rb:83-87`), by
  design (brief section 1). Token and help invite: skip by design (brief section 1, unit 13).
  Owner claim and guest claim: skip by design (unit 13). Technique grant: skip by design
  (unit 17). Relay: `params.key?(:relay)` is the generic refusal. Unlocking one's own locked
  session: skip by design (section 1); Switch user to another account owes the step, because
  `mfa_step_for` skips only for the same account's locked session.
- **Codes.** Current and previous window accepted; a used window is refused at every PC of the
  account; older windows answer stale and count nothing; five tries per record; thirty per
  account closes it for 300 seconds. A slow request is covered by the previous window.
- **Controller.** All five routes authorise through `show?`, set `no-store`, and the three
  writers take the game lock. `deny` is read as `true` or `"true"`, `number` as an integer or a
  string of digits. The refusal flags (`mfaIncorrect`, `stale`, `codeLocked` with `retryIn`,
  `cancelled`, `expired`, `tooSoon` with `retryAfterS`) match what `mfa-client.js` reads.
- **Lockout key.** A username with a pipe splits correctly (first pipe only). The validator
  already refuses a PC id with a pipe (`validate_scenario.rb:8301`). The four moved `split` uses
  behave as before for every key the server writes.
- **Old saves.** The three state keys are created on first use; nothing reads them unguarded.

## Findings

### R1-S1 (major): a locked-out account still signs in through a push

`app/models/break_escape/mfa_sign_in.rb:140-196` and `:220-236`.

`verify_sign_in_code!` refuses when the account is in `loginLockouts` (`:114`).
`prompt_sign_in!` and `approve_sign_in!` do not: `push_step_context` never looks at the lockout.
A wrong password typed while a step is pending does not drop the pending record either.

To see it: policy `mfa: push`, `maxAttempts: 3`, owner `pestered`. Type the right password
(a step is pending). Type a wrong password three times (`loginLockouts` now holds
`sam_pc|sokafor`). Send three prompts. The third answers `success: true` and the session is
written, with the lockout still in the list. The same holds for approve from a held phone.

Smallest fix: in `push_step_context`, after `second_step_refusal`, answer
`mfa_locked_out_answer(pc, npc)` when `login_lockouts` holds the account's key, as verify does.
Add a test for prompt and for approve.

### R1-S2 (major): the subject kind is not part of the numbers or the request key

`app/models/break_escape/mfa_access.rb:134`, `:150-153`; `mfa_sign_in.rb:277`.

The brief (unit 06, unit 14) keys the numbers on `pc:<id>` and asks that another subject kind
gives different numbers for the same owner and nonce. A builder changed the sign-in to the bare
PC id so that sign-in and approval agree. They agree now only because every caller passes the
map key, and the subject's kind is read nowhere:

- `approve_second_step` and `second_step_requests` derive the numbers from the map key.
- `second_step_requests` drops a second record with the same key from another map
  (`seen.key?(key)`), so in S8c a door `x` and a PC `x` would show as one request.
- The test that claims "numbers differ" for another kind
  (`mfa_access_subject_test.rb:189-193`) passes two hand-written strings (`'pc:x1'` and `'x1'`)
  to `second_step_numbers`. It does not test what the functions derive.

Today the numbers cannot collide, because the nonce is a per-owner counter. The request list
can, as soon as a second map exists.

Smallest fix now: one function, for example `MfaAccess#subject_key(subject)` returning
`"#{kind}:#{id}"`, used for the numbers in `issue_mfa_challenge!`, `approve_second_step` and
`second_step_requests`; `second_step_requests` de-duplicates on kind and key and returns the
kind. The map key may stay the bare id. Change the test to call the functions with two subjects.

### R1-S3 (major): a number-matching PC nobody can pass validates with no warning

`scripts/validate_mfa.rb:202-206`.

The "nobody passes this push step" check asks `prompt_habit(npc) == 'never'`. For
`push_number_match` the owner never approves whatever the habit (`mfa_access.rb:171`), so the
habit must not excuse the PC.

To see it: in the test scenario set Nia's `awareness` to `low` and empty her `itemsHeld`. The
validator prints only the info line "NPC 'nia' through no listed way": no warning. With
`awareness: high` the warning appears.

Smallest fix: for `push_number_match` treat the habit as `never` in `stuck`.

### R1-S4 (minor): a held phone approves a request that was never sent

`mfa_access.rb:127-141`; `mfa_sign_in.rb:200-215`.

`approve_second_step` and `second_step_requests` do not look at `n`. Straight after the first
step, with no `mfa/prompt`, `GET mfa/phone` lists the request (`"n":0`, with the three numbers)
and `POST mfa/approve` signs in. The client sends a prompt at once, so play does not show it.
Smallest fix: list and approve only records with `n` above 0, or record this as intended.

### R1-S5 (minor): approve with no usable number cancels the step

`games_controller.rb:1643-1647`; `mfa_access.rb:133-138`.

On a number-matching step, a missing number, `12.0`, `"abc"` or a list all answer
`cancelled: true`, drop the record and write an `mfa_prompt_denied` row. A malformed code, by
contrast, is counted nowhere. Smallest fix: when the step is number matching, `deny` is not set
and no integer was read, answer the generic 422 and leave the record.

### R1-S6 (minor): `target_id` alone is accepted

`games_controller.rb:1590`, `:1607`, `:1639`. The brief says a request carrying `target_type` or
`target_id` gets the generic 422 until S8c. Only `target_type` is checked: `POST mfa/prompt`
with `pc_id` and `target_id` sends the prompt. Smallest fix: add `|| params.key?(:target_id)`.

### R1-S7 (minor): `mfa_now` is defined twice and read several times in one answer

`mfa_access.rb:14-17` (with a comment that is now untrue) and `mfa_sign_in.rb:11-14`. Remove the
copy in `MfaAccess`. In `mfa_device_answer` (`mfa_sign_in.rb:90-95`) the window, the code and
`secondsLeft` each read the clock; across a minute boundary the answer can pair the new code
with the old window's `used` flag or a `secondsLeft` of 60. `verify_second_step_code` reads it
twice (`:53`, `:65`). Smallest fix: read `mfa_now` once per call and pass the window down.

Nothing else depends on the wall clock in a way a slow request breaks. A test sets time with
`travel_to`; a playtest cannot set it, so the 300 second expiry and closure cannot be played,
and beat 4 needs a real wait of up to 60 seconds.

### R1-S8 (minor): the validator's info lines mislead, and a device nobody can get is a warning

`scripts/validate_mfa.rb:136-162`, `:226-227`.

- `mfa_ways` lists "the account's code device" whenever one is declared, even when the same run
  warns it cannot be held (seen by giving Ines's device to a `koImmune` Ines).
- It never lists the owner approving. The test scenario prints "NPC 'cal' through no listed
  way" for the one account whose route is pestering.
- A code PC whose only device cannot be held gets a warning, not an error, and the dungeon
  graph still draws the "second step" edge from the device. So a scenario that cannot be solved
  ends with 0 errors. The brief lists it as a warning; see the owner questions.

Smallest fix: list the device only when `held_item_sources` has it; add "the owner approves
(pestered or always)" for `push`.

### R1-S9 (minor): the pickup gate for an owned phone is narrower than before

`games_controller.rb:3736-3738`. The owner check on a room pickup now applies only to a stored
room add. Before, it applied to every room location, so an authored phone with an owner lying
in a room was refused unless the owner offered it or was knocked out. Now it is free to take
(the new "lies loose" warning says so). No shipped scenario has such a phone (scanned), and the
golden fixtures pass, so nothing changes today. Say in the handover that this is a rule change.

### R1-S10 (minor): a two-digit number is an issued secret compared with ids

`mfa_sign_in.rb:277-282`; `ops_log.rb:234`. The right number is noted before the
`mfa_challenge` row is written, and the guard compares every string in `as` and `where` exactly.
A number-matching PC whose id, or an account whose username, is a two-digit number would raise
`SecretInRow` about once in ninety sign-ins. Unlikely, but the validator does not rule it out.
Smallest fix: a validator error for an all-digit PC id or username under a number-matching
policy, or write the row before noting the number.

### R1-S11 (minor): `lockedOut` at the second step

`mfa_sign_in.rb:114`, `:315`. The server answers the first step's `lockedOut: true` here, which
is right. `mfa-client.js` has no branch for it and reports `refused`. For the client reviewer.

### R1-S12 (minor): small points in the new code

- `mfa_reenrolled?` (`mfa_sign_in.rb:22`) is public; the brief calls it a private predicate.
- `code_state` compares with `==` (`mfa_model.rb:136`); only `matched_window` afterwards uses
  the constant-time compare the brief asks for. No practical exposure through a web request.
- A push to a knocked-out owner or a taken phone writes an `mfa_prompt_sent` row and raises
  `promptsSent`, though nobody received it (`mfa_sign_in.rb:164`).
- A wrong code writes `signin_fail` as well as `mfa_code_wrong` (through
  `record_login_failure!`), so the audit log reads one wrong code as two failures. The test
  asserts it; see the owner questions.

### R1-S13 (minor): weak tests

- `test/unit/no_inline_lockout_key_test.rb`: a source-text check.
- `test/controllers/break_escape/mfa_keyring_test.rb:101-106`: "a technique session opens with
  no pending record" calls `start_login_session!` through `send`. It does not go through the
  technique route, so it proves nothing about that route.
- `test/models/break_escape/mfa_sign_in_code_test.rb:316`: `send(:mfa_key)`.
- `test/models/break_escape/mfa_access_subject_test.rb:189-193`: see R1-S2.
- `test/controllers/break_escape/mfa_code_test.rb:153`: an `or` of three conditions whose last
  one is asserted alone on the next line.
- `ops_mfa_no_exposure_test.rb`: the title says no answer holds the number choices, but
  `assert_clean` checks key names, passwords and codes only. It does not read the answer of a
  passed sign-in, `login_accounts`, `log_rows`, the inventory answer or `scenario_map`.
- Missing: a lockout at prompt and approve (R1-S1), approve before any prompt (R1-S4),
  `target_id` alone (R1-S6), number matching with a careless owner in the validator (R1-S3).

### R1-S14 (minor): the test scenario

- 13 warnings. Two are the expected `maxAttempts` warnings on the code PCs and one is the saved
  connection. Nine are older access-model lines (owners who never leave, `maxAttempts`) and one
  is a droppable item with no `needsTag`. None hides a fault, but the brief names only the two.
- `public/break_escape/assets/objects/code_device.png` is a 26 by 16 placeholder (368 bytes).
- Beats by clicks, from `PLAYTEST.md`: 1 to 7, 9 and 12 to 15 are plain clicks. Beat 4 needs
  the real wait. Beat 8 step 3 says the pane "may offer nothing; if it does, continue", so its
  refusal is not reliably reachable by clicks. Beat 10 shows the password pane after a reload,
  though the server's record is still live. Beat 11 is about twenty clicks three seconds apart.

## For the owner

1. **Code policy with no device.** `mfa_step_for` answers `none` when the kind is `code` and the
   account has no device, so the account signs in on the password alone. The brief asks for
   this and the validator makes it an error. Should the server refuse instead, so an authoring
   slip cannot open a PC?
2. **A step nobody can pass.** Should a code PC whose only device cannot be held, or a push PC
   nobody passes, be a validator error when no other route is listed (R1-S3, R1-S8)?
3. **Approve before any request** (R1-S4): intended, or should the phone show a request only
   after one is sent?
4. **Lockout and push** (R1-S1): should a wrong password typed while a step is pending also
   drop the pending record?
5. **Subject key** (R1-S2): is `"<kind>:<id>"` for the numbers, with the bare id kept as the
   map key, the shape S8c wants?
6. **Log rows.** Is `signin_fail` beside `mfa_code_wrong` wanted? Should a push nobody receives
   write `mfa_prompt_sent`?
7. **A knock-out the browser does not report.** The owner keeps approving pushes until the
   knock-out reaches the server. The brief accepts that the record can only refuse. Is that
   enough for a `pestered` owner?
8. **Loose owned phones** (R1-S9): is the relaxed pickup rule intended for phones, or only for
   the code device?
