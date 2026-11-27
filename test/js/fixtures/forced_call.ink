// Fixture for test/js/finale-forced-call-and-closing-card.test.mjs: a forced phone
// call with two questions. call_started is set at the top, call_done on the last line.
VAR call_started = false
VAR call_done = false

=== hub ===
+ [Anything else?]
    Agent: Nothing yet.
    -> hub

=== forced_call ===
~ call_started = true
Agent: Don't hang up. First question.
* [Answer one]
    Agent: Good. Second question.
    -> second
* [Other answer one]
    Agent: Fine. Second question.
    -> second

= second
* [Answer two]
    Agent: That's all I needed.
    ~ call_done = true
    #exit_conversation
    -> DONE
