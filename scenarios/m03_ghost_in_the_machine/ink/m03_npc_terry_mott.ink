VAR guard_influence = 0
VAR guard_hostile = false
VAR guard_suspicious = false
VAR player_warned = false
VAR bribe_offered = false
VAR bribe_accepted = false
VAR topic_shift = false
VAR topic_building = false
VAR topic_victoria = false
VAR guard_detection_count = 0
// Synced from globalVars: day (act1_meeting) vs night (act2_infiltration).
VAR mission_phase = ""
// Pass 2 blind fixes 2 (user, 2026-10-12): at night being seen means a challenge
// (los.challengeOnSight, player_spotted:terry_mott -> on_sighted), and being seen
// picking a lock means a fight. Local: he told the player to leave, so a second
// sighting is no longer a conversation.
VAR ordered_out = false
// Final round: re-entry lines on reopen, skipped once after an exit (quiet flags).
VAR hub_quiet = false
VAR idle_quiet = false
// Pass 2 dialogue round 2 (D2-13): day-only flags, so the day "knock off" question
// no longer spends the night's topic_shift, and a return visit gets a fresh line.
VAR day_greeted = false
VAR asked_knock_off = false
// D2-12: synced. "notebook" means Ffion told him the player would be about.
VAR ffion_night_story = ""
// Cycle 4 (D5-11): the player has answered his first question. A reload or reopen
// before that goes back to the question, not to "You again."
VAR excuse_given = false
VAR excuse_menu_quiet = false
// A4 fix pass: quiet flag for route_reply, so a reopen there re-asks his question.
VAR route_quiet = false
// Fix pass 2026-10-17 (regression F4): synced. Set by the scenario when a Restart
// calms him (npc_hostile_state_changed reset:true). fight_reset drops the fight
// memory and clears it; fight_was_reset picks his one wary line on the way back in.
VAR terry_fight_reset = false
VAR fight_was_reset = false

// Root divert. When a conversation has ended (-> DONE), the engine restores only
// its variables on the next talk and continues from the root (npc-conversation-
// state.js restoreNPCState). Without this line the root is empty and the player
// sees "(End of conversation)" instead of the start knot's re-entry routing.
-> start

