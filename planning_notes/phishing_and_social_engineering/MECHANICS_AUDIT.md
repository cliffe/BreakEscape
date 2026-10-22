# Mechanics audit: social-engineering systems

Date: 2026-10-22. Read-only audit, made on the user's direction (SE_BUILD_LOG "User direction
(2026-10-22)"): every new mechanic fully featured and well tested before any polish. Nothing in the
code was edited.

Sources: `IMPLEMENTATION_PLAN.md` (phases, §2 tests, §3 risks, §4 packets, §5), designs `00` to `06`
(the "New engine work" tables and `00` §12 S1 to S15), `SE_BUILD_LOG.md`, `build_log/*`, and
`scenarios/lab_social_engineering/playtests/*.md`. `07` (builder) was not opened, because
`SE_BUILD_BRIEF.md` keeps it to the builder's own agents. The builder rows below come from the plan's
"Phase 5 detail" (written from `07`) and from the code and tests.

Status words: **done** = implemented, with a Node or Rails test and a bridge or playtest proof;
**done, unit only** = implemented and Node-tested, never proved in the browser; **untested** =
implemented, no test; **partial**; **deferred** (with where to).

## 0. What was run for this audit

- Node 18.19.1, each file in its own process (`bundle exec node --test test/js/<file>`), because the
  whole-directory run has the IPC flake. 50 `social-*` files: 617 pass, 0 fail, 0 skip. 7 social
  validator files (`validator-social-*`, `validator-landing-pages`): 117 pass, 0 fail. Per-file
  logs: scratchpad `se-audit/`.
- Rails: `mail_state_test`, `mail_state_sync_test`, `social_sync_then_emit_test`,
  `scenario_npc_records_test`, `headless_give_test`, `filtered_scenario_test`, `npc_ink_loading_test`,
  `unlock_system_test`, `task_set_global_test`, `games_controller_test`, `missions_controller_test`:
  174 runs, 613 assertions, 0 failures.
- Validator: `ruby scripts/validate_scenario.rb scenarios/<s>/scenario.json.erb --strict-social
  --no-graph --skip-ink` on `test_social_slice` and `lab_social_engineering`: both exit 0, no errors,
  no tracked file rewritten.
- Bridges were not re-run. Their last results are in the log (1a 38, 1b 82, 2 15, 3 32, 3b 8, 3c 4,
  4 30, 5 29, 6 35, r4-door 3).
- Only two scenarios carry a `social` key: the slice and the lab.

## 1. Per-mechanic table

### Summary

