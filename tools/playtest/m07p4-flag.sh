#!/bin/bash
# usage: m07p4-flag.sh <gid> <n>  : walk to relay, submit flag n, show reward, close
C="tools/playtest/cmd.sh $1"
$C '{"cmd":"moveToNear","id":"flag_station_safetynet_relay"}' | cut -c1-100
$C '{"cmd":"interact","id":"flag_station_safetynet_relay"}' | cut -c1-100
sleep 1
$C "{\"cmd\":\"mg\",\"action\":\"type\",\"args\":[0,\"<flag:$2>\",{\"submit\":true}]}" | cut -c1-200
sleep 1
$C '{"cmd":"mg","action":"getState"}' | python3 -c "
import sys,json;d=json.load(sys.stdin)['result'];t=d.get('text','');print(t[t.find('Enter Flag'):][:500])"
$C '{"cmd":"mg","action":"clickControl","args":["Close"]}' | cut -c1-80
