# Task: cheaper game-state saves (plan A+B)

You are implementing an approved change to how Break Escape saves game state. Break Escape is a Rails engine (this repo) mounted inside the Hacktivity app. Both share Hacktivity's Postgres database and Puma processes, so every save Break Escape makes is load on Hacktivity. The goal is to support about 1,000 concurrent players. The user has approved two parts:

- **A**: make the existing 30-second sync cheaper on the server.
- **B**: have the client send only what changed since the last save the server confirmed.

Read `AGENTS.md` first. The rules that matter most here:

- Commit only when the user asks. Never use `git stash`, `checkout` or `reset`.
- Engine changes need:
  - `node --test test/js/`
  - `bin/rails test`
  - `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`
  - a browser regression run (see "Verification").
- Use UK English, with no filler, in comments, docs and reports.

Start with `git log --oneline -10` and `git status`. The base is `origin/main` at or after `dea05b70`.

## Background (verified 2026-10-04 against `dea05b70`)

### Client: `public/break_escape/js/state-sync.js`

- `StateSync.sync()` runs every 30 s. It always sends the full `buildPayload()`: `currentRoom`, `globalVariables`, `notes`, `scenarioClock`, `npcVisibility`, `commandBoardLog`, `biometricSamples`, `npcInkVariables`, `triggeredEvents`, `timedMessages` and `phoneState`.
- `flush()` runs on `pagehide`. It uses a keepalive `fetch` capped at 60 KB, and drops sections when the body is over the cap.
- Phone state already has change tracking: `npcManager.exportPhoneState({ onlyChanged })` and `markPhoneStateSynced` (`systems/npc-manager.js` around line 1687), using `_phoneStateSent`. This is the model for B. It is used only on flush today.
- Other code forces a sync by calling `window.stateSync.sync()` directly:
  - `music/scenario-music-events.js:184`
  - `systems/biometric-samples.js:118`
  - `systems/tutorial-manager.js:33`
- Globals are assigned directly on `window.gameState.globalVariables` from about 67 places in 30 files. There is no shared setter, and **you should not add one**. B works by comparing snapshots, so none of those places need to change. One place deletes a global: `minigames/siem/siem-dashboard-minigame.js:964`.
- Sizes in the dev database for the largest games, compressed:
  - phoneState: 22–34 KB
  - notes: 8–19 KB
  - globals, triggeredEvents and npcInkVariables: about 3 KB each

### Server: `GamesController#sync_state` (`app/controllers/break_escape/games_controller.rb`, around line 653)

**Reads**

- `set_game` runs `Game.find`.
- `around_action :with_game_lock` then runs `@game.with_lock`, which is `SELECT … FOR UPDATE` plus a full reload.
- So the whole row is read twice, including `scenario_data` (60–150 KB of jsonb). `sync_state` needs only `scenario_data['startRoom']`, and only when `currentRoom` isn't in `unlockedRooms`.

**Writes**

- `Game#update_global_variables!` (`app/models/break_escape/game.rb` around line 223) calls `save!`. The action then calls `@game.save!` again at the end, so there are two UPDATEs of the whole `player_state` per request.
- Every other merge helper used here already says "Does not save!; the caller does":
  - `merge_biometric_samples!`
  - `merge_npc_ink_variables!`
  - `merge_triggered_events!`
  - `replace_timed_messages!`
  - `merge_phone_state!`
  - `merge_scenario_clock!`
  - `merge_npc_visibility!`
  - `merge_command_board_log!`
- `update_global_variables!` is also called from `app/controllers/break_escape/api/games_controller.rb:17`, and is referenced in `test/controllers/break_escape/game_state_locking_test.rb:30`.

**Indexes**

- There are GIN indexes on `player_state` and `scenario_data`, from `db/migrate/20251120155358_create_break_escape_games.rb:68-69`.
- No code in the engine or in Hacktivity's `app/` queries either column with jsonb operators. Re-check this with a grep before you drop them.

**Other per-save costs to confirm in the SQL log**

- `validates :player, presence: true` and `validates :mission, presence: true` may load both associations on every save.
- The Pundit policy compares `record.player == user`, which may load `player`.

**Ordering**

- The comment at `games_controller.rb` around lines 642-652 records an open problem: a delayed or retried sync can overwrite newer state. B fixes this as part of the work.

### Postgres facts behind the design (measured, not assumed)

