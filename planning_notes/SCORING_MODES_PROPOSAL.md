# Per-scenario scoring modes: proposal

Status: proposal only. Nothing in either repo has been changed. The Hacktivity part needs the user's approval before anyone edits it.

## 1. Recommended design

Add an optional `"scoring"` key to each scenario's `mission.json`:

| Value | Score while not concluded | Score once concluded | Use for |
|---|---|---|---|
| absent, or `"tasks"` | 70 × tasks/total + 30 × aims/total | same formula (no change) | everything else (the default, unchanged) |
| `"partial_then_complete"` | the same formula, capped at 99 | 100 | `lab_tesseract_trials` (Mode A) |
| `"completion"` | 0 | 100 | the 38 `awareness_*` shells (Mode B) |

"Concluded" means `game.mission_concluded_at.present?`. It does **not** mean `status == 'completed'`: Hacktivity's Finish button sets that status without a conclusion (`game_slots_controller.rb:251`).

The formula lives in one place, `BreakEscape::Game#calculate_task_score`, which reads the mode from `mission.scoring_mode`. Hacktivity's `GameScoringJob` currently has its own copy of the formula. It should call the engine's method instead, so the two can't drift apart. A Hacktivity `GameSlot` with `scoring_method: "flags"` still overrides everything, as it does now.

The setting goes in `mission.json` because:

- **It has one source.** `mission.json` already holds the platform-facing metadata that Hacktivity reads at runtime (`lab_sheet_url` at `mission.rb:63`, `ui_theme` at `mission.rb:76`). A scoring mode belongs with those, next to the scenario it describes.
- **Authors can set it.** An author edits one JSON file, and the validator can check the value.
- **It needs no seeding or migration.** `Mission#load_mission_metadata` reads the file every time, so a deploy is enough. There's no `db:seed`, no new column, and no back-fill for missions that already exist.

The alternatives are weaker:

- **Scenario JSON** (`scenario.json.erb`). This would fix the mode on each game when it's created, through `scenario_data`. It is close to `missionConclusion` and `concludeRequires`, but it mixes platform scoring into the game content. It also needs an entry in the validator's known-field list, and a game would keep the old mode after the author changes it.
- **BreakEscape Mission row.** This needs a migration in the engine and in Hacktivity's `schema.rb`, plus a `db/seeds.rb` change (`seeds.rb:66-72` copies only some fields). It would just be a second copy of what `mission.json` already says.
- **Hacktivity `GameSlot.scoring_method`.** Values could be added to `GameSlot::SCORING_METHODS` (`game_slot.rb:34`). But that setting belongs to each listing, so every organiser would have to remember to set it on every event, and it isn't in the slot form or `game_slot_params` (`game_slots_controller.rb:382-393`). The mode belongs to the scenario. A per-listing override could be added later (open question Q5).

## 2. How scoring works today

### Hacktivity

- **Trigger.** `config/initializers/break_escape.rb:6-16` sets `on_game_complete` and `on_task_complete`, and both run `GameScoringJob.perform_now(game.id, game.vm_set_id)`. The engine fires `on_game_complete` from `Game#fire_completion_callback` (`game.rb:576`) through three `after_commit` hooks (`game.rb:33-35`): the status changes to completed, `tasks_completed` or `objectives_completed` changes, or `mission_concluded_at` is set. The Finish and Abandon actions also run the job directly for VM-free games (`game_slots_controller.rb:253, 290`).
- **Computation** (`app/jobs/game_scoring_job.rb`):
  - VM-free games (`vm_set_id` nil, lines 24-37): `calculate_task_completion_score(game).round` is written to `game.score`.
  - VM games (lines 39-81): `calculate_game_score` (lines 91-104) uses `game_slot.scoring_method`. For `"flags"` it uses `vm_set.score`, which FlagService owns. Otherwise it uses the task formula.
  - The formula is at lines 116-123: `tasks_completed/total_tasks × 70 + objectives_completed/total_aims × 30`, and 0 if there are no tasks.
