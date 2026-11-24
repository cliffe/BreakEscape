# S5b/S5c leak scanner review, round 1 (early)

Scope: commit `e6abc9e6a` (unit 15): the S5b/S5c block of `tools/playtest/lib/access_leak_scanner.rb` (lines 4867 to 5082), the rewritten R4-2a lines (2876 to 2881) and `test/unit/access_leak_scanner_harvest_test.rb`.
Read against the server as built: the collect route (`761d2fb9d`, `harvest_credentials` in `games_controller.rb:2088`), the relay rule (`14395626f`, `81dcec7fb`), the port override (`866fa7e07`), `cached_credentials.rb` (`b5426bbdd`), the keyring `harvested` proof (`25cdea471`), the borrow writer (`fd4d1f9cc`).

Result: 3 blockers, 7 major, 7 minor. Nothing was fixed in this round. No rule should be loosened to clear any of this; every fix below adds proof or tightens.

## How it was checked

- Every capture below is built in a scratch test outside the repo and scanned with the real scanner: `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s5bc-scanner-review/s5bc_scanner_hostile_test.rb`. It uses the shared fixture `test/support/cached_accounts_fixture.rb` and the builder's own row shapes. "Passes" means 0 findings for an answer the server would never give.
- Tests run: the builder's file and the other scanner unit files (337 runs, green); the nine real-answer files under `test/controllers/break_escape/` (147 runs, 14 failures, all in `access_leak_scanner_privilege_real_test.rb`, see R1-L3). Those 14 appear only with the uncommitted wave 3 edit of `scenarios/test_ops_privilege/scenario.json.erb` that is in the shared tree; the builder's report of a clean run at `e6abc9e6a` is not disputed.
- The recorder (`.claude/skills/playtest-scenario/scripts/response-capture.js`) was read, not changed. It keeps `method`, `path`, `query`, `status`, the body, and the tags `npcId` (feed posts) and `inv` (inventory). It does not tag `POST /login` rows: the `login.pcId` tag in the builder's tests exists only in tests (R1-L17).

### Captures and results

