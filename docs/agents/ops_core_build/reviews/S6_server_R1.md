# S6 review, round 1: server, catalog, validators, scenario, tools and docs

Scope: `git diff 1d12d119c..HEAD` without `public/break_escape/` and `test/js/` (another reviewer has
those). Review only; nothing was fixed. Probes were run from a scratch folder against copies; the tree
was not changed. Two untracked paths were already in the tree before this review and are not mine:
`node_modules` (a symlink) and `scenarios/test_phone_calls/ink/caller_voicemail.json.tmp-1235923-1d8f30a2`.

Counts: 1 blocker, 5 major, 14 minor.

What holds, in short:

- No file under `app/`, `lib/` or `config/routes.rb` changed. No other scenario, no campaign mission and
  nothing under `.claude/skills/` changed.
- The three catalog entries are invented (product "FileHold", advisory year 0000). Read against the
  output scope: each `output` holds a state line and a disclosure date and nothing else. None holds a
  step, a request form or a trigger.
- A search of every file in the diff (client source and JS fixtures included) for advisory shapes,
  framework path shapes, the 17 nicknames, the 33 listed product names and common real products found
  only made-up values, with the one exception in R1-S1. Module paths all use invented product words.
  The tool names `nmap` and `msfconsole` appear in the client and its tests, as the plan allows.
- Serving, read in `app/models/break_escape/network_ops.rb`: a finding row is built by one builder
  (`:293-307`) for a weakness and a decoy alike, with the same keys in the same order before a confirm;
  `cli` is added at the same place for both; rows are ordered by finding id and aliases are numbered in
  that order (`lib/break_escape/network_model.rb:431-436`), so neither position nor alias marks the
  decoy. `falseBecause` is added only at status false (`:303-304`). `realism` is never copied: the row
  names its keys one by one. An unlinked entry is never read. The address is served only once the
  network lists its hosts (`:705-710`); the range rides on the block from the first view (`:725`), as
  the brief says.
- The catalog is not reachable over HTTP. No route names it; `config/` is outside `public/`; the static
  controller joins the path lexically and refuses anything outside `public/break_escape`
  (`app/controllers/break_escape/static_files_controller.rb:34-38`), so `..` in an asset path answers 404.
  Room answers withhold `services` whole (`app/models/break_escape/network_access.rb:21`).
- `bin/test-js test/js/ops-unchanged-validator.test.mjs`: passed. `bin/ops-golden-compare` and the Rails
  tests of this stage: see "Test runs" at the end.
- `scripts/real_vuln_nicknames.txt` should stay. See R1-S15 for the reasoning and three small points.

---

## Blocker

### R1-S1 (blocker): a real advisory id in a test fixture

- File: `test/fixtures/realism_catalog/catalog_faults/pass_ordinary/a.json:20`.
- What is wrong: the entry's `advisories` holds a vendor bulletin id of the form `MSyy-nnn` with the
  year `00` and the number `001`. That year and number were assigned, so this is a real advisory id. The
  stage rule allows a real advisory id only in `config/break_escape/realism_catalog/*.json`, and says
  this stage ships none. Every other made-up id in the diff uses an impossible year (`0000`, `9999`) or
  an impossible number (`ms99-999`); this one does not. The second id on line 21 (`ZDI-00-0001`) is fine:
  that scheme has no year 00.
- How to see it: `grep -n 'MS00' test/fixtures/realism_catalog/catalog_faults/pass_ordinary/a.json`.
  `test/unit/realism_separation_test.rb` does not catch it because it scans only ops scenario folders and
  the index.
- Smallest fix: change the id to one with a year the scheme never used, as the plan's own example does
  (year 31), and add `test/fixtures/realism_catalog` to the folders the separation test scans, with an
  allowance for year `0000`, `9999` and that year.
- Lesser point, same family: `test/unit/validate_realism_skin_test.rb` uses `kb1234567` three times. I
  cannot show that seven-digit article number was never issued. `kb9999999`, which the same file already
  uses, is safer.

---

## Major

