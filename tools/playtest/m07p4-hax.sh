#!/bin/bash
# usage: m07p4-hax.sh <gid> <n-last-messages> [contact]  : open phone thread, print last n bubbles from DOM, leave phone open
tools/playtest/m07p4-openphone.sh $1 "${3:-Agent HaX}" >/dev/null
tools/playtest/cmd.sh $1 '{"cmd":"eval","fn":"() => { const t=document.querySelector(\".phone-chat-messages, .phone-messages, .messages-container\"); const root=document.querySelector(\".phone-chat-minigame, .minigame-container, body\"); const all=Array.from(document.querySelectorAll(\"[class*=message]\")).filter(e=>e.children.length===0||e.querySelector(\"*\")===null); return all.map(e=>e.innerText.trim()).filter(x=>x); }"}' | python3 -c "
import sys,json;d=json.load(sys.stdin)['result'];print('\n'.join(d[-int('$2'):]))"