| # | Capture | Result |
|---|---|---|
| A1 | A 200 collect answer with empty lists, no admin session anywhere in the capture | passes |
| A2a | A 422 `not_admin` refusal that carries a row (with `hashId`) under a key `accounts` | passes |
| A2b | A 200 collect answer whose body is an array of rows | passes |
| A2c | A 403 with `reason: not_admin` and extra keys `pc`, `cached` | passes |
| A3 | Admin sign-in, then a row for the borrow-gated account; no borrow anywhere in the capture; the game's end state holds the pair | passes |
| A4a | A credited row for jake that carries Sam's display name and username | passes |
| A4b | A credited row whose `avatar` and `portrait` hold arbitrary text | passes |
| A5a, A5b | A harvested hash row in the keyring with another `source`, or none | caught by S7 (`crack_row`) |
| A5c | The same row on `/keyring.json` | caught |
| A6 | A cracked or running `POST /crack` answer for a harvested hash never collected | caught by S7 |
| A7 | A row for an account that is borrow-gated at the admin's PC and a start candidate at another PC | caught |
| A8 | A `harvested` row that is not in `held` | passes |
| A9 | A row for a declared candidate that is no NPC of the scenario | passes |
| A10 | Unearned rows on `/harvest_credentials.json` | caught (`harvest_key`) |
| A11 | An account-only name in an unparsed `bodyText` | caught |
| A12 | An account-only tile `{ npc: "jake" }` under `accounts` | passes |
| A13 | An account-only username as a JSON key | passes |
| A14b | Account-only username authored `JBrooks`; a log row shows `jbrooks` (the server's normalised form) | passes |
| A15 | A relay admin session while the game says the invite's proof does not hold | passes |
| A16 | A relay admin record in the bootstrap `sessions` map | passes |
| A17 | A relay admin session in a `GET /network` host row | passes |
| A18 | A relay admin session in a room answer | passes |
| A19 | A collect row before the admin sign-in | caught |
| A20 | A collect whose body was lost, then the keyring row | flagged (fails closed) |
| A23 | A relay admin (invite for `profile_pc`, label `Hot desk`) in the desktop answer of `it_pc` | passes |
| A24 | A relay admin session that also carries `remote: true` and a `footholdId` | passes |
| A25 | A proved relay admin, then a keyboard-shaped admin desktop with no sign-in | caught |
| B1 | Honest: relay admin sign-in (or desktop), then a collect | flagged `harvest_unearned` |
| B2 | Honest: account-only username `admin`, a keyboard admin desktop (`access: "admin"`) | flagged `account_only` |
| B3 | Honest: a typed sign-in to an account-only account, the server's own session answer | flagged `account_only` (username) |
| B4a, B4b | Honest: a `signin_fail` or `signin_refused` log row naming an account-only username (with `kind: local` detail) | not flagged |
| B4c, B4d | Honest: a `signin_ok` or `CRED_COLLECT` log row after that typed sign-in | flagged `account_only` (username) |
| B5 | Honest: relay admin desktop answer where two PCs share the host label | flagged `ops:key:access` |
| B6 | Honest: a second capture file whose keyring lists a hash collected in an earlier file | flagged `harvest_hash` |
| B7 | Honest: a collect after an untagged admin sign-in of an account two PCs admit | flagged until a `--signin` entry names the PC |
| E1, E2 | Base scenario (no `cachedAccounts`, no account-only, no invite): candidates 0, account-only 0, harvested hashes 0; honest rows clean | inert |
| F | A bare game object: refused when a borrow candidate or an assist invite exists; accepted otherwise | see R1-L16 |

## Answers to the six questions

- (a) Leaks that pass: R1-L4 to R1-L10, R1-L11 to R1-L13.
- (b) Honest answers flagged: R1-L1 (relay admin collect), R1-L2 (typed sign-in to an account-only account), R1-L3 (admin reach to a cached account), R1-L9, R1-L14, R1-L15. The `signin_refused` worry in the builder's report does not happen: see "Not a finding" below.
- (c) Interference: the new rules do not change what the S7 and S8a rules report. The S5a rule `profile_admin_read` now disagrees with the server (R1-L3). The R4-2a edit leaves every non-relay case as it was (a claim with admin is still one finding; a relay with admin and no proof is still reported).
- (d) The three missing-proof cases (no invite for that account at that PC, account not `creds.admin: true`, PC does not admit) are each flagged, and so are the builder's four extra cases. Two more proofs are missing from the rule: R1-L4 and R1-L5.
- (e) Inert in a scenario with none of the new fields: yes (E1, E2, and the 337 older unit tests).
- (f) Refusal to run: works for the borrow reader and `account_admin_at?`. One reader is not asked for (R1-L5) and one message could be clearer (R1-L16).

### Not a finding: the `signin_refused` log row

`scan` blanks the identity cell of every typed `SIGN_IN` row before any rule sees a `/log_rows` body (`access_leak_scanner.rb:574`, `log_rows_without_typed`). A `signin_fail`, `signin_lockout` or `signin_refused` row has no `method:` in its detail, so its `as` is blanked; the new `kind: local` or `kind: domain` detail does not change that (B4a, B4b: 0 findings). The exemption is proof-based as it stands: the server writes those rows only from what the player typed (`game.rb:3654`, `3665`, `4695`), and `as.account` on a refusal is written only after the typed password matched. No server change is needed. Unit 17 must keep `method:` out of a refusal's detail.

## Findings

### R1-L1 (blocker): an honest relay admin collect is always flagged, and the capture already holds the proof

`access_leak_scanner.rb:4986` (`harvest_credited_pcs`). Captures B1, B1c.

The server lets a relay session of an administrator account collect (`games_controller.rb:2110`, `session_access` after ruling B). The scanner credits a row only on the S5a step `admin:<pc>`, which a relay never earns, so every row of such a collect is `harvest_unearned`, and the later keyring rows are `harvest_hash`. A playtest that follows ruling B cannot end clean.

A proof-based way through exists with what the recorder keeps; no server key is required for it:

1. Add a per-scan map `@hv_relay_admin` (PC id => account id). Set it when a session passes `relay_admin_proved?` (as tightened by R1-L4 and R1-L5) in a 200 `POST /login` success answer or in the `session` of a 200 `GET /container/<that PC>` answer.
2. Take the mark back wherever the admin step is taken back: every PC passed to `end_priv_session`, every PC a later successful sign-in could be about (`note_privilege_signin`'s `pcs`), a 200 desktop answer of that PC whose session is not that same relay admin, any bootstrap (a reload ends every relay), and a `POST /logout` success (every PC).
3. `harvest_credited_pcs` accepts a PC with `admin:<pc>` earned or with the mark.
4. Never add `admin:<pc>` to `@ops_earned` for a relay: the S5a rules read that step for keyboard-only allowances.

Tests: B1 clean; the same capture flagged with the invite removed, with the account not admin, with a disconnect (`endedPcIds`) between the sign-in and the collect, and with a bootstrap between them.

### R1-L2 (blocker): a typed sign-in to an account-only account is flagged on the server's own answer

`access_leak_scanner.rb:5026` (`note_harvest_login`), `:5033`. Captures B3, B4c, B4d.

`login_session_answer` always carries `username` (`game.rb:4808`). The scanner earns only the display name at a typed sign-in, so the sign-in answer itself, every later desktop answer, the `signin_ok` row and the `CRED_COLLECT` row written `as: { account: }` for that admin are each reported. Account-only accounts are reached by typing, so this is the main S5c path.

The proof is in the capture: the server answers `success: true` with `via: "password"` only when the typed username and password both matched (`game.rb:3660`). The player supplied the username. Fix: in `note_harvest_login`, a 200 success answer with `via: "password"` and no `relay: true` adds the account to `@hv_user_earned` as well as `@hv_name_earned`. Keep `via: "credential"` earning the name only, and add: any registry keyring row that carries an `account` block for an account-only account (not only hash rows) earns both, once the older keyring rules have accepted the row. This contradicts one line of the brief's table 4.6; see "For the owner".

### R1-L3 (blocker): the S5a rule `profile_admin_read` flags an admin's reach to a cached account's profile

`access_leak_scanner.rb:3416` (`priv_admin_opens?`), `:3404` (`note_privilege_read`). Shown by `access_leak_scanner_privilege_real_test.rb` in the shared tree: 14 failures, each one inspected reads `profile_admin_read item:uma_todo` on `GET /container/bay_pc`.

Unit 08 widened admin profile reach to the accounts cached at the PC now (`admin_present_accounts`, `game.rb:3581`; brief 4.5, point 2). The S5a rule still credits only the PC's owner, so once a scenario declares `cachedAccounts` on a PC, an honest admin desktop there is a leak to the scanner. The wave 3 scenario edit does exactly that (`bay_pc` caches `olu` and `uma`).

Fix: in `priv_admin_opens?`, a PC with the admin step opens a profile when the list admits its owner or any account cached there now: every start candidate of `@hv_candidates` at that PC, and a borrow candidate only with the borrow proof of R1-L7. `note_privilege_read` and the `ADMIN_READ` row count follow from the same method. The relay mark of R1-L1 must open the same reach (ruling B, point 1), and nothing else. Tests: the 14 real tests green again; a twin where the profile belongs to an account neither owning nor cached is still flagged; a borrow candidate's profile before its borrow is still flagged.

### R1-L4 (major): a relay admin is allowed anywhere an answer shows one

`access_leak_scanner.rb:2878`, `:5065`. Captures A16, A17, A18, A23, A24.

The server shows a relay session in two places only: the relay sign-in answer and that PC's desktop answer. The bootstrap `sessions` map never holds a relay (`game.rb:3983`), a network host row never lists one (`network_access.rb:1098`), and no room answer carries a session. `relay_admin_proved?` does not look at the route, and it resolves the PC from the host label even inside another PC's desktop answer.

Fix: `relay_admin_proved?` returns false unless the row is a 200 `POST /login` success answer and the hash is the body, or a 200 `GET /container/<pc>` answer and the hash is `body['session']` and the PC the label names equals the container id. It also returns false when the session carries `remote`, `footholdId`, `fromPcId` or `locked` (a relay is none of those and cannot be locked). Tests: A16, A17, A18, A23, A24 each flagged; the builder's clean twin still clean.

### R1-L5 (major): a relay admin passes while the invite's proof does not hold

`access_leak_scanner.rb:5065`. Capture A15.

Brief 4.6 names the proof as "assist invite proof holds, and `account_admin_at?`". The rule checks only that the registry declares an invite, which every game of the scenario satisfies from the first second. Fix: find the invite entries for that account and PC, and require `@game.credential_proof_holds?(id, entry) == true` for at least one. Add `credential_proof_holds?` to the readers `require_harvest_game_methods` asks for when `@hv_relay_possible`. This reads the end state; it is a floor, not an order check, and the review accepts that because the invite's own keyring rules judge order.

### R1-L6 (major): a collect answer that is not the server's shape passes when it is not a plain 200 hash

`access_leak_scanner.rb:4943` (`judge_harvest_answer`). Captures A2a, A2b, A2c.

A non-200 answer is checked only for the keys `harvested` and `held`, and `hashId` is exempt on this route, so rows under any other key, an array body, and any extra key pass. The route has exactly five refusals. Fix: judge every answer on this route against a closed list:

- 200: as now.
- 400: exactly `{ success: false, reason: "bad_request" }`.
- 403: exactly `{ success: false, reason: "not_reachable" }`.
- 422: exactly `{ success: false, reason: "locked" }` or `{ success: false, reason: "not_admin" }`.
- 404: exactly `{ error: <String> }`.
- Anything else with a parsed body (another status, an array, an extra key): `harvest_row`. A row with no parsed body is not judged.

### R1-L7 (major): the borrow is proved by the game's end state, not by the capture

`access_leak_scanner.rb:4994` (`harvest_borrowed?`). Capture A3.

`cachedAt` is read once, from the game after the run. A row for a borrow-gated account served before the borrow passes whenever the borrow happens later in the same run. Fix: keep the game check as a floor and add an order proof from the capture: credit a borrow candidate only after an earlier 200 `POST /npc_workaround` answer in the same scan that the server gives for an accepted "done" of a `borrow_session` workaround. The builder must read `npc_workaround` in the controller and pick the narrowest thing that answer shows. If the answer names neither the borrower nor the PC, credit only when exactly one borrow candidate pair exists in the scenario, else see the server key under "Assumptions". Tests: A3 flagged; the same capture with the done answer first is clean; the done answer after the collect is flagged.

### R1-L8 (major): a credited row's values are not tied to the scenario

`access_leak_scanner.rb:4981` (`harvest_row_values_ok?`). Captures A4a, A4b.

A credited row for jake may carry any other account's name and username (the brief's never list: "any uncollected account's name or username"), and any text in `portrait` and `avatar`. Fix: after the credit, require `displayName == npc['displayName'] || npc['id']`, `username == npc.dig('creds', 'username')`, `avatar` equal to the NPC's `avatar` string or nil, and `portrait` nil or a String that does not differ between rows of the same account in the scan; for an account-only account both nil (as now). A mismatch is `harvest_row`. If the builder can call the server's own portrait reader without a game, compare exactly.

### R1-L9 (major): an account-only name that is an ordinary word flags honest answers

`access_leak_scanner.rb:5054` (`harvest_word?`). Capture B2.

An account-only username `admin` makes every `access: "admin"` a finding. Account-only accounts are local administrators and service accounts, so names such as `admin`, `administrator`, `backup` or `guest` are likely. The same happens when authored text served to the browser (a note, a line of dialogue, a PC name) contains the name. The rule must not be loosened. Fix in two places:

1. Scanner: at construction, raise `ArgumentError` when an account-only display name or username equals (case-insensitive) another account's display name or username, or one of the answer vocabulary words the scanner already knows (`admin`, `user`, `password`, `credential`, `claim`, `technique`, `registry`, `capture`, `cracked`, `hash`, `ready`, `running`, `local`, `domain`). A scan that would be noise is refused, as S7 refuses a game without readers.
2. Validator (unit 18): the same check as an error, and a warning when any authored string elsewhere in the scenario contains an account-only username or display name word-bounded.

### R1-L10 (major): the username is matched case-sensitively, the server shows it normalised

`access_leak_scanner.rb:5054`. Capture A14b.

Log rows show `normalise_username(as.account)` (`ops_log.rb:478`): stripped and lower-cased. An account-only username authored `JBrooks` leaves in a log row as `jbrooks` and passes. Fix: match the username case-insensitively (`Regexp::IGNORECASE`) for the username only; keep the display name exact.

### R1-L11 (minor): an empty 200 collect needs no admin session

`access_leak_scanner.rb:4943`. Capture A1.

Brief 4.7: "a collect 200 is credited only when the capture shows an admin session at that PC before it; otherwise a leak". With no rows nothing is judged. Fix now: a 200 answer with no PC holding `admin:<pc>` or the relay mark is `harvest_unearned` (owner `answer`). Exact fix: see `pcId` under "Assumptions".

### R1-L12 (minor): list consistency and candidates that are not accounts

Captures A8, A9. The server builds `harvested` as a subset of `held`, one row per account, and skips a candidate that is not a room NPC with an account (`cached_credentials.rb:29`). Fix: `harvest_row` when a `harvested` row's `npcId` is not in `held`, or an `npcId` repeats in one list; build `@hv_candidates` only from NPCs in `@priv_npcs` that hold a username.

### R1-L13 (minor): account-only tiles and keys

Captures A12, A13. A tile is recognised only by `npcId` or `id`, and JSON keys are not read. Fix: in a tile list flag any tile with a string value equal to an account-only id; run `harvest_word?` over hash keys as well as values.

### R1-L14 (minor): a relay admin desktop answer is flagged when two PCs share a host label

Capture B5. `ops_session_owner` trusts the label first and the label is ambiguous, although the desktop route names the PC. With R1-L4's fix (the route's PC must be the PC), take the PC from the container id on a desktop answer and require the label, when unique, to agree. Still fail closed on a sign-in answer with an ambiguous label.

