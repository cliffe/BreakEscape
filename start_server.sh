#!/bin/bash
export BREAK_ESCAPE_STANDALONE=true

# kill any puma processes
pkill -9 -f puma; sleep 1
# start the server
bundle exec rails server -b 0.0.0.0 -p 3000 2>&1 &
