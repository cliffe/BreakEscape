// ================================================
// Mission 7: The Architect's Gambit
// Closing debrief -- Director Magnus Netherton, secure link from SAFETYNET HQ, the same night
//
// Opened by closing_debrief's eventMappings (scenario.json.erb): on a closed
// screen after the Architect's sign-off, or on a room entry, once the grid is
// saved, all four flags are in and the debrief has been requested (PASS 4:
// HaX's "Bring me in", or the debrief_fallback timer).
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
// PASS 5 alignment r1 (M1): set by HaX's mapping when flag 3 lands before the
// control room door was ever opened.
VAR logged_in_before_door = false

// The delegation
VAR team_assignment = ""
VAR team_redirected = false
VAR projection_revised = false
VAR redirect_declined = false
// PASS 5 alignment r1 (M3): the correction landed while the team could still move.
VAR revision_found_open = false
// PASS 5 alignment r2 (A2, m1-m3): the decode was read (flag 1 reward); the
// correction was stated before the team was committed; the decode was read
// while the window was open and the team elsewhere.
VAR found_coordination_traffic = false
VAR revision_before_commit = false
VAR decode_read_open = false
// PASS 5 puzzle chains r1 (C2): the decode was read before the team was
// committed, and the deduction wasn't made then.
VAR decode_before_commit = false

// People
VAR mercer_fate = ""
VAR mercer_stance = ""
VAR mercer_told_diversion = false
VAR elena_outcome = ""
VAR elena_met = false
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
// Phase 4 dialogue C1 (D7-1): the between-read-outs beat asks this once.
VAR asked_on_me = false


// ================================================
=== start ===
// PASS 2 (lesson 46): take_the_debrief now completes on the LAST line
// (handoff), so the bond_visualiser opens after the debrief, not over it.
// debrief_played stops a replay after a reload; a room-entry mapping on
// agent_0x99 completes the task if the page reloads mid-debrief.
#set_global:debrief_played:true

// PASS 2 review minor 10: the debrief is the same night, over the secure
// link (the text says "tonight" and "four hours ago" throughout).
// Phase 4 dialogue C1 (D7-1): the two opening narrator lines merged.
Narrator: A borrowed office at the grid site, not long after the abort. On the secure link, Netherton sits down in front of the camera with a tablet, in the suit he briefed you in.

Director Magnus Netherton: Agent. Sit down. You have earned that much.

-> the_win


// ================================================
=== the_win ===

{grid_saved and not countdown_expired:
    Director Magnus Netherton: The sequence is terminated. All twenty-three transformers held. One hundred and forty-seven substations are carrying load.
    Director Magnus Netherton: Eight point four million people have power tonight.
    Director Magnus Netherton: The projection on my desk said two hundred and forty to three hundred and eighty-five dead. That number is now zero.
    Director Magnus Netherton: I am not going to qualify that. You did the thing. It is done.
- else:
    Director Magnus Netherton: The sequence was stopped. Late, and not tidily, but stopped.
}

{countdown_expired:
    Director Magnus Netherton: The first step ran before the abort went through. Seattle lost power until it did.
    Director Magnus Netherton: Steps two to four never ran. Crews are bringing Seattle back one substation at a time.
}

