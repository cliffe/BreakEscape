// Keith Dando, night security officer, West Country. A hub only; the staff-room exchanges
// (waiting, job called, job cleared) live in jodie.ink, which sorts first (SIMS-4, plan 3.4).

=== start ===
# speaker:npc
Evening. Keith, night security. I'm parked here till the radio wants me.
-> hub

=== hub ===
+ [Quiet night?]
    # speaker:npc
    So far. I like it dull, me. Dull means nobody's broke in.
    -> hub
+ [What do you look after?]
    # speaker:npc
    The whole site after hours. Doors, cameras, the odd alarm.
    -> hub
+ [Waiting on the radio?]
    # speaker:npc
    Always. Jodie and me take our breaks while it's slow.
    -> hub
+ [How's the tea?]
    # speaker:npc
    Boiler does a proper brew. Best thing about nights, that.
    -> hub
+ [I'll let you get on.] #exit_conversation
    # speaker:npc
    Right you are. Mind how you go.
    -> hub
