// ================================================
// Mission 8: The Mole
// Director Magnus Netherton -- the briefing. The familiar SAFETYNET director
// from m07, now hunting the leak that burned his own agent.
// Speaker: Director Magnus Netherton
// Entry knot: start   Completes: brief_with_netherton
// Gives the all-zones keycard. Lets the player form and state a theory.
// PASS 2: the task completes at the top of the first meeting (lesson 44; it
// used to complete only on the last line, and aim 0 gates everything). The
// conversation never reaches DONE (lesson 21): exits return to the hub, and a
// re-talk opens on return_visit instead of replaying the intro.
// ================================================

VAR player_name = "Agent 0x00"
VAR mole_identified = false
VAR suspect_theory = ""
VAR gave_keycard = false
VAR asked_cipher = false
VAR asked_phantom = false
VAR asked_nightshade = false
VAR asked_why_me = false
VAR asked_rules = false
VAR met = false
VAR told_name = false
VAR brief_taken = false

=== start ===
{ met: -> return_visit }
~ met = true
#complete_task:brief_with_netherton
~ brief_taken = true
Narrator: The Director's office, moved since Portland to an inner room with no windows at all. Netherton stands with his back to you, facing a wall of amber threat maps where a window would be, in a suit that has not been off since that night. He does not turn around.

Director Magnus Netherton: {player_name}. Nine days ago I sent you to Portland and told you it was the only one of the four where a person in the building could change the outcome. That was true.

Director Magnus Netherton: What I did not tell you -- because I did not yet know it -- is that ENTROPY had your name before I signed the order that sent you.

Narrator: Now he turns.

Director Magnus Netherton: They did not out-think us at Portland. They were handed the board. Your assignment, your timing, your identity on the ground. Two of ours are dead at the sites the team could not reach, and they are dead because a person in this building told the enemy where the gaps would be.

Director Magnus Netherton: I have run this agency for eleven years. I have never had to say the next sentence. There is a mole in SAFETYNET, and I am reasonably certain they are within a hundred metres of where you are standing.
Director Magnus Netherton: Ask me what you need. Then go and prove something.
-> hub

=== return_visit ===
{ mole_identified and not told_name:
    Director Magnus Netherton: You've been in the logs. I can see it on you. Say the name when you're sure, and not before.
- else:
    Director Magnus Netherton: Agent. What do you need?
}
-> hub

=== hub ===
+ { not asked_why_me } [Why me, sir? I'm the one they compromised.]
    ~ asked_why_me = true
    Director Magnus Netherton: Precisely because they compromised you. Whoever it is has spent years learning to look at colleagues and see nothing. You they have already used, which means you are the one person here they have a reason to fear -- and the one person in this building I can clear without a log: yours was the name they were selling.
    Director Magnus Netherton: You are also, forgive me, angry. I have found that useful before. Do not let it choose the suspect for you.
    -> hub
+ { not asked_cipher } [Tell me about Cipher.]
    ~ asked_cipher = true
    Director Magnus Netherton: Agent 0x23. Signals and cryptography, on the operations floor. Brilliant, friendless, keeps hours that make the roster clerk nervous. On paper he is the obvious one. In my experience the obvious one is usually a man with a secret that is none of my business.
    -> hub
+ { not asked_phantom } [Tell me about Phantom.]
    ~ asked_phantom = true
    Director Magnus Netherton: Agent 0x88. Field coordinator, intelligence analysis. Charming, connected, and lately asking a great many questions that are not his to ask. He has unlogged absences I cannot account for. Either he is running his own errand, or he is running the enemy's.
    -> hub
+ { not asked_nightshade } [Tell me about Nightshade.]
    ~ asked_nightshade = true
    Director Magnus Netherton: Agent 0x47. Operations specialist, cryptography lab. Maximum clearance -- he helps write the plans ENTROPY seemed to be reading. Impeccable record. Trained in your own cohort. And nothing, nothing at all, on his file.
    Director Magnus Netherton: I will tell you what I told no one else. It is the empty file that keeps me awake. Everyone leaves marks. A man who leaves none has been very careful for a very long time.
    -> hub
+ { not asked_rules } [What are the rules of engagement, sir?]
    ~ asked_rules = true
    Director Magnus Netherton: Quiet. The instant the mole knows the net is out, they burn their access and walk, and we lose the thread to The Architect with them. Interview all three as if none of them is guilty. Get onto our own systems and bring me proof I can act on. A hunch is not proof.
    Director Magnus Netherton: And Agent -- if you are certain before you are sure, come and tell me the name. I would rather talk you out of a mistake than read about it.
    -> hub
+ { not gave_keycard } [I'll need access.] -> take_keycard
+ { gave_keycard and (suspect_theory == "") and not mole_identified } [I have a name forming.] -> name_a_suspect
+ { mole_identified and not told_name } [It's Nightshade, sir. The root logs name his account.] -> told_him
+ { gave_keycard } [I'm ready. Let me work.] -> done

=== take_keycard ===
// PASS 2: the tag was #give_item:director_netherton:server_zone_badge, which
// giveItem reads as item TYPE "director_netherton" and so never matched. Now
// the m02 selector form (lesson 26) against the itemsHeld id.
#give_item:keycard:netherton_keycard
Director Magnus Netherton: My keycard. Every badge reader in the building. I want exactly one person moving freely in here tonight and I have decided it is the one they already spent.
~ gave_keycard = true
Director Magnus Netherton: It gets you into the server room. The archives and the interrogation suite are on older locks, and you will have to find your own way through those. Do not lose it, and do not let anyone see you use it.
-> hub

=== name_a_suspect ===
Director Magnus Netherton: Already? Say it. Not for the file -- for me. Who is your instinct pointing at?
+ [Cipher. The odd hours, the secrecy.]
    ~ suspect_theory = "cipher"
    Director Magnus Netherton: Perhaps. Or perhaps he is the easiest man in the building to suspect, which is not the same thing. Prove it, and I will sign it. Guess it, and you hand the real one another week of cover. #set_global:suspect_theory:cipher
    -> hub
+ [Phantom. The questions, the absences.]
    ~ suspect_theory = "phantom"
    Director Magnus Netherton: A man asking too many questions is either the leak or the only other person hunting it. I have not decided which, and neither, yet, have you. Bring me the logs. #set_global:suspect_theory:phantom
    -> hub
+ [Nightshade. It's the man with no marks.]
    ~ suspect_theory = "nightshade"
    Narrator: A long pause.
    Director Magnus Netherton: You and I have the same instinct, then, and I trust yours more than mine because you know him and I only read him. But an instinct we share is still not evidence. If it is him, he has been careful for years. Careful men leave exactly one mistake. Find it. #set_global:suspect_theory:nightshade
    -> hub

=== told_him ===
~ told_name = true
Narrator: He does not sit down. He puts one hand flat on the desk, as if the floor has moved.
Director Magnus Netherton: Then I sealed a warning about him a year ago and told myself it was prudence. Dr Okafor's evaluation is in that safe. You may as well read it before you face him. You will find the combination is the same lazy number everyone in this building uses.
Director Magnus Netherton: Put the whole chain through the relay. When it is all in, I will have him walked down to interrogation, and you will be the one who goes in.
-> hub

=== done ===
Director Magnus Netherton: Go. Whoever it is was one of us this morning. Do not let that slow your hand, and do not let it leave you either. Bring me a name I can prove.
#exit_conversation
-> hub
