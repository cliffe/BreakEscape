#!/usr/bin/env bash
# Fresh m05 game on the keyless :3092 server; prints the game id. Extra args go to new-game.rb.
cd "$(dirname "$0")/../.."
export RBENV_VERSION=2.7.8 BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle PLAYTEST_PORT=3092 BREAK_ESCAPE_STANDALONE=true
env -u GEMINI_API_KEY bin/rails runner tools/playtest/new-game.rb m05_insider_trading "$@" 2>&1 | sed -n 's#^URL=.*/games/##p' | tail -1
