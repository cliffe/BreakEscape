// ================================================
// Awareness E11, full episode: Tomasz Wiśniewski (person, Training Room)
// Carrholme Services' data protection officer, 50s, Polish, in the UK 25 years.
// Precise, kind, dry; he receives the reports, which is why he hosts the
// misdirected-data episode. He frames the exercise; the kiosk does the rest.
// His record carries the eventMapping that completes sort_desk_inbox on the
// defend set's done global (episode_e11_misdirected_data_defend_done). The ink
// reads that global only for its line.
// Consequence-flip episode (ENG-04): there is no attack-attempt global, so the
// host has two states only, welcome (before the inbox is sorted) and the sign-off
// (after). The flip-to-defend hand-off line is carried by strings.defendIntro
// (defend.json), because the one-aim design has no mistake-done global to gate a
// mid-episode host line on (brief section 15a); see the wiring-agent note in the
// report.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Host id is ASCII (tomasz_wisniewski); the non-ASCII "ś" is only in the display
// name here, never in an id or global (brief section 5).
// Placeholder sprite (male_office_worker) until the PixelLab reset.
// ================================================

VAR episode_e11_misdirected_data_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e11_misdirected_data_defend_done:
        Tomasz Wiśniewski: That's the desk sorted. Anything about someone's personal data comes to the DPO the same day.
        Tomasz Wiśniewski: And nobody here is ever in trouble for reporting, including their own slip.
    - else:
        Tomasz Wiśniewski: Tomasz Wiśniewski, data protection. I do a drop-in at this desk once a month, so I'm at the next chair if you need me.
        Tomasz Wiśniewski: Clear the queue the way you would on any morning. If something goes wrong, the only wrong move is to keep it to yourself.
    }
}
+ [Thanks, Tomasz.]
    Tomasz Wiśniewski: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
