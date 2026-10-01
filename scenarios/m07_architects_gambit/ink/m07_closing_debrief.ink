// ================================================
// Mission 7: The Architect's Gambit
// Closing debrief -- Director Magnus Netherton, secure link from SAFETYNET HQ, the same night
//
// Fired from global_variable_changed:mission_complete.
//
// Shape:
//   start -> the_win -> covered_operation -> revision_payoff
//         -> operations_gone_dark -> the_people
//         -> the_coda (two information levels) -> debrief_hub
//         -> the_stance -> handoff -> END
//
// Rules for this scene:
//   - Nobody absolves the player. Not Netherton, not HaX, not the narration.
//   - The two abandoned operations are read out by name and by number, always.
//   - The win is real. The floor still drops out. Both.
// ================================================

VAR player_name = "Agent 0x00"

// The win
VAR grid_saved = false
VAR countdown_expired = false

// The delegation
VAR team_assignment = ""
VAR team_redirected = false
VAR projection_revised = false
VAR redirect_declined = false

// People
VAR mercer_fate = ""
VAR mercer_stance = ""
VAR mercer_told_diversion = false
VAR elena_outcome = ""
VAR hollis_resolved = ""
VAR park_resolved = ""

// Knockout latches
VAR hollis_ko = false
VAR elena_ko = false
VAR mercer_ko = false
VAR park_ko = false
VAR vault_entered = false

// Lore
VAR found_tomb_gamma = false
VAR found_mole_evidence = false

// Written back
VAR debrief_stance = ""

// Local bookkeeping
VAR asked_tomb = false
VAR asked_how_he_knew = false
VAR asked_what_now = false


// ================================================
=== start ===
// PASS 2 (lesson 46): take_the_debrief now completes on the LAST line
// (handoff), so the bond_visualiser opens after the debrief, not over it.
// debrief_played stops a replay after a reload; a room-entry mapping on
// agent_0x99 completes the task if the page reloads mid-debrief.
#set_global:debrief_played:true

// PASS 2 review minor 10: the debrief is the same night, over the secure
// link (the text says "tonight" and "four hours ago" throughout).
Narrator: A borrowed office at the grid site, an hour after the abort, and the secure link back to SAFETYNET headquarters. On the screen, the quiet room behind the operations floor has its lights down.

Narrator: Director Magnus Netherton sits down in front of the camera with a tablet, in the same suit he was wearing when he briefed you.

Director Magnus Netherton: {player_name}. Sit down. This will not take long and you have earned the right to sit down for it.

-> the_win


// ================================================
=== the_win ===

{grid_saved and not countdown_expired:
    Director Magnus Netherton: The cascade sequence is terminated. All twenty-three transformers held. One hundred and forty-seven substations are carrying load and the regional operator is reporting nominal.
    Director Magnus Netherton: Eight point four million people have power tonight. The projection on that desk said two hundred and forty to three hundred and eighty-five dead. That number is now zero.
    Director Magnus Netherton: I am not going to qualify that. You did the thing. It is done.
- else:
    Director Magnus Netherton: The sequence was stopped. Late, and not tidily, but stopped.
}

{countdown_expired:
    Director Magnus Netherton: The first step ran before the abort went through. Seattle metro lost power until it did. Steps two to four never executed, and crews are bringing Seattle back substation by substation.
}

Narrator: He lets that stand for a moment. Then he turns the tablet over.

Director Magnus Netherton: The other three operations went ahead on schedule. I have the first reporting from all of them.

-> covered_operation


// ================================================
// Which operation the tactical team actually covered.
// ================================================
=== covered_operation ===

{
    - team_assignment == "fracture":
    -> covered_fracture
- team_assignment == "trojan_horse":
    { team_redirected:
        -> covered_trojan_redirect
    - else:
        -> covered_trojan_direct
    }
- team_assignment == "meltdown":
    -> covered_meltdown
- else:
    -> covered_none
}

= covered_fracture
Director Magnus Netherton: The team took the Washington data centre in eleven minutes. The exfiltration was already running. Sixty million voter records are gone and they are not coming back; those people will be dealing with it for the next several years.
Director Magnus Netherton: They also took the Social Fabric cluster intact, before deployment. The narrative package never launched. What happened tonight is a breach, a hearing and a very bad year for the agency that hosted it.
Director Magnus Netherton: It is not a constitutional crisis. The elections will run. That was not certain four hours ago.
Director Magnus Netherton: Three Ghost Protocol operatives in custody. Their tasking traffic gives us the first hard line between Michael Reeves and The Architect. That is the first of those we have ever had.
-> revision_payoff

