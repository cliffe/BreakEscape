// Fixture for test/js/social-pretext-first-menu.test.mjs: shaped like the lab's Dev
// service-desk pretext call (dev_service_desk.ink). A `start` greeting diverts to a
// `desk` hub whose first choice interpolates the card VARs. A preload runs the
// opening with the VARs still empty and bakes the blank choice into the saved state;
// the fresh call must re-bake the choice once fillPretextVars has written the VARs.
EXTERNAL pretext_say(utterance_id)
VAR pretext_intern_name = ""
VAR pretext_team_name = ""

=== function pretext_say(utterance_id) ===
~ return 0

=== start ===
Dev: Service desk, Dev speaking. What can I do for you?
-> desk

=== desk ===
+ [I'm helping {pretext_intern_name}, your new starter in {pretext_team_name}.]
    -> reaction(pretext_say("open_buddy"))
+ [Thanks, I'll ring back.]
    -> END

=== reaction(band) ===
Dev: Right, bear with me a sec.
-> desk
