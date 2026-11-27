# D5: conventions a new engine feature plan must follow

Status: PARTIAL digest (first pass). Covers the process rules (AGENTS.md), the 9.3b plan and build log, the player-state sync audit and delta plan (opening sections), and the README feature index. Not yet read, so sections 4 to 7 are incomplete and marked "not yet read". A handover note for the remaining reads is at `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/bc8b6f79-e0e1-476c-ad36-a02de2f8d343/scratchpad/D5_handover.md`.

Pointers are `file:line` in the worktree `docs/achitechture/` unless a path is given. Plan claims about code are the plan's own statements (the plan says it checked them on `build/9-3b-plan`); this digest did not re-verify them against code.

## 1. Slice plan template (ACCESS_MODEL_SLICE_9_3B_PLAN.md)

Header: status line and base branch (`ACCESS_MODEL_SLICE_9_3B_PLAN.md:3-8`). It says the plan is standalone, so a builder need not read earlier plans or reviews (:5-6).

Section list, with the intent of each (:17-23):

| # | Section (line) | Must contain |
|---|---|---|
| 1 | What this slice adds, and why (:25) | The pieces, and the two design rules (:53-62): a must-not-skip step ends in a server check; a captured secret is a key only through the server's password check |
| 2 | What the code does today (verified) (:68-91) | Table: area, today's behaviour, file and method. Each row names the method to extend |
| 3 | Sub-slices in build order (:93-111) | Letter, what it adds, "ends playable when", feature beats. Notes the letter scheme avoids earlier slices' letters (:95-97) |
| 4 | Scenario fields (:113-237) | One worked JSON example (:118-166), then one subsection per field group, with validator rules |
| 5 | Engine behaviour (:239-568) | Model (shared), server runtime, view, client, per sub-slice; 5.6 determinism (:564-568) |
| 6 | Server routes (:570-601) | Table per route: parameters, checks in order, writes and answer; "Locked" means in `with_game_lock` (:574-575) |
| 7 | What reaches the browser, and what never does (:603-625) | Table: path, sent, withheld; a no-exposure test list (:617-625) |
| 8 | State and saved games (:627-646) | New `player_state` keys (none, :629-633), reload, old games |
| 9 | Validator, schema, dungeon graph (:648-732) | Un-reserving per sub-slice (:652-670); errors, warnings, information lines (:674-715); graph (:717-724); tests (:726-732) |
| 10 | Effect on existing scenarios (:734-764) | Table of each change and its effect when unused; which scenarios to rerun (:762-764) |
| 11 | Tests, with the feature scenario (:766-805) | Beat table (N1 to N12, :779-792); unit, Rails and node tests per sub-slice (:794-805) |
| 12 | Build steps and shared files (:807-840) | Streams and owned files (:816-822); shared files and sequence (:829-837); the phone reopen check (:811-814) |
| 13 | Open questions (:842-876) | Each with a recommended answer, which the plan is written to; "the user can overrule" (:844-845) |

Conventions visible in the template:
- Each reserved or future field is listed in one place, and each sub-slice removes only its own reservation (`:655-661`).
- Every route row names its checks in order, its status codes (404 unknown, 403 unreachable, 422 player-caused refusal), and whether it is locked (`:572-575`).
- The no-exposure list is written as concrete cases (`:617-625`).
- Shared files get a sequence and an owner (`:829-837`), and builders "re-read the file just before editing, edit only its own block, never reformat, and commit with explicit paths" (`:824-826`).
- Feature beats are numbered (N1 to N12, `:779-792`) and each beat states its server record afterwards.

## 2. Lessons from the 9.3b build log and reviews

Source: `ACCESS_MODEL_SLICE_9_3B_BUILD_LOG.md` (sections K :7, I :130, W :298, P :461, O :618).

