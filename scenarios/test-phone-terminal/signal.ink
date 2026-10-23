// ================================================
// test-phone-terminal: Signal (Terminal Phone)
// Anonymous encrypted contact. Short, terse lines.
// Tests: terminal theme typewriter animation, multi-line NPC output,
//        choices appearing after typing completes.
// ================================================

=== start ===
CONNECTION ESTABLISHED.
You found this channel.
Most don't.
-> hub

=== hub ===
+ [Who are you?]
    -> unknown_contact
+ [What do you want?]
    -> what_do_you_want

=== unknown_contact ===
Someone who knows what's really happening here.
Your handler isn't telling you everything.
Ask them about the Minsk operation.
+ [I'll look into it]
    Good.
    Come back when you have doubts.
    #exit_conversation
    -> hub
+ [Why should I trust you?]
    You shouldn't.
    Not yet.
    But you're here. That means something.
    #exit_conversation
    -> hub

=== attacker_contact ===
I see you found the terminal.
We should talk.
+ [Who is this?]
    You already know who this is.
    You just don't want to admit it yet.
    #exit_conversation
    -> hub

=== what_do_you_want ===
The same thing you want.
The truth.
This channel isn't secure enough for everything I need to tell you.
Come back when you're ready.
+ [Ready for what?]
    You'll know.
    You already have doubts. That's how it starts.
    #exit_conversation
    -> hub
