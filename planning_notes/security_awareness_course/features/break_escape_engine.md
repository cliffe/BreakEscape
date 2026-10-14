# Break Escape engine features (BE)

The engine and in-game UI work the awareness course needs, one section per feature in `features/README.md` (BE-01 to BE-21). The ids are fixed. Each section says why the course needs the feature, what the engine already has (with paths), a design concrete enough to estimate, acceptance criteria, dependencies, and risks.

Paths: `JS/` is `public/break_escape/js/`. `game.rb` is `app/models/break_escape/game.rb`, `mission.rb` is `app/models/break_escape/mission.rb`, and "the controller" is `app/controllers/break_escape/games_controller.rb`. Line numbers are as found in October 2026.

## Rules that cut across every feature

1. **One evidence record.** Every assessed decision, check answer, milestone and policy acknowledgement is a BE-01 record. The debrief (BE-02), the learner's record (HA-05), the dashboards (HA-09) and the xAPI feed (BE-14) are all built from it, never from separate bookkeeping.
2. **The client says what happened; the server decides what it means.** Ink and minigames report a behaviour id and the option the learner took. The server holds the rating map and the answer keys, as it already does for flags (`filtered_scenario_for_bootstrap` strips `targetFlags` and flag values, `game.rb` around line 714).
3. **Both routes, one record.** The game and the text route (BE-03) run the same ink, fire the same tags and write the same records. A feature that only works on the canvas is not finished.
4. **Voiced lines never print a variable** (`AGENTS.md`, standing rule of 2026-10-04). The TTS cache is keyed on the exact text, voice, style, language and model (`app/services/break_escape/tts_service.rb`, `cache_key_for`), so organisation values (BE-05), counts (BE-02), banked names (BE-13) and remembered facts (BE-17) appear on screen, never in speech. `scripts/ink_runtime_check/dialoguelint.mjs` already enforces this for ink (`voiced-variable` rule).
5. **Accessible by default.** New UI is semantic HTML with keyboard support, focus handling, text equivalents and no time pressure, following `features/accessibility_and_inclusion.md`. BE-04 fixes the existing shell; it does not excuse new work.
6. **Reuse before building.** Each design names the existing system it extends. Several features are mostly wiring: BE-19 generalises the `#clone_keycard` return-to-conversation pattern, BE-01 copies the command board's grow-only log, BE-13 uses the ERB randomisation every scenario already has.

## Summary

| Id | Feature | Priority | Size | Depends on | Modules that drive it |
|---|---|---|---|---|---|
| BE-01 | Assessed decisions | MVP | M | none (MG-20 for check items) | Every module; the model is core_01's C01-B1 to C01-B9 |
| BE-02 | Debrief screen | MVP | M | BE-01 | Every module; core_01's threat-by-threat debrief |
| BE-03 | Text route player | MVP | L | BE-01, BE-19, BE-08, BE-12 | Every module (10 to 15 minute text route) |
| BE-04 | Accessibility baseline | MVP | L | proposed pause and time scale | Every module |
| BE-05 | Organisation profile in game | MVP | M | HA-11 | core_00, core_01, core_04, core_05, core_06, core_16 and every reference card |
| BE-06 | Localisation | P3 | L | BE-05, BE-13 | All modules, later |
| BE-07 | Micro-drill launcher | P2 | M | BE-01, BE-13, BE-19, BE-03 shell | core_01 "Phish or Fine?" and every micro-drill in the catalogue |
| BE-08 | Visual aids in conversations | MVP | M | BE-05 (cards) | EX-01 in every module; core_01's annotated hook email |
| BE-09 | Intranet terminal | MVP | M | BE-05, BE-01, HA-07 | core_00, core_01, core_16, every Reference beat |
| BE-10 | Spot-the-risk mode | P2 | M | BE-01, BE-04 | core_10, core_06, core_09, sector_01 |
| BE-11 | Role switch | P2 | M | proposed place-player action | EX-06 interludes: core_01 alternative, core_02, core_10, core_12 |
| BE-12 | Short sessions and resume | MVP | M | BE-01, proposed place-player action | Every module; field staff on phones |
| BE-13 | Content banks and randomisation | P2 | M | BE-01 | core_01 email bank, core_17 annual edition, MG-20 banks, BE-07 |
| BE-14 | xAPI statements | P2 | M | BE-01 | HA-10, HA-22 |
| BE-15 | Facilitated group mode | P2 | M | BE-01, proposed pause and time scale | Every facilitated version; role_01 |
| BE-16 | Time skips and consequence scenes | P2 | S | proposed pause and time scale | core_01, core_07, core_11 |
| BE-17 | Cross-module memory | P3 | M | BE-01 | core_17, core_04 |
| BE-18 | Work task and interruptions | MVP | M | BE-01, BE-19, BE-13 | core_01 (10:00 schedule), core_02, core_09, core_11, role_02 |
| BE-19 | Open minigames from conversations and events | MVP | S | none | core_01 hook and check question; every EX-01 check |
| BE-20 | Authorable tutorial, title screen and end screen | MVP | M | BE-05, BE-02 | Every module |
| BE-21 | Workplace music and sound | P2 | S | BE-04 (sound captions) | Every module |

