#!/usr/bin/env python3
"""SessionStart hook (source "compact"): resume a main session after compaction.

Orchestrator sessions used to stop near the auto-compact window and wait for
the user to type /compact and then the same resume prompt. Auto-compact now
runs by itself, and this hook supplies that prompt, so the session carries on
without a human. Subagents are skipped. Fails silent.
"""
import json
import sys

MSG = (
    "Resumed after compaction. Before anything else:\n"
    "0. Read the handoff note you wrote before compaction (docs/agents/RESUME.md or your "
    "stream's resume/handover file) and check on any agents it lists as running.\n"
    "1. Re-read the model-routing sections of AGENTS.md (which model for which task, "
    "Haiku for scripted runs and lookups, Sonnet by default, Opus on purpose, the opus48 "
    "rules, the 150k subagent handover) and route every new agent by them.\n"
    "2. If you are orchestrating rounds, produce a rounds review covering every ongoing "
    "stream (access control, networking, office life and anything else live), in the "
    "format in AGENTS.md \"Reporting progress by stage\", with an estimate of the work "
    "remaining.\n"
    "3. Then continue without waiting for the user. Before launching anything, ask "
    "yourself: is it possible to parallelise further? List every thread that could move now "
    "(each stream's next round, reviews, fixes, live checks, playtests) and launch all that "
    "don't touch the same files, typically 5 or 6 agents rather than 1 or 2. Only stop for "
    "decisions that are genuinely the user's (send those to the decisions page)."
)


def main():
    payload = json.load(sys.stdin)
    if payload.get("agent_id") or payload.get("source") != "compact":
        return
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "SessionStart", "additionalContext": MSG}}))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
