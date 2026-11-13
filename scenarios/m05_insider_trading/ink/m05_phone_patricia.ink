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
// - Phone-calls M5: the call-ending choices now reach DONE (#exit_conversation then -> DONE); the
//   engine moves the story to the home knot `start` after the call. `hub` and the phone_* knots stay
//   mid-call resting knots that never fall through to DONE on their own (lesson 21).
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
VAR proof_given = false // Fixes round 3 (2026-10-17): local; the front-door reason completed the proof in phone_log_reason_right, so phone_case_why's right answer is the naming
VAR topic_taken = false // Phone-calls M3: local; set true when a topic is taken on this call (reset at phone_call), so the hub's goodbye reads right after one
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
~ return found_upload_schedule or ((flag3_submitted or found_manifest) and door_log_reasoned) // E9 (2026-10-17): the printed manifest shows badge #4471, not his name

=== function all_flags_in()
~ return flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted

// Phone-calls M5 (Patricia callable). Patricia is a voiced callable contact now. The hub and the
// phone_* knots are reached only by the call knot `phone_call` (the `call` entry's knot, dialled by
// the green Call button / #place_call), gated by the entry's `when`
// (patricia_phone_available && !patricia_ko) and `unavailable: "no_answer"`. The whole conversation
// from `phone_call` through the phone_* knots is the voiced call; `start` stays a silent text stub.

=== start ===
// Home text stub (phone reopen rule). Opening the thread by hand only rests here; it never routes
// into a call knot as silent text. No NPC line: a preload would add an unread message.
+ [(Close.)]
    #exit_conversation
    -> start

// ===========================================
// CALL (the `call` entry's knot: phone_call)
// ===========================================
=== phone_call ===
// lint: call-knot
{patricia_ko: -> no_answer}
{not patricia_phone_available: -> not_yet}
// M3: reset the per-call "a topic was taken" flag (entered once per call, unlike hub).
~ topic_taken = false
#speaker:patricia_morgan
// M2: she answers before the menu, varied by state (three whole lines, not inline).
{
- torres_identified and final_choice == "":
    Morgan. Have you got him?
- final_choice != "":
    Morgan. I've been watching the vault log.
- else:
    Morgan.
}
-> hub

// Call fallbacks: Patricia becomes unreachable mid-call (the entry's `when` keeps her off the line
// otherwise). The old fake-ring choices are gone; the engine rings out via unavailable:"no_answer".
=== not_yet ===
// lint: call-knot
#exit_conversation
-> DONE

=== no_answer ===
// lint: call-knot
#exit_conversation
-> DONE

=== hub ===
// lint: call-knot
{patricia_ko: -> no_answer}
{not patricia_phone_available: -> not_yet}
#speaker:patricia_morgan
+ {not torres_identified} [I know who it is.]
    -> phone_share_findings
