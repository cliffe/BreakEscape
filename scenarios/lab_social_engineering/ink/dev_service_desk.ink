// ================================================
// Phishing and Social Engineering lab: Dev on the service desk (phone pretext)
// Dev (character id `dev`, record `dev_service_desk`), Ledgerwell's service desk.
// British Indian, early forties, Midlands English, bright and chatty — the
// friendliest voice in the building. He is good at his job; the policy is what's
// weak (PLAN §3 "Guards against stereotype"). Reached from the desk phone object
// (callId service_desk_call). pretext-prep opens phone-chat here; person-chat-
// pretext binds the real pretext_say / pretext_ask and the influence write path.
// The fallbacks below let the story load unbound on a preload, a bark or a dry
// run (00 S1; an unbound EXTERNAL throws on the first Continue()).
//
// Contract: 00 §8, 06 §4.8. Call knots use sticky + choices only (06 N12). The
// JSON (social.pretextNpcs, authored by P6-E) owns the line ids, the ask grants
// and the tells; this ink only speaks Dev's side and routes on the band / result.
// Say ids: open_buddy, repair_team, urgent_payslip, name_drop_manager.
// Ask ids: portal_name, payslip_date (both need the intern check, design C1 m5). Blanks: intern, team.
// Phone lines stay under 25 words; choice labels under 15 words.
// ================================================

EXTERNAL pretext_say(utterance_id)
EXTERNAL pretext_ask(ask_id)
VAR dev_influence = 0
VAR pretext_intern_name = ""
VAR pretext_intern_value = ""
VAR pretext_team_name = ""
VAR pretext_team_value = ""
VAR se_intel_lord_portal_name = false
VAR se_intel_lord_payslip_date = false
VAR team_checked = false
// Set once the Accounts slip is corrected this call: the repair is offered once, and the
// opener (which still says Accounts) leaves the menu with it (lab R14 M1). Reset per call.
VAR team_repaired = false

=== function pretext_say(utterance_id) ===
// Fallback only: a dry run or preload has no binding. The real binding judges the
// line, writes its influence entries and returns a band.
~ return 0

=== function pretext_ask(ask_id) ===
// Fallback only. The real binding returns 0 refused, 1 granted, 2 needs verification.
~ return 0

=== start ===
// Per-call state (06 "Calling again"): a fresh call restarts here (restartAfterEnd
// -> start), so reset the team acknowledgement, or the second call opens silently
// because team_checked carried over from the first (lab R4 D4). A mid-call reload
// resumes at the open choices, not here, so its state is preserved. Influence is
// reset separately by person-chat-pretext's new_call.
~ team_checked = false
~ team_repaired = false
Service desk, Dev speaking. What can I do for you?
-> desk

