Counts: 0 blockers, 2 majors, 11 minors, 2 nits.

# Scenario format hardening plan: review round 4

Reviewed: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md` at 2ec2857c5 (Draft). Date 2026-11-12. Code read on main 33c003230 with `git show main:<path>`; unlock-gaps facts from `git show build/unlock-gaps-r1:<path>` at its current tip, 45168aba0. Reviews R1 to R3 were used only to check that their findings are closed.

The orchestrator's ruling stands: `answer_key` keeps passwords and PINs exact (the server's `to_s ==`), and only combination and cryptex answers are normalised. The plan follows it (step 3, "One normaliser").

## Round 3 findings: status

| R3 | Status |
|---|---|
| M1 step 3 names the wrong function, misses the account gate, no corpus method | Resolved: both sets and both server paths named, one normaliser, predicate diff defined, account tests, a live run on a new test scenario. Gaps in the normaliser's edge cases and the consumers of `lock_codes` remain (m1 to m4). |
| M2 opened state misses payloads, exemption too loose, no mutation test | Partly resolved: sessions per account, outages forced up, footholds, pickups through `POST inventory`, two new routes, a tight exemption and three mutation tests. The exemption is now too tight (M1 below), and two of the additions cannot do what the plan says (M2 below). |
| m1 sentinels miss direct `rand` | Resolved (two seeded renders). One construction detail (m10). |
| m2 per-stage rescue, `could not run` listable | Resolved (per call; list test rejects those matches). |
| m3 `approved` breaks at pass rollover | Resolved (`docs/agents/VALIDATOR_DECISIONS.md`, independent of the pass). The check is weaker than the plan claims (m9). |
| m4 `SERVER_BOOTSTRAP_KEYS` pulls in `objectives` | Resolved. |
| m5 bootstrap passed as an argument | Resolved (call-site pass, per-file names). |
| m6 flags shape before step 5 | Resolved (step 3 after step 5). |
| m7 q84 title-field move | Resolved (`scenario_name` and `name` kept). |
| m8 6a carries 6b's preparation | Resolved (moved to 6b). 6a is now undersized for other reasons (m11). |
| m9 `formatVersion` in templates | Resolved (stamped by the server, deferred). |
| n1 stale tips | Recurs (n1). |
| n2 door-entry PIN opens nothing | Resolved (step 3, "The server checks the room"). |

R1 and R2 findings are closed, as R3's table recorded; nothing in this draft reopens them.

## Majors

### M1. The 6a value check fails on every clue written in plain text, including m01's

**Section:** 6a Tests, "Assertions", value check; "What 6a's scan settles".

**Evidence.**
- The rule: a leaf passes only when the same value is authored at a different path that is not `x-serverOnly` and not flagged by step 3, or an acknowledged clue covers it. "The leaf's own source path never exempts it."
- A password written on a note is the clue, served on purpose, and its own source path is the only place the value is written. A whole-word match inside a string leaf applies to answers of 6 or more characters. On main:
  - m01_first_contact, scenario.json.erb:1783: a `postitNote` holding a password lock's 11-character answer as a word;
  - test_access_sessions, scenario.json.erb:472: a desk-drawer note holding Ian's account password (line 514), which is exactly the T4 beat the scenario tests; the plan names this scenario for mutation (c);
  - also m02_ransomed_trust (line 1021), lab_social_engineering (line 197), test_access_habits (line 1032), test_access_signin (line 32) and three `postitNote`s in ceo_exfil (lines 158, 279, 348).
- `GET login_accounts`, which the plan adds, serves a sign-in PC's `postitNote` at the keyboard by design ("The answer can carry a written-down password", games_controller.rb:1167-1187). Its leaf is a constructed answer, so it has no authored source path at all.
- `acknowledgedClues` cannot cover these: its `in` names an object holding `minigameData`, and step 3's leak check never looks at note text ("a clue PIN on a note's `text` (no finding: clues are the game)").
- So the scan fails on m01 in the fresh state, and "a finding only in the fresh state is fixed in place" would send a builder to strip a clue. The scan's verdict and step 3's verdict on the same value disagree.

**Fix.** Classify each response leaf by its source, and let step 3 stay the single judge of authored clue text:
- Source path marked `x-serverOnly` (resolved for `requires`), off its `x-servedBy` route: fails (the path check already does this).
- Source path under `globalVariables`, `minigameData` or `scenarioData`: step 3's rule, with acknowledged clues.
- Source path a declared, unmarked field (note `text`, `postitNote`, `observations`): passes. That is authored clue text, which step 3 already allows.
- Source path a field the schema does not declare, or no source path (a constructed answer): the value check, where a value whose authored field has `x-servedBy` this route passes on this route.
- To keep R3's point (an unmarked copy of an answer must fail), mark the known copies `x-serverOnly` in 6a's schema pass: `cryptexConfig.answer` and the combination lock's `combination` (the two `strip_lock_answers!` removes, game.rb:2707-2711 on 45168aba0). Mutation (a) then fails on the path check, naming that path.
- Mark `postitNote` on a sign-in PC with `x-servedBy: "GET /login_accounts"` so the constructed answer passes there.
- Rewrite "What 6a's scan settles" to say which of these four classes each route's leaves fall into.

### M2. Two opened-state additions cannot do what the plan says: mutation (c) cannot fail, and the Friendface fetch scans nothing

**Section:** 6a Tests: opened state, "Routes fetched", path check, mutation tests.

**Evidence.**
- **Mutation (c) has nothing to detect.** test_access_sessions' profiles are `staff_desktop` (a staff notice) and `dana_files` (a forecast) (scenario.json.erb:32-70); neither holds a lock answer or a password. `accountProfiles` is served by `GET container` for a sign-in PC (`render_login_desktop`, games_controller.rb:2129-2152, through `login_desktop_contents`, game.rb:1806-1812), so it carries `x-servedBy` for that route. Serving every profile to Ian's session therefore trips neither the path check (served-by route) nor the value check (no secret value). No assertion in the plan compares a profile with the session's identity, so the test cannot go red.
- **`POST friendface_phone` returns only revealed posts.** `open_friendface_phone` (social_feed.rb:234-255) answers with `feed_posts_for_client`, built from `player_state['feedRevealed']` (social_feed.rb:102-130). The opened state seeds no `feedRevealed`, so `feedPosts` is empty. The same data is already in the bootstrap as `feedPosts` (games_controller.rb:399), which the scan fetches anyway. The route also needs the phone in the inventory (`held_friendface_phone`).
- **Feed posts can carry secrets.** A post carries authored `text` and its `social.intelFacts` entry (`POST_KEYS`, social_feed.rb:25), which is OSINT clue material by design.
- **Once revealed, they fail the path check.** 6a's whole-record rules mark NPC `feed` server-only, and no `x-servedBy` names a feed route, so every revealed post would fail. The path check also assumes a response is a filtered subtree of the authored data; `feedPosts`, `GET network` rows, `login_accounts` tiles and `/capture_secrets` are constructed, so "x-servedBy is exercised on network and login_accounts" has no path to check against (M1's classes cover them by value).

**Fix.**
- Mutation (c): add an identity assertion to the opened state. For each sign-in PC and each admitted account's session, every item in the `GET container` answer must come from the PC's own `contents`, from a profile that `admitted_profiles` returns for that account, or from a mapped share stub. Record each item's source while building the expected set from `scenario_data`. Mutation (c) then fails, naming the `dana_files` item served to Ian. Keep the value check as it is.
- Feed: in the opened state, seed `feedRevealed` for every NPC with a feed, every authored post shown in authored order, with `seq` and the reply `to` entries `AccessWork.reply_target` needs, as `test/controllers/break_escape/feed_post_reply_test.rb` and `friendface_phone_test.rb` build them. Scan the bootstrap's `feedPosts`. Fetch `POST friendface_phone` only if the test also adds the phone item, and say it returns a slice of the same data. Mark the post fields in `POST_KEYS` and the fact entry with `x-servedBy: "feedPosts"`, so M1's value class judges them.
- Say in the plan that the path check applies to subtree-shaped payloads (`GET scenario` rooms, `GET room/:id`, `GET container/:id`, `playerInventory`), and constructed answers are judged by value.

## Minors

### m1. `answer_key` as written lets a blank or malformed answer open its lock, and fails four existing assertions

**Section:** step 3, "One normaliser".

**Evidence.** `lock_answer_matches?` on 45168aba0 (game.rb:2684-2701) never opens on a blank: `want.present? && got.present?` for a combination, `!want.empty?` for a cryptex, and a non-String cryptex secret counts as blank. The plan's rewrite compares `answer_key(secret) == answer_key(attempt)`, with nil for a value "not all numbers". Then nil equals nil, and `"cryptex:"` equals `"cryptex:"`. These assertions in `test/controllers/break_escape/combination_cryptex_unlock_test.rb` (on unlock-gaps-r1) fail: line 200 `('combination', nil, '')`, 201 `('combination', '', '')`, 206 `('cryptex', '', '')`, 207 `('cryptex', nil, nil)`. A combination lock with no `requires` would open to any non-numeric attempt. Two smaller differences: today a combination string is split on any run of non-digits (`"L12 R30 L5"` gives `[12, 30, 5]`), which a token parser would not match; and `downcase` folds Unicode where `casecmp?` folds ASCII only.

**Fix.** Write `answer_key` to return nil for a blank value, a non-String cryptex secret, or a combination with no numbers, and reuse the existing `numbers` lambda verbatim (array elements stripped, strings split on `/[^0-9]+/`). Write `lock_answer_matches?` as `a = answer_key(t, secret); b = answer_key(t, attempt); !a.nil? && a == b`, with `else false` kept for kinds other than combination and cryptex (its callers, game.rb:2838 and 2946, pass only those). Use `strip.downcase(:fold)` only if the old ASCII behaviour is shown unchanged for the corpus; otherwise keep `casecmp?` semantics by `strip.downcase(:ascii)`. The sets never store a nil key.

### m2. Changing what `lock_codes` holds silently breaks two validator call sites, and a fourth walk is missed

**Section:** step 3, "Both sets hold keys", item 6.

**Evidence.** `scripts/validate_scenario.rb:6242` and `:6261` test `lock_codes.include?(payload['secret'].to_s)` with the raw secret. Once the set holds `"pin:4821"`, these return false for every secret and main's capture-proof warning stops firing with no error. `scripts/validate_capture_log.rb:62` passes the set into `password_opens_lock?` (fine if the probe lives there). `validate_capture_log.rb:277-293`, `capture_log_secret_strings`, is its own pin and password walk for the `storeIn` text check and will not learn combination or cryptex answers. The new walk resolves door entries through `NpcHabits.doorway_problem`; `validate_capture_log.rb` requires `capture_model.rb` without `npc_habits.rb` (lines 9-13).

**Fix.** Rename the set builder (`lock_answer_keys`) so a stale caller fails loudly, add `CaptureModel.lock_answer?(keys, value)` (the probe that builds every key) and use it at validate_scenario.rb:6242 and 6261, in `password_opens_lock?` and in the server probe. Route `capture_log_secret_strings` through `each_lock_answer`, or record in the build log why the `storeIn` check stays pin and password only. Add `require_relative` for `access_identities.rb` and `npc_habits.rb` where scripts load `capture_model.rb`.

### m3. `each_lock_answer` must keep the whole-tree walk

**Section:** step 3, "One walk, two sets".

**Evidence.** Both walks on main visit every Hash in the scenario that has a `lockType` (capture_model.rb:148-163 and 175-207; the comment lists "timers" and "granted items"). The plan describes the new iterator by a list of places. A list that misses one (an item inside an action's `give_item`, a flag reward, a timer) shrinks the set, and a secret withheld today would be served. The corpus diff would catch a corpus case, not a future one.

**Fix.** `each_lock_answer` walks the whole tree as today, yields every Hash with a lock type, and adds door entries resolved from the connected room on top. The listed places become test fixtures, not the walk's definition.

### m4. The corpus diff is sound; tighten three points so it can only pass for the right reason

**Section:** step 3, "The corpus check".

**Evidence.** A capture's served state on the record is a pure function of `hard_access_capture_value?` (game.rb:1281-1285) and, for accounts in a proof-declaring scenario, `password_opens_lock?` inside `account_password_opens_something?` (capture_proofs.rb:86-87, an OR whose other branches do not change). Diffing those two, old against new, on one shared render is the right method and conservative. But: the new probe is planned inside `Game`, so "main's `CaptureModel` and the new one" does not reach it; "main" will have moved by build time; and an empty diff over a corpus with no matching case says nothing about whether the harness can see a change.

**Fix.** Put the probe in `CaptureModel` (m2) so both predicates are functions of `(data, secret)`; the old one is `old_set.include?(secret)` exactly, as game.rb:1284. Load the old file from the merge base the branch started from, named in the build log. Run the diff over the corpus plus `scenarios/test_secret_leaks/`, where it must list exactly the intended rows; that proves the harness sees a change.

### m5. The opened-state pickups will mostly be refusals unless the test seeds their preconditions

**Section:** 6a Tests, opened state, pickups through `POST inventory`.

**Evidence.** The route (games_controller.rb:1018-1060) validates through `validate_item_collectible`: an NPC's item needs `source_npc_id` and an encountered NPC; a desktop item needs `source_pc_id` with a session; a share item needs `source_resource_id`. `filter_container_contents` drops items already held (games_controller.rb, after 2152), so order also decides where an item is scanned.

**Fix.** Seed `encounteredNPCs` with every NPC id; pass `source_npc_id` for `itemsHeld`, `source_pc_id` (with the session seeded) for desktop items and `source_resource_id` for share items; fetch every container before the pickups. A refusal still needs a reason line.

### m6. Name the mechanism for the mutation stubs

**Section:** 6a, mutation tests.

**Evidence.** The test suite has no mocha (test_helper.rb). Minitest's `stub` works on `Game.strip_lock_answers!`, a class method. `filter_requires_and_contents_recursive` (Game, private instance), the controller's `filter_requires_recursive` and `render_login_desktop` are instance methods called inside the request, which `stub` cannot reach. Both filters also strip locked contents, NPC keys and grant contents, so mutation (b) fails on many paths.

**Fix.** Override each instance method on its class for the test (save with `instance_method`, `define_method` a version that returns its argument unchanged, restore in `ensure`). Mutation (b) asserts that a PIN door's `requires` path is among the failures, not that it is the only one.

### m7. The Rails scan renders once, so random PINs can flake it

**Section:** 6a Tests; step 3 item 3.

**Evidence.** Game creation renders the template once, unseeded. sis01_healthcare's three PINs (scenario.json.erb:124-127) and lab_tesseract_trials' PINs and tokens can equal a four-digit leaf under `minigameData`, where M1's step 3 class applies, on some runs and not others.

**Fix.** The scan calls `srand(1)` before each game creation and `srand(Random.new_seed)` after, so every run sees the same values. Add a fixture: a `rand` PIN that equals a leaf only under another seed gives no finding.

### m8. The scan needs a reviewed exceptions list from the start

**Section:** 6a Tests; section 6 q85.

**Evidence.** m08's `suite_code` global (scenario.json.erb:117) fails the value check in the bootstrap until q85 is answered; the validator lists it, the scan has no equivalent. The 15 legacy unlocked PCs in ceo_exfil and crypto1 to crypto4 ship `"requires": "password"` today, because the filter removes `requires` only when a `lockType` is present (games_controller.rb:1930-1932), and 6a's fail-closed rule for an untyped object `requires` fails them in the fresh state.

**Fix.** An exceptions list in the test file (scenario, route, path, reason, the `VALIDATOR_DECISIONS.md` heading that approves it), with the same merge-batch sign-off as the known-failures list. Expected first entries: m08 pending q85, and the 15 PCs until their owners delete the inert field (step 3 warns). Say that both are fresh-state findings and neither starts 6b.

### m9. The decisions file proves a heading exists, not that this entry was approved

**Section:** step 1, the known-failures list; step 3 item 5, "Counted and reviewed".

**Evidence.** The node test checks that `approved` names some heading in `docs/agents/VALIDATOR_DECISIONS.md`. A new entry can reuse any existing heading, so "an added entry or a raised `count` therefore needs an edit to the decisions file" (plan line 143) is not true; only the merge-batch diff catches it. Acknowledged-clue markers have no `approved` field at all, and rely on a grep of the diff, though a marker turns a leak error into a note just as an entry does.

**Fix.** Under each heading, the orchestrator lists the entries it approves (`scenario`, `stage`, `match`, `count`); the node test checks that each entry appears, with its count, under the heading it names. Give each `acknowledgedClues` entry an `approved` field (it never ships, step 3 deletes the key from the bootstrap) and check it the same way in a node test over the rendered corpus. Keep the batch diff and grep as the second line.

### m10. Construct the binding after seeding

**Section:** step 3 item 3; step 5 item 1.

**Evidence.** `@random_pin` is drawn with `rand` in `ScenarioBinding#initialize` (mission.rb:338-341). Seeding "around the call to `render`" covers it only if `render` builds the binding itself.

