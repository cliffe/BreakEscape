// ===========================================
// Mission 5: NPC - Kevin Park
// IT Systems Administrator, Badge Clone Target
// ===========================================

VAR kevin_influence = 0           // 0-100 scale
VAR badge_cloned = false
VAR topic_network = false
VAR topic_torres = false
VAR topic_security = false
VAR offered_help = false
VAR first_meeting = true

// External variables
EXTERNAL player_name

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#speaker:kevin_park

{first_meeting:
    ~ first_meeting = false
    #display:kevin-casual

    A guy in his late 20s sits at a workstation, headphones on, fingers flying across the keyboard.

    He notices you and pulls off his headphones.

    Kevin: Hey! You must be the security consultant. Kevin Park, IT sysadmin.

    Kevin: Finally someone who might actually fix our mess.

    + [Nice to meet you. You're aware of the situation?]
        You: What can you tell me about the data breach?
        ~ kevin_influence += 10
        -> network_situation

    + [I'll need your help with technical access]
        You: Server logs, network diagrams, that kind of thing.
        Kevin: Oh yeah, totally. Whatever you need.
        ~ kevin_influence += 5
        ~ offered_help = true
        -> hub

    + [Just point me to the network logs]
        You: I can take it from here.
        Kevin: Sure, terminal's over there. Let me know if you need anything.
        -> hub
}

{not first_meeting:
    #display:kevin-friendly
    Kevin: What's up?
    -> hub
}

=== network_situation ===
#speaker:kevin_park

Kevin: Yeah, someone's been uploading huge files at like 2 AM.

Kevin: At first I thought it was legit remote work, but...

Kevin: Pattern's too consistent. Same time every Friday. Same encrypted protocols.

+ [You suspected something was wrong?]
    You: Why didn't you report it earlier?
    Kevin: I did! Patricia's been investigating for three weeks.
    ~ kevin_influence += 5
    -> hub

+ [That's helpful information]
    ~ kevin_influence += 10
    -> hub

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===

+ {not topic_network} [Ask about network infrastructure]
    -> ask_network

+ {not topic_torres} [Ask about David Torres]
    -> ask_torres

+ {not topic_security} [Ask about security gaps]
    -> ask_security

+ {kevin_influence >= 20 and not badge_cloned} [Request badge clone]
    -> request_badge_clone

+ {kevin_influence >= 30} [Request lockpick]
    -> request_lockpick

+ [That's all for now]
    #exit_conversation
    #speaker:kevin_park
    Kevin: Cool, catch you later!
    -> DONE

=== ask_network ===
#speaker:kevin_park
~ topic_network = true
~ kevin_influence += 5

Kevin: Our network's pretty standard. Corporate VPN, segmented VLANs.

Kevin: Server room's locked down - RFID badge access only. I can get you in if you need.

{kevin_influence >= 15:
    Kevin: There's a terminal in the server room that logs all network traffic. Super useful.
    ~ kevin_influence += 5
}

-> hub

=== ask_torres ===
#speaker:kevin_park
~ topic_torres = true
~ kevin_influence += 5

Kevin: David? He's like, crazy smart. PhD in cryptography.

Kevin: Works late a lot. Always stressed. His wife's sick, so...

{kevin_influence >= 20:
    Kevin: Between you and me, I think the stress is killing him.
    Kevin: Saw him in the server room Friday night. Just... standing there. Looking exhausted.
    ~ kevin_influence += 10
}

-> hub

=== ask_security ===
#speaker:kevin_park
~ topic_security = true
~ kevin_influence += 5

Kevin: Security's... not great. Budget cuts.

Kevin: We log access but don't monitor in real-time. PIN codes are weak.

{kevin_influence >= 25:
    Kevin: Want a pro tip? Check the server room at night. Some people think the cameras have blind spots.
    Kevin: They're right.
    ~ kevin_influence += 5
}

-> hub

=== request_badge_clone ===
#speaker:kevin_park

You: Kevin, I need a favor. I need access to restricted areas.

{kevin_influence >= 30:
    Kevin: Say no more. Here's my badge.
    Kevin: Just... don't tell Patricia I gave this to you, okay?

    #give_item:employee_badge
    #complete_task:clone_employee_badge
    #unlock_room:server_hallway

    ~ badge_cloned = true
    ~ kevin_influence -= 5

    Kevin: Server hallway's all yours now.
    -> hub
- else:
    Kevin: Uh... I don't know you well enough for that, man.
    Kevin: Talk to me more, build some trust first.
    -> hub
}

=== request_lockpick ===
#speaker:kevin_park

You: Do you have a lockpick kit? For... legitimate security testing.

{kevin_influence >= 40:
    Kevin: *grins* "Security testing." Right.
    Kevin: Actually, yeah. Left over from a pen test last year.

    #give_item:lockpick:3

    Kevin: Don't tell anyone where you got it.
    ~ kevin_influence += 5
    -> hub
- else:
    Kevin: Dude, I barely know you. Ask me when we're cool.
    -> hub
}

// ===========================================
// EVENT-TRIGGERED: Player Found Evidence
// ===========================================

=== on_evidence_discovered ===
#speaker:kevin_park

Kevin: Hey, did you find something? You look... intense.

+ [Just following leads]
    You: Nothing concrete yet.
    Kevin: Cool, let me know if I can help.
    -> DONE

+ [I think I know who the insider is]
    Kevin: Wait, seriously? Who?
    + + [I can't share details yet]
        Kevin: Right, right. Classified. Good luck.
        -> DONE
    + + [David Torres]
        Kevin: *shocked* David? No way. He wouldn't...
        Kevin: *pause* His wife. The medical bills. Shit.
        Kevin: I should have seen it.
        -> DONE

// ===========================================
// EVENT-TRIGGERED: Mission Complete
// ===========================================

=== on_mission_complete ===
#speaker:kevin_park

Kevin: So... is it over?

{torres_turned:
    You: It's resolved. That's all I can say.
    Kevin: But David's okay? He's not going to prison?
    You: He's cooperating. It's complicated.
    Kevin: *relieved* Okay. Good. He's a good guy who made bad choices.
}

{torres_arrested:
    You: The insider's been arrested.
    {torres_identified:
        Kevin: David? Damn. I can't believe it.
        Kevin: But... yeah. I guess it makes sense.
    }
}

{torres_killed:
    Kevin: I heard... someone died?
    You: Lethal force was necessary.
    Kevin: *quiet* Okay. That's... that's heavy.
}

Kevin: Thanks for, you know, fixing this.

#exit_conversation
-> DONE
