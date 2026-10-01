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
// PASS 3 (P6): the door-audit check. Globals synced in from the scenario.
VAR suite_code = ""
// PASS 3 (playtest B-F1): set by a pickup mapping when the keycard actually
// reaches the inventory, so a give lost to a force-closed conversation is
// re-offered.
VAR netherton_card_taken = false
VAR found_badge_audit = false
VAR found_timeline = false
VAR found_access_logs_hint = false
VAR cipher_audit_confirmed = false
VAR nightshade_audit_confirmed = false
VAR cipher_ko = false
VAR nightshade_ko = false
VAR named_on_evidence = false
VAR audit_misread = false
VAR audit_closed = false
VAR suite_code_found = false
// Local to this NPC (persisted with his ink state, commit 1de257bb).
VAR audit_misreads = 0
VAR audit_reply = 0
VAR audit_skip_step4 = false

=== start ===
{ met: -> return_visit }
~ met = true
#complete_task:brief_with_netherton
~ brief_taken = true
Narrator: The Director's office, moved since Portland to an inner room with no windows at all. Netherton stands with his back to you, facing a wall of amber threat maps where a window would be, in a suit that has not been off since that night. He does not turn around.

Director Magnus Netherton: {player_name}. Nine days ago I sent you to Portland and told you it was the only one of the four where a person in the building could change the outcome. That was true.

Director Magnus Netherton: What I did not tell you -- because I did not yet know it -- is that ENTROPY had your name before I signed the order that sent you.

Narrator: Now he turns.

Director Magnus Netherton: They did not out-think us at Portland. They were handed the board. Your assignment, your timing, your identity on the ground. Two of ours are dead at the sites the team could not reach, and they are dead because a person in this building told the enemy there would be gaps.

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
    Director Magnus Netherton: Agent 0x47. Operations specialist, cryptography lab. Planning access, like the other two. He helps write the plans ENTROPY seemed to be reading. Impeccable record. Trained in your own cohort. And nothing, nothing at all, on his file.
    Director Magnus Netherton: I will tell you what I told no one else. It is the empty file that keeps me awake. Everyone leaves marks. A man who leaves none has been very careful for a very long time.
    -> hub
+ { not asked_rules } [What are the rules of engagement, sir?]
    ~ asked_rules = true
    Director Magnus Netherton: Quiet. The instant the mole knows the net is out, they burn their access and walk, and we lose the thread to The Architect with them. Interview all three as if none of them is guilty. Get onto our own systems and bring me proof I can act on. A hunch is not proof.
    Director Magnus Netherton: And Agent -- if you are certain before you are sure, come and tell me the name. I would rather talk you out of a mistake than read about it.
    -> hub
