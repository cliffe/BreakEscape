// Niamh Doherty, reception temp. Short staff chat; the visitor desk account is hers.
VAR met_niamh = false

=== start ===
{ met_niamh:
    -> hub
}
~ met_niamh = true
# speaker:npc
Hi, I'm Niamh. I'm covering reception today.
-> hub.choices

=== hub ===
# speaker:npc
Can I help?
- (choices)
+ [What's the visitor desk for?]
    # speaker:npc
    Guests sign in there. I'm covering reception, so it's only a password for me, no phone needed.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Thanks.
    # exit_conversation
    -> END
