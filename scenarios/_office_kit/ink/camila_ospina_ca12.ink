VAR kit_ca12_visitor_there = false
VAR kit_ca12_door_choice = ""

// Holding knot. She stands here until she reaches the door; her start diverts to ca12_door
// once kit_ca12_visitor_there is true (a dropped bark or a reload still lands on the question).
=== start ===
{ kit_ca12_visitor_there:
    -> ca12_door
}
Camila Ospina: Hi. Just waiting for someone, thanks.
-> bye

// The door question. A bark's knot sticks, so a second entry replays her reply and never re-answers.
=== ca12_door ===
{ kit_ca12_door_choice == "reception":
    Camila Ospina: Oh, of course. Thanks, I'll do that.
    -> bye
}
{ kit_ca12_door_choice == "letin":
    Camila Ospina: Lovely, thanks. I'll find her myself.
    -> bye
}
{ kit_ca12_door_choice == "silent":
    Camila Ospina: Sorry, I'll try the desk.
    -> bye
}
Camila Ospina: Hi, I'm Camila, here for Yasmin Chaudhry. She said to come straight up.
{ kit_ca12_door_choice == "":
    ~ kit_ca12_door_choice = "asked"
}
+ [Reception's just through there. They'll sign you in.]
    ~ kit_ca12_door_choice = "reception"
    Camila Ospina: Oh, of course. Thanks, I'll do that.
    -> bye
+ [Of course, go on through.]
    ~ kit_ca12_door_choice = "letin"
    Camila Ospina: Lovely, thanks. I'll find her myself.
    -> bye
+ [\[Say nothing\]]
    ~ kit_ca12_door_choice = "silent"
    Camila Ospina: Sorry, I'll try the desk.
    -> bye

=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
