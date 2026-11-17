#!/usr/bin/env python3
"""PostToolUse hook: tell a subagent when its context passes the handover limit.

AGENTS.md asks every subagent to hand over at about 150k tokens, but agents
don't track their own size, so orchestrators had to watch progress notices and
message them. This hook reads the subagent's own transcript after each tool
call, takes the context size of its latest API call, and once that passes the
limit injects a reminder into the subagent's context. It repeats every STEP
tokens of further growth, more firmly each time.

Main sessions (no agent_id in the payload) are left alone: they auto-compact.

Overrides:
  BE_HANDOVER_TOKENS   limit in tokens (default 150000)
  $TMPDIR/claude-context-guard/threshold-<session_id>
                       a file holding a limit for one session's subagents
                       (for testing the hook live)
Fails silent: any error exits 0 with no output.
"""
import glob
import json
import os
import sys
import tempfile

DEFAULT_LIMIT = 150_000
STEP = 25_000
TAIL_BYTES = 400_000
STATE_DIR = os.path.join(tempfile.gettempdir(), "claude-context-guard")


def context_tokens(path):
    """Context size of the last assistant API call in a transcript."""
    size = os.path.getsize(path)
    with open(path, "rb") as f:
        f.seek(max(0, size - TAIL_BYTES))
        lines = f.read().decode("utf-8", "replace").splitlines()
    for line in reversed(lines):
        if '"usage"' not in line:
            continue
        try:
            d = json.loads(line)
        except ValueError:
            continue
        u = (d.get("message") or {}).get("usage")
        if d.get("type") == "assistant" and u:
            return sum(u.get(k) or 0 for k in (
                "input_tokens", "cache_creation_input_tokens", "cache_read_input_tokens"))
    return 0


def find_transcript(payload):
    agent = payload["agent_id"]
    base = os.path.splitext(payload.get("transcript_path", ""))[0]
    session_dir = base if os.path.isdir(base) else os.path.join(
        os.path.dirname(base), payload.get("session_id", ""))
    for pattern in ("subagents/agent-%s.jsonl", "subagents/*/*/agent-%s.jsonl"):
        hits = glob.glob(os.path.join(session_dir, pattern % agent))
        if hits:
            return hits[0]
    return None


def limit_for(session_id):
    try:
        with open(os.path.join(STATE_DIR, "threshold-" + session_id)) as f:
            return int(f.read().strip())
    except (OSError, ValueError):
        pass
    try:
        return int(os.environ.get("BE_HANDOVER_TOKENS", DEFAULT_LIMIT))
    except ValueError:
        return DEFAULT_LIMIT


def main():
    payload = json.load(sys.stdin)
    agent = payload.get("agent_id")
    if not agent or payload.get("tool_name") == "SubagentHandback":
        return
    path = find_transcript(payload)
    if not path:
        return
    tokens = context_tokens(path)
    limit = limit_for(payload.get("session_id", ""))
    if tokens < limit:
        return

    os.makedirs(STATE_DIR, exist_ok=True)
    state = os.path.join(STATE_DIR, "agent-" + agent)
    try:
        with open(state) as f:
            last = int(f.read().strip())
    except (OSError, ValueError):
        last = 0
    if last and tokens < last + STEP:
        return
    with open(state, "w") as f:
        f.write(str(tokens))

    k = tokens // 1000
    if not last:
        lead = "Context guard: your context is now about %dk tokens, past the %dk handover limit in AGENTS.md." % (k, limit // 1000)
    else:
        lead = ("Context guard, repeated: your context is now about %dk tokens and still growing. "
                "Stop starting new work." % k)
    msg = (lead + " Finish only the step you are on; don't start another. Commit your own files "
           "(explicit paths), write the handover note your brief names, or one in your scratchpad if it "
           "names none (done, open, in progress, files touched, commits, gotchas), then report back in at "
           "most 15 lines with the note's path, and stop. A fresh agent will continue from the note.")
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": msg}}))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
