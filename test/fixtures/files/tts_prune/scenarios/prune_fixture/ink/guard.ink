// Fixture for tts_cache_pruner_test.rb: a guard with an inline alternative,
// a conditional, glue and a choice.
VAR met_guard = false

-> start

=== start ===
Guard: {&Halt.|Stop right there.} Who goes there? #speaker:guard
{met_guard: Guard: Back again.|Guard: Never seen you before.}
Guard: You'll want the <>
lobby, then.
~ met_guard = true
* [I'm the auditor.]
    Guard: Auditor. Right. Go on through.
    -> END
* [Nobody.]
    Narrator: The guard frowns.
    -> END