+ { not netherton_card_taken } [I'll need access.] -> take_keycard
+ { (gave_keycard or netherton_card_taken) and (suspect_theory == "") and not mole_identified } [I have a name forming.] -> name_a_suspect
+ { mole_identified and not told_name } [It's Nightshade, sir. The root logs name his account.] -> told_him
+ { found_badge_audit and not named_on_evidence and not audit_closed and not mole_identified } [I've been through the door audit, sir.] -> audit_case
+ { named_on_evidence and not suite_code_found } [The suite code again, sir?] -> repeat_code
+ { gave_keycard or netherton_card_taken } [I'm ready. Let me work.] -> done

=== take_keycard ===
// PASS 2: the tag was #give_item:director_netherton:server_zone_badge, which
// giveItem reads as item TYPE "director_netherton" and so never matched. Now
// the m02 selector form (lesson 26) against the itemsHeld id.
#give_item:keycard:netherton_keycard
Director Magnus Netherton: My keycard. Every badge reader in the building. I want exactly one person moving freely in here tonight and I have decided it is the one they already spent.
~ gave_keycard = true
Director Magnus Netherton: It gets you into the server room. The archives take a passphrase and the interrogation suite takes a code from my safe. Neither is on the badge system. The safe's combination you can work out; everyone in this building has the same bad habit, myself included. Do not lose the card, and do not let anyone see you use it.
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
    Director Magnus Netherton: An instinct is not evidence, and the man with nothing on his file is the second-easiest man in this building to suspect. If it is him, he has been careful for years. Careful men leave exactly one mistake. Find it. #set_global:suspect_theory:nightshade
    -> hub

=== told_him ===
~ told_name = true
Narrator: He does not sit down. He puts one hand flat on the desk, as if the floor has moved.
Director Magnus Netherton: Then I sealed a warning about him a year ago and told myself it was prudence. Dr Okafor's evaluation is in that safe, with the suite code. You may as well read it before you face him. You will find the combination is the same lazy number everyone in this building uses.
Director Magnus Netherton: Put the whole chain through the relay. When it is all in, I will have him walked down to interrogation, and you will be the one who goes in.
-> hub

// ================================================
// PASS 3 (P6): the door-audit check. when -> which of the three -> why not
// Cipher -> why trust Phantom's printout. Rules (plan P6, R2-M5, R3-M1):
// - person-chat re-navigates to the TOP-LEVEL knot of the first choice's
//   sourcePath, so each step's choices live in their own top-level knot that
//   opens with the state check; the question text sits in a separate knot;
// - the counter and the booleans are set in choice-free knots, before any
//   visible text (audit_wrong, audit_right), which divert to hub;
// - booleans are set with ~ (the observer pushes declared globals) as well as
//   by tag;
// - "[Let me read it again.]" is a free exit at every step.
// ================================================
=== audit_case ===
Director Magnus Netherton: Then don't give me a suspect. Give me a reading.
{ not (found_timeline or found_access_logs_hint):
    Director Magnus Netherton: You've brought me a door. Bring me a clock. When was the plan opened? Somebody in this building has written it down.
    -> hub
}
~ audit_skip_step4 = false
{ not (cipher_audit_confirmed or nightshade_audit_confirmed):
    { cipher_ko and nightshade_ko:
        // R3-m3: both men on the audit are down; nobody can confirm it. Three steps.
        ~ audit_skip_step4 = true
    - else:
        Director Magnus Netherton: And before you read it to me, take it to the people on it. If a man's own row is wrong, he will say so. Come back when one of them has told you it is right.
        -> hub
    }
}
-> audit_q1

=== audit_q1 ===
Director Magnus Netherton: When was the plan opened?
-> audit_c1

=== audit_c1 ===
{ mole_identified or audit_closed or named_on_evidence: -> hub }
+ [10:15 UTC.]
    ~ audit_reply = 1
    -> audit_wrong
+ [10:32 UTC.]
    ~ audit_reply = 1
    -> audit_wrong
+ [10:38 UTC.]
    -> audit_q2
+ [11:25 UTC.]
    ~ audit_reply = 2
    -> audit_wrong
+ [Let me read it again.]
    -> hub

=== audit_q2 ===
Director Magnus Netherton: Which of the three was behind that door at 10:38?
-> audit_c2

=== audit_c2 ===
{ mole_identified or audit_closed or named_on_evidence: -> hub }
+ [Cipher.]
    ~ audit_reply = 3
    -> audit_wrong
+ [Nightshade.]
    -> audit_q3
+ [Phantom.]
    ~ audit_reply = 3
    -> audit_wrong
+ [None of them.]
    ~ audit_reply = 4
    -> audit_wrong
+ [Let me read it again.]
    -> hub

=== audit_q3 ===
Director Magnus Netherton: Cipher badged through the same door that morning. Why not him?
-> audit_c3

=== audit_c3 ===
{ mole_identified or audit_closed or named_on_evidence: -> hub }
+ [The door log has him out of the lab at 10:32.]
    { audit_skip_step4:
        -> audit_right
    }
    -> audit_q4
+ [The door log has him in at 10:24, before the file was opened.]
    ~ audit_reply = 5
    -> audit_wrong
+ [His desk is out on the ops floor, not in the lab.]
    ~ audit_reply = 6
    -> audit_wrong
+ [He told me he spent that morning in the library.]
    ~ audit_reply = 7
    -> audit_wrong
+ [Let me read it again.]
    -> hub

=== audit_q4 ===
Director Magnus Netherton: That audit is Phantom's query, off Phantom's printer. Why trust it?
-> audit_c4

=== audit_c4 ===
{ mole_identified or audit_closed or named_on_evidence: -> hub }
+ [The people on it confirm their own rows.]
    -> audit_right
+ [Phantom's own row puts him on a plane.]
    ~ audit_reply = 8
    -> audit_wrong
+ [It agrees with the auth log Phantom pulled.]
    ~ audit_reply = 9
    -> audit_wrong
+ [The badge system printed it. Nobody typed those rows.]
    ~ audit_reply = 10
    -> audit_wrong
+ [Let me read it again.]
    -> hub

=== audit_wrong ===
~ audit_misreads = audit_misreads + 1
~ audit_misread = true
{ audit_misreads >= 3:
    ~ audit_closed = true
}
#set_global:audit_misread:true
{ audit_reply:
- 1: Director Magnus Netherton: That's a door moving, not a file opening.
- 2: Director Magnus Netherton: That's when it was closed.
- 3: Director Magnus Netherton: Read the door against the minute, not the man.
- 4: Director Magnus Netherton: Somebody opened it, Agent.
- 5: Director Magnus Netherton: Before it opened. Was he there when it did?
- 6: Director Magnus Netherton: Desks don't open files.
- 7: Director Magnus Netherton: He told you. What does the door say?
- 8: Director Magnus Netherton: That clears him of the leak, not of the printout.
- 9: Director Magnus Netherton: Then it agrees with Phantom twice.
- else: Director Magnus Netherton: Somebody chose the query, Agent, and the window.
}
{ audit_closed:
    Director Magnus Netherton: Enough. You've read me that log three ways. Bring me the account. #set_global:audit_closed:true
}
-> hub

=== audit_right ===
~ named_on_evidence = true
{ suspect_theory == "":
    ~ suspect_theory = "nightshade"
}
#complete_task:name_the_mole
#set_global:named_on_evidence:true
Director Magnus Netherton: He walked into his own lab twenty-three minutes before that plan opened and walked out eighteen minutes after it closed. That is a door, not an account. A man may sit in his own lab.
Director Magnus Netherton: But it is something I could put in front of a lawyer. Get me the account, and I will move. When the box agrees, he goes down to the suite. The code is {suite_code}. The card is in my safe, with Okafor's evaluation. Read it before you face him.
-> hub

=== repeat_code ===
Director Magnus Netherton: {suite_code}. Commit it to memory this time, Agent.
-> hub

=== done ===
Director Magnus Netherton: Go. Whoever it is was one of us this morning. Do not let that slow your hand, and do not let it leave you either. Bring me a name I can prove.
#exit_conversation
-> hub