- **Review findings that a plan should design for, by sub-slice:**
  - K, m3: an open share on a linked network was reachable from a bare session with no pivot. The plan said a linked network needs a pivot, but the code's session branch did not enforce it. Fix and two tests (`:101-115`). Design lesson: state the rule for each reach path (foothold, session, open share, ACL share) separately.
  - K, m1: the bridging host tie-break needed a session creation order. There is no stored `seq`, so an insertion-order proxy was used, and the reason is given (`:94-98`). Lesson: say where a tie-break key comes from, and whether adding a state field would break exact-hash tests.
  - I, M1: `syncInventoryFromServer` could drop a tray item whose pickup save was still in flight. Fix: reconcile only the touched ids (`:207-216`). Lesson: inventory echoes and client reconciliation must name the touched item ids (links to the P2 delta rule in section 3 below).
  - I, R2 M1: a lost response then a retry returned `already` without the consumed device id, so the tray was not reconciled (`:258-272`). Lesson: every idempotent "already" answer must carry the same fields as the first success.
  - W, M1: three access-point and note objects sat outside the room's east wall (x=11 against column 9). They were moved to interior tiles (`:383-390`). Lesson: a plan's object positions need a reachability check (the playtest or a tile check), not only a validator run. The validator passed the scenario with the objects unreachable.
  - W, minor: a server-authored name reached the unescaped `params.title` HTML sink. The fix passes a constant title and escapes the real name in the join header (`:438-445`). The shared sink in `base-minigame.js` is pre-existing and was logged to `docs/IDEAS_BACKLOG.md` (`:447-451`). Lesson: author or server text in any title is plain text.
  - W, N9: a first join through the second access point also fired the "join again" beat, so the event now carries `already` and the mapping is gated on it (`:401-406`). Lesson: an event that two beats share needs a field that tells them apart.
  - P, R1 minors: toast text was rendered as HTML. The `toast()` wrapper now passes `plainText: true` (`:541-545`). Lesson: all toasts go through one wrapper.
  - O, MAJ-1: the docstring overstated tamper resistance. The outage global is client-syncable (plan 5.2), so an outage is a soft gate. The guarantee is that clearing it reaches nothing without a server-held foothold and a password (`:715-724`). Lesson: a plan must say which globals are client-writable before it claims a gate is enforced.
  - O, deferred: the host-level "not responding" display (`offWhen` on a sign-in host) was not built and is tracked in `docs/IDEAS_BACKLOG.md` (`:707-711`, `:732-733`). The plan's section 5.2 specifies it (plan `:365-395`), so the plan and the build diverged here.
- **Repeated gaps in the logs:**
  - The dungeon graph was deferred in K, W, I and O alike (`:78-80`, `:200-202`, `:369-371`, `:705-706`). The plan's section 9.3 (`ACCESS_MODEL_SLICE_9_3B_PLAN.md:717-724`) was never built. Lesson for a planner: say which tool outputs are in scope for each sub-slice, or they slip.
  - Dungeon graph tests named in the plan (`dungeon-graph-networks.test.mjs`) were not written (`:369-371`).
  - O's log ends with `bin/test-js` "see the handover" and no count (`:701`), and "Review rounds not yet done" (`:738`).
  - The same shared-symbol lists conflicted on every merge of `main` (`games_controller.rb` before/around_action lists, `:243-249`, `:275-279`, `:429-431`). Lesson: a new route or action adds to shared lists, so expect a conflict.
- **Process patterns the logs show:**
  - Each sub-slice ran on its own branch from `main`, with a merge of `main` at each landing, and a live browser proof through the real client path (`window.__test.interact`, not direct helpers, `:411-416`).
  - Each log section lists tests with counts, the leak scanner result, and a keyless server port (`:63-74`, `:184-192`).
  - The shared-lock test suite ran `bin/rails test` and `bin/test-js -j 3` (`:85-86`, `:194-196`, `:293-296`).
- **Plan-level open questions that the build then answered** (section 13, `ACCESS_MODEL_SLICE_9_3B_PLAN.md:842-876`): outages keep sessions (q4); refuse-only port security (q5); eight-path cap (q6); Wi-Fi and implants are permanent (q7); sign-out of a pivot ends onward sessions (q8). The log records each as "taken as recommended" (`:10-13`, `:625-626`).

## 3. State: player_state, the delta rule, saved games, bootstrap

Sources: `PLAYER_STATE_SYNC_AUDIT.md`, `SYNC_DELTAS_PLAN.md` (opening sections only).

