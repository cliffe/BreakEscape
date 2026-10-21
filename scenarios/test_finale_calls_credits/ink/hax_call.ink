// test_finale_calls_credits: a forced call that resumes at the unanswered choice.
VAR call_started = false
VAR call_done = false
VAR hax_trusted = false
VAR teaser_enabled = false

=== hub ===
+ [Anything else?]
    Agent HaX: Nothing yet.
    -> hub

=== forced_call ===
~ call_started = true
Agent HaX: You ran this mostly solo.
Agent HaX: Don't hang up. First question.
Director Netherton: Put her on when she's done.
* [I trust you.]
    ~ hax_trusted = true
    Agent HaX: Good. Second question.
    -> second
* [Make it quick.]
    Agent HaX: Fine. Second question.
    -> second

= second
* [Roll the credits.]
    Agent HaX: That's all I needed.
    ~ call_done = true
    #exit_conversation
    -> DONE
