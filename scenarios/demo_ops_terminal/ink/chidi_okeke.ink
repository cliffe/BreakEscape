// Chidi Okeke, office worker (Terminal showcase). Short hub; no consequence.
// met_chidi: ink-local first-meeting flag.
VAR met_chidi = false

=== start ===
{ met_chidi:
    # speaker:npc
    Still here, still busy.
    -> hub
}
~ met_chidi = true
# speaker:npc
Hiya. Can't stop long, I've a report due.
-> hub

=== hub ===
- (choices)
+ [Is the network slow for you too?]
    # speaker:npc
    Only since about seven. Graham says it's nothing.
    -> choices
+ [What's the engineer doing in the server room?]
    # speaker:npc
    Zainab, from Fenlow. She never stops for a chat.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Cheers.
    # exit_conversation
    -> END
