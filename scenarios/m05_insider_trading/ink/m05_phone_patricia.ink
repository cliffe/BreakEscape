// ===========================================
// PHONE NPC: Patricia Morgan (her mobile)
// Mission 5: Insider Trading
//
// PASS 3 P11. Lets the player name the insider without walking back
// through reception.
//
// Engine rules this file is written to (review r2 M1, r3 M3):
// - She is in the phone's npcIds, so `start` is preloaded the first time
//   the phone opens (phone-chat-minigame.js:283-380). Nothing before the
//   first choice prints or assigns (lesson 36).
// - A reopened chat with saved state, after any synced global changed,
//   re-runs the knot that owns the first saved choice, not `start`
//   (phone-chat-minigame.js:532-566). So every resting knot re-checks
//   patricia_ko and patricia_phone_available at its top, and the naming
//   knot returns to the hub once torres_identified is set.
// - Never reaches DONE/END (lesson 21).
// The naming conditions match m05_npc_patricia_morgan.ink exactly.
// PASS 4 fix 7: the two authorisations (office card, server-room password)
// can be asked for by phone too, with the same conditions as in person.
// They assign in the choice body and return to the hub, which prints
// nothing before its choices, so a re-navigation replays nothing.
// PASS 4 (whodunnit): naming offers the names the player has reasons for,
// as in person. phone_who is choices-only; every naming knot re-checks
// torres_identified and patricia_ko at its top.
// PASS 4 (dialogue): her own lines carry no prefix (phone convention). The
// case summary is her reading back her notes, not scripted player lines.
// ===========================================

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR patricia_ko = false
VAR patricia_phone_available = false
VAR torres_identified = false
VAR final_choice = ""
VAR patricia_authorised_office = false
VAR vault_reader_seen = false
VAR owen_ko = false
VAR office_card_obtained = false
VAR found_medical_bills = false
VAR found_torres_journal = false
VAR found_vetting_file = false
VAR flag3_submitted = false
VAR found_manifest = false
VAR found_upload_schedule = false
VAR found_pamphlet = false
VAR server_door_seen = false
VAR server_password_obtained = false
VAR patricia_authorised_server = false
VAR torres_print_collected = false
VAR flag1_submitted = false
VAR flag2_submitted = false
VAR flag4_submitted = false
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

=== start ===
{patricia_ko: -> no_answer}
{not patricia_phone_available: -> not_yet}
-> hub

// Before the first in-person meeting has closed. No NPC text: the preload
// would otherwise leave an unread message.
=== not_yet ===
{patricia_ko: -> no_answer}
{patricia_phone_available: -> hub}
+ [(Hang up.)]
    #exit_conversation
    -> not_yet

// After a KO. The ring-out sits behind the choice so the preload shows
// nothing (review r3 minor 1).
// Playtest 3b: a narrator line after the choice counted as an unread
// message. The outcome is in the choice text and nothing follows it.
=== no_answer ===
+ [(Ring her. It rings out.)]
    #exit_conversation
    -> no_answer

=== hub ===
{patricia_ko: -> no_answer}
{not patricia_phone_available: -> not_yet}
#speaker:patricia_morgan
+ {not torres_identified} [I know who it is.]
    -> phone_share_findings
