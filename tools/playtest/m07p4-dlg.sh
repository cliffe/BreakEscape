#!/bin/bash
# usage: m07p4-dlg.sh <gid> [choice-regex]  : choose (or continue) in a person-chat, print the next dialogue
C="tools/playtest/cmd.sh $1"
if [ -n "$2" ]; then $C "{\"cmd\":\"mg\",\"action\":\"choose\",\"args\":[\"$2\"]}" | python3 -c "import sys,json;d=json.load(sys.stdin)['result'];print('>>',d.get('chose') or d)"; else $C '{"cmd":"mg","action":"continue"}' >/dev/null; fi
sleep 0.4
$C '{"cmd":"brief"}' | python3 -c "
import sys,json;d=json.load(sys.stdin)['result'];dl=d['dialogue']
print(d['room'], 'MG', d['activeMinigame'] and d['activeMinigame']['id'])
if dl: print(dl['speaker']+': '+dl['text']); print(dl['choices'] if dl['awaitingChoice'] else ('[continue]' if dl['canContinue'] else ''))"
