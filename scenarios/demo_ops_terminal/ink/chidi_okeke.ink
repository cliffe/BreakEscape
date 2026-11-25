// Chidi Okeke, office worker (Terminal showcase). Short hub; no consequence.
// met_chidi: ink-local first-meeting flag.
VAR met_chidi = false

=== start ===
{ met_chidi:
    -> hub
}
~ met_chidi = true
# speaker:npc
Hiya. Can't stop long, I've a report due.
-> hub

=== hub ===
# speaker:npc
Still here, still busy.
- (choices)
+ [Is the network slow for you too?]
    # speaker:npc
    Only since about seven. Graham says it's nothing.
    -> choices
+ [What's the engineer doing in the server room?]
    # speaker:npc
    Setting up remote support, I think. Zainab. She never stops for a chat.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Cheers.
    # exit_conversation
    -> END