= covered_trojan_direct
Director Magnus Netherton: The team reached TechForge before the injection run started. Hardware security modules seized. Eight hundred and forty signing keys burned and reissued. Two thousand four hundred vendors are having a miserable fortnight and no backdoor went anywhere.
Narrator: He scrolls. He reads the next part more slowly than the rest.
Director Magnus Netherton: The manifest was not what the brief said it was. A third of those keys sign electronic health record platforms. And computer-aided dispatch, in a substantial fraction of US counties. Nine-one-one call routing.
Director Magnus Netherton: The dormancy field said ninety days. The staged payload was set to wake in nine.
Narrator: He puts the tablet face down on the console.
Director Magnus Netherton: You had no way to know what you were choosing. I would like it noted that you chose it anyway.
-> revision_payoff

= covered_trojan_redirect
Director Magnus Netherton: The team went to Austin on your amended tasking. They arrived forty minutes behind the original window and the injection run was already going.
Director Magnus Netherton: They stopped it at roughly thirty per cent. Fourteen million systems took a signed backdoor before the plug came out. Remediation is a national programme now, not an incident, and it starts Monday.
Director Magnus Netherton: The health record and dispatch keys were sequenced late in the manifest. The team reached them first. Nobody's ambulance goes missing.
Director Magnus Netherton: Ninety days was the brief. Nine was the truth. You found that out with the clock running and you moved a committed team on it.
Narrator: He looks up for the first time since he started reading.
Director Magnus Netherton: You changed your mind under a countdown. Most people cannot.
-> revision_payoff

= covered_meltdown
Director Magnus Netherton: The team took the TechCore security operations centre, twenty-fourth floor, and turned it around. Emergency mitigations pushed to all twelve client networks inside the deployment window.
Director Magnus Netherton: The hospitals first, because that is what you were buying. No ransomware. No cancelled theatre lists. Four thousand two hundred hospitals ran a normal night and nobody died in one.
Director Magnus Netherton: Eight of the twelve targets held clean. Four took damage. A bank lost a day of transaction processing, a retailer lost payments over a weekend, two lost intellectual property that will be for sale by next month. Markets moved about three per cent and are already recovering.
Director Magnus Netherton: Two Digital Vanguard insiders detained inside the SOC and handed to the police. Ashford was not with them. Ashford is never with them.
-> revision_payoff

= covered_none
Director Magnus Netherton: There is no tasking record for the tactical element. It stood by in Denver for the duration and it went nowhere.
Director Magnus Netherton: I will need an explanation for that in writing. Not tonight.
-> revision_payoff


// ================================================
// What the revision was worth -- for players who found it and did not
// or could not act, and for players who never found it at all.
// ================================================
=== revision_payoff ===

{ projection_revised and team_redirected:
    -> operations_gone_dark
}

// PASS 2: the team was already on Trojan Horse -- the revision is what they
// were standing in, not a road not taken.
{ projection_revised and team_assignment == "trojan_horse":
    Director Magnus Netherton: Your field notes say you established that the Trojan Horse projection was understated. Dispatch systems on the key manifest. Nine days of dormancy, not ninety.
    Director Magnus Netherton: The team was already there. You found out what you had chosen while they were stopping it.
    Agent HaX: I logged it. For what it is worth, {player_name}, you found the thing that was designed not to be findable. That is the part I would keep.
    -> operations_gone_dark
}

{ projection_revised and not team_redirected:
    Director Magnus Netherton: Your field notes say you established that the Trojan Horse projection was understated. Dispatch systems on the key manifest. Nine days of dormancy, not ninety.
    // PASS 2: was "timestamped an hour and six minutes before the tactical
    // element was committed", impossible -- the team is committed in the
    // briefing, before the player is inside.
    {redirect_declined:
        Director Magnus Netherton: You raised it with the window still open, weighed moving the team, and held. That is on the record as a decision.
    - else:
        Director Magnus Netherton: The team was not moved on it.
    }
    Agent HaX: I logged it. For what it is worth, {player_name}, you found the thing that was designed not to be findable. That is the part I would keep.
    Agent HaX: The team not moving on it is a separate sentence, and I am not going to pretend it is the same one.
    -> operations_gone_dark
}

