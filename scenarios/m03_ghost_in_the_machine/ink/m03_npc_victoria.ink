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
VAR topic_ethics = false
VAR recruitment_discussed = false
VAR night_confrontation_ready = false
VAR victoria_fate = ""
// Synced scenario globals: what the player has opened (pass 3, P1/P3). usb_seen is
// written directly by the drive's onRead; lore_directive_found arrives via a task
// completion, so both are checked.
VAR usb_seen = false
VAR lore_directive_found = false
VAR roster_seen = false
// Pass 4 synced globals. receptionist_ko: she noticed the empty front desk (fix 2).
// clone_call_done: set when the night-transition scene plays, so from then on it
// is night (fix 3); mission_phase flips while the player is still in her room.
// guard_told_safetynet: the guard rang her (fix 6).
VAR receptionist_ko = false
VAR clone_call_done = false
VAR guard_told_safetynet = false
// Local state (pass 3). P4: Victoria's suspicion decides whether the custom-key read
// lands first time. P1: the recruit offer is refused once without the drive.
VAR suspicion_warned = false
VAR eager_act_done = false
VAR read_dropped = false
VAR read_checked = false
VAR recruit_refused = false
// Pass 3b: the lab questions are tracked in variables, not ink visit counts, because a
// reload restarts the story with variables restored and visit counts lost.
VAR asked_lab_services = false
VAR asked_lab_access = false
VAR asked_lab_praise = false
// Playtest round: set by every exit so idle/hub re-entry lines show on a reopen,
// not in the same batch as a goodbye.
VAR idle_quiet = false
VAR hub_quiet = false

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
// Pass 4 (fix 3): at night, before the network work is in, she is on a call and
// the player backs out unseen. The confrontation waits for all four flags.
{ clone_call_done:
    -> night_on_call
}
#complete_task:meet_victoria
{ not recruitment_discussed:
    #display:victoria-professional
    Narrator: Victoria Sterling rises as you come in, composed and sure of herself.
    Victoria Sterling: You must be the candidate. Welcome to WhiteHat Security.
    Victoria Sterling: I'm Victoria Sterling, CEO. Have a seat.
    Narrator: She gestures to the conference table.
    // Pass 4 (fix 2): a knocked-out receptionist doesn't go unnoticed. Feeds the
    // P4 suspicion logic, and opens the "eager recruit" walk-back.
    { receptionist_ko:
        ~ victoria_suspicious = victoria_suspicious + 10
        ~ suspicion_warned = true
        Victoria Sterling: Our receptionist isn't at her desk. You didn't pass her on the way in?
        Narrator: She says it lightly. She watches your face the whole time she says it.
    }
    ~ recruitment_discussed = true
    -> first_impression
}
{ recruitment_discussed && not victoria_card_cloned:
    #display:victoria-neutral
    Victoria Sterling: Back for more conversation?
    ~ hub_quiet = true
    -> hub
}
{ victoria_card_cloned:
    #display:victoria-neutral
    Victoria Sterling: We covered the main points. I'll be in touch about the training programme.
    ~ idle_quiet = true
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
* [I want cutting-edge research. Real impact.]
    ~ victoria_influence = victoria_influence + 10
    # influence_increased
    Victoria Sterling: "Real impact." Good. Let's talk about what that means.
    -> philosophy_intro
* [I've heard Zero Day's training programmes are... unconventional.]
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    ~ victoria_suspicious = victoria_suspicious + 5
    Victoria Sterling: *slight pause* We push boundaries, yes. Let me explain our approach.
    -> philosophy_intro

=== philosophy_intro ===
#speaker:victoria_sterling
Victoria Sterling: The traditional security model is broken. Researchers find vulnerabilities, report them to vendors, wait months for patches.
Victoria Sterling: Meanwhile, those same vulnerabilities get discovered by others. Sold on dark markets. Exploited.
* [So, responsible disclosure or full disclosure?]
    ~ victoria_influence = victoria_influence + 10
    # influence_increased
    Victoria Sterling: Neither. There's a third option most won't discuss.
    -> market_efficiency_pitch
* [Researchers deserve fair pay for what they find.]
    ~ victoria_influence = victoria_influence + 15
    # influence_increased
    Victoria Sterling: *warmly* Good. You'd be amazed how many people choke on that sentence.
    -> market_efficiency_pitch
* [This sounds like you're advocating selling vulnerabilities.]
    ~ victoria_influence = victoria_influence - 5
    # influence_decreased
    ~ victoria_suspicious = victoria_suspicious + 10
    Victoria Sterling: "Selling" is such a crude term. Think of it as market-driven research incentives.
    { victoria_suspicious >= 10 and not suspicion_warned:
        ~ suspicion_warned = true
        Narrator: Her smile stays exactly where it was. Her eyes don't. A recruit wouldn't have said that.
    }
    -> market_efficiency_pitch

=== market_efficiency_pitch ===
#speaker:victoria_sterling
Victoria Sterling: Every system tends towards disorder. Entropy, if you like.
Victoria Sterling: Systems fail. What matters is who knows first, and who pays them for knowing.
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Victoria Sterling: {&Go on.|What else?|Ask.}
}
+ {not topic_zero_day_philosophy} [What is Zero Day actually for?]
    -> zero_day_philosophy
+ {not topic_ethics} [Can I ask about the ethics of it?]
    -> ethics_discussion
+ {(victoria_influence >= 20 or (topic_zero_day_philosophy and topic_ethics)) && not rfid_clone_started} [Is that your training lab on the whiteboard?]
    -> clone_rfid_opportunity
+ {rfid_clone_started && not rfid_clone_complete && not read_dropped} [Keep her talking about the lab]
    -> clone_rfid_distraction
+ {read_dropped && not rfid_clone_complete && (victoria_suspicious < 10 or eager_act_done)} [Drift back to the whiteboard]
    -> clone_retry
+ {(suspicion_warned or read_dropped) && not eager_act_done && not rfid_clone_complete} [{receptionist_ko:Nobody was at the desk, so I found my own way in.|Sorry about earlier. Freelance habit -- I test every client's story.}]
    -> eager_recruit
+ {rfid_clone_complete && not victoria_card_cloned} [Lean back towards the whiteboard. The cloner needs another read.]
    -> clone_recapture
+ [Thank you. I've taken enough of your time.]
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
    ~ idle_quiet = true
    #exit_conversation
    -> idle

=== zero_day_philosophy ===
#speaker:victoria_sterling
~ topic_zero_day_philosophy = true
Victoria Sterling: Zero Day is simple. A vulnerability is worth something to somebody.
Victoria Sterling: We find it, we price it, and we find the somebody.
* [And what do the buyers do with these exploits?]
    Victoria Sterling: That's not our concern. We're security professionals, not moralists.
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    -> moral_rationalization
* [And you don't care what the buyers do? That's wilful ignorance.]
    ~ victoria_influence = victoria_influence - 10
    # influence_decreased
    ~ victoria_suspicious = victoria_suspicious + 10
    Victoria Sterling: It's recognising the reality of how markets work.
    { victoria_suspicious >= 10 and not suspicion_warned:
        ~ suspicion_warned = true
        Narrator: Her smile stays exactly where it was. Her eyes don't. A recruit wouldn't have said that.
    }
    -> moral_rationalization
* [So it's a free market in vulnerabilities.]
    ~ victoria_influence = victoria_influence + 15
    # influence_increased
    Victoria Sterling: Precisely.
    -> moral_rationalization

=== moral_rationalization ===
#speaker:victoria_sterling
Victoria Sterling: Exploit sales happen with or without us.
Victoria Sterling: So either the researcher gets paid, or the criminal does. I know which I'd rather fund.
~ victoria_influence = victoria_influence + 5
# influence_increased
-> hub

=== ethics_discussion ===
#speaker:victoria_sterling
~ topic_ethics = true
Victoria Sterling: Go ahead. I've heard every argument.
* [What about when exploits you sold hurt people? Hospitals, infrastructure?]
    ~ victoria_influence = victoria_influence - 5
    # influence_decreased
    ~ victoria_suspicious = victoria_suspicious + 5
    Victoria Sterling: *evenly* That's on the buyer, not the researcher who discovered the vulnerability.
    { victoria_suspicious >= 10 and not suspicion_warned:
        ~ suspicion_warned = true
        Narrator: Her smile stays exactly where it was. Her eyes don't. A recruit wouldn't have said that.
    }
    -> ethics_response_harm
* [There's a line between research and making weapons. Where do you draw it?]
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    Victoria Sterling: Interesting question.
    -> ethics_response_nuance
* [I'm not here to judge your business model. Just to understand it.]
    ~ victoria_influence = victoria_influence + 15
    # influence_increased
    -> ethics_response_pragmatic

=== ethics_response_harm ===
#speaker:victoria_sterling
Victoria Sterling: Tools have utility. People choose how to use them.
~ victoria_influence = victoria_influence - 5
# influence_decreased
-> hub

=== ethics_response_nuance ===
#speaker:victoria_sterling
Victoria Sterling: The line is intent. We don't build exploits to hurt anyone. We find holes that are already there.
Victoria Sterling: If someone uses a crowbar to break into a house, you don't blame the crowbar manufacturer.
~ victoria_influence = victoria_influence + 10
# influence_increased
-> hub

=== ethics_response_pragmatic ===
#speaker:victoria_sterling
Victoria Sterling: Good. Indignation is cheap, and it pays nobody's rent.
~ victoria_influence = victoria_influence + 10
# influence_increased
~ victoria_trusts_player = true
-> hub

=== clone_rfid_opportunity ===
#speaker:victoria_sterling
Narrator: You get up and go to the board, close to Victoria.
{ victoria_influence >= 20:
    Victoria Sterling: Yes. An isolated network, real services. Students practise on it from the server room.
- else:
    Victoria Sterling: *curtly* The training lab. Since you're so interested.
}
Narrator: The cloner in your pocket starts reading her card. Custom keys: you'll need Darkside afterwards, and that takes about thirty seconds. Keep her talking while it reads.
~ rfid_clone_started = true
-> clone_rfid_distraction

// P4: walking back an earlier line. Choice-free, state first, so a save can't
// land between the choice and its effect.
=== eager_recruit ===
#speaker:victoria_sterling
~ eager_act_done = true
~ victoria_suspicious = victoria_suspicious - 10
// Pass 4 round 2: after a receptionist KO the doubt is about the empty desk, not
// a pointed question, so the walk-back answers that.
{ receptionist_ko:
    Victoria Sterling: *coolly* How thoughtful.
- else:
    Victoria Sterling: *coolly* Do you. Well. Most people don't bother to walk it back.
}
Narrator: She doesn't warm to you. But she stops watching your hands.
-> hub

=== clone_retry ===
#speaker:victoria_sterling
Narrator: Back at the board. The cloner finds her card again and starts a fresh read.
-> clone_rfid_distraction

=== clone_rfid_distraction ===
#speaker:victoria_sterling
{ not read_dropped:
    Victoria Sterling: The training network uses real vulnerable services. Much more effective than theoretical exercises.
}
* {not asked_lab_services} [What kind of services do you run in the lab environment?]
    ~ asked_lab_services = true
    Victoria Sterling: FTP, a web host, some legacy services. There's a distcc box on there we keep telling the students not to touch.
    -> clone_check_1
* {not asked_lab_access} [How do students access the training network?]
    ~ asked_lab_access = true
    Victoria Sterling: Only from the server room terminal. The lab has no route out to the internet.
    -> clone_check_1
* {not asked_lab_praise} [That's an impressive training environment. More realistic than most.]
    ~ asked_lab_praise = true
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    Victoria Sterling: Nothing in there is a toy. My students break real things.
    -> clone_check_1

=== clone_check_1 ===
#speaker:victoria_sterling
// P4: a suspicious Victoria steps out of range once. read_checked stops a reload
// (which restarts at start with variables restored) failing a player who passed.
{ victoria_suspicious >= 10 and not eager_act_done and not read_dropped and not read_checked:
    -> clone_read_dropped
}
~ read_checked = true
Narrator: Halfway. The cloner is still reading.
Victoria Sterling: Of course, what students learn in the lab is just the beginning.
Victoria Sterling: The money is in knowing who'll pay, and how much.
* [How do you determine pricing for a zero-day vulnerability?]
    Victoria Sterling: CVSS is the baseline. Then a sector premium based on how well the target can defend itself. Hospitals can't, so hospitals cost more.
    -> clone_check_2
* [That sounds more complex than pure technical work.]
    Victoria Sterling: Security research is as much economics as it is code.
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    -> clone_check_2
* [Who typically buys from Zero Day?]
    ~ victoria_suspicious = victoria_suspicious + 5
    Victoria Sterling: *slight pause* Clients who need access to specialised research. I can't discuss specifics.
    -> clone_check_2

=== clone_read_dropped ===
#speaker:victoria_sterling
~ read_dropped = true
// Pass 5 (P1-25): synced so HaX's "she keeps stepping away" hint shows only now.
#set_global:clone_read_dropped:true
Victoria Sterling: Let's sit back down. I'd rather see your face than the back of your head.
Narrator: She walks back to the table. The cloner's read stalls halfway, then drops. Out of range.
-> hub

=== clone_check_2 ===
#speaker:victoria_sterling
Victoria Sterling: You're asking good questions. Technical competence is common. Strategic thinking is rare.
Narrator: Nearly there. Keep her talking.
* [Skills are cheap. Knowing where to sell them isn't.]
    ~ victoria_influence = victoria_influence + 10
    # influence_increased
    Victoria Sterling: Exactly. That's why most security researchers stay poor while we thrive.
    -> clone_complete
* [This lab can't have been cheap to build.]
    Narrator: Your eyes stay on the network diagram.
    Victoria Sterling: Worth every penny. Our students go operational faster than any university programme.
    -> clone_complete
* [Do you offer any formal certifications?]
    Victoria Sterling: We don't believe in traditional certifications. Results speak louder than paper.
    -> clone_complete

=== clone_complete ===
#speaker:victoria_sterling
Narrator: The cloner buzzes once against your leg. Card read. Now run Darkside on it.
// Pass 3c (m04 Vance pattern): the tag sits on a throwaway line, because starting
// the RFID minigame ends this chat. victoria_card_cloned and clone_rfid_card are set
// by the card_cloned mapping on Save, never here, so closing the flipper early
// leaves the card unsaved and the hub offers the read again (clone_recapture).
{ not victoria_card_cloned:
    ~ rfid_clone_complete = true
    #clone_keycard:victoria_keycard_clone
    Narrator: You step back from the whiteboard, easing the distance open again.
}
-> clone_debrief

=== clone_recapture ===
#speaker:victoria_sterling
Narrator: You drift back to the whiteboard with a question about the subnet, and stand close while she answers.
#clone_keycard:victoria_keycard_clone
Narrator: She answers at length. She likes this diagram.
-> clone_debrief

// Separate knot so the choices below belong to clone_debrief. When the engine
// restores a paused conversation it re-enters the knot that owns the current
// choices; that is now this one, never the knot carrying the clone tags.
=== clone_debrief ===
#speaker:victoria_sterling
{ not victoria_card_cloned:
    Narrator: The cloner didn't keep the read. You'll need to get close to her card again.
    -> hub
}
Victoria Sterling: I think that covers the basic philosophy. The training programme starts next month if you're interested.
* [This is exactly the kind of work I've been looking for.]
    ~ victoria_influence = victoria_influence + 10
    # influence_increased
    Victoria Sterling: Excellent. I'll have my assistant send you the enrolment details.
    -> meeting_end
* [Let me think it over.]
    Victoria Sterling: Of course. Take your time. Reach out when you've decided.
    -> meeting_end
* [Thanks for being straight with me.]
    Victoria Sterling: My pleasure.
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    -> meeting_end

=== meeting_end ===
#speaker:victoria_sterling
Victoria Sterling: Feel free to look around the office if you'd like. Reception area, main hallway. Get a feel for the company culture.
{ victoria_trusts_player:
    Victoria Sterling: Off the record? I think you'd fit in well here. We need more pragmatists.
}
Victoria Sterling: I have another meeting in a few minutes. But we'll be in touch.
Narrator: Victoria's phone buzzes. She glances at it.
Victoria Sterling: Excuse me, I need to take this.
~ idle_quiet = true
#exit_conversation
-> idle

=== nighttime_confrontation ===
#speaker:victoria_sterling
#display:victoria-neutral
Narrator: Victoria is standing by the window. Coat on, a slim bag over one shoulder. She has been waiting for you.
Victoria Sterling: You came back after hours. Recruits don't do that.
{ receptionist_ko:
    Victoria Sterling: Nor do they leave my receptionist on her own floor. She can't remember your face. I can.
- else:
  { victoria_suspicious >= 10 or read_dropped or suspicion_warned:
    Victoria Sterling: You asked about the training network twice this afternoon. Once is curiosity. Twice is an inventory.
  - else:
    Victoria Sterling: You were very easy to like this afternoon. That should have worried me sooner.
  }
}
// Pass 4 (fix 6): telling her own guard costs the player the question.
{ guard_told_safetynet:
    Victoria Sterling: And my night guard rang me earlier, terribly excited. SAFETYNET, he said. I expect he promised you he wouldn't.
    Victoria Sterling: So let's not perform the part where I'm surprised. Say what you came to say.
- else:
    Victoria Sterling: So let's not perform the part where I'm surprised. Who are you with?
}
* [SAFETYNET. And I know the name on your approvals. Sable.]
    Victoria Sterling: *drily* Nobody's said that name to my face before. You really have been thorough.
    -> the_reckoning
* [St. Catherine's Hospital. Your ProFTPD exploit. People died on that ward.]
    Victoria Sterling: I sold a vulnerability. What a buyer builds with it is a buyer's problem.
    Victoria Sterling: Your Ghost liked to tell people they wrote that exploit themselves. They didn't. They bought it from me, twenty-five thousand, hospital premium and all.
    ++ [Forty per cent extra for a hospital. You priced the bodies in.]
        Victoria Sterling: I priced the urgency in. Hospitals pay fast, and they pay quietly. That isn't cruelty. It's arithmetic.
        -> the_reckoning
* {usb_seen or lore_directive_found or roster_seen} [I've been through your office, Sable. Your desk. Your files.]
    Victoria Sterling: *a beat* Then you understand how far past me this runs. And how little arresting me changes it.
    -> the_reckoning

=== the_reckoning ===
#speaker:victoria_sterling
#display:victoria-neutral
Victoria Sterling: Let me spare us the scene you're braced for. You want the confession. The tears for the ward.
Victoria Sterling: I read what that ward cost, down to the number. It changed nothing I believe.
Victoria Sterling: Vulnerabilities are facts. Someone will always sell the facts. Better a professional who logs the sale than a criminal who doesn't.
+ [That's the story you tell yourself so you can sleep.]
    Victoria Sterling: I sleep perfectly. That's the part people like you can never forgive.
    Narrator: She settles the bag on her shoulder.
    Victoria Sterling: To the Architect I'm a line item. Sable, Zero Day, this office -- all of it is rented. All of it replaceable.
    Victoria Sterling: So decide what you actually want from the next thirty seconds. I have a car downstairs, and you have exactly one move.
    -> confrontation_decision

=== confrontation_decision ===
// P1: the deal needs the drive from her desk. Without it she declines once.
+ {usb_seen or lore_directive_found} [I have your Phase 2 directive. Give me the Architect and I'll fight for a deal. Not immunity.]
    -> confrontation_recruit
+ {not (usb_seen or lore_directive_found) and not recruit_refused} [Work for us.]
    -> recruit_declined
+ [You're not walking out of here. Bag down, hands where I can see them.]
    -> confrontation_arrest
+ [Go. I've got what I need off your servers. You're just the signature now.]
    -> confrontation_escape

=== recruit_declined ===
#speaker:victoria_sterling
~ recruit_refused = true
Victoria Sterling: In exchange for what? You haven't even taken what you'd be asking me to betray.
Victoria Sterling: Still one move. Choose it.
-> confrontation_decision

=== confrontation_recruit ===
#speaker:victoria_sterling
Victoria Sterling: Not immunity. At least you're honest. Most of your people lead with a promise they can't keep.
Victoria Sterling: Then you already have the what. I'm the when.
Narrator: She lets the bag slide off her shoulder onto the desk.
Victoria Sterling: I don't have the Architect's name. Nobody does. But I have the comms protocol, the rails the money moves on, and the Phase 2 window.
Victoria Sterling: The window opens in weeks. The assets are already moving into position.
Victoria Sterling: Understand what this is. You didn't move me. You're simply a better bet than a shallow grave.
~ victoria_fate = "recruited"
#set_global:victoria_recruited:true
#set_global:victoria_fate:recruited
#complete_task:victoria_choice_made
~ idle_quiet = true
#exit_conversation
-> idle

=== confrontation_arrest ===
#speaker:victoria_sterling
Narrator: You put yourself between Victoria and the door. She measures the distance, the odds, and lets the bag drop.
Victoria Sterling: *quietly* You understand this stops nothing. I'm a desk. They'll have it filled by Monday.
Victoria Sterling: The evidence is real. The name is real. And none of it reaches the Architect. Enjoy the paperwork.
~ victoria_fate = "arrested"
#set_global:victoria_arrested:true
#set_global:victoria_fate:arrested
#complete_task:victoria_choice_made
~ idle_quiet = true
#exit_conversation
-> idle

=== confrontation_escape ===
#speaker:victoria_sterling
Victoria Sterling: *unhurried* A professional to the end. I could almost have used you.
Victoria Sterling: For what little it's worth -- St. Catherine's was a proof of concept. You'll see the rest.
Narrator: She's past you and gone before the lift doors settle.
~ victoria_fate = "escaped"
#set_global:victoria_escaped:true
#set_global:victoria_fate:escaped
#complete_task:victoria_choice_made
~ idle_quiet = true
#exit_conversation
-> idle

=== night_on_call ===
#speaker:victoria_sterling
// Pass 5 (P1-26): synced so HaX's "she won't engage" hint shows only once seen.
#set_global:sterling_on_call_seen:true
Victoria Sterling: *low, into her phone, back to the door* No. Not tonight. I said I'd deal with it myself.
Narrator: She hasn't heard you come in. You ease back out before she turns round.
~ idle_quiet = true
#exit_conversation
-> idle

=== after_choice ===
#speaker:victoria_sterling
Victoria Sterling: We're done here. You made your choice.
+ [Leave]
    ~ idle_quiet = true
    #exit_conversation
    -> idle

=== out_cold ===
Narrator: She's out cold. Whatever she knows, she isn't saying it tonight.
+ [Leave her]
    ~ idle_quiet = true
    #exit_conversation
    -> idle

// Resting point between talks (m02 pattern): conversations never reach DONE, so
// the engine saves the story at these choices and restores it here next time.
// The conditions cover every state, so the knot is never empty.
=== idle ===
{ idle_quiet:
    ~ idle_quiet = false
- else:
    { victoria_fate == "ko":
        Narrator: She's still out cold.
    - else:
        { victoria_fate != "":
            Narrator: Sterling has nothing more to say to you.
        - else:
            { night_confrontation_ready:
                Narrator: Sterling hasn't left. The light's still on in the conference room.
            - else:
                { clone_call_done:
                    Narrator: Sterling's still on the phone, her back to the door.
                - else:
                    Victoria Sterling: Was there something else?
                }
            }
        }
    }
}
+ {victoria_fate == "" and night_confrontation_ready} [Sterling. We need to talk.]
    -> nighttime_confrontation
+ {victoria_fate == "" and not night_confrontation_ready and not victoria_card_cloned and not clone_call_done} [Pick the conversation back up]
    -> start
+ {victoria_fate == "" and not night_confrontation_ready and victoria_card_cloned and not clone_call_done} [Thank her for her time]
    -> start
+ {victoria_fate == "" and not night_confrontation_ready and clone_call_done} [Look in on Sterling]
    -> start
+ {victoria_fate == "ko"} [She's out cold. Leave her.]
    Narrator: You leave her where she fell.
    ~ idle_quiet = true
    #exit_conversation
    -> idle
+ {victoria_fate != "" and victoria_fate != "ko"} [There's nothing more to say to her.]
    Narrator: She doesn't look up as you go.
    ~ idle_quiet = true
    #exit_conversation
    -> idle
