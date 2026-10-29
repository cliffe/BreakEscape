// ================================================
// Awareness E14, full episode: Julian Sallow (person, Training Room)
// Merrin & Sallow's co-founding partner, 60s, Black British of Jamaican
// heritage. Built E4 cast (hosts the executive BA check pair), here welcoming
// the learner, framing the exercise and receiving the reports. His record
// carries the mappings that complete write_pretext_message (on the phish-attempt
// global, value > 0) and sort_social_inbox (on the defend set's done global), so
// the ink reads the attempt count and the done global only for its welcome line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// ================================================

VAR phish_df_cover_attempts = 0
VAR episode_e14_social_media_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e14_social_media_defend_done:
        Julian Sallow: That's the lot. A well-made message is built from scraps anyone could find.
        Julian Sallow: The fix is a setting and a pause, not shame. Nobody's in trouble for having posted them.
    - else:
        { phish_df_cover_attempts > 0:
            Julian Sallow: That's how little it takes to build a convincing message out of a colleague's posts.
            Julian Sallow: Now you spot the same moves in a feed and an inbox, and we close the gaps, on Dani's profile and on yours.
        - else:
            Julian Sallow: Welcome to the Merrin & Sallow exercise. Everyone here is fictional, and nothing you do leaves this room.
            Julian Sallow: Start at the kiosk: see what one colleague's public posts give away, then close the gaps, on his profile and on yours.
        }
    }
}
+ [Thanks, Julian.]
    Julian Sallow: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