- `jsonb_set`/`||` do not write part of a value in place. Changing one key of a 35 KB `player_state` wrote 38.5 KB of WAL.
- A large column left unchanged in the same row costs nothing, because Postgres reuses its pointer (168 B of WAL).
- So the savings come from **not writing**, **writing once**, and **having no GIN index to update**. Changing how the SQL is written saves nothing.
- Rails' dirty tracking already skips an UPDATE when a jsonb attribute comes out equal to its loaded value.

## What to build

### A1. One write per request, and none when nothing changed

- Make `update_global_variables!` mutate only, and rename it to `merge_global_variables!` to match the other helpers.
  - Update both controllers and the locking test.
  - The API controller must then save on its own.
- In `sync_state`, call `@game.save!` only if `@game.changed?`.
  - Check that a merge producing identical data leaves `changed?` false. jsonb dirty tracking compares the serialised values.
  - If a helper rebuilds a hash in a different key order, normalise it or compare before assigning.
- Keep the `after_commit` completion callbacks working. They key off `saved_changes`, and none of them should fire from `sync_state` anyway.

### A2. Drop the unused GIN indexes

- Write one engine migration that removes both indexes, `index_break_escape_games_on_player_state` and `index_break_escape_games_on_scenario_data`, with:
  - `disable_ddl_transaction!`
  - `algorithm: :concurrently`
  - `if_exists: true`
- Make it reversible: `down` re-adds them concurrently.
- The user has approved dropping the `player_state` index. Dropping the `scenario_data` index is proposed on the grounds that nothing queries it. Say so in your report so the user can veto it.
- Update `test/dummy/db/schema.rb` if the dummy app keeps one.
- Hacktivity picks the migration up through `rails break_escape:install:migrations`, which the user runs. Don't attempt it.

### A3. Don't load `scenario_data` to save

- For `sync_state` only, replace `set_game` + `with_game_lock` with one locked load of just the columns it needs, inside a transaction. For example: `Game.lock.select(:id, :player_state, :player_type, :player_id, :mission_id, :status, …).find(id)`.
- Work out the exact list from what validations, the policy and the callbacks read. Reading a column you didn't select raises `ActiveModel::MissingAttributeError`, so add tests that would catch that.
- Fetch `startRoom` only on the rare path, when `currentRoom` isn't in `unlockedRooms`: `Game.where(id:).pick(Arel.sql("scenario_data->>'startRoom'"))`.
- If the presence validations load `player` and `mission` on every save, find a safe way to skip them for this update and justify it in a comment. One option: `belongs_to` is already required, and the IDs can't change here.
- Leave the other actions on the existing lock. Narrowing them is out of scope.

### B. Client sends only changes; server orders them

**Comparing against the last confirmed state**

- `StateSync` keeps `this.confirmed`: the last payload, by section, that the server acknowledged.
- For each sync, build the full payload as now, then compare it with `confirmed`:
  - **Keyed sections** (`globalVariables`, `npcInkVariables`, `triggeredEvents`, `npcVisibility`, `phoneState`): send only the changed keys.
    - For `npcInkVariables`, send only the changed NPCs, each with their whole entry.
    - For `phoneState`, reuse the existing `onlyChanged`/`markPhoneStateSynced` mechanism. Don't build a second one.
    - A key that has disappeared is sent as `null`. Today the server merge ignores `null`, so add deletion for `globalVariables` and keep it to that section. The SIEM minigame deletes a key, so its entry must be removed on the server too.
  - **Notes**: send only notes that are new or changed, by id. The server already merges by id.
  - **Lists that are replaced whole when they change**: `timedMessages`, `commandBoardLog` and `biometricSamples`.
  - **`currentRoom`**: send it only when it changes.
  - **`scenarioClock`**:
    - Elapsed time changes every tick, so it must not on its own count as a change.
    - Count a change in timer state (started, fired or cancelled ids) as a real change.
    - Attach the current clock to any sync that sends something else, and to every `flush()`.
    - If only elapsed time has moved, send it at most every 5 minutes, so a crash loses at most that much clock.
- If nothing changed, send nothing. An idle player then makes no requests at all.

**Baseline on load**

- `confirmed` starts empty, so the first sync after a page load sends a full snapshot, as today. After that, only differences are sent.
- This is intentionally simple. Don't try to seed `confirmed` from the restored state. Restoration is spread across several systems and is partly asynchronous.

**Acknowledgement and failure**

- Update `confirmed` only from the sections and keys that were sent, and only after a 2xx response that isn't marked stale (see below).
- On failure, leave `confirmed` alone. The next sync then includes those changes again, with their current values.
- Allow only one sync in flight per page. A sync requested while one is in flight, including forced `stateSync.sync()` calls, runs straight after it finishes. It does not run in parallel.

