// Mission 8: The Mole - Off-Duty Agent (break room). The unreliable witness.
// Speaker: Off-Duty Agent
// PASS 2 (lesson 21): never reaches DONE; the exit returns to the hub so a
// re-talk opens on a choice rather than "(End of conversation)".
// PASS 3 (P7, R2-M4, R3-m7): he was behind the lab door all morning on D-2
// (0x3C on the door audit, IN 07:52). He saw someone at the bench at about
// 10:20-10:30: Nightshade was in from 10:15 and Cipher from 10:24, so it could
// be either, and it was before the plan was opened at 10:38. No "propped"
// door, so the audit stays a complete record. A met guard stops the testimony
// replaying after a reload; the hub repeats it on request.
VAR mole_identified = false
VAR met = false
// PASS 5 (alignment C2, J2): any accusation before the naming gets around.
VAR accused_cipher = false
VAR accused_phantom = false
VAR accused_nightshade = false
// PASS 5 (puzzle chains C1, m6): caught picking a locker (lockpick_used_in_view,
// person-chat, once, before the naming). Synced scenario global; HaX's
// mapping turns it into the tip-off.
VAR locker_seen_picked = false

=== start ===
{ met: -> return_visit }
~ met = true
Narrator: He doesn't look up from the magazine.
-> testimony

=== return_visit ===
Off-Duty Agent: Still here. Still not reading this.
-> hub

=== testimony ===
Off-Duty Agent: You didn't hear it from me. Two days before Portland I was in here from before eight.
Off-Duty Agent: Went through to the lab for the stapler. Just gone twenty past ten, half past at the latest.
Off-Duty Agent: Someone at the bench at the far end. Had the build of the nerdy one, Cipher. Or not. I wasn't looking.
Off-Duty Agent: I'm sitting where I can see the door. You should too.
-> hub

// PASS 5 (puzzle chains C1, m6): the catch. Sets met so a later talk opens
// on his return line; returns to the hub, so a reopen lands on a choice.
=== on_locker_picked ===
~ met = true
~ locker_seen_picked = true
#set_global:locker_seen_picked:true
Narrator: The magazine comes down.
Off-Duty Agent: Oi. That's not yours.
Off-Duty Agent: Don't worry. I didn't see anything. I'll be telling everyone I didn't see anything.
-> hub

=== hub ===
+ [What did you see that morning?]
    -> testimony
+ [Heard anything new?]
    { mole_identified:
        Off-Duty Agent: Only that the Director's had the interrogation suite cleared. Nobody's said for who. Nobody needs to.
    - else:
        { accused_cipher or accused_phantom or accused_nightshade:
            Off-Duty Agent: Word is you've been calling people traitors to their faces. Whole floor's heard. If one of them is the mole, so has he.
        }
        Off-Duty Agent: Phantom's stopped being charming. He was off the floor all that morning, two days before Portland, and nobody's said where.
        Off-Duty Agent: Nightshade's the same as ever.
    }
    -> hub
+ [I'll leave you to it.]
    Off-Duty Agent: Mind the door.
    #exit_conversation
    -> hub
