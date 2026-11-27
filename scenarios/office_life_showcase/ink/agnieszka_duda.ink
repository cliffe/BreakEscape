// Agnieszka Duda, office worker. Five-line staff chat (neil.ink reopen pattern).
// One flavour topic (clearing the mugs), no variable, no consequence.

// met_agnieszka: ink-local VAR so the first-meeting line plays once; a re-talk (after
// an ended story or a reload) opens at the hub reopen line. See ama_owusu.ink.
VAR met_agnieszka = false

=== start ===
{ met_agnieszka:
    -> hub
}
~ met_agnieszka = true
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
