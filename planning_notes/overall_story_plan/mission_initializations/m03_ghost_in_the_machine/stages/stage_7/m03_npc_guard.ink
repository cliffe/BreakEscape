// ===========================================
// Mission 3: Ghost in the Machine
// NPC: Security Guard (Night Patrol)
// Location: Main hallway patrol route
// ===========================================

// Guard state tracking
VAR guard_influence = 0
VAR guard_hostile = false
VAR guard_suspicious = false
VAR player_warned = false
VAR player_has_excuse = false
VAR bribe_offered = false
VAR bribe_accepted = false

// Topic tracking
VAR topic_shift = false
VAR topic_building = false
VAR topic_victoria = false

// ===========================================
// INITIAL ENCOUNTER
// ===========================================

=== start ===
#speaker:security_guard

{guard_hostile:
    #display:guard-hostile
    Guard: I told you to leave! I'm calling the police!
    #exit_conversation
    #trigger_combat
    -> DONE
}

{not player_warned:
    #display:guard-alert
    [The guard's flashlight beam catches you in the hallway]

    Guard: Hey! What are you doing here? Building's closed for the night.

    ~ player_warned = true
    ~ guard_suspicious = true
    -> first_excuse
}

{player_warned and bribe_accepted:
    #display:guard-neutral
    Guard: Make it quick. I'm giving you 10 minutes, then you need to be gone.
    #exit_conversation
    -> DONE
}

{player_warned and not guard_hostile and not bribe_accepted:
    #display:guard-suspicious
    Guard: You again. I'm keeping my eye on you.
    -> hub
}

// ===========================================
// FIRST EXCUSE
// ===========================================

=== first_excuse ===
#speaker:security_guard

Guard: Well? What's your explanation for being here after hours?

* [I work here - forgot something at my desk]
    ~ guard_influence -= 5
    ~ guard_suspicious = true
    You: I work here. I forgot something at my desk earlier.
    Guard: Really. Which department?
    -> excuse_work_here

* [Victoria Sterling asked me to grab some files]
    ~ guard_influence += 10
    ~ player_has_excuse = true
    You: Victoria Sterling asked me to grab some files. I met with her earlier today about the training program.
    Guard: [Pauses] Ms. Sterling mentioned a potential recruit... alright.
    -> excuse_victoria

* [I'm with building maintenance - late shift]
    ~ guard_influence += 5
    You: Building maintenance. Late shift. Checking the HVAC system.
    Guard: Maintenance? I didn't get a work order notice.
    -> excuse_maintenance

=== excuse_work_here ===
#speaker:security_guard

You: [Improvise department name]

Guard: Huh. I don't recognize you, and I know most of the staff.

Guard: You got ID? Key card?

* [Show the cloned RFID card]
    ~ guard_influence += 15
    ~ player_has_excuse = true
    You: [Flash the cloned executive keycard]
    Guard: [Squints at it] That's... that's an executive-level card. Alright, carry on.
    Guard: Just surprised to see someone here this late.
    -> hub

* [I'm new - just started this week]
    ~ guard_influence += 5
    You: I'm new. Just started this week. Still getting my permanent ID.
    Guard: [Skeptical] New hires don't usually have after-hours access...
    -> suspicious_path

* [I must have left it at my desk - that's what I came back for]
    ~ guard_influence -= 10
    ~ guard_suspicious = true
    You: That's what I came back for - my ID badge. Left it at my desk.
    Guard: So you don't have ID, and you're here after hours. That's a problem.
    -> suspicious_path

=== excuse_victoria ===
#speaker:security_guard

Guard: Ms. Sterling does sometimes have late requests.

Guard: What files are you supposed to grab?

* [Training program enrollment documents]
    ~ guard_influence += 10
    You: Training program enrollment documents. From her office.
    Guard: [Nods] Alright. But be quick about it. And stay in the executive area - don't wander.
    -> hub

* [That's confidential - she didn't give me details]
    ~ guard_influence += 5
    ~ guard_suspicious = true
    You: She didn't specify - said I'd know when I saw them. Confidential materials.
    Guard: [Suspicious] Confidential, huh. Well, don't take too long.
    -> hub

=== excuse_maintenance ===
#speaker:security_guard

Guard: No work order, and you don't look like our usual maintenance crew.

Guard: I'm going to need to verify this.

* [Call the maintenance supervisor - here's the number]
    ~ guard_influence += 10
    You: Call the supervisor. [Give fake number that could sound plausible]
    Guard: [Looks at number] ...at this hour? Nobody's going to answer.
    Guard: Fine. But I'm watching you.
    ~ guard_suspicious = true
    -> hub

* [Emergency HVAC issue - no time for work orders]
    ~ guard_influence += 5
    You: Emergency call. Temperature sensors triggered an alert. No time for paperwork.
    Guard: [Uncertain] I didn't hear about any alerts...
    ~ guard_suspicious = true
    -> hub

* [I don't need to explain myself to you]
    ~ guard_influence -= 20
    ~ guard_hostile = true
    You: I don't have time for this. I have work to do.
    Guard: [Angry] Wrong answer. You're trespassing. Leave now or I'm calling the cops.
    -> hostile_confrontation

=== suspicious_path ===
#speaker:security_guard

Guard: This doesn't add up. You're not making sense.

* [Offer a bribe - "Maybe we can work something out"]
    -> offer_bribe

* [Try to persuade with more lies]
    ~ guard_influence -= 10
    ~ guard_suspicious = true
    You: [Elaborate on the lie with more details]
    Guard: [Not buying it] I think you need to leave. Now.
    -> trespass_warning

* [Be honest - SAFETYNET investigation]
    -> safetynet_reveal

=== offer_bribe ===
#speaker:security_guard

~ bribe_offered = true

You: Look, maybe we can work something out. I really need to finish something here.

Guard: [Eyes narrow] Are you trying to bribe me?

* [Offer $100]
    You: I can make it worth your while. $100. You didn't see me.
    -> bribe_response_low

* [Offer $500]
    You: $500. Cash. Just give me an hour, then I'm gone.
    -> bribe_response_high

* [Back off - "No, I just meant maybe you could make an exception"]
    ~ guard_influence -= 5
    You: No, no - I just meant, could you make an exception? As a favor?
    Guard: [Scoffs] No favors. Leave or I'm calling the police.
    -> trespass_warning

=== bribe_response_low ===
#speaker:security_guard

Guard: $100? You think I'm going to risk my job for a hundred bucks?

Guard: Get out. Now.

~ guard_hostile = true
-> trespass_warning

=== bribe_response_high ===
#speaker:security_guard

Guard: [Long pause]

Guard: ...$500?

Guard: [Looks around]

Guard: One hour. You finish whatever you're doing and you're gone. I never saw you.

Guard: And if anyone asks, I was on the other side of the building doing rounds.

~ bribe_accepted = true
~ guard_influence += 30
~ guard_suspicious = false

You hand over the cash.

#give_item:cash:-500

Guard: One hour. After that, you're trespassing and I'm doing my job.

#exit_conversation
-> DONE

=== safetynet_reveal ===
#speaker:security_guard

You: I'm with SAFETYNET. This is an active investigation into ENTROPY operations.

Guard: [Shocked] SAFETYNET? Like... the government agency?

* [Show credentials - "I need your cooperation"]
    ~ guard_influence += 30
    ~ guard_suspicious = false
    You: [Show SAFETYNET credentials] I need your cooperation. National security matter.
    Guard: [Stunned] Holy shit. Yeah, okay, whatever you need.
    Guard: Ms. Sterling... she's involved in something?
    -> safetynet_cooperation

* [This is classified - you can't tell anyone]
    ~ guard_influence += 20
    You: This is classified. You cannot tell anyone I was here. Not even Victoria Sterling.
    Guard: [Nervous] Yeah, understood. I... I won't say anything.
    -> safetynet_cooperation

* [Help me and you're a patriot. Hinder me and you're an accomplice.]
    ~ guard_influence += 25
    ~ guard_suspicious = false
    You: Help me, you're helping your country. Get in my way, you're obstructing a federal investigation.
    Guard: [Intimidated] I'm not getting in the way. Do what you need to do.
    -> safetynet_cooperation

=== safetynet_cooperation ===
#speaker:security_guard

Guard: What do you need from me?

* [Just stay out of my way]
    You: Just continue your normal patrol. Pretend you didn't see me.
    Guard: Done. I'll be on the other side of the building if anyone asks.
    ~ guard_influence += 10
    #exit_conversation
    -> DONE

* [Tell me about Victoria Sterling]
    You: Tell me about Victoria Sterling. What's she like?
    Guard: Ms. Sterling? She's... intense. Smart. Stays late a lot.
    Guard: Sometimes has weird visitors. People who don't look like typical corporate types.
    Guard: But she pays well, so I don't ask questions.
    -> safetynet_cooperation

* [Any unusual activity lately?]
    You: Have you noticed anything unusual? Strange visitors? Odd hours?
    Guard: There's been more late-night meetings recently. Last week, some guy with a Russian accent.
    Guard: And Ms. Sterling's been more stressed. Snapping at people.
    ~ guard_influence += 5
    -> safetynet_cooperation

+ [That's all I need - continue your patrol]
    Guard: Roger that. Good luck with... whatever you're investigating.
    #exit_conversation
    -> DONE

// ===========================================
// CONVERSATION HUB (After initial encounter)
// ===========================================

=== hub ===

+ {not topic_shift} [Ask about the guard's shift]
    -> ask_shift

+ {not topic_building} [Ask about building layout]
    -> ask_building

+ {not topic_victoria} [Ask about Victoria Sterling]
    -> ask_victoria

+ {guard_influence >= 20 and not bribe_offered} [Offer a bribe]
    -> offer_bribe

+ [Leave conversation]
    #exit_conversation
    {guard_suspicious:
        Guard: I'm keeping an eye on you. Don't make me regret this.
    }
    {not guard_suspicious:
        Guard: Alright. Stay out of trouble.
    }
    -> DONE

=== ask_shift ===
#speaker:security_guard

~ topic_shift = true
~ guard_influence += 5

Guard: Night shift. 10 PM to 6 AM. Quiet most nights.

{guard_suspicious:
    Guard: Though tonight's been more eventful than usual.
}

Guard: I do rounds every 15 minutes or so. Check the doors, make sure nobody's where they shouldn't be.

* [What's your route?]
    Guard: Main hallway loop. Server room, executive offices, conference area, back to reception.
    Guard: Why do you want to know my route?
    ~ guard_suspicious = true
    -> hub

* [Must be boring work]
    ~ guard_influence += 5
    Guard: It pays the bills. And it's better than dealing with day shift drama.
    -> hub

+ [Continue]
    -> hub

=== ask_building ===
#speaker:security_guard

~ topic_building = true
~ guard_influence += 5

Guard: Standard office building. Reception, conference rooms, main hallway with offices.

Guard: Server room and IT area in the back. Executive offices on the north side.

{guard_influence >= 15:
    Guard: Server room's usually locked. Executive-level access only.
}

* [What's in the executive area?]
    Guard: Ms. Sterling's office, mostly. Some storage. Conference room for high-level meetings.
    ~ guard_influence += 5
    -> hub

* [Any restricted areas?]
    Guard: Server room's the main one. And Ms. Sterling doesn't like people in her office without permission.
    -> hub

+ [Continue]
    -> hub

=== ask_victoria ===
#speaker:security_guard

~ topic_victoria = true

Guard: Ms. Sterling? She's the boss. CEO. Runs the whole operation.

{guard_influence >= 20:
    Guard: Between you and me, she's a bit intense. Very particular about security protocols.
    Guard: And the people she meets with sometimes... they don't look like normal corporate clients.
}

{guard_influence < 20:
    Guard: Why are you asking about Ms. Sterling?
    ~ guard_suspicious = true
}

-> hub

// ===========================================
// HOSTILE PATHS
// ===========================================

=== trespass_warning ===
#speaker:security_guard

#display:guard-hostile

Guard: I'm giving you one chance. Leave now, or I'm calling the police.

* [Leave peacefully]
    You: Alright, I'm going.
    #exit_conversation
    #trigger_event:mission_failed_caught
    -> DONE

* [Try to run past the guard]
    Guard: HEY! STOP!
    #trigger_combat
    #exit_conversation
    -> DONE

* [Attack the guard]
    #trigger_combat
    #exit_conversation
    -> DONE

=== hostile_confrontation ===
#speaker:security_guard

#display:guard-hostile

~ guard_hostile = true

Guard: That's it. I'm calling the cops. Don't move.

[Guard reaches for radio]

* [Tackle the guard before he can call]
    #trigger_combat
    #exit_conversation
    -> DONE

* [Try to talk him down - "Wait, wait!"]
    Guard: No more talking. You're trespassing.
    -> trespass_warning

* [Run]
    Guard: [Into radio] Security! I have an intruder!
    #trigger_event:alarm_triggered
    #exit_conversation
    -> DONE

// ===========================================
// EVENT-TRIGGERED KNOTS
// ===========================================

// Called when guard detects lockpicking
=== on_lockpick_detected ===
#speaker:security_guard

#display:guard-hostile

Guard: HEY! What are you doing with that lock?!

~ guard_hostile = true
~ guard_suspicious = true

Guard: You're trying to break in! That's it - I'm calling the police!

#trigger_combat

#exit_conversation
-> DONE

// Called when guard detects player in restricted area
=== on_restricted_area ===
#speaker:security_guard

#display:guard-suspicious

Guard: You're not supposed to be back here. This area is restricted.

{player_has_excuse and guard_influence >= 10:
    Guard: ...but I guess if Ms. Sterling sent you. Be quick.
    #exit_conversation
    -> DONE
}

{not player_has_excuse or guard_influence < 10:
    Guard: I need you to return to the main area. Now.
    ~ guard_suspicious = true
    #exit_conversation
    -> DONE
}

// ===========================================
// END
// ===========================================
