// Chidi Okeke, office worker (recon showcase). Short hub; no consequence.
// met_chidi: ink-local first-meeting flag (see ama_owusu.ink).
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
+ [Do you always lock your screen?]
    # speaker:npc
    If I'm away for more than ten seconds, yes.
    # speaker:npc
    That's long enough for someone to have a nose.
    -> choices
+ [Who sits at the hot desk?]
    # speaker:npc
    Jun, mostly. The socket there is live, which is handy for laptops.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Cheers.
    # exit_conversation
    -> END
