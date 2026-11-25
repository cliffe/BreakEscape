// Jun Watanabe, office worker at the hot desk (recon showcase). Short hub; no consequence.
// met_jun: ink-local first-meeting flag (see ama_owusu.ink).
VAR met_jun = false

=== start ===
{ met_jun:
    -> hub
}
~ met_jun = true
# speaker:npc
Morning. Mind the cable, it's the hot desk.
-> hub

=== hub ===
# speaker:npc
Yes?
- (choices)
+ [Is this desk yours?]
    # speaker:npc
    Whoever gets in first. I just like the window.
    # speaker:npc
    I leave my things here when I go for coffee. I'd notice someone at my desk.
    -> choices
+ [What's the port by your desk for?]
    # speaker:npc
    The one by my feet? It's a live network port. Anyone can plug a laptop in.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Right, ta.
    # exit_conversation
    -> END
