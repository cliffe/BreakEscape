// Office Life Tour host: Ama Owusu (person, office aisle).
// S2 adds the morning hub: the looking-at choice, the morning hints and the
// cooler follow-up. Act-turn, lunch and recap choices come in later slices. Reopen pattern from test_needs_sims/neil.ink:
// start diverts to hub.choices; hub has a reopen line; exit uses
// # exit_conversation then -> END. reopenRefreshesHub is set on her NPC block.

// heard_exchange_cooler_chat is a scenario global, synced into this VAR when the
// conversation starts; the engine sets it when the cooler exchange has played.
VAR heard_exchange_cooler_chat = false

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
* [What am I looking at?]
    # speaker:npc
    Each person has needs: coffee, water, food, company, work. They run down over time.
    # speaker:npc
    When one runs low, they go to whatever fills it. That's an affordance.
    -> choices
+ [What should I try next?]
    # speaker:npc
    Wait for the coffee run. One person at a time; the rest queue.
    # speaker:npc
    They come back every few minutes. Switch it off at the wall socket while they're queued.
    # speaker:npc
    Before you open the kitchen, note the mugs on the floor. Someone dislikes them.
    # speaker:npc
    Then open the kitchen door and hang about by the water cooler.
    -> choices
+ { heard_exchange_cooler_chat } [What was that at the cooler?]
    # speaker:npc
    This is an exchange. Two people at the same machine can have one set conversation.
    # speaker:npc
    They have it once, and only if you're close enough to hear.
    -> choices
+ [I'll have a look round.]
    # speaker:npc
    Go on. I'll be here.
    # exit_conversation
    -> END
