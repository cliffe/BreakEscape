// ================================================
// Phishing and Social Engineering lab: Tomasz (person, Blue Team Room)
// Ledgerwell's security lead — a team of one and a half. Polish British, mid
// thirties, dry and practical, no budget, glad of the test. He is the no-blame
// voice at the close. He sets the triage exercise, then gives the closing debrief
// once triage_pass and profile_done are both set (PLAN §5 stage 7 and "Closing
// debrief"). "Debrief me" first goes through debrief_confirm, the point-of-no-
// return warning. The debrief ends with #set_global:engagement_closed,
// #complete_task:closing_debrief and #exit_conversation, which completes the
// mission-conclusion aim; the scenario's music event on conversation_closed:tomasz
// (guarded on engagement_closed) then rolls the credits.
//
// Branches use fixed strings only (no printed variables), because Tomasz is voiced
// (PLAN §6). The player is never named aloud. Person lines stay under 30 words.
// ================================================

VAR triage_pass = false
VAR profile_done = false
VAR triage_done = false
VAR dev_reported = false
VAR fairbairn_payoff_heard = false
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
{
- triage_pass and profile_done and not fairbairn_payoff_heard:
    Tomasz: You've beaten me to both. Gareth's been asking after you. See him first if you like, then we'll close this out.
- triage_pass and profile_done:
    Tomasz: You've beaten me to both — the inbox triaged and the fixes picked. Keen. Sit down and we'll close this out.
- else:
    Tomasz: Two jobs for you. Triage that inbox at the workstation, then pick the fixes on the SOC board.
}
~ quiet = true
-> hub

=== hub ===
{
- quiet:
    ~ quiet = false
- triage_pass and profile_done and not fairbairn_payoff_heard:
    Tomasz: Both done. Gareth's been asking after you. See him first if you like, then we'll close this out.
- triage_pass and profile_done:
    Tomasz: Both done. Sit down, let's close this out.
- triage_pass:
    Tomasz: Inbox done. The SOC board's the other half.
- profile_done:
    Tomasz: Fixes picked. Now the inbox.
- else:
    Tomasz: Come back when you've finished the exercise. Both halves.
}
+ {triage_pass and profile_done} [Debrief me.]
    -> debrief_confirm
+ {triage_done and not explained_own} [Two of those emails were mine.]
    -> own_mail
+ {not explained_dev} [Dev on the service desk — what's the gap?]
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

// Point of no return (user rule: warn before the ending, offer a way back).
// The debrief ends in the credits, so the player gets one chance to go and
// finish anything first. "Not yet" returns to the hub; the debrief is still
// there whenever they come back.
=== debrief_confirm ===
Tomasz: Once we start, that's the engagement closed. Report goes to Gareth and nobody sends anything else.
{ not fairbairn_payoff_heard:
    Tomasz: Gareth still wants a word, by the way. Anything left to do, do it first.
- else:
    Tomasz: Anything left to do, do it first.
}
+ [Go ahead. Close it out.]
    -> debrief
+ [Not yet, I want to finish something.]
    Tomasz: Fine. I'll be here.
    ~ quiet = true
    -> hub

=== debrief ===
Tomasz: Here's what it showed. An open inbox trusts anyone, a From line is just a label, and a padlock only tells you nobody's listening in.
{ phish_pierce_attempts == 1:
    Tomasz: Melanie first try. A borrowed name gets past a lot of careful people.
}
{
- dev_reported and pretext_service_desk_call_outcome == "got_it":
    Tomasz: Dev reported one of your calls — credit to him — but you rang back and still got what you needed. A call-back rule to a number on file stops both.
- dev_reported:
    Tomasz: Dev gave you what Sofia's email needed, and he reported a call too. Credit for that, but a call-back rule stops it without him noticing a thing.
- pretext_service_desk_call_outcome == "got_it" and pretext_service_desk_call_lowest >= 0:
    Tomasz: Dev handed you the portal and the date. A call-back to a number on file stops every line of that.
- pretext_service_desk_call_outcome == "got_it":
    Tomasz: You had to lean on Dev, but he still gave up the portal and the date. A call-back to a number on file stops every line of that.
- else:
    Tomasz: And Dev gave you enough to write Sofia's email. A call-back to a number on file stops every line of that.
}
Tomasz: That report's got three fixes in it. I'll get budget for one this year, if I'm lucky. Which would you pick?
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
Tomasz: Gareth wanted your whole report pinned up in the kitchen. I've talked him down to the executive summary. Thanks for playing it straight.
#set_global:engagement_closed:true
#complete_task:closing_debrief
#exit_conversation
-> END
