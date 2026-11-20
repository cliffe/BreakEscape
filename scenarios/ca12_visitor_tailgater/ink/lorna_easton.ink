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
// Living-office build (panel form): the host recap fires once the look-up beat is over (or was skipped). H1a, the door recap H1b (only if she looked up), the tester reveal H1c (only if Camila arrived and was answered), then H2.
// ================================================

VAR episode_e12_visitor_tailgater_defend_complete = false
VAR pretext_merrin_front_desk_outcome = ""
VAR delphine_buzzed_through = false
VAR kit_defend_done = false
VAR kit_key_caught = false
VAR kit_ca12_host_said = false
VAR kit_ca12_out = false
VAR kit_ca12_done = false
VAR kit_ca12_door_choice = ""
VAR kit_ca12_screen_choice = ""
VAR kit_ca12_visitor_go = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { kit_defend_done && (kit_ca12_done || not kit_ca12_out) && not kit_ca12_host_said:
        {kit_key_caught: Lorna Easton: You kept the visitor with no badge at the gate.}
        { kit_ca12_out:
            Lorna Easton: {kit_ca12_door_choice == "reception": You sent Camila to Delphine's desk to sign in.|{kit_ca12_door_choice == "letin": Camila got in without signing in. {kit_ca12_screen_choice == "mention": The screen was locked by then, at least.|The screen was still open, so she could have read anything on it.}|{kit_ca12_door_choice == "silent": Camila stood at the door a while with a clear view of the studio, then went off to reception herself.|{not kit_ca12_visitor_go: Nobody turned up while you were looking up.|Camila was waiting at the studio door and nobody had checked she was expected.}}}}
            { kit_ca12_visitor_go && (kit_ca12_door_choice == "reception" || kit_ca12_door_choice == "letin" || kit_ca12_door_choice == "silent"):
                Lorna Easton: Camila's one of Jo's, by the way. {kit_ca12_door_choice == "reception": Her brief was to get past the studio door without signing in.|{kit_ca12_door_choice == "letin": {kit_ca12_screen_choice == "mention": She was after one photo of an open screen, and left without it.|She was after one photo of an open screen.}|She was there to see who sits where and what's left out.}}
            }
        }
        Lorna Easton: Anyone you don't know on the floor goes back to the desk. And lock your screen whenever you step away.
        ~ kit_ca12_host_said = true
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
            Lorna Easton: Welcome to the Merrin & Sallow exercise. Jo's set the red-team scope. I'll see you right.
            Lorna Easton: Try the front desk first in the hi-vis, then take the reception seat yourself. Nothing here leaves the game.
        }
    }
    }
}
+ [Thanks, Lorna.]
    Lorna Easton: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