Suggested build order for Phase 0: BE-19 and BE-01 first (they unlock the mentor's check question and every record), then BE-05, BE-08 and BE-09 (the Learn and Reference beats), BE-20 and BE-18 (the opening and the Apply beat), BE-12 and BE-02, with BE-03 and BE-04 running alongside from the start because every new screen has to work in both routes.

### BE-01: Assessed decisions

**Priority and size:** MVP, M (the top end of M: a client recorder, a server table and endpoint, validator checks and the per-outcome summary).

**Why:** The course sells on evidence. Every module's `assessment.md` lists assessed behaviours (core_01 has nine, C01-B1 to C01-B9), each tied to learning outcomes and rated Secure, Developing or Not yet, plus critical behaviours that must be shown before the module counts as complete. The debrief (BE-02), the learner's record (HA-05), the organisation dashboard (HA-09), the text route (BE-03) and the xAPI feed (BE-14) all need the same per-decision data. Today nothing records a decision as such.

**What exists today:**

- Story state lives in global variables, synced both ways with ink and sent to the server every 30 seconds and on page hide (`JS/state-sync.js`; keyed sections at line 13). The server keeps only current values (`game.rb`, `merge_global_variables!`, around line 230), so a choice that is later overwritten leaves no trace.
- Task completions are stored with timestamps in `player_state['objectivesState']` (`game.rb`, `complete_task!`, around line 1223) and drive a hidden score of 70% tasks and 30% aims (`calculate_task_score`, line 47).
- A precedent for a recorded, time-stamped log: the command board recorder (`JS/minigames/command-board/command-board-timeline.js`, `CommandBoardRecorder`, around line 291) records entries with game time from game start, is created in `JS/core/game.js` (around line 1045), and is merged on the server as a grow-only list that keeps each entry's earliest time (`game.rb`, `merge_command_board_log!`, around line 1596; the controller's `merge_grow_only_sections`).
- Ink tags are processed in one place, `processGameActionTags` (`JS/minigames/helpers/chat-helpers.js`, line 22), for both person-chat and phone-chat. There is no assessment tag.
- `JS/systems/ink/ink-engine.js` line 63 maps choices to `{ text, index }` and drops ink's choice tags, although the bundled inkjs supports them (`public/break_escape/assets/vendor/ink.js`, ink format version 21).
- Minigames emit `minigame_completed` and `minigame_failed` with a free-form `result` (`JS/minigames/framework/base-minigame.js`, line 96), with no behaviour or outcome attached.
- Server-side answer checking already exists for flags and flag stations (`POST /games/:id/flags`), and answers are stripped from what the client receives.
- The engine tells its host when a game completes through `BreakEscape.configuration.on_game_complete` (`lib/break_escape.rb`, line 19; fired from `game.rb`, `fire_completion_callback`).

**Design:**

*The assessment map lives in the scenario, not the ink.* Each module's `scenario.json.erb` gets an `assessment` block generated from `assessment.md`:

