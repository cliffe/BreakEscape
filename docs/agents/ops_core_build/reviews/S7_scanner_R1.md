# S7 leak scanner review R1 (commit abaa7578f, unit 14)

Reviewer: read-only. 2026-11-24. Counts: 0 blocker, 2 major, 13 minor.

## How it was run

Scratch tests outside the repo, run with `bin/rails test` under the lock. They build
`AccessLeakScanner.new(scenario, game: stub)` from `scenarios/test_ops_crack/scenario.json.erb`, with the helpers of
`test/unit/access_leak_scanner_crack_test.rb` (`cracked_answer`, `keyring`, `entry`, `hash_row`). "full" is a game stub
in which every hash proof holds and no fact is earned. In that scenario dana (guessable, three facts) and farah (reused)
share a password and both records are salted; deskadmin and sparedesk share another (common, unsalted); eli is strong.

Real answers: a subclass of `OpsCrackScenarioTest` that records every request and answer and scans them with the real
game at teardown. The whole run (52 answers, 9 POST /crack answers, all eight answer shapes the test reaches) gives
0 findings. Note that the worktree held uncommitted server changes at the time (the R1-S1 fact entries on inventory and
flag answers); the run includes them and they raise nothing.

Tests under the lock: the three files of the unit (36 runs, 0 failures) and the seven older scanner unit files (237
runs, 1136 assertions, 0 failures). The diff adds two test files and changes no existing test. The only edit to an
existing rule is one added `next` in `scan_passwords` (`access_leak_scanner.rb:1056`); nothing was loosened there
beyond the allowance itself.

A survey of every scenario under `scenarios/` (rendered): 78 hashes hold `difficulty` beside a lock, and every one has
both `lockType` (a string) and `locked`; the only other holders are the three `credentials.*.crack` blocks. No hash
holds `difficulty` and `kind` together. `facts` sits only on `social.landingPages[].pretext`, one
`minigameData.config` and one `crack` block, never on a hash with `kind`, `account` or `proof`.

## 1. The allowance: captures tried

| # | Capture | Result |
|---|---------|--------|
| A1 | keyring with dana's entry, then the cracked answer (wrong order) | caught (`password`, `crack_unearned`) |
| A2 | cracked answer at `/break_escape/games/2/crack`, keyring of game 1 | passes the scanner; the CLI stops it (exit 2, `game_mismatch_problem`) |
| A3a | cracked answer with verb GET | caught |
| A3b | cracked answer at `POST /evil/crack` | **passes**, and the CLI does not stop it (R1-L4) |
| A3c | cracked answer at `POST /break_escape/games/1/x/crack` | **passes** (R1-L4) |
| A3d | earned entry in `GET /evil/keyring` | **passes** (R1-L4) |
| A3e | earned entry in a keyring answer with status 500 | **passes** (R1-L4) |
| A3f | cracked answer with `status: "200abc"` | **passes** (R1-L4) |
| A3g | cracked answer with status 201 | caught (`crack_answer`, then unearned) |
| A4 | cracked answer with an extra key | caught |
| A5 | answer names dana, entry is farah's (equal password) | caught |
| A6 | `cracked_answer('eli')`, then eli's entry; full game | **passes** (R1-L1) |
| A7 | `cracked_answer('dana', %w[dana.cracked farah.cracked])`, then both entries; full game | **passes** (R1-L2) |
| A8 | deskadmin answer naming sparedesk, `sparedesk_hash` not held | caught |
| A9 | `cracked_answer('dana')` with no fact earned in the game | **passes** (R1-L3) |
| A10 | `cracked_answer('farah')` with no equal-password account held | **passes** (R1-L3) |
| A11 | `cracked_answer('dana')` (salted) with no running answer before it | **passes** (R1-L3) |
| A12 | earned dana entry with `account.username` changed | **passes** (R1-L8) |
| A13, A14 | earned entry whose `label` or `displayName` holds eli's password | caught (`password`) |
| A15 | earned entry, password with a leading space | caught |
| A16 | the same scanner object scanned twice: crack in scan 1, entry in scan 2 | caught (state does not carry) |
| A17 | entry in an earlier file, crack in a later one | caught |

The password path itself is sound: the value passes only at `$.entries[i].password` of an entry the full check
accepts, equal to that account's own password, and every other string in the entry is still scanned.

## 2. Findings