+ {torres_identified and final_choice == ""} [He's in the data centre.]
    -> phone_hold_him
+ {torres_suspected and not patricia_authorised_office and not office_card_obtained} [I need into David Torres' office.]
    ~ patricia_authorised_office = true
    ~ topic_taken = true
    I'll message Owen now. On my authority. If it's nothing, it was a routine audit.
    -> hub
// Puzzle R1 (P6): only once Owen has actually refused.
+ {(server_door_seen or it_notice_read) and owen_refused_password and not server_password_obtained and not patricia_authorised_server} [Owen won't give me the server-room password.]
    ~ patricia_authorised_server = true
    ~ topic_taken = true
    I sign the access log; IT holds the password. I'll tell Owen it's on my authority.
    -> hub
// M3: "Just checking in." fits only when no topic was taken on this call; otherwise a plain goodbye.
+ {not topic_taken} [Just checking in.]
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
    -> DONE
+ {topic_taken} [That's all for now.]
    Right.
    #exit_conversation
    -> DONE

=== phone_share_findings ===
// lint: call-knot
{torres_identified: -> hub}
#speaker:patricia_morgan
Go on, then. Who?
-> phone_who

=== phone_who ===
// lint: call-knot
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
    -> DONE
+ {found_door_log or torres_suspected or has_motive() or has_exfil()} [David Torres.]
    -> phone_name_torres
+ [I've got a feeling. Nothing I can show you yet.]
    So have I. Ring me back with evidence.
    #exit_conversation
    -> DONE

=== phone_accuse_halloran ===
// lint: call-knot
{patricia_ko: -> no_answer}
{halloran_accused or torres_identified: -> hub}
#speaker:patricia_morgan
{found_halloran_alibi:
    // Puzzle R1 (P2): striking a cleared decoy is a guess too.
    ~ torres_reason_guessed = true
    Halloran was in Zurich the night that badge first went in. You've seen that.
    Don't throw names at me. Ring back when you're sure.
    #exit_conversation
    -> DONE
}
Ruth. Her spare, at two in the morning. All right. I'll suspend her access and keep her in the lab for the police.
~ halloran_accused = true
If you're wrong, that's her career. And whoever it really is has just watched Security move.
#exit_conversation
-> DONE

=== phone_name_torres ===
// lint: call-knot
{patricia_ko: -> no_answer}
{torres_identified: -> hub}
#speaker:patricia_morgan
// Struggling run A (D3): with both halves, the player states the case.
{has_motive() and has_exfil():
    {torres_reason_guessed:
        Again? Fine. Convince me this time.
    - else:
        David. Why?
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
// lint: call-knot
{patricia_ko: -> no_answer}
{torres_identified: -> hub}
+ {found_door_log} [His own badge is on the server hallway those nights.]
    ~ torres_reason_guessed = true
    Read it again. His badge never touches the server hallway. Hers does.
    #exit_conversation
    -> DONE
+ [He's been under strain. His wife's ill.]
    ~ torres_reason_guessed = true
    Half this building has someone ill at home. That's not evidence.
    #exit_conversation
    -> DONE
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
    -> DONE

=== phone_log_reason_right ===
// lint: call-knot
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
// Fixes round 3 (2026-10-17, blind B findings 3 and 4): as in person
// (m05_npc_patricia_morgan.ink, log_reason_right). With the proof now complete
// and a motive in hand she asks for the why, and a right answer is the naming.
{has_motive() and has_exfil():
    ~ torres_suspected = true
    ~ proof_given = true
    {found_upload_schedule:
        That's a pattern. Put it with the upload schedule and it's proof. Now tell me why he'd do it.
    - else:
        That's a pattern. Put it with the staging manifest and it's proof. Now tell me why he'd do it.
    }
    -> phone_case_why
}
// D1 (2026-10-16): with flag 3 in, the pattern ties the manifest's badge 4471 to him.
{flag3_submitted or found_manifest or found_upload_schedule:
    That's a pattern, and it ties him to the package. That's how. I still don't know why.
- else:
    That's a pattern. It puts him at the door. It doesn't tell me why, and it doesn't show me the data leaving.
}
-> phone_partial_naming

=== phone_partial_naming ===
// lint: call-knot
~ torres_suspected = true
~ topic_taken = true
{not patricia_authorised_office and not office_card_obtained:
    ~ patricia_authorised_office = true
    It's enough to look in his office. I'll tell Owen you can have the spare.
}
-> hub

// Struggling run A (D3): the full case, stated by the player (see
// m05_npc_patricia_morgan.ink, case_why). Choices-only knots that re-check
// state for a re-navigation; a wrong answer ends the call.
=== phone_case_why ===
// lint: call-knot
{patricia_ko: -> no_answer}
{torres_identified: -> hub}
+ [He's the cryptography lead. He'd know how.]
    ~ torres_reason_guessed = true
    That's how anyone on that team could. I asked why him.
    #exit_conversation
    -> DONE
+ {found_medical_bills or found_vetting_file} [Money. His wife's treatment isn't covered, and he's borrowed against the house.]
    {proof_given:
        Money. And you've shown me how. That's both.
        -> phone_significant_findings
    }
    Money. All right. And the proof it's leaving?
    -> phone_case_proof
+ [He's been distracted for months.]
    ~ torres_reason_guessed = true
    So has half this building. That's a mood, not a motive.
    #exit_conversation
    -> DONE
+ {found_torres_journal} [His own journal. He knows what it costs, and he's doing it anyway.]
    {proof_given:
        In his own hand. And you've shown me how. That's both.
        -> phone_significant_findings
    }
    In his own hand. All right. And the proof it's leaving?
    -> phone_case_proof

=== phone_case_proof ===
// lint: call-knot
{patricia_ko: -> no_answer}
{torres_identified: -> hub}
+ {found_door_log} [His own badge is on the server hallway those nights.]
    ~ torres_reason_guessed = true
    Read it again. His badge never touches the server hallway. Hers does.
    #exit_conversation
    -> DONE
+ {(flag3_submitted or found_manifest) and found_door_log} [The staging manifest. Badge 4471 staged it, and his swipe lets that spare in.]
    -> phone_significant_findings
+ [He's been in late, and nobody else has.]
    ~ torres_reason_guessed = true
    Late isn't leaving. I need the data going out, under his name.
    #exit_conversation
    -> DONE
+ {found_upload_schedule} [The upload schedule. He's the operator, on site, tonight.]
    -> phone_significant_findings

=== phone_significant_findings ===
// lint: call-knot
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
// m6: the "finish the research server" sign-off is HaX's job and her texts say it, so it is cut here.
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
// lint: call-knot
{patricia_ko: -> no_answer}
+ {found_door_log and not door_log_reasoned} [And the badge log. He comes in the front door six minutes before her spare.]
    ~ door_log_reasoned = true
    ...Every night. And Ruth's own badge never comes in after seven.
    I sign that log off every Monday. I never once read the front door.
    -> phone_significant_findings_choices
+ [On my way.]
    #exit_conversation
    -> DONE

=== phone_hold_him ===
// lint: call-knot
{final_choice != "": -> hub}
#speaker:patricia_morgan
I know. I'm watching his badge. He hasn't moved.
I'll be on the vault log.
-> phone_hold_him_choices

=== phone_hold_him_choices ===
// lint: call-knot
+ [Understood.]
    #exit_conversation
    -> DONE
