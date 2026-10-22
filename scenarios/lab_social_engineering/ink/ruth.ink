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
VAR fairbairn_condition_heard = false
VAR fairbairn_payoff_heard = false
VAR acct_freemail = false
VAR phish_hampshire_landed = false
VAR phish_pierce_landed = false
VAR landing_payroll_login_built = false
VAR pretext_call_done = false
VAR pretext_call_reported = false
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
{ greeted: -> hub }
~ greeted = true
Ruth Adeyemi: Morning. Ruth Adeyemi, I'm leading the Ledgerwell job and you're with me today.
Ruth Adeyemi: Ledgerwell's a small finance firm. Last quarter one of Gareth's team nearly wired a five-figure invoice to a spoofed supplier.
Ruth Adeyemi: He isn't angry at her. He's scared the next one gets through. We find out how far it would get before a real one does.
Gareth Fairbairn: Before you start. This test of yours. Is it going to make my people look stupid?
+ [It's about the gaps in your process, not catching anyone out.]
    Gareth Fairbairn: Good answer. Show me you've read that sheet properly and I'll put my name to it.
    -> brief_close
+ [Don't worry, nobody will ever know it was them.]
    Ruth Adeyemi: Careful. We can't promise nobody finds out. Logs exist. We can promise the report blames no one.
    Gareth Fairbairn: Then promise me that one.
    -> brief_close

=== brief_close ===
Ruth Adeyemi: Read the rules of engagement on the board. Properly. Gareth will be watching you do it.
~ quiet = true
-> hub

// recheck and keys run on every entry to hub (as tunnels), so a reopen that the
// engine resumes at `hub` still completes any backup task and hands over any key
// now due. Both are idempotent: completeTask ignores a done task, and each key is
// guarded by its own once-flag, so re-running them on every hub loop is safe (B1).
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
->->

=== keys ===
{ plan_done and not recon_key_given:
    ~ recon_key_given = true
    #give_item:key:recon_key
    Ruth Adeyemi: Plan holds up. Here's the Recon key. Open-source intelligence only: what anyone could find, nothing behind a login.
    ~ quiet = true
}
{ osint_done and se_intel_username_convention and not operations_key_given:
    ~ operations_key_given = true
    #give_item:key:operations_key
    Ruth Adeyemi: Good. Everything you've got there was public. That's a finding before we've sent a thing. Operations is yours.
}
{ report_filed and not blue_team_key_given:
    ~ blue_team_key_given = true
    #give_item:key:blue_team_key
    { fairbairn_payoff_heard:
        Ruth Adeyemi: Report's filed, and Gareth's read it. The Blue Team room next: Tomasz has the other half.
    - else:
        Ruth Adeyemi: Report's filed. Gareth's reading it now, so go and see him. Then the Blue Team room: Tomasz has the other half.
    }
    ~ quiet = true
}
->->

=== hub ===
-> recheck ->
-> keys ->
{
- quiet:
    ~ quiet = false
- not roe_signed:
    Ruth Adeyemi: The rules of engagement are on the board. Start there.
- not plan_done and not fairbairn_condition_heard:
    Ruth Adeyemi: Sheet's done. Take it to Gareth by the window. He wants to sign it himself.
- not plan_done:
    Ruth Adeyemi: Now tell me what you'll actually do. The whiteboard.
- plan_done and not (osint_done and se_intel_username_convention):
    Ruth Adeyemi: Recon's through the west door. Public pages only. If you'd need a password to see it, it's off the sheet.
- operations_key_given and not acct_freemail:
    Ruth Adeyemi: Mail's in Operations. Make your throwaway address before you write to anyone.
- operations_key_given and not phish_pierce_landed:
    Ruth Adeyemi: Delivered isn't landed. It lands when they'd open the file or click the link, the way they would a real one.
- pretext_call_reported and not pretext_call_done:
    Ruth Adeyemi: Dev's manager rang Gareth about a dodgy call. Gareth promised to look into it, with a straight face. Give the desk a while to calm down.
- phish_pierce_landed and not (landing_payroll_login_built and pretext_call_done):
    Ruth Adeyemi: Sofia's the careful one. You'll want a look-alike page and a call to the service desk.
- (landing_payroll_login_built and pretext_call_done) and not phish_lord_landed:
    Ruth Adeyemi: You've got the page and the call. Now write to Sofia.
- phish_lord_landed and not report_filed:
    Ruth Adeyemi: Sofia checked the sender, the portal's name and the date. All three were right. Her own service desk gave us all three. That's your finding.
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
Ruth Adeyemi: Only what that sheet signs off. If something isn't on it, ask me before you try it.
Ruth Adeyemi: Sort the scope cards, answer the stop-rule, and Gareth signs.
~ quiet = true
-> hub

=== topic_plan ===
Ruth Adeyemi: Decide that before you send a thing. Count how far each attempt got. Who fell for it is the one thing we never count.
~ quiet = true
-> hub

=== topic_recon ===
Ruth Adeyemi: Fill the three cards from public sources. The "Missing" rows tell you where to look.
Ruth Adeyemi: And open the published PDF's properties. The author field shows how usernames are built.
~ quiet = true
-> hub

=== topic_account ===
Ruth Adeyemi: Real applicants write from webmail, so a throwaway address looks like one and passes every check. It's still logged against the job.
Ruth Adeyemi: Chris's careers inbox takes anything. Melanie's trickier — you'll have to work out what gets past her.
~ quiet = true
-> hub

=== topic_hard ===
Ruth Adeyemi: Sofia checks things. You need a page like her portal, and a pretext call to fill the gaps.
Ruth Adeyemi: Ring the desk as her buddy. Know her name and team before you dial. Push too hard and Dev flags you to his manager.
~ quiet = true
-> hub

=== topic_report ===
Ruth Adeyemi: The results, then a cause and a control for each finding. No names, no blame.
Ruth Adeyemi: Write each one so the person it happened to could read it. Name the gap and how to close it.
~ quiet = true
-> hub

=== topic_defend ===
Ruth Adeyemi: Tomasz is running the defender side next door. Triage the inbox, then the mitigations.
Ruth Adeyemi: He'll close it out with you once both are done.
~ quiet = true
-> hub
