#!/usr/bin/env python3
"""PostToolUse hook on Agent: remind the launcher of AGENTS.md model routing.

Runs after the agent has started, so it never blocks or doubles a launch; the
reminder only shapes the next launches. Two cases:
  - a scripted live check (live, proof, screenshot, playtest, verify, check,
    smoke, rerun) launched on anything but Haiku;
  - a review of round 2 or later launched on Opus, when AGENTS.md
    "Cheaper later rounds" says it should be a Sonnet delta review.
Tasks that name judgement work (fix, build, design, diagnose, security, access,
secrets, server output) are left alone. Fails silent.
"""
import json
import re
import sys

CHECK = re.compile(r"\b(live|proofs?|prove|screenshots?|playtests?|verify|checks?|smoke|re-?run)\b", re.I)
JUDGEMENT = re.compile(r"\b(fix|fixes|build|implement|design|plan|diagnos\w*|investigat\w*|review|"
                       r"security|access|secrets?|leak|auth\w*|server)\b", re.I)
REVIEW = re.compile(r"review", re.I)
ROUND = re.compile(r"\bR(\d+)\b|round (\d+)", re.I)
OPUS_SENSITIVE = re.compile(r"\b(security|access|secrets?|leak|auth\w*|server output|what the server serves|"
                            r"new design|design decision)\b", re.I)


def model_of(inp):
    m = (inp.get("model") or "").lower()
    if m:
        return m
    t = (inp.get("subagent_type") or "").lower()
    if t in ("haiku-reader",):
        return "haiku"
    if t in ("grok", "qwen", "sonnet-cvp"):
        return t
    return "opus"  # opus55, opus48, general-purpose and fork inherit or pin Opus


def main():
    p = json.load(sys.stdin)
    if p.get("tool_name") not in ("Agent", "Task"):
        return
    inp = p.get("tool_input") or {}
    desc = inp.get("description") or ""
    head = (inp.get("prompt") or "")[:1500]
    model = model_of(inp)
    msgs = []
    if CHECK.search(desc) and not JUDGEMENT.search(desc) and "haiku" not in model:
        msgs.append(
            "Routing reminder (AGENTS.md): \"%s\" looks like a scripted live check, launched on %s. "
            "Leave this one running. For the next scripted runs (live checks, proofs, screenshots, "
            "playtests, re-runs) use model \"haiku\" unless the task needs judgement, such as "
            "diagnosing a failure or confirming a Haiku \"stuck\" claim." % (desc, model))
    r = ROUND.search(desc)
    rnd = int(r.group(1) or r.group(2)) if r else 0
    if REVIEW.search(desc) and rnd >= 2 and "opus" in model and not OPUS_SENSITIVE.search(desc + " " + head):
        msgs.append(
            "Routing reminder (AGENTS.md \"Cheaper later rounds\"): \"%s\" is round %d on Opus. Leave it "
            "running. From the next round, if this or the previous Opus round found no blockers or majors, "
            "or from round 4 on, make it a delta review on Sonnet (the diff since the last round plus the "
            "previous findings). Stay on Opus only if a Sonnet round found a major, or the delta touches "
            "secrets, server output or access checks, or adds a design decision." % (desc, rnd))
    if msgs:
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse",
                                                 "additionalContext": "\n".join(msgs)}}))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
