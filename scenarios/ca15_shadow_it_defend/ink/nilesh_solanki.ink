// ================================================
// Awareness E15, defend only: Nilesh Solanki (person, Training Room)
// Tarrowby's IT service desk analyst, 30s, Gujarati-British, grew up in Leicester (BRAND_SET.md, E6 additions). The natural 'ask first' voice for acceptable use. Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e15_shadow_it_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e15_shadow_it_defend_defend_complete = false
VAR kit_key_caught = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e15_shadow_it_defend_defend_complete:
        { kit_key_caught:
            Nilesh Solanki: You passed that posted stick to us without plugging it in, so nothing on it ran on a work machine.
            Nilesh Solanki: A stick in the post is a found stick, whatever the note says. It comes to us, and nobody plugs it in.
        - else:
            Nilesh Solanki: That stick posted in, marked from the client, was the one to bring to us.
            Nilesh Solanki: A stick like that can run code the moment it's plugged in, and from that machine it can reach the share.
        }
    - else:
        Nilesh Solanki: Nilesh, service desk. Today's about shadow IT. That's work done on devices, apps or accounts IT doesn't know about, usually as a shortcut.
        Nilesh Solanki: On the kiosk there are USB sticks that turned up and 'quicker way' messages to sort. Ask us first, we'd rather help than clean up.
    }
}
+ [Thanks, Nilesh.]
    Nilesh Solanki: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