**`flush()`**

- Send the change set against `confirmed`, which is normally small.
- Keep the 60 KB fallback ordering as it is.

**Ordering**

- Every sync carries `clientTs`: `Date.now()`, raised if needed so it is always greater than the last value sent from that page.
- The server stores the newest accepted value as `player_state['lastSyncClientTs']`.
- If a request's `clientTs` is not newer than the stored value, the request is stale (for example, a flush from the old page arriving after the new page has synced). Then the server:
  - still applies the merges that can only grow and are safe to repeat: `triggeredEvents`, `scenarioClock`, `commandBoardLog` and `biometricSamples`. `npcVisibility` and `phoneState` are candidates too: decide from their merge code and write your reasons in a comment;
  - skips the sections where the last write wins (`currentRoom`, `globalVariables`, `notes`, `timedMessages`, `npcInkVariables`);
  - responds `{ success: true, stale: true }`.
- On a stale response, the client does not mark those sections confirmed, so they are resent with current values.
- Requests without `clientTs` (older cached clients during a deploy) are applied as today.
- Wall-clock `Date.now()` is enough, because reloads happen on one machine. Note in a comment that a clock changed backwards during a reload would make the new page's syncs stale until the clock passes the old value. Cap that delay: if the server sees a stale `clientTs` more than 10 minutes older than the stored one, accept the request and reset the stored value.

**Group the payload for future multiplayer**

- Sections that would be shared in a multiplayer game: `globalVariables`, `npcVisibility`, `scenarioClock`, `commandBoardLog`, `triggeredEvents`.
- Sections that would be per player: `currentRoom`, `notes`, `phoneState`, `npcInkVariables`, `biometricSamples`, `timedMessages`.
- Name and order the payload builders so this split can be read in the code, and record it in a short comment block. Don't change behaviour for it. The user may later move the per-player sections to a separate table.

### Load-test script

Add `scripts/load_test/sync_state_load.rb`, or a Node script if that's simpler. It should:

- take N simulated players (default 200) and a duration;
- create or reuse N games for a test user through the normal endpoints, or directly through the models in a `bin/rails runner` mode;
- send `sync_state` requests every 30 s per player with jitter, using a realistic mix: most requests idle (no request under B), some with small global changes, a few with phone or notes changes;
- simulate a class-start burst mode: N games created within a few seconds, then each fetching `scenario` and `ink`;
- report latency (p50/p95/p99) and error counts;
- report Postgres stats from before to after:
  - WAL bytes, from `pg_current_wal_insert_lsn()`;
  - `n_tup_upd`, `n_tup_hot_upd` and `n_dead_tup` for `break_escape_games`, from `pg_stat_user_tables`;
  - table and TOAST size growth.

Run it against a local server before and after your changes, with the same N and duration. Put both result sets in the report.

## Verification

- **Node tests** for `StateSync`: change detection per section, `null` for deleted globals, the clock-only rule, not marking sections confirmed on failure or stale responses, the single-in-flight queue, and `clientTs` always increasing. Follow the style of `test/js/phone-reopen-and-persistence.test.mjs`.
- **Rails tests** (extend `test/controllers/break_escape/reload_persistence_test.rb` and `game_state_locking_test.rb`):
  - one UPDATE per sync with changes, and zero for a sync with nothing new (count SQL with `ActiveSupport::Notifications`);
  - partial payloads leave untouched sections alone;
  - deleting a global;
  - a stale `clientTs` skips last-write-wins sections but still applies the grow-only merges;
  - a request without `clientTs` behaves as today;
  - no `MissingAttributeError` on the narrow load;
  - the API controller still saves globals.
- **All existing suites pass:** `node --test test/js/`, `bin/rails test`, and the `reopencheck` command above.
- **Browser regression** on a server started on port 3001 (keyless: no Gemini key, so no TTS), if a headless browser is available in your environment:
  - play a mission partway;
  - reload and check that globals, notes, phone threads, the clock and fired one-shot events survive;
  - leave the game idle for 2 minutes and confirm from the server log that no `sync_state` requests arrive;
  - change one global and confirm that the next request carries only that key.
  - If no browser is available, say so plainly in the report. The user will run it locally.

## Report

Include:

- what changed, by file;
- before and after load-test numbers;
- test results with their output;
- anything you couldn't verify;
- every judgement call (the `scenario_data` index, which merges count as grow-only, how you skipped the presence validations).

Don't commit. Leave the changes in the working tree, or on a branch if that's how this environment returns work.
