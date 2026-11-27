// ===========================================
// Mission 5: Torres Confrontation - Act 3
// Critical Choice with 5 Ending Paths
// ===========================================

// Choice tracking
VAR final_choice = ""  // "turn_double_agent", "arrest", "combat_nonlethal", "combat_lethal", "public_exposure"
VAR torres_turned = false
VAR torres_arrested = false
VAR torres_killed = false
VAR elena_treatment_funded = false
VAR entropy_program_exposed = false

// External variables
EXTERNAL player_name
EXTERNAL evidence_level
EXTERNAL found_medical_bills
EXTERNAL found_torres_journal
EXTERNAL found_briefcase_comms
EXTERNAL flag4_submitted  // Architect communications

// ===========================================
// CONFRONTATION START (Evidence Gated)
// ===========================================

=== start ===
#speaker:narrator

{evidence_level >= 4:
    -> confrontation_scene
- else:
    You need more evidence before confronting Torres.

    {not flag4_submitted:
        Exploit the Bludit server to find The Architect's communications.
    }
    {not found_medical_bills:
        Search Torres' office for personal evidence.
    }

    #exit_conversation
    -> END
}

=== confrontation_scene ===
#speaker:narrator

[Friday night, 11:47 PM. Server room.]

You find David Torres alone at a terminal, USB drive connected, progress bar at 94%.

The final exfiltration. Project Heisenberg's last 27%.

#speaker:david_torres
#display:torres-stressed

Torres: *doesn't turn around*

Torres: I know you're there. Patricia sent you, didn't she?

Torres: Security consultant. More like SAFETYNET agent.

+ [Step away from the terminal, David]
    You: It's over. Step away from the computer.
    Torres: *turns slowly* Is it?
    -> torres_confrontation

+ [I know everything. The Bludit server. The Recruiter. ENTROPY]
    You: I've seen the communications. The payment records. All of it.
    Torres: *laughs bitterly* Then you know more than I did when I started.
    -> torres_confrontation

// ===========================================
// MAIN CONFRONTATION DIALOGUE
// ===========================================

=== torres_confrontation ===
#speaker:david_torres
#display:torres-defensive

Torres: Let me guess. You found the medical bills. Elena's diagnosis.

Torres: *removes glasses, rubs eyes* Stage 3 cancer. $380,000 in debt.

{found_torres_journal:
    Torres: Did you read my journal too? See me lie to myself for three months?
}

