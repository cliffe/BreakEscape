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
            Nilesh Solanki: You handed that found stick to us unopened, so nothing on it ever ran on a work machine.
            Nilesh Solanki: A dull non-event is the point. The free shortcut is where a client pack ends up somewhere we can't account for.
        - else:
            Nilesh Solanki: That stick left to be found, or the free tool for the client pack, was the one to stop.
            Nilesh Solanki: It got used, so months on nobody could say where that client data was or who could read it.
        }
    - else:
        Nilesh Solanki: Nilesh, service desk. Found sticks, 'quicker way' messages, then a board to match each shortcut to its approved swap. Ask us first, we'd rather help than clean up.
    }
}
+ [Thanks, Nilesh.]
    Nilesh Solanki: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
