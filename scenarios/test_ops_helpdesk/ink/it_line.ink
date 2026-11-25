VAR it_line_influence = 0
EXTERNAL pretext_ask(ask_id)

=== function pretext_ask(ask_id) ===
// Fallback only: a dry run or preload has no binding. The real binding returns 0 refused, 1 granted, 2 needs checking.
~ return 0

=== start ===
IT service line.
-> desk

=== desk ===
+ [Request a reset]
    -> ask_reaction(pretext_ask("reset_request"))
+ [Hang up] #exit_conversation
    -> END

=== ask_reaction(result) ===
{ result == 1:
    Right, here is the form.
- else:
    I can't help with that on this line.
}
-> desk
