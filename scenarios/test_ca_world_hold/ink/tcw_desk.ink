// Test fixture (E2): the desk clerk the call is made to. Plain test text, not teaching content.
// pretext-prep opens person-chat here; the real pretext_say / pretext_ask are bound by the
// engine. The fallbacks let the story load unbound on a preload or dry run.
EXTERNAL pretext_say(utterance_id)
EXTERNAL pretext_ask(ask_id)
VAR tcw_desk_influence = 0

=== function pretext_say(utterance_id) ===
~ return 0

=== function pretext_ask(ask_id) ===
~ return 0

=== start ===
Desk Clerk: Test line. Can I help you?
-> desk

=== desk ===
+ [Say hello.]
    -> reaction(pretext_say("say_hi"))
+ [Ask for the door to be opened.]
    -> ask_reaction(pretext_ask("open_door"))
+ [Never mind.]
    Desk Clerk: Test line. Bye.
    -> END

=== reaction(band) ===
{ band >= 3:
    -> END
}
Desk Clerk: Test line. Hello.
-> desk

=== ask_reaction(result) ===
{ result:
- 1:
    Desk Clerk: Test line. The door is open.
- 2:
    Desk Clerk: Test line. Who is it for?
- else:
    Desk Clerk: Test line. Not without a reason.
}
-> desk
