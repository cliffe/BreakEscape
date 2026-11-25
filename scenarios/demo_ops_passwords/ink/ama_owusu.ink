// Passwords showcase host: Ama Owusu (person, office).
// Contract: SHOWCASE_PLAN 8.3.1 (passwords). Hub knot is hub; levers and recap knots divert back to hub.choices.
// Every VAR below is a scenario global (same initial value), synced in when the talk starts.
// Ink ticks set <task>_done beside #complete_task. No line names a fact, password or code.

VAR coffee_call = 0
VAR ask_weekend = 0
VAR act_midday = false
VAR act_evening = false
VAR earn_facts_done = false
VAR get_records_done = false
VAR crack_guessable_done = false
VAR crack_reused_done = false
VAR crack_strong_done = false
VAR user_signin_done = false
VAR usb_refused_done = false
VAR admin_signin_done = false
VAR profile_read_done = false
VAR override_done = false
VAR read_log_done = false
// met_ama is ink-local so the opening plays once (pattern from office_life_showcase).
VAR met_ama = false

=== start ===
{ met_ama:
    -> hub
}
~ met_ama = true
# speaker:npc
Someone left a box of old password records in the confidential waste.
# speaker:npc
Show the partners why that matters. Staff habits give you what you need.
-> hub.choices

