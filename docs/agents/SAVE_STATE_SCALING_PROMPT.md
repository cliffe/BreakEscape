# Task: make Break Escape's periodic save cheap enough for ~1,000 concurrent players

You are picking up a scaling question about Break Escape's game-state saves. Break Escape is a Rails engine (this repo, `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape`) mounted inside the Hacktivity app (`/home/cliffe/Files/Projects/Code/Hacktivity`). Both share Hacktivity's Postgres database and app server, so Break Escape's load is Hacktivity's load.

Read `AGENTS.md` first. In particular: commit only when the user asks, engine changes need node tests (`node --test test/js/`), the Rails suite (`bin/rails test`), `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`, and a browser regression on the keyless server on port 3001 (never touch the user's server on :3000), and use UK English with no AI-sounding filler.

## The question

With hundreds to ~1,000 players at once, is the save traffic a risk to the Hacktivity hosting app, and what should change so it scales?

## What happens now (verified 2026-10-03)

The client sends a full snapshot every 30 seconds and on `pagehide` (`public/break_escape/js/state-sync.js`, `StateSync`, `buildPayload`), whether or not anything changed. The snapshot holds:
- all globals
- notes
- NPC ink variables
- fired onceOnly triggers
- pending timed texts
- phone threads
- fingerprints
- the newer `scenarioClock` and `npcVisibility`

Some actions persist straight away through their own endpoints: unlock, item pickup, task completion. Most globals reach the server only through this snapshot.

The server endpoint is `GamesController#sync_state` (`app/controllers/break_escape/games_controller.rb`, around line 645). Per request it does the following:

1. **It reads the whole game row twice.** `set_game` does `Game.find`, then `around_action :with_game_lock` calls `@game.with_lock`, which is `SELECT ... FOR UPDATE` plus a reload. The row includes `scenario_data`, the per-game rendered scenario: 60–150 KB of jsonb, of which `sync_state` needs only `startRoom`.
2. **It writes `player_state` twice.** `update_global_variables!` (`app/models/break_escape/game.rb`, around line 223) calls `save!`, then the endpoint calls `@game.save!` again at the end. Each write replaces the whole `player_state` jsonb.
3. **Every write re-indexes `player_state` in full.** There is a GIN index on it: `index_break_escape_games_on_player_state`, present in the dev database and in Hacktivity's `db/schema.rb`, around line 123. A grep found no code that queries it. There is also a GIN index on `scenario_data`, which is written once per game creation.
4. **It writes even when nothing changed,** so an idle player still costs two writes every 30 seconds.

Sizes measured in the dev Postgres database (the latest games per mission, max values):

| Mission | scenario_data | player_state |
|---|---|---|
| m02 | 147 KB | 62 KB |
| m05 | 74 KB | 51 KB |
| sis01 | 80 KB | 23 KB |
| m08 | 93 KB | 22 KB |
| others | 60–90 KB | 4–11 KB |

A rough estimate for 1,000 concurrent players: about 33 syncs a second, which is about 67 jsonb UPDATEs a second (10–60 KB each, plus GIN maintenance) and about 67 reads a second of roughly 200 KB rows. That is several GB of WAL an hour. Expect:
- table and TOAST bloat that autovacuum has to keep up with;
- backup and replica growth;
- about 3 or more app-server threads busy just on saves.

Bursts are a separate risk. When a class starts, every game is created at once (ERB scenario render plus the `scenario_data` GIN index), along with the ink and TTS fetches. **These numbers are estimates from data sizes, not measurements.**

## Options already discussed with the user (cheapest first)

1. **Skip unchanged saves.** On the client, don't send a payload identical to the last confirmed one. On the server, don't `save!` if the merge changed nothing.
2. **One write per request.** Make `update_global_variables!` (and any other merge helper that saves) mutate only, and let `sync_state` save once.
3. **Drop the unused GIN index on `player_state`.** Do it by an engine migration, so Hacktivity picks it up like the engine's other migrations. Check whether the `scenario_data` GIN index is used anywhere; drop it too if not. Confirm with the user before any migration meant for production.
4. **Don't load `scenario_data` to save.** Select only the needed columns for `sync_state` and its lock. `startRoom` could be stored or cached.
5. **A load-test script** that simulates N players syncing (and a class-start burst), runnable against staging, to replace the estimates with numbers.

The user has decided:
- **Keep the 30-second snapshot model for now.** Don't redesign to save-on-change.
- **The global "change log" goes.** It has been removed and replaced by command-board-owned entries (commit `c0c76a80`).

## Recent engine work in the same area (committed)

Commit `c0c76a80` (2026-10-03) added the following:
- `scenarioClock` (elapsed time and timer state) and `npcVisibility` to the sync, with `Game#merge_scenario_clock!` and `Game#merge_npc_visibility!`.
- A `commandBoardLog`, saved only by scenarios that have a command board, with `merge_command_board_log!`.

The general global change log described above was removed in that commit. Build on it.

Before you start, run `git log --oneline -15` and `git status`. If `state-sync.js`, `game.rb` or `games_controller.rb` have uncommitted changes you didn't make, stop and ask the user. Never use `git stash`, `checkout` or `reset` to get a clean base, because other agents share the working tree.

## What to produce

- A short findings note: confirm or correct the analysis above with file:line evidence, including any other per-request costs in `sync_state` or the endpoints called often (`room`, `ink`, `tts`, `scenario`).
- A plan for options 1–4, with expected savings and risks, for the user to approve before you implement anything that needs a migration.
- The load-test script (option 5): what it simulates, how to run it, and results against a local server if possible.
- Then implement what the user approves, with the tests and checks AGENTS.md requires. Don't commit unless asked.
