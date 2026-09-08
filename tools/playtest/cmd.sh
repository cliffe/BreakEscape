#!/bin/bash
# Usage: cmd.sh '<json>'
IN=tools/playtest/pipes/in
OUT=tools/playtest/pipes/out
BEFORE=$(wc -l < "$OUT")
echo "$1" > "$IN"
for i in $(seq 1 100); do
  AFTER=$(wc -l < "$OUT")
  if [ "$AFTER" -gt "$BEFORE" ]; then
    tail -n +$((BEFORE+1)) "$OUT"
    exit 0
  fi
  sleep 0.2
done
echo "TIMEOUT"
