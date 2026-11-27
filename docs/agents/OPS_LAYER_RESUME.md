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
| OPS_CORE | `bd350990a` | R1 `724275ed2` + R1b `4f043a33e`; revised `17c6a3d16`; second reviser pass running (Fable, a1bcf6813a084bbe1) | next: full R2 on Opus | | | |
| OPS_PRIVILEGE_ACCOUNTS | `9f5216ba8` | 3B 12M; revised `86e8bc159` | 0B 5M 9m `5bac3cbe4`; revised `10aa30ea8` (929 lines) | full review running (Fable, a72d93621e59cfc2a) to `OPS_PRIVILEGE_ACCOUNTS_R3.md`; 7 user questions in section 15, cross-plan requests to CORE, CRACKING, MFA, LOG_ROWS go to the next cross-plan review | | |
| OPS_REALISM_SKIN | `1f9fc50e3` | 1B 5M; revised `b40e9c1eb` | 0B 2M 11m `97f5538f8`; reviser NOT launched, waits for core second pass | | | |
| OPS_CRACKING | `5e88e7aff` | 4B 9M `46649f23f`; reviser HELD (opus48 safeguard stop; user picks on BLOCK-1) | | | | |
| OPS_MFA_HELPDESK | `6995773a9` | 0B 7M; revised `1ac5579be` | 0B 2M 11m `850c0d087`; reviser running (Fable, afce605ac16c1e685) | | | |
| OPS_LOG_ROWS | `aa595c30d` | 0B 8M; revised `354171b88` | 0B 7M 14m `d0e30d580`; reviser running (Opus, aa64722898cd48cd2) | | | |

## Decisions and questions for the user

- Orchestrator rulings so far (10:58): the step from user to admin uses core's shapes
  (`needs.session`, `grants.session.access`), privilege supplies the level's meaning; the skin's
  list of offered controls is private to the network-view folder, no registration by other plans,
  core owns names; the skin switch shows only on `ops: true` networks; sign-in order is password,
  PC admission (account kind), second step, session write; a technique session meets no second
  step, a recovered or collected password does; a policy's kind is public, its answers are not.
