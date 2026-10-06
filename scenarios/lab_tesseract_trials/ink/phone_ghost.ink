// ================================================
// The Keyholder Trials: Ghost, contact name "Keyholder", on the Keyholder device
// (terminal-themed phone) and on the video call at the relay terminal.
//
// Routing (DESIGN section 8, "The Keyholder ink"; N1, R3-1, R3-3, R3-4):
//  - a reopened phone resumes at the knot holding its choices, so every knot
//    the device can rest on (waiting, the_offer_again, closed) routes on state
//    at its top, and so do start, the_offer_call and the_offer;
//  - the video call targets the_offer_call, which sets on_call so call-only
//    stage lines show; route and start clear it for the device;
//  - every global the router reads is declared below, so a change re-runs it;
//  - ghost_offer_made is set when the offer starts (the call has happened);
//    ghost_offer_heard only on its last line. A call closed early leaves
//    ghost_offer_heard false, so the device delivers the whole offer (fix round 1,
//    PLAYTEST_P3 M1). It must be a global: the device restores its own saved
//    story, so ink-local values from the call never reach it;
//  - parked (ink-local) skips a resting knot's greeting once when the player has
//    just closed the conversation, so the farewell isn't followed by a greeting
//    (fix round 1, REVIEW_IMPL M1, m9).
// Lines never start with ">" (the terminal theme adds its own prompt, E2).
// No knot ends in DONE or END.
// ================================================

// Synced scenario globals
VAR decision_made = false
VAR ghost_offer_made = false
VAR ghost_offer_heard = false
VAR relay_opened = false
VAR ghost_greeted = false
VAR ending = ""
VAR megan_choice = ""
VAR lockbox_open = false
VAR locker_open = false
VAR guest_terminal_open = false
VAR corridor_open = false
VAR library_open = false
VAR special_collections_open = false
VAR pigeonholes_open = false
VAR drop_box_open = false
VAR workshop_open = false

// Ink-local
VAR intro_done = false
VAR on_call = false
VAR parked = false

=== start ===
~ ghost_greeted = true
#set_global:ghost_greeted:true
~ on_call = false
-> route

=== route ===
~ on_call = false
{ decision_made: -> closed }
{ ghost_offer_heard: -> the_offer_again }
{ relay_opened or ghost_offer_made: -> the_offer }
{ not intro_done: -> intro }
-> waiting

=== intro ===
~ intro_done = true
#speaker:ghost
{ special_collections_open:
    DEVICE ACTIVE. Candidate. You left this in my box for most of the Trials. I watched all of them.
- else:
    DEVICE ACTIVE. Candidate. You opened a box most of your year walked past. The rest get harder.
}
I'll be watching. You won't see me do it.
-> waiting

