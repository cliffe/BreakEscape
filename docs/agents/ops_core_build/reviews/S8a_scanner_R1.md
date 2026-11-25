# S8a leak scanner review, round 1

Scope: commit `86fed9b33` (unit 23), read against the server at `72d30646d` (after `d85d519f7`, `6b7dc1349`, `a231faa60`, `b24e70a71`).
Files: `tools/playtest/lib/access_leak_scanner.rb` (lines 3444 to 3767), `tools/playtest/verify-run.rb`, `tools/playtest/access-leak-check.rb`.

Result: 1 blocker, 6 major, 7 minor. Nothing was fixed in this round.

## How it was checked

- Every attempt below is a doctored copy of the real run built by `access_leak_scanner_mfa_real_test.rb` (`run_game`), scanned with the real scanner. The scratch file is outside the repo: `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s8a_scanner_hostile_test.rb`. "Passes" means the scanner reported nothing for an answer the server would never give.
- Tests run: the two new files (18 runs, green); the seven scanner unit files, the three older real-answer files, `ops_mfa_scenario_test.rb`, `ops_logs_scenario_test.rb`, `ops_scan_scenario_test.rb` (381 runs, green).
- Check 3 (nothing weakened): the diff adds 337 lines to the scanner and changes one (a comma on the last `RULE_TEXT` entry); in `verify-run.rb` it adds 50 and changes one (the access section now also prints when the scenario asks for a second step). No existing test file is touched. No existing rule is loosened.
- The scanner still matches the changed server on these points: the phone answer's bare `pcId`, the 422 of an approve with no usable number (no `cancelled`, so the step stays open in both), and the generic 422 for `target_id`. It does not model the `lockedOut` refusal at prompt and approve (R1-L11).

### Attempts and results

