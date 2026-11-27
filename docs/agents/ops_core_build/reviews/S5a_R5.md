# S5a review R5 (delta on the R4 fixes: commits 43f48c521, e232cc44f)

Reviewer: read-only. 2026-11-24. The final round for S5a. Count and verdict are at the end.

How the scanner was run: a `RAILS_ENV=test bin/rails runner` harness (no database query) that builds
`AccessLeakScanner.new(scenario)` from `scenarios/test_ops_privilege/scenario.json.erb` and scans the committed fixtures
`test/fixtures/files/ops_privilege_run72_{1..4}.jsonl`. "Row n" is line n of `ops_privilege_run72_1.jsonl`. "P98" is rows 1 to
98 (adel's keyboard sign-in #5 at row 97, the admin desktop of `bay_pc` at row 98), scanned with the four `--signin`
entries. Injected rows are copies of real rows with a later time: "desk" is row 98 again, "folder" is row 27 again
(`GET container/olu_folder`, the owner's `olu_budget`), "net" is row 137 again (`GET /network`, which lists `bay_pc` twice)
with its two `bay_pc` host rows changed as stated, "boot" is a synthetic `GET /scenario` with `sessions.bay_pc` as stated.
A replayed net row always adds three unrelated findings on its own line (`ops:technique`, `ops:service`, `ops:finding`,
from replaying a later network answer early, as R4 noted); they are left out below. The old scanner for comparisons is the
file at `0d8ddf0ff`.

## Check 6 first: the real captures - HOLD

`scan(run72, signins, logouts: ['adel@store_pc#5'])`: 0 findings, 0 unused. Sign-ins only: 38
(`ops_string` 20, `profile_admin_read` 18). Nothing named: 112. `--logout adel@bay_pc#5`: `ArgumentError` ("the next answer
that lists bay_pc's session still shows adel there").

Tests run under the lock: `test/unit/access_leak_scanner_ops_access_test.rb`,
`test/controllers/break_escape/access_leak_scanner_ops_access_real_test.rb`,
`test/unit/access_leak_scanner_ops_session_answers_test.rb`,
`test/controllers/break_escape/access_leak_scanner_privilege_real_test.rb`,
`test/controllers/break_escape/privilege_profile_read_test.rb`: 111 runs, 1503 assertions, 0 failures.
`bin/ops-golden-compare` (not under flock): 16 runs, 32 assertions, 0 failures.

## Check 1: each R4 finding

| R4 finding | State | Run |
|---|---|---|
| R4-1 (major) | closed | Rows 1 to 71, a gap row at +5 s (403 `off`, or a bootstrap with adel `via: credential` and no access), row 71 again at +308 s named by `--resume`: 5 and 4 findings on that row, entry unused. Control at +20 s: 0 findings, entry used. |
| R4-2 | partly closed, see R5-2 | P98, boot `{npcId: adel, via: claim}`, desk with `via: claim` (or `credential` + `relay: true`) and `access: admin`, named: 4 findings, entry unused. The resume ROW's kind is checked and `access: admin` on claim or relay is a finding. What is not done: a session SHOWN as another kind in between does not drop the record (R5-2). |
| R4-3 (major) | closed for the report and the step; the fix adds a credit, see R5-3 | P98, net with `bay_pc` username `umaquay` (still admin), folder: `ops:key:access` on the net row and `profile_admin_read item:olu_budget` on the folder row. |
| R4-4 | closed, with one new hole, see R5-1 | P98, net in the real off shape (no `session`, `responding: false`, `heldAs: "Adel Wick"`, listed twice), once or three polls in a row, desk named, folder: 0 findings after the net rows, entry used. `heldAs: "Uma Quayle"` or no `heldAs`: 6 findings, entry unused. Two boots without access: resumed. |
| R4-5 | closed | Rows 1 to 141 with `--logout adel@store_pc#5`, then net with `store_pc` still showing `adelwick` / technique: `ArgumentError`. The real row 142: accepted. `adel@bay_pc#5` followed by a desk row: `ArgumentError`; followed only by folder and log rows: the name stands and the folder row is REPORTED (the bay PC is ended), so a wrong name here is loud, not silent. |
| R4-6 | closed by reading (`access_leak_scanner.rb:2592-2596`) and the unit test; no real grant row at a PC with a record exists to run. | |
| R4-7 | closed | P98, uma's keyboard sign-in (row 16 again) named `uma@store_pc@<t>`, then her desktop of `bay_pc` (row 17 again): `ArgumentError` ("the desktop that followed it is bay_pc"). Named at `bay_pc`: accepted and the folder row is reported. With no desktop row after it the name stands (0 findings on a folder and a log row): the documented remainder, see "for the owner". |
| R4-8 | closed, one case left, see R5-4 | check 5 below |
| R4-9 | closed | `lib/break_escape/ops_log_events.rb:124-125` now states the rule of `service_named`. |
| R4-10 | closed | `access-leak-check.rb:22` and PLAYTEST say "after the game id and before the files"; PLAYTEST beat 8 describes the real off shape. One sentence of it is now wrong for one path (R5-1). |

## Check 3: `--resume` on the real off shape and "repeated downgrade answers keep the record"

Runs, P98 + the rows named + desk at +9 s named by `--resume adel@bay_pc@<t>` + folder. "Refused" = the desk and folder rows
are reported (5 or 6 findings on them) and the entry is unused.

Refused, as they must be (the record does not survive a real end between two off answers):
- off net, net showing `umaquay` at `bay_pc` without access, off net;
- off net, net with `locked: true`, off net;
- off net, boot with `bay_pc` absent, off net;
- off net, boot with `npcId: uma`, off net;
- off net, a 200 desk without access, off net;
- off net, `POST /lock_session` for `bay_pc`, off net;
- off net, an unnamed `POST /logout`, off net;
- off net, an answer with `endedPcIds: ["bay_pc"]`, off net;
- off net, an unnamed keyboard sign-in of uma, off net.
So while the scanner still holds the account at the PC, the keep rule is sound: every end drops the record before the
repeat can keep it.

### R5-1 (major) after a 403 `off`, a row that shows ANOTHER account at the PC now keeps the resume record (a loosening against the scanner before this commit)

`tools/playtest/lib/access_leak_scanner.rb:3084-3093` (`downgrade_priv_step`, `keep: true` by default), reached from
`:3139-3140` (host row) and `:3221-3223` (bootstrap).

A 403 `off` or `not_responding` desktop answer ends the session in the scanner but keeps the record
(`:2996-3000`, `end_priv_session(keep_resumable: true)`), so `@ops_session_accounts[pc]` is then nil. Both "another account"
tests need a held account: the host row's `elsif held && ... session['username'] != username` (`:3134`) and the
bootstrap's `elsif @ops_session_accounts[pc] && held['npcId'] ...` (`:3218`). With nothing held, a row that shows another
account without `access: admin` falls through to `downgrade_priv_step(pc)`, which now keeps any record that is there
(`elsif !(keep && @priv_resumable[pc])`). Before this commit the same rows deleted it (the old
`downgrade_priv_step(pc, username:)` compared the username; with no step held it deleted).

Runs:
- P98, 403 `off` for `container/bay_pc`, net with the two `bay_pc` rows showing `username: umaquay` and no `access`, desk
  named, folder: NEW 0 findings on the desk and folder rows, entry used. OLD scanner: 6 findings there, entry unused.
- P98, 403 `off`, boot `sessions.bay_pc = { npcId: uma, via: password }`, desk named, folder: NEW 0 findings, entry used.
  OLD: 6 findings, entry unused.
- Controls (new scanner): 403 then a net row with no session (not the off shape): refused. 403 then boot with `bay_pc`
  absent: refused. 403 alone: resumed (right).

This is the case check 3 asks about: one answer that showed another account's session at the PC used to close the resume;
it no longer does. Another account's session at the PC means adel's session was replaced (a real end), so an admin desktop
of adel after it, with no sign-in row, is a row the server should not send, and a tester who names "the desktop after the
power came back" in good faith passes it. PLAYTEST beat 8 and the handover both say "another account's row" drops the
record; on this path it does not.

Fix: make the keep depend on who is shown, not only on a record being there. Pass the shown account to
`downgrade_priv_step` (the host row's `username`, resolved as at `:3136`, or the bootstrap's `npcId`) and keep an existing
record only when it equals `@priv_resumable[pc][:account]`; otherwise delete it. Equivalently, in both callers, before the
`access != 'admin'` branch: if nothing is held and a record exists whose account is not the one shown, delete the record.
Add the two runs above as tests beside "a network row of another account without access does not leave a step to resume".

### R5-2 (minor) R4-2 is half closed: a session shown as another kind WITHOUT admin does not drop the record

`access_leak_scanner.rb:3073-3077`, `:3139-3142`, `:3221-3225`. `check_priv_kind` (the "lost for good" rule) runs only in the
`else` branch, that is only when the answer shows `access: admin`. A claim or relay session is never shown as admin by a
correct server (`app/models/break_escape/game.rb:3307`), so the real shape of "the session became a claim or a relay" is a
session of the same account with another `via` and NO access; that takes the `access != 'admin'` branch, which is the
ordinary downgrade and remembers the step for a resume.

Runs:
- P98, boot `{ npcId: adel, via: claim }`, desk (password, admin) named, folder: 0 findings, entry used.
- P98, boot `{ npcId: adel, via: credential, relay: true }`, desk named, folder: 0 findings, entry used.
- P98, a desk row with `via: claim` and no access, desk (password, admin) named, folder: the claim desk row is reported
  (the owner's items shown without admin), but the resume is accepted and the later desk and folder rows are clear.
- The old scanner gives the same 0 findings on the first run: not a regression, but not what the outcome table
  ("a claim or relay session loses the step") and the handover ("a session shown as another kind loses the step for
  good") say.

A password session that is later shown as a claim or relay session of the same account was replaced (R4 check 3, rule 3),
and a desktop row after it that shows password and admin again with no sign-in row is not earned.

Fix: in the three `access != 'admin'` branches, compare the kind first: if `@priv_kinds[pc]` (or, when the step is already
suspended, `@priv_resumable[pc][:kind]`) is set and `priv_kind_of(session)` differs, call `lose_priv_step(pc)` and do not
remember. An off PC's bootstrap entry keeps its `via`, so the power-cut case is not affected. Extend the test "a session
that became a claim or relay kind loses the admin step" with a resume after it (must be refused, entry unused).

### Smaller notes on check 3 (no finding)

- A 403 `off` followed by the real off-shape host row (`heldAs: "Adel Wick"`) is NOT resumable (the 403 dropped the
  account, so the row is not recognised as the held account's and the record is deleted): 6 findings, entry unused. Fail
  closed and the same before this commit. A real client sends no desktop request while the PC is off, so the mixed case is
  rare; see "for the owner".
- A PC whose policy blocks remote sign-in gets no `heldAs` when it is off (`network_access.rb:1094`, `:1113`: `held` is
  built only when `remote || open_here`), so its off row ends the session and nothing can be resumed. Fail closed.
- A token session past its expiry gets no `heldAs` either (`:1095`), so an expired token cannot be read as a power cut.
  The deadline check in `apply_priv_resume` (`:3103-3104`) covers the rest.

## Check 2: the host row "takes the account over by username"

### R5-3 (major) the take-over credits the shown account's own files; it is not only a take-away

`access_leak_scanner.rb:3134-3138`. When the row shows another username the rule ends the session (right) and then sets
`@ops_session_accounts[pc]` to the one NPC that has that username. That map is not only bookkeeping for ends: it is what
earns an account's OWN profile items (`priv_profile_read_earned?`, `:3260-3262`: any held account the profile admits), it
is what lets a `--logout` entry narrow a sign-out to one PC (`:2924`), and it is what stops the sign-in cross-check from
refuting a wrong name (`:3195`). It never gives `admin:<pc>` (only a sign-in, a grant or a resume do; checked by reading
and by the run below, where `ops:key:access` is still reported).

Runs (the run has never signed in as olu; `omarsh` is the owner's username):
- P98, net with the `bay_pc` rows changed to `username: omarsh` and no `access`, folder: 0 findings on the folder row
  (`olu_budget` is credited to "olu at bay_pc").
- Controls: the same with `username: zzz` (no NPC): `profile_admin_read item:olu_budget` on the folder row. The same with no
  session: reported.
- P98, net with `username: omarsh` and `access: admin`, folder: `ops:key:access` on the net row (right) and the folder row
  is clear (credited).

So a server fault that shows the wrong account's session at a PC and then serves that account's files is passed by the
network view alone, with no sign-in row and no `--signin` entry; the unknown-username control shows the credit is the
only thing that clears it. The desktop rule (`:3067-3069`) and the bootstrap rule (`:3218-3220`) have done the same since
R3 (run: P98, a desk row showing `npcId: olu`, folder: the folder row is clear), and R4-3's suggested fix asked for this
line, so this is the R4 suggestion followed, not a slip of the fixer; but it does not meet "only ever take away or
report". Rated major because it is new in this commit, is on the answer the client polls most often, and the fix is one
line.

Fix: in `note_priv_host_rows` end the session and do not set the account (delete `:3137-3138`). The real captures do not
need it (every session in them comes from a sign-in row or a grant row; the fixture test is the proof to re-run: 0 / 38 /
112). If the orchestrator wants the same strictness everywhere, drop the assignment at `:3069` and `:3220` too and
re-run the fixtures and `access_leak_scanner_privilege_real_test.rb`; if a real hand-back needs the change of hands, keep
those two and say so in the handover's limits.

### `access: admin` with `via: claim` or `relay: true` is a finding - RIGHT

`access_leak_scanner.rb:2722-2723` against `app/models/break_escape/game.rb:3300-3319`: `session_access` returns `'user'`
for `relay_session?(session) || session['via'] == 'claim'` before any admin test, and `client_access_level`
(`game.rb:4797-4799`) is that method, which is what the host row (`network_access.rb:1105`), the desktop answer and the
bootstrap read. A host row never lists a claim or relay session at all (`network_access.rb:1093-1094`), and the client
answer of a relay carries the key `relay: true` (`game.rb:4781`), which is the key the rule reads. The rule is an extra
`add.call`, so it can only report. Run: check 1, R4-2.

## Check 4: `test/unit/access_leak_scanner_ops_access_test.rb`

A correction of the fixture, not a broken run shape.
- The server's host row carries `npc['creds']['username']` (`network_access.rb:1097`). In the test's scenario
  (`test/support/network_model_scenario.rb:119`, `:125`) sam's username is `sokafor` and ian's is `ishaw`; the fixture had
  `sam`, the NPC id, which no real answer holds. With the new username rule a row that says `sam` is another account's, so
  the old fixture would have lost the step: the fixture was wrong, the rule is right.
- N-13-2 (`:337`): the FS02 row is given `ishaw`, the account its own grant puts there. Right for the same reason.
- `:65` (`session_hash`, `username: sam`) and `:484` (`'username' => 'sam'`) still hold the NPC id as a username. They pass
  because neither reaches the host-row username rule with an admin step held. Cosmetic; change them to `sokafor` when the
  file is next touched, so the file has one spelling.
- Real captures: `access_leak_scanner_ops_access_real_test.rb` and `access_leak_scanner_ops_session_answers_test.rb`
  (the committed real answers of `test_ops_access`) pass unchanged with the new rule (in the 111 runs above).

The three tests that named a wrong PC and now expect the error: right. Each names a keyboard sign-in at a PC, and the next
desktop answer of that account is another PC where the run holds no session of it; exit 2 with the message is stricter
than a finding count (a wrong entry is the tester's error, and the CLI turns `ArgumentError` into exit 2,
`access-leak-check.rb:131-135`). Each test keeps the other half (no desktop row after it: the name stands).

## Check 5: engine R4-8 (`profile_shown_name`)

Read: `lib/break_escape/ops_log_events.rb:264-292`, `app/models/break_escape/ops_log.rb:516-535`,
`app/models/break_escape/game.rb:4055-4074` (`login_account_tiles`), `app/controllers/break_escape/games_controller.rb:1598-1640`,
`app/models/break_escape/network_access.rb:985-1000`.

- Unset really is the list-everyone default: `picker = pc.key?('loginPicker') ? pc['loginPicker'] : 'accounts'`
  (`game.rb:4059`), the same expression as the gate (`ops_log_events.rb:290`); the client reads it the same way
  (`unlock-system.js:811`). `false` gives no tiles (`game.rb:4060`); `"known"` filters by `encounteredNPCs` (`:4064`). The
  gate gives the kind word for both, which is stricter than the tiles for `"known"` once the owner is met (safe side).
- A tile is shown for an account the PC admits (`game.rb:4064`, `pc_admits_account?`); the gate uses
  `CredentialModel.pc_admits_account?` (`credential_model.rb:196-201`), the same rule (nil list admits everyone).
- No path shows the id: `profile_shown_name` returns nil (no such profile: the cell is `-`), the display name, or the id;
  the caller turns the id into the kind word (`ops_log.rb:526`, `name == value.to_s ? rule[:id] : name`). A display name
  equal to the id also reads as the kind word.
- A row that names no PC, or a `where` that is not a sign-in PC, gives the kind word (`:288`).
- Only the detail cell changed. `profile_named` is still the existence check for the `profile` kind (`:137`). The ceiling
  and secret-guard walks are not in the diff. A scenario without `logSources` has no rows to word;
  `bin/ops-golden-compare` passes (16 runs, 0 failures).
- Test: `privilege_profile_read_test.rb` "R4-8" passes (accounts: `profile: Jake Brooks`; `known` and `false`: `profile`).

### R5-4 (minor) a headless PC, or a PC reached only through a "typed" remote screen, still gets the owner's name

`lib/break_escape/ops_log_events.rb:288-291`. The gate reads `loginPicker` and the access list only. Two more things decide
whether the game shows the tile:
- `headless: true`: a headless host has no screen and no tiles at the keyboard (`games_controller.rb:1637-1638`) or over
  the network (`network_access.rb:983`, `:989`). Its `loginPicker` is normally unset, so the gate shows the name. Headless
  sign-in hosts exist in shipped scenarios (`demo_access_tour`, `lab_physical_pentest` `store_controller`); none of them
  has an admin read today as far as this review looked, so this is an authoring case, not a live one.
- `policies.<name>.remoteScreen: "typed"` (`network_access.rb:933-936`, `:989`): the remote screen shows no tiles. If the PC's
  room is still locked the player has never been shown the tile, but can hold an admin session there over the network and
  get the ADMIN_READ row.
A display name is not a secret (R4-8 was minor for the same reason).
Fix: add `!BreakEscape::NetworkModel.headless?(pc)` to the condition at `:291` and one test case; state the
remote-screen case in A18 (or gate on it too: the name only when the keyboard screen is reachable or the remote screen
is "tiles").

## Check 7: what should stop S5a landing

Nothing in the engine. In the scanner, R5-1 and R5-3: each makes the leak check accept something it should report, and
each is a change of a few lines with its run above as the test. R5-2 is the same size and belongs to the same edit.
R5-4 can go with them or be recorded.

This is the fifth and last review round for S5a (brief: at most 5 per stage). The fixes are small enough for the
orchestrator to verify by the runs above instead of a sixth round: after the fix, the runs under R5-1 must give findings
and an unused entry, the runs under R5-3 must report the folder row, the runs under R5-2 must refuse the resume, and
check 6 must still give 0 / 38 / 112.

## Each R4 finding: closed or not

R4-1 closed. R4-2 partly (R5-2). R4-3 closed, its fix adds R5-3. R4-4 closed, its fix adds R5-1. R4-5 closed. R4-6 closed
(by reading and unit test). R4-7 closed. R4-8 closed (R5-4 is a further case). R4-9 closed. R4-10 closed.

## Count

- Blockers: 0
- Majors: 2 (R5-1, R5-3)
- Minors: 2 (R5-2, R5-4)

## Verdict

Fix first (scanner only: R5-1, R5-3, with R5-2 in the same edit), then land without another review round, on the runs
listed under check 7. The engine commit `43f48c521` can land as it is.

## For the owner: limits of the leak check that remain by design

1. A named entry is the tester's word until an answer contradicts it. `--signin` at a wrong PC that also admits the
   account stands when no desktop answer of that account follows the sign-in, or when the desktop that follows is a PC
   where the run already holds that account; folder and log answers name no PC and are judged by the named PC until then.
   Only keyboard password sign-ins are cross-checked (a keyboard sign-in by token is not). Only one named sign-in is
   pending at a time.
2. `--logout` at a wrong PC stands when no later answer lists that PC's session. The PC really signed out of then keeps its
   step in the scanner until a desktop answer, host row or bootstrap shows it without a session.
3. `--resume` cannot prove a power cut from a bootstrap alone: a session listed without `access` is taken as suspended. The
   proof is by exclusion (same account, same kind, inside the token deadline, no end seen in between), so an end that no
   answer shows (an NPC hand-back that names no PC, a route change) is not seen.
4. A power cut or a token lapse is invisible when no network view, desktop answer or bootstrap comes before the leaking
   request (the token case is covered by the deadline, read from `expiresInS`).
5. Fail-closed cases that cannot be cleared by any entry, so a clean run is not possible if they happen: a 403 `off`
   followed by the off PC's host row; an off PC whose policy blocks remote sign-in (no `heldAs`); two admin accounts
   reading one profile at one PC (one earned read); a second admin session still held elsewhere after an unnamed logout.
6. The scanner does not judge whether a display name or a service label in a log cell has been earned (it allows every
   authored name); R4-8 and R5-4 are engine rules with engine tests only.
7. A desktop answer or a bootstrap that shows another account at a PC changes the held account to it (see R5-3 for the
   host row): the account's own files are then credited without a sign-in row. Kept only if a real hand-back needs it.
8. Two accounts with the same display name cannot be told apart by `heldAs`.

## Checks not completed

- `access-leak-check.rb` was not run against a database game (the scanner library was run directly over the fixtures).
- R4-6 was not run on a real grant row (none exists at a PC with a record).
- The A18 sentence added for R4-8 was not compared word for word with the code.
- No node test was run: the two commits change no JavaScript.

## Outcomes (fixer, Ops S5a fix)

| Finding | Outcome | Test |
|---|---|---|
| R5-1 (major) | fixed: `downgrade_priv_step(shown:)` keeps a resume record only when the row shows the held (or recorded) account; another account's host row or bootstrap drops it, also after a 403 `off`. All check 3 refusals still refuse. | `access_leak_scanner_privilege_real_test.rb` "R5-1" (two tests) |
| R5-2 (minor) | fixed: a downgrade answer of another kind (claim, relay) loses the step; handover sentence corrected. | "R5-2" |
| R5-3 (major) | fixed for the host row, and made end-only in the desktop and bootstrap rules too: the committed real-run tests and the four captures give the same results (0 / 38 / 112), so no row depends on the assignment. | "R5-3" (two tests), "R5 check 6" |
| R5-4 (minor, engine) | fixed: `profile_shown_name` gives the kind word for a headless PC and a `remoteScreen: typed` policy; A18 sentence added. | `privilege_profile_read_test.rb` "R5-4" |