| # | Mechanic | Designed items | Done | Unit only / untested | Partial | Deferred | Open residuals | README documented | Schema / lint |
|---|----------|----------------|------|----------------------|---------|----------|----------------|-------------------|---------------|
| M1 | Shared global writer and sync | `00` S3, S9 (save half), P1-S | all | — | — | — | 1 MB trim vs confirmed state (P1-D) | no | n/a (engine) |
| M2 | Influence service and bar | `00` S4, S5, S13, §8; `01` N7; `06` N4 (bar), N9; README AA | S4, S5, N7, N9 | S13 pip (unit only); `mirrorToBehavior` (unit only); `display.bar:false` in a chat (unit only) | — | — | none blocking | no | lints yes; `influence.display` checked; no schema |
| M3 | Mail client, accounts, scheduler, runner, `mailState` | `01` N1–N18; `00` S6, S9, S14 | N1–N7, N9–N14, N17 | mail-channel lockout refusal (untested) | N15, N18 | N8, N15 rest, N16 → P9-deferred | T2-7, 1 MB trim, notes return | no | lints yes; no schema |
| M4 | Rules engine | `04` N1–N12 | all | `boostIfGlobal` (no scenario uses it) | — | — | none | no | lints yes; `hintsByFactor` unlinted; no schema |
| M5 | OSINT browser | `02` N1–N9 | all | — | — | — | lab data notes only | no | lints yes; schema yes |
| M6 | Intel board, four modes | `03` N1–N6 | N1–N6 | — | defender `indicators` step | — | readiness shown before a needed call fact (L4, logged) | no | lints yes; no schema for `intelBoard`/`engagement` |
| M7 | Inbox triage | `05` N1–N11 | N2–N9 (email kind) | Verify verdict (built, unused) | N1 | N1 non-email kinds, N10, N11 → Phase 7 | `triage_percent` overwrite | no | lints yes; no schema |
| M8 | Pretext calls | `06` N1–N12; `00` S10 | N1–N3, N5–N12, S10 phone | pip, person and mail lockout, lift in the slice, tint (unit or untested in browser) | N4 | role swap → `11` N15 | OQ4; F9; phone history preview | no | lints yes; no schema |
| M9 | Landing-page builder and victim view | `07` N1–N11, N6b | all | 600 px real render | — | — | guard duplicated by rule | no | lints yes; schema yes |
| M10 | Engagement report | `10` N1, N2 | both | — | — | — | row order after reload | no | `lab.rb`, `board.rb`; `labelBy` unlinted |
| M11 | Validator areas | `00` S11, area N-lists | 8 area files | — | schema covers 2 of 13 `social` keys | — | id uniqueness on `id` only | `--strict-social` not in README | — |
| M12 | Test bridge and playtest harness | plan 0.11, §2.1 | `getTestState` on 7 overlays and phone chat; `check-bridge.mjs`; 10 bridge scripts; `verify-run --tasks`; `count-task-posts.sh` | — | harness bugs | — | 5 harness items blocked | `docs/test-bridge.md` silent on social overlays | — |

**Reuse beyond the lab.** All twelve mechanics work from data, and their `--strict-social` lints run
on any scenario with a `social` key. None of their config is documented for authors:
`README_scenario_design.md` has no entry for `social`, `phishTargets`, `mailClient`, `templates`,
`intelFacts`, `intelBoard`, `engagement`, `triageSets`, `pretextNpcs`, `landingPages`,
`characters`, `influence.display`, `lockedHint`, `grant_fact` or `--strict-social`. Its only social
lines are the `EXTERNAL` fallback rule (line 1861) and the room-type table. `scenario-schema.json`
describes only `social.landingPages` and `social.osint`, and `social` allows extra properties, so a
mistyped key in the other eleven blocks passes the schema silently. No third scenario has been built
from the docs, so reuse is unproven.


## Findings in brief (from the audit agent's report; the per-mechanic sections are still to be written)

- **Test results:** Node per file: 50 `social-*` files, 617 pass; 7 validator files, 117 pass. Rails: 11 files, 174 runs, 0 failures. `--strict-social` exits 0 on the slice and the lab. Bridges were not re-run; their last logged results all passed.
- **Missing Rails extensions from §2.2:**
  - `unlock_system_test` (locked takeable `mail_terminal`);
  - `task_set_global_test` (`hampshire_landed` once, repeat no-op, early completion);
  - `missions_controller_test` (`lab_games`).
- **Proved in Node only, never in a browser:**
  - the world pip;
  - `display.bar:false` in a chat;
  - lockout refusals on the person and mail channels;
  - the slice's one-minute lockout lift;
  - `mirrorToBehavior`;
  - `boostIfGlobal` (no scenario uses it).

  The lab fix round 8 fixes were Node-only until R7 confirmed them in the browser.
- **Deferred features:**
  - mail `01` N8 (reply choices), the rest of N15, N16 (highlights, Add to Notepad) and the `found` account → P9-deferred;
  - triage non-email kinds, N10 and N11 → Phase 7;
  - the board's defender `indicators` step (optional in the design) → not built.
- **Open residuals:**
  - the 1 MB server trim can drop mail the client thinks is saved (P1-D);
  - a created account isn't pushed to other open mail clients (T2-7);
  - report rows reorder after a reload (`report-model.js:136`, `Object.keys` order);
  - a later failed triage round overwrites `triage_percent`;
  - object-id uniqueness is checked on `id` only, not `name`;
  - Ruth's phone-list preview shows her oldest line (R5 F4);
  - the `quiet` flag can swallow a reopened greeting (D9);
  - OQ4 (a report recovering without a lockout) is still open.
