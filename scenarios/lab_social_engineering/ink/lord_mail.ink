// ================================================
// Phishing and Social Engineering lab: Sofia Lord (email channel, headless)
// Sofia Lord (id `lord`), the finance intern, twenty, careful. She lands only on
// the hard round: the portal's own notification sender, her name in the greeting,
// a payslip pretext carrying the portal name and release date, and the stage-4
// page as the link (PLAN §5 stage 5). The mail runner restores, syncs, sets the
// run-scoped email_* variables, binds se_influence, then enters on_email (00 §10).
// The EXTERNAL fallback lets the story load unbound on a preload or a dry run (S1).
//
// Contract: 00 §8, §10. se_influence is called on BOTH branches; the landing sets
// phish_lord_landed. No choices, no #compose_reply, no #mail_later (00 §13).
// linkCredible is a required factor for Lord (she has an expectedLink), so a send
// with no page or a wrong page fails here (email_link "none"/"fail").
// ================================================

VAR lord_influence = 0
EXTERNAL se_influence(delta, reason)

// Run-scoped variables the engine writes before on_email (00 §10).
VAR email_landed = false
VAR email_opened = true
VAR email_first_fail = ""
VAR email_link = "none"

=== function se_influence(delta, reason) ===
// Fallback only: the real binding does the work.
~ return 0

=== on_email ===
{ not email_opened:
    -> DONE
}
{ email_landed:
    Sofia Lord: Oh, my first payslip! I've been waiting for this. Logging in now.
    ~ se_influence(10, "linkCredible")
    #set_global:phish_lord_landed:true
    -> DONE
}
{ email_first_fail:
- "senderTrust": Sofia Lord: I don't know this address. Our payroll notices don't come from there.
- "addressedTo": Sofia Lord: This doesn't have my name on it. The portal always uses it.
- "pretextRelevant": Sofia Lord: I wasn't told to expect this. I'll check with the office first.
- "linkCredible": { email_link == "none": Sofia Lord: There's no link here to log in with. | Sofia Lord: That link isn't our portal — the address is wrong. }
- else: Sofia Lord: I'm not sure about this. I'd rather ask someone.
}
~ se_influence(-10, email_first_fail)
-> DONE
