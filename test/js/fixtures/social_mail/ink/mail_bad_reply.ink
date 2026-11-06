// Fault: #compose_reply names a non-target and a wrong-character target.
VAR lord_influence = 0
VAR email_landed = false
VAR email_first_fail = ""

EXTERNAL se_influence(delta, reason)
=== function se_influence(delta, reason) ===
~ return 0

=== on_email ===
{ email_landed:
    Fine.
    ~ se_influence(10, "x")
    #compose_reply:ghost_target
  - else:
    No.
    ~ se_influence(-10, email_first_fail)
    #compose_reply:pierce
}
-> DONE
