VAR hax_note_had = false

=== start ===
-> hub

=== hub ===
Probe handler here.
+ {not hax_note_had} [Send me the probe note.]
    #give_item:notes:hax_note
    Sent.
    -> hub
+ [Bye.]
    #exit_conversation
    Bye.
    -> hub
