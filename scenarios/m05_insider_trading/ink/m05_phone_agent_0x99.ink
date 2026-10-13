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
//
// PASS 5 (alignment round 1, A2/A4/A6): the hub is rebuilt to m04's
// standard. "Where do I stand?" (report_progress) names the next step from
// what is done, whatever route got there, with the who-case as an aside
// until he is named. The five guide offers are one "Send me a field guide."
// choice. Once the fate is set the player sweeps the vault and calls in
// ("I'm done here. Bring me in." -> extract_offer -> extract_go sets
// mission_complete, which opens the debrief). The Owen-KO relay no longer
// hands over Torres' office card before anyone suspects him.
// ===========================================

VAR first_contact = true // ink-local: a page reload forgets it, so first_call also checks the night (A6)

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
VAR patricia_authorised_office = false // Synced scenario global: Owen may hand over Torres' office spare; also set by Patricia (m05_phone_patricia, m05_npc_patricia_morgan)
VAR torres_ko = false
VAR final_choice = "" // Synced scenario global: Torres' fate; also set by m05_torres_confrontation
VAR torres_arrested = false // Synced scenario global: Torres is in police custody; also set by m05_torres_confrontation
VAR torres_fate_by_phone = false
VAR architect_approval_confirmed = false
VAR recruiter_contacted_player = false
VAR flag1_submitted = false
VAR flag2_submitted = false
VAR flag3_submitted = false
VAR flag4_submitted = false
VAR torres_identified = false // Synced scenario global: Torres named on motive and exfil; also set by Patricia (m05_phone_patricia, m05_npc_patricia_morgan)
VAR patricia_authorised_server = false // Synced scenario global: Owen may give out the server-room password; also set by Patricia (m05_phone_patricia, m05_npc_patricia_morgan)
VAR server_door_seen = false
VAR server_password_obtained = false
VAR vault_reader_seen = false
VAR owen_ko = false
VAR office_card_obtained = false
VAR torres_print_collected = false
VAR torres_suspected = false // Synced scenario global: enough on Torres to search his office; also set by Patricia (m05_phone_patricia, m05_npc_patricia_morgan) and the case_motive/case_exfil mappings
VAR found_door_log = false
VAR found_halloran_alibi = false
VAR halloran_questioned = false
VAR halloran_accused = false // Synced scenario global: Halloran suspended on the player's word; also set by Patricia (m05_phone_patricia, m05_npc_patricia_morgan)
VAR found_incident_log = false
VAR door_log_reasoned = false // Synced scenario global: the player has read the badge-log pattern; also set by Patricia (m05_phone_patricia, m05_npc_patricia_morgan)
// PASS 5 (A2/A4/A6)
VAR mission_complete = false // Synced scenario global: set by extract_go (the call-in); opens the debrief
VAR server_room_entered = false
VAR server_badge_obtained = false
VAR patricia_phone_available = false
VAR door_log_held = false
VAR owen_office_card_relayed = false // Synced scenario global: HaX has pushed Owen's office spare (set here only)
VAR recruiter_texted = false
VAR it_notice_read = false
VAR door_log_reasoned_first = false // Synced scenario global (pass 5 R3-1): the front-door reason given in a reason menu, before the naming; set only in the *log_reason_right knots. The early-naming reward reads this, not door_log_reasoned
VAR torres_reason_guessed = false // Synced scenario global (pass 5 R2 B2): a wrong reason or a wrong name was tried; also set by Patricia (m05_npc_patricia_morgan, m05_phone_patricia). Excludes the early-naming reward

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

// Root divert (m03/m04 pattern). When a conversation has ended, the engine
// restores only its variables on the next talk and continues from the root.
-> start

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
// PASS 5 (A6): first_contact is ink-local, so a page reload forgets it. The
// opening call only fits the early game; after a late reload the phone opens
// straight on the hub.
{first_contact:
    ~ first_contact = false
    {not server_door_seen and not torres_suspected and not flag1_submitted and final_choice == "":
        -> first_call
    }
}
-> support_hub

