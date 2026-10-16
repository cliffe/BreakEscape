// ================================================
// Mission 8: The Mole - Suspect: Agent 0x23 'Vector' (RED HERRING, innocent)
// Speaker: Agent 0x23 'Vector'
// Entry knot: start   Sets: vector_interviewed
// Real investigation: alibi, cross-references, an accusation branch that hurts
// an innocent man. Rewards attention (his project detail seeds flag 3's mailbox).
// ================================================

// PASS 2: the task completes at the top of the first meeting (lesson 44);
// exits return to the hub (lesson 21); accused_vector is a scenario global
// read by the debrief and credits.
VAR vector_interviewed = false
VAR vector_influence = 0
VAR suspect_theory = ""
VAR found_access_logs = false
VAR vector_alibi_known = false
VAR asked_hours = false
VAR asked_alibi = false
VAR asked_others = false
VAR asked_project = false
VAR accused_vector = false
VAR mole_identified = false
VAR apologised = false
// PASS 3 (P7): the door-audit beat, which also confirms his rows for P6 step 4.
VAR found_badge_audit = false
VAR vector_audit_confirmed = false
VAR asked_audit = false
// PASS 4 (fix 13): m04's ENTROPY operative also went by "Vector".
VAR asked_handle = false
VAR gave_locker_key = false
// Phase 4 dialogue C1 (D8-2): the m03/m07 quiet flag. Every return from inside
// the conversation and every exit comes through back, so the hub's re-entry
// line plays only on a re-talk (a reopen lands on hub, not start).
VAR hub_quiet = false

=== start ===
{ vector_interviewed: -> hub }
// PASS 2 review: set first; a brief-gated mapping completes interview_vector (lesson 27).
~ vector_interviewed = true
Narrator: Vector does not look up until you are right on top of him, and then he looks up too fast, knocking a stylus off the desk.

Agent 0x23 'Vector': I know how it looks. The hours, the locked screen, me flinching just now.
Agent 0x23 'Vector': I've run the inference on myself and it's not flattering. Ask your questions, so I can watch you decide I'm boring.
-> back

=== back ===
~ hub_quiet = true
-> hub

=== hub ===
{ not hub_quiet:
    {
    - mole_identified:
        Agent 0x23 'Vector': You again. I hear it's over. I'm still doing the maths on how I feel about that.
    - accused_vector and not apologised:
        Agent 0x23 'Vector': You again. Sorry, or cuffs?
    - else:
        Agent 0x23 'Vector': {&You again. Come to cross me off, or add me back on?|Back. Still boring, I promise.}
    }
}
~ hub_quiet = false
+ { not asked_hours } [Why the odd hours, then?]
    ~ asked_hours = true
    Agent 0x23 'Vector': Because the work is classified above the clerk who writes the roster.
    Agent 0x23 'Vector': I can't put "post-quantum key exchange, do not disturb" on a shared calendar. So I look like I'm hiding something.
    Agent 0x23 'Vector': I am. It's just a very boring something, with a great deal of maths in it.
    ~ vector_influence += 1
    # influence_increased
    -> back
+ { not asked_alibi } [Where were you when the Portland plan leaked?]
    ~ asked_alibi = true
    ~ vector_alibi_known = true
    Agent 0x23 'Vector': In the crypto library. Alone. The single worst alibi a person can offer, and completely true.
    Agent 0x23 'Vector': The library logs its own door. And the terminal auth for the leak window will show my account never touched the mission_planning share.
    Agent 0x23 'Vector': My desk is out on the ops floor. Do the geography. #set_global:vector_alibi_known:true
    -> back
