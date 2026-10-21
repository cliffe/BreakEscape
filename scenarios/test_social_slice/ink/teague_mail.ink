// Email-channel story for the slice's second, CHARACTER target (packet P1-O).
// Morgan Teague is the lab's Melanie Pierce pattern re-cast with TEST-ONLY ids, so
// nothing here collides with the lab's `pierce`. The mail runner (P1-J) restores,
// syncs, sets the run-scoped email_* variables, binds se_influence, then enters
// on_email. The EXTERNAL fallback below lets the story load unbound on the phone
// preload, a bark, or a dry run (00 S1; the mail runner binds the real function).
//
// Contract: 00 §8, §10. A character target's reply calls se_influence on BOTH the
// landing and the failing branch, and sets its own outcome global with #set_global.
// The lab's mail stories end each reply with no choices, no #compose_reply and no
// #mail_later (00 §13 "Lab ink and reply features").

VAR teague_influence = 0
EXTERNAL se_influence(delta, reason)

// Run-scoped variables the engine writes before on_email (00 §10). Defaults are only
// for a standalone load; the runner overwrites them each delivery.
VAR email_landed = false
VAR email_opened = true
VAR email_first_fail = ""
VAR email_attachment = "none"

=== function se_influence(delta, reason) ===
// Fallback only: a dry run or preload has no binding, and an unbound EXTERNAL would
// throw story-wide on the first Continue(). The real binding does the work.
~ return 0

=== on_email ===
{ not email_opened:
    // Nothing about the sender or the subject made her open it. Say nothing: the
    // checklist has already told the player it was never opened (00 §10 step 7).
    -> DONE
}
{ email_landed:
    Thanks Ravi, I'll open the ledger now.
    ~ se_influence(10, "senderTrust")
    #set_global:phish_teague_landed:true
    -> DONE
}
{ email_first_fail:
- "senderTrust": Sorry, who is this? I don't recognise the address.
- "addressedTo": This doesn't even have my name on it.
- "pretextRelevant": I'm not expecting anything like this.
- "attachmentPlausible": { email_attachment == "missing": You said you'd attach it, but there's nothing here. | That isn't a file I can open as a ledger. }
- else: I'm not sure what this is.
}
~ se_influence(-10, email_first_fail)
-> DONE
