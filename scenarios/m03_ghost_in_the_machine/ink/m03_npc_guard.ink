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
    #exit_conversation
    -> guard_idle
}
{ mission_phase != "act2_infiltration":
    -> daytime
}
{ not player_warned:
    #display:guard-alert
    Narrator: A torch beam swings round and settles on you.
    Security Guard: Hey! What are you doing here? Building's closed for the night.
    ~ player_warned = true
    ~ guard_suspicious = true
    -> first_excuse
}
{ player_warned && bribe_accepted:
    #display:guard-neutral
    Security Guard: You've still got your hour. Use it, then you're gone.
    #exit_conversation
    -> guard_idle
}
{ (player_warned && not guard_hostile) && not bribe_accepted:
    #display:guard-suspicious
    Security Guard: You again. I'm keeping my eye on you.
    -> hub
}

=== daytime ===
#speaker:npc
#display:guard-neutral
Security Guard: Afternoon. Executive wing's staff only, I'm afraid. Visitors stay in reception and the conference area.
Security Guard: If Ms. Sterling wants you back here, she'll walk you through herself.
+ [Sorry -- wrong turn]
    Security Guard: Happens all the time. Conference room's back through to the main hallway and straight across.
    #exit_conversation
    -> guard_idle
+ [When do you knock off?]
    ~ topic_shift = true
    Security Guard: Knock off? Not till six tomorrow morning. Double shift -- afternoon on the desk here, then the night rounds.
    Security Guard: Why?
    #exit_conversation
    -> guard_idle

=== first_excuse ===
#speaker:npc
Security Guard: Well? What's your explanation for being here after hours?
* [I work here - forgot something at my desk]
    ~ guard_influence = guard_influence - 5
    # influence_decreased
    ~ guard_suspicious = true
    You: I work here. I forgot something at my desk earlier.
    Security Guard: Right. Which department?
    -> excuse_work_here
* [Victoria Sterling asked me to grab some files]
    ~ guard_influence = guard_influence + 10
    # influence_increased
    ~ player_has_excuse = true
    You: Victoria Sterling asked me to grab some files. I met with her earlier today about the training programme.
    Security Guard: *pauses* Ms. Sterling mentioned a potential recruit... alright.
    -> excuse_victoria
