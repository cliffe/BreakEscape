// test_phone_calls, person NPC: the opening briefing (a scripted scene before the first ring)
// and the legacy debrief that a call hands over to.
=== briefing ===
Welcome. This is the opening briefing. Close it when you are done.
+ [Understood.]
    Good. A call will come in shortly.
    #exit_conversation
    -> DONE

=== debrief ===
Now the debrief. You came straight from the call.
+ [Understood.]
    Good. That is all.
    #exit_conversation
    -> DONE

=== start ===
Hello. I am the person to talk to.
+ [Hi.]
    Good to see you.
    -> DONE
