// ===========================================
// Mission 5: NPC - Kevin Park
// IT Systems Administrator. Holds the staff-badge clone, IT's spare
// card for Torres' office, and an old pick set.
//
// PASS 2: never reaches DONE/END (lesson 21). Each ask has a guaranteed
// route (influence OR having worked through his topics OR Patricia's
// authority), so no conversation path can strand the badge or the card.
// "Given" state comes from synced globals set on pickup (lesson 26).
// ===========================================

VAR kevin_influence = 0           // 0-100 scale
VAR topic_network = false
VAR topic_torres = false
VAR topic_security = false
VAR first_meeting = true

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR torres_identified = false
VAR server_badge_obtained = false
VAR office_card_obtained = false
VAR lockpick_obtained = false
VAR patricia_authorised_office = false
VAR patricia_ko = false

=== function all_topics()
~ return topic_network and topic_torres and topic_security

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#complete_task:talk_to_kevin
{not first_meeting:
    -> hub
}
~ first_meeting = false
#speaker:narrator
Narrator: A man in his late twenties sits at a workstation, headphones on, three terminals of log output scrolling past. He notices you and pulls the headphones down.

#speaker:kevin_park
Kevin Park: Hey. You're the security consultant? Kevin Park, sysadmin.

Kevin Park: Finally, someone who might actually fix our mess.

+ [What can you tell me about the breach?]
    You: What can you tell me about the data leaving the building?
    ~ kevin_influence += 10
    -> network_situation

+ [I'll need your help with technical access.]
    You: I'll need your help with access. Server logs, badges, that kind of thing.
    Kevin Park: Sure. Whatever you need, within reason.
    ~ kevin_influence += 5
    -> hub

+ [Point me at the logs. I'll take it from here.]
    You: Just point me at the logs. I'll take it from here.
    Kevin Park: Right. Terminal's over there. Shout if you need anything.
    -> hub

=== network_situation ===
#speaker:kevin_park

Kevin Park: Someone's been pushing huge files out between two and four in the morning.

Kevin Park: I thought it was remote work at first. But the pattern's too tidy. Same hours, same encrypted channel, same research share.

+ [Why didn't you report it earlier?]
    You: Why didn't you report it earlier?
    Kevin Park: I did. Patricia's been on it for three weeks. Then someone upstairs told her to leave it.
    ~ kevin_influence += 5
    -> hub

+ [That's useful. Thanks.]
    You: That's useful. Thanks.
    ~ kevin_influence += 10
    -> hub

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===
#speaker:kevin_park

+ {not topic_network} [Walk me through the network.]
    -> ask_network

+ {not topic_torres} [What's David Torres like?]
    -> ask_torres

+ {not topic_security} [Where are the security gaps?]
    -> ask_security

+ {not server_badge_obtained} [I need a badge that opens the server hallway.]
    -> request_badge_clone

+ {not office_card_obtained} [I need into David Torres' office.]
    -> request_office_card

+ {topic_security and not lockpick_obtained} [You said the locks here are weak. Got anything for a locked briefcase?]
    -> request_lockpick

+ {torres_identified} [It's David. He's the one.]
    -> kevin_told

+ [That's everything for now.]
    You: That's everything for now. Catch you later.
    Kevin Park: Cool. I'll be here. I'm always here.
    #exit_conversation
    -> hub

=== ask_network ===
#speaker:kevin_park
~ topic_network = true
~ kevin_influence += 5

Kevin Park: Standard setup. Corporate VPN, segmented VLANs. The research portal sits on its own subnet behind the server room.

Kevin Park: Server hallway's badge-only. The server room itself has a password on the door, which I'm told is "temporary". It's been temporary for a year.

{kevin_influence >= 15:
    Kevin Park: There's a terminal in there that can see the research subnet. If you want to know what's on the portal, start there.
    ~ kevin_influence += 5
}

-> hub

=== ask_torres ===
#speaker:kevin_park
~ topic_torres = true
~ kevin_influence += 5

Kevin Park: David? Scarily smart. Doctorate in cryptography.

Kevin Park: Works late a lot. Always stressed. His wife's ill, so... yeah.

{kevin_influence >= 20:
    Kevin Park: I saw him in the server hallway the other night. Not doing anything. Just standing there, looking wrecked.
    ~ kevin_influence += 10
}

-> hub

=== ask_security ===
#speaker:kevin_park
~ topic_security = true
~ kevin_influence += 5

Kevin Park: Security's not great. Budget cuts. We log access, but nobody watches it live.

Kevin Park: And the physical locks are the cheap pin-tumbler kind. I proved that on last year's pen test.

{kevin_influence >= 25:
    Kevin Park: The server-room password's on a sticky note on my monitor, by the way. Please don't put that in your report.
    ~ kevin_influence += 5
}

-> hub

// ===========================================
// ASKS
// ===========================================

=== request_badge_clone ===
#speaker:kevin_park

You: Kevin, I need a badge that opens the server hallway.

{kevin_influence >= 20 or all_topics():
    #give_item:keycard:cloned_employee_badge
    Kevin Park: I cloned my own badge for the pen test. Here. It'll open the hallway.
    Kevin Park: Just... don't tell Patricia where you got it, yeah?
    ~ kevin_influence -= 5
    -> hub
- else:
    Kevin Park: Uh. I've known you for five minutes, and that's my badge.
    Kevin Park: Talk to me a bit first. Or ask Dr Chen. Her badge opens it too.
    -> hub
}

=== request_office_card ===
#speaker:kevin_park

You: I need to get into David Torres' office.

{patricia_authorised_office and patricia_ko:
    #give_item:keycard:torres_office_keycard
    Kevin Park: I got a message from Security saying you can have the spares. Nobody's answering down there, though. Is Patricia all right?
    Kevin Park: Here. IT's spare. I hope you don't find anything.
    -> hub
}
{patricia_authorised_office:
    #give_item:keycard:torres_office_keycard
    Kevin Park: Yeah, Patricia messaged. On her authority, she said. Twice.
    Kevin Park: IT's spare. I hope you don't find anything.
    -> hub
}
{kevin_influence >= 30:
    #give_item:keycard:torres_office_keycard
    Kevin Park: ...Fine. That's IT's spare. I didn't give it to you.
    Kevin Park: I hope you don't find anything in there.
    -> hub
}
Kevin Park: David's office? No chance. Not without Patricia signing it off.
Kevin Park: I like my job. Get her to message me and it's yours.
-> hub

=== request_lockpick ===
#speaker:kevin_park

You: Anything in your drawer for a pin-tumbler lock? For legitimate security testing.

{kevin_influence >= 25 or all_topics():
    #give_item:lockpick:kevin_lockpick
    Kevin Park: "Security testing." Right.
    Kevin Park: Left over from last year's pen test. Tension wrench and a rake. Don't tell anyone where you got it.
    ~ kevin_influence += 5
    -> hub
- else:
    Kevin Park: I barely know you. Ask me again when we're on better terms.
    -> hub
}

=== kevin_told ===
#speaker:kevin_park

Kevin Park: David? No way. He wouldn't...

Kevin Park: He stood in the hallway looking wrecked and I just... walked past him.

+ [You couldn't have known.]
    You: You couldn't have known. That's how they work.
    Kevin Park: Yeah. Doesn't help much, but thanks.
    -> hub
+ [Keep it to yourself until it's done.]
    You: Keep this to yourself until it's over.
    Kevin Park: Who would I even tell?
    -> hub
