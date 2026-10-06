// ================================================
// The Keyholder Trials: closing debrief (HaX at HQ, hidden person-chat)
// Opened by start_debrief_cutscene. Background hq4 (the field HQ); on the
// sent ending the field HQ is burned and this scene runs at the fallback site,
// hq5 (D9; the mapping is split by ending). On every route Ghost withdraws
// the studentship (D7). Branches on the ending, the warning,
// Megan and Jordan. hear_debrief completes on the last line, before the exit,
// so the credits never cover the debrief. DESIGN section 9.
// ================================================

// Synced scenario globals
VAR ending = ""
VAR warned_out_of_band = false
VAR late_warning = false
VAR megan_choice = ""
VAR report_read_claimed = ""
VAR ghost_greeted = false

VAR debrief_done = false

=== start ===
{ debrief_done: -> after }
{
- ending == "sent":
    -> opening_sent
- ending == "double":
    -> opening_double
- ending == "blown":
    -> opening_blown
- else:
    -> opening_refused
}

=== opening_sent ===
Agent HaX: Sit down, Agent. Anywhere. This is the fallback site, and nothing in it is ours yet.
Agent HaX: I opened your report at the field HQ at eleven minutes past six. At twelve minutes past, my phone told a server in Rotterdam where it was.
Agent HaX: We were all out before midnight. Nobody's hurt.
Agent HaX: At four, someone went through the field HQ. The kit we couldn't carry, the cover it took years to build. All of it. We won't be going back.
{ late_warning:
    #set_global:report_read_claimed:read
    Agent HaX: Your flag reached me after the report did. You tried. It was already open.
    -> sent_cost
}
Agent HaX: Did you read it before you sent it?
+ [No. I didn't decode it.]
    #set_global:report_read_claimed:unread
    Agent HaX: No. Most people wouldn't have. That's why it works.
    -> sent_cost
+ [I read it. I sent it anyway.]
    #set_global:report_read_claimed:read
    Agent HaX: Then you'll have your reasons, and one day you'll tell me them. Not today.
    -> sent_cost

=== sent_cost ===
Agent HaX: Ghost withdrew the studentship this morning. They had what they wanted, and it was never you.
Agent HaX: I'm meant to wonder whose side you're on. I'm trying not to.
-> pixel

=== opening_double ===
Agent HaX: My phone did exactly what Ghost wanted, in a flat in Leeds we rent for the purpose.
Agent HaX: Someone came to look at four. We have their photograph. The field HQ never showed up on anyone's screen.
Agent HaX: Thank you for the flag.
Agent HaX: Ghost withdrew the studentship this morning anyway. They don't keep anyone a handler sent. Today, take that as a compliment.
-> pixel

=== opening_refused ===
Agent HaX: You said no to Ghost on their own terms. That's rarer than you'd think.
{ warned_out_of_band:
    Agent HaX: And you sent me the token. We're watching that server now.
}
-> pixel

=== opening_blown ===
Agent HaX: You told me on the line Ghost said was listening. They heard. That was the end of it.
Agent HaX: You were right about the report. Nobody opened it.
{ warned_out_of_band:
    Agent HaX: And you sent me the token. We're watching that server now.
}
-> pixel

=== pixel ===
Agent HaX: One pixel. A picture too small to see, fetched from Ghost's server the moment anyone opens the report. That's all a location costs.
Agent HaX: Your mail app does the same thing every day, unless you turn remote images off.
-> why_you

=== why_you ===
Agent HaX: I bet Ghost never saw your face at St Catherine's. I lost.
Agent HaX: I said I'd take either outcome. Ghost recognised you and wanted you anyway. That's worth knowing. I didn't enjoy learning it.
{ ending == "refused":
    Agent HaX: A clean no is worth something. It's also the last time they'll talk to you.
}
{ ending == "blown":
    { warned_out_of_band:
        Agent HaX: The scoreboard was enough. The phone call was one call too many.
    - else:
        Agent HaX: Next time, the scoreboard. It's why it's there.
    }
}
{ ghost_greeted:
    Agent HaX: Hand in the device. We're replacing your phone too. It sat next to theirs all day.
- else:
    Agent HaX: We're replacing your phone anyway. Ghost had the building's network all week.
}
-> people

=== people ===
{
- megan_choice == "warned":
    Agent HaX: Megan Oyelaran walked away from CryptoSecure. Still skint. Still free.
- megan_choice == "protected":
    Agent HaX: Megan Oyelaran has a bursary from a donor she'll never meet. Don't tell her.
- ending == "sent" or ending == "double":
    Agent HaX: Megan Oyelaran took a CryptoSecure summer placement. We'll keep an eye on her. You could have.
- else:
    Agent HaX: Megan Oyelaran's placement vanished with CryptoSecure. She's still eleven thousand down and still looking.
}
{ ending == "sent" or ending == "double":
    Agent HaX: Jordan Pike got his referral bonus. He'll never know what for.
- else:
    Agent HaX: The stand was gone by morning. Jordan Pike's student email bounces.
}
Agent HaX: You can read Base64 now. Most people who'd have opened that report can't.
-> questions

=== questions ===
* [Who is Dr Schreuders?]
    Agent HaX: That's classified.
    -> questions_more
* [Was Ghost really reading my phone?]
    Agent HaX: We're replacing it. That's all the answer you get.
    -> questions
+ [That's everything.]
    -> close

=== questions_more ===
* [Classified by whom?]
    Agent HaX: Classified isn't the same as "I don't know", Agent. Leave it there.
    -> questions
+ [Fine.]
    -> questions

=== close ===
~ debrief_done = true
Agent HaX: Term starts Monday. Go to your lectures. You never know who's watching.
#complete_task:hear_debrief
#exit_conversation
-> after

=== after ===
Agent HaX: Go home, Agent.
+ [Going.]
    Agent HaX: Good.
    #exit_conversation
    -> after
