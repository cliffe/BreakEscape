VAR has_workstation = false
EXTERNAL player_name()

=== start ===
#speaker:tom
Tom here. Probe NPC.
-> hub

=== hub ===
+ [Give me the laptop.]
    -> give_laptop
+ [Give me a field note.]
    -> give_note
+ [Bye.]
    #exit_conversation
    -> hub

=== give_laptop ===
#speaker:tom
That one's yours.
#give_item:workstation:lab_laptop
#set_global:laptop_given:true
-> hub

=== give_note ===
#speaker:tom
Field note coming up.
#give_item:notes:field_note
-> hub
