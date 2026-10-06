// ================================================
// The Keyholder Trials: opening briefing (HaX, person-chat cutscene)
// DESIGN section 8, "The opening briefing". The Comms Discipline note is
// handed over on the very first line, so closing the scene early still
// delivers it (N2). Nothing here sets a global the game depends on.
// ================================================

=== start ===
#give_item:notes:comms_discipline
Agent HaX: Before anything else, read the note I've just sent you. If your phone is ever compromised, that's how you reach me.
+ [How does it reach you?]
    Agent HaX: That's classified. Next.
    -> cover
+ [I'll read it. Go on.]
    -> cover

=== cover ===
Agent HaX: Freshers' week at Miskatonic University. You're a first-year again.
Agent HaX: CryptoSecure Recovery has a stand in the Computing foyer. They're funding something called the Keyholder Studentship. Nine thousand a year, fees paid.
Agent HaX: Nobody applies. You're found, by solving a trail of puzzles around the building. They call it the Trials.
Agent HaX: Two of last year's Keyholders now work for CryptoSecure. CryptoSecure is Ransomware Incorporated with a logo.
+ [Ransomware Incorporated. Ghost's people.]
    Agent HaX: Yes. Ghost's. St Catherine's was theirs.
    -> ghost_known
+ [What do you want from me?]
    Agent HaX: Get picked. I want someone inside their recruitment.
    -> ghost

=== ghost ===
Agent HaX: Ransomware Incorporated is run by someone who calls themselves Ghost. St Catherine's was theirs.
-> ghost_known

=== ghost_known ===
Agent HaX: No name, no face. A voice on a console, and a hood on a screen.
+ [Ghost knows me. From St Catherine's.]
    -> why_me
+ [Then let's be found.]
    -> cliffe

=== why_me ===
Agent HaX: Ghost never saw your face. You saw theirs, near enough: a hood on a screen.
Agent HaX: And if they do know you and still want you, that tells us more than a clean recruit ever could.
Agent HaX: I'll take either.
-> cliffe

=== cliffe ===
Agent HaX: One more name. Dr Cliffe Schreuders. Builds Hacktivity. He'll know what you are within a minute of meeting you.
+ [Is he one of ours?]
    Agent HaX: That's classified too.
    -> deploy
+ [Noted.]
    -> deploy

=== deploy ===
Agent HaX: Every Trial opens with something you decode. You'll do it in CyberChef.
Agent HaX: Get a lab laptop from Dr Shaw in the teaching lab, west of the foyer. Then go and be found.
#exit_conversation
-> briefing_done

=== briefing_done ===
Agent HaX: Dr Shaw first. Then the stand.
+ [On my way.]
    Agent HaX: Good luck.
    #exit_conversation
    -> briefing_done
