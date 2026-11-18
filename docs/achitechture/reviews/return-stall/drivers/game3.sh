#!/bin/bash
# usage: game3.sh <old|new> <place1> [place2...]   place = "x,y" Vector body centre
cd /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-return-stall/tmp/rs
if [ "$1" = old ]; then export OLD=1; else unset OLD; fi
E=$1; shift
G=$(bash ng.sh | grep -o 'game[0-9]*\.xml' | grep -o '[0-9]*')
echo "$G r2-$E" >> games.txt
echo "game $G $E"
bash setup2.sh $G >/dev/null 2>&1
for p in "$@"; do bash runtrip3.sh $G "$E" "$p" | cut -c1-400; done
bash c.sh $G '{"cmd":"quit"}' 20 >/dev/null