### R1-S2 (major): the append-only check can be passed by deleting or hand-editing the index, and an id can be reused

- File: `scripts/validate_realism_catalog.rb:252-261` (reading the index), `:345-352` (the comparison),
  `:354-356` (the rewrite).
- What is wrong, three ways:
  1. **Index file missing.** `realism_read_index` returns `{}` when the file does not exist, so nothing
     is compared, the run is clean and a fresh index is written without the removed id.
  2. **A row that does not match `INDEX_ROW`** is skipped without a word. Edit one cell of a row by hand,
     remove the id from the catalog, and the run is clean and writes an index without it. A rename
     passes the same way when the row is edited to the new name.
  3. **Reuse.** The index holds only the form. Replace an entry's title, module, script, advisories and
     output with wholly different text of the same counts and the run is clean: the id now means
     something else and every scenario that links it shows the new text.
- How to see it (all in a scratch copy, `--dir` and `--index` pointing at it): remove
  `filehold_link_setting` from the copy: error `index_id_missing`, as intended. Delete the copied index
  and run again: "Realism catalog is clean; index written", and the new index has two rows. Change one
  row's form cell to `advisories one` and remove that id: clean. Replace every string of
  `filehold_update_lag`, keeping one advisory and two output lines: clean.
- Why it matters: the brief's rule is "never removed or renamed". As built, the rule holds only while
  nobody touches the index, and the index is the thing a hurried fixer is most likely to regenerate.
  The unit test "the committed index equals what the validator would write" passes in all three cases.
- Smallest fix: (a) when the catalog folder has entries and the index file is missing, report an error
  and write nothing, unless a new flag `--first-index` is given; (b) report an error for any table row
  after the header that does not match `INDEX_ROW`; (c) a test that reads the index at the merge base
  (`git show <base>:docs/REALISM_CATALOG_INDEX.md`, skipped when git is absent) and asserts every id and
  form there is still present. For reuse, see the owner question at the end.

### R1-S3 (major): the real-identifier rule does not read much of an ops scenario's text, and misses a module path that is not a clean lower-case token

- File: `scripts/validate_realism_skin.rb:174-222` (`realism_skin_texts`), `:109-124`
  (`realism_skin_real_ids`); the same tokeniser is used by `test/unit/realism_separation_test.rb:25-27`.
- What is wrong:
  1. The texts read are the brief, `endGoal`, network and host names, service label, product and
     version, resource `name`/`host`/`observations`, finding `summary` and `falseBecause`, objectives,
     mails and keys with "hint" in the name. NOT read: a technique's `name` and `summary`, an item's or
     card's `name`, a readable object's `text` (a sign, a note), a file's `text` inside a share, an NPC's
     name, and ink. The brief's list begins with "names".
  2. A framework path is found only when a whitespace-separated token is all lower case and its first
     `/` part is one of the nine words. `module:exploit/area/thing/probe` (glued to a label),
     `Exploit/Area/Thing/Probe` (capitals) and a path with the first word left off all pass. In a JSON
     file with no space after the colon the separation test misses the same path.
- How to see it: load `scenarios/test_ops_skin`, set the lobby sign's `text`, the share file's `text`, a
  technique's `name` or a card's `name` to `Read CVE-9999-12345 first.` and call `check_realism_skin`:
  no issue in any of the four. Set a finding's `summary` to `See module:exploit/area/thing/probe for it.`:
  no issue. `Apache box` as a host name is not reported either (the product list is applied to the
  banner only, and to `product` by `validate_network_ops.rb`).
- Why it matters: for shipped scenarios the separation test's whole-file scan still catches an advisory
  id or nickname, so nothing shipped is wrong. But an author who runs only the validator is told the
  scenario is clean, and the path form is missed by both.
- Smallest fix: in an ops scenario run the advisory and nickname patterns over every string value of the
  scenario (one recursive walk, skipping `_` keys and the default-form exemption), and replace the token
  test for paths with one regular expression over the whole string, case-insensitive, not preceded by a
  letter, digit, `_` or `/`. Run the unchanged-validator test afterwards: the four shipped ops scenarios
  must stay quiet.

