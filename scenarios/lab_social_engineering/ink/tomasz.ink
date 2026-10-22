// ================================================
// Phishing and Social Engineering lab: Tomasz (person, Blue Team Room)
// Ledgerwell's security lead — a team of one and a half. Polish British, mid
// thirties, dry and practical, no budget, glad of the test. He is the no-blame
// voice at the close. He sets the triage exercise, then gives the closing debrief
// once triage_pass and profile_done are both set (PLAN §5 stage 7 and "Closing
// debrief"). The debrief ends with #complete_task:closing_debrief and
// #exit_conversation, which completes the mission-conclusion aim.
//
// Branches use fixed strings only (no printed variables), because Tomasz is voiced
// (PLAN §6). The player is never named aloud. Person lines stay under 30 words.
// ================================================

VAR triage_pass = false
VAR profile_done = false
VAR triage_done = false
VAR dev_reported = false
VAR phish_pierce_attempts = 0
VAR pretext_service_desk_call_outcome = ""
VAR pretext_service_desk_call_lowest = 0

VAR met = false
VAR explained_own = false
VAR explained_dev = false
VAR quiet = false

=== start ===
{ met: -> hub }
~ met = true
Tomasz: You're the one giving me a headache this week. Good. I asked for it.
Tomasz: Tomasz. I run security here, me and half a person's budget.
{ triage_pass and profile_done:
    Tomasz: You've beaten me to both — the inbox triaged and the fixes picked. Keen. Sit down and we'll close this out.
- else:
    Tomasz: Two jobs for you. Triage that inbox at the workstation, then flip the board and pick the fixes.
}
~ quiet = true
-> hub

=== hub ===
{
- quiet:
    ~ quiet = false
- triage_pass and profile_done:
    Tomasz: Both done. Sit down, let's close this out.
- else:
    Tomasz: Come back when you've finished the exercise. Both halves.
}
+ {triage_pass and profile_done} [Debrief me.]
    -> debrief
+ {triage_done and not explained_own} [Two of those emails were mine.]
    -> own_mail
+ {not explained_dev} [Why does the service desk keep coming up?]
    -> dev_finding
+ [Remind me what SPF, DKIM and DMARC check.]
    Tomasz: SPF: was this server allowed to send for that domain. DKIM: did that domain sign it, unchanged.
    Tomasz: DMARC: does the From line match a domain that passed, and what to do if not. Ours says deliver anyway.
    ~ quiet = true
    -> hub
+ [Give me a minute.]
    #exit_conversation
    Tomasz: Take your time. I'm not going anywhere.
    -> hub

=== own_mail ===
~ explained_own = true
Tomasz: I wondered when you'd notice. Melanie's and Sofia's, straight out of your outbox.
Tomasz: Bit different reading them from this side, isn't it? The headers had you the whole time.
~ quiet = true
-> hub

=== dev_finding ===
~ explained_dev = true
Tomasz: Dev's good at his job. The policy let him hand that out, so the policy's the problem.
Tomasz: We're writing Dev a script, not a warning. Call back on a number we hold.
~ quiet = true
-> hub

=== debrief ===
Tomasz: Here's what it showed. An open inbox trusts anyone. A From line is just a label. And a padlock only means the line's private.
{ phish_pierce_attempts == 1:
    Tomasz: Melanie first try. A borrowed name gets past a lot of careful people.
}
{
- dev_reported:
    Tomasz: And Dev reported you. Credit to him — but a call-back rule would have caught it without him noticing a thing.
- pretext_service_desk_call_outcome == "got_it" and pretext_service_desk_call_lowest >= 0:
    Tomasz: Dev handed you the portal and the date, no fuss. A call-back to a number on file stops every line of that.
- pretext_service_desk_call_outcome == "got_it":
    Tomasz: You had to lean on Dev, but he still gave up the portal and the date. A call-back to a number on file stops every line of that.
- else:
    Tomasz: And Dev gave you enough to write Sofia's email. A call-back to a number on file stops every line of that.
}
Tomasz: So: DMARC to enforcement, a banner on outside mail, metadata stripped, a call-back script for the desk.
Tomasz: And a bookmarked portal with a report button, so anyone can check before they type a password.
Tomasz: If you could fix one thing here tomorrow, what would it be?
+ [A call-back rule on the service desk.]
    Tomasz: Cheapest fix on the list, and it would have stopped Sofia's whole chain. Good pick.
    -> debrief_close
+ [DMARC off p=none, and an external-sender banner.]
    Tomasz: That kills the Jed spoof outright. It takes a month of testing first, but yes.
    -> debrief_close
+ [A report button, so people tell us.]
    Tomasz: That's the one I'd pick. Everything else only works if people tell us when they've slipped.
    -> debrief_close

=== debrief_close ===
Tomasz: Whichever it is, the report names nobody. Blame them once and they stop telling us. Thanks for playing it straight.
#complete_task:closing_debrief
#exit_conversation
-> END
