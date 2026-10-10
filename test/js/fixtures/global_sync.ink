// Fixture for test/js/global-sync-declared.test.mjs.
// mission_phase and briefing_seen stand for scenario-declared globals;
// guard_hostile is this ink's own VAR, sharing a name with a global that an
// old save still holds after the scenario renamed it away.
VAR mission_phase = "day"
VAR briefing_seen = false
VAR guard_hostile = false

=== start ===
Guard: Evening.
-> hub

=== hub ===
+ [Provoke]
    ~ guard_hostile = true
    Guard: Right.
    -> hub
+ [Read the brief]
    ~ briefing_seen = true
    #set_global:briefing_seen:true
    Guard: Done.
    -> hub

=== intro ===
~ briefing_seen = true
Agent: Briefing's in your inbox.
-> hub