+ [ENTROPY manipulated you. You didn't know what you were doing]
    You: They lied. Told you it was for journalists, right?
    -> torres_knows_truth

+ [You knew exactly what you were doing]
    You: The Architect's communications were explicit. Foreign sales. Casualties.
    -> torres_knows_truth

=== torres_knows_truth ===
#speaker:david_torres
#display:torres-breaking

{flag4_submitted:
    Torres: *bitter laugh* "Investigative journalists exposing military corruption."
    Torres: That's what the Recruiter said. For about two weeks.

    Torres: Then they showed me the casualty projections.
}

Torres: I've known for two months. Chinese MSS. Russian GRU. $68 million.

Torres: Twelve to forty intelligence officers dead within 90 days.

+ [Then why did you keep going?]
    You: You KNEW people would die. Why?
    -> torres_rationalization

+ [You're a terrorist]
    You: You're no different from ENTROPY's other radicals.
    Torres: *defensive* I'm not—
    -> torres_rationalization

=== torres_rationalization ===
#speaker:david_torres
#display:torres-conflicted

Torres: *defensive* Because the system is corrupt! The military-industrial complex profits from endless war—

Torres: *voice cracking* Because Elena was dying and I had no choice—

Torres: *hands shaking* Because twelve to forty people is... is...

Torres: *quietly* Is twelve to forty families. Like Elena. Like Sofia and Miguel.

{found_torres_journal:
    Torres: You read my journal. You saw the cognitive dissonance.
    Torres: "System must collapse for greater good."
    Torres: "Collateral damage is necessary for change."
    Torres: *voice breaking* I was lying to myself.
}

-> evidence_revelation

=== evidence_revelation ===
#speaker:david_torres

Torres: What did I become?

Torres: Three months ago I was trying to save my wife. Now I'm...

Torres: *looks at terminal, 97% complete*

Torres: I'm about to get people killed.

#speaker:narrator

This is it. The choice.

-> final_choice_moment

// ===========================================
// CRITICAL CHOICE - 5 PATHS
// ===========================================

=== final_choice_moment ===
#speaker:narrator

What do you do?

+ [You're not too far gone. Help us, and we'll help Elena]
    #complete_task:confront_torres
    ~ final_choice = "turn_double_agent"
    -> turn_double_agent_path

+ [You're under arrest for espionage and treason]
    #complete_task:confront_torres
    ~ final_choice = "arrest"
    -> arrest_path

+ [Drop the philosophy. Fight or surrender. Your choice]
    #complete_task:confront_torres
    -> combat_offer

+ [I'm exposing everything. ENTROPY's program, your crimes, all of it]
    #complete_task:confront_torres
    ~ final_choice = "public_exposure"
    -> public_exposure_path

// ===========================================
// PATH 1: TURN DOUBLE AGENT (S-Rank)
// ===========================================

=== turn_double_agent_path ===
#speaker:david_torres
#display:torres-hopeful

You: You've been radicalized for three months. Not three years.

You: You still have cognitive dissonance. You're not fully committed to their ideology.

You: That means you can come back.

Torres: *looks up* Come back how?

+ [Work for us. Feed ENTROPY false data. Map their network]
    You: Witness protection. New identity. And Elena gets treatment.
    -> torres_deal_offered

=== torres_deal_offered ===
#speaker:david_torres

Torres: Elena's treatment? Full coverage?

You: Witness protection program. Experimental treatment included.

{flag4_submitted:
    You: I found the target database. 47 other people ENTROPY's evaluating.
    You: People like you. Desperate. Vulnerable. About to be radicalized.
    Torres: *horror* Forty-seven more?
}

Torres: What do you need from me?

+ [Everything. The Recruiter's identity, comm protocols, payment chains]
    You: And you keep meeting them. Pass false data. Lead us to their network.
    -> torres_accepts_turn

=== torres_accepts_turn ===
#speaker:david_torres
#display:torres-determined

Torres: *nods slowly* Okay. Okay, I'll do it.

Torres: I'll help you save the other 47. The ones who haven't... who aren't monsters yet.

Torres: And Elena?

You: Treatment starts next week. SAFETYNET will handle everything.

~ torres_turned = true
~ elena_treatment_funded = true
#complete_task:make_critical_choice

Torres: *closes eyes* Thank you. Thank god.

-> stop_upload

// ===========================================
// PATH 2: ARREST (Standard Justice)
// ===========================================

=== arrest_path ===
#speaker:david_torres
#display:torres-resigned

You: David Torres, you're under arrest for espionage, theft of classified materials, and conspiracy.

Torres: *quiet* I know.

Torres: Do I get a lawyer?

+ [Yes. You have rights]
    You: Federal custody. You'll be processed, arraigned. Standard procedure.
    Torres: What about Elena? The kids?
    -> arrest_family_question

+ [You'll get due process]
    Torres: That's not an answer.
    -> arrest_family_question

=== arrest_family_question ===
#speaker:david_torres

Torres: Elena's treatment. The $380,000. If I'm in prison...

Torres: She dies. Sofia and Miguel watch their mother die.

+ [SAFETYNET might fund treatment as part of a cooperation deal]
    You: If you provide full intelligence on ENTROPY. Names, locations, protocols.
    Torres: *nods* I'll cooperate. Fully. Whatever you need.
    ~ elena_treatment_funded = true
    -> arrest_cooperation

+ [That's not my jurisdiction]
    You: I'm an agent, not a social worker.
    Torres: *bitter* Of course.
    -> arrest_no_cooperation

=== arrest_cooperation ===
#speaker:david_torres

Torres: I'll tell you everything about the Insider Threat Initiative.

Torres: The Recruiter. The 23 other placements. The 47 targets.

Torres: Just... please. Elena.

~ torres_arrested = true
~ final_choice = "arrest"
#complete_task:make_critical_choice

You: Stop the upload first. Then we'll debrief.

-> stop_upload

=== arrest_no_cooperation ===
#speaker:david_torres

Torres: Then I want my lawyer. Now.

Torres: I'm not saying anything else.

~ torres_arrested = true
~ final_choice = "arrest"
#complete_task:make_critical_choice

You: Fine. But that upload stops. Now.

-> stop_upload

// ===========================================
// PATH 3: COMBAT (Lethal or Non-Lethal)
// ===========================================

=== combat_offer ===
#speaker:david_torres
#display:torres-hostile
#hostile:david_torres

You: No more talk. No more philosophy.

You: Hands up, or I will use force.

Torres: *backs toward terminal*

Torres: You're not taking me. Elena needs me.

Torres: *reaches for something in his jacket*

+ [Subdue him non-lethally]
    ~ final_choice = "combat_nonlethal"
    -> combat_nonlethal_path

+ [Lethal force authorized - neutralize the threat]
    ~ final_choice = "combat_lethal"
    -> combat_lethal_path

// ===========================================
// PATH 3A: COMBAT - NON-LETHAL
// ===========================================

=== combat_nonlethal_path ===
#speaker:narrator

You move fast. Taser deployed. 50,000 volts.

Torres drops. Convulsing. Not armed - just reaching for his phone.

He wanted to call Elena one last time.

#speaker:david_torres
#display:torres-defeated

Torres: *gasping* Elena... the kids...

Torres: *coughs* Tell them I'm sorry.

You: You'll tell them yourself. After you serve your sentence.

~ torres_arrested = true
~ final_choice = "combat_nonlethal"
#complete_task:make_critical_choice

-> stop_upload

// ===========================================
// PATH 3B: COMBAT - LETHAL
// ===========================================

=== combat_lethal_path ===
#speaker:narrator

Weapon drawn. Center mass. Two shots.

Torres falls. Phone clatters to the floor. Elena's contact photo visible.

He was calling his wife.

#speaker:david_torres
#display:torres-dying

Torres: *choking* Elena...

Torres: Sofia... Miguel... I'm sorry...

Torres: *dies*

#speaker:narrator

David Torres. Age 38. Father of two. Husband to a dying woman.

Radicalized by ENTROPY for three months. Not long enough to become a monster.

But long enough to die like one.

~ torres_killed = true
~ final_choice = "combat_lethal"
#complete_task:make_critical_choice

-> stop_upload

// ===========================================
// PATH 4: PUBLIC EXPOSURE (Nuclear Option)
// ===========================================

=== public_exposure_path ===
#speaker:david_torres
#display:torres-horrified

You: I'm not arresting you, David.

You: I'm exposing ENTROPY's entire Insider Threat Initiative.

You: Your case. The 23 other placements. The 47 targets. All of it.

You: Every major news outlet. WikiLeaks. The whole playbook.

Torres: *shocked* You'll destroy everyone. The other targets—

You: They'll be warned. ENTROPY's program will be burned.

Torres: And me? My family?

+ [You'll be a public traitor. There's no protecting you]
    You: Elena will read about your espionage in the news.
    You: Sofia and Miguel will see their father's face on TV.
    Torres: *stricken* You can't—
    -> public_exposure_consequence

=== public_exposure_consequence ===
#speaker:david_torres

Torres: My children. They're eight and eleven.

Torres: This will follow them their entire lives.

You: You should have thought of that before committing espionage.

~ entropy_program_exposed = true
~ torres_arrested = true  // Will be arrested after exposure
~ final_choice = "public_exposure"
#complete_task:make_critical_choice

Torres: *quietly* I did this to save them. And you're going to destroy them anyway.

-> stop_upload

// ===========================================
// STOP UPLOAD SEQUENCE (All Paths)
// ===========================================

=== stop_upload ===
#speaker:narrator

{torres_killed:
    You cancel the upload manually. 97% complete. 3% remains secure.

    David Torres will never see his family again.

    Elena will bury her husband while fighting cancer.

    Sofia and Miguel are orphans-in-waiting.
- else:
    {torres_turned or torres_arrested:
        Torres: *types command*
        Torres: Upload cancelled. 97% complete. Last 3% stays here.
    }
    {not torres_turned and not torres_arrested:
        You force Torres away from the terminal.
        You: Cancel it. Now.
        Torres: *complies* Done.
    }
}

#complete_task:stop_final_exfiltration

{torres_turned:
    #speaker:david_torres
    Torres: What happens now?
    You: Debrief. Witness protection processing. Elena gets moved to a secure facility for treatment.
    Torres: And the 47 others?
    You: We save as many as we can.
}

{torres_arrested:
    #speaker:david_torres
    Torres: Federal prison. How long?
    You: 15 to 25 years for espionage. Maybe less with cooperation.
    {elena_treatment_funded:
        Torres: But Elena gets treatment?
        You: SAFETYNET will honor the deal.
    - else:
        Torres: Elena will be dead before I get out.
    }
}

{torres_killed:
    [Mission complete. One casualty. Collateral damage.]
}

{entropy_program_exposed:
    #speaker:david_torres
    Torres: When does it go public?
    You: 48 hours. Gives SAFETYNET time to warn the 47 targets.
    Torres: And then my face is everywhere.
}

#speaker:narrator

Mission complete. ENTROPY's operation stopped.

The cost?

That depends on the choice you made.

#exit_conversation
-> END
