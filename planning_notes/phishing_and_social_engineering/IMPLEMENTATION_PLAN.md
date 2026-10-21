# Implementation and test plan: social-engineering systems

Status: plan, 2026-10-21. Nothing here is built yet.

This turns the design set in this folder into build phases, tests and work packets. It does not
restate the designs. `designs/00_data_contract.md` is the contract and wins over this file. The
README's "Engine work, consolidated" table is the list of engine items, `SPIKES.md` holds the five
settled engine questions, and `ASSETS.md` holds the art, sound and font rows cited here by id.
`designs/07_landing_page_builder.md` was deliberately not read for this plan. Phase 5 carries only
what the README and `00` say about the builder, plus a section for the builder agent to fill.

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
- **Playtests** run on the keyless server on :3001 (`tools/playtest/start-keyless-server.sh`,
  `PLAYTEST_PORT=3001` with `tools/playtest/new-game.rb`). Never touch the user's server on :3000. A
  run counts only once `tools/playtest/verify-run.rb <game_id>` shows progress on the server.
- **Commits.** Commit as each phase completes, but only when the user asks. Engine first, then the
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
| 0 | Engine groundwork: ink fallbacks, shared writer and `syncConfirmed`, influence service and tags, headless records, validator `--strict-social`, CI, Source Sans 3, return-to | `00` S1–S3, S5, S7, S8, S11, S12; README engine table | nothing | Opus | Node and Rails suites green; m01–m08 regression suite (§2.4) unchanged |
| 1a | Thin slice: mail client, rules engine, intel board, Hampshire only, in `scenarios/test_social_slice` | `01`, `04`, `03`; `00` S6 (text jobs), S9, S14 (fixed terminal) | 0 | Opus (bridge, persistence); Sonnet (UI, pure module) | A Sonnet playtest goes from start to Hampshire landed, through a reload, with `verify-run.rb` showing the task |
| 1b | Mail completion: accounts and Create-account, ink reply jobs and the mail runner, the DOM influence bar, a second (character) test target | `01`, `04`; `00` S4, S6, S8 | 1a | Opus | Pierce-style test target replies from ink, moves influence, and survives a reload |
| 2 | OSINT browser | `02` | 1a (grantFact, board) | Sonnet; Opus review | Slice facts found by browsing instead of stand-ins |
| 3 | Inbox triage; board defender mode | `05`, `03` N4 (defender) | 1a (mail-reader, sent records) | Sonnet (UI, scorer); Opus (sync, then emit) | `playerSent` replay of the slice's own send; triage result survives a reload and completes its task once |
| 4 | Pretext dialogue | `06`; `00` S10, S13 | 0, 1b (bar) | Opus | Dev-style call in a test scenario, all three outcomes, lockout and lift |
| 5 | Landing-page builder | `07` (not read here) | 0 (jsdom, lint framework), 1b (Attach, link kind) | Haiku only | Placeholder; see Phase 5 detail |
| 6 | Student lab | `10` | 1 to 5 | Opus (plan, ink, review); Sonnet (data entry, playtests) | Critical path playable blind in 60 to 90 minutes |
| 7 | Awareness episodes; Eldritch Hacker gated on its bible | `11` | 3, 4, 5, 6 | Opus | E1 shell plays end to end and completes its task once |
| 8 | Lab sheets, then voice audio | `10` OQ5, README R, Z | 6 (and 7 for its own sheets) | Opus (sheet); Sonnet (audio checks) | Sheet audited against the game files; audio only after sign-off |

Phases 2, 3 and 4 can run side by side once 1a is in, split by file (each owns its own minigame
folder; validator edits are serialised, see packet notes in §4). Phase 1b must land before 4 and
5. The lab's triage set (Phase 6) needs both 3 and 5, because its `playerSent` rows read the built
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
| 0.0 | **Baselines** before any edit: validator stdout for every scenario with `--no-graph --skip-ink`, the node test results, `reopencheck` output, and an inkcheck/loopcheck run for each m01–m08 route file. Kept in the build log folder, not the scratchpad, so a later session can diff against them | AGENTS.md "Verifying work" | read-only |
| 0.1 | **Ink externals fall back.** `loadStory` sets `this.story.allowExternalFunctionFallbacks = true` right after the `Story` is built; the ink tools set the same flag; the authoring rule changes from "synced `VAR`s, not `EXTERNAL`s" to "an `EXTERNAL` needs an ink fallback function" | `00` S1; `10` N8 | `systems/ink/ink-engine.js:10-18` (`new inkjs.Story` at 15 and 18); `scripts/ink_runtime_check/voicelines.mjs`, `inkcheck.js`, `reopencheck.mjs`; `README_scenario_design.md:1724` |
| 0.2 | **Shared global writer and confirmed sync.** A new `systems/global-writer.js` (name to confirm; the README places it with `apply-actions.js`) exporting one write function with `emitAlways` and `deferEmit` options and an optional calling-story engine. It writes `gameState.globalVariables`, calls `broadcastGlobalVariableChange`, writes the calling story with the observer detached, and writes a clamped value back to the source story. `applyActions` `set_global` uses it with `emitAlways`. `_syncOnce` returns a boolean, `syncConfirmed({ attempts, onRetry })` is added, and `ApiClient.put` attaches `error.status` | `00` S3, §13 "Sync then emit", "`applyActions` emit" | `systems/apply-actions.js:33-43`; `systems/npc-conversation-state.js` (`broadcastGlobalVariableChange`, observer, `isGlobalVariable` at 362); `state-sync.js:290-302` (`sync`), `:304-319` (`_syncOnce`); `api-client.js:70-72` |
| 0.3 | **Social influence service and the live tag processor.** New `systems/social-influence.js`: watcher on `<character>_influence`, the `se_influence(delta, reason)` write path, thresholds, latch, band flags with `clearOnRearm`, `recoverTo`, forced `report(character, reason)`, `npc_influence_changed`, and the per-run idempotency ledger. New tag cases in `processGameActionTags` for `#influence:N`, `#influence_gained[:reason]`, `#influence_lost[:reason]` and `#report:<reason>`, **only for characters listed in `social.characters`**. The existing `influence_increased` and `influence_decreased` popup cases and `hostile` stay exactly as they are. The lockout's storage fields are written here, but the channel checks that read them are Phase 4 (S10) | `00` S5, §8, §13 "Band flags", "`recoverTo` rule", "Band numbers"; `06` N9 | new `systems/social-influence.js`; `minigames/helpers/chat-helpers.js:24` (`processGameActionTags`; existing cases at 201, 215, 250, 453, 548); `minigames/phone-chat/phone-chat-conversation.js` (shared loader); `person-chat-conversation.js` is not loaded and is not edited |
| 0.4 | **Run-scoped `email_` variables and loader order.** Exclude the `email_` prefix from saved ink variables; every loader sets engine-written variables after restore and sync | `00` S7 | `systems/npc-conversation-state.js:156-162` (`exportNpcInkVariables`), `:229-255` (`recordInkVariables`); `person-chat-minigame.js:497` (restore), `:532`, `:563` (sync); `phone-chat-minigame.js` |
| 0.5 | **Headless records.** One helper, `scenario_npc_records`, returning room NPCs plus `social.characters.*.emailRecord` records, used everywhere a lookup searches only `rooms.*.npcs`. `game.rb` defines `find_npc_in_scenario` twice (645 and 1281; Ruby keeps the later one), so keep one | `00` S8 | `systems/npc-lazy-loader.js`; `core/game.js` start-room registration; `app/controllers/break_escape/games_controller.rb` `find_npc_in_scenario` (about 1966-1990); `app/models/break_escape/game.rb:645`, `:1281`, `:1817` (`scenario_npc_ids`); `scripts/validate_scenario.rb:676-680` (`ink_files_to_check`), `:2345-2355` (phone checks), the KO check near 1110 and the phone-globals check near 2583 |
| 0.6 | **Display-name ties** prefer the conversation's own NPC | `00` S2 | `systems/npc-manager.js` speaker lookup |
| 0.7 | **Validator social framework and CI.** `social` added to `known_top_level`; a `--strict-social` option beside `--no-graph` and `--skip-ink`; a social-lint entry point (suggested `scripts/validate_social.rb`, required from `validate_scenario.rb`), with one file per area under `scripts/validate_social/` (`mail.rb`, `osint.rb`, `board.rb`, `triage.rb`, `pretext.rb`, `landing.rb`, `lab.rb`), so parallel packets in later phases never edit the same file; each returns issues the tests can call in-process. The generic lints arrive now: declared and not-imported influence, latch, band, lockout and `setGlobal` globals; `EXTERNAL` has a fallback; aim `unlockCondition` keys limited to `aimCompleted`, `aimsCompleted`, `globalVariable`, `equals`; object `id`s unique across rooms; a missing sprite for a social object type is an error under `--strict-social`. CI: one new job with Ruby (the existing sqlite apt step, `bundler-cache`, `BUNDLE_BUILD__SQLITE3`) and Node 20; `jsdom` added to `devDependencies`; the `package-lock.json` line removed from `.gitignore`, the lockfile regenerated and committed; `npm ci`; `bundle exec node --test test/js/validator-*.test.mjs test/js/social-*.test.mjs`; the loop over scenarios with a `social` key; `git diff --exit-code`. `package.json` gains `test:social` | `00` S11, §13 "Validator exit", "CI validator loop"; README Objectives row | `scripts/validate_scenario.rb:247` (`known_top_level`), `:4835`, `:4839` (options), `:1695` (sprite check), `:5128-5136` (exit); `scripts/scenario-schema.json`; `scripts/minigame-data-schemas.json`; `.github/workflows/ci.yml` (existing `lint` job from line 9, `test` job from 29); `.gitignore:43`; `package.json` (`scripts` holds only `test` and `test:js` today) |
| 0.8 | **Source Sans 3.** Regular and Bold, Latin and Cyrillic upstream WOFF2 subset files, unmodified, with `OFL.txt`; `@font-face` rules and a `--se-font-readable` custom property in `css/fonts.css`. The Cyrillic files are brought forward from the lab tier, so the font lands in one packet | `00` §6; README X; Fonts row | `public/break_escape/assets/fonts/` (today `gnf`, `PressStart2P`, `PixelifySans`, `pixl8` only); `public/break_escape/css/fonts.css` (linked at `app/views/break_escape/games/show.html.erb:16`) |
| 0.9 | **Return-to for nested overlays.** `startMinigame(scene, container, { returnTo, suspended })`; `endMinigame` calls `returnTo` after `onComplete`, on a normal exit only | `00` S12; README Minigame framework row | `minigames/framework/minigame-manager.js:15` (`startMinigame`, which ends the running one at 33), `:151` (`endMinigame`); `minigames/framework/base-minigame.js` |
| 0.10 | **Overlay helper (optional, decided here).** One small helper for the own Close control, capture-phase Esc, `aborted` handling and a `getTestState()` base for the social overlays, so seven overlays do not each re-implement them. A choice, not a contract item: skip it if the first overlay shows the code is too small to share | README Conventions; `00` §6 "Overlay rules" | new `minigames/framework/social-overlay.js`; `base-minigame.js:18-23, 70-80` (`disableClose`), `getTestState` at about 170 |

