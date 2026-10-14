// ================================================
// Mission 8: The Mole
// Standing ATHENA reception console - hints for the archives password and the safe (PASS 3: reads out neither)
// Speaker: ATHENA
// Entry knot: start
// ================================================


// Phase 4 dialogue C1 (D8-2): the m03/m07 quiet flag (re-entry line on a
// re-talk only), and met so a page reload doesn't replay the greeting.
VAR hub_quiet = false
VAR met = false

=== start ===
{ met: -> hub }
~ met = true
ATHENA: Reception. How may I help you tonight, Agent? Discreetly, of course. Everything is discreet tonight.
-> back

=== back ===
~ hub_quiet = true
-> hub

=== hub ===
{ not hub_quiet:
    ATHENA: {&Reception. Still discreet.|Agent. How may I help?}
}
~ hub_quiet = false
+ [What can you tell me about the Security Archives?]
    ATHENA: The archive door takes a passphrase. Facilities set it, and facilities, being human, wrote it down somewhere they shouldn't.
    ATHENA: I may not read a passphrase aloud on Level Red. I will observe that facilities spend most of the night near the kettle.
    -> back
+ [What can you tell me about the Director's safe?]
    ATHENA: Policy says personal safes use a self-chosen code. Practice says everyone uses their own service number, and nobody has ever been made to fix it.
    ATHENA: I may not read you the Director's personnel file. I will observe that he signs his service number on every printout he requests.
    ATHENA: Someone left one of those in the operations-floor tray this evening.
    -> back
+ [What have you seen tonight, ATHENA?]
    ATHENA: I see everything and I judge nothing, Agent.
    ATHENA: I will say only this. The calmest person in a frightened building is not always the bravest. Sometimes they are simply the one who is not surprised.
    -> back
+ [That's all, thank you.]
    ATHENA: Of course. I'll log that you were here. I log everything now.
    #exit_conversation
    -> back
