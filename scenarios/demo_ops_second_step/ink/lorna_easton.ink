// Lorna Easton, receptionist. Short staff chat; she never approves a request she did not make.
VAR met_lorna = false

=== start ===
{ met_lorna:
    -> hub
}
~ met_lorna = true
# speaker:npc
Morning. Reception is mine, so mind the desk.
-> hub.choices

=== hub ===
# speaker:npc
Anything I can help with?
- (choices)
+ [Do you answer sign-in requests on your phone?]
    # speaker:npc
    Only ones I started myself.
    # speaker:npc
    If it pops up and it wasn't me, I ignore it and tell IT.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Thanks.
    # exit_conversation
    -> END