- **Reuse is unproven:**
  - README_scenario_design.md documents none of the social config: `social`, `phishTargets`, `mailClient`, `triageSets`, `pretextNpcs`, `landingPages`, `influence.display`, `lockedHint`, `--strict-social`.
  - The schema covers only `landingPages` and `osint`, and `social` allows extra keys.
  - The late options are unlinted: `hintsByFactor`, `labelBy`, `checklistTiming`, `mirrorToBehavior`.
- **Harness:**
  - The `clickControl`, `lock` and `bootstrap` fixes are being applied now (user approved, 2026-10-22).
  - The fixed window size and the uncaptured toasts are still open.
  - `docs/test-bridge.md` does not cover the social overlays.
- **CI:** the node job has never run (main is about 236 commits ahead of origin). Its quarantine list misses `social-mail-runner`, `event-mapping-unlock-door` and `session-overlay-pause`.
- **Back-compat (§2.3/§2.4):** done only in part.
  - The full R3 browser suite ran after Phase 0 and after Phase 4.
  - No run covers the later shared-engine changes: the phone-chat forced reopen, `doors.js` `lockedHint`, the `game.rb` filter, the `interactions.js` branches.
  - The §2.3 item 1 audit of `global_variable_changed` mappings has not been done.

## Work packets (ranked)

### Must-have
| # | Packet | Model | Depends | Proof |
|---|---|---|---|---|
| M1 | CI runner that runs each test file in its own process, with an updated quarantine list | Sonnet | – | CI script green locally; the quarantine list matches the observed flakes |
| M2 | Back-compat catch-up: §2.4 R3/R4/R0 browser regression on m01–m10, plus the §2.3 item 1 `global_variable_changed` mapping audit | Sonnet (runs), Opus (audit) | M1 | Per-mission results logged; no regression |
| M3 | Social schema plus the missing lints (`hintsByFactor`, `labelBy`, `checklistTiming`, `mirrorToBehavior`, closing `social` to unknown keys) | Opus | – | Validator tests for each option; a typo fails |
| M4a | Author docs for the general mechanics (influence, board, triage, report, OSINT, `lockedHint`, `--strict-social`) in README_scenario_design.md; back-port contract additions into `00` | Opus | M3 | Docs reviewed against the code |
| M4b | Author docs for the attack-shaped mechanics (mail composer and targets, rules factors, pretext calls, landing pages) | opus48 | M3 | Docs reviewed against the code |
| M5 | Browser proofs: world pip, `display.bar:false`, lockout refusals on person and mail channels, the slice's lockout lift | Sonnet | harness fixes | Bridge checks committed and passing |
| M6 | Mail persistence residuals: server trim versus client "saved" (P1-D); a created account reaching other open clients (T2-7) | opus48 | – | Rails and Node tests on the real paths |
| M7 | Small correctness residuals: report row order, the `triage_percent` overwrite, object-id `name` uniqueness, the Key Ring wrong-key hint | Sonnet | – | Tests per item |
| M8 | Builder: render at a true 600 px; one source for the domain guard | opus48 | harness viewport | Bridge at 600 px |
| M9 | Harness: viewport setting, toast capture, a test-bridge doc section for the social overlays | Sonnet | harness fixes | Live check |
| M10 | Missing Rails tests (`unlock_system`, `task_set_global`, `missions_controller` `lab_games`) | Sonnet | – | Tests pass |
| M11 | Reuse proof: a small third scenario built only from the docs | Opus | M4a, M4b | Validates `--strict-social`; one playthrough |

### Nice-to-have
- The P9-deferred mail items (N8 reply choices, the rest of N15, N16, the `found` account).
- The Phase 7 triage items (non-email kinds, N10, N11).
- The defender `indicators` step.
- Free-text flavour.
- The phone-chat history preview and `quiet` persistence (engine; m01–m10 risk).
- The R-01 speaker tie (the user's decision).
- OQ4, or a server-side results record.
