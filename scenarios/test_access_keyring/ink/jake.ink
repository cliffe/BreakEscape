VAR hub_quiet = false
VAR jake_assist_given = false // Synced scenario global, set by the code's onPickup
VAR jake_contract_read = false // Synced scenario global, set when vendor_contract.txt is opened
VAR jake_ended_assist = false // Synced scenario global: the invite is over
VAR posed_helpdesk = false
VAR got_suspicious = false

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
+ {not posed_helpdesk and not jake_assist_given} [This is the helpdesk. I need to join your session.]
    -> helpdesk
+ {jake_contract_read and not jake_ended_assist and not got_suspicious} [Thanks, that's all I needed.]
    -> suspicious
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Cheers.
    -> hub

=== helpdesk ===
~ posed_helpdesk = true
# speaker:npc
Helpdesk? Right, I was expecting someone. Here, that's my remote assist code. Don't be long.
#give_item:text_file:jake_assist_code
# speaker:npc
Join me from your end and you'll see what I see.
-> hub

=== suspicious ===
~ got_suspicious = true
# speaker:npc
Hang on. Helpdesk doesn't usually stay on after the fix. Who did you say you were?
#set_global:jake_ended_assist:true
# speaker:npc
I'm ending that session. Ring me back through the proper number.
-> hub