+ {torres_identified and final_choice == ""} [He's in the data centre.]
    -> phone_hold_him
+ {torres_suspected and not patricia_authorised_office and not office_card_obtained} [I need into David Torres' office.]
    ~ patricia_authorised_office = true
    I'll message Owen now. On my authority. If it's nothing, it was a routine audit.
    -> hub
+ {(server_door_seen or it_notice_read) and not server_password_obtained and not patricia_authorised_server} [Owen won't give me the server-room password.]
    ~ patricia_authorised_server = true
    I sign the access log; IT holds the password. I'll tell Owen it's on my authority.
    -> hub
+ [Just checking in.]
    {not torres_identified:
        Still here. Ring me when you've got something.
    }
    {torres_identified and final_choice == "":
        You know where he is. Go.
    }
    {final_choice != "":
        It's done, then. I'll look after the building.
    }
    #exit_conversation
    -> hub

=== phone_share_findings ===
{torres_identified: -> hub}
#speaker:patricia_morgan
Go on, then. Who?
-> phone_who

=== phone_who ===
{patricia_ko: -> no_answer}
{torres_identified: -> hub}
+ {found_door_log and not halloran_accused} [Dr Ruth Halloran.]
    -> phone_accuse_halloran
+ {found_door_log} [Ben Ashworth.]
    Thursday at eight? The transfers run two till four, and he logged it with Owen. Try again.
    -> hub
+ {found_door_log or torres_suspected or has_motive() or has_exfil()} [David Torres.]
    -> phone_name_torres
+ [I've got a feeling. Nothing I can show you yet.]
    So have I. Ring me back with evidence.
    -> hub

=== phone_accuse_halloran ===
{patricia_ko: -> no_answer}
{halloran_accused or torres_identified: -> hub}
#speaker:patricia_morgan
{found_halloran_alibi:
    Halloran was in Zurich the night that badge first went in. You've seen that. Try again.
    -> hub
}
Ruth. Her spare, at two in the morning. All right. I'll suspend her access and keep her in the lab for the police.
~ halloran_accused = true
If you're wrong, that's her career. And whoever it really is has just watched Security move.
#exit_conversation
-> hub

=== phone_name_torres ===
{patricia_ko: -> no_answer}
{torres_identified: -> hub}
#speaker:patricia_morgan
{has_motive() and has_exfil():
    -> phone_significant_findings
}
David. Why?
-> phone_torres_why

// Round 3: the shared reason menu (see m05_npc_patricia_morgan.ink,
// torres_why). Choices-only; re-checks state for a re-navigation. A wrong
// reason ends the call.
=== phone_torres_why ===
{patricia_ko: -> no_answer}
{torres_identified: -> hub}
+ {found_door_log} [His own badge is on the server hallway those nights.]
    Read it again. His badge never touches the server hallway. Hers does.
    #exit_conversation
    -> hub
+ [He's been under strain. His wife's ill.]
    Half this building has someone ill at home. That's not evidence.
    #exit_conversation
    -> hub
+ {halloran_questioned} [Halloran says he's in her lab after hours, where the spare hangs.]
    Her word, about her own badge. It's enough to look, not to act.
    -> phone_partial_naming
+ {found_door_log} [Check who comes in the front door just before the spare is used.]
    -> phone_log_reason_right
+ {has_motive()} [Money. He's hiding how much he owes.]
    That's why he might. It isn't proof that he did. Show me it leaving the building.
    -> phone_partial_naming
+ {has_exfil()} [The staging is under his name.]
    That's how. I need why. People don't do this for nothing.
    -> phone_partial_naming
+ [He's the cryptography lead. He'd know how.]
    So would seven other people. That's not evidence either.
    #exit_conversation
    -> hub

=== phone_log_reason_right ===
{patricia_ko: -> no_answer}
#speaker:patricia_morgan
~ door_log_reasoned = true
...His badge at the front door, then Ruth's spare six minutes on. Every night. And Ruth's own badge never comes in after seven.
{halloran_accused:
    And Ruth's sitting in her lab, suspended on your word. That's on both of us now.
}
That's a pattern. It's not a reason, and it's not proof the data's going anywhere.
-> phone_partial_naming

=== phone_partial_naming ===
~ torres_suspected = true
{not patricia_authorised_office and not office_card_obtained:
    ~ patricia_authorised_office = true
    It's enough to look in his office. I'll tell Owen you can have the spare.
}
-> hub

=== phone_significant_findings ===
{torres_identified: -> hub}
#speaker:patricia_morgan
Slowly. I'm writing this down.
{found_medical_bills or found_vetting_file:
    Money. His wife's treatment isn't covered, and he's borrowed against the house.
}
{found_torres_journal:
    His own journal. He knows what it costs, and he's doing it anyway.
}
{flag3_submitted:
    The staging manifest on the research portal, in his name.
- else:
    {found_manifest:
        A staging manifest in the data centre. "Staged by: D. Torres."
    }
    {found_upload_schedule:
        The upload schedule names him as operator, on site. Tonight, half past eight.
    }
}
{found_pamphlet:
    And a firm called TalentStack ringing his desk.
}
...Damn. I sat three desks from him at the Christmas party.
{halloran_accused:
    And I'll have Ruth's access back on tonight. You can do your own apologising.
}
#complete_task:identify_torres
~ torres_identified = true
~ patricia_authorised_office = true
His badge just went through the hallway and the vault's logged him in. He's at the upload terminal.
{not owen_ko and not office_card_obtained:
    I've told Owen you can have the spare for his office.
}
// PASS 4 fixes 6 and 12: outstanding flags, and urgency that matches the print.
{not all_flags_in():
    Stop him first. Then finish whatever you were doing on that research server. Your people will want all of it.
}
{
- torres_print_collected:
    You've got his print, then. Go.
- not vault_reader_seen:
    The data centre door reads his fingerprint. Something from his office will carry it.
- else:
    You'll need his print for that door. His office first.
}
Whatever you decide in front of him, ring me when it's done.
-> phone_significant_findings_choices

=== phone_significant_findings_choices ===
{patricia_ko: -> no_answer}
+ {found_door_log and not door_log_reasoned} [And the badge log. Look at the main-entrance times.]
    ~ door_log_reasoned = true
    ...Six minutes before her spare, every night. You did read it properly.
    -> phone_significant_findings_choices
+ [On my way.]
    #exit_conversation
    -> hub

=== phone_hold_him ===
{final_choice != "": -> hub}
#speaker:patricia_morgan
I know. Ring me when it's done.
-> phone_hold_him_choices

=== phone_hold_him_choices ===
+ [Understood.]
    #exit_conversation
    -> hub
