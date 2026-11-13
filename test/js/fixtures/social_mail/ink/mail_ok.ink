// Fixture for validator-social-mail: a well-formed character email story.
VAR pierce_influence = 0
VAR email_landed = false
VAR email_first_fail = ""
VAR email_claimed_sender = ""

EXTERNAL se_influence(delta, reason)
=== function se_influence(delta, reason) ===
~ return 0

=== on_email ===
{ email_landed:
    Thanks, opening it now. {email_claimed_sender}
    ~ se_influence(10, email_claimed_sender)
    #set_global:phish_pierce_landed:true
  - else:
    I'm not expecting this: {email_first_fail}
    ~ se_influence(-10, email_first_fail)
}
-> give_more

=== give_more ===
Could you confirm what this is about?
#compose_reply:pierce
-> DONE
