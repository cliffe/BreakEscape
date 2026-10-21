// ================================================
// Phishing and Social Engineering lab: Ruth Adeyemi (person, Engagement Office)
// Ruth is the engagement lead and the start-room listener. This record carries:
//   - the opening briefing, played once on load through the record's
//     timedConversation (targetKnot "start", waitForEvent "game_loaded",
//     skipIfGlobal "briefing_heard", setGlobalOnStart "briefing_heard");
//   - the per-stage check-in hub;
//   - the three door-key hand-overs (#give_item), gated on the stage globals;
//   - a backup re-issue of #complete_task for every completing global already
//     true, so a student who worked out of order loses nothing (PLAN §4).
// Ruth's voice: the student's boss, who cares about the client and the sheet,
// never a quizmaster. UK English, plain words. Person lines stay under 30 words.
//
// Contract (PLAN §4, §5, §6; 10 §4 "Global variables"):
//   KEY ITEMS this ink hands over (P6-E must give Ruth these in itemsHeld,
//   type "key", with opens_lock/keyPins on each): recon_key, operations_key,
//   blue_team_key.
//   The eventMappings on Ruth's record (P6-E) do the live task completion;
//   the #complete_task tags below are only the out-of-order backup (PLAN §4).
// ================================================

// --- Synced scenario globals Ruth reads (declared in globalVariables by P6-E) ---
VAR roe_scope_done = false
VAR roe_stoprule_done = false
VAR roe_signed = false
VAR plan_objective_done = false
VAR plan_measures_done = false
VAR plan_done = false
VAR se_intel_email_pattern = false
VAR se_intel_username_convention = false
VAR target_ready_hampshire = false
VAR target_ready_pierce = false
VAR target_ready_lord = false
VAR osint_done = false
VAR acct_freemail = false
VAR phish_hampshire_landed = false
VAR phish_pierce_landed = false
VAR landing_payroll_login_built = false
VAR pretext_call_done = false
VAR phish_lord_landed = false
VAR report_results_done = false
VAR report_findings_done = false
VAR report_filed = false
VAR triage_pass = false
VAR profile_done = false

// --- Ink-local state (saved per record) ---
VAR greeted = false
VAR recon_key_given = false
VAR operations_key_given = false
VAR blue_team_key_given = false
VAR quiet = false

