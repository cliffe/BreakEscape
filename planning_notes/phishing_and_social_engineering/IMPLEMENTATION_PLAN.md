# Implementation and test plan: social-engineering systems

Status: plan, 2026-10-21. Nothing here is built yet.

This turns the design set in this folder into build phases, tests and work packets. It does not
restate the designs. `designs/00_data_contract.md` is the contract and wins over this file. The
README's "Engine work, consolidated" table is the list of engine items, `SPIKES.md` holds the five
settled engine questions, and `ASSETS.md` holds the art, sound and font rows cited here by id.
The landing-page builder (`designs/07_landing_page_builder.md`) is handled only by a Haiku agent,
and the core plan's author does not open that doc. Phase 5 therefore gives the builder's position,
dependencies, engine items and test files as the README and `00` state them, plus the builder
agent's settled corrections (FIX_BRIEF "Implementation plan settlements"). "Phase 5 detail" is the
builder agent's own section.

Paths are under `public/break_escape/js/` unless they start with `app/`, `scripts/`, `test/`,
`tools/`, `scenarios/` or a dot. Line numbers were read from the working tree on 2026-10-21. Treat
them as pointers and re-read the code before editing, because other agents are editing the same
tree.

## How this plan is run

- **Kind of game.** Phases 1 to 6 build towards a lab game (`lab_social_engineering`, collection
  `lab_games`): education first, browser-only, no VMs, no combat (`"disableAttacks": true`). Put that
  in every writer's and reviewer's prompt (AGENTS.md "Kinds of game"). Phase 7 is the awareness
  product, a separate product line for non-technical staff. Licence to Hack (m01 to m10) gets none of
  these systems. Its only contact with this plan is the regression suite in §2.4.
- **Brief, resume note, log.** Before Phase 0 starts, the orchestrator writes a shared brief for
  this build (suggested `docs/agents/SE_BUILD_BRIEF.md`) that points at this file, `00`, the README
  and the standing rules, plus a build log beside this plan (suggested `SE_BUILD_LOG.md`) for
  decisions and review rounds. It also keeps `docs/agents/RESUME.md` current. This plan creates
  none of them.
- **Loops.** Engine phases (0 to 5) run the mission loop's implementation half: implement, static
  checks, a fresh Opus implementation review, Sonnet bridge checks and playtests, fix, confirm.
  Phase 6 runs the full mission loop: plan, three adversarial review rounds, implement, review,
  playtests, then the design-heavy stages (dialogue, puzzle pacing, room dressing, lighting,
  backgrounds) for about five cycles each. Phase 8 comes last of all.
- **Models** (AGENTS.md "Choosing a model"). Opus orchestrates and does engine work, anything that
  needs judgement, reviews and dialogue. Sonnet takes packets whose scope, rules and acceptance tests
  are written down (most minigame UI, validator lints from a list, pure modules with worked examples
  and named tests), plus every browser playtest. Haiku does searches and mechanical edits. The
  landing-page builder goes to a Haiku agent only, high effort, with model and effort passed
  explicitly (README S). Spawn independent packets together. The saving comes from model choice, not
  from running fewer agents.
- **Phishing content and safeguards.** The lab's templates, replies and the builder model are
  attack-shaped by design, even though they are abstract and invented. If a content safeguard stops
  an agent, check its diff yourself (AGENTS.md "Verifying work"). Then keep that doc out of the
  orchestrator's path and route the packet to the model the README names for it, as the builder
  already is.
- **Static checks before any hand-back.** `node --test` over the touched tests; `bin/rails test` for
  any server change; for a scenario, `ruby scripts/validate_scenario.rb <dir> --strict-social
  --no-graph --skip-ink` (no graph or ink rewrite) plus a separate ink compile in the scratchpad;
  `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<m>/`; inkcheck and loopcheck over a
  state matrix; `python3 scripts/check_door_alignment.py`; `git diff --stat` to prove nothing outside
  scope moved. Agents never run the bare validator on a scenario someone else is editing.
- **Playtests** run on the keyless server on :3001 (`tools/playtest/start-keyless-server.sh`). A game
  is made with `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner
  tools/playtest/new-game.rb <mission>`. That script looks the mission up in the database, so a
  new scenario needs `bin/rails db:seed` on the dev database first. Never touch the user's server on
  :3000. A run counts only once `BREAK_ESCAPE_STANDALONE=true bin/rails runner
  tools/playtest/verify-run.rb <game_id>` reports progress on the server. Both scripts are Rails
  runner scripts. Below they are written as `new-game.rb` and `verify-run.rb` for short. After P0-N
  (Phase 0 item 0.11), `verify-run.rb` also lists `objectivesState` tasks, so one-room scenarios
  and task gates can be proved with it.
- **Playtest models.** Every playtest is Sonnet, except the builder's (P5-T), which is Haiku, by the
  user's rule that builder details go to Haiku only.
- **Commits.** The orchestrator commits at the end of each design-implement-review iteration (user,
  2026-10-21: standing authority for this build). Engine first, then the
  scenarios that rely on it, one commit per logical group. Run the node and Rails suites before
  every engine commit. No attribution lines.
- **Shared tree.** No `git stash`, `checkout --` or `reset`. Compare with `git show HEAD:<path>`.
  Every parallel agent gets its own scratch folder under the session scratchpad
  (`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/<session>/scratchpad/se-<packet>/`),
  with the full path in its prompt.

## 1. Phases

The order follows the README "Build order within the systems". Phase 0's shared items land
before any minigame, because they touch every shipped mission and must clear the m01 to m08
regression suite on their own, before new UI hides the cause of a failure.

| Phase | What | Docs | Depends on | Lead model | Gate (summary; full test in the phase) |
|-------|------|------|------------|------------|-----------------------------------------|
| 0 | Engine groundwork: ink fallbacks, shared writer and `syncConfirmed`, influence service and tags, headless records, validator `--strict-social`, CI, Source Sans 3, return-to, playtest tooling | `00` S1–S3, S5, S7, S8, S11, S12; README engine table | nothing | Opus | Node suite green apart from named quarantines; Rails suite green; m01–m08 regression checks (§2.4) hold |
| 1a | Thin slice: mail client, rules engine, intel board, Hampshire only, in `scenarios/test_social_slice` | `01`, `04`, `03`; `00` S9, S14 (fixed terminal) | 0 | Opus (bridge, persistence); Sonnet (UI, pure module) | A Sonnet playtest goes from start to Hampshire landed, through a reload, with `verify-run.rb` listing the task as completed |
| 1b | Mail completion: accounts and Create-account, ink reply jobs and the mail runner, the DOM influence bar, a second (character) test target | `01`, `04`; `00` S4, S6, S8 | 1a | Opus | Pierce-style test target replies from ink, moves influence, and survives a reload |
| 2 | OSINT browser | `02` | 1a (grantFact, board) | Sonnet; Opus review | Slice facts found by browsing instead of stand-ins |
| 3 | Inbox triage; board defender mode | `05`, `03` N4 (defender) | 1a (mail-reader, sent records) | Sonnet (UI, scorer); Opus (sync, then emit) | `playerSent` replay of the slice's own send; triage result survives a reload and completes its task once |
| 4 | Pretext dialogue | `06`; `00` S10, S13 | 0, 1b (bar) | Opus | Dev-style call in a test scenario, all three outcomes, lockout and lift |
| 5 | Landing-page builder | `07` | 0 (jsdom, lint framework, 0.2 shared writer), 1a (board recon mode; the Attach control and attachments), 2 (`02` N1 concept-card renderer). The mail `link` kind (`01` N4) and the send-path victim record and capture call (`01` N6) are built in Phase 5 by P5-G | Haiku only, playtests included | The three named builder tests and `validator-landing-pages` pass; detail in "Phase 5 detail" |
| 6 | Student lab | `10` | 1 to 5 | Opus (plan, ink, review); Sonnet (data entry, playtests) | Critical path playable blind in 60 to 90 minutes |
| 7 | Awareness episodes; Eldritch Hacker gated on its bible | `11` | 3, 4, 5, 6 | Opus | E1 shell plays end to end and completes its task once |
| 8 | Lab sheets, then voice audio | `10` OQ5, README R, Z | 6 (and 7 for its own sheets) | Opus (sheet); Sonnet (audio checks) | Sheet audited against the game files; audio only after sign-off |

Phases 2, 3 and 4 can run side by side once 1a is in, split by file (each owns its own minigame
folder; each validator area has its own lint file, see 0.7). Phase 1b must land before 4, and
Phases 1a and 2 before 5. The lab's triage set (Phase 6) needs both 3 and 5, because its `playerSent` rows read the built
page's domain.

### Phase 0 — Engine groundwork

**Goal.** Land the shared engine changes that every later phase builds on and that reach into the
shipped missions, with no change a player of m01 to m08 can see.

**Already settled by the spikes (`SPIKES.md`), so not re-investigated:**

| Spike | Outcome folded into the plan | Work in this phase |
|-------|------------------------------|--------------------|
| 1 Font | Source Sans 3, unmodified upstream subset files; Atkinson dropped (README X) | Bundle the files (0.8) |
| 2 `_syncOnce` | Returns `undefined` on every path today; boolean result plus `syncConfirmed()` with back-off, capped attempts, 403 final | 0.2 |
| 3 Unlock of a takeable object | Works for a room object with a scenario-unique `id`; no server change | Validator uniqueness lint only (0.7); the terminal itself is Phase 1 |
| 4 Ink externals | Unbound `EXTERNAL` throws story-wide at the first `Continue()`; option (a), fallbacks on, chosen | 0.1 |
| 5 Early task completion | Server accepts and scores it; documented, no server change | Validator aim-key lint (0.7); designs gate through their own globals |

**Items.**

