// test_dm_social: a judged DM with The Rookery's secretary, Dom. Reached from the Friendface
// app's contact list (the contact carries callId guest_list_chat), so opening it runs the
// pretext mechanic with its suspicion meter, exactly as a desk-phone call would, but with the
// chat wording. Mundane: talking your way onto a members' club guest list for Saturday.
// person-chat-pretext binds the real pretext_say / pretext_ask; the fallbacks below load the
// story unbound (00 S1). TEST-ONLY ids. Call knots use sticky + choices only (06 N12).

EXTERNAL pretext_say(utterance_id)
EXTERNAL pretext_ask(ask_id)
VAR dom_influence = 0
VAR guest_list_added = false

=== function pretext_say(utterance_id) ===
~ return 0

=== function pretext_ask(ask_id) ===
~ return 0

=== start ===
Dom: Hi there, Dom from The Rookery here. What can I do for you?
-> hub

=== hub ===
+ [Hope you don't mind me messaging out of the blue.]
    -> reaction(pretext_say("open_polite"))
+ [One of your members suggested I get in touch.]
    -> reaction(pretext_say("member_ref"))
+ [I know Saturday is awfully short notice.]
    -> reaction(pretext_say("press_time"))
+ { not guest_list_added } [Could you put me on Saturday's guest list?]
    -> ask_reaction(pretext_ask("guest_list"), "guest_list")
+ [I'll leave it there, thanks Dom.]
    -> END

=== reaction(band) ===
{ band >= 3:
    Dom: I think I'd better run this past the committee first. Sorry.
    -> END
}
Dom: Right, I'm with you.
-> hub

=== ask_reaction(result, which) ===
{ result:
- 1:
    Dom: Go on then, you're on the list for Saturday. See you there.
- 2: Dom: Remind me who put your name forward?
- else: Dom: I can't add a name without a word from a member, I'm afraid.
}
-> hub