### R1-L1 (major) A strong account is accepted as cracked

`tools/playtest/lib/access_leak_scanner.rb:3495` (`crack_cracked_accounts`), `:3510` (`crack_hash_record_held?`).

Capture, with every proof held: `POST /crack` 200 `{ success: true, status: "cracked", accountId: "eli",
credentialIds: ["eli.cracked"] }`, then `GET /keyring` with `entry('eli', 'ebrandt', <eli's password>)`. 0 findings.

The server cannot give this answer. A strong record goes to `crack_strong_run!` (`ops_cracking.rb:202`) and answers
only `nomatch` or `infeasible`; an account already held answers `cracked` with no `accountId`. The scanner asks only
that the account has a password and a held hash record, so the one outcome the mechanic promises never happens is the
one it lets through.

Smallest fix: in `crack_cracked_accounts`, the named account (`accountId`) must have a held hash record whose class,
worked out as `crack_class` does (`crack.password`, else `habits.password`, with a grade that resolves), is `common`,
`guessable` or `reused`. No such record: return nil. Add the fixture.

### R1-L2 (major) A batch answer is accepted for salted records

`access_leak_scanner.rb:3495-3507`.

Capture, full game: `cracked_answer('dana', %w[dana.cracked farah.cracked])`, then a keyring with dana's and farah's
entries. 0 findings. Same with farah named first.

The server batches only on an unsalted direct hit, and only to other held records that are unsalted
(`ops_cracking.rb:243`); a salted hit grants its own record alone (`batch: false`). dana's and farah's records are
both salted, so farah's entry here was never granted. The header says the batch mirrors the server ("another account
with an equal password and a hash record of its own"); the server's rule is narrower. The unit test's batch case uses
the unsalted pair only, so nothing shows the gap.

Smallest fix: when `credentialIds` names more than one account, require that the named account has a held record that
`CrackDifficulty.resolve` gives `salted: false` (and the class of R1-L1), and that every other account has a held
record that resolves `salted: false`. Otherwise nil. Fixtures: the salted pair fails, the unsalted pair passes.

### R1-L3 (minor) The cracked answer is not checked against the recipe the game can already see

`access_leak_scanner.rb:3495`. Captures A9, A10, A11 pass.

- A9: dana is guessable with three facts; the game stub has earned none. The server would answer `needMoreFacts` or
  `fact_not_held`. Fix: given a game with `earned_fact_ids`, a named account whose only crackable held records are
  guessable needs one whose `crack.facts` are all in the earned set.
- A11: dana's record is salted, and a salted hit is granted only by a post after a stored run, so a 200 `running`
  answer must come first. Fix: a named account whose crackable held records are all salted needs an earlier well
  formed `running` answer in the scan; each cracked answer of that kind uses one up.
- A10 (reused, no equal password held) needs `password_held_for?` on the end state; record it for the owner unless
  the builder finds it cheap.

All three fail closed. The first two should be closed now.

### R1-L4 (minor) Routes and status are matched loosely

`access_leak_scanner.rb:1014-1015`, `:3487`, `:1049`.

`path.end_with?('/crack')` and `row['status'].to_i == 200` accept `POST /evil/crack`, `POST
/break_escape/games/1/x/crack` and `status: "200abc"` as the earning answer (A3b, A3c, A3f).
`game_mismatch_problem` (`:313`) skips a path with no `/games/<n>/`, so the CLI does not stop A3b. The keyring side
has the same looseness and no status test at all (A3d, A3e).

Smallest fix, for the two crack uses only (the older rules keep their own matching): `crack:` is `POST` and
`%r{/games/\d+/crack\z}`; `note_crack_earned` wants `row['status'] == 200`; `crack_password_paths` and
`scan_crack_entries` accept a keyring answer only at `%r{/games/\d+/keyring\z}` with status 200.

### R1-L5 (minor) A non-200 crack answer with other keys is not judged

`access_leak_scanner.rb:3617`.

Captures: `POST /crack` 500 `{ hit: true, match: "dana" }` and 422 `{ error: "x", hit: true }`: 0 findings. The
header says every POST /crack answer has exactly the keys of its status or refusal. The early return skips any hash
body that has neither `success` nor `reason`.

