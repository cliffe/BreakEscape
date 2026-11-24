# S7 leak scanner review R2 (commit dd39ee7ca)

Reviewer: read-only. 2026-11-24. Counts: 0 blocker, 1 major, 7 minor.

## How it was run

Scratch tests outside the repo, run with `bin/rails test` under the lock, against
`scenarios/test_ops_crack/scenario.json.erb` and a game stub (`held`, `earned`, `crackedAccounts`, accounts held by
another route). "full" is a stub in which every hash proof holds, dana's three facts are earned and no password is held.
Each round 1 capture was rebuilt by hand, not taken from the fixer's test file. 85 captures in all.

Tests under the lock, one run: the nine scanner unit files, `ops_crack_scenario_test.rb` (the whole-run test),
`ops_crack_scanner_real_answers_test.rb`, `crack_verify_run_test.rb` and `validate_cracking_test.rb`:
330 runs, 2067 assertions, 0 failures, 0 errors.

A survey of every scenario under `scenarios/` (rendered): 78 hashes hold `difficulty` outside `credentials`, every one
with a string `lockType` and none of `kind`, `account`, `token`, `source`, `proof`, so the narrowed rule of R1-L11 flags
no shipped lock. Only `test_ops_crack` has hash records (5 accounts, one record each); no shipped mission has one yet.

`Game` answers all four methods the scanner asks for (`credential_proof_holds?`, `earned_fact_ids`, `crack_token`,
`password_held_for?`) as public methods, so none of the checks is skipped in the CLI today.

## 1. The round 1 findings

| Finding | State | How checked |
|---------|-------|-------------|
| R1-L1 strong account cracked | fixed | `cracked eli` then eli's entry, full game: `password`, `crack_unearned`. Also caught with no game |
| R1-L2 salted batch | fixed | dana naming farah, and farah naming dana, with a running answer first: both entries `crack_unearned`. The unsalted pair passes. A batch that names sparedesk while its record is not held is caught |
| R1-L3 recipe not checked | fixed | A9 (no facts), A10 (no partner), A11 (no running answer): each `crack_unearned`. An impossible cracked answer is still not a finding by itself (R2-L2) |
| R1-L4 loose routes and status | fixed, with a small rest | A3b to A3f all caught; a query string on the keyring path still passes (honest). `/evil/games/1/crack` passes (R2-L7) |
| R1-L5 non-200 answers | fixed | `{hit, match}` at 500 and `{error, hit}` at 422: `crack_answer`. A 200 body kept as `bodyText` is caught |
| R1-L6 hash row values | fixed | another account's block, three free strings, a recipe label, `salted: false`: each `crack_row` |
| R1-L7 token | fixed | the real-answers test's forged token mutation fails with the real game; shape only without `crack_token` |
| R1-L8 cracked entry block and label | fixed | changed username, label, a string `gainedAt`: each `crack_unearned` |
| R1-L9 wait map | fixed | a map on a full answer, and on an `unchanged` answer for an unheld record: `crack_row`. A map for a record that cannot run passes (R2-L4) |
| R1-L10 row says cracked | fixed | `cracked` on eli's row with nothing granted: `crack_row`. Other statuses are not tied (R2-L4) |
| R1-L11 difficulty and facts | fixed | the three captures: `crack_key`. No shipped lock is flagged (survey above) |
| R1-L12 answer ranges | fixed | `runs: 2` on nomatch, a 600 second wait, `missingCount: 4`: each `crack_answer` |
| R1-L13 validator warning | fixed as written, too narrow | see R2-L6 |
| R1-L14 real answers test | fixed | passes; 8 mutations, each a finding |
| R1-L15 verify-run | fixed | `verify-run.rb:233`, `:403`; `crack_verify_run_test.rb` passes |

