// ===========================================
// PHONE NPC: Agent HaX (handler support)
// Mission 5: Insider Trading
// Remote support, field guides, KO relays, moral sounding board
//
// PASS 2: never reaches DONE (lesson 21). Every exit is
// #exit_conversation followed by -> support_hub.
// Speaker id stays agent_0x99 (the NPC id); the display name is Agent HaX,
// as in m02, m03, m04 and m06.
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
VAR torres_killed = false
VAR torres_fate_by_phone = false
VAR architect_approval_confirmed = false
VAR recruiter_contacted_player = false
VAR flag1_submitted = false
VAR flag2_submitted = false
VAR flag3_submitted = false
VAR flag4_submitted = false
VAR bludit_server_discovered = false
VAR torres_identified = false

// Field-guide exposure flags. Each _offered is set by an eventMapping when
// the player meets the thing the guide is about; each _hint_given is set
// here when the guide is handed over.
VAR bludit_guide_offered = false
VAR bludit_guide_hint_given = false
VAR lockpicking_guide_offered = false
VAR lockpicking_guide_hint_given = false
VAR recon_guide_offered = false
VAR recon_guide_hint_given = false

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

Agent HaX: {player_name}. You're in. Four hours until the final upload window, so let's use them.

Agent HaX: Patricia Morgan runs security here. She called us in, and she's the one who can open doors for you. Keep her in the picture as you build it.

Agent HaX: Somewhere in that building is the person feeding ENTROPY the key material for the 999 dispatch network. Find them before half past eight tonight.

