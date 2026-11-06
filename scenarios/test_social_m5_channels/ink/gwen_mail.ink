// Test fixture (M5): the email-channel story for Gwen, who is only here to be locked out.
VAR gwen_influence = 0
EXTERNAL se_influence(delta, reason)

VAR email_landed = false
VAR email_opened = true
VAR email_first_fail = ""
VAR email_attachment = "none"

=== function se_influence(delta, reason) ===
~ return 0

=== on_email ===
{ not email_opened:
    -> DONE
}
{ email_landed:
    Thanks, I'll take a look.
    ~ se_influence(10, "senderTrust")
    #set_global:phish_gwen_landed:true
    -> DONE
}
I don't know who this is.
~ se_influence(-10, "senderTrust")
-> DONE
