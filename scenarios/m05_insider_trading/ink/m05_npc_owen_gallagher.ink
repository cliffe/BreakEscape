// ===========================================
// Mission 5: NPC - Owen Gallagher
// IT Systems Administrator. Holds IT's spare card for Torres' office
// and the server-room password note.
//
// PASS 3: his staff badge is cloned off his lanyard (P4, m04 clone-knot
// shape). The password is the mission's social puzzle (P5): he refuses by
// default and gives way to evidence (Patricia's incident log) or to
// Patricia's authority. At the handover he names the key vault (P6).
//
// PASS 2: never reaches DONE/END (lesson 21). Each ask has a guaranteed
// route (influence OR having worked through his topics OR Patricia's
// authority), so no conversation path can strand the badge or the card.
// "Given" state comes from synced globals set on pickup (lesson 26).
// ===========================================

VAR owen_influence = 0           // 0-100 scale
VAR topic_network = false
VAR topic_torres = false
VAR topic_security = false
VAR first_meeting = true
VAR password_handed = false   // local: hides the ask until the pickup mapping syncs server_password_obtained

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR torres_identified = false
VAR server_badge_obtained = false
VAR office_card_obtained = false
VAR patricia_authorised_office = false
VAR patricia_ko = false
VAR server_door_seen = false
VAR server_password_obtained = false
VAR patricia_authorised_server = false
VAR found_incident_log = false


// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#complete_task:talk_to_owen
{not first_meeting:
    -> hub
}
~ first_meeting = false
#speaker:narrator
Narrator: A man in his late twenties sits at a workstation, headphones on, three terminals of log output scrolling past. He notices you and pulls the headphones down.

#speaker:owen_gallagher
Owen Gallagher: Hey. You're the security consultant? Owen Gallagher, sysadmin.

Owen Gallagher: Finally, someone who might actually fix our mess.

+ [What can you tell me about the breach?]
    You: What can you tell me about the data leaving the building?
    ~ owen_influence += 10
    -> network_situation