{ team_assignment != "trojan_horse":
    Director Magnus Netherton: One further note from analysis, added an hour ago. The Trojan Horse projection you were briefed with was wrong in two places, and wrong in the direction that made it easy to put down.
    Director Magnus Netherton: The evidence for that was in that building tonight. Two independent copies of it. Nobody read them.
}

-> operations_gone_dark


// ================================================
// The two that went unanswered. Always both. By name, by number.
// ================================================
=== operations_gone_dark ===

Narrator: He picks the tablet up again and holds it at a slight distance, the way people do when they have decided to read something out rather than say it.

// PASS 3 (puzzle-chains bug fix): an uncommitted team reads all three below.
{ team_assignment == "":
    Director Magnus Netherton: Three operations went unanswered. I am reading all three.
- else:
    Director Magnus Netherton: Two operations went unanswered. I am reading both.
}

{ team_assignment != "fracture":
    -> dark_fracture ->
}
{ team_assignment != "trojan_horse":
    -> dark_trojan ->
}
{ team_assignment != "meltdown":
    -> dark_meltdown ->
}

// PASS 2: sets up m08's "two of ours are dead at the sites the team could not reach".
Director Magnus Netherton: And two of ours. Names withheld until the families are told.

Narrator: He stops reading. He does not put the tablet down and he does not say anything to soften it, which is worse than if he had tried.

-> the_people


= dark_fracture
Director Magnus Netherton: Operation Fracture. The federal election security data centre, Washington. The exfiltration completed. One hundred and eighty-seven million voter records, full fidelity, forty-three states.
Director Magnus Netherton: The Social Fabric package deployed ninety minutes behind the breach, as designed, and it is credible because the breach underneath it is real. Deepfaked confessions from named officials. Fabricated fraud evidence built out of genuine stolen records.
Director Magnus Netherton: Two states have postponed. A third has certified a result that a third of its own population will never accept.
Director Magnus Netherton: Twenty to forty dead in the disorder over the coming week. The records are on four darknet markets by the weekend and there is no version of the future in which they are not.
->->

= dark_trojan
Director Magnus Netherton: Operation Trojan Horse. TechForge, Austin. The injection run completed. Forty-seven million systems have taken a signed, trusted, polymorphic backdoor.
Director Magnus Netherton: For nine days, nothing will happen at all.
Narrator: He pauses on the number. It is the only word he emphasises all night.
Director Magnus Netherton: Nine. The brief said ninety. The brief also said no projected fatalities.
Director Magnus Netherton: On day nine, computer-aided dispatch in eleven counties begins dropping emergency calls, in a pattern nobody attributes to an attack for another two days. Ninety to a hundred and sixty dead over the following month, spread thin enough that no single coroner sees a cluster.
Director Magnus Netherton: Health record platforms will start leaking, then start altering. Remediation means rebuilding eighteen thousand hospitals from bare metal.
{ projection_revised:
    Agent HaX: You knew. You found it and it did not move.
    Agent HaX: I am not saying that to punish you. I am saying it because somebody has to write it down, and it is going to be me.
}
->->

= dark_meltdown
Director Magnus Netherton: Operation Meltdown. Twelve targets, forty-seven zero-days, one command. Markets dropped fourteen per cent in the first session and trading halted on two exchanges. Banking transaction processing failed for eleven hours.
Director Magnus Netherton: That is what the news led with, so I have led with it too.
Director Magnus Netherton: The ransomware landed across four thousand two hundred hospitals. Eighteen thousand procedures cancelled in the first week. Eighty-seven million patient records gone.
Director Magnus Netherton: Eighty to a hundred and forty people did not survive that week, because the operation they were booked for became a spreadsheet nobody could open.
Director Magnus Netherton: It started tonight, on your clock, while you were in Portland saving a different eight million.
->->


// ================================================
// The people in this building. Nobody who was knocked down
// gets narrated as though they walked out.
// ================================================
=== the_people ===

Director Magnus Netherton: The site, then. Shorter list.

{
    - mercer_ko:
    Director Magnus Netherton: Dr. James Mercer went out of that control room on a stretcher and into custody at the bottom of the stairs. He is concussed and he has not said a word since he came round. Medical first, interview after.
- mercer_fate == "arrested":
    Director Magnus Netherton: Dr. James Mercer is in custody and talking, which is more than I expected. He signed the two-hundred-and-forty-to-three-hundred-and-eighty-five projection. He read it and he signed it.
- mercer_fate == "escaped":
    Director Magnus Netherton: Dr. James Mercer left the site before the cordon closed. We have a name, a face and no idea which country he is in. He will surface. His sort always does.
- else:
    Director Magnus Netherton: Blackout was still at the master console when you left that room. By the time the police reached it, he was not.
}

