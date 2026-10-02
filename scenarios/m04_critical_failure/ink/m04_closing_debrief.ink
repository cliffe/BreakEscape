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

// PASS 4. Engine-owned globals, read only.
// fix 14: the three operative KOs (the old operatives_defeated counter only ever
// counted Cipher and Relay) and the guard's KO.
VAR operative_cipher_defeated = false
VAR operative_relay_defeated = false
VAR operative_static_defeated = false
VAR security_guard_ko = false
// fix 7: Cipher talked out of the hall. fix 5: how the cards were got.
// fix 21: Voltage's print identified on the bypass module.
VAR cipher_walked = false
VAR vance_card_cloned = false
VAR relay_card_cloned = false
VAR voltage_print_on_bypass = false

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

{player_name()}, report.

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
    Clean. Runaway aborted before a single cell vented. Banks isolated.
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
{security_guard_ko:
    And the gate guard's in A&E with a sore head. He was the one person on site doing his job by the book.
}

{voltage_captured:
    And you've got Voltage.
- else:
    And Voltage got out through the dock.
}

// PLAYTEST ROUND: a player beat, so the outcome and the intelligence aren't one
// fifteen-bubble run before the first choice.
+ [What did we get out of there?]
    -> debrief_intelligence_gathered

=== debrief_voltage_status ===
#speaker:agent_0x99

{voltage_captured:
    Good. Nobody else in that building knows the chain above Blackout.

    He'll talk. Men like him always want to explain themselves.
- else:
    A shame. But the attack's stopped, and that was the job.

    Lives over one operative, every time.
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
    Voltage is in a room now. So far he's given us one thing: his casualty figure.
- else:
    Voltage is gone, so the paper will have to talk.
}
{voltage_print_on_bypass:
    {voltage_captured:
        And his print on that bypass module puts his own hand in the cabinet. That'll stand up in court.
    - else:
        His print's on that bypass module. When someone does find him, it'll be waiting.
    }
}
{cipher_walked:
    Cipher went to look at the night crew and kept walking. Police picked him up on the access road. He's talking.
}

{lore_cross_cell_coordination_found or lore_architect_directive_found:
    The documents show Critical Mass and Social Fabric coordinating the one attack, in their own handwriting.
- else:
    The paper's still in the plant room. Forensics will bag it, but I'd rather you'd read it.
}

{lore_safehouse_address_found:
    And that card from the go-bag. It decodes to Calder Wharf, Social Fabric's regional safehouse. That goes on the board.
}

Keep the crew's fingerprint kit. Forensics can have the case.

// PLAYTEST ROUND: second player beat before the what-failed lesson.
+ [And how did they get in? How did I?]
    -> debrief_what_failed

// ===========================================
// PASS 4 fix 5: what failed (m01 pattern, m01_closing_debrief.ink:149-175).
// The three weaknesses the player used, and the fix for each, in plain lines.
// ===========================================

=== debrief_what_failed ===
#speaker:agent_0x99

Agent HaX: Before you write it up. Three things let them in. Two of them let you in too.
{vance_card_cloned:
    Agent HaX: Vance's door card copied from across his own desk. Old prox hands its number to anything that asks.
- else:
    Agent HaX: Their door cards are old prox. They hand their number to anything that asks. You could have had Vance's from across his desk.
}
{relay_card_cloned:
    Agent HaX: You did it to Relay too, while she was talking.
}
Agent HaX: The HV door took one finger, and that finger was on a panel he touched every two hours. A print names you. It can't prove you're the one standing there.
Agent HaX: And the control room believed its own sensors. The one honest instrument in the place was a dial nobody had wired to anything.
Agent HaX: Encrypted cards. A second factor on the HV door, and a reader that checks for a live finger. A gauge in every hall that isn't on the bus.

* [It goes in the report. Vance will want every line.]
    -> debrief_big_picture

* [The budget let them in as much as the readers did.]
    Agent HaX: Put that in too. It's the line nobody upstairs will want to read.
    -> debrief_big_picture

=== debrief_big_picture ===
#speaker:agent_0x99

None of this was random.

Social Fabric had disinformation ready in three cities, to turn the fire into a panic.

