// Agnieszka Duda, office worker (recon showcase). Short hub; no consequence.
// met_agnieszka: ink-local first-meeting flag (see ama_owusu.ink).
VAR met_agnieszka = false

=== start ===
{ met_agnieszka:
    -> hub
}
~ met_agnieszka = true
# speaker:npc
Hi. I'm Agnieszka. The printer's mine, more or less.
-> hub

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
+ [Do you use the printer much?]
    # speaker:npc
    All day. When it's off I have to wait, and I don't like waiting.
    # speaker:npc
    Whoever set it up did it from my PC, and nobody's touched it since.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    See you.
    # exit_conversation
    -> END
