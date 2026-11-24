# S5a review R4 (delta): R3 fixes, the game-72 leak diagnosis, the log detail names

Reviewer: read-only. Commits: `b141a288d`, `5c33a8617`, `14602c73e`, `fc0b6f66e`, `766b3994f`, `7ef3ce71a` on `ops-build`.
Findings are appended per check below; the count and verdict are at the end.

How the scanner was run: a `bin/rails runner` harness (test env, no database query) that builds `AccessLeakScanner.new(scenario)` from `scenarios/test_ops_privilege/scenario.json.erb` and scans the committed fixtures `test/fixtures/files/ops_privilege_run72_{1..4}.jsonl`, with synthetic rows added where a check says "injected". Row numbers below are line numbers of `ops_privilege_run72_1.jsonl` unless a file is named (F2, F3, F4).

## Check 1: the diagnosis (38 findings, one cause) - CONFIRMED, no real leak

Reproduced: 0 findings with the four `--signin` and `--logout adel@store_pc#5`; 38 with the sign-ins only (20 `ops_string ops:key:access`, 18 `profile_admin_read`); 112 with nothing named (64 `profile_admin_read`, 47 `ops_string`, 1 `log_row`).

The rows:
- Row 97 (00:38:50.295) `POST /login` adel, `via: password`, `access: admin`, no `host` label: the keyboard sign-in adel#5. Rows 98, 106, 109 `GET container/bay_pc` show session adel / password / admin.
- Row 133 `POST /login` uma, `host: RECS01`, remote. Row 137 `GET /network`: `bay_pc` session adelwick / password / admin / remote false; `store_pc` session umaquay / password / remote.
- Row 138 `POST network/technique` `grant: session`, session adel / technique / admin / `host: RECS01`. Row 139 `GET container/store_pc` shows it.
- Row 141 (00:41:12.954) `POST /logout` answers `{"success":true,"endedPcIds":[]}`: no PC.
- Row 142 (00:41:12.994, 40 ms later) `GET /network`: `store_pc` has NO session; `bay_pc` unchanged (adelwick / password / admin / remote false). So the capture itself shows the logout was the store PC's. Rows 143, 159, 165 the same.
- F2:1, F3:1, F4:1 `GET /scenario` `sessions` = `bay_pc` only, adel / password / admin. F2:10, F3:10, F4:10, F4:12 `GET container/bay_pc` the same session; F4:11 `POST unlock` and F4:13 `GET container/olu_folder` hold `olu_budget`.

All 38 sampled against the rows (every one, not six): 13 are the `access` key of the `bay_pc` host row in rows 142, 143, 148, 149, 152, 153, 154, 159, 161, 162, 163, 164, 165; 3 are the bootstrap `sessions.bay_pc.access` (F2:1, F3:1, F4:1); 4 x 5 are the four `container/bay_pc` rows (the `access` key and the four items `adel_runbook`, `olu_notes`, `olu_folder`, `olu_budget`); 2 are `olu_budget` in F4:11 and F4:13. Every one is an answer about the `bay_pc` session of adel earned at row 97; none is about `store_pc` or another account. No sign-in, lock, `endedPcIds` entry, 403 or downgrade for `bay_pc` lies between row 97 and the end of F4. On a strict reading none of the 38 is a leak: the server is right to show a password session of an account with `creds.admin` at a PC that admits it as admin, and the owner's items to it.

