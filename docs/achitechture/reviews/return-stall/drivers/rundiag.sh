#!/bin/bash
# usage: rundiag.sh <gid> <label> -> appends JSON line to diag.jsonl
cd /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-return-stall/tmp/rs
G=$1
J=$(jq -Rsc '{cmd:"eval",fn:.}' diag.js)
bash c.sh $G "$J" 260 10000000 | tail -1 | jq -c --arg e "$2" --arg g "$G" '.result + {engine:$e, gid:$g}' >> diag.jsonl
tail -1 diag.jsonl | jq -c '{gid,engine,homeFromReturn,ev:[.ev[].ev],ncalls:(.calls|length),nholds:(.holds|length)}'
