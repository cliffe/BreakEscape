// Chidi Okeke, office worker. Five-line staff chat (neil.ink reopen pattern).
// One flavour topic (lock habit), no variable, no consequence.

=== start ===
# speaker:npc
Hiya. Can't stop long, I've a report due.
-> hub.choices

=== hub ===
# speaker:npc
Still here, still busy.
- (choices)
+ [Do you always lock your screen?]
    # speaker:npc
    If I'm away for more than ten seconds, yes.
    # speaker:npc
    That's long enough for someone to have a nose.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Cheers.
    # exit_conversation
    -> END
