#!/bin/bash
cd /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-return-stall
env -u GEMINI_API_KEY RBENV_VERSION=2.7.8 BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle PLAYTEST_PORT=3092 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m08_the_mole 2>&1 | grep -v -i "warning:\|previous definition" | tail -6
