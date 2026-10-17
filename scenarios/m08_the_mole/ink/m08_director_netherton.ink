// ================================================
// Mission 8: The Mole
// Director Magnus Netherton -- the briefing. The familiar SAFETYNET director
// from m07, now hunting the leak that burned his own agent.
// Speaker: Director Magnus Netherton
// Entry knot: start   Completes: brief_with_netherton
// Lets the player clone his all-zones keycard once the three suspects have
// been interviewed (PASS 4). Lets the player form and state a theory.
// PASS 2: the task completes at the top of the first meeting (lesson 44; it
// used to complete only on the last line, and aim 0 gates everything). The
// conversation never reaches DONE (lesson 21): exits return to the hub, and a
// re-talk opens on return_visit instead of replaying the intro.
// ================================================

VAR player_name = "Agent 0x00"
VAR mole_identified = false // Synced scenario global: set here on a correct naming, or by the flag-4 fallback mappings
VAR suspect_theory = ""
VAR asked_vector = false
VAR asked_phantom = false
VAR asked_nightshade = false
VAR asked_why_me = false
VAR asked_rules = false
VAR met = false
VAR told_name = false
VAR brief_taken = false // Synced scenario global: Netherton's brief is done; also set by his npc_ko mapping
// PASS 3 (P6): the door-audit check. Globals synced in from the scenario.
VAR suite_code = ""
// PASS 3 (playtest B-F1): set by a pickup mapping when the keycard actually
// reaches the inventory, so a give lost to a force-closed conversation is
// re-offered.
VAR netherton_card_taken = false
VAR found_badge_audit = false
VAR found_timeline = false
VAR found_access_logs_hint = false
VAR vector_audit_confirmed = false
VAR nightshade_audit_confirmed = false
VAR vector_ko = false
VAR nightshade_ko = false
VAR named_on_evidence = false
VAR audit_misread = false
VAR audit_closed = false
VAR suite_code_found = false
// PASS 4 (fixes 1 and 2): the card waits for the three interviews, then he lets
// the player clone it. netherton_card_taken is set by the card_cloned mapping
// (and by picking up his card after a KO); badge_cloned by the printer route.
VAR vector_interviewed = false
VAR phantom_interviewed = false
VAR nightshade_interviewed = false
VAR phantom_ko = false
VAR badge_cloned = false
// Local to this NPC (persisted with his ink state, commit 1de257bb).
VAR audit_misreads = 0
VAR audit_reply = 0
VAR audit_skip_step4 = false
VAR access_offered = false
// PASS 5 (alignment B1, Option B): the box gives a terminal and a time, not a
// name. Naming is required and comes through the door-audit check here. Synced
// scenario globals:
VAR found_access_logs = false // set by the flag-4 mappings: the box's minute and terminal
VAR named_before_box = false // named on the audit before flag 4 (credits, debrief)
VAR named_by_director = false // Synced scenario global: three misreads after flag 4: he reads it himself
VAR nightshade_tipped_off = false // Synced scenario global: three misreads before flag 4: he takes it over, and it gets noticed
// PASS 5 (alignment C2, J5, N6): the warning at the second misread (read by
// HaX's ladder), and the relay line after the whole chain is in.
VAR audit_warned = false // Synced scenario global: he has warned the player once
VAR all_flags_submitted = false // Synced scenario global
// Design C1 (D1): a lab-door witness punched and left standing won't talk, so
// can't confirm his row. Synced scenario globals.
VAR vector_hostile = false
VAR nightshade_hostile = false
// Design C2 (N1): Phantom punched and left standing counts as seen too.
VAR phantom_hostile = false
// Design C2 (N2): the first tip-off's cause; set here only if nobody has tipped him off yet.
VAR tipoff_source = "" // Synced scenario global (design C2, N2): the first tip-off's cause
// Phase 4 dialogue C1 (D8-2): the m03/m07 quiet flag. Every return from inside
// the conversation and every exit comes through back, so the hub's re-entry
// line (the old return_visit) plays only on a re-talk: a reopen lands on hub.
VAR hub_quiet = false

=== start ===
{ met: -> hub }
~ met = true
#complete_task:brief_with_netherton
~ brief_taken = true
Narrator: The Director's office, blinds drawn against the night. Netherton stands at the window, his back to the door. He does not turn round.

Director Magnus Netherton: Agent. Nine days ago I sent you to Portland, the one site where a person in the building could change the outcome. That was true.