=== first_call ===
#speaker:agent_0x99

Agent. Four hours to the final upload window.

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
// PASS 5 (A6): m04's shape. Choices only, most urgent first; topics appear
// at their beat and retire through their own guards. The field guides are
// one choice. The two fixed choices ("Where do I stand?" and the exit) sit
// last, so the hub is never empty and a stuck player always has the
// progress read to fall back on.
// ===========================================

=== support_hub ===
#speaker:agent_0x99

// A2: the way out once the fate is set. First, because it ends the mission.
+ {final_choice != "" and not mission_complete} [I'm done here. Bring me in.]
    -> extract_offer

+ {patricia_ko and not torres_identified} [Patricia's down. I'll give you the name instead.]
    -> name_to_hax

+ {torres_identified and final_choice == "" and not confrontation_advice_given} [I'm going in. Soft or hard?]
    -> confrontation_advice

+ {recruiter_contacted_player and not recruiter_discussed} [The Recruiter just called me.]
    -> topic_recruiter

+ {found_pamphlet and not recruitment_method_discussed} [Someone here has been talking to a recruiter called TalentStack.]
    -> topic_recruitment_method

// m13: any motive find, the journal included.
+ {torres_suspected and has_motive() and not leverage_discussed} [Torres is buried in debt he's hiding. Is that the hook?]
    -> topic_leverage

+ {found_torres_journal and not journal_discussed} [I've read his journal. He knew.]
    -> topic_journal

+ {architect_approval_confirmed and not architect_discussed} [The Architect signed off on the casualty projection.]
    -> topic_architect

+ {flag1_submitted and not flag1_discussed} [First flag's in. What next on the Bludit box?]
    -> topic_flag1

+ {flag2_submitted and not flag2_discussed} [Second flag's in. I've got a shell.]
    -> topic_flag2

+ {flag3_submitted and not flag3_discussed} [Third flag's in. I found his staging manifest.]
    -> topic_flag3

+ {flag4_submitted and not flag4_discussed} [Fourth flag's in. Root, and the Architect's sign-off.]
    -> topic_flag4

+ {torres_suspected and has_motive() and final_choice == ""} [What ENTROPY did to him. I need to talk it through.]
    -> moral_sounding_board

// ---- Field guides, one choice. Exposure-gated: offered by an eventMapping
// ---- when the player meets the obstacle, handed over here on request.
+ {(bludit_guide_offered and not bludit_guide_hint_given) or (lockpicking_guide_offered and not lockpicking_guide_hint_given) or (recon_guide_offered and not recon_guide_hint_given) or (privesc_guide_offered and not privesc_guide_hint_given) or (rfid_guide_offered and not rfid_guide_hint_given)} [Send me a field guide.]
    -> field_guides

// ---- Always available: the fallback that stops this hub ever running dry.
+ [Where do I stand?]
    -> report_progress

+ [Nothing right now.]
    #exit_conversation
    Line's open. Call when you have something.
    -> support_hub

// Choices-only: the guides on offer and not yet sent (m04 field_guides).
=== field_guides ===
+ {rfid_guide_offered and not rfid_guide_hint_given} [The badge-cloning guide.]
    -> request_rfid_guide
+ {lockpicking_guide_offered and not lockpicking_guide_hint_given} [The lockpicking guide.]
    -> request_lockpicking_guide
+ {recon_guide_offered and not recon_guide_hint_given} [The network mapping guide.]
    -> request_recon_guide
+ {bludit_guide_offered and not bludit_guide_hint_given} [The Bludit guide.]
    -> request_bludit_guide
+ {privesc_guide_offered and not privesc_guide_hint_given} [The sudo guide.]
    -> request_privesc_guide
+ [Not now.]
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

{
- found_medical_bills:
    Three hundred and eighty thousand dollars for a trial abroad, an insurer that walked away, and a wife with Stage 3 cancer.
    That's a target file, written by his own bad luck.
- found_vetting_file:
    Undeclared loans, a second charge on the house, and treatment abroad no insurer will cover. That's a target file.
- else:
    Debt relief and a retainer, in his own handwriting, and a trial dose booked for Monday. That's a target file.
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

+ [He also wrote that he doesn't recognise himself.]
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
    ~ torres_reason_guessed = true
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
    // PASS 5 R2 (B2): the retry is allowed, and noticed.
    {torres_reason_guessed:
        Second go. Make it count.
    - else:
        Why him?
    }
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
// PASS 5 (A4): with Owen down, HaX rebuilds the spare in the call. The relay
// flag is set before torres_suspected, so the room-entry relay mapping (which
// checks owen_office_card_relayed) never opens a second chat over this one.
=== hax_partial_naming ===
{owen_ko and not office_card_obtained and not owen_office_card_relayed:
    ~ owen_office_card_relayed = true
    #give_item:keycard:relayed_torres_office_card
    That's enough to look in his office. Owen can't hand you the spare, so I've rebuilt it. It's in your kit.
}
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
    ~ torres_reason_guessed = true
    Read it again. His badge never touches the server hallway. Hers does.
    #exit_conversation
    -> support_hub
+ [He's been under strain. His wife's ill.]
    ~ torres_reason_guessed = true
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
    ~ torres_reason_guessed = true
    So would seven others. Not evidence.
    #exit_conversation
    -> support_hub

=== hax_log_reason_right ===
#speaker:agent_0x99
~ door_log_reasoned = true
~ door_log_reasoned_first = true
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
Patricia's down. She was our way into that building.
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
// PASS 5 (A4): the office spare only once someone suspects Torres. Before
// that, on_owen_ko_office_card pushes it later (room-entry mapping on
// torres_suspected with owen_ko), or hax_partial_naming does in the call.
// A3: two prints enrolled on the vault, so the line no longer names him.
=== on_owen_ko_relay ===
#speaker:agent_0x99
#give_item:keycard:relayed_server_badge
#give_item:notes:relayed_server_password_note
Owen's down. That wasn't how I'd have done it.
I've rebuilt his badge from the reader logs. It's in your kit.
So is the server-room password. It was sitting in IT's ticket queue.
{torres_suspected and not office_card_obtained and not owen_office_card_relayed:
    ~ owen_office_card_relayed = true
    #give_item:keycard:relayed_torres_office_card
    And IT's spare for Torres' office, since that's where the evidence points.
}
{not door_log_held and not found_door_log:
    #give_item:notes:relayed_door_log
    And the night badge log he'd have pulled for you. Read it properly.
}
{torres_suspected:
    Past the server room is the key vault. Fingerprint reader, two prints enrolled: Dr Halloran's and Torres'.
- else:
    Past the server room is the key vault. Fingerprint reader, two prints enrolled: Dr Halloran's and the cryptography lead's.
}
Whatever else he knew, you'll have to find the hard way.
-> on_owen_ko_relay_choices

=== on_owen_ko_relay_choices ===
+ [I'll manage.]
    #exit_conversation
    -> support_hub

// PASS 5 (A4): reached by the room_entered mapping once Torres is suspected
// with Owen down and no office card yet. Text first, choices in a text-free
// knot (phone reopen rule).
=== on_owen_ko_office_card ===
{office_card_obtained or owen_office_card_relayed: -> support_hub}
#speaker:agent_0x99
~ owen_office_card_relayed = true
#give_item:keycard:relayed_torres_office_card
That's enough to look in Torres' office. Owen can't hand you the spare, so I've rebuilt it from the reader logs. It's in your kit.
-> on_owen_ko_office_card_choices

=== on_owen_ko_office_card_choices ===
+ [Thanks.]
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
    -> post_ko_safety_net_sweep
+ [I'm leaving him. He's not my problem.]
    #complete_task:make_critical_choice
    ~ final_choice = "combat_lethal"
    ...Understood. I'll note the time.
    ~ torres_fate_by_phone = true
    -> post_ko_safety_net_sweep

// PASS 5 (A2): the phone-fate path gets the same sweep-then-call-in as the
// person-chat one (whose text comes from the conversation_closed mappings).
=== post_ko_safety_net_sweep ===
// R2 (m5): no leisurely sweep beside a man left to die.
{
// R3-2: left to die with flags still out: no sweep, no "Good."
- final_choice == "combat_lethal" and not all_flags_in():
    He's still on that floor, and the upload's dead. Finish the research server: all four flags in the drop-site, then call me.
- not all_flags_in():
    The upload's dead. Finish the research server: all four flags in the drop-site. Then sweep the vault and call me.
- final_choice == "combat_lethal":
    If you're leaving him there, take what's on that desk and go. Call me.
- else:
    Sweep the vault before you go. Then call me and I'll bring you in.
}
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
    We have no badge. What happens to him after that is up to them.
- else:
    Go hard and you hold him, hand him to Patricia, and she calls the police.
    We have no badge. What happens to him after that is up to them.
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
    That's a lot to carry.
    -> support_hub

+ [I don't know what I think yet.]
    You don't have to, until you're in front of him. Call me again if it helps.
    -> support_hub

// ===========================================
// PASS 5 A2: THE CALL-IN (m04 extract_offer / extract_go)
// After the fate the player sweeps the vault and calls in here. Text first,
// choices in a text-free knot (phone reopen rule). extract_go sets
// mission_complete, which opens the debrief (closing_debrief_trigger
// mapping); the call-in task completes in the same batch.
// ===========================================

=== extract_offer ===
#speaker:agent_0x99
{not all_flags_in():
    Not yet. The research server isn't finished: all four flags in the drop-site, then I'll pull you out.
    -> support_hub
}
Once you're out, QDC's own people go through that vault before ours do. Whatever you haven't read could walk.
{not found_pipeline_list:
    There's an envelope under the terminal keyboard nobody's opened.
}
{not found_upload_schedule:
    His upload schedule's still on the desk.
}
{not found_manifest:
    The package manifest's still there as well.
}
// R2 (m7): she has nothing left to offer once he's dealt with.
{recruiter_texted and not recruiter_contacted_player:
    That TalentStack text never got an answer. She's lost him. Ring her if you want to hear her lose.
}
-> extract_choices

=== extract_choices ===
+ [Bring me in.]
    Car's at the front entrance. Two minutes.
    -> extract_confirm
+ [Not yet. I'm still looking.]
    // R2 (m5): left to die, he is still on the floor beside the desk.
    {final_choice == "combat_lethal":
        Your call. He hasn't got long.
    - else:
        Take your time. The vault isn't going anywhere.
    }
    -> support_hub

=== extract_confirm ===
+ [On my way.]
    -> extract_go

=== extract_go ===
#speaker:agent_0x99
#complete_task:call_in_after_sweep
#set_global:mission_complete:true
~ mission_complete = true
See you at HQ.
-> support_hub

// ===========================================
// WHERE DO I STAND? (PASS 5 A6)
// The always-on fallback, replacing general_advice. It reads the night as
// it is and names the next step; first unmet step wins. Each step asks
// whether it is done (a pickup, a lift, a flag, a room), never how: Owen's
// clone, Halloran's spare or HaX's relay all count for the hallway, and
// the badge log counts as soon as it is in the kit. Until he is named, an
// aside gives the next step on the who.
// ===========================================

=== report_progress ===
#speaker:agent_0x99
{
// R3-2: the lethal twin comes first.
- final_choice == "combat_lethal" and not all_flags_in():
    The upload's dead and he's still on that floor. The research server isn't. All four flags, then call me.
- final_choice != "" and not all_flags_in():
    The upload's dead. The research server isn't. All four flags in the drop-site, then call me and I'll bring you in.
- final_choice == "combat_lethal":
    The upload's dead and the flags are in. He's still on that floor. Take what you need and call me.
- final_choice != "":
    It's done. The upload's dead and the flags are in.
    Sweep the vault if you haven't, then tell me to bring you in.
- torres_ko:
    Torres is down and nobody's decided what happens to him. Get back to the vault.
- torres_identified and not torres_print_collected:
    He's in the key vault, past the server room. The reader takes one of two prints, and his is on something in his office.
    {not office_card_obtained and not owen_ko:
        Owen's been told you can have the spare.
    }
- torres_identified:
    You've got his print. He's at the upload terminal in the vault. Go and face him.
- not patricia_phone_available and not patricia_ko:
    Start with Patricia Morgan. Her office is off reception, on the east side.
- not server_badge_obtained:
    The server hallway wants a staff badge. Owen carries one on his lanyard in the open-plan, and your cloner reads it while he talks.
- not server_password_obtained:
    {
    - not server_door_seen and not it_notice_read:
        Get to the server-room door, off the server hallway. The notice beside it says who holds the password.
    - patricia_ko:
        Owen holds the server-room password and wants a reason for his log. He's had word from Security. Tell him.
    - else:
        Owen holds the server-room password and wants a reason for his log. Patricia's incident log has one, or ask Patricia to sign it off.
    }
- not server_room_entered:
    You've got the password. The server room is north of the server hallway.
- not flag1_submitted:
    You're on the research subnet. Map it, then find the login someone left lying about.
- not flag2_submitted:
    You've got the admin login. The portal's upload flaw needs you logged in, and you are.
- not flag3_submitted:
    You're on the box. Find out whose files are on it.
- not flag4_submitted:
    Root's the last door. Start with what that account is allowed to run.
- else:
    All four flags are in. What's left is the name.
}
// The who, until he's named. Not before Patricia: that step comes first.
{not torres_identified and final_choice == "" and (patricia_phone_available or patricia_ko):
    {
    - has_motive() and has_exfil():
        {patricia_ko:
            You have both halves of the case. Patricia's out of it, so give me the name.
        - else:
            You have both halves of the case. Give Patricia the name, in person or on her mobile.
        }
    // R2 (m4): only until the front-door reason has cleared her.
    - halloran_accused and not torres_suspected:
        You put Halloran's name up, and the upload sped up when Security moved.
        Check it holds. Where was she on the twenty-third, and whose badge came through the front door first?
    - door_log_held and not found_door_log:
        The badge log's in your kit. Read it, the front-door lines as well as hers.
    - found_door_log and not halloran_questioned and not found_halloran_alibi and not torres_suspected:
        That log says Halloran's spare. Ask her where it lives. And read the front-door lines, not just hers.
    - found_door_log and not torres_suspected:
        {patricia_ko:
            You've got a pattern on that sheet. Give me the name and the reason, or read her files. They're on her office floor.
        - else:
            You've got a pattern on that sheet. Take it to Patricia, or ask her for the vetting files on the names in it.
        }
    - found_incident_log and not door_log_held and not torres_suspected:
        Patricia's log has a cryptography badge at 23:47. Owen keeps the reader logs. Ask him whose.
    - not found_incident_log and not door_log_held and not torres_suspected and not patricia_ko:
        For the who, start with the incident log on Patricia's desk.
    // R2 (m3): a log-reasoned suspicion with nothing else yet.
    - torres_suspected and not has_motive() and not has_exfil():
        You've a pattern on him, not a case. His office for why, then the vault past the server room for proof.
    - torres_suspected and not has_motive():
        You can see it leaving under his name. Now find out why: his office, the break room, Patricia's files.
    - torres_suspected and not has_exfil():
        You know why he might. Now the proof it's leaving: the vault past the server room has it, and so does the research server.
    - server_password_obtained and not torres_suspected:
        The vault takes one of two prints, Halloran's or the cryptography lead's. Work out which you're after before you hunt for a print.
    }
}
// R2 (m7): after the fate she has no pitch left (never_talked_terms).
{recruiter_texted and not recruiter_contacted_player and final_choice == "":
    That TalentStack text is still unanswered. Hear her out if you want. Just don't give her anything.
}
-> report_progress_choices

=== report_progress_choices ===
+ [Right.]
    -> support_hub
