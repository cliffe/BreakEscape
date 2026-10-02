// ===========================================
// PHONE NPC: Agent HaX (handler support)
// Mission 5: Insider Trading
// Remote support, field guides, KO relays, moral sounding board
//
// PASS 2: never reaches DONE (lesson 21). Every exit is
// #exit_conversation followed by -> support_hub.
// Speaker id stays agent_0x99 (the NPC id); the display name is Agent HaX,
// as in m02, m03, m04 and m06.
// PASS 4 (dialogue): HaX's own lines carry no prefix (phone convention).
// ===========================================

VAR first_contact = true

// ---- Mission state (synced from globalVars when the call opens) ----
VAR player_name = "Agent 0x00"
VAR found_pamphlet = false
VAR found_medical_bills = false
VAR found_torres_journal = false
VAR found_vetting_file = false
VAR found_manifest = false
VAR found_upload_schedule = false
VAR found_pipeline_list = false
VAR patricia_ko = false
VAR patricia_authorised_office = false
VAR torres_ko = false
VAR final_choice = ""
VAR torres_arrested = false
VAR torres_fate_by_phone = false
VAR architect_approval_confirmed = false
VAR recruiter_contacted_player = false
VAR flag1_submitted = false
VAR flag2_submitted = false
VAR flag3_submitted = false
VAR flag4_submitted = false
VAR torres_identified = false
VAR patricia_authorised_server = false
VAR server_door_seen = false
VAR server_password_obtained = false
VAR vault_reader_seen = false
VAR owen_ko = false
VAR office_card_obtained = false
VAR torres_print_collected = false
VAR torres_suspected = false
VAR found_door_log = false
VAR found_halloran_alibi = false
VAR halloran_questioned = false
VAR halloran_accused = false
VAR found_incident_log = false
VAR door_log_reasoned = false

// Field-guide exposure flags. Each _offered is set by an eventMapping when
// the player meets the thing the guide is about; each _hint_given is set
// here when the guide is handed over.
VAR bludit_guide_offered = false
VAR bludit_guide_hint_given = false
VAR lockpicking_guide_offered = false
VAR lockpicking_guide_hint_given = false
VAR recon_guide_offered = false
VAR recon_guide_hint_given = false
VAR privesc_guide_offered = false
VAR privesc_guide_hint_given = false
VAR rfid_guide_offered = false
VAR rfid_guide_hint_given = false

// Hub topic retirement flags
VAR recruitment_method_discussed = false
VAR leverage_discussed = false
VAR journal_discussed = false
VAR architect_discussed = false
VAR recruiter_discussed = false
VAR flag1_discussed = false
VAR flag2_discussed = false
VAR flag3_discussed = false
VAR flag4_discussed = false
VAR confrontation_advice_given = false

=== function has_motive()
~ return found_medical_bills or found_torres_journal or found_vetting_file

=== function has_exfil()
~ return flag3_submitted or found_manifest or found_upload_schedule

=== function all_flags_in()
~ return flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted

// ===========================================
// ENTRY POINT
// ===========================================

=== start ===
{first_contact:
    ~ first_contact = false
    -> first_call
}
-> support_hub

=== first_call ===
#speaker:agent_0x99

{player_name}. Four hours to the final upload window. Let's use them.

Patricia Morgan runs security. She called us in, and she can open doors for you. Keep her in the picture.

Someone in that building is feeding ENTROPY the keys to the 999 dispatch network. Find them before half past eight tonight.

-> first_call_choices

