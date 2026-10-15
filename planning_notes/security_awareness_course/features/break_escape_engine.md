# Break Escape engine features (BE)

The engine and in-game UI work the awareness course needs, one section per feature in `features/README.md` (BE-01 to BE-30). The ids are fixed. Each section says why the course needs the feature, what the engine already has (with paths), a design concrete enough to estimate, acceptance criteria, dependencies, and risks.

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
| BE-04 | Accessibility baseline | MVP | L | BE-23 | Every module |
| BE-05 | Organisation profile in game | MVP | M | HA-11 | core_00, core_01, core_04, core_05, core_06, core_16 and every reference card |
| BE-06 | Localisation | P3 | L | BE-05, BE-13 | All modules, later |
| BE-07 | Micro-drill launcher | P2 | M | BE-01, BE-13, BE-19, BE-03 shell | core_01 "Phish or Fine?" and every micro-drill in the catalogue |
| BE-08 | Visual aids in conversations | MVP | M | BE-05 (cards) | EX-01 in every module; core_01's annotated hook email |
| BE-09 | Intranet terminal | MVP | M | BE-05, BE-01, HA-07 | core_00, core_01, core_16, every Reference beat |
| BE-10 | Spot-the-risk mode | P2 | M | BE-01, BE-04 | core_10, core_06, core_09, sector_01 |
| BE-11 | Role switch | P2 | M | BE-24 | EX-06 interludes: core_01 alternative, core_02, core_10, core_12 |
| BE-12 | Short sessions and resume | MVP | M | BE-01, BE-24 | Every module; field staff on phones |
| BE-13 | Content banks and randomisation | P2 | M | BE-01 | core_01 email bank, core_17 annual edition, MG-20 banks, BE-07 |
| BE-14 | xAPI statements | P2 | M | BE-01 | HA-10, HA-22 |
| BE-15 | Facilitated group mode | P2 | M | BE-01, BE-23 | Every facilitated version; role_01 |
| BE-16 | Time skips and consequence scenes | P2 | S | BE-23 | core_01, core_07, core_11 |
| BE-17 | Cross-module memory | P3 | M | BE-01 | core_17, core_04 |
| BE-18 | Work task and interruptions | MVP | M | BE-01, BE-19, BE-13 | core_01 (10:00 schedule), core_02, core_09, core_11, role_02 |
| BE-19 | Open minigames from conversations and events | MVP | S | none | core_01 hook and check question; every EX-01 check |
| BE-20 | Authorable tutorial, title screen and end screen | MVP | M | BE-05, BE-02, BE-04 | Every module; core_00 carries the full tutorial |
| BE-21 | Workplace music and sound | P2 | S | BE-04 (sound captions) | Every module |
| BE-22 | Tactic spotter card | P2 | S | BE-01, BE-02, BE-18 | core_02 (the social engineer bingo card) |
| BE-23 | Pause and time scale | MVP | M | none | BE-04, BE-15, BE-16, BE-18; every module with timed pressure |
| BE-24 | Place-player action | P2 | S | none | BE-11, BE-12, BE-16 |
| BE-25 | Course avatars and inclusive name entry | MVP | S (engine), M (art) | none | Every module (inclusive content) |
| BE-26 | Accessibility checks in CI | MVP | S | BE-03, BE-04, HA-23 | Every module |
| BE-27 | Plain English lint | P2 | S | none | Every module |
| BE-28 | Take an item from the player | P2 | S | none (BE-19 for handovers) | core_07 and physical-security beats |
| BE-29 | NPC guide behaviour | P2 | S | BE-23, BE-24 | core_00 tour; escorting visitors |
| BE-30 | Video call options | P2 | S | BE-08 | core_15 deepfake call; role_01 briefings |

Suggested build order for Phase 0: BE-19 and BE-01 first (they unlock the mentor's check question and every record), then BE-05, BE-08 and BE-09 (the Learn and Reference beats), BE-20 and BE-18 (the opening and the Apply beat), BE-12 and BE-02, with BE-03 and BE-04 running alongside from the start because every new screen has to work in both routes. BE-23 (pause and time scale) comes with BE-04, because BE-04, BE-15, BE-16 and BE-18 all depend on it, and BE-24 (place-player) comes with BE-12. BE-25, BE-26 and BE-27 run alongside as course-wide groundwork: the office avatar set, the CI accessibility gate and the plain English lint. BE-28, BE-29 and BE-30 land with the modules that need them: BE-28 and BE-29 for first-day and physical-security beats, BE-30 for the core_15 deepfake call.

### BE-01: Assessed decisions

**Priority and size:** MVP, M (the top end of M: a client recorder, a server table and endpoint, validator checks and the per-outcome summary).

**Why:** The course sells on evidence. Every module's `assessment.md` lists assessed behaviours (core_01 has nine, C01-B1 to C01-B9), each tied to learning outcomes and rated Secure, Developing or Not yet, plus critical behaviours that must be shown before the module counts as complete. The debrief (BE-02), the learner's record (HA-05), the organisation dashboard (HA-09), the text route (BE-03) and the xAPI feed (BE-14) all need the same per-decision data. Today nothing records a decision as such.

**What exists today:**

- Story state lives in global variables, synced both ways with ink and sent to the server every 30 seconds and on page hide (`JS/state-sync.js`; keyed sections at line 13). The server keeps only current values (`game.rb`, `merge_global_variables!`, around line 230), so a choice that is later overwritten leaves no trace.
- Task completions are stored with timestamps in `player_state['objectivesState']` (`game.rb`, `complete_task!`, around line 1223) and drive a hidden score of 70% tasks and 30% aims (`calculate_task_score`, line 47).
- A precedent for a recorded, time-stamped log: the command board recorder (`JS/minigames/command-board/command-board-timeline.js`, `CommandBoardRecorder`, around line 291) records entries with game time from game start, is created in `JS/core/game.js` (around line 1045), and is merged on the server as a grow-only list that keeps each entry's earliest time (`game.rb`, `merge_command_board_log!`, around line 1596; the controller's `merge_grow_only_sections`).
- Ink tags are processed in one place, `processGameActionTags` (`JS/minigames/helpers/chat-helpers.js`, line 22), for both person-chat and phone-chat. There is no assessment tag.
- `JS/systems/ink/ink-engine.js` (line 69, and the `currentChoices` getter) maps choices to `{ text, index }` and drops ink's choice tags, although the bundled inkjs supports them (`public/break_escape/assets/vendor/ink.js`, ink format version 21).
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
      "unanswered": { "option": "ignored", "closeOn": "global_variable_changed:apply_done" }
    },
    "C01-B6": {
      "title": "Advises Leo after his slip",
      "outcomes": ["C01-LO5", "C01-LO6"],
      "beat": "apply",
      "options": { "report_and_call": "secure", "change_password": "developing", "keep_quiet": "not_yet" }
    }
  },
  "critical": [
    { "id": "C01-CB1", "label": "Reports a phishing email", "anyOf": [
      { "behaviour": "C01-B1", "rating": "secure" }, { "behaviour": "C01-B2", "rating": "secure" } ] }
  ],
  "pairs": [["C01-B1", "C01-B2"]]
}
```

Each behaviour is recorded once per beat in each attempt. If content records it twice in the same beat, the first record stands and later ones are kept as notes, so modules resolve compound actions into one option (core_01's "clicks, stops, then reports" is its own option of C01-B1). Remediation loops write new records with the beat `remediation`. An optional `appliesWhen` is a globals condition in the existing syntax (`JS/utils/conditional-text.js`); when it is false at close time the behaviour is recorded as `not_applicable` (core_01's C01-B7, which only applies to players who clicked). The rating map and `critical` rules are stripped from the bootstrap scenario, like `targetFlags`.

*What gets tagged.* Content reports a behaviour id and an option key, never a rating:

- **Ink:** `#assess:C01-B6:report_and_call`, on the first line of output after the choice (this works with today's tag pipeline, and the text route sees it the same way). A later change can forward choice tags from `ink-engine.js` so the tag can sit on the choice itself. Tags are handled by a new `assess` case in `processGameActionTags`.
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
| `tactic_used`, `tactic_tick` | A caller uses a tactic; the player ticks it on the tactic spotter card (BE-22) | "urgency" on the IT Security call; ticked |

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

Records never carry free text (`assessment_and_evidence.md`, section 11, rule 8): an MG-09 report records which fields were completed, not what was typed. Where the debrief needs the typed text, it stays in the game's state and is deleted with the attempt.

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

The model is read-only after create. Records are kept with the attempt for as long as HA-15's schedule allows for learning detail (by default two years from the attempt, or 90 days after the person leaves, whichever is sooner; `assessment_and_evidence.md`, section 11), and deletion and retention are handled by HA-15.

A per-game summary (`assessment_summary`, a jsonb column on `break_escape_games`) is recomputed after each insert. It holds:

- the rating of each behaviour;
- the result for each learning outcome;
- the status of each critical behaviour (shown, shown after practice, practised but not yet shown, or not applicable);
- the knowledge check score;
- time on task, counted while the module is in focus with a long idle limit, so screen reader users who listen without pressing keys are not under-counted, and never used as a pass condition (`assessment_and_evidence.md`, open question 6);
- the route.

`GET /games/:id/assessment` returns it to BE-02, and `on_game_complete` hands it to Hacktivity for the completion record (HA-05).

*From behaviours to learning outcomes.* The engine implements the rule in `assessment_and_evidence.md`, section 3, and does not define its own:

- each piece of evidence scores Secure 2, Developing 1, Not yet 0, and a check item right 2, wrong 0;
- evidence is weighted by beat: the Apply beat 2, Practise and the mentor's check question 1, each knowledge check item 1 (latest attempt only), and the hook 0;
- an outcome is Secure at a weighted average of 1.5 or more with no Not yet in the Apply beat, Not yet below 0.6, and Developing otherwise;
- an outcome whose critical behaviour was shown only after practice is at most Developing for this sitting;
- with fewer than two pieces of evidence, or none from play, the outcome is "not rated".

The weights and cut-offs are read from the module's `assessment` block, so a module's `assessment.md` can change them for one outcome, with a reason, as that section allows. Remediation follows section 4 of the same document: at most two loops, every attempt kept, and "practised, not yet shown" after the second.

*Mirror into ink.* After each decision the engine sets a global `assess_<behaviour>` (for C01-B6, `assess_c01_b6`) to the option recorded for it (the remediation record, once there is one). The ink debrief and later scenes branch on it the way sis01 branches on its story globals, without the author keeping a second set of flags. The engine declares these globals itself from the `assessment` block.

*Validator.* `scripts/validate_scenario.rb` and an ink scan check that every `#assess:` tag and every `assess` block names a behaviour and option in the map, that every option in the map can be reached by some tag or config (a warning), that every behaviour maps to at least one outcome and every outcome has evidence, and that `critical` rules name real behaviours.

**Acceptance criteria:**

- Playing core_01's Apply beat with a scripted route produces exactly one `decision` record per behaviour per attempt, with the option that route took, and `not_applicable` for C01-B7 when the player never clicked.
- A record posted with a rating, or with an option not in the map, is stored with the server's rating or rejected with a reason.
- Killing the network for a minute and reloading the page loses no records, and the server holds no duplicates.
- `GET /games/:id/assessment` returns Secure, Developing, Not yet or "not rated" for every learning outcome. The four worked examples for C01-LO4 in `assessment_and_evidence.md`, section 3, come out exactly as that table says, and at least five further fixture routes match a hand calculation (node and Rails tests, run against fixtures, not live content).
- A critical behaviour missed twice ends as "practised, not yet shown" after the second loop, and the learner moves on to the check.
- A `#assess` tag with an unknown behaviour fails the validator.
- The same choices made in the text route (BE-03) produce records identical apart from `route`, `clientId` and timestamps.
- `reset` starts attempt 2; attempt 1's records are kept and marked superseded.

**Depends on:** none for the core. MG-20 for check items; BE-19 for checks opened from ink; HA-05 and HA-19 to show and version the record; HA-15 for retention and deletion.

**Risks and open questions:**

- The game runs in the learner's browser, so a determined learner could forge records from the console. Server-side ratings, server-side grading of check items and plausibility checks limit this. The record is evidence of training, not an invigilated exam, and the audit pack should say so.
- Records describe how individual staff behaved. They are for learning, never discipline; managers never see them, and organisations see them only in aggregate above HA-09's thresholds (`assessment_and_evidence.md`, section 11). Deletion and retention of game records are handled by HA-15.
- Integrity: completion records are fingerprinted and chained by HA-05 (`assessment_and_evidence.md`, section 7). Per-decision records are short-lived learning detail and are not chained; the read-only model and server-side rating protect them.
- Open: how much of the rule belongs in the engine versus Hacktivity. Recommendation: the engine computes per-module results, as above; Hacktivity combines modules into pathways and writes the completion record.

### BE-02: Debrief screen

**Priority and size:** MVP, M.

**Why:** The Debrief beat is where a simulation's learning is made explicit (`01_LEARNING_DESIGN.md`). core_01's debrief shows each threat with a thumbnail, what it was, the clue, what the player did, what checking another way would have looked like and what happened, then the hook and the expected-sender phish side by side as a before and after, then per-outcome results, then the line to remember, before Ama and Kai talk it through (`modules/core_01_phishing_email/game_design.md`, "5. Debrief"). Every module repeats that shape, and the facilitated version needs it on a shared screen.

**What exists today:**

- **Conditional credits.** A music event can carry a `credits` list of `{ text, style, condition }` lines, each shown only when its globals condition holds. sis01 uses them as an outcome debrief (`scenarios/sis01_healthcare/scenario.json.erb`, the `debrief_complete` music event around line 548). `README_scenario_design.md` already sets two rules that carry over: credit lines must match what the player did (around line 1660) and every section needs a line that always prints (around line 1663).
- **The credits visualiser** (`JS/music/bond-visualiser.js`, themed by `JS/music/credits-theme.js`). The `cyber` theme is the non-spy option (`README_scenario_design.md`, line 206), but it still draws a "matrix" canvas of falling characters (`bond-visualiser.js`, line 133), which is the green-code imagery this course avoids (see `accessibility_and_inclusion.md`, inclusive content).
- **The debrief conversation.** sis01's Priya S. (`scenarios/sis01_healthcare/ink/npc_sharma.ink`) gives state-driven verdicts from globals, asks one question per section, confirms or corrects the answer, completes `attend_debrief` (line 75) and sets `debrief_complete` (line 427), which ends the mission.
- **End screens.** `show_end_screen` (`JS/systems/apply-actions.js`, line 162) and `conclusionScreen` (`README_scenario_design.md`, around line 1327) show a title, a body and a button; they hold no structured results.

**Design:** extend these patterns rather than replace them. The screen shows the structured summary; the conversation stays ink; the credits, if a module uses them, come from the same lines.

*Content.* Each behaviour in the BE-01 `assessment` block gains a `debrief` entry, all on-screen text (so it may include counts and organisation values):

