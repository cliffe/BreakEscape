VAR guard_influence = 0
VAR guard_hostile = false
VAR guard_suspicious = false
VAR player_warned = false
VAR player_has_excuse = false
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

// Root divert. When a conversation has ended (-> DONE), the engine restores only
// its variables on the next talk and continues from the root (npc-conversation-
// state.js restoreNPCState). Without this line the root is empty and the player
// sees "(End of conversation)" instead of the start knot's re-entry routing.
-> start

=== start ===
#speaker:npc
{ guard_hostile:
    #display:guard-hostile
    Security Guard: I told you to leave. I'm calling the police.
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
    Security Guard: Hey! What are you doing here? Building's closed for the night.
    ~ player_warned = true
    ~ guard_suspicious = true
    -> first_excuse
}
{ player_warned && bribe_accepted:
    #display:guard-neutral
    Security Guard: You've still got your hour. Use it, then you're gone.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
}
{ (player_warned && not guard_hostile) && not bribe_accepted:
    #display:guard-suspicious
    Security Guard: You again. I'm keeping my eye on you.
    ~ hub_quiet = true
    -> hub
}

=== daytime ===
#speaker:npc
#display:guard-neutral
Security Guard: Afternoon. Executive wing's staff only, I'm afraid. Visitors stay in reception and the conference area.
Security Guard: If Ms. Sterling wants you back here, she'll walk you through herself.
+ [Sorry -- wrong turn]
    Security Guard: Happens all the time. Conference room's back through to the main hallway and straight across.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
+ [When do you knock off?]
    ~ topic_shift = true
    Security Guard: Knock off? Not till six tomorrow morning. Double shift -- afternoon on the desk here, then the night rounds.
    Security Guard: Why?
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

=== first_excuse ===
#speaker:npc
Security Guard: Well? What's your explanation for being here after hours?
* [I work here -- research, second floor. Forgot something at my desk.]
    ~ guard_influence = guard_influence - 5
    # influence_decreased
    ~ guard_suspicious = true
    -> excuse_work_here
* [Sterling asked me to grab some files. We met today about the training programme.]
    ~ guard_influence = guard_influence + 10
    # influence_increased
    ~ player_has_excuse = true
    Security Guard: *pauses* Ms. Sterling mentioned a potential recruit... alright.
    -> excuse_victoria
* [Building maintenance, late shift. Checking the HVAC.]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    Security Guard: Maintenance? I didn't get a work order notice.
    -> excuse_maintenance