### R1-S4 (major): nothing mechanical stops an `output` line or a banner that reads as instructions

- File: `scripts/realism_text_rules.rb` (whole file); the scope is stated only in the description at
  `config/break_escape/realism_catalog.schema.json:36`.
- What is wrong: the rules catch shapes (paths, flags, shell characters, blobs, hosts, credentials).
  They do not catch a sentence that tells someone what to do, or a request written without a leading
  slash. All of these pass as an `output` line and as a banner with no error:
  - `State: send an oversized name field to the sign-in form to trigger it.`
  - `Run the check twice, then request the admin page with a blank session.`
  - `GET cgi-bin/status.php returns the build` and `Request index.php?id=1 shows the error`
  - `POST to api/login with a long name`, `Options (-sV) give more`, `etc/shadow readable`
- How to see it: `RealismTextRules.check(text, kind: :prose)` on each line returns nothing. The reuse
  probe in R1-S2 wrote two such lines into a catalog copy and the validator said "clean".
- Why it matters: this stage's three entries are fine, so nothing shipped is wrong. But the next catalog
  task adds real entries, and the only guard on "never a step, a request form or a trigger" is a person
  reading the file, while the brief also says nobody but the catalog task opens it.
- Smallest fix: two more rules for prose. (1) An error when a line begins with, or holds after
  `State:`, an instruction verb from a short list (send, request, post, get, put, run, type, enter, set,
  supply, craft, inject, upload, execute, trigger, bypass, overflow), plus the words `payload` and
  `shellcode` anywhere. (2) Treat a token with one `/` whose right side has a file extension or a `?`,
  and any token holding `?` followed by `name=`, as a path. Strip brackets before the flag test so
  `(-sV)` is caught. Keep the human review step: the list cannot be complete.

### R1-S5 (major): `ui-rules-audit.mjs --ops-view` never finds the foothold by itself

- File: `tools/playtest/ui-rules-audit.mjs:266` (the `open` string), header comment `:40-42`.
- What is wrong: the surface reads `window.__test.footholds`. The bridge has no such call: footholds are
  at `window.__test.access.footholds()` (`public/break_escape/js/systems/test-bridge/access.js:213`,
  mounted as `access` at `index.js:2316`; `network-skin-parity.mjs` uses that form). So `held` is always
  empty, and without an id after `--ops-view` both surfaces throw "no foothold held: the box is not
  planted" even when it is planted. They are then reported as not audited, and without `--strict` the
  run still exits 0. The header says the default is "the first one held (jack_office_port)".
- The `setSkin` half is wired correctly: `window.__test.network.setSkin` exists
  (`test-bridge/network.js:220`) and returns `changed: false` when the view is already in that skin.
- How to see it: `grep -rn "footholds" public/break_escape/js/systems/test-bridge/` shows the call only
  under `access`.
- Smallest fix: read `window.__test.access.footholds()` in the `open` string. Also make "not audited"
  for an `--ops-view` surface a failure whether or not `--strict` is given: the flag was asked for.

### R1-S6 (major): the parity runner still sweeps by button in the Terminal game, and never checks game B starts in the Terminal

- File: `tools/playtest/network-skin-parity.mjs:122-125` (the sweep step and its comment), `:328-333`
  (the skin check, made only after each step, with the comment "it is Panels before the sweep").
- What is wrong: both comments describe the fault fixed by `153c48ff9`. Since that fix the Terminal and
  the switch are there before the first sweep, so game B can type the sweep. As built the live run
  never types a sweep, which is the one line where the Terminal's range and network forms are parsed,
  and game C's first step also runs in Panels. Nothing checks which skin a game is in before step 1, so
  if the fix regressed the runner would still pass.
- Answer to the question asked: yes, it should now type the sweep.
- Smallest fix: `B: 'typed'` on the sweep step; delete both comments; in `openGame`, after the view
  opens, fail when `state().skin` is not the game's wanted skin or `hasSwitch` is false.

---

## Minor

