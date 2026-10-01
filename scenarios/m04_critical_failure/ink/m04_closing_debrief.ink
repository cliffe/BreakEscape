// ===========================================
// CLOSING DEBRIEF - AGENT HaX
// Mission 4: Critical Failure
// Break Escape - Mission Wrap-Up and Task Force Null Revelation
// ===========================================

// Variables for tracking debrief choices
VAR disclosure_choice = ""           // full, quiet, partial
VAR task_force_null_assigned = false // Player assigned to TF Null
VAR mission_debriefed = false        // Debrief completed

// Game state variables
VAR voltage_captured = false
VAR vance_trust_level = 0
VAR operatives_defeated = 0

// Engine-owned; set by the racks_vent timer. Read only.
VAR racks_vented = false
VAR casualties_occurred = false
// PASS 3 P11b: set by the trigger_race timer when Voltage reached the laptop.
VAR vented_by_trigger = false

// PASS 3 P12: set on pickup of the optional intel. Read only.
VAR lore_architect_directive_found = false
VAR lore_cross_cell_coordination_found = false
VAR lore_safehouse_address_found = false

// Engine-owned; set true if the player knocked Robert Vance out. Read only.
// Gates his debrief presence -- a man on the floor of his own operations office
// does not stand and deliver closing remarks.
VAR robert_vance_ko = false

// External variables (set by game)
EXTERNAL player_name()

// ===========================================
// DEBRIEF START
// Location: Control Room (phone/video call)
// Task 3.3: Report Mission Outcome
// ===========================================

=== start ===
// NOTE: #complete_task:report_to_0x99 used to fire HERE, on the first line of
// the debrief. With the other two aim-3 tasks already done that completed the
// mission-conclusion aim and raised the bond_visualiser *over* the debrief
// before the player had read a word of it. It now fires in `mission_complete`,
// the final knot.
-> debrief_start

=== debrief_start ===
#speaker:agent_0x99

// Agent HaX on screen

{player_name()}, report. What's the status?

* {not racks_vented} [Shutdown engaged before the racks went. Banks isolated, hall intact.]
    -> debrief_attack_stopped

* {racks_vented and not vented_by_trigger} [Bank B went before I reached the button. Shutdown held A and C.]
    -> debrief_attack_stopped

* {vented_by_trigger} [He reached the laptop before I reached him. Shutdown held A and C.]
    -> debrief_attack_stopped

* [Voltage is {voltage_captured:in custody.|out through the dock.}]
    -> debrief_voltage_status

=== debrief_attack_stopped ===
#speaker:agent_0x99

{racks_vented:
    Bank B's gone, but you isolated A and C and forced the vents. It could have been the whole hall. It wasn't.
- else:
    Good work. Thermal runaway aborted before a single cell vented, the banks are isolated, systems secured.
}

{vance_trust_level >= 70 and not robert_vance_ko:
    {racks_vented:
        Vance says you kept it to one bank. He still wants that in writing.
    - else:
        Vance says the grid held because of you. He wants that in writing.
    }
}
{robert_vance_ko:
    The facility manager's being treated by medics. He'll live. He won't be filing a commendation.
}

{voltage_captured:
    And you captured Voltage. Excellent.
- else:
    Voltage escaped?
}

-> debrief_intelligence_gathered

=== debrief_voltage_status ===
#speaker:agent_0x99

{voltage_captured:
    Excellent. Voltage is high-value intelligence.

    His interrogation will provide significant insight into The Architect's infrastructure initiative.
- else:
    Unfortunate. But the attack is stopped—that's the priority.

    Lives saved matter more than one operative.
}

-> debrief_intelligence_gathered

=== debrief_intelligence_gathered ===
#speaker:agent_0x99

// PASS 3 review: the "proof" claim needs the paper; the directive itself is
// m03's, so HaX can quote it either way.
{lore_cross_cell_coordination_found or lore_architect_directive_found:
    The intelligence you brought out is the proof we've been chasing since the Zero Day job.
}

The directive said it: Zero Day supplies, Critical Mass executes, grid storage this winter. Tonight was that plan, running.

{voltage_captured:
    Voltage's interrogation has already begun. He's defiant, but he's confirming cross-cell operations.
- else:
    Voltage is gone, so the paper will have to talk.
}

