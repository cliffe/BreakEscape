// ================================================
// Awareness E3, full episode: Leila Nassar on the IT service desk (phone pretext)
// Leila (character id `leila`, record `leila_servicedesk`), Quayholt's service
// desk. The learner, posing as a locked-out Gordon McLeish, rings her to talk
// her into a password reset. pretext-prep opens phone-chat here; person-chat-
// pretext binds the real pretext_say / pretext_ask and the influence write path.
// The fallbacks below let the story load unbound on a preload or a dry run.
//
// Contract: 00 §8, 06 §4.8. Call knots use sticky choices (06 N12). The JSON
// (social.pretextNpcs quayholt_helpdesk_reset) owns the line ids, the ask grant
// and the tells; this ink only speaks Leila's side and routes on band / result.
// Say ids: open_locked_out, give_manager, give_staffid, name_drop_director,
// cant_callback, skip_verification. Ask ids: reset_password.
// Blanks: who, team, manager, staffId.
// ================================================

EXTERNAL pretext_say(utterance_id)
EXTERNAL pretext_ask(ask_id)
VAR leila_influence = 0
VAR pretext_who_name = ""
VAR pretext_who_value = ""
VAR pretext_team_name = ""
VAR pretext_team_value = ""
VAR pretext_manager_name = ""
VAR pretext_manager_value = ""
VAR pretext_staffId_name = ""
VAR pretext_staffId_value = ""
// Intel-fact globals (se_intel_<id>), set true when the fact is found in OSINT and bridged in
// from scenario globals. The fact-bearing say lines are gated on them so a line that names a
// found detail is never offered before the detail is found (P3 N15; matches social.pretextNpcs
// lines[*].requires). The name-drop line needs the Head of Claims found (quayholt_claims_head)
// and the callback line needs Gordon's absence found (quayholt_gordon_away), matching their
// lines[*].requires so the call menu and the prep card offer the same lines (P5-7). Only
// skip_verification names no found fact and is always offered.
VAR se_intel_quayholt_claims_manager = false
VAR se_intel_quayholt_claims_head = false
VAR se_intel_quayholt_staff_number = false
VAR se_intel_quayholt_gordon_away = false

=== function pretext_say(utterance_id) ===
// Fallback only: a dry run or preload has no binding. The real binding judges the
// line, writes its influence entries and returns a band.
~ return 0

=== function pretext_ask(ask_id) ===
// Fallback only. The real binding returns 0 refused, 1 granted, 2 needs verification.
~ return 0

=== start ===
IT service desk, Leila speaking. How can I help?
-> desk

=== desk ===
+ { se_intel_quayholt_claims_manager and pretext_who_name != "" and pretext_team_name != "" } [Morning, it's {pretext_who_name} in {pretext_team_name}, I'm locked out of my account.]
    -> reaction(pretext_say("open_locked_out"), "open_locked_out")
+ { se_intel_quayholt_claims_head and pretext_manager_name != "" } [My manager's {pretext_manager_name}, she'll vouch for me.]
    -> reaction(pretext_say("give_manager"), "give_manager")
+ { se_intel_quayholt_staff_number and pretext_staffId_name != "" } [My staff reference is {pretext_staffId_name}.]
    -> reaction(pretext_say("give_staffid"), "give_staffid")
+ { se_intel_quayholt_claims_head } [The Head of Claims needs me back online for a hearing this morning.]
    -> reaction(pretext_say("name_drop_director"), "name_drop_director")
+ { se_intel_quayholt_gordon_away } [I'm away from my desk phone — can you just do it now, not a callback?]
    -> reaction(pretext_say("cant_callback"), "cant_callback")
+ [Honestly, skip the security questions, I really don't have time for this.]
    -> reaction(pretext_say("skip_verification"), "skip_verification")
+ [Can you reset my password now?]
    -> ask_reaction("reset_password", pretext_ask("reset_password"))
+ [Thanks, I'll ring back later.]
    No problem. We're on the desk until six.
    -> END

=== reaction(band, said) ===
// band 3 (reported): the lockout's endConversation closes the call and the
// authored goodbye is spoken on finalise, so nothing is printed here.
{ band >= 3:
    -> END
}
{ band == 2:
    I'm going to stop there. I'll need to verify you before I do anything else.
    -> desk
}
{ band == 1:
    Let's slow down a moment. I still have to check who you are.
    -> desk
}
{
- said == "open_locked_out":
    Sorry to hear that. Bear with me and I'll pull up your record.
- said == "give_manager":
    Thanks, I can see your manager on file.
- said == "give_staffid":
    Got it, that reference matches our record.
- said == "name_drop_director":
    Understood, but I go through the same checks either way.
- said == "cant_callback":
    A callback on the number we hold is how I confirm it's really you.
- said == "skip_verification":
    I can't skip those, I'm afraid. They protect your account.
- else:
    Right, bear with me a second.
}
-> desk

=== ask_reaction(ask_id, result) ===
{ result:
- 1:
    All done. I've reset it and sent a temporary password through.
- 2:
    Before I reset anything, I'll need your manager's name and your staff reference.
- else:
    I can't reset that over the phone without verifying you first, sorry.
}
-> desk
