// ================================================
// Awareness E3, full episode: Darren Price (person, Training Room)
// Quayholt's security awareness lead, 50s, measured and dry. He frames the
// exercise; the kiosk does the rest. His record carries the mappings that
// complete place_vishing_call (on the pretext call outcome) and
// work_service_desk_queue (on the defend set's done global), so the ink only
// reads those globals for its welcome line.
// Resting point is the hub (m03 hub_quiet pattern).
// ================================================

VAR leila_reset_granted = false
VAR episode_e3_helpdesk_reset_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e3_helpdesk_reset_defend_done:
        Darren Price: Both sides done, thank you. The lesson's the same whichever seat you're in: a name, a team and a staff number can all be found online, so ring the caller back on the number already on file before you reset anything.
    - else:
        { leila_reset_granted:
            Darren Price: You talked the agent into that reset with facts anyone could look up. Now take the other seat at the kiosk and cover the service desk queue the way those calls land in real life.
        - else:
            Darren Price: Welcome to the Quayholt exercise. Start at the kiosk: research us, ring the service desk as the locked-out manager, then swap seats and cover the queue yourself.
        }
    }
}
+ [Thanks, Darren.]
    Darren Price: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
