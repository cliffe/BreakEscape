#!/bin/bash
# usage: m07p4-openphone.sh <gid> [contact text]
C="tools/playtest/cmd.sh $1"
$C '{"cmd":"eval","fn":"() => { const e=document.querySelector(\".inventory-item[data-type=phone]\"); for (const t of [\"pointerdown\",\"mousedown\",\"pointerup\",\"mouseup\",\"click\"]) e.dispatchEvent(new MouseEvent(t,{bubbles:true})); return e.dataset.unreadCount; }"}' | cut -c1-120
sleep 1
if [ -n "$2" ]; then $C "{\"cmd\":\"mg\",\"action\":\"clickText\",\"args\":[\"$2\"]}" | cut -c1-120; sleep 2; fi
$C '{"cmd":"mg","action":"getState"}' | python3 -c "
import sys,json
d=json.load(sys.stdin)['result']
print(d.get('text','')[-2500:]); print('CHOICES',[c['text'] for c in d.get('dialogue',{}).get('choices',[])] if d.get('dialogue') else None, 'contacts', [c['label'][:60] for c in d.get('contacts',[])])"
