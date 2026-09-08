# Playtest tools

Helpers for driving the game through the dev-only `window.__test` bridge. See `docs/test-bridge.md` for the bridge API and `.claude/skills/playtest-scenario/` for the skill that runs playtests.

- `capture.js` — opens a game, clears the opening overlays, and dumps real `getState()` snapshots (overworld, during a minigame, mid-dialogue) plus the event log to JSON. Used to produce the captured output in `docs/test-bridge.md`.

  ```bash
  ./start_server.sh
  OUT=/tmp/capture.json node tools/playtest/capture.js \
    http://127.0.0.1:3000/break_escape/games/<id>
  ```

  Set `HEADED=0` for headless.

The interactive session harness lives with the skill: `.claude/skills/playtest-scenario/scripts/playtest-session.js`.

## Requirements

Playwright is a dev dependency at the repo root (`npm i`), with chromium installed via `npx playwright install chromium`. Both `node_modules/` and `package-lock.json` are gitignored.
