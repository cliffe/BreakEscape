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
//
// PASS 4 (whodunnit): he pulls the night badge log once the player has read
// Patricia's incident log (the red herring and its answer, in one sheet).
// "Odd hours" replaces the hub's "What's David Torres like?", and the
// office-card ask waits for torres_suspected.
//
// PASS 4 (dialogue): hub_quiet gives the hub a re-entry line (m03 pattern),
// skipped after a goodbye and after the news about David.
// ===========================================

VAR owen_influence = 0           // 0-100 scale
VAR topic_network = false
VAR topic_torres = false
VAR topic_security = false
VAR first_meeting = true
VAR password_handed = false   // local: hides the ask until the pickup mapping syncs server_password_obtained
VAR door_log_handed = false   // local: same pattern for the badge log
VAR hub_quiet = false
VAR asked_access = false      // playtest round: the access ask stays in the hub until used
VAR told_about_david = false   // scenario design R1 (m6): the news about David, once
VAR card_handed = false       // playtest round: local, hides the office ask once the card is given
VAR fate_noted = false        // Phase 4 dialogue C1 (D5-8): his reaction to Torres' fate, once
VAR office_rule_heard = false // Round 3 (2026-10-17): he has said an office spare needs Patricia's say-so, once

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
VAR torres_suspected = false
VAR found_door_log = false
VAR it_notice_read = false
VAR final_choice = "" // Synced scenario global: Torres' fate; set by m05_torres_confrontation and HaX's post-KO call. Read for his reaction (D5-8)
VAR owen_refused_password = false // Synced scenario global (pass 5 puzzle R1, P6): Owen has been asked for the server-room password and wanted a reason; set by Owen. Patricia's sign-off waits for it


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
Narrator: A bearded man in his late twenties at a workstation, three terminals of logs scrolling past, a staff badge on a lanyard round his neck. He swivels to face you.

#speaker:owen_gallagher
Owen Gallagher: Alright. You're the security consultant? Owen Gallagher, sysadmin.

Owen Gallagher: Finally. Someone to fix our mess who isn't me.

+ [What can you tell me about the data leaving the building?]
    ~ owen_influence += 10
    #influence_increased
    -> network_situation