| # | Item | Cites | Files and hook points |
|---|------|-------|-----------------------|
| 0.0 | **Baselines** before any edit. (a) The Node suite under the local Node version (18.19.1 on the dev machine today) with per-file results: today 748 pass and 1 fail, `engine-fixes-round4.test.mjs` failing in the full run with "Unable to deserialize cloned data" while passing on its own. (b) `reopencheck` output. (c) The route drivers `node scripts/ink_runtime_check/m0N_routes/route.js scripts/ink_runtime_check/m0N_routes/<route>.json` for m02 to m08 (m01 has no route folder; for m01, inkcheck on its compiled stories). (d) The m01–m08 browser checks listed in §2.4 R3, run once before the first engine edit, one packet per mission (P0-A1 to P0-A8), so R3 has a browser baseline. Validator, dialoguelint and route-driver output is **not** frozen here: other agents keep editing missions, so each comparison is rebuilt for each commit on identical content (§2.4 R0). Kept in the build log folder, not the scratchpad. Every Phase 0 editing packet waits for P0-A, and the packets that change code the browser loads (P0-C to P0-I, P0-M) also wait for P0-A1 to P0-A8, so the browser baseline never records the new engine (§4) | AGENTS.md "Verifying work" | read-only |
| 0.1 | **Ink externals fall back.** `loadStory` sets `this.story.allowExternalFunctionFallbacks = true` right after the `Story` is built; the ink tools that build their own `Story` get the same flag: `inkcheck.js`, `loopcheck.js` (which also binds a fixed list of six externals, `loopcheck.js:14`, `:33`) and the seven `m0N_routes/route.js` drivers, which build a raw `Story` (for example `m05_routes/route.js:153`). `voicelines.mjs` already sets the flag (`:72`). `reopencheck.mjs` needs no edit: it copies the real `ink-engine.js` (`:27`) and calls `loadStory` (`:59`, `:176`), so it picks up the flag, and it stays a check. The authoring rule changes from "synced `VAR`s, not `EXTERNAL`s" to "an `EXTERNAL` needs an ink fallback function". Lands after spike F2 (§3) | `00` S1; `10` N8 | `systems/ink/ink-engine.js:10-18` (`new inkjs.Story` at 15 and 18); the ink tools named; `README_scenario_design.md:1724` |
| 0.2 | **Shared global writer and confirmed sync.** A new `systems/global-writer.js` (settled; the README and `00` wording that puts it in `apply-actions.js` is updated to match by P0-P) exporting one write function with `emitAlways` and `deferEmit` options and an optional calling-story engine. It writes `gameState.globalVariables`, calls `broadcastGlobalVariableChange`, writes the calling story with the observer detached, and writes a clamped value back to the source story. `applyActions` `set_global` uses it with `emitAlways`. `_syncOnce` returns a boolean, `syncConfirmed({ attempts, onRetry })` is added, and `ApiClient.put` attaches `error.status`. **From spike F1 (P0-B):** the open engine is `window.MinigameFramework.currentMinigame.inkEngine` (check its NPC id, because the phone chat reuses one engine across contacts); write `gameState` first, then the story with its own `variableChangedEvent` detached in a try/finally (restored with `delete` if it had none); and when the writer is given a calling-story engine (a bound external running inside `Continue()`), any read-modify-write takes its base value from that story, because inkjs holds the observer back until `Continue()` ends, so an ink assignment earlier in the same `Continue()` has not yet reached `gameState`. `social-global-writer` tests that case (ink sets 100, then calls the external with +1: expect 101). Choices already on screen are not re-evaluated by a write, so a threshold that unlocks a choice must move the value before the choice point | `00` S3, §13 "Sync then emit", "`applyActions` emit" | `systems/apply-actions.js:33-43`; `systems/npc-conversation-state.js` (`broadcastGlobalVariableChange`, observer, `isGlobalVariable` at 362); `state-sync.js:290-302` (`sync`), `:304-319` (`_syncOnce`); `api-client.js:70-72` |
| 0.3 | **Social influence service and the live tag processor.** New `systems/social-influence.js`: watcher on `<character>_influence`, the `se_influence(delta, reason)` write path, thresholds, latch, band flags with `clearOnRearm`, `recoverTo`, forced `report(character, reason)`, `npc_influence_changed`, and the per-run idempotency ledger. New tag cases in `processGameActionTags` for `#influence:N`, `#influence_gained[:reason]`, `#influence_lost[:reason]` and `#report:<reason>`, **only for characters listed in `social.characters`**. The existing `influence_increased` and `influence_decreased` popup cases and `hostile` stay exactly as they are. The lockout's storage fields are written here, but the channel checks that read them are Phase 4 (S10) | `00` S5, §8, §13 "Band flags", "`recoverTo` rule", "Band numbers"; `06` N9 | new `systems/social-influence.js`; `minigames/helpers/chat-helpers.js:24` (`processGameActionTags`; existing cases at 201, 215, 250, 453, 548); `minigames/phone-chat/phone-chat-conversation.js` (shared loader); `person-chat-conversation.js` is not loaded and is not edited |
| 0.4 | **Run-scoped `email_` variables and loader order.** Exclude the `email_` prefix from saved ink variables; every loader sets engine-written variables after restore and sync | `00` S7 | `systems/npc-conversation-state.js:156-162` (`exportNpcInkVariables`), `:229-255` (`recordInkVariables`); `person-chat-minigame.js:497` (restore), `:532`, `:563` (sync); `phone-chat-minigame.js` |
| 0.5 | **Headless records.** One helper, `scenario_npc_records`, returning room NPCs plus `social.characters.*.emailRecord` records, used everywhere a lookup searches only `rooms.*.npcs`. `game.rb` defines `find_npc_in_scenario` twice (645 and 1281; Ruby keeps the later one), so keep one | `00` S8 | `systems/npc-lazy-loader.js`; `core/game.js` start-room registration; `app/controllers/break_escape/games_controller.rb` `find_npc_in_scenario` (about 1966-1990); `app/models/break_escape/game.rb:645`, `:1281`, `:1817` (`scenario_npc_ids`); `scripts/validate_scenario.rb:676-680` (`ink_files_to_check`), `:2345-2355` (phone checks), the KO check near 1110 and the phone-globals check near 2583 |
| 0.6 | **Display-name ties** prefer the conversation's own NPC | `00` S2 | `systems/npc-manager.js` speaker lookup |
| 0.7 | **Validator social framework and CI.** `social` added to `known_top_level`; a `--strict-social` option beside `--no-graph` and `--skip-ink`; a social-lint entry point (suggested `scripts/validate_social.rb`, required from `validate_scenario.rb`), with one file per area under `scripts/validate_social/` (`mail.rb`, `osint.rb`, `board.rb`, `triage.rb`, `pretext.rb`, `landing.rb`, `lab.rb`), so parallel packets in later phases never edit the same file; each returns issues the tests can call in-process. The generic lints arrive now: declared and not-imported influence, latch, band, lockout and `setGlobal` globals; `EXTERNAL` has a fallback; aim `unlockCondition` keys limited to `aimCompleted`, `aimsCompleted`, `globalVariable`, `equals`; object `id`s unique across rooms; a missing sprite for a social object type is an error under `--strict-social`. The data-only `social.characters` lints from `00` S11 also arrive now, by name: synced variables declared; the `VAR`s in each channel story match the synced list; thresholds ordered; `recoverTo >= A + rearmMargin` (A the highest `at` among `"below"` thresholds with effects); `clearOnRearm` only on boolean targets; a `lockout` effect has an expiry or a route. (The `reports`-threshold rule for characters with call data is P4-F's.) CI: one new job with Ruby (the existing sqlite apt step, `bundler-cache`, `BUNDLE_BUILD__SQLITE3`) and Node 20; `jsdom` added to `devDependencies`; the `package-lock.json` line removed from `.gitignore`, the lockfile regenerated and committed; `npm ci`; `bundle exec node --test test/js/validator-*.test.mjs test/js/social-*.test.mjs`; then **the whole existing `test/js` suite** as regression cover for m01–m08, with each file that fails today quarantined under a named reason in one list in the workflow (first entries: `engine-fixes-round4.test.mjs` and `engine-fixes-pass3.test.mjs`, "fail intermittently in the full run on Node 18 with a structured-clone runner error, pass alone" (P0-A baseline: pass3 failed in 3 of 3 full runs, round4 in 1 of 3); each dropped from the list if it passes in the full run on Node 20); the loop over scenarios with a `social` key; `git diff --exit-code`. `package.json` gains `test:social` | `00` S11, §13 "Validator exit", "CI validator loop"; README Objectives row | `scripts/validate_scenario.rb:247` (`known_top_level`), `:4835`, `:4839` (options), `:1695` (sprite check), `:5128-5136` (exit); `scripts/scenario-schema.json`; `scripts/minigame-data-schemas.json`; `.github/workflows/ci.yml` (existing `lint` job from line 9, `test` job from 29); `.gitignore:43`; `package.json` (`scripts` holds only `test` and `test:js` today) |
| 0.8 | **Source Sans 3.** Regular and Bold, Latin and Cyrillic WOFF2 subset files, unmodified, with `OFL.txt`; `@font-face` rules and a `--se-font-readable` custom property in `css/fonts.css`. All four files are Phase 0 (settled; ASSETS FONT4 and FONT5 move to this tier). Source: the subset WOFF2 files that the Google Fonts CSS API serves (`https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;700`, the `latin` and `cyrillic` `@font-face` blocks), with `OFL.txt` from `github.com/google/fonts` `ofl/sourcesans3/`, the same family SPIKES §1 checked. The packet records each file's URL, SHA-256, the font version from its `name` table and the google/fonts commit, and those records are the comparison for "unmodified". Spike F6 (canvas text) runs in the same packet. **Landed:** two variable-weight files (Latin, Cyrillic) cover all four weight-subset pairs; F6 found that canvas and Phaser text draw the face only if created, or redrawn with `setText`, after `await document.fonts.load('<weight> <size> "Source Sans 3"', <the real string>)`; `document.fonts.ready` alone is not enough, and DOM overlays need nothing (`build_log/P0-L_fonts.md`) | `00` §6; README X; Fonts row | `public/break_escape/assets/fonts/` (today `gnf`, `PressStart2P`, `PixelifySans`, `pixl8` only); `public/break_escape/css/fonts.css` (linked at `app/views/break_escape/games/show.html.erb:16`) |
| 0.9 | **Return-to for nested overlays.** `startMinigame(scene, container, { returnTo, suspended })`; `endMinigame` calls `returnTo` after `onComplete`, on a normal exit only | `00` S12; README Minigame framework row | `minigames/framework/minigame-manager.js:15` (`startMinigame`, which ends the running one at 33), `:151` (`endMinigame`); `minigames/framework/base-minigame.js` |
| 0.10 | **Overlay helper (optional, decided here).** One small helper for the own Close control, capture-phase Esc, `aborted` handling and a `getTestState()` base for the social overlays, so seven overlays do not each re-implement them. A choice, not a contract item: skip it if the first overlay shows the code is too small to share | README Conventions; `00` §6 "Overlay rules" | new `minigames/framework/social-overlay.js`; `base-minigame.js:18-23, 70-80` (`disableClose`), `getTestState` at about 170 |
| 0.11 | **Playtest tooling.** `verify-run.rb` prints only boolean and string globals (`:23`) and counts only rooms beyond the first, unlocked objects and flags as progress (`:42-60`), so a one-room scenario with no locks reads "BOOTSTRAP ONLY" and exits 1 after a perfect run. It gains a section that always **lists** `objectivesState` tasks with their status and completion time. Completed tasks **count toward the verdict** only when the scenario has a top-level `social` key, or when `--tasks` is passed, and every social gate in this plan passes it. The default verdict for other missions is unchanged. That matters because the opening briefings of m04, m05, m06 and m07 complete tasks themselves (`#complete_task` in their opening ink), and today's verdict deliberately ignores anything the opening sets (`:38-46`). Because `complete_task!` stores only a status (`game.rb:1313`), "completed once" is proved from the score: the script prints `tasks_completed` and the game's score, and a gate states the expected values. A second script counts completions in the keyless server log (`tmp/keyless-3001.log`, as `sync-state-regress.js` uses). It counts only `POST` requests to the exact path `/break_escape/games/<id>/objectives/tasks/<task_id>` (`config/routes.rb:39`) that complete with 200, and ignores `PUT` progress updates (`:41`), `/skip` (`:40`) and failed requests the client retried (the retry loop is `objectives-manager.js:513-524`; `:959-960` mark a 5xx as transient). It prints the server start time with the count, because `start-keyless-server.sh` truncates the log on each start. Gates that say "once" mean both checks. **Bridge assertions:** `playtest-session.js` has no assert command (its list at `:13-38`), and it is a skill script that agents do not edit. So in each bridge `.jsonl` file, every assertion is an `eval` line whose expression returns a boolean, preceded by a `waitFor` where timing matters. P0-N adds `tools/playtest/se/check-bridge.mjs`, which reads the session's output and fails on any `eval` result that is not `true`. The agent pastes the checker's summary into its report | AGENTS.md "Verifying work" | `tools/playtest/verify-run.rb`; new `tools/playtest/count-task-posts.sh` and `tools/playtest/se/check-bridge.mjs` |

**Not in this phase, with the reason.** S4 (influence bar) and S6 (mail runner) arrive in 1b, which
has the first character target to drive them. S9 (mail scheduler, `mailState`) and S14 (mail
devices) arrive in 1a with the mail client, their only consumer. S10 (lockout checks) and S13
(world pip) arrive in Phase 4 with the first call.

**Dependencies.** None. Phase 0 must be committed before any phase that builds on it.

**Assets.** FONT1 to FONT5 (upstream files), FONT6 (existing). No art.

**Models.** Opus for 0.1, the writer half of 0.2, 0.3 to 0.6, 0.9 and 0.10: they touch every
mission's dialogue, sync and overlays. Sonnet for the sync half of 0.2 (SPIKES §2 gives the code),
0.7 (the lint list and CI wiring are fully specified), 0.8 and 0.11, each followed by an Opus review.
The packet table in §4 uses the same split.

**Done when.**
- `bundle exec node --test test/js/*.test.mjs` passes apart from the files on the named quarantine
  list, run under Node 18 locally and Node 20 in CI. It includes the new `social-influence`,
  `social-global-writer`, `social-state-sync-confirmed`, `social-ink-fallback`, `social-ink-vars`,
  `social-tag-processor` and `social-return-to` tests (§2.2, Phase 0).
- `npm run test:social` passes and runs the same social files.
- `bin/rails test` passes, including the new headless-record and sync tests.
- `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json` and the
  m02–m08 route drivers match the 0.0 baseline.
- For every scenario, `ruby scripts/validate_scenario.rb scenarios/<s> --no-graph --skip-ink` gives
  the same findings as the HEAD validator run on the same scenario content (§2.4 R0). The only new lines
  allowed come from the two lints that apply to every scenario (aim `unlockCondition` keys, unique
  object ids). Each such line is checked by hand and logged as a real finding or a false positive,
  and a false positive is fixed in the lint, not accepted. `--strict-social` on a scenario with no
  `social` key exits 0. `git status --porcelain` shows no tracked file rewritten.
- The one-off ink load script (§2.3 items 6 and 8) shows no change between flag off and flag on.
- The m01 to m08 regression checks R0 to R4 (§2.4) hold.
- `verify-run.rb --tasks` on the P0-N fixture game (a game on `scenarios/test_objectives`, collection
  `testing`, whose tasks are completed through `complete_task!` by a runner snippet kept in the
  scratchpad) lists its completed tasks and exits 0. `verify-run.rb` on an m05 game where only the
  opening was played still exits 1.
- Back-compat item 7's fixture half passes. Its bridge half needs a slice story that declares
  `se_influence`, which first exists in 1b (P1-O), so it runs in P1-T2.
- The CI job is green on a pushed branch. Pushing is the user's job (see "Needs the user").

### Phase 1 — Thin slice: mail client, rules engine, intel board, one target

**Goal.** The core loop (collect, compose, judge, feedback, reply, record), playable from start to
finish against one target, Chris Hampshire, before any other system exists. Phase 1 is split in two
so the slice stays thin: 1a proves the loop with a data-only target, and 1b adds what a character
target needs (ink replies, influence, a second account).

**The test scenario.** `scenarios/test_social_slice/` (`mission.json`, `scenario.json.erb`, `ink/`),
modelled on `scenarios/lab_tesseract_trials/` for a non-VM layout (`secgen_scenario: null`). Its
`mission.json` sets `"collection": "testing"`, as most existing test scenarios do. When a
`mission.json` is present, `db/seeds.rb:71` takes `collection` from it with `'default'` as the
fallback and infers nothing (inference runs only without a `mission.json`, `seeds.rb:9-23`). Every
seeded mission is published, so the slice lists under "Testing" on the missions index, beside the
other test scenarios, and not among the missions. `bin/rails db:seed` runs on the dev database
before the first playtest, because `new-game.rb` looks the mission up there (`new-game.rb:32-37`).

One room. It holds a `mail_terminal` with `accountIds: ["guest"]`; two seeded benign inbox messages
(`seededMessages`, folder `inbox`, senders using NPC10 avatars), so the inbox is not empty and the
reader has something to show; Hampshire's contact with `targetId: "hampshire"` and `revealedBy:
"se_intel_hampshire_careers"` (the global, `01` "Scenario-authored data"), so the To list offers her once the careers fact is held (`01` §2 and
"Scenario-authored data"); one `case-file` with `{ mode: "recon" }` (texture override
`notice_board1`, OBJ3); a placeholder host NPC whose `eventMappings` complete the tasks; and three
readable stand-in objects whose `triggerOnInteract` grant Hampshire's three facts
(`hampshire_careers`, `hampshire_cv_backlog`, `careers_attachment`; the "provides" table in `00` §1,
lines 185 to 187). The `social` block carries the Hampshire `phishTargets` entry, her two pretext
templates (`pretext_apply`, `pretext_enquiry`), the `from_own` template, the greeting and ask parts,
the `kit_cv` payload and the intel facts, all copied from the contract values in `00` §1, §7 and
§13, with no new content. None of Hampshire's templates has a blank (`04` "What each blank offers":
"hampshire | none | no blanks"; `pretext_apply` has `"slots": []` in `00` §10). So 1a never opens
the blank picker in the browser. The send gate and the picker are proved in Node and jsdom in 1a,
and in the browser in 1b on the Pierce-style target, whose templates have blanks. Tasks:
`ready_hampshire` (on `target_ready_hampshire`) and
`hampshire_landed` (on `phish_hampshire_landed`). The stand-ins go when Phase 2 lands. The scenario
stays afterwards as the fixture for the Phase 1 regression runs.

**Stand-in grants (settled).** A new `grant_fact { fact }` action in `applyActions` calls
`grantFact` and is fired from `triggerOnInteract` (`systems/interactions.js:719`). Phase 4's call
grants and the awareness runner use it too. P0-P adds it to the `00` §12 and README engine tables.
`triggerOnInteract` runs `applyActions` and returns before any object text or observations show
(`interactions.js:717-721`), so a stand-in shows nothing of its own. `grant_fact` therefore shows a
short toast ("Noted: <fact label>") beside the note it adds, which keeps the stand-in from looking
dead.

#### 1a. The slice

| Area | Items covered | Files and hook points |
|------|---------------|-----------------------|
| Rules engine | `04` N1 (module and factor library), N2 (slot judge), N7 (data-only reply text), N8 (`senderAuth` derivation), N9 (`tells[]`), N11 (pre-send gate, the runtime half), N12 (open check) | new `systems/phish-rules.js`, pure, `evaluateMessage(target, message, ctx)` per `00` §3 |
| Lints (1a) | `04` N3 (empty-string lint), N11's validator half (no scenario string may replace the pre-send line), N10 for the checks Hampshire exercises (template sets cover all four parts, `subjects` with topics and one unopened topic, `distinctiveValues` provided, outcome owner, declared outcome globals); `01` N18 for accounts, mailboxes, seeded messages, contacts and `mail_terminal.accountIds`; `03` N6 for `readinessSlots` | `scripts/validate_social/mail.rb`, `board.rb` |
| Intel | `02` N2, brought forward: `grantFact` (flip-only, note, sync) and `evaluateReadiness` (`target_ready_<id>`, `osint_done`); the `grant_fact` action | new `systems/social-intel.js`; `systems/apply-actions.js` (new case beside `set_global` at 33); `window.addNote` at `minigames/notes/notes-minigame.js:835` (unique note ids: timestamp plus counter) |
| Mail client | `01` N1 (list, reading pane, Sent folder, composer; no switcher or Create-account yet), N2 (`mailState` persistence; the client writes, meaning drafts on change and before a launch, `metrics` and `phish_<id>_attempts` on each send, belong to P1-F), N3 (Close and `gameResult`), N4 (attachments only; the `link` kind waits for Phase 5), N5 (`mail-reader`, factored out from the start), N6 (judge, sent record, text job; no ink job, no victim record yet), N9 (contacts with `revealedBy`, joined to targets by `targetId`), N10 (template composer, blank picker, send gate), N12 (sent record), N14 (notification), N15 in part (`seededMessages` in the `inbox` folder and the device's `accountIds`; takeable terminals, found mailbox history and `sent`-folder seeds stay deferred), N17 (`onSend` timing and the open-check row) | new `minigames/mail-client/` (`mail-client-minigame.js`, `mail-reader.js`, composer); new `css/mail-client-minigame.css`. The `<link>` in `show.html.erb`, the registration in `minigames/index.js` and the starter in `systems/minigame-starters.js` belong to P1-W, not to the overlay packets |
| Scheduler and `mailState` | `00` S9: text jobs with a wall-clock countdown, jobs change-keyed by ids only; `mailState` as a keyed section with its `pagehide` place; server sanitiser, caps and bootstrap | new `systems/mail-scheduler.js` ticked from the NPC manager loop (`systems/npc-manager.js:1557`; `_checkTimedMessages` at 1572 is the model); `state-sync.js:13` (`KEYED_SECTIONS`), `:107` (`buildPlayerSections`), `:218-227` (the `timedMessages` id-only key, the model), `:259` (`confirm`), `:328` (`flush`); `games_controller.rb:356` (bootstrap, `savedPhoneState` is the model for `savedMailState`), `:1403` (`merge_last_write_wins_sections`), `:1426` (the `phoneState` merge call); `game.rb:1902-1913` (phone caps and `merge_phone_state!`, the model for `merge_mail_state!` and `MAX_MAIL_STATE_BYTES`); `core/game.js` restore |
| Mail device | `00` S14, fixed terminal only: `mail_terminal` added to `PICKUP_THEN_INTERACT_TYPES`; its branch placed after the generic lock check, beside the phone branch, so a locked terminal asks to be unlocked; the pickup block refuses to auto-open a `locked` takeable item | `systems/interactions.js:776-784` (the set and pickup block), `:1340` (lock check), `:1355` (phone branch) |
| Intel board | `03` N1 (people cards, contacts strip, company panel, readiness checklist; no "From the call" section or influence bar yet), N2 (rebuild from globals on open), N3 (show readiness), N5 (Close as a normal exit, return-to); N6 for `readinessSlots` | new `minigames/intel-board/`; new `css/intel-board-minigame.css`; `case-file` branch in `systems/interactions.js`; state in `se_board_state` |
| Wiring, both overlays (P1-W) | Registration of `mail-client` and `intel-board` in `minigames/index.js`; both starters in `systems/minigame-starters.js` with `requiresKeyboardInput: true`; the `case-file` and `mail_terminal` branches in `systems/interactions.js` (the mail branch's placement is P1-F's design, P1-W adds the block); both CSS `<link>`s in `show.html.erb`; the `minigame-data-schemas.json` entries; the placeholder sprite copies `mail_terminal.png` (from `pc1.png`) and `case-file.png` (from `notice_board1.png`) with their `preload()` lines. Own Close, capture-phase Esc and `getTestState()` overrides stay in each overlay's own packet | `minigames/index.js` (from 147); `systems/minigame-starters.js` (649, 923); `systems/interactions.js`; `app/views/break_escape/games/show.html.erb:16-19`; `core/game.js` `preload()` (from 66; object lines such as `'pc'` at 292); `scripts/minigame-data-schemas.json`; `public/break_escape/assets/objects/`; `minigames/framework/minigame-manager.js:37-45` (keyboard pause) |

**Assets (first-slice rows).** FONT1 to FONT5 (Phase 0); OBJ1 `mail_terminal`, OBJ2 `case-file`,
OBJ3 (reuse `notice_board1`); UI1 to UI7; NPC5 (Hampshire 32x32 headshot); NPC10 (existing avatars
for the seeded benign mail); SFX1 to SFX4; MUS1. Until the user approves each image (one at a time,
PixelLab, made at target size), OBJ1 and OBJ2 start as copies of `pc1.png` and `notice_board1.png`
so the validator's sprite check passes, NPC5 uses an existing avatar, and UI1 to UI7 start as CSS or
text placeholders (theme tokens, Unicode marks always paired with words), so 1a never waits on art.
No image is generated without the user's sign-off.

**Models.** Sonnet for `phish-rules.js` (the factor table, the worked examples and the named test
file are all specified), the board UI and the composer UI. Opus for the mail bridge, the scheduler,
`mailState` persistence (client and server), and the interaction-branch placement. A fresh Opus
reviewer checks the whole slice before the playtest.

**Done when (1a).**
- `bundle exec node --test test/js/social-phish-rules.test.mjs test/js/social-intel.test.mjs
  test/js/social-mail-scheduler.test.mjs test/js/social-mail-state-export.test.mjs
  test/js/social-mail-composer.test.mjs test/js/validator-social-mail.test.mjs` passes, and so does
  the whole `test/js` suite apart from the named quarantines. `social-mail-composer` (jsdom) proves
  the send gate on a fixture template with one blank: no held fact, so Send is disabled with the
  neutral line "A blank needs evidence you haven't found yet", which never names the fact; then the
  fact is granted, the picker offers it, and Send enables.
- `bin/rails test test/models/break_escape/mail_state_test.rb
  test/controllers/break_escape/mail_state_sync_test.rb` passes, and so does the whole suite.
- `ruby scripts/validate_scenario.rb scenarios/test_social_slice --strict-social --no-graph
  --skip-ink` exits 0. A `git status --porcelain` snapshot and SHA-256 hashes of the files under
  `scenarios/`, taken before the run and compared after it, show no change.
- After `bin/rails db:seed`, a Sonnet playtest on :3001 (`new-game.rb test_social_slice`) shows,
  step by step:
  1. Before any fact, the To list does not offer Hampshire. After the careers stand-in only, she
     appears.
  2. After the other two stand-ins, the board shows Hampshire ready and `target_ready_hampshire` is
     true.
  3. A `pretext_enquiry` send shows the full checklist at once, with `pretextRelevant` failing on her
     authored line.
  4. A reload during the 15-second wait still delivers the reply into the `guest` mailbox.
  5. A `pretext_apply` send with `kit_cv` lands.
  6. `verify-run.rb --tasks <id>` (after P0-N) lists `ready_hampshire` and `hampshire_landed` as
     completed and shows `tasks_completed` 2. `count-task-posts.sh` counts one successful completion
     POST per task id.
- The bridge checks for both overlays pass (§2.2, Phase 1a), run with `playtest-session.js` from
  `tools/playtest/se/bridge-1a.jsonl`. P1-T0 writes that script from the §2.2 rows once P1-I and
  P1-W are in, before the UI packets are gated on it.

#### 1b. Mail completion for character targets

| Area | Items covered | Files and hook points |
|------|---------------|-----------------------|
| Mail runner and ink jobs | `00` S6 (headless run, the loader's sync steps in order, fresh idempotency ledger per run), ink jobs on the scheduler; `04` N6 (`EvalResult` to `email_*` ink variables) | new `systems/mail-runner.js`, modelled on `PhoneChatConversation._preloadOpeningOnce` (`minigames/phone-chat/phone-chat-conversation.js:733`); binds `se_influence` before the first `Continue()` (`systems/ink/ink-engine.js:138` `bindExternalFunction`) |
| Influence bar | `00` S4, `01` N7: a DOM bar with threshold icons and the number, mounted in the reading pane and in the board's influence section (both mounts in P1-K) | new `ui/influence-bar.js`; used by `minigames/mail-client/`, `minigames/intel-board/`; later by `person-chat-ui.js` and `phone-chat-ui.js` (Phase 4) |
| Accounts | `01` N11: own-account resolution, `unlockedBy`, `createMenu` and the Create-account panel, switcher, `burned_<id>`, unread per mailbox; contacts of a character target resolving to the Phase 0 headless record | `minigames/mail-client/` |
| Rules extras | `04` N4 (hint stage per target), N5 (`boostIfGlobal`, `strictIfGlobal` applied to a copy of the target), N10 (the remaining checks: `on_email` declares the `email_*` VARs it reads and `VAR <character>_influence`, calls `se_influence` on both branches, `trusts` ids resolve, `dmarcPolicy` present, closed-target template rules) | `systems/phish-rules.js`; mail bridge; `scripts/validate_social/mail.rb` |
| Polish | `01` N13 (narrow layout below 768 px, keyboard order, `aria-live`, reduced motion), N17 `withReply` timing, N18 (the rest) | `minigames/mail-client/`, its CSS |

The test scenario gains a second, character target modelled on the `04` worked example (Pierce),
with test-only ids so it never collides with the lab's `pierce`, and a `freemail` account with a
`createMenu`, so the Hampshire round can be played the lab's way.

**Models.** Opus for the runner and the ink side; Sonnet for accounts, the bar and polish.

**Done when (1b).**
- `social-mail-runner`, `social-influence-bar` and the extended `social-phish-rules` tests pass, as
  does the whole `test/js` suite.
- A story that declares `se_influence` with an ink fallback loads in the phone preload, the bark path
  and a dry run (`social-ink-fallback` fixture test, §2.3 item 7).
- Playtest on :3001: create `freemail`, land Hampshire from it. Before the facts the character
  target's blanks need are held, Send is blocked with the neutral pre-send line, which never names
  the fact. Its blanks (`from_named`, `greet_named`, `pretext_sheet` in the Pierce pattern) offer only
  held facts. Then send a failing message and a landing one; the reply comes from its `on_email`
  knot, the bar moves by the authored delta with its reason, and both values survive a reload.
  `verify-run.rb --tasks` lists both landed tasks as completed, and `count-task-posts.sh` counts one
  successful completion POST for each.
- The picker and pre-send rows of `tools/playtest/se/bridge-1b.jsonl` pass: the picker opens by
  keyboard, arrow keys move through its listbox, Esc closes the picker before the overlay, and the
  disabled Send says why.

### Phase 2 — OSINT browser

**Goal.** Replace the slice's stand-ins with the browser that teaches where each fact is found:
company site, social profiles, a document's properties and picked lookups.

**Items.** `02` N1 (overlay, sites strip, display-only address bar, page renderer, selectable blocks,
profile-level `showIf`, shared concept-card renderer, own Close, `requiresKeyboardInput`), N3
(document properties with selectable fields), N4 (tools panel: picked lookups, `unlockedBy`, decoys,
result blocks), N5 (Close as a normal exit; nested launch to the case file through return-to, Phase
0 item 0.9), N6 (headshot-only cast: a 32x32 headshot per target; the reverse fallback from a
headshot to `_talk` does not exist, `person-chat-portraits.js:913-916` falls back the other way, so
every key ships a headshot), N7 (`--se-font-readable` on every domain, address, handle, file name and
metadata string; authored domains shown raw, bypassing `utils/display-dashes.js`), N8 (validator: one
award path per fact, `unlockedBy` shapes, `card` ids, `se_osint_state` declared, the lint field list
for this block), N9 (address-bar formatter tests). N2 landed in Phase 1a.

**Files.** New `minigames/osint-browser/` and `css/osint-browser-minigame.css`; the
`osint-workstation` branch in `systems/interactions.js`; register and starter as in 1a; preload line
and schema entry; site images under `public/break_escape/assets/osint/<scenario>/`; lints in
`scripts/validate_social/osint.rb`. The shared-file wiring (registration, starter, the
`osint-workstation` branch, CSS link, placeholder sprite copy and preload line, schema entry) is
packet P2-W. The board's "Case file" button and the browser's return use the
Phase 0 return-to.

**Dependencies.** Phase 0 (return-to, fonts, jsdom in CI), Phase 1a (`grantFact`, board).

**Assets.** OBJ7 `osint-workstation`; UI14 (chrome, layouts, profile template), UI15 (properties
panel), UI16 (four favicons); LOGO1 (Ledgerwell) and LOGO3 (friendface) for the company and social
sites; NPC5 to NPC8 headshots; SFX9. Placeholders until each is approved.

**Models.** Sonnet builds it from `02` (layers, worked chain and lints are specified). Opus reviews,
with attention to "model, don't weaponise": the tools panel shows what a lookup's output looks like
and never takes typed input (`10` §6 "What this doc relies on", `02` row).

**Done when.**
- `social-osint-address-bar` (formatter and the `window.location` check under jsdom) and
  `validator-social-osint` pass.
- `test_social_slice` swaps its stand-ins for an `osint` block with the careers page and Hampshire's
  post; the Phase 1a playtest re-runs with facts found by browsing, and the board opens from the
  browser's Case file button and returns to the same page.
- Bridge checks (`tools/playtest/se/bridge-2.jsonl`, the §2.2 Phase 2 row): Space and `E` do
  nothing while the browser is open; Esc inside the properties panel closes the panel first; Close
  completes with `success: true`, so no `minigame_failed` is logged.
- Screenshots of the company, social, document and tools pages at 1280 px and 600 px, with no
  horizontal scroll at 600 px and every domain string in Source Sans 3 (computed `font-family`),
  looked at by the orchestrator (AGENTS.md: "look at the screenshots yourself").

### Phase 3 — Inbox triage and the board's defender mode

**Goal.** The defender mirror: sort a mixed inbox, read the authentication results, and see one's
own earlier phish from the receiving side.

**Items.** `05` N1 (minigame: sort, chip list, review cards, result screen, narrow layout; Verify
verdict built but used only by awareness sets), N2 (the shared `mail-reader`, already factored out
in 1a), N3 (factor library and red-flag strings through the `04` resolution rule), N4
(`triage-scoring.js` and its tests), N5 (validator), N6 (result globals, first-attempt guard, sync
then emit, reopen re-emits), N7 (starter with the `stage` parameter and `answers[].ms`), N8 (both
scoring profiles), N9 (`playerSent` kind). `03` N4 for `defender` mode only (`factMitigations`, the
four defender facts in `00` §13), with N6's defender checks. Phase 3 builds the email kind and
`playerSent` only, because the lab set has no other kind (`05` N5 keeps `call` and `push` to
awareness sets). Every non-email kind (`voicemail`, `sms`, `qr`, `page`, `call`, `push`; `05` N1
and N10, with the `11` N11 to N14 surfaces) and the comparison screen (N11) are awareness work, in
Phase 7.

**Sync, then emit** is the one piece of real engine risk here. The starter writes its four globals
with `deferEmit` (Phase 0 item 0.2), awaits `stateSync.syncConfirmed()`, shows "Saving your
result..." while it retries, and only then emits the changed events and its done event. On a reopen
with the done global set and the `conclusionTaskId` task incomplete, it re-emits.

**Files.** New `minigames/inbox-triage/` (`inbox-triage-minigame.js`, `triage-scoring.js`), new
`css/inbox-triage-minigame.css`; `triage-workstation` branch in `systems/interactions.js`; starter
`startInboxTriageMinigame` modelled on `startSiemMinigame` (`systems/minigame-starters.js:649`);
`minigames/intel-board/` gains defender mode; lints in `scripts/validate_social/triage.rb` and
`board.rb`. The shared-file wiring (registration, starter block, `triage-workstation` branch, CSS
link, placeholder sprite copy and preload line, schema entry) is packet P3-W.

**Dependencies.** Phase 0 (writer, `syncConfirmed`), Phase 1a (`mail-reader`, sent records with
`tells`).

**Assets.** OBJ10 `triage-workstation`; OBJ6 (SOC board override); UI17 to UI20; NPC9 (reuse); SFX5.

**Models.** Sonnet for the scorer (worked example is test case one, 68% analyst and 86% awareness),
the UI and the validator checks. Opus for the starter's sync-then-emit and the reopen path, and for
the review.

**Done when.**
- `social-triage-scoring` passes with the worked example and both profiles; `validator-social-triage`
  passes.
- `test_social_slice` gains a four-message set (three authored, one `playerSent` replaying the
  slice's own Hampshire send) and a defender board with one mitigation pick. A playtest triages it
  and the `playerSent` card shows the message the tester actually sent, with its stored tells.
- The reload test passes: with `triage_done` already on the server and the task incomplete, a
  reopen completes the task once (bridge check; the server log shows one `complete_task` request
  and `verify-run.rb` lists the task as completed). The Rails test in §2.2 covers the server half.
- With `sync_state` blocked (a Playwright script using `page.route`, modelled on
  `tools/playtest/sync-state-regress.js`), the result screen shows "Saving your result..." and no
  task completes until the block is lifted; with a forced 403 the retries stop at once.

### Phase 4 — Pretext dialogue

**Goal.** A pretext call that runs on the character's influence global: prepare lines from held
facts, make the call, watch the bar and the tells, get a debrief, and feed the result back into the
email loop.

**Items.** `06` N1 (`pretext-judge.js`), N2 (`PretextSession` at
`globalVariables['pretext_<callId>_state']`), N3 (bind `pretext_say` and `pretext_ask` in the
session; set the `pretext_*` VARs after restore and sync), N4 (tells panel, render-only phone
bubbles, portrait tint hook; the bar itself is from 1b), N5 (`pretext-prep`), N6 (the template picker
shared with the mail composer), N7 (debrief in the chat overlay), N8 (completion payload and the
per-call `_outcome` and `_lowest` globals), N9 (`pretext_say` and `pretext_ask` routed through the
Phase 0 `se_influence` path), N10 (validator), N12 (no once-only choices in call knots; an authoring
lint). N11 needs no work here (`04` N5 landed in 1b). From `00`: S10 (lockout checks on person-chat,
phone-chat, mail and the `callId` starter, refusal before `pretext-prep` opens, and the lift) and S13
(world influence pip). From `03` N1: the board's "From the call" section (P4-E).

**Where the bar shows (settled).** In the lab the influence bar shows in the chat UI, in the header
of `phone-chat` and `person-chat`, with its number; Dev is phone-only. The world-sprite pip (S13) is
drawn only for characters with walk sprites, which the lab's social characters do not have. So the
pip is built and tested in this phase on a test character with a sprite, for awareness and Eldritch
Hacker, and is not part of the lab (ASSETS UI10). Per-character `influence.display` (README AA) is
read through `resolveInfluenceDisplay` from P1-K on; the lab uses the defaults.

**Files and hook points.**
- New `systems/pretext-judge.js`, `minigames/pretext-prep/`,
  `minigames/person-chat/person-chat-pretext.js` (attaches to both chats when `params.pretextCallId`
  is set).
- `systems/interactions.js`: the `phone` `callId` branch goes **above** the gate at line 1355, which
  admits only a phone with `text`, `voice` or `npcIds`; the lockout check sits in that branch and in
  the NPC sprite branch.
- `minigames/person-chat/person-chat-ui.js`, `minigames/phone-chat/phone-chat-ui.js` (mount the bar
  and tells), `minigames/person-chat/person-chat-portraits.js` (tint hook).
- New `ui/npc-influence-pips.js` modelled on `ui/npc-health-bars.js`, created in `core/game.js`
  beside `window.npcHealthBars` (line 1679) and updated beside line 2164.
- `systems/social-influence.js` (lockout lift, `recoverTo` written silently, band flags cleared).

**Dependencies.** Phase 0 (fallbacks, writer with calling-story writes, influence service), Phase 1b
(bar, template picker).

**Assets.** OBJ11 (existing desk phone), UI8 to UI13, BG3 (or the `m01_it_room` fallback), NPC4 (Dev:
bust, talk, visemes, headshot; a placeholder key until approved), SFX6 to SFX8, MUS3.

**Models.** Opus for all of it except the tells panel and pip drawing, which Sonnet can take once the
session API is fixed. The Dev ink in the test scenario is written by Opus.

**Done when.**
- `social-pretext-judge` passes (the Priya and Dev worked examples in `06` §4.6 and §4.8 are the
  cases); `social-influence` gains the lockout and lift cases; `validator-social-pretext` passes.
- `test_social_slice` gains a Dev-style call (test ids). Three Sonnet runs on :3001: a call that
  grants both asks (`got_it`); a clumsy call that falls to the report threshold, which sets the
  report global and the lockout, after which the desk phone refuses with the toast before
  `pretext-prep` opens; a call left early (`walked_away`), reopened, with only the ungranted ask
  offered. Each run includes a reload mid-call, and the bar and the log come back from the globals
  (and the pip, for the test character that has a sprite).
- The lift: the slice's test character carries a one-minute lockout expiry (test data only). After
  the report, the tester waits past it, rings again, finds the call open, and sees the influence at
  `recoverTo` with the band flags cleared.
- The granted fact appears in the mail composer's blank, and a `strictIfGlobal` on the report global
  makes the character target harder, shown in its checklist.
- Back-compat items 2 to 8 in §2.3 pass again, because this phase touches both chat loaders.

### Phase 5 — Landing-page builder

This outline gives the builder's place in the plan, from the README and `00`, corrected by the
builder agent's settled list. The build detail, from `designs/07`, is in "Phase 5 detail" below,
which wins where the two differ. All builder work, its playtests (P5-T) included, goes to a Haiku
agent at high effort, with model and effort passed explicitly (README S).

**Position.** Last of the systems (README "Build order", item 5: the most new UI for the least
reuse). It can start once Phases 1a and 2 are in and run beside Phases 3 and 4. The lab (Phase 6) needs it
for stage 4 and for the Lord round, and the lab's triage set needs its domain menu for the
`playerSent` rows.

**Dependencies.** Phase 0: the shared writer (0.2), return-to (0.9), Source Sans 3 including the
Cyrillic files (0.8), the `social` lint framework (0.7), and `jsdom`, which Phase 0 owns (P0-K adds
it, with the lockfile). Phase 1a: the board's recon mode, and the mail client's Attach control for
attachments (`01` N4, P1-F). The `link` kind is built with this phase. Phase 2: the shared
concept-card renderer (`02` N1).

**Engine items the README engine table assigns to it** ("Landing page" row, `07` N1 to N11 with
N6b): the builder; the scorer; the DOM/pixel layered renderer, with text in the readable sans-serif;
persisted pages (`se_landing_pages`); pre-Score drafts (`se_landing_drafts[pageId]`, written on every
change and on close); `linkInfoFor`; the validator lint (allowlist plus denylist, with the ASCII check
on the raw JSON text); a runtime guard. Code location: `minigames/` (new); the object type id is
`page-builder`, so its branch in `systems/interactions.js`, its sprite
`assets/objects/page-builder.png`, its `preload()` line and its `minigame-data-schemas.json` entry
all use that id. The `--strict-social` lints are split into `scripts/validate_social/*`, and the
builder's go in `scripts/validate_social/landing.rb`.

**Touch points owned by other docs, to be built alongside it.**
- `01` N4: the `link` kind in the Attach menu, offered only for a target in the page's `targets` map;
  the nested launch of the builder through return-to, with the mail draft saved first; the re-attach
  test reads the page record's `built`.
- `01` N6 and `00` §11a: on every send carrying a page, `describeVictimOutcome`, the best outcome
  kept with `betterVictim`, and the capture note added once through `window.addNote` when
  `captureGranted` says so (`07` N11). No password value is ever stored; the player's input is never
  read (README T).
- `05` N9: `domainFrom: "landing_domain"` on `playerSent` entries and a `playerSentAuth` row for each
  of the six domain ids.
- Settled values in `00` §13: `kit_payroll_page` with `landingPageId: "payroll_login"`;
  `landing_payroll_login_built` and `_domain`; the six domain ids; Attach needs a current Score; the
  victim record; builder targets; captured sign-in; landing verdict; homograph display.
- Brand rules (README S, Y, Z): invented brands only, every host ending `.example`, a `generic` or
  `parody` look, no real product's layout, colours or logo.

**Named test files** (README engine table and `00` S11): `test/js/social-landing-page-model.test.mjs`
(scorer and `betterVictim`), `test/js/social-landing-page-render.test.mjs` (renderer DOM safety, under
jsdom), `test/js/social-landing-page-guard.test.mjs` (runtime guard), plus the validator fixture test
for the brand and host lint, `test/js/validator-landing-pages.test.mjs` (`07`'s name).

**Assets**: OBJ8 `page-builder`, UI22, UI23 (reuse
`public/break_escape/assets/icons/padlock_32.png`), LOGO1, LOGO4, LOGO5, LOGO6 (all lab tier),
FONT4, FONT5 (Phase 0). The full list is in "Phase 5 detail".

**Done when** (outline; the builder agent firms it up): the three named tests and the lint fixture
test pass; the test scenario attaches a scored page to a test target, and the victim record and
capture note appear as `00` §11a says; a forced brand-lint violation in a fixture fails
`--strict-social`.

### Phase 5 detail — to be written by the builder agent

Written from `designs/07` (read in full on 2026-10-21). Where this section and the outline above
disagree, this section wins. The outline's asset line is corrected in "Assets" below.

**Goal.** Build the landing-page builder: a scored, data-only model of a credential-harvest page that
the player assembles, scores, attaches to a mail, and then inspects as the victim. The safety rules in
`07` §1 (no form controls, no network, no export, invented brands, `.example` hosts) are enforced by
tests and by the validator lint, not by convention.

**07 items covered.** N1 to N11, with N6b. The packet that owns each item is in brackets.
- N1 overlay and wiring [P5-D, P5-G]
- N2 pure model, scorer, tells and closed record keys [P5-A]
- N3 two-layer renderer and DOM-safety test [P5-B]
- N4 persisted pages and drafts [P5-F]
- N5 step 6 defender inspection [P5-E]
- N6 offline lint, `--strict-social` and the CI wiring [P5-C; the CI job itself is P0-K]
- N6b runtime guard: model half [P5-A], renderer half [P5-B]
- N7 concept cards: display [P5-D], card-id check [P5-C]
- N8 Source Sans 3 on every authored string [P5-B]
- N9 nested launch, close and keyboard handling [P5-D, P5-G]
- N10 `linkInfoFor`, `describeVictimOutcome`, `betterVictim` [P5-A]
- N11 `captureGranted` [P5-A]. The send-path call that adds the note is part of `01` N6's victim-record
  work. P1-F's 1a scope has no victim record, so no packet owns the call yet (D9).

**Files to create.** Under `public/break_escape/js/minigames/landing-page-builder/` unless stated.
- `landing-page-model.js` (P5-A): pure, with no DOM and no globals.
- `landing-page-render.js` (P5-B).
- `landing-page-builder-minigame.js` (P5-D, P5-E). It extends `MinigameScene`, and it uses
  `minigames/framework/social-overlay.js` only if P0-M built that helper (0.10).
- `public/break_escape/css/landing-page-builder-minigame.css` (P5-D), named as
  `siem-dashboard-minigame.css` is.
- `scripts/validate_social/landing.rb` (P5-C), required from `scripts/validate_scenario.rb` (see D1).
- Tests: `test/js/social-landing-page-model.test.mjs`, `social-landing-page-guard.test.mjs`,
  `social-landing-page-render.test.mjs` (P5-A, P5-B), `social-landing-page-state.test.mjs` (P5-F; the
  name is proposed, since `07` names no test for N4), and `validator-landing-pages.test.mjs` (P5-C).
  Lint fixtures go in `test/js/fixtures/social_landing/`.
- `public/break_escape/assets/objects/page-builder.png` (OBJ8, a user request).

**Files to modify, with hook points.** Checked on 2026-10-21. The tree is shared, so re-read each file
just before editing it.
- `public/break_escape/js/minigames/index.js`: `text-file` is the model. Its export is at :18, its
  import at :104 and `registerScene('text-file', …)` at :160. Add the same three lines for
  `landing-page-builder`.
- `public/break_escape/js/minigames/framework/minigame-manager.js`: `startMinigame` at :15, the
  `requiresKeyboardInput` pause at :37 to :45, the `onComplete` call at :204 to :206 (the close path in
  `07` §6), and `registerScene` at :229. Expected to need no edit. P0-M may have moved these lines, so re-read before relying on them.
- `public/break_escape/js/minigames/framework/base-minigame.js`: `disableClose` at :18 to :23 and :70 to
  :80, and the Esc handler at :72 to :73. Expected to need no edit. The builder passes
  `disableClose: true` and binds its own capture-phase Esc.
- `public/break_escape/js/systems/minigame-starters.js`: `startSiemMinigame` (:649 to :680, which calls
  `startMinigame('siem-dashboard', null, params)` at :679) is the model. Add `startLandingPageBuilder`
  and its `window.` export beside `window.startSiemMinigame` at :923. The starter sets
  `requiresKeyboardInput: true`.
- `public/break_escape/js/systems/interactions.js`: a new `page-builder` branch beside the siem branch
  (`siem_dashboard` at :937 to :967) and the command board branch (`command_board` at :998).
- `public/break_escape/js/core/game.js`: `this.load.image('page-builder', 'objects/page-builder.png')`
  beside the siem preload at :1194.
- `app/views/break_escape/games/show.html.erb`: a stylesheet line after the siem stylesheet at :40.
  `fonts.css` is already linked at :16.
- `public/break_escape/js/state-sync.js`: `KEYED_SECTIONS` at :13 and the `pagehide` listener at :61.
  The shape guard for `se_landing_pages` and `se_landing_drafts` (N4) goes where the record is written
  and synced, which is P5-F's job.
- `minigame-data-schemas.json` (the `page-builder` entry, `{ landingPageId }`, `00` §11) is P5-G.
  `scripts/scenario-schema.json` (`social.landingPages`) is P5-C.
- `public/break_escape/js/minigames/notes/notes-minigame.js:835` (`window.addNote`) is called by `01`'s
  send path, not by the builder. It is listed so the owner of the capture note is clear.
- Read only: `utils/display-dashes.js` (the renderer must not call it), `css/ui-themes.css` (the
  `--ui-*` tokens), `css/fonts.css` (`--se-font-readable`, from P0-L), `core/player.js` (:36 and :95,
  `keyboardPaused`), and `minigames/siem/siem-dashboard-minigame.js` (`STATE_KEY` at :5, read and write at
  :925 and :941, the model for N4).

**Dependencies.**
- Phase 0: the shared writer (0.2, P0-D) for the `landing_<pageId>_built` and `_domain` writes; the
  validator framework and CI (0.7, P0-J and P0-K); Source Sans 3 (0.8, P0-L); return-to (0.9, P0-M).
  The overlay helper (0.10) is optional.
- Phase 1a: the intel board in recon mode (`03` N1 to N3 and N5, P1-G), for the Case file button
  (`07` §6).
- Phase 1a: the mail client's Attach control for attachments (`01` N4, P1-F). The `link` kind is built
  here (see D9).
- Phase 1b: the second test target (P1-O). See D5.
- Phase 2: the card renderer from `02` N1 (P2-A), for N7. See D4.

**Decisions in this section (challenge any of them).**
- D1. The lint lives in `scripts/validate_social/landing.rb`, as P0-J's per-area split requires.
  `07` (§1 and N6) now says so too. The README engine table still names `validate_scenario.rb` for
  the lint, which is outside this section. The split stops parallel packets from editing one file.
- D2. The validator test is `test/js/validator-landing-pages.test.mjs`, which is `07`'s name. The
  outline's earlier suggestion, `validator-social-landing.test.mjs`, is dropped.
- D3. The object type id is `page-builder`, as in `00` §11, `07` §6 and OBJ8. The code's siem and
  command-board branches use an `_` separator (`siem_dashboard`, `command_board`). The new branch compares
  against the hyphenated id.
- D4. N7 cards render through the `02` N1 card renderer. If P2-A has not landed when P5-D runs, P5-D shows
  the card text as plain paragraphs behind the same "?" button, and swaps to the shared renderer when
  P2-A lands. Nothing else waits on it.
- D5. The bridge checks need a target whose required factors include `linkCredible`. If P1-O's second
  target does not have it, P5-G adds a page with a third target to `test_social_slice`. The orchestrator
  decides this at the start of Phase 5.
- D6. LOGO5 and LOGO6 are in Phase 5's asset list. They are Lab-tier rows, and stage 2 offers CloudBoxy as
  a brand choice (`07` §3 step 1 and §7). The outline's "later" was wrong for the lab.
- D7. Builder packets are Haiku at high effort, as the outline and README S say. The bridge packet (P5-T)
  is Haiku too: §1 ("Playtest models") carves the builder out of its Sonnet-for-playtests rule, so
  nothing is open here.
- D8. The N4 shape guard goes into the shared `state-sync.js`. P5-F re-reads the file before editing and
  runs after the Phase 0 sync changes have landed.
- D9. Two `01` touch points in "Touch points owned by other docs" have no packet in §4: the `link` kind
  in the mail Attach menu (`01` N4; P1-F covers only attachments) and the send-path victim record and
  capture call (`01` N6, which uses `betterVictim` and `captureGranted`). Settled: P5-G (Haiku,
  after P5-A). `05` N9 is P3-B's, so it is not in this list.

**Packet split.** Packets A (model) and B (renderer) run first, in parallel with C (lint). D (overlay)
follows A and B. E (step 6) follows D. F (persistence) follows A and runs beside D. G (wiring) follows D
and F. T (bridge checks) follows G, and R (review, Opus) follows T. The rows are in §4.

**Assets (ASSETS.md rows; no generation inside a packet).** Each image is a separate request to the user,
one at a time, as ASSETS.md says.
- OBJ8 `page-builder`: the workstation sprite. Needed by P5-G, and `--strict-social` fails without it.
- UI22: builder chrome (window frame, address bar frame, padlock states, "Not secure" badge, five step
  icons, tell stamp, meter frame). Needed by P5-D and P5-E.
- UI23: the padlock. Reuse `public/break_escape/assets/icons/padlock_32.png`. ASSETS.md gives the path
  without the `assets/` prefix. No request is needed.
- LOGO1 (Ledgerwell, crisp 32x32), LOGO4 (Ledgerwell's generic look for the three page purposes),
  LOGO5 (CloudBoxy, crisp 32x32) and LOGO6 (CloudBoxy's parody look). See D6.
- FONT1 to FONT3 land in Phase 0 (P0-L). FONT4 and FONT5 (Cyrillic) also land in Phase 0, per open
  question 5, and the homograph chip needs them.
- UI24 concept-card images are tier Later and optional (`social.conceptCards[].image?`). They are not a
  Phase 5 gate.
- Audio: none new. The "found it" cue reuses an existing UI click (`07` §8).

**Playtest steps (P5-T, on :3001 with `PLAYTEST_PORT=3001`, scenario `test_social_slice`).**
1. Open the builder from the workstation. The step strip shows five steps. Space and E do nothing while the
   builder is open.
2. Make a choice in each of the seven rows, by keyboard only (Tab, arrows, Space). The preview redraws
   each time.
3. Score the first worked-example choices (Ledgerwell, "Sign in", `ledgerwall`, blurry logo, wording with
   slips, email, password and card number, padlock off). The meter reads 34 and shows the first verdict.
   Change to the second attempt (Ledgerwell, "Payslip ready", `ledgerwell-hr`, crisp logo, matching wording,
   email and password, padlock on). The meter reads 87 and Attach to email appears.
4. Change one choice after a Score. The meter greys, Attach hides, and the stored record reads
   `built: false`.
5. Attach anyway below the threshold. The overlay closes with no `minigame_failed`,
   `landing_payroll_login_built` is true, and `gameResult` carries the `linkInfoFor` fields with
   `saved: true`.
6. Reopen the page, inspect it as the victim and find each tell. Use Show the link target and the padlock
   decoy line. Finish on the five-habits card. Esc and Close at each stage produce no `minigame_failed`.
7. Reload after the draft, after a Score, after the attach, and part-way through step 6. Each restores its
   state.
8. At 600 px the panes stack, every control is at least 44 px, and the steps read as a list with
   `aria-current`.

Each step is recorded as pass or fail. `tools/playtest/verify-run.rb <game_id>` must show progress.

**Done when.**
- The Node tests in §2.2 (Phase 5) pass under `bundle exec node --test test/js/social-landing-page-*.test.mjs
  test/js/validator-landing-pages.test.mjs`, with `CI` set and none skipped.
- `npm run test:social` runs the same files. Their names match the `social-*` and `validator-*` globs.
- `--strict-social --no-graph --skip-ink` exits 1 on the lint fixture with a raw homograph character, and
  exits 0 on the clean fixture.
- Playtest steps 1 to 8 pass on :3001, and `verify-run.rb` shows progress.
- `git diff --stat` touches only the files listed above. The R1 and R2 suites (§2.4) are green.
- P5-R has no blocker or major finding open.

### Phase 6 — Student lab (`lab_social_engineering`)

**Goal.** The first shippable product: the eight-stage engagement in `10`, fitting one session of
60 to 90 minutes with a target of 75, playable blind from the student materials alone.

**Items.** `10` N1 (engagement report builder), N2 (report reads `mailState.metrics`, the page
record's `victim` and the call globals; no store of its own), N3 (board `scope` and `plan` modes,
which are `03` N4's remaining modes, built in P6-C; their `03` N6 step and pick checks are linted
in P6-G), N4 (defender picks, done in
Phase 3), N5 (doors and keys: existing locks with `keyPins` and `opens_lock`, `#give_item` from Ruth,
`startItemsInInventory` for `ruth_phone`; no engine work), N6 (`mission.json` with
`secgen_scenario: null` and `collection: "lab_games"`; `lab_tesseract_trials/mission.json` moved to
`lab_games`; the three Tesseract docs that name `escape_room` updated; `db:seed` re-run on deployed
instances, which is the user's job), N7 (the remaining lab-level validator checks: every `engagement`
item with `correct` or `good` carries a `why`; every completing global in the objectives table is
declared), N8 (the externals are Phase 0; only the `README_scenario_design.md` rule edit is left if
Phase 0 did not make it).

**Content** (the bulk of the phase): `scenarios/lab_social_engineering/` with `mission.json`,
`scenario.json.erb` and `ink/` (Ruth, `ruth_phone`, Fairbairn, Tomasz, `dev_service_desk`,
`pierce_mail`, `lord_mail`); four rooms; the full `social` block from `00` §1 and `10` §5 (facts,
targets, templates, accounts `guest` and `freemail`, the OSINT sites, the board's engagement blocks,
the eight-message triage set, the call, the page, concept cards); objectives and Ruth's
`eventMappings`; `music.events`; the four cut-order items authored as data variants before the
timed playtest (`10` §4), so applying a cut is a data change.

**Files and hook points.** New `minigames/engagement-report/` and its CSS; the `report-workstation`
branch in `systems/interactions.js`; starter, registration, preload line, schema entry as in 1a,
all owned by the wiring packet P6-W;
`db/seeds.rb:67-71` already reads `secgen_scenario` and `collection`, and the missions index
titleises the label (`app/views/break_escape/missions/index.html.erb`, lines 114 to 125), so there is
no platform code change. The lab also gets its own block in
`scripts/ink_runtime_check/missions.json` (a shared file: edit only the new block, re-read just
before editing, validate the JSON afterwards).

**Process.** The full mission loop (AGENTS.md "The mission loop"): an Opus plan of the scenario file
from `10`; three adversarial review rounds; Opus implementation; a fresh implementation review; Sonnet
playtests (§2.5); fix and confirm. Then the design-heavy stages, about five cycles each, in order:
dialogue (`npc-dialog-review`), puzzle pacing and clue placement (`scenario-design-review`), room
dressing, lighting, POV backgrounds. The character pipeline runs alongside the art stages. Last comes
the timed blind playtest (§2.6), and the cut order if it runs long.

**Dependencies.** Phases 1 to 5.

**Assets (lab tier).** OBJ4 to OBJ6, OBJ8 to OBJ15; NPC1 to NPC4 (full sets: Gemini concept, which is
metered, so the user confirms scope first; then PixelLab), NPC6 to NPC8 (headshots), NPC9; BG1 to BG3
and BG7; UI8, UI9, UI11 to UI21, UI23 (UI10, the world pip, is not in the lab: the bar shows in the
chat header, Phase 4); LOGO1 to LOGO6 (LOGO5 and LOGO6 per the builder's list); FONT4, FONT5 (already
in from Phase 0); SFX5 to SFX9; MUS2, MUS3. One image at a time with sign-off; placeholder sprite keys (`female_office_worker_v2` and the
others in ASSETS §2) until each character is approved.

**Models.** Opus for the plan, the ink, the scenario authoring and every review. Sonnet for the report
builder (fully specified in `10` N1 and `00` §11), the playtests and data-entry packets that copy
values from `00`. Haiku for the Tesseract label change and the doc edits under N6.

**Done when.**
- `ruby scripts/validate_scenario.rb scenarios/lab_social_engineering --strict-social --no-graph
  --skip-ink` exits 0 with no social findings; a separate ink compile in the scratchpad is clean;
  `dialoguelint.mjs scenarios/lab_social_engineering/` is cleared or each finding justified;
  inkcheck and loopcheck run clean over the state matrix in the build log; `reopencheck` passes with
  the lab's block.
- The critical-path runs and failure-branch runs in §2.5 pass, each confirmed by `verify-run.rb`
  listing the tasks the run claims.
- The timed blind playtest (§2.6) finishes inside 60 to 90 minutes, or the cut order has been applied
  and a second blind run does.
- The lab appears under "Lab Games" on the missions index after `db:seed` on the dev database, and
  so does `lab_tesseract_trials`.

### Phase 7 — Awareness episodes, and Eldritch Hacker

**Goal (awareness).** Short attack-then-defend episodes for non-technical staff, one shell mission
per episode, with pre and post check missions, on a neutral corporate skin.

**Items.** `11` N1 (episode runner, with `episode_<id>_state`), N2 (flip view on the read-only
reader and the `playerSent` kind), N3 (defend sets), N4 (measurement store, local first), N5
(facilitated flag), N6 (narrow mail layout for E6, which is `01` N1's narrow layout), N7 (deepfake
style entry in the TTS config), N8 (neutral brand set), N9 (`scoringProfile: "awareness"`), N10 (done
in `00` §2), N11 (mock authenticator), N12 (voicemail player), N13 (interactive `page` card), N14
(`qr` and `sms` surfaces), N15 (role swap inside `inbox-triage`), N16 (shell host NPC and the
flushed done event). From `05`: N1's non-email kinds (`voicemail`, `sms`, `qr`, `page`) and the
Verify verdict in use, N10 (`call` and `push` kinds) and N11 (comparison screen with the
no-baseline gate). P7-* is split into named packets before Phase 7 starts (§4).

**Order** (README V): E1 first (needs no new surface), then E5 (needs the builder and N13), then E3
(needs `06`, N11 and N15). E2, E4, E6 and E7 follow. Every episode also ships a defend-only shell. The
pre and post check missions come with E1, because they carry the measurement.

**Files.** New `minigames/episode-runner/` (name to confirm) and the surfaces under `minigames/`; the
`kiosk` object branch in `systems/interactions.js`; one `scenarios/<episode>/` shell per episode and
defend-only variant (one room, `ui_theme: "general"`, a host NPC, a `kiosk` with `{ episodeId }`);
check missions with `importGlobals` for the pre values.

**Dependencies.** Phases 3 and 4 (and 5 for E5), and Phase 6 for the shared data and lessons.

**Assets.** NPC11, NPC12, BG6, LOGO7 to LOGO10, VO6 to VO8 (later, metered), SFX10, SFX11.

**Models.** Opus for the runner, the role swap and each episode's content; Sonnet for surfaces with a
written spec (N11 to N14) and for the playtests.

**Done when (first episode).** The E1 shell plays end to end on :3001; its triage starter writes with
`deferEmit`, confirms the sync, then completes the conclusion task once; a reopen after a closed tab
with the done global saved re-emits and completes it once; the post check shows "no baseline" when the
pre check was never played and the comparison when it was; the validator's shell checks (an aim, a
task, a `concludeRequires` global its set writes) pass.

**Eldritch Hacker.** Not scheduled in detail. It needs the universe-bible pass first
(`../eldritch_hacker/DIRECTION.md`, provisional). The README lists what it reuses directly (OSINT
browser, pretext call, board, rules engine) and what needs a variant (a DM or feed variant of the mail
client and triage; `senderAuth` is email-only; the builder's weaponisation check repeated per skin).
The mail items built for it, and not for the lab, wait here as packet P9-deferred (§4): `01` N8
(reply choices, `#compose_reply`, `#mail_later`, `deliverAt`), the rest of N15 (takeable terminals
used from inventory, found mailbox history, `sent`-folder seeds), N16 (highlights), the later half
of `00` S14 (found mail, the mail runner's `#compose_reply` and `#mail_later` handling, `seed` and
`choice` job kinds), the `found` account kind (`jed_pc`), and phone identities (`00` §10a, future
work). SPIKES §3's rule holds for the takeable terminal: a room object with a scenario-unique `id`.

### Phase 8 — Lab sheets and voice audio

Both come after everything else has settled (README R; `10` OQ5; AGENTS.md "Audio: last of all").

- **Lab sheet.** The `mission-lab-sheet` skill in full mode, published to HacktivityLabSheets, which
  is the single source for lab sheets, and linked from `mission.json` `lab_sheet_url`. There is no VM,
  so there is no VM companion sheet. Then an independent audit of the sheet against the game files.
  Opus writes it. The awareness product's facilitator notes, if any, follow the same rule.
- **Voice audio.** The `tts-audio` skill, after the user signs off the words and agrees the cost:
  VO1 to VO5 for the lab (Ruth in person and on the phone, Tomasz, Dev, Fairbairn; decision Z voices
  the hint hub and the minor cast), about 120 to 160 clips by the ASSETS estimate; VO6 to VO8 for
  awareness later. Before generating, check that no voiced line prints a variable
  (`dialoguelint-voiced-variable` covers this). Sonnet runs the checks; generation waits for the user.

**Done when.** The audit finds no mismatch between the sheet and the game; the `tts-audio` skill's
"which lines have no audio" check reports none for the lab; the cache is pruned and committed when
the user asks.

## 2. Test plan

### 2.1 Layers, and how each runs

| Layer | Tool and command | Fixtures | Notes |
|-------|------------------|----------|-------|
| Node unit tests | `bundle exec node --test test/js/<file>.test.mjs`; the whole suite with `bundle exec node --test test/js/*.test.mjs`; the social subset with `npm run test:social` | `test/js/fixtures/social/` (scenario fragments, compiled test ink) | Every new engine or social test is named `social-*.test.mjs` or `validator-*.test.mjs`, so `test:social` picks it up. **CI runs no node test today** (`.github/workflows/ci.yml` has a `lint` and a Rails `test` job only). The new job runs both social globs and then the whole existing suite, with each failing file on a named quarantine list (0.7). Node is 18.19.1 locally and 20 in CI; a file that fails only on one of them is quarantined with that reason |
| Validator tests | In-process: `ruby -e 'require "scripts/validate_scenario.rb" ...'`, as `test/js/validator-carry-over.test.mjs:13-23` does, or the CLI with `--no-graph --skip-ink` on a fixture copy in a temp folder | `test/js/fixtures/social_validator/<case>/` (one good and one bad scenario per lint) | Under CI the tests fail, not skip, when Ruby or the gem is missing (`00` S11). The existing validator tests skip when Ruby is absent; the new ones do not |
| Rails tests | `bin/rails test <path>`; whole suite `bin/rails test` | Scenario data built inline in the test, as `test/controllers/break_escape/reload_persistence_test.rb` does on the `ceo_exfil` fixture mission | Never compare with live scenario content |
| Ink tooling | `node scripts/ink_runtime_check/inkcheck.js <compiled story.json> [knot] [VAR=v ...]` and `loopcheck.js <compiled story.json> <knot> [K=V ...]` on compiled stories; the route drivers `node scripts/ink_runtime_check/m0N_routes/route.js scripts/ink_runtime_check/m0N_routes/<route>.json` for m02 to m08 (m01 has no route folder); `reopencheck.mjs scripts/ink_runtime_check/missions.json`; `dialoguelint.mjs scenarios/<m>/`; `tagdiff.mjs` against the last commit | Route files under `scripts/ink_runtime_check/m02_routes/` to `m08_routes/` | Compile to the scratchpad, never beside the sources, when someone else is editing |
| Browser bridge checks | `node .claude/skills/playtest-scenario/scripts/playtest-session.js --url <game-url> --headless < tools/playtest/se/bridge-<phase>.jsonl`, driving `window.__test` (`docs/test-bridge.md`); each new overlay overrides `getTestState()`. The `.jsonl` command files (one per phase, written by that phase's test packet) hold the assertions in the §2.2 "Bridge" rows | `scenarios/test_social_slice/` | Short scripted checks of keyboard, Close and save/restore, run by Sonnet |
| End-to-end playtests | The `playtest-scenario` skill on :3001, scripts split into 10 to 15 minute runs, each followed by `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id>` (with P0-N's task listing) | Game from `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb <mission>`, after `bin/rails db:seed` for a new scenario | Testers keep an earned-secrets table; anything typed from a guide or set by console is "exercised, not earned" |
| Sync regression | `node tools/playtest/sync-state-regress.js <game url> <server log>` | an existing mission | Proves change-only sync still holds after a new section or writer |

### 2.2 Tests per phase

**Phase 0**

| Kind | Test | Asserts |
|------|------|---------|
| Node | `social-global-writer.test.mjs` | `emitAlways` emits on a same-value write (the `applyActions` contract); change-only writes emit only on a change; `deferEmit` emits nothing and returns events only for changed names; the broadcast writes only into cached stories that declare the variable; the calling story is written with the observer detached; an out-of-range ink write is clamped and written back |
| Node | `social-state-sync-confirmed.test.mjs` | `_syncOnce` returns `true` after `confirm()` and when there is nothing to send, `false` on `{ stale: true }` and on a thrown error; `syncConfirmed()` retries with back-off (fake timers), stops at the attempt cap, stops at once on a 403 carrying `error.status`, and shares one queued run with a concurrent `sync()` |
| Node | `social-ink-fallback.test.mjs` | A compiled fixture that declares `se_influence` with an ink fallback loads with nothing bound and returns the fallback value; a bound function overrides it; a fixture with no fallback still throws (documents the rule the lint enforces); a story that declares only the six existing externals behaves as before |
| Node | `social-influence.test.mjs` | Threshold effects fire once per crossing; the latch; band flags recomputed on every change and cleared at `at + rearmMargin`; `recoverTo`; `report()` runs the `reports` effects; the ledger returns the stored result for a repeated `(runId, turn, function, id)`; `npc_influence_changed` fires once per change |
| Node | `social-tag-processor.test.mjs` | For a `social.characters` entry, `#influence:N`, `_gained`, `_lost` and `#report` write through the service. For any other NPC: `#influence:-100` writes nothing; `#hostile` still calls the hostile path; `influence_increased` and `influence_decreased` still show their popups in both written forms, unspaced `#influence_increased` and spaced `# influence_increased`; the hub-demo numeric form `#influence_gained:N` (`scenarios/ink/chen_hub.ink`, `netherton_hub.ink`, `haxolottle_hub.ink` and their `_ongoing_conversations` files) does exactly what it does today, because those NPCs are not social characters; `#set_global` on an imported read-only name is still refused |
| Node | `social-ink-vars.test.mjs` | `email_*` names never reach `recordInkVariables` or `exportNpcInkVariables`; engine-written variables are set after restore and sync in both chat loaders |
| Node | `social-return-to.test.mjs` | `returnTo` runs after `onComplete` on a normal exit only; a `suspended` parent ignores the `onComplete(false, null)` fired when the child starts; the keyboard pause survives the hand-back (spike F5) |
| Validator | `validator-social-framework.test.mjs` | `social` is a known top-level key; `--strict-social` exits 1 on a social lint error and 0 on a clean fixture and on a scenario with no `social` key; the `EXTERNAL`-fallback lint; aim `unlockCondition` keys; duplicate object ids; a missing sprite for a social object type fails under `--strict-social` only; the `social.characters` data lints (synced variables declared, `VAR`s match, thresholds ordered, `recoverTo >= A + rearmMargin`, `clearOnRearm` only on booleans, lockout with an expiry or a route), one bad fixture each; the run leaves the fixture folder's files unchanged |
| Tooling | `verify-run.rb` on a fixture game (P0-N) | Lists `objectivesState` tasks with status and time for every game; with `--tasks`, the P0-N fixture game (`scenarios/test_objectives`, tasks completed by a runner snippet) reports progress and exits 0; a fresh game still exits 1; an m05 game where only the opening was played still exits 1 without `--tasks`, though its opening completes tasks. `count-task-posts.sh` counts one completion for a single 200 POST and ignores a `PUT`, a `/skip` and a failed retry in a fixture log |
| Rails | `test/models/break_escape/scenario_npc_records_test.rb` | `find_npc_in_scenario` and `scenario_npc_ids` find a headless `emailRecord`; the room-NPC lookups are unchanged; `#give_item` validation accepts a headless record's items |
| Rails | extend `test/integration/npc_ink_loading_test.rb` | The ink endpoint serves a headless record's story |
| Rails | extend `test/controllers/break_escape/games_controller_test.rb` | `sync_state` still answers stale with `{ success: true, stale: true }` and a refused last-write-wins section with 403, which `syncConfirmed` relies on |
| Back-compat | §2.3 items 1 to 8 | — |
| Regression | §2.4 R0 to R4 | — |

**Phase 1a**

| Kind | Test | Asserts |
|------|------|---------|
| Node | `social-phish-rules.test.mjs` | The open check (opened by sender, opened by subject topic, neither); each factor's pass and fail; the slot judge's distinctive, generic and stale kinds and `implies`; `from_own`; `senderAuth` derivation and `dmarcPolicy`; `tells[]` on every result; free text ignored; Hampshire's two pretext templates give the authored fail line and the landing result |
| Node | `social-intel.test.mjs` | `grantFact` flips once (a second grant emits nothing and adds no note); the `se_intel_` naming rule; `evaluateReadiness` sets `target_ready_<id>` and `osint_done` at grant time; note ids stay unique within one millisecond |
| Node | `social-mail-scheduler.test.mjs` | A text job delivers after its wall-clock delay into the mailbox of the account used; `phish_<id>_landed` is set only on a landed send; the job change key ignores `remainingMs`; a serialised and restored job still delivers; a data-only target that does not open the message gets a silent text job |
| Node | `social-mail-composer.test.mjs` (jsdom) | On a fixture template with one blank: Send is disabled with "A blank needs evidence you haven't found yet" while the blank's fact is not held, and the line names no fact; the picker offers only held facts (stale ones included); after the grant, Send enables. Hampshire's blank-free templates send with no picker |
| Node | `social-mail-state-export.test.mjs` | `mailState` is a keyed section; in the `pagehide` flush it comes right after `globalVariables` and is dropped, not truncated, when over the 60 KB budget; a message and the job that produced it are confirmed together |
| Validator | `validator-social-mail.test.mjs` | The `01` N18 checks Hampshire's data touches (accounts, mailboxes, contacts, `mail_terminal.accountIds`) and the `04` N10 subset; the pre-send line cannot be replaced by scenario text (`04` N11); empty authored strings fail (`04` N3) |
| Rails | `test/models/break_escape/mail_state_test.rb` | `merge_mail_state!` caps: 200 messages per mailbox, 4000 characters per body, 50 jobs, one draft per account, `MAX_MAIL_STATE_BYTES` total; trim order (oldest read seeded inbox mail, then replies, then sent), never unread mail or a pending job; over the total, the previous state stands; unknown keys stripped |
| Rails | `test/controllers/break_escape/mail_state_sync_test.rb` | `mailState` sits in `merge_last_write_wins_sections`, so a stale request cannot overwrite it; bootstrap returns `savedMailState`; a grant's `se_intel_*` global round-trips through `sync_state` |
| Rails | extend `test/integration/unlock_system_test.rb` | A locked takeable `mail_terminal` declared in a room's `objects` with a unique `id` unlocks whether or not it is in the inventory; one that exists only in an NPC's `itemsHeld` gets "Object not found" (SPIKES §3, documented) |
| Rails | extend `test/integration/task_set_global_test.rb` | Server half only, because Rails cannot run the client's `eventMappings`: a `complete_task` for `hampshire_landed` completes it and raises `tasks_completed` and the score; a second call is a no-op and the score does not change; an early completion is accepted (SPIKES §5, documented). The mapping itself is proved by the 1a bridge check |
| Bridge | mail client and board | Space and `E` do nothing while open (player position unchanged, no second minigame); Tab reaches every control in order; Esc inside the reading pane or composer closes the overlay only after any open sub-panel; the own Close control works; the mail client's Close with nothing sent completes with `{ aborted: true }` and records nothing; the board's Close completes with `success: true` and no `minigame_failed`; a mail draft, a pending reply and the board state survive a reload |
| E2E | Phase 1a "Done when" script | — |

**Phase 1b**

| Kind | Test | Asserts |
|------|------|---------|
| Node | `social-mail-runner.test.mjs` | A headless run restores, syncs, then sets the `email_*` variables; uses a fresh ledger; binds `se_influence`; the `email_` variables never reach `exportNpcInkVariables` |
| Node | `social-influence-bar.test.mjs` (jsdom) | Threshold icons are paired with words; the number is always printed; the bar redraws on `npc_influence_changed`; the score region is `aria-live="polite"` |
| Node | extend `social-phish-rules` | `boostIfGlobal` and `strictIfGlobal` act on a copy; the `EvalResult` to `email_*` mapping table |
| Validator | extend `validator-social-mail` | A character target's `on_email` declares the `email_*` VARs it reads and its influence VAR, and calls `se_influence` on both branches; `createMenu` ids unique; `acct_<id>`, `acct_<id>_choice` and `phish_<id>_attempts` declared |
| Bridge | mail client | On the Pierce-style target: the blank picker opens by keyboard and its listbox takes arrow keys; Send is disabled with the neutral line until each blank holds a fact; the account switcher and Create-account panel by keyboard; Esc order picker, then panel, then overlay; layout at 600 px has no horizontal scroll |
| E2E | Phase 1b "Done when" script | — |

**Phase 2**

| Kind | Test | Asserts |
|------|------|---------|
| Node | `social-osint-address-bar.test.mjs` (jsdom) | The formatter returns the authored host as typed, `xn--` labels and non-ASCII letters unchanged; clicking a page link leaves `window.location` alone and changes the shown page |
| Validator | `validator-social-osint.test.mjs` | One award path per fact and `source` equal to the element id; `fact`, `showIf`, `unlockedBy` and `card` ids resolve; `se_osint_state` declared; hosts end `.example` and are ASCII in the raw JSON |
| Bridge | OSINT browser | Keyboard and Close as for the board; Case file opens the board and closing it returns to the same page; a reload keeps visited pages and granted facts |
| E2E | Phase 2 "Done when" script | — |

**Phase 3**

| Kind | Test | Asserts |
|------|------|---------|
| Node | `social-triage-scoring.test.mjs` | The worked example (68% analyst, 86% awareness); round bands; per-factor counts; `playerSent` truth taken from stored tells |
| Node | `social-triage-starter.test.mjs` (stubbed `stateSync`) | Writes with `deferEmit`; emits nothing until `syncConfirmed()` resolves `true`; emits only changed names, then the done event last; on `false`, emits nothing; `_pass` is never cleared by a lower round; a reopen with `_done` set and the conclusion task incomplete re-emits once |
| Node | `social-player-sent.test.mjs` | The replayed record is the latest send whose tells include `senderTrust` or `senderAuth`, else the latest with any tell; a later `freemail` retry does not shadow a spoofed send |
| Validator | `validator-social-triage.test.mjs` | The `05` N5 list; `03` N6 defender checks (facts with a `reduceNote`, step bindings) |
| Rails | `test/controllers/break_escape/social_sync_then_emit_test.rb` | `sync_state` with `triage_done` and `triage_pass` lands before `complete_task`; a task whose aim's `concludeRequires` names `triage_pass` then completes; the same request replayed is idempotent |
| Bridge | triage | Keyboard verdicts and chips; Esc closes a chip sheet or header panel before the overlay; Close mid-round gives `{ aborted: true }` and writes no global; a reload mid-round restarts the round without scoring the half-done one |
| E2E | Phase 3 "Done when" script, including the blocked-sync and 403 runs | — |

**Phase 4**

| Kind | Test | Asserts |
|------|------|---------|
| Node | `social-pretext-judge.test.mjs` | The Priya and Dev worked examples in `06` §4.6 and §4.8; entries carry `{ delta, reason, line }`; `reported` and `reportReason` |
| Node | `social-pretext-session.test.mjs` | The turn counter's idempotency; a fresh session on reopen overwrites the state key; grants accumulate; the outcome rule (`reported`, else `got_it`, else `walked_away`); asks already held are not offered; the 40-entry log cap |
| Node | extend `social-influence` | Lockout written to `<character>_lockout_until` and `_lockout_channel` with real minutes from `gameClock.elapsedMs()`; the lift writes `recoverTo` silently and clears band flags |
| Node | `social-influence-pip.test.mjs` | The pip shows only while the value differs from its start, hides again at the start value, and is skipped for characters with no sprite |
| Validator | `validator-social-pretext.test.mjs` | The `06` N10 list, including a `reports` threshold on every character with call data and no once-only choices in call knots (N12) |
| Bridge | `pretext-prep` and the chats | Keyboard and Close; a locked-out phone shows the refusal before `pretext-prep` opens; a reload mid-call restores the bar, the tells panel and the session log |
| E2E | Phase 4 "Done when" runs | — |

**Phase 5**

| Kind | Test | Asserts |
|------|------|---------|
| Node | `social-landing-page-model.test.mjs` (N2, N10, N11) | The 34-point and 87-point worked examples (`07` §4); the 75-point `d_letter` case with its gate line; tier 3 with every other choice perfect scores 100; a non-sensitive extra field scores 5; an extra field plus a missing real field scores 4; a choice change after a Score gives `meetsThreshold: false` and `built: false`, so `linkInfoFor` returns `missing`; `applyScore` keeps `victim` and `tellsFound`; `betterVictim` keeps `submitted` over a later `noticed` or all-false record, and the first send writes an entry even when all-false; `captureGranted` adds the note once, on the first `submitted`, and never on a repeat or a `noticed`; no exported identifier matches `/serial\|export\|download/i`; `buildRecord`, `applyScore` and `betterVictim` emit only the closed keys |
| Node | `social-landing-page-render.test.mjs` (N3, N8) | Under jsdom, in each of six states (build, score, step 6 hot-spots, blocked placeholder, homograph option, worked-example page): no `a`, `form`, `input`, `textarea`, `select`, `button`, `iframe` or `script` element and no `contenteditable` in the preview; `div role="button" tabindex="0"` hot-spots are allowed; the preview is `role="img"` in build and score and `role="group"` in step 6; the builder folder has no `fetch`, `XMLHttpRequest`, `WebSocket` or `sendBeacon`; no serialise function is exported; the homograph domain and its `xn--` label go through `textContent`, never through `displayDashes` |
| Node | `social-landing-page-guard.test.mjs` (N6b) | (a) `ledgerwell.test` injected straight into the model and the renderer returns `{ blocked: true }` and the "Blocked address" frame; (b) the off-menu domain `payroll-desk.example` returns the same placeholder; (c) the menu domain `ledgerwell-hr.example` is drawn normally |
| Node | `social-landing-page-state.test.mjs` (N4; name proposed) | `se_landing_pages` and `se_landing_drafts` default to `{}`; a key outside the closed record set is dropped on write and on sync; a `tellsFound` id outside the nine is dropped; a draft key outside the seven choice keys is dropped; a full record for all six domain ids fits inside the `pagehide` flush share |
| Validator | `validator-landing-pages.test.mjs` (N6, N7) | A raw homograph character in `domain` fails; the `е` escape passes; the punycode encoder gives `xn--ledgerwll-m0h` for `ledgerw`, U+0435, `ll`; the menu domain `paypal.example` fails the allowlist; `paypa1` and `pay.pal` as labels of `capture.address` each fail, by fold and by concatenation; `Q3.pdf` and a `.co.uk` ending in card text pass (not host-shaped); a tier with no defender string fails; a `decoyWords` entry of `paypal` fails; card text naming a denylisted brand fails; a brand `look` other than `generic` or `parody` fails; a page with no `targets` key fails, and so does a `page-builder` object whose page has more than one; a `targets` key without `linkCredible` among its required factors fails; a `conceptCards` id that does not resolve fails; an empty string, or a placeholder outside `{firstName}`, `{shown}`, `{real}`, `{linkText}`, fails; `--strict-social` exits 1 on a file with a lint error and 0 on a clean one |
| Bridge | Phase 5 "Playtest steps" 1 to 8 (P5-T) | Space and E do nothing while the builder is open; a keyboard-only build; Attach anyway below threshold; a choice changed after a Score hides Attach; reload at draft, scored, built and part-way through step 6; Esc and Close give no `minigame_failed`; the 600 px layout |
| Safety (cross-reference) | `social-osint-address-bar` (`02` N9) | Belongs to Phase 2. Listed in the N6 CI glob with the three landing tests |
| Back-compat | none new | §2.4 R1 and R2 after each engine commit |
| E2E | Phase 6 F8, F11, F12, F13 | Run in Phase 6, not here |

**Phase 6**

| Kind | Test | Asserts |
|------|------|---------|
| Node | `social-engagement-report.test.mjs` | Results read from `mailState.metrics`, the page record and the call globals; "no page sent" when the record has no `victim`; the blame option shows its `why`; `se_report_state` holds ids only |
| Validator | the lab itself under `--strict-social --no-graph --skip-ink`; `validator-social-lab.test.mjs` on fixtures for `10` N7 | — |
| Rails | extend `test/controllers/break_escape/missions_controller_test.rb` | A fixture mission with `collection: "lab_games"` is listed under "Lab Games" (fixture, not live content) |
| Ink | inkcheck and loopcheck over each lab story for the state matrix in the build log; `reopencheck` with the lab block; `dialoguelint` | — |
| E2E | §2.5 and §2.6 | — |

**Phase 7.** Node tests for the runner's state carry-over, the measurement record and the
comparison screen's no-baseline gate; validator shell checks; a Rails test that the host NPC's
mapping completes the conclusion task once after a reopen; bridge checks for each new surface (N11 to
N14); one playtest per shipped episode and its defend-only shell, plus a pre, episode, post sequence.

### 2.3 The back-compat checklist, as tests

`00` §12 ends with a back-compat checklist. Each item becomes a check that runs on every engine
commit from Phase 0 onwards. Standing tests use copied fixtures, never live mission files
(AGENTS.md Housekeeping: missions keep changing under pass 4 and the m09/m10 work). Checks that
need every live story are one-off scripts whose output goes in the build log.

| # | Checklist item (`00` §12) | Enforced by |
|---|---------------------------|-------------|
| 1 | `applyActions` `set_global` still emits `global_variable_changed` on every call, same value or not | `social-global-writer` "same value emits again"; plus a one-off Haiku audit of the scenarios that map `global_variable_changed` (19 scenario files today: m01 to m08, sis01 to sis03, `lab_tesseract_trials`, `chat_minigame_demo` and six test scenarios), listing any mapping that relies on a re-set value, which then gets a targeted browser check |
| 2 | m01 Derek (`#hostile`, then `#influence:-100`) still turns hostile through `#hostile` | `social-tag-processor` with Derek's tag sequence (`m01_derek_confrontation.ink:303-305`); browser run R3-m01 |
| 3 | m02 guards and ward nurse are not turned hostile by ink arithmetic | `social-influence` "non-social NPC: no watcher, no threshold effect"; browser run R3-m02 |
| 4 | m04 Vance and m05 Patricia pairs need no change | `tagdiff.mjs` shows no change to any m04 or m05 ink in an engine commit; browser runs R3-m04 (spaced `# influence_increased` form) and R3-m05 (unspaced form): the popups still show |
| 5 | `neye-eve.json` is untouched | `git diff --exit-code scenarios/ink/neye-eve.json scenarios/ink/neye-eve.ink` in the pre-commit check; the worked example is a new copy |
| 6 | A story with none of the new externals or variables loads with no warning | **Standing:** `social-ink-fallback` loads a fixture copied into `test/js/fixtures/social/ink_compat/` of one m01 story with no externals, through `InkEngine` with a console spy, and expects no warning. **One-off:** `scripts/ink_runtime_check/social-load-all.mjs` (new, written by P0-B as spike F2) loads every compiled m01 to m08 story through the chat, phone-preload and bark paths with the flag off and on and diffs the warnings and outcomes. Its output is kept in the build log and re-run before each engine commit that touches a loader |
| 7 | A story that declares the new externals loads from the phone preload, the bark path and a dry run | `social-ink-fallback` fixture through the three loaders (with the bark loader's `InkEngine` usage at `systems/npc-manager.js:1206` and `:2079`); a bridge check in `test_social_slice` that opens the phone preload and fires a bark on P1-O's `se_influence` story, run in P1-T2 (1b) |
| 8 (added) | Stories that already declare `EXTERNAL`s behave exactly as before on every loader. Today that is m02 (11 files), m03 (6; `m03_night_transition.ink` only names it in a comment, and is not counted) and m04 (7). m07 has none (`m07_npc_elena_rodriguez.ink:23` is a comment saying it was removed) | **Standing:** `social-ink-fallback` loads copied fixtures (the m02 and m03 Agent HaX phone stories, the only two compiled stories that call an `EXTERNAL` (`player_name`) at runtime (P0-B), plus one m04 story that declares one and never calls it, in `test/js/fixtures/social/ink_compat/`) through the chat and bark paths and checks the outcome matches what they did without the flag, because turning fallbacks on must not change a story that has no fallback functions. **One-off:** the same `social-load-all.mjs` run as item 6 covers the live files |

### 2.4 Regression suite for the shipped missions m01 to m08

The Phase 0 changes (tag processor, ink fallbacks, the shared writer, `deferEmit` and
`syncConfirmed`, `stateSync` sections) run in every mission, so the suite below guards them.
Influence tags are everywhere. `influence_increased` and `influence_decreased` appear in two written
forms. The spaced form (`# influence_increased`) appears 247 times: m01 23, m02 103, m03 87, m04 22,
m08 12. The unspaced form (`#influence_increased`) appears 65 times: m05 49, m06 16. Both also turn
up in the lab instructors and sis01. `#influence:-100` appears once, in m01, and the hub-demo stories
in `scenarios/ink/` use a numeric `#influence_gained:N`. (Counted with grep on 2026-10-21. Recount
before relying on the figures.)

| Id | What | Command or method | When |
|----|------|-------------------|------|
| R0 | Static, per mission | Old and new engine run on **identical content**. For each commit, make a throwaway `git worktree` of HEAD under the session scratchpad, then copy the working tree's `scenarios/<m>` (and `scenarios/ink/`) into it, so other agents' uncommitted mission edits appear on both sides. Then run `ruby scripts/validate_scenario.rb scenarios/<m> --no-graph --skip-ink`, `dialoguelint.mjs scenarios/<m>/` and the route drivers (`node scripts/ink_runtime_check/m0N_routes/route.js scripts/ink_runtime_check/m0N_routes/<route>.json`, every route of m02 to m08) in both trees and diff the outputs; for m01, which has no route folder, `inkcheck.js` on each compiled story in both. No tracked file is written (checked with `git status --porcelain`); ink is compiled to the scratchpad; `reopencheck.mjs scripts/ink_runtime_check/missions.json`; `tagdiff.mjs` showing no ink change in an engine-only commit | Every engine commit |
| R1 | Node suite | `bundle exec node --test test/js/*.test.mjs` (existing tests such as `phone-reopen-and-persistence`, `global-sync-declared`, `state-sync`, `person-chat-reopen`, the `engine-fixes-*` files, plus every new test), passing apart from the named quarantine list; a quarantined file is run on its own and must pass there | Every engine commit |
| R2 | Rails suite | `bin/rails test` | Every engine commit |
| R3 | Short Sonnet browser runs on :3001, 10 to 15 minutes each, each with a reload | m01: Derek's hostile route and Kevin's `#hostile:kevin_park`; the opening phone briefing. m02: guard and ward nurse conversations that change values, with none turning hostile; a phone chat and a bark from a story that declares `EXTERNAL`s. m03 and m04: a person chat and a bark from an `EXTERNAL` story; the m04 Vance pair. m05: Patricia, Lisa, Owen and Dr Halloran popups and the Patricia pair. m06: Irina's popups and a `global_variable_changed` mapping. m07: a `global_variable_changed` mapping chain and a phone conversation with a reload (it has no `EXTERNAL` story). m08: a global mapping chain and its spaced-form popups. One quick lab instructor (`lab_scanning`) and one sis01 popup check | Phase 0; a short subset before the 1a commit (an m01 phone pickup, and one mission with a takeable workstation or phone, because 1a edits `PICKUP_THEN_INTERACT_TYPES`, the pickup block at `interactions.js:776-784` and the NPC manager tick at `npc-manager.js:1557`); in full after 1b (tick loop and sync); after 4 (both chat loaders); before the Phase 6 commit |
| R4 | Sync regression | `node tools/playtest/sync-state-regress.js` on m01 and m05: the reload round-trip and the idle request count are unchanged, and no `mailState` key appears in the request body of a mission with no mail | Phase 0, and after every phase whose diff touches `state-sync.js` (1a at least; 5, per P5-F) |

A run passes when each listed check holds, in the same way it did in the 0.0 browser baseline
(item 0.0 (d)). Each R3 run ends with `verify-run.rb` and an earned-secrets table. A failure goes
back to the
packet that made the change, never into the mission's own files: a regression is fixed in the
engine.

### 2.5 Lab end-to-end playtests

Regression persona (answers known, each fetched from its in-game source first), split into short
runs that chain through saved games. Each run reloads once and ends with `verify-run.rb`.

| Run | Stages | Checks |
|-----|--------|--------|
| L1 | 0 and 1 | Scope cards, the stop-rule question, Fairbairn's line, objective and measure picks; `roe_signed`, `plan_done`; Ruth hands over the Recon key |
| L2 | 2 | All 11 facts found by browsing; the J. Baker namesake stays ambiguous; the archived chart grants `old_org_chart`; the board shows readiness; `osint_done`; the Operations key |
| L3 | 3 | Create `freemail`; land Hampshire; land Pierce from `guest` with the Jed spoof; reload during a reply wait |
| L4a, L4b | 4 and 5, both orders | Page built and attached; the Dev call grants both asks; `pretext_call_done` |
| L5 | 5 (Lord) and 6 | Lord lands with the page and the call facts; the report's results, three findings, `report_filed`; Blue Team key |
| L6 | 7 and close | Triage passes, the two `playerSent` messages are the tester's own sends; profile picks; Tomasz's debrief; the end screen; mission concluded on the server |

Failure-branch runs, each short:

| Run | Branch |
|-----|--------|
| F1 | An empty blank blocks Send with the neutral line, which never names the missing fact |
| F2 | The credible wrong pretext for each target fails with the character's own words; Pierce and Lord lose 10 influence per failed send; the hint ladder starts after two misses; retries stay free |
| F3 | A subject the target does not open: the open-check row says so and nothing lands |
| F4 | A `freemail` retry after a `guest` spoof: triage still replays the spoof (decision K) |
| F5 | Lord without a page: `linkCredible` fails as `missing` |
| F6 | The Dev call is reported: report global and lockout set; the desk phone refuses before `pretext-prep`; the student turns to the builder; after Dev's two real minutes (`06` §4.8, line 223; `00` §8 `afterMinutes: 2`) the phone opens again with Dev at -30 and `dev_wary` and `dev_refusing` cleared |
| F7 | A call left after one ask, reopened: only the ungranted ask is offered and grants accumulate |
| F8 | The page re-scored after Attach: Attach needs a current Score; the victim record keeps its best outcome |
| F9 | Triage below 60%: "Try again"; `triage_pass` stays true after a later lower round |
| F10 | The report's blame option shows its `why` |
| F11 | Every overlay closed with Esc and with Close at each stage: no `minigame_failed`, no task completed by a close |
| F12 | A reload at each stateful point: mail draft, pending reply, mid-call, mid-triage, builder draft, report in progress |
| F13 | A narrow-window run (600 px wide) through stages 2 and 3 |

### 2.6 The timed blind playtest

Target 75 minutes, accepted range 60 to 90 (`10` §4, OQ3). A fresh Sonnet tester gets only what a
student gets: the mission's in-game text and the brief, no design docs, no solution guide. A
long single run gets cut off (AGENTS.md "The mission loop", step 5), so the blind run is split by
stage into chunks that chain through the saved game. The timing taken is in-game time
(`gameClock.elapsedMs()`) per stage, compared row by row with the `10` §4 budget, together with the
number of actions and every "didn't know what to do" moment.

An AI tester's pace is not a student's, so its figure is an estimate. The plan treats it as a
screening run. If it comes out over 90, apply cut 1, then 2, 3 and 4 in order (`10` §4) and run
again. If it comes out under 60, restore extension content in the `10` OQ9 order. The figure that
settles the budget is a timed run by a person (the user or a student volunteer), which the
orchestrator asks the user to arrange.

## 3. Risks, and the spikes still worth doing

**Risks.**

- **The tag processor and the writer run in every mission.** A slip in `processGameActionTags` or
  in the `set_global` emit contract breaks shipped missions with cached audio. Phase 0 lands alone,
  behind the back-compat tests and R0 to R4, before any UI.
- **Writing into an open conversation.** The live chat engines are not in `inkEngineCache`, so the
  calling-story write is the only way a mid-call grant reaches the story (`00` S3). It is new, and a
  wrong observer detach would loop or drop the write.
- **The reply countdown.** The scheduler is ticked from the NPC manager loop. If that loop slows or
  stops in a background tab, a 15-second reply could wait until the tab is back, and the persisted
  `remainingMs` could drift.
- **The `pagehide` budget.** `mailState` shares the 60 KB keepalive body with every other section.
  A large mailbox falls back to the next 30-second sync, so a reply delivered just before a close can
  be lost (`00` §13 "`mailState` flush").
- **Content safeguards.** Phishing templates, replies and the page model are attack-shaped. A
  stopped agent leaves unreviewed work (AGENTS.md); the builder is already routed to Haiku.
- **Validator contention.** Six phases add lints. One file edited by parallel agents invites lost
  edits, hence the per-area lint files (§4 notes).
- **The art queue.** Images go one at a time with the user's sign-off, and the Gemini concepts are
  metered. The build runs on placeholders, and the art stages wait for the dressing and lighting
  order.
- **Length.** The 75-minute figure is an estimate, and an AI tester's pace is not a student's
  (§2.6).
- **Client-set results.** Outcome globals are set in the browser and the server scores an early
  task completion (SPIKES §5). Fine for a lab. Anything reported to a third party, as the awareness
  product would be, needs a server path first (README Conventions).

**Spikes still worth doing, in order.** Numbered F1 to F6 so they never collide with the five settled
spikes in `SPIKES.md` (cited as SPIKES §1 to §5). Each is short and read-only against the repo,
with its experiments in the scratchpad, except F2's load script, which is kept as a tool.

- F1. **Calling-story write into a live chat** (before 0.2): open a person chat and a phone chat in the
   browser, write a declared global from outside, and check the open story reads the new value on
   its next line with no observer echo.
- F2. **Fallbacks on for every shipped story** (before 0.1 is merged): load every compiled m01 to m08
   story through the chat, phone-preload and bark paths with the flag on and off, and diff the
   results. Written as `scripts/ink_runtime_check/social-load-all.mjs` (§2.3 items 6 and 8), packet
   P0-B. SPIKES §4 proved the mechanism, not the absence of side effects.
- F3. **The scheduler in a background tab** (before 1a's scheduler): does the NPC manager loop at
   `systems/npc-manager.js:1557` keep ticking while the tab is hidden, and at what rate? This decides
   whether the countdown is ticked or computed from a stored wall-clock deadline.
- F4. **`mailState` size at the lab's real volume** (before 1a's flush work): serialise six seeded
   messages plus a full student's sends and jobs and measure them against the 60 KB budget.
- F5. **Return-to and the keyboard pause** (with 0.9): a child overlay launched from a parent that set
   `requiresKeyboardInput` must leave the world paused when control returns to the parent, and
   unpause only when the parent closes.
- F6. **Font loading for any canvas text** (with 0.8): if any social text is drawn on the Phaser canvas
   (SPIKES §1 notes the font must be loaded first), check `document.fonts.load` before the first draw.
   DOM overlays do not need this. Packet P0-L.

## 4. Work packets

Each packet fits one subagent. "Inputs" are the files to give it, besides the build brief and this
plan; "Gate" is what the orchestrator checks before accepting it (grep or read the lines for every
claimed fix). Every implementation packet ends with its tests passing and `git diff --stat` limited
to its own files. Reviews are read-only, run by a fresh Opus agent, and tag findings blocker, major
or minor with file:line.

Notes that hold for the table:
- **"After X" means X's code has landed** in the shared tree with its unit tests passing. It does not
  mean X's gate has passed. Bridge and playtest gates are checked later by the orchestrator, once
  the packets they need have landed, so a gate that waits on another packet's code never deadlocks.
- A wiring packet runs after the code of the overlay it wires, and never registers or imports a
  minigame whose folder does not exist yet. `minigames/index.js` uses static `import` and `export`
  lines (`:1-30`, `:140-160`), so an import of a missing folder would break every game loaded from
  the shared tree, including other agents' m01 to m10 playtests.
- Packets in the same phase run in parallel unless a "after" note says otherwise. Agents that touch
  a shared file (`systems/interactions.js`, `minigames/index.js`, `systems/minigame-starters.js`,
  `core/game.js`, `show.html.erb`, `scripts/minigame-data-schemas.json`) add only their own block and
  re-read the file just before editing.
- Validator lints go in the packet's own `scripts/validate_social/<area>.rb` (0.7).
- Image generation is never inside a packet. The first batch (the new Slice rows) is authorised
  (user, 2026-10-21); every later round of art, or a redo of a batch-1 image, is asked for first.
  Wiring packets that copy placeholder sprites never overwrite a file that already exists.

| Id | Phase | Scope | Model | Inputs | Outputs | Gate |
|----|-------|-------|-------|--------|---------|------|
| P0-A | 0 | Baselines 0.0 (a) to (c): Node per-file results, reopencheck, route drivers | Sonnet | AGENTS.md "Verifying work"; this plan 0.0 and §2.4 | Baseline files in the build log folder | Every item present; `git status` clean apart from them |
| P0-A1 to P0-A8 | 0 | 0.0 (d): the R3 browser baseline, one packet per mission (m01 to m08), run beside P0-A | Sonnet | §2.4 R3 row for that mission | Run report per mission | `verify-run.rb` shows progress; each listed check recorded as observed |
| P0-B | 0 | Spikes F1 and F2 (§3), including the one-off `scripts/ink_runtime_check/social-load-all.mjs` | Opus | `00` S1, S3; SPIKES.md §4 | Findings in the build log; the load script and its first output | Each answer cites file:line and a scratchpad experiment; the script's flag-off and flag-on output is logged |
| P0-C | 0 | Ink fallbacks and tooling flag (0.1); after P0-A, P0-A1 to P0-A8 and P0-B | Opus | `00` S1; `ink-engine.js`; `inkcheck.js`, `loopcheck.js`, the seven `route.js` drivers (reopencheck needs no edit); README_scenario_design.md:1724 | Code, `social-ink-fallback` test and its copied fixtures, rule edit | Back-compat 6 and 8 (standing tests and the one-off script) and the fixture half of 7 pass (7's bridge half runs in P1-T2); R0 reopencheck and route drivers unchanged |
| P0-D | 0 | Shared writer, `applyActions` on it (0.2, writer half); after P0-A, P0-A1 to P0-A8 and P0-B | Opus | `00` S3; `apply-actions.js`; `npc-conversation-state.js` | `systems/global-writer.js`, `social-global-writer` test | Back-compat 1 passes; R1 green apart from quarantines |
| P0-E | 0 | Boolean `_syncOnce`, `syncConfirmed`, `error.status` (0.2, sync half); after P0-A and P0-A1 to P0-A8 | Sonnet | SPIKES.md §2 (code given); `state-sync.js`; `api-client.js` | Code, `social-state-sync-confirmed` test | Test passes; R4 on m01 unchanged |
| P0-F | 0 | Influence service (0.3, service half); after P0-D | Opus | `00` §8, S5, §13 band rows; `06` N9 | `systems/social-influence.js`, `social-influence` test | Test passes; no shipped code path imports it except the tag processor |
| P0-G | 0 | Tag processor cases (0.3, tags half); after P0-F | Opus | `chat-helpers.js:24-560`; `00` §8 "Influence tags"; §2.4 tag counts | Code, `social-tag-processor` test | Back-compat 2 to 4; both popup forms and the hub-demo numeric form covered; R3-m01 Derek |
| P0-H | 0 | `email_` exclusion and loader order (0.4); after P0-A and P0-A1 to P0-A8 | Opus | `00` S7; `npc-conversation-state.js`; both chat minigames | Code, `social-ink-vars` test | R1 green apart from quarantines, with `person-chat-reopen` and `phone-reopen-and-persistence` passing |
| P0-I | 0 | Headless records, client and server (0.5, 0.6); after P0-A and P0-A1 to P0-A8 | Opus | `00` S2, S8; the files in 0.5 | Code, `scenario_npc_records_test.rb`, ink endpoint test | R2 green; the R0 worktree diff shows no new line |
| P0-J | 0 | Validator social framework, generic lints and the `social.characters` data lints (0.7, lint half); after P0-A | Sonnet | `00` S11, §11 "Lint field list" (framework only), §13 "Validator exit" | `scripts/validate_social.rb`, area stubs, `validator-social-framework` test | Test passes; R0 worktree diff limited to the reviewed new lines |
| P0-K | 0 | CI job (social globs, then the whole `test/js` suite with the named quarantine list), jsdom, lockfile, `test:social` (0.7, CI half); after P0-J | Sonnet | `00` S11 CI text; `ci.yml`; `.gitignore:43`; `package.json`; the P0-A Node results | Workflow job; lockfile regenerated with `npm install --package-lock-only` in the shared tree (no `node_modules` change), committed when the user asks | `npm ci && npm run test:social` and the full suite pass apart from the quarantine list, run in a throwaway worktree under the scratchpad that holds the working tree's state, not bare HEAD: either a temporary commit of the working tree on a scratch branch (never pushed, deleted afterwards), or a HEAD worktree into which `package.json`, `package-lock.json`, `test/js/`, `scripts/` and `public/break_escape/js/` are copied from the working tree before `npm ci`. This is needed because `npm ci` in the shared tree would delete the `node_modules` (and playwright) that other agents' playtests are using; CI green once the user pushes |
| P0-L | 0 | Source Sans 3 (0.8) and spike F6; after P0-A | Sonnet | `00` §6; ASSETS §5; SPIKES.md §1 licence notes; the source URLs in 0.8 | Font files, `OFL.txt`, `css/fonts.css` rules, a provenance note (URL, SHA-256, version, google/fonts commit) in the build log | SHA-256 of each committed file matches the note; a test page renders `раураl` in the bundled face (computed `font-family` and no fallback glyph); F6 answered |
| P0-M | 0 | Return-to and overlay helper (0.9, 0.10); spike F5; after P0-A and P0-A1 to P0-A8 | Opus | `00` S12; `minigame-manager.js`; `base-minigame.js` | Code, `social-return-to` test | Test passes; `modal-stack-escape` and `session-overlay-pause` tests still pass |
| P0-N | 0 | Playtest tooling (0.11): task listing in `verify-run.rb`, counted toward the verdict only for `social` scenarios or with `--tasks`; `count-task-posts.sh` with the exact-path, 200-only rule; `tools/playtest/se/check-bridge.mjs`; after P0-A | Sonnet | 0.11; `tools/playtest/verify-run.rb`; `game.rb:1306-1360`; `config/routes.rb:39-41`; `playtest-session.js:13-38` | Script changes; the fixture game on `scenarios/test_objectives` (runner snippet in the scratchpad) | The §2.2 Phase 0 "Tooling" row passes, including the m05 opening-only game still exiting 1 |
| P0-P | 0 | Doc edits the settlements still need (outside this plan): `grant_fact` and `systems/global-writer.js` in `00` §12 and the README engine table; any README or 06 line that puts the world pip in the lab. Already done in the r10 fix round, so not in scope: the README Landing page and Validator rows, `04` N10 and `10` N7 pointing at `scripts/validate_social/*`; ASSETS FONT4, FONT5, UI10, UI23 and the §9 recount; `06` line 90. Not `07` | Haiku | FIX_BRIEF "Implementation plan settlements"; this plan 0.2, 0.7, 0.8, Phase 1 "Stand-in grants", Phase 4 "Where the bar shows" | Line edits in those docs | `git diff` limited to the named lines; no `07` file touched |
| P0-R | 0 | Implementation review of Phase 0 | Opus | All P0 diffs; `00` §12 | Findings table in the build log | No blocker or major left open |
| P0-T | 0 | R3 browser runs, one packet per mission | Sonnet | §2.4 R3 row; the mission's walkthrough; the P0-A browser baseline | Run reports with earned-secrets tables | `verify-run.rb` shows progress; every listed R3 check holds as it did in the baseline |
| P1-A | 1a | `phish-rules.js` and tests (`04` N1, N2, N7–N9, N11 runtime, N12) | Sonnet | `04`; `00` §2, §3, §7, §10, §13 | Module, `social-phish-rules` test | Test passes; module has no DOM or global access |
| P1-B | 1a | `social-intel.js`, `grant_fact` action with its toast (`02` N2) | Sonnet | `00` §4, §5; `02` N2 | Module, action case, `social-intel` test | Test passes |
| P1-C | 1a | Mail scheduler and `mailState` client (S9); spikes F3 and F4 first | Opus | `00` §10, §10a, S9; `state-sync.js`; `npc-manager.js:1557-1600` | `systems/mail-scheduler.js`, state-sync changes, `social-mail-scheduler` and `social-mail-state-export` tests | Both tests pass; R4 passes |
| P1-D | 1a | `mailState` server side | Opus | `01` "Persisted mail"; `game.rb:1902-1960`; `games_controller.rb:356`, `:1403-1430` | `merge_mail_state!`, bootstrap, `mail_state_test.rb`, `mail_state_sync_test.rb` | Those two Rails tests and the whole suite pass |
| P1-E1 | 1a | Mail client shell: list, `mail-reader` reading pane, Sent folder, notification, seeded inbox messages, contacts with `revealedBy` (`01` N1 shell, N3, N5, N9, N12 view, N14, N15 inbox seeds); bridge gate after P1-I, P1-W and P1-T0 | Sonnet | `01`; `00` §6 overlay rules, §10a; README Conventions | `minigames/mail-client/` (shell, reader), CSS, `getTestState()` | The reader, Sent and Close rows of `bridge-1a.jsonl` pass under `check-bridge.mjs` |
| P1-E2 | 1a | Composer: template parts, blank picker from held facts, send gate (`01` N10, `04` N11 runtime); after P1-E1 | Sonnet | `01` §2 "Compose"; `00` §10 "Template and slot schema" | Composer code, `social-mail-composer` test (jsdom) | `social-mail-composer` passes (gate disabled with the neutral line, picker offers held facts only, Send enables after the grant). Browser picker checks wait for 1b (P1-T2), because Hampshire has no blanks |
| P1-F | 1a | Mail bridge and device branch design (`01` N2 client writes: drafts on change and before a launch, `metrics` and `phish_<id>_attempts` on send; N4 attachments, N6, N17; device `accountIds`; S14 fixed terminal: placement after the lock check and the locked-pickup rule); after P1-A, P1-C, P1-E2 | Opus | `01` §3; `00` §10; `interactions.js:776-784, 1340, 1355` | Bridge code; a small follow-up edit of P1-W's `mail_terminal` block (after P1-W) moving it after the generic lock check and adding the locked-pickup rule | Bridge-level checks after P1-W: mail opens from the terminal, a send writes a sent record and a job, and `mailState` appears in the next `sync_state` body. Then, after P1-B, P1-D, P1-G and P1-I with `db:seed`, a **Sonnet** tester runs steps 1 to 5 of the 1a playtest |
| P1-G | 1a | Intel board, recon mode (`03` N1 without "From the call", N2, N3, N5); bridge gate after P1-I, P1-W and P1-T0 | Sonnet | `03`; `00` §4, §11 | `minigames/intel-board/`, CSS, `getTestState()` | The board rows of `bridge-1a.jsonl` pass under `check-bridge.mjs` |
| P1-H | 1a | Lints (1a): `04` N3, N10 subset, N11 validator half; `01` N18 subset; `03` N6 recon | Sonnet | Those lists | `scripts/validate_social/mail.rb`, `board.rb`, `validator-social-mail` test | Test passes |
| P1-I | 1a | `test_social_slice` scenario, `"collection": "testing"`, seeded mail, contact, stand-ins | Sonnet | `00` §1, §7, §13 Hampshire rows; `scenarios/lab_tesseract_trials/` as layout model; Phase 1 "The test scenario" | Scenario folder | `--strict-social --no-graph --skip-ink` exits 0 (after P1-W's sprite copies); after `bin/rails db:seed` it lists under "Testing" |
| P1-W | 1a | Wiring for both overlays, on the P5-G pattern; after P1-E1, P1-G and P1-I (code): registration, starters, a `case-file` block and a plain `mail_terminal` block in `interactions.js` that only opens the overlay, CSS links, schema entries, placeholder sprite copies and `preload()` lines (Phase 1 table, "Wiring" row); shared-file blocks only, each file re-read before editing. P1-F later edits the `mail_terminal` block for its lock-check placement and locked-pickup rule | Sonnet | README Conventions checklist; Phase 1a "Wiring" row | Shared-file blocks; `mail_terminal.png`, `case-file.png` | `git diff --stat` limited to those files and blocks; both overlays open from their objects in the slice |
| P1-T0 | 1a | Write `tools/playtest/se/bridge-1a.jsonl` from the §2.2 Phase 1a Bridge row (`eval` booleans, checked by `check-bridge.mjs`); after P1-I and P1-W | Sonnet | §2.2 Phase 1a; `docs/test-bridge.md` | The script | Runs end to end against the slice, with failures expected only where a UI packet is not yet in |
| P1-R | 1a | Slice review | Opus | P1 diffs | Findings | No blocker or major left open |
| P1-T | 1a | Slice playtest; runs `bridge-1a.jsonl` | Sonnet | Phase 1a "Done when"; §2.2 Phase 1a "Bridge" row | Report | Steps 1 to 6 pass; `verify-run.rb --tasks` lists `ready_hampshire` and `hampshire_landed` completed, `tasks_completed` 2; `count-task-posts.sh` counts one per task; `check-bridge.mjs` all true |
| P1-J | 1b | Mail runner and ink jobs (S6, `04` N6) | Opus | `00` §10, S6, S7; `phone-chat-conversation.js:733-790` | `systems/mail-runner.js`, `social-mail-runner` test | Test passes; back-compat 7 |
| P1-K | 1b | Influence bar (S4, `01` N7), mounted in the reading pane and the board's influence section; `resolveInfluenceDisplay` and the `influence.display` lint (README AA) | Sonnet | `00` S4, §8 "How the bar reads it" and `influence.display` | `ui/influence-bar.js`, both mounts, `social-influence-bar` test covering defaults, scenario default, per-character override, `bar: false` and `number: false` | Test passes; both mounts visible in `bridge-1b.jsonl` (after P1-T0b) |
| P1-T0b | 1b | Write `tools/playtest/se/bridge-1b.jsonl` from the §2.2 Phase 1b Bridge row, including the picker and pre-send rows on the Pierce-style target; after P1-O | Sonnet | §2.2 Phase 1b | The script | Runs against the slice |
| P1-L | 1b | Accounts and Create-account (`01` N11); bridge gate after P1-T0b | Sonnet | `00` §10a | Mail client changes | The account rows of `tools/playtest/se/bridge-1b.jsonl` pass |
| P1-M | 1b | Rules extras and remaining lints (`04` N4, N5, N10 rest; `01` N18 rest) | Sonnet | `04`; `01` N18 | Code, extended tests | Extended `social-phish-rules` and `validator-social-mail` pass |
| P1-N | 1b | Narrow layout, accessibility, `withReply` (`01` N13, N17); bridge gate after P1-T0b | Sonnet | `01` "Narrow screens" | CSS and code | At 600 px no horizontal scroll and every control reachable by Tab (bridge script rows) |
| P1-O | 1b | Second test target and its `on_email` ink | Opus | `04` worked example; `00` §10 | Ink and data in `test_social_slice` | inkcheck clean on the compiled story; validator exits 0 |
| P1-T2 | 1b | Review, then playtest, including the bridge half of back-compat item 7: P1-O's story, which declares `se_influence` with an ink fallback, loaded by the phone preload and fired as a bark | Opus, then Sonnet | Phase 1b "Done when"; §2.3 item 7 | Findings; report | No blocker or major open; the 1b playtest steps pass; item 7's bridge half passes |
| P2-A | 2 | OSINT browser overlay (`02` N1, N3–N7); bridge gate after P2-W, P2-C and P2-T0 | Sonnet | `02` | `minigames/osint-browser/`, CSS, `getTestState()` | `tools/playtest/se/bridge-2.jsonl` passes under `check-bridge.mjs`; screenshots as in Phase 2 "Done when" |
| P2-W | 2 | Wiring, after P2-A (code): registration, starter, `osint-workstation` branch, CSS link, placeholder sprite copy and `preload()` line, schema entry; shared-file blocks only | Sonnet | README Conventions checklist; Phase 2 "Files" | Shared-file blocks; `osint-workstation.png` copy | `git diff --stat` limited to those blocks; the browser opens from its object |
| P2-T0 | 2 | Write `bridge-2.jsonl` from the §2.2 Phase 2 Bridge row; after P2-W and P2-C | Sonnet | §2.2 Phase 2 | The script | Runs against the slice |
| P2-B | 2 | OSINT lints and address-bar test (`02` N8, N9) | Sonnet | `02` N8, N9; `00` §11 lint list | `scripts/validate_social/osint.rb`, tests | `social-osint-address-bar` and `validator-social-osint` pass |
| P2-C | 2 | Slice OSINT data replacing the stand-ins | Sonnet | `00` §1 "Discoverable intel" | Scenario edits | Validator exits 0 |
| P2-T | 2 | Review and playtest | Opus, then Sonnet | Phase 2 "Done when" | Findings; report | No blocker or major open; the 1a playtest passes with facts found by browsing |
| P3-A | 3 | Triage scorer and tests (`05` N4, N8) | Sonnet | `05` "The rules / scoring" | `triage-scoring.js`, test | 68% and 86% cases pass |
| P3-W | 3 | Wiring, after P3-B (code): registration, starter block, `triage-workstation` branch, CSS link, placeholder sprite copy and `preload()` line, schema entry; the slice's four-message set and defender board object; shared-file blocks only | Sonnet | README Conventions checklist; Phase 3 "Files" and "Done when" | Shared-file blocks; `triage-workstation.png` copy; slice data | `git diff --stat` limited to those; triage opens from its object |
| P3-T0 | 3 | Write `bridge-3.jsonl` from the §2.2 Phase 3 Bridge row; after P3-W | Sonnet | §2.2 Phase 3 | The script | Runs against the slice |
| P3-B | 3 | Triage UI and `playerSent`, email kind only (`05` N1 email, N2, N3, N7, N9); bridge gate after P3-W and P3-T0 | Sonnet | `05`; `00` §10a | `minigames/inbox-triage/`, CSS, `social-player-sent` test | Test passes; `tools/playtest/se/bridge-3.jsonl` triage rows pass |
| P3-C | 3 | Starter: sync, then emit; reopen (`05` N6) | Opus | `05` "Bridging"; `00` S3, §13 | Starter code, `social-triage-starter`, `social_sync_then_emit_test.rb` | Both tests pass; the blocked-sync and 403 runs pass |
| P3-D | 3 | Board defender mode (`03` N4 defender); bridge gate after P3-W and P3-T0 | Sonnet | `03` "Defender mode"; `00` §1 defender facts | Board changes | Defender rows of the Phase 3 bridge script pass |
| P3-E | 3 | Triage lints (`05` N5, `03` N6 defender) | Sonnet | Those lists | `triage.rb`, `board.rb` additions, `validator-social-triage` test | Test passes |
| P3-T | 3 | Review and playtest | Opus, then Sonnet | Phase 3 "Done when" | Findings; report | No blocker or major open; Phase 3 "Done when" holds |
| P4-A | 4 | `pretext-judge.js` and tests (`06` N1) | Sonnet | `06` §4 | Module, test | Worked examples pass |
| P4-B | 4 | `PretextSession`, bindings, `person-chat-pretext.js` (`06` N2, N3, N7–N9) | Opus | `06` §6; `00` §8, S3 | Code, `social-pretext-session` test | Test passes; back-compat 2 to 8 |
| P4-T0 | 4 | Write `bridge-4.jsonl` from the §2.2 Phase 4 Bridge row; after P4-C and P4-G (code), because it registers `pretext-prep`; registration, starter and `callId` branch blocks for `pretext-prep` are placed by P4-D's design, added as shared-file blocks here | Sonnet | §2.2 Phase 4; Phase 4 "Files" | The script; shared-file blocks | Runs against the slice |
| P4-C | 4 | `pretext-prep` (`06` N5, N6); bridge gate after P4-T0 | Sonnet | `06` Beats 1 and 2; the 1a picker | `minigames/pretext-prep/` | `pretext-prep` rows of `tools/playtest/se/bridge-4.jsonl` pass |
| P4-D | 4 | Lockout checks and lift (S10) | Opus | `00` S10, §8; `interactions.js:1355` | Code, lockout cases in `social-influence` | Tests pass; the refusal-before-prep and one-minute lift steps pass in the slice |
| P4-E | 4 | Influence bar in the person-chat and phone-chat headers; tells panel, phone bubbles, tint; world pip for sprite characters only; the board's "From the call" section (`06` N4, S13, `03` N1) | Sonnet | `06` §4.4; `00` S13; `ui/npc-health-bars.js`; Phase 4 "Where the bar shows" | UI code, `social-influence-pip` test | Test passes; bar and tells visible in both chat headers in the bridge script; pip absent for a character with no sprite and for one with `display.pip: false`; header bar absent with `display.bar: false` while thresholds still fire |
| P4-F | 4 | Pretext lints (`06` N10, N12, including the `reports` threshold on every character with call data) | Sonnet | `06` N10 | `pretext.rb`, `validator-social-pretext` test | Test passes |
| P4-G | 4 | Test call ink and data, with a one-minute test lockout expiry; plus a sprite test character (a person NPC in the slice with an existing walk sprite key, a `social.characters` entry and a person-chat call), so the pip can be shown for a sprite character and absent for the phone-only one | Opus | `06` §4.8; `00` S13 | Slice edits | inkcheck clean; validator exits 0 |
| P4-T | 4 | Review, playtests, R3 again | Opus, then Sonnet | Phase 4 "Done when"; §2.4 | Findings; reports | No blocker or major open; Phase 4 "Done when" and R3 hold |
| P5-A | 5 | Model: scorer, tells, `buildRecord`, `applyScore`, `betterVictim`, `linkInfoFor`, `describeVictimOutcome`, `captureGranted`, closed keys; guard model half (`07` N2, N6b, N10, N11) | Haiku (high effort) | `07` §4, §5 (record shape), §6 model bullet; `00` §11a; the worked examples in `07` §4 | `landing-page-model.js`; `social-landing-page-model` and `-guard` tests | Every N2 fixture case passes; no DOM or global access; the no-`serial|export|download` identifier test passes |
| P5-B | 5 | Renderer: two layers, DOM-safety walk, forbidden-network grep, `--se-font-readable`; guard renderer half (`07` N3, N6b, N8) | Haiku (high effort) | `07` §1 safety, §6 renderer bullet, §8a; `00` §6; P0-L | `landing-page-render.js`; `social-landing-page-render` test | Six states pass the DOM walk; grep clean; homograph drawn raw, not through `displayDashes` |
| P5-C | 5 | Validator lint (`07` N6, N7 id check) in `scripts/validate_social/landing.rb`: punycode encoder, denylist and confusable fold, `scenario-schema.json` entry | Haiku (high effort) | `07` §1 lint bullets, N6, §5; `00` §11 "Lint field list"; P0-J framework; `scripts/validate_scenario.rb:247` | `landing.rb`; `validator-landing-pages` test and `test/js/fixtures/social_landing/` | Every N6 fixture case passes; `--strict-social` exit codes as stated in Phase 5 "Done when" |
| P5-D | 5 | Overlay: steps 1 to 5, Score panel, Attach and Attach anyway, Case file launch, nested launch and close, card display (`07` N1, N7 display, N9) | Haiku (high effort) | `07` §3, §4 strings, §6; P5-A, P5-B; `minigame-manager.js:15,37-45,204-206`; `base-minigame.js:18-23,70-80`; README Conventions | Overlay JS and CSS | Bridge steps 1 to 5 pass; `requiresKeyboardInput: true`; Esc and Close give no `minigame_failed` |
| P5-E | 5 | Step 6 defender inspection: hot-spots, decoy padlock, Show the link target, five-habits card; exports `buildSuspectPage` and `tells` (`07` N5) | Haiku (high effort) | `07` §3 step 6, §4 tells tables, §6 "Inspect" and role rules; P5-D | Code in the overlay folder | Bridge step 6 passes; DOM test still passes in `group` and `img` states |
| P5-F | 5 | Persistence: `se_landing_pages` and `se_landing_drafts` declared with `{}` defaults; shape guard on write and sync; flush size (`07` N4) | Haiku (high effort) | `07` §5 "Stored record" and "Drafts"; `00` §11, §11a; `state-sync.js:13,61`; `siem-dashboard-minigame.js:5,925,941`; P5-A (the closed key sets) | Edits in `state-sync.js` (re-read first); declarations; `social-landing-page-state` test | Guard drops out-of-set keys in its test; bridge step 7 passes |
| P5-G | 5 | Wiring and fixture: the README checklist (`minigames/index.js:18,104,160`; `minigame-starters.js:649-680,923`; `interactions.js:937-967,998`; `core/game.js:1194`; `show.html.erb:40`), the `page-builder` schema entry, the test page in `test_social_slice`, and the Space and E pause check (`07` §6) | Haiku (high effort) | README Conventions checklist; P5-D, P5-F; shared files re-read before editing | Shared-file blocks only; slice fixture page (D5) | `git diff --stat` limited to these files; slice exits 0 under `--strict-social --no-graph --skip-ink` |
| P5-T | 5 | Bridge checks 1 to 8 on :3001 (Phase 5 "Playtest steps"); see D7 for the model | Haiku (high effort) | Phase 5 playtest steps; §1 "Playtests"; P5-G | Run report with pass or fail per step | `verify-run.rb` shows progress; each step recorded |
| P5-R | 5 | Implementation review of Phase 5 | Opus | All P5 diffs; `07` §1 safety list; N6 list | Findings tagged blocker, major or minor, with file:line | No blocker or major open; safety tests read, not only run |
| P6-A | 6 | Lab scenario plan | Opus | `10`; `00`; AGENTS.md "The mission loop" | Plan in the lab folder | Three review rounds closed with no blocker or major open |
| P6-W | 6 | Wiring: registration, starter, `report-workstation` branch, CSS link, placeholder sprite copy and `preload()` line, schema entry; shared-file blocks only; after P6-B and P6-E (code) | Sonnet | README Conventions checklist; Phase 6 "Files" | Shared-file blocks; `report-workstation.png` copy | `git diff --stat` limited to those; the report opens from its object |
| P6-T0 | 6 | Write `bridge-6.jsonl` from the §2.2 Phase 6 rows (report, scope and plan); after P6-W | Sonnet | §2.2 Phase 6 | The script | Runs against the lab |
| P6-B | 6 | Report builder (`10` N1, N2); bridge gate after P6-T0 | Sonnet | `10` N1; `00` §11 | `minigames/engagement-report/` | `social-engagement-report` passes; report rows of `tools/playtest/se/bridge-6.jsonl` pass |
| P6-C | 6 | Board `scope` and `plan` modes (`03` N4); bridge gate after P6-T0 | Sonnet | `03` "Modes"; `00` §11, §13 | Board changes | Scope and plan rows of the Phase 6 bridge script pass |
| P6-D | 6 | `lab_games` label and the Tesseract docs (`10` N6) | Haiku | `10` N6 | Four small edits | `git diff` limited to them |
| P6-E | 6 | Lab scenario build: rooms, objects, data, objectives | Opus | P6-A plan | Scenario folder | Validator exits 0 under `--strict-social --no-graph --skip-ink` |
| P6-F | 6 | Lab ink | Opus | P6-A plan; README_ink_best_practices.md | `ink/` | inkcheck and loopcheck clean over the logged state matrix; dialoguelint cleared or justified |
| P6-G | 6 | Lab-level lints (`10` N7) and `03` N6's step and pick checks for `scope` and `plan` | Sonnet | `10` N7; `03` N6 | `lab.rb`, `board.rb` additions, `validator-social-lab` test | Test passes |
| P6-R | 6 | Implementation review | Opus | P6 diffs | Findings | No blocker or major open |
| P6-T | 6 | L1 to L6 and F1 to F13 | Sonnet, one packet per run | §2.5 | Reports | Each run's checks pass; `verify-run.rb` lists the tasks the run claims |
| P6-S | 6 | Dialogue, design review, room dressing, lighting, character pipeline, POV backgrounds | Per skill | The skills; AGENTS.md "Art and atmosphere" | Per skill | Each stage stops when a cycle finds nothing above minor, at five cycles or up to ten while still improving |
| P6-U | 6 | Cut-order variants | Opus | `10` §4 | Data variants | Validator exits 0 on each |
| P6-V | 6 | Timed blind playtest | Sonnet, fresh | §2.6; student materials only | Timings per stage | 60 to 90 minutes of in-game time, or cuts applied and re-run |
| P7-* | 7 | To be split into named packets before Phase 7 starts. Items to cover: `11` N1 runner; N2 flip view; N3 defend sets; N4 measurement store; N5 facilitated flag; N6 narrow layout; N7 TTS style entry; N8 neutral brand set; N9 profile config; N11 authenticator; N12 voicemail player; N13 `page` card; N14 `qr` and `sms` surfaces; N15 role swap; N16 host NPC; `05` N1 non-email kinds, N10, N11; the check missions; episodes E1, then E5, then E3 | Opus for runner, role swap and content; Sonnet for surfaces and playtests | `11`; `05` | Per packet | Phase 7 "Done when" |
| P8-A | 8 | Lab sheet | Opus | `mission-lab-sheet` skill; the lab | Sheet in HacktivityLabSheets | Audit finds no mismatch |
| P8-B | 8 | Voice audio | Sonnet for checks; generation after the user agrees | `tts-audio` skill | Cached clips | `tts-audio` reports no line without audio |
| P9-deferred | later | Not scheduled; kept so every item is accounted for: `01` N8, the rest of N15, N16; the later half of `00` S14; the `found` account kind; phone identities (`00` §10a). Built for Eldritch Hacker after its universe-bible pass | Opus to plan | Phase 7 "Eldritch Hacker" | none yet | Planned when Eldritch Hacker is scheduled |

## 5. Open questions

Settled on 2026-10-21 (FIX_BRIEF "Implementation plan settlements"), kept here for the record:
`grant_fact` in `applyActions` (Phase 1 "Stand-in grants"); `systems/global-writer.js` (0.2); the
whole `test/js` suite in CI with a named quarantine list (0.7); in the lab the influence bar shows
in the chat header and the pip is only for characters with walk sprites (Phase 4 "Where the bar
shows"; ASSETS UI10); the Cyrillic font files in Phase 0 (0.8); `test_social_slice` with
`"collection": "testing"` (Phase 1 "The test scenario"); the awareness `collection` label is
`training`; builder playtests on Haiku.

Closed in the r10 round:

1. **Lockout expiry in the lab.** Dev's lockout is two real minutes (`06` §4.8 line 223 and 280;
   `00` §8 line 948, `afterMinutes: 2`), so failure run F6 proves the lift in the lab itself. The
   generic table in `06` §4.1 (line 90) gives Priya's ten minutes, which matches `00` §8 line 805;
   `06` line 90 now names both values so the two cannot be read as a conflict.
2. **The send-blocked playtest step.** Hampshire has no blanks (`04` "What each blank offers";
   `pretext_apply` `"slots": []`). The gate is proved in 1a by `social-phish-rules` and the jsdom
   `social-mail-composer` test, and in the browser in 1b on the Pierce-style target.

No question is open now.

### Needs the user

Things no agent does, gathered in one place so the orchestrator can batch them into one question
(AGENTS.md "Asking the user for input"):

- **Commits**: authorised per iteration (2026-10-21); the regenerated `package-lock.json` (P0-K) is
  committed with its iteration.
- **Pushing a branch** so the new CI job runs; CI is proved green only there.
- **`db:seed` on deployed instances**, so `lab_games` (the lab and `lab_tesseract_trials`) and the
  slice's `testing` label take effect. The dev database is seeded by the agents.
- **Each image after batch 1** (batch 1, the new Slice rows, is authorised), and **the Gemini concept portraits and
  POV concepts**, which are metered: scope and cost agreed before any run (ASSETS §8).
- **Voice audio**: words signed off, then the cost agreed, before any TTS (Phase 8).
- **The timed human playtest** of the lab (§2.6): who runs it (the user or a student volunteer),
  and when.
- **The lab sheet's publication** in HacktivityLabSheets and the `lab_sheet_url` going live (Phase 8).