- 11:02. Cross-plan R1 (`de81d644f`): 2 blockers, 12 majors, 13 minors; 42 requests, 26 unmet,
  rulings A to K in `reviews/CROSS_PLAN_R1.md` lines 99-179; merged question list at line 611
  (37 for the user). Sent to the four running revisers by message. Where I differ from that file:
  the log helper fits the sibling plans (not the reverse) and ids may appear in a row if nothing
  unearned is revealed; cracking writes no rows (offline work; the row belongs to the action that
  obtained the hash); the skin's control list is view-local on core's `ops-model.js`, build order
  unchanged, with a confirm question to the user. Still to apply in round 2: rulings touching CORE
  (B, D, E, G's item-id request) and CRACKING (E, F, named state keys, `crackRuns` server-owned).
- 11:13. Round 1 revisions committed: PRIVILEGE `86e8bc159`, MFA `1ac5579be`, SKIN `b40e9c1eb`,
  LOG_ROWS `354171b88`; R2 reviews running on all four (findings to `reviews/<PLAN>_R2.md`).
  CORE: reviser (Fable) running on R1 + cross-plan rulings; R1b findings `OPS_CORE_R1b.md`
  (4 majors, 13 minors) need a second reviser pass after it reports. Rulings added: the log
  plan's L1 (helper only) lands before core S1; a hash file read on a share is the log plan's own
  plain "file read" row. Picks page builder running, writes scratchpad `ops_plan_picks.html`
  (localStorage key `be-ops-plan-picks-v1`); publish it when it reports.
- 11:18 HANDOFF (read this first after compaction).
  Picks page PUBLISHED for the user: source scratchpad `ops_plan_picks.html` (session scratchpad
  dir), 37 questions in groups BLOCK, SHARED, CORE, PRIV, MFA, SKIN, CRACK, LOG; localStorage key
  `be-ops-plan-picks-v1`; ids are stable, so republish the same file path to update. The user has
  not answered yet. BLOCK-1 decides the cracking revision (do NOT rerun it on any model before).
  When agents report: commit the plan + DECISIONS file by explicit path, then launch the next
  review. Next reviews: R3 is a full review only where R2 found majors and the revision
  redesigned something; otherwise a Sonnet delta review (diff since last round + previous
  findings), per AGENTS.md "Cheaper later rounds". Reviewers cross-model: Fable-revised plans
  (CORE, SKIN, MFA) on Opus, Opus-revised (PRIVILEGE, LOG_ROWS) on Fable.
  After the core second pass reports: (1) commit; (2) launch core R2 (Opus, full); (3) launch the
  SKIN R2 reviser (Fable) from `OPS_REALISM_SKIN_R2.md`, telling it core is final for now: show
  noise, Probe, evidence and Alerted in the Terminal, list `network_alerted`, use core's server
  aliases f1/f2, fix text test 9, the locked-row Sign in offer, beats T3/T5; settle questions 4
  and 5 in the plan; (4) update the picks page Core group from core's section 15 and republish.
  Rulings since 11:02: session answers carry `access: "admin"` only when the computed level is
  admin, any session kind, never a default; log helper stage L1 lands before core S1 and each
  plan's stages write and assert their own rows; MFA: saved connections through the second step
  and approve-from-phone-menu move to a later slice, and until then a saved connection to an MFA
  PC is refused with a reason; a hash file read on a share is the log plan's plain file-read row.
  Still to do at the end: update the outline's build order (log helper first) and its status
  paragraph; a second cross-plan review once all six are through R2; tell the user about the
  sis01/sis02 log tint bug (already reported in chat).
- 11:20 HANDOFF 2 (newest; read with the 11:18 one). Four revisers running, none commits:
  core second pass (Fable, a1bcf6813a084bbe1, from `OPS_CORE_R1b.md`), privilege R2 (Opus,
  a6da98267bbaa0c17), MFA R2 (Fable, afce605ac16c1e685), log rows R2 (Opus, aa64722898cd48cd2).
  Each writes its plan and `reviews/<PLAN>_DECISIONS.md` only. On each hand-back: `git add` the
  two paths, check `git diff --cached --stat`, commit, then launch that plan's R3 review
  (PRIVILEGE and LOG_ROWS on Fable, MFA and CORE on Opus with "review" in the description; all
  four R2 rounds had majors and touch secrets or access checks, so R3 is a full review, not a
  Sonnet delta). Not launched yet: core R2 review, SKIN R2 reviser (both wait for the core pass),
  cracking reviser (HELD for BLOCK-1).
  Rulings since 11:18, already sent to the running revisers: event names are snake_case in every
  plan; the log helper is its own first stage L1a (helper and event list only) ahead of every
  other ops stage, L1b is the log plan's own badge and sign-in rows; the helper never saves, so
  each plan says per row whether its call site already saves; an exact repeat merges into a count;
  no `detail` value may hold a secret, guarded by a test over every registered event; a refused
  sign-in row and `share_file_read` belong to the log plan (privilege drops its duplicate); log
  storage is settled in the plan (`player_state`, row caps plus a byte cap per row), so drop
  LOG-2 from the picks page at the next republish unless the user answered it.
  Then: second cross-plan review once five plans are through R2 revision; outline build order
  (L1a first) and status paragraph; picks page Core group from core section 15.
- 11:24 HANDOFF 3. Core second pass committed `cbdc20507` (1573 lines; read-through unfinished,
  list in `ops_layer/HANDOVER_OPS_CORE_PLAN_reviser.md`, handed to the reviewer). Running now:
  core R2 full review (Opus, a21da12d7a5e9f614) to `reviews/OPS_CORE_R2.md`; SKIN R2 reviser
  (Fable, a52d2d62dc9256530); privilege R3 review (Fable, a72d93621e59cfc2a); MFA R2 reviser
  (Fable, afce605ac16c1e685); log rows R2 reviser (Opus, aa64722898cd48cd2), which was also sent
  core's request 8 (place kind `pc`, `network_alerted`, detail keys `finding`, `how`, `grant`,
  drop `from` if over the cap) and privilege's request for a "row already logged" lookup.
  Core keeps the log plan's event names (`network_swept`, `host_scanned`, ...). Core reviser
  choices left for the reviewer to attack: optional `grants`, noise per request, 404 for a card
  not held, `notes1` placeholder sprite, `needs.item` split into `item`/`itemType`.
  Picks page still to update in one republish: Core group now 4 questions (discovery enforced or
  display only; cost of the loop, noise recommended; technique session against sign-in rules; the
  word `technique`); Privilege group now 7 (adds admin tile, remote USB override, owner
  collectable); drop LOG-2.
