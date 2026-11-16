VAR hub_quiet = false
=== start ===
# speaker:npc
Jake Brooks, finance. My sign-in is in Lena's passwords file. Don't tell anyone.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [Why is your password in a file?]
    # speaker:npc
    Shared sign-ins. Convenient and terrible, all at once.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Cheers.
    -> hub
