// ================================================
// Phishing and Social Engineering lab: Ruth on the player's phone (hint hub)
// The progress-gated support hub, reachable from any room. It shows only the
// current stage's three rungs (a visible nudge, a stronger nudge, a near-explicit
// pointer), stays under ten choices, and keeps the rungs sticky (PLAN §4, §6;
// 10 §4 "Hints"). No knot ends in DONE or END: a phone hub always loops.
// Phone lines stay under 25 words; choice labels under 15 words.
//
// The "which stage" logic reads the same globals as ruth.ink. Each stage's first
// rung also names the next key to collect from Ruth, so a student at a locked door
// is pointed back to her (R2-m3). The metadata and careers-inbox pointers cover
// the two traps the board cannot signal (R2-m2, R1-m6).
// ================================================

VAR roe_signed = false
VAR plan_done = false
VAR osint_done = false
VAR se_intel_username_convention = false
VAR se_intel_email_pattern = false
VAR se_intel_hampshire_cv_backlog = false
VAR phish_hampshire_landed = false
VAR phish_pierce_landed = false
VAR acct_freemail = false
VAR landing_payroll_login_built = false
VAR pretext_call_done = false
VAR pretext_call_reported = false
VAR se_intel_lord_payslip_date = false
VAR phish_lord_landed = false
VAR report_filed = false
VAR triage_pass = false
VAR profile_done = false

=== start ===
-> hub

=== hub ===
{
- not roe_signed: -> stage0
- not plan_done: -> stage1
- not (osint_done and se_intel_username_convention): -> stage2
- not phish_pierce_landed: -> stage3
- not (landing_payroll_login_built and pretext_call_done): -> stage4
- not phish_lord_landed: -> stage5
- not report_filed: -> stage6
- not (triage_pass and profile_done): -> stage7
- else: -> stage_done
}

// Each stage checks it is still the current one on entry. The engine resumes a
// reopened phone at the knot that held the last choices (a stageN), not at `hub`,
// so without this guard the thread stayed on whichever stage it opened at (B4).
// When the stage's work is done the guard diverts back to `hub`, which re-routes
// to the stage the globals now point at. The globals only ever move forward, so
// the guard needs only its own completion check and never loops.

// ---- Stage 0: authorisation ----
=== stage0 ===
{ roe_signed: -> hub }
Ruth Adeyemi: On the sheet still?
+ [Where do I start?]
    Ruth Adeyemi: The rules-of-engagement board, in this room. Sort the scope cards first.
    -> stage0
