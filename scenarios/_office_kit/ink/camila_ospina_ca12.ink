// Camila Ospina, the ca12 visitor (set-piece NPC, hidden at boot).
// She has no after-defend stub: by the time kit_defend_done is true in ca12 (kit_ep == "ca12")
// she has left the studio and is hidden, so no learner can click her.
VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_ca12_visitor_there = false
// Synced scenario global: the set piece's V6 and door tail write it; Lorna's recap reads it
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
    Camila Ospina: Oh, of course. I'll do that.
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
    Camila Ospina: Oh, of course. I'll do that.
    #exit_conversation
    -> DONE
+ [Of course, go on through.]
    ~ kit_ca12_door_choice = "letin"
    Camila Ospina: Lovely, thanks. I'll find her myself.
    #exit_conversation
    -> DONE
+ [\[Say nothing\]]
    ~ kit_ca12_door_choice = "silent"
    Camila Ospina: Sorry, I'll try the desk.
    #exit_conversation
    -> DONE

=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