- 11:25. MFA R2 revision committed `e16680e5c` (1125 lines, grew; not re-read end to end, needs
  a trim: handover in `ops_layer/HANDOVER_OPS_MFA_HELPDESK_PLAN_reviser.md`). MFA R3 full review
  running (Opus, a7c73074fc9a9b4d1) to `reviews/OPS_MFA_HELPDESK_R3.md`, asked for a trim list.
  MFA questions for the picks page are now 4: the code clock; whether NPCs react to pestering or
  a reset; borrowing and giving back; typed form or dialogue choices. Possible fifth: 30 wrong
  codes closes an account's code step for the game (reviewer asked whether that can strand a
  player). MFA's log requests sent to the log reviser (`own_phone` code, no `request` or
  `credential` detail, `as: nil`).
- 11:26. Log rows R2 revision HALF done, committed `437e34745` (sections 3 to 11; 1104 lines).
  Continuation running (Opus, a325100074ccbcabb) from
  `ops_layer/HANDOVER_OPS_LOG_ROWS_PLAN_reviser.md`: sections 12 to 15, all of 13 (helper with a
  `once:` option and a stored-or-not return, sibling mapping, core's and MFA's requests), leftover
  grep, decisions file. When it reports: commit plan + DECISIONS, launch log rows R3 full review
  on Fable. Settled in the plan: 400-byte row cap, 128 KB total; refused sign-ins logged; a play
  row cannot be a puzzle's anomaly. Log questions for the picks page are now 2 (copied-card
  identity in the door log; NPC or office-life rows): drop the other LOG questions.
- 11:31 HANDOFF 4 (newest). State by plan:
  CORE: R2 findings `cd7ac5f1a` (0B 1M 10m); R2 reviser running (Fable, a3b732d6aa3fe7b91), also
  taking the skin's and privilege's requests to core. Next: commit, R3 on Opus (delta is allowed
  on Sonnet only if nothing touches secrets; this one changes what the browser is sent, so Opus).
  PRIVILEGE: R3 findings `4382058aa` (0B 1M 12m, verdict: delta is enough for R4); R3 reviser
  running (Opus, a6804b381c2cc5cc0). Next: commit, R4 delta review (Fable, since it changes the
  collect route's access answer).
  SKIN: R2 revision `b0fa7afee` (1058 lines); R3 full review running (Opus, a967dddbf5130541a).
  One user question left (scenario default skin, no forcing).
  MFA: R3 full review running (Opus, a7c73074fc9a9b4d1).
  LOG_ROWS: continuation of the R2 revision running (Opus, a325100074ccbcabb). Next: commit,
  R3 full review on Fable.
  CRACKING: held for BLOCK-1.
  Rulings 11:26 to 11:31: log plan's event names win (`usb_install_overridden`,
  `credentials_harvested`), `signin_refused` everywhere; `once:` option and stored-or-not return
  on the helper, callers on non-saving routes save only when a row was stored; the collect route
  answers the same for an unknown PC and one with no admin session; "Fixed" shows only on a
  confirmed finding; technique cards need a plain item type, not `notes1`; a technique session
  refused at the PC keyboard gets its own code; core's Panels draw the access level.
  New user question from core: do technique sessions join the permanent `signedInPcs` list.
