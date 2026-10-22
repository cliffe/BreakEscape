INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: Sione Fonoti, the lock guard (group C). US English (Utah);
// big, slow to speak, polite. NPC id lock_guard (currentKnot talk). OT §4.5.
// `talk`: one option per route that named him; the first three give the card.
// `challenge`: opened by his player_spotted mapping as the cracker closes.
// His two barks are JSON.

VAR fon_quiet = false       // skip the re-entry line once after an exit
VAR fon_card_given = false  // he has handed over (or stood down without) the card
VAR fon_shift_used = false  // "Shift change" has been tried at the challenge

=== start ===
-> talk

// ---------------------------------------------------------------
// A click on him: polite, slow. One option per naming route.
// ---------------------------------------------------------------
=== talk ===
{fon_quiet:
    ~ fon_quiet = false
- else:
    {
    // Dialogue R1 m5: no card to hand over once the lock is open.
    - outer_lock_open:
        Sione Fonoti: Door's open, so I guess my shift's done. Go on through.
    - fon_card_given:
        Sione Fonoti: I'm off shift, far as I'm concerned. Go on through.
    - else:
        Sione Fonoti: Evening. Nobody comes up the stair this late. They told me one would, and not why.
    }
}
+ {not fon_card_given and not outer_lock_open and gallery_rota_read} [The rota says you carry the card.]
    ~ fon_card_given = true
    #give_item:notes:gallery_code_card
    Sione Fonoti: It does, huh. *slowly* Okay. It's only a card. Here.
    -> talk
+ {not fon_card_given and not outer_lock_open and ghost_gift == "card"} [Ghost says you'll want to be off shift.]
    ~ fon_card_given = true
    #give_item:notes:gallery_code_card
    Sione Fonoti: I don't know any Ghost. But I'd like to be off shift. Take it.
    -> talk
+ {not fon_card_given and not outer_lock_open and victoria_gallery == "walked"} [Sterling sent me.]
    ~ fon_card_given = true
    #give_item:notes:gallery_code_card
    Sione Fonoti: The lady in the good coat. She walked right past me. Here, then.
    -> talk
+ {not fon_card_given and not outer_lock_open and vos_outcome == "bought"} [Vos sold you out.]
    ~ fon_card_given = true
    Sione Fonoti: The Dutch guy. Figures. You've got his card, so you don't need mine. I'll stand over here.
    -> talk
+ [Never mind.]
    Sione Fonoti: Sure. Mind the grating by the stair. It's loose.
    ~ fon_quiet = true
    #exit_conversation
    -> talk

// ---------------------------------------------------------------
// The challenge, as the cracker closes inside his cone.
// "Shift change" works once; anything else, or a second try, turns him.
// ---------------------------------------------------------------
=== challenge ===
~ lock_guard_challenged = true
{fon_shift_used:
    #hostile:lock_guard
    Sione Fonoti: You told me that one already.
    ~ fon_quiet = true
    #exit_conversation
    -> talk
}
Sione Fonoti: Hey. That's the core door. Who said you could open it?
+ [Shift change. Orders from upstairs.]
    ~ fon_shift_used = true
    Sione Fonoti: Nobody tells me anything. *slowly* Okay. Go on.
    ~ fon_quiet = true
    #exit_conversation
    -> talk
+ [I don't answer to you.]
    #hostile:lock_guard
    Sione Fonoti: Then I'm going to have to stop you. Sorry.
    ~ fon_quiet = true
    #exit_conversation
    -> talk
