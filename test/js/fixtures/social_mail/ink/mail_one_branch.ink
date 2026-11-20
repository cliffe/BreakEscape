// Fault: se_influence only on the landing branch.
VAR pierce_influence = 0
VAR email_landed = false

EXTERNAL se_influence(delta, reason)
=== function se_influence(delta, reason) ===
~ return 0

=== on_email ===
{ email_landed:
    Thanks.
    ~ se_influence(10, "senderTrust")
  - else:
    Who is this?
}
-> DONE
