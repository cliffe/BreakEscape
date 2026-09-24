# Playtest tools

Helpers for driving the game through the dev-only `window.__test` bridge. See `docs/test-bridge.md` for the bridge API and `.claude/skills/playtest-scenario/` for the skill that runs playtests.

- `capture.js` — opens a game, clears the opening overlays, and dumps real `getState()` snapshots (overworld, during a minigame, mid-dialogue) plus the event log to JSON. Used to produce the captured output in `docs/test-bridge.md`.

  ```bash
  ./start_server.sh
  OUT=/tmp/capture.json node tools/playtest/capture.js \
    http://127.0.0.1:3000/break_escape/games/<id>
  ```

  Set `HEADED=0` for headless.

- `new-game.rb` — creates a playtest game and its flag-hints XML. One argument, the scenario name.

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
