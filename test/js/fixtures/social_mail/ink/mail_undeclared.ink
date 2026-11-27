// Fault: on_email reads email_urgency and email_attachment but declares neither.
VAR pierce_influence = 0
VAR email_landed = false

EXTERNAL se_influence(delta, reason)
=== function se_influence(delta, reason) ===
~ return 0

=== on_email ===
{ email_landed:
    Urgency was {email_urgency}.
    ~ se_influence(10, "x")
  - else:
    The {email_attachment} did not fit.
    ~ se_influence(-10, "attachmentPlausible")
}
-> DONE
