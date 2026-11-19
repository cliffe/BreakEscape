# Ops layer planning: resume note

Orchestrator: session breakescape-36. Branch `docs/ops-layer-plan`, worktree
`.claude/worktrees/ops-plan`. AC0 is parked (user, 2026-11-19), so nothing goes to a train until
the user says how. Brief: `docs/agents/OPS_LAYER_BRIEF.md`.

## State (update after every step)

- 2026-11-19 10:37. Outlines split three ways (`4aa22dda7`); brief committed (`51b7a8c18`).
- 10:40 to 10:50. Digests D1 to D5 written by Haiku readers in `docs/agents/ops_layer/digests/`
  (D5 came back half done; D5b, schema, validator, cheat policy and tests, is still running).
  Digests are NOT committed yet: commit them by explicit path at the next step.
- 10:50. Six planners launched in the background, each writing one file in `docs/achitechture/`
  and not committing: OPS_PRIVILEGE_ACCOUNTS (Opus), OPS_CRACKING (Opus), OPS_LOG_ROWS (Opus),
  OPS_MFA_HELPDESK (Fable), OPS_CORE (Fable), OPS_REALISM_SKIN (Fable).
- 10:45. First drafts: PRIVILEGE and CRACKING (Opus) were each stopped by the safety classifier
  with nothing written, and LOG_ROWS ran out of context; each left a handover note in
  `docs/agents/ops_layer/`. Relaunched: LOG_ROWS on Opus, PRIVILEGE and CRACKING on `opus48`
  (the one retry AGENTS.md allows), all three from their notes with narrow-read, write-early
  briefs. CORE, SKIN and MFA (Fable) still on their first run.
- Model-routing note: task type "ops-layer plan drafting (privilege/cached credentials; hash
  cracking minigame)" was stopped on Opus 5.5 while reading keyring and session code; no plan
  text existed yet. If `opus48` is stopped too: Haiku gathers the context, then the narrow
  residue goes to the user as a `sonnet-cvp` offer.
- 10:54. CRACKING R1 done (4 blockers, 9 majors, 8 minors, 3 nits; `46649f23f`). Its reviser on
  `opus48` was stopped by the safeguard before editing anything (plan unchanged). Model-routing
  note: task type "revise the hash-cracking minigame plan from review findings", stop message
  "Opus 4.8's safeguards flagged this message ... Details: [cyber]", request
  req_011ChCAPunmRgP5dGaJNTkEy. HELD: waiting for the user's choice (sonnet-cvp retry, or other).
  Do not rerun it on another model without that.
- The user's quota resets at 12:00 (2026-11-19): run agents in parallel, do not hold back.

## Next steps

1. As each planner reports: commit its plan file (explicit path), tick the tracker, note its
   cross-plan requests and open questions below.
2. When all six drafts exist: review round 1. Six reviewers, cross-model (Fable drafts reviewed on
   Opus: CORE, SKIN, MFA; Opus drafts reviewed on Fable: PRIVILEGE, CRACKING, LOGS), plus one
   cross-plan reviewer (Fable) reading all six for conflicts. Findings go to
   `docs/agents/ops_layer/reviews/<PLAN>_R1.md`; reviewers do not edit plans.
3. Settle cross-plan requests myself (record in the brief, section 5), then launch six revisers on
   the drafting model, each rewriting its plan as a standalone document and recording declined
   findings in `reviews/<PLAN>_DECISIONS.md`.
4. Repeat to round five (delta-only reviews from round four, on Sonnet), unless a round finds
   nothing above nit.
5. Batch the plans' open questions for the user on a picks page (questions with context, options,
   a recommendation; inputs saved to localStorage; a Copy picks button).

## Gotchas

- Work in the worktree `.claude/worktrees/ops-plan` with absolute paths; the session's working
  directory drifts back to the main checkout. Never commit on main. AC0 is parked.
- Subagents hit the context guard at 150k to 200k; keep briefs narrow and expect partial results.
- Digest findings to remember: the server knows only `sessions` and `signedInPcs`, not NPC
  presence at a PC (matters for cached credentials); the habits `phishable`, `pretextable`,
  `challengesStrangers` were never built; minigames `authenticator`, `dual-auth`, `siem`,
  `log-filter` and `network-view` exist; `ui/display-settings.js` already stores per-player display
  options; a scenario `ca03_helpdesk_reset` exists.
- Picks page for the earlier proposals: https://claude.ai/artifact/SjEUb6eHqnvkisy8DBMbKj
  (source in the session scratchpad; the user's picks are recorded in the outline, section 2).

## Round tracker

| Plan | Draft | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|---|
| OPS_CORE | partial `23d08537c` (9-12 being written, Fable) | waits for draft (Opus) | | | | |
| OPS_PRIVILEGE_ACCOUNTS | `9f5216ba8` (opus48) | running (Fable) | | | | |
| OPS_REALISM_SKIN | `1f9fc50e3` | running (Opus) | | | | |
| OPS_CRACKING | `5e88e7aff` (opus48) | running (Fable) | | | | |
| OPS_MFA_HELPDESK | `6995773a9` | running (Opus) | | | | |
| OPS_LOG_ROWS | `aa595c30d` | running (Fable) | | | | |

## Decisions and questions for the user

- 10:50. Cross-plan R1 review running (Fable), findings to `reviews/CROSS_PLAN_R1.md`: request
  ledger with recommended rulings, conflicts, one merged list of open questions.
- Open questions raised by the drafts: core 8, skin 8, cracking 4, MFA 11, privilege 5, log rows 7.
  They go on one picks page after R1, from the cross-plan reviewer's merged list.
- To watch: the skin plan's client `MOVES` table against the user's "no moves registry" decision;
  privilege S5b declares cached accounts statically, not from NPC routine as the outline says;
  MFA codes use real server time; log rows keep up to 300 rows in `player_state`.
- Outside this stream (tell the user, do not fix): the anomaly row in the sis01/sis02 log
  terminals is visibly tinted (`log-filter-minigame.css:336-342`).
