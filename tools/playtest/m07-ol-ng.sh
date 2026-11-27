#!/bin/bash
cd /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ol-m07
export RBENV_VERSION=2.7.8 BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle PLAYTEST_PORT=3098 BREAK_ESCAPE_STANDALONE=true
env -u GEMINI_API_KEY bin/rails runner tools/playtest/new-game.rb m07_architects_gambit 2>&1 | grep -E "^(GAME_ID|FLAGS_XML)" | tr '\n' ' '
