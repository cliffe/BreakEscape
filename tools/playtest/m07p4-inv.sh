#!/bin/bash
# usage: m07p4-inv.sh <gid> <alt-prefix> : click inventory item and print minigame text
C="tools/playtest/cmd.sh $1"
$C "{\"cmd\":\"eval\",\"fn\":\"() => { const e=Array.from(document.querySelectorAll('.inventory-item')).find(x=>x.alt.startsWith('$2')); if(!e) return Array.from(document.querySelectorAll('.inventory-item')).map(x=>x.alt); for (const t of ['pointerdown','mousedown','pointerup','mouseup','click']) e.dispatchEvent(new MouseEvent(t,{bubbles:true})); return 'ok'; }\"}" | cut -c1-200
sleep 1
$C '{"cmd":"mg","action":"getState"}' | python3 -c "
import sys,json;d=json.load(sys.stdin)['result'];print(d.get('type'));print(d.get('text','')[:${3:-2500}])"
