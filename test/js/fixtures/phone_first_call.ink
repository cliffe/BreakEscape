// Fixture for test/js/phone-reopen-and-persistence.test.mjs: shaped like m02's
// HaX phone. The scenario's currentKnot is first_call, but only `start` clears
// first_contact; the hub's exit runs to DONE.
VAR first_contact = true

=== start ===
{first_contact:
    ~ first_contact = false
    -> first_call
}
-> hub

=== first_call ===
Agent: You're in. Good.
Agent: Front desk first.
+ [Understood]
    -> hub

=== hub ===
+ [Got any advice?]
    Agent: Keep your head down.
    -> hub
+ [I'm good for now]
    Agent: Copy that.
    #exit_conversation
    -> DONE

=== other_intro ===
Agent: A different opening.
-> hub
