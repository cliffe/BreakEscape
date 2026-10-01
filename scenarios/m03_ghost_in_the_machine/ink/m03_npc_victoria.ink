EXTERNAL player_name()

VAR victoria_influence = 0
VAR victoria_trusts_player = false
VAR victoria_suspicious = 0
VAR rfid_clone_started = false
VAR rfid_clone_complete = false
// Scenario global, set by tag the moment her card is captured. Synced back in on
// every talk, so a resumed or restored story never re-runs the clone tags (D13).
VAR victoria_card_cloned = false
VAR topic_zero_day_philosophy = false
VAR topic_free_market = false
VAR topic_ethics = false
VAR recruitment_discussed = false
VAR player_approach = ""
VAR night_confrontation_ready = false
VAR victoria_fate = ""

// Root divert. When a conversation has ended (-> DONE), the engine restores only
// its variables on the next talk and continues from the root (npc-conversation-
// state.js restoreNPCState). Without this line the root is empty and the player
// sees "(End of conversation)" instead of the start knot's re-entry routing.
-> start

=== start ===
#speaker:victoria_sterling
{ victoria_fate == "ko":
    -> out_cold
}
// Re-entry guard: once her fate is decided the confrontation never replays.
{ victoria_fate != "" and victoria_fate != "ko":
    -> after_choice
}
{ night_confrontation_ready:
    -> nighttime_confrontation
}
#complete_task:meet_victoria
{ not recruitment_discussed:
    #display:victoria-professional
    Narrator: Victoria Sterling stands as you enter. Professional attire, confident bearing.
    Victoria Sterling: You must be {player_name()}. Welcome to WhiteHat Security.
    Victoria Sterling: I'm Victoria Sterling, CEO. Have a seat.
    Narrator: She gestures to the conference table.
    ~ recruitment_discussed = true
    -> first_impression
}
{ recruitment_discussed && not rfid_clone_complete && not victoria_card_cloned:
    #display:victoria-neutral
    Victoria Sterling: Back for more conversation?
    -> hub
}
{ rfid_clone_complete or victoria_card_cloned:
    #display:victoria-neutral
    Victoria Sterling: We covered the main points. I'll be in touch about the training programme.
    #exit_conversation
    -> idle
}

