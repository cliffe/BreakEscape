// IT service line (it_line): the helpdesk's third route (A23), a pretext phone call.
// The ask carries helpdesk:call_desk; on a granted ask the browser opens call_desk's form.
// call_desk uses verify:callback, so the grant turns on holding the owner's phone, not on this call.
VAR it_line_influence = 0
EXTERNAL pretext_ask(ask_id)

=== function pretext_ask(ask_id) ===
// Fallback only: a dry run or preload has no binding. The real binding returns 0 refused, 1 granted, 2 needs checking.
~ return 0

=== start ===
IT service line, you're through to the desk.
-> desk

=== desk ===
+ [Ask them to move an account's approvals to your phone]
    -> ask_reaction(pretext_ask("reset_request"))
+ [Hang up] #exit_conversation
    -> END

=== ask_reaction(result) ===
{ result == 1:
    One moment. We ring the number we hold for that account to check it's them.
    That came back fine. Fill in the form and it's done.
- else:
    I can't do that one over the phone.
}
-> desk