**Not in this phase, with the reason.** S4 (influence bar) and S6 (mail runner) arrive in 1b, which
has the first character target to drive them. S9 (mail scheduler, `mailState`) and S14 (mail
devices) arrive in 1a with the mail client, their only consumer. S10 (lockout checks) and S13
(world pip) arrive in Phase 4 with the first call.

**Dependencies.** None. Phase 0 must be committed before any phase that builds on it.

**Assets.** FONT1 to FONT5 (upstream files), FONT6 (existing). No art.

**Models.** Opus for 0.1 to 0.6 and 0.9: they touch every mission's dialogue and sync. Sonnet for
0.7 (the lint list and CI wiring are fully specified), 0.8 and 0.10, each followed by an Opus review.

**Done when.**
- `bundle exec node --test test/js/*.test.mjs` passes, including the new `social-influence`,
  `social-global-writer`, `state-sync-confirmed` and `ink-external-fallback` tests (§2.2, Phase 0).
- `npm run test:social` passes and runs the same social files.
- `bin/rails test` passes, including the new headless-record and sync tests.
- `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json` matches
  the 0.0 baseline.
- For every scenario, `ruby scripts/validate_scenario.rb scenarios/<s> --no-graph --skip-ink`
  prints the same findings as the 0.0 baseline (diffed), apart from new lines raised by the two
  lints that apply to every scenario (aim `unlockCondition` keys, unique object ids). Each such line
  is checked by hand and listed in the build log as a real finding or a false positive; a false
  positive is fixed in the lint, not accepted. `--strict-social` on a scenario with no `social` key
  exits 0. `git status --porcelain` shows no tracked file rewritten.
- The m01 to m08 regression suite R0 to R4 (§2.4) passes.
- The CI job is green on a pushed branch. The user pushes, because no agent pushes.

### Phase 1 — Thin slice: mail client, rules engine, intel board, one target

**Goal.** The core loop (collect, compose, judge, feedback, reply, record), playable from start to
finish against one target, Chris Hampshire, before any other system exists. Phase 1 is split in two
so the slice stays thin: 1a proves the loop with a data-only target, and 1b adds what a character
target needs (ink replies, influence, a second account).

**The test scenario.** `scenarios/test_social_slice/` (`mission.json`, `scenario.json.erb`, `ink/`),
modelled on `scenarios/lab_tesseract_trials/` for a non-VM layout (`secgen_scenario: null`). One
room. It holds a `mail_terminal` with `accountIds: ["guest"]`, one `case-file` with `{ mode: "recon" }`
(texture override `notice_board1`, OBJ3), a placeholder host NPC whose `eventMappings` complete the
tasks, and three readable stand-in objects whose `triggerOnInteract` grant Hampshire's three facts
(`hampshire_careers`, `hampshire_cv_backlog`, `careers_attachment`; the "provides" table in `00` §1,
lines 185 to 187). The `social` block carries the Hampshire `phishTargets` entry, her two pretext templates
(`pretext_apply`, `pretext_enquiry`), the `from_own` template, the greeting and ask parts, the
`kit_cv` payload and the intel facts, all copied from the contract values in `00` §1, §7 and §13,
with no new content. Tasks: `ready_hampshire` (on `target_ready_hampshire`) and `hampshire_landed`
(on `phish_hampshire_landed`). The stand-ins go when Phase 2 lands. The scenario stays afterwards as
the fixture for the Phase 1 regression runs.

**Stand-in grants.** The slice needs a way to grant a fact without the OSINT browser. The plan adds a
`grant_fact { fact }` action to `applyActions` that calls `grantFact`, used from `triggerOnInteract`
(`systems/interactions.js:719`). It is small, testable, and Phase 4's call grants and the awareness
runner can use it as well. If the user prefers no new action type, the fallback is a placeholder
NPC whose ink sets the `se_intel_*` globals with `#set_global`, which skips readiness and notes
(open question 1).

#### 1a. The slice

