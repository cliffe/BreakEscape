# Minigame reuse review (2026-10-30)

Question: can each minigame added since October (plus the video call) be used by another mission or game through scenario JSON alone? Three reviewers; full reports with file:line evidence in `docs/agents/minigame_reuse/group_a.md` (inbox-triage, sort-drill, concern-form, privacy-panel), `group_b.md` (mail-client, osint-browser, authenticator, assistant-chat, password-guesser, examine) and `group_c.md` (episode-runner, engagement-report, intel-board, landing-page-builder, pretext-prep, title art, video call). The orchestrator re-checked the ink-tag stub, the authenticator trap, the read-only mail abort and the `.cc-*` CSS overlap against the code.

## Owner decisions (2026-10-30, via the reuse review form)

| Item | Decision |
|---|---|
| Bug and housekeeping batch (CSS leak, authenticator `lockUntilOutcome`, read-only mail close, `logo: false`, builder caseButton label, `titleScreenName` in schema, triage selectors and timer, password-guesser CSS, README rows) | Now |
| Fixed English text through strings tables | After the course release, one batch (backlog) |
| Open any minigame from ink (`#trigger_minigame`) and event mappings | Yes, through one starter registry keyed by object type |
| Standalone use of sort-drill, concern-form, privacy-panel, assistant-chat, password-guesser | One generic `exercise-station` object type writing `<prefix>done`/`percent` and a completion event |
| Where standalone configs live | A named list (`social.exercises[]`), objects refer by id; inline also allowed |
| Video calls from `timedConversation` | Yes, with the bug batch |
| Awareness skin switching behaviour | Let a workstation pick the skin (`minigameData.skin`), not per-feature flags |
| Triage in SAFETYNET | Keep `awareness` as the default profile, document it; lift the call/push/Verify restriction only when a mission needs it |
| Mid-round save for room triage | Later (backlog) |
| Authenticator target mode | Backlog |
| Plain email and DMs in the mail client | Design now (plan to come back to the owner) |
| Concern-form fact kinds (`config.kinds`) | Yes, with the standalone-launch work |
| One episode, board and report per scenario | Keep; document the limit |