- **The rule.** "Player state synced between client and server must not grow so that data is constantly sent back and forth. Anything that has to live in player state changes as a delta or stays bounded" (`PLAYER_STATE_SYNC_AUDIT.md:3-5`). The delta plan repeats it as "the rule (user, 2026-11-12)" (`SYNC_DELTAS_PLAN.md:12-17`).
- **Three classes** for an audit: Fine (bounded by the authored scenario, or sent only as a delta or on load), Risk (bounded but sent whole on each change or reload), Problem (grows with play and is sent whole on ordinary requests) (`PLAYER_STATE_SYNC_AUDIT.md:10-14`).
- **Client to server.** `public/break_escape/js/state-sync.js` syncs every 30 s and on `pagehide` (`PLAYER_STATE_SYNC_AUDIT.md:19-21`). The diff has three granularities (`:22-32`):
  - keyed sections, diffed per top-level key (`KEYED_SECTIONS`, `state-sync.js:13`): `globalVariables`, `npcVisibility`, `npcHostility`, `triggeredEvents`, `npcInkVariables`, `mailState`. A changed key goes up whole;
  - whole sections (`WHOLE_SECTIONS`, `state-sync.js:24`): `commandBoardLog`, `biometricSamples`, `playerHealth`;
  - others: `notes` by id, `phoneState` per contact, `currentRoom`, `scenarioBriefShown`, the clock and timed messages (`:28-32`).
- **The first sync after load sends everything.** `this.confirmed` starts empty and nothing seeds it from the bootstrap (`PLAYER_STATE_SYNC_AUDIT.md:33-35`, comment at `state-sync.js:107-109`). The delta plan's R1 fixes this by seeding it from the bootstrap's `saved*` blocks (`SYNC_DELTAS_PLAN.md:301-375`).
- **The server.** `GamesController#sync_state` (`games_controller.rb:776`) loads one narrow row (`SYNC_STATE_COLUMNS`), merges, saves only on change, and answers `{ success }` (plus `notSaved`, `mailTrimmed`). It never returns player state (`PLAYER_STATE_SYNC_AUDIT.md:36-40`).
- **Access and office-life records are not sync sections.** They are written by the server's own routes. They reach `sync_state` only as `globalVariables` keys the client writes, and as `notes` (`:41-44`).
- **Server to client** (`:47-59`): the bootstrap `GET /scenario` (`games_controller.rb:278-415`) returns the saved blocks once per load; `POST /network/*` and `POST /inventory` answer the whole inventory (`:57-58`).
- **Bootstrap step.** `GET /scenario` is not in `with_game_lock` (`SYNC_DELTAS_PLAN.md:270-274`). A new `Game#prepare_bootstrap_state!` repairs under a lock only when needed (`:277-290`).
- **Delta rules that a new field must meet** (`SYNC_DELTAS_PLAN.md`):
  - Any stored string or object is compared in a stable key order, so the seed matches the reordered `jsonb` (`:56-69`, `stableJson`).
  - **The client exports what the server stores**, for every keyed section the server rewrites (`:81-88`).
  - Code points, not UTF-16 units, for every length limit (`:89-103`); byte limits use UTF-8 size (`:99-100`).
  - Named limit constants on both sides, with the client keeping the server's names (`:201-222`).
  - Sync parts: `registerPart(name, { build, onAnswer, pendingCount, flushKeep })` for a new kind of write (`:242-256`). `syncConfirmed()` before any capture reads it (`:236-240`).
  - Items in answers pass through `Game#item_for_answer`, which strips `saved_cards` (`:262-266`).
  - Pre-parse body caps (`refuse_oversized_body`, `:292-299`).
- **Sizes and classes for the access records** (`PLAYER_STATE_SYNC_AUDIT.md:78-103`, a table of measured bounds) and the classes in section 3 of the audit (`:109-210`). `footholds` and `gainedFootholds` are Fine, with the inventory echo on network routes a Problem (`:182-196`).
- **Problems and risks and their fixes** (`PLAYER_STATE_SYNC_AUDIT.md:267-274`):
  - P1 cloner `saved_cards` (whole list on each save). Fix: one card per request.
  - P2 inventory echo on `POST /inventory` and `POST /network/*`. Fix: `{ added, removed }` deltas, the whole inventory only on load.
  - P3 `/friendface_phone` answer carries every revealed post (`:219-224`).
  - R1 first sync after load. R2 `se_captures` whole map. R3 `__capture_log_seen` whole list.
