// Fixture for test/js/social-tag-processor.test.mjs (packet P0-G).
// mara_influence is the social character's influence global. The knot moves it
// in ink and then carries an influence tag on the same line, so the tag
// processor must read its base value from the calling story.
VAR mara_influence = 0
VAR mara_wary = false

=== ink_then_tag ===
~ mara_influence -= 20
Mara frowns. #influence_lost:10:pushy
After: {mara_influence}
-> END