// PASS 5 (alignment M3): a wrong accusation costs his confirmation of his own
// row (the Director's step-4 check) until the player apologises. Nightshade
// can still confirm his, so nothing soft-locks.
// Alignment C2 (n5): no hidden asked_alibi prerequisite; "You left that out"
// only when he has given the library alibi.
+ { found_badge_audit and asked_alibi and not asked_audit } [The door audit has you in the Crypto Lab that morning. You left that out.] -> audit_beat
+ { found_badge_audit and not asked_alibi and not asked_audit } [The door audit has you in the Crypto Lab that morning.] -> audit_beat
+ { asked_alibi and found_access_logs and not asked_project } [The logs back you. But your screen's still locked.]
    ~ asked_project = true
    Narrator: Something in his shoulders lets go.
    Agent 0x23 'Vector': You actually checked. Thank you. The screen. Fine. It's a mailbox and a key schedule for the new exchange.
    Agent 0x23 'Vector': If ENTROPY ever cracks our old crypto, what's on that box is what keeps them out of the next decade.
    Agent 0x23 'Vector': That's the whole guilty secret. I've been working nights to protect the people who suspect me.
    ~ vector_influence += 2
    # influence_increased
    -> back
+ { not asked_others } [Who do you think it is?]
    ~ asked_others = true
    Narrator: He lowers his voice.
    Agent 0x23 'Vector': Phantom reads logs he isn't cleared for. I've watched him do it over people's shoulders.
    Agent 0x23 'Vector': But I'm frightened and pattern-matching in the dark, so weight that accordingly.
    -> back
+ { not asked_handle } [Vector. Same handle as the ENTROPY operative in Battery Hall 1.]
    ~ asked_handle = true
    Narrator: His jaw sets.
    Agent 0x23 'Vector': I had it first. Eleven years first. Then one of theirs turned up wearing it, and I'd love to know who told them it was mine.
    -> back
// PASS 5 (M3): the apology is open before the evidence too, because the
// accusation now costs his row.
+ { accused_vector and not mole_identified and not apologised } [I was wrong to say that. I'm sorry.]
    ~ apologised = true
    #set_global:vector_apologised:true
    Narrator: He looks at you for a long second, as if checking the sum.
    Agent 0x23 'Vector': Before you've proved anything either way. That's either decent or tactical.
    Agent 0x23 'Vector': I'll take it. People don't usually come back at all.
    -> back
+ { accused_vector and mole_identified and not apologised } [The logs cleared you. I was wrong to say it.]
    ~ apologised = true
    #set_global:vector_apologised:true
    Narrator: He takes his glasses off and cleans them on his shirt for longer than they need.
    Agent 0x23 'Vector': Thank you. People don't usually come back to say that.
    Agent 0x23 'Vector': They just stop looking at you, and you're meant to work out that you've been forgiven for something you didn't do.
    ~ vector_influence += 2
    # influence_increased
    -> back
+ { asked_audit and not gave_locker_key } [Your locker in the break room. I want to see inside it.] -> locker_key
// Phase 4 dialogue C1 (D8-16): once said, it isn't on offer again.
+ { not mole_identified and not accused_vector } [I think it's you, Vector. (Out loud. The whole floor will hear.)] -> accuse
+ [That's all for now.] -> leave

=== audit_beat ===
{ accused_vector and not apologised:
    Narrator: His jaw sets.
    Agent 0x23 'Vector': You've already decided I did it. I'm not handing you another row to hang me with.
    Agent 0x23 'Vector': Apologise, or read it without me.
    -> back
}
~ asked_audit = true
~ vector_alibi_known = true
~ vector_audit_confirmed = true
Narrator: The colour goes out of his face.
Agent 0x23 'Vector': Eight minutes. I went in for a hardware token from the token cabinet, and I came out again.
Agent 0x23 'Vector': I left it out because I knew exactly how it would sound. #set_global:vector_audit_confirmed:true
-> back

// PASS 5 (alignment C2, J4): his locker, as Nightshade's: after the audit beat.
=== locker_key ===
~ gave_locker_key = true
#give_item:key:vector_locker_key
{ accused_vector and not apologised:
    Agent 0x23 'Vector': Go on, then. Add it to the pile. 0x23, the one with the stickers.
- else:
    Agent 0x23 'Vector': There's a project sheet in there you're not cleared for. Read it anyway. You'll only pick the lock otherwise.
}
-> back

=== accuse ===
~ accused_vector = true
{ vector_alibi_known:
    Narrator: He looks as if you have hit him.
    Agent 0x23 'Vector': I told you where my badge was. You can check it in thirty seconds, and you're saying this anyway.
    Agent 0x23 'Vector': Is it because I'm strange? Because I don't smile right?
    Agent 0x23 'Vector': Do the maths again, please. The maths is the only friend I've got in this building.
    ~ vector_influence -= 2
    # influence_decreased
- else:
    Narrator: He goes very still.
    Agent 0x23 'Vector': On what? You haven't even pulled the auth logs. You've decided on my face.
    Agent 0x23 'Vector': That's -- that's exactly how the wrong person walks free. You spend your suspicion on the easy target, and the careful one just... waits.
    ~ vector_influence -= 2
    # influence_decreased
}
Agent 0x23 'Vector': Go and check. Please. Then come back and say sorry, or come back with cuffs. Just don't leave it hanging.
-> back

=== leave ===
{
- apologised:
    Agent 0x23 'Vector': Go and finish it. And thank you. I mean that.
- accused_vector and mole_identified:
    Agent 0x23 'Vector': The logs have caught up with the right man, then. I'll be here, behind my monitors, being boring.
- accused_vector:
    Agent 0x23 'Vector': Check the logs. That's all I ask.
// Phase 4 dialogue C1 (D8-15): never accused, and the naming is done.
- mole_identified:
    Agent 0x23 'Vector': Go on. I've a key schedule that won't finish itself.
- else:
    Agent 0x23 'Vector': {&You'll clear me on the evidence. Good. My face has never once done me a favour.|Back to the maths, then.|The library door log. It's all in there.}
}
#exit_conversation
-> back
