=== start ===
# speaker:npc
I'm on patrol, monitoring the ward. Everything looks routine.
-> hub

=== hub ===
* [How often do you do a full circuit?]
    -> patrol_info
+ [I won't keep you from your rounds.] #exit_conversation
    # speaker:npc
    Understood. Stay safe out there.
-> hub

=== patrol_info ===
# speaker:npc
We do a full loop every few minutes — three checkpoints each cycle.
-> hub

=== patrol_idle ===
# speaker:npc
I'm on patrol, monitoring the ward.
-> hub

=== emergency_response ===
# speaker:npc
Emergency response engaged. I'm diverting to the emergency station immediately.
-> hub