```json
"C01-B2": {
  "debrief": {
    "order": 2,
    "thumbnail": "aid:core01_expected_sender",
    "whatItWas": "A fake Northbeck email from a lookalike address, sent while you were waiting for the real one.",
    "clue": "northbeck-supplies.co is not northbeck.co.uk.",
    "good": "Report it, then wait for the real file or ask Dawn by phone.",
    "options": {
      "reported":  { "youDid": "You reported it.", "next": "Kai pulled it from 38 inboxes." },
      "ignored":   { "youDid": "You left it alone.", "next": "It stayed in other people's inboxes." },
      "signed_in": { "youDid": "You signed in on the fake page.", "next": "Your account sent the same email to colleagues until it was reported." }
    }
  }
}
```

Lines that are not tied to one behaviour use the credits shape with one new condition type, `"when": { "behaviour": "C01-B2", "option": "reported" }`, alongside the existing globals `condition`. An author who has written credits can write a debrief.

*Screen.* A new DOM component, registered as the minigame scene `debrief` so ink and events can open it through BE-19 (`#trigger_minigame:debrief`) and return to the conversation afterwards. Sections, each a heading:

1. **What happened:** one card per assessed behaviour in arrival order: thumbnail with alt text (from BE-08), what it was, the clue, what you did (rating as a word and an icon, never colour alone), what good looks like, and what happened next.
2. **Before and after:** the `pairs` from the assessment block side by side (core_01: the hook and the expected-sender phish).
3. **How you did:** each learning outcome as a sentence tied to what the learner did ("You rang Northbeck on the directory number before doing anything. That's exactly it."), with Secure, Developing or Not yet in words and an icon. For Developing and Not yet, the one thing to do differently and a link to practise. No numbers except the knowledge check score, as `assessment_and_evidence.md`, section 3, "What each person sees", sets out. An outcome the module couldn't rate says so plainly. Critical behaviours are shown as done or still to practise.
4. **The line to remember:** the module's key message.
5. **Next:** "Talk it through with Ama", "Go to the spot check" (MG-20), and, when a critical behaviour is missing, "One more thing to practise", which starts the module's remediation loop (`assessment.critical[].remediation`; at most two loops, `assessment_and_evidence.md`, section 4).

*Data.* The screen renders `GET /games/:id/assessment` (BE-01), the same summary the server stores and Hacktivity shows, so the learner sees exactly what is recorded. Opening it writes a `debrief_viewed` milestone. After a remediation loop the summary is fetched again: the critical behaviour shows "shown after practice", and the outcomes it links to are at most Developing for this sitting (section 3, rule 5 of that document).

*The spoken debrief stays ink.* Ama and Kai walk through the highlights in an ink conversation that branches on the `assess_*` globals BE-01 mirrors, asks one reflective question per section and confirms or corrects the answer, then sets `debrief_complete`, as sis01 does. Voiced lines never print a count: "You reported both of those" is chosen with an inline conditional, never "You reported {n}".

*Credits.* A module that wants closing credits builds them from the same debrief lines, with a new `creditsTheme: "workplace"` that has no matrix mode, stamp or threat map. Most modules will not need credits at all.

*Tone.* No "FAIL", no red screen, no score as a headline. Not yet is phrased as "not yet shown, and here's what to do", following the no-blame principle.

**Acceptance criteria:**

- For each of five fixture routes through core_01, every assessed behaviour appears once, with the text for the option that route took, in arrival order.
- The outcome results on screen equal the server summary for the same game (a test compares them).
- The screen works with keyboard alone, opens with focus on its first heading, uses headings and lists that a screen reader announces, shows no colour-only information, and reflows at 320 CSS pixels wide.
- No line on the screen contradicts the spoken debrief for the same route (checked by a scripted run that reads both).
- A missing critical behaviour shows the practise action, and completing remediation updates the screen without a reload.
- The same component renders in the text route (BE-03) and in the presenter view (BE-15).
- Printing the screen gives a readable one or two pages.

**Depends on:** BE-01; BE-08 for thumbnails; BE-05 for organisation values on the cards; BE-19 to open it from ink; MG-20 for the spot check that follows.

**Risks and open questions:**

- A long module could produce a long screen. Keep to the assessed behaviours (four to eight per module) and collapse the detail of Secure items by default.
- The spoken debrief and the screen could drift apart. The `assess_*` globals come from the same records, and the scripted check above catches drift.
- Settled in `assessment_and_evidence.md`: learners see their per-outcome results as sentences, and the words "fail" and "failed" appear nowhere a learner or a manager can see them (principle 4).

### BE-03: Text route player

**Priority and size:** MVP, L for the player, plus one to two days per module to write its spine and scene descriptions.

**Why:** Mandatory training must be completable by every member of staff, including screen reader users, people with motor or vestibular conditions and people on locked-down thin clients (`01_LEARNING_DESIGN.md`, "Giving everyone a route through"). The overview promises that every module "can be taken as a text route with the same decisions and the same record", in 10 to 15 minutes. It is also how the course meets WCAG 2.2 AA for a canvas game: WCAG allows a page to conform through a **conforming alternate version**, which must itself conform, provide all the same information and functionality, be as up to date, and be reachable from the non-conforming version through an accessibility-supported mechanism (WCAG 2.2, conformance requirement 1 and the glossary, https://www.w3.org/TR/WCAG22/). The text route is that version, so it has to be equivalent in substance, not a summary.

**What exists today:**

- The ink runs without Phaser. `scripts/ink_runtime_check/inkcheck.js` and `voicelines.mjs` load the same `public/break_escape/assets/vendor/ink.js` in node and bind the engine's six external functions (`inkcheck.js`, around line 12), and `JS/systems/ink/ink-engine.js` is a thin wrapper with no Phaser dependency.
- Globals already flow both ways between ink and the game (`JS/systems/npc-conversation-state.js`) and are saved through `PUT /games/:id/sync_state`, together with each NPC's ink variables (`npcInkVariables`).
- The JSON endpoints a second front end needs exist: `/scenario` (bootstrap), `/ink?npc=` (compiled scripts), `/sync_state`, `/objectives/...` (`config/routes.rb`).
- Documents render from a markdown subset (`JS/utils/note-markdown.js`, used by the notes minigame).
- Every voiced line is already shown as text, and the server validates and caches TTS by exact text, so a text page can play the same cached clips.
- What does not exist: any non-canvas way to play. `processGameActionTags` (`JS/minigames/helpers/chat-helpers.js`, line 22) calls `window.NPCGameBridge`, which needs the Phaser world, and the person-chat panel has no live region and captures Space at window level (`JS/minigames/person-chat/person-chat-minigame.js`, line 298), so it is not a usable base.

**Design:**

*Page.* `GET /break_escape/games/:id/text`, a new controller action and view on the same `Game` row: the same `scenario_data`, the same globals, the same BE-01 records. The page is server-rendered HTML with `lang="en-GB"`, a skip link, landmarks and the module title as `h1`. It loads inkjs and a small text-route bundle (`JS/text-route/`, new), and no Phaser, WebGL or canvas, so it runs on low-spec and locked-down machines and on phones.

*The spine is ink too.* Each module has `ink/text_route.ink`, declared in the scenario as `"textRoute": { "spine": "ink/text_route.ink" }`. The spine holds the scene descriptions (short and factual: what a sighted player sees that matters), the order of beats and interruptions, and the world choices ("Look at the notice board", "Go over to Leo"). It hands off to the module's real content with tags:

| Tag | What it does in the text route |
|---|---|
| `#scene:<id>` | Starts a new scene: a heading and its description |
| `#talk:<npcId>\|<knot>` | Runs that NPC's own ink file, the one the game uses, from that knot until it exits, then returns to the spine |
| `#trigger_minigame:<minigame>\|<config>` | Opens the minigame's accessible mode inline (BE-19); MG-01 becomes an accessible message list, MG-20 items become fieldsets |
| `#show_document:<id>` | Renders a note or document inline |
| `#visual_aid:<id>` | Shows a BE-08 aid with its alt text, long description and step descriptions |
| `#checkpoint:<id>` | Saves a resume point (BE-12) |

The spine sets the same globals the game's events and timers set (for example `apply_done`) with the existing `#set_global` tag.

*Same records.* The NPC inks fire the same `#assess` tags, and the minigames' accessible modes call the same recorder, which posts with `route: "text"`. A headless bridge (`JS/text-route/bridge.js`, new) implements the tags that matter without a world: `set_global`, `set_variable`, `complete_task`, `skip_task`, `unlock_task`, `unlock_aim`, `assess`, `trigger_minigame`, `exit_conversation`, `end_conversation`, and `add_note` (shown as a document). World-only tags (`unlock_door`, `give_item`, `remove_npc`, `hostile`, `lighting_dip`, `clone_keycard`) update saved state where a later switch to the game needs it (unlocked rooms, inventory) and are otherwise ignored.

*Reading and choosing.*

- Each scene is a section with a heading and a running transcript; every line shows the speaker's name.
- After a choice the new content is appended and focus moves to its first element (`tabindex="-1"`), so a screen reader reads on from there. Choices are an ordered list of buttons below.
- No auto-advance, no timers, nothing that moves.
- `aria-live` is used only for short status messages ("Saved", "Report sent"), so the narrative is not read twice.
- Earlier scenes collapse under their headings to keep the page short.
- A "What should I do now?" link is always present: the current objective and the mentor's sticky answer (EX-01).
- Optional "Play the voice" per line, using the cached TTS clips (identical text hits the same cache). Off by default.
- Text size, font and theme follow the BE-04 settings. Number-key shortcuts for choices are available but can be turned off (WCAG 2.1.4, character key shortcuts).

*Interruptions without a clock.* The game's real-time interruptions (BE-18) become ordered events in the spine ("after you deal with the second email, a message from Leo arrives"). Assessment rules that mention time are written as sequence ("reported before the next email arrived"), so both routes judge the same thing (see BE-04, timers).

*Saving and switching.* After every choice the page syncs globals and ink state through `sync_state` and posts records. Resume returns to the last checkpoint with a short "so far" summary (BE-12). The game offers "Switch to the text version" on the title screen (BE-20), in settings and in the pause menu, and Hacktivity offers both routes at launch (HA-17). Switching happens at checkpoints, because each checkpoint defines the world state both routes need.

*Parity tool.* `scripts/ink_runtime_check/routeparity.mjs` (new) lists every conversation the game route opens (event mappings with `targetKnot`, timed conversations, NPC `currentKnot`), every `#assess` tag and every minigame `assess` block, and checks that the spine reaches each one. It then walks each assessed behaviour with each option, in the style of `inkcheck.js`, to prove every option can be chosen in the text route. It runs in CI for every module.

**Acceptance criteria:**

- A practised tester completes core_01's text route in 10 to 15 minutes with keyboard alone, and with NVDA and Firefox, JAWS and Chrome, and VoiceOver on iOS.
- `routeparity.mjs` passes for core_01: every assessed behaviour and every option is reachable, and every conversation the game opens is reached.
- The same sequence of decisions in the game and the text route produces the same set of behaviour and option records and the same per-outcome summary (an automated comparison).
- axe-core reports no violations for the WCAG 2.0, 2.1 and 2.2 A and AA rule tags on every text-route page, and the manual checks in `accessibility_and_inclusion.md` pass.
- The page works with sound off, at 400% zoom (320 CSS pixels wide) and in Windows forced colours mode.
- Switching from the game to the text route at a checkpoint and back leaves one continuous record and a consistent state.

**Depends on:** BE-01, BE-19, BE-08 (aid descriptions), BE-12 (checkpoints), BE-04 (settings), BE-02 (the debrief component); every new minigame needs an accessible mode (`features/minigames.md`).

**Risks and open questions:**

- Cost per module: a spine and scene descriptions. Writing the spine alongside the game design, not after it, keeps the two routes aligned.
- Equivalence: reading an email as text can make a clue easier or harder to spot. The text versions show the same information in the same order (the sender's display name first, the address on request, the link destination behind a "check where this goes" action, as core_01's variant describes), never a hint the game route lacks.
- Dexterity minigames (lockpicking, dusting) have no fair text equivalent. In this course they appear only in optional attacker-view interludes (EX-06), which the text route narrates and does not assess.
- Long transcripts are tiring with a screen reader; collapsing finished scenes and keeping lines short (the dialogue lint flags spoken lines over 30 words) helps.
- Open: should the text route be offered to everyone or only on request? Recommendation: to everyone, at the start, as an equal option. Some people simply prefer it, and offering it openly avoids anyone having to disclose a disability. For the same reason the route is visible to the learner, organisation admins and auditors, but never to managers (`assessment_and_evidence.md`, section 11).

### BE-04: Accessibility baseline

**Priority and size:** MVP, L. L holds only if the scope is the game shell plus the minigames this course uses; making all 42 registered minigames accessible would be much larger.

**Why:** Principle 10 of `01_LEARNING_DESIGN.md` sets WCAG 2.2 AA for every interface, captions and transcripts for every spoken line, and no required fast reactions. Employers owe disabled staff reasonable adjustments in training (Equality Act 2010, sections 20 and 39), and public sector buyers will expect WCAG 2.2 AA. The text route (BE-03) gives everyone a conforming route, but the game itself must still be as usable as possible and must meet the WCAG requirements that apply to all content, even when an alternative exists (non-interference: audio control, no keyboard trap, pause, stop and hide, and three flashes). The full baseline, standards and tests are in `features/accessibility_and_inclusion.md`; this section is the engine work list.

**What exists today:**

- Keyboard movement and interaction (`JS/core/player.js`, line 278: WASD, arrows, E, Shift, Space; Q in `JS/ui/hud.js`, line 367), conversation choices by number keys (`person-chat-minigame.js`, line 309), Esc to close overlays (`JS/ui/modal-stack.js`), and an accessible interaction menu (`JS/ui/interaction-menu.js`, line 147).
- The lighting system limits strikes and the faulty panel to under three flashes a second and turns them off under `prefers-reduced-motion` (`JS/systems/lighting.js`, lines 119 to 130 and 699 to 716); `lighting_dip` is skipped under reduced motion (`apply-actions.js`, line 141); lighting can be turned off with `?lighting=off` or a `localStorage` flag, but not from the UI.
- Separate Music, SFX, Voice and Master volume sliders (`JS/music/music-widget.js`, around line 183), although their labels are not associated with the inputs.
- One well-built precedent: the dusting minigame (keyboard throughout, pointer events, high-contrast and steady-hand toggles, live status text, reduced motion; `scenarios/FINGERPRINT_MINIGAME_PLAN.md`, section 5).
- Gaps, each detailed in the accessibility plan: inventory items are `<img>` elements with click handlers only (`JS/systems/inventory.js`, line 607); HUD buttons are `<div>`s (`hud.js`, line 63); the canvas exposes nothing to assistive technology; dialogue has no live region (`JS/minigames/person-chat/person-chat-ui.js`, line 144); dialogue auto-advances after 5 seconds and the click-through toggle is never exposed (`person-chat-minigame.js`, lines 27, 87 and 370); Space is captured at window level in conversations; notifications vanish after 5 seconds with no live region (`JS/systems/notifications.js`, line 13); barks pause on mouse hover only; the game clock is wall time with no pause (`JS/systems/game-clock.js`); minigame overlays have no dialog role or focus handling (`JS/minigames/framework/base-minigame.js`, line 22); text is sized in pixels in pixel fonts with no size setting; most CSS animations have no reduced-motion guard; every engine page lacks a `lang` attribute (`app/views/break_escape/games/show.html.erb`, line 2, and the other three views).

**Design:** nine work packages, each specified in `accessibility_and_inclusion.md`, "The BE-04 baseline in detail":

1. **Settings, before the game starts and at any time:** text size (100% to 200%), readable font, high contrast, reduce motion, flicker off, captions style, dialogue pace (advance when I choose, by default), time scale or timers off, key remapping, voice and music on or off. Stored per player on the server (new columns on `break_escape_player_preferences`, read like the avatar choice is today) so they follow the learner across modules and devices, with `prefers-reduced-motion` and `prefers-contrast` as starting values.
2. **Keyboard and focus:** every control a real button in a logical tab order; dialogs that take and return focus; visible focus never hidden by the HUD; single-key shortcuts that can be remapped or turned off; Space and Enter activate the focused control.
3. **A "places and people" list:** a keyboard and screen reader list of everything interactive in the current room, with Go to (walks there using the existing pathfinding, `movePlayerToPoint` in `JS/core/player.js`, line 717) and Use. It lists every interactable, not only the assessed ones, so it never gives answers away.
4. **Screen reader layer:** a room description region, dialogue as a log with speaker names, choices announced, minigames as labelled dialogs, status messages as polite live regions.
5. **Captions and transcript:** speaker names on every line, captions for sounds that carry information (phone ringing, email arriving, door buzzer), a conversation history panel, and a transcript the learner can download at the end.
6. **Text and contrast:** rem-based sizing, a readable sans-serif option replacing the pixel fonts for body text, 4.5:1 text and 3:1 interface contrast, no information by colour alone.
7. **Motion and flashing:** one reduced-motion switch covering CSS animations, the title typing effect, slide-ins and the credits visualiser; a separate flicker-off switch; no flashing content in course modules.
8. **Time:** a pausable game clock with a time scale (BE-23): pause whenever a dialog, conversation or minigame is open if the learner chooses, slow timers down by 2, 5 or 10 times, or turn timers off. Nothing in the course requires a fast reaction.
9. **Cognitive support:** the current task always visible and repeatable ("What should I do now?"), consistent help in the same place, confirmation before anything irreversible, plain English.

**Acceptance criteria:**

- core_01 can be completed in the game with keyboard alone, including the inventory, the notepad, the inbox and the knowledge check.
- With timers off or at the slowest scale, core_01 can be completed with no time pressure, and no rating changes because of how fast the learner reads.
- With reduced motion on, no element animates except essential progress indicators. With flicker off, the lighting system runs in the still mode it already uses under reduced motion (`lighting.js`, line 891): no tube strikes, no faulty panel, steady LEDs and screens.
- Every spoken line and every information-carrying sound has a text equivalent, and the session's transcript can be read in game and downloaded.
- Text size at 200% loses no content or function in dialogue, documents, minigames and menus.
- axe-core reports no violations on the game's DOM surfaces (game shell, every course minigame opened through the test bridge, the debrief), and the manual matrix in the accessibility plan passes.
- Settings chosen in one module are in force in the next.

**Depends on:** BE-23 (pause and time scale); BE-20 (settings offered before the game starts); `features/minigames.md` (every new minigame meets the same standard).

**Risks and open questions:**

- A real-time 2D world will never be fully usable with a screen reader alone, even with the places list. The text route is the recommended route for screen reader users, offered openly at the start (BE-03).
- Retro pixel fonts are part of Break Escape's look. Recommendation: keep them for headings and labels, use a readable sans-serif for anything longer than a few words in this course, and let learners choose.
- Shared engine code: changes to person-chat, notifications and the HUD also change the campaign and SIS games. That is a gain, but each change needs the regression playtests in `AGENTS.md`.

### BE-05: Organisation profile in game

**Priority and size:** MVP, M.

**Why:** Staff must leave knowing their own organisation's route: the name of their Report button, their service desk number, their DPO, their classification labels and policy names. Every module has an "Organisation-specific content" list (core_01: the Report button's name and location, the service desk contact for "I clicked", whether the organisation runs simulated phishing). Larkspur's values are the defaults (`03_WORLD_AND_CAST.md`, "Organisation profile"). HA-11 stores the customer's values; this feature puts them into the game without breaking the voice cache.

