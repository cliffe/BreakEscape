# P1-A: contract gaps the rules engine resolved (for P1-R to check)

`systems/phish-rules.js`, test `social-phish-rules` 48/48.

API: `evaluateMessage(target, message, ctx)` with ctx `{accounts, people, templates, payloadKit?, priorFailures?}`;
`preSendGate(target, message, ctx, held)` → `{ok, reason: empty-blank|missing-intel|unchosen, line}`;
`dataOnlyReply(target, result)`; `deriveSenderAuth`; constants `FACTOR_ORDER`, `CANONICAL`, `PRE_SEND_GATE_LINE`.
Extra result fields: `openLine`, `firstFail`, `failCount`, `attachment` (none|pass|missing|wrong-type), `link`
(none|pass|fail), per factor `passLine`, `line`, `detail`.

1. Attachment kind: optional `ctx.payloadKit`, fallback `message.attachmentKind`; with neither, a present
   attachment is `wrong-type`.
2. `hintIndex = min(ctx.priorFailures, hints.length - 1)`, or 0 with no hints.
3. Forced From: forced to the account identity when `headerFrom.account` is true or the account lacks
   `spoofsFrom === true`; a forced account whose `person` is trusted passes `senderTrust`.
4. `senderTrust` states pass | fail | mismatch (`detail` name|address|both); `trusts: ["*"]` always passes.
5. `senderAuth` policy applies only when the claimed domain is the target's own; outside-domain spoof reads
   `would-pass`. Override shape `target.senderAuth.override` = "would-pass" | "would-fail" (00 silent).
6. Advisory fail text: authored `factorStrings.senderAuth.fail`, else canonical plus a `dmarcPolicy`
   clause whose wording is the agent's.
7. `urgencyCalibrated` always advisory; `linkCredible` required with `expectedLink`, advisory otherwise when
   a link is attached; urgency read = highest authored template `urgency`, default low; tell above
   `urgency.advisoryMax`.
8. Tells emitted in order senderTrust, senderAuth, linkCredible, urgencyCalibrated (04's table is
   inconsistent).
9. `attachmentPlausible` evaluated only when the target lists it.
10. `unchosen` line uses `slot.label`, else the slot id (00 has no slot label field).

Also found: `event-mapping-unlock-door.test.mjs` (finale session, untracked) fails in the full run, passes alone.
