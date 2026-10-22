VAR osint_done = false
VAR phish_blake_landed = false
VAR report_filed = false

=== start ===
Mara Quill: You're the tester Tarnside sent. Wendover signed the engagement off this morning, so we're clear to start.
-> hub

=== hub ===
{ report_filed:
    Mara Quill: {&Report's filed. Clean run.|We're done here.|Good work.}
- else:
    { phish_blake_landed:
        Mara Quill: {&The email landed. Write it up at the report desk when you're ready.|Still owe me that write-up.}
    - else:
        { osint_done:
            Mara Quill: {&Recon's done. The mail terminal is there when you want to try a send.|Target's researched. Your move.}
        - else:
            Mara Quill: {&Start at the research station and find out who handles Wendover's invoices.|Dig into Wendover first.}
        }
    }
}
+ [What am I doing here, exactly?]
    Mara Quill: A scoped phishing test. Research the target, send one email, then write up what it shows.
    -> hub
+ [I'll get on with it.]
    #exit_conversation
    Mara Quill: Good. I'll be here.
    -> hub