- **Where the result goes:**
  - `game.score` is the authoritative per-game score.
  - `Result#calculate` (`app/models/result.rb:56-68`) takes `GameSlot#best_score_for(user)`, the maximum `score` over all of the user's games from that listing, abandoned ones included (`game_slot.rb:92-94`), × `event_score_weight` / 100. That feeds the event leaderboard.
  - The mission scoreboard (`_scoreboard.html.erb`, `mission_scoreboard`) and the high-score tile (`_game_slot.html.erb:10-15`) appear only when `game_slot.scoreboard` is true.
  - `broadcast_game_progress` (lines 173-192) sends `user_handle`, `score`, `mission_concluded` and `mission_name` over ActionCable to the user's channel, the team's channel and the **whole event's** channel.
  - "Your games" shows `game.score` (`_your_games.html.erb:37`). For VM games, a score of 100 turns Abandon into Finish (line 83).
  - On the VM path the job also sets `vm_set.completed_flags_date` when `game.mission_completed?` (line 60), plus streaks and nudge emails. CTF flag scoring stays in FlagService (`on_flag_submit`, initializer lines 38-56) and isn't affected.
- **Completion panel.** `_completion_congratulations.html.erb:26-32` shows no score for VM-free missions (`score = nil`). There is no "share" feature in Hacktivity. The only "sharing" of a score is the event-channel broadcast and the optional scoreboard.

### BreakEscape

- `Game#calculate_task_score` (`game.rb:51-58`) uses the same formula. The engine writes `self.score` in three places: `complete_task!` (line 1439), `skip_task!` (line 1474) and `conclude_mission!` (line 3093). `reset_player_state!` sets the score to 0 (line 93). `Game#calculate_score` (lines 61-77) has no callers.
- The totals come from `set_scoring_totals` (lines 2933-2943) when the game is created. `total_tasks` counts **optional tasks too**, so a run that skips optional tasks can't reach 100.
- Conclusion: `check_mission_conclusion` (lines 2512-2530) runs when a `missionConclusion` aim completes. If `unmet_conclude_requirements` (lines 3112-3128) passes, it sets `mission_concluded_at`, `status = 'completed'` and `completed_at`. `conclude_mission!` (lines 3067-3097) is the path the client's credits call, through `POST /conclude` (`games_controller.rb:1153-1166`, which returns `score`). `recheck_pending_mission_conclusions!` (lines 2539-2548) handles a gate task that completes later.
- `README_scenario_design.md:1555-1557` documents the current rule: the conclusion flag does not force 100.
- The engine sends nothing to Hacktivity over HTTP. Hacktivity loads the engine as a gem (`Gemfile:14`, `path: "../BreakEscape"`), and the hooks are plain Ruby callbacks.

## 3. Existing per-mission scoring configuration

