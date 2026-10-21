# Playtest tools

Helpers for driving the game through the dev-only `window.__test` bridge. See `docs/test-bridge.md` for the bridge API and `.claude/skills/playtest-scenario/` for the skill that runs playtests.

- `capture.js` — opens a game, clears the opening overlays, and dumps real `getState()` snapshots (overworld, during a minigame, mid-dialogue) plus the event log to JSON. Used to produce the captured output in `docs/test-bridge.md`.

  ```bash
  ./start_server.sh
  OUT=/tmp/capture.json node tools/playtest/capture.js \
    http://127.0.0.1:3000/break_escape/games/<id>
  ```

  Set `HEADED=0` for headless.

- `new-game.rb` — creates a playtest game and its flag-hints XML. One argument, the scenario name. `--help` prints the options.

  Head start for short test runs (test-only; they edit that one game row, no engine code, and a normal new game cannot reach them). Repeatable, `--opt value` or `--opt=value`:

  ```bash
  PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m08_the_mole \
    --start-room server_room --unlock director_office \
    --set briefing_played=true --set suspect_theory=vector \
    --give netherton_keycard
  ```

  - `--start-room ROOM_ID` spawns the player there. It rewrites this game's own copy of `scenario_data['startRoom']` and sets `currentRoom`, so the room is unlocked and loaded first. Unknown ids abort and list the rooms.
  - `--unlock ROOM_ID` also unlocks a room.
  - `--set name=value` sets a global before load. The value is parsed as JSON when possible (`true`, `3`, `"x"`), else kept as a string. Imported globals are re-applied by the server: use `--imports=<file>` for those.
  - `--give ITEM_ID` adds a scenario item to the inventory, found by object id in rooms, containers, NPC `itemsHeld` or `startItemsInInventory`. A room copy is marked removed so it is not doubled. An NPC-held item also marks that NPC as met and the item as given (the client re-checks this on load and silently drops the item otherwise). `notes` items open in the notepad, not the inventory.

  The script prints `HEAD_START=...` with what it applied. Confirm with `verify-run.rb <game_id>` (current room, unlocked rooms, inventory) or, in the browser, `brief` / `state` after `bootstrap`. Not covered: objective/task progress, NPC conversation state, ink variables, door states beyond unlocked rooms. Set the globals the scenario's own gates read, and check the objectives the run starts with.

- `session-start.sh` / `cmd.sh` / `session-stop.sh` — keep one browser open across many tool calls and drive it a command at a time.

  ```bash
  tools/playtest/session-start.sh --url http://127.0.0.1:3000/break_escape/games/1047 \
    --speed human --flags tools/playtest/<scenario>-flags-game1047.xml \
    --log tools/playtest/<scenario>-session.jsonl
  tools/playtest/cmd.sh 1047 '{"cmd":"brief"}'
  tools/playtest/session-stop.sh 1047
  ```

  The session tag is the game id. Each session gets its own `pipes-<tag>/` and
  `<tag>.pid`, both gitignored — there is no need to copy these scripts per run.

The interactive session harness itself lives with the skill: `.claude/skills/playtest-scenario/scripts/playtest-session.js`.

## What is committed

Reports (`*-report.md`, review notes), traces, flag XMLs (`<scenario>-flags-game<id>.xml`) and the scripts here. Not committed: session JSONL logs, `pipes-*/`, `*.pid` — regenerable scratch.

## Requirements

Playwright is a dev dependency at the repo root (`npm i`), with chromium installed via `npx playwright install chromium`. Both `node_modules/` and `package-lock.json` are gitignored.
