=== start ===
# speaker:npc
I'm resting here. The medication seems to be helping.
-> hub

=== hub ===
* [How are you feeling?]
    -> feeling_check
+ [I hope you feel better soon.] #exit_conversation
    # speaker:npc
    Thank you. I appreciate it.
-> hub

=== feeling_check ===
# speaker:npc
A bit tired, but managing. The nurses have been checking in regularly.
-> hub

=== stable ===
# speaker:npc
I'm resting now. The medication is helping.
-> hub

=== alert_state ===
# speaker:npc
Something's wrong, please help! I don't feel right.
-> hub

=== critical_state ===
# speaker:npc
I can't breathe properly! Someone help me right now!
-> hub
