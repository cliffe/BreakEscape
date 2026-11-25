# S5b/S5c leak scanner review, round 2

Scope: the S5b/S5c block of `tools/playtest/lib/access_leak_scanner.rb` at `6364b4953` (lines 4908 to 5281), the edits it made to the S5a rules (`priv_admin_opens?`, `priv_admin_reach`, `scan_admin_act_log_rows`, `note_admin_ever`, lines 3422 to 3503), the relay lines (2876 to 2884, `note_relay_mark`, `keep_relay_mark?`), and the tests `access_leak_scanner_harvest_test.rb`, `access_leak_scanner_harvest_review_test.rb` and `AccessLeakScannerHarvestRealTest`. That is the code after the R1 fixes (`ce9f4b1a4`, `b8178e50b`, `64cc18bc0`, `7b8ef4075`, `892dc2873`, `1132a24ba`) and unit 23 (`6364b4953`).

Result: 0 blockers, 2 major, 6 minor. All 17 R1 findings are closed in the scanner; two of them were closed the way R1 itself asked and that way is too wide (R2-L1, R2-L4), and the validator half of R1-L9 was not built. Nothing was fixed in this round. No fix below loosens a rule.

## How it was checked

- Every capture starts from the real run (`OpsPrivilegeBeats`, 52 rows, as `AccessLeakScannerHarvestRealTest` builds it) and is scanned with the real scanner and the real game after the run. Scratch tests, outside the repo: `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s5bc-scanner-r2/` (`r2_attack_test.rb`, `r2_attack2_test.rb`, `r2_attack3_test.rb`; results in `attack_out.txt`, `attack2_out.txt`, `attack3_out.txt`, `scenarios_out.txt`).
- The shared tree held a builder's uncommitted edits to `scenarios/test_ops_privilege/scenario.json.erb` and `ops_privilege_scenario_test.rb`. The scratch tests therefore use copies of both files taken from `HEAD` (`git show`), so every capture result here is for the committed code.
- Row numbers below are the real run's (1-based): 5 Adel signs in at `bay_pc`, 6 and 7 the collects there, 14 the first keyring with hash rows, 21 the hot desk collect, 29 the borrow done answer, 34 the collect after the borrow, 43 the audit rows, 45 the invite item taken, 46 the keyring that lists the invite, 47 the relay sign-in of Adel at `hot_desk`, 48 its desktop, 49 its collect.
- The recorder (`.claude/skills/playtest-scenario/scripts/response-capture.js`) was read, not changed. One fact the R1 fixes and unit 23 did not use: it tags every `POST /inventory` row with `inv: { action, itemId, usedOn }` (lines 22 to 29, 71 to 92). So the capture does name the stick and the socket of a plant, although it keeps no request body (R2-L2).

### Tests run