=== start ===
{ greeted: -> resume }
~ greeted = true
Ruth Adeyemi: Morning. Ruth Adeyemi, I run engagements here. You're on loan to me from Tarnside for this one. Grab the sheet.
Ruth Adeyemi: Ledgerwell's a small finance firm. Last quarter one of Gareth's team nearly wired a five-figure invoice to a spoofed supplier.
Ruth Adeyemi: He isn't angry at her. He's scared it happens for real. We find out how bad it would get, first.
Gareth Fairbairn: Before you start. This test of yours. Is it going to make my people look stupid?
+ [It's about the gaps in your process, not catching anyone out.]
    Gareth Fairbairn: Good answer. That's the only reason I signed.
    -> brief_close
+ [Don't worry, nobody will ever know it was them.]
    Ruth Adeyemi: Careful. That's the promise a bad report breaks. We name no one, ever.
    -> brief_close

=== brief_close ===
Ruth Adeyemi: Read the rules of engagement on the board. Properly. Gareth will be watching you do it.
-> resume

// Runs once per open: backup completions, then any key now due, then the hub.
=== resume ===
-> recheck

=== recheck ===
{ roe_scope_done:
    #complete_task:scope_cards
}
{ roe_stoprule_done:
    #complete_task:stop_rule
}
{ plan_objective_done:
    #complete_task:pick_objectives
}
{ plan_measures_done:
    #complete_task:pick_measures
}
{ se_intel_email_pattern:
    #complete_task:email_pattern_found
}
{ se_intel_username_convention:
    #complete_task:metadata_read
}
{ target_ready_hampshire:
    #complete_task:ready_hampshire
}
{ target_ready_pierce:
    #complete_task:ready_pierce
}
{ target_ready_lord:
    #complete_task:ready_lord
}
{ acct_freemail:
    #complete_task:test_account
}
{ phish_hampshire_landed:
    #complete_task:hampshire_landed
}
{ phish_pierce_landed:
    #complete_task:pierce_landed
}
{ landing_payroll_login_built:
    #complete_task:payroll_page_attached
}
{ pretext_call_done:
    #complete_task:call_dev
}
{ phish_lord_landed:
    #complete_task:lord_landed
}
{ report_results_done:
    #complete_task:results_reviewed
}
{ report_findings_done:
    #complete_task:findings_paired
}
{ triage_pass:
    #complete_task:triage_passed
}
{ profile_done:
    #complete_task:profile_done
}
-> keys

=== keys ===
{ plan_done and not recon_key_given:
    ~ recon_key_given = true
    #give_item:key:recon_key
    Ruth Adeyemi: Plan holds up. Here's the Recon Room key. Three people, public sources only.
}
{ osint_done and se_intel_username_convention and not operations_key_given:
    ~ operations_key_given = true
    #give_item:key:operations_key
    Ruth Adeyemi: Good. You know how their addresses are built and what they publish. Operations is yours.
}
{ report_filed and not blue_team_key_given:
    ~ blue_team_key_given = true
    #give_item:key:blue_team_key
    Ruth Adeyemi: Report's filed, and no names in it. Gareth will be glad. Blue Team key — go see Tomasz.
}
-> hub

=== hub ===
{
- quiet:
    ~ quiet = false
- not roe_signed:
    Ruth Adeyemi: The rules of engagement are on the board. Start there.
- not plan_done:
    Ruth Adeyemi: Now tell me what you'll actually do. The whiteboard.
- osint_done and se_intel_username_convention and operations_key_given and not phish_pierce_landed:
    Ruth Adeyemi: Mail's in Operations. Set up a throwaway address before you write to anyone.
- phish_pierce_landed and not (landing_payroll_login_built and pretext_call_done):
    Ruth Adeyemi: Sofia's the careful one. You'll want a look-alike page and a call to the service desk.
- (landing_payroll_login_built and pretext_call_done) and not phish_lord_landed:
    Ruth Adeyemi: You've got the page and the call. Now write to Sofia.
- phish_lord_landed and not report_filed:
    Ruth Adeyemi: That's the sending done. Write it up at the report desk. Processes, not people.
- report_filed and not (triage_pass and profile_done):
    Ruth Adeyemi: Tomasz has the other half of this for you, in the Blue Team room.
- else:
    Ruth Adeyemi: {&Need me?|Something else?|Still here. Good.}
}
+ {not roe_signed} [What am I actually allowed to do here?]
    -> topic_scope
+ {roe_signed and not plan_done} [What should I be measuring?]
    -> topic_plan
+ {plan_done and not (osint_done and se_intel_username_convention)} [What does the board want from me?]
    -> topic_recon
+ {operations_key_given and not phish_pierce_landed} [Why a throwaway address?]
    -> topic_account
+ {phish_pierce_landed and not phish_lord_landed} [How do I reach Sofia?]
    -> topic_hard
+ {phish_lord_landed and not report_filed} [What goes in the report?]
    -> topic_report
+ {report_filed} [Anything left?]
    -> topic_defend
+ [I'll get on.]
    #exit_conversation
    Ruth Adeyemi: Go on, then.
    -> hub

=== topic_scope ===
Ruth Adeyemi: Only what the sheet signs off. The same acts without it are offences, not tests.
Ruth Adeyemi: Sort the scope cards, answer the stop-rule, and Gareth signs.
~ quiet = true
-> hub

=== topic_plan ===
Ruth Adeyemi: Decide it before you send anything. And measure the process, not which person fell for it.
Ruth Adeyemi: Name a staff member in a success measure and you've already broken Gareth's one rule.
~ quiet = true
-> hub

=== topic_recon ===
Ruth Adeyemi: Fill the three cards from public sources. The "Missing" rows tell you where to look.
Ruth Adeyemi: And read the published PDF's properties — who made it, and how. That's the username pattern.
~ quiet = true
-> hub

=== topic_account ===
Ruth Adeyemi: So nothing you send comes back to Tarnside. Create the address in the mail client first.
Ruth Adeyemi: Chris's careers inbox takes anything. Melanie's trickier — borrow a name she already trusts.
~ quiet = true
-> hub

=== topic_hard ===
Ruth Adeyemi: Sofia checks things. You need a page that looks like her portal, and the call to make it read right.
Ruth Adeyemi: The service desk phone is on the Operations desk. Either order's fine.
~ quiet = true
-> hub

=== topic_report ===
Ruth Adeyemi: The results, then a cause and a control for each finding. No names, no blame.
Ruth Adeyemi: Blaming staff just teaches them to stop reporting. Write the fix, not the person.
~ quiet = true
-> hub

=== topic_defend ===
Ruth Adeyemi: Tomasz is running the defender side next door. Triage the inbox, then the mitigations.
Ruth Adeyemi: He'll close it out with you once both are done.
~ quiet = true
-> hub
