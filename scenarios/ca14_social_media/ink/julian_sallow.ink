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
VAR episode_e14_social_media_defend_complete = false
VAR kit_defend_done = false
VAR kit_caught = false
VAR kit_key_caught = false
VAR kit_ca14_host_said = false
VAR kit_ca14_out = false
VAR kit_ca14_done = false
VAR kit_ca14_moved = false
VAR kit_ca14_photo_choice = ""
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { kit_defend_done && (kit_ca14_done || not kit_ca14_out) && not kit_ca14_host_said:
        {
        - kit_key_caught && not kit_ca14_moved && (kit_ca14_photo_choice == "" || kit_ca14_photo_choice == "crop"):
            { kit_caught:
                Julian Sallow: You checked the new contact before you answered, so the account trading on a partner's name got nothing out of the studio.
            - else:
                Julian Sallow: You stopped the one worth stopping, the message wearing a colleague's name, before it collected anything useful.
            }
        - not kit_key_caught:
            Julian Sallow: It knew real details and wore a trusted name, so one reply handed over a security answer we then had to reset.
        }
        Julian Sallow: A new contact gets checked by a route you already know before you tell them anything, however well they seem to know us.
        ~ kit_ca14_host_said = true
    - else:
    { episode_e14_social_media_defend_complete:
        Julian Sallow: That's the lot. A well-made message is built from scraps anyone could find.
        Julian Sallow: The fix is a setting and a pause. Nobody's in trouble for what they've posted.
    - else:
        { phish_df_cover_attempts > 0:
            Julian Sallow: That's how little it takes to build a convincing message out of a colleague's posts.
            Julian Sallow: Now you spot the same moves in a feed and an inbox, and we close the gaps, on Dani's profile and on yours.
        - else:
            Julian Sallow: Welcome to the Merrin & Sallow exercise. Everyone here is fictional, and nothing you do leaves this room.
            Julian Sallow: Start at the kiosk. See what one colleague's public posts give away, then close the gaps, on his profile and on yours.
        }
    }
    }
}
+ [Thanks, Julian.]
    Julian Sallow: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
