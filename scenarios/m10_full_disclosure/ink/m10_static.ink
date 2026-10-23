INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: ENTROPY Operative 'Static', the power room (group C).
// NPC id static_power. One line, nothing else; no globals. Goes hostile with
// Voltage through #hostile:static_power in m10_voltage.ink's fight.

VAR stat_quiet = false

=== start ===
-> power

=== power ===
{stat_quiet:
    ~ stat_quiet = false
- else:
    // Dialogue R1 m9: after a Restart that followed a fight (hostiles calm), he still sends the player to Voltage, who re-arms them both.
    {voltage_outcome == "fought":
        ENTROPY Operative 'Static': You again. He's not finished with you.
    - else:
        ENTROPY Operative 'Static': Talk to him. From there.
    }
}
+ [Fine.]
    ENTROPY Operative 'Static': Still watching.
    ~ stat_quiet = true
    #exit_conversation
    -> power
