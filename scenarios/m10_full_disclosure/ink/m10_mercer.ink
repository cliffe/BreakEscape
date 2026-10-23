INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: Dr. James Mercer, the server hall (group C). US English.
// NPC id mercer (currentKnot hall). At large from m07.
// SE §3.6's "agent" is dropped: nobody but HaX and Tesseract names the player.
// Blind fix pass F1: no hostile tag. The player chooses: leave him, or tell him
// to move. He won't move, and the fight starts only if the player strikes him
// (the engine turns a struck NPC hostile), after the talk has closed.

VAR merc_quiet = false
VAR merc_seen = false

=== start ===
-> hall

=== hall ===
{
- merc_quiet:
    ~ merc_quiet = false
- merc_seen:
    Dr. James Mercer: Still here. So is the console.
- else:
    ~ merc_seen = true
    Dr. James Mercer: When the fourth submission is declined, somebody does this.
}
+ [(Back off. Leave him to his console.)]
    Dr. James Mercer: Sensible. Use it if you must. I'm watching the numbers, not you.
    ~ merc_quiet = true
    #exit_conversation
    -> hall
+ [Step away from the console, Doctor.]
    Dr. James Mercer: No. If you want me off it, you'll have to put me off it.
    ~ merc_quiet = true
    #exit_conversation
    -> hall
