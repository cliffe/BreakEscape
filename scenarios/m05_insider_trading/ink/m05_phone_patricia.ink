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
// case is stated by the player (struggling run A, D3), not read back by her.
// ===========================================

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR patricia_ko = false
VAR patricia_phone_available = false
VAR torres_identified = false // Synced scenario global: Torres named on motive and exfil; also set by HaX (m05_phone_agent_0x99) and Patricia in person (m05_npc_patricia_morgan)
VAR final_choice = ""
VAR patricia_authorised_office = false // Synced scenario global: Owen may hand over Torres' office spare; also set by HaX (m05_phone_agent_0x99) and Patricia in person (m05_npc_patricia_morgan)
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
VAR patricia_authorised_server = false // Synced scenario global: Owen may give out the server-room password; also set by HaX (m05_phone_agent_0x99) and Patricia in person (m05_npc_patricia_morgan)
VAR torres_print_collected = false
VAR flag1_submitted = false
VAR flag2_submitted = false
VAR flag4_submitted = false
VAR torres_suspected = false // Synced scenario global: enough on Torres to search his office; also set by HaX (m05_phone_agent_0x99) and Patricia in person (m05_npc_patricia_morgan) and the case_motive/case_exfil mappings
VAR found_door_log = false
VAR found_halloran_alibi = false
VAR halloran_accused = false // Synced scenario global: Halloran suspended on the player's word; also set by HaX (m05_phone_agent_0x99) and Patricia in person (m05_npc_patricia_morgan)
VAR halloran_questioned = false
VAR door_log_reasoned = false // Synced scenario global: the player has read the badge-log pattern; also set by HaX (m05_phone_agent_0x99) and Patricia in person (m05_npc_patricia_morgan)
VAR it_notice_read = false
VAR door_log_reasoned_first = false // Synced scenario global (pass 5 R3-1): the front-door reason given in a reason menu, before the naming; set only in the *log_reason_right knots. The early-naming reward reads this, not door_log_reasoned
VAR owen_refused_password = false // Synced scenario global (pass 5 puzzle R1, P6): Owen has been asked for the server-room password and wanted a reason; set by Owen. Patricia's sign-off waits for it
VAR torres_reason_guessed = false // Synced scenario global (pass 5 R2 B2): a wrong reason or a wrong name was tried; also set by HaX and Patricia's phone/in person. Excludes the early-naming reward

=== function has_motive()
~ return found_medical_bills or found_torres_journal or found_vetting_file

