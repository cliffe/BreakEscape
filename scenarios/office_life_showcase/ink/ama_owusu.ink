// Office Life Tour host: Ama Owusu (person, office aisle).
// S1 skeleton: start, hub and exit only. Act-turn, hint, lunch and recap
// choices come in later slices. Reopen pattern from test_needs_sims/neil.ink:
// start diverts to hub.choices; hub has a reopen line; exit uses
// # exit_conversation then -> END. reopenRefreshesHub is set on her NPC block.

=== start ===
# speaker:npc
Today you watch an office instead of breaking into one.
# speaker:npc
Everyone here is driven by something. Start with the coffee machine.
-> hub.choices

=== hub ===
# speaker:npc
What can I help with?
- (choices)
+ [I'll have a look round.]
    # speaker:npc
    Go on. I'll be here.
    # exit_conversation
    -> END
