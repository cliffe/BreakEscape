# OPS_CRACKING_PLAN.md: round 1 adversarial review

Plan under review: `docs/achitechture/OPS_CRACKING_PLAN.md` (357 lines, stage S7, feature A21).
Standard: `docs/agents/OPS_LAYER_BRIEF.md` sections 2, 3, 5, 7, 8.
Grades: blocker, major, minor, nit. Findings are grouped by check, with the blockers each check depends on first.

Code pointers are to this worktree on 2026-11-19. Short names: `CM` = `lib/break_escape/credential_model.rb`, `CK` = `app/models/break_escape/credential_keyring.rb`, `VS` = `scripts/validate_scenario.rb`, `SCH` = `scripts/scenario-schema.json`, `GAME` = `app/models/break_escape/game.rb`, `CLUES` = `lib/break_escape/npc_habits/clues.rb`.

## Summary

| Grade | Count |
|---|---|
| Blocker | 4 |
| Major | 9 |
| Minor | 8 |
| Nit | 3 |

The plan's server decision rests on two things that are not true in the code: `passwordPattern` does not hold fact ids (B1), and the facts the server is asked to check are written by the browser (B2). The grant path it names cannot serve a cracked password (B3), and the JSON example in section 4 fails the schema, the validator and the runtime readers (B4). Sections 5, 6, 8 and 9 need rewriting around those four before the smaller findings matter.