No fix brought in a capture that passes and did not pass before, and no honest capture built here is wrongly flagged
(a salted pair in order, the unsalted batch, a reused crack whose partner is held by a capture, an account both cracked
and captured, the strong record's nomatch, infeasible and row, a keyring path with a query string).

The edits to `test/unit/access_leak_scanner_crack_test.rb` weaken no assertion. Six tests gained a running answer in
front of a salted grant: in four of them the assertion is that the entry is still unearned, so the extra credit makes
the test harder to pass, not easier. The stub that earned one fact now earns all three, which the new rule needs. The
rows now carry the real usernames, display names and labels, which the new rule needs. No assertion was removed or
turned from a finding into a pass.

## 2. New findings

### R2-L1 (major) No rule for a fact entry the player has not earned

`tools/playtest/lib/access_leak_scanner.rb:3663-3673` (the only `facts` rule: a `facts` key on a credential-shaped hash
or on the keyring and crack routes); `:1179` (the feed-fact rule covers feed posts only).

Server side, since round 1: `earned_facts.rb:49` takes every unearned item or flag fact out of the bootstrap, and its
entry is sent on the inventory answer (`games_controller.rb:1422`, `:1456`, key `facts`), on a `grant_fact` reward
(`:4226`, key `entry`) and on a `give_item` reward (`:4270`, key `facts`). So the label and text of such a fact are now
values the server withholds until earned. Round 1 recorded this for the owner as not yet landed. It has landed and the
scanner has no rule.

Captures, with a game that has earned no fact. Each gives 0 findings:

- `GET /games/1/scenario` 200 `{ social: { intelFacts: { dana_pet: { label, subject, source, text } } } }` (the bug the
  server fix closed, put back);
- `POST /games/1/inventory` 200 `{ success: true, facts: { dana_pet: { ... } } }`;
- a flag answer with `rewards: [{ type: "grant_fact", fact: "dana_pet", entry: { ... } }]`;
- a flag answer with `rewards: [{ type: "give_item", item: {}, success: true, facts: { dana_pet: { ... } } }]`;
- `GET /games/1/room/lobby` 200 `{ note: "Dana has a cat called Juniper." }` (the fact's text in any string);
- `POST /games/1/unlock` 200 with a fact entry under a new key.

The same answers with the fact earned pass, as they should.

Smallest fix that fails closed: a new rule (say `fact_unearned`), modelled on the feed-fact rule. Collect once the
award facts as the server does (`award_source_fact_ids`: every `revealsFacts` id and every `flagRewards` `grant_fact`
id, where `social.intelFacts` has an entry). Given a game, for each award fact not in `earned_fact_ids`: its `text`
anywhere in an answer (whole string, or inside a longer one from 20 characters, as `content_match?` does), and any hash
keyed by its id whose value is a hash with `label` or `text`, is a finding on every route. For an earned fact, the
entry may sit only in the bootstrap's `social.intelFacts`, in the top-level `facts` of an inventory answer, and in
`entry` or `facts` of a reward; anywhere else is a finding. Without a game the scanner cannot tell earned from
unearned: flag every award fact's entry outside those three places and say so in the header. Add the six captures as
tests and one mutation to the real-answers test (move an unearned fact's entry into the bootstrap).

### R2-L2 (minor, close now) A cracked answer the server could not have given is not a finding by itself

`access_leak_scanner.rb:3518-3524` (`note_crack_earned`), `:3702-3711` (`scan_crack_answer`, shape only).

Captures, full game, one row each, 0 findings: `cracked_answer('eli')` (strong); `cracked_answer('dana')` with no
running answer before it; `cracked_answer('nobody')` (no such account).

The grant check decides only whether later entries are earned. If the capture has no keyring answer after the bad
grant, the run passes, although the answer itself shows the server granted an account it must not grant. The password
may then be used without being shown (a cracked entry is accepted at a sign-in).

Smallest fix: in `scan_crack_answer`, a 200 body with `status: "cracked"` and an `accountId` for which
`crack_cracked_accounts` gave nil is `crack_unearned` at `$`. Keep the result of the one call in `note_crack_earned`
(calling `crack_grant` twice would use two credits).

### R2-L3 (minor) The other 200 answers are not tied to a record the player holds

`access_leak_scanner.rb:3614-3617`. Captures, 0 findings:

- a `running` answer in a game that holds only `deskadmin_hash` (unsalted): the server answers `running` only for a
  held salted record with a crackable class. The credit it gives is not usable there (dana's record is not held), but
  the wait bound is the scenario's largest, not the largest among held records;
- `needMoreFacts` in a game that holds no guessable record;
- `infeasible` with `runs: 2` in a game that holds only dana's record, and `infeasible` with no `nomatch` `runs: 1`
  answer before it. `runs` and `infeasible` are how the player learns that a record is strong; given on the first
  post they tell the class before it is earned.

Smallest fix, given a game: `running` needs a held salted record of class common, guessable or reused, and a wait no
longer than the largest `crack_seconds` among those; `needMoreFacts` needs a held guessable record and a
`missingCount` no larger than its fact list; a `runs` key needs a held strong record; `infeasible` needs an earlier 200
answer with `runs` in the scan. Anything else is `crack_answer`.

### R2-L4 (minor) A row's status, and the wait map, are not tied to the record

`access_leak_scanner.rb:3737-3746`, `:3794-3795`. Captures, full game, a keyring answer alone, no `crack_row`:

- eli's row with `status: "infeasible"` and no crack answer before it (tells the player the record is strong before
  the two runs that earn it);
- dana's row with `status: "infeasible"` (the server gives it only to a strong record);
- deskadmin's row (unsalted) with `status: "running", readyInSeconds: 5`;
- dana's row `running` with `readyInSeconds: 60` (its own wait is 10) and with no running answer in the capture;
- an `unchanged` answer with `readyInSeconds: { deskadmin_hash: 3 }`.

Smallest fix: `infeasible` only on a record whose class is strong and after a 200 `infeasible` answer in the scan;
`running`, and an id in the wait map, only for a salted record of a crackable class, with a wait no longer than that
record's own `crack_seconds`, and after a 200 `running` answer in the scan.

### R2-L5 (minor) A game that lacks a method turns the check off

`access_leak_scanner.rb:3570`, `:3580`, `:3594`, `:3694`, `:3752`. Each check starts with
`return true unless @game.respond_to?(...)`. Today `Game` has all of them. If one is renamed or made private, the CLI
keeps running and the proof, fact, token or held-partner check passes everything, with no message. This is the one
place where the scanner fails open.

Smallest fix: skip only when `@game.nil?`. When a game is given and does not answer one of the four methods, raise in
`initialize` (the CLI then stops; it must not print a clean result). The unit-test stubs gain the missing methods.

### R2-L6 (minor) The validator warning misses a shared password that is handed over by value

`scripts/validate_cracking.rb:339-364`. The fixer narrowed the warning to accounts whose records are all unsalted,
because only those are granted by the batch. That is right for the grant. It is not the whole of R1-L13: the scanner's
exemption is by value, and the cracked entry shows the password. With a salted record the player still reads the
password of the other account and can type it at that account's sign-in.

Input: two hash-record accounts with equal passwords, A `strong` (or `guessable`) and B `common`, either record salted.
No message. Cracking B shows A's password without A's recipe; the scanner lets the value through at B's entry.

Smallest fix: a second warning for every group of hash-record accounts with equal passwords, whatever the salt, in
which one member is strong or guessable and another is common, or one is strong and another guessable. A guessable or
strong account beside a reused one stays silent (the reused record needs its partner first; this is the scenario's own
dana and farah). The present warning also fires for a group of strong accounts only, where nothing can be cracked; it
is harmless there.

### R2-L7 (minor) The crack routes are matched at the end of the path only

`access_leak_scanner.rb:1018-1020`. `%r{/games/\d+/crack\z}` has no start anchor. Capture: a running answer, then the
cracked answer at `POST /evil/games/1/crack`, then dana's entry at `GET /x/games/1/keyring`: 0 findings, and
`game_mismatch_problem` accepts both paths. The project's recorder does not produce such a path, so this is tidiness.

Smallest fix: `\A/[^/]+/games/\d+/crack\z` and the same for the keyring (one mount segment), or the mount path if the
scanner is told it.

### R2-L8 (minor) Two test calls rely on a Ruby 2.7 allowance

`test/unit/access_leak_scanner_crack_review_test.rb:314`, `:345`. `keyring(rows, 'readyInSeconds' => {...})` passes a
bare hash to a method with keyword parameters. Ruby 2.7 warns and uses it as `extra`; a later Ruby raises. The tests
do test what they say today. Fix: put the hash in braces.

## 3. The fixer's choices that differ from the review

- The validator warning for unsalted groups only: correct for the batch, too narrow for the value (R2-L6).
- "Held by another route" (held in the game and not in `crackedAccounts`) for a cracked row and for a reused partner:
  a good choice, and stricter than the review asked. An account that is in `crackedAccounts` must have its cracked
  answer in the capture; an account held by a capture or a registry password entry needs none. It mirrors
  `password_held_for?` without letting the list the cracker itself writes stand as proof. The honest cases pass
  (partner held by a capture; account both cracked and captured). The one honest case it flags is a capture that
  misses the cracked answer, which cannot happen when every file is given. It reads the end of the run (limit 4).

## For the owner: the limits that remain

Each is judged for a playtest as the project runs them: a game is always given and every capture file is given,
oldest first. In all six a leak needs a server fault of the named kind; none lets a password through for an account
the game does not show as crackable and held.

1. A cracked answer is checked per account, not per record. Today no scenario gives an account two hash records, so
   the two are the same. What is lost is the link between a running answer and the record it was for. The recorder
   already tags inventory rows with the request (`inv`, read at `access_leak_scanner.rb:2524`); a `crack: { hashId }`
   tag on POST /crack rows would close this and limit 2. Not needed to land. Needed before the first shipped mission
   has hash records.
2. A running answer is one credit, and a post during a wait answers `running` again, so two clicks during dana's wait
   let a later grant of farah pass with no wait of its own (capture N4: running, running, cracked dana, cracked farah,
   both entries: 0 findings). A leak needs the server to grant a salted record without a stored run. Not needed to
   land; closes with the tag of limit 1.
3. The salted wait is not timed. A server that grants before the wait is over passes. The player gets the same
   password a little early. Can wait.
4. Proofs, facts and held partners are read from the end of the run. A fact earned late excuses an earlier
   `crackFacts` list or an earlier guessable grant; a partner captured late excuses an earlier reused grant. Checking
   after every beat narrows this and is advice only. Once R2-L1 is in, the inventory and reward answers give the
   scanner an order for item and flag facts, and it can use it. Can wait.
5. Without a game the proof, fact, token and held-partner checks are skipped. The CLI always has a game, so this
   touches unit tests only. The related fault that does matter is R2-L5.
6. An older rule calls `to_i` on the row's status and raises `NoMethodError` on `true` (capture: any row with
   `status: true`). `access-leak-check.rb:137` rescues `ArgumentError` only, so the CLI ends with a backtrace and a
   non-zero exit and prints no clean result. It fails closed. The recorder writes an integer. Can wait.

Before landing: R2-L1, and R2-L2 because it is one line. The other findings and the six limits can follow.
