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
VAR nightshade_confront_ko = false
VAR found_nightshade_profile = false

=== start ===
#set_global:debrief_played:true
Narrator: Netherton is waiting in the corridor outside the interrogation suite, without the tablet this time, which is somehow worse. He looks older than he did at the briefing, and the briefing was only hours ago.
{ netherton_ko:
    Director Magnus Netherton: Before anything else. My jaw is fine, thank you for asking. We will not be discussing it.
}

Director Magnus Netherton: It's done, then. Agent 0x47. Nightshade.
Director Magnus Netherton: A year ago Dr Okafor put a warning about him on my desk. Ideological drift, she called it. I read it, and I sealed it, because he was the best planner I had and I did not want it to be true. Two of ours are dead in the space between what I knew and what I did. Say it, Agent. Whatever you think of me tonight. I'd rather hear it than watch you swallow it.
-> stance

=== stance ===
+ [You had a warning and a war and no proof. You backed your best officer. He's the crime, not you.]
    ~ debrief_stance = "defended"
    Director Magnus Netherton: Kinder than I would be. I'll carry it regardless -- but thank you for the shape of it. #set_global:debrief_stance:defended
    -> the_hunt
+ { found_nightshade_profile } [Okafor told you in writing. You sealed it. Own the gap, or you'll do it again.]
    -> owned
+ { not found_nightshade_profile } [You had a warning and you sealed it. Own the gap, or you'll do it again.]
    -> owned

= owned
    ~ debrief_stance = "owned"
    Narrator: A long beat.
    Director Magnus Netherton: Yes. I'll put my own name in the report beside his. You were right to make me say it aloud. #set_global:debrief_stance:owned
    -> the_hunt

=== the_hunt ===
{ accused_cipher or accused_phantom:
    Director Magnus Netherton: {accused_cipher and accused_phantom:You accused both of the innocent men to their faces.|You accused {accused_cipher:Cipher|Phantom} to his face.} I read the transcripts. It is in the file now, and it will follow {accused_cipher and accused_phantom:them|him} longer than it follows you. That is how mole hunts damage the people who are not moles.
}
{ suspect_theory == "cipher" || suspect_theory == "phantom":
    Director Magnus Netherton: You told me early it was Cipher, or Phantom. You were wrong, and you came back and corrected it -- which is worth more than being right first. Two good officers spent a night under a suspicion they didn't earn. Go and buy them a drink; the service won't do it for you.
- else:
    { nightshade_suspected or suspect_theory == "nightshade":
        Director Magnus Netherton: You had him before the evidence did. You sat across a desk from the calmest man in a frightened building and you didn't buy the calm. I read the transcripts. That instinct is the reason you're still useful to me after they burned you.
    - else:
        Director Magnus Netherton: You let the box make the case and kept your own opinion out of it until it was proven. Cold, and correct. It's how the innocent walk out of a mole hunt with their careers intact.
    }
}
-> disposition

=== disposition ===
{ nightshade_triple_agent:
    Director Magnus Netherton: And you've kept him in play. A triple agent.
    Director Magnus Netherton: I approved it, and I want it on the record that I did so with my eyes open. We are now a service that uses a man who trades lives, to save lives. Watch him as you would a live wire, because that is what he is. If he burns you, it is on my signature, not yours.
- else:
    { nightshade_confront_ko:
        Director Magnus Netherton: And you put him on the floor before he finished. So he goes to the police, with the case file and without a word of his own on the record.
    - else:
        Director Magnus Netherton: And no deal. He goes to the police with every page of the case file, and a court hears what he did. We have no claim on him after that, and we will not pretend to one.
    }
    Director Magnus Netherton: It buys us not one scrap of intelligence and I do not care. Some lines you hold because they are the line, and a service that forgets that becomes the thing it hunts.
}
-> hub

=== hub ===
+ { not asked_how } [How did they get him in the first place, sir?]
    ~ asked_how = true
    Director Magnus Netherton: Training. Fifteen years ago, in your cohort. They took a tired young idealist and they waited. That is what we're up against -- not a break-in, a plantation. Somewhere in this service there may be others, put down like seeds, still years from flowering. I'll be checking soil for the rest of my career.
    -> hub
+ { database_theft_understood and not asked_database } [The database. How bad is it, honestly.]
    ~ asked_database = true
    Director Magnus Netherton: As bad as it gets. Every weakness we have ever catalogued is now theirs. Portland, Austin, all of it was theatre, to cover the one door Nightshade left open. Nine days ago we handed the enemy the map to every battle still coming.
    -> hub
+ { not asked_next } [Then what now.] -> the_next
+ [Nothing more, sir.] -> close

=== the_next ===
~ asked_next = true
{ tomb_gamma_location_known:
    Director Magnus Netherton: Now we use the one thing tonight bought us. Tomb Gamma. A coordinate in Montana that Nightshade handed you, and the first hard address we've ever had for The Architect's workshop. That is where the database went. That is where this ends, or where we do.
    Director Magnus Netherton: Take your seventy-two hours. Then we go to Montana and we get it back.
- else:
    Director Magnus Netherton: Now we find where the database went. We have a name from his files, Tomb Gamma, and no coordinate. He has it in his head, and the police will not be asking him for it. I will find a way to put the question to him before they do.
    Director Magnus Netherton: Take your seventy-two hours. We are not finished until we have that coordinate.
}
-> hub

=== close ===
Narrator: Netherton stops at the door.
Director Magnus Netherton: They spent fifteen years turning one of ours into a weapon and pointing it at the rest of us. Tonight you turned it back around. Go home, {player_name}. Sleep if the building will let you.
// PASS 2 (lesson 46): the conclusion aim's last task completes HERE, so the
// bond visualiser and credits come after the debrief, not over it.
#set_global:mission_complete:true
#complete_task:take_the_debrief
#exit_conversation
-> DONE