**Fix.** State that `ScenarioBinding.render` constructs the binding inside the call, and the validator calls `srand` immediately before it.

### m11. 6a is not S+, and its run time is not stated

**Section:** section 1 table; 6a; section 5 item 8.

**Evidence.** 6a now holds the schema marks, the walker's use, two states over 176 scenarios, sessions per admitted account, footholds, outages, pickups, feed seeding (M2), six route families, leaf-to-source mapping, an identity check (M2), an exceptions list (m8) and three mutation tests. Each scenario creates a game and makes dozens to hundreds of requests (m10 has the most containers). Builders do not run full suites under the test lock rule, and the plan does not say whether this file is in the default `bin/rails test`.

**Fix.** Split 6a into 6a-1 (marks, top-level declared test, fresh-state scan with the four leaf classes) and 6a-2 (opened state, identity check, feed seeding, mutation tests), each M. Record the scan's run time in the build log; if it exceeds about two minutes, tag it out of the default suite and have the orchestrator run it at each merge batch.

## Nits

- **n1.** Section 5: build/unlock-gaps-r1 is now at 45168aba0, 17 ahead of main (the plan has 8456ae01c, 13), and `lock_answer_matches?` is at game.rb:2684 there, not "about 2655". The table is regenerated per batch, so this needs only a refresh.
- **n2.** Step 3 item 3: lab_tesseract_trials puts the player's envelope in pigeonhole `kh_hole = rand(2..5)` (scenario.json.erb:92-101), so a leak whose leaf position depends on a random draw matches at different paths under the two seeds and is not reported. Say this is a known limit of path-based matching.

## Is the plan buildable in steps of sensible size?

Yes, once 6a is split (m11). Steps 1 (M+, mechanical but wide: about 280 label sites, 48 test files), 2 (S), 4 (M) and 5 (S) are well bounded. Step 3 is M and stays M with m1 to m4, which are sentences, not new work.

**Riskiest step: step 3.** It is the only step that changes live server behaviour on main: the comparator every combination and cryptex unlock goes through (m1), two answer sets read by four consumers (m2, m3), and which capture secrets and account passwords are served. Its safeguards are the existing unlock tests, the predicate diff (m4) and the live run on `test_secret_leaks`. 6a is the step most likely to overrun its size.

## Does any step still break something?

- **Unlocks.** Rewriting `lock_answer_matches?` as specified breaks no unlock that works today (every combination and cryptex test that asserts an opening still opens), but it adds openings for blank and malformed answers (m1). With m1's fix the comparator is unchanged for every case in unlock-gaps-r1's tests.
- **Saved games and sync size.** Unchanged: steps 1 to 6a add nothing to player_state, step 3 deletes one bootstrap key, 3b stays one bounded delta per declared global. The scan's seeding writes only to test games.
- **CI.** With M1 fixed, 6a no longer fails m01 and the other clue scenarios on the first run.