```json
"assessment": {
  "moduleId": "core_01",
  "outcomes": { "C01-LO5": "Report a suspicious email through the organisation's route" },
  "behaviours": {
    "C01-B4": {
      "title": "Handles the authority survey",
      "outcomes": ["C01-LO1", "C01-LO3", "C01-LO5"],
      "beat": "apply",
      "options": { "reported": "secure", "ignored": "developing", "signed_in": "not_yet" },
      "unanswered": { "option": "ignored", "closeOn": "global_variable_changed:apply_done" },
      "effective": "latest"
    },
    "C01-B6": {
      "title": "Advises Leo after his slip",
      "outcomes": ["C01-LO5", "C01-LO6"],
      "beat": "apply",
      "options": { "report_and_call": "secure", "change_password": "developing", "keep_quiet": "not_yet" },
      "effective": "latest"
    }
  },
  "critical": [
    { "id": "C01-CB1", "label": "Reports a phishing email", "anyOf": [
      { "behaviour": "C01-B1", "rating": "secure" }, { "behaviour": "C01-B2", "rating": "secure" } ] }
  ],
  "pairs": [["C01-B1", "C01-B2"]]
}
```

`effective` says which record counts when a behaviour is recorded more than once: `first` (baselines such as the hook), `latest` (the default) or `best`. An optional `appliesWhen` is a globals condition in the existing syntax (`JS/utils/conditional-text.js`); when it is false at close time the behaviour is recorded as `not_applicable` (core_01's C01-B7, which only applies to players who clicked). The rating map and `critical` rules are stripped from the bootstrap scenario, like `targetFlags`.

*What gets tagged.* Content reports a behaviour id and an option key, never a rating:

- **Ink:** `#assess:C01-B6:report_and_call`, on the first line of output after the choice (this works with today's tag pipeline, and the text route sees it the same way). Phase two forwards choice tags from `ink-engine.js` so the tag can sit on the choice itself. Tags are handled by a new `assess` case in `processGameActionTags`.
- **Minigames:** a shared API, `window.assessment.record({ behaviour, option, source })`, plus a declarative `assess` block in minigame configs. For example an MG-01 message carries `"assess": { "behaviour": "C01-B2", "onAction": { "report": "reported", "sign_in": "signed_in", "delete": "deleted" } }`. Knowledge check items (MG-20) record `check_item` entries; the chosen option ids go to the server, which grades them against keys the client never receives, the same pattern as flag submission.
- **Events and timers:** event mappings and scenario timers gain an `assess` field, and `applyActions` gains `{ "type": "assess", "behaviour": "...", "option": "..." }` (`JS/systems/apply-actions.js`), so a timer can record "ignored" when an email goes unhandled.
- **Closing behaviours:** when a behaviour's `unanswered.closeOn` event fires and no record exists for it in this attempt, the recorder writes the default option. This is how "ignored it" and "never reported" get recorded without the author tracking every path.

*Record kinds.* One append-only list per game, with a `kind`:

| Kind | Written when | Example |
|---|---|---|
| `decision` | An assessed behaviour is shown | C01-B6, `report_and_call` |
| `check_item` | A knowledge check item is answered | C01-Q2, chose C, correct |
| `check_result` | A knowledge check sitting ends | 5 of 6, pass, attempt 1 |
| `milestone` | A beat starts or ends, a checkpoint is reached, the reference card is opened | `reference_opened` |
| `remediation` | A critical behaviour loop starts or ends | C01-CB2, started |
| `policy_ack` | A policy is acknowledged on the intranet (BE-09) | acceptable use policy, version 3 |

*The record sent by the client.*

```json
{
  "clientId": "6f1c2e0a-9d7b-4f3e-a2c1-0b9e5d7f4a11",
  "seq": 14,
  "kind": "decision",
  "behaviour": "C01-B6",
  "option": "report_and_call",
  "beat": "apply",
  "source": { "type": "ink", "npc": "leo_brennan", "knot": "slip_advice" },
  "attempt": 1,
  "route": "game",
  "gameTimeMs": 412000,
  "clientTs": 1791992589862
}
```

No free text is ever recorded (an MG-09 report records which fields were completed, not what was typed), which keeps the record small and avoids storing personal data the learner types.

*Sync.* The client recorder (`JS/systems/assessment-recorder.js`, new) queues records, mirrors the queue to `localStorage` inside try/catch so a crash or a dropped connection loses nothing, and posts batches to a new endpoint, `POST /games/:id/records`, within about a second. The endpoint is idempotent on `clientId`, so retries are safe. On page hide it flushes with `fetch` and `keepalive: true` and the CSRF header, as `StateSync.flush()` does (`JS/state-sync.js`, line 323). The bootstrap scenario carries the highest `seq` the server holds so a reloaded page continues the sequence.

*What the server does.* For each record it checks that the behaviour and option exist in the game's own `scenario_data`, computes `rating`, `outcome_ids` and `critical` from the map (ignoring anything the client claims), applies plausibility checks (no Apply-beat decision before the hook started; at most 2,000 records per game), stamps `received_at`, and inserts. Responses list accepted, duplicate and rejected ids with reasons.

*What the server stores.* A new append-only table rather than `player_state`, because `player_state` is rewritten by every sync, is cleared by `reset_player_state!`, and is loaded on every sync request:

| Column | Notes |
|---|---|
| `id`, `game_id`, `player_type`, `player_id`, `mission_id` | Player columns copied for organisation-wide queries |
| `module_id`, `module_version`, `edition` | From `mission.json` and HA-19 |
| `client_id` (unique per game), `seq`, `attempt` | Ordering and idempotency |
| `kind`, `behaviour_id`, `option_key`, `rating`, `outcome_ids`, `critical`, `beat` | `rating` and `outcome_ids` are computed by the server |
| `route` | `game`, `text`, `facilitated` or `test_out` |
| `source` (json), `game_time_ms`, `client_ts`, `received_at` | Evidence of when and where |

The model is read-only after create. A per-game summary (`assessment_summary`, a jsonb column on `break_escape_games`) is recomputed after each insert: the effective rating per behaviour, the result per learning outcome, the status of each critical behaviour, the check score, time on task (from milestones and an active-time counter sent with them) and the route. `GET /games/:id/assessment` returns it to BE-02, and `on_game_complete` hands it to Hacktivity for HA-05.

*From behaviours to learning outcomes.* The default rule, to be confirmed in `assessment_and_evidence.md`: an outcome is **Secure** when every applicable behaviour mapped to it is Secure (after any remediation) and every check item mapped to it was answered correctly; **Not yet** when a mapped behaviour is Not yet and was never remediated, or when most of its check items were wrong; **Developing** otherwise. Remediation never deletes the first record; the summary shows "Not yet, then Secure after practice", which is what `assessment.md` asks for.

*Mirror into ink.* After each decision the engine sets a global `assess_<behaviour>` (for C01-B6, `assess_c01_b6`) to the effective option key. The ink debrief and later scenes branch on it the way sis01 branches on its story globals, without the author keeping a second set of flags. The engine declares these globals itself from the `assessment` block.

*Validator.* `scripts/validate_scenario.rb` and an ink scan check that every `#assess:` tag and every `assess` block names a behaviour and option in the map, that every option in the map can be reached by some tag or config (a warning), that every behaviour maps to at least one outcome and every outcome has evidence, and that `critical` rules name real behaviours.

**Acceptance criteria:**

- Playing core_01's Apply beat with a scripted route produces exactly one `decision` record per behaviour per attempt, with the option that route took, and `not_applicable` for C01-B7 when the player never clicked.
- A record posted with a rating, or with an option not in the map, is stored with the server's rating or rejected with a reason.
- Killing the network for a minute and reloading the page loses no records, and the server holds no duplicates.
- `GET /games/:id/assessment` returns Secure, Developing or Not yet for every learning outcome, and the result matches a hand calculation for at least five fixture routes (node and Rails tests, run against fixtures, not live content).
- A `#assess` tag with an unknown behaviour fails the validator.
- The same choices made in the text route (BE-03) produce records identical apart from `route`, `clientId` and timestamps.
- `reset` starts attempt 2; attempt 1's records are kept and marked superseded.

**Depends on:** none for the core. MG-20 for check items; BE-19 for checks opened from ink; HA-05 and HA-19 to show and version the record; HA-15 for retention and deletion.

**Risks and open questions:**

- The game runs in the learner's browser, so a determined learner could forge records from the console. Server-side ratings, server-side grading of check items and plausibility checks limit this. The record is evidence of training, not an invigilated exam, and the accessibility statement and audit pack should say so.
- Records describe how individual staff behaved. They must be used for training, not discipline, and the organisation dashboard needs privacy thresholds (HA-09). Deleting a learner must delete their records (Hacktivity does not yet remove a user's games, `research/current_state_hacktivity.md`).
- Open: should each record carry a hash of the previous one, so an edit to the table is detectable? Recommendation: yes in P2, as part of the HA-05 audit pack.
- Open: how much of the summary rule belongs in the engine versus Hacktivity. Recommendation: the engine computes per-module results; Hacktivity combines modules into pathways.

<!-- next-section -->
