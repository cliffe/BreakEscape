#!/bin/bash
# usage: game2.sh <label>  -> new game, setup, prints game id
cd /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-return-stall/tmp/rs
unset OLD
G=$(bash ng.sh | grep -o 'game[0-9]*\.xml' | grep -o '[0-9]*')
echo "$G $1" >> games.txt
bash setup2.sh $G >/dev/null 2>&1
echo $G