{
    - mercer_stance == "condemned":
    Director Magnus Netherton: You told him what he was. He recorded it in his own statement, which I find interesting.
- mercer_stance == "reasoned":
    Director Magnus Netherton: You argued with him. On the transcript it reads as though you were the only person in the room who thought he was worth arguing with.
- mercer_stance == "silent":
    Director Magnus Netherton: You gave him nothing. He appears to have found that harder than anything you could have said.
}

{ mercer_told_diversion:
    Director Magnus Netherton: And you told him he was a diversion. That the substation was never the operation and he was the noise around it.
    Director Magnus Netherton: He is a fanatic who has just been informed he was scenery. Whatever that does to a man, it is doing it now, wherever he is.
}

{
    - elena_ko:
    Director Magnus Netherton: Elena Rodriguez was found unconscious in the server room. She will be fine. She is also the only person on the ENTROPY side of this who was trying to stop it, which is going to make her statement an awkward document.
- elena_outcome == "turned":
    Director Magnus Netherton: Elena Rodriguez walked out and gave a statement without being asked twice. Six-hour blackout with a hospital carve-out was what she signed up for. She has read what she was actually part of.
    Director Magnus Netherton: Analysis wants her. I have not decided.
- elena_outcome == "fled":
    Director Magnus Netherton: Elena Rodriguez left the site before the cordon. She took nothing and she disabled nothing on her way out, which tells me something.
- else:
    Director Magnus Netherton: No contact logged with the Critical Mass engineer in the server hall. She is in the wind with everything she knows.
}

{
    - hollis_ko:
    Director Magnus Netherton: The checkpoint guard is at Providence with a head injury. Ray Hollis. Contract security, thirty-six, two children.
    // PASS 2: he was paid (his own ink: "a number in my account"), so the old
    // "no connection beyond a bad night" / "social engineering" lines contradicted him.
    Director Magnus Netherton: He was paid to renew Mercer's credentials in June and he has been spending the money ever since. The police will want to talk to him when he can talk.
- hollis_resolved == "talked":
    Director Magnus Netherton: Ray Hollis walked out to the muster point and waited there for the police. He is giving a full statement, including the payment for Mercer's credential renewal. He did not have to wait.
- hollis_resolved == "evaded":
    Director Magnus Netherton: The checkpoint guard is still at his post, and still on their payroll. We know his name. That will keep.
// PASS 3: nobody dealt with him (never spoken to, or he went for the agent and was left standing).
- else:
    {hollis_resolved == "ko":
        Director Magnus Netherton: The checkpoint guard was still at his post when the police reached the gate. Ray Hollis. He went for our agent and was left standing. We will be asking him why.
    - else:
        Director Magnus Netherton: The checkpoint guard was still at his post when the police reached the gate. Ray Hollis. Nobody had asked him anything yet. We will.
    }
}

{
    - park_ko:
    Director Magnus Netherton: Thomas Park was recovered unconscious in the cable vault, beside the control run to the backup transfer switch. He was four minutes from disabling the only thing standing between that control centre and a hard black start.
- park_resolved == "talked":
    // PASS 2: he walks out saying "I'm not going to help you", so he is not
    // "cooperating" and has given nothing up.
    Director Magnus Netherton: Thomas Park walked out of the vault and into the police cordon. He has said nothing beyond his name. He left the switch alone, which is the part that mattered.
// PASS 3: every live-Park state ends with the cut finished (he was four minutes out).
- park_resolved == "evaded":
    Director Magnus Netherton: Thomas Park finished what he went down there to do. He cut the control run to the transfer switch and walked out of a building we had cordoned.
    Director Magnus Netherton: Had the abort come any later, that control centre would have been running on nothing.
- park_resolved == "ko":
    Director Magnus Netherton: Thomas Park came at you in the vault and you left him to it. He finished. The control run to the transfer switch was cut when the police got down there, and he was not.
    Director Magnus Netherton: Had the abort come any later, that control centre would have been running on nothing.
- vault_entered:
    Director Magnus Netherton: You were in the vault with Thomas Park. He kept working, and he finished: the control run to the transfer switch was cut by the time the police got down there.
    Director Magnus Netherton: Had the abort come any later, that control centre would have been running on nothing.
- else:
    Director Magnus Netherton: Nobody went down to the cable vault until the police did. They found tools on an insulated mat and the control run to the transfer switch cut. Whoever did it was gone.
    Director Magnus Netherton: Had the abort come any later, that control centre would have been running on nothing.
}

