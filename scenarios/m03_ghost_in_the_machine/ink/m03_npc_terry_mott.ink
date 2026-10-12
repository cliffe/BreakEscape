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
// Synced scenario global (pass 3b): set on a catch, cleared when the player leaves the
// corridor, so one approach costs one strike however often they retry in his view.
VAR guard_grace = false
// Final round: re-entry lines on reopen, skipped once after an exit (quiet flags).
VAR hub_quiet = false
VAR idle_quiet = false
// Pass 2 dialogue round 2 (D2-13): day-only flags, so the day "knock off" question
// no longer spends the night's topic_shift, and a return visit gets a fresh line.
VAR day_greeted = false
VAR asked_knock_off = false
// D2-12: synced. "notebook" means Ffion told him the player would be about.
VAR ffion_night_story = ""

// Root divert. When a conversation has ended (-> DONE), the engine restores only
// its variables on the next talk and continues from the root (npc-conversation-
// state.js restoreNPCState). Without this line the root is empty and the player
// sees "(End of conversation)" instead of the start knot's re-entry routing.
-> start

=== start ===
#speaker:npc
{ guard_hostile:
    #display:guard-hostile
    Terry Mott: I told you to leave. I'm calling the police.
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
    // D3-2: what the player told Ffion at eleven has reached him, whichever answer.
    {
    - ffion_night_story == "notebook":
        Terry Mott: Ffion said there'd be someone about. Notebook, was it? Conference room's the other end of the building.
    - ffion_night_story == "sterling":
        Terry Mott: Ffion reckons Ms. Sterling's expecting you. She never said nothing to me.
    - ffion_night_story == "brushoff":
        Terry Mott: Ffion rang. Said someone come in at eleven and wouldn't say what for. That you?
    - else:
        Terry Mott: Hey! What are you doing here? Building's closed for the night.
    }
    ~ player_warned = true
    ~ guard_suspicious = true
    -> first_excuse
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
    // D3-20: varied re-entry.
    Terry Mott: {&You again.|Still here, then.|You're making my night very long.}
    ~ hub_quiet = true
    -> hub
}

=== daytime ===
#speaker:npc
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
{ ffion_night_story == "notebook" or ffion_night_story == "sterling":
    Terry Mott: So what are you doing in my corridor?
- else:
    Terry Mott: Well? What's your explanation for being here after hours?
}
// D3-2: the notebook story has its own answer; a different story from the one
// Ffion heard gets noticed.
* {ffion_night_story == "notebook"} [Wrong turn. I'll find it.]
    Terry Mott: Other end, mate. And it's a long way round to a notebook, through the executive wing.
    ~ hub_quiet = true
    -> hub
* [I work here -- research, second floor. Forgot something at my desk.]
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
    {
    - ffion_night_story == "notebook":
        ~ guard_influence = guard_influence - 5
        # influence_decreased
        Terry Mott: Funny. Ffion said notebook.
        Terry Mott: Ms. Sterling did mention a recruit... alright.
    - ffion_night_story == "sterling":
        ~ guard_influence = guard_influence + 10
        # influence_increased
        Terry Mott: Ffion said the same. Still nobody told me. Go on, then.
    - else:
        ~ guard_influence = guard_influence + 10
        # influence_increased
        Terry Mott: Ms. Sterling mentioned a potential recruit... alright.
    }
    -> excuse_victoria
* [Building maintenance, late shift. Checking the air con.]
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
    Terry Mott: Maintenance? I didn't get a work order notice.
    -> excuse_maintenance
* [I'm with SAFETYNET. This is an active ENTROPY investigation.]
    -> safetynet_reveal

=== excuse_work_here ===
#speaker:npc
Terry Mott: I don't recognise you, and I know most of the faces here.
Terry Mott: You got ID? Key card?
* [Hold up the cloned executive card. This do you?]
    ~ guard_influence = guard_influence + 15
    # influence_increased
    Terry Mott: That's... that's an executive-level card. Alright, carry on.
    Terry Mott: Just surprised to see someone here this late.
    -> hub
* [I'm new. Started this week. Still getting my permanent ID.]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    Terry Mott: New hires don't usually have after-hours access...
    -> suspicious_path
* [That's what I came back for -- my ID badge. Left it at my desk.]
    ~ guard_influence = guard_influence - 10
    # influence_decreased
    ~ guard_suspicious = true
    Terry Mott: So you don't have ID, and you're here after hours. That's a problem.
    -> suspicious_path

=== excuse_victoria ===
#speaker:npc
Terry Mott: Ms. Sterling does sometimes have late requests.
Terry Mott: What files are you supposed to grab?
* [Training programme enrolment forms. From her office.]
    ~ guard_influence = guard_influence + 10
    # influence_increased
    Terry Mott: Ten minutes. Then I come looking.
    -> hub
* [She didn't specify -- said I'd know them when I saw them. Confidential.]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    ~ guard_suspicious = true
    Terry Mott: Confidential, huh. Well, don't take too long.
    -> hub

=== excuse_maintenance ===
#speaker:npc
Terry Mott: No work order, and you don't look like our usual maintenance crew.
Terry Mott: I'm going to need to verify this.
* [Ring the supervisor, then. Here's his mobile.]
    ~ guard_influence = guard_influence + 10
    # influence_increased
    Terry Mott: ...at this hour? Nobody's going to answer.
    Terry Mott: Fine. But I'm watching you.
    ~ guard_suspicious = true
    -> hub
* [Emergency call. The temperature sensors tripped an alert. No time for paperwork.]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    Terry Mott: I didn't hear about any alerts...
    ~ guard_suspicious = true
    -> hub
* [I don't have time for this. I've work to do.]
    ~ guard_influence = guard_influence - 20
    # influence_decreased
    ~ guard_hostile = true
    // Pass 5 (P3-8): hostile_confrontation counts this detection; counting it here too made one incident two.
    Terry Mott: Wrong answer.
    -> hostile_confrontation

=== suspicious_path ===
#speaker:npc
Terry Mott: No badge, a face I've never seen, and here at eleven at night. Pull the other one.
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
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Terry Mott: {&Anything else, or are we done?|Go on, then.|Still here?}
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
Terry Mott: Rounds every fifteen minutes. Doors, windows, anyone where they shouldn't be. Like you, possibly.
* [What's your route?]
    Terry Mott: Round the executive wing, mostly. Sterling's office, Mr Foster's, back down the corridor.
    Terry Mott: Why d'you want to know my route?
    ~ guard_suspicious = true
    -> hub
* [Must be boring work.]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    Terry Mott: Pays the mortgage. And nobody talks to me after nine, which suits me.
    -> hub
+ [Fair enough.]
    -> hub

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
    Terry Mott: Good. Off you go.
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

=== hostile_confrontation ===
#speaker:npc
#display:guard-hostile
~ guard_hostile = true
~ guard_detection_count = guard_detection_count + 1
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

// Pass 3: a detection is a warning first, not an instant fight (m02 Val Okonkwo
// pattern). The count still costs Perfect Stealth every time. He only goes
// hostile if the player refuses to back off, or is caught a third time.
=== on_lockpick_detected ===
#speaker:npc
{ guard_grace:
    -> lockpick_still_here
}
~ guard_suspicious = true
~ guard_detection_count = guard_detection_count + 1
~ guard_grace = true
#set_global:guard_grace:true
{ guard_detection_count >= 3:
    -> lockpick_final
}
{ guard_detection_count == 2:
    -> lockpick_again
}
#display:guard-alert
// Pass 4 (fix 14): the office can be picked in the afternoon too, so the torch is
// night-only.
{ mission_phase == "act2_infiltration":
    Narrator: A torch beam lands on your hands, and on the pick in them.
- else:
    Narrator: The guard has stopped walking. He's looking at your hands, and the pick in them.
}
Terry Mott: Oi. Away from the door. Now.
+ [Ms. Sterling locked her keys in. She asked me to fetch her forms.]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    Terry Mott: With a pick set. Course she did.
    Terry Mott: I'm writing it down. Do that again where I can see it and I'm calling it in.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
+ [Sorry. Wrong door. I'm going.]
    Terry Mott: Yeah, you are. I'll be watching.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
+ [Shove past him.]
    ~ guard_hostile = true
    Terry Mott: Right. That's it.
    #hostile:terry_mott
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

// Same approach, still in his sight: no new strike, just a firmer nudge away.
=== lockpick_still_here ===
#speaker:npc
#display:guard-suspicious
Terry Mott: I can still see you, you know. Away from the door.
Narrator: Step back from the door. Wait until his back's turned, then try again.
+ [Step away from the door.]
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

=== lockpick_again ===
#speaker:npc
#display:guard-hostile
Terry Mott: Again? I told you once.
+ [Put the picks away and back off.]
    Terry Mott: Last warning. Next time I'm not asking.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
+ [Stand your ground.]
    ~ guard_hostile = true
    Terry Mott: Have it your way.
    #hostile:terry_mott
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

=== lockpick_final ===
#speaker:npc
#display:guard-hostile
~ guard_hostile = true
Terry Mott: That's three times. I'm done talking.
{ mission_phase == "act2_infiltration":
    Narrator: He drops the torch and squares up.
- else:
    Narrator: He squares up.
}
+ [Brace yourself]
    #hostile:terry_mott
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

// Resting point (m02 pattern): exits never reach DONE, so the engine restores
// the story at these choices on the next talk. Every state has an option.
=== guard_idle ===
{ idle_quiet:
    ~ idle_quiet = false
- else:
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
