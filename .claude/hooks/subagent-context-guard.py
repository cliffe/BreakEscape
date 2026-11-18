#!/usr/bin/env python3
"""PostToolUse hook: tell a subagent when its context passes the handover limits.

Agents don't track their own size, so orchestrators had to watch progress
notices and message them. This hook reads the subagent's own transcript after
each tool call and takes the context size of its latest API call.

  Soft limit (default 150k): one note. Write what you have now; finish if that
  takes about 10 more calls, otherwise hand over. Letting a nearly finished
  agent run on costs about the same as a restart and loses no work.
  Hard limit (default 200k): a firm stop note, repeated every STEP tokens of
  further growth. The tail above 200k is where the context cost was.
  Opus reviewers (agent description says "review", model Opus) get 200k soft
  and 300k hard: about half their 150k goes on the starting context and their
  own reasoning, and a split review loses the understanding it had built.

Main sessions (no agent_id in the payload) are left alone: they auto-compact.

Overrides:
  BE_HANDOVER_TOKENS        soft limit in tokens (default 150000)
  BE_HANDOVER_HARD_TOKENS   hard limit in tokens (default 200000)
  BE_REVIEW_SOFT_TOKENS, BE_REVIEW_HARD_TOKENS
                            limits for Opus reviewers (default 200000, 300000)
  $TMPDIR/claude-context-guard/threshold-<session_id>
                            "soft" or "soft,hard" for one session's subagents
                            (for testing the hook live; hard defaults to soft+50k)
Fails silent: any error exits 0 with no output.
"""
import glob
import json
import os
import sys
import tempfile

DEFAULT_SOFT = 150_000
DEFAULT_HARD = 200_000
REVIEW_SOFT = 200_000
REVIEW_HARD = 300_000
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


def env_int(name, default):
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


def limits_for(session_id):
    try:
        with open(os.path.join(STATE_DIR, "threshold-" + session_id)) as f:
            parts = [int(x) for x in f.read().strip().split(",")]
        return parts[0], parts[1] if len(parts) > 1 else parts[0] + 50_000
    except (OSError, ValueError, IndexError):
        pass
    soft = env_int("BE_HANDOVER_TOKENS", DEFAULT_SOFT)
    return soft, max(env_int("BE_HANDOVER_HARD_TOKENS", DEFAULT_HARD), soft)


def is_opus_review(transcript):
    """Opus reviewer: the launch metadata names a review and the agent runs on Opus."""
    try:
        with open(transcript[:-len(".jsonl")] + ".meta.json") as f:
            meta = json.load(f)
    except (OSError, ValueError):
        return False
    if "review" not in (meta.get("description") or "").lower():
        return False
    model = (meta.get("pickedEffortModel") or meta.get("agentType") or "").lower()
    return "opus" in model


def read_state(path):
    """(level, tokens) of the last note sent; an old bare number counts as soft."""
    try:
        with open(path) as f:
            parts = f.read().split()
    except OSError:
        return None, 0
    try:
        if len(parts) == 1:
            return "soft", int(parts[0])
        return parts[0], int(parts[1])
    except (ValueError, IndexError):
        return None, 0


HANDOVER = ("write the handover note your brief names, or one in your scratchpad if it names none "
            "(done, open, in progress, files touched, commits, gotchas), report back in at most 15 "
            "lines with the note's path, and stop. A fresh agent will continue from the note.")


def main():
    payload = json.load(sys.stdin)
    agent = payload.get("agent_id")
    if not agent or payload.get("tool_name") == "SubagentHandback":
        return
    path = find_transcript(payload)
    if not path:
        return
    tokens = context_tokens(path)
    soft, hard = limits_for(payload.get("session_id", ""))
    if is_opus_review(path) and soft == DEFAULT_SOFT and hard == DEFAULT_HARD:
        soft = env_int("BE_REVIEW_SOFT_TOKENS", REVIEW_SOFT)
        hard = max(env_int("BE_REVIEW_HARD_TOKENS", REVIEW_HARD), soft)
    if tokens < soft:
        return

    os.makedirs(STATE_DIR, exist_ok=True)
    state = os.path.join(STATE_DIR, "agent-" + agent)
    last_level, last_tokens = read_state(state)
    k = tokens // 1000
    if tokens < hard:
        if last_level:
            return
        level = "soft"
        msg = ("Context guard: your context is now about %dk tokens, past the %dk soft limit in "
               "AGENTS.md. Write what you have now (findings file, notes, your own files committed "
               "with explicit paths). If you can finish within about 10 calls, finish; otherwise "
               "hand over: " % (k, soft // 1000) + HANDOVER + " The firm stop is at %dk." % (hard // 1000))
    else:
        if last_level == "hard" and tokens < last_tokens + STEP:
            return
        level = "hard"
        lead = ("Context guard, firm stop, repeated: your context is now about %dk tokens and still "
                "growing." % k) if last_level == "hard" else (
                "Context guard, firm stop: your context is now about %dk tokens, past the %dk hard "
                "limit in AGENTS.md." % (k, hard // 1000))
        msg = (lead + " Don't finish the task. Complete only the edit in hand, commit your own files "
               "(explicit paths), " + HANDOVER)
    with open(state, "w") as f:
        f.write("%s %d" % (level, tokens))
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": msg}}))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
