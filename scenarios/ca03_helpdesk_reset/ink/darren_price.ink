// ================================================
// Awareness E3, full episode: Darren Price (person, Training Room)
// Quayholt's service desk team lead, 50s, measured and dry. He frames the
// exercise; the kiosk does the rest. His record carries the mappings that
// complete place_vishing_call (on the pretext call outcome) and
// work_service_desk_queue (on the defend set's done global), so the ink only
// reads those globals for its welcome line.
// Resting point is the hub (m03 hub_quiet pattern).
// ================================================

VAR pretext_quayholt_helpdesk_reset_outcome = ""
VAR episode_e3_helpdesk_reset_defend_complete = false
VAR kit_defend_done = false
VAR kit_caught = false
VAR kit_key_caught = false
VAR kit_ca03_host_said = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { kit_defend_done && not kit_ca03_host_said:
        { kit_key_caught:
            { kit_caught:
                Darren Price: You stopped a prompt nobody started from turning into an approval, so the account stayed shut.
            - else:
                Darren Price: You turned away the prompt that mattered, so the account held. One or two others slipped by, and the debrief walks you through them.
            }
            Darren Price: A prompt you didn't start is one to report, not approve. Number matching stops a careless tap cold.
        - else:
            Darren Price: That approval went through, so the attacker was inside a claims account, reading records and setting mailbox rules to stay hidden.
            Darren Price: A prompt you didn't start is one to report, not approve. Number matching stops a careless tap cold.
        }
        ~ kit_ca03_host_said = true
    - else:
    { episode_e3_helpdesk_reset_defend_complete:
        Darren Price: That's the desk covered from both seats, thanks.
        Darren Price: A name, a team, a staff number, anyone can find those online. None of them prove who's calling. A callback on the number we already hold does.
    - else:
        { pretext_quayholt_helpdesk_reset_outcome != "":
            Darren Price: Your call to the service desk has gone through. Now take the other seat at the kiosk and cover the queue the way those calls land in real life.
        - else:
            Darren Price: Welcome to the Quayholt exercise. Start at the kiosk: research us, ring the service desk as the locked-out manager, then swap seats and cover the queue yourself.
        }
    }
    }
}
+ [Thanks, Darren.]
    Darren Price: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
