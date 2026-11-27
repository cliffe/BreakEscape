// Julian Sallow, partner. Short staff chat. Names no password.
VAR met_julian = false

=== start ===
{ met_julian:
    -> hub
}
~ met_julian = true
# speaker:npc
Ah, the visitor. Keep it brief, I've a client lunch later.
-> hub.choices

=== hub ===
# speaker:npc
Quickly, then.
- (choices)
+ [How do you pick passwords?]
    # speaker:npc
    Long and random, from a password manager. I couldn't tell you one if you asked.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Good.
    # exit_conversation
    -> END
