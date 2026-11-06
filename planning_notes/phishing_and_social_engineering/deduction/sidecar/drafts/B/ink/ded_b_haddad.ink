// ================================================
// Fixture B (draft): Samira Haddad, service desk analyst. Suspect. Person NPC in b_office.
// Lebanese-British, mid twenties, eighteen months in the job. Quick, friendly, a
// bit too keen to help. Her own laptop is a real clue against her (personal
// device), so she has to look possible until the badge log or the HR file rules
// her out.
//
// Plan: no ink route for Haddad (§9.1 "Clue routes"), so no grant and no verdict
// tag here. What she says about herself clears nothing (§7.1); the record does.
// She points the player at the evidence.
// ================================================

VAR samira_met = false
VAR hub_quiet = false

=== start ===
{ samira_met:
    -> hub
- else:
    ~ samira_met = true
    ~ hub_quiet = true
    Samira Haddad: Hi! You're with Priya? Anything you need, honestly, just ask.
    -> hub
}

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Samira Haddad: {&What else can I do?|Ask away.|Still digging?}
}
+ [Is that your own laptop?] -> laptop
+ [Have you ever been in the server room?] -> server
+ [Where would you start, if you were me?] -> advice
+ [Thanks, Samira.]
    Samira Haddad: Any time. I mean it.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== laptop ===
Samira Haddad: Guilty. The work one takes ten minutes to boot, so I use mine for the knowledge base.
Samira Haddad: I know, I know. Policy. Gwen's already had a word.
-> hub

=== server ===
Samira Haddad: Once, last night, before it all kicked off. A rack switch was flapping and I'd logged the ticket, so I went to look.
Samira Haddad: Don't take my word for it. The door log keeps everyone honest.
-> hub

=== advice ===
Samira Haddad: The door log's in the server room, and the network team leave their lease printouts there too.
Samira Haddad: Erik has the door code. He's in the kitchen pretending he isn't annoyed.
-> hub