=== start ===
#speaker:npc
{ terry_fight_reset:
    -> fight_reset
}
{ guard_hostile:
    #display:guard-hostile
    // Pass 2 blind fixes 2: after a lockpick catch he never told them to leave.
    Terry Mott: {ordered_out:I told you to leave.|Not another word.} I'm calling the police.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
}
{ mission_phase != "act2_infiltration":
    -> daytime
}
{ not player_warned:
    #display:guard-alert
    #set_global:guard_challenged:true
    Narrator: A torch beam swings round and settles on you.
    // Cycle 4, Terry's corridor as one scene. Sharpest first: he has already caught
    // the player at a lock (D5-3); then what Ffion told him (D3-2), with the
    // afternoon face folded into each line (D5-2); then the face alone (D4-3).
    {
    - guard_detection_count > 0:
        Terry Mott: You. The one with the picks. Let's hear it, then.
    - ffion_night_story == "notebook":
        Terry Mott: Ffion said there'd be someone about. Notebook, was it?{day_greeted: Should've known it'd be you.} Conference room's the other end of the building.
    - ffion_night_story == "sterling":
        Terry Mott: Ffion reckons Ms. Sterling's expecting you.{day_greeted: The three o'clock, back again.} She never said nothing to me.
    - ffion_night_story == "brushoff":
        Terry Mott: Ffion rang. Said someone come in at eleven and wouldn't say what for.{day_greeted: Didn't say it was the three o'clock.| That you?}
    // W3-5: he gets shorter, never louder.
    - day_greeted:
        Terry Mott: You. The three o'clock. Building's shut, and you're a long way from the conference room.
    - else:
        Terry Mott: Building's shut, mate. So you're either lost or you're trouble.
    }
    ~ player_warned = true
    ~ guard_suspicious = true
    -> first_excuse
}
// D5-11: warned but never answered (a reload or a closed chat at his question).
{ player_warned and not excuse_given and not bribe_accepted:
    -> excuse_menu
}
{ player_warned && bribe_accepted:
    #display:guard-neutral
    Terry Mott: We had a deal. Get on with it.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
}
{ (player_warned && not guard_hostile) && not bribe_accepted:
    #display:guard-suspicious
    { fight_was_reset:
        ~ fight_was_reset = false
        Terry Mott: Back on your feet, then. One wrong move and I'm on the radio.
    - else:
        // D3-20: varied re-entry.
        Terry Mott: {&You again.|Still here, then.|You're making my night very long.}
    }
    ~ hub_quiet = true
    -> hub
}

// Pass 2 blind fixes 2: the night sighting (player_spotted:terry_mott). The scenario
// skips sightings once he has waved the player on (guard_waved_on, set in hub), been
// paid, been told SAFETYNET, or turned hostile, so only three cases reach here: a
// first sighting (or one before the player answered him), a player he ordered out,
// and a player he already threatened with the police.
=== on_sighted ===
#speaker:npc
{ terry_fight_reset:
    -> fight_reset
}
{ mission_phase != "act2_infiltration":
    -> guard_idle
}
{ guard_hostile:
    #display:guard-hostile
    #hostile:terry_mott
    Terry Mott: Right. I warned you.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
}
{ ordered_out:
    #display:guard-hostile
    Narrator: The torch finds you again.
    Terry Mott: I told you to leave. You didn't.
    -> hostile_count
}
-> start

// Fix pass 2026-10-17 (regression F4, the Restart ruling): a Restart that calmed him
// undid the fight, so his "I warned you" memory goes with it. The challenge and the
// excuse he heard stay; the detection count stays for the debrief. Choice-free, so a
// reopen can't run it twice; start then routes as if the fight never happened.
=== fight_reset ===
~ guard_hostile = false
~ ordered_out = false
~ terry_fight_reset = false
#set_global:terry_fight_reset:false
// Only when start will land on the "You again." re-entry; a first challenge or the
// excuse question already reads right after a reset.
~ fight_was_reset = mission_phase == "act2_infiltration" and player_warned and excuse_given and not bribe_accepted
-> start

=== daytime ===
#speaker:npc
// D4-1 sweep: the day knot re-entered at night hands over to start.
{ mission_phase == "act2_infiltration":
    -> start
}
#display:guard-neutral
{ not day_greeted:
    ~ day_greeted = true
    Terry Mott: Afternoon. Executive wing's staff only, I'm afraid. Visitors stay in reception and the conference area.
    Terry Mott: If Ms. Sterling wanted you back here, she'd have told me. She hasn't.
- else:
    Terry Mott: {&Still staff only, mate.|Back again? Still staff only.|Conference room's the other way. Still.}
}
+ [Sorry -- wrong turn.]
    Terry Mott: Happens all the time. Conference room's back through to the main hallway and straight across.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
+ {not asked_knock_off} [When do you knock off?]
    ~ asked_knock_off = true
    Terry Mott: Knock off? Not till six tomorrow morning. Double shift. Afternoons in here, then the night rounds.
    Terry Mott: Why?
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

=== first_excuse ===
#speaker:npc
{
- guard_detection_count > 0:
    // The opener already asked.
- ffion_night_story == "notebook" or ffion_night_story == "sterling":
    Terry Mott: So what are you doing in my corridor?
- else:
    // W4-1, and only one "Well?" now (D5-4).
    Terry Mott: Go on, then. Why are you here?
}
~ excuse_menu_quiet = true
-> excuse_menu

// Choices only, re-entered on a reopen or reload before the player has answered.
=== excuse_menu ===
#speaker:npc
{ excuse_menu_quiet:
    ~ excuse_menu_quiet = false
- else:
    Terry Mott: Still waiting.
}
// D3-2: the notebook story has its own answer; a different story from the one
// Ffion heard gets noticed.
* {ffion_night_story == "notebook"} [Wrong turn. I'll find it.]
    ~ excuse_given = true
    Terry Mott: Then you've taken the scenic route. Through the executive wing.
    // D5-18: the player said they're leaving, so it ends here.
    Terry Mott: Back the way you came. And if I see you in here again, I won't be asking.
    ~ ordered_out = true
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
* [I work here -- research, second floor. Forgot something at my desk.]
    ~ excuse_given = true
    {
    - ffion_night_story == "notebook":
        ~ guard_influence = guard_influence - 5
        # influence_decreased
        Terry Mott: Funny. Ffion said notebook.
    - ffion_night_story == "sterling":
        ~ guard_influence = guard_influence - 5
        # influence_decreased
        Terry Mott: That's not what you told Ffion.
    }
    ~ guard_influence = guard_influence - 5
    # influence_decreased
    ~ guard_suspicious = true
    -> excuse_work_here
* [Sterling asked me to grab some files. We met today about the training programme.]
    ~ excuse_given = true
    {
    - ffion_night_story == "notebook":
        ~ guard_influence = guard_influence - 5
        # influence_decreased
        Terry Mott: Funny. Ffion said notebook.
        // D4-9: the catch has teeth; he doesn't wave the story through.
        Terry Mott: Notebook, files. Make your mind up. Get what you came for, and don't make me come looking.
        ~ hub_quiet = true
        -> hub
    - ffion_night_story == "sterling":
        ~ guard_influence = guard_influence + 10
        # influence_increased
        Terry Mott: Ffion said the same. Still nobody told me.
    - day_greeted:
        // D4-3: calls back his afternoon "she'd have told me. She hasn't."
        ~ guard_influence = guard_influence + 5
        # influence_increased
        Terry Mott: Ms. Sterling told me nothing about it. She told me nothing this afternoon either.
    - else:
        ~ guard_influence = guard_influence + 10
        # influence_increased
        Terry Mott: Ms. Sterling mentioned a potential recruit... alright.
    }
    -> excuse_victoria
* [Building maintenance, late shift. Checking the air con.]
    ~ excuse_given = true
    {
    - ffion_night_story == "notebook":
        ~ guard_influence = guard_influence - 5
        # influence_decreased
        Terry Mott: Funny. Ffion said notebook.
    - ffion_night_story == "sterling":
        ~ guard_influence = guard_influence - 5
        # influence_decreased
        Terry Mott: That's not what you told Ffion.
    }
    ~ guard_influence = guard_influence + 5
    # influence_increased
    Terry Mott: Maintenance? At eleven at night?
    -> excuse_maintenance
* [I'm with SAFETYNET. This is an active ENTROPY investigation.]
    ~ excuse_given = true
    -> safetynet_reveal

=== excuse_work_here ===
#speaker:npc
{ day_greeted:
    Terry Mott: You don't work here. You were in reception at three with a visitor badge.
- else:
    Terry Mott: I don't recognise you, and I know most of the faces here.
}
Terry Mott: You got ID? Key card?
* [Hold up the cloned executive card. This do you?]
    // D5-1: a guard who has just placed the face doesn't wave the CEO's card through.
    { day_greeted:
        ~ guard_influence = guard_influence + 5
        # influence_increased
        Terry Mott: A visitor badge at three and her card at eleven.
        Terry Mott: Either she's taken a shine to you or I'm in trouble. Don't be long.
    - else:
        ~ guard_influence = guard_influence + 15
        # influence_increased
        { guard_detection_count == 0:
            ~ guard_suspicious = false
        }
        Terry Mott: That's one of the exec cards. ...Right. Carry on.
        Terry Mott: Didn't have you down as a night person.
    }
    ~ hub_quiet = true
    -> hub
* [I'm new. Started this week. Still getting my permanent ID.]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    Terry Mott: New starters don't get nights. Not here.
    -> suspicious_path
* [That's what I came back for -- my ID badge. Left it at my desk.]
    ~ guard_influence = guard_influence - 10
    # influence_decreased
    ~ guard_suspicious = true
    Terry Mott: So you don't have ID, and you're here after hours. That's a problem.
    -> suspicious_path

=== excuse_victoria ===
#speaker:npc
Terry Mott: She does ring down at odd hours. Which files?
* [Training programme enrolment forms. From her office.]
    ~ guard_influence = guard_influence + 10
    # influence_increased
    // D5-4: an excuse that landed leaves him less cold; no greeting after a dismissal.
    { (not day_greeted or ffion_night_story == "sterling") and guard_detection_count == 0:
        ~ guard_suspicious = false
    }
    Terry Mott: Don't make me come looking for you.
    ~ hub_quiet = true
    -> hub
* [She didn't specify -- said I'd know them when I saw them. Confidential.]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    ~ guard_suspicious = true
    Terry Mott: Confidential, huh. Well, don't take too long.
    ~ hub_quiet = true
    -> hub

=== excuse_maintenance ===
#speaker:npc
Terry Mott: No work order, and you're not our usual lot.
Terry Mott: Who's your supervisor, then?
* [Ring the supervisor, then. Here's his mobile.]
    ~ guard_influence = guard_influence + 10
    # influence_increased
    Terry Mott: ...at this hour? Nobody's going to answer.
    Terry Mott: Fine. But I'm watching you.
    ~ guard_suspicious = true
    ~ hub_quiet = true
    -> hub
* [Emergency call. The temperature sensors tripped an alert. No time for paperwork.]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    Terry Mott: I didn't hear about any alerts...
    ~ guard_suspicious = true
    ~ hub_quiet = true
    -> hub
* [I don't have time for this. I've work to do.]
    ~ guard_influence = guard_influence - 20
    # influence_decreased
    ~ guard_hostile = true
    // Pass 5 (P3-8): hostile_confrontation counts this detection; counting it here too made one incident two.
    Terry Mott: Wrong answer.
    -> hostile_count

=== suspicious_path ===
#speaker:npc
{ day_greeted:
    Terry Mott: No badge, a visitor this afternoon, and back at eleven. Pull the other one.
- else:
    Terry Mott: No badge, a face I've never seen, and here at eleven at night. Pull the other one.
}
* [Maybe we can work something out. I need to finish here.]
    -> offer_bribe
* [Ring Ms. Sterling if you like. She'll vouch for me.]
    ~ guard_influence = guard_influence - 10
    # influence_decreased
    ~ guard_suspicious = true
    Terry Mott: *flatly* I'm not ringing the boss at this hour on your say-so.
    -> trespass_warning
* [I'm with SAFETYNET. This is an active ENTROPY investigation.]
    -> safetynet_reveal

=== offer_bribe ===
#speaker:npc
~ bribe_offered = true
Terry Mott: Are you trying to bribe me?
* [I can make it worth your while. A hundred quid, and you didn't see me.]
    -> bribe_response_low
* [Five hundred, cash. I'm in and out.]
    -> bribe_response_high
* [No, no. I just meant -- could you make an exception? A favour?]
    ~ guard_influence = guard_influence - 5
    # influence_decreased
    Terry Mott: *scoffs* No favours.
    -> trespass_warning

=== bribe_response_low ===
#speaker:npc
Terry Mott: A hundred quid? You think I'm risking my job for a hundred quid?
~ guard_hostile = true
~ guard_detection_count = guard_detection_count + 1
-> trespass_warning

=== bribe_response_high ===
#speaker:npc
Terry Mott: ...Five hundred?
Terry Mott: You finish whatever you're doing and you're gone. I never saw you.
Terry Mott: And if anyone asks, I was on the other side of the building doing rounds.
~ bribe_accepted = true
#set_global:guard_bribed:true
~ guard_influence = guard_influence + 30
# influence_increased
~ guard_suspicious = false
Narrator: You count five hundred into his hand.
~ idle_quiet = true
#exit_conversation
-> guard_idle

=== safetynet_reveal ===
#speaker:npc
// Pass 4 (fix 6): he rings Sterling, whatever he promises. Victoria's night
// opener and the debrief both read this.
#set_global:guard_told_safetynet:true
Terry Mott: SAFETYNET. Never heard of you. Is that meant to make me feel better?
* [Here are my credentials. I need your cooperation -- people get hurt if this goes wrong.]
    ~ guard_influence = guard_influence + 30
    # influence_increased
    ~ guard_suspicious = false
    Terry Mott: That's a lot of laminate for people nobody's heard of. Go on, then.
    Terry Mott: Ms. Sterling... she's involved in something?
    -> safetynet_cooperation
* [This is classified. Tell no one I was here. Not even Sterling.]
    ~ guard_influence = guard_influence + 20
    # influence_increased
    Terry Mott: Not even her. Right. I'm going to regret this.
    -> safetynet_cooperation
* [Help me, you help the people this is aimed at. Hinder me, you're obstructing.]
    ~ guard_influence = guard_influence + 25
    # influence_increased
    ~ guard_suspicious = false
    Terry Mott: Obstructing. Lovely. Fine. I'm not in your way.
    -> safetynet_cooperation

=== safetynet_cooperation ===
#speaker:npc
Terry Mott: What do you need from me?
- (coop_hub)
* [Just continue your normal patrol. Pretend you didn't see me.]
    ~ guard_influence = guard_influence + 10
    # influence_increased
    Terry Mott: Done. I'll be on the other side of the building if anyone asks.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
* [Tell me about Victoria Sterling. What's she like?]
    Terry Mott: Ms. Sterling? Sharp. Stays late. Looks straight through you.
    Terry Mott: Gets visitors who don't look like they've ever owned a tie.
    Terry Mott: But she pays well, so I don't ask questions.
    -> coop_hub
* [Have you noticed anything unusual? Strange visitors? Odd hours?]
    Terry Mott: More late meetings lately. Last week, some bloke who didn't give a name and didn't want telling twice.
    Terry Mott: And Ms. Sterling's had a packed bag under her desk since Tuesday. Didn't think anything of it till now.
    ~ guard_influence = guard_influence + 5
    # influence_increased
    -> coop_hub
+ [That's all. Carry on with your patrol.]
    Terry Mott: Right you are. I never saw you. I'm good at that, as it goes.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

=== hub ===
// Pass 2 blind fixes 2: reaching his hub means he has accepted the story, for now.
// From here a sighting no longer stops the player (challengeOnSight skipIfGlobal).
#set_global:guard_waved_on:true
{ hub_quiet:
    ~ hub_quiet = false
- else:
    // Cycle 3: cold while he doubts the player.
    { guard_suspicious:
        Terry Mott: {&Well?|I'm listening.|Something else?}
    - else:
        Terry Mott: {&Anything else, or are we done?|Go on, then.|Still here?}
    }
}
+ {not topic_shift} [Long night ahead of you?]
    -> ask_shift
+ {not topic_building} [Big place to cover on your own.]
    -> ask_building
+ {not topic_victoria} [What's Sterling like to work for?]
    -> ask_victoria
+ {(guard_influence >= 20) && not bribe_offered} [Maybe we can work something out.]
    -> offer_bribe
+ [I'll let you get on.]
    { guard_suspicious:
        Terry Mott: I've got your face now. Don't make me use it.
    }
    { not guard_suspicious:
        Terry Mott: Mind how you go.
    }
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

=== ask_shift ===
#speaker:npc
~ topic_shift = true
~ guard_influence = guard_influence + 5
# influence_increased
Terry Mott: {asked_knock_off:Told you this afternoon. On till six.|Double shift tonight. On till six.} Quiet, most nights.
{ guard_suspicious:
    Terry Mott: Though tonight's been more eventful than usual.
}
Terry Mott: I do my rounds. Doors, windows, anyone where they shouldn't be. Like you, possibly.
* [What's your route?]
    Terry Mott: Round the executive wing, mostly. Sterling's office, Mr Foster's, back down the corridor.
    Terry Mott: Why d'you want to know my route?
    ~ guard_suspicious = true
    ~ route_quiet = true
    -> route_reply
* [Must be boring work.]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    Terry Mott: Pays the mortgage. And nobody talks to me after nine, which suits me.
    -> hub
+ [Fair enough.]
    -> hub

// A4 fix pass (S6): he asks a straight question, so the player can answer it. Each
// answer returns to his hub (he has already waved the player on) or ends the chat,
// like the rest of his hub; the stakes stay those of on_sighted. Its own knot, so a
// reopen with these choices saved lands here, not on ask_shift's opener.
=== route_reply ===
#speaker:npc
{ route_quiet:
    ~ route_quiet = false
- else:
    Terry Mott: I asked you a question. My route. Why?
}
* [So I'm not under your feet. I'll be done before you come round again.]
    Terry Mott: Considerate. I'll be back past this door before long. Be done by then.
    ~ hub_quiet = true
    -> hub
* [No reason! Just... making conversation.]
    ~ guard_influence = guard_influence - 5
    # influence_decreased
    Terry Mott: Making conversation. At eleven at night. About my route.
    Terry Mott: I'll be making mine past this corridor a lot more often, then.
    ~ hub_quiet = true
    -> hub
* [Forget I asked. I'll get out of your way.]
    Terry Mott: Best idea you've had tonight.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

=== ask_building ===
#speaker:npc
~ topic_building = true
~ guard_influence = guard_influence + 5
# influence_increased
Terry Mott: It's an office, mate. Reception, conference rooms, a hallway, more offices.
Terry Mott: Server room's at the far end of the main hallway. The executive wing's east, where we're standing.
{ guard_influence >= 15:
    Terry Mott: Server room's usually locked. Executive-level access only.
}
* [What's in the executive area?]
    Terry Mott: Ms. Sterling's office, north side. Mr Foster's across from her.
    ~ guard_influence = guard_influence + 5
    # influence_increased
    -> hub
* [Any restricted areas?]
    Terry Mott: Server room's the main one. And Ms. Sterling doesn't like people in her office without permission.
    -> hub
+ [Right. Thanks.]
    -> hub

=== ask_victoria ===
#speaker:npc
~ topic_victoria = true
Terry Mott: Ms. Sterling? She's the boss. Signs my wages, never learnt my name. It's Terry, since you didn't ask.
{ guard_influence >= 20:
    Terry Mott: Between you and me, I keep out of her way. Everyone does.
    Terry Mott: And the people she meets with sometimes... they don't look like normal corporate clients.
}
{ guard_influence < 20:
    Terry Mott: Why are you asking about Ms. Sterling?
    ~ guard_suspicious = true
}
-> hub

=== trespass_warning ===
#speaker:npc
#display:guard-hostile
Terry Mott: I'm giving you one chance. Leave now, or I'm calling the police.
* [Alright, I'm going.]
    Terry Mott: Good. Off you go. I see you in here again, I'm not talking.
    ~ ordered_out = true
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
* [Try to run past the guard]
    Terry Mott: HEY! STOP!
    #hostile:terry_mott
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
* [Attack the guard]
    #hostile:terry_mott
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

// D5-12: the detection is counted in a choice-free knot, so a reopen of
// hostile_confrontation (which owns the choices) doesn't count it twice.
=== hostile_count ===
~ guard_hostile = true
~ guard_detection_count = guard_detection_count + 1
-> hostile_confrontation

=== hostile_confrontation ===
#speaker:npc
#display:guard-hostile
Terry Mott: Right. That's the police, then. Stay where you are.
Narrator: The guard reaches for his radio.
* [Tackle the guard before he can call]
    #hostile:terry_mott
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
* [Wait, wait! Hear me out.]
    Terry Mott: No more talking. You're trespassing.
    -> trespass_warning
* [Run]
    Terry Mott: Oi! Get back here!
    #hostile:terry_mott
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

// Pass 2 blind fixes 2 (user, 2026-10-12): being seen picking a lock is past talking.
// He turns hostile at once (#hostile runs at the start of this batch, so he is
// hostile as the chat closes). The detection still counts, for the debrief.
=== on_lockpick_detected ===
#speaker:npc
~ guard_suspicious = true
~ guard_hostile = true
~ guard_detection_count = guard_detection_count + 1
#display:guard-hostile
#hostile:terry_mott
// Pass 4 (fix 14): the office can be picked in the afternoon too, so the torch is
// night-only.
{ mission_phase == "act2_infiltration":
    Narrator: A torch beam lands on your hands, and on the pick in them.
- else:
    Narrator: The guard has stopped walking. He's looking at your hands, and the pick in them.
}
Terry Mott: Picks. Right. We're done talking.
~ idle_quiet = true
#exit_conversation
-> guard_idle

// Resting point (m02 pattern): exits never reach DONE, so the engine restores
// the story at these choices on the next talk. Every state has an option.
=== guard_idle ===
{ idle_quiet:
    ~ idle_quiet = false
- else:
    { terry_fight_reset:
        -> fight_reset
    }
    // D4-8: the first night meeting goes straight to his challenge (one torch, no
    // extra click). Inside the else, so it runs on a reopen, never on an exit.
    { mission_phase == "act2_infiltration" and (not player_warned or not excuse_given) and not guard_hostile and not bribe_accepted:
        -> start
    }
    { mission_phase != "act2_infiltration":
        Narrator: The guard stops his round and looks you over.
    - else:
        { guard_hostile:
            Terry Mott: Don't even think about it.
        - else:
            Narrator: The guard's torch swings your way again.
        }
    }
}
+ {mission_phase != "act2_infiltration"} [Nod to the guard]
    -> daytime
+ {mission_phase == "act2_infiltration" and guard_hostile} [Back off]
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
+ {mission_phase == "act2_infiltration" and not guard_hostile} [Talk to the guard]
    -> start
