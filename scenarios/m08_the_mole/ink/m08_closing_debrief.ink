// ================================================
// Mission 8: The Mole - Closing debrief
// Speaker: Director Magnus Netherton (the familiar SAFETYNET director from m07)
// Entry knot: start   Completes: take_the_debrief
// Branches on fate, the player's own suspicion history, and stance.
// conversation_closed:closing_debrief triggers victory + credits.
// PASS 2: debrief_played is set on the first line (reload guard, lesson 42);
// take_the_debrief completes on the LAST line (lesson 46); the handover wording
// follows canon (lesson 39); the debrief reads accusations, a KO'd Director and
// the no-coordinates case (only reachable through the KO safety net).
// ================================================

VAR player_name = "Agent 0x00"
VAR nightshade_arrested = false
VAR nightshade_triple_agent = false
VAR database_theft_understood = false
VAR nightshade_suspected = false
VAR suspect_theory = ""
VAR tomb_gamma_location_known = false
VAR debrief_stance = ""
VAR asked_how = false
VAR asked_database = false
VAR asked_next = false
VAR accused_cipher = false
VAR accused_phantom = false
VAR netherton_ko = false
// Round 2 (re-review m5): set only by the KO safety net before the fate.
VAR nightshade_ko_before_fate = false
VAR found_nightshade_profile = false
// PASS 3 (P6): the door-audit check
VAR named_on_evidence = false
VAR audit_misread = false
VAR audit_closed = false
// PASS 5 (B1, M5): how the name was reached, and the teacher's line.
VAR named_before_box = false
VAR named_by_hax = false
VAR asked_line = false
// PASS 5 (alignment C2, n7): the tip-off goes on the record.
VAR nightshade_tipped_off = false
VAR locker_seen_picked = false // PASS 5 (puzzle chains C1, m6): seen picking a locker

=== start ===
#set_global:debrief_played:true
// PASS 5 (round 1 browser N2): HaX's "Same classroom" text used to arrive as a
// phone text 2.5 s into this scene, which blocks the phone, and went unseen. It
// is read here, before Netherton speaks (M5, U4: a hedge, never a name).
{ not nightshade_ko_before_fate:
    Narrator: Your phone buzzes once in the corridor. HaX: "He said it to you? 'Afterwards, not during.' I was taught that line, and I say it to every agent I run. Same classroom, 0x00. Don't ask me whose yet."
}
Narrator: Netherton finds you, empty-handed. He looks older than he did at the briefing a few hours ago.
{ netherton_ko:
    Director Magnus Netherton: Before anything else. My jaw is fine, thank you for asking. We will not be discussing it.
}

Director Magnus Netherton: It's done, then. Agent 0x47. Nightshade.
Director Magnus Netherton: A year ago Dr Okafor put a warning about him on my desk. Ideological drift, she called it.
Director Magnus Netherton: I read it, and I sealed it. He was the best planner I had, and I did not want it to be true.
Director Magnus Netherton: Two of ours are dead in the space between what I knew and what I did.
Director Magnus Netherton: Say it, Agent. Whatever you think of me tonight. I would rather hear it than watch you swallow it.
-> stance

