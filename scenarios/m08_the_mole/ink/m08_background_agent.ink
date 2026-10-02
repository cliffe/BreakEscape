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
VAR witness_heard = false

=== start ===
{ met: -> return_visit }
~ met = true
~ witness_heard = true
Narrator: He doesn't look up from the magazine. #set_global:witness_heard:true
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

=== hub ===
+ [What did you see that morning?]
    -> testimony
+ [Heard anything new?]
    { mole_identified:
        Off-Duty Agent: Only that the Director's had the interrogation suite cleared. Nobody's said for who. Nobody needs to.
    - else:
        Off-Duty Agent: Phantom's stopped being charming. Nightshade's the same as ever.
    }
    -> hub
+ [I'll leave you to it.]
    Off-Duty Agent: Mind the door.
    #exit_conversation
    -> hub
