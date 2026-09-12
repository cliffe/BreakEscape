#!/bin/bash
IN=tools/playtest/pipes-ko/in
OUT=tools/playtest/pipes-ko/out
BEFORE=$(wc -l < "$OUT")
echo "$1" > "$IN"
for i in $(seq 1 150); do
  AFTER=$(wc -l < "$OUT")
  if [ "$AFTER" -gt "$BEFORE" ]; then
    tail -n +$((BEFORE+1)) "$OUT"
    exit 0
  fi
  sleep 0.2
done
echo "TIMEOUT"