- 11:33. MFA R3 findings `3537c4da7` (0B 1M 7m; verdict: delta next). MFA R3 reviser running
  (Fable, ae5fc3a0e8a84cb43), told to trim under 1000 lines. Next: commit, R4 delta review
  (Opus, since it touches sign-in checks). Rulings: the wrong-code limit is a user question (new
  MFA question 5) and no scenario may be stranded by it; the remembered code is tied to its
  device; helpdesk rows record the typed username the same way for known and unknown accounts.
- 11:36. Log rows R2 revision complete, committed `4ff0372e6` (1249 lines; helper returns a
  result with `stored?`, `once:` over a 256-digest set `opsLogOnce`, merge over the 10 newest
  rows, ids capped at 40 characters and account names at 32, row cap 400 bytes). R3 full review
  running (Fable, a725b16c039f7b813) to `reviews/OPS_LOG_ROWS_R3.md`, asked for a trim list. The
  40-character cap and the final row names were sent to the core and privilege revisers. Still
  open for the cracking plan when it is unheld: remove its stale row list.
- 11:40 HANDOFF 5 (newest; supersedes the per-plan state in HANDOFF 4).
  CORE: R2 revision `04dea0645` (1693 lines; card type `technique_card`, 403 `network_only`,
  five user questions). R3 full review running (Opus, a5602a169d22f00d5), asked for a trim list.
  PRIVILEGE: R3 revision `e6a0ae290` (~1005 lines). R4 delta review running (Fable,
  acc0a60bf053918a6) to `OPS_PRIVILEGE_ACCOUNTS_R4.md`; if nothing above nit, the plan stops.
  SKIN: R3 findings `7d796e106` (0B 2M 6m). R3 reviser running (Fable, a42923e147f234204).
  Next: commit, R4 delta review on Sonnet (no secrets or access checks in the skin).
  MFA: R3 reviser running (Fable, ae5fc3a0e8a84cb43). Next: commit, R4 delta on Opus.
  LOG_ROWS: R3 full review running (Fable, a725b16c039f7b813). Its next reviser must also change
  the 13.7 cell that says `/network/technique` saves on every 422 (core saves a quiet refusal
  only when `stored?`).
  CRACKING: held for BLOCK-1; when unheld it must also rename proof `dumped` to `harvested`
  keyed by sign-in PC id, and remove its stale log row list.
  After the R4 rounds: second cross-plan review (Fable) over the five plans; picks page
  republish (Core 5 questions, Privilege 7 with changed 1 and 5, MFA 5, Skin 1, Log 2); outline
  build order and status paragraph.
- 11:42 USER REQUIREMENT (verbatim): "MFA should (also?) be flexible to apply to various kinds
  of locks as a push accept, for example: the player walks up to a locked PC, or even open an
  encrypted zip file -- as an attribute to the object." My reading: a second step as an
  attribute on any lockable object, in addition to the sign-in policy. Plan: new stage S8c in
  `OPS_MFA_HELPDESK_PLAN.md`. The running MFA R3 reviser was told only to keep the second-step
  server logic as functions taking an owner and a target reference, and to add a "Later slices"
  pointer. A Haiku reader (aa5c442487f5b3f30) is writing
  `ops_layer/digests/D6_locks_unlock_paths.md`. When BOTH the MFA reviser and D6 have reported:
  commit both, then launch a Fable planner to add S8c to the MFA plan from D6 (schema attribute
  on a lock, which kinds each lock type supports, server unlock path order, what reaches the
  browser, state, validator and graph, tests, log rows), then a FULL R4 review on Opus (not a
  delta). Tell the log plan's next reviser about any new rows.