=== first_impression ===
#speaker:victoria_sterling
Victoria Sterling: I reviewed your background. Freelance pen testing, some CTF competition work.
Victoria Sterling: Solid technical skills. But that's not why you're here.
* [Why am I here, then?]
    Victoria Sterling: To see if you understand the philosophy behind real security research.
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    -> philosophy_intro
* [I'm interested in advanced research]
    ~ victoria_influence = victoria_influence + 10
    # influence_increased
    You: I want to work on cutting-edge research. Real impact.
    Victoria Sterling: "Real impact." Good. Let's talk about what that means.
    -> philosophy_intro
* [I heard Zero Day does interesting work]
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    ~ victoria_suspicious = victoria_suspicious + 5
    You: I've heard Zero Day's training programmes are... unconventional.
    Victoria Sterling: *slight pause* We push boundaries, yes. Let me explain our approach.
    -> philosophy_intro

=== philosophy_intro ===
#speaker:victoria_sterling
Victoria Sterling: The traditional security model is broken. Researchers find vulnerabilities, report them to vendors, wait months for patches.
Victoria Sterling: Meanwhile, those same vulnerabilities get discovered by others. Sold on dark markets. Exploited.
* [That's the responsible disclosure debate]
    ~ victoria_influence = victoria_influence + 10
    # influence_increased
    You: The responsible disclosure versus full disclosure debate. Classic dilemma.
    Victoria Sterling: Exactly. But there's a third option most won't discuss.
    -> market_efficiency_pitch
* [Researchers deserve to be paid]
    ~ victoria_influence = victoria_influence + 15
    # influence_increased
    You: Researchers deserve compensation for their work. Fair pay for valuable discoveries.
    Victoria Sterling: *warmly* Finally. Someone who gets it.
    -> market_efficiency_pitch
* [Sounds like you sell vulnerabilities]
    ~ victoria_influence = victoria_influence - 5
    # influence_decreased
    ~ victoria_suspicious = victoria_suspicious + 10
    You: This sounds like you're advocating selling vulnerabilities.
    Victoria Sterling: "Selling" is such a crude term. Think of it as market-driven research incentives.
    -> market_efficiency_pitch

=== market_efficiency_pitch ===
#speaker:victoria_sterling
Victoria Sterling: We provide liquidity to the vulnerability market.
Victoria Sterling: Every system tends toward disorder. That's thermodynamics - entropy is inevitable.
Victoria Sterling: The question isn't whether systems will fail. It's who benefits from that knowledge.
~ topic_free_market = true
-> hub

=== hub ===
+ {not topic_zero_day_philosophy} [Ask about Zero Day's mission]
    -> zero_day_philosophy
+ {not topic_ethics} [Question the ethics]
    -> ethics_discussion
+ {(victoria_influence >= 20 or (topic_zero_day_philosophy and topic_ethics)) && not rfid_clone_started} [Move closer to examine the whiteboard]
    -> clone_rfid_opportunity
+ {rfid_clone_started && not rfid_clone_complete} [Keep her talking about the lab]
    -> clone_rfid_distraction
+ [End the conversation]
    #speaker:victoria_sterling
    { victoria_influence >= 30:
        Victoria Sterling: I think you'd be a good fit for our training programme. I'll be in touch.
        ~ victoria_trusts_player = true
    }
    { (victoria_influence < 30) && (victoria_influence >= 10):
        Victoria Sterling: We'll review your application. Thank you for your time.
    }
    { victoria_influence < 10:
        Victoria Sterling: I'm not sure you're the right fit for Zero Day's culture. We'll be in touch.
    }
    #exit_conversation
    -> idle

=== zero_day_philosophy ===
#speaker:victoria_sterling
~ topic_zero_day_philosophy = true
Victoria Sterling: Zero Day's mission is simple: recognise that vulnerability knowledge has inherent value.
Victoria Sterling: We discover, we price according to demand, we connect buyers with opportunities.
* [And what do the buyers do with these exploits?]
    Victoria Sterling: That's not our concern. We're security professionals, not moralists.
    Victoria Sterling: A gun manufacturer isn't responsible for every shooting.
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    -> moral_rationalization
* [That sounds like wilful ignorance]
    ~ victoria_influence = victoria_influence - 10
    # influence_decreased
    ~ victoria_suspicious = victoria_suspicious + 10
    You: "Not our concern"? That's wilful ignorance of the consequences.
    Victoria Sterling: *a touch defensive* It's recognising the reality of how markets work.
    -> moral_rationalization
* [The free market argument]
    ~ victoria_influence = victoria_influence + 15
    # influence_increased
    You: So you're applying free market principles to vulnerability research.
    Victoria Sterling: *smiles* Precisely. Supply and demand. Transparent economics.
    -> moral_rationalization

=== moral_rationalization ===
#speaker:victoria_sterling
Victoria Sterling: We live in a world where vulnerabilities exist whether we like it or not.
Victoria Sterling: Our choice isn't between exploit sales happening or not happening. They already happen.
Victoria Sterling: Our choice is whether security researchers get fairly compensated, or whether only criminals profit.
~ victoria_influence = victoria_influence + 5
# influence_increased
-> hub

=== ethics_discussion ===
#speaker:victoria_sterling
~ topic_ethics = true
Victoria Sterling: Let me guess - you want to ask about the "morality" of selling exploits.
Victoria Sterling: Go ahead. I've heard every argument.
* [What about innocent people getting hurt?]
    ~ victoria_influence = victoria_influence - 5
    # influence_decreased
    You: What about when exploits you sold hurt innocent people? Hospitals, critical infrastructure?
    Victoria Sterling: *evenly* That's on the buyer, not the researcher who discovered the vulnerability.
    -> ethics_response_harm
* [There's a difference between research and weaponization]
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    You: There's a line between security research and creating weapons. Where do you draw that line?
    Victoria Sterling: Interesting question. Most people don't even acknowledge there is a line to discuss.
    -> ethics_response_nuance
* [I'm not here to judge]
    ~ victoria_influence = victoria_influence + 15
    # influence_increased
    ~ player_approach = "diplomatic"
    You: I'm not here to judge your business model. I'm here to understand it.
    Victoria Sterling: *pleased* That's refreshing. Most people lead with moral indignation.
    -> ethics_response_pragmatic

=== ethics_response_harm ===
#speaker:victoria_sterling
Victoria Sterling: Do you hold pharmaceutical companies responsible when someone overdoses on painkillers?
Victoria Sterling: Do you blame car manufacturers for drunk driving fatalities?
Victoria Sterling: Tools have utility. People choose how to use them.
~ victoria_influence = victoria_influence - 5
# influence_decreased
-> hub

=== ethics_response_nuance ===
#speaker:victoria_sterling
Victoria Sterling: The line is intent. We don't create exploits TO hurt people. We discover vulnerabilities that already exist.
Victoria Sterling: If someone uses a crowbar to break into a house, you don't blame the crowbar manufacturer.
~ victoria_influence = victoria_influence + 10
# influence_increased
-> hub

=== ethics_response_pragmatic ===
#speaker:victoria_sterling
Victoria Sterling: Pragmatism. I appreciate that.
Victoria Sterling: The truth is, I sleep fine at night because I believe in information freedom.
Victoria Sterling: Vulnerabilities are facts about reality. Suppressing facts doesn't make anyone safer.
~ victoria_influence = victoria_influence + 10
# influence_increased
~ victoria_trusts_player = true
-> hub

=== clone_rfid_opportunity ===
#speaker:victoria_sterling
Narrator: You stand and move toward the whiteboard, getting closer to Victoria.
You: This network diagram - is this your training lab architecture?
{ victoria_influence >= 20:
    Victoria Sterling: Yes. The 192.168.100.0 subnet. Students practise on isolated VMs.
- else:
    Victoria Sterling: *curtly* The training lab. Since you're so interested.
}
Narrator: The cloner in your pocket starts reading her card. Custom keys: this will take a while. Keep her talking.
~ rfid_clone_started = true
-> clone_rfid_distraction

=== clone_rfid_distraction ===
#speaker:victoria_sterling
Victoria Sterling: The training network uses real vulnerable services. Much more effective than theoretical exercises.
* [What kind of services do you run in the lab environment?]
    Victoria Sterling: FTP, a web host, some legacy services -- there's a distcc box on there we keep telling the students not to touch. Real targets, not textbook ones.
    -> clone_check_1
* [How do students access the training network?]
    Victoria Sterling: Only from the server room terminal. The lab has no route out to the internet.
    -> clone_check_1
* [That's an impressive training environment. More realistic than most.]
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    Victoria Sterling: We pride ourselves on authenticity. Real exploits, real scenarios.
    -> clone_check_1

=== clone_check_1 ===
#speaker:victoria_sterling
Narrator: Halfway. The cloner is still reading.
Victoria Sterling: Of course, what students learn in the lab is just the beginning.
Victoria Sterling: Real Zero Day research requires understanding market dynamics, pricing models, buyer relationships.
* [How do you determine pricing for a zero-day vulnerability?]
    Victoria Sterling: CVSS is the baseline. Then a sector premium based on how well the target can defend itself. Hospitals can't, so hospitals cost more.
    -> clone_check_2
* [That sounds more complex than pure technical work.]
    Victoria Sterling: Security research is as much economics as it is code. Most researchers don't grasp that.
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    -> clone_check_2
* [Who are your typical buyers?]
    ~ victoria_suspicious = victoria_suspicious + 5
    You: Who typically buys from Zero Day?
    Victoria Sterling: *slight pause* Clients who need access to specialised research. I can't discuss specifics.
    -> clone_check_2

=== clone_check_2 ===
#speaker:victoria_sterling
Victoria Sterling: You're asking good questions. Technical competence is common. Strategic thinking is rare.
* [I believe in understanding the full picture]
    ~ victoria_influence = victoria_influence + 10
    # influence_increased
    You: Technical skills alone aren't enough. You need to understand the ecosystem.
    Victoria Sterling: Exactly. That's why most security researchers stay poor while we thrive.
    -> clone_complete
* [Stay focused on the whiteboard]
    Narrator: You pretend to study the network diagram.
    You: This training lab must have taken significant investment.
    Victoria Sterling: Worth every penny. Our students go operational faster than any university programme.
    -> clone_complete
* [Just a few more seconds...]
    Narrator: Keep her talking.
    You: And the certifications - do you offer any formal credentials?
    Victoria Sterling: We don't believe in traditional certifications. Results speak louder than paper.
    -> clone_complete

=== clone_complete ===
#speaker:victoria_sterling
Narrator: The cloner buzzes once against your leg. Capture done; the key crack runs on its own now.
{ not victoria_card_cloned:
    ~ rfid_clone_complete = true
    ~ victoria_card_cloned = true
    #set_global:victoria_card_cloned:true
    #clone_keycard:victoria_keycard_clone
    #complete_task:clone_rfid_card
    Narrator: You step back from the whiteboard, easing the distance open again.
}
-> clone_debrief

// Separate knot so the choices below belong to clone_debrief. When the engine
// restores a paused conversation it re-enters the knot that owns the current
// choices; that is now this one, never the knot carrying the clone tags.
=== clone_debrief ===
#speaker:victoria_sterling
Victoria Sterling: I think that covers the basic philosophy. The training programme starts next month if you're interested.
* [I'm very interested]
    ~ victoria_influence = victoria_influence + 10
    # influence_increased
    You: This is exactly the kind of work I've been looking for.
    Victoria Sterling: Excellent. I'll have my assistant send you the enrolment details.
    -> meeting_end
* [Let me think it over. This is a significant decision.]
    Victoria Sterling: Of course. Take your time. Reach out when you've decided.
    -> meeting_end
* [I appreciate you taking the time to explain Zero Day's approach.]
    Victoria Sterling: My pleasure. It's rare to meet someone who actually wants to understand rather than judge.
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    -> meeting_end

=== meeting_end ===
#speaker:victoria_sterling
Victoria Sterling: Feel free to look around the office if you'd like. Reception area, main hallway. Get a feel for the company culture.
{ victoria_trusts_player:
    Victoria Sterling: And {player_name()}? I think you'd fit in well here. We need more pragmatists.
}
Victoria Sterling: I have another meeting in a few minutes. But we'll be in touch.
Narrator: Victoria's phone buzzes. She glances at it.
Victoria Sterling: Excuse me, I need to take this.
#exit_conversation
-> idle

=== nighttime_confrontation ===
#speaker:victoria_sterling
#display:victoria-neutral
Narrator: Victoria is standing by the window. Coat on, a slim bag over one shoulder. She is not startled. She has been waiting.
Victoria Sterling: You came back after hours. Recruits don't do that.
Victoria Sterling: You asked about the training network twice this afternoon. Once is curiosity. Twice is an inventory.
Victoria Sterling: So let's not perform the part where I'm surprised. Who are you with?
* [SAFETYNET. And I know the name on your approvals. Sable.]
    Victoria Sterling: *drily* Nobody's said that name to my face before. You really have been thorough.
    -> the_reckoning
* [St. Catherine's Hospital. Your ProFTPD exploit. People died on that ward.]
    Victoria Sterling: I sold a vulnerability. What a buyer builds with it is a buyer's problem.
    You: You charged a healthcare premium. Forty per cent. You priced the bodies in.
    Victoria Sterling: I priced the urgency in. Hospitals pay fast, and they pay quietly. That isn't cruelty. It's arithmetic.
    -> the_reckoning
* [Phase 2. Healthcare SCADA. The grid. You're already sourcing the targets.]
    Victoria Sterling: *a beat* Then you understand how far past me this runs. And how little arresting me changes it.
    -> the_reckoning

=== the_reckoning ===
#speaker:victoria_sterling
#display:victoria-neutral
Victoria Sterling: Let me spare us the scene you're braced for. You want the confession. The tears for the ward.
Victoria Sterling: I read every obituary. I can recite them in order. It changed nothing I believe.
Victoria Sterling: Vulnerabilities are facts. Someone will always sell the facts. Better a professional who logs the sale than a criminal who doesn't.
You: That's the story you tell yourself so you can sleep.
Victoria Sterling: I sleep perfectly. That's the part people like you can never forgive.
Narrator: She settles the bag on her shoulder. The coat, the bag — she has been ready to leave since before you crossed the threshold.
Victoria Sterling: To the Architect I'm a line item. Sable, Zero Day, this office — all of it is rented. All of it replaceable.
Victoria Sterling: So decide what you actually want from the next thirty seconds. I have a car downstairs, and you have exactly one move.
-> confrontation_decision

=== confrontation_decision ===
+ [Give me the Architect and Phase 2. Do that and I'll fight for a deal.]
    -> confrontation_recruit
+ [You're not walking out of here. Bag down.]
    -> confrontation_arrest
+ [Go. I've already got what I need off your servers.]
    -> confrontation_escape

=== confrontation_recruit ===
#speaker:victoria_sterling
You: Then be useful. The Architect's channels, the payment rails, Phase 2 — all of it. Do that and I'll fight for a deal. Not immunity. A deal.
Victoria Sterling: *considering* Not immunity. At least you're honest. Most of your people lead with a promise they can't keep.
Narrator: She lets the bag slide off her shoulder onto the desk.
Victoria Sterling: I don't have the Architect's name. Nobody does. But I have the comms protocol, the rails the money moves on, and the Phase 2 window.
You: When.
Victoria Sterling: Weeks. Not months. The assets are already moving into position.
Victoria Sterling: Understand what this is, {player_name()}. I'm not doing it because you moved me. I'm doing it because you're a better bet than a shallow grave. Don't mistake the one for the other.
~ victoria_fate = "recruited"
#set_global:victoria_recruited:true
#set_global:victoria_fate:recruited
#set_global:victoria_choice_made:true
#complete_task:victoria_choice_made
#exit_conversation
-> idle

=== confrontation_arrest ===
#speaker:victoria_sterling
You: You're not going anywhere. Put the bag down. Hands where I can see them.
Narrator: You put yourself between Victoria and the door. She measures the distance, the odds, and lets the bag drop.
Victoria Sterling: *quietly* You understand this stops nothing. I'm a desk. They'll have it filled by Monday.
You: Then I'll take whoever sits at it next, too.
Victoria Sterling: *almost amused* Careful. That very nearly had a body count of its own.
Victoria Sterling: The evidence is real. The name is real. And none of it reaches the Architect. Enjoy the paperwork.
~ victoria_fate = "arrested"
#set_global:victoria_arrested:true
#set_global:victoria_fate:arrested
#set_global:victoria_choice_made:true
#complete_task:victoria_choice_made
#exit_conversation
-> idle

=== confrontation_escape ===
#speaker:victoria_sterling
Narrator: You have the logs. That is the case. What you don't have is a reason to bleed for the collar.
You: Go. I've got everything I need off your servers. You're just the signature on it now.
Victoria Sterling: *unhurried* A professional to the end. I could almost have used you.
Victoria Sterling: For what little it's worth — the dead at St. Catherine's were never the point. They were the proof of concept.
Narrator: She's past you and gone before the lift doors settle. The evidence stays. So does she, somewhere out beyond it.
~ victoria_fate = "escaped"
#set_global:victoria_escaped:true
#set_global:victoria_fate:escaped
#set_global:victoria_choice_made:true
#complete_task:victoria_choice_made
#exit_conversation
-> idle

=== after_choice ===
#speaker:victoria_sterling
Victoria Sterling: We're done, {player_name()}. You made your choice.
+ [Leave]
    #exit_conversation
    -> idle

=== out_cold ===
Narrator: She's out cold. Whatever she knows, she isn't saying it tonight.
+ [Leave her]
    #exit_conversation
    -> idle

// Resting point between talks (m02 pattern): conversations never reach DONE, so
// the engine saves the story at these choices and restores it here next time.
// The conditions cover every state, so the knot is never empty.
=== idle ===
+ {victoria_fate == "" and night_confrontation_ready} [Sterling. We need to talk.]
    -> nighttime_confrontation
+ {victoria_fate == "" and not night_confrontation_ready and not (rfid_clone_complete or victoria_card_cloned)} [Pick the conversation back up]
    -> start
+ {victoria_fate == "" and not night_confrontation_ready and (rfid_clone_complete or victoria_card_cloned)} [Thank her for her time]
    -> start
+ {victoria_fate == "ko"} [She's out cold. Leave her.]
    #exit_conversation
    -> idle
+ {victoria_fate != "" and victoria_fate != "ko"} [There's nothing more to say to her.]
    #exit_conversation
    -> idle
