EXTERNAL ext_check()
=== function ext_check() ===
~ return 0

=== k2 ===
Okay.
{ext_check() > 0: -> gone}
+ [x] -> k2
=== gone ===
#give_item:secret
#exit_conversation
-> END
