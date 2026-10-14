// ================================================
// Mission 8: The Mole - Suspect: Agent 0x88 'Phantom' (RED HERRING, innocent)
// Speaker: Agent 0x88 'Phantom'
// Entry knot: start   Sets: phantom_interviewed
// He's running his own off-book mole hunt. Rewards the player who reads his
// notes (found_phantom_lead) with the Crypto Lab lead and the door audit in the
// archive printer (doors, not a name).
// ================================================

// PASS 2: the task completes at the top of the first meeting (lesson 44);
// exits return to the hub (lesson 21); accused_phantom is a scenario global
// read by the debrief and credits.
VAR phantom_interviewed = false
VAR phantom_influence = 0
VAR suspect_theory = ""
VAR found_phantom_lead = false
VAR phantom_alibi_known = false
VAR asked_absences = false
VAR asked_alibi = false
VAR asked_list = false
VAR asked_help = false
VAR accused_phantom = false
VAR mole_identified = false
VAR apologised = false
// PASS 3 (P7): the door-audit beat.
VAR found_badge_audit = false
VAR asked_audit = false
// PASS 5 (alignment C2, J4): his locker key, after the audit beat.
VAR gave_locker_key = false

=== start ===
{ phantom_interviewed:
    Agent 0x88 'Phantom': Back again. Either you've cleared me or you've got nothing. Which is it?
    -> hub
}
// PASS 2 review: set first; a brief-gated mapping completes interview_phantom (lesson 27).
~ phantom_interviewed = true
Agent 0x88 'Phantom': Agent 0x00. The Director's own bloodhound. Sit.
Agent 0x88 'Phantom': Let me save you the first four questions. Yes, I ask too much. Yes, I disappear for hours. Yes, I'm on your little list.
Agent 0x88 'Phantom': And yes, I put myself there too. Charmed?
-> hub

=== hub ===
+ { not asked_absences } [The unlogged absences. Explain them.]
    ~ asked_absences = true
    Agent 0x88 'Phantom': Two of ours are dead, and the official investigation is three men staring at each other across a corridor.
    Agent 0x88 'Phantom': So I've been off the books, working it myself. Server auth, alibis, logs I'm not cleared for.
    Agent 0x88 'Phantom': That's the absences. I've been doing your job since before you landed.
    ~ phantom_influence += 1
    # influence_increased
    -> hub
// PASS 5 (alignment M1): he no longer clears himself on the first question.
// The door audit's TRAVEL DESK row clears him (the audit beat below).
+ { not asked_alibi } [Where were you in the leak window?]
    ~ asked_alibi = true
    Agent 0x88 'Phantom': Out of the building. Where is my business.
    Agent 0x88 'Phantom': You want my morning, find something that logged it. I'm not making your job easy just because I'd like to be off your list.
    -> hub
+ { not asked_list } [Who's on your list?]
    ~ asked_list = true
    Agent 0x88 'Phantom': The other two on your list. I'm not putting a name to either until I've seen a door log.
    Agent 0x88 'Phantom': There's no money trail. So it's belief, or it's fear. I haven't worked out which.
    ~ phantom_influence += 1
    # influence_increased
    -> hub
// PASS 5 (M3): a wrong accusation costs his lead until the player apologises.
+ { found_phantom_lead and not asked_help } [I read your notes. The Crypto Lab terminal.]
    { accused_phantom and not apologised:
        Agent 0x88 'Phantom': You put it on me to my face. You don't get my notes as well.
        Agent 0x88 'Phantom': Apologise, or work it out on your own.
        -> hub
    }
    ~ asked_help = true
    Narrator: He leans in, and all the charm goes out of his face.
    Agent 0x88 'Phantom': Then you're further than I got. Someone's been in mission_planning from a Crypto Lab terminal.
    Agent 0x88 'Phantom': Forty-seven minutes, on a file you'd read in five.
    Agent 0x88 'Phantom': I couldn't get root on the repo to prove whose account it was. You've got the Director's blessing. I've got a reprimand pending.
    Agent 0x88 'Phantom': My door audit's still in the archive printer, if nobody's binned it. Doors tell you who was in the room. The box tells you when.
    ~ phantom_influence += 2
    # influence_increased
    -> hub
+ { found_badge_audit and not asked_audit } [Your audit was in the archive printer. Travel desk has you on the Zurich flight.]
    ~ asked_audit = true
    ~ phantom_alibi_known = true
    Narrator: He sits back, and for once he doesn't smile.
    Agent 0x88 'Phantom': So it printed. Wheels up 10:09, forty passengers and a manifest. I wanted to see whether you'd check or take my word.
    Agent 0x88 'Phantom': The archive duty officer walked me out before it finished. I never saw the rest, and I'd rather you didn't tell me.
    Agent 0x88 'Phantom': And don't take my word for my own printout. Ask the men on the lab door. #set_global:phantom_alibi_known:true
    -> hub
+ { asked_audit and not gave_locker_key } [Your locker in the break room. I want to see inside it.]
    ~ gave_locker_key = true
    #give_item:key:phantom_locker_key
    Narrator: He laughs, and fishes it out of his jacket.
    Agent 0x88 'Phantom': 0x88, the one with the luggage tag. Mind the folded sheet. It took me a week.
    -> hub
+ { accused_phantom and not mole_identified and not apologised } [I was wrong to put it on you. I'm sorry.]
    ~ apologised = true
    Agent 0x88 'Phantom': An apology before the evidence. Either you've found something, or you've got manners. I'll take either.
    -> hub
+ { accused_phantom and mole_identified and not apologised } [You were right. I was wrong to put it on you.]
    ~ apologised = true
    Agent 0x88 'Phantom': Accepted, and I'll be insufferable about it for a week. Then I'll stop, because you'll have earned that too.
    Agent 0x88 'Phantom': For what it's worth, I'd have accused me. Go and finish it.
    ~ phantom_influence += 2
    # influence_increased
    -> hub
+ { not mole_identified } [I think it's you, Phantom.] -> accuse
+ [We'll talk again.] -> leave

=== accuse ===
~ accused_phantom = true
{ phantom_alibi_known:
    Narrator: He laughs, without any warmth in it.
    Agent 0x88 'Phantom': I was thirty thousand feet over France with forty witnesses, and you know it, because you've read the travel desk.
    Agent 0x88 'Phantom': So either you're testing me or you're lazy, and I don't think you're lazy. Don't waste the night rattling the wrong man.
    ~ phantom_influence -= 1
    # influence_decreased
- else:
    Agent 0x88 'Phantom': Bold. On what? An empty morning on a roster, and a vibe?
    Agent 0x88 'Phantom': I've been hunting this leak longer than you've known it existed. Accuse me properly, or get out of my way and let one of us catch him.
    ~ phantom_influence -= 1
    # influence_decreased
}
-> hub

=== leave ===
{
- apologised:
    Agent 0x88 'Phantom': Go on. Finish it. I'll tell the Director you were right to look too.
- accused_phantom and mole_identified:
    Agent 0x88 'Phantom': So the logs got there. You still owe me an apology, but it can wait until he's in a room.
- accused_phantom:
    Agent 0x88 'Phantom': Pull the manifest. Then come and apologise, or come and cuff me. Not both.
- else:
    Agent 0x88 'Phantom': Go and get onto that repo. When the logs back me, tell the Director I was right to look.
}
#exit_conversation
-> hub