### R1-S7 (minor): honest text the rules refuse

- File: `scripts/realism_text_rules.rb:111-113` (colon pairs), `:120` (default-password right side),
  `:143-146` (dotted names), `:56` (`;` and `&`), and `scripts/validate_realism_catalog.rb:203-205`.
- Refused, each a line an author could fairly write: `Release line 2.4.x is behind` (host rule, on
  `2.4.x`); `FileHold 3.2 ready, e.g. for guests` (host rule, on `e.g`); `Server time 14:02`
  (credential rule); `Username/password sign-in enabled` (credential rule); `Read-only share; guests
  allowed` and `TLS 1.0 & 1.1 enabled` (shell rule); and in the catalog only, `FileHold build 2.4.1.0`
  (dotted quad). The version-line case matters most: version lines are what this catalog is about.
- Smallest fix: in the host rule require the last part to be two or more letters and the part before it
  to hold a letter; exempt `\d{1,2}:\d{2}(:\d{2})?` from the colon rule; say in the N16 doc that `;`, `&`
  and four-part versions are refused, so the author is not surprised.

### R1-S8 (minor): public address forms the scenario text rules miss

- File: `scripts/realism_text_rules.rb:137-141`.
- The dotted-quad test is anchored to a whole stripped token. `Seen at 8.8.8.8/24`, `addr=8.8.8.8` and a
  short-form IPv6 address (`2606:4700::1111`) pass in a banner. The catalog has its own any-quad rule
  (`validate_realism_catalog.rb:203`), so this is a scenario-only gap.
- Smallest fix: scan the whole string for `\d{1,3}(\.\d{1,3}){3}` and test each match against the private
  ranges; refuse any token holding `::`.

### R1-S9 (minor): telltale words are whole words from a fixed list

- File: `scripts/realism_text_rules.rb:33-34, 150-162`.
- `Honeypot entry, bogus result`, `This one is a dummy`, `notvulnerable`, and in a module or script
  `fakecheck` and `filehold-nonvuln` all pass. This matches the brief's list, so it is not a build fault;
  it is listed so the owner can decide whether to widen the list (honeypot, bogus, dummy, spoof, phony,
  harmless, benign, "false positive" already caught by `false`).

### R1-S10 (minor): `require 'json-schema'` now happens before the scenario validator's own guarded require

- File: `scripts/validate_realism_catalog.rb:21-22`; `scripts/validate_scenario.rb:31` loads it (through
  `validate_realism_skin`) before its own guarded `require` at `:53-66`.
- Answer to the question asked about `use_multi_json = false`: the gem sets this switch to true only
  when `MultiJson` is already loaded. It is process-wide. Turning it off makes the gem parse JSON text
  with the `json` library (or `yajl` when that gem is installed, which it is not here) and serialise
  with `JSON.dump`. The validators pass Hashes, not text, so nothing they check changes; no code under
  `app/` or `lib/` uses the gem. In a plain `ruby scripts/...` run `MultiJson` is not loaded and the line
  does nothing. So: no other effect on results.
- The one real side effect is the order of requires: with the gem missing, a user now gets a bare
  `LoadError` from `validate_realism_catalog.rb:21` in place of the helpful message at
  `validate_scenario.rb:57-66`.
- Smallest fix: move the `require_relative 'validate_realism_skin'` line in `validate_scenario.rb` below
  the guarded require, or wrap line 21 the same way.

### R1-S11 (minor): the index's scenario column drops a scenario that fails to load, without a word

- File: `scripts/validate_realism_catalog.rb:267-277` (`rescue StandardError; next`).
- A scenario whose ERB or JSON is broken is skipped, so the index shows `-` for an id that is linked, and
  the "index equals what the validator would write" test agrees with it.
- Smallest fix: collect the skipped names and print one warning line; do not write the index when a
  scenario that holds the text `"realism"` could not be read.

### R1-S12 (minor): two validator messages and the N16 doc are out of date since `153c48ff9`

