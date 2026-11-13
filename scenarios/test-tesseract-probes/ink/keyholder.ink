VAR kh_opened = false
VAR kh_greeted = false

=== start ===
#speaker:keyholder
> DEVICE ACTIVE
PROBE: phone device opened from inventory. Hello, agent.
#set_global:kh_greeted:true
* [Okay.]
    -> hub

=== hub ===
+ [Ping.]
    PONG.
    -> hub

=== relay_call ===
#speaker:keyholder
PROBE: video call fired by global_variable_changed:relay_opened.
* [Understood.]
    #set_global:call_seen:true
    #exit_conversation
    -> hub
