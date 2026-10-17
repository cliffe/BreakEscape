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
// set on every exit. Struggling run A (D3): the full case is stated by the
// player in case_why and case_proof (she used to read it back from the finds). The vetting-file
// hand-over no longer says how many files point anywhere.
// ===========================================

VAR patricia_influence = 5            // 0-10 scale
VAR topic_investigation = false
VAR topic_suspects = false
VAR topic_company_politics = false
VAR gave_vetting_file = false
VAR first_meeting = true
VAR hub_quiet = false
VAR fate_noted = false   // Phase 4 dialogue C1 (D5-8): her reaction to Torres' fate, once
VAR proof_given = false  // Fixes round 3 (2026-10-17): the front-door reason completed the proof in log_reason_right, so case_why's right answer is the full naming

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR torres_identified = false // Synced scenario global: Torres named on motive and exfil; also set by HaX (m05_phone_agent_0x99) and Patricia's phone (m05_phone_patricia)
VAR patricia_authorised_office = false // Synced scenario global: Owen may hand over Torres' office spare; also set by HaX (m05_phone_agent_0x99) and Patricia's phone (m05_phone_patricia)
VAR office_card_obtained = false
VAR owen_ko = false
VAR found_medical_bills = false
VAR found_torres_journal = false
VAR found_vetting_file = false // Synced scenario global: also set by the vetting file's onRead; assigned at the hand-over (puzzle browser F2)
VAR found_pamphlet = false
VAR flag3_submitted = false
VAR flag4_submitted = false
VAR found_manifest = false
VAR found_upload_schedule = false
VAR found_stand_down_email = false
VAR server_door_seen = false
VAR server_password_obtained = false
VAR patricia_authorised_server = false // Synced scenario global: Owen may give out the server-room password; also set by HaX (m05_phone_agent_0x99) and Patricia's phone (m05_phone_patricia)
VAR vault_reader_seen = false
VAR torres_print_collected = false
VAR flag1_submitted = false
VAR flag2_submitted = false
VAR torres_suspected = false // Synced scenario global: enough on Torres to search his office; also set by HaX (m05_phone_agent_0x99) and Patricia's phone (m05_phone_patricia) and the case_motive/case_exfil mappings
VAR found_door_log = false
VAR found_halloran_alibi = false
VAR halloran_accused = false // Synced scenario global: Halloran suspended on the player's word; also set by HaX (m05_phone_agent_0x99) and Patricia's phone (m05_phone_patricia)
VAR halloran_questioned = false
VAR door_log_reasoned = false // Synced scenario global: the player has read the badge-log pattern; also set by HaX (m05_phone_agent_0x99) and Patricia's phone (m05_phone_patricia)
VAR it_notice_read = false
VAR door_log_reasoned_first = false // Synced scenario global (pass 5 R3-1): the front-door reason given in a reason menu, before the naming; set only in the *log_reason_right knots. The early-naming reward reads this, not door_log_reasoned
VAR owen_refused_password = false // Synced scenario global (pass 5 puzzle R1, P6): Owen has been asked for the server-room password and wanted a reason; set by Owen. Patricia's sign-off waits for it
VAR torres_reason_guessed = false // Synced scenario global (pass 5 R2 B2): a wrong reason or a wrong name was tried; also set by HaX and Patricia's phone/in person. Excludes the early-naming reward
VAR final_choice = "" // Synced scenario global: Torres' fate; set by m05_torres_confrontation and HaX's post-KO call. Read for her reaction (D5-8)

=== function has_motive()
~ return found_medical_bills or found_torres_journal or found_vetting_file

=== function has_exfil()
// Post-engine follow-ups (2026-10-16, D1): the VM's flag-3 manifest now shows
// only badge #4471, so flag 3 counts only once the door log has tied that spare
// to his front-door swipe (door_log_reasoned): the deduction, not the VM, names him.
~ return found_upload_schedule or ((flag3_submitted or found_manifest) and door_log_reasoned) // E9 (2026-10-17): the printed manifest shows badge #4471, not his name

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
    #influence_increased
    -> briefing_details

+ [Skip the pleasantries. What access can you give me?]
    ~ patricia_influence += 1
    #influence_increased
    Patricia Morgan: Direct. Good.
    -> provide_access

