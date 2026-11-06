// ================================================
// Fixture B (draft): Priya Nair, security manager. Phone NPC in b_office's npcs.
// Indian-British, mid forties, Leicester. Brisk, fair, has done this before and
// hates guessing. She wants evidence, not a hunch.
//
// Plan: §4.9 (DL8: the HR cabinet code 7310 is said in an ungated line of the
// opening call), §7.5 (report hub, warned close), §9.1 "Verdict" and "Stakes".
// Phone ink: no self-prefix (dialoguelint phone-self-prefix); the resting knot
// holds choices only.
// Verdicts: #verdict:report:<suspect> (one choice per name), #verdict_close only in
// `send`, reached only through close_check, whose sibling choice starts "Not yet"
// (DL12). Nothing here may say or imply how many are guilty (DL10): no "the
// insider", no "one of them".
// After the tag, `send` reads the outcome globals on the next line (§5.3 timing;
// close() writes them synchronously at step 2). b_insider_named and b_wrong_name
// are set later, at the debrief's Finish, so they are read only on a later call.
// ================================================

VAR deduction_verdict_ded_b_okoro = ""
VAR deduction_verdict_ded_b_lindqvist = ""
VAR deduction_verdict_ded_b_haddad = ""
VAR deduction_verdict_ded_b_morgan = ""
VAR deduction_outcome_ded_b_okoro = ""
VAR deduction_outcome_ded_b_lindqvist = ""
VAR deduction_outcome_ded_b_haddad = ""
VAR deduction_outcome_ded_b_morgan = ""
VAR deduction_closed = false
VAR b_insider_named = false
VAR b_wrong_name = false
VAR b_badge_log_done = false
VAR b_heard_alarm = false
VAR se_intel_b_okoro_grievance = false
VAR se_intel_b_okoro_device = false
VAR briefed = false
VAR names_given = 0

=== start ===
{ deduction_closed:
    -> after_close
}
{ briefed:
    -> hub
}
~ briefed = true
Thanks for coming in. Here's where we are.
Just after two this morning the server room door alarm went off. By four, a copy of the payroll export was on a file-sharing site.
Four people on tonight's shift were here last night too.
Ngozi Okoro and Samira Haddad are in the office with you. Erik Lindqvist and Gwen Morgan are in the kitchen.
What I look for is all three together.
In the server room outside their role. A personal device on the staff network. A grievance this month.
Any one of those on its own is an ordinary week.
HR's cabinet code is 7310 if you need the files.
Talk to Tomás in the kitchen. He cleans every floor and misses nothing.
-> hub

=== hub ===
+ {not deduction_closed} [I'm ready to give you names.]
    -> report_hub
+ {not deduction_closed} [Remind me what you're looking for.]
    -> remind
+ {not deduction_closed} [Where should I look next?]
    -> next_step
+ {deduction_closed} [Anything else from your side?]
    -> after_close
+ [I'll call you back.]
    Fine. I'm at my desk.
    #exit_conversation
    -> hub

=== remind ===
All three together. In the server room when their job didn't need it.
Their own device on the staff network. A grievance in the last month.
Two out of three is a conversation with HR. Three out of three, I want to know.
-> hub

=== next_step ===
// Status answer: branches on what has changed, most advanced step first.
{
- b_badge_log_done:
    You've got the door log. If the network printout's still sitting in the server room, read it before you call this.
- b_heard_alarm:
    Sounds like you know about the alarm. Facilities change the server room code, so ask Erik for it.
- se_intel_b_okoro_grievance or se_intel_b_okoro_device:
    Tomás is talking, good. Ask him what he noticed last night. Then try the HR files.
- else:
    Start with Tomás in the kitchen. And the HR cabinet's in your room: 7310.
}
-> hub

// ---- The report (§7.5). One choice per name; each stands once given. ----
=== report_hub ===
{ names_given == 0:
    Who do you want me to look at? Name as many as the evidence supports. Names you give me stand.
- else:
    Anyone else?
}
+ {deduction_verdict_ded_b_okoro == ""} [Name Okoro. This can't be taken back.] -> name_okoro
+ {deduction_verdict_ded_b_lindqvist == ""} [Name Lindqvist. This can't be taken back.] -> name_lindqvist
+ {deduction_verdict_ded_b_haddad == ""} [Name Haddad. This can't be taken back.] -> name_haddad
+ {deduction_verdict_ded_b_morgan == ""} [Name Morgan. This can't be taken back.] -> name_morgan
+ [That's everyone] -> close_check
+ [Not yet, I want to check something] -> not_yet

=== not_yet ===
Take your time. Better slow than wrong.
-> hub

=== name_okoro ===
Ngozi Okoro. Noted. #verdict:report:ded_b_okoro
~ names_given += 1
-> report_hub

=== name_lindqvist ===
Erik Lindqvist. Noted. #verdict:report:ded_b_lindqvist
~ names_given += 1
-> report_hub

=== name_haddad ===
Samira Haddad. Noted. #verdict:report:ded_b_haddad
~ names_given += 1
-> report_hub

=== name_morgan ===
Gwen Morgan. Noted. #verdict:report:ded_b_morgan
~ names_given += 1
-> report_hub

=== close_check ===
// The warning, in her voice, with the obvious gaps named (§7.5 "Mention anything
// obvious left undone").
{ names_given == 0:
    You haven't given me anyone. That's a fair answer if the evidence says so.
}
{ not b_badge_log_done:
    You haven't been through the door log yet.
}
Anyone you haven't named is cleared, and the shift report goes up tonight. Sure?
+ [Yes, send it] -> send
+ [Not yet, I want to check something] -> not_yet

=== send ===
Done. I'll take it from here. #verdict_close
{
- deduction_outcome_ded_b_lindqvist == "wrong_guilty" or deduction_outcome_ded_b_haddad == "wrong_guilty" or deduction_outcome_ded_b_morgan == "wrong_guilty":
    I'll be honest, part of this doesn't sit right with me. Read the case notes before you go.
- deduction_outcome_ded_b_okoro == "missed_guilty":
    I'll go through it with fresh eyes in the morning. Read the case notes first.
- else:
    That squares with what I'd have looked for. Read the case notes before you go.
}
#exit_conversation
-> hub

=== after_close ===
{
- b_wrong_name:
    HR's asking me why some of these names are on the report. I'll answer that. Next time, check every name against all three.
- b_insider_named:
    Okoro's been stood down while HR and legal take it from here. Good work tonight.
- else:
    The report's gone up. If anything changes, I'll ring you.
}
-> hub