The 112: the extra 74 are rows 17 to 109 (the keyboard sign-ins unnamed, so nothing earned at `bay_pc`: uma's own item at row 17, adel's access and the owner's items from row 22, the ADMIN_READ row 33) and the host rows 102 to 137. All follow from the four keyboard sign-ins earning nothing (fail closed, as designed). None is a leak.

One thing the diagnosis says that the capture does not prove: that the PC was powered off between rows 106 and 109. No row shows it (rows 107, 108 are `PUT sync_state`). It does not matter for the 38.

## Check 2: `--logout`

Holds as described: one PC, only when `@ops_session_accounts[pc] == account` at that row (`access_leak_scanner.rb:2906-2917`); unused is exit 2 (`access-leak-check.rb:134-138`); unnamed ends every PC. Strict parsing reproduced by the test file (55 runs of the two files, 0 failures, run under the lock). The rules of `note_privilege_before` (desktop, host row, bootstrap without admin) run on every row whatever the entry says, so a later answer for the real PC that shows no admin still takes the step back.

### R4-5 (minor) a named logout is not checked against what the next answers show
`tools/playtest/lib/access_leak_scanner.rb:2906-2917`. When the account is held at two PCs (run 72 at row 141: adel at `bay_pc` by password and at `store_pc` by the technique), either name is accepted. Runs:
- `--logout adel@bay_pc#5` on the fixtures: accepted, 0 unused; it is loud here only because bay's host rows still show admin (38 findings).
- Injected after row 141 with `--logout adel@store_pc#5`: a `GET /network` row whose `store_pc` host row still shows `session: { username: adelwick, via: technique }` (no access key): 0 findings, 0 unused. The scanner ended `store_pc` on the tester's word and then accepted an answer that shows the session still there.
So a wrong name is silent when the session at the named PC is at user level, and the real PC keeps its step until a desktop, host row or bootstrap shows it without admin; if the server wrongly went on showing admin there, it passes.
The capture has the row that settles it: the next `GET /network` host row, desktop answer or bootstrap for the named PC. Fix: after a named logout remember (pc, account); if a later answer shows a session of that account at that PC before any sign-in or grant at it, raise (exit 2, "the logout named at <pc> did not end its session"); optionally require that the first later host row of the named PC shows no session. In run 72, row 142 would confirm `store_pc` and refute `bay_pc`.

## Check 3: `--resume` as widened

What the server really sends (read at `app/models/break_escape/game.rb:3300-3319`, `network_access.rb:1087-1118`, `game.rb:3964-3977`): the level of a password or credential session is worked out on every read from the account and the PC (static scenario data); it is nil (no `access` key) only when the token has expired, the session is locked, the PC is off (`host_service_off?`) or the route is down. There is no step-down of the same session record. For each:
- token expired: the session is not shown at all (bootstrap and host row drop it, desktop is 403 `expired`), so it never looks like "shown without admin";
- locked: bootstrap and host row carry `locked: true`;
- PC off: the bootstrap shows the session with no `access`; the HOST ROW shows no `session` at all (`responding: false`, `heldAs: <display name>`, `network_access.rb:1110-1114`); the desktop is 403 `off`;
- route down: a remote session shown without `access`; admin comes back by itself when the route does.
A session of the same account can also be replaced by a different KIND of session that is never admin (`via: claim`, `relay: true`, a technique session at user level).

So "shown without admin, same account" is not by itself proof of a power cut, and the rule as built does not ask for more than the account id. Three ways a tester who honestly names "the desktop row after the power came back" passes a row the server should not have sent:

### R4-1 (major) a resume restores the step on a row past the token's deadline
`tools/playtest/lib/access_leak_scanner.rb:3047-3060` (`apply_priv_resume`) and `:3036-3045`, `:3006-3009`. `downgrade_priv_step` and the 403 path delete `@priv_deadlines[pc]` and save the deadline in the resumable record; `note_priv_deadlines` (`:2997-3002`) therefore no longer fires for that PC, and `apply_priv_resume` restores the step without comparing the row's time to `saved[:deadline]`. The deadline is put back and ends the step only from the NEXT row.
Run (rows 1 to 71 of file 1: adel#3 is the remote token sign-in at row 70, `expiresInS: 208`, desktop at row 71), then one synthetic row at +5 s (either a 403 `off` for `container/bay_pc`, or a bootstrap with `sessions.bay_pc = { npcId: adel, via: credential }`), then row 71 again at +308 s (100 s past the deadline) with `access: admin`:
- no resume: 5 (403 case) or 4 findings on that row;
- `--resume adel@bay_pc@<that time>`: 0 findings, 0 unused, in both cases;
- control, the same late row with no gap row and no resume: 5 findings (the deadline rule alone catches it).
So the resume turns a row the deadline rule reports into a clean one. This is exactly the case asked about: the token lapsed while the PC was off, the server (if faulty) serves the admin desktop, the tester names the row in good faith.
Fix: in `apply_priv_resume`, return (entry stays unused) when `saved[:deadline]` is set and the row's time is unreadable or later than it. Add the test (both gap rows).

### R4-2 (minor) the resume row and every desktop or bootstrap answer accept `access: admin` on a session kind that can never be admin
`access_leak_scanner.rb:3014-3031`, `:3047-3060`, `:3088-3101`. Rows 1 to 98, a bootstrap `sessions.bay_pc = { npcId: adel, via: claim }`, then row 98 again with `session.via: "claim"` (or `via: credential, relay: true`) and `access: admin`, named by `--resume`: 0 findings, 0 unused. Control without the bootstrap and without a resume: also 0 findings, so this is a gap of the base rule, which the resume inherits: only `npcId` and `access` are compared, never `via` / `relay`. The server never gives a claim or relay session admin (`game.rb:3307`).
Fix: (a) a session shown with `access: admin` and `via: claim` or `relay: true` is a finding wherever it appears (structural, like `ops:key:admin`); (b) keep the earning answer's kind (`via`, relay, remote) with the step, and in `apply_priv_resume` require the resume row's session to be of that kind.

### R4-6 (minor) a technique grant does not drop the resumable record or the token deadline
`access_leak_scanner.rb:2581-2591` (`note_ops_session_grant`) sets the account and the admin step for the PC but leaves `@priv_resumable[pc]` and `@priv_deadlines[pc]`. Read from the code, not run (the shipped scenario's only grant is at `store_pc`): downgrade at a PC, then a user-level technique grant for the same account there (a new session, a real end), then a desktop row named by `--resume` would restore the earlier admin step. A stale deadline after an admin grant ends that step early (a false alarm, the safe side). Fix: delete both in `note_ops_session_grant`, as `note_privilege_signin` does (`:2939-2941`).

### R4-4 (minor, the safe side) the host-row path of the widened resume cannot work on a real answer, and the test fixture is not what the server sends
- A real `GET /network` answer lists each PC more than once (rows 137 and 142: `bay_pc` twice, `store_pc` twice). `note_priv_host_rows` (`:3064-3075`) calls `downgrade_priv_step` per occurrence; the second finds the step already gone and deletes the record (`:3040-3041`). Run: rows 1 to 98, row 142 with `access` removed from both `bay_pc` rows, then row 98 again named by `--resume`: 5 findings and the entry unused.
- For a PC that is off the server sends no `session` in the host row (above), so the scanner ends the session outright (`:3069-3070`); run with `responding: false, heldAs: "Adel Wick"`: 5 findings, entry unused.
- Two downgrade answers in a row (two bootstraps without access) also delete the record: 4 findings, entry unused.
The test's `off_host` (`access_leak_scanner_privilege_real_test.rb:638-642`) has one host row with a `session` and no `access`, a shape the server does not send for an off PC, so the passing test proves nothing about a real capture; `PLAYTEST.md:175` and `HANDOVER_S5a_16.md` ("a host row of that username") promise a resume that cannot happen. A tester whose network view polls while the PC is off gets findings that no entry can clear (fail closed, but the run cannot come out clean).
Fix, together with the rule below: treat the real off shape as the proof of a power cut (`responding: false` with `heldAs` equal to the held account's display name: keep the record), make repeated identical downgrade answers idempotent (keep the record while account and kind are unchanged), and build the test rows from a real host row.

### The smallest sound rule (answer to check 3)
Nothing in the answers marks "admin withdrawn for good" versus "PC off" on the row itself for a bootstrap; but every real withdrawal other than power or route is excluded by data already in the capture. A resume is sound when ALL hold:
1. the row's time is not past the saved token deadline (R4-1);
2. the resume row's session is the same account AND the same kind as the one that earned the step (`via` password or credential, not relay, not claim; or the same technique session) (R4-2);
3. nothing ended or replaced the session in between: sign-in, lock (`locked: true` on a host row or bootstrap too), logout, `endedPcIds`, a grant (R4-6), another account's row;
4. the row itself shows `access: admin` (already required).
With 1 to 3 added, the only causes left for "same record shown without admin, then with admin" are the two legitimate ones (power off then on, route down then up), so no power-state proof is needed. If a positive proof is wanted as well, the capture has it for two of the three views: a 403 `off` / `not_responding` desktop answer, or a host row with `responding: false` and `heldAs`. As built, rule 4 and "same account" are the only ones enforced, so the answer to "can a tester resume across a real withdrawal" is yes in the three cases above (R4-1 run, R4-2 run, R4-6 read).

## Check 4: R3-C1's remaining limit, the deadline rule, "an answer without admin takes the step back"

"The next desktop answer" is not enough on a strict reading. Run: rows 1 to 98 (adel admin at `bay_pc`), a keyboard sign-in of uma (really at `bay_pc`) named `--signin uma@store_pc#2`, then, with no desktop row in between, row 27 again (`GET container/olu_folder`, the owner's `olu_budget`) and row 33 again (`GET /log_rows` with the ADMIN_READ row): 0 findings, 0 unused. A folder answer and a log answer name no PC, so they are judged by the step the misnamed sign-in left at `bay_pc`. In a real capture the client asks for the desktop straight after a sign-in (rows 16/17, 22/23, 49/50, 97/98, each under 1 s), and that row closes it.

### R4-7 (minor) a named keyboard sign-in is not checked against the desktop answer that follows it
`access_leak_scanner.rb:2827-2837`. The capture has the row that shows where a keyboard sign-in was: the first later 200 `GET container/<pc>` whose `session.npcId` is that account with `via: password` and no `remote`. Fix: if that row is for a sign-in PC other than the named one, and no entry or label puts the account at that PC, raise (exit 2, "sign-in named at <pc> but the desktop that followed is <other>"). That removes the R3-C1 limit instead of documenting it, and it is the same kind of cross-check as R4-5.

### R4-3 (major) a host row that shows ANOTHER account as admin keeps the step
`access_leak_scanner.rb:3064-3075`. `note_priv_host_rows` acts only when the host row has no session or no `access: admin`; it never compares the row's `username` with the account the run holds there. The desktop and bootstrap rules do (`:3023-3025`, `:3093-3095`). Runs, rows 1 to 98 then one injected row:
- row 137 with the `bay_pc` host row's session changed to `username: umaquay` (still `access: admin`): no `ops:key:access` finding (the only findings on the row are three unrelated ones from replaying a later network answer early);
- the same after a keyboard sign-in of uma named at `store_pc`: the same, no access finding;
- controls: the desktop row with `npcId: uma` and `access: admin` gives 5 findings; a bootstrap with `sessions.bay_pc.npcId: uma, access: admin` gives 1.
So in the network view a server that shows an ordinary account as administrator at a PC where only the administrator earned the step is not reported, and the step is wrongly KEPT (the question asked). The same branch, when the other username is shown without access, drops the step but leaves the old held account (`:3037-3044`).
Fix: in `note_priv_host_rows`, when the row's `session.username` is not the username of the held account, call `end_priv_session([pc])` (and take the new account if exactly one NPC has that username) before the answer is judged; add the test beside "a desktop answer or a host row that shows no admin session".

Token deadline (`:2950-2953`, `:2997-3002`): right and tested (held at +30 s, reported at +90 s of 60 s). It is set only for `kind: token` with a positive number; a later sign-in at the PC clears it. It cannot keep a step by itself; the one way it is bypassed is R4-1. "An answer without admin takes the step back": right and tested for the desktop, a single host row and the bootstrap; the limits are R4-3 (other account with admin) and R4-2 (kind).

## Check 5: the fixture test

Reproduced by running the scanner (numbers in check 1) and by `flock ... bin/rails test test/controllers/break_escape/access_leak_scanner_privilege_real_test.rb test/controllers/break_escape/privilege_profile_read_test.rb`: 55 runs, 883 assertions, 0 failures. Entry parsing is strict for all three options (`:2846-2897`, `check_priv_entry_names`); `ArgumentError` and unused entries are exit 2 (`access-leak-check.rb:128-138`). Options are taken from anywhere on the command line (`access-leak-check.rb:68-78`), so both placements in the docs work. No finding.

## Check 6: engine, `7ef3ce71a`

Code: `app/models/break_escape/ops_log.rb:524-526`, `lib/break_escape/ops_log_events.rb:226-243` (`service_named`), `:257-271` (`profile_named`).

Unloosened: the change is in the reader's text builder and two name lookups only. Nothing is stored differently, the ceiling and secret-guard walks are untouched, and a scenario without `logSources` has no rows to word, so its answers are unchanged (by reading; `bin/ops-golden-compare` not run by this review). For a scenario WITH logs three cells change wording: `service: service` becomes `service` or `service: <label>`; `profile: profile` becomes `profile` or `profile: <display name>`; an unnamed technique's `technique: technique` becomes `technique`. Only events with a `{ id: }` rule can hit the new `shown == key` branch (no code list of `EVENTS` contains its own key; checked by script).

Service label: earned. `service_checked` is written only by a successful `POST /network/check` on a discovered host (`network_ops.rb:153-167`), and the label shown is the label of that host's own service whenever a label is shown at all: if another host declares the same name with a different label or none, the kind word shows (`:240-242`), so a label from an unswept network can never appear in place of the checked host's. The label is part of the service row the scan answer already sends (`SERVICE_KEYS`, `network_ops.rb:30`, `:712-718`). Not checked here: whether a forged check on a swept but unscanned host is refused; if it is not, the label would show in the log before the scan showed it (the check's own answer already reveals more).

### R4-8 (minor) the profile cell can show a display name the game has so far withheld
`lib/break_escape/ops_log_events.rb:257-271`. The row exists only because the player, as an admin session, read a folder of that profile at a PC whose owner the profile admits, so the name is always the owner of files the player has just opened; and any log terminal whose source covers that PC shows the row, with or without a session there (as for every row). But the game has a way to withhold account names: `loginPicker: "known"` shows a tile only for an NPC already met, and `loginPicker: false` shows none (`app/models/break_escape/game.rb:4058-4065`). The desktop and folder answers do not name the owner (row 98: no `Olu Marsh`, no `omarsh`; only the authored item names). So with an admin session got by a technique or a token at a PC with `loginPicker: "known"` or `false` whose owner the player has not met, the ADMIN_READ cell `profile: <owner display name>` is the first place that name is shown. In `test_ops_privilege` it is earned: `GET login_accounts` for `bay_pc` lists Olu Marsh (row 14) before any sign-in. A display name is not a secret (other cells already show NPC display names through the `npc` kind), hence minor.
Fix (either): show the name only when the account's tile would be shown at that row's PC now (`login_account_tiles` of the `where` PC includes it), else the kind word; or state in plan 13.5 and A18 that a profile cell names its owner regardless of `loginPicker`, so authors know.

### R4-9 (minor) stale comment
`lib/break_escape/ops_log_events.rb:124-125` still says of the `service` kind "Never its label: a name is unique only on its host", which the lookup below now contradicts. Reword to the rule of `:226-229`.

Does the leak scanner judge these cells? Only for raw ids, secrets and stored-only keys (`access_leak_scanner.rb:3212-3250`): every authored `name`, `displayName`, `door_sign` and `username` of the scenario is allowed wholesale, and ADMIN_READ rows are counted against earned reads (`:3153-3166`). It has no notion of a display name or a label being earned, so it would NOT catch R4-8 or a service label shown early. It would catch the profile id or a secret in the cell.

## Check 7: PLAYTEST and `fc0b6f66e`

- The listing snippet (`PLAYTEST.md:50-66`) run over the four fixtures prints the eight sign-ins and five logouts exactly as the diagnosis lists them; the keyboard ones are uma#1, adel#1, adel#2, adel#5, and logout #5 is 00:41:12.954. The example command's entries are the ones that give 0 findings.
- `fc0b6f66e`: two regular expressions gain `, level none` per session line and nothing else; `bin/test-js test/js/playtest-verify-run-access.test.mjs` passes (1 file).
- The `access-leak-check.rb` command itself was not run against a database game (the scanner was run directly); its option parsing was read.

### R4-10 (minor) wording
- `tools/playtest/access-leak-check.rb:19` says "Put the options before the game id"; `PLAYTEST.md` (the paragraph above the example) says "after the game id and before the files" and its example does that. Both work; say one thing.
- `PLAYTEST.md:175` offers `--resume` after "a `GET /network` host row ... that lists Adel's session at `bay_pc` with no `access` (an off PC leaves it out)". An off PC's host row has no session at all, and a host-row downgrade cannot be resumed on a real answer (R4-4). Correct it when R4-4 is fixed.

## R3 findings: closed or not

| R3 finding | State |
|---|---|
| R3-C1 (major) | closed for a PC that does not admit the account (refused, exit 2). The documented remainder (named at another admitting PC) is real before the next desktop row (check 4 run) and can be removed: R4-7. One of the three "who holds it" rules is incomplete: R4-3 |
| R3-C3 (major) | closed (bootstrap entry without admin takes the step; tested) |
| R3-B1 (major) | closed as `--resume`; the widened form has R4-1 (major), R4-2, R4-4, R4-6 |
| R3 check 2 rules (deadline; host row, desktop, bootstrap) | done and tested; limits R4-1, R4-3 |
| R3-C2, R3-C4, R3-B2 | closed |
| R3-D1 | closed by `14602c73e` (one paragraph of A18; not compared line by line with the code after `766b3994f`) |
| R3-A1 | out of scope, unchanged |
| R3-B3 | closed by the four game-72 fixtures |

## Count

- Blockers: 0
- Majors: 2 (R4-1, R4-3)
- Minors: 8 (R4-2, R4-4, R4-5, R4-6, R4-7, R4-8, R4-9, R4-10)

## Not done, and limits

- `bin/ops-golden-compare` not run; "a scenario without `logSources` is unchanged" is from reading the diff.
- `test/controllers/break_escape/network_findings_test.rb` and `ops_privilege_scenario_test.rb` (the other two tests of `7ef3ce71a`) were read, not run.
- `access-leak-check.rb` was not run against a database game; the scanner library was run directly over the fixtures.
- R4-6 is from the code, not a run. The forged-check case under check 6 was not followed into the controller.
- `14602c73e` (A18 paragraph) and the played run's `RESULTS.md` were not read line by line.

## Verdict

Fix first (small, scanner and tests only), then land. The diagnosis is right and the engine change is sound; nothing here is in the engine's answers. Before the scanner is relied on for the train:
- R4-1: one comparison in `apply_priv_resume` plus a test.
- R4-3: the username comparison in `note_priv_host_rows` plus a test.
R4-2, R4-6 (and the idempotence part of R4-4) are a few lines in the same functions and make `--resume` sound by the rule under check 3; R4-5 and R4-7 are the two cross-checks that stop a wrong name being taken on trust. R4-8 needs an orchestrator ruling (gate the name, or document it).

## Outcomes (fix pass, "Ops S5a fix:")

| Finding | Outcome |
|---|---|
| R4-1 (major) | Fixed: `apply_priv_resume` refuses a row past the saved deadline; test `R4-1` (403 gap and bootstrap gap, plus an in-time control) fails on the old scanner. |
| R4-2 | Fixed: kind kept with the step and the record; a resume of another kind refused; a claim or relay session loses the step; `access: admin` on claim or relay is a finding. Tests `R4-2` (two). |
| R4-3 (major) | Fixed: host rows judged by username; another account ends the step. Test `R4-3`. |
| R4-4 | Rule made to work on the real shape (`responding: false` + `heldAs`, listed twice; repeated downgrade answers keep the record); test uses that shape; PLAYTEST corrected. |
| R4-5 | Fixed: a named logout refuted by the next listing of that PC is exit 2; no listing, the name stands. Tests (synthetic, and the real run with `adel@bay_pc#5`). |
| R4-6 | Fixed: a grant drops the record and the deadline. Unit test calls `note_ops_session_grant` directly (no shipped scenario grants at a PC with a record). |
| R4-7 | Fixed: the desktop after a named sign-in refutes a wrong PC (exit 2); three existing tests that named a wrong PC now expect the error. |
| R4-8 | Gated: `profile_shown_name`; test for picker `known` and `false` beside the `accounts` case. A18 sentence added. |
| R4-9 | Comment reworded. |
| R4-10 | One placement ("after the game id and before the files") in the script and PLAYTEST; line 175 rewritten. |

Real captures: 0 findings with the five named entries, 38 with sign-ins only, 112 unnamed (unchanged).
