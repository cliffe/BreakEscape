// ================================================
// Awareness E15, full episode: Nilesh Solanki (person, Training Room)
// Tarrowby's IT service desk analyst, 30s, Gujarati-British, grew up in
// Leicester (BRAND_SET.md, E6 additions; built Tarrowby cast, renamed from
// "Dev Mistry" in an earlier draft: keep the built spelling Nilesh Solanki).
// Quick, kind, funny; asking him is always the easiest move, which is the point.
// He frames the exercise; the kiosk runs it (brief, the Friday shortcuts, the
// "six months later" montage, then the scored sort and the Swap Shop drill).
// His record in the erb carries the eventMappings that complete sort_shortcuts
// on episode_e15_shadow_it_defend_done; the ink reads that global only for its
// closing line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Placeholder sprite (male_telecom) until the PixelLab reset.
// ================================================

VAR episode_e15_shadow_it_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e15_shadow_it_defend_done:
        Nilesh Solanki: That's the lot. If the official way's slow, tell us, don't build your own way round.
        Nilesh Solanki: We can't mend what we don't know about. And nobody's in trouble for a workaround.
    - else:
        Nilesh Solanki: Nilesh, service desk. Ask us first, we'd rather help than clean up.
        Nilesh Solanki: That slow share? Tell us and we'll fix it. We can't mend what we don't know about.
        Nilesh Solanki: Start at the kiosk. Play out the Friday, then sort what's actually waiting.
    }
}
+ [Thanks, Nilesh.]
    Nilesh Solanki: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// ------------------------------------------------
// Hand-off line (E15 section 8b: "after the mistake/flip"). The full episode
// runs brief -> mistake -> flip -> defend -> debrief inside the kiosk in one
// sitting, and unlike E8 there is no mid-episode global (no phish-attempt count;
// the mistake choices live in episode_<id>_state and are cleared on flip), so
// there is no state the hub can branch on to show this between the montage and
// the sort. It is kept here for the wiring agent: if the montage-to-defend
// transition shows a host line in the runner, use this; otherwise it is covered
// by the kiosk's own stage framing. This knot is not reached by the hub above.
// Open question for wiring, flagged in the content agent's report.
=== handoff ===
Nilesh Solanki: That's six months on.
Nilesh Solanki: Now sort what's actually in front of you: a few found sticks and 'quicker way' messages, and match each shortcut to its approved swap.
-> DONE
