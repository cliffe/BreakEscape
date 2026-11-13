// ===========================================
// ACT 2 NPC: Marcus Webb (IT Administrator)
// Mission 2: Ransomed Trust
// Break Escape - Guilty Ally, Social Engineering Target
// ===========================================

// Variables for tracking player relationship and topics
VAR marcus_influence = 0          // 0-100 trust/rapport with Marcus
VAR marcus_defensive = false      // Is Marcus defensive/hostile?
VAR marcus_trusts_player = false  // Has Marcus reached trust threshold?
VAR topic_warnings = false        // Discussed ignored security warnings
VAR topic_passwords = false       // Discussed password hints
VAR topic_vulnerability = false   // Discussed CVE-2010-4652
VAR topic_family = false          // Discussed Emma (daughter)
VAR gave_keycard = false          // Marcus gave player server room keycard

// External variables (set by game)
EXTERNAL player_name

// ===========================================
// FIRST ENCOUNTER
// ===========================================

=== start ===
#speaker:marcus_webb

{marcus_defensive:
    Marcus: I don't have time for this. Systems are down.
    #exit_conversation
    -> DONE
}

Marcus: I TOLD them six months ago about CVE-2010-4652!

Marcus: They said "budget constraints." Now look what happened.

Marcus: Nobody listens to IT until everything's on fire.

* [Sympathize with Marcus]
    You: Budget cuts are common. You did your job by warning them.
    ~ marcus_influence += 15
    -> sympathize_response

* [Stay professional]
    You: Let's focus on recovery. What do you need from me?
    ~ marcus_influence += 5
    -> professional_response