- **New feature records under the rule** (`PLAYER_STATE_SYNC_AUDIT.md:252-263`, section 4.5): a server-owned record beside `feedRevealed`, bounded by authoring, with a delta answer of the one new item, and never a growing client global.
- **Saved games.** Plan 9.3b adds no top-level `player_state` keys. New footholds go in the existing `footholds` map, and a game from before the slice reads every new reader as empty (`ACCESS_MODEL_SLICE_9_3B_PLAN.md:629-633`). Games created before the slice have no `networks` and every new route answers 404 or an empty list (`:645-646`). A reset drops the footholds (`:633`).
- **Global keys become saved-game keys.** Plan open question 3 notes the foothold ids and `via` names "become saved-game keys" (`:855-857`).
- **Not yet read:** `SYNC_DELTAS_PLAN.md` sections 3 to 11 (the detail of R1, P2, P1, R2, R3, the build order at `:1550`, the shared tests at `:1614`, the live proof at `:1657`, and section 11 "How to keep state deltas" at `:1750`). Also `SYNC_DELTAS_BUILD_LOG.md` (1556 lines, not opened).

## 4. Scenario format rules

Partly read. Sources read: `README_scenario_design.md:73-77`, `:1004-1040`, `:1041-1044`, `:1120`.

- **Closed blocks.** The schema closes the access, network and office-life blocks: `networks` and `wifi`, `resources`, `policies`, `accountProfiles`, `roles`, every access list (`access`, `for`), NPC `creds`, `habits`, `frustration`, `needs`, `workarounds`, `feed`, object `affordance`, and every `grant_foothold` action wherever it sits (`README_scenario_design.md:73`). An unknown key there is an error, with a "did you mean" hint (`:73`). Elsewhere (rooms, objects, NPCs) an unknown key is a warning (`:73`, and `:77`).
- **Note keys.** A key starting with `_` inside a closed block always passes and is not checked (`:73`). A map (`networks`, `resources`, and so on) holds only ids, so a `_comment` directly under it is an error (`:73`). A note never reaches the browser, so a secret in one stays on the server but "does not belong there" (`:73`). A `_` key in free data is not a note (`:73`).
- **Three kinds of node** (`:75`): a map key is an id (`additionalProperties` schema or `"x-id-map": true`); `"x-free-data": true` holds free data; anything else is structure, where `_` means a note. Every new open node must carry exactly one mark, and `test/unit/scenario_schema_test.rb` enforces it (`:75`). Decided by `BreakEscape::ScenarioSchema` (`:73`).
- **Naming of ids.** The feature index uses IDs A1 to A17 (access) and N1 to N12 (networks) at `README_scenario_design.md:1008-1040`. These are doc IDs, not field names. The plan's sub-slice letters (K, O, W, P, I) are a different scheme (`ACCESS_MODEL_SLICE_9_3B_PLAN.md:95-97`). Lab, demo and test scenarios use the `test_access_networks` folder for feature beats (plan `:775-777`).
- **Inconsistency to check.** The feature index lists network outages as `networks.<id>.offWhen` (`README_scenario_design.md:1034`), and the 9.3b plan uses `networks.<id>.downIf` (`ACCESS_MODEL_SLICE_9_3B_PLAN.md:182`, `:652-653`). Also the README lists N9 as port security and N8 as Wi-Fi, where the plan calls them W and P (`README:1035-1036` against plan `:101-104`). Status of each in the schema is unconfirmed (not yet read: `scripts/scenario-schema.json`).
- **Reserved fields.** Field reservations sit in `scripts/validate_network.rb` (:15 to :72) and stubs in `scripts/scenario-schema.json` (:209, :220, :5288), per the plan's own statement (`ACCESS_MODEL_SLICE_9_3B_PLAN.md:86`). Not checked by this digest.
- **Field declaration.** A field the engine reads must be declared in `scripts/scenario-schema.json` "with a short description naming its reader" before a scenario uses it (`README_scenario_design.md:77`).
- **Format versions.** A template must never set `formatVersion`. The server stamps it at creation (`README_scenario_design.md:101`).
- **Not yet read:** `lib/break_escape/scenario_schema.rb`, `schema_walk.rb`, `format_upgrade.rb`, `scenario_binding.rb`, `author_notes.rb`, `docs/achitechture/SCENARIO_JSON_FORMAT_AUDIT.md`, `SCENARIO_FORMAT_REVIEW_ACCESS.md`. The schema "server-only" stripping (`filtered_scenario_for_bootstrap`, plan `:611`) is stated in the plan but not verified.

