# Grounding: SE plan status and where deduction fits (2026-10-22)

Read-only survey by a Sonnet Explore agent, saved by the orchestrator as input for the deduction
plan. Paths are relative to `planning_notes/phishing_and_social_engineering/` unless they start with
`scenarios/`, `tools/`, `test/`, `scripts/` or `public/`. **Verify any claim against the code before
relying on it.**

## Key points

- `designs/12_deduction_board.md` is the design proposal; nothing else in the SE plan mentions deduction.
- **Numbering:** next free engine item is **S16** (`00` §12 holds S1–S15). N-items are per doc, so
  doc 12 starts at N1. Validator lints live one file per area in `scripts/validate_social/`
  (existing: `awareness`, `board`, `lab`, `landing`, `mail`, `options`, `osint`, `pretext`, `triage`);
  deduction adds `deduction.rb`. M-numbers (M1–M11) belong to `MECHANICS_AUDIT.md`.
- `../eldritch_hacker/FRESH_CONTEXT_PROMPTS.md` still calls "doc 12" the removed m01 "Soft Entry"
  fold-in; stale text, number free in practice.
- Global prefixes in use: `se_*`, `target_ready_*`, `phish_*`, `pretext_*`, `triage_*`,
  `episode_<id>_*`, `landing_*`. `deduction_*` is free.

## IMPLEMENTATION_PLAN.md: how it is run (`:20-73`)

- Kind of game stated in every prompt. Phases 1–6 build a lab (no VMs, no combat,
  `"disableAttacks": true`); Phase 7 awareness; Licence to Hack gets none of it.
- Orchestrator keeps `docs/agents/SE_BUILD_BRIEF.md`, `SE_BUILD_LOG.md`, `docs/agents/RESUME.md`.
- Engine phases: implement → static checks → fresh Opus implementation review → Sonnet bridge checks
  and playtests → fix → confirm. Builder moved to `opus48` (`SE_BUILD_LOG.md:17`).
- Static checks: `node --test` on touched tests; `bin/rails test` for server changes;
  `ruby scripts/validate_scenario.rb <dir> --strict-social --no-graph --skip-ink`; ink compile;
  `dialoguelint.mjs`; inkcheck/loopcheck; `check_door_alignment.py`; `git diff --stat` for scope.
- Playtests on keyless :3001 (`tools/playtest/start-keyless-server.sh`;
  `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb <mission>`
  after `bin/rails db:seed`); a run counts only once `verify-run.rb <game_id>` shows progress.

## Phase status (build log is authoritative; plan header "Nothing built" is stale)

| Phase | Status 2026-10-22 |
|---|---|
| 0 engine groundwork | Closed: global writer, `syncConfirmed`, influence service and tags, headless records, `--strict-social`, CI |
| 1a/1b mail, rules, board | Closed |
| 2 OSINT, 3 triage + defender board, 4 pretext | Closed |
| 5 landing-page builder | Built and wired; P5-T/P5-R pending at last resume line |
| 6 student lab | Built; fix rounds through R6; playtests and design cycles in progress |
| 7 awareness episodes | Built in waves (`PHASE7_PACKETS.md`); suite 22/22; Eldritch Hacker held |
| 8 lab sheets, audio | Not started |
| P9-deferred | Eldritch-only items, not scheduled (`:1205`) |

## Packet format (§4, `IMPLEMENTATION_PLAN.md:1087-1205`)

- One packet per subagent. "Inputs" = files to give it besides brief and plan. "Gate" = what the
  orchestrator checks. Every implementation packet ends with its tests passing and `git diff --stat`
  limited to its files. Reviews are read-only fresh Opus, blocker/major/minor with file:line.
- "After X" = X's code landed with unit tests passing (not X's gate). A wiring packet runs after the
  code of the overlay it wires (`minigames/index.js` uses static imports).
- Shared files (add your own block only, re-read before edit): `systems/interactions.js`,
  `minigames/index.js`, `systems/minigame-starters.js`, `core/game.js`, `show.html.erb`,
  `scripts/minigame-data-schemas.json`.
- Lints in `scripts/validate_social/<area>.rb`. Image generation never inside a packet.
- Table: `Id | Phase | Scope | Model | Inputs | Outputs | Gate`. Ids `P<phase>-<letter>`; suffixes
  `-W` wiring, `-T0` bridge script, `-T` review+playtest, `-R` review, `-S` skills, `-M` polish.
  `PHASE7_PACKETS.md:208` richer variant: Packet, Scope, Files, Interfaces, Model, Depends, Test.

## Test layers (§2.1, `:822-832`)

1. Node: `bundle exec node --test test/js/<file>.test.mjs` or `npm run test:social`; names
   `social-*.test.mjs` / `validator-*.test.mjs`; fixtures `test/js/fixtures/social/`.
