// Email-channel story for the P9 fixture's character target, Jordan Wexley.
// Exercises the deferred mail reply features (01 N8, 00 §10 "Replies, reply
// choices and chasers"): the reply ends on ink CHOICES, so the mail client shows
// "Choose a reply"; one option continues into #compose_reply, so the thread then
// offers the judged composer. TEST-ONLY ids; nothing here is lab content.
//
// The runner sets the run-scoped email_* variables, binds se_influence, then enters
// on_email. The EXTERNAL fallback lets the story load unbound on a dry run (00 S1).

VAR wexley_influence = 0
EXTERNAL se_influence(delta, reason)

VAR email_opened = true
VAR email_landed = false

=== function se_influence(delta, reason) ===
// Fallback only; the mail runner binds the real function.
~ return 0

=== on_email ===
{ not email_opened:
    // Never opened: the checklist has already told the player why (00 §10 step 7).
    -> DONE
}
{ email_landed:
    Thanks, I'll act on this.
    ~ se_influence(10, "senderTrust")
    #set_global:phish_wexley_landed:true
    -> after_reply
- else:
    I'll take a look, though I don't fully recognise this.
    ~ se_influence(-2, "senderTrust")
    -> after_reply
}

=== after_reply ===
One thing before I finish.
+ [It's the Q3 export Ravi mentioned] -> confirm_export
+ [Sorry, wrong person] -> wrong_person

=== confirm_export ===
Good. Put that in writing so I have a record, and I will sign it off.
~ se_influence(5, "pretextRelevant")
#compose_reply:wexley_followup
-> DONE

=== wrong_person ===
No problem, I will ignore it then.
~ se_influence(-5, "senderTrust")
-> DONE
