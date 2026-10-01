// ================================================
// Mission 8: The Mole
// Standing ATHENA reception console - redundant source for archives pw + safe PIN
// Speaker: ATHENA
// Entry knot: start
// ================================================

VAR archives_password_found = false

=== start ===
ATHENA: Reception. How may I help you tonight, Agent? Discreetly, of course. Everything is discreet tonight.
-> hub

=== hub ===
+ [Ask about the Security Archives.]
    ATHENA: The archive door takes a passphrase. Facilities set it, and facilities, being human, wrote it down somewhere they shouldn't. If you can't find their note, I can read it from the facilities log: it is "TrustNoOne". Yes. In the Citadel. On Level Red.
    ~ archives_password_found = true
    -> hub
+ [Ask about the Director's safe.]
    ATHENA: Policy says personal safes use a self-chosen code. Practice says everyone uses their own service number, and nobody has ever been made to fix it.
    ATHENA: I may not read you the Director's personnel file. I will observe that he signs his service number on every printout he requests from personnel, and that someone left one of those in the operations-floor tray this evening.
    -> hub
+ [Ask what ATHENA has seen.]
    ATHENA: I see everything and I judge nothing, Agent. I will say only this: the calmest person in a frightened building is not always the bravest. Sometimes they are simply the one who is not surprised.
    -> hub
+ [Leave.]
    ATHENA: Of course. I'll log that you were here. I log everything now.
    #exit_conversation
    -> hub
