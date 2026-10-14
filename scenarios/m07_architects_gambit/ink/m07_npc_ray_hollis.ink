// ===========================================
// m07 The Architect's Gambit -- RAY HOLLIS
// NPC id: ray_hollis   displayName: Ray Hollis
// Room: security_checkpoint. Patrols with an LOS cone.
//
// Facility security guard. Bought, not converted. He renewed Mercer's
// credentials six months ago for money and has spent six months not thinking
// about it. He is the first evidence that ENTROPY had inside help HERE -- the
// small-scale echo of the mole problem the cable vault turns up later.
//
// Three resolutions per CONTRACT.md hollis_resolved: "talked" / "ko" / "evaded".
// Talking is not the soft option. He is armed, cornered and frightened, and
// the only thing that moves him is the paperwork: the night supervisor's
// handover names his login on Mercer's renewal (the visitor log asks the
// question; the handover answers it). It costs the player the arrest, and it
// is the only route where he talks: the vault keypad, and the man on the riser.
// PASS 5 puzzle chains r1 (F3): the quiet route. Once he's rattled by the
// money (stakes), the m03 cloner can read his badge off his belt. Cheaper than
// talking, and it costs more: no vault rule, no Park tip, and he stays bought.
// ===========================================

VAR hollis_resolved = "" // Synced scenario global: how Hollis was dealt with (talked/ko/evaded); also set to evaded by the server_room mapping
VAR hollis_ko = false
VAR visitor_log_read = false
VAR renewal_signoff_read = false
VAR badge_obtained = false
// PASS 5 puzzle chains r1 (F3): synced; set by HaX's card_cloned mapping
// before the chat resumes (m05 Owen's shape).
VAR hollis_cloned = false
// PASS 5 puzzle chains closing round (F7): synced; set once on the first ops-floor
// entry. The clone is offered only after the player has seen the server-hall reader.
VAR inside_reached = false
VAR team_assigned = false

VAR pressed_once = false
VAR bluff_burned = false
VAR asked_partial = false
// Synced scenario global: set by the ink (back off) and by HaX's card_cloned mapping (clone).
VAR hollis_backed_off = false
VAR hub_quiet = false
VAR wary_said = false // Phase 4 dialogue C1 (D7-22): the "There you are" sighting plays once
VAR clone_sight_said = false // Phase 4 dialogue C2 (D7C2-18): the after-clone "Thought you'd gone" sighting plays once (its own latch: wary_said may already be set from before the clone)

=== start ===
{hollis_ko:
    -> down_and_out
}
{hollis_resolved == "talked":
    -> already_dealt
}
{hollis_resolved == "evaded":
    -> wary_again
}
{hollis_backed_off:
    -> wary_again
}
-> challenge

=== challenge ===
Narrator: He clocks you at thirty feet. His hand goes to his belt before his face moves. The flashlight finds your chest.

// Phase 4 dialogue C1 (D7-21): people are still coming out of the doors.
Ray Hollis: Building's evacuating. So you're lost, or you're the other thing.

-> back

// PASS 3 (playtest s5, E10/E13): every in-conversation return comes through
// here, so the hub knows it was reached from inside a conversation.
=== back ===
~ hub_quiet = true
-> hub