=== first_call_choices ===
+ [I'll get to work.]
    -> support_hub

+ [What should I know going in?]
    Nobody in there is your enemy by default. It's an office, with one person who made a terrible choice under terrible pressure.
    Talk to people. The evidence will give you who and why. You need both before you confront anyone.
    -> support_hub

+ [Anything I should be careful of?]
    Don't show your hand early. If the insider hears Security has a name, they'll bring the upload forward.
    Then you lose any chance of turning them.
    And watch for anyone who reaches out to you directly. ENTROPY recruits. You might be on someone's list tonight.
    -> support_hub

// ===========================================
// SUPPORT HUB (gated by mission state)
// Options appear when relevant and retire once used, except the moral
// sounding board, which stays open.
// ===========================================

=== support_hub ===
#speaker:agent_0x99

+ {found_pamphlet and not recruitment_method_discussed} [Someone here has been talking to a recruiter called TalentStack.]
    -> topic_recruitment_method

+ {torres_suspected and (found_medical_bills or found_vetting_file) and not leverage_discussed} [Torres is buried in debt he's hiding. Is that the hook?]
    -> topic_leverage

+ {found_torres_journal and not journal_discussed} [I've read his journal. He knew.]
    -> topic_journal

+ {architect_approval_confirmed and not architect_discussed} [The Architect signed off on the casualty projection.]
    -> topic_architect

+ {recruiter_contacted_player and not recruiter_discussed} [The Recruiter just called me.]
    -> topic_recruiter

+ {flag1_submitted and not flag1_discussed} [First flag's in. What next on the Bludit box?]
    -> topic_flag1

+ {flag2_submitted and not flag2_discussed} [Second flag's in. I've got a shell.]
    -> topic_flag2

+ {flag3_submitted and not flag3_discussed} [Third flag's in. I found his staging manifest.]
    -> topic_flag3

+ {flag4_submitted and not flag4_discussed} [Fourth flag's in. Root, and the Architect's sign-off.]
    -> topic_flag4

+ {bludit_guide_offered and not bludit_guide_hint_given} [This Bludit box. Where do I even start?]
    -> request_bludit_guide

+ {lockpicking_guide_offered and not lockpicking_guide_hint_given} [Can you send me the lockpicking guide?]
    -> request_lockpicking_guide

+ {recon_guide_offered and not recon_guide_hint_given} [Can you send me the network recon guide?]
    -> request_recon_guide

+ {privesc_guide_offered and not privesc_guide_hint_given} [Can you send me the sudo guide?]
    -> request_privesc_guide

+ {rfid_guide_offered and not rfid_guide_hint_given} [Can you send me the badge-cloning guide?]
    -> request_rfid_guide

+ {patricia_ko and not torres_identified} [Patricia's down. I'll give you the name instead.]
    -> name_to_hax

+ {torres_identified and final_choice == "" and not confrontation_advice_given} [I'm going in. Soft or hard?]
    -> confrontation_advice

+ {torres_suspected and has_motive()} [What ENTROPY did to him. I need to talk it through.]
    -> moral_sounding_board

+ [What should I be doing right now?]
    -> general_advice

+ [Just checking in.]
    Copy. Mind the clock.
    #exit_conversation
    -> support_hub

// ===========================================
// EVIDENCE TOPICS
// ===========================================

=== topic_recruitment_method ===
#speaker:agent_0x99
~ recruitment_method_discussed = true

TalentStack Executive Recruiting is the Insider Threat Initiative's front. "R." is the Recruiter.

She finds someone in trouble and makes an offer. The ideology comes later, once the casualties stop feeling like the point.

An answer scribbled on the back of that leaflet means somebody in there has already said yes.

-> topic_recruitment_method_choices

=== topic_recruitment_method_choices ===
+ [So I'm looking for a target, not a recruiter.]
    Probably. The Recruiter doesn't sit on site; too much exposure. Look for access, and a reason to need money fast.
    -> support_hub

+ [Then I'm looking for whoever wrote on the back.]
    Handwriting, initials, the desk it came from. Start there.
    -> support_hub

=== topic_leverage ===
#speaker:agent_0x99
~ leverage_discussed = true

{found_medical_bills:
    Three hundred and eighty thousand dollars for a trial abroad, an insurer that walked away, and a wife with Stage 3 cancer.
    That's a target file, written by his own bad luck.
- else:
    Undeclared loans, a second charge on the house, and treatment abroad no insurer will cover. That's a target file.
}

ENTROPY rarely recruits believers. They recruit desperate people and sell them the belief afterwards, so it feels like their idea.

-> topic_leverage_choices

=== topic_leverage_choices ===
+ [That's monstrous.]
    It's efficient. Some nights that's worse.
    -> support_hub

+ [Desperate people can still say no.]
    They can. Hold onto that when you're in front of him. Hold onto the rest too.
    -> support_hub

=== topic_journal ===
#speaker:agent_0x99
~ journal_discussed = true

Then you've watched him talk himself round, on paper. Thirty to forty-five lives, written down, and he kept going.

That should worry you more than the pitch. He understands the cost. He decided he could live with it.

-> topic_journal_choices

=== topic_journal_choices ===
+ [Does that change how I approach him?]
    Don't expect him to be surprised when you lay it out. He already knows.
    What you can offer is a way out he hasn't let himself look at.
    -> support_hub

+ [He also wrote "what have I become".]
    He did. That line's the door, if you want one.
    -> support_hub

=== topic_architect ===
#speaker:agent_0x99
~ architect_discussed = true

Read it twice. A casualty projection, reviewed, and signed off as an acceptable cost.

No rogue cell improvised that. Someone priced human lives and approved the invoice.

It's the strongest thing you'll find tonight. It puts this above Torres.

-> topic_architect_choices

=== topic_architect_choices ===
+ [This is bigger than one insider.]
    It always was. Torres is the delivery. The Architect is the decision. Keep both in the file.
    -> support_hub

+ [Then Torres is the only thread we've got to it.]
    For tonight, yes. Bear that in mind when you decide what happens to him.
    -> support_hub

=== topic_recruiter ===
#speaker:agent_0x99
~ recruiter_discussed = true

The Recruiter runs ENTROPY's talent pipeline from behind a search firm. If she rang you herself, you've worried her.

Whatever she offered, she's very good at making a bad trade sound reasonable. It's the whole of her job.

-> topic_recruiter_choices

=== topic_recruiter_choices ===
+ [She offered me a deal.]
    Of course she did. Weigh what it costs. Ignore how reasonable she sounded.
    -> support_hub

+ [I'll be careful.]
    -> support_hub

// ===========================================
// FLAG STATUS TOPICS
// ===========================================

=== topic_flag1 ===
#speaker:agent_0x99
~ flag1_discussed = true

Somebody's sloppy handover note got you that login.

Now use it. The upload flaw needs you logged in, and you are.

-> support_hub

=== topic_flag2 ===
#speaker:agent_0x99
~ flag2_discussed = true

Now find out who's been living on that box.

Their home directory will tell you who.

-> support_hub

=== topic_flag3 ===
#speaker:agent_0x99
~ flag3_discussed = true

His name's on the manifest. That's the exfiltration proved.

Root's the last door. Start with what that account is allowed to run.

-> support_hub

=== topic_flag4 ===
#speaker:agent_0x99
~ flag4_discussed = true

Then you've seen the Architect's signature.

Read the number on it before you face Torres. He's seen it too.

-> support_hub

// ===========================================
// NAMING THE INSIDER TO HAX (Patricia KO'd)
// ===========================================

=== name_to_hax ===
// PASS 3 (review r3 M3): a re-navigated chat must never replay the naming.
{torres_identified: -> support_hub}
#speaker:agent_0x99
Go on. Who?
-> name_to_hax_who

// PASS 4 (whodunnit): only the names the player has a reason for, as with
// Patricia. Choices-only knot, so a re-navigation replays nothing.
=== name_to_hax_who ===
{torres_identified: -> support_hub}
+ {found_door_log and not halloran_accused} [Dr Ruth Halloran.]
    -> hax_accuse_halloran
+ {found_door_log} [Ben Ashworth.]
    Eight in the evening, logged with IT. The transfers run two till four. Look again.
    -> support_hub
+ {found_door_log or torres_suspected or has_motive() or has_exfil()} [David Torres.]
    -> hax_name_torres
+ [Not yet.]
    -> support_hub

=== hax_accuse_halloran ===
{halloran_accused or torres_identified: -> support_hub}
#speaker:agent_0x99
{found_halloran_alibi:
    Halloran was in Zurich the night that badge first went in. You know that. Look again.
    -> support_hub
}
Her spare, on the server hallway at night. All right. I'll have QDC's night desk suspend her access.
~ halloran_accused = true
If she's the wrong name, the right one has just watched Security move. Be sure about the next one.
#exit_conversation
-> support_hub

=== hax_name_torres ===
{torres_identified: -> support_hub}
#speaker:agent_0x99
{has_motive() and has_exfil():
    Why, and proof it's leaving. That's enough for me. I'm flagging him now.
    {halloran_accused:
        And I'll get Halloran's access back on.
    }
    #complete_task:identify_torres
    ~ torres_identified = true
    ~ patricia_authorised_office = true
    His badge just went through the hallway and the vault's logged him in. He's at the upload terminal.
    {not owen_ko and not office_card_obtained:
        Owen's been told you can have the spare for his office.
    }
    // PASS 4 fix 6: say now, not after the climax, that the portal still matters.
    {not all_flags_in():
        Stop him first. But I want every flag off that portal before I pull you out.
    }
    // PASS 4 fix 12: the urgency matches what the player is carrying.
    {
    - torres_print_collected:
        You've got his print. The window's close. Go.
    - not vault_reader_seen:
        The data centre door reads his fingerprint. Something from his office will carry it.
        Get it, then get down there. The window's close.
    - else:
        You'll need his print first. His office. Then move.
    }
    -> hax_named_close
- else:
    Why him?
    -> hax_torres_why
}

=== hax_named_close ===
+ {found_door_log and not door_log_reasoned} [And the badge log. Look at the main-entrance times.]
    ~ door_log_reasoned = true
    Six minutes before her spare, every night. Good. You read it properly.
    -> hax_named_close
+ [On my way.]
    #exit_conversation
    -> support_hub

// Some evidence, not both halves: enough to search his office.
=== hax_partial_naming ===
~ torres_suspected = true
{not owen_ko and not office_card_obtained:
    That's enough to look in his office. I'll tell Owen you can have the spare.
}
-> support_hub

// Round 3: the shared reason menu (as Patricia's torres_why). Choices-only;
// a wrong reason ends the call.
=== hax_torres_why ===
{torres_identified: -> support_hub}
+ {found_door_log} [His own badge is on the server hallway those nights.]
    Read it again. His badge never touches the server hallway. Hers does.
    #exit_conversation
    -> support_hub
+ [He's been under strain. His wife's ill.]
    Half that building has someone ill at home. That's not evidence.
    #exit_conversation
    -> support_hub
+ {halloran_questioned} [Halloran says he's in her lab after hours, where the spare hangs.]
    Her word, about her own badge. Enough to look, not to act.
    -> hax_partial_naming
+ {found_door_log} [Check who comes in the front door just before the spare is used.]
    -> hax_log_reason_right
+ {has_motive()} [Money. He's hiding how much he owes.]
    You've got why. I need proof it's leaving the building: the server room, the portal, the data centre.
    -> hax_partial_naming
+ {has_exfil()} [The staging is under his name.]
    You can see it leaving, under his name. Now find me why.
    -> hax_partial_naming
+ [He's the cryptography lead. He'd know how.]
    So would seven others. Not evidence.
    #exit_conversation
    -> support_hub

=== hax_log_reason_right ===
#speaker:agent_0x99
~ door_log_reasoned = true
His badge at the front door, her spare six minutes on, every night. Good. That's a pattern.
Now find me why, and proof it's leaving.
-> hax_partial_naming

// ===========================================
// KO RELAYS
// ===========================================

// npc_ko:patricia_morgan. obtain_security_badge is a collect task, so the
// player needs a real id_badge; and the office card no longer needs her say-so.
=== on_patricia_ko_relay ===
#speaker:agent_0x99
#give_item:id_badge:relayed_contractor_pass
~ patricia_authorised_office = true
~ patricia_authorised_server = true
Patricia's down. She was our way into that building, {player_name}.
I've printed you a contractor pass against their visitor system. It's in your kit.
Owen will get a message "from Security": you can have the office spares and the server-room password.
{not torres_identified:
    When you've got a name and the proof, bring it to me instead.
}
-> on_patricia_ko_relay_choices

=== on_patricia_ko_relay_choices ===
+ {not torres_identified} [Understood. I'll bring it to you.]
    #exit_conversation
    -> support_hub
+ {torres_identified} [Understood.]
    #exit_conversation
    -> support_hub

// npc_ko:owen_gallagher. His office card and password note now drop on a KO
// (npc-hostile.js:256-261), but his badge is an rfidCard, not an item. HaX
// pushes working copies of all three as a safety net, and says the vault
// line Owen would have said at the password handover (PASS 3 P5/P6).
=== on_owen_ko_relay ===
#speaker:agent_0x99
#give_item:keycard:relayed_server_badge
#give_item:keycard:relayed_torres_office_card
#give_item:notes:relayed_server_password_note
Owen's down. That wasn't how I'd have done it.
I've rebuilt his badge and the office spare from the reader logs. They're in your kit.
So is the server-room password. It was sitting in IT's ticket queue.
{not found_door_log:
    #give_item:notes:relayed_door_log
    And the night badge log he'd have pulled for you. Read it properly.
}
{torres_suspected:
    Past the server room is the key vault. It's on a fingerprint reader, and the only print enrolled is Torres'.
- else:
    Past the server room is the key vault. It's on a fingerprint reader, and the only print enrolled is the cryptography lead's.
}
Whatever else he knew, you'll have to find the hard way.
-> on_owen_ko_relay_choices

=== on_owen_ko_relay_choices ===
+ [I'll manage.]
    #exit_conversation
    -> support_hub

// room_entered:data_center while Torres is KO'd and no fate is set: the
// post-KO person-chat was lost (a reload mid-choice). Same two choices.
=== post_ko_safety_net ===
#speaker:agent_0x99
{final_choice != "":
    -> support_hub
}
Torres is still on the floor, barely moving. The upload's stopped.
What are you doing with him?
-> post_ko_safety_net_choices

=== post_ko_safety_net_choices ===
{final_choice != "": -> support_hub}
+ [I'm staying with him. Get an ambulance down here.]
    ~ torres_arrested = true
    #complete_task:make_critical_choice
    ~ final_choice = "combat_nonlethal"
    {patricia_ko:
        Calling it now. The police will come with the ambulance, and nobody will ask who rang. Keep his airway clear.
    - else:
        Calling it now. Patricia will ring the police. Keep his airway clear.
    }
    ~ torres_fate_by_phone = true
    #exit_conversation
    -> support_hub
+ [I'm leaving him. He's not my problem.]
    #complete_task:make_critical_choice
    ~ final_choice = "combat_lethal"
    ...Understood. I'll note the time.
    ~ torres_fate_by_phone = true
    #exit_conversation
    -> support_hub

// ===========================================
// FIELD GUIDE HANDOVERS
// ===========================================

=== request_bludit_guide ===
#speaker:agent_0x99
~ bludit_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_bludit_cms

Bludit guide's in your kit. Start with what's leaked in plain sight, then the authenticated upload flaw for a shell.

-> request_bludit_guide_choices

=== request_bludit_guide_choices ===
+ [Got it.]
    Recon first. A leaked login gets you further than guessing ever will.
    -> support_hub

=== request_lockpicking_guide ===
#speaker:agent_0x99
~ lockpicking_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_lockpicking

Lockpicking guide's in your kit.

Light tension, find the binding pin, set it, repeat. Don't force it.

-> request_lockpicking_guide_choices

=== request_lockpicking_guide_choices ===
+ [Thanks.]
    Quiet hands. It'll give.
    -> support_hub

=== request_privesc_guide ===
#speaker:agent_0x99
~ privesc_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_privilege_escalation

Sudo guide's in your kit. Check what you're allowed to run as root before you try anything clever.

-> request_privesc_guide_choices

=== request_privesc_guide_choices ===
+ [Thanks.]
    Misconfigured sudo is the commonest way up. Look for a program that can open a shell.
    -> support_hub

=== request_rfid_guide ===
#speaker:agent_0x99
~ rfid_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_rfid_cloning

Cloning guide's in your kit. Prox badges like theirs shout the same number at any reader that asks, and yours asks quietly.

-> request_rfid_guide_choices

=== request_rfid_guide_choices ===
+ [Thanks.]
    Get close, stay casual, and let the cloner do the talking.
    -> support_hub

=== request_recon_guide ===
#speaker:agent_0x99
~ recon_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_recon_network_mapping

Recon guide's on its way.

Map what's alive on that subnet before you touch anything. The Bludit box won't be the only thing listening.

-> request_recon_guide_choices

=== request_recon_guide_choices ===
+ [Thanks.]
    Quick scan, clean notes, then go in.
    -> support_hub

// ===========================================
// CONFRONTATION ADVICE
// ===========================================

=== confrontation_advice ===
#speaker:agent_0x99
~ confrontation_advice_given = true

You've named him. Now it's how you go in.

Go soft and you give him the exit ENTROPY never offered. He works for us, and his family stays whole.

It only works if he wants out.

{patricia_ko:
    Go hard and you hold him, and I call the police from a number that leads nowhere.
    We have no badge, {player_name}. What happens to him after that is up to them.
- else:
    Go hard and you hold him, hand him to Patricia, and she calls the police.
    We have no badge, {player_name}. What happens to him after that is up to them.
}

-> confrontation_advice_choices

=== confrontation_advice_choices ===
+ [Which do you recommend?]
    I'm not going to answer that. You've seen what he's carrying. It's your call.
    -> support_hub

+ [I'll decide when I'm standing in front of him.]
    Good. Read the room when you get there.
    -> support_hub

// ===========================================
// MORAL SOUNDING BOARD (returnable)
// ===========================================

=== moral_sounding_board ===
#speaker:agent_0x99

ENTROPY weaponises suffering. They find someone drowning and throw a rope with a hook in it.

None of that excuses him. From the first phone call to tonight, he could have walked into Patricia's office. He didn't.

-> moral_sounding_board_choices

=== moral_sounding_board_choices ===
+ [Does knowing why change what he deserves?]
    Maybe it changes what's fair. It doesn't undo thirty to forty-five deaths if that upload goes.
    Both are true at once. Nobody's philosophy handles that cleanly.
    -> support_hub

+ [What happens to people like him after this?]
    Depends on what you do tonight. Each way you go writes a different ending for him and for Elena.
    That's a lot to carry, {player_name}.
    -> support_hub

+ [I don't know what I think yet.]
    You don't have to, until you're in front of him. Call me again if it helps.
    -> support_hub

// ===========================================
// GENERAL ADVICE (state-aware)
// ===========================================

=== general_advice ===
#speaker:agent_0x99
// PASS 3 P7: these sit above the torres_identified early return.
{server_door_seen and not server_password_obtained and not patricia_ko:
    Owen wants a reason. Patricia's log has one, or ask Patricia.
}
{server_door_seen and not server_password_obtained and patricia_ko:
    Owen wants a reason. He's had word from Security; tell him.
}
{vault_reader_seen and not torres_print_collected:
    {torres_suspected:
        The vault takes Torres' print. His office has it.
    - else:
        The vault takes the cryptography lead's print. Something he handles every day will carry it.
    }
}

// PASS 4 (whodunnit): help a player who is stuck on the "who".
{not torres_identified:
    {
    - halloran_accused:
        You put Halloran's name up. Check it holds: where was she on the twenty-third, and whose badge came through the front door first?
    - found_door_log and not halloran_questioned and not found_halloran_alibi:
        That log says Halloran's spare. Ask her where it lives. And read the front-door lines, not just hers.
    - found_door_log and not torres_suspected:
        {patricia_ko:
            You've got a pattern on that sheet. Give me the name and the reason, or read her files. They're on her office floor.
        - else:
            You've got a pattern on that sheet. Take it to Patricia, or ask her for the vetting files on the names in it.
        }
    - found_incident_log and not found_door_log:
        Patricia's log has a cryptography badge at 23:47. Owen keeps the reader logs. Ask him whose.
    }
}

// PASS 4 fix 6: the fate is set but the portal isn't finished.
{final_choice != "" and not all_flags_in():
    Torres is dealt with. The portal isn't. All four flags in the drop-site, then I'll pull you out.
    -> support_hub
}
{final_choice != "":
    Torres is dealt with and the portal's done. I'm bringing you in.
    -> support_hub
}
{torres_identified:
    You've named him. Be ready for anything down there. People with nothing left to lose don't always behave.
    -> support_hub
}
{has_motive() and has_exfil():
    {patricia_ko:
        You have both halves of the case. Patricia's out of it, so give me the name.
    - else:
        You have both halves of the case. Call Patricia and give her the name.
    }
    -> support_hub
}
{has_motive():
    You know why someone would. Now prove it's leaving the building. Server room first, then whatever's behind it.
    -> support_hub
}
{has_exfil():
    You can see it leaving. Now find out who and why. The offices, the break room, and Patricia's files.
    -> support_hub
}
{not found_pamphlet:
    Start with people. Patricia, Owen in IT, anyone who notices things. Evidence comes out of conversations as often as drawers.
    -> support_hub
}
Keep talking to people, and keep reading what they leave lying around. It'll come.
-> support_hub