-> the_coda


// ================================================
// Turn two of the twist. Two information levels.
// ================================================
=== the_coda ===

Narrator: Netherton lowers the tablet. For a few seconds nobody in the room says anything.

Agent HaX: Director. There is one more thing and it is not in the reporting yet.

{ found_mole_evidence:
    -> coda_full
- else:
    -> coda_thin
}

= coda_full
Agent HaX: {player_name} recovered an intercept from the cable vault. Outbound from a safetynet.gov address to The Architect. Four lines.
Agent HaX: Four targets, simultaneous. 0x00 to Portland. One team uncommitted. They will have to choose. Window, thirty minutes.
Narrator: The Director does not move.
Agent HaX: I have checked the header time against our own tasking order three times, because I did not believe it the first two. The message predates the deployment by fifty-one minutes.
Agent HaX: He had the assignment before we made it.
Director Magnus Netherton: Then the leak was not the timing.
Agent HaX: No, sir. The leak was the agent.
Narrator: There is a particular quiet that arrives when several people work out the same thing at slightly different speeds.
Agent HaX: The attack was never the point. Four operations, one clock, one team. He built a problem with no correct answer and he pointed a specific agent at it, and then he sat and watched what we protect when we can only protect one thing.
Agent HaX: How fast we decide. Which numbers we believe. Which of the three we put down first, and how long it takes us.
Agent HaX: He was not trying to beat you tonight. He was measuring you. And you gave him a clean reading.
-> coda_close

= coda_thin
Agent HaX: The taunts. He was on your handset as soon as you were on the operations floor, and he knew you were in Portland, and he knew there was one team and three targets he had not told anyone else about.
Agent HaX: I have gone back through the tasking chain twice. There is no window in it where he could have learned any of that.
Director Magnus Netherton: Then explain it.
Agent HaX: I cannot, sir. That is the report.
Narrator: Nobody fills the pause.
Agent HaX: What I can tell you is what the shape of tonight was. Four operations, one clock, one team, and a set of numbers we did not derive ourselves. That is not an attack. That is a test with a controlled variable.
Agent HaX: And the variable was you. There was somebody in that building who could have shown us how he set it up, and we did not find them.
-> coda_close

= coda_close
{ found_tomb_gamma:
    Agent HaX: The other thing from the vault. Tomb Gamma. Active, classed as a workshop, and the coordinate field in the record has been stripped. Not redacted. Stripped, before the copy was made.
    Agent HaX: "Everything the cells field has been through Gamma first. Including the people."
}
Director Magnus Netherton: Agent. Look at me.
{countdown_expired:
    Director Magnus Netherton: Seattle lost power for a while, and the rest of three states never did. That is not diminished by anything either of you has just said.
- else:
    Director Magnus Netherton: Eight point four million people have power. That is not diminished by anything either of you has just said.
}
Director Magnus Netherton: He measured you. He did not beat you.
Narrator: He says it with the flat certainty of a man reading a line he has decided to believe.
-> debrief_hub


// ================================================
// Hub -- optional questions, then the stance.
// ================================================
=== debrief_hub ===

- (options)
Director Magnus Netherton: {&Anything you want on the record before I close this?|Something else?|Go on.|Ask it.}

* {found_mole_evidence and not asked_how_he_knew} [Who sent that message, sir?]
    -> q_who_sent_it
* {not found_mole_evidence and not asked_how_he_knew} [Then how did he know where I would be, sir?]
    -> q_who_sent_it
* {not asked_tomb} [Tomb Gamma. Is that a place we can go?]
    -> q_tomb
* {not asked_what_now} [What happens to me now?]
    -> q_what_now
