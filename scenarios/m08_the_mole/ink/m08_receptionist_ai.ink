// ================================================
// Mission 8: The Mole
// Standing ATHENA reception console - hints for the archives password and the safe (PASS 3: reads out neither)
// Speaker: ATHENA
// Entry knot: start
// ================================================


=== start ===
ATHENA: Reception. How may I help you tonight, Agent? Discreetly, of course. Everything is discreet tonight.
-> hub

=== hub ===
+ [What can you tell me about the Security Archives?]
    ATHENA: The archive door takes a passphrase. Facilities set it, and facilities, being human, wrote it down somewhere they shouldn't.
    ATHENA: I may not read a passphrase aloud on Level Red. I will observe that facilities spend most of the night near the kettle.
    -> hub
+ [What can you tell me about the Director's safe?]
    ATHENA: Policy says personal safes use a self-chosen code. Practice says everyone uses their own service number, and nobody has ever been made to fix it.
    ATHENA: I may not read you the Director's personnel file. I will observe that he signs his service number on every printout he requests.
    ATHENA: Someone left one of those in the operations-floor tray this evening.
    -> hub
+ [What have you seen tonight, ATHENA?]
    ATHENA: I see everything and I judge nothing, Agent.
    ATHENA: I will say only this. The calmest person in a frightened building is not always the bravest. Sometimes they are simply the one who is not surprised.
    -> hub
+ [That's all, thank you.]
    ATHENA: Of course. I'll log that you were here. I log everything now.
    #exit_conversation
    -> hub
