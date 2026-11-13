// Variant: on_email diverts to per-branch reply knots that call se_influence.
VAR pierce_influence = 0
VAR email_landed = false
VAR email_first_fail = ""

EXTERNAL se_influence(delta, reason)
=== function se_influence(delta, reason) ===
~ return 0

=== on_email ===
{ email_landed:
    -> landed_reply
  - else:
    -> failed_reply
}

=== landed_reply ===
Opening it now.
~ se_influence(10, "senderTrust")
-> DONE

=== failed_reply ===
Not for me: {email_first_fail}
~ se_influence(-10, email_first_fail)
-> DONE
