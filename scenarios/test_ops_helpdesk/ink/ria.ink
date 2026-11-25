VAR helpdesk_it_desk_result = ""
VAR hub_quiet = false
=== start ===
# speaker:npc
Ria Vance, service desk.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [Ask for an account reset]
    -> request
+ [Nothing, thanks.] #exit_conversation
    # speaker:npc
    Right.
    -> hub

=== request ===
~ helpdesk_it_desk_result = ""
# speaker:npc
Fill in the form and I will look at it. #helpdesk_request:it_desk
-> verdict

=== verdict ===
{
- helpdesk_it_desk_result == "granted":
    # speaker:npc
    That matches our records.
- helpdesk_it_desk_result == "refused":
    # speaker:npc
    I can't verify you.
- helpdesk_it_desk_result == "blocked":
    # speaker:npc
    I can't take more requests for that account just now.
- else:
    # speaker:npc
    I can't do that one.
}
-> hub
