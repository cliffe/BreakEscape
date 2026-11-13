// ================================================
// Awareness E12, full episode: Lorna Easton (person, Training Room / studio kiosk)
// Merrin & Sallow's Reception & Facilities Lead, 40s, white, north-west England.
// She welcomes the learner to the visitor exercise at the kiosk; the kiosk and the
// lobby do the rest. Jo Fairweather (Northlight Security) sets the red-team scope in
// the seeded brief, not here. Lorna's record carries the mappings that complete
// run_front_desk_pretext (on the pretext outcome) and work_reception_desk (on the
// defend set's done global). The ink reads the pretext outcome and the done global
// only to pick its welcome line. Resting point is the hub (m03 hub_quiet pattern):
// the goodbye parks there quietly, and a re-talk re-enters and says the line that fits.
// The lobby pretext and the door-opening are Delphine's ink (delphine_reception.ink).
// Placeholder sprite (female_office_worker_v2) until the PixelLab reset.
// ================================================

VAR episode_e12_visitor_tailgater_defend_complete = false
VAR pretext_merrin_front_desk_outcome = ""
VAR delphine_buzzed_through = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e12_visitor_tailgater_defend_complete:
        Lorna Easton: That's the desk done. A front of house that signs people in and walks them up stops nearly all of this.
        Lorna Easton: Nobody's in trouble for slowing a pushy visitor down.
    - else:
        { pretext_merrin_front_desk_outcome != "":
            { delphine_buzzed_through:
                Lorna Easton: You talked your way through that door just now. Here you're the one being asked, same visitors.
            - else:
                Lorna Easton: She held that door on you just now. Here you're the one being asked, same visitors.
            }
            Lorna Easton: Sign people in, walk them up, and if someone won't be checked, that's your answer.
        - else:
            Lorna Easton: Welcome to the Merrin & Sallow exercise. Jo's set the red-team scope; I'll see you right.
            Lorna Easton: Try the front desk first in the hi-vis, then take the reception seat yourself. Nothing here leaves the game.
        }
    }
}
+ [Thanks, Lorna.]
    Lorna Easton: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
