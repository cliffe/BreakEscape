// Fixture for test/js/social-influence.test.mjs (packet P0-F).
// priya_influence stands for a social character's influence global (declared
// in the fixture scenario's globalVariables). se_influence is bound to the
// influence service by the test; its ink fallback returns 0.
VAR priya_influence = -20
VAR priya_wary = false
EXTERNAL se_influence(delta, reason)

=== function se_influence(delta, reason) ===
~ return 0

=== overshoot_down ===
~ priya_influence -= 120
Down: {priya_influence}
After: {priya_influence}
-> END

=== overshoot_up ===
~ priya_influence += 150
Up: {priya_influence}
After: {priya_influence}
-> END

=== se_then_ink ===
~ temp b = se_influence(-10, "x")
~ priya_influence += 2
Sum: {priya_influence} band {b}
After: {priya_influence}
-> END

=== hub ===
Hub {priya_influence}
+ [Push]
    ~ temp b = se_influence(-10, "urgency")
    Pushed {priya_influence}
    -> hub
+ [Leave]
    -> END
