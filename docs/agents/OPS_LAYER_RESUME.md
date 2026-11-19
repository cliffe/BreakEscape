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
| OPS_CORE | | | | | | |
| OPS_PRIVILEGE_ACCOUNTS | | | | | | |
| OPS_REALISM_SKIN | | | | | | |
| OPS_CRACKING | | | | | | |
| OPS_MFA_HELPDESK | | | | | | |
| OPS_LOG_ROWS | | | | | | |

## Decisions and questions for the user

(none yet)
