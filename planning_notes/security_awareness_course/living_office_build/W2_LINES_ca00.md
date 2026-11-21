# W2_LINES_ca00 — P-X0 (ca00 host greeting)

Package P-X0 (brief section 2.6). One host line: ca00's before-done greeting now asks the
learner to say hello to one of the team before sitting down (no names), per 1.3 / 2.6. The
tour's kiosk cards and `alreadySeen` are untouched. ca00 has `convention: true`, no triage
set, no defend scoring, so this line does not branch on `kit_key_caught` and carries no branch.

Source file is `AW/core00/ink/anjali_rao.ink` (P-X0's owned file); `gen_core00_shell.py`
copies it verbatim into `scenarios/ca00_first_play/ink/anjali_rao.ink` (same line number), so
the runtime line is identical. Only the `episode_core_00_first_play_done` is-false branch of
`hub` changed; the done branch and the exit choice are unchanged.

| id | file:line | speaker (full display name) | voice | line (exact text) | kind | voiced or written | branch |
|---|---|---|---|---|---|---|---|
| ca00-H1 | AW/core00/ink/anjali_rao.ink:27 | Anjali Rao | Kore | Welcome. I'm Anjali, I look after security here. Say hello to one of the team before you sit down, then open the kiosk for a quick brief. | host | voiced | |

## Counts against 4.1

- Host: 1 (budget 1). Stub 0, shared 0, twin 0, layer 0/1 0. Total 1 of 1. Within budget.
- Clips: 1 (single greeting beat, no branch).
- Word count: 27 (cap 30). dialoguelint: no findings (`lengths` [17, 27, 2], max 27).

## npc-dialog-review (section 2l, P1–P13)

Self-check against the P1–P13 concision rules; a formal opus48 npc-dialog-review runs on the
whole wave 2 batch (I step 8) before any voicing.
- P1/P9: "Welcome." is a single allowed verbless opener; the rest is two clean sentences, each
  a different point (greeting + task). Not choppy.
- P10: no announcing preamble. P11: no padding tail (the old "It's all practice." was dropped).
- P13: no semicolons, em dashes or colons in speech.
- No names (Darren / Niamh) in the line, per 1.3. Full display-name prefix. No `{var}`.
- Verdict: 0 blockers, 0 majors, 0 minors. Commit: see P-X0 build commit below.
