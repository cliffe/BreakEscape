INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: Dr Abena Asante, the server hall (group C). South London.
// NPC id asante (currentKnot hall). C7 (MC §4): optional information.
// On server_hall_warned (Wendell's call) she won't talk.

VAR asan_quiet = false     // skip the re-entry line once after an exit
VAR asan_seen = false      // the opener has played
VAR asan_wrote = false     // she has said she wrote it
VAR asan_shown = false     // she has shown the schedule

=== start ===
-> hall

=== hall ===
{server_hall_warned:
    -> warned
}
{asan_quiet:
    ~ asan_quiet = false
    -> hall_menu
}
{asan_seen:
    Dr Abena Asante: {&Still here? Ask, then.|I've got a release to babysit. What is it?}
    -> hall_menu
}
~ asan_seen = true
Dr Abena Asante: You're the one off the office wall. Don't touch my console and we'll get on.
-> hall_menu

=== hall_menu ===
+ {not asan_wrote} [Who built this release?]
    ~ asan_wrote = true
    Dr Abena Asante: I wrote it. I'd write it again.
    Dr Abena Asante: Every vendor patches in a week, because they have to. You lot have been asking nicely for thirty years.
    -> hall_menu
+ {not asan_shown} [Show me the schedule.]
    ~ asante_outcome = "talked"
    ~ asan_shown = true
    Dr Abena Asante: You'll read it anyway. There. First entries by city, and what goes in each.
    Dr Abena Asante: I don't hide my work. That's the whole point of it.
    -> hall_menu
+ {casualty_sheet_read and not asante_confirmed_sheet} [A.A. in the margin of his casualty sheet. That's you.]
    ~ asante_confirmed_sheet = true
    ~ asante_outcome = "talked"
    Dr Abena Asante: I corrected his sums. He thanked me. *pause* That's between him and the sums.
    -> hall_menu
+ [That's all.]
    Dr Abena Asante: Good. Mind the cables on your way out.
    ~ asan_quiet = true
    #exit_conversation
    -> hall

// Wendell's call went through the switchboard: she won't talk.
=== warned ===
{asan_quiet:
    ~ asan_quiet = false
- else:
    Dr Abena Asante: Somebody rang the switchboard about a raid. I've nothing to say to you.
}
+ [Suit yourself.]
    Dr Abena Asante: I will.
    ~ asan_quiet = true
    #exit_conversation
    -> warned