## 5. Validator, schema and dungeon graph

Partly read, from `README_scenario_design.md` and the plan.

- **Entry point and exit.** `ruby scripts/validate_scenario.rb <file>` (`README_scenario_design.md:20-37`). Three phases: ERB render, schema check, common checks (`:70-102`). Exit 1 on any `❌` line not in the known list (`:56-62`, `:110-112`).
- **Output shape.** `❌ ERROR:` lines are hard errors, `⚠️` warnings never fail (`:58`). Last line `Result: <n> errors (<k> known), <m> warnings` (`:62`).
- **Known failures.** `scripts/validator_known_failures.json` holds the `❌` lines another track owns. Each entry has `scenario`, `stage`, `match`, `count`, `owner`, `added`, `reviewBy`, `approved`. `approved` must point to a dated heading in `docs/agents/VALIDATOR_DECISIONS.md` (`:66`). Adding or raising an entry needs a sign-off there. `test/js/validator-known-failures.test.mjs` checks this (`:66`). AGENTS.md repeats it (`AGENTS.md:200`).
- **Recurring-bug checks** (`check_recurring_bugs`, `:102`). Relevant to a new feature: unreachable catches, NPC events before room load, `#set_global` names missing from `globalVariables`, globals set but never read.
- **Office-life checks V1 to V9** are in `scripts/validate_office_life.rb` (`:39-53`), not a feature-plan concern except V5 (`:47`) and V9 (`:52`), the lock and key diff `scripts/lock_key_diff.rb`.
- **Network checks.** `scripts/validate_network.rb` holds the network rules (the plan's 9.2, `ACCESS_MODEL_SLICE_9_3B_PLAN.md:672-709`). The plan's pattern for a new check file is: a check module with its own error, warning and information lines, un-reserved names in one constant list, and hooks from `validate_scenario.rb` (`:652-670`, and `:836-837`).
- **Check files in `scripts/`** (from `ls`): `validate_access_work.rb`, `validate_capture_log.rb`, `validate_network.rb`, `validate_npc_habits.rb`, `validate_npc_needs.rb`, `validate_office_life.rb`, `validate_phone_calls.rb`, `validate_plant_hiding.rb`, `validate_secret_leaks.rb`, `validate_social.rb`, `validate_wearable.rb`, `validator_report.rb`, plus `validator_known_failures.json`. Their wiring into `validate_scenario.rb` (9,138 lines) is **not yet read**.
- **Dungeon graph.** `scripts/generate_dungeon_graph.rb` (2,415 lines) is **not yet read**. The plan says it gains network link, pivot, Wi-Fi and implant nodes (`ACCESS_MODEL_SLICE_9_3B_PLAN.md:717-724`), and that none of these was built (build log, section 2 above). The validator rewrites `dungeon_graph.*` on every run (`AGENTS.md:245`), so check with `--no-graph` or `--skip-ink`.

## 6. Cheat resistance

Not yet read in full. What this digest has:

- Plan policy: "the server hard-enforces secrets, keys and forged items. Steps whose verdict is computed in the browser stay best effort, with a real server sanity check, and the check must never block the intended route" (`SYNC_DELTAS_PLAN.md:33-35`).
- Plan 9.3b rule: "A step that must not be skipped ends in something the server checks" (`ACCESS_MODEL_SLICE_9_3B_PLAN.md:55-59`). Anything "the browser merely claims (a global, a capture entry) can pace a puzzle ... and can never be the only thing between the player and a secret" (`:57-59`).
- The server re-judges reach "from its own session record, never from a client-sent foothold" (`:396-400`). Plan 9.3b section 6 repeats it for scoped requests (`:602-603` region, and `:592`).
- Known gap recorded in the O build log: the outage global is client-syncable, so it is a soft gate, not a boundary (`ACCESS_MODEL_SLICE_9_3B_BUILD_LOG.md:715-724`).
- Not yet read: the written cheat-resistance policy in the docs (grep for "cheat"), and `README_scenario_design.md` lines on "server" beyond the ones above.

## 7. Tests and "done"

- **AGENTS.md rule** (`AGENTS.md:197`): engine changes get node tests (`test/js/`), the Rails suite (`bin/rails test`), the phone reopen check (`node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`), and a browser regression across the affected missions before commit.
- **Train check** (`AGENTS.md:201`): `tools/playtest/train-check.sh <worktree> <outdir> <port>`, verdict line `GREEN`, `RED`, or `PARTIAL`. Covers Rails, rubocop, the opened-state payload scan, `bin/test-js`, the headless boot of three games, and the validator over every scenario.
- **9.3b sub-slice "done"** (`ACCESS_MODEL_SLICE_9_3B_PLAN.md:811-814`): unit tests, node suite, Rails suite, no-password and no-exposure tests, the phone reopen check for client changes, and all earlier runs green.
- **Feature scenario** (`ACCESS_MODEL_SLICE_9_3B_PLAN.md:768-777`): one feature scenario per feature family (`test_access_networks`), extended with beats after each sub-slice. Beats carry "what should happen" and "server record afterwards" (`:779-792`). Scripted runs go through `window.__test` with two checks after each beat (`:769-773`).
- **Leak scanner.** `tools/playtest/lib/access_leak_scanner.rb` (1,816 lines) and the CLI `tools/playtest/access-leak-check.rb`. The build logs report "VERDICT: no leaks found" over captured responses (`ACCESS_MODEL_SLICE_9_3B_BUILD_LOG.md:73-74`, `:192`, `:534`, `:695-696`, `:749`). The scanner exempts a held `network_link` item's own fields (`:334-337`) and its `$.footholds[*].network.name` in `GET /scenario` (`:192`). The plan asks for Wi-Fi-key and new-foothold lines in it (`ACCESS_MODEL_SLICE_9_3B_PLAN.md:819`). Its assertions beyond these are **not yet read**.
- **Keyless server.** Plan and log use a keyless server on the builder's own port, never :3000 (`ACCESS_MODEL_SLICE_9_3B_PLAN.md:772-773`). AGENTS.md: draft playtests on :3001 (`AGENTS.md:187`). Worktrees on :3002 share the dev database (`docs/agents`, memory note only; not verified in repo).
- **Shared database rule.** Never `db:create`, `db:schema:load`, `db:migrate`, `db:reset`, `db:drop` or `db:setup` without the user's say-so (`AGENTS.md:238`). Seeding in standalone BE is fine (`AGENTS.md:238`).
- **Test layout** seen in logs: `test/unit/network_model_test.rb`, `test/controllers/break_escape/network_*_test.rb`, `test/js/validator-network-model.test.mjs`, `test/js/network-links.test.mjs`, `test/js/network-view.test.mjs`, `test/js/password-join-mode.test.mjs`, `test/js/grant-foothold-action.test.mjs` (build log, passim). `bin/test-js` runs node (`:100` lines per `wc`). The JS harness copy-list rule (a new static import needs the file added to each harness copy list, else `ERR_MODULE_NOT_FOUND`) is in the memory note `js-test-harness-copy-list`, not verified in repo.
- **Not yet read:** `docs/achitechture/NEW_FEATURES_TEST_MATRIX.md` (255 lines), `bin/test-js`, `test/controllers/break_escape/` conventions, `tools/playtest/` runner and `verify-run.rb`.
- **Plan-level test rule** (`AGENTS.md:248`): do not leave a test that compares live content with HEAD; test against fixtures.

## 8. Process rules from AGENTS.md that bind a plan and its reviews

- **Round standard** (`AGENTS.md:41`): at least 2 and at most 5 rounds. Stop after round 2 or later once a round finds no blockers or majors. Each round is a fresh reviewer, read-only, tagging blocker, major or minor with file:line (`:37-41`).
- **Cheaper later rounds** (`AGENTS.md:42`): from round 4, or once an Opus round is clean, delta reviews go to Sonnet. A delta touching secret handling, what the server serves or access checks goes to Opus (or `opus48` without CVP). A delta adding a design decision goes to Opus. Plan and design reviews stop at round 5 unless a blocker is open (`:42`).
- **Design-heavy stages** get about five cycles (`:45`). Mechanical stages need only enough rounds to be correct (`:45`).
- **Plan must be self-contained** (`AGENTS.md:75`): every version rewritten as it now stands, with no "changed in R2" text. Review history lives only in the review files.
- **Static checks before handing back** (`AGENTS.md:76`): ink compile, `ruby scripts/validate_scenario.rb`, `python3 scripts/check_door_alignment.py`, and the others listed there.
- **Model choice** (`AGENTS.md:97-106`): Opus for planning, review, design and engine design. Sonnet for well-defined implementation with written acceptance criteria. Haiku for scripted runs, screenshots and retrieval. Set `model` on every Agent call (`:97`).
- **Routing under CVP** (`AGENTS.md:108-116`): on a CVP account `opus48` takes only CTF and VM solve and playtest scripts and social-engineering content. Security and server reviews go to Opus 5.5 or Sonnet first. Without CVP, the VM and technical layer stays on `opus48`. Game builds (engine, UI, mail, sims, office life) go to `opus55` or Sonnet, even for a hacking-themed mission (`:111`).
- **Handovers** (`AGENTS.md:109`, `:127`, `:131-135`): at about 150k tokens a subagent writes a handover note, commits, and reports back. Opus reviewers get more room (`:110`). Every brief for multi-step work carries the handover rule. Each handover has two parts: a full note for the next agent, and a report to the orchestrator of at most 15 lines, with no attack content (`:131-135`).
- **Continuing an agent** (`AGENTS.md:137`): SendMessage only within a few minutes of the last turn. After that, a fresh agent from the note is cheaper once context passes about 60k.
- **Judgement without asking** (`AGENTS.md:139-156`): in an iterative review loop the orchestrator decides design and writing judgements and logs each one with a reason. Engine and server changes, shared minigames, other missions, SecGen, lab sheets, image generation and spend go to the user's approval log (`:156`).
- **Asking the user** (`AGENTS.md:161-177`): write the full context to a pending-decisions file first, then print a short form, then ask with checkbox options or a review page. A plan's open questions take a recommended default (`:152-153`, `:178`).
- **Standing rules that bind a plan** (`AGENTS.md:185-192`): kit is cumulative; renamed NPCs get renamed ids; spoken-line changes cost money (list every spoken line a change touches, `:188`); no printed variables in voiced lines (`:189`); images one at a time (`:190`).
- **Commits** (`AGENTS.md:242`): commit with explicit paths, `git commit -m "..." -- <path>`. Commit in logical groups; commit engine changes before the missions that rely on them (`:247`). Merge `main` into every live branch after each landing (`:249`).
- **Live agents** (`AGENTS.md:237`): a live brief makes its own games with `new-game.rb` in that run and never reuses a game id.
- **Usage limits** (`AGENTS.md:251`): if a limit is near, stop launching agents and write the resume note.
- **Progress reports** (`AGENTS.md:210-232`): report by stage, one block per track, with B/M/m open counts from the latest review.
- **Enforcement hooks** named in AGENTS.md (unverified in this digest): `.claude/hooks/subagent-context-guard.py` (`:109`), `.claude/hooks/agent-routing-reminder.py` (`:43`).

## 9. Unconfirmed or not yet read

- Items 4 to 7 above are partial. Not read: `scenario_schema.rb`, `schema_walk.rb`, `format_upgrade.rb`, `scenario_binding.rb`, `author_notes.rb`, `scripts/validate_scenario.rb` wiring, `scripts/generate_dungeon_graph.rb`, `scripts/validator_known_failures.json`, `NEW_FEATURES_TEST_MATRIX.md`, `SCENARIO_JSON_FORMAT_AUDIT.md`, `SCENARIO_FORMAT_REVIEW_ACCESS.md`, `SYNC_DELTAS_PLAN.md` sections 3 to 11, `SYNC_DELTAS_BUILD_LOG.md`, `tools/playtest/` runner, `bin/test-js`, and the cheat-resistance docs.
- Unconfirmed: whether `offWhen` or `downIf` is the current schema key for network outages (see section 4).
- Unconfirmed: that `docs/ACCESS_AND_NETWORKS.md`, which the README feature index names (`README_scenario_design.md:1006`), exists in this worktree.
- Unconfirmed: the number of `README` lines the brief asked for (1 to 120) was read; the feature index (1004 to 1044) was read.
