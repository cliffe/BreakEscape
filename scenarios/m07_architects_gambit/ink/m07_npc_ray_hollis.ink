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
// ===========================================

VAR hollis_resolved = ""
VAR hollis_ko = false
VAR visitor_log_read = false
VAR renewal_signoff_read = false
VAR badge_obtained = false
VAR team_assigned = false

VAR pressed_once = false
VAR bluff_burned = false
VAR asked_partial = false
VAR hollis_backed_off = false
VAR hub_quiet = false

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
Narrator: He clocks you at thirty feet and his hand goes to his belt before his face does anything at all. The flashlight beam finds your chest and stays there.

Ray Hollis: Building's evacuated. Has been forty minutes. So you're either lost or you're the other thing.

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
+ [Walk straight at him. "I'm not here to fight you, Ray."]
    -> hostile_option
+ [Back off. I'm leaving.]
    -> evade

=== bluff ===
{bluff_burned:
    Ray Hollis: You already tried that one.
    -> back
}
~ bluff_burned = true
Narrator: He does not look at a list. He does not have a list. He looks at your hands.

Ray Hollis: Contractors came out with everyone else. I walked them out myself.

Ray Hollis: Try again, and stand still while you do it.
-> back

=== stakes ===
{pressed_once:
    Ray Hollis: I heard you the first time.
    -> back
}
~ pressed_once = true
Ray Hollis: What I know is my shift ends at six and there's a number in my account that says stand here.

Narrator: It comes out too fast, and he hears it come out, and something behind his eyes goes very still.

Ray Hollis: That's not what I meant.

+ [No. It's exactly what you meant.]
    Ray Hollis: Walk away. Right now. I'm asking.
    -> back
+ [How much?]
    Ray Hollis: Enough that I can't give it back. That's the whole trick of it, isn't it.
    -> back

=== leverage_partial ===
~ asked_partial = true
Ray Hollis: The log doesn't say who. Then go and find something that does.

Narrator: He says it like a man who knows exactly where that something is, and is hoping you don't.
-> back

=== leverage ===
Narrator: You say the date. Not the accusation, just the date, and the way it lands tells you everything the paperwork already told you.

{visitor_log_read:
    Ray Hollis: That log's meant to stay in the desk drawer.
    You: It was. It isn't now. Compliance record, three years' retention, and your login is on a credential renewal for a man who is upstairs putting eight point four million people in the dark.
- else:
    Ray Hollis: Halvorsen. She never could leave a thing alone.
    You: The station's print history, with your login on it. A credential renewal for a man who is upstairs putting eight point four million people in the dark.
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
Narrator: He unclips the badge with two fingers and holds it out at arm's length, as if it were the part of him that had done it.

Ray Hollis: Six months I've been waiting for somebody to come and ask. Turns out I just wanted the asking over with.

Ray Hollis: There's a badge station behind me runs contractor stock. You'd have got in either way. I want you to know I know that.

// PASS 3: what only talking him round gets. The vault rule (P6) and Park.
Ray Hollis: Day after the OptiGrid cabling survey, their plant guy reset the vault keypad. I held the riser door. He read the number off the plate on the transfer switch. Said that way nobody has to write it down.

Ray Hollis: When the alarms went tonight, same guy came back in against the crowd. Bag, cable cutter. Went down the riser. He hasn't come up.

You: Go.

Narrator: He goes out through the muster door and does not look back.

#exit_conversation
-> already_dealt

=== deal_refused ===
Narrator: The hand comes back up. Not levelled -- just back up, which is worse, because it means he has stopped deciding and started reacting.

Ray Hollis: No. No, I've thought about that room. I'm not sitting in it.

+ [Sit down, Ray.]
    -> hostile_option
+ [Fine. Badge. Then you're gone.]
    -> deal_take

=== hostile_option ===
Narrator: He backs into the turnstile frame with nowhere further to go, which is the exact circumstance in which frightened men make the loudest decision available to them.

Ray Hollis: Stay there. STAY THERE.

+ [Put it down.]
    -> goes_loud
+ [I'm stepping back. Look at me. I'm stepping back.]
    -> evade

=== goes_loud ===
Ray Hollis: I can't afford you. I'm sorry. I genuinely am.

Narrator: He comes off the frame at you.

~ hollis_resolved = "ko"
#set_global:hollis_resolved:ko
#hostile:ray_hollis
#exit_conversation
-> parked

=== evade ===
Narrator: You give him the corner and the corner gives you his blind side. He sweeps the flashlight across the turnstiles twice, finds an empty checkpoint both times, and settles back into the pattern he has walked for six months.

Ray Hollis: Yeah. Thought so.

// PASS 3 (playtest s1): backing off is walking away for now, not getting
// past him. hollis_resolved becomes "evaded" only when the player reaches the
// server hall without talking him round or knocking him out (HaX mapping).
~ hollis_backed_off = true
#set_global:hollis_backed_off:true
#exit_conversation
-> back

=== wary_again ===
Narrator: He is halfway along the patrol and jumpier than he was. The flashlight comes up fast.

Ray Hollis: Something's in here. I know something's in here.

-> back

=== already_dealt ===
Narrator: The checkpoint is empty. His radio sits on the desk with the battery out beside it.

+ [Move on.]
    #exit_conversation
    -> already_dealt

=== down_and_out ===
Narrator: He is face down by the turnstiles, breathing. Whatever he knew about the sixteenth of June is going with him to a hospital, and then to a lawyer.

+ [Leave him.]
    #exit_conversation
    -> down_and_out

// PASS 2 (lesson 21): conversations never reach DONE. A hostile Hollis
// can't be talked to, so this only holds the story open.
=== parked ===
+ [Leave it.]
    #exit_conversation
    -> parked
