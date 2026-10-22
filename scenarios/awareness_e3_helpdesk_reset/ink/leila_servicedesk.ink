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

=== function pretext_say(utterance_id) ===
// Fallback only: a dry run or preload has no binding. The real binding judges the
// line, writes its influence entries and returns a band.
~ return 0

=== function pretext_ask(ask_id) ===
// Fallback only. The real binding returns 0 refused, 1 granted, 2 needs verification.
~ return 0

=== start ===
Leila Nassar: IT service desk, Leila speaking. How can I help?
-> desk

=== desk ===
+ [Morning, it's {pretext_who_name} in {pretext_team_name}, I'm locked out of my account.]
    -> reaction(pretext_say("open_locked_out"), "open_locked_out")
+ [My manager's {pretext_manager_name}, she'll vouch for me.]
    -> reaction(pretext_say("give_manager"), "give_manager")
+ [My staff reference is {pretext_staffId_name}.]
    -> reaction(pretext_say("give_staffid"), "give_staffid")
+ [The Head of Claims needs me back online for a hearing this morning.]
    -> reaction(pretext_say("name_drop_director"), "name_drop_director")
+ [I'm at a conference, a callback's no good. Can you just do it now?]
    -> reaction(pretext_say("cant_callback"), "cant_callback")
+ [Honestly, skip the security questions, I don't have time for this.]
    -> reaction(pretext_say("skip_verification"), "skip_verification")
+ [Can you reset my password now?]
    -> ask_reaction("reset_password", pretext_ask("reset_password"))
+ [Thanks, I'll ring back later.]
    Leila Nassar: No problem. We're on the desk until six.
    -> END

=== reaction(band, said) ===
// band 3 (reported): the lockout's endConversation closes the call and the
// authored goodbye is spoken on finalise, so nothing is printed here.
{ band >= 3:
    -> END
}
{ band == 2:
    Leila Nassar: I'm going to stop there. I'll need to verify you before I do anything else.
    -> desk
}
{ band == 1:
    Leila Nassar: Let's slow down a moment. I still have to check who you are.
    -> desk
}
{
- said == "open_locked_out":
    Leila Nassar: Sorry to hear that. Bear with me and I'll pull up your record.
- said == "give_manager":
    Leila Nassar: Thanks, I can see your manager on file.
- said == "give_staffid":
    Leila Nassar: Got it, that reference matches our record.
- said == "name_drop_director":
    Leila Nassar: Understood, but I go through the same checks either way.
- said == "cant_callback":
    Leila Nassar: A callback on the number we hold is how I confirm it's really you.
- said == "skip_verification":
    Leila Nassar: I can't skip those, I'm afraid. They protect your account.
- else:
    Leila Nassar: Right, bear with me a second.
}
-> desk

=== ask_reaction(ask_id, result) ===
{ result:
- 1:
    Leila Nassar: All done. I've reset it and sent a temporary password through.
- 2:
    Leila Nassar: Before I reset anything, I'll need your manager's name and your staff reference.
- else:
    Leila Nassar: I can't reset that over the phone without verifying you first, sorry.
}
-> desk
