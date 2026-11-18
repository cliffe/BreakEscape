#!/bin/bash
# usage: runtrip2.sh <gid> <label> [place_x,place_y of Vector's body centre]
cd /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-return-stall/tmp/rs
G=$1
P=null; [ -n "$3" ] && P="[$3]"
J=$(sed "s/__PLACE__/$P/" trip2.js | jq -Rsc '{cmd:"eval",fn:.}')
bash c.sh $G "$J" 260 200000 | tail -1 | jq -c --arg e "$2" '.result + {engine:$e}' >> trips2.jsonl
tail -1 trips2.jsonl | jq -c 'del(.samples)'
