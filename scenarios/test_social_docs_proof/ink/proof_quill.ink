VAR osint_done = false
VAR phish_blake_landed = false
VAR report_filed = false
VAR se_intel_wendover_pattern = false
VAR soc_key_given = false
VAR triage_pass = false
VAR defender_done = false
VAR mara_influence = 0
VAR asked_job = false
// Ink-local: soc_key_given arrives from an item_picked_up mapping, which the open chat
// does not see until it is reopened, so this hides the choice for the rest of the chat.
VAR key_offered = false

=== start ===
Mara Quill: You're the tester Tarnside sent. Wendover signed the engagement off this morning, so we're clear to start.
-> hub

=== hub ===
{ report_filed and triage_pass and defender_done:
    Mara Quill: {&Report's filed and the SOC has its fixes. Clean run.|We're done here.|Good work.}
- else:
    { soc_key_given and not (triage_pass and defender_done):
        Mara Quill: {&The SOC room's open. Work their inbox, then tell them what to take down.|How's the defender's seat?}
    - else:
        { phish_blake_landed and not report_filed:
            Mara Quill: {&The email landed. Write it up at the report desk when you're ready.|Still owe me that write-up.}
        - else:
            { osint_done:
                Mara Quill: {&Recon's done. The mail terminal is there when you want to try a send.|Target's researched. Your move.}
            - else:
                Mara Quill: {&Start at the research station and find out who handles Wendover's invoices.|Dig into Wendover first.}
            }
        }
    }
}
+ {osint_done and se_intel_wendover_pattern and not soc_key_given and not key_offered} [I've got Wendover's address pattern.]
    -> soc_key
+ [What am I doing here, exactly?]
    -> job
+ [I'll get on with it.]
    #exit_conversation
    Mara Quill: Good. I'll be here.
    -> hub

=== job ===
Mara Quill: A scoped phishing test. Research the target, send one email, then write up what it shows.
{ not asked_job:
    ~ asked_job = true
    #influence_gained:10:briefing
    Mara Quill: And thanks for asking before you dived in. Most testers don't.
}
-> hub

=== soc_key ===
~ key_offered = true
#influence_gained:10:recon
#give_item:key:soc_key
Mara Quill: Good find. Wendover want to see the other side too, so take the key to their SOC room next door.
Mara Quill: Work the triage inbox in there, then use their board to say what they should take down.
-> hub