Smallest fix: judge every hash body. Besides the four refusals allow only exact shapes listed by name (for example
the one-key `{ error: <string> }` the app's own handlers give, if any reach this route); everything else is
`crack_answer`. A non-JSON body (`bodyText`) on a non-200 stays out of the rule.

### R1-L6 (minor) A hash row's values are not tied to the record

`access_leak_scanner.rb:3638` (`crack_row_ok?`). Each of these passes:

- `hash_row('dana_hash', 'eli')`: the row of a held record carries another account's block (its username and name).
- `extra: { 'gainedAt' => 'hit', 'forThisPc' => 'match', 'accepted' => 'recipe: common' }`: three free strings.
- `extra: { 'label' => 'guessable: dana_pet dana_town dana_year' }`: the label is free text.
- `salted: false` on dana's salted record.

Smallest fix: `account.npcId` equals the registry entry's `account`, `username` equals that NPC's `creds.username`;
`gainedAt` is an Integer, `forThisPc` and `accepted` are booleans; `label` equals the entry's `label` (or the proof
item's name, or `''`, as `credential_label` gives); `salted` equals `CrackDifficulty.resolve`.

### R1-L7 (minor) The token is checked for shape only, with the game at hand

`access_leak_scanner.rb:3641`. `'token' => 'AAAA-AAAA-AAAA-AAAA-AAAA-AAAA'` passes with a game given. The row's token
is 120 bits the scanner cannot read. `Game#crack_token(id, entry, npc)` is public and pure.

Smallest fix: when `@game.respond_to?(:crack_token)`, the row's token must equal it; without a game keep the shape
check. This closes the builder's "shape only" limit.

### R1-L8 (minor) The cracked entry's account block and label are free

`access_leak_scanner.rb:3559` (`crack_entry_account`). A12 passes: an earned dana entry with `username:
"someone_else"`. `gainedAt`, `forThisPc`, `accepted` and `label` are unchecked here too.

Smallest fix: `account` equals `{ npcId, username: creds.username, displayName: displayName || id }` from the
scenario, `label == 'Cracked'`, and the three optional keys typed as in R1-L6.

### R1-L9 (minor) The wait map is accepted where the server never sends it

`access_leak_scanner.rb:3651` (`scan_crack_waits`).

Captures: a full keyring answer (with `entries`) that also has `readyInSeconds: { eli_hash: 5 }`; an `unchanged`
answer with `readyInSeconds: { eli_hash: 3 }` in a game where no hash proof holds. Both 0 findings. The second tells
the player that an unheld record exists and that a run is stored for it.

Smallest fix: allow the map only when `body['unchanged'] == true` and there is no `entries` key; given a game, every
id must be in `credential_proof_held_ids`.

### R1-L10 (minor) A row may say `cracked` for an account nothing has granted

`access_leak_scanner.rb:3640`. `hash_row('eli_hash', 'eli', status: 'cracked')` passes at any point of a run. During a
salted wait this is the hit marker by another road: the POST answer says `running` and the row says `cracked`.

Smallest fix: status `cracked` on a row needs the account in `@crack_earned`, or, given a game, an account the game
holds by another route (`password_held_for?` on the end state). Without either it is `crack_row`.

### R1-L11 (minor) `difficulty` and `facts` can be narrower

`access_leak_scanner.rb:3462`, `:3587`, `:3590`. These pass:

- a keyring entry `{ kind: "password", source: "capture", locked: false, difficulty: "hard", ... }`;
- a room answer's NPC record `{ id: "dana", dustable: false, difficulty: "hard" }`;
- a keyring answer with `recipe: { facts: [...], class: "guessable" }` (not credential-shaped, so `facts` passes).

By the survey above, every shipped lock that holds `difficulty` has a string `lockType`. Smallest fix: allow
`difficulty` only when `hash['lockType']` is a String, the hash has no `kind`, `account`, `token`, `source` or
`proof`, and the route is not keyring or crack; `requires`, `keyPins`, `dustable` and `locked` alone no longer
excuse it. Flag any `facts` key on a keyring or crack answer. Run the older scanner tests and the committed real
captures after the change; if a shipped answer drops `lockType` after an unlock, name that shape, do not widen back.

`crackFacts` is as tight as the server's rule allows, apart from the end-of-run earned set (for the owner).

### R1-L12 (minor) Answer ranges wider than the route

`access_leak_scanner.rb:3532-3535`. `nomatch` with `runs: 2` passes (the server says `infeasible` at 2, so only 1 is
real). `running` with `readyInSeconds: 600` passes in a scenario whose longest wait is 120; `missingCount: 4` passes
where the longest recipe has 3 facts.

Smallest fix: `runs == 1` on nomatch; bound the wait by the largest `crack_seconds` the scenario's records resolve
to, and `missingCount` by its longest `crack.facts`.

### R1-L13 (minor) The validator says nothing when hash-record accounts share a password by mistake

`scripts/validate_cracking.rb:316-323`. The only equal-password messages are for a `reused` record with no partner
and for a capture overlap. Two accounts with hash records and equal passwords, one of them `strong` or `guessable`,
pass with no message. The server's batch (`ops_cracking.rb:234-247`) does not look at the other record's class, so an
unsalted strong record with a password equal to a common one is granted by the batch, and the scanner's
equal-password rule exempts it. An author who copies an NPC and forgets the password widens the exemption silently.

Smallest fix: a validator warning for each group of hash-record accounts with equal passwords in which any member's
class is `strong` or `guessable` (the batch would hand it over without its own recipe). Whether the batch should skip
such records is a server question for the owner.

### R1-L14 (minor) No test feeds real answers to the scanner

`test/unit/access_leak_scanner_crack_test.rb:83`. The "clean captured run" is hand-built, and the last stage's
findings came from shapes the hand-built rows did not have. The harness used here (record each answer of the whole-run
test, scan with the real game) took 20 lines and passes today.

Smallest fix: add that as a test beside `ops_crack_scenario_test.rb`, asserting 0 findings, plus one mutated row per
rule taken from the real capture.

### R1-L15 (minor) verify-run

`tools/playtest/verify-run.rb:399`: the full report prints the access section only when one of `ACCESS_KEYS` is not
empty, so a game that holds a hash record and has no other access state prints "nothing recorded" and no crack line
(`--access` always prints it). Fix: also print when `crack_items` is not nil.

`verify-run.rb:245`: the habits lines print `password=<class>`, `passwordPattern=` and `passwordDifficulty=` for each
NPC. The new crack line's comment says "never a recipe"; since S7 the class and grade are the recipe. Fix: leave
those three keys out of the habits line, or say in the header that the habits section is not for a blind tester.

## 3. Honest answers wrongly flagged

None found in the real run. Two can happen and are recorded below: a record whose proof stops holding after the crack
(the earned check reads the end state, so the entry becomes `crack_unearned`), and a capture that starts after the
crack answer. Both fail closed. The answer bounds match the validator (`crackSeconds` 10 to 600, 1 to 4 facts).

## 4. The builder's "not covered" list

- `difficulty` on anything with a lock field: close now (R1-L11).
- Token checked for shape only: close now (R1-L7).
- Earned-fact check uses end-of-run state: acceptable limit; the CLI already tells the tester to run after every beat.
- Accounts with equal passwords share one value exemption: acceptable (the value is the same string), once R1-L2
  and R1-L13 are closed so that the entry itself is always the server's grant.
- Time not checked against the salted wait: close the order part now (R1-L3, a running answer first); the clock part
  can wait.

## For the owner: limits that remain

1. The capture does not record the request, so the scanner cannot tie a cracked answer to one hash record; it checks
   per account. Tagging the row with `hash_id` (as `/feed_post` rows carry `npcId`) would allow an exact check.
2. Row times are not compared with the salted wait. The scanner already reads row times for sign-in deadlines, so a
   check with a tolerance for network delay is possible.
3. Proofs and earned facts are read from the end of the run. A proof lost after a crack flags an honest entry; a fact
   earned late excuses an earlier `crackFacts` list.
4. A reused crack is not checked against another held account with an equal password (R1-L3, A10).
5. Without a game (unit tests only; the CLI always has one) proofs, facts and the token are not checked.
6. The uncommitted R1-S1 server change withholds unearned intel fact entries from the bootstrap and sends them on the
   answer that earns them. The scanner has no rule for an unearned fact's label or text; it needs one when that lands.
7. `crackedAccounts` is cut to 64 with `first` (`ops_cracking.rb:252`), so a 65th account is answered `cracked` and
   then never listed. Server side, not a leak.
8. The older `end_with?` route matching and `to_i` status tests elsewhere in the scanner are unchanged (R1-L4 covers
   the crack rules only).