- Files: `scripts/validate_realism_skin.rb:420` ("so the network view never offers the Terminal");
  `docs/ACCESS_AND_NETWORKS.md` N16, "When the switch appears" ("drawn only when the server marks at
  least one block of the view `ops: true`").
- As built the client also shows the switch and the Terminal on a view that offers a sweep (a discovery
  network not yet swept). So a scenario with a discovery network and no services does get a Terminal
  before the sweep, and loses it after.
- Smallest fix: reword both. The behaviour itself is the client reviewer's to judge; see the owner
  questions.

### R1-S13 (minor): the N16 doc leaves out rules an author will hit

- File: `docs/ACCESS_AND_NETWORKS.md`, N16 "Validator" paragraph.
- Missing: the strong telltale words are an ERROR in a banner or service word (decoy, fake, false, bait,
  patched, not vulnerable), where the doc lists only a warning about "a word in an entry"; a `cli.hosts`
  key longer than 64 characters; an address on a network with no range; the credential-like forms
  (`word:word` with no space, `x/x`, `user=...`); a public host name or URL. The doc says "no paths,
  flags, shell characters or encoded blobs" and stops. It also does not say that the range is sent with
  the first view, before any sweep, which an author choosing a range should know.
- The rest of N16, the README row and the `docs/test-bridge.md` section match the code as built. The
  English is plain and UK. No real identifier is quoted.
- Smallest fix: add those five items and the one sentence about the range.

### R1-S14 (minor): the skin validator's version check needs the full product name

- File: `scripts/validate_realism_skin.rb:126-135`.
- The check looks for the service's whole `product` followed by a version. With the product "Tarnwick
  FileHold", the banner `FileHold 4.3 ready` (vendor word left off, as real banners often do) is not
  compared with the service's version 4.2, and passes.
- Smallest fix: also try the product's last word when the product has two or more words.

### R1-S15 (minor): `scripts/real_vuln_nicknames.txt`: keep it; three small points

- Is a deny list of names consistent with the rule and the plan? Yes. The rule limits real advisory ids
  and real framework module paths to the catalog. A nickname is neither; the plan names this file
  (`OPS_REALISM_SKIN_PLAN.md:1777`) and the brief asks for it (unit 20). The list is what lets a machine
  refuse those names in ids and scenario text.
- Is every entry only a nickname? Yes: 17 lines, one bare name each, no id, no year, no product, no
  detail. Two of them (`wannacry`, `notpetya`) are names of malware and not of a vulnerability; the
  header says "vulnerability nicknames". That is harmless.
- Who reads it? `scripts/validate_realism_catalog.rb:30` (the path), `scripts/validate_realism_skin.rb:248`
  and `test/unit/realism_separation_test.rb:16`. Nothing under `app/`, `lib/`, `public/` or `tools/` reads
  it and no route serves `scripts/`.
- Points: (1) the header (`:1-3`) says only the catalog validator uses it, for ids; the skin validator
  and the separation test use it for all scenario text. (2) A two-word name written as one word passes
  both validators: the list has `dirtycow` and `dirty_cow` but only `dirty_pipe`. Either add the joined
  form or make the separator optional in `realism_skin_nickname_patterns` (`validate_realism_skin.rb:104`).
  (3) The brief says docs hold no nickname; the diff's docs hold none. The plan itself quotes one in an
  example (`OPS_REALISM_SKIN_PLAN.md:1332`); that file is outside this diff and is noted for the owner.

### R1-S16 (minor): real public addresses in tests

- Files: `test/unit/validate_realism_catalog_test.rb:169`, `test/unit/validate_realism_skin_test.rb:123, 294`
  (a well-known public resolver address and its /24); the JS test at
  `test/js/network-terminal-grammar.test.mjs:435` uses `1.2.3.4` (the other reviewer's file).
- The brief says no public address anywhere, tests included. A test of the "public address" rule needs a
  non-private address, but the three documentation ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24)
  are reserved and name no real host.
- Smallest fix: swap the values for addresses in a documentation range.

### R1-S17 (minor): `test_ops_skin`: soft signs of the decoy, one warning, one stale line

- File: `scenarios/test_ops_skin/scenario.json.erb:260-265`; `scenarios/test_ops_skin/PLAYTEST.md:49-50`.
- Ids and names do not give the decoy away: the findings are `entry_a`, `entry_b`, `entry_c`, served in
  id order as f1, f2, f3, and the decoy is the middle one. The linked entries have one form. Two soft
  signs remain in served text: the decoy is the only finding with severity `low`, and its summary and
  linked title use "reports" where the two weaknesses state a fact. For a test scenario this is
  acceptable; an author copying it should not copy the pattern. Smallest fix: give the decoy `medium`
  and word its summary as a statement.
- The validator gives one warning (the guest camera runs a service and nothing on that network has a
  weakness). It is scenery by design, but the brief's "validates clean" is not quite met. Smallest fix:
  say so in `PLAYTEST.md`, or accept it.
- `PLAYTEST.md` against the game as built: the beats agree with the Terminal being there before the
  first sweep (T1, T2, K3a and D1 all need it, and now have it). Every beat can be played by clicks or
  typing: a use on the false decoy and on the unconfirmed finding is offered in both skins, so T5's
  refusals need no hand-built request. One stale line: "Layout" says "One network, `office_lan`" and
  then describes the second network two lines later.

### R1-S18 (minor): the parity runner's guard list is thin, and it does not compare objectives

- File: `tools/playtest/network-skin-parity.mjs:31` (`OPS_FIELDS`), `:38-46` (`REMOVED_KEYS`), `:84-87`
  (`isRecorded`), `:149-161` (the record).
- `normaliseAnswer` removes seven keys at every depth: `gameId`, `game_id`, `at`, `ts`, `time`,
  `expiresAt`, `gainedAt`. None is an ops field and all three games talk to one server, so as it stands
  the list hides no real difference that I can find. Two weaknesses: (1) the guard that refuses an ops
  field knows only six names. `cli`, `findings`, `falseBecause`, `needs`, `fixed`, `id`, `hostId`,
  `service`, `class`, `severity`, `summary`, `address`, `services`, `session` and `credential` could be
  added to the removed list tomorrow and the guard would not object. (2) `time` and `at` are short,
  common names; if an answer ever carries a game-clock `time` that should match, it is dropped silently.
- Only POSTs to `/network/*`, sign-in and the share are recorded, as the brief says. The five objective
  tasks of `test_ops_skin` tick from client events, and neither the POSTs to `/objectives/tasks/...` nor
  the saved objectives are compared. A skin that failed to raise an event would pass.
- Smallest fix: add the names above to `OPS_FIELDS`; add the completed tasks to the record read at the
  end.

### R1-S19 (minor): tests that assert too little

- `test/controllers/break_escape/network_skin_blind_test.rb:19`: the `VOLATILE` list replaces every key
  named `id` at any depth, so host, finding and foothold ids in the answers are never compared. Mask
  `id` only where it is a database id.
- Same file, `:71-77` ("reaches every network and ops route and gets real answers"): asserts only that
  some status is 200, the first answer is a Hash and there are 14 answers. A run in which most steps
  answer 404 passes. Assert the expected status of each step.
- `test/controllers/break_escape/ops_skin_scenario_test.rb:184-200` (T4): the name says "under the server
  aliases" and no alias is asserted. It does not assert that the three unconfirmed rows have the same
  key list, or that the decoy's `falseBecause` text is absent from the check answer and present after
  its confirm.
- `test/controllers/break_escape/network_realism_link_test.rb:71-89`: the "same keys on the decoy"
  assertion compares only `cli` keys, and only in `GET /network` after every confirm. Add: in the check
  answer, `row.keys` is equal for all three rows.
- Same file, `:173-191` (404): tries five made-up paths that match no route. It does not try the real
  static routes with `..` (`/break_escape/assets/../../../config/break_escape/realism_catalog/...` and
  the percent-encoded form), which is the only way a file outside `public/` could be asked for.
- `test/controllers/break_escape/access_leak_scanner_ops_skin_real_test.rb:127`: "no finding cli
  before the check" looks for one title of one entry in the scan answer. Check every string of all
  three entries in the first view, the sweep and the scan.
- `test/unit/realism_separation_test.rb:58-63`: the self-check feeds the path form only as a
  space-separated lower-case token, which is why R1-S3's second point went unseen. It also scans only
  entry `module` values under `public/` and `app/assets/`, not titles, output lines or advisory ids.
- `test/unit/validate_realism_catalog_test.rb`: no case for a missing index file or a row that does not
  parse (R1-S2).
- `test/models/break_escape/network_view_bootstrap_test.rb` is sound for what it claims; it uses a
  made-up scenario, so the bootstrap of `test_ops_skin` itself is only checked for the key `realism` and
  the link ids (`network_realism_link_test.rb:99-100, 124-128`), not for its banner, range or addresses.

### R1-S20 (minor): `session-start.sh --net-skin`: sound, one edge

- File: `tools/playtest/lib/session-args.sh:52-62`.
- The value is checked (`gui` or `cli`), removed from the arguments and added to the URL after `?` or
  `&`. A URL that ends in a `#fragment` would get the parameter after the fragment, where the browser
  does not read it as a query. No playtest URL has one today.
- Smallest fix: none needed; a comment is enough.

---

## Test runs

- `PATH=/home/deploy/.local/node-v22.11.0-linux-x64/bin:$PATH bin/test-js test/js/ops-unchanged-validator.test.mjs`:
  1 passed, 0 failed.
- `ruby scripts/validate_scenario.rb scenarios/test_ops_skin/scenario.json.erb --no-graph`: 0 errors,
  1 warning (R1-S17).
- `ruby scripts/validate_realism_catalog.rb` against the real catalog with a scratch `--index`: clean,
  nothing on stderr, and the index it wrote equals the committed one.
- `bin/ops-golden-compare` (no outer flock) and
  `flock ... bin/rails test` over `validate_realism_catalog_test.rb`, `validate_realism_skin_test.rb`,
  `realism_separation_test.rb`, `network_view_bootstrap_test.rb` and `test/lib/realism_catalog_test.rb`:
  golden compare 16 runs, 0 failures; Rails set: 112 runs, 2694 assertions, 0 failures, 0 errors, 0 skips. The serving tests (link, scenario, scanner real, skin-blind) were read, not run: the shared lock was held by other sessions for most of this review.

---

## For the owner

1. **Reuse of a catalog id.** Append-only is defined by id and form. Should an entry's text also be
   frozen once a shipped (non-test) scenario links it? A short digest per id in the index would let the
   validator say "the text of a linked entry changed" without the index holding any catalog text.
2. **Who checks output scope?** The brief has only the catalog task open the catalog. With R1-S4 in mind,
   should a second reader (a named review step, by id, as unit 20 did) be required for every new entry,
   and written into N16?
3. **Nicknames inside the catalog.** The validator refuses a nickname only in a catalog id. A title, a
   module or a script may hold one (a probe with one in each passed). Is that intended for the real
   entries to come, given that titles are shown to the player and the rule speaks only of ids and module
   paths?
4. **The service word.** `cli.service` is not checked against the product list, so a scenario may print a
   real daemon's name as the service word. Real scanners print such words, and protocol words (ssh,
   http, smb) must stay allowed. Should product-named service words be refused?
5. **The Terminal before the first sweep.** Since `153c48ff9` the client offers the Terminal on any view
   with a sweep on offer, though the server marks `ops` only after the sweep. On a discovery network
   whose hosts declare no services the Terminal appears and then goes away after the sweep. Is that
   acceptable, or should the server say up front that the view is an ops view (which tells the player
   that something there has services)?
6. **The plan quotes a nickname** in a validator example (`OPS_REALISM_SKIN_PLAN.md:1332`). The brief
   forbids editing the plan in this stage. Leave it, or replace it with an invented word in a later
   tidy?
7. **Objectives in the parity run** (R1-S18): add them to the comparison, or leave the runner to the
   network routes as the brief wrote it?
