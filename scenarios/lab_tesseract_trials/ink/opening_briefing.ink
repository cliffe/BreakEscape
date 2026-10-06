// ================================================
// The Keyholder Trials: opening briefing (HaX, person-chat cutscene)
// Background hq4 (the field HQ). The last knot switches the background to the
// campus with person-chat's Background[...] line and hands over to the
// narrator: the transition to the building plays inside the briefing, so it
// runs once, never replays after a reload (skipIfGlobal briefing_played), and
// leaves no gap for the Mission Brief popup (backgrounds round).
// DESIGN section 8, "The opening briefing". The Comms Discipline note is
// handed over on the very first line, so closing the scene early still
// delivers it (N2). Nothing here sets a global the game depends on.
// ================================================

=== start ===
#give_item:notes:comms_discipline
Agent HaX: Before anything else, read the note I've just sent you. If your phone is ever compromised, that's how you reach me.
+ (asked_reach) [How does it reach you?]
    Agent HaX: That's classified. Next.
    -> cover
+ [I'll read it. Go on.]
    -> cover

=== cover ===
Agent HaX: Freshers' week at Miskatonic University. You're a first-year again.
Agent HaX: CryptoSecure Recovery has a stand in the Computing foyer. They're funding something called the Keyholder Studentship. Nine thousand a year, fees paid.
Agent HaX: Nobody applies. You're found, by solving a trail of puzzles around the building. They call it the Trials.
Agent HaX: Two earlier Keyholders now work for CryptoSecure. CryptoSecure is Ransomware Incorporated with a logo.
+ [Ransomware Incorporated. Ghost's people.]
    Agent HaX: Yes. Ghost's. St Catherine's was theirs. A hospital. Not everyone on the ward lived.
    -> ghost_known
+ [What do you want from me?]
    Agent HaX: Get picked. I want someone inside their recruitment.
    -> ghost

=== ghost ===
Agent HaX: Ransomware Incorporated is run by someone who calls themselves Ghost. St Catherine's was theirs. A hospital. Not everyone on the ward lived.
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
    Agent HaX: That's classified{start.asked_reach: too}.
    -> deploy
+ [Noted.]
    -> deploy

=== deploy ===
Agent HaX: Every Trial opens with something you decode. You'll do it in CyberChef.
Agent HaX: Get a lab laptop from Dr Shaw in the teaching lab, west of the foyer. Then go and be found.
-> campus

=== campus ===
Background[assets/backgrounds/miskatonic_campus.png]:
Narrator[player]: Miskatonic University. Freshers' week.
Narrator[player]: Bunting on the portico, music from the lawn, and a thousand new students trying to look as if they know where they're going.
Narrator[player]: You join them. New lanyard, new tote bag, a timetable you haven't read. Nobody looks at you twice.
#exit_conversation
Narrator[player]: The Computing building is through the columns. Someone has put a CryptoSecure stand right inside the door.
-> briefing_done

=== briefing_done ===
Agent HaX: Dr Shaw first. Then the stand.
+ [On my way.]
    Agent HaX: Good luck.
    #exit_conversation
    -> briefing_done
