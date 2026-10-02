// ===========================================
// Mission 5: NPC - Patricia Morgan (CSO)
// Chief Security Officer, the player's sponsor on site
//
// PASS 2: person-chat conversations never reach DONE/END (lesson 21).
// Every exit is #exit_conversation followed by -> hub, so re-talk
// re-enters the hub. Naming the insider needs both halves of the case:
// a motive item AND proof of exfiltration (see scenario.json.erb header).
//
// PASS 4 (whodunnit): the naming is a choice of names the player has
// reasons for. Halloran on the badge log alone gets her suspended
// (halloran_accused): the cost of a wrong accusation. A Torres naming
// without both halves still authorises a search of his office if there is
// some evidence behind it (torres_suspected). The office ask itself waits
// for torres_suspected, so her menu never points at him first.
//
// PASS 4 (dialogue): hub_quiet gives the hub a re-entry line (m03 pattern),
// set on every exit. The case summary at significant_findings is Patricia
// reading back her notes, not scripted player lines. The vetting-file
// hand-over no longer says how many files point anywhere.
// ===========================================

VAR patricia_influence = 5            // 0-10 scale
VAR topic_investigation = false
VAR topic_suspects = false
VAR topic_company_politics = false
VAR gave_vetting_file = false
VAR first_meeting = true
VAR hub_quiet = false

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR torres_identified = false
VAR patricia_authorised_office = false
VAR office_card_obtained = false
VAR owen_ko = false
VAR found_medical_bills = false
VAR found_torres_journal = false
VAR found_vetting_file = false
VAR found_incident_log = false
VAR found_pamphlet = false
VAR flag3_submitted = false
VAR flag4_submitted = false
VAR found_manifest = false
VAR found_upload_schedule = false
VAR found_stand_down_email = false
VAR server_door_seen = false
VAR server_password_obtained = false
VAR patricia_authorised_server = false
VAR vault_reader_seen = false
VAR torres_print_collected = false
VAR flag1_submitted = false
VAR flag2_submitted = false
VAR torres_suspected = false
VAR found_door_log = false
VAR found_halloran_alibi = false
VAR halloran_accused = false
VAR halloran_questioned = false
VAR door_log_reasoned = false
VAR it_notice_read = false

=== function has_motive()
~ return found_medical_bills or found_torres_journal or found_vetting_file

=== function has_exfil()
~ return flag3_submitted or found_manifest or found_upload_schedule

=== function all_flags_in()
~ return flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#complete_task:meet_handler
{not first_meeting:
    -> hub
}
~ first_meeting = false
#speaker:narrator
Narrator: A woman in her early fifties looks up from a wall of access logs. Military bearing, and a mug of tea gone cold by the keyboard.

#speaker:patricia_morgan
Patricia Morgan: You'll be the consultant. Patricia Morgan, Chief Security Officer. Thanks for coming at short notice.

+ [Fill me in. What have you found so far?]
    ~ patricia_influence += 1
    -> briefing_details

+ [Skip the pleasantries. What access can you give me?]
    Patricia Morgan: Direct. Good.
    ~ patricia_influence += 1
    -> provide_access