* [Question why he didn't push harder]
    You: Why didn't you push harder? Make them listen?
    ~ marcus_influence -= 15
    ~ marcus_defensive = true
    -> defensive_response

=== sympathize_response ===
#speaker:marcus_webb

Marcus: *sighs* Thanks. Nobody else thinks so.

Marcus: Dr. Kim recommended cutting my security budget. Board approved it.

Marcus: Now they're planning to fire me. Scapegoat the IT guy.

~ marcus_trusts_player = true
~ topic_warnings = true

+ [Express outrage at scapegoating]
    You: That's wrong. You warned them. I'll make sure that's documented.
    ~ marcus_influence += 20
    Marcus: You... you'd do that?
    Marcus: I have all the emails. Six months of ignored warnings.
    -> offer_help

+ [Stay focused on mission]
    You: We need to recover those systems. Can you help me?
    -> ask_for_help

=== professional_response ===
#speaker:marcus_webb

Marcus: Right. Professional. I appreciate that.

Marcus: Look, I know the FTP server that was compromised. ProFTPD 1.3.5.

Marcus: The vulnerability is CVE-2010-4652. I documented it in May.

~ topic_vulnerability = true
~ marcus_influence += 5

+ [Ask about access]
    -> ask_for_help

+ [Ask about the warnings]
    -> discuss_warnings

=== defensive_response ===
#speaker:marcus_webb
~ marcus_defensive = true

Marcus: Are you SERIOUS? I documented everything!

Marcus: Email chains, risk assessments, budget proposals. Six months of work.

Marcus: They. Didn't. Listen.

Marcus: You know what? Figure it out yourself if you think I'm the problem here.

#exit_conversation
-> DONE

=== discuss_warnings ===
#speaker:marcus_webb
~ topic_warnings = true

Marcus: May 17th, 2024. I sent a formal security advisory to Dr. Kim.

Marcus: "ProFTPD 1.3.5 backdoor vulnerability. CRITICAL severity. Immediate patching required."

Marcus: She forwarded it to the board with a recommendation to defer.

Marcus: $85,000 for server security, or $3.2 million for a new MRI. Guess which they chose.

~ marcus_influence += 5

+ [Express sympathy]
    You: That must be frustrating.
    ~ marcus_influence += 10
    Marcus: You have no idea.
    -> hub

+ [Ask about recovery options]
    You: Can we recover without paying ransom?
    -> discuss_recovery

=== discuss_recovery ===
#speaker:marcus_webb

Marcus: Technically, yes. If you can exploit the same backdoor they used.

Marcus: Get the decryption keys from the backup server.

Marcus: But that takes time. 12 hours minimum. Patients at risk the whole time.

+ [I need access to the server room]
    -> ask_for_help

=== ask_for_help ===
#speaker:marcus_webb

{marcus_influence >= 30:
    -> high_trust_help
}
{marcus_influence >= 10 and marcus_influence < 30:
    -> medium_trust_help
}
{marcus_influence < 10:
    -> low_trust_help
}

=== high_trust_help ===
#speaker:marcus_webb
~ marcus_trusts_player = true

Marcus: I trust you. You're here to actually fix this, not assign blame.

Marcus: Here's my server room keycard. Full access.

Marcus: And... *pulls out sticky note* Common passwords employees used. Embarrassing, really.

Marcus: My daughter's name "Emma", hospital anniversary dates, that kind of thing.

#give_item:server_room_keycard
#complete_task:talk_to_marcus
#complete_task:obtain_password_hints
#unlock_task:access_server_room
~ gave_keycard = true
~ topic_passwords = true

-> offer_help

=== medium_trust_help ===
#speaker:marcus_webb

Marcus: Server room's locked. I can't just hand over my keycard—there are protocols.

Marcus: But... *glances around* The lock isn't great. Standard pin tumbler.

Marcus: If you have lockpicks, you could probably get in. I won't stop you.

#complete_task:talk_to_marcus
#unlock_task:access_server_room

~ marcus_influence += 5

+ [Ask about password hints]
    -> request_password_hints

+ [Thank Marcus]
    You: Thanks for the help.
    Marcus: Just... save those patients. Please.
    -> hub

=== low_trust_help ===
#speaker:marcus_webb

Marcus: Look, I can't give you server room access. There are protocols.

Marcus: Figure it out yourself. I have enough problems.

#complete_task:talk_to_marcus

-> hub

=== request_password_hints ===
#speaker:marcus_webb

{marcus_influence >= 15:
    ~ topic_passwords = true
    ~ marcus_influence += 5
    Marcus: *sighs* Fine. But this stays between us.
    Marcus: Common passwords: Emma2018, Hospital1987, StCatherines.
    Marcus: Employees used birthdays, company names, stupid variations.
    #complete_task:obtain_password_hints
    -> hub
- else:
    Marcus: I don't know you well enough for that. Sorry.
    -> hub
}

=== offer_help ===
#speaker:marcus_webb

Marcus: One more thing. There's a filing cabinet in my office.

Marcus: Email archives from the past year. Proof I warned them.

Marcus: It's locked, but if you can open it... that's my vindication.

#unlock_task:investigate_marcus_office

-> hub

// ===========================================
// CONVERSATION HUB (Repeatable Dialogue)
// ===========================================

=== hub ===
+ {not topic_warnings} [Ask about security warnings]
    -> discuss_warnings

+ {not topic_vulnerability} [Ask about ProFTPD vulnerability]
    -> discuss_vulnerability

+ {not topic_passwords and marcus_influence >= 15} [Ask about password hints]
    -> request_password_hints

+ {not topic_family} [Ask about family photo on desk]
    -> discuss_family

+ {topic_warnings and marcus_influence >= 20} [Offer to protect Marcus from scapegoating]
    -> promise_protection

+ [Leave conversation]
    #speaker:marcus_webb
    {marcus_trusts_player:
        Marcus: Good luck. And... thanks for listening.
    }
    {not marcus_trusts_player:
        Marcus: Yeah. Go fix things.
    }
    #exit_conversation
    -> DONE

=== discuss_vulnerability ===
#speaker:marcus_webb
~ topic_vulnerability = true

Marcus: CVE-2010-4652. ProFTPD versions 1.3.3c through 1.3.5.

Marcus: Backdoor in the source code. Remote code execution.

Marcus: Patched in 2011. We're running a 2010 version because "budgets."

~ marcus_influence += 5

+ [That's negligent]
    You: Running 14-year-old vulnerable software. That's negligent.
    ~ marcus_influence += 10
    Marcus: Exactly! But nobody listens to the IT guy.
    -> hub

+ [Can we exploit it too?]
    You: Can we use that same vulnerability to recover data?
    Marcus: That's... actually smart. Fight fire with fire.
    ~ marcus_influence += 5
    -> hub

=== discuss_family ===
#speaker:marcus_webb
~ topic_family = true

Marcus: That's Emma. My daughter. She just turned seven.

Marcus: May 17th, 2018. Same day I sent that security warning.

Marcus: Ironic, right? Happiest day of my life, most ignored email of my career.

~ marcus_influence += 5

+ [She's lucky to have you]
    You: She's lucky to have a dad who cares about security.
    ~ marcus_influence += 10
    Marcus: Thanks. I just hope she doesn't read about this in the news.
    -> hub

+ [Focus on the mission]
    You: Let's make sure this gets resolved properly.
    -> hub

=== promise_protection ===
#speaker:marcus_webb

You: I'll make sure the evidence shows you warned them. You won't be scapegoated.

~ marcus_influence += 20

Marcus: I... thank you. That means everything.

Marcus: I have all the emails, all the documentation. They can't ignore it if it's public.

Marcus: Just... save those patients first. Then we'll worry about blame.

#complete_task:promise_to_protect_marcus

-> hub