**What exists today:**

- Scenarios are ERB templates rendered once per game when the game is created (`game.rb`, `before_create :generate_scenario_data`, line 25; `mission.rb`, `generate_scenario_data`, line 110). The binding (`mission.rb`, `ScenarioBinding`, line 193) carries only random values and the VM context, and `inject_player_preferences` (`game.rb`, around line 2385) already writes per-player values (sprite, display name) into `scenario_data['player']`. So per-game values have a natural entry point.
- The validator keeps its own copy of the binding (`scripts/validate_scenario.rb`, line 37), which must stay in step.
- Ink can call a small set of external functions (`player_name` and five others, listed in `scripts/ink_runtime_check/inkcheck.js`, around line 12).
- Which text is voiced: in person-chat, every NPC and narrator line is sent to TTS, while player lines and system messages are not (`person-chat-minigame.js`, line 1376). Phone texts are voiced only when they start "voice:" (dialoguelint's voiced-variable rule, `scripts/ink_runtime_check/dialoguelint.mjs`, around line 561). Event barks and timed messages of voiced NPCs are voiced and validated against the scenario (`app/services/break_escape/scenario_bark_validator.rb`).
- The TTS endpoint refuses text that is not in the NPC's compiled ink or scenario barks (the controller's `tts` action, around line 559), and the cache key includes the exact text (`tts_service.rb`, line 61). A voiced line that printed an organisation value would therefore get no audio at all, or, for a bark rendered by ERB, a fresh clip for every customer.
- The dialogue lint already rejects printed variables in voiced ink lines.
- Nothing carries an organisation profile today, and several labels are hard-coded: the title screen's Hacktivity logo (`JS/minigames/title-screen/title-screen-minigame.js`, line 29), the "Lab Sheet" popup title (`show.html.erb`, line 112) and the "Meridian" form headers.

**Design:**

*The profile.* A flat, versioned set of keys with Larkspur defaults:

| Key | Larkspur default | Used by |
|---|---|---|
| `org.name`, `org.shortName`, `org.logo` | Larkspur Group | Title screen, intranet header, reference card, documents |
| `report.buttonName`, `report.buttonWhereDesktop`, `report.buttonWhereMobile` | "Report suspicious", in the mail toolbar | MG-01, reference card |
| `serviceDesk.phone`, `serviceDesk.hours`, `security.contact` | The 24/7 service desk line; the security team on extension 4444 | Reference card, MG-09, documents |
| `dpo.name`, `dpo.contact` | Tomasz Wiśniewski | core_05 documents, reference card |
| `classification.labels` | Public, Internal, Confidential, Restricted | MG-10, document headers |
| `policies.<id>.name`, `.version`, `.url` | Larkspur's acceptable use policy and others | BE-09, HA-07 |
| `phishSim.enabled`, `externalBanner.text`, `access.route` | Not set until the organisation says (items that need them are left out, as core_01 does with Q11) | core_01 items and the knowledge check bank |
| `jurisdiction` | England | Fraud reporting wording (Police Scotland on 101 in Scotland) |

*Getting it in.* The host supplies the profile through a new configuration hook, `BreakEscape.configuration.org_profile_for_game` (beside `on_game_complete` in `lib/break_escape.rb`), which Hacktivity answers from HA-11; standalone mode uses the Larkspur defaults. An organisation fills in its profile as part of the go-live checklist (HA-26), which includes playing a module as a test learner to see the values in place before staff are invited; a partner who runs several organisations (HA-25) sets each one's profile separately. At game creation the engine snapshots the profile and its version into the game (so a running module never changes under the learner, and the record can say which profile it ran with), and exposes it three ways:

