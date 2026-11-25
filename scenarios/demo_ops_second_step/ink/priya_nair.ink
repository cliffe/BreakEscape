// Priya Nair, IT service desk (call_desk). She sits by Thandiwe in the IT room.
// Meeting her once makes the desk serve the phone-call route; her line teaches the call-back rule.
VAR met_priya = false

=== start ===
{ met_priya:
    -> hub
}
~ met_priya = true
# speaker:npc
Priya Nair, IT service desk. I take the ones that come in by phone.
-> hub.choices

=== hub ===
# speaker:npc
Can I help?
- (choices)
+ [How does the phone line work?]
    # speaker:npc
    Ring it and we'll move an account's approvals. We call the number we hold for them back, to check it's really them.
    -> choices
+ [Nothing, thanks.]
    # speaker:npc
    Right you are.
    # exit_conversation
    -> END