Not verified by running code: that `BreakEscape::NpcHabits::Clues` autoloads in a booted server (M1 is from reading the engine's autoload path and the file layout).

---

## Check 3. The `password` habit (blockers first, because the rest depends on them)

### B1 (blocker). `passwordPattern` is one object id, not a list of fact ids. The "guessable" decision has no data to read.
- Plan: section 2 lines 68-69, section 4 lines 137-140 ("`passwordPattern` naming the fact ids its pattern needs (the same `factId`s that drive `se_intel_<factId>`)"), section 5 step 3 line 152-153, section 6 step 5 lines 187-189, section 9 lines 249-250.
- Code: `SCH:4422` `passwordPattern` is `type: string`, "The object that gives the pattern for a guessable password". `lib/break_escape/npc_habits.rb:55-57` `valid_parameter?` accepts one non-empty string. `CLUES:407-425` `find_object` resolves it to a room object or profile item; `CLUES:432-445` `backing(npc, scenario, texts, pattern_id)` uses it as the id of the readable clue. Nothing in the habit, the NPC or `social.intelFacts` links a password to fact ids. `SCH:4420` also describes `password` as "A claim the validator checks ... No run-time effect".
- Effect: steps 5 of the route, `missingCount`, the "dead puzzle" validator warning and the graph edge "hash record + required facts" all read a list that does not exist. "S7 adds no new habit field" (plan line 139) cannot hold.
- Fix: add an authored list, and say where. The natural home is the hash record, not the habit: `"crackFacts": ["pet_name", "birth_year"]` on the `kind: "hash"` entry (server-only already, capped by the registry). Validator: each id is a `social.intelFacts` key; the account's habit is `guessable`; warn when the list is empty. Keep `passwordPattern` as it is. Update the `SCH:4420` description ("No run-time effect") in the same change. Decide and state whether the server also checks the listed facts against `Clues.backing` pieces (it need not: the validator already proves a guessable password is backed).

### B2 (blocker). "The player holds fact X" is a browser claim. A tampered client sets every `se_intel_*` true and the server grants a real password.
- Plan: section 6 step 3 lines 182-183 and step 5; section 7 line 212; brief section 3 ("the server hard-enforces secrets, keys, credentials").
- Code: `public/break_escape/js/systems/social-intel.js:8` writes `se_intel_<id> = true` through the client global writer and syncs. `GAME:3066` `SERVER_OWNED_GLOBAL_NAMES = %w[se_captures]`, so `merge_global_variables!` (`GAME:~935-963`) stores any `se_intel_*` the client sends. D3:334 records the same ("The server does not check `se_intel_*` writes").
- Effect: the crack grants a credential, the one class the policy says is hard-enforced, on a gate the player can forge with one `PUT /sync_state`. The plan never says this, so a real choice was made silently.
- Fix, one of: (a) a server-owned record of earned facts for the facts a hash names (the server stamps a fact when it serves the content that grants it; needs each granting path to have a server step, which may be a large change and belongs to whoever owns intel); (b) declare the fact gate best-effort with a sanity check, and say what the sanity check is; (c) gate guessable cracks on server-proven items instead of facts (a held item or opened file per piece, using the existing `held` proof). This is the user's call: move it to section 15 with a recommendation. The plan's "a guessable password is already validator-proven readable in the world" is the argument for (b); say it if that is the pick.

### M1 (major). `clues.rb` is described in its own header as authoring-only and has never been loaded by the server; the plan asserts it is "plain requirable Ruby" without a load check, and uses the wrong functions.
- Plan: section 2 lines 75-76, section 5 step 3.
- Code: `CLUES:9-13` "Authoring time only ... never by the server". No file under `app/` or `lib/` references `Clues` (only `scripts/generate_dungeon_graph.rb:26` by `require_relative`). The engine autoloads `lib/` (`lib/break_escape/engine.rb:14`) and the constant path matches the file path, so it should autoload, but `CLUES:3-5` does three `require_relative ... unless defined?` on files Zeitwerk also manages; that pattern is used elsewhere (`CM:4-5`) so it is probably safe. It is unproven under `eager_load` (production).
- What it returns: `backing` needs `texts` from `readable_texts(scenario, scenario_dir)` (`CLUES:83`), which walks the whole scenario and, with a directory, ink files. The server holds `scenario_data`, not a scenario directory, and a whole-scenario text walk per `POST /crack` is wasted work. `reuse_homes(npc, scenario)` (`CLUES:516-521`) returns hashes that carry `:secret` (the plain password) and compares `creds.password` to locks, landing-page captures and other accounts (`CLUES:323-353`).
- NPC without the habit: `habits.password` is nil. The plan covers this only at validation (line 248). The runtime must fail closed for an old or hand-edited game row; the plan does not say what `POST /crack` answers.
- Fix: do not call `backing` at runtime at all (after B1 the server needs only `habits.password`, the hash's fact list and `creds.password`). For `reused`, call `reuse_homes` or a direct equality (see M6). Add a boot test under `eager_load` that references the constant, and edit the `CLUES:9-13` header. State the runtime answer for a missing or unknown habit (treat as `strong`, or `no_hash`), and for an account with no `creds.password`.

---

## Check 1. Keyring fit

### B3 (blocker). The grant path named in the plan cannot serve a cracked password, and the "grant marker in an existing captured-accounts structure" does not exist in a usable form.
- Plan: section 6 lines 197-204, section 8 lines 235-238, section 14 lines 328-330.
- Code: `CK:266-287` builds implicit entries only from `account_capture_usernames` and `capture_secrets_for_client`. Both read `player_state['seCaptures']` and require a declared capture target id and `capture_revealable?` evidence (`network_access.rb:1754-1776`). The password itself is attached only when `reveal_capture_secret?` is true, that is `social.captures.revealSecret == true` (`GAME:2512-2516`, `:2548`), and only for accounts with a capture route or a heard share (`GAME:2692-2708`). Writing a crack into `seCaptures` would also make it a row in the capture log's Sign-ins list as a phish (`CK:247-258`).
- Effect: in a scenario without `revealSecret`, or for an account with no capture route, a "cracked" entry carries no password; in any scenario, there is nowhere to write the marker. "One id in an existing captured-accounts structure, not new growing state" is not available.
- Fix: S7 owns a new server-written list, for example `player_state['crackedAccounts']` (npc ids, at most 64, grow-only, never read from a request body, never a sync section), and a new builder beside `implicit_keyring_entries` that reads the password from `npc['creds']['password']` directly. State the size and how it is sent in section 8. State what happens when the same account is both captured and cracked: both builders would emit id `"<npcId>.password"` (`CK:276`), and `keyringGained` and the client key rows by id, so one must win or the cracked id must differ (`"<npcId>.cracked"`).

### B4 (blocker). The section 4 JSON example fails the schema, the validator and both runtime readers.
- `"account": { "npc": "dana" }` (plan line 110): `SCH` credentials entry has `account` as `type: string` with `additionalProperties: false` on the entry (`SCH:281-300`); `VS:7487-7488` errors "account is not an account holder"; `CM:144-148` `account_npc` needs a string, so `CK:319-320` skips the entry and the graph (`generate_dungeon_graph.rb:1629-1630`) drops it. Use `"account": "dana"`.
- `"proof": { "held": { "type": ..., "id": ... } }` (line 112): `CM:62-67` `proof_kind` counts a proof key only when its value is a present string, so this proof is malformed, `VS:7523-7525` errors and `CK:25-35` answers false for ever. Use `"proof": { "held": "dana_hash_file" }`.
- `salted`, `cost`: the entry schema is closed, so both need adding (the plan says so in section 9, fine), and `crackFacts` from B1.
- The plan's section 9 wording "`account.npc` (string, must be an NPC id)" repeats the wrong shape. It must be an account holder (`AccessIdentities.account?`, an NPC with `creds`), not any NPC.

### M2 (major). The `hash_file` content kind with `grants` is a second mechanism for something the keyring already does.
- Plan: section 4 lines 121-135, section 9 lines 244-245, 250-251, section 14 lines 334-336.
- Code: an item carries `"credential": "<credId>"` (`SCH:5158`), the server stamps it on take from its own definition (`GAME:772-773`), a share file is taken through the existing take path (`network_access.rb:1735-1745`), and the `held` proof matches it identity-strict (`CK:42-63`). The validator already checks the cross-reference and that the item is a `text_file` (`VS:7537-7558`).
- Effect: `hash_file` needs new schema, new validator rules, a new grant step on "share opened" (granting on open rather than on take is also a new rule), and a request to N4 to treat unknown content kinds as inert. None is needed. Brief section 2 rule 2 says extend what exists.
- Fix: a hash on a share is `{ "type": "text_file", "id": "dana_hash_file", "name": "backup.creds", "takeable": true, "credential": "dana_hash", "text": "..." }` in the share's `contents`. Drop `hash_file`, `grants`, and the S1/N4 cross-plan request. Say what the file's `text` shows (see M7 on the token).

### M3 (major). Flipping `hash` to built sends it down the connecting-kind row builder, and three validator and client readers are not covered.
- Plan: section 3 step 1 line 89-90 ("it shows in the keyring"), section 9 lines 251-253, section 10 lines 267-271, section 12 (no client keyring file listed).
- Server row: `CK:322-326` has two branches, `password` and everything else; a built `hash` gets `registry_connecting_entry` (`CK:345-383`): `connectsTo` nil, `host` nil, `routes: []`, `sessionHeld`, `remoteBlocked: false`. No `token`, no `salted`. Needs its own branch and its own row shape, stated in section 7.
- Client list: `public/break_escape/js/minigames/capture-log/signin-rows.js:184` `if (!CONNECTING_KINDS.includes(e.kind)) continue;` drops a hash row from the Sign-ins list, so "it shows in the keyring" and the "Crack affordance on a held hash record" (plan line 165) need new code there and a row design. `public/break_escape/js/systems/keyring.js:774` `FIND_KINDS` has no `hash`, so there is no find toast.
- Client, good news: `keyring.js:752-771` `screenEntries` returns false for an unknown kind, so a hash never appears in a sign-in picker; `credential_login.rb:180-181` refuses a kind that is not connecting, so it cannot sign in. The plan's `connects: false` claim holds for sign-in.
- Validator: `VS:7398` lets a policy list `accepts: ["hash"]` because it only checks `KINDS.key?`; refuse or warn. `VS:7490-7503` does not refuse `connectsTo` on a hash (only on a password); refuse it. `VS:7606-7607` skips the "accepted by no machine" warning for a non-password, non-connecting kind, which is right, but say so.
- `VS:7469` error text "is not supported until phase 3" and the `CM:20,26` comments need updating.
- Graph: `generate_dungeon_graph.rb:1626-1634` will draw a built hash as a key node labelled "<name> hash" with no outgoing edge. The plan's new edges (section 9 lines 255-258) must start from that node, not add a second one.
- Section 10's "flipping only adds an accepted kind" is true for scenarios (none uses `hash`), but `test/unit/credential_model_test.rb` and `test/models/break_escape/credential_keyring_test.rb` are likely to assert `hash` is unbuilt; list them as tests to change.

### M4 (major). The cracked password entry will be mis-drawn by the client, and the leak scanner will not see it.
- Plan: section 6 lines 202-204 (`source: "cracked"`), section 7 lines 214-215.
- Code: `keyring.js:55` maps any password whose source is not `capture` to the tag `in_file`; `keyring.js:344-348` `foundVisible` then hides it until `entry.foundIn` was opened (a cracked entry has no `foundIn`, so it shows only if it was in the first answer after load); `keyring.js:458` `findWaiting` treats it as a found file waiting to be opened; `signin-rows.js:171-181` adds it to the account row as `in_file` with `row.password = e`. `tools/playtest/lib/access_leak_scanner.rb:1268-1275` checks only `source == 'registry'` entries, so a cracked password served early would not be flagged.
- Fix: list `keyring.js`, `signin-rows.js`, `remote-host-text.js` (kind wording) and the scanner in section 12; add a `cracked` tag and source wording; add a scanner rule ("a `cracked` entry is present only when the server's cracked list holds the account"). Decide whether the sign-in picker offers a cracked password the way it offers a captured one (the plan's live proof at line 291-292 assumes it does).

---

## Check 2. Secrecy

### M5 (major). The first response tells the browser the habit, and `missingCount` is an oracle for which facts matter.
- Plan: section 6 steps 4-5 lines 184-189, section 7 lines 219-222 ("Never reaches the browser: the `password` habit, `passwordPattern`, or any fact id the player does not hold").
- Habit leak: a strong account answers `nomatch`; a guessable one with facts missing answers `needMoreFacts`; a reused one answers `nomatch` to a `facts` candidate. One run with an empty candidate separates guessable from the other two. Section 7 says the habit never reaches the browser, and open question 4 recommends telling the player a hash is strong, so sections 6, 7 and 15 disagree with each other. Pick one and make all three match (recommended: the habit class is not a secret; say so in section 7).
- Which test is applied is ambiguous: step 5 says "candidate matches iff the **held** facts cover `passwordPattern`" and `missingCount` is "the count of pattern facts not yet **held**". On that wording the submitted candidate is ignored and the player only presses Crack. If instead the submitted facts are compared, a player submits each held fact alone and watches `missingCount` change, learning exactly which held facts are in the pattern in at most N free runs (a guessable unsalted run has no cost: the run count only moves at step 4 or step 7). Either way "how many, not which" does not hold for held facts.
- Fix: state the comparison on the submitted set. Decide whether surplus facts are allowed (if "covers" allows a superset, selecting every held fact always wins and the assembly is not a puzzle; if an exact set is required, say what a surplus fact returns). Count every run, including guessable failures, so probing has the same cost as a strong run. Then describe honestly in section 7 what the count reveals.

### M6 (major). `reuseFrom` is undefined against the code, and the reused branch needs no client hint at all.
- Plan: section 6 lines 173-175, 183, 190-191.
- Code: `reuse_homes` (`CLUES:516-521`, homes at `:323-353`) returns door and object password locks, landing-page captures and other accounts. A lock or a landing page has no keyring credential id. Implicit ids contain a dot (`CK:276`), outside `CM:40` `ID_PATTERN`, so the param's allowed shape is not the registry's. Registry `password` entries carry no value on the server row (`CK:330-343`), so "resolves to the same source secret" needs a lookup the plan does not describe.
- Simpler and safer: for a `reused` account the server needs no candidate. It checks whether any password the player has provably earned (served capture secrets, cracked accounts, registry passwords whose proof holds, resolved to their account's `creds.password`) equals this account's password. The client sends only `hashId`. That removes a param, a refusal reason and a probing surface. If the plan keeps `reuseFrom` as a player choice for teaching, define the id space, the resolution and what a wrong pick costs.
- Also say what a reused crack adds in play: a player who holds the other account's password can already type it at this account's sign-in.

### M7 (major). Where the hash token is shown, and what is in it, is not pinned down; section 5 and section 8 disagree on storing it.
- Plan: section 4 lines 103-104, section 5 lines 146-148 ("memoised in server state"), section 7 lines 210-211, section 8 (lists only `crackRuns`).
- A token "minted from `account.npc` + a per-scenario salt" is deterministic, so memoising it adds state for nothing; section 8 does not list that state. "A per-scenario salt" has no named source (no scenario field, no existing helper cited; a grep for a server seeded-roll helper in `app/models/break_escape` and `lib/break_escape` found none, the seeded rolls the plan cites at line 81 are client side).
- The token must not be a function of the password that a client could invert or compare offline, and must not be derivable from data the browser holds (npc id plus a salt the bootstrap ships would let a client mint tokens for accounts it has not earned, harmless, but say it). The plan should state: input is server-only (game seed or `secret_key_base` derived, plus hash id), output length and alphabet, and that it carries no information.
- One real teaching point is lost: two unsalted hashes of the same reused password should show the **same** token, and salted ones different tokens. That is the visible meaning of salt, and it needs the token to depend on the password for unsalted records (through a keyed digest, so nothing is invertible). Worth a line in section 1 or an open question.
- With M2's `text_file`, say whether the file's authored `text` shows the token (it cannot: authors do not paste it) or the scene alone shows it.

### m1 (minor). Route hardening is asserted, not specified.
- Plan section 6. Missing: the row lock around the read-increment-grant (`with_lock`, as `CK:76` does), so two parallel posts cannot double count or double grant; a cap and type check on `facts` (array of at most N strings matching an id pattern, body size); the answer for `hashId` of a hash already cracked (should be an idempotent `cracked`, no new run); `Cache-Control: no-store` as `games#keyring` sets (`games_controller.rb:1879`); refusal status codes (the plan says `200` for results but gives none for `no_hash`, `fact_not_held`, `no_reuse`).
- `fact_not_held` tells a prober which ids are real facts only if unknown ids answer differently; say both answer the same.

### m2 (minor). Replay is not idempotent, in the player's favour.
- Plan section 6 step 7. Each replayed `POST /crack` with a right candidate adds a run, so a script sends `cost` posts at once. D5b:164 records the house rule "every delta is safe to repeat". The gate hides no secret, so this is tolerable only if the plan says the salt gate is best-effort; otherwise use a server-timed gate (see M8).

---

## Check 4. State

### M8 (major). `crackRuns` is described as synced state on the `sync_state` path; it must be server-owned and never accepted from the client.
- Plan: section 8 lines 228-233.
- Code: access records (footholds, sessions, `seCaptures`, `credentialClock`) are not sync sections; the server writes them in its own routes (D5b:177; `CK:99-102` "server-written only ... never read from a client body and never sent"). `PUT /sync_state` takes client-written sections.
- Effect: as worded, a client could write `crackRuns` and skip the salt gate; and "the server ... emits only the changed key" on `sync_state` is not how that route works. The response to `POST /crack` already returns `runs`.
- Fix: `player_state['crackRuns']` is written only inside `games#crack` under the row lock, is not a sync section, is never in the bootstrap as a `saved*` block unless the scene needs it on reload (then serve the count through the keyring hash row, which also covers reload). State that. Bound: keys are limited to registry ids of kind `hash` (drop a key for an id no longer in the registry); cap the integer (stop counting at `cost` for salted, at the "infeasible" threshold for strong) so it cannot grow.
- Farming and reset: the player cannot reset a count (no client write), which is right. A count never needs to fall. State both.
- Add the two new lists (`crackRuns`, cracked accounts from B3) to the growth table reference in `SYNC_DELTAS_PLAN.md` section 8 when built.

---

## Check 5. Determinism and gameplay

### M9 (major). "Salted needs more runs" is repeated clicking, and the premise for rejecting time is wrong.
- Plan: section 1 lines 35-37, section 6 step 7, open question 2.
- In play: with the right candidate the player presses Crack `cost` times. Nothing changes between presses, nothing is risked, and (m2) a script does it instantly. It does not show that salt defeats precomputed or shared work; it shows a progress counter.
- Premise: open question 2 says no server clock exists. No game-minute clock exists (D4 3.3), but the server already times credentials in real minutes: `server_now` (`npc_frustration.rb:60`), `credentialClock` and token expiry (`CK:97-137`, `CM:32-33`). A salted crack could be a server-stamped start plus a wait of N seconds (the player goes and does something else, the scene shows a running bar, the keyring row shows "cracking"), which is the outline's "salted hashes cost more game time" (outline line 118) in the only clock the server has. The brief's contract line on game time (section 5) asks for this to be an open question; it is, but with the best option missing.
- Better salt mechanics to offer the user: (a) server-timed wait as above; (b) batch contrast: unsalted hashes of one dump crack together in one run and identical tokens are visible (M7), salted ones must be run one by one; (c) the plan's run count. Recommend (a) or (b); (c) only as a fallback.
- Strong hashes: section 6 step 4 implements a silent `nomatch`, open question 4 recommends a distinct `infeasible` status. As drafted the player can sink unlimited runs with no signal, which is not fair signposting. Whatever the user picks, the scene needs an in-fiction line after a small fixed number of runs, and the text must come from the scenario or scene strings, not engine prose spoken by an NPC.

### m3 (minor). The candidate assembly reuses `slotGuess`, which needs the word, which the browser must not have.
- Plan: section 2 line 54, section 5 lines 160-161.
- Code: `password-guesser-model.js:101-104` `slotGuess(slot)` fills `slot.template` with `slot.word`, both authored config shipped to the browser. In the cracker the pieces of the real password must not ship before the grant, so the rows can show fact labels only ("pet's name", "a year"), never the assembled string. Say that, and drop `slotGuess` from the reuse list; `textFor` and the CSS row classes are the reusable parts. After `cracked`, the assembled password can be shown from the keyring answer.

### m4 (minor). Launch points are unspecified.
- Plan line 164-166: "from the keyring entry ... or from an inventory tool item". Neither exists: the keyring list has no hash row (M3), and no cracking tool item type is defined in section 4 or the schema. Pick one for S7 (opening the held hash file is the cheapest: the `text_file` open path already exists) and move the other to a later stage or an open question.

---

## Check 6. Existing scenarios and lint

### Confirmed
- The awareness lint pins the guesser's config shape: `scripts/validate_social/awareness.rb:1296-1298` (`guess_config_checks`), and `scripts/validate_social/exercises.rb:16,81` lists `password-guesser` as an exercise scene and routes its config to the same checks. The plan's reason for building beside the guesser stands.
- `ops-cracker` collides with nothing: `public/break_escape/js/minigames/index.js` registers `password-guesser` at `:210` and no scene with `crack` in its name; the other `crack` hits in JS are RFID and PIN internals.
- `SocialOverlayScene` exists (`public/break_escape/js/minigames/framework/social-overlay.js:33`).

### m5 (minor). Harness copy lists are named but not listed.
- Plan line 283-284. Tests that copy the guesser modules by path: `test/js/exercise-station.test.mjs:31`, `test/js/social-password-guesser.test.mjs`, `test/js/social-password-guesser-spray.test.mjs`. If `ops-cracker` imports from `password-guesser-model.js`, or `index.js` gains a static import of the new scene, every harness that copies `minigames/index.js` or the guesser needs the new files. Name the files in section 12, and prefer no import from the guesser model (m3 removes the main reason).

### m6 (minor). The "unchanged" proof in section 10 is one assertion short.
- Byte-identical bootstrap for `test_simple_success` proves nothing about a scenario that declares `credentials`. Add: `GET /keyring` for `test_access_networks` (or whichever fixture declares a registry) is unchanged, and the validator output for every scenario under `scenarios/` is unchanged (diff of a full validator run before and after), since the flip touches `check_credentials`.

---

## Check 7. Template, stages, log rows, cross-plan, open questions

### m7 (minor). Build steps are not each testable as the plan claims.
- Section 3 says step 1 is shippable ("a scenario can hold a hash with no way to crack it"). After M2 the share path needs no step of its own, so step 2 reduces to the S5a dump. Restate as: (1) kind, schema, validator, keyring row, graph node, with a test that a held file lists the hash row; (2) route, state, grant, scene; (3) S5a dump source when S5a lands. Give each a named test.
- Section 11 has no test for: a forged `crackRuns` in `sync_state` being ignored, a forged `se_intel_*` (whatever B2 decides), parallel posts, a hash whose account lost its habit, the captured-and-cracked id clash, and the token being stable and uninformative.
- Section 12 omits the docs the brief requires on landing (`README_scenario_design.md` feature index, `docs/ACCESS_AND_NETWORKS.md`) and the client keyring files (M3, M4).

### m8 (minor). Log rows table.
- `hash_obtained` "on grant of the hash record": a held proof has no grant moment on the server except the take; name the hook (the take route that stamps `credential`, or first listing in `stamp_keyring_gained!`, `CK:~210-232`).
- `crack_run` "each `POST /crack`, with status": this writes a row per press, and with M9's run counts that is `cost` rows per hash plus every probe. Ask S9 for the row cap, or log first run and outcome only.
- "Who: player identity" for all three: an offline crack is the one action the organisation cannot see. A log row that feeds the in-game log-filter minigame (outline lines 131-133) would show defenders something they could not observe. Mark `crack_run` and `crack_yield` as server audit only (not in-fiction rows), or drop them; `hash_obtained` from a share read is observable and can stay. Put this to S9.

### Cross-plan requests
- S5a: reasonable, but the proposed new proof form `{ dumped: { host, npc } }` has an object value, which `CM:62-67` cannot parse (same fault as B4), and `PROOF_KINDS` is shared with the validator and graph. Ask instead for a string-valued proof or reuse `session`/`foothold` plus an access-level check owned by S5a. Until S5a answers, the dump source is out of S7's testable scope; say so in section 11 ("when S5a lands" is already there).
- A15/S5b: the request to "confirm the captured-accounts structure" asks another plan to supply a structure that does not exist (B3). S7 should own its list and tell S5b its name.
- S1/N4: drop (M2).
- S3: fine.
- Missing request: whoever owns intel facts, for B2.

### Open questions that were decided silently
- B2: whether a credential grant may rest on client-claimed facts (cheat policy).
- M5: whether the habit class is visible to the player, and whether probing with single facts is acceptable.
- M9: salt as a timed wait on the server's real clock versus a run count; the option is absent from question 2.
- m8: whether offline cracking writes rows the defender-facing log can show.
- Whether the recovered password is shown to the player as text (needed to type it at a sign-in) or only usable from the picker; ties to `revealSecret` semantics (B3).
- Open question 1's recommendation (use the reserved kind) is sound and matches brief section 5; keep it, but its "reuses the registry, cap and proofs" should note the row builder and client list work in M3.

### Template completeness
All 15 sections are present. Section 2 marks claims "verified" that were not read (the body of `check_credentials`, share admission, schema edit points, by the author's own account); B1, B3 and B4 come from that. Section 6 has no refusal status codes. Section 8 misses two pieces of state (token memo, cracked marker). Section 9 has no schema edit for the habit description or for `crackFacts`.

### Nits
- n1. Plan line 58 quotes `PROOF_KINDS (:36)` and `MAX_ENTRIES (:39)` correctly; line 60 cites the bootstrap strip "per D1:132" at second hand. Cite the code.
- n2. Plan line 252 "no pass-the-hash" is a real technique name in a plan that says it names none (line 6-7). Use "a hash cannot be used to sign in".
- n3. Plan line 12 and elsewhere use em dashes where commas would do; the folder name `achitechture` is the repo's spelling, leave it.
