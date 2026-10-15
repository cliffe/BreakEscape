#!/bin/bash
# usage: m07p4-phone.sh <gid> <choice-regex-or-empty>  : picks choice (or waits) and prints new phone text
C="tools/playtest/cmd.sh $1"
if [ -n "$2" ]; then $C "{\"cmd\":\"mg\",\"action\":\"choose\",\"args\":[\"$2\"]}" | cut -c1-160; fi
sleep ${3:-3}
$C '{"cmd":"mg","action":"getState"}' | python3 -c "
import sys,json
d=json.load(sys.stdin)['result']
print(d.get('text','')[-1800:]); print('CHOICES',[c['text'] for c in d.get('dialogue',{}).get('choices',[])] if d.get('dialogue') else None, 'ended', d.get('dialogue',{}).get('ended') if d.get('dialogue') else None)"
