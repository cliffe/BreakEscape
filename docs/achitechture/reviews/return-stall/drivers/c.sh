#!/bin/bash
D=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-return-stall/tmp/rs/s$1
n=$(wc -l < $D/out)
echo "$2" > $D/in
for i in $(seq 1 ${3:-90}); do sleep 1; m=$(wc -l < $D/out); [ $m -gt $n ] && break; done
tail -n +$((n+1)) $D/out | cut -c1-${4:-2500}
