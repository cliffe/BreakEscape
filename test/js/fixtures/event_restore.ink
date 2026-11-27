// Fixture for test/js/engine-fixes-pass4c.test.mjs: a hub with a once-only topic and an
// NPC-local flag, plus an event knot a cutscene jumps to.
VAR met_player = false
VAR network_isolated = false

=== start ===
{ not met_player:
    Hello, I'm Helen.
    ~ met_player = true
}
-> hub

=== hub ===
* [Ask about the ransom.]
    We don't pay.
    -> hub
+ [Leave.]
    -> END

=== isolation_event ===
{ met_player: As I told you before, the network is cut. | Who are you? The network is cut. }
-> hub
