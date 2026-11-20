#!/bin/bash
# tools/phone_calls/open.sh <game_id> <session_log> <tts_log> [autoBrief true|false]
# Headless session on :3023 (tools/phone_calls/ps.js = the skill harness plus --tts-log), then bootstrap past the title.
cd "$(dirname "$0")/../.."
tools/phone_calls/session-start.sh --url "http://127.0.0.1:${PC_PORT:-3023}/break_escape/games/$1" --headless true --log "$2" --tts-log "$3" 2>&1 | tail -1
# PRE_EV=<js file>: run in the page before bootstrap (a ringing opening call rings out inside bootstrap's 20 s opening wait)
[ -n "$PRE_EV" ] && tools/phone_calls/ev.sh "$1" "$PRE_EV" | tail -n 1 | cut -c1-200
tools/playtest/cmd.sh "$1" "{\"cmd\":\"bootstrap\",\"tutorial\":\"decline\",\"resume\":\"new\",\"autoBrief\":${4:-true}}" 120 | cut -c1-300