// PASS 5 alignment r1 (M1): the VM work, at game-design level. The debrief
// only opens with all four flags in, so this is never conditional on them.
Director Magnus Netherton: Their backup server shared its coordination file with anyone who asked. Its listener read the operator's password to anyone who connected. And that account could make itself root.
{countdown_expired:
    Director Magnus Netherton: Three doors they left open. You went through all of them.
- else:
    Director Magnus Netherton: Three doors they left open, and you went through all of them before the clock did.
}
// Phase 4 dialogue C1 (D7-1, beat 1): the player speaks after the win. The
// door-order line then answers "How close was it?" on every route.
+ [How close was it?]
+ [It doesn't feel done, sir.]
    Director Magnus Netherton: It will not, tonight. Count it anyway.
- {logged_in_before_door:
    Director Magnus Netherton: You logged in on their host before the control room door was open. The clock ran while you were on the wrong side of it.
- else:
    {countdown_expired:
        Director Magnus Netherton: You opened the door before you touched their host. That is the order that kept it to one step.
    - else:
        Director Magnus Netherton: You opened the door before you touched their host. That is the order that kept it clean.
    }
}

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
Director Magnus Netherton: The team took the Washington data centre in eleven minutes. Sixty million voter records were already gone. They are not coming back.
Director Magnus Netherton: They took the Social Fabric cluster before it published. What happened tonight is a breach, a hearing and a very bad year for somebody.
Director Magnus Netherton: The elections will run. That was not certain four hours ago.
Director Magnus Netherton: Three Ghost Protocol operatives are in custody. Their traffic is our first hard line between Michael Reeves and the Architect.
-> team_reaction

= covered_trojan_direct
Director Magnus Netherton: The team reached TechForge before the run started. Eight hundred and forty signing keys burned. No backdoor went anywhere.
Director Magnus Netherton: Two thousand four hundred vendors are having a miserable fortnight.
Narrator: He scrolls. He reads the next part more slowly than the rest.
// Phase 4 dialogue C1 (D7-6): manifest and dormancy merged into one line.
Director Magnus Netherton: The manifest was not what the brief said. A third of those keys sign health record and dispatch systems, and the payload wakes in nine days, not ninety.
Narrator: He puts the tablet face down on the console.
// PASS 5 alignment r2 (m1): a player who made the deduction (or heard Elena)
// before committing knew exactly what they were choosing.
// PASS 5 puzzle chains r1 (C2): the decode was in the player's kit at the
// commit, read but not put against the brief.
{
- revision_before_commit:
    Director Magnus Netherton: You read their schedule before you made the call, and sent the team where the brief said nothing would happen. I would like that noted.
- decode_before_commit:
    Director Magnus Netherton: Their schedule was in your kit when you made the call. Whatever you read in it, you sent them to Austin.
// Phase 4 dialogue C1 (D7-6): found after the commit. revision_payoff no
// longer repeats the figures.
- projection_revised:
    Director Magnus Netherton: You found out what you had chosen while they were stopping it.
- else:
    Director Magnus Netherton: You had no way to know what you were choosing. I would like it noted that you chose it anyway.
}
-> team_reaction

= covered_trojan_redirect
Director Magnus Netherton: The team went to Austin on your amended tasking. They arrived forty minutes late, with the run already going.
Director Magnus Netherton: They stopped it at roughly thirty per cent. Fourteen million systems took the backdoor first. The clean-up is a national programme, starting Monday.
Director Magnus Netherton: The dispatch and health-record keys were late in the sequence. The team reached them first. Nobody's ambulance goes missing.
Director Magnus Netherton: Ninety days was the brief. Nine was the truth. You found that out with the clock running, and moved a committed team on it.
Narrator: He looks up for the first time since he started reading.
Director Magnus Netherton: You changed your mind under a countdown. Most people cannot.
-> team_reaction

= covered_meltdown
Director Magnus Netherton: The team took TechCore's twenty-fourth floor and pushed defences to all twelve networks inside the window.
Director Magnus Netherton: The hospitals first, because that is what you were buying. Four thousand two hundred hospitals had an ordinary night.
// Phase 4 dialogue C1 (D7-2): four hours in, nothing has recovered yet.
Director Magnus Netherton: Eight of the twelve held clean. Four took damage, mostly money and stolen code. Futures are down three per cent.
Director Magnus Netherton: Two Digital Vanguard insiders were detained in the SOC. Ashford was not with them. Ashford is never with them.
-> team_reaction

= covered_none
// Phase 4 dialogue C1 (D7-40): airborne in the briefing, so it circled.
Director Magnus Netherton: There is no tasking record for the tactical team. It circled over Denver all night and went nowhere.
Director Magnus Netherton: I will need an explanation for that in writing. Not tonight.
-> team_reaction

// Phase 4 dialogue C1 (D7-1, beat 2): after the team's result. No reply
// absolves: the answer is deferred to the dark read-out.
= team_reaction
+ {team_assignment != ""} [Was it worth it?]
    Director Magnus Netherton: For the people the team reached, yes. That is the only half I can answer tonight.
+ {team_assignment == ""} [I couldn't choose, sir.]
    Director Magnus Netherton: Then the writing will be short. It will not be easy.
+ [Go on, sir.]
- -> revision_payoff


// ================================================
// What the revision was worth -- for players who found it and did not
// or could not act, and for players who never found it at all.
// ================================================
=== revision_payoff ===

{ projection_revised and team_redirected:
    -> revision_lesson
}

// PASS 2: the team was already on Trojan Horse -- the revision is what they
// were standing in, not a road not taken.
// Phase 4 dialogue C1 (D7-6): covered_trojan_direct now carries the figures
// and the timing, so only HaX's line is left here.
{ projection_revised and team_assignment == "trojan_horse":
    Agent HaX: I logged it. You found the thing that was built not to be found. That's the part I'd keep.
    -> revision_lesson
}

{ projection_revised and not team_redirected:
    Director Magnus Netherton: Your field notes say the Trojan Horse projection was understated. Nine days, not ninety, and dispatch on the manifest.
    // PASS 2: was "timestamped an hour and six minutes before the tactical
    // element was committed", impossible -- the team is committed in the
    // briefing, before the player is inside.
    // PASS 5 alignment r1 (M3): only a player who found it with the window
    // open hears that the team "did not move". Found after the window shut
    // (40 minutes, or the flag 3 login) is reported as found, not ignored.
    {
    - revision_found_open:
        // PASS 5 puzzle chains r1 (C1): deduced before the commit, then sent
        // elsewhere with the window open. A choice, not a team left standing.
        {
        - revision_before_commit and not redirect_declined:
            Director Magnus Netherton: You had it before you made the call, and sent the team elsewhere. The window stayed open after that.
        - redirect_declined:
            Director Magnus Netherton: You weighed moving the team with the window open, and held. That is on the record as a decision.
        - else:
            Director Magnus Netherton: The team was not moved on it.
        }
        Agent HaX: I logged it. You found the thing that was built not to be found. That's the part I'd keep.
        // Phase 4 dialogue C1 (D7-7): "The team not moving is a separate
        // sentence" cut; dark_trojan's "You knew" says it on the casualty figure.
    - team_assignment == "":
        Director Magnus Netherton: The team was never committed, on that or on anything else.
        Agent HaX: I logged it. You found the thing that was built not to be found. That's the part I'd keep.
    // PASS 5 alignment r2 (m2): held before the commit, then sent elsewhere
    // after a login had already shut the window.
    - revision_before_commit:
        Director Magnus Netherton: You had it before you made the call, and sent the team elsewhere.
        Agent HaX: I logged it. You found the thing that was built not to be found. That's the part I'd keep.
    // PASS 5 alignment r2 (m3): the decode was in hand with the window open;
    // the deduction came after it shut.
    - decode_read_open:
        Director Magnus Netherton: Their schedule was in your hands with the window open. You put it against the brief after it shut.
        Agent HaX: Late is still found. It goes in the report as late.
    // PASS 5 puzzle chains r1 (C2): read before the commit, the window shut by
    // a login while the team was still uncommitted. The timing was the player's.
    - decode_before_commit:
        Director Magnus Netherton: Their schedule was in your hands before you sent the team anywhere. You put it against the brief afterwards.
        Agent HaX: Late is still found. It goes in the report as late.
    - else:
        Director Magnus Netherton: You found it after the window had closed. That is in the report as found, not as ignored.
        Agent HaX: You found the thing that was built not to be found. The timing was his, not yours.
    }
    -> revision_lesson
}

{ team_assignment != "trojan_horse":
    Director Magnus Netherton: One note from analysis, added an hour ago. The Trojan Horse projection was wrong, in the direction that made it easy to set aside.
    // PASS 5 alignment r2 (A2): reading the decode no longer states the
    // deduction, so a player who read it and never called is not told
    // that nobody read it.
    {found_coordination_traffic:
        Director Magnus Netherton: Their own schedule was in your hands tonight. The Austin row said nine days. Nobody put it next to the brief.
    - else:
        Director Magnus Netherton: The evidence was in that building tonight. Two copies. Nobody read them.
    }
}

-> revision_lesson

// PASS 4 (design review fix 16): the mission's central lesson, for every
// player. It used to be heard only by the "hardened" stance.
// Phase 4 dialogue C1 (D7-1, beat 3): the player can say the twist.
= revision_lesson
Director Magnus Netherton: Every figure you were briefed with came from material we captured.
+ [He let us capture it.]
    Director Magnus Netherton: Yes. Our threat desk did not derive one of those numbers.
+ [Then whose numbers were they?]
    Director Magnus Netherton: His. The Architect let us capture them. Our threat desk did not derive one.
- -> operations_gone_dark


// ================================================
// The two that went unanswered. Always both. By name, by number.
// ================================================
=== operations_gone_dark ===

// Phase 4 dialogue C1 (D7-1): the narrator line that opened this cut.
// PASS 3 (puzzle-chains bug fix): an uncommitted team reads all three below.
{ team_assignment == "":
    Director Magnus Netherton: Three operations went unanswered. I am reading all three.
- else:
    Director Magnus Netherton: Two operations went unanswered. I am reading both.
}

// Phase 4 dialogue C1 (D7-1, beat 4): the player braces.
+ [Read them, sir.]
+ [I know what they were, sir.]
    Director Magnus Netherton: You know the briefs. These are the results.
-

// Phase 4 dialogue C1 (D7-1, beat 5): a beat between read-outs, never after
// the last one (meltdown is always last when it is dark).
{ team_assignment != "fracture":
    -> dark_fracture ->
    -> between ->
}
{ team_assignment != "trojan_horse":
    -> dark_trojan ->
    { team_assignment != "meltdown":
        -> between ->
    }
}
{ team_assignment != "meltdown":
    -> dark_meltdown ->
}

// PASS 2: sets up m08's "two of ours are dead at the sites the team could not reach".
// Phase 4 dialogue C1 (D7-1, beat 6): the line is the reply to either choice,
// so it can't add to the last read-out's run. The closing narrator line is cut.
+ [Is there more, sir?]
    Director Magnus Netherton: Two of ours. Names withheld until the families are told.
+ [(Wait.)]
    Director Magnus Netherton: And two of ours. Names withheld until the families are told.
- -> the_people

= between
+ {not asked_on_me} [How many of those are on me?]
    ~ asked_on_me = true
    Director Magnus Netherton: I will ask you that at the end, in your own words. Hear this one first.
+ {asked_on_me} [I'm keeping count, sir.]
+ [Go on.]
- ->->


= dark_fracture
Director Magnus Netherton: Operation Fracture. Washington. The exfiltration completed. Every voter record in forty-three states.
// Phase 4 dialogue C1 (D7-2): first reporting, four hours in.
Director Magnus Netherton: The Social Fabric package went out ninety minutes later, as designed.
Director Magnus Netherton: Two secretaries of state are already talking about postponing. The package is believable because the breach under it is real.
Director Magnus Netherton: The desk expects twenty to forty dead in the disorder this week. The records will be for sale by the weekend, permanently.
->->

= dark_trojan
// Phase 4 dialogue C1 (D7-1): two pairs merged, so the read-out fits a run of nine.
Director Magnus Netherton: Operation Trojan Horse. Austin. The injection run completed. Forty-seven million systems took a signed backdoor, and for nine days nothing will happen at all.
Narrator: He pauses on the number. It is the only word he emphasises all night.
Director Magnus Netherton: Nine. The brief said ninety. The brief also said no projected fatalities.
Director Magnus Netherton: On day nine, emergency dispatch in eleven counties starts dropping calls. Nobody will call it an attack for two more days.
Director Magnus Netherton: Ninety to a hundred and sixty dead over the following month, spread thin enough that no single coroner sees a cluster.
Director Magnus Netherton: Then the health record systems. Eighteen thousand hospitals rebuild from bare metal.
// PASS 5 alignment r1 (M3): "You knew" only when the team could still have moved.
{
// PASS 5 puzzle chains r1 (C1)
- revision_found_open and revision_before_commit and not redirect_declined:
    Agent HaX: You knew before you sent them, and you sent them somewhere else. That's the sentence I'm writing.
- revision_found_open:
    Agent HaX: You knew. You found it and it did not move.
    Agent HaX: I'm not saying it to punish you. Somebody has to write it down, and it's going to be me.
- projection_revised and team_assignment == "":
    Agent HaX: You found it, and the team still went nowhere.
// PASS 5 alignment r2 (m2, A2)
- revision_before_commit:
    Agent HaX: You had it before you sent them anywhere. That goes in the report too.
- projection_revised:
    Agent HaX: You found it after the window shut. I'm writing that down too, in those words.
- found_coordination_traffic:
    Agent HaX: It was in your hands. Nine days, in their own table.
}
->->

= dark_meltdown
// Phase 4 dialogue C1 (D7-2): first reporting, four hours in; the deaths are a projection.
Director Magnus Netherton: Operation Meltdown. Twelve targets, one command. Futures are down fourteen per cent, and banking has been dark since three.
Director Magnus Netherton: That is what the news led with, so I have led with it too.
Director Magnus Netherton: The ransomware is in four thousand two hundred hospitals. Every theatre list from this morning is cancelled.
Director Magnus Netherton: The desk projects eighty to a hundred and forty patients will not survive the week, waiting for operations nobody can schedule.
Director Magnus Netherton: It started tonight, on your clock, while you were in Portland saving eight point four million others.
->->


// ================================================
// The people in this building. Nobody who was knocked down
// gets narrated as though they walked out.
// ================================================
=== the_people ===

Director Magnus Netherton: The site, then. Shorter list.

{
    - mercer_ko:
    Director Magnus Netherton: Dr. James Mercer left that control room on a stretcher and in custody. He has not said a word since he came round.
- mercer_fate == "arrested":
    Director Magnus Netherton: Dr. James Mercer is in custody and talking, which is more than I expected. He read that projection and he signed it.
- mercer_fate == "escaped":
    Director Magnus Netherton: Dr. James Mercer left before the cordon closed. We have a name, a face and no idea which country. He will surface.
// Phase 4 dialogue C1 (D7-39): hostile and left standing.
- mercer_fate == "ko":
    Director Magnus Netherton: Dr. James Mercer came at you in that control room. By the time the police reached it, he was gone.
- else:
    Director Magnus Netherton: Dr. James Mercer was still at the master console when you left that room. By the time the police reached it, he was not.
}

// PASS 4 (design review fix 4): the statement and transcript exist only for
// a Mercer in custody and talking. Escaped, knocked down or walked off: the
// fate-neutral lines.
{
    - mercer_stance == "condemned":
    { mercer_fate == "arrested" and not mercer_ko:
        Director Magnus Netherton: You told him what he was. He recorded it in his own statement, which I find interesting.
    - else:
        Director Magnus Netherton: You told him what he was. He took that with him.
    }
- mercer_stance == "reasoned":
    { mercer_fate == "arrested" and not mercer_ko:
        Director Magnus Netherton: You argued with him. On the transcript you read as the only person who thought he was worth arguing with.
    - else:
        Director Magnus Netherton: You argued with him. He will remember being argued with.
    }
- mercer_stance == "silent":
    { mercer_fate == "arrested" and not mercer_ko:
        Director Magnus Netherton: You gave him nothing. He appears to have found that harder than anything you could have said.
    - else:
        Director Magnus Netherton: You gave him nothing. He will have found that harder than anything you could have said.
    }
}

// Phase 4 dialogue C1 (D7-1): every person in the site list gets one line.
{ mercer_told_diversion:
    Director Magnus Netherton: He also heard from you that he was scenery, there to keep us busy. Whatever that does to a man like him, it is doing it now.
}

{
    - elena_ko:
    Director Magnus Netherton: Elena Rodriguez came round in the server room, the only one on their side who tried to stop it. Her statement will be an awkward document.
- elena_outcome == "turned":
    Director Magnus Netherton: Elena Rodriguez gave a statement without being asked twice. Analysis wants her. I have not decided.
- elena_outcome == "fled":
    Director Magnus Netherton: Elena Rodriguez left before the cordon. She took nothing and broke nothing on her way out, which tells me something.
// PASS 4 (design review fix 3): met, but neither turned nor pressured.
- elena_met:
    Director Magnus Netherton: Elena Rodriguez talked to you and you left her at the rack. The police found her there, the hospital column half put back.
- else:
    Director Magnus Netherton: Nobody spoke to the engineer in the server hall. She is gone, with everything she knows.
}

{
    - hollis_ko:
    // PASS 2: he was paid (his own ink: "a number in my account"), so the old
    // "no connection beyond a bad night" / "social engineering" lines contradicted him.
    Director Magnus Netherton: The checkpoint guard is in hospital with a head injury. Ray Hollis, thirty-six, two children, paid to renew Mercer's credentials in June.
- hollis_resolved == "talked":
    // PASS 5 puzzle chains r1 (N1): on the talk route he refuses the police
    // and walks out through the muster door (his deal_take).
    Director Magnus Netherton: The police picked Ray Hollis up at the gate. He told you more about the vault than he has told us.
- hollis_resolved == "evaded":
    Director Magnus Netherton: The checkpoint guard is still at his post, and still on their payroll. We know his name. It will keep.
// PASS 3: nobody dealt with him (never spoken to, or he went for the agent and was left standing).
- else:
    {hollis_resolved == "ko":
        Director Magnus Netherton: Ray Hollis was still at his post when the police reached the gate. He went for our agent. We will be asking why.
    - else:
        Director Magnus Netherton: Ray Hollis was still at his post when the police reached the gate. Nobody had asked him anything yet. We will.
    }
}

{
    - park_ko:
    Director Magnus Netherton: Thomas Park was found unconscious in the cable vault, four minutes from cutting the backup power that control centre needed to restart.
- park_resolved == "talked":
    // PASS 2: he walks out saying "I'm not going to help you", so he is not
    // "cooperating" and has given nothing up.
    Director Magnus Netherton: Thomas Park walked out of the vault into the police cordon. He has given his name and nothing else. He left the switch alone.
// PASS 3: every live-Park state ends with the cut finished (he was four minutes out).
- park_resolved == "evaded":
    Director Magnus Netherton: Thomas Park cut the control run to the transfer switch and walked out through our cordon. A later abort, and that control centre runs on nothing.
- park_resolved == "ko":
    Director Magnus Netherton: Thomas Park came at you in the vault, finished the cut and was gone before the police got down. A later abort, and that control centre runs on nothing.
- vault_entered:
    Director Magnus Netherton: You were in the vault with Thomas Park. He kept working, and he finished. A later abort, and that control centre runs on nothing.
- else:
    Director Magnus Netherton: Nobody reached the cable vault before the police. Tools on a mat, the control run cut. A later abort, and that control centre runs on nothing.
}

-> the_coda


// ================================================
// Turn two of the twist. Two information levels.
// ================================================
=== the_coda ===

Narrator: Netherton lowers the tablet. Nobody speaks.

// Phase 4 dialogue C1 (D7-1): a beat between the site list and the coda.
+ [Then it's over.]
    Agent HaX: Not quite. Director, one more thing. It isn't in the reporting yet.
+ [(Say nothing.)]
    Agent HaX: Director. One more thing. It isn't in the reporting yet.
- { found_mole_evidence:
    -> coda_full
- else:
    -> coda_thin
}

= coda_full
Agent HaX: Our agent recovered an intercept in the cable vault. From a safetynet.gov address, to the Architect. Four lines.
// Phase 4 dialogue C1 (D7-41): forty, as the intercept document says.
Agent HaX: Four targets, simultaneous. 0x00 to Portland. One team uncommitted. They will have to choose. Window, forty minutes.
Narrator: The Director does not move.
// Phase 4 dialogue C1 (D7-1, beat 7)
+ [That's my deployment. Word for word.]
    Agent HaX: Down to the forty minutes.
+ [When was it sent?]
- Agent HaX: I've checked the time against our tasking order three times. I didn't believe the first two.
Agent HaX: It predates the deployment order by fifty-one minutes.
Agent HaX: He had the assignment before we gave it.
Director Magnus Netherton: Then the leak was not the timing.
Agent HaX: No, sir. The leak was the agent.
// Phase 4 dialogue C1 (D7-1): merged; the list line cut.
Agent HaX: He built a problem with no right answer, pointed one agent at it, and watched what we protect when we can only protect one thing.
Agent HaX: He was measuring you tonight. You gave him a clean reading.
-> coda_close

= coda_thin
// Phase 4 dialogue C1 (D7-10): his first call can come at the checkpoint or later.
Agent HaX: The calls. He had your handset tonight, and your designation.
Agent HaX: He knew you were in Portland. He knew there was one team and three targets.
// Phase 4 dialogue C1 (D7-1, beat 7, thin)
+ [Nobody outside SAFETYNET knew that.]
+ [How?]
- Agent HaX: I've been through the tasking chain twice. There's no point where he could have learned any of that.
Director Magnus Netherton: Then explain it.
Agent HaX: I can't, sir. That's the report.
Narrator: Nobody fills the pause.
Agent HaX: Four operations, one clock, one team, and numbers we didn't derive ourselves. That's a test with a controlled variable.
Agent HaX: The variable was you. Something in that building could have shown us how he did it. We didn't find it.
-> coda_close

// Phase 4 dialogue C1 (D7-1): Tomb Gamma moved to the hub (q_tomb), for a
// player who found it. Beat 8 before "Look at me".
= coda_close
+ [Then he got what he came for.]
+ [What does he do with a reading?]
- Director Magnus Netherton: Agent. Look at me.
{countdown_expired:
    Director Magnus Netherton: Seattle lost power for a while. The rest of three states never did. Nothing either of you has said changes that.
- else:
    Director Magnus Netherton: Eight point four million people have power. Nothing either of you has said changes that.
}
Director Magnus Netherton: He measured you. He did not beat you.
Narrator: He says it like a line he has decided to believe.
-> debrief_hub


// ================================================
// Hub -- optional questions, then the stance.
// ================================================
=== debrief_hub ===

- (options)
Director Magnus Netherton: {&Anything you want on the record before I close this?|Anything else?|Anything further?|Is that everything?}

* {found_mole_evidence and not asked_how_he_knew} [Who sent that message, sir?]
    -> q_who_sent_it
* {not found_mole_evidence and not asked_how_he_knew} [Then how did he know where I would be, sir?]
    -> q_who_sent_it
// PASS 4 (design review fix 5): only for a player who has heard the name.
* {found_tomb_gamma and not asked_tomb} [Tomb Gamma. Is that a place we can go?]
    -> q_tomb
* {not asked_what_now} [What happens to me now?]
    -> q_what_now
// Phase 4 dialogue C1 (D7-8): the question hasn't been asked yet.
+ [Nothing on the record, sir.]
    -> the_stance

= q_who_sent_it
~ asked_how_he_knew = true
{ found_mole_evidence:
    Director Magnus Netherton: A safetynet.gov address, the name stripped before it reached us. Deliberate, and competent.
    Director Magnus Netherton: Level five clearance sees the tasking board before a deployment goes out. Level five is a small room.
- else:
    Director Magnus Netherton: I do not know that a message exists. I know what he knew, and when. Those two facts do not fit in one organisation.
}
Director Magnus Netherton: I have counted, and I do not like the number. I will not say it in a building I did not secure myself.
-> options

= q_tomb
~ asked_tomb = true
Agent HaX: The dossier from the vault says active, classed as a workshop. The coordinates were stripped before the copy was made.
Agent HaX: "Everything the cells field has been through Gamma first. Including the people."
Director Magnus Netherton: Not yet. A designation, a classification and the outline of a place.
Director Magnus Netherton: Somebody knows where it is. That somebody has been reading our tasking board.
-> options

= q_what_now
~ asked_what_now = true
Director Magnus Netherton: Regulation requires seventy-two hours of recovery leave after an operation like this. You will take it. Section eleven.
Narrator: He looks at the dark window a little too long.
Director Magnus Netherton: Then you will be read into something I would rather not be opening.
-> options


// ================================================
// The player's position on their own triage. Real state.
// ================================================
=== the_stance ===

Director Magnus Netherton: One question, then, and it goes in your file in your words rather than mine.
// Phase 4 dialogue C1 (D7-4): a player who never sent the team is asked
// about that, and can't claim a call they didn't make.
{team_assignment == "":
    Director Magnus Netherton: Three briefs. One team, and you never sent it. Where do you stand on that?
- else:
    Director Magnus Netherton: Three briefs. One team. You sent it where you sent it. Where do you stand on that?
}

* {team_assignment != ""} [I made the call on the numbers I had. I'd make it again.]
    #set_global:debrief_stance:defended
    // PASS 5 puzzle chains r1 (N3): not "Good" straight after "Nobody put it
    // next to the brief" to a player who read the decode and never deduced.
    // Phase 4 dialogue C1 (D7-9): nor after a correction held with the window open.
    {
    - revision_found_open and not team_redirected and not redirect_declined:
        Director Magnus Netherton: The numbers you had changed while the window was open, and the team stayed where it was. That answer will need more than one sentence in a review room.
    - found_coordination_traffic and not projection_revised and team_assignment != "trojan_horse":
        Director Magnus Netherton: That answer will stand up in a review room. You also had their schedule in your hands tonight, and you didn't put it next to the brief.
    - else:
        Director Magnus Netherton: Good. That answer will stand up in any review room you ever sit in.
    }
    Director Magnus Netherton: It is also the predictable answer. Predictable is what he was shopping for tonight.
    Director Magnus Netherton: Keep the discipline. Change the numbers you trust.
    -> handoff

* {team_assignment != ""} [Two operations went dark because of a choice I made. That is mine to carry.]
    #set_global:debrief_stance:owned
    Director Magnus Netherton: Partly. I have watched agents hand that weight to someone else, and I did not like what they became.
    Director Magnus Netherton: So carry it accurately, which is harder than carrying it heavily. The choice was yours. The menu was his.
    Director Magnus Netherton: And he is still out there.
    -> handoff

* {team_assignment == ""} [I didn't make the call. Three went dark. That's mine.]
    #set_global:debrief_stance:owned
    Director Magnus Netherton: It is. Leaving the team in the air was the most expensive answer on the board.
    Director Magnus Netherton: Carry it accurately. The menu was his. Leaving it unordered was yours.
    -> handoff

// Phase 4 dialogue C1 (D7-4, fixer's addition): the uncommitted player never
// did the sum, so neither the choice nor the reply says they did.
* [Don't ask me to rank them, sir. {team_assignment == "":I didn't tonight and I won't now.|I won't do that arithmetic twice.}]
    #set_global:debrief_stance:refused
    Narrator: Netherton is quiet for a moment.
    Director Magnus Netherton: There is no exchange rate between a vote and a life. Anyone who offers you one is selling something.
    {team_assignment == "":
        Director Magnus Netherton: I will note the refusal. You made it tonight as well, and three operations went dark while you did.
        Director Magnus Netherton: That one you will have to live with.
    - else:
        Director Magnus Netherton: I will note the refusal. I will also note that you did the sum anyway, tonight, because somebody had to.
        Director Magnus Netherton: You will live between those two. Most of us do.
    }
    -> handoff

* [I want the numbers before he writes them. Next time.]
    #set_global:debrief_stance:hardened
    // PASS 5 alignment r2 (N1): no praise for speed straight after "You knew"
    // to a player who held the correction with the window open and let it
    // pass. A redirect weighed and declined is a decision, so it keeps it.
    {
    - revision_found_open and not team_redirected and not redirect_declined:
        Director Magnus Netherton: Yes. You had one of his numbers in your hands tonight. Next time it moves the team.
    // PASS 5 puzzle chains r1 (N3, fixer's addition): the same speed praise
    // would follow "Nobody put it next to the brief".
    - found_coordination_traffic and not projection_revised and team_assignment != "trojan_horse":
        Director Magnus Netherton: Yes. Their schedule was in your hands tonight. Next time it goes next to the brief.
    // Phase 4 dialogue C1 (D7-4)
    - team_assignment == "":
        Director Magnus Netherton: Yes. Next time, make the call while you work it out.
    - else:
        Director Magnus Netherton: Yes. Almost nobody gets there this quickly.
    }
    Director Magnus Netherton: I will raise it with the Council on Monday. It will not be a pleasant meeting. I intend to have it.
    -> handoff


// ================================================
=== handoff ===

Narrator: Netherton closes the tablet cover and holds it against his chest, which is what he does instead of sighing.

// PASS 5 alignment r1 (m7): not for a night with no team sent or Seattle dark.
// PASS 5 alignment r2 (N1): nor when the correction was found with the window
// open and the team left where it was without a declined redirect.
// PASS 5 puzzle chains r1 (N3): nor after "Nobody put it next to the brief".
{team_assignment != "" and not countdown_expired and not (revision_found_open and not team_redirected and not redirect_declined) and not (found_coordination_traffic and not projection_revised and team_assignment != "trojan_horse"):
    Director Magnus Netherton: Above expectations, Agent. I do not say that often and I am not going to elaborate on it.
- else:
    Director Magnus Netherton: You finished it, Agent. I will write the rest myself.
}

Director Magnus Netherton: Report to headquarters when your leave ends. Not to this room. Somewhere without windows.

// Phase 4 dialogue C1 (D7-1, fixer's addition): the stance reply and the
// handoff ran 13 lines without a choice.
+ [Why without windows, sir?]
+ [(Say nothing.)]
    Agent HaX: Sir?
- Director Magnus Netherton: Somebody told him where we were sending our agent before the order went out.
Director Magnus Netherton: Until I know who, every briefing I give is a message to ENTROPY with a delay on it.

Director Magnus Netherton: So we stop giving them. And we find out who has been reading.

{countdown_expired:
    Narrator: Outside, Seattle comes back one substation at a time. Across the rest of three states, people sleep with the lights on.
- else:
    Narrator: Outside, across three states, people are asleep with the lights on.
}

Narrator: Somewhere else, a man reads the same figures on the same kind of tablet, and is pleased with them.

// PASS 2 (lesson 46): the conclusion aim's last task completes HERE, so the
// bond_visualiser and credits come after the debrief, not over it.
#complete_task:take_the_debrief
#exit_conversation
-> DONE