+ [I'll need your help with technical access.]
    You: I'll need your help with access. Server logs, badges, that kind of thing.
    Owen Gallagher: Sure. Whatever you need, within reason.
    ~ owen_influence += 5
    -> hub

+ [Point me at the logs. I'll take it from here.]
    You: Just point me at the logs. I'll take it from here.
    Owen Gallagher: Right. Terminal's over there. Shout if you need anything.
    -> hub

=== network_situation ===
#speaker:owen_gallagher

Owen Gallagher: Someone's been pushing huge files out between two and four in the morning.

Owen Gallagher: I thought it was remote work at first. But the pattern's too tidy. Same hours, same encrypted channel, same research share.

+ [Why didn't you report it earlier?]
    You: Why didn't you report it earlier?
    Owen Gallagher: I did. Patricia's been on it for three weeks. Then someone upstairs told her to leave it.
    ~ owen_influence += 5
    -> hub

+ [That's useful. Thanks.]
    You: That's useful. Thanks.
    ~ owen_influence += 10
    -> hub

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===
#speaker:owen_gallagher

+ {not topic_network} [Walk me through the network.]
    -> ask_network

+ {not topic_torres} [What's David Torres like?]
    -> ask_torres

+ {not topic_security} [Where are the security gaps?]
    -> ask_security

+ {not server_badge_obtained} [(Lean over his log screen, close enough for the cloner to reach his lanyard.)]
    -> owen_clone

+ {server_door_seen and not server_password_obtained and not password_handed} [The server room wants a password.]
    -> request_password

+ {not office_card_obtained} [I need into David Torres' office.]
    -> request_office_card

+ {torres_identified} [It's David. He's the one.]
    -> owen_told

+ [That's everything for now.]
    You: That's everything for now. Catch you later.
    Owen Gallagher: Cool. I'll be here. I'm always here.
    #exit_conversation
    -> hub

=== ask_network ===
#speaker:owen_gallagher
~ topic_network = true
~ owen_influence += 5

Owen Gallagher: Standard setup. Corporate VPN, segmented VLANs. The research portal sits on its own subnet behind the server room.

Owen Gallagher: Server hallway's badge-only. The server room itself has a password on the door, which I'm told is "temporary". It's been temporary for a year.

{owen_influence >= 15:
    Owen Gallagher: There's a terminal in there that can see the research subnet. If you want to know what's on the portal, start there.
    ~ owen_influence += 5
}

-> hub

=== ask_torres ===
#speaker:owen_gallagher
~ topic_torres = true
~ owen_influence += 5

Owen Gallagher: David? Scarily smart. Doctorate in cryptography.

Owen Gallagher: Works late a lot. Always stressed. His wife's ill, so... yeah.

{owen_influence >= 20:
    Owen Gallagher: I saw him in the server hallway the other night. Not doing anything. Just standing there, looking wrecked.
    ~ owen_influence += 10
}

-> hub

=== ask_security ===
#speaker:owen_gallagher
~ topic_security = true
~ owen_influence += 5

Owen Gallagher: Security's not great. Budget cuts. We log access, but nobody watches it live.

Owen Gallagher: And the physical locks are the cheap pin-tumbler kind. I proved that on last year's pen test.

{owen_influence >= 25:
    ~ owen_influence += 5
}

-> hub

// ===========================================
// ASKS
// ===========================================

// ===========================================
// CLONE KNOTS (PASS 3 P4). m04 shape (m04_npc_robert_vance.ink:242-306):
// narration, the tag on a throwaway line (starting the RFID minigame ends
// this chat), then a debrief knot that reads the synced global. card_cloned
// sets server_badge_obtained synchronously before the chat resumes. A
// cancelled clone leaves it false, so the hub choice reappears as the retry.
// ===========================================

=== owen_clone ===
#speaker:narrator
Narrator: You lean in while he scrolls the logs.
#clone_keycard:employee_badge
Narrator: He keeps scrolling.
-> owen_clone_debrief

=== owen_clone_debrief ===
{server_badge_obtained:
    #speaker:narrator
    Narrator: The cloner buzzes once against your hip.
    #speaker:owen_gallagher
    Owen Gallagher: Did your bag just beep? ...You read my badge. Fair. I did half of Finance on last year's pen test.
- else:
    #speaker:narrator
    Narrator: The cloner didn't get a clean read.
}
+ {server_badge_obtained} [Sorry. Habit.]
    You: Sorry. Habit.
    Owen Gallagher: Don't be. Just don't let Patricia see you do it.
    -> hub
+ {server_badge_obtained} [Better me than them.]
    You: Better me than them.
    Owen Gallagher: Yeah. That's what I told Finance.
    -> hub
+ {not server_badge_obtained} [Leave it for now.]
    -> hub

// ===========================================
// THE PASSWORD (PASS 3 P5). Evidence as leverage, or Patricia's authority.
// No rapport route: the first meeting alone reaches influence 20.
// ===========================================

=== request_password ===
#speaker:owen_gallagher
You: The server room wants a password.
Owen Gallagher: After-hours server access gets logged with IT. That's me.
{patricia_authorised_office and not patricia_authorised_server:
    Owen Gallagher: Patricia signed off David's office, not the server room. Get her to put her name to that too, or give me a reason I can write in the log.
- else:
    Owen Gallagher: Give me a reason I can write in the log. Or get Patricia to put her name to it.
}
+ {found_incident_log} [Patricia's log has a crypto badge in your server room at 23:47, and nobody logged it with you.]
    You: Patricia's log has a crypto badge in your server room at 23:47, and nobody logged it with you.
    Owen Gallagher: ...Nobody logged that with me. Right.
    -> password_given
+ {patricia_authorised_server} [Security's signed it off. Check your messages.]
    You: Security's signed it off. Check your messages.
    {patricia_ko:
        Owen Gallagher: There's a message from Security. Not from Patricia's phone, though. ...Fine.
    - else:
        Owen Gallagher: Yeah, she has. "On my authority." She does like that phrase.
    }
    -> password_given
+ [Fair enough. I'll be back.]
    -> hub

=== password_given ===
#speaker:owen_gallagher
~ password_handed = true
#give_item:notes:server_password_note
Owen Gallagher: It's on my monitor. It's been on my monitor for a year. Take it, and please don't put that in your report.
Owen Gallagher: Past the server room is the key vault. Fingerprint reader. David's thumb and nobody else's. Don't ask me how you'd get in there.
-> hub

=== request_office_card ===
#speaker:owen_gallagher

You: I need to get into David Torres' office.

{patricia_authorised_office and patricia_ko:
    #give_item:keycard:torres_office_keycard
    Owen Gallagher: I got a message from Security saying you can have the spares. Nobody's answering down there, though. Is Patricia all right?
    Owen Gallagher: Here. IT's spare. I hope you don't find anything.
    -> hub
}
{patricia_authorised_office:
    #give_item:keycard:torres_office_keycard
    Owen Gallagher: Yeah, Patricia messaged. On her authority, she said. Twice.
    Owen Gallagher: IT's spare. I hope you don't find anything.
    -> hub
}
{owen_influence >= 30:
    #give_item:keycard:torres_office_keycard
    Owen Gallagher: ...Fine. That's IT's spare. I didn't give it to you.
    Owen Gallagher: I hope you don't find anything in there.
    -> hub
}
Owen Gallagher: David's office? No chance. Not without Patricia signing it off.
Owen Gallagher: I like my job. Get her to message me and it's yours.
-> hub

=== owen_told ===
#speaker:owen_gallagher

Owen Gallagher: David? No way. He wouldn't...

Owen Gallagher: He stood in the hallway looking wrecked and I just... walked past him.

+ [You couldn't have known.]
    You: You couldn't have known. That's how they work.
    Owen Gallagher: Yeah. Doesn't help much, but thanks.
    -> hub
+ [Keep it to yourself until it's done.]
    You: Keep this to yourself until it's over.
    Owen Gallagher: Who would I even tell?
    -> hub