### R1-L15 (minor): known limits to record, not to fix

Captures B6, A20. A keyring row of a harvested hash is flagged when its collect is in an earlier capture file or its collect answer's body was lost. Both fail closed and match S7's stance on a cracked entry. Record them in the block comment so a tester knows the finding and does not look for a loosening.

### R1-L16 (minor): refusal to run

`access_leak_scanner.rb:4918`. Works for both readers. Two points: add `credential_proof_holds?` (R1-L5); and a game whose `player_state` has no `cachedAt` key (a game row from before unit 08) is silently "no borrow", which fails closed but looks like a leak to the tester: say so in the `harvest_unearned` rule text.

### R1-L17 (minor): the test says the recorder tags sign-in rows; it does not

`access_leak_scanner_harvest_test.rb:5`, `:52`. The recorder writes no `login` tag. With an untagged sign-in the admin step is earned only when one PC admits the account or a `--signin` entry names the PC (B7). Correct the comment, and add one test with an untagged sign-in for an admin admitted at two PCs: the collect is flagged without the entry and clean with it. Unit 23 must feed `--signin` entries for the real run, as S5a does.

## Assumptions the server units must meet

1. The collect 200 is exactly `{ success, harvested, held, keyringRev }`, rows exactly the six keys, `keyringRev` an Integer; refusals exactly as listed in R1-L6. Met by `761d2fb9d`.
2. **Recommended addition, non-secret: `pcId` on the collect 200** (the id the client sent, as `POST /lock_session` already answers). With it the scanner credits the collect at that one PC, not at "some PC that declares the account", and R1-L11 becomes exact. The answer keys become `success, pcId, harvested, held, keyringRev`; unit 12's test and brief 4.3 change with it.
3. **Needed only if R1-L7 cannot be met from today's answer: the accepted borrow "done" answer of `POST /npc_workaround` names the PC, key `pcId`** (non-secret: the player stood at that PC). The borrower is not needed when the PC is known and the scanner credits every borrow candidate of that PC whose workaround the answer is for; if the answer does not identify the borrower either, add `npcId` (the NPC the player just spoke to).
4. A relay session appears only in the relay sign-in answer and that PC's desktop answer, as `via: "credential"`, `kind: "assist_invite"`, `relay: true`, `host`, and never with `remote`, `footholdId`, `fromPcId` or `locked` (R1-L4).
5. A session answer for an account-only account carries `username` only after a typed sign-in or a keyring row for that account (R1-L2). Unit 20 must not add the username to any earlier answer (a tile, a room entry, `login_accounts`).
6. A refusal log row never has `method:` in its detail (unit 17), so the typed-row exemption holds.
7. No authored string served to the browser contains an account-only display name or username (R1-L9); units 18 and 24.
8. `admin_present_accounts` stays "owner, then the accounts cached now" (R1-L3). If it widens again, the scanner's `priv_admin_opens?` must follow in the same commit.
9. The keyring row id of a collected hash equals the row's `hashId`, and its account block is S7's shape.

Not checked in this round, for unit 23 on real answers: a relay admin's reach to an owner's profile, its `ADMIN_READ` row, and the storage stick override (`usb_install_overridden`) under the S5a rules. The scratch capture for a profile read did not match the scanner's real desktop shape, so no result is claimed either way.

## For the owner

One decision. Brief table 4.6 says an account-only account's username is earned only by a collect row or its hash row. The server shows the username in the session answer after a typed sign-in, and the player has just typed it. Choose one:

- (recommended) the typed sign-in earns the username (R1-L2), and the table gains that line; or
- the server leaves `username` out of every session, desktop and log answer for an account-only account until a collect, and the client shows the display name only.