* [I'm with building maintenance - late shift]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    You: Building maintenance. Late shift. Checking the HVAC system.
    Security Guard: Maintenance? I didn't get a work order notice.
    -> excuse_maintenance

=== excuse_work_here ===
#speaker:npc
You: Research. Second floor, the training side.
Security Guard: I don't recognise you, and I know most of the faces here.
Security Guard: You got ID? Key card?
* [Show the cloned RFID card]
    ~ guard_influence = guard_influence + 15
    # influence_increased
    ~ player_has_excuse = true
    You: This do you? *holds up the cloned executive card*
    Security Guard: That's... that's an executive-level card. Alright, carry on.
    Security Guard: Just surprised to see someone here this late.
    -> hub
* [I'm new - just started this week]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    You: I'm new. Just started this week. Still getting my permanent ID.
    Security Guard: *sceptical* New hires don't usually have after-hours access...
    -> suspicious_path
* [I must have left it at my desk - that's what I came back for]
    ~ guard_influence = guard_influence - 10
    # influence_decreased
    ~ guard_suspicious = true
    You: That's what I came back for - my ID badge. Left it at my desk.
    Security Guard: So you don't have ID, and you're here after hours. That's a problem.
    -> suspicious_path

=== excuse_victoria ===
#speaker:npc
Security Guard: Ms. Sterling does sometimes have late requests.
Security Guard: What files are you supposed to grab?
* [Training programme enrolment documents]
    ~ guard_influence = guard_influence + 10
    # influence_increased
    You: Training programme enrolment forms. From her office.
    Security Guard: *nods* Alright. But be quick about it. And stay in the executive area - don't wander.
    -> hub
* [That's confidential - she didn't give me details]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    ~ guard_suspicious = true
    You: She didn't specify - said I'd know when I saw them. Confidential materials.
    Security Guard: *suspicious* Confidential, huh. Well, don't take too long.
    -> hub

=== excuse_maintenance ===
#speaker:npc
Security Guard: No work order, and you don't look like our usual maintenance crew.
Security Guard: I'm going to need to verify this.
* [Call the maintenance supervisor - here's the number]
    ~ guard_influence = guard_influence + 10
    # influence_increased
    You: Ring the supervisor, then. Here's his mobile. *reels off a number with total confidence*
    Security Guard: ...at this hour? Nobody's going to answer.
    Security Guard: Fine. But I'm watching you.
    ~ guard_suspicious = true
    -> hub
* [Emergency HVAC issue - no time for work orders]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    You: Emergency call. Temperature sensors triggered an alert. No time for paperwork.
    Security Guard: *uncertain* I didn't hear about any alerts...
    ~ guard_suspicious = true
    -> hub
* [I don't need to explain myself to you]
    ~ guard_influence = guard_influence - 20
    # influence_decreased
    ~ guard_hostile = true
    ~ guard_detection_count = guard_detection_count + 1
    You: I don't have time for this. I have work to do.
    Security Guard: *angry* Wrong answer. You're trespassing. Leave now or I'm calling the police.
    -> hostile_confrontation

=== suspicious_path ===
#speaker:npc
Security Guard: This doesn't add up. You're not making sense.
* [Offer a bribe - "Maybe we can work something out"]
    -> offer_bribe
* [Try to persuade with more lies]
    ~ guard_influence = guard_influence - 10
    # influence_decreased
    ~ guard_suspicious = true
    You: Look, the fault's in the plant room above the executive wing, the ticket was raised this afternoon, and if it trips overnight the whole floor cooks. I'm trying to save you a very long night.
    Security Guard: *flatly* I think you need to leave. Now.
    -> trespass_warning
* [Be honest - SAFETYNET investigation]
    -> safetynet_reveal

=== offer_bribe ===
#speaker:npc
~ bribe_offered = true
You: Look, maybe we can work something out. I really need to finish something here.
Security Guard: *sharply* Are you trying to bribe me?
* [I can make it worth your while. A hundred quid, and you didn't see me.]
    -> bribe_response_low
* [Five hundred, cash. Give me an hour, then I'm gone.]
    -> bribe_response_high
* [Back off - "No, I just meant maybe you could make an exception"]
    ~ guard_influence = guard_influence - 5
    # influence_decreased
    You: No, no. I just meant, could you make an exception? As a favour?
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
Security Guard: *slowly* ...Five hundred?
Security Guard: One hour. You finish whatever you're doing and you're gone. I never saw you.
Security Guard: And if anyone asks, I was on the other side of the building doing rounds.
~ bribe_accepted = true
~ guard_influence = guard_influence + 30
# influence_increased
~ guard_suspicious = false
Narrator: You count five hundred into his hand.
Security Guard: One hour. After that, you're trespassing and I'm doing my job.
#exit_conversation
-> guard_idle

=== safetynet_reveal ===
#speaker:npc
You: I'm with SAFETYNET. This is an active investigation into ENTROPY operations.
Security Guard: *wary* SAFETYNET. The people off the news?
* [Show credentials - "I need your cooperation"]
    ~ guard_influence = guard_influence + 30
    # influence_increased
    ~ guard_suspicious = false
    You: Here are my credentials. I need your cooperation. People get hurt if this goes wrong.
    Security Guard: *stunned* Right. Yeah. Whatever you need.
    Security Guard: Ms. Sterling... she's involved in something?
    -> safetynet_cooperation
* [This is classified - you can't tell anyone]
    ~ guard_influence = guard_influence + 20
    # influence_increased
    You: This is classified. You cannot tell anyone I was here. Not even Victoria Sterling.
    Security Guard: *nervous* Yeah, understood. I... I won't say anything.
    -> safetynet_cooperation
* [Help me and you're on the right side. Hinder me and you're an accomplice.]
    ~ guard_influence = guard_influence + 25
    # influence_increased
    ~ guard_suspicious = false
    You: Help me, you're helping the people this is aimed at. Get in my way, you're obstructing an active investigation.
    Security Guard: *intimidated* I'm not getting in the way. Do what you need to do.
    -> safetynet_cooperation

=== safetynet_cooperation ===
#speaker:npc
Security Guard: What do you need from me?
- (coop_hub)
* [Just continue your normal patrol. Pretend you didn't see me.]
    Security Guard: Done. I'll be on the other side of the building if anyone asks.
    ~ guard_influence = guard_influence + 10
    # influence_increased
    #exit_conversation
    -> guard_idle
* [Tell me about Victoria Sterling. What's she like?]
    Security Guard: Ms. Sterling? She's... intense. Smart. Stays late a lot.
    Security Guard: Sometimes has weird visitors. People who don't look like typical corporate types.
    Security Guard: But she pays well, so I don't ask questions.
    -> coop_hub
* [Have you noticed anything unusual? Strange visitors? Odd hours?]
    Security Guard: More late meetings lately. Last week, some bloke who didn't give a name and didn't want telling twice.
    Security Guard: And Ms. Sterling's been more stressed. Snapping at people.
    ~ guard_influence = guard_influence + 5
    # influence_increased
    -> coop_hub
+ [That's all I need - continue your patrol]
    Security Guard: Roger that. Good luck with... whatever you're investigating.
    #exit_conversation
    -> guard_idle

=== hub ===
+ {not topic_shift} [Ask about the guard's shift]
    -> ask_shift
+ {not topic_building} [Ask about building layout]
    -> ask_building
+ {not topic_victoria} [Ask about Victoria Sterling]
    -> ask_victoria
+ {(guard_influence >= 20) && not bribe_offered} [Offer a bribe]
    -> offer_bribe
+ [Leave conversation]
    { guard_suspicious:
        Security Guard: I'm keeping an eye on you. Don't make me regret this.
    }
    { not guard_suspicious:
        Security Guard: Alright. Stay out of trouble.
    }
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
Security Guard: I do rounds every 15 minutes or so. Check the doors, make sure nobody's where they shouldn't be.
* [What's your route?]
    Security Guard: Round the executive wing, mostly. Sterling's office, the consultants' rooms, back down the corridor. Every fifteen minutes or so.
    Security Guard: Why d'you want to know my route?
    ~ guard_suspicious = true
    -> hub
* [Must be boring work]
    ~ guard_influence = guard_influence + 5
    # influence_increased
    Security Guard: It pays the bills. And it's better than dealing with day shift drama.
    -> hub
+ [Continue]
    -> hub

=== ask_building ===
#speaker:npc
~ topic_building = true
~ guard_influence = guard_influence + 5
# influence_increased
Security Guard: Standard office building. Reception, conference rooms, main hallway with offices.
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
+ [Continue]
    -> hub

=== ask_victoria ===
#speaker:npc
~ topic_victoria = true
Security Guard: Ms. Sterling? She's the boss. CEO. Runs the whole operation.
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
    #exit_conversation
    -> guard_idle
* [Try to run past the guard]
    Security Guard: HEY! STOP!
    #hostile:night_guard
    #exit_conversation
    -> guard_idle
* [Attack the guard]
    #hostile:night_guard
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
    #exit_conversation
    -> guard_idle
* [Try to talk him down - "Wait, wait!"]
    Security Guard: No more talking. You're trespassing.
    -> trespass_warning
* [Run]
    Security Guard: Security! I have an intruder!
    #hostile:night_guard
    #exit_conversation
    -> guard_idle

=== on_lockpick_detected ===
#speaker:npc
#display:guard-hostile
Security Guard: HEY! What are you doing with that lock?!
~ guard_hostile = true
~ guard_suspicious = true
~ guard_detection_count = guard_detection_count + 1
Security Guard: You're trying to break in! That's it - I'm calling the police!
#hostile:night_guard
#exit_conversation
-> guard_idle

=== on_restricted_area ===
#speaker:npc
#display:guard-suspicious
Security Guard: You're not supposed to be back here. This area is restricted.
{ player_has_excuse && (guard_influence >= 10):
    Security Guard: ...but I guess if Ms. Sterling sent you. Be quick.
    #exit_conversation
    -> guard_idle
}
{ not player_has_excuse || (guard_influence < 10):
    Security Guard: I need you to return to the main area. Now.
    ~ guard_suspicious = true
    #exit_conversation
    -> guard_idle
}

// Resting point (m02 pattern): exits never reach DONE, so the engine restores
// the story at these choices on the next talk. Every state has an option.
=== guard_idle ===
+ {mission_phase != "act2_infiltration"} [Nod to the guard]
    -> daytime
+ {mission_phase == "act2_infiltration" and guard_hostile} [Back off]
    #exit_conversation
    -> guard_idle
+ {mission_phase == "act2_infiltration" and not guard_hostile} [Talk to the guard]
    -> start