- 11:43. MFA R3 revision committed `8cffe735e` (1101 lines; not re-read end to end; handover
  in `ops_layer/HANDOVER_OPS_MFA_HELPDESK_PLAN_reviser.md`; the helpdesk `maxTries` block is
  permanent and needs the same no-stranding rule as the code limit). MFA is WAITING for D6, then
  the S8c planner (which also does the read-through and trim), then a full R4 on Opus.
  LOG_ROWS: R3 findings `70affdce3` (0B 4M 9m). R3 reviser running (Opus, a9ce153bf9d06d65f).
  Rulings: own secret list (not `AccessLeakScanner#secret_values`); no bare integer detail, only
  a bounded `count`; saves on free branches bounded by a stored counter per event and place,
  rows dropped after it (core's quiet `technique_refused` too: tell the core reviser);
  `helpdesk_request` records `as: { typed: }` always, bounded per desk; `share_file_read`
  folder-or-file is a user question; a plain object or door id is a valid place kind (for S8c).
  Next: commit, R4 delta review (Fable).
- 11:44. D6 committed `82809503c` (no second step on any lock today; no encrypted-file lock; an
  unused `dual-auth` minigame posts a method the server refuses; unlock route
  `POST /games/:id/unlock`, `Game#validate_unlock` at `game.rb:4597`). S8c planner running
  (Fable, a2083d2c395e8f19a), writes only `OPS_MFA_HELPDESK_PLAN.md`. When it reports: commit,
  then FULL R4 review on Opus (S8c against the unlock code, plus the end-to-end read and trim
  list the R3 reviser never did); pass any new rows to the log plan's reviser or next round.
- 11:45. PRIVILEGE R4 delta findings `c56a60195` (0B 0M 6m 7n; verdict: one more delta round).
  R4 reviser running (Opus, a85308373ccff6b0f), wording and scope only; ruling: the power term
  goes back into `keyboard_admin?`. Next: commit, R5 delta review (Fable); if nothing above nit,
  PRIVILEGE is done. Request to pass to core's next reviser: does `desktop_request_allowed?` let
  a technique admin session on a blocked headless host through (the collect depends on it).
- 11:46 HANDOFF 6 (newest state by plan).
  CORE: R3 findings `0ac4e7d04` (0B 2M 6m; verdict: delta next). R3 reviser running (Fable,
  a5c0e7affc31a06ca), also answering privilege's `desktop_request_allowed?` question and the
  skin's quiet-or-noisy text source. Next: commit, R4 delta on Opus.
  PRIVILEGE: R4 reviser running (Opus, a85308373ccff6b0f). Next: R5 delta (Fable), then done.
  SKIN: R3 reviser running (Fable, a42923e147f234204). Next: R4 delta on Sonnet.
  MFA: S8c planner running (Fable, a2083d2c395e8f19a). Next: full R4 on Opus.
  LOG_ROWS: R3 reviser running (Opus, a9ce153bf9d06d65f), told to add `foothold` and plain
  object/door place kinds. Next: R4 delta (Fable).
  CRACKING: held for BLOCK-1.
- 11:47. SKIN R3 revision committed `288139643` (1123 lines; content done, read-through and trim
  not). Sonnet editing pass running (a0915c731b1052170): consistency and trim only, under 1000
  lines. Next: commit, R4 delta review on Sonnet (diff since `b0fa7afee` + `OPS_REALISM_SKIN_R3.md`).
  Rulings sent to the core reviser: Panels show no quiet/noisy note; the pending-request guard is
  in the scene's shared `perform` (sweep, scan, check, confirm, use, unplug).
- 11:50. PRIVILEGE R4 revision committed `48b0ec89f` (1027 lines). R5 delta review running
  (Fable, a6f8f5a57b1050dde) to `OPS_PRIVILEGE_ACCOUNTS_R5.md`; verdict "ready" ends the plan's
  rounds, otherwise one small Opus fix pass and stop.
- 11:51. MFA plan with S8c committed `c5ed48e55` (1400 lines). S8c: `secondStep: { kind, owner? }`
  on any locked object or door; kinds push, push_number_match, code (code only on password/pin
  locks); reuses `/mfa/*` routes with `target_type`/`target_id`; state key `lockSteps`; archive
  example met by the existing `zip_archive` container; feature id A25 (my ruling); builds L1
  (password/pin on objects) then L2. MFA user questions now 8 (6 archive as container or per-file
  lock; 7 staging L1 then L2; 8 does a passed approval lapse, helpdesk `maxTries`). FULL R4
  review running (Opus, a507d1abc5320b61a) to `OPS_MFA_HELPDESK_R4.md`, asked whether S8c should
  be split into its own plan file and for a trim list. Next: Fable reviser acts on R4 (and
  splits if recommended), then R5 delta on Opus. S8c's log requests sent to the log reviser.
- 11:52 HANDOFF 7 (newest state by plan).
  CORE: R3 revision `b401f3fe3` (1684 lines, accepted). R4 delta review running (Opus,
  a14ec25a85499bccc) to `OPS_CORE_R4.md`. "ready" ends its rounds; else one fix pass + R5 delta.
  PRIVILEGE: R5 delta review running (Fable, a6f8f5a57b1050dde).
  SKIN: Sonnet editing pass running (a0915c731b1052170); then R4 delta on Sonnet.
  MFA: full R4 review running (Opus, a507d1abc5320b61a).
  LOG_ROWS: R3 reviser running (Opus, a9ce153bf9d06d65f); then R4 delta (Fable).
  CRACKING: held for BLOCK-1.
  When all five are at R4 or later: second cross-plan review (Fable), then the picks page
  republish (question counts: Core 5, Privilege 7, MFA 8, Skin 1, Log 3 incl. folder-or-file).
- 11:53. LOG_ROWS R3 revision committed `b5e43b4c6` (1268 lines; sections 13 and 11 not re-read).
  R4 review running (Fable, ad1f8c88a66ac2edb) to `OPS_LOG_ROWS_R4.md`: delta + consistency read
  + trim list + a "sibling X must change A to B" list. Next: one Opus reviser pass, then R5.
  Log plan renames siblings must adopt at their next edit: `merge_limit` -> `save_limit`
  (stored counter `opsLogSaves`), detail `by` -> `approver`, shared `route` list (`keyboard`,
  `foothold`, `from`, `relay`), `share_file_read` -> `share_folder_opened`, counts as
  `{ count: <=9 }`, `from` uses kind `foothold`, quiet `technique_refused` `save_limit: 10`,
  blocked helpdesk branch `save_limit: 10` per desk. Log user questions now 3.
- 11:54. SKIN trim pass committed `923088f9f` (1031 lines, accepted). R4 delta review running
  (Sonnet, aedac230b57faa436) to `OPS_REALISM_SKIN_R4.md`, told to check nothing was lost in the
  trim (compare against `288139643`). "ready" ends the skin's rounds; else a Fable fix pass.
  All five live plans are now in R4 or R5 review: CORE R4 (a14ec25a85499bccc), PRIVILEGE R5
  (a6f8f5a57b1050dde), SKIN R4 (aedac230b57faa436), MFA R4 full (a507d1abc5320b61a), LOG_ROWS R4
  (ad1f8c88a66ac2edb).
- 11:55. PRIVILEGE R5 findings `99df47fc7` (0B 0M 2m 5n; reviewer: no sixth round needed). Final
  fix pass running (Opus, a6392caf7249cf81b): client drops `access` on an `off` refusal;
  `accountOnly` must state `staff` explicitly; five nits. When it reports: commit; PRIVILEGE
  ROUNDS ARE DONE (five rounds). Do not launch another review for it.
- 11:58. PRIVILEGE DONE: five rounds complete, final text committed (1041 lines; see
  `git log -1 -- docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md`). No more reviews for it. Left:
  its seven user questions, the log plan's renames if any still differ (the R4 log review's
  sibling list will say), and the second cross-plan review.