+ [I'll get to work.]
    -> support_hub

+ [What should I know going in?]
    Agent HaX: Nobody in that building is your enemy by default. It's an office, with one person in it who made a terrible choice under terrible pressure.
    Agent HaX: Talk to people. The evidence will tell you who, and it'll tell you why. You need both before you confront anyone.
    -> support_hub

+ [Anything I should be careful of?]
    Agent HaX: Don't show your hand early. If the insider hears that Security has a name, they'll bring the upload forward, and you lose any chance of turning them.
    Agent HaX: And watch for anyone who reaches out to you directly. ENTROPY recruits. You might not be the only target in the building tonight.
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

+ {(found_medical_bills or found_vetting_file) and not leverage_discussed} [Torres is buried in debt he's hiding. Is that the hook?]
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

+ {lockpicking_guide_offered and not lockpicking_guide_hint_given} [Send me the lockpicking guide.]
    -> request_lockpicking_guide

+ {recon_guide_offered and not recon_guide_hint_given} [Send me the network recon guide.]
    -> request_recon_guide

+ {patricia_ko and not torres_identified} [Patricia's down. I'll give you the name instead.]
    -> name_to_hax

+ {torres_identified and final_choice == "" and not confrontation_advice_given} [I'm going in. Soft or hard?]
    -> confrontation_advice

+ {has_motive()} [What ENTROPY did to him. I need to talk it through.]
    -> moral_sounding_board

+ [Got any general advice?]
    -> general_advice

+ [Just checking in.]
    Agent HaX: Stay focused. You're on a clock.
    #exit_conversation
    -> support_hub

// ===========================================
// EVIDENCE TOPICS
// ===========================================

=== topic_recruitment_method ===
#speaker:agent_0x99
~ recruitment_method_discussed = true

Agent HaX: TalentStack Executive Recruiting is the Insider Threat Initiative's front, and "R." is the Recruiter. Find someone in trouble, make an offer, then sell them the ideology until the casualties stop feeling like the point.

Agent HaX: A leaflet with an answer scribbled on the back means somebody in that building has already said yes.

+ [So I'm looking for a target, not a recruiter.]
    Agent HaX: Probably. The Recruiter doesn't sit on site; too much exposure. Look for someone with access and a reason to need money fast.
    -> support_hub

+ [Then I'm looking for whoever wrote on the back.]
    Agent HaX: Handwriting, initials, a desk the leaflet came from. Start there.
    -> support_hub

=== topic_leverage ===
#speaker:agent_0x99
~ leverage_discussed = true

Agent HaX: Three hundred and eighty thousand dollars for a trial abroad, an insurer that walked away, and a wife with Stage 3 cancer. That's a target file, written by his own bad luck.

Agent HaX: ENTROPY rarely recruits believers. They recruit desperate people and sell them the belief afterwards, so the choice feels like it was theirs.

+ [That's monstrous.]
    Agent HaX: It's efficient. Some nights that's worse.
    -> support_hub

+ [Desperate people can still say no.]
    Agent HaX: They can. Keep hold of that when you're standing in front of him. Keep hold of the rest too.
    -> support_hub

=== topic_journal ===
#speaker:agent_0x99
~ journal_discussed = true

Agent HaX: Then you've watched him talk himself round, on paper. Thirty to forty-five lives, written down, and he kept going.

Agent HaX: That should worry you more than the recruitment pitch. He understands the cost. He decided he could live with it.

+ [Does that change how I approach him?]
    Agent HaX: Don't expect him to be surprised when you lay it out. He already knows. What you can offer him is a way out he hasn't let himself look at.
    -> support_hub

+ [He also wrote "what have I become".]
    Agent HaX: He did. That line is the door, if you want one.
    -> support_hub

=== topic_architect ===
#speaker:agent_0x99
~ architect_discussed = true

Agent HaX: Read it twice. A casualty projection, reviewed, and signed off as an acceptable cost.

Agent HaX: No rogue cell improvised that. Someone priced human lives and approved the invoice. It's the strongest thing you'll find tonight, because it puts this above Torres.

+ [This is bigger than one insider.]
    Agent HaX: It always was. Torres is the delivery. The Architect is the decision. Keep both in the file.
    -> support_hub

+ [Then Torres is the only thread we've got to it.]
    Agent HaX: For tonight, yes. Bear that in mind when you decide what happens to him.
    -> support_hub

=== topic_recruiter ===
#speaker:agent_0x99
~ recruiter_discussed = true

Agent HaX: The Recruiter runs ENTROPY's talent pipeline behind an executive search firm. If she rang you herself, you've got close enough to worry her.

Agent HaX: Whatever she offered, she's very good at making a bad trade sound reasonable. That's the whole of her job.

+ [She offered me a deal.]
    Agent HaX: Of course she did. Weigh it on what it costs, not on how reasonable she sounded.
    -> support_hub

+ [I'll be careful.]
    -> support_hub

// ===========================================
// FLAG STATUS TOPICS
// ===========================================

=== topic_flag1 ===
#speaker:agent_0x99
~ flag1_discussed = true

Agent HaX: First flag verified. Somebody's sloppy handover note got you the login.

Agent HaX: Now use it. The upload flaw needs you logged in, and you are.

-> support_hub

=== topic_flag2 ===
#speaker:agent_0x99
~ flag2_discussed = true

Agent HaX: Second flag in. You've got a shell on their portal.

Agent HaX: Look for whoever's been using that box to stage files. Their home directory will tell you who.

-> support_hub

=== topic_flag3 ===
#speaker:agent_0x99
~ flag3_discussed = true

Agent HaX: Third flag verified. His staging manifest, under his own name.

Agent HaX: One more: the authorisation behind it. That'll be somewhere only root can read.

-> support_hub

=== topic_flag4 ===
#speaker:agent_0x99
~ flag4_discussed = true

Agent HaX: All four in. The Architect's acquisition authorisation.

Agent HaX: A casualty projection, signed and filed as an acceptable cost. ENTROPY's leadership approved this knowing the number.

-> support_hub

// ===========================================
// NAMING THE INSIDER TO HAX (Patricia KO'd)
// ===========================================

=== name_to_hax ===
#speaker:agent_0x99
{has_motive() and has_exfil():
    You: David Torres. I've got why he'd do it, and proof it's leaving the building.
    Agent HaX: That's enough for me. I'm flagging him now.
    #complete_task:identify_torres
    ~ torres_identified = true
    Agent HaX: His badge is in the data centre, north of the server room, and the window's close. Hang up and move.
    + [On my way.]
        #exit_conversation
        -> support_hub
- else:
    {has_motive():
        Agent HaX: You've got why. I need proof it's leaving the building: the server room, the portal, the data centre.
    - else:
        {has_exfil():
            Agent HaX: You can see the data moving. Now tell me who, and why. Eight people could have touched that share.
        - else:
            Agent HaX: Not yet. I need a reason and I need proof. Bring me both.
        }
    }
    -> support_hub
}

// ===========================================
// KO RELAYS
// ===========================================

// npc_ko:patricia_morgan. obtain_security_badge is a collect task, so the
// player needs a real id_badge; and the office card no longer needs her say-so.
=== on_patricia_ko_relay ===
#speaker:agent_0x99
#give_item:id_badge:relayed_contractor_pass
~ patricia_authorised_office = true
Agent HaX: Patricia's down. She was our sponsor in that building, {player_name}.
Agent HaX: I've printed you a contractor pass against their visitor system, and Kevin will get a message "from Security" saying you can have the office spares.
Agent HaX: When you've got a name and the proof, bring it to me instead of her.
+ [Understood. I'll bring it to you.]
    #exit_conversation
    -> support_hub

// npc_ko:kevin_park. His items can't drop in a later-loaded room (npc._sprite
// gap), so HaX pushes working copies of both cards.
=== on_kevin_ko_relay ===
#speaker:agent_0x99
#give_item:keycard:relayed_server_badge
#give_item:keycard:relayed_torres_office_card
Agent HaX: Kevin's down. That wasn't how I'd have done it.
Agent HaX: I've pulled his badge and the office spare off the reader logs and pushed copies to your kit. You've got the server hallway and Torres' office.
Agent HaX: Whatever else he knew, you'll have to find the hard way.
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
Agent HaX: Torres is still on the floor where he went down, and he isn't moving much. The upload's stopped. What are you doing with him?
+ [Stay with him. Recovery position, pressure on the wound, call it in.]
    You: I'm staying with him. Get Patricia and an ambulance down here.
    ~ torres_arrested = true
    #complete_task:make_critical_choice
    ~ final_choice = "combat_nonlethal"
    Agent HaX: Calling it now. Patricia will ring the police. Keep his airway clear.
    ~ torres_fate_by_phone = true
    #exit_conversation
    -> support_hub
+ [Leave him bleeding. He's not my problem.]
    You: I'm leaving him. Someone else can deal with it.
    ~ torres_killed = true
    #complete_task:make_critical_choice
    ~ final_choice = "combat_lethal"
    Agent HaX: ...Understood. I'll note the time.
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

Agent HaX: Bludit guide's in your kit. Start with what's leaked in plain sight, then work up to the authenticated upload flaw for a shell.

+ [Got it.]
    Agent HaX: Recon first. The leaked login gets you further, faster, than guessing ever will.
    -> support_hub

=== request_lockpicking_guide ===
#speaker:agent_0x99
~ lockpicking_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_lockpicking

Agent HaX: Lockpicking guide's in your kit.

Agent HaX: Light tension, find the binding pin, set it, repeat. Feel the lock. Don't force it.

+ [Thanks.]
    Agent HaX: Quiet and patient gets you through it.
    -> support_hub

=== request_recon_guide ===
#speaker:agent_0x99
~ recon_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_recon_network_mapping

Agent HaX: Recon guide's on its way.

Agent HaX: Map what's alive on that subnet before you touch anything. The Bludit box won't be the only thing listening.

+ [Thanks.]
    Agent HaX: Quick scan, clean notes, then go in.
    -> support_hub

// ===========================================
// CONFRONTATION ADVICE
// ===========================================

=== confrontation_advice ===
#speaker:agent_0x99
~ confrontation_advice_given = true

Agent HaX: You've named him. Now it's about how you go in.

Agent HaX: Soft: give him the exit ENTROPY never offered. He goes back to his desk working for us, and his family stays whole. It only works if he wants out.

Agent HaX: Hard: you hold him, hand him to Patricia, and she calls the police. We have no badge, {player_name}. Whatever happens to him after that is up to them.

+ [Which do you recommend?]
    Agent HaX: I'm not going to answer that. You've seen what he's carrying. It has to be your call.
    -> support_hub

+ [I'll decide when I'm standing in front of him.]
    Agent HaX: That's the right answer. Read the room when you get there.
    -> support_hub

// ===========================================
// MORAL SOUNDING BOARD (returnable)
// ===========================================

=== moral_sounding_board ===
#speaker:agent_0x99

Agent HaX: ENTROPY weaponises suffering. They find someone drowning and offer a rope with a hook in it. That doesn't excuse him. It explains the machine that built the choice.

Agent HaX: He still made choices. Every step from that first phone call to tonight, he could have walked into Patricia's office instead. He didn't.

+ [Does knowing why change what he deserves?]
    Agent HaX: Maybe it changes what's fair. It doesn't undo thirty to forty-five deaths if that upload goes. Both are true at once, and nobody's philosophy handles that cleanly.
    -> support_hub

+ [What happens to people like him after this?]
    Agent HaX: That depends on what you do tonight. Each way you go writes a different ending for him and for Elena. It's a heavy thing to carry, {player_name}.
    -> support_hub

+ [I don't know what I think yet.]
    Agent HaX: You don't have to, until you're in front of him. Call me again if it helps.
    -> support_hub

// ===========================================
// GENERAL ADVICE (state-aware)
// ===========================================

=== general_advice ===
#speaker:agent_0x99

{torres_identified:
    Agent HaX: You've named him. Whatever you decide when you face him, be ready for anything. People with nothing left to lose don't always behave.
    -> support_hub
}
{has_motive() and has_exfil():
    {patricia_ko:
        Agent HaX: You have both halves of the case. Patricia's out of it, so give me the name.
    - else:
        Agent HaX: You have both halves of the case. Take it to Patricia and name him.
    }
    -> support_hub
}
{has_motive():
    Agent HaX: You know why someone would. Now prove it's leaving the building. Server room first, then whatever's behind it.
    -> support_hub
}
{has_exfil():
    Agent HaX: You can see it leaving. Now find out who and why. The offices, the break room, and Patricia's files.
    -> support_hub
}
{not found_pamphlet:
    Agent HaX: Start with people. Patricia, Kevin in IT, anyone who notices things. Evidence comes out of conversations as often as drawers.
    -> support_hub
}
Agent HaX: You know what you're doing. Trust your training.
-> support_hub