| # | Capture | Result |
|---|---|---|
| 1 | Lock, unlock, then a second sign-in success for the same account at the same PC (the session is no longer locked) | passes |
| 2 | Ines passes and locks at `code_pc2`, the Sync service signs in there, then a sign-in success for Ines with no step | passes |
| 3 | A bootstrap lists Hana's session at `code_pc1` after the logout | passes |
| 4 | Typed sign-in success (`via: password`) with `relay: true`, no step | passes |
| 5 | `via: credential`, `kind: saved_connection`, `relay: true`, no step | passes |
| 6 | `POST login` success with `via: technique` | not an mfa finding; the older `ops_string` rule reports `ops:key:via` |
| 7 | Sign-in success with no `via` key | passes |
| 8 | Sign-in success with no `npcId`, or an unknown one | passes |
| 9 | Sign-in success on `/login.json` or `/login/` | passes (the server does answer `POST /login.json` with 200) |
| 10 | Bootstrap session never earned, with `via` removed, or with `relay: true` added | passes |
| 11 | Device taken, then a 200 tagged `remove` row for it, then the device answer | passes |
| 12 | Phone taken, then removed, then the choices and the approval | passes |
| 13 | A wrong number cancels Nia's step while Dev's step is open at `push_pc`; then an approval for Nia with no new step | passes (caught only when no other step is open) |
| 14 | Phone choices that do not hold the number the sign-in showed | passes (builder's limit) |
| 15 | Owner approval (`mfa/prompt`, `approvedBy: owner`) for Dev, whose habit is `never` and whose phone the player holds | passes |
| 17 | A second scan of only the tail rows on the same scanner object | caught (state is reset per scan) |
| 18 | `path` carries `?item_id=hana_device&x=1`, the `query` field says `item_id=ines_device` | passes (the recorder never writes both) |
| 20 | An `mfaRequired` answer for `push_pc` on a row whose `login` tag says `plain_pc` | passes |
| 21 | Another account opens a step at the PC, then the first account's pass answer | caught |
| 22 | A pass answer five hours after its step opened | passes (builder's limit) |
| 24 | A pass answer straight after a `lockedOut` answer | passes |
| 25 | `"code":"123456"` in an unparsed `bodyText` | passes |
| 30 | Two `item_id` parameters, another device's query, extra or missing keys, wrong verb, wrong status, device taken after the answer | caught (also covered by the builder's tests) |

Honest answers wrongly reported: see R1-L1, R1-L7 and R1-L13.

## Findings

### R1-L1 (blocker): an honest browser run of `test_ops_mfa` cannot pass, and no option clears it

`access_leak_scanner.rb:3676` (`mfa_signin_pcs`), `:3686` (`mfa_judge_login`).

The recorder (`.claude/skills/playtest-scenario/scripts/response-capture.js`) tags only `POST /inventory` rows. The `login` tag the rule reads exists only in the test, which adds it by hand. With the tags removed from the real run the scanner reports two findings:

- line 12, `mfa_session mfa:session:hana`: beat 7 of `PLAYTEST.md`, the unlock of Hana's own locked session at Accounts PC. Hana owes a step at `code_pc1` and `code_pc2`, so "exactly one step PC" never holds.
- line 32, `mfa_session mfa:session:cal`: the last beat, Cal at Shipping PC (no step). Cal is also admitted at `push_pc`.

`--signin cal@plain_pc#1` and `--signin hana@code_pc1#2` change nothing: the entries are parsed but read only by the privilege rules, which are off in a scenario with no admin account, so each comes back in `unused_entries` and the check exits 2. The scripted playtest that follows this unit will therefore end with findings the tester cannot clear, and the only way forward would be to loosen the rule.

Smallest fix that stays fail-closed: have the recorder tag `POST /login` rows with `login: { pcId }` read from the request body, exactly as it reads `inv` (null when the body cannot be read or the query also names `pc_id`). The scanner already reads the tag and already refuses a tag that is not a sign-in PC id. This is proof from the request, not an assertion. Tag `mfa/verify`, `mfa/prompt`, `mfa/approve`, `logout` and `lock_session` rows the same way (needed by R1-L6, R1-L9, R1-L13). Do not make `--signin` clear an `mfa_session` finding: it is the tester's word, and a sign-in named at the plain PC would hide a real bypass at the step PC.

### R1-L2 (major): the lock mark is never used up, and a session taken by another account stays credited

`access_leak_scanner.rb:3694` (the unlock allowance), `:3745` (the `login` branch of `mfa_note_row` records only an opened step).

Captures 1 and 2. After one 200 `lock_session`, every later sign-in success for that account at that PC passes with no step, although the server unlocks once and then asks for the step again (`mfa_step_for` needs the held session to be this account's and locked). The mark also survives another account signing in at the PC, which on the server replaces the session.

Fix: when the unlock allowance is used, delete the PC from `@mfa_locked`. On any other successful sign-in answer, delete `@mfa_held` and `@mfa_locked` for the PC it names, or for every PC it could be when unnamed. Do the same for each id in an answer's `endedPcIds`.

### R1-L3 (major): `relay: true` alone exempts any session answer

`access_leak_scanner.rb:3656`.

Captures 4, 5 and 10. The server opens a relay session only for an `assist_invite` credential (`CredentialModel::KINDS`, routes `relay`), and step 8c of `credential_login.rb:85` refuses a `saved_connection` at a step PC whatever the route. A typed answer or a saved connection that merely carries `relay: true` is exempt in the scanner.

Fix: drop the `relay == true` clause. Keep `via: credential` with `kind` `token` or `assist_invite`, and require the scenario's registry to hold a credential of that kind for that account whose `connectsTo` is a PC the answer could be about; otherwise it is a finding.

### R1-L4 (major): a session answer out of shape is skipped, not reported

`access_leak_scanner.rb:3515` (route pattern), `:3661` (`mfa_session_hash?`), `:3687`, `:3729`.

Captures 7, 8, 9 and 10. A `POST login` answer with `success: true` is not judged when it has no `via` key, no `npcId`, an `npcId` the scenario does not know, or when the path is `/login.json` (a path the server answers) or `/login/`. A bootstrap session with no `via` is not judged either. The pass routes already fail closed on the same faults; the sign-in and bootstrap routes fail open.

Fix: judge every `success: true` Hash on `POST login` and every Hash under `sessions`. Where the account or the way in cannot be read, report it if any PC it could be about asks any account for a step. Let the route pattern accept an optional `.json` and a trailing slash, or report a `success: true` session-shaped answer on a path it cannot place.

### R1-L5 (major): a device or phone, once taken, is held for the rest of the run

`access_leak_scanner.rb:3741` (only `add` is noted), `:3559`, `:3569`.

Captures 11 and 12. Beat 5 of the playtest drops the code device, which is a tagged `POST /inventory` `remove` row (`item-drop.js:389`). The server then answers 403 at `mfa/device`, but the scanner would pass a 200 with the code. The same holds for a phone's choices and for an approval by the player.

Fix: a 200 `remove` row tagged with that item id takes the item back out of `@mfa_taken`; a 200 `remove` row with a null `inv` takes back every device and phone (the plant rules already treat an untagged remove as unknown).

### R1-L6 (major): a cancel or expiry that could be one of two open steps closes neither

`access_leak_scanner.rb:3759` to `:3761`.

Capture 13. The honest playtest leaves steps open (beat 13 leaves Hana's and Dev's), so by beat 15 a wrong number does not close Nia's step in the scanner, and an approval with no new step passes. Choosing "close nothing" when the answer is ambiguous is the open direction.

Fix: close every open step the answer could be about (a `cancelled` on `mfa/approve` and an `expired` on `mfa/prompt`: the push kinds; an `expired` on `mfa/verify`: the code kind), or exactly one when the row carries the PC tag of R1-L1.

### R1-L7 (major): the `code` and `numbers` key rules run in every scenario and report honest data

`access_leak_scanner.rb:3501` to `:3503` (only the session rules are gated by `@mfa_active`), `:3633`.

`scenarios/sis03_cyber_insurance/scenario.json.erb:1031` authors `minigameData.warranties[].code` ("W-03" and so on), which the room answer must carry. Scanned with the sis03 scenario, a room answer holding one such entry is reported as `mfa_secret mfa:key:code`. The mission has no second step and no device, so there is no code to leak, and the tester has nothing to clear the finding with.

Fix: run the `code` rule only when the scenario authors a `code_device`, and the `numbers` rule only when a policy asks for `push_number_match` (the server's own `mfa_declared?` gate: without them the value does not exist). The five never-keys and `creds.mfa` stay on everywhere. Add a validator line refusing an authored `code` or `numbers` key in a scenario that does have a second step.

### R1-L8 (minor): an owner approval is not checked against what the scenario says the owner does

`access_leak_scanner.rb:3714`. Capture 15. A `mfa/prompt` pass is accepted for an owner whose `prompt_habit` is `never` and while the run holds the owner's phone (the server then answers `waiting`, never a pass). Fix: accept it only when `MfaModel.prompt_habit(npc, @data)` is not `never` and `mfa_phone_taken?(npc)` is false.

### R1-L9 (minor): a logout leaves the earned session credited

`access_leak_scanner.rb:3764`. Capture 3. Fix: an untagged logout clears `@mfa_held` for every PC; a tagged one (R1-L1) clears its PC.

### R1-L10 (minor): the choices are not checked against the number shown

`access_leak_scanner.rb:3606`, `:3746`. Capture 14. No key is needed: keep the `number` of the `mfaRequired` answer in the open step's record and require the entry's `numbers` to include it.

### R1-L11 (minor): `lockedOut` on a second-step route is not modelled

`access_leak_scanner.rb:3759`. Capture 24. The builder's notes say a lockout closes a step; the code handles only `cancelled` and `expired`. Since `d85d519f7` the server refuses verify, prompt and approve for a locked-out account. Fix: treat `lockedOut: true` on the three routes as R1-L6 treats a cancel.

### R1-L12 (minor): a step answer is not checked against its own row

`access_leak_scanner.rb:3609`. Capture 20. When the row has a `login` tag, the `pcId` of the `mfaRequired` answer should equal it. Also `:3513`: when `path` carries an inline query and the row has a `query` field that differs, earn nothing (capture 18).

### R1-L13 (minor): one account with panes open at two PCs makes an honest pass a finding

`access_leak_scanner.rb:3705` to `:3708`. With Hana's step open at `code_pc2` (beat 5 leaves it so) and then at `code_pc1`, the keyboard pass answer names no host, so no step is credited and the pass is reported. The written playtest avoids it only because Ines signs in at `code_pc2` in between. It fails closed; the PC tag on `mfa/*` rows (R1-L1) removes it.

### R1-L14 (minor): the policy name is read differently from the server

`access_leak_scanner.rb:3547`. A `policy` of blank text is used as a name by the scanner (no policy, so no step) but falls to `defaultPolicy` on the server (`.presence`). Use `CredentialModel.policy_for(@data, pc)`.

## The "not covered" list, judged

| Limit | Judgement |
|---|---|
| Code checked by shape only | Can be closed when a game is given: the scanner runs inside the app, so `Rails.application.key_generator.generate_key('break_escape/mfa')`, the game id, the device id and the row's `t` (windows `t/60` and one either side, cross-checked with `secondsLeft`) give the code through `MfaModel.code`. It holds only if the check runs with the same `secret_key_base` as the server that played the game. Recommend closing, with a printed note when no game or no `t` is present. Not urgent: it catches only a code derived for the wrong device or window. |
| Choices not checked against the right number | Close now (R1-L10); no key needed. |
| Unnamed sign-in success is a finding | Not acceptable as it stands (R1-L1). |
| Unlock only when exactly one step PC | Same cause and fix as R1-L1. |
| Cancel, expiry, lockout close a step only when one is open | Close now (R1-L6, R1-L11). |
| Logout clears locks but the pass stays credited | Close now (R1-L9). |
| Wrong codes and the five-minute closure not modelled | Acceptable limit: the answers carry no session. |
| Time not checked | Acceptable to record. Rows carry `t`, so a pass more than 300 seconds after its opening answer could be reported later. |
| `Cache-Control` not checked | Acceptable: the capture holds no headers. |

## For the owner

Limits that remain after the fixes above:

- The scanner trusts a pass answer's own word that the code was right; it cannot see the typed code.
- An owner approval for a `pestered` owner is not checked against the prompt count.
- A step that ran out after five minutes with no answer saying so stays open in the scanner.
- The right `number` in a hash with no `mfa` or `mfaRequired` key on a route outside sign-in is not reported; `number` is too common a key to ban.
- An unparsed `bodyText` or a `dom` page is not read by the key rules (capture 25).
- A session carried in from before the first capture file is reported; give every capture file of the game.
- The `login` tag, once the recorder writes it, is the request's word for the PC, the same standing as the `inv` tag.
