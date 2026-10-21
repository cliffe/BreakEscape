INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: Ghost on the duty handset (group C). Phone NPC ghost_phone.
// Home knot `start` is gated and silent. The voiced call is `ghost_call`
// (targetKnot, resume: true, disableClose: true; OT §4.2, CONTRACT §4).
// No narrator lines, no printed variables, no "Where were we." lines.
// The contact speaks with no prefix; HaX on the line is a second speaker.
// Every branch's last choice writes ghost_call_done.

VAR ghost_l_money = false    // the money miss has been tried
VAR ghost_l_threat = false   // the threat miss has been tried
VAR ghost_l_owned = false    // broken branch: the player has owned the broken deal

=== start ===
+ [(Put the handset down.)]
    #exit_conversation
    -> start

// ---------------------------------------------------------------
// The call. First lines write the defaults (MC §3.2).
// ---------------------------------------------------------------
=== ghost_call ===
{ghost_call_done:
    -> ghost_after
}
{
- (m02_ghost_deal_accepted and m02_exposed_hospital) or m02_ghost_deal_refused:
    ~ ghost_sale = "stopped"
- else:
    ~ ghost_sale = "selling"
}
~ ghost_gift = ""
{m02_ghost_deal_accepted and not m02_exposed_hospital and m02_ghost_keys_used:
    ~ ghost_watch_on_route = true
}
{
- m02_ghost_deal_accepted and m02_exposed_hospital:
    -> kept
- m02_ghost_deal_refused:
    -> refused
- else:
    -> selling
}

// Deal kept: a stance. The answer comes back as Ghost's 06:00 text (JSON).
=== kept ===
You kept your word. I keep mine. Nothing of mine is for sale tonight.
One question, and then I'm gone for good. Did the board ever thank you?
The cupboard on the west wall's yours when you've answered.
+ [No. That wasn't why.]
    ~ ghost_answer = "not_why"
    ~ ghost_call_done = true
    Good. It's a poor reason to do anything.
    -> kept_code
+ [They sent a card. Unsigned.]
    ~ ghost_answer = "card_unsigned"
    ~ ghost_call_done = true
    Unsigned. Then somebody was ashamed, which is a start.
    -> kept_code
+ [Ask them yourself.]
    ~ ghost_answer = "ask_them"
    ~ ghost_call_done = true
    I might. I've the time now.
    -> kept_code

= kept_code
#give_item:notes:ghost_cupboard_code
Four digits. The rota inside names the man with the card.
#exit_conversation
-> ghost_after

// Refused: the parley, and Ghost's question back. The answer picks the gift.
=== refused ===
I hope it's you leading it. I said so at the time, and here you are.
You turned me down. Why?
+ [I don't buy from people who hold hospitals.]
    ~ ghost_answer = "hospitals"
    ~ ghost_gift = "code"
    ~ ghost_call_done = true
    #give_item:notes:ghost_lock_code
    Then do this cleanly. Four digits, for the outer lock at the end of the gallery.
    Don't thank me. It's not for you.
    #exit_conversation
    -> ghost_after
+ [I didn't trust you to keep it.]
    ~ ghost_answer = "trust"
    ~ ghost_gift = "card"
    ~ lock_guard_known = true
    ~ ghost_call_done = true
    Then don't trust me. Check it. The one at the lock end. Fonoti.
    He carries the code card, and he'll want to be off shift.
    Don't thank me. It's not for you.
    #exit_conversation
    -> ghost_after

// ---------------------------------------------------------------
// Broken, unanswered, stranger: Ghost is selling the head start.
// Talk Ghost out of it (the hook), or bait the sale. No hang-up button.
// ---------------------------------------------------------------
=== selling ===
{
- m02_ghost_deal_accepted:
    We said we'd be watching. We were.
    You took my keys, and the papers never left that conference room.
- m02_completed:
    You never answered me. You'll want to now.
- else:
    You don't know me. That's rather the point.
}
Two hours' head start on everything in that bunker. Five buyers. One of them wants the hospitals.
It's my leaving fee. After tonight there's nobody here to find.
Agent HaX: Let it sell and you'll want the console for that share. It only does one.
-> selling_menu

=== selling_menu ===
+ {not ghost_l_money} [I'll pay you more.]
    ~ ghost_l_money = true
    Numbers are my department.
    -> selling_menu
+ {not ghost_l_threat} [We'll find you.]
    ~ ghost_l_threat = true
    You won't.
    -> selling_menu
+ {m02_ghost_deal_accepted and not ghost_l_owned} [I didn't keep it. I'm asking anyway.]
    ~ ghost_l_owned = true
    No. You didn't. That's the first honest thing anyone's said on this line.
    Go on, then. Ask.
    -> selling_menu
+ [You want your last job to be a hospital's worst day?]
    {m02_ghost_deal_accepted and not ghost_l_owned:
        -> hook_refused
    }
    -> hook_lands
+ [Sell it, then. I want to see who's buying.]
    ~ ghost_sale = "bait"
    ~ ghost_call_done = true
    Then watch. Five buyers, and not one of them knows you're in the room.
    It goes at four. Enjoy the view.
    #exit_conversation
    -> ghost_after

// Broken branch, before the player owns the deal: nothing moves.
=== hook_refused ===
Not from you. You don't get to ask me about hospitals.
-> selling_menu

=== hook_lands ===
~ ghost_sale = "stopped"
~ ghost_call_done = true
No. *pause* I'd rather not leave on that.
My share stays where it is. A clean exit, for once.
#exit_conversation
-> ghost_after

// After the call: no text, one way out. The handset's mapping is gated on
// !ghost_call_done, so the call itself never reopens.
=== ghost_after ===
+ [(Put the handset down.)]
    #exit_conversation
    -> ghost_after