=== hub ===
// A reopen re-navigates straight to this knot (the owner of the saved choice),
// bypassing start. Re-check the routing states here; hub_quiet is false only
// on a reopen, so the re-greeting can't fire mid-conversation. Under an engine
// that reopens at start, start routes the same way.
{hollis_ko:
    -> down_and_out
}
{hollis_resolved == "talked":
    -> already_dealt
}
{not hub_quiet and (hollis_backed_off or hollis_resolved == "evaded"):
    -> wary_again
}
{not hub_quiet:
    Ray Hollis: You again. Say it or go.
}
~ hub_quiet = false
+ [I'm on the contractor list. Check it.]
    -> bluff
+ [The grid goes down tonight. You know that.]
    -> stakes
// PASS 3: the handover's print-history line names the date, the row, Mercer and
// his login, so it is enough on its own. The log alone only asks the question.
+ {renewal_signoff_read} [You renewed Mercer's credentials on the sixteenth of June. Your login.]
    -> leverage
+ {visitor_log_read and not renewal_signoff_read and not asked_partial} [Somebody renewed Mercer's credentials on the sixteenth. Was it you?]
    -> leverage_partial
// PASS 2: the label said "I'm not here to fight you" and led straight to
// him panicking; the label now says what the player actually does.
// Phase 4 dialogue C1 (D7-23): an action, so in parentheses as Park's are.
+ {pressed_once and inside_reached and not hollis_cloned and not badge_obtained} [(Keep him on the money. Let the cloner read his belt.)]
    -> clone
+ [Walk at him. "I'm not here to fight you, Ray."]
    -> hostile_option
+ [Back off. I'm leaving.]
    -> evade

=== bluff ===
{bluff_burned:
    Ray Hollis: You already tried that one.
    -> back
}
~ bluff_burned = true
Narrator: He doesn't check a list. He watches your hands.

Ray Hollis: Contractors came out with everyone else. I walked them out myself.

Ray Hollis: Nice try. Keep your hands where I can see them.
-> back

=== stakes ===
{pressed_once:
    Ray Hollis: I heard you the first time.
    -> back
}
~ pressed_once = true
Ray Hollis: What I know is my shift ends at six, and there's a number in my account that says stand here.

Narrator: It comes out too fast, and he hears it.

Ray Hollis: That's not what I meant.

+ [No. It's exactly what you meant.]
    Ray Hollis: Walk away. Right now. I'm asking.
    -> back
+ [How much?]
    Ray Hollis: Enough that I can't give it back. That's the whole trick of it, isn't it.
    -> back

// The tag sits on a throwaway line: the RFID minigame takes over the screen,
// and the chat resumes in clone_debrief. A cancelled read leaves hollis_cloned
// false, so the hub choice comes back as the retry.
=== clone ===
// Phase 4 dialogue C1 (D7-13): true after either stakes choice.
Narrator: You ask him what it bought, and step in close while he works out an answer.
#clone_keycard:server_zone_badge
Narrator: He keeps talking about retainers.
-> clone_debrief

=== clone_debrief ===
{hollis_cloned:
    Narrator: He's still talking when you step back. He never looks at his belt.
    Ray Hollis: Are we done? Go on, then.
    ~ hollis_backed_off = true
    #set_global:hollis_backed_off:true
    #exit_conversation
    -> back
- else:
    Narrator: The cloner didn't get a clean read. He's watching your hands now.
    -> back
}

=== leverage_partial ===
~ asked_partial = true
Ray Hollis: The log doesn't say who. Then go and find something that does.

Narrator: His eyes go past you to the ops-floor door, and come back.
-> back

=== leverage ===
Narrator: You say the date and nothing else. It lands.

{visitor_log_read:
    Ray Hollis: That log's meant to stay in the desk drawer.
    Narrator: You hold up the handover sheet. His login, against Mercer's renewal.
- else:
    Ray Hollis: Halvorsen. She never could leave a thing alone.
    Narrator: You hold up the handover sheet. His login, against Mercer's renewal.
}

Narrator: The flashlight beam drops to the floor. His hand stays where it is.

Ray Hollis: I renewed a badge. That's all I did. Nobody said anything about the grid.

+ [Nobody ever does. That's what the money is for.]
    -> deal
+ [Then help me, and say so to the police when they ask.]
    Ray Hollis: I'm not saying anything to anybody. Don't ask me that again.
    -> deal

=== deal ===
Ray Hollis: What do you want.

+ [Your badge. Server zone. Then you go, and you keep going.]
    -> deal_take
+ [Your badge, and you wait here for the police.]
    -> deal_refused

=== deal_take ===
// PASS 2: tags above the lines (lesson 3); selector give_item on the
// itemsHeld id (lesson 26); badge_obtained comes from the pickup mapping.
~ hollis_resolved = "talked"
#set_global:hollis_resolved:talked
#give_item:keycard:hollis_server_badge
#complete_task:clear_the_checkpoint
Narrator: He unclips the badge and holds it out at arm's length.

Ray Hollis: Six months I've been waiting for somebody to come and ask. Turns out I just wanted the asking over with.

Ray Hollis: Badge station behind me prints contractor stock. You'd have got in either way. I know that.

// PASS 3: what only talking him round gets. The vault rule (P6) and Park.
Ray Hollis: Day after the OptiGrid survey, their plant guy reset the vault keypad. I held the riser door.

Ray Hollis: He read the number off the plate on the transfer switch. Said that way nobody has to write it down.

Ray Hollis: Tonight, same guy came back in against the crowd. Bag, cable cutter. Went down the riser. Hasn't come up.

Narrator: He goes out through the muster door and doesn't look back.

#exit_conversation
-> already_dealt

=== deal_refused ===
Narrator: The hand comes back up. He has stopped deciding and started reacting.

Ray Hollis: No. No, I've thought about that room. I'm not sitting in it.

+ [Sit down, Ray.]
    -> hostile_option
+ [Fine. Badge. Then you're gone.]
    -> deal_take

=== hostile_option ===
// Blind run A fixes (M1): say a fight is one step away, and mark the choice that starts it.
Narrator: He backs into the turnstile frame. Nowhere left to go. One more push and this turns into a fight.

Ray Hollis: Stay there. STAY THERE.

+ [Put it down. (Fight him.)]
    -> goes_loud
+ [I'm stepping back. Look at me. I'm stepping back.]
    -> evade

=== goes_loud ===
Ray Hollis: I can't afford you. I'm sorry. I mean it.

Narrator: He comes off the frame at you with his fists up. This is going to be a fight.

~ hollis_resolved = "ko"
#set_global:hollis_resolved:ko
#hostile:ray_hollis
#exit_conversation
-> parked

=== evade ===
Narrator: You give him the corner, and the corner gives you his blind side. His flashlight sweeps the turnstiles twice and finds nothing.

Ray Hollis: Yeah. Thought so.

// PASS 3 (playtest s1): backing off is walking away for now, not getting
// past him. hollis_resolved becomes "evaded" only when the player reaches the
// server hall without talking him round or knocking him out (HaX mapping).
~ hollis_backed_off = true
#set_global:hollis_backed_off:true
#exit_conversation
-> back

=== wary_again ===
// PASS 5 alignment r2 (m6): the sight challenge fired because he saw the
// player, so he isn't searching any more.
// Phase 4 dialogue C1 (D7-22): after the clone he has just told the player to
// go; and the sighting plays once, not on every re-talk.
{
- hollis_cloned and not clone_sight_said:
    ~ clone_sight_said = true
    Narrator: He looks up from the desk. His hand stays off his belt this time.
    Ray Hollis: Thought you'd gone. Say it or go.
- wary_said:
    Ray Hollis: Still here. Say it or go.
- else:
    ~ wary_said = true
    Narrator: He is jumpier now. The flashlight comes up fast, and this time it finds you.
    Ray Hollis: There you are. I knew something was in here.
}

-> back

=== already_dealt ===
Narrator: The checkpoint is empty. His radio sits on the desk with the battery out beside it.

+ [Move on.]
    #exit_conversation
    -> already_dealt

=== down_and_out ===
Narrator: He is face down by the turnstiles, breathing. Whatever he knew about the sixteenth of June goes with him.

+ [Leave him.]
    #exit_conversation
    -> down_and_out

// PASS 2 (lesson 21): conversations never reach DONE. A hostile Hollis
// can't be talked to, so this only holds the story open.
=== parked ===
+ [Leave it.]
    #exit_conversation
    -> parked
