INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: Dr. James Mercer, the server hall (group C). US English.
// NPC id mercer (currentKnot hall). At large from m07: one line, then hostile.
// SE §3.6's "agent" is dropped: nobody but HaX and Tesseract names the player.

VAR merc_quiet = false

=== start ===
-> hall

=== hall ===
{merc_quiet:
    ~ merc_quiet = false
- else:
    #hostile:mercer
    Dr. James Mercer: When the fourth submission is declined, somebody does this.
}
+ [(Back off.)]
    ~ merc_quiet = true
    #exit_conversation
    -> hall
