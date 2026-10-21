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
// Ask ids: portal_name, payslip_date. Blanks: intern, team.
// Phone lines stay under 25 words; choice labels under 15 words.
// ================================================

EXTERNAL pretext_say(utterance_id)
EXTERNAL pretext_ask(ask_id)
VAR dev_influence = -10
VAR pretext_intern_name = ""
VAR pretext_intern_value = ""
VAR pretext_team_name = ""
VAR pretext_team_value = ""
VAR se_intel_lord_portal_name = false
VAR se_intel_lord_payslip_date = false

=== function pretext_say(utterance_id) ===
// Fallback only: a dry run or preload has no binding. The real binding judges the
// line, writes its influence entries and returns a band.
~ return 0

=== function pretext_ask(ask_id) ===
// Fallback only. The real binding returns 0 refused, 1 granted, 2 needs verification.
~ return 0

=== start ===
Dev: Service desk, Dev speaking. What can I do for you?
-> desk

=== desk ===
// The external call is inlined into the divert so the knot declares no temp twice.
+ [I'm helping {pretext_intern_name}, your new starter in {pretext_team_name}.]
    -> reaction(pretext_say("open_buddy"))
+ [Sorry, she's in {pretext_team_name} — I should have said.]
    -> reaction(pretext_say("repair_team"))
+ [She's a bit panicked, it's her first payslip.]
    -> reaction(pretext_say("urgent_payslip"))
+ [Her manager said you'd sort this for us.]
    -> reaction(pretext_say("name_drop_manager"))
+ { not se_intel_lord_portal_name } [What's the staff portal called, and how do its emails read?]
    -> ask_reaction(pretext_ask("portal_name"))
+ { not se_intel_lord_payslip_date } [And when do payslips actually go out this month?]
    -> ask_reaction(pretext_ask("payslip_date"))
+ [Thanks Dev, I'll ring back if she's still stuck.]
    Dev: Right you are. Cheers.
    -> END

=== reaction(band) ===
{ band >= 3:
    Dev: Tell you what, I'll check this with my manager and call you back. Cheers.
    -> END
}
{
- pretext_team_value == "finance":
    Dev: Finance, lovely. New intern — that'll be Sofia. What's she after?
- pretext_team_value == "accounts":
    Dev: Accounts? Hm. I don't have a new starter down for Accounts. Let me think.
- else:
    Dev: Right, bear with me a sec.
}
-> desk

=== ask_reaction(result) ===
{ result:
- 1: Dev: Course. It's the staff portal, notices come from the payroll address. There you go.
- 2: Dev: I'd just want to check her name on the new-starter list before I read that out.
- else: Dev: Ah, I can't give that out over the phone, sorry. Not without a check.
}
-> desk