| Area | Items covered | Files and hook points |
|------|---------------|-----------------------|
| Rules engine | `04` N1 (module and factor library), N2 (slot judge), N3 (empty-string lint), N7 (data-only reply text), N8 (`senderAuth` derivation), N9 (`tells[]`), N11 (pre-send gate), N12 (open check); N10 for the checks Hampshire exercises (template sets cover all four parts, `subjects` with topics and one unopened topic, `distinctiveValues` provided, outcome owner, declared outcome globals) | new `systems/phish-rules.js`, pure, `evaluateMessage(target, message, ctx)` per `00` §3 |
| Intel | `02` N2, brought forward: `grantFact` (flip-only, note, sync) and `evaluateReadiness` (`target_ready_<id>`, `osint_done`); the `grant_fact` action | new `systems/social-intel.js`; `systems/apply-actions.js` (new case beside `set_global` at 33); `window.addNote` at `minigames/notes/notes-minigame.js:835` (unique note ids: timestamp plus counter) |
| Mail client | `01` N1 (list, reading pane, Sent folder, composer; no switcher or Create-account yet), N2 (`mailState` persistence), N3 (Close and `gameResult`), N4 (attachments only; the `link` kind waits for Phase 5), N5 (`mail-reader`, factored out from the start), N6 (judge, sent record, text job; no ink job, no victim record yet), N10 (template composer, blank picker, send gate), N12 (sent record), N14 (notification), N17 (`onSend` timing and the open-check row), N18 (account, mailbox and contact checks) | new `minigames/mail-client/` (`mail-client-minigame.js`, `mail-reader.js`, composer); new `css/mail-client-minigame.css` linked beside `app/views/break_escape/games/show.html.erb:16-19`; register in `minigames/index.js` (the `registerScene` block from 147); starter modelled on `startSiemMinigame` (`systems/minigame-starters.js:649`, window export at 923) |
| Scheduler and `mailState` | `00` S9: text jobs with a wall-clock countdown, jobs change-keyed by ids only; `mailState` as a keyed section with its `pagehide` place; server sanitiser, caps and bootstrap | new `systems/mail-scheduler.js` ticked from the NPC manager loop (`systems/npc-manager.js:1557`; `_checkTimedMessages` at 1572 is the model); `state-sync.js:13` (`KEYED_SECTIONS`), `:107` (`buildPlayerSections`), `:218-227` (the `timedMessages` id-only key, the model), `:259` (`confirm`), `:328` (`flush`); `games_controller.rb:356` (bootstrap, `savedPhoneState` is the model for `savedMailState`), `:1403` (`merge_last_write_wins_sections`), `:1426` (the `phoneState` merge call); `game.rb:1902-1913` (phone caps and `merge_phone_state!`, the model for `merge_mail_state!` and `MAX_MAIL_STATE_BYTES`); `core/game.js` restore |
| Mail device | `00` S14, fixed terminal only: `mail_terminal` added to `PICKUP_THEN_INTERACT_TYPES`; its branch placed after the generic lock check, beside the phone branch, so a locked terminal asks to be unlocked; the pickup block refuses to auto-open a `locked` takeable item | `systems/interactions.js:776-784` (the set and pickup block), `:1340` (lock check), `:1355` (phone branch) |
| Intel board | `03` N1 (people cards, contacts strip, company panel, readiness checklist; no "From the call" section or influence bar yet), N2 (rebuild from globals on open), N3 (show readiness), N5 (Close as a normal exit, return-to); N6 for `readinessSlots` | new `minigames/intel-board/`; new `css/intel-board-minigame.css`; `case-file` branch in `systems/interactions.js`; state in `se_board_state` |
| Wiring, both overlays | Sprites and preload lines; `minigame-data-schemas.json` entries; `requiresKeyboardInput: true`; own Close and capture-phase Esc; `getTestState()` overrides so the test bridge can drive them | `core/game.js` `preload()` (from 66; object lines such as `'pc'` at 292); `scripts/minigame-data-schemas.json`; `minigames/framework/minigame-manager.js:37-45` (keyboard pause) |

**Assets (first-slice rows).** FONT1 to FONT3 (Phase 0); OBJ1 `mail_terminal`, OBJ2 `case-file`,
OBJ3 (reuse `notice_board1`); UI1 to UI7; NPC5 (Hampshire 32x32 headshot); NPC10 (existing avatars
for the seeded benign mail); SFX1 to SFX4; MUS1. Until the user approves each image (one at a time,
PixelLab, made at target size), OBJ1 and OBJ2 start as copies of `pc1.png` and `notice_board1.png`
so the validator's sprite check passes, and NPC5 uses an existing avatar. No image is generated
without the user's sign-off.

**Models.** Sonnet for `phish-rules.js` (the factor table, the worked examples and the named test
file are all specified), the board UI and the composer UI. Opus for the mail bridge, the scheduler,
`mailState` persistence (client and server), and the interaction-branch placement. A fresh Opus
reviewer checks the whole slice before the playtest.

**Done when (1a).**
- `bundle exec node --test test/js/social-phish-rules.test.mjs test/js/social-intel.test.mjs
  test/js/social-mail-scheduler.test.mjs test/js/validator-social-mail.test.mjs` passes, and so does
  the whole `test/js` suite.
- `bin/rails test test/models/break_escape/mail_state_test.rb
  test/controllers/break_escape/mail_state_sync_test.rb` passes, and so does the whole suite.
- `ruby scripts/validate_scenario.rb scenarios/test_social_slice --strict-social --no-graph
  --skip-ink` exits 0, then `git status --porcelain scenarios/` is empty.
- A Sonnet playtest on :3001 (`PLAYTEST_PORT=3001 ... tools/playtest/new-game.rb test_social_slice`)
  shows, step by step: Send is blocked with "A blank needs evidence you haven't found yet" before any
  fact is held; after the three stand-ins, the board shows Hampshire ready and `target_ready_hampshire`
  is true; a `pretext_enquiry` send shows the full checklist at once, with `pretextRelevant` failing
  on her authored line; a reload during the 15-second wait still delivers the reply into the `guest`
  mailbox; a `pretext_apply` send with `kit_cv` lands; `tools/playtest/verify-run.rb <id>` shows
  `hampshire_landed` completed exactly once on the server.
- The bridge checks for both overlays pass (§2.2, Phase 1).

#### 1b. Mail completion for character targets