* [I'm with SAFETYNET. This is an active ENTROPY investigation.]
    -> safetynet_reveal

=== excuse_work_here ===
#speaker:npc
Security Guard: I don't recognise you, and I know most of the faces here.
Security Guard: You got ID? Key card?
* [Hold up the cloned executive card. This do you?]
    ~ guard_influence = guard_influence + 15
    # influence_increased
    ~ player_has_excuse = true
    Security Guard: That's... that's an executive-level card. Alright, carry on.
    Security Guard: Just surprised to see someone here this late.
    -> hub
* [I'm new. Started this week. Still getting my permanent ID.]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    Security Guard: *sceptical* New hires don't usually have after-hours access...
    -> suspicious_path
* [That's what I came back for -- my ID badge. Left it at my desk.]
    ~ guard_influence = guard_influence - 10
    # influence_decreased
    ~ guard_suspicious = true
    Security Guard: So you don't have ID, and you're here after hours. That's a problem.
    -> suspicious_path

=== excuse_victoria ===
#speaker:npc
Security Guard: Ms. Sterling does sometimes have late requests.
Security Guard: What files are you supposed to grab?
* [Training programme enrolment forms. From her office.]
    ~ guard_influence = guard_influence + 10
    # influence_increased
    Security Guard: *nods* Alright. But be quick about it. And stay in the executive area - don't wander.
    -> hub
* [She didn't specify -- said I'd know them when I saw them. Confidential.]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    ~ guard_suspicious = true
    Security Guard: Confidential, huh. Well, don't take too long.
    -> hub

=== excuse_maintenance ===
#speaker:npc
Security Guard: No work order, and you don't look like our usual maintenance crew.
Security Guard: I'm going to need to verify this.
* [Ring the supervisor, then. Here's his mobile.]
    ~ guard_influence = guard_influence + 10
    # influence_increased
    Security Guard: ...at this hour? Nobody's going to answer.
    Security Guard: Fine. But I'm watching you.
    ~ guard_suspicious = true
    -> hub
* [Emergency call. The temperature sensors tripped an alert. No time for paperwork.]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    Security Guard: I didn't hear about any alerts...
    ~ guard_suspicious = true
    -> hub
* [I don't have time for this. I've work to do.]
    ~ guard_influence = guard_influence - 20
    # influence_decreased
    ~ guard_hostile = true
    // Pass 5 (P3-8): hostile_confrontation counts this detection; counting it here too made one incident two.
    Security Guard: Wrong answer. You're trespassing. Leave now or I'm calling the police.
    -> hostile_confrontation

=== suspicious_path ===
#speaker:npc
Security Guard: This doesn't add up. You're not making sense.
* [Maybe we can work something out. I need to finish here.]
    -> offer_bribe
* [Ring Ms. Sterling if you like. She'll vouch for me.]
    ~ guard_influence = guard_influence - 10
    # influence_decreased
    ~ guard_suspicious = true
    Security Guard: *flatly* I'm not ringing the boss at this hour on your say-so. You need to leave. Now.
    -> trespass_warning
* [I'm with SAFETYNET. This is an active ENTROPY investigation.]
    -> safetynet_reveal

=== offer_bribe ===
#speaker:npc
~ bribe_offered = true
Security Guard: *sharply* Are you trying to bribe me?
* [I can make it worth your while. A hundred quid, and you didn't see me.]
    -> bribe_response_low
* [Five hundred, cash. Give me an hour, then I'm gone.]
    -> bribe_response_high
* [No, no. I just meant -- could you make an exception? A favour?]
    ~ guard_influence = guard_influence - 5
    # influence_decreased
    Security Guard: *scoffs* No favours. Leave or I'm calling the police.
    -> trespass_warning

=== bribe_response_low ===
#speaker:npc
Security Guard: A hundred quid? You think I'm risking my job for a hundred quid?
Security Guard: Get out. Now.
~ guard_hostile = true
~ guard_detection_count = guard_detection_count + 1
-> trespass_warning

=== bribe_response_high ===
#speaker:npc
Security Guard: ...Five hundred?
Security Guard: One hour. You finish whatever you're doing and you're gone. I never saw you.
Security Guard: And if anyone asks, I was on the other side of the building doing rounds.
~ bribe_accepted = true
#set_global:guard_bribed:true
~ guard_influence = guard_influence + 30
# influence_increased
~ guard_suspicious = false
Narrator: You count five hundred into his hand.
Security Guard: One hour. After that, you're trespassing and I'm doing my job.
~ idle_quiet = true
#exit_conversation
-> guard_idle

=== safetynet_reveal ===
#speaker:npc
// Pass 4 (fix 6): he rings Sterling, whatever he promises. Victoria's night
// opener and the debrief both read this.
#set_global:guard_told_safetynet:true
Security Guard: *wary* SAFETYNET. The people off the news?
* [Here are my credentials. I need your cooperation -- people get hurt if this goes wrong.]
    ~ guard_influence = guard_influence + 30
    # influence_increased
    ~ guard_suspicious = false
    Security Guard: *stunned* Right. Yeah. Whatever you need.
    Security Guard: Ms. Sterling... she's involved in something?
    -> safetynet_cooperation
* [This is classified. Tell no one I was here. Not even Sterling.]
    ~ guard_influence = guard_influence + 20
    # influence_increased
    Security Guard: Yeah, understood. I... I won't say anything.
    -> safetynet_cooperation
* [Help me, you help the people this is aimed at. Hinder me, you're obstructing.]
    ~ guard_influence = guard_influence + 25
    # influence_increased
    ~ guard_suspicious = false
    Security Guard: I'm not getting in the way. Do what you need to do.
    -> safetynet_cooperation

=== safetynet_cooperation ===
#speaker:npc
Security Guard: What do you need from me?
- (coop_hub)
* [Just continue your normal patrol. Pretend you didn't see me.]
    ~ guard_influence = guard_influence + 10
    # influence_increased
    Security Guard: Done. I'll be on the other side of the building if anyone asks.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
* [Tell me about Victoria Sterling. What's she like?]
    Security Guard: Ms. Sterling? Sharp. Stays late. Looks straight through you.
    Security Guard: Gets visitors who don't look like they've ever owned a tie.
    Security Guard: But she pays well, so I don't ask questions.
    -> coop_hub
* [Have you noticed anything unusual? Strange visitors? Odd hours?]
    Security Guard: More late meetings lately. Last week, some bloke who didn't give a name and didn't want telling twice.
    Security Guard: And Ms. Sterling's been more stressed. Snapping at people.
    ~ guard_influence = guard_influence + 5
    # influence_increased
    -> coop_hub
+ [That's all. Carry on with your patrol.]
    Security Guard: Right you are. I never saw you. I'm good at that, as it goes.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Security Guard: {&Anything else, or are we done?|Go on, then.|Still here?}
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
        Security Guard: I'm keeping an eye on you. Don't make me regret this.
    }
    { not guard_suspicious:
        Security Guard: Alright. Stay out of trouble.
    }
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

=== ask_shift ===
#speaker:npc
~ topic_shift = true
~ guard_influence = guard_influence + 5
# influence_increased
Security Guard: Double shift tonight. On till six. Quiet, most nights.
{ guard_suspicious:
    Security Guard: Though tonight's been more eventful than usual.
}
Security Guard: Rounds every fifteen minutes. Doors, windows, anyone where they shouldn't be. Like you, possibly.
* [What's your route?]
    Security Guard: Round the executive wing, mostly. Sterling's office, the consultants' rooms, back down the corridor.
    Security Guard: Why d'you want to know my route?
    ~ guard_suspicious = true
    -> hub
* [Must be boring work]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    Security Guard: Pays the mortgage. And nobody talks to me after nine, which suits me.
    -> hub
+ [Fair enough.]
    -> hub

=== ask_building ===
#speaker:npc
~ topic_building = true
~ guard_influence = guard_influence + 5
# influence_increased
Security Guard: It's an office, mate. Reception, conference rooms, a hallway, more offices.
Security Guard: Server room's at the far end of the main hallway. The executive wing's east, where we're standing.
{ guard_influence >= 15:
    Security Guard: Server room's usually locked. Executive-level access only.
}
* [What's in the executive area?]
    Security Guard: Ms. Sterling's office, mostly. Some storage. Conference room for high-level meetings.
    ~ guard_influence = guard_influence + 5
    # influence_increased
    -> hub
* [Any restricted areas?]
    Security Guard: Server room's the main one. And Ms. Sterling doesn't like people in her office without permission.
    -> hub
+ [Right. Thanks.]
    -> hub

=== ask_victoria ===
#speaker:npc
~ topic_victoria = true
Security Guard: Ms. Sterling? She's the boss. Signs my wages, never learnt my name.
{ guard_influence >= 20:
    Security Guard: Between you and me, she's a bit intense. Very particular about security protocols.
    Security Guard: And the people she meets with sometimes... they don't look like normal corporate clients.
}
{ guard_influence < 20:
    Security Guard: Why are you asking about Ms. Sterling?
    ~ guard_suspicious = true
}
-> hub

=== trespass_warning ===
#speaker:npc
#display:guard-hostile
Security Guard: I'm giving you one chance. Leave now, or I'm calling the police.
* [Alright, I'm going.]
    Security Guard: Good. Off you go.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
* [Try to run past the guard]
    Security Guard: HEY! STOP!
    #hostile:night_guard
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
* [Attack the guard]
    #hostile:night_guard
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

=== hostile_confrontation ===
#speaker:npc
#display:guard-hostile
~ guard_hostile = true
~ guard_detection_count = guard_detection_count + 1
Security Guard: That's it. I'm calling the police. Don't move.
Narrator: The guard reaches for his radio.
* [Tackle the guard before he can call]
    #hostile:night_guard
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
* [Wait, wait! Hear me out.]
    Security Guard: No more talking. You're trespassing.
    -> trespass_warning
* [Run]
    Security Guard: Security! I have an intruder!
    #hostile:night_guard
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
Security Guard: Oi. Away from the door. Now.
+ [Ms. Sterling locked her keys in. She asked me to fetch her forms.]
    ~ guard_influence = guard_influence + 5
    Security Guard: With a pick set. Course she did.
    Security Guard: I'm writing it down. Do that again where I can see it and I'm calling it in.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
+ [Sorry. Wrong door. I'm going.]
    Security Guard: Yeah, you are. I'll be watching.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
+ [Shove past him.]
    ~ guard_hostile = true
    Security Guard: Right. That's it.
    #hostile:night_guard
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

// Same approach, still in his sight: no new strike, just a firmer nudge away.
=== lockpick_still_here ===
#speaker:npc
#display:guard-suspicious
Security Guard: I'm still stood here, you know. Away from the door.
Narrator: He isn't going anywhere while you're in front of him. Come back when his back's turned.
+ [Step away from the door.]
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

=== lockpick_again ===
#speaker:npc
#display:guard-hostile
Security Guard: Again? I told you once.
+ [Put the picks away and back off.]
    Security Guard: Last warning. Next time I'm not asking.
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle
+ [Stand your ground.]
    ~ guard_hostile = true
    Security Guard: Have it your way.
    #hostile:night_guard
    ~ idle_quiet = true
    #exit_conversation
    -> guard_idle

=== lockpick_final ===
#speaker:npc
#display:guard-hostile
~ guard_hostile = true
Security Guard: That's three times. I'm done talking.
{ mission_phase == "act2_infiltration":
    Narrator: He drops the torch and squares up.
- else:
    Narrator: He squares up.
}
+ [Brace yourself]
    #hostile:night_guard
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
        Narrator: The guard looks up from his desk.
    - else:
        { guard_hostile:
            Security Guard: Don't even think about it.
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