=== function has_exfil()
// Post-engine follow-ups (2026-10-16, D1): the VM's flag-3 manifest now shows
// only badge #4471, so flag 3 counts only once the door log has tied that spare
// to his front-door swipe (door_log_reasoned): the deduction, not the VM, names him.
~ return found_manifest or found_upload_schedule or (flag3_submitted and door_log_reasoned)

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
// Puzzle R1 (P6): only once Owen has actually refused.
+ {(server_door_seen or it_notice_read) and owen_refused_password and not server_password_obtained and not patricia_authorised_server} [Owen won't give me the server-room password.]
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
// Struggling run A (D3, M3): a wrong name ends the call; her own facts.
+ {found_door_log} [Ben Ashworth.]
    ~ torres_reason_guessed = true
    Ben's on that log one night, at eight on a Thursday evening. The transfers I flagged run between two and four in the morning.
    Don't throw names at me. Ring back when you're sure.
    #exit_conversation
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
    // Puzzle R1 (P2): striking a cleared decoy is a guess too.
    ~ torres_reason_guessed = true
    Halloran was in Zurich the night that badge first went in. You've seen that.
    Don't throw names at me. Ring back when you're sure.
    #exit_conversation
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
// Struggling run A (D3): with both halves, the player states the case.
{has_motive() and has_exfil():
    {torres_reason_guessed:
        Again? Fine. I'm writing this down. Why him?
    - else:
        David. Slowly, I'm writing this down. Why?
    }
    -> phone_case_why
}
// PASS 5 R2 (B2): the retry is allowed, and noticed.
{torres_reason_guessed:
    Again? Fine. Convince me this time.
- else:
    David. Why?
}
-> phone_torres_why

// Round 3: the shared reason menu (see m05_npc_patricia_morgan.ink,
// torres_why). Choices-only; re-checks state for a re-navigation. A wrong
// reason ends the call.
=== phone_torres_why ===
{patricia_ko: -> no_answer}
{torres_identified: -> hub}
+ {found_door_log} [His own badge is on the server hallway those nights.]
    ~ torres_reason_guessed = true
    Read it again. His badge never touches the server hallway. Hers does.
    #exit_conversation
    -> hub
+ [He's been under strain. His wife's ill.]
    ~ torres_reason_guessed = true
    Half this building has someone ill at home. That's not evidence.
    #exit_conversation
    -> hub
+ {halloran_questioned} [Halloran puts him in her lab after hours, and the spare is the lab's.]
    Her word, about her own badge. It's enough to look, not to act.
    -> phone_partial_naming
+ {found_door_log} [His badge comes in the front door six minutes before her spare. Every night.]
    -> phone_log_reason_right
+ {has_motive()} [Money. He's hiding how much he owes.]
    That's why he might. It isn't proof that he did. Show me it leaving the building.
    -> phone_partial_naming
+ {has_exfil()} [The staging traces back to him.]
    That's how. I need why. People don't do this for nothing.
    -> phone_partial_naming
+ [He's the cryptography lead. He'd know how.]
    ~ torres_reason_guessed = true
    So would seven other people. That's not evidence either.
    #exit_conversation
    -> hub

=== phone_log_reason_right ===
{patricia_ko: -> no_answer}
#speaker:patricia_morgan
~ door_log_reasoned = true
~ door_log_reasoned_first = true
// Phase 4 dialogue C1 (D5-3): the player has said the pattern; she checks it.
...Every night. And Ruth's own badge never comes in after seven.
I sign that log off every Monday. I never once read the front door.
{halloran_accused:
    And Ruth's sitting in her lab, suspended on your word. That's on both of us now.
}
// D1 (2026-10-16): with flag 3 in, the pattern ties the manifest's badge 4471 to him.
{flag3_submitted:
    That's a pattern, and the portal manifest says that spare staged the package. Now I need a reason.
- else:
    That's a pattern. It's not a reason, and it's not proof the data's going anywhere.
}
-> phone_partial_naming

=== phone_partial_naming ===
~ torres_suspected = true
{not patricia_authorised_office and not office_card_obtained:
    ~ patricia_authorised_office = true
    It's enough to look in his office. I'll tell Owen you can have the spare.
}
-> hub

// Struggling run A (D3): the full case, stated by the player (see
// m05_npc_patricia_morgan.ink, case_why). Choices-only knots that re-check
// state for a re-navigation; a wrong answer ends the call.
=== phone_case_why ===
{patricia_ko: -> no_answer}
{torres_identified: -> hub}
+ [He's the cryptography lead. He'd know how.]
    ~ torres_reason_guessed = true
    That's how anyone on that team could. I asked why him.
    #exit_conversation
    -> hub
+ {found_medical_bills or found_vetting_file} [Money. His wife's treatment isn't covered, and he's borrowed against the house.]
    Money. All right. And the proof it's leaving?
    -> phone_case_proof
+ [He's been distracted for months.]
    ~ torres_reason_guessed = true
    So has half this building. That's a mood, not a motive.
    #exit_conversation
    -> hub
+ {found_torres_journal} [His own journal. He knows what it costs, and he's doing it anyway.]
    In his own hand. All right. And the proof it's leaving?
    -> phone_case_proof

=== phone_case_proof ===
{patricia_ko: -> no_answer}
{torres_identified: -> hub}
+ {found_door_log} [His own badge is on the server hallway those nights.]
    ~ torres_reason_guessed = true
    Read it again. His badge never touches the server hallway. Hers does.
    #exit_conversation
    -> hub
+ {flag3_submitted and found_door_log} [The portal's staging manifest. Badge 4471 staged it, and his swipe lets that spare in.]
    -> phone_significant_findings
+ {found_manifest} [The staging manifest in the data centre. "Staged by: D. Torres."]
    -> phone_significant_findings
+ [He's been in late, and nobody else has.]
    ~ torres_reason_guessed = true
    Late isn't leaving. I need the data going out, under his name.
    #exit_conversation
    -> hub
+ {found_upload_schedule} [The upload schedule. He's the operator, on site, tonight.]
    -> phone_significant_findings

=== phone_significant_findings ===
{torres_identified: -> hub}
#speaker:patricia_morgan
...Damn. His kids drew on the tablecloth at our Christmas party.
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
+ {found_door_log and not door_log_reasoned} [And the badge log. He comes in the front door six minutes before her spare.]
    ~ door_log_reasoned = true
    ...Every night. I sign that log off every Monday, and I never once read the front door.
    -> phone_significant_findings_choices
+ [On my way.]
    #exit_conversation
    -> hub

=== phone_hold_him ===
{final_choice != "": -> hub}
#speaker:patricia_morgan
I know. I'm watching his badge on the vault log. He hasn't moved.
Ring me when it's done.
-> phone_hold_him_choices

=== phone_hold_him_choices ===
+ [Understood.]
    #exit_conversation
    -> hub
