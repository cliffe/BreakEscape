// Fixture for test/js/social-ink-vars.test.mjs: an NPC-local flag, a scenario global,
// the run-scoped email_ set (00 S7) and an engine-written VAR the loaders set last.
VAR met_player = false
VAR door_open = false
VAR email_landed = false
VAR email_first_fail = ""
VAR email_fail_count = 0
VAR engine_turn = 0

=== start ===
~ met_player = true
Turn {engine_turn}.
-> hub

=== hub ===
+ [Leave.]
    -> END
