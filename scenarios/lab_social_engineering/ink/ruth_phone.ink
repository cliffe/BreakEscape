// ================================================
// Phishing and Social Engineering lab: Ruth on the player's phone (hint hub)
// The progress-gated support hub, reachable from any room. It shows only the
// current stage's three rungs (a visible nudge, a stronger nudge, a near-explicit
// pointer), stays under ten choices, and keeps the rungs sticky (PLAN §4, §6;
// 10 §4 "Hints"). No knot ends in DONE or END: a phone hub always loops.
// Phone lines stay under 25 words; choice labels under 15 words. Ruth's own lines
// carry no speaker prefix (phone-self-prefix rule).
//
// The "which stage" logic reads the same globals as ruth.ink. Each stage's first
// rung also names the next key to collect from Ruth, so a student at a locked door
// is pointed back to her (R2-m3). The metadata and careers-inbox pointers cover
// the two traps the board cannot signal (R2-m2, R1-m6).
// ================================================

VAR roe_signed = false
VAR fairbairn_condition_heard = false
VAR fairbairn_payoff_heard = false
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
VAR engagement_closed = false

// Ink-local: show a stage's standalone pointer once per thread, not after every
// reply (lab R6 F3). Reset nowhere: the globals only move forward.
VAR stage7_seen = false

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
- not engagement_closed: -> stage_done
- else: -> closed
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
On the sheet still?
+ [Where do I start?]
    The rules-of-engagement sheet, on the table in the Engagement Office. Sort the scope cards first.
    -> stage0
