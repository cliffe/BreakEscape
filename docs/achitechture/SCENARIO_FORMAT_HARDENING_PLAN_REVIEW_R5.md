Counts: 0 blockers, 0 majors, 8 minors, 8 nits.

# Scenario format hardening plan: review round 5 (final)

Reviewed: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md` at e3c2aecc0 (Draft). Date 2026-11-12. Code read with `git show` on main 33c003230 and on build/unlock-gaps-r1 at e937b75f8. Reviews R1 to R4 were used only to confirm their findings are closed.

Grading for this last round: anything a builder can fix from a precise instruction is a minor. Nothing found needs the plan's design rewritten.

## Round 4 findings: status

| R4 | Status |
|---|---|
| M1 value check fails on plain-text clues | Resolved: four leaf classes, step 3 the single judge of authored text, the two answer copies marked server-only. One allowance is attached to the wrong field (m1 below). |
| M2 mutation (c) cannot fail; Friendface fetch scans nothing | Resolved: identity check, `feedRevealed` seeding, path check limited to subtree payloads. Mutation (c) checked on paper below and does fail. |
| m1 blank or malformed answer opens a lock | Resolved. Checked against unlock-gaps-r1's tests below. |
| m2 `lock_codes` callers break silently | Resolved (rename to `lock_answer_keys`, one probe). Two call lines still to name (n2). |
| m3 whole-tree walk | Resolved. |
| m4 corpus diff | Resolved (merge-base load, `test_secret_leaks` must show the intended rows). |
| m5 pickup preconditions | Resolved. |
| m6 stub mechanism | Resolved. |
| m7 seeded scan | Resolved; one wording overclaims (n8). |
| m8 exceptions list | Resolved in principle; the mechanics need tightening (m6). |
| m9 decisions file proves only a heading | Resolved (section restates the entry; one heading, one entry). |
| m10 binding built after seeding | Resolved. |
| m11 6a size and run time | Resolved (6a-1 and 6a-2, run time recorded, tag-out rule). |
| n1 stale tips | unlock-gaps-r1 now correct (e937b75f8, 19 ahead); sync-deltas has moved (n1). |
| n2 random leaf path known limit | Resolved (stated in step 3 item 3). |

## Spot checks that passed

**`lock_answer_matches?` against unlock-gaps-r1.** game.rb:2684-2701 on e937b75f8 holds the `numbers` lambda exactly as the plan quotes it, and the callers are at 2839 and 2949. `test/controllers/break_escape/combination_cryptex_unlock_test.rb` lines 193 to 208 on e937b75f8 were run through the plan's `answer_key` on paper: the three combination matches give `combination:12-30-5` on both sides; `12-30` against `12-30-5`, `12-30-5-0`, `30-12-5` and `twelve` all differ or give nil; lines 200, 201, 206 and 207 give nil for the secret and are refused by `!a.nil?`; line 208 (`['CIPHER']`) gives nil for the attempt and is refused. The line numbers the plan names are correct.

**`downcase(:fold)`.** Run on Ruby 2.7.8 (the project Ruby) and 3.2: `casecmp?` and `downcase(:fold) ==` agree for `ÉCOLE`/`école`, `Straße`/`STRASSE`, `ﬀ`/`FF`, `ǅ`/`ǆ`, `ΣΑΣ`/`σας`, the Kelvin sign and a Cherokee pair. On invalid UTF-8 both raise `ArgumentError` (`input string invalid` and `invalid byte sequence`), and Rails rejects such params before the action, so no new failure path. R4's worry that `casecmp?` folds ASCII only was wrong; the plan's statement is right.

**Rename and callers.** On main the only callers of `lock_codes` are `capture_model.rb:217` (inside `password_opens_lock?`), `validate_capture_log.rb:62`, and `validate_scenario.rb:6237, 6242, 6261` (6322, 6327, 6346 on e937b75f8). No test calls it. `hard_access_values` is read only at game.rb:1284. The plan's four consumers are the full set; two of the lines to rename are not named (n2).

**The probe changes nothing it should not.** Every kind the old raw sets held is reachable through the new probe (`pin:`, `password:`, `rfid:`, `biometric:`, `flag:`, with PSKs as `password:`), so the old include tests become key tests with the same answers, which the merge-base diff then confirms on the corpus.

**Mutation (b), m01.** The bootstrap keeps a room's `requires` in `kept_fields` (game.rb:1121-1124) and relies on the controller's `filter_requires_recursive` (games_controller.rb:286) to strip it. With both filters replaced, m01's PIN door `requires` ships in the fresh-state bootstrap and fails as class 1. The test fails as intended.

**Mutation (c), test_access_sessions.** `login_desktop_contents` (game.rb:1806-1812) adds only admitted profiles; with it replaced, `dana_files`' item `dana_forecast` (scenario.json.erb:56-66) reaches Ian's session. The identity check, built from `admitted_profiles` (game.rb:1787), fails naming it. Neither profile holds a secret, so this is the only assertion that can fail, as the plan says.

**Mutation (a), test_unlock_gaps.** Every caller reaches `strip_lock_answers!` on the class (`self.class.` at game.rb:746, 1159, 4828; `BreakEscape::Game.` at games_controller.rb:1935 on e937b75f8), so Minitest's `stub` covers them all. The copy's `test_cryptex_box` (scenario.json.erb:61-67) ships `cryptexConfig.answer` once stubbed. It fails, but not as class 1 until the field is declared (m2).

**Clue fixtures.** m01:1783 (`postitNote` on a locked password PC, `requires` `tiaspbiqe2r`), test_access_sessions:472, lab_social_engineering:197, test_access_signin:32 (`text`), m02:1021 (`sendTimedMessage.message`) and ceo_exfil:158, 279, 348 (`postitNote`) are all declared item or eventMapping fields with no mark, so all pass as class 3. test_access_habits:1032 is not a clue (it is Lena's `creds.password`); the clue in that scenario is Omar's written-down password, which takes a different route (m1).

## Minors

### m1. The `GET login_accounts` allowance is on the wrong field, so a legitimate written-down password fails

**Section:** 6a-1 Marks (the `postitNote` bullet), class 4, corpus examples, 6a-1 class fixtures; "What 6a's scan settles".

**Evidence.**
- `login_postit_for` (game.rb:1886-1898 on main) returns nil whenever the sign-in PC authors a non-empty `postitNote`. An authored `postitNote` therefore never travels in `GET login_accounts`; it ships in the room payload, where it is class 3.
- What the route does serve (games_controller.rb:1185-1186) is a constructed note, `"<username> / <creds.password>"`, when the PC's owner `written_down?` (game.rb:1876-1880: `habits.writesDown`, or a `writes_down` workaround done).
- That leaf is class 4. It matches `creds.password` (an answer of 6 or more characters, a whole word), and no field whose `x-servedBy` names `GET /login_accounts` holds the value, so it fails. test_access_habits' H3 beat (Omar, "keeps his password on a note", password at scenario.json.erb:512) is exactly this case, and it is legitimate.
- The class fixture "a sign-in PC's `postitNote` in `GET login_accounts` (class 4, passes)" cannot be built: authoring the `postitNote` suppresses the answer.

**Fix.**
- Replace the `postitNote` bullet: `creds.password` carries `"x-servedBy": "GET /login_accounts"`. Scope the allowance to the answer's `postitNote` key, so a password in a tile or any other key of that answer still fails.
- State that an authored `postitNote` on a sign-in PC suppresses the constructed note and ships in the room payload as class 3.
- Replace the class fixture with an owner whose `habits.writesDown` is true: the constructed note passes in `GET login_accounts`, and the same password under an undeclared key on another route fails.
- Replace the test_access_habits:1032 citation with Omar's PC (H3) as the corpus case, and drop the sentence "Every sign-in PC's `postitNote` in the corpus also passes in its `GET login_accounts` answer as class 4".

### m2. The two answer copies are not declared on items, so class 1 cannot see them there

**Section:** 6a-1 Marks (answer copies); mutation (a).

**Evidence.** On e937b75f8 `definitions/item` declares neither `cryptexConfig` nor `combination`, and `definitions/room` declares `cryptexConfig` but not `combination`. Class 1 needs a declared, marked source path. Undeclared, `test_cryptex_box`'s `cryptexConfig.answer` is class 4. It still fails on value, but mutation (a) asserts "fails on the path check (class 1), naming the `cryptexConfig.answer` path", which would not hold.

**Fix.** In 6a-1's schema pass, declare `cryptexConfig` on `item` (an object with `wheelCount` and `answer`, matching the room's form) and `combination` on both `item` and `room`, then add the marks. Add a node test that both fields are declared on both definitions.

### m3. Deny-listed top-level blocks carry no marks, so a bootstrap regression on them passes

**Section:** 6a-1 Marks; classes 1 and 3.

**Evidence.** `filtered_scenario_for_bootstrap` deletes `flags`, `accountProfiles` and `roles` and withholds the network keys, feed facts, capture secrets and grant contents (game.rb:1151-1182). The plan marks the secret leaves inside some of these (flag values, PSKs, capture secrets, grant contents, the NPC `feed` record), but not `accountProfiles` or the non-PSK network keys. If the `accountProfiles` delete were lost, every profile would ship to every player in the bootstrap: the identity leak 6a-2's check exists for. Its leaves (`text`, `name`) are declared and unmarked, so they are class 3 and pass. The identity check reads only `GET container`, not the bootstrap.

**Fix.**
- Give a whole-record mark to each top-level key the bootstrap deletes or withholds: `accountProfiles` with `x-servedBy: "GET /container"`; `networks` (all but what ships today) with `GET /network` and `GET /container`; `roles` and `flags` with none.
- State the precedence once. A leaf under a server-only ancestor, on a route that ancestor's `x-servedBy` names, is then classed by its own field (classes 2 to 4). So an answer under an undeclared key in a served profile still fails.
- Add mutation (d), cheap and on the same pattern as (a): stub out the `accountProfiles` delete, and the fresh-state scan fails on the bootstrap.

### m4. Routes that serve authored data are neither fetched nor named

**Section:** 6a-1 "Routes fetched", the left-out lines; section 9, "The 6a scan misses locked content".

**Evidence.**
- The plan promises to fetch every route that serves authored data, or name why a route carries none. config/routes.rb on main has more such routes:
  - `POST unlock` answers with `roomData` and with container `contents` (games_controller.rb:958-980, through `filter_container_contents`);
  - `GET ink` serves compiled NPC scripts, which can hold a code in a spoken line (q85 is exactly this);
  - `POST login`, `POST network/join` and `POST feed_post` return result bodies;
  - `POST flags` returns rewards.
- None of these is fetched, and none is in the left-out list.

**Fix.**
- Fetch `POST unlock` in 6a-2 for each locked room and container, with its right answer, and scan `roomData` and `contents` as subtree payloads.
- Add a left-out line for each of the others, naming what it serves and why it is not scanned:
  - `GET ink`: ink text is best effort under the cheat policy, and step 3 covers the globals it reads;
  - the POST answers: name the builder function each shares with a scanned route, or fetch it.

### m5. Fields shipped before they are shown pass as clue text

**Section:** class 3; section 9.

**Evidence.**
- `revealOnGlobal` is read only by the client: `git grep` finds no use in `app/` or `lib/` on main. An object hidden until a global is set, a note holding a PIN for example, ships in the room payload at load.
- `textVariants` and `observationVariants` likewise ship every variant at load.
- A PIN in one of these fields is in the browser before the player has earned it, the same harm as m08's global. Step 3 does not look at these fields, and class 3 passes them.

**Fix.** Record it in section 9 as a known limit of both checks, with lab_physical_pentest (`revealOnGlobal`) and m02 (`textVariants`) as the corpus users, and file the extension in `docs/IDEAS_BACKLOG.md`: these fields under step 3's rule. Building it now is out of scope.

### m6. The exceptions list and the `approved` rules need their mechanics pinned down

**Section:** 6a-1 "The exceptions list"; step 1 known-failures list; step 3 item 5; step 1 item 9 (AGENTS.md line).

**Evidence.**
- **(i) One path or several.** An exception entry has one `path`, but the legacy PCs are "one entry per scenario listing its PC paths".
- **(ii) Which fields.** The plan never says which fields a scan exception's decisions section restates. It does for the other two lists: `scenario/stage/match/count` and `lock/in/reason`.
- **(iii) Section format.** The format of a decisions section is unspecified, so three tests would each invent a parser.
- **(iv) One heading, one entry.** The rule is checked across the known-failures and `acknowledgedClues` lists by a node test. The scan's list lives in a Rails test file, checked "by the test itself", so one heading could back a known failure and a scan exception at once.
- **(v) Merge-batch check.** The batch diff and the AGENTS.md line name only `scripts/validator_known_failures.json` and `acknowledgedClues`; scan exceptions are not in either.
- **(vi) Expiry.** Known failures carry `reviewBy`; scan exceptions do not, though both first entries are temporary (m08 pending q85, the legacy PCs until their owners act).

**Fix.**
- Put the scan exceptions in a JSON file, for example `test/fixtures/files/payload_scan_exceptions.json`, with entries `{ scenario, route, paths, reason, reviewBy, approved }`.
- The Rails scan reads that file. The node list test checks it with the other two lists, including heading uniqueness across all three.
- Each decisions section holds one fenced `json` block that restates its entry's identifying fields exactly. The tests parse that block.
- Add the exceptions file to the batch diff and to the AGENTS.md line. Apply the `reviewBy` and `MERGE_BATCH=1` rule to it.

### m7. The comparator's live proof asks the minigames for answers they cannot produce

**Section:** step 3, Live proof, the comparator bullet.

**Evidence.** On e937b75f8 the combination minigame builds its answer from the dials (`_combo()`, combination-minigame.js:201, always zero-padded numbers joined by `-`), and the cryptex builds its word from fixed wheel letters (cryptex-minigame.js:207, 303-308). Neither can send a blank, a malformed or a different-case answer.

**Fix.** Send the blank, malformed and case-variant attempts from the page with the client's own `apiClient.unlock(targetType, targetId, answer, method)`. That is the real route, with the session and CSRF token, and stands as the browser proof. Then reload and check the lock is still shut. Open each lock with the right answer through the minigame UI.

### m8. `test_secret_leaks` needs a Mission row before a keyless server can start it

**Section:** step 3, Live proof and the corpus check.

**Evidence.** `tools/playtest/new-game.rb:98-100` finds a mission by id or name only and creates none. The development database is shared by every worktree, and a `db:seed` run from a worktree that lacks another branch's scenario folders offers the orphan delete for those missions (section 6, q86's facts).

**Fix.** Give `scenarios/test_secret_leaks/mission.json` `"collection": "testing"`. Create its row with a one-off `bin/rails runner` that only inserts that mission, not with `db:seed`. Record the command in the build log, and say the same for any later test scenario a step adds.

## Nits

- **n1.** Section 5: build/sync-deltas is now at 9a156704c, not eea02e21a. The table is regenerated per batch.
- **n2.** Step 3, "One probe". The builder line `lock_codes = BreakEscape::CaptureModel.lock_codes(json_data)` (validate_scenario.rb:6237 on main, 6322 on e937b75f8) and `validate_capture_log.rb:62` itself call the old name and are renamed too. The two `include?` sites are at 6327 and 6346 on e937b75f8.
- **n3.** Step 3, "One walk, two sets". Use the guarded form the other lib files use, `require_relative 'npc_habits' unless defined?(BreakEscape::NpcHabits)` (access_work.rb:4, owner_claim.rb:3), because the engine autoloads `lib/` (engine.rb:14). `NpcHabits` needs `AccessIdentities` only inside methods, and `doorway_problem` not at all, so `validate_capture_log.rb`'s require order (capture_model before access_identities, lines 11-12) is safe.
- **n4.** Step 3, `hard_access_capture_value?`. Keep the memo (`@hard_access_capture_values ||= CaptureModel.hard_access_values(scenario_data)`, game.rb:1284). The plan's one-line form rebuilds the whole-tree walk for every secret `authored_capture_secrets` checks.
- **n5.** Mutation (c). The item served to Ian is `dana_forecast`, from profile `dana_files`. Name the item id in the assertion.
- **n6.** Step 3 Rails tests. `answer_key('combination', 'Summer2024')` is `combination:2024`, because the moved lambda splits any string on non-digits. That is correct: the comparator already opens a `2024` combination with that text, so withholding it is the cheat policy. Add one test case, so a corpus diff row of this kind is understood at once.
- **n7.** Step 3 item 5. Declare `acknowledgedClues` in the schema in step 3 (entries `lock`, `in`, `reason`, `approved`, closed). The top level is open, but `check_unknown_fields`' known top-level list (validate_scenario.rb:405) would otherwise warn on m06. 6a-1's table then lists it as already declared.
- **n8.** 6a-1 class 2. "It fails exactly where step 3 would report an error" is not quite true. Step 3 reports only matches found under both seeds, and the scan renders once under `srand(1)`, so a seed-1-only coincidence fails the scan deterministically. Say so, and say that such a case goes to the exceptions list.

## Is the plan ready to build?

Yes. Nothing stops a builder once the eight minors are folded in as text; none adds a step or changes a size.

- **Steps 1, 2, 4 and 5** can start now. Step 1's landing waits on the owners' fixes or list entries, which is the orchestrator's work, not the builder's.
- **Step 3** builds after unlock-gaps-r1 and step 5, as section 5 says. m7 and m8 are the only points a builder would otherwise stall on (the impossible browser attempts, and starting the new scenario).
- **6a-1** needs m1, m2 and m3 folded in first. Without them it fails on test_access_habits' written-down password, mutation (a) asserts the wrong class, and the bootstrap's deny-listed blocks go unscanned.
- **6a-2** needs m4.
- **The split** between 6a-1 and 6a-2 is sound: 6a-1 holds the marks, the declared top level, the fresh-state routes and the class fixtures; 6a-2 holds everything that needs seeded state. The 6b decision rests on 6a-2 alone.

**Riskiest step: step 3**, as the plan says. Its comparator rewrite is unchanged in behaviour for every case in unlock-gaps-r1's tests (checked above). Its set changes are covered by the merge-base predicate diff and the `test_secret_leaks` rows.

**Sync size.** Unchanged. Steps 1 to 6a add nothing to player_state. Step 3 removes one bootstrap key. The scan's seeding writes only to test games.