2. Validator tests: fixtures `test/js/fixtures/social_validator/<case>/` (good and bad per lint).
3. Rails tests inline, never live content.
4. Ink tooling: inkcheck, loopcheck, reopencheck, dialoguelint, tagdiff.
5. Browser bridge: `node .claude/skills/playtest-scenario/scripts/playtest-session.js --url <game-url> --headless < tools/playtest/se/bridge-<x>.jsonl`, scored by `check-bridge.mjs`; overlays override `getTestState()`. Register in `tools/playtest/se/run-suite.sh` JOBS; results `SUITE_RESULTS.md`.
6. End-to-end playtests (playtest-scenario skill), `verify-run.rb`, earned-secrets table.
7. Sync regression `node tools/playtest/sync-state-regress.js`.

Back-compat checklist §2.3 (`:945-961`), eight items incl. `set_global` emits on every call; m01
Derek hostile via `#hostile`; m02 guards not turned hostile by ink arithmetic; m04/m05 influence pairs.
Regression R0–R4 (§2.4). Deduction must add: new effects and KO hook are no-ops without
`social.deduction`.

## Where deduction slots in

A new phase after Phase 7 (call it Phase 10 / packets `P10-*`, or `D-*`):
1. Engine stage now: evaluator, schema, lints, board mode, `test_social_deduction` (testing collection).
2. Mission stage later: use case B (corporate, no combat) can follow soon; A, C, D wait for the
   universe-bible pass with P9-deferred.

Dependencies (built): `grantFact` / `grant_fact` action (`00` S15), intel board `case-file` with
`minigameData.mode` (enum `scope|plan|recon|defender`, `00:1775`), influence service
`systems/social-influence.js`, `--strict-social`, global writer with `deferEmit`/`syncConfirmed`.
Needs adding: `deduction` member under `social` (closed schema `00:2115`, `scripts/scenario-schema.json`),
`deduction` field on intelFacts, `deduction` mode value in `minigame-data-schemas.json`.

## Data contract notes (`designs/00_data_contract.md`)

- §1 fact shape `{ text, subject, source, provides[], reduceNote? }` (`:118-179`). Every fact's
  `se_intel_<id>` global declared default false.
- §5 (`:554-605`): `grantFact` writes on false→true flip only, emits `intel_collected`, adds a note,
  runs `evaluateReadiness`. Overlays modal; board reads persisted globals on open. Rich state uses one
  object global (`se_board_state` pattern).
- §8 influence (`:792-817`): `social.characters.<id>.influence { global, min, max, start }`,
  `thresholds[] { id, at, icon, effects[] }`, effects `setGlobal`, `endConversation`, `lockout`,
  `combatHostile` (opt-in), `toast`; tags `#influence:N`, `#influence_gained/_lost[:N][:reason]`,
  `#report:<reason>` (social characters only).
- §11 (`:1693-1780`): `social` members list; lint field list; pointers table (`case-file` `{ mode }`).
- §12 (`:1990-2010`): `# | Item | Where in code`, S1–S15; §14 "Contract additions made during the build".
- §13 settled values incl. "No generated text".

## Intel board (`designs/03`)

Modes `recon|scope|plan|defender`, one case-file object per mode. Readiness is computed at grant
time by `evaluateReadiness`, not by the board; slots phrased as gaps, never the answer.
Accessibility (`03:225-245`): list of cards, single column under ~700px, no dragging, buttons with
Tab/Enter and 44px targets, `aria-live="polite"`, ✓/✗ always with words, Source Sans 3. Overlay
wiring checklist (`03:150-180`): `requiresKeyboardInput: true`, `disableClose: true` with own Close and
Escape (never `minigame_failed`), task completion keyed on a global, not `minigame_completed`.

## Other

- DECISIONS_PENDING: none. SPIKES, MECHANICS_AUDIT, IMPL_REVIEW_MECHANICS: nothing on suspects, KO,
  verdicts, endings. M3: closed `social` schema.
- `combatHostile` opt-in, unused by SE characters (`designs/06:92`); legacy `#hostile` and the -50
  auto-hostile default stay for non-social NPCs.
- Eldritch Hacker (`../eldritch_hacker/DIRECTION.md`): provisional narrative; browser-only; objectives
  include identifying cult members; physical kit reintroduced; monsters real, encounter mechanics
  undecided (`:104`); "fun and educational, not hard" (`:50`); Incident Simulations separate and
  corporate (`:81-83`).
- Test-scenario recipe: `scenarios/test_social_<x>/` with `scenario.json.erb` + `mission.json`
  (`"collection": "testing"`, `"secgen_scenario": null`, "Not a mission."), `disableAttacks`,
  one room, declared globals, a manual objective, a `social` block, sprites for every object type;
  then `bin/rails db:seed`. Closest model: `test_social_board_indicators`
  (`bridge-board-indicators.jsonl`). KO reference: `scenarios/test_ko_countdown`.
- Open: whether the evaluator must be ported to Ruby for the validator, or called via node.
