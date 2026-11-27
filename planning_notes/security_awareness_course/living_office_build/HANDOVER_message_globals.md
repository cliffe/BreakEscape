# Handover: triage outcome.messageGlobals

> **DONE (19 Nov).** The work this handover describes is finished and recorded in GATE_B.md. Kept for history.


Done (all in the worktree b-ca-lo-build, committed together):
- triage-scoring.js: exported isCaughtVerdict (report/delete/verify); scoreTriage uses it.
- triage-starter.js: messageGlobalPairs; saveRound writes one boolean per listed message before complete (deferEmit), sticky true; eventsFor emits them before complete; doneNames (reopen) and reemitTriageComplete (takes ctx.set) re-emit true ones first.
- episode-runner-minigame.js _reemitDefendDone passes set: this.defendSet. The first save goes through the real starter (runner uses options.set), so no change to _triageDone / _rescoreDefend (they only store verdicts).
- scripts/validate_social/triage.rb message_globals_checks; scripts/scenario-schema.json outcome.messageGlobals.
- ca01_invoice_fraud and test_ca01_panel: messageGlobals {e1_lookalike_bank: kit_fraud_caught}, global declared. Kit data (office_kits/brightwell_foods.json, both ca01 set pieces) declares kit_fraud_caught so a --kit re-run keeps it (strip_kit removes kit_ globals). office_kit.py unchanged. unittest 53 OK.
- scenarios/test_triage_message_globals (collection testing), validator 0 errors.
- Tests: test/js/triage-message-globals.test.mjs (13), validator-social-triage-message-globals.test.mjs (10), two added to social-episode-step-away.test.mjs (42 pass).
- docs/INBOX_TRIAGE_USAGE.md documents the option.

Open:
- bin/test-js full run (started in background; expect only m01-decode-task to fail).
- Live proof on port 3003 (recipe .claude/worktrees/x-ec1-proof/docs/agents/EC1_LIVE_PROOF.md): mission 169, three games (fraud reported + all right; fraud reported + another phish trusted, under 85; fraud trusted); record kit_fraud_caught, kit_caught, percent; kill by PID.
- ink: ca01 adaeze_okafor.ink has no VAR kit_fraud_caught yet (left for the dialogue agent; add VAR and recompile with bin/inklecate).
- Assumption: a listed message must be a phish (validator error otherwise).
