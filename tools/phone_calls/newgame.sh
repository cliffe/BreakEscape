#!/bin/bash
# tools/phone_calls/newgame.sh <scenario> [new-game.rb options]  -> prints the game id on :${PC_PORT:-3023}
cd "$(dirname "$0")/../.."
export BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle
PLAYTEST_PORT=${PC_PORT:-3023} BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb "$@" 2>&1 | grep -E "^(GAME_ID|HEAD_START|ERROR|ABORT)|abort|rror" | head -5