=== waiting ===
{ decision_made or ghost_offer_made or relay_opened: -> route }
#speaker:ghost
{ parked:
    ~ parked = false
    -> waiting_choices
}
{
- drop_box_open:
    One more door. You have the key.
- pigeonholes_open:
    Your envelope's waiting. Only one key opens it.
- special_collections_open:
    A key word, then a key pair. Fewer than twenty of you will see the second.
- corridor_open:
    The corridor. Fewer candidates every hour.
- locker_open:
    Binary next. The basics are where most of them fall over.
- else:
    {&Still watching.|Two hundred and twelve candidates. I'd rather watch you than most of them.}
}
-> waiting_choices

= waiting_choices
* [Who are you?]
    -> who_reply
+ [Close the device.]
    ~ parked = true
    #exit_conversation
    DEVICE IDLE.
    -> waiting

=== who_reply ===
#speaker:ghost
The examiner. You'll meet me when you've earned it.
-> waiting

// ------------------------------------------------
// The offer. Entered by the video call (the_offer_call) or, if the call was
// lost, by the device's router.
// ------------------------------------------------
=== the_offer_call ===
{ ghost_offer_heard: -> route }
~ on_call = true
-> the_offer

=== the_offer ===
{ ghost_offer_heard: -> route }
~ ghost_offer_made = true
#set_global:ghost_offer_made:true
{ decision_made: -> closed }
#speaker:ghost
{ on_call:
    Narrator: The terminal text goes dark. A video window opens in its place: a hooded figure, backlit, the face held in shadow.
- else:
    CONTACT RESUMED.
}
Congratulations. You passed. All of them.
St Catherine's had forty-one cameras. I switched off the recorders, not the cameras. I watched you all night.
You still walk like you're expecting a door to be locked. Your CCTV screens said no signal. Mine didn't.
I told you at St Catherine's: no name. That hasn't changed. You can call me what your handler does: Ghost.
The last time I made you an offer, there was a ward in the next room. This one's simpler.
{ on_call:
    Narrator: Behind you, Dr Schreuders keeps soldering. He hasn't looked up.
}
-> offer_terms

=== offer_terms ===
#speaker:ghost
I know SAFETYNET sent you. That's the attraction. A recruit has to be smuggled in. A double agent is already inside.
SAFETYNET audits everyone and publishes nothing. I don't recruit talent. I recruit people who've shown me what they'll give up.
There's a report on that terminal. Send it to your handler the way you send everything. It's signed, so nobody improves it on the way.
Your handler's location is a number I can check.
{ ghost_greeted:
    That device has been in the same pocket as your phone since you took it out of my box. It listens.
    Everything you've said to your handler since, I've read.
- else:
    You left my device in the box. It doesn't matter.
    This building's network has been mine all week, and so has everything your phone said on it.
}
{ megan_choice == "warned":
    You warned the Oyelaran girl. Sentimental. It cost me a candidate, so it costs you nothing. Yet.
    Say no to me and you're the second this week. Miss Oyelaran was the first.
- else:
    Say no and you're the candidate who walked away. So is Miss Oyelaran. I don't keep one without the other.
}
And if that location turns out to be wrong, I'll know who told me, and I'll be making you a third offer.
~ ghost_offer_heard = true
#set_global:ghost_offer_heard:true
Send it and you start Monday.{ megan_choice != "warned": So does she.}
-> offer_hub

=== offer_hub ===
#speaker:ghost
{ decision_made: -> closed }
+ [What's in it?]
    Read it. You've earned the right to read anything I give you.
    -> offer_hub
+ [Could I change it first?]
    Change one character and the signature fails. Your handler would know someone had been at it. So would I.
    -> offer_hub
+ [I'll think about it.]
    Take your time. The relay closes when you leave the building. I don't.
    ~ parked = true
    #exit_conversation
    Your terminal's still open. Read what I gave you.
    -> the_offer_again
+ [No. Find another student.]
    -> refuse

=== the_offer_again ===
{ decision_made: -> closed }
#speaker:ghost
{ parked:
    ~ parked = false
- else:
    Back. So you've decided.
}
+ {not decision_made} [Sending it now.]
    -> send_says_go
+ {not decision_made} [No. Find another student.]
    -> refuse
+ [Still thinking.]
    ~ parked = true
    #exit_conversation
    Take as long as the building gives you.
    -> the_offer_again

=== send_says_go ===
#speaker:ghost
~ parked = true
#exit_conversation
Then send it. Your handler's phone, not this one. I'll know when it's opened.
-> the_offer_again

=== refuse ===
{ decision_made: -> closed }
#speaker:ghost
{ megan_choice == "warned":
    Noted. The second this week. Miss Oyelaran at least had the excuse of a conscience.
- else:
    Noted. Two hundred and twelve picked up a card, and you're the first to say no to me.
}
I'll put you in the column for it.
~ ending = "refused"
#set_global:ending:refused
#set_global:decision_made:true
~ decision_made = true
~ parked = true
#exit_conversation
CONTACT CLOSED.
-> closed

=== closed ===
#speaker:ghost
{ parked:
    ~ parked = false
- else:
    NO CARRIER.
}
+ [Close the device.]
    ~ parked = true
    #exit_conversation
    DEVICE IDLE.
    -> closed