* [The Architect. He's running all of it.]
    -> debrief_architect_revelation

* [How far does this reach?]
    -> debrief_scale_explanation

=== debrief_architect_revelation ===
#speaker:agent_0x99

The same name the Zero Day directive carried. The Architect.

We've just watched one of his strikes run start to finish. Now we know how the cells fit together.

This site was a rehearsal. The real thing is bigger, and it's coming.

-> debrief_task_force_announcement

=== debrief_scale_explanation ===
#speaker:agent_0x99

{voltage_captured:
    Voltage put it at six cities.

    OptiGrid, their cover firm, has contracts at forty sites nationwide. We're auditing every one.
- else:
    The documents name several cities.

    OptiGrid's contracts turn up at dozens of infrastructure sites.
}

We've never seen it run this tight.

-> debrief_task_force_announcement

=== debrief_task_force_announcement ===
#speaker:agent_0x99

// PASS 4 fix 22: Task Force Null, Voltage's interrogation and Calder Wharf are
// open threads; no later mission picks them up yet, so nothing here promises a
// date or a result.
Netherton wants a standing team on The Architect. Hunt the coordination, not the cells.

He's calling it Task Force Null. Your name's on his list.

* [What would Task Force Null do?]
    -> task_force_mission_explanation

* [I'm in. When do we start?]
    -> task_force_accepted

=== task_force_mission_explanation ===
#speaker:agent_0x99

Find whoever sends the directives. Every cell we've hit so far was working from the same ones.

Four missions now, and you're still standing. The last of them nearly didn't go that way.

-> task_force_accepted

=== task_force_accepted ===
#speaker:agent_0x99

~ task_force_null_assigned = true

He'll call when he's ready. Not tonight.

First, one more decision.

{racks_vented:
    {vented_by_trigger:
        Agent HaX: The banks are isolated, but he got to the laptop before you got to him, and Bank B went with it.
    - else:
        Agent HaX: The banks are isolated, but Bank B went before you got to the button.
    }
    Agent HaX: Nine on the night crew in Hall 2. Two more on the feed before the grid caught up.
    Agent HaX: You stopped the rest of it. Hold on to that, because the number you read tomorrow won't be zero.
- else:
    Agent HaX: Eleven people walked out of there tonight. Forty-odd on that feed never knew they were on it.
}


-> disclosure_decision

=== disclosure_decision ===
#speaker:agent_0x99

// Robert Vance present, listening

How do we handle this publicly? Vance needs to hear it too.

* [Full public disclosure. People have a right to know.]
    -> disclosure_full_public

* [Keep it classified. Let them patch it quietly.]
    -> disclosure_quiet

* [Say there was an incident. Keep the details back.]
    -> disclosure_partial

=== disclosure_full_public ===
#speaker:agent_0x99

~ disclosure_choice = "full"

Full transparency. The attack, the holes it came through, ENTROPY. All of it.

{not robert_vance_ko:
    // Robert Vance reacts
    #speaker:robert_vance
    {vance_trust_level >= 70:
        Robert Vance: It'll hurt us. People should still know how close it came.
    - else:
        Robert Vance: There'll be hell to pay for this place. Fair enough.
    }
    #speaker:agent_0x99
}

The public gets the truth and the warning with it. Albion takes the hit, every other storage site gets audited, and someone in Parliament finally answers for the funding.

Netherton will back that.

-> disclosure_outcome

=== disclosure_quiet ===
#speaker:agent_0x99

~ disclosure_choice = "quiet"

We classify it. A maintenance fault, resolved. Albion patches the holes quietly.

{not robert_vance_ko:
    // Robert Vance reacts
    #speaker:robert_vance
    {vance_trust_level >= 70:
        Robert Vance: I'll keep my mouth shut. Doesn't mean I like it. Those people are on our feed.
    - else:
        Robert Vance: Good. One more headline and they'd close us.
    }
    #speaker:agent_0x99
}

Nobody hears how close this came. Albion's name survives, the upgrades happen, and nothing makes the rest of the sector move. Stability, bought with silence.

Netherton won't argue.

-> disclosure_outcome

=== disclosure_partial ===
#speaker:agent_0x99

~ disclosure_choice = "partial"

An incident, acknowledged. No detail.

{not robert_vance_ko:
    // Robert Vance reacts
    #speaker:robert_vance
    {vance_trust_level >= 70:
        Robert Vance: Something, not everything. I can live with that.
    - else:
        Robert Vance: That'll go down well upstairs, I suppose.
    }
    #speaker:agent_0x99
}

People hear something happened, not all of it. Enough to push some change, not enough to start a panic.

Netherton can live with that.

-> disclosure_outcome

=== disclosure_outcome ===
#speaker:agent_0x99

Done.

{disclosure_choice == "full":
    Statement goes out with the local authorities.
}
{disclosure_choice == "quiet":
    It stays classified. Cover story's prepared.
}
{disclosure_choice == "partial":
    A controlled statement goes to the press.
}

{not robert_vance_ko:
    // Robert Vance final words
    #speaker:robert_vance
    {vance_trust_level >= 80:
        Robert Vance: Thank you.

        Robert Vance: I don't know what you are. I know what you did.

        {casualties_occurred:
            Robert Vance: You kept it to one bank. Without you it was the whole hall.
        - else:
            Robert Vance: Nobody in that hall died, and two hundred and forty thousand never lost the lights.
        }
    }
    {vance_trust_level >= 50 and vance_trust_level < 80:
        Robert Vance: You did right by this place.

        Robert Vance: I'll not forget it.
    }
    {vance_trust_level < 50:
        Robert Vance: I don't follow all of it. I know the hall's still standing.
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

Robert Vance: We've run this place on hope and gaffer tape for years.

Robert Vance: That stops on my shift.

-> mission_complete

=== debrief_end_professional ===
#speaker:robert_vance

Robert Vance: I'll have those card readers out by the end of the week.

-> mission_complete

=== debrief_end_ko ===
#speaker:agent_0x99

Noted. It'll be in the report either way.

The methods are a separate conversation. You put a facility manager on the floor of his own office tonight.

-> mission_complete

=== mission_complete ===
#speaker:agent_0x99

~ mission_debriefed = true

Get some rest, {player_name()}.

{voltage_captured:
    Voltage will keep.
- else:
    Voltage is out there. So is The Architect.
}

{
- operative_cipher_defeated and operative_relay_defeated and operative_static_defeated:
    All three of his crew down. Thorough.
- not operative_cipher_defeated and not operative_relay_defeated and not operative_static_defeated:
    And not one of his crew on the floor. Harder than it looks.
}

Sleep. I'll call.

// Task 3.3 completes HERE, at the end of the debrief, so the bond_visualiser
// conclusion screen is raised after the player has actually heard it.
#complete_task:report_to_0x99
#exit_conversation

// Linear cutscene: terminate, do not loop back to `start`.
// Pattern follows m02_closing_debrief.ink:809-811.
-> END