- 11:58 HANDOFF 8 (NEWEST: read this first; it supersedes earlier per-plan state).
  Rules in force: subagents never commit, I commit by explicit path in the worktree; cross-model
  reviews; plans standalone; cracking untouched until the user answers BLOCK-1; user decisions go
  on the picks page (scratchpad `ops_plan_picks.html`, published
  https://claude.ai/artifact/NJ3CMZUUG6wKE2S9VtEg5e, localStorage key `be-ops-plan-picks-v1`,
  republish the same path once, after the R4/R5 rounds).
  PRIVILEGE: DONE (five rounds, `d4fd20176`).
  CORE: R4 findings `d2e5740c0` (0B 1M 4m). R4 reviser running (Fable, ade3af4823983655d), small
  pass. Ruling: core owns and builds the shared `perform` pending guard (key action+target; `use`
  keyed by card+finding; unplug folded in); the skin only routes through it. Next: commit, R5
  delta on Opus, then done (a tiny fix pass if R5 has minors).
  SKIN: R4 delta review running (Sonnet, aedac230b57faa436). Its fix pass must also apply the
  guard ruling above (K1 no longer builds the guard) and then the skin is done after R5 or, if
  R4 says "ready" apart from that, one Fable fix pass and stop.
  MFA (+S8c): full R4 review running (Opus, a507d1abc5320b61a). Next: Fable reviser (split S8c to
  its own file if the review recommends), then R5 delta on Opus.
  LOG_ROWS: R4 review running (Fable, ad1f8c88a66ac2edb). Next: one Opus reviser pass (findings +
  trim + its own change for `service_checked` bound, core R4 m4-3), then R5 delta on Fable.
  CRACKING: held.
  After those: second cross-plan review (Fable) over five plans incl. the log plan's sibling
  change list; apply sibling renames; picks page republish (Core 5, Privilege 7, MFA 8, Skin 1,
  Log 3); outline build order (L1a first; S8c = A25) and status paragraph.
  User requirement added 11:42: second step on any lock (S8c) - done as a plan stage.