+ [A card won't go where I expect.]
    Ruth Adeyemi: It bounces back with the line that rules it out. Read that, then try again.
    -> stage0
+ [What's the stop-rule about?]
    Ruth Adeyemi: If you stumble on a real breach, you stop and tell me. Pick that answer.
    -> stage0
+ [Thanks.] #exit_conversation
    Ruth Adeyemi: Go on.
    -> hub

// ---- Stage 1: scope and plan ----
=== stage1 ===
{ plan_done: -> hub }
Ruth Adeyemi: Gareth's signed. The whiteboard next.
+ [Did Gareth say anything?]
    Ruth Adeyemi: He signed in person, by the window. Go and hear his one condition before you plan.
    -> stage1
+ [What objective do I pick?]
    Ruth Adeyemi: The one that matches the brief: test whether staff can be led into a mistake.
    -> stage1
+ [Which success measure?]
    Ruth Adeyemi: Not "who fell for it". Measure the process. Naming people breaks Gareth's one rule.
    -> stage1
+ [Then what?]
    Ruth Adeyemi: Once the plan's signed off, have a word with me and I'll pass you the Recon key.
    -> stage1
+ [Right.] #exit_conversation
    Ruth Adeyemi: Off you go.
    -> hub

// ---- Stage 2: OSINT ----
=== stage2 ===
{ osint_done and se_intel_username_convention: -> hub }
Ruth Adeyemi: Recon's next. If that door's locked, I've got the key — come and see me. The OSINT workstation's through it.
+ [What am I looking for?]
    Ruth Adeyemi: Three people filled in from public sources. The board's "Missing" rows say what's short.
    -> stage2
+ {not se_intel_hampshire_cv_backlog} [Chris's card won't fill.]
    Ruth Adeyemi: Open her careers inbox on the page and select it. Her backlog post only shows then.
    -> stage2
+ {not se_intel_username_convention} [I can't work out the username pattern.]
    Ruth Adeyemi: Open the published PDF and read its properties — who made it, and how. That's the gate.
    -> stage2
+ [Got it.] #exit_conversation
    Ruth Adeyemi: Good luck.
    -> hub

// ---- Stage 3: spear-phish rounds 1 and 2 ----
=== stage3 ===
{ phish_pierce_landed: -> hub }
Ruth Adeyemi: Operations now. If that door's locked, I've got the key — come and see me.
+ {not acct_freemail} [Do I write from the guest account?]
    Ruth Adeyemi: Set up a throwaway address first, so nothing comes back to Tarnside.
    -> stage3
+ {not phish_hampshire_landed} [Chris isn't biting.]
    Ruth Adeyemi: Her careers inbox trusts anyone. Apply as a candidate, and attach a CV from the kit.
    -> stage3
+ [Melanie keeps refusing.]
    Ruth Adeyemi: Borrow Jed's name — she trusts him. The From line is only a label you can set.
    -> stage3
+ [Thanks.] #exit_conversation
    Ruth Adeyemi: Keep at it.
    -> hub

// ---- Stage 4 + 5: page and call ----
=== stage4 ===
{ landing_payroll_login_built and pretext_call_done: -> hub }
{ pretext_call_reported and not pretext_call_done:
    Ruth Adeyemi: Dev flagged that last call to his manager. Leave it a while, then try again — softer, and have your facts straight.
- else:
    Ruth Adeyemi: Sofia's careful. A page and a call, either order.
}
+ {not landing_payroll_login_built} [The landing page?]
    Ruth Adeyemi: The page builder on the desk. Match her payroll portal — domain, logo, wording, the lot.
    -> stage4
+ {not pretext_call_done} [The call?]
    Ruth Adeyemi: Ring the service desk from the desk phone. Dev. Get the portal's name off him.
    -> stage4
+ [Anything else?]
    Ruth Adeyemi: Prepare the call from held facts. Say you're the new intern's buddy.
    -> stage4
+ [On it.] #exit_conversation
    Ruth Adeyemi: Good.
    -> hub

// ---- Stage 5: hard phish to Lord ----
=== stage5 ===
{ phish_lord_landed: -> hub }
Ruth Adeyemi: Now Sofia. She needs all three call facts to bite.
+ [Who do I send as?]
    Ruth Adeyemi: The portal's own notification address. Dev told you how its emails read.
    -> stage5
+ {not se_intel_lord_payslip_date} [The date blank's empty.]
    Ruth Adeyemi: You don't have the release date yet. Ring Dev back and ask when payslips go out.
    -> stage5
+ [What makes it land?]
    Ruth Adeyemi: Her name, the portal pretext with the date, and the page as the link.
    -> stage5
+ [Right.] #exit_conversation
    Ruth Adeyemi: Go on.
    -> hub

// ---- Stage 6: report ----
=== stage6 ===
{ report_filed: -> hub }
Ruth Adeyemi: Sending's done. The report desk, in this room.
+ [Where are the numbers?]
    Ruth Adeyemi: The builder reads them from what you sent. Press Confirm on the results first.
    -> stage6
+ [How do I write the findings?]
    Ruth Adeyemi: A cause and a control for each. Wrong pairs get explained; fix them and move on.
    -> stage6
+ [One cause names Melanie.]
    Ruth Adeyemi: Don't pick it. Blaming staff just stops them reporting next time. The fix, not the person.
    -> stage6
+ [Understood.] #exit_conversation
    Ruth Adeyemi: Good.
    -> hub

// ---- Stage 7: defender flip ----
=== stage7 ===
{ triage_pass and profile_done: -> hub }
Ruth Adeyemi: Blue Team room. If that door's locked, I've got the key — come and see me. Tomasz will set you off.
+ [Has Gareth seen the report?]
    Ruth Adeyemi: He has, and not one name in it. Go by the window — he'll want to thank you himself.
    -> stage7
+ {not triage_pass} [The inbox triage?]
    Ruth Adeyemi: Sort each message: trust, report or delete. Read the SPF, DKIM and DMARC results.
    -> stage7
+ {not triage_pass} [One passes every check.]
    Ruth Adeyemi: A look-alike can. Consistency isn't trust. Judge whether it should be there at all.
    -> stage7
+ {not profile_done} [The mitigations?]
    Ruth Adeyemi: Flip the SOC board to defender. Pick one fix for each flagged fact.
    -> stage7
+ [Thanks.] #exit_conversation
    Ruth Adeyemi: Nearly there.
    -> hub

=== stage_done ===
Ruth Adeyemi: That's the lot. Go and let Tomasz close it out with you.
+ [Anything for Gareth?]
    Ruth Adeyemi: He's read your report — no names, just like he asked. A word by the window wouldn't go amiss.
    -> stage_done
+ [Will do.] #exit_conversation
    Ruth Adeyemi: Good work.
    -> hub
