// Graham Whitfield, IT (Terminal showcase). share_screen gives the assist code once.
// graham_assist_given is a scenario global; the code is in his itemsHeld.

VAR graham_assist_given = false
// met_graham: ink-local first-meeting flag.
VAR met_graham = false

=== start ===
{ met_graham:
    # speaker:npc
    Go on, then.
    -> hub
}
~ met_graham = true
# speaker:npc
Now then. You'll be the visitor Ama mentioned.
-> hub

=== hub ===
- (choices)
+ { not graham_assist_given } [Could you share your screen with me?]
    -> share_screen
+ { graham_assist_given } [Where do I use the code?]
    # speaker:npc
    Connect it from your inventory. It shows you my screen for as long as I let it.
    -> choices
+ [What do you keep an eye on?]
    # speaker:npc
    The network, mostly. The file server and the backup PC.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Right you are.
    # exit_conversation
    -> END

=== share_screen ===
~ graham_assist_given = true
#set_global:graham_assist_given:true
#give_item:text_file:graham_assist_code
# speaker:npc
Aye, go on. That's my assist code. Connect it from your inventory.
# speaker:npc
You'll see what I see. Don't be long.
-> hub
