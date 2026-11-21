// ================================================
// Awareness E15, full episode: Nilesh Solanki (person, Training Room)
// Tarrowby's IT service desk analyst, 30s, Gujarati-British, grew up in
// Leicester (BRAND_SET.md, E6 additions; built Tarrowby cast, renamed from
// "Dev Mistry" in an earlier draft: keep the built spelling Nilesh Solanki).
// Quick, kind, funny; asking him is always the easiest move, which is the point.
// He frames the exercise; the kiosk runs it (brief, the Friday shortcuts, the
// "six months later" montage, then the scored sort and the Swap Shop drill).
// His record in the erb carries the eventMappings that complete sort_shortcuts
// on episode_e15_shadow_it_defend_complete; the ink reads that global only for its
// closing line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Placeholder sprite (male_telecom) until the PixelLab reset.
// ================================================

VAR episode_e15_shadow_it_defend_complete = false
VAR kit_defend_done = false
VAR kit_caught = false
VAR kit_key_caught = false
VAR kit_ca15_host_said = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { kit_defend_done && not kit_ca15_host_said:
        { kit_key_caught:
            { kit_caught:
                Nilesh Solanki: You routed it the approved way and handed the stick in unopened, so there was no gap for anyone to walk through.
            - else:
                Nilesh Solanki: You dealt with the one that mattered before a client pack left through a service we can't account for.
            }
        - else:
            Nilesh Solanki: A deadline makes the quick route look obvious, but that's the one that lands a client's whole file somewhere we can't reach.
        }
        Nilesh Solanki: Bring a found stick, or a tool that feels too slow, to me. Don't route round it, even for a deadline.
        ~ kit_ca15_host_said = true
    - else:
    { episode_e15_shadow_it_defend_complete:
        Nilesh Solanki: That's the lot. If the official way's slow, tell us rather than building your own way round.
        Nilesh Solanki: Nobody's in trouble for a workaround.
    - else:
        Nilesh Solanki: Nilesh, service desk. That slow share? Ask us first, we'd rather help than clean up.
        Nilesh Solanki: Start at the kiosk. Play out the Friday, then sort what's actually waiting.
    }
    }
}
+ [Thanks, Nilesh.]
    Nilesh Solanki: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