- **mission.json:** none. Keys in use include `display_name`, `description`, `difficulty_level`, `secgen_scenario`, `collection`, `lab_sheet_url`, `ui_theme`, `cybok`, `estimated_duration_minutes` and a few free-form design keys.
- **Mission model and table:** none (`break_escape_missions` in Hacktivity's `schema.rb:135-149`).
- **Seeds:** none (`db/seeds.rb:66-72`).
- **Hacktivity:**
  - `GameSlot.scoring_method` (`task_completion` | `flags`, default `task_completion`; migration `20260517001219`). It is set per listing, copied with events (`events_controller.rb:396`), not in the edit form, and has no per-mission default.
  - `SecGenBatch.scoring_method` (`Percent` | `Early-bird`) is for raw labs and doesn't apply here.
  - `GameSlot.scoreboard` (boolean) hides or shows the mission scoreboard.

## 4. What the scenarios look like

- **`lab_tesseract_trials` ("The Keyholder Trials", `lab_games`).** 6 aims and 19 tasks, several optional (`read_byte_wall`, `consult_sidhu`, `warn_handler`, `decide_about_megan`, and others). The `the_offer` aim is `missionConclusion` with `concludeRequires: { tasksCompleted: ["open_relay_terminal"] }`. Today a concluded run that skipped the optional tasks scores less than 100. No other scenario is a keyholder or lock-holder lab. `test-tesseract-probes` is a test harness with a `keyholder.ink`.
- **Awareness shells (38).**
  - The 7 full episodes have **2 aims**: `red_team_aim` (the attack, 1 task) and the defend aim (`missionConclusion` plus `concludeRequires`, 1 task). Today, finishing the attack beat alone scores **50**. That contradicts design 11 §4.1, where the attack beat is "never scored".
  - The 7 defend-only shells and the 24 pre and post checks have 1 aim and 1 task each, so today's score is already 0 or 100.
- **Design 11 §4.1.** The episode score (the triage percent) is defence-only and belongs to doc `05`. It lives in `globalVariables` and isn't meant to be a Hacktivity score.
- **Design 11 §6.2.** Inside Hacktivity "the product can promise only task and aim share (each shell has the one conclusion aim and task of 5.1, so the share is 0 or 100)". It notes that `GameScoringJob` broadcasts `user_handle` and `score` to the event channel, that there is no pseudonymous id, and that the "no league table" goal holds only after Hacktivity changes. Mode B matches this: Hacktivity records completion and nothing about how well the learner did. One small correction to §6.2: there *is* a switch for the scoreboard, `GameSlot.scoreboard`. What can't be switched off is the event-channel broadcast.

## 5. Exact changes

Line numbers are from the current working tree. `scripts/validate_scenario.rb` has uncommitted edits from other work, so check its line numbers again before editing.

### BreakEscape

1. **`app/models/break_escape/mission.rb`, after `ui_theme` (line 78):**

   ```ruby
   # How a game of this mission is scored, from mission.json "scoring".
   # tasks (default): 70 × tasks + 30 × aims. partial_then_complete: that,
   # capped at 99 until the mission concludes, then 100. completion: 0 until
   # the mission concludes, then 100.
   SCORING_MODES = %w[tasks partial_then_complete completion].freeze
   DEFAULT_SCORING_MODE = 'tasks'.freeze

   def scoring_mode
     mode = load_mission_metadata&.dig('scoring').to_s
     SCORING_MODES.include?(mode) ? mode : DEFAULT_SCORING_MODE
   end
   ```

2. **`app/models/break_escape/game.rb:51-58`.** Make `calculate_task_score` depend on the mode. The default branch is today's code, unchanged:

   ```ruby
   def calculate_task_score
     concluded = mission_concluded_at.present?
     case mission&.scoring_mode
     when 'completion'            then concluded ? 100.0 : 0.0
     when 'partial_then_complete' then concluded ? 100.0 : [raw_task_score, 99.0].min
     else                              raw_task_score
     end
   end

   def raw_task_score   # the previous body, unchanged
     return 0.0 if total_tasks.zero?
     task_score = (tasks_completed.to_f / total_tasks) * 70
     aim_score = total_aims.positive? ? (objectives_completed.to_f / total_aims) * 30 : 0
     task_score + aim_score
   end
   ```

   This is enough for `complete_task!` (1439), `skip_task!` (1474) and `conclude_mission!` (3093). The score is computed after `check_aim_completion` and `check_mission_conclusion` have set `mission_concluded_at`.

3. **`game.rb:93` (`reset_player_state!`).** Change `self.score = 0` to `self.score = calculate_task_score.round`. Totals are zeroed on the lines above, so the default mode still gives 0, as today. In the two new modes a concluded game keeps its 100 after a Restart, because `mission_concluded_at` is never cleared. See edge case 6.3.

4. **`scripts/validate_scenario.rb`, in the mission.json block (around lines 236-241).** Report an error if `scoring` is present and isn't one of the three values. Warn if the mode is `completion` or `partial_then_complete` and the scenario has no `missionConclusion` aim, because the score could then never reach 100.

5. **mission.json content:**
   - `scenarios/lab_tesseract_trials/mission.json`: `"scoring": "partial_then_complete"`
   - all 38 `scenarios/awareness_*/mission.json`: `"scoring": "completion"`
   - optional: `scenarios/test_social_episode/mission.json`: `"scoring": "completion"`, so the test shell matches the real ones

6. **Docs.**
   - `README_scenario_design.md:1555-1557`: keep the sentence about the default and add the `scoring` table.
   - Design 11 §6.2: note Mode B, and that `GameSlot.scoreboard` exists.

### Hacktivity (needs the user's approval first)

1. **`app/jobs/game_scoring_job.rb:116-123`.** Replace the body of `calculate_task_completion_score(game)` with `game.calculate_task_score`. This is the only required change. Both callers (line 26 for VM-free games, line 99 for the task branch of VM games) then follow the mission's mode. The `flags` branch (line 97) is untouched, so a flag-scored listing still uses `vm_set.score`.

2. Nothing else is required. `Result#calculate`, the scoreboard, the broadcast and "Your games" already read `game.score`.

3. Optional, and only if the user wants it (Q3, Q4):
   - Show the mode on the listing, for example "Scored on completion" in `_game_slot.html.erb`, using `game_slot.break_escape_mission.scoring_mode`.
   - Leave the event-channel broadcast (lines 189-191) out for `completion` missions.

## 6. Edge cases

1. **A concluded mission with incomplete optional tasks.**
   - Default: proportional, as today.
   - Mode A: 100.
   - Mode B: 100.
   - The `concludeRequires` gate still decides whether conclusion happens at all, so Mode A can't give 100 without `open_relay_terminal`.

2. **A gate blocked while the aim counts as complete.** `check_aim_completion` adds to `objectives_completed` *before* `check_mission_conclusion` returns false (`game.rb:2713-2718`). So today a one-aim awareness shell whose global gate is unmet can show **100 without concluding**. Mode B removes this, because the score comes only from `mission_concluded_at`. Mode A's cap at 99 does the same for the keyholder lab.

3. **Replays and resets.**
   - In-game Restart (`POST /games/:id/reset`) keeps the game row and `mission_concluded_at`. With change 3 above, Modes A and B keep 100 after a Restart. The default still drops to 0 as it does today: a reset of a concluded default-mode game drops that row's score, and with it the event credit if that row was the best. That is an existing behaviour and is left alone.
   - New session (`new_session`) and Hacktivity's Reset (`restart`) create a new game. The old game keeps its score, and `best_score_for` takes the maximum, so a finished run stays counted.
   - The awareness pre-check: a second concluded run replaces the CarryOver baseline (design 11 §5.2). Its score stays 100 either way.

4. **Awareness check missions (pre and post).** These should be `completion` too. Their triage percent is the measurement baseline, and it should not become a Hacktivity score or appear on a leaderboard. They already score 0 or 100 today, but setting the mode states the rule outright and closes the gap in edge case 2.

5. **Full episodes (E1-E7).** Today the attack beat alone scores 50, against design 11 §4.1. Mode B scores 0 until the defend aim concludes.

6. **Finish and Abandon.** Finish sets `status = 'completed'` with no conclusion. Neither new mode treats that as completion, so a learner can't score 100 by pressing Finish. The button appears only for VM games anyway (`_your_games.html.erb:82`), and these missions are VM-free.

7. **Leaderboard and "share".**
   - The event leaderboard (`Result`) uses `best_score / 100 × event_score_weight`. In Mode B an awareness listing gives the full weight for completing it and 0 otherwise.
   - The mission scoreboard only appears if the organiser turns on `GameSlot.scoreboard`. For awareness listings it should stay off, which is the "no league table" goal in design 11.
   - The event-channel broadcast still sends `user_handle`, a score of 0 or 100 and `mission_concluded`. This reveals only who completed, and nothing about how well they did.
   - Mode A's partial scores (capped at 99) still show live, as they do now.
   - Hacktivity has no social share feature.

8. **Flag-scored listings.** If a Mode A or B mission were ever listed with `scoring_method: "flags"`, the flag score wins, as it does today. The two settings don't combine.

9. **Changing the mode after games exist.** The mode is read live, so the next scoring event recomputes an existing game under the new mode. Games already concluded under the old mode keep their stored score until something rescores them. A one-off `GameScoringJob` sweep over the mission's games would bring them up to date (Q6).

10. **Cost.** `load_mission_metadata` reads `mission.json` from disk on every call. Scoring calls it two or three times per task completion, and `ui_theme` already does the same. If that ever shows up in profiling, cache the parsed file by mtime. It isn't needed now.

## 7. Test plan

**BreakEscape** (`test/models/break_escape/game_test.rb`; stub `Mission#scoring_mode` per test):

- default mode: the existing tests stay green, including "score is raw task/aim formula, not forced to 100" (line 871) and the 100-cap test (line 1014)
- `partial_then_complete`:
  - partial progress gives the raw formula
  - all tasks done but the conclusion gate unmet gives 99
  - conclusion with optional tasks left over gives 100
  - `conclude_mission!` gives 100
- `completion`:
  - 0 after the attack aim of a two-aim shell
  - 0 when the aim is complete but the gate is unmet
  - 100 after conclusion
- `reset_player_state!` on a concluded game: 0 in the default mode, 100 in Modes A and B
- `Mission#scoring_mode`: missing or unknown values fall back to `tasks`, and each valid value is returned as it is (`test/models/break_escape/mission_test.rb`)
- validator: a bad `scoring` value is an error, and a mode with no conclusion aim gives a warning

**Hacktivity** (`test/jobs/game_scoring_job_test.rb`, using mocha's `stubs(:scoring_mode)`):

- VM-free path, `completion`: 0 before conclusion and 100 after. `Result` is recalculated, and the broadcast carries `score: 100, mission_concluded: true`.
- VM-free path, `partial_then_complete`: a partial score, then 100 on conclusion
- VM path, `task_completion` slot plus `completion` mission: 100 only after conclusion
- VM path, `flags` slot plus `completion` mission: still `vm_set.score` (extends the SECURITY test at line 394)
- the existing tests at lines 251-461 pass unchanged

**Manual:**

- Play `lab_tesseract_trials` in a Hacktivity event with the playtest harness. Watch "Your games" go up through partial scores, stay at 99 or below, then reach 100 at the credits with optional tasks skipped.
- Play `awareness_e1_invoice_fraud`. After the attack beat it should show 0, and 100 after the debrief.
- Play one pre and post pair and check that the CarryOver baseline still appears.

## 8. Open questions for the user

1. **Mode A cap.** Should partial scores stop at 99 before conclusion, so that 100 always means completed? Or should they stay uncapped, which in practice can reach 100 only through a global-gated scenario?
2. **Other labs.** Should `lab_social_engineering` (the other `lab_games` lab) also use `partial_then_complete`? Are other labs in the future meant to default to it?
3. **The awareness broadcast.** Should `completion` missions stop broadcasting `user_handle` and score to the whole event channel (design 11 §6.2, "no league table")? Or is a completion-only signal acceptable?
4. **Listing label.** Should Hacktivity show "Scored on completion" on these listings?
5. **Per-listing override.** Is a `GameSlot` override wanted later, so an organiser can change the mode for one event? The proposal leaves this out.
6. **Back-fill.** After deploy, should concluded tesseract games be rescored to 100 (a one-off job over the mission's games)? This raises existing event results.
7. **Hacktivity edit.** May the one-method change to `game_scoring_job.rb` (§5, Hacktivity 1) go on Hacktivity `main`?