=== desk ===
// The external call is inlined into the divert so the knot declares no temp twice.
// Each reaction is passed the say id as well as the band, so Dev answers the technique
// (urgency, borrowed authority) and the band (wary, refusing) in his own voice, not with
// one stock team line each turn (item 7). The team acknowledgement shows once (team_checked).
// The opener speaks only the facts the card carried: each fact fills independently, so a
// player who prepared only the name, or only the team, still has an opener, and it leaves
// out what they don't have (lab post-release M2). pretext-judge skips the empty blank's
// claim, so the call stays fair. The guards test the _name VAR and the judge's claimUnstated
// tests the _value VAR, but they mean the same thing: fillPretextVars (person-chat-pretext,
// from pretext-card) writes a fact's _name and _value together, so a blank the card did not
// carry has both empty and one the card carried has both set. "Shown here" and "judged" are
// therefore the same fact (lab post-release m2). The _name == "" guards also double as the
// validator's blank-omission exemption and as the 1299b48d9 resume fix: a reload with empty
// re-picks keeps the saved blanks, and the variant for what survived still shows.
+ { not team_repaired and not team_checked and pretext_intern_name != "" and pretext_team_name != "" } [I'm helping {pretext_intern_name}, your new starter in {pretext_team_name}.]
    -> reaction(pretext_say("open_buddy"), "open_buddy")
+ { not team_repaired and not team_checked and pretext_intern_name != "" and pretext_team_name == "" } [I'm helping {pretext_intern_name}, one of your new starters.]
    -> reaction(pretext_say("open_buddy"), "open_buddy")
+ { not team_repaired and not team_checked and pretext_intern_name == "" and pretext_team_name != "" } [I'm helping a new starter in your {pretext_team_name} team.]
    -> reaction(pretext_say("open_buddy"), "open_buddy")
+ { team_checked and pretext_team_value == "accounts" and not team_repaired } [Sorry, my mistake. She's in Finance.]
    ~ team_repaired = true
    -> reaction(pretext_say("repair_team"), "repair_team")
+ [She's a bit panicked, it's her first payslip.]
    -> reaction(pretext_say("urgent_payslip"), "urgent_payslip")
+ [Her manager said you'd sort this for us.]
    -> reaction(pretext_say("name_drop_manager"), "name_drop_manager")
+ { not se_intel_lord_portal_name } [What's the payslip portal called, and who do its emails come from?]
    -> ask_reaction("portal_name", pretext_ask("portal_name"))
+ { not se_intel_lord_payslip_date } [And when do payslips actually go out this month?]
    -> ask_reaction("payslip_date", pretext_ask("payslip_date"))
+ [Thanks Dev, I'll ring back if she's still stuck.]
    Right you are. Cheers.
    -> END

=== reaction(band, said) ===
// band 3 (reported) ends the call with no line here: the lockout's endConversation closes
// it and the outcome's authored goodbye is spoken on finalise (item 35), so printing one
// here would double it.
{ band >= 3:
    -> END
}
{ band == 2:
    Look, I'm not doing anything else on this call without checking who you are.
    -> desk
}
{ band == 1:
    { said == "urgent_payslip" or said == "name_drop_manager":
        Okay, slow down a sec. I still need to check who she is.
        -> desk
    }
    Okay. Slow down a sec for me.
}
{ said == "urgent_payslip":
    Aw, first payslip's always a faff. She'll be fine, they're never late.
    -> desk
}
{ said == "name_drop_manager":
    Did they? Nobody's told me. I still go by the list, mind.
    -> desk
}
{ said == "repair_team":
    // Same as M1 on the opener: only name Sofia if the player actually stated the
    // intern. A team-only Accounts player repairs to Finance with the name blank empty,
    // so naming her here would have Dev supply a fact the player never gave (lab
    // post-release M1, R2). Fall to the generic voiced line. The judge's +20 and the
    // on-screen "Corrected" tell still fire, so the candour correction still lands.
    { pretext_intern_name != "":
        Finance, right you are. New intern, that'll be Sofia then. What's she after?
    - else:
        Right, bear with me a sec.
    }
    -> desk
}
{ not team_checked:
    ~ team_checked = true
    { pretext_team_value:
    - "finance":
        // Only name Sofia if the player actually stated the intern. On the team-only
        // opener the name blank is empty, so naming her here would have Dev supply a
        // fact the player never gave, then the asks still come back wanting her name
        // (lab post-release M1). Fall to the generic voiced line instead.
        { pretext_intern_name != "":
            Finance, lovely. New intern, that'll be Sofia. What's she after?
        - else:
            Right, bear with me a sec.
        }
    - "accounts": Accounts? We folded Accounts into Finance a couple of years back. What's she after?
    - else: Right, bear with me a sec.
    }
}
-> desk

=== ask_reaction(ask_id, result) ===
{ result:
- 1:
    { ask_id == "payslip_date":
        Monday the 6th. Tell her not to spend it all at once.
    - else:
        Course. It's LedgerPay. Notices come from payroll-notices at our domain, same as every month. There you go.
    }
- 2:
    { ask_id == "payslip_date":
        Before I read a date out, I'd check her against the new-starter list. Give me her name and I'll have a look.
    - else:
        Happy to, but who's she? I check the new-starter list before I give out system details. Her name?
    }
- else:
    Ah, I can't give that out over the phone, sorry. Not without a check.
}
-> desk
