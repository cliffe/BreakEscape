=== start ===
# speaker:npc
Oh, hi. Sorry, I'm in the middle of something.
-> hub

=== hub ===
+ [What are you up to?]
    # speaker:npc
    Working at my own desk. I'd rather not borrow anyone else's.
    # speaker:npc
    Later I'll grab some food and have a chat by the water cooler.
    -> hub
+ [I'll let you get on.] #exit_conversation
    # speaker:npc
    Thanks.
    -> hub

// Slice 15 (OFFICE_LIFE_PLAN 11.4): a scripted exchange, played once by the needs system when
// Sanjay and Rosa chat and the player is in earshot. Never reached from the player's conversation.
=== exchange_rosa_rota ===
Sanjay: Have you seen the new kitchen rota?
Rosa: I wrote it. Is something wrong with it?
Sanjay: I'm on fridge duty two weeks running.
Rosa: Ah. Swap with Tom, he owes you one.
Sanjay: Fair enough. I'll ask him.
-> DONE