+ [A card won't go where I expect.]
    It bounces back with the line that rules it out. Read that, then try again.
    -> stage0
+ [What's the stop-rule about?]
    If you stumble on a real breach, you stop and tell me. Pick that answer.
    -> stage0
+ [Thanks.] #exit_conversation
    Go on.
    -> hub

// ---- Stage 1: scope and plan ----
=== stage1 ===
{ plan_done: -> hub }
{ fairbairn_condition_heard:
    Gareth's signed. The whiteboard next.
- else:
    Sheet's done. Gareth wants to sign it himself, by the window. Then the whiteboard.
}
+ {not fairbairn_condition_heard} [Does Gareth need me?]
    He signs in person, and he's got one condition. Hear it before you plan.
    -> stage1
+ [What objective do I pick?]
    The one that ends in a report of the gaps. Nothing broken, nobody's password kept.
    -> stage1
+ [Which success measure?]
    Not "who fell for it". Measure the process. Naming people breaks Gareth's one rule.
    -> stage1
+ [Then what?]
    Once the plan's signed off, have a word with me and I'll pass you the Recon key.
    -> stage1
+ [Right.] #exit_conversation
    Off you go.
    -> hub

// ---- Stage 2: OSINT ----
=== stage2 ===
{ osint_done and se_intel_username_convention: -> hub }
Recon's next. If that door's locked, I've got the key — come and see me. The OSINT workstation's through it.
+ [What am I looking for?]
    Three people filled in from public sources. The board's "Missing" rows say what's short.
    -> stage2
+ {not se_intel_hampshire_cv_backlog} [Chris's card won't fill.]
    Open her careers inbox on the page and select it. Her backlog post only shows then.
    -> stage2
+ {not se_intel_username_convention} [I can't work out the username pattern.]
    Open the published PDF and read its properties. The author field gives the username pattern away.
    -> stage2
+ [Got it.] #exit_conversation
    Good luck.
    -> hub

// ---- Stage 3: spear-phish rounds 1 and 2 ----
=== stage3 ===
{ phish_pierce_landed: -> hub }
Operations now. If that door's locked, I've got the key — come and see me.
+ {not phish_pierce_landed} [Which account do I send from?]
    For Chris, a throwaway webmail address: real applicants use one. For Melanie, the guest account, because it lets you set the From line.
    -> stage3
+ {not phish_hampshire_landed} [Chris isn't biting.]
    Her careers inbox trusts anyone. Apply as a candidate, and attach a CV from the kit.
    -> stage3
+ {not phish_pierce_landed} [Melanie keeps refusing.]
    Who would she open a file from without thinking? Your recon says.
    -> stage3
+ {not phish_pierce_landed} [I'm sending as Jed and she still says no.]
    Freemail can only send as itself. Switch to the guest account, then set Jed in the From line.
    -> stage3
+ [Thanks.] #exit_conversation
    Keep at it.
    -> hub

// ---- Stage 4 + 5: page and call ----
=== stage4 ===
{ landing_payroll_login_built and pretext_call_done: -> hub }
{ pretext_call_reported and not pretext_call_done:
    Dev flagged that last call to his manager. Leave it a while, then try again — softer, and have your facts straight.
- else:
    Sofia's careful. A page and a call, either order.
}
+ {not landing_payroll_login_built} [The landing page?]
    The page builder on the desk. Match her payroll portal — domain, logo, wording, the lot.
    -> stage4
+ {not pretext_call_done} [The call?]
    Ring the service desk from the desk phone. Dev. Get the portal's name off him.
    -> stage4
+ [Anything else?]
    Know who you're asking about before you ring: her name and her team. Then you're her buddy, helping out.
    -> stage4
+ [On it.] #exit_conversation
    Good.
    -> hub

// ---- Stage 5: hard phish to Lord ----
=== stage5 ===
{ phish_lord_landed: -> hub }
Now Sofia. She'll want the right sender, the portal's name and the date.
+ [Who do I send as?]
    The portal's own notification address. Dev told you how its emails read.
    -> stage5
+ {not se_intel_lord_payslip_date} [The date blank's empty.]
    You don't have the release date yet. Ring Dev back and ask when payslips go out.
    -> stage5
+ [What makes it land?]
    Her name, the portal pretext with the date, and the page as the link.
    -> stage5
+ [Right.] #exit_conversation
    Go on.
    -> hub

// ---- Stage 6: report ----
=== stage6 ===
{ report_filed: -> hub }
Sending's done. The report workstation, in the Engagement Office.
+ [Where are the numbers?]
    The builder reads them from what you sent. Read the table, then answer the two questions under it.
    -> stage6
+ [How do I write the findings?]
    A cause and a control for each. Some wrong ones sound sensible, so read why before you pick again.
    -> stage6
+ [Some of these causes blame someone.]
    Those are the wrong ones. Blame someone in writing and the whole floor stops owning up.
    -> stage6
+ [Understood.] #exit_conversation
    Good.
    -> hub

// ---- Stage 7: defender flip ----
=== stage7 ===
{ triage_pass and profile_done: -> hub }
{ not stage7_seen:
    ~ stage7_seen = true
    Blue Team room next. Tomasz will set you off.
}
+ {not fairbairn_payoff_heard} [Has Gareth seen the report?]
    He's reading it. Go by the window, he wants a word.
    -> stage7
+ {not triage_pass} [The inbox triage?]
    Sort each message: trust, report or delete. Read the SPF, DKIM and DMARC results.
    -> stage7
+ {not triage_pass} [One passes every check.]
    Passing only proves that domain sent it. Read the domain itself, letter by letter.
    -> stage7
+ {not profile_done} [The mitigations?]
    The SOC board in the Blue Team room. One fix for each exposure. Read why the others fall short.
    -> stage7
+ [Thanks.] #exit_conversation
    Nearly there.
    -> hub

=== stage_done ===
{ engagement_closed: -> hub }
That's the lot. Go and let Tomasz close it out with you.
+ {not fairbairn_payoff_heard} [Anything for Gareth?]
    He's read your report. Go and hear what he thinks, by the window.
    -> stage_done
+ [Will do.] #exit_conversation
    Good work.
    -> hub

// ---- After Tomasz's debrief: the engagement is closed, so stop pointing at him ----
=== closed ===
That's the engagement closed. Nothing more from me — good work today.
+ [Thanks.] #exit_conversation
    Any time.
    -> hub