| Area | Items covered | Files and hook points |
|------|---------------|-----------------------|
| Mail runner and ink jobs | `00` S6 (headless run, the loader's sync steps in order, fresh idempotency ledger per run), ink jobs on the scheduler; `04` N6 (`EvalResult` to `email_*` ink variables) | new `systems/mail-runner.js`, modelled on `PhoneChatConversation._preloadOpeningOnce` (`minigames/phone-chat/phone-chat-conversation.js:733`); binds `se_influence` before the first `Continue()` (`systems/ink/ink-engine.js:138` `bindExternalFunction`) |
| Influence bar | `00` S4, `01` N7: a DOM bar with threshold icons and the number, in the reading pane and the board's influence section | new `ui/influence-bar.js` (name to confirm); used by `minigames/mail-client/`, `minigames/intel-board/`; later by `person-chat-ui.js` and `phone-chat-ui.js` (Phase 4) |
| Accounts | `01` N11: own-account resolution, `unlockedBy`, `createMenu` and the Create-account panel, switcher, `burned_<id>`, unread per mailbox; `01` N9 contacts joined to targets, through the Phase 0 headless records | `minigames/mail-client/` |
| Rules extras | `04` N4 (hint stage per target), N5 (`boostIfGlobal`, `strictIfGlobal` applied to a copy of the target), N10 (the remaining checks: `on_email` declares the `email_*` VARs it reads and `VAR <character>_influence`, calls `se_influence` on both branches, `trusts` ids resolve, `dmarcPolicy` present, closed-target template rules) | `systems/phish-rules.js`; mail bridge; `scripts/validate_social.rb` |
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
- Playtest on :3001: create `freemail`, land Hampshire from it; send a failing then a landing message
  to the character target; the reply comes from its `on_email` knot, the bar moves by the authored
  delta with its reason, and both values survive a reload; `verify-run.rb` shows both tasks once.

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
`scripts/validate_social.rb`. The board's "Case file" button and the browser's return use the
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
- Bridge checks: Space and `E` do nothing while the browser is open; Esc inside the properties panel
  closes the panel first; Close completes with `success: true`, so no `minigame_failed` is logged.
- Screenshots of each page type at 1280 px and 600 px, looked at by the orchestrator (AGENTS.md:
  "look at the screenshots yourself").

### Phase 3 — Inbox triage and the board's defender mode

**Goal.** The defender mirror: sort a mixed inbox, read the authentication results, and see one's
own earlier phish from the receiving side.

**Items.** `05` N1 (minigame: sort, chip list, review cards, result screen, narrow layout; Verify
verdict built but used only by awareness sets), N2 (the shared `mail-reader`, already factored out
in 1a), N3 (factor library and red-flag strings through the `04` resolution rule), N4
(`triage-scoring.js` and its tests), N5 (validator), N6 (result globals, first-attempt guard, sync
then emit, reopen re-emits), N7 (starter with the `stage` parameter and `answers[].ms`), N8 (both
scoring profiles), N9 (`playerSent` kind). `03` N4 for `defender` mode only (`factMitigations`, the
four defender facts in `00` §13), with N6's defender checks. The non-email kinds `call` and `push`
(N10) and the comparison screen (N11) are awareness work, built in Phase 7.

**Sync, then emit** is the one piece of real engine risk here. The starter writes its four globals
with `deferEmit` (Phase 0 item 0.2), awaits `stateSync.syncConfirmed()`, shows "Saving your
result..." while it retries, and only then emits the changed events and its done event. On a reopen
with the done global set and the `conclusionTaskId` task incomplete, it re-emits.

**Files.** New `minigames/inbox-triage/` (`inbox-triage-minigame.js`, `triage-scoring.js`), new
`css/inbox-triage-minigame.css`; `triage-workstation` branch in `systems/interactions.js`; starter
`startInboxTriageMinigame` modelled on `startSiemMinigame` (`systems/minigame-starters.js:649`);
`minigames/intel-board/` gains defender mode; lints in `scripts/validate_social.rb`.

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
  reopen completes the task exactly once (Rails and bridge, §2.2 Phase 3).
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
(world influence pip). From `03` N1: the board's "From the call" section.

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
  offered. Each run includes a reload mid-call, and the bar, pip and log come back from the globals.
- The granted fact appears in the mail composer's blank, and a `strictIfGlobal` on the report global
  makes the character target harder, shown in its checklist.
- Back-compat items 2 to 6 in §2.3 pass again, because this phase touches both chat loaders.

### Phase 5 — Landing-page builder

This plan was written without opening `designs/07_landing_page_builder.md`. Everything below comes
from the README and `00`. The build detail is the builder agent's (a Haiku agent, high effort, model
and effort passed explicitly; README S).

**Position.** Last of the systems (README "Build order", item 5: the most new UI for the least
reuse). It can start once Phase 1b is in and run beside Phases 3 and 4. The lab (Phase 6) needs it
for stage 4 and for the Lord round, and the lab's triage set needs its domain menu for the
`playerSent` rows.

**Dependencies.** Phase 0: return-to (0.9), Source Sans 3 including the Cyrillic files (0.8), the
`social` lint framework (0.7), `jsdom` in CI (0.7). Phase 1b: the mail client's Attach control.

**Engine items the README engine table assigns to it** ("Landing page" row, `07` N1 to N11 with
N6b): the builder; the scorer; the DOM/pixel layered renderer, with text in the readable sans-serif;
persisted pages (`se_landing_pages`); pre-Score drafts (`se_landing_drafts[pageId]`, written on every
change and on close); `linkInfoFor`; the validator lint (allowlist plus denylist, with the ASCII check
on the raw JSON text); a runtime guard. Code location: `minigames/` (new) and
`scripts/validate_scenario.rb` (in this plan, `scripts/validate_social.rb`).

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
jsdom), `test/js/social-landing-page-guard.test.mjs` (runtime guard), plus a validator fixture test
for the brand and host lint (suggested `test/js/validator-social-landing.test.mjs`).

**Assets** (ASSETS.md rows marked "per 07", to be confirmed by the builder agent): OBJ8
`page-builder`, UI22, UI23 (reuse `padlock_32.png`), LOGO1, LOGO4, FONT4, FONT5; LOGO5 and LOGO6 are
later.

**Done when** (outline; the builder agent firms it up): the three named tests and the lint fixture
test pass; the test scenario attaches a scored page to a test target, and the victim record and
capture note appear as `00` §11a says; a forced brand-lint violation in a fixture fails
`--strict-social`.

### Phase 5 detail — to be written by the builder agent

*Left for the builder agent. Expected contents: the `07` N-items mapped to files and hook points; the
renderer and guard design at the level `07` allows; packet split; the asset list confirmed against
`07`; the test cases inside the three named files; the playtest steps for the builder and the Lord
round. The orchestrator folds its packets into §4 once this section is written.*

### Phase 6 — Student lab (`lab_social_engineering`)

**Goal.** The first shippable product: the eight-stage engagement in `10`, fitting one session of
60 to 90 minutes with a target of 75, playable blind from the student materials alone.

