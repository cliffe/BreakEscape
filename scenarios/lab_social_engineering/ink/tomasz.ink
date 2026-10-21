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
VAR dev_reported = false
VAR phish_pierce_attempts = 0
VAR pretext_service_desk_call_outcome = ""

VAR met = false
VAR explained_own = false
VAR explained_dev = false
VAR quiet = false

=== start ===
{ met: -> hub }
~ met = true
Tomasz: You're the one giving me a headache this week. Good. I asked for it.
Tomasz: Tomasz. I run security here, me and half a person's budget.
Tomasz: Two jobs for you. Triage that inbox at the workstation, then flip the board and pick the fixes.
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
+ {not explained_own} [Some of these messages look familiar.]
    -> own_mail
+ {not explained_dev} [Why does the service desk keep coming up?]
    -> dev_finding
+ [Give me a minute.]
    #exit_conversation
    Tomasz: Take your time. I'm not going anywhere.
    -> hub

=== own_mail ===
~ explained_own = true
Tomasz: Two of those are yours. The ones you sent Melanie and Sofia, landing in my queue.
Tomasz: Mark them like any other. The header panel shows exactly why they were catchable.
~ quiet = true
-> hub

=== dev_finding ===
~ explained_dev = true
Tomasz: Dev's good at his job. The policy let him hand that out, so the policy's the problem.
Tomasz: We're writing Dev a script, not a warning. Call back on a number we hold.
~ quiet = true
-> hub

=== debrief ===
Tomasz: Here's what it showed. An open inbox trusts anyone, a From line is just a label, and a padlock proves nothing.
{ phish_pierce_attempts == 1:
    Tomasz: You landed Melanie first try. That's how good a borrowed name is — it beats careful people every time.
}
{
- dev_reported:
    Tomasz: And Dev reported you. Credit to him — but a call-back rule would have caught it without him noticing a thing.
- pretext_service_desk_call_outcome == "got_it":
    Tomasz: Dev handed you the portal and the date, no fuss. A call-back to a number on file stops every line of that.
}
Tomasz: So we route the open inbox through a gateway, strip document metadata, and give the desk that call-back script.
Tomasz: And the report. No names. Gareth reads it, nobody feels hunted, people keep telling us when they slip.
Tomasz: That last part is the whole job. Blame them once and they stop reporting. Thanks for playing it straight.
#complete_task:closing_debrief
#exit_conversation
-> END
