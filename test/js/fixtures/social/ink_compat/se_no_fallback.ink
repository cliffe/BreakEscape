// Fixture for test/js/social-ink-fallback.test.mjs: an EXTERNAL with no ink fallback.
// With nothing bound it throws at the first Continue(), flag or no flag (the rule the
// EXTERNAL-fallback lint enforces).
EXTERNAL se_influence(delta, reason)

VAR influence = 0

=== start ===
~ influence = se_influence(5, "rapport")
Influence reads {influence}.
-> hub

=== hub ===
+ [Leave] #exit_conversation
    -> hub
