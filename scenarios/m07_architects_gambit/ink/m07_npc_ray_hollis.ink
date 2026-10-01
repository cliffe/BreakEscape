// ===========================================
// m07 The Architect's Gambit -- JAKE MORRISON
// NPC id: jake_morrison   displayName: Jake Morrison
// Room: security_checkpoint. Patrols with an LOS cone.
//
// Facility security guard. Bought, not converted. He renewed Mercer's
// credentials six months ago for money and has spent six months not thinking
// about it. He is the first evidence that ENTROPY had inside help HERE -- the
// small-scale echo of the mole problem the cable vault turns up later.
//
// Three resolutions per CONTRACT.md morrison_resolved: "talked" / "ko" / "evaded".
// Talking is not the soft option. He is armed, cornered and frightened, and
// the only thing that moves him is the visitor log -- and it costs the player
// the arrest.
// ===========================================

VAR morrison_resolved = ""
VAR morrison_ko = false
VAR visitor_log_read = false
VAR badge_obtained = false
VAR team_assigned = false

VAR pressed_once = false
VAR bluff_burned = false

=== start ===
{morrison_ko:
    -> down_and_out
}
{morrison_resolved == "talked":
    -> already_dealt
}
{morrison_resolved == "evaded":
    -> wary_again
}
-> challenge

=== challenge ===
Narrator: He clocks you at thirty feet and his hand goes to his belt before his face does anything at all. The flashlight beam finds your chest and stays there.

Jake Morrison: Building's evacuated. Has been forty minutes. So you're either lost or you're the other thing.

-> hub

=== hub ===
+ [I'm on the contractor list. Check it.]
    -> bluff
+ [The grid goes down tonight. You know that.]
    -> stakes
+ {visitor_log_read} [You renewed Mercer's credentials on the sixteenth of June. Your login, your signature.]
    -> leverage
// PASS 2: the label said "I'm not here to fight you" and led straight to
// him panicking; the label now says what the player actually does.
+ [Walk straight at him. "I'm not here to fight you, Jake."]
    -> hostile_option
+ [Back off. I'm leaving.]
    -> evade

=== bluff ===
{bluff_burned:
    Jake Morrison: You already tried that one.
    -> hub
}
~ bluff_burned = true
Narrator: He does not look at a list. He does not have a list. He looks at your hands.

Jake Morrison: Contractors came out with everyone else. I walked them out myself.

Jake Morrison: Try again, and stand still while you do it.
-> hub

=== stakes ===
{pressed_once:
    Jake Morrison: I heard you the first time.
    -> hub
}
~ pressed_once = true
Jake Morrison: What I know is my shift ends at six and there's a number in my account that says stand here.

Narrator: It comes out too fast, and he hears it come out, and something behind his eyes goes very still.

Jake Morrison: That's not what I meant.

+ [No. It's exactly what you meant.]
    Jake Morrison: Walk away. Right now. I'm asking.
    -> hub
+ [How much?]
    Jake Morrison: Enough that I can't give it back. That's the whole trick of it, isn't it.
    -> hub

=== leverage ===
Narrator: You say the date. Not the accusation, just the date, and the way it lands tells you everything the log already told you.

Jake Morrison: That log's meant to stay in the desk drawer.

You: It was. It isn't now. Compliance record, three years' retention, and your name is on a credential renewal for a man who is upstairs putting eight point four million people in the dark.

Narrator: The flashlight beam drops to the floor. His hand stays where it is.

Jake Morrison: I renewed a badge. That's all I did. Nobody said anything about the grid.

+ [Nobody ever does. That's what the money is for.]
    -> deal
+ [Then help me, and say so to the police when they ask.]
    Jake Morrison: I'm not saying anything to anybody. Don't ask me that again.
    -> deal

=== deal ===
Jake Morrison: What do you want.

+ [Your badge. Server zone. Then you go, and you keep going.]
    -> deal_take
+ [Your badge, and you wait here for the police.]
    -> deal_refused

=== deal_take ===
// PASS 2: tags above the lines (lesson 3); selector give_item on the
// itemsHeld id (lesson 26); badge_obtained comes from the pickup mapping.
~ morrison_resolved = "talked"
#set_global:morrison_resolved:talked
#give_item:keycard:morrison_server_badge
#complete_task:clear_the_checkpoint
Narrator: He unclips the badge with two fingers and holds it out at arm's length, as if it were the part of him that had done it.

Jake Morrison: Six months I've been waiting for somebody to come and ask. Turns out I just wanted the asking over with.

Jake Morrison: There's a badge station behind me runs contractor stock. You'd have got in either way. I want you to know I know that.

You: Go.

Narrator: He goes out through the muster door and does not look back.

#exit_conversation
-> already_dealt

=== deal_refused ===
Narrator: The hand comes back up. Not levelled -- just back up, which is worse, because it means he has stopped deciding and started reacting.

Jake Morrison: No. No, I've thought about that room. I'm not sitting in it.

+ [Sit down, Jake.]
    -> hostile_option
+ [Fine. Badge. Then you're gone.]
    -> deal_take

=== hostile_option ===
Narrator: He backs into the turnstile frame with nowhere further to go, which is the exact circumstance in which frightened men make the loudest decision available to them.

Jake Morrison: Stay there. STAY THERE.

+ [Put it down.]
    -> goes_loud
+ [I'm stepping back. Look at me. I'm stepping back.]
    -> evade

=== goes_loud ===
Jake Morrison: I can't afford you. I'm sorry. I genuinely am.

Narrator: He comes off the frame at you.

~ morrison_resolved = "ko"
#set_global:morrison_resolved:ko
#hostile:jake_morrison
#exit_conversation
-> parked

=== evade ===
Narrator: You give him the corner and the corner gives you the cone. He sweeps the flashlight across the turnstiles twice, finds an empty checkpoint both times, and settles back into the pattern he has walked for six months.

Jake Morrison: Yeah. Thought so.

~ morrison_resolved = "evaded"
#set_global:morrison_resolved:evaded
#exit_conversation
-> hub

=== wary_again ===
Narrator: He is halfway along the patrol and jumpier than he was. The flashlight comes up fast.

Jake Morrison: Something's in here. I know something's in here.

-> hub

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

// PASS 2 (lesson 21): conversations never reach DONE. A hostile Morrison
// can't be talked to, so this only holds the story open.
=== parked ===
+ [Leave it.]
    #exit_conversation
    -> parked
