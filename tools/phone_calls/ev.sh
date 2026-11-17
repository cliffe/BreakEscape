#!/bin/bash
# Run a JS snippet file (an async function body that may `return`) in a playtest session's page.
#   tools/phone_calls/ev.sh <session> <file.js> [timeout-seconds]
set -uo pipefail
cd "$(dirname "$0")/../.."
TAG=$1; F=$2; SECS=${3:-60}
JSON=$(python3 -c 'import json,sys; print(json.dumps({"cmd":"eval","fn":"async () => {\n"+open(sys.argv[1]).read()+"\n}"}))' "$F")
tools/playtest/cmd.sh "$TAG" "$JSON" "$SECS"
