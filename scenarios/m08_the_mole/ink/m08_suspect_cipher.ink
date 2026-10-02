// ================================================
// Mission 8: The Mole - Suspect: Agent 0x23 'Cipher' (RED HERRING, innocent)
// Speaker: Agent 0x23 'Cipher'
// Entry knot: start   Sets: cipher_interviewed
// Real investigation: alibi, cross-references, an accusation branch that hurts
// an innocent man. Rewards attention (his project detail seeds flag 3's mailbox).
// ================================================

// PASS 2: the task completes at the top of the first meeting (lesson 44);
// exits return to the hub (lesson 21); accused_cipher is a scenario global
// read by the debrief and credits.
VAR cipher_interviewed = false
VAR cipher_influence = 0
VAR suspect_theory = ""
VAR found_access_logs = false
VAR cipher_alibi_known = false
VAR asked_hours = false
VAR asked_alibi = false
VAR asked_others = false
VAR asked_project = false
VAR accused_cipher = false
VAR mole_identified = false
VAR apologised = false
// PASS 3 (P7): the door-audit beat, which also confirms his rows for P6 step 4.
VAR found_badge_audit = false
VAR cipher_audit_confirmed = false
VAR asked_audit = false
// PASS 4 (fix 13): m04's ENTROPY operative also went by "Cipher".
VAR asked_handle = false

=== start ===
{ cipher_interviewed:
    Agent 0x23 'Cipher': You again. Come to cross me off, or add me back on?
    -> hub
}
// PASS 2 review: set first; a brief-gated mapping completes interview_cipher (lesson 27).
~ cipher_interviewed = true
Narrator: Cipher does not look up until you are right on top of him, and then he looks up too fast, knocking a stylus off the desk.

Agent 0x23 'Cipher': I know how it looks. The hours, the locked screen, me flinching just now.
Agent 0x23 'Cipher': I've run the inference on myself and it's not flattering. Ask your questions, so I can watch you decide I'm boring.
-> hub

=== hub ===
+ { not asked_hours } [Why the odd hours, then?]
    ~ asked_hours = true
    Agent 0x23 'Cipher': Because the work is classified above the clerk who writes the roster.
    Agent 0x23 'Cipher': I can't put "post-quantum key exchange, do not disturb" on a shared calendar. So I look like I'm hiding something.
    Agent 0x23 'Cipher': I am. It's just a very boring something, with a great deal of maths in it.
    ~ cipher_influence += 1
    # influence_increased
    -> hub
+ { not asked_alibi } [Where were you when the Portland plan leaked?]
    ~ asked_alibi = true
    ~ cipher_alibi_known = true
    Agent 0x23 'Cipher': In the crypto library. Alone. The single worst alibi a person can offer, and completely true.
    Agent 0x23 'Cipher': The library logs its own door. And the terminal auth for the leak window will show my account never touched the mission_planning share.
    Agent 0x23 'Cipher': Whoever opened that plan did it from a Crypto Lab terminal. My desk is on the ops floor. Do the geography. #set_global:cipher_alibi_known:true
    -> hub
+ { found_badge_audit and asked_alibi and not asked_audit } [The door audit has you in the Crypto Lab that morning. You left that out.]
    ~ asked_audit = true
    ~ cipher_alibi_known = true
    ~ cipher_audit_confirmed = true
    Narrator: The colour goes out of his face.
    Agent 0x23 'Cipher': Eight minutes. I went in for a hardware token from the token cabinet, and I came out again.
    Agent 0x23 'Cipher': I left it out because I knew exactly how it would sound. #set_global:cipher_audit_confirmed:true
    -> hub
+ { asked_alibi and found_access_logs and not asked_project } [The logs back you. But your screen's still locked.]
    ~ asked_project = true
    Narrator: Something in his shoulders lets go.
    Agent 0x23 'Cipher': You actually checked. Thank you. The screen. Fine. It's a mailbox and a key schedule for the new exchange.
    Agent 0x23 'Cipher': If ENTROPY ever cracks our old crypto, what's on that box is what keeps them out of the next decade.
    Agent 0x23 'Cipher': That's the whole guilty secret. I've been working nights to protect the people who suspect me.
    ~ cipher_influence += 2
    # influence_increased
    -> hub
+ { not asked_others } [Who do you think it is?]
    ~ asked_others = true
    Narrator: He lowers his voice.
    Agent 0x23 'Cipher': Phantom reads logs he isn't cleared for. I've watched him do it over people's shoulders.
    Agent 0x23 'Cipher': But I'm frightened and pattern-matching in the dark, so weight that accordingly.
    -> hub
+ { not asked_handle } [Cipher. Same handle as the ENTROPY operative at the battery hall.]
    ~ asked_handle = true
    Narrator: His jaw sets.
    Agent 0x23 'Cipher': I had it first. Eleven years first. Then one of theirs turned up wearing it, and I'd love to know who told them it was mine.
    -> hub
+ { accused_cipher and mole_identified and not apologised } [The logs cleared you. I was wrong to say it.]
    ~ apologised = true
    Narrator: He takes his glasses off and cleans them on his shirt for longer than they need.
    Agent 0x23 'Cipher': Thank you. People don't usually come back to say that.
    Agent 0x23 'Cipher': They just stop looking at you, and you're meant to work out that you've been forgiven for something you didn't do.
    ~ cipher_influence += 2
    # influence_increased
    -> hub
+ { not mole_identified } [I think it's you, Cipher.] -> accuse
+ [That's all for now.] -> leave

=== accuse ===
~ accused_cipher = true
{ cipher_alibi_known:
    Narrator: He looks as if you have hit him.
    Agent 0x23 'Cipher': I told you where my badge was. You can check it in thirty seconds, and you're saying this anyway.
    Agent 0x23 'Cipher': Is it because I'm strange? Because I don't smile right?
    Agent 0x23 'Cipher': Do the maths again, please. The maths is the only friend I've got in this building.
    ~ cipher_influence -= 2
    # influence_decreased
- else:
    Narrator: He goes very still.
    Agent 0x23 'Cipher': On what? You haven't even pulled the auth logs. You've decided on my face.
    Agent 0x23 'Cipher': That's -- that's exactly how the wrong person walks free. You spend your suspicion on the easy target, and the careful one just... waits.
    ~ cipher_influence -= 2
    # influence_decreased
}
Agent 0x23 'Cipher': Go and check. Please. Then come back and say sorry, or come back with cuffs. Just don't leave it hanging.
-> hub

=== leave ===
{
- apologised:
    Agent 0x23 'Cipher': Go and finish it. And thank you. I mean that.
- accused_cipher and mole_identified:
    Agent 0x23 'Cipher': The logs have caught up with the right man, then. I'll be here, behind my monitors, being boring.
- accused_cipher:
    Agent 0x23 'Cipher': Check the logs. That's all I ask.
- else:
    Agent 0x23 'Cipher': {&You'll clear me on the evidence. Good. My face has never once done me a favour.|Back to the maths, then.|The library door log. It's all in there.}
}
#exit_conversation
-> hub
