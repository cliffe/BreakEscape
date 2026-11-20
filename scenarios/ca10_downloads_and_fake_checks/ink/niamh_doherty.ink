// ================================================
// Awareness E10, full episode: Niamh Doherty (person, Training Room)
// Quayholt's internal communications officer / the room's IT trainer (E5's host),
// mid 20s, Northern Irish, quick and friendly. She frames the exercise; the kiosk
// does the rest and sends the learner out with three web habits (named by Niamh here
// and carried through the debrief's concept panel). No service-desk NPC is promised.
// Her record carries the mappings that complete build_and_send_page (on
// phish_order_colleague_attempts > 0) and work_browser_morning (on the defend set's
// done global), so the ink reads those two globals only, for its welcome line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there quietly,
// and a re-talk re-enters it and says the line that fits the moment.
// Placeholder sprite (female_telecom) until the PixelLab reset.
// ================================================

VAR phish_order_colleague_attempts = 0
VAR episode_e10_downloads_and_fake_checks_defend_complete = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e10_downloads_and_fake_checks_defend_complete:
        Niamh Doherty: That's both sides done. Get your software from Quayholt Apps, read the address, and never let a page drive your computer.
        Niamh Doherty: And if you ever slip, tell us straight away. Nobody's in trouble for it.
    - else:
        { phish_order_colleague_attempts > 0:
            Niamh Doherty: Good, the email's away to Leo. Now take the other seat and sort a morning of the web the way it really turns up.
        - else:
            Niamh Doherty: Welcome back to the Quayholt exercise. Last time it was sign-in pages, this time it's the whole web.
            Niamh Doherty: The kiosk takes you through a morning of fake downloads, 'verify you are human' boxes and pop-ups that want you to call.
        }
    }
}
+ [Thanks, Niamh.]
    Niamh Doherty: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
