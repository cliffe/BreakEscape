=== start ===
# speaker:npc
Hiya. Don't mind me, I'm only thinking about lunch.
-> hub

=== hub ===
+ [What are you up to?]
    # speaker:npc
    Coffee first, then something to eat in the kitchen, then back to my desk.
    # speaker:npc
    If Amara's already at the coffee station I'll wait, or try the kitchen one.
    -> hub
+ [I'll let you get on.] #exit_conversation
    # speaker:npc
    Right you are.
    -> hub

// Slice 19 (OFFICE_LIFE_PLAN 12.5): half a desk-phone call, Tom's side only, played once by the
// needs system when he answers his own phone with the player in earshot. Never reached from the
// player's conversation. Every line is his own: no speaker prefixes.
=== call_supplier ===
Tom speaking. Oh, hiya, yes.
Tuesday's fine for the delivery.
No, the big boxes, not the small ones.
Twelve of them. Same as last time.
Lovely. Cheers, bye now.
-> DONE