Director Magnus Netherton: What I did not tell you, because I did not yet know it, is that ENTROPY had your name before I signed the order.

Narrator: Now he turns.

Director Magnus Netherton: They did not out-think us at Portland. They were handed the board: your assignment, your timing, your identity on the ground.
Director Magnus Netherton: Two of ours are dead at the sites the team could not reach. They are dead because someone in this building told the enemy where the gaps would be.

Director Magnus Netherton: I have run field operations for five years. I have never had to say the next sentence.
Director Magnus Netherton: There is a mole in SAFETYNET. I am reasonably certain they are within a hundred metres of where you are standing.
Director Magnus Netherton: Ask me what you need. Then go and prove something.
-> back

=== back ===
~ hub_quiet = true
-> hub

=== hub ===
{ not hub_quiet:
    { found_access_logs and not mole_identified and not audit_closed:
        Director Magnus Netherton: {You've been in the logs. I can see it on you. A terminal and a time is not a man. Read me the door.|The door, Agent. Read it to me when you can.}
    - else:
        Director Magnus Netherton: {&Agent. What do you need?|Agent. Go on.}
    }
}
~ hub_quiet = false
+ { not asked_why_me } [Why me, sir? I'm the one they compromised.]
    ~ asked_why_me = true
    Director Magnus Netherton: Precisely because they compromised you. Yours was the name they were selling. You are the one person in this building I can clear without a log.
    Director Magnus Netherton: You are also, forgive me, angry. I have found that useful before. Do not let it choose the suspect for you.
    -> back
+ { not asked_vector } [Tell me about Vector.]
    ~ asked_vector = true
    Director Magnus Netherton: Agent 0x23. Intelligence analyst, signals and cryptography, on the operations floor. Brilliant, friendless, keeps hours that make the roster clerk nervous.
    Director Magnus Netherton: He carries a crypto annex badge and keeps a locked screen, and he has never once explained either. I should like to know why.
    -> back
+ { not asked_phantom } [Tell me about Phantom.]
    ~ asked_phantom = true
    Director Magnus Netherton: Agent 0x88. Field coordinator, in intelligence analysis, north of the operations floor. Charming, connected, and lately asking questions that are not his to ask.
    Director Magnus Netherton: He has unlogged absences I cannot account for. Either he is running his own errand, or he is running the enemy's.
    -> back
+ { not asked_nightshade } [Tell me about Nightshade.]
    ~ asked_nightshade = true
    Director Magnus Netherton: Agent 0x47. Cryptographic-hardware analyst, in the Crypto Lab. Planning access, like the other two. He taught your intake.
    Director Magnus Netherton: He has stood beside me at most of your briefings. He helps write the plans ENTROPY seemed to be reading.
    Director Magnus Netherton: If it is him, I have stood beside him for years and noticed nothing. I do not enjoy that thought.
    -> back
+ { not asked_rules } [What are the rules of engagement, sir?]
    ~ asked_rules = true
    Director Magnus Netherton: Quiet. The instant the mole knows the net is out, they burn their access and walk. We lose the thread to The Architect with them.
    Director Magnus Netherton: Interview all three as if none of them is guilty. Get onto our own systems and bring me proof I can act on. A hunch is not proof.
    Director Magnus Netherton: And Agent. If you are certain before you are sure, come and tell me the name.
    Director Magnus Netherton: I would rather talk you out of a mistake than read about it.
    -> back
+ { not netherton_card_taken and not badge_cloned and not access_offered } [I'll need access.] -> access_request
+ { access_offered and not netherton_card_taken } [Step up beside him and let the cloner read his card.] -> clone_card
+ { interviews_done() and (suspect_theory == "") and not mole_identified } [I have a name forming.] -> name_forming
// PASS 5 (B1): the naming. The root logs no longer name anyone, so the old
// "[It's Nightshade, sir. The root logs name his account.]" is gone; the name
// comes only from the door audit.
+ { (found_badge_audit or found_access_logs) and not mole_identified and not audit_closed } [I can name the leak, sir.] -> audit_case
+ { named_on_evidence and not suite_code_found } [The suite code again, sir?] -> repeat_code
+ [I'm ready. Let me work.] -> done

// PASS 5 (round 1 browser N5): the instinct question lives in a stitch of the
// hub, so a reopen after End Conversation re-navigates to the hub (person-chat
// returns to the top-level knot of the first choice) instead of asking it again.
// "[Not yet.]" backs out without committing to a name.
= name_forming
Director Magnus Netherton: Already? Say it. Not for the file. For me. Who is your instinct pointing at?
+ [Vector. The odd hours, the secrecy.]
    ~ suspect_theory = "vector"
    Director Magnus Netherton: Perhaps. Or perhaps he is the easiest man in the building to suspect, which is not the same thing.
    Director Magnus Netherton: Prove it, and I will sign it. Guess it, and you hand the real one another week of cover. #set_global:suspect_theory:vector
    -> back
+ [Phantom. The questions, the absences.]
    ~ suspect_theory = "phantom"
    Director Magnus Netherton: A man asking too many questions is either the leak or the only other person hunting it.
    Director Magnus Netherton: I have not decided which, and neither, yet, have you. Bring me the door log. #set_global:suspect_theory:phantom
    -> back
+ [Nightshade. Too calm, and he never gave the PIN device back.]
    ~ suspect_theory = "nightshade"
    Director Magnus Netherton: An instinct is not evidence. Calm is a temperament, and half this floor keeps kit it should have returned.
    Director Magnus Netherton: If it is him, he has been careful for years. Careful men leave exactly one mistake. Find it. #set_global:suspect_theory:nightshade
    -> back
+ [Not yet, sir.]
    Director Magnus Netherton: Good. Keep it to yourself until it is more than a feeling.
    -> back

// PASS 4 (fixes 1 and 2): he no longer hands the card over. Before the three
// interviews, "[I'll need access.]" sends the player to the suspects (sticky,
// so it can be asked again); after, he turns his back and lets the player clone
// the card off his lanyard (clone rule, PASS3_PUZZLE_BRIEF.md: the tag sits on
// a throwaway line, then clone_debrief reads the synced global and the hub
// re-offers the clone if the save didn't happen). The badge printer is the
// early route for a player who won't wait.
=== access_request ===
{ interviews_done(): -> access_offer }
Director Magnus Netherton: Not yet. Talk to all three first. I want them to have seen you on the floor before anyone sees you at the server room.
{ not (vector_interviewed or vector_ko or vector_hostile):
    Director Magnus Netherton: You have not seen Vector. Operations floor.
}
{ not (phantom_interviewed or phantom_ko or phantom_hostile):
    Director Magnus Netherton: You have not seen Phantom. Intelligence analysis, north of the operations floor.
}
{ not (nightshade_interviewed or nightshade_ko or nightshade_hostile):
    Director Magnus Netherton: You have not seen Nightshade. The Crypto Lab, west of the lobby.
}
-> back

=== access_offer ===
~ access_offered = true
Director Magnus Netherton: Then, access. I am not handing my card to anyone tonight. The mole reads this building's paperwork, and a hand-over is paperwork.
// Engine regression fixes (2026-10-17, R1): the office has blinds, a globe and a desk, no maps.
Narrator: He turns back to the window and parts two slats of the blind with a finger. His lanyard hangs at his chest, card outward, well inside a cloner's reach.
Director Magnus Netherton: Stand where you like, Agent. I shall be looking out of the window.
-> back

=== clone_card ===
Narrator: You step up beside him, as if to look out through the slats. The cloner in your jacket comes within an inch of his lanyard.
#clone_keycard:server_zone_badge
Narrator: He does not look down.
-> clone_debrief

// Round 2 (playtest): the sign-off went past unseen because the exit tag
// closed the chat on the same beat. A closing choice now holds it on screen.
// A reopen here replays the two lines, which is harmless.
=== clone_debrief ===
{ not netherton_card_taken:
    Narrator: The cloner did not get a clean read. He has not moved.
    -> back
}
Director Magnus Netherton: The server room is east of the operations floor. The archives take a passphrase, and the suite takes a code from my safe.
Director Magnus Netherton: The safe you can work out. Everyone here has the same bad habit, myself included.
Director Magnus Netherton: Whatever you are carrying, Agent, I did not see it.
+ [Understood, Director.]
    Director Magnus Netherton: Go.
    #exit_conversation
    -> back

// ================================================
// PASS 3 (P6): the door-audit check. when -> which of the three -> why not
// Vector -> why trust Phantom's printout. Rules (plan P6, R2-M5, R3-M1):
// - person-chat re-navigates to the TOP-LEVEL knot of the first choice's
//   sourcePath, so each step's choices live in their own top-level knot that
//   opens with the state check. PASS 4 (fix 3): the question now sits in that
//   knot too, after the check, so a reopen mid-check asks it again (pass 3 kept
//   it in a separate knot so a reopen replayed nothing, which left the player
//   looking at four answers with no question);
// - the counter and the booleans are set in choice-free knots, before any
//   visible text (audit_wrong, audit_right), which divert to hub;
// - booleans are set with ~ (the observer pushes declared globals) as well as
//   by tag;
// - "[Let me read it again.]" is a free exit at every step.
// ================================================
=== audit_case ===
// PASS 5 (B1): reachable from the box's account alone; a login is not a hand.
{ not found_badge_audit:
    // Alignment C3 (K3): no narrowing to two; the door audit does that.
    Director Magnus Netherton: On a login? A login is a key, Agent, not a hand on it.
    Director Magnus Netherton: Doors keep their own records. Bring me the door's.
    -> back
}
Director Magnus Netherton: Then don't give me a suspect. Give me a reading.
// The box's minute stands in for the timeline (step 1).
{ not (found_timeline or found_access_logs_hint or found_access_logs):
    Director Magnus Netherton: You've brought me a door. Bring me a clock. When was the plan opened? Somebody in this building has written it down.
    -> back
}
~ audit_skip_step4 = false
{ not (vector_audit_confirmed or nightshade_audit_confirmed):
    { (vector_ko or vector_hostile) and (nightshade_ko or nightshade_hostile):
        // R3-m3: both men on the audit are down; nobody can confirm it. Three steps.
        // Design C1 (D1): or hostile (punched, standing, won't talk): the same.
        ~ audit_skip_step4 = true
    - else:
        // PASS 5 (puzzle chains C1, m1): "the men who went through that lab door", so
        // Phantom's travel-desk row (circular at step 4) is plainly not the one.
        Director Magnus Netherton: Before you read it to me, take it to the men who went through that lab door. If a man's own row is wrong, he will say so.
        Director Magnus Netherton: Come back when one of them has told you it is right.
        -> back
    }
}
-> audit_c1

=== audit_c1 ===
{ mole_identified or audit_closed or named_on_evidence: -> hub }
Director Magnus Netherton: When was the plan opened?
+ [10:15 UTC.]
    ~ audit_reply = 1
    -> audit_wrong
+ [10:32 UTC.]
    ~ audit_reply = 1
    -> audit_wrong
+ [10:38 UTC.]
    -> audit_c2
+ [11:25 UTC.]
    ~ audit_reply = 2
    -> audit_wrong
+ [Let me read it again.]
    -> back

=== audit_c2 ===
{ mole_identified or audit_closed or named_on_evidence: -> hub }
Director Magnus Netherton: Which of the three was behind that door at 10:38?
+ [Vector.]
    ~ audit_reply = 3
    -> audit_wrong
+ [Nightshade.]
    -> audit_c3
+ [Phantom.]
    ~ audit_reply = 3
    -> audit_wrong
+ [None of them.]
    ~ audit_reply = 4
    -> audit_wrong
+ [Let me read it again.]
    -> back

=== audit_c3 ===
{ mole_identified or audit_closed or named_on_evidence: -> hub }
Director Magnus Netherton: Vector badged through the same door that morning. Why not him?
+ [The door log has him out of the lab at 10:32.]
    { audit_skip_step4:
        -> audit_right
    }
    -> audit_c4
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
    -> back

=== audit_c4 ===
{ mole_identified or audit_closed or named_on_evidence: -> hub }
Director Magnus Netherton: That audit is Phantom's query, off Phantom's printer. Why trust it?
+ [The people on it confirm their own rows.]
    -> audit_right
+ [Phantom's own row puts him on a plane.]
    ~ audit_reply = 8
    -> audit_wrong
+ [It agrees with the auth log Phantom pulled.]
    ~ audit_reply = 9
    -> audit_wrong
+ [It looks like a straight badge-system printout.]
    ~ audit_reply = 10
    -> audit_wrong
+ [Let me read it again.]
    -> back

=== audit_wrong ===
~ audit_misreads = audit_misreads + 1
~ audit_misread = true
// PASS 5 (B1): the third misread closes the check, and the fallback costs
// something. After flag 4 he reads it against the box himself, here
// (named_by_director; no suite code aloud). Before flag 4 he takes the audit
// over, which gets noticed (nightshade_tipped_off: whatever is still in the
// locker is cleared), and names him when the box comes in (flag-4 mapping B).
{ audit_misreads == 2:
    ~ audit_warned = true
}
{ audit_misreads >= 3:
    ~ audit_closed = true
    { found_access_logs:
        ~ mole_identified = true
        ~ named_by_director = true
        ~ told_name = true
    - else:
        { not nightshade_tipped_off:
            ~ tipoff_source = "director"
        }
        ~ nightshade_tipped_off = true
    }
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
- 10: Director Magnus Netherton: Paper says what the man at the printer wants it to. Who else will swear to it?
- else: Director Magnus Netherton: Somebody chose the query, Agent, and the window.
}
// PASS 5 (alignment C2, J5): the third misread is never a surprise.
{ audit_misreads == 2:
    { found_access_logs:
        Director Magnus Netherton: Once more like that and I read it myself, and the file will say that I had to. #set_global:audit_warned:true
    - else:
        Director Magnus Netherton: Once more like that and I take this off you, and I shall have to ask questions on the floor to do it. #set_global:audit_warned:true
    }
}
{ audit_closed:
    { named_by_director:
        Director Magnus Netherton: Enough. Give it to me. #set_global:audit_closed:true
        Narrator: He reads the audit against the box's minute himself. It takes him less than a minute. #set_global:named_by_director:true #set_global:mole_identified:true #complete_task:name_the_mole
        Director Magnus Netherton: Nightshade. I should not have had to do that, Agent, and nor should you.
        Director Magnus Netherton: The suite code is in my safe, with Dr Okafor's evaluation. Read hers before you face him.
    - else:
        Director Magnus Netherton: Enough. You've read me that log three ways. I shall take it from here, and that means asking questions on this floor. #set_global:audit_closed:true #set_global:nightshade_tipped_off:true
        Director Magnus Netherton: People will notice. If he did not know we were looking, he will soon. Get root on the box. When its logs come in, I will name him.
    }
}
-> back

=== audit_right ===
// PASS 5 (B1): this is now where the mole is named (mole_identified moved
// here off the flag-4 mapping). The old told_him beat is folded in.
~ named_on_evidence = true
~ mole_identified = true
~ told_name = true
{ not found_access_logs:
    ~ named_before_box = true
}
{ suspect_theory == "":
    ~ suspect_theory = "nightshade"
}
#complete_task:name_the_mole
#set_global:named_on_evidence:true
#set_global:mole_identified:true
Director Magnus Netherton: He walked into his own lab twenty-three minutes before that plan opened, and out again eighteen minutes after it closed.
{ found_access_logs:
    Director Magnus Netherton: And the box has an account on that terminal for those forty-seven minutes. A door and a login, at the same minute. That I can act on.
- else:
    Director Magnus Netherton: A door is not a login, and a court will want both. Get root on the box and bring me its logs.
}
Narrator: He puts one hand flat on the desk, as if the floor has moved.
Director Magnus Netherton: I sealed a warning about him a year ago and told myself it was prudence.
// PASS 5 (round 1 browser N6): "through the relay" only while it isn't.
{ all_flags_submitted:
    Director Magnus Netherton: The chain is in. He goes down to the suite now. The code is {suite_code}.
- else:
    Director Magnus Netherton: When the whole chain is through the relay, he goes down to the suite. The code is {suite_code}.
}
Director Magnus Netherton: The code card is in my safe as well, with Dr Okafor's evaluation. Read hers before you face him.
-> back

=== repeat_code ===
Director Magnus Netherton: {suite_code}. Commit it to memory this time, Agent.
-> back

=== done ===
// PASS 5 (B1): the naming can now happen here, so the sign-off follows it.
{ mole_identified:
    Director Magnus Netherton: Go. Finish the chain. I want it all in front of him.
- else:
    Director Magnus Netherton: Go. Whoever it is was one of us this morning. Bring me a name I can prove.
}
#exit_conversation
-> back

// PASS 4: true once each suspect has been interviewed or knocked down.
// Design C2 (N1): or punched and left standing (he won't talk again tonight).
=== function interviews_done() ===
~ return (vector_interviewed or vector_ko or vector_hostile) and (phantom_interviewed or phantom_ko or phantom_hostile) and (nightshade_interviewed or nightshade_ko or nightshade_hostile)