+ [Nothing on the record, sir. But I'll answer one thing.]
    -> the_stance

= q_who_sent_it
~ asked_how_he_knew = true
{ found_mole_evidence:
    Director Magnus Netherton: A safetynet.gov address with the local part removed before it reached us. That is deliberate and it is competent.
    Director Magnus Netherton: Level five clearance sees the tasking board before a deployment is issued. Level five is not a large room.
- else:
    Director Magnus Netherton: I do not know that a message exists, Agent. I know what he knew and I know when he knew it, and those two facts do not fit in the same organisation.
}
Director Magnus Netherton: I have counted, and I do not like the number, and I am not saying it out loud in a building I did not secure myself.
-> options

= q_tomb
~ asked_tomb = true
{ found_tomb_gamma:
    Director Magnus Netherton: Not yet. We have a designation, a classification and an empty coordinate field. That is not a place, it is the outline of one.
    Director Magnus Netherton: Somebody knows where it is. That somebody has been reading our tasking board.
- else:
    Director Magnus Netherton: The name is new to me. Log it in your field notes exactly as you heard it and do not put it in the operational summary.
}
-> options

= q_what_now
~ asked_what_now = true
Director Magnus Netherton: Regulation requires seventy-two hours of recovery leave after an operation of this classification. You will take it. That is not concern, it is section eleven.
Narrator: He looks at the dark window for slightly longer than the sentence needed.
Director Magnus Netherton: Then you will be read into something I would rather not be opening.
-> options


// ================================================
// The player's position on their own triage. Real state.
// ================================================
=== the_stance ===

Director Magnus Netherton: One question, then, and it goes in your file in your words rather than mine.
Director Magnus Netherton: Three briefs. One team. You sent it where you sent it. What is your position on that?

* [I made the call on the numbers in front of me. I would make it again.]
    #set_global:debrief_stance:defended
    Director Magnus Netherton: Good. That is the answer the handbook wants and it is defensible in any review room you will ever sit in.
    Director Magnus Netherton: It is also the answer he was hoping for, because it is the predictable one, and predictable is the thing he was shopping for tonight.
    Director Magnus Netherton: Keep the discipline. Change the numbers you trust.
    -> handoff

* [Two operations went dark because of a choice I made. That is mine to carry.]
    #set_global:debrief_stance:owned
    Director Magnus Netherton: It is not, entirely. But I have watched agents hand that weight to somebody else and I have not liked what they became afterwards.
    Director Magnus Netherton: So carry it. Carry it accurately, which is harder than carrying it heavily. You are responsible for the choice. You are not responsible for the menu.
    Director Magnus Netherton: The person who wrote the menu is still out there.
    -> handoff

* [Don't ask me to rank them, sir. I won't do that arithmetic twice.]
    #set_global:debrief_stance:refused
    Narrator: Netherton is quiet for a moment. It is not disapproval.
    Director Magnus Netherton: A vote, a life, and the security floor under every operation we run for the next decade. There is no exchange rate between those and anyone who offers you one is selling something.
    Director Magnus Netherton: I will note the refusal. I will also note that you did it anyway, tonight, because somebody had to.
    Director Magnus Netherton: Both of those things are true and you will have to live in the space between them. Most of us do.
    -> handoff

* [I want the numbers before he writes them. Next time.]
    #set_global:debrief_stance:hardened
    Director Magnus Netherton: Yes. That is the correct lesson and almost nobody gets to it this quickly.
    Director Magnus Netherton: Every figure you were briefed with tonight came from material we captured. We captured it because he allowed it to be captured. Our threat desk did not derive one of those numbers.
    Director Magnus Netherton: I will be raising that with the Council on Monday, and it will not be a pleasant meeting, and I intend to have it anyway.
    -> handoff


// ================================================
=== handoff ===

Narrator: Netherton closes the tablet cover with one hand and holds it against his chest, which is what he does instead of sighing.

Director Magnus Netherton: Above expectations, Agent. I do not say that often and I am not going to elaborate on it.

Director Magnus Netherton: Report to headquarters when your leave ends. Not to this room. Somewhere without windows.

Agent HaX: Sir?

Director Magnus Netherton: Somebody told him where we were sending our agent, and they did it before we had decided to send them. Until I know who, every briefing I give is a message to ENTROPY with a delay on it.

Director Magnus Netherton: So we stop giving them. And we find out who has been reading.

{countdown_expired:
    Narrator: Outside, Seattle is coming back one substation at a time. Across the rest of three states, people are asleep with the lights on, and none of them will ever know how close it came.
- else:
    Narrator: Outside, across three states, eight point four million people are asleep with the lights on, and none of them will ever know how close it came.
}

Narrator: Somewhere else, a man with the same figures on the same tablet is reading them with more satisfaction than he had any right to expect.

// PASS 2 (lesson 46): the conclusion aim's last task completes HERE, so the
// bond_visualiser and credits come after the debrief, not over it.
#complete_task:take_the_debrief
#exit_conversation
-> DONE
