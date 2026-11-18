#!/bin/bash
# usage: setup.sh <gameid>  : start session, read audit, return to ops floor via lobby
cd /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-return-stall/tmp/rs
G=$1; bash start.sh $G >/dev/null; sleep 20
C="bash c.sh $G"
$C '{"cmd":"converse","choices":["leave","Later","go","done","bye"]}' 60 80 >/dev/null
$C '{"cmd":"dismiss","label":"NO"}' 20 80 >/dev/null
$C '{"cmd":"enter","room":"operations_floor"}' 60 80 >/dev/null
$C '{"cmd":"moveToNear","id":"door:operations_floor->security_archives"}' 60 80 >/dev/null
$C '{"cmd":"interact","id":"door:operations_floor->security_archives"}' 30 80 >/dev/null
$C '{"cmd":"lock","code":"TrustNoOne"}' 30 80 >/dev/null
$C '{"cmd":"enter","room":"security_archives"}' 60 80 >/dev/null
$C '{"cmd":"interact","id":"badge_audit_printout"}' 30 80 >/dev/null
sleep 3
$C '{"cmd":"eval","fn":"async () => window.__test.minigame.close()"}' 20 80 >/dev/null
$C '{"cmd":"enter","room":"operations_floor"}' 60 80 >/dev/null
$C '{"cmd":"enter","room":"operations_floor"}' 60 80 | cut -c1-60