+ [I'll need your help with access. Logs, badges, that kind of thing.]
    ~ asked_access = true
    ~ owen_influence += 5
    #influence_increased
    Owen Gallagher: Sure. I hold the spares for most of the doors here. Give me a reason I can write in the log and they're yours.
    -> hub

+ [Point me at the logs. I'll take it from here.]
    Owen Gallagher: Right. Terminal's over there. Shout if you need anything.
    ~ hub_quiet = true
    -> hub

=== network_situation ===
#speaker:owen_gallagher

Owen Gallagher: Someone's been pushing huge files out between two and four in the morning.

Owen Gallagher: I thought it was remote work at first. It's too tidy for that. Same hours, same encrypted channel, same research share.

+ [Why didn't you report it earlier?]
    ~ owen_influence += 5
    #influence_increased
    Owen Gallagher: I did. Patricia's been on it three weeks. Then someone upstairs told her to leave it.
    -> hub

+ [That's useful. Thanks.]
    ~ owen_influence += 10
    #influence_increased
    Owen Gallagher: No bother.
    ~ hub_quiet = true
    -> hub

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===
#speaker:owen_gallagher
// Phase 4 dialogue C1 (D5-8): after the fate, the first reopen notices it.
// He watches the reader logs all night, so he reacts to what they show.
{
- hub_quiet:
    ~ hub_quiet = false
- final_choice != "" and not fate_noted:
    ~ fate_noted = true
    {
    - final_choice == "arrest" or final_choice == "combat_nonlethal":
        Owen Gallagher: There's police on the stairs. Never thought I'd see that in here.
    - final_choice == "public_exposure":
        Owen Gallagher: David's badge just went out the front door. Thought you'd want to know.
    - final_choice == "combat_lethal":
        Owen Gallagher: David's badge went into the vault an hour ago. It's not come out.
    - else:
        Owen Gallagher: {patricia_ko:Security say|Patricia says} I never pulled that badge log. Fine by me.
    }
- else:
    Owen Gallagher: {&What else?|Go on. I'm half listening.|Yeah?}
}

+ {not topic_network} [Walk me through the network.]
    -> ask_network

+ {not topic_torres} [Anyone on the crypto team keeping odd hours?]
    -> ask_torres

+ {found_incident_log and not found_door_log and not door_log_handed} [Patricia's log has a crypto badge in the server hallway at 23:47. Whose?]
    -> give_door_log

+ {not asked_access} [I'll need your help with access. Logs, badges, that kind of thing.]
    ~ asked_access = true
    Owen Gallagher: Sure. I hold the spares for most of the doors here. Give me a reason I can write in the log and they're yours.
    -> hub

+ {not topic_security} [Where are the security gaps?]
    -> ask_security

+ {not server_badge_obtained} [(Lean over his log screen, close enough for the cloner to reach his lanyard.)]
    -> owen_clone

+ {(server_door_seen or it_notice_read) and not server_password_obtained and not password_handed} [The server room wants a password.]
    -> request_password

// Blind run A (2026-10-16, M2): once he has said he holds the spares, the
// server room can be asked about before the player has seen its door.
+ {asked_access and not (server_door_seen or it_notice_read) and not server_password_obtained and not password_handed} [What about the server room?]
    -> request_password

+ {torres_suspected and not office_card_obtained and not card_handed} [I need into David Torres' office.]
    -> request_office_card

// Round 3 (2026-10-17, blind B finding 2): HaX says Owen wants "a reason"
// for an office spare, but before anyone is suspected he offered nothing.
// He now says where that reason comes from: a name, put to Patricia. Names
// nobody, once.
+ {not torres_suspected and not office_card_obtained and not office_rule_heard} [Do you keep spare cards for the offices?]
    ~ office_rule_heard = true
    Owen Gallagher: One for every office. Don't tell me whose. A spare means going through someone's desk, and that's not my call.
    Owen Gallagher: Tell Patricia who you think it is, and why. If she buys it, she messages me and the card's yours.
    -> hub

+ {torres_identified and not told_about_david} [It's David. He's the one.]
    -> owen_told

+ [That's everything for now. Catch you later.]
    Owen Gallagher: Cool. I'll be here. I'm always here.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== ask_network ===
#speaker:owen_gallagher
~ topic_network = true
~ owen_influence += 5
#influence_increased

Owen Gallagher: Standard setup. Corporate VPN, segmented VLANs. The research portal sits on its own subnet behind the server room.

Owen Gallagher: Server hallway's badge-only. The server room has a password on the door, which I'm told is "temporary". It's been temporary for a year.

{owen_influence >= 15:
    ~ owen_influence += 5
    #influence_increased
    Owen Gallagher: There's a terminal in there that sees the research subnet. If you want to know what's on the portal, start there.
}

-> hub

=== ask_torres ===
#speaker:owen_gallagher
~ topic_torres = true
~ owen_influence += 5
#influence_increased

// Round 3 (playtest): hours and pressure across the team, no name for the
// man in the hallway. The badge log is where the name comes from.
Owen Gallagher: Halloran practically lives in that lab. Ben Ashworth does the odd evening test run. Always behind, always skint, that lad.
Owen Gallagher: Half of them work stupid hours. It's that kind of team.

{owen_influence >= 20:
    ~ owen_influence += 10
    #influence_increased
    Owen Gallagher: I saw someone from crypto in the server hallway the other night. Not doing anything. Just stood there, looking wrecked. Didn't get a proper look.
}

-> hub

=== ask_security ===
#speaker:owen_gallagher
~ topic_security = true
~ owen_influence += 5
#influence_increased

Owen Gallagher: Security's not great. Budget cuts. We log access, but nobody watches it live.

Owen Gallagher: And the door locks are the cheap pin-tumbler kind. I proved that on last year's pen test.

// Phase 4 dialogue C1 (D5-26): the rapport branch now says something.
{owen_influence >= 25:
    ~ owen_influence += 5
    #influence_increased
    Owen Gallagher: Off the record? Nobody's audited who holds the spares since I started. I keep meaning to.
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
    Owen Gallagher: Don't be. Just don't try it on Security.
    -> hub
+ {server_badge_obtained} [Better me than them.]
    Owen Gallagher: Yeah. That's what I told Finance.
    -> hub
+ {not server_badge_obtained} [Leave it for now.]
    -> hub

// ===========================================
// THE PASSWORD (PASS 3 P5). Evidence as leverage, or Patricia's authority.
// No rapport route: the first meeting alone reaches influence 20.
// ===========================================

=== request_password ===
// Puzzle R1 (P6): Patricia's authority is the way round a refusal, so it
// waits for one.
~ owen_refused_password = true
#speaker:owen_gallagher
Owen Gallagher: After-hours server access gets logged with IT. That's me.
{patricia_authorised_office and not patricia_authorised_server:
    Owen Gallagher: Patricia signed off David's office, not the server room. Get her to put her name to that too, or give me a reason I can write in the log.
- else:
    Owen Gallagher: Give me a reason I can write in the log. Or get Patricia to put her name to it.
}
-> password_reason

// Blind run B (finding 4): the first visit had no usable reply and no pointer.
// "What counts as a reason?" says what he wants and where it is, once.
= password_reason
+ {found_incident_log} [Patricia's log: a crypto badge in the server hallway at 23:47, never logged with you.]
    Owen Gallagher: ...Nobody logged that with me. Right.
    -> password_given
* {not found_incident_log} [What counts as a reason?]
    Owen Gallagher: Something on Security's books that never reached mine. A badge where it shouldn't be, at an hour nobody told me about.
    Owen Gallagher: Patricia keeps an incident log on her desk. Bring me a line out of that and I'll write it up.
    -> password_reason
+ {patricia_authorised_server} [Security's signed it off. Check your messages.]
    {patricia_ko:
        Owen Gallagher: There's a message from Security. Not from Patricia's phone, though. ...Fine.
    - else:
        Owen Gallagher: Yeah, she has. "On my authority." She does like that phrase.
    }
    -> password_given
+ [Fair enough. I'll be back.]
    Owen Gallagher: Password's not going anywhere. Neither am I.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== password_given ===
#speaker:owen_gallagher
~ password_handed = true
#give_item:notes:server_password_note
Owen Gallagher: It's on my monitor. It's been on my monitor for a year. Take it, and please don't put that in your report.
// Blind run B (finding 6): the note arrived without the player noticing.
#speaker:narrator
Narrator: He peels the sticky note off the edge of his monitor and hands it over. The password goes into your notes.
#speaker:owen_gallagher
// PASS 5 (A3): both Heisenberg leads are enrolled, so this no longer names
// the insider before anyone suspects him.
Owen Gallagher: Past the server room is the key vault. Fingerprint reader. Two thumbs enrolled, Ruth Halloran's and David's, and nobody else's. Don't ask me how you'd get in there.
Owen Gallagher: Board bought it because you can't write a thumb on a sticky note. Course, you can't change one either, once it's out.
-> hub

// PASS 4 (whodunnit). The give tag sits on the first line; the local flag
// hides the ask until the pickup's onRead syncs found_door_log.
=== give_door_log ===
#speaker:owen_gallagher
~ door_log_handed = true
~ owen_influence += 5
#influence_increased
#give_item:notes:server_door_log
Owen Gallagher: Reader logs. Every after-hours swipe for three weeks, every door. Give us a sec... there.
Owen Gallagher: That's Halloran's spare on the server hallway. Odd. She's in that lab all day, but never at night.
// Round 3 (2026-10-17, blind B finding 5): "Halloran's spare" pointed away
// from the borrower, and the log only reached the Notepad. This draws the eye
// to the front-door column without saying what it shows.
Owen Gallagher: Mind, a spare only tells you which card. The front door's on there too, and that one tells you who was actually in the building.
#speaker:narrator
Narrator: He prints the log and hands it over. It goes into your notes, every door on one sheet.
-> hub

=== request_office_card ===
#speaker:owen_gallagher

{patricia_authorised_office and patricia_ko:
    ~ card_handed = true
    #give_item:keycard:torres_office_keycard
    Owen Gallagher: I got a message from Security saying you can have the spares. Nobody's answering down there, though. Is Patricia all right?
    Owen Gallagher: Here. IT's spare. I hope you don't find anything.
    -> hub
}
{patricia_authorised_office:
    ~ card_handed = true
    #give_item:keycard:torres_office_keycard
    Owen Gallagher: Yeah, Patricia messaged. On her authority, she said. Twice.
    Owen Gallagher: IT's spare. I hope you don't find anything.
    -> hub
}
{owen_influence >= 30:
    ~ card_handed = true
    #give_item:keycard:torres_office_keycard
    Owen Gallagher: ...Fine. That's IT's spare. I didn't give it to you.
    Owen Gallagher: I hope you don't find anything in there.
    -> hub
}
Owen Gallagher: David's office? No chance. Not without Patricia signing it off.
Owen Gallagher: I like my job. Get her to message me and it's yours.
-> hub

=== owen_told ===
~ told_about_david = true
#speaker:owen_gallagher

Owen Gallagher: David? No way. He wouldn't...

Owen Gallagher: He stood in that hallway looking wrecked and I just... walked past him.

+ [You couldn't have known. That's how they work.]
    Owen Gallagher: Yeah. Doesn't help much, but cheers.
    ~ hub_quiet = true
    -> hub
+ {final_choice == ""} [Keep it to yourself until it's over.]
    Owen Gallagher: Who would I even tell?
    ~ hub_quiet = true
    -> hub
