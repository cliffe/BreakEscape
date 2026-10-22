# Backlog batch brief (2026-10-22)

The user picked eight items from `docs/IDEAS_BACKLOG.md` to build now. Seven agents run at once in the same working tree, each on one item (the two RFID items share an agent). Other sessions are also editing this tree (finale m09 room dressing, the social-engineering build), so:

- **Edit with the Edit tool, never whole-file rewrites**, and re-read a file just before editing it. Files other agents may also touch: `js/core/player.js`, `js/core/game.js`, `js/systems/npc-behavior.js` (or wherever hostile chase lives), `js/systems/npc-los.js`, `js/minigames/index.js`, `scenarios/m06_*/scenario.json.erb`. Keep your hunks small and self-contained.
- Never `git stash`, `git checkout -- <file>`, `git reset`, or commit. Compare against `git show HEAD:<path>`.
- Don't touch `.claude/skills/*`, other repos, SecGen, lab sheets, or `docs/IDEAS_BACKLOG.md` (the orchestrator updates it).
- Don't edit voiced ink lines in missions with cached audio unless your task needs it; list any spoken line you change.
- Scratch files go in your own subfolder of the session scratchpad given in your prompt, never in the repo.
- Browser checks: use the keyless server on :3001 (`tools/playtest/start-keyless-server.sh`, start it only if nothing answers on :3001; another agent may have started it already), `PLAYTEST_PORT=3001` with `tools/playtest/new-game.rb`. Never stop the server on :3000. Kill your own headless browsers by PID when done. The playtest-scenario skill (`.claude/skills/playtest-scenario/SKILL.md`) documents the `window.__test` bridge.
- Engine changes need: node tests under `test/js/` (add one for your change where practical), `node --test test/js/` (or the repo's usual runner) passing, and a browser check of the change. Run `bin/rails test` if you touched Ruby.
- Rules: UK English, plain writing, no AI filler. Minigames should be fun and educational, not hard. Read `AGENTS.md` sections "Verifying work" and "Housekeeping" first.

## Return

A change list (file:line), test results with output, what you checked in the browser (game id, screenshots path), anything you chose between two workable options and why, and anything left undone or needing the user.