- 11:59. SKIN R4 findings `65eea6358` (0B 1M 5m; nothing lost in the trim). R4 fix pass running
  (Fable, a8a637f4fcece1652): K1 only routes through core's guard; a late answer after a skin
  switch is drawn by the active renderer; `network_only` never reaches a network-view renderer.
  Next: commit, R5 delta on Sonnet, checking it agrees with core's guard text; then done.
- User decisions pending: does a typed sign-in with an admin's password give an admin session; how the cracking revision proceeds; forged intel facts (cracking B2);
  how the server learns cached accounts (privilege, four options).

- 10:50. Cross-plan R1 review running (Fable), findings to `reviews/CROSS_PLAN_R1.md`: request
  ledger with recommended rulings, conflicts, one merged list of open questions.
- Open questions raised by the drafts: core 8, skin 8, cracking 4, MFA 11, privilege 5, log rows 7.
  They go on one picks page after R1, from the cross-plan reviewer's merged list.
- To watch: the skin plan's client `MOVES` table against the user's "no moves registry" decision;
  privilege S5b declares cached accounts statically, not from NPC routine as the outline says;
  MFA codes use real server time; log rows keep up to 300 rows in `player_state`.
- Outside this stream (tell the user, do not fix): the anomaly row in the sis01/sis02 log
  terminals is visibly tinted (`log-filter-minigame.css:336-342`).

## 12:05 state (after compaction)

- R4 findings committed: core `d2e5740c0`, skin `65eea6358`, log rows `ceb248f83`, MFA `1754dfe69`.
- S8c (second step as an attribute on any lock) is leaving the MFA plan for its own file,
  `docs/achitechture/OPS_LOCK_SECOND_STEP_PLAN.md` (feature A25, builds L1 then L2). Planner (Fable) running.
- Core R4 revision done (1703 lines): core builds the shared `perform` pending guard. Next: R5 delta on Opus.
- Running at 12:05: skin R4 fix pass (Fable), log rows R4 reviser (Opus), lock second-step planner (Fable),
  MFA R4 reviser (Fable, removes S8c, trims under 1150).
- Next per plan: skin R5 delta on Sonnet (guard text must agree with core); log rows R5 delta on Fable;
  MFA R5 delta on Opus; lock plan full review on Opus; then a second cross-plan review on Fable.
- Open for the log plan: whether noisy refusals spend the same per-host `save_limit` count as quiet ones.
- Still owed: picks page republish (new question groups), outline build order (L1a first, A25 separate plan).
- Cracking plan stays held for the user's BLOCK-1 answer.
