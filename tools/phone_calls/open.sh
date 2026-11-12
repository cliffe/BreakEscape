#!/bin/bash
# tools/phone_calls/open.sh <game_id> <session_log> <tts_log> [autoBrief true|false]
# Headless session on :3023 (tools/phone_calls/ps.js = the skill harness plus --tts-log), then bootstrap past the title.
cd "$(dirname "$0")/../.."
tools/phone_calls/session-start.sh --url "http://127.0.0.1:3023/break_escape/games/$1" --headless true --log "$2" --tts-log "$3" 2>&1 | tail -1
tools/playtest/cmd.sh "$1" "{\"cmd\":\"bootstrap\",\"tutorial\":\"decline\",\"resume\":\"new\",\"autoBrief\":${4:-true}}" 120 | cut -c1-300