1. **ERB helpers** in `ScenarioBinding` (and the validator's copy): `org_text('report.buttonName')` returns the value escaped for use inside a JSON string, `org_json('classification.labels')` returns JSON. Used in documents, intranet pages, minigame configs, objectives text and phone texts that are not voiced.
2. **Runtime:** `window.breakEscapeConfig.org`, for minigame UIs and the title screen.
3. **Ink:** an external function `org(key)` for player choices, player lines and phone texts that are not voiced. The dialogue lint already reports `{org("x")}` in a voiced line, because it reports any printed function value.

*Where organisation values may appear.* Only in text that is never voiced: documents, intranet pages, the reference card, minigame screens, objectives, chat messages without "voice:", player choices and player lines, the debrief screen, and BE-08 visual aid cards. When a voiced character needs to give the route, they say it generically and a card shows the detail: Ama says "Use the Report button. I'll pop the details up for you," and the conversation panel shows a card reading, for example, "At Larkspur Group: Report suspicious, in the mail toolbar. On your phone: the three dots menu, then Report."

*Classification labels.* Voiced lines never name a label, because a customer may rename "Confidential". They say "the label on it" or "one of the top two levels", and the screen shows the organisation's words.

*Checks.*

- The validator renders each scenario twice with two different fake profiles and fails if any voiced field differs between the renders (NPC `voice` strings, eventMapping `bark` and `sendTimedMessage.message`, `timedMessages` of voiced NPCs). This catches a value slipped into a bark, which the ink lint cannot see.
- A unit test confirms `org_text` escapes quotes, backslashes and line breaks.
- A rendering test fills every slot to the maximum length HA-11 allows for it, to catch layouts that break.

**Acceptance criteria:**

- Starting core_01 with a test profile shows that profile's Report button name in MG-01, on The Lark and on the reference card, and the Larkspur values nowhere.
- No voiced line in any course module changes between two profiles (validator double render), and the TTS cache for a module is identical for every customer.
- Changing the profile in Hacktivity affects new games only; a game in progress keeps the snapshot, and its records name the profile version.
- An organisation in Scotland sees the Scotland wording for reporting fraud wherever the module shows it.
- Every profile value that appears on screen is real text (never baked into an image), so it can be resized, translated and read by a screen reader; the logo has the organisation's name as its alt text.

**Depends on:** HA-11 (the profile store and its admin screens); HA-26 (the go-live checklist that makes sure a profile is complete); BE-08 (cards); BE-09 (intranet).

**Risks and open questions:**

- A customer may ask for their name in the spoken lines. The answer is no by default: it would mean generating and storing a full set of audio per customer. If it is ever sold, it is a separate paid option with its own voice cache per customer.
- Long or unusual values (a long button name, a non-Latin script) can break layouts. HA-11's per-slot maximum lengths limit this, and the rendering test above checks it.
- Open: should customers be able to edit key messages as well as values? Recommendation: values only at first. Free text from customers needs review for accuracy and accessibility before it reaches learners.

### BE-06: Localisation

**Priority and size:** P3, L, plus translation, review and voice generation per language.

**Why:** Organisations with staff who work in other languages, or outside the UK, need the course in their language with local reporting routes and law (`00_COURSE_OVERVIEW.md`, Phase 3: BE-06 with HA-16). The course is built UK first, with other countries as localisations (`01_LEARNING_DESIGN.md`, principle 8).

**What exists today:**

- Each voice config has a `language`, and it is part of the TTS cache key (`tts_service.rb`, line 61), so the same line in two languages caches separately.
- Everything else is English and hard-coded: the conversation buttons ("Skip", "[SPACE]", `person-chat-ui.js`, line 163), the title prompt (`title-screen-minigame.js`, line 33), the tutorial ("Welcome to Hacktivity Games!", `JS/systems/tutorial-manager.js`, line 115), the end screen defaults ("MISSION COMPLETE", `apply-actions.js`, line 190), the popup title ("Lab Sheet", `show.html.erb`, line 112). No page sets `lang`.
- `scripts/ink_runtime_check/tagdiff.mjs` compares the tags, knots, variables, diverts and choice conditions of two versions of an ink file (`AGENTS.md`, "Verifying work"). It is the natural check that a translation kept the structure.

**Design:**

- **Locale per game,** chosen at creation from the learner's or the organisation's setting (HA-16), stored on the game, and set as `lang` on every page; text in another language inside a page gets its own `lang` (WCAG 3.1.1 and 3.1.2).
- **UI strings** move to `public/break_escape/locales/<locale>.json` with ICU MessageFormat for plurals, read through a small `t(key, params)` helper. A lint flags new hard-coded strings in course UI.
- **Ink:** one translated copy per locale (`ink/<locale>/<npc>.ink`) with the same knots, stitches, variables, tags and choices. A structure-only mode of `tagdiff.mjs` proves each translation matches its source. The `/ink` endpoint picks the game's locale. Behaviour ids, option keys and tags are never translated, so BE-01 records and per-outcome results compare across languages.
- **Scenario text and documents:** an ERB helper `t('documents.supplier_directory')` reads per-module locale files.
- **Voices:** each character has a voice config per locale. Every voiced line in a language is generated once and cached like any other line.
- **Local content:** each locale has its own reporting routes, law references and fraud reporting services in the module's `concepts.md` localisation notes, and its own bank items where lures are national (tax authority, parcel firms) (BE-13).

**Acceptance criteria:**

- A pseudo-locale (accented characters, text 40% longer) shows every course screen with no truncated or overlapping text.
- A translated ink file with a missing knot, tag or choice fails the structure check.
- The same route through a module in two languages produces identical behaviour and option records.
- Each page's `lang` matches the game's locale.

**Depends on:** HA-16; BE-05 (profiles can carry a locale); BE-13 (localised banks); the voice tooling in the `tts-audio` skill.

**Risks and open questions:**

- Security advice translated without subject review can become wrong or unsafe. Each locale needs a reviewer who knows that country's reporting routes.
- Right-to-left scripts need layout work across the game shell; out of scope until a customer needs it.
- Voice quality and accent choice vary by language; budget a listening review per language.

### BE-07: Micro-drill launcher

**Priority and size:** P2, M (smaller if BE-03's page shell and BE-13 already exist).

**Why:** Monthly 3 to 5 minute drills give spaced practice through the year (`01_LEARNING_DESIGN.md`, principle 7; the catalogue lists a micro-drill for most core modules, such as core_01's "Phish or Fine?": eight emails from the bank, an optional timer and a streak counter). HA-21 sends them on a schedule. A drill must start fast, on a phone, without walking through an office.

**What exists today:**

- A minigame can only open from an object in a room (`JS/systems/interactions.js`, the per-type dispatch around lines 1063 to 1210; `research/current_state_break_escape.md`, "How minigames open"), so today a drill would need a whole scenario with a room, a player and an object.
- ERB randomisation per game (`mission.rb`, `ScenarioBinding`) can already draw content.
- Hacktivity launches a mission by creating a game and opening it (`research/current_state_hacktivity.md`, "Launch and resume").

**Design:**

- **A drill is a small mission** with a `drill` block and no rooms: `"drill": { "minigame": "inbox", "mode": "practice", "bank": "core01_emails", "items": 8, "timer": "optional", "feedback": "immediate", "parentModule": "core_01" }`. The validator accepts a scenario with a `drill` block and no rooms.
- **It runs in BE-03's page shell,** not the Phaser game: `GET /break_escape/games/:id/drill` loads the minigame's accessible DOM mode directly, so it opens in a second or two on a phone and is accessible from the start.
- **Content** is drawn at game creation from the bank (BE-13), avoiding items the learner saw in the last few drills (from their BE-01 records).
- **Records:** each item writes a BE-01 `decision` or `check_item` record against the parent module's behaviours (for example C01-B8 for the domain items), so drills feed the same per-outcome view. The drill ends with a `drill_result` record (items right, streak, time taken) and a short result card.
- **Timer:** off by default. A learner who turns it on can still pause it, and the time is never part of the rating (BE-04).
- **Launch:** a deep link (`/break_escape/missions/<drill>/play`) that HA-21 emails or posts, and a "Practise" button on the learner home (HA-17).

**Acceptance criteria:**

- "Phish or Fine?" opens from a link straight into the first email in under 3 seconds on a mid-range phone, with no world to load.
- Two drills a month apart draw different items, with no repeats from the previous drill where the bank allows.
- Each drill item appears as a record against the parent module's behaviour, and the organisation dashboard can show drill results by outcome.
- The drill is fully usable with keyboard and screen reader, with the timer off by default.

**Depends on:** BE-01, BE-13, BE-19 (the minigame registry), BE-03 (the page shell); HA-21 for scheduling.

**Risks and open questions:**

- Repetition breeds pattern-learning ("it's always the third one"). Shuffle positions and vary the proportion of genuine emails.
- Open: should drills count towards completion? Recommendation: no. They are practice; completion stays with the full module and its check.

### BE-08: Visual aids in conversations

**Priority and size:** MVP, M.

**Why:** The mentor explains with something to look at (EX-01): core_01's "Anatomy of a phish" steps through four highlights on the hook email, then a web address with the real domain marked. Multimedia learning works best when words and pictures arrive together (Mayer, 2020, cited in `01_LEARNING_DESIGN.md`). Video calls need a shared screen (core_15's deepfake call, role_01's briefings), and BE-05 needs a card to show organisation values while the voice stays generic.

**What exists today:**

- `Background[path]:` lines swap the whole conversation background, in sequence with the lines around them (`person-chat-minigame.js`, `parseBackgroundLine`, around line 895), and `Narrator[none]:` shows a line with no character (line 760). Background precedence is documented in `JS/minigames/person-chat/person-chat-background.js`.
- Video-call mode frames a conversation as a call with a self-view (`person-chat-ui.js`, around line 236); its status bar text "SECURE VIDEO LINK" is hard-coded (line 253).
- Tags reach the conversation one line at a time: `InkEngine.continue()` returns one visible line with the tags gathered since the last one (`ink-engine.js`, line 31), and person-chat processes them as that line is shown (`displayAccumulatedDialogue`, around line 1003). So a tag on its own line takes effect with the next spoken line, which is the timing an aid step needs.
- There is no way to show an image or document inside the panel. `features/explainers_video_and_npc.md` proposes the tag names `#visual_aid` and `#aid_step` for this feature to settle.

**Design:**

*Aid definitions* live in the scenario, so the same aid serves the game, the text route and the debrief thumbnails:

```json
"visualAids": {
  "core01_hook_email": {
    "kind": "email",
    "source": "emails/hook_mailbox_full",
    "alt": "The 'mailbox almost full' email from this morning.",
    "steps": [
      { "target": "button",  "label": "1", "describe": "Highlighted: the 'Re-validate mailbox' button. It wants your password." },
      { "target": "deadline", "label": "2", "describe": "Highlighted: 'within 24 hours'. It is trying to rush you." }
    ]
  },
  "core01_address": {
    "kind": "image",
    "src": "assets/aids/core01_address.png",
    "alt": "A web address with its real domain, secure-login.info, marked.",
    "longDescription": "The address reads larkspur.co.uk.secure-login.info/mail. Reading from the right-hand end, the real domain is secure-login.info.",
    "steps": [ { "rect": [212, 40, 180, 28], "label": "1", "describe": "Highlighted: secure-login.info, the real domain." } ]
  }
}
```

Three kinds:

- **`email` and `document`** are rendered as HTML from the same content MG-01 or the notes minigame uses, with named anchors as highlight targets. This keeps the text real: it scales with text size, translates and reads aloud.
- **`image`** is for diagrams, with `rect` highlight boxes in image pixels plus alt text and an optional long description.
- **`card`** is a short block of on-screen text, which may carry BE-05 organisation values (the "how to report here" card).

*Tags* (adopting the names proposed in `explainers_video_and_npc.md`):

| Tag | Effect |
|---|---|
| `#visual_aid:<id>` | Shows the aid in the panel beside the speaker, replacing any aid already shown |
| `#aid_step:<n>` | Moves the highlight to step n, and adds the step's `describe` text to the transcript |
| `#aid_clear` | Removes the aid |
| `#share_screen:<id>` | In a video call, shows the aid as the shared screen and shrinks the caller to a picture in picture |

Highlights are drawn as a thick outline with a numbered marker and the step label in text below the aid, so they never rely on colour. The learner can open any aid full screen (Enter, or click), zoom it, and step back and forth through the highlights. Under reduced motion highlights appear without animation. The video-call status bar text becomes a setting (default "Video call").

*In the text route,* `#visual_aid` renders the aid inline: HTML aids as real text, images with their alt text and long description, and each `#aid_step` as its `describe` sentence.

*Debrief thumbnails* (BE-02) reference aids by id (`"thumbnail": "aid:core01_expected_sender"`).

*Validator:* every aid has alt text, every step has a `describe`, every `#visual_aid` and `#aid_step` names an aid and a step that exist, and every image path exists.

**Acceptance criteria:**

- In core_01's Learn beat, each `#aid_step` highlight appears with the line it is tagged to, not before or after.
- A screen reader user hears each step's description in the transcript, and the aid has a meaningful text alternative.
- At 200% text size an `email` aid reflows and stays readable; an `image` aid can be opened full screen and zoomed.
- With the colour vision deficiency simulations in Chrome DevTools, every highlight is still identifiable by its outline and number.
- The same aid appears in the text route and as the debrief thumbnail.
- A share-screen call in core_15 shows the aid with the caller in picture in picture, and the status bar shows the configured text.

**Depends on:** BE-05 (cards with organisation values); MG-01 (its email renderer, for `email` aids).

**Risks and open questions:**

- Panel space on small screens: on narrow viewports the aid takes the panel and the speaker shrinks to a name and portrait icon.
- Aids made as screenshots of the game's own UI go stale when the UI changes. Prefer HTML aids rendered from live content.
- Open: one aid per chunk, as `explainers_video_and_npc.md` recommends? Yes; the engine allows more, but the writing guide should keep to one.

### BE-09: Intranet terminal

**Priority and size:** MVP, M.

**Why:** The intranet, The Lark, is where the Reference beat happens (`01_LEARNING_DESIGN.md`, "What lab sheets become"): the reference card with the organisation's own reporting details, the policies, the contacts, the survey list core_01 asks players to check, and the place a policy is acknowledged and recorded (core_16, HA-07). Opening the reference card is part of core_01's completion rule (`assessment.md`).

**What exists today:**

- The `lab-workstation` object opens any HTTPS page in a near full-screen iframe with an "Open in new tab" button, pauses game input while open, and keeps the scroll position (`JS/utils/lab-workstation.js`; `JS/systems/interactions.js`).
- The popup's title is fixed as "Lab Sheet", and its iframe has no `title` (`app/views/break_escape/games/show.html.erb`, lines 107 to 118). The game does not add `?embedded`, so a lab sheet shows its own header inside the game (`research/current_state_lab_sheets.md`).
- The notes minigame renders a markdown subset with headings, bold, lists and tables, but no images (`JS/utils/note-markdown.js`).
- Nothing records that a page was read or a policy accepted.

**Design:**

- **A new `intranet` object type** opens The Lark as a DOM overlay rendered by the engine, not an iframe, so module content can use BE-05 values and works the same in the text route. The overlay is branded with `org.name` and `org.logo`, has a navigation landmark, a skip link, headings and a search box over its own pages.
- **Pages** are defined in the scenario: `"intranet": { "title": "The Lark", "home": "news", "pages": { "reference_card": { "title": "Report it: what to do", "markdown": "..." }, "surveys": { ... } } }`. Pages are written in the notes markdown subset, extended with images (alt text required), links between pages and a "print this page" action. Organisation values come in through the ERB helpers (BE-05). The reference card page is generated from the module's `concepts.md` key messages and the profile.
- **External pages:** the organisation's own policies (HA-07) open in the existing iframe popup, with the popup title set from the page (fixing the hard-coded "Lab Sheet"), the iframe given a `title`, and `?embedded` added for HacktivityLabSheets pages.
- **Records:**
  - opening a page marked `"track": true` writes a BE-01 milestone (`reference_opened` for the card);
  - a policy page can carry an acknowledgement block, "I have read and understood the Acceptable Use Policy, version 3", with a checkbox and a button. Pressing it writes a `policy_ack` record with the policy id, version and a hash of the text shown;
  - the server passes the acknowledgement to the host through a new hook, `on_policy_acknowledged`, so HA-07 stores it against the person and the version.
- **Reachable at any time:** The Lark opens from a HUD button and a key as well as from the in-world terminal, so the reference card is always one step away during a module.

**Acceptance criteria:**

- In core_01, The Lark shows the reference card with the test profile's Report button name and service desk number.
- Opening the reference card writes one `reference_opened` milestone; acknowledging a policy writes one `policy_ack` record, and the host hook receives it with the policy version.
- The overlay passes axe-core with no violations and works with keyboard and screen reader; the popup title and iframe title name the page being shown.
- The same pages render in the text route.
- Printing the reference card gives one clean page.

**Depends on:** BE-05; BE-01; HA-07 for policy versions and storage; HA-23 for the lab sheet pages it embeds.

**Risks and open questions:**

- Two content homes (scenario pages and HacktivityLabSheets) can drift. Rule: module content in the scenario, long-form field guides in HacktivityLabSheets, and the reference card generated from `concepts.md` in both places.
- Open: should a policy acknowledgement inside a game count as the organisation's formal acknowledgement? Recommendation: yes, if HA-07 issued the version shown and the record carries the text hash; otherwise HA-07 asks again on its own page.

### BE-10: Spot-the-risk mode

**Priority and size:** P2, M.

**Why:** Several topics are about noticing what is wrong in a place: a clean desk sweep and a propped side door (core_10, Physical security), confidential waste in the wrong bin (core_06), a screen on show in a café (core_09), a ward's shared workstation left logged in (sector_01). A find-and-fix activity teaches noticing directly, and the found and missed list makes a strong debrief.

**What exists today:**

- Objects can be examined (the `examine` minigame: a close-up with observations) and searched (the `container` minigame; PCs show a desktop of files), and they carry `observations` text (`research/current_state_break_escape.md`).
- `triggerOnInteract` runs actions when an object is used (`JS/systems/interactions.js`, line 713), and the `tint_objects` action can highlight sprites (`apply-actions.js`, line 111).
- The existing art covers desks, PCs, post-its, printers, shredders, bins and doors; m08 already has a password on a post-it by the coffee machine and uncollected printouts (`research/existing_content_reuse.md`).
- Nothing marks an object as a risk, counts found and missed, or summarises them.

**Design:**

- **Risk objects** (the core_10 ids here are illustrative): any object can carry `"risk": { "id": "r_postit_password", "label": "Password on a sticky note", "fixes": { "remove_and_report": "secure", "turn_it_over": "developing" }, "behaviour": "C10-B3" }`. Decoys (ordinary objects that look a little like risks) carry `"risk": { "id": "d_postit_shopping", "decoy": true }`.
- **Interaction:** using an object in a spot-the-risk room adds "Flag as a risk" to its examine view. Flagging a real risk offers its fixes; flagging a decoy is recorded too, never punished: "Fine to check. That one's a shopping list."
- **Session:** a room-level block, `"spotTheRisk": { "id": "desk_sweep", "behaviour": "C10-B2", "timer": "optional", "closeOn": "global_variable_changed:sweep_done" }`. A counter in the HUD shows how many have been flagged, never how many remain, so it doesn't turn into hunting for the last pixel.
- **Summary:** at the end, a found and missed list with a thumbnail and one line for each risk, which also feeds the BE-02 debrief. Each risk writes a BE-01 record (found and fixed, found, or missed), and the session writes one for its own behaviour (for example "found at least five of seven").
- **Accessible play:** the BE-04 places list includes every interactable object in the room, risks and non-risks alike, so keyboard and screen reader users can sweep the room without the list giving answers away. In the text route the room becomes a described list of the same objects, each with "Look closer" and "Flag as a risk".
- **Timer:** off by default; when on, it follows the BE-04 time scale and never changes a rating.

**Acceptance criteria:**

- A desk sweep with seven risks and four decoys records each risk once as found and fixed, found, or missed, plus one session record.
- The places list and the text route list risks and decoys together, in an order that does not depend on which are risks.
- The summary and the debrief agree for every route through the sweep.
- With the timer off, the sweep never ends on time; it ends when the player says they're done.

**Depends on:** BE-01, BE-02, BE-04 (places list); BE-03 for the text version.

**Risks and open questions:**

- Pixel-hunting frustrates players and is a barrier for people with low vision. Risks must be visible at normal zoom and described in examine text; the examine close-up should carry the detail, not the room sprite.
- Open: should the sweep tell players how many risks there are? Recommendation: yes, at the start ("there are seven things to fix"), with no remaining count during play.

### BE-11: Role switch

**Priority and size:** P2, M.

**Why:** Attacker-view interludes (EX-06) let the learner briefly play Jo Fairweather's authorised tester to see how little an attacker needs: designing the phishing test in core_01's "Phish Tank" alternative, building a pretext in core_02 and core_12, tailgating in core_10. The game has to switch the player's character, kit and objectives for a few minutes, frame it clearly as an authorised test, and switch back.

**What exists today:**

- The player's sprite and display name are injected into `scenario_data['player']` at game creation (`game.rb`, `inject_player_preferences`, around line 2385), and `validSprites` limits the avatar choices.
- Inventory, objectives (aims can be locked and unlocked by ink and events) and the attacker mechanics (lockpicking, RFID cloning, line-of-sight challenges in `JS/systems/npc-sight-challenge.js`) all exist.
- There is no way to move the player to another room or tile from a script; the player always starts or respawns in the start room (`JS/core/game.js`, around lines 1267 to 1332).

**Design:**

- **Roles in the scenario:** `"roles": { "tester": { "label": "Authorised test: you are working with Jo", "sprite": "<tester sprite>", "displayName": "Test team", "inventory": [ ... ], "aims": ["phish_tank"], "place": { "room": "car_park", "tile": { "x": 4, "y": 6 } } } }`.
- **Switching:** `#switch_role:tester` (ink) or `{ "type": "switch_role", "role": "tester" }` (actions) stores the player's own sprite, inventory, active aims and position, applies the role, and shows a persistent banner with the role's label. `#switch_role:self` restores everything.
- **Moving the player:** this needs **BE-24 (the place-player action)**, which moves the player to a room and tile with a fade (or a plain cut under reduced motion) and records where they are.
- **Records:** BE-01 records written during the interlude carry `"role": "tester"`, so dashboards can separate attacker-view decisions from staff decisions.
- **Framing in content:** Jo always introduces the interlude as an authorised test and closes it with what would have stopped her (`03_WORLD_AND_CAST.md`), and the interlude stays at the level of pretexts and psychology, never a how-to (`AWARENESS_COURSE_BRIEF.md`).
- **Text route:** a narrated interlude with the same choices and records.
- **Dexterity minigames:** lockpicking and RFID cloning are optional flavour in these interludes, with an assist or a skip, and are never assessed.

**Acceptance criteria:**

- Switching to the tester and back restores the player's sprite, inventory, aims and position exactly, including after a reload in the middle of the interlude.
- The role banner is visible and announced for the whole interlude.
- Records written in the interlude carry the role.

**Depends on:** BE-24 (the place-player action); BE-01; EX-06 for content rules.

**Risks and open questions:**

- Tone: playing the attacker can look like glamorising attacks. Keep interludes short, framed by Jo and authorisation, and always end on the defence.
- A reload during the interlude must restore the tester state, so the stored "self" state is saved with the game state, not only in memory.

### BE-12: Short sessions and resume

**Priority and size:** MVP, M.

**Why:** Induction Essentials is taken "in sittings of 10 to 20" minutes (`00_COURSE_OVERVIEW.md`), and many Larkspur staff work on phones between jobs. A learner must be able to stop at a natural break and come back to the same place, quickly, on another device, without replaying what they have done or losing evidence.

**What exists today:**

- Server-side autosave of globals, notes, inventory, unlocks, objectives, phone threads, NPC ink variables, timers and the game clock (`JS/state-sync.js`; the controller's `sync_state`, around line 683), with a final flush on page hide (`state-sync.js`, line 323).
- A resume overlay offers Resume, Restart and New Session outside Hacktivity (`show.html.erb`, the `session-resume-overlay`), and Hacktivity resumes the active game (`research/current_state_hacktivity.md`).
- But the player always respawns in the start room (`JS/core/game.js`, around lines 1267 to 1332), a conversation reopens at its hub rather than mid-scene, and nothing marks the beats of a module.

**Design:**

- **Checkpoints at beat boundaries,** declared in the scenario:

  ```json
  "checkpoints": [
    { "id": "learn_start", "beat": "learn", "label": "Ama explains what gave it away",
      "place": { "room": "operations", "tile": { "x": 7, "y": 5 } },
      "requires": "globalVars.hook_done === true",
      "apply": [ { "type": "set_global", "key": "inbox_open", "value": false } ] }
  ]
  ```

  Reaching one (ink `#checkpoint:learn_start`, an event, or a task) writes a BE-01 milestone and stores the checkpoint id in the game.
- **Resume** offers "Continue from: Ama explains what gave it away", places the player at the checkpoint's room and tile with BE-24 (the place-player action), applies the checkpoint's `apply` actions so the world is in a known state, and shows a short "So far" card built from BE-01 records (on-screen text only, for example "You reported the 'mailbox full' email").
- **Explicit save and exit** in the pause menu, so stopping feels safe. Hacktivity's learner home shows "Resume, about 8 minutes left", estimated from the beats still to do (HA-17).
- **Time budget:** the scenario declares a target minutes figure for each beat, and BE-01 milestones measure the real times. A playtest report compares them, and the evaluation (HA-14) tracks them in live use.
- **Both routes:** checkpoints are the points where a learner can switch between the game and the text route (BE-03).

**Acceptance criteria:**

- Closing the tab at any point in core_01 and reopening it on another device resumes at the last checkpoint, in the right room, with no lost records.
- The "So far" card matches the records.
- Median playtest times per beat are within 25% of the targets, or the targets are revised.
- Switching between the game and the text route at a checkpoint keeps a consistent state.

**Depends on:** BE-01; BE-24 (the place-player action); BE-03.

**Risks and open questions:**

- Mid-beat state can be complex (a timer half run, an email half read). Checkpoints only at beat boundaries keep this manageable; within a beat, today's autosave and the existing conversation reopen behaviour apply.
- Open: how long is a game resumable? Recommendation: until the assignment's due date, then the learner restarts the module and earlier records stay as an incomplete attempt.

### BE-13: Content banks and randomisation

**Priority and size:** P2, M.

**Why:** If every learner sees the same emails, colleagues pass on the answers and the hook stops being an honest baseline (core_01, open question 2). core_01 plans a bank of about 60 emails tagged by slot, lever and difficulty, with fictional domains generated per game. The knowledge check draws six items from a bank of eight to twelve. Drills (BE-07) need fresh content each month, and the capstone (core_17) needs a new edition every year.

**What exists today:**

- Every scenario is an ERB template with full Ruby, rendered once when the game is created and stored in `scenario_data` (`game.rb`, `generate_scenario_data`, around line 2225). So a draw made in ERB is fixed for that game, survives reloads, and a new game draws again.
- `ScenarioBinding` (`mission.rb`, line 193) already provides `random_password` (`SecureRandom.alphanumeric(8)`), `random_pin` and `random_code`, and templates can call `rand`, `.sample` and `SecureRandom` directly.
- The server strips answers before the client sees the scenario (`filtered_scenario_for_bootstrap`, `game.rb`, around line 714), a pattern that check item keys can follow.
- Two other places render the template: `current_voice_configs` re-renders it with an empty context to read voice configs (`mission.rb`, line 128), and the validator renders it with its own copy of the binding (`scripts/validate_scenario.rb`, line 37).

**Design:**

- **Banks** are YAML files: shared course banks in `scenarios/awareness_shared/banks/` (a new folder) and module banks in `scenarios/<module>/banks/`. Each item has `id`, `slot`, `levers`, `difficulty` (1 to 3), `editions`, `locales`, `genuine`, `voiced`, the minigame content (for an email: sender name, address, subject, body, links, attachments), an `assess` map for BE-01, and for check items an `answer` that stays on the server.
- **ERB helpers** in `ScenarioBinding` and the validator's copy:
  - `bank(name)` loads a bank;
  - `draw(name, slot:, n: 1, difficulty: nil, genuine: nil)` draws items;
  - `draw_set(name, recipe)` draws a balanced set ("ten practice emails, difficulty rising, two genuine");
  - `domain(:lookalike, of: 'northbeck.co.uk')` picks a domain from the vetted list.
- **A seed per game:** generated at creation and stored in `player_state`. All helpers draw from a `Random` seeded with it, so the server, the validator and `current_voice_configs` render the same draw, and a test can reproduce any learner's content from the seed.
- **No repeats on retake:** the binding receives the item ids the learner has already seen in this module (from their BE-01 records, which carry `source.item`), passed in like `vm_context`, and draws prefer unseen items.
- **The draw is recorded:** the rendered scenario lists `"drawn": { "hook": "hook_mailbox_full", "expected_sender": "es_northbeck_portal_03" }`. Records name the item, so the debrief, the audit pack and the per-item statistics (how often each email is reported) all know what each learner saw. HA-08 uses those statistics to retire weak items.
- **Editions:** `mission.json` gains `edition` (for example "2027"), banks filter by it, and HA-19 records which edition each learner took.
- **Organisation items:** questions an organisation adds in HA-08 reach the binding with the organisation profile (BE-05).
- **Domains:**
  - never generated as arbitrary strings, which could turn out to be real;
  - drawn only from a vetted list (`domains.yml`), where each entry records when it was checked and found unregistered, re-checked every edition;
  - where a domain can't be checked, the reserved names of RFC 2606 (`.example`, `.test`, `.invalid`) are used;
  - links in the game never open real sites.
- **Voiced bank items** (callers for MG-04, for example) contain fixed text only. Each one's audio is generated once, so the audio cost grows with the bank, not with the number of learners. Keep the voiced share of any bank small.
- **Fairness:** recipes guarantee one item per slot (core_01's four threat slots) and a balanced difficulty. The validator renders 50 seeds per module and checks that each draw satisfies its recipe and passes the BE-03 parity check.

**Acceptance criteria:**

- With the planned bank size, two learners starting core_01 see different threats in at least three of the four Apply slots.
- The same seed renders an identical scenario on the server and in the validator.
- A retake avoids the previous attempt's items wherever the bank allows.
- Every drawn item id appears in the game's records and debrief.
- The validator rejects a rendered domain that is not on the vetted list or under a reserved name.
- Check item answers never appear in the bootstrap payload (a test inspects it).
- Fifty seeded renders of core_01 pass the validator and the parity check.

**Depends on:** BE-01 (items seen); BE-05 (organisation items); HA-08 (question banks); HA-19 (editions).

**Risks and open questions:**

- Every item needs the same quality checks as fixed content: accuracy, plain English, alt text for images, the text route version. A bank multiplies review work, so size banks to what can be reviewed.
- Difficulty can differ between learners. Calibrate item difficulty from report rates in the records, and keep each slot's items within a narrow band.
- Domain checks go stale as names get registered. Re-check the list before every edition.

### BE-14: xAPI statements

**Priority and size:** P2, M.

**Why:** Customers with their own LMS or learning record store want standard learning records, not just complete and score (HA-10, HA-22). xAPI is the standard way to send "started, decided, completed, scored" from a game, and it carries the per-decision and per-outcome evidence the course is built on.

**What exists today:**

- Nothing in the engine. Hacktivity has no LTI, SCORM, xAPI or cmi5 support (`research/current_state_hacktivity.md`, "Standards and integrations").
- The engine tells its host when a game completes (`on_game_complete`) and when a task completes (`on_task_complete`) (`lib/break_escape.rb`, line 19).
- BE-01 provides the records the statements are built from.

**Design:**

- **Generated on the server**, in a background job, from BE-01 records and milestones, never in the browser, so learning record store credentials never reach the client. Statement ids are derived from record ids (UUID version 5), so a retry never duplicates a statement.
- **Standard:** xAPI as standardised in IEEE 9274.1.1-2023 (published 6 October 2023; an active standard based on xAPI 1.0.3; https://standards.ieee.org/ieee/9274.1.1/7321/).
- **Actor:** an `account` whose `homePage` is the organisation's Hacktivity address and whose `name` is an opaque learner id. Never an email address.
- **Activities:** the module (`https://<host>/xapi/activities/awareness/core_01`), each behaviour (`.../core_01/behaviours/C01-B2`), each check item (`.../core_01/check/C01-Q1`) and each beat, using the module item ids from the template (`C01-LO1`, `C01-B1`, `C01-CB1`, `C01-Q1`).
- **Verbs** from the ADL vocabulary, matching the outline in `assessment_and_evidence.md`, section 8:
  - `initialized`, `suspended`, `resumed` and `terminated` for the session;
  - `interacted` for an assessed decision, with `response` set to the option key, a `rating` extension and the outcome ids;
  - `answered` for a check item, with `success` and `response`;
  - `passed` for a knowledge check that reaches the pass mark, with a scaled score;
  - `completed` when the module's completion rule is met;
  - `experienced` for a video watched (MG-21) or the reference card opened.
- **No "failed" outside Hacktivity.** An attempt below the pass mark may be recorded as `failed` inside Hacktivity's own store, but no statement that leaves Hacktivity uses `failed`: to a customer's store or LMS, that attempt is simply not passed yet (`assessment_and_evidence.md`, principle 4 and section 8).
- **Context:** `registration` is a UUID per game attempt; the parent activity is the module; the grouping is the learner's pathway (HA-03); extensions carry the module version, edition, route, locale and organisation id.
- **Destinations:** Hacktivity's own store (HA-22), which keeps raw statements for 12 months (`assessment_and_evidence.md`, section 11) and forwards a filtered copy to a customer's store where configured. For an LMS launch through cmi5 (HA-10), Hacktivity sends the statements cmi5 defines in the order it requires; per-decision statements go only if the organisation turns them on. Customers who would rather pull results into HR or GRC systems use the public API and webhooks (HA-24), which carry the same completion data.
- **A published xAPI profile** describes the activity types, verbs and extensions, so a customer's data team can read the data.

**Acceptance criteria:**

- A completed core_01 run sends `initialized`, one `interacted` per assessed behaviour, one `answered` per check item, `passed`, `completed` and `terminated` to a test store, all valid against the xAPI statement schema.
- A run with a check attempt below the pass mark forwards no `failed` statement to an external store or LMS.
- Re-running the job sends no duplicates.
- No statement contains an email address or a name.
- All statements for one attempt share a registration.

**Depends on:** BE-01; HA-22 and HA-10; HA-24 for the pull alternative; HA-15 for the data processing terms that cover forwarding.

**Risks and open questions:**

- Once forwarded to a customer's store, the data is outside our control. The customer's agreement with Hacktivity must cover it (HA-15).
- cmi5 restricts what an assignable unit may send and when; HA-10 owns that contract, and this feature must not send cmi5-defined verbs outside it.
- Open: send per-decision statements to customers' stores, or only module-level results? Recommendation: module-level by default, per-decision on request, since per-decision data about named staff is more sensitive.

### BE-15: Facilitated group mode

**Priority and size:** P2, M, with Hacktivity's facilitator console and attendance in HA-13. Phone voting from the audience would take it to L.

**Why:** Every module has a facilitated version: a team plays on one screen with a facilitator, pausing at marked points to discuss (45 to 60 minutes; `01_LEARNING_DESIGN.md`, "Delivery modes"). core_01 names its pause points ("Who would have clicked? Be honest. Why?" after the hook), and role_01 is built for a board in a room together.

**What exists today:**

- The pattern exists only as text. sis02's `mission.json` has `facilitator_notes` with eight stop-and-discuss points, each a choice in play that the debrief revisits (`scenarios/sis02_energy/mission.json`), but nothing in the engine or Hacktivity reads the field (`research/current_state_break_escape.md`, "Scenario format").
- MusicController already coordinates browser tabs with a BroadcastChannel (`JS/music/music-widget.js`, header comment), a mechanism a presenter window can reuse.
- There is no pause, no presenter view and no group decision.

**Design:**

- **Pause points in the scenario:** `"pausePoints": [ { "id": "after_hook", "when": "global_variable_changed:hook_done", "title": "Would you have clicked?", "prompts": ["Who would have clicked? Be honest. Why?"], "notes": "Let people admit it. Nobody is marked down.", "revisitInDebrief": true } ]`. Each module's game design lists them under "Facilitated session".
- **Facilitated route:** set by HA-13 when a session starts. At a pause point the game pauses (using BE-23 (pause and time scale)) and shows a discussion card with the prompts; the facilitator presses Resume.
- **Presenter view:** a BE-04 settings preset (text at 150%, captions on, dialogue advances only on Continue, timers off) and a minimal HUD.
- **Facilitator console:** a second window opened from the game and kept in step through a BroadcastChannel. It shows the notes, the next pause point and the vote panel.
- **Group decisions:** at an assessed choice the facilitator can open a vote, enter the counts from a show of hands, and apply the group's choice. Records carry `route: "facilitated"` and `group: { "size": 9, "votes": { "report_and_call": 7, "change_password": 2 } }`. They belong to the session, never to individuals.
- **Own-plan exercises (role_01):** for a board working through its own incident plan (the Cyber Governance Code's D2, "plan your response"), the facilitated session can build and store an **action list** as the group decides who does what by when, and an **exercise report** at the end that summarises the decisions, the actions and who owns them. Both are on-screen text, built from the session's group decisions, so they can carry BE-05 organisation values and never appear in a voiced line. They are session artefacts, not individual evidence, and the facilitator console (HA-13) holds and exports them.
- **Individual evidence:** each participant still takes the knowledge check on their own device, and HA-13 records attendance. Whether attendance plus a passed check completes the module is the organisation's setting.
- **Debrief:** BE-02 in presenter mode shows the group's decisions and returns to each pause point's prompt.

**Acceptance criteria:**

- In facilitated mode, core_01's three pause points fire at the right moments, stop game time and resume cleanly.
- The console and the game stay in step through a reload of either window.
- A group vote is recorded with counts and the applied option, and no individual record is created for it.
- The presenter view meets the BE-04 baseline at its preset settings.

**Depends on:** BE-23 (pause and time scale); BE-01; BE-02; HA-13.

**Risks and open questions:**

- On a shared screen the facilitator must read out or describe what is shown for anyone who can't see it; the facilitator notes should say so.
- Group records must not be read as individual evidence.
- Open: phone voting from the audience? Recommendation: later, with HA-13, once the basic mode has been run with real teams.

### BE-16: Time skips and consequence scenes

**Priority and size:** P2, S.

**Why:** Games can show consequences safely (`01_LEARNING_DESIGN.md`, "Why games"): core_01 shows the player's account sending the same phish twenty game-minutes after a sign-in, core_07 can show how far ransomware spreads before someone reports it, and core_11 can show what happens three weeks after a fraudulent payment.

**What exists today:**

- Cutscenes are conversations opened by timers or event mappings, as person-chat or video-call overlays with a chosen background (`conversationMode`, `background`; `JS/systems/npc-manager.js`, `_buildMappingConfig`, around line 556). `Narrator[none]:` and `Background[...]:` lines already let a scene set a mood without a character.
- An in-game clock (`"gameClock": { "start": "Mon 08:30" }`, `JS/systems/game-clock.js`) shows in-game time on phone messages and clocks. Scenario timers can start on a global and run actions (`JS/ui/scenario-timer-dispatcher.js`, line 230).
- There is no title card, no way to show a different date for a scene, and no pause.

**Design:**

- **Definitions** in the scenario: `"timeSkips": { "invoice_3w": { "card": "Three weeks later", "subtitle": "Northbeck's accounts office", "clockOffset": "21d", "scene": { "npc": "dawn_northbeck", "knot": "three_weeks_later", "mode": "video-call" }, "returnCard": "Back to Monday morning" } }`.
- **Triggers:** `#time_skip:invoice_3w` in ink, or `{ "type": "time_skip", "id": "invoice_3w" }` as an action (timers, event mappings).
- **Sequence:**
  1. Game time pauses (BE-23 (pause and time scale)).
  2. A full-screen title card appears, with real text as a heading that receives focus. It waits for Continue; it never times out, and it fades only when reduced motion is off.
  3. Clocks show the offset time during the scene.
  4. The scene plays.
  5. The return card appears, the clock goes back and game time resumes.
- **Records:** a `consequence_shown` milestone, so the debrief can say "You saw what happened three weeks later".
- **Text route:** the same cards and the same scene, as text.
- **Tone:** every consequence scene ends with the doable action (design principle 2), shown with care, never as a jump scare.

**Acceptance criteria:**

- After a time skip, game time, timers and the in-game clock are exactly where they were before it.
- The title card is announced by screen readers and waits for the learner.
- A reload during the scene resumes at the start of the scene.
- The text route shows the same scene.

**Depends on:** BE-23 (pause and time scale); BE-03.

**Risks and open questions:** consequence scenes are powerful and easy to overuse. Recommendation: at most one per module, always tied to a decision the learner made.

### BE-17: Cross-module memory

**Priority and size:** P3, M.

**Why:** Shared characters make the course feel like a series (`03_WORLD_AND_CAST.md`). When Leo says in core_04 "You told me to report it straight away last time", the course feels continuous, and the capstone (core_17) can return to the learner's earlier decisions. The cast document makes this optional, and dialogue must not assume an order beyond core_00.

**What exists today:** nothing. Each module is a separate `Game` with its own globals, and nothing carries across games.

**Design:**

- **A small server store:** a table `break_escape_player_memories` (player, course key, key, value, source game, source module, updated at). The course key keeps the awareness course separate from the campaign.
- **Writes are derived, not tagged.** Each module declares what it remembers as conditions over its final state, evaluated when the module concludes: `"memory": { "writes": { "c01_told_leo_to_report": "globalVars.assess_c01_b6 === 'report_and_call'" }, "reads": ["c01_told_leo_to_report"] }`. Nothing half-finished leaks into other modules.
- **Reads become globals:** at game creation each declared read is injected as a global with a `mem_` prefix (`mem_c01_told_leo_to_report`), false when the learner hasn't taken that module, so ink handles every order.
- **Voiced lines** choose between fixed lines with inline conditionals and never print a remembered value.
- **Limits:** only small typed values (true or false, a short option key, a number), never free text. Memories are included in the learner's data export and deletion (HA-15). An organisation can switch memory off. Memory never changes a rating.
- **Validator:** every read is written by some module (a warning otherwise), and every write is declared.

**Acceptance criteria:**

- Taking core_04 after core_01 plays the remembered line; taking core_04 first plays the default line.
- With memory switched off for the organisation, every read is false.
- Deleting a learner deletes their memories.

**Depends on:** BE-01 (the globals it reads); HA-15.

**Risks and open questions:** callbacks multiply writing and testing. Recommendation: two or three callbacks per module at most, each with a natural default line.

### BE-18: Work task and interruptions

**Priority and size:** MVP, M.

**Why:** Design principle 4: threats arrive inside real work. The Apply beat always gives the learner a job to finish, and the security tests appear inside it, unannounced. core_01's Apply beat is "send the delivery schedule by 10:00" with a three-step task bar while about twelve messages arrive over six minutes of game time, four of them threats drawn one per slot from the bank. Other modules use phone calls, chat messages and visitors in the same way.

**What exists today:**

- **Objectives** (`JS/systems/objectives-manager.js`) with aims, tasks, progress counts, optional tasks and unlocks, shown in the objectives panel (`JS/ui/objectives-panel.js`), and posted to the server on every change.
- **Scenario timers** with delays, start and cancel conditions, countdowns and actions, all resuming after a reload (`JS/ui/scenario-timer-dispatcher.js`; timers run `actions` through `applyActions` at line 230).
- **The in-game clock** (`"gameClock"`, `JS/systems/game-clock.js`).
- **NPC timed messages** and **timed conversations**, and **event mappings** that open conversations, send messages and make an NPC walk to the player (`navigateToPlayer`, `npc-manager.js`, around line 581).
- **Barks** already wait while a minigame is open and play when it closes (`MinigameFramework.holdsBarks`, `JS/minigames/framework/minigame-manager.js`, line 119).
- What is missing: a work task with visible steps and a deadline, an interruption schedule that draws from banks, awareness of when the learner is busy (in a conversation, mid-email), and a pause.

**Design:**

*The work task* is a scenario block shown as a slim bar under the HUD:

```json
"workTask": {
  "id": "delivery_schedule",
  "title": "Send the delivery schedule to the field teams",
  "steps": [
    { "id": "get_file", "label": "Get Northbeck's schedule", "doneWhen": "globalVars.schedule_received === true" },
    { "id": "check", "label": "Check it against last week's", "doneWhen": "task:compare_schedule" },
    { "id": "send", "label": "Send it to the field teams", "doneWhen": "task:send_schedule" }
  ],
  "deadline": { "at": "Mon 10:00", "soft": true }
}
```

Steps complete from globals or objective tasks, so the bar adds no new state. The deadline is shown as text ("by 10:00", "about 20 minutes left"), never as a red countdown, and with `soft: true` it can't be failed (core_01: "Keep the deadline gentle").

*Interruptions* are a schedule the engine turns into the existing timers, actions and event mappings:

```json
"interruptions": [
  { "id": "i_expected_sender", "at": "+00:04:00", "type": "email", "item": "<%= draw('core01_emails', slot: 'expected_sender').id %>",
    "assess": { "behaviour": "C01-B2", "unanswered": "ignored" } },
  { "id": "i_leo_slip", "after": "global_variable_changed:schedule_received", "delay": "+00:01:30",
    "type": "visitor", "npc": "leo_brennan", "knot": "slip_ask" }
]
```

- Types: `email` (MG-01), `chat` (phone-chat), `call` (MG-04, or a phone NPC conversation until MG-04 exists), `visitor` (an NPC walks to the player and opens a conversation), `notice` (an intranet page or desk note). Emails and chats arrive as notifications on the work desktop (MG-27), the player's computer, which launches the inbox, browser, chat and The Lark.
- Times are game time, which the BE-04 time scale slows or stops. Anything else that moves with game time follows the same clock, such as an incident spreading on core_04's incident spread map (MG-26) until someone reports it.
- **Busy gate:** an interruption that falls due while a conversation, a minigame or a dialog is open waits until it closes, and there is a minimum gap between interruptions (default 20 seconds of game time) so two never collide. This extends the logic barks already use.
- **Assessment:** an interruption can carry an `assess` link, so ignoring it is recorded by BE-01's close rule rather than by the author.
- **Text route:** BE-03 orders the same interruptions by sequence instead of time.

**Acceptance criteria:**

- core_01's twelve messages arrive in order, none while a conversation or minigame is open, and none less than 20 game-seconds after the previous one.
- With timers off, interruptions arrive in the same order as the learner completes steps, and the work task can still be finished.
- The task bar's steps match the objectives panel, are reachable by keyboard and screen reader, and announce completion politely.
- The soft deadline passing changes the text ("a bit late, still worth sending") and nothing else.
- A reload mid-Apply keeps fired interruptions fired and pending ones pending.

**Depends on:** BE-01 (assess links), BE-13 (bank draws), BE-19 (opening the inbox or a call from a timer); BE-23 (pause and time scale); MG-01, MG-04 and MG-27.

**Risks and open questions:**

- Pacing differs between fast and slow readers. Game-time scheduling plus the busy gate and the time scale keep it fair; playtests should include slow readers.
- Too many interruptions turn realism into stress. Recommendation: at most one every 30 to 45 seconds of game time in the Apply beat.

### BE-19: Open minigames from conversations and events

**Priority and size:** MVP, S, for the "close, run, return" behaviour that covers almost every use. Showing a single knowledge check question on top of a conversation without closing it is best built into MG-20 and adds a few days there.

**Why:** Almost every module needs this (`features/README.md`, "Dependencies"): the inbox opening by itself at core_01's hook, the mentor's check question inside her explanation (EX-01), a colleague handing over a form (MG-09), a timer that makes the phone ring (BE-18), the debrief screen opened at the end of a conversation (BE-02). The work desktop (MG-27) is a launcher for other minigames, so it needs the same registry to open the inbox or The Lark from its icons and notifications.

**What exists today:**

- **A minigame opens only when the player uses an object:** a long per-type dispatch in `JS/systems/interactions.js` (around lines 1063 to 1210) calls starters in `JS/systems/minigame-starters.js`, each of which builds its own parameters and calls `MinigameFramework.startMinigame(sceneType, container, params)` (`JS/minigames/framework/minigame-manager.js`, line 15).
- **`#trigger_minigame` is a stub:** it shows a toast and logs the name (`JS/minigames/helpers/chat-helpers.js`, lines 185 to 197).
- **`#transition_to_person_chat` is broken:** it calls `startMinigame('person-chat', { ... })`, passing the parameters as the container argument (`chat-helpers.js`, line 299).
- **The pattern to copy:** `#clone_keycard` sets `window.pendingConversationReturn = { npcId, type }`, opens the RFID minigame, and on completion `returnToConversationAfterRFID` reopens the same conversation with `fromTag: true`, which resumes from saved ink state (`chat-helpers.js`, lines 312 to 383; `JS/minigames/rfid/rfid-minigame.js`, lines 417 and 470 to 500). `#give_npc_inventory_items` does the same with the container minigame (`JS/systems/npc-game-bridge.js`, around line 381).
- **Only one minigame runs at a time:** starting another ends the current one (`minigame-manager.js`, line 24).
- **Timers and object interactions run actions through `applyActions`** (`JS/systems/apply-actions.js`), which has no "open a minigame" action. Event mappings have no generic actions list (`npc-manager.js`, `_buildMappingConfig`).
- Minigame configs are validated per object type against `scripts/minigame-data-schemas.json`.

**Design:**

*A launcher registry* (`JS/systems/minigame-launchers.js`, new) maps a minigame id to a function that turns a config into the parameters its scene needs, wrapping the starters that already exist:

```js
registerLauncher('knowledge_check', (config, ctx) => ({ scene: 'knowledge-check', params: { item: config.item, ... } }));
registerLauncher('forensic_data_platform', (config) => ({ scene: 'forensic-data-platform', params: { showCancel: true, ...config } }));
```

`openMinigame(id, configKey, { returnTo })` looks up the config, validates it against the minigame's schema, and starts it.

*Configs live in the scenario* under `"minigameConfigs": { "q_phish_ask": { "minigame": "knowledge_check", "data": { "item": "C01-Q1" } } }`, validated by the same schemas file. For banked content (MG-20 items, BE-13) the config key can name an item or a set.

*The tag replaces the stub:* `#trigger_minigame:<minigame>|<configKey>`, for example `#trigger_minigame:knowledge_check|q_phish_ask`. The separator is `|`, not `#`, because inside an ink line `#` starts a new tag. `features/explainers_video_and_npc.md` uses the same form.

*Close, run, return:*

1. The tag waits until the line it is attached to has been shown and spoken.
2. The engine saves the conversation's ink state (as `#clone_keycard` does today), sets `pendingConversationReturn`, and opens the minigame.
3. When the minigame completes, its result is written as globals (for MG-20: `kc_q_phish_ask = "correct"`) and as BE-01 records.
4. The same conversation reopens with `fromTag: true`, its globals synced in, so the next ink line can branch on the result.

Authors put the tag on a short handover line ("Quick question for you.") followed by a knot that reads the result.

*The action and the event mapping field:*

- `applyActions` gains `{ "type": "open_minigame", "minigame": "inbox", "config": "hook_inbox" }`, so timers, `triggerOnInteract` and flag rewards can open minigames.
- Event mappings gain `"openMinigame": { "minigame": "...", "config": "..." }` and a general `"actions": [...]` list run through `applyActions`, so mappings stop growing one field at a time.

*Busy gate:* if a minigame or conversation is already open, an action-opened minigame waits until it closes (the same gate BE-18 uses). It never replaces what the learner is doing.

*Also fixed:* `#transition_to_person_chat` gets the correct `startMinigame` arguments.

*Validator:* every `#trigger_minigame` names a registered minigame and an existing config, every config passes its schema, and every `open_minigame` action is checked the same way.

**Acceptance criteria:**

- In core_01's Learn beat, Ama's check question opens after her handover line, the result is recorded, and the conversation continues on the right branch for a right and a wrong answer.
- At core_01's hook the inbox opens by itself from a timer action, with no object clicked.
- A `#trigger_minigame` from phone-chat returns to the same phone thread.
- Reloading the page while the minigame is open returns the learner to the conversation's last saved point, with no duplicate record.
- An action that falls due while another minigame is open waits and then opens.
- The validator rejects an unknown minigame id or config key.
- In the text route (BE-03), the same tag opens the minigame's accessible mode inline.

**Depends on:** none to start. MG-20 and MG-01 register their launchers when they exist; BE-01 records results.

**Risks and open questions:**

- Closing and reopening the conversation can flash the panel. Keep the person-chat background up during the hand-off, and under reduced motion swap with no animation.
- Saved ink state is per NPC. Two conversations nesting minigames at once is not supported; the busy gate prevents it.
- Open: overlay mode for single questions? Recommendation: build it inside MG-20 as a dialog above the conversation, so the framework keeps its one-minigame rule.

### BE-20: Authorable tutorial, title screen and end screen

**Priority and size:** MVP, M.

**Why:** The course needs its own opening and close: the customer's logo and the module's title, a tutorial for staff who may never have played a computer game, the chance to set captions, text size and motion before anything plays, an equal offer of the text route, and an end screen that returns the learner to their training. Today all three are fixed and branded for Hacktivity's games, and the spy framing leaks in.

**What exists today:**

- **Title screen** (`JS/minigames/title-screen/title-screen-minigame.js`):
  - the Hacktivity logo is hard-coded (line 29) and the mission's display name is typed out with a blinking block cursor;
  - "Continue? Click, or press Space or Enter" (line 33) supplies the user gesture browsers require before audio can play (header comment, lines 14 to 18).
- **Tutorial** (`JS/systems/tutorial-manager.js`):
  - a fixed prompt, "Welcome to Hacktivity Games!" (line 115), and fixed desktop and mobile step lists (lines 142 to 232);
  - the combat step is dropped when `disableAttacks` is set; completion is stored in `localStorage` and in globals;
  - steps complete from notify calls already placed in the code (for example `JS/systems/interactions.js`, line 1749; `JS/ui/objectives-panel.js`, line 83);
  - the desktop steps include two mouse-only steps (click to move, hold to walk), which a keyboard user can only skip.
- **End:** `show_end_screen` (`apply-actions.js`, lines 162 to 257) shows a red or green title in Press Start 2P with "MISSION COMPLETE" and "Return to Missions" as defaults, and closes the tab; `conclusionScreen` replays it on reload.

**Design:**

*Title screen,* configured per module:

```json
"style": "workplace",
"titleScreen": { "logo": "org", "title": "Inbox Zero", "subtitle": "Phishing emails, about 18 minutes",
                 "offerSettings": true, "offerTextRoute": true }
```

A top-level `"style": "workplace"` sets the course defaults in one place: this title screen, the end screen below, the `workplace` credits theme (BE-02) and silence as the music fallback (BE-21).

- It shows the organisation's logo (alt text: the organisation's name), the title and how long the module takes.
- It has three buttons: **Start**, **Settings** (the BE-04 panel, before any sound plays: captions, text size, motion, timers, voice) and **Use the text version** (BE-03).
- The workplace style has no typing effect and no blinking cursor.
- Pressing Start still counts as the user gesture for audio.

*Tutorial,* configured per module, with steps that complete on named events mapped from the existing notify calls:

```json
"tutorial": { "intro": "A quick look at how this works. You can skip any step.",
  "steps": [
    { "id": "move", "title": "Moving", "text": { "keyboard": "Use the arrow keys or W, A, S and D.", "touch": "Tap where you want to go." }, "doneWhen": "player_moved" },
    { "id": "talk", "title": "Talking to people", "text": { "keyboard": "Walk up to someone and press E. Choose what to say with the number keys or Tab and Enter." }, "doneWhen": "conversation_opened" },
    { "id": "report", "title": "Reporting", "text": { "any": "Every email has a Report button. You can't get it wrong by reporting." }, "doneWhen": "inbox_report_tried" }
  ] }
```

- core_00 (First Day) carries the full tutorial; other modules use a three-step refresher, or none.
- Steps are worded per input method, any step can be skipped, and the tutorial can be replayed from Settings (a "Relaunch Tutorial" button already exists, `app/views/break_escape/player_preferences/_modal.html.erb`, line 91).
- The panel is a labelled region that announces each new step politely and never takes focus away from the game.
- No step requires a mouse.

*End screen,* configured per module:

```json
"endScreen": { "title": "Module complete", "buttons": ["back_to_training", "debrief_again", "download_transcript"] }
```

- It shows a short summary from the BE-02 debrief, in the readable font, with no red or green verdict.
- In Hacktivity it returns the learner to their training page (HA-17) instead of closing the tab, and says when a certificate is ready (HA-06).

All new text comes from the locale files (BE-06).

**Acceptance criteria:**

- From title screen to end screen, core_01 shows the test organisation's logo and no Hacktivity game branding or spy styling.
- Settings can be changed before any sound plays, and the choices apply from the first line.
- The core_00 tutorial can be completed with keyboard only and with touch only.
- With reduced motion on, nothing on the title screen animates.
- The end screen's main button returns to the learner home, and the screens pass axe-core with no violations.

**Depends on:** BE-05 (logo and name), BE-02 (summary), BE-04 (settings), BE-03 (text route offer); HA-17.

**Risks and open questions:**

- Customers' logos are often designed for white backgrounds. Show the logo on a light panel whatever the theme.
- Open: should "Powered by Hacktivity" appear? A commercial decision; if it does, it goes on the end screen, not the title.

### BE-21: Workplace music and sound

**Priority and size:** P2, S for the engine, plus the cost of licensing or commissioning music.

**Why:** The course's tone is a warm workplace drama, "calm, not scary" (`03_WORLD_AND_CAST.md`, "Tone"). The current music is spy-styled and would pull every module towards the campaign's thriller voice.

**What exists today:**

- **Playlists:** Noir, Threat, Spy Action, Cutscene, Vocals, Ending and Victory (`JS/music/music-config.js`, from line 57), with Noir as the default (line 35). Scenario `music.events` switch playlists on triggers and conditions.
- **Ambience:** per-room `ambientSound` and `ambientVolume`, kept in the bootstrap scenario, and ambient playback with fades (`JS/systems/sound-manager.js`, around line 283).
- **Volume:** separate Music, SFX, Voice and Master sliders (`JS/music/music-widget.js`), meeting the basic game accessibility guideline on separate volume controls (once the sliders are labelled, BE-04).

**Design:**

- **Playlists:** `title`, `office_morning` (light, unobtrusive), `focus` (very low-key, for the Apply beat), `reflect` (the debrief), each with three to six tracks.
  - Licensed or commissioned, loudness-matched across the set, and with no vocals under dialogue.
  - The course default is `office_morning` at a low volume; music fades down while a character speaks.
- **Ambience** for each course room type (open-plan murmur, kitchen, warehouse, car park), quiet and looped without obvious seams.
- **Sound effects that carry information:** email arriving, chat ping, phone ringing, door buzzer, printer.
  - Each one has a caption and a visual cue (BE-04), because no information may be carried by sound alone.
  - No sirens, alarms or sudden loud sounds for drama; the loudest sound in a module is a phone ringing.
- **Scenarios** use the existing `music.events` block, starting the module's playlist on `game_loaded` as sis01 does: `"music": { "events": [ { "trigger": "game_loaded", "playlist": "office_morning", "fade": true } ] }`. The engine's own fallback default (Noir, `music-config.js`, line 35) becomes silence for scenarios with `"style": "workplace"` (BE-20), so a missing event can never start spy music.
- **Settings:** music and voice choices persist across modules (BE-04 settings).

**Acceptance criteria:**

- No spy-styled track plays anywhere in a course module.
- Every information-carrying sound produces a caption and a visual cue.
- No sound plays before the title screen's Start.
- Music, ambience and effects are loudness-matched within an agreed range, checked with a meter.

**Depends on:** BE-04 (captions for sounds, persistent settings).

**Risks and open questions:** music during reading distracts some people. Keep it quiet, mute it easily, and let the learner turn it off for every module at once.

### BE-22: Tactic spotter card

**Priority and size:** P2, S.

**Why:** core_02 (The Caller) teaches the levers behind calls, texts, chat messages, QR codes and visitors (C02-LO1: authority, urgency, fear, helpfulness, flattery, insider jargon). In its Learn beat Ama hands the player a "social engineer bingo card": a grid of tactics including "new number", "wants a code", "wants remote access", "wants a payment", "QR code" and "keep it quiet". The player ticks each one as they hear it in the Apply beat, and the debrief shows the tactics spotted against the tactics actually used (`modules/core_02_social_engineering_beyond_email/game_design.md`, Learn and Debrief). Naming a lever while it is being used on you is what makes it easier to resist next time. The card could serve later modules about pressure too (core_11 payment fraud, role_06 callers), but core_02 is the only one that plans it today.

**What exists today:**

- Nothing like it. The nearest pieces:
  - the objectives panel, a collapsible HUD panel with a labelled toggle that stays open during play (`JS/ui/objectives-panel.js`, line 41);
  - the interaction menu's accessible list of buttons (`JS/ui/interaction-menu.js`);
  - the notes minigame, which core_02 suggests for a first prototype (`modules/core_02_social_engineering_beyond_email/README.md`, open question 2).
- Ink tags are processed line by line as they are shown (`person-chat-minigame.js`, `displayAccumulatedDialogue`), so a tag can mark the line where a caller uses a tactic.

**Design:**

*The card* is defined in the scenario and handed over in ink (`#tactic_card:c02_bingo`, usually shown first as a BE-08 aid while Ama explains it):

```json
"tacticCards": {
  "c02_bingo": {
    "title": "Social engineer bingo",
    "tactics": [
      { "id": "authority", "label": "Authority", "hint": "They say they're someone important" },
      { "id": "urgency", "label": "Urgency", "hint": "It has to happen now" },
      { "id": "wants_code", "label": "Wants a code", "hint": "They ask you to read out a code" },
      { "id": "keep_quiet", "label": "Keep it quiet", "hint": "They ask you not to tell anyone" }
    ],
    "assess": { "behaviour": "C02-B10", "outcomes": ["C02-LO1"] }
  }
}
```

The behaviour id is illustrative: core_02's `assessment.md` would add a row for spotting tactics.

*Marking tactics in content.* The line where a caller uses a tactic carries `#tactic:urgency` (ink), and scripted contacts that are not ink (an MG-04 call, an MG-05 text) list `"tactics": ["authority", "wants_code"]`. The engine records a tactic as used only when the player actually meets it: a caller who is hung up on before asking for the code never used "wants a code".

*Using the card:*

- A HUD button and a key open the card as a small panel beside the game. It doesn't pause play and never covers the conversation's choices.
- Each tactic is a labelled checkbox with its hint. Ticking it is announced politely, and the tick is linked to the contact that is open or just ended.
- Ticking live is optional. When a contact ends, the card can ask "Anything you noticed?" with the same checkboxes, and BE-18's busy gate holds the next interruption until it is answered or closed. Nobody has to listen, read and tick at once, which matters for people using screen readers, people with ADHD or dyslexia, and anyone working in a second language.
- No timer, and no penalty for ticking late.

*Records and score:*

- Each tick and each tactic used is a BE-01 record (`tactic_tick` and `tactic_used`, with the tactic and contact ids). At the end of the Apply beat the server works out each tactic as spotted, missed or ticked on a contact that didn't use it, and rates the card's behaviour against thresholds in the module's assessment map, for example Secure when three quarters or more of the tactics used were spotted.
- A tick on a genuine caller (Priya in a hurry) is never Not yet. The debrief says real callers can be urgent too, and checking back is still fine.
- The card counts as evidence for C02-LO1. Recommendation: weight it like Practise (1), not like an Apply decision (2), because ticking a tactic is recognition, not the behaviour under pressure. `assessment_and_evidence.md`, section 3, lets a module set this with a reason.

*Debrief* (BE-02): the grid with each tactic marked used or not used, the contacts it appeared in, and whether the player spotted it. The card always closes on the procedure, "the request decides, not the tactic: check back on a number you already have", so it supports design principle 5 (process over cues) rather than turning into a buzzword hunt.

*Text route* (BE-03): after each contact the card appears as a checklist, "Which of these did you notice?", producing the same records.

**Acceptance criteria:**

- In core_02's Apply beat every tactic tagged in content is recorded as used only when the player meets it, and each tick is linked to the right contact.
- The debrief grid matches the records for at least five fixture routes, including one where the player hangs up early.
- The card works by keyboard and screen reader, ticks are announced, and live ticking can be skipped in favour of the after-contact checklist without changing the score.
- No tick on a genuine caller produces a Not yet.
- The text route's checklist produces the same score as the game for the same ticks.

**Depends on:** BE-01 (records and server rating), BE-02 (the debrief grid), BE-18 (the busy gate and contact ids), BE-08 (handing the card over in the Learn beat); MG-04 and MG-05 for tactics in calls and messages.

**Risks and open questions:**

- A tick box can teach people to hunt for buzzwords. Keep its weight low and always end on the check-back procedure.
- Tagging tactics is writing work that is easy to get wrong. The validator checks that every `#tactic` id exists on the module's card, and the script editor reviews where each tag sits.
- Open, from core_02: build the card as its own overlay or prototype it with the notes or knowledge check UI? Recommendation: prototype with the existing UI for the first core_02 playtests, then build the overlay, which is small once BE-01 and BE-18 exist.

### BE-23: Pause and time scale

**Priority and size:** MVP, M.

**Why:** Several features need one clock they can stop or slow. BE-04 promises timers that can be turned off and no required fast reactions; BE-18's interruptions, BE-15's pause points and BE-16's time skips all have to stop game time cleanly; and anything else that moves with game time (an incident spreading on core_04's map, MG-26) has to follow the same clock. Today the game clock is wall time and cannot be paused, so timers and timed messages keep running while a learner reads a conversation, which is unfair to anyone who reads slowly or listens with a screen reader. This is the engine feature the accessibility baseline leans on most, so it must have an estimable design of its own rather than sit as a dependency the others assume.

**What exists today:**

- The game clock is wall time minus the time the page was closed, with no pause (`JS/systems/game-clock.js`, lines 52 to 66). Scenario timers and timed messages count from it (`JS/ui/scenario-timer-dispatcher.js`).
- The engine already branches on an accessibility state for motion: `lighting_dip` is skipped under reduced motion (`apply-actions.js`, line 141).
- There is no time scale, no global pause, and no way to pause from a menu or a minigame.

**Design:**

- **One clock.** Game time, scenario timers, timed messages, interruptions (BE-18), NPC patrols and anything else that moves with game time read from a single clock that can be paused, run at a scale (normal, half, a fifth, a tenth) or run with timers stopped altogether.
- **Pause** from the pause menu, from a minigame or dialog, and automatically whenever a conversation, document or minigame is open if the learner chooses that setting (BE-04).
- **Time scale and timers off** are BE-04 settings, stored per player, so they follow the learner across modules, with the scale applied to every timed element together so their order never changes.
- **Resume** continues from where the clock stopped, so a timer that had 90 seconds left still has 90 seconds left after a pause or a reload.
- Deadlines in course modules stay soft (BE-18) and are shown as words, never as a red countdown.

**Acceptance criteria:**

- With timers off, a module can be completed with no time pressure, and the records match a normal-speed run with the same decisions.
- Pausing from a conversation, a minigame or the menu stops game time, timers, timed messages, interruptions and patrols together, and resuming continues them from the same point.
- A reload while paused keeps the paused state and the time remaining on every timer.
- Changing the time scale rescales every timed element together, so their relative order is unchanged.

**Depends on:** none. Depended on by BE-04, BE-15, BE-16 and BE-18.

**Risks and open questions:**

- Shared engine code: the clock drives the campaign and SIS games too, so the change needs the regression playtests in `AGENTS.md`.
- Open: should pause-while-reading be on by default? Recommendation: off in the game, because the busy gate (BE-18) already holds interruptions, but offered as an easy setting.

### BE-24: Place-player action

**Priority and size:** P2, S.

**Why:** Time skips (BE-16), role switches (BE-11) and resumes (BE-12) all need to put the player in a particular room and spot, but today the player only ever starts or respawns in the start room. A small, shared action gives all three a reliable way to move the player and set a start position.

**What exists today:**

- The player always starts and respawns in the start room (`JS/core/game.js`, around lines 1267 to 1332); only side doors move the player between rooms.
- Pathfinding to a point exists (`movePlayerToPoint`, `JS/core/player.js`, line 717).
- There is no scenario action, ink tag or checkpoint field that sets the player's room and tile.

**Design:**

- **An action** `{ "type": "place_player", "room": "operations", "tile": { "x": 7, "y": 5 } }` in `applyActions`, an ink tag `#place_player:operations:7,5`, and a `place` field on checkpoints (BE-12) and roles (BE-11).
- **The move** fades out, places the player and fades in, or cuts with no animation under reduced motion.
- **It records** where the player is, so a reload straight afterwards puts them back in the same spot.
- **In the text route** (BE-03) it is narrated by the scene it belongs to and otherwise has no visible effect.

**Acceptance criteria:**

- A `place_player` action, tag or checkpoint moves the player to the named room and tile, and a reload immediately afterwards keeps them there.
- Under reduced motion the move is a cut with no fade.
- The start position can be set from a checkpoint on resume (BE-12) and from a role on switch (BE-11).

**Depends on:** none. Depended on by BE-11, BE-12 and BE-16.

**Risks and open questions:**

- A tile that is out of bounds or blocked must fail safe to the room's default spot; the validator checks that every `place_player` names a real room and a walkable tile.

### BE-25: Course avatars and inclusive name entry

**Priority and size:** MVP, S for the engine and the name field, M for the art.

**Why:** The player is a member of staff, not a hooded hacker, and staff have names the game must accept. The inclusive content rules (`accessibility_and_inclusion.md`, section 5.6) ask for a workplace avatar set and a name field that accepts accented letters, hyphens and apostrophes, so Siobhán, O'Neill, Anne-Marie and Wiśniewski can be typed.

**What exists today:**

- The 14 built-in avatars include hooded hackers, a spy and a "nerd", labelled male and female; the menu previews `female_hacker_hood_v2` before a choice and falls back to `male_hacker_hood_v2` (`app/models/break_escape/player_preference.rb`, lines 40 to 44).
- `validSprites` already limits the avatar choices per scenario.
- The name field accepts only `[a-zA-Z0-9_ ]`, 1 to 20 characters (`player_preference.rb`, lines 61 to 62), so accented letters, apostrophes and hyphens are rejected.
- The name never appears in a voiced line (`AGENTS.md`).

**Design:**

- **A course avatar set** of 8 to 12 office avatars: ages from 20s to 60s, a range of skin tones, head coverings (hijab, turban), a wheelchair user, hearing aids and glasses, described by appearance rather than labelled male or female, with no hooded-hacker default (`accessibility_and_inclusion.md`, section 5.6). Course scenarios list them in `validSprites`, and the pre-choice preview and every fallback use a course avatar, not a hacker.
- **The name field** accepts letters from any script, apostrophes, hyphens and spaces, with a longer limit, validated and trimmed, and still never printed in a voiced line.
- **The course never asks for gender,** because nobody refers to the player in the third person (section 5.1).

**Acceptance criteria:**

- A course module shows only office avatars, and the pre-choice preview and every fallback are office avatars.
- Siobhán, O'Neill, Anne-Marie and Wiśniewski can all be entered and are shown correctly on screen.
- No voiced line changes with the player's name.

**Depends on:** none for the engine. The art is a separate deliverable, and BE-20 shows the avatars on the title and player screens.

**Risks and open questions:**

- The art is the long pole (M). The engine change (the name field and `validSprites`) is small and can land first with a placeholder set.

### BE-26: Accessibility checks in CI

**Priority and size:** MVP, S.

**Why:** The course commits to WCAG 2.2 AA and to keeping it (`accessibility_and_inclusion.md`, section 6). Automated checks on every change catch regressions that manual passes would miss between releases, and they are the first of the three testing layers that document promises.

**What exists today:**

- No accessibility tooling in the repo.
- A test bridge, `window.__test`, is available outside production and can open any minigame (`accessibility_and_inclusion.md`, section 6.1).
- The dialogue lint checks voiced variables and spoken line length (`scripts/ink_runtime_check/dialoguelint.mjs`); the validator checks scenario structure.

**Design:**

- **axe-core through Playwright** on every course HTML surface: the game shell, every course minigame opened through the test bridge, the text route (BE-03), the debrief (BE-02), the intranet (BE-09), settings, the title and end screens (BE-20) and Hacktivity's learner pages (HA-23), running the WCAG 2.0, 2.1 and 2.2 A and AA rules and failing the build on any violation.
- **A contrast test** over every colour token in the dark, light and high-contrast themes.
- **A CSS lint:** no `outline: none` without a replacement focus style, and every animation or transition under a reduced-motion guard.
- **The BE-03 route parity check** (`routeparity.mjs`) and the validator's accessibility checks (alt text on every aid, caption text for every information-carrying sound, `lang` on every page) run in the same job.

**Acceptance criteria:**

- A new axe-core violation on any covered surface fails the build and names the surface and the rule.
- A removed focus outline or an unguarded animation fails the CSS lint.
- The job runs on every change and completes within the CI budget.

**Depends on:** BE-03 (the route parity check and the text-route pages), BE-04 (the DOM surfaces it tests), HA-23 (the platform pages).

**Risks and open questions:**

- Automated checks find only part of what is wrong; they sit alongside the manual and user testing in `accessibility_and_inclusion.md`, section 6, never instead of it.
- Flaky bridge timing can make the job unreliable; stabilise the test bridge before turning the gate on.

### BE-27: Plain English lint

**Priority and size:** P2, S.

**Why:** The course writes to a reading age of about 11 to 12 (`accessibility_and_inclusion.md`, section 5.5), following GOV.UK's rules on sentence length, paragraph length and plain words. A lint flags the sentences and words a human should look at, across ink, documents and bank items, alongside the dialogue lint that already runs.

**What exists today:**

- The dialogue lint checks spoken line length (30 words) and voiced variables only (`scripts/ink_runtime_check/dialoguelint.mjs`).
- Nothing checks reading level, sentences over 25 words, paragraph length, or banned filler and jargon.

**Design:**

- **A lint over ink, documents and bank items** (BE-13) that flags sentences over 25 words, paragraphs over five sentences, reading level above the target, negative contractions in instructions and reference cards (section 5.5), banned filler and ableist idioms, and jargon used without a first-time explanation.
- **Flags, not failures:** the lint reports for a human to judge, because plain English is a judgement, not a rule a machine can settle.
- It runs beside the dialogue lint and the accessibility checks (BE-26).

**Acceptance criteria:**

- A spoken line or document sentence over the limits, a banned word, or an unexplained jargon term is flagged with its location.
- The lint runs over a module's ink, documents and bank items in one pass.
- Natural contractions in speech are allowed; negative contractions in instructions are flagged.

**Depends on:** none to start; it reads the same content BE-13's banks and the modules' documents hold.

**Risks and open questions:**

- Reading-level scores are rough and can misjudge technical terms the course explains on purpose; keep the lint advisory.

### BE-28: Take an item from the player

**Priority and size:** P2, S.

**Why:** Some beats hand something back: giving a found USB stick to IT rather than plugging it in (core_07), returning a visitor's badge, handing over a form. Today ink can give the player an item but cannot take one, so these actions cannot be completed in the world.

**What exists today:**

- Ink can give items (`#give_item`, and `#give_npc_inventory_items` through `JS/systems/npc-game-bridge.js`, around line 381), and the inventory system tracks what the player holds (`JS/systems/inventory.js`).
- There is no tag or action that removes an item from the player's inventory.

**Design:**

- **An ink tag** `#take_item:<id>` and an action `{ "type": "take_item", "item": "<id>" }` in `applyActions`, which remove the named item from the player's inventory and update saved state so a reload reflects it.
- **A missing item fails safe:** taking an item the player does not hold is a no-op.
- **In the text route** (BE-03) the item is removed from the saved inventory the same way, narrated by the scene.
- Pairs with BE-19, so a colleague's conversation can take the item as part of a handover.

**Acceptance criteria:**

- Handing a found USB stick to IT removes it from the inventory, in both routes, and a reload keeps it gone.
- Taking an item the player does not hold does nothing and is reported by the validator as a warning.

**Depends on:** none. Works with BE-19 for conversation handovers.

**Risks and open questions:**

- Removing an item a later beat still needs would strand the player; the validator checks that a taken item is not required afterwards.

### BE-29: NPC guide behaviour

**Priority and size:** P2, S.

**Why:** Some beats need an NPC to lead: a tour of the office on the first day (core_00), escorting a visitor to a meeting room, walking a learner over to The Lark. The NPC should walk ahead to a destination and wait for the player to catch up.

**What exists today:**

- NPCs can walk to the player (`navigateToPlayer`, `JS/systems/npc-manager.js`, around line 581) and follow scripted movement.
- Pathfinding exists (`movePlayerToPoint`, `JS/core/player.js`, line 717).
- There is no "walk ahead and wait" behaviour.

**Design:**

- **An action** that sends an NPC to a room and tile and has them wait there for the player, resuming the beat when the player arrives: `{ "type": "npc_guide", "npc": "leo_brennan", "room": "operations", "tile": { "x": 7, "y": 5 }, "waitFor": "player" }`, with an ink tag equivalent.
- **The NPC paces itself** to the player, pausing if the player stops, so nobody is left behind, and follows the BE-23 clock so a pause stops the guide too.
- **In the text route** (BE-03) the guide becomes a narrated move ("Leo walks you over to the notice board") with the same records.

**Acceptance criteria:**

- An NPC walks ahead to the destination, waits for the player, and the beat continues when the player arrives.
- Pausing the game (BE-23) pauses the guide, and resuming continues it.
- The text route narrates the same move.

**Depends on:** BE-23 (so the guide follows the one clock). Pairs with BE-24 for placing the player at the destination.

**Risks and open questions:**

- A player who wanders off must not soft-lock the beat; the NPC waits indefinitely and the "What should I do now?" answer points to the destination.

### BE-30: Video call options

**Priority and size:** P2, S.

**Why:** Video-call scenes need two things the engine hard-codes today: a call bar label that can change (the deepfake call in core_15, the board briefings in role_01), and call effects for deepfake and poor-connection scenes. Today the call bar always reads "SECURE VIDEO LINK" and there are no call effects.

**What exists today:**

- Video-call mode frames a conversation as a call with a self-view (`JS/minigames/person-chat/person-chat-ui.js`, around line 236); its status bar text "SECURE VIDEO LINK" is hard-coded (line 253).
- Conversation backgrounds and `Narrator[none]:` lines already set a scene's mood.
- There is no way to freeze, blur or lag a call from ink.

**Design:**

- **A configurable call bar label,** set per call (default "Video call"), so a scene can name the service it is meant to be, which BE-08's share-screen call also uses.
- **Ink-driven call effects** `#call_effect:freeze`, `#call_effect:blur`, `#call_effect:audio_lag` and `#call_effect:clear`, which apply ordinary call-quality texture to the call for poor-connection and deepfake scenes.
- **A firm rule, per core_15:** these connection effects are ordinary call-quality texture that can happen to any caller, genuine or not, and must NEVER be used as a deepfake detection tell. The lesson of core_15 is that you cannot tell a deepfake from how glitchy the call looks; the check is always to verify the caller through a route you already trust. No course content or debrief ever says "it froze, so it was fake".
- **Accessibility:** effects are visual texture only, never carry information, respect reduced motion (no motion under the setting) and never flash; the spoken lines and captions carry the scene whatever the effect does.
- **In the text route** (BE-03) the label is shown and an effect, if mentioned at all, is one neutral line ("the picture freezes for a moment"), again never as a tell.

**Acceptance criteria:**

- The call bar shows the configured label, and "SECURE VIDEO LINK" appears nowhere unless a scene asks for it.
- `#call_effect` tags freeze, blur or lag the call and clear it, with no flashing and nothing animating under reduced motion.
- No course content or debrief uses a connection effect as evidence that a caller is a deepfake, checked in review against core_15's rule.

**Depends on:** BE-08 (the video call's shared-screen and visual-aid handling).

**Risks and open questions:**

- The effects are easy to misread as a detection cue; the core_15 rule above and a review check keep them as texture only.
- Open: should blur and freeze be available outside deepfake scenes? Yes, for any poor-connection moment, which is the point: they are not special to fakes.

## Sizing notes on existing items

BE-04 is L only if scoped to the shell and the minigames this course uses. BE-15 is M only while phone voting stays out. BE-19 is S for close, run and return; overlay questions belong in MG-20.

## Notes for the other feature documents

- **`explainers_video_and_npc.md`:** its `#trigger_minigame:knowledge_check|<item_id>` form, and the `#visual_aid` and `#aid_step` tags, are the syntax BE-19 and BE-08 implement. Check questions should sit after a short handover line, with the result read in the next knot (BE-19).
- **`minigames.md`:** every new minigame needs:
  - an accessible DOM mode that also runs inline in the text route (BE-03);
  - `assess` hooks for BE-01, with server-side grading where there is a right answer;
  - a launcher registered with BE-19;
  - a config schema in `scripts/minigame-data-schemas.json`.
- **`assessment_and_evidence.md`:** BE-01 implements its section 3 rule and section 4 loop as written, and BE-14 follows its section 8 rule that no statement leaving Hacktivity uses "failed". Two small additions for that document to consider: the record kinds in BE-01 (`decision`, `check_item`, `check_result`, `milestone`, `remediation`, `policy_ack`, and the tactic card's records in BE-22), and the rule that a behaviour recorded twice in one beat keeps its first record.
- **`hacktivity.md`:** the engine needs three host hooks beside `on_game_complete`: `org_profile_for_game` (HA-11 to BE-05), `on_policy_acknowledged` (BE-09 to HA-07) and the assessment summary passed with completion (BE-01 to HA-05). HA-17 needs links to both routes and to drills.