+ [I've been briefed. Quantum-safe keys, an inside job, and it ends tonight.]
    ~ patricia_influence += 2
    #influence_increased
    Patricia Morgan: Then we can skip a step.
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
    #influence_increased
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

// Blind run B (finding 5): the log on the desk was easy to leave behind.
Patricia Morgan: My log of what's been flagged is on the desk, by your hand. Read it before you go. Your who starts there.

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
// Phase 4 dialogue C1 (D5-8): after the fate, the first reopen notices it.
// (A reopened chat resumes here, not at start; fate_noted is an ink local,
// so it survives a reload.)
{
- hub_quiet:
    ~ hub_quiet = false
- final_choice != "" and not fate_noted:
    ~ fate_noted = true
    {
    - final_choice == "combat_nonlethal":
        Patricia Morgan: Ambulance is in the car park, and the police are with it. I'll go down with them.
    - final_choice == "arrest":
        Patricia Morgan: The police are with him now. I gave them the side door. Nobody in this building needs to watch.
    - final_choice == "public_exposure":
        Patricia Morgan: You let him walk out of my building. I hope you know what you've started.
    - final_choice == "combat_lethal":
        Patricia Morgan: Torres hasn't come up from the data centre. I'll go down myself once the CEO's off my phone.
    - else:
        Patricia Morgan: I'm told he's gone home. I'm told nothing else, and I'm not asking.
    }
- else:
    Patricia Morgan: {&What now?|Yes?|Quickly, now. The CEO's prowling.}
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

+ {torres_identified and final_choice == ""} [Anything else I should know before I go in?]
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
#influence_increased
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
    ~ patricia_influence += 1
    #influence_increased
    Patricia Morgan: I want it done properly. She wants it done quietly. Tonight we find out which of us wins.
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
    // Puzzle R2 (R2-1): suspicion counts too, so a VM-first player without
    // the picks has a motive source (the journal is in the locked briefcase).
    {not (found_door_log or halloran_questioned or torres_suspected):
        Patricia Morgan: Vetting files are restricted. Bring me a name or a pattern and I'll pull the ones that matter.
        -> hub
    }
    ~ gave_vetting_file = true
    ~ patricia_influence += 1
    #influence_increased
    #give_item:notes:torres_vetting_file
    #give_item:notes:halloran_vetting_file
    // Puzzle browser F2: the hand-over's onRead sets the global, but this
    // conversation's copy stays stale until it reopens; set it here so a
    // naming in the same conversation counts the motive.
    ~ found_vetting_file = true
    // Blind run B (findings 3 and 6): say what she hands over and what comes next.
    #speaker:narrator
    Narrator: She hands you two folders from the cabinet: vetting aftercare files, one on Ruth Halloran, one on David Torres.
    #speaker:patricia_morgan
    Patricia Morgan: Those are the two I'd have pulled anyway. That's as far as vetting lets me go.
    Patricia Morgan: Read them properly. Nobody's file is as tidy as it looks. Then come back with a name and a reason.
    -> hub

+ {torres_suspected and not patricia_authorised_office and not office_card_obtained} [I need into David Torres' office.]
    ~ patricia_authorised_office = true
    Patricia Morgan: Owen holds IT's spare for every office. I'll message him now. On my authority.
    Patricia Morgan: If this turns out to be nothing, it was a routine audit. Understood?
    -> hub

// Fixes round 3 (2026-10-17, blind B finding 2): before anyone is suspected,
// asking for an office spare here offered nothing. It now says what she
// needs and goes straight to the naming, which names nobody for the player.
+ {not torres_suspected and not torres_identified and not patricia_authorised_office and not office_card_obtained} [I need a look inside someone's office.]
    Patricia Morgan: Whose, and why? Give me a name I can defend and I'll message Owen for the spare.
    -> share_findings_who

// Puzzle R1 (P6): only once Owen has actually refused.
+ {(server_door_seen or it_notice_read) and owen_refused_password and not server_password_obtained and not patricia_authorised_server} [The server room wants a password Owen won't give me.]
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
// Struggling run A (D3, M3): a wrong name costs her trust and the conversation,
// and she gives her own facts rather than ones the player may not have seen.
+ {found_door_log} [Ben Ashworth.]
    ~ torres_reason_guessed = true
    ~ patricia_influence -= 1
    #influence_decreased
    Patricia Morgan: Ben's on that log one night, at eight on a Thursday evening. The transfers I flagged run between two and four in the morning.
    Patricia Morgan: Don't throw names at me. Come back when you're sure.
    -> reason_wrong
+ {found_door_log or torres_suspected or has_motive() or has_exfil()} [David Torres.]
    -> name_torres
+ [I've got a feeling. Nothing I can show you yet.]
    Patricia Morgan: So have I. That's why you're here. Come back with evidence.
    -> hub

=== accuse_halloran ===
#speaker:patricia_morgan
{found_halloran_alibi:
    // Puzzle R1 (P2): striking a cleared decoy is a guess too.
    ~ torres_reason_guessed = true
    ~ patricia_influence -= 1
    #influence_decreased
    Patricia Morgan: Halloran was in Zurich the night that badge first went in. You've seen that.
    Patricia Morgan: Don't throw names at me. Come back when you're sure.
    -> reason_wrong
}
Patricia Morgan: Ruth. Her spare, on the server hallway at two in the morning.
Patricia Morgan: I've waited three weeks to do something. All right. I'll suspend her access and keep her in the lab until the police can talk to her.
~ halloran_accused = true
~ patricia_influence -= 2
#influence_decreased
Patricia Morgan: If you're wrong, that's her career. And whoever it really is has just watched Security move.
~ hub_quiet = true
#exit_conversation
-> hub

=== name_torres ===
// PASS 5 R4-1: a person-chat closed on its choices re-runs this knot on reopen
// (person-chat-minigame.js:525-537); never after the naming.
{torres_identified: -> hub}
#speaker:patricia_morgan
// Struggling run A (D3): with both halves in hand, the player states the
// case (why, then proof); she no longer reads it back from what was found.
{has_motive() and has_exfil():
    {torres_reason_guessed:
        Patricia Morgan: Again? Fine. I'm writing this down. Why him?
    - else:
        Patricia Morgan: David. Slowly, I'm writing this down. Why?
    }
    -> case_why
}
// PASS 5 R2 (B2): the retry is allowed, and noticed.
{torres_reason_guessed:
    Patricia Morgan: Again? Fine. Convince me this time.
- else:
    Patricia Morgan: David. Why?
}
-> torres_why

// Round 3: one reason menu for every Torres naming without both halves.
// Documents sit on both sides (a log decoy), the right log reason isn't
// first, and a wrong reason ends the conversation (re-talk to try again).
=== torres_why ===
// PASS 5 R4-1: a person-chat closed on its choices re-runs this knot on reopen
// (person-chat-minigame.js:525-537); never after the naming.
{torres_identified: -> hub}
+ {found_door_log} [His own badge is on the server hallway those nights.]
    ~ patricia_influence -= 1
    #influence_decreased
    Patricia Morgan: Read it again. His badge never touches the server hallway. Hers does.
    -> reason_wrong
+ [He's been under strain. His wife's ill.]
    ~ patricia_influence -= 1
    #influence_decreased
    Patricia Morgan: Half this building has someone ill at home. That's not evidence.
    -> reason_wrong
+ {halloran_questioned} [Halloran puts him in her lab after hours, and the spare is the lab's.]
    Patricia Morgan: Her word, about her own badge. It's enough to look, not to act.
    -> partial_naming
+ {found_door_log} [His badge comes in the front door six minutes before her spare. Every night.]
    -> log_reason_right
+ {has_motive()} [Money. He's hiding how much he owes.]
    Patricia Morgan: That's why he might. It isn't proof that he did. Show me it leaving the building.
    -> partial_naming
+ {has_exfil()} [The staging traces back to him.]
    Patricia Morgan: That's how. I need why. People don't do this for nothing.
    -> partial_naming
+ [He's the cryptography lead. He'd know how.]
    ~ patricia_influence -= 1
    #influence_decreased
    Patricia Morgan: So would seven other people. That's not evidence either.
    -> reason_wrong

// The influence change and its tag sit above each wrong reply (D5-6).
=== reason_wrong ===
~ torres_reason_guessed = true
~ hub_quiet = true
#exit_conversation
-> hub

=== log_reason_right ===
// PASS 5 R4-1: a person-chat closed on its choices re-runs this knot on reopen
// (person-chat-minigame.js:525-537); never after the naming.
{torres_identified: -> hub}
#speaker:patricia_morgan
~ door_log_reasoned = true
~ door_log_reasoned_first = true
// Phase 4 dialogue C1 (D5-3): the player has said the pattern; she checks it
// and admits what she missed.
// Blind run A (2026-10-16, m9): the action is narration, not part of the spoken line.
#speaker:narrator
Narrator: She runs a finger down the sheet.
#speaker:patricia_morgan
Patricia Morgan: ...Every night. And Ruth's own badge never comes in after seven.
Patricia Morgan: I sign that log off every Monday. I never once read the front door.
{halloran_accused:
    Patricia Morgan: And Ruth's sitting in her lab, suspended on your word. That's on both of us now.
}
// Fixes round 3 (2026-10-17, blind B findings 3 and 4): she used to say "Now
// I need a reason" and then hand over the spare without asking for one, and
// the naming left identify_torres open. door_log_reasoned is now true, so if
// that completes the proof and the motive is in hand, she asks for the why
// here and a right answer is the full naming (case_why, proof_given).
// torres_suspected is set first, so a wrong why still leaves the office ask.
{has_motive() and has_exfil():
    ~ torres_suspected = true
    ~ proof_given = true
    Patricia Morgan: That's a pattern. Put it with the {found_upload_schedule:upload schedule|staging manifest} and it's proof. Now tell me why he'd do it.
    -> case_why
}
// D1 (2026-10-16): with flag 3 in, the pattern ties the manifest's badge 4471 to him.
{flag3_submitted or found_manifest or found_upload_schedule:
    Patricia Morgan: That's a pattern, and it ties him to the package. That's how. I still don't know why.
- else:
    Patricia Morgan: That's a pattern. It puts him at the door. It doesn't tell me why, and it doesn't show me the data leaving.
}
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

// Struggling run A (D3): the full case, stated by the player. Choices-only
// knots (a reopened chat re-runs the knot that owns the saved choice). Each
// menu has the true answers the player holds and two that aren't evidence;
// a wrong one costs her trust and ends the conversation, as in torres_why.
=== case_why ===
{torres_identified: -> hub}
+ [He's the cryptography lead. He'd know how.]
    ~ patricia_influence -= 1
    #influence_decreased
    Patricia Morgan: That's how anyone on that team could. I asked why him.
    -> reason_wrong
+ {found_medical_bills or found_vetting_file} [Money. His wife's treatment isn't covered, and he's borrowed against the house.]
    {proof_given:
        Patricia Morgan: Money. And you've shown me how. That's both.
        -> significant_reaction
    }
    Patricia Morgan: Money. All right. And the proof it's leaving?
    -> case_proof
+ [He's been distracted for months.]
    ~ patricia_influence -= 1
    #influence_decreased
    Patricia Morgan: So has half this building. That's a mood, not a motive.
    -> reason_wrong
+ {found_torres_journal} [His own journal. He knows what it costs, and he's doing it anyway.]
    {proof_given:
        Patricia Morgan: In his own hand. And you've shown me how. That's both.
        -> significant_reaction
    }
    Patricia Morgan: In his own hand. All right. And the proof it's leaving?
    -> case_proof

=== case_proof ===
{torres_identified: -> hub}
+ {found_door_log} [His own badge is on the server hallway those nights.]
    ~ patricia_influence -= 1
    #influence_decreased
    Patricia Morgan: Read it again. His badge never touches the server hallway. Hers does.
    -> reason_wrong
+ {(flag3_submitted or found_manifest) and found_door_log} [The staging manifest. Badge 4471 staged it, and his swipe lets that spare in.]
    -> significant_reaction
+ [He's been in late, and nobody else has.]
    ~ patricia_influence -= 1
    #influence_decreased
    Patricia Morgan: Late isn't leaving. I need the data going out, under his name.
    -> reason_wrong
+ {found_upload_schedule} [The upload schedule. He's the operator, on site, tonight.]
    -> significant_reaction

// Phase 4 dialogue C1 (D5-4): a player beat breaks the run and lands the
// Christmas-party line. A chat closed on these choices re-runs this knot, so
// it opens on her reaction rather than the whole summary.
=== significant_reaction ===
{torres_identified: -> hub}
#speaker:patricia_morgan
Patricia Morgan: ...Damn.
+ [You knew him.]
    Patricia Morgan: I sat three desks from him at the Christmas party. His kids drew on the tablecloth.
    -> significant_orders
+ [I'm sorry. He's one of yours.]
    Patricia Morgan: He's Ruth's. But I vetted him. His kids drew on the tablecloth at our Christmas party.
    -> significant_orders

=== significant_orders ===
{torres_identified: -> hub}
#speaker:patricia_morgan
{halloran_accused:
    Patricia Morgan: And I suspended Ruth on your say-so. I'll have her access back on tonight. You can do your own apologising.
}

~ patricia_influence += 2
#influence_increased
#complete_task:identify_torres
~ torres_identified = true
~ patricia_authorised_office = true
Patricia Morgan: Right. Your call from here.

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

// Blind run A (2026-10-16, m1): there's no "call Patricia" control; the arrest
// is a choice in the confrontation ("So Patricia's ringing them").
Patricia Morgan: When you've got him, keep him there and tell him the police are coming. I'll ring them. They get him, and your evidence, without your name on it.

Patricia Morgan: Be careful. He's never been cornered before, and nobody knows what he does then.
-> significant_close

=== significant_close ===
+ {found_door_log and not door_log_reasoned} [And the badge log. He comes in the front door six minutes before her spare.]
    ~ door_log_reasoned = true
    // C2 (D5C2-22): most full-case players reach the naming without the
    // reason menu, so the admission lives here too.
    Patricia Morgan: ...Every night. I sign that log off every Monday, and I never once read the front door.
    -> significant_close
+ [I'll stop him.]
    Patricia Morgan: Then go.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
+ [Whatever happens next is on me, not you.]
    Patricia Morgan: No. Some of it's on me. I let them stop me.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