=== stance ===
+ [You had a warning and no proof, in a war. He's the crime, not you.]
    ~ debrief_stance = "defended"
    Director Magnus Netherton: Kinder than I would be. I shall carry it regardless. Thank you. #set_global:debrief_stance:defended
    -> the_hunt
+ { found_nightshade_profile } [Okafor warned you in writing. You sealed it. Own the gap, or it happens again.]
    -> owned
+ { not found_nightshade_profile } [You had a warning and you sealed it. Own the gap, or it happens again.]
    -> owned

= owned
    ~ debrief_stance = "owned"
    Narrator: A long beat.
    Director Magnus Netherton: Yes. I will put my own name in the report beside his. You were right to make me say it aloud. #set_global:debrief_stance:owned
    -> the_hunt

=== the_hunt ===
{ accused_cipher or accused_phantom:
    Director Magnus Netherton: {accused_cipher and accused_phantom:You accused both of the innocent men to their faces.|You accused {accused_cipher:Cipher|Phantom} to his face.} I read the transcripts.
    Director Magnus Netherton: It is in the file now, and it will follow {accused_cipher and accused_phantom:them|him} longer than it follows you.
}
{ locker_seen_picked:
    Director Magnus Netherton: You picked a colleague's locker in front of a witness, who then told the whole floor he saw nothing.
}
{ named_on_evidence:
    { named_before_box:
        Director Magnus Netherton: You named him to me before the box did, on something I could put in front of a lawyer. You read the clock, not the face.
    - else:
        Director Magnus Netherton: The box gave me a login. You gave me the man at the keyboard, off a door log. You read the clock, not the face.
    }
    { audit_misread:
        Director Magnus Netherton: Not on the first reading. I noticed. So would a lawyer.
    }
}
// PASS 3 (impl review M1): audit_closed has its own branch, so the closed-check
// line replaces the later tiers rather than stacking on them, and "the box made
// the case" is never said twice.
{
- named_by_hax:
    Director Magnus Netherton: You read the door audit to HaX while I was on my office floor. The name reached me secondhand.
    Director Magnus Netherton: Next time, bring the reading to me yourself.
- audit_closed:
    Director Magnus Netherton: You read me that door log three ways. In the end I read it myself.
    Director Magnus Netherton: Next time, read it once, and read it right.
- suspect_theory == "cipher" || suspect_theory == "phantom":
    Director Magnus Netherton: Your first name for me was the wrong one. You came back and corrected it, which is worth more than being right first.
    Director Magnus Netherton: Two good officers spent a night under a suspicion they did not earn. Buy them a drink. The service won't.
- named_on_evidence:
    Director Magnus Netherton: That, more than any instinct, is the reason you're still useful to me after they burned you.
- else:
    // impl review m4: a misread that was never followed up leaves a trace.
    { audit_misread:
        Director Magnus Netherton: You brought me that door log, read it wrong, and never came back to read it right. Noted.
    }
    {
    - nightshade_suspected or suspect_theory == "nightshade":
        Director Magnus Netherton: You had him before the evidence did. You sat across a desk from the calmest man in a frightened building and didn't buy the calm.
        Director Magnus Netherton: That instinct is the reason you are still useful to me after they burned you.
    - accused_cipher or accused_phantom:
        Director Magnus Netherton: You never gave me a name, but you gave one to a man's face. The box made the case in the end. Next time, let it make the case first.
    - audit_misread:
        Director Magnus Netherton: The box made the case. Next time, finish the reading before you bring it to me.
    - else:
        Director Magnus Netherton: You let the box make the case and kept your opinion to yourself until it was proven. Cold, and correct.
        Director Magnus Netherton: That is how the innocent walk out of a mole hunt with their careers intact.
    }
}
{ nightshade_tipped_off:
    Director Magnus Netherton: And he knew we were coming before we came. Whatever he had time to clear, we will never see now.
}
-> the_box

// PASS 5 (alignment M4): the VM chain, from what HaX said at each flag. A
// single player line on every path; it also breaks the debrief's long run.
=== the_box ===
+ [Our own code server let me in without a password, sir.]
    Director Magnus Netherton: And kept credentials in its history for anyone patient enough to read it. That goes in my report too.
    -> disposition

=== disposition ===
{ nightshade_triple_agent:
    Director Magnus Netherton: And you've kept him in play. A triple agent.
    Director Magnus Netherton: I approved it, and I want it on the record that I did so with my eyes open.
    Director Magnus Netherton: We are now a service that uses a man who trades lives, to save lives.
    Director Magnus Netherton: Watch him as you would a live wire. If he burns you, it is on my signature.
- else:
    { nightshade_ko_before_fate:
        Director Magnus Netherton: And you put him on the floor before he finished.
        Director Magnus Netherton: So he goes to the police with the case file, and without a word of his own on the record.
    - else:
        Director Magnus Netherton: And no deal. He goes to the police with every page of the case file, and a court hears what he did.
        Director Magnus Netherton: We have no claim on him after that, and we will not pretend to one.
    }
    { tomb_gamma_location_known:
        Director Magnus Netherton: Beyond what he gave freely tonight, it buys us nothing, and I do not care. Some lines you hold because they are the line.
    - else:
        Director Magnus Netherton: It buys us not one scrap of intelligence, and I do not care. Some lines you hold because they are the line.
    }
}
-> hub

=== hub ===
+ { not asked_how } [How did they get him in the first place, sir?]
    ~ asked_how = true
    Director Magnus Netherton: Training. His own, fifteen years ago. They took a tired young idealist and they waited.
    Director Magnus Netherton: There may be others in this service, recruited the same way and still waiting.
    Director Magnus Netherton: I shall spend the rest of my career reading our own files.
    -> hub
+ { database_theft_understood and not asked_database } [The database. How bad is it, honestly.]
    ~ asked_database = true
    Director Magnus Netherton: As bad as it gets. Every weakness we have ever catalogued is now theirs.
    Director Magnus Netherton: Portland, Austin, all of it was theatre, to cover the one door Nightshade left open.
    Director Magnus Netherton: Nine days ago we handed the enemy the map to every battle still coming.
    -> hub
// PASS 5 (alignment M5, U4): a hedge, never a name. The M9 reveal stays intact.
+ { not nightshade_ko_before_fate and not asked_line } [He used HaX's line. "Let it hurt afterwards, not during."]
    ~ asked_line = true
    Narrator: He is quiet for a moment.
    Director Magnus Netherton: Then whoever taught her taught him. There are not many people left who could have done both, and I do not like any of the names.
    Director Magnus Netherton: We will not say one aloud until we can prove it.
    -> hub
+ { not asked_next } [Then what now.] -> the_next
+ [Nothing more, sir.] -> close

=== the_next ===
~ asked_next = true
{ tomb_gamma_location_known:
    Director Magnus Netherton: Now we use the one thing tonight bought us. Tomb Gamma: a coordinate in Montana, from Nightshade's own mouth.
    Director Magnus Netherton: It is the first hard address we have ever had for The Architect's workshop, and it is where the database went.
    Director Magnus Netherton: That is where this ends, or where we do.
    Director Magnus Netherton: Take your seventy-two hours. Then we go to Montana and we get it back.
- else:
    Director Magnus Netherton: Now we find where the database went. We have a name from the vault, Tomb Gamma, and no coordinate.
    Director Magnus Netherton: He has it in his head, and the police will not be asking him for it. I will put the question to him before they do.
    Director Magnus Netherton: Take your seventy-two hours. We are not finished until we have that coordinate.
}
-> hub

=== close ===
Narrator: Netherton stops at the door.
Director Magnus Netherton: They spent fifteen years turning one of ours into a weapon and pointing it at the rest of us. Tonight you turned it round.
// Script edit round (S8, approved): the hook to the next mission plays on every path.
{ not asked_next:
    { tomb_gamma_location_known:
        Director Magnus Netherton: Montana in seventy-two hours, Agent. Tomb Gamma.
    - else:
        Director Magnus Netherton: Seventy-two hours, Agent. Then we find Tomb Gamma.
    }
}
Director Magnus Netherton: Go home. Sleep if the building will let you.
// PASS 2 (lesson 46): the conclusion aim's last task completes HERE, so the
// bond visualiser and credits come after the debrief, not over it.
#set_global:mission_complete:true
#complete_task:take_the_debrief
#exit_conversation
-> DONE