=== hub ===
# speaker:npc
What can I help with?
- (choices)
+ [What's next?]
    -> whats_next
+ { not earn_facts_done } [Here's what I learnt about Delphine.]
    -> tell_facts
+ { not get_records_done } [I've got the records.]
    -> tell_records
+ { not crack_guessable_done } [I cracked Delphine's record.]
    -> tell_crack_guessable
+ { not crack_reused_done } [I cracked Graham's record.]
    -> tell_crack_reused
+ { not crack_strong_done } [I tried Julian's record.]
    -> tell_crack_strong
+ { not profile_read_done } [I opened Julian's profile.]
    -> tell_profile
+ [Send them for coffee.]
    -> lever_coffee
+ [Ask Delphine about her weekend.]
    -> lever_weekend
+ { not act_midday } [Send them to lunch.]
    -> lever_lunch
+ { act_midday and not act_evening } [Call it a day.]
    -> lever_day_end
+ [What did that show?]
    -> recap
+ { act_evening } [Give me the short version.]
    -> short_version
+ [I'll have a look round.]
    # speaker:npc
    Go on. I'll be here.
    # exit_conversation
    -> END

=== whats_next ===
{
    - not earn_facts_done:
        # speaker:npc
        Delphine posts on the office feed, in the kitchen. Read what she shares.
        # speaker:npc
        Her desk photo tells you more. Take it while she is away for coffee.
    - not get_records_done and not act_midday:
        # speaker:npc
        The records are in the bin in the IT room. Graham sits right there.
        # speaker:npc
        Send them to lunch and the room empties.
    - not get_records_done:
        # speaker:npc
        Search the confidential waste bin in the IT room. Take all three record files.
    - not crack_guessable_done:
        # speaker:npc
        Crack Delphine's record with what you learnt about her.
    - not crack_reused_done:
        # speaker:npc
        There's a printer admin note in the cupboard by the printer. Take it.
        # speaker:npc
        Then crack Graham's record. It's slower, so wait for it.
    - not crack_strong_done:
        # speaker:npc
        Try Julian's record. Try it twice.
    - not user_signin_done:
        # speaker:npc
        Sign in at Delphine's PC with her password. Her screen locked itself.
    - not usb_refused_done:
        # speaker:npc
        Plug the storage stick into the port on Delphine's desk.
    - not admin_signin_done:
        # speaker:npc
        Julian's out at his client lunch. Sign in at his PC as Graham.
    - not profile_read_done:
        # speaker:npc
        Open Client files in Julian's profile. A normal user couldn't.
    - not override_done:
        # speaker:npc
        Still at Julian's PC as Graham? Plug the keystroke device into its socket.
    - not read_log_done and not act_evening:
        # speaker:npc
        You've done the hands-on part. Tell me to call it a day.
    - not read_log_done:
        # speaker:npc
        Open the sign-in log in the IT room. Find your own rows, then flag the odd one.
    - else:
        # speaker:npc
        That's everything. Look round as long as you like.
}
{ crack_reused_done:
    # speaker:npc
    Try that password on Graham's PC while he's at lunch.
}
-> hub.choices

=== tell_facts ===
# speaker:npc
Good. Two different places, two things she shares without a thought.
# speaker:npc
Keep both. A cracker needs them.
#complete_task:earn_facts
~ earn_facts_done = true
-> hub.choices

=== tell_records ===
# speaker:npc
Three records, three people. They won't all give way the same.
#complete_task:get_records
~ get_records_done = true
-> hub.choices

=== tell_crack_guessable ===
# speaker:npc
Her password was built from things she posts. Guessing was enough.
#complete_task:crack_guessable
~ crack_guessable_done = true
-> hub.choices

=== tell_crack_reused ===
# speaker:npc
One person, one password, two accounts. That's reuse.
# speaker:npc
Once you hold one, you hold the other.
#complete_task:crack_reused
~ crack_reused_done = true
-> hub.choices

=== tell_crack_strong ===
# speaker:npc
Julian's won't fall. Long and random beats guessing.
#complete_task:crack_strong
~ crack_strong_done = true
-> hub.choices

=== tell_profile ===
# speaker:npc
An administrator reaches what a user can't. That's the real cost.
#complete_task:profile_read
~ profile_read_done = true
-> hub.choices

=== lever_coffee ===
# speaker:npc
I'll tell them the kettle's on.
~ coffee_call = coffee_call + 1
-> hub.choices

=== lever_weekend ===
# speaker:npc
I'll ask Delphine how her weekend went. Give her a minute.
~ ask_weekend = ask_weekend + 1
-> hub.choices

=== lever_lunch ===
# speaker:npc
Good idea. Watch who leaves, and who leaves a screen unlocked.
#set_global:act_midday:true
~ act_midday = true
# exit_conversation
-> END

=== lever_day_end ===
# speaker:npc
The staff won't be back once they've gone home. Seen everything you wanted?
+ [Yes, call it a day.]
    # speaker:npc
    Right. Home time for nearly all of them.
    # speaker:npc
    Graham stays. Ask him about the log.
    #set_global:act_evening:true
    ~ act_evening = true
    # exit_conversation
    -> END
+ [Not yet.]
    # speaker:npc
    Take your time.
    -> hub.choices

=== recap ===
{ not earn_facts_done and not get_records_done and not crack_guessable_done and not crack_reused_done and not crack_strong_done and not user_signin_done and not usb_refused_done and not admin_signin_done and not profile_read_done and not override_done and not read_log_done:
    # speaker:npc
    Nothing to look back on yet. Have a go first.
    -> hub.choices
}
{ earn_facts_done:
    # speaker:npc
    The facts: people give away what a guesser needs, and they don't notice.
}
{ get_records_done:
    # speaker:npc
    The bin: a stored record is not safe just because it isn't plain text.
}
{ crack_guessable_done:
    # speaker:npc
    Her record fell at once. A password made of her own life is weak.
}
{ crack_reused_done:
    # speaker:npc
    Graham's took a wait, but the same password was already in your hands.
}
{ crack_strong_done:
    # speaker:npc
    Julian's held. Long and random passwords are why.
}
{ user_signin_done:
    # speaker:npc
    A user session opens that user's desk, and no more.
}
{ usb_refused_done:
    # speaker:npc
    The desk policy refused the stick. That's a rule doing its job.
}
{ admin_signin_done:
    # speaker:npc
    An administrator's sign-in opens PCs that aren't theirs.
}
{ profile_read_done:
    # speaker:npc
    Julian's folders opened because the sign-in was an administrator's.
}
{ override_done:
    # speaker:npc
    The administrator could plug in what the policy blocks for everyone else.
}
{ read_log_done:
    # speaker:npc
    The log kept all of it, including the night someone kept failing.
}
-> hub.choices

=== short_version ===
# speaker:npc
People share what a guesser needs, and a stolen record falls to it.
# speaker:npc
A reused password opens more than one account.
# speaker:npc
A long random one doesn't fall, so use those.
# speaker:npc
A user's sign-in opens one desk. An administrator's opens other people's.
# speaker:npc
And the log remembers all of it.
# speaker:npc
That's the tour. Stay as long as you like.
-> hub.choices
