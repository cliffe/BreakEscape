// Agnieszka Duda, office worker. Five-line staff chat (neil.ink reopen pattern).
// One flavour topic (clearing the mugs), no variable, no consequence.

=== start ===
# speaker:npc
Hi. Somebody has to keep this place tidy.
-> hub.choices

=== hub ===
# speaker:npc
Yes? Just tidying.
- (choices)
+ [Why do you clear the mugs?]
    # speaker:npc
    Because nobody else will.
    # speaker:npc
    If I see dirty mugs, I can't leave them. It's a habit.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    See you.
    # exit_conversation
    -> END
