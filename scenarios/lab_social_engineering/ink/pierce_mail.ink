// ================================================
// Phishing and Social Engineering lab: Melanie Pierce (email channel, headless)
// Melanie Pierce (id `pierce`), Finance, a career-changer into finance in her
// early forties — a new starter is not always young, and she is nobody's fool
// (PLAN §3). The mail runner restores, syncs, sets the run-scoped email_*
// variables, binds se_influence, then enters on_email (00 §10). The EXTERNAL
// fallback lets the story load unbound on a preload, a bark or a dry run (00 S1).
//
// Contract: 00 §8, §10. A character target's reply calls se_influence on BOTH the
// landing and the failing branch, and sets its own outcome global with #set_global.
// Lab mail stories end each reply with no choices, no #compose_reply and no
// #mail_later (00 §13). She lands on the Jed spoof plus the Friday balance sheet.
// ================================================

VAR pierce_influence = 0
EXTERNAL se_influence(delta, reason)

// Run-scoped variables the engine writes before on_email (00 §10). Defaults are
// only for a standalone load; the runner overwrites them each delivery.
VAR email_landed = false
VAR email_opened = true
VAR email_first_fail = ""
VAR email_attachment = "none"

=== function se_influence(delta, reason) ===
// Fallback only: a dry run or preload has no binding. The real binding does the work.
~ return 0

=== on_email ===
{ not email_opened:
    // Nothing about the sender or subject made her open it. The checklist has
    // already said it was never opened (00 §10). Say nothing.
    -> DONE
}
{ email_landed:
    Melanie Pierce: Thanks Jed — that's the one I was chasing. Opening it now.
    ~ se_influence(10, "pretextRelevant")
    #set_global:phish_pierce_landed:true
    -> DONE
}
{ email_first_fail:
- "senderTrust": Melanie Pierce: Sorry, who is this? I don't have you in my contacts.
- "addressedTo": Melanie Pierce: There's no name on this. Anyone who knew me would have used it.
- "pretextRelevant": Melanie Pierce: I'm not expecting anything like this. What's it about?
- "attachmentPlausible": { email_attachment == "missing": Melanie Pierce: You mention a file, but nothing's attached. | Melanie Pierce: That isn't a spreadsheet I can open. }
- else: Melanie Pierce: I'm not sure what this is, to be honest.
}
~ se_influence(-10, email_first_fail)
-> DONE