**Items.** `10` N1 (engagement report builder), N2 (report reads `mailState.metrics`, the page
record's `victim` and the call globals; no store of its own), N3 (board `scope` and `plan` modes,
which are `03` N4's remaining modes, with N6's step and pick checks), N4 (defender picks, done in
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
branch in `systems/interactions.js`; starter, registration, preload line, schema entry as in 1a;
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
and BG7; UI8 to UI21, UI23; LOGO1 to LOGO4; FONT4, FONT5 (already in from Phase 0); SFX5 to SFX9; MUS2,
MUS3. One image at a time with sign-off; placeholder sprite keys (`female_office_worker_v2` and the
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
- The critical-path runs and failure-branch runs in §2.5 pass, each confirmed by `verify-run.rb`.
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
flushed done event). From `05`: N10 (`call` and `push` kinds) and N11 (comparison screen with the
no-baseline gate).

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
The mail items built for it, and not for the lab, wait here: `01` N8 (reply choices,
`#compose_reply`, `#mail_later`, `deliverAt`), N15 (devices: takeable terminals used from inventory,
seeded mailbox history), N16 (highlights), the `found` account kind (`jed_pc`), and phone identities
(`00` §10a, future work). Spike 3's rule holds for the takeable terminal: a room object with a
scenario-unique `id`.

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
| Node unit tests | `bundle exec node --test test/js/<file>.test.mjs`; the whole suite with `bundle exec node --test test/js/*.test.mjs`; the social subset with `npm run test:social` | `test/js/fixtures/social/` (scenario fragments, compiled test ink) | Every new engine or social test is named `social-*.test.mjs` or `validator-*.test.mjs`, because the new CI job runs only those two globs. **CI runs no node test today** (`.github/workflows/ci.yml` has a `lint` and a Rails `test` job only), so the rest of `test/js` runs locally before each engine commit (AGENTS.md) |
| Validator tests | In-process: `ruby -e 'require "scripts/validate_scenario.rb" ...'`, as `test/js/validator-carry-over.test.mjs:13-23` does, or the CLI with `--no-graph --skip-ink` on a fixture copy in a temp folder | `test/js/fixtures/social_validator/<case>/` (one good and one bad scenario per lint) | Under CI the tests fail, not skip, when Ruby or the gem is missing (`00` S11). The existing validator tests skip when Ruby is absent; the new ones do not |
| Rails tests | `bin/rails test <path>`; whole suite `bin/rails test` | Scenario data built inline in the test, as `test/controllers/break_escape/reload_persistence_test.rb` does on the `ceo_exfil` fixture mission | Never compare with live scenario content |
| Ink tooling | `node scripts/ink_runtime_check/inkcheck.js <file.json> [knot] [VAR=v ...]`, `loopcheck.js <file.json> <knot> [K=V ...]`, `reopencheck.mjs scripts/ink_runtime_check/missions.json`, `dialoguelint.mjs scenarios/<m>/`, `tagdiff.mjs` against the last commit | Route files under `scripts/ink_runtime_check/m0N_routes/` | Compile to the scratchpad, never beside the sources, when someone else is editing |
| Browser bridge checks | `node .claude/skills/playtest-scenario/scripts/playtest-session.js --url <game-url> --headless`, driving `window.__test` (`docs/test-bridge.md`); each new overlay overrides `getTestState()` | `scenarios/test_social_slice/` | Short scripted checks of keyboard, Close and save/restore, run by Sonnet |
| End-to-end playtests | The `playtest-scenario` skill on :3001, scripts split into 10 to 15 minute runs, each followed by `tools/playtest/verify-run.rb <game_id>` | Game from `tools/playtest/new-game.rb <mission>` with `PLAYTEST_PORT=3001` | Testers keep an earned-secrets table; anything typed from a guide or set by console is "exercised, not earned" |
| Sync regression | `node tools/playtest/sync-state-regress.js <game url> <server log>` | an existing mission | Proves change-only sync still holds after a new section or writer |

### 2.2 Tests per phase

**Phase 0**

| Kind | Test | Asserts |
|------|------|---------|
| Node | `social-global-writer.test.mjs` | `emitAlways` emits on a same-value write (the `applyActions` contract); change-only writes emit only on a change; `deferEmit` emits nothing and returns events only for changed names; the broadcast writes only into cached stories that declare the variable; the calling story is written with the observer detached; an out-of-range ink write is clamped and written back |
| Node | `social-state-sync-confirmed.test.mjs` | `_syncOnce` returns `true` after `confirm()` and when there is nothing to send, `false` on `{ stale: true }` and on a thrown error; `syncConfirmed()` retries with back-off (fake timers), stops at the attempt cap, stops at once on a 403 carrying `error.status`, and shares one queued run with a concurrent `sync()` |
| Node | `social-ink-fallback.test.mjs` | A compiled fixture that declares `se_influence` with an ink fallback loads with nothing bound and returns the fallback value; a bound function overrides it; a fixture with no fallback still throws (documents the rule the lint enforces); a story that declares only the six existing externals behaves as before |
| Node | `social-influence.test.mjs` | Threshold effects fire once per crossing; the latch; band flags recomputed on every change and cleared at `at + rearmMargin`; `recoverTo`; `report()` runs the `reports` effects; the ledger returns the stored result for a repeated `(runId, turn, function, id)`; `npc_influence_changed` fires once per change |
| Node | `social-tag-processor.test.mjs` | For a `social.characters` entry, `#influence:N`, `_gained`, `_lost` and `#report` write through the service. For any other NPC, `#influence:-100` writes nothing; `#hostile` still calls the hostile path; `#influence_increased` and `#influence_decreased` still show their popups; `#set_global` on an imported read-only name is still refused |
| Node | `social-ink-vars.test.mjs` | `email_*` names never reach `recordInkVariables` or `exportNpcInkVariables`; engine-written variables are set after restore and sync in both chat loaders |
| Node | `social-return-to.test.mjs` | `returnTo` runs after `onComplete` on a normal exit only; a `suspended` parent ignores the `onComplete(false, null)` fired when the child starts; the keyboard pause survives the hand-back (spike 5) |
| Validator | `validator-social-framework.test.mjs` | `social` is a known top-level key; `--strict-social` exits 1 on a social lint error and 0 on a clean fixture and on a scenario with no `social` key; the `EXTERNAL`-fallback lint; aim `unlockCondition` keys; duplicate object ids; a missing sprite for a social object type fails under `--strict-social` only; the run leaves the fixture folder's files unchanged |
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
| Node | `social-mail-state-export.test.mjs` | `mailState` is a keyed section; in the `pagehide` flush it comes right after `globalVariables` and is dropped, not truncated, when over the 60 KB budget; a message and the job that produced it are confirmed together |
| Validator | `validator-social-mail.test.mjs` | The `01` N18 checks Hampshire's data touches (accounts, mailboxes, contacts, `mail_terminal.accountIds`) and the `04` N10 subset; the pre-send line cannot be replaced by scenario text (`04` N11); empty authored strings fail (`04` N3) |
| Rails | `test/models/break_escape/mail_state_test.rb` | `merge_mail_state!` caps: 200 messages per mailbox, 4000 characters per body, 50 jobs, one draft per account, `MAX_MAIL_STATE_BYTES` total; trim order (oldest read seeded inbox mail, then replies, then sent), never unread mail or a pending job; over the total, the previous state stands; unknown keys stripped |
| Rails | `test/controllers/break_escape/mail_state_sync_test.rb` | `mailState` sits in `merge_last_write_wins_sections`, so a stale request cannot overwrite it; bootstrap returns `savedMailState`; a grant's `se_intel_*` global round-trips through `sync_state` |
| Rails | extend `test/integration/unlock_system_test.rb` | A locked takeable `mail_terminal` declared in a room's `objects` with a unique `id` unlocks whether or not it is in the inventory; one that exists only in an NPC's `itemsHeld` gets "Object not found" (spike 3, documented) |
| Rails | extend `test/integration/task_set_global_test.rb` | A task completed by the host NPC's mapping after `phish_hampshire_landed` completes once; a second `complete_task` is a no-op and the score does not change; an early completion is accepted (spike 5, documented) |
| Bridge | mail client and board | Space and `E` do nothing while open (player position unchanged, no second minigame); Tab reaches every control in order; Esc closes an open picker first, then the overlay; the own Close control works; the mail client's Close with nothing sent completes with `{ aborted: true }` and records nothing; the board's Close completes with `success: true` and no `minigame_failed`; a mail draft, a pending reply and the board state survive a reload |
| E2E | Phase 1a "Done when" script | — |

**Phase 1b**

| Kind | Test | Asserts |
|------|------|---------|
| Node | `social-mail-runner.test.mjs` | A headless run restores, syncs, then sets the `email_*` variables; uses a fresh ledger; binds `se_influence`; the `email_` variables never reach `exportNpcInkVariables` |
| Node | `social-influence-bar.test.mjs` (jsdom) | Threshold icons are paired with words; the number is always printed; the bar redraws on `npc_influence_changed`; the score region is `aria-live="polite"` |
| Node | extend `social-phish-rules` | `boostIfGlobal` and `strictIfGlobal` act on a copy; the `EvalResult` to `email_*` mapping table |
| Validator | extend `validator-social-mail` | A character target's `on_email` declares the `email_*` VARs it reads and its influence VAR, and calls `se_influence` on both branches; `createMenu` ids unique; `acct_<id>`, `acct_<id>_choice` and `phish_<id>_attempts` declared |
| Bridge | mail client | The account switcher and Create-account panel by keyboard; Esc order picker, then panel, then overlay; layout at 600 px has no horizontal scroll |
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

**Phase 5.** The three named tests and the lint fixture (Phase 5 section); detail from the builder
agent.

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

`00` §12 ends with a back-compat checklist. Each item becomes a test that runs on every engine
commit from Phase 0 onwards.

| # | Checklist item (`00` §12) | Enforced by |
|---|---------------------------|-------------|
| 1 | `applyActions` `set_global` still emits `global_variable_changed` on every call, same value or not | `social-global-writer` "same value emits again"; plus a one-off Haiku audit of the scenarios that map `global_variable_changed` (19 scenario files today: m01 to m08, sis01 to sis03, `lab_tesseract_trials`, `chat_minigame_demo` and six test scenarios), listing any mapping that relies on a re-set value, which then gets a targeted browser check |
| 2 | m01 Derek (`#hostile`, then `#influence:-100`) still turns hostile through `#hostile` | `social-tag-processor` with Derek's tag sequence (`m01_derek_confrontation.ink:303-305`); browser run R3-m01 |
| 3 | m02 guards and ward nurse are not turned hostile by ink arithmetic | `social-influence` "non-social NPC: no watcher, no threshold effect"; browser run R3-m02 |
| 4 | m04 Vance and m05 Patricia pairs need no change | `tagdiff.mjs` shows no change to any m04 or m05 ink in an engine commit; browser runs R3-m04 and R3-m05 (the `#influence_increased` and `#influence_decreased` popups still show) |
| 5 | `neye-eve.json` is untouched | `git diff --exit-code scenarios/ink/neye-eve.json scenarios/ink/neye-eve.ink` in the pre-commit check; the worked example is a new copy |
| 6 | A story with none of the new externals or variables loads with no warning | `social-ink-fallback` loads every compiled m01 to m08 story through `InkEngine` with a console spy and compares the warnings with the Phase 0 baseline (none new) |
| 7 | A story that declares the new externals loads from the phone preload, the bark path and a dry run | `social-ink-fallback` fixture through the three loaders (with the bark loader's `InkEngine` usage at `systems/npc-manager.js:1206` and `:2079`); a bridge check in `test_social_slice` that opens the phone preload and fires a bark |
| 8 (added) | Stories that already declare `EXTERNAL`s (m02 11 files, m03 7, m04 7, m07 1) behave exactly as before on every loader | `social-ink-fallback` loads each through the chat and bark paths and compares outcome with the baseline; turning fallbacks on must not change a story that has no fallback functions |

### 2.4 Regression suite for the shipped missions m01 to m08

The Phase 0 changes (tag processor, ink fallbacks, the shared writer, `deferEmit` and
`syncConfirmed`, `stateSync` sections) run in every mission, so the suite below guards them.
Influence tags are used beyond the campaign as well: `#influence_increased` and
`#influence_decreased` appear 65 times across m05 and m06 and in the lab instructors and sis01, and
`#influence:-100` once, in m01.

| Id | What | Command or method | When |
|----|------|-------------------|------|
| R0 | Static, per mission | `ruby scripts/validate_scenario.rb scenarios/<m> --no-graph --skip-ink` diffed against the Phase 0 baseline (no tracked file written; checked with `git status --porcelain`); ink compiled to the scratchpad; `dialoguelint.mjs` with no new findings; inkcheck and loopcheck over each `scripts/ink_runtime_check/m0N_routes/` route file; `reopencheck.mjs scripts/ink_runtime_check/missions.json`; `tagdiff.mjs` showing no ink change in an engine-only commit | Every engine commit |
| R1 | Node suite | `bundle exec node --test test/js/*.test.mjs` (existing tests such as `phone-reopen-and-persistence`, `global-sync-declared`, `state-sync`, `person-chat-reopen`, the `engine-fixes-*` files, plus every new test) | Every engine commit |
| R2 | Rails suite | `bin/rails test` | Every engine commit |
| R3 | Short Sonnet browser runs on :3001, 10 to 15 minutes each, each with a reload | m01: Derek's hostile route and Kevin's `#hostile:kevin_park`; the opening phone briefing. m02: guard and ward nurse conversations that change values, with none turning hostile; a phone chat and a bark from a story that declares `EXTERNAL`s. m03 and m04: a person chat and a bark from an `EXTERNAL` story; the m04 Vance pair. m05: Patricia, Lisa, Owen and Dr Halloran popups and the Patricia pair. m06: Irina's popups and a `global_variable_changed` mapping. m07: its `EXTERNAL` story. m08: a global mapping chain. One quick lab instructor (`lab_scanning`) and one sis01 popup check | Phase 0; after 1b (tick loop and sync); after 4 (both chat loaders); before the Phase 6 commit |
| R4 | Sync regression | `node tools/playtest/sync-state-regress.js` on m01 and m05: the reload round-trip and the idle request count are unchanged, and no `mailState` key appears in the request body of a mission with no mail | Phase 0; 1a; 3 |

Each R3 run ends with `verify-run.rb` and an earned-secrets table. A failure goes back to the
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
| F6 | The Dev call is reported: report global and lockout set; the desk phone refuses before `pretext-prep`; the student turns to the builder; the lift after the authored expiry (if the expiry is too long for a run, prove the lift in `test_social_slice`) |
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
  task completion (spike 5). Fine for a lab. Anything reported to a third party, as the awareness
  product would be, needs a server path first (README Conventions).

**Spikes still worth doing, in order.** Each is short, read-only against the repo, with its
experiments in the scratchpad.

1. **Calling-story write into a live chat** (before 0.2): open a person chat and a phone chat in the
   browser, write a declared global from outside, and check the open story reads the new value on
   its next line with no observer echo.
2. **Fallbacks on for every shipped story** (before 0.1 is merged): load every compiled m01 to m08
   story through the chat, phone-preload and bark paths with the flag on and off, and diff the
   results. Spike 4 proved the mechanism, not the absence of side effects.
3. **The scheduler in a background tab** (before 1a's scheduler): does the NPC manager loop at
   `systems/npc-manager.js:1557` keep ticking while the tab is hidden, and at what rate? This decides
   whether the countdown is ticked or computed from a stored wall-clock deadline.
4. **`mailState` size at the lab's real volume** (before 1a's flush work): serialise six seeded
   messages plus a full student's sends and jobs and measure them against the 60 KB budget.
5. **Return-to and the keyboard pause** (with 0.9): a child overlay launched from a parent that set
   `requiresKeyboardInput` must leave the world paused when control returns to the parent, and
   unpause only when the parent closes.
6. **Font loading for any canvas text** (with 0.8): if any social text is drawn on the Phaser canvas
   (spike 1 notes the font must be loaded first), check `document.fonts.load` before the first draw.
   DOM overlays do not need this.

## 4. Work packets

Each packet fits one subagent. "Inputs" are the files to give it, besides the build brief and this
plan; "Gate" is what the orchestrator checks before accepting it (grep or read the lines for every
claimed fix). Every implementation packet ends with its tests passing and `git diff --stat` limited
to its own files. Reviews are read-only, run by a fresh Opus agent, and tag findings blocker, major
or minor with file:line.

Notes that hold for the table:
- Packets in the same phase run in parallel unless a "after" note says otherwise. Agents that touch
  a shared file (`systems/interactions.js`, `minigames/index.js`, `systems/minigame-starters.js`,
  `core/game.js`, `show.html.erb`, `scripts/minigame-data-schemas.json`) add only their own block and
  re-read the file just before editing.
- Validator lints go in the packet's own `scripts/validate_social/<area>.rb` (0.7).
- Image generation is never inside a packet. Each asset is a separate request to the user.

| Id | Phase | Scope | Model | Inputs | Outputs | Gate |
|----|-------|-------|-------|--------|---------|------|
| P0-A | 0 | Baselines (0.0) | Sonnet | AGENTS.md "Verifying work"; this plan §2.4 | Baseline files in the build log folder | Files present; `git status` clean apart from them |
| P0-B | 0 | Spikes 1 and 2 (§3) | Opus | `00` S1, S3; SPIKES.md §4 | Findings in the build log | Each answer cites file:line and a scratchpad experiment |
| P0-C | 0 | Ink fallbacks and tooling flag (0.1) | Opus | `00` S1; `ink-engine.js`; the three ink tools; README_scenario_design.md:1724 | Code, `social-ink-fallback` test, rule edit | Back-compat 6 to 8 pass; R0 reopencheck unchanged |
| P0-D | 0 | Shared writer, `applyActions` on it (0.2, writer half); after P0-B | Opus | `00` S3; `apply-actions.js`; `npc-conversation-state.js` | `systems/global-writer.js`, `social-global-writer` test | Back-compat 1 passes; R1 green |
| P0-E | 0 | Boolean `_syncOnce`, `syncConfirmed`, `error.status` (0.2, sync half) | Sonnet | SPIKES.md §2 (code given); `state-sync.js`; `api-client.js` | Code, `social-state-sync-confirmed` test | R4 on m01 unchanged |
| P0-F | 0 | Influence service (0.3, service half); after P0-D | Opus | `00` §8, S5, §13 band rows; `06` N9 | `systems/social-influence.js`, `social-influence` test | Tests pass; no import from shipped code paths except the tag processor |
| P0-G | 0 | Tag processor cases (0.3, tags half); after P0-F | Opus | `chat-helpers.js:24-560`; `00` §8 "Influence tags" | Code, `social-tag-processor` test | Back-compat 2 to 4; R3-m01 Derek |
| P0-H | 0 | `email_` exclusion and loader order (0.4) | Opus | `00` S7; `npc-conversation-state.js`; both chat minigames | Code, `social-ink-vars` test | R1 green, `person-chat-reopen` and `phone-reopen-and-persistence` included |
| P0-I | 0 | Headless records, client and server (0.5, 0.6) | Opus | `00` S2, S8; the files in 0.5 | Code, `scenario_npc_records_test.rb`, ink endpoint test | R2 green; validator baseline diff empty |
| P0-J | 0 | Validator social framework and generic lints (0.7, lint half) | Sonnet | `00` S11, §11 "Lint field list" (framework only), §13 "Validator exit" | `scripts/validate_social.rb`, area stubs, `validator-social-framework` test | Baseline diff limited to the reviewed new lines (Phase 0 "Done when") |
| P0-K | 0 | CI job, jsdom, lockfile, `test:social` (0.7, CI half); after P0-J | Sonnet | `00` S11 CI text; `ci.yml`; `.gitignore:43`; `package.json` | Workflow job, committed lockfile on the user's say-so | `npm ci && npm run test:social` locally; CI green once pushed |
| P0-L | 0 | Source Sans 3 (0.8) | Sonnet | `00` §6; ASSETS §5; SPIKES.md §1 licence notes | Font files, `OFL.txt`, `css/fonts.css` rules | Files byte-identical to upstream; a test page renders `раураl` from the bundled face |
| P0-M | 0 | Return-to and overlay helper (0.9, 0.10); spike 5 | Opus | `00` S12; `minigame-manager.js`; `base-minigame.js` | Code, `social-return-to` test | `modal-stack-escape` and `session-overlay-pause` tests still pass |
| P0-R | 0 | Implementation review of Phase 0 | Opus | All P0 diffs; `00` §12 | Findings table in the build log | No blocker or major left open |
| P0-T | 0 | R3 browser runs, one packet per mission | Sonnet | §2.4 R3 row; the mission's walkthrough | Run reports with earned-secrets tables | `verify-run.rb` progress; no behaviour change against baseline |
| P1-A | 1a | `phish-rules.js` and tests (`04` N1–N3, N7–N9, N11, N12) | Sonnet | `04`; `00` §2, §3, §7, §10, §13 | Module, `social-phish-rules` test | Test passes; module has no DOM or global access |
| P1-B | 1a | `social-intel.js`, `grant_fact` action (`02` N2) | Sonnet | `00` §4, §5; `02` N2 | Module, action case, `social-intel` test | Test passes |
| P1-C | 1a | Mail scheduler and `mailState` client (S9); spikes 3 and 4 first | Opus | `00` §10, §10a, S9; `state-sync.js`; `npc-manager.js:1557-1600` | `systems/mail-scheduler.js`, state-sync changes, two tests | R4 passes; tests pass |
| P1-D | 1a | `mailState` server side | Opus | `01` "Persisted mail"; `game.rb:1902-1960`; `games_controller.rb:356`, `:1403-1430` | `merge_mail_state!`, bootstrap, Rails tests | `bin/rails test` green |
| P1-E | 1a | Mail client UI and `mail-reader` (`01` N1, N3, N5, N10, N12, N14) | Sonnet | `01`; `00` §6 overlay rules; README Conventions | `minigames/mail-client/`, CSS, `getTestState()` | Bridge checks (§2.2, 1a) |
| P1-F | 1a | Mail bridge and device branch (`01` N4 attachments, N6, N17; S14 fixed terminal); after P1-A, P1-C, P1-E | Opus | `01` §3; `00` §10; `interactions.js:776-784, 1340, 1355` | Bridge code, interaction branch, starter, preload line | Slice playtest steps 1 to 4 by hand in a scratch run |
| P1-G | 1a | Intel board, recon mode (`03` N1–N3, N5) | Sonnet | `03`; `00` §4, §11 | `minigames/intel-board/`, CSS | Bridge checks |
| P1-H | 1a | Validator: mail, rules and board subsets (`01` N18, `04` N10 subset, `03` N6 recon) | Sonnet | Those lists | `scripts/validate_social/mail.rb`, `board.rb`, tests | `validator-social-mail` passes |
| P1-I | 1a | `test_social_slice` scenario | Sonnet | `00` §1, §7, §13 Hampshire rows; `scenarios/lab_tesseract_trials/` as layout model | Scenario folder | `--strict-social --no-graph --skip-ink` exits 0 |
| P1-R | 1a | Slice review | Opus | P1 diffs | Findings | No blocker or major left open |
| P1-T | 1a | Slice playtest and bridge checks | Sonnet | Phase 1a "Done when" | Report | `verify-run.rb` shows `hampshire_landed` once |
| P1-J | 1b | Mail runner and ink jobs (S6, `04` N6) | Opus | `00` §10, S6, S7; `phone-chat-conversation.js:733-790` | `systems/mail-runner.js`, test | `social-mail-runner` passes; back-compat 7 |
| P1-K | 1b | Influence bar (S4, `01` N7) | Sonnet | `00` S4, §8 "How the bar reads it" | `ui/influence-bar.js`, test | `social-influence-bar` passes |
| P1-L | 1b | Accounts and Create-account (`01` N9, N11) | Sonnet | `00` §10a | Mail client changes | Bridge checks |
| P1-M | 1b | Rules extras and remaining lints (`04` N4, N5, N10; `01` N18 rest) | Sonnet | `04`; `01` N18 | Code, tests | Tests pass |
| P1-N | 1b | Narrow layout, accessibility, `withReply` (`01` N13, N17) | Sonnet | `01` "Narrow screens" | CSS and code | 600 px screenshot check |
| P1-O | 1b | Second test target and its `on_email` ink | Opus | `04` worked example; `00` §10 | Ink and data in `test_social_slice` | inkcheck clean; validator exits 0 |
| P1-T2 | 1b | Review, then playtest | Opus, then Sonnet | Phase 1b "Done when" | Findings; report | As stated there |
| P2-A | 2 | OSINT browser overlay (`02` N1, N3–N7) | Sonnet | `02` | `minigames/osint-browser/`, CSS | Bridge checks; screenshots |
| P2-B | 2 | OSINT lints and address-bar test (`02` N8, N9) | Sonnet | `02` N8, N9; `00` §11 lint list | `scripts/validate_social/osint.rb`, tests | Tests pass |
| P2-C | 2 | Slice OSINT data replacing the stand-ins | Sonnet | `00` §1 "Discoverable intel" | Scenario edits | Validator exits 0 |
| P2-T | 2 | Review and playtest | Opus, then Sonnet | Phase 2 "Done when" | Findings; report | As stated there |
| P3-A | 3 | Triage scorer and tests (`05` N4, N8) | Sonnet | `05` "The rules / scoring" | `triage-scoring.js`, test | 68% and 86% cases pass |
| P3-B | 3 | Triage UI and `playerSent` (`05` N1–N3, N7, N9) | Sonnet | `05`; `00` §10a | `minigames/inbox-triage/`, CSS | Bridge checks |
| P3-C | 3 | Starter: sync, then emit; reopen (`05` N6) | Opus | `05` "Bridging"; `00` S3, §13 | Starter code, Node and Rails tests | Blocked-sync and 403 runs |
| P3-D | 3 | Board defender mode (`03` N4 defender) | Sonnet | `03` "Defender mode"; `00` §1 defender facts | Board changes | Bridge checks |
| P3-E | 3 | Triage lints (`05` N5, `03` N6 defender) | Sonnet | Those lists | `triage.rb`, tests | Tests pass |
| P3-T | 3 | Review and playtest | Opus, then Sonnet | Phase 3 "Done when" | Findings; report | As stated there |
| P4-A | 4 | `pretext-judge.js` and tests (`06` N1) | Sonnet | `06` §4 | Module, test | Worked examples pass |
| P4-B | 4 | `PretextSession`, bindings, `person-chat-pretext.js` (`06` N2, N3, N7–N9) | Opus | `06` §6; `00` §8, S3 | Code, session test | Back-compat 2 to 8 |
| P4-C | 4 | `pretext-prep` (`06` N5, N6) | Sonnet | `06` Beats 1 and 2; the 1a picker | `minigames/pretext-prep/` | Bridge checks |
| P4-D | 4 | Lockout checks and lift (S10) | Opus | `00` S10, §8; `interactions.js:1355` | Code, tests | F6-style run in the slice |
| P4-E | 4 | Tells panel, phone bubbles, tint, pip (`06` N4, S13) | Sonnet | `06` §4.4; `00` S13; `ui/npc-health-bars.js` | UI code, pip test | Screenshots |
| P4-F | 4 | Pretext lints (`06` N10, N12) | Sonnet | `06` N10 | `pretext.rb`, tests | Tests pass |
| P4-G | 4 | Test call ink and data | Opus | `06` §4.8 | Slice edits | inkcheck clean |
| P4-T | 4 | Review, playtests, R3 again | Opus, then Sonnet | Phase 4 "Done when"; §2.4 | Findings; reports | As stated there |
| P5-* | 5 | To be split by the builder agent | Haiku (high effort) | README; `00` §11a, §13; `07` | Phase 5 detail section, then code | Named tests (Phase 5) |
| P6-A | 6 | Lab scenario plan | Opus | `10`; `00`; AGENTS.md "The mission loop" | Plan in the lab folder | Three review rounds closed |
| P6-B | 6 | Report builder (`10` N1, N2) | Sonnet | `10` N1; `00` §11 | `minigames/engagement-report/` | `social-engagement-report` passes |
| P6-C | 6 | Board `scope` and `plan` modes (`03` N4) | Sonnet | `03` "Modes"; `00` §11, §13 | Board changes | Bridge checks |
| P6-D | 6 | `lab_games` label and the Tesseract docs (`10` N6) | Haiku | `10` N6 | Four small edits | `git diff` limited to them |
| P6-E | 6 | Lab scenario build: rooms, objects, data, objectives | Opus | P6-A plan | Scenario folder | Validator exits 0 |
| P6-F | 6 | Lab ink | Opus | P6-A plan; README_ink_best_practices.md | `ink/` | inkcheck, loopcheck, dialoguelint |
| P6-G | 6 | Lab-level lints (`10` N7) | Sonnet | `10` N7 | `lab.rb`, test | Test passes |
| P6-R | 6 | Implementation review | Opus | P6 diffs | Findings | Clean |
| P6-T | 6 | L1 to L6 and F1 to F13 | Sonnet, one packet per run | §2.5 | Reports | `verify-run.rb` |
| P6-S | 6 | Dialogue, design review, room dressing, lighting, character pipeline, POV backgrounds | Per skill | The skills; AGENTS.md "Art and atmosphere" | Per skill | About five cycles each |
| P6-U | 6 | Cut-order variants | Opus | `10` §4 | Data variants | Validator exits 0 on each |
| P6-V | 6 | Timed blind playtest | Sonnet, fresh | §2.6; student materials only | Timings per stage | 60 to 90 minutes, or cuts applied |
| P7-* | 7 | Runner; check missions; `05` N10, N11; E1; then E5; then E3 with N15 and N11 | Opus for runner, role swap and content; Sonnet for surfaces and playtests | `11`; `05` | Per episode | Phase 7 "Done when" |
| P8-A | 8 | Lab sheet | Opus | `mission-lab-sheet` skill; the lab | Sheet in HacktivityLabSheets | Audit clean |
| P8-B | 8 | Voice audio | Sonnet for checks; generation after the user agrees | `tts-audio` skill | Cached clips | No line without audio |

## 5. Open questions

Each has a working default, so none blocks Phase 0.

1. **Stand-in grants for the slice.** Default: a new `grant_fact { fact }` action in `applyActions`,
   used from `triggerOnInteract`, which later serves call grants and the awareness runner too. The
   alternative is a placeholder NPC that sets `se_intel_*` with `#set_global`, which skips readiness
   and notes. Neither the README nor `00` names an `applyActions` action for grants.
2. **Where the shared writer lives.** Default: a new `systems/global-writer.js`, with `apply-actions.js`
   calling it. The README places the work in `apply-actions.js`; a separate module is easier to test
   and import from the chats and the mail runner.
3. **CI coverage of the existing Node suite.** CI runs no Node test today, and the new job runs only
   `validator-*` and `social-*`. Default: leave the rest of `test/js` as a local pre-commit step, as
   now. Adding it to CI would catch more, but it is a change beyond this plan.
4. **The world influence pip in the lab.** ASSETS UI10 says the pip is for "Dev only in the lab",
   but Dev is phone-only with no walk sprite (`10` §8), and `00` S13 skips characters with no sprite.
   So the pip would never draw in the lab. Default: build S13 in Phase 4 (awareness and Eldritch
   Hacker have sprites), test it in the slice, and leave UI10 to the user's call.
5. **Font tier.** Default: all four Source Sans 3 subset files land in Phase 0, although ASSETS puts
   the Cyrillic pair in the lab tier. The upstream files are unmodified downloads, so there is no art
   cost.
6. **`test_social_slice` on the missions list.** `db/seeds.rb` seeds every scenario folder with a
   `scenario.json.erb`, so the test scenario will appear as a mission, as the other test scenarios
   do. Default: accept that, with a plain `display_name` and the same `collection` as the existing
   test scenarios.
7. **The human timed run.** The blind AI run is a screening estimate (§2.6). Who runs the timed
   human session (the user, or a student volunteer), and when?
8. **Lockout expiry in the lab.** This plan did not check the authored expiry for Dev. If it is
   longer than a short playtest allows, F6 proves the lift in the test scenario instead.
9. **Pushes and deployed seeds.** The CI job is proved green only on a pushed branch, and the
   `lab_games` label needs `db:seed` on deployed instances. Both are the user's to do.
10. **Awareness `collection` label** (README open question). Default: the existing `training`
    label, settled before Phase 7.
