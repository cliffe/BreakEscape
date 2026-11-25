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
+ [Is the network slow for you too?]
    # speaker:npc
    Only since about seven. Graham says it's nothing.
    -> choices
+ [Who sits at the hot desk?]
    # speaker:npc
    Jun, mostly. The network port there is live, which is handy for laptops.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Cheers.
    # exit_conversation
    -> END
