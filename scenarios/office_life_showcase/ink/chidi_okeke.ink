// Chidi Okeke, office worker. Five-line staff chat (neil.ink reopen pattern).
// One flavour topic (lock habit), no variable, no consequence.

// met_chidi: ink-local VAR so the first-meeting line plays once; a re-talk (after
// an ended story or a reload) opens at the hub reopen line. See ama_owusu.ink.
VAR met_chidi = false

=== start ===
{ met_chidi:
    -> hub
}
~ met_chidi = true
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