{lore_cross_cell_coordination_found or lore_architect_directive_found:
    The documents show Critical Mass and Social Fabric coordinating the one attack, in their own handwriting.
- else:
    The paper's still in the plant room. Forensics will bag it, but I'd rather you'd read it.
}

{lore_safehouse_address_found:
    And that card from the go-bag. It decodes to Calder Wharf, Social Fabric's regional safehouse. A team's on it.
}

Keep the crew's fingerprint kit. Forensics can have the case.

This wasn't random.

Social Fabric was ready with disinformation campaigns in three cities—they planned to amplify the panic from thermal runaway.

* [The Architect. They're coordinating all of this.]
    -> debrief_architect_revelation

* [How extensive is this coordination?]
    -> debrief_scale_explanation

=== debrief_architect_revelation ===
#speaker:agent_0x99

Yes. The same name the Zero Day directive carried. The Architect.

Now we've watched one of their coordinated strikes run start to finish — we know how the cells fit together, not just that they do.

This facility was a test run.

The Architect is planning something bigger—coordinated infrastructure attacks with synchronised disinformation campaigns.

-> debrief_task_force_announcement

=== debrief_scale_explanation ===
#speaker:agent_0x99

{voltage_captured:
    Voltage mentioned operations in six cities.

    OptiGrid Solutions—their cover company—has contracts at 40 facilities nationwide.

    We're running full security audits now.
- else:
    The documents reference operations in multiple cities.

    OptiGrid Solutions contracts appear at dozens of critical infrastructure sites.
}

This is coordinated at an unprecedented level.

-> debrief_task_force_announcement

=== debrief_task_force_announcement ===
#speaker:agent_0x99

SAFETYNET is forming a special task force dedicated to hunting The Architect and dismantling coordinated ENTROPY operations.

Task Force Null.

You're being assigned.

* [What's Task Force Null's mission?]
    -> task_force_mission_explanation

* [I'm ready. When do we start?]
    -> task_force_accepted

=== task_force_mission_explanation ===
#speaker:agent_0x99

This isn't about stopping individual cells anymore.

We're going after the network. The Architect. The coordination infrastructure.

You've proven yourself across four missions now.

First Contact. Ransomed Trust. Ghost in the Machine. And now this—Critical Failure.

You're ready for this.

-> task_force_accepted

=== task_force_accepted ===
#speaker:agent_0x99

~ task_force_null_assigned = true

Good. Task Force Null briefing is tomorrow at 0600.

Now—there's one more decision to make.

{racks_vented:
    {vented_by_trigger:
        Agent HaX: The banks are isolated, but he got to the laptop before you got to him, and Bank B went with it.
    - else:
        Agent HaX: The banks are isolated, but Bank B went before you got to the button.
    }
    Agent HaX: Nine on the night crew in Hall 2. Two more on the feed before the grid caught up.
    Agent HaX: You stopped the rest of it. I need you to hold on to that, because the number you're going to read tomorrow is not zero.
- else:
    Agent HaX: Eleven people on site tonight walked out of there. Forty-odd on that feed never knew they were on it.
    Agent HaX: That's the whole job. That's what it looks like when it works.
}

Agent HaX: But...

-> disclosure_decision

=== disclosure_decision ===
#speaker:agent_0x99

// Robert Vance present, listening

How do we handle this publicly?

The facility manager needs to know our approach.

* [Full public disclosure. People have a right to know.]
    -> disclosure_full_public

* [Classify the incident. Let the facility patch vulnerabilities quietly.]
    -> disclosure_quiet

* [Acknowledge a security incident without full details. Controlled narrative.]
    -> disclosure_partial

=== disclosure_full_public ===
#speaker:agent_0x99

~ disclosure_choice = "full"

Full transparency. We reveal the attack attempt, facility vulnerabilities, and ENTROPY threat.

{not robert_vance_ko:
    // Robert Vance reacts
    #speaker:robert_vance
    {vance_trust_level >= 70:
        Robert Vance: It'll damage the facility's reputation, but... people have a right to know how close this came.
    - else:
        Robert Vance: The public backlash will be severe. But I understand the reasoning.
    }
    #speaker:agent_0x99
}

The public gets the truth and the warning that goes with it. Albion takes a reputational hit, every other storage site gets audited, and someone in Parliament finally has to answer for the funding. It forces the change the sector's been dodging.

Approved.

-> disclosure_outcome

=== disclosure_quiet ===
#speaker:agent_0x99

~ disclosure_choice = "quiet"

We classify the incident. Frame it as a "maintenance issue" that was resolved.

Facility patches vulnerabilities quietly.

{not robert_vance_ko:
    // Robert Vance reacts
    #speaker:robert_vance
    {vance_trust_level >= 70:
        Robert Vance: I understand the reasoning, but... is it right to hide this from the people we serve?
    - else:
        Robert Vance: Thank you. The facility can't afford the reputational damage right now.
    }
    #speaker:agent_0x99
}

The public never hears how close this came. Albion's reputation survives, the upgrades happen quietly, and nothing forces the wider sector to move. Stability, bought with silence.

Approved.

-> disclosure_outcome

=== disclosure_partial ===
#speaker:agent_0x99

~ disclosure_choice = "partial"

Acknowledge a "security incident" without full details. Controlled narrative.

{not robert_vance_ko:
    // Robert Vance reacts
    #speaker:robert_vance
    {vance_trust_level >= 70:
        Robert Vance: A middle ground. People know something happened without full panic. I can work with that.
    - else:
        Robert Vance: Probably the most politically viable option.
    }
    #speaker:agent_0x99
}

People are told an incident happened, not the whole of it. Enough awareness to push some improvement, not enough to start a panic. A controlled middle.

Approved.

-> disclosure_outcome

=== disclosure_outcome ===
#speaker:agent_0x99

Decision recorded.

{disclosure_choice == "full":
    Public statement will be coordinated with local authorities.
}
{disclosure_choice == "quiet":
    Incident remains classified. Cover story prepared.
}
{disclosure_choice == "partial":
    Controlled statement will be prepared for media.
}

{not robert_vance_ko:
    // Robert Vance final words
    #speaker:robert_vance
    {vance_trust_level >= 80:
        Robert Vance: Thank you.

        Robert Vance: I don't know your real name, but... thank you.

        {casualties_occurred:
            Robert Vance: You kept it to one bank. Without you it was the whole hall.
        - else:
            Robert Vance: You saved this facility. You kept 240,000 people on supply, and nobody in that hall died.
        }
    }
    {vance_trust_level >= 50 and vance_trust_level < 80:
        Robert Vance: You did good work here.

        Robert Vance: This facility won't forget it.
    }
    {vance_trust_level < 50:
        Robert Vance: I appreciate what you did, even if I don't fully understand it.
    }
}

#speaker:agent_0x99

* {not robert_vance_ko} [It was an honour working with you, Mr Vance.]
    -> debrief_end_respectful

* {not robert_vance_ko} [Just doing my job.]
    -> debrief_end_professional

* {robert_vance_ko} [Make sure Vance gets the full credit when he comes round.]
    -> debrief_end_ko

* {robert_vance_ko} [Just doing my job.]
    -> debrief_end_ko

=== debrief_end_respectful ===
#speaker:robert_vance

Robert Vance: This facility's been operating on hope and duct tape for too long.

Robert Vance: That changes now. I'll make sure of it.

-> mission_complete

=== debrief_end_professional ===
#speaker:robert_vance

Robert Vance: I'll begin implementing security overhauls immediately.

-> mission_complete

=== debrief_end_ko ===
#speaker:agent_0x99

Noted. It'll be in the report either way.

The methods are a separate conversation. You put a facility manager on the floor of his own operations office tonight.

-> mission_complete

=== mission_complete ===
#speaker:agent_0x99

~ mission_debriefed = true

Get some rest, {player_name()}.

Task Force Null briefing tomorrow at 0600.

{voltage_captured:
    Voltage's interrogation will provide actionable intelligence.
- else:
    We'll find Voltage. And The Architect.
}

{operatives_defeated >= 3:
    You neutralised all their operatives. Textbook operation.
}
{operatives_defeated == 2:
    Two operatives down. Clean work.
}

This is just the beginning.

// Task 3.3 completes HERE, at the end of the debrief, so the bond_visualiser
// conclusion screen is raised after the player has actually heard it.
#complete_task:report_to_0x99
#exit_conversation

// Linear cutscene: terminate, do not loop back to `start`.
// Pattern follows m02_closing_debrief.ink:809-811.
-> END