+ [I've been briefed. Quantum-safe keys, an inside job, and it ends tonight.]
    Patricia Morgan: Then we can skip a step.
    ~ patricia_influence += 2
    -> provide_access

=== briefing_details ===
#speaker:patricia_morgan

Patricia Morgan: Data leaving the building. Four point two terabytes over six weeks.

Patricia Morgan: Project Heisenberg. Quantum-safe key material for the national emergency dispatch rollout.

Patricia Morgan: If ENTROPY gets the rest of it, people die waiting for ambulances that come too late.

+ [How did you spot it?]
    Patricia Morgan: Transfer volumes. Two to four in the morning, out to an external host.
    Patricia Morgan: Three weeks to rule out legitimate remote work. Then I was told to stop looking.
    -> provide_access

+ [Who has access to the data?]
    -> suspects_overview

=== suspects_overview ===
#speaker:patricia_morgan

Patricia Morgan: Eight people with developed vetting in the cryptography division.

Patricia Morgan: Dr Ruth Halloran leads the team. Five senior researchers, two junior engineers.

Patricia Morgan: All vetted. All trusted. One of them shouldn't be.

+ [Can you get me in front of them without tipping anyone off?]
    ~ patricia_influence += 1
    Patricia Morgan: Already done. As far as the building knows, you're a routine security audit.
    -> provide_access

+ [Any prime suspects?]
    Patricia Morgan: I have a feeling. A feeling isn't evidence. That's your job.
    -> provide_access

=== provide_access ===
#speaker:patricia_morgan

#give_item:id_badge:visitor_badge
Patricia Morgan: Here. Visitor badge. It gets you through the front of the building and nowhere that matters.

Patricia Morgan: Owen Gallagher in IT holds the spare cards. Dr Halloran's badge opens the server side. I can lean on either of them if you need me to.

Patricia Morgan: My log of what's been flagged is on the desk. Take it.

+ [Where should I start?]
    Patricia Morgan: People. Someone in this building has noticed something and not said it. Then the servers.
    Patricia Morgan: When you think you have a name, bring me the why and the proof. Both.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

+ [I'll find my own way from here.]
    Patricia Morgan: Bring me a name when you have one. With proof.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// ===========================================
// CONVERSATION HUB (return visits)
// ===========================================

=== hub ===
#speaker:patricia_morgan
{hub_quiet:
    ~ hub_quiet = false
- else:
    Patricia Morgan: {&Go on.|What now?|Quickly, now. The CEO's prowling.}
}

+ {not topic_investigation} [How far did your own investigation get?]
    -> ask_investigation

+ {not topic_suspects} [Who's on the suspect list?]
    -> ask_suspects

+ {not topic_company_politics} [Why did management shut you down?]
    -> ask_company_politics

+ [I need your help with something.]
    -> request_authorization

+ {not torres_identified} [I think I know who it is.]
    -> share_findings

+ {topic_investigation and not found_stand_down_email and patricia_influence >= 7} [You mentioned an email that stopped you. Can I see it?]
    -> ceo_copy_handover

+ {torres_identified} [Anything else I should know before I go in?]
    Patricia Morgan: He's not a fighter. But cornered people surprise you. Keep the terminal between you and the door.
    -> hub

+ [That's everything for now. I'll keep you posted.]
    Patricia Morgan: Do. I don't like surprises.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== ask_investigation ===
#speaker:patricia_morgan
~ topic_investigation = true

Patricia Morgan: It hit a wall. The access looks legitimate because it is legitimate. Whoever it is has every right to touch that data.

{patricia_influence >= 6:
    -> patricia_confession
}

-> hub

// PASS 3 P8: her confession is its own knot (lesson 48), so she can hand
// over her copy of the CEO's email. The cabinet holds the other copy.
// Reachable from the confession and, later, from the hub (implementation
// review minor 1), so "Another time" is a promise the ink keeps.
// Playtest 3b: no local flag is spent here. The offer is gated on the synced
// global found_stand_down_email, which the pickup mapping sets only when the
// give actually lands; the chat closes so the next conversation re-syncs it.
// If the server ever rejects the give, the offer comes back.
=== ceo_copy_handover ===
#speaker:patricia_morgan
#give_item:notes:ceo_stand_down_copy
Patricia Morgan: I kept a copy. If this goes wrong, it went wrong there.
~ hub_quiet = true
#exit_conversation
-> hub

=== patricia_confession ===
#speaker:patricia_morgan
~ patricia_influence += 1
Patricia Morgan: Between you and me? I should have pushed harder. I let a polite email stop me.
+ {not found_stand_down_email} [Show me the email.]
    -> ceo_copy_handover
+ [Another time.]
    -> hub

=== ask_suspects ===
#speaker:patricia_morgan
~ topic_suspects = true

Patricia Morgan: Dr Ruth Halloran, team lead. David Torres, cryptography lead. Amara Okafor and Tomasz Wierzbicki, the two best on the maths.
Patricia Morgan: Hannah Leigh and Sanjay Rao. And two juniors, Ben Ashworth and Chloe Marsh. Ben does overnight test runs.

{patricia_influence >= 6:
    Patricia Morgan: Halloran's been fighting the CEO to publish the research. Ben's asked twice about a pay review. Torres has been distracted.
    Patricia Morgan: Angry, skint and distracted aren't evidence. I've been wrong about people before.
}

-> hub

=== ask_company_politics ===
#speaker:patricia_morgan
~ topic_company_politics = true

Patricia Morgan: The Home Office readiness review is in three weeks. The CEO, Jennifer Zhao, wants a clean file for it.

Patricia Morgan: So: no press, no prosecution if it can be avoided, and no security incident on the record.

{patricia_influence >= 6:
    Patricia Morgan: I want it done properly. She wants it done quietly. Tonight we find out which of us wins.
    ~ patricia_influence += 1
}

-> hub

// ===========================================
// AUTHORISATION REQUESTS
// ===========================================

=== request_authorization ===
#speaker:patricia_morgan

Patricia Morgan: What do you need?

+ {not gave_vetting_file} [I need the vetting files on the cryptography team.]
    // Round 2 (M1): the files answer the badge log; they don't replace it.
    {not (found_door_log or halloran_questioned):
        Patricia Morgan: Vetting files are restricted. Bring me a name or a pattern and I'll pull the ones that matter.
        -> hub
    }
    ~ gave_vetting_file = true
    ~ patricia_influence += 1
    #give_item:notes:torres_vetting_file
    #give_item:notes:halloran_vetting_file
    Patricia Morgan: That's what vetting will let me give you.
    Patricia Morgan: Read them properly. Nobody's file is as tidy as it looks.
    -> hub

+ {torres_suspected and not patricia_authorised_office and not office_card_obtained} [I need into David Torres' office.]
    ~ patricia_authorised_office = true
    Patricia Morgan: Owen holds IT's spare for every office. I'll message him now. On my authority.
    Patricia Morgan: If this turns out to be nothing, it was a routine audit. Understood?
    -> hub

+ {(server_door_seen or it_notice_read) and not server_password_obtained and not patricia_authorised_server} [The server room wants a password Owen won't give me.]
    ~ patricia_authorised_server = true
    Patricia Morgan: I sign the access log; IT holds the password. I'll message Owen and tell him it's on my authority.
    -> hub

+ [Actually, it can wait.]
    -> hub

// ===========================================
// NAMING THE INSIDER
// Needs one motive item and one exfiltration item.
// ===========================================

=== share_findings ===
// PASS 3 (review r3 M3): a re-navigated chat re-runs the knot that owns the
// saved choice, so the naming must never replay once it has happened.
{torres_identified: -> hub}
#speaker:patricia_morgan

Patricia Morgan: Go on, then. Who?

-> share_findings_who

// PASS 4 (whodunnit): only the names the player has a reason for.
=== share_findings_who ===
{torres_identified: -> hub}
+ {found_door_log and not halloran_accused} [Dr Ruth Halloran.]
    -> accuse_halloran
+ {found_door_log} [Ben Ashworth.]
    Patricia Morgan: Thursday at eight? The transfers run two till four, and he logged it with Owen. Try again.
    -> hub
+ {found_door_log or torres_suspected or has_motive() or has_exfil()} [David Torres.]
    -> name_torres
+ [I've got a feeling. Nothing I can show you yet.]
    Patricia Morgan: So have I. That's why you're here. Come back with evidence.
    -> hub

=== accuse_halloran ===
#speaker:patricia_morgan
{found_halloran_alibi:
    Patricia Morgan: Halloran was in Zurich the night that badge first went in. You've seen that. Try again.
    -> hub
}
Patricia Morgan: Ruth. Her spare, on the server hallway at two in the morning.
Patricia Morgan: I've waited three weeks to do something. All right. I'll suspend her access and keep her in the lab until the police can talk to her.
~ halloran_accused = true
~ patricia_influence -= 2
Patricia Morgan: If you're wrong, that's her career. And whoever it really is has just watched Security move.
~ hub_quiet = true
#exit_conversation
-> hub

=== name_torres ===
#speaker:patricia_morgan
{has_motive() and has_exfil():
    -> significant_findings
}
Patricia Morgan: David. Why?
-> torres_why

// Round 3: one reason menu for every Torres naming without both halves.
// Documents sit on both sides (a log decoy), the right log reason isn't
// first, and a wrong reason ends the conversation (re-talk to try again).
=== torres_why ===
+ {found_door_log} [His own badge is on the server hallway those nights.]
    Patricia Morgan: Read it again. His badge never touches the server hallway. Hers does.
    -> reason_wrong
+ [He's been under strain. His wife's ill.]
    Patricia Morgan: Half this building has someone ill at home. That's not evidence.
    -> reason_wrong
+ {halloran_questioned} [Halloran says he's in her lab after hours, where the spare hangs.]
    Patricia Morgan: Her word, about her own badge. It's enough to look, not to act.
    -> partial_naming
+ {found_door_log} [Check who comes in the front door just before the spare is used.]
    -> log_reason_right
+ {has_motive()} [Money. He's hiding how much he owes.]
    Patricia Morgan: That's why he might. It isn't proof that he did. Show me it leaving the building.
    -> partial_naming
+ {has_exfil()} [The staging is under his name.]
    Patricia Morgan: That's how. I need why. People don't do this for nothing.
    -> partial_naming
+ [He's the cryptography lead. He'd know how.]
    Patricia Morgan: So would seven other people. That's not evidence either.
    -> reason_wrong

=== reason_wrong ===
~ patricia_influence -= 1
~ hub_quiet = true
#exit_conversation
-> hub

=== log_reason_right ===
#speaker:patricia_morgan
~ door_log_reasoned = true
Patricia Morgan: ...His badge at the front door, then Ruth's spare at the server hallway six minutes on. Every night. And Ruth's own badge never comes in after seven.
{halloran_accused:
    Patricia Morgan: And Ruth's sitting in her lab, suspended on your word. That's on both of us now.
}
Patricia Morgan: That's a pattern. It's not a reason, and it's not proof the data's going anywhere.
-> partial_naming

// Some evidence, not both halves: she won't act on him yet, but she'll
// sign off a search of his office.
=== partial_naming ===
#speaker:patricia_morgan
~ torres_suspected = true
{not patricia_authorised_office and not office_card_obtained:
    ~ patricia_authorised_office = true
    Patricia Morgan: It's enough to look in his office. I'll tell Owen you can have the spare.
}
-> hub

=== significant_findings ===
{torres_identified: -> hub}
#speaker:patricia_morgan

Patricia Morgan: Slowly. I'm writing this down.
{found_medical_bills or found_vetting_file:
    Patricia Morgan: Money. His wife's treatment isn't covered, and he's borrowed against the house.
}
{found_torres_journal:
    Patricia Morgan: His own journal. He knows what it costs, and he's doing it anyway.
}
{flag3_submitted:
    Patricia Morgan: The staging manifest on the research portal, in his name.
- else:
    {found_manifest:
        Patricia Morgan: A staging manifest in the data centre. "Staged by: D. Torres."
    }
    {found_upload_schedule:
        Patricia Morgan: The upload schedule names him as operator, on site. Tonight, half past eight.
    }
}
{found_pamphlet:
    Patricia Morgan: And a firm called TalentStack ringing his desk.
}

Patricia Morgan: ...Damn.

Patricia Morgan: I sat three desks from him at the Christmas party. His kids drew on the tablecloth.

{halloran_accused:
    Patricia Morgan: And I suspended Ruth on your say-so. I'll have her access back on tonight. You can do your own apologising.
}

~ patricia_influence += 2
#complete_task:identify_torres
~ torres_identified = true
~ patricia_authorised_office = true
Patricia Morgan: Right. Your call from here. I'll keep the building quiet and the CEO out of your way.

Patricia Morgan: His badge just went through the hallway and the vault's logged him in. He's at the upload terminal.

{not owen_ko and not office_card_obtained:
    Patricia Morgan: I've told Owen you can have the spare for his office.
}
// PASS 4 fixes 6 and 12: outstanding flags, and urgency that matches the print.
{not all_flags_in():
    Patricia Morgan: Stop him first. Then finish whatever you were doing on that research server. Your people will want all of it.
}
{
- torres_print_collected:
    Patricia Morgan: You've got his print, then. Good.
- not vault_reader_seen:
    Patricia Morgan: The data centre door reads his fingerprint. Something from his office will carry it.
- else:
    Patricia Morgan: You'll need his print for that door. His office first.
}

Patricia Morgan: When you've got him, keep him there and call me. I'll bring the police. They get him, and your evidence, without your name on it.

Patricia Morgan: Be careful. Down there, you're on your own.
-> significant_close

=== significant_close ===
+ {found_door_log and not door_log_reasoned} [And the badge log. Look at the main-entrance times.]
    ~ door_log_reasoned = true
    Patricia Morgan: ...Six minutes before her spare, every night. You did read it properly.
    -> significant_close
+ [I'll stop him.]
    Patricia Morgan: Go on, then.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
+ [Whatever happens next is on me, not you.]
    Patricia Morgan: No. Some of it's on me. I let them stop me.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
