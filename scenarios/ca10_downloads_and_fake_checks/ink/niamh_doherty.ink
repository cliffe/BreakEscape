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
VAR kit_defend_done = false
VAR kit_caught = false
VAR kit_key_caught = false
VAR kit_ca10_host_said = false
VAR kit_ca10_out = false
VAR kit_ca10_done = false
VAR kit_ca10_moved = false
VAR kit_ca10_check_choice = ""
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { kit_defend_done && (kit_ca10_done || not kit_ca10_out) && not kit_ca10_host_said:
        {
        - kit_key_caught && not kit_ca10_moved && (kit_ca10_check_choice == "" || kit_ca10_check_choice == "close"):
            { kit_caught:
                Niamh Doherty: You closed that page instead of following its steps, so nothing it wanted ever ran on the machine.
            - else:
                Niamh Doherty: You treated that check as the trap it was, which is all it takes to keep the morning ordinary.
            }
            Niamh Doherty: To whoever built that page, a single followed step is a way onto the machine behind it, and you gave them no step to follow.
        - else:
            Niamh Doherty: Follow a page like that and the machine is gone for the day while it's rebuilt, and no one quite knows what it touched.
            Niamh Doherty: To whoever built that page, one followed step is a foothold that reaches finance and the intranet, or a live caller already on your phone.
        }
        ~ kit_ca10_host_said = true
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
}
+ [Thanks, Niamh.]
    Niamh Doherty: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