| What | Result |
|---|---|
| All scanner test files in the shared tree (`test/unit/access_leak_scanner*_test.rb`, `test/controllers/break_escape/access_leak_scanner_*_test.rb`) | 557 runs, 28 failures. All 28 are one assertion in the builder's uncommitted beat (`ops_privilege_scenario_test.rb:293`, "to include kind"): the 25 tests of `AccessLeakScannerHarvestRealTest` and the 3 tests of the scenario file it requires. Not a scanner fault. |
| S5a real captures (`AccessLeakScannerPrivilegeRealTest`), S7 (`access_leak_scanner_ops*_real_test.rb`, the crack unit files), S8a (`access_leak_scanner_mfa_*`) | Green in that run: they report what they reported (their own tests pin the counts). |
| The committed real run through the scratch harness (HEAD scenario, HEAD beats) | 52 rows, 0 findings. |
| Scanner built over every shipped scenario (208 `scenario.json.erb`, rendered with `ScenarioBinding`) | 208 build, none raises. Only `test_ops_privilege` (the builder's working copy) has account-only accounts (2) and candidates (6). |

### Captures and results

"Passes" means 0 findings for an answer the server would never give.

| # | Capture | Result |
|---|---|---|
| G1 | Relay sign-in (47) removed; the relay desktop (48) with no own-profile item; the collect (49) follows | passes |
| G1b | Rows 1 to 35, then that desktop and the collect, then the rest: no relay sign-in, and the invite is not held until row 45 | passes |
| H1 | As G1b, the desktop twice, the second one serving the profile of an account cached at `hot_desk` (a profile for Priya added to the data), then the collect | passes |
| H1b | Rows 1 to 13, then the same three rows (Priya's row only): no admin has been at `hot_desk` at all | passes |
| G2 | The real relay sign-in, desktop and collect (47 to 49) moved before the invite item (45) and the keyring that lists it (46) | passes |
| G3a | Rows 1 to 5 (admin signed in at `bay_pc`, no collect ever), then a `CRED_COLLECT` row for `Bay desk PC`, `count: 8` | passes |
| G3b | Rows 1 to 5, then a `USB_OVERRIDE` row for `Bay desk PC` (no stick was ever used) | passes |
| G3c | Real run; the bay `CRED_COLLECT` row says `count: 7` and `OK x9` (the collect added 2, once) | passes |
| G3d | Real run; the bay `CRED_COLLECT` row says `as: umaquay` | passes |
| G3e | Admin signed in at `bay_pc` and signed out; then both rows for that PC | passes |
| G3f, G3g | A `CRED_COLLECT` row for a PC no admin was at, or before the admin sign-in | caught |
| G4 | The collect 404 whose `error` text is `Container not found: hot_desk caches Priya Nair (pnair) and Sam Okoro (sokoro) <a hash token>` | passes |
| G5 twin | Admin at `bay_pc`; the `bay_pc` desktop shows `uma_todo` (Uma is cached there) | clean |
| G5a | Admin at `bay_pc`; the `store_pc` desktop shows `uma_todo` | caught |
| G5b | `uma_todo` in the `bay_pc` desktop before the admin sign-in | caught |
| G5c | Uma cached nowhere; admin `bay_pc` desktop shows `uma_todo` | caught |
| G5d | Uma cached at `hot_desk` only; admin `bay_pc` desktop shows `uma_todo` | caught |
| G5e | A folder of Uma's profile; admin at `bay_pc`; Uma cached at `hot_desk` only | caught |
| G5g | A folder of Uma's profile; admin at `hot_desk` only; Uma cached at `bay_pc` only | caught |
| G5h | A profile of Sam (borrow candidate at `hot_desk`) in the admin desktop there before the borrow | caught |
| G5i | The same after the borrow, admin signed in again | clean |
| G5j | The same after the borrow with the admin signed out | caught |
| G6a, G6b, N1, N2 | A registry row (hash, invite, or an unknown id) carrying the account block of an account-only account, in a keyring or in any body with `rev` and `entries`, proof never held | one finding (`credential_unheld`), and the account's name and username are earned by it (R2-L6) |
| G6c, N3 | The same, then the name and username in a later room answer | still one finding; the later leak is not reported |
| G7 | Honest real run, the account-only username is `guest`, `host`, `session`, `success`, `held`, `status`, `storage`, `relay` or `error`; or its display name is `Hot desk PC` or `Privilege audit` | flagged on honest rows, 1 to 40 findings (R2-L3); `backup`, `service`, `profile` are clean on this run |
| G8a | The collect's `keyringRev` is `ffffff` (no keyring answer has it) | passes (not a finding: the rev changes for honest reasons and holds no secret) |
| G8b | The user desktop answer (row 2) with a key `cached` listing the display names and usernames of the accounts cached at `hot_desk` | passes (R2-L7) |
| G8c, G8d | A second relay collect after Uma's relay at `store_pc`, or after a keyboard sign-in at `bay_pc` | clean, and honest: the game holds both sessions |
| G8e, G8f, M5 | A `held` row for the borrower before the borrow; a collect naming another PC; a row for an account the PC does not declare | caught |
| G8i | No game | 7 findings (fails closed) |
| M1 | The strings `hot_desk\|priya`, `hot_desk\|sam`, `bay_pc\|uma` in an answer | passes (R2-L5) |
| M2 | The id, label and token of the uncollected `hot_desk` hash record as plain strings in row 2 | passes (R2-L5) |
| M3, M4 | That whole hash row outside the keyring, or in the keyring before its own PC's collect | caught |
| M6, M7 | The collect answer on a GET, or with a status that is not the integer 200 | caught |

## R1 findings

Evidence is the fixer's test in `access_leak_scanner_harvest_review_test.rb` (green) plus this round's capture on the real run.

| R1 | State | Evidence |
|---|---|---|
| L1 (blocker) relay admin collect | closed, too wide | Real rows 47 to 49 clean. Flagged with no game, with the invite item gone from the game, with a bootstrap or a logout between desktop and collect. The desktop branch R1 asked for sets the mark with no sign-in: R2-L1. |
| L2 (blocker) typed sign-in earns the username | closed | Typed sign-in of an account-only admin and its desktop: clean. A desktop naming it with no sign-in, a failed sign-in answer naming the username: flagged. A keyring sign-in earns the name only. |
| L3 (blocker) `profile_admin_read` and cached accounts | closed | G5 twin clean; G5a to G5j as the table says. Another PC, an account cached nowhere or elsewhere, before the admin session, a borrower before its borrow: each flagged, desktop and folder. |
| L4 relay admin only where the server shows one | closed | A relay admin in a bootstrap `sessions` map, in another PC's desktop, with `footholdId`, with another PC's label: each `ops:key:access`. |
| L5 invite proof must hold | closed as asked; order not proved | Flagged when the game lacks the item. It reads the end state only, and nothing else proves order: G2 and R2-L1. |
| L6 closed list of refusals | closed; 404 text loose | A 422 with an extra key and a 200 array are flagged. R1 asked only for `{ error: <String> }` on a 404: R2-L4. |
| L7 borrow proved by capture order | closed | The done answer moved after the collect is flagged (3 findings); tamper 8 and 9. |
| L8 row values tied to the scenario | closed | Another account's username or any portrait text: `harvest_row values:olu`. |
| L9 ordinary words | scanner half closed, list too short; validator half not closed | `admin` raises at construction. `guest` and others do not: R2-L3. `scripts/validate_privilege.rb` has no name clash check. |
| L10 username in any case | closed | `ROTAKEEPER` in a log row is flagged. |
| L11 empty collect needs an admin session; `pcId` | closed | An empty 200 with no admin: `harvest_unearned answer`. A collect naming another PC: flagged. |
| L12 list consistency | closed | A harvested row not in `held`, a repeated row: flagged. |
| L13 tiles and keys | closed | A key named by the username is flagged. Reading keys is what makes R2-L3 bite. |
| L14 shared host label | closed | Fixer's test green. Not re-run on real answers: no two PCs of the scenario share a label. |
| L15 limits recorded | closed | Block comment, lines 4922 to 4925. |
| L16 refusal to run | closed | `credential_proof_holds?` is asked for; the rule text names the `cachedAt` case. |
| L17 sign-in tag | closed | Comment corrected (`harvest_test.rb:5`); the two-PC test is in the review file. |

## New findings

### R2-L1 (major): a relay administrator is proved by the desktop answer alone, and nothing proves the invite was held first

`access_leak_scanner.rb:5264` (`note_relay_mark`), `:5247` (`relay_session_pc`), `:5226` (`relay_admin_pc`), `:2881`. Captures G1, G1b, H1, H1b, G2. Unit 23 recorded the first half as a limit (tamper 5); it is a gap with a fix in the capture.

Two things are missing:

1. A 200 desktop answer of the PC that shows `relay: true, access: "admin"` sets the mark by itself. The server makes a relay session only in `POST /login`, and a reload ends every relay, so a relay desktop with no relay sign-in earlier in the same capture is an answer the server would not give. With the mark set, the next desktop or folder answer serves the profiles of the accounts cached there and the collect is credited (H1b: after row 13, where no admin was ever at `hot_desk`).
2. The invite's proof is read from the game after the run. A relay sign-in that says admin before the player held the invite passes when the invite is picked up later (G2). R1-L5 accepted the end state because "the invite's own keyring rules judge order"; they judge the keyring row, not the sign-in.

Fix (adds proof, loosens nothing):

- Keep a per-scan set `@hv_invite_listed` of registry ids. Add an id when a 200 `GET /keyring` answer (`ctx[:crack_keyring]`) lists an entry with `source: "registry"`, `kind: "assist_invite"` and that id, and `credential_proof_held_ids` includes it (so `credential_unheld` did not fire on it). Never take one back.
- In `relay_admin_pc`, for the sign-in answer: require an invite entry for that account and PC whose id is in `@hv_invite_listed` (beside the game checks already there).
- In `relay_admin_pc`, for a desktop answer: require an earlier proved relay sign-in for the same account at that PC that has not been taken back. Keep it in a map `@hv_relay_signed` (PC id => account id), set only by the sign-in answer and cleared in exactly the places `@hv_relay` is cleared. For R1-L14 (a sign-in whose label two PCs share): record the sign-in as pending under `[npcId, label]`, and let the first 200 desktop answer of a PC with that label and that relay session take it; the sign-in answer itself stays flagged as it is today.
- `note_relay_mark` then needs no other change: the desktop keeps the mark, it never creates one.
- Tests on the real run: G1, G1b, H1, H1b, G2 each flagged (`ops:key:access` on the desktop or the sign-in, and `harvest_unearned` on the collect); the real run still clean; the R1-L14 twin (shared label, sign-in then desktop) still as the fixer's test pins it. Replace the comment on tamper 5 and assert the collect is unearned there.
- Add to the known limits: a relay admin desktop is flagged when its sign-in, or the keyring answer that listed the invite, is in an earlier capture file.

### R2-L2 (major by the scanner's own rule; the content leaked is small): `CRED_COLLECT` and `USB_OVERRIDE` rows are allowed without the act that writes them

`access_leak_scanner.rb:3491` (`scan_admin_act_log_rows`), `:3501` (`note_admin_ever`). Captures G3a to G3e.

The rule asks only that an admin session was shown at that PC at some time. The server writes `credentials_harvested` only when a collect added a pair (`cached_credentials.rb:57`), with the session's username and `count` equal to the pairs added; it writes `usb_install_overridden` only when a storage stick was planted under an admin session. Both acts are in the capture. As it stands a row passes with no collect and no stick (G3a, G3b), with any count and any repeat (G3c), under any account (G3d), and after the session ended (G3e). What leaks is a count of cached accounts and an account name, so this is a small leak, but the allowance is not tied to its proof.

Fix:

- `CRED_COLLECT`: when `judge_harvest_answer` accepts a 200 answer whose `harvested` list is not empty and every row of it was credited, record `[pcId, username of the account held there, harvested.size]`. The account is `@ops_session_accounts[pc]`, or `@hv_relay[pc]` for a relay. In `scan_admin_act_log_rows`, read a row's repeat from `result` (`OK` is 1, `OK xN` is N) and its count from `detail` (`count: N`). For each PC, account and count, the repeats in the answer must not exceed the recorded collects. A row with an unreadable `result` or `detail` is unearned.
- `USB_OVERRIDE`: record a plant when a 200 `POST /inventory` answer is exactly `{ "success": true }`, its `inv` tag says `action: "remove"`, `usedOn` names an object whose plant PC (the `needsSession` grant PC, else the object itself if it is a sign-in PC, else its `portOf`, as `plant_admin_pc` reads it) holds an admin step or relay mark at that row, and `itemId` is a storage device of the scenario. Record `[pc, username]`. One recorded plant per row repeat, `detail` exactly `device: storage` (or `hid` for a HID device under the same proof). A row with a null `inv` earns nothing.
- Remove `@hv_admin_ever` and `note_admin_ever`.
- `AccessLeakScannerHarvestRealTest#record_row` must add the `inv` tag as the recorder does (from the request's `action_type`, `item.id`, `used_on`); otherwise the real `USB_OVERRIDE` row is flagged.
- Tests: G3a to G3e each flagged; the real row 43 clean; tamper 16 to 18 unchanged.
- Limit to record: a row whose collect or plant is in an earlier capture file is flagged (fails closed).

### R2-L3 (minor): the refused word list is too short now that JSON keys are read

`access_leak_scanner.rb:4965` (`HARVEST_ANSWER_WORDS`), `:5193` (keys read since R1-L13). Capture G7.

An account-only username `guest` flags the honest borrow done answer (its key `guest`). `host`, `session`, `success`, `held`, `status`, `storage`, `relay` and `error` flag between 1 and 40 honest rows. A display name equal to a PC's name or a log's title flags the audit answer. `guest` is a likely name for an account with no person. These fail closed; the cost is a scan that cannot end clean for an honest run, with no warning to the author.

Fix:

- Scanner: build the refused list from what it already knows instead of fourteen literals: every key in `HARVEST_ANSWER_KEYS`, `HARVEST_ROW_KEYS`, `RELAY_FORBIDDEN_KEYS`, the session keys (`npcId username displayName via portrait kind label access relay host route remote locked`), the log row and keyring row keys the older rules pin, the words `guest ok true false null storage hid device count profile error message reason status success session`, and, for both words, every PC `name` and `host`, every room name and every log `title` of the scenario (compared whole, any case). Keep raising `ArgumentError`.
- Validator (the half of R1-L9 that was not built): the same check as an error in `privilege_account_only`, and a warning when any authored string served to the browser contains an account-only display name or username as a whole word.
- Test: `guest` raises; the real `deskadmin` and `labadmin` accounts do not.

### R2-L4 (minor): the collect 404 may carry any text

`access_leak_scanner.rb:5026` (`harvest_refusal_ok?`). Capture G4.

The server's body is `Container not found: <the pc_id sent>`, and `pc_id` is at most 40 characters (`games_controller.rb:2093`). Fix: require `error` to match `/\AContainer not found: [^\n]{1,40}\z/`. The id is the player's own text and is not in the capture, so the 40 characters stay unjudged by this rule; the other string rules still read them.

### R2-L5 (minor): pair strings and a harvested record's own strings are not looked for

Captures M1, M2. Brief 4.6 lists "a collect pair string" among the things no answer may carry, and 4.7 asks for "a `hashId` for an account before a 200 collect answer". Only the key `hashId` and a keyring row are checked. The strings `hot_desk|priya`, and the id, label and token of a harvested hash record that has not been collected, pass as plain text in any answer.

Fix: in `scan_harvest`, over `each_string` and the hash keys: (a) any string that contains `CachedAccounts.pair(pc, npc)` of a declared candidate is `harvest_key`, owner `pair:<pc>|<npc>`, always; (b) until `@hv_served_hashes` holds a harvested record's id, a string that contains its id as a whole word, or equals its authored `label`, or contains its token (`@game.crack_token`, when the game is given), is `harvest_hash`, owner `credential:<id>`. Run (b) after `judge_harvest_answer` so the collect answer that serves the row is clean. Tests: M1, M2 flagged; the real run clean.

### R2-L6 (minor): a keyring row earns an account-only account's words even when the older rules refuse the row

`access_leak_scanner.rb:5139` (`note_harvest_keyring`), `:5160` (`harvest_row_account`). Captures G6a to G6c, N1 to N3.

R1-L2 said "once the older keyring rules have accepted the row". The code earns from any `source: "registry"` entry in any body that has `rev` and `entries`, whatever its id. The row is always reported by `credential_unheld`, so no capture ends clean, but every later leak of the name and username is hidden behind that one finding. Fix: earn only when the entry's id is a registry id, `credential_proof_held_ids` includes it, the registry entry's account is that account-only account, and the answer is a 200 `GET /keyring` (`ctx[:crack_keyring]`). Test: G6c and N3 report the later room answer too.

### R2-L7 (minor): a list of cached accounts under any other key is not seen

Capture G8b. Brief 4.6: "any uncollected account's name or username on a PC whose picker does not already show it". An ordinary account's name and username are not secret words, so no string rule can carry this; what is secret is the list. Fix: outside the collect route, a hash that holds five or more of the six `HARVEST_ROW_KEYS` is `harvest_row`, owner `row:elsewhere` (a session answer holds four). If the builder finds an honest answer with five, record this as a limit in the block comment instead; do not add an exemption.

### R2-L8 (minor): the borrow proof can name the borrower

`access_leak_scanner.rb:5121` (`note_harvest_borrow`). Unit 23's fourth limit ("two borrowers share a done proof") is wider than stated: a done answer of any NPC's borrow at that PC opens every borrow candidate there that the end state holds, so a row served between another NPC's done and the candidate's own passes. Not shown by a capture here: the scenario has one borrower. The capture names the borrower one step earlier: the `POST /npc_frustration` answer that hands the run over carries `answers[].npcId` and `run: { do: "borrow_session", pc }` (real row 28). Fix: keep `@hv_borrow_handed` (PC id => set of NPC ids) from those answers, and credit a borrow candidate only when it was handed a borrow run at that PC before the done answer. The limit that remains (two handed borrowers, one done) stays in the comment.

## The four limits unit 23 listed

| Limit | Verdict |
|---|---|
| Relay admin proved by its desktop row alone | Not a limit of the capture: R2-L1. |
| Log rows earned by any earlier admin session (no timing) | Not a limit of the capture: the collect answers and the `inv` tag carry the act. R2-L2. |
| The stick-planted answer is bare `{ success: true }` | True of the body; the row's `inv` tag identifies it. R2-L2. |
| Two borrowers share a done proof | Can be narrowed to "two borrowers who were both handed a run": R2-L8. |

## Checked, no finding

- `pcId` on the collect: a row is credited only at the PC named, only for an account that PC declares, only with an admin step or mark there now (G8e, G8f, M5, tamper 7). The server could name a PC other than the one asked for; the rows would still be that PC's own and the admin there could collect them, so nothing unearned passes.
- Typed sign-in earning the username: only a 200 success answer with `via: "password"` and no relay earns it, for that account only. It rests on assumption 3 below.
- `HARVEST_REV_FORMAT`: matches `keyring_rev` (`credential_keyring.rb:302`, six lower-case hex characters of an MD5). An integer or any other text is `harvest_row`.
- Account-only words at construction: no shipped scenario raises (208 built).
- Relay mark take-back: sign-out, bootstrap, a later sign-in that could be about the PC, a desktop that does not show the same relay admin, `endedPcIds`. Each removes it.
- The L3 change: see the R1 table. An admin session opens a cached account's profile only at the PC that caches it, only while the admin step or relay mark is held, and a borrow candidate's only after its borrow.

## Assumptions the server units must meet

1. A relay session exists only after a `POST /login` relay sign-in answer in the same page load, and a reload ends it (R2-L1). The relay sign-in answer of an administrator carries `access: "admin"`, `relay: true`, `host`.
2. The client lists the keyring (`GET /keyring`) before a keyring sign-in, so the invite's row is in the capture before the relay sign-in (R2-L1).
3. No picker lists an account-only account on any route (`login_accounts`, `from_login_accounts`, a room entry), and `POST /login` accepts it only by a typed username. Units 20 and 25 must keep this, or the typed sign-in would no longer prove the player knew the username.
4. Every credential kind that can sign in to an account-only account has a keyring row with S7's account block before the sign-in (a keyring sign-in earns the name only; the row earns the username).
5. `credentials_harvested` is written once per collect that added a pair, with `count` equal to the pairs added and `as` the session's username; `usb_install_overridden` once per storage stick planted under an admin session, at the plant PC (R2-L2). The ops log merges equal rows as `OK xN`.
6. The collect 404 body stays `Container not found: <id>` with the 40 character limit on `pc_id` (R2-L4).
7. The run answer of `POST /npc_frustration` keeps `npcId` and `run.do`, `run.pc` for a borrow (R2-L8).
8. R1's assumptions 1 to 9 still stand, with `pcId` now in the collect answer and `keyringRev` six hex characters.

## For the owner

Nothing to decide.

## Verdict

Not clean: 0 blockers, 2 major (R2-L1, R2-L2), 6 minor. A further round is needed after the fixes; it can be a delta review of `relay_admin_pc`, `note_relay_mark` and `scan_admin_act_log_rows`, on Opus because the delta touches what the scanner allows.
